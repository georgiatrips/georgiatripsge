"use client";

import { useState } from "react";
import BlogCard from "./BlogCard";

// Category chips over the article grid. Every card is in the server HTML, so
// crawlers see all articles; the chips only hide the others.
export default function BlogFilter({ cards, categories, labels }) {
  const [active, setActive] = useState("all");
  const used = categories.filter((category) => cards.some((card) => card.category === category));
  const shown = active === "all" ? cards : cards.filter((card) => card.category === active);

  return (
    <>
      {used.length > 1 && (
        <div className="blog-chips" role="group" aria-label={labels.latest}>
          {["all", ...used].map((category) => (
            <button
              key={category}
              type="button"
              className={`blog-chip${active === category ? " is-active" : ""}`}
              aria-pressed={active === category}
              onClick={() => setActive(category)}
            >
              {category === "all" ? labels.all : labels.categories[category]}
            </button>
          ))}
        </div>
      )}
      {shown.length ? (
        <div className="blog-grid">
          {shown.map((card) => (
            <BlogCard key={card.slug} card={card} labels={labels} />
          ))}
        </div>
      ) : (
        <p className="blog-empty">{labels.empty}</p>
      )}
    </>
  );
}
