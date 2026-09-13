/**
 * The upload gate's accept contract, spelled for a person.
 *
 * Clone 3397:18325 footnotes the picker with "PNG, JPG, GIF, WebP, AVIF or
 * SVG · up to 10 MB for this image field." and 3695:43876 refuses a URL with
 * "Use a direct JPG, PNG, WebP or SVG image URL." — sample lists, the SHAPE
 * being "the formats and the limit the code really enforces". Both read the
 * same tables `validateFile` reads (`ALLOWED_MIME_TYPES`, `getMaxFileSize`),
 * so the sentence on screen cannot drift from the refusal behind it. The
 * picker's `allowedTypes` are `MediaAssetType`s, where an SVG is its own
 * kind (`getAssetTypeFromMime`), so an image-only field lists no SVG: that
 * is what the picker's own filter admits.
 *
 * @license BSD-3-Clause
 */

import { ALLOWED_MIME_TYPES, getMaxFileSize } from "../../shared/constants/media";
import type { MediaAssetType } from "../../shared/types/media";
import { formatBytes } from "@shared/utils/helpers/number";

const FORMAT_LABEL: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WebP",
  "image/svg+xml": "SVG",
  "image/avif": "AVIF",
  "video/mp4": "MP4",
  "video/webm": "WebM",
  "video/ogg": "OGV",
  "video/quicktime": "MOV",
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/ogg": "OGG",
  "audio/webm": "WebM",
  "audio/aac": "AAC",
  "font/woff2": "WOFF2",
  "font/woff": "WOFF",
  "font/ttf": "TTF",
  "font/otf": "OTF",
};

const SVG = "image/svg+xml";

/** The MIME types the gate admits for these kinds, in the gate's own order. */
export function acceptedMimes(kinds: readonly MediaAssetType[]): string[] {
  const out: string[] = [];
  const push = (list: readonly string[]) => {
    for (const m of list) if (!out.includes(m)) out.push(m);
  };
  for (const kind of kinds) {
    if (kind === "image") push(ALLOWED_MIME_TYPES.IMAGE.filter((m) => m !== SVG));
    else if (kind === "svg" || kind === "icon") push([SVG]);
    else if (kind === "video") push(ALLOWED_MIME_TYPES.VIDEO);
    else if (kind === "audio") push(ALLOWED_MIME_TYPES.AUDIO);
    else if (kind === "font") push(ALLOWED_MIME_TYPES.FONT);
  }
  return out;
}

export function acceptsMime(kinds: readonly MediaAssetType[], mime: string): boolean {
  return acceptedMimes(kinds).includes(mime);
}

/** "JPG, PNG, GIF, WebP or AVIF" */
export function acceptedFormats(kinds: readonly MediaAssetType[]): string {
  const labels = acceptedMimes(kinds).map((m) => FORMAT_LABEL[m] ?? m.split("/")[1].toUpperCase());
  const unique = labels.filter((l, i) => labels.indexOf(l) === i);
  if (unique.length <= 1) return unique.join("");
  return `${unique.slice(0, -1).join(", ")} or ${unique[unique.length - 1]}`;
}

/**
 * "up to 10 MB" — or, when the kinds carry different ceilings, every one of
 * them: "up to 10 MB per image, 1 MB per SVG, 100 MB per video".
 */
export function acceptedLimit(kinds: readonly MediaAssetType[]): string {
  const perKind = new Map<string, number>();
  for (const kind of kinds) {
    const [mime] = acceptedMimes([kind]);
    if (mime && !perKind.has(kindNoun(kind))) perKind.set(kindNoun(kind), getMaxFileSize(mime));
  }
  const limits = [...perKind.values()];
  if (limits.length === 0) return "";
  if (new Set(limits).size === 1) return `up to ${formatBytes(limits[0], 0)}`;
  return `up to ${[...perKind].map(([noun, bytes]) => `${formatBytes(bytes, 0)} per ${noun}`).join(", ")}`;
}

/** "image" / "video" / "SVG" … — the word a sentence uses for the kind. */
export function kindNoun(kind: MediaAssetType): string {
  switch (kind) {
    case "svg":
      return "SVG";
    case "icon":
      return "icon";
    default:
      return kind;
  }
}

/** "Image" / "Video" / "Media" — the kind as the Clone's `· Image` reads it. */
export function kindLabel(kinds: readonly MediaAssetType[]): string {
  if (kinds.length === 1) {
    const noun = kindNoun(kinds[0]);
    return noun === "SVG" ? noun : noun.charAt(0).toUpperCase() + noun.slice(1);
  }
  return "Media";
}
