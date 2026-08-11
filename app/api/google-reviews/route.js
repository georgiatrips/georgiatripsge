import { NextResponse } from "next/server";

// Revalidate the cached response every 6 hours
export const revalidate = 21600;

// ============================================================
// Google Business Profile API — returns ALL reviews
// Uses OAuth 2.0 (client_id + client_secret + refresh_token)
// ============================================================
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || "";

// Fallback: Places API key (AIza... format) — max 5 reviews
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || "";
const PLACE_ID = process.env.GOOGLE_PLACE_ID || "Georgia Trips";

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

// Get OAuth 2.0 access token using refresh token
async function getAccessToken() {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
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

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || "Failed to get access token");
  }
  return tokenData.access_token;
}

// Fetch reviews from Google Business Profile API (returns ALL reviews)
async function fetchBusinessProfileReviews() {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
      console.warn("[Google Reviews API] OAuth credentials missing");
      return null;
    }

    const accessToken = await getAccessToken();
    const authHeaders = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Step 1: Get the account ID
    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    const accountsData = await accountsRes.json();
    if (!accountsData.accounts?.length) {
      console.warn("[Google Reviews API] No accounts found:", JSON.stringify(accountsData));
      return null;
    }
    const accountId = accountsData.accounts[0].name.split("/").pop();

    // Step 2: Get the location ID
    const locationsRes = await fetch(
      `https://mybusinessprofile.googleapis.com/v1/accounts/${accountId}/locations?pageSize=100`,
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    const locationsData = await locationsRes.json();
    if (!locationsData.locations?.length) {
      console.warn("[Google Reviews API] No locations found:", JSON.stringify(locationsData));
      return null;
    }
    const locationId = locationsData.locations[0].name.split("/").pop();

    // Step 3: Fetch ALL reviews (pageSize=100)
    const reviewsRes = await fetch(
      `https://mybusinessprofile.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/reviews?pageSize=100`,
      { headers: authHeaders, signal: AbortSignal.timeout(10000) }
    );
    const reviewsData = await reviewsRes.json();
    if (!reviewsData.reviews?.length) {
      console.warn("[Google Reviews API] No reviews found:", JSON.stringify(reviewsData));
      return null;
    }

    return reviewsData.reviews.map((review) => ({
      googleReviewId: review.reviewId || review.name,
      name: review.reviewer?.displayName || "სტუმარი",
      rating: review.starRating || 5,
      text: review.comment || "",
      time: review.createTime
        ? formatRelativeTime(Math.floor(new Date(review.createTime).getTime() / 1000))
        : "ახლახან",
      originalTimestamp: review.createTime
        ? Math.floor(new Date(review.createTime).getTime() / 1000)
        : null,
      avatar: review.reviewer?.profilePhotoUrl || "",
      relativeTime: review.createTime
        ? formatRelativeTime(Math.floor(new Date(review.createTime).getTime() / 1000))
        : "",
    }));
  } catch (err) {
    console.warn("[Google Reviews API] Business Profile failed:", err.message);
    return null;
  }
}

// Fallback: Fetch reviews from Google Places API (max 5 reviews)
async function fetchPlacesReviews() {
  try {
    if (!PLACES_API_KEY || !PLACES_API_KEY.startsWith("AIza")) {
      console.warn("[Google Reviews API] Places API key missing or invalid (must start with AIza)");
      return null;
    }

    // Step 1: Find the place by text search to get the place_id
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(PLACE_ID)}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total&key=${PLACES_API_KEY}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" || !searchData.candidates?.length) {
      console.warn("[Google Reviews API] Places search failed:", searchData.status, searchData.error_message);
      return null;
    }

    const placeId = searchData.candidates[0].place_id;

    // Step 2: Fetch place details including reviews
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${PLACES_API_KEY}`;
    const detailsRes = await fetch(detailsUrl, { signal: AbortSignal.timeout(10000) });
    const detailsData = await detailsRes.json();

    if (detailsData.status !== "OK" || !detailsData.result?.reviews?.length) {
      console.warn("[Google Reviews API] Places details failed:", detailsData.status, detailsData.error_message);
      return null;
    }

    return detailsData.result.reviews.map((review) => ({
      googleReviewId: review.author_name + "_" + review.time,
      name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.relative_time_description || formatRelativeTime(review.time),
      originalTimestamp: review.time || null,
      avatar: review.profile_photo_url || "",
      relativeTime: review.relative_time_description || "",
    }));
  } catch (err) {
    console.warn("[Google Reviews API] Places failed:", err.message);
    return null;
  }
}

export async function GET() {
  // Try Business Profile API first (returns ALL reviews) — needs OAuth
  let reviews = await fetchBusinessProfileReviews();

  // Fall back to Places API (max 5 reviews) — needs AIza... key
  if (!reviews) {
    reviews = await fetchPlacesReviews();
  }

  if (!reviews) {
    return NextResponse.json(
      {
        error: "google_reviews_unavailable",
        message:
          "Google Reviews-ის მიღება ვერ მოხერხდა. შეამოწმეთ .env.local: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (Business Profile API) ან GOOGLE_PLACES_API_KEY (AIza... ფორმატი).",
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      data: {
        reviews,
        source: "google",
      },
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=43200",
      },
    }
  );
}