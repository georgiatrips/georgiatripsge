"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GEORGIA_REGIONS } from "../lib/placesMeta";
import { createPlace, deletePlace, listPlaces, updatePlace } from "../lib/placesFirestore";
import { asLocalizedText, extractImageUrl } from "../lib/toursFirestore";
import LocalizedInputGroup, { emptyLangObj, parseLocal } from "./LocalizedInputGroup";
import { adminFetch } from "../lib/apiClient";

async function upload(file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await adminFetch("/api/upload", { method: "POST", body: fd });
  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: `ატვირთვა ვერ მოხერხდა (სტატუსი: ${response.status})` };
  }
  if (!response.ok) throw new Error(data?.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}

const empty = () => ({
  title: emptyLangObj(),
  desc: emptyLangObj(),
  region: GEORGIA_REGIONS[0],
  gallery: [],
  isPopular: false,
});

export default function PlaceManager({ onPlacesCountChange }) {
  const [form, setForm] = useState(empty());
  const [places, setPlaces] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");

  const refresh = async () => {
    try {
      const list = await listPlaces();
      setPlaces(list);
      if (onPlacesCountChange) onPlacesCountChange(list.length);
    } catch {
      setMessage("ადგილების ჩატვირთვა ვერ მოხერხდა");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        title: form.title,
        desc: form.desc,
        img: form.gallery[0] || "/hero.png",
      };
      if (editingId) await updatePlace(editingId, payload);
      else await createPlace(payload);
      setForm(empty());
      setEditingId(null);
      await refresh();
      setMessage("ადგილი წარმატებით შენახულია!");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    setSaving(true);
    try {
      const urls = await Promise.all(files.map(upload));
      setForm((current) => ({ ...current, gallery: [...current.gallery, ...urls] }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const edit = (place) => {
    setEditingId(place.id);
    setForm({
      title: parseLocal(place.title),
      desc: parseLocal(place.desc),
      region: asLocalizedText(place.region) || GEORGIA_REGIONS[0],
      gallery: place.gallery || [],
      isPopular: place.isPopular,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ ადგილის წაშლა?")) return;
    await deletePlace(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(empty());
    }
    await refresh();
  };

  const filteredPlaces = places.filter((p) => {
    const titleText = asLocalizedText(p.title).toLowerCase();
    const regionText = asLocalizedText(p.region);
    const matchesSearch = !searchQuery || titleText.includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || regionText === regionFilter;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="admin-layout">
      {/* FORM CARD */}
      <form className="admin-form" onSubmit={submit}>
        <header className="admin-form-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{editingId ? "📍 ადგილის რედაქტირება" : "📍 ახალი ადგილის დამატება"}</h2>
            {editingId && (
              <span className="admin-tag-pill" style={{ background: "rgba(41,178,183,0.2)", color: "#29b2b7" }}>
                რედაქტირების რეჟიმი
              </span>
            )}
          </div>
          <p>ადგილები გამოიყენება ტურების მარშრუტებში და ცალკე ლოკაციების კატალოგში.</p>
        </header>

        {message && (
          <div className={`admin-alert ${message.includes("წარმატებით") ? "success" : "error"}`}>
            {message}
          </div>
        )}

        <fieldset className="admin-fieldset">
          <legend>მრავალენოვანი ინფორმაცია (თარგმანი)</legend>
          <LocalizedInputGroup
            label="ადგილის სახელი"
            value={form.title}
            onChange={(val) => setForm({ ...form, title: val })}
            placeholder="მაგ: დარიალის ხეობა, მარტვილის კანიონი"
            required
          />

          <LocalizedInputGroup
            label="ადგილის აღწერა"
            type="textarea"
            rows={4}
            value={form.desc}
            onChange={(val) => setForm({ ...form, desc: val })}
            placeholder="მოკლედ აღწერეთ ეს ადგილი, ღირსშესანიშნაობები, მდებარეობა..."
            required
          />

          <div className="admin-field">
            <label>რეგიონი</label>
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              {GEORGIA_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.isPopular}
              onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
            />
            <span>⭐ პოპულარული ადგილი (გამოჩნდება გამორჩეულებში)</span>
          </label>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>ფოტო გალერეა (Cloudinary)</legend>
          <div style={{ marginBottom: "0.75rem" }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadImages}
              disabled={saving}
              style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}
            />
          </div>
          {form.gallery.length > 0 ? (
            <div className="admin-gallery-grid">
              {form.gallery
                .filter((url) => Boolean(url && url.trim()))
                .map((url, index) => (
                  <div className="admin-gallery-item" key={url || index}>
                    <Image src={url || "/hero.png"} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                  <button
                    type="button"
                    className="admin-gallery-remove"
                    title="ფოტოს წაშლა"
                    onClick={() =>
                      setForm({
                        ...form,
                        gallery: form.gallery.filter((_, i) => i !== index),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-hint" style={{ margin: 0 }}>
              ატვირთეთ ერთი ან მეტი ფოტო
            </p>
          )}
        </fieldset>

        <div className="admin-form-actions">
          <button className="admin-btn-primary" disabled={saving}>
            {saving ? "ინახება..." : editingId ? "ცვლილებების შენახვა" : "ადგილის შენახვა"}
          </button>
          {editingId && (
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => {
                setForm(empty);
                setEditingId(null);
              }}
            >
              გაუქმება
            </button>
          )}
        </div>
      </form>

      {/* CATALOG CARDS LIST */}
      <aside className="admin-sidebar" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>ადგილების კატალოგი</h2>
          <span className="admin-tab-count">{places.length}</span>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <input
            type="text"
            placeholder="🔍 მოძებნეთ ადგილი..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.55rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "0.88rem",
            }}
          />
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.8)",
              color: "#fff",
              fontSize: "0.85rem",
            }}
          >
            <option value="all">ყველა რეგიონი ({places.length})</option>
            {GEORGIA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {filteredPlaces.length === 0 ? (
          <p className="admin-hint">ადგილები ვერ მოიძებნა.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "800px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredPlaces.map((place) => {
              const mainImg =
                extractImageUrl(place.img) ||
                (place.gallery && extractImageUrl(place.gallery[0])) ||
                "/hero.png";
              return (
                <div key={place.id} className="admin-entry-card">
                  <div style={{ display: "flex", gap: "0.8rem", padding: "0.8rem" }}>
                    <div
                      style={{
                        position: "relative",
                        width: "72px",
                        height: "72px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <Image src={mainImg} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {asLocalizedText(place.title)}
                      </h4>
                      <div className="admin-entry-tags">
                        <span className="admin-tag-pill">{asLocalizedText(place.region)}</span>
                        {place.isPopular && <span className="admin-tag-pill badge">⭐ პოპულარული</span>}
                      </div>
                    </div>
                  </div>
                  <div className="admin-entry-actions">
                    <Link href={`/places/${place.id}`} className="admin-action-btn link" target="_blank">
                      👁️ ნახვა ↗
                    </Link>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        type="button"
                        className={`admin-action-btn edit ${editingId === place.id ? "is-editing" : ""}`}
                        onClick={() => edit(place)}
                      >
                        ✏️ რედაქტირება
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn delete"
                        onClick={() => remove(place.id)}
                      >
                        🗑️ წაშლა
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
