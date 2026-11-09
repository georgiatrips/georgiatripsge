import TourCard from "./TourCard";
import "../../styles/tour-card.css";

// Hot offers on the homepage. Laid out so a short list never leaves empty
// cells next to a lone card (rules in tour-card.css, by data-count):
//   1 tour   -> one wide spotlight card: photo on one side, details and a
//               short description on the other
//   2 tours  -> two large cards, half the width each
//   3 / 6    -> three per row
//   4        -> two per row
//   5        -> two large on top, three below
// On two-column widths an odd count makes the first card a wide spotlight.
// A card turns into the wide layout by its own width (container query), so
// it works the same in every arrangement.
export default function HotOffers({ tours = [], lang, t }) {
  const count = tours.length;
  if (!count) return null;

  return (
    <div className="gt-tours-wrap">
      <div className="gt-hot-grid" data-count={count} data-odd={count % 2 ? "" : undefined} data-reveal-group="">
        {tours.map((tour, index) => (
          <div key={tour.id} className="gt-hot-cell">
            <TourCard
              tour={tour}
              lang={lang}
              t={t}
              showDesc
              sizes={count === 1 || index === 0 ? "(max-width: 700px) 100vw, 640px" : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
