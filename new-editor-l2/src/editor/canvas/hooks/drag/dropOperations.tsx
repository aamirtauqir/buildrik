/**
 * Drop Operations - Handlers for different drop types
 * Extracted from useCanvasDragDrop to reduce file size
 *
 * @module components/Canvas/hooks/drag/dropOperations
 * @license BSD-3-Clause
 */

import * as React from "react";
import { getBlockById, insertBlock } from "../../../../blocks/blockRegistry";
import type { Composer } from "../../../../engine";
import type { ElementType, GrapesElement } from "../../../../shared/types";
import type { ContextMenuItem } from "../../../../shared/ui/ContextMenu";
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
  canvasRef: React.RefObject<HTMLDivElement>;
  freshTargetId: string | null;
  freshDropPosition: DropPosition;
  onDropError?: (error: DropError) => void;
  onDropSuccess?: (success: DropSuccess) => void;
  onShowContextMenu?: (items: ContextMenuItem[], x: number, y: number) => void;
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
      dropTargetEl = document.querySelector(`[data-aqb-id="${rootId}"]`) as HTMLElement | null;
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
  try {
    const targetId = freshTargetId || composer.elements.getActivePage()?.root?.id;
    if (targetId) {
      await composer.components.instantiateComponent(componentId, targetId);
    }
    composer.endTransaction();
  } catch {
    composer.rollbackTransaction();
    onDropError?.({ type: "INSERT_FAILED", message: "Failed to instantiate component" });
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
            `[data-aqb-id="${createdElements[0].getId()}"]`
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

    // GAP-FIX: Intercept "heading" drop to show context menu for H1-H6 selection
    // Use setTimeout to ensure drag operation is fully cleared and state updates reliably
    if (block.id === "heading" && ctx.onShowContextMenu) {
      const clientX = e.clientX;
      const clientY = e.clientY;

      // Determine potential drop target
      const activePage = composer.elements.getActivePage();
      if (!activePage) return false;
      const rootElement = composer.elements.getElement(activePage.root.id);
      if (!rootElement) return false;

      let targetEl = (freshTargetId && composer.elements.getElement(freshTargetId)) || null;

      if (!targetEl) {
        // Fallback: find target from DOM
        const domTarget = (e.target as HTMLElement).closest("[data-aqb-id]") as HTMLElement | null;
        const fallbackId = domTarget?.getAttribute("data-aqb-id");
        if (fallbackId) {
          targetEl = composer.elements.getElement(fallbackId) || null;
        }
      }

      // Resolve drop target context
      // We assume 'heading' maps to 'heading' generic type for validation
      const resolved = findValidDropTargetWithFallback(targetEl, rootElement, "heading", {});

      if (!resolved.success || !resolved.result) {
        onDropError?.({ type: "NO_VALID_TARGET", message: "Cannot place heading here" });
        return true;
      }

      const { parent: parentElement, index: dropIndex } = resolved.result;

      // Show Context Menu
      const menuItems: ContextMenuItem[] = [1, 2, 3, 4, 5, 6].map((level) => ({
        id: `h${level}`,
        label: `Heading ${level}`,
        icon: <span style={{ fontSize: 10, fontWeight: 700 }}> H{level} </span>,
        onClick: () => {
          composer.beginTransaction("insert-heading");
          try {
            const specificDef = getBlockById(`heading${level}`);
            if (specificDef) {
              const newId = insertBlock(composer, specificDef, parentElement.getId(), dropIndex);
              if (newId) {
                const newEl = composer.elements.getElement(newId);
                setTimeout(() => {
                  if (newEl) composer.selection.select(newEl);
                  onDropSuccess?.({ elementLabel: `Heading ${level}`, elementType: `h${level}` });
                }, 0);
              }
            }
          } catch {
            composer.rollbackTransaction();
            onDropError?.({ type: "INSERT_FAILED", message: "Failed to insert heading" });
          }
          composer.endTransaction();
        },
      }));

      setTimeout(() => {
        ctx.onShowContextMenu?.(menuItems, clientX, clientY);
      }, 0);
      return true; // Handled
    }

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
        const domTarget = (e.target as HTMLElement).closest("[data-aqb-id]") as HTMLElement | null;
        const fallbackId = domTarget?.getAttribute("data-aqb-id");
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
              `[data-aqb-id="${newElementId}"]`
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
