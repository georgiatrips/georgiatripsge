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
  const FALLBACK_ORDER = ['ka', 'en', 'ru', 'tr', 'uk', 'ar', 'he', 'fa'];

  /* ---------- JS-facing keyed strings ---------- */
  const STRINGS = {
    book_this_tour: {
      ka: 'დაჯავშნე ეს ტური', en: 'Book This Tour', ru: 'Забронировать тур',
      tr: 'Bu Turu Rezerve Et', ar: 'احجز هذه الجولة', he: 'הזמן סיור זה',
      fa: 'رزرو این تور', uk: 'Забронювати тур'
    },
    min_people: {
      ka: 'მინ. ადამიანი', en: 'Min People', ru: 'Мин. человек', tr: 'Min. Kişi',
      ar: 'الحد الأدنى', he: 'מינ׳ אנשים', fa: 'حداقل افراد', uk: 'Мін. осіб'
    },
    max_people: {
      ka: 'მაქს. ადამიანი', en: 'Max People', ru: 'Макс. человек', tr: 'Maks. Kişi',
      ar: 'الحد الأقصى', he: 'מקס׳ אנשים', fa: 'حداکثر افراد', uk: 'Макс. осіб'
    },
    per_person: {
      ka: 'ერთ ადამიანზე', en: 'per person', ru: 'за человека', tr: 'kişi başı',
      ar: 'للشخص', he: 'לאדם', fa: 'به ازای هر نفر', uk: 'з людини'
    },
    for_n_people: {
      ka: '{n} ადამიანზე', en: 'for {n} people', ru: 'за {n} человек',
      tr: '{n} kişi için', ar: 'لـ {n} أشخاص', he: 'עבור {n} אנשים',
      fa: 'برای {n} نفر', uk: 'за {n} осіб'
    },
    total: {
      ka: 'სულ', en: 'total', ru: 'всего', tr: 'toplam',
      ar: 'إجمالي', he: 'סה״כ', fa: 'مجموع', uk: 'всього'
    },
    on_request: {
      ka: 'შეკითხვით', en: 'On Request', ru: 'По запросу', tr: 'İstek Üzerine',
      ar: 'عند الطلب', he: 'לפי בקשה', fa: 'با درخواست', uk: 'На запит'
    },
    price_on_request: {
      ka: 'ფასი შეკითხვით', en: 'Price On Request', ru: 'Цена по запросу',
      tr: 'Fiyat İstek Üzerine', ar: 'السعر عند الطلب', he: 'מחיר לפי בקשה',
      fa: 'قیمت با درخواست', uk: 'Ціна на запит'
    },
    from_price: {
      ka: 'დან', en: 'From', ru: 'От', tr: 'Başlangıç',
      ar: 'من', he: 'החל מ־', fa: 'از', uk: 'Від'
    },
    one_day: {
      ka: '1 დღე', en: '1 Day', ru: '1 день', tr: '1 Gün',
      ar: 'يوم واحد', he: 'יום אחד', fa: '۱ روز', uk: '1 день'
    },
    book_car: {
      ka: 'მანქანის დაჯავშნა', en: 'Book Car', ru: 'Забронировать авто',
      tr: 'Araç Kirala', ar: 'احجز السيارة', he: 'הזמן רכב',
      fa: 'رزرو خودرو', uk: 'Забронювати авто'
    },
    per_day: {
      ka: 'დღეში', en: 'per day', ru: 'в сутки', tr: 'günlük',
      ar: 'في اليوم', he: 'ליום', fa: 'در روز', uk: 'за день'
    },
    loading: {
      ka: 'იტვირთება…', en: 'Loading…', ru: 'Загрузка…', tr: 'Yükleniyor…',
      ar: 'جار التحميل…', he: 'טוען…', fa: 'در حال بارگذاری…', uk: 'Завантаження…'
    },
    read_more: {
      ka: 'მეტის ნახვა', en: 'Read More', ru: 'Подробнее', tr: 'Devamını Oku',
      ar: 'اقرأ المزيد', he: 'קרא עוד', fa: 'بیشتر', uk: 'Читати більше'
    },
    book_now: {
      ka: 'დაჯავშნე ახლა', en: 'Book Now', ru: 'Забронировать',
      tr: 'Hemen Rezerve Et', ar: 'احجز الآن', he: 'הזמן עכשיו',
      fa: 'اکنون رزرو کنید', uk: 'Забронювати'
    },
    view_details: {
      ka: 'დეტალები', en: 'View Details', ru: 'Подробнее', tr: 'Detayları Gör',
      ar: 'عرض التفاصيل', he: 'פרטים נוספים', fa: 'مشاهده جزئیات', uk: 'Детальніше'
    },
    /* ---- Featured slider ---- */
    explore_now: {
      ka: 'აღმოაჩინე ახლა', en: 'Explore Now', ru: 'Исследовать', tr: 'Şimdi Keşfet',
      ar: 'اكتشف الآن', he: 'גלה עכשיו', fa: 'همین حالا کاوش کن', uk: 'Досліджувати'
    },
    best_deal: {
      ka: '⭐ საუკეთესო შეთავაზება', en: '⭐ Best Deal', ru: '⭐ Лучшее предложение',
      tr: '⭐ En İyi Teklif', ar: '⭐ أفضل عرض', he: '⭐ המבצע הכי טוב',
      fa: '⭐ بهترین پیشنهاد', uk: '⭐ Найкраща пропозиція'
    },
    highlights_title: {
      ka: '✨ მთავარი მომენტები', en: '✨ Highlights', ru: '✨ Основные моменты',
      tr: '✨ Öne Çıkanlar', ar: '✨ أبرز ما فيها', he: '✨ עיקרים',
      fa: '✨ نکات برجسته', uk: '✨ Основні моменти'
    },
    guided_tour: {
      ka: 'გიდთან ერთად', en: 'Guided Tour', ru: 'С гидом',
      tr: 'Rehberli Tur', ar: 'جولة مع مرشد', he: 'סיור עם מדריך',
      fa: 'تور با راهنما', uk: 'З гідом'
    },
    all_year: {
      ka: 'მთელი წლის მანძილზე', en: 'All Year', ru: 'Круглый год',
      tr: 'Tüm Yıl', ar: 'طوال العام', he: 'כל השנה',
      fa: 'تمام سال', uk: 'Цілий рік'
    },
    flexible: {
      ka: 'მოქნილი', en: 'Flexible', ru: 'Гибкий',
      tr: 'Esnek', ar: 'مرن', he: 'גמיש',
      fa: 'انعطاف‌پذیر', uk: 'Гнучкий'
    },
    /* "{n} Days" — supports single day and ranged values like "1–5" */
    n_days: {
      ka: '{n} დღე', en: '{n} Days', ru: '{n} дней',
      tr: '{n} Gün', ar: '{n} أيام', he: '{n} ימים',
      fa: '{n} روز', uk: '{n} днів'
    },
    loading: {
      ka: 'იტვირთება', en: 'Loading', ru: 'Загрузка',
      tr: 'Yükleniyor', ar: 'جاري التحميل', he: 'טוען',
      fa: 'در حال بارگذاری', uk: 'Завантаження'
    },
    /* ---- Badges (tour type / category) ---- */
    badge_domestic: {
      ka: 'შიდა', en: 'Domestic', ru: 'По Грузии', tr: 'Yurt İçi',
      ar: 'داخلية', he: 'מקומי', fa: 'داخلی', uk: 'Внутрішній'
    },
    badge_international: {
      ka: 'საერთაშორისო', en: 'International', ru: 'Международный', tr: 'Uluslararası',
      ar: 'دولي', he: 'בינלאומי', fa: 'بین‌المللی', uk: 'Міжнародний'
    },
    tag_one_day: {
      ka: 'ერთდღიანი თავგადასავალი', en: 'One-Day Adventure', ru: 'Однодневное приключение',
      tr: 'Tek Günlük Macera', ar: 'مغامرة ليوم واحد', he: 'הרפתקה ליום אחד',
      fa: 'ماجراجویی یک‌روزه', uk: 'Одноденна пригода'
    },
    tag_multi_day: {
      ka: 'მრავალდღიანი გამოცდილება', en: 'Multi-Day Experience', ru: 'Многодневный опыт',
      tr: 'Çok Günlü Deneyim', ar: 'تجربة متعددة الأيام', he: 'חוויה רב־יומית',
      fa: 'تجربه چندروزه', uk: 'Багатоденний досвід'
    },
    tag_upcoming: {
      ka: 'მალე', en: 'Upcoming Event', ru: 'Предстоящее событие',
      tr: 'Yaklaşan Etkinlik', ar: 'فعالية قادمة', he: 'אירוע קרוב',
      fa: 'رویداد آینده', uk: 'Найближча подія'
    },
    tag_flexible: {
      ka: 'მოქნილი ტური', en: 'Flexible Tour', ru: 'Гибкий тур',
      tr: 'Esnek Tur', ar: 'جولة مرنة', he: 'סיור גמיש',
      fa: 'تور منعطف', uk: 'Гнучкий тур'
    },
    /* ---- Meta labels ---- */
    label_price: {
      ka: 'ფასი', en: 'Price', ru: 'Цена', tr: 'Fiyat',
      ar: 'السعر', he: 'מחיר', fa: 'قیمت', uk: 'Ціна'
    },
    label_duration: {
      ka: 'ხანგრძლივობა', en: 'Duration', ru: 'Длительность', tr: 'Süre',
      ar: 'المدة', he: 'משך', fa: 'مدت', uk: 'Тривалість'
    },
    label_season: {
      ka: 'სეზონი', en: 'Season', ru: 'Сезон', tr: 'Sezon',
      ar: 'الموسم', he: 'עונה', fa: 'فصل', uk: 'Сезон'
    },
    label_min: {
      ka: 'მინ.', en: 'Min', ru: 'Мин.', tr: 'Min.',
      ar: 'الأدنى', he: 'מינ׳', fa: 'حداقل', uk: 'Мін.'
    },
    label_max: {
      ka: 'მაქს.', en: 'Max', ru: 'Макс.', tr: 'Maks.',
      ar: 'الأقصى', he: 'מקס׳', fa: 'حداکثر', uk: 'Макс.'
    },
    /* ---- Empty states ---- */
    empty_domestic: {
      ka: 'შიდა ტურები ჯერჯერობით არ არის. მოგვიანებით შემოიარეთ!',
      en: 'No domestic tours available yet. Check back soon!',
      ru: 'Внутренних туров пока нет. Загляните позже!',
      tr: 'Henüz yurt içi tur yok. Kısa süre içinde tekrar kontrol edin!',
      ar: 'لا توجد جولات داخلية متاحة حتى الآن. تحقق مرة أخرى قريبًا!',
      he: 'עדיין אין סיורים מקומיים. חזרו בקרוב!',
      fa: 'هنوز توری داخلی موجود نیست. به‌زودی دوباره سر بزنید!',
      uk: 'Внутрішніх турів поки немає. Зазирніть згодом!'
    },
    empty_international: {
      ka: 'საერთაშორისო ტურები ჯერჯერობით არ არის. მოგვიანებით შემოიარეთ!',
      en: 'No international tours available yet. Check back soon!',
      ru: 'Международных туров пока нет. Загляните позже!',
      tr: 'Henüz uluslararası tur yok. Kısa süre içinde tekrar kontrol edin!',
      ar: 'لا توجد جولات دولية متاحة حتى الآن. تحقق مرة أخرى قريبًا!',
      he: 'עדיין אין סיורים בינלאומיים. חזרו בקרוב!',
      fa: 'هنوز تور بین‌المللی موجود نیست. به‌زودی دوباره سر بزنید!',
      uk: 'Міжнародних турів поки немає. Зазирніть згодом!'
    },
    empty_cars: {
      ka: 'ხელმისაწვდომი ავტომობილები ჯერჯერობით არ არის.',
      en: 'No vehicles available yet.',
      ru: 'Автомобилей пока нет.',
      tr: 'Henüz araç yok.',
      ar: 'لا توجد مركبات متاحة حتى الآن.',
      he: 'עדיין אין רכבים זמינים.',
      fa: 'هنوز خودرویی موجود نیست.',
      uk: 'Автомобілів поки немає.'
    },
    empty_posts: {
      ka: 'სტატიები ჯერჯერობით არ არის.',
      en: 'No posts available yet.',
      ru: 'Публикаций пока нет.',
      tr: 'Henüz gönderi yok.',
      ar: 'لا توجد مقالات متاحة حتى الآن.',
      he: 'עדיין אין פוסטים.',
      fa: 'هنوز مطلبی موجود نیست.',
      uk: 'Публікацій поки немає.'
    },
    empty_featured: {
      ka: 'რჩეული შეთავაზებები ჯერჯერობით არ არის.',
      en: 'No featured offers available yet.',
      ru: 'Рекомендуемых предложений пока нет.',
      tr: 'Henüz öne çıkan teklif yok.',
      ar: 'لا توجد عروض مميزة حتى الآن.',
      he: 'עדיין אין מבצעים מובילים.',
      fa: 'هنوز پیشنهاد ویژه‌ای وجود ندارد.',
      uk: 'Рекомендованих пропозицій поки немає.'
    },
    empty_tours: {
      ka: 'ტურები ჯერჯერობით არ არის.',
      en: 'No tours available yet.',
      ru: 'Туров пока нет.',
      tr: 'Henüz tur yok.',
      ar: 'لا توجد جولات متاحة حتى الآن.',
      he: 'עדיין אין סיורים.',
      fa: 'هنوز توری موجود نیست.',
      uk: 'Турів поки немає.'
    },
    empty_tours_category: {
      ka: 'ამ კატეგორიაში ტურები ჯერჯერობით არ არის.',
      en: 'No tours in this category yet.',
      ru: 'В этой категории пока нет туров.',
      tr: 'Bu kategoride henüz tur yok.',
      ar: 'لا توجد جولات في هذه الفئة حتى الآن.',
      he: 'עדיין אין סיורים בקטגוריה זו.',
      fa: 'هنوز توری در این دسته وجود ندارد.',
      uk: 'У цій категорії ще немає турів.'
    },
    empty_saved: {
      ka: 'შენახული ტურები ჯერჯერობით არ გაქვთ.',
      en: 'You have no saved tours yet.',
      ru: 'У вас пока нет сохранённых туров.',
      tr: 'Henüz kayıtlı turunuz yok.',
      ar: 'ليس لديك أي جولات محفوظة بعد.',
      he: 'עדיין אין לכם סיורים שמורים.',
      fa: 'هنوز توری ذخیره نکرده‌اید.',
      uk: 'У вас поки немає збережених турів.'
    }
  };

  /* ---------- Raw phrase dictionary (source → translations) ----------
     Keys are the EXACT English text as it appears in the static HTML.
     The runtime translator (ui-translate.js) checks this table first
     and never asks the translation API for anything listed here.
  */
  const PHRASES = {
    /* --- Navbar --- */
    'Home': { ka: 'მთავარი', ru: 'Главная', tr: 'Ana Sayfa', ar: 'الرئيسية', he: 'דף הבית', fa: 'خانه', uk: 'Головна' },
    'Tours': { ka: 'ტურები', ru: 'Туры', tr: 'Turlar', ar: 'الجولات', he: 'סיורים', fa: 'تورها', uk: 'Тури' },
    'Tours ▼': { ka: 'ტურები ▼', ru: 'Туры ▼', tr: 'Turlar ▼', ar: 'الجولات ▼', he: 'סיורים ▼', fa: 'تورها ▼', uk: 'Тури ▼' },
    'Domestic Tours': { ka: 'შიდა ტურები', ru: 'Туры по Грузии', tr: 'Yurt İçi Turlar', ar: 'جولات داخلية', he: 'סיורים מקומיים', fa: 'تورهای داخلی', uk: 'Внутрішні тури' },
    'International Tours': { ka: 'საერთაშორისო ტურები', ru: 'Международные туры', tr: 'Uluslararası Turlar', ar: 'جولات دولية', he: 'סיורים בינלאומיים', fa: 'تورهای بین‌المللی', uk: 'Міжнародні тури' },
    'Cars': { ka: 'მანქანები', ru: 'Автомобили', tr: 'Araçlar', ar: 'السيارات', he: 'רכבים', fa: 'خودروها', uk: 'Авто' },
    'Posts': { ka: 'სტატიები', ru: 'Статьи', tr: 'Yazılar', ar: 'المقالات', he: 'פוסטים', fa: 'مطالب', uk: 'Публікації' },
    'About': { ka: 'ჩვენ შესახებ', ru: 'О нас', tr: 'Hakkımızda', ar: 'من نحن', he: 'אודות', fa: 'درباره ما', uk: 'Про нас' },
    'Contact': { ka: 'კონტაქტი', ru: 'Контакты', tr: 'İletişim', ar: 'اتصل بنا', he: 'צור קשר', fa: 'تماس', uk: 'Контакти' },
    'Login': { ka: 'შესვლა', ru: 'Войти', tr: 'Giriş', ar: 'تسجيل الدخول', he: 'התחברות', fa: 'ورود', uk: 'Увійти' },
    'Sign Up': { ka: 'რეგისტრაცია', ru: 'Регистрация', tr: 'Kayıt Ol', ar: 'إنشاء حساب', he: 'הרשמה', fa: 'ثبت نام', uk: 'Реєстрація' },
    'My Profile': { ka: 'ჩემი პროფილი', ru: 'Мой профиль', tr: 'Profilim', ar: 'ملفي الشخصي', he: 'הפרופיל שלי', fa: 'پروفایل من', uk: 'Мій профіль' },
    'Saved Tours': { ka: 'შენახული ტურები', ru: 'Сохранённые туры', tr: 'Kayıtlı Turlar', ar: 'الجولات المحفوظة', he: 'סיורים שמורים', fa: 'تورهای ذخیره شده', uk: 'Збережені тури' },
    'Sign Out': { ka: 'გამოსვლა', ru: 'Выйти', tr: 'Çıkış', ar: 'تسجيل الخروج', he: 'התנתקות', fa: 'خروج', uk: 'Вийти' },
    'Menu': { ka: 'მენიუ', ru: 'Меню', tr: 'Menü', ar: 'القائمة', he: 'תפריט', fa: 'منو', uk: 'Меню' },
    'Select language': { ka: 'აირჩიეთ ენა', ru: 'Выберите язык', tr: 'Dil seçin', ar: 'اختر اللغة', he: 'בחר שפה', fa: 'انتخاب زبان', uk: 'Обрати мову' },

    /* --- Hero / Index --- */
    'Discover the Caucasus': { ka: 'აღმოაჩინეთ კავკასია', ru: 'Откройте Кавказ', tr: 'Kafkasya\'yı Keşfedin', ar: 'اكتشف القوقاز', he: 'גלו את הקווקז', fa: 'قفقاز را کشف کنید', uk: 'Відкрийте Кавказ' },
    'Explore': { ka: 'აღმოაჩინეთ', ru: 'Исследуйте', tr: 'Keşfedin', ar: 'استكشف', he: 'גלו את', fa: 'کاوش کنید', uk: 'Досліджуйте' },
    'Georgia': { ka: 'საქართველო', ru: 'Грузию', tr: 'Gürcistan\'ı', ar: 'جورجيا', he: 'גאורגיה', fa: 'گرجستان', uk: 'Грузію' },
    'With Us': { ka: 'ჩვენთან ერთად', ru: 'Вместе с нами', tr: 'Bizimle', ar: 'معنا', he: 'איתנו', fa: 'با ما', uk: 'Разом з нами' },
    'Ancient culture, breathtaking mountains, world-class wine and legendary hospitality — all in one extraordinary destination.': {
      ka: 'უძველესი კულტურა, თვალწარმტაცი მთები, მსოფლიო დონის ღვინო და ლეგენდარული სტუმართმოყვარეობა — ყველა ერთ განსაკუთრებულ მიმართულებაში.',
      ru: 'Древняя культура, захватывающие дух горы, вино мирового класса и легендарное гостеприимство — всё в одном исключительном направлении.',
      tr: 'Kadim kültür, nefes kesen dağlar, dünya standartlarında şarap ve efsanevi misafirperverlik — hepsi tek bir olağanüstü destinasyonda.',
      ar: 'ثقافة عريقة، جبال خلابة، نبيذ عالمي المستوى، وضيافة أسطورية — كل ذلك في وجهة استثنائية واحدة.',
      he: 'תרבות עתיקה, הרים עוצרי נשימה, יין ברמה עולמית וואהבה אגדית — הכול ביעד אחד יוצא דופן.',
      fa: 'فرهنگ باستانی، کوه‌های نفس‌گیر، شراب درجه یک جهان و مهمان‌نوازی افسانه‌ای — همه در یک مقصد استثنایی.',
      uk: 'Давня культура, захоплюючі гори, вино світового класу та легендарна гостинність — усе в одному неймовірному напрямку.'
    },
    '✦ Book Now': { ka: '✦ დაჯავშნე ახლა', ru: '✦ Забронировать', tr: '✦ Hemen Rezerve Et', ar: '✦ احجز الآن', he: '✦ הזמן עכשיו', fa: '✦ اکنون رزرو کنید', uk: '✦ Забронювати' },
    'Book Now': { ka: 'დაჯავშნე ახლა', ru: 'Забронировать', tr: 'Hemen Rezerve Et', ar: 'احجز الآن', he: 'הזמן עכשיו', fa: 'اکنون رزرو کنید', uk: 'Забронювати' },
    'Learn More →': { ka: 'გაიგე მეტი →', ru: 'Узнать больше →', tr: 'Daha Fazla →', ar: 'اعرف المزيد →', he: 'למידע נוסף →', fa: 'اطلاعات بیشتر →', uk: 'Докладніше →' },
    'Learn More': { ka: 'გაიგე მეტი', ru: 'Узнать больше', tr: 'Daha Fazla', ar: 'اعرف المزيد', he: 'למידע נוסף', fa: 'اطلاعات بیشتر', uk: 'Докладніше' },
    'Scroll': { ka: 'დაათვალიერე', ru: 'Листать', tr: 'Kaydır', ar: 'مرر', he: 'גלילה', fa: 'پیمایش', uk: 'Гортайте' },

    /* --- Section headers --- */
    'This Season\'s Best Deal': { ka: 'სეზონის საუკეთესო შეთავაზება', ru: 'Лучшее предложение сезона', tr: 'Sezonun En İyi Teklifi', ar: 'أفضل عرض لهذا الموسم', he: 'המבצע הטוב ביותר של העונה', fa: 'بهترین پیشنهاد فصل', uk: 'Найкраща пропозиція сезону' },
    'Local Adventures': { ka: 'ადგილობრივი თავგადასავლები', ru: 'Местные приключения', tr: 'Yerel Maceralar', ar: 'مغامرات محلية', he: 'הרפתקאות מקומיות', fa: 'ماجراجویی‌های محلی', uk: 'Місцеві пригоди' },
    'International Adventures': { ka: 'საერთაშორისო თავგადასავლები', ru: 'Международные приключения', tr: 'Uluslararası Maceralar', ar: 'مغامرات دولية', he: 'הרפתקאות בינלאומיות', fa: 'ماجراجویی‌های بین‌المللی', uk: 'Міжнародні пригоди' },
    'Transport': { ka: 'ტრანსპორტი', ru: 'Транспорт', tr: 'Ulaşım', ar: 'النقل', he: 'תחבורה', fa: 'حمل و نقل', uk: 'Транспорт' },
    'Transport Services': { ka: 'ტრანსპორტი სერვისები', ru: 'Транспортные услуги', tr: 'Ulaşım Hizmetleri', ar: 'خدمات النقل', he: 'שירותי תחבורה', fa: 'خدمات حمل و نقل', uk: 'Транспортні послуги' },
    'Blog': { ka: 'ბლოგი', ru: 'Блог', tr: 'Blog', ar: 'المدونة', he: 'בלוג', fa: 'بلاگ', uk: 'Блог' },
    'Stories': { ka: 'ისტორიები', ru: 'Истории', tr: 'Hikâyeler', ar: 'قصص', he: 'סיפורים', fa: 'داستان‌ها', uk: 'Історії' },
    'Testimonials': { ka: 'შეფასებები', ru: 'Отзывы', tr: 'Yorumlar', ar: 'آراء العملاء', he: 'המלצות', fa: 'نظرات', uk: 'Відгуки' },
    'Customer Stories': { ka: 'მომხმარებელთა ისტორიები', ru: 'Истории клиентов', tr: 'Müşteri Hikâyeleri', ar: 'قصص العملاء', he: 'סיפורי לקוחות', fa: 'داستان مشتریان', uk: 'Історії клієнтів' },
    'Our Destinations': { ka: 'ჩვენი მიმართულებები', ru: 'Наши направления', tr: 'Destinasyonlarımız', ar: 'وجهاتنا', he: 'היעדים שלנו', fa: 'مقاصد ما', uk: 'Наші напрямки' },
    'Live': { ka: 'პირდაპირი', ru: 'Сейчас', tr: 'Canlı', ar: 'مباشر', he: 'שידור חי', fa: 'زنده', uk: 'Наживо' },
    'Georgia Weather': { ka: 'ამინდი საქართველოში', ru: 'Погода в Грузии', tr: 'Gürcistan Havası', ar: 'طقس جورجيا', he: 'מזג האוויר בגאורגיה', fa: 'آب و هوای گرجستان', uk: 'Погода в Грузії' },
    'Discover Georgia with us! We offer both private and group tours tailored to your interests and schedule. Whether it\'s a one-day escape or a multi-day adventure, our professional guides promise an unforgettable journey.': {
      ka: 'აღმოაჩინეთ საქართველო ჩვენთან ერთად! გთავაზობთ როგორც ინდივიდუალურ, ისე ჯგუფურ ტურებს, რომლებიც მორგებულია თქვენს ინტერესებსა და დროზე. იქნება ეს ერთდღიანი გასვლა თუ მრავალდღიანი თავგადასავალი, ჩვენი პროფესიონალი გიდები დაუვიწყარ მოგზაურობას გპირდებიან.',
      ru: 'Откройте Грузию вместе с нами! Мы предлагаем как индивидуальные, так и групповые туры, адаптированные под ваши интересы и расписание. Будь то однодневная поездка или многодневное приключение — наши профессиональные гиды обещают незабываемое путешествие.',
      tr: 'Gürcistan\'ı bizimle keşfedin! İlgi alanlarınıza ve programınıza göre özel ve grup turları sunuyoruz. İster bir günlük bir kaçamak ister çok günlü bir macera olsun, profesyonel rehberlerimiz unutulmaz bir yolculuk vaat ediyor.',
      ar: 'اكتشف جورجيا معنا! نقدم جولات خاصة وجماعية مصممة حسب اهتماماتك وجدولك. سواء كانت رحلة ليوم واحد أو مغامرة لعدة أيام، يعدك مرشدونا المحترفون برحلة لا تُنسى.',
      he: 'גלו את גאורגיה איתנו! אנו מציעים סיורים פרטיים וקבוצתיים המותאמים לתחומי העניין ולזמן שלכם. בין אם מדובר בטיול של יום אחד או בהרפתקה של כמה ימים, המדריכים המקצועיים שלנו מבטיחים חוויה בלתי נשכחת.',
      fa: 'گرجستان را همراه ما کشف کنید! تورهای خصوصی و گروهی متناسب با علایق و برنامه‌ی شما ارائه می‌دهیم. چه یک گریز یک‌روزه باشد و چه یک ماجراجویی چندروزه، راهنمایان حرفه‌ای ما سفری فراموش‌نشدنی را تضمین می‌کنند.',
      uk: 'Відкрийте Грузію з нами! Ми пропонуємо індивідуальні та групові тури, адаптовані під ваші інтереси й розклад. Будь то одноденна прогулянка чи багатоденна пригода — наші професійні гіди обіцяють незабутню подорож.'
    },
    'Discover new countries, taste different cuisines, and explore incredible places around the world. This program is perfect for those who love long adventures and want every day to be filled with something new.': {
      ka: 'აღმოაჩინე ახალი ქვეყნები, გასინჯე განსხვავებული კერძები და ნახე საოცარი ადგილები მთელ მსოფლიოში. ეს პროგრამა იდეალურია მათთვის, ვისაც უყვარს ხანგრძლივი თავგადასავლები და სურს, რომ ყოველი დღე სიახლით იყოს სავსე.',
      ru: 'Откройте новые страны, попробуйте разные кухни и исследуйте невероятные места по всему миру. Эта программа идеальна для тех, кто любит долгие приключения и хочет, чтобы каждый день был наполнен чем-то новым.',
      tr: 'Yeni ülkeleri keşfedin, farklı mutfakları tadın ve dünyanın inanılmaz yerlerini gezin. Bu program, uzun maceraları sevenler ve her gününü yeniliklerle dolu geçirmek isteyenler için idealdir.',
      ar: 'اكتشف دولاً جديدة، وتذوّق مطابخ مختلفة، واستكشف أماكن مذهلة حول العالم. هذا البرنامج مثالي لمن يحب المغامرات الطويلة ويريد أن يكون كل يوم مفعمًا بالجديد.',
      he: 'גלו ארצות חדשות, טעמו מטבחים שונים וחקרו מקומות מדהימים ברחבי העולם. התוכנית הזו מושלמת עבור אלו שאוהבים הרפתקאות ארוכות ורוצים שכל יום יהיה מלא בחוויות חדשות.',
      fa: 'کشورهای جدید را کشف کنید، غذاهای گوناگون را بچشید و مکان‌های شگفت‌انگیز سراسر جهان را ببینید. این برنامه برای کسانی ایده‌آل است که عاشق ماجراجویی‌های طولانی هستند و می‌خواهند هر روزشان پر از تجربه‌ی تازه باشد.',
      uk: 'Відкривайте нові країни, куштуйте різноманітні страви та досліджуйте неймовірні місця по всьому світу. Ця програма ідеальна для тих, хто любить довгі пригоди і хоче, щоб кожен день був наповнений новим.'
    },
    'We offer comfortable vehicles for every need — whether it\'s getting around the city or a long journey into the mountains. Travel calmly and safely.': {
      ka: 'ჩვენთან დაგხვდებათ კომფორტული ავტომობილები ნებისმიერი საჭიროებისთვის — იქნება ეს ქალაქში გადაადგილება თუ გრძელი გზა მთაში. იმოგზაურეთ მშვიდად და უსაფრთხოდ.',
      ru: 'Мы предлагаем комфортные автомобили под любые задачи — будь то поездка по городу или долгий путь в горы. Путешествуйте спокойно и безопасно.',
      tr: 'Her ihtiyaç için konforlu araçlar sunuyoruz — ister şehir içi ulaşım ister dağlara uzun bir yolculuk olsun. Huzur ve güvenlik içinde seyahat edin.',
      ar: 'نوفر لك مركبات مريحة لكل احتياج — سواء كان تنقلاً داخل المدينة أو رحلة طويلة إلى الجبال. سافر بهدوء وأمان.',
      he: 'אנו מציעים רכבים נוחים לכל צורך — בין אם זו נסיעה בעיר או מסע ארוך להרים. סעו בשלווה ובבטחה.',
      fa: 'ما خودروهای راحت برای هر نیازی ارائه می‌دهیم — چه تردد در شهر و چه سفری طولانی به کوهستان. با آرامش و ایمنی سفر کنید.',
      uk: 'Ми пропонуємо комфортні автомобілі під будь-яку потребу — чи то пересування містом, чи довга дорога в гори. Подорожуйте спокійно т�� безпечно.'
    },
    'Travel guides, local tips and authentic stories from the heart of the Caucasus.': {
      ka: 'სამოგზაურო გზამკვლევები, ადგილობრივი რჩევები და ნამდვილი ისტორიები კავკასიის გულიდან.',
      ru: 'Путеводители, местные советы и подлинные истории из самого сердца Кавказа.',
      tr: 'Seyahat rehberleri, yerel ipuçları ve Kafkasya\'nın kalbinden otantik hikâyeler.',
      ar: 'أدلة سفر، نصائح محلية وقصص أصيلة من قلب القوقاز.',
      he: 'מדריכי טיולים, טיפים מקומיים וסיפורים אותנטיים מלב הקווקז.',
      fa: 'راهنمای سفر، نکات محلی و داستان‌های اصیل از قلب قفقاز.',
      uk: 'Путівники, місцеві поради та справжні історії із серця Кавказу.'
    },
    'Real feedback from travelers who explored Georgia with us.': {
      ka: 'ნამდვილი გამოხმაურება მოგზაურებისგან, რომლებმაც ჩვენთან ერთად აღმოაჩინეს საქართველო.',
      ru: 'Настоящие отзывы путешественников, которые открыли Грузию вместе с нами.',
      tr: 'Bizimle Gürcistan\'ı keşfeden gezginlerden gerçek geri bildirimler.',
      ar: 'تعليقات حقيقية من المسافرين الذين اكتشفوا جورجيا معنا.',
      he: 'משוב אמיתי ממטיילים שחקרו את גאורגיה איתנו.',
      fa: 'نظرات واقعی از مسافرانی که همراه ما گرجستان را کشف کرده‌اند.',
      uk: 'Справжні відгуки мандрівників, які відкрили Грузію разом з нами.'
    },

    /* --- Buttons / CTA --- */
    'View All Domestic Tours': { ka: 'ყველა შიდა ტურის ნახვა', ru: 'Все туры по Грузии', tr: 'Tüm Yurt İçi Turlar', ar: 'عرض جميع الجولات الداخلية', he: 'צפה בכל הסיורים המקומיים', fa: 'مشاهده همه تورهای داخلی', uk: 'Усі внутрішні тури' },
    'View All International Tours': { ka: 'ყველა საერთაშორისო ტურის ნახვა', ru: 'Все международные туры', tr: 'Tüm Uluslararası Turlar', ar: 'عرض جميع الجولات الدولية', he: 'צפה בכל הסיורים הבינלאומיים', fa: 'مشاهده همه تورهای بین‌المللی', uk: 'Усі міжнародні тури' },
    'View All Stories →': { ka: 'ყველა ისტორიის ნახვა →', ru: 'Все истории →', tr: 'Tüm Hikâyeler →', ar: 'عرض جميع القصص →', he: 'צפה בכל הסיפורים →', fa: 'مشاهده همه داستان‌ها →', uk: 'Усі історії →' },
    'Leave a Review on Google Maps': { ka: 'დატოვე შეფასება Google Maps-ზე', ru: 'Оставить отзыв в Google Maps', tr: 'Google Haritalar\'da Yorum Bırak', ar: 'اترك تقييماً على خرائط جوجل', he: 'השאירו ביקורת ב-Google Maps', fa: 'نظر در گوگل مپس بگذارید', uk: 'Залишити відгук у Google Maps' },
    'Loading featured offers...': { ka: 'იტვირთება რჩეული შეთავაზებები...', ru: 'Загружаются рекомендуемые предложения...', tr: 'Öne çıkan teklifler yükleniyor...', ar: 'جاري تحميل العروض المميزة...', he: 'טוען מבצעים מובילים...', fa: 'در حال بارگذاری پیشنهادات ویژه...', uk: 'Завантаження рекомендацій...' },
    '⏳ Fetching live weather…': { ka: '⏳ ამინდის მონაცემების ჩატვირთვა…', ru: '⏳ Загрузка погоды в реальном времени…', tr: '⏳ Canlı hava durumu alınıyor…', ar: '⏳ جاري جلب الطقس المباشر…', he: '⏳ טוען מזג אוויר בזמן אמת…', fa: '⏳ در حال دریافت آب و هوا…', uk: '⏳ Завантаження поточної погоди…' },
    'Previous': { ka: 'წინა', ru: 'Назад', tr: 'Önceki', ar: 'السابق', he: 'הקודם', fa: 'قبلی', uk: 'Попередній' },
    'Next': { ka: 'შემდეგი', ru: 'Далее', tr: 'Sonraki', ar: 'التالي', he: 'הבא', fa: 'بعدی', uk: 'Наступний' },
    'Close': { ka: 'დახურვა', ru: 'Закрыть', tr: 'Kapat', ar: 'إغلاق', he: 'סגור', fa: 'بستن', uk: 'Закрити' },

    /* --- Map locations (structured as name – description) --- */
    'Tbilisi – Capital City': { ka: 'თბილისი – დედაქალაქი', ru: 'Тбилиси – Столица', tr: 'Tiflis – Başkent', ar: 'تبليسي – العاصمة', he: 'טביליסי – עיר הבירה', fa: 'تفلیس – پایتخت', uk: 'Тбілісі – столиця' },
    'Kazbegi – Caucasus Mountains': { ka: 'ყაზბეგი – კავკასიონის მთები', ru: 'Казбеги – Кавказские горы', tr: 'Kazbegi – Kafkas Dağları', ar: 'كازبيغي – جبال القوقاز', he: 'קזבגי – הרי הקווקז', fa: 'کازبگی – کوه‌های قفقاز', uk: 'Казбегі – Кавказькі гори' },
    'Kakheti – Wine Region': { ka: 'კახეთი – ღვინის რეგიონი', ru: 'Кахетия – Винный регион', tr: 'Kaheti – Şarap Bölgesi', ar: 'كاخيتي – منطقة النبيذ', he: 'קחתי – אזור היין', fa: 'کاختی – منطقه شراب', uk: 'Кахетія – винний регіон' },
    'Batumi – Black Sea Coast': { ka: 'ბათუმი – შავი ზღვის სანაპირო', ru: 'Батуми – Побережье Чёрного моря', tr: 'Batum – Karadeniz Kıyısı', ar: 'باتومي – ساحل البحر الأسود', he: 'בטומי – חוף הים השחור', fa: 'باتومی – ساحل دریای سیاه', uk: 'Батумі – узбережжя Чорного моря' },
    'Svaneti – Ancient Highlands': { ka: 'სვანეთი – უძველესი მთიანეთი', ru: 'Сванетия – Древнее высокогорье', tr: 'Svaneti – Kadim Dağlık Bölge', ar: 'سفانيتي – المرتفعات القديمة', he: 'סוואנטי – רמות עתיקות', fa: 'سوانتی – کوهستان‌های باستانی', uk: 'Сванетія – давні високогір\'я' },

    /* --- Footer --- */
    'Your trusted travel partner in Georgia. Crafting genuine experiences since 2017.': {
      ka: 'თქვენი სანდო სამოგზაურო პარტნიორი საქართველოში. ვქმნით ნამდვილ გამოცდილებებს 2017 წლიდან.',
      ru: 'Ваш надёжный туристический партнёр в Грузии. Создаём настоящие впечатления с 2017 года.',
      tr: 'Gürcistan\'da güvendiğiniz seyahat ortağınız. 2017\'den beri gerçek deneyimler üretiyoruz.',
      ar: 'شريك سفرك الموثوق في جورجيا. نصنع تجارب أصيلة منذ 2017.',
      he: 'שותפכם המהימן לטיולים בגאורגיה. יוצרים חוויות אותנטיות מאז 2017.',
      fa: 'شریک مورد اعتماد سفر شما در گرجستان. از سال ۲۰۱۷ تجربه‌های اصیل خلق می‌کنیم.',
      uk: 'Ваш надійний туристичний партнер у Грузії. Створюємо справжні враження з 2017 року.'
    },
    'Quick Links': { ka: 'სწრაფი ბმულები', ru: 'Быстрые ссылки', tr: 'Hızlı Bağlantılar', ar: 'روابط سريعة', he: 'קישורים מהירים', fa: 'پیوندهای سریع', uk: 'Швидкі посилання' },
    'Tour Types': { ka: 'ტურების ტიპები', ru: 'Типы туров', tr: 'Tur Türleri', ar: 'أنواع الجولات', he: 'סוגי סיורים', fa: 'انواع تور', uk: 'Типи турів' },
    'One-Day Tours': { ka: 'ერთდღიანი ტურები', ru: 'Однодневные туры', tr: 'Günlük Turlar', ar: 'جولات يوم واحد', he: 'סיורים ליום אחד', fa: 'تورهای یک‌روزه', uk: 'Одноденні тури' },
    'Multi-Day Tours': { ka: 'მრავალდღიანი ტურები', ru: 'Многодневные туры', tr: 'Çok Günlü Turlar', ar: 'جولات متعددة الأيام', he: 'סיורים ליותר מיום', fa: 'تورهای چندروزه', uk: 'Багатоденні тури' },
    'Fixed Tours': { ka: 'ფიქსირებული ტურები', ru: 'Фиксированные туры', tr: 'Sabit Turlar', ar: 'جولات ثابتة', he: 'סיורים קבועים', fa: 'تورهای ثابت', uk: 'Фіксовані тури' },
    'Mon – Sun: 10:00 – 19:00': { ka: 'ორშ – კვ: 10:00 – 19:00', ru: 'Пн – Вс: 10:00 – 19:00', tr: 'Pzt – Paz: 10:00 – 19:00', ar: 'الاثنين – الأحد: 10:00 – 19:00', he: 'שני – ראשון: 10:00 – 19:00', fa: 'دوشنبه – یکشنبه: ۱۰:۰۰ – ۱۹:۰۰', uk: 'Пн – Нд: 10:00 – 19:00' },
    '© 2026 Georgia Trips. All rights reserved.': { ka: '© 2026 Georgia Trips. ყველა უფლება დაცულია.', ru: '© 2026 Georgia Trips. Все права защищены.', tr: '© 2026 Georgia Trips. Tüm hakları saklıdır.', ar: '© 2026 Georgia Trips. جميع الحقوق محفوظة.', he: '© 2026 Georgia Trips. כל הזכויות שמורות.', fa: '© 2026 Georgia Trips. تمامی حقوق محفوظ است.', uk: '© 2026 Georgia Trips. Усі права захищені.' },
    'Privacy Policy': { ka: 'კონფიდენციალურობის პოლიტიკა', ru: 'Политика конфиденциальности', tr: 'Gizlilik Politikası', ar: 'سياسة الخصوصية', he: 'מדיניות פרטיות', fa: 'سیاست حریم خصوصی', uk: 'Політика конфіденційності' },
    'Terms': { ka: 'პირობები', ru: 'Условия', tr: 'Koşullar', ar: 'الشروط', he: 'תנאים', fa: 'شرایط', uk: 'Умови' },
    'developed by': { ka: 'შემქმნელი —', ru: 'разработано —', tr: 'geliştiren —', ar: 'طوّر بواسطة', he: 'פותח על ידי', fa: 'توسعه توسط', uk: 'розроблено —' },

    /* --- Booking modal --- */
    'Tour Name': { ka: 'ტურის დასახელება', ru: 'Название тура', tr: 'Tur Adı', ar: 'اسم الجولة', he: 'שם הסיור', fa: 'نام تور', uk: 'Назва туру' },
    'Ready to book this tour? Fill out your details and our team will confirm your reservation within 24 hours.': {
      ka: 'მზად ხართ ტურის დასაჯავშნად? შეავსეთ დეტალები და ჩვენი გუნდი დაადასტურებს ჯავშანს 24 საათში.',
      ru: 'Готовы забронировать тур? Заполните данные — наша команда подтвердит бронь в течение 24 часов.',
      tr: 'Bu turu rezerve etmeye hazır mısınız? Bilgilerinizi doldurun, ekibimiz 24 saat içinde onaylayacaktır.',
      ar: 'هل أنت مستعد لحجز هذه الجولة؟ املأ بياناتك وسيؤكد فريقنا الحجز خلال 24 ساعة.',
      he: 'מוכנים להזמין את הסיור? מלאו פרטים והצוות שלנו יאשר את ההזמנה תוך 24 שעות.',
      fa: 'آماده رزرو این تور هستید؟ مشخصات را وارد کنید و تیم ما طی ۲۴ ساعت رزرو را تأیید خواهد کرد.',
      uk: 'Готові забронювати цей тур? Заповніть дані, і наша команда підтвердить бронювання протягом 24 годин.'
    },
    'Full Name': { ka: 'სახელი და გვარი', ru: 'Полное имя', tr: 'Ad Soyad', ar: 'الاسم الكامل', he: 'שם מלא', fa: 'نام و نام خانوادگی', uk: 'Повне ім\'я' },
    'Your full name': { ka: 'თქვენი სახელი და გვარი', ru: 'Ваше полное имя', tr: 'Adınız ve soyadınız', ar: 'اسمك الكامل', he: 'השם המלא שלך', fa: 'نام کامل شما', uk: 'Ваше повне ім\'я' },
    'Email': { ka: 'იმეილი', ru: 'Эл. почта', tr: 'E-posta', ar: 'البريد الإلكتروني', he: 'אימייל', fa: 'ایمیل', uk: 'Електронна пошта' },
    'Email Address': { ka: 'იმეილის მისამართი', ru: 'Адрес эл. почты', tr: 'E-posta Adresi', ar: 'عنوان البريد الإلكتروني', he: 'כתובת אימייל', fa: 'آدرس ایمیل', uk: 'Адреса e-mail' },
    'Number of People': { ka: 'ადამიანების რაოდენობა', ru: 'Количество человек', tr: 'Kişi Sayısı', ar: 'عدد الأشخاص', he: 'מספר אנשים', fa: 'تعداد افراد', uk: 'Кількість осіб' },
    'Preferred Date': { ka: 'სასურველი თარიღი', ru: 'Желаемая дата', tr: 'Tercih Edilen Tarih', ar: 'التاريخ المفضل', he: 'תאריך מועדף', fa: 'تاریخ دلخواه', uk: 'Бажана дата' },
    'Send Booking Request ✦': { ka: 'გაგზავნე ჯავშნის მოთხოვნა ✦', ru: 'Отправить запрос ✦', tr: 'Rezervasyon İsteği Gönder ✦', ar: 'إرسال طلب الحجز ✦', he: 'שלחו בקשת הזמנה ✦', fa: 'ارسال درخواست رزرو ✦', uk: 'Надіслати запит ✦' },
    'Send Booking Request': { ka: 'გაგზავნე ჯავშნის მოთხოვნა', ru: 'Отправить запрос на бронирование', tr: 'Rezervasyon İsteği Gönder', ar: 'إرسال طلب الحجز', he: 'שלחו בקשת הזמנה', fa: 'ارسال درخواست رزرو', uk: 'Надіслати запит на бронювання' },

    /* --- Common tour labels (static HTML) --- */
    'Tour Highlights': { ka: 'ტურის მთავარი მომენტები', ru: 'Основные моменты тура', tr: 'Tur Öne Çıkanları', ar: 'أبرز ما في الجولة', he: 'עיקרי הסיור', fa: 'ویژگی‌های تور', uk: 'Основні моменти туру' },
    'What\'s Included': { ka: 'რა შედის', ru: 'Что включено', tr: 'Dahil Olanlar', ar: 'ما هو متضمن', he: 'מה כלול', fa: 'آنچه شامل می‌شود', uk: 'Що входить' },
    'Detailed Itinerary': { ka: 'დეტალური გეგმა', ru: 'Подробный маршрут', tr: 'Ayrıntılı Program', ar: 'جدول الرحلة المفصل', he: 'מסלול מפורט', fa: 'برنامه تفصیلی', uk: 'Детальний маршрут' },
    'Best Season': { ka: 'საუკეთესო სეზონი', ru: 'Лучший сезон', tr: 'En İyi Sezon', ar: 'أفضل موسم', he: 'עונה מומלצת', fa: 'بهترین فصل', uk: 'Найкращий сезон' },
    'Category': { ka: 'კატეგორია', ru: 'Категория', tr: 'Kategori', ar: 'الفئة', he: 'קטגוריה', fa: 'دسته‌بندی', uk: 'Категорія' },
    'Duration': { ka: 'ხანგრძლივობა', ru: 'Длительность', tr: 'Süre', ar: 'المدة', he: 'משך', fa: 'مدت زمان', uk: 'Тривалість' },
    '← Back to Tours': { ka: '← უკან ტურებზე', ru: '← Назад к турам', tr: '← Turlara Dön', ar: '← العودة إلى الجولات', he: '← חזרה לסיורים', fa: '← بازگشت به تورها', uk: '← Назад до турів' },

    /* --- Tours filter page --- */
    'All': { ka: 'ყველა', ru: 'Все', tr: 'Tümü', ar: 'الكل', he: 'הכול', fa: 'همه', uk: 'Усі' },
    'Filter by Category': { ka: 'გაფილტრე კატეგორიით', ru: 'Фильтровать по категории', tr: 'Kategoriye Göre Filtrele', ar: 'تصفية حسب الفئة', he: 'סינון לפי קטגוריה', fa: 'فیلتر بر اساس دسته', uk: 'Фільтр за категорією' },

    /* --- Login --- */
    'Welcome Back': { ka: 'მოგესალმებით', ru: 'С возвращением', tr: 'Tekrar Hoş Geldiniz', ar: 'أهلاً بعودتك', he: 'ברוכים השבים', fa: 'خوش آمدید', uk: 'Вітаємо знову' },
    'Create Account': { ka: 'ანგარიშის შექმნა', ru: 'Создать аккаунт', tr: 'Hesap Oluştur', ar: 'إنشاء حساب', he: 'יצירת חשבון', fa: 'ایجاد حساب', uk: 'Створити акаунт' },
    'Password': { ka: 'პაროლი', ru: 'Пароль', tr: 'Şifre', ar: 'كلمة المرور', he: 'סיסמה', fa: 'رمز عبور', uk: 'Пароль' },
    'Forgot Password?': { ka: 'დაგავიწყდა პაროლი?', ru: 'Забыли пароль?', tr: 'Şifremi Unuttum?', ar: 'نسيت كلمة المرور؟', he: 'שכחת סיסמה?', fa: 'رمز عبور را فراموش کرده‌اید؟', uk: 'Забули пароль?' },
    'Continue with Google': { ka: 'გააგრძელე Google-ით', ru: 'Продолжить с Google', tr: 'Google ile devam et', ar: 'المتابعة باستخدام Google', he: 'המשך עם Google', fa: 'ادامه با گوگل', uk: 'Продовжити через Google' },

    /* --- Profile --- */
    'Verified Member': { ka: 'დადასტურებული მომხმარებელი', ru: 'Подтверждённый участник', tr: 'Doğrulanmış Üye', ar: 'عضو موثق', he: 'חבר מאומת', fa: 'عضو تأیید شده', uk: 'Верифікований учасник' },
    'Member Since': { ka: 'წევრია', ru: 'Участник с', tr: 'Üyelik Tarihi', ar: 'عضو منذ', he: 'חבר מאז', fa: 'عضو از', uk: 'Учасник з' },
    'Sign-in Method': { ka: 'შესვლის მეთოდი', ru: 'Способ входа', tr: 'Giriş Yöntemi', ar: 'طريقة الدخول', he: 'שיטת התחברות', fa: 'روش ورود', uk: 'Спосіб входу' },
    'Account Information': { ka: 'ანგარიშის ინფორმაცია', ru: 'Информация об аккаунте', tr: 'Hesap Bilgileri', ar: 'معلومات الحساب', he: 'פרטי חשבון', fa: 'اطلاعات حساب', uk: 'Інформація про акаунт' },
    'Log Out': { ka: 'გასვლა', ru: 'Выйти', tr: 'Çıkış yap', ar: 'تسجيل الخروج', he: 'התנתק', fa: 'خروج', uk: 'Вийти' }
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
