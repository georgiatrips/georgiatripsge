import { NextResponse } from "next/server";
import { doc, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { normalizeBooking } from "../../../lib/bookingModel";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = (searchParams.get("bookingId") || "").trim().toUpperCase();
    const token = (searchParams.get("token") || "").trim();
    const phone = (searchParams.get("phone") || "").trim().replace(/[\s\-()]/g, "");

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // 1. Direct document fetch by ID (allowed by get rule)
    let booking = null;
    let docId = bookingId;

    try {
      const directSnap = await getDoc(doc(db, "bookings", bookingId));
      if (directSnap.exists()) {
        booking = normalizeBooking(directSnap.data(), directSnap.id);
        docId = directSnap.id;
      }
    } catch (_) {}

    // 2. Query fallback if not stored by custom ID
    if (!booking) {
      try {
        const q = query(
          collection(db, "bookings"),
          where("bookingId", "==", bookingId),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          booking = normalizeBooking(snap.docs[0].data(), snap.docs[0].id);
          docId = snap.docs[0].id;
        }
      } catch (_) {}
    }

    if (!booking) {
      return NextResponse.json({ error: "ჯავშანი ვერ მოიძებნა" }, { status: 404 });
    }

    // Verify token or phone when provided
    const cleanCustomerPhone = (booking.customer?.phone || "").replace(/[\s\-()]/g, "");
    const phoneMatches = phone && cleanCustomerPhone && (cleanCustomerPhone.endsWith(phone) || phone.endsWith(cleanCustomerPhone));
    const tokenMatches = token && booking.accessToken && token === booking.accessToken;

    if (phone && !phoneMatches) {
      return NextResponse.json(
        { error: "მითითებული ტელეფონის ნომერი არ ემთხვევა ამ ჯავშანს" },
        { status: 403 }
      );
    }

    if (token && !tokenMatches) {
      return NextResponse.json(
        { error: "ავტორიზაციის ტოკენი არასწორია ან ვადაგასულია" },
        { status: 403 }
      );
    }

    const isVerified = Boolean(phoneMatches || tokenMatches);
    const rawFullName = booking.customer?.fullName || "სტუმარი";
    const displayName = isVerified
      ? rawFullName
      : rawFullName.split(" ").map((w) => (w.length > 2 ? `${w[0]}***` : w)).join(" ");

    // Return only safe customer-facing fields
    return NextResponse.json({
      success: true,
      booking: {
        bookingId: booking.bookingId,
        status: booking.status,
        tourTitle: booking.tourTitle,
        tourType: booking.tourType,
        date: booking.trip?.date,
        totalPeople: booking.trip?.totalPeople,
        adults: booking.trip?.adults,
        children: booking.trip?.children,
        totalPrice: booking.pricing?.totalPrice,
        currency: booking.pricing?.currency || "GEL",
        customerName: displayName,
        isVerified,
        createdAtMillis: booking.createdAtMillis,
        cancellationReason: booking.status === "cancelled" ? (booking.admin?.cancellationReason || null) : null,
      },
    });
  } catch (err) {
    console.error("[api/bookings/status] Error:", err);
    return NextResponse.json({ error: "სტატუსის შემოწმება ვერ მოხერხდა", details: err.message }, { status: 500 });
  }
}
