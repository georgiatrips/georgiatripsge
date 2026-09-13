import { NextResponse } from "next/server";

// Revalidate the cached response every 15 minutes
export const revalidate = 900;

// Tourist destinations with coordinates + descriptive flavour text (Georgian)
const CITIES = [
  {
    key: "tbilisi",
    name: "თბილისი",
    lat: 41.7151,
    lon: 44.8271,
    desc: "იდეალური ამინდია ძველ თბილისში სასეირნოდ და მყუდრო კაფეებში დროის გასატარებლად.",
  },
  {
    key: "batumi",
    name: "ბათუმი",
    lat: 41.6168,
    lon: 41.6367,
    desc: "ზღვის ნიავი და სასიამოვნო ტემპერატურა ბულვარში სასეირნოდ.",
  },
  {
    key: "kazbegi",
    name: "ყაზბეგი",
    lat: 42.6559,
    lon: 44.6421,
    desc: "გრილი და სუფთა მთის ჰაერი, იდეალური პირობებია გერგეთის სამების მოსანახულებლად.",
  },
  {
    key: "mestia",
    name: "მესტია",
    lat: 43.0458,
    lon: 42.7289,
    desc: "საუკეთესო დრო სვანეთის კოშკების დასათვალიერებლად და ლაშქრობებისთვის.",
  },
  {
    key: "gudauri",
    name: "გუდაური",
    lat: 42.4778,
    lon: 44.4806,
    desc: "შესანიშნავი ამინდია პარაპლანით ფრენისა და ალპური ხედებით ტკბობისთვის.",
  },
];

// Map WMO weather codes to our icon set + Georgian condition text
function mapWeatherCode(code) {
  if (code === 0) return { icon: "sun", condition: "მზიანი" };
  if (code === 1 || code === 2) return { icon: "cloud-sun", condition: "ნაწილობრივ ღრუბლიანი" };
  if (code === 3) return { icon: "cloud-sun", condition: "ღრუბლიანი" };
  if (code === 45 || code === 48) return { icon: "cloud-sun", condition: "ნისლი" };
  if (code >= 51 && code <= 67) return { icon: "rain", condition: "წვიმა" };
  if (code >= 71 && code <= 77) return { icon: "rain", condition: "თოვლი" };
  if (code >= 80 && code <= 82) return { icon: "rain", condition: "წვიმა" };
  if (code >= 95) return { icon: "storm", condition: "ჭექა-ქუხილი" };
  return { icon: "cloud-sun", condition: "ცვალებადი" };
}

function uvLabel(uv) {
  if (uv == null) return "—";
  const v = Math.round(uv);
  if (v <= 2) return `დაბალი (${v})`;
  if (v <= 5) return `საშუალო (${v})`;
  if (v <= 7) return `მაღალი (${v})`;
  if (v <= 10) return `ძალიან მაღალი (${v})`;
  return `ექსტრემალური (${v})`;
}

const FORECAST_LABELS = ["ხვალ", "ზეგ", "შემდეგ"];

async function fetchCity(city) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
      `&daily=weather_code,temperature_2m_max,uv_index_max` +
      `&timezone=auto&forecast_days=4`;

    const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`Open-Meteo error for ${city.key}: ${res.status}`);
    const data = await res.json();

    const current = mapWeatherCode(data.current.weather_code);

    const forecast = FORECAST_LABELS.map((day, i) => {
      const idx = i + 1;
      const m = mapWeatherCode(data.daily.weather_code[idx]);
      return {
        day,
        temp: `${Math.round(data.daily.temperature_2m_max[idx])}°C`,
        condition: m.icon,
      };
    });

    return {
      name: city.name,
      temp: `${Math.round(data.current.temperature_2m)}°C`,
      condition: current.condition,
      desc: city.desc,
      humidity: `${Math.round(data.current.relative_humidity_2m)}%`,
      wind: `${Math.round(data.current.wind_speed_10m)} კმ/სთ`,
      uv: uvLabel(data.daily.uv_index_max?.[0]),
      forecast,
      icon: current.icon,
    };
  } catch (err) {
    console.warn(`[Weather API] fallback for ${city.name}:`, err.message);
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(CITIES.map(fetchCity));
    const payload = {};
    let hasValidData = false;

    CITIES.forEach((city, i) => {
      if (results[i]) {
        payload[city.key] = results[i];
        hasValidData = true;
      }
    });

    if (!hasValidData) {
      return NextResponse.json({ error: "weather_unavailable" }, { status: 503 });
    }

    return NextResponse.json(
      { data: payload, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } }
    );
  } catch (err) {
    console.log("[Weather API] Error:", err.message);
    return NextResponse.json({ error: "weather_unavailable" }, { status: 503 });
  }
}
