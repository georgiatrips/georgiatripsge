import http from "http";

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    }).on("error", reject);
  });
}

async function verifyMultilingual() {
  const urls = [
    { url: "http://localhost:3000/en/tours", expected: "Tropical Adjara" },
    { url: "http://localhost:3000/ru/tours", expected: "Тропическая Аджария" },
    { url: "http://localhost:3000/tr/tours", expected: "Tropikal Acara" },
    { url: "http://localhost:3000/ar/tours", expected: "أدجارا الاستوائية" },
    { url: "http://localhost:3000/ka/places/vOFTdOn6pi5ixb8WB6UB", expected: "ციხისძირის" },
    { url: "http://localhost:3000/en/places/vOFTdOn6pi5ixb8WB6UB", expected: "Tsikhisdziri" },
  ];

  for (const item of urls) {
    const res = await fetchPage(item.url);
    const hasExpected = res.body.includes(item.expected);
    console.log(`[${res.statusCode}] ${item.url} -> Found text "${item.expected}": ${hasExpected}`);
  }
}

verifyMultilingual().catch(console.error);
