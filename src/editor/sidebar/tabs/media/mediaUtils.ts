/**
 * Media Tab Pure Utilities
 * fmtSize, fmtDur, extStyle, toLibraryItem — ONLY defined here, never duplicated.
 * @license BSD-3-Clause
 */

import type { MediaAsset } from "../../../../shared/types/media";
import type { LibraryItem, MediaTypeFilter } from "./mediaTypes";

/** Format bytes to human-readable string e.g. "1.2 MB" */
export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    case "svg":
      return "img";
    case "video":
      return "vid";
    case "icon":
      return "ico";
    case "font":
      return "fnt";
    default:
      return "img";
  }
}

/** Map MediaAsset to LibraryItem (display-ready) */
export function toLibraryItem(asset: MediaAsset): LibraryItem {
  return {
    key: asset.id,
    name: asset.name,
    type: assetTypeToFilter(asset.type),
    src: asset.src,
    thumb: asset.thumbnailSrc,
    size: asset.size,
    duration: asset.metadata?.duration,
    width: asset.width,
    height: asset.height,
    createdAt: asset.createdAt,
    mimeType: asset.mimeType,
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
