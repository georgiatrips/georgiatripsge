"use client";

import React, { useState } from "react";
import { adminFetch } from "../lib/apiClient";

export const emptyLangObj = () => ({ ka: "", en: "", ru: "", tr: "", ar: "" });

export const parseLocal = (val) => {
  if (!val) return emptyLangObj();
  if (typeof val === "string") return { ...emptyLangObj(), ka: val };
  return { ...emptyLangObj(), ...val };
};

export default function LocalizedInputGroup({
  label,
  type = "input",
  value,
  onChange,
  placeholder,
  required,
  rows = 3,
}) {
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");
  const safeValue =
    typeof value === "object" && value !== null
      ? value
      : { ka: typeof value === "string" ? value : "", en: "", ru: "", tr: "", ar: "" };

  const getValueForLang = (l) => {
    const val = safeValue[l];
    if (typeof val === "string") return val;
    if (typeof val === "number") return String(val);
    return "";
  };

  const handleTranslate = async () => {
    const kaText = getValueForLang("ka");
    if (!kaText) return;
    setTranslating(true);
    setTranslateError("");
    const newValues = { ...safeValue };
    const missingTargets = ["en", "ru", "tr", "ar"].filter((t) => !getValueForLang(t));
    
    if (missingTargets.length === 0) {
      setTranslating(false);
      return;
    }

    try {
      const res = await adminFetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: kaText, targets: missingTargets }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { error: `თარგმნის შეცდომა (სტატუსი: ${res.status})` };
      }

      if (!res.ok) {
        throw new Error(data?.error || `თარგმნის შეცდომა (${res.status})`);
      }

      if (data?.translations) {
        Object.entries(data.translations).forEach(([lang, val]) => {
          if (val) newValues[lang] = val;
        });
      } else if (data?.translatedText && missingTargets.length === 1) {
        newValues[missingTargets[0]] = data.translatedText;
      }
      onChange(newValues);
    } catch (err) {
      console.error("Translation error:", err);
      setTranslateError(err.message || "თარგმნა ვერ მოხერხდა");
    } finally {
      setTranslating(false);
    }
  };

  const LANGS = [
    { code: "ka", label: "KA (ქართული)" },
    { code: "en", label: "EN (English)" },
    { code: "ru", label: "RU (Русский)" },
    { code: "tr", label: "TR (Türkçe)" },
    { code: "ar", label: "AR (العربية)" },
  ];

  return (
    <div
      className="admin-field"
      style={{
        marginBottom: "1.25rem",
        padding: "1rem",
        backgroundColor: "var(--gt-paper)",
        borderRadius: "10px",
        border: "1px solid var(--gt-line)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.85rem",
        }}
      >
        <label style={{ margin: 0, color: "#f8fafc", fontSize: "0.95rem", fontWeight: 600 }}>
          {label} {required && <span style={{ color: "#b42318" }}>*</span>}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {translateError && (
            <span style={{ fontSize: "0.75rem", color: "#b42318" }}>
              {translateError}
            </span>
          )}
          <button
            type="button"
            onClick={handleTranslate}
            disabled={translating || !getValueForLang("ka")}
            className="admin-btn-ghost"
            style={{
              padding: "0.3rem 0.65rem",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "var(--gt-primary-soft)",
              color: "var(--gt-primary)",
              border: "1px solid #b9cfe0",
              borderRadius: "6px",
              cursor: translating || !getValueForLang("ka") ? "not-allowed" : "pointer",
              opacity: translating || !getValueForLang("ka") ? 0.6 : 1,
            }}
          >
            {translating ? "ითარგმნება..." : "ავტო-თარგმნა (KA → ALL)"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {LANGS.map(({ code, label: langLabel }) => (
          <div
            key={code}
            style={{
              display: "flex",
              alignItems: type === "textarea" ? "flex-start" : "center",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                backgroundColor: code === "ka" ? "var(--gt-primary-soft)" : "#fff",
                color: code === "ka" ? "var(--gt-primary-700)" : "#cbd5e1",
                border: code === "ka" ? "1px solid #b9cfe0" : "1px solid var(--gt-line)",
                padding: "0.35rem 0.45rem",
                borderRadius: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "uppercase",
                width: "42px",
                textAlign: "center",
                flexShrink: 0,
                marginTop: type === "textarea" ? "0.25rem" : "0",
              }}
              title={langLabel}
            >
              {code}
            </span>
            {type === "textarea" ? (
              <textarea
                value={getValueForLang(code)}
                onChange={(e) => onChange({ ...safeValue, [code]: e.target.value })}
                placeholder={
                  code === "ka" ? placeholder || "ქართული ტექსტი..." : `${code.toUpperCase()} თარგმანი...`
                }
                required={required && code === "ka"}
                rows={rows}
                dir={code === "ar" ? "rtl" : "ltr"}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1px solid var(--gt-line)",
                  borderRadius: "6px",
                  color: "var(--gt-ink)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.88rem",
                }}
              />
            ) : (
              <input
                value={getValueForLang(code)}
                onChange={(e) => onChange({ ...safeValue, [code]: e.target.value })}
                placeholder={
                  code === "ka" ? placeholder || "ქართული ტექსტი..." : `${code.toUpperCase()} თარგმანი...`
                }
                required={required && code === "ka"}
                dir={code === "ar" ? "rtl" : "ltr"}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1px solid var(--gt-line)",
                  borderRadius: "6px",
                  color: "var(--gt-ink)",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.88rem",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
