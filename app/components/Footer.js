"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { BrandLogo, WA_LINK, PHONE_DISPLAY, TELEGRAM_LINK, INSTAGRAM_LINK } from "../lib/shared";
import { listFirestoreTours, asLocalizedText } from "../lib/toursFirestore";

export default function Footer() {
  const { t, lang } = useLanguage();
  const [tours, setTours] = useState([]);

  useEffect(() => {
    async function loadTours() {
      try {
        const allTours = await listFirestoreTours();
        setTours(allTours.slice(0, 5));
      } catch (err) {
        console.error("Footer tours error:", err);
      }
    }
    loadTours();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="brand-name">
              <BrandLogo />
              Georgia<span style={{ color: "var(--teal)" }}>Trips</span>
            </div>
            <p>{t("footer.about")}</p>
            <div className="footer-socials">
              <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
              </a>
              <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Telegram">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.16-.04.29z" />
                </svg>
              </a>
              <a href={WA_LINK} className="social-link" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="16" height="16">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Tours Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t("footer.toursTitle")}</h4>
            <ul className="footer-links">
              {tours.map(tour => (
                <li key={tour.id}>
                  <Link href={`/tours/${tour.id}`}>{asLocalizedText(tour.title, lang)}</Link>
                </li>
              ))}
              {tours.length === 0 && (
                <>
                  <li><Link href="/#tours">{t("footer.kazbegiTour")}</Link></li>
                  <li><Link href="/#batumi-tours">{t("footer.batumiTour")}</Link></li>
                  <li><Link href="/#tours">{t("footer.tbilisiTour")}</Link></li>
                  <li><Link href="/#tours">{t("footer.kakhetiTour")}</Link></li>
                  <li><Link href="/#tours">{t("footer.svanetiTour")}</Link></li>
                </>
              )}
              <li><Link href="/hotels">{t("nav.hotels")}</Link></li>
            </ul>
          </div>

          {/* Services Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t("footer.servicesTitle")}</h4>
            <ul className="footer-links">
              <li><Link href="/#tours">{t("nav.tours")}</Link></li>
              <li><Link href="/hotels">{t("nav.hotels")}</Link></li>
              <li><Link href="/transfers">{t("nav.transport")}</Link></li>
              <li><Link href="/posts">{t("nav.articles")}</Link></li>
              <li><Link href="/#booking">{t("footer.bookingLink")}</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="footer-col">
            <h4 className="footer-col-title">{t("footer.contactTitle")}</h4>
            <div className="footer-contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.94a16 16 0 0 0 6.06 6.06l1.05-1.06a2 2 0 0 1 2.11-.45c.9.362 1.84.617 2.81.7A2 2 0 0 1 21.9 16.1z" /></svg>
              {PHONE_DISPLAY}
            </div>
            <div className="footer-contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              {t("footer.email")}
            </div>
            <div className="footer-contact-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              {t("footer.address")}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>© 2026 GeorgiaTrips. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}
