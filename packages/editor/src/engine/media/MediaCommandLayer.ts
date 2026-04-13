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

export class MediaCommandLayer {
  constructor(private readonly composer: Composer) {}

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
    this.composer.emit("element:style-updated", {
      elementIds: [element.getId()],
      property: "src",
      value: newSrc,
    });
  }
}
