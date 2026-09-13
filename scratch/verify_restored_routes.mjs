import http from "http";

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    }).on("error", reject);
  });
}

async function verify() {
  console.log("Testing started...");
  const pages = [
    "http://localhost:3000/ka",
    "http://localhost:3000/ka/tours",
    "http://localhost:3000/ka/places",
    "http://localhost:3000/ka/tours/ZvCYh5V4wEqWkUp622RX",
    "http://localhost:3000/ka/places/vOFTdOn6pi5ixb8WB6UB",
  ];

  for (const pageUrl of pages) {
    try {
      const res = await fetchPage(pageUrl);
      console.log(`\nURL: ${pageUrl} -> Status: ${res.statusCode}`);
      const includesTour = res.body.includes("ტროპიკული აჭარა") || res.body.includes("მღვიმე, კანიონი");
      const includesPlace = res.body.includes("ციხისძირის") || res.body.includes("მარტვილის");
      console.log(`Contains tour content: ${includesTour} | Contains place content: ${includesPlace}`);
    } catch (e) {
      console.error(`Failed to fetch ${pageUrl}:`, e.message);
    }
  }
}

verify().catch(console.error);
