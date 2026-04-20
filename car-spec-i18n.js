// ============================================================
//  GEORGIA TRIPS — Car spec value translator
//  Translates free-text spec values (transmission / fuel / color)
//  typed by the admin in Georgian or English into the user's
//  current language.
// ============================================================
(function () {
  'use strict';

  // A lowercase source key maps to a dictionary of translations.
  // Keys are matched in a case-insensitive, whitespace-trimmed way.
  // Admin may type Georgian OR English — we try to resolve both.
  const SPEC_DICT = {
    /* ── Transmission ───────────────────────────────────────── */
    'ავტომატური': { ka: 'ავტომატური', en: 'Automatic', ru: 'Автомат',      tr: 'Otomatik', ar: 'أوتوماتيكي',    he: 'אוטומטי',          uk: 'Автомат' },
    'automatic':  { ka: 'ავტომატური', en: 'Automatic', ru: 'Автомат',      tr: 'Otomatik', ar: 'أوتوماتيكي',    he: 'אוטומטי',          uk: 'Автомат' },
    'auto':       { ka: 'ავტომატური', en: 'Automatic', ru: 'Автомат',      tr: 'Otomatik', ar: 'أوتوماتيكي',    he: 'אוטומטי',          uk: 'Автомат' },
    'მექანიკური': { ka: 'მექანიკური', en: 'Manual',    ru: 'Механика',     tr: 'Manuel',   ar: 'يدوي',           he: 'ידני',              uk: 'Механіка' },
    'manual':     { ka: 'მექანიკური', en: 'Manual',    ru: 'Механика',     tr: 'Manuel',   ar: 'يدوي',           he: 'ידני',              uk: 'Механіка' },
    'mechanic':   { ka: 'მექანიკური', en: 'Manual',    ru: 'Механика',     tr: 'Manuel',   ar: 'يدوي',           he: 'ידני',              uk: 'Механіка' },
    'ნახევრად ავტომატური': { ka: 'ნახევრად ავტომატური', en: 'Semi-automatic', ru: 'Полуавтомат', tr: 'Yarı otomatik', ar: 'نصف أوتوماتيكي', he: 'חצי-אוטומטי', uk: 'Напівавтомат' },
    'semi-automatic': { ka: 'ნახევრად ავტომატური', en: 'Semi-automatic', ru: 'Полуавтомат', tr: 'Yarı otomatik', ar: 'نصف أوتوماتيكي', he: 'חצי-אוטומטי', uk: 'Напівавтомат' },
    'cvt':        { ka: 'ვარიატორი (CVT)', en: 'CVT',       ru: 'Вариатор (CVT)', tr: 'CVT',     ar: 'CVT',           he: 'CVT',               uk: 'Варіатор (CVT)' },
    'ვარიატორი':  { ka: 'ვარიატორი',   en: 'CVT',       ru: 'Вариатор',     tr: 'CVT',      ar: 'CVT',            he: 'CVT',               uk: 'Варіатор' },

    /* ── Fuel ───────────────────────────────────────────────── */
    'ბენზინი':   { ka: 'ბენზინი',   en: 'Petrol',   ru: 'Бензин',   tr: 'Benzin', ar: 'بنزين',   he: 'בנזין',   uk: 'Бензин' },
    'petrol':    { ka: 'ბენზინი',   en: 'Petrol',   ru: 'Бензин',   tr: 'Benzin', ar: 'بنزين',   he: 'בנזין',   uk: 'Бензин' },
    'gasoline':  { ka: 'ბენზინი',   en: 'Gasoline', ru: 'Бензин',   tr: 'Benzin', ar: 'بنزين',   he: 'בנזין',   uk: 'Бензин' },
    'gas':       { ka: 'ბენზინი',   en: 'Petrol',   ru: 'Бензин',   tr: 'Benzin', ar: 'بنزين',   he: 'בנזין',   uk: 'Бензин' },
    'დიზელი':    { ka: 'დიზელი',    en: 'Diesel',   ru: 'Дизель',   tr: 'Dizel',  ar: 'ديزل',    he: 'דיזל',    uk: 'Дизель' },
    'diesel':    { ka: 'დიზელი',    en: 'Diesel',   ru: 'Дизель',   tr: 'Dizel',  ar: 'ديزل',    he: 'דיזל',    uk: 'Дизель' },
    'ჰიბრიდი':   { ka: 'ჰიბრიდი',   en: 'Hybrid',   ru: 'Гибрид',   tr: 'Hibrit', ar: 'هجين',    he: 'היברידי', uk: 'Гібрид' },
    'hybrid':    { ka: 'ჰიბრიდი',   en: 'Hybrid',   ru: 'Гибрид',   tr: 'Hibrit', ar: 'هجين',    he: 'היברידי', uk: 'Гібрид' },
    'ელექტრო':   { ka: 'ელექტრო',   en: 'Electric', ru: 'Электро',  tr: 'Elektrikli', ar: 'كهربائي', he: 'חשמלי', uk: 'Електро' },
    'ელექტრული': { ka: 'ელექტრული', en: 'Electric', ru: 'Электро',  tr: 'Elektrikli', ar: 'كهربائي', he: 'חשמלי', uk: 'Електро' },
    'electric':  { ka: 'ელექტრო',   en: 'Electric', ru: 'Электро',  tr: 'Elektrikli', ar: 'كهربائي', he: 'חשמלי', uk: 'Електро' },
    'lpg':       { ka: 'გაზი (LPG)', en: 'LPG',     ru: 'Газ (LPG)', tr: 'LPG',   ar: 'غاز LPG', he: 'גז (LPG)', uk: 'Газ (LPG)' },
    'cng':       { ka: 'გაზი (CNG)', en: 'CNG',     ru: 'Газ (CNG)', tr: 'CNG',   ar: 'غاز CNG', he: 'גז (CNG)', uk: 'Газ (CNG)' },
    'გაზი':      { ka: 'გაზი',      en: 'LPG',      ru: 'Газ',       tr: 'LPG',    ar: 'غاز',    he: 'גז',       uk: 'Газ' },

    /* ── Color ──────────────────────────────────────────────── */
    'შავი':        { ka: 'შავი',        en: 'Black',  ru: 'Чёрный',     tr: 'Siyah',     ar: 'أسود',   he: 'שחור',    uk: 'Чорний' },
    'black':       { ka: 'შავი',        en: 'Black',  ru: 'Чёрный',     tr: 'Siyah',     ar: 'أسود',   he: 'שחור',    uk: 'Чорний' },
    'თეთრი':       { ka: 'თეთრი',       en: 'White',  ru: 'Белый',      tr: 'Beyaz',     ar: 'أبيض',   he: 'לבן',     uk: 'Білий' },
    'white':       { ka: 'თეთრი',       en: 'White',  ru: 'Белый',      tr: 'Beyaz',     ar: 'أبيض',   he: 'לבן',     uk: 'Білий' },
    'ნაცრისფერი':  { ka: 'ნაცრისფერი',  en: 'Gray',   ru: 'Серый',      tr: 'Gri',       ar: 'رمادي',  he: 'אפור',    uk: 'Сірий' },
    'gray':        { ka: 'ნაცრისფერი',  en: 'Gray',   ru: 'Серый',      tr: 'Gri',       ar: 'رمادي',  he: 'אפור',    uk: 'Сірий' },
    'grey':        { ka: 'ნაცრისფერი',  en: 'Grey',   ru: 'Серый',      tr: 'Gri',       ar: 'رمادي',  he: 'אפור',    uk: 'Сірий' },
    'ვერცხლისფერი':{ ka: 'ვერცხლისფერი',en: 'Silver', ru: 'Серебристый',tr: 'Gümüş',     ar: 'فضي',    he: 'כסוף',    uk: 'Сріблястий' },
    'silver':      { ka: 'ვერცხლისფერი',en: 'Silver', ru: 'Серебристый',tr: 'Gümüş',     ar: 'فضي',    he: 'כסוף',    uk: 'Сріблястий' },
    'წითელი':      { ka: 'წითელი',      en: 'Red',    ru: 'Красный',    tr: 'Kırmızı',   ar: 'أحمر',   he: 'אדום',    uk: 'Червоний' },
    'red':         { ka: 'წითელი',      en: 'Red',    ru: 'Красный',    tr: 'Kırmızı',   ar: 'أحمر',   he: 'אדום',    uk: 'Червоний' },
    'ლურჯი':       { ka: 'ლურჯი',       en: 'Blue',   ru: 'Синий',      tr: 'Mavi',      ar: 'أزرق',   he: 'כחול',    uk: 'Синій' },
    'blue':        { ka: 'ლურჯი',       en: 'Blue',   ru: 'Синий',      tr: 'Mavi',      ar: 'أزرق',   he: 'כחול',    uk: 'Синій' },
    'მწვანე':      { ka: 'მწვანე',      en: 'Green',  ru: 'Зелёный',    tr: 'Yeşil',     ar: 'أخضر',   he: 'ירוק',    uk: 'Зелений' },
    'green':       { ka: 'მწვანე',      en: 'Green',  ru: 'Зелёный',    tr: 'Yeşil',     ar: 'أخضر',   he: 'ירוק',    uk: 'Зелений' },
    'ყვითელი':     { ka: 'ყვითელი',     en: 'Yellow', ru: 'Жёлтый',     tr: 'Sarı',      ar: 'أصفر',   he: 'צהוב',    uk: 'Жовтий' },
    'yellow':      { ka: 'ყვითელი',     en: 'Yellow', ru: 'Жёлтый',     tr: 'Sarı',      ar: 'أصفر',   he: 'צהוב',    uk: 'Жовтий' },
    'ყავისფერი':   { ka: 'ყავისფერი',   en: 'Brown',  ru: 'Коричневый', tr: 'Kahverengi',ar: 'بني',    he: 'חום',     uk: 'Коричневий' },
    'brown':       { ka: 'ყავისფერი',   en: 'Brown',  ru: 'Коричневый', tr: 'Kahverengi',ar: 'بني',    he: 'חום',     uk: 'Коричневий' },
    'ოქროსფერი':   { ka: 'ოქროსფერი',   en: 'Gold',   ru: 'Золотой',    tr: 'Altın',     ar: 'ذهبي',   he: 'זהב',     uk: 'Золотий' },
    'gold':        { ka: 'ოქროსფერი',   en: 'Gold',   ru: 'Золотой',    tr: 'Altın',     ar: 'ذهبي',   he: 'זהב',     uk: 'Золотий' },
    'ნარინჯისფერი':{ ka: 'ნარინჯისფერი',en: 'Orange', ru: 'Оранжевый',  tr: 'Turuncu',   ar: 'برتقالي',he: 'כתום',    uk: 'Помаранчевий' },
    'orange':      { ka: 'ნარინჯისფერი',en: 'Orange', ru: 'Оранжевый',  tr: 'Turuncu',   ar: 'برتقالي',he: 'כתום',    uk: 'Помаранчевий' },
    'ბეჟი':        { ka: 'ბეჟი',        en: 'Beige',  ru: 'Бежевый',    tr: 'Bej',       ar: 'بيج',    he: 'בז׳',     uk: 'Бежевий' },
    'beige':       { ka: 'ბეჟი',        en: 'Beige',  ru: 'Бежевый',    tr: 'Bej',       ar: 'بيج',    he: 'בז׳',     uk: 'Бежевий' },
    'იისფერი':     { ka: 'იისფერი',     en: 'Purple', ru: 'Фиолетовый', tr: 'Mor',       ar: 'بنفسجي', he: 'סגול',    uk: 'Фіолетовий' },
    'purple':      { ka: 'იისფერი',     en: 'Purple', ru: 'Фиолетовый', tr: 'Mor',       ar: 'بنفسجي', he: 'סגול',    uk: 'Фіолетовий' },
    'ვარდისფერი':  { ka: 'ვარდისფერი',  en: 'Pink',   ru: 'Розовый',    tr: 'Pembe',     ar: 'وردي',   he: 'ורוד',    uk: 'Рожевий' },
    'pink':        { ka: 'ვარდისფერი',  en: 'Pink',   ru: 'Розовый',    tr: 'Pembe',     ar: 'وردي',   he: 'ורוד',    uk: 'Рожевий' },

    /* ── "Seats" word inside the value (e.g. "7 Seats") ────── */
    'seats':    { ka: 'ადგილი',  en: 'Seats',   ru: 'мест',     tr: 'koltuk',    ar: 'مقاعد',   he: 'מושבים', uk: 'місць' },
    'seat':     { ka: 'ადგილი',  en: 'Seat',    ru: 'место',    tr: 'koltuk',    ar: 'مقعد',    he: 'מושב',   uk: 'місце' },
    'ადგილი':   { ka: 'ადგილი',  en: 'Seats',   ru: 'мест',     tr: 'koltuk',    ar: 'مقاعد',   he: 'מושבים', uk: 'місць' },
    'ადგილები': { ka: 'ადგილები',en: 'Seats',   ru: 'мест',     tr: 'koltuk',    ar: 'مقاعد',   he: 'מושבים', uk: 'місць' }
  };

  function currentLang() {
    try {
      return (window.currentLang || localStorage.getItem('lang') || 'ka').toLowerCase();
    } catch (e) { return 'ka'; }
  }

  // Translate a single token/word if it is in the dict.
  function translateToken(token, lang) {
    if (!token) return token;
    const key = token.trim().toLowerCase();
    if (!key) return token;
    const entry = SPEC_DICT[key];
    if (entry && entry[lang]) return entry[lang];
    return token;
  }

  // Main entry point.
  // Translates a free-text spec value like "ავტომატური", "7 Seats",
  // "ბენზინი", "Automatic / Diesel", etc.
  function translateSpec(value, lang) {
    if (value == null) return '';
    const str = String(value).trim();
    if (!str) return '';
    lang = (lang || currentLang()).toLowerCase();

    // Direct full-string match first.
    const direct = SPEC_DICT[str.toLowerCase()];
    if (direct && direct[lang]) return direct[lang];

    // Token-based translation: split on spaces, slashes, commas, hyphens
    // but KEEP the separators so the output reads naturally.
    const out = str.replace(/([^\s\/,\-]+)/g, (match) => translateToken(match, lang));
    return out;
  }

  window.translateSpecValue = translateSpec;
})();
