"use client";

// next/image loader (images.loaderFile in next.config.mjs). It replaces
// Vercel's /_next/image optimizer: once the plan's monthly quota is used up,
// that endpoint answers 402 for every image not already cached, and photos
// disappear across the site. Each source is resized by its own CDN instead.
import localVariants from "./localImageVariants.json";

// Must match WIDTHS in scripts/generate-image-variants.js.
const LOCAL_WIDTHS = [256, 640, 1080, 1920];
// A Cloudinary transformation segment, e.g. "f_auto,q_auto" or "w_640,c_limit".
const CLD_TRANSFORM = /^(?:w|h|c|f|q|g|e|ar|dpr|fl|b|r|t|x|y|z|o|a|bo|co)_[^/,]+(?:,(?:w|h|c|f|q|g|e|ar|dpr|fl|b|r|t|x|y|z|o|a|bo|co)_[^/,]+)*$/;

function cloudinary(src, width, quality) {
  const [head, rest] = src.split("/upload/");
  let parts = rest.split("/");
  // Drop the transformations already in the stored URL; ours replace them.
  // Everything before the version segment is a transformation.
  const version = parts.findIndex((p) => /^v\d+$/.test(p));
  if (version >= 0) parts = parts.slice(version);
  else while (parts.length > 1 && CLD_TRANSFORM.test(parts[0])) parts.shift();
  const q = quality && quality < 70 ? "q_auto:eco" : "q_auto";
  return `${head}/upload/f_auto,${q},c_limit,w_${width}/${parts.join("/")}`;
}

function local(src, width) {
  const widths = localVariants[src.split("?")[0]];
  if (!widths) return src;
  const w = widths.find((v) => v >= width);
  // Wider than every variant: the original is the best size available.
  if (!w) return src;
  return `/img-opt/${src.slice(1).replace(/\.[^.?]+(\?.*)?$/, "")}-${w}.webp`;
}

export default function imageLoader({ src, width, quality }) {
  if (src.startsWith("/") && !src.startsWith("//")) {
    // The loader must take width into account; snap to the generated sizes.
    return local(src, LOCAL_WIDTHS.find((v) => v >= width) || width);
  }
  if (src.includes("res.cloudinary.com") && src.includes("/upload/")) {
    return cloudinary(src, width, quality);
  }
  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality || 75));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }
  // Firebase Storage, Google avatars and anything else: original file.
  return src;
}
