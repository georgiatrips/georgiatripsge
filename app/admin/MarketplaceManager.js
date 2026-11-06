"use client";

import React, { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { VEHICLES, VEHICLE_KEYS, getPrivateVehiclePrices } from "../lib/vehicles";
import { asLocalizedText, listFirestoreTours } from "../lib/toursFirestore";
import {
  LAUNCH_STATUSES,
  PLATFORMS,
  PLATFORM_KEYS,
  SECTIONS,
  VEHICLE_EN,
  WEEKDAYS,
  daysUntil,
  fieldFilled,
  hasPrices,
  platformProgress,
} from "./marketplaceFields";

// "ტურები სხვა საიტზე": one card per tour we put on GetYourGuide and
// Tripster. The editor shows every field both sites ask for; each field
// carries the logo of the site(s) that need it.

const API = "/api/admin/marketplace";
const RATE_KEY = "gt-mkt-eur-rate";

const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}${Math.random()}`)
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 24);

function emptyLaunch() {
  return { status: "todo", planned: "", launched: "", url: "", productId: "", note: "" };
}

function emptyVehicles() {
  return Object.fromEntries(
    VEHICLE_KEYS.map((key) => [
      key,
      { on: false, pax: String(VEHICLES[key].capacityPax), price: "", prices: { gyg: "", tripster: "" }, gygTitle: "", ref: "" },
    ])
  );
}

export function emptyListing() {
  return {
    id: newId(),
    name: "",
    format: "private",
    siteTourId: "",
    gygCurrency: "EUR",
    notes: "",
    fields: {
      city: "Batumi",
      gygWriteLang: "English",
      gygEmergency: "+995 504220020",
      gygPets: "This activity doesn't allow pets",
      gygAutoAccept: true,
      gygGuide: "Live guide or other staff member",
      gygGuideRole: "Driver",
      gygFood: "No",
      gygTransportUsed: "Yes",
      gygCategories: ["Adult"],
      languages: ["Русский", "English"],
      kidsAllowed: true,
      kidsFrom: "0",
      cutoffHours: "12",
      trScheduleType: "Еженедельное",
      trAhead: "6",
      trTransport: "На машине",
      trType: "Экскурсия",
      meetingMode: "სასტუმროდან აყვანა",
      photosOwn: false,
    },
    vehicles: emptyVehicles(),
    group: { min: "1", max: "19", vehicle: "sprinter", price: "", prices: { gyg: "", tripster: "" } },
    launch: { gyg: emptyLaunch(), tripster: emptyLaunch() },
  };
}

// Older or partial records get every key the editor expects.
function normalize(listing) {
  const base = emptyListing();
  const vehicles = { ...base.vehicles };
  for (const key of VEHICLE_KEYS) {
    const v = listing.vehicles?.[key] || {};
    vehicles[key] = { ...base.vehicles[key], ...v, prices: { ...base.vehicles[key].prices, ...(v.prices || {}) } };
  }
  return {
    ...base,
    ...listing,
    fields: { ...base.fields, ...(listing.fields || {}) },
    vehicles,
    group: { ...base.group, ...(listing.group || {}), prices: { ...base.group.prices, ...(listing.group?.prices || {}) } },
    launch: {
      gyg: { ...emptyLaunch(), ...(listing.launch?.gyg || {}) },
      tripster: { ...emptyLaunch(), ...(listing.launch?.tripster || {}) },
    },
  };
}

// ── Small pieces ─────────────────────────────────────────────────────

function PlatformLogo({ platform, withName = true, size = 18 }) {
  const p = PLATFORMS[platform];
  return (
    <span className={`mkt-logo is-${platform}`} title={p.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.logo} alt="" width={size} height={size} />
      {withName && <span>{p.short}</span>}
    </span>
  );
}

function FieldLogos({ platforms }) {
  return (
    <span className="mkt-field-logos">
      {platforms.map((p) => (
        <PlatformLogo key={p} platform={p} />
      ))}
      {platforms.length === 2 && <span className="mkt-both">ორივე</span>}
    </span>
  );
}

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      className="mkt-copy"
      onClick={() => {
        navigator.clipboard?.writeText(String(text)).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
    >
      {done ? "დაკოპირდა ✓" : "კოპირება"}
    </button>
  );
}

function Counter({ value, max, min }) {
  if (!max && !min) return null;
  const n = String(value || "").length;
  const bad = (max && n > max) || (min && n < min);
  return (
    <span className={`mkt-counter${bad ? " is-over" : ""}`}>
      {n}{max ? ` / ${max}` : ""}{min ? ` (მინ. ${min})` : ""}
    </span>
  );
}

function statusMeta(key) {
  return LAUNCH_STATUSES.find((s) => s.key === key) || LAUNCH_STATUSES[0];
}

/** "5 დღე დარჩა", "დღეს!", "3 დღით გადაცილებული", "გაშვებულია ✓". */
export function launchText(launch) {
  const s = launch?.status || "todo";
  if (s === "skip") return { text: "არ ვტვირთავთ", tone: "idle" };
  if (s === "live") return { text: `გაშვებულია ✓${launch.launched ? ` · ${launch.launched}` : ""}`, tone: "live" };
  if (s === "rejected") return { text: "უარყოფილია — გასასწორებელია", tone: "bad" };
  if (s === "review") {
    const since = launch.launched ? -daysUntil(launch.launched) : null;
    return { text: `მოდერაციაზე${since != null && since >= 0 ? ` · ${since} დღეა` : ""}`, tone: "wait" };
  }
  const d = daysUntil(launch?.planned);
  if (d == null) return { text: "ატვირთვის თარიღი არ არის", tone: "idle" };
  if (d > 0) return { text: `${d} დღე დარჩა ატვირთვამდე`, tone: d <= 3 ? "soon" : "work" };
  if (d === 0) return { text: "დღეს უნდა აიტვირთოს!", tone: "soon" };
  return { text: `${-d} დღით გადაცილებული`, tone: "bad" };
}

function LaunchChip({ platform, launch }) {
  const { text, tone } = launchText(launch);
  return (
    <span className={`mkt-chip is-${tone}`}>
      <PlatformLogo platform={platform} withName={false} size={14} />
      {text}
    </span>
  );
}

function Progress({ listing, platform }) {
  const { done, total, pct } = platformProgress(listing, platform);
  return (
    <div className="mkt-progress" title={`${PLATFORMS[platform].name}: ${done}/${total} სავალდებულო ველი`}>
      <PlatformLogo platform={platform} withName={false} size={14} />
      <div className="mkt-bar">
        <span style={{ width: `${pct}%`, background: PLATFORMS[platform].color }} />
      </div>
      <b>{pct}%</b>
    </div>
  );
}

// ── Field input ──────────────────────────────────────────────────────

function SingleInput({ field, value, onChange, max, placeholder }) {
  const common = {
    value: value ?? "",
    placeholder: placeholder || field.placeholder || "",
    onChange: (e) => onChange(e.target.value),
  };
  if (field.kind === "textarea" || field.kind === "list") {
    return <textarea rows={field.rows || (field.kind === "list" ? 4 : 3)} {...common} />;
  }
  if (field.kind === "number") return <input type="number" min="0" {...common} />;
  if (field.kind === "date") return <input type="date" {...common} />;
  return <input type="text" {...common} />;
}

function FieldInput({ field, value, onChange, visible }) {
  if (field.kind === "info") return <p className="mkt-info">{field.text}</p>;

  if (field.kind === "check") {
    return (
      <label className="admin-check">
        <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.kind === "select") {
    return (
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">— აირჩიე —</option>
        {field.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    );
  }

  if (field.kind === "chips") {
    const list = Array.isArray(value) ? value : [];
    return (
      <div className="mkt-chips">
        {field.options.map((o) => {
          const on = list.includes(o);
          return (
            <button
              key={o}
              type="button"
              className={`mkt-chip-btn${on ? " is-on" : ""}`}
              onClick={() => onChange(on ? list.filter((x) => x !== o) : [...list, o])}
            >
              {on ? "✓ " : ""}{o}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.kind === "weekdays") {
    const v = value && typeof value === "object" ? value : {};
    return (
      <div className="mkt-weekdays">
        {WEEKDAYS.map((day, i) => {
          const on = v[i] != null && v[i] !== false;
          return (
            <div key={day} className={`mkt-day${on ? " is-on" : ""}`}>
              <button type="button" onClick={() => onChange({ ...v, [i]: on ? false : "09:00" })}>{day}</button>
              {on && <input type="time" value={v[i] || ""} onChange={(e) => onChange({ ...v, [i]: e.target.value })} />}
            </div>
          );
        })}
      </div>
    );
  }

  if (field.split) {
    const v = value && typeof value === "object" ? value : {};
    return (
      <div className="mkt-split">
        {field.p.filter((p) => visible.includes(p)).map((p) => (
          <div key={p} className="mkt-split-item">
            <div className="mkt-split-head">
              <PlatformLogo platform={p} />
              <small>{PLATFORMS[p].lang}</small>
              <Counter value={v[p]} max={field.max?.[p]} />
              <CopyButton text={v[p]} />
            </div>
            <SingleInput field={field} value={v[p]} onChange={(text) => onChange({ ...v, [p]: text })} />
          </div>
        ))}
      </div>
    );
  }

  const count = field.kind === "list" ? String(value || "").split("\n").filter((l) => l.trim()).length : null;
  return (
    <>
      <SingleInput field={field} value={value} onChange={onChange} />
      <div className="mkt-under">
        {count != null && (
          <span className={`mkt-counter${(field.min && count < field.min) || (field.max && count > field.max) ? " is-over" : ""}`}>
            {count} პუნქტი{field.min || field.max ? ` (${field.min || 0}–${field.max || "∞"})` : ""}
          </span>
        )}
        {field.kind !== "list" && <Counter value={value} max={typeof field.max === "number" ? field.max : null} min={field.minChars} />}
        {["text", "textarea", "list"].includes(field.kind) && <CopyButton text={value} />}
      </div>
    </>
  );
}

// ── Prices ───────────────────────────────────────────────────────────

function PriceInput({ platform, value, onChange, unit }) {
  return (
    <label className="mkt-price-in">
      <PlatformLogo platform={platform} withName={false} size={14} />
      <input type="number" min="0" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      <span>{unit}</span>
    </label>
  );
}

function PricingBlock({ listing, update, visible, rate }) {
  const gygUnit = listing.gygCurrency === "GEL" ? "₾" : listing.gygCurrency === "USD" ? "$" : "€";
  const euro = (gel) => (Number(gel) > 0 && rate > 0 ? `≈ ${(Number(gel) / rate).toFixed(0)} €` : "");

  if (listing.format === "group") {
    const g = listing.group;
    const set = (patch) => update({ group: { ...g, ...patch } });
    return (
      <div className="mkt-vehicles">
        <div className="mkt-vehicle is-on">
          <div className="mkt-vehicle-head">
            <b>ჯგუფური ტური — ფასი ერთ ადამიანზე</b>
          </div>
          <div className="mkt-vehicle-grid">
            <label>მანქანა
              <select value={g.vehicle} onChange={(e) => set({ vehicle: e.target.value })}>
                {VEHICLE_KEYS.map((k) => <option key={k} value={k}>{VEHICLES[k].nameKa}</option>)}
              </select>
            </label>
            <label>მინ. ადამიანი<input type="number" min="1" value={g.min} onChange={(e) => set({ min: e.target.value })} /></label>
            <label>მაქს. ადამიანი<input type="number" min="1" value={g.max} onChange={(e) => set({ max: e.target.value })} /></label>
            <label>ჩვენი ფასი (საიტზე)
              <span className="mkt-price-in"><input type="number" min="0" value={g.price} onChange={(e) => set({ price: e.target.value })} /><span>₾</span></span>
              <small>{euro(g.price)}</small>
            </label>
          </div>
          <div className="mkt-vehicle-prices">
            {visible.includes("gyg") && <PriceInput platform="gyg" unit={`${gygUnit} / ადამ.`} value={g.prices.gyg} onChange={(v) => set({ prices: { ...g.prices, gyg: v } })} />}
            {visible.includes("tripster") && <PriceInput platform="tripster" unit="€ / ადამ." value={g.prices.tripster} onChange={(v) => set({ prices: { ...g.prices, tripster: v } })} />}
          </div>
          <p className="mkt-info">Tripster: ჯგუფური ტური უნდა ჩატარდეს 1 ადამიანითაც. GYG: Option → „Is this a private activity?“ = No, Maximum group size = {g.max || "?"}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mkt-vehicles">
      {VEHICLE_KEYS.map((key) => {
        const v = listing.vehicles[key];
        const veh = VEHICLES[key];
        const set = (patch) => update({ vehicles: { ...listing.vehicles, [key]: { ...v, ...patch } } });
        const autoTitle = `Private Tour by ${VEHICLE_EN[key]} (up to ${v.pax || veh.capacityPax} people)`;
        return (
          <div key={key} className={`mkt-vehicle${v.on ? " is-on" : ""}`}>
            <div className="mkt-vehicle-head">
              <label className="admin-check">
                <input type="checkbox" checked={v.on} onChange={(e) => set({ on: e.target.checked })} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={veh.img} alt="" width={46} height={28} />
                <b>{veh.nameKa}</b>
              </label>
              {!v.on && <small>არ გვაქვს ამ ტურში</small>}
            </div>
            {v.on && (
              <>
                <div className="mkt-vehicle-grid">
                  <label>მაქს. ადამიანი
                    <input type="number" min="1" value={v.pax} onChange={(e) => set({ pax: e.target.value })} />
                  </label>
                  <label>ჩვენი ფასი (საიტზე)
                    <span className="mkt-price-in"><input type="number" min="0" value={v.price} onChange={(e) => set({ price: e.target.value })} /><span>₾</span></span>
                    <small>{euro(v.price)}</small>
                  </label>
                </div>
                <div className="mkt-vehicle-prices">
                  {visible.includes("gyg") && <PriceInput platform="gyg" unit={`${gygUnit} / მანქანა`} value={v.prices.gyg} onChange={(val) => set({ prices: { ...v.prices, gyg: val } })} />}
                  {visible.includes("tripster") && <PriceInput platform="tripster" unit="€ / ექსკურსია" value={v.prices.tripster} onChange={(val) => set({ prices: { ...v.prices, tripster: val } })} />}
                </div>
                {visible.includes("gyg") && (
                  <div className="mkt-vehicle-grid">
                    <label className="mkt-wide">
                      <span className="mkt-lbl"><PlatformLogo platform="gyg" withName={false} size={14} /> Option title</span>
                      <input type="text" maxLength={75} placeholder={autoTitle} value={v.gygTitle} onChange={(e) => set({ gygTitle: e.target.value })} />
                      <span className="mkt-under"><CopyButton text={v.gygTitle || autoTitle} /></span>
                    </label>
                    <label>
                      <span className="mkt-lbl"><PlatformLogo platform="gyg" withName={false} size={14} /> Reference code</span>
                      <input type="text" maxLength={20} value={v.ref} onChange={(e) => set({ ref: e.target.value })} />
                    </label>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
      <p className="mkt-info">
        GYG: თითო მანქანა = ცალკე „Option“ (Private = Yes, Maximum group size = მაქს. ადამიანი, ფასი ჯგუფზე).
        Tripster: ინდივიდუალურ შეთავაზებას ერთი ფასი აქვს — სხვა მანქანა = ცალკე შეთავაზება ან ტარიფი.
      </p>
    </div>
  );
}

// ── Launch block ─────────────────────────────────────────────────────

function LaunchBlock({ listing, update, visible }) {
  return (
    <div className="mkt-launch">
      {PLATFORM_KEYS.filter((p) => visible.includes(p)).map((p) => {
        const l = listing.launch[p];
        const set = (patch) => update({ launch: { ...listing.launch, [p]: { ...l, ...patch } } });
        return (
          <div key={p} className="mkt-launch-card" style={{ borderTopColor: PLATFORMS[p].color }}>
            <div className="mkt-launch-head">
              <PlatformLogo platform={p} />
              <LaunchChip platform={p} launch={l} />
            </div>
            <div className="mkt-vehicle-grid">
              <label>სტატუსი
                <select value={l.status} onChange={(e) => set({ status: e.target.value })}>
                  {LAUNCH_STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <label>როდის ავტვირთავთ
                <input type="date" value={l.planned} onChange={(e) => set({ planned: e.target.value })} />
              </label>
              <label>გაგზავნის / გაშვების თარიღი
                <input type="date" value={l.launched} onChange={(e) => set({ launched: e.target.value })} />
              </label>
              <label>Product / offer ID
                <input type="text" value={l.productId} onChange={(e) => set({ productId: e.target.value })} />
              </label>
              <label className="mkt-wide">ბმული
                <input type="url" placeholder={PLATFORMS[p].editorUrl} value={l.url} onChange={(e) => set({ url: e.target.value })} />
              </label>
              <label className="mkt-wide">შენიშვნა
                <input type="text" value={l.note} onChange={(e) => set({ note: e.target.value })} />
              </label>
            </div>
            <Progress listing={listing} platform={p} />
          </div>
        );
      })}
    </div>
  );
}

// ── Editor ───────────────────────────────────────────────────────────

function Editor({ initial, siteTours, rate, onSaved, onCancel, onDelete }) {
  const [listing, setListing] = useState(() => normalize(initial));
  const [show, setShow] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const visible = show === "all" ? PLATFORM_KEYS : [show];

  const update = (patch) => setListing((prev) => ({ ...prev, ...patch }));
  const setField = (key, value) => setListing((prev) => ({ ...prev, fields: { ...prev.fields, [key]: value } }));

  const importTour = (tourId) => {
    const tour = siteTours.find((t) => t.id === tourId);
    update({ siteTourId: tourId });
    if (!tour) return;
    const f = { ...listing.fields };
    const en = (v) => asLocalizedText(v, "en") || "";
    const ru = (v) => asLocalizedText(v, "ru") || "";
    if (!f.title?.gyg && !f.title?.tripster) f.title = { gyg: en(tour.title), tripster: ru(tour.title) };
    if (!f.gygFull) f.gygFull = en(tour.desc);
    if (!f.trIdea) f.trIdea = ru(tour.desc);
    if (!f.gygIncl && tour.includedText) f.gygIncl = en(tour.includedText);
    if (!f.gygExcl && tour.excludedText) f.gygExcl = en(tour.excludedText);
    if (!f.meetExact && tour.meetingPoint) f.meetExact = en(tour.meetingPoint);
    const hours = parseFloat(String(en(tour.duration) || asLocalizedText(tour.duration, "ka") || "").replace(",", "."));
    if (!f.durationHours && hours > 0 && hours < 24 && !/day|დღ/i.test(en(tour.duration))) f.durationHours = String(hours);
    if (!f.route && Array.isArray(tour.itinerary)) {
      const stops = tour.itinerary.map((s) => asLocalizedText(s.title, "en")).filter(Boolean);
      const stopsRu = tour.itinerary.map((s) => asLocalizedText(s.title, "ru")).filter(Boolean);
      f.route = { gyg: stops.join("\n"), tripster: stopsRu.join("\n") };
      if (!f.gygLocations) f.gygLocations = stops.join("\n");
    }
    if (!f.photos && Array.isArray(tour.gallery)) f.photos = tour.gallery.map((g) => g?.url || g).filter(Boolean).join("\n");
    if (tour.startTime && !f.weekdays) f.weekdays = {};

    const vp = getPrivateVehiclePrices(tour);
    const vehicles = { ...listing.vehicles };
    for (const key of Object.keys(vp)) vehicles[key] = { ...vehicles[key], on: true, price: vehicles[key].price || String(vp[key]) };
    const group = { ...listing.group };
    if (tour.priceGroup) group.price = group.price || String(tour.priceGroup);
    if (tour.groupMax) group.max = String(tour.groupMax);
    if (tour.groupMin) group.min = String(tour.groupMin);
    const format = tour.privateVehiclePrices || tour.pricePrivate ? listing.format : tour.priceGroup ? "group" : listing.format;
    setListing((prev) => ({
      ...prev,
      siteTourId: tourId,
      name: prev.name || asLocalizedText(tour.title, "ka"),
      fields: f,
      vehicles,
      group,
      format,
    }));
  };

  const save = async () => {
    if (!listing.name.trim()) {
      setMsg({ type: "error", text: "ჩაწერე შიდა სახელი." });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", listing }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg({ type: "success", text: "შენახულია." });
      onSaved({ ...listing, updatedAt: data.updatedAt });
    } catch (err) {
      setMsg({ type: "error", text: `ვერ შეინახა: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mkt-editor">
      <div className="mkt-toolbar">
        <button type="button" className="admin-btn-ghost" onClick={onCancel}>← სიაში დაბრუნება</button>
        <div className="admin-segment" role="tablist" aria-label="რომელი საიტის ველები ჩანდეს">
          <button type="button" className={show === "all" ? "is-active" : ""} onClick={() => setShow("all")}>ყველა ველი</button>
          {PLATFORM_KEYS.map((p) => (
            <button key={p} type="button" className={show === p ? "is-active" : ""} onClick={() => setShow(p)}>
              მხოლოდ {PLATFORMS[p].short}
            </button>
          ))}
        </div>
        <label className="admin-check">
          <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
          <span>მხოლოდ შეუვსებელი</span>
        </label>
      </div>

      <div className="mkt-progress-row">
        {visible.map((p) => <Progress key={p} listing={listing} platform={p} />)}
      </div>

      <fieldset className="admin-fieldset mkt-section">
        <legend>ტური</legend>
        <div className="admin-grid-2">
          <div className="admin-field">
            <label>შიდა სახელი (მხოლოდ ჩვენთვის)</label>
            <input type="text" value={listing.name} onChange={(e) => update({ name: e.target.value })} placeholder="მაგ: მთიანი აჭარა — Sprinter" />
          </div>
          <div className="admin-field">
            <label>საიტის ტურიდან შევსება</label>
            <select value={listing.siteTourId} onChange={(e) => importTour(e.target.value)}>
              <option value="">— არ არის დაკავშირებული —</option>
              {siteTours.map((t) => (
                <option key={t.id} value={t.id}>{asLocalizedText(t.title, "ka") || t.id}</option>
              ))}
            </select>
            <p className="admin-hint">ავსებს მხოლოდ ცარიელ ველებს (სათაური, აღწერა, მარშრუტი, ფოტოები, ფასები).</p>
          </div>
        </div>
        <div className="admin-field">
          <label>
            <FieldLogos platforms={PLATFORM_KEYS} /> ფორმატი <small className="mkt-orig">Формат / Is this a private activity?</small>
          </label>
          <div className="admin-segment">
            <button type="button" className={listing.format === "private" ? "is-active" : ""} onClick={() => update({ format: "private" })}>ინდივიდუალური (მანქანით)</button>
            <button type="button" className={listing.format === "group" ? "is-active" : ""} onClick={() => update({ format: "group" })}>ჯგუფური</button>
          </div>
        </div>
      </fieldset>

      <fieldset className="admin-fieldset mkt-section">
        <legend>ატვირთვა და გაშვება</legend>
        <LaunchBlock listing={listing} update={update} visible={visible} />
      </fieldset>

      <fieldset className="admin-fieldset mkt-section">
        <legend>{listing.format === "group" ? "ფასი (ჯგუფური)" : "ფასი მანქანების მიხედვით"}</legend>
        <div className="mkt-field-head">
          <FieldLogos platforms={PLATFORM_KEYS} />
          {visible.includes("gyg") && (
            <label className="mkt-inline">
              <PlatformLogo platform="gyg" withName={false} size={14} /> ვალუტა
              <select value={listing.gygCurrency} onChange={(e) => update({ gygCurrency: e.target.value })}>
                <option>EUR</option><option>USD</option><option>GEL</option>
              </select>
            </label>
          )}
          {visible.includes("tripster") && <small>Tripster: ფასი €-ში, საკომისიო ~25% მოგზაური იხდის ონლაინ.</small>}
        </div>
        <PricingBlock listing={listing} update={update} visible={visible} rate={rate} />
      </fieldset>

      {SECTIONS.map((section) => {
        const fields = section.fields.filter(
          (f) =>
            f.p.some((p) => visible.includes(p)) &&
            (!onlyMissing || (f.kind !== "info" && f.p.filter((p) => visible.includes(p)).some((p) => !fieldFilled(f, listing.fields[f.key], p))))
        );
        if (!fields.length) return null;
        return (
          <fieldset key={section.key} className="admin-fieldset mkt-section">
            <legend>{section.title}</legend>
            {fields.map((f) => {
              const missing = f.req && f.p.filter((p) => visible.includes(p)).some((p) => !fieldFilled(f, listing.fields[f.key], p));
              return (
                <div key={f.key} className={`admin-field mkt-field${missing ? " is-missing" : ""}`}>
                  <div className="mkt-field-head">
                    <FieldLogos platforms={f.p} />
                    {f.req && <span className="mkt-req">სავალდებულო</span>}
                  </div>
                  {f.kind !== "check" && (
                    <label>
                      {f.label} {f.orig && <small className="mkt-orig">{f.orig}</small>}
                    </label>
                  )}
                  <FieldInput field={f} value={listing.fields[f.key]} onChange={(v) => setField(f.key, v)} visible={visible} />
                  {f.kind === "check" && f.orig && <small className="mkt-orig">{f.orig}</small>}
                  {f.hint && <p className="admin-hint">{f.hint}</p>}
                </div>
              );
            })}
          </fieldset>
        );
      })}

      <fieldset className="admin-fieldset mkt-section">
        <legend>შენიშვნები</legend>
        <div className="admin-field">
          <textarea rows={3} value={listing.notes} onChange={(e) => update({ notes: e.target.value })} />
        </div>
      </fieldset>

      {msg && <div className={`admin-alert ${msg.type}`}>{msg.text}</div>}
      <div className="admin-form-actions mkt-sticky">
        <button type="button" className="admin-btn-primary" disabled={saving} onClick={save}>
          {saving ? "ინახება…" : "შენახვა"}
        </button>
        <button type="button" className="admin-btn-ghost" onClick={onCancel}>გაუქმება</button>
        {initial.createdAt && (
          <button type="button" className="admin-action-btn delete" onClick={() => onDelete(listing.id)}>წაშლა</button>
        )}
      </div>
    </div>
  );
}

// ── List + dashboard ─────────────────────────────────────────────────

function Dashboard({ listings }) {
  const rows = [];
  for (const l of listings) {
    for (const p of PLATFORM_KEYS) {
      const launch = l.launch?.[p];
      if (!launch || ["live", "skip"].includes(launch.status)) continue;
      rows.push({ l, p, launch, d: daysUntil(launch.planned) });
    }
  }
  const upcoming = rows
    .filter((r) => r.d != null && !["review", "rejected"].includes(r.launch.status))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6);

  const stat = (p, fn) => listings.filter((l) => fn(l.launch?.[p] || {})).length;
  return (
    <div className="mkt-dash">
      {PLATFORM_KEYS.map((p) => (
        <div key={p} className="mkt-dash-card" style={{ borderTopColor: PLATFORMS[p].color }}>
          <PlatformLogo platform={p} />
          <dl>
            <div><dt>გაშვებული</dt><dd className="is-live">{stat(p, (x) => x.status === "live")}</dd></div>
            <div><dt>მოდერაციაზე</dt><dd className="is-wait">{stat(p, (x) => x.status === "review")}</dd></div>
            <div><dt>მზადდება</dt><dd>{stat(p, (x) => ["todo", "draft", "ready"].includes(x.status || "todo"))}</dd></div>
            <div><dt>გადაცილებული</dt><dd className="is-bad">{stat(p, (x) => !["live", "review", "skip", "rejected"].includes(x.status) && daysUntil(x.planned) < 0)}</dd></div>
          </dl>
          <a href={PLATFORMS[p].editorUrl} target="_blank" rel="noreferrer" className="mkt-ext">კაბინეტი ↗</a>
        </div>
      ))}
      <div className="mkt-dash-card mkt-dash-next">
        <b>უახლოესი ატვირთვები</b>
        {upcoming.length === 0 ? (
          <p className="admin-hint">დაგეგმილი თარიღი არცერთს არ აქვს.</p>
        ) : (
          <ul>
            {upcoming.map(({ l, p, launch }) => (
              <li key={`${l.id}-${p}`}>
                <span>{l.name}</span>
                <LaunchChip platform={p} launch={launch} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function MarketplaceManager() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [formatFilter, setFormatFilter] = useState("all");
  const [siteTours, setSiteTours] = useState([]);
  const [rate, setRate] = useState(3);

  useEffect(() => {
    try {
      const r = Number(localStorage.getItem(RATE_KEY));
      if (r > 0) setRate(r);
    } catch {}
  }, []);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(API);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setListings((data.listings || []).map(normalize));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    listFirestoreTours()
      .then((items) => setSiteTours(items))
      .catch(() => {});
  }, []);

  const filtered = useMemo(
    () => listings.filter((l) => formatFilter === "all" || l.format === formatFilter),
    [listings, formatFilter]
  );
  const counts = {
    all: listings.length,
    private: listings.filter((l) => l.format === "private").length,
    group: listings.filter((l) => l.format === "group").length,
  };

  const remove = async (id) => {
    if (!window.confirm("წავშალო ეს ჩანაწერი? (GYG-ზე და Tripster-ზე არაფერი შეიცვლება)")) return;
    try {
      const res = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setListings((prev) => prev.filter((l) => l.id !== id));
      setEditing(null);
    } catch (err) {
      window.alert(`ვერ წაიშალა: ${err.message}`);
    }
  };

  if (editing) {
    return (
      <Editor
        key={editing.id}
        initial={editing}
        siteTours={siteTours}
        rate={rate}
        onCancel={() => setEditing(null)}
        onDelete={remove}
        onSaved={(saved) => {
          setListings((prev) => {
            const rest = prev.filter((l) => l.id !== saved.id);
            return [{ ...saved, createdAt: saved.createdAt || Date.now() }, ...rest];
          });
          setEditing((cur) => ({ ...saved, createdAt: cur?.createdAt || Date.now() }));
        }}
      />
    );
  }

  return (
    <div className="mkt">
      <Dashboard listings={listings} />

      <div className="mkt-toolbar">
        <div className="admin-segment">
          <button type="button" className={formatFilter === "all" ? "is-active" : ""} onClick={() => setFormatFilter("all")}>ყველა ({counts.all})</button>
          <button type="button" className={formatFilter === "private" ? "is-active" : ""} onClick={() => setFormatFilter("private")}>ინდივიდუალური ({counts.private})</button>
          <button type="button" className={formatFilter === "group" ? "is-active" : ""} onClick={() => setFormatFilter("group")}>ჯგუფური ({counts.group})</button>
        </div>
        <label className="mkt-inline">
          1 € =
          <input
            type="number"
            step="0.01"
            min="0"
            value={rate}
            onChange={(e) => {
              setRate(Number(e.target.value));
              try { localStorage.setItem(RATE_KEY, e.target.value); } catch {}
            }}
          />
          ₾
        </label>
        <button type="button" className="admin-btn-primary" onClick={() => setEditing(emptyListing())}>+ ახალი ტური</button>
      </div>

      <details className="mkt-howto">
        <summary>როგორ ავტვირთო GYG-ზე / Tripster-ზე გაფართოებით (GT Sync)</summary>
        <ol>
          <li>Chrome → <code>chrome://extensions</code> → <b>GT Sync</b> → ↻ (განახლება). გასაღები იგივეა, რაც GetTransfer-ისთვის.</li>
          <li>აქ შეავსე ტური და დააჭირე „შენახვა“.</li>
          <li>გახსენი <a href={PLATFORMS.gyg.editorUrl} target="_blank" rel="noreferrer">GYG</a> ან <a href={PLATFORMS.tripster.editorUrl} target="_blank" rel="noreferrer">Tripster</a>-ის ახალი ტურის ფორმა → ქვემოთ მარჯვნივ <b>GT</b> ღილაკი → აირჩიე ტური.</li>
          <li>ყოველ ეტაპზე: „ამ გვერდის შევსება“. რაც ვერ იპოვა — დააჭირე საიტის ველს და მერე „ჩასმა“. ფოტოები — „ფოტოების ატვირთვა“.</li>
          <li>შეამოწმე და Continue / Сохранить / გაგზავნა <b>თვითონ</b> დააჭირე. შემდეგ პანელში „გავგზავნე მოდერაციაზე“ — სტატუსი აქაც განახლდება.</li>
        </ol>
      </details>

      {error && <div className="admin-alert error">ვერ ჩაიტვირთა: {error}</div>}
      {loading ? (
        <p className="admin-hint">იტვირთება…</p>
      ) : filtered.length === 0 ? (
        <div className="mkt-empty">
          <p>ჯერ არცერთი ტური არ არის. დააჭირე „+ ახალი ტური“ — ფორმაში იქნება ყველა ველი, რასაც GetYourGuide და Tripster ითხოვს.</p>
        </div>
      ) : (
        <div className="mkt-list">
          {filtered.map((l) => {
            const vehicles = VEHICLE_KEYS.filter((k) => l.vehicles?.[k]?.on);
            return (
              <article key={l.id} className="mkt-card">
                <div className="mkt-card-top">
                  <span className={`admin-tag-pill${l.format === "group" ? " badge" : " price"}`}>
                    {l.format === "group" ? "ჯგუფური" : "ინდივიდუალური"}
                  </span>
                  <h3>{l.name || "უსახელო"}</h3>
                </div>
                <p className="mkt-card-meta">
                  {l.format === "group"
                    ? `${l.group.min}–${l.group.max} ადამ. · ${l.group.price || "?"} ₾ / ადამ.`
                    : vehicles.length
                      ? vehicles.map((k) => `${VEHICLES[k].nameKa} ${l.vehicles[k].pax} ადამ. · ${l.vehicles[k].price || "?"} ₾`).join("  |  ")
                      : "მანქანა არ არის არჩეული"}
                </p>
                <div className="mkt-card-launch">
                  {PLATFORM_KEYS.map((p) => (
                    <div key={p} className="mkt-card-plat">
                      <LaunchChip platform={p} launch={l.launch[p]} />
                      {l.launch[p].status !== "skip" && <Progress listing={l} platform={p} />}
                      {!hasPrices(l, p) && l.launch[p].status !== "skip" && <small className="mkt-warn">ფასი არ არის</small>}
                    </div>
                  ))}
                </div>
                <div className="admin-entry-actions">
                  <button type="button" className="admin-action-btn edit" onClick={() => setEditing(l)}>რედაქტირება</button>
                  {PLATFORM_KEYS.map((p) =>
                    l.launch[p].url ? (
                      <a key={p} className="admin-action-btn link" href={l.launch[p].url} target="_blank" rel="noreferrer">
                        {PLATFORMS[p].short} ↗
                      </a>
                    ) : null
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
