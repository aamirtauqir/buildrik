/**
 * Unified drag payload helper for media tiles.
 *
 * Every media tile that supports drag-to-canvas MUST set the same three
 * dataTransfer keys. The canvas drop handler (useCanvasDragDrop.ts) reads
 * them and calls composer.mediaCommands.insertMediaAt with drop coords.
 *
 *   x-aquibra-media-src   blob/http/data URL of the asset
 *   x-aquibra-media-type  image | video | icon | svg | audio | lottie | font
 *   x-aquibra-media-name  human-readable name (for fallback filename)
 *
 * @license BSD-3-Clause
 */

import type { LibraryItem } from "./mediaTypes";
import type { MediaInsertType } from "../../../../../engine/media/MediaCommandLayer";

/** Map a LibraryItem's `type` (img/vid/ico/fnt) to the engine MediaInsertType. */
export function libraryTypeToInsertType(type: LibraryItem["type"]): MediaInsertType {
  switch (type) {
    case "img":
      return "image";
    case "vid":
      return "video";
    case "ico":
      return "icon";
    case "fnt":
      return "font";
    default:
      return "image";
  }
}

/**
 * Set the three media drag-payload keys on a DataTransfer. Called from
 * every drag source (slim launcher tile, library grid card, detail
 * overlay). The canvas reads these in `useCanvasDragDrop.ts`.
 */
export function setMediaDragData(dataTransfer: DataTransfer, item: LibraryItem): void {
  dataTransfer.effectAllowed = "copy";
  dataTransfer.setData("application/x-aquibra-media-src", item.src);
  dataTransfer.setData("application/x-aquibra-media-type", libraryTypeToInsertType(item.type));
  dataTransfer.setData("application/x-aquibra-media-name", item.name);
  // Also set text/plain as a universal fallback so drops into other apps
  // (text editors, chat) at least produce a readable URL.
  dataTransfer.setData("text/plain", item.src);
}

/**
 * Read the media drag payload from a DataTransfer. Returns null if the
 * drag is not a media drag (one of the keys is missing/empty).
 */
export function readMediaDragData(
  dataTransfer: DataTransfer,
): { src: string; type: MediaInsertType; name: string } | null {
  const src = dataTransfer.getData("application/x-aquibra-media-src");
  const type = dataTransfer.getData("application/x-aquibra-media-type") as MediaInsertType;
  const name = dataTransfer.getData("application/x-aquibra-media-name");
  if (!src || !type) return null;
  return { src, type, name };
}
