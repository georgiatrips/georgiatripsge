"use client";

import { adminFetch } from "./apiClient";

// Vercel rejects request bodies over 4.5 MB (and proxy.js over ~5 MB) with a
// bare 413, so phone photos (5–15 MB) never reached /api/upload. Every image
// is shrunk in the browser first: long edge ≤ MAX_EDGE, re-encoded as WebP
// (JPEG where the browser can't encode WebP) until it fits TARGET_BYTES.
const MAX_EDGE = 2560;
const TARGET_BYTES = 3.5 * 1024 * 1024;
const PASSTHROUGH_BYTES = 1.5 * 1024 * 1024;
const MAX_RAW_BYTES = 4 * 1024 * 1024;
const PASSTHROUGH_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const QUALITY_STEPS = [0.86, 0.8, 0.72, 0.62, 0.5];

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Some browsers reject the options bag or the format; try an <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function renameTo(name, ext) {
  const base = (name || "photo").replace(/\.[^.]+$/, "") || "photo";
  return `${base}.${ext}`;
}

async function readDimensions(file) {
  try {
    const image = await decodeImage(file);
    const size = { width: image.width, height: image.height };
    image.close?.();
    return size;
  } catch {
    return null;
  }
}

/** Returns a File small enough for /api/upload, re-encoding it when needed. */
export async function prepareImageForUpload(file) {
  const type = (file.type || "").toLowerCase();

  // GIFs would lose their animation on a canvas; send them untouched.
  if (type === "image/gif") {
    if (file.size > MAX_RAW_BYTES) throw new Error(`${file.name}: GIF ძალიან დიდია (მაქს. 4 MB)`);
    return file;
  }

  if (PASSTHROUGH_TYPES.has(type) && file.size <= PASSTHROUGH_BYTES) {
    const size = await readDimensions(file);
    if (size && Math.max(size.width, size.height) <= MAX_EDGE) return file;
  }

  let image;
  try {
    image = await decodeImage(file);
  } catch {
    // Every browser decodes JPG/PNG/WEBP, so a failure there means the file
    // itself is broken: reject it here instead of sending it to Cloudinary.
    if (["image/jpeg", "image/png", "image/webp"].includes(type)) {
      throw new Error(`${file.name}: ფაილი დაზიანებულია და ვერ იკითხება`);
    }
    // HEIC/HEIF etc. that this browser can't read: Cloudinary still can, as
    // long as the original fits through the request size limit.
    if (file.size <= MAX_RAW_BYTES) return file;
    throw new Error(`${file.name}: ბრაუზერმა ფორმატი ვერ წაიკითხა. გადაიყვანეთ JPG/PNG/WEBP-ში და სცადეთ თავიდან`);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";

  // Probe WebP support: browsers without a WebP encoder silently return PNG.
  const probe = await canvasToBlob(canvas, "image/webp", 0.8);
  const outType = probe?.type === "image/webp" ? "image/webp" : "image/jpeg";
  if (outType === "image/jpeg") {
    // JPEG has no alpha: transparent PNG areas would turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(image, 0, 0, width, height);
  image.close?.();

  let blob = null;
  for (const quality of QUALITY_STEPS) {
    blob = await canvasToBlob(canvas, outType, quality);
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) throw new Error(`${file.name}: ფოტოს დამუშავება ვერ მოხერხდა`);
  if (blob.size > TARGET_BYTES) throw new Error(`${file.name}: ფოტო ძალიან დიდია შეკუმშვის შემდეგაც`);

  // Re-encoding a small file can make it bigger; keep whichever is smaller.
  if (PASSTHROUGH_TYPES.has(type) && file.size <= blob.size && file.size <= TARGET_BYTES && scale === 1) {
    return file;
  }
  return new File([blob], renameTo(file.name, outType === "image/webp" ? "webp" : "jpg"), {
    type: outType,
    lastModified: Date.now(),
  });
}

async function postOnce(file) {
  const fd = new FormData();
  fd.append("file", file);
  const response = await adminFetch("/api/upload", { method: "POST", body: fd });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Platform-level errors (e.g. Vercel's 413) are not JSON.
  }
  if (response.ok && data?.url) return data.url;

  const error = new Error(
    response.status === 413
      ? `${file.name}: ფოტო ძალიან დიდია`
      : data?.error || `${file.name}: ატვირთვა ვერ მოხერხდა (სტატუსი: ${response.status})`
  );
  error.retryable = response.status >= 500 || response.status === 429;
  throw error;
}

/** Compresses and uploads one image; returns its Cloudinary URL. */
export async function uploadImage(file, { retries = 2 } = {}) {
  const prepared = await prepareImageForUpload(file);
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await postOnce(prepared);
    } catch (error) {
      // TypeError = network failure; retry those and 5xx/429 with backoff.
      const retryable = error.retryable || error instanceof TypeError;
      if (!retryable || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
}

/**
 * Uploads several images a few at a time. One bad photo no longer throws away
 * the others: successful URLs come back in the original order, failures are
 * listed separately.
 */
export async function uploadImages(files, { concurrency = 3, onProgress } = {}) {
  const list = [...files];
  const results = new Array(list.length);
  const errors = [];
  let next = 0;
  let done = 0;
  onProgress?.(0, list.length);

  const worker = async () => {
    while (next < list.length) {
      const index = next++;
      try {
        results[index] = await uploadImage(list[index]);
      } catch (error) {
        errors.push(error.message || `${list[index].name}: ატვირთვა ვერ მოხერხდა`);
      }
      done += 1;
      onProgress?.(done, list.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return { urls: results.filter(Boolean), errors };
}
