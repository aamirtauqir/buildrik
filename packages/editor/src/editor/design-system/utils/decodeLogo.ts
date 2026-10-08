/**
 * A logo's colours, decoded in the browser (spec §9, D16 — the file is never
 * uploaded). An SVG is read as markup and never rasterized; a bitmap is drawn
 * at most 4 MP (`downscaleSize`) so a 6000×4000 photo cannot freeze the tab,
 * and its pixels go to the same deterministic quantizer every logo uses.
 *
 * @license BSD-3-Clause
 */
import {
  downscaleSize,
  extractSvgColors,
  quantizePixels,
  type ColorCount,
} from "@/engine/designSystem/brandColors";

const SVG_MAX_BYTES = 1024 * 1024;
const BITMAP_MAX_BYTES = 5 * 1024 * 1024;
const BITMAP_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function decodeLogoColors(file: File): Promise<ColorCount[]> {
  if (file.type === "image/svg+xml") {
    if (file.size > SVG_MAX_BYTES) throw new Error("TOO_BIG");
    return extractSvgColors(await file.text());
  }
  if (!BITMAP_TYPES.has(file.type)) throw new Error("UNSUPPORTED");
  if (file.size > BITMAP_MAX_BYTES) throw new Error("TOO_BIG");
  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = downscaleSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("UNSUPPORTED");
    ctx.drawImage(bitmap, 0, 0, width, height);
    return quantizePixels(ctx.getImageData(0, 0, width, height).data);
  } finally {
    bitmap.close();
  }
}
