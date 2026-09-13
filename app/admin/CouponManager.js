"use client";

import React, { useState, useEffect } from "react";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../lib/coupons";
import {
  getCouponSettings,
  updateCouponSettings,
  listClaimedIps,
  clearAllClaimedIps,
} from "../lib/couponSettings";
import CouponTicket from "../components/CouponTicket";

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [limitOnePerIp, setLimitOnePerIp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claimedIps, setClaimedIps] = useState([]);
  const [message, setMessage] = useState(null);

  // Form State for Creating/Editing Coupon
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState("");
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    discountPercent: 10,
    maxDiscountGEL: 100,
    usageType: "multiple", // "single" | "multiple" | "unlimited"
    maxUses: 100,
    expiresAt: "",
    limitOnePerIp: true,
    active: true,
  });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [couponList, settings, ips] = await Promise.all([
        listCoupons(),
        getCouponSettings(),
        listClaimedIps(),
      ]);
      setCoupons(couponList);
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
          ? "✓ 1 IP შეზღუდვა ჩაირთო! თითო IP მისამართიდან მხოლოდ 1 კუპონის გამოყენება იქნება შესაძლებელი."
          : "✓ 1 IP შეზღუდვა გაითიშა (ტესტირების რეჟიმი)."
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

  const resetForm = () => {
    setIsEditing(false);
    setEditCode("");
    setFormData({
      code: "",
      title: "",
      discountPercent: 10,
      maxDiscountGEL: 100,
      usageType: "multiple",
      maxUses: 100,
      expiresAt: "",
      limitOnePerIp: true,
      active: true,
    });
  };

  const handleEditClick = (coupon) => {
    setIsEditing(true);
    setEditCode(coupon.code);
    setFormData({
      code: coupon.code,
      title: coupon.title || "",
      discountPercent: coupon.discountPercent || 10,
      maxDiscountGEL: coupon.maxDiscountGEL || 0,
      usageType: coupon.usageType || (coupon.maxUses === 1 ? "single" : "multiple"),
      maxUses: coupon.maxUses || 100,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
      limitOnePerIp: coupon.limitOnePerIp !== false,
      active: coupon.active !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      showMsg("error", "გთხოვთ მიუთითოთ კუპონის პრომო კოდი");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        discountPercent: parseInt(formData.discountPercent, 10) || 10,
        maxDiscountGEL: parseInt(formData.maxDiscountGEL, 10) || 0,
        maxUses: formData.usageType === "single" ? 1 : parseInt(formData.maxUses, 10) || 100,
      };

      await createCoupon(payload);
      showMsg("success", `✓ კუპონი „${payload.code}“ წარმატებით ${isEditing ? "განახლდა" : "შეიქმნა"}!`);
      resetForm();
      await loadData();
    } catch (err) {
      console.error("Save coupon error:", err);
      showMsg("error", err.message || "კუპონის შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCouponActive = async (coupon) => {
    setSaving(true);
    try {
      const newStatus = !coupon.active;
      await updateCoupon(coupon.code, { active: newStatus });
      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? { ...c, active: newStatus } : c))
      );
      showMsg("success", `✓ კუპონი „${coupon.code}“ ${newStatus ? "გააქტიურდა" : "დეაქტივირდა"}`);
    } catch (err) {
      showMsg("error", "სტატუსის შეცვლა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!confirm(`ნამდვილად გსურთ კუპონის „${code}“ წაშლა?`)) return;
    setSaving(true);
    try {
      await deleteCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      showMsg("success", `✓ კუპონი „${code}“ წარმატებით წაიშალა`);
    } catch (err) {
      showMsg("error", "კუპონის წაშლა ვერ მოხერხდა");
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

      {/* 1. COUPON CREATION & EDITING CARD */}
      <div className="admin-card" style={{ background: "#ffffff", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.6rem" }}>{isEditing ? "✏️" : "➕"}</span>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>
                {isEditing ? `კუპონის რედაქტირება: ${editCode}` : "ახალი ფასდაკლების კუპონის შექმნა"}
              </h2>
              <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", margin: 0 }}>
                შექმენით ერთჯერადი ან მრავალჯერადი კუპონები, რომლებიც დაუყოვნებლივ გააქტიურდება საიტზე.
              </p>
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={resetForm}
              style={{ fontSize: "0.85rem" }}
            >
              ✕ გაუქმება
            </button>
          )}
        </div>

        <form onSubmit={handleSaveCoupon}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "1.2rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                პრომო კოდი (ინგლისურად) *
              </label>
              <input
                type="text"
                placeholder="მაგ: SUMMER2026, VIP15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={isEditing}
                required
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontWeight: 800, letterSpacing: "1px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                კუპონის სახელწოდება / დანიშნულება
              </label>
              <input
                type="text"
                placeholder="მაგ: საზაფხულო აქცია 15%"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                ფასდაკლების პროცენტი (%) *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                required
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontWeight: 800, color: "var(--teal)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                მაქსიმალური ლიმიტი (₾ GEL Cap)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0 = შეუზღუდავი"
                value={formData.maxDiscountGEL}
                onChange={(e) => setFormData({ ...formData, maxDiscountGEL: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "1.5rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                გამოყენების ტიპი *
              </label>
              <select
                value={formData.usageType}
                onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontWeight: 700 }}
              >
                <option value="multiple">მრავალჯერადი (Multiple Uses)</option>
                <option value="single">ერთჯერადი (Single Use - 1 time)</option>
                <option value="unlimited">შეუზღუდავი (Unlimited)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                მაქსიმალური გამოყენების რაოდენობა
              </label>
              <input
                type="number"
                min="1"
                disabled={formData.usageType === "single"}
                value={formData.usageType === "single" ? 1 : formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                მოქმედების ვადა (Expiration Date)
              </label>
              <input
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="admin-input"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #cbd5e1" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 700, color: "#334155", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.limitOnePerIp}
                  onChange={(e) => setFormData({ ...formData, limitOnePerIp: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>მხოლოდ 1 გამოყენება თითო IP-ზე</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", fontWeight: 700, color: "#10b981", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>აქტიურია დაუყოვნებლივ ✓</span>
              </label>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "var(--teal)",
                color: "#081b29",
                border: "none",
                borderRadius: "12px",
                padding: "12px 28px",
                fontWeight: 900,
                fontSize: "0.95rem",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(41, 178, 183, 0.3)",
              }}
            >
              {saving ? "ინახება..." : isEditing ? "✓ ცვლილებების შენახვა" : "➕ კუპონის დამატება"}
            </button>
          </div>
        </form>
      </div>

      {/* 2. ACTIVE COUPONS DIRECTORY */}
      <div className="admin-card" style={{ background: "#ffffff", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-dark)", margin: 0 }}>
              📋 აქტიური კუპონების სია ({coupons.length})
            </h3>
            <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", margin: 0 }}>
              მხოლოდ აქ არსებული და აქტიური კუპონებით მიიღებს მომხმარებელი ფასდაკლებას.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>🔄 განახლება</span>
          </button>
        </div>

        {coupons.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "#64748b" }}>კუპონები ჯერ არ არის შექმნილი.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>კოდი</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>დასახელება</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>ფასდაკლება</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>გამოყენება</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569" }}>სტატუსი</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: "#475569", textAlign: "right" }}>მოქმედება</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const used = parseInt(c.usedCount, 10) || 0;
                  const max = parseInt(c.maxUses, 10) || 100;
                  const percentUsed = Math.min(100, Math.round((used / max) * 100));

                  return (
                    <tr key={c.id || c.code} style={{ borderBottom: "1px solid #e2e8f0" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "1rem", color: "var(--teal)", background: "rgba(41, 178, 183, 0.1)", padding: "4px 8px", borderRadius: "6px" }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", fontWeight: 600, color: "#1e293b" }}>
                        {c.title || "—"}
                        {c.expiresAt && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            ვადა: {c.expiresAt.split("T")[0]}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <strong style={{ color: "#fab418", fontSize: "1.05rem" }}>{c.discountPercent}% OFF</strong>
                        {c.maxDiscountGEL > 0 && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Max ₾{c.maxDiscountGEL}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 800 }}>{used} / {c.usageType === "single" ? "1 (ერთჯერადი)" : max}</span>
                        </div>
                        {c.usageType !== "single" && (
                          <div style={{ width: "100px", height: "6px", background: "#e2e8f0", borderRadius: "3px", marginTop: "4px", overflow: "hidden" }}>
                            <div style={{ width: `${percentUsed}%`, height: "100%", background: percentUsed >= 100 ? "#ef4444" : "var(--teal)" }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleCouponActive(c)}
                          style={{
                            border: "none",
                            borderRadius: "20px",
                            padding: "4px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            cursor: "pointer",
                            background: c.active ? "#dcfce7" : "#fee2e2",
                            color: c.active ? "#15803d" : "#b91c1c",
                          }}
                        >
                          {c.active ? "● აქტიური" : "○ გამორთული"}
                        </button>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleEditClick(c)}
                            style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "0.82rem" }}
                            title="რედაქტირება"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.code)}
                            style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "6px 10px", cursor: "pointer", fontSize: "0.82rem", color: "#b91c1c" }}
                            title="წაშლა"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. GLOBAL IP SECURITY CARD */}
      <div className="admin-card" style={{ background: "#ffffff", borderRadius: "18px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
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
                გლობალური 1 IP შეზღუდვის წესი
              </strong>
              <span style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: "10px",
                background: limitOnePerIp ? "#10b981" : "#fab418",
                color: "#ffffff"
              }}>
                {limitOnePerIp ? "ჩართულია (STRICT)" : "გამორთულია (ტესტირება)"}
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-mute)", margin: 0, lineHeight: 1.45 }}>
              {limitOnePerIp
                ? "აქტიურია მკაცრი რეჟიმი: როდესაც მომხმარებელი აიღებს კუპონს, ამ IP მისამართიდან განმეორებით კუპონის მოთხოვნა შეიზღუდება."
                : "აქტიურია ტესტირების რეჟიმი: კუპონის ფანჯარა ნებისმიერ დროს ხელმისაწვდომია ტესტირებისთვის."}
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
            }}
          >
            {saving ? "ინახება..." : limitOnePerIp ? "გამორთვა (ტესტირება)" : "ჩართვა (1 IP შეზღუდვა)"}
          </button>
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
    </div>
  );
}
