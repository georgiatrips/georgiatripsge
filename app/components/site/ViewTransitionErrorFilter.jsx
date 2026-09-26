// When a page change happens while the tab is in the background, the browser
// skips the crossfade and rejects it with an InvalidStateError. React already
// ignores that case, but it compares the message exactly ("Transition was
// aborted because of invalid state") while Chromium appends ". Document
// hidden", so the harmless skip was reported as an uncaught error (and shown
// by the Next.js dev overlay). The page itself updates normally; only the
// animation is dropped.
//
// This runs as an inline <head> script, before any Next.js code: the dev
// overlay registers its window "error" listener when its module loads, so a
// filter added later in a useEffect came too late. Capture-phase listeners on
// window run before bubble-phase ones, and stopImmediatePropagation keeps the
// overlay from seeing this one message. Every other error passes through.
const FILTER_SCRIPT = `(function(){var r=/^(Transition was aborted because of invalid state|View transition was skipped|Skipping view transition)/;function s(e){return!!e&&e.name==="InvalidStateError"&&r.test(String(e.message||""))}function h(v){return function(e){if(s(e[v])){e.preventDefault();e.stopImmediatePropagation()}}}addEventListener("error",h("error"),true);addEventListener("unhandledrejection",h("reason"),true)})();`;

export default function ViewTransitionErrorFilter() {
  return <script dangerouslySetInnerHTML={{ __html: FILTER_SCRIPT }} />;
}
