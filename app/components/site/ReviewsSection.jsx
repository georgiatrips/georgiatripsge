import { StarIcon } from "../Icons";
import ReviewText from "./ReviewText";
import "../../styles/reviews.css";

// Reviews that may be shown publicly: real text and rating, not hidden, and
// not waiting for moderation (reviews sent from the app start as approved: false).
export function visibleReviews(rawReviews, limit = 6) {
  return (Array.isArray(rawReviews) ? rawReviews : [])
    .filter((r) => r && typeof r.text === "string" && r.text.trim() && Number(r.rating) >= 1 && r.hidden !== true && r.approved !== false)
    .slice(0, limit);
}

// Guest reviews, shared by the homepage and the tour pages. Renders nothing
// when there are no reviews, so no page shows an empty or invented block.
export default function ReviewsSection({ reviews = [], t, tone = "white", headingId = "reviews-title" }) {
  if (!reviews.length) return null;

  return (
    <section className={`gt-section gt-section--${tone} gt-reviews-section`} aria-labelledby={headingId}>
      <div className="gt-container">
        <div className="gt-section-head" data-reveal>
          <p className="gt-eyebrow">{t("homepage.reviewsEyebrow")}</p>
          <h2 id={headingId} className="gt-h2">{t("homepage.reviewsTitle")}</h2>
        </div>
        <ul className="gt-review-grid" data-count={reviews.length} data-reveal-group>
          {reviews.map((review) => (
            <li key={review.id} className="gt-review">
              <span className="gt-stars" role="img" aria-label={`${Math.round(Number(review.rating))}/5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <StarIcon key={n} size={16} fill={n <= Math.round(Number(review.rating)) ? "currentColor" : "none"} color="currentColor" />
                ))}
              </span>
              <ReviewText text={review.text} moreLabel={t("tourDetail.readMore")} lessLabel={t("tourDetail.showLess")} />
              <div className="gt-review-author">
                <strong>{review.name}</strong>
                {review.source === "google" && <small>{t("homepage.reviewGoogle")}</small>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
