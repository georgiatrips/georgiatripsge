"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  subscribeToLiveSessions,
  subscribeToRecentEvents,
  getNationalityAndCitizenship,
  getDemographicProfile,
  getVisitorInterests,
} from "../lib/analytics";
import { db } from "../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// The admin reads the latest documents only (see subscribeToLiveSessions /
// subscribeToRecentEvents in lib/analytics.js), so every number here is
// "of the last 200 visits" or "of the last 100 actions" — the UI says so.
const SESSION_WINDOW = 200;
const EVENT_WINDOW = 100;
const LIVE_THRESHOLD_MS = 4 * 60 * 1000;

// Every tracked event belongs to one category, so the action feed and the
// funnel read the same way.
const EVENT_INFO = {
  view_tour_detail: { category: "view", label: "ტურის გვერდი ნახა" },
  view_tour_click: { category: "view", label: "ტურზე დააჭირა" },
  click_book_button: { category: "start", label: "დაჯავშნის ღილაკი" },
  begin_checkout: { category: "start", label: "ჯავშნის ფორმა გახსნა" },
  book_tour_submit: { category: "start", label: "ჯავშანი გაგზავნა" },
  book_tour_success: { category: "lead", label: "ტურის ჯავშანი მიღებულია" },
  book_transfer_success: { category: "lead", label: "ტრანსფერის ჯავშანი მიღებულია" },
  plan_trip_request: { category: "lead", label: "მოგზაურობის დაგეგმვის მოთხოვნა" },
  click_whatsapp: { category: "contact", label: "WhatsApp-ზე დაწერა" },
  click_call: { category: "contact", label: "დარეკვა" },
  hero_search: { category: "search", label: "ტურების ძებნა" },
  book_tour_failed: { category: "error", label: "ჯავშანი ვერ გაიგზავნა" },
};

const CATEGORIES = [
  { key: "view", label: "ნახვა" },
  { key: "start", label: "ჯავშნის დაწყება" },
  { key: "lead", label: "მოთხოვნა" },
  { key: "contact", label: "კონტაქტი" },
  { key: "search", label: "ძებნა" },
  { key: "error", label: "შეცდომა" },
];

// Profile helpers in lib/analytics.js decorate their text with emoji; the
// admin shows it plain.
const plain = (text) => String(text || "").replace(/\p{Extended_Pictographic}️?\s*/gu, "").trim();

const eventInfo = (name) => EVENT_INFO[name] || { category: "other", label: name || "მოქმედება" };

function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} წმ`;
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  if (mins < 60) return remSec ? `${mins} წთ ${remSec} წმ` : `${mins} წთ`;
  const hours = Math.floor(mins / 60);
  return `${hours} სთ ${mins % 60} წთ`;
}

function formatRelativeTime(millis, now) {
  if (!millis) return "—";
  const diffSec = Math.floor((now - millis) / 1000);
  if (diffSec < 45) return "ახლახანს";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${Math.max(1, diffMin)} წთ წინ`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} სთ წინ`;
  return `${Math.floor(diffHour / 24)} დღის წინ`;
}

// Counts values and returns the biggest first: [{ label, value }].
function rank(items, limit = 6) {
  const map = new Map();
  items.forEach((item) => {
    if (!item) return;
    map.set(item, (map.get(item) || 0) + 1);
  });
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// A ranked list with one thin bar per row. Each value is written beside its
// label, so nothing depends on hovering or on the bar colour.
function BarList({ rows, total, emptyText = "ჯერ მონაცემი არ არის" }) {
  if (!rows.length) return <p className="an-empty">{emptyText}</p>;
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ol className="an-bars">
      {rows.map((row) => {
        const share = total ? Math.round((row.value / total) * 100) : null;
        return (
          <li key={row.label} title={`${row.label}: ${row.value}${share !== null ? ` (${share}%)` : ""}`}>
            <span className="an-bar-label">{row.label}</span>
            <span className="an-bar-value">
              {row.value}
              {share !== null && <small>{share}%</small>}
            </span>
            <span className="an-bar-track" aria-hidden="true">
              <span className="an-bar-fill" style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }} />
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StatTile({ label, value, note, live = false }) {
  return (
    <div className="an-stat">
      <span className="an-stat-label">
        {live && <span className="an-live-dot" aria-hidden="true" />}
        {label}
      </span>
      <strong className="an-stat-value">{value}</strong>
      {note && <span className="an-stat-note">{note}</span>}
    </div>
  );
}

function Card({ title, note, children, wide = false }) {
  return (
    <section className={`an-card${wide ? " an-card--wide" : ""}`}>
      <header className="an-card-head">
        <h3>{title}</h3>
        {note && <p>{note}</p>}
      </header>
      {children}
    </section>
  );
}

function Detail({ label, children }) {
  return (
    <div className="an-detail">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View: pure rendering from sessions + events.
// ---------------------------------------------------------------------------
export function AnalyticsView({ sessions = [], events = [], loading = false, onClearHistory, clearing = false }) {
  const [view, setView] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [eventFilter, setEventFilter] = useState("all");
  const [now, setNow] = useState(() => Date.now());

  // "Online" and "x min ago" stay current without a reload.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const todayStart = new Date(now).setHours(0, 0, 0, 0);
  const isLive = (millis) => now - (millis || 0) <= LIVE_THRESHOLD_MS;

  // Visitors: sessions grouped by IP, most recent first.
  const visitors = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      const ip = s.ip || "უცნობი IP";
      if (!map.has(ip)) {
        map.set(ip, {
          ip,
          country: s.country || "",
          city: s.city || "",
          flag: s.flag || "",
          countryCode: s.countryCode || "",
          sessions: [],
          totalDuration: 0,
          latestActive: 0,
        });
      }
      const group = map.get(ip);
      group.sessions.push(s);
      group.totalDuration += s.totalDurationSeconds || 0;
      group.latestActive = Math.max(group.latestActive, s.lastActiveMillis || 0);
    });

    return [...map.values()]
      .map((group) => {
        group.sessions.sort((a, b) => (b.lastActiveMillis || 0) - (a.lastActiveMillis || 0));
        const top = group.sessions[0] || {};
        const userEvents = events.filter((e) => e.sessionId === top.sessionId || e.visitorId === top.visitorId);
        return {
          ...group,
          online: isLive(group.latestActive),
          top,
          nationality: getNationalityAndCitizenship(
            { country: group.country, countryCode: group.countryCode, flag: group.flag },
            top
          ),
          demographics: getDemographicProfile(top, group.sessions, userEvents),
          interests: getVisitorInterests(group.sessions, userEvents),
        };
      })
      .sort((a, b) => b.latestActive - a.latestActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, events, now]);

  // ---- Overview numbers
  const liveCount = visitors.filter((v) => v.online).length;
  const todayVisits = sessions.filter((s) => (s.lastActiveMillis || 0) >= todayStart).length;

  const uniqueSessions = (names) =>
    new Set(events.filter((e) => names.includes(e.eventName)).map((e) => e.sessionId || e.visitorId)).size;
  const countEvents = (names) => events.filter((e) => names.includes(e.eventName)).length;

  const leadEvents = ["book_tour_success", "book_transfer_success", "plan_trip_request"];
  const funnel = [
    { label: "ნახეს ტური", value: uniqueSessions(["view_tour_detail", "view_tour_click"]) },
    { label: "დაიწყეს ჯავშანი", value: uniqueSessions(["click_book_button", "begin_checkout", "book_tour_submit"]) },
    { label: "გაგზავნეს მოთხოვნა", value: uniqueSessions(leadEvents) },
  ];
  const contacts = [
    { label: "WhatsApp", value: countEvents(["click_whatsapp"]) },
    { label: "დარეკვა", value: countEvents(["click_call"]) },
    { label: "დაგეგმვის მოთხოვნა", value: countEvents(["plan_trip_request"]) },
    { label: "ტურების ძებნა", value: countEvents(["hero_search"]) },
  ].filter((row) => row.value > 0);

  const sources = rank(sessions.map((s) => s.source || "პირდაპირი"));
  const countries = rank(visitors.map((v) => [v.flag, v.country || "უცნობი"].filter(Boolean).join(" ")));
  const deviceTypes = rank(
    sessions.map((s) => {
      const type = (s.deviceType || "").toLowerCase();
      if (type === "mobile") return "ტელეფონი";
      if (type === "tablet") return "პლანშეტი";
      return "კომპიუტერი";
    }),
    3
  );
  const browsers = rank(sessions.map((s) => s.browser).filter(Boolean), 5);
  const pages = rank(sessions.map((s) => s.currentPageTitle || s.currentPage).filter(Boolean), 8);

  // ---- Visitors list
  const nationalities = useMemo(
    () => [...new Set(visitors.map((v) => v.nationality?.demonym).filter(Boolean))],
    [visitors]
  );

  const shownVisitors = visitors.filter((v) => {
    if (timeFilter === "live" && !v.online) return false;
    if (timeFilter === "today" && v.latestActive < todayStart) return false;
    if (nationalityFilter !== "all" && v.nationality?.demonym !== nationalityFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return [
      v.ip,
      v.country,
      v.city,
      v.nationality?.citizen,
      v.nationality?.demonym,
      ...v.sessions.flatMap((s) => [s.deviceModel, s.os, s.browser, s.source, s.currentPage, s.currentPageTitle]),
      ...v.interests.topTours.map((tour) => tour.name),
    ].some((field) => String(field || "").toLowerCase().includes(q));
  });

  // ---- Action feed
  const categoryCounts = CATEGORIES.map((c) => ({
    ...c,
    count: events.filter((e) => eventInfo(e.eventName).category === c.key).length,
  })).filter((c) => c.count > 0);

  const shownEvents = [...events]
    .sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0))
    .filter((e) => eventFilter === "all" || eventInfo(e.eventName).category === eventFilter);

  const views = [
    { key: "overview", label: "მიმოხილვა" },
    { key: "visitors", label: "ვიზიტორები", count: visitors.length },
    { key: "events", label: "მოქმედებები", count: events.length },
  ];

  return (
    <div className="an">
      <div className="an-toolbar">
        <div className="an-views" role="tablist" aria-label="ანალიტიკის განყოფილებები">
          {views.map((v) => (
            <button
              key={v.key}
              type="button"
              role="tab"
              aria-selected={view === v.key}
              className={`an-view${view === v.key ? " is-active" : ""}`}
              onClick={() => setView(v.key)}
            >
              {v.label}
              {v.count !== undefined && <span className="adm-badge">{v.count}</span>}
            </button>
          ))}
        </div>
        <p className="an-scope">
          ბოლო {SESSION_WINDOW} ვიზიტი და ბოლო {EVENT_WINDOW} მოქმედება · განახლდება ავტომატურად
        </p>
      </div>

      {loading ? (
        <p className="an-empty an-empty--block">მონაცემები იტვირთება...</p>
      ) : view === "overview" ? (
        <div className="an-overview">
          <div className="an-stats">
            <StatTile label="ახლა საიტზე" value={liveCount} note="ბოლო 4 წუთში აქტიური" live />
            <StatTile label="დღევანდელი ვიზიტები" value={todayVisits} />
            <StatTile label="ვიზიტორები" value={visitors.length} note="უნიკალური IP" />
            <StatTile label="მოთხოვნები" value={countEvents(leadEvents)} note="ჯავშნები და დაგეგმვა" />
          </div>

          <div className="an-grid">
            <Card title="ჯავშნის ეტაპები" note="რამდენმა ვიზიტმა მიაღწია თითოეულ ეტაპს">
              <BarList rows={funnel} total={funnel[0].value || null} />
            </Card>
            <Card title="კონტაქტი" note="WhatsApp, ზარი და მოთხოვნები">
              <BarList rows={contacts} emptyText="ჯერ კონტაქტი არ ყოფილა" />
            </Card>
            <Card title="საიდან მოდიან" note="ვიზიტის წყარო">
              <BarList rows={sources} total={sessions.length} />
            </Card>
            <Card title="ქვეყნები" note="ვიზიტორები ქვეყნების მიხედვით">
              <BarList rows={countries} total={visitors.length} />
            </Card>
            <Card title="მოწყობილობები">
              <BarList rows={deviceTypes} total={sessions.length} />
              {browsers.length > 0 && (
                <>
                  <p className="an-subhead">ბრაუზერები</p>
                  <BarList rows={browsers} total={sessions.length} />
                </>
              )}
            </Card>
            <Card title="პოპულარული გვერდები" note="ბოლოს ნანახი გვერდი თითოეულ ვიზიტში">
              <BarList rows={pages} total={sessions.length} />
            </Card>
          </div>
        </div>
      ) : view === "visitors" ? (
        <div className="an-visitors">
          <div className="an-filters">
            <div className="admin-segment an-segment">
              {[
                ["all", `ყველა (${visitors.length})`],
                ["live", `ონლაინ (${liveCount})`],
                ["today", `დღეს (${visitors.filter((v) => v.latestActive >= todayStart).length})`],
              ].map(([key, label]) => (
                <button key={key} type="button" className={timeFilter === key ? "is-active" : ""} onClick={() => setTimeFilter(key)}>
                  {label}
                </button>
              ))}
            </div>
            {nationalities.length > 0 && (
              <select className="adm-input an-select" value={nationalityFilter} onChange={(e) => setNationalityFilter(e.target.value)}>
                <option value="all">ყველა ეროვნება</option>
                {nationalities.map((nat) => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>
            )}
            <input
              type="search"
              className="adm-input an-search"
              placeholder="ძებნა: IP, ქვეყანა, მოწყობილობა, გვერდი..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {shownVisitors.length === 0 ? (
            <p className="an-empty an-empty--block">ვიზიტორები არ მოიძებნა</p>
          ) : (
            <ul className="an-visitor-list">
              {shownVisitors.map((v) => {
                const open = Boolean(expanded[v.ip]);
                const nat = v.nationality || {};
                const topTour = v.interests.topTours[0];
                return (
                  <li key={v.ip} className={`an-visitor${open ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="an-visitor-row"
                      aria-expanded={open}
                      onClick={() => setExpanded((prev) => ({ ...prev, [v.ip]: !prev[v.ip] }))}
                    >
                      <span className={`an-status${v.online ? " is-online" : ""}`}>
                        {v.online ? "ონლაინ" : formatRelativeTime(v.latestActive, now)}
                      </span>
                      <span className="an-visitor-who">
                        <strong>{[nat.flag || v.flag, nat.citizen || v.country || "უცნობი"].filter(Boolean).join(" ")}</strong>
                        <small>{[v.city, v.ip].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span className="an-visitor-device">
                        {v.top.deviceModel || v.top.os || "მოწყობილობა"}
                        {v.top.browser && <small>{v.top.browser}</small>}
                      </span>
                      <span className="an-visitor-interest">
                        {topTour ? `${plain(topTour.name)} (${topTour.count}×)` : plain(v.interests.intentLevel)}
                      </span>
                      <span className="an-visitor-time">
                        {formatDuration(v.totalDuration)}
                        <small>{v.sessions.length} ვიზიტი</small>
                      </span>
                      <span className="an-chevron" aria-hidden="true">{open ? "−" : "+"}</span>
                    </button>

                    {open && (
                      <div className="an-visitor-body">
                        <dl className="an-details">
                          <div className="an-detail-group">
                            <p>ადგილმდებარეობა</p>
                            <Detail label="მოქალაქეობა">{[nat.flag, nat.citizen].filter(Boolean).join(" ") || "—"}</Detail>
                            <Detail label="ქალაქი">{[v.city, v.country].filter(Boolean).join(", ") || "—"}</Detail>
                            <Detail label="ენა">{v.top.languages || v.top.language || nat.langName || "—"}</Detail>
                            <Detail label="დროის სარტყელი">{v.top.timezone || "—"}</Detail>
                          </div>
                          <div className="an-detail-group">
                            <p>მოწყობილობა</p>
                            <Detail label="მოდელი">{v.top.deviceModel || v.top.os || "—"}</Detail>
                            <Detail label="ეკრანი">{v.top.screenSize || v.top.screenInches || v.top.screen || "—"}</Detail>
                            <Detail label="სისტემა">{[v.top.os, v.top.browser].filter(Boolean).join(" · ") || "—"}</Detail>
                            <Detail label="ინტერნეტი">{v.top.isp || "—"}</Detail>
                          </div>
                          <div className="an-detail-group">
                            <p>ინტერესი</p>
                            <Detail label="სტატუსი">{plain(v.interests.intentLevel) || "—"}</Detail>
                            <Detail label="ნანახი ტურები">
                              {v.interests.topTours.map((tour) => `${plain(tour.name)} (${tour.count}×)`).join(", ") || "—"}
                            </Detail>
                            <Detail label="კატეგორიები">{v.interests.categories.map(plain).join(", ") || "—"}</Detail>
                            <Detail label="წყარო">
                              {[v.top.source || "პირდაპირი", v.top.campaign].filter(Boolean).join(" · ")}
                            </Detail>
                          </div>
                          <div className="an-detail-group">
                            <p>სავარაუდო პროფილი</p>
                            <Detail label="ასაკი">{plain(v.demographics.ageRange) || "—"}</Detail>
                            <Detail label="ტიპი">{plain(v.demographics.persona) || "—"}</Detail>
                            <Detail label="ბიუჯეტი">{plain(v.demographics.purchasingPower) || "—"}</Detail>
                            <small className="an-note">შეფასებაა მოწყობილობისა და ქცევის მიხედვით, არა ზუსტი მონაცემი.</small>
                          </div>
                        </dl>

                        <div className="an-table-wrap">
                          <table className="an-table">
                            <thead>
                              <tr>
                                <th>დრო</th>
                                <th>გვერდი</th>
                                <th>წყარო</th>
                                <th>მოწყობილობა</th>
                                <th>ხანგრძლივობა</th>
                                <th>ბოლო მოქმედება</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.sessions.map((s, index) => (
                                <tr key={s.id || index}>
                                  <td>{isLive(s.lastActiveMillis) ? <span className="an-status is-online">ახლა</span> : formatRelativeTime(s.lastActiveMillis, now)}</td>
                                  <td className="an-td-page">
                                    <a href={s.currentPage || "/"} target="_blank" rel="noreferrer" title={s.currentPage || "/"}>
                                      {s.currentPageTitle || s.currentPage || "/"}
                                    </a>
                                  </td>
                                  <td>{s.source || "პირდაპირი"}</td>
                                  <td>{[s.deviceModel || s.os, s.browser].filter(Boolean).join(" · ") || "—"}</td>
                                  <td>{formatDuration(s.totalDurationSeconds)}</td>
                                  <td>{s.lastAction ? eventInfo(s.lastAction).label : "დათვალიერება"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {onClearHistory && (
            <div className="an-danger">
              <div>
                <strong>ისტორიის გასუფთავება</strong>
                <p>შლის ყველა ვიზიტს და მოქმედებას. გამოიყენეთ მხოლოდ სატესტო მონაცემებისთვის.</p>
              </div>
              <button type="button" className="an-danger-btn" onClick={onClearHistory} disabled={clearing}>
                {clearing ? "იშლება..." : "გასუფთავება"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="an-events">
          <div className="an-chips" role="group" aria-label="მოქმედების კატეგორია">
            <button type="button" className={`an-chip${eventFilter === "all" ? " is-active" : ""}`} onClick={() => setEventFilter("all")}>
              ყველა <span>{events.length}</span>
            </button>
            {categoryCounts.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`an-chip${eventFilter === c.key ? " is-active" : ""}`}
                onClick={() => setEventFilter(c.key)}
              >
                {c.label} <span>{c.count}</span>
              </button>
            ))}
          </div>

          {shownEvents.length === 0 ? (
            <p className="an-empty an-empty--block">მოქმედებები არ არის</p>
          ) : (
            <ol className="an-feed">
              {shownEvents.map((e, index) => {
                const info = eventInfo(e.eventName);
                const category = CATEGORIES.find((c) => c.key === info.category);
                const detail = e.params?.tourTitle || e.params?.label || e.title || e.path || "";
                return (
                  <li key={e.id || index} className="an-feed-item">
                    <span className="an-feed-time">{formatRelativeTime(e.createdAtMillis, now)}</span>
                    <span className={`an-cat an-cat--${info.category}`}>{category ? category.label : "სხვა"}</span>
                    <span className="an-feed-text">
                      <strong>{info.label}</strong>
                      {detail && <small title={e.path || ""}>{detail}</small>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container: live Firestore data for the admin tab.
// ---------------------------------------------------------------------------
export default function AnalyticsManager() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const unsubSessions = subscribeToLiveSessions((items) => {
      setSessions(items || []);
      setLoading(false);
    });
    const unsubEvents = subscribeToRecentEvents((items) => setEvents(items || []));
    return () => {
      unsubSessions();
      unsubEvents();
    };
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm("წაიშალოს ანალიტიკის მთელი ისტორია? ამის დაბრუნება შეუძლებელია.")) return;
    try {
      setClearing(true);
      const sessionSnap = await getDocs(collection(db, "visitor_sessions"));
      await Promise.all(sessionSnap.docs.map((d) => deleteDoc(doc(db, "visitor_sessions", d.id))));
      const eventSnap = await getDocs(collection(db, "analytics_events"));
      await Promise.all(eventSnap.docs.map((d) => deleteDoc(doc(db, "analytics_events", d.id))));
      setSessions([]);
      setEvents([]);
    } catch (err) {
      console.error(err);
      alert("შეცდომა გასუფთავებისას: " + err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <AnalyticsView
      sessions={sessions}
      events={events}
      loading={loading}
      onClearHistory={handleClearHistory}
      clearing={clearing}
    />
  );
}
