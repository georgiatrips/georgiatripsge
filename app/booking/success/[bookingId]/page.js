"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { STATUS_CONFIG, getStatusLabel } from "../../../lib/bookingModel";
import { WA_LINK, PHONE_DISPLAY, PHONE_TEL } from "../../../lib/shared";
import { useLanguage } from "../../../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../../../lib/siteConfig";
import { formatTourDate } from "../../../lib/tourView";
import { WhatsAppIcon, PhoneIcon, ShieldCheckIcon, WalletIcon } from "../../../components/Icons";
import "../../booking.css";

// Shown right after a booking request. It is the moment a first-time customer
// decides whether the company is real, so it reads like a ticket: what was
// booked, the reference, what happens next, and the fastest way to reach us.
// Everything shown comes from the saved booking or from the site's own terms.

const WA_TEMPLATES = {
  en: (b) => `Hello! I booked on your website and would like to confirm it.\n\nBooking no.: ${b.id}\nTour: ${b.tour}\nDate: ${b.date}\nTravellers: ${b.people}\nTotal: ₾${b.total}`,
  ru: (b) => `Здравствуйте! Я оформил(а) бронирование на сайте и хочу его подтвердить.\n\nНомер брони: ${b.id}\nТур: ${b.tour}\nДата: ${b.date}\nТуристов: ${b.people}\nИтого: ₾${b.total}`,
  tr: (b) => `Merhaba! Web sitenizden rezervasyon yaptım ve onaylamak istiyorum.\n\nRezervasyon no: ${b.id}\nTur: ${b.tour}\nTarih: ${b.date}\nKişi: ${b.people}\nToplam: ₾${b.total}`,
  ar: (b) => `مرحباً! قمت بالحجز عبر موقعكم وأود تأكيده.\n\nرقم الحجز: ${b.id}\nالجولة: ${b.tour}\nالتاريخ: ${b.date}\nعدد المسافرين: ${b.people}\nالإجمالي: ₾${b.total}`,
  ka: (b) => `გამარჯობა! საიტზე გავაფორმე ჯავშანი და მინდა დადასტურება.\n\nჯავშნის №: ${b.id}\nტური: ${b.tour}\nთარიღი: ${b.date}\nმგზავრები: ${b.people}\nჯამი: ₾${b.total}`,
};

export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const bookingId = (params?.bookingId || "").toUpperCase();
  const queryToken = searchParams.get("token") || "";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;

    let isMounted = true;
    let localToken = "";
    let localPhone = "";

    try {
      localToken = localStorage.getItem(`gt_token_${bookingId}`) || "";
      localPhone = localStorage.getItem(`gt_phone_${bookingId}`) || "";
    } catch (_) {}

    const tokenToUse = queryToken || localToken;
    const url = `/api/bookings/status?bookingId=${encodeURIComponent(bookingId)}${tokenToUse ? `&token=${encodeURIComponent(tokenToUse)}` : ""}${localPhone ? `&phone=${encodeURIComponent(localPhone)}` : ""}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.booking) setBooking(data.booking);
        else setError(t("bookingSuccess.notFoundTitle"));
      })
      .catch(() => {
        if (isMounted) setError(t("bookingSuccess.connectionError"));
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bookingId, queryToken, t]);

  const status = booking?.status || "pending";
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  // "by_agreement" is the stored value for private tours booked without a day.
  const dateText =
    booking?.date && /^\d{4}-\d{2}-\d{2}$/.test(booking.date)
      ? formatTourDate(booking.date, lang, { day: "numeric", month: "long", year: "numeric" })
      : t("tourDetail.byAgreement");
  const typeText =
    booking?.type === "transfer"
      ? ""
      : booking?.tourType === "private"
        ? t("tourDetail.privateTour")
        : booking?.tourType === "group"
          ? t("tourDetail.groupTour")
          : "";
  const vehicleName = booking?.vehicle ? t(`transfersPage.vehicles.${booking.vehicle}.name`) : "";
  const vehicleText = vehicleName && !vehicleName.startsWith("transfersPage.") ? vehicleName : "";

  const waText = booking
    ? (WA_TEMPLATES[lang] || WA_TEMPLATES.en)({
        id: booking.bookingId,
        tour: booking.tourTitle,
        date: dateText,
        people: booking.totalPeople,
        total: booking.totalPrice,
      })
    : "";

  const rows = booking
    ? [
        { label: t("bookingSuccess.tourLabel"), value: booking.tourTitle },
        typeText && { label: t("bookingSuccess.typeLabel"), value: typeText },
        vehicleText && { label: t("bookingSuccess.vehicleLabel"), value: vehicleText },
        { label: t("bookingSuccess.dateLabel"), value: dateText },
        { label: t("bookingSuccess.peopleLabel"), value: String(booking.totalPeople ?? "") },
      ].filter(Boolean)
    : [];

  return (
    <div className="gt-bk-page">
      <Navbar />

      <main className="gt-bk-main">
        {loading ? (
          <div className="gt-bk-loading" role="status">
            <div className="spinner" />
            <p>{t("bookingSuccess.loading")}</p>
          </div>
        ) : error ? (
          <div className="gt-bk-card gt-bk-card--error">
            <h1>{t("bookingSuccess.notFoundTitle")}</h1>
            <p>{error}</p>
            <div className="gt-bk-actions">
              <Link href="/booking/status" className="gt-btn gt-btn--navy gt-btn--block">
                {t("bookingSuccess.checkStatusLabel")}
              </Link>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--block">
                <WhatsAppIcon size={18} />
                WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <article className="gt-bk-card">
            <header className="gt-bk-head">
              <span className="gt-bk-check" aria-hidden="true">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h1>{t("bookingSuccess.successTitle")}</h1>
              <p>{t("bookingSuccess.successSubtitle")}</p>
            </header>

            <div className="gt-bk-ref">
              <div>
                <span className="gt-bk-label">{t("bookingSuccess.bookingIdLabel")}</span>
                <strong className="gt-bk-id">{booking.bookingId}</strong>
              </div>
              <span
                className="gt-bk-status"
                style={{ color: statusInfo.color, background: statusInfo.bgColor, borderColor: statusInfo.borderColor }}
              >
                {getStatusLabel(status, lang)}
              </span>
            </div>

            <dl className="gt-bk-rows">
              {rows.map((row) => (
                <div key={row.label} className="gt-bk-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
              <div className="gt-bk-row gt-bk-row--total">
                <dt>{t("bookingSuccess.totalLabel")}</dt>
                <dd>₾{booking.totalPrice}</dd>
              </div>
            </dl>

            {/* The primary action: messaging us is the fastest confirmation. */}
            <section className="gt-bk-cta">
              <p>{t("bookingSuccess.whatsappHint")}</p>
              <a
                href={`${WA_LINK}?text=${encodeURIComponent(waText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gt-btn gt-btn--wa gt-btn--lg gt-btn--block"
              >
                <WhatsAppIcon size={20} />
                {t("bookingSuccess.confirmOnWhatsapp")}
              </a>
              <a href={`tel:${PHONE_TEL}`} className="gt-bk-phone">
                <PhoneIcon size={15} />
                {PHONE_DISPLAY}
              </a>
            </section>

            {status === "pending" && (
              <section className="gt-bk-next">
                <h2>{t("bookingSuccess.nextTitle")}</h2>
                <ol>
                  <li>{t("bookingSuccess.nextStep1")}</li>
                  <li>{t("bookingSuccess.nextStep2")}</li>
                </ol>
              </section>
            )}

            <ul className="gt-bk-terms">
              <li>
                <WalletIcon size={16} />
                {t("tourDetail.trustPay")}
              </li>
              <li>
                <ShieldCheckIcon size={16} />
                {t("tourDetail.trustCancel")}
              </li>
            </ul>

            <div className="gt-bk-actions gt-bk-actions--row">
              <Link href={`/booking/status?id=${encodeURIComponent(booking.bookingId)}`} className="gt-btn gt-btn--outline">
                {t("bookingSuccess.checkStatusLabel")}
              </Link>
              <Link href={getLocalizedHref("/tours", lang)} className="gt-btn gt-btn--outline">
                {t("bookingSuccess.otherTours")}
              </Link>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
