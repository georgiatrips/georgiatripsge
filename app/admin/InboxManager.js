"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { REPLY_WINDOW_MS, WA_CONNECT_STATE } from "../lib/whatsappConfig";
import { listAllBookingsAdmin } from "../lib/bookingsFirestore";
import { STATUS_CONFIG } from "../lib/bookingModel";
import { InstagramIcon, MessengerIcon, WhatsAppIcon } from "../components/Icons";
import { MessageMedia, chatKey, importOldChats, inboxAction, messageCaption, useInbox } from "./useInbox";
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
    sources: { site: "საიტიდან", phone: "ტელეფონიდან", ai: "🤖 AI" },
    lateReply: "უპასუხეთ ტელეფონის WhatsApp-იდან",
  },
  messenger: {
    label: "Messenger",
    Icon: MessengerIcon,
    sendUrl: "/api/admin/messenger",
    unnamed: "Facebook მომხმარებელი",
    sources: { site: "საიტიდან", page: "Facebook-იდან", ai: "🤖 AI" },
    lateReply: "უპასუხეთ Messenger-იდან ან Business Suite-იდან",
  },
  instagram: {
    label: "Instagram",
    Icon: InstagramIcon,
    sendUrl: "/api/admin/messenger",
    unnamed: "Instagram მომხმარებელი",
    sources: { site: "საიტიდან", page: "Instagram-იდან", ai: "🤖 AI" },
    lateReply: "უპასუხეთ Instagram-იდან ან Business Suite-იდან",
  },
};
const FILTERS = [["", "ყველა"], ...Object.entries(CHANNELS).map(([key, c]) => [key, c.label])];

const AI_MODES = [
  ["off", "გამორთული"],
  ["suggest", "მონახაზი"],
  ["auto", "ავტომატური"],
];

const AI_PAUSE_MS = 3 * 60 * 60 * 1000;

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

  const { loaded, conversations, contacts, imported, ai, messages, error, markRead, refresh } = useInbox(selected);

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

  // The thread scrolls inside its own box (never the page): to the bottom when
  // a chat opens, and on a new message only if the admin is already near the
  // bottom, so reading older messages is not interrupted by the 3 s poll.
  const lastMessageId = messages[messages.length - 1]?.id;
  const scrolledChat = useRef("");
  const atBottom = useRef(true);
  const onThreadScroll = (e) => {
    const box = e.currentTarget;
    atBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  };
  useEffect(() => {
    const box = threadEnd.current?.parentElement;
    if (!box || !lastMessageId) return;
    const key = chatKey(selected);
    if (scrolledChat.current !== key || atBottom.current) {
      box.scrollTop = box.scrollHeight;
      atBottom.current = true;
    }
    scrolledChat.current = key;
  }, [lastMessageId, selected]);

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

  const runAction = async (body) => {
    try {
      await inboxAction(body);
    } catch (err) {
      showMsg("error", err.message);
    }
  };

  // A suggested reply is shown until anything newer is written in the chat.
  // The assistant pauses for 3 hours after the team writes in a chat (inboxAi.js).
  const lastTeamAt = Math.max(0, ...messages.filter((m) => m.direction === "out" && m.source !== "ai").map((m) => m.timestamp));
  const aiPausedUntil = lastTeamAt + AI_PAUSE_MS > Date.now() ? lastTeamAt + AI_PAUSE_MS : 0;

  const aiDraft = current?.aiDraft && current.aiDraftAt >= current.lastMessageAt ? current.aiDraft : "";

  const handleSend = async (e, override) => {
    e.preventDefault();
    const text = (override ?? draft).trim();
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
      if (override === undefined) setDraft("");
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

      {ai && <AiBar ai={ai} onChange={runAction} />}

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
                {ai && ai.mode !== "off" && (
                  <button
                    type="button"
                    className={`admin-btn-ghost inbox-ai-toggle${current.aiOff ? "" : " is-on"}`}
                    onClick={() => runAction({ action: "ai-chat", channel: current.channel, id: current.id, off: !current.aiOff })}
                    title="AI-ის პასუხები ამ ჩატში"
                  >
                    🤖{" "}
                    {current.aiOff
                      ? "AI გამორთულია"
                      : aiPausedUntil
                        ? `AI პაუზაზეა ${formatClock(aiPausedUntil)}-მდე`
                        : "AI ჩართულია"}
                  </button>
                )}
                {current.requestForwardedAt > 0 && (
                  <small className="wa-connected" title="AI-მ მზა მოთხოვნა მენეჯერს გადაუგზავნა">
                    📨 გადაეგზავნა {formatClock(current.requestForwardedAt)}
                  </small>
                )}
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

              <ol className="wa-messages" onScroll={onThreadScroll}>
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

              {aiDraft && canReply && (
                <div className="inbox-ai-draft">
                  <small>🤖 AI-ის შემოთავაზებული პასუხი</small>
                  <p>{aiDraft}</p>
                  <div>
                    <button type="button" className="admin-btn-primary" disabled={sending} onClick={(e) => handleSend(e, aiDraft)}>
                      გაგზავნა
                    </button>
                    <button type="button" className="admin-btn-ghost" onClick={() => setDraft(aiDraft)}>
                      ჩასწორება
                    </button>
                    <button
                      type="button"
                      className="admin-btn-ghost"
                      onClick={() => runAction({ action: "ai-draft-clear", channel: current.channel, id: current.id })}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

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

// The inbox assistant's mode and channels (lib/server/inboxAi.js).
function AiBar({ ai, onChange }) {
  const save = (patch) => onChange({ action: "ai-settings", mode: ai.mode, channels: ai.channels, ...patch });
  return (
    <div className="inbox-ai-bar">
      <strong>🤖 AI პასუხები:</strong>
      <div className="inbox-filters" role="group" aria-label="AI რეჟიმი">
        {AI_MODES.map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            className={`inbox-filter${ai.mode === mode ? " is-active" : ""}`}
            onClick={() => save({ mode })}
            disabled={!ai.ready && mode !== "off"}
          >
            {label}
          </button>
        ))}
      </div>
      {ai.mode !== "off" &&
        Object.entries(CHANNELS).map(([key, info]) => (
          <label key={key} className="inbox-ai-channel">
            <input
              type="checkbox"
              checked={ai.channels[key] !== false}
              onChange={(e) => save({ channels: { ...ai.channels, [key]: e.target.checked } })}
            />
            {info.label}
          </label>
        ))}
      {!ai.ready && <small className="wa-warn">ჩასართავად Vercel-ში საჭიროა GEMINI_API_KEY.</small>}
      {ai.mode === "suggest" && <small>AI წერს მონახაზს, თქვენ აგზავნით.</small>}
      {ai.mode === "auto" && <small>AI თვითონ პასუხობს; ჩატში თქვენ თუ დაწერეთ, იქ 3 საათი ჩუმადაა.</small>}
      {ai.ready && ai.usage && <AiUsage usage={ai.usage} />}
      {ai.ready && <AiInstructions saved={ai.instructions || ""} />}
      {ai.ready && <AiLearned ai={ai} />}
      {ai.ready && ai.forward && <AiForward forward={ai.forward} />}
    </div>
  );
}

const formatClock = (ms) => new Date(ms).toLocaleString("ka-GE", { hour: "2-digit", minute: "2-digit" });

// Today's Gemini requests per model, the daily reset and the last error.
// Google does not report what is left, so the limit shows once a 429 has
// named it (it is also on aistudio.google.com/rate-limit).
function AiUsage({ usage }) {
  const [test, setTest] = useState(null);
  const [question, setQuestion] = useState("");

  const runTest = async () => {
    setTest({ busy: true });
    try {
      const { reply, ms, model, briefMs, examples, requestReady, requestSummary } = await inboxAction({ action: "ai-test", question });
      setTest({
        ok:
          `✓ მუშაობს (${(ms / 1000).toFixed(1)} წმ, ${model.replace("gemini-", "")}, ინფორმაცია ${(briefMs / 1000).toFixed(1)} წმ, თქვენი ${examples} მაგალითი): „${reply}“` +
          (requestReady ? ` 📨 მზა მოთხოვნაა — გადაეგზავნებოდა მენეჯერს: ${requestSummary}` : ""),
      });
    } catch (err) {
      setTest({ error: err.message });
    }
  };

  const allSpent = usage.models.every((m) => m.exhausted);
  return (
    <div className="inbox-ai-usage">
      <span>
        დღეს გამოყენებული:{" "}
        {usage.models.map((m, i) => (
          <span key={m.name} className={m.exhausted ? "wa-warn" : ""}>
            {i > 0 && " · "}
            {m.name.replace("gemini-", "")}: <strong>{m.used}</strong>
            {m.limit ? ` / ${m.limit}` : ""}
            {m.exhausted && " (ამოიწურა)"}
          </span>
        ))}
      </span>
      <span>
        ლიმიტი განახლდება: <strong>{formatClock(usage.resetAt)}</strong>
        {allSpent && <span className="wa-warn"> — მანამდე AI ვერ უპასუხებს</span>}
      </span>
      {usage.lastOkAt && <span>ბოლო წარმატებული პასუხი: {formatClock(usage.lastOkAt)}</span>}
      {usage.lastError && (!usage.lastOkAt || usage.lastError.at > usage.lastOkAt) && (
        <span className="wa-warn">
          ბოლო შეცდომა ({formatClock(usage.lastError.at)}, {usage.lastError.model}, {usage.lastError.status}): {usage.lastError.message}
        </span>
      )}
      <span className="inbox-ai-test">
        <input
          type="text"
          className="tpl-input"
          placeholder="სატესტო კითხვა (ცარიელი — „ტურები გაქვთ საქართველოში?“)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button type="button" className="admin-btn-ghost wa-reconnect" onClick={runTest} disabled={test?.busy}>
          {test?.busy ? "..." : "შემოწმება"}
        </button>
      </span>
      {test?.ok && <span className="wa-connected">{test.ok}</span>}
      {test?.error && <span className="wa-warn">{test.error}</span>}
    </div>
  );
}

const TEMPLATE_STATUS = {
  APPROVED: ["✅ დამტკიცებულია", "wa-connected"],
  PENDING: ["⏳ Meta ამოწმებს (ჩვეულებრივ რამდენიმე წუთი)", ""],
  REJECTED: ["❌ Meta-მ უარყო", "wa-warn"],
};

// Where ready tour requests are forwarded (lib/server/tourRequests.js), and
// the WhatsApp template used when the manager has not written in 24 hours.
function AiForward({ forward }) {
  const [form, setForm] = useState(forward);
  const [template, setTemplate] = useState(undefined);
  const [status, setStatus] = useState(null);
  const savedKey = JSON.stringify(forward);
  useEffect(() => setForm(JSON.parse(savedKey)), [savedKey]);
  const changed = JSON.stringify(form) !== savedKey;
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const loadTemplate = async () => {
    try {
      setTemplate((await inboxAction({ action: "forward-status" })).template);
    } catch (err) {
      setTemplate({ status: "ERROR", reason: err.message });
    }
  };

  const run = async (body, done) => {
    setStatus({ busy: body.action });
    try {
      const data = await inboxAction(body);
      if ("template" in data) setTemplate(data.template);
      setStatus({ ok: done });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  const [templateLabel, templateClass] = template ? TEMPLATE_STATUS[template.status] || [template.status, "wa-warn"] : [];
  return (
    <details className="inbox-ai-rules" onToggle={(e) => e.currentTarget.open && template === undefined && loadTemplate()}>
      <summary>
        📨 მზა მოთხოვნების გადაგზავნა{" "}
        {forward.enabled ? `→ ${forward.name || "მენეჯერი"} (+${forward.phone})` : "(გამორთულია)"}
      </summary>
      <p className="admin-hint">
        როცა კლიენტმა ყველაფერი თქვა, რაც ტურის დასაგეგმად საჭიროა (რა/სად, თარიღი, რამდენი კაცი, საიდან აიყვანონ), AI
        კლიენტს სწერს, რომ მოთხოვნა მიღებულია და მენეჯერს გადაეცა, მოთხოვნას კი მაშინვე WhatsApp-ით უგზავნის ამ ნომერს
        (თითო კლიენტს დღეში ერთხელ). ასლი Telegram-ში მოგივათ. მუშაობს „ავტომატურ“ რეჟიმში.
      </p>
      <div className="tpl-form">
        <label className="inbox-ai-channel">
          <input type="checkbox" checked={form.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
          ჩართულია
        </label>
        <label className="tpl-field">
          <span>სახელი</span>
          <input type="text" className="tpl-input" value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label className="tpl-field">
          <span>WhatsApp ნომერი (ქვეყნის კოდით)</span>
          <input type="tel" className="tpl-input" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
      </div>
      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn-primary"
          onClick={() => run({ action: "forward-settings", ...form }, "✓ შენახულია.")}
          disabled={Boolean(status?.busy) || !changed}
        >
          {status?.busy === "forward-settings" ? "..." : "შენახვა"}
        </button>
        {status?.ok && !changed && <span className="wa-connected">{status.ok}</span>}
        {status?.error && <span className="wa-warn">{status.error}</span>}
      </div>
      <p className="admin-hint">
        WhatsApp-ის შაბლონი „tour_request“ (საჭიროა, როცა მენეჯერს ბოლო 24 საათში არ მოუწერია):{" "}
        {template === undefined ? (
          "..."
        ) : template === null ? (
          <>
            ჯერ არ არის შექმნილი.{" "}
            <button
              type="button"
              className="admin-btn-ghost wa-reconnect"
              onClick={() => run({ action: "forward-template" }, "✓ შაბლონი გაიგზავნა Meta-ზე დასამტკიცებლად.")}
              disabled={Boolean(status?.busy)}
            >
              {status?.busy === "forward-template" ? "..." : "შაბლონის შექმნა"}
            </button>
          </>
        ) : (
          <>
            <span className={templateClass}>{templateLabel}</span>
            {template.reason && template.reason !== "NONE" && ` — ${template.reason}`}{" "}
            <button type="button" className="admin-btn-ghost wa-reconnect" onClick={loadTemplate}>
              განახლება
            </button>
          </>
        )}
      </p>
    </details>
  );
}

// What the assistant learned from the team's own replies (lib/server/inboxAi.js
// rewrites it once a day). The owner reads it, fixes or deletes wrong points.
function AiLearned({ ai }) {
  const saved = ai.learned || "";
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState(null);
  useEffect(() => setText(saved), [saved]);
  const changed = text !== saved;

  const run = async (body, done) => {
    setStatus({ busy: body.action });
    try {
      await inboxAction(body);
      setStatus({ ok: done });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <details className="inbox-ai-rules">
      <summary>
        📚 რა ისწავლა AI-მ თქვენი პასუხებიდან{" "}
        {ai.learnedAt ? `(${ai.learnedFrom} პასუხიდან, ${new Date(ai.learnedAt).toLocaleDateString("ka-GE")})` : "(ჯერ არაფერი)"}
      </summary>
      <p className="admin-hint">
        AI კითხულობს, რას პასუხობთ კლიენტებს ტელეფონიდან, Facebook-იდან, Instagram-იდან და საიტიდან. ყოველ პასუხზე
        უყურებს, როგორ უპასუხეთ მსგავს კითხვას, და დღეში ერთხელ აქ წერს, რა ისწავლა. თუ რამე არასწორია, შეასწორეთ ან
        წაშალეთ და შეინახეთ — მომდევნო სწავლისას თქვენს შესწორებას დაიტოვებს.
      </p>
      <textarea
        className="tpl-input"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={8000}
        placeholder="ჯერ ცარიელია — დააჭირეთ „ახლავე შეისწავლე“."
      />
      <div className="admin-form-actions">
        <button
          type="button"
          className="admin-btn-primary"
          onClick={() => run({ action: "ai-learned", text }, "✓ შენახულია.")}
          disabled={Boolean(status?.busy) || !changed}
        >
          {status?.busy === "ai-learned" ? "..." : "შენახვა"}
        </button>
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() => run({ action: "ai-learn" }, "✓ AI-მ მიმოწერა ხელახლა შეისწავლა.")}
          disabled={Boolean(status?.busy) || changed}
          title={changed ? "ჯერ შეინახეთ ცვლილებები" : ""}
        >
          {status?.busy === "ai-learn" ? "სწავლობს..." : "ახლავე შეისწავლე"}
        </button>
        <small>{text.length} / 8000</small>
        {status?.ok && !changed && <span className="wa-connected">{status.ok}</span>}
        {status?.error && <span className="wa-warn">{status.error}</span>}
      </div>
    </details>
  );
}

// The owner's rules for the assistant, added to every request (they win over
// the built-in ones). Text from Word or anywhere else can be pasted in.
function AiInstructions({ saved }) {
  const [text, setText] = useState(saved);
  const [status, setStatus] = useState(null);
  const changed = text !== saved;
  // A save (here or in another tab) brings the stored text back in.
  useEffect(() => setText(saved), [saved]);

  const save = async () => {
    setStatus({ busy: true });
    try {
      await inboxAction({ action: "ai-instructions", text });
      setStatus({ ok: "✓ შენახულია — AI ამას მომდევნო პასუხიდან გაითვალისწინებს." });
    } catch (err) {
      setStatus({ error: err.message });
    }
  };

  return (
    <details className="inbox-ai-rules">
      <summary>📝 AI-ის წესები {saved.trim() ? `(${saved.trim().split("\n").filter(Boolean).length} ხაზი)` : "(ცარიელი)"}</summary>
      <p className="admin-hint">
        დაწერეთ ან Word-იდან ჩააკოპირეთ, რა უნდა გაითვალისწინოს AI-მ, თითო წესი ცალკე ხაზზე. მაგ.: „კომპანიის სახელი ყოველთვის
        ლათინურად დაწერე: GeorgiaTrips (არა „ჯორჯიატრიპსი“)“. ეს წესები AI-ის სხვა წესებზე მაღლა დგას.
      </p>
      <textarea className="tpl-input" rows={8} value={text} onChange={(e) => setText(e.target.value)} maxLength={8000} />
      <div className="admin-form-actions">
        <button type="button" className="admin-btn-primary" onClick={save} disabled={status?.busy || !changed}>
          {status?.busy ? "..." : "შენახვა"}
        </button>
        <small>{text.length} / 8000</small>
        {status?.ok && !changed && <span className="wa-connected">{status.ok}</span>}
        {status?.error && <span className="wa-warn">{status.error}</span>}
      </div>
    </details>
  );
}
