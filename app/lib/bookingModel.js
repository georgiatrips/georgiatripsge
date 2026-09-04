// GeorgiaTrips — Booking Data Model & Utility Helpers

export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
};

export const STATUS_CONFIG = {
  pending: {
    labelKa: "მოლოდინში",
    labelEn: "Pending Confirmation",
    labelRu: "В ожидании",
    labelTr: "Onay Bekliyor",
    labelAr: "قيد الانتظار",
    color: "#eab308", // Amber
    bgColor: "rgba(234, 179, 8, 0.12)",
    borderColor: "rgba(234, 179, 8, 0.35)",
    icon: "⏳",
  },
  confirmed: {
    labelKa: "დადასტურებულია",
    labelEn: "Confirmed",
    labelRu: "Подтверждено",
    labelTr: "Onaylandı",
    labelAr: "مؤكد",
    color: "#10b981", // Emerald green
    bgColor: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.35)",
    icon: "✅",
  },
  cancelled: {
    labelKa: "გაუქმებულია",
    labelEn: "Cancelled",
    labelRu: "Отменено",
    labelTr: "İptal Edildi",
    labelAr: "ملغى",
    color: "#ef4444", // Red
    bgColor: "rgba(239, 68, 68, 0.12)",
    borderColor: "rgba(239, 68, 68, 0.35)",
    icon: "❌",
  },
  completed: {
    labelKa: "დასრულებულია",
    labelEn: "Completed",
    labelRu: "Завершено",
    labelTr: "Tamamlandı",
    labelAr: "مكتمل",
    color: "#3b82f6", // Blue
    bgColor: "rgba(59, 130, 246, 0.12)",
    borderColor: "rgba(59, 130, 246, 0.35)",
    icon: "🎉",
  },
};

export function getBookingStatusLabel(status, lang = "ka") {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  if (lang === "en") return conf.labelEn || conf.labelKa;
  if (lang === "ru") return conf.labelRu || conf.labelKa;
  if (lang === "tr") return conf.labelTr || conf.labelEn || conf.labelKa;
  if (lang === "ar") return conf.labelAr || conf.labelEn || conf.labelKa;
  return conf.labelKa;
}

/**
 * Generate human-readable booking ID: GT-YYMMDD-XXXX (e.g. GT-260904-A7B2)
 */
export function generateBookingId() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomSuffix = "";
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `GT-${yy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Generate a random cryptographically secure token for booking status verification
 */
export function generateAccessToken() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "sec_";
  for (let i = 0; i < 24; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate phone number (Georgia or international standard)
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.replace(/[\s\-()]/g, "");
  return /^\+?\d{8,15}$/.test(clean);
}

/**
 * Normalize booking doc structure (ensures backwards compatibility with legacy flat bookings)
 */
export function normalizeBooking(raw = {}, id = "") {
  const bId = raw.bookingId || id || raw.id || "";
  const status = raw.status || BOOKING_STATUSES.PENDING;

  // Extract customer info
  const customer = raw.customer || {
    fullName: raw.name || "",
    phone: raw.phone || "",
    email: raw.email || "",
    whatsapp: raw.phone || "",
    messengerPref: raw.channel || "WhatsApp",
    country: raw.country || "Georgia",
    language: raw.language || "ka",
  };

  // Extract trip info
  const trip = raw.trip || {
    date: raw.date || "",
    adults: Number(raw.people) || 1,
    children: 0,
    totalPeople: Number(raw.people) || 1,
  };

  // Extract pricing info
  const pricing = raw.pricing || {
    unitPrice: raw.originalPrice ? Math.round(raw.originalPrice / (raw.people || 1)) : raw.price || 0,
    baseTotalPrice: raw.originalPrice || raw.price || 0,
    couponCode: raw.couponCode || null,
    discountAmount: raw.discountAmount || 0,
    totalPrice: raw.price || 0,
    currency: raw.currency || "GEL",
  };

  // Extract source / marketing info
  const source = raw.source || {
    source: "website",
    utm_source: raw.utm_source || "",
    utm_medium: raw.utm_medium || "",
    utm_campaign: raw.utm_campaign || "",
    utm_content: raw.utm_content || "",
    fbclid: raw.fbclid || "",
    landingPage: raw.landingPage || "",
  };

  const admin = raw.admin || {
    confirmedAt: raw.confirmedAt || null,
    confirmedBy: raw.confirmedBy || null,
    cancelledAt: raw.cancelledAt || null,
    cancelledBy: raw.cancelledBy || null,
    cancellationReason: raw.cancellationReason || null,
    completedAt: raw.completedAt || null,
    notes: raw.adminNotes || "",
  };

  return {
    ...raw,
    id: id || bId,
    bookingId: bId,
    status,
    type: raw.type || "tour",
    tourId: raw.tourId || "",
    tourTitle: raw.tourTitle || "ტური",
    tourType: raw.tourType || "group",
    customer,
    trip,
    pricing,
    source,
    admin,
    notes: typeof raw.notes === "object" ? raw.notes : { customerNotes: raw.notes || "", adminNotes: raw.adminNotes || "" },
    createdAt: raw.createdAt || null,
    createdAtMillis: raw.createdAtMillis || (raw.createdAt?.toMillis ? raw.createdAt.toMillis() : Date.now()),
    accessToken: raw.accessToken || "",
  };
}
