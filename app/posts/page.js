import React, { Suspense } from "react";
import { getCachedPosts } from "../lib/server/cachedData";
import PostsCatalogClient from "../components/posts/PostsCatalogClient";
import "./posts.css";

export const metadata = {
  title: "ბლოგი და მოგზაურთა შთაბეჭდილებები | GeorgiaTrips.ge",
  description: "საქართველოში მოგზაურობის გამოცდილება, რჩევები, ისტორიები და ფოტოები რეალური მოგზაურებისა და გიდებისგან.",
  alternates: {
    canonical: "https://georgiatrips.ge/posts",
    languages: {
      ka: "https://georgiatrips.ge/ka/posts",
      en: "https://georgiatrips.ge/en/posts",
      ru: "https://georgiatrips.ge/ru/posts",
    },
  },
  openGraph: {
    title: "ბლოგი & მოგზაურთა ისტორიები — GeorgiaTrips",
    description: "გაეცანით მოგზაურების რჩევებსა და შთაბეჭდილებებს საქართველოს შესახებ.",
    url: "https://georgiatrips.ge/posts",
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "https://georgiatrips.ge/mestia.webp",
        width: 1200,
        height: 630,
        alt: "მოგზაურთა შთაბეჭდილებები — GeorgiaTrips",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ბლოგი & მოგზაურთა ისტორიები — GeorgiaTrips",
    description: "საქართველოში მოგზაურობის რეალური გამოცდილება და რჩევები.",
    images: ["https://georgiatrips.ge/mestia.webp"],
  },
};

export default async function PostsPage() {
  const posts = await getCachedPosts();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": "https://georgiatrips.ge/posts#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "მთავარი",
            "item": "https://georgiatrips.ge",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "ბლოგი & პოსტები",
            "item": "https://georgiatrips.ge/posts",
          },
        ],
      },
      {
        "@type": "Blog",
        "@id": "https://georgiatrips.ge/posts#blog",
        "name": "GeorgiaTrips Travel Community Blog",
        "description": "საქართველოს შესახებ მოგზაურთა ბლოგი და პოსტები",
        "blogPost": (posts || []).slice(0, 20).map((post) => ({
          "@type": "BlogPosting",
          "headline": post.title || post.content?.slice(0, 70) || "მოგზაურის პოსტი",
          "articleBody": post.content || "",
          "image": post.img || "https://georgiatrips.ge/mestia.webp",
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
      <Suspense fallback={<div className="posts-loading-state"><p>იტვირთება...</p></div>}>
        <PostsCatalogClient initialPosts={posts} />
      </Suspense>
    </>
  );
}
