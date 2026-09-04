"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { STATUS_CONFIG, getBookingStatusLabel } from "../../lib/bookingModel";
import { WA_LINK, WA_NUMBER, PHONE_DISPLAY } from "../../lib/shared";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";

export default function BookingStatusPage() {
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const { format } = useCurrency();

  const initialId = searchParams.get("id") || "";

  const [bookingIdInput, setBookingIdInput] = useState(initialId);
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    const bId = bookingIdInput.trim().toUpperCase();
    const phone = phoneInput.trim();

    if (!bId) {
      setError(t("bookingStatus.errorEmptyId", "გთხოვთ შეიყვანოთ ჯავშნის ნომერი (მაგ. GT-260904-XXXX)"));
      return;
    }
    if (!phone) {
      setError(t("bookingStatus.errorEmptyPhone", "გთხოვთ შეიყვანოთ დაჯავშნისას მითითებული ტელეფონის ნომერი"));
      return;
    }

    setLoading(true);
    setError("");
    setBookingResult(null);

    try {
      const res = await fetch(
        `/api/bookings/status?bookingId=${encodeURIComponent(bId)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();

      if (res.ok && data.success && data.booking) {
        setBookingResult(data.booking);
      } else {
        setError(data.error || t("bookingStatus.errorNotFound", "ჯავშანი მითითებული მონაცემებით ვერ მოიძებნა"));
      }
    } catch (err) {
      setError(t("bookingStatus.errorServer", "სერვერთან კავშირის შეცდომა. გთხოვთ სცადოთ მოგვიანებით."));
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = bookingResult?.status || "pending";
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const statusLabel = getBookingStatusLabel(currentStatus, lang);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3rem 1rem 5rem", maxWidth: "620px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0d233a", marginBottom: "0.5rem" }}>
            {t("bookingStatus.title", "ჯავშნის სტატუსის შემოწმება")}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem" }}>
            {t("bookingStatus.subtitle", "შეიყვანეთ თქვენი ჯავშნის ID და ტელეფონის ნომერი მიმდინარე სტატუსის სანახავად")}
          </p>
        </div>

        {/* Lookup Form Card */}
        <div
          style={{
            background: "#ffffff",
            padding: "2rem",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(13, 35, 58, 0.06)",
            border: "1px solid #e2e8f0",
            marginBottom: "2rem",
          }}
        >
          <form onSubmit={handleLookup} style={{ display: "grid", gap: "1.2rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                {t("bookingStatus.bookingIdLabel", "ჯავშნის ნომერი (Booking ID)")}
              </label>
              <input
                type="text"
                placeholder={t("bookingStatus.bookingIdPlaceholder", "მაგ: GT-260904-ABCD")}
                value={bookingIdInput}
                onChange={(e) => setBookingIdInput(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  outline: "none",
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                {t("bookingStatus.phoneLabel", "ტელეფონის ნომერი")}
              </label>
              <input
                type="tel"
                placeholder={t("bookingStatus.phonePlaceholder", "მაგ: 599123456 ან +995 5XX XX XX XX")}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "1rem",
                  outline: "none",
                }}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  color: "#991b1b",
                  fontSize: "0.88rem",
                  lineHeight: 1.4,
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#0d9488",
                color: "#ffffff",
                padding: "0.85rem",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "1rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(13, 148, 136, 0.3)",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? t("bookingStatus.checking", "მოწმდება...") : t("bookingStatus.checkBtn", "სტატუსის შემოწმება")}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {bookingResult && (
          <div
            style={{
              background: "#ffffff",
              padding: "2rem",
              borderRadius: "20px",
              boxShadow: "0 12px 35px rgba(13, 35, 58, 0.08)",
              border: `2px solid ${statusInfo.borderColor}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  {t("bookingSuccess.idLabel", "ჯავშნის ID")}
                </span>
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", fontFamily: "monospace" }}>
                  {bookingResult.bookingId}
                </h3>
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.45rem 1rem",
                  borderRadius: "999px",
                  background: statusInfo.bgColor,
                  border: `1.5px solid ${statusInfo.borderColor}`,
                  color: statusInfo.color,
                  fontWeight: 800,
                  fontSize: "0.95rem",
                }}
              >
                <span>{statusInfo.icon}</span>
                <span>{statusLabel}</span>
              </div>
            </div>

            {/* Cancellation reason if cancelled */}
            {bookingResult.status === "cancelled" && bookingResult.cancellationReason && (
              <div
                style={{
                  padding: "0.85rem 1.1rem",
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "10px",
                  color: "#991b1b",
                  fontSize: "0.88rem",
                  marginBottom: "1.25rem",
                }}
              >
                <strong>გაუქმების მიზეზი:</strong> {bookingResult.cancellationReason}
              </div>
            )}

            {/* Confirmed message if confirmed */}
            {bookingResult.status === "confirmed" && (
              <div
                style={{
                  padding: "0.85rem 1.1rem",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: "10px",
                  color: "#065f46",
                  fontSize: "0.88rem",
                  marginBottom: "1.25rem",
                }}
              >
                🎉 <strong>{statusLabel}!</strong>
              </div>
            )}

            <div style={{ display: "grid", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{t("bookingSuccess.tour", "ტური")}:</span>
                <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{bookingResult.tourTitle}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{t("bookingSuccess.date", "თარიღი")}:</span>
                <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{bookingResult.date}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{t("bookingSuccess.travelers", "მგზავრები")}:</span>
                <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{bookingResult.totalPeople} {t("bookingSuccess.peopleSuffix", "ადამიანი")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ color: "#64748b", fontSize: "0.9rem" }}>{t("bookingSuccess.totalCost", "ფასი")}:</span>
                <strong style={{ color: "#0d9488", fontSize: "1.1rem" }}>{format(bookingResult.totalPrice, lang)}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <a
                href={`${WA_LINK}?text=${encodeURIComponent(`Hello, I have a question regarding my booking ${bookingResult.bookingId}.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#25D366",
                  color: "#ffffff",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                }}
              >
                💬 WhatsApp
              </a>
              <a
                href={`tel:${WA_NUMBER}`}
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "#f1f5f9",
                  color: "#334155",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  border: "1px solid #e2e8f0",
                }}
              >
                📞 {PHONE_DISPLAY}
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
