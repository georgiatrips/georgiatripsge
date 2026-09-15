"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { MONTH_NAMES as MONTHS_MAP } from "../lib/toursFirestore";

const INTL_LOCALE = { ka: "ka-GE", en: "en-GB", ru: "ru-RU", tr: "tr-TR", ar: "ar-u-nu-latn" };

const pad = (n) => String(n).padStart(2, "0");
const toIso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parseIso(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : { y, m: m - 1, d };
}

function todayParts() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
}

// Accepts ISO strings, legacy "MM.DD" strings or { date } objects and returns
// a matcher. Legacy MM.DD entries match any year (kept for old callers).
function buildDateSet(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const iso = new Set();
  const monthDay = new Set();
  for (const entry of list) {
    const raw = typeof entry === "string" ? entry : entry?.date;
    if (!raw) continue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) iso.add(raw);
    else if (/^\d{2}\.\d{2}$/.test(raw)) monthDay.add(raw);
  }
  if (iso.size === 0 && monthDay.size === 0) return null;
  return {
    has: (y, m, d) => iso.has(toIso(y, m, d)) || monthDay.has(`${pad(m + 1)}.${pad(d)}`),
    isoList: [...iso].sort(),
  };
}

function weekdayNames(lang, dictionary) {
  if (lang === "ka" && Array.isArray(dictionary) && dictionary.length === 7) return dictionary;
  try {
    const fmt = new Intl.DateTimeFormat(INTL_LOCALE[lang] || "en-GB", { weekday: "short" });
    // 2024-01-01 was a Monday; the grid starts on Monday.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  } catch {
    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  }
}

/**
 * Calendar date field.
 *
 *  value / onChange   "YYYY-MM-DD" string ("" when cleared)
 *  highlightDates     dates to mark (group departures). Every other future
 *                     day stays selectable.
 *  availableDates     optional restriction: when given and non-empty, ONLY
 *                     these dates can be picked (booking form, group mode).
 *  highlightLabel     legend text for highlighted days
 *  anyDayLabel        optional legend text for ordinary days
 *  variant            "form" | "hero" | "filter" (trigger styling only)
 *  id                 id for the trigger so a <label htmlFor> can name it
 */
export default function DatePicker({
  value,
  onChange,
  placeholder,
  direction = "down",
  availableDates = null,
  highlightDates = null,
  highlightLabel,
  anyDayLabel,
  variant = "form",
  id,
}) {
  const { t, lang } = useLanguage();
  const autoId = useId();
  const triggerId = id || `dp-${autoId}`;
  const dialogId = `${triggerId}-dialog`;

  const months = useMemo(() => {
    const dict = t("datePicker.months");
    return Array.isArray(dict) && lang === "ka" ? dict : MONTHS_MAP[lang] || MONTHS_MAP.ka;
  }, [t, lang]);
  const weekdays = useMemo(() => weekdayNames(lang, t("datePicker.daysShort")), [lang, t]);

  const today = todayParts();
  const todayIso = toIso(today.y, today.m, today.d);
  const selected = parseIso(value);

  const available = useMemo(() => buildDateSet(availableDates), [availableDates]);
  const highlighted = useMemo(() => buildDateSet(highlightDates), [highlightDates]);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => (selected ? { y: selected.y, m: selected.m } : { y: today.y, m: today.m }));
  const [focusIso, setFocusIso] = useState(null);
  const [popoverStyle, setPopoverStyle] = useState({});

  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const dayRefs = useRef(new Map());

  const isPast = useCallback((y, m, d) => toIso(y, m, d) < todayIso, [todayIso]);
  const isDisabled = useCallback(
    (y, m, d) => isPast(y, m, d) || (available ? !available.has(y, m, d) : false),
    [isPast, available]
  );

  const nextHighlight = useMemo(() => {
    const source = available || highlighted;
    return source?.isoList.find((iso) => iso >= todayIso) || null;
  }, [available, highlighted, todayIso]);

  const cells = useMemo(() => {
    const { y, m } = view;
    const first = new Date(y, m, 1).getDay();
    const offset = first === 0 ? 6 : first - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < offset; i += 1) list.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push({ y, m, d, iso: toIso(y, m, d) });
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const openCalendar = () => {
    let start = selected ? { y: selected.y, m: selected.m } : { y: today.y, m: today.m };
    // With a restriction, open on the month of the first selectable date so
    // the user never lands on a month where nothing can be picked.
    if (!selected && available && nextHighlight) {
      const p = parseIso(nextHighlight);
      start = { y: p.y, m: p.m };
    }
    setView(start);
    setFocusIso(value || (available && nextHighlight) || todayIso);
    setOpen(true);
  };

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Desktop: anchor the popover to the trigger. Phones get a bottom sheet from CSS.
  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      if (!triggerRef.current || window.innerWidth <= 768) {
        setPopoverStyle({});
        return;
      }
      const rect = triggerRef.current.getBoundingClientRect();
      const width = 320;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
      const below = window.innerHeight - rect.bottom;
      const openUp = direction === "up" ? rect.top > 420 : below < 430 && rect.top > below;
      setPopoverStyle(openUp ? { left, bottom: window.innerHeight - rect.top + 8 } : { left, top: rect.bottom + 8 });
    };
    place();
    let frame = 0;
    const onMove = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove, { passive: true });
    return () => {
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [open, direction]);

  // Lock page scroll behind the phone bottom sheet.
  useEffect(() => {
    if (!open || window.innerWidth > 768) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (wrapRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open, close]);

  // Move DOM focus with the roving focus date.
  useEffect(() => {
    if (!open || !focusIso) return;
    const node = dayRefs.current.get(focusIso);
    if (node) node.focus({ preventScroll: true });
  }, [open, focusIso, view]);

  const pick = (cell) => {
    if (!cell || isDisabled(cell.y, cell.m, cell.d)) return;
    onChange?.(cell.iso);
    close();
  };

  const shiftMonth = (delta) => {
    setView((current) => {
      const date = new Date(current.y, current.m + delta, 1);
      return { y: date.getFullYear(), m: date.getMonth() };
    });
  };

  const jumpTo = (iso) => {
    const p = parseIso(iso);
    if (!p) return;
    setView({ y: p.y, m: p.m });
    setFocusIso(iso);
  };

  const onGridKeyDown = (event) => {
    const current = parseIso(focusIso) || today;
    const base = new Date(current.y, current.m, current.d);
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    let next = null;
    if (event.key in moves) {
      next = new Date(base);
      next.setDate(base.getDate() + moves[event.key]);
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      next = new Date(base);
      next.setMonth(base.getMonth() + (event.key === "PageDown" ? 1 : -1));
    } else if (event.key === "Home" || event.key === "End") {
      const dow = (base.getDay() + 6) % 7;
      next = new Date(base);
      next.setDate(base.getDate() + (event.key === "Home" ? -dow : 6 - dow));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick({ y: current.y, m: current.m, d: current.d, iso: toIso(current.y, current.m, current.d) });
      return;
    } else {
      return;
    }
    event.preventDefault();
    const iso = toIso(next.getFullYear(), next.getMonth(), next.getDate());
    setFocusIso(iso);
    if (next.getMonth() !== view.m || next.getFullYear() !== view.y) setView({ y: next.getFullYear(), m: next.getMonth() });
  };

  const onPopoverKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !popoverRef.current) return;
    const focusable = [...popoverRef.current.querySelectorAll("button:not([disabled])")].filter((el) => el.tabIndex !== -1);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const formatLong = (y, m, d) => `${d} ${months[m]} ${y}`;
  const displayValue = selected
    ? variant === "hero" || variant === "filter"
      ? `${selected.d} ${months[selected.m]}`
      : formatLong(selected.y, selected.m, selected.d)
    : placeholder || t("datePicker.placeholder");

  const groupLabel = highlightLabel || t("datePicker.groupDeparture");
  const nextParts = nextHighlight ? parseIso(nextHighlight) : null;
  const nextInView = nextParts && nextParts.y === view.y && nextParts.m === view.m;
  const canGoBack = view.y > today.y || (view.y === today.y && view.m > today.m);
  const focusInView = (() => {
    const p = parseIso(focusIso);
    return p && p.y === view.y && p.m === view.m ? focusIso : null;
  })();
  const firstEnabledInView = cells.find((c) => c && !isDisabled(c.y, c.m, c.d))?.iso;
  const tabStop = focusInView || firstEnabledInView || cells.find(Boolean)?.iso;

  const popover = (
    <>
      <div className="dp-backdrop" aria-hidden="true" onClick={() => close(false)} />
      <div
        ref={popoverRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-label={t("datePicker.openCalendar")}
        className={`dp-popover dp-popover--${variant}${direction === "up" ? " dp-popover--up" : ""}`}
        style={popoverStyle}
        onKeyDown={onPopoverKeyDown}
      >
        <div className="dp-header">
          <button type="button" className="dp-nav-btn" onClick={() => shiftMonth(-1)} disabled={!canGoBack} aria-label={t("datePicker.prevMonth")}>
            <svg className="gt-flip-rtl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="dp-month-label" aria-live="polite">{months[view.m]} {view.y}</span>
          <div className="dp-header-actions">
            <button type="button" className="dp-nav-btn" onClick={() => shiftMonth(1)} aria-label={t("datePicker.nextMonth")}>
              <svg className="gt-flip-rtl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <button type="button" className="dp-close-btn" onClick={() => close()} aria-label={t("common.close")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>

        <div className="dp-weekdays" aria-hidden="true">
          {weekdays.map((day) => <span key={day} className="dp-weekday">{day}</span>)}
        </div>

        <div className="dp-grid" onKeyDown={onGridKeyDown}>
          {cells.map((cell, index) => {
            if (!cell) return <span key={`empty-${index}`} aria-hidden="true" />;
            const disabled = isDisabled(cell.y, cell.m, cell.d);
            const isGroup = Boolean(highlighted?.has(cell.y, cell.m, cell.d)) && !isPast(cell.y, cell.m, cell.d);
            const isSelected = value === cell.iso;
            const label = `${formatLong(cell.y, cell.m, cell.d)}${isGroup ? ` — ${groupLabel}` : ""}`;
            return (
              <button
                key={cell.iso}
                ref={(node) => {
                  if (node) dayRefs.current.set(cell.iso, node);
                  else dayRefs.current.delete(cell.iso);
                }}
                type="button"
                tabIndex={cell.iso === tabStop ? 0 : -1}
                className={[
                  "dp-day",
                  cell.iso === todayIso ? "dp-day--today" : "",
                  isGroup ? "dp-day--group" : "",
                  isSelected ? "dp-day--selected" : "",
                  disabled ? "dp-day--disabled" : "",
                  isPast(cell.y, cell.m, cell.d) ? "dp-day--past" : "",
                ].filter(Boolean).join(" ")}
                aria-label={label}
                aria-pressed={isSelected}
                aria-disabled={disabled || undefined}
                aria-current={cell.iso === todayIso ? "date" : undefined}
                onClick={() => pick(cell)}
                onFocus={() => setFocusIso(cell.iso)}
              >
                {cell.d}
                {isGroup && <span className="dp-day-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        {(highlighted || available) && (
          <ul className="dp-legend">
            <li><span className="dp-legend-swatch" aria-hidden="true" />{groupLabel}</li>
            {!available && anyDayLabel && <li><span className="dp-legend-swatch dp-legend-swatch--any" aria-hidden="true" />{anyDayLabel}</li>}
          </ul>
        )}

        <div className="dp-footer">
          {nextHighlight && !nextInView ? (
            <button type="button" className="dp-today-btn" onClick={() => jumpTo(nextHighlight)}>
              {String(t("datePicker.nextGroup")).replace("{date}", `${nextParts.d} ${months[nextParts.m]}`)}
            </button>
          ) : (
            <button
              type="button"
              className="dp-today-btn"
              onClick={() => {
                setView({ y: today.y, m: today.m });
                if (!isDisabled(today.y, today.m, today.d)) pick({ ...today, iso: todayIso });
                else setFocusIso(todayIso);
              }}
            >
              {t("datePicker.today")}
            </button>
          )}
          {value && (
            <button type="button" className="dp-clear-btn" onClick={() => { onChange?.(""); close(); }}>
              {t("datePicker.clear")}
            </button>
          )}
          <button type="button" className="dp-done-btn" onClick={() => close()}>
            {t("datePicker.done")}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className={`dp-wrap dp-wrap--${variant}`} ref={wrapRef}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={`dp-trigger dp-trigger--${variant}${open ? " dp-trigger--open" : ""}`}
        onClick={() => (open ? close(false) : openCalendar())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <span className={`dp-icon-shell dp-icon-shell--${variant}`} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={`dp-trigger-value${selected ? "" : " dp-trigger-value--placeholder"}`}>{displayValue}</span>
        <svg className="dp-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  );
}
