/** Badge ვарианти — ადმინ პანელიდან არჩევა */
export const TOUR_BADGE_OPTIONS = [
  "საუკეთესო არჩევანი",
  "ტოპ არჩევანი",
  "მოგზაურების რჩეული",
  "პრემიუმ ტური",
  "მაღალი შეფასება",
  "ახალი ტური",
  "სპეციალური შეთავაზება",
];

/** ტურის კატეგორია / სექცია */
export const TOUR_SECTIONS = [
  { value: "mountains-nature", label: "მთის ტურები და ბუნება" },
  { value: "batumi-city", label: "ბათუმის ქალაქის ტური" },
  { value: "wine", label: "ღვინის პროგრამები" },
  { value: "exotic-parks", label: "ეგზოტიკური პარკები და ბუნება" },
  { value: "sea", label: "ზღვაზე გასეირნება" },
  { value: "seasonal", label: "სეზონური ექსკურსიები" },
];

export function getTourSectionLabel(value) {
  return TOUR_SECTIONS.find((s) => s.value === value)?.label || "";
}
