// Interface strings shared by the SEO landing pages (tours-from-batumi,
// private-tours-batumi, things-to-do-in-batumi, waterfalls-near-batumi,
// batumi-airport-transfer, transfer route pages). Page-specific copy stays in
// each page; only the repeated chrome lives here, in all five languages, so a
// /tr or /ar page never falls back to English headings.

export const LANDING_UI = {
  ka: {
    home: "მთავარი",
    faqTag: "ხშირი კითხვები",
    faqTitle: "ხშირად დასმული კითხვები",
    tipsTag: "რჩევები მოგზაურებს",
    advantagesTag: "რატომ GeorgiaTrips",
    featuredTag: "რჩეული ტურები",
    pricingTag: "გამჭვირვალე ფასები",
    fleetTag: "ჩვენი ავტოპარკი",
    whatsapp: "WhatsApp-ზე მოწერა",
    bookingNote: "ჯავშანი უფასოა: გუნდი WhatsApp-ით ან ტელეფონით დაგიდასტურებთ, გადახდა ხდება მომსახურების დღეს.",
  },
  en: {
    home: "Home",
    faqTag: "FAQ",
    faqTitle: "Frequently Asked Questions",
    tipsTag: "Traveler Tips",
    advantagesTag: "Why GeorgiaTrips",
    featuredTag: "Featured Tours",
    pricingTag: "Transparent Pricing",
    fleetTag: "Our Fleet",
    whatsapp: "Message us on WhatsApp",
    bookingNote: "Booking is free: our team confirms by WhatsApp or phone, and you pay on the day of service.",
  },
  ru: {
    home: "Главная",
    faqTag: "Вопросы",
    faqTitle: "Часто задаваемые вопросы",
    tipsTag: "Советы туристам",
    advantagesTag: "Почему GeorgiaTrips",
    featuredTag: "Избранные туры",
    pricingTag: "Прозрачные цены",
    fleetTag: "Наш автопарк",
    whatsapp: "Написать в WhatsApp",
    bookingNote: "Бронирование бесплатное: команда подтвердит его в WhatsApp или по телефону, оплата — в день поездки.",
  },
  tr: {
    home: "Ana Sayfa",
    faqTag: "SSS",
    faqTitle: "Sıkça Sorulan Sorular",
    tipsTag: "Gezgin İpuçları",
    advantagesTag: "Neden GeorgiaTrips",
    featuredTag: "Öne Çıkan Turlar",
    pricingTag: "Şeffaf Fiyatlar",
    fleetTag: "Araç Filomuz",
    whatsapp: "WhatsApp'tan Yazın",
    bookingNote: "Rezervasyon ücretsizdir: ekibimiz WhatsApp veya telefonla onaylar, ödeme hizmet günü yapılır.",
  },
  ar: {
    home: "الرئيسية",
    faqTag: "الأسئلة الشائعة",
    faqTitle: "الأسئلة الشائعة",
    tipsTag: "نصائح للمسافرين",
    advantagesTag: "لماذا GeorgiaTrips",
    featuredTag: "جولات مميزة",
    pricingTag: "أسعار واضحة",
    fleetTag: "أسطول سياراتنا",
    whatsapp: "راسلنا عبر واتساب",
    bookingNote: "الحجز مجاني: يؤكد فريقنا الحجز عبر واتساب أو الهاتف، والدفع يكون يوم الخدمة.",
  },
};

export function landingUi(lang) {
  return LANDING_UI[lang] || LANDING_UI.en;
}
