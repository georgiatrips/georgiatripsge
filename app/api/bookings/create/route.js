import { NextResponse } from "next/server";
import { collection, addDoc, setDoc, getDocs, query, where, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { generateBookingId, generateAccessToken, isValidPhone, BOOKING_STATUSES } from "../../../lib/bookingModel";

// Short-term in-memory cache for anti-spam / duplicate prevention (60 seconds)
const recentSubmissions = new Map();

function cleanOldSubmissions() {
  const now = Date.now();
  for (const [key, timestamp] of recentSubmissions.entries()) {
    if (now - timestamp > 60000) {
      recentSubmissions.delete(key);
    }
  }
}

export async function POST(request) {
  try {
    cleanOldSubmissions();

    const body = await request.json();
    const {
      type = "tour",
      tourId = "",
      tourTitle = "",
      tourType = "group",
      date = "",
      name = "",
      phone = "",
      email = "",
      people = 1,
      adults = 1,
      children = 0,
      channel = "WhatsApp",
      notes = "",
      couponCode = null,
      language = "ka",
      source = {},
    } = body;

    // 1. Validate mandatory fields
    const rawName = String(name || "").trim();
    const cleanName = rawName || (type === "transfer" ? "მგზავრი / Guest" : "");
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ მიუთითოთ თქვენი სახელი (მინიმუმ 2 სიმბოლო)" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || "").trim();
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ მიუთითოთ ვალიდური ტელეფონის ნომერი" },
        { status: 400 }
      );
    }

    const totalPeople = Math.max(1, parseInt(people, 10) || 1);

    // 2. Anti-duplicate / Idempotency check (within 60 seconds)
    const idempotencyKey = `${cleanPhone}_${tourId}_${date}_${totalPeople}`.toLowerCase();
    if (recentSubmissions.has(idempotencyKey)) {
      const existing = recentSubmissions.get(idempotencyKey);
      if (Date.now() - existing.time < 60000) {
        return NextResponse.json({
          success: true,
          bookingId: existing.bookingId,
          accessToken: existing.accessToken,
          isDuplicate: true,
          message: "თქვენი ჯავშანი უკვე მიღებულია",
        });
      }
    }

    // 3. Trusted Server-side Price Calculation
    let unitPrice = 0;
    let baseTotalPrice = 0;
    let calculatedTourTitle = tourTitle || "Georgia Tour";

    if (type === "tour" && tourId) {
      try {
        const tourRef = doc(db, "tours", tourId);
        const tourSnap = await getDoc(tourRef);
        if (tourSnap.exists()) {
          const tData = tourSnap.data();
          const tPriceGroup = Number(tData.priceGroupNum) || (parseInt(String(tData.priceGroup || "0").replace(/\D/g, ""), 10) || 0);
          const tPricePrivate = Number(tData.pricePrivateNum) || (parseInt(String(tData.pricePrivate || "0").replace(/\D/g, ""), 10) || 0);

          if (tourType === "group") {
            unitPrice = tPriceGroup > 0 ? tPriceGroup : (body.unitPrice || 0);
            baseTotalPrice = unitPrice * totalPeople;
          } else {
            unitPrice = tPricePrivate > 0 ? tPricePrivate : (body.unitPrice || 0);
            baseTotalPrice = unitPrice;
          }

          if (tData.title) {
            calculatedTourTitle = typeof tData.title === "string" ? tData.title : (tData.title[language] || tData.title.ka || tourTitle);
          }
        } else {
          // Fallback to trusted body price if tour not in firestore
          baseTotalPrice = Number(body.price) || Number(body.baseTotalPrice) || 0;
          unitPrice = totalPeople > 0 ? Math.round(baseTotalPrice / totalPeople) : baseTotalPrice;
        }
      } catch (err) {
        baseTotalPrice = Number(body.price) || 0;
        unitPrice = totalPeople > 0 ? Math.round(baseTotalPrice / totalPeople) : baseTotalPrice;
      }
    } else {
      baseTotalPrice = Number(body.price) || 0;
      unitPrice = baseTotalPrice;
    }

    // 4. Validate coupon discount server-side
    let discountPercent = 0;
    let cleanCouponCode = null;
    if (couponCode && typeof couponCode === "string") {
      cleanCouponCode = couponCode.trim().toUpperCase();
      if (cleanCouponCode === "WELCOME10" || cleanCouponCode === "GEO10" || cleanCouponCode === "COUPON10") {
        discountPercent = 10;
      } else if (/^([A-Z]+)(\d{1,2})$/.test(cleanCouponCode)) {
        const match = cleanCouponCode.match(/^([A-Z]+)(\d{1,2})$/);
        discountPercent = Math.min(50, parseInt(match[2], 10));
      }
    }

    const discountAmount = discountPercent > 0 && baseTotalPrice > 0
      ? Math.round(baseTotalPrice * (discountPercent / 100))
      : 0;
    const finalTotalPrice = Math.max(0, baseTotalPrice - discountAmount);

    // 5. Generate unique Booking ID & Secure Access Token
    const bookingId = generateBookingId();
    const accessToken = generateAccessToken();

    // 6. Build structured booking document
    const bookingDoc = {
      bookingId,
      accessToken,
      status: BOOKING_STATUSES.PENDING,
      type,
      tourId,
      tourTitle: calculatedTourTitle,
      tourSlug: tourId,
      tourType,

      customer: {
        fullName: cleanName,
        phone: cleanPhone,
        email: String(email || "").trim(),
        whatsapp: cleanPhone,
        messengerPref: channel,
        country: body.country || "Georgia",
        language,
      },

      trip: {
        date: date || "by_agreement",
        adults: Math.max(1, parseInt(adults, 10) || totalPeople),
        children: Math.max(0, parseInt(children, 10) || 0),
        totalPeople,
      },

      pricing: {
        unitPrice,
        baseTotalPrice,
        couponCode: cleanCouponCode,
        discountPercent,
        discountAmount,
        totalPrice: finalTotalPrice,
        currency: "GEL",
      },

      source: {
        source: source.source || "website",
        utm_source: source.utm_source || "",
        utm_medium: source.utm_medium || "",
        utm_campaign: source.utm_campaign || "",
        utm_content: source.utm_content || "",
        fbclid: source.fbclid || "",
        landingPage: source.landingPage || "",
      },

      meta: {
        eventId: bookingId,
      },

      notes: {
        customerNotes: String(notes || "").trim(),
        adminNotes: "",
      },

      admin: {
        confirmedAt: null,
        confirmedBy: null,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        completedAt: null,
      },

      createdAt: serverTimestamp(),
      createdAtMillis: Date.now(),
      updatedAt: serverTimestamp(),
    };

    // 7. Save to Firestore (doc ID = bookingId)
    await setDoc(doc(db, "bookings", bookingId), bookingDoc);

    // Record in local cache for duplicate prevention
    recentSubmissions.set(idempotencyKey, {
      time: Date.now(),
      bookingId,
      accessToken,
    });

    return NextResponse.json({
      success: true,
      bookingId,
      accessToken,
      docId: bookingId,
      booking: {
        bookingId,
        tourTitle: calculatedTourTitle,
        date: bookingDoc.trip.date,
        totalPeople,
        totalPrice: finalTotalPrice,
        currency: "GEL",
        status: BOOKING_STATUSES.PENDING,
      },
    });
  } catch (error) {
    console.error("[api/bookings/create] Error:", error);
    return NextResponse.json(
      { success: false, error: "ჯავშნის შექმნა ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა.", details: error.message },
      { status: 500 }
    );
  }
}
