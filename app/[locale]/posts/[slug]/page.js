import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import BlogCard from "../../../components/blog/BlogCard";
import TourGrid from "../../../components/site/TourGrid";
import { ArrowRightIcon, CalendarIcon, ClockIcon, WhatsAppIcon } from "../../../components/Icons";
import { getCachedTours, getCachedPlaces } from "../../../lib/server/cachedData";
import { toTourViews } from "../../../lib/tourView";
import { getTranslator } from "../../../lib/i18n/translate";
import { asLocalizedText } from "../../../lib/toursShared";
import { formatRegionName } from "../../../lib/placesMeta";
import { placePath } from "../../../lib/slugs";
import { whatsappHref } from "../../../lib/shared";
import { BLOG_SLUGS, articlePath, blogCardLabels, formatArticleDate, getArticle, localizeArticle, relatedArticles } from "../../../lib/blog";
import { blogUi } from "../../../lib/blog/ui";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../../lib/siteConfig";
import "../blog.css";
import "../../../styles/tour-card.css";

// Articles are code, so every slug is known at build time.
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const lang = getRequestLocale(locale);
  const a = localizeArticle(getArticle(slug), lang);
  if (!a) return {};
  const meta = buildLocalizedMetadata({
    path: articlePath(slug),
    lang,
    title: a.metaTitle || a.title,
    description: a.description,
    image: a.cover?.src,
  });
  return {
    ...meta,
    openGraph: { ...meta.openGraph, type: "article", publishedTime: a.published, modifiedTime: a.updated },
  };
}

function Figure({ photo, ui, priority = false, sizes }) {
  if (!photo) return null;
  return (
    <figure className="blog-figure">
      <Image
        src={photo.src}
        alt={photo.caption}
        width={photo.width}
        height={photo.height}
        sizes={sizes || "(max-width: 860px) 100vw, 760px"}
        priority={priority}
      />
      <figcaption>
        {photo.caption}
        <span className="blog-credit">
          {ui.photo}:{" "}
          <a href={photo.source} target="_blank" rel="noopener noreferrer nofollow">{photo.author}</a>
          {" · "}
          {photo.license}
        </span>
      </figcaption>
    </figure>
  );
}

export default async function ArticlePage({ params }) {
  const { locale, slug } = await params;
  const lang = getRequestLocale(locale);
  const a = localizeArticle(getArticle(slug), lang);
  if (!a) notFound();

  const ui = blogUi(lang);
  const t = getTranslator(lang);
  const [rawTours, places] = await Promise.all([
    getCachedTours().catch(() => []),
    getCachedPlaces().catch(() => []),
  ]);

  const placeById = new Map((places || []).map((place) => [place.id, place]));
  const articlePlaces = a.places.map((id) => placeById.get(id)).filter(Boolean);
  const tourIds = new Set(a.tours);
  const tours = toTourViews((rawTours || []).filter((tour) => tourIds.has(tour.id)), lang, places, t("tourBadges"))
    .sort((x, y) => a.tours.indexOf(x.id) - a.tours.indexOf(y.id));
  const related = relatedArticles(slug, lang);
  const labels = blogCardLabels(lang);

  const pageUrl = `${SITE_URL}/${lang}${articlePath(slug)}`;
  const waHref = whatsappHref(ui.waText(a.title));
  const shareText = encodeURIComponent(a.title);
  const shareUrl = encodeURIComponent(pageUrl);
  const shares = [
    { name: "WhatsApp", href: `https://wa.me/?text=${shareText}%20${shareUrl}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${shareUrl}&text=${shareText}` },
    { name: "X", href: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}` },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        headline: a.title,
        description: a.description,
        image: a.photos.map((photo) => `${SITE_URL}${photo.src}`),
        datePublished: a.published,
        dateModified: a.updated,
        inLanguage: lang,
        articleSection: ui.categories[a.category],
        author: { "@type": "Organization", name: "GeorgiaTrips", url: SITE_URL },
        publisher: { "@id": `${SITE_URL}/#organization` },
        mainEntityOfPage: pageUrl,
        url: pageUrl,
        about: articlePlaces.map((place) => ({
          "@type": "TouristAttraction",
          name: asLocalizedText(place.title, "en"),
          url: `${SITE_URL}/${lang}${placePath(place)}`,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: a.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ui.home, item: `${SITE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: ui.crumb, item: `${SITE_URL}/${lang}/posts` },
          { "@type": "ListItem", position: 3, name: a.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar active="posts" overlay={false} />
      <main className="blog-page blog-article-page">
        <article>
          <header className="blog-article-head">
            <div className="blog-wrap blog-wrap--narrow">
              <nav className="blog-crumbs" aria-label="Breadcrumb">
                <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
                <span aria-hidden="true">/</span>
                <Link href={getLocalizedHref("/posts", lang)}>{ui.crumb}</Link>
              </nav>
              <span className="blog-chip">{ui.categories[a.category]}</span>
              <h1>{a.title}</h1>
              <p className="blog-lede">{a.excerpt}</p>
              <div className="blog-byline">
                <span className="blog-byline-author">{ui.author}</span>
                <span className="blog-meta">
                  <CalendarIcon size={15} />
                  <time dateTime={a.updated}>{formatArticleDate(a.updated, lang)}</time>
                </span>
                <span className="blog-meta">
                  <ClockIcon size={15} />
                  {ui.minRead(a.readMinutes)}
                </span>
              </div>
            </div>
          </header>

          <div className="blog-wrap blog-cover">
            <Figure photo={a.cover} ui={ui} priority sizes="(max-width: 1200px) 100vw, 1200px" />
          </div>

          <div className="blog-wrap blog-article-layout">
            <aside className="blog-aside" aria-label={ui.toc}>
              <div className="blog-toc">
                <p className="blog-toc-title">{ui.toc}</p>
                <ol>
                  {a.sections.map((section) => (
                    <li key={section.id}><a href={`#${section.id}`}>{section.h}</a></li>
                  ))}
                  <li><a href="#tips">{ui.tipsTitle}</a></li>
                  <li><a href="#faq">{ui.faqTitle}</a></li>
                </ol>
              </div>
              <div className="blog-aside-cta">
                <p>{ui.ctaTitle}</p>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="blog-btn blog-btn--wa">
                  <WhatsAppIcon size={18} />
                  WhatsApp
                </a>
              </div>
            </aside>

            <div className="blog-body">
              {a.intro.map((text, index) => (
                <p key={index} className={index === 0 ? "blog-intro" : undefined}>{text}</p>
              ))}

              {a.sections.map((section) => (
                <section key={section.id} id={section.id} className="blog-section">
                  <h2>{section.h}</h2>
                  {section.p.map((text, index) => <p key={index}>{text}</p>)}
                  {section.list?.length > 0 && (
                    <ul className="blog-list-points">
                      {section.list.map((item, index) => {
                        const [head, ...tail] = item.split(" — ");
                        return (
                          <li key={index}>
                            {tail.length ? <><strong>{head}</strong> — {tail.join(" — ")}</> : item}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {[].concat(section.photo ?? []).filter((index) => index > 0).map((index) => (
                    <Figure key={index} photo={a.photos[index]} ui={ui} />
                  ))}
                </section>
              ))}

              <section id="tips" className="blog-tips">
                <h2>{ui.tipsTitle}</h2>
                <ul>
                  {a.tips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              </section>

              <section id="faq" className="blog-faq">
                <h2>{ui.faqTitle}</h2>
                {a.faqs.map((faq, index) => (
                  <details key={index} open={index === 0}>
                    <summary>{faq.q}</summary>
                    <p>{faq.a}</p>
                  </details>
                ))}
              </section>

              <div className="blog-share">
                <span>{ui.share}:</span>
                {shares.map((share) => (
                  <a key={share.name} href={share.href} target="_blank" rel="noopener noreferrer">{share.name}</a>
                ))}
              </div>
            </div>
          </div>
        </article>

        <section className="blog-cta-band">
          <div className="blog-wrap blog-cta-inner">
            <div>
              <h2>{ui.ctaTitle}</h2>
              <p>{ui.ctaText}</p>
            </div>
            <div className="blog-cta-actions">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="blog-btn blog-btn--wa">
                <WhatsAppIcon size={18} />
                {ui.ctaWhatsApp}
              </a>
              <Link href={getLocalizedHref("/tours", lang)} className="blog-btn blog-btn--light">
                {ui.ctaTours}
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
        </section>

        {tours.length > 0 && (
          <section className="blog-wrap blog-block" aria-labelledby="blog-tours-title">
            <header className="blog-section-head">
              <h2 id="blog-tours-title">{ui.toursTitle}</h2>
              <p>{ui.toursDesc}</p>
            </header>
            <TourGrid items={tours.map((tour) => ({ tour }))} lang={lang} t={t} />
          </section>
        )}

        {articlePlaces.length > 0 && (
          <section className="blog-wrap blog-block" aria-labelledby="blog-places-title">
            <header className="blog-section-head">
              <h2 id="blog-places-title">{ui.placesTitle}</h2>
              <p>{ui.placesDesc}</p>
            </header>
            <ul className="blog-places">
              {articlePlaces.map((place) => {
                const name = asLocalizedText(place.title, lang);
                return (
                  <li key={place.id}>
                    <Link href={getLocalizedHref(placePath(place), lang)} className="blog-place" prefetch={false}>
                      <span className="blog-place-media">
                        {place.img && <Image src={place.img} alt="" fill sizes="(max-width: 640px) 50vw, 240px" style={{ objectFit: "cover" }} />}
                      </span>
                      <span className="blog-place-text">
                        <strong>{name}</strong>
                        {place.region && <small>{formatRegionName(place.region, lang)}</small>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {related.length > 0 && (
          <section className="blog-wrap blog-block" aria-labelledby="blog-related-title">
            <header className="blog-section-head">
              <h2 id="blog-related-title">{ui.relatedTitle}</h2>
            </header>
            <div className="blog-grid">
              {related.map((card) => <BlogCard key={card.slug} card={card} labels={labels} />)}
            </div>
          </section>
        )}

        <section className="blog-wrap blog-credits" aria-labelledby="blog-credits-title">
          <h2 id="blog-credits-title">{ui.creditsTitle}</h2>
          <p>{ui.creditsNote}</p>
          <ol>
            {a.photos.map((photo) => (
              <li key={photo.src}>
                {photo.caption} — <a href={photo.source} target="_blank" rel="noopener noreferrer nofollow">{photo.author}</a>, {photo.license}
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
