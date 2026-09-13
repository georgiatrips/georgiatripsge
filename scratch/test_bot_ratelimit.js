const BASE_URL = "http://localhost:3000";

async function testBotRateLimiting() {
  console.log("==================================================");
  console.log("🧪 TESTING BOT DETECTION & RATE LIMITING BEHAVIOR");
  console.log("==================================================");

  // 1. Googlebot crawl burst (135 requests from same IP)
  console.log("\n--- 1. Testing Googlebot crawl burst (135 requests from 66.249.66.1) ---");
  let google429Count = 0;
  let google200Count = 0;
  for (let i = 1; i <= 135; i++) {
    const res = await fetch(`${BASE_URL}/en/tours`, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "x-forwarded-for": "66.249.66.1",
      },
    });
    if (res.status === 429) google429Count++;
    if (res.status === 200) google200Count++;
  }
  console.log(`Googlebot 135 requests: 200 OK: ${google200Count}, 429 Rate Limited: ${google429Count}`);
  if (google429Count > 0) {
    throw new Error(`Googlebot was rate limited ${google429Count} times! Expected 0.`);
  }

  // 2. Bingbot crawl burst (135 requests from same IP)
  console.log("\n--- 2. Testing Bingbot crawl burst (135 requests from 157.55.39.1) ---");
  let bing429Count = 0;
  let bing200Count = 0;
  for (let i = 1; i <= 135; i++) {
    const res = await fetch(`${BASE_URL}/en/tours`, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
        "x-forwarded-for": "157.55.39.1",
      },
    });
    if (res.status === 429) bing429Count++;
    if (res.status === 200) bing200Count++;
  }
  console.log(`Bingbot 135 requests: 200 OK: ${bing200Count}, 429 Rate Limited: ${bing429Count}`);
  if (bing429Count > 0) {
    throw new Error(`Bingbot was rate limited ${bing429Count} times! Expected 0.`);
  }

  // 3. PetalBot crawl burst (135 requests)
  console.log("\n--- 3. Testing PetalBot crawl burst (135 requests from 114.119.130.1) ---");
  let petal429Count = 0;
  let petal200Count = 0;
  let petal403Count = 0;
  for (let i = 1; i <= 135; i++) {
    const res = await fetch(`${BASE_URL}/en/tours`, {
      headers: {
        "user-agent": "Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 Mobile Safari/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
        "x-forwarded-for": "114.119.130.1",
      },
    });
    if (res.status === 429) petal429Count++;
    if (res.status === 200) petal200Count++;
    if (res.status === 403) petal403Count++;
  }
  console.log(`PetalBot 135 requests: 200 OK: ${petal200Count}, 403 Forbidden: ${petal403Count}, 429 Rate Limited: ${petal429Count}`);
  if (petal403Count > 0) throw new Error("PetalBot should NOT receive 403 Forbidden!");
  if (petal429Count > 0) throw new Error("PetalBot should NOT receive 429 Rate Limited!");

  // 4. Normal User Rate Limiting (130 requests from 198.51.100.77)
  console.log("\n--- 4. Testing Normal User rate limiting (130 requests from 198.51.100.77) ---");
  let user429Count = 0;
  let first429Index = -1;
  for (let i = 1; i <= 130; i++) {
    const res = await fetch(`${BASE_URL}/en/tours`, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36",
        "x-forwarded-for": "198.51.100.77",
      },
    });
    if (res.status === 429) {
      user429Count++;
      if (first429Index === -1) first429Index = i;
    }
  }
  console.log(`Normal User: First 429 at request #${first429Index}, total 429s: ${user429Count}`);
  if (first429Index !== 121) {
    throw new Error(`Normal user expected 429 at request 121, but got ${first429Index}`);
  }

  // 5. Spoofed Fake Googlebot behind Cloudflare (cf-verified-bot: "false")
  console.log("\n--- 5. Testing Fake Googlebot behind CF (cf-verified-bot: 'false', 130 requests from 198.51.100.88) ---");
  let fakeBot429Count = 0;
  let fakeBotFirst429 = -1;
  for (let i = 1; i <= 130; i++) {
    const res = await fetch(`${BASE_URL}/en/tours`, {
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "cf-connecting-ip": "198.51.100.88",
        "cf-verified-bot": "false",
      },
    });
    if (res.status === 429) {
      fakeBot429Count++;
      if (fakeBotFirst429 === -1) fakeBotFirst429 = i;
    }
  }
  console.log(`Fake Googlebot: First 429 at request #${fakeBotFirst429}, total 429s: ${fakeBot429Count}`);
  if (fakeBotFirst429 !== 121) {
    throw new Error(`Fake Googlebot expected 429 at request 121, but got ${fakeBotFirst429}`);
  }

  // 6. Blocked Bots (SemrushBot, AhrefsBot) -> 403 Forbidden
  console.log("\n--- 6. Testing Blocked Bots on page route ---");
  const semrushRes = await fetch(`${BASE_URL}/en/tours`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)" },
  });
  console.log(`SemrushBot status: ${semrushRes.status}`);
  if (semrushRes.status !== 403) throw new Error("SemrushBot should receive 403 Forbidden");

  const ahrefsRes = await fetch(`${BASE_URL}/en/tours`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)" },
  });
  console.log(`AhrefsBot status: ${ahrefsRes.status}`);
  if (ahrefsRes.status !== 403) throw new Error("AhrefsBot should receive 403 Forbidden");

  // 7. API Protection
  console.log("\n--- 7. Testing API route protection ---");
  const scraperApiRes = await fetch(`${BASE_URL}/api/weather`, {
    headers: { "user-agent": "python-requests/2.28.1" },
  });
  console.log(`Suspicious scraper on /api/weather status: ${scraperApiRes.status}`);
  if (scraperApiRes.status !== 403) throw new Error("Suspicious scraper on API should receive 403");

  // API rate limit test for normal user (limit is 60)
  let api429Count = 0;
  for (let i = 1; i <= 65; i++) {
    const res = await fetch(`${BASE_URL}/api/weather`, {
      headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "x-forwarded-for": "198.51.100.99",
      },
    });
    if (res.status === 429) api429Count++;
  }
  console.log(`Normal client on /api/weather 65 requests: ${api429Count} were 429 rate limited.`);
  if (api429Count === 0) throw new Error("API rate limiting must be enforced!");

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS COMPLETED AND VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

testBotRateLimiting().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
