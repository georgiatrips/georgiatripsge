"use client";

import React, { useEffect, useMemo, useState } from "react";
import { adminFetch } from "../lib/apiClient";
import { getTransferPricing, saveTransferPricing } from "../lib/transfers/pricingFirestore";
import {
  DEFAULT_TRANSFER_PRICING,
  TRANSFER_PRICING_MODEL,
  TRANSFER_VEHICLE_KEYS,
  findFareDrops,
  getMarkupPct,
  getRatePerKm,
  getTransferFare,
  normalizeTransferPricing,
  rateFromMarkup,
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
    vehicles[key] = { markups: p.vehicles[key].markups.map(str), minFare: str(p.vehicles[key].minFare) };
  }
  return {
    baseRatePerKm: str(p.baseRatePerKm),
    bands: p.bands.map(str),
    vehicles,
    svanetiSurchargePct: str(p.svanetiSurchargePct),
  };
}

function fromForm(form) {
  return normalizeTransferPricing({ ...form, model: TRANSFER_PRICING_MODEL });
}

function bandsProblem(bands) {
  const nums = bands.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n <= 0)) return "კილომეტრის ყველა ზღვარი უნდა იყოს დადებითი რიცხვი.";
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) return "კილომეტრის ზღვრები უნდა იზრდებოდეს ზემოდან ქვემოთ (მაგ: 30, 50, 100…).";
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

  const setMarkup = (key, idx, value) => {
    setForm((f) => {
      const markups = [...f.vehicles[key].markups];
      markups[idx] = value;
      return { ...f, vehicles: { ...f.vehicles, [key]: { ...f.vehicles[key], markups } } };
    });
  };

  const setMinFare = (key, value) => {
    setForm((f) => ({ ...f, vehicles: { ...f.vehicles, [key]: { ...f.vehicles[key], minFare: value } } }));
  };

  // Row idx starts at bands[idx - 1] km (row 0 starts at 0).
  const setRowStart = (idx, value) => {
    setForm((f) => {
      const bands = [...f.bands];
      bands[idx - 1] = value;
      return { ...f, bands };
    });
  };

  // New band goes right before the open-ended "X+ km" row, with empty
  // markups; the open-ended row keeps its markups and starts 100 km later.
  const addBand = () => {
    setForm((f) => {
      const last = Number(f.bands[f.bands.length - 1]) || 0;
      const vehicles = {};
      for (const key of TRANSFER_VEHICLE_KEYS) {
        const markups = [...f.vehicles[key].markups];
        markups.splice(f.bands.length, 0, "");
        vehicles[key] = { ...f.vehicles[key], markups };
      }
      return { ...f, bands: [...f.bands, String(last + 100)], vehicles };
    });
  };

  // Removing row idx (never the first) hands its distances to the row above.
  const removeRow = (idx) => {
    setForm((f) => {
      const vehicles = {};
      for (const key of TRANSFER_VEHICLE_KEYS) {
        const markups = f.vehicles[key].markups.filter((_, i) => i !== idx);
        vehicles[key] = { ...f.vehicles[key], markups };
      }
      return { ...f, bands: f.bands.filter((_, i) => i !== idx - 1), vehicles };
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

  // Bounds where the next band's lower markup makes a longer trip cheaper.
  const drops = pricing
    ? TRANSFER_VEHICLE_KEYS.flatMap((key) => findFareDrops(pricing, key).map((d) => ({ key, ...d })))
    : [];
  const rowCount = form.bands.length + 1;
  const km = Number(previewKm) || 0;
  const base = pricing?.baseRatePerKm ?? null;

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
            <h2 className="tp-title">ტრანსფერის ფასები კილომეტრის მიხედვით</h2>
            <p className="admin-hint" style={{ margin: 0 }}>
              ფორმულა: ფასი = კმ × საბაზო ფასი × (1 + დანამატი %). მაგ: სედანი, 20 კმ, +320% → 20 × 1 ₾ × 4.2 = 84 ₾.
              დანამატი აიღება იმ დიაპაზონიდან, რომელშიც მთელი მანძილი ხვდება. ფორმულა მხოლოდ აქ ჩანს — საიტზე
              კლიენტი მხოლოდ საბოლოო ფასს ხედავს. „მინიმალური ფასი“ არასავალდებულოა: ამაზე იაფი მგზავრობა არ
              იქნება. ცარიელი უჯრა იღებს უახლოეს შევსებულ დანამატს.
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
                    {VEHICLE_LABELS[key].name}
                    <small>დანამატი %</small>
                  </th>
                ))}
                <th aria-label="წაშლა" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rowCount }, (_, idx) => {
                const isLast = idx === rowCount - 1;
                const end = Number(form.bands[idx]);
                const to = isLast ? "+" : end ? `–${end - 1}` : "–?";
                const label = `${idx === 0 ? 0 : form.bands[idx - 1] || "?"}${to} კმ`;
                return (
                  <tr key={idx}>
                    <td className="tp-band-col">
                      {idx === 0 ? (
                        <span className="tp-band-static">{label}</span>
                      ) : (
                        <span className="tp-band-edit">
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={form.bands[idx - 1]}
                            onChange={(e) => setRowStart(idx, e.target.value)}
                            className="tp-input tp-input--band"
                            aria-label={`დიაპაზონის დასაწყისი, სტრიქონი ${idx + 1}`}
                          />
                          <span>{to} კმ</span>
                        </span>
                      )}
                    </td>
                    {TRANSFER_VEHICLE_KEYS.map((key) => {
                      const value = form.vehicles[key].markups[idx] ?? "";
                      const rate = value === "" || base == null ? null : rateFromMarkup(base, Number(value));
                      return (
                        <td key={key}>
                          <span className="tp-cell">
                            +
                            <input
                              type="number"
                              min="0"
                              step="1"
                              inputMode="decimal"
                              placeholder="—"
                              value={value}
                              onChange={(e) => setMarkup(key, idx, e.target.value)}
                              className={`tp-input tp-input--pct${value === "" ? " is-empty" : ""}`}
                              aria-label={`${VEHICLE_LABELS[key].name}, ${label}, დანამატი %`}
                            />
                            %
                          </span>
                          <span className="tp-cell-rate">{rate != null ? `= ${rate} ₾/კმ` : " "}</span>
                        </td>
                      );
                    })}
                    <td>
                      {idx > 0 && (
                        <button
                          type="button"
                          className="tp-remove"
                          onClick={() => removeRow(idx)}
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
            </tbody>
            <tfoot>
              <tr className="tp-min-row">
                <td className="tp-band-col">მინიმალური ფასი (₾)</td>
                {TRANSFER_VEHICLE_KEYS.map((key) => (
                  <td key={key}>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      placeholder="—"
                      value={form.vehicles[key].minFare ?? ""}
                      onChange={(e) => setMinFare(key, e.target.value)}
                      className="tp-input"
                      aria-label={`${VEHICLE_LABELS[key].name}, მინიმალური ფასი`}
                    />
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {problem && <p className="tp-problem">{problem}</p>}

        {drops.length > 0 && (
          <details className="tp-info">
            <summary>ℹ დიაპაზონის საზღვარზე გრძელი მგზავრობა მოკლეზე იაფი გამოდის (ასე მუშაობს ფორმულა)</summary>
            <ul>
              {[...new Set(drops.map((d) => d.bound))].map((bound) => (
                <li key={bound}>
                  {bound - 1} → {bound} კმ:{" "}
                  {drops
                    .filter((d) => d.bound === bound)
                    .map((d) => `${VEHICLE_LABELS[d.key].name} ${d.prevFare} → ${d.fare} ₾`)
                    .join(", ")}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="tp-controls">
          <button type="button" className="tp-btn-outline" onClick={addBand}>
            დიაპაზონის დამატება
          </button>
          <label className="tp-surcharge">
            <span>საბაზო ფასი 1 კმ-ზე</span>
            <input
              type="number"
              min="0"
              step="0.05"
              inputMode="decimal"
              value={form.baseRatePerKm}
              onChange={(e) => setForm((f) => ({ ...f, baseRatePerKm: e.target.value }))}
              className="tp-input tp-input--base"
            />
            <span>₾</span>
          </label>
          <label className="tp-surcharge">
            <span>სვანეთის დანამატი</span>
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
            {saving ? "ინახება..." : "ფასების შენახვა"}
          </button>
          <button type="button" className="admin-btn-ghost" onClick={handleFillDefaults} disabled={saving}>
            ↺ საწყისი ფასებით შევსება
          </button>
        </div>
      </div>

      <div className="tp-card">
        <h3 className="tp-subtitle">ფასის შემოწმება</h3>
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
            const markup = pricing ? getMarkupPct(pricing, key, km) : null;
            return (
              <div key={key} className="tp-preview-item">
                <span className="tp-preview-name">{VEHICLE_LABELS[key].name}</span>
                <strong className="tp-preview-price">{fare != null ? `${fare} ₾` : "—"}</strong>
                <span className="tp-preview-rate">
                  {rate != null ? `${km} კმ × ${rate} ₾ (+${markup}%)` : "ტარიფი არ არის"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
