import { NextResponse } from "next/server";

// Fallback country emoji flag resolver
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Check if IP is localhost / private
function isPrivateIP(ip) {
  if (!ip) return true;
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("fe80:")
  );
}

export async function GET(request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfIp = request.headers.get("cf-connecting-ip");
    
    let rawIp = cfIp || (forwarded ? forwarded.split(",")[0].trim() : realIp) || "";
    
    // In dev / local testing
    if (!rawIp || isPrivateIP(rawIp)) {
      return NextResponse.json({
        ip: rawIp || "127.0.0.1 (Local/Dev)",
        country: "Georgia",
        countryCode: "GE",
        city: "Tbilisi",
        region: "Tbilisi",
        flag: "🇬🇪",
        isp: "Local Development",
        isDev: true,
      });
    }

    // Try GeoIP lookup
    let geo = {
      ip: rawIp,
      country: "Unknown",
      countryCode: "UN",
      city: "Unknown",
      region: "",
      flag: "🌐",
      isp: "",
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`https://freeipapi.com/api/json/${rawIp}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.countryName) {
          geo.country = data.countryName || "Unknown";
          geo.countryCode = data.countryCode || "UN";
          geo.city = data.cityName || data.regionName || "Unknown";
          geo.region = data.regionName || "";
          geo.flag = getFlagEmoji(data.countryCode);
        }
      }
    } catch (_) {
      // Secondary fallback (ip-api)
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
        const res2 = await fetch(`http://ip-api.com/json/${rawIp}?fields=status,country,countryCode,regionName,city,isp`, {
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        if (res2.ok) {
          const data2 = await res2.json();
          if (data2 && data2.status === "success") {
            geo.country = data2.country || "Unknown";
            geo.countryCode = data2.countryCode || "UN";
            geo.city = data2.city || data2.regionName || "Unknown";
            geo.region = data2.regionName || "";
            geo.isp = data2.isp || "";
            geo.flag = getFlagEmoji(data2.countryCode);
          }
        }
      } catch (err) {
        geo.flag = getFlagEmoji(geo.countryCode);
      }
    }

    return NextResponse.json(geo);
  } catch (error) {
    return NextResponse.json(
      {
        ip: "Unknown",
        country: "Unknown",
        countryCode: "UN",
        city: "Unknown",
        flag: "🌐",
        isp: "",
      },
      { status: 200 }
    );
  }
}
