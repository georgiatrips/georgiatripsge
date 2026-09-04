const CACHE_NAME = "georgiatrips-v3";
const STATIC_ASSETS = [
  "/logo.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept API routes, navigations, or non-static requests
  if (
    event.request.mode === "navigate" ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/booking/") ||
    url.pathname.startsWith("/admin")
  ) {
    return;
  }

  // Only handle static assets
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    STATIC_ASSETS.includes(url.pathname);

  if (!isStatic) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          return new Response("Network error", { status: 408, headers: { "Content-Type": "text/plain" } });
        });
    })
  );
});
