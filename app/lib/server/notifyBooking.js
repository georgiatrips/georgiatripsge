// Tells the team about a new booking the moment it is saved. Until now a
// booking only appeared in the admin panel, so a request made while nobody
// had the panel open waited unanswered while the customer was promised a
// quick WhatsApp confirmation.
//
// Sends a Telegram message when both variables are set (Vercel → Settings →
// Environment Variables), otherwise does nothing:
//   TELEGRAM_BOT_TOKEN  token from @BotFather
//   TELEGRAM_CHAT_ID    chat/group that receives the alerts
// A failure never fails the booking itself.

const TIMEOUT_MS = 4000;

function line(label, value) {
  return value === undefined || value === null || value === "" ? "" : `${label}: ${value}\n`;
}

function formatMessage(booking) {
  const { customer = {}, trip = {}, pricing = {}, notes = {} } = booking;
  const phoneDigits = String(customer.phone || "").replace(/\D/g, "");
  const price = pricing.discountAmount
    ? `${pricing.totalPrice} GEL (${pricing.baseTotalPrice} − ${pricing.discountAmount}, ${pricing.couponCode})`
    : `${pricing.totalPrice} GEL`;

  return (
    `🆕 New booking ${booking.bookingId}\n\n` +
    line("Tour", booking.tourTitle) +
    line("Type", `${booking.type}${booking.tourType ? ` · ${booking.tourType}` : ""}${trip.vehicle ? ` · ${trip.vehicle}` : ""}`) +
    line("Date", trip.date) +
    line("People", trip.totalPeople) +
    line("Price", price) +
    (pricing.clientPriced ? "⚠️ Price sent by the browser — check it\n" : "") +
    "\n" +
    line("Name", customer.fullName) +
    line("Phone", customer.phone) +
    line("Email", customer.email) +
    line("Contact via", customer.messengerPref) +
    line("Language", customer.language) +
    line("Notes", notes.customerNotes) +
    line("Source", booking.source?.utm_source || booking.source?.source) +
    (phoneDigits ? `\nWhatsApp: https://wa.me/${phoneDigits}` : "")
  );
}

export async function notifyNewBooking(booking) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: formatMessage(booking), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error("[notifyNewBooking] Telegram responded", res.status);
    return res.ok;
  } catch (err) {
    console.error("[notifyNewBooking] failed:", err?.message || err);
    return false;
  }
}
