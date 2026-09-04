"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { STATUS_CONFIG, getBookingStatusLabel } from "../../../lib/bookingModel";
import { WA_LINK, WA_NUMBER } from "../../../lib/shared";
import { useLanguage } from "../../../lib/i18n/LanguageContext";
import { useCurrency } from "../../../lib/currency/CurrencyContext";

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();
  const { format } = useCurrency();

  const bookingId = (params?.bookingId || "").toUpperCase();
  const queryToken = searchParams.get("token") || "";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    let effectiveToken = queryToken;
    if (!effectiveToken && typeof window !== "undefined") {
      try {
        const stored = JSON.parse(sessionStorage.getItem("gt_last_booking") || "{}");
        if (stored && stored.bookingId === bookingId && stored.token) {
          effectiveToken = stored.token;
        }
      } catch (_) {}
    }

    let isMounted = true;
    fetch(`/api/bookings/status?bookingId=${encodeURIComponent(bookingId)}&token=${encodeURIComponent(effectiveToken)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error || t("bookingSuccess.errorTitle", "ჯავშნის მონაცემები ვერ მოიძებნა"));
        }
      })
      .catch(() => {
        if (isMounted) setError(t("bookingStatus.errorServer", "კავშირის შეცდომა"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, queryToken, t]);

  const currentStatus = booking?.status || "pending";
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const statusLabel = getBookingStatusLabel(currentStatus, lang);

  const waGreeting = t("bookingSuccess.waMessageGreeting", "გამარჯობა, საიტზე გავაფორმე ჯავშანი");
  const waMessage = booking
    ? `✈️ *GeorgiaTrips — Booking Confirmation*\n━━━━━━━━━━━━━━━━━━\n🆔 *ID:* ${booking.bookingId}\n📍 *Tour:* ${booking.tourTitle}\n📅 *Date:* ${booking.date}\n👥 *Travelers:* ${booking.totalPeople}\n💰 *Total:* ₾${booking.totalPrice} GEL\n\n${waGreeting} ${booking.bookingId}.`
    : "";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <Navbar />

      <main style={{ flex: 1, padding: "3rem 1rem 5rem", maxWidth: "680px", margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <div className="spinner" style={{ margin: "0 auto 1.5rem" }} />
            <p style={{ color: "#64748b", fontWeight: 500 }}>{t("bookingSuccess.loading", "ჯავშნის მონაცემები იტვირთება...")}</p>
          </div>
        ) : error ? (
          <div
            style={{
              background: "#ffffff",
              padding: "2.5rem 2rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              textAlign: "center",
              border: "1px solid #fee2e2",
            }}
          >
            <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>⚠️</span>
            <h1 style={{ fontSize: "1.5rem", color: "#1e293b", marginBottom: "0.5rem" }}>
              {t("bookingSuccess.errorTitle", "ჯავშანი ვერ მოიძებნა")}
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem" }}>{error}</p>
            <Link
              href="/booking/status"
              style={{
                display: "inline-block",
                background: "#0d9488",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                borderRadius: "10px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t("bookingSuccess.checkByPhone", "სტატუსის შემოწმება ნომრით")}
            </Link>
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(13, 35, 58, 0.08)",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              overflow: "hidden",
            }}
          >
            {/* Top Accent Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #0d233a 0%, #0f365d 100%)",
                color: "#ffffff",
                padding: "2.5rem 2rem 2rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "2px solid #10b981",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  margin: "0 auto 1.2rem",
                }}
              >
                ✓
              </div>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 800, margin: "0 0 0.4rem" }}>
                {t("bookingSuccess.title", "ჯავშანი წარმატებით მიღებულია!")}
              </h1>
              <p style={{ color: "#cbd5e1", fontSize: "0.95rem", margin: 0 }}>
                {t("bookingSuccess.subtitle", "მადლობა, რომ ირჩევთ GeorgiaTrips-ს. თქვენი განაცხადი დარეგისტრირდა სისტემაში.")}
              </p>
            </div>

            {/* Content Body */}
            <div style={{ padding: "2rem" }}>
              {/* Booking ID & Status Chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "1rem 1.25rem",
                  background: "#f1f5f9",
                  borderRadius: "14px",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, display: "block" }}>
                    {t("bookingSuccess.idLabel", "ჯავშნის ნომერი (ID)")}
                  </span>
                  <strong style={{ fontSize: "1.25rem", color: "#0f172a", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                    {booking.bookingId}
                  </strong>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.4rem 0.9rem",
                    borderRadius: "999px",
                    background: statusInfo.bgColor,
                    border: `1px solid ${statusInfo.borderColor}`,
                    color: statusInfo.color,
                    fontWeight: 700,
                    fontSize: "0.88rem",
                  }}
                >
                  <span>{statusInfo.icon}</span>
                  <span>{statusLabel}</span>
                </div>
              </div>

              {/* Status Explanation Box */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "12px",
                  background: "rgba(234, 179, 8, 0.08)",
                  border: "1px solid rgba(234, 179, 8, 0.25)",
                  color: "#854d0e",
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  marginBottom: "1.75rem",
                }}
              >
                <strong>ℹ️ {t("bookingSuccess.whatNextTitle", "რა ხდება შემდეგ?")}</strong> {t("bookingSuccess.whatNextDesc", "თქვენი ჯავშანი მიღებულია და ოპერატორი ამოწმებს თავისუფალ ადგილებს. უმოკლეს დროში მიიღებთ შეტყობინებას WhatsApp-ზე ან ზარს დეტალების დასადასტურებლად.")}
              </div>

              {/* Details List */}
              <div style={{ display: "grid", gap: "0.85rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>📍 {t("bookingSuccess.tour", "ტური")}:</span>
                  <strong style={{ color: "#1e293b", fontSize: "0.95rem", textAlign: "right" }}>{booking.tourTitle}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>📅 {t("bookingSuccess.date", "თარიღი")}:</span>
                  <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{booking.date}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>👥 {t("bookingSuccess.travelers", "მგზავრები")}:</span>
                  <strong style={{ color: "#1e293b", fontSize: "0.95rem" }}>{booking.totalPeople} {t("bookingSuccess.peopleSuffix", "ადამიანი")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>
                  <span style={{ color: "#64748b", fontSize: "0.9rem" }}>💰 {t("bookingSuccess.totalCost", "ჯამური ღირებულება")}:</span>
                  <strong style={{ color: "#0d9488", fontSize: "1.2rem", fontWeight: 800 }}>{format(booking.totalPrice, lang)}</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "grid", gap: "0.85rem" }}>
                <a
                  href={`${WA_LINK}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    background: "#25D366",
                    color: "#ffffff",
                    padding: "0.95rem 1.5rem",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "1rem",
                    textDecoration: "none",
                    boxShadow: "0 6px 20px rgba(37, 211, 102, 0.35)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>💬</span>
                  <span>{t("bookingSuccess.confirmWhatsApp", "WhatsApp-ში დადასტურება")}</span>
                </a>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <Link
                    href={`/booking/status?id=${encodeURIComponent(booking.bookingId)}`}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: "#f1f5f9",
                      color: "#334155",
                      padding: "0.8rem 1rem",
                      borderRadius: "12px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    🔍 {t("bookingSuccess.checkStatus", "სტატუსის შემოწმება")}
                  </Link>

                  <Link
                    href="/tours"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      background: "#ffffff",
                      color: "#0f172a",
                      padding: "0.8rem 1rem",
                      borderRadius: "12px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    {t("bookingSuccess.otherTours", "სხვა ტურები")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
