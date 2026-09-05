const http = require('http');

function makeBookingRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/bookings/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let resData = '';
      res.on('data', (chunk) => { resData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runSecurityTests() {
  console.log('========================================================');
  console.log('🔒 RUNNING COUPON SECURITY & VALIDATION AUDIT TESTS');
  console.log('========================================================\n');

  const exploits = ['TEST50', 'FAKE99', 'PROMO50', 'ABC20', 'WELCOME50', 'DISCOUNT40'];

  let counter = 10;
  for (const fakeCode of exploits) {
    counter++;
    const payload = {
      type: 'tour',
      tourTitle: 'Security Test Tour',
      price: 200,
      unitPrice: 200,
      people: 1,
      name: `Security Tester ${counter}`,
      phone: `+9955990011${counter}`,
      couponCode: fakeCode,
    };

    const res = await makeBookingRequest(payload);
    const booking = res.data?.booking;
    const finalPrice = booking ? booking.totalPrice : null;
    const discountGiven = finalPrice !== null ? 200 - finalPrice : null;

    console.log(`Testing Fake Code: "${fakeCode}"`);
    console.log(`Status: ${res.status}`);
    console.log(`Base Price: 200 GEL | Final Price: ${finalPrice} GEL`);
    console.log(`Discount Given: ${discountGiven} GEL`);
    if (discountGiven === 0 && finalPrice === 200) {
      console.log(`✅ EXPLOIT BLOCKED! No unauthorized discount applied.\n`);
    } else {
      console.log(`❌ VULNERABILITY! Unexpected response: ${JSON.stringify(res.data)}\n`);
    }
  }

  // Test legitimate coupon
  console.log('--- Testing Legitimate Authorized Coupon: "WELCOME10" ---');
  const legitPayload = {
    type: 'tour',
    tourTitle: 'Legit Test Tour',
    price: 300,
    unitPrice: 300,
    people: 1,
    name: 'Legitimate Customer',
    phone: '+995599998877',
    couponCode: 'WELCOME10',
  };

  const legitRes = await makeBookingRequest(legitPayload);
  const legitBooking = legitRes.data?.booking;
  const legitFinalPrice = legitBooking?.totalPrice;
  const legitDiscount = 300 - (legitFinalPrice || 300);

  console.log(`Status: ${legitRes.status}`);
  console.log(`Base Price: 300 GEL | Final Price: ${legitFinalPrice} GEL`);
  console.log(`Discount Given: ${legitDiscount} GEL`);
  if (legitDiscount === 30 && legitFinalPrice === 270) {
    console.log(`✅ WELCOME10 applied accurately (10% discount = 30 GEL).\n`);
  } else {
    console.log(`⚠️ Expected 30 GEL discount, got: ${legitDiscount}\n`);
  }
}

runSecurityTests();
