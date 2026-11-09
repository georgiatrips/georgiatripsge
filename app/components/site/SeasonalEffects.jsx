"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { whenIdle } from "../../lib/whenIdle";

// Light seasonal decoration (snow, petals, sparkles, leaves) switched on from
// the admin (settings/site_effects). Built to stay out of the way:
//  - starts only after the page is idle, and reads the setting at most once
//    every few minutes per visitor (sessionStorage cache);
//  - a handful of small, see-through particles on one canvas, ~30 fps,
//    paused while the tab is hidden;
//  - pointer-events: none and below the header, menus and pop-ups, so nothing
//    becomes unclickable or hidden;
//  - nothing at all for visitors who ask for reduced motion, and never in the
//    admin, login or booking pages.

export const SITE_EFFECTS_CACHE_KEY = "gt-site-effects";
const CACHE_TTL = 5 * 60 * 1000;
const EXCLUDED = /^\/(admin|login|booking)(\/|$)/;
const HOME = /^\/(ka|en|ru|tr|ar)?\/?$/;

// [desktop, phone] particle counts.
const COUNTS = { rare: [14, 7], normal: [26, 13] };

async function loadSettings() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(SITE_EFFECTS_CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.settings;
  } catch {}
  const { getSiteEffects } = await import("../../lib/siteEffects");
  const settings = await getSiteEffects();
  try {
    sessionStorage.setItem(SITE_EFFECTS_CACHE_KEY, JSON.stringify({ at: Date.now(), settings }));
  } catch {}
  return settings;
}

export default function SeasonalEffects() {
  const pathname = usePathname() || "/";
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      loadSettings()
        .then((s) => { if (!cancelled) setSettings(s); })
        .catch(() => {});
    }, 4000);
    return () => { cancelled = true; cancelIdle(); };
  }, []);

  if (!settings || settings.effect === "off") return null;
  if (EXCLUDED.test(pathname)) return null;
  if (settings.pages === "home" && !HOME.test(pathname)) return null;
  return <EffectCanvas effect={settings.effect} density={settings.density} />;
}

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ---- Snow sprites (drawn once, then reused) --------------------------------

const FLAKE_VARIANTS = 3;
const SPRITE = 64; // px; drawn scaled down, so edges stay smooth
let snowSprites = null;

function makeCanvas(size) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  return c;
}

// One arm of a crystal: a spine with side branches, mirrored on both sides.
// `branches` = [[position along the arm 0..1, branch length 0..1], ...].
function armPath(ctx, len, branches) {
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -len);
  for (const [at, size] of branches) {
    const y = -len * at;
    const b = len * size;
    ctx.moveTo(0, y);
    ctx.lineTo(-b * 0.75, y - b * 0.65);
    ctx.moveTo(0, y);
    ctx.lineTo(b * 0.75, y - b * 0.65);
  }
}

const FLAKE_SHAPES = [
  { branches: [[0.42, 0.32], [0.7, 0.22]], tip: 0 },
  { branches: [[0.35, 0.22], [0.58, 0.3], [0.8, 0.16]], tip: 0 },
  { branches: [[0.5, 0.38]], tip: 0.09 },
];

function drawFlake(shape) {
  const c = makeCanvas(SPRITE);
  const ctx = c.getContext("2d");
  const len = SPRITE * 0.44;
  ctx.translate(SPRITE / 2, SPRITE / 2);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const path = () => {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      armPath(ctx, len, shape.branches);
      if (shape.tip) {
        ctx.moveTo(len * shape.tip, -len);
        ctx.arc(0, -len, len * shape.tip, 0, Math.PI * 2);
      }
      ctx.restore();
    }
  };
  // A soft blue-grey edge first so the flake is visible on white sections,
  // then the white crystal on top, then a small glowing centre.
  path();
  ctx.strokeStyle = "rgba(105, 135, 170, 0.55)";
  ctx.lineWidth = 5;
  ctx.stroke();
  path();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, len * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return c;
}

function drawSoftDot() {
  const c = makeCanvas(32);
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255, 255, 255, 1)");
  g.addColorStop(0.45, "rgba(255, 255, 255, 0.95)");
  g.addColorStop(0.62, "rgba(160, 182, 210, 0.45)");
  g.addColorStop(1, "rgba(160, 182, 210, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return c;
}

function getSnowSprites() {
  if (!snowSprites) {
    snowSprites = { flakes: FLAKE_SHAPES.slice(0, FLAKE_VARIANTS).map(drawFlake), dot: drawSoftDot() };
  }
  return snowSprites;
}

const KINDS = {
  // A mix of six-armed crystal snowflakes (~40%) and soft round snow. Each
  // particle has a depth: nearer ones are bigger, faster and more opaque.
  // Shapes are drawn once into small sprites and only copied every frame.
  snow: {
    make: (w, h, initial) => {
      const z = rand(0.55, 1);
      const crystal = Math.random() < 0.4;
      return {
        x: rand(0, w), y: initial ? rand(-h, h) : rand(-40, -10), z, crystal,
        sprite: crystal ? Math.floor(Math.random() * FLAKE_VARIANTS) : -1,
        r: crystal ? rand(5, 9) * z : rand(1.8, 3.6) * z,
        vy: (crystal ? rand(0.4, 0.75) : rand(0.45, 0.95)) * z,
        sway: rand(0.4, 1.1), phase: rand(0, 6.28),
        rot: rand(0, 6.28), vr: rand(-0.012, 0.012),
        a: rand(0.65, 0.95) * (0.55 + 0.45 * z),
      };
    },
    step: (p, t) => {
      p.y += p.vy;
      p.x += Math.sin(t * 0.0011 + p.phase) * 0.35 * p.sway;
      p.rot += p.vr;
    },
    draw: (ctx, p, t) => {
      const sprites = getSnowSprites();
      ctx.globalAlpha = p.a;
      if (!p.crystal) {
        const d = p.r * 2.6;
        ctx.drawImage(sprites.dot, p.x - d / 2, p.y - d / 2, d, d);
        return;
      }
      const d = p.r * 2;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // Slight tumble, as if the flake turns in the air.
      ctx.scale(1, 0.78 + 0.22 * Math.sin(t * 0.0015 + p.phase));
      ctx.drawImage(sprites.flakes[p.sprite], -d / 2, -d / 2, d, d);
      ctx.restore();
    },
  },
  petals: {
    make: (w, h, initial) => ({
      x: rand(0, w), y: initial ? rand(-h, h) : rand(-40, -10),
      r: rand(4, 7), vy: rand(0.45, 1), sway: rand(0.6, 1.4), phase: rand(0, 6.28),
      rot: rand(0, 6.28), vr: rand(-0.02, 0.02), a: rand(0.55, 0.8), color: pick(["#f7b6c8", "#f49ab3", "#f9c9d6"]),
    }),
    step: (p, t) => { p.y += p.vy; p.x += Math.sin(t * 0.001 + p.phase) * 0.5 * p.sway; p.rot += p.vr; },
    draw: (ctx, p) => {
      ctx.globalAlpha = p.a;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    },
  },
  sparkles: {
    make: (w, h, initial) => ({
      x: rand(0, w), y: initial ? rand(0, h * 2) : h + rand(10, 40),
      r: rand(1.2, 2.6), vy: -rand(0.2, 0.5), sway: rand(0.3, 0.9), phase: rand(0, 6.28), color: pick(["#f5c542", "#ffd97a", "#f2b632"]),
    }),
    step: (p, t) => { p.y += p.vy; p.x += Math.sin(t * 0.0009 + p.phase) * 0.25 * p.sway; },
    draw: (ctx, p, t) => {
      ctx.globalAlpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.003 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    },
    gone: (p) => p.y < -20,
  },
  leaves: {
    make: (w, h, initial) => ({
      x: rand(0, w), y: initial ? rand(-h, h) : rand(-40, -10),
      r: rand(6, 10), vy: rand(0.5, 1.05), sway: rand(0.8, 1.6), phase: rand(0, 6.28),
      rot: rand(0, 6.28), vr: rand(-0.025, 0.025), a: rand(0.6, 0.85), color: pick(["#d97a2b", "#c4551f", "#e3a33b", "#a8531c"]),
    }),
    step: (p, t) => { p.y += p.vy; p.x += Math.sin(t * 0.0011 + p.phase) * 0.6 * p.sway; p.rot += p.vr; },
    draw: (ctx, p) => {
      ctx.globalAlpha = p.a;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, -p.r);
      ctx.quadraticCurveTo(p.r * 0.75, 0, 0, p.r);
      ctx.quadraticCurveTo(-p.r * 0.75, 0, 0, -p.r);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    },
  },
};

function EffectCanvas({ effect, density }) {
  const ref = useRef(null);

  useEffect(() => {
    const kind = KINDS[effect];
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!kind || !ctx) return undefined;

    let w = 0;
    let h = 0;
    let particles = [];
    let raf = 0;
    let last = 0;
    const [desktop, phone] = COUNTS[density] || COUNTS.rare;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? phone : desktop;
      while (particles.length < count) particles.push(kind.make(w, h, true));
      particles.length = count;
    };

    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; // ~30 fps is plenty for slow particles
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        kind.step(p, t);
        const gone = kind.gone ? kind.gone(p) : p.y > h + 20;
        if (gone || p.x < -30 || p.x > w + 30) {
          particles[i] = kind.make(w, h, false);
          continue;
        }
        kind.draw(ctx, p, t);
      }
      ctx.globalAlpha = 1;
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [effect, density]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 50 }}
    />
  );
}
