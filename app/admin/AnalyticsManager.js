"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  subscribeToLiveSessions,
  subscribeToRecentEvents,
  clearAllAnalyticsData,
} from "../lib/analytics";

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
  if (diffSec < 60) return `${diffSec} წამის წინ`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} წუთის წინ`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} საათის წინ`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} დღის წინ`;
}

// მოწყობილობის მოდელისა და ტრაფიკის მიხედვით სარეკლამო ასაკობრივი სეგმენტის დადგენა
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
  const [expandedIp, setExpandedIp] = useState(null);
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

  // 1 IP-ის მიხედვით სესიების დაჯგუფება 1 Box-ში
  const ipGroups = useMemo(() => {
    const groups = {};

    sessions.forEach((s) => {
      const ip = s.ip || "127.0.0.1";
      if (!groups[ip]) {
        groups[ip] = {
          ip,
          country: s.country || "უცნობი",
          city: s.city || "—",
          flag: s.flag || "🌐",
          sessions: [],
          devices: new Set(),
          sources: new Set(),
          actionsCount: { whatsapp: 0, call: 0, book: 0, tour: 0 },
          maxLastActive: 0,
          totalDuration: 0,
          isOnline: false,
          demo: getDemographicSegment(s),
        };
      }

      const grp = groups[ip];
      grp.sessions.push(s);

      const activeTime = s.lastActiveMillis || 0;
      if (activeTime > grp.maxLastActive) {
        grp.maxLastActive = activeTime;
        grp.demo = getDemographicSegment(s);
        grp.latestPage = s.currentPage;
        grp.latestPageTitle = s.currentPageTitle;
      }

      if (now - activeTime <= LIVE_THRESHOLD_MS) {
        grp.isOnline = true;
      }

      grp.totalDuration += Math.round(s.totalDurationSeconds || 0);

      if (s.os) grp.devices.add(`${s.deviceType === "Mobile" ? "📱" : "💻"} ${s.os}`);
      if (s.source) grp.sources.add(s.source);

      if (s.lastAction === "click_whatsapp") grp.actionsCount.whatsapp++;
      else if (s.lastAction === "click_call") grp.actionsCount.call++;
      else if (s.lastAction === "click_book_button") grp.actionsCount.book++;
      else if (s.lastAction === "view_tour_click") grp.actionsCount.tour++;
    });

    // სესიების დალაგება თითოეულ IP-ში უახლესიდან ძველისკენ
    Object.values(groups).forEach((g) => {
      g.sessions.sort((a, b) => (b.lastActiveMillis || 0) - (a.lastActiveMillis || 0));
    });

    // IP ჯგუფების დალაგება: ონლაინები თავში, შემდეგ უახლესი აქტივობით
    return Object.values(groups).sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1;
      if (!a.isOnline && b.isOnline) return 1;
      return (b.maxLastActive || 0) - (a.maxLastActive || 0);
    });
  }, [sessions, now]);

  // გაფილტვრა
  const filteredIpGroups = useMemo(() => {
    return ipGroups.filter((g) => {
      if (timeFilter === "live" && !g.isOnline) return false;
      if (timeFilter === "today" && g.maxLastActive < TODAY_START_MS) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          g.ip.toLowerCase().includes(q) ||
          g.country.toLowerCase().includes(q) ||
          g.city.toLowerCase().includes(q) ||
          Array.from(g.sources).some((src) => src.toLowerCase().includes(q)) ||
          Array.from(g.devices).some((dev) => dev.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [ipGroups, timeFilter, searchQuery, TODAY_START_MS]);

  const liveCount = useMemo(() => {
    return ipGroups.filter((g) => g.isOnline).length;
  }, [ipGroups]);

  const todayCount = useMemo(() => {
    return ipGroups.filter((g) => g.maxLastActive >= TODAY_START_MS).length;
  }, [ipGroups, TODAY_START_MS]);

  // მოწყობილობები
  const mobileCount = sessions.filter((s) => s.deviceType?.toLowerCase() === "mobile").length;
  const desktopCount = sessions.filter((s) => s.deviceType?.toLowerCase() !== "mobile").length;

  // კლიკები
  const waClicks = events.filter((e) => e.eventName === "click_whatsapp").length;
  const callClicks = events.filter((e) => e.eventName === "click_call").length;

  const handleClearHistory = async () => {
    const ok = window.confirm(
      "დარწმუნებული ხართ, რომ გსურთ მთელი სატესტო ანალიტიკის ისტორიის წაშლა? მონაცემები გასუფთავდება და დაიწყება თავიდან."
    );
    if (!ok) return;
    setClearing(true);
    await clearAllAnalyticsData();
    setClearing(false);
  };

  const toggleExpand = (ip) => {
    setExpandedIp((prev) => (prev === ip ? null : ip));
  };

  return (
    <div className="gt-clean-analytics">
      {/* ── 1. მთავარი სათაური ────────────────────────────────── */}
      <div className="gt-clean-header">
        <div>
          <h2>📊 საიტის Live ანალიტიკა (IP ჯგუფები)</h2>
          <p>
            თითოეული IP წარმოდგენილია <strong>1 კომპაქტურ ბარათად</strong> — გახსენით მისი ისტორია ყველა ვიზიტისა და ქმედების სანახავად
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <div className="gt-clean-live-pill">
            <span className="gt-clean-dot" />
            <strong>{liveCount} IP საიტზეა</strong>
          </div>
          <button
            type="button"
            className="gt-clear-btn"
            onClick={handleClearHistory}
            disabled={clearing || sessions.length === 0}
            title="სატესტო ისტორიის გასუფთავება"
          >
            {clearing ? "იშლება..." : "🗑️ ისტორიის გასუფთავება"}
          </button>
        </div>
      </div>

      {/* ── 2. მარტივი 4 ბარათი (ძირითადი ციფრები) ─────────────── */}
      <div className="gt-clean-cards-grid">
        <div className="gt-clean-card card-green">
          <span className="card-lbl">🟢 Live ონლაინ IP</span>
          <strong className="card-val">{liveCount}</strong>
          <span className="card-desc">უნიკალური IP საიტზეა</span>
        </div>

        <div className="gt-clean-card card-blue">
          <span className="card-lbl">👥 უნიკალური IP (ვიზიტორები)</span>
          <strong className="card-val">{ipGroups.length}</strong>
          <span className="card-desc">სულ {sessions.length} ვიზიტი</span>
        </div>

        <div className="gt-clean-card card-purple">
          <span className="card-lbl">📱 ტელეფონი vs კომპიუტერი</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            📱 {mobileCount} / 💻 {desktopCount}
          </strong>
          <span className="card-desc">მოწყობილობების განაწილება</span>
        </div>

        <div className="gt-clean-card card-orange">
          <span className="card-lbl">🎯 დაინტერესება (ლიდები)</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            💬 {waClicks} / 📞 {callClicks}
          </strong>
          <span className="card-desc">WhatsApp და ზარის კლიკები</span>
        </div>
      </div>

      {/* ── 3. ასაკის & Meta/Google ADS განმარტების ბლოკი ─────── */}
      <div className="gt-clean-age-box">
        <div className="age-box-icon">👤</div>
        <div className="age-box-text">
          <strong>როგორ მუშაობს მომხმარებლის ასაკი და Meta / Google Ads?</strong>
          <p>
            ბრაუზერები უსაფრთხოების გამო პირად ასაკს არ გასცემენ, მაგრამ ჩვენი სისტემა <strong>Meta Pixel (Facebook/Instagram)</strong>-ს და <strong>Google Ads</strong>-ს პირდაპირ უგზავნის თითოეულ ვიზიტორს.
            Facebook-მა და Google-მა <strong>ზუსტად იციან ამ ადამიანების ასაკი (მაგ. 25-45 წელი), სქესი და ინტერესები</strong> თავიანთი აპლიკაციებიდან.
          </p>
        </div>
      </div>

      {/* ── 4. ფილტრები & ძებნა ──────────────────────────────── */}
      <div className="gt-clean-filter-bar">
        <div className="gt-clean-tabs">
          <button
            className={`tab-btn ${timeFilter === "all" ? "active" : ""}`}
            onClick={() => setTimeFilter("all")}
          >
            ყველა IP ({ipGroups.length})
          </button>
          <button
            className={`tab-btn ${timeFilter === "live" ? "active" : ""}`}
            onClick={() => setTimeFilter("live")}
          >
            🟢 Live ონლაინ ({liveCount})
          </button>
          <button
            className={`tab-btn ${timeFilter === "today" ? "active" : ""}`}
            onClick={() => setTimeFilter("today")}
          >
            📅 დღევანდელი ({todayCount})
          </button>
        </div>

        <div className="gt-clean-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="ძებნა IP-ით, ქვეყნით, ქალაქით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 5. დაჯგუფებული IP BOX-ების სია ───────────────────── */}
      <div className="gt-ip-boxes-container">
        {loading ? (
          <div className="gt-empty-state">მონაცემები იტვირთება...</div>
        ) : filteredIpGroups.length === 0 ? (
          <div className="gt-empty-state">ვიზიტორები არ მოიძებნა</div>
        ) : (
          filteredIpGroups.map((grp) => {
            const isExpanded = expandedIp === grp.ip;

            return (
              <div
                key={grp.ip}
                className={`gt-ip-card ${grp.isOnline ? "is-online" : ""}`}
              >
                {/* ── IP CARD HEADER ── */}
                <div className="gt-ip-card-header" onClick={() => toggleExpand(grp.ip)}>
                  {/* ლოკაცია & სტატუსი */}
                  <div className="gt-ip-col loc">
                    <span className="gt-ip-flag">{grp.flag}</span>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <strong className="gt-ip-country">{grp.country}</strong>
                        {grp.isOnline ? (
                          <span className="badge-online">🟢 ონლაინ</span>
                        ) : (
                          <span className="badge-offline">⚪ {formatRelativeTime(grp.maxLastActive)}</span>
                        )}
                      </div>
                      <span className="gt-ip-city">{grp.city}</span>
                    </div>
                  </div>

                  {/* IP MISAMARTI */}
                  <div className="gt-ip-col">
                    <span className="gt-col-lbl">IP მისამართი:</span>
                    <code className="ip-pill">{grp.ip}</code>
                  </div>

                  {/* MOYQOBILOBEBI */}
                  <div className="gt-ip-col">
                    <span className="gt-col-lbl">მოწყობილობები ({grp.devices.size}):</span>
                    <span className="gt-val-text">
                      {Array.from(grp.devices).join(", ") || "მოწყობილობა"}
                    </span>
                  </div>

                  {/* ASAKOBRIVI GROUP */}
                  <div className="gt-ip-col">
                    <span className="gt-col-lbl">ასაკობრივი ჯგუფი:</span>
                    <span className={`age-pill ${grp.demo.tag}`}>
                      <strong>{grp.demo.group}</strong>
                      <small>{grp.demo.desc}</small>
                    </span>
                  </div>

                  {/* AQTIURIBIS JAMI */}
                  <div className="gt-ip-col">
                    <span className="gt-col-lbl">საიტზე დრო:</span>
                    <strong style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
                      ⏱️ {formatDuration(grp.totalDuration)}
                    </strong>
                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                      {grp.sessions.length} ვიზიტი
                    </span>
                  </div>

                  {/* KVEDEBEBI */}
                  <div className="gt-ip-col actions">
                    <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                      {grp.actionsCount.whatsapp > 0 && (
                        <span className="action-tag green">
                          💬 WA ({grp.actionsCount.whatsapp})
                        </span>
                      )}
                      {grp.actionsCount.call > 0 && (
                        <span className="action-tag blue">
                          📞 ზარი ({grp.actionsCount.call})
                        </span>
                      )}
                      {grp.actionsCount.book > 0 && (
                        <span className="action-tag orange">
                          📝 ჯავშანი ({grp.actionsCount.book})
                        </span>
                      )}
                      {grp.actionsCount.tour > 0 && (
                        <span className="action-tag purple">
                          🏔️ ტური ({grp.actionsCount.tour})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DROPDOWN TOGGLE BUTTON */}
                  <button
                    type="button"
                    className={`gt-expand-btn ${isExpanded ? "open" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(grp.ip);
                    }}
                  >
                    {isExpanded
                      ? "▲ ისტორიის დახურვა"
                      : `▼ ისტორია (${grp.sessions.length} ვიზიტი)`}
                  </button>
                </div>

                {/* ── EXPANDED HISTORY SUB-TABLE ── */}
                {isExpanded && (
                  <div className="gt-ip-history-wrap">
                    <div className="history-head">
                      <strong>📜 ამ IP-ის ყველა ვიზიტი და გვერდი ({grp.sessions.length}):</strong>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        წყაროები: {Array.from(grp.sources).join(", ") || "Direct"}
                      </span>
                    </div>

                    <table className="gt-sub-table">
                      <thead>
                        <tr>
                          <th>დრო</th>
                          <th>მოწყობილობა / OS</th>
                          <th>საიდან შემოვიდა</th>
                          <th>რომელი გვერდი / ტური ნახა</th>
                          <th>დაყოვნება</th>
                          <th>ქმედება</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grp.sessions.map((sess, idx) => (
                          <tr key={sess.id || idx}>
                            <td>
                              <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                                {formatRelativeTime(sess.lastActiveMillis)}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>
                                {sess.deviceType === "Mobile" ? "📱 " : "💻 "}
                                {sess.os || "უცნობი"}
                              </span>
                            </td>
                            <td>
                              <span className="src-pill">{sess.source || "Direct"}</span>
                            </td>
                            <td style={{ maxWidth: "260px" }}>
                              <a
                                href={sess.currentPage || "/"}
                                target="_blank"
                                rel="noreferrer"
                                className="tour-link"
                                title={sess.currentPageTitle || sess.currentPage}
                              >
                                {sess.currentPageTitle || sess.currentPage || "/"}
                              </a>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600, color: "#cbd5e1", fontSize: "0.8rem" }}>
                                ⏱️ {formatDuration(sess.totalDurationSeconds)}
                              </span>
                            </td>
                            <td>
                              {sess.lastAction === "click_whatsapp" && (
                                <span className="action-tag green">💬 WhatsApp</span>
                              )}
                              {sess.lastAction === "click_call" && (
                                <span className="action-tag blue">📞 დარეკვა</span>
                              )}
                              {sess.lastAction === "click_book_button" && (
                                <span className="action-tag orange">📝 ჯავშანი</span>
                              )}
                              {sess.lastAction === "view_tour_click" && (
                                <span className="action-tag purple">🏔️ ტური</span>
                              )}
                              {!sess.lastAction && (
                                <span style={{ color: "#64748b", fontSize: "0.78rem" }}>
                                  დათვალიერება
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
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
