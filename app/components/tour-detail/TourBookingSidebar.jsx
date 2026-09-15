"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { asLocalizedText } from "../../lib/toursFirestore";
import { interpolate } from "../../lib/i18n/translate";
import { PHONE_TEL, whatsappHref } from "../../lib/shared";
import TourPrice from "../TourPrice";
import DatePicker from "../DatePicker";
import { LocationIcon, PhoneIcon, ShieldCheckIcon, WalletIcon, WhatsAppIcon } from "../Icons";

export default function TourBookingSidebar({
  tour,
  bookingSidebarRef,
  hasGroupSupport,
  hasPrivateSupport,
  hasGroupDates,
  groupDatesIso = [],
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
  const tourTitle = asLocalizedText(tour.title, lang);

  // Every statement here matches the site FAQ and tour data. Cancellation
  // uses the FAQ's 48-hour window (the sidebar previously said 24 hours).
  const trustItems = [
    { key: "cancel", icon: <ShieldCheckIcon size={16} />, text: t("tourDetail.trustCancel") },
    { key: "pay", icon: <WalletIcon size={16} />, text: t("tourDetail.trustPay") },
    { key: "pickup", icon: <LocationIcon size={16} />, text: t("tourDetail.trustPickup") },
    { key: "confirm", icon: <WhatsAppIcon size={16} />, text: t("tourDetail.trustConfirm") },
  ];

  return (
    <aside className="tdp-sidebar-col" ref={bookingSidebarRef} id="mobile-booking-target">
      <div className="tdp-sticky-card">
        <div className="tdp-price-box">
          <span className="price-header-label">{t("tourDetail.priceHeader")}</span>

          <div className="price-cards-stack">
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

          <p className="tdp-pay-note">
            <WalletIcon size={15} />
            <span>{t("tourDetail.trustPay")}</span>
          </p>
        </div>

        <form className="tdp-booking-form" onSubmit={handleBookingSubmit} id="tour-booking-form">
          <h3>{t("tourDetail.onlineBooking")}</h3>
          <p className="form-sub">{t("tourDetail.formSubtitle")}</p>

          <div className="tdp-form-group">
            <label htmlFor="booking-name">{t("tourDetail.yourName")}</label>
            <input
              id="booking-name"
              type="text"
              autoComplete="name"
              placeholder={t("tourDetail.namePlaceholder")}
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              required
            />
          </div>

          <div className="tdp-form-group">
            <span className="tdp-form-label" id="booking-type-label">{t("tourDetail.tourType")}</span>
            <div className="tdp-tour-type-switch" role="radiogroup" aria-labelledby="booking-type-label">
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
            {hasGroupSupport && !hasGroupDates && <p className="tdp-no-group-note">{t("tourDetail.noScheduleDesc")}</p>}
          </div>

          <div className="tdp-form-group">
            <label htmlFor="booking-date">{t("tourDetail.departureDate")}</label>
            <DatePicker
              id="booking-date"
              value={selectedDate}
              onChange={(value) => setSelectedDate(value)}
              placeholder={t("tourDetail.selectDatePlaceholder")}
              availableDates={tourType === "group" ? groupDatesIso : null}
              highlightDates={groupDatesIso}
              highlightLabel={t("datePicker.groupDeparture")}
              anyDayLabel={tourType === "private" ? t("datePicker.anyDay") : undefined}
            />
            {tourType === "private" && <p className="tdp-type-hint">{t("tourDetail.privateDateHint")}</p>}
          </div>

          <div className="tdp-form-group">
            <label htmlFor="booking-people">{t("tourDetail.peopleCount")}</label>
            <input
              id="booking-people"
              type="number"
              inputMode="numeric"
              min={peopleMin}
              max={peopleMax}
              placeholder="2"
              value={bookingPeople}
              onChange={(e) => {
                const v = e.target.value;
                const n = parseInt(v, 10);
                if (v !== "" && !isNaN(n) && n > peopleMax) setBookingPeople(String(peopleMax));
                else setBookingPeople(v);
              }}
              required
            />
            {tourType === "group" && freeSeatsForSelected != null && (
              <p className="tdp-type-hint">
                {interpolate(t("tourDetail.groupSeatsHint"), { seats: freeSeatsForSelected, max: peopleMax })}
              </p>
            )}
          </div>

          <div className="tdp-form-group">
            <label htmlFor="booking-phone">{t("tourDetail.phoneLabel")}</label>
            <input
              id="booking-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+995 5XX XX XX XX"
              value={bookingPhone}
              onChange={(e) => {
                setBookingPhone(e.target.value);
                if (phoneError) setPhoneError("");
              }}
              aria-invalid={phoneError ? "true" : undefined}
              aria-describedby={phoneError ? "booking-phone-error" : undefined}
              style={phoneError ? { borderColor: "#b42318", boxShadow: "0 0 0 3px rgba(180, 35, 24, 0.18)" } : undefined}
              required
            />
            {phoneError && (
              <p id="booking-phone-error" role="alert" style={{ color: "#b42318", fontSize: "0.84rem", marginTop: "0.35rem", fontWeight: 600 }}>
                {phoneError}
              </p>
            )}
          </div>

          <div className="tdp-form-group">
            <label htmlFor="booking-contact">{t("tourDetail.preferredContact")}</label>
            <select id="booking-contact" value={messengerPref} onChange={(e) => setMessengerPref(e.target.value)}>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Viber">Viber</option>
              <option value="Telegram">Telegram</option>
              <option value="Direct Call">{t("tourDetail.phoneCall")}</option>
            </select>
          </div>

          <div className="tdp-form-group">
            <label htmlFor="booking-notes">{t("tourDetail.notesLabel")}</label>
            <textarea
              id="booking-notes"
              rows={2}
              placeholder={t("tourDetail.notesPlaceholder")}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
          </div>

          <div className="tdp-coupon-section">
            <div className="tdp-coupon-label-row">
              <label htmlFor="booking-coupon">{t("bookingCoupon.title")}</label>
              {appliedCoupon && <span className="tdp-coupon-active-badge">✓ {appliedCoupon.discount || 10}% OFF</span>}
            </div>

            {appliedCoupon ? (
              <div className="tdp-coupon-applied-box">
                <div className="tdp-coupon-applied-info">
                  <span className="tdp-coupon-applied-code">{appliedCoupon.code}</span>
                  <span className="tdp-coupon-applied-desc">
                    {t("bookingCoupon.discountApplied")} (-{format(discountAmount, lang)})
                  </span>
                </div>
                <button type="button" className="tdp-coupon-remove-btn" onClick={handleRemoveCoupon}>
                  {t("bookingCoupon.remove")}
                </button>
              </div>
            ) : (
              <div className="tdp-coupon-input-wrap">
                <div className="tdp-coupon-input-row">
                  <input
                    id="booking-coupon"
                    type="text"
                    placeholder={t("bookingCoupon.placeholder")}
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
                  <button type="button" className="tdp-coupon-apply-btn" onClick={() => handleApplyCoupon()}>
                    {t("bookingCoupon.applyBtn")}
                  </button>
                </div>

                {user && (
                  <button type="button" className="tdp-coupon-quick-apply" onClick={() => handleApplyCoupon("WELCOME10")}>
                    <span>{t("bookingCoupon.useMyWelcome")}</span>
                    <span className="tdp-quick-apply-tag">{t("bookingCoupon.apply")}</span>
                  </button>
                )}

                {couponError && <p className="tdp-coupon-err-msg" role="alert">{couponError}</p>}
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
                    ? interpolate(t("tourDetail.groupPriceCalc"), { price: groupUnitPrice, count: peopleCount })
                    : t("tourDetail.privatePriceCalc")}
                </small>
              </div>
              <div className="total-price-values">
                {appliedCoupon && discountAmount > 0 ? (
                  <div className="tdp-discounted-price-box">
                    <span className="tdp-old-price">{format(baseTotalPrice, lang)}</span>
                    <span className="tdp-discount-tag">-{appliedCoupon.discount || 10}%</span>
                    <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                  </div>
                ) : (
                  <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn-tdp-submit" disabled={bookingSubmitting} aria-busy={bookingSubmitting || undefined}>
            <span>
              {bookingSubmitting ? "…" : `${t("tourDetail.bookNow")}${totalPrice > 0 ? ` — ${format(totalPrice, lang)}` : ""}`}
            </span>
          </button>

          <ul className="tdp-trust-list">
            {trustItems.map((item) => (
              <li key={item.key}>
                <span className="tdp-trust-icon">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </form>

        <div className="tdp-direct-contacts">
          <p>{t("tourDetail.contactDirectly")}</p>
          <div className="contacts-btns-row">
            <a
              href={whatsappHref(interpolate(t("tourCard.waMessage"), { title: tourTitle }))}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-btn wa"
            >
              <WhatsAppIcon size={17} />
              <span>WhatsApp</span>
            </a>
            <a href={`tel:${PHONE_TEL}`} className="contact-btn phone">
              <PhoneIcon size={16} />
              <span>{String(t("tourDetail.callNow")).replace(/^📞\s*/, "")}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Desktop only (tour-hero.css): follows the reader once the form has scrolled away. */}
      <div className="tdp-book-summary">
        <p className="tdp-book-summary-title">{tourTitle}</p>
        {(tour.priceGroup || tour.pricePrivate) && (
          <div className="tdp-book-summary-price">
            <small>{tourType === "private" ? t("tourCard.privateLabel") : t("tourCard.perPersonGroup")}</small>
            <TourPrice
              price={tourType === "private" ? tour.pricePrivate || tour.priceGroup : tour.priceGroup || tour.pricePrivate}
              lang={lang}
              variant="bar"
              compact
            />
          </div>
        )}
        <a href="#tour-booking-form" className="gt-btn gt-btn--gold gt-btn--block">{t("tourDetail.bookNow")}</a>
        <a
          href={whatsappHref(interpolate(t("tourCard.waMessage"), { title: tourTitle }))}
          target="_blank"
          rel="noopener noreferrer"
          className="gt-btn gt-btn--outline gt-btn--block"
        >
          <WhatsAppIcon size={18} />
          WhatsApp
        </a>
      </div>
    </aside>
  );
}
