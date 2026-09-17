import { NextResponse } from "next/server";
import crypto from "crypto";

// Runtime configuration
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Meta Webhook Signature Verification (HMAC SHA-256)
 * Checks the 'x-hub-signature-256' header against the raw payload body.
 */
function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!appSecret) {
    console.warn("⚠️ [Meta Webhook] META_APP_SECRET is not set. Signature check skipped.");
    return true;
  }

  if (!signatureHeader) {
    console.error("❌ [Meta Webhook] Missing X-Hub-Signature-256 header.");
    return false;
  }

  const [algorithm, signature] = signatureHeader.split("=");
  if (algorithm !== "sha256" || !signature) {
    console.error("❌ [Meta Webhook] Invalid signature format:", signatureHeader);
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", appSecret)
      .update(rawBody, "utf8")
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    console.error("❌ [Meta Webhook] Error during signature verification:", err);
    return false;
  }
}

/**
 * Helper to parse normalized message events from Facebook Messenger, Instagram DM, and WhatsApp
 */
function parseMetaEvents(body) {
  const events = [];
  const objectType = body?.object; // "page" | "instagram" | "whatsapp_business_account"

  // 1. Messenger & Instagram Messaging Structure: entry[].messaging[]
  if (Array.isArray(body?.entry)) {
    for (const entry of body.entry) {
      const entryId = entry?.id;

      // Facebook Messenger / Instagram DM format
      if (Array.isArray(entry?.messaging)) {
        for (const messagingItem of entry.messaging) {
          const senderId = messagingItem?.sender?.id;
          const recipientId = messagingItem?.recipient?.id;
          const timestamp = messagingItem?.timestamp;

          let platform = "unknown";
          if (objectType === "instagram") {
            platform = "instagram";
          } else if (objectType === "page") {
            platform = "messenger";
          } else {
            // Heuristic detection if object is generic
            platform = senderId?.length > 16 ? "messenger" : "instagram";
          }

          // Case A: Regular message
          if (messagingItem?.message) {
            const msg = messagingItem.message;
            let text = msg.text || "";
            let type = "text";

            if (msg.attachments && msg.attachments.length > 0) {
              type = msg.attachments[0]?.type || "attachment";
              if (!text) {
                text = `[${type.toUpperCase()}] ${msg.attachments[0]?.payload?.url || ""}`.trim();
              }
            } else if (msg.quick_reply) {
              type = "quick_reply";
              text = msg.quick_reply.payload || msg.text;
            }

            events.push({
              platform,
              eventType: "message",
              messageId: msg.mid,
              senderId,
              recipientId,
              timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
              text,
              type,
              raw: messagingItem,
            });
          }
          // Case B: Postback (e.g. "Get Started" button or persistent menu)
          else if (messagingItem?.postback) {
            events.push({
              platform,
              eventType: "postback",
              senderId,
              recipientId,
              timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
              text: messagingItem.postback.title || messagingItem.postback.payload || "",
              payload: messagingItem.postback.payload,
              raw: messagingItem,
            });
          }
          // Case C: Read / Delivery / Reaction receipts
          else if (messagingItem?.read || messagingItem?.delivery || messagingItem?.reaction) {
            events.push({
              platform,
              eventType: messagingItem.read ? "read" : messagingItem.delivery ? "delivery" : "reaction",
              senderId,
              recipientId,
              timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
              raw: messagingItem,
            });
          }
        }
      }

      // 2. WhatsApp Business Cloud API format: entry[].changes[].value.messages[]
      if (Array.isArray(entry?.changes)) {
        for (const change of entry.changes) {
          if (change.field === "messages" && change.value) {
            const value = change.value;
            const messages = value.messages || [];
            const contacts = value.contacts || [];
            const contactMap = new Map(contacts.map((c) => [c.wa_id, c.profile?.name]));
            const phoneNumberId = value.metadata?.phone_number_id;

            for (const msg of messages) {
              const senderId = msg.from;
              const senderName = contactMap.get(senderId) || null;
              let text = "";
              const type = msg.type || "unknown";

              if (type === "text") {
                text = msg.text?.body || "";
              } else if (type === "image" || type === "video" || type === "audio" || type === "document") {
                text = msg[type]?.caption || `[${type.toUpperCase()}]`;
              } else if (type === "button") {
                text = msg.button?.text || msg.button?.payload || "";
              } else if (type === "interactive") {
                text = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "";
              }

              events.push({
                platform: "whatsapp",
                eventType: "message",
                messageId: msg.id,
                senderId,
                senderName,
                recipientId: phoneNumberId,
                timestamp: msg.timestamp
                  ? new Date(Number(msg.timestamp) * 1000).toISOString()
                  : new Date().toISOString(),
                text,
                type,
                raw: msg,
              });
            }
          }
        }
      }
    }
  }

  return events;
}

/**
 * GET Handler - Webhook Verification
 * Meta sends GET requests with hub.mode, hub.verify_token, and hub.challenge
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const expectedToken = process.env.META_VERIFY_TOKEN;

    if (!expectedToken) {
      console.error("❌ [Meta Webhook] META_VERIFY_TOKEN environment variable is not defined.");
      return new Response("Webhook verification token not configured on server", { status: 500 });
    }

    // Check if mode and token match
    if (mode === "subscribe" && token === expectedToken) {
      console.log("✅ [Meta Webhook] Webhook successfully verified by Meta!");
      // Must return hub.challenge as plain text with 200 OK
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    console.warn("⚠️ [Meta Webhook] Verification failed. Invalid verify token or mode.", {
      receivedMode: mode,
      receivedToken: token ? "***" : null,
    });
    return new Response("Forbidden: Invalid verification token", { status: 403 });
  } catch (error) {
    console.error("❌ [Meta Webhook] Error in GET verification:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * POST Handler - Incoming Webhook Events
 * Receives messages, postbacks, receipts from Messenger, Instagram, WhatsApp
 */
export async function POST(req) {
  try {
    // 1. Read raw body text for signature validation
    const rawBody = await req.text();

    // 2. Validate HMAC SHA-256 signature
    const signatureHeader = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_APP_SECRET;

    const isValid = verifyMetaSignature(rawBody, signatureHeader, appSecret);
    if (!isValid) {
      console.error("❌ [Meta Webhook] Signature verification failed. Unauthorized request.");
      return new Response("Forbidden: Invalid signature", { status: 403 });
    }

    // 3. Parse JSON payload
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("❌ [Meta Webhook] Failed to parse JSON body");
      return new Response("Bad Request: Invalid JSON", { status: 400 });
    }

    // 4. Parse incoming events (Messenger, Instagram, WhatsApp)
    const events = parseMetaEvents(body);

    if (events.length > 0) {
      console.log(`\n📬 [Meta Webhook] Received ${events.length} event(s):`);
      for (const ev of events) {
        console.log("--------------------------------------------------");
        console.log(`📱 Platform:    ${ev.platform.toUpperCase()}`);
        console.log(`🎯 Event Type:  ${ev.eventType}`);
        console.log(`👤 Sender ID:   ${ev.senderId}${ev.senderName ? ` (${ev.senderName})` : ""}`);
        console.log(`🏢 Recipient:   ${ev.recipientId}`);
        console.log(`⏰ Time:        ${ev.timestamp}`);
        if (ev.text !== undefined) {
          console.log(`💬 Message:     "${ev.text}"`);
        }
        if (ev.messageId) {
          console.log(`🆔 Message ID:  ${ev.messageId}`);
        }
        console.log("--------------------------------------------------");
      }
    } else {
      console.log("ℹ️ [Meta Webhook] Received non-messaging webhook event (status/change update):", JSON.stringify(body));
    }

    // 5. Meta requires a fast 200 OK response (within a few seconds)
    return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
  } catch (error) {
    console.error("❌ [Meta Webhook] Error processing POST webhook:", error);
    // Even on error, Meta may retry repeatedly if 500 is returned, but 500 is appropriate for unhandled exceptions
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
