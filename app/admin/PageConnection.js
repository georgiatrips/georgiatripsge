"use client";

import React, { useEffect, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// Facebook Page and Instagram connection settings for the admin inbox
// (InboxManager.js). Both channels go through the Page and its token.

const CHANNELS = { messenger: "Messenger", instagram: "Instagram" };

export default function PageConnection() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);

  const loadStatus = async () => {
    const entries = await Promise.all(
      Object.keys(CHANNELS).map(async (channel) => {
        try {
          const res = await adminFetch(`/api/admin/messenger?channel=${channel}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          return [channel, data];
        } catch (err) {
          return [channel, { connected: false, loadError: err.message }];
        }
      })
    );
    setStatus(Object.fromEntries(entries));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const connected = status && Object.values(status).every((s) => s.connected);

  return (
    <>
      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}
      {!status && <p className="admin-hint">Messenger / Instagram: იტვირთება...</p>}
      {status &&
        Object.entries(CHANNELS).map(([channel, label]) => {
          const s = status[channel];
          if (s.loadError) return <p key={channel} className="admin-hint wa-warn">{label}: სტატუსი ვერ ჩაიტვირთა — {s.loadError}</p>;
          return s.connected ? (
            <p key={channel} className="admin-hint wa-connected">
              ✅ {label}: <strong>{s.pageName}</strong>
            </p>
          ) : (
            <p key={channel} className="admin-hint wa-warn">{label}: არ არის მიერთებული</p>
          );
        })}
      <PageConnect
        open={status && !connected}
        onConnected={(data) => {
          setMessage({ type: "success", text: `✓ მიერთდა ${data.pageName}${data.igUsername ? ` და @${data.igUsername}` : ""}.` });
          loadStatus();
        }}
      />
    </>
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
