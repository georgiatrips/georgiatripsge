// Runs `callback` once the browser is idle after load, so non-critical work
// (Firebase auth, analytics writes) never competes with the first render.
// Returns a cancel function.
export function whenIdle(callback, timeout = 3000) {
  if (typeof window === "undefined") return () => {};

  let idleId;
  let timerId;
  const schedule = () => {
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(callback, { timeout });
    } else {
      timerId = window.setTimeout(callback, 1500);
    }
  };

  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }

  return () => {
    window.removeEventListener("load", schedule);
    if (idleId !== undefined) window.cancelIdleCallback(idleId);
    if (timerId !== undefined) window.clearTimeout(timerId);
  };
}
