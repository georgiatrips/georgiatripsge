"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// Admin "მეილები": the company's Gmail inbox as short Georgian notes written
// by Gemini (what the mail is, what it asks of us, why it matters, what to
// do), the important ones on top. Reading and summarizing is in
// app/lib/server/mailReader.js; nothing here sends or changes any mail.

const LEVELS = {
  3: { label: "მნიშვნელოვანი", tone: "high" },
  2: { label: "საშუალო", tone: "medium" },
  1: { label: "ნაკლებად მნიშვნელოვანი", tone: "low" },
};

const CATEGORY_LABELS = {
  customer: "👤 კლიენტი",
  partner: "🤝 პარტნიორი",
  finance: "💳 ფინანსები",
  legal: "⚖️ იურიდიული",
  account: "🔐 ანგარიში",
  marketing: "📣 რეკლამა",
  notification: "🔔 შეტყობინება",
  spam: "🚫 სპამი / თაღლითობა",
  other: "✉️ სხვა",
};

const when = (ms) =>
  new Date(ms).toLocaleString("ka-GE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

function MailCard({ mail, account, onDone }) {
  const level = LEVELS[mail.importance] || LEVELS[1];
  const link = `https://mail.google.com/mail/?authuser=${encodeURIComponent(account)}#all/${mail.threadId || mail.id}`;
  return (
    <article className={`mlr-card is-${level.tone}${mail.done ? " is-done" : ""}`}>
      <header className="mlr-card-head">
        <span className={`mlr-level is-${level.tone}`}>{level.label}</span>
        <span className="mlr-cat">{CATEGORY_LABELS[mail.category] || CATEGORY_LABELS.other}</span>
        {mail.deadline && <span className="mlr-deadline">⏰ {mail.deadline}</span>}
        <time className="mlr-time">{when(mail.receivedAt)}</time>
      </header>
      <h3 className="mlr-subject">{mail.subject || "(თემის გარეშე)"}</h3>
      <p className="mlr-from">
        {mail.fromName || mail.fromEmail}
        {mail.fromName && <span> · {mail.fromEmail}</span>}
      </p>
      <p className="mlr-summary">{mail.summary}</p>
      <dl className="mlr-facts">
        {mail.asks && (
          <div>
            <dt>რას გვთხოვენ</dt>
            <dd>{mail.asks}</dd>
          </div>
        )}
        {mail.why && (
          <div>
            <dt>რატომ არის მნიშვნელოვანი</dt>
            <dd>{mail.why}</dd>
          </div>
        )}
        {mail.action && (
          <div>
            <dt>რა გავაკეთოთ</dt>
            <dd>{mail.action}</dd>
          </div>
        )}
      </dl>
      <div className="mlr-actions">
        <a className="admin-btn-ghost" href={link} target="_blank" rel="noreferrer">
          Gmail-ში გახსნა
        </a>
        <button type="button" className="admin-btn-ghost" onClick={() => onDone(mail, !mail.done)}>
          {mail.done ? "↩ დაბრუნება" : "✓ მოგვარებულია"}
        </button>
      </div>
    </article>
  );
}

export default function MailManager() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [showLow, setShowLow] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError("");
    setNote("");
    try {
      const res = await adminFetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setData(body);
      const { added = 0, remaining = 0, busy } = body.run || {};
      setNote(
        busy
          ? "მეილები ახლა უკვე იკითხება — ცოტა ხანში სცადეთ."
          : added
            ? `წავიკითხე ${added} ახალი მეილი${remaining > 0 ? `, კიდევ ${remaining} რიგშია — დააჭირეთ ისევ` : ""}.`
            : "ახალი მეილი არ არის."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await adminFetch("/api/admin/mail");
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
        if (!active) return;
        setData(body);
        // Opening the page checks for new mail, unless the 20-minute job just did.
        if (body.ready.gmail && body.ready.gemini && Date.now() - (body.lastSyncAt || 0) > 5 * 60 * 1000) sync();
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [sync]);

  // Back from Google's consent page with a problem (?mail=error&reason=…).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mail") === "error") setError(`Gmail ვერ დაკავშირდა: ${params.get("reason") || ""}`);
  }, []);

  const post = async (action) => {
    const res = await adminFetch("/api/admin/mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  };

  const connect = async () => {
    setError("");
    try {
      window.location.href = (await post("connect")).url;
    } catch (err) {
      setError(err.message);
    }
  };

  const disconnect = async () => {
    if (!confirm("გავთიშოთ Gmail? საიტი მეილებს ვეღარ წაიკითხავს, სანამ თავიდან არ დააკავშირებთ.")) return;
    setError("");
    try {
      setData(await post("disconnect"));
    } catch (err) {
      setError(err.message);
    }
  };

  const markDone = async (mail, done) => {
    setData((prev) => ({ ...prev, mails: prev.mails.map((m) => (m.id === mail.id ? { ...m, done } : m)) }));
    try {
      const res = await adminFetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "done", id: mail.id, done }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      setError(`ვერ შეინახა: ${err.message}`);
      setData((prev) => ({ ...prev, mails: prev.mails.map((m) => (m.id === mail.id ? { ...m, done: !done } : m)) }));
    }
  };

  const groups = useMemo(() => {
    const open = (data?.mails || []).filter((m) => !m.done);
    const byTime = (a, b) => b.receivedAt - a.receivedAt;
    return {
      high: open.filter((m) => m.importance === 3).sort(byTime),
      medium: open.filter((m) => m.importance === 2).sort(byTime),
      low: open.filter((m) => m.importance <= 1).sort(byTime),
      done: (data?.mails || []).filter((m) => m.done).sort(byTime),
    };
  }, [data]);

  if (loading) return <div className="phs-loading">იტვირთება…</div>;

  const ready = data?.ready;
  const connected = ready?.gmail && ready?.gemini;
  const list = (mails) => mails.map((m) => <MailCard key={m.id} mail={m} account={data.email} onDone={markDone} />);

  return (
    <div className="mlr">
      {ready && !connected && (
        <div className="mlr-setup">
          <h3>Gmail-ის დაკავშირება (ერთხელ)</h3>
          <ol>
            {!ready.client && (
              <li>
                <code>GOOGLE_CLIENT_ID</code> და <code>GOOGLE_CLIENT_SECRET</code> არ არის Vercel-ში (Google Cloud Console →
                Credentials → OAuth client, Web application).
              </li>
            )}
            {!ready.gmail && (
              <>
                <li>
                  Google Cloud Console → APIs &amp; Services → Library → <b>Gmail API</b> → Enable (იმავე პროექტში, სადაც
                  GOOGLE_CLIENT_ID არის).
                </li>
                <li>
                  Credentials → თქვენი OAuth client → <b>Authorized redirect URIs</b> → დაამატეთ:{" "}
                  <code>{window.location.origin}/api/admin/mail/callback</code>
                </li>
                <li>
                  OAuth consent screen → Publishing status: <b>In production</b> (Testing რეჟიმში წვდომა 7 დღეში უქმდება).
                </li>
                <li>
                  დააჭირეთ ქვემოთ ღილაკს და შედით იმ Gmail-ით, რომლის მეილებიც უნდა წავიკითხოთ. წვდომა მხოლოდ წაკითხვაზეა.
                </li>
              </>
            )}
            {!ready.gemini && (
              <li>
                <code>GEMINI_API_KEY</code> არ არის Vercel-ში (aistudio.google.com → Get API key).
              </li>
            )}
          </ol>
          {!ready.gmail && (
            <button type="button" className="admin-btn-primary" onClick={connect} disabled={!ready.client}>
              Gmail-ის დაკავშირება
            </button>
          )}
        </div>
      )}

      <div className="mlr-bar">
        <button type="button" className="admin-btn-primary" onClick={sync} disabled={syncing || !connected}>
          {syncing ? "ვკითხულობ მეილებს… (10–40 წამი)" : "🔄 ახალი მეილების შემოწმება"}
        </button>
        <span className="phs-muted">
          {data?.email && `${data.email} · `}
          {data?.lastSyncAt ? `ბოლოს შემოწმდა: ${when(data.lastSyncAt)}` : "ჯერ არ შემოწმებულა"}
        </span>
        {data?.canDisconnect && (
          <button type="button" className="admin-btn-ghost" onClick={disconnect}>
            Gmail-ის გათიშვა
          </button>
        )}
      </div>
      {note && <p className="phs-hint">{note}</p>}
      {(error || data?.lastError) && <div className="phs-error">{error || data.lastError}</div>}

      {connected && !data.mails.length && !syncing && <div className="phs-empty">მეილები ჯერ არ არის წაკითხული.</div>}

      {groups.high.length > 0 && (
        <section className="mlr-section">
          <h2 className="mlr-heading is-high">🔴 მნიშვნელოვანი — საჭიროა თქვენი ყურადღება ({groups.high.length})</h2>
          <div className="mlr-list">{list(groups.high)}</div>
        </section>
      )}

      {groups.medium.length > 0 && (
        <section className="mlr-section">
          <h2 className="mlr-heading">🟡 საშუალო ({groups.medium.length})</h2>
          <div className="mlr-list">{list(groups.medium)}</div>
        </section>
      )}

      {groups.low.length > 0 && (
        <section className="mlr-section">
          <button type="button" className="mlr-toggle" onClick={() => setShowLow((v) => !v)} aria-expanded={showLow}>
            {showLow ? "▾" : "▸"} ⚪ ნაკლებად მნიშვნელოვანი — რეკლამა, ავტომატური შეტყობინებები ({groups.low.length})
          </button>
          {showLow && <div className="mlr-list">{list(groups.low)}</div>}
        </section>
      )}

      {groups.done.length > 0 && (
        <section className="mlr-section">
          <button type="button" className="mlr-toggle" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
            {showDone ? "▾" : "▸"} ✓ მოგვარებული ({groups.done.length})
          </button>
          {showDone && <div className="mlr-list">{list(groups.done)}</div>}
        </section>
      )}

      <p className="phs-hint">
        შეჯამებას Gemini წერს და შეიძლება შეცდეს — გადახდამდე ან პასუხამდე თვითონ მეილი გახსენით. საიტი მეილებს მხოლოდ
        კითხულობს: არაფერს აგზავნის, შლის ან ცვლის.
      </p>
    </div>
  );
}
