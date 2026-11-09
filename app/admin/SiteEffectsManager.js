"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SITE_EFFECTS,
  SITE_EFFECTS,
  SITE_EFFECT_DENSITIES,
  SITE_EFFECT_PAGES,
  getSiteEffects,
  updateSiteEffects,
} from "../lib/siteEffects";
import { SITE_EFFECTS_CACHE_KEY } from "../components/site/SeasonalEffects";

// Admin tab: pick the seasonal effect shown on the public site.
export default function SiteEffectsManager() {
  const [form, setForm] = useState(DEFAULT_SITE_EFFECTS);
  const [saved, setSaved] = useState(DEFAULT_SITE_EFFECTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getSiteEffects()
      .then((s) => { setForm(s); setSaved(s); })
      .catch(() => setMessage({ type: "error", text: "პარამეტრების ჩატვირთვა ვერ მოხერხდა." }))
      .finally(() => setLoading(false));
  }, []);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const clean = await updateSiteEffects(form);
      setSaved(clean);
      setForm(clean);
      // This browser sees the change on the next page load; visitors within ~5 minutes.
      try { sessionStorage.removeItem(SITE_EFFECTS_CACHE_KEY); } catch {}
      setMessage({
        type: "success",
        text: clean.effect === "off" ? "✓ ეფექტი გამოირთო." : "✓ შენახულია. სტუმრებს გამოუჩნდებათ რამდენიმე წუთში.",
      });
    } catch (err) {
      console.error("Save site effects error:", err);
      setMessage({ type: "error", text: "შენახვა ვერ მოხერხდა." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="admin-hint">იტვირთება…</p>;

  const current = SITE_EFFECTS.find((e) => e.value === form.effect);

  return (
    <div className="admin-effects">
      {message && <div className={`admin-alert ${message.type}`}>{message.text}</div>}

      <fieldset className="admin-fieldset">
        <legend>ეფექტი</legend>
        <p className="admin-hint">
          ნაწილაკები პატარა და გამჭვირვალეა, ღილაკებსა და ტექსტს არ ფარავს (კლიკები გადის), მენიუსა და ფანჯრების ქვემოთაა.
          გვერდის ჩატვირთვის შემდეგ ირთვება, ადმინში, ჯავშნისა და შესვლის გვერდებზე არ ჩანს.
        </p>
        <div className="admin-section-grid">
          {SITE_EFFECTS.map((effect) => (
            <button
              key={effect.value}
              type="button"
              className={`admin-section-card${form.effect === effect.value ? " is-active" : ""}`}
              onClick={() => set("effect", effect.value)}
            >
              {effect.label}
            </button>
          ))}
        </div>
        {current && <p className="admin-hint">{current.hint}</p>}
      </fieldset>

      {form.effect !== "off" && (
        <>
          <fieldset className="admin-fieldset">
            <legend>რაოდენობა</legend>
            <div className="admin-badge-grid">
              {SITE_EFFECT_DENSITIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`admin-pick-chip${form.density === d.value ? " is-active" : ""}`}
                  onClick={() => set("density", d.value)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend>სად გამოჩნდეს</legend>
            <div className="admin-badge-grid">
              {SITE_EFFECT_PAGES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`admin-pick-chip${form.pages === p.value ? " is-active" : ""}`}
                  onClick={() => set("pages", p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <button type="button" className="admin-btn-primary" disabled={!dirty || saving} onClick={save}>
        {saving ? "ინახება…" : "შენახვა"}
      </button>
    </div>
  );
}
