"use client";

import React, { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { getTransferPricing, saveTransferPricing } from "../lib/transfers/pricingFirestore";
import {
  DEFAULT_TRANSFER_PRICING,
  TRANSFER_VEHICLE_KEYS,
  getRatePerKm,
  getTransferFare,
  normalizeTransferPricing,
} from "../lib/transfers/pricing";

const VEHICLE_LABELS = {
  sedan: { icon: "🚗", name: "სედანი" },
  minivan: { icon: "🚐", name: "მინივენი" },
  jeep: { icon: "🚙", name: "ჯიპი / SUV" },
  sprinter: { icon: "🚌", name: "სპრინტერი" },
};

const str = (v) => (v === null || v === undefined ? "" : String(v));

// Inputs are edited as strings (an empty cell = "not filled yet").
function toForm(pricing) {
  const p = normalizeTransferPricing(pricing);
  const vehicles = {};
  for (const key of TRANSFER_VEHICLE_KEYS) {
    vehicles[key] = {
      rates: p.vehicles[key].rates.map(str),
      minFare: str(p.vehicles[key].minFare),
    };
  }
  return { bands: p.bands.map(str), vehicles, svanetiSurchargePct: str(p.svanetiSurchargePct) };
}

function fromForm(form) {
  return normalizeTransferPricing(form);
}

function bandsProblem(bands) {
  const nums = bands.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return "კილომეტრის ყველა ზღვარი უნდა იყოს დადებითი რიცხვი.";
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) return "კილომეტრის ზღვრები უნდა იზრდებოდეს ზემოდან ქვემოთ (მაგ: 50, 100, 150…).";
  }
  return null;
}

export default function TransferPricingManager() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewKm, setPreviewKm] = useState("120");
  const [previewSvaneti, setPreviewSvaneti] = useState(false);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    getTransferPricing()
      .then((p) => setForm(toForm(p)))
      .catch((err) => {
        console.error("Transfer pricing load failed:", err);
        setForm(toForm(DEFAULT_TRANSFER_PRICING));
        showMsg("error", "ფასების ჩატვირთვა ვერ მოხერხდა — ნაჩვენებია ნაგულისხმევი ფასები.");
      })
      .finally(() => setLoading(false));
  }, []);

  const problem = form ? bandsProblem(form.bands) : null;
  const pricing = useMemo(() => (form && !problem ? fromForm(form) : null), [form, problem]);

  const setRate = (key, idx, value) => {
    setForm((f) => {
      const rates = [...f.vehicles[key].rates];
      rates[idx] = value;
      return { ...f, vehicles: { ...f.vehicles, [key]: { ...f.vehicles[key], rates } } };
    });
  };

  const setMinFare = (key, value) => {
    setForm((f) => ({ ...f, vehicles: { ...f.vehicles, [key]: { ...f.vehicles[key], minFare: value } } }));
  };

  const setBand = (idx, value) => {
    setForm((f) => {
      const bands = [...f.bands];
      bands[idx] = value;
      return { ...f, bands };
    });
  };

  // New band goes right before the open-ended "X+ km" row, with empty rates.
  const addBand = () => {
    setForm((f) => {
      const last = Number(f.bands[f.bands.length - 1]) || 0;
      const vehicles = {};
      for (const key of TRANSFER_VEHICLE_KEYS) {
        const rates = [...f.vehicles[key].rates];
        rates.splice(f.bands.length, 0, "");
        vehicles[key] = { ...f.vehicles[key], rates };
      }
      return { ...f, bands: [...f.bands, String(last + 100)], vehicles };
    });
  };

  // Removing a bound merges its distances into the next band.
  const removeBand = (idx) => {
    setForm((f) => {
      const vehicles = {};
      for (const key of TRANSFER_VEHICLE_KEYS) {
        const rates = f.vehicles[key].rates.filter((_, i) => i !== idx);
        vehicles[key] = { ...f.vehicles[key], rates };
      }
      return { ...f, bands: f.bands.filter((_, i) => i !== idx), vehicles };
    });
  };

  const handleSave = async () => {
    if (problem) {
      showMsg("error", problem);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveTransferPricing(fromForm(form));
      setForm(toForm(saved));
      let refreshed = false;
      try {
        const res = await adminFetch("/api/admin/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "transfers" }),
        });
        refreshed = res.ok;
      } catch (err) {
        console.warn("Transfer pricing revalidate failed:", err);
      }
      showMsg(
        "success",
        refreshed
          ? "✓ ტრანსფერის ფასები შენახულია და საიტზე განახლდა."
          : "✓ ფასები შენახულია. საიტზე 1 წუთში განახლდება (ქეშის მყისიერი განახლება ვერ მოხერხდა)."
      );
    } catch (err) {
      console.error("Transfer pricing save failed:", err);
      const reason = err?.code === "permission-denied" ? "ამ ანგარიშს ადმინის უფლება არ აქვს" : err?.message || String(err);
      showMsg("error", `შენახვა ვერ მოხერხდა: ${reason}`);
    } finally {
      setSaving(false);
    }
  };

  const handleFillDefaults = () => {
    if (!confirm("შევავსო ცხრილი საწყისი ფასებით? შეუნახავი ცვლილებები დაიკარგება.")) return;
    setForm(toForm(DEFAULT_TRANSFER_PRICING));
  };

  if (loading || !form) {
    return <div className="tp-wrap"><p className="admin-hint">ფასები იტვირთება...</p></div>;
  }

  const rowCount = form.bands.length + 1;
  const km = Number(previewKm) || 0;

  return (
    <div className="tp-wrap">
      {message && (
        <div className={`admin-alert ${message.type}`} role="status" style={{ marginBottom: "1.25rem" }}>
          {message.text}
        </div>
      )}

      <div className="tp-card">
        <div className="tp-head">
          <div>
            <h2 className="tp-title">🚕 ტრანსფერის ფასები კილომეტრის მიხედვით</h2>
            <p className="admin-hint" style={{ margin: 0 }}>
              თითო უჯრაში — ფასი 1 კმ-ზე (₾). მგზავრობის მთელი მანძილი ითვლება იმ დიაპაზონის ტარიფით, რომელშიც ხვდება
              (მაგ: 120 კმ სედანით = 120 × „100–150 კმ“ ტარიფი). ცარიელი უჯრა იღებს უახლოეს შევსებულ ტარიფს.
            </p>
          </div>
        </div>

        <div className="tp-table-scroll">
          <table className="tp-table">
            <thead>
              <tr>
                <th className="tp-band-col">მანძილი (კმ)</th>
                {TRANSFER_VEHICLE_KEYS.map((key) => (
                  <th key={key}>
                    <span className="tp-veh-icon">{VEHICLE_LABELS[key].icon}</span>
                    {VEHICLE_LABELS[key].name}
                    <small>₾ / კმ</small>
                  </th>
                ))}
                <th aria-label="წაშლა" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }, (_, idx) => {
                const isLast = idx === rowCount - 1;
                const from = idx === 0 ? "0" : form.bands[idx - 1] || "?";
                return (
                  <tr key={idx}>
                    <td className="tp-band-col">
                      {isLast ? (
                        <span className="tp-band-static">{from}+ კმ</span>
                      ) : (
                        <span className="tp-band-edit">
                          <span>{from} –</span>
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={form.bands[idx]}
                            onChange={(e) => setBand(idx, e.target.value)}
                            className="tp-input tp-input--band"
                            aria-label={`დიაპაზონის ზედა ზღვარი ${idx + 1}`}
                          />
                          <span>კმ</span>
                        </span>
                      )}
                    </td>
                    {TRANSFER_VEHICLE_KEYS.map((key) => (
                      <td key={key}>
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          inputMode="decimal"
                          placeholder="—"
                          value={form.vehicles[key].rates[idx] ?? ""}
                          onChange={(e) => setRate(key, idx, e.target.value)}
                          className={`tp-input${form.vehicles[key].rates[idx] === "" ? " is-empty" : ""}`}
                          aria-label={`${VEHICLE_LABELS[key].name}, ${from}${isLast ? "+" : `–${form.bands[idx]}`} კმ`}
                        />
                      </td>
                    ))}
                    <td>
                      {!isLast && form.bands.length > 1 && (
                        <button
                          type="button"
                          className="tp-remove"
                          onClick={() => removeBand(idx)}
                          title="დიაპაზონის წაშლა"
                          aria-label="დიაპაზონის წაშლა"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="tp-minfare-row">
                <td className="tp-band-col">მინიმალური ფასი (₾)</td>
                {TRANSFER_VEHICLE_KEYS.map((key) => (
                  <td key={key}>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={form.vehicles[key].minFare}
                      onChange={(e) => setMinFare(key, e.target.value)}
                      className="tp-input"
                      aria-label={`${VEHICLE_LABELS[key].name} — მინიმალური ფასი`}
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {problem && <p className="tp-problem">⚠️ {problem}</p>}

        <div className="tp-controls">
          <button type="button" className="tp-btn-outline" onClick={addBand}>
            ➕ დიაპაზონის დამატება
          </button>
          <label className="tp-surcharge">
            <span>🏔️ სვანეთის დანამატი</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.svanetiSurchargePct}
              onChange={(e) => setForm((f) => ({ ...f, svanetiSurchargePct: e.target.value }))}
              className="tp-input tp-input--pct"
            />
            <span>%</span>
          </label>
        </div>

        <div className="admin-form-actions tp-actions">
          <button type="button" className="admin-btn-primary" onClick={handleSave} disabled={saving || !!problem}>
            {saving ? "ინახება..." : "💾 ფასების შენახვა"}
          </button>
          <button type="button" className="admin-btn-ghost" onClick={handleFillDefaults} disabled={saving}>
            ↺ საწყისი ფასებით შევსება
          </button>
        </div>
      </div>

      <div className="tp-card">
        <h3 className="tp-subtitle">🧮 ფასის შემოწმება</h3>
        <p className="admin-hint">შეიყვანეთ მანძილი და ნახეთ, რა ფასს დაინახავს კლიენტი ამ ცხრილით (შენახვამდეც).</p>
        <div className="tp-preview-inputs">
          <label className="tp-surcharge">
            <span>მანძილი</span>
            <input
              type="number"
              min="1"
              value={previewKm}
              onChange={(e) => setPreviewKm(e.target.value)}
              className="tp-input tp-input--band"
            />
            <span>კმ</span>
          </label>
          <label className="tp-check">
            <input type="checkbox" checked={previewSvaneti} onChange={(e) => setPreviewSvaneti(e.target.checked)} />
            <span>სვანეთის მარშრუტი</span>
          </label>
        </div>
        <div className="tp-preview-grid">
          {TRANSFER_VEHICLE_KEYS.map((key) => {
            const fare = pricing ? getTransferFare(pricing, key, km, { isSvaneti: previewSvaneti }) : null;
            const rate = pricing ? getRatePerKm(pricing, key, km) : null;
            return (
              <div key={key} className="tp-preview-item">
                <span className="tp-preview-name">{VEHICLE_LABELS[key].icon} {VEHICLE_LABELS[key].name}</span>
                <strong className="tp-preview-price">{fare != null ? `${fare} ₾` : "—"}</strong>
                <span className="tp-preview-rate">{rate != null ? `${rate} ₾/კმ` : "ტარიფი არ არის"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
