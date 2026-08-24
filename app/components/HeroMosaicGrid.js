"use client";

import React, { useMemo } from "react";

const COLS = 18;
const ROWS = 14; // 18 x 14 = 252 tiles

export default function HeroMosaicGrid({ isTransitioning, currentSlide, outgoingImage }) {
  const tiles = useMemo(() => {
    const list = [];
    for (let r = 0; r < ROWS; r++) {
      const verticalFactor = Math.max(0, 1 - (r / (ROWS - 1)));
      const baseOpacity = Math.pow(verticalFactor, 1.6) * 0.88;
      const baseBlur = Math.round(verticalFactor * 16);

      for (let c = 0; c < COLS; c++) {
        const centerDist = Math.hypot(c - COLS / 2, r - ROWS / 2);
        const waveDelay = Math.round((c * 24 + r * 28 + centerDist * 18) % 650);

        list.push({
          id: `${r}-${c}`,
          row: r,
          col: c,
          baseOpacity: baseOpacity.toFixed(3),
          baseBlur: `${baseBlur}px`,
          delayMs: `${waveDelay}ms`,
          backgroundPosition: `${(c / (COLS - 1)) * 100}% ${(r / (ROWS - 1)) * 100}%`,
        });
      }
    }
    return list;
  }, []);

  if (!isTransitioning) return null;

  return (
    <div
      className="hero-mosaic-grid is-shuttering"
      aria-hidden="true"
    >
      {tiles.map((tile) => (
        <div
          key={`${tile.id}-${currentSlide}`}
          className="hero-mosaic-box"
          style={{
            "--base-opacity": tile.baseOpacity,
            "--base-blur": tile.baseBlur,
            "--shutter-delay": tile.delayMs,
            "--tile-image": `url("${outgoingImage}")`,
            "--tile-position": tile.backgroundPosition,
          }}
        />
      ))}
    </div>
  );
}
