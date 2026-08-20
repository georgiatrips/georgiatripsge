"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { MONTH_NAMES as MONTHS_MAP } from "../lib/toursFirestore";

const DAYS_SHORT_MAP = {
  ka: ["ორ", "სამ", "ოთ", "ხუთ", "პარ", "შაბ", "კვ"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  ar: ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
};

export default function DatePicker({
  value,
  onChange,
  placeholder = "თარიღი",
  direction = "down",
  availableDates = null,
  variant = "form"
}) {
  const { t, lang } = useLanguage() || { t: (k) => k, lang: "ka" };
  const currentLang = lang || "ka";
  const fallbackMonths = MONTHS_MAP[currentLang] || MONTHS_MAP.ka;
  const fallbackDays = DAYS_SHORT_MAP[currentLang] || DAYS_SHORT_MAP.ka;

  const today = new Date();
  const [selected, setSelected] = useState(value ? new Date(value) : null);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState({});
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const gridRef = useRef(null);
  const pageJumpRef = useRef(null);

  const translatedMonths = t("datePicker.months");
  const translatedDays = t("datePicker.daysShort");

  const months = Array.isArray(translatedMonths) ? translatedMonths : fallbackMonths;
  const daysShort = Array.isArray(translatedDays) ? translatedDays : fallbackDays;

  const getTranslatedPlaceholder = () => {
    if (!placeholder || placeholder === "თარიღი") {
      return t("datePicker.placeholder");
    }
    if (placeholder === "აირჩიეთ თარიღი") {
      return t("datePicker.selectDate");
    }
    return placeholder;
  };

  useEffect(() => {
    if (value) {
      if (typeof value === "string" && value.includes("-")) {
        const parts = value.split("-");
        if (parts.length === 3) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          const dateObj = new Date(y, m, d);
          if (!isNaN(dateObj.getTime())) {
            setSelected(dateObj);
            setViewYear(y);
            setViewMonth(m);
          }
        }
      } else {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          setSelected(parsed);
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }
    } else {
      setSelected(null);
    }
  }, [value]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const calcPos = () => {
      if (!triggerRef.current) return null;
      const rect = triggerRef.current.getBoundingClientRect();
      const windowW = typeof window !== "undefined" ? window.innerWidth : 1200;
      const isMobile = windowW <= 768;

      if (isMobile) {
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999999,
          width: "min(360px, calc(100vw - 24px))",
          maxWidth: "calc(100vw - 24px)",
          maxHeight: "calc(100dvh - 24px)",
          overflowY: "auto",
          boxSizing: "border-box",
        };
      }

      const popoverWidth = 300;
      let left = rect.left + rect.width / 2 - popoverWidth / 2;
      if (left < 8) left = 8;
      if (left + popoverWidth > windowW - 8) left = windowW - 8 - popoverWidth;

      if (direction === "up") {
        return {
          position: "fixed",
          bottom: window.innerHeight - rect.top + 14,
          top: "auto",
          left,
          zIndex: 99999,
          width: popoverWidth,
        };
      } else {
        return {
          position: "fixed",
          top: rect.bottom + 14,
          bottom: "auto",
          left,
          zIndex: 99999,
          width: popoverWidth,
        };
      }
    };

    const initialPos = calcPos();
    if (initialPos) {
      setPopoverStyle(initialPos);
    }

    let ticking = false;
    const updateDOMPos = () => {
      const p = calcPos();
      if (p && popoverRef.current) {
        popoverRef.current.style.position = p.position;
        popoverRef.current.style.left = typeof p.left === "number" ? `${p.left}px` : p.left;
        popoverRef.current.style.width = typeof p.width === "number" ? `${p.width}px` : p.width;
        if (p.transform) popoverRef.current.style.transform = p.transform;
        else popoverRef.current.style.transform = "none";
        if (p.top !== "auto") popoverRef.current.style.top = typeof p.top === "number" ? `${p.top}px` : p.top;
        else popoverRef.current.style.top = "auto";
        if (p.bottom !== "auto") popoverRef.current.style.bottom = typeof p.bottom === "number" ? `${p.bottom}px` : p.bottom;
        else popoverRef.current.style.bottom = "auto";
        popoverRef.current.style.maxHeight = p.maxHeight || "";
        popoverRef.current.style.overflowY = p.overflowY || "";
        popoverRef.current.style.boxSizing = p.boxSizing || "";
      }
      ticking = false;
    };

    const handleScrollOrResize = () => {
      if (!ticking) {
        requestAnimationFrame(updateDOMPos);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open, direction]);

  useEffect(() => {
    if (!open || window.innerWidth > 768) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        popoverRef.current && !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const firstDayOfMonth = (y, m) => {
    const d = new Date(y, m, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(v => v - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(v => v + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDay = (dayObj) => {
    const d = new Date(dayObj.year, dayObj.month, dayObj.day);
    setSelected(d);
    const mm = String(dayObj.month + 1).padStart(2, "0");
    const dd = String(dayObj.day).padStart(2, "0");
    const formatted = `${dayObj.year}-${mm}-${dd}`;
    if (onChange) onChange(formatted);
    setOpen(false);
  };

  const isToday = (dayObj) =>
    today.getDate() === dayObj.day &&
    today.getMonth() === dayObj.month &&
    today.getFullYear() === dayObj.year;

  const isSelected = (dayObj) =>
    selected &&
    selected.getDate() === dayObj.day &&
    selected.getMonth() === dayObj.month &&
    selected.getFullYear() === dayObj.year;

  const isPast = (dayObj) => {
    const d = new Date(dayObj.year, dayObj.month, dayObj.day);
    d.setHours(0, 0, 0, 0);
    const tDate = new Date();
    tDate.setHours(0, 0, 0, 0);
    return d < tDate;
  };

  const isAvailable = (dayObj) => {
    if (!availableDates || availableDates.length === 0) return true;
    const mm = String(dayObj.month + 1).padStart(2, "0");
    const dd = String(dayObj.day).padStart(2, "0");
    const iso = `${dayObj.year}-${mm}-${dd}`;
    return availableDates.includes(iso) || availableDates.includes(`${mm}.${dd}`);
  };

  const isDisabled = (dayObj) => !isAvailable(dayObj) || isPast(dayObj);

  const displayValue = selected
    ? variant === "hero"
      ? `${selected.getDate()} ${months[selected.getMonth()]}`
      : `${selected.getDate()} ${months[selected.getMonth()]} ${selected.getFullYear()}`
    : getTranslatedPlaceholder();

  const cells = useMemo(() => {
    const res = [];
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const pMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nMonth = viewMonth === 11 ? 0 : viewMonth + 1;

    const daysInPrev = daysInMonth(prevYear, pMonth);
    const daysInCurr = daysInMonth(viewYear, viewMonth);
    const offset = firstDayOfMonth(viewYear, viewMonth);

    for (let i = offset - 1; i >= 0; i--) {
      res.push({
        day: daysInPrev - i,
        isCurrentMonth: false,
        month: pMonth,
        year: prevYear
      });
    }

    for (let d = 1; d <= daysInCurr; d++) {
      res.push({
        day: d,
        isCurrentMonth: true,
        month: viewMonth,
        year: viewYear
      });
    }

    const total = res.length;
    const remainder = total % 7;
    if (remainder !== 0) {
      const fillCount = 7 - remainder;
      for (let d = 1; d <= fillCount; d++) {
        res.push({
          day: d,
          isCurrentMonth: false,
          month: nMonth,
          year: nextYear
        });
      }
    }

    return res;
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (!open) {
      setFocusedIndex(-1);
      return;
    }
    if (cells.length === 0) return;

    if (pageJumpRef.current) {
      const target = pageJumpRef.current;
      const idx = cells.findIndex(c => c.year === target.year && c.month === target.month && c.day === target.day);
      if (idx >= 0) {
        setFocusedIndex(idx);
      } else {
        const firstAvail = cells.findIndex(c => !isDisabled(c));
        setFocusedIndex(firstAvail >= 0 ? firstAvail : 0);
      }
      pageJumpRef.current = null;
      return;
    }

    if (selected) {
      const idx = cells.findIndex(c => isSelected(c));
      if (idx >= 0) {
        setFocusedIndex(idx);
        return;
      }
    }

    const todayIdx = cells.findIndex(c => isToday(c) && !isDisabled(c));
    if (todayIdx >= 0) {
      setFocusedIndex(todayIdx);
      return;
    }

    const firstAvail = cells.findIndex(c => !isDisabled(c));
    if (firstAvail >= 0) {
      setFocusedIndex(firstAvail);
      return;
    }

    setFocusedIndex(0);
  }, [open, viewYear, viewMonth]);

  useEffect(() => {
    if (focusedIndex < 0 || !gridRef.current) return;
    const buttons = gridRef.current.querySelectorAll('button[tabindex="0"]');
    if (buttons[focusedIndex]) {
      buttons[focusedIndex].focus();
    }
  }, [focusedIndex]);

  const handleGridKeyDown = (e) => {
    if (!open) return;

    const currentIdx = focusedIndex >= 0 ? focusedIndex : 0;
    const total = cells.length;
    const cols = 7;
    let nextIdx = currentIdx;

    switch (e.key) {
      case "ArrowRight":
        nextIdx = currentIdx + 1;
        break;
      case "ArrowLeft":
        nextIdx = currentIdx - 1;
        break;
      case "ArrowDown":
        nextIdx = currentIdx + cols;
        break;
      case "ArrowUp":
        nextIdx = currentIdx - cols;
        break;
      case "Home":
        nextIdx = currentIdx - (currentIdx % cols);
        break;
      case "End":
        nextIdx = currentIdx + (cols - 1 - (currentIdx % cols));
        break;
      case "PageUp":
        e.preventDefault();
        {
          const cur = cells[currentIdx];
          if (cur) {
            const targetMonth = cur.month === 0 ? 11 : cur.month - 1;
            const targetYear = cur.month === 0 ? cur.year - 1 : cur.year;
            const maxDay = daysInMonth(targetYear, targetMonth);
            const day = Math.min(cur.day, maxDay);
            prevMonth();
            pageJumpRef.current = { year: targetYear, month: targetMonth, day };
          }
        }
        return;
      case "PageDown":
        e.preventDefault();
        {
          const cur = cells[currentIdx];
          if (cur) {
            const targetMonth = cur.month === 11 ? 0 : cur.month + 1;
            const targetYear = cur.month === 11 ? cur.year + 1 : cur.year;
            const maxDay = daysInMonth(targetYear, targetMonth);
            const day = Math.min(cur.day, maxDay);
            nextMonth();
            pageJumpRef.current = { year: targetYear, month: targetMonth, day };
          }
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (cells[currentIdx] && !isDisabled(cells[currentIdx])) {
          selectDay(cells[currentIdx]);
        }
        return;
      case "Escape":
        setOpen(false);
        triggerRef.current?.focus();
        return;
      default:
        return;
    }

    if (nextIdx !== currentIdx && nextIdx >= 0 && nextIdx < total) {
      setFocusedIndex(nextIdx);
    }
  };

  const handleTriggerKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
    }
  };

  const popoverContent = (
    <>
      <div className="dp-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <div
        ref={popoverRef}
        className={`dp-popover dp-popover--${variant} ${direction === "up" ? "dp-popover--up" : ""}`}
        style={popoverStyle}
      >
      <div className="dp-header">
        <button type="button" className="dp-nav-btn" onClick={prevMonth} aria-label={t("datePicker.prevMonth")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="dp-month-label">{months[viewMonth]} {viewYear}</span>
        <div className="dp-header-actions">
          <button type="button" className="dp-nav-btn" onClick={nextMonth} aria-label={t("datePicker.nextMonth")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
          <button type="button" className="dp-close-btn" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="dp-weekdays">
        {daysShort.map((d, i) => (
          <span key={i} className="dp-weekday">{d}</span>
        ))}
      </div>

      <div
        ref={gridRef}
        className="dp-grid"
        role="grid"
        aria-label={t("datePicker.openCalendar")}
        onKeyDown={handleGridKeyDown}
      >
        {cells.map((cell, idx) => {
          const disabled = isDisabled(cell);
          const tabIndex = idx === focusedIndex ? 0 : -1;
          return (
            <button
              key={idx}
              type="button"
              role="gridcell"
              tabIndex={tabIndex}
              className={[
                "dp-day",
                !cell.isCurrentMonth ? "dp-day--outside" : "",
                isToday(cell) ? "dp-day--today" : "",
                isSelected(cell) ? "dp-day--selected" : "",
                disabled ? "dp-day--past" : "",
                cell.isCurrentMonth && !disabled ? "dp-day--available" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => !disabled && selectDay(cell)}
              disabled={disabled}
              aria-label={`${cell.day} ${months[cell.month]} ${cell.year}`}
              aria-selected={isSelected(cell)}
              aria-disabled={disabled}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="dp-footer">
        <button type="button" className="dp-today-btn" onClick={() => {
          const tObj = { day: today.getDate(), month: today.getMonth(), year: today.getFullYear() };
          setViewYear(tObj.year);
          setViewMonth(tObj.month);
          if (!isDisabled(tObj)) {
            selectDay(tObj);
          }
        }}>
          {t("datePicker.today")}
        </button>
        <button type="button" className="dp-clear-btn" onClick={() => {
          setSelected(null);
          if (onChange) onChange("");
          setOpen(false);
        }}>
          {t("datePicker.clear")}
        </button>
        <button type="button" className="dp-done-btn" onClick={() => setOpen(false)}>
          OK
        </button>
      </div>
    </div>
    </>
  );

  return (
    <div className={`dp-wrap dp-wrap--${variant}`} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`dp-trigger dp-trigger--${variant} ${open ? "dp-trigger--open" : ""}`}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-label={t("datePicker.openCalendar")}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={`dp-icon-shell dp-icon-shell--${variant}`} aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dp-icon dp-icon--${variant}`}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className={`dp-trigger-value${!selected ? " dp-trigger-value--placeholder" : ""}`}>{displayValue}</span>
        <svg className={`dp-chevron dp-chevron--${variant}`} width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && typeof document !== "undefined" && createPortal(popoverContent, document.body)}
    </div>
  );
}
