/**
 * Element Children, Tree Traversal, and Query Operations
 * Extracted from Element.ts for the 500-line file limit.
 *
 * @module engine/elements/ElementChildren
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";
import type { Element } from "./Element";

/**
 * Delegate that manages child/parent relationships, tree traversal,
 * and query operations for an Element instance.
 */
export class ElementChildren {
  constructor(
    private getSelf: () => Element,
    private getComposer: () => Composer,
    private getParentRef: () => Element | null,
    private getChildrenRef: () => Element[],
    private hasClassFn: (className: string) => boolean,
    private getIdFn: () => string,
    private getAttributeFn: (name: string) => string | undefined,
    private getTagNameFn: () => string
  ) {}

  // ============================================
  // Sibling / Path / Ancestry queries
  // ============================================

  /**
   * Get sibling elements
   */
  getSiblings(): Element[] {
    const parent = this.getParentRef();
    if (!parent) return [];
    return parent.getChildren().filter((el) => el !== this.getSelf());
  }

  /**
   * Get path from root to this element
   */
  getPath(): string[] {
    const path: string[] = [];
    let current: Element | null = this.getSelf();
    while (current) {
      path.unshift(current.getId());
      current = current.getParent();
    }
    return path;
  }

  /**
   * Check if this element is a descendant of another element
   */
  isDescendantOf(ancestor: Element): boolean {
    let current = this.getParentRef();
    while (current) {
      if (current.getId() === ancestor.getId()) {
        return true;
      }
      current = current.getParent();
    }
    return false;
  }

  /**
   * Move element to new parent
   */
  moveTo(parent: Element, index?: number): void {
    // Remove from current parent
    const currentParent = this.getParentRef();
    if (currentParent) {
      const children = currentParent.getChildren();
      const idx = children.indexOf(this.getSelf());
      if (idx > -1) {
        // Use direct splice on parent's children via removeChild
        currentParent.removeChild(this.getSelf());
      }
    }

    // Add to new parent
    parent.addChild(this.getSelf(), index);

    // NOTE: We do NOT maintain data.children - toJSON() reconstructs it.
    this.getComposer().emit("element:moved", {
      element: this.getSelf(),
      parent,
    });
    this.getComposer().markDirty();
  }

  // ============================================
  // Children management
  // ============================================

  addChild(child: Element, index?: number): void {
    child.setParent(this.getSelf());
    const children = this.getChildrenRef();

    if (index !== undefined && index >= 0 && index < children.length) {
      children.splice(index, 0, child);
    } else {
      children.push(child);
    }

    // NOTE: We do NOT maintain data.children here to avoid stale snapshots.
    // The toJSON() method reconstructs children from the live this.children array,
    // ensuring exports/saves always reflect the current state.
  }

  removeChild(child: Element): void {
    const children = this.getChildrenRef();
    const index = children.indexOf(child);
    if (index !== -1) {
      children.splice(index, 1);
      child.setParent(null);

      // NOTE: We do NOT maintain data.children here.
      // The toJSON() method reconstructs children from live this.children array.
    }
  }

  getChildIndex(child: Element): number {
    return this.getChildrenRef().indexOf(child);
  }

  getChildAt(index: number): Element | undefined {
    return this.getChildrenRef()[index];
  }

  getChildCount(): number {
    return this.getChildrenRef().length;
  }

  // ============================================
  // Element Queries
  // ============================================

  /**
   * Find all elements matching selector
   */
  find(selector: string): Element[] {
    const results: Element[] = [];
    if (this.matchesSelector(selector)) {
      results.push(this.getSelf());
    }

    this.getChildrenRef().forEach((child) => {
      results.push(...child.find(selector));
    });

    return results;
  }

  /**
   * Find first element matching selector
   */
  findOne(selector: string): Element | null {
    if (this.matchesSelector(selector)) {
      return this.getSelf();
    }

    for (const child of this.getChildrenRef()) {
      const found = child.findOne(selector);
      if (found) return found;
    }

    return null;
  }

  /**
   * Query elements with custom condition
   */
  query(condition: (el: Element) => boolean): Element[] {
    const results: Element[] = [];

    if (condition(this.getSelf())) {
      results.push(this.getSelf());
    }

    this.getChildrenRef().forEach((child) => {
      results.push(...child.query(condition));
    });

    return results;
  }

  /**
   * Get all descendant elements
   */
  getDescendants(): Element[] {
    const descendants: Element[] = [];

    this.getChildrenRef().forEach((child) => {
      descendants.push(child);
      descendants.push(...child.getDescendants());
    });

    return descendants;
  }

  /**
   * Get all ancestor elements
   */
  getAncestors(): Element[] {
    const ancestors: Element[] = [];
    let current: Element | null = this.getParentRef();

    while (current) {
      ancestors.push(current);
      current = current.getParent();
    }

    return ancestors;
  }

  /**
   * Check if element matches CSS selector
   */
  private matchesSelector(selector: string): boolean {
    // Class selector (.class)
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      return this.hasClassFn(className);
    }

    // ID selector (#id)
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      return this.getIdFn() === id || this.getAttributeFn("id") === id;
    }

    // Tag selector (tag)
    return this.getTagNameFn() === selector;
  }
}
