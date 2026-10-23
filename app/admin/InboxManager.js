"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { REPLY_WINDOW_MS, WA_CONNECT_STATE } from "../lib/whatsappConfig";
import { listAllBookingsAdmin } from "../lib/bookingsFirestore";
import { STATUS_CONFIG } from "../lib/bookingModel";
import { InstagramIcon, MessengerIcon, WhatsAppIcon } from "../components/Icons";
import { MessageMedia, chatKey, importOldChats, messageCaption, useInbox } from "./useInbox";
import WhatsAppConnection from "./WhatsAppConnection";
import PageConnection from "./PageConnection";

// One inbox for WhatsApp, Facebook Messenger and Instagram Direct: every chat
// is marked with the channel it came from, and replies go back the same way.
// Connection settings sit in a collapsed section below, loaded only when
// opened, so the chats themselves show up first.

const CHANNELS = {
  whatsapp: {
    label: "WhatsApp",
    Icon: WhatsAppIcon,
    sendUrl: "/api/admin/whatsapp",
    unnamed: "",
    sources: { site: "საიტიდან", phone: "ტელეფონიდან" },
    lateReply: "უპასუხეთ ტელეფონის WhatsApp-იდან",
  },
  messenger: {
    label: "Messenger",
    Icon: MessengerIcon,
    sendUrl: "/api/admin/messenger",
    unnamed: "Facebook მომხმარებელი",
    sources: { site: "საიტიდან", page: "Facebook-იდან" },
    lateReply: "უპასუხეთ Messenger-იდან ან Business Suite-იდან",
  },
  instagram: {
    label: "Instagram",
    Icon: InstagramIcon,
    sendUrl: "/api/admin/messenger",
    unnamed: "Instagram მომხმარებელი",
    sources: { site: "საიტიდან", page: "Instagram-იდან" },
    lateReply: "უპასუხეთ Instagram-იდან ან Business Suite-იდან",
  },
};
const FILTERS = [["", "ყველა"], ...Object.entries(CHANNELS).map(([key, c]) => [key, c.label])];

const STATUS_TICKS = { sent: "✓", delivered: "✓✓", read: "✓✓", failed: "⚠" };

// Bookings store phones as typed ("+995 555…", "555…"); the last 9 digits
// identify a Georgian or most foreign mobile numbers well enough to match.
const phoneKey = (value) => String(value || "").replace(/\D/g, "").slice(-9);

const formatTime = (ms) =>
  ms
    ? new Date(ms).toLocaleString("ka-GE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

const tourName = (title) => (title && typeof title === "object" ? title.ka || title.en || "" : title || "");

function ChannelBadge({ channel }) {
  const info = CHANNELS[channel];
  if (!info) return null;
  const { Icon } = info;
  return (
    <span className={`inbox-channel is-${channel}`}>
      <Icon size={14} />
      {info.label}
    </span>
  );
}

export default function InboxManager() {
  const [selected, setSelected] = useState(null);
  const [channelFilter, setChannelFilter] = useState("");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(false);
  const [bookingsByPhone, setBookingsByPhone] = useState(null);
  // Back from Meta's WhatsApp signup page, the settings open to finish it.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const threadEnd = useRef(null);

  const { loaded, conversations, contacts, imported, messages, error, markRead, refresh } = useInbox(selected);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("state") === WA_CONNECT_STATE) setSettingsOpen(true);
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 8000);
  };

  const current = conversations.find((c) => chatKey(c) === chatKey(selected)) || null;
  const info = current ? CHANNELS[current.channel] : null;

  // Opening a chat marks it read.
  useEffect(() => {
    if (current?.unread > 0) markRead(current);
  }, [current?.channel, current?.id, current?.unread, markRead]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Bookings are matched to WhatsApp numbers, read from Firestore only once a
  // WhatsApp chat is opened (not on every visit to the inbox).
  const whatsappOpen = current?.channel === "whatsapp";
  useEffect(() => {
    if (!whatsappOpen || bookingsByPhone) return;
    setBookingsByPhone({});
    listAllBookingsAdmin()
      .then((list) => {
        const map = {};
        for (const b of list) {
          const key = phoneKey(b.customer?.phone || b.customer?.whatsapp);
          if (key) (map[key] ||= []).push(b);
        }
        setBookingsByPhone(map);
      })
      .catch(() => {});
  }, [whatsappOpen, bookingsByPhone]);

  const displayName = (c) =>
    (c.channel === "whatsapp" && contacts[c.id]) || c.profileName || CHANNELS[c.channel]?.unnamed || `+${c.id}`;

  const shown = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return conversations.filter(
      (c) =>
        (!channelFilter || c.channel === channelFilter) &&
        (!term ||
          `${contacts[c.id] || ""} ${c.profileName || ""} ${c.channel === "whatsapp" ? c.id : ""} ${c.lastText || ""}`
            .toLowerCase()
            .includes(term))
    );
  }, [conversations, contacts, filter, channelFilter]);

  const unreadBy = useMemo(() => {
    // "" is the "all" filter.
    const counts = {};
    for (const c of conversations) {
      if (c.unread > 0) for (const key of [c.channel, ""]) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [conversations]);

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

  const canReply = current?.lastIncomingAt && Date.now() - current.lastIncomingAt < REPLY_WINDOW_MS;

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !current) return;
    setSending(true);
    try {
      const res = await adminFetch(info.sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", channel: current.channel, to: current.id, text }),
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

  const matchedBookings = whatsappOpen ? bookingsByPhone?.[phoneKey(current.id)] || [] : [];

  return (
    <div className="tp-wrap">
      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      {error && <p className="admin-hint wa-warn">მიმოწერა ვერ ჩაიტვირთა: {error}</p>}

      {!imported && (
        <p className="admin-hint">
          ძველი მიმოწერა ჯერ ისევ Firebase-შია.{" "}
          <button type="button" className="admin-btn-ghost wa-reconnect" onClick={runImport} disabled={importing}>
            {importing ? "..." : "ძველი მიმოწერის გადმოტანა"}
          </button>
        </p>
      )}

      <div className={`wa-inbox${current ? " has-thread" : ""}`}>
        <aside className="wa-list">
          <div className="inbox-filters" role="group" aria-label="არხი">
            {FILTERS.map(([key, label]) => (
              <button
                key={key || "all"}
                type="button"
                className={`inbox-filter${channelFilter === key ? " is-active" : ""}`}
                onClick={() => setChannelFilter(key)}
              >
                {label}
                {unreadBy[key] > 0 && <span className="adm-badge is-warn">{unreadBy[key]}</span>}
              </button>
            ))}
          </div>
          <input
            type="search"
            className="tpl-input"
            placeholder="ძებნა სახელით, ნომრით ან ტექსტით..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {!loaded ? (
            <p className="admin-hint">იტვირთება...</p>
          ) : shown.length === 0 ? (
            <p className="admin-hint">{conversations.length ? "ვერაფერი მოიძებნა." : "შეტყობინებები ჯერ არ არის."}</p>
          ) : (
            <ul>
              {shown.map((c) => (
                <li key={chatKey(c)}>
                  <button
                    type="button"
                    className={`wa-conv${chatKey(c) === chatKey(selected) ? " is-active" : ""}`}
                    onClick={() => setSelected({ channel: c.channel, id: c.id })}
                  >
                    <span className="wa-conv-top">
                      <ChannelBadge channel={c.channel} />
                      <small>{formatTime(c.lastMessageAt)}</small>
                    </span>
                    <span className="wa-conv-top">
                      <strong>{displayName(c)}</strong>
                      {c.unread > 0 && <span className="adm-badge is-warn">{c.unread}</span>}
                    </span>
                    <span className="wa-conv-text">
                      {c.lastDirection === "out" && "↩ "}
                      {c.lastText}
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
                  <ChannelBadge channel={current.channel} />
                  <strong>{displayName(current)}</strong>
                  {current.channel === "whatsapp" && (
                    <small>
                      <a href={`https://wa.me/${current.id}`} target="_blank" rel="noopener noreferrer">+{current.id}</a>
                    </small>
                  )}
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
                {messages.map((m) => {
                  const caption = messageCaption(m, Boolean(m.mediaUrl || m.mediaId));
                  return (
                    <li key={m.id} className={`wa-msg is-${m.direction}`}>
                      <MessageMedia message={m} />
                      {caption && <span className="wa-msg-text">{caption}</span>}
                      <small>
                        {info.sources[m.source] && `${info.sources[m.source]} · `}
                        {formatTime(m.timestamp)}
                        {m.direction === "out" && STATUS_TICKS[m.status] && current.channel === "whatsapp" && (
                          <span className={m.status === "read" ? "wa-read" : ""}> {STATUS_TICKS[m.status]}</span>
                        )}
                      </small>
                    </li>
                  );
                })}
                <li ref={threadEnd} aria-hidden="true" />
              </ol>

              {canReply ? (
                <form className="wa-reply" onSubmit={handleSend}>
                  <textarea
                    className="tpl-input"
                    rows={2}
                    placeholder={`პასუხი ${info.label}-ში...`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend(e);
                    }}
                  />
                  <button type="submit" className="admin-btn-primary" disabled={sending || !draft.trim()}>
                    {sending ? "..." : "გაგზავნა"}
                  </button>
                </form>
              ) : (
                <p className="admin-hint wa-warn">
                  კლიენტის ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — Meta საიტიდან წერის უფლებას აღარ იძლევა.{" "}
                  {info.lateReply} (პასუხი აქაც გამოჩნდება).
                </p>
              )}
            </>
          )}
        </section>
      </div>

      <details className="tp-card wa-demo" open={settingsOpen} onToggle={(e) => setSettingsOpen(e.currentTarget.open)}>
        <summary className="tp-subtitle">არხების მიერთება და სტატუსი</summary>
        {settingsOpen && (
          <>
            <WhatsAppConnection />
            <PageConnection />
          </>
        )}
      </details>
    </div>
  );
}
