/**
 * Element CRUD Manager
 * Handles element create, read, update, delete operations
 *
 * @module engine/elements/manager/ElementCRUD
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants";
import type { ElementData } from "../../../shared/types";
import { devWarn } from "../../../shared/utils/devLogger";
import { generateId } from "../../../shared/utils/helpers";
import { getDefaultTagName, CONTAINER_TYPES } from "../../../shared/utils/html";
import { Element } from "../Element";
import type { ElementManagerContext } from "./types";

/**
 * Manages element CRUD operations
 */
export class ElementCRUD {
  private ctx: ElementManagerContext;

  constructor(context: ElementManagerContext) {
    this.ctx = context;
  }

  /**
   * Create a new element
   */
  createElement(type: ElementData["type"], options?: Partial<ElementData>): Element {
    const data: ElementData = {
      id: generateId("el"),
      type,
      tagName: getDefaultTagName(type),
      attributes: {},
      classes: [],
      styles: {},
      children: [],
      draggable: true,
      droppable: CONTAINER_TYPES.has(type),
      ...options,
    };

    const element = new Element(data, this.ctx.composer);
    this.ctx.elements.set(data.id, element);

    this.ctx.composer.emit(EVENTS.ELEMENT_CREATED, element);
    this.ctx.composer.markDirty();

    return element;
  }

  /**
   * Get element by ID
   */
  getElement(id: string): Element | undefined {
    return this.ctx.elements.get(id);
  }

  /**
   * Register an element (internal use)
   */
  registerElement(element: Element): void {
    this.ctx.elements.set(element.getId(), element);
  }

  /**
   * Add element to parent
   */
  addElement(element: Element, parentId: string, index?: number): boolean {
    const parent = this.ctx.elements.get(parentId);
    if (!parent) return false;

    parent.addChild(element, index);
    this.ctx.composer.emit(EVENTS.ELEMENT_CREATED, { element, parent, index });
    this.ctx.composer.markDirty();

    return true;
  }

  /**
   * Remove element
   */
  removeElement(id: string): boolean {
    const element = this.ctx.elements.get(id);
    if (!element) return false;

    // Prevent deleting page root
    const activePage = this.ctx.composer.elements.getActivePage();
    if (activePage?.root?.id === id) {
      devWarn("Composer", "Cannot delete page root element");
      this.ctx.composer.emit("error", {
        type: "invalid_operation",
        message: "Cannot delete page root element",
      });
      return false;
    }

    // Clear selection if deleting selected element or its ancestor
    const selectedElement = this.ctx.composer.selection.getSelected();
    if (selectedElement) {
      // Check if selected element is being deleted or is a descendant
      const isSelected = selectedElement.getId() === id;
      const isAncestor = selectedElement.isDescendantOf?.(element);

      if (isSelected || isAncestor) {
        // Select parent instead, or clear if no parent
        const parent = element.getParent();
        if (parent) {
          this.ctx.composer.selection.select(parent);
        } else {
          this.ctx.composer.selection.clear();
        }
      }
    }

    // Clean up multi-select
    const allSelected = this.ctx.composer.selection.getAllSelected();
    allSelected.forEach((sel) => {
      const isThisElement = sel.getId() === id;
      const isDescendant = sel.isDescendantOf?.(element);

      if (isThisElement || isDescendant) {
        this.ctx.composer.selection.removeFromSelection(sel);
      }
    });

    // Remove from parent
    const parent = element.getParent();
    if (parent) {
      parent.removeChild(element);
    }

    // Remove children FIRST (before deleting parent from registry)
    // so that recursive calls can still find children in the registry
    element.getChildren().forEach((child) => {
      this.removeElement(child.getId());
    });

    // THEN remove from registry (after children are deleted)
    this.ctx.elements.delete(id);

    this.ctx.composer.emit(EVENTS.ELEMENT_DELETED, element);
    this.ctx.composer.markDirty();

    return true;
  }

  /**
   * Move element to new parent
   */
  moveElement(elementId: string, newParentId: string, index?: number): boolean {
    const element = this.ctx.elements.get(elementId);
    const newParent = this.ctx.elements.get(newParentId);

    if (!element || !newParent) return false;

    const oldParent = element.getParent();
    const movingWithinSameParent = oldParent && oldParent.getId?.() === newParent.getId?.();

    // If moving within the same parent and dropping after a sibling,
    // adjust the index to account for removal shifting positions.
    let adjustedIndex = index;
    if (movingWithinSameParent && adjustedIndex !== undefined) {
      const oldIndex = oldParent!.getChildIndex(element);
      if (oldIndex > -1 && oldIndex < adjustedIndex) {
        adjustedIndex = Math.max(0, adjustedIndex - 1);
      }
    }

    // Clamp index to valid range
    if (adjustedIndex !== undefined) {
      adjustedIndex = Math.min(Math.max(adjustedIndex, 0), newParent.getChildCount());
    }

    if (oldParent) {
      oldParent.removeChild(element);
    }

    newParent.addChild(element, adjustedIndex);

    this.ctx.composer.emit(EVENTS.ELEMENT_MOVED, {
      element,
      oldParent,
      newParent,
      index: adjustedIndex,
    });
    this.ctx.composer.markDirty();

    return true;
  }

  /**
   * Duplicate element
   */
  duplicateElement(id: string): Element | null {
    const original = this.ctx.elements.get(id);
    if (!original) return null;

    // Use toJSON() to get current children, not getData() which has stale data
    const clonedData = this.ctx.cloneElementData(original.toJSON());

    // Build the entire element tree (including children) from cloned data
    // Don't pass parent here - we'll add to parent manually at correct position
    const clone = this.ctx.buildElementTree(clonedData);

    // Add after original in parent
    const parent = original.getParent();
    if (parent) {
      const index = parent.getChildIndex(original);
      parent.addChild(clone, index + 1);
    }

    this.ctx.composer.emit(EVENTS.ELEMENT_DUPLICATED, { original, clone });
    this.ctx.composer.markDirty();

    return clone;
  }

  /**
   * Serialize element for clipboard (copy/paste)
   */
  serializeElement(id: string): ElementData | null {
    const element = this.ctx.elements.get(id);
    if (!element) return null;
    // Use toJSON() to get current children, not getData() which has stale data
    return this.ctx.cloneElementData(element.toJSON());
  }

  /**
   * Paste element from clipboard data
   */
  pasteElement(data: ElementData, target: Element, index?: number): Element | null {
    if (!data) return null;

    // Clone with new IDs
    const clonedData = this.ctx.cloneElementData(data);

    // Build the entire element tree from cloned data
    // This creates and registers all elements including children
    const newElement = this.ctx.buildElementTree(clonedData);

    // Add to target at index
    target.addChild(newElement, index);

    this.ctx.composer.emit(EVENTS.CLIPBOARD_PASTE, { element: newElement, target, index });
    this.ctx.composer.markDirty();

    return newElement;
  }
}
