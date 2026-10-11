import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BlogCard from "../../components/blog/BlogCard";
import BlogFilter from "../../components/blog/BlogFilter";
import PostsCatalogClient from "../../components/posts/PostsCatalogClient";
import { getCachedPosts } from "../../lib/server/cachedData";
import { BLOG_CATEGORIES, articleCards, blogCardLabels } from "../../lib/blog";
import { blogUi } from "../../lib/blog/ui";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import "./posts.css";
import "./blog.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const ui = blogUi(lang);
  const cover = articleCards(lang)[0]?.cover?.src;
  return buildLocalizedMetadata({ path: "/posts", lang, title: ui.metaTitle, description: ui.metaDescription, image: cover || "/mestia.webp" });
}

export default async function PostsPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const ui = blogUi(lang);
  const labels = blogCardLabels(lang);
  const cards = articleCards(lang);
  const [featured, ...rest] = cards;
  const posts = await getCachedPosts();

  const pageUrl = `${SITE_URL}/${lang}/posts`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ui.home, item: `${SITE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: ui.crumb, item: pageUrl },
        ],
      },
      {
        "@type": "Blog",
        "@id": `${pageUrl}#blog`,
        name: ui.hubTitle,
        description: ui.metaDescription,
        url: pageUrl,
        inLanguage: lang,
        publisher: { "@id": `${SITE_URL}/#organization` },
        blogPost: cards.map((card) => ({
          "@type": "BlogPosting",
          headline: card.title,
          description: card.excerpt,
          url: `${SITE_URL}${card.href}`,
          datePublished: card.published,
          image: card.cover ? `${SITE_URL}${card.cover.src}` : undefined,
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar active="posts" overlay={false} />
      <main className="blog-page">
        <header className="blog-hub-head">
          <div className="blog-wrap">
            <p className="blog-kicker">{ui.kicker}</p>
            <h1>{ui.hubTitle}</h1>
            <p className="blog-lede">{ui.hubSubtitle}</p>
          </div>
        </header>

        {featured && (
          <section className="blog-wrap blog-featured" aria-label={ui.featured}>
            <BlogCard card={featured} labels={labels} featured eager headingLevel={2} />
          </section>
        )}

        {rest.length > 0 && (
          <section className="blog-wrap blog-list" aria-labelledby="blog-list-title">
            <header className="blog-section-head">
              <h2 id="blog-list-title">{ui.latest}</h2>
            </header>
            <BlogFilter cards={rest} categories={BLOG_CATEGORIES} labels={labels} />
          </section>
        )}

        <PostsCatalogClient initialPosts={posts} title={ui.communityTitle} text={ui.communityText} />
      </main>
      <Footer />
    </>
  );
}
