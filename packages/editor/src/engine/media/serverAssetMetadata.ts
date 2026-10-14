/**
 * serverAssetMetadata — the mapping between a local MediaAsset and the
 * server's media row: the server's asset-type subset, and the
 * `userMetadata` JSON column (tags, the site-font flag, the version parent,
 * the edits snapshot), read and written whole. Pure functions; split out of
 * MediaManager (DQ-007), which calls them on import and on every update.
 *
 * @module engine/media/serverAssetMetadata
 * @license BSD-3-Clause
 */

import type { EditsSnapshot, MediaAsset, MediaAssetType } from "@/shared/types/media";

/**
 * Phase B2: narrow MediaAssetType to the server's mediaTypeEnum subset.
 *  - Engine type: "image" | "video" | "audio" | "icon" | "svg" | "font"
 *  - Server enum: "image" | "video" | "icon" | "font"
 *
 *  - svg → image (SVGs are stored as image rows server-side; the type
 *    discriminator is mimeType, not the asset.type field)
 *  - audio → null (no server-side schema; local-only forever)
 */
export function toServerAssetType(
  type: MediaAssetType,
): "image" | "video" | "icon" | "font" | null {
  switch (type) {
    case "image":
    case "svg":
      return "image";
    case "video":
      return "video";
    case "icon":
      return "icon";
    case "font":
      return "font";
    case "audio":
      return null;
    default:
      return null;
  }
}

/**
 * BLOCKERS C3: the tag list a server row carries at `userMetadata.tags` —
 * the JSON column `updateAsset` mirrors `{ tags }` into. Anything that is not
 * a string array reads as no tags; a stray non-string inside one is dropped
 * rather than failing the whole import.
 */
export function tagsFromUserMetadata(meta: unknown): string[] {
  if (typeof meta !== "object" || meta === null || !("tags" in meta)) return [];
  const tags: unknown = meta.tags;
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string") : [];
}

/**
 * Clone 3686:42317 (Site fonts): the ADDED flag a server row carries at
 * `userMetadata.siteFont`, beside the tags. Only a literal `true` counts —
 * anything else is "uploaded, not added", which is also what a row written
 * before Phase 5 means.
 */
export function siteFontFromUserMetadata(meta: unknown): boolean {
  return typeof meta === "object" && meta !== null && "siteFont" in meta && meta.siteFont === true;
}

/**
 * Clone 3695:45529 (Asset versions): the parent a server row names at
 * `userMetadata.versionOf`. Only a string counts — anything else is a plain
 * asset, which is also what every row written before Phase 6 is.
 */
export function versionOfFromUserMetadata(meta: unknown): string | undefined {
  if (typeof meta !== "object" || meta === null || !("versionOf" in meta)) return undefined;
  return typeof meta.versionOf === "string" && meta.versionOf ? meta.versionOf : undefined;
}

const isNumber = (v: unknown): v is number => typeof v === "number";
const isString = (v: unknown): v is string => typeof v === "string";

/**
 * The edits snapshot a server row carries at `userMetadata.edits`. The whole
 * shape or nothing: a partial snapshot would print "Crop: Free" beside an
 * invented "Brightness: undefined", so it reads as no snapshot at all.
 */
export function editsFromUserMetadata(meta: unknown): EditsSnapshot | undefined {
  if (typeof meta !== "object" || meta === null || !("edits" in meta)) return undefined;
  if (typeof meta.edits !== "object" || meta.edits === null) return undefined;
  const record: Record<string, unknown> = { ...meta.edits };
  const { width, height, crop, preset, format, transform, brightness, contrast, saturation, blur } = record;
  if (!isNumber(width) || !isNumber(height) || !isNumber(brightness) || !isNumber(contrast)) return undefined;
  if (!isNumber(saturation) || !isNumber(blur)) return undefined;
  if (!isString(crop) || !isString(preset) || !isString(format) || !isString(transform)) return undefined;
  return { width, height, crop, preset, format, transform, brightness, contrast, saturation, blur };
}

/**
 * The server row's JSON column, whole, from the asset as it now is. The
 * server REPLACES the column with what is sent, so every writer sends every
 * key the asset carries — the tags always, the flags only once set (an image
 * that was never a font or a version has nothing to preserve).
 */
export function userMetadataOf(asset: MediaAsset): Record<string, unknown> {
  return {
    tags: asset.tags,
    ...(asset.siteFont !== undefined ? { siteFont: asset.siteFont } : {}),
    ...(asset.versionOf !== undefined ? { versionOf: asset.versionOf } : {}),
    ...(asset.edits !== undefined ? { edits: asset.edits } : {}),
  };
}
