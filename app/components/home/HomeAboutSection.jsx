"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "../../lib/i18n/LanguageContext";

export default function HomeAboutSection() {
  const { t } = useLanguage();

  return (
    <section className="about-section" id="about" aria-label="about">
      <div className="about-inner">
        <div className="about-photo-wrap">
          <div className="about-photo-frame">
            <Image
              src="/profile.png"
              alt="GeorgiaTrips — პროფესიონალი სამოგზაურო კომპანია საქართველოში"
              fill
              style={{ objectFit: "cover", objectPosition: "center 35%" }}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="about-photo-accent" aria-hidden="true">GeorgiaTrips</div>
        </div>

        {/* Right — Text content */}
        <div className="about-text">
          <span className="about-eyebrow">{t("about.eyebrow")}</span>
          <h2 className="about-heading">
            {t("about.heading1")}<br />
            {t("about.heading2")}
          </h2>

          <p className="about-desc">
            {t("about.desc1")}
          </p>
          <p className="about-desc">
            {t("about.desc2")}
          </p>

          <ul className="about-checks" aria-label={t("about.eyebrow")}>
            <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check1")}</li>
            <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check2")}</li>
            <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check3")}</li>
            <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check4")}</li>
          </ul>

          <div className="about-socials" aria-label="სოციალური ქსელები">
            <a
              href="https://www.facebook.com/people/Georgia-Trips/61588059054976/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-social-link about-social-fb"
              aria-label="Facebook — Georgia Trips"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              Facebook
            </a>
            <a
              href="https://www.instagram.com/georgiatrips.ge/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-social-link about-social-ig"
              aria-label="Instagram — georgiatrips.ge"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              Instagram
            </a>
            <a
              href="https://api.whatsapp.com/send/?phone=995504220020&text&type=phone_number&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="about-social-link about-social-wa"
              aria-label="WhatsApp — +995 504 22 00 20"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
              WhatsApp
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
