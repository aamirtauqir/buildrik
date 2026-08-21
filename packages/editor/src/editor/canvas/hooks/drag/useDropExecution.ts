/**
 * useDropExecution — extracted from useCanvasDragDrop (Phase D D1
 * split, stage 3). Owns the drop-event execution path:
 *
 *   1. Synchronously snapshot the DataTransfer payloads (real browsers
 *      zero out DataTransfer at the first await — read once up-front).
 *   2. Tear down the drag session (resetSession + clear visuals +
 *      stop auto-scroll + clear affordance).
 *   3. Guard against !composer / isEditing.
 *   4. OS-file drop branch (image upload + apply src to target).
 *   5. Internal-media drop branch (insertMediaAt + optional auto-save).
 *   6. Dispatch chain:
 *        handleMultiElementDrop → handleElementDrop → handleComponentDrop
 *        → handleTemplateDrop → handleBlockDrop (terminal).
 *   7. Notify DragManager SSOT via composer.drag.end(dropSucceeded).
 *
 * The returned `drop(e)` function is the public handler the orchestrator
 * wires into its return shape (it replaces the previous
 * handleDropWithInternal wrapper).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { findDropTargetElement } from "../../../../shared/utils/dragDrop";
import { calculateFreshDropTarget } from "./dragCalculations";
import {
  handleMultiElementDrop,
  handleElementDrop,
  handleComponentDrop,
  handleCatalogDrop,
  handleTemplateDrop,
  handleBlockDrop,
  type DropContext,
} from "./dropOperations";

// Inline payload shape — dropOperations doesn't (yet) export this; was a
// dangling import before S6 catalog drop landed. Inlining keeps the type
// in lockstep with the dispatcher's pre-snapshot sites.
interface DropPayloads {
  multiData: string;
  elementData: string;
  componentId: string;
  templateData: string;
  blockData: string;
}
import type { SnapLine } from "../useCanvasSnapping";
import type { DropError, DropSuccess } from "../useCanvasDragDrop";

export interface UseDropExecutionOptions {
  composer: Composer | null;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isEditing: boolean;
  dropTargetId: string | null;
  resetSession: () => void;
  visuals: { clearAllIndicators: () => void };
  autoScroll: { stopCurrentAutoScroll: () => void };
  clearDropAffordance: () => void;
  onSnapLinesChangeRef: React.MutableRefObject<(lines: SnapLine[]) => void>;
  onDropErrorRef: React.MutableRefObject<((e: DropError) => void) | undefined>;
  onDropSuccessRef: React.MutableRefObject<((s: DropSuccess) => void) | undefined>;
}

export interface UseDropExecutionResult {
  /** Public drop handler — wraps internal-media short-circuit + main dispatcher. */
  drop: (e: React.DragEvent) => Promise<void>;
}

export function useDropExecution({
  composer,
  canvasRef,
  isEditing,
  dropTargetId,
  resetSession,
  visuals,
  autoScroll,
  clearDropAffordance,
  onSnapLinesChangeRef,
  onDropErrorRef,
  onDropSuccessRef,
}: UseDropExecutionOptions): UseDropExecutionResult {
  // ---------------------------------------------------------------------------
  // INTERNAL MEDIA DROP — separate path used when the dataTransfer carries
  // an `application/x-aquibra-media-src` MIME (drag from MediaTab).
  // ---------------------------------------------------------------------------
  const handleInternalMediaDrop = React.useCallback(
    async (e: React.DragEvent) => {
      const src = e.dataTransfer.getData("application/x-aquibra-media-src");
      const rawType = e.dataTransfer.getData("application/x-aquibra-media-type");
      const name = e.dataTransfer.getData("application/x-aquibra-media-name");
      if (!src || !composer) return;

      const { targetId } = calculateFreshDropTarget(
        e.clientX,
        e.clientY,
        composer,
        canvasRef,
        findDropTargetElement,
      );

      const canvasEl = canvasRef.current;
      const rect = canvasEl?.getBoundingClientRect();
      const x = rect ? Math.round(e.clientX - rect.left) : undefined;
      const y = rect ? Math.round(e.clientY - rect.top) : undefined;

      const insertType =
        rawType === "img"
          ? "image"
          : rawType === "vid"
            ? "video"
            : rawType === "ico"
              ? "icon"
              : rawType === "fnt"
                ? "font"
                : (rawType as "image" | "video" | "icon" | "svg" | "audio" | "lottie" | "font");

      try {
        const result = composer.mediaOps.insertMediaAt(src, insertType, {
          x,
          y,
          targetElementId: targetId ?? undefined,
          path: "drag",
        });

        if (result && src.startsWith("blob:")) {
          /* Same truth the Media panel's click-insert tells: an asset that
             never reached the server carries a session URL, which the
             sanitizer strips on the way into the document. The element is
             there; it will not render and will not publish. */
          onDropErrorRef.current?.({
            type: "LOCAL_ONLY_MEDIA",
            message: `${name || "That file"} is only on this device — it won't show on the page or publish. Re-upload when you're back online.`,
          });
        } else if (result) {
          onDropSuccessRef.current?.({
            elementLabel: `${name || "Media"} ${targetId ? "applied" : "added"} ✓`,
            elementType: insertType,
          });
        } else {
          onDropErrorRef.current?.({
            type: "INSERT_FAILED",
            message: "Could not place media",
          });
        }
      } catch (err) {
        onDropErrorRef.current?.({
          type: "INSERT_FAILED",
          message: err instanceof Error ? err.message : String(err),
        });
      }

      // Auto-save remote (stock/discovery) assets to the library so the
      // user's next session has them locally.
      if ((insertType === "image" || rawType === "img") && src.startsWith("http")) {
        try {
          const res = await fetch(src);
          const blob = await res.blob();
          const file = new File(
            [blob],
            `imported-${(name || "img").substring(0, 10)}.webp`,
            { type: blob.type || "image/webp" },
          );
          await composer.media.uploadFile(file);
        } catch (err) {
          // Non-fatal — drop already succeeded, library is just the cache.
          console.warn("Media auto-save to library failed:", err);
        }
      }
    },
    [composer, canvasRef, onDropSuccessRef, onDropErrorRef],
  );

  // ---------------------------------------------------------------------------
  // MAIN DROP DISPATCHER
  // ---------------------------------------------------------------------------
  const handleMainDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();

      // CRITICAL: snapshot every DataTransfer channel SYNCHRONOUSLY before any
      // React state updates, awaits, or sub-handler calls. In real browsers the
      // DataTransfer object is only reliably readable inside the synchronous
      // native drop handler — a single microtask boundary (e.g. `await`) zeros
      // it out. We pre-read once and pass the cached payloads down.
      const payloads: DropPayloads & { catalogComponentId: string } = {
        multiData: e.dataTransfer.getData("application/x-aquibra-multi"),
        elementData: e.dataTransfer.getData("element"),
        componentId: e.dataTransfer.getData("application/x-aquibra-component"),
        templateData: e.dataTransfer.getData("application/aquibra-template"),
        blockData: e.dataTransfer.getData("block"),
        catalogComponentId: e.dataTransfer.getData("application/x-buildrik-catalog-component"),
      };

      resetSession();
      onSnapLinesChangeRef.current([]);
      visuals.clearAllIndicators();
      clearDropAffordance();
      autoScroll.stopCurrentAutoScroll();

      if (!composer || isEditing) {
        if (isEditing) {
          onDropErrorRef.current?.({
            type: "EDITING_MODE",
            message: "Cannot drop while editing text",
          });
        }
        return;
      }

      const { targetId: freshTargetId, dropPosition: freshDropPosition } = calculateFreshDropTarget(
        e.clientX,
        e.clientY,
        composer,
        canvasRef,
        findDropTargetElement,
      );

      const ctx: DropContext = {
        composer,
        canvasRef,
        freshTargetId,
        freshDropPosition,
        onDropError: onDropErrorRef.current,
        onDropSuccess: onDropSuccessRef.current,
      };

      // OS file-drop branch
      if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter((f) => f.type.startsWith("image/"));

        if (imageFiles.length > 0) {
          const { targetId: ftId } = calculateFreshDropTarget(
            e.clientX,
            e.clientY,
            composer,
            canvasRef,
            findDropTargetElement,
          );

          if (ftId) {
            const el = composer.elements.getElement(ftId);
            if (el) {
              const file = imageFiles[0];
              onDropSuccessRef.current?.({
                elementLabel: `Uploading ${file.name}...`,
                elementType: "image",
              });

              try {
                const result = await composer.media.uploadFile(file);
                if (result.success && result.asset) {
                  el.setAttribute("src", result.asset.src);
                  onDropSuccessRef.current?.({
                    elementLabel: `${file.name} applied ✓`,
                    elementType: "image",
                  });
                }
              } catch (err) {
                onDropErrorRef.current?.({
                  type: "INSERT_FAILED",
                  message: "Could not upload dropped image",
                });
              }
            }
          }
          return;
        }
      }

      // Dispatch chain
      let dropSucceeded = false;
      if ((handleMultiElementDrop as any)(e, ctx, payloads)) {
        dropSucceeded = true;
      } else if ((handleElementDrop as any)(e, ctx, dropTargetId, payloads)) {
        dropSucceeded = true;
      } else if (await (handleComponentDrop as any)(e, ctx, payloads)) {
        dropSucceeded = true;
      } else if (handleCatalogDrop(e, ctx, payloads)) {
        // S6 catalog drop. Payload is pre-snapshotted into `payloads` above
        // so the dataTransfer microtask zero-out doesn't bite this branch.
        dropSucceeded = true;
      } else if ((handleTemplateDrop as any)(e, ctx, payloads)) {
        dropSucceeded = true;
      } else {
        (handleBlockDrop as any)(e, ctx, payloads);
        dropSucceeded = true;
      }

      composer.canvas.drag?.end(dropSucceeded);
    },
    [
      composer,
      isEditing,
      dropTargetId,
      canvasRef,
      resetSession,
      visuals,
      autoScroll,
      clearDropAffordance,
      onSnapLinesChangeRef,
      onDropErrorRef,
      onDropSuccessRef,
    ],
  );

  // ---------------------------------------------------------------------------
  // PUBLIC ENTRY — picks internal-media short-circuit before main dispatcher
  // ---------------------------------------------------------------------------
  const drop = React.useCallback(
    async (e: React.DragEvent) => {
      const internalSrc = e.dataTransfer.getData("application/x-aquibra-media-src");
      if (internalSrc) {
        e.preventDefault();
        await handleInternalMediaDrop(e);
        return;
      }
      await handleMainDrop(e);
    },
    [handleInternalMediaDrop, handleMainDrop],
  );

  return { drop };
}
