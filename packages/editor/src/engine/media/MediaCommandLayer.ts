/**
 * MediaCommandLayer
 *
 * High-level media commands that the UI calls. Wraps ElementManager +
 * MediaManager behind a single surface, adds transaction boundaries for
 * atomic replace-across, and emits typed media.* events.
 *
 * Exposed on Composer as `composer.mediaCommands`.
 *
 *   click/drag tile    ──▶ insertMedia / insertMediaAt
 *   canvas drop        ──▶ insertMediaAt({x,y})
 *   right-click replace ─▶ replaceMedia (single element)
 *   library replace-all ─▶ replaceAcross (transactional)
 *   usage badge         ─▶ getUsages (O(N) scan, memoize in UI)
 *
 * @module engine/media/MediaCommandLayer
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";
import { EVENTS } from "../../shared/constants/events";
import type { Element } from "../elements/Element";
import { MEDIA_EVENTS } from "../../shared/constants/media";
import { isSafeSrc } from "./MediaHelpers";
import {
  MediaNoActivePageError,
  MediaReplacePartialError,
} from "./MediaStorageTypes";

export type MediaInsertType =
  | "image"
  | "video"
  | "audio"
  | "svg"
  | "icon"
  | "lottie"
  | "font";

export interface InsertResult {
  elementId: string;
  kind: "element" | "font-applied" | "replaced";
}

export interface ReplaceResult {
  elementId: string;
  previousSrc: string;
}

export interface ReplaceAcrossResult {
  replaced: ReplaceResult[];
  failed: Array<{ elementId: string; error: string }>;
  /** True only when every element in the batch succeeded. */
  clean: boolean;
}

/** A delete the user can still take back. */
export interface GraceDelete {
  name: string;
  /** Elements whose reference to the file was cleared. */
  usageCount: number;
  expiresAt: number;
  /** Put the file back in the library AND its src back on every element. */
  undo(): void;
  /** Stop waiting and make it permanent. Tests use it; the timer does otherwise. */
  commitNow(): Promise<void>;
}

const GRACE_MS = 8000;

export class MediaCommandLayer {
  constructor(private readonly composer: Composer) {}

  /**
   * Delete an asset with a grace period, clearing the dead reference on every
   * element that used it, and offering ONE way back that restores both.
   *
   * Two failures used to compound (walked 2026-09-03): the delete was
   * unrecoverable, and the canvas element that referenced the file was left
   * with a dead `src` — not removed, not flagged, not relinked — while Undo
   * stayed enabled pointing at an unrelated earlier edit.
   *
   * Element cleanup and asset restore land as one story on purpose. Restoring
   * the element without the file just recreates the dead src by another
   * route, so neither half is offered alone. Nothing here enters history: the
   * asset cannot (exportProject hardcodes assets: []), and putting only the
   * element half on the stack would let ⌘Z restore a src whose file is gone.
   * The whole operation is announced as unrecorded instead, and the toast's
   * Undo is the single door.
   *
   * Returns null when there was no grace to offer (asset missing, or still
   * uploading — see MediaManager.trashAsset), in which case the delete has
   * already happened the old way.
   */
  async deleteWithGrace(id: string, graceMs = GRACE_MS): Promise<GraceDelete | null> {
    const trashed = await this.composer.media.trashAsset(id);
    if (!trashed) return null;
    const { asset } = trashed;

    /* Raw values, not the src helper's parsed form, so restore is exact. */
    const cleared: Array<{ element: Element; src?: string; bg?: string }> = [];
    for (const element of this.composer.elements.findByMediaSrc(asset.src)) {
      const src = element.getAttribute("src");
      const bg = element.getStyle("background-image");
      cleared.push({ element, src, bg });
      if (src === asset.src) element.removeAttribute("src");
      if (bg && bg.includes(asset.src)) element.setStyle("background-image", "none");
    }
    this.composer.history?.noteUnrecordedAction?.("deleting a file");

    let settled = false;
    const finish = async () => {
      if (settled) return;
      settled = true;
      await trashed.commit();
    };
    const timer = setTimeout(() => void finish(), graceMs);

    return {
      name: asset.name,
      usageCount: cleared.length,
      expiresAt: Date.now() + graceMs,
      undo: () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        for (const { element, src, bg } of cleared) {
          if (src !== undefined) element.setAttribute("src", src);
          if (bg !== undefined) element.setStyle("background-image", bg);
        }
        trashed.restore();
      },
      commitNow: async () => {
        clearTimeout(timer);
        await finish();
      },
    };
  }

  /**
   * Insert a media asset onto the active page. Type-aware:
   *  - image/video/icon/svg/audio/lottie → new element
   *  - font → applies font-family to the selected text element(s)
   *
   * Thin wrapper around ElementManager.insertMediaAt. Emits
   * INSERT_SUCCEEDED / INSERT_FAILED for telemetry.
   *
   * @throws MediaNoActivePageError when there's no active page.
   */
  insertMedia(src: string, type: MediaInsertType): InsertResult | null {
    return this.insertMediaAt(src, type);
  }

  /**
   * Same as insertMedia, with optional placement hints.
   *
   * @param opts.x / opts.y        Page-space coordinates (image/video only).
   * @param opts.targetElementId   Replace this element's src instead of creating a new one.
   * @param opts.path              Telemetry tag: "click" or "drag".
   */
  insertMediaAt(
    src: string,
    type: MediaInsertType,
    opts?: { x?: number; y?: number; targetElementId?: string; path?: "click" | "drag" },
  ): InsertResult | null {
    const result = this.composer.elements.insertMediaAt(src, type, {
      x: opts?.x,
      y: opts?.y,
      targetElementId: opts?.targetElementId,
    });

    if (!result) {
      this.composer.media.emitEvent(MEDIA_EVENTS.INSERT_FAILED, {
        reason: "unknown",
        src,
        type,
      });
      return null;
    }

    if (result.kind === "failed") {
      this.composer.media.emitEvent(MEDIA_EVENTS.INSERT_FAILED, {
        reason: result.reason,
        src,
        type,
      });
      if (result.reason === "no-active-page") {
        throw new MediaNoActivePageError();
      }
      return null;
    }

    if (result.kind === "font-applied") {
      this.composer.media.emitEvent(MEDIA_EVENTS.INSERT_SUCCEEDED, {
        src,
        type,
        elementIds: result.elementIds,
        path: opts?.path ?? "click",
      });
      // Return the first element for a single-id API. Callers that care
      // about the full list can listen for INSERT_SUCCEEDED.
      return { elementId: result.elementIds[0], kind: "font-applied" };
    }

    const kind = opts?.targetElementId ? "replaced" : "element";
    this.composer.media.emitEvent(MEDIA_EVENTS.INSERT_SUCCEEDED, {
      src,
      type,
      elementId: result.elementId,
      path: opts?.path ?? "click",
    });
    return { elementId: result.elementId, kind };
  }

  /**
   * Replace the src of a single element. Wrapped in a transaction so the
   * change is a single undo step.
   */
  replaceMedia(elementId: string, newSrc: string): ReplaceResult | null {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    this.composer.beginTransaction("Replace media");
    try {
      const previousSrc = this.getElementSrc(element);
      this.setElementSrc(element, previousSrc, newSrc);
      this.composer.endTransaction();
      return { elementId, previousSrc };
    } catch (err) {
      this.composer.rollbackTransaction();
      throw err;
    }
  }

  /**
   * Replace `oldSrc` with `newSrc` on every element that references it.
   * One transaction wraps the whole batch, so undo reverses everything.
   *
   * Returns a ReplaceAcrossResult listing succeeded and failed elements.
   * `clean=true` means every element in the batch succeeded. When some
   * elements fail, the batch is still committed (partial success), but
   * the caller should surface the failed list via a dialog. Emits
   * REPLACE_PARTIAL for telemetry. If every element fails, the batch is
   * rolled back and REPLACE_ROLLED_BACK is emitted.
   */
  replaceAcross(oldSrc: string, newSrc: string): ReplaceAcrossResult {
    const elements = this.composer.elements.findByMediaSrc(oldSrc);

    this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_OPENED, {
      oldSrc,
      usageCount: elements.length,
    });

    const replaced: ReplaceResult[] = [];
    const failed: Array<{ elementId: string; error: string }> = [];

    this.composer.beginTransaction("Replace across canvas");
    try {
      for (const element of elements) {
        const elementId = element.getId();
        try {
          const previousSrc = this.getElementSrc(element);
          this.setElementSrc(element, oldSrc, newSrc);
          replaced.push({ elementId, previousSrc });
        } catch (err) {
          failed.push({
            elementId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // If every element failed, roll back the batch entirely.
      if (elements.length > 0 && replaced.length === 0) {
        this.composer.rollbackTransaction();
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_ROLLED_BACK, {
          oldSrc,
          reason: "all-failed",
        });
        return { replaced, failed, clean: false };
      }

      this.composer.endTransaction();

      const clean = failed.length === 0;
      if (clean) {
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_COMMITTED, {
          oldSrc,
          newSrc,
          count: replaced.length,
        });
      } else {
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_PARTIAL, {
          oldSrc,
          newSrc,
          succeeded: replaced.length,
          failed,
        });
        // Throw is too aggressive here — partial success is a real outcome
        // the UI should display, not an exception. Callers inspect `clean`.
        void new MediaReplacePartialError(failed, replaced.length);
      }

      return { replaced, failed, clean };
    } catch (err) {
      this.composer.rollbackTransaction();
      this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_ROLLED_BACK, {
        oldSrc,
        reason: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  /**
   * Count and list elements that reference a given media src.
   * O(N) scan over all elements on the active page. UI should memoize.
   */
  getUsages(src: string): { count: number; elements: Element[] } {
    const elements = this.composer.elements.findByMediaSrc(src);
    return { count: elements.length, elements };
  }

  /** Returns true if any canvas element references this src. */
  isInUse(src: string): boolean {
    return this.composer.elements.findByMediaSrc(src).length > 0;
  }

  /**
   * S21 — Group asset usage by page.
   *
   * Walks each page's element tree (root + descendants) so the result
   * keys cleanly by pageId. Returns an empty map when src is empty or
   * no element matches. Used by ReplaceAcrossModal to build the
   * per-page checkbox list.
   *
   * O(P × N) where P = pages, N = avg elements/page. Cheap given typical
   * project sizes; UI memoizes per-asset.
   */
  getUsagesByPage(src: string): Map<string, Element[]> {
    const out = new Map<string, Element[]>();
    if (!src) return out;
    const pages = this.composer.elements.getAllPages?.() ?? [];
    for (const page of pages) {
      const root = this.composer.elements.getElement?.(page.root.id);
      if (!root) continue;
      const tree: Element[] = [root, ...root.getDescendants()];
      const matches = tree.filter((el) => {
        const elSrc = el.getAttribute?.("src");
        if (elSrc === src) return true;
        const bg = el.getStyle?.("background-image");
        return Boolean(bg && bg.includes(src));
      });
      if (matches.length > 0) out.set(page.id, matches);
    }
    return out;
  }

  /**
   * S21 — Selective per-page variant of replaceAcross.
   *
   * Same transactional + partial-success semantics as replaceAcross;
   * only touches elements on pages whose id is in `pageIds`. Pages not
   * in the set are skipped silently.
   *
   * Returns the same ReplaceAcrossResult shape so callers can render
   * partial-success UI uniformly.
   */
  replaceAcrossSelective(
    oldSrc: string,
    newSrc: string,
    pageIds: ReadonlyArray<string>,
  ): ReplaceAcrossResult {
    const byPage = this.getUsagesByPage(oldSrc);
    const targetSet = new Set(pageIds);
    const elements: Element[] = [];
    for (const [pageId, pageElements] of byPage) {
      if (targetSet.has(pageId)) elements.push(...pageElements);
    }

    this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_OPENED, {
      oldSrc,
      usageCount: elements.length,
    });

    const replaced: ReplaceResult[] = [];
    const failed: Array<{ elementId: string; error: string }> = [];

    this.composer.beginTransaction("Replace across selected pages");
    try {
      for (const element of elements) {
        const elementId = element.getId();
        try {
          const previousSrc = this.getElementSrc(element);
          this.setElementSrc(element, oldSrc, newSrc);
          replaced.push({ elementId, previousSrc });
        } catch (err) {
          failed.push({
            elementId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      if (elements.length > 0 && replaced.length === 0) {
        this.composer.rollbackTransaction();
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_ROLLED_BACK, {
          oldSrc,
          reason: "all-failed",
        });
        return { replaced, failed, clean: false };
      }

      this.composer.endTransaction();

      const clean = failed.length === 0;
      if (clean) {
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_COMMITTED, {
          oldSrc,
          newSrc,
          count: replaced.length,
        });
      } else {
        this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_PARTIAL, {
          oldSrc,
          newSrc,
          succeeded: replaced.length,
          failed,
        });
        void new MediaReplacePartialError(failed, replaced.length);
      }

      return { replaced, failed, clean };
    } catch (err) {
      this.composer.rollbackTransaction();
      this.composer.media.emitEvent(MEDIA_EVENTS.REPLACE_ROLLED_BACK, {
        oldSrc,
        reason: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  // ============================================
  // Internals
  // ============================================

  /** Read src from an element. Checks `src` attr first, then background-image url(). */
  private getElementSrc(element: Element): string {
    const src = element.getAttribute("src");
    if (src) return src;

    const bgImage = element.getStyle("background-image");
    if (bgImage) {
      const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) return match[1];
    }
    return "";
  }

  private isSafeSrc(src: string): boolean {
    return isSafeSrc(src);
  }

  /**
   * Write newSrc onto an element. If the element uses background-image,
   * rewrite that; otherwise set the `src` attribute.
   */
  private setElementSrc(element: Element, oldSrc: string, newSrc: string): void {
    if (!this.isSafeSrc(newSrc)) {
      throw new Error(
        `Refusing to set unsafe src: scheme not in allowlist (http/https/blob/data:image)`,
      );
    }
    const bgImage = element.getStyle("background-image");
    if (bgImage && bgImage.includes("url(")) {
      // If oldSrc is present in the bg-image, scope the replacement to it
      // (handles elements that reference multiple images). Otherwise just
      // set the bg-image to newSrc.
      if (oldSrc && bgImage.includes(oldSrc)) {
        element.setStyle("background-image", bgImage.replace(oldSrc, newSrc));
      } else {
        element.setStyle("background-image", `url(${newSrc})`);
      }
    } else {
      element.setAttribute("src", newSrc);
    }
    this.composer.emit(EVENTS.ELEMENT_STYLE_UPDATED, {
      elementIds: [element.getId()],
      property: "src",
      value: newSrc,
    });
  }
}
