"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CouponTicket from "../components/CouponTicket";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getCouponByCode } from "../lib/coupons";
import "../coupon.css";

// Valid coupon codes and their details
const VALID_COUPONS = {
  WELCOME10: {
    code: "WELCOME10",
    discount: 10,
    desc: "10%-იანი მისასალმებელი ფასდაკლება ნებისმიერ ტურზე GeorgiaTrips-ში",
    type: "welcome",
    minOrder: 0,
  },
  GEO10: {
    code: "GEO10",
    discount: 10,
    desc: "10%-იანი ფასდაკლება სეზონური შეთავაზება",
    type: "seasonal",
    minOrder: 0,
  },
  COUPON10: {
    code: "COUPON10",
    discount: 10,
    desc: "10%-იანი ექსკლუზიური ფასდაკლების ვაუჩერი",
    type: "exclusive",
    minOrder: 0,
  },
};

export default function CouponsPage() {
  const { user } = useAuth() ?? {};
  const { t } = useLanguage();
  const router = useRouter();

  const [addedCoupons, setAddedCoupons] = useState([]);


  // User's default coupon (every registered user gets WELCOME10)
  const welcomeCoupon = VALID_COUPONS["WELCOME10"];

  const allMyCoupons = user
    ? [welcomeCoupon, ...addedCoupons]
    : [...addedCoupons];

  const handlePromoCheck = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError(t("bookingCoupon.enterCode") || "შეიყვანეთ კუპონის კოდი");
      return;
    }
    
    let coupon = VALID_COUPONS[code];
    if (!coupon) {
      try {
        const remoteCoupon = await getCouponByCode(code);
        if (remoteCoupon && remoteCoupon.active !== false) {
          coupon = {
            code: remoteCoupon.code,
            discount: remoteCoupon.discountPercent || 10,
            desc: remoteCoupon.title || `${remoteCoupon.discountPercent || 10}%-იანი ფასდაკლების კუპონი`,
            type: remoteCoupon.usageType || "exclusive",
            minOrder: 0,
          };
        }
      } catch (_) {}
    }

    if (!coupon) {
      setPromoError(t("bookingCoupon.invalidCode") || "კოდი არასწორია ან ვადაგასულია");
      setPromoSuccess("");
      return;
    }
    if (allMyCoupons.find((c) => c.code === code)) {
      setPromoError("ეს კუპონი უკვე დამატებულია!");
      setPromoSuccess("");
      return;
    }
    setAddedCoupons((prev) => [...prev, coupon]);
    setPromoInput("");
    setPromoError("");
    setPromoSuccess(`✓ კუპონი "${code}" წარმატებით დაემატა!`);
    setTimeout(() => setPromoSuccess(""), 4000);
  };

  const handleCopyCode = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2200);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero Header */}
      <section style={{
        background: "linear-gradient(135deg, #0f172a 0%, #106da4 50%, #29b2b7 100%)",
        padding: "4rem 1.5rem 3rem",
        textAlign: "center",
        color: "#fff",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(250,180,24,0.18)",
            border: "1px solid rgba(250,180,24,0.4)",
            padding: "5px 16px",
            borderRadius: "20px",
            marginBottom: "1rem",
          }}>
            <span style={{ fontSize: "1rem" }}>🎟️</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#fab418", letterSpacing: "0.5px" }}>
              ჩემი ფასდაკლების ბარათები
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 900, margin: "0 0 0.75rem", lineHeight: 1.2 }}>
            ჩემი კუპონები
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "1rem", margin: 0, lineHeight: 1.5 }}>
            {user
              ? "გამოიყენეთ კუპონი ტურის დაჯავშნისას და მიიღეთ 10%-იანი ფასდაკლება!"
              : "დარეგისტრირდით და მომენტალურად მიიღეთ 10%-იანი ფასდაკლების ბარათი ნებისმიერ ტურზე!"}
          </p>
        </div>
      </section>

      <div style={{ flex: 1, maxWidth: "860px", margin: "0 auto", width: "100%", padding: "2.5rem 1.25rem 4rem" }}>


        {/* My Coupons Section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              ჩემი კუპონები
              <span style={{
                marginLeft: "10px",
                background: "#29b2b7",
                color: "#fff",
                fontSize: "0.72rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "10px",
              }}>
                {allMyCoupons.length}
              </span>
            </h2>
            {allMyCoupons.length > 0 && (
              <Link
                href="/tours"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#106da4",
                  textDecoration: "none",
                }}
              >
                ტურების ნახვა →
              </Link>
            )}
          </div>

          {!user && allMyCoupons.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "3.5rem 2rem",
              background: "#fff",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎟️</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                კუპონები არ გაქვთ
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                დარეგისტრირდით და მიიღეთ 10%-იანი ფასდაკლების კუპონი!
              </p>
              <Link
                href="/login?tab=signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "13px 28px",
                  background: "linear-gradient(135deg, #106da4 0%, #29b2b7 100%)",
                  color: "#fff",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  textDecoration: "none",
                  boxShadow: "0 8px 25px rgba(41,178,183,0.35)",
                }}
              >
                <span>რეგისტრაცია და კუპონის მიღება</span>
                <span>→</span>
              </Link>
            </div>
          )}

          {allMyCoupons.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {allMyCoupons.map((coupon, i) => (
                <div key={coupon.code + i} style={{ position: "relative" }}>
                  {/* Badge above each ticket */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: coupon.type === "welcome" ? "#0f766e" : "#6d28d9",
                      background: coupon.type === "welcome" ? "rgba(16,185,129,0.12)" : "rgba(109,40,217,0.1)",
                      padding: "3px 10px",
                      borderRadius: "20px",
                    }}>
                      {coupon.type === "welcome" ? "🎁 მისასალმებელი კუპონი" : "🎟️ პრომო კუპონი"}
                    </span>
                  </div>

                  <CouponTicket
                    code={coupon.code}
                    discountPercent={coupon.discount}
                    isUsed={false}
                    showCopy={true}
                    showUseBtn={true}
                    onUse={() => router.push("/tours")}
                  />

                  {/* Description below ticket */}
                  <p style={{
                    marginTop: "8px",
                    fontSize: "0.8rem",
                    color: "#64748b",
                    paddingLeft: "4px",
                  }}>
                    {coupon.desc}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How to use */}
        {allMyCoupons.length > 0 && (
          <div style={{
            marginTop: "2.5rem",
            background: "#fff",
            borderRadius: "20px",
            padding: "24px 28px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px -6px rgba(0,0,0,0.06)",
          }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
              📋 კუპონის გამოყენების ინსტრუქცია
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                "გახსენით სასურველი ტურის გვერდი ჩვენს კატალოგში",
                `დაჯავშნის ფორმაში იპოვეთ ველი "ფასდაკლების კუპონი"`,
                `შეიყვანეთ კოდი (მაგ: WELCOME10) ან გამოიყენეთ "ჩემი კუპონი" ღილაკი`,
                "ჯამური ფასი ავტომატურად შემცირდება 10%-ით!",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{
                    width: "24px",
                    height: "24px",
                    minWidth: "24px",
                    borderRadius: "50%",
                    background: "#29b2b7",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "1px",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>

            <Link
              href="/tours"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "1.5rem",
                padding: "12px 24px",
                background: "linear-gradient(135deg, #106da4 0%, #29b2b7 100%)",
                color: "#fff",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.9rem",
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(41,178,183,0.35)",
                transition: "all 0.2s ease",
              }}
            >
              <span>ტურების დათვალიერება და დაჯავშნა</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
