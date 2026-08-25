/**
 * Element Serialization and Capability Queries
 * Extracted from Element.ts for the 500-line file limit.
 *
 * @module engine/elements/ElementSerialization
 * @license BSD-3-Clause
 */

import type { ElementData } from "../../shared/types";
import type { DataBinding } from "../../shared/types/data";
import { isSelfClosing, buildAttributeString } from "../../shared/utils/html";
import {
  canHaveChildren as canHaveChildrenUtil,
  isContainerType,
  isVoidType,
  ELEMENT_CATEGORIES,
} from "../../shared/utils/nesting";
import type { ElementCategory } from "../../shared/utils/nesting/types";
import type { Composer } from "../Composer";
import type { Element } from "./Element";

/**
 * Delegate that handles serialization (toJSON, toHTML) and
 * capability query methods for an Element instance.
 */
export class ElementSerialization {
  constructor(
    private getSelf: () => Element,
    private getComposer: () => Composer,
    private getData: () => ElementData,
    private getParentRef: () => Element | null,
    private getChildrenRef: () => Element[],
    private getClassesFn: () => string[],
    private getAttributesFn: () => Record<string, string>,
    private getStylesFn: () => Record<string, string>,
    private getContentFn: () => string,
    private getTagNameFn: () => string,
    private getDataBindingsFn: () => Record<string, DataBinding>,
    private hasDataBindingsFn: () => boolean
  ) {}

  // ============================================
  // Serialization
  // ============================================

  toJSON(): ElementData {
    const json: ElementData = {
      ...this.getData(),
      children: this.getChildrenRef().map((c) => c.toJSON()),
    };

    // Include data bindings if any exist
    if (this.hasDataBindingsFn()) {
      json.dataBindings = this.getDataBindingsFn();
    }

    return json;
  }

  /**
   * Convert to HTML string
   * Uses shared buildAttributeString for consistent HTML generation
   */
  toHTML(): string {
    const tag = this.getTagNameFn();
    const attrs = buildAttributeString({
      classes: this.getClassesFn(),
      attributes: this.getAttributesFn(),
      styles: this.getStylesFn(),
    });
    const content = this.getContentFn();
    const childrenHTML = this.getChildrenRef()
      .map((c) => c.toHTML())
      .join("");

    if (isSelfClosing(tag)) {
      return `<${tag}${attrs} />`;
    }

    return `<${tag}${attrs}>${content}${childrenHTML}</${tag}>`;
  }

  // ============================================
  // Capability Query Methods
  // ============================================

  /**
   * Check if element can have children
   */
  canHaveChildren(): boolean {
    return canHaveChildrenUtil(this.getData().type);
  }

  /**
   * Check if element is a container type
   */
  isContainer(): boolean {
    return isContainerType(this.getData().type);
  }

  /**
   * Check if element is a void/self-closing type
   */
  isVoid(): boolean {
    return isVoidType(this.getData().type);
  }

  /**
   * Check if element is a leaf node (cannot have children)
   */
  isLeaf(): boolean {
    return !this.canHaveChildren();
  }

  /**
   * Check if element is locked.
   *
   * This used to read `data.locked === true || this.isComponentInstance()`,
   * which made every component instance permanently locked: instances could not
   * be selected on canvas, and the toast telling the user to "Unlock it in the
   * Layers panel" could not succeed, because clearing `data.locked` left the
   * second disjunct true.
   *
   * The disjunct was never a decision. It predates the repository (present
   * verbatim in `181c3ab0`, "Initial commit"), has no rationale in any commit,
   * and contradicts the design of record: `setStyle`/`setAttribute` already
   * record per-instance overrides (`ElementStyles.ts:126-139`, `:33-46`), the
   * inspector already mounts `VariantSection` and `DetachInstanceButton` for
   * instances, and `VariantSection`'s board is literally named
   * "Inspector · instance-selected". The invariant was not enforced either —
   * a Layers row click and the auto-select after a component drop both select
   * instances today, bypassing the three canvas guards entirely.
   *
   * What the disjunct WAS doing incidentally — keeping structural edits out of
   * an instance subtree, and instances out of multi-select delete — is now
   * done explicitly at those call sites, so removing it here does not remove
   * those protections. See `canBeWrapped` below, `insertActions.ts` and
   * `useCanvasKeyboard.ts`.
   */
  isLocked(): boolean {
    return this.getData().locked === true;
  }

  /**
   * Check if element is a component instance
   */
  isComponentInstance(): boolean {
    return !!this.getComposer().components?.findInstanceContainingElement(this.getSelf().getId());
  }

  /**
   * Check if element is a root element (has no parent)
   */
  isRoot(): boolean {
    return this.getParentRef() === null;
  }

  /**
   * Check if element can be wrapped in a container
   */
  canBeWrapped(): boolean {
    // The instance check was previously carried by isLocked(). Wrapping an
    // instance is a structural edit, and `syncInstance` discards structural
    // changes inside an instance subtree, so it stays blocked deliberately.
    return !this.isRoot() && !this.isLocked() && !this.isComponentInstance();
  }

  /**
   * Check if element can be unwrapped (children moved to parent)
   */
  canBeUnwrapped(): boolean {
    return this.getParentRef() !== null && this.getChildrenRef().length > 0;
  }

  /**
   * Get element categories (container, block, inline, media, etc.)
   */
  getElementCategory(): ElementCategory[] {
    return ELEMENT_CATEGORIES[this.getData().type] ?? [];
  }
}
