import { requireAdmin } from "../../../../lib/server/adminAuth";
import { graph, loadConfig } from "../../../../lib/server/whatsapp";

// WhatsApp photo / sticker for the admin inbox. Meta's media links need the
// business token, so the browser asks here (with the admin ID token) and
// gets the bytes back.
//   GET ?id=<WhatsApp media id>
export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return Response.json({ error: admin.error }, { status: admin.status });

  const id = String(request.nextUrl.searchParams.get("id") || "").replace(/\D/g, "");
  if (!id) return Response.json({ error: "missing_id" }, { status: 400 });

  try {
    const { token } = await loadConfig();
    if (!token) return Response.json({ error: "WhatsApp ჯერ არ არის მიერთებული." }, { status: 409 });
    const { url, mime_type: mimeType } = await graph(`/${id}`, { token });
    const file = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    if (!file.ok) return Response.json({ error: `Meta media ${file.status}` }, { status: 502 });
    return new Response(file.body, {
      headers: {
        "Content-Type": mimeType || file.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    return Response.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}
