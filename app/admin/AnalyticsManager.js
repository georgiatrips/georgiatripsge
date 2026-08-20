"use client";

import React, { useState, useEffect, useMemo } from "react";
import { subscribeToLiveSessions, subscribeToRecentEvents } from "../lib/analytics";

// წამების გარდაქმნა მარტივ ტექსტად (მაგ. "2 წუთი 15 წამი")
function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s} წამი`;
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
  const [selectedSession, setSelectedSession] = useState(null);

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

  // გაფილტრული სესიები
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const activeTime = s.lastActiveMillis || 0;
      if (timeFilter === "live" && now - activeTime > LIVE_THRESHOLD_MS) return false;
      if (timeFilter === "today" && activeTime < TODAY_START_MS) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.ip?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.currentPage?.toLowerCase().includes(q) ||
          s.currentPageTitle?.toLowerCase().includes(q) ||
          s.source?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sessions, timeFilter, searchQuery, now, TODAY_START_MS]);

  const liveCount = useMemo(() => {
    return sessions.filter((s) => now - (s.lastActiveMillis || 0) <= LIVE_THRESHOLD_MS).length;
  }, [sessions, now]);

  const todayCount = useMemo(() => {
    return sessions.filter((s) => (s.lastActiveMillis || 0) >= TODAY_START_MS).length;
  }, [sessions, TODAY_START_MS]);

  // მოწყობილობები
  const mobileCount = sessions.filter((s) => s.deviceType?.toLowerCase() === "mobile").length;
  const desktopCount = sessions.filter((s) => s.deviceType?.toLowerCase() !== "mobile").length;

  // კლიკები
  const waClicks = events.filter((e) => e.eventName === "click_whatsapp").length;
  const callClicks = events.filter((e) => e.eventName === "click_call").length;
  const bookClicks = events.filter((e) => e.eventName === "click_book_button" || e.eventName === "book_tour_submit").length;

  return (
    <div className="gt-clean-analytics">
      {/* ── 1. მთავარი სათაური ────────────────────────────────── */}
      <div className="gt-clean-header">
        <div>
          <h2>📊 საიტის Live ანალიტიკა</h2>
          <p>ადევნეთ თვალი ვინ შემოდის საიტზე, საიდან, რა აინტერესებს და რა ასაკობრივ ჯგუფს მიეკუთვნება</p>
        </div>
        <div className="gt-clean-live-pill">
          <span className="gt-clean-dot" />
          <strong>{liveCount} ადამიანი საიტზეა</strong>
        </div>
      </div>

      {/* ── 2. მარტივი 4 ბარათი (ძირითადი ციფრები) ─────────────── */}
      <div className="gt-clean-cards-grid">
        <div className="gt-clean-card card-green">
          <span className="card-lbl">🟢 Live ონლაინ</span>
          <strong className="card-val">{liveCount}</strong>
          <span className="card-desc">ამ წამს საიტზეა</span>
        </div>

        <div className="gt-clean-card card-blue">
          <span className="card-lbl">👥 დღეს შემოსული</span>
          <strong className="card-val">{todayCount}</strong>
          <span className="card-desc">უნიკალური ვიზიტორი</span>
        </div>

        <div className="gt-clean-card card-purple">
          <span className="card-lbl">📱 ტელეფონი vs კომპიუტერი</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            📱 {mobileCount} / 💻 {desktopCount}
          </strong>
          <span className="card-desc">მობილური და დესკტოპი</span>
        </div>

        <div className="gt-clean-card card-orange">
          <span className="card-lbl">🎯 დაინტერესება (ლიდები)</span>
          <strong className="card-val" style={{ fontSize: "1.4rem" }}>
            💬 {waClicks} / 📞 {callClicks}
          </strong>
          <span className="card-desc">WhatsApp და ზარის კლიკი</span>
        </div>
      </div>

      {/* ── 3. ასაკის & Meta/Google ADS განმარტების ბლოკი ─────── */}
      <div className="gt-clean-age-box">
        <div className="age-box-icon">👤</div>
        <div className="age-box-text">
          <strong>როგორ მუშაობს მომხმარებლის ასაკი და Meta / Google Ads?</strong>
          <p>
            ბრაუზერები უსაფრთხოების გამო პირად ასაკს არ გასცემენ, მაგრამ ჩვენი სისტემა <strong>Meta Pixel (Facebook/Instagram)</strong>-ს და <strong>Google Ads</strong>-ს პირდაპირ უგზავნის თითოეულ ვიზიტორს.
            Facebook-მა და Google-მა <strong>ზუსტად იციან ამ ადამიანების ასაკი (მაგ. 25-45 წელი), სქესი და ინტერესები</strong> თავიანთი აპლიკაციებიდან. ქვემოთ ცხრილში ასევე გამოთვლილია თითოეული ვიზიტორის <em>სავარაუდო სარეკლამო ასაკობრივი ჯგუფი</em>!
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
            ყველა ვიზიტორი ({sessions.length})
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
            placeholder="ძებნა ქვეყნით, ქალაქით, IP-ით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── 5. მარტივი და გასაგები ცხრილი ───────────────────── */}
      <div className="gt-clean-table-wrap">
        <table className="gt-clean-table">
          <thead>
            <tr>
              <th>სტატუსი</th>
              <th>ქვეყანა & ქალაქი</th>
              <th>IP მისამართი</th>
              <th>მოწყობილობა</th>
              <th>👤 ასაკობრივი სეგმენტი</th>
              <th>საიდან შემოვიდა</th>
              <th>რომელ გვერდზეა</th>
              <th>დრო საიტზე</th>
              <th>ქმედება</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                  მონაცემები იტვირთება...
                </td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "2.5rem", color: "#94a3b8" }}>
                  ვიზიტორები არ მოიძებნა
                </td>
              </tr>
            ) : (
              filteredSessions.map((s) => {
                const isOnline = now - (s.lastActiveMillis || 0) <= LIVE_THRESHOLD_MS;
                const demo = getDemographicSegment(s);

                return (
                  <tr key={s.id} className={isOnline ? "row-online" : ""}>
                    {/* სტატუსი */}
                    <td>
                      {isOnline ? (
                        <span className="badge-online">🟢 ონლაინ</span>
                      ) : (
                        <span className="badge-offline">⚪ {formatRelativeTime(s.lastActiveMillis)}</span>
                      )}
                    </td>

                    {/* ქვეყანა & ქალაქი */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "1.3rem" }}>{s.flag || "🌐"}</span>
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>{s.country || "უცნობი"}</strong>
                          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{s.city || "—"}</span>
                        </div>
                      </div>
                    </td>

                    {/* IP */}
                    <td>
                      <code className="ip-pill">{s.ip || "127.0.0.1"}</code>
                    </td>

                    {/* მოწყობილობა */}
                    <td>
                      <span style={{ fontSize: "0.85rem", color: "#e2e8f0" }}>
                        {s.deviceType === "Mobile" ? "📱 " : "💻 "}
                        {s.os || "მოწყობილობა"}
                      </span>
                    </td>

                    {/* ასაკობრივი ჯგუფი (სარეკლამო) */}
                    <td>
                      <span className={`age-pill ${demo.tag}`}>
                        <strong>{demo.group}</strong>
                        <small>{demo.desc}</small>
                      </span>
                    </td>

                    {/* წყარო */}
                    <td>
                      <span className="src-pill">{s.source || "Direct"}</span>
                    </td>

                    {/* მიმდინარე გვერდი */}
                    <td style={{ maxWidth: "180px" }}>
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

                    {/* დრო საიტზე */}
                    <td>
                      <span style={{ fontWeight: 600, color: "#cbd5e1", fontSize: "0.85rem" }}>
                        ⏱️ {formatDuration(s.totalDurationSeconds)}
                      </span>
                    </td>

                    {/* ქმედება */}
                    <td>
                      {s.lastAction === "click_whatsapp" && <span className="action-tag green">💬 WhatsApp</span>}
                      {s.lastAction === "click_call" && <span className="action-tag blue">📞 დარეკვა</span>}
                      {s.lastAction === "click_book_button" && <span className="action-tag orange">📝 ჯავშანი</span>}
                      {s.lastAction === "view_tour_click" && <span className="action-tag purple">🏔️ ტური</span>}
                      {!s.lastAction && <span style={{ color: "#64748b", fontSize: "0.8rem" }}>დათვალიერება</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
