// Brand loader: the real logo (public/logo.webp, 243×250) paints itself in
// like its brush strokes — the blue bar sweeps to the plane, the teal stroke
// runs down, the gold arrowhead appears — then a shine passes over it and the
// loop starts again. Each part is revealed by an animated mask shape.
// CSS animations only (styles/motion.css, .gt-loader): SMIL would stay frozen
// until the streamed document finishes loading.
export default function Loading() {
  return (
    <div className="gt-loader" role="status" aria-live="polite">
      <svg className="gt-loader-logo" viewBox="0 0 243 250" aria-hidden="true">
        <defs>
          <mask id="gt-loader-paint" maskUnits="userSpaceOnUse" x="-20" y="-20" width="283" height="290">
            {/* Blue bar, left end → corner with the plane. */}
            <path className="gt-loader-stroke gt-loader-stroke--bar" d="M6 84 Q110 76 226 22" pathLength="100" strokeWidth="66" />
            {/* Teal stroke, corner → bottom. */}
            <path className="gt-loader-stroke gt-loader-stroke--down" d="M228 22 L164 242" pathLength="100" strokeWidth="58" />
            {/* Gold arrowhead. */}
            <path className="gt-loader-arrow" d="M58 122 L156 96 L136 200 Z" />
          </mask>
          {/* Only the logo's own pixels catch the shine. */}
          <mask id="gt-loader-shape" style={{ maskType: "alpha" }}>
            <image href="/logo.webp" width="243" height="250" />
          </mask>
          <linearGradient id="gt-loader-shine" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="gt-loader-mark">
          <g mask="url(#gt-loader-paint)">
            <image href="/logo.webp" width="243" height="250" />
          </g>
          <g mask="url(#gt-loader-shape)">
            <g transform="rotate(20 121 125)">
              <rect className="gt-loader-shine" x="-90" y="-40" width="70" height="330" fill="url(#gt-loader-shine)" />
            </g>
          </g>
        </g>
      </svg>
      <span className="gt-brand-word gt-loader-word" aria-hidden="true">Georgia<b>Trips</b></span>
      <span className="gt-loader-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="gt-sr-only">Loading…</span>
    </div>
  );
}
