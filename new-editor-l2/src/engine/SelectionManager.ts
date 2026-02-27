/**
 * Aquibra Selection Manager
 * Manages element selection in the composer
 *
 * @module engine/SelectionManager
 * @license BSD-3-Clause
 */

import { getDOMElement, getElementBounds, type Rect } from "./canvas/canvasGeometry";
import type { Composer } from "./Composer";
import type { Element } from "./elements/Element";

/**
 * Manages selected elements
 */
export class SelectionManager {
  private composer: Composer;
  private selected: Element | null = null;
  private multiSelected: Set<Element> = new Set();

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Select an element
   */
  select(element: Element | null): void {
    if (this.selected === element) return;

    const previous = this.selected;
    this.selected = element;
    this.multiSelected.clear();

    if (element) {
      this.multiSelected.add(element);
    }

    this.composer.emit("element:selected", element);

    if (previous) {
      this.composer.emit("element:deselected", previous);
    }
  }

  /**
   * Force re-emit selection event for current element
   * Use after structural changes (move, reparent) where element reference is same
   * but position/parent changed and UI needs to refresh
   */
  reselect(): void {
    if (this.selected) {
      this.composer.emit("element:selected", this.selected);
    }
  }

  /**
   * Add element to selection (multi-select)
   */
  addToSelection(element: Element): void {
    if (!this.multiSelected.has(element)) {
      this.multiSelected.add(element);

      if (!this.selected) {
        this.selected = element;
      }

      this.composer.emit("selection:added", element);
    }
  }

  /**
   * Remove element from selection
   */
  removeFromSelection(element: Element): void {
    if (this.multiSelected.has(element)) {
      this.multiSelected.delete(element);

      if (this.selected === element) {
        this.selected = this.multiSelected.size > 0 ? Array.from(this.multiSelected)[0] : null;
      }

      this.composer.emit("selection:removed", element);
    }
  }

  /**
   * Toggle element selection
   */
  toggle(element: Element): void {
    if (this.multiSelected.has(element)) {
      this.removeFromSelection(element);
    } else {
      this.addToSelection(element);
    }
  }

  /**
   * Clear selection
   */
  clear(): void {
    const hadSelection = this.selected !== null;
    this.selected = null;
    this.multiSelected.clear();

    if (hadSelection) {
      this.composer.emit("selection:cleared");
    }
  }

  /**
   * Get selected element
   */
  getSelected(): Element | null {
    return this.selected;
  }

  /**
   * Get all selected elements
   */
  getAllSelected(): Element[] {
    return Array.from(this.multiSelected);
  }

  /**
   * Check if element is selected
   */
  isSelected(element: Element): boolean {
    return this.multiSelected.has(element);
  }

  /**
   * Check if anything is selected
   */
  hasSelection(): boolean {
    return this.selected !== null;
  }

  /**
   * Get selection count
   */
  getCount(): number {
    return this.multiSelected.size;
  }

  /**
   * Select parent of current selection
   */
  selectParent(): void {
    if (this.selected) {
      const parent = this.selected.getParent();
      if (parent) {
        this.select(parent);
      }
    }
  }

  /**
   * Select first child of current selection
   */
  selectFirstChild(): void {
    if (this.selected) {
      const firstChild = this.selected.getChildAt(0);
      if (firstChild) {
        this.select(firstChild);
      }
    }
  }

  /**
   * Select next sibling
   */
  selectNextSibling(): void {
    if (this.selected) {
      const parent = this.selected.getParent();
      if (parent) {
        const index = parent.getChildIndex(this.selected);
        const next = parent.getChildAt(index + 1);
        if (next) {
          this.select(next);
        }
      }
    }
  }

  /**
   * Select previous sibling
   */
  selectPrevSibling(): void {
    if (this.selected) {
      const parent = this.selected.getParent();
      if (parent) {
        const index = parent.getChildIndex(this.selected);
        const prev = parent.getChildAt(index - 1);
        if (prev) {
          this.select(prev);
        }
      }
    }
  }

  /**
   * Select multiple elements at once (for marquee selection)
   */
  selectMultiple(elements: Element[]): void {
    this.clear();

    if (elements.length === 0) return;

    // Set the first element as primary selection
    this.selected = elements[0];

    // Add all to multi-select set
    elements.forEach((el) => this.multiSelected.add(el));

    this.composer.emit("selection:multiple", elements);
    this.composer.emit("element:selected", this.selected);
  }

  /**
   * Select all elements on current page (except root)
   */
  selectAll(): void {
    const page = this.composer.elements.getActivePage();
    if (!page || !page.root) return;

    // Get the actual Element instance from ElementManager
    const rootElement = this.composer.elements.getElement(page.root.id);
    if (!rootElement) return;

    const elements: Element[] = [];

    // Collect all non-root elements
    const collectElements = (element: Element): void => {
      element.getChildren().forEach((child) => {
        elements.push(child);
        collectElements(child);
      });
    };

    collectElements(rootElement);

    if (elements.length > 0) {
      this.selectMultiple(elements);
    }
  }

  /**
   * Get combined bounding box of all selected elements
   * Returns null if no selection
   */
  getSelectedBounds(): Rect | null {
    if (this.multiSelected.size === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.multiSelected.forEach((element) => {
      const domElement = getDOMElement(element.getId());
      if (!domElement) return;

      const bounds = getElementBounds(domElement);
      if (!bounds) return;

      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    if (minX === Infinity) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Check if multiple elements are selected
   */
  isMultiSelect(): boolean {
    return this.multiSelected.size > 1;
  }

  /**
   * Get selected element IDs
   */
  getSelectedIds(): string[] {
    return Array.from(this.multiSelected).map((el) => el.getId());
  }

  // ============================================
  // Alignment Tools
  // ============================================

  /**
   * Get element bounds info for alignment
   */
  private getElementBoundsInfo(): Array<{ element: Element; bounds: Rect }> {
    const result: Array<{ element: Element; bounds: Rect }> = [];
    this.multiSelected.forEach((element) => {
      const domElement = getDOMElement(element.getId());
      if (!domElement) return;
      const bounds = getElementBounds(domElement);
      if (bounds) {
        result.push({ element, bounds });
      }
    });
    return result;
  }

  /**
   * Destroy selection manager
   */
  destroy(): void {
    this.clear();
  }
}
