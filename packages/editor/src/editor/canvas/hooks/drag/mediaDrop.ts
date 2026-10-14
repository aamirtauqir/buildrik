/**
 * Media dropped on the canvas — a library tile or an OS file.
 *
 * Dropped on an image (a video, for a video) or on an element with a `url()`
 * background, it replaces that media: one undo step, the asset's alt replaces
 * the old one (`mediaOps.replaceMedia`), a locked element refuses with the
 * "locked" toast. Dropped anywhere else it inserts a new element at the drop
 * point and selects it, one undo step.
 *
 * Both drop paths handed the element under the cursor to insertMediaAt as its
 * replace target, and the target falls back to the page root — so a drop
 * never inserted anything, it wrote `src` onto a section or the root while the
 * toast said "applied ✓" (audit 2026-10-08, media P0-1).
 *
 * @license BSD-3-Clause
 */
import type { Composer, Element } from "@/engine";
import { writableElements } from "@/engine/commands/commandOperations";
import type { MediaInsertType } from "@/engine/media/MediaCommandLayer";

export type MediaDropOutcome =
  | { kind: "replaced" | "added"; elementId: string }
  | { kind: "locked" }
  | null;

/** The element a drop of `type` would replace the media of, or null to insert. */
export function replaceTargetFor(
  composer: Composer,
  targetId: string | null | undefined,
  type: MediaInsertType,
): Element | null {
  const target = targetId ? composer.elements.getElement(targetId) : null;
  if (!target) return null;
  const elementType = target.getType?.();
  if ((type === "image" || type === "video") && elementType === type) return target;
  if (type === "image" && target.getStyle?.("background-image")?.includes("url(")) return target;
  return null;
}

export function dropMedia(
  composer: Composer,
  drop: { src: string; type: MediaInsertType; alt?: string; targetId?: string | null; x?: number; y?: number },
): MediaDropOutcome {
  const target = replaceTargetFor(composer, drop.targetId, drop.type);
  if (target) {
    if (writableElements(composer, [target]).length === 0) return { kind: "locked" };
    const replaced = composer.mediaOps.replaceMedia(target.getId(), drop.src, { alt: drop.alt });
    if (!replaced) return null;
    composer.selection?.select(target);
    return { kind: "replaced", elementId: target.getId() };
  }

  composer.beginTransaction?.("insert-media-drop");
  let result: ReturnType<Composer["mediaOps"]["insertMediaAt"]>;
  try {
    result = composer.mediaOps.insertMediaAt(drop.src, drop.type, {
      x: drop.x,
      y: drop.y,
      path: "drag",
      alt: drop.alt,
    });
  } finally {
    composer.endTransaction?.();
  }
  if (!result) return null;
  if (result.kind === "element") {
    const el = composer.elements.getElement(result.elementId);
    if (el) composer.selection?.select(el);
  }
  return { kind: "added", elementId: result.elementId };
}

/** Is `src` already in the media library? Then a drop must not upload it again. */
export function isLibraryAsset(composer: Composer, src: string): boolean {
  return composer.media.getAssets?.().some((asset) => asset.src === src) ?? false;
}
