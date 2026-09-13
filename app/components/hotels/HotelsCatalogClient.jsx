"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { asLocalizedText, matchesMultiLang } from "../../lib/toursFirestore";
import { SearchIcon } from "../Icons";

function HotelCard({ hotel, t, lang }) {
  const { format } = useCurrency();
  const photo = hotel.gallery?.[0] || "/hero.webp";
  const nameText = asLocalizedText(hotel.name, lang);
  const descText = asLocalizedText(hotel.desc, lang);
  const priceLabelText = asLocalizedText(hotel.priceLabel, lang);
  const buttonText = asLocalizedText(hotel.buttonText, lang);

  return (
    <article className="hotel-item">
      <h2 className="hotel-item-title">{nameText}</h2>
      
      <div className="hotel-item-image-wrapper">
        <Image
          src={photo}
          alt={nameText}
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          style={{ objectFit: "cover" }}
          priority={hotel.isFeatured}
        />
        {hotel.isFeatured && (
          <span className="hm-badge">
            {t?.("hotelsPage.recommended") || "რეკომენდებული"}
          </span>
        )}
      </div>

      <p className="hotel-item-desc">{descText}</p>

      {hotel.priceFrom && (
        <p className="hotel-item-price">
          {priceLabelText ? `${priceLabelText} ` : ""}{format(hotel.priceFrom, lang)}
        </p>
      )}

      {hotel.bookingUrl && (
        <div className="hotel-item-button-wrapper">
          <a
            href={hotel.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hotel-item-button"
          >
            {buttonText || t?.("hotelsPage.bookNow") || "დაჯავშნა"}
          </a>
        </div>
      )}
    </article>
  );
}

export default function HotelsCatalogClient({ initialHotels = [] }) {
  const { t, lang } = useLanguage();
  const [hotels] = useState(initialHotels);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim();
    if (!term) return hotels;
    return hotels.filter(
      (hotel) =>
        matchesMultiLang(hotel.name, term) ||
        matchesMultiLang(hotel.city, term) ||
        matchesMultiLang(hotel.desc, term)
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
              <p>
                {hotels.length === 0
                  ? "სასტუმროების დამატება ხდება ადმინ პანელიდან."
                  : "სცადე სხვა საძიებო სიტყვა."}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
