"use client";

import React, { useMemo, useState } from "react";
import {
  CarIcon,
  ClockIcon,
  FilterIcon,
  LuggageIcon,
  MessageIcon,
  RouteIcon,
  SearchIcon,
  UsersIcon,
} from "../components/Icons";
import {
  OfferForm,
  OfferState,
  ago,
  canOffer,
  cheapestRow,
  commentKa,
  countryLabel,
  fmtMinutes,
  fromKa,
  hasOffer,
  isNew,
  mainPrice,
  post,
  priceRows,
  rideDate,
  toKa,
  typeLabel,
  useGetTransferData,
  whenLabel,
} from "./gettransferShared";

// GetTransfer ride requests brought in by the "GT Sync" Chrome extension.
// "ოფერის გაგზავნა" only queues the offer: the extension submits it on
// gettransfer.com on its next round (within a few minutes).

const STALE_SYNC_MS = 10 * 60 * 1000;

// ── Request card ─────────────────────────────────────────────────────

export function RequestCard({ request: r, vehicles, currency, onChange }) {
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
  const offerable = canOffer(r);
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
            {r.from_country && r.to_country && r.from_country !== r.to_country && (
              <span className="gtx-tag is-blue">{countryLabel(r.from_country)} → {countryLabel(r.to_country)}</span>
            )}
            {back && <span className="gtx-tag is-blue">ორმხრივი · უკან {back.short}</span>}
            {r.duration && <span className="gtx-tag is-blue">საათობრივი · {r.duration} სთ</span>}
            {r.urgent && <span className="gtx-tag is-amber">სასწრაფო</span>}
            {gone && <span className="gtx-tag">აღარ არის GetTransfer-ზე</span>}
            <span className="gtx-age">მოვიდა {ago(r.firstSeenAt)}</span>
          </div>

          <ol className="gtx-route">
            <li title={r.from}><span className="gtx-route-dot is-a">A</span><span>{fromKa(r)}</span></li>
            <li title={r.to}><span className="gtx-route-dot is-b">B</span><span>{toKa(r)}</span></li>
          </ol>

          <ul className="gtx-facts">
            <li><RouteIcon size={15} />{r.distance} კმ{back ? " × 2" : ""}</li>
            {!r.duration && r.time != null && <li><ClockIcon size={15} />{fmtMinutes(r.time)}</li>}
            <li><UsersIcon size={15} />{r.pax} მგზავრი</li>
            {seats.length > 0 && <li><LuggageIcon size={15} />{seats.join(", ")}</li>}
            {r.name_sign_present && <li><CarIcon size={15} />დაფით დახვედრა</li>}
          </ul>

          {r.comment && (
            <p className="gtx-comment" title={r.comment_ka ? `ორიგინალი: ${r.comment}` : undefined}>
              <MessageIcon size={15} />{commentKa(r)}
            </p>
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

      {(offerable || r.status === "skipped") && (
        <div className="gtx-card-foot">
          {offerable && r.status !== "skipped" && <OfferForm request={r} vehicles={vehicles} currency={currency} onDone={onChange} />}
          {r.status === "skipped" ? (
            <button type="button" className="admin-btn-ghost" onClick={() => setStatus("new")}>დაბრუნება ახლებში</button>
          ) : (
            offerable && (
              <button type="button" className="admin-btn-ghost gtx-skip" onClick={() => setStatus("skipped")}>გამოტოვება</button>
            )
          )}
        </div>
      )}
    </article>
  );
}

// ── Sync status ──────────────────────────────────────────────────────

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

export function SyncPanel({ settings, showKey = true }) {
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
      {showKey && (
        <div className="gtx-sync-key">
          <span>გაფართოების გასაღები</span>
          <ExtensionKey />
        </div>
      )}
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

// ── Filters ──────────────────────────────────────────────────────────

const EMPTY_RANGE = { dateFrom: "", dateTo: "", priceMin: "", priceMax: "", kmMin: "", kmMax: "", direction: "" };

function isoDay(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DATE_PRESETS = [
  { label: "დღეს", from: 0, to: 0 },
  { label: "ხვალ", from: 1, to: 1 },
  { label: "3 დღე", from: 0, to: 2 },
  { label: "კვირა", from: 0, to: 6 },
];

const KM_PRESETS = [
  { label: "ქალაქში (<30)", min: "", max: "30" },
  { label: "30–150 კმ", min: "30", max: "150" },
  { label: "150+ კმ", min: "150", max: "" },
];

const directionKey = (r) => `${r.from_country || "?"}>${r.to_country || "?"}`;
const directionText = (key) => {
  const [a, b] = key.split(">");
  return a === b ? `${countryLabel(a)}-ის შიგნით` : `${countryLabel(a)} → ${countryLabel(b)}`;
};

function inRange(value, min, max) {
  if (min !== "" && !(value >= Number(min))) return false;
  if (max !== "" && !(value <= Number(max))) return false;
  return true;
}

function applyRange(r, f) {
  const day = (r.date_to_local || "").slice(0, 10);
  if (f.dateFrom && day < f.dateFrom) return false;
  if (f.dateTo && day > f.dateTo) return false;
  if ((f.priceMin !== "" || f.priceMax !== "") && !inRange(mainPrice(r) ?? NaN, f.priceMin, f.priceMax)) return false;
  if (!inRange(r.distance ?? NaN, f.kmMin, f.kmMax)) return false;
  if (f.direction && directionKey(r) !== f.direction) return false;
  return true;
}

function FilterPanel({ value, onChange, directions }) {
  const set = (patch) => onChange({ ...value, ...patch });
  const activeDate = DATE_PRESETS.find((p) => value.dateFrom === isoDay(p.from) && value.dateTo === isoDay(p.to));
  const activeKm = KM_PRESETS.find((p) => value.kmMin === p.min && value.kmMax === p.max);

  return (
    <div className="gtx-filters">
      <div className="gtx-filter">
        <span className="gtx-filter-label">თარიღი</span>
        <div className="gtx-chips">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`gtx-chip${activeDate === p ? " is-on" : ""}`}
              onClick={() => set(activeDate === p ? { dateFrom: "", dateTo: "" } : { dateFrom: isoDay(p.from), dateTo: isoDay(p.to) })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="gtx-range">
          <input className="adm-input" type="date" value={value.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} aria-label="თარიღიდან" />
          <span>—</span>
          <input className="adm-input" type="date" value={value.dateTo} onChange={(e) => set({ dateTo: e.target.value })} aria-label="თარიღამდე" />
        </div>
      </div>

      <div className="gtx-filter">
        <span className="gtx-filter-label">ფასი ₾ (რეკომენდებული)</span>
        <div className="gtx-range">
          <input className="adm-input" type="number" min="0" placeholder="დან" value={value.priceMin} onChange={(e) => set({ priceMin: e.target.value })} />
          <span>—</span>
          <input className="adm-input" type="number" min="0" placeholder="მდე" value={value.priceMax} onChange={(e) => set({ priceMax: e.target.value })} />
        </div>
      </div>

      <div className="gtx-filter">
        <span className="gtx-filter-label">მანძილი კმ</span>
        <div className="gtx-chips">
          {KM_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`gtx-chip${activeKm === p ? " is-on" : ""}`}
              onClick={() => set(activeKm === p ? { kmMin: "", kmMax: "" } : { kmMin: p.min, kmMax: p.max })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="gtx-range">
          <input className="adm-input" type="number" min="0" placeholder="დან" value={value.kmMin} onChange={(e) => set({ kmMin: e.target.value })} />
          <span>—</span>
          <input className="adm-input" type="number" min="0" placeholder="მდე" value={value.kmMax} onChange={(e) => set({ kmMax: e.target.value })} />
        </div>
      </div>

      <div className="gtx-filter">
        <span className="gtx-filter-label">მიმართულება</span>
        <select className="adm-input" value={value.direction} onChange={(e) => set({ direction: e.target.value })}>
          <option value="">ყველა</option>
          {directions.map(([key, count]) => (
            <option key={key} value={key}>{directionText(key)} ({count})</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────

const SORTS = {
  date: { label: "მგზავრობის თარიღით", fn: (a, b) => String(a.date_to_local).localeCompare(String(b.date_to_local)) },
  fresh: { label: "ახლად მოსულები", fn: (a, b) => b.firstSeenAt - a.firstSeenAt },
  priceDesc: { label: "ძვირი ჯერ", fn: (a, b) => (mainPrice(b) || 0) - (mainPrice(a) || 0) },
  priceAsc: { label: "იაფი ჯერ", fn: (a, b) => (mainPrice(a) ?? Infinity) - (mainPrice(b) ?? Infinity) },
  kmDesc: { label: "გრძელი ჯერ", fn: (a, b) => (b.distance || 0) - (a.distance || 0) },
  kmAsc: { label: "მოკლე ჯერ", fn: (a, b) => (a.distance || 0) - (b.distance || 0) },
};

export default function GetTransferManager() {
  const { data, error, reload } = useGetTransferData();
  const [filter, setFilter] = useState("new");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [range, setRange] = useState(EMPTY_RANGE);
  const [showFilters, setShowFilters] = useState(false);

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

  const directions = useMemo(() => {
    const map = new Map();
    for (const r of requests) map.set(directionKey(r), (map.get(directionKey(r)) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const activeRange = Object.values(range).filter(Boolean).length;

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests
      .filter((r) => {
        if (filter === "new" && !isNew(r)) return false;
        if (filter === "offered" && !hasOffer(r)) return false;
        if (filter === "skipped" && r.status !== "skipped") return false;
        if (!applyRange(r, range)) return false;
        return !q || `${r.from} ${r.to} ${r.from_ka} ${r.to_ka} ${r.comment} ${r.comment_ka} ${r.id}`.toLowerCase().includes(q);
      })
      .sort(SORTS[sort].fn);
  }, [requests, filter, search, sort, range]);

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

      <div className="gtx-toolbar-wrap">
        <div className="gtx-toolbar">
          <label className="gtx-search">
            <SearchIcon size={16} />
            <input placeholder="ძებნა: ბათუმი, Kutaisi, სასტუმრო, #ნომერი…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <button
            type="button"
            className={`gtx-filter-toggle${showFilters || activeRange ? " is-on" : ""}`}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
          >
            <FilterIcon size={16} />
            ფილტრები{activeRange ? ` (${activeRange})` : ""}
          </button>
          <select className="adm-input gtx-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="დალაგება">
            {Object.entries(SORTS).map(([key, s]) => (
              <option key={key} value={key}>{s.label}</option>
            ))}
          </select>
        </div>
        {showFilters && <FilterPanel value={range} onChange={setRange} directions={directions} />}
        {activeRange > 0 && (
          <p className="gtx-filter-summary">
            ნაჩვენებია <b>{shown.length}</b> შეკვეთა
            <button type="button" className="admin-btn-ghost" onClick={() => setRange(EMPTY_RANGE)}>ფილტრების გასუფთავება</button>
          </p>
        )}
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
