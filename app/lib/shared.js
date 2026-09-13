import Image from "next/image";

// ============================================================
// SHARED CONFIG & HELPERS
// ============================================================
export const WA_NUMBER = "995504220020";
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const PHONE_DISPLAY = "+995 504 22 00 20";
export const TELEGRAM_HANDLE = "+995504220020";
export const TELEGRAM_LINK = `https://t.me/${TELEGRAM_HANDLE}`;
export const INSTAGRAM_HANDLE = "georgiatrips.ge";
export const INSTAGRAM_LINK = `https://instagram.com/${INSTAGRAM_HANDLE}`;
export const FACEBOOK_LINK = "https://www.facebook.com/profile.php?id=61588059054976";
export const TIKTOK_LINK = "https://www.tiktok.com/@travell_company";
export const YOUTUBE_LINK = "https://www.youtube.com/@GeorgiaTrips";
export const LINKEDIN_LINK = "https://www.linkedin.com/in/georgia-trips-6652b942b/";

export const SOCIAL_PROFILES = [
  FACEBOOK_LINK,
  INSTAGRAM_LINK,
  YOUTUBE_LINK,
  TIKTOK_LINK,
  LINKEDIN_LINK,
  TELEGRAM_LINK,
];

export const FAQS_BY_LANG = {
  ka: [
    {
      q: "როგორ დავჯავშნო ტური?",
      a: "აირჩიეთ სასურველი ტური და დააჭირეთ ღილაკს „დაჯავშნეთ“ — ავტომატურად გადახვალთ WhatsApp-ზე, სადაც ჩვენი კონსულტანტი 30 წუთში გიპასუხებთ. ასევე შეგიძლიათ საიტზე შეავსოთ დაჯავშნის ფორმა.",
    },
    {
      q: "შესაძლებელია თუ არა ინდივიდუალური მარშრუტის შედგენა?",
      a: "რა თქმა უნდა! ჩვენი გუნდი შეადგენს სრულად პერსონალიზებულ მარშრუტს თქვენი ინტერესების, ბიუჯეტისა და დროის მიხედვით — მთის თავგადასავლებიდან ღვინის ტურებამდე.",
    },
    {
      q: "რა შედის ტურის ფასში?",
      a: "სტანდარტულად ფასში შედის ტრანსპორტი კომფორტული ავტომობილით, პროფესიონალი გიდი და დაზღვევა. VIP პაკეტებში ემატება სასტუმრო, კვება და დამატებითი სერვისები — დეტალები დაზუსტდება ჯავშნისას.",
    },
    {
      q: "ხელმისაწვდომია თუ არა ჰალალ კვება?",
      a: "დიახ, ჩვენ ვთანამშრომლობთ ჰალალ სერტიფიცირებულ რესტორნებთან თბილისში, ბათუმსა და მთავარ ტურისტულ მიმართულებებზე. წინასწარ გვაცნობეთ და ყველაფერს მოვამზადებთ.",
    },
    {
      q: "რომელ ენებზე საუბრობენ გიდები?",
      a: "ჩვენი გიდები საუბრობენ ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე. სხვა ენის საჭიროების შემთხვევაში წინასწარ შეგვატყობინეთ.",
    },
    {
      q: "შესაძლებელია თუ არა ჯავშნის გაუქმება?",
      a: "დიახ, ჯავშნის უფასო გაუქმება შესაძლებელია ტურის დაწყებამდე 48 საათით ადრე. დეტალური პირობები დამოკიდებულია ტურის ტიპზე და დაზუსტდება დაჯავშნისას.",
    },
  ],
  en: [
    {
      q: "How can I book a tour?",
      a: "Choose your desired tour and click 'Book Now' — you'll be connected directly to WhatsApp where our team responds within minutes. You can also fill out the online reservation form on the website.",
    },
    {
      q: "Can I request a custom private itinerary?",
      a: "Absolutely! We create fully customized itineraries tailored to your schedule, preferences, and budget — from mountain 4x4 adventures to exclusive wine tours.",
    },
    {
      q: "What is included in the tour price?",
      a: "Standard tours include private transport in a modern air-conditioned vehicle, experienced driver and multilingual guide. VIP packages can include accommodation, meals, and entry tickets.",
    },
    {
      q: "Is Halal food available during tours?",
      a: "Yes, we partner with certified Halal restaurants across Tbilisi, Batumi, and key tourist destinations. Just inform us during booking.",
    },
    {
      q: "What languages do your guides speak?",
      a: "Our professional guides speak English, Russian, Turkish, Arabic, and Georgian.",
    },
    {
      q: "What is your cancellation policy?",
      a: "Free cancellation is available up to 48 hours before the tour departure time. Terms may vary slightly for multi-day custom tours.",
    },
  ],
  ru: [
    {
      q: "Как забронировать тур?",
      a: "Выберите тур и нажмите кнопку «Забронировать» — вы перейдете в WhatsApp, где наш менеджер ответит в течение нескольких минут. Также можно заполнить форму на сайте.",
    },
    {
      q: "Можно ли составить индивидуальный маршрут?",
      a: "Конечно! Мы с радостью составим индивидуальную программу по вашим пожеланиям и бюджету — от горных джип-туров до винных экскурсий в Кахетию.",
    },
    {
      q: "Что входит в стоимость тура?",
      a: "В стоимость входит комфортабельный транспорт, опытный водитель, услуги гида и бесплатный Wi-Fi. В VIP-пакеты могут быть включены отели, питание и дегустации.",
    },
    {
      q: "Доступно ли халяльное питание?",
      a: "Да, мы сотрудничаем с сертифицированными халяль ресторанами в Тбилиси, Батуми и по всей Грузии. Просто предупредите нас при бронировании.",
    },
    {
      q: "На каких языках говорят гиды?",
      a: "Наши гиды говорят на русском, английском, грузинском, турецком и арабском языках.",
    },
    {
      q: "Можно ли отменить бронирование?",
      a: "Бесплатная отмена доступна за 48 часов до начала тура. Подробные условия уточняются при бронировании.",
    },
  ],
  tr: [
    {
      q: "Nasıl tur rezervasyonu yapabilirim?",
      a: "İstediğiniz turu seçin ve 'Rezervasyon Yap' butonuna tıklayın — WhatsApp üzerinden danışmanımız dakikalar içinde sizinle iletişime geçecektir.",
    },
    {
      q: "Özel bir rota oluşturabilir miyiz?",
      a: "Kesinlikle! İlgi alanlarınıza, bütçenize ve zamanınıza göre tamamen size özel turlar planlıyoruz.",
    },
    {
      q: "Tur fiyatına neler dahildir?",
      a: "Konforlu klimalı araçlarla ulaşım, deneyimli sürücü ve profesyonel rehberlik hizmeti fiyata dahildir.",
    },
    {
      q: "Helal yemek seçenekleri mevcut mu?",
      a: "Evet, Tiflis, Batum ve tüm turistik bölgelerde helal sertifikalı restoranlarla çalışıyoruz.",
    },
    {
      q: "Rehberler hangi dilleri konuşuyor?",
      a: "Rehberlerimiz Türkçe, İngilizce, Rusça, Gürcüce ve Arapça bilmektedir.",
    },
    {
      q: "İptal politikası nedir?",
      a: "Tur başlangıcından 48 saat öncesine kadar yapılan iptallerde tam ücret iadesi yapılır.",
    },
  ],
  ar: [
    {
      q: "كيف يمكنني حجز جولة سياحية؟",
      a: "اختر الجولة المطلوبة واضغط على زر 'احجز الآن' — سيتم تحويلك مباشرة إلى واتساب حيث سيجيبك فريقنا خلال دقائق معدودة.",
    },
    {
      q: "هل يمكن تنظيم برنامج سياحي مخصص؟",
      a: "بالتأكيد! نصمم برامج سياحية خاصة بالكامل تناسب رغباتكم وعدد أفراد عائلتكم وميزانيتكم.",
    },
    {
      q: "ماذا يشمل سعر الجولة؟",
      a: "يشمل السعر سيارة حديثة مريحة ومكيفة مع سائق خاص ومرشد يتحدث لغتكم وخدمة واي فاي مجانية وماء بارد.",
    },
    {
      q: "هل يتوفر طعام حلال أثناء الجولات؟",
      a: "نعم، نتعامل مع أفضل المطاعم الحلال المعتمدة في تبليسي وباتومي وكافة المدن السياحية.",
    },
    {
      q: "ما هي اللغات التي يتحدث بها المرشدون؟",
      a: "يتحدث مرشدونا وسائقونا العربية، الإنجليزية، الروسية، التركية والجورجية.",
    },
    {
      q: "ما هي سياسة إلغاء الحجز؟",
      a: "يمكن إلغاء الحجز مجاناً قبل موعد انطلاق الجولة بـ 48 ساعة.",
    },
  ],
};

export const FAQS = FAQS_BY_LANG.ka;

export function getFaqs(lang = "ka") {
  return FAQS_BY_LANG[lang] || FAQS_BY_LANG.ka;
}

// Brand logo — uses the uploaded logo.webp asset
export const BrandLogo = ({ width = 48, height = 48, priority = false }) => (
  <Image
    src="/logo.webp"
    alt="GeorgiaTrips"
    width={width}
    height={height}
    priority={priority}
    className="brand-logo-img"
    style={{ width, height, objectFit: "contain" }}
  />
);

// WhatsApp icon
export const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
  </svg>
);

// Send a WhatsApp booking message for a specific tour
export const bookTourOnWhatsApp = (tourTitle, tourPrice, lang = "ka") => {
  const greetings = {
    ka: `გამარჯობა! მინდა დავაჯავშნო ტური: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`,
    en: `Hello! I would like to book the tour: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`,
    ru: `Здравствуйте! Я хочу забронировать тур: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`,
    tr: `Merhaba! Tur rezervasyonu yapmak istiyorum: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`,
    ar: `مرحباً! أود حجز الجولة السياحية: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`,
  };
  const msg = greetings[lang] || greetings.ka;
  window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
};
