"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  createHotel,
  deleteHotel,
  listHotels,
  updateHotel,
} from "../lib/hotelsFirestore";
import { normalizeBookingUrl } from "../lib/hotelsFirestore";
import { asLocalizedText } from "../lib/toursFirestore";
import { useCurrency } from "../lib/currency/CurrencyContext";
import LocalizedInputGroup, { emptyLangObj, parseLocal } from "./LocalizedInputGroup";

const MAX_PHOTOS = 2;

async function upload(file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}

const empty = () => ({
  name: emptyLangObj(),
  city: emptyLangObj(),
  desc: emptyLangObj(),
  priceFrom: "",
  rating: "",
  bookingUrl: "",
  gallery: [],
  isFeatured: false,
  priceLabel: emptyLangObj(),
  buttonText: emptyLangObj(),
});

export default function HotelManager({ onHotelsCountChange }) {
  const { format } = useCurrency();
  const [form, setForm] = useState(empty());
  const [hotels, setHotels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = async () => {
    try {
      const list = await listHotels();
      setHotels(list);
      if (onHotelsCountChange) onHotelsCountChange(list.length);
    } catch {
      setError("სასტუმროების ჩატვირთვა ვერ მოხერხდა");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const uploadImages = async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    const room = MAX_PHOTOS - form.gallery.length;
    if (room <= 0) {
      setError(`მაქსიმუმ ${MAX_PHOTOS} ფოტოა დასაშვები`);
      event.target.value = "";
      return;
    }
    setSaving(true);
    setError("");
    try {
      const urls = await Promise.all(files.slice(0, room).map(upload));
      setForm((current) => ({
        ...current,
        gallery: [...current.gallery, ...urls].slice(0, MAX_PHOTOS),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const bookingUrl = normalizeBookingUrl(form.bookingUrl);
    if (!bookingUrl) {
      setError("Booking.com-ის ლინკი აუცილებელია");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        city: form.city,
        desc: form.desc,
        priceFrom: form.priceFrom.trim(),
        rating: form.rating === "" ? null : Number(form.rating),
        bookingUrl,
        gallery: form.gallery.slice(0, MAX_PHOTOS),
        isFeatured: form.isFeatured,
        priceLabel: form.priceLabel,
        buttonText: form.buttonText,
      };
      if (editingId) await updateHotel(editingId, payload);
      else await createHotel(payload);
      setForm(empty());
      setEditingId(null);
      await refresh();
      setMessage("სასტუმრო წარმატებით შენახულია!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (hotel) => {
    setEditingId(hotel.id);
    setForm({
      name: parseLocal(hotel.name),
      city: parseLocal(hotel.city),
      desc: parseLocal(hotel.desc),
      priceFrom: hotel.priceFrom || "",
      rating: hotel.rating ?? "",
      bookingUrl: hotel.bookingUrl || "",
      gallery: hotel.gallery || [],
      isFeatured: Boolean(hotel.isFeatured),
      priceLabel: parseLocal(hotel.priceLabel),
      buttonText: parseLocal(hotel.buttonText),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ სასტუმროს წაშლა?")) return;
    await deleteHotel(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(empty());
    }
    await refresh();
  };

  const filteredHotels = hotels.filter((h) => {
    const nameText = asLocalizedText(h.name).toLowerCase();
    const cityText = asLocalizedText(h.city).toLowerCase();
    const q = searchQuery.toLowerCase();
    return !q || nameText.includes(q) || cityText.includes(q);
  });

  return (
    <div className="admin-layout">
      {/* FORM CARD */}
      <form className="admin-form" onSubmit={submit}>
        <header className="admin-form-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{editingId ? "🏨 სასტუმროს რედაქტირება" : "🏨 ახალი სასტუმროს დამატება"}</h2>
            {editingId && (
              <span className="admin-tag-pill" style={{ background: "rgba(41,178,183,0.2)", color: "#29b2b7" }}>
                რედაქტირების რეჟიმი
              </span>
            )}
          </div>
          <p>
            დაამატეთ სახელი, აღწერა, მაქსიმუმ {MAX_PHOTOS} ფოტო და Booking.com-ის ლინკი.
          </p>
        </header>

        {message && <div className="admin-alert success">{message}</div>}
        {error && <div className="admin-alert error">{error}</div>}

        <fieldset className="admin-fieldset">
          <legend>მრავალენოვანი ინფორმაცია (თარგმანი)</legend>
          <LocalizedInputGroup
            label="სასტუმროს სახელი"
            value={form.name}
            onChange={(val) => setForm({ ...form, name: val })}
            placeholder="მაგ: Rooms Hotel Tbilisi, Radisson Blu"
            required
          />

          <LocalizedInputGroup
            label="ქალაქი / მდებარეობა"
            value={form.city}
            onChange={(val) => setForm({ ...form, city: val })}
            placeholder="მაგ: თბილისი, ბათუმი, ყაზბეგი"
          />

          <LocalizedInputGroup
            label="სასტუმროს აღწერა"
            type="textarea"
            rows={4}
            value={form.desc}
            onChange={(val) => setForm({ ...form, desc: val })}
            placeholder="მოკლედ აღწერეთ სასტუმრო, ნომრები, სერვისები..."
            required
          />
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>ფასი & პარამეტრები</legend>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="hotel-price">ფასი დან (არასავალდებულო)</label>
              <input
                id="hotel-price"
                value={form.priceFrom}
                onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
                placeholder="მაგ: 250 ₾ / ღამე"
              />
              {form.priceFrom && (
                <p className="admin-hint" style={{ color: "#38bdf8", marginTop: 4, fontWeight: 500, fontSize: "0.8rem" }}>
                  ⇄ ვალუტის გადაყვანა: {format(form.priceFrom)}
                </p>
              )}
            </div>
            <div className="admin-field">
              <label htmlFor="hotel-rating">რეიტინგი 10-დან</label>
              <input
                id="hotel-rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                placeholder="მაგ: 8.9"
              />
            </div>
          </div>

          <LocalizedInputGroup
            label="ფასის ტექსტი (არასავალდებულო)"
            value={form.priceLabel}
            onChange={(val) => setForm({ ...form, priceLabel: val })}
            placeholder="მაგ: Стоимость проживания — (ცარიელი = მხოლოდ ფასი)"
          />

          <LocalizedInputGroup
            label="ღილაკის ტექსტი (არასავალდებულო)"
            value={form.buttonText}
            onChange={(val) => setForm({ ...form, buttonText: val })}
            placeholder="მაგ: Проверить цену (ცარიელი = 'დაჯავშნა')"
          />

          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            <span>⭐ რეკომენდებული სასტუმრო (გამოჩნდება სიის თავში)</span>
          </label>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Booking.com პირდაპირი ლინკი *</legend>
          <div className="admin-field">
            <label htmlFor="hotel-booking">დაჯავშნის URL</label>
            <input
              id="hotel-booking"
              type="url"
              required
              value={form.bookingUrl}
              onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
              placeholder="https://www.booking.com/hotel/ge/..."
            />
            <p className="admin-hint" style={{ fontSize: "0.8rem", margin: "0.3rem 0 0" }}>
              მომხმარებელი „დაჯავშნა“ ღილაკზე დაწკაპებით პირდაპირ ამ ლინკზე გადამისამართდება.
            </p>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>ფოტოები (მაქსიმუმ {MAX_PHOTOS})</legend>
          <div style={{ marginBottom: "0.75rem" }}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={uploadImages}
              disabled={saving || form.gallery.length >= MAX_PHOTOS}
              style={{ padding: "0.5rem", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}
            />
          </div>
          {form.gallery.length > 0 ? (
            <div className="admin-gallery-grid">
              {form.gallery.map((url, index) => (
                <div className="admin-gallery-item" key={url}>
                  <Image src={url || "/placeholder.svg"} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                  <button
                    type="button"
                    className="admin-gallery-remove"
                    title="ფოტოს წაშლა"
                    onClick={() =>
                      setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== index) })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-hint" style={{ margin: 0 }}>
              ატვირთეთ {MAX_PHOTOS}-მდე ფოტო
            </p>
          )}
        </fieldset>

        <div className="admin-form-actions">
          <button className="admin-btn-primary" disabled={saving}>
            {saving ? "ინახება..." : editingId ? "ცვლილებების შენახვა" : "სასტუმროს შენახვა"}
          </button>
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => {
              setForm(empty);
              setEditingId(null);
              setError("");
              setMessage("");
            }}
          >
            გასუფთავება
          </button>
        </div>
      </form>

      {/* CATALOG CARDS LIST */}
      <aside className="admin-sidebar" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>სასტუმროების სია</h2>
          <span className="admin-tab-count">{hotels.length}</span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "1.25rem" }}>
          <input
            type="text"
            placeholder="🔍 მოძებნეთ სასტუმრო ან ქალაქი..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "0.88rem",
            }}
          />
        </div>

        {filteredHotels.length === 0 ? (
          <p className="admin-hint">სასტუმროები ვერ მოიძებნა.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "800px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredHotels.map((hotel) => {
              const mainImg = hotel.gallery?.[0] || "/hero.png";
              return (
                <div key={hotel.id} className="admin-entry-card">
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
                        {asLocalizedText(hotel.name)}
                      </h4>
                      <div className="admin-entry-tags">
                        <span className="admin-tag-pill">{asLocalizedText(hotel.city) || "საქართველო"}</span>
                        {hotel.priceFrom && <span className="admin-tag-pill price">💰 {hotel.priceFrom}</span>}
                        {hotel.rating && <span className="admin-tag-pill badge">⭐ {hotel.rating}</span>}
                        {hotel.isFeatured && <span className="admin-tag-pill badge">✨ რეკომენდებული</span>}
                      </div>
                    </div>
                  </div>
                  <div className="admin-entry-actions">
                    <a href={hotel.bookingUrl} target="_blank" rel="noopener noreferrer" className="admin-action-btn link">
                      Booking.com ↗
                    </a>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button type="button" className="admin-action-btn edit" onClick={() => edit(hotel)}>
                        რედაქტირება
                      </button>
                      <button type="button" className="admin-action-btn delete" onClick={() => remove(hotel.id)}>
                        წაშლა
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
