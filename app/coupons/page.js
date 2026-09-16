"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CouponTicket from "../components/CouponTicket";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { interpolate } from "../lib/i18n/translate";
import { getLocalizedHref } from "../lib/siteConfig";
import { getCouponByCode } from "../lib/coupons";
import "../coupon.css";

// Codes that are always valid; anything else is looked up in Firestore.
const BUILT_IN = {
  WELCOME10: { code: "WELCOME10", discount: 10, type: "welcome" },
  GEO10: { code: "GEO10", discount: 10, type: "promo" },
  COUPON10: { code: "COUPON10", discount: 10, type: "promo" },
};

export default function CouponsPage() {
  const { user } = useAuth() ?? {};
  const { t, lang } = useLanguage();
  const router = useRouter();
  const toursHref = getLocalizedHref("/tours", lang);

  const [added, setAdded] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checking, setChecking] = useState(false);

  // Every registered user has the welcome coupon.
  const coupons = user ? [BUILT_IN.WELCOME10, ...added] : added;

  const addCoupon = async (event) => {
    event.preventDefault();
    const code = input.trim().toUpperCase();
    setSuccess("");
    if (!code) {
      setError(t("bookingCoupon.enterCode"));
      return;
    }
    if (coupons.some((c) => c.code === code)) {
      setError(t("coupon.duplicate"));
      return;
    }

    setChecking(true);
    let coupon = BUILT_IN[code];
    if (!coupon) {
      try {
        const remote = await getCouponByCode(code);
        if (remote && remote.active !== false) {
          coupon = { code: remote.code, discount: remote.discountPercent || 10, type: "promo" };
        }
      } catch (_) {}
    }
    setChecking(false);

    if (!coupon) {
      setError(t("bookingCoupon.invalidCode"));
      return;
    }
    setAdded((prev) => [...prev, coupon]);
    setInput("");
    setError("");
    setSuccess(interpolate(t("coupon.added"), { code }));
  };

  return (
    <div className="gt-coupons-page">
      <Navbar />

      <main className="gt-coupons-main">
        <header className="gt-coupons-head">
          <p className="gt-coupons-eyebrow">{t("coupon.pageEyebrow")}</p>
          <h1>{t("coupon.pageTitle")}</h1>
          <p>{t(user ? "coupon.pageLeadUser" : "coupon.pageLeadGuest")}</p>
        </header>

        <form className="gt-coupons-add" onSubmit={addCoupon} noValidate>
          <label htmlFor="coupon-code">{t("coupon.addTitle")}</label>
          <div className="gt-coupons-add-row">
            <input
              id="coupon-code"
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder={t("bookingCoupon.placeholder")}
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={Boolean(error)}
              aria-describedby="coupon-msg"
            />
            <button type="submit" disabled={checking}>{t("bookingCoupon.apply")}</button>
          </div>
          <p id="coupon-msg" className={error ? "is-error" : "is-success"} aria-live="polite">
            {error || success}
          </p>
        </form>

        {coupons.length === 0 ? (
          <section className="gt-coupons-empty">
            <h2>{t("coupon.emptyTitle")}</h2>
            <p>{t("coupon.emptyText")}</p>
            <Link href="/login?tab=signup" className="gt-coupons-btn">{t("coupon.signupCta")}</Link>
          </section>
        ) : (
          <>
            <section aria-labelledby="my-coupons">
              <div className="gt-coupons-list-head">
                <h2 id="my-coupons">
                  {t("coupon.myCouponsTitle")} <span>{coupons.length}</span>
                </h2>
                <Link href={toursHref}>{t("coupon.viewTours")}</Link>
              </div>
              <ul className="gt-coupons-list">
                {coupons.map((coupon) => (
                  <li key={coupon.code}>
                    <span className="gt-coupons-tag">
                      {t(coupon.type === "welcome" ? "coupon.welcomeTag" : "coupon.promoTag")}
                    </span>
                    <CouponTicket
                      code={coupon.code}
                      discountPercent={coupon.discount}
                      showCopy
                      showUseBtn
                      useLabel={t("coupon.useInBooking")}
                      onUse={() => router.push(toursHref)}
                    />
                  </li>
                ))}
              </ul>
            </section>

            <section className="gt-coupons-howto" aria-labelledby="coupon-howto">
              <h2 id="coupon-howto">{t("coupon.howToUseTitle")}</h2>
              <ol>
                {["step1", "step2", "step3"].map((key) => (
                  <li key={key}>{t(`coupon.${key}`)}</li>
                ))}
              </ol>
              <Link href={toursHref} className="gt-coupons-btn">{t("coupon.exploreToursBtn")}</Link>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
