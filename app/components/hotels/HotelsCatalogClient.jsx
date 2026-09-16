"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { asLocalizedText, matchesMultiLang } from "../../lib/toursShared";
import { SearchIcon, WhatsAppIcon } from "../Icons";
import { whatsappHref } from "../../lib/shared";

function HotelCard({ hotel, t, lang }) {
  const { format } = useCurrency();
  const photo = hotel.gallery?.[0] || hotel.img || "/hero.webp";
  const nameText = asLocalizedText(hotel.name || hotel.title, lang);
  const descText = asLocalizedText(hotel.desc || hotel.description, lang);
  const priceLabelText = asLocalizedText(hotel.priceLabel, lang);
  const buttonText = asLocalizedText(hotel.buttonText, lang);

  return (
    <article className="hotel-item">
      <div className="hotel-item-image-wrapper">
        <Image
          src={photo}
          alt={nameText || "Hotel"}
          fill
          sizes="(max-width: 760px) 100vw, 500px"
          style={{ objectFit: "cover" }}
        />
        {hotel.isFeatured && <span className="hm-badge">{t("hotelsPage.recommended")}</span>}
      </div>

      <div className="hotel-item-body">
        <h2 className="hotel-item-title">{nameText}</h2>
        {descText && <p className="hotel-item-desc">{descText}</p>}

        {(hotel.priceFrom || hotel.bookingUrl) && (
          <div className="hotel-item-foot">
            {hotel.priceFrom && (
              <p className="hotel-item-price">
                {priceLabelText ? `${priceLabelText} ` : ""}{format(hotel.priceFrom, lang)}
              </p>
            )}
            {hotel.bookingUrl && (
              <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer" className="hotel-item-button">
                {buttonText || t("hotelsPage.bookNow")}
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function HotelsCatalogClient({ initialHotels = [] }) {
  const { t, lang } = useLanguage();
  const [hotels, setHotels] = useState(initialHotels);
  const [query, setQuery] = useState("");

  React.useEffect(() => {
    if (Array.isArray(initialHotels) && initialHotels.length > 0) {
      setHotels(initialHotels);
    } else {
      // Fallback: If server cache returned empty, fetch live from Firestore on client
      import("../../lib/hotelsFirestore").then(({ listHotels }) => {
        listHotels(true).then((freshList) => {
          if (Array.isArray(freshList) && freshList.length > 0) {
            setHotels(freshList);
          }
        }).catch(() => {});
      });
    }
  }, [initialHotels]);

  const filtered = useMemo(() => {
    const term = query.trim();
    if (!term) return hotels;
    return hotels.filter(
      (hotel) =>
        matchesMultiLang(hotel.name || hotel.title, term) ||
        matchesMultiLang(hotel.city, term) ||
        matchesMultiLang(hotel.desc || hotel.description, term)
    );
  }, [hotels, query]);

  return (
    <div className="hotels-page">
      <Navbar active="hotels" />

      <PageHero
        kicker={t("hotelsPage.kicker")}
        title={t("hotelsPage.title")}
        subtitle={t("hotelsPage.subtitle")}
        image="/villa.webp"
        alt={t("hotelsPage.title")}
      >
        <div className="hm-search">
          <SearchIcon size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("hotelsPage.searchPlaceholder")}
            aria-label={t("hotelsPage.searchPlaceholder")}
          />
        </div>
      </PageHero>

      <section className="hm-section">
        <div className="hm-inner">
          <p className="hm-count">
            {t("hotelsPage.hotelCount").replace("{count}", filtered.length)}
          </p>

          {filtered.length > 0 ? (
            <div className="hotel-list">
              {filtered.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} t={t} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="hm-empty">
              <h2>{hotels.length === 0 ? t("hotelsPage.noHotelsYet") : t("hotelsPage.notFound")}</h2>
              <p>{t(hotels.length === 0 ? "hotelsPage.emptyText" : "hotelsPage.notFoundText")}</p>
              {hotels.length === 0 && (
                <a href={whatsappHref(t("site.hotelWa"))} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa">
                  <WhatsAppIcon size={18} />
                  {t("site.chatWhatsapp")}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
