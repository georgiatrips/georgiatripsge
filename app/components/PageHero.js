import Image from "next/image";

// Inner-page hero (tours, places, transfers, hotels, articles).
//
// The previous version ran a scroll-linked parallax in JavaScript over a
// 12%-oversized, scaled background, which forced the browser to download a
// very wide image and repaint it on every scroll frame. The image is now a
// plain decorative background under a scrim, sized to the viewport and capped
// by next.config deviceSizes, so the title (the LCP element) paints fast.
//
// `compact` is for catalog pages where the results, not the banner, are the
// point: the header stays short so filters and the first cards are visible.
export default function PageHero({
  kicker = "",
  title = "",
  subtitle = "",
  image = "/mestia.webp",
  alt = "",
  children = null,
  compact = false,
}) {
  return (
    <header className={`page-hero${compact ? " page-hero--compact" : ""}`}>
      <div className="page-hero-bg" aria-hidden={alt ? undefined : "true"}>
        <Image src={image} alt={alt} fill sizes="100vw" quality={60} loading="eager" fetchPriority="high" />
      </div>
      <div className="page-hero-scrim" aria-hidden="true" />

      <div className="page-hero-inner">
        <div className="page-hero-content">
          {kicker && <p className="page-hero-kicker">{kicker}</p>}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
          {children}
        </div>
      </div>
    </header>
  );
}
