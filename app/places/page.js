"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { GEORGIA_REGIONS, formatRegionName } from "../lib/placesMeta";
import { listPlaces } from "../lib/placesFirestore";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { asLocalizedText, matchesMultiLang } from "../lib/toursFirestore";
import { SearchIcon } from "../components/Icons";

function PlaceCard({ place, lang }) {
  return (
    <Link href={`/places/${place.id}`} className="place-card">
      <div className="place-card-media">
        <Image src={place.img} alt={asLocalizedText(place.title, lang)} fill sizes="(max-width: 760px) 100vw, 33vw" style={{ objectFit: "cover" }} />
        <span className="place-card-region">{formatRegionName(asLocalizedText(place.region, lang), lang)}</span>
      </div>
      <div className="place-card-title"><h3>{asLocalizedText(place.title, lang)}</h3></div>
    </Link>
  );
}

export default function PlacesPage() {
  const { t, lang } = useLanguage();
  const [places, setPlaces] = useState([]);
  const [region, setRegion] = useState("all");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => active && setPlaces(items))
      .catch((err) => active && setError(err?.message || t("placesPage.errorMsg")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t]);

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

  const placesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": "https://georgiatrips.ge/places#breadcrumbs",
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
            "name": lang === "ka" ? "ღირსშესანიშნაობები" : "Places & Sights",
            "item": "https://georgiatrips.ge/places",
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": "https://georgiatrips.ge/places#list",
        "name": "Top Attractions and Places to Visit in Georgia",
        "itemListElement": visiblePlaces.map((p, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "name": asLocalizedText(p.title, lang),
          "url": `https://georgiatrips.ge/places/${p.id}`,
        })),
      },
    ],
  };

  return (
    <div className="places-page">
      <Navbar active="places" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placesJsonLd) }}
      />
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
                  <button key={item.value} type="button" className={filter === item.value ? "is-active" : ""} onClick={() => { setFilter(item.value); setPage(1); }}>{item.label}</button>
                ))}
              </div>
              
              <div className="places-search-box" style={{ position: "relative", display: "flex", alignItems: "center", flex: "1", maxWidth: "320px" }}>
                <SearchIcon size={16} color="var(--teal)" style={{ position: "absolute", left: "12px", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder={t("common.search")}
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="admin-input"
                  style={{ width: "100%", padding: "0.55rem 0.8rem 0.55rem 2.3rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "0.9rem" }}
                />
              </div>

              <label className="places-region-select">
                <span>{t("placesPage.region")}</span>
                <select value={region} onChange={(event) => { setRegion(event.target.value); setPage(1); }}>
                  <option value="all">{t("placesPage.allRegions")}</option>
                  {GEORGIA_REGIONS.map((item) => (
                    <option key={item} value={item}>
                      {formatRegionName(item, lang)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {loading && <div className="places-state">{t("placesPage.loading")}</div>}
            {!loading && error && <div className="places-state places-state-error">{error}</div>}
            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="places-grid">
                  {visiblePlaces.map((place) => <PlaceCard key={place.id} place={place} lang={lang} />)}
                </div>
                <div className="catalog-pagination" aria-label={t("placesPage.title")}>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button key={number} type="button" className={page === number ? "is-active" : ""} onClick={() => setPage(number)}>{number}</button>
                  ))}
                </div>
              </>
            )}
            {!loading && !error && filtered.length === 0 && (
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