"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { formatLocationTag } from "../../lib/toursFirestore";
import { BrandLogo } from "../../lib/shared";

export default function HomeGallerySection({ posts = [] }) {
  const { t } = useLanguage();

  return (
    <section className="section gallery-bg" id="gallery">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("popular.galleryEyebrow")}</span>
          <h2 className="section-title">{t("popular.galleryTitle")}</h2>
          <p className="section-desc">{t("popular.galleryDesc")}</p>
          <div className="gold-line"></div>
        </div>

        {posts.length > 0 ? (
          <div className="posts-home-grid">
            {posts.map((post) => (
              <article key={post.id} className="facebook-post-card">
                <div className="fb-post-header">
                  <div className="fb-author-wrap">
                    <div className="fb-avatar">
                      {post.avatar ? <img src={post.avatar} alt="" className="posts-author-avatar" /> : <BrandLogo width={40} height={40} />}
                    </div>
                    <div className="fb-author-info">
                      <div className="fb-name-row">
                        <strong className="fb-author-name">{post.author}</strong>
                        {post.verified && <span className="fb-verified-badge" title={t("popular.verifiedBadge")}>✓</span>}
                      </div>
                      <div className="fb-meta-row">
                        <span className="fb-time">{post.timeTag}</span>
                        <span className="fb-dot">•</span>
                        <span className="fb-public-icon" title={t("popular.publicPost")}>🌐</span>
                        <span className="fb-dot">•</span>
                        <span className="fb-location-tag">{formatLocationTag(post.location)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="fb-post-body">
                  <p className="fb-post-text">{post.content && post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}</p>
                  {post.hashtags && <p className="fb-post-hashtags">{post.hashtags}</p>}
                  {post.feeling && <span className="post-feeling-badge">{post.feeling}</span>}
                </div>

                {post.img && (
                  <div className="fb-post-media">
                    <img src={post.img} alt={post.title} className="fb-media-img" />
                  </div>
                )}

                <div className="fb-reactions-bar">
                  <div className="fb-reactions-icons">
                    <svg className="fb-like-summary-icon" width="18" height="18" viewBox="0 0 24 24" fill="#29b2b7" stroke="#29b2b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span className="fb-reactions-count">{post.initialLikes}</span>
                  </div>
                  <div className="fb-counts-group">
                    <span className="fb-count-item">{(post.comments || []).length} {t("popular.comments")}</span>
                    <span className="fb-dot">•</span>
                    <span className="fb-count-item">{post.sharesCount} {t("popular.shares")}</span>
                  </div>
                </div>

                <div className="fb-action-btns">
                  <a href="/posts" className="fb-action-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                     <span>{t("popular.like")}</span>
                   </a>
                   <a href="/posts" className="fb-action-btn">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                     </svg>
                     <span>{t("popular.comments")}</span>
                   </a>
                   <a href="/posts" className="fb-action-btn">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                       <circle cx="18" cy="5" r="3"/>
                       <circle cx="6" cy="12" r="3"/>
                       <circle cx="18" cy="19" r="3"/>
                       <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                       <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                     </svg>
                     <span>{t("popular.shares")}</span>
                   </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="posts-empty-state" style={{ margin: "0 auto" }}>
            <h2>{t("popular.emptyPostsTitle")}</h2>
            <p>{t("popular.emptyPostsDesc")}</p>
          </div>
        )}

        <div className="social-feed-more-wrap">
          <a href="/posts" className="social-feed-more-btn" style={{ textDecoration: "none" }}>
            {t("popular.viewAll")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
