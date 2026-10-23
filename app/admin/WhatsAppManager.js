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
  WA_CONNECT_STATE,
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

// Embedded Signup runs as a full page rather than the SDK popup: popups get
// lost behind the window, and Meta sends the browser back here with ?code=.
const signupRedirectUri = () => `${window.location.origin}/admin`;

function signupUrl() {
  const params = new URLSearchParams({
    client_id: WHATSAPP_APP_ID,
    config_id: WHATSAPP_SIGNUP_CONFIG_ID,
    redirect_uri: signupRedirectUri(),
    response_type: "code",
    override_default_response_type: "true",
    state: WA_CONNECT_STATE,
    // v5 offers the number already used in the WhatsApp Business app
    // (coexistence) by default; v3 was retired on 2026-10-15.
    extras: JSON.stringify({ setup: {}, version: "v5" }),
  });
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params}`;
}

export default function WhatsAppManager() {
  const [status, setStatus] = useState(null);
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

  // Back from Meta's signup page: finish the connection once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("state") !== WA_CONNECT_STATE) return;
    const code = params.get("code");
    window.history.replaceState(null, "", window.location.pathname);
    if (!code) {
      showMsg("error", params.get("error_description") || "მიერთება შეწყდა.");
      return;
    }
    setConnecting(true);
    (async () => {
      try {
        const res = await adminFetch("/api/admin/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "connect", code, redirectUri: signupRedirectUri() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        showMsg("success", `✓ მიერთდა ${data.displayPhone}. ძველი მიმოწერა რამდენიმე წუთში გამოჩნდება.`);
        await loadStatus();
      } catch (err) {
        showMsg("error", err.message);
      } finally {
        setConnecting(false);
      }
    })();
  }, []);

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
    setConnecting(true);
    window.location.assign(signupUrl());
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
              <button type="button" className="admin-btn-primary" onClick={startConnect} disabled={connecting}>
                {connecting ? "მიმდინარეობს..." : "WhatsApp-ის მიერთება"}
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
          )}{" "}
          <button type="button" className="admin-btn-ghost wa-reconnect" onClick={startConnect} disabled={connecting}>
            {connecting ? "მიმდინარეობს..." : "ნომრის შეცვლა / თავიდან მიერთება"}
          </button>
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

      <TokenConnect
        onConnected={(data) => {
          showMsg("success", `✓ მიერთდა ${data.displayPhone}. ძველი მიმოწერა რამდენიმე წუთში გამოჩნდება.`);
          loadStatus();
        }}
      />
    </div>
  );
}

// Our own number shares a business portfolio with the Meta app, which
// Embedded Signup can't finish ("isn't a valid Business ID"). After the QR
// step there, the number is connected here with a system-user token from
// Business settings → System users (permanent, so no 60-day expiry).
function TokenConnect({ onConnected }) {
  const [form, setForm] = useState({ token: "", wabaId: "864089679715720", phoneNumberId: "964147060119889" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect-token", ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm((f) => ({ ...f, token: "" }));
      onConnected(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="tp-card wa-demo">
      <summary className="tp-subtitle">საკუთარი ნომრის მიერთება ტოკენით</summary>
      <p className="admin-hint">
        Business settings → System users → Generate token (აპი GeorgiaTrips Inbox, ვადა Never,
        whatsapp_business_messaging + whatsapp_business_management). ტოკენი მხოლოდ სერვერზე ინახება.
      </p>
      <form className="tpl-form" onSubmit={submit}>
        <label className="tpl-field tpl-field--wide">
          <span>System user token</span>
          <input type="password" className="tpl-input" autoComplete="off" value={form.token} onChange={(e) => set({ token: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>WhatsApp Business Account ID</span>
          <input type="text" className="tpl-input" value={form.wabaId} onChange={(e) => set({ wabaId: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>Phone number ID</span>
          <input type="text" className="tpl-input" value={form.phoneNumberId} onChange={(e) => set({ phoneNumberId: e.target.value })} />
        </label>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={busy || !form.token.trim()}>
            {busy ? "..." : "მიერთება"}
          </button>
        </div>
      </form>
      {error && <p className="admin-hint wa-warn">{error}</p>}
    </details>
  );
}
