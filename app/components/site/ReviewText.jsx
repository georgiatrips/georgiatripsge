"use client";

import { useEffect, useId, useRef, useState } from "react";

// Review text cut to a fixed number of lines so every card has the same
// height. "Read more" is offered only when the text really is cut, which
// depends on the card width, so it is measured rather than guessed from the
// text length. The row for the button is always there: a card must not
// change height when the button appears after hydration.
export default function ReviewText({ text, moreLabel, lessLabel }) {
  const ref = useRef(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [isCut, setIsCut] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || open) return undefined;
    const measure = () => setIsCut(el.scrollHeight > el.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  return (
    <>
      <blockquote ref={ref} id={id} className={open ? "" : "is-clamped"}>{text}</blockquote>
      <div className="gt-review-actions">
        {(isCut || open) && (
          <button type="button" className="gt-review-more" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
            {open ? lessLabel : moreLabel}
          </button>
        )}
      </div>
    </>
  );
}
