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
import { useCurrency } from "../lib/currency/CurrencyContext";

const MAX_PHOTOS = 2;

async function upload(file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}

const empty = {
  name: "",
  city: "",
  desc: "",
  priceFrom: "",
  rating: "",
  bookingUrl: "",
  gallery: [],
  isFeatured: false,
  priceLabel: "",
  buttonText: "",
};

export default function HotelManager() {
  const { format } = useCurrency();
  const [form, setForm] = useState(empty);
  const [hotels, setHotels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => setHotels(await listHotels());

  useEffect(() => {
    refresh().catch(() => setError("სასტუმროების ჩატვირთვა ვერ მოხერხდა"));
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
        name: form.name.trim(),
        city: form.city.trim(),
        desc: form.desc.trim(),
        priceFrom: form.priceFrom.trim(),
        rating: form.rating === "" ? null : Number(form.rating),
        bookingUrl,
        gallery: form.gallery.slice(0, MAX_PHOTOS),
        isFeatured: form.isFeatured,
        priceLabel: form.priceLabel.trim(),
        buttonText: form.buttonText.trim(),
      };
      if (editingId) await updateHotel(editingId, payload);
      else await createHotel(payload);
      setForm(empty);
      setEditingId(null);
      await refresh();
      setMessage("სასტუმრო შენახულია");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (hotel) => {
    setEditingId(hotel.id);
    setForm({
      name: hotel.name || "",
      city: hotel.city || "",
      desc: hotel.desc || "",
      priceFrom: hotel.priceFrom || "",
      rating: hotel.rating ?? "",
      bookingUrl: hotel.bookingUrl || "",
      gallery: hotel.gallery || [],
      isFeatured: Boolean(hotel.isFeatured),
      priceLabel: hotel.priceLabel || "",
      buttonText: hotel.buttonText || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id) => {
    if (!confirm("წაიშალოს სასტუმრო?")) return;
    await deleteHotel(id);
    if (editingId === id) {
      setEditingId(null);
      setForm(empty);
    }
    await refresh();
  };

  return (
    <div className="admin-layout">
      <form className="admin-form" onSubmit={submit}>
        <header className="admin-form-header">
          <h2>{editingId ? "სასტუმროს რედაქტირება" : "სასტუმროს დამატება"}</h2>
          <p>
            დაამატე სახელი, აღწერა, მაქსიმუმ {MAX_PHOTOS} ფოტო და Booking.com-ის ლინკი — საიტზე
            „დაჯავშნა“ ღილაკი პირდაპირ ამ ლინკზე გადაიყვანს.
          </p>
        </header>

        {message && <div className="admin-alert success">{message}</div>}
        {error && <div className="admin-alert">{error}</div>}

        <fieldset className="admin-fieldset">
          <legend>ინფორმაცია</legend>
          <div className="admin-field">
            <label htmlFor="hotel-name">სასტუმროს სახელი</label>
            <input
              id="hotel-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="მაგ: Rooms Hotel Tbilisi"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-city">ქალაქი / მდებარეობა</label>
            <input
              id="hotel-city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="მაგ: თბილისი"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-desc">აღწერა</label>
            <textarea
              id="hotel-desc"
              required
              rows={6}
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              placeholder="მოკლედ აღწერე სასტუმრო, ნომრები, სერვისები..."
            />
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-price">ფასი დან (არასავალდებულო)</label>
            <input
              id="hotel-price"
              value={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
              placeholder="მაგ: 250 ₾ / ღამე"
            />
            {form.priceFrom && (
              <p className="admin-hint" style={{ color: "#38bdf8", marginTop: 4, fontWeight: 500 }}>
                ⇄ ავტომატური ვალუტა: {format(form.priceFrom)} (საიტზე გამოჩნდება არჩეული ვალუტის მიხედვით)
              </p>
            )}
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-price-label">ფასის ტექსტი (არასავალდებულო)</label>
            <input
              id="hotel-price-label"
              value={form.priceLabel}
              onChange={(e) => setForm({ ...form, priceLabel: e.target.value })}
              placeholder="მაგ: Стоимость проживания — (ცარიელი = მხოლოდ ფასი)"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-button-text">ღილაკის ტექსტი (არასავალდებულო)</label>
            <input
              id="hotel-button-text"
              value={form.buttonText}
              onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              placeholder="მაგ: Проверить цену (ცარიელი = 'დაჯავშნა')"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="hotel-rating">რეიტინგი 10-დან (არასავალდებულო)</label>
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
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            <span>რეკომენდებული სასტუმრო (სიის თავში)</span>
          </label>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Booking.com ლინკი</legend>
          <div className="admin-field">
            <label htmlFor="hotel-booking">დაჯავშნის ლინკი</label>
            <input
              id="hotel-booking"
              type="url"
              required
              value={form.bookingUrl}
              onChange={(e) => setForm({ ...form, bookingUrl: e.target.value })}
              placeholder="https://www.booking.com/hotel/ge/..."
            />
            <p className="admin-hint">
              ჩააგდე Booking.com-იდან დაკოპირებული ლინკი. მომხმარებელი „დაჯავშნა“-ზე დაწკაპებით
              ახალ ფანჯარაში ამ გვერდზე გადავა.
            </p>
          </div>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>ფოტოები (მაქს. {MAX_PHOTOS})</legend>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={uploadImages}
            disabled={saving || form.gallery.length >= MAX_PHOTOS}
          />
          <div className="admin-gallery-grid">
            {form.gallery.map((url, index) => (
              <div className="admin-gallery-item" key={url}>
                <Image src={url || "/placeholder.svg"} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                <button
                  type="button"
                  className="admin-gallery-remove"
                  onClick={() =>
                    setForm({ ...form, gallery: form.gallery.filter((_, i) => i !== index) })
                  }
                  aria-label="ფოტოს წაშლა"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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

      <aside className="admin-sidebar">
        <h2>დამატებული სასტუმროები</h2>
        {hotels.length === 0 ? (
          <p className="admin-hint">ჯერ სასტუმროები არ არის დამატებული.</p>
        ) : (
          <ul className="admin-tour-list">
            {hotels.map((hotel) => (
              <li key={hotel.id}>
                <div>
                  <strong>{asLocalizedText(hotel.name)}</strong>
                  <small>{asLocalizedText(hotel.city) || "მდებარეობა მითითებული არ არის"}</small>
                  <Link href="/hotels">ნახვა →</Link>
                </div>
                <button type="button" className="admin-btn-ghost" onClick={() => edit(hotel)}>
                  რედაქტირება
                </button>
                <button type="button" className="admin-btn-ghost" onClick={() => remove(hotel.id)}>
                  წაშლა
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
