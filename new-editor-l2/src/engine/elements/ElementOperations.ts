/**
 * Element Operations, Animation, Interactions, and Data Bindings
 * Extracted from Element.ts for the 500-line file limit.
 *
 * @module engine/elements/ElementOperations
 * @license BSD-3-Clause
 */

import type { ElementData } from "../../shared/types";
import type { AnimationConfig } from "../../shared/types/animations";
import type { DataBinding } from "../../shared/types/data";
import type { Composer } from "../Composer";
import type { Element } from "./Element";

/**
 * Delegate that manages structural operations (wrap, unwrap, duplicate,
 * replace), animations, interactions, and data bindings for an Element.
 */
export class ElementOperations {
  private dataBindings: Map<string, DataBinding> = new Map();

  constructor(
    private getSelf: () => Element,
    private getComposer: () => Composer,
    private getData: () => ElementData,
    private getParentRef: () => Element | null,
    private getChildrenRef: () => Element[],
    private setChildrenRef: (children: Element[]) => void,
    private setStyleFn: (property: string, value: string) => void,
    private removeStyleFn: (property: string) => void
  ) {}

  /**
   * Initialize data bindings from serialized data
   */
  initBindings(bindings?: Record<string, DataBinding>): void {
    if (bindings) {
      Object.entries(bindings).forEach(([property, binding]) => {
        this.dataBindings.set(property, binding);
      });
    }
  }

  // ============================================
  // Element Operations
  // ============================================

  /**
   * Duplicate this element
   * NOTE: Prefer using ElementManager.duplicateElement() which properly builds child tree
   */
  duplicate(): Element {
    const clone = this.getComposer().elements.duplicateElement(this.getSelf().getId());
    if (!clone) {
      throw new Error(`Failed to duplicate element ${this.getSelf().getId()}`);
    }
    return clone;
  }

  /**
   * Wrap this element in a new container
   */
  wrap(tagName: string, attributes?: Record<string, string>): Element {
    const self = this.getSelf();
    // IMPORTANT: Save old parent and index BEFORE any modifications
    const oldParent = this.getParentRef();
    const oldParentChildren = oldParent ? oldParent.getChildren() : [];
    const oldIndex = oldParent ? oldParentChildren.indexOf(self) : -1;

    // Create wrapper element via ElementManager
    const wrapper = this.getComposer().elements.createElement("container", {
      tagName,
      attributes,
    });

    // Remove this element from old parent first
    if (oldParent && oldIndex !== -1) {
      oldParent.removeChild(self);
    }

    // Add this element as child of wrapper
    wrapper.addChild(self);

    // Insert wrapper at old position in old parent
    if (oldParent && oldIndex !== -1) {
      oldParent.addChild(wrapper, oldIndex);
    }

    this.getComposer().emit("element:wrapped", { element: self, wrapper });
    this.getComposer().markDirty();

    return wrapper;
  }

  /**
   * Unwrap this element, moving children to parent
   */
  unwrap(): Element[] {
    const parent = this.getParentRef();
    if (!parent) return [];

    const self = this.getSelf();
    const parentChildren = parent.getChildren();
    const index = parentChildren.indexOf(self);
    const children = [...this.getChildrenRef()];

    // IMPORTANT: Remove this element from parent FIRST
    // This prevents index shifting issues when inserting children
    parent.removeChild(self);

    // Clear children from this element
    this.setChildrenRef([]);

    // Insert children at the position where this element was
    // Insert in reverse order at same index to maintain order
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      parent.addChild(child, index);
    }

    this.getComposer().emit("element:unwrapped", { element: self, children });
    this.getComposer().markDirty();

    return children;
  }

  /**
   * Replace this element with another
   */
  replaceWith(element: Element): void {
    const parent = this.getParentRef();
    if (!parent) return;

    const self = this.getSelf();
    const parentChildren = parent.getChildren();
    const index = parentChildren.indexOf(self);

    parent.removeChild(self);
    parent.addChild(element, index);

    // NOTE: We do NOT maintain data.children here.
    // The toJSON() method reconstructs children from live this.children array.

    this.getComposer().emit("element:replaced", {
      old: self,
      new: element,
    });
    this.getComposer().markDirty();
  }

  /**
   * Insert element before this one
   */
  insertBefore(element: Element): void {
    const parent = this.getParentRef();
    if (!parent) return;

    const index = parent.getChildren().indexOf(this.getSelf());
    element.moveTo(parent, index);
  }

  /**
   * Insert element after this one
   */
  insertAfter(element: Element): void {
    const parent = this.getParentRef();
    if (!parent) return;

    const index = parent.getChildren().indexOf(this.getSelf());
    element.moveTo(parent, index + 1);
  }

  // ============================================
  // Animation (AQUI-026)
  // ============================================

  /**
   * Get animation configuration for this element
   */
  getAnimation(): AnimationConfig | null {
    return (this.getData().data?.animation as AnimationConfig) || null;
  }

  /**
   * Set animation configuration for this element
   */
  setAnimation(config: AnimationConfig): void {
    const data = this.getData();
    if (!data.data) {
      data.data = {};
    }
    data.data.animation = config;

    // Also update inline styles for animation property
    const cssValue = this.generateAnimationCSS(config);
    this.setStyleFn("animation", cssValue);

    this.getComposer().emit("element:updated", this.getSelf());
    this.getComposer().markDirty();
  }

  /**
   * Clear animation from this element
   */
  clearAnimation(): void {
    const data = this.getData();
    if (data.data?.animation) {
      delete data.data.animation;
    }
    this.removeStyleFn("animation");
    this.getComposer().emit("element:updated", this.getSelf());
    this.getComposer().markDirty();
  }

  /**
   * Generate CSS animation value from config
   * Uses aqb- prefixed keyframe names
   */
  private generateAnimationCSS(config: AnimationConfig): string {
    const iterations = config.iterations === -1 ? "infinite" : config.iterations.toString();
    const fill = config.fillMode || "forwards";
    // Add aqb- prefix to match keyframe names in AnimationPresets.ts
    const animName = `aqb-${config.type}`;
    return `${animName} ${config.duration}ms ${config.easing} ${config.delay}ms ${iterations} ${config.direction} ${fill}`;
  }

  // ============================================
  // Interactions (AQUI-027)
  // ============================================

  /** Get interactions for this element (returns raw data, UI handles typing) */
  getInteractions(): unknown[] {
    return (this.getData().data?.interactions as unknown[]) || [];
  }

  /** Set interactions for this element (accepts any array, UI handles typing) */
  setInteractions(interactions: unknown[]): void {
    const data = this.getData();
    if (!data.data) {
      data.data = {};
    }
    data.data.interactions = interactions;
    this.getComposer().emit("element:updated", this.getSelf());
    this.getComposer().markDirty();
  }

  /** Check if element has interactions */
  hasInteractions(): boolean {
    return this.getInteractions().length > 0;
  }

  /** Clear all interactions from this element */
  clearInteractions(): void {
    const data = this.getData();
    if (data.data?.interactions) {
      delete data.data.interactions;
    }
    this.getComposer().emit("element:updated", this.getSelf());
    this.getComposer().markDirty();
  }

  // ============================================
  // Data Bindings
  // ============================================

  /**
   * Set data binding for a property
   */
  setDataBinding(property: string, binding: DataBinding): void {
    this.dataBindings.set(property, binding);
    this.getComposer().emit("element:binding:set", {
      element: this.getSelf(),
      property,
      binding,
    });
    this.getComposer().markDirty();
  }

  /**
   * Get data binding for a property
   */
  getDataBinding(property: string): DataBinding | undefined {
    return this.dataBindings.get(property);
  }

  /**
   * Get all data bindings
   */
  getDataBindings(): Record<string, DataBinding> {
    const bindings: Record<string, DataBinding> = {};
    this.dataBindings.forEach((binding, property) => {
      bindings[property] = binding;
    });
    return bindings;
  }

  /**
   * Remove data binding
   */
  removeDataBinding(property: string): void {
    if (this.dataBindings.has(property)) {
      this.dataBindings.delete(property);
      this.getComposer().emit("element:binding:removed", {
        element: this.getSelf(),
        property,
      });
      this.getComposer().markDirty();
    }
  }

  /**
   * Check if element has data bindings
   */
  hasDataBindings(): boolean {
    return this.dataBindings.size > 0;
  }
}
