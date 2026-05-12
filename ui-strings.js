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
    all: {
      ka: 'ყველა', en: 'All', ru: 'Все', tr: 'Tümü',
      ar: 'الكل', he: 'הכול', uk: 'Усі'
    },
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
    best_deal: {
      ka: 'საუკეთესო შეთავაზება', en: 'Best Offer', ru: 'Лучшее предложение',
      tr: 'En İyi Teklif', ar: 'أفضل عرض', he: 'המבצע הטוב ביותר',
      uk: 'Найкраща пропозиція'
    },
    /* ---- Car Types & Specs ---- */
    type_sedan: {
      ka: 'სედანი', en: 'Sedan', ru: 'Седан', tr: 'Sedan',
      ar: 'سيدان', he: 'סדאן', uk: 'Седан'
    },
    type_suv: {
      ka: 'ჯიპი', en: 'SUV', ru: 'Внедорожник', tr: 'SUV',
      ar: 'دفع رباعي', he: 'רכב פנאי', uk: 'Позашляховик'
    },
    type_minivan: {
      ka: 'მინივენი', en: 'Minivan', ru: 'Минивэн', tr: 'Minivan',
      ar: 'ميني فان', he: 'מיניוואן', uk: 'Мінівен'
    },
    type_van: {
      ka: 'მიკროავტობუსი', en: 'Van', ru: 'Фургон', tr: 'Van',
      ar: 'فان', he: 'ואן', uk: 'Мікроавтобус'
    },
    type_jeep: {
      ka: 'ჯიპი', en: 'Jeep', ru: 'Джип', tr: 'Jeep',
      ar: 'جيب', he: 'ג׳יפ', uk: 'Джип'
    },
    automatic: {
      ka: 'ავტომატური', en: 'Automatic', ru: 'Автомат', tr: 'Otomatik',
      ar: 'أوتوماتيك', he: 'אוטומטי', uk: 'Автомат'
    },
    manual: {
      ka: 'მექანიკური', en: 'Manual', ru: 'Механика', tr: 'Manuel',
      ar: 'يدوي', he: 'ידני', uk: 'Механіка'
    },
    petrol: {
      ka: 'ბენზინი', en: 'Petrol', ru: 'Бензин', tr: 'Benzin',
      ar: 'بنزين', he: 'בנזין', uk: 'Бензин'
    },
    diesel: {
      ka: 'დიზელი', en: 'Diesel', ru: 'Дизель', tr: 'Dizel',
      ar: 'ديزل', he: 'דיזל', uk: 'Дизель'
    },
    hybrid: {
      ka: 'ჰიბრიდი', en: 'Hybrid', ru: 'Гибрид', tr: 'Hibrit',
      ar: 'هجين', he: 'היברידי', uk: 'Гібрид'
    },
    black: { ka: 'შავი', en: 'Black', ru: 'Черный', tr: 'Siyah', ar: 'أسود', he: 'שחור', uk: 'Чორний' },
    white: { ka: 'თეთრი', en: 'White', ru: 'Белый', tr: 'Beyaz', ar: 'أبيض', he: 'לבן', uk: 'Білий' },
    silver: { ka: 'ვერცხლისფერი', en: 'Silver', ru: 'Серебристый', tr: 'Gümüş', ar: 'فضي', he: 'כסף', uk: 'Сріблястий' },
    grey: { ka: 'ნაცრისფერი', en: 'Grey', ru: 'Серый', tr: 'Gri', ar: 'رمادي', he: 'אפור', uk: 'Сірий' },
    red: { ka: 'წითელი', en: 'Red', ru: 'Красный', tr: 'Kırmızı', ar: 'أحمر', he: 'אדום', uk: 'Червоний' },
    blue: { ka: 'ლურჯი', en: 'Blue', ru: 'Синий', tr: 'Mavi', ar: 'أزرق', he: 'კחול', uk: 'Синій' },
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
    /* ---- Vehicle card specs (used by cars.html render) ---- */
    driver_included: {
      ka: 'მძღოლი შედის', en: 'Driver included', ru: 'Водитель включён', tr: 'Şoför dahil',
      ar: 'السائق مشمول', he: 'הנהג כלול', uk: 'Водій включений'
    },
    spec_seats: {
      ka: 'ადგილი', en: 'Seats', ru: 'Мест', tr: 'Koltuk',
      ar: 'مقاعد', he: 'מושבים', uk: 'Місць'
    },
    spec_transmission: {
      ka: 'გადაცემათა კოლოფი', en: 'Gearbox', ru: 'Коробка', tr: 'Vites',
      ar: 'ناقل الحركة', he: 'תיבת הילוכים', uk: 'Коробка'
    },
    spec_fuel: {
      ka: 'საწვავი', en: 'Fuel', ru: 'Топливо', tr: 'Yakıt',
      ar: 'الوقود', he: 'דלק', uk: 'Пальне'
    },
    no_car_description: {
      ka: 'აღწერა ხელმისაწვდომი არ არის.',
      en: 'No description available.',
      ru: 'Описание недоступно.',
      tr: 'Açıklama mevcut değil.',
      ar: 'لا يوجد وصف متاح.',
      he: 'אין תיאור זמין.',
      uk: 'Опис недоступний.'
    },
    car_booking_success: {
      ka: 'გმადლობთ მანქანის "{car}" დაჯავშნისთვის!\n\nჩვენ მივიღეთ თქვენი მოთხოვნა და დავადასტურებთ 24 საათში.\n\nშეამოწმეთ თქვენი იმეილი დეტალებისთვის.',
      en: 'Thank you for booking "{car}"!\n\nWe received your request and will confirm within 24 hours.\n\nCheck your email for details.',
      ru: 'Спасибо за бронирование "{car}"!\n\nМы получили ваш запрос и подтвердим его в течение 24 часов.\n\nПроверьте электронную почту.',
      tr: '"{car}" rezervasyonu için teşekkürler!\n\nTalebinizi aldık ve 24 saat içinde onaylayacağız.\n\nDetaylar için e-postanızı kontrol edin.',
      ar: 'شكرًا لحجز "{car}"!\n\nلقد تلقينا طلبك وسنؤكد الحجز خلال 24 ساعة.\n\nتحقق من بريدك الإلكتروني للتفاصيل.',
      he: 'תודה על הזמנת "{car}"!\n\nקיבלנו את בקשתכם ונאשר תוך 24 שעות.\n\nבדקו את המייל לפרטים.',
      uk: 'Дякуємо за бронювання «{car}»!\n\nМи отримали ваш запит і підтвердимо його протягом 24 годин.\n\nПеревірте свою електронну пошту.'
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
    /* ---- Tour detail: What's Included items ---- */
    inc_guide: {
      ka: 'გამოცდილი ადგილობრივი გიდი', en: 'Expert local guide', ru: 'Опытный местный гид',
      tr: 'Uzman yerel rehber', ar: 'مرشد محلي خبير', he: 'מדריך מקומי מנוסה',
      uk: 'Досвідчений місцевий гід'
    },
    inc_tickets: {
      ka: 'ყველა შესასვლელი ბილეთი', en: 'All entrance fees', ru: 'Все входные билеты',
      tr: 'Tüm giriş ücretleri', ar: 'جميع رسوم الدخول', he: 'כל דמי הכניסה',
      uk: 'Усі вхідні квитки'
    },
    inc_pickup: {
      ka: 'სასტუმროდან გაყვანა და დაბრუნება', en: 'Hotel pickup & drop-off', ru: 'Трансфер из отеля и обратно',
      tr: 'Otelden alış ve bırakış', ar: 'الاستقبال من الفندق والتوصيل', he: 'איסוף והחזרה מהמלון',
      uk: 'Трансфер з готелю та назад'
    },
    inc_food: {
      ka: 'სრული კვება', en: 'Full board meals', ru: 'Полный пансион',
      tr: 'Tam pansiyon yemekler', ar: 'وجبات كاملة', he: 'ארוחות פנסיון מלא',
      uk: 'Повний пансіон'
    },
    inc_hotel: {
      ka: 'განთავსება', en: 'Accommodation', ru: 'Проживание',
      tr: 'Konaklama', ar: 'الإقامة', he: 'לינה',
      uk: 'Проживання'
    },
    inc_water: {
      ka: 'წყალი და სნექები', en: 'Water and snacks', ru: 'Вода и закуски',
      tr: 'Su ve atıştırmalıklar', ar: 'ماء ووجبات خفيفة', he: 'מים וחטיפים',
      uk: 'Вода та снеки'
    },
    inc_insurance: {
      ka: 'სამოგზაურო დაზღვევა', en: 'Travel insurance', ru: 'Туристическая страховка',
      tr: 'Seyahat sigortası', ar: 'تأمين السفر', he: 'ביטוח נסיעות',
      uk: 'Туристична страховка'
    },
    inc_emergency: {
      ka: 'გადაუდებელი დახმარება 24/7', en: 'Emergency support 24/7', ru: 'Экстренная поддержка 24/7',
      tr: 'Acil destek 7/24', ar: 'دعم طوارئ 24/7', he: 'תמיכת חירום 24/7',
      uk: 'Екстрена підтримка 24/7'
    },

    /* ---- Tour detail: Itinerary ---- */
    day_label: {
      ka: 'დღე {n}', en: 'Day {n}', ru: 'День {n}',
      tr: '{n}. Gün', ar: 'اليوم {n}', he: 'יום {n}',
      uk: 'День {n}'
    },
    itinerary_day_desc: {
      ka: 'აქტივობები და მთავარი მომენტები თქვენი ტურის "{tour}" {n}-ე დღისთვის.',
      en: 'Activities and highlights for Day {n} of your {tour} tour.',
      ru: 'Мероприятия и основные моменты {n}-го дня вашего тура "{tour}".',
      tr: '{tour} turunuzun {n}. günü için etkinlikler ve öne çıkanlar.',
      ar: 'الأنشطة والمعالم البارزة لليوم {n} من جولة {tour}.',
      he: 'פעילויות ועיקרים ליום {n} של סיור {tour} שלכם.',
      uk: 'Заходи та основні моменти {n}-го дня вашого туру «{tour}».'
    },
    itinerary_includes_label: {
      ka: 'მოიცავს:', en: 'Includes:', ru: 'Включает:',
      tr: 'İçerir:', ar: 'يتضمن:', he: 'כולל:',
      uk: 'Включає:'
    },
    itinerary_includes_detail: {
      ka: 'გიდიანი ტურები, ადგილობრივი კვება, გადაადგილება ლოკაციებს შორის.',
      en: 'Guided tours, local meals, transportation between locations.',
      ru: 'Экскурсии с гидом, местная кухня, трансфер между локациями.',
      tr: 'Rehberli turlar, yerel yemekler, lokasyonlar arası ulaşım.',
      ar: 'جولات مع مرشد، وجبات محلية، نقل بين المواقع.',
      he: 'סיורים מודרכים, ארוחות מקומיות, תחבורה בין המיקומים.',
      uk: 'Екскурсії з гідом, місцева кухня, трансфер між локаціями.'
    },

    /* ---- Tour detail: Type badges ---- */
    domestic_tour_badge: {
      ka: '🏔️ შიდა ტური', en: '🏔️ Domestic Tour', ru: '🏔️ Внутренний тур',
      tr: '🏔️ Yurt İçi Tur', ar: '🏔️ جولة داخلية', he: '🏔️ סיור מקומי',
      uk: '🏔️ Внутрішній тур'
    },
    international_tour_badge: {
      ka: '✈️ საერთაშორისო ტური', en: '✈️ International Tour', ru: '✈️ Международный тур',
      tr: '✈️ Uluslararası Tur', ar: '✈️ جولة دولية', he: '✈️ סיור בינלאומי',
      uk: '✈️ Міжнародний тур'
    },

    /* ---- Tour detail: Booking confirmation alert ---- */
    booking_success_alert: {
      ka: 'გმადლობთ ტურის "{tour}" დაჯავშნისთვის!\n\nჩვენ მივიღეთ თქვენი მოთხოვნა და დავადასტურებთ 24 საათის განმავლობაში.\n\nშეამოწმეთ თქვენი WhatsApp ან Telegram თქვენს მოცემულ ნომერზე.',
      en: 'Thank you for booking "{tour}"!\n\nWe\'ve received your request and will confirm within 24 hours.\n\nCheck your WhatsApp or Telegram on the number you provided.',
      ru: 'Спасибо, что забронировали тур "{tour}"!\n\nМы получили ваш запрос и подтвердим его в течение 24 часов.\n\nПроверьте WhatsApp или Telegram на указанном номере.',
      tr: '"{tour}" turunu rezerve ettiğiniz için teşekkürler!\n\nİsteğinizi aldık ve 24 saat içinde onaylayacağız.\n\nBelirttiğiniz numaradaki WhatsApp veya Telegram\'ı kontrol edin.',
      ar: 'شكرًا لحجز جولة "{tour}"!\n\nلقد تلقينا طلبك وسنؤكد الحجز خلال 24 ساعة.\n\nتحقق من WhatsApp أو Telegram على الرقم الذي أدخلته.',
      he: 'תודה על הזמנת הסיור "{tour}"!\n\nקיבלנו את הבקשה שלכם ונאשר תוך 24 שעות.\n\nבדקו את WhatsApp או Telegram במספר שנמסר.',
      uk: 'Дякуємо за бронювання туру «{tour}»!\n\nМи отримали ваш запит і підтвердимо його протягом 24 годин.\n\nПеревірте WhatsApp або Telegram на вказаному номері.'
    },
    booking_whatsapp_warning: {
      ka: '📱 მნიშვნელოვანი ინფორმაცია\n\nდარწმუნდით, რომ თქვენს მოცემულ ტელეფონის ნომერზე გაქვთ WhatsApp ან Telegram დაინსტალირებული.\n\nჯავშნის დადასტურების შემთხვევაში ამ არხებით დაგიკავშირდებით.',
      en: '📱 Important Information\n\nPlease make sure your provided phone number has WhatsApp or Telegram installed.\n\nWe will contact you through these channels to confirm your booking.',
      ru: '📱 Важная информация\n\nПожалуйста, убедитесь, что на указанном номере телефона установлен WhatsApp или Telegram.\n\nМы свяжемся с вами через эти каналы для подтверждения бронирования.',
      tr: '📱 Önemli Bilgi\n\nLütfen verdiğiniz telefon numarasında WhatsApp veya Telegram yüklü olduğundan emin olun.\n\nRezervasyon onayı için bu kanallar üzerinden sizinle iletişime geçeceğiz.',
      ar: '📱 معلومات مهمة\n\nيرجى التأكد من أن رقم هاتفك المُدخل به WhatsApp أو Telegram مثبتًا.\n\nسنتصل بك عبر هذه القنوات لتأكيد الحجز.',
      he: '📱 מידע חשוב\n\nאנא ודאו שמספר הטלפון שמסרתם מותקן עליו WhatsApp או Telegram.\n\nניצור אתכם קשר דרך ערוצים אלה לאישור ההזמנה.',
      uk: '📱 Важлива інформація\n\nБудь ласка, переконайтеся, що на вашому номері телефону встановлено WhatsApp або Telegram.\n\nМи зв\'яжемося з вами через ці канали для підтвердження бронювання.'
    },
    booking_confirm_btn: {
      ka: 'გაგზავნა', en: 'Send Request', ru: 'Отправить', tr: 'Gönder',
      ar: 'إرسال', he: 'שלח', uk: 'Надіслати'
    },
    booking_cancel_btn: {
      ka: 'გაუქმება', en: 'Cancel', ru: 'Отмена', tr: 'İptal',
      ar: 'إلغاء', he: 'ביטול', uk: 'Скасувати'
    },
    booking_success_title: {
      ka: 'გმადლობთ ჯავშნისთვის!', en: 'Thank You for Booking!', ru: 'Спасибо за бронирование!',
      tr: 'Rezervasyon için Teşekkürler!', ar: 'شكرًا على الحجز!', he: 'תודה על ההזמנה!',
      uk: 'Дякуємо за бронювання!'
    },
    booking_success_body: {
      ka: 'მივიღეთ თქვენი მოთხოვნა და დავადასტურებთ <strong>24 საათის განმავლობაში</strong>. შეამოწმეთ <strong>WhatsApp</strong> ან <strong>Telegram</strong> თქვენს მოცემულ ნომერზე.',
      en: 'We\'ve received your request and will confirm within <strong>24 hours</strong>. Check your <strong>WhatsApp</strong> or <strong>Telegram</strong> on the number you provided.',
      ru: 'Мы получили ваш запрос и подтвердим в течение <strong>24 часов</strong>. Проверьте <strong>WhatsApp</strong> или <strong>Telegram</strong> на указанном номере.',
      tr: 'İsteğinizi aldık ve <strong>24 saat</strong> içinde onaylayacağız. Verdiğiniz numaradaki <strong>WhatsApp</strong> veya <strong>Telegram</strong>\'ı kontrol edin.',
      ar: 'تلقينا طلبك وسنؤكده خلال <strong>24 ساعة</strong>. تحقق من <strong>WhatsApp</strong> أو <strong>Telegram</strong> على رقمك.',
      he: 'קיבלנו את בקשתכם ונאשר תוך <strong>24 שעות</strong>. בדקו את <strong>WhatsApp</strong> או <strong>Telegram</strong> במספר שמסרתם.',
      uk: 'Ми отримали ваш запит і підтвердимо протягом <strong>24 годин</strong>. Перевірте <strong>WhatsApp</strong> або <strong>Telegram</strong> на вказаному номері.'
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
    },
    loading_saved_tours: {
      ka: 'შენახული ტურები იტვირთება...',
      en: 'Loading your saved tours...',
      ru: 'Загрузка ваших сохранённых туров...',
      tr: 'Kaydedilen turlarınız yükleniyor...',
      ar: 'جاري تحميل جولاتك المحفوظة...',
      he: 'טוען את הסיורים השמורים שלך...',
      uk: 'Завантаження ваших збережених турів...'
    },
    error_loading_tours: {
      ka: 'შეცდომა ტურების ჩატვირთვისას.',
      en: 'Error loading tours.',
      ru: 'Ошибка при загрузке туров.',
      tr: 'Turlar yüklenirken hata oluştu.',
      ar: 'خطأ في تحميل الجولات.',
      he: 'שגיאה בטעינת סיורים.',
      uk: 'Помилка під час завантаження турів.'
    },
    email_password: {
      ka: 'ელფოსტა/პაროლი', en: 'Email/Password', ru: 'Email/Пароль', tr: 'E-posta/Şifre',
      ar: 'البريد الإلكتروني/كلمة المرور', he: 'אימייל/סיסמה', uk: 'Email/Пароль'
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
    'This Season\'s Best Deal': { ka: 'ბათუმის ტურები', ru: 'Лучшее предложение сезона', tr: 'Sezonun En İyi Teklifi', ar: 'أفضل عرض لهذا الموسم', he: 'המבצע הטוב ביותר של העונה', uk: 'Найкраща пропозиცია сезону' },
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

    /* --- Saved Tours & Profile --- */
    'Saved Tours': { ka: 'შენახული ტურები', ru: 'Сохранённые туры', tr: 'Kaydedilen Turlar', ar: 'الجولات المحفوظة', he: 'סיורים שמורים', uk: 'Збережені тури' },
    'Your favorite destinations and tours': { ka: 'თქვენი რჩეული მიმართულებები და ტურები', ru: 'Ваши любимые направления и туры', tr: 'Favori destinasyonlarınız ve turlarınız', ar: 'وجهاتك وجولاتك المفضلة', he: 'היעדים והסיורים המועדפים עליך', uk: 'Ваші улюблені напрямки та тури' },
    'No Saved Tours Yet': { ka: 'შენახული ტურები ჯერ არ გაქვთ', ru: 'Сохранённых туров пока нет', tr: 'Henüz kaydedilmiş tur yok', ar: 'لا توجد جولات محفوظة بعد', he: 'עדיין אין סיורים שמורים', uk: 'Збережених турів поки немає' },
    'Start exploring and save your favorite tours for later!': { ka: 'დაიწყეთ დათვალიერება და შეინახეთ თქვენი საყვარელი ტურები მოგვიანებით!', ru: 'Начните исследовать и сохраняйте любимые туры на потом!', tr: 'Keşfetmeye başlayın ve en sevdiğiniz turları sonrası için kaydedin!', ar: 'ابدأ الاستكشاف واحفظ جولاتك المفضلة لوقت لاحق!', he: 'התחילו לחקור ושמרו את הסיורים האהובים עליכם להמשך!', uk: 'Почніть досліджувати та зберігайте улюблені тури на потім!' },
    'Please Sign In': { ka: 'გთხოვთ გაიაროთ ავტორიზაცია', ru: 'Пожалуйста, войдите', tr: 'Lütfen Giriş Yapın', ar: 'يرجى تسجيل الدخول', he: 'אנא התחבר', uk: 'Будь ласка, увійдіть' },
    'You need to be logged in to view your saved tours.': { ka: 'თქვენი შენახული ტურების სანახავად საჭიროა სისტემაში შესვლა.', ru: 'Вам нужно войти, чтобы просмотреть сохранённые туры.', tr: 'Kaydedilen turlarınızı görüntülemek için giriş yapmalısınız.', ar: 'يجب عليك تسجيل الدخول لعرض جولاتك المحفوظة.', he: 'עליך להיות מחובר כדי לצפות בסיורים השמורים שלך.', uk: 'Вам потрібно увійти, щоб переглянути збережені тури.' },
    'You need to be logged in to view your profile.': { ka: 'თქვენი პროფილის სანახავად საჭიროა სისტემაში შესვლა.', ru: 'Вам нужно войти, чтобы просмотреть свой профиль.', tr: 'Profilinizi görüntülemek için giriş yapmalısınız.', ar: 'يجب عليك تسجيل الدخول لعرض ملفك الشخصي.', he: 'עליך להיות מחובר כדי לצפות בפרופיל שלך.', uk: 'Вам потрібно увійти, щоб переглянути свій профіль.' },
    'Verified Member': { ka: 'დადასტურებული მომხმარებელი', ru: 'Подтверждённый участник', tr: 'Doğrulanmış Üye', ar: 'عضو موثق', he: 'חבר מאומת', uk: 'Верифікований учасник' },
    'Account Information': { ka: 'ანგარიშის ინფორმაცია', ru: 'Информация об аккаунте', tr: 'Hesap Bilgileri', ar: 'معلومات الحساب', he: 'פרטי חשבון', uk: 'Інформація про акаунт' },
    'Full Name': { ka: 'სახელი და გვარი', ru: 'Полное имя', tr: 'Ad Soyad', ar: 'الاسم الكامل', he: 'שם מלא', uk: 'Повне ім\'я' },
    'Email Address': { ka: 'იმეილის მისამართი', ru: 'Адрес эл. почты', tr: 'E-posta Adresi', ar: 'عنوان البريد الإلكتروني', he: 'כתובת איმייל', uk: 'Адреса e-mail' },
    'Member Since': { ka: 'წევრია', ru: 'Участник с', tr: 'Üyelik Tarihi', ar: 'عضو منذ', he: 'חבר מאז', uk: 'Учасник з' },
    'Sign-in Method': { ka: 'შესვლის მეთოდი', ru: 'Способ входа', tr: 'Giriş Yöntemi', ar: 'طريقة الدخول', he: 'שיטת התחברות', uk: 'Спосіб входу' },
    'Your Activity': { ka: 'თქვენი აქტივობა', ru: 'Ваша активность', tr: 'Aktiviteniz', ar: 'نشاطك', he: 'הפעילות שלך', uk: 'Ваша активність' },
    'Bookings': { ka: 'ჯავშნები', ru: 'Бронирования', tr: 'Rezervasyonlar', ar: 'الحجوزات', he: 'הזמנות', uk: 'Бронювання' },
    'Reviews': { ka: 'შეფასებები', ru: 'Отзывы', tr: 'Yorumlar', ar: 'آراء العملاء', he: 'המלצות', uk: 'Відгуки' },
    'View Saved Tours': { ka: 'შენახული ტურების ნახვა', ru: 'Посмотреть сохранённые туры', tr: 'Kaydedilen Turları Görüntüle', ar: 'عرض الجولات المحفوظة', he: 'צפה בסיורים שמורים', uk: 'Переглянути збережені тури' },
    'Sign Out': { ka: 'გამოსვლა', ru: 'Выйти', tr: 'Çıkış Yap', ar: 'تسجيل الخروج', he: 'התנתקות', uk: 'Вийти' },
    'Browse Tours': { ka: 'ტურების დათვალიერება', ru: 'Посмотреть туры', tr: 'Turlara Göz At', ar: 'تصفح الجولات', he: 'עיין בסיורים', uk: 'Переглянути тури' },

    /* --- Map locations (structured as name – description) --- */
    'Tbilisi – Capital City': { ka: 'თბილისი – დედაქალაქი', ru: 'Тбилиси – Столица', tr: 'Tiflis – Başkent', ar: 'تبليسي – العاصمة', he: 'טביליסי – עיר הבירה', uk: 'Тбілісі – столиця' },
    'Kazbegi – Caucasus Mountains': { ka: 'ყაზბეგი – კავკასიონის მთები', ru: 'Казбеги – Кавказские горы', tr: 'Kazbegi – Kafkas Dağları', ar: 'كازبيغي – جبال القوقاز', he: 'קזבגי – הרי הקווקז', uk: 'Казбегі – Кавказькі гори' },
    'Kakheti – Wine Region': { ka: 'კახეთი – ღვინის რეგიონი', ru: 'Кахетия – Винный регион', tr: 'Kaheti – Şarap Bölgesi', ar: 'كاخيتي – منطقة النبيذ', he: 'קחתי – אזור היין', uk: 'Кахетія – винний регіон' },
    'Batumi – Black Sea Coast': { ka: 'ბათუმი – შავი ზღვის სანაპირო', ru: 'Батуми – Побережье Чёрного моря', tr: 'Batum – Karadeniz Kıyısı', ar: 'باتومي – ساحل البحر الأسود', he: 'בטומי – חוף הים השחור', uk: 'Батумі – узбережжя Чорного моря' },
    'Svaneti – Ancient Highlands': { ka: 'სვანეთი – უძველესი მთიანეთი', ru: 'Сванетия – Древнее высокогорье', tr: 'Svaneti – Kadim Dağlık Bölge', ar: 'سفانيتي – المرتفعات القديمة', he: 'סוואנטי – רמות עתיקות', uk: 'Сванетія – давні високогір\'я' },

    /* --- Footer --- */
    'The best choice for a special journey.': {
      ka: 'საუკეთესო არჩევანი განსაკუთრებული მოგზაურობისთვის.',
      ru: 'Лучший выбор для особенного путешествия.',
      tr: 'Ozel bir yolculuk icin en iyi secim.',
      ar: 'أفضل خيار لرحلة استثنائية.',
      he: 'הבחירה הטובה ביותר למסע מיוחד.',
      uk: 'Найкращий вибір для особливої подорожі.'
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
    'Legal': { ka: 'იურიდიული ინფორმაცია', ru: 'Юридическая информация', tr: 'Yasal Bilgiler', ar: 'معلومات قانونية', he: 'מידע משפטי', uk: 'Юридична інформація' },
    'Last updated: April 22, 2026': { ka: 'ბოლო განახლება: 22 აპრილი, 2026', ru: 'Последнее обновление: 22 апреля 2026', tr: 'Son guncelleme: 22 Nisan 2026', ar: 'آخر تحديث: 22 أبريل 2026', he: 'עדכון אחרון: 22 באפריל 2026', uk: 'Останнє оновлення: 22 квітня 2026' },
    'Your privacy matters to us. This policy explains what data we collect, how we use it, and your rights when using Georgia Trips.': {
      ka: 'თქვენი კონფიდენციალურობა ჩვენთვის მნიშვნელოვანია. ეს პოლიტიკა განმარტავს, რა მონაცემებს ვაგროვებთ, როგორ ვიყენებთ მათ და რა უფლებები გაქვთ Georgia Trips-ის გამოყენებისას.',
      ru: 'Ваша конфиденциальность важна для нас. Эта политика объясняет, какие данные мы собираем, как их используем и какие у вас права при использовании Georgia Trips.',
      tr: 'Gizliliginiz bizim icin onemlidir. Bu politika, hangi verileri topladigimizi, bunlari nasil kullandigimizi ve Georgia Trips kullanirken haklarinizi aciklar.',
      ar: 'خصوصيتك مهمة بالنسبة لنا. توضح هذه السياسة البيانات التي نجمعها وكيف نستخدمها وما هي حقوقك عند استخدام Georgia Trips.',
      he: 'הפרטיות שלכם חשובה לנו. מדיניות זו מסבירה אילו נתונים אנו אוספים, כיצד אנו משתמשים בהם ומהן הזכויות שלכם בעת השימוש ב-Georgia Trips.',
      uk: 'Ваша конфіденційність важлива для нас. Ця політика пояснює, які дані ми збираємо, як використовуємо їх і які права ви маєте під час користування Georgia Trips.'
    },
    'Information We Collect': { ka: 'რა ინფორმაციას ვაგროვებთ', ru: 'Какие данные мы собираем', tr: 'Topladigimiz Bilgiler', ar: 'المعلومات التي نجمعها', he: 'איזה מידע אנו אוספים', uk: 'Яку інформацію ми збираємо' },
    'We may collect your name, email address, phone number, booking details, and messages you send us.': {
      ka: 'შეიძლება შევაგროვოთ თქვენი სახელი, ელფოსტის მისამართი, ტელეფონის ნომერი, ჯავშნის დეტალები და შეტყობინებები, რომელსაც გვიგზავნით.',
      ru: 'Мы можем собирать ваше имя, адрес электронной почты, номер телефона, детали бронирования и сообщения, которые вы нам отправляете.',
      tr: 'Adinizi, e-posta adresinizi, telefon numaranizi, rezervasyon detaylarini ve bize gonderdiginiz mesajlari toplayabiliriz.',
      ar: 'قد نجمع اسمك وعنوان بريدك الإلكتروني ورقم هاتفك وتفاصيل الحجز والرسائل التي ترسلها إلينا.',
      he: 'אנו עשויים לאסוף את שמכם, כתובת האימייל, מספר הטלפון, פרטי ההזמנה והודעות שאתם שולחים לנו.',
      uk: 'Ми можемо збирати ваше ім’я, адресу електронної пошти, номер телефону, деталі бронювання та повідомлення, які ви нам надсилаєте.'
    },
    'How We Use Your Information': { ka: 'როგორ ვიყენებთ თქვენს ინფორმაციას', ru: 'Как мы используем ваши данные', tr: 'Bilgilerinizi Nasil Kullaniyoruz', ar: 'كيف نستخدم معلوماتك', he: 'כיצד אנו משתמשים במידע שלכם', uk: 'Як ми використовуємо вашу інформацію' },
    'We use your information to confirm bookings, provide support, improve services, and send important travel updates.': {
      ka: 'თქვენს ინფორმაციას ვიყენებთ ჯავშნების დასადასტურებლად, მხარდაჭერისთვის, სერვისების გაუმჯობესებისთვის და მნიშვნელოვანი სამოგზაურო განახლებების გასაგზავნად.',
      ru: 'Мы используем ваши данные для подтверждения бронирований, предоставления поддержки, улучшения сервиса и отправки важных обновлений о поездке.',
      tr: 'Bilgilerinizi rezervasyonlari onaylamak, destek saglamak, hizmetleri gelistirmek ve onemli seyahat guncellemelerini gondermek icin kullaniriz.',
      ar: 'نستخدم معلوماتك لتأكيد الحجوزات وتقديم الدعم وتحسين الخدمات وإرسال تحديثات سفر مهمة.',
      he: 'אנו משתמשים במידע שלכם כדי לאשר הזמנות, לספק תמיכה, לשפר שירותים ולשלוח עדכוני נסיעה חשובים.',
      uk: 'Ми використовуємо вашу інформацію для підтвердження бронювань, надання підтримки, покращення сервісів і надсилання важливих оновлень подорожі.'
    },
    'Data Sharing': { ka: 'მონაცემების გაზიარება', ru: 'Передача данных', tr: 'Veri Paylasimi', ar: 'مشاركة البيانات', he: 'שיתוף נתונים', uk: 'Передача даних' },
    'We do not sell your personal data. We may share limited information with trusted partners only when necessary to deliver services.': {
      ka: 'ჩვენ არ ვყიდით თქვენს პერსონალურ მონაცემებს. შეზღუდულ ინფორმაციას შეიძლება გავუზიაროთ მხოლოდ სანდო პარტნიორებს, როცა ეს აუცილებელია სერვისის მიწოდებისთვის.',
      ru: 'Мы не продаем ваши персональные данные. Ограниченная информация может передаваться только надежным партнерам, когда это необходимо для предоставления услуг.',
      tr: 'Kisisel verilerinizi satmayiz. Hizmet sunumu icin gerekli oldugunda, yalnizca guvenilir partnerlerle sinirli bilgi paylasabiliriz.',
      ar: 'نحن لا نبيع بياناتك الشخصية. قد نشارك معلومات محدودة مع شركاء موثوقين فقط عند الضرورة لتقديم الخدمة.',
      he: 'איננו מוכרים את הנתונים האישיים שלכם. אנו עשויים לשתף מידע מוגבל עם שותפים מהימנים רק כאשר הדבר נדרש למתן השירות.',
      uk: 'Ми не продаємо ваші персональні дані. Ми можемо ділитися обмеженою інформацією лише з надійними партнерами, коли це потрібно для надання послуг.'
    },
    'Data Security': { ka: 'მონაცემების უსაფრთხოება', ru: 'Безопасность данных', tr: 'Veri Guvenligi', ar: 'أمان البيانات', he: 'אבטחת מידע', uk: 'Безпека даних' },
    'We apply reasonable technical and organizational safeguards to protect your information.': {
      ka: 'თქვენი ინფორმაციის დასაცავად ვიყენებთ გონივრულ ტექნიკურ და ორგანიზაციულ უსაფრთხოების ზომებს.',
      ru: 'Для защиты вашей информации мы применяем разумные технические и организационные меры безопасности.',
      tr: 'Bilgilerinizi korumak icin makul teknik ve organizasyonel guvenlik onlemleri uygulariz.',
      ar: 'نطبق تدابير تقنية وتنظيمية معقولة لحماية معلوماتك.',
      he: 'אנו מיישמים אמצעי אבטחה טכניים וארגוניים סבירים כדי להגן על המידע שלכם.',
      uk: 'Ми застосовуємо розумні технічні та організаційні заходи безпеки для захисту вашої інформації.'
    },
    'Your Rights': { ka: 'თქვენი უფლებები', ru: 'Ваши права', tr: 'Haklariniz', ar: 'حقوقك', he: 'הזכויות שלכם', uk: 'Ваші права' },
    'You can request access, correction, or deletion of your personal data by contacting us.': {
      ka: 'შეგიძლიათ მოგვმართოთ და მოითხოვოთ თქვენს პერსონალურ მონაცემებზე წვდომა, შესწორება ან წაშლა.',
      ru: 'Вы можете запросить доступ, исправление или удаление ваших персональных данных, связавшись с нами.',
      tr: 'Bizimle iletisime gecerek kisisel verilerinize erisim, duzeltme veya silme talep edebilirsiniz.',
      ar: 'يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها عبر التواصل معنا.',
      he: 'באפשרותכם לבקש גישה, תיקון או מחיקה של הנתונים האישיים שלכם באמצעות יצירת קשר איתנו.',
      uk: 'Ви можете звернутися до нас із запитом на доступ, виправлення або видалення ваших персональних даних.'
    },
    'Contact for Privacy Questions': { ka: 'კონფიდენციალურობასთან დაკავშირებული კითხვების კონტაქტი', ru: 'Контакт по вопросам конфиденциальности', tr: 'Gizlilik Sorulari Icin Iletisim', ar: 'التواصل لاستفسارات الخصوصية', he: 'יצירת קשר לשאלות פרטיות', uk: 'Контакт для питань конфіденційності' },
    'For privacy-related requests, please contact us at georgiatrips5@gmail.com.': {
      ka: 'კონფიდენციალურობასთან დაკავშირებული მოთხოვნებისთვის დაგვიკავშირდით: georgiatrips5@gmail.com.',
      ru: 'По вопросам конфиденциальности свяжитесь с нами: georgiatrips5@gmail.com.',
      tr: 'Gizlilikle ilgili talepler icin lutfen bizimle iletisime gecin: georgiatrips5@gmail.com.',
      ar: 'لأي طلبات متعلقة بالخصوصية، يرجى التواصل معنا عبر: georgiatrips5@gmail.com.',
      he: 'לבקשות הקשורות לפרטיות, אנא צרו איתנו קשר בכתובת: georgiatrips5@gmail.com.',
      uk: 'З питань конфіденційності звертайтеся до нас: georgiatrips5@gmail.com.'
    },
    'Terms & Conditions': { ka: 'წესები და პირობები', ru: 'Условия и положения', tr: 'Kullanim Sartlari', ar: 'الشروط والأحكام', he: 'תנאים והגבלות', uk: 'Умови та положення' },
    'These terms govern your use of our website and travel services. By using our services, you agree to these terms.': {
      ka: 'ეს პირობები არეგულირებს ჩვენი ვებსაიტისა და სამოგზაურო სერვისების გამოყენებას. ჩვენი სერვისების გამოყენებით ეთანხმებით ამ პირობებს.',
      ru: 'Эти условия регулируют использование нашего сайта и туристических услуг. Используя наши услуги, вы соглашаетесь с этими условиями.',
      tr: 'Bu sartlar, web sitemizi ve seyahat hizmetlerimizi kullaniminizi duzenler. Hizmetlerimizi kullanarak bu sartlari kabul etmis olursunuz.',
      ar: 'تنظم هذه الشروط استخدامك لموقعنا الإلكتروني وخدمات السفر الخاصة بنا. باستخدام خدماتنا، فإنك توافق على هذه الشروط.',
      he: 'תנאים אלה מסדירים את השימוש באתר ובשירותי הנסיעות שלנו. בשימוש בשירותים שלנו אתם מסכימים לתנאים אלה.',
      uk: 'Ці умови регулюють використання нашого сайту та туристичних послуг. Користуючись нашими послугами, ви погоджуєтеся з цими умовами.'
    },
    'Bookings and Payments': { ka: 'ჯავშნები და გადახდები', ru: 'Бронирования и оплата', tr: 'Rezervasyon ve Odeme', ar: 'الحجوزات والمدفوعات', he: 'הזמנות ותשלומים', uk: 'Бронювання та оплата' },
    'Bookings are confirmed after payment or written confirmation, depending on the service.': {
      ka: 'ჯავშანი დადასტურდება გადახდის შემდეგ ან წერილობითი დადასტურებით, სერვისის ტიპის მიხედვით.',
      ru: 'Бронирование подтверждается после оплаты или письменного подтверждения в зависимости от услуги.',
      tr: 'Rezervasyonlar, hizmet turune bagli olarak odeme veya yazili onay sonrasinda kesinlesir.',
      ar: 'يتم تأكيد الحجوزات بعد الدفع أو عبر تأكيد كتابي حسب نوع الخدمة.',
      he: 'הזמנות מאושרות לאחר תשלום או אישור בכתב, בהתאם לסוג השירות.',
      uk: 'Бронювання підтверджується після оплати або письмового підтвердження залежно від послуги.'
    },
    'Cancellations and Changes': { ka: 'გაუქმება და ცვლილებები', ru: 'Отмена и изменения', tr: 'Iptal ve Degisiklikler', ar: 'الإلغاءات والتعديلات', he: 'ביטולים ושינויים', uk: 'Скасування та зміни' },
    'Cancellation rules may vary by tour or vehicle. We will clearly share the applicable conditions before confirmation.': {
      ka: 'გაუქმების წესები შეიძლება განსხვავდებოდეს ტურის ან ტრანსპორტის მიხედვით. დადასტურებამდე მკაფიოდ გაგაცნობთ შესაბამის პირობებს.',
      ru: 'Правила отмены могут отличаться в зависимости от тура или транспорта. Мы заранее четко сообщим применимые условия.',
      tr: 'Iptal kurallari tur veya araca gore degisebilir. Onaydan once gecerli kosullari acikca paylasacagiz.',
      ar: 'قد تختلف قواعد الإلغاء حسب الجولة أو المركبة. سنوضح لك الشروط المطبقة بوضوح قبل التأكيد.',
      he: 'כללי הביטול עשויים להשתנות לפי סוג הטיול או הרכב. לפני אישור נשתף את התנאים הרלוונטיים בצורה ברורה.',
      uk: 'Правила скасування можуть відрізнятися залежно від туру чи транспорту. Перед підтвердженням ми чітко повідомимо чинні умови.'
    },
    'Traveler Responsibilities': { ka: 'მოგზაურის პასუხისმგებლობები', ru: 'Обязанности путешественника', tr: 'Yolcu Sorumluluklari', ar: 'مسؤوليات المسافر', he: 'אחריות המטייל', uk: 'Обов’язки мандрівника' },
    'Please provide accurate information, arrive on time, and follow safety instructions during trips.': {
      ka: 'გთხოვთ მოგვაწოდოთ ზუსტი ინფორმაცია, დროულად გამოცხადდეთ და მოგზაურობისას დაიცვათ უსაფრთხოების ინსტრუქციები.',
      ru: 'Пожалуйста, предоставляйте точную информацию, приходите вовремя и соблюдайте правила безопасности во время поездок.',
      tr: 'Lutfen dogru bilgi verin, zamaninda gelin ve seyahat sirasinda guvenlik talimatlarina uyun.',
      ar: 'يرجى تقديم معلومات دقيقة والوصول في الوقت المحدد واتباع تعليمات السلامة أثناء الرحلات.',
      he: 'אנא ספקו מידע מדויק, הגיעו בזמן ופעלו לפי הוראות הבטיחות במהלך הנסיעות.',
      uk: 'Будь ласка, надавайте точну інформацію, прибувайте вчасно та дотримуйтеся інструкцій безпеки під час подорожей.'
    },
    'Liability': { ka: 'პასუხისმგებლობა', ru: 'Ответственность', tr: 'Sorumluluk', ar: 'المسؤولية', he: 'אחריות', uk: 'Відповідальність' },
    'We are not responsible for delays or losses caused by weather, road conditions, or third-party providers.': {
      ka: 'ჩვენ არ ვართ პასუხისმგებელი ამინდით, გზის პირობებით ან მესამე მხარის პროვაიდერებით გამოწვეულ დაგვიანებებზე ან ზარალზე.',
      ru: 'Мы не несем ответственности за задержки или убытки, вызванные погодой, дорожными условиями или сторонними поставщиками.',
      tr: 'Hava kosullari, yol sartlari veya ucuncu taraf saglayicilardan kaynaklanan gecikme ya da kayiplardan sorumlu degiliz.',
      ar: 'نحن غير مسؤولين عن التأخيرات أو الخسائر الناتجة عن الطقس أو ظروف الطرق أو مزودي الخدمات من الأطراف الثالثة.',
      he: 'איננו אחראים לעיכובים או הפסדים הנגרמים ממזג האוויר, תנאי הדרך או ספקי צד שלישי.',
      uk: 'Ми не несемо відповідальності за затримки або збитки, спричинені погодою, дорожніми умовами чи сторонніми постачальниками.'
    },
    'Updates to Terms': { ka: 'პირობების განახლება', ru: 'Обновления условий', tr: 'Sartlarin Guncellenmesi', ar: 'تحديث الشروط', he: 'עדכוני תנאים', uk: 'Оновлення умов' },
    'We may update these terms from time to time. The latest version will always be available on this page.': {
      ka: 'შესაძლოა ეს პირობები პერიოდულად განვაახლოთ. უახლესი ვერსია ყოველთვის ხელმისაწვდომი იქნება ამ გვერდზე.',
      ru: 'Мы можем периодически обновлять эти условия. Актуальная версия всегда будет доступна на этой странице.',
      tr: 'Bu sartlari zaman zaman guncelleyebiliriz. En guncel surum her zaman bu sayfada mevcut olacaktir.',
      ar: 'قد نقوم بتحديث هذه الشروط من وقت لآخر. سيكون أحدث إصدار متاحًا دائمًا على هذه الصفحة.',
      he: 'ייתכן שנעדכן תנאים אלה מעת לעת. הגרסה העדכנית ביותר תמיד תהיה זמינה בעמוד זה.',
      uk: 'Ми можемо періодично оновлювати ці умови. Найновіша версія завжди буде доступна на цій сторінці.'
    },
    'Contact for Terms Questions': { ka: 'პირობებთან დაკავშირებული კითხვების კონტაქტი', ru: 'Контакт по вопросам условий', tr: 'Sartlarla Ilgili Sorular Icin Iletisim', ar: 'التواصل لاستفسارات الشروط', he: 'יצירת קשר לשאלות על התנאים', uk: 'Контакт для питань щодо умов' },
    'For questions about these terms, contact georgiatrips5@gmail.com.': {
      ka: 'ამ პირობებთან დაკავშირებული კითხვებისთვის დაგვიკავშირდით: georgiatrips5@gmail.com.',
      ru: 'По вопросам об этих условиях свяжитесь с нами: georgiatrips5@gmail.com.',
      tr: 'Bu sartlarla ilgili sorular icin bizimle iletisime gecin: georgiatrips5@gmail.com.',
      ar: 'لأي استفسارات حول هذه الشروط، تواصل معنا عبر: georgiatrips5@gmail.com.',
      he: 'לשאלות לגבי תנאים אלה, צרו איתנו קשר בכתובת: georgiatrips5@gmail.com.',
      uk: 'З питань щодо цих умов звертайтеся: georgiatrips5@gmail.com.'
    },
    'developed by': { ka: 'შემქმნელი —', ru: 'разработано —', tr: 'geliştiren —', ar: 'طوّر بواسطة', he: 'פותח על ידי', uk: 'розроблено —' },

    /* --- Booking modal --- */
    'Tour Name': { ka: 'ტურის დასახელება', ru: 'Название тура', tr: 'Tur Adı', ar: 'اسم الجولة', he: 'שם הסיור', uk: 'Назва туру' },
    'Ready to book this tour? Fill out your details and our team will confirm your reservation within 24 hours.': {
      ka: 'მზად ხართ ტურის დასაჯავშნად? შეავსეთ დეტალები და ჩვენი გუნდი დაადასტურებს ჯავშანს 24 საათში.',
      en: 'Ready to book this tour? Fill out your details and our team will confirm your reservation within 24 hours.',
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
    '← Back to Tours': { ka: '← უკან ტურებზე', ru: '← Назад к турам', tr: '← Turlara Dön', ar: '← العودة إلى الجולات', he: '← חזרה לסיורים', uk: '← Назад до турів' },

    /* --- Tour detail page --- */
    'About This Tour': { ka: 'ამ ტურის შესახებ', ru: 'О туре', tr: 'Bu Tur Hakkında', ar: 'حول هذه الجولة', he: 'אודות הסיור', uk: 'Про цей тур' },
    'Min People': { ka: 'მინ. ადამიანი', ru: 'Мин. человек', tr: 'Min. Kişi', ar: 'الحد الأدنى للأشخاص', he: 'מינ׳ אנשים', uk: 'Мін. осіб' },
    'Max People': { ka: 'მაქს. ადამიანი', ru: 'Макс. человек', tr: 'Maks. Kişi', ar: 'الحد الأقصى للأشخاص', he: 'מקס׳ אנשים', uk: 'Макс. осіб' },
    'per person': { ka: 'ერთ ადამიანზე', ru: 'за человека', tr: 'kişi başı', ar: 'للشخص', he: 'לאדם', uk: 'з людини' },
    'Book This Tour': { ka: 'დაჯავშნე ეს ტური', ru: 'Забронировать тур', tr: 'Bu Turu Rezerve Et', ar: 'احجز هذه الجولة', he: 'הזמן סיור זה', uk: 'Забронювати тур' },

    /* --- Booking card features --- */
    'Online booking': { ka: 'ონლაინ ჯავშნა', ru: 'Онлайн-бронирование', tr: 'Çevrimiçi rezervasyon', ar: 'الحجز عبر الإنترنت', he: 'הזמנה מקוונת', uk: 'Онлайн-бронювання' },
    'Best price guarantee': { ka: 'საუკეთესო ფასის გარანტია', ru: 'Гарантия лучшей цены', tr: 'En iyi fiyat garantisi', ar: 'ضمان أفضل سعر', he: 'הבטחת המחיר הטוב ביותר', uk: 'Гарантія найкращої ціни' },
    'Safe & insured': { ka: 'უსაფრთხო და დაზღვეული', ru: 'Безопасно и застраховано', tr: 'Güvenli ve sigortalı', ar: 'آمن ومؤمَّن', he: 'בטוח ומבוטח', uk: 'Безпечно та застраховано' },
    'Live support available': { ka: 'ცოცხალი მხარდაჭერა ხელმისაწვდომია', ru: 'Живая поддержка доступна', tr: 'Canlı destek mevcut', ar: 'دعم مباشر متاح', he: 'תמיכה חיה זמינה', uk: 'Доступна підтримка онлайн' },
    'Questions?': { ka: 'კითხვები გაქვთ?', ru: 'Вопросы?', tr: 'Sorularınız mı var?', ar: 'هل لديك أسئلة؟', he: 'יש שאלות?', uk: 'Питання?' },
    'Contact us directly for more information': { ka: 'დაგვიკავშირდით პირდაპირ დამატებითი ინფორმაციისთვის', ru: 'Свяжитесь с нами напрямую для получения дополнительной информации', tr: 'Daha fazla bilgi için doğrudan bize ulaşın', ar: 'اتصل بنا مباشرة للمزيد من المعلومات', he: 'צרו קשר ישירות למידע נוסף', uk: 'Зв\'яжіться з нами напряму для отримання додаткової інформації' },
    'Get in Touch': { ka: 'დაგვიკავშირდით', ru: 'Связаться', tr: 'İletişime Geç', ar: 'تواصل معنا', he: 'צרו קשר', uk: 'Зв\'язатися' },

    /* --- Contact page (contact.html) --- */
    'Contact Us': { ka: 'დაგვიკავშირდით', ru: 'Свяжитесь с нами', tr: 'Bize Ulaşın', ar: 'تواصل معنا', he: 'צרו קשר', uk: 'Зв\'яжіться з нами' },
    'Have a question? Ready to book? We\'re here and happy to help plan your perfect Georgian adventure.': {
      ka: 'კითხვა გაქვთ? გსურთ დაჯავშნა? მზად ვართ დაგეხმაროთ თქვენი იდეალური მოგზაურობის დაგეგმვაში.',
      ru: 'Есть вопрос? Хотите забронировать? Мы с радостью поможем спланировать вашу идеальную поездку.',
      tr: 'Sorunuz mu var? Rezervasyon yapmak ister misiniz? Mükemmel seyahatinizi planlamanıza memnuniyetle yardımcı oluruz.',
      ar: 'هل لديك سؤال؟ هل أنت مستعد للحجز؟ نحن هنا وسنساعدك بكل سرور في التخطيط لرحلتك المثالية.',
      he: 'יש לכם שאלה? מוכנים להזמין? אנחנו כאן ונשמח לעזור לתכנן את הטיול המושלם שלכם.',
      uk: 'Є запитання? Готові забронювати? Ми тут і з радістю допоможемо спланувати вашу ідеальну подорож.'
    },
    'We\'d Love to Hear From You': { ka: 'გვიხარია თქვენი შეტყობინება', ru: 'Будем рады вашему сообщению', tr: 'Sizden Haber Almak İsteriz', ar: 'يسعدنا سماع رسالتك', he: 'נשמח לשמוע מכם', uk: 'Будемо раді вашому повідомленню' },
    'Whether you\'re planning a solo journey, a family trip or a school excursion, our team responds within a few hours during business days.': {
      ka: 'გეგმავთ მარტო მოგზაურობას, ოჯახურ დასვენებას თუ სასკოლო ექსკურსიას — სამუშაო დღეებში, ჩვეულებრივ, რამდენიმე საათში გპასუხობთ.',
      ru: 'Планируете одиночную поездку, семейный отдых или школьную экскурсию — в рабочие дни мы обычно отвечаем в течение нескольких часов.',
      tr: 'Tek başına bir gezi, aile tatili ya da okul gezisi planlıyor olun — iş günlerinde genellikle birkaç saat içinde yanıt veririz.',
      ar: 'سواء كنت تخطط لرحلة فردية أو رحلة عائلية أو رحلة مدرسية، فإن فريقنا يرد عادة خلال بضع ساعات في أيام العمل.',
      he: 'בין אם אתם מתכננים טיול לבד, טיול משפחתי או טיול בית-ספר, הצוות שלנו בדרך כלל עונה בתוך כמה שעות בימי עבודה.',
      uk: 'Плануєте подорож наодинці, сімейну поїздку чи шкільну екскурсію — у робочі дні ми зазвичай відповідаємо протягом кількох годин.'
    },
    'Our Office': { ka: 'ჩვენი ოფისი', ru: 'Наш офис', tr: 'Ofisimiz', ar: 'مكتبنا', he: 'המשרד שלנו', uk: 'Наш офіс' },
    'Phone & WhatsApp': { ka: 'ტელეფონი და WhatsApp', ru: 'Телефон и WhatsApp', tr: 'Telefon ve WhatsApp', ar: 'الهاتف وواتساب', he: 'טלפון ו-WhatsApp', uk: 'Телефон і WhatsApp' },
    'Working Hours': { ka: 'სამუშაო საათები', ru: 'Часы работы', tr: 'Çalışma Saatleri', ar: 'ساعات العمل', he: 'שעות עבודה', uk: 'Години роботи' },
    'Monday – Sunday: 10:00 – 19:00': { ka: 'ორშაბათი – კვირა: 10:00 – 19:00', ru: 'Понедельник – Воскресенье: 10:00 – 19:00', tr: 'Pazartesi – Pazar: 10:00 – 19:00', ar: 'الاثنين – الأحد: 10:00 – 19:00', he: 'שני – ראשון: 10:00 – 19:00', uk: 'Понеділок – Неділя: 10:00 – 19:00' },
    '📲 Fastest Response': { ka: '📲 ყველაზე სწრაფი პასუხი', ru: '📲 Самый быстрый ответ', tr: '📲 En Hızlı Yanıt', ar: '📲 أسرع رد', he: '📲 המענה המהיר ביותר', uk: '📲 Найшвидша відповідь' },
    'For urgent bookings or same-day requests, WhatsApp is the fastest way to reach our team. We typically respond within 15 minutes during working hours.': {
      ka: 'თუ გჭირდებათ სასწრაფო დაჯავშნა ან იმავე დღის მოთხოვნა, WhatsApp-ით ყველაზე სწრაფად დაგვიკავშირდებით. სამუშაო საათებში, ჩვეულებრივ, 15 წუთში გპასუხობთ.',
      ru: 'Для срочных бронирований или запросов на тот же день WhatsApp — самый быстрый способ связаться с нами. В рабочие часы обычно отвечаем в течение 15 минут.',
      tr: 'Acil rezervasyonlar veya aynı gün talepler için WhatsApp ekibimize ulaşmanın en hızlı yoludur. Çalışma saatlerinde genellikle 15 dakika içinde yanıt veririz.',
      ar: 'للحجوزات العاجلة أو طلبات اليوم نفسه، يُعد واتساب أسرع طريقة للوصول إلى فريقنا. عادة نرد خلال 15 دقيقة في ساعات العمل.',
      he: 'להזמנות דחופות או בקשות לאותו היום, WhatsApp היא הדרך המהירה ביותר להגיע לצוות שלנו. בדרך כלל אנו עונים בתוך 15 דקות בשעות העבודה.',
      uk: 'Для термінових бронювань або запитів на той самий день WhatsApp — найшвидший спосіб зв’язатися з нами. У робочі години зазвичай відповідаємо протягом 15 хвилин.'
    },
    'Send Us a Message': { ka: 'მოგვწერეთ შეტყობინება', ru: 'Напишите нам', tr: 'Bize Mesaj Gönderin', ar: 'أرسل لنا رسالة', he: 'שלחו לנו הודעה', uk: 'Напишіть нам' },
    'Full Name *': { ka: 'სახელი და გვარი *', ru: 'Имя и фамилия *', tr: 'Ad Soyad *', ar: 'الاسم الكامل *', he: 'שם מלא *', uk: 'Ім’я та прізвище *' },
    'Your full name': { ka: 'თქვენი სახელი და გვარი', ru: 'Ваше полное имя', tr: 'Adınız ve soyadınız', ar: 'اسمك الكامل', he: 'השם המלא שלך', uk: 'Ваше повне ім\'я' },
    'Phone / WhatsApp': { ka: 'ტელეფონი / WhatsApp', ru: 'Телефон / WhatsApp', tr: 'Telefon / WhatsApp', ar: 'الهاتف / واتساب', he: 'טלפון / WhatsApp', uk: 'Телефон / WhatsApp' },
    'Subject': { ka: 'თემა', ru: 'Тема', tr: 'Konu', ar: 'الموضوع', he: 'נושא', uk: 'Тема' },
    'Select a topic…': { ka: 'აირჩიეთ თემა…', ru: 'Выберите тему…', tr: 'Bir konu seçin…', ar: 'اختر موضوعًا…', he: 'בחרו נושא…', uk: 'Оберіть тему…' },
    'Tour Booking': { ka: 'ტურის დაჯავშნა', ru: 'Бронирование тура', tr: 'Tur Rezervasyonu', ar: 'حجز جولة', he: 'הזמנת סיור', uk: 'Бронювання туру' },
    'Transport Inquiry': { ka: 'ტრანსპორტის შეკითხვა', ru: 'Запрос по транспорту', tr: 'Ulaşım Sorgusu', ar: 'استفسار عن النقل', he: 'בירור לגבי תחבורה', uk: 'Запит щодо транспорту' },
    'School Excursion': { ka: 'სასკოლო ექსკურსია', ru: 'Школьная экскурсия', tr: 'Okul Gezisi', ar: 'رحلة مدرسية', he: 'טיול בית-ספר', uk: 'Шкільна екскурсія' },
    'Custom Trip': { ka: 'ინდივიდუალური მოგზაურობა', ru: 'Индивидуальная поездка', tr: 'Özel Gezi', ar: 'رحلة مخصصة', he: 'טיול מותאם אישית', uk: 'Індивідуальна подорож' },
    'General Question': { ka: 'ზოგადი კითხვა', ru: 'Общий вопрос', tr: 'Genel Soru', ar: 'سؤال عام', he: 'שאלה כללית', uk: 'Загальне запитання' },
    'Preferred Travel Dates': { ka: 'სასურველი თარიღები', ru: 'Желаемые даты поездки', tr: 'Tercih Edilen Tarihler', ar: 'تواريخ السفر المفضلة', he: 'תאריכי נסיעה מועדפים', uk: 'Бажані дати подорожі' },
    'e.g. June 10–20, 2025': { ka: 'მაგ. 10–20 ივნისი, 2025', ru: 'напр. 10–20 июня 2025', tr: 'örn. 10–20 Haziran 2025', ar: 'مثال: 10–20 يونيو 2025', he: 'לדוגמה: 10–20 ביוני 2025', uk: 'напр. 10–20 червня 2025' },
    'Number of Travelers': { ka: 'მოგზაურების რაოდენობა', ru: 'Количество путешественников', tr: 'Yolcu Sayısı', ar: 'عدد المسافرين', he: 'מספר מטיילים', uk: 'Кількість мандрівників' },
    'e.g. 4': { ka: 'მაგ. 4', ru: 'напр. 4', tr: 'örn. 4', ar: 'مثال: 4', he: 'לדוגמה 4', uk: 'напр. 4' },
    'Your Message *': { ka: 'თქვენი შეტყობინება *', ru: 'Ваше сообщение *', tr: 'Mesajınız *', ar: 'رسالتك *', he: 'ההודעה שלך *', uk: 'Ваше повідомлення *' },
    'Tell us about your trip idea, questions, or anything else we should know…': {
      ka: 'მოგვწერეთ თქვენი მოგზაურობის იდეის, კითხვების ან სხვა მნიშვნელოვანი დეტალების შესახებ…',
      ru: 'Расскажите о вашей идее поездки, вопросах или любых важных деталях…',
      tr: 'Seyahat fikrinizden, sorularınızdan veya bilmemiz gereken diğer detaylardan bahsedin…',
      ar: 'أخبرنا عن فكرة رحلتك أو أسئلتك أو أي تفاصيل أخرى يجب أن نعرفها…',
      he: 'ספרו לנו על רעיון הטיול, שאלות, או כל דבר נוסף שחשוב שנדע…',
      uk: 'Розкажіть про ідею подорожі, запитання або інші важливі деталі…'
    },
    '✅ Message sent! We\'ll reply to you within 24 hours.': {
      ka: '✅ შეტყობინება გაიგზავნა! 24 საათის განმავლობაში გიპასუხებთ.',
      ru: '✅ Сообщение отправлено! Мы ответим вам в течение 24 часов.',
      tr: '✅ Mesaj gönderildi! 24 saat içinde size dönüş yapacağız.',
      ar: '✅ تم إرسال الرسالة! سنرد عليك خلال 24 ساعة.',
      he: '✅ ההודעה נשלחה! נחזור אליכם בתוך 24 שעות.',
      uk: '✅ Повідомлення надіслано! Ми відповімо протягом 24 годин.'
    },
    'Send Message ✦': { ka: 'გაგზავნა ✦', ru: 'Отправить ✦', tr: 'Gönder ✦', ar: 'إرسال ✦', he: 'שלח ✦', uk: 'Надіслати ✦' },

    /* --- Booking modal --- */
    'Complete Your Booking': { ka: 'დაასრულეთ ჯავშანი', ru: 'Завершите бронирование', tr: 'Rezervasyonunuzu Tamamlayın', ar: 'أكمل حجزك', he: 'השלם את ההזמנה שלך', uk: 'Завершіть бронювання' },
    'Fast Booking': { ka: 'სწრაფი ჯავშანი', ru: 'Быстрое бронирование', tr: 'Hizli Rezervasyon', ar: 'حجز سريع', he: 'הזמנה מהירה', uk: 'Швидке бронювання' },
    'Book Your Dream Trip': { ka: 'დაჯავშნე შენი საოცნებო მოგზაურობა', ru: 'Забронируйте путешествие мечты', tr: 'Hayalindeki Yolculugu Rezerve Et', ar: 'احجز رحلة أحلامك', he: 'הזמינו את טיול החלומות שלכם', uk: 'Забронюйте подорож мрії' },
    'Fill in your details and our team will contact you shortly to confirm every step.': {
      ka: 'შეავსეთ დეტალები და ჩვენი გუნდი მალე დაგიკავშირდებათ, რომ ყველა ეტაპი დაგიდასტუროთ.',
      ru: 'Заполните данные, и наша команда скоро свяжется с вами для подтверждения всех шагов.',
      tr: 'Bilgilerinizi doldurun, ekibimiz tum adimlari onaylamak icin kisa surede sizinle iletisime gececek.',
      ar: 'املأ بياناتك وسيتواصل فريقنا معك قريبًا لتأكيد جميع الخطوات.',
      he: 'מלאו את הפרטים והצוות שלנו ייצור איתכם קשר בקרוב כדי לאשר כל שלב.',
      uk: 'Заповніть дані, і наша команда незабаром зв’яжеться з вами, щоб підтвердити кожен крок.'
    },
    'Full Name *': { ka: 'სახელი და გვარი *', ru: 'Полное имя *', tr: 'Ad Soyad *', ar: 'الاسم الكامل *', he: 'שם מלא *', uk: 'Повне ім\'я *' },
    'Email *': { ka: 'იმეილი *', ru: 'Эл. почта *', tr: 'E-posta *', ar: 'البريد الإلكتروني *', he: 'אימייל *', uk: 'Електронна пошта *' },
    'Email (Optional)': { ka: 'იმეილი (არასავალდებულო)', ru: 'Эл. почта (необязательно)', tr: 'E-posta (Istege Bagli)', ar: 'البريد الإلكتروني (اختياري)', he: 'אימייל (אופציונלי)', uk: 'Електронна пошта (необов’язково)' },
    'Phone Number *': { ka: 'ტელეფონის ნომერი *', ru: 'Номер телефона *', tr: 'Telefon Numarası *', ar: 'رقم الهاتف *', he: 'מספר טלפון *', uk: 'Номер телефону *' },
    'Number of People *': { ka: 'ადამიანების რაოდენობა *', ru: 'Количество человек *', tr: 'Kişi Sayısı *', ar: 'عدد الأشخاص *', he: 'מספר אנשים *', uk: 'Кількість осіб *' },
    'Preferred Date *': { ka: 'სასურველი თარიღი *', ru: 'Желаемая дата *', tr: 'Tercih Edilen Tarih *', ar: 'التاريخ المفضل *', he: 'תאריך מועדף *', uk: 'Бажана дата *' },
    'Special Requests': { ka: 'სპეციალური მოთხოვნები', ru: 'Особые пожелания', tr: 'Özel İstekler', ar: 'طلبات خاصة', he: 'בקשות מיוחדות', uk: 'Особливі побажання' },
    'Additional Request (Optional)': { ka: 'დამატებითი მოთხოვნა (სურვილისამებრ)', ru: 'Дополнительный запрос (необязательно)', tr: 'Ek Talep (Istege Bagli)', ar: 'طلب إضافي (اختياري)', he: 'בקשה נוספת (אופציונלי)', uk: 'Додатковий запит (необов’язково)' },
    'Your full name': { ka: 'თქვენი სახელი და გვარი', ru: 'Ваше полное имя', tr: 'Adınız ve soyadınız', ar: 'اسمك الكامل', he: 'השם המלא שלך', uk: 'Ваше повне ім\'я' },
    'e.g. 2': { ka: 'მაგ. 2', ru: 'напр. 2', tr: 'örn. 2', ar: 'مثال: 2', he: 'לדוגמה 2', uk: 'напр. 2' },
    'Any dietary requirements, mobility needs, etc.': { ka: 'კვებითი შეზღუდვები, მობილურობის საჭიროებები და ა.შ.', ru: 'Особенности питания, мобильности и т. д.', tr: 'Beslenme gereksinimleri, hareket kabiliyeti ihtiyaçları vb.', ar: 'أي متطلبات غذائية أو احتياجات تنقل، إلخ.', he: 'דרישות תזונה, צרכי ניידות וכדומה.', uk: 'Харчові обмеження, потреби мобільності тощо.' },
    'Anything else you want us to prepare for your trip.': { ka: 'თუ რამე დამატებით გსურთ, მოგვწერეთ და მოგზაურობისთვის წინასწარ მოვამზადებთ.', ru: 'Если есть дополнительные пожелания, напишите нам — мы подготовим все заранее.', tr: 'Yolculugunuz icin hazirlamamizi istediginiz ek bir sey varsa lutfen yazin.', ar: 'إذا كان لديك أي طلب إضافي تريد منا التحضير له قبل الرحلة، يرجى كتابته.', he: 'אם יש משהו נוסף שתרצו שנכין לטיול שלכם, כתבו לנו כאן.', uk: 'Якщо є щось додаткове, що ви хочете, щоб ми підготували для вашої подорожі, напишіть нам.' },
    'Select a date': { ka: 'აირჩიეთ თარიღი', ru: 'Выберите дату', tr: 'Tarih secin', ar: 'اختر تاريخًا', he: 'בחרו תאריך', uk: 'Оберіть дату' },
    'Tour Price': { ka: 'ტურის ფასი', ru: 'Цена тура', tr: 'Tur Fiyati', ar: 'سعر الجولة', he: 'מחיר הסיור', uk: 'Ціна туру' },
    'Selected Currency': { ka: 'არჩეული ვალუტა', ru: 'Выбранная валюта', tr: 'Secili Para Birimi', ar: 'العملة المختارة', he: 'מטבע נבחר', uk: 'Обрана валюта' },

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

    /* --- Posts page (posts.html) --- */
    'Travel Stories': { ka: 'სამოგზაურო ისტორიები', ru: 'Истории о путешествиях', tr: 'Seyahat Hikayeleri', ar: 'قصص السفر', he: 'סיפורי מסע', uk: 'Історії про подорожі' },
    'Stories & Blog': { ka: 'ისტორიები და ბლოგი', ru: 'Истории и блог', tr: 'Hikayeler ve Blog', ar: 'قصص ومدونة', he: 'סיפורים ובלוג', uk: 'Історії та блог' },
    'Explore authentic Georgian stories, local guides, and travel insights from our experts.': {
      ka: 'გაეცანით საინტერესო ისტორიებს, ადგილობრივ გზამკვლევებს და სამოგზაურო რჩევებს.',
      ru: 'Откройте для себя интересные истории, местные гиды и советы по путешествиям.',
      tr: 'İlgi çekici hikayeleri, yerel rehberleri ve seyahat ipuçlarını keşfedin.',
      ar: 'اكتشف قصصاً مميزة، وأدلة محلية، ونصائح سفر.',
      he: 'גלו סיפורים מעניינים, מדריכים מקומיים ותובנות טיול.',
      uk: 'Досліджуйте цікаві історії, місцеві гіди та поради з подорожей.'
    },
    'All Articles': { ka: 'ყველა სტატია', ru: 'Все статьи', tr: 'Tüm Makaleler', ar: 'كل المقالات', he: 'כל המאמרים', uk: 'Усі статті' },
    'Latest from the Blog': { ka: 'ბოლოდროინდელი ბლოგიდან', ru: 'Последнее из блога', tr: 'Blogdan Son Yazılar', ar: 'أحدث ما في المدونة', he: 'העדכונים האחרונים מהבלוג', uk: 'Останнє з блогу' },
    'Practical travel advice and inspiring stories — updated regularly by our local team.': {
      ka: 'პრაქტიკული სამოგზაურო რჩევები და შთამაგონებელი ისტორიები — რეგულარულად განახლდება ჩვენი ადგილობრივი გუნდის მიერ.',
      ru: 'Практические советы по путешествиям и вдохновляющие истории — регулярно обновляются нашей местной командой.',
      tr: 'Pratik seyahat tavsiyeleri ve ilham verici hikayeler — yerel ekibimiz tarafından düzenli olarak güncellenir.',
      ar: 'نصائح سفر عملية وقصص ملهمة — يتم تحديثها بانتظام من قبل فريقنا المحلي.',
      he: 'עצות טיול מעשיות וסיפורים מעוררי השראה — מתעדכנים באופן קבוע על ידי הצוות המקומי שלנו.',
      uk: 'Практичні поради для подорожей та натхненні історії — регулярно оновлюються нашою місцевою командою.'
    },
    'Newsletter': { ka: 'სიახლეების გამოწერა', ru: 'Рассылка', tr: 'Bülten', ar: 'النشرة البريدية', he: 'ניוזלטר', uk: 'Розсилка' },
    'Get Travel Tips in Your Inbox': { ka: 'მიიღე სამოგზაურო რჩევები ელფოსტაზე', ru: 'Получайте советы для путешествий на почту', tr: 'Seyahat İpuçlarını E-postana Al', ar: 'احصل على نصائح السفر في بريدك الإلكتروني', he: 'קבלו טיפים לטיולים לתיבת הדואר שלכם', uk: 'Отримуйте поради для подорожей на пошту' },
    'Join 2,000+ travelers who get our weekly Georgian travel inspiration and exclusive deals.': {
      ka: 'შემოუერთდი 2,000+ მოგზაურს, რომლებიც ყოველკვირეულად იღებენ შთაგონებას საქართველოს შესახებ და ექსკლუზიურ შეთავაზებებს.',
      ru: 'Присоединяйтесь к более чем 2 000 путешественникам, которые каждую неделю получают вдохновение для поездок по Грузии и эксклюзивные предложения.',
      tr: 'Haftalık Gürcistan seyahat ilhamı ve özel fırsatlarımızı alan 2.000+ gezgine katılın.',
      ar: 'انضم إلى أكثر من 2000 مسافر يتلقون إلهام السفر إلى جورجيا وعروضنا الحصرية أسبوعياً.',
      he: 'הצטרפו ליותר מ-2,000 מטיילים שמקבלים מדי שבוע השראה לטיול בגאורגיה והצעות בלעדיות.',
      uk: 'Приєднуйтеся до 2 000+ мандрівників, які щотижня отримують натхнення для подорожей Грузією та ексклюзивні пропозиції.'
    },
    'Subscribe ✦': { ka: 'გამოწერა ✦', ru: 'Подписаться ✦', tr: 'Abone Ol ✦', ar: 'اشترك ✦', he: 'הירשמו ✦', uk: 'Підписатися ✦' },
    'No spam. Unsubscribe any time.': { ka: 'სპამი არა. გამოწერის გაუქმება ნებისმიერ დროს.', ru: 'Никакого спама. Отписка в любое время.', tr: 'Spam yok. İstediğiniz zaman abonelikten çıkın.', ar: 'بدون رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.', he: 'ללא ספאם. ניתן להסיר הרשמה בכל עת.', uk: 'Без спаму. Відписатися можна будь-коли.' },
    'Post Details – Georgia Trips': { ka: 'სტატიის დეტალები – Georgia Trips', ru: 'Детали статьи – Georgia Trips', tr: 'Yazı Detayı – Georgia Trips', ar: 'تفاصيل المقال – Georgia Trips', he: 'פרטי פוסט – Georgia Trips', uk: 'Деталі публікації – Georgia Trips' },
    'Read full travel stories, tips and insights from Georgia Trips.': {
      ka: 'წაიკითხეთ სრული სამოგზაურო ისტორიები, რჩევები და ხედვები Georgia Trips-იდან.',
      ru: 'Читайте полные истории путешествий, советы и идеи от Georgia Trips.',
      tr: 'Georgia Trips\'ten tam seyahat hikayeleri, ipuçları ve önerileri okuyun.',
      ar: 'اقرأ قصص السفر الكاملة والنصائح والرؤى من Georgia Trips.',
      he: 'קראו סיפורי טיול מלאים, טיפים ותובנות מ-Georgia Trips.',
      uk: 'Читайте повні історії подорожей, поради та ідеї від Georgia Trips.'
    },
    '← Back to Posts': { ka: '← უკან პოსტებზე', ru: '← Назад к постам', tr: '← Yazılara Dön', ar: '← العودة إلى المقالات', he: '← חזרה לפוסטים', uk: '← Назад до публікацій' },
    'Full Story': { ka: 'სრული ისტორია', ru: 'Полная история', tr: 'Tam Hikaye', ar: 'القصة الكاملة', he: 'הסיפור המלא', uk: 'Повна історія' },
    'Share This Story': { ka: 'გააზიარე ეს ისტორია', ru: 'Поделиться историей', tr: 'Bu Hikayeyi Paylaş', ar: 'شارك هذه القصة', he: 'שתפו את הסיפור הזה', uk: 'Поділитися цією історією' },
    'Send this post to your friends or keep the link for later.': {
      ka: 'გაუგზავნეთ ეს პოსტი მეგობრებს ან შეინახეთ ლინკი მოგვიანებისთვის.',
      ru: 'Отправьте этот пост друзьям или сохраните ссылку на потом.',
      tr: 'Bu yazıyı arkadaşlarınıza gönderin veya bağlantıyı daha sonra için saklayın.',
      ar: 'أرسل هذا المنشور إلى أصدقائك أو احفظ الرابط لوقت لاحق.',
      he: 'שלחו את הפוסט הזה לחברים או שמרו את הקישור לאחר כך.',
      uk: 'Надішліть цей допис друзям або збережіть посилання на потім.'
    },
    'Copy Link': { ka: 'ლინკის კოპირება', ru: 'Скопировать ссылку', tr: 'Bağlantıyı Kopyala', ar: 'نسخ الرابط', he: 'העתק קישור', uk: 'Скопіювати посилання' },
    'Explore More': { ka: 'მეტი სანახავად', ru: 'Больше материалов', tr: 'Daha Fazla Keşfet', ar: 'استكشف المزيد', he: 'לגלות עוד', uk: 'Більше матеріалів' },
    'Discover more travel stories and practical tips in our blog.': {
      ka: 'ჩვენს ბლოგში აღმოაჩინეთ მეტი სამოგზაურო ისტორია და პრაქტიკული რჩევა.',
      ru: 'Откройте больше историй и практичных советов в нашем блоге.',
      tr: 'Blogumuzda daha fazla seyahat hikayesi ve pratik ipuçları keşfedin.',
      ar: 'اكتشف المزيد من قصص السفر والنصائح العملية في مدونتنا.',
      he: 'גלו בבלוג שלנו עוד סיפורי מסע וטיפים מעשיים.',
      uk: 'Відкрийте більше історій і практичних порад у нашому блозі.'
    },
    'View All Posts': { ka: 'ყველა პოსტის ნახვა', ru: 'Смотреть все посты', tr: 'Tüm Yazıları Gör', ar: 'عرض كل المقالات', he: 'צפה בכל הפוסטים', uk: 'Переглянути всі публікації' },
    'Link copied to clipboard!': { ka: 'ლინკი დაკოპირდა!', ru: 'Ссылка скопирована!', tr: 'Bağlantı kopyalandı!', ar: 'تم نسخ الرابط!', he: 'הקישור הועתק!', uk: 'Посилання скопійовано!' },
    'Story': { ka: 'ისტორია', ru: 'История', tr: 'Hikaye', ar: 'قصة', he: 'סיפור', uk: 'Історія' },
    'Our Journey': { ka: 'ჩვენი გზა', ru: 'Наш путь', tr: 'Yolculuğumuz', ar: 'رحلتنا', he: 'המסע שלנו', uk: 'Наш шлях' },
    'Built by travelers, shaped by local knowledge, and dedicated to meaningful journeys across Georgia.': {
      ka: 'შექმნილია მოგზაურების მიერ, გაძლიერებულია ადგილობრივი ცოდნით და ეძღვნება შინაარსიან მოგზაურობებს საქართველოს მასშტაბით.',
      ru: 'Создано путешественниками, сформировано местными знаниями и посвящено содержательным путешествиям по Грузии.',
      tr: 'Gezginler tarafından kuruldu, yerel bilgiyle şekillendi ve Gürcistan genelinde anlamlı yolculuklara adandı.',
      ar: 'صُممت على يد المسافرين، وشكّلها الفهم المحلي، ومكرسة لرحلات ذات معنى عبر جورجيا.',
      he: 'נבנה על ידי מטיילים, עוצב בעזרת ידע מקומי ומוקדש למסעות משמעותיים ברחבי גאורגיה.',
      uk: 'Створено мандрівниками, сформовано місцевими знаннями та присвячено змістовним подорожам Грузією.'
    },
    'Years Creating Journeys': { ka: 'მოგზაურობების შექმნის წლები', ru: 'Лет создания путешествий', tr: 'Yolculuk Tasarlama Yılı', ar: 'سنوات صناعة الرحلات', he: 'שנות יצירת מסעות', uk: 'Років створення маршрутів' },
    'Local People, Real Experiences': { ka: 'ადგილობრივი ადამიანები, ნამდვილი გამოცდილება', ru: 'Местные люди, настоящие впечатления', tr: 'Yerel İnsanlar, Gerçek Deneyimler', ar: 'أشخاص محليون، تجارب حقيقية', he: 'אנשים מקומיים, חוויות אמיתיות', uk: 'Місцеві люди, справжній досвід' },
    'Georgia Trips started in 2017 with one clear idea: travel should feel personal, not scripted. We design routes that combine iconic highlights with places and moments most visitors usually miss.': {
      ka: 'Georgia Trips 2017 წელს ერთი მკაფიო იდეით დაიწყო: მოგზაურობა უნდა იყოს პირადი და არა წინასწარ დაწერილი. ჩვენ ვქმნით მარშრუტებს, რომლებიც ცნობილ ადგილებს აერთიანებს იმ მომენტებთან და სივრცეებთან, რასაც ვიზიტორების უმეტესობა გამოტოვებს.',
      ru: 'Georgia Trips начался в 2017 году с одной простой идеи: путешествие должно быть личным, а не шаблонным. Мы создаём маршруты, где культовые места сочетаются с моментами и локациями, которые большинство гостей обычно пропускают.',
      tr: 'Georgia Trips 2017\'de tek bir fikirle başladı: seyahat kişisel hissettirmeli, ezber olmamalı. Rotalarımızda ikonik noktaları, ziyaretçilerin çoğunun kaçırdığı yerler ve anlarla birleştiriyoruz.',
      ar: 'بدأت Georgia Trips عام 2017 بفكرة واضحة: يجب أن تكون الرحلة شخصية لا نمطية. نصمم مسارات تجمع بين أبرز المعالم والأماكن واللحظات التي يفوتها معظم الزوار.',
      he: 'Georgia Trips התחילה ב-2017 עם רעיון ברור: טיול צריך להרגיש אישי, לא תסריט קבוע. אנו בונים מסלולים שמשלבים נקודות חובה עם מקומות ורגעים שרוב המבקרים מפספסים.',
      uk: 'Georgia Trips розпочалася у 2017 році з однією ідеєю: подорож має бути особистою, а не шаблонною. Ми створюємо маршрути, що поєднують знакові місця з локаціями та моментами, які більшість гостей зазвичай пропускає.'
    },
    'Today, our team includes certified guides, reliable drivers and detail-focused planners who coordinate each journey from first message to final day.': {
      ka: 'დღეს ჩვენი გუნდი აერთიანებს სერტიფიცირებულ გიდებს, საიმედო მძღოლებს და დეტალებზე ორიენტირებულ დამგეგმავებს, რომლებიც თითოეულ მოგზაურობას პირველი შეტყობინებიდან ბოლო დღემდე კოორდინაციას უწევენ.',
      ru: 'Сегодня в нашу команду входят сертифицированные гиды, надёжные водители и внимательные к деталям планировщики, которые сопровождают путешествие от первого сообщения до последнего дня.',
      tr: 'Bugün ekibimiz, ilk mesajdan son güne kadar her yolculuğu koordine eden sertifikalı rehberler, güvenilir şoförler ve detay odaklı planlayıcılardan oluşuyor.',
      ar: 'اليوم يضم فريقنا مرشدين معتمدين وسائقين موثوقين ومخططين يهتمون بالتفاصيل، ينسقون كل رحلة من أول رسالة حتى آخر يوم.',
      he: 'כיום הצוות שלנו כולל מדריכים מוסמכים, נהגים אמינים ומתכננים מדויקים שמנהלים כל מסע מההודעה הראשונה ועד היום האחרון.',
      uk: 'Сьогодні наша команда включає сертифікованих гідів, надійних водіїв і уважних до деталей координаторів, які супроводжують подорож від першого повідомлення до останнього дня.'
    },
    'Whether you travel solo, as a couple, or with a group, we focus on comfort, flexibility and genuine local connection at every step.': {
      ka: 'მგზავრობთ მარტო, წყვილად თუ ჯგუფურად — ყოველ ეტაპზე ყურადღებას ვამახვილებთ კომფორტზე, მოქნილობაზე და ნამდვილ ადგილობრივ კავშირზე.',
      ru: 'Путешествуете ли вы в одиночку, парой или группой — на каждом этапе мы делаем акцент на комфорте, гибкости и подлинной связи с местной средой.',
      tr: 'İster tek başınıza, ister çift olarak, ister grupla seyahat edin; her adımda konfor, esneklik ve gerçek yerel bağa odaklanıyoruz.',
      ar: 'سواء كنت تسافر بمفردك أو كزوجين أو مع مجموعة، نركز في كل خطوة على الراحة والمرونة والتواصل المحلي الحقيقي.',
      he: 'בין אם אתם מטיילים לבד, כזוג או בקבוצה — בכל שלב אנו מתמקדים בנוחות, גמישות וחיבור מקומי אמיתי.',
      uk: 'Подорожуєте ви самі, парою чи групою — на кожному етапі ми зосереджені на комфорті, гнучкості та справжньому локальному зв’язку.'
    },
    'Travelers Hosted': { ka: 'მასპინძლობილი მოგზაურები', ru: 'Принято путешественников', tr: 'Ağırlanan Gezginler', ar: 'المسافرون الذين استضفناهم', he: 'מטיילים שהתארחו אצלנו', uk: 'Мандрівників прийнято' },
    'Curated Routes': { ka: 'შერჩეული მარშრუტები', ru: 'Продуманные маршруты', tr: 'Özenle Seçilmiş Rotalar', ar: 'مسارات منتقاة', he: 'מסלולים נבחרים', uk: 'Продумані маршрути' },
    'Guest Satisfaction': { ka: 'სტუმართა კმაყოფილება', ru: 'Удовлетворённость гостей', tr: 'Misafir Memnuniyeti', ar: 'رضا الضيوف', he: 'שביעות רצון אורחים', uk: 'Задоволеність гостей' },
    'People Behind The Trips': { ka: 'მოგზაურობების გუნდი', ru: 'Люди, создающие поездки', tr: 'Turların Arkasındaki Ekip', ar: 'الفريق خلف الرحلات', he: 'האנשים מאחורי הטיולים', uk: 'Люди, що створюють подорожі' },
    'Meet The Team': { ka: 'გაიცანი გუნდი', ru: 'Познакомьтесь с командой', tr: 'Ekibimizle Tanışın', ar: 'تعرّف على الفريق', he: 'הכירו את הצוות', uk: 'Познайомтесь із командою' },
    'A diverse crew of guides, coordinators and drivers who work together to make every trip smooth, safe and memorable.': {
      ka: 'გიდების, კოორდინატორებისა და მძღოლების მრავალფეროვანი გუნდი, რომელიც ერთად მუშაობს, რათა ყოველი მოგზაურობა იყოს მარტივი, უსაფრთხო და დასამახსოვრებელი.',
      ru: 'Разнообразная команда гидов, координаторов и водителей, которая вместе делает каждую поездку комфортной, безопасной и запоминающейся.',
      tr: 'Her yolculuğu sorunsuz, güvenli ve unutulmaz hale getirmek için birlikte çalışan rehber, koordinatör ve şoförlerden oluşan çok yönlü bir ekip.',
      ar: 'فريق متنوع من المرشدين والمنسقين والسائقين يعمل معاً ليجعل كل رحلة سلسة وآمنة ولا تُنسى.',
      he: 'צוות מגוון של מדריכים, מתאמים ונהגים שפועלים יחד כדי להפוך כל טיול לחלק, בטוח ובלתי נשכח.',
      uk: 'Різнопрофільна команда гідів, координаторів і водіїв, яка разом робить кожну подорож комфортною, безпечною та незабутньою.'
    },
    'Founder & Lead Trip Designer': { ka: 'დამფუძნებელი და მთავარი მარშრუტების დიზაინერი', ru: 'Основатель и главный дизайнер маршрутов', tr: 'Kurucu ve Baş Rota Tasarımcısı', ar: 'المؤسس وكبير مصممي الرحلات', he: 'מייסד ומעצב הטיולים הראשי', uk: 'Засновник і головний дизайнер маршрутів' },
    'Culture & Experience Curator': { ka: 'კულტურისა და გამოცდილების კურატორი', ru: 'Куратор культурных и туристических впечатлений', tr: 'Kültür ve Deneyim Küratörü', ar: 'منسّقة الثقافة والتجارب', he: 'אוצרת תרבות וחוויות', uk: 'Кураторка культури та вражень' },
    'Mountain Routes Specialist': { ka: 'მთის მარშრუტების სპეციალისტი', ru: 'Специалист по горным маршрутам', tr: 'Dağ Rotaları Uzmanı', ar: 'أخصائي المسارات الجبلية', he: 'מומחה למסלולי הרים', uk: 'Спеціаліст з гірських маршрутів' },
    'Food & Wine Experiences': { ka: 'გასტრონომიული და ღვინის გამოცდილებები', ru: 'Гастрономические и винные впечатления', tr: 'Yemek ve Şarap Deneyimleri', ar: 'تجارب الطعام والنبيذ', he: 'חוויות אוכל ויין', uk: 'Гастрономічні та винні враження' },
    'We create thoughtful travel experiences focused on comfort, flexibility and real human connection.': {
      ka: 'ჩვენ ვქმნით გააზრებულ სამოგზაურო გამოცდილებებს, სადაც მთავარი არის კომფორტი, მოქნილობა და ნამდვილი ადამიანური კავშირი.',
      ru: 'Мы создаём продуманные путешествия, где в центре — комфорт, гибкость и живое человеческое общение.',
      tr: 'Konfor, esneklik ve gerçek insan bağlantısına odaklanan özenli seyahat deneyimleri tasarlıyoruz.',
      ar: 'نصنع تجارب سفر مدروسة تركز على الراحة والمرونة والتواصل الإنساني الحقيقي.',
      he: 'אנו יוצרים חוויות טיול מוקפדות שמתמקדות בנוחות, גמישות וחיבור אנושי אמיתי.',
      uk: 'Ми створюємо продумані подорожі, зосереджені на комфорті, гнучкості та справжньому людському контакті.'
    },
    'Travel Designed Around People': { ka: 'მოგზაურობა, შექმნილი ადამიანებისთვის', ru: 'Путешествия, созданные для людей', tr: 'İnsan Odaklı Seyahat', ar: 'سفر مصمم حول الإنسان', he: 'טיול שמותאם לאנשים', uk: 'Подорожі, створені для людей' },
    'We started with a simple belief: great travel is not about checking boxes, it is about creating moments that feel personal and memorable.': {
      ka: 'ჩვენ დავიწყეთ მარტივი რწმენით: კარგი მოგზაურობა მხოლოდ პუნქტების მონიშვნა არ არის — ის პირადი და დასამახსოვრებელი მომენტების შექმნაა.',
      ru: 'Мы начали с простой идеи: отличное путешествие — это не про галочки в списке, а про личные и запоминающиеся моменты.',
      tr: 'Basit bir inançla başladık: iyi seyahat, listede kutu işaretlemek değil; kişisel ve unutulmaz anlar yaratmaktır.',
      ar: 'بدأنا بإيمان بسيط: السفر الرائع ليس مجرد إنجاز قائمة، بل صناعة لحظات شخصية لا تُنسى.',
      he: 'התחלנו מאמונה פשוטה: טיול מצוין הוא לא סימון משימות, אלא יצירת רגעים אישיים ובלתי נשכחים.',
      uk: 'Ми почали з простої ідеї: чудова подорож — це не про «галочки», а про особисті й незабутні моменти.'
    },
    'Our team includes experienced guides, reliable drivers and detail-focused planners who manage every step of a trip with care.': {
      ka: 'ჩვენი გუნდი აერთიანებს გამოცდილ გიდებს, საიმედო მძღოლებსა და დეტალებზე ორიენტირებულ დამგეგმავებს, რომლებიც მოგზაურობის თითოეულ ეტაპს ზრუნვით მართავენ.',
      ru: 'В нашей команде — опытные гиды, надёжные водители и внимательные к деталям планировщики, которые с заботой ведут каждый этап поездки.',
      tr: 'Ekibimiz, seyahatin her adımını özenle yöneten deneyimli rehberler, güvenilir şoförler ve detay odaklı planlayıcılardan oluşur.',
      ar: 'يضم فريقنا مرشدين ذوي خبرة وسائقين موثوقين ومخططين يهتمون بالتفاصيل ويديرون كل خطوة بعناية.',
      he: 'הצוות שלנו כולל מדריכים מנוסים, נהגים אמינים ומתכננים מדויקים שמנהלים כל שלב במסע באכפתיות.',
      uk: 'Наша команда складається з досвідчених гідів, надійних водіїв і уважних до деталей координаторів, які дбайливо ведуть кожен етап подорожі.'
    },
    'Whether you travel solo, as a couple, with family or with friends, we build experiences that match your pace, interests and priorities.': {
      ka: 'მოგზაურობთ მარტო, წყვილად, ოჯახით თუ მეგობრებთან ერთად — ჩვენ ვქმნით გამოცდილებას, რომელიც თქვენს ტემპს, ინტერესებსა და პრიორიტეტებს შეესაბამება.',
      ru: 'Путешествуете ли вы в одиночку, парой, с семьёй или друзьями — мы создаём формат, который соответствует вашему темпу, интересам и приоритетам.',
      tr: 'İster tek başınıza, ister çift olarak, ailenizle ya da arkadaşlarınızla seyahat edin; deneyimi hızınıza, ilgi alanlarınıza ve önceliklerinize göre kurguluyoruz.',
      ar: 'سواء سافرت بمفردك أو كزوجين أو مع العائلة أو الأصدقاء، نصمم تجربة تناسب وتيرتك واهتماماتك وأولوياتك.',
      he: 'בין אם אתם מטיילים לבד, כזוג, עם המשפחה או עם חברים — אנו בונים חוויה שמתאימה לקצב, לתחומי העניין ולסדר העדיפויות שלכם.',
      uk: 'Подорожуєте ви самі, парою, з родиною чи друзями — ми створюємо досвід, що відповідає вашому темпу, інтересам і пріоритетам.'
    },
    'Travelers Served': { ka: 'მომსახურებული მოგზაურები', ru: 'Обслужено путешественников', tr: 'Hizmet Verilen Gezginler', ar: 'المسافرون الذين خدمناهم', he: 'מטיילים שקיבלו שירות', uk: 'Мандрівників обслужено' },
    'We choose responsible partners and encourage travel choices that support people, culture and nature.': {
      ka: 'ვირჩევთ პასუხისმგებლიან პარტნიორებს და ხელს ვუწყობთ ისეთ მოგზაურობას, რომელიც ადამიანებს, კულტურას და ბუნებას სარგებელს აძლევს.',
      ru: 'Мы выбираем ответственных партнёров и поддерживаем решения в путешествиях, которые полезны людям, культуре и природе.',
      tr: 'Sorumlu iş ortakları seçiyor, insanları, kültürü ve doğayı destekleyen seyahat tercihlerini teşvik ediyoruz.',
      ar: 'نختار شركاء مسؤولين ونشجع خيارات سفر تدعم الإنسان والثقافة والطبيعة.',
      he: 'אנו בוחרים שותפים אחראיים ומעודדים בחירות נסיעה שתומכות באנשים, בתרבות ובטבע.',
      uk: 'Ми обираємо відповідальних партнерів і заохочуємо подорожі, що підтримують людей, культуру та природу.'
    },
    'Human Service': { ka: 'ადამიანური მომსახურება', ru: 'Человечный сервис', tr: 'İnsani Hizmet', ar: 'خدمة إنسانية', he: 'שירות אנושי', uk: 'Людяний сервіс' },
    'We communicate clearly, respond quickly and treat every traveler with attention and respect.': {
      ka: 'ვუკავშირდებით მკაფიოდ, ვპასუხობთ სწრაფად და თითოეულ მოგზაურს ყურადღებითა და პატივისცემით ვექცევით.',
      ru: 'Мы общаемся понятно, отвечаем быстро и относимся к каждому путешественнику с вниманием и уважением.',
      tr: 'Açık iletişim kurar, hızlı geri döner ve her gezgine özen ve saygıyla yaklaşırız.',
      ar: 'نتواصل بوضوح، ونستجيب بسرعة، ونتعامل مع كل مسافر باهتمام واحترام.',
      he: 'אנו מתקשרים בבהירות, מגיבים במהירות ומתייחסים לכל מטייל בתשומת לב ובכבוד.',
      uk: 'Ми спілкуємося чітко, відповідаємо швидко й ставимося до кожного мандрівника з увагою та повагою.'
    },
    'Thoughtful Planning': { ka: 'გააზრებული დაგეგმვა', ru: 'Продуманное планирование', tr: 'Düşünülmüş Planlama', ar: 'تخطيط مدروس', he: 'תכנון מחושב', uk: 'Продумане планування' },
    'Every route is designed with balanced timing, practical logistics and room for personal preferences.': {
      ka: 'თითოეული მარშრუტი იგეგმება დაბალანსებული დროით, პრაქტიკული ლოჯისტიკით და პირადი სურვილებისთვის სივრცით.',
      ru: 'Каждый маршрут строится с учётом сбалансированного графика, практичной логистики и личных предпочтений.',
      tr: 'Her rota dengeli zamanlama, pratik lojistik ve kişisel tercihlere alan bırakacak şekilde tasarlanır.',
      ar: 'يُصمم كل مسار بتوقيت متوازن ولوجستيات عملية ومساحة للتفضيلات الشخصية.',
      he: 'כל מסלול נבנה עם תזמון מאוזן, לוגיסטיקה מעשית ומקום להעדפות אישיות.',
      uk: 'Кожен маршрут створюється зі збалансованим таймінгом, практичною логістикою та простором для особистих вподобань.'
    },
    'From operations to guest support, we keep high standards and continuously improve every detail.': {
      ka: 'ოპერაციებიდან სტუმართა მხარდაჭერამდე, ვინარჩუნებთ მაღალ სტანდარტს და მუდმივად ვაუმჯობესებთ თითოეულ დეტალს.',
      ru: 'От операционных процессов до поддержки гостей — мы держим высокий стандарт и постоянно улучшаем каждую деталь.',
      tr: 'Operasyondan misafir desteğine kadar yüksek standartları korur, her detayı sürekli geliştiririz.',
      ar: 'من العمليات إلى دعم الضيوف، نحافظ على معايير عالية ونطوّر كل تفصيل باستمرار.',
      he: 'מהתפעול ועד תמיכת האורחים, אנו שומרים על סטנדרט גבוה ומשפרים כל פרט באופן מתמיד.',
      uk: 'Від операцій до підтримки гостей ми дотримуємось високих стандартів і постійно покращуємо кожну деталь.'
    },
    'How We Work': { ka: 'როგორ ვმუშაობთ', ru: 'Как мы работаем', tr: 'Nasıl Çalışıyoruz', ar: 'كيف نعمل', he: 'איך אנחנו עובדים', uk: 'Як ми працюємо' },
    'Our Process': { ka: 'ჩვენი პროცესი', ru: 'Наш процесс', tr: 'Sürecimiz', ar: 'آلية عملنا', he: 'התהליך שלנו', uk: 'Наш процес' },
    'A simple and reliable workflow that helps us deliver smooth, flexible and high-quality travel experiences.': {
      ka: 'მარტივი და სანდო სამუშაო პროცესი, რომელიც გვეხმარება შევქმნათ გამართული, მოქნილი და ხარისხიანი მოგზაურობა.',
      ru: 'Простой и надёжный процесс, который помогает нам создавать комфортные, гибкие и качественные путешествия.',
      tr: 'Sorunsuz, esnek ve kaliteli seyahat deneyimleri sunmamıza yardımcı olan basit ve güvenilir bir iş akışı.',
      ar: 'آلية عمل بسيطة وموثوقة تساعدنا على تقديم تجارب سفر سلسة ومرنة وعالية الجودة.',
      he: 'תהליך עבודה פשוט ואמין שעוזר לנו לספק חוויות טיול חלקות, גמישות ואיכותיות.',
      uk: 'Простий і надійний процес, що допомагає нам створювати плавні, гнучкі та якісні подорожі.'
    },
    'Consultation': { ka: 'კონსულტაცია', ru: 'Консультация', tr: 'Danışma', ar: 'استشارة', he: 'ייעוץ', uk: 'Консультація' },
    'We listen to your goals, travel style and budget before suggesting any plan.': {
      ka: 'ნებისმიერი გეგმის შეთავაზებამდე ვისმენთ თქვენს მიზნებს, მოგზაურობის სტილსა და ბიუჯეტს.',
      ru: 'Прежде чем что-то предложить, мы внимательно изучаем ваши цели, стиль путешествия и бюджет.',
      tr: 'Herhangi bir plan önermeden önce hedeflerinizi, seyahat tarzınızı ve bütçenizi dinleriz.',
      ar: 'قبل اقتراح أي خطة، نستمع لأهدافك وأسلوب سفرك وميزانيتك.',
      he: 'לפני שאנו מציעים תוכנית, אנו מקשיבים למטרות, לסגנון הטיול ולתקציב שלכם.',
      uk: 'Перш ніж щось пропонувати, ми уважно слухаємо ваші цілі, стиль подорожі та бюджет.'
    },
    'Planning': { ka: 'დაგეგმვა', ru: 'Планирование', tr: 'Planlama', ar: 'التخطيط', he: 'תכנון', uk: 'Планування' },
    'We prepare a clear itinerary with transparent pricing and practical timelines.': {
      ka: 'ვქმნით მკაფიო მარშრუტს გამჭვირვალე ფასებით და პრაქტიკული დროის გეგმით.',
      ru: 'Мы готовим понятный маршрут с прозрачными ценами и реалистичными сроками.',
      tr: 'Şeffaf fiyatlandırma ve uygulanabilir zaman planıyla net bir rota hazırlarız.',
      ar: 'نُعد برنامجاً واضحاً بأسعار شفافة وجداول زمنية عملية.',
      he: 'אנו מכינים מסלול ברור עם תמחור שקוף ולוחות זמנים מעשיים.',
      uk: 'Ми готуємо чіткий маршрут із прозорими цінами та практичним таймінгом.'
    },
    'Execution': { ka: 'შესრულება', ru: 'Реализация', tr: 'Uygulama', ar: 'التنفيذ', he: 'ביצוע', uk: 'Реалізація' },
    'On the trip, our team handles logistics and support so you can enjoy the journey.': {
      ka: 'მოგზაურობისას ჩვენი გუნდი მართავს ლოჯისტიკასა და მხარდაჭერას, რათა თქვენ უბრალოდ ისიამოვნოთ გზით.',
      ru: 'Во время поездки наша команда берёт на себя логистику и поддержку, чтобы вы спокойно наслаждались путешествием.',
      tr: 'Seyahat sırasında lojistik ve desteği ekibimiz yönetir; siz yolculuğun tadını çıkarırsınız.',
      ar: 'أثناء الرحلة يتولى فريقنا اللوجستيات والدعم لتستمتع أنت بالتجربة.',
      he: 'במהלך הטיול הצוות שלנו מטפל בלוגיסטיקה ובתמיכה כדי שאתם פשוט תיהנו מהמסע.',
      uk: 'Під час подорожі наша команда бере на себе логістику й підтримку, щоб ви насолоджувались мандрівкою.'
    },
    'Aftercare': { ka: 'შემდგომი მხარდაჭერა', ru: 'После поездки', tr: 'Seyahat Sonrası Destek', ar: 'المتابعة بعد الرحلة', he: 'ליווי לאחר הטיול', uk: 'Післяподорожній супровід' },
    'We collect feedback and refine future trips to keep improving quality.': {
      ka: 'ვაგროვებთ უკუკავშირს და ვაუმჯობესებთ მომდევნო მოგზაურობებს, რათა ხარისხი მუდმივად იზრდებოდეს.',
      ru: 'Мы собираем обратную связь и улучшаем будущие поездки, чтобы постоянно повышать качество.',
      tr: 'Geri bildirim toplar, kaliteyi sürekli yükseltmek için sonraki turları geliştiririz.',
      ar: 'نجمع الملاحظات ونطوّر الرحلات القادمة للحفاظ على التحسين المستمر للجودة.',
      he: 'אנו אוספים משוב ומשפרים את הטיולים הבאים כדי להעלות את האיכות באופן מתמיד.',
      uk: 'Ми збираємо відгуки та вдосконалюємо майбутні подорожі, щоб постійно підвищувати якість.'
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

    /* --- Cars page (cars.html) --- */
    'Our Fleet': { ka: 'ჩვენი ავტოპარკი', ru: 'Наш автопарк', tr: 'Filomuz', ar: 'أسطولنا', he: 'הצי שלנו', uk: 'Наш автопарк' },
    'Transport and Car Services': { ka: 'ტრანსპორტი და ავტომობილების სერვისი', ru: 'Транспорт и автоуслуги', tr: 'Ulaşım ve Araç Hizmetleri', ar: 'خدمات النقل والسيارات', he: 'שירותי תחבורה ורכבים', uk: 'Транспорт та автопослуги' },
    'Comfortable and safe vehicles for every journey across Georgia. Pick the car that fits your trip — an experienced driver is always included.': {
      ka: 'კომფორტული და უსაფრთხო ავტომობილები ყოველი მოგზაურობისთვის საქართველოში. შეარჩიეთ თქვენს მგზავრობაზე მორგებული მანქანა, გამოცდილი მძღოლი კი ყოველთვის შედის ფასში.',
      ru: 'Удобные и безопасные автомобили для любого путешествия по Грузии. Выберите машину под вашу поездку — опытный водитель всегда включён в стоимость.',
      tr: 'Gürcistan\'daki her yolculuk için konforlu ve güvenli araçlar. Gezinize uygun aracı seçin — deneyimli şoför her zaman fiyata dahildir.',
      ar: 'مركبات مريحة وآمنة لكل رحلة في جورجيا. اختر السيارة المناسبة لرحلتك — السائق المحترف مشمول دائمًا.',
      he: 'רכבים נוחים ובטוחים לכל מסע בגאורגיה. בחרו את הרכב המתאים לטיול שלכם — נהג מנוסה תמיד כלול במחיר.',
      uk: 'Комфортні й безпечні авто для будь-якої подорожі Грузією. Оберіть автомобіль під вашу поїздку — досвідчений водій завжди включений.'
    },
    'Available Vehicles': { ka: 'ხელმისაწვდომი ავტომობილები', ru: 'Доступные автомобили', tr: 'Mevcut Araçlar', ar: 'المركبات المتاحة', he: 'רכבים זמינים', uk: 'Доступні авто' },
    'Choose Your Vehicle': { ka: 'აირჩიეთ თქვენი ავტომობილი', ru: 'Выберите автомобиль', tr: 'Aracınızı Seçin', ar: 'اختر سيارتك', he: 'בחרו את הרכב שלכם', uk: 'Оберіть ваше авто' },
    'Every car in our fleet is well-maintained, fully insured and driven by a licensed driver who speaks English.': {
      ka: 'ჩვენი ავტოპარკის ყოველი მანქანა კარგად მოვლილი, სრულად დაზღვეული და ინგლისურენოვანი ლიცენზირებული მძღოლის მართვით მუშაობს.',
      ru: 'Каждая машина нашего автопарка в отличном состоянии, полностью застрахована и управляется лицензированным водителем со знанием английского.',
      tr: 'Filomuzdaki her araç bakımlı, tam sigortalı ve İngilizce bilen lisanslı bir şoför tarafından kullanılmaktadır.',
      ar: 'كل سيارة في أسطولنا يتم صيانتها جيداً، ومؤمّنة بالكامل، ويقودها سائق مرخّص يتحدث الإنجليزية.',
      he: 'כל רכב בצי שלנו מתוחזק היטב, מבוטח באופן מלא ומונהג על ידי נהג מורשה שדובר אנגלית.',
      uk: 'Кожне авто нашого автопарку доглянуте, повністю застраховане і керується ліцензованим водієм, що говорить англійською.'
    },
    'Our Services': { ka: 'ჩვენი სერვისები', ru: 'Наши услуги', tr: 'Hizmetlerimiz', ar: 'خدماتنا', he: 'השירותים שלנו', uk: 'Наші послуги' },
    'What We Offer': { ka: 'რას გთავაზობთ', ru: 'Что мы предлагаем', tr: 'Size Sunduklarımız', ar: 'ما نقدمه', he: 'מה אנו מציעים', uk: 'Що ми пропонуємо' },
    'From a quick airport pick-up to a long mountain trip — we have the right car and driver for every plan.': {
      ka: 'სწრაფი აეროპორტის ტრანსფერიდან გრძელ მთის მოგზაურობამდე — ყოველი გეგმისთვის გვაქვს შესაფერისი ავტომობილი და მძღოლი.',
      ru: 'От быстрой встречи в аэропорту до долгой поездки в горы — для каждого плана у нас есть подходящий автомобиль и водитель.',
      tr: 'Hızlı havalimanı karşılamalarından uzun dağ yolculuklarına — her plan için uygun aracımız ve şoförümüz var.',
      ar: 'من الاستقبال السريع في المطار إلى الرحلات الجبلية الطويلة — لدينا السيارة والسائق المناسبين لكل خطة.',
      he: 'מאיסוף מהיר משדה התעופה ועד מסע ארוך להרים — יש לנו את הרכב והנהג המתאימים לכל תוכנית.',
      uk: 'Від швидкого трансферу з аеропорту до довгої поїздки в гори — маємо відповідне авто й водія для будь-якого плану.'
    },
    'Airport Transfers': { ka: 'აეროპორტის ტრანსფერი', ru: 'Трансфер из аэропорта', tr: 'Havalimanı Transferi', ar: 'خدمات النقل من المطار', he: 'הסעות משדה התעופה', uk: 'Трансфер з аеропорту' },
    'We meet you at the airport with a name sign, help with your luggage and take you straight to your hotel.': {
      ka: 'აეროპორტში გხვდებით თქვენი სახელით მოწერილი ტაბლოთი, დაგეხმარებით ბარგის ტარებაში და პირდაპირ სასტუმრომდე მიგიყვანთ.',
      ru: 'Встречаем вас в аэропорту с табличкой, помогаем с багажом и сразу везём в отель.',
      tr: 'Sizi havalimanında isim tabelasıyla karşılar, bagajlarınızla yardım eder ve doğrudan otelinize götürürüz.',
      ar: 'نستقبلك في المطار بلافتة تحمل اسمك، ونساعدك في الأمتعة ونوصلك مباشرة إلى الفندق.',
      he: 'אנו פוגשים אתכם בשדה התעופה עם שלט שם, עוזרים עם המזוודות ולוקחים אתכם ישירות למלון.',
      uk: 'Зустрічаємо вас в аеропорту з табличкою, допомагаємо з багажем і відвозимо просто до готелю.'
    },
    'City Tours': { ka: 'ქალაქის ტური', ru: 'Городские туры', tr: 'Şehir Turları', ar: 'جولات في المدينة', he: 'סיורים בעיר', uk: 'Міські тури' },
    'Discover Tbilisi and Batumi with a friendly driver who knows every street and story of the city.': {
      ka: 'აღმოაჩინეთ თბილისი და ბათუმი მეგობრულ მძღოლთან ერთად, რომელიც კარგად იცნობს ქალაქის ყველა ქუჩასა და ისტორიას.',
      ru: 'Откройте Тбилиси и Батуми с дружелюбным водителем, который знает каждую улицу и историю города.',
      tr: 'Tiflis ve Batum\'u, şehrin her sokağını ve hikâyesini bilen güler yüzlü bir şoförle keşfedin.',
      ar: 'اكتشف تبليسي وباتومي مع سائق ودود يعرف كل شارع وقصة في المدينة.',
      he: 'גלו את טביליסי ובטומי עם נהג ידידותי שמכיר כל רחוב וכל סיפור של העיר.',
      uk: 'Відкрийте Тбілісі та Батумі з привітним водієм, який знає кожну вулицю та історію міста.'
    },
    'Mountain Trips': { ka: 'მთის მოგზაურობა', ru: 'Поездки в горы', tr: 'Dağ Gezileri', ar: 'رحلات جبلية', he: 'טיולים להרים', uk: 'Поїздки в гори' },
    'Strong 4WD cars for Kazbegi, Svaneti, Tusheti and any off-road destination you want to visit.': {
      ka: 'მძლავრი 4×4 ჯიპები ყაზბეგის, სვანეთის, თუშეთის და ნებისმიერი რთული, უგზოობიანი მარშრუტისთვის.',
      ru: 'Мощные внедорожники 4WD для Казбеги, Сванетии, Тушетии и любого бездорожья, куда вы хотите отправиться.',
      tr: 'Kazbegi, Svaneti, Tuşeti ve gitmek istediğiniz her arazi rotası için güçlü 4×4 araçlar.',
      ar: 'سيارات دفع رباعي قوية للذهاب إلى كازبيغي وسفانيتي وتوشيتي وأي وجهة وعرة ترغب في زيارتها.',
      he: 'רכבי 4×4 חזקים לקזבגי, סוואנטי, טושטי וכל יעד שטח שתרצו לבקר בו.',
      uk: 'Потужні повнопривідні авто для Казбегі, Сванеті, Тушеті та будь-якого бездоріжжя, яке хочете відвідати.'
    },
    'Groups and Families': { ka: 'ჯგუფები და ოჯახები', ru: 'Группы и семьи', tr: 'Gruplar ve Aileler', ar: 'المجموعات والعائلات', he: 'קבוצות ומשפחות', uk: 'Групи та сім\'ї' },
    'Spacious minivans with safety features — perfect for families, students and travel groups.': {
      ka: 'ფართო მიკროავტობუსები უსაფრთხოების სრული აღჭურვილობით — იდეალურია ოჯახებისთვის, სტუდენტებისთვის და სამოგზაურო ჯგუფებისთვის.',
      ru: 'Просторные минивэны с функциями безопасности — идеальны для семей, студентов и туристических групп.',
      tr: 'Güvenlik donanımlı geniş minibüsler — aileler, öğrenciler ve seyahat grupları için idealdir.',
      ar: 'حافلات صغيرة واسعة مزوّدة بميزات الأمان — مثالية للعائلات والطلاب والمجموعات السياحية.',
      he: 'מיניוואנים מרווחים עם אמצעי בטיחות — מושלמים למשפחות, סטודנטים וקבוצות נוסעים.',
      uk: 'Просторі мінівени з функціями безпеки — ідеально для сімей, студентів і туристичних груп.'
    },
    'Why Us': { ka: 'რატომ ჩვენ', ru: 'Почему мы', tr: 'Neden Biz', ar: 'لماذا نحن', he: 'למה אנחנו', uk: 'Чому ми' },
    'Why Book a Car With Us': { ka: 'რატომ ჯავშნოთ მანქანა ჩვენთან', ru: 'Почему стоит заказать авто у нас', tr: 'Neden Aracı Bizden Kiralamalısınız', ar: 'لماذا تحجز سيارة معنا', he: 'למה להזמין רכב דרכנו', uk: 'Чому варто замовити авто в нас' },
    'We care about your comfort, your safety and your time.': {
      ka: 'ვზრუნავთ თქვენს კომფორტზე, უსაფრთხოებასა და დროზე.',
      ru: 'Мы заботимся о вашем комфорте, безопасности и времени.',
      tr: 'Konforunuza, güvenliğinize ve zamanınıza önem veriyoruz.',
      ar: 'نهتم براحتك وسلامتك ووقتك.',
      he: 'אכפת לנו מהנוחות, הבטיחות והזמן שלכם.',
      uk: 'Ми дбаємо про ваш комфорт, безпеку та час.'
    },
    'Licensed Drivers': { ka: 'ლიცენზირებული მძღოლები', ru: 'Лицензированные водители', tr: 'Lisanslı Şoförler', ar: 'سائقون مرخصون', he: 'נהגים מורשים', uk: 'Ліцензовані водії' },
    'Professional drivers with years of experience who know Georgia very well.': {
      ka: 'პროფესიონალი მძღოლები მრავალწლიანი გამოცდილებით, რომლებმაც საქართველო კარგად იციან.',
      ru: 'Профессиональные водители с многолетним опытом, которые отлично знают Грузию.',
      tr: 'Gürcistan\'ı çok iyi tanıyan, yıllara dayanan deneyime sahip profesyonel şoförler.',
      ar: 'سائقون محترفون يتمتعون بسنوات من الخبرة ويعرفون جورجيا جيدًا.',
      he: 'נהגים מקצועיים עם שנות ניסיון רבות שמכירים היטב את גאורגיה.',
      uk: 'Професійні водії з багаторічним досвідом, які чудово знають Грузію.'
    },
    'Modern Vehicles': { ka: 'თანამედროვე ავტომობილები', ru: 'Современные автомобили', tr: 'Modern Araçlar', ar: 'مركبات حديثة', he: 'רכבים מודרניים', uk: 'Сучасні авто' },
    'Clean and comfortable cars with air-conditioning, checked before every trip.': {
      ka: 'სუფთა და კომფორტული მანქანები კონდიციონერით, შემოწმებული ყოველი მგზავრობის წინ.',
      ru: 'Чистые и комфортные автомобили с кондиционером, проверяем их перед каждой поездкой.',
      tr: 'Klimalı, temiz ve konforlu araçlar — her yolculuktan önce kontrol edilir.',
      ar: 'سيارات نظيفة ومريحة مزوّدة بالتكييف، ويتم فحصها قبل كل رحلة.',
      he: 'רכבים נקיים ונוחים עם מיזוג אוויר, שנבדקים לפני כל נסיעה.',
      uk: 'Чисті й комфортні авто з кондиціонером, перевіряємо перед кожною поїздкою.'
    },
    'Fair Prices': { ka: 'სამართლიანი ფასები', ru: 'Честные цены', tr: 'Uygun Fiyatlar', ar: 'أسعار عادلة', he: 'מחירים הוגנים', uk: 'Чесні ціни' },
    'Honest prices with no hidden fees. You only pay for what you book.': {
      ka: 'გულწრფელი ფასები დამატებითი გადასახადების გარეშე. იხდით მხოლოდ დაჯავშნილზე.',
      ru: 'Честные цены без скрытых платежей. Вы платите только за то, что забронировали.',
      tr: 'Gizli ücret olmadan dürüst fiyatlar. Yalnızca rezerve ettiğiniz için ödersiniz.',
      ar: 'أسعار صادقة بدون رسوم خفية. تدفع فقط مقابل ما تحجزه.',
      he: 'מחירים הוגנים ללא עלויות נסתרות. משלמים רק על מה שהזמנתם.',
      uk: 'Чесні ціни без прихованих платежів. Ви платите лише за те, що бронюєте.'
    },
    'Available Every Day': { ka: 'ხელმისაწვდომი ყოველდღე', ru: 'Доступно каждый день', tr: 'Her Gün Müsait', ar: 'متاح كل يوم', he: 'זמין כל יום', uk: 'Доступно щодня' },
    'We are here for you every day of the week, at any hour you need us.': {
      ka: 'ჩვენ თქვენთან ვართ კვირის ყოველ დღეს, ნებისმიერ საათში, როცა დაგვჭირდებით.',
      ru: 'Мы с вами каждый день недели, в любой час, когда мы вам нужны.',
      tr: 'Haftanın her günü, ihtiyaç duyduğunuz her saatte yanınızdayız.',
      ar: 'نحن معك كل يوم من أيام الأسبوع وفي أي ساعة تحتاجنا فيها.',
      he: 'אנחנו כאן בשבילכם בכל יום בשבוע, בכל שעה שתזדקקו לנו.',
      uk: 'Ми поруч з вами щодня тижня, у будь-яку годину, коли ми потрібні.'
    },
    'Vehicle Inquiry': { ka: 'მანქანის მოთხოვნა', ru: 'Запрос по автомобилю', tr: 'Araç Talebi', ar: 'طلب مركبة', he: 'בקשת רכב', uk: 'Запит щодо авто' },
    'Share your dates and we will reply within a few hours with availability and a final price.': {
      ka: 'გაგვიზიარეთ თქვენი თარიღები და გიპასუხებთ რამდენიმე საათში ხელმისაწვდომობით და საბოლოო ფასით.',
      ru: 'Оставьте даты, и мы ответим в течение нескольких часов с информацией о доступности и финальной ценой.',
      tr: 'Tarihlerinizi bize iletin, birkaç saat içinde uygunluk ve kesin fiyatla geri döneriz.',
      ar: 'شاركنا التواريخ، وسنرد خلال ساعات قليلة بتوفر السيارة والسعر النهائي.',
      he: 'שתפו את התאריכים ונחזור אליכם בתוך כמה שעות עם זמינות ומחיר סופי.',
      uk: 'Надішліть ваші дати, і ми відповімо протягом кількох годин із доступністю та остаточною ціною.'
    },
    'Trip Dates': { ka: 'მოგზაურობის თარიღები', ru: 'Даты поездки', tr: 'Seyahat Tarihleri', ar: 'تواريخ الرحلة', he: 'תאריכי הטיול', uk: 'Дати поїздки' },
    'Number of Passengers': { ka: 'მგზავრების რაოდენობა', ru: 'Количество пассажиров', tr: 'Yolcu Sayısı', ar: 'عدد الركاب', he: 'מספר נוסעים', uk: 'Кількість пасажирів' },
    'Send Inquiry ✦': { ka: 'გაგზავნე მოთხოვნა ✦', ru: 'Отправить запрос ✦', tr: 'İstek Gönder ✦', ar: 'إرسال الطلب ✦', he: 'שליחת בקשה ✦', uk: 'Надіслати запит ✦' },
    'Driver included': { ka: 'მძღოლი შედის', ru: 'Водитель включён', tr: 'Şoför dahil', ar: 'السائق مشمول', he: 'הנהג כלול', uk: 'Водій включений' },

    /* --- Cars detail page (cars-detail.html) --- */
    '← Back to All Cars': { ka: '← უკან ყველა მანქანაზე', ru: '← Назад ко всем авто', tr: '← Tüm Araçlara Dön', ar: '← العودة إلى جميع السيارات', he: '← חזרה לכל הרכבים', uk: '← Назад до всіх авто' },
    'Vehicle Specifications': { ka: 'ავტომობილის მახასიათებლები', ru: 'Характеристики автомобиля', tr: 'Araç Özellikleri', ar: 'مواصفات المركبة', he: 'מפרט הרכב', uk: 'Характеристики автомобіля' },
    'Seats': { ka: 'ადგილები', ru: 'Места', tr: 'Koltuklar', ar: 'المقاعد', he: 'מושבים', uk: 'Місця' },
    'Transmission': { ka: 'გადაცემათა კოლოფი', ru: 'Коробка передач', tr: 'Vites', ar: 'ناقل الحركة', he: 'תיבת הילוכים', uk: 'Коробка передач' },
    'Fuel Type': { ka: 'საწვავის ტიპი', ru: 'Тип топлива', tr: 'Yakıt Türü', ar: 'نوع الوقود', he: 'סוג דלק', uk: 'Тип пального' },
    'Color': { ka: 'ფერი', ru: 'Цвет', tr: 'Renk', ar: 'اللون', he: 'צבע', uk: 'Колір' },
    'Driver': { ka: 'მძღოლი', ru: 'Водитель', tr: 'Şoför', ar: 'السائق', he: 'נהג', uk: 'Водій' },
    'Air Conditioning': { ka: 'კონდიციონერი', ru: 'Кондиционер', tr: 'Klima', ar: 'تكييف الهواء', he: 'מיזוג אוויר', uk: 'Кондиціонер' },
    'Included': { ka: 'შედის', ru: 'Включено', tr: 'Dahil', ar: 'مشمول', he: 'כלול', uk: 'Включено' },
    'Yes': { ka: 'დიახ', ru: 'Да', tr: 'Evet', ar: 'نعم', he: 'כן', uk: 'Так' },
    'About This Vehicle': { ka: 'ამ ავტომობილის შესახებ', ru: 'Об этом автомобиле', tr: 'Bu Araç Hakkında', ar: 'عن هذه المركبة', he: 'אודות הרכב הזה', uk: 'Про цей автомобіль' },
    'Loading description…': { ka: 'აღწერის ჩატვირთვა…', ru: 'Загрузка описания…', tr: 'Açıklama yükleniyor…', ar: 'جاري تحميل الوصف…', he: 'טוען תיאור…', uk: 'Завантаження опису…' },
    'Loading…': { ka: 'იტვირთება…', ru: 'Загрузка…', tr: 'Yükleniyor…', ar: 'جاري التحميل…', he: 'טוען…', uk: 'Завантаження…' },
    'Professional driver who speaks your preferred language': {
      ka: 'პროფესიონალი მძღოლი თქვენს ენაზე',
      en: 'Professional driver who speaks your preferred language',
      ru: 'Профессиональный водитель, говорящий на удобном для вас языке',
      tr: 'Tercih ettiğiniz dili konuşan profesyonel bir şoför',
      ar: 'سائق محترف يتحدث باللغة التي تفضّلها',
      ru: 'Профессиональный водитель, говорящий на удобном для вас языке',
      tr: 'Tercih ettiğiniz dili konuşan profesyonel bir şoför',
      ar: 'سائق محترف يتحدث باللغة التي تفضّلها',
      he: 'נהג מקצועי שדובר בשפה המועדפת עליכם',
      uk: 'Професійний водій, який говорить зручною для вас мовою'
    },
    'Full insurance on every trip': { ka: 'სრული დაზღვევა', ru: 'Полная страховка на каждую поездку', tr: 'Her yolculukta tam sigorta', ar: 'تأمين شامل في كل رحلة', he: 'ביטוח מלא בכל נסיעה', uk: 'Повне страхування в кожній поїздці' },
    'Fuel included in the price': { ka: 'საწვავი შედის ფასში', ru: 'Топливо включено в цену', tr: 'Yakıt fiyata dahildir', ar: 'الوقود مشمول في السعر', he: 'הדלק כלול במחיר', uk: 'Пальне включено в ціну' },
    'Bottled water for all passengers': { ka: 'წყალი ყველა მგზავრისთვის', ru: 'Бутилированная вода для всех пассажиров', tr: 'Tüm yolcular için şişe su', ar: 'مياه معبأة لجميع الركاب', he: 'מים בבקבוק לכל הנוსעים', uk: 'Бутильована вода для всіх пасажирів' },
    'Free hotel pickup and drop-off': { ka: 'უფასო ტრანსფერი სასტუმროდან', ru: 'Бесплатный трансфер из отеля и в отель', tr: 'Ücretsiz otel alışı ve bırakılışı', ar: 'خدمة توصيل واستقبال مجانية من الفندق', he: 'איსוף והחזרה חינם מהמלონ', uk: 'Безкоштовний трансфер з готелю і до გოტელუ' },
    'Clean, air-conditioned cabin': { ka: 'სუფთა, კონდიცირებული სალონი', ru: 'Чистый салон с кондиционером', tr: 'Temiz ve klimalı kabin', ar: 'مقصورة نظيفة ومكيّفة', he: 'תא נקי וממוזג', uk: 'Чистий салон з кондиціонером' },
    'Flexible route and timing': { ka: 'მოქნილი მარშრუტი და დრო', ru: 'Гибкий маршрут и график', tr: 'Esnek rota ve zamanlama', ar: 'مسار وتوقيت مرنان', he: 'מסלול ולוחות ზმנים გמישים', uk: 'Гнучкий маршрут і графік' },
    '24/7 support during your trip': { ka: '24/7 მხარდაჭერა', ru: 'Поддержка 24/7 во время поездки', tr: 'Yolculuğunuz boyunca 7/24 destek', ar: 'دعم على مدار الساعة طوال رحلتك', he: 'תמיכה 24/7 במהלך הנסיעה', uk: 'Підтримка 24/7 протягом поїздки' },
    'Good to Know': { ka: 'კარგია რომ იცოდეთ', ru: 'Полезно знать', tr: 'Bilmeniz Gerekenler', ar: 'معلومات مفيدة', he: 'טוב לדעת', uk: 'Корисно знати' },
    'Flexible Booking': { ka: 'მოქნილი ჯავშანი', ru: 'Гибкое бронирование', tr: 'Esnek Rezervasyon', ar: 'حجز مرن', he: 'הזמנה גמישה', uk: 'Гнучке бронювання' },
    'You can change or cancel your booking up to 24 hours before the trip, free of charge.': {
      ka: 'შეგიძლიათ შეცვალოთ ან გააუქმოთ ჯავშანი მოგზაურობამდე 24 საათით ადრე, უფასოდ.',
      ru: 'Вы можете изменить или отменить бронь за 24 часа до поездки — бесплатно.',
      tr: 'Rezervasyonunuzu yolculuktan 24 saat öncesine kadar ücretsiz değiştirebilir veya iptal edebilirsiniz.',
      ar: 'يمكنك تعديل أو إلغاء حجزك قبل 24 ساعة من الرحلة مجانًا.',
      he: 'ניתן לשנות או לבטל את ההזמנה עד 24 שעות לפני הנסיעה, ללא עלות.',
      uk: 'Ви можете змінити або скасувати бронювання за 24 години до поїздки безкоштовно.'
    },
    'Luggage Friendly': { ka: 'საკმაო ადგილი ბარგისთვის', ru: 'Много места для багажа', tr: 'Bagaj Dostu', ar: 'مساحة واسعة للأمتعة', he: 'מתאים למזוודות', uk: 'Багато місця для багажу' },
    'Every vehicle has enough space for suitcases, backpacks and travel gear.': {
      ka: 'ყოველ ავტომობილში საკმარისი ადგილია ჩემოდნების, ზურგჩანთების და სამოგზაურო ნივთებისთვის.',
      ru: 'В каждом автомобиле достаточно места для чемоданов, рюкзаков и снаряжения.',
      tr: 'Her araçta bavullar, sırt çantaları ve seyahat ekipmanı için yeterli alan vardır.',
      ar: 'كل مركبة تتسع للحقائب والأمتعة ومعدات السفر.',
      he: 'בכל רכב יש מספיק מקום למזוודות, תרמילים וציוד נסיעה.',
      uk: 'У кожному авто достатньо місця для валіз, рюкзаків і спорядження.'
    },
    'Multilingual Driver': { ka: 'მრავალენოვანი მძღოლი', ru: 'Водитель со знанием языков', tr: 'Çok Dilli Şoför', ar: 'سائق متعدد اللغات', he: 'נהג רב-לשוני', uk: 'Багатомовний водій' },
    'Professional driver who speaks your preferred language.': {
      ka: 'პროფესიონალი მძღოლი, რომელიც ლაპარაკობს თქვენს სასურველ ენაზე.',
      ru: 'Профессиональный водитель, говорящий на удобном для вас языке.',
      tr: 'Tercih ettiğiniz dili konuşan profesyonel bir şoför.',
      ar: 'سائق محترف يتحدث باللغة التي تفضّلها.',
      he: 'נהג מקצועי שדובר בשפה המועדפת עליכם.',
      uk: 'Професійний водій, який говорить зручною для вас мовою.'
    },
    'Safety First': { ka: 'უსაფრთხოება უპირველესია', ru: 'Безопасность прежде всего', tr: 'Önce Güvenlik', ar: 'السلامة أولاً', he: 'בטיחות קודם כול', uk: 'Безпека перш за все' },
    'All vehicles are checked regularly and meet strict safety standards.': {
      ka: 'ყველა ავტომობილი რეგულარულად მოწმდება და აკმაყოფილებს უსაფრთხოების მკაცრ სტანდარტებს.',
      ru: 'Все автомобили регулярно проверяются и соответствуют строгим стандартам безопасности.',
      tr: 'Tüm araçlar düzenli olarak kontrol edilir ve katı güvenlik standartlarını karşılar.',
      ar: 'يتم فحص جميع المركبات بانتظام وتلتزم بمعايير السلامة الصارمة.',
      he: 'כל הרכבים נבדקים באופן שוטף ועומדים בתקני בטיחות מחמירים.',
      uk: 'Усі авто регулярно перевіряються й відповідають суворим стандартам безпеки.'
    },
    'Best Price': { ka: 'საუკეთესო ფასი', ru: 'Лучшая цена', tr: 'En İyi Fiyat', ar: 'أفضل سعر', he: 'המחיר הטוב ביותר', uk: 'Найкраща ціна' },
    'per day': { ka: 'დღეში', ru: 'в день', tr: 'günlük', ar: 'يوميًا', he: 'ליום', uk: 'на день' },
    'Book This Vehicle': { ka: 'დაჯავშნე ეს ავტომობილი', ru: 'Забронировать этот автомобиль', tr: 'Bu Aracı Rezerve Et', ar: 'احجز هذه المركبة', he: 'הזמן רכב זה', uk: 'Забронювати це авто' },
    'Share This Car': { ka: 'გააზიარე ეს მანქანა', ru: 'Поделиться авто', tr: 'Bu Aracı Paylaş', ar: 'شارك هذه السيارة', he: 'שתפו רכב זה', uk: 'Поділитися цим авто' },
    'Fast confirmation': { ka: 'სწრაფი დადასტურება', ru: 'Быстрое подтверждение', tr: 'Hızlı onay', ar: 'تأكيد سريع', he: 'אישור מהיר', uk: 'Швидке підтвердження' },
    'Pay on pickup': { ka: 'გადახდა მიღებისას', ru: 'Оплата при получении', tr: 'Teslim alırken ödeme', ar: 'الدفع عند الاستلام', he: 'תשלום באיסוף', uk: 'Оплата при отриманні' },
    'Fully insured': { ka: 'სრულად დაზღვეული', ru: 'Полная страховка', tr: 'Tam sigortalı', ar: 'مؤمّن بالكامل', he: 'מבוטח במלואו', uk: 'Повністю застраховано' },
    '24/7 support': { ka: '24/7 მხარდაჭერა', ru: 'Поддержка 24/7', tr: '7/24 destek', ar: 'دعم 24/7', he: 'תמיכה 24/7', uk: 'Підтримка 24/7' },
    'Need Help?': { ka: 'გჭირდებათ დახმარება?', ru: 'Нужна помощь?', tr: 'Yardım mı lazım?', ar: 'هل تحتاج مساعدة؟', he: 'צריכים עזרה?', uk: 'Потрібна допомога?' },
    'Our team is ready to answer any question about this car.': {
      ka: 'ჩვენი გუნდი მზადაა უპასუხოს ნებისმიერ კითხვას ამ მანქანაზე.',
      ru: 'Наша команда готова ответить на любой вопрос об этом автомобиле.',
      tr: 'Ekibimiz bu araçla ilgili her sorunuzu yanıtlamaya hazır.',
      ar: 'فريقنا جاهز للإجابة عن أي سؤال حول هذه السيارة.',
      he: 'הצוות שלנו מוכן לענות על כל שאלה לגבי הרכב הזה.',
      uk: 'Наша команда готова відповісти на будь-яке запитання про це авто.'
    },
    'WhatsApp': { ka: 'WhatsApp', ru: 'WhatsApp', tr: 'WhatsApp', ar: 'واتساب', he: 'WhatsApp', uk: 'WhatsApp' },
    'Call Us': { ka: 'დარეკე', ru: 'Позвонить', tr: 'Bizi Ara', ar: 'اتصل بنا', he: 'התקשרו אלינו', uk: 'Зателефонувати' },
    'Full Name *': { ka: 'სახელი და გვარი *', ru: 'Полное имя *', tr: 'Ad Soyad *', ar: 'الاسم الكامل *', he: 'שם מלא *', uk: 'Повне ім\'я *' },
    'Email *': { ka: 'იმეილი *', ru: 'Эл. почта *', tr: 'E-posta *', ar: 'البريد الإلكتروني *', he: 'אימייל *', uk: 'E-mail *' },
    'Phone Number *': { ka: 'ტელეფონის ნომერი *', ru: 'Номер телефона *', tr: 'Telefon Numarası *', ar: 'رقم الهاتف *', he: 'מספר טלפון *', uk: 'Номер телефону *' },
    'Passengers *': { ka: 'მგზავრები *', ru: 'Пассажиры *', tr: 'Yolcular *', ar: 'الركاب *', he: 'נוסעים *', uk: 'Пасажири *' },
    'Pick-up Date *': { ka: 'მოსვლის თარიღი *', ru: 'Дата подачи *', tr: 'Teslim Alma Tarihi *', ar: 'تاريخ الاستلام *', he: 'תאריך איסוף *', uk: 'Дата подачі *' },
    'Pick-up Location': { ka: 'მოსვლის ადგილი', ru: 'Место подачи', tr: 'Teslim Alma Yeri', ar: 'مكان الاستلام', he: 'מקום איסוף', uk: 'Місце подачі' },
    'Hotel, airport or address': { ka: 'სასტუმრო, აეროპორტი ან მისამართი', ru: 'Отель, аэропорт или адрес', tr: 'Otel, havalimanı veya adres', ar: 'فندق أو مطار أو عنوان', he: 'מלון, שדה תעופה או כתובת', uk: 'Готель, аеропорт або адреса' },
    'Additional Notes': { ka: 'დამატებითი კომენტარი', ru: 'Дополнительные заметки', tr: 'Ek Notlar', ar: 'ملاحظات إضافية', he: 'הערות נוספות', uk: 'Додаткові нотатки' },
    'Route, stops or any special request': { ka: 'მარშრუტი, გაჩერებები ან სპეციალური მოთხოვნა', ru: 'Маршрут, остановки или особые пожелания', tr: 'Güzergâh, duraklar veya özel bir istek', ar: 'المسار، التوقفات أو أي طلب خاص', he: 'מסלול, תחנות או בקשה מיוחדת', uk: 'Маршрут, зупинки або особливі побажання' },

    /* --- Login --- */
    'Welcome Back': { ka: 'მოგესალმებით', ru: 'С возвращением', tr: 'Tekrar Hoş Geldiniz', ar: 'أهلاً بعودتك', he: 'ברוכים השבים', uk: 'Вітаємо знову' },
    'Create Account': { ka: 'ანგარიშის შექმნა', ru: 'Создать аккаунт', tr: 'Hesap Oluştur', ar: 'إنشاء حساب', he: 'יצירת חשבון', uk: 'Створити акаунт' },
    'Password': { ka: 'პაროლი', ru: 'Пароль', tr: 'Şifre', ar: 'كلمة المرور', he: 'סיסמה', uk: 'Пароль' },
    'Forgot Password?': { ka: 'დაგავიწყდა პაროლი?', ru: 'Забыли пароль?', tr: 'Şifremi Unuttum?', ar: 'نسيت كلمة المرور؟', he: 'שכחת סיסמה?', uk: 'Забули пароль?' },
    'Continue with Google': { ka: 'გააგრძელე Google-ით', ru: 'Продолжить с Google', tr: 'Google ile devam et', ar: 'المتابعة باستخدام Google', he: 'המשך עם Google', uk: 'Продовжити через Google' },
    'Continue with Facebook': { ka: 'გააგრძელე Facebook-ით', ru: 'Продолжить с Facebook', tr: 'Facebook ile devam et', ar: 'المتابعة باستخدام Facebook', he: 'המשך עם Facebook', uk: 'Продовжити через Facebook' },
    'Sign In': { ka: 'შესვლა', ru: 'Войти', tr: 'Giriş Yap', ar: 'تسجيل الدخول', he: 'התחברות', uk: 'Увійти' },
    'Sign Up': { ka: 'რეგისტრაცია', ru: 'Регистрация', tr: 'Kayıt Ol', ar: 'إنشاء حساب', he: 'הרשמה', uk: 'Реєстрація' },
    'Sign in or create an account to manage bookings and access exclusive deals.': {
      ka: 'შედით ან შექმენით ანგარიში, რათა მართოთ ჯავშნები და მიიღოთ ექსკლუზიური შეთავაზებები.',
      ru: 'Войдите или создайте аккаунт, чтобы управлять бронированиями и получать эксклюзивные предложения.',
      tr: 'Rezervasyonlarınızı yönetmek ve özel fırsatlara erişmek için giriş yapın veya hesap oluşturun.',
      ar: 'سجّل الدخول أو أنشئ حسابًا لإدارة الحجوزات والوصول إلى العروض الحصرية.',
      he: 'התחברו או צרו חשבון כדי לנהל הזמנות ולקבל גישה למבצעים בלעדיים.',
      uk: 'Увійдіть або створіть акаунт, щоб керувати бронюваннями та отримати доступ до ексклюзивних пропозицій.'
    },
    'or sign in with email': { ka: 'ან შედით ელფოსტით', ru: 'или войдите по email', tr: 'veya e-posta ile giriş yap', ar: 'أو سجّل الدخول عبر البريد الإلكتروني', he: 'או התחברו באמצעות אימייל', uk: 'або увійдіть через e-mail' },
    'or create account with email': { ka: 'ან შექმენით ანგარიში ელფოსტით', ru: 'или создайте аккаунт по email', tr: 'veya e-posta ile hesap oluştur', ar: 'أو أنشئ حسابًا عبر البريد الإلكتروني', he: 'או צרו חשבון באמצעות אימייל', uk: 'або створіть акаунт через e-mail' },
    'Email': { ka: 'იმეილი', ru: 'Эл. почта', tr: 'E-posta', ar: 'البريد الإلكتروني', he: 'אימייל', uk: 'Електронна пошта' },
    'your@email.com': { ka: 'თქვენი@email.com', ru: 'ваш@email.com', tr: 'sizin@email.com', ar: 'your@email.com', he: 'your@email.com', uk: 'ваш@email.com' },
    'Enter your password': { ka: 'შეიყვანეთ პაროლი', ru: 'Введите пароль', tr: 'Şifrenizi girin', ar: 'أدخل كلمة المرور', he: 'הזן סיסמה', uk: 'Введіть пароль' },
    'Full Name': { ka: 'სახელი და გვარი', ru: 'Имя и фамилия', tr: 'Ad Soyad', ar: 'الاسم الكامل', he: 'שם מלא', uk: 'Ім’я та прізвище' },
    'Your name': { ka: 'თქვენი სახელი', ru: 'Ваше имя', tr: 'Adınız', ar: 'اسمك', he: 'השם שלך', uk: 'Ваше ім’я' },
    'At least 6 characters': { ka: 'მინიმუმ 6 სიმბოლო', ru: 'Минимум 6 символов', tr: 'En az 6 karakter', ar: '6 أحرف على الأقل', he: 'לפחות 6 תווים', uk: 'Щонайменше 6 символів' },
    'Signed In': { ka: 'შესული ხართ', ru: 'Вы вошли', tr: 'Giriş Yapıldı', ar: 'تم تسجيل الدخول', he: 'התחברת', uk: 'Ви увійшли' },
    'Sign Out': { ka: 'გასვლა', ru: 'Выйти', tr: 'Çıkış Yap', ar: 'تسجيل الخروج', he: 'התנתק', uk: 'Вийти' },
    'By signing in, you agree to our': { ka: 'შესვლით თქვენ ეთანხმებით ჩვენს', ru: 'Входя, вы соглашаетесь с нашими', tr: 'Giriş yaparak şunları kabul etmiş olursunuz:', ar: 'بتسجيل الدخول، فإنك توافق على', he: 'בהתחברות אתם מסכימים ל', uk: 'Входячи, ви погоджуєтеся з нашими' },
    'Ready to explore?': { ka: 'მზად ხართ აღმოსაჩენად?', ru: 'Готовы исследовать?', tr: 'Keşfetmeye hazır mısınız?', ar: 'هل أنت مستعد للاستكشاف؟', he: 'מוכנים לצאת לדרך?', uk: 'Готові досліджувати?' },
    'Browse Tours': { ka: 'ტურების ნახვა', ru: 'Посмотреть туры', tr: 'Turlara Göz At', ar: 'تصفح الجولات', he: 'עיינו בסיורים', uk: 'Переглянути тури' },
    'Sign up with Google': { ka: 'დარეგისტრირდი Google-ით', ru: 'Зарегистрироваться через Google', tr: 'Google ile kayıt ol', ar: 'إنشاء حساب عبر Google', he: 'הרשמה עם Google', uk: 'Зареєструватися через Google' },
    'Sign up with Facebook': { ka: 'დარეგისტრირდი Facebook-ით', ru: 'Зарегистрироваться через Facebook', tr: 'Facebook ile kayıt ol', ar: 'إنشاء حساب عبر Facebook', he: 'הרשמה עם Facebook', uk: 'Зареєструватися через Facebook' },

    /* --- Profile --- */
    'Verified Member': { ka: 'დადასტურებული მომხმარებელი', ru: 'Подтверждённый участник', tr: 'Doğrulanmış Üye', ar: 'عضو موثق', he: 'חבר מאומת', uk: 'Верифікований учасник' },
    'Member Since': { ka: 'წევრია', ru: 'Участник с', tr: 'Üyelik Tarihi', ar: 'عضو منذ', he: 'חבר מאז', uk: 'Учасник з' },
    'Sign-in Method': { ka: 'შესვლის მეთოდი', ru: 'Способ входа', tr: 'Giriş Yöntemi', ar: 'طريقة الدخول', he: 'שיטת התחברות', uk: 'Спосіб входу' },
    'Account Information': { ka: 'ანგარიშის ინფორმაცია', ru: 'Информация об аккаунте', tr: 'Hesap Bilgileri', ar: 'معلومات الحساب', he: 'פרטי חשבון', uk: 'Інформація про акаунт' },
    'Log Out': { ka: 'გასვლა', ru: 'Выйти', tr: 'Çıkış yap', ar: 'تسجيل الخروج', he: 'התנתק', uk: 'Вийти' },
    'Why Choose Us': { ka: 'რატომ ჩვენ', ru: 'Почему мы', tr: 'Neden Biz', ar: 'لماذا نحن', he: 'למה אנחנו', uk: 'Чому ми' },
    'Our Core Values': { ka: 'ჩვენი ღირებულებები', ru: 'Наши ценности', tr: 'Temel Değerlerimiz', ar: 'قيمنا الجوهرية', he: 'ערכי הליבה שלנו', uk: 'Наші цінности' },
    'Safety First': { ka: 'უსაფრთხოება უპირველეს ყოვლისა', ru: 'Безопасность прежде всего', tr: 'Önce Güvenlik', ar: 'السلامة أولاً', he: 'בטיחות מעל הכל', uk: 'Безпека понад усе' },
    'Genuine Hospitality': { ka: 'ნამდვილი სტუმართმოყვარეობა', ru: 'Искреннее гостеприимство', tr: 'Gerçek Misafirperverlik', ar: 'ضيافة أصيلة', he: 'אירוח אמיתי', uk: 'Справжня гостинність' },
    'Local Expertise': { ka: 'ადგილობრივი გამოცდილება', ru: 'Местный опыт', tr: 'Yerel Uzmanlık', ar: 'خبرة محلية', he: 'מומחיות מקומית', uk: 'Місцевий досвід' },
    'Transparency': { ka: 'გამჭვირვალობა', ru: 'Прозрачность', tr: 'Şeffaflık', ar: 'الشفافية', he: 'שקיפות', uk: 'Прозорість' },
    'Our Fleet': {
      ka: 'ჩვენი ფლოტი',
      ru: 'Наш флот',
      tr: 'Filomuz',
      ar: 'أسطولنا',
      he: 'הצי שלנו',
      uk: 'Наш Флот',
    },
    'Transport and Car Services': {
      ka: 'ტრანსპორტი და მანქანის მომსახურება',
      ru: 'Транспорт и автосервисы',
      tr: 'Ulaşım ve Araç Hizmetleri',
      ar: 'خدمات النقل والسيارات',
      he: 'שירותי הובלה ורכב',
      uk: 'Транспортні та автомобільні послуги',
    },
    'Available Vehicles': {
      ka: 'ხელმისაწვდომი მანქანები',
      ru: 'Доступные транспортные средства',
      tr: 'Mevcut Araçlar',
      ar: 'المركبات المتاحة',
      he: 'רכבים זמינים',
      uk: 'Доступні транспортні засоби',
    },
    'Choose Your Vehicle': {
      ka: 'აირჩიეთ თქვენი მანქანა',
      ru: 'Выберите свой автомобиль',
      tr: 'Aracınızı Seçin',
      ar: 'اختر سيارتك',
      he: 'בחר את הרכב שלך',
      uk: 'Виберіть свій автомобіль',
    },
    'Every vehicle in our fleet is well-maintained, fully insured, and operated by a licensed English-speaking driver.': {
      ka: 'ჩვენი ფლოტის ყველა მანქანა კარგად არის მოვლილი, სრულად დაზღვეული და მართავს ინგლისურენოვანი ლიცენზირებული მძღოლის მიერ.',
      ru: 'Каждый автомобиль в нашем автопарке находится в хорошем состоянии, полностью застрахован и управляется лицензированным англоговорящим водителем.',
      tr: 'Filomuzdaki her araç bakımlı, tam sigortalıdır ve İngilizce konuşan lisanslı bir sürücü tarafından işletilmektedir.',
      ar: 'تتم صيانة كل مركبة في أسطولنا بشكل جيد، ومؤمنة بالكامل، ويتم تشغيلها بواسطة سائق مرخص يتحدث الإنجليزية.',
      he: 'כל רכב בצי שלנו מתוחזק היטב, מבוטח במלואו, ומופעל על ידי נהג מורשה דובר אנגלית.',
      uk: 'Кожен транспортний засіб у нашому автопарку добре обслуговується, повністю застрахований і керується ліцензованим англомовним водієм.',
    },
    'Our Services': {
      ka: 'ჩვენი სერვისები',
      ru: 'Наши услуги',
      tr: 'Hizmetlerimiz',
      ar: 'خدماتنا',
      he: 'השירותים שלנו',
      uk: 'Наші послуги',
    },
    'What We Offer': {
      ka: 'რასაც ჩვენ გთავაზობთ',
      ru: 'Что мы предлагаем',
      tr: 'Ne Sunuyoruz?',
      ar: 'ما نقدمه',
      he: 'מה אנחנו מציעים',
      uk: 'Що ми пропонуємо',
    },
    'Airport Transfers': {
      ka: 'აეროპორტის ტრანსფერები',
      ru: 'Трансфер из аэропорта',
      tr: 'Havaalanı Transferleri',
      ar: 'نقل المطار',
      he: 'העברות לשדה התעופה',
      uk: 'Трансфери з аеропорту',
    },
    'We meet you at the airport with a name sign, help with your luggage and take you straight to your hotel.': {
      ka: 'აეროპორტში დაგხვდებით სახელის ნიშნით, დაგეხმარებით ბარგით და პირდაპირ სასტუმროში მიგიყვანთ.',
      ru: 'Мы встретим вас в аэропорту с именной табличкой, поможем с багажом и отвезем прямо в отель.',
      tr: 'Sizi havaalanında isim levhasıyla karşılıyor, bagajınıza yardımcı oluyor ve sizi doğrudan otelinize götürüyoruz.',
      ar: 'نستقبلك في المطار حاملين لافتة اسمك ونساعدك في حمل أمتعتك ونأخذك مباشرة إلى فندقك.',
      he: 'אנחנו פוגשים אותך בשדה התעופה עם שלט שם, עוזרים עם המזוודות ולוקחים אותך ישר למלון שלך.',
      uk: 'Ми зустрінемо вас в аеропорту з табличкою з іменем, допоможемо з вашим багажем і відвеземо прямо до вашого готелю.',
    },
    'City Tours': {
      ka: 'ქალაქის ტურები',
      ru: 'Экскурсии по городу',
      tr: 'Şehir Turları',
      ar: 'جولات المدينة',
      he: 'סיורים בעיר',
      uk: 'Екскурсії містом',
    },
    'Discover Tbilisi and Batumi with a friendly driver who knows every street and story of the city.': {
      ka: 'აღმოაჩინეთ თბილისი და ბათუმი მეგობრულ მძღოლთან, რომელმაც იცის ქალაქის ყველა ქუჩა და ისტორია.',
      ru: 'Откройте для себя Тбилиси и Батуми с дружелюбным водителем, который знает каждую улицу и историю города.',
      tr: 'Şehrin her sokağını ve hikayesini bilen dost canlısı bir şoförle Tiflis ve Batum\'u keşfedin.',
      ar: 'اكتشف تبليسي وباتومي مع سائق ودود يعرف كل شارع وقصة في المدينة.',
      he: 'גלו את טביליסי ובאטומי עם נהג ידידותי שמכיר כל רחוב וסיפור של העיר.',
      uk: 'Відкрийте для себе Тбілісі та Батумі з привітним водієм, який знає кожну вулицю та історію міста.',
    },
    'Mountain Trips': {
      ka: 'სამთო მოგზაურობა',
      ru: 'Горные туры',
      tr: 'Dağ Gezileri',
      ar: 'الرحلات الجبلية',
      he: 'טיולי הרים',
      uk: 'Гірські подорожі',
    },
    'Strong 4WD cars for Kazbegi, Svaneti, Tusheti and any off-road destination you want to visit.': {
      ka: 'ძლიერი 4WD მანქანები ყაზბეგში, სვანეთში, თუშეთში და ნებისმიერი გამავლობის მიმართულებით, რომლის მონახულებაც გსურთ.',
      ru: 'Мощные полноприводные автомобили для Казбеги, Сванетии, Тушети и любого бездорожья, которое вы хотите посетить.',
      tr: 'Kazbegi, Svaneti, Tusheti ve ziyaret etmek istediğiniz herhangi bir off-road destinasyonu için güçlü 4WD arabalar.',
      ar: 'سيارات الدفع الرباعي القوية لكازبيجي وسفانيتي وتوشيتي وأي وجهة على الطرق الوعرة ترغب في زيارتها.',
      he: 'מכוניות 4WD חזקות לקזבגי, סוואנטי, טושטי ולכל יעד שטח שתרצו לבקר בו.',
      uk: 'Потужні 4WD автомобілі для Казбегі, Сванетії, Тушетії та будь-якого позашляхового напряму, який ви хочете відвідати.',
    },
    'Groups and Families': {
      ka: 'ჯგუფები და ოჯახები',
      ru: 'Группы и семьи',
      tr: 'Gruplar ve Aileler',
      ar: 'المجموعات والعائلات',
      he: 'קבוצות ומשפחות',
      uk: 'Групи та сім\'ї',
    },
    'Why Book a Car With Us': {
      ka: 'რატომ დაჯავშნოთ მანქანა ჩვენთან',
      ru: 'Почему стоит заказать автомобиль у нас',
      tr: 'Neden Bizimle Araç Rezervasyonu Yapmalısınız?',
      ar: 'لماذا تحجز سيارة معنا',
      he: 'למה להזמין רכב איתנו',
      uk: 'Чому варто замовити автомобіль у нас?',
    },
    'We care about your comfort, your safety and your time.': {
      ka: 'ჩვენ ვზრუნავთ თქვენს კომფორტზე, თქვენს უსაფრთხოებაზე და თქვენს დროს.',
      ru: 'Мы заботимся о вашем комфорте, вашей безопасности и вашем времени.',
      tr: 'Konforunuzu, güvenliğinizi ve zamanınızı önemsiyoruz.',
      ar: 'نحن نهتم براحتك وسلامتك ووقتك.',
      he: 'אכפת לנו מהנוחות שלך, מהבטיחות שלך ומהזמן שלך.',
      uk: 'Ми дбаємо про ваш комфорт, вашу безпеку та ваш час.',
    },
    'Licensed Drivers': {
      ka: 'ლიცენზირებული მძღოლები',
      ru: 'Лицензированные драйверы',
      tr: 'Lisanslı Sürücüler',
      ar: 'السائقين المرخصين',
      he: 'נהגים מורשים',
      uk: 'Ліцензовані водії',
    },
    'Professional drivers with years of experience who know Georgia very well.': {
      ka: 'პროფესიონალი მძღოლები მრავალწლიანი გამოცდილებით, რომლებიც კარგად იცნობენ საქართველოს.',
      ru: 'Профессиональные водители с многолетним стажем, прекрасно знающие Грузию.',
      tr: 'Gürcistan\'ı çok iyi tanıyan, yılların tecrübesine sahip profesyonel sürücüler.',
      ar: 'السائقون المحترفون الذين يتمتعون بسنوات من الخبرة والذين يعرفون جورجيا جيدًا.',
      he: 'נהגים מקצועיים עם ניסיון של שנים שמכירים היטב את גאורגיה.',
      uk: 'Професійні водії з багаторічним досвідом, які дуже добре знають Грузію.',
    },
    'Modern Vehicles': {
      ka: 'თანამედროვე მანქანები',
      ru: 'Современные транспортные средства',
      tr: 'Modern Araçlar',
      ar: 'المركبات الحديثة',
      he: 'כלי רכב מודרניים',
      uk: 'Сучасні транспортні засоби',
    },
    'Clean and comfortable cars with air-conditioning, checked before every trip.': {
      ka: 'სუფთა და კომფორტული მანქანები კონდიციონერით, შემოწმებული ყოველი მგზავრობის წინ.',
      ru: 'Чистые и комфортабельные автомобили с кондиционером, проверенные перед каждой поездкой.',
      tr: 'Temiz ve konforlu, klimalı, her yolculuktan önce kontrol edilen arabalar.',
      ar: 'سيارات نظيفة ومريحة ومكيفة، ويتم فحصها قبل كل رحلة.',
      he: 'מכוניות נקיות ונוחות עם מיזוג אוויר, נבדקות לפני כל נסיעה.',
      uk: 'Чисті комфортабельні автомобілі з кондиціонером, перевірка перед кожною поїздкою.',
    },
    'Fair Prices': {
      ka: 'სამართლიანი ფასები',
      ru: 'Справедливые цены',
      tr: 'Uygun Fiyatlar',
      ar: 'أسعار عادلة',
      he: 'מחירים הוגנים',
      uk: 'Справедливі ціни',
    },
    'Honest prices with no hidden fees. You only pay for what you book.': {
      ka: 'გულწრფელი ფასები ფარული გადასახადების გარეშე. ',
      ru: 'Честные цены без скрытых комиссий. ',
      tr: 'Gizli ücretler olmadan dürüst fiyatlar. ',
      ar: 'أسعار صادقة مع عدم وجود رسوم خفية. ',
      he: 'מחירים ישרים ללא עמלות נסתרות. ',
      uk: 'Чесні ціни без прихованих комісій. ',
    },
    'Available Every Day': {
      ka: 'ხელმისაწვდომია ყოველდღე',
      ru: 'Доступно каждый день',
      tr: 'Her Gün Mevcuttur',
      ar: 'متاح كل يوم',
      he: 'זמין כל יום',
      uk: 'Доступно кожного дня',
    },
    'We are here for you every day of the week, at any hour you need us.': {
      ka: 'ჩვენ აქ ვართ თქვენთვის კვირის ყოველ დღეს, ნებისმიერ დროს, როცა დაგჭირდებათ.',
      ru: 'Мы здесь для вас каждый день недели, в любое время, когда мы вам нужны.',
      tr: 'Haftanın her günü, bize ihtiyaç duyduğunuz her saatte yanınızdayız.',
      ar: 'نحن هنا من أجلك طوال أيام الأسبوع، وفي أي ساعة تحتاج إلينا.',
      he: 'אנחנו כאן בשבילכם בכל יום בשבוע, בכל שעה שתזדקקו לנו.',
      uk: 'Ми тут для вас кожен день тижня, у будь-яку годину, коли ми вам потрібні.',
    },
    'Vehicle Inquiry': {
      ka: 'ავტომობილის გამოძიება',
      ru: 'Запрос на автомобиль',
      tr: 'Araç Sorgulama',
      ar: 'الاستعلام عن المركبة',
      he: 'בירור רכב',
      uk: 'Запит на транспортний засіб',
    },
    'Share your dates and we will reply within a few hours with availability and a final price.': {
      ka: 'გააზიარეთ თქვენი თარიღები და ჩვენ რამდენიმე საათში გიპასუხებთ ხელმისაწვდომობისა და საბოლოო ფასის შესახებ.',
      ru: 'Сообщите даты, и мы ответим в течение нескольких часов, сообщив о наличии мест и окончательную цену.',
      tr: 'Tarihlerinizi paylaşın; birkaç saat içinde müsaitlik durumu ve nihai fiyatla birlikte yanıt verelim.',
      ar: 'قم بمشاركة التواريخ الخاصة بك وسوف نقوم بالرد خلال ساعات قليلة بالتوفر والسعر النهائي.',
      he: 'שתף את התאריכים שלך ואנו נענה תוך מספר שעות עם זמינות ומחיר סופי.',
      uk: 'Поділіться своїми датами, і ми відповімо протягом кількох годин із інформацією про наявність місць та остаточну ціну.',
    },
    'Trip Dates': {
      ka: 'მოგზაურობის თარიღები',
      ru: 'Даты поездки',
      tr: 'Seyahat Tarihleri',
      ar: 'مواعيد الرحلة',
      he: 'תאריכי טיול',
      uk: 'Дати поїздки',
    },
    'Number of Passengers': {
      ka: 'მგზავრთა რაოდენობა',
      ru: 'Количество пассажиров',
      tr: 'Yolcu Sayısı',
      ar: 'عدد الركاب',
      he: 'מספר נוסעים',
      uk: 'Кількість пасажирів',
    },
    'Explore Georgia': {
      ka: 'გამოიკვლიეთ საქართველო',
      ru: 'Откройте для себя Грузию',
      tr: 'Gürcistan\'ı keşfedin',
      ar: 'اكتشف جورجيا',
      he: 'חקור את גאורגיה',
      uk: 'Дослідіть Грузію',
    },
    'Discover the beauty of Georgia with our carefully curated domestic tours - from day trips to multi-day adventures.': {
      ka: 'აღმოაჩინეთ საქართველოს სილამაზე ჩვენი საგულდაგულოდ შერჩეული შიდა ტურებით - ერთდღიანი მოგზაურობიდან მრავალდღიან თავგადასავლებამდე.',
      ru: 'Откройте для себя красоту Грузии с помощью наших тщательно подобранных туров по стране — от однодневных поездок до многодневных приключений.',
      tr: 'Günlük gezilerden çok günlük maceralara kadar özenle seçilmiş yurt içi turlarımızla Gürcistan\'ın güzelliğini keşfedin.',
      ar: 'اكتشف جمال جورجيا من خلال جولاتنا المحلية المنسقة بعناية - بدءًا من الرحلات اليومية وحتى المغامرات التي تستغرق عدة أيام.',
      he: 'גלה את יופייה של ג\'ורג\'יה עם סיורי הפנים שלנו שנאספו בקפידה - מטיולי יום ועד להרפתקאות ארוכות.',
      uk: 'Відкрийте для себе красу Грузії з нашими ретельно підібраними внутрішніми турами - від одноденних до багатоденних пригод.',
    },
    'Find Your Perfect Tour': {
      ka: 'იპოვე შენი იდეალური ტური',
      ru: 'Найдите свой идеальный тур',
      tr: 'Mükemmel Turunuzu Bulun',
      ar: 'ابحث عن جولتك المثالية',
      he: 'מצא את הסיור המושלם שלך',
      uk: 'Знайдіть свій ідеальний тур',
    },
    'Choose your preferred category and discover an experience that fits your time and interests.': {
      ka: 'აირჩიეთ თქვენთვის სასურველი კატეგორია და აღმოაჩინეთ გამოცდილება, რომელიც შეესაბამება თქვენს დროსა და ინტერესებს.',
      ru: 'Выберите предпочитаемую категорию и откройте для себя опыт, который соответствует вашему времени и интересам.',
      tr: 'Tercih ettiğiniz kategoriyi seçin ve zamanınıza ve ilgi alanlarınıza uygun bir deneyimi keşfedin.',
      ar: 'اختر الفئة المفضلة لديك واكتشف تجربة تناسب وقتك واهتماماتك.',
      he: 'בחר את הקטגוריה המועדפת עליך וגלה חוויה שמתאימה לזמנך ולתחומי העניין שלך.',
      uk: 'Виберіть потрібну категорію та знайдіть досвід, який відповідає вашому часу та інтересам.',
    },
    'Why Book With Georgia Trips': {
      ka: 'რატომ დაჯავშნოთ მოგზაურობები საქართველოში',
      ru: 'Зачем бронировать туры в Грузию',
      tr: 'Neden Gürcistan Gezileriyle Rezervasyon Yapmalısınız?',
      ar: 'لماذا الحجز مع رحلات جورجيا',
      he: 'למה להזמין עם טיולי ג\'ורג\'יה',
      uk: 'Навіщо бронювати тури в Грузію',
    },
    'Explore Beyond Borders': {
      ka: 'გამოიკვლიეთ საზღვრებს მიღმა',
      ru: 'Исследуйте за пределами границ',
      tr: 'Sınırların Ötesini Keşfedin',
      ar: 'اكتشف ما وراء الحدود',
      he: 'חקור מעבר לגבולות',
      uk: 'Досліджуйте межі',
    },
    'Travel beyond Georgia and discover exciting places with our international tours.': {
      ka: 'იმოგზაურეთ საქართველოს ფარგლებს გარეთ და აღმოაჩინეთ საინტერესო ადგილები ჩვენი საერთაშორისო ტურებით.',
      ru: 'Путешествуйте за пределы Грузии и открывайте для себя захватывающие места с нашими международными турами.',
      tr: 'Uluslararası turlarımızla Gürcistan\'ın ötesine geçin ve heyecan verici yerleri keşfedin.',
      ar: 'سافر خارج جورجيا واكتشف الأماكن المثيرة من خلال جولاتنا الدولية.',
      he: 'סעו מעבר לג\'ורג\'יה וגלו מקומות מרגשים עם הסיורים הבינלאומיים שלנו.',
      uk: 'Подорожуйте за межі Грузії та відкривайте захоплюючі місця з нашими міжнародними турами.',
    },
    'Find Your Perfect Adventure': {
      ka: 'იპოვე შენი სრულყოფილი თავგადასავალი',
      ru: 'Найдите свое идеальное приключение',
      tr: 'Mükemmel Maceranızı Bulun',
      ar: 'ابحث عن مغامرتك المثالية',
      he: 'מצא את ההרפתקה המושלמת שלך',
      uk: 'Знайдіть свою ідеальну пригоду',
    },
    'Select a category below to explore international travel experiences.': {
      ka: 'აირჩიეთ ქვემოთ მოცემული კატეგორია საერთაშორისო მოგზაურობის გამოცდილების შესასწავლად.',
      ru: 'Выберите категорию ниже, чтобы изучить опыт международных путешествий.',
      tr: 'Uluslararası seyahat deneyimlerini keşfetmek için aşağıdan bir kategori seçin.',
      ar: 'اختر فئة أدناه لاستكشاف تجارب السفر الدولية.',
      he: 'בחר קטגוריה למטה כדי לחקור חוויות נסיעות בינלאומיות.',
      uk: 'Виберіть категорію нижче, щоб дослідити досвід міжнародних подорожей.',
    },
    'Share This Tour': {
      ka: 'გააზიარეთ ეს ტური',
      ru: 'Поделиться этим туром',
      tr: 'Bu Turu Paylaş',
      ar: 'شارك هذه الجولة',
      he: 'שתף את הסיור הזה',
      uk: 'Поділіться цим туром',
    },
    'Fill in your details and our team will confirm your reservation within 24 hours.': {
      ka: 'შეავსეთ თქვენი მონაცემები და ჩვენი გუნდი დაადასტურებს თქვენს ჯავშანს 24 საათის განმავლობაში.',
      ru: 'Заполните свои данные, и наша команда подтвердит ваше бронирование в течение 24 часов.',
      tr: 'Bilgilerinizi doldurun, ekibimiz 24 saat içinde rezervasyonunuzu onaylayacaktır.',
      ar: 'املأ بياناتك وسيقوم فريقنا بتأكيد حجزك خلال 24 ساعة.',
      he: 'מלא את הפרטים שלך והצוות שלנו יאשר את הזמנתך תוך 24 שעות.',
      uk: 'Заповніть свої дані, і наша команда підтвердить ваше бронювання протягом 24 годин.',
    },
    'Vehicle Specifications': {
      ka: 'ავტომობილის სპეციფიკაციები',
      ru: 'Технические характеристики автомобиля',
      tr: 'Araç Özellikleri',
      ar: 'مواصفات السيارة',
      he: 'מפרט רכב',
      uk: 'Технічні характеристики автомобіля',
    },
    'Included': {
      ka: 'შედის',
      ru: 'Включено',
      tr: 'Dahil',
      ar: 'متضمنة',
      he: 'כּוֹלֵל',
      uk: 'В комплекті',
    },
    'Air Conditioning': {
      ka: 'კონდიციონერი',
      ru: 'Кондиционер',
      tr: 'Klima',
      ar: 'تكييف',
      he: 'מיזוג אוויר',
      uk: 'Кондиціонер',
    },
    'Yes': {
      ka: 'დიახ',
      ru: 'Да',
      tr: 'Evet',
      ar: 'نعم',
      he: 'כֵּן',
      uk: 'так',
    },
    'About This Vehicle': {
      ka: 'ამ მანქანის შესახებ',
      ru: 'Об этом автомобиле',
      tr: 'Bu Araç Hakkında',
      ar: 'حول هذه السيارة',
      he: 'על הרכב הזה',
      uk: 'Про цей транспортний засіб',
    },
    'Professional driver who speaks your preferred language': {
      ka: 'პროფესიონალი მძღოლი, რომელიც საუბრობს თქვენთვის სასურველ ენაზე',
      ru: 'Профессиональный водитель, говорящий на предпочитаемом вами языке.',
      tr: 'Tercih ettiğiniz dili konuşan profesyonel sürücü',
      ar: 'سائق محترف يتحدث لغتك المفضلة',
      he: 'נהג מקצועי הדובר את השפה המועדפת עליך',
      uk: 'Професійний водій, який розмовляє улюбленою мовою',
    },
    'Full insurance on every trip': {
      ka: 'სრული დაზღვევა ყოველ მოგზაურობაზე',
      ru: 'Полная страховка в каждой поездке',
      tr: 'Her yolculukta tam sigorta',
      ar: 'تأمين كامل في كل رحلة',
      he: 'ביטוח מלא בכל נסיעה',
      uk: 'Повна страховка на кожну поїздку',
    },
    'Fuel included in the price': {
      ka: 'საწვავი შედის ფასში',
      ru: 'Топливо включено в стоимость',
      tr: 'Yakıt fiyata dahildir',
      ar: 'الوقود المدرجة في السعر',
      he: 'דלק כלול במחיר',
      uk: 'Паливо входить у вартість',
    },
    'Bottled water for all passengers': {
      ka: 'ჩამოსხმული წყალი ყველა მგზავრისთვის',
      ru: 'Бутилированная вода для всех пассажиров',
      tr: 'Tüm yolcular için şişelenmiş su',
      ar: 'زجاجات مياه لجميع الركاب',
      he: 'מים בבקבוקים לכל הנוסעים',
      uk: 'Бутильована вода для всіх пасажирів',
    },
    'Free hotel pickup and drop-off': {
      ka: 'სასტუმროს უფასო მიღება და გამგზავრება',
      ru: 'Бесплатный трансфер из отеля и обратно',
      tr: 'Ücretsiz otelden alma ve otele bırakma',
      ar: 'خدمة الاستقبال في الفندق والتوصيل مجانًا',
      he: 'איסוף והחזרה חינם במלון',
      uk: 'Безкоштовний трансфер із готелю',
    },
    'Clean, air-conditioned cabin': {
      ka: 'სუფთა, კონდიცირებულ სალონში',
      ru: 'Чистый салон с кондиционером',
      tr: 'Temiz, klimalı kabin',
      ar: 'كابينة نظيفة ومكيفة',
      he: 'בקתה נקייה וממוזגת',
      uk: 'Чиста кабіна з кондиціонером',
    },
    'Flexible route and timing': {
      ka: 'მოქნილი მარშრუტი და დრო',
      ru: 'Гибкий маршрут и время',
      tr: 'Esnek rota ve zamanlama',
      ar: 'طريق وتوقيت مرن',
      he: 'מסלול ותזמון גמישים',
      uk: 'Гнучкий маршрут і час',
    },
    'Good to Know': {
      ka: 'კარგია იცოდე',
      ru: 'Полезно знать',
      tr: 'Bilmek Güzel',
      ar: 'من الجيد أن نعرف',
      he: 'טוב לדעת',
      uk: 'Корисно знати',
    },
    'Flexible Booking': {
      ka: 'მოქნილი დაჯავშნა',
      ru: 'Гибкое бронирование',
      tr: 'Esnek Rezervasyon',
      ar: 'حجز مرن',
      he: 'הזמנה גמישה',
      uk: 'Гнучке бронювання',
    },
    'You can change or cancel your booking up to 24 hours before the trip, free of charge.': {
      ka: 'თქვენ შეგიძლიათ შეცვალოთ ან გააუქმოთ თქვენი ჯავშანი მოგზაურობამდე 24 საათით ადრე, უფასოდ.',
      ru: 'Вы можете бесплатно изменить или отменить бронирование не позднее, чем за 24 часа до поездки.',
      tr: 'Rezervasyonunuzu yolculuktan 24 saat öncesine kadar ücretsiz olarak değiştirebilir veya iptal edebilirsiniz.',
      ar: 'يمكنك تغيير أو إلغاء حجزك قبل 24 ساعة من الرحلة مجانًا.',
      he: 'ניתן לשנות או לבטל את ההזמנה עד 24 שעות לפני הנסיעה, ללא עלות.',
      uk: 'Ви можете безкоштовно змінити або скасувати своє бронювання за 24 години до поїздки.',
    },
    'Luggage Friendly': {
      ka: 'ბარგის მეგობრული',
      ru: 'Багаж разрешен',
      tr: 'Bagaj Dostu',
      ar: 'الأمتعة ودية',
      he: 'ידידותי למטען',
      uk: 'Приємний багаж',
    },
    'Every vehicle has enough space for suitcases, backpacks and travel gear.': {
      ka: 'ყველა მანქანას აქვს საკმარისი ადგილი ჩემოდნებისთვის, ზურგჩანთებისთვის და სამგზავრო ხელსაწყოებისთვის.',
      ru: 'В каждом автомобиле достаточно места для чемоданов, рюкзаков и дорожного снаряжения.',
      tr: 'Her araçta valizler, sırt çantaları ve seyahat malzemeleri için yeterli alan vardır.',
      ar: 'تحتوي كل مركبة على مساحة كافية لحقائب السفر وحقائب الظهر ومعدات السفر.',
      he: 'בכל רכב יש מספיק מקום למזוודות, תרמילים וציוד נסיעה.',
      uk: 'У кожному транспортному засобі достатньо місця для валіз, рюкзаків і туристичного спорядження.',
    },
    'Multilingual Driver': {
      ka: 'მრავალენოვანი დრაივერი',
      ru: 'Многоязычный драйвер',
      tr: 'Çok Dilli Sürücü',
      ar: 'سائق متعدد اللغات',
      he: 'נהג רב לשוני',
      uk: 'Багатомовний драйвер',
    },
    'Safety First': {
      ka: 'უსაფრთხოება პირველ რიგში',
      ru: 'Безопасность превыше всего',
      tr: 'Önce Güvenlik',
      ar: 'السلامة أولا',
      he: 'בטיחות ראשונה',
      uk: 'Безпека перш за все',
    },
    'All vehicles are checked regularly and meet strict safety standards.': {
      ka: 'ყველა მანქანა რეგულარულად შემოწმდება და აკმაყოფილებს უსაფრთხოების მკაცრ სტანდარტებს.',
      ru: 'Все автомобили регулярно проверяются и соответствуют строгим стандартам безопасности.',
      tr: 'Tüm araçlar düzenli olarak kontrol edilir ve sıkı güvenlik standartlarına uygundur.',
      ar: 'يتم فحص جميع المركبات بانتظام وتفي بمعايير السلامة الصارمة.',
      he: 'כל הרכבים נבדקים באופן שוטף ועומדים בתקני בטיחות מחמירים.',
      uk: 'Усі транспортні засоби регулярно перевіряються та відповідають суворим стандартам безпеки.',
    },
    'Book This Vehicle': {
      ka: 'დაჯავშნეთ ეს მანქანა',
      ru: 'Забронируйте этот автомобиль',
      tr: 'Bu Aracı Rezervasyon Yap',
      ar: 'احجز هذه السيارة',
      he: 'הזמן את הרכב הזה',
      uk: 'Забронюйте цей автомобіль',
    },
    'Share This Car': {
      ka: 'გააზიარე ეს მანქანა',
      ru: 'Поделитесь этим автомобилем',
      tr: 'Bu Arabayı Paylaş',
      ar: 'شارك هذه السيارة',
      he: 'שתף את המכונית הזו',
      uk: 'Поділіться цією машиною',
    },
    'Fast confirmation': {
      ka: 'სწრაფი დადასტურება',
      ru: 'Быстрое подтверждение',
      tr: 'Hızlı onay',
      ar: 'تأكيد سريع',
      he: 'אישור מהיר',
      uk: 'Швидке підтвердження',
    },
    'Pay on pickup': {
      ka: 'გადახდა პიკაპზე',
      ru: 'Оплата при получении',
      tr: 'Teslim alırken ödeme yapın',
      ar: 'الدفع عند الاستلام',
      he: 'שלם באיסוף',
      uk: 'Pay on pickup',
    },
    'Fully insured': {
      ka: 'სრულად დაზღვეული',
      ru: 'Полностью застрахован',
      tr: 'Tamamen sigortalı',
      ar: 'مؤمنة بالكامل',
      he: 'מבוטח באופן מלא',
      uk: 'Повністю застрахований',
    },
    'Need Help?': {
      ka: 'გჭირდებათ დახმარება?',
      ru: 'Нужна помощь?',
      tr: 'Yardıma mı ihtiyacınız var?',
      ar: 'هل تحتاج إلى مساعدة؟',
      he: 'צריך עזרה?',
      uk: 'Потрібна допомога?',
    },
    'Our team is ready to answer any question about this car.': {
      ka: 'ჩვენი გუნდი მზად არის უპასუხოს ნებისმიერ შეკითხვას ამ მანქანის შესახებ.',
      ru: 'Наша команда готова ответить на любой вопрос об этом автомобиле.',
      tr: 'Ekibimiz bu araba ile ilgili her türlü soruyu yanıtlamaya hazır.',
      ar: 'فريقنا جاهز للإجابة على أي سؤال حول هذه السيارة.',
      he: 'הצוות שלנו מוכן לענות על כל שאלה בנוגע לרכב הזה.',
      uk: 'Наша команда готова відповісти на будь-яке запитання щодо цього автомобіля.',
    },
    'WhatsApp': {
      ka: 'WhatsApp',
      ru: 'WhatsApp',
      tr: 'WhatsApp',
      ar: 'واتساب',
      he: 'וואטסאפ',
      uk: 'WhatsApp',
    },
    'Call Us': {
      ka: 'დაგვირეკეთ',
      ru: 'Позвоните нам',
      tr: 'Bizi Arayın',
      ar: 'اتصل بنا',
      he: 'התקשר אלינו',
      uk: 'Телефонуйте нам',
    },
    'Pick-up Location': {
      ka: 'აყვანის მდებარეობა',
      ru: 'Место получения',
      tr: 'Teslim Alma Konumu',
      ar: 'موقع البيك اب',
      he: 'מיקום איסוף',
      uk: 'Місце отримання',
    },
    'Hotel, airport or address': {
      ka: 'სასტუმრო, აეროპორტი ან მისამართი',
      ru: 'Отель, аэропорт или адрес',
      tr: 'Otel, havaalanı veya adres',
      ar: 'الفندق أو المطار أو العنوان',
      he: 'מלון, שדה תעופה או כתובת',
      uk: 'Готель, аеропорт або адреса',
    },
    'Additional Notes': {
      ka: 'დამატებითი შენიშვნები',
      ru: 'Дополнительные примечания',
      tr: 'Ek Notlar',
      ar: 'ملاحظات إضافية',
      he: 'הערות נוספות',
      uk: 'Додаткові примітки',
    },
    'Route, stops or any special request': {
      ka: 'მარშრუტი, გაჩერებები ან რაიმე განსაკუთრებული მოთხოვნა',
      ru: 'Маршрут, остановки или любой специальный запрос',
      tr: 'Rota, duraklar veya herhangi bir özel istek',
      ar: 'الطريق، يتوقف أو أي طلب خاص',
      he: 'מסלול, עצירות או כל בקשה מיוחדת',
      uk: 'Маршрут, зупинки або будь-який спеціальний запит',
    },
    'Send Booking Request': {
      ka: 'დაჯავშნის მოთხოვნის გაგზავნა',
      ru: 'Отправить запрос на бронирование',
      tr: 'Rezervasyon Talebi Gönder',
      ar: 'إرسال طلب الحجز',
      he: 'שלח בקשת הזמנה',
      uk: 'Надіслати запит на бронювання',
    },
    'per day': {
      ka: 'დღეში',
      ru: 'в день',
      tr: 'günlük',
      ar: 'يوميا',
      he: 'ליום',
      uk: 'на день',
    },


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
    const normalizedSrc = String(src).trim().replace(/\s+/g, ' ');
    const entry = PHRASES[normalizedSrc];
    if (!entry) return null;
    return entry[lang] || null;
  }

  window.t = t;
  window.GTUIStrings = { t, lookupPhrase, STRINGS, PHRASES };
})();
