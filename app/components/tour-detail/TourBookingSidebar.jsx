"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { asLocalizedText } from "../../lib/toursFirestore";
import { WA_LINK, WA_NUMBER } from "../../lib/shared";
import TourPrice from "../TourPrice";
import DatePicker from "../DatePicker";

export default function TourBookingSidebar({
  tour,
  bookingSidebarRef,
  hasGroupSupport,
  hasPrivateSupport,
  hasGroupDates,
  groupDatesMMDD,
  tourType,
  handleTourTypeChange,
  groupUnitPrice,
  privateTotalPrice,
  bookingName,
  setBookingName,
  selectedDate,
  setSelectedDate,
  bookingPeople,
  setBookingPeople,
  peopleMin,
  peopleMax,
  freeSeatsForSelected,
  bookingPhone,
  setBookingPhone,
  phoneError,
  setPhoneError,
  messengerPref,
  setMessengerPref,
  bookingNotes,
  setBookingNotes,
  couponCodeInput,
  setCouponCodeInput,
  setCouponError,
  appliedCoupon,
  discountAmount,
  handleRemoveCoupon,
  handleApplyCoupon,
  couponError,
  couponSuccess,
  baseTotalPrice,
  totalPrice,
  peopleCount,
  bookingSubmitting,
  handleBookingSubmit,
  user,
}) {
  const { t, lang } = useLanguage();
  const { format } = useCurrency();

  const TRUST_LABELS = {
    ka: {
      cancellation: "უფასო გაუქმება 24 სთ-ით ადრე",
      payOnArrival: "გადახდა ადგილზე — წინასწარი გადახდის გარეშე",
      instantWa: "მყისიერი დასტური WhatsApp-ით",
      guaranteed: "გარანტირებული ტური & ლოკალური გიდი",
    },
    en: {
      cancellation: "Free cancellation up to 24h before",
      payOnArrival: "Pay on arrival — no prepayment needed",
      instantWa: "Instant WhatsApp confirmation",
      guaranteed: "Guaranteed tour & local guide",
    },
    ru: {
      cancellation: "Бесплатная отмена за 24ч",
      payOnArrival: "Оплата на месте — без предоплаты",
      instantWa: "Мгновенное подтверждение в WhatsApp",
      guaranteed: "Гарантированный тур и местный гид",
    },
    tr: {
      cancellation: "24 saat öncesine kadar ücretsiz iptal",
      payOnArrival: "Varışta ödeme — ön ödeme gerekmez",
      instantWa: "WhatsApp ile anında onay",
      guaranteed: "Garantili tur ve yerel rehber",
    },
    ar: {
      cancellation: "إلغاء مجاني حتى 24 ساعة قبل الموعد",
      payOnArrival: "الدفع عند الوصول — بدون دفع مسبق",
      instantWa: "تأكيد فوري عبر واتساب",
      guaranteed: "جولة مضمونة ومرشد محلي",
    },
  };
  const trustLabels = TRUST_LABELS[lang] || TRUST_LABELS.ka;

  return (
    <aside className="tdp-sidebar-col" ref={bookingSidebarRef} id="mobile-booking-target">
      <div className="tdp-sticky-card">
        
        {/* Pricing Banner Box */}
        <div className="tdp-price-box">
          <span className="price-header-label">{t("tourDetail.priceHeader")}</span>
          
          <div className="price-cards-stack">
            {/* Group Tour Price */}
            {hasGroupSupport && tour.priceGroup && (
              <button
                type="button"
                className={`price-tier-card group${tourType === "group" ? " is-selected" : ""}${!hasGroupDates ? " is-unavailable" : ""}`}
                onClick={() => handleTourTypeChange("group")}
                disabled={!hasGroupDates}
                aria-pressed={tourType === "group"}
              >
                <div className="tier-info">
                  <strong>{t("tourDetail.groupTour")}</strong>
                  <small>{hasGroupDates ? t("tourDetail.fixedSchedule") : t("tourDetail.notScheduled")}</small>
                </div>
                <div className="tier-amount">
                  <TourPrice price={tour.priceGroup} lang={lang} variant="card" />
                </div>
              </button>
            )}

            {/* Private Tour Price */}
            {hasPrivateSupport && tour.pricePrivate && (
              <button
                type="button"
                className={`price-tier-card private${tourType === "private" ? " is-selected" : ""}`}
                onClick={() => handleTourTypeChange("private")}
                aria-pressed={tourType === "private"}
              >
                <div className="tier-info">
                  <strong>{t("tourDetail.privateTour")}</strong>
                  <small>{t("tourDetail.onlyYourGroup")}</small>
                </div>
                <div className="tier-amount">
                  <TourPrice price={tour.pricePrivate} lang={lang} variant="card" />
                </div>
              </button>
            )}
          </div>
        </div>

        {/* High Conversion Booking Form */}
        <form className="tdp-booking-form" onSubmit={handleBookingSubmit} id="tour-booking-form">
          <h3>{t("tourDetail.onlineBooking")}</h3>
          <p className="form-sub">{t("tourDetail.formSubtitle")}</p>

          <div className="tdp-form-group">
            <label>{t("tourDetail.yourName")}</label>
            <input
              type="text"
              placeholder={t("tourDetail.namePlaceholder")}
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              required
            />
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.tourType")}</label>
            <div className="tdp-tour-type-switch" role="radiogroup" aria-label={t("tourDetail.tourType")}>
              {hasGroupSupport && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={tourType === "group"}
                  className={`tdp-type-option${tourType === "group" ? " is-active" : ""}${!hasGroupDates ? " is-disabled" : ""}`}
                  onClick={() => handleTourTypeChange("group")}
                  disabled={!hasGroupDates}
                >
                  <strong>{t("tourDetail.groupType")}</strong>
                  <small>{groupUnitPrice ? `${format(groupUnitPrice, lang)}/${t("tourDetail.perPerson")}` : "—"}</small>
                </button>
              )}
              {hasPrivateSupport && (
                <button
                  type="button"
                  role="radio"
                  aria-checked={tourType === "private"}
                  className={`tdp-type-option${tourType === "private" ? " is-active" : ""}`}
                  onClick={() => handleTourTypeChange("private")}
                >
                  <strong>{t("tourDetail.privateType")}</strong>
                  <small>{privateTotalPrice ? `${format(privateTotalPrice, lang)} ${t("tourDetail.total")}` : t("tourDetail.byAgreement")}</small>
                </button>
              )}
            </div>
            {hasGroupSupport && !hasGroupDates && (
              <p className="tdp-no-group-note">
                {t("tourDetail.noScheduleDesc")}
              </p>
            )}
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.departureDate")}</label>
            <DatePicker
              value={selectedDate}
              onChange={(dStr) => setSelectedDate(dStr)}
              placeholder={t("tourDetail.selectDatePlaceholder")}
              direction="down"
              availableDates={tourType === "group" ? groupDatesMMDD : null}
            />
            {tourType === "private" && (
              <p className="tdp-type-hint">{t("tourDetail.privateDateHint")}</p>
            )}
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.peopleCount")}</label>
            <input
              type="number"
              min={peopleMin}
              max={peopleMax}
              placeholder="2"
              value={bookingPeople}
              onChange={(e) => {
                const v = e.target.value;
                const n = parseInt(v, 10);
                if (v !== "" && !isNaN(n) && n > peopleMax) {
                  setBookingPeople(String(peopleMax));
                } else {
                  setBookingPeople(v);
                }
              }}
              required
            />
            {tourType === "group" && freeSeatsForSelected != null && (
              <p className="tdp-type-hint">
                {t("tourDetail.groupSeatsHint").replace("{seats}", freeSeatsForSelected).replace("{max}", peopleMax)}
              </p>
            )}
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.phoneLabel")}</label>
            <input
              type="tel"
              placeholder="+995 5XX XX XX XX"
              value={bookingPhone}
              onChange={(e) => {
                setBookingPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              style={phoneError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.2)" } : {}}
              required
            />
            {phoneError && (
              <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.35rem", fontWeight: 600 }}>
                ⚠️ {phoneError}
              </p>
            )}
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.preferredContact")}</label>
            <select
              value={messengerPref}
              onChange={(e) => setMessengerPref(e.target.value)}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="Viber">Viber</option>
              <option value="Telegram">Telegram</option>
              <option value="Direct Call">{t("tourDetail.phoneCall")}</option>
            </select>
          </div>

          <div className="tdp-form-group">
            <label>{t("tourDetail.notesLabel")}</label>
            <textarea
              rows={2}
              placeholder={t("tourDetail.notesPlaceholder")}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
          </div>

          {/* Coupon Apply Section */}
          <div className="tdp-coupon-section">
            <div className="tdp-coupon-label-row">
              <label>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span>{t("bookingCoupon.title") || "ფასდაკლების კუპონი"}</span>
              </label>
              {appliedCoupon && (
                <span className="tdp-coupon-active-badge">
                  ✓ {appliedCoupon.discount || 10}% OFF
                </span>
              )}
            </div>

            {appliedCoupon ? (
              <div className="tdp-coupon-applied-box">
                <div className="tdp-coupon-applied-info">
                  <span className="tdp-coupon-applied-code">🎟️ {appliedCoupon.code}</span>
                  <span className="tdp-coupon-applied-desc">
                    {t("bookingCoupon.discountApplied") || `${appliedCoupon.discount || 10}%-იანი ფასდაკლება გააქტიურებულია`} (-{format(discountAmount, lang)})
                  </span>
                </div>
                <button
                  type="button"
                  className="tdp-coupon-remove-btn"
                  onClick={handleRemoveCoupon}
                  aria-label="Remove coupon"
                >
                  {t("bookingCoupon.remove") || "გაუქმება"}
                </button>
              </div>
            ) : (
              <div className="tdp-coupon-input-wrap">
                <div className="tdp-coupon-input-row">
                  <input
                    type="text"
                    placeholder={t("bookingCoupon.placeholder") || "მაგ: WELCOME10"}
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponCodeInput(e.target.value);
                      setCouponError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    className="tdp-coupon-input"
                  />
                  <button
                    type="button"
                    className="tdp-coupon-apply-btn"
                    onClick={() => handleApplyCoupon()}
                  >
                    {t("bookingCoupon.applyBtn") || "გამოყენება"}
                  </button>
                </div>

                {user && (
                  <button
                    type="button"
                    className="tdp-coupon-quick-apply"
                    onClick={() => handleApplyCoupon("WELCOME10")}
                  >
                    <span>✨ {t("bookingCoupon.useMyWelcome") || "ჩემი 10%-იანი კუპონი (WELCOME10)"}</span>
                    <span className="tdp-quick-apply-tag">{t("bookingCoupon.apply") || "გამოყენება"}</span>
                  </button>
                )}

                {couponError && <p className="tdp-coupon-err-msg">{couponError}</p>}
                {couponSuccess && <p className="tdp-coupon-success-msg">{couponSuccess}</p>}
              </div>
            )}
          </div>

          {baseTotalPrice > 0 && (
            <div className="tdp-total-price-row">
              <div className="total-price-label">
                <span>{t("tourDetail.totalCost")}</span>
                <small>
                  {tourType === "group"
                    ? t("tourDetail.groupPriceCalc").replace("{price}", groupUnitPrice).replace("{count}", peopleCount)
                    : t("tourDetail.privatePriceCalc")}
                </small>
              </div>
              <div className="total-price-values">
                {appliedCoupon && discountAmount > 0 ? (
                  <div className="tdp-discounted-price-box">
                    <span className="tdp-old-price">{format(baseTotalPrice, lang)}</span>
                    <span className="tdp-discount-tag">-10%</span>
                    <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                  </div>
                ) : (
                  <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn-tdp-submit" disabled={bookingSubmitting}>
            <span>
              {bookingSubmitting
                ? "..."
                : `${t("tourDetail.bookNow")}${totalPrice > 0 ? ` — ${format(totalPrice, lang)}` : ""}`}
            </span>
          </button>

          {/* High-Trust Conversion Badges */}
          <div className="tdp-trust-badges-grid" dir={lang === "ar" ? "rtl" : "ltr"}>
            <div className="tdp-trust-badge-item">
              <span className="tdp-trust-badge-icon">🛡️</span>
              <span className="tdp-trust-badge-text">{trustLabels.cancellation}</span>
            </div>
            <div className="tdp-trust-badge-item">
              <span className="tdp-trust-badge-icon">💵</span>
              <span className="tdp-trust-badge-text">{trustLabels.payOnArrival}</span>
            </div>
            <div className="tdp-trust-badge-item">
              <span className="tdp-trust-badge-icon">⚡</span>
              <span className="tdp-trust-badge-text">{trustLabels.instantWa}</span>
            </div>
            <div className="tdp-trust-badge-item">
              <span className="tdp-trust-badge-icon">🏅</span>
              <span className="tdp-trust-badge-text">{trustLabels.guaranteed}</span>
            </div>
          </div>
        </form>

        {/* Direct Contacts Box */}
        <div className="tdp-direct-contacts">
          <p>{t("tourDetail.contactDirectly")}</p>
          <div className="contacts-btns-row">
            <a
              href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I'm interested in tour: "${asLocalizedText(tour.title, lang)}"`)}`}
              target="_blank"
              rel="noreferrer"
              className="contact-btn wa"
            >
              <span>💬 WhatsApp</span>
            </a>
            <a href={`tel:${WA_NUMBER}`} className="contact-btn phone">
              <span>{t("tourDetail.callNow")}</span>
            </a>
          </div>
        </div>

      </div>
    </aside>
  );
}
