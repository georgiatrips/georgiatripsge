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

// წამების გარდაქმნა მარტივ ტექსტად (მაგ. "2 წუთი 15 წამი")
function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} წმ`;
  const mins = Math.floor(s / 60);
  const remSec = s % 60;
  if (mins < 60) return `${mins} წთ ${remSec > 0 ? remSec + " წმ" : ""}`;
  const hours = Math.floor(mins / 60);
  const remMin = mins % 60;
  return `${hours} სთ ${remMin} წთ`;
}

// ბოლო აქტივობის დრო
function formatRelativeTime(millis) {
  if (!millis) return "—";
  const diffSec = Math.floor((Date.now() - millis) / 1000);
  if (diffSec < 45) return "ახლახანს";
  if (diffSec < 60) return `${diffSec} წმ წინ`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} წთ წინ`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} სთ წინ`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} დღის წინ`;
}

export default function AnalyticsManager() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIps, setExpandedIps] = useState({});
  const [clearing, setClearing] = useState(false);

  // რეალურ დროში მოსმენა Firestore-დან
  useEffect(() => {
    const unsubSessions = subscribeToLiveSessions((items) => {
      setSessions(items || []);
      setLoading(false);
    });

    const unsubEvents = subscribeToRecentEvents((evList) => {
      setEvents(evList || []);
    });

    return () => {
      unsubSessions();
      unsubEvents();
    };
  }, []);

  const now = Date.now();
  const LIVE_THRESHOLD_MS = 4 * 60 * 1000; // 4 წუთი
  const TODAY_START_MS = new Date().setHours(0, 0, 0, 0);

  // 1. IP-ით დაჯგუფება და ვიზიტორის დეტალური პროფილის გენერირება
  const groupedByIp = useMemo(() => {
    const map = {};

    sessions.forEach((s) => {
      const ipKey = s.ip || "127.0.0.1";
      if (!map[ipKey]) {
        map[ipKey] = {
          ip: ipKey,
          country: s.country || "Georgia",
          countryCode: s.countryCode || "GE",
          city: s.city || "Batumi",
          region: s.region || "",
          flag: s.flag || "🌐",
          isp: s.isp || "",
          sessions: [],
          totalDuration: 0,
          latestActive: 0,
          hasOnline: false,
          devices: new Set(),
          models: new Set(),
          sources: new Set(),
          actions: new Set(),
        };
      }

      map[ipKey].sessions.push(s);
      map[ipKey].totalDuration += (s.totalDurationSeconds || 0);

      const activeTime = s.lastActiveMillis || 0;
      if (activeTime > map[ipKey].latestActive) {
        map[ipKey].latestActive = activeTime;
      }

      if (now - activeTime <= LIVE_THRESHOLD_MS) {
        map[ipKey].hasOnline = true;
      }

      if (s.deviceModel) {
        map[ipKey].models.add(s.deviceModel);
      } else if (s.deviceType || s.os) {
        map[ipKey].models.add(`${s.deviceType === "Mobile" ? "📱" : "💻"} ${s.os || ""}`.trim());
      }

      if (s.source) map[ipKey].sources.add(s.source);
      if (s.lastAction) map[ipKey].actions.add(s.lastAction);
    });

    // თითოეულ ჯგუფზე ანალიტიკური პროფილის დათვლა
    const list = Object.values(map).map((group) => {
      group.sessions.sort((a, b) => (b.lastActiveMillis || 0) - (a.lastActiveMillis || 0));
      const topSession = group.sessions[0] || {};
      
      // Nationality & Citizenship
      group.nationality = getNationalityAndCitizenship(
        { country: group.country, countryCode: group.countryCode, flag: group.flag },
        topSession
      );

      // Filter events for this visitor
      const userEvents = events.filter((e) => e.sessionId === topSession.sessionId || e.visitorId === topSession.visitorId);

      // Demographic & Age profile
      group.demographics = getDemographicProfile(topSession, group.sessions, userEvents);

      // Interests & Intent profile
      group.interests = getVisitorInterests(group.sessions, userEvents);

      return group;
    });

    // ჯგუფების დალაგება უახლესი აქტივობით
    list.sort((a, b) => b.latestActive - a.latestActive);
    return list;
  }, [sessions, events, now]);

  // უნიკალური ეროვნებები ფილტრისთვის
  const availableNationalities = useMemo(() => {
    const set = new Set();
    groupedByIp.forEach((g) => {
      if (g.nationality?.demonym) set.add(g.nationality.demonym);
    });
    return Array.from(set);
  }, [groupedByIp]);

  // გაფილტვრა
  const filteredGroups = useMemo(() => {
    return groupedByIp.filter((g) => {
      if (timeFilter === "live" && !g.hasOnline) return false;
      if (timeFilter === "today" && g.latestActive < TODAY_START_MS) return false;
      if (nationalityFilter !== "all" && g.nationality?.demonym !== nationalityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          g.ip.toLowerCase().includes(q) ||
          g.country.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q) ||
          g.nationality?.citizen?.toLowerCase().includes(q) ||
          g.nationality?.demonym?.toLowerCase().includes(q) ||
          Array.from(g.models).some((m) => m.toLowerCase().includes(q)) ||
          Array.from(g.sources).some((src) => src.toLowerCase().includes(q)) ||
          g.interests.topTours.some((t) => t.name.toLowerCase().includes(q)) ||
          g.sessions.some(
            (s) =>
              s.currentPage?.toLowerCase().includes(q) ||
              s.currentPageTitle?.toLowerCase().includes(q) ||
              s.deviceModel?.toLowerCase().includes(q) ||
              s.gpu?.toLowerCase().includes(q)
          );
        if (!match) return false;
      }
      return true;
    });
  }, [groupedByIp, timeFilter, nationalityFilter, searchQuery, TODAY_START_MS]);

  // სტატისტიკა
  const liveCount = useMemo(() => {
    return sessions.filter((s) => now - (s.lastActiveMillis || 0) <= LIVE_THRESHOLD_MS).length;
  }, [sessions, now]);

  const todayCount = useMemo(() => {
    return sessions.filter((s) => (s.lastActiveMillis || 0) >= TODAY_START_MS).length;
  }, [sessions, TODAY_START_MS]);

  const topCountriesCount = useMemo(() => {
    const cMap = {};
    groupedByIp.forEach((g) => {
      const label = `${g.flag || "🌐"} ${g.country}`;
      cMap[label] = (cMap[label] || 0) + 1;
    });
    return Object.entries(cMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [groupedByIp]);

  const mobileCount = sessions.filter((s) => s.deviceType?.toLowerCase() === "mobile").length;
  const desktopCount = sessions.filter((s) => s.deviceType?.toLowerCase() !== "mobile").length;

  const waClicks = events.filter((e) => e.eventName === "click_whatsapp").length;
  const callClicks = events.filter((e) => e.eventName === "click_call").length;
  const bookClicks = events.filter((e) => e.eventName === "click_book_button").length;

  const toggleExpand = (ip) => {
    setExpandedIps((prev) => ({ ...prev, [ip]: !prev[ip] }));
  };

  // სატესტო ისტორიის გასუფთავება
  const handleClearHistory = async () => {
    if (!window.confirm("დარწმუნებული ხართ, რომ გსურთ ყველა ძველი ანალიტიკის ისტორიის გასუფთავება?")) {
      return;
    }
    try {
      setClearing(true);
      const snap = await getDocs(collection(db, "visitor_sessions"));
      const deletes = snap.docs.map((d) => deleteDoc(doc(db, "visitor_sessions", d.id)));
      await Promise.all(deletes);

      const evSnap = await getDocs(collection(db, "analytics_events"));
      const evDeletes = evSnap.docs.map((d) => deleteDoc(doc(db, "analytics_events", d.id)));
      await Promise.all(evDeletes);

      setSessions([]);
      setEvents([]);
      alert("ისტორია წარმატებით გასუფთავდა!");
    } catch (err) {
      console.error(err);
      alert("შეცდომა გასუფთავებისას: " + err.message);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="gt-clean-analytics">
      {/* ── 1. მთავარი სათაური ────────────────────────────────── */}
      <div className="gt-clean-header">
        <div>
          <h2>📊 საიტის Live ანალიტიკა & ვიზიტორთა პროფილები</h2>
          <p>
            ზუსტი მოწყობილობის მოდელი (iPhone 15 Pro, Samsung Ultra, Mac), მოქალაქეობა / ეროვნება, ასაკობრივი ჯგუფი და ინტერესები
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div className="gt-clean-live-pill">
            <span className="gt-clean-dot" />
            <strong>{liveCount} ონლაინ</strong>
          </div>
          <button
            type="button"
            className="gt-clear-btn"
            onClick={handleClearHistory}
            disabled={clearing}
            title="სატესტო ისტორიის წაშლა"
          >
            {clearing ? "იშლება..." : "🗑️ ისტორიის გასუფთავება"}
          </button>
        </div>
      </div>

      {/* ── 2. მთავარი 4 ბარათი ────────────────────────────────── */}
      <div className="gt-clean-cards-grid">
        <div className="gt-clean-card card-green">
          <span className="card-lbl">🟢 Live ონლაინ</span>
          <strong className="card-val">{liveCount}</strong>
          <span className="card-desc">ამ წამს საიტზეა ({todayCount} დღეს)</span>
        </div>

        <div className="gt-clean-card card-blue">
          <span className="card-lbl">👥 უნიკალური IP & ქვეყნები</span>
          <strong className="card-val">{groupedByIp.length}</strong>
          <span className="card-desc">
            {topCountriesCount.map(([name, count]) => `${name} (${count})`).join(" • ") || "საქართველო"}
          </span>
        </div>

        <div className="gt-clean-card card-purple">
          <span className="card-lbl">📱 მოწყობილობები</span>
          <strong className="card-val" style={{ fontSize: "1.35rem" }}>
            📱 {mobileCount} / 💻 {desktopCount}
          </strong>
          <span className="card-desc">ზუსტი მოდელების ამომცნობით</span>
        </div>

        <div className="gt-clean-card card-orange">
          <span className="card-lbl">🎯 კონვერსია & ლიდები</span>
          <strong className="card-val" style={{ fontSize: "1.35rem" }}>
            💬 {waClicks} WA / 📞 {callClicks} ზარი
          </strong>
          <span className="card-desc">ჯავშნის კლიკები: {bookClicks}</span>
        </div>
      </div>

      {/* ── 3. ფილტრები & ძებნა ──────────────────────────────── */}
      <div className="gt-clean-filter-bar">
        <div className="gt-clean-tabs">
          <button
            className={`tab-btn ${timeFilter === "all" ? "active" : ""}`}
            onClick={() => setTimeFilter("all")}
          >
            ყველა ({groupedByIp.length})
          </button>
          <button
            className={`tab-btn ${timeFilter === "live" ? "active" : ""}`}
            onClick={() => setTimeFilter("live")}
          >
            🟢 Live ონლაინ ({groupedByIp.filter((g) => g.hasOnline).length})
          </button>
          <button
            className={`tab-btn ${timeFilter === "today" ? "active" : ""}`}
            onClick={() => setTimeFilter("today")}
          >
            📅 დღევანდელი ({groupedByIp.filter((g) => g.latestActive >= TODAY_START_MS).length})
          </button>

          {availableNationalities.length > 0 && (
            <select
              className="tab-btn"
              style={{ padding: "0.55rem 0.8rem", outline: "none" }}
              value={nationalityFilter}
              onChange={(e) => setNationalityFilter(e.target.value)}
            >
              <option value="all">🌍 ყველა ეროვნება</option>
              {availableNationalities.map((nat) => (
                <option key={nat} value={nat}>
                  {nat}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="gt-clean-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="ძებნა მოწყობილობით, ეროვნებით, IP-ით, ტურით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "320px" }}
          />
        </div>
      </div>

      {/* ── 4. IP-ით დაჯგუფებული BOX-ები (აკორდეონი) ─────────── */}
      <div className="gt-ip-groups-wrap">
        {loading ? (
          <div className="gt-empty-box">მონაცემები იტვირთება...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="gt-empty-box">ვიზიტორები არ მოიძებნა</div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedIps[group.ip];
            const topSession = group.sessions[0] || {};
            const nat = group.nationality;
            const demo = group.demographics;
            const interests = group.interests;

            return (
              <div
                key={group.ip}
                className={`gt-ip-box ${group.hasOnline ? "is-online" : ""}`}
              >
                {/* ── BOX HEADER (მთავარი ხაზი 1 IP-ზე) ─────────────── */}
                <div
                  className="gt-ip-box-header"
                  onClick={() => toggleExpand(group.ip)}
                >
                  <div className="gt-ip-box-left">
                    {/* სტატუსი */}
                    {group.hasOnline ? (
                      <span className="badge-online">🟢 ონლაინ</span>
                    ) : (
                      <span className="badge-offline">⚪ {formatRelativeTime(group.latestActive)}</span>
                    )}

                    {/* მოქალაქეობა & ქვეყანა & IP */}
                    <div className="gt-ip-title">
                      <span className="gt-ip-flag">{nat.flag || group.flag || "🌐"}</span>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <strong style={{ color: "#ffffff", fontSize: "0.98rem" }}>
                            {nat.citizen || `${group.country}, ${group.city}`}
                          </strong>
                          {nat.roamingBadge && (
                            <span
                              style={{
                                background: "rgba(234, 179, 8, 0.2)",
                                color: "#facc15",
                                border: "1px solid rgba(234, 179, 8, 0.4)",
                                padding: "0.15rem 0.5rem",
                                borderRadius: "6px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              }}
                            >
                              {nat.roamingBadge}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          📍 {group.city ? `${group.city}, ` : ""}{group.country} • <code className="ip-pill">{group.ip}</code>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="gt-ip-box-mid">
                    {/* ზუსტი დევაისი */}
                    <div
                      style={{
                        background: "rgba(41, 178, 183, 0.12)",
                        border: "1px solid rgba(41, 178, 183, 0.3)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        color: "#38bdf8",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                      title={topSession.gpu ? `GPU: ${topSession.gpu}` : ""}
                    >
                      <span>{Array.from(group.models)[0] || "📱 მოწყობილობა"}</span>
                      {topSession.browser && (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem", fontWeight: 500 }}>
                          ({topSession.browser})
                        </span>
                      )}
                    </div>

                    {/* ასაკობრივი ჯგუფი & პერსონა */}
                    <span className={`age-pill ${demo.ageTag}`}>
                      <strong>🎯 {demo.ageRange}</strong>
                      <small>{demo.persona}</small>
                    </span>

                    {/* რა აინტერესებს / Intent */}
                    <div
                      style={{
                        background: interests.intentTag === "hot" ? "rgba(37, 211, 102, 0.18)" : "rgba(255, 255, 255, 0.06)",
                        border: `1px solid ${interests.intentTag === "hot" ? "rgba(37, 211, 102, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
                        color: interests.intentTag === "hot" ? "#25d366" : "#e2e8f0",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                      }}
                    >
                      {interests.topTours.length > 0 ? (
                        <span>🏔️ {interests.topTours[0].name} ({interests.topTours[0].count}x)</span>
                      ) : (
                        <span>{interests.intentLevel}</span>
                      )}
                    </div>
                  </div>

                  <div className="gt-ip-box-right">
                    {/* დრო & ისტორიის რაოდენობა */}
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "#38bdf8", display: "block", fontSize: "0.95rem" }}>
                        ⏱️ {formatDuration(group.totalDuration)}
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {group.sessions.length} ვიზიტი / გვერდი
                      </span>
                    </div>

                    {/* ღილაკი */}
                    <button
                      type="button"
                      className={`gt-expand-btn ${isExpanded ? "open" : ""}`}
                    >
                      {isExpanded ? "დახურვა ▲" : "სრული პროფილი ▼"}
                    </button>
                  </div>
                </div>

                {/* ── EXPANDED HISTORY (გაშლილი დეტალური დოსიე ამ IP-ზე) ────── */}
                {isExpanded && (
                  <div className="gt-ip-box-history">
                    {/* ── 4-COLUMN VISITOR INTELLIGENCE DOSSIER ── */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                        gap: "0.85rem",
                        marginBottom: "1.25rem",
                        padding: "1rem",
                        background: "rgba(30, 41, 59, 0.5)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "12px",
                      }}
                    >
                      {/* CARD 1: მოქალაქეობა & გეოგრაფია */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>
                          🏛️ მოქალაქეობა & ენა
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                          {nat.flag} {nat.citizen}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                          ეროვნება: <strong>{nat.demonym}</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          სისტემის ენა: {topSession.languages || topSession.language || nat.langName}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          სარტყელი: {topSession.timezone || "უცნობი"} {topSession.isp ? `• ${topSession.isp}` : ""}
                        </span>
                      </div>

                      {/* CARD 2: ზუსტი მოწყობილობა & ეკრანის ზომა */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#a855f7", textTransform: "uppercase" }}>
                          📱 ზუსტი ტელეფონი & ეკრანი
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                          📱 {topSession.deviceModel || topSession.os || "მოწყობილობა"}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#38bdf8", fontWeight: 700 }}>
                          📺 ეკრანის ზომა: <strong>{topSession.screenSize || topSession.screenInches || topSession.screen}</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                          📐 რეზოლუცია: {topSession.screenPhysical || topSession.screen} {topSession.screenViewport ? `(Viewport: ${topSession.screenViewport})` : ""}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          OS & ბრაუზერი: {topSession.os} • {topSession.browser}
                        </span>
                        {topSession.gpu && topSession.gpu !== "Unknown" && (
                          <span style={{ fontSize: "0.75rem", color: "#a855f7" }} title={topSession.gpu}>
                            GPU: {topSession.gpu.substring(0, 40)}
                          </span>
                        )}
                      </div>

                      {/* CARD 3: ასაკი & მყიდველის პერსონა */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#ec4899", textTransform: "uppercase" }}>
                          🎯 ასაკი & მსყიდველუნარიანობა
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                          {demo.ageRange} ({demo.ageConfidence})
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                          პერსონა: <strong>{demo.personaIcon} {demo.persona}</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                          ბიუჯეტი: <strong>{demo.powerIcon} {demo.purchasingPower}</strong>
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          წყარო: {topSession.source || "Direct"} {topSession.campaign ? `(${topSession.campaign})` : ""}
                        </span>
                      </div>

                      {/* CARD 4: რა აინტერესებს & ქცევა */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#22c55e", textTransform: "uppercase" }}>
                          🏔️ რა აინტერესებს & ლიდი
                        </span>
                        <strong style={{ fontSize: "0.95rem", color: interests.hasContacted ? "#22c55e" : "#ffffff" }}>
                          {interests.intentLevel}
                        </strong>
                        <span style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
                          ნანახი ტურები: {interests.topTours.map((t) => `${t.name} (${t.count}x)`).join(", ") || "მთავარი გვერდი"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                          კატეგორიები: {interests.categories.join(", ") || "დათვალიერება"}
                        </span>
                      </div>
                    </div>

                    <div className="history-head">
                      <span>🕒 ამ IP-ის ყველა შემოსვლა და აქტივობა ({group.sessions.length}):</span>
                    </div>

                    <table className="gt-history-table">
                      <thead>
                        <tr>
                          <th>დრო</th>
                          <th>ზუსტი მოდელი & ეკრანი</th>
                          <th>საიდან შემოვიდა</th>
                          <th>ნანახი გვერდი / ტური</th>
                          <th>დაყოვნების დრო</th>
                          <th>ქმედება</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.sessions.map((s, idx) => {
                          const sOnline = now - (s.lastActiveMillis || 0) <= LIVE_THRESHOLD_MS;
                          return (
                            <tr key={s.id || idx}>
                              <td>
                                {sOnline ? (
                                  <span style={{ color: "#25d366", fontWeight: 800 }}>🟢 ახლა</span>
                                ) : (
                                  <span style={{ color: "#94a3b8" }}>{formatRelativeTime(s.lastActiveMillis)}</span>
                                )}
                              </td>

                              <td>
                                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>
                                  {s.deviceModel || s.os || "მოწყობილობა"}
                                </span>
                                {(s.screenSize || s.screenInches) && (
                                  <span style={{ display: "block", fontSize: "0.78rem", color: "#38bdf8", fontWeight: 600 }}>
                                    📺 {s.screenSize || s.screenInches}
                                  </span>
                                )}
                                <span style={{ display: "block", fontSize: "0.72rem", color: "#94a3b8" }}>
                                  {s.browser} • {s.screenPhysical || s.screen}
                                </span>
                              </td>

                              <td>
                                <span className="src-pill">{s.source || "Direct"}</span>
                              </td>

                              <td style={{ maxWidth: "300px" }}>
                                <a
                                  href={s.currentPage || "/"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="tour-link"
                                  title={s.currentPageTitle || s.currentPage}
                                >
                                  {s.currentPageTitle || s.currentPage || "/"}
                                </a>
                              </td>

                              <td>
                                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                                  ⏱️ {formatDuration(s.totalDurationSeconds)}
                                </span>
                              </td>

                              <td>
                                {s.lastAction === "click_whatsapp" && <span className="action-tag green">💬 WhatsApp</span>}
                                {s.lastAction === "click_call" && <span className="action-tag blue">📞 დარეკვა</span>}
                                {s.lastAction === "click_book_button" && <span className="action-tag orange">📝 ჯავშანი</span>}
                                {s.lastAction === "view_tour_click" && <span className="action-tag purple">🏔️ ტური</span>}
                                {!s.lastAction && <span style={{ color: "#64748b", fontSize: "0.8rem" }}>დათვალიერება</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
