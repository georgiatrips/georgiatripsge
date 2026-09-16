# GeorgiaTrips

Tours, transfers and hotels across Georgia — Next.js 16 (App Router, Turbopack)
with Firebase (Firestore, Auth) and Cloudinary uploads. Five languages: ka, en,
ru, tr, ar (RTL).

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Environment variables live in `.env.local`
(not committed): Firebase, Cloudinary, Google (Business Profile / Places) and
analytics IDs.

## Production

```bash
npm run build
npm run start
```

## Where things are

- `app/[locale]/` — public pages per language
- `app/admin/` — admin panel
- `app/api/` — server routes (bookings, uploads, reviews sync, analytics)
- `app/components/` — shared UI; `app/styles/` — design system CSS
- `app/lib/i18n/locales/` — all UI text for the five languages
- `firestore.rules` — Firestore security rules
- `proxy.js` — rate limiting and API protection
- `scripts/` — icon generation and the Google OAuth helper
