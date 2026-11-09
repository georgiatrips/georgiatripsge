import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeBooking } from "../../../lib/bookingModel";
import { findOne, readDoc } from "../../../lib/server/serverStore";

const NOT_FOUND = "ჯავშანი მითითებული მონაცემებით ვერ მოიძებნა";

function sameToken(given, stored) {
  if (!given || !stored) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(stored));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// The whole local number has to match, not just its ending: the last 9
// digits (a Georgian mobile without +995), or every digit of a shorter one.
// The country code may be typed or left out.
function samePhone(given, stored) {
  const a = String(given || "").replace(/\D/g, "");
  const b = String(stored || "").replace(/\D/g, "");
  if (a.length < 7 || b.length < 7) return false;
  const n = Math.min(9, b.length);
  return a.length >= n && a.slice(-n) === b.slice(-n);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = (searchParams.get("bookingId") || "").trim().toUpperCase();
    const token = (searchParams.get("token") || "").trim();
    const phone = (searchParams.get("phone") || "").trim();

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }
    if (!token && !phone) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    // The document ID is the booking ID; older bookings may only have the field.
    const raw = (await readDoc("bookings", bookingId).catch(() => null))
      || (await findOne("bookings", "bookingId", bookingId).catch(() => null));
    const booking = raw ? normalizeBooking(raw, raw.id) : null;

    // A wrong phone or token gets the same answer as a missing booking, so
    // the endpoint cannot be used to find out which booking IDs exist.
    const verified = Boolean(booking) && (
      sameToken(token, booking.accessToken) || samePhone(phone, booking.customer?.phone)
    );
    if (!verified) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 });
    }

    // Return safe customer-facing fields (always allow status/tour summary for confirmation)
    return NextResponse.json({
      success: true,
      verified: true,
      booking: {
        bookingId: booking.bookingId,
        status: booking.status,
        tourTitle: booking.tourTitle,
        tourType: booking.tourType,
        type: booking.type,
        vehicle: booking.trip?.vehicle || "",
        date: booking.trip?.date,
        totalPeople: booking.trip?.totalPeople,
        adults: booking.trip?.adults,
        children: booking.trip?.children,
        totalPrice: booking.pricing?.totalPrice,
        currency: booking.pricing?.currency || "GEL",
        customerName: booking.customer?.fullName || "მგზავრი",
        createdAtMillis: booking.createdAtMillis,
        cancellationReason: booking.status === "cancelled" ? (booking.admin?.cancellationReason || null) : null,
      },
    });
  } catch (err) {
    console.error("[api/bookings/status] Error:", err);
    return NextResponse.json({ error: "სტატუსის შემოწმება ვერ მოხერხდა" }, { status: 500 });
  }
}
