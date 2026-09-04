"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  listAllBookingsAdmin,
  subscribeToBookings,
  updateBookingStatusAdmin,
  updateBookingNotesAdmin,
} from "../lib/bookingsFirestore";
import { BOOKING_STATUSES, STATUS_CONFIG } from "../lib/bookingModel";
import { useAuth } from "../lib/AuthContext";
import { useCurrency } from "../lib/currency/CurrencyContext";
import { WA_LINK } from "../lib/shared";

export default function BookingManager() {
  const { user } = useAuth() ?? {};
  const { format } = useCurrency();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "tour_date", "price_desc"

  // Action Modals State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [cancellationReasonInput, setCancellationReasonInput] = useState("");
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // Real-time listener for bookings
  useEffect(() => {
    let active = true;
    setLoading(true);

    const unsubscribe = subscribeToBookings((items) => {
      if (!active) return;
      setBookings(items);
      setLoading(false);

      // If a booking is currently selected, update it in-place
      setSelectedBooking((prev) => {
        if (!prev) return null;
        const updated = items.find((b) => b.id === prev.id || b.bookingId === prev.bookingId);
        return updated || prev;
      });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Sync admin notes input when selecting a booking
  useEffect(() => {
    if (selectedBooking) {
      setAdminNotesInput(selectedBooking.notes?.adminNotes || selectedBooking.admin?.notes || "");
      setCancellationReasonInput(selectedBooking.admin?.cancellationReason || "");
    }
  }, [selectedBooking]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;
    let completed = 0;
    let totalValue = 0;
    let todayCount = 0;

    const todayStr = new Date().toISOString().slice(0, 10);

    bookings.forEach((b) => {
      const s = b.status || BOOKING_STATUSES.PENDING;
      if (s === BOOKING_STATUSES.PENDING) pending++;
      else if (s === BOOKING_STATUSES.CONFIRMED) confirmed++;
      else if (s === BOOKING_STATUSES.CANCELLED) cancelled++;
      else if (s === BOOKING_STATUSES.COMPLETED) completed++;

      if (s !== BOOKING_STATUSES.CANCELLED) {
        totalValue += Number(b.pricing?.totalPrice) || Number(b.price) || 0;
      }

      if (b.createdAtMillis) {
        const createdStr = new Date(b.createdAtMillis).toISOString().slice(0, 10);
        if (createdStr === todayStr) todayCount++;
      }
    });

    return { total, pending, confirmed, cancelled, completed, totalValue, todayCount };
  }, [bookings]);

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        // Status filter
        if (statusFilter !== "all" && (b.status || BOOKING_STATUSES.PENDING) !== statusFilter) {
          return false;
        }

        // Search query (ID, Customer Name, Phone, Tour)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const idMatch = (b.bookingId || "").toLowerCase().includes(q);
          const nameMatch = (b.customer?.fullName || b.name || "").toLowerCase().includes(q);
          const phoneMatch = (b.customer?.phone || b.phone || "").toLowerCase().includes(q);
          const tourMatch = (b.tourTitle || "").toLowerCase().includes(q);
          if (!idMatch && !nameMatch && !phoneMatch && !tourMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (b.createdAtMillis || 0) - (a.createdAtMillis || 0);
        }
        if (sortBy === "oldest") {
          return (a.createdAtMillis || 0) - (b.createdAtMillis || 0);
        }
        if (sortBy === "tour_date") {
          return (a.trip?.date || a.date || "").localeCompare(b.trip?.date || b.date || "");
        }
        if (sortBy === "price_desc") {
          const priceA = Number(a.pricing?.totalPrice) || Number(a.price) || 0;
          const priceB = Number(b.pricing?.totalPrice) || Number(b.price) || 0;
          return priceB - priceA;
        }
        return 0;
      });
  }, [bookings, statusFilter, searchQuery, sortBy]);

  // Handle Status Update Actions
  const handleUpdateStatus = async (newStatus, reason = null) => {
    if (!selectedBooking) return;
    setActionLoading(true);
    setActionMessage(null);

    try {
      await updateBookingStatusAdmin(selectedBooking.id, newStatus, {
        confirmedBy: user?.email || "Admin",
        cancelledBy: user?.email || "Admin",
        cancellationReason: reason,
      });

      setActionMessage({ type: "success", text: `სტატუსი განახლდა: ${newStatus}` });
      setConfirmModalOpen(false);
      setCancelModalOpen(false);
      setCompleteModalOpen(false);
    } catch (err) {
      setActionMessage({ type: "error", text: "სტატუსის განახლება ვერ მოხერხდა" });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Save Internal Admin Notes
  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);

    try {
      await updateBookingNotesAdmin(selectedBooking.id, adminNotesInput.trim());
      setActionMessage({ type: "success", text: "შენიშვნები შენახულია" });
    } catch (err) {
      setActionMessage({ type: "error", text: "შენიშვნების შენახვა ვერ მოხერხდა" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ padding: "0.5rem 0 3rem" }}>
      {/* ── METRICS DASHBOARD SUMMARY ────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          onClick={() => setStatusFilter("all")}
          style={{
            background: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            border: statusFilter === "all" ? "2px solid #0d9488" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
            სულ ჯავშნები
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginTop: "0.25rem" }}>
            {metrics.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(BOOKING_STATUSES.PENDING)}
          style={{
            background: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            border: statusFilter === BOOKING_STATUSES.PENDING ? "2px solid #eab308" : "1px solid #fef08a",
            boxShadow: "0 2px 8px rgba(234, 179, 8, 0.1)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#854d0e", fontWeight: 700, textTransform: "uppercase" }}>
              ⏳ მოლოდინში
            </span>
            {metrics.pending > 0 && (
              <span
                style={{
                  background: "#eab308",
                  color: "#ffffff",
                  fontSize: "0.75rem",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "999px",
                  fontWeight: 800,
                }}
              >
                {metrics.pending} ახალი
              </span>
            )}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#a16207", marginTop: "0.25rem" }}>
            {metrics.pending}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(BOOKING_STATUSES.CONFIRMED)}
          style={{
            background: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            border: statusFilter === BOOKING_STATUSES.CONFIRMED ? "2px solid #10b981" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>
            ✅ დადასტურებული
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#10b981", marginTop: "0.25rem" }}>
            {metrics.confirmed}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(BOOKING_STATUSES.CANCELLED)}
          style={{
            background: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            border: statusFilter === BOOKING_STATUSES.CANCELLED ? "2px solid #ef4444" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#991b1b", fontWeight: 700, textTransform: "uppercase" }}>
            ❌ გაუქმებული
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ef4444", marginTop: "0.25rem" }}>
            {metrics.cancelled}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(BOOKING_STATUSES.COMPLETED)}
          style={{
            background: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            border: statusFilter === BOOKING_STATUSES.COMPLETED ? "2px solid #3b82f6" : "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 700, textTransform: "uppercase" }}>
            🎉 დასრულებული
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#3b82f6", marginTop: "0.25rem" }}>
            {metrics.completed}
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg, #0d233a 0%, #0f365d 100%)",
            color: "#ffffff",
            padding: "1.1rem 1.25rem",
            borderRadius: "16px",
            boxShadow: "0 4px 15px rgba(13, 35, 58, 0.15)",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase" }}>
            ჯამური ღირებულება
          </span>
          <div style={{ fontSize: "1.55rem", fontWeight: 800, color: "#5eead4", marginTop: "0.25rem" }}>
            ₾{metrics.totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ──────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          padding: "1.25rem",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        {/* Status Pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "ყველა" },
            { key: BOOKING_STATUSES.PENDING, label: "⏳ მოლოდინში" },
            { key: BOOKING_STATUSES.CONFIRMED, label: "✅ დადასტურებული" },
            { key: BOOKING_STATUSES.CANCELLED, label: "❌ გაუქმებული" },
            { key: BOOKING_STATUSES.COMPLETED, label: "🎉 დასრულებული" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: statusFilter === item.key ? "#0d233a" : "#f1f5f9",
                color: statusFilter === item.key ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <input
            type="text"
            placeholder="🔍 ძებნა (ID, სახელი, ტელეფონი, ტური)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.55rem 1rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.88rem",
              minWidth: "260px",
              outline: "none",
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "0.55rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              fontWeight: 600,
              background: "#ffffff",
              color: "#334155",
              outline: "none",
            }}
          >
            <option value="newest">თარიღით (უახლესი)</option>
            <option value="oldest">თარიღით (უძველესი)</option>
            <option value="tour_date">ტურის თარიღით</option>
            <option value="price_desc">ფასით (კლებადი)</option>
          </select>
        </div>
      </div>

      {/* ── BOOKINGS DATA TABLE ──────────────────────────────── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 15px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.9rem 1rem" }}>ID</th>
                <th style={{ padding: "0.9rem 1rem" }}>სტატუსი</th>
                <th style={{ padding: "0.9rem 1rem" }}>ტური</th>
                <th style={{ padding: "0.9rem 1rem" }}>ტურის თარიღი</th>
                <th style={{ padding: "0.9rem 1rem" }}>მომხმარებელი</th>
                <th style={{ padding: "0.9rem 1rem" }}>ტელეფონი</th>
                <th style={{ padding: "0.9rem 1rem" }}>მგზავრები</th>
                <th style={{ padding: "0.9rem 1rem" }}>ფასი</th>
                <th style={{ padding: "0.9rem 1rem" }}>წყარო / UTM</th>
                <th style={{ padding: "0.9rem 1rem", textAlign: "right" }}>მოქმედება</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    იტვირთება ჯავშნები...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
                    ჯავშნები არ მოიძებნა.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const s = b.status || BOOKING_STATUSES.PENDING;
                  const sConf = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
                  const price = Number(b.pricing?.totalPrice) || Number(b.price) || 0;
                  const phone = b.customer?.phone || b.phone || "";
                  const utmSource = b.source?.utm_source || "";

                  return (
                    <tr
                      key={b.id || b.bookingId}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
                    >
                      <td style={{ padding: "0.85rem 1rem", fontFamily: "monospace", fontWeight: 700, color: "#0f172a" }}>
                        {b.bookingId || b.id}
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            background: sConf.bgColor,
                            border: `1px solid ${sConf.borderColor}`,
                            color: sConf.color,
                          }}
                        >
                          <span>{sConf.icon}</span>
                          <span>{sConf.labelKa}</span>
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#1e293b", maxWidth: "190px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {b.tourTitle || "ტური"}
                      </td>

                      <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>
                        {b.trip?.date || b.date || "—"}
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                        {b.customer?.fullName || b.name || "—"}
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <a
                          href={`tel:${phone}`}
                          style={{ color: "#0d9488", textDecoration: "none", fontWeight: 600 }}
                        >
                          {phone || "—"}
                        </a>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", color: "#475569" }}>
                        {b.trip?.totalPeople || b.people || 1} პერს.
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontWeight: 800, color: "#0d9488" }}>
                        ₾{price}
                      </td>

                      <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "#64748b" }}>
                        {utmSource ? (
                          <span
                            style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "6px",
                              fontWeight: 600,
                            }}
                          >
                            {utmSource}
                          </span>
                        ) : (
                          "website"
                        )}
                      </td>

                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          style={{
                            background: "#0d9488",
                            color: "#ffffff",
                            border: "none",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "8px",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(13, 148, 136, 0.25)",
                          }}
                        >
                          დეტალები
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOOKING DETAILS MODAL ─────────────────────────────── */}
      {selectedBooking && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedBooking(null);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#f8fafc",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                  ჯავშნის დეტალები
                </span>
                <h3 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a", fontFamily: "monospace" }}>
                  {selectedBooking.bookingId || selectedBooking.id}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "0.2rem 0.5rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem" }}>
              {actionMessage && (
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    marginBottom: "1.25rem",
                    background: actionMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
                    color: actionMessage.type === "success" ? "#065f46" : "#991b1b",
                    border: actionMessage.type === "success" ? "1px solid #a7f3d0" : "1px solid #fecaca",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  {actionMessage.text}
                </div>
              )}

              {/* Status Row with Quick Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  padding: "1rem 1.25rem",
                  background: "#f1f5f9",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>მიმდინარე სტატუსი:</span>
                  <strong style={{ fontSize: "1.1rem", color: "#0f172a" }}>
                    {STATUS_CONFIG[selectedBooking.status]?.icon} {STATUS_CONFIG[selectedBooking.status]?.labelKa || selectedBooking.status}
                  </strong>
                </div>

                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {selectedBooking.status !== BOOKING_STATUSES.CONFIRMED && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setConfirmModalOpen(true)}
                      style={{
                        background: "#10b981",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.5rem 0.95rem",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      ✓ დადასტურება
                    </button>
                  )}

                  {selectedBooking.status !== BOOKING_STATUSES.CANCELLED && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setCancelModalOpen(true)}
                      style={{
                        background: "#ef4444",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.5rem 0.95rem",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      ✕ გაუქმება
                    </button>
                  )}

                  {selectedBooking.status !== BOOKING_STATUSES.COMPLETED && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setCompleteModalOpen(true)}
                      style={{
                        background: "#3b82f6",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.5rem 0.95rem",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      🎉 დასრულება
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of Sections */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                {/* Customer Information */}
                <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "#0d233a", fontWeight: 800 }}>
                    👤 მომხმარებლის მონაცემები
                  </h4>
                  <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.88rem" }}>
                    <div><strong>სახელი:</strong> {selectedBooking.customer?.fullName || selectedBooking.name || "—"}</div>
                    <div><strong>ტელეფონი:</strong> <a href={`tel:${selectedBooking.customer?.phone || selectedBooking.phone}`} style={{ color: "#0d9488" }}>{selectedBooking.customer?.phone || selectedBooking.phone || "—"}</a></div>
                    <div><strong>მესინჯერი:</strong> {selectedBooking.customer?.messengerPref || selectedBooking.channel || "WhatsApp"}</div>
                    <div><strong>ენა:</strong> {selectedBooking.customer?.language || selectedBooking.language || "ka"}</div>
                    {selectedBooking.customer?.email && <div><strong>ელ.ფოსტა:</strong> {selectedBooking.customer.email}</div>}
                  </div>
                </div>

                {/* Trip & Pricing */}
                <div style={{ background: "#f8fafc", padding: "1.2rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "#0d233a", fontWeight: 800 }}>
                    📍 ტურისა და ფასის დეტალები
                  </h4>
                  <div style={{ display: "grid", gap: "0.5rem", fontSize: "0.88rem" }}>
                    <div><strong>ტური:</strong> {selectedBooking.tourTitle}</div>
                    <div><strong>თარიღი:</strong> {selectedBooking.trip?.date || selectedBooking.date}</div>
                    <div><strong>ტიპი:</strong> {selectedBooking.tourType === "group" ? "ჯგუფური" : "ინდივიდუალური"}</div>
                    <div><strong>მგზავრები:</strong> {selectedBooking.trip?.totalPeople || selectedBooking.people} ადამიანი</div>
                    <div><strong>ფასი:</strong> <strong style={{ color: "#0d9488", fontSize: "1.1rem" }}>₾{selectedBooking.pricing?.totalPrice || selectedBooking.price} GEL</strong></div>
                    {selectedBooking.pricing?.couponCode && (
                      <div style={{ color: "#0284c7" }}><strong>კუპონი:</strong> {selectedBooking.pricing.couponCode} (-{selectedBooking.pricing.discountPercent || 10}%)</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Marketing Attribution */}
              <div style={{ background: "#f0fdf4", padding: "1.2rem", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "1.5rem" }}>
                <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", color: "#166534", fontWeight: 800 }}>
                  📊 მარკეტინგული ატრიბუცია (Ads Tracking)
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <div><strong>Source:</strong> {selectedBooking.source?.utm_source || "direct / organic"}</div>
                  <div><strong>Medium:</strong> {selectedBooking.source?.utm_medium || "—"}</div>
                  <div><strong>Campaign:</strong> {selectedBooking.source?.utm_campaign || "—"}</div>
                  <div><strong>Content:</strong> {selectedBooking.source?.utm_content || "—"}</div>
                  {selectedBooking.source?.fbclid && (
                    <div style={{ gridColumn: "1 / -1", wordBreak: "break-all" }}>
                      <strong>fbclid:</strong> <code style={{ fontSize: "0.75rem" }}>{selectedBooking.source.fbclid}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Notes if exists */}
              {(selectedBooking.notes?.customerNotes || selectedBooking.notes) && typeof (selectedBooking.notes?.customerNotes || selectedBooking.notes) === "string" && (
                <div style={{ background: "#fffbeb", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #fde68a", marginBottom: "1.5rem" }}>
                  <strong style={{ color: "#92400e", fontSize: "0.9rem", display: "block", marginBottom: "0.3rem" }}>
                    📝 მომხმარებლის შენიშვნა:
                  </strong>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#78350f" }}>
                    {selectedBooking.notes?.customerNotes || selectedBooking.notes}
                  </p>
                </div>
              )}

              {/* Admin Internal Notes Textarea */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.4rem" }}>
                  🔒 ადმინის შიდა ჩანაწერები (მომხმარებელი ვერ ხედავს)
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="მაგ: დავუკავშირდით, მძღოლი გიორგი დაენიშნა..."
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={actionLoading}
                  style={{
                    marginTop: "0.5rem",
                    background: "#0d233a",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.45rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  შენიშვნის შენახვა
                </button>
              </div>

              {/* Direct WhatsApp Quick Chat */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <a
                  href={`${WA_LINK}?text=${encodeURIComponent(`გამარჯობა ${selectedBooking.customer?.fullName || ""}, გიკავშირდებით GeorgiaTrips-იდან თქვენს ჯავშანთან (${selectedBooking.bookingId}) დაკავშირებით.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: "#25D366",
                    color: "#ffffff",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                  }}
                >
                  <span>💬</span>
                  <span>WhatsApp-ში მიწერა</span>
                </a>

                <a
                  href={`tel:${selectedBooking.customer?.phone || selectedBooking.phone}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background: "#f1f5f9",
                    color: "#0f172a",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <span>📞</span>
                  <span>დარეკვა</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ────────────────────────────────── */}
      {confirmModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>✅</span>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#0f172a" }}>ჯავშნის დადასტურება?</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
              დარწმუნებული ხართ, რომ გსურთ ჯავშნის <strong>{selectedBooking?.bookingId}</strong> დადასტურება?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 600, cursor: "pointer" }}
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(BOOKING_STATUSES.CONFIRMED)}
                disabled={actionLoading}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", background: "#10b981", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "მუშავდება..." : "დიახ, დადასტურება"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANCELLATION MODAL WITH REASON ─────────────────────── */}
      {cancelModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", maxWidth: "460px", width: "100%" }}>
            <span style={{ fontSize: "2.5rem", display: "block", textAlign: "center", marginBottom: "0.75rem" }}>❌</span>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#0f172a", textAlign: "center" }}>ჯავშნის გაუქმება</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.25rem", textAlign: "center" }}>
              გთხოვთ მიუთითოთ გაუქმების მიზეზი (ეს გამოუჩნდება მომხმარებელს სტატუსის გვერდზე):
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <select
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", marginBottom: "0.6rem", fontSize: "0.88rem" }}
              >
                <option value="">აირჩიეთ ტიპიური მიზეზი...</option>
                <option value="ადგილები ამოიწურა ამ თარიღზე">ადგილები ამოიწურა ამ თარიღზე</option>
                <option value="მომხმარებელმა თვითონ მოითხოვა გაუქმება">მომხმარებელმა მოითხოვა გაუქმება</option>
                <option value="არასწორი საკონტაქტო ნომერი">არასწორი საკონტაქტო ნომერი</option>
                <option value="უამინდობის გამო ტური გადაიდო">უამინდობის გამო ტური გადაიდო</option>
                <option value="სხვა მიზეზი">სხვა მიზეზი</option>
              </select>

              <input
                type="text"
                placeholder="ან ჩაწერეთ კონკრეტული მიზეზი..."
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                style={{ width: "100%", padding: "0.65rem", borderRadius: "8px", border: "1.5px solid #cbd5e1", fontSize: "0.88rem" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 600, cursor: "pointer" }}
              >
                უკან
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(BOOKING_STATUSES.CANCELLED, cancellationReasonInput || "ადმინისტრატორის მიერ გაუქმებული")}
                disabled={actionLoading}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "მუშავდება..." : "ჯავშნის გაუქმება"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLETE MODAL ────────────────────────────────────── */}
      {completeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.7)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "16px", maxWidth: "440px", width: "100%", textAlign: "center" }}>
            <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🎉</span>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", color: "#0f172a" }}>ტურის დასრულება?</h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
              მონიშნეთ ჯავშანი <strong>{selectedBooking?.bookingId}</strong> როგორც წარმატებით შესრულებული.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 600, cursor: "pointer" }}
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(BOOKING_STATUSES.COMPLETED)}
                disabled={actionLoading}
                style={{ flex: 1, padding: "0.7rem", borderRadius: "8px", border: "none", background: "#3b82f6", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
              >
                {actionLoading ? "მუშავდება..." : "დიახ, დასრულება"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
