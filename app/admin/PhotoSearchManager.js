"use client";

import React, { useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// Admin "ფოტოების ძებნა": type a place (გოდერძი, Goderdzi Pass …) and get
// photos of exactly that place from Wikimedia Commons, Flickr, Unsplash,
// Pexels and Pixabay, each with its download link, page link and credit.
// The checking itself is in app/lib/server/photoSearch.js.

const SOURCE_LABELS = {
  wikimedia: "Wikimedia",
  flickr: "Flickr",
  unsplash: "Unsplash",
  pexels: "Pexels",
  pixabay: "Pixabay",
};

const LEVEL_LABELS = {
  gps: "📍 GPS-ით დამოწმებული",
  category: "🗂️ ადგილის კატეგორიაში",
  name: "✅ სახელით დამოწმებული",
  context: "✅ სახელი + რეგიონი",
  mention: "⚠️ მხოლოდ აღწერაში ახსენებს",
};

const credit = (p) => [p.author && `© ${p.author}`, p.license, SOURCE_LABELS[p.source]].filter(Boolean).join(" · ");

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function PhotoSearchManager() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("all");
  const [showMentions, setShowMentions] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [copied, setCopied] = useState("");

  const search = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError("");
    setResult(null);
    setSource("all");
    try {
      const res = await adminFetch(`/api/admin/photo-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(`ძებნა ვერ მოხერხდა: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const list = useMemo(() => {
    if (!result) return [];
    const all = showMentions ? [...result.photos, ...result.mentions] : result.photos;
    return source === "all" ? all : all.filter((p) => p.source === source);
  }, [result, source, showMentions]);

  const flash = async (key, text) => {
    if (await copy(text)) {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    }
  };

  const allLinks = list.map((p) => `${p.imageUrl}\n  ${credit(p)}\n  ${p.pageUrl}`).join("\n\n");

  return (
    <div className="phs">
      <form className="phs-form" onSubmit={search}>
        <input
          className="adm-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ადგილი: გოდერძი, მახუნცეთი, Goderdzi Pass…"
          aria-label="ადგილის სახელი"
        />
        <button type="submit" className="admin-btn-primary" disabled={loading || query.trim().length < 2}>
          {loading ? "ვეძებ…" : "🔎 ძებნა"}
        </button>
      </form>
      <p className="phs-hint">
        ადგილს ჯერ Wikidata-ზე ვპოულობ (კოორდინატები, სახელები ქართულად/ინგლისურად/რუსულად), შემდეგ 5 საიტზე ვეძებ და
        თითო ფოტოს სათაურს, აღწერას, თეგებს და GPS-ს ვკითხულობ. ადამიანის სახელი („Goderdzi Shvelidze“) და სხვა ადგილას
        გადაღებული ფოტო იყრება.
      </p>

      {error && <div className="phs-error">{error}</div>}
      {loading && <div className="phs-loading">ვეძებ Wikimedia, Flickr, Unsplash, Pexels და Pixabay-ზე… (10–30 წამი)</div>}

      {result && (
        <>
          <div className="phs-place">
            {result.place.items.length ? (
              result.place.items.map((p) => (
                <span key={p.id} className="phs-chip">
                  📍 {p.label}
                  {p.labelEn && p.labelEn !== p.label ? ` / ${p.labelEn}` : ""}
                  {p.point && (
                    <a href={`https://www.google.com/maps?q=${p.point.lat},${p.point.lng}`} target="_blank" rel="noreferrer">
                      {" "}რუკა
                    </a>
                  )}
                </span>
              ))
            ) : (
              <span className="phs-chip phs-warn">⚠️ Wikidata-ზე ადგილი ვერ ვიპოვე — ვამოწმებ მხოლოდ სახელით + საქართველოს კონტექსტით</span>
            )}
            <span className="phs-muted">ძებნის სიტყვები: {result.place.searchTerms.join(", ")}</span>
          </div>

          <div className="phs-sources">
            <button type="button" className={`phs-src${source === "all" ? " is-active" : ""}`} onClick={() => setSource("all")}>
              ყველა <b>{result.photos.length}</b>
            </button>
            {Object.entries(result.sources).map(([key, s]) => (
              <button
                key={key}
                type="button"
                className={`phs-src${source === key ? " is-active" : ""}${s.state !== "ok" ? " is-off" : ""}`}
                onClick={() => setSource(key)}
                title={s.state === "ok" ? `${s.via}: ნაპოვნი ${s.found}, დამოწმებული ${s.kept}` : s.error || `${s.env} არ არის დაყენებული`}
              >
                {s.label} <b>{s.state === "ok" ? s.kept : s.state === "no_key" ? "🔑" : "✖"}</b>
              </button>
            ))}
          </div>

          {Object.values(result.sources).some((s) => s.state !== "ok" || /Openverse/.test(s.via || "")) && (
            <div className="phs-keys">
              {Object.values(result.sources).map((s) =>
                s.state === "no_key" || /Openverse/.test(s.via || "") ? (
                  <div key={s.label}>
                    🔑 <b>{s.label}</b>: {s.state === "no_key" ? "API key არ არის" : "API key-ის გარეშე Openverse-ით ვეძებ (მხოლოდ CC ფოტოები, აღწერის გარეშე)"} —
                    Vercel-ში დაამატე <code>{s.env}</code> (უფასო key: <a href={s.keyUrl} target="_blank" rel="noreferrer">{s.keyUrl}</a>)
                  </div>
                ) : s.state === "error" ? (
                  <div key={s.label}>❌ <b>{s.label}</b>: {s.error}</div>
                ) : null,
              )}
            </div>
          )}

          <div className="phs-toolbar">
            <span>
              <b>{list.length}</b> ფოტო
            </span>
            {result.mentions.length > 0 && (
              <label>
                <input type="checkbox" checked={showMentions} onChange={(e) => setShowMentions(e.target.checked)} /> ასევე „მხოლოდ
                ახსენებს“ ({result.mentions.length})
              </label>
            )}
            {list.length > 0 && (
              <button type="button" className="admin-btn-ghost" onClick={() => flash("all", allLinks)}>
                {copied === "all" ? "✓ დაკოპირდა" : "📋 ყველა ლინკის კოპირება"}
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="phs-empty">დამოწმებული ფოტო ვერ ვიპოვე. სცადე სხვა სახელი (მაგ. ინგლისურად) ან დაამატე API key-ები.</div>
          ) : (
            <div className="phs-grid">
              {list.map((p) => (
                <article key={p.id} className={`phs-card${p.match.level === "mention" ? " is-mention" : ""}`}>
                  <a href={p.pageUrl} target="_blank" rel="noreferrer" className="phs-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.previewUrl} alt={p.title} loading="lazy" referrerPolicy="no-referrer" />
                    <span className="phs-badge">{SOURCE_LABELS[p.source]}</span>
                  </a>
                  <div className="phs-body">
                    <div className="phs-title" title={p.description || p.title}>{p.title || "(უსათაურო)"}</div>
                    <div className="phs-why">
                      {LEVEL_LABELS[p.match.level]}
                      <small>{p.match.why}</small>
                    </div>
                    <div className="phs-credit">{credit(p)}{p.width ? ` · ${p.width}×${p.height}` : ""}</div>
                    <div className="phs-actions">
                      <a className="admin-btn-primary" href={p.imageUrl} target="_blank" rel="noreferrer">⬇ ფოტო</a>
                      <a className="admin-btn-ghost" href={p.pageUrl} target="_blank" rel="noreferrer">🔗 გვერდი</a>
                      <button type="button" className="admin-btn-ghost" onClick={() => flash(`u${p.id}`, p.imageUrl)}>
                        {copied === `u${p.id}` ? "✓" : "📋 ლინკი"}
                      </button>
                      <button type="button" className="admin-btn-ghost" onClick={() => flash(`c${p.id}`, `${credit(p)} — ${p.pageUrl}`)}>
                        {copied === `c${p.id}` ? "✓" : "© კრედიტი"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.rejected.length > 0 && (
            <div className="phs-rejected">
              <button type="button" className="admin-btn-ghost" onClick={() => setShowRejected((v) => !v)}>
                {showRejected ? "▲" : "▼"} უარყოფილი ფოტოები ({result.rejected.length}) — რატომ
              </button>
              {showRejected && (
                <ul>
                  {result.rejected.map((r, i) => (
                    <li key={i}>
                      <span className="phs-muted">[{SOURCE_LABELS[r.source]}]</span>{" "}
                      <a href={r.pageUrl} target="_blank" rel="noreferrer">{r.title || "(უსათაურო)"}</a> — {r.why}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
