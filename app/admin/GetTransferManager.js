"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";

// GetTransfer ride requests brought in by the "GT Sync" Chrome extension.
// "გაგზავნა" only queues the offer: the extension submits it on
// gettransfer.com on its next round (within a few minutes).

const API = "/api/admin/gettransfer";
const POLL_MS = 30 * 1000;
const STALE_SYNC_MS = 10 * 60 * 1000;

const TYPE_LABELS = {
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
const typeLabel = (key) => TYPE_LABELS[key] || key;

const FILTERS = [
  { key: "new", label: "ახალი" },
  { key: "offered", label: "ოფერით" },
  { key: "skipped", label: "გამოტოვებული" },
  { key: "all", label: "ყველა" },
];

const fmtDate = (s) => (s ? s.slice(0, 16).replace("T", " ") : "");
const fmtMinutes = (m) => (m == null ? "" : `${m >= 60 ? `${Math.floor(m / 60)}სთ ` : ""}${m % 60}წთ`);

function ago(ms) {
  if (!ms) return "არასდროს";
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "ახლახან";
  if (min < 60) return `${min} წთ წინ`;
  return `${Math.round(min / 60)} სთ წინ`;
}

function hasOffer(r) {
  return !!(r.carrier_offer || r.offerStatus);
}

// Price rows the passenger asked for ("Any" = every type GetTransfer priced).
function priceRows(r) {
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

function suggestedFor(r, vehicle) {
  if (!vehicle) return "";
  const own = r.suggested_prices?.[vehicle.type]?.amount;
  if (own) return String(own);
  const any = priceRows(r).find((p) => p.rec);
  return any ? String(any.rec) : "";
}

function OfferForm({ request, vehicles, currency, onDone }) {
  const fitting = useMemo(
    () => vehicles.filter((v) => !v.pax || v.pax >= (request.pax || 1)),
    [vehicles, request.pax]
  );
  const preferred =
    fitting.find((v) => request.transport_type_ids?.includes(v.type)) || fitting[0] || vehicles[0];
  const [vehicleId, setVehicleId] = useState(preferred ? String(preferred.id) : "");
  const vehicle = vehicles.find((v) => String(v.id) === vehicleId);
  const [price, setPrice] = useState(() => suggestedFor(request, preferred));
  const [priceReturn, setPriceReturn] = useState(() => (request.date_return_local ? suggestedFor(request, preferred) : ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const commission = Number(request.commission ?? 30);
  const net = (Number(price) || 0) + (Number(priceReturn) || 0);
  const restrictedMax = vehicle ? request.restricted_prices?.[vehicle.type]?.restricted_max?.amount : null;

  function pickVehicle(id) {
    setVehicleId(id);
    const v = vehicles.find((x) => String(x.id) === id);
    setPrice(suggestedFor(request, v));
    if (request.date_return_local) setPriceReturn(suggestedFor(request, v));
  }

  async function send() {
    setBusy(true);
    setError("");
    try {
      const res = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "offer",
          id: request.id,
          vehicleId,
          price,
          priceReturn: request.date_return_local ? priceReturn : null,
          withNameSign: request.name_sign_present,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "შეცდომა");
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!vehicles.length) {
    return <p className="admin-hint">მანქანები ჯერ არ ჩანს — გაფართოებამ ერთხელ უნდა გააკეთოს სინქრონიზაცია.</p>;
  }

  return (
    <div className="gtx-offer">
      <select className="adm-input" value={vehicleId} onChange={(e) => pickVehicle(e.target.value)}>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name} · {typeLabel(v.type)} · {v.pax} მგზ.{v.pax && v.pax < request.pax ? " (არ ეტევა!)" : ""}
          </option>
        ))}
      </select>
      <label className="gtx-price">
        <span>{request.date_return_local ? "იქით" : "ფასი"}</span>
        <input className="adm-input" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
        <span>{currency}</span>
      </label>
      {request.date_return_local && (
        <label className="gtx-price">
          <span>უკან</span>
          <input className="adm-input" type="number" min="1" value={priceReturn} onChange={(e) => setPriceReturn(e.target.value)} />
          <span>{currency}</span>
        </label>
      )}
      <button type="button" className="admin-btn-primary" disabled={busy || !price || !vehicleId} onClick={send}>
        {busy ? "..." : "გაგზავნა"}
      </button>
      <p className="gtx-net">
        შენ დაგრჩება ≈ <b>{Math.round(net * (1 - commission / 100))} {currency}</b> ({commission}% საკომისიოს შემდეგ)
        {restrictedMax != null && Number(price) > restrictedMax && (
          <span className="gtx-warn"> · მაქს. ზღვარია {restrictedMax} {currency}!</span>
        )}
      </p>
      {error && <p className="gtx-warn">{error}</p>}
    </div>
  );
}

function OfferState({ request, onChange }) {
  const { offerStatus, offer, offerError, carrier_offer: existing } = request;
  async function cancel() {
    await adminFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", id: request.id }),
    });
    onChange();
  }
  const priceText = offer ? `${offer.price_to}${offer.price_return ? ` + ${offer.price_return}` : ""} ${offer.currency} · ${offer.vehicle_name}` : "";
  if (offerStatus === "queued") {
    return (
      <p className="gtx-state is-wait">
        ⏳ რიგშია: {priceText} — გაფართოება რამდენიმე წუთში გააგზავნის.{" "}
        <button type="button" className="admin-btn-ghost" onClick={cancel}>გაუქმება</button>
      </p>
    );
  }
  if (offerStatus === "sending") return <p className="gtx-state is-wait">📤 იგზავნება: {priceText}</p>;
  if (offerStatus === "sent") return <p className="gtx-state is-ok">✅ გაგზავნილია: {priceText}</p>;
  if (offerStatus === "failed") {
    return (
      <p className="gtx-state is-bad">
        ❌ ვერ გაიგზავნა: {offerError}{" "}
        <button type="button" className="admin-btn-ghost" onClick={cancel}>თავიდან</button>
      </p>
    );
  }
  if (existing) return <p className="gtx-state is-ok">✅ შენი ოფერი GetTransfer-ზე: {existing.price}</p>;
  return null;
}

function RequestCard({ request, vehicles, currency, onChange }) {
  const r = request;
  const seats = [
    r.child_seats_infant && `${r.child_seats_infant} ჩვილის`,
    r.child_seats_convertible && `${r.child_seats_convertible} ბავშვის`,
    r.child_seats_booster && `${r.child_seats_booster} ბუსტერი`,
  ].filter(Boolean);
  const rows = priceRows(r);
  const canOffer = r.status !== "gone" && !["queued", "sending", "sent"].includes(r.offerStatus) && !r.carrier_offer;

  async function setStatus(status) {
    await adminFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id: r.id, status }),
    });
    onChange();
  }

  return (
    <article className={`gtx-card${r.urgent ? " is-urgent" : ""}${r.status === "gone" ? " is-gone" : ""}`}>
      <header className="gtx-card-head">
        <a href={`https://gettransfer.com/en/carrier/#/cabinet/requests/${r.id}/info`} target="_blank" rel="noreferrer">
          #{r.id}
        </a>
        <b>{fmtDate(r.date_to_local)}</b>
        {r.date_return_local && <span>დაბრუნება: {fmtDate(r.date_return_local)}</span>}
        {r.urgent && <span className="gtx-warn">სასწრაფო</span>}
        {r.status === "gone" && <span className="gtx-muted">აღარ არის GetTransfer-ზე</span>}
        <span className="gtx-muted gtx-right">მოვიდა {ago(r.firstSeenAt)}</span>
      </header>

      <div className="gtx-route">
        <div><span className="gtx-pin">A</span>{r.from}</div>
        <div><span className="gtx-pin">B</span>{r.to}</div>
      </div>

      <p className="gtx-facts">
        <span>{r.distance} კმ{r.date_return_local ? " ×2" : ""}</span>
        <span>{r.duration ? `${r.duration} სთ საათობრივი` : fmtMinutes(r.time)}</span>
        <span>{r.pax} მგზავრი</span>
        {seats.length > 0 && <span>{seats.join(", ")}</span>}
        {r.name_sign_present && <span>დაფით დახვედრა</span>}
      </p>

      {r.comment && <p className="gtx-comment">💬 {r.comment}</p>}

      <div className="gtx-prices">
        {rows.map((p) => (
          <span key={p.key} className="gtx-price-tag">
            <span className="gtx-type">{typeLabel(p.key)}</span>
            {p.rec != null ? (
              <>
                <b>{p.rec}</b> <span className="gtx-muted">({p.low}–{p.high})</span>
              </>
            ) : (
              <span className="gtx-muted">—</span>
            )}
            {p.max != null && <span className="gtx-max">≤ {p.max}</span>}
          </span>
        ))}
        {r.passenger_offered_price && (
          <span className="gtx-price-tag">
            <span className="gtx-type">მგზავრის ფასი</span>
            <b>{typeof r.passenger_offered_price === "object" ? r.passenger_offered_price.default : r.passenger_offered_price}</b>
          </span>
        )}
      </div>

      <OfferState request={r} onChange={onChange} />
      {canOffer && <OfferForm request={r} vehicles={vehicles} currency={currency} onDone={onChange} />}

      <footer className="gtx-card-foot">
        {r.status === "skipped" ? (
          <button type="button" className="admin-btn-ghost" onClick={() => setStatus("new")}>დაბრუნება ახლებში</button>
        ) : (
          r.status !== "gone" && !hasOffer(r) && (
            <button type="button" className="admin-btn-ghost" onClick={() => setStatus("skipped")}>გამოტოვება</button>
          )
        )}
      </footer>
    </article>
  );
}

function ExtensionKey() {
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);

  async function load(action) {
    if (action === "rotate-key" && !window.confirm("ძველი გასაღები აღარ იმუშავებს. გავაგრძელო?")) return;
    const res = await adminFetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.key) setKey(data.key);
  }

  async function copy() {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!key) {
    return <button type="button" className="admin-btn-ghost" onClick={() => load("key")}>გაფართოების გასაღები</button>;
  }
  return (
    <span className="gtx-key">
      <code>{key}</code>
      <button type="button" className="admin-btn-ghost" onClick={copy}>{copied ? "დაკოპირდა" : "კოპირება"}</button>
      <button type="button" className="admin-btn-ghost" onClick={() => load("rotate-key")}>ახალი</button>
    </span>
  );
}

export default function GetTransferManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("new");
  const [search, setSearch] = useState("");

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

  const settings = data?.settings || {};
  const vehicles = settings.vehicles || [];
  const currency = settings.currency || "GEL";
  const requests = data?.requests || [];

  const counts = useMemo(
    () => ({
      new: requests.filter((r) => r.status === "new" && !hasOffer(r)).length,
      offered: requests.filter(hasOffer).length,
      skipped: requests.filter((r) => r.status === "skipped").length,
      all: requests.length,
    }),
    [requests]
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (filter === "new" && !(r.status === "new" && !hasOffer(r))) return false;
      if (filter === "offered" && !hasOffer(r)) return false;
      if (filter === "skipped" && r.status !== "skipped") return false;
      return !q || `${r.from} ${r.to} ${r.comment} ${r.id}`.toLowerCase().includes(q);
    });
  }, [requests, filter, search]);

  const stale = !settings.lastSyncAt || Date.now() - settings.lastSyncAt > STALE_SYNC_MS;

  return (
    <div className="gtx-wrap">
      <section className="gtx-status">
        <p>
          ბოლო სინქრონიზაცია: <b className={stale ? "gtx-warn" : ""}>{ago(settings.lastSyncAt)}</b>
          {settings.lastSyncCount != null && <span className="gtx-muted"> · {settings.lastSyncCount} შეკვეთა</span>}
        </p>
        {stale && (
          <p className="admin-hint">
            გაფართოება ახლა არ მუშაობს: Chrome-ში გახსენი gettransfer.com/en/carrier და GetTransfer-ში შესული უნდა იყო.
          </p>
        )}
        <ExtensionKey />
      </section>

      <div className="gtx-toolbar">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={filter === f.key ? "admin-btn-primary" : "admin-btn-ghost"}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
        <input
          className="adm-input gtx-search"
          placeholder="ძებნა: Batumi, Kutaisi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="gtx-warn">{error}</p>}
      {!data && !error && <p className="admin-hint">იტვირთება...</p>}
      {data && !shown.length && <p className="admin-hint">შეკვეთა არ არის.</p>}

      <div className="gtx-list">
        {shown.map((r) => (
          <RequestCard key={r.id} request={r} vehicles={vehicles} currency={currency} onChange={load} />
        ))}
      </div>
    </div>
  );
}
