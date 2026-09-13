// GeorgiaTrips — Marketing Attribution & UTM Tracking Service

const UTM_STORAGE_KEY = "gt_marketing_attribution";

/**
 * Capture marketing parameters from current URL and store in sessionStorage / localStorage.
 * Should be called on initial visit and route changes.
 */
export function captureMarketingParams() {
  if (typeof window === "undefined") return;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get("utm_source");
    const utmMedium = urlParams.get("utm_medium");
    const utmCampaign = urlParams.get("utm_campaign");
    const utmContent = urlParams.get("utm_content");
    const utmTerm = urlParams.get("utm_term");
    const fbclid = urlParams.get("fbclid");
    const gclid = urlParams.get("gclid");

    // Only update if at least one marketing parameter is present in the current URL
    if (utmSource || utmMedium || utmCampaign || utmContent || fbclid || gclid) {
      const attribution = {
        utm_source: utmSource || "",
        utm_medium: utmMedium || "",
        utm_campaign: utmCampaign || "",
        utm_content: utmContent || "",
        utm_term: utmTerm || "",
        fbclid: fbclid || "",
        gclid: gclid || "",
        landingPage: window.location.pathname,
        capturedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attribution));
      localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(attribution));
    }
  } catch (_) {
    // Fail silently if storage is disabled
  }
}

/**
 * Retrieve stored marketing attribution for booking creation.
 */
export function getStoredMarketingAttribution() {
  if (typeof window === "undefined") {
    return { source: "website" };
  }

  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY) || localStorage.getItem(UTM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        source: "website",
        utm_source: parsed.utm_source || "",
        utm_medium: parsed.utm_medium || "",
        utm_campaign: parsed.utm_campaign || "",
        utm_content: parsed.utm_content || "",
        fbclid: parsed.fbclid || "",
        landingPage: parsed.landingPage || window.location.pathname,
      };
    }
  } catch (_) {}

  return {
    source: "website",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    fbclid: "",
    landingPage: typeof window !== "undefined" ? window.location.pathname : "",
  };
}
