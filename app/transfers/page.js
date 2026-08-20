"use client";

import React, { useState } from "react";
import Image from "next/image";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import DatePicker from "../components/DatePicker";
import { WA_LINK, WhatsAppIcon, SOCIAL_PROFILES } from "../lib/shared";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { createBooking } from "../lib/bookingsFirestore";

export default function TransfersPage() {
  const { t, lang, isEnglish } = useLanguage();

  const [selectedVehicleKey, setSelectedVehicleKey] = useState("minivan");
  const [pickupLoc, setPickupLoc] = useState("");
  const [dropoffLoc, setDropoffLoc] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("");
  const [passengerCount, setPassengerCount] = useState("2");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const fleetKeys = ["sedan", "minivan", "jeep", "sprinter"];
  const fleetData = {
    sedan: {
      key: "sedan",
      img: "/1car.webp",
      fallbackImg: "/car1.png",
      pax: 3,
      bags: 2,
    },
    minivan: {
      key: "minivan",
      img: "/2car.webp",
      fallbackImg: "/car2.png",
      pax: 6,
      bags: 5,
    },
    jeep: {
      key: "jeep",
      img: "/3car.webp",
      fallbackImg: "/car3.png",
      pax: 4,
      bags: 3,
    },
    sprinter: {
      key: "sprinter",
      img: "/4car.webp",
      fallbackImg: "/car4.png",
      pax: 16,
      bags: 14,
    },
  };

  const perks = [
    { icon: "🪧", title: t("transfersPage.p1Title"), desc: t("transfersPage.p1Desc") },
    { icon: "🛡️", title: t("transfersPage.p2Title"), desc: t("transfersPage.p2Desc") },
    { icon: "✈️", title: t("transfersPage.p3Title"), desc: t("transfersPage.p3Desc") },
    { icon: "💬", title: t("transfersPage.p4Title"), desc: t("transfersPage.p4Desc") },
  ];

  const popularRoutes = [
    { from: "თბილისის აეროპორტი (TBS)", to: "თბილისის ცენტრი", price: "₾50 / $18", time: "25-30 წთ" },
    { from: "ბათუმის აეროპორტი (BUS)", to: "ბათუმის ცენტრი / ბულვარი", price: "₾35 / $13", time: "15-20 წთ" },
    { from: "ქუთაისის აეროპორტი (KUT)", to: "გუდაური (სათხილამურო)", price: "₾320 / $118", time: "3.5 სთ" },
    { from: "ქუთაისის აეროპორტი (KUT)", to: "თბილისი", price: "₾220 / $80", time: "3.5 სთ" },
    { from: "ქუთაისის აეროპორტი (KUT)", to: "ბათუმი", price: "₾180 / $65", time: "2 სთ" },
    { from: "თბილისი", to: "სტეფანწმინდა / ყაზბეგი / გერგეტი", price: "₾250 / $92", time: "3 სთ" },
    { from: "თბილისი", to: "სიღნაღი / კახეთის ღვინის რეგიონი", price: "₾200 / $74", time: "2 სთ" },
    { from: "ბათუმი", to: "სარფის საზღვარი (თურქეთი)", price: "₾40 / $15", time: "25 წთ" },
  ];

  const selectedVehicleName = t(`transfersPage.vehicles.${selectedVehicleKey}.name`) || selectedVehicleKey;

  const handleTransferSubmit = (e) => {
    e.preventDefault();

    createBooking({
      type: "transfer",
      vehicle: selectedVehicleKey,
      vehicleName: selectedVehicleName,
      pickup: pickupLoc,
      dropoff: dropoffLoc,
      date: transferDate,
      time: transferTime,
      passengers: passengerCount,
      phone: contactPhone,
      notes: notes,
      language: lang,
    });

    const lines = isEnglish || lang === "en"
      ? [
          `🚗 *GeorgiaTrips — Transfer Booking Request*`,
          `━━━━━━━━━━━━━━━━━━`,
          `🚘 *Vehicle:* ${selectedVehicleName}`,
          `📍 *Pickup:* ${pickupLoc.trim() || "Not specified"}`,
          `🏁 *Dropoff:* ${dropoffLoc.trim() || "Not specified"}`,
          `📅 *Date:* ${transferDate || "By agreement"}`,
          `⏰ *Time:* ${transferTime.trim() || "By agreement"}`,
          `👥 *Passengers:* ${passengerCount} travelers`,
          `📞 *Phone / WhatsApp:* ${contactPhone.trim() || "Not specified"}`,
          notes.trim() ? `📝 *Flight / Notes:* ${notes.trim()}` : "",
        ]
      : lang === "ru"
      ? [
          `🚗 *GeorgiaTrips — Запрос на бронирование трансфера*`,
          `━━━━━━━━━━━━━━━━━━`,
          `🚘 *Автомобиль:* ${selectedVehicleName}`,
          `📍 *Откуда:* ${pickupLoc.trim() || "Не указано"}`,
          `🏁 *Куда:* ${dropoffLoc.trim() || "Не указано"}`,
          `📅 *Дата:* ${transferDate || "По договоренности"}`,
          `⏰ *Время:* ${transferTime.trim() || "По договоренности"}`,
          `👥 *Пассажиры:* ${passengerCount} чел.`,
          `📞 *Телефон / WhatsApp:* ${contactPhone.trim() || "Не указано"}`,
          notes.trim() ? `📝 *Рейс / Примечания:* ${notes.trim()}` : "",
        ]
      : lang === "tr"
      ? [
          `🚗 *GeorgiaTrips — Transfer Rezervasyon Talebi*`,
          `━━━━━━━━━━━━━━━━━━`,
          `🚘 *Araç:* ${selectedVehicleName}`,
          `📍 *Nereden:* ${pickupLoc.trim() || "Belirtilmedi"}`,
          `🏁 *Nereye:* ${dropoffLoc.trim() || "Belirtilmedi"}`,
          `📅 *Tarih:* ${transferDate || "Anlaşmaya göre"}`,
          `⏰ *Saat:* ${transferTime.trim() || "Anlaşmaya göre"}`,
          `👥 *Yolcu Sayısı:* ${passengerCount} kişi`,
          `📞 *Telefon / WhatsApp:* ${contactPhone.trim() || "Belirtilmedi"}`,
          notes.trim() ? `📝 *Uçuş / Notlar:* ${notes.trim()}` : "",
        ]
      : lang === "ar"
      ? [
          `🚗 *GeorgiaTrips — طلب حجز توصيلة*`,
          `━━━━━━━━━━━━━━━━━━`,
          `🚘 *نوع السيارة:* ${selectedVehicleName}`,
          `📍 *مكان الانطلاق:* ${pickupLoc.trim() || "غير محدد"}`,
          `🏁 *الوجهة:* ${dropoffLoc.trim() || "غير محدد"}`,
          `📅 *التاريخ:* ${transferDate || "بالاتفاق"}`,
          `⏰ *الوقت:* ${transferTime.trim() || "بالاتفاق"}`,
          `👥 *عدد الركاب:* ${passengerCount} أشخاص`,
          `📞 *رقم الهاتف / واتساب:* ${contactPhone.trim() || "غير محدد"}`,
          notes.trim() ? `📝 *رقم الرحلة / ملاحظات:* ${notes.trim()}` : "",
        ]
      : [
          `🚗 *GeorgiaTrips — ტრანსფერის მოთხოვნა*`,
          `━━━━━━━━━━━━━━━━━━`,
          `🚘 *ავტომობილი:* ${selectedVehicleName}`,
          `📍 *საიდან:* ${pickupLoc.trim() || "არ არის მითითებული"}`,
          `🏁 *სად:* ${dropoffLoc.trim() || "არ არის მითითებული"}`,
          `📅 *თარიღი:* ${transferDate || "შეთანხმებით"}`,
          `⏰ *დრო:* ${transferTime.trim() || "შეთანხმებით"}`,
          `👥 *მგზავრები:* ${passengerCount} ადამიანი`,
          `📞 *ტელეფონი / WhatsApp:* ${contactPhone.trim() || "არ არის მითითებული"}`,
          notes.trim() ? `📝 *შენიშვნა:* ${notes.trim()}` : "",
        ];

    window.open(`${WA_LINK}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`, "_blank");
  };

  const transferJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": "https://georgiatrips.ge/transfers#service",
        "name": "GeorgiaTrips — Airport Transfers & Private Drivers in Georgia",
        "description": "Private airport transfers from Tbilisi (TBS), Kutaisi (KUT), and Batumi (BUS) airports to Gudauri, Kazbegi, Mestia, and all regions of Georgia.",
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": "https://georgiatrips.ge",
          "telephone": "+995504220020",
          "sameAs": SOCIAL_PROFILES,
        },
        "areaServed": [
          { "@type": "Country", name: "Georgia" },
          { "@type": "City", name: "Tbilisi" },
          { "@type": "City", name: "Batumi" },
          { "@type": "City", name: "Kutaisi" },
          { "@type": "City", name: "Gudauri" },
          { "@type": "City", name: "Kazbegi" },
        ],
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": 35,
          "highPrice": 350,
          "priceCurrency": "GEL",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": "https://georgiatrips.ge/transfers#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": lang === "ka" ? "მთავარი" : "Home",
            "item": "https://georgiatrips.ge",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": lang === "ka" ? "ტრანსფერები" : "Transfers",
            "item": "https://georgiatrips.ge/transfers",
          },
        ],
      },
    ],
  };

  return (
    <div className="transfers-page-wrapper">
      <Navbar active="transfers" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(transferJsonLd) }}
      />

      {/* HERO SECTION */}
      <PageHero
        kicker={t("transfersPage.heroKicker")}
        title={t("transfersPage.heroTitle")}
        subtitle={t("transfersPage.heroSubtitle")}
        image="/hero.png"
        alt={t("transfersPage.heroTitle")}
      />



      {/* SECTION 2: LUXURY FLEET */}
      <section className="section" style={{ background: "#f8fafc" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">{t("transfersPage.fleetEyebrow")}</span>
            <h2 className="section-title">{t("transfersPage.fleetTitle")}</h2>
            <p className="section-desc">{t("transfersPage.fleetDesc")}</p>
            <div className="gold-line" />
          </div>

          <div className="transfers-fleet-grid">
            {fleetKeys.map((key) => {
              const data = fleetData[key];
              const vMeta = t(`transfersPage.vehicles.${key}`) || {};
              const isSelected = selectedVehicleKey === key;

              return (
                <div key={key} className={`transfers-fleet-card${isSelected ? " is-selected" : ""}`}>
                  <div className="transfers-fleet-media" style={{ position: "relative", minHeight: "180px" }}>
                    <Image
                      src={data.img}
                      alt={vMeta.name || "Transfer vehicle"}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                    <span className="transfers-fleet-badge">{vMeta.badge}</span>
                  </div>

                  <div className="transfers-fleet-body">
                    <div>
                      <h3 className="transfers-fleet-name">{vMeta.name}</h3>
                      <span className="transfers-fleet-sub">{vMeta.subtitle}</span>

                      <div className="transfers-fleet-specs">
                        <span className="transfers-spec-pill">👥 {t("transfersPage.capacityPax").replace("{count}", data.pax)}</span>
                        <span className="transfers-spec-pill">🧳 {t("transfersPage.capacityBags").replace("{count}", data.bags)}</span>
                        <span className="transfers-spec-pill">❄️ {t("transfersPage.climate")}</span>
                        <span className="transfers-spec-pill">📶 {t("transfersPage.wifi")}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-fleet-select"
                      onClick={() => handleSelectVehicle(key)}
                    >
                      <span>{t("transfersPage.selectVehicle")}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: VIP PERKS */}
      <section className="section" style={{ background: "#ffffff" }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">{t("transfersPage.perksEyebrow")}</span>
            <h2 className="section-title">{t("transfersPage.perksTitle")}</h2>
            <p className="section-desc">{t("transfersPage.perksDesc")}</p>
            <div className="gold-line" />
          </div>

          <div className="transfers-perks-grid">
            {perks.map((perk, idx) => (
              <div key={idx} className="transfers-perk-card">
                <div className="transfers-perk-icon">{perk.icon}</div>
                <div>
                  <h3 className="transfers-perk-title">{perk.title}</h3>
                  <p className="transfers-perk-desc">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: HIGH-CONVERSION BOOKING FORM */}
      <section className="section" id="transfer-booking-form" style={{ background: "#f8fafc" }}>
        <div className="container" style={{ maxWidth: "840px" }}>
          <div className="transfers-form-wrapper">
            <h2 className="transfers-form-title">{t("transfersPage.formTitle")}</h2>
            <p className="transfers-form-sub">{t("transfersPage.formDesc")}</p>

            <form onSubmit={handleTransferSubmit} className="transfers-form-grid">
              <div>
                <label className="tf-label">{t("transfersPage.pickupLabel")}</label>
                <input
                  type="text"
                  placeholder={t("transfersPage.pickupPlaceholder")}
                  value={pickupLoc}
                  onChange={(e) => setPickupLoc(e.target.value)}
                  required
                  className="tf-input-styled"
                />
              </div>

              <div>
                <label className="tf-label">{t("transfersPage.dropoffLabel")}</label>
                <input
                  type="text"
                  placeholder={t("transfersPage.dropoffPlaceholder")}
                  value={dropoffLoc}
                  onChange={(e) => setDropoffLoc(e.target.value)}
                  required
                  className="tf-input-styled"
                />
              </div>

              <div>
                <label className="tf-label">{t("transfersPage.dateLabel")}</label>
                <DatePicker
                  value={transferDate}
                  onChange={(dStr) => setTransferDate(dStr)}
                  placeholder={t("transfersPage.datePlaceholder")}
                  direction="down"
                />
              </div>

              <div>
                <label className="tf-label">{t("transfersPage.timeLabel")}</label>
                <input
                  type="text"
                  placeholder={t("transfersPage.timePlaceholder")}
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                  className="tf-input-styled"
                />
              </div>

              <div>
                <label className="tf-label">{t("transfersPage.passengersLabel")}</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  required
                  className="tf-input-styled"
                />
              </div>

              <div>
                <label className="tf-label">{t("transfersPage.vehicleLabel")}</label>
                <select
                  value={selectedVehicleKey}
                  onChange={(e) => setSelectedVehicleKey(e.target.value)}
                  className="tf-input-styled"
                  style={{ background: "#0f172a" }}
                >
                  {fleetKeys.map((key) => (
                    <option key={key} value={key}>
                      {t(`transfersPage.vehicles.${key}.name`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="tf-field-full">
                <label className="tf-label">{t("transfersPage.phoneLabel")}</label>
                <input
                  type="tel"
                  placeholder={t("transfersPage.phonePlaceholder")}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="tf-input-styled"
                />
              </div>

              <div className="tf-field-full">
                <label className="tf-label">{t("transfersPage.flightLabel")}</label>
                <textarea
                  rows={2}
                  placeholder={t("transfersPage.flightPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="tf-input-styled"
                />
              </div>

              <div className="tf-field-full">
                <button type="submit" className="btn-tf-whatsapp">
                  <WhatsAppIcon width={22} height={22} />
                  <span>{t("transfersPage.submitBtn")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
