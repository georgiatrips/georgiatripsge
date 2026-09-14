import React, { Suspense } from "react";
import { getCachedPosts } from "../../lib/server/cachedData";
import PostsCatalogClient from "../../components/posts/PostsCatalogClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import "./posts.css";

const COPY = {
  ka: { title: "ბლოგი და მოგზაურთა შთაბეჭდილებები | GeorgiaTrips", description: "საქართველოში მოგზაურობის გამოცდილება, რჩევები, ისტორიები და ფოტოები რეალური მოგზაურებისა და გიდებისგან.", home: "მთავარი", crumb: "ბლოგი & პოსტები" },
  en: { title: "Travel Blog & Stories | GeorgiaTrips", description: "Travel experiences, tips, stories and photos from real travelers and guides in Georgia.", home: "Home", crumb: "Blog & Posts" },
  ru: { title: "Блог и рассказы путешественников | GeorgiaTrips", description: "Опыт путешествий, советы, истории и фото от реальных путешественников и гидов по Грузии.", home: "Главная", crumb: "Блог и посты" },
  tr: { title: "Seyahat Blogu ve Hikayeler | GeorgiaTrips", description: "Gürcistan'daki gerçek gezginler ve rehberlerden seyahat deneyimleri, ipuçları, hikayeler ve fotoğraflar.", home: "Ana Sayfa", crumb: "Blog ve Gönderiler" },
  ar: { title: "مدونة السفر والقصص | GeorgiaTrips", description: "تجارب السفر والنصائح والقصص والصور من مسافرين ومرشدين حقيقيين في جورجيا.", home: "الرئيسية", crumb: "المدونة والمنشورات" },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  return buildLocalizedMetadata({ path: "/posts", lang, title: c.title, description: c.description, image: "/mestia.webp" });
}

export default async function PostsPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  const posts = await getCachedPosts();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/posts#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": c.home, "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": c.crumb, "item": `${SITE_URL}/${lang}/posts` },
        ],
      },
      {
        "@type": "Blog",
        "@id": `${SITE_URL}/${lang}/posts#blog`,
        "name": "GeorgiaTrips Travel Community Blog",
        "description": c.description,
        "blogPost": (posts || []).slice(0, 20).map((post) => ({
          "@type": "BlogPosting",
          "headline": post.title || post.content?.slice(0, 70) || "Traveler post",
          "articleBody": post.content || "",
          "image": post.img || `${SITE_URL}/mestia.webp`,
          "author": {
            "@type": "Person",
            "name": post.author || "GeorgiaTrips Traveler",
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Suspense fallback={<div className="posts-loading-state"><p>...</p></div>}>
        <PostsCatalogClient initialPosts={posts} />
      </Suspense>
    </>
  );
}
