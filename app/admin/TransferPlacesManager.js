"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { adminFetch } from "../lib/apiClient";
import { getCustomTransferPlaces, saveCustomTransferPlaces } from "../lib/transfers/customPlacesFirestore";
import {
  CUSTOM_PLACE_TYPES,
  matchCustomPlaces,
  nameFromMapLink,
  parseMapCoordinates,
} from "../lib/transfers/customPlaces";

const TransferMap = dynamic(() => import("../components/transfers/TransferMap"), {
  ssr: false,
  loading: () => <div className="tpl-map-skeleton" />,
});

const TYPE_LABELS = {
  hotel: "🏨 სასტუმრო",
  sight: "🏛️ ღირსშესანიშნაობა",
  church: "⛪ ტაძარი",
  nature: "⛰️ ბუნება",
  airport: "✈️ აეროპორტი",
  station: "🚉 სადგური",
  city: "🏙️ ქალაქი",
  village: "🏡 სოფელი",
  food: "🍽️ რესტორანი",
  shop: "🛍️ მაღაზია",
  place: "📍 სხვა",
};

const EMPTY_FORM = { id: null, link: "", name: "", nameEn: "", aliases: "", type: "hotel", lat: null, lng: null };

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const mapsUrl = (p) => `https://www.google.com/maps?q=${p.lat},${p.lng}`;

export default function TransferPlacesManager() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState(null);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  useEffect(() => {
    getCustomTransferPlaces()
      .then(setPlaces)
      .catch((err) => {
        console.error("Transfer places load failed:", err);
        showMsg("error", "ლოკაციების ჩატვირთვა ვერ მოხერხდა.");
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const point = form.lat != null ? { lat: form.lat, lng: form.lng } : null;

  // A pasted link or "lat, lng" is read at once; short links and links
  // without coordinates go through the server, which opens them.
  const readLink = async (text) => {
    const value = text.trim();
    if (!value) return;
    const local = parseMapCoordinates(value);
    const localName = nameFromMapLink(value);
    if (local) {
      set({ ...local, name: form.name || localName });
      return;
    }
    if (!/^https?:\/\//i.test(value)) {
      showMsg("error", "ვერ ამოვიცანი. ჩასვით Google Maps-ის ბმული ან კოორდინატები (მაგ: 41.6485, 41.6339).");
      return;
    }
    setReading(true);
    try {
      const res = await adminFetch("/api/admin/map-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.status);
      // "Pullman Batumi, Kobaladze St 2" → the name part for the field.
      const linkName = (data.name || "").split(",")[0].trim();
      setForm((f) => ({
        ...f,
        name: f.name || linkName,
        ...(data.lat != null ? { lat: data.lat, lng: data.lng } : {}),
      }));
      if (data.lat == null) {
        // No coordinates in the link: start the pin at the map search's best
        // guess for the name, for the admin to check and move.
        const guess = data.name
          ? await fetch(`/api/transfers/places?q=${encodeURIComponent(data.name.slice(0, 100))}&lang=ka`)
              .then((r) => r.json())
              .then((d) => d.results?.[0])
              .catch(() => null)
          : null;
        if (guess) {
          set({ lat: guess.lat, lng: guess.lng });
          showMsg("error", `ბმულში ზუსტი წერტილი არ იყო — ნიშნული დავსვი „${guess.name}“-ზე. შეამოწმეთ რუკაზე და საჭიროებისამებრ გადაათრიეთ.`);
        } else {
          showMsg("error", "ბმულში კოორდინატები ვერ ვიპოვე. მონიშნეთ ადგილი რუკაზე, ან Google Maps-ში დააჭირეთ ადგილს მარჯვენა ღილაკით და ჩასვით კოორდინატები.");
        }
      }
    } catch (err) {
      console.warn("Map link read failed:", err);
      showMsg("error", "ბმულის გახსნა ვერ მოხერხდა. მონიშნეთ ადგილი რუკაზე ან ჩასვით კოორდინატები.");
    } finally {
      setReading(false);
    }
  };

  const persist = async (next, successText) => {
    setSaving(true);
    try {
      const saved = await saveCustomTransferPlaces(next);
      setPlaces(saved);
      try {
        await adminFetch("/api/admin/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "transfers" }),
        });
      } catch (err) {
        console.warn("Transfer places revalidate failed:", err);
      }
      showMsg("success", successText);
      return true;
    } catch (err) {
      console.error("Transfer places save failed:", err);
      const reason = err?.code === "permission-denied" ? "ამ ანგარიშს ადმინის უფლება არ აქვს" : err?.message || String(err);
      showMsg("error", `შენახვა ვერ მოხერხდა: ${reason}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showMsg("error", "ჩაწერეთ ადგილის სახელი.");
    if (!point) return showMsg("error", "მიუთითეთ ადგილი: ჩასვით ბმული ან დააჭირეთ რუკაზე.");
    const entry = {
      id: form.id || newId(),
      name: form.name,
      nameEn: form.nameEn,
      aliases: form.aliases,
      type: form.type,
      lat: form.lat,
      lng: form.lng,
    };
    const next = form.id ? places.map((p) => (p.id === form.id ? entry : p)) : [entry, ...places];
    if (await persist(next, form.id ? "✓ ლოკაცია განახლდა." : `✓ „${entry.name}“ დაემატა — ტრანსფერის ძებნაში უკვე ჩანს.`)) {
      setForm(EMPTY_FORM);
    }
  };

  const handleDelete = async (place) => {
    if (!confirm(`წავშალო „${place.name}“?`)) return;
    await persist(places.filter((p) => p.id !== place.id), "✓ ლოკაცია წაიშალა.");
    if (form.id === place.id) setForm(EMPTY_FORM);
  };

  const shown = useMemo(() => (filter.trim() ? matchCustomPlaces(places, filter, places.length) : places), [places, filter]);

  if (loading) return <div className="tp-wrap"><p className="admin-hint">ლოკაციები იტვირთება...</p></div>;

  return (
    <div className="tp-wrap">
      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <div className="tp-card">
        <h2 className="tp-title">{form.id ? "ლოკაციის რედაქტირება" : "ახალი ლოკაცია ტრანსფერისთვის"}</h2>
        <p className="admin-hint">
          სასტუმრო ან ადგილი, რომელსაც ტრანსფერის ძებნა ვერ პოულობს, აქ დაამატეთ — ძებნაში პირველი გამოჩნდება.
          Google Maps-ში გახსენით ადგილი → „გაზიარება“ → დააკოპირეთ ბმული და ჩასვით ქვემოთ. წერტილი რუკაზეც
          შეგიძლიათ დააზუსტოთ (დააჭირეთ ან გადაათრიეთ ნიშნული).
        </p>

        <div className="tpl-form">
          <label className="tpl-field tpl-field--wide">
            <span>Google Maps ბმული ან კოორდინატები</span>
            <span className="tpl-link-row">
              <input
                type="text"
                className="tpl-input"
                placeholder="https://maps.app.goo.gl/…  ან  41.6485, 41.6339"
                value={form.link}
                onChange={(e) => set({ link: e.target.value })}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  setTimeout(() => readLink(text), 0);
                }}
              />
              <button type="button" className="tp-btn-outline" onClick={() => readLink(form.link)} disabled={reading || !form.link.trim()}>
                {reading ? "იკითხება..." : "წაკითხვა"}
              </button>
            </span>
          </label>

          <label className="tpl-field">
            <span>სახელი (ქართულად) *</span>
            <input type="text" className="tpl-input" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="მაგ: პულმან ბათუმი" />
          </label>
          <label className="tpl-field">
            <span>სახელი ლათინურად</span>
            <input type="text" className="tpl-input" value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} placeholder="Pullman Batumi" />
          </label>
          <label className="tpl-field">
            <span>სხვა დაწერილობები (მძიმით)</span>
            <input type="text" className="tpl-input" value={form.aliases} onChange={(e) => set({ aliases: e.target.value })} placeholder="Pullman, პულმანი, Пульман" />
          </label>
          <label className="tpl-field">
            <span>ტიპი</span>
            <select className="tpl-input" value={form.type} onChange={(e) => set({ type: e.target.value })}>
              {CUSTOM_PLACE_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="tpl-map">
          <TransferMap
            from={point}
            to={null}
            path={null}
            clickMovesFrom
            onPick={(_, lat, lng) => set({ lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 })}
          />
        </div>
        <p className="admin-hint tpl-coords">
          {point ? (
            <>
              წერტილი: {point.lat}, {point.lng} ·{" "}
              <a href={mapsUrl(point)} target="_blank" rel="noopener noreferrer">შემოწმება Google Maps-ზე ↗</a>
            </>
          ) : (
            "წერტილი ჯერ არ არის მითითებული — ჩასვით ბმული ან დააჭირეთ რუკაზე."
          )}
        </p>

        <div className="admin-form-actions tp-actions">
          <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "ინახება..." : form.id ? "ცვლილების შენახვა" : "დამატება"}
          </button>
          {(form.id || form.link || form.name || point) && (
            <button type="button" className="admin-btn-ghost" onClick={() => setForm(EMPTY_FORM)} disabled={saving}>
              გასუფთავება
            </button>
          )}
        </div>
      </div>

      <div className="tp-card">
        <div className="tpl-list-head">
          <h3 className="tp-subtitle">დამატებული ლოკაციები ({places.length})</h3>
          {places.length > 5 && (
            <input type="search" className="tpl-input tpl-filter" placeholder="ძებნა..." value={filter} onChange={(e) => setFilter(e.target.value)} />
          )}
        </div>
        {places.length === 0 ? (
          <p className="admin-hint">ჯერ არცერთი. დაამატეთ ზემოთ.</p>
        ) : (
          <ul className="tpl-list">
            {shown.map((p) => (
              <li key={p.id} className="tpl-item">
                <span className="tpl-item-icon" aria-hidden="true">{TYPE_LABELS[p.type]?.split(" ")[0] || "📍"}</span>
                <span className="tpl-item-text">
                  <strong>{p.name}</strong>
                  <small>
                    {[p.nameEn, p.aliases].filter(Boolean).join(" · ")}
                    {(p.nameEn || p.aliases) && " · "}
                    <a href={mapsUrl(p)} target="_blank" rel="noopener noreferrer">{p.lat}, {p.lng}</a>
                  </small>
                </span>
                <button type="button" className="tp-btn-outline" onClick={() => setForm({ ...EMPTY_FORM, ...p, link: "" })}>
                  რედაქტირება
                </button>
                <button type="button" className="tp-remove" onClick={() => handleDelete(p)} title="წაშლა" aria-label={`წაშლა: ${p.name}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
