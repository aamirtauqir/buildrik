/**
 * Media Tab Pure Utilities
 * fmtSize, fmtDur, extStyle, toLibraryItem — ONLY defined here, never duplicated.
 * @license BSD-3-Clause
 */

import type { MediaAsset } from "../../../../../shared/types/media";
import type { LibraryItem, MediaTypeFilter } from "./mediaTypes";

/** Format bytes to human-readable string e.g. "1.2 MB" */
export function fmtSize(bytes: number): string {
  // `+` drops a trailing ".0": the boards write "840 KB" and "24 MB", never
  // "840.0 KB", while a genuinely fractional size still keeps its digit
  // ("1.5 MB"). toFixed alone padded every round number with a false decimal.
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${+(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${+(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${+(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Format seconds to "0:34" or "1:23:45" */
export function fmtDur(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Map file extension to CSS accent class name */
export function extStyle(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "ext--img";
  if (mimeType.startsWith("video/")) return "ext--vid";
  if (mimeType.startsWith("audio/")) return "ext--aud";
  if (mimeType.includes("font")) return "ext--fnt";
  return "ext--doc";
}

/** Map MediaAsset.type to LibraryItem short code */
export function assetTypeToFilter(type: MediaAsset["type"]): LibraryItem["type"] {
  switch (type) {
    case "image":
      return "img";
    // The svg PILL is the ico bucket (TypePills' own mapping doc) — an .svg
    // upload landing in "img" left that pill's count at a permanent 0.
    case "svg":
    case "icon":
      return "ico";
    case "video":
      return "vid";
    case "font":
      return "fnt";
    default:
      return "img";
  }
}

/** Board 144:2 draws full filenames ("hero-dark.jpg"); the engine strips the
 * extension at upload (MediaManager :845), so the label derives it back from
 * the MIME type. Display only — name stays ext-less for alt-text and rename. */
const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "font/ttf": ".ttf",
  "font/otf": ".otf",
  "font/woff": ".woff",
  "font/woff2": ".woff2",
};

/** Map MediaAsset to LibraryItem (display-ready) */
export function toLibraryItem(asset: MediaAsset): LibraryItem {
  const ext = MIME_EXT[asset.mimeType ?? ""] ?? "";
  return {
    key: asset.id,
    name: asset.name,
    displayName: ext && !asset.name.toLowerCase().endsWith(ext) ? asset.name + ext : asset.name,
    type: assetTypeToFilter(asset.type),
    src: asset.src,
    thumb: asset.thumbnailSrc,
    size: asset.size,
    duration: asset.metadata?.duration,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    generatedAltMeta: asset.generatedMetadata?.altText,
    createdAt: asset.createdAt,
    mimeType: asset.mimeType,
    assetId: asset.serverId,
  };
}

/** Filter library items by type pill */
export function filterByType(items: LibraryItem[], activeType: MediaTypeFilter): LibraryItem[] {
  if (activeType === "all") return items;
  return items.filter((i) => i.type === activeType);
}

/** Filter library items by format extension */
export function filterByFmt(items: LibraryItem[], fmt: string): LibraryItem[] {
  if (!fmt) return items;
  return items.filter((i) => i.mimeType.includes(fmt));
}

/** Search library items by name */
export function filterBySearch(items: LibraryItem[], q: string): LibraryItem[] {
  if (!q) return items;
  const lower = q.toLowerCase();
  return items.filter((i) => i.name.toLowerCase().includes(lower));
}

/** Count items per type */
export function countByType(items: LibraryItem[]): {
  all: number;
  img: number;
  vid: number;
  ico: number;
  fnt: number;
} {
  return {
    all: items.length,
    img: items.filter((i) => i.type === "img").length,
    vid: items.filter((i) => i.type === "vid").length,
    ico: items.filter((i) => i.type === "ico").length,
    fnt: items.filter((i) => i.type === "fnt").length,
  };
}

// ── Used-in drill-in (board 146:68) ──────────────────────────────────────────

export interface PageUsageHit {
  elementId: string;
  label: string;
  crumb: string;
}
export interface PageUsage {
  pageId: string;
  pageName: string;
  hits: PageUsageHit[];
}

/**
 * Cross-page usage for one media src — board 146:68 groups hits by PAGE.
 * Pure walk over the serialized page trees (attributes.src + inline
 * background-image), so it needs no live element instances.
 */
export function collectUsageByPage(
  pages: ReadonlyArray<import("@shared/types/project").PageData>,
  src: string,
): PageUsage[] {
  if (!src) return [];
  const out: PageUsage[] = [];
  for (const page of pages) {
    const hits: PageUsageHit[] = [];
    const walk = (el: import("@shared/types/element").ElementData) => {
      const elSrc = el.attributes?.src;
      const bg = el.styles?.["background-image"] ?? el.styles?.backgroundImage;
      const bgHit = bg ? bg.includes(src) : false;
      if (elSrc === src || bgHit) {
        const label = el.attributes?.["data-name"] ?? el.type;
        hits.push({ elementId: el.id, label, crumb: `${page.name} › ${label}` });
      }
      el.children?.forEach(walk);
    };
    if (page.root) walk(page.root);
    if (hits.length) out.push({ pageId: page.id, pageName: page.name, hits });
  }
  return out;
}
