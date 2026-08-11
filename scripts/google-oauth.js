/**
 * Google OAuth 2.0 Refresh Token Generator
 * =========================================
 * გაშვება: npm run google-oauth
 *
 * ეს სკრიპტი:
 *   1) გახსნის ბრაუზერს Google OAuth consent ეკრანზე
 *   2) თქვენ დაუშვებთ წვდომას
 *   3) ბრაუზერი გადამისამართდება localhost-ზე კოდით
 *   4) სკრიპტი გაცვლის კოდს refresh token-ში (curl.exe-ის გამოყენებით)
 *   5) ჩაწერს GOOGLE_REFRESH_TOKEN-ს .env.local-ში
 *
 * მოთხოვნები Google Cloud Console-ში:
 *   - "Google Business Profile API" უნდა იყოს ჩართული
 *   - "Business Profile Account Management API" უნდა იყოს ჩართული
 *   - OAuth 2.0 Client-ში Redirect URI: http://localhost:3005
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { exec, execFileSync } = require("node:child_process");
const { randomBytes } = require("node:crypto");

const projectRoot = path.join(__dirname, "..");
const envPath = path.join(projectRoot, ".env.local");

// Load .env.local vars
function loadEnv() {
  try {
    const content = fs.readFileSync(envPath, "utf8");
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

// Save a var back into .env.local
function saveEnv(key, value) {
  let content = fs.readFileSync(envPath, "utf8");
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content += `\n${line}\n`;
  }
  fs.writeFileSync(envPath, content);
  console.log(`\n✅ ${key} ჩაიწერა .env.local-ში`);
}

// Exchange the code using curl.exe (reliable on Windows)
function exchangeCodeWithCurl(code) {
  const formData = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  }).toString();

  const stdout = execFileSync(
    "curl.exe",
    ["-s", "-X", "POST", "https://oauth2.googleapis.com/token", "-d", formData, "--max-time", "15"],
    { encoding: "utf8" }
  );
  return JSON.parse(stdout);
}

const env = loadEnv();
const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ GOOGLE_CLIENT_ID და GOOGLE_CLIENT_SECRET არ არის .env.local-ში!");
  process.exit(1);
}

// Redirect URI უნდა ემთხვეოდეს Google Cloud Console-ში დამატებულს.
const REDIRECT_PORT = 3005;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
// business.manage მოიცავს reviews-ის წაკითხვასაც — ეს ერთადერთი valid scopeა
const SCOPES = "https://www.googleapis.com/auth/business.manage";

const authUrl =
  "https://accounts.google.com/o/oauth2/auth?" +
  new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: randomBytes(16).toString("hex"),
    include_granted_scopes: "true",
  });

console.log("\n🔗 გახსენით ეს URL ბრაუზერში (ავტომატურად იხსნება):\n");
console.log(authUrl);
console.log("\n");

// Try to open the browser automatically
try {
  if (process.platform === "win32") {
    exec(`start "" "${authUrl}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${authUrl}"`);
  } else {
    exec(`xdg-open "${authUrl}"`);
  }
} catch {
  console.log("ბრაუზერი ვერ გაიხსნა ავტომატურად — დააკოპირეთ URL ხელით.");
}

// Start temporary local server to receive the redirect
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);
  const fullCode = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>❌ წვდომაზე უარი: ${error}</h2><p>დახურეთ ეს ფანჯარა.</p>`);
    console.error(`❌ OAuth error: ${error}`);
    server.close();
    process.exit(1);
  }

  if (!fullCode) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>❌ კოდი ვერ მოიძებნა</h2><p>დახურეთ ეს ფანჯარა.</p>`);
    server.close();
    process.exit(1);
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    `<h2>✅ წვდომა დაშვებულია!</h2><p>Refresh token გენერირდება... დახურეთ ეს ფანჯარა.</p>`
  );

  console.log(`📩 კოდი მიღებულია (${fullCode.slice(0, 20)}... [სრული სიგრძე: ${fullCode.length}]), გაცვლა ხდება...`);

  try {
    // Exchange using curl.exe — proven working on this system
    const body = exchangeCodeWithCurl(fullCode);
    console.log("📦 Google-ის პასუხი:", JSON.stringify(body, null, 2));

    if (body.error || !body.refresh_token) {
      throw new Error(
        body.error_description || body.error || "Failed to exchange code"
      );
    }

    console.log(`🔑 Refresh token მიღებულია (სიგრძე: ${body.refresh_token.length})`);
    saveEnv("GOOGLE_REFRESH_TOKEN", body.refresh_token);
    console.log("🎉 წარმატება! Refresh token შენახულია .env.local-ში.");
    console.log("\nახლა გადატვირთეთ dev სერვერი (npm run dev) და სცადეთ სინქრონიზაცია адმინ პანელში.");
  } catch (err) {
    console.error("❌ Token-ის მიღება ვერ მოხერხდა:", err.message);
  } finally {
    server.close();
    setTimeout(() => process.exit(0), 1000);
  }
});

server.listen(REDIRECT_PORT, () => {
  console.log(`⏳ ელოდებით redirect-ს ${REDIRECT_URI}...`);
});