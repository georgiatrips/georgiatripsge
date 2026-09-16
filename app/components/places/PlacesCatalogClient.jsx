"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import { GEORGIA_REGIONS, formatRegionName } from "../../lib/placesMeta";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, matchesMultiLang } from "../../lib/toursShared";
import { getLocalizedHref } from "../../lib/siteConfig";
import { placePath } from "../../lib/slugs";
import { SearchIcon } from "../Icons";

function PlaceCard({ place, lang }) {
  return (
    <Link href={getLocalizedHref(placePath(place), lang)} className="place-card">
      <div className="place-card-media">
        <Image
          src={place.img}
          alt={asLocalizedText(place.title, lang)}
          fill
          sizes="(max-width: 560px) 100vw, (max-width: 1020px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
        <span className="place-card-region">
          {formatRegionName(asLocalizedText(place.region, lang), lang)}
        </span>
      </div>
      <div className="place-card-title">
        <h3>{asLocalizedText(place.title, lang)}</h3>
      </div>
    </Link>
  );
}

export default function PlacesCatalogClient({ initialPlaces = [] }) {
  const { t, lang } = useLanguage();
  const [places] = useState(initialPlaces);
  const [region, setRegion] = useState("all");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const items = places.filter((place) => {
      if (region !== "all" && place.region !== region) return false;
      if (filter === "popular" && !place.isPopular) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTitle = matchesMultiLang(place.title, q);
        const matchDesc = matchesMultiLang(place.desc, q);
        const matchRegion = matchesMultiLang(place.region, q);
        if (!matchTitle && !matchDesc && !matchRegion) return false;
      }
      return true;
    });
    if (filter === "new") {
      return [...items].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    }
    return items;
  }, [places, region, filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const visiblePlaces = filtered.slice((page - 1) * 12, page * 12);

  const filterTabs = [
    { value: "all", label: t("placesPage.all") },
    { value: "new", label: t("placesPage.new") },
    { value: "popular", label: t("placesPage.popular") },
  ];

  return (
    <div className="places-page">
      <Navbar active="places" />
      <main>
        <PageHero
          kicker={t("placesPage.kicker")}
          title={t("placesPage.title")}
          subtitle={t("placesPage.subtitle")}
          image="/tbilisi.webp"
          alt={t("placesPage.title")}
        />

        <section className="places-catalog-section">
          <div className="container">
            <div className="places-filter-bar" aria-label={t("placesPage.title")}>
              <div className="places-filter-tabs">
                {filterTabs.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={filter === item.value ? "is-active" : ""}
                    onClick={() => {
                      setFilter(item.value);
                      setPage(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="places-search">
                <span className="gt-sr-only">{t("common.search")}</span>
                <SearchIcon size={16} />
                <input
                  type="search"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </label>

              <label className="places-region-select">
                <span>{t("placesPage.region")}</span>
                <select
                  value={region}
                  onChange={(event) => {
                    setRegion(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">{t("placesPage.allRegions")}</option>
                  {GEORGIA_REGIONS.map((item) => (
                    <option key={item} value={item}>
                      {formatRegionName(item, lang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filtered.length > 0 && (
              <>
                <div className="places-grid">
                  {visiblePlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} lang={lang} />
                  ))}
                </div>
                {totalPages > 1 && (
                <div className="catalog-pagination" aria-label={t("placesPage.title")}>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      className={page === number ? "is-active" : ""}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </button>
                  ))}
                </div>
                )}
              </>
            )}

            {filtered.length === 0 && (
              <div className="places-state">
                <h2>{t("placesPage.noPlacesYet")}</h2>
                <p>{t("placesPage.noPlacesDesc")}</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
