"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, doc, getDocs, limit, limitToLast, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { adminFetch } from "../lib/apiClient";
import { listAllBookingsAdmin } from "../lib/bookingsFirestore";
import { STATUS_CONFIG } from "../lib/bookingModel";
import {
  GRAPH_API_VERSION,
  REPLY_WINDOW_MS,
  WHATSAPP_APP_ID,
  WHATSAPP_CONVERSATIONS,
  WHATSAPP_SIGNUP_CONFIG_ID,
} from "../lib/whatsappConfig";

// WhatsApp chats mirrored from the business phone (coexistence): customer
// messages, replies sent from the phone, and the imported history. Replies
// written here go out through the Cloud API and show up on the phone too.

const STATUS_TICKS = { sent: "✓", delivered: "✓✓", read: "✓✓", failed: "⚠" };
const SOURCE_LABELS = { site: "საიტიდან", phone: "ტელეფონიდან" };

// Bookings store phones as typed ("+995 555…", "555…"); the last 9 digits
// identify a Georgian or most foreign mobile numbers well enough to match.
const phoneKey = (value) => String(value || "").replace(/\D/g, "").slice(-9);

const formatTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ka-GE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

const tourName = (title) => (title && typeof title === "object" ? title.ka || title.en || "" : title || "");

// The Facebook SDK must be loaded before the click: FB.login opens a popup,
// and browsers only allow that directly inside the click handler.
let sdkPromise = null;
function loadFacebookSdk() {
  if (window.FB) return Promise.resolve(window.FB);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      window.fbAsyncInit = () => {
        window.FB.init({ appId: WHATSAPP_APP_ID, autoLogAppEvents: true, xfbml: false, version: GRAPH_API_VERSION });
        resolve(window.FB);
      };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        sdkPromise = null;
        reject(new Error("Facebook SDK ვერ ჩაიტვირთა."));
      };
      document.body.appendChild(script);
    });
  }
  return sdkPromise;
}

export default function WhatsAppManager() {
  const [status, setStatus] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState({});
  const [bookingsByPhone, setBookingsByPhone] = useState({});
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const threadEnd = useRef(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 8000);
  };

  const loadStatus = async () => {
    try {
      const res = await adminFetch("/api/admin/whatsapp");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (err) {
      setStatus({ connected: false, env: null, loadError: err.message });
    }
  };

  useEffect(() => {
    loadStatus();
    getDocs(collection(db, "whatsapp_contacts"))
      .then((snap) => setContacts(Object.fromEntries(snap.docs.map((d) => [d.id, d.data().name]))))
      .catch(() => {});
    listAllBookingsAdmin().then((list) => {
      const map = {};
      for (const b of list) {
        const key = phoneKey(b.customer?.phone || b.customer?.whatsapp);
        if (key) (map[key] ||= []).push(b);
      }
      setBookingsByPhone(map);
    });
    const q = query(collection(db, WHATSAPP_CONVERSATIONS), orderBy("lastMessageAt", "desc"), limit(300));
    return onSnapshot(
      q,
      (snap) => setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.warn("WhatsApp conversations listener stopped:", err?.code || err)
    );
  }, []);

  useEffect(() => {
    if (!status || status.connected || !WHATSAPP_SIGNUP_CONFIG_ID) return;
    loadFacebookSdk()
      .then(() => setSdkReady(true))
      .catch((err) => showMsg("error", err.message));
  }, [status]);

  useEffect(() => {
    if (!selected) return undefined;
    const q = query(collection(db, WHATSAPP_CONVERSATIONS, selected, "messages"), orderBy("timestamp"), limitToLast(300));
    return onSnapshot(
      q,
      (snap) => setMessages(snap.docs.map((d) => ({ docId: d.id, ...d.data() }))),
      (err) => console.warn("WhatsApp thread listener stopped:", err?.code || err)
    );
  }, [selected]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const current = conversations.find((c) => c.id === selected) || null;

  // Opening a chat marks it read.
  useEffect(() => {
    if (current?.unread > 0) {
      updateDoc(doc(db, WHATSAPP_CONVERSATIONS, current.id), { unread: 0 }).catch(() => {});
    }
  }, [current?.id, current?.unread]);

  const displayName = (c) => contacts[c.id] || c.profileName || `+${c.id}`;

  const shown = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => `${contacts[c.id] || ""} ${c.profileName || ""} ${c.id}`.toLowerCase().includes(term));
  }, [conversations, contacts, filter]);

  const startConnect = () => {
    const FB = window.FB;
    if (!FB) return;
    setConnecting(true);
    const session = {};
    const onMessage = (event) => {
      if (!event.origin.endsWith("facebook.com")) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== "WA_EMBEDDED_SIGNUP") return;
        if (String(data.event).startsWith("FINISH")) {
          session.wabaId = data.data?.waba_id;
          session.phoneNumberId = data.data?.phone_number_id;
        } else if (data.event === "CANCEL") {
          session.cancelled = true;
        } else if (data.event === "ERROR") {
          session.error = data.data?.error_message;
        }
      } catch {
        // Other facebook.com messages are not JSON.
      }
    };
    window.addEventListener("message", onMessage);

    FB.login(
      (response) => {
        const code = response?.authResponse?.code;
        (async () => {
          try {
            // The session message can arrive just after this callback.
            for (let i = 0; i < 20 && code && !session.wabaId; i++) await new Promise((r) => setTimeout(r, 250));
            if (!code || !session.wabaId) {
              throw new Error(session.error || (session.cancelled ? "მიერთება შეწყდა." : "მიერთება არ დასრულდა."));
            }
            const res = await adminFetch("/api/admin/whatsapp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "connect", code, wabaId: session.wabaId, phoneNumberId: session.phoneNumberId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showMsg("success", `✓ მიერთდა ${data.displayPhone}. ძველი მიმოწერა რამდენიმე წუთში გამოჩნდება.`);
            await loadStatus();
          } catch (err) {
            showMsg("error", err.message);
          } finally {
            window.removeEventListener("message", onMessage);
            setConnecting(false);
          }
        })();
      },
      {
        config_id: WHATSAPP_SIGNUP_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        // Onboard the number already used in the WhatsApp Business app (coexistence).
        extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
      }
    );
  };

  const canReply = current?.lastIncomingAt && Date.now() - current.lastIncomingAt < REPLY_WINDOW_MS;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !current) return;
    setSending(true);
    try {
      const res = await adminFetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", to: current.id, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft("");
    } catch (err) {
      showMsg("error", err.message);
    } finally {
      setSending(false);
    }
  };

  const env = status?.env;
  const missing = [
    !WHATSAPP_SIGNUP_CONFIG_ID && "Embedded Signup-ის Configuration ID (კოდში)",
    env && !env.appSecret && "WHATSAPP_APP_SECRET (Vercel)",
    env && !env.verifyToken && "WHATSAPP_VERIFY_TOKEN (Vercel)",
    env && !env.serverFirestore && "FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY (Vercel)",
  ].filter(Boolean);
  const tokenDaysLeft = status?.tokenExpiresAt
    ? Math.max(0, Math.floor((status.tokenExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  const matchedBookings = current ? bookingsByPhone[phoneKey(current.id)] || [] : [];

  return (
    <div className="tp-wrap">
      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      {status && !status.connected && (
        <div className="tp-card">
          <h2 className="tp-title">WhatsApp-ის მიერთება</h2>
          <p className="admin-hint">
            ნომერი ტელეფონის WhatsApp Business-შიც დარჩება. მიერთებისას Facebook-ით შედით, აირჩიეთ არსებული
            WhatsApp Business ნომერი და ტელეფონით დაასკანერეთ QR კოდი. ბოლო 6 თვის მიმოწერა ავტომატურად გადმოვა.
          </p>
          {status.loadError && <p className="admin-hint wa-warn">სტატუსი ვერ ჩაიტვირთა: {status.loadError}</p>}
          {missing.length > 0 ? (
            <div className="wa-missing">
              <strong>მიერთებამდე საჭიროა:</strong>
              <ul>
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="admin-form-actions">
              <button type="button" className="admin-btn-primary" onClick={startConnect} disabled={!sdkReady || connecting}>
                {connecting ? "მიმდინარეობს..." : sdkReady ? "WhatsApp-ის მიერთება" : "იტვირთება..."}
              </button>
            </div>
          )}
        </div>
      )}

      {status?.connected && (
        <p className="admin-hint wa-connected">
          ✅ მიერთებულია: <strong>{status.displayPhone}</strong>
          {status.verifiedName && ` · ${status.verifiedName}`}
          {status.historyProgress && status.historyProgress.progress < 100 && ` · ძველი მიმოწერა იტვირთება: ${status.historyProgress.progress}%`}
          {status.historyError && ` · ისტორია არ გადმოვიდა: ${status.historyError}`}
          {tokenDaysLeft !== null && tokenDaysLeft <= 10 && (
            <span className="wa-warn"> · Meta-ს წვდომის ვადა იწურება {tokenDaysLeft} დღეში</span>
          )}
        </p>
      )}

      {(status?.connected || conversations.length > 0) && (
        <div className={`wa-inbox${current ? " has-thread" : ""}`}>
          <aside className="wa-list">
            <input
              type="search"
              className="tpl-input"
              placeholder="ძებნა სახელით ან ნომრით..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {shown.length === 0 ? (
              <p className="admin-hint">{conversations.length ? "ვერაფერი მოიძებნა." : "შეტყობინებები ჯერ არ არის."}</p>
            ) : (
              <ul>
                {shown.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className={`wa-conv${c.id === selected ? " is-active" : ""}`}
                      onClick={() => setSelected(c.id)}
                    >
                      <span className="wa-conv-top">
                        <strong>{displayName(c)}</strong>
                        <small>{formatTime(c.lastMessageAt)}</small>
                      </span>
                      <span className="wa-conv-bottom">
                        <span className="wa-conv-text">
                          {c.lastDirection === "out" && "↩ "}
                          {c.lastText}
                        </span>
                        {c.unread > 0 && <span className="adm-badge is-warn">{c.unread}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="wa-thread">
            {!current ? (
              <p className="admin-hint wa-empty">აირჩიეთ საუბარი მარცხნივ.</p>
            ) : (
              <>
                <header className="wa-thread-head">
                  <button type="button" className="admin-btn-ghost wa-back" onClick={() => setSelected(null)}>
                    ←
                  </button>
                  <div>
                    <strong>{displayName(current)}</strong>
                    <small>
                      <a href={`https://wa.me/${current.id}`} target="_blank" rel="noopener noreferrer">+{current.id}</a>
                    </small>
                  </div>
                </header>

                {matchedBookings.length > 0 && (
                  <div className="wa-bookings">
                    {matchedBookings.slice(0, 3).map((b) => (
                      <span key={b.id || b.bookingId} className="wa-booking">
                        {STATUS_CONFIG[b.status]?.icon} {b.bookingId} · {tourName(b.tourTitle)}
                        {b.trip?.date && ` · ${b.trip.date}`}
                      </span>
                    ))}
                  </div>
                )}

                <ol className="wa-messages">
                  {messages.map((m) => (
                    <li key={m.docId} className={`wa-msg is-${m.direction}`}>
                      <span className="wa-msg-text">{m.text}</span>
                      <small>
                        {SOURCE_LABELS[m.source] && `${SOURCE_LABELS[m.source]} · `}
                        {formatTime(m.timestamp)}
                        {m.direction === "out" && STATUS_TICKS[m.status] && (
                          <span className={m.status === "read" ? "wa-read" : ""}> {STATUS_TICKS[m.status]}</span>
                        )}
                      </small>
                    </li>
                  ))}
                  <li ref={threadEnd} aria-hidden="true" />
                </ol>

                {canReply ? (
                  <form className="wa-reply" onSubmit={handleSend}>
                    <textarea
                      className="tpl-input"
                      rows={2}
                      placeholder="პასუხი..."
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(e);
                      }}
                    />
                    <button type="submit" className="admin-btn-primary" disabled={sending || !draft.trim() || !status?.connected}>
                      {sending ? "..." : "გაგზავნა"}
                    </button>
                  </form>
                ) : (
                  <p className="admin-hint wa-warn">
                    კლიენტის ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — Meta საიტიდან წერის უფლებას აღარ იძლევა.
                    უპასუხეთ ტელეფონის WhatsApp-იდან (პასუხი აქაც გამოჩნდება).
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {!status?.connected && <ReviewDemo />}
    </div>
  );
}

// Meta App Review (Tech Provider) needs a screen recording of this panel
// sending a WhatsApp message. Uses the test number and temporary token from
// Meta's "Try it out" page; nothing typed here is saved.
function ReviewDemo() {
  const [form, setForm] = useState({ token: "", phoneNumberId: "", wabaId: "", to: "", text: "Hello from GeorgiaTrips! Your tour booking request was received." });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const call = async (action) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await adminFetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ type: "success", data });
    } catch (err) {
      setResult({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="tp-card wa-demo">
      <summary className="tp-subtitle">Meta App Review — test message</summary>
      <p className="admin-hint">
        For the review video: values from developers.facebook.com → WhatsApp → API Setup (test number). Nothing here is stored.
      </p>
      <div className="tpl-form">
        <label className="tpl-field tpl-field--wide">
          <span>Temporary access token</span>
          <input type="password" className="tpl-input" autoComplete="off" value={form.token} onChange={(e) => set({ token: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>Phone number ID</span>
          <input type="text" className="tpl-input" value={form.phoneNumberId} onChange={(e) => set({ phoneNumberId: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>WhatsApp Business Account ID</span>
          <input type="text" className="tpl-input" value={form.wabaId} onChange={(e) => set({ wabaId: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>To (WhatsApp number)</span>
          <input type="tel" className="tpl-input" placeholder="+995…" value={form.to} onChange={(e) => set({ to: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>Message</span>
          <input type="text" className="tpl-input" value={form.text} onChange={(e) => set({ text: e.target.value })} />
        </label>
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => call("demo-send")}>
          {busy ? "..." : "Send WhatsApp message"}
        </button>
        <button type="button" className="admin-btn-ghost" disabled={busy} onClick={() => call("demo-templates")}>
          List message templates
        </button>
      </div>
      {result?.type === "error" && <p className="admin-hint wa-warn">{result.text}</p>}
      {result?.type === "success" && result.data.id !== undefined && (
        <p className="admin-hint">✓ Message sent (id: {result.data.id})</p>
      )}
      {result?.type === "success" && result.data.templates && (
        <ul className="admin-hint">
          {result.data.templates.map((t) => (
            <li key={`${t.name}-${t.language}`}>{t.name} · {t.category} · {t.language} · {t.status}</li>
          ))}
          {result.data.templates.length === 0 && <li>No templates yet.</li>}
        </ul>
      )}
    </details>
  );
}
