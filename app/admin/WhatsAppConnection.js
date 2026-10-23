"use client";

import React, { useEffect, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import {
  GRAPH_API_VERSION,
  WA_CONNECT_STATE,
  WHATSAPP_APP_ID,
  WHATSAPP_SIGNUP_CONFIG_ID,
} from "../lib/whatsappConfig";

// WhatsApp connection settings for the admin inbox (InboxManager.js): the
// business phone is mirrored through coexistence, so its chats, the replies
// sent from the phone and the imported history all show up there.

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

export default function WhatsAppConnection() {
  const [status, setStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

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

  const retrySync = async () => {
    setSyncing(true);
    try {
      const res = await adminFetch("/api/admin/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const failed = Object.values(data.sync).find((v) => v !== "requested");
      if (failed) throw new Error(failed);
      showMsg("success", "✓ მოთხოვნა გაიგზავნა. ძველი მიმოწერა და კონტაქტები რამდენიმე წუთში გამოჩნდება.");
      await loadStatus();
    } catch (err) {
      showMsg("error", err.message);
    } finally {
      setSyncing(false);
    }
  };

  const startConnect = () => {
    setConnecting(true);
    window.location.assign(signupUrl());
  };

  const env = status?.env;
  const missing = [
    !WHATSAPP_SIGNUP_CONFIG_ID && "Embedded Signup-ის Configuration ID (კოდში)",
    env && !env.appSecret && "WHATSAPP_APP_SECRET (Vercel)",
    env && !env.verifyToken && "WHATSAPP_VERIFY_TOKEN (Vercel)",
    env && !env.database && "DATABASE_URL (Vercel → Storage → Neon)",
  ].filter(Boolean);
  const tokenDaysLeft = status?.tokenExpiresAt
    ? Math.max(0, Math.floor((status.tokenExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  return (
    <>
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

      {!status && <p className="admin-hint">WhatsApp: იტვირთება...</p>}
      {status?.connected && (
        <p className="admin-hint wa-connected">
          ✅ WhatsApp: <strong>{status.displayPhone}</strong>
          {status.verifiedName && ` · ${status.verifiedName}`}
          {status.historyProgress && status.historyProgress.progress < 100 && ` · ძველი მიმოწერა იტვირთება: ${status.historyProgress.progress}%`}
          {status.historyError && ` · ისტორია არ გადმოვიდა: ${status.historyError}`}
          {status.sync && Object.values(status.sync).some((v) => v !== "requested") && (
            <>
              {" "}
              <button type="button" className="admin-btn-ghost wa-reconnect" onClick={retrySync} disabled={syncing}>
                {syncing ? "..." : "ძველი მიმოწერის გადმოტანა"}
              </button>
            </>
          )}
          {tokenDaysLeft !== null && tokenDaysLeft <= 10 && (
            <span className="wa-warn"> · Meta-ს წვდომის ვადა იწურება {tokenDaysLeft} დღეში</span>
          )}{" "}
          <button type="button" className="admin-btn-ghost wa-reconnect" onClick={startConnect} disabled={connecting}>
            {connecting ? "მიმდინარეობს..." : "ნომრის შეცვლა / თავიდან მიერთება"}
          </button>
        </p>
      )}

      <TokenConnect
        onConnected={(data) => {
          showMsg("success", `✓ მიერთდა ${data.displayPhone}. ძველი მიმოწერა რამდენიმე წუთში გამოჩნდება.`);
          loadStatus();
        }}
      />
    </>
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
