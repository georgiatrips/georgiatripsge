export function formatPriceStr(priceStr, langOrIsEnglish, isRussian) {
  if (!priceStr) return "";
  const isRu = langOrIsEnglish === "ru" || isRussian === true;
  const isEn = langOrIsEnglish === "en" || langOrIsEnglish === true;
  const isTr = langOrIsEnglish === "tr";
  const isAr = langOrIsEnglish === "ar";
  const source = String(priceStr);

  if (isRu) return source.replace(/\/კაცი/g, "/чел").replace(/კაცი/g, "чел").replace(/შესასვლელი ბილეთები/g, "входные билеты");
  if (isEn) return source.replace(/\/კაცი/g, "/person").replace(/კაცი/g, "person").replace(/შესასვლელი ბილეთები/g, "entrance tickets");
  if (isTr) return source.replace(/\/კაცი/g, "/kişi").replace(/კაცი/g, "kişi").replace(/შესასვლელი ბილეთები/g, "giriş biletleri");
  if (isAr) return source.replace(/\/კაცი/g, "/شخص").replace(/კაცი/g, "شخص").replace(/შესასვლელი ბილეთები/g, "تذاكر الدخول");
  return source;
}
