"use client";

import React, { useMemo, useState } from "react";
import { ClockIcon, RouteIcon, SearchIcon, UsersIcon } from "../components/Icons";
import {
  OfferForm,
  OfferState,
  canOffer,
  countryLabel,
  findMatches,
  fmtMinutes,
  fromKa,
  hasOffer,
  mainPrice,
  rideDate,
  toKa,
  useGetTransferData,
  whenLabel,
} from "./gettransferShared";
import { SyncPanel } from "./GetTransferManager";

// ტურტრანსფერები: GetTransfer requests that one car can do back to back
// (A ends where B starts), as a round trip, or in the same direction —
// so a long drive does not come back empty.

const KINDS = {
  roundtrip: { label: "წასვლა-დაბრუნება", hint: "B იწყება იქ, სადაც A მთავრდება, და მანქანა უკან ბრუნდება", tone: "confirmed" },
  chain: { label: "მიყოლებით", hint: "A-ს დასრულების ადგილიდან მალევე იწყება B", tone: "completed" },
  together: { label: "ერთად წაყვანა", hint: "ერთი მიმართულება, 3 საათის ფარგლებში — შეიძლება ერთ მანქანაში", tone: "pending" },
  corridor: { label: "ერთი მიმართულება", hint: "იგივე ქვეყნებს/ქალაქებს შორის, 36 საათის ფარგლებში", tone: "all" },
};

function gapText(ms) {
  const min = Math.round(Math.abs(ms) / 60000);
  if (min < 60) return `${min} წთ`;
  const h = Math.floor(min / 60);
  return h >= 24 ? `${Math.floor(h / 24)} დღე ${h % 24} სთ` : `${h} სთ ${min % 60 ? `${min % 60} წთ` : ""}`;
}

function Leg({ label, request: r, vehicles, currency, onChange }) {
  const date = rideDate(r.date_to_local);
  const price = mainPrice(r);
  const [offering, setOffering] = useState(false);
  return (
    <div className="ttx-leg">
      <div className="ttx-leg-head">
        <span className="ttx-leg-label">{label}</span>
        {date && (
          <span className="ttx-leg-date">
            <b>{date.day} {date.month}, {date.time}</b> · {whenLabel(date.inDays)}
          </span>
        )}
        <a className="gtx-id" href={`https://gettransfer.com/en/carrier/#/cabinet/requests/${r.id}/info`} target="_blank" rel="noreferrer">
          #{r.id} ↗
        </a>
      </div>
      <ol className="gtx-route">
        <li title={r.from}><span className="gtx-route-dot is-a">A</span><span>{fromKa(r)}</span></li>
        <li title={r.to}><span className="gtx-route-dot is-b">B</span><span>{toKa(r)}</span></li>
      </ol>
      <ul className="gtx-facts">
        <li><RouteIcon size={15} />{r.distance} კმ</li>
        {r.time != null && <li><ClockIcon size={15} />{fmtMinutes(r.time)}</li>}
        <li><UsersIcon size={15} />{r.pax} მგზ.</li>
        {price != null && <li className="ttx-price">{price} ₾</li>}
      </ul>
      <OfferState request={r} onChange={onChange} />
      {canOffer(r) &&
        (offering ? (
          <OfferForm request={r} vehicles={vehicles} currency={currency} onDone={onChange} />
        ) : (
          <button type="button" className="admin-btn-ghost ttx-offer-btn" onClick={() => setOffering(true)}>
            ოფერის მომზადება
          </button>
        ))}
    </div>
  );
}

function MatchCard({ match: m, vehicles, currency, onChange }) {
  const kind = KINDS[m.kind];
  const both = hasOffer(m.first) && hasOffer(m.second);
  const seats = (m.first.pax || 0) + (m.second.pax || 0);
  const link =
    m.kind === "roundtrip" || m.kind === "chain"
      ? `${gapText(m.gapMs)} შუალედი · ${Math.round(m.emptyKm)} კმ ცარიელი`
      : `${gapText(m.gapMs)} სხვაობა${m.kind === "together" ? ` · ჯამში ${seats} მგზავრი` : ""}`;

  return (
    <article className={`ttx-card is-${m.kind}`}>
      <header className="ttx-card-head">
        <span className={`ttx-kind is-${m.kind}`}>{kind.label}</span>
        {m.first.from_country !== m.first.to_country && (
          <span className="gtx-tag is-blue">{countryLabel(m.first.from_country)} → {countryLabel(m.first.to_country)}</span>
        )}
        {m.duplicate && <span className="gtx-tag is-amber">შესაძლოა ერთი და იგივე მგზავრია (ორჯერ განათავსა)</span>}
        {both && <span className="gtx-tag is-green">ორივეზე ოფერი გაგზავნილია</span>}
        <span className="ttx-income">
          ჯამი ≈ <b>{m.income} ₾</b>
        </span>
      </header>

      <div className="ttx-legs">
        <Leg label="1" request={m.first} vehicles={vehicles} currency={currency} onChange={onChange} />
        <div className="ttx-link" aria-hidden="true">
          <span className="ttx-link-arrow">→</span>
          <span className="ttx-link-text">{link}</span>
        </div>
        <Leg label="2" request={m.second} vehicles={vehicles} currency={currency} onChange={onChange} />
      </div>
      <p className="ttx-hint">{kind.hint}</p>
    </article>
  );
}

export default function TourTransfersManager() {
  const { data, error, reload } = useGetTransferData();
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");

  const settings = data?.settings || {};
  const vehicles = settings.vehicles || [];
  const currency = settings.currency || "GEL";
  const matches = useMemo(() => findMatches(data?.requests || []), [data]);

  const counts = useMemo(() => {
    const c = { all: matches.length };
    for (const key of Object.keys(KINDS)) c[key] = matches.filter((m) => m.kind === key).length;
    return c;
  }, [matches]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (kind !== "all" && m.kind !== kind) return false;
      if (!q) return true;
      return [m.first, m.second].some((r) =>
        `${r.id} ${r.from} ${r.to} ${r.from_ka} ${r.to_ka}`.toLowerCase().includes(q)
      );
    });
  }, [matches, kind, search]);

  const cards = [
    { key: "all", label: "ყველა", tone: "all" },
    ...Object.entries(KINDS).map(([key, k]) => ({ key, label: k.label, tone: k.tone })),
  ];

  return (
    <div className="gtx-wrap">
      <SyncPanel settings={settings} showKey={false} />

      <section className="ttx-intro">
        <b>როგორ მუშაობს</b>
        <p>
          ყველა ღია შეკვეთას ერთმანეთს ვადარებ და ვპოულობ წყვილებს, რომლებიც ერთ მანქანას შეუძლია შეასრულოს:
          მაგალითად, 5 ნოემბერს 01:00-ზე თბილისი → ერევანი და 4–5 ნოემბერს სხვა მგზავრი, რომელსაც საქართველოდან
          სომხეთში სჭირდება წასვლა, ან ერევნიდან უკან დაბრუნება. ასე მანქანა ცარიელი აღარ ბრუნდება.
        </p>
      </section>

      <div className="bk-status-row" role="group" aria-label="დამთხვევის ტიპი">
        {cards.map((c) => (
          <button
            key={c.key}
            type="button"
            className={`bk-status is-${c.tone}${kind === c.key ? " is-active" : ""}`}
            aria-pressed={kind === c.key}
            onClick={() => setKind(c.key)}
          >
            <span className="bk-status-label">{c.label}</span>
            <strong>{counts[c.key] || 0}</strong>
          </button>
        ))}
      </div>

      <div className="gtx-toolbar">
        <label className="gtx-search">
          <SearchIcon size={16} />
          <input placeholder="ძებნა: შეკვეთის #, ერევანი, Batumi…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      {error && <p className="gtx-alert">{error}</p>}
      {!data && !error && <div className="gtx-empty">იტვირთება…</div>}
      {data && !shown.length && (
        <div className="gtx-empty">
          <RouteIcon size={28} />
          <b>{matches.length ? "ამ ფილტრით დამთხვევა არ არის" : "ჯერ დამთხვევა არ მოიძებნა"}</b>
          <span>
            {matches.length
              ? "სცადე სხვა ტიპი ან ძებნა."
              : "ახალი შეკვეთების შემოსვლისას სია თავისით განახლდება. ადგილების კოორდინატები შემდეგ სინქრონიზაციაზე (3–4 წთ) ჩამოვა."}
          </span>
        </div>
      )}

      <div className="gtx-list">
        {shown.map((m) => (
          <MatchCard key={`${m.kind}-${m.first.id}-${m.second.id}`} match={m} vehicles={vehicles} currency={currency} onChange={reload} />
        ))}
      </div>
    </div>
  );
}
