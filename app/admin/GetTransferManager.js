"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import {
  CarIcon,
  ClockIcon,
  LuggageIcon,
  MessageIcon,
  RouteIcon,
  SearchIcon,
  UsersIcon,
} from "../components/Icons";

// GetTransfer ride requests brought in by the "GT Sync" Chrome extension.
// "ოფერის გაგზავნა" only queues the offer: the extension submits it on
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

const MONTHS = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლ", "აგვ", "სექ", "ოქტ", "ნოე", "დეკ"];
const WEEKDAYS = ["კვი", "ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ"];

// GetTransfer sends the ride's own local time ("2026-11-04T09:00:00+0400");
// read the digits as they are instead of converting to the viewer's zone.
function rideDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m.map(Number);
  const day = Date.UTC(y, mo - 1, d);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const inDays = Math.round((day - today) / 86400000);
  return {
    day: d,
    month: MONTHS[mo - 1],
    weekday: WEEKDAYS[new Date(day).getUTCDay()],
    time: `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    inDays,
    short: `${d} ${MONTHS[mo - 1]}, ${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
  };
}

function whenLabel(inDays) {
  if (inDays === 0) return "დღეს";
  if (inDays === 1) return "ხვალ";
  if (inDays > 1) return `${inDays} დღეში`;
  return "წარსული";
}

const fmtMinutes = (m) => (m == null ? "" : `${m >= 60 ? `${Math.floor(m / 60)} სთ ` : ""}${m % 60} წთ`);

function ago(ms) {
  if (!ms) return "არასდროს";
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return "ახლახან";
  if (min < 60) return `${min} წთ წინ`;
  if (min < 24 * 60) return `${Math.round(min / 60)} სთ წინ`;
  return `${Math.round(min / 1440)} დღის წინ`;
}

const hasOffer = (r) => !!(r.carrier_offer || r.offerStatus);
const isNew = (r) => r.status === "new" && !hasOffer(r);

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

function cheapestRow(rows) {
  return rows.filter((p) => p.rec != null).sort((a, b) => a.rec - b.rec)[0] || rows[0];
}

async function post(body) {
  const res = await adminFetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "შეცდომა");
  return data;
}

// ── Pieces ───────────────────────────────────────────────────────────

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

function OfferForm({ request, vehicles, currency, onDone }) {
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
            <em>{currency === "GEL" ? "₾" : currency}</em>
          </div>
        </label>
        {roundTrip && (
          <label className="gtx-field gtx-field--price">
            <span>უკან</span>
            <div className="gtx-money">
              <input className="adm-input" type="number" min="1" inputMode="numeric" value={priceReturn} onChange={(e) => setPriceReturn(e.target.value)} />
              <em>{currency === "GEL" ? "₾" : currency}</em>
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

function OfferState({ request, onChange }) {
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

function RequestCard({ request: r, vehicles, currency, onChange }) {
  const date = rideDate(r.date_to_local);
  const back = rideDate(r.date_return_local);
  const rows = priceRows(r);
  const main = cheapestRow(rows);
  const seats = [
    r.child_seats_infant && `${r.child_seats_infant} ჩვილის`,
    r.child_seats_convertible && `${r.child_seats_convertible} ბავშვის`,
    r.child_seats_booster && `${r.child_seats_booster} ბუსტერი`,
  ].filter(Boolean);
  const gone = r.status === "gone";
  const canOffer = !gone && !r.carrier_offer && !["queued", "sending", "sent"].includes(r.offerStatus);
  const [open, setOpen] = useState(false);

  const setStatus = async (status) => {
    await post({ action: "status", id: r.id, status }).catch(() => {});
    onChange();
  };

  return (
    <article className={`gtx-card${r.urgent ? " is-urgent" : ""}${gone ? " is-gone" : ""}`}>
      <div className="gtx-card-body">
        <div className="gtx-date">
          {date ? (
            <>
              <span className="gtx-date-when">{whenLabel(date.inDays)}</span>
              <strong>{date.day}</strong>
              <span>{date.month} · {date.weekday}</span>
              <b>{date.time}</b>
            </>
          ) : (
            <strong>—</strong>
          )}
        </div>

        <div className="gtx-main">
          <div className="gtx-tags">
            <a className="gtx-id" href={`https://gettransfer.com/en/carrier/#/cabinet/requests/${r.id}/info`} target="_blank" rel="noreferrer">
              #{r.id} ↗
            </a>
            {back && <span className="gtx-tag is-blue">ორმხრივი · უკან {back.short}</span>}
            {r.duration && <span className="gtx-tag is-blue">საათობრივი · {r.duration} სთ</span>}
            {r.urgent && <span className="gtx-tag is-amber">სასწრაფო</span>}
            {gone && <span className="gtx-tag">აღარ არის GetTransfer-ზე</span>}
            <span className="gtx-age">მოვიდა {ago(r.firstSeenAt)}</span>
          </div>

          <ol className="gtx-route">
            <li><span className="gtx-route-dot is-a">A</span><span>{r.from}</span></li>
            <li><span className="gtx-route-dot is-b">B</span><span>{r.to}</span></li>
          </ol>

          <ul className="gtx-facts">
            <li><RouteIcon size={15} />{r.distance} კმ{back ? " × 2" : ""}</li>
            {!r.duration && r.time != null && <li><ClockIcon size={15} />{fmtMinutes(r.time)}</li>}
            <li><UsersIcon size={15} />{r.pax} მგზავრი</li>
            {seats.length > 0 && <li><LuggageIcon size={15} />{seats.join(", ")}</li>}
            {r.name_sign_present && <li><CarIcon size={15} />დაფით დახვედრა</li>}
          </ul>

          {r.comment && (
            <p className="gtx-comment"><MessageIcon size={15} />{r.comment}</p>
          )}
        </div>

        <aside className="gtx-pricebox">
          <span className="gtx-pricebox-label">{main?.rec == null && main?.max != null ? "მაქს. ფასი" : "რეკომენდებული"}</span>
          {main?.rec != null ? (
            <>
              <strong>{main.rec} ₾</strong>
              <span className="gtx-pricebox-range">{main.low}–{main.high} ₾ · {typeLabel(main.key)}</span>
            </>
          ) : main?.max != null ? (
            <>
              <strong>≤ {main.max} ₾</strong>
              <span className="gtx-pricebox-range">GetTransfer-ის ზღვარი · {typeLabel(main.key)}</span>
            </>
          ) : (
            <strong className="is-empty">—</strong>
          )}
          {rows.length > 1 && (
            <button type="button" className="gtx-more" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {open ? "დამალვა" : `ყველა ტიპი (${rows.length})`}
            </button>
          )}
          {r.passenger_offered_price && (
            <span className="gtx-pricebox-pax">
              მგზავრი სთავაზობს: <b>{typeof r.passenger_offered_price === "object" ? r.passenger_offered_price.default : r.passenger_offered_price}</b>
            </span>
          )}
        </aside>
      </div>

      {open && (
        <table className="gtx-types">
          <thead>
            <tr><th>ტიპი</th><th>რეკომენდ.</th><th>დიაპაზონი</th><th>ზღვარი</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.key}>
                <td>{typeLabel(p.key)}</td>
                <td><b>{p.rec != null ? `${p.rec} ₾` : "—"}</b></td>
                <td>{p.low != null ? `${p.low}–${p.high} ₾` : "—"}</td>
                <td className={p.max != null ? "is-max" : ""}>{p.max != null ? `≤ ${p.max} ₾` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <OfferState request={r} onChange={onChange} />

      {(canOffer || r.status === "skipped") && (
        <div className="gtx-card-foot">
          {canOffer && r.status !== "skipped" && <OfferForm request={r} vehicles={vehicles} currency={currency} onDone={onChange} />}
          {r.status === "skipped" ? (
            <button type="button" className="admin-btn-ghost" onClick={() => setStatus("new")}>დაბრუნება ახლებში</button>
          ) : (
            canOffer && (
              <button type="button" className="admin-btn-ghost gtx-skip" onClick={() => setStatus("skipped")}>გამოტოვება</button>
            )
          )}
        </div>
      )}
    </article>
  );
}

function ExtensionKey() {
  const [key, setKey] = useState("");
  const [copied, setCopied] = useState(false);

  async function load(action) {
    if (action === "rotate-key" && !window.confirm("ძველი გასაღები აღარ იმუშავებს და გაფართოებაში ახლის ჩასმა მოგიწევს. გავაგრძელო?")) return;
    const data = await post({ action }).catch(() => ({}));
    if (data.key) setKey(data.key);
  }

  async function copy() {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!key) {
    return <button type="button" className="admin-btn-ghost" onClick={() => load("key")}>გასაღების ჩვენება</button>;
  }
  return (
    <div className="gtx-key">
      <code title={key}>{key.slice(0, 6)}••••••{key.slice(-4)}</code>
      <button type="button" className="admin-btn-primary gtx-key-copy" onClick={copy}>{copied ? "დაკოპირდა ✓" : "კოპირება"}</button>
      <button type="button" className="admin-btn-ghost" onClick={() => load("rotate-key")}>ახლის შექმნა</button>
    </div>
  );
}

function SyncPanel({ settings }) {
  const never = !settings.lastSyncAt;
  const stale = never || Date.now() - settings.lastSyncAt > STALE_SYNC_MS;
  return (
    <section className={`gtx-sync${stale ? " is-off" : " is-on"}`}>
      <div className="gtx-sync-state">
        <span className="gtx-pulse" />
        <div>
          <b>{stale ? "გაფართოება არ მუშაობს" : "გაფართოება მუშაობს"}</b>
          <span>
            ბოლო სინქრონიზაცია: {ago(settings.lastSyncAt)}
            {settings.lastSyncCount != null && ` · ${settings.lastSyncCount} შეკვეთა`}
            {settings.vehicles?.length ? ` · ${settings.vehicles.length} მანქანა` : ""}
          </span>
        </div>
      </div>
      <div className="gtx-sync-key">
        <span>გაფართოების გასაღები</span>
        <ExtensionKey />
      </div>
      {stale && (
        <ol className="gtx-steps">
          {never ? (
            <>
              <li>Chrome → <code>chrome://extensions</code> → ჩართე <b>Developer mode</b> → <b>Load unpacked</b> → საქაღალდე <code>gettransfer-extension</code></li>
              <li>აქ დააჭირე <b>გასაღების ჩვენება → კოპირება</b> და ჩასვი <b>GT Sync</b>-ის ფანჯარაში</li>
              <li>გახსენი <a href="https://gettransfer.com/en/carrier/#/cabinet/requests" target="_blank" rel="noreferrer">gettransfer.com/en/carrier</a> — შეკვეთები აქ ~10 წამში გამოჩნდება</li>
            </>
          ) : (
            <li>Chrome-ში გახსენი <a href="https://gettransfer.com/en/carrier/#/cabinet/requests" target="_blank" rel="noreferrer">gettransfer.com/en/carrier</a> და შედი GetTransfer-ში — სინქრონიზაცია თავისით განახლდება.</li>
          )}
        </ol>
      )}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

const SORTS = {
  date: { label: "მგზავრობის თარიღით", fn: (a, b) => String(a.date_to_local).localeCompare(String(b.date_to_local)) },
  fresh: { label: "ახლად მოსულები", fn: (a, b) => b.firstSeenAt - a.firstSeenAt },
  price: { label: "ძვირი ჯერ", fn: (a, b) => (cheapestRow(priceRows(b))?.rec || 0) - (cheapestRow(priceRows(a))?.rec || 0) },
  distance: { label: "გრძელი ჯერ", fn: (a, b) => (b.distance || 0) - (a.distance || 0) },
};

export default function GetTransferManager() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("new");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");

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

  return (
    <GetTransferView
      data={data}
      error={error}
      filter={filter}
      setFilter={setFilter}
      search={search}
      setSearch={setSearch}
      sort={sort}
      setSort={setSort}
      reload={load}
    />
  );
}

export function GetTransferView({ data, error, filter, setFilter, search, setSearch, sort, setSort, reload }) {
  const settings = data?.settings || {};
  const vehicles = settings.vehicles || [];
  const currency = settings.currency || "GEL";
  const requests = useMemo(() => data?.requests || [], [data]);

  const counts = useMemo(() => {
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return {
      new: requests.filter(isNew).length,
      offered: requests.filter(hasOffer).length,
      skipped: requests.filter((r) => r.status === "skipped").length,
      all: requests.length,
      today: requests.filter((r) => r.firstSeenAt > dayAgo).length,
    };
  }, [requests]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => {
        if (filter === "new" && !isNew(r)) return false;
        if (filter === "offered" && !hasOffer(r)) return false;
        if (filter === "skipped" && r.status !== "skipped") return false;
        return !q || `${r.from} ${r.to} ${r.comment} ${r.id}`.toLowerCase().includes(q);
      })
      .sort(SORTS[sort].fn);
  }, [requests, filter, search, sort]);

  const cards = [
    { key: "new", label: "ახალი", tone: "pending", value: counts.new },
    { key: "offered", label: "ოფერით", tone: "confirmed", value: counts.offered },
    { key: "skipped", label: "გამოტოვებული", tone: "cancelled", value: counts.skipped },
    { key: "all", label: "ყველა", tone: "all", value: counts.all },
  ];

  return (
    <div className="gtx-wrap">
      <SyncPanel settings={settings} />

      <div className="bk-status-row" role="group" aria-label="შეკვეთების ფილტრი">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`bk-status is-${c.tone}${filter === c.key ? " is-active" : ""}`}
            aria-pressed={filter === c.key}
            onClick={() => setFilter(c.key)}
          >
            <span className="bk-status-label">{c.label}</span>
            <strong>{c.value}</strong>
          </button>
        ))}
        <div className="bk-status bk-status--total">
          <span className="bk-status-label">ბოლო 24 საათში</span>
          <strong>{counts.today}</strong>
        </div>
      </div>

      <div className="gtx-toolbar">
        <label className="gtx-search">
          <SearchIcon size={16} />
          <input placeholder="ძებნა: Batumi, Kutaisi, სასტუმრო…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <select className="adm-input gtx-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="დალაგება">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {error && <p className="gtx-alert">{error}</p>}
      {!data && !error && <div className="gtx-empty">იტვირთება…</div>}
      {data && !shown.length && (
        <div className="gtx-empty">
          <CarIcon size={28} />
          <b>{requests.length ? "ამ ფილტრით შეკვეთა არ არის" : "შეკვეთები ჯერ არ შემოსულა"}</b>
          <span>{requests.length ? "სცადე სხვა ფილტრი ან ძებნა." : "გაფართოება ჩართვის შემდეგ აქ GetTransfer-ის ყველა ახალი შეკვეთა გამოჩნდება."}</span>
        </div>
      )}

      <div className="gtx-list">
        {shown.map((r) => (
          <RequestCard key={r.id} request={r} vehicles={vehicles} currency={currency} onChange={reload} />
        ))}
      </div>
    </div>
  );
}
