"use client";

import React, { useMemo, useState } from "react";
import { ClockIcon, RouteIcon, SearchIcon, UsersIcon } from "../components/Icons";
import {
  CAR_CLASSES,
  OfferForm,
  OfferState,
  canOffer,
  countryLabel,
  findChains,
  findCorridors,
  fleetFor,
  fmtMinutes,
  fromKa,
  hasOffer,
  rideDate,
  toKa,
  typeLabel,
  useGetTransferData,
  whenLabel,
} from "./gettransferShared";
import { SyncPanel } from "./GetTransferManager";

// ტურტრანსფერები: GetTransfer requests one car can drive back to back
// between towns (Batumi → Kutaisi → Tbilisi …), round trips, and long
// rides in the same direction — so a long drive does not come back empty.

const KINDS = {
  chain: { label: "გადაბმა", hint: "ყოველი შემდეგი შეკვეთა იწყება წინას ჩასვლის ადგილიდან 0–25 კმ-ში (საზღვარგარეთ გასვლის შემდეგ 0–100 კმ-ში), იმავე ან მომდევნო დღეს (ჩასვლიდან მინ. 30 წთ-ში)." },
  roundtrip: { label: "წრიული", hint: "გადაბმა, რომელიც მანქანას საწყის ქალაქში აბრუნებს." },
  corridor: { label: "ერთი მიმართულება", hint: "ორი გრძელი შეკვეთა ერთი მიმართულებით 36 საათის ფარგლებში — ერთი მეორის მიყოლებით, ან ერთად, თუ მგზავრები თანხმდებიან." },
};

function gapText(ms) {
  const min = Math.round(Math.abs(ms) / 60000);
  if (min < 60) return `${min} წთ`;
  const h = Math.floor(min / 60);
  if (h >= 24) return `${Math.floor(h / 24)} დღე ${h % 24} სთ`;
  return `${h} სთ${min % 60 ? ` ${min % 60} წთ` : ""}`;
}

const money = (v) => (v == null ? "—" : `${Math.round(v)} ₾`);

function PriceFields({ price }) {
  return (
    <dl className="ttx-prices">
      <div className="is-rec">
        <dt>რეკომენდებული</dt>
        <dd>{money(price.rec)}</dd>
      </div>
      <div>
        <dt>მინ.</dt>
        <dd>{money(price.low)}</dd>
      </div>
      <div>
        <dt>მაქს.</dt>
        <dd>{money(price.high)}</dd>
      </div>
      <div className={price.max != null ? "is-limit" : ""}>
        <dt>ზღვარი</dt>
        <dd>{price.max != null ? `≤ ${money(price.max)}` : "—"}</dd>
      </div>
    </dl>
  );
}

function Ride({ step, ride, price, vehicles, currency, onChange, preferVehicleId }) {
  const r = ride.request;
  const date = rideDate(r.date_to_local);
  const [offering, setOffering] = useState(false);
  return (
    <li className="ttx-ride">
      <span className="ttx-step">{step}</span>
      <div className="ttx-ride-body">
        <div className="ttx-ride-top">
          <div className="ttx-field">
            <span>თარიღი</span>
            <b>{date ? `${date.day} ${date.month}, ${date.time}` : "—"}</b>
            {date && <small>{whenLabel(date.inDays)} · {date.weekday}</small>}
          </div>
          <div className="ttx-field ttx-field--route">
            <span>მარშრუტი</span>
            <ol className="gtx-route">
              <li title={r.from}><span className="gtx-route-dot is-a">A</span><span>{fromKa(r)}</span></li>
              <li title={r.to}><span className="gtx-route-dot is-b">B</span><span>{toKa(r)}</span></li>
            </ol>
          </div>
          <a className="gtx-id" href={`https://gettransfer.com/en/carrier/#/cabinet/requests/${r.id}/info`} target="_blank" rel="noreferrer">
            #{r.id} ↗
          </a>
        </div>

        <div className="ttx-ride-mid">
          <ul className="gtx-facts">
            <li><RouteIcon size={15} />{r.distance} კმ</li>
            {r.time != null && <li><ClockIcon size={15} />{fmtMinutes(r.time)}</li>}
            <li><UsersIcon size={15} />{r.pax} მგზ.</li>
            {price.type && <li>{typeLabel(price.type)}</li>}
            {ride.duplicates.length > 0 && (
              <li className="is-warn" title={ride.duplicates.map((d) => `#${d.id}`).join(", ")}>
                + {ride.duplicates.length} დუბლიკატი
              </li>
            )}
          </ul>
          <PriceFields price={price} />
        </div>

        <OfferState request={r} onChange={onChange} />
        {canOffer(r) &&
          (offering ? (
            <OfferForm request={r} vehicles={vehicles} currency={currency} onDone={onChange} preferVehicleId={preferVehicleId} />
          ) : (
            <button type="button" className="admin-btn-ghost ttx-offer-btn" onClick={() => setOffering(true)}>
              ოფერის მომზადება
            </button>
          ))}
      </div>
    </li>
  );
}

function Link({ link }) {
  return (
    <li className="ttx-link">
      <span className="ttx-link-line" aria-hidden="true" />
      <span className="ttx-link-text">
        {link.parallel ? (
          <>{gapText(link.gapMs)} სხვაობა გასვლებს შორის</>
        ) : (
          <>
            <b>{gapText(link.gapMs)}</b> ლოდინი · <b>{Math.round(link.emptyKm)} კმ</b> ცარიელი გზა შემდეგ მგზავრამდე
            {link.abroad && <> · საზღვარგარეთ (≤100 კმ)</>}
          </>
        )}
      </span>
    </li>
  );
}

const EXAMPLE = Object.fromEntries(CAR_CLASSES.map((c) => [c.type, c.example]));
const MAX_CAR_PICKS = 4;

// Recommended cars for the whole trip: own cars that fit every ride, and
// the car classes (up to 4) one car of which can drive all of it.
function CarPicks({ options, chosen, onChoose, fleet, maxPax }) {
  return (
    <div className="ttx-cars">
      <span className="ttx-cars-label">ერთი მანქანა მთელ გზაზე · მაქს. {maxPax} მგზ.</span>
      <div className="ttx-cars-list" role="group" aria-label="რეკომენდებული მანქანა">
        {options.slice(0, MAX_CAR_PICKS).map((o, i) => (
          <button
            key={o.type}
            type="button"
            className={`ttx-car${o.type === chosen ? " is-active" : ""}`}
            aria-pressed={o.type === chosen}
            onClick={() => onChoose(o.type)}
          >
            <b>
              {typeLabel(o.type)}
              {i === 0 && <em>რეკომენდებული</em>}
            </b>
            <small>{EXAMPLE[o.type]} · {o.seats} ადგ.</small>
            <span>{o.priced ? `${money(o.rec)}${o.partial ? " + ?" : ""}` : "ფასი არ არის"}</span>
          </button>
        ))}
      </div>
      {fleet.length > 0 ? (
        <p className="ttx-cars-fleet">
          შენი მანქანები: {fleet.map((v) => `${v.name}${v.plate ? ` (${v.plate})` : ""}`).join(", ")}
        </p>
      ) : (
        <p className="ttx-cars-fleet is-none">შენს ავტოპარკში მთელ გზაზე შესაფერისი მანქანა არ არის.</p>
      )}
    </div>
  );
}

function TripCard({ trip, vehicles, currency, onChange }) {
  const kind = KINDS[trip.kind];
  const [carType, setCarType] = useState(trip.carType);
  const option = trip.carOptions.find((o) => o.type === carType) || trip.carOptions[0];
  const prices = option?.priced ? option.prices : trip.rides.map((x) => x.price);
  const t = option?.priced ? { ...trip.totals, rec: option.rec, low: option.low, high: option.high, partial: option.partial } : trip.totals;
  const fleet = fleetFor(trip, vehicles);
  // The own car the chain is offered with: the chosen class first.
  const car = fleet.find((v) => v.type === carType) || fleet[0];
  const maxPax = Math.max(...trip.rides.map((x) => x.request.pax || 1));
  const offered = trip.rides.filter((x) => hasOffer(x.request)).length;
  const first = trip.rides[0].request;
  const abroad = trip.rides.some((x) => x.request.from_country !== x.request.to_country);
  const start = rideDate(first.date_to_local);

  return (
    <article className={`ttx-card is-${trip.kind}`}>
      <header className="ttx-card-head">
        <div className="ttx-card-title">
          <span className={`ttx-kind is-${trip.kind}`}>
            {trip.kind === "corridor" ? kind.label : `${kind.label} · ${trip.rides.length} შეკვეთა`}
          </span>
          {abroad && first.from_country && (
            <span className="gtx-tag is-blue">
              {[...new Set(trip.rides.flatMap((x) => [x.request.from_country, x.request.to_country]))].map(countryLabel).join(" · ")}
            </span>
          )}
          {trip.passesHome && <span className="gtx-tag is-green">გზაში საწყის ქალაქში ბრუნდება</span>}
          {offered > 0 && <span className="gtx-tag is-green">ოფერი: {offered}/{trip.rides.length}</span>}
        </div>
        <p className="ttx-towns">
          {trip.towns.map((town, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="ttx-arrow">→</span>}
              <span>{town}</span>
            </React.Fragment>
          ))}
        </p>
      </header>

      <CarPicks options={trip.carOptions} chosen={carType} onChoose={setCarType} fleet={fleet} maxPax={maxPax} />

      <dl className="ttx-totals">
        <div className="is-rec">
          <dt>რეკომენდებული ჯამი</dt>
          <dd>
            {money(t.rec)}
            {t.partial && <small title="ერთ-ერთ შეკვეთას GetTransfer-მა ფასი არ მისცა"> + ?</small>}
          </dd>
        </div>
        <div>
          <dt>მინ. – მაქს.</dt>
          <dd>{t.low != null ? `${money(t.low)} – ${money(t.high)}` : "—"}{t.partial && t.low != null && <small> + ?</small>}</dd>
        </div>
        <div>
          <dt>გარბენი</dt>
          <dd>
            {t.km} კმ{t.emptyKm != null && <small> + {Math.round(t.emptyKm)} ცარიელი</small>}
          </dd>
        </div>
        <div>
          <dt>დრო</dt>
          <dd>
            {start ? `${start.day} ${start.month}, ${start.time}` : "—"}
            <small> · {gapText(t.endMs - t.startMs)}</small>
          </dd>
        </div>
      </dl>

      <ol className="ttx-rides">
        {trip.rides.map((ride, i) => (
          <React.Fragment key={ride.request.id}>
            {i > 0 && <Link link={trip.links[i - 1]} />}
            <Ride
              step={i + 1}
              ride={ride}
              price={prices[i]}
              vehicles={vehicles}
              currency={currency}
              onChange={onChange}
              preferVehicleId={car?.id}
            />
          </React.Fragment>
        ))}
      </ol>

      <p className="ttx-hint">{kind.hint}</p>
    </article>
  );
}

export default function TourTransfersManager() {
  const { data, error, reload } = useGetTransferData();
  const [kind, setKind] = useState("chains");
  const [search, setSearch] = useState("");

  const settings = data?.settings || {};
  const vehicles = settings.vehicles || [];
  const currency = settings.currency || "GEL";

  const chains = useMemo(() => findChains(data?.requests || []), [data]);
  const corridors = useMemo(() => findCorridors(data?.requests || []), [data]);

  const groups = {
    chains: { label: "ყველა გადაბმა", items: chains, tone: "all" },
    long: { label: "3+ შეკვეთა", items: chains.filter((c) => c.rides.length >= 3), tone: "confirmed" },
    roundtrip: { label: "წრიული", items: chains.filter((c) => c.kind === "roundtrip"), tone: "completed" },
    corridor: { label: "ერთი მიმართულება", items: corridors, tone: "pending" },
  };

  const q = search.trim().toLowerCase();
  const shown = groups[kind].items.filter(
    (trip) =>
      !q ||
      trip.towns.join(" ").toLowerCase().includes(q) ||
      trip.rides.some(({ request: r }) => `${r.id} ${r.from} ${r.to} ${r.from_ka} ${r.to_ka}`.toLowerCase().includes(q))
  );

  return (
    <div className="gtx-wrap">
      <SyncPanel settings={settings} showKey={false} />

      <section className="ttx-intro">
        <b>როგორ მუშაობს</b>
        <p>
          ვიღებ ქალაქთაშორის შეკვეთებს და ვაბამ ერთმანეთს: თუ X ადგილას Y დღეს ჩადიხარ, ვეძებ გასვლას ჩასვლის
          წერტილიდან 0–25 კმ-ში (თუ საქართველოდან გავედით, მაგ. სომხეთში ან თურქეთში — 0–100 კმ-ში) იმავე Y დღეს ან Y+1 დღეს; მერე იმ შეკვეთის ბოლო წერტილიდან ისევ იგივე წესით და ა.შ.
          — ერთ ჯაჭვში შეიძლება 4–5 და მეტი (მაქს. 8) შეკვეთა გადაებას.
          მთელ ჯაჭვს ერთი მანქანა ასრულებს: ყველა შეკვეთა უნდა ეთანხმებოდეს ერთსა და იმავე კლასს და ყველა მგზავრი უნდა ეტეოდეს
          (მაგ. Vito-ს შეკვეთა 15-კაციან Sprinter-ის შეკვეთას არ გადაებმება). ბარათზე ჩანს 3–4 შესაფერისი მანქანა — აირჩიე და ფასები მის მიხედვით გადაითვლება.
          ქალაქის შიგნით გადაადგილება (მაგ. სასტუმრო → აეროპორტი) და ერთი მგზავრის ორჯერ განთავსებული შეკვეთა გადაბმაში არ შედის.
        </p>
      </section>

      <div className="bk-status-row" role="group" aria-label="ტიპი">
        {Object.entries(groups).map(([key, g]) => (
          <button
            key={key}
            type="button"
            className={`bk-status is-${g.tone}${kind === key ? " is-active" : ""}`}
            aria-pressed={kind === key}
            onClick={() => setKind(key)}
          >
            <span className="bk-status-label">{g.label}</span>
            <strong>{g.items.length}</strong>
          </button>
        ))}
      </div>

      <div className="gtx-toolbar">
        <label className="gtx-search">
          <SearchIcon size={16} />
          <input placeholder="ძებნა: ქუთაისი, ერევანი, შეკვეთის #…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      {error && <p className="gtx-alert">{error}</p>}
      {!data && !error && <div className="gtx-empty">იტვირთება…</div>}
      {data && !shown.length && (
        <div className="gtx-empty">
          <RouteIcon size={28} />
          <b>{groups[kind].items.length ? "ძებნით ვერაფერი მოიძებნა" : "ახლა გადაბმა არ მოიძებნა"}</b>
          <span>ახალი შეკვეთების შემოსვლისას სია თავისით განახლდება.</span>
        </div>
      )}

      <div className="gtx-list">
        {shown.map((trip) => (
          <TripCard
            key={`${trip.kind}-${trip.rides.map((x) => x.request.id).join("-")}`}
            trip={trip}
            vehicles={vehicles}
            currency={currency}
            onChange={reload}
          />
        ))}
      </div>
    </div>
  );
}
