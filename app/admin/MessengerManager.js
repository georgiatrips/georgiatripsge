"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { REPLY_WINDOW_MS } from "../lib/whatsappConfig";
import { MessageMedia, importOldChats, messageCaption, useInbox } from "./useInbox";

// Facebook Page and Instagram Direct inboxes: messages people send to the
// Page or its Instagram account, and the business's replies (from here,
// Business Suite or the apps). Same layout as the WhatsApp tab, so it reuses
// its .wa-* styles.

const CHANNELS = {
  messenger: { label: "Messenger", app: "Facebook", unnamed: "Facebook მომხმარებელი" },
  instagram: { label: "Instagram", app: "Instagram", unnamed: "Instagram მომხმარებელი" },
};

const formatTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ka-GE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

export default function MessengerManager({ channel = "messenger" }) {
  const info = CHANNELS[channel];
  const sourceLabels = { site: "საიტიდან", page: `${info.app}-იდან` };
  const [status, setStatus] = useState(null);
  const [selected, setSelected] = useState(null);
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
      const res = await adminFetch(`/api/admin/messenger?channel=${channel}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data);
    } catch (err) {
      setStatus({ connected: false, loadError: err.message });
    }
  };

  const { conversations, imported, messages, error: inboxError, markRead, refresh } = useInbox(channel, selected);

  const [importing, setImporting] = useState(false);
  const runImport = async () => {
    setImporting(true);
    try {
      await importOldChats();
      showMsg("success", "✓ ძველი მიმოწერა გადმოვიდა.");
      await refresh();
    } catch (err) {
      showMsg("error", err.message);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const current = conversations.find((c) => c.id === selected) || null;

  // Opening a chat marks it read.
  useEffect(() => {
    if (current?.unread > 0) markRead(current.id);
  }, [current?.id, current?.unread, markRead]);

  const displayName = (c) => c.profileName || info.unnamed;

  const shown = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => `${c.profileName || ""} ${c.lastText || ""}`.toLowerCase().includes(term));
  }, [conversations, filter]);

  const canReply = current?.lastIncomingAt && Date.now() - current.lastIncomingAt < REPLY_WINDOW_MS;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !current) return;
    setSending(true);
    try {
      const res = await adminFetch("/api/admin/messenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", channel, to: current.id, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft("");
      await refresh();
    } catch (err) {
      showMsg("error", err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="tp-wrap">
      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      {status?.loadError && <p className="admin-hint wa-warn">სტატუსი ვერ ჩაიტვირთა: {status.loadError}</p>}
      {status?.connected && (
        <p className="admin-hint wa-connected">
          ✅ მიერთებულია: <strong>{status.pageName}</strong>
        </p>
      )}

      {inboxError && <p className="admin-hint wa-warn">მიმოწერა ვერ ჩაიტვირთა: {inboxError}</p>}

      {!imported && (
        <p className="admin-hint">
          ძველი მიმოწერა ჯერ ისევ Firebase-შია.{" "}
          <button type="button" className="admin-btn-ghost wa-reconnect" onClick={runImport} disabled={importing}>
            {importing ? "..." : "ძველი მიმოწერის გადმოტანა"}
          </button>
        </p>
      )}

      {(status?.connected || conversations.length > 0) && (
        <div className={`wa-inbox${current ? " has-thread" : ""}`}>
          <aside className="wa-list">
            <input
              type="search"
              className="tpl-input"
              placeholder="ძებნა სახელით..."
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
                    <small>{info.label}</small>
                  </div>
                </header>

                <ol className="wa-messages">
                  {messages.map((m) => (
                    <li key={m.id} className={`wa-msg is-${m.direction}`}>
                      <MessageMedia message={m} />
                      {messageCaption(m, Boolean(m.mediaUrl || m.mediaId)) && (
                        <span className="wa-msg-text">{messageCaption(m, Boolean(m.mediaUrl || m.mediaId))}</span>
                      )}
                      <small>
                        {sourceLabels[m.source] && `${sourceLabels[m.source]} · `}
                        {formatTime(m.timestamp)}
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
                    ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — Meta საიტიდან წერის უფლებას აღარ იძლევა.
                    უპასუხეთ {info.app}-იდან ან Business Suite-იდან (პასუხი აქაც გამოჩნდება).
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      <PageConnect open={status && !status.connected} onConnected={(data) => {
        showMsg("success", `✓ მიერთდა ${data.pageName}${data.igUsername ? ` და @${data.igUsername}` : ""}.`);
        loadStatus();
      }} />
    </div>
  );
}

// The Page is connected with the same kind of system-user token as WhatsApp
// (Business settings → System users), with the Page assigned to that user.
function PageConnect({ open, onConnected }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/messenger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setToken("");
      onConnected(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="tp-card wa-demo" open={Boolean(open)}>
      <summary className="tp-subtitle">Facebook Page-ის და Instagram-ის მიერთება ტოკენით</summary>
      <p className="admin-hint">
        Business settings → System users → GeorgiaTrips Inbox → Assign assets → Page (Full control), მერე Generate token
        (ვადა Never; pages_messaging, pages_manage_metadata, pages_show_list, pages_read_engagement, instagram_basic,
        instagram_manage_messages). Instagram-ი Page-ზე მიბმული ანგარიშით ერთდება. ტოკენი მხოლოდ სერვერზე ინახება.
      </p>
      <form className="tpl-form" onSubmit={submit}>
        <label className="tpl-field tpl-field--wide">
          <span>System user token</span>
          <input type="password" className="tpl-input" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} />
        </label>
        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={busy || !token.trim()}>
            {busy ? "..." : "მიერთება"}
          </button>
        </div>
      </form>
      {error && <p className="admin-hint wa-warn">{error}</p>}
    </details>
  );
}
