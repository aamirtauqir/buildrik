/**
 * Drop Operations - Handlers for different drop types
 * Extracted from useCanvasDragDrop to reduce file size
 *
 * @module components/Canvas/hooks/drag/dropOperations
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockById, insertBlock } from "../../../../blocks/blockRegistry";
import { CATALOG } from "../../../components-catalog/catalog";
import { placeCatalogComponent } from "../../../components-catalog/placeCatalogComponent";
import type { Composer } from "../../../../engine";
import type { ElementType, GrapesElement } from "../../../../shared/types";
import { devError } from "../../../../shared/utils/devLogger";
import {
  findDropTargetElement,
  getElementId,
  findValidDOMTarget,
  calculateFinalIndex,
  findValidDropTargetWithFallback,
} from "../../../../shared/utils/dragDrop";
import { animateDropSuccess } from "../../../../shared/utils/dragDrop/animations";
import type { MultiDragElement } from "../../../../shared/utils/dragDrop/types";
import { canNestElement } from "../../../../shared/utils/nesting";
import type { DropError, DropSuccess } from "../useCanvasDragDrop";
import type { DropPosition } from "../useDragSession";

// =============================================================================
// TYPES
// =============================================================================

export interface DropContext {
  composer: Composer;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  freshTargetId: string | null;
  freshDropPosition: DropPosition;
  onDropError?: (error: DropError) => void;
  onDropSuccess?: (success: DropSuccess) => void;
}

// =============================================================================
// MULTI-ELEMENT DROP
// =============================================================================

/**
 * Handle multi-element drop operation
 * Returns true if handled, false if not a multi-element drop
 */
export function handleMultiElementDrop(e: React.DragEvent, ctx: DropContext): boolean {
  const multiData = e.dataTransfer.getData("application/x-aquibra-multi");
  if (!multiData) return false;

  const { composer, freshTargetId, freshDropPosition, onDropError } = ctx;

  try {
    const data = JSON.parse(multiData);
    if (!data.elements || !Array.isArray(data.elements) || data.elements.length === 0) {
      return false;
    }

    // Validate each element has required properties
    const validElements = (data.elements as MultiDragElement[]).filter(
      (el: MultiDragElement) => el && typeof el.elementId === "string" && el.elementId.length > 0
    );

    if (validElements.length === 0) {
      onDropError?.({ type: "INVALID_DATA", message: "No valid elements to drop" });
      return true;
    }

    const page = composer.elements.getActivePage();
    if (!page?.root?.id) {
      onDropError?.({ type: "NO_VALID_TARGET", message: "No active page to drop into" });
      return true;
    }

    const rootElement = composer.elements.getElement(page.root.id);
    if (!rootElement) {
      onDropError?.({ type: "NO_VALID_TARGET", message: "Page root element not found" });
      return true;
    }

    const target = freshTargetId ? composer.elements.getElement(freshTargetId) : rootElement;
    const parent = target?.getParent?.() || rootElement;
    const parentId = parent.getId();

    const siblings = parent.getChildren?.() || [];
    let baseIndex = siblings.length;

    if (target && target !== rootElement) {
      const targetIndex = siblings.findIndex((s: GrapesElement) => s.getId() === freshTargetId);
      if (targetIndex >= 0) {
        baseIndex = freshDropPosition === "before" ? targetIndex : targetIndex + 1;
      }
    }

    composer.beginTransaction("multi-element-move");
    try {
      // Sort by original index descending to process from bottom to top
      const sortedElements = [...validElements].sort(
        (a, b) => (b.originalIndex ?? 0) - (a.originalIndex ?? 0)
      );

      for (const elData of sortedElements) {
        const elementId = elData.elementId;
        const element = composer.elements.getElement(elementId);
        if (!element) continue;

        const descendants = element.getDescendants?.() || [];
        const descendantIds = new Set(descendants.map((d: GrapesElement) => d.getId()));
        if (descendantIds.has(parentId)) continue;

        // Re-fetch FRESH siblings after each move
        const freshSiblings = parent.getChildren?.() || [];
        const currentParent = element.getParent?.();
        let finalIndex = baseIndex;

        // Adjust index if element is already in target parent
        if (currentParent?.getId() === parentId) {
          const currentIndex = freshSiblings.findIndex(
            (s: GrapesElement) => s.getId() === elementId
          );
          if (currentIndex >= 0 && currentIndex < finalIndex) {
            finalIndex = Math.max(0, finalIndex - 1);
          }
        }

        composer.elements.moveElement(elementId, parentId, finalIndex);
      }
      composer.endTransaction();
      setTimeout(() => composer.selection.reselect(), 0);
    } catch (error) {
      devError("dropOperations", "Failed to move multiple elements during drop", error);
      composer.rollbackTransaction();
      onDropError?.({ type: "MOVE_FAILED", message: "Failed to move elements" });
    }

    return true;
  } catch (error) {
    devError("dropOperations", "Invalid multi-element data format", error);
    return false;
  }
}

// =============================================================================
// SINGLE ELEMENT DROP
// =============================================================================

/**
 * Handle single element drop (move existing element)
 * Returns true if handled, false if not an element drop
 */
export function handleElementDrop(
  e: React.DragEvent,
  ctx: DropContext,
  dropTargetId: string | null
): boolean {
  const elementData = e.dataTransfer.getData("element");
  if (!elementData) return false;

  const { composer, freshTargetId, onDropError } = ctx;

  try {
    const { elementId } = JSON.parse(elementData);
    if (!elementId) return false;

    const sourceEl = composer.elements.getElement(elementId);
    if (!sourceEl) return false;

    const page = composer.elements.getActivePage();
    if (page && page.root.id === elementId) return true; // Can't move root

    // Use targetHint (freshly calculated) or fall back to dropTargetId state
    let dropTargetEl = findDropTargetElement(e.clientX, e.clientY, freshTargetId ?? dropTargetId);

    const descendants = sourceEl.getDescendants?.() || [];
    const descendantIds = new Set(descendants.map((d: GrapesElement) => d.getId()));
    const skipIds = new Set([elementId, ...descendantIds]);
    dropTargetEl = findValidDOMTarget(dropTargetEl, skipIds);

    if (!dropTargetEl) {
      if (!page) return true;
      const rootId = page.root.id;
      dropTargetEl = document.querySelector(`[data-buildrick-id="${rootId}"]`) as HTMLElement | null;
      if (!dropTargetEl) return true;
    }

    const targetId = getElementId(dropTargetEl);
    if (!targetId || targetId === elementId) return true;

    const targetEl = composer.elements.getElement(targetId);
    if (!targetEl) return true;

    const sourceType = sourceEl.getType() as ElementType;
    const currentParent = sourceEl.getParent();
    const currentParentId = currentParent?.getId();
    const droppingOnSameParent = Boolean(currentParent) && currentParentId === targetId;

    const rootEl = page ? (composer.elements.getElement(page.root.id) ?? null) : null;
    const resolved = findValidDropTargetWithFallback(targetEl, rootEl, sourceType, {
      skipElementId: elementId,
      skipDescendantIds: descendantIds,
      skipCurrentParent: droppingOnSameParent,
      currentParentId,
    });

    if (!resolved.success || !resolved.result) {
      return true;
    }

    const { parent: newParent, index: resolvedIndex } = resolved.result;
    const newParentId = newParent.getId();
    const finalIndex = calculateFinalIndex(sourceEl, newParent, resolvedIndex);

    composer.beginTransaction("move-element");
    try {
      composer.elements.moveElement(elementId, newParentId, finalIndex);
      composer.endTransaction();
      setTimeout(() => composer.selection.reselect(), 0);
    } catch (error) {
      devError("dropOperations", "Failed to move element during drag operation", error);
      composer.rollbackTransaction();
      onDropError?.({ type: "MOVE_FAILED", message: "Failed to move element" });
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// COMPONENT DROP
// =============================================================================

/**
 * Handle component drop (instantiate component)
 * Returns true if handled, false if not a component drop
 */
export async function handleComponentDrop(e: React.DragEvent, ctx: DropContext): Promise<boolean> {
  const componentId = e.dataTransfer.getData("application/x-aquibra-component");
  if (!componentId) return false;

  const { composer, freshTargetId, onDropError } = ctx;
  if (!composer.components) return false;

  composer.beginTransaction("instantiate-component-drop");
  let newElementId: string | null = null;
  try {
    const targetId = freshTargetId || composer.elements.getActivePage()?.root?.id;
    if (targetId) {
      newElementId = await composer.components.instantiateComponent(componentId, targetId);
    }
    composer.endTransaction();
  } catch {
    composer.rollbackTransaction();
    onDropError?.({ type: "INSERT_FAILED", message: "Failed to instantiate component" });
    return true;
  }

  // Gap C Frame 4 — auto-select after drop. Inspector mounts immediately.
  if (newElementId) {
    const newElement = composer.elements.getElement(newElementId);
    if (newElement) {
      composer.selection.select(newElement);
    }

    // Gap C Frame 3 — insert animation. queueMicrotask defers the DOM
    // query until after the engine flushes the new element into the
    // canvas innerHTML. The attribute triggers the bd-canvas-drop-fade-in
    // keyframe (Canvas.css) and is cleaned up after 200ms.
    queueMicrotask(() => {
      const node = document.querySelector(
        `[data-buildrick-id="${newElementId}"]`,
      );
      if (node) {
        node.setAttribute("data-just-added", "true");
        setTimeout(() => node.removeAttribute("data-just-added"), 200);
      }
    });
  }

  return true;
}

// =============================================================================
// TEMPLATE DROP
// =============================================================================

/**
 * Handle template drop
 * Returns true if handled, false if not a template drop
 */
export function handleTemplateDrop(e: React.DragEvent, ctx: DropContext): boolean {
  const templateData = e.dataTransfer.getData("application/aquibra-template");
  if (!templateData) return false;

  const { composer, canvasRef, freshTargetId, freshDropPosition, onDropError } = ctx;

  try {
    const data = JSON.parse(templateData);
    if (!data.html) return false;

    composer.beginTransaction("insert-template-drop");
    try {
      const activePage = composer.elements.getActivePage();
      if (!activePage?.root?.id) {
        throw new Error("No active page");
      }

      let parentId = activePage.root.id;
      let insertIndex: number | undefined = undefined;

      // Calculate precise position based on drop target
      if (freshTargetId && freshTargetId !== activePage.root.id) {
        const targetEl = composer.elements.getElement(freshTargetId);
        if (targetEl) {
          const parentEl = targetEl.getParent?.();
          if (parentEl) {
            parentId = parentEl.getId();
            const siblings = parentEl.getChildren?.() || [];
            const targetIndex = siblings.findIndex(
              (s: GrapesElement) => s.getId() === freshTargetId
            );

            if (targetIndex >= 0) {
              if (freshDropPosition === "before") {
                insertIndex = targetIndex;
              } else if (freshDropPosition === "after") {
                insertIndex = targetIndex + 1;
              }
            }
          }
        }
      }

      const createdElements = composer.elements.insertHTMLToElement(
        parentId,
        data.html,
        insertIndex
      );

      // Auto-select first created element + success animation
      if (createdElements.length > 0 && canvasRef.current) {
        setTimeout(() => {
          composer.selection.select(createdElements[0]);

          const domEl = canvasRef.current?.querySelector(
            `[data-buildrick-id="${createdElements[0].getId()}"]`
          ) as HTMLElement | null;
          if (domEl) {
            animateDropSuccess(domEl);
          }
        }, 0);
      }

      composer.endTransaction();
    } catch {
      composer.rollbackTransaction();
      onDropError?.({ type: "INSERT_FAILED", message: "Failed to insert template" });
    }

    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// BLOCK DROP
// =============================================================================

/**
 * Handle block drop (insert new element)
 * Returns true if handled, false if not a block drop
 */
export function handleBlockDrop(e: React.DragEvent, ctx: DropContext): boolean {
  const blockData = e.dataTransfer.getData("block");
  if (!blockData) return false;

  const { composer, canvasRef, freshTargetId, onDropError, onDropSuccess } = ctx;

  try {
    const block = JSON.parse(blockData);

    const def = getBlockById(block.id);

    if (!def) {
      onDropError?.({ type: "INVALID_DATA", message: `Unknown block type: ${block.id}` });
      return true;
    }

    if (!def.elementType) {
      onDropError?.({ type: "INVALID_DATA", message: `Block "${def.label}" has no element type` });
      return true;
    }

    composer.beginTransaction("insert-block-drop");
    try {
      const activePage =
        composer.elements.getActivePage() || composer.elements.createPage("Page 1");
      const rootElement = composer.elements.getElement(activePage.root.id);

      if (!rootElement) {
        composer.rollbackTransaction();
        onDropError?.({ type: "NO_VALID_TARGET", message: "Page root element not found" });
        return true;
      }

      let targetEl = (freshTargetId && composer.elements.getElement(freshTargetId)) || null;

      if (!targetEl) {
        const domTarget = (e.target as HTMLElement).closest("[data-buildrick-id]") as HTMLElement | null;
        const fallbackId = domTarget?.getAttribute("data-buildrick-id");
        if (fallbackId) {
          targetEl = composer.elements.getElement(fallbackId) || null;
        }
      }

      const resolved = findValidDropTargetWithFallback(targetEl, rootElement, def.elementType, {});

      let parentElement = rootElement;
      let dropIndex: number | undefined = undefined;

      if (resolved.success && resolved.result) {
        parentElement = resolved.result.parent;
        dropIndex = resolved.result.index;

        // Clear column placeholder text
        const targetClasses = parentElement.getClasses?.() || [];
        if (targetClasses.includes("col")) {
          const content = parentElement.getContent?.() || "";
          if (/^(Column|Col)\s*\d*$/i.test(content.trim())) {
            parentElement.setContent?.("");
          }
        }
      }

      const finalParentType = parentElement.getType() as ElementType;
      if (!canNestElement(def.elementType, finalParentType)) {
        composer.rollbackTransaction();
        onDropError?.({
          type: "NESTING_FORBIDDEN",
          message: `Cannot place ${def.label} inside ${finalParentType}`,
        });
        return true;
      }

      const newElementId = insertBlock(composer, def, parentElement.getId(), dropIndex);
      composer.endTransaction();

      // Auto-select after transaction ends
      if (newElementId) {
        const newElement = composer.elements.getElement(newElementId);
        if (newElement) {
          setTimeout(() => {
            composer.selection.select(newElement);

            // Drop success animation
            const domEl = canvasRef.current?.querySelector(
              `[data-buildrick-id="${newElementId}"]`
            ) as HTMLElement | null;
            if (domEl) {
              animateDropSuccess(domEl);
            }

            // Toast notification
            onDropSuccess?.({
              elementLabel: def.label,
              elementType: def.elementType,
            });
          }, 0);
        }
      }
    } catch {
      composer.rollbackTransaction();
      onDropError?.({ type: "INSERT_FAILED", message: "Failed to add element to canvas" });
    }

    return true;
  } catch {
    onDropError?.({ type: "INVALID_DATA", message: "Invalid block data" });
    return true;
  }
}

// ============================================================================
// CATALOG DROP — places a Buildrik-shipped catalog ComponentType (S6)
// ============================================================================

/**
 * Reads `application/x-buildrik-catalog-component` payload set by CatalogRow
 * (S6 CU2). Looks up the ComponentType from the bundled catalog and inserts
 * a placeholder element via placeCatalogComponent.
 *
 * v1 limitation: schema interpretation deferred — the inserted element
 * carries data-buildrik-catalog-component + data-variant attrs so a future
 * renderer arc can pick it up and render the full schema-driven tree.
 */
export function handleCatalogDrop(
  e: React.DragEvent,
  ctx: DropContext,
  payloads?: { catalogComponentId?: string },
): boolean {
  // Prefer pre-snapshotted payload (dispatcher reads dataTransfer
  // synchronously to dodge the post-await zero-out). Fall back to direct
  // read for callers that haven't migrated yet.
  const catalogId = payloads?.catalogComponentId
    ?? e.dataTransfer.getData("application/x-buildrik-catalog-component");
  if (!catalogId) return false;

  const { composer, freshTargetId, onDropError, onDropSuccess } = ctx;

  const component = CATALOG.find((c) => c.id === catalogId);
  if (!component) {
    onDropError?.({ type: "INVALID_DATA", message: `Unknown catalog component: ${catalogId}` });
    return true;
  }

  const activePage = composer.elements.getActivePage();
  if (!activePage) {
    onDropError?.({ type: "NO_VALID_TARGET", message: "No active page for catalog drop" });
    return true;
  }
  const parentId = freshTargetId ?? activePage.root.id;

  const result = placeCatalogComponent(composer, component, parentId);

  if (result.elementId) {
    onDropSuccess?.({ elementLabel: component.name, elementType: "container" });
  } else {
    onDropError?.({ type: "INSERT_FAILED", message: `Could not place ${component.name}` });
  }
  return true;
}
