// Tours (group and private) are booked at least 24 hours before they start.
// A tour on 3 November that starts at 09:00 can be booked until 2 November
// 09:00 Batumi time; a request at 23:00 on 2 November is too late.
//
// Used by the booking API, the booking calendar and the inbox assistant.

export const BOOKING_LEAD_HOURS = 24;
const LEAD_MS = BOOKING_LEAD_HOURS * 60 * 60 * 1000;
// Batumi is UTC+4 all year (no daylight saving).
const BATUMI_OFFSET_MS = 4 * 60 * 60 * 1000;
// Tours without a start time in the admin panel are taken to start then.
export const DEFAULT_START_TIME = "09:00";

// "09:00", "9:30", "09:00 — hotel pickup" → { h, m }; anything else → default.
function parseStartTime(startTime) {
  const match = /(\d{1,2})[:.](\d{2})/.exec(String(startTime || ""));
  const h = match ? Number(match[1]) : NaN;
  const m = match ? Number(match[2]) : NaN;
  if (h >= 0 && h < 24 && m >= 0 && m < 60) return { h, m };
  const [dh, dm] = DEFAULT_START_TIME.split(":").map(Number);
  return { h: dh, m: dm };
}

// When the tour on "YYYY-MM-DD" starts, as a timestamp; null for no date.
export function tourStartsAt(dateIso, startTime) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateIso || ""));
  if (!match) return null;
  const { h, m } = parseStartTime(startTime);
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), h, m) - BATUMI_OFFSET_MS;
}

// True when a tour on that date can no longer be booked. No date (by
// agreement) is never too late: the team settles the date.
export function isTooLateToBook(dateIso, startTime, now = Date.now()) {
  const starts = tourStartsAt(dateIso, startTime);
  return starts != null && starts - now < LEAD_MS;
}

// The first date that can still be booked, as "YYYY-MM-DD" (Batumi calendar).
export function firstBookableDate(startTime, now = Date.now()) {
  const day = new Date(now + BATUMI_OFFSET_MS);
  for (let i = 0; i < 3; i++) {
    const iso = day.toISOString().slice(0, 10);
    if (!isTooLateToBook(iso, startTime, now)) return iso;
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return day.toISOString().slice(0, 10);
}

// What the customer is told, in the languages of the site.
export const TOO_LATE_MESSAGES = {
  ka: "ტურის (ჯგუფურის და ინდივიდუალურის) დაჯავშნა შესაძლებელია მინიმუმ 24 საათით ადრე. ამ თარიღზე ჯავშანი ვეღარ მიიღება — გთხოვთ აირჩიოთ სხვა თარიღი.",
  en: "Tours (group and private) must be booked at least 24 hours in advance. This date can no longer be booked — please choose another date.",
  ru: "Туры (групповые и индивидуальные) нужно бронировать минимум за 24 часа. На эту дату бронирование уже невозможно — пожалуйста, выберите другую дату.",
  tr: "Turlar (grup ve özel) en az 24 saat önceden rezerve edilmelidir. Bu tarih için artık rezervasyon yapılamaz — lütfen başka bir tarih seçin.",
  ar: "يجب حجز الجولات (الجماعية والخاصة) قبل 24 ساعة على الأقل. لم يعد الحجز ممكناً لهذا التاريخ — يرجى اختيار تاريخ آخر.",
};

// The message for a site language code or a language name such as "Russian".
export function tooLateMessage(language) {
  const text = String(language || "").toLowerCase();
  if (TOO_LATE_MESSAGES[text]) return TOO_LATE_MESSAGES[text];
  if (/georg|ქართ/.test(text)) return TOO_LATE_MESSAGES.ka;
  if (/russ|рус/.test(text)) return TOO_LATE_MESSAGES.ru;
  if (/turk|türk/.test(text)) return TOO_LATE_MESSAGES.tr;
  if (/arab|عرب/.test(text)) return TOO_LATE_MESSAGES.ar;
  return TOO_LATE_MESSAGES.en;
}
