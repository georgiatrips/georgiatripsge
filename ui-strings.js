/* =========================================================
   UI STRINGS DICTIONARY  (georgiatrips)
   -----------------------------------------------------------
   Two responsibilities:

   1. `t(key, tokens)`   – translated labels referenced by JS
      (e.g. `t('book_this_tour')`) for text that is rendered
      inside `data-no-translate` containers.

   2. `lookupPhrase(src, lang)` – instant lookup used by
      `ui-translate.js` as a high-priority cache before it
      falls back to the MyMemory API. Pre-translating every
      common nav / hero / section phrase removes nearly all
      first-paint lag and also guarantees correct wording
      (e.g. "Home" → "მთავარი" instead of API's "საწყისი").
   ========================================================= */
(function () {
  const FALLBACK_ORDER = ['ka', 'en', 'ru', 'tr', 'uk', 'ar', 'he'];

  /* ---------- JS-facing keyed strings ---------- */
  const STRINGS = {
    book_this_tour: {
      ka: 'დაჯავშნე ეს ტური', en: 'Book This Tour', ru: 'Забронировать тур',
      tr: 'Bu Turu Rezerve Et', ar: 'احجز هذه الجولة', he: 'הזמן סיור זה',
      uk: 'Забронювати тур'
    },
    min_people: {
      ka: 'მინ. ადამიანი', en: 'Min People', ru: 'Мин. человек', tr: 'Min. Kişi',
      ar: 'الحد الأدنى', he: 'מינ׳ אנשים', uk: 'Мін. осіб'
    },
    max_people: {
      ka: 'მაქს. ადამიანი', en: 'Max People', ru: 'Макс. человек', tr: 'Maks. Kişi',
      ar: 'الحد الأقصى', he: 'מקס׳ אנשים', uk: 'Макс. осіб'
    },
    per_person: {
      ka: 'ერთ ადამიანზე', en: 'per person', ru: 'за человека', tr: 'kişi başı',
      ar: 'للشخص', he: 'לאדם', uk: 'з людини'
    },
    for_n_people: {
      ka: '{n} ადამიანზე', en: 'for {n} people', ru: 'за {n} человек',
      tr: '{n} kişi için', ar: 'لـ {n} أشخاص', he: 'עבור {n} אנשים',
      uk: 'за {n} осіб'
    },
    total: {
      ka: 'სულ', en: 'total', ru: 'всего', tr: 'toplam',
      ar: 'إجمالي', he: 'סה״כ', uk: 'всього'
    },
    on_request: {
      ka: 'შეთანხმებით', en: 'Negotiable', ru: 'Договорная', tr: 'Görüşülür',
      ar: 'قابل للتفاوض', he: 'בתיאום', uk: 'Договірна'
    },
    price_on_request: {
      ka: 'შეთანხმებით', en: 'Negotiable', ru: 'Договорная',
      tr: 'Görüşülür', ar: 'قابل للتفاوض', he: 'בתיאום',
      uk: 'Договірна'
    },
    from_price: {
      ka: 'დან', en: 'From', ru: 'От', tr: 'Başlangıç',
      ar: 'من', he: 'החל מ־', uk: 'Від'
    },
    one_day: {
      ka: '1 დღე', en: '1 Day', ru: '1 день', tr: '1 Gün',
      ar: 'يوم واحد', he: 'יום אחד', uk: '1 день'
    },
    book_car: {
      ka: 'მანქანის დაჯავშნა', en: 'Book Car', ru: 'Забронировать авто',
      tr: 'Araç Kirala', ar: 'احجز السيارة', he: 'הזמן רכב',
      uk: 'Забронювати авто'
    },
    per_day: {
      ka: 'დღეში', en: 'per day', ru: 'в сутки', tr: 'günlük',
      ar: 'في اليوم', he: 'ליום', uk: 'за день'
    },
    loading: {
      ka: 'იტვირთება…', en: 'Loading…', ru: 'Загрузка…', tr: 'Yükleniyor…',
      ar: 'جار التحميل…', he: 'טוען…', uk: 'Завантаження…'
    },
    read_more: {
      ka: 'მეტის ნახვა', en: 'Read More', ru: 'Подробнее', tr: 'Devamını Oku',
      ar: 'اقرأ المزيد', he: 'קרא עוד', uk: 'Читати більше'
    },
    book_now: {
      ka: 'დაჯავშნე ახლა', en: 'Book Now', ru: 'Забронировать',
      tr: 'Hemen Rezerve Et', ar: 'احجز الآن', he: 'הזמן עכשיו',
      uk: 'Забронювати'
    },
    view_details: {
      ka: 'დეტალები', en: 'View Details', ru: 'Подробнее', tr: 'Detayları Gör',
      ar: 'عرض التفاصيل', he: 'פרטים נוספים', uk: 'Детальніше'
    },
    /* ---- Featured slider ---- */
    explore_now: {
      ka: 'აღმოაჩინე ახლა', en: 'Explore Now', ru: 'Исследовать', tr: 'Şimdi Keşfet',
      ar: 'اكتشف الآن', he: 'גלה עכשיו', uk: 'Досліджувати'
    },
    best_deal: {
      ka: '⭐ საუკეთესო შეთავაზება', en: '⭐ Best Deal', ru: '⭐ Лучшее предложение',
      tr: '⭐ En İyi Teklif', ar: '⭐ أفضل عرض', he: '⭐ המבצע הכי טוב',
      uk: '⭐ Найкраща пропозиція'
    },
    featured_destinations: {
      ka: 'სეზონის საუკეთესო მიმართულებები', en: 'Featured Destinations', ru: 'Рекомендуемые направления',
      tr: 'Öne Çıkan Destinasyonlar', ar: 'الوجهات المميزة', he: 'יעדים מומלצים',
      uk: 'Рекомендовані напрямки'
    },
    highlights_title: {
      ka: '✨ მთავარი მომენტები', en: '✨ Highlights', ru: '✨ Основные моменты',
      tr: '✨ Öne Çıkanlar', ar: '✨ أبرز ما فيها', he: '✨ עיקרים',
      uk: '✨ Основні моменти'
    },
    guided_tour: {
      ka: 'გიდთან ერთად', en: 'Guided Tour', ru: 'С гидом',
      tr: 'Rehberli Tur', ar: 'جولة مع مرشد', he: 'סיור עם מדריך',
      uk: 'З гідом'
    },
    all_year: {
      ka: 'მთელი წლის მანძილზე', en: 'All Year', ru: 'Круглый год',
      tr: 'Tüm Yıl', ar: 'طوال العام', he: 'כל השנה',
      uk: 'Цілий рік'
    },
    flexible: {
      ka: 'მოქნილი', en: 'Flexible', ru: 'Гибкий',
      tr: 'Esnek', ar: 'مرن', he: 'גמיש',
      uk: 'Гнучкий'
    },
    /* "{n} Days" — supports single day and ranged values like "1–5" */
    n_days: {
      ka: '{n} დღე', en: '{n} Days', ru: '{n} дней',
      tr: '{n} Gün', ar: '{n} أيام', he: '{n} ימים',
      uk: '{n} днів'
    },
    loading: {
      ka: 'იტვირთება', en: 'Loading', ru: 'Загрузка',
      tr: 'Yükleniyor', ar: 'جاري التحميل', he: 'טוען',
      uk: 'Завантаження'
    },
    /* ---- Badges (tour type / category) ---- */
    badge_domestic: {
      ka: 'შიდა ტური', en: 'Domestic Tour', ru: 'Внутренний тур', tr: 'Yurt İçi Tur',
      ar: 'جولة داخلية', he: 'סיור מקומי', uk: 'Внутрішній тур'
    },
    badge_international: {
      ka: 'საერთაშორისო ტური', en: 'International Tour', ru: 'Международный тур', tr: 'Uluslararası Tur',
      ar: 'جولة دولية', he: 'סיור בינלאומי', uk: 'Міжнародний тур'
    },
    tag_one_day: {
      ka: 'ერთდღიანი თავგადასავალი', en: 'One-Day Adventure', ru: 'Однодневное приключение',
      tr: 'Tek Günlük Macera', ar: 'مغامرة ليوم واحد', he: 'הרפתקה ליום אחד',
      uk: 'Одноденна пригода'
    },
    tag_multi_day: {
      ka: 'მრავალდღიანი გამოცდილება', en: 'Multi-Day Experience', ru: 'Многодневный опыт',
      tr: 'Çok Günlü Deneyim', ar: 'تجربة متعددة الأيام', he: 'חוויה רב־יומית',
      uk: 'Багатоденний досвід'
    },
    tag_upcoming: {
      ka: 'მალე', en: 'Upcoming Event', ru: 'Предстоящее событие',
      tr: 'Yaklaşan Etkinlik', ar: 'فعالية قادمة', he: 'אירוע קרוב',
      uk: 'Найближча подія'
    },
    tag_flexible: {
      ka: 'მოქნილი ტური', en: 'Flexible Tour', ru: 'Гибкий тур',
      tr: 'Esnek Tur', ar: 'جولة مرنة', he: 'סיור גמיש',
      uk: 'Гнучкий тур'
    },
    /* ---- Badge labels ---- */
    badge_one_day: {
      ka: '1 დღე', en: 'One Day', ru: '1 день', tr: '1 Gün',
      ar: 'يوم واحد', he: 'יום אחד', uk: '1 день'
    },
    badge_multi_day: {
      ka: 'მრავალდღიანი', en: 'Multi Day', ru: 'Многодневный', tr: 'Çok Günlü',
      ar: 'متعدد الأيام', he: 'רב־יומי', uk: 'Багатоденний'
    },
    badge_flexible: {
      ka: 'მოქნილი', en: 'Flexible', ru: 'Гибкий', tr: 'Esnek',
      ar: 'مرن', he: 'גמיש', uk: 'Гнучкий'
    },
    badge_upcoming: {
      ka: 'მალე', en: 'Upcoming', ru: 'Скоро', tr: 'Yakında',
      ar: 'قريبًا', he: 'בקרוב', uk: 'Незабаром'
    },
    /* ---- Car Types ---- */
    type_sedan: {
      ka: 'სედანი', en: 'Sedan', ru: 'Седан', tr: 'Sedan',
      ar: 'سيدان', he: 'סדאן', uk: 'Седан'
    },
    type_suv: {
      ka: 'ჯიპი / SUV', en: 'SUV', ru: 'Внедорожник', tr: 'SUV',
      ar: 'سيارة دفع رباعي', he: 'רכב שטח', uk: 'Позашляховик'
    },
    type_minivan: {
      ka: 'მინივენი', en: 'Minivan', ru: 'Минивэн', tr: 'Minivan',
      ar: 'مينيفان', he: 'מיניוואן', uk: 'Мінівен'
    },
    type_van: {
      ka: 'ფურგონი', en: 'Van', ru: 'Фургон', tr: 'Panelvan',
      ar: 'حافلة صغيرة', he: 'ואן', uk: 'Фургон'
    },
    type_jeep: {
      ka: 'ჯიპი', en: 'Jeep', ru: 'Джип', tr: 'Jeep',
      ar: 'جيب', he: 'ג׳יפ', uk: 'Джип'
    },
    /* ---- Post Categories ---- */
    cat_culture: {
      ka: 'კულტურა', en: 'Culture', ru: 'Культура', tr: 'Kültür',
      ar: 'ثقافة', he: 'תרבות', uk: 'Культура'
    },
    cat_food: {
      ka: 'სამზარეულო', en: 'Food', ru: 'Еда', tr: 'Yemek',
      ar: 'طعام', he: 'אוכל', uk: 'Їжа'
    },
    cat_adventure: {
      ka: 'თავგადასავალი', en: 'Adventure', ru: 'Приключение', tr: 'Macera',
      ar: 'مغامرة', he: 'הרפתקה', uk: 'Пригода'
    },
    cat_travel_tips: {
      ka: 'რჩევები', en: 'Travel Tips', ru: 'Советы', tr: 'Seyahat İpuçları',
      ar: 'نصائح سفر', he: 'טיפים למטייל', uk: 'Поради'
    },
    cat_wine: {
      ka: 'ღვინო', en: 'Wine', ru: 'Вино', tr: 'Şarap',
      ar: 'نبيذ', he: 'יין', uk: 'Вино'
    },
    cat_school_tours: {
      ka: 'სასკოლო ტურები', en: 'School Tours', ru: 'Школьные туры', tr: 'Okul Turları',
      ar: 'رحلات مدرسية', he: 'טיולי בית ספר', uk: 'Шкільні тури'
    },
    /* ---- Meta labels ---- */
    label_price: {
      ka: 'ფასი', en: 'Price', ru: 'Цена', tr: 'Fiyat',
      ar: 'السعر', he: 'מחיר', uk: 'Ціна'
    },
    label_duration: {
      ka: 'ხანგრძლივობა', en: 'Duration', ru: 'Длительность', tr: 'Süre',
      ar: 'المدة', he: 'משך', uk: 'Тривалість'
    },
    label_season: {
      ka: 'სეზონი', en: 'Season', ru: 'Сезон', tr: 'Sezon',
      ar: 'الموسم', he: 'עונה', uk: 'Сезон'
    },
    label_min: {
      ka: 'მინ.', en: 'Min', ru: 'Мин.', tr: 'Min.',
      ar: 'الأدنى', he: 'מינ׳', uk: 'Мін.'
    },
    label_max: {
      ka: 'მაქს.', en: 'Max', ru: 'Макс.', tr: 'Maks.',
      ar: 'الأقصى', he: 'מקס׳', uk: 'Макс.'
    },
    /* ---- Empty states ---- */
    empty_domestic: {
      ka: 'შიდა ტურები ჯერჯერობით არ არის. მოგვიანებით შემოიარეთ!',
      en: 'No domestic tours available yet. Check back soon!',
      ru: 'Внутренних туров пока нет. Загляните позже!',
      tr: 'Henüz yurt içi tur yok. Kısa süre içinde tekrar kontrol edin!',
      ar: 'لا توجد جولات داخلية متاحة حتى الآن. تحقق مرة أخرى قريبًا!',
      he: 'עדיין אין סיורים מקומיים. חזרו בקרוב!',
      uk: 'Внутрішніх турів поки немає. Зазирніть згодом!'
    },
    empty_international: {
      ka: 'საერთაშორისო ტურები ჯერჯერობით არ არის. მოგვიანებით შემოიარეთ!',
      en: 'No international tours available yet. Check back soon!',
      ru: 'Международных туров пока нет. Загляните позже!',
      tr: 'Henüz uluslararası tur yok. Kısa süre içinde tekrar kontrol edin!',
      ar: 'لا توجد جولات دولية متاحة حتى الآن. تحقق مرة أخرى قريبًا!',
      he: 'עדיין אין סיורים בינלאומיים. חזרו בקרוב!',
      uk: 'Міжнародних турів поки немає. Зазирніть згодом!'
    },
    empty_cars: {
      ka: 'ხელმისაწვდომი ავტომობილები ჯერჯერობით არ არის.',
      en: 'No vehicles available yet.',
      ru: 'Автомобилей пока нет.',
      tr: 'Henüz araç yok.',
      ar: 'لا توجد مركبات متاحة حتى الآن.',
      he: 'עדיין אין רכבים זמינים.',
      uk: 'Автомобілів поки немає.'
    },
    empty_posts: {
      ka: 'სტატიები ჯერჯერობით არ არის.',
      en: 'No posts available yet.',
      ru: 'Публикаций пока нет.',
      tr: 'Henüz gönderi yok.',
      ar: 'لا توجد مقالات متاحة حتى الآن.',
      he: 'עדיין אין פוסטים.',
      uk: 'Публікацій поки немає.'
    },
    empty_featured: {
      ka: 'რჩეული შეთავაზებები ჯერჯერობით არ არის.',
      en: 'No featured offers available yet.',
      ru: 'Рекомендуемых предложений пока нет.',
      tr: 'Henüz öne çıkan teklif yok.',
      ar: 'لا توجد عروض مميزة حتى الآن.',
      he: 'עדיין אין מבצעים מובילים.',
      uk: 'Рекомендованих пропозицій поки немає.'
    },
    empty_tours: {
      ka: 'ტურები ჯერჯერობით არ არის.',
      en: 'No tours available yet.',
      ru: 'Туров пока нет.',
      tr: 'Henüz tur yok.',
      ar: 'لا توجد جولات متاحة حتى الآن.',
      he: 'עדיין אין סיורים.',
      uk: 'Турів поки немає.'
    },
    empty_tours_category: {
      ka: 'ამ კატეგორიაში ტურები ჯერჯერობით არ არის.',
      en: 'No tours in this category yet.',
      ru: 'В этой категории пока нет туров.',
      tr: 'Bu kategoride henüz tur yok.',
      ar: 'لا توجد جولات في هذه الفئة حتى الآن.',
      he: 'עדיין אין סיורים בקטגוריה זו.',
      uk: 'У цій категорії ще немає турів.'
    },
    empty_saved: {
      ka: 'შენახული ტურები ჯერჯერობით არ გაქვთ.',
      en: 'You have no saved tours yet.',
      ru: 'У вас пока нет сохранённых туров.',
      tr: 'Henüz kayıtlı turunuz yok.',
      ar: 'ليس لديك أي جولات محفوظة بعد.',
      he: 'עדיין אין לכם סיורים שמורים.',
      uk: 'У вас поки немає збережених турів.'
    },
    /* ---- Tours filter page: empty state + counters + categories ---- */
    empty_title: {
      ka: 'ტურები ვერ მოიძებნა',
      en: 'No tours found',
      ru: 'Туры не найдены',
      tr: 'Tur bulunamadı',
      ar: 'لم يتم العثور على جولات',
      he: 'לא נמצאו סיורים',
      uk: 'Тури не знайдено'
    },
    empty_subtitle: {
      ka: 'ამჟამად {category} არ არის ხელმისაწვდომი.',
      en: 'No {category} are available right now.',
      ru: 'Сейчас {category} недоступны.',
      tr: 'Şu anda {category} mevcut değil.',
      ar: 'لا تتوفر {category} في الوقت الحالي.',
      he: 'כרגע אין {category} זמינים.',
      uk: 'Наразі {category} недоступні.'
    },
    empty_cta: {
      ka: 'მოგვიანებით შემოიარეთ ან <a href="contact.html">დაგვიკავშირდით</a> ინდივიდუალური მოგზაურობისთვის.',
      en: 'Check back soon or <a href="contact.html">contact us</a> for a custom trip.',
      ru: 'Загляните позже или <a href="contact.html">свяжитесь с нами</a> для индивидуальной поездки.',
      tr: 'Kısa süre içinde tekrar bakın veya özel bir tur için <a href="contact.html">bize ulaşın</a>.',
      ar: 'تحقق مرة أخرى قريبًا أو <a href="contact.html">تواصل معنا</a> لرحلة مخصصة.',
      he: 'חזרו בקרוב או <a href="contact.html">צרו איתנו קשר</a> לטיול בהתאמה אישית.',
      uk: 'Зазирніть згодом або <a href="contact.html">зв\'яжіться з нами</a> для індивідуальної подорожі.'
    },
    cat_one_day: {
      ka: 'ერთდღიანი ტურები',
      en: 'One-Day Tours',
      ru: 'Однодневные туры',
      tr: 'Günübirlik Turlar',
      ar: 'جولات يومية',
      he: 'סיורים בני יום',
      uk: 'Одноденні тури'
    },
    cat_multi_day: {
      ka: 'მრავალდღიანი ტურები',
      en: 'Multi-Day Tours',
      ru: 'Многодневные туры',
      tr: 'Çok Günlü Turlar',
      ar: 'جولات متعددة الأيام',
      he: 'סיורים רב-יומיים',
      uk: 'Багатоденні тури'
    },
    cat_fixed: {
      ka: 'ფიქსირებული ტურები',
      en: 'Fixed Tours',
      ru: 'Фиксированные туры',
      tr: 'Sabit Turlar',
      ar: 'جولات ثابتة',
      he: 'סיורים קבועים',
      uk: 'Фіксовані тури'
    },
    cat_tours_generic: {
      ka: 'ტურები',
      en: 'tours',
      ru: 'туры',
      tr: 'turlar',
      ar: 'جولات',
      he: 'סיורים',
      uk: 'тури'
    },
    tour_count_one: {
      ka: '1 ტური მოიძებნა',
      en: '1 tour found',
      ru: 'Найден 1 тур',
      tr: '1 tur bulundu',
      ar: 'تم العثور على جولة واحدة',
      he: 'נמצא סיור אחד',
      uk: 'Знайдено 1 тур'
    },
    tour_count_many: {
      ka: '{n} ტური მოიძებნა',
      en: '{n} tours found',
      ru: 'Найдено туров: {n}',
      tr: '{n} tur bulundu',
      ar: 'تم العثور على {n} جولة',
      he: 'נמצאו {n} סיורים',
      uk: 'Знайдено турів: {n}'
    }
  };

  /* ---------- Raw phrase dictionary (source → translations) ----------
     Keys are the EXACT English text as it appears in the static HTML.
     The runtime translator (ui-translate.js) checks this table first
     and never asks the translation API for anything listed here.
  */
  const PHRASES = {
    /* --- Navbar --- */
    'Home': { ka: 'მთავარი', ru: 'Главная', tr: 'Ana Sayfa', ar: 'الرئيسية', he: 'דף הבית', uk: 'Головна' },
    'Tours': { ka: 'ტურები', ru: 'Туры', tr: 'Turlar', ar: 'الجولات', he: 'סיורים', uk: 'Тури' },
    'Tours ▼': { ka: 'ტურები ▼', ru: 'Туры ▼', tr: 'Turlar ▼', ar: 'الجولات ▼', he: 'סיורים ▼', uk: 'Тури ▼' },
    'Domestic Tours': { ka: 'შიდა ტურები', ru: 'Туры по Грузии', tr: 'Yurt İçi Turlar', ar: 'جولات داخلية', he: 'סיורים מקומיים', uk: 'Внутрішні тури' },
    'International Tours': { ka: 'საერთაშორისო ტურები', ru: 'Международные туры', tr: 'Uluslararası Turlar', ar: 'جولات دولية', he: 'סיורים בינלאומיים', uk: 'Міжнародні тури' },
    'Cars': { ka: 'მანქანები', ru: 'Автомобили', tr: 'Araçlar', ar: 'السيارات', he: 'רכבים', uk: 'Авто' },
    'Posts': { ka: 'სტატიები', ru: 'Статьи', tr: 'Yazılar', ar: 'المقالات', he: 'פוסטים', uk: 'Публікації' },
    'About': { ka: 'ჩვენ შესახებ', ru: 'О нас', tr: 'Hakkımızda', ar: 'من نحن', he: 'אודות', uk: 'Про нас' },
    'Contact': { ka: 'კონტაქტი', ru: 'Контакты', tr: 'İletişim', ar: 'اتصل بنا', he: 'צור קשר', uk: 'Контакти' },
    'Login': { ka: 'შესვლა', ru: 'Войти', tr: 'Giriş', ar: 'تسجيل الدخول', he: 'התחברות', uk: 'Увійти' },
    'Sign Up': { ka: 'რეგისტრაცია', ru: 'Регистрация', tr: 'Kayıt Ol', ar: 'إنشاء حساب', he: 'הרשמה', uk: 'Реєстрація' },
    'My Profile': { ka: 'ჩემი პროფილი', ru: 'Мой профиль', tr: 'Profilim', ar: 'ملفي الشخصي', he: 'הפרופיל שלי', uk: 'Мій профіль' },
    'Saved Tours': { ka: 'შენახული ტურები', ru: 'Сохранённые туры', tr: 'Kayıtlı Turlar', ar: 'الجولات المحفوظة', he: 'סיורים שמורים', uk: 'Збережені тури' },
    'Sign Out': { ka: 'გამოსვლა', ru: 'Выйти', tr: 'Çıkış', ar: 'تسجيل الخروج', he: 'התנתקות', uk: 'Вийти' },
    'Menu': { ka: 'მენიუ', ru: 'Меню', tr: 'Menü', ar: 'القائمة', he: 'תפריט', uk: 'Меню' },
    'Select language': { ka: 'აირჩიეთ ენა', ru: 'Выберите язык', tr: 'Dil seçin', ar: 'اختر اللغة', he: 'בחר שפה', uk: 'Обрати мову' },

    /* --- Hero / Index --- */
    'Discover the Caucasus': { ka: 'აღმოაჩინეთ კავკასია', ru: 'Откройте Кавказ', tr: 'Kafkasya\'yı Keşfedin', ar: 'اكتشف القوقاز', he: 'גלו את הקווקז', uk: 'Відкрийте Кавказ' },
    'Explore': { ka: 'აღმოაჩინეთ', ru: 'Исследуйте', tr: 'Keşfedin', ar: 'استكشف', he: 'גלו את', uk: 'Досліджуйте' },
    'Georgia': { ka: 'საქართველო', ru: 'Грузию', tr: 'Gürcistan\'ı', ar: 'جورجيا', he: 'גאורגיה', uk: 'Грузію' },
    'With Us': { ka: 'ჩვენთან ერთად', ru: 'Вместе с нами', tr: 'Bizimle', ar: 'معنا', he: 'איתנו', uk: 'Разом з нами' },
    'Ancient culture, breathtaking mountains, world-class wine and legendary hospitality — all in one extraordinary destination.': {
      ka: 'უძველესი კულტურა, თვალწარმტაცი მთები, მსოფლიო დონის ღვინო და ლეგენდარული სტუმართმოყვარეობა — ყველა ერთ განსაკუთრებულ მიმართულებაში.',
      ru: 'Древняя культура, захватывающие дух горы, вино мирового класса и легендарное гостеприимство — всё в одном исключительном направлении.',
      tr: 'Kadim kültür, nefes kesen dağlar, dünya standartlarında şarap ve efsanevi misafirperverlik — hepsi tek bir olağanüstü destinasyonda.',
      ar: 'ثقافة عريقة، جبال خلابة، نبيذ عالمي المستوى، وضيافة أسطورية — كل ذلك في وجهة استثنائية واحدة.',
      he: 'תרבות עתיקה, הרים עוצרי נשימה, יין ברמה עולמית וואהבה אגדית — הכול ביעד אחד יוצא דופן.',
      uk: 'Давня культура, захоплюючі гори, вино світового класу та легендарна гостинність — усе в одному неймовірному напрямку.'
    },
    '✦ Book Now': { ka: '✦ დაჯავშნე ახლა', ru: '✦ Забронировать', tr: '✦ Hemen Rezerve Et', ar: '✦ احجز الآن', he: '✦ הזמן עכשיו', uk: '✦ Забронювати' },
    'Book Now': { ka: 'დაჯავშნე ახლა', ru: 'Забронировать', tr: 'Hemen Rezerve Et', ar: 'احجز الآن', he: 'הזמן עכשיו', uk: 'Забронювати' },
    'Learn More →': { ka: 'გაიგე მეტი →', ru: 'Узнать больше →', tr: 'Daha Fazla →', ar: 'اعرف المزيد →', he: 'למידע נוסף →', uk: 'Докладніше →' },
    'Learn More': { ka: 'გაიგე მეტი', ru: 'Узнать больше', tr: 'Daha Fazla', ar: 'اعرف المزيد', he: 'למידע נוסף', uk: 'Докладніше' },
    'Scroll': { ka: 'დაათვალიერე', ru: 'Листать', tr: 'Kaydır', ar: 'مرر', he: 'גלילה', uk: 'Гортайте' },

    /* --- Section headers --- */
    'This Season\'s Best Deal': { ka: 'სეზონის საუკეთესო შეთავაზება', ru: 'Лучшее предложение сезона', tr: 'Sezonun En İyi Teklifi', ar: 'أفضل عرض لهذا الموسم', he: 'המבצע הטוב ביותר של העונה', uk: 'Найкраща пропозиція сезону' },
    'Local Adventures': { ka: 'ადგილობრივი თავგადასავლები', ru: 'Местные приключения', tr: 'Yerel Maceralar', ar: 'مغامرات محلية', he: 'הרפתקאות מקומיות', uk: 'Місцеві пригоди' },
    'International Adventures': { ka: 'საერთაშორისო თავგადასავლები', ru: 'Международные приключения', tr: 'Uluslararası Maceralar', ar: 'مغامرات دولية', he: 'הרפתקאות בינלאומיות', uk: 'Міжнародні пригоди' },
    'Transport': { ka: 'ტრანსპორტი', ru: 'Транспорт', tr: 'Ulaşım', ar: 'النقل', he: 'תחבורה', uk: 'Транспорт' },
    'Transport Services': { ka: 'ტრანსპორტი სერვისები', ru: 'Транспортные услуги', tr: 'Ulaşım Hizmetleri', ar: 'خدمات النقل', he: 'שירותי תחבורה', uk: 'Транспортні послуги' },
    'Blog': { ka: 'ბლოგი', ru: 'Блог', tr: 'Blog', ar: 'المدونة', he: 'בלוג', uk: 'Блог' },
    'Stories': { ka: 'ისტორიები', ru: 'Истории', tr: 'Hikâyeler', ar: 'قصص', he: 'סיפורים', uk: 'Історії' },
    'Testimonials': { ka: 'შეფასებები', ru: 'Отзывы', tr: 'Yorumlar', ar: 'آراء العملاء', he: 'המלצות', uk: 'Відгуки' },
    'Customer Stories': { ka: 'მომხმარებელთა ისტორიები', ru: 'Истории клиентов', tr: 'Müşteri Hikâyeleri', ar: 'قصص العملاء', he: 'סיפורי לקוחות', uk: 'Історії клієнтів' },
    'Our Destinations': { ka: 'ჩვენი მიმართულებები', ru: 'Наши направления', tr: 'Destinasyonlarımız', ar: 'وجهاتنا', he: 'היעדים שלנו', uk: 'Наші напрямки' },
    'Featured Destinations': { ka: 'სეზონის საუკეთესო მიმართულებები', en: 'Featured Destinations', ru: 'Рекомендуемые направления', tr: 'Öne Çıkan Destinasyonlar', ar: 'الوجهات المميزة', he: 'יעדים מומלצים', uk: 'Рекомендовані напрямки' },
    'Live': { ka: 'პირდაპირი', ru: 'Сейчас', tr: 'Canlı', ar: 'مباشر', he: 'שידור חי', uk: 'Наживо' },
    'Georgia Weather': { ka: 'ამინდი საქართველოში', ru: 'Погода в Грузии', tr: 'Gürcistan Havası', ar: 'طقس جورجيا', he: 'מזג האוויר בגאורגיה', uk: 'Погода в Грузії' },
    'Discover Georgia with us! We offer both private and group tours tailored to your interests and schedule. Whether it\'s a one-day escape or a multi-day adventure, our professional guides promise an unforgettable journey.': {
      ka: 'აღმოაჩინეთ საქართველო ჩვენთან ერთად! გთავაზობთ როგორც ინდივიდუალურ, ისე ჯგუფურ ტურებს, რომლებიც მორგებულია თქვენს ინტერესებსა და დროზე. იქნება ეს ერთდღიანი გასვლა თუ მრავალდღიანი თავგადასავალი, ჩვენი პროფესიონალი გიდები დაუვიწყარ მოგზაურობას გპირდებიან.',
      ru: 'Откройте Грузию вместе с нами! Мы предлагаем как индивидуальные, так и групповые туры, адаптированные под ваши интересы и расписание. Будь то однодневная поездка или многодневное приключение — наши профессиональные гиды обещают незабываемое путешествие.',
      tr: 'Gürcistan\'ı bizimle keşfedin! İlgi alanlarınıza ve programınıza göre özel ve grup turları sunuyoruz. İster bir günlük bir kaçamak ister çok günlü bir macera olsun, profesyonel rehberlerimiz unutulmaz bir yolculuk vaat ediyor.',
      ar: 'اكتشف جورجيا معنا! نقدم جولات خاصة وجماعية مصممة حسب اهتماماتك وجدولك. سواء كانت رحلة ليوم واحد أو مغامرة لعدة أيام، يعدك مرشدونا المحترفون برحلة لا تُنسى.',
      he: 'גלו את גאורגיה איתנו! אנו מציעים סיורים פרטיים וקבוצתיים המותאמים לתחומי העניין ולזמן שלכם. בין אם מדובר בטיול של יום אחד או בהרפתקה של כמה ימים, המדריכים המקצועיים שלנו מבטיחים חוויה בלתי נשכחת.',
      uk: 'Відкрийте Грузію з нами! Ми пропонуємо індивідуальні та групові тури, адаптовані під ваші інтереси й розклад. Будь то одноденна прогулянка чи багатоденна пригода — наші професійні гіди обіцяють незабутню подорож.'
    },
    'Discover new countries, taste different cuisines, and explore incredible places around the world. This program is perfect for those who love long adventures and want every day to be filled with something new.': {
      ka: 'აღმოაჩინე ახალი ქვეყნები, გასინჯე განსხვავებული კერძები და ნახე საოცარი ადგილები მთელ მსოფლიოში. ეს პროგრამა იდეალურია მათთვის, ვისაც უყვარს ხანგრძლივი თავგადასავლები და სურს, რომ ყოველი დღე სიახლით იყოს სავსე.',
      ru: 'Откройте новые страны, попробуйте разные кухни и исследуйте невероятные места по всему миру. Эта программа идеальна для тех, кто любит долгие приключения и хочет, чтобы каждый день был наполнен чем-то новым.',
      tr: 'Yeni ülkeleri keşfedin, farklı mutfakları tadın ve dünyanın inanılmaz yerlerini gezin. Bu program, uzun maceraları sevenler ve her gününü yeniliklerle dolu geçirmek isteyenler için idealdir.',
      ar: 'اكتشف دولاً جديدة، وتذوّق مطابخ مختلفة، واستكشف أماكن مذهلة حول العالم. هذا البرنامج مثالي لمن يحب المغامرات الطويلة ويريد أن يكون كل يوم مفعمًا بالجديد.',
      he: 'גלו ארצות חדשות, טעמו מטבחים שונים וחקרו מקומות מדהימים ברחבי העולם. התוכנית הזו מושלמת עבור אלו שאוהבים הרפתקאות ארוכות ורוצים שכל יום יהיה מלא בחוויות חדשות.',
      uk: 'Відкривайте нові країни, куштуйте різноманітні страви та досліджуйте неймовірні місця по всьому світу. Ця програма ідеальна для тих, хто любить довгі пригоди і хоче, щоб кожен день був наповнений новим.'
    },
    'We offer comfortable vehicles for every need — whether it\'s getting around the city or a long journey into the mountains. Travel calmly and safely.': {
      ka: 'ჩვენთან დაგხვდებათ კომფორტული ავტომობილები ნებისმიერი საჭიროებისთვის — იქნება ეს ქალაქში გადაადგილება თუ გრძელი გზა მთაში. იმოგზაურეთ მშვიდად და უსაფრთხოდ.',
      ru: 'Мы предлагаем комфортные автомобили под любые задачи — будь то поездка по городу или долгий путь в горы. Путешествуйте спокойно и безопасно.',
      tr: 'Her ihtiyaç için konforlu araçlar sunuyoruz — ister şehir içi ulaşım ister dağlara uzun bir yolculuk olsun. Huzur ve güvenlik içinde seyahat edin.',
      ar: 'نوفر لك مركبات مريحة لكل احتياج — سواء كان تنقلاً داخل المدينة أو رحلة طويلة إلى الجبال. سافر بهدوء وأمان.',
      he: 'אנו מציעים רכבים נוחים לכל צורך — בין אם זו נסיעה בעיר או מסע ארוך להרים. סעו בשלווה ובבטחה.',
      uk: 'Ми пропонуємо комфортні автомобілі під будь-яку потребу — чи то пересування містом, чи довга дорога в гори. Подорожуйте спокійно та безпечно.'
    },
    'Travel guides, local tips and authentic stories.': {
      ka: 'სამოგზაურო გზამკვლევები, ადგილობრივი რჩევები და ნამდვილი ისტორიები.',
      ru: 'Путеводители, местные советы и подлинные истории.',
      tr: 'Seyahat rehberleri, yerel ipuçları ve otantik hikâyeler.',
      ar: 'أدلة سفر، نصائح محلية وقصص أصيلة.',
      he: 'מדריכי טיולים, טיפים מקומיים וסיפורים אותנטיים.',
      uk: 'Путівники, місцеві поради та справжні історії.'
    },
    'Real feedback from travelers who explored Georgia with us.': {
      ka: 'ნამდვილი გამოხმაურება მოგზაურებისგან, რომლებმაც ჩვენთან ერთად აღმოაჩინეს საქართველო.',
      ru: 'Настоящие отзывы путешественников, которые открыли Грузию вместе с нами.',
      tr: 'Bizimle Gürcistan\'ı keşfeden gezginlerden gerçek geri bildirimler.',
      ar: 'تعليقات حقيقية من المسافرين الذين اكتشفوا جورجيا معنا.',
      he: 'משוב אמיתי ממטיילים שחקרו את גאורגיה איתנו.',
      uk: 'Справжні відгуки мандрівників, які відкрили Грузію разом з нами.'
    },

    /* --- Buttons / CTA --- */
    'View All Domestic Tours': { ka: 'ყველა შიდა ტურის ნახვა', ru: 'Все туры по Грузии', tr: 'Tüm Yurt İçi Turlar', ar: 'عرض جميع الجولات الداخلية', he: 'צפה בכל הסיורים המקומיים', uk: 'Усі внутрішні тури' },
    'View All International Tours': { ka: 'ყველა საერთაშორისო ტურის ნახვა', ru: 'Все международные туры', tr: 'Tüm Uluslararası Turlar', ar: 'عرض جميع الجولات الدولية', he: 'צפה בכל הסיורים הבינלאומיים', uk: 'Усі міжнародні тури' },
    'View All Stories →': { ka: 'ყველა ისტორიის ნახვა →', ru: 'Все истории →', tr: 'Tüm Hikâyeler →', ar: 'عرض جميع القصص →', he: 'צפה בכל הסיפורים →', uk: 'Усі історії →' },
    'Leave a Review on Google Maps': { ka: 'დატოვე შეფასება Google Maps-ზე', ru: 'Оставить отзыв в Google Maps', tr: 'Google Haritalar\'da Yorum Bırak', ar: 'اترك تقييماً على خرائط جوجل', he: 'השאירו ביקורת ב-Google Maps', uk: 'Залишити відгук у Google Maps' },
    'Loading featured offers...': { ka: 'იტვირთება რჩეული შეთავაზებები...', ru: 'Загружаются рекомендуемые предложения...', tr: 'Öne çıkan teklifler yükleniyor...', ar: 'جاري تحميل العروض المميزة...', he: 'טוען מבצעים מובילים...', uk: 'Завантаження рекомендацій...' },
    '⏳ Fetching live weather…': { ka: '⏳ ამინდის მონაცემების ჩატვირთვა…', ru: '⏳ Загрузка погоды в реальном времени…', tr: '⏳ Canlı hava durumu alınıyor…', ar: '⏳ جاري جلب الطقس المباشر…', he: '⏳ טוען מזג אוויר בזמן אמת…', uk: '⏳ Завантаження поточної погоди…' },
    'Previous': { ka: 'წინა', ru: 'Назад', tr: 'Önceki', ar: 'السابق', he: 'הקודם', uk: 'Попередній' },
    'Next': { ka: 'შემდეგი', ru: 'Далее', tr: 'Sonraki', ar: 'التالي', he: 'הבא', uk: 'Наступний' },
    'Close': { ka: 'დახურვა', ru: 'Закрыть', tr: 'Kapat', ar: 'إغلاق', he: 'סגור', uk: 'Закрити' },

    /* --- Map locations (structured as name – description) --- */
    'Tbilisi – Capital City': { ka: 'თბილისი – დედა��ალაქი', ru: 'Тбилиси – Столица', tr: 'Tiflis – Başkent', ar: 'تبليسي – العاصمة', he: 'טביליסי – עיר הבירה', uk: 'Тбілісі – столиця' },
    'Kazbegi – Caucasus Mountains': { ka: 'ყაზბეგი – კავკასიონის მთები', ru: 'Казбеги – Кавказские горы', tr: 'Kazbegi – Kafkas Dağları', ar: 'كازبيغي – جبال القوقاز', he: 'קזבגי – הרי הקווקז', uk: 'Казбегі – Кавказькі гори' },
    'Kakheti – Wine Region': { ka: 'კახეთი – ღვინის რეგიონი', ru: 'Кахетия – Винный регион', tr: 'Kaheti – Şarap Bölgesi', ar: 'كاخيتي – منطقة النبيذ', he: 'קחתי – אזור היין', uk: 'Кахетія – винний регіон' },
    'Batumi – Black Sea Coast': { ka: 'ბათუმი – შავი ზღვის სანაპირო', ru: 'Батуми – Побережье Чёрного моря', tr: 'Batum – Karadeniz Kıyısı', ar: 'باتومي – ساحل البحر الأسود', he: 'בטומי – חוף הים השחור', uk: 'Батумі – узбережжя Чорного моря' },
    'Svaneti – Ancient Highlands': { ka: 'სვანეთი – უძველესი მთიანეთი', ru: 'Сванетия – Древнее высокогорье', tr: 'Svaneti – Kadim Dağlık Bölge', ar: 'سفانيتي – المرتفعات القديمة', he: 'סוואנטי – רמות עתיקות', uk: 'Сванетія – давні високогір\'я' },

    /* --- Footer --- */
    'Your trusted travel partner in Georgia. Crafting genuine experiences since 2017.': {
      ka: 'თქვენი სანდო სამოგზაურო პარტნიორი საქართველოში. ვქმნით ნამდვილ გამოცდილებებს 2017 წლიდან.',
      ru: 'Ваш надёжный туристический партнёр в Грузии. Создаём настоящие впечатления с 2017 года.',
      tr: 'Gürcistan\'da güvendiğiniz seyahat ortağınız. 2017\'den beri gerçek deneyimler üretiyoruz.',
      ar: 'شريك سفرك الموثوق في جورجيا. نصنع تجارب أصيلة منذ 2017.',
      he: 'שותפכם המהימן לטיולים בגאורגיה. יוצרים חוויות אותנטיות מאז 2017.',
      uk: 'Ваш надійний туристичний партнер у Грузії. Створюємо справжні враження з 2017 року.'
    },
    'Quick Links': { ka: 'სწრაფი ბმულები', ru: 'Быстрые ссылки', tr: 'Hızlı Bağlantılar', ar: 'روابط سريعة', he: 'קישורים מהירים', uk: 'Швидкі посилання' },
    'Tour Types': { ka: 'ტურების ტიპები', ru: 'Типы туров', tr: 'Tur Türleri', ar: 'أنواع الجولات', he: 'סוגי סיורים', uk: 'Типи турів' },
    'One-Day Tours': { ka: 'ერთდღიანი ტურები', ru: 'Однодневные туры', tr: 'Günlük Turlar', ar: 'جولات يوم واحد', he: 'סיורים ליום אחד', uk: 'Одноденні тури' },
    'Multi-Day Tours': { ka: 'მრავალდღიანი ტურები', ru: 'Многодневные туры', tr: 'Çok Günlü Turlar', ar: 'جولات متعددة الأيام', he: 'סיורים ליותר מיום', uk: 'Багатоденні тури' },
    'Fixed Tours': { ka: 'ფიქსირებული ტურები', ru: 'Фиксированные туры', tr: 'Sabit Turlar', ar: 'جولات ثابتة', he: 'סיורים קבועים', uk: 'Фіксовані тури' },
    'Mon – Sun: 10:00 – 19:00': { ka: 'ორშ – კვ: 10:00 – 19:00', ru: 'Пн – Вс: 10:00 – 19:00', tr: 'Pzt – Paz: 10:00 – 19:00', ar: 'الاثنين – الأحد: 10:00 – 19:00', he: 'שני – ראשון: 10:00 – 19:00', uk: 'Пн – Нд: 10:00 – 19:00' },
    '© 2026 Georgia Trips. All rights reserved.': { ka: '© 2026 Georgia Trips. ყველა უფლება დაცულია.', ru: '© 2026 Georgia Trips. Все права защищены.', tr: '© 2026 Georgia Trips. Tüm hakları saklıdır.', ar: '© 2026 Georgia Trips. جميع الحقوق محفوظة.', he: '© 2026 Georgia Trips. כל הזכויות שמורות.', uk: '© 2026 Georgia Trips. Усі права захищені.' },
    'Privacy Policy': { ka: 'კონფიდენციალურობის პოლიტიკა', ru: 'Политика конфиденциальности', tr: 'Gizlilik Politikası', ar: 'سياسة الخصوصية', he: 'מדיניות פרטיות', uk: 'Політика конфіденційності' },
    'Terms': { ka: 'პირობები', ru: 'Условия', tr: 'Koşullar', ar: 'الشروط', he: 'תנאים', uk: 'Умови' },
    'developed by': { ka: 'შემქმნელი —', ru: 'разработано —', tr: 'geliştiren —', ar: 'طوّر بواسطة', he: 'פותח על ידי', uk: 'розроблено —' },

    /* --- Booking modal --- */
    'Tour Name': { ka: 'ტურის დასახელება', ru: 'Название тура', tr: 'Tur Adı', ar: 'اسم الجولة', he: 'שם הסיור', uk: 'Назва туру' },
    'Ready to book this tour? Fill out your details and our team will confirm your reservation within 24 hours.': {
      ka: 'მზად ხართ ტურის დასაჯავშნად? შეავსეთ დეტალები და ჩვენი გუნდი დაადასტურებს ჯავშანს 24 საათში.',
      ru: 'Готовы забронировать тур? Заполните данные — наша команда подтвердит бронь в течение 24 часов.',
      tr: 'Bu turu rezerve etmeye hazır mısınız? Bilgilerinizi doldurun, ekibimiz 24 saat içinde onaylayacaktır.',
      ar: 'هل أنت مستعد لحجز هذه الجولة؟ املأ بياناتك وسيؤكد فريقنا الحجز خلال 24 ساعة.',
      he: 'מוכנים להזמין את הסיור? מלאו פרטים והצוות שלנו יאשר את ההזמנה תוך 24 שעות.',
      uk: 'Готові забронювати цей тур? Заповніть дані, і наша команда підтвердить бронювання протягом 24 годин.'
    },
    'Full Name': { ka: 'სახელი და გვარი', ru: 'Полное имя', tr: 'Ad Soyad', ar: 'الاسم الكامل', he: 'שם מלא', uk: 'Повне ім\'я' },
    'Your full name': { ka: 'თქვენი სახელი და გვარი', ru: 'Ваше полное имя', tr: 'Adınız ve soyadınız', ar: 'اسمك الكامل', he: 'השם המלא שלך', uk: 'Ваше повне ім\'я' },
    'Email': { ka: 'იმეილი', ru: 'Эл. почта', tr: 'E-posta', ar: 'البريد الإلكتروني', he: 'אימייל', uk: 'Електронна пошта' },
    'Email Address': { ka: 'იმეილის მისამართი', ru: 'Адрес эл. почты', tr: 'E-posta Adresi', ar: 'عنوان البريد الإلكتروني', he: 'כתובת אימייל', uk: 'Адреса e-mail' },
    'Number of People': { ka: 'ადამიანების რაოდენობა', ru: 'Количество человек', tr: 'Kişi Sayısı', ar: 'عدد الأشخاص', he: 'מספר אנשים', uk: 'Кількість осіб' },
    'Preferred Date': { ka: 'სასურველი თარიღი', ru: 'Желаемая дата', tr: 'Tercih Edilen Tarih', ar: 'التاريخ المفضل', he: 'תאריך מועדף', uk: 'Бажана дата' },
    'Send Booking Request ✦': { ka: 'გაგზავნე ჯავშნის მოთხოვნა ✦', ru: 'Отправить запрос ✦', tr: 'Rezervasyon İsteği Gönder ✦', ar: 'إرسال طلب الحجز ✦', he: 'שלחו בקשת הזמנה ✦', uk: 'Надіслати запит ✦' },
    'Send Booking Request': { ka: 'გაგზავნე ჯავშნის მოთხოვნა', ru: 'Отправить запрос на бронирование', tr: 'Rezervasyon İsteği Gönder', ar: 'إرسال طلب الحجز', he: 'שלחו בקשת הזמנה', uk: 'Надіслати запит на бронювання' },

    /* --- Common tour labels (static HTML) --- */
    'Tour Highlights': { ka: 'ტურის მთავარი მომენტები', ru: 'Основные моменты тура', tr: 'Tur Öne Çıkanları', ar: 'أبرز ما في الجولة', he: 'עיקרי הסיור', uk: 'Основні моменти туру' },
    'What\'s Included': { ka: 'რა შედის', ru: 'Что включено', tr: 'Dahil Olanlar', ar: 'ما هو متضمن', he: 'מה כלול', uk: 'Що входить' },
    'Detailed Itinerary': { ka: 'დეტალური გეგმა', ru: 'Подробный маршрут', tr: 'Ayrıntılı Program', ar: 'جدول الرحلة المفصل', he: 'מסלול מפורט', uk: 'Детальний маршрут' },
    'Best Season': { ka: 'საუკეთესო სეზონი', ru: 'Лучший сезон', tr: 'En İyi Sezon', ar: 'أفضل موسم', he: 'עונה מומלצת', uk: 'Найкращий сезон' },
    'Category': { ka: 'კატეგორია', ru: 'Категория', tr: 'Kategori', ar: 'الفئة', he: 'קטגוריה', uk: 'Категорія' },
    'Duration': { ka: 'ხანგრძლივობა', ru: 'Длительность', tr: 'Süre', ar: 'المدة', he: 'משך', uk: 'Тривалість' },
    '← Back to Tours': { ka: '← უკან ტურებზე', ru: '← Назад к турам', tr: '← Turlara Dön', ar: '← العودة إلى الجولات', he: '← חזרה לסיורים', uk: '← Назад до турів' },

    /* --- Tours filter page --- */
    'All': { ka: 'ყველა', ru: 'Все', tr: 'Tümü', ar: 'الكل', he: 'הכול', uk: 'Усі' },
    'Filter by Category': { ka: 'გაფილტრე კატეგორიით', ru: 'Фильтровать по категории', tr: 'Kategoriye Göre Filtrele', ar: 'تصفية حسب الفئة', he: 'סינון לפי קטגוריה', uk: 'Фільтр за категорією' },
    'Find Your Perfect Tour': { ka: 'იპოვე შენთვის იდეალური ტური', ru: 'Найдите свой идеальный тур', tr: 'Size Uygun Turu Bulun', ar: 'ابحث عن جولتك المثالية', he: 'מצאו את הסיור המושלם עבורכם', uk: 'Знайдіть ідеальний тур для себе' },
    'Find Your Perfect Adventure': { ka: 'იპოვე შენთვის იდეალური თავგადასავალი', ru: 'Найдите своё идеальное приключение', tr: 'Size Uygun Macerayı Bulun', ar: 'ابحث عن مغامرتك المثالية', he: 'מצאו את ההרפתקה המושלמת עבורכם', uk: 'Знайдіть ідеальну пригоду для себе' },
    'Browse': { ka: 'დაათვალიერე', ru: 'Обзор', tr: 'Göz At', ar: 'تصفح', he: 'עיון', uk: 'Перегляд' },
    'Choose your preferred category and discover an experience that fits your time and interests.': {
      ka: 'შეარჩიეთ თქვენთვის სასურველი კატეგორია და აღმოაჩინეთ გამოცდილება, რომელიც თქვენს დროსა და ინტერესებს შეესაბამება.',
      ru: 'Выберите удобную категорию и откройте для себя впечатление, которое подходит вашему времени и интересам.',
      tr: 'Tercih ettiğiniz kategoriyi seçin ve zamanınıza ve ilgi alanlarınıza uygun bir deneyim keşfedin.',
      ar: 'اختر الفئة التي تفضلها واكتشف تجربة تناسب وقتك واهتماماتك.',
      he: 'בחרו את הקטגוריה המועדפת עליכם וגלו חוויה שמתאימה לזמן ולתחומי העניין שלכם.',
      uk: 'Оберіть зручну категорію та відкрийте для себе враження, яке відповідає вашому часу та інтересам.'
    },
    'Select a category below to explore the right experience for your schedule and adventure level.': {
      ka: 'შეარჩიეთ თქვენთვის სასურველი კატეგორია და აღმოაჩინეთ გამოცდილება, რომელიც თქვენს დროსა და ინტერესებს შეესაბამება.',
      ru: 'Выберите удобную категорию и откройте для себя впечатление, которое подходит вашему времени и интересам.',
      tr: 'Tercih ettiğiniz kategoriyi seçin ve zamanınıza ve ilgi alanlarınıza uygun bir deneyim keşfedin.',
      ar: 'اختر الفئة التي تفضلها واكتشف تجربة تناسب وقتك واهتماماتك.',
      he: 'בחרו את הקטגוריה המועדפת עליכם וגלו חוויה שמתאימה לזמן ולתחומי העניין שלכם.',
      uk: 'Оберіть зручну категорію та відкрийте для себе враження, яке відповідає вашому часу та інтересам.'
    },
    'Select a category below to explore international travel experiences.': {
      ka: 'შეარჩიეთ კატეგორია და აღმოაჩინეთ საერთაშორისო სამოგზაურო გამოცდილებები.',
      ru: 'Выберите категорию и откройте для себя международные путешествия.',
      tr: 'Bir kategori seçin ve uluslararası seyahat deneyimlerini keşfedin.',
      ar: 'اختر فئة واستكشف تجارب السفر الدولية.',
      he: 'בחרו קטגוריה וגלו חוויות נסיעה בינלאומיות.',
      uk: 'Оберіть категорію та відкрийте для себе міжнародні подорожі.'
    },

    /* --- Why Book With Us (all tour pages) --- */
    'Why Us': { ka: 'რატომ ჩვენ', ru: 'Почему мы', tr: 'Neden Biz', ar: 'لماذا نحن', he: 'למה אנחנו', uk: 'Чому ми' },
    'Why Book With Us': { ka: 'რატომ უნდა დაჯავშნოთ ჩვენთან', ru: 'Почему стоит бронировать у нас', tr: 'Neden Bizden Rezervasyon Yapmalısınız', ar: 'لماذا تحجز معنا', he: 'למה להזמין איתנו', uk: 'Чому варто бронювати у нас' },
    'Why Book With Georgia Trips': { ka: 'რატომ უნდა დაჯავშნოთ Georgia Trips-თან', ru: 'Почему стоит бронировать с Georgia Trips', tr: 'Neden Georgia Trips ile Rezervasyon Yapmalısınız', ar: 'لماذا تحجز مع Georgia Trips', he: 'למה להזמין עם Georgia Trips', uk: 'Чому варто бронювати з Georgia Trips' },

    'Local Expert Guides': { ka: 'ადგილობრივი გამოცდილი გიდები', ru: 'Местные опытные гиды', tr: 'Yerel Uzman Rehberler', ar: 'مرشدون محليون خبراء', he: 'מדריכים מקומיים מנוסים', uk: 'Місцеві досвідчені гіди' },
    'Expert Local Guides': { ka: 'ადგილობრივი გამოცდილი გიდები', ru: 'Местные опытные гиды', tr: 'Yerel Uzman Rehberler', ar: 'مرشدون محليون خبراء', he: 'מדריכים מקומיים מנוסים', uk: 'Місцеві досвідчені гіди' },
    'Professional guides who speak your language clearly and know Georgian history, culture and nature inside out.': {
      ka: 'პროფესიონალი გიდები, რომლებიც თქვენს ენაზე მარტივად და გასაგებად გაგიწევენ მეგზურობას და კარგად იცნობენ საქართველოს ისტორიას, კულტურასა და ბუნებას.',
      ru: 'Профессиональные гиды, которые говорят на вашем языке понятно и хорошо знают историю, культуру и природу Грузии.',
      tr: 'Dilinizi açık ve anlaşılır şekilde konuşan, Gürcistan tarihini, kültürünü ve doğasını çok iyi bilen profesyonel rehberler.',
      ar: 'مرشدون محترفون يتحدثون لغتك بوضوح ويعرفون تاريخ جورجيا وثقافتها وطبيعتها جيداً.',
      he: 'מדריכים מקצועיים שדוברים את השפה שלכם בבהירות ומכירים היטב את ההיסטוריה, התרבות והטבע של גאורגיה.',
      uk: 'Професійні гіди, які говорять вашою мовою зрозуміло та добре знають історію, культуру й природу Грузії.'
    },

    'Comfortable Transport': { ka: 'კომფორტული ტრანსპორტი', ru: 'Комфортный транспорт', tr: 'Konforlu Ulaşım', ar: 'نقل مريح', he: 'תחבורה נוחה', uk: 'Комфортний транспорт' },
    'Modern, air-conditioned vehicles maintained to the highest safety standards for every route.': {
      ka: 'თანამედროვე, კონდიცირებული სატრანსპორტო საშუალებები დაცულია უსაფრთხოების უმაღლეს სტანდარტებთან თითოეული მარშრუტისთვის.',
      ru: 'Современные автомобили с кондиционером, обслуживаемые по высшим стандартам безопасности на каждом маршруте.',
      tr: 'Her güzergâh için en yüksek güvenlik standartlarında bakımı yapılan modern, klimalı araçlar.',
      ar: 'مركبات حديثة مكيفة يتم صيانتها وفق أعلى معايير السلامة في كل مسار.',
      he: 'רכבים מודרניים וממוזגים המתוחזקים ברמות הבטיחות הגבוהות ביותר בכל מסלול.',
      uk: 'Сучасні автомобілі з кондиціонером, обслуговувані за найвищими стандартами безпеки на кожному маршруті.'
    },

    'Best Prices': { ka: 'საუკეთესო ფასები', ru: 'Лучшие цены', tr: 'En İyi Fiyatlar', ar: 'أفضل الأسعار', he: 'המחירים הטובים ביותר', uk: 'Найкращі ціни' },
    'Best Price Guarantee': { ka: 'საუკეთესო ფასების გარანტია', ru: 'Гарантия лучшей цены', tr: 'En İyi Fiyat Garantisi', ar: 'ضمان أفضل سعر', he: 'הבטחת המחיר הטוב ביותר', uk: 'Гарантія найкращої ціни' },
    'Transparent prices with no hidden fees and great deals on every tour.': {
      ka: 'გამჭვირვალე ფასები დამატებითი ხარჯების გარეშე და კარგი შეთავაზებები ყველა ტურზე.',
      ru: 'Прозрачные цены без скрытых комиссий и выгодные предложения на каждом туре.',
      tr: 'Gizli ücret olmadan şeffaf fiyatlar ve her turda harika fırsatlar.',
      ar: 'أسعار شفافة بدون رسوم خفية وعروض رائعة في كل جولة.',
      he: 'מחירים שקופים ללא עלויות נסתרות והצעות מעולות בכל סיור.',
      uk: 'Прозорі ціни без прихованих платежів і чудові пропозиції на кожному турі.'
    },

    'Safe Travel': { ka: 'უსაფრთხო მოგზაურობა', ru: 'Безопасное путешествие', tr: 'Güvenli Seyahat', ar: 'سفر آمن', he: 'נסיעה בטוחה', uk: 'Безпечна подорож' },
    'Safe & Insured': { ka: 'უსაფრთხო და დაზღვეული', ru: 'Безопасно и застраховано', tr: 'Güvenli ve Sigortalı', ar: 'آمن ومؤمَّن', he: 'בטוח ומבוטח', uk: 'Безпечно та застраховано' },
    'Every tour includes insurance and fast assistance when needed.': {
      ka: 'ყველა ტურში გათვალისწინებულია დაზღვევა და საჭიროების შემთხვევაში სწრაფი დახმარება.',
      ru: 'Каждый тур включает страховку и быструю помощь при необходимости.',
      tr: 'Her tur, sigorta ve gerektiğinde hızlı yardım içerir.',
      ar: 'كل جولة تشمل التأمين والمساعدة السريعة عند الحاجة.',
      he: 'בכל סיור כלולים ביטוח וסיוע מהיר בעת הצורך.',
      uk: 'Кожен тур включає страхування та швидку допомогу за потреби.'
    },

    /* --- International Tours hero intro --- */
    'Travel beyond Georgia and discover exciting places with our international tours.': {
      ka: 'იმოგზაურეთ საქართველოს გარეთ და აღმოაჩინეთ საინტერესო ადგილები ჩვენი საერთაშორისო ტურებით.',
      ru: 'Путешествуйте за пределы Грузии и открывайте интересные места с нашими международными турами.',
      tr: 'Gürcistan\'ın ötesine seyahat edin ve uluslararası turlarımızla heyecan verici yerleri keşfedin.',
      ar: 'سافر خارج جورجيا واكتشف أماكن مثيرة مع جولاتنا الدولية.',
      he: 'צאו לטייל מחוץ לגאורגיה וגלו מקומות מרגשים עם הסיורים הבינלאומיים שלנו.',
      uk: 'Подорожуйте за межі Грузії та відкривайте цікаві місця з нашими міжнародними турами.'
    },
    'Discover amazing destinations beyond Georgia with our international tour packages - from neighboring countries to worldwide adventures.': {
      ka: 'იმოგზაურეთ საქართველოს გარეთ და აღმოაჩინეთ საინტერესო ადგილები ჩვენი საერთაშორისო ტურებით.',
      ru: 'Путешествуйте за пределы Грузии и открывайте интересные места с нашими международными турами.',
      tr: 'Gürcistan\'ın ötesine seyahat edin ve uluslararası turlarımızla heyecan verici yerleri keşfedin.',
      ar: 'سافر خارج جورجيا واكتشف أماكن مثيرة مع جولاتنا الدولية.',
      he: 'צאו לטייל מחוץ לגאורגיה וגלו מקומות מרגשים עם הסיורים הבינלאומיים שלנו.',
      uk: 'Подорожуйте за межі Грузії та відкривайте цікаві місця з нашими міжнародними турами.'
    },

    /* --- Login --- */
    'Welcome Back': { ka: 'მოგესალმებით', ru: 'С возвращением', tr: 'Tekrar Hoş Geldiniz', ar: 'أهلاً بعودتك', he: 'ברוכים השבים', uk: 'Вітаємо знову' },
    'Create Account': { ka: 'ანგარიშის შექმნა', ru: 'Создать аккаунт', tr: 'Hesap Oluştur', ar: 'إنشاء حساب', he: 'יצירת חשבון', uk: 'Створити акаунт' },
    'Password': { ka: 'პაროლი', ru: 'Пароль', tr: 'Şifre', ar: 'كلمة المرور', he: 'סיסמה', uk: 'Пароль' },
    'Forgot Password?': { ka: 'დაგავიწყდა პაროლი?', ru: 'Забыли пароль?', tr: 'Şifremi Unuttum?', ar: 'نسيت كلمة المرور؟', he: 'שכחת סיסמה?', uk: 'Забули пароль?' },
    'Continue with Google': { ka: 'გააგრძელე Google-ით', ru: 'Продолжить с Google', tr: 'Google ile devam et', ar: 'المتابعة باستخدام Google', he: 'המשך עם Google', uk: 'Продовжити через Google' },

    /* --- Profile --- */
    'Verified Member': { ka: 'დადასტურებული მომხმარებელი', ru: 'Подтверждённый участник', tr: 'Doğrulanmış Üye', ar: 'عضو موثق', he: 'חבר מאומת', uk: 'Верифікований учасник' },
    'Member Since': { ka: 'წევრია', ru: 'Участник с', tr: 'Üyelik Tarihi', ar: 'عضو منذ', he: 'חבר מאז', uk: 'Учасник з' },
    'Sign-in Method': { ka: 'შესვლის მეთოდი', ru: 'Способ входа', tr: 'Giriş Yöntemi', ar: 'طريقة الدخول', he: 'שיטת התחברות', uk: 'Спосіб входу' },
    'Account Information': { ka: 'ანგარიშის ინფორმაცია', ru: 'Информация об аккаунте', tr: 'Hesap Bilgileri', ar: 'معلومات الحساب', he: 'פרטי חשבון', uk: 'Інформація про акаунт' },
    'Log Out': { ka: 'გასვლა', ru: 'Выйти', tr: 'Çıkış yap', ar: 'تسجيل الخروج', he: 'התנתק', uk: 'Вийти' }
  };

  /* ---------- Helpers ---------- */
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

  /**
   * Instant lookup for a raw English phrase. Called by ui-translate.js
   * before it considers hitting the MyMemory API.
   *
   * @param {string} src  – English source text (should be pre-trimmed)
   * @param {string} lang – target language code
   * @returns {string|null} translated phrase, or null if not in dictionary
   */
  function lookupPhrase(src, lang) {
    if (!src) return null;
    const entry = PHRASES[src];
    if (!entry) return null;
    return entry[lang] || null;
  }

  window.t = t;
  window.GTUIStrings = { t, lookupPhrase, STRINGS, PHRASES };
})();
