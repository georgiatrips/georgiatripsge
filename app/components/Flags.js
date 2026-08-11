"use client";

import React from "react";

export function FlagGeorgia({ width = 22, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 480"
      className={`flag-svg ${className}`}
      style={{
        borderRadius: "3px",
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <rect width="640" height="480" fill="#ffffff" />
      <path fill="#ff0000" d="M260 0h120v480H260z" />
      <path fill="#ff0000" d="M0 180h640v120H0z" />
      <g fill="#ff0000">
        {/* Top-Left Bolnisi Cross */}
        <path d="M130 90 c-4,12-14,20-25,20 c11,0,21,8,25,20 c4-12,14-20,25-20 c-11,0-21-8-25-20z" />
        {/* Top-Right Bolnisi Cross */}
        <path d="M510 90 c-4,12-14,20-25,20 c11,0,21,8,25,20 c4-12,14-20,25-20 c-11,0-21-8-25-20z" />
        {/* Bottom-Left Bolnisi Cross */}
        <path d="M130 390 c-4,12-14,20-25,20 c11,0,21,8,25,20 c4-12,14-20,25-20 c-11,0-21-8-25-20z" />
        {/* Bottom-Right Bolnisi Cross */}
        <path d="M510 390 c-4,12-14,20-25,20 c11,0,21,8,25,20 c4-12,14-20,25-20 c-11,0-21-8-25-20z" />
      </g>
    </svg>
  );
}

export function FlagUK({ width = 22, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 400"
      className={`flag-svg ${className}`}
      style={{
        borderRadius: "3px",
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <clipPath id="uk-clip-flags">
        <rect width="600" height="400" rx="4" />
      </clipPath>
      <g clipPath="url(#uk-clip-flags)">
        <rect width="600" height="400" fill="#012169" />
        <path d="M0 0l600 400M600 0L0 400" stroke="#ffffff" strokeWidth="60" />
        <path d="M0 0l600 400M600 0L0 400" stroke="#C8102E" strokeWidth="35" />
        <path d="M0 0l300 200M600 0L300 200M0 400l300-200M600 400L300 200" stroke="#012169" strokeWidth="15" />
        <path d="M300 0v400M0 200h600" stroke="#ffffff" strokeWidth="100" />
        <path d="M300 0v400M0 200h600" stroke="#C8102E" strokeWidth="60" />
      </g>
    </svg>
  );
}

export function FlagRussia({ width = 22, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 480"
      className={`flag-svg ${className}`}
      style={{
        borderRadius: "3px",
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <rect width="640" height="160" fill="#ffffff" />
      <rect y="160" width="640" height="160" fill="#0039a6" />
      <rect y="320" width="640" height="160" fill="#d52b1e" />
    </svg>
  );
}

export function FlagTurkey({ width = 22, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 1200 800"
      className={`flag-svg ${className}`}
      style={{
        borderRadius: "3px",
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <rect width="1200" height="800" fill="#e30a17" />
      <circle cx="400" cy="400" r="200" fill="#fff" />
      <circle cx="450" cy="400" r="160" fill="#e30a17" />
      <polygon
        points="650,320 668,376 728,376 680,412 698,468 650,432 602,468 620,412 572,376 632,376"
        fill="#fff"
        transform="rotate(90, 650, 400) translate(40, 0)"
      />
    </svg>
  );
}

export function FlagArabic({ width = 22, height = 15, className = "" }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 640 480"
      className={`flag-svg ${className}`}
      style={{
        borderRadius: "3px",
        display: "inline-block",
        verticalAlign: "middle",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        flexShrink: 0,
      }}
    >
      <rect width="640" height="480" fill="#006C35" />
      {/* Representing the script pattern */}
      <path d="M180,180 C240,140 280,210 340,180 C400,150 420,200 480,180" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" />
      <path d="M200,215 C260,180 290,240 360,215 C410,190 430,230 460,215" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
      {/* White sword pointing to the left */}
      <path d="M180,260 L440,260" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" />
      <path d="M425,240 L425,280" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

export function FlagIcon({ code, width = 22, height = 15, className = "" }) {
  if (code === "ka") return <FlagGeorgia width={width} height={height} className={className} />;
  if (code === "en") return <FlagUK width={width} height={height} className={className} />;
  if (code === "ru") return <FlagRussia width={width} height={height} className={className} />;
  if (code === "tr") return <FlagTurkey width={width} height={height} className={className} />;
  if (code === "ar") return <FlagArabic width={width} height={height} className={className} />;
  return null;
}
