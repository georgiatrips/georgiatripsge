"use client";

import React, { useState, useEffect } from "react";
import {
  getCouponSettings,
  updateCouponSettings,
  listClaimedIps,
  clearAllClaimedIps,
} from "../lib/couponSettings";
import CouponTicket from "../components/CouponTicket";

export default function CouponManager() {
  const [limitOnePerIp, setLimitOnePerIp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claimedIps, setClaimedIps] = useState([]);
  const [message, setMessage] = useState(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [settings, ips] = await Promise.all([
        getCouponSettings(),
        listClaimedIps(),
      ]);
      setLimitOnePerIp(settings.limitOnePerIp === true);
      setClaimedIps(ips);
    } catch (err) {
      console.error("Error loading coupon manager data:", err);
      showMsg("error", "მონაცემების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleLimit = async () => {
    const newValue = !limitOnePerIp;
    setSaving(true);
    try {
      await updateCouponSettings({ limitOnePerIp: newValue });
      setLimitOnePerIp(newValue);
      showMsg(
        "success",
        newValue
          ? "✓ 1 IP შეზღუდვა ჩაირთო! თითო ინტერნეტიდან მხოლოდ 1 კუპონის აღება იქნება შესაძლებელი."
          : "✓ 1 IP შეზღუდვა გაითიშა (ტესტირების რეჟიმი)! კუპონი ყოველთვის ამოუგდებს არარეგისტრირებულ მომხმარებელს."
      );
    } catch (err) {
      showMsg("error", "პარამეტრის შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  const handleClearIps = async () => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ დაფიქსირებული IP-ების სიის გასუფთავება?")) {
      return;
    }
    setSaving(true);
    try {
      await clearAllClaimedIps();
      setClaimedIps([]);
      showMsg("success", "✓ დაფიქსირებული IP-ების სია წარმატებით გასუფთავდა!");
    } catch (err) {
      showMsg("error", "IP-ების გასუფთავება ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-coupon-manager" style={{ padding: "10px 0" }}>
      {message && (
        <div className={`admin-alert ${message.type}`} style={{ marginBottom: "1.5rem" }} role="status">
          {message.text}
        </div>
      )}

      {/* Main Settings Card */}
      <div className="admin-card" style={{ background: "#ffffff", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.5rem" }}>🎟️</span>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>
                10%-იანი მისასალმებელი კუპონის პარამეტრები
              </h2>
            </div>
            <p style={{ color: "var(--text-mute)", fontSize: "0.9rem", margin: 0 }}>
              მართეთ საიტზე შემოსვლიდან 10 წამში ამომხტარი 10%-იანი კუპონის ჩვენების წესები და IP შეზღუდვები.
            </p>
          </div>

          <button
            type="button"
            className="admin-btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span>განახლება</span>
          </button>
        </div>

        {/* IP Control Switch Box */}
        <div style={{
          background: limitOnePerIp ? "rgba(16, 185, 129, 0.08)" : "rgba(250, 180, 24, 0.1)",
          border: `1.5px solid ${limitOnePerIp ? "#10b981" : "#fab418"}`,
          borderRadius: "14px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "1.5rem"
        }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "1.2rem" }}>{limitOnePerIp ? "🛡️" : "🧪"}</span>
              <strong style={{ fontSize: "1.05rem", color: "var(--text-dark)" }}>
                ერთ IP-ზე მხოლოდ 1 კუპონის შეზღუდვა
              </strong>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "10px",
                background: limitOnePerIp ? "#10b981" : "#fab418",
                color: "#ffffff"
              }}>
                {limitOnePerIp ? "ჩართულია (STRICT 1 IP)" : "გამორთულია (ტესტირების რეჟიმი)"}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-mute)", margin: 0, lineHeight: 1.45 }}>
              {limitOnePerIp
                ? "აქტიურია მკაცრი რეჟიმი: როდესაც მომხმარებელი დარეგისტრირდება და აიღებს კუპონს, ამ IP მისამართზე (ინტერნეტზე) კუპონის ამომხტარი ფანჯარა აღარასდროს გამოჩნდება."
                : "აქტიურია ტესტირების რეჟიმი: კუპონის მოდალი ყოველთვის ამოუგდებს ყველა არარეგისტრირებულ ვიზიტორს 10 წამში, რათა ნებისმიერ დროს შეძლოთ ტესტირება."}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleLimit}
            disabled={saving}
            style={{
              background: limitOnePerIp ? "#ef4444" : "#10b981",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "12px 22px",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
              transition: "all 0.2s ease"
            }}
          >
            {saving ? "ინახება..." : limitOnePerIp ? "გამორთვა (ტესტირება)" : "ჩართვა (მხოლოდ 1 IP)"}
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "1.5rem" }}>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>პრომო კოდი</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--teal)", marginTop: "4px" }}>WELCOME10</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>ფასდაკლების ოდენობა</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#fab418", marginTop: "4px" }}>10% OFF</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>დაფიქსირებული IP-ები</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>{claimedIps.length}</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>დახურვის წესი</span>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginTop: "6px" }}>მხოლოდ X ღილაკით ✓</div>
          </div>
        </div>

        {/* Claimed IPs Section */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              დაფიქსირებული IP მისამართები ({claimedIps.length})
            </h3>
            {claimedIps.length > 0 && (
              <button
                type="button"
                className="admin-btn-danger"
                onClick={handleClearIps}
                disabled={saving}
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              >
                🗑️ სიის გასუფთავება
              </button>
            )}
          </div>

          {claimedIps.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
              დაფიქსირებული IP მისამართები ჯერ არ არის.
            </p>
          ) : (
            <div style={{ maxHeight: "200px", overflowY: "auto", background: "#f8fafc", borderRadius: "10px", padding: "8px 12px", border: "1px solid #e2e8f0" }}>
              {claimedIps.map((item, idx) => (
                <div key={item.id || idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: idx < claimedIps.length - 1 ? "1px solid #e2e8f0" : "none", fontSize: "0.82rem" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>{item.ip || item.id}</span>
                  <span style={{ color: "#64748b" }}>
                    {item.claimedAt?.toDate ? item.claimedAt.toDate().toLocaleString("ka-GE") : "ახლახანს"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Preview Card */}
      <div className="admin-card" style={{ background: "#ffffff", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "16px" }}>
          👁️ კუპონის ბარათის ვიზუალი (Live Preview)
        </h3>
        <div style={{ maxWidth: "480px" }}>
          <CouponTicket
            code="WELCOME10"
            discountPercent={10}
            isUsed={false}
            showCopy={true}
            showUseBtn={false}
          />
        </div>
      </div>
    </div>
  );
}
