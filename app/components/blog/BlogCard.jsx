import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ClockIcon } from "../Icons";

// Article card for the blog hub and the "more guides" row. `featured` is the
// wide hero card at the top of the hub. Rendered inside the client-side
// category filter too, so it takes plain strings (card.href, card.readLabel,
// labels) and imports nothing that carries the article texts.
export default function BlogCard({ card, labels, featured = false, eager = false, headingLevel = 3 }) {
  const href = card.href;
  const Heading = `h${headingLevel}`;

  return (
    <article className={`blog-card${featured ? " blog-card--featured" : ""}`}>
      <Link href={href} className="blog-card-media" tabIndex={-1} aria-hidden="true" prefetch={false}>
        {card.cover && (
          <Image
            src={card.cover.src}
            alt=""
            fill
            sizes={featured ? "(max-width: 900px) 100vw, 760px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"}
            priority={eager}
            style={{ objectFit: "cover" }}
          />
        )}
        <span className="blog-chip blog-chip--on-photo">{labels.categories[card.category]}</span>
      </Link>
      <div className="blog-card-body">
        <Heading className="blog-card-title">
          <Link href={href} prefetch={false}>{card.title}</Link>
        </Heading>
        <p className="blog-card-excerpt">{card.excerpt}</p>
        <div className="blog-card-foot">
          <span className="blog-meta">
            <ClockIcon size={15} />
            {card.readLabel}
          </span>
          <Link href={href} className="blog-card-more" prefetch={false}>
            {labels.readMore}
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
