"use client";

import React, { useEffect, useState } from "react";
import {
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  upsertGoogleReviews,
} from "../lib/reviewsFirestore";

const formatRelativeTime = (date) => {
  if (!date) return "ახლახან";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (minutes < 1) return "ახლახან";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  if (hours < 24) return `${hours} საათის წინ`;
  if (days < 7) return `${days} დღის წინ`;
  if (weeks < 5) return `${weeks} კვირის წინ`;
  if (months < 12) return `${months} თვის წინ`;
  return `${Math.floor(days / 365)} წლის წინ`;
};

const emptyForm = () => ({
  name: "",
  rating: 5,
  text: "",
  time: "",
  avatar: "",
  source: "google",
  googleReviewId: "",
});

export default function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [message, setMessage] = useState(null);

  const refresh = async () => {
    try {
      setLoading(true);
      const items = await listReviews();
      setReviews(items);
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
    if (!confirm("წავშალოთ ეს მიმოხილვა?")) return;
    try {
      await deleteReview(id);
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

  return (
    <div className="admin-reviews-manager">
      <div className="admin-reviews-header">
        <h2>მიმოხილვების მართვა</h2>
        <p>დაამატეთ, დაარედაქტირეთ ან წაშალეთ მიმოხილვები. Google Maps-დან ავტომატური სინქრონიზაციისთვის დააჭირეთ ღილაკს.</p>
      </div>

      {message && (
        <div className={`admin-alert ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      <div className="admin-reviews-actions">
        <button
          type="button"
          className="admin-btn-primary"
          onClick={handleSyncGoogle}
          disabled={syncing}
        >
          {syncing ? "სინქრონიზაცია..." : "🔄 Google Maps-დან სინქრონიზაცია"}
        </button>
      </div>

      <form className="admin-form admin-reviews-form" onSubmit={handleSubmit}>
        <header className="admin-form-header">
          <h3>{editingId ? "მიმოხილვის რედაქტირება" : "ახალი მიმოხილვის დამატება"}</h3>
        </header>

        <div className="admin-grid-2">
          <div className="admin-field">
            <label htmlFor="review-name">სახელი *</label>
            <input
              id="review-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="მაგ: Ahmed Al-Rashid"
              required
            />
          </div>
          <div className="admin-field">
            <label htmlFor="review-rating">რეიტინგი (1-5)</label>
            <select
              id="review-rating"
              name="rating"
              value={form.rating}
              onChange={handleChange}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} ★</option>
              ))}
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
            placeholder="მიმოხილვის ტექსტი..."
            required
          />
        </div>

        <div className="admin-grid-2">
          <div className="admin-field">
            <label htmlFor="review-time">დრო</label>
            <input
              id="review-time"
              name="time"
              value={form.time}
              onChange={handleChange}
              placeholder="მაგ: 2 თვის წინ"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="review-avatar">ავატარის URL</label>
            <input
              id="review-avatar"
              name="avatar"
              value={form.avatar}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "ინახება..." : editingId ? "ცვლილებების შენახვა" : "მიმოხილვის დამატება"}
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

      <div className="admin-reviews-list">
        <h3>არსებული მიმოხილვები ({reviews.length})</h3>
        {loading ? (
          <p className="admin-hint">იტვირთება...</p>
        ) : reviews.length === 0 ? (
          <p className="admin-hint">მიმოხილვები ჯერ არ არის დამატებული.</p>
        ) : (
          <ul className="admin-tour-list">
            {reviews.map((review) => (
              <li key={review.id}>
                <div>
                  <strong>{review.name}</strong>
                  <small>
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} • {review.time}
                    {review.source === "google" && " • Google"}
                  </small>
                  <p className="admin-review-text">{review.text.slice(0, 120)}{review.text.length > 120 ? "..." : ""}</p>
                </div>
                <button type="button" className="admin-btn-ghost" onClick={() => startEdit(review)}>რედაქტირება</button>
                <button type="button" className="admin-btn-ghost" onClick={() => handleDelete(review.id)}>წაშლა</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}