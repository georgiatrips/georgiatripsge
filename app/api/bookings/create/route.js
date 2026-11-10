import { NextResponse, after } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { generateBookingId, generateAccessToken, isValidPhone, BOOKING_STATUSES } from "../../../lib/bookingModel";
import { validateCouponServer, recordCouponUsage } from "../../../lib/server/couponUsage";
import { SERVER_TIME, readDoc, writeDoc } from "../../../lib/server/serverStore";
import { VEHICLES, getPrivateVehiclePrices } from "../../../lib/vehicles";
import { notifyNewBooking } from "../../../lib/server/notifyBooking";
import { requireAuthenticatedUser } from "../../../lib/server/adminAuth";
import { isTooLateToBook, tooLateMessage } from "../../../lib/bookingLeadTime";

// Free-text fields are capped: an oversized value would bloat the booking
// document, and a message over Telegram's 4096-character limit is rejected,
// so the team would never hear about that booking.
const clip = (value, max) => String(value ?? "").trim().slice(0, max);
const BOOKING_TYPES = ["tour", "transfer", "custom"];
const MAX_PEOPLE = 60;

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
    const type = BOOKING_TYPES.includes(body.type) ? body.type : "tour";
    const tourId = clip(body.tourId, 200);
    const tourTitle = clip(body.tourTitle, 300);
    // A transfer is always one party's own car.
    const tourType = type === "transfer" || body.tourType === "private" ? "private" : "group";
    const date = clip(body.date, 40);
    const {
      name = "",
      phone = "",
      email = "",
      // The transfer form sends its head count as "passengers".
      people = body.passengers ?? 1,
      adults = body.passengers ?? 1,
      children = 0,
      couponCode = null,
      vehicle = "",
    } = body;
    const channel = clip(body.channel || "WhatsApp", 30);
    const notes = clip(body.notes, 1500);
    const language = clip(body.language || "ka", 5);
    const source = body.source && typeof body.source === "object" ? body.source : {};

    // 1. Validate mandatory fields (fallback to Guest if name is empty)
    const rawName = clip(name, 120);
    const cleanName = rawName || (type === "transfer" ? "მგზავრი / Guest" : "მგზავრი / Guest");

    const cleanPhone = clip(phone || body.contactPhone, 32);
    if (!isValidPhone(cleanPhone)) {
      return NextResponse.json(
        { success: false, error: "გთხოვთ მიუთითოთ ვალიდური ტელეფონის ნომერი (მაგ: +995 5XX XX XX XX)" },
        { status: 400 }
      );
    }
    const finalPhone = cleanPhone;

    const totalPeople = Math.min(MAX_PEOPLE, Math.max(1, parseInt(people, 10) || 1));

    // 2. Anti-duplicate / Idempotency check (within 60 seconds)
    const idempotencyKey = `${finalPhone}_${tourId}_${date}_${totalPeople}`.toLowerCase();
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
    let bookedVehicle = VEHICLES[vehicle] ? vehicle : "";
    // True whenever the total below comes from the request body instead of
    // Firestore, so the team knows to check it before confirming.
    let clientPriced = false;
    // The tour's start time from the admin panel, for the 24-hour rule.
    let tourStartTime = "";

    if (type === "tour" && tourId) {
      try {
        const tourRef = doc(db, "tours", tourId);
        const tourSnap = await getDoc(tourRef);
        if (tourSnap.exists()) {
          const tData = tourSnap.data();
          if (tData.active === false) {
            return NextResponse.json(
              { success: false, error: "ეს ტური დროებით არ იჯავშნება / This tour is currently unavailable" },
              { status: 400 }
            );
          }
          if (typeof tData.startTime === "string") tourStartTime = tData.startTime;
          const tPriceGroup = Number(tData.priceGroupNum) || (parseInt(String(tData.priceGroup || "0").replace(/\D/g, ""), 10) || 0);
          const tPricePrivate = Number(tData.pricePrivateNum) || (parseInt(String(tData.pricePrivate || "0").replace(/\D/g, ""), 10) || 0);

          if (tourType === "group") {
            if (!(tPriceGroup > 0)) clientPriced = true;
            unitPrice = tPriceGroup > 0 ? tPriceGroup : (Number(body.unitPrice) || 0);
            baseTotalPrice = unitPrice * totalPeople;
          } else {
            // Per-vehicle private price from the tour document, never the
            // client's number. A vehicle the tour isn't offered in (or no
            // vehicle) falls back to the tour's single private price.
            const vehiclePrices = getPrivateVehiclePrices(tData);
            if (bookedVehicle && vehiclePrices[bookedVehicle]) {
              unitPrice = vehiclePrices[bookedVehicle];
            } else {
              if (Object.keys(vehiclePrices).length) bookedVehicle = "";
              if (!(tPricePrivate > 0)) clientPriced = true;
              unitPrice = tPricePrivate > 0 ? tPricePrivate : (Number(body.unitPrice) || 0);
            }
            baseTotalPrice = unitPrice;
          }

          if (tData.title) {
            calculatedTourTitle = typeof tData.title === "string" ? tData.title : (tData.title[language] || tData.title.ka || tourTitle);
          }
        } else {
          // Tour not in Firestore: keep the request, flagged for a price check.
          clientPriced = true;
          baseTotalPrice = Number(body.price) || Number(body.baseTotalPrice) || 0;
          unitPrice = totalPeople > 0 ? Math.round(baseTotalPrice / totalPeople) : baseTotalPrice;
        }
      } catch (err) {
        clientPriced = true;
        baseTotalPrice = Number(body.price) || 0;
        unitPrice = totalPeople > 0 ? Math.round(baseTotalPrice / totalPeople) : baseTotalPrice;
      }
    } else {
      clientPriced = true;
      // The transfer form sends its quote as "priceGEL".
      baseTotalPrice = Math.max(0, Number(body.price) || Number(body.priceGEL) || 0);
      unitPrice = baseTotalPrice;
    }

    // The route of a transfer. Until now only the phone number reached the
    // booking: the route travelled in the WhatsApp message alone, so a customer
    // who never pressed "send" there left a request nobody could act on.
    const transfer =
      type === "transfer"
        ? {
            pickup: clip(body.pickup, 400),
            dropoff: clip(body.dropoff, 400),
            time: clip(body.time, 10),
            vehicleName: clip(body.vehicleName, 60),
            distanceKm: Number(body.distanceKm) || null,
            durationMinutes: Number(body.duration) || null,
          }
        : null;
    if (transfer && (transfer.pickup || transfer.dropoff)) {
      // Place names only: the map links stay in the pickup/dropoff fields.
      const placeName = (text) => text.split(" — http")[0].slice(0, 80) || "?";
      calculatedTourTitle = `Transfer: ${placeName(transfer.pickup)} → ${placeName(transfer.dropoff)}`;
    }

    // Group and private tours are booked at least 24 hours before the start.
    if (type === "tour" && isTooLateToBook(date, tourStartTime)) {
      return NextResponse.json(
        { success: false, code: "too_late", error: tooLateMessage(language) },
        { status: 400 }
      );
    }

    // 4. Secure Server-Side Coupon Validation (Strict Firestore & Whitelist Rules)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    let discountPercent = 0;
    let discountAmount = 0;
    let cleanCouponCode = null;

    // Coupons are for signed-in users only: without a valid sign-in token the
    // code is ignored and the booking keeps the full price.
    const couponUser =
      couponCode && typeof couponCode === "string" && couponCode.trim()
        ? (await requireAuthenticatedUser(request)).user || null
        : null;

    if (couponUser) {
      const couponValidation = await validateCouponServer({
        code: couponCode,
        baseTotalPrice,
        userId: couponUser.uid || couponUser.user_id || "",
      });

      if (couponValidation.valid) {
        cleanCouponCode = couponValidation.code;
        discountPercent = couponValidation.discountPercent;
        discountAmount = couponValidation.discountAmount;
      }
    }

    const finalTotalPrice = Math.max(0, baseTotalPrice - discountAmount);

    // 5. Generate unique Booking ID & Secure Access Token
    // The ID is the document ID: never reuse one, or setDoc would overwrite
    // another customer's booking.
    let bookingId = generateBookingId();
    for (let attempt = 0; attempt < 3; attempt++) {
      const taken = await readDoc("bookings", bookingId).then(Boolean).catch(() => false);
      if (!taken) break;
      bookingId = generateBookingId();
    }
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
        phone: finalPhone,
        email: clip(email, 160),
        whatsapp: finalPhone,
        messengerPref: channel,
        country: clip(body.country || "Georgia", 60),
        language,
      },

      trip: {
        date: date || "by_agreement",
        adults: Math.min(MAX_PEOPLE, Math.max(1, parseInt(adults, 10) || totalPeople)),
        children: Math.min(MAX_PEOPLE, Math.max(0, parseInt(children, 10) || 0)),
        totalPeople,
        vehicle: bookedVehicle,
        ...(transfer || {}),
      },

      pricing: {
        unitPrice,
        baseTotalPrice,
        couponCode: cleanCouponCode,
        discountPercent,
        discountAmount,
        totalPrice: finalTotalPrice,
        currency: "GEL",
        clientPriced,
      },

      source: {
        source: clip(source.source || "website", 60),
        utm_source: clip(source.utm_source, 200),
        utm_medium: clip(source.utm_medium, 200),
        utm_campaign: clip(source.utm_campaign, 200),
        utm_content: clip(source.utm_content, 200),
        fbclid: clip(source.fbclid, 200),
        landingPage: clip(source.landingPage, 500),
      },

      meta: {
        eventId: bookingId,
      },

      notes: {
        customerNotes: notes,
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

      createdAt: SERVER_TIME,
      createdAtMillis: Date.now(),
      updatedAt: SERVER_TIME,
    };

    // 7. Save to Firestore (doc ID = bookingId)
    await writeDoc("bookings", bookingId, bookingDoc);

    // Alert the team after the response is sent, so the customer never waits on it.
    after(() => notifyNewBooking(bookingDoc));

    // 8. Record coupon usage & increment count if discount was applied
    if (cleanCouponCode && discountAmount > 0) {
      recordCouponUsage({
        code: cleanCouponCode,
        ip: clientIp,
        userId: couponUser?.uid || "",
        bookingId,
      }).catch((err) => console.error("[api/bookings/create] Coupon usage record error:", err));
    }

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
      { success: false, error: "ჯავშნის შექმნა ვერ მოხერხდა. გთხოვთ სცადოთ ხელახლა." },
      { status: 500 }
    );
  }
}
