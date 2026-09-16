import { NextResponse } from "next/server";

// Runs on request only. With `revalidate` this handler was prerendered, so
// every `next build` called Google (and logged the 401/REQUEST_DENIED errors).
// A small in-memory cache keeps repeated admin syncs inside Google's quota.
export const dynamic = "force-dynamic";

const CACHE_MS = 6 * 60 * 60 * 1000;
let cached = null; // { body, at }

// ============================================================
// 1) Google Business Profile — all reviews, needs OAuth
//    (client_id + client_secret + refresh_token with business.manage scope)
// 2) Fallback: Places API (New) Place Details — up to 5 reviews, needs an
//    API key that is allowed to call places.googleapis.com
// All credentials are server-only environment variables.
// ============================================================
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || "";
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
// A Google place id (starts with "ChIJ"), e.g. from the Place ID Finder.
const PLACE_ID = process.env.GOOGLE_PLACE_ID || "";

const STAR_VALUES = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function formatRelativeTime(timestamp) {
  if (!timestamp) return "ახლახან";
  const diff = Date.now() - timestamp * 1000;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "ახლახან";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  if (hours < 24) return `${hours} საათის წინ`;
  if (days < 7) return `${days} დღის წინ`;
  if (weeks < 5) return `${weeks} კვირის წინ`;
  if (months < 12) return `${months} თვის წინ`;
  return `${Math.floor(days / 365)} წლის წინ`;
}

const toSeconds = (iso) => (iso ? Math.floor(new Date(iso).getTime() / 1000) : null);

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// Short, secret-free description of a Google error response for the logs.
function describeError(res, body) {
  const err = body?.error;
  const reason = err?.details?.find?.((d) => d?.reason)?.reason;
  return `${res.status} ${err?.status || ""} ${reason || ""} ${err?.message || ""}`.trim();
}

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await readJson(res);
  if (!res.ok || !data.access_token) {
    throw new Error(`token exchange failed: ${data.error || res.status} ${data.error_description || ""}`.trim());
  }
  return data.access_token;
}

async function fetchBusinessProfileReviews() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.warn("[Google Reviews API] Business Profile: OAuth credentials missing");
    return null;
  }
  try {
    const headers = { Authorization: `Bearer ${await getAccessToken()}` };
    const get = (url) => fetch(url, { headers, signal: AbortSignal.timeout(10000) });

    // Account Management API
    const accountsRes = await get("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
    const accounts = await readJson(accountsRes);
    if (!accountsRes.ok || !accounts.accounts?.length) {
      console.warn("[Google Reviews API] Business Profile accounts:", describeError(accountsRes, accounts));
      return null;
    }
    const accountName = accounts.accounts[0].name; // "accounts/123"

    // Business Information API (readMask is required)
    const locationsRes = await get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title&pageSize=100`
    );
    const locations = await readJson(locationsRes);
    if (!locationsRes.ok || !locations.locations?.length) {
      console.warn("[Google Reviews API] Business Profile locations:", describeError(locationsRes, locations));
      return null;
    }
    const locationName = locations.locations[0].name; // "locations/456"

    // Reviews are still served by the v4 API
    const reviewsRes = await get(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews?pageSize=50`);
    const data = await readJson(reviewsRes);
    if (!reviewsRes.ok) {
      console.warn("[Google Reviews API] Business Profile reviews:", describeError(reviewsRes, data));
      return null;
    }
    if (!data.reviews?.length) return [];

    return data.reviews.map((review) => {
      const ts = toSeconds(review.createTime);
      return {
        googleReviewId: review.reviewId || review.name,
        name: review.reviewer?.displayName || "სტუმარი",
        rating: STAR_VALUES[review.starRating] || Number(review.starRating) || 5,
        text: review.comment || "",
        time: formatRelativeTime(ts),
        originalTimestamp: ts,
        avatar: review.reviewer?.profilePhotoUrl || "",
        relativeTime: ts ? formatRelativeTime(ts) : "",
      };
    });
  } catch (err) {
    console.warn("[Google Reviews API] Business Profile failed:", err.message);
    return null;
  }
}

async function fetchPlacesReviews() {
  if (!PLACES_API_KEY || !/^ChIJ/.test(PLACE_ID)) {
    console.warn("[Google Reviews API] Places: GOOGLE_PLACES_API_KEY or a ChIJ... GOOGLE_PLACE_ID is missing");
    return null;
  }
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}?languageCode=ka`, {
      headers: {
        "X-Goog-Api-Key": PLACES_API_KEY,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
      signal: AbortSignal.timeout(10000),
    });
    const data = await readJson(res);
    if (!res.ok) {
      console.warn("[Google Reviews API] Places:", describeError(res, data));
      return null;
    }
    return (data.reviews || []).map((review) => {
      const ts = toSeconds(review.publishTime);
      const author = review.authorAttribution || {};
      return {
        googleReviewId: review.name || `${author.displayName}_${ts}`,
        name: author.displayName || "სტუმარი",
        rating: Number(review.rating) || 5,
        text: review.originalText?.text || review.text?.text || "",
        time: review.relativePublishTimeDescription || formatRelativeTime(ts),
        originalTimestamp: ts,
        avatar: author.photoUri || "",
        relativeTime: review.relativePublishTimeDescription || "",
      };
    });
  } catch (err) {
    console.warn("[Google Reviews API] Places failed:", err.message);
    return null;
  }
}

export async function GET() {
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json(cached.body);
  }

  let reviews = await fetchBusinessProfileReviews();
  if (!reviews) reviews = await fetchPlacesReviews();

  if (!reviews) {
    return NextResponse.json(
      {
        error: "google_reviews_unavailable",
        message:
          "Google Reviews-ის მიღება ვერ მოხერხდა. დეტალები სერვერის ლოგებშია ([Google Reviews API]).",
      },
      { status: 503 }
    );
  }

  const body = { data: { reviews, source: "google" }, updatedAt: new Date().toISOString() };
  cached = { body, at: Date.now() };
  return NextResponse.json(body);
}
