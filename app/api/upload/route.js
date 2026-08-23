import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuthenticatedUser } from "../../lib/server/adminAuth";

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = "georgia-trips/tours";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function signParams(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${API_SECRET}`).digest("hex");
}

export async function POST(request) {
  try {
    const user = await requireAuthenticatedUser(request);
    if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
      return NextResponse.json({ error: "File is too large" }, { status: 413 });
    }

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return NextResponse.json(
        { error: "Cloudinary credentials are not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "ფაილი ვერ მოიძებნა" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 415 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 413 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mime = file.type || "image/jpeg";
    const dataUri = `data:${mime};base64,${base64}`;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { folder: FOLDER, timestamp };
    const signature = signParams(paramsToSign);

    const body = new URLSearchParams();
    body.set("file", dataUri);
    body.set("api_key", API_KEY);
    body.set("timestamp", String(timestamp));
    body.set("folder", FOLDER);
    body.set("signature", signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    const data = await uploadRes.json();
    if (!uploadRes.ok) {
      console.error("[Cloudinary]", data);
      return NextResponse.json(
        { error: data?.error?.message || "ატვირთვა ვერ მოხერხდა" },
        { status: 502 }
      );
    }

    const optimizedUrl = data.secure_url
      ? data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/")
      : data.secure_url;

    return NextResponse.json({
      url: optimizedUrl,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    console.error("[Upload API]", err);
    return NextResponse.json({ error: "ატვირთვის შეცდომა" }, { status: 500 });
  }
}
