/**
 * SEO Head Injector for Georgia Trips
 * ─────────────────────────────────────
 * Dynamically injects multilingual Open Graph, Twitter Cards,
 * hreflang, canonical, structured data (JSON-LD) and AI-optimized
 * meta tags into any page's <head>.
 *
 * Usage: Include this script in <head> AFTER the page's own <title> tag.
 *        <script src="seo-head.js"></script>
 *
 * It reads the existing <title> and <meta name="description"> to
 * generate the full SEO envelope.
 */
(function injectSEO() {
  'use strict';

  const SITE  = 'https://georgiatrips.ge';
  const LOGO  = SITE + '/logo.png';
  const PHONE = '+995504220020';
  const EMAIL = 'georgiatrips5@gmail.com';
  const LANGS = ['ka','en','ru','tr','ar','he','uk'];

  // Read existing title & description from the page
  const pageTitle = document.title || 'Georgia Trips';
  const descMeta  = document.querySelector('meta[name="description"]');
  const pageDesc  = descMeta ? descMeta.content : '';
  const pagePath  = location.pathname.replace(/\/index\.html$/, '/');
  const pageURL   = SITE + pagePath;

  // Helper to create & append meta/link elements
  function meta(attrs) {
    const el = document.createElement('meta');
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    document.head.appendChild(el);
  }
  function link(attrs) {
    const el = document.createElement('link');
    Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v));
    document.head.appendChild(el);
  }

  // Skip if SEO was already injected (e.g. index.html has inline SEO)
  if (document.querySelector('link[rel="canonical"]')) return;

  // ── CANONICAL ──
  link({ rel: 'canonical', href: pageURL });

  // ── APPLE TOUCH ICON ──
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    link({ rel: 'apple-touch-icon', href: 'logo.png' });
  }

  // ── ROBOTS ──
  meta({ name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' });
  meta({ name: 'author', content: 'Georgia Trips' });

  // ── HREFLANG ──
  LANGS.forEach(lang => link({ rel: 'alternate', hreflang: lang, href: pageURL }));
  link({ rel: 'alternate', hreflang: 'x-default', href: pageURL });

  // ── OPEN GRAPH ──
  meta({ property: 'og:type',      content: 'website' });
  meta({ property: 'og:site_name', content: 'Georgia Trips' });
  meta({ property: 'og:title',     content: pageTitle });
  meta({ property: 'og:description', content: pageDesc });
  meta({ property: 'og:url',       content: pageURL });
  meta({ property: 'og:image',     content: LOGO });
  meta({ property: 'og:image:width',  content: '512' });
  meta({ property: 'og:image:height', content: '512' });
  meta({ property: 'og:locale',    content: 'ka_GE' });
  ['en_US','ru_RU','tr_TR','ar_SA','he_IL','uk_UA'].forEach(l =>
    meta({ property: 'og:locale:alternate', content: l })
  );

  // ── TWITTER CARD ──
  meta({ name: 'twitter:card',        content: 'summary_large_image' });
  meta({ name: 'twitter:title',       content: pageTitle });
  meta({ name: 'twitter:description', content: pageDesc });
  meta({ name: 'twitter:image',       content: LOGO });

  // ── GEO ──
  meta({ name: 'geo.region',    content: 'GE-AJ' });
  meta({ name: 'geo.placename', content: 'Batumi, Georgia' });
  meta({ name: 'geo.position',  content: '41.6494315;41.6436765' });
  meta({ name: 'ICBM',          content: '41.6494315, 41.6436765' });

  // ── AI / LLM META ──
  meta({ name: 'ai-content-description', content: 'Georgia Trips – travel company in Batumi, Georgia. Tours, transport, guides in 7 languages. Phone: ' + PHONE + '. Email: ' + EMAIL });

  // ── JSON-LD (lightweight per-page breadcrumb + organization reference) ──
  const breadcrumbs = [{ name: 'Home', url: SITE + '/' }];
  const h1 = document.querySelector('h1');
  if (h1 && pagePath !== '/') {
    breadcrumbs.push({ name: h1.textContent.trim(), url: pageURL });
  }

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'name': b.name,
          'item': b.url
        }))
      },
      {
        '@type': 'WebPage',
        '@id': pageURL + '#webpage',
        'url': pageURL,
        'name': pageTitle,
        'description': pageDesc,
        'isPartOf': { '@id': SITE + '/#website' },
        'about': { '@id': SITE + '/#organization' },
        'inLanguage': LANGS
      }
    ]
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonld);
  document.head.appendChild(script);
})();
