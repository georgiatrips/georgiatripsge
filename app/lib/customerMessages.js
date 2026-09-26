// WhatsApp messages the team sends to a customer from the admin booking panel,
// in the language the customer booked in. Pure helpers (no Firebase).
//
// The texts state only what the booking record holds. Details the record does
// not have (pickup time, driver) are left as [brackets] for the operator to
// fill in before sending, so nothing is promised by default.

// Google's "write a review" link for the business profile. GOOGLE_PLACE_ID
// is exposed to the admin bundle by next.config.mjs; without it the review
// message asks for feedback by reply instead.
const PLACE_ID = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_PLACE_ID || "";
export const GOOGLE_REVIEW_URL = PLACE_ID
  ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(PLACE_ID)}`
  : "";

/**
 * Digits for wa.me/<number>: international format without "+" or "00".
 * Georgian mobiles are often typed locally ("5XX XX XX XX" / "05XX…"), which
 * wa.me cannot open, so they get the 995 country code.
 */
export function whatsappNumber(phone) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^05\d{8}$/.test(digits)) digits = digits.slice(1);
  if (/^5\d{8}$/.test(digits)) digits = `995${digits}`;
  return digits.length >= 7 ? digits : "";
}

export function whatsappToCustomer(phone, text = "") {
  const number = whatsappNumber(phone);
  if (!number) return "";
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

const TEMPLATES = {
  ka: {
    hello: (b) => `გამარჯობა${b.name ? `, ${b.name}` : ""}! გწერთ GeorgiaTrips-იდან თქვენი ჯავშნის (${b.id}) შესახებ.`,
    confirm: (b) =>
      `გამარჯობა${b.name ? `, ${b.name}` : ""}! თქვენი ჯავშანი დადასტურებულია ✅\n\n` +
      `ჯავშნის №: ${b.id}\nტური: ${b.tour}\nთარიღი: ${b.date}\nმგზავრები: ${b.people}\nჯამი: ₾${b.total} — გადახდა ტურის დღეს\n\n` +
      `აყვანის დრო და ადგილი: [შეავსეთ]\n\nკითხვები? უბრალოდ მოგვწერეთ აქ.`,
    reminder: (b) =>
      `გამარჯობა${b.name ? `, ${b.name}` : ""}! შეგახსენებთ: ხვალ (${b.date}) გელოდებათ ტური „${b.tour}“.\n\n` +
      `აყვანა: [დრო, ადგილი]\nმძღოლი: [სახელი, ტელეფონი]\n\nკარგ მოგზაურობას გისურვებთ!`,
    review: (b, url) =>
      `გმადლობთ, რომ იმოგზაურეთ GeorgiaTrips-თან${b.name ? `, ${b.name}` : ""}! ` +
      (url ? `თუ ტური „${b.tour}“ მოგეწონათ, მოკლე შეფასება Google-ზე ძალიან დაგვეხმარება:\n${url}` : `მოგვწერეთ, როგორ ჩაიარა ტურმა „${b.tour}“ — თქვენი აზრი ჩვენთვის მნიშვნელოვანია.`),
  },
  en: {
    hello: (b) => `Hello${b.name ? ` ${b.name}` : ""}! This is GeorgiaTrips about your booking ${b.id}.`,
    confirm: (b) =>
      `Hello${b.name ? ` ${b.name}` : ""}! Your booking is confirmed ✅\n\n` +
      `Booking no.: ${b.id}\nTour: ${b.tour}\nDate: ${b.date}\nTravellers: ${b.people}\nTotal: ₾${b.total} — paid on the day of the tour\n\n` +
      `Pickup time and place: [fill in]\n\nAny questions? Just reply here.`,
    reminder: (b) =>
      `Hello${b.name ? ` ${b.name}` : ""}! A reminder: your tour “${b.tour}” is tomorrow (${b.date}).\n\n` +
      `Pickup: [time, place]\nDriver: [name, phone]\n\nHave a great trip!`,
    review: (b, url) =>
      `Thank you for travelling with GeorgiaTrips${b.name ? `, ${b.name}` : ""}! ` +
      (url ? `If you enjoyed “${b.tour}”, a short Google review would help us a lot:\n${url}` : `How was “${b.tour}”? We'd love to hear your feedback — just reply here.`),
  },
  ru: {
    hello: (b) => `Здравствуйте${b.name ? `, ${b.name}` : ""}! Пишем из GeorgiaTrips по вашему бронированию ${b.id}.`,
    confirm: (b) =>
      `Здравствуйте${b.name ? `, ${b.name}` : ""}! Ваше бронирование подтверждено ✅\n\n` +
      `Номер брони: ${b.id}\nТур: ${b.tour}\nДата: ${b.date}\nТуристов: ${b.people}\nИтого: ₾${b.total} — оплата в день тура\n\n` +
      `Время и место встречи: [заполнить]\n\nЕсть вопросы? Просто ответьте на это сообщение.`,
    reminder: (b) =>
      `Здравствуйте${b.name ? `, ${b.name}` : ""}! Напоминаем: ваш тур «${b.tour}» уже завтра (${b.date}).\n\n` +
      `Встреча: [время, место]\nВодитель: [имя, телефон]\n\nХорошей поездки!`,
    review: (b, url) =>
      `Спасибо, что путешествовали с GeorgiaTrips${b.name ? `, ${b.name}` : ""}! ` +
      (url ? `Если вам понравился тур «${b.tour}», короткий отзыв в Google очень нам поможет:\n${url}` : `Как вам тур «${b.tour}»? Будем рады вашему отзыву — просто ответьте здесь.`),
  },
  tr: {
    hello: (b) => `Merhaba${b.name ? ` ${b.name}` : ""}! GeorgiaTrips'ten ${b.id} numaralı rezervasyonunuz hakkında yazıyoruz.`,
    confirm: (b) =>
      `Merhaba${b.name ? ` ${b.name}` : ""}! Rezervasyonunuz onaylandı ✅\n\n` +
      `Rezervasyon no: ${b.id}\nTur: ${b.tour}\nTarih: ${b.date}\nKişi: ${b.people}\nToplam: ₾${b.total} — ödeme tur günü\n\n` +
      `Alış saati ve yeri: [doldurun]\n\nSorunuz varsa buradan yazmanız yeterli.`,
    reminder: (b) =>
      `Merhaba${b.name ? ` ${b.name}` : ""}! Hatırlatma: “${b.tour}” turunuz yarın (${b.date}).\n\n` +
      `Alış: [saat, yer]\nŞoför: [isim, telefon]\n\nİyi yolculuklar!`,
    review: (b, url) =>
      `GeorgiaTrips ile seyahat ettiğiniz için teşekkürler${b.name ? `, ${b.name}` : ""}! ` +
      (url ? `“${b.tour}” turunu beğendiyseniz, kısa bir Google yorumu bize çok yardımcı olur:\n${url}` : `“${b.tour}” turu nasıldı? Görüşlerinizi buraya yazabilirsiniz.`),
  },
  ar: {
    hello: (b) => `مرحباً${b.name ? ` ${b.name}` : ""}! نتواصل معك من GeorgiaTrips بخصوص حجزك ${b.id}.`,
    confirm: (b) =>
      `مرحباً${b.name ? ` ${b.name}` : ""}! تم تأكيد حجزك ✅\n\n` +
      `رقم الحجز: ${b.id}\nالجولة: ${b.tour}\nالتاريخ: ${b.date}\nعدد المسافرين: ${b.people}\nالإجمالي: ₾${b.total} — الدفع يوم الجولة\n\n` +
      `وقت ومكان الاستقبال: [يُكمل]\n\nلأي سؤال، راسلنا هنا.`,
    reminder: (b) =>
      `مرحباً${b.name ? ` ${b.name}` : ""}! تذكير: جولتك «${b.tour}» غداً (${b.date}).\n\n` +
      `الاستقبال: [الوقت، المكان]\nالسائق: [الاسم، الهاتف]\n\nرحلة سعيدة!`,
    review: (b, url) =>
      `شكراً لسفرك مع GeorgiaTrips${b.name ? ` ${b.name}` : ""}! ` +
      (url ? `إذا أعجبتك جولة «${b.tour}»، فإن تقييماً قصيراً على Google يساعدنا كثيراً:\n${url}` : `كيف كانت جولة «${b.tour}»؟ يسعدنا سماع رأيك هنا.`),
  },
};

/** kind: "hello" | "confirm" | "reminder" | "review" */
export function customerMessage(kind, booking) {
  const lang = TEMPLATES[booking?.customer?.language] ? booking.customer.language : "en";
  const name = String(booking?.customer?.fullName || "").replace(/^მგზავრი \/ Guest$/, "").trim();
  const date = booking?.trip?.date && booking.trip.date !== "by_agreement" ? booking.trip.date : "—";
  const data = {
    id: booking?.bookingId || booking?.id || "",
    name,
    tour: booking?.tourTitle || "",
    date,
    people: booking?.trip?.totalPeople || 1,
    total: booking?.pricing?.totalPrice ?? booking?.price ?? "",
  };
  return TEMPLATES[lang][kind](data, GOOGLE_REVIEW_URL);
}
