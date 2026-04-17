/* =========================================================
   UI STRINGS DICTIONARY
   -----------------------------------------------------------
   Static translations for short, frequently-used UI labels
   that appear inside `data-no-translate` containers (tour
   cards, car cards, modals, etc.) and therefore cannot be
   handled by the MyMemory-powered runtime translator.

   Usage:
     window.t('book_this_tour')          → localized label
     window.t('min_people', { n: 4 })    → tokens supported
   ========================================================= */
(function () {
  const FALLBACK_ORDER = ['ka', 'en', 'ru', 'tr', 'uk', 'ar', 'he', 'fa'];

  const STRINGS = {
    /* ===== Tour cards ===== */
    book_this_tour: {
      ka: 'დაჯავშნე ეს ტური',
      en: 'Book This Tour',
      ru: 'Забронировать тур',
      tr: 'Bu Turu Rezerve Et',
      ar: 'احجز هذه الجولة',
      he: 'הזמן סיור זה',
      fa: 'رزرو این تور',
      uk: 'Забронювати тур'
    },
    min_people: {
      ka: 'მინ. ადამიანი',
      en: 'Min People',
      ru: 'Мин. человек',
      tr: 'Min. Kişi',
      ar: 'الحد الأدنى',
      he: 'מינ׳ אנשים',
      fa: 'حداقل افراد',
      uk: 'Мін. осіб'
    },
    max_people: {
      ka: 'მაქს. ადამიანი',
      en: 'Max People',
      ru: 'Макс. человек',
      tr: 'Maks. Kişi',
      ar: 'الحد الأقصى',
      he: 'מקס׳ אנשים',
      fa: 'حداکثر افراد',
      uk: 'Макс. осіб'
    },
    per_person: {
      ka: 'ერთ ადამიანზე',
      en: 'per person',
      ru: 'за человека',
      tr: 'kişi başı',
      ar: 'للشخص',
      he: 'לאדם',
      fa: 'به ازای هر نفر',
      uk: 'з людини'
    },
    for_n_people: {
      ka: '{n} ადამიანზე',
      en: 'for {n} people',
      ru: 'за {n} человек',
      tr: '{n} kişi için',
      ar: 'لـ {n} أشخاص',
      he: 'עבור {n} אנשים',
      fa: 'برای {n} نفر',
      uk: 'за {n} осіб'
    },
    total: {
      ka: 'სულ',
      en: 'total',
      ru: 'всего',
      tr: 'toplam',
      ar: 'إجمالي',
      he: 'סה״כ',
      fa: 'مجموع',
      uk: 'всього'
    },
    on_request: {
      ka: 'შეკითხვით',
      en: 'On Request',
      ru: 'По запросу',
      tr: 'İstek Üzerine',
      ar: 'عند الطلب',
      he: 'לפי בקשה',
      fa: 'با درخواست',
      uk: 'На запит'
    },
    price_on_request: {
      ka: 'ფასი შეკითხვით',
      en: 'Price On Request',
      ru: 'Цена по запросу',
      tr: 'Fiyat İstek Üzerine',
      ar: 'السعر عند الطلب',
      he: 'מחיר לפי בקשה',
      fa: 'قیمت با درخواست',
      uk: 'Ціна на запит'
    },
    from_price: {
      ka: 'დან',
      en: 'From',
      ru: 'От',
      tr: 'Başlangıç',
      ar: 'من',
      he: 'החל מ־',
      fa: 'از',
      uk: 'Від'
    },
    one_day: {
      ka: '1 დღე',
      en: '1 Day',
      ru: '1 день',
      tr: '1 Gün',
      ar: 'يوم واحد',
      he: 'יום אחד',
      fa: '۱ روز',
      uk: '1 день'
    },
    /* ===== Cars ===== */
    book_car: {
      ka: 'მანქანის დაჯავშნა',
      en: 'Book Car',
      ru: 'Забронировать авто',
      tr: 'Araç Kirala',
      ar: 'احجز السيارة',
      he: 'הזמן רכב',
      fa: 'رزرو خودرو',
      uk: 'Забронювати авто'
    },
    per_day: {
      ka: 'დღეში',
      en: 'per day',
      ru: 'в сутки',
      tr: 'günlük',
      ar: 'في اليوم',
      he: 'ליום',
      fa: 'در روز',
      uk: 'за день'
    },
    /* ===== Misc ===== */
    loading: {
      ka: 'იტვირთება…',
      en: 'Loading…',
      ru: 'Загрузка…',
      tr: 'Yükleniyor…',
      ar: 'جار التحميل…',
      he: 'טוען…',
      fa: 'در حال بارگذاری…',
      uk: 'Завантаження…'
    },
    read_more: {
      ka: 'მეტის ნახვა',
      en: 'Read More',
      ru: 'Подробнее',
      tr: 'Devamını Oku',
      ar: 'اقرأ المزيد',
      he: 'קרא עוד',
      fa: 'بیشتر',
      uk: 'Читати більше'
    },
    book_now: {
      ka: 'დაჯავშნე ახლა',
      en: 'Book Now',
      ru: 'Забронировать',
      tr: 'Hemen Rezerve Et',
      ar: 'احجز الآن',
      he: 'הזמן עכשיו',
      fa: 'اکنون رزرو کنید',
      uk: 'Забронювати'
    },
    view_details: {
      ka: 'დეტალები',
      en: 'View Details',
      ru: 'Подробнее',
      tr: 'Detayları Gör',
      ar: 'عرض التفاصيل',
      he: 'פרטים נוספים',
      fa: 'مشاهده جزئیات',
      uk: 'Детальніше'
    }
  };

  function currentLang() {
    try {
      if (window.GTLang && typeof window.GTLang.get === 'function') {
        return window.GTLang.get() || 'ka';
      }
    } catch (e) { /* ignore */ }
    return document.documentElement.getAttribute('data-lang') || 'ka';
  }

  function pick(entry, lang) {
    if (!entry) return '';
    if (entry[lang]) return entry[lang];
    for (const f of FALLBACK_ORDER) {
      if (entry[f]) return entry[f];
    }
    return '';
  }

  function interpolate(str, tokens) {
    if (!tokens) return str;
    return str.replace(/\{(\w+)\}/g, (m, k) => (tokens[k] != null ? String(tokens[k]) : m));
  }

  function t(key, tokens, lang) {
    const L = lang || currentLang();
    const val = pick(STRINGS[key], L);
    return interpolate(val, tokens);
  }

  window.t = t;
  window.GTUIStrings = { t, STRINGS };
})();
