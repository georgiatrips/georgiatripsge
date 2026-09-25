"use client";

import { useEffect } from "react";

// When a page change happens while the tab is in the background, the browser
// skips the crossfade and rejects it with an InvalidStateError. React already
// ignores that case, but it compares the message exactly ("Transition was
// aborted because of invalid state") while Chromium appends ". Document
// hidden", so the harmless skip was reported as an uncaught error. The page
// itself updates normally; only the animation is dropped. This silences that
// one message and lets every other error through.
const SKIPPED_TRANSITION = /^(Transition was aborted because of invalid state|View transition was skipped|Skipping view transition)/;

function isSkippedTransition(error) {
  return error?.name === "InvalidStateError" && SKIPPED_TRANSITION.test(String(error.message || ""));
}

export default function ViewTransitionErrorFilter() {
  useEffect(() => {
    const onError = (event) => {
      if (isSkippedTransition(event.error)) event.preventDefault();
    };
    const onRejection = (event) => {
      if (isSkippedTransition(event.reason)) event.preventDefault();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
