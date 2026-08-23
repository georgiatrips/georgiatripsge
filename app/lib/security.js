// სერვერული დაცვის უტილიტები ბოტებისა და აბუზის წინააღმდეგ

// IP-ზე დაფუძნებული rate limit. იყენებს In-Memory Map-ს.
// ყურადღება: In-Memory ლიმიტი მუშაობს ერთ ინსტანციაზე.
// მრავალ ინსტანციურ დეპლოიმენტზე გამოიყენეთ Redis ან Vercel/KV.
const WINDOW_MS = 60 * 1000; // 1 წუთიანი ფანჯარა
const MAX_REQUESTS_PER_WINDOW = 120; // მაქს. 120 მოთხოვნა/წუთი IP-ზე
const MAX_API_REQUESTS_PER_WINDOW = 30; // მაქს. 30 API მოთხოვნა/წუთი

if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = new Map();
}

const MAX_TRACKED_CLIENTS = 20_000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
if (!globalThis.__rateLimitLastCleanup) globalThis.__rateLimitLastCleanup = 0;

function cleanupExpiredEntries(now) {
  const store = globalThis.__rateLimitStore;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export function getClientIp(request) {
  // Cloudflare / CDN პროქსი
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // X-Forwarded-For - პირველი IP არის კლიენტის
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Real IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export function checkRateLimit(request, { max = MAX_REQUESTS_PER_WINDOW, windowMs = WINDOW_MS, namespace = "page" } = {}) {
  const now = Date.now();
  if (now - globalThis.__rateLimitLastCleanup > CLEANUP_INTERVAL_MS) {
    cleanupExpiredEntries(now);
    globalThis.__rateLimitLastCleanup = now;
  }

  const ip = getClientIp(request);
  const key = `rl:${namespace}:${ip}`;

  const current = globalThis.__rateLimitStore.get(key);
  if (!current || current.resetAt < now) {
    if (globalThis.__rateLimitStore.size >= MAX_TRACKED_CLIENTS) {
      return { rateLimited: false, remaining: max };
    }
    globalThis.__rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { rateLimited: false, remaining: max - 1 };
  }

  current.count += 1;
  if (current.count > max) {
    return {
      rateLimited: true,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
      remaining: 0,
    };
  }

  return { rateLimited: false, remaining: max - current.count };
}

// API routes-ის ცალკე, უფრო მკაცრი ლიმიტი
export function checkApiRateLimit(request) {
  return checkRateLimit(request, { max: MAX_API_REQUESTS_PER_WINDOW });
}

// ცნობილი ბოტების სია, რომლებსაც არ ვუშვებთ
const BLOCKED_BOTS = [
  "bytespider",       // ByteDance (TikTok) crawler
  "amazonbot",        // Amazon crawler
  "petalbot",         // Huawei crawler
  "mj12bot",          // Majestic-12
  "dotbot",           // DotBot
  "semrushbot",       // Semrush
  "ahrefsbot",        // Ahrefs
  "sitecheckerbotcrawler", // SiteChecker
  "nimbot",           // Nimble
];

// ძიებითი სისტემების ბოტები, რომლებსაც ვუშვებთ
const ALLOWED_BOTS = [
  "googlebot",
  "bingbot",
  "yandex",
  "baiduspider",
  "duckduckbot",
  "facebot",
  "facebookexternalhit",
  "slurp",
  "msnbot",
  "applebot",
  "twitterbot",
  "linkedinbot",
  "pinterest",
  "petalbot",
];

export function detectBot(request) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  if (!userAgent) return null;

  // შევამოწმოთ დაბლოკილები
  for (const bot of BLOCKED_BOTS) {
    if (userAgent.includes(bot)) return { blocked: true, name: bot };
  }

  // შევამოწმოთ დაშვებულები
  for (const bot of ALLOWED_BOTS) {
    if (userAgent.includes(bot)) return { blocked: false, name: bot };
  }
  // ცარიელი UA ან "curl", "python-requests" და ა.შ. (მხოლოდ API-ზე შევზღუდოთ)
  const suspiciousPatterns = ["curl", "wget", "python", "requests", "scrapy", "node-fetch", "axios", "postman"];
  for (const pattern of suspiciousPatterns) {
    if (userAgent.includes(pattern)) return { blocked: false, suspicious: true, name: pattern };
  }

  return null;
}

// Cloudflare Challenge / block ჰედერები (თუ CDN-ის უკან ხართ)
export function isCloudflareBlocked(request) {
  const cfCountry = request.headers.get("cf-ipcountry");
  const cfVerify = request.headers.get("cf-verification");
  // cf-verification "blocked" ნიშნავს, რომ Cloudflare-მა უკვე დაბლოკა
  return cfVerify === "blocked";
}

// Force dynamic rendering-ისთვის არასტაბილურ ჰედერებზე დაფუძნებული მოთხოვნებისთვის
export function isStaticAssetRequest(request) {
  const { pathname } = request.nextUrl;
  return (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/public") ||
    pathname.includes(".") && !pathname.endsWith("/")
  );
}
