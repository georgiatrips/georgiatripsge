// Locations pinned on the homepage map of Georgia.
//
// Add one object per location:
//   {
//     id: "martvili-canyon",               // unique, latin letters
//     type: "place",                        // "place" or "office"
//     region: "GE-SZ",                      // region code, see list below
//     lat: 42.4570, lng: 42.3770,           // decimal degrees (Google Maps:
//                                           // right-click the spot, copy the numbers)
//     name: { ka: "...", en: "...", ru: "...", tr: "...", ar: "..." },
//     href: "/places/VRkDXUdauIj1PJZ6egHg", // optional: site page to open
//   }
//
// Region codes:
//   GE-AJ Adjara · GE-GU Guria · GE-IM Imereti · GE-KA Kakheti
//   GE-KK Kvemo Kartli · GE-MM Mtskheta-Mtianeti
//   GE-RL Racha-Lechkhumi & Kvemo Svaneti · GE-SJ Samtskhe-Javakheti
//   GE-SK Shida Kartli · GE-SZ Samegrelo-Zemo Svaneti · GE-TB Tbilisi
//
// The office pin marks Batumi (the company address is in Batumi); its label
// comes from the dictionaries (homepage.mapOffice).
export const MAP_LOCATIONS = [
  {
    id: "office-batumi",
    type: "office",
    region: "GE-AJ",
    lat: 41.6168,
    lng: 41.6367,
    labelKey: "homepage.mapOffice",
  },
];
