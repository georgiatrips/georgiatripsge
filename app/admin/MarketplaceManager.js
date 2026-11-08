"use client";

import React, { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { VEHICLES, VEHICLE_KEYS, getPrivateVehiclePrices } from "../lib/vehicles";
import { asLocalizedText, listFirestoreTours } from "../lib/toursFirestore";
import { uploadImage } from "../lib/imageUpload";
import {
  LAUNCH_STATUSES,
  PLATFORMS,
  PLATFORM_KEYS,
  SECTIONS,
  VEHICLE_EN,
  WEEKDAYS,
  ALL_FIELDS,
  OPTION_KA,
  daysUntil,
  fieldFilled,
  hasPrices,
  optionLabel,
  platformProgress,
  writeLang,
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
      gygFirstAid: "No",
      gygOutsideCity: "Yes",
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
  const fields = { ...base.fields, ...(listing.fields || {}) };
  // "meetExact" used to be one text for both sites; now GYG (EN) and Tripster (RU) apart.
  if (typeof fields.meetExact === "string") fields.meetExact = { gyg: fields.meetExact, tripster: "" };
  return {
    ...base,
    ...listing,
    fields,
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

function LangBadge({ lang }) {
  if (!lang) return null;
  return (
    <span className={`mkt-lang is-${lang.code.toLowerCase()}`} title="ამ ენაზე ჩაწერე">
      ✍ {lang.text}
    </span>
  );
}

// Photos from the computer → our Cloudinary → links in the field, ready to
// download or open when uploading to GYG / Tripster.
function PhotoUpload({ value, onChange }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const pick = async (e) => {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setError("");
    const urls = [];
    for (const [i, file] of files.entries()) {
      setBusy(`${i + 1}/${files.length}`);
      try {
        urls.push(await uploadImage(file));
      } catch (err) {
        setError(err.message);
      }
    }
    setBusy("");
    if (urls.length) onChange([String(value || "").trim(), ...urls].filter(Boolean).join("\n"));
  };
  return (
    <span className="mkt-photo-up">
      <label className="admin-btn-ghost">
        {busy ? `იტვირთება ${busy}…` : "📷 ფოტოების ატვირთვა კომპიუტერიდან"}
        <input type="file" accept="image/*" multiple hidden disabled={!!busy} onChange={pick} />
      </label>
      {error && <small className="mkt-warn">{error}</small>}
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

function FieldInput({ field, value, onChange, visible, listing }) {
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
          <option key={o} value={o}>{optionLabel(o, field)}</option>
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
              title={o}
              className={`mkt-chip-btn${on ? " is-on" : ""}`}
              onClick={() => onChange(on ? list.filter((x) => x !== o) : [...list, o])}
            >
              {on ? "✓ " : ""}{OPTION_KA[o] || o}
              {OPTION_KA[o] && OPTION_KA[o] !== o && <small className="mkt-chip-orig">{o}</small>}
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
              <LangBadge lang={writeLang(field, p, listing)} />
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
        {field.key === "photos" && <PhotoUpload value={value} onChange={onChange} />}
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
                      <span className="mkt-lbl"><PlatformLogo platform="gyg" withName={false} size={14} /> ვარიანტის სათაური <small className="mkt-orig">საიტზე: Option title</small> <LangBadge lang={{ code: "EN", text: "ინგლისურად" }} /></span>
                      <input type="text" maxLength={75} placeholder={autoTitle} value={v.gygTitle} onChange={(e) => set({ gygTitle: e.target.value })} />
                      <span className="mkt-under"><CopyButton text={v.gygTitle || autoTitle} /></span>
                    </label>
                    <label>
                      <span className="mkt-lbl"><PlatformLogo platform="gyg" withName={false} size={14} /> შიდა კოდი <small className="mkt-orig">საიტზე: Reference code</small></span>
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

// ── AI ───────────────────────────────────────────────────────────────

const isBlank = (v) =>
  v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length) ||
  (typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => (typeof x === "string" ? x.trim() : x)));

// What the site tour looks like to the AI: texts only, no photos.
function tourForAi(tour) {
  if (!tour) return null;
  const { gallery, images, image, cover, reviews, ...rest } = tour;
  return rest;
}

// Tripster has no AI import: its texts go field by field, in the order of
// Tripster's own form ("Описание" step), each with a copy button.
const TRIPSTER_BLOCKS = [
  { key: "title", sub: "tripster", label: "Название", ka: "სათაური" },
  { key: "trIdea", label: "Идея", ka: "იდეა" },
  { key: "route", sub: "tripster", label: "Маршрут", ka: "მარშრუტი" },
  { key: "trThemes", label: "Темы — что узнают", ka: "თემები" },
  { key: "trOrg", label: "Организационные детали", ka: "ორგანიზაციული დეტალები" },
  { key: "trFacts", label: "Факты и детали", ka: "ფაქტები" },
  { key: "trAudience", label: "Целевая аудитория", ka: "ვისთვისაა" },
  { key: "trMeetApprox", label: "Примерное место встречи", ka: "მიახლოებითი ადგილი" },
  { key: "meetExact", sub: "tripster", label: "Точное место встречи", ka: "ზუსტი ადგილი" },
  { key: "trExtras", label: "Доп. услуги", ka: "დამატებითი სერვისები" },
];

function AiPanel({ listing, siteTours, onImport, onApply, onUndo, canUndo, setField }) {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [notes, setNotes] = useState([]);
  const [copied, setCopied] = useState("");
  const tour = siteTours.find((t) => t.id === listing.siteTourId);
  const f = listing.fields || {};
  const script = f.gygScript || "";
  const n = script.length;

  const call = async (body) => {
    const res = await adminFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, brief, tour: tourForAi(tour), listing }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  const run = async (kind) => {
    setBusy(kind);
    setMsg(null);
    setNotes([]);
    try {
      if (kind === "gyg") {
        const data = await call({ action: "gyg-script" });
        setField("gygScript", data.text);
        setNotes(data.notes || []);
        setMsg({ type: "success", text: `GetYourGuide-ის ტექსტი მზადაა (${data.text.length} სიმბოლო). შეამოწმე, დააკოპირე და ჩასვი GYG-ის „AI content creator“-ში. არ დაგავიწყდეს „შენახვა“.` });
      } else if (kind === "tripster") {
        const data = await call({ action: "ai", mode: "fix", only: "tripster" });
        const changed = onApply(data, "fix");
        setNotes(data.notes || []);
        setMsg({ type: "success", text: `Tripster-ის ტექსტები მზადაა (${changed} ველი, რუსულად). ქვემოთ თითოეულს კოპირების ღილაკი აქვს — Tripster-ის „Описание“ ეტაპზე იმავე თანმიმდევრობით ჩასვი.` });
      } else {
        const data = await call({ action: "ai", mode: kind });
        const changed = onApply(data, kind);
        setNotes(data.notes || []);
        setMsg({ type: changed ? "success" : "info", text: changed ? `AI-მ შეავსო / შეასწორა ${changed} ველი. გადახედე (მონიშნულია ✨) და დააჭირე „შენახვა“.` : "AI-მ ახალი არაფერი დაამატა." });
      }
    } catch (err) {
      setMsg({ type: "error", text: `AI ვერ მუშაობს: ${err.message}` });
    } finally {
      setBusy("");
    }
  };

  const copy = (id, text) => {
    navigator.clipboard?.writeText(String(text || "")).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(""), 1300);
    });
  };

  const blockValue = (b) => (b.sub ? f[b.key]?.[b.sub] : f[b.key]) || "";
  const trFilled = TRIPSTER_BLOCKS.filter((b) => String(blockValue(b)).trim()).length;

  return (
    <fieldset className="admin-fieldset mkt-section mkt-ai">
      <legend>✨ AI-ით შევსება</legend>
      <div className="admin-field">
        <label>ტექსტი / სკრიპტი ტურზე <small className="mkt-orig">ნებისმიერ ენაზე — ქართულად, რუსულად ან ინგლისურად</small></label>
        <textarea
          rows={7}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={"მაგ: ბათუმიდან მთიან აჭარაში, 8-9 საათი. მახუნცეთის ჩანჩქერი, თამარის ხიდი, ღვინის მარანი, ფერმა… ავიყვანთ სასტუმროდან, მძღოლი რუსულად და ინგლისურად ლაპარაკობს. ფასში შედის ბენზინი, არ შედის სადილი."}
        />
      </div>
      <div className="admin-field">
        <label>ან / და ტური საიტიდან</label>
        <select value={listing.siteTourId} onChange={(e) => onImport(e.target.value)}>
          <option value="">— არ არის არჩეული —</option>
          {siteTours.map((t) => (
            <option key={t.id} value={t.id}>{asLocalizedText(t.title, "ka") || t.id}</option>
          ))}
        </select>
      </div>

      <div className="mkt-ai-targets">
        {/* GetYourGuide: one English text for GYG's own AI content creator */}
        <div className="mkt-ai-target is-gyg">
          <div className="mkt-ai-target-head">
            <PlatformLogo platform="gyg" />
            <LangBadge lang={{ code: "EN", text: "ინგლისურად" }} />
          </div>
          <button type="button" className="admin-btn-primary" disabled={!!busy} onClick={() => run("gyg")}>
            {busy === "gyg" ? "AI წერს… (20–60 წმ)" : "📝 სკრიპტის გენერაცია GetYourGuide-ისთვის"}
          </button>
          <textarea rows={9} value={script} onChange={(e) => setField("gygScript", e.target.value)} placeholder="აქ გამოჩნდება ინგლისური ტექსტი GYG-ის „AI content creator“-ისთვის (შეგიძლია ხელით შეასწორო)." />
          <div className="mkt-under">
            <span className={`mkt-counter${script && (n < 700 || n > 5000) ? " is-over" : ""}`}>{n} / 5000 (მინ. 700)</span>
            <button type="button" className="admin-btn-ghost" disabled={!script} onClick={() => copy("gyg", script)}>
              {copied === "gyg" ? "დაკოპირდა ✓" : "📋 კოპირება"}
            </button>
          </div>
          <ol className="mkt-limits">
            <li>GYG: <b>Create new product</b> → English, Tour → Continue.</li>
            <li><b>AI content creator</b> → <b>Use AI</b> → ჩასვი ეს ტექსტი → <b>Create content</b>.</li>
            <li>GYG შეავსებს თითქმის ყველაფერს. შენ: შეამოწმე, <b>Photos</b> (ფოტოები ქვემოთ, „ფოტოები“ განყოფილებაში) და <b>Options</b> (ფასი, განრიგი).</li>
          </ol>
          <p className="admin-hint">⚠ „Use AI“ მხოლოდ ახალ პროდუქტზე — შევსებულ დრაფტზე GYG ყველაფრის წაშლას გთავაზობს („Start Over“) → Cancel.</p>
        </div>

        {/* Tripster: Russian texts, one per Tripster field */}
        <div className="mkt-ai-target is-tripster">
          <div className="mkt-ai-target-head">
            <PlatformLogo platform="tripster" />
            <LangBadge lang={{ code: "RU", text: "რუსულად" }} />
          </div>
          <button type="button" className="admin-btn-primary" disabled={!!busy} onClick={() => run("tripster")}>
            {busy === "tripster" ? "AI წერს… (20–60 წმ)" : "📝 ტექსტების გენერაცია Tripster-ისთვის"}
          </button>
          <p className="admin-hint">Tripster-ს AI-შემვსები არ აქვს — ამიტომ AI წერს თითოეულ ველს ცალ-ცალკე, Tripster-ის ფორმის თანმიმდევრობით. ჩასვი 📋 კოპირების ღილაკით ({trFilled}/{TRIPSTER_BLOCKS.length} მზადაა).</p>
          <div className="mkt-tr-blocks">
            {TRIPSTER_BLOCKS.map((b) => {
              const v = String(blockValue(b));
              return (
                <div key={b.key} className={`mkt-tr-block${v.trim() ? "" : " is-empty"}`}>
                  <div className="mkt-tr-block-head">
                    <b>{b.ka}</b> <small className="mkt-orig">საიტზე: {b.label}</small>
                    <button type="button" className="mkt-copy" disabled={!v.trim()} onClick={() => copy(b.key, v)}>
                      {copied === b.key ? "✓" : "📋"}
                    </button>
                  </div>
                  <div className="mkt-tr-block-text">{v.trim() ? v : "— ცარიელია —"}</div>
                </div>
              );
            })}
          </div>
          <p className="admin-hint">ფოტოები, ფასი, განრიგი, ენა და ხანგრძლივობა — Tripster-ის „Фото“ და „Условия“ ეტაპებზე (მნიშვნელობები ქვემოთ, ველებში).</p>
        </div>
      </div>

      <details className="mkt-ai-more">
        <summary>ადმინის ყველა ველის შევსება AI-ით (ორივე საიტისთვის)</summary>
        <div className="mkt-ai-actions">
          <button type="button" className="admin-btn-ghost" disabled={!!busy} onClick={() => run("empty")}>
            {busy === "empty" ? "AI წერს…" : "✨ ცარიელი ველების შევსება"}
          </button>
          <button type="button" className="admin-btn-ghost" disabled={!!busy} onClick={() => run("fix")}>
            {busy === "fix" ? "AI ამოწმებს…" : "✨ ყველაფრის შემოწმება და გასწორება"}
          </button>
        </div>
      </details>
      {canUndo && !busy && (
        <button type="button" className="admin-btn-ghost" onClick={() => { onUndo(); setMsg({ type: "info", text: "AI-ს ცვლილებები გაუქმდა." }); setNotes([]); }}>
          ↶ AI-ს ცვლილებების გაუქმება
        </button>
      )}
      {msg && <div className={`admin-alert ${msg.type}`}>{msg.text}</div>}
      {notes.length > 0 && (
        <ul className="mkt-ai-notes">
          {notes.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      )}
    </fieldset>
  );
}

// ── Editor ───────────────────────────────────────────────────────────

function Editor({ initial, siteTours, rate, onSaved, onCancel, onDelete }) {
  const [listing, setListing] = useState(() => normalize(initial));
  const [show, setShow] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [aiChanged, setAiChanged] = useState([]);
  const [aiUndo, setAiUndo] = useState(null);
  const visible = show === "all" ? PLATFORM_KEYS : [show];

  // AI answer → fields. "empty": only what is blank now; "fix": everything it returned.
  const applyAi = (data, mode) => {
    const fix = mode === "fix";
    const next = { ...listing.fields };
    const changed = [];
    for (const f of ALL_FIELDS) {
      const v = data.fields?.[f.key];
      if (v === undefined) continue;
      const cur = next[f.key];
      if (f.split) {
        const obj = { ...(cur && typeof cur === "object" ? cur : {}) };
        let any = false;
        for (const p of f.p) {
          if (v[p] == null || (!fix && !isBlank(obj[p])) || obj[p] === v[p]) continue;
          obj[p] = v[p];
          any = true;
        }
        if (any) {
          next[f.key] = obj;
          changed.push(f.key);
        }
      } else if ((fix || isBlank(cur)) && JSON.stringify(cur) !== JSON.stringify(v)) {
        next[f.key] = v;
        changed.push(f.key);
      }
    }
    setAiUndo({ fields: listing.fields, name: listing.name });
    setListing((prev) => ({ ...prev, name: prev.name || data.name || "", fields: next }));
    setAiChanged(changed);
    return changed.length;
  };
  const undoAi = () => {
    if (!aiUndo) return;
    setListing((prev) => ({ ...prev, fields: aiUndo.fields, name: aiUndo.name }));
    setAiUndo(null);
    setAiChanged([]);
  };

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
    if (!f.meetExact?.gyg && !f.meetExact?.tripster && tour.meetingPoint) f.meetExact = { gyg: en(tour.meetingPoint), tripster: ru(tour.meetingPoint) };
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

  const save = async (override, okText = "შენახულია.") => {
    const data0 = override || listing;
    if (!data0.name.trim()) {
      setMsg({ type: "error", text: "ჩაწერე შიდა სახელი." });
      return false;
    }
    setSaving(true);
    setMsg(null);
    try {
      const res = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", listing: data0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setMsg({ type: "success", text: okText });
      onSaved({ ...data0, updatedAt: data.updatedAt });
      return true;
    } catch (err) {
      setMsg({ type: "error", text: `ვერ შეინახა: ${err.message}` });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save and open the platform's editor in a new tab (filled by hand, by copying).
  const openOn = async (p) => {
    const tab = window.open("about:blank", "_blank");
    const next = { ...listing, launch: { ...listing.launch, [p]: { ...listing.launch[p], openedAt: Date.now() } } };
    setListing(next);
    const ok = await save(next, `შენახულია და გაიხსნა ${PLATFORMS[p].name}.`);
    const url = listing.launch[p].url || PLATFORMS[p].editorUrl;
    if (ok && tab) tab.location.href = url;
    else if (tab) tab.close();
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

      <AiPanel listing={listing} siteTours={siteTours} onImport={importTour} onApply={applyAi} onUndo={undoAi} canUndo={!!aiUndo} setField={setField} />

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
            <FieldLogos platforms={PLATFORM_KEYS} /> ფორმატი <small className="mkt-orig">საიტზე: Формат / Is this a private activity?</small>
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
                      {f.label} {f.orig && <small className="mkt-orig">საიტზე: {f.orig}</small>}
                      {!f.split && <LangBadge lang={writeLang(f, null, listing)} />}
                    </label>
                  )}
                  <FieldInput field={f} value={listing.fields[f.key]} onChange={(v) => setField(f.key, v)} visible={visible} listing={listing} />
                  {f.kind === "check" && f.orig && <small className="mkt-orig">საიტზე: {f.orig}</small>}
                  {aiChanged.includes(f.key) && <small className="mkt-ai-tag">✨ AI-მ შეავსო — გადახედე</small>}
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
        <button type="button" className="admin-btn-primary" disabled={saving} onClick={() => save()}>
          {saving ? "ინახება…" : "შენახვა"}
        </button>
        {PLATFORM_KEYS.filter((p) => listing.launch[p].status !== "skip").map((p) => (
          <button key={p} type="button" className="admin-btn-ghost" disabled={saving} onClick={() => openOn(p)}>
            შენახვა და {PLATFORMS[p].short}-ის გახსნა ↗
          </button>
        ))}
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
