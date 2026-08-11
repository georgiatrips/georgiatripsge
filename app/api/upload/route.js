import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FOLDER = "georgia-trips/tours";

function signParams(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${API_SECRET}`).digest("hex");
}

export async function POST(request) {
  try {
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

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
    });
  } catch (err) {
    console.error("[Upload API]", err);
    return NextResponse.json({ error: "ატვირთვის შეცდომა" }, { status: 500 });
  }
}
