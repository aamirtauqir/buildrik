/**
 * Element Styles, Attributes, Classes, and Traits
 * Extracted from Element.ts for the 500-line file limit.
 *
 * @module engine/elements/ElementStyles
 * @license BSD-3-Clause
 */

import type { ElementData, TraitData, TraitValue } from "../../shared/types";
import type { Composer } from "../Composer";

/**
 * Delegate that manages style, attribute, class, and trait operations
 * for an Element instance.
 */
export class ElementStyles {
  constructor(
    private getData: () => ElementData,
    private getComposer: () => Composer,
    private getElementId: () => string,
    private getInteractionsFn: () => unknown[]
  ) {}

  // ============================================
  // Attributes
  // ============================================

  getAttribute(name: string): string | undefined {
    return this.getData().attributes?.[name];
  }

  setAttribute(name: string, value: string): void {
    const data = this.getData();
    if (!data.attributes) {
      data.attributes = {};
    }
    data.attributes[name] = value;

    // Notify ComponentManager of potential override
    this.getComposer().components?.recordInstanceOverride(
      this.getElementId(),
      "attribute",
      name,
      value
    );

    this.getComposer().emit("element:updated", this);
    this.getComposer().markDirty();
  }

  removeAttribute(name: string): void {
    const data = this.getData();
    if (data.attributes) {
      delete data.attributes[name];
      this.getComposer().emit("element:updated", this);
      this.getComposer().markDirty();
    }
  }

  getAttributes(): Record<string, string> {
    const attrs = { ...this.getData().attributes };

    // Always include element ID for interaction runtime
    attrs["data-aqb-id"] = this.getElementId();

    // Include interaction data if present
    const interactions = this.getInteractionsFn();
    if (interactions.length > 0) {
      attrs["data-aqb-interactions"] = JSON.stringify(interactions);
    }

    return attrs;
  }

  // ============================================
  // Classes
  // ============================================

  addClass(className: string): void {
    const data = this.getData();
    if (!data.classes) {
      data.classes = [];
    }
    if (!data.classes.includes(className)) {
      data.classes.push(className);
      this.getComposer().emit("element:updated", this);
      this.getComposer().markDirty();
    }
  }

  removeClass(className: string): void {
    const data = this.getData();
    if (data.classes) {
      const index = data.classes.indexOf(className);
      if (index !== -1) {
        data.classes.splice(index, 1);
        this.getComposer().emit("element:updated", this);
        this.getComposer().markDirty();
      }
    }
  }

  hasClass(className: string): boolean {
    return this.getData().classes?.includes(className) || false;
  }

  getClasses(): string[] {
    return [...(this.getData().classes || [])];
  }

  setClasses(classes: string[]): void {
    this.getData().classes = [...classes];
    this.getComposer().emit("element:updated", this);
    this.getComposer().markDirty();
  }

  // ============================================
  // Styles
  // ============================================

  getStyle(property: string): string | undefined {
    return this.getData().styles?.[property];
  }

  setStyle(property: string, value: string): void {
    const data = this.getData();
    if (!data.styles) {
      data.styles = {};
    }
    data.styles[property] = value;

    // Notify ComponentManager of potential override
    this.getComposer().components?.recordInstanceOverride(
      this.getElementId(),
      "style",
      property,
      value
    );

    this.getComposer().emit("element:updated", this);
    this.getComposer().markDirty();
  }

  removeStyle(property: string): void {
    const data = this.getData();
    if (data.styles) {
      delete data.styles[property];
      this.getComposer().emit("element:updated", this);
      this.getComposer().markDirty();
    }
  }

  getStyles(): Record<string, string> {
    const baseStyles = this.getData().styles ?? {};

    // L1->L2: Check for component-related style overrides (Variant + Instance)
    const overrides = this.getComposer().components?.getOverridesForElement(this.getElementId());

    // Merge: overrides (Variant -> Instance) take precedence over base styles
    return overrides ? { ...baseStyles, ...overrides } : { ...baseStyles };
  }

  setStyles(styles: Record<string, string>): void {
    this.getData().styles = { ...styles };
    this.getComposer().emit("element:updated", this);
    this.getComposer().markDirty();
  }

  // ============================================
  // Traits
  // ============================================

  getTrait(name: string): TraitData | undefined {
    return this.getData().traits?.find((t) => t.name === name);
  }

  setTrait(name: string, value: TraitValue): void {
    const data = this.getData();
    if (!data.traits) {
      data.traits = [];
    }

    const existing = data.traits.find((t) => t.name === name);
    if (existing) {
      existing.value = value;
    } else {
      data.traits.push({ name, type: "text", value });
    }

    this.getComposer().emit("element:updated", this);
    this.getComposer().markDirty();
  }

  getTraits(): TraitData[] {
    return [...(this.getData().traits || [])];
  }
}
