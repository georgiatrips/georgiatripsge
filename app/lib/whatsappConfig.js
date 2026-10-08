// Public WhatsApp (Meta Cloud API) settings, safe for the browser: the admin
// "Connect WhatsApp" button needs them to open Meta's Embedded Signup.
// Secrets (app secret, access token) live only on the server.

// Meta app "GeorgiaTrips Inbox" (developers.facebook.com → My Apps).
export const WHATSAPP_APP_ID = "2248641025917187";

// Facebook Login for Business → Configurations → "WhatsApp Embedded Signup
// Configuration With 60 Expiration Token" (made from Meta's template).
export const WHATSAPP_SIGNUP_CONFIG_ID = "2000416800523507";

export const GRAPH_API_VERSION = "v25.0";

// Meta only lets a business start a free-form chat within 24 hours of the
// customer's last message; after that, reply from the phone app instead.
export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const WHATSAPP_CONVERSATIONS = "whatsapp_conversations";
