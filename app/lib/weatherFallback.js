export const DEFAULT_WEATHER_DATA = {
  tbilisi: {
    name: "თბილისი",
    temp: "28°C",
    condition: "მზიანი",
    desc: "იდეალური ამინდია ძველ თბილისში სასეირნოდ და მყუდრო კაფეებში დროის გასატარებლად.",
    humidity: "42%",
    wind: "12 კმ/სთ",
    uv: "საშუალო (5)",
    forecast: [
      { day: "ხვალ", temp: "29°C", condition: "sun" },
      { day: "ზეგ", temp: "27°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "28°C", condition: "sun" }
    ],
    icon: "sun"
  },
  batumi: {
    name: "ბათუმი",
    temp: "26°C",
    condition: "ნაწილობრივ ღრუბლიანი",
    desc: "ზღვის ნიავი და სასიამოვნო ტემპერატურა ბულვარში სასეირნოდ.",
    humidity: "75%",
    wind: "18 კმ/სთ",
    uv: "საშუალო (4)",
    forecast: [
      { day: "ხვალ", temp: "25°C", condition: "rain" },
      { day: "ზეგ", temp: "27°C", condition: "sun" },
      { day: "შემდეგ", temp: "28°C", condition: "sun" }
    ],
    icon: "cloud-sun"
  },
  kazbegi: {
    name: "ყაზბეგი",
    temp: "17°C",
    condition: "მზიანი",
    desc: "გრილი და სუფთა მთის ჰაერი, იდეალური პირობებია გერგეთის სამების მოსანახულებლად.",
    humidity: "35%",
    wind: "15 კმ/სთ",
    uv: "მაღალი (7)",
    forecast: [
      { day: "ხვალ", temp: "18°C", condition: "sun" },
      { day: "ზეგ", temp: "16°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "15°C", condition: "storm" }
    ],
    icon: "sun"
  },
  mestia: {
    name: "მესტია",
    temp: "19°C",
    condition: "მცირე ღრუბელი",
    desc: "საუკეთესო დრო სვანეთის კოშკების დასათვალიერებლად და ლაშქრობებისთვის.",
    humidity: "50%",
    wind: "8 კმ/სთ",
    uv: "საშუალო (5)",
    forecast: [
      { day: "ხვალ", temp: "20°C", condition: "sun" },
      { day: "ზეგ", temp: "18°C", condition: "rain" },
      { day: "შემდეგ", temp: "17°C", condition: "sun" }
    ],
    icon: "cloud-sun"
  },
  gudauri: {
    name: "გუდაური",
    temp: "15°C",
    condition: "მზიანი",
    desc: "შესანიშნავი ამინდია პარაპლანით ფრენისა და ალპური ხედებით ტკბობისთვის.",
    humidity: "40%",
    wind: "22 კმ/სთ",
    uv: "ძალიან მაღალი (8)",
    forecast: [
      { day: "ხვალ", temp: "16°C", condition: "sun" },
      { day: "ზეგ", temp: "14°C", condition: "cloud-sun" },
      { day: "შემდეგ", temp: "13°C", condition: "rain" }
    ],
    icon: "sun"
  }
};
