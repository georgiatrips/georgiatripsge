"use client";

import React, { useState, useEffect, useMemo } from "react";
import { subscribeToLiveSessions, subscribeToRecentEvents } from "../lib/analytics";
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

// სარეკლამო ასაკობრივი სეგმენტის დადგენა
function getDemographicSegment(session) {
  const os = (session.os || "").toLowerCase();
  const device = (session.deviceType || "").toLowerCase();
  const src = (session.source || "").toLowerCase();

  if (src.includes("instagram") || src.includes("tiktok")) {
    return { group: "18 – 34 წელი", desc: "ახალგაზრდა / სოც. მედია", tag: "young" };
  }
  if (src.includes("facebook")) {
    return { group: "28 – 55 წელი", desc: "ოჯახური / FB აუდიტორია", tag: "mid" };
  }
  if (device === "mobile" && (os.includes("ios") || os.includes("iphone"))) {
    return { group: "24 – 45 წელი", desc: "მაღალი მსყიდველუნარიანობა (iOS)", tag: "apple" };
  }
  if (device === "desktop") {
    return { group: "30 – 60 წელი", desc: "ბიზნესი / ოფისი / კომპიუტერი", tag: "desktop" };
  }
  return { group: "22 – 48 წელი", desc: "სტანდარტული მოგზაური", tag: "general" };
}

export default function AnalyticsManager() {
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all");
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

  // 1. IP-ით დაჯგუფება
  const groupedByIp = useMemo(() => {
    const map = {};

    sessions.forEach((s) => {
      const ipKey = s.ip || "127.0.0.1";
      if (!map[ipKey]) {
        map[ipKey] = {
          ip: ipKey,
          country: s.country || "Georgia",
          city: s.city || "Batumi",
          flag: s.flag || "🌐",
          sessions: [],
          totalDuration: 0,
          latestActive: 0,
          hasOnline: false,
          devices: new Set(),
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

      if (s.deviceType || s.os) {
        map[ipKey].devices.add(`${s.deviceType === "Mobile" ? "📱" : "💻"} ${s.os || ""}`.trim());
      }
      if (s.source) map[ipKey].sources.add(s.source);
      if (s.lastAction) map[ipKey].actions.add(s.lastAction);
    });

    // სესიების დალაგება უახლესის მიხედვით
    const list = Object.values(map).map((group) => {
      group.sessions.sort((a, b) => (b.lastActiveMillis || 0) - (a.lastActiveMillis || 0));
      return group;
    });

    // ჯგუფების დალაგება უახლესი აქტივობით
    list.sort((a, b) => b.latestActive - a.latestActive);
    return list;
  }, [sessions, now]);

  // გაფილტვრა
  const filteredGroups = useMemo(() => {
    return groupedByIp.filter((g) => {
      if (timeFilter === "live" && !g.hasOnline) return false;
      if (timeFilter === "today" && g.latestActive < TODAY_START_MS) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          g.ip.toLowerCase().includes(q) ||
          g.country.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q) ||
          Array.from(g.sources).some((src) => src.toLowerCase().includes(q)) ||
          g.sessions.some(
            (s) =>
              s.currentPage?.toLowerCase().includes(q) ||
              s.currentPageTitle?.toLowerCase().includes(q)
          );
        if (!match) return false;
      }
      return true;
    });
  }, [groupedByIp, timeFilter, searchQuery, TODAY_START_MS]);

  // სტატისტიკა
  const liveCount = useMemo(() => {
    return sessions.filter((s) => now - (s.lastActiveMillis || 0) <= LIVE_THRESHOLD_MS).length;
  }, [sessions, now]);

  const todayCount = useMemo(() => {
    return sessions.filter((s) => (s.lastActiveMillis || 0) >= TODAY_START_MS).length;
  }, [sessions, TODAY_START_MS]);

  const mobileCount = sessions.filter((s) => s.deviceType?.toLowerCase() === "mobile").length;
  const desktopCount = sessions.filter((s) => s.deviceType?.toLowerCase() !== "mobile").length;

  const waClicks = events.filter((e) => e.eventName === "click_whatsapp").length;
  const callClicks = events.filter((e) => e.eventName === "click_call").length;

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
          <h2>📊 საიტის Live ანალიტიკა (IP დაჯგუფებით)</h2>
          <p>თითოეული მომხმარებლის/IP-ის ისტორია დაჯგუფებულია 1 ბარათში — დააჭირეთ და ნახეთ მისი ყველა ნაბიჯი</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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

      {/* ── 2. მარტივი 4 ბარათი ────────────────────────────────── */}
      <div className="gt-clean-cards-grid">
        <div className="gt-clean-card card-green">
          <span className="card-lbl">🟢 Live ონლაინ</span>
          <strong className="card-val">{liveCount}</strong>
          <span className="card-desc">ამ წამს საიტზეა</span>
        </div>

        <div className="gt-clean-card card-blue">
          <span className="card-lbl">👥 უნიკალური IP / ვიზიტორი</span>
          <strong className="card-val">{groupedByIp.length}</strong>
          <span className="card-desc">სულ {sessions.length} ვიზიტი</span>
        </div>

        <div className="gt-clean-card card-purple">
          <span className="card-lbl">📱 მოწყობილობები</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            📱 {mobileCount} / 💻 {desktopCount}
          </strong>
          <span className="card-desc">მობილური და დესკტოპი</span>
        </div>

        <div className="gt-clean-card card-orange">
          <span className="card-lbl">🎯 ლიდები & კლიკები</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            💬 {waClicks} / 📞 {callClicks}
          </strong>
          <span className="card-desc">WhatsApp და ზარები</span>
        </div>
      </div>

      {/* ── 3. ფილტრები & ძებნა ──────────────────────────────── */}
      <div className="gt-clean-filter-bar">
        <div className="gt-clean-tabs">
          <button
            className={`tab-btn ${timeFilter === "all" ? "active" : ""}`}
            onClick={() => setTimeFilter("all")}
          >
            ყველა IP ({groupedByIp.length})
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
        </div>

        <div className="gt-clean-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="ძებნა IP-ით, ქალაქით, ტურით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            const demo = getDemographicSegment(topSession);

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

                    {/* ქვეყანა & IP */}
                    <div className="gt-ip-title">
                      <span className="gt-ip-flag">{group.flag || "🌐"}</span>
                      <div>
                        <strong>
                          {group.country}, {group.city}
                        </strong>
                        <code className="ip-pill">{group.ip}</code>
                      </div>
                    </div>
                  </div>

                  <div className="gt-ip-box-mid">
                    {/* ასაკობრივი ჯგუფი */}
                    <span className={`age-pill ${demo.tag}`}>
                      <strong>{demo.group}</strong>
                      <small>{demo.desc}</small>
                    </span>

                    {/* მოწყობილობები */}
                    <div className="gt-ip-devices-pill">
                      {Array.from(group.devices).join(" • ") || "💻 მოწყობილობა"}
                    </div>

                    {/* წყაროები */}
                    <div className="gt-ip-sources-pill">
                      {Array.from(group.sources).join(", ") || "Direct"}
                    </div>
                  </div>

                  <div className="gt-ip-box-right">
                    {/* დრო & ისტორიის რაოდენობა */}
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "#38bdf8", display: "block" }}>
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
                      {isExpanded ? "დახურვა ▲" : `ისტორია (${group.sessions.length}) ▼`}
                    </button>
                  </div>
                </div>

                {/* ── EXPANDED HISTORY (გაშლილი ისტორია ამ IP-ზე) ────── */}
                {isExpanded && (
                  <div className="gt-ip-box-history">
                    <div className="history-head">
                      <span>🕒 ამ IP-ის ყველა შემოსვლა და აქტივობა ({group.sessions.length}):</span>
                    </div>

                    <table className="gt-history-table">
                      <thead>
                        <tr>
                          <th>დრო</th>
                          <th>მოწყობილობა & OS</th>
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
                                <span style={{ color: "#e2e8f0" }}>
                                  {s.deviceType === "Mobile" ? "📱 " : "💻 "}
                                  {s.os || "მოწყობილობა"} {s.browser ? `(${s.browser})` : ""}
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
