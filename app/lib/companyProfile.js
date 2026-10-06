// Company facts for the About page, the Organization structured data and
// llms.txt. Search engines and AI assistants judge a travel company by facts
// like these (who runs it, since when, where), so every field must be true.
//
// Fields left null / empty are simply not shown anywhere. Fill them in when
// you have them — e.g. foundedYear: 2023 — and the About page, the schema and
// llms.txt pick them up on the next deploy.

export const COMPANY_PROFILE = {
  name: "GeorgiaTrips",
  // Year the company started taking guests, e.g. 2023.
  foundedYear: null,
  // Official registration (legal name and ID code), when you want it public.
  legalName: null,
  registrationId: null,
  // People travellers will meet or talk to. Example entry:
  // { name: "Giorgi", role: { en: "Founder & guide", ka: "დამფუძნებელი და გიდი" }, languages: ["ka", "en", "ru"], photo: "/team/giorgi.webp" }
  team: [],
  // Google Business Profile listing (same place as the Organization schema).
  googleMapsUrl: "https://www.google.com/maps/place/?q=place_id:ChIJBXgJNomHZ0ARMFv54m7MSmk",
  // Write-a-review link for that listing.
  googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJBXgJNomHZ0ARMFv54m7MSmk",
};
