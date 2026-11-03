"use client";

// Shared by the GetTransfer and ტურტრანსფერები admin tabs: data loading,
// formatting, the offer form and the trip-matching logic.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";

export const API = "/api/admin/gettransfer";
const POLL_MS = 30 * 1000;

export const TYPE_LABELS = {
  economy: "ეკონომი",
  comfort: "კომფორტი",
  business: "ბიზნესი",
  premium: "პრემიუმი",
  van: "მინივენი",
  business_van: "ბიზნეს ვენი",
  minibus: "მიკროავტობუსი",
  bus: "ავტობუსი",
  suv: "SUV",
  limousine: "ლიმუზინი",
  parcel: "ამანათი",
};
export const typeLabel = (key) => TYPE_LABELS[key] || key;

export const COUNTRY_LABELS = {
  GE: "საქართველო",
  AM: "სომხეთი",
  TR: "თურქეთი",
  AZ: "აზერბაიჯანი",
  RU: "რუსეთი",
};
export const countryLabel = (code) => COUNTRY_LABELS[code] || code || "?";

// Georgian name when it has been translated, GetTransfer's own otherwise.
export const fromKa = (r) => r.from_ka || r.from;
export const toKa = (r) => r.to_ka || r.to;
export const commentKa = (r) => r.comment_ka || r.comment;

const MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const WEEKDAYS = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];

// GetTransfer sends the ride's own local time ("2026-11-04T09:00:00+0400");
// read the digits as they are instead of converting to the viewer's zone.
export function rideDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m.map(Number);
  const day = Date.UTC(y, mo - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return {
    iso: s.slice(0, 10),
    day: d,
    month: MONTHS[mo - 1],
    weekday: WEEKDAYS[new Date(day).getUTCDay()],
    time,
    inDays: Math.round((day - today) / 86400000),
    short: `${d} ${MONTHS[mo - 1]}, ${time}`,
  };
}

// Absolute time of a ride, for comparing two rides ("+0400" → "+04:00").
export function rideMs(s) {
  if (!s) return NaN;
  return Date.parse(String(s).replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));
}

export function whenLabel(inDays) {
  if (inDays === 0) return "დღეს";
  if (inDays === 1) return "ხვალ";
  if (inDays > 1) return `${inDays} დღეში`;
  return "წარსული";
}

export const fmtMinutes = (m) =>
  m == null ? "" : `${m >= 60 ? `${Math.floor(m / 60)} სთ ` : ""}${Math.round(m % 60)} წთ`;

export function ago(ms) {
  if (!ms) return "არასდროს";
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "ახლახან";
  if (min < 60) return `${min} წთ წინ`;
  if (min < 24 * 60) return `${Math.round(min / 60)} სთ წინ`;
  return `${Math.round(min / 1440)} დღის წინ`;
}

export const hasOffer = (r) => !!(r.carrier_offer || r.offerStatus);
export const isNew = (r) => r.status === "new" && !hasOffer(r);

// Price rows the passenger asked for ("Any" = every type GetTransfer priced).
export function priceRows(r) {
  const sp = r.suggested_prices || {};
  const rp = r.restricted_prices || {};
  const types = r.transport_type_ids?.length ? r.transport_type_ids : Object.keys(sp);
  return types.map((key) => ({
    key,
    rec: sp[key]?.amount ?? null,
    low: sp[key]?.low?.amount ?? null,
    high: sp[key]?.high?.amount ?? null,
    max: rp[key]?.restricted_max?.amount ?? null,
  }));
}

export function cheapestRow(rows) {
  return rows.filter((p) => p.rec != null).sort((a, b) => a.rec - b.rec)[0] || rows[0];
}

// The price shown on a card and used by the price filter.
export const mainPrice = (r) => cheapestRow(priceRows(r))?.rec ?? null;

function suggestedFor(r, vehicle) {
  if (!vehicle) return "";
  const own = r.suggested_prices?.[vehicle.type]?.amount;
  if (own) return String(own);
  const any = priceRows(r).find((p) => p.rec);
  return any ? String(any.rec) : "";
}

export async function post(body) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "შეცდომა");
  return data;
}

// Requests + settings, refreshed every 30 s while the tab is visible.
export function useGetTransferData() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await adminFetch(API);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "შეცდომა");
      setData(json);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { data, error, reload: load };
}

// ── Trip matching (ტურტრანსფერები) ───────────────────────────────────

const NEAR_KM = 40;
const CHAIN_MIN_GAP_MS = 20 * 60 * 1000;
const CHAIN_MAX_GAP_MS = 18 * 60 * 60 * 1000;
const CORRIDOR_WINDOW_MS = 36 * 60 * 60 * 1000;
const CORRIDOR_MIN_KM = 80;
const TOGETHER_WINDOW_MS = 3 * 60 * 60 * 1000;

export function kmBetween(a, b) {
  if (!a || !b) return Infinity;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

function rideWindow(r) {
  const start = rideMs(r.date_to_local);
  const minutes = r.duration ? r.duration * 60 : r.time || 0;
  return { start, end: start + minutes * 60 * 1000 };
}

// Pairs of open requests one car could serve together:
//   roundtrip — B starts where A ends and brings the car back to A's start
//   chain     — B starts near where A ends, soon after A arrives
//   corridor  — same direction (same countries, or same start and end areas)
//               within 36 h; "together" when within 3 h and the seats add up
export function findMatches(requests) {
  const now = Date.now();
  const open = requests
    .filter((r) => r.status !== "gone" && r.status !== "skipped" && r.from_point && r.to_point)
    .map((r) => ({ r, ...rideWindow(r) }))
    .filter((x) => Number.isFinite(x.start) && x.start > now);

  const matches = [];
  for (const a of open) {
    for (const b of open) {
      if (a.r.id === b.r.id) continue;

      const gap = b.start - a.end;
      const emptyKm = kmBetween(a.r.to_point, b.r.from_point);
      if (emptyKm <= NEAR_KM && gap >= CHAIN_MIN_GAP_MS && gap <= CHAIN_MAX_GAP_MS) {
        const back = kmBetween(b.r.to_point, a.r.from_point) <= NEAR_KM;
        matches.push({ kind: back ? "roundtrip" : "chain", first: a.r, second: b.r, gapMs: gap, emptyKm });
        continue;
      }

      // Corridor pairs once per pair: the earlier ride first.
      if (a.start > b.start || (a.start === b.start && a.r.id > b.r.id)) continue;
      if ((a.r.distance || 0) < CORRIDOR_MIN_KM || (b.r.distance || 0) < CORRIDOR_MIN_KM) continue;
      if (Math.abs(b.start - a.start) > CORRIDOR_WINDOW_MS) continue;
      const international = a.r.from_country !== a.r.to_country;
      const sameCountries = a.r.from_country === b.r.from_country && a.r.to_country === b.r.to_country;
      const sameAreas =
        kmBetween(a.r.from_point, b.r.from_point) <= NEAR_KM * 1.5 && kmBetween(a.r.to_point, b.r.to_point) <= NEAR_KM * 1.5;
      if ((international && sameCountries) || sameAreas) {
        const together = Math.abs(b.start - a.start) <= TOGETHER_WINDOW_MS && sameAreas;
        // Passengers sometimes post the same ride twice (another car class).
        const duplicate =
          Math.abs(b.start - a.start) <= 30 * 60 * 1000 &&
          a.r.pax === b.r.pax &&
          kmBetween(a.r.from_point, b.r.from_point) <= 1.5 &&
          kmBetween(a.r.to_point, b.r.to_point) <= 1.5;
        matches.push({
          kind: together ? "together" : "corridor",
          duplicate,
          first: a.r,
          second: b.r,
          gapMs: b.start - a.start,
          emptyKm: kmBetween(a.r.from_point, b.r.from_point),
        });
      }
    }
  }

  return matches
    .map((m) => ({ ...m, income: (mainPrice(m.first) || 0) + (mainPrice(m.second) || 0) }))
    .sort((x, y) => rideMs(x.first.date_to_local) - rideMs(y.first.date_to_local));
}

// ── Offer UI ─────────────────────────────────────────────────────────

// Where a price sits in GetTransfer's low–high band.
function PriceBand({ low, high, rec, price }) {
  if (low == null || high == null || high <= low) return null;
  const pos = (v) => `${Math.min(100, Math.max(0, ((v - low) / (high - low)) * 100))}%`;
  const value = Number(price);
  return (
    <div className="gtx-band" aria-hidden="true">
      <div className="gtx-band-track">
        {rec != null && <span className="gtx-band-rec" style={{ left: pos(rec) }} />}
        {value > 0 && <span className={`gtx-band-you${value > high ? " is-over" : ""}`} style={{ left: pos(value) }} />}
      </div>
      <div className="gtx-band-scale">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function OfferForm({ request, vehicles, currency, onDone }) {
  const fitting = useMemo(() => vehicles.filter((v) => !v.pax || v.pax >= (request.pax || 1)), [vehicles, request.pax]);
  const preferred = fitting.find((v) => request.transport_type_ids?.includes(v.type)) || fitting[0] || vehicles[0];
  const [vehicleId, setVehicleId] = useState(preferred ? String(preferred.id) : "");
  const vehicle = vehicles.find((v) => String(v.id) === vehicleId);
  const [price, setPrice] = useState(() => suggestedFor(request, preferred));
  const [priceReturn, setPriceReturn] = useState(() => (request.date_return_local ? suggestedFor(request, preferred) : ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const roundTrip = !!request.date_return_local;
  const commission = Number(request.commission ?? 30);
  const total = (Number(price) || 0) + (roundTrip ? Number(priceReturn) || 0 : 0);
  const keep = Math.round(total * (1 - commission / 100));
  const band = vehicle ? request.suggested_prices?.[vehicle.type] : null;
  const restrictedMax = vehicle ? request.restricted_prices?.[vehicle.type]?.restricted_max?.amount : null;
  const overMax = restrictedMax != null && Number(price) > restrictedMax;
  const tooSmall = vehicle?.pax && vehicle.pax < request.pax;
  const symbol = currency === "GEL" ? "₾" : currency;

  function pickVehicle(id) {
    setVehicleId(id);
    const v = vehicles.find((x) => String(x.id) === id);
    setPrice(suggestedFor(request, v));
    if (roundTrip) setPriceReturn(suggestedFor(request, v));
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      await post({
        action: "offer",
        id: request.id,
        vehicleId,
        price,
        priceReturn: roundTrip ? priceReturn : null,
        withNameSign: request.name_sign_present,
      });
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!vehicles.length) {
    return <p className="gtx-note">მანქანები ჯერ არ ჩანს — გაფართოებამ ერთხელ უნდა გააკეთოს სინქრონიზაცია.</p>;
  }

  return (
    <div className="gtx-offer">
      <div className="gtx-offer-fields">
        <label className="gtx-field gtx-field--vehicle">
          <span>მანქანა</span>
          <select className="adm-input" value={vehicleId} onChange={(e) => pickVehicle(e.target.value)}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}{v.plate ? ` · ${v.plate}` : ""} · {typeLabel(v.type)} · {v.pax} ადგ.
              </option>
            ))}
          </select>
        </label>
        <label className="gtx-field gtx-field--price">
          <span>{roundTrip ? "იქით" : "ფასი"}</span>
          <div className="gtx-money">
            <input className="adm-input" type="number" min="1" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
            <em>{symbol}</em>
          </div>
        </label>
        {roundTrip && (
          <label className="gtx-field gtx-field--price">
            <span>უკან</span>
            <div className="gtx-money">
              <input className="adm-input" type="number" min="1" inputMode="numeric" value={priceReturn} onChange={(e) => setPriceReturn(e.target.value)} />
              <em>{symbol}</em>
            </div>
          </label>
        )}
        <button type="button" className="admin-btn-primary gtx-send" disabled={busy || !price || !vehicleId} onClick={send}>
          {busy ? "იგზავნება…" : "ოფერის გაგზავნა"}
        </button>
      </div>

      <div className="gtx-offer-meta">
        {band?.low?.amount != null && (
          <PriceBand low={band.low.amount} high={band.high?.amount} rec={band.amount} price={price} />
        )}
        <p className="gtx-keep">
          შენ დაგრჩება <b>{keep} ₾</b> <span>· {commission}% საკომისიოს შემდეგ</span>
        </p>
      </div>

      {(overMax || tooSmall || error) && (
        <p className="gtx-alert">
          {tooSmall && `ამ მანქანაში ${request.pax} მგზავრი არ ეტევა. `}
          {overMax && `ფასი აჭარბებს GetTransfer-ის ზღვარს (${restrictedMax} ₾). `}
          {error}
        </p>
      )}
    </div>
  );
}

export function OfferState({ request, onChange }) {
  const { offerStatus, offer, offerError, carrier_offer: existing } = request;
  const cancel = async () => {
    await post({ action: "cancel", id: request.id }).catch(() => {});
    onChange();
  };
  const priceText = offer
    ? `${offer.price_to}${offer.price_return ? ` + ${offer.price_return}` : ""} ₾ · ${offer.vehicle_name}`
    : "";

  if (offerStatus === "queued") {
    return (
      <div className="gtx-state is-wait">
        <span className="gtx-state-dot" />
        <p><span><b>რიგშია</b> · {priceText}</span><small>გაფართოება რამდენიმე წუთში გააგზავნის GetTransfer-ზე</small></p>
        <button type="button" className="admin-btn-ghost" onClick={cancel}>გაუქმება</button>
      </div>
    );
  }
  if (offerStatus === "sending") {
    return (
      <div className="gtx-state is-wait">
        <span className="gtx-state-dot" />
        <p><span><b>იგზავნება</b> · {priceText}</span></p>
      </div>
    );
  }
  if (offerStatus === "sent") {
    return (
      <div className="gtx-state is-ok">
        <span className="gtx-state-dot" />
        <p><span><b>ოფერი გაგზავნილია</b> · {priceText}</span></p>
      </div>
    );
  }
  if (offerStatus === "failed") {
    return (
      <div className="gtx-state is-bad">
        <span className="gtx-state-dot" />
        <p><span><b>ვერ გაიგზავნა</b> · {priceText}</span><small>{offerError}</small></p>
        <button type="button" className="admin-btn-ghost" onClick={cancel}>თავიდან ცდა</button>
      </div>
    );
  }
  if (existing) {
    return (
      <div className="gtx-state is-ok">
        <span className="gtx-state-dot" />
        <p><span><b>შენი ოფერი GetTransfer-ზე</b> · {existing.price}</span></p>
      </div>
    );
  }
  return null;
}

export const canOffer = (r) => r.status !== "gone" && !r.carrier_offer && !["queued", "sending", "sent"].includes(r.offerStatus);
