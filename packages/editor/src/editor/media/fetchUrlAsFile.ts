/**
 * fetchUrlAsFile — turn a pasted media URL into an uploadable File.
 *
 * Both import-from-URL surfaces need the identical steps (fetch, check
 * status, check the kind, derive a filename, wrap in a File), and they had
 * them written once: the fullpage manager imported, the picker modal said
 * "Import from URL — coming soon" beside a working implementation one folder
 * away. One writer, so a fix to the naming or the status check reaches both.
 *
 * Throws a `UrlImportError` on a non-OK response, a network failure, or a
 * body whose type the upload gate would refuse for the kinds the caller
 * accepts — callers own the result dialog (Clone 3695:43876), and "what
 * counts as a supported image" is `acceptedMedia.ts`'s list, the same table
 * `validateFile` reads.
 *
 * @license BSD-3-Clause
 */

import type { MediaAssetType } from "../../shared/types/media";
import { acceptsMime } from "./acceptedMedia";

/**
 * http/https only — a data: or blob: URL is already local, and file:// cannot
 * be read. Both import surfaces gate their button on this, so "what counts as
 * a usable URL" cannot drift between them.
 */
export function isFetchableUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Every kind the upload gate admits — the fullpage library's accept set. */
export const EVERY_MEDIA_KIND: readonly MediaAssetType[] = ["image", "svg", "video", "audio", "font"];

export class UrlImportError extends Error {
  constructor(readonly reason: "unreachable" | "unsupported") {
    super(reason === "unreachable" ? "The URL could not be fetched" : "The URL does not return a supported file");
    this.name = "UrlImportError";
  }
}

export async function fetchUrlAsFile(url: string, accepts: readonly MediaAssetType[] = EVERY_MEDIA_KIND): Promise<File> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new UrlImportError("unreachable");
  }
  if (!res.ok) throw new UrlImportError("unreachable");
  const blob = await res.blob();
  if (!acceptsMime(accepts, blob.type)) throw new UrlImportError("unsupported");
  const ext = blob.type.split("/")[1];
  // Strip the query string: `photo.jpg?w=800&token=…` is not a filename.
  const name = url.split("/").pop()?.split("?")[0] || `imported.${ext}`;
  return new File([blob], name, { type: blob.type });
}
