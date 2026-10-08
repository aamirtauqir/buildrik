/**
 * Brand colours from a logo or a site (spec §9, D13, D16). Pure and
 * deterministic: a logo's pixels are decoded by the browser and handed here;
 * an SVG is read as markup, never rasterized; a site's CSS literals come back
 * from the server as raw strings and are parsed here, with the same parser the
 * colour picker uses. Roles are picked without AI (OQ-9): the most saturated of
 * the three most frequent brand colours is Primary, the next colour with a
 * clearly different hue (≥ 30°) is Accent. Near-white, near-black and greys
 * are never brand colours.
 */
import { parseColor, rgbToHex, rgbToOklch } from "@/shared/utils/parsers";
import { GOOGLE_FONT_CATALOGUE } from "@/shared/constants/googleFonts";

export interface ColorCount { hex: string; count: number }
export interface BrandRoles { primary: string; accent?: string }
export type GenericFamily = "serif" | "sans-serif" | "monospace";

const MERGE_DISTANCE = 0.08; // OKLab ΔE under which two shades are one colour
const TOP = 12;

const hexOf = (r: number, g: number, b: number) => rgbToHex({ r, g, b }).toUpperCase();
const byCount = (a: ColorCount, b: ColorCount) => b.count - a.count || (a.hex < b.hex ? -1 : a.hex > b.hex ? 1 : 0);

function oklab(r: number, g: number, b: number) {
  const o = rgbToOklch({ r, g, b });
  const h = (o.h * Math.PI) / 180;
  return { l: o.l, a: o.c * Math.cos(h), b: o.c * Math.sin(h) };
}
const distance = (x: ReturnType<typeof oklab>, y: ReturnType<typeof oklab>) =>
  Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);

interface Cluster { n: number; r: number; g: number; b: number }

export function quantizePixels(rgba: ArrayLike<number>): ColorCount[] {
  const buckets = new Map<number, Cluster>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const key = ((rgba[i] >> 3) << 10) | ((rgba[i + 1] >> 3) << 5) | (rgba[i + 2] >> 3);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += rgba[i];
    bucket.g += rgba[i + 1];
    bucket.b += rgba[i + 2];
    buckets.set(key, bucket);
  }
  const ranked = [...buckets.entries()].sort((x, y) => y[1].n - x[1].n || x[0] - y[0]).slice(0, 256);
  const clusters: Cluster[] = [];
  for (const [, bk] of ranked) {
    const at = oklab(bk.r / bk.n, bk.g / bk.n, bk.b / bk.n);
    const hit = clusters.find((c) => distance(oklab(c.r / c.n, c.g / c.n, c.b / c.n), at) < MERGE_DISTANCE);
    if (hit) {
      hit.n += bk.n;
      hit.r += bk.r;
      hit.g += bk.g;
      hit.b += bk.b;
    } else clusters.push({ ...bk });
  }
  return clusters
    .map((c) => ({ hex: hexOf(c.r / c.n, c.g / c.n, c.b / c.n), count: c.n }))
    .sort(byCount)
    .slice(0, TOP);
}

const SVG_COLOR_RE = /\b(?:fill|stroke|stop-color)\s*(?:=\s*"([^"]*)"|=\s*'([^']*)'|:\s*([^;"'}]+))/gi;

export function normalizeColorCounts(raw: ReadonlyArray<{ value: string; count: number }>): ColorCount[] {
  const counts = new Map<string, number>();
  for (const { value, count } of raw) {
    const rgb = parseColor(value.trim());
    if (!rgb || (rgb.a !== undefined && rgb.a < 1)) continue;
    const hex = hexOf(rgb.r, rgb.g, rgb.b);
    counts.set(hex, (counts.get(hex) ?? 0) + count);
  }
  return [...counts.entries()].map(([hex, count]) => ({ hex, count })).sort(byCount);
}

export function extractSvgColors(svg: string): ColorCount[] {
  const raw: Array<{ value: string; count: number }> = [];
  for (const m of svg.matchAll(SVG_COLOR_RE)) raw.push({ value: m[1] ?? m[2] ?? m[3] ?? "", count: 1 });
  return normalizeColorCounts(raw);
}

function chromaOf(hex: string) {
  const rgb = parseColor(hex)!;
  return rgbToOklch({ r: rgb.r, g: rgb.g, b: rgb.b });
}

export function pickBrandRoles(colors: readonly ColorCount[]): BrandRoles | null {
  const total = colors.reduce((n, c) => n + c.count, 0);
  if (total === 0) return null;
  const candidates = [...colors].sort(byCount).filter((c) => {
    const o = chromaOf(c.hex);
    return o.c >= 0.04 && o.l >= 0.2 && o.l <= 0.92 && c.count / total >= 0.02;
  });
  if (candidates.length === 0) return null;
  const primary = candidates.slice(0, 3).reduce((best, c) => (chromaOf(c.hex).c > chromaOf(best.hex).c ? c : best));
  const hue = chromaOf(primary.hex).h;
  const accent = candidates.find((c) => {
    if (c === primary) return false;
    const d = Math.abs(chromaOf(c.hex).h - hue) % 360;
    return Math.min(d, 360 - d) >= 30;
  });
  return accent ? { primary: primary.hex, accent: accent.hex } : { primary: primary.hex };
}

function guessGeneric(family: string): GenericFamily {
  if (/mono|code|courier|consol/i.test(family)) return "monospace";
  if (/serif|times|georgia|garamond|tiempos|playfair|merriweather|lora|baskerville/i.test(family) && !/sans/i.test(family)) {
    return "serif";
  }
  return "sans-serif";
}

export function mapFontFamily(family: string, generic?: GenericFamily): { family: string; replaced?: string } {
  const hit = GOOGLE_FONT_CATALOGUE.find((f) => f.family.toLowerCase() === family.trim().toLowerCase());
  if (hit) return { family: hit.family };
  const want = generic ?? guessGeneric(family);
  const fallback = GOOGLE_FONT_CATALOGUE.find((f) => f.category === want) ?? GOOGLE_FONT_CATALOGUE[0];
  return { family: fallback.family, replaced: family.trim() };
}

export function downscaleSize(width: number, height: number, maxPixels = 4_000_000): { width: number; height: number } {
  if (width * height <= maxPixels) return { width, height };
  const k = Math.sqrt(maxPixels / (width * height));
  return { width: Math.max(1, Math.floor(width * k)), height: Math.max(1, Math.floor(height * k)) };
}
