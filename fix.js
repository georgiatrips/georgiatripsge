const fs = require('fs');
let c = fs.readFileSync('app/tours/[id]/page.js', 'utf8');
c = c.replace(
  /<span className="tdp-promo-badge">✦ პრემიუმ ექსკურსიები<\/span>[\s\S]*?<p className="tdp-promo-subtitle">[\s\S]*?<\/p>/,
  `<span className="tdp-promo-badge">დაგვიკავშირდით</span>
              <h2 className="tdp-promo-title">
                დაგეგმეთ თქვენი დაუვიწყარი მოგზაურობა ჩვენთან ერთად
              </h2>
              <p className="tdp-promo-subtitle">
                მოგვწერეთ ნებისმიერ დროს
              </p>`
);
fs.writeFileSync('app/tours/[id]/page.js', c);
