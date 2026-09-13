"use client";

import React, { useEffect, useState } from "react";
import {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  upsertGoogleReviews,
} from "../lib/reviewsFirestore";
import { useLanguage } from "../lib/i18n/LanguageContext";

const emptyForm = () => ({
  name: "",
  rating: 5,
  text: "",
  time: "",
  avatar: "",
  source: "google",
  googleReviewId: "",
});

export default function ReviewManager({ onReviewsCountChange }) {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [message, setMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  const refresh = async () => {
    try {
      setLoading(true);
      const items = await listReviews();
      setReviews(items);
      if (onReviewsCountChange) onReviewsCountChange(items.length);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "მიმოხილვების ჩატვირთვა ვერ მოხერხდა" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editingId) {
        await updateReview(editingId, form);
        setMessage({ type: "success", text: "მიმოხილვა განახლებულია!" });
      } else {
        await createReview(form);
        setMessage({ type: "success", text: "მიმოხილვა დამატებულია!" });
      }
      setForm(emptyForm());
      setEditingId(null);
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "შენახვა ვერ მოხერხდა" });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (review) => {
    setEditingId(review.id);
    setForm({
      name: review.name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      avatar: review.avatar || "",
      source: review.source || "google",
      googleReviewId: review.googleReviewId || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ მიმოხილვის წაშლა?")) return;
    try {
      await deleteReview(id);
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm());
      }
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "წაშლა ვერ მოხერხდა" });
    }
  };

  const handleSyncGoogle = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/google-reviews");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Google-დან მიმოხილვების მიღება ვერ მოხერხდა");
      }
      const results = await upsertGoogleReviews(data.data.reviews);
      const created = results.filter((r) => r.action === "created").length;
      const updated = results.filter((r) => r.action === "updated").length;
      setMessage({
        type: "success",
        text: `Google-დან სინქრონიზაცია დასრულდა! დამატებული: ${created}, განახლებული: ${updated}`,
      });
      await refresh();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "სინქრონიზაცია ვერ მოხერხდა" });
    } finally {
      setSyncing(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const nameMatch = !searchQuery || (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) || (r.text && r.text.toLowerCase().includes(searchQuery.toLowerCase()));
    const ratingMatch = ratingFilter === "all" || String(r.rating) === ratingFilter;
    return nameMatch && ratingMatch;
  });

  return (
    <div className="admin-layout">
      {/* FORM CARD */}
      <form className="admin-form" onSubmit={handleSubmit}>
        <header className="admin-form-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>{editingId ? "⭐ მიმოხილვის რედაქტირება" : "⭐ ახალი მიმოხილვის დამატება"}</h2>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={handleSyncGoogle}
              disabled={syncing}
              style={{
                background: "rgba(56, 189, 248, 0.12)",
                color: "#38bdf8",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: "8px",
                padding: "0.4rem 0.8rem",
                fontSize: "0.82rem",
              }}
            >
              {syncing ? "სინქრონიზაცია..." : "🔄 Google Maps სინქრონიზაცია"}
            </button>
          </div>
          <p>მიმოხილვები ავტომატურად გამოჩნდება მთავარ გვერდზე და ტურების დეტალებში.</p>
        </header>

        {message && (
          <div className={`admin-alert ${message.type}`} role="status">
            {message.text}
          </div>
        )}

        <fieldset className="admin-fieldset">
          <legend>მიმოხილვის მონაცემები</legend>
          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="review-name">ავტორის სახელი *</label>
              <input
                id="review-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="მაგ: Ahmed Al-Rashid, John Doe"
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="review-rating">შეფასება (რეიტინგი)</label>
              <select
                id="review-rating"
                name="rating"
                value={form.rating}
                onChange={handleChange}
              >
                <option value={5}>★★★★★ (5 ვარსკვლავი)</option>
                <option value={4}>★★★★☆ (4 ვარსკვლავი)</option>
                <option value={3}>★★★☆☆ (3 ვარსკვლავი)</option>
                <option value={2}>★★☆☆☆ (2 ვარსკვლავი)</option>
                <option value={1}>★☆☆☆☆ (1 ვარსკვლავი)</option>
              </select>
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="review-text">მიმოხილვის ტექსტი *</label>
            <textarea
              id="review-text"
              name="text"
              rows={4}
              value={form.text}
              onChange={handleChange}
              placeholder="მოგზაურის შეფასების ტექსტი..."
              required
            />
          </div>

          <div className="admin-grid-2">
            <div className="admin-field">
              <label htmlFor="review-time">თარიღი / დრო</label>
              <input
                id="review-time"
                name="time"
                value={form.time}
                onChange={handleChange}
                placeholder="მაგ: 2 თვის წინ, 1 კვირის წინ"
              />
            </div>
            <div className="admin-field">
              <label htmlFor="review-avatar">ავატარის ფოტოს URL</label>
              <input
                id="review-avatar"
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="https://lh3.googleusercontent.com/..."
              />
            </div>
          </div>
        </fieldset>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "ინახება..." : editingId ? "ცვლილებების შენახვა" : "მიმოხილვის შენახვა"}
          </button>
          {editingId && (
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              გაუქმება
            </button>
          )}
        </div>
      </form>

      {/* CATALOG CARDS LIST */}
      <aside className="admin-sidebar" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2>მიმოხილვების სია</h2>
          <span className="admin-tab-count">{reviews.length}</span>
        </div>

        {/* Search & Filter */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
          <input
            type="text"
            placeholder="🔍 მოძებნეთ სახელით ან ტექსტით..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "0.55rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: "0.88rem",
            }}
          />
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{
              padding: "0.5rem 0.8rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(15,23,42,0.8)",
              color: "#fff",
              fontSize: "0.85rem",
            }}
          >
            <option value="all">ყველა რეიტინგი ({reviews.length})</option>
            <option value="5">5 ★★★★★</option>
            <option value="4">4 ★★★★☆</option>
            <option value="3">3 ★★★☆☆</option>
            <option value="2">2 ★★☆☆☆</option>
            <option value="1">1 ★☆☆☆☆</option>
          </select>
        </div>

        {loading ? (
          <p className="admin-hint">{t("common.loading")}</p>
        ) : filteredReviews.length === 0 ? (
          <p className="admin-hint">მიმოხილვები ვერ მოიძებნა.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "800px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredReviews.map((review) => (
              <div key={review.id} className="admin-entry-card">
                <div style={{ padding: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <strong style={{ color: "#fff", fontSize: "0.95rem" }}>{review.name}</strong>
                    <span style={{ color: "#fab418", fontSize: "0.85rem" }}>
                      {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.4rem" }}>
                    <span className="admin-tag-pill">{review.time || "ახლახან"}</span>
                    {review.source === "google" && (
                      <span className="admin-tag-pill" style={{ background: "rgba(66, 133, 244, 0.15)", color: "#60a5fa" }}>
                        🌐 Google
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.84rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {review.text}
                  </p>
                </div>
                <div className="admin-entry-actions">
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>ID: {review.id.slice(0, 8)}...</span>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button type="button" className="admin-action-btn edit" onClick={() => startEdit(review)}>
                      რედაქტირება
                    </button>
                    <button type="button" className="admin-action-btn delete" onClick={() => handleDelete(review.id)}>
                      წაშლა
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
