/**
 * Aquibra Global Style Manager
 * Manages reusable style presets (design system)
 *
 * FRESH IMPLEMENTATION for Aquibra
 * Enables design system with reusable style definitions
 *
 * @module engine/styles/GlobalStyleManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants/events";
import type { Composer } from "../Composer";
import { EventEmitter } from "../EventEmitter";

/**
 * Global style definition
 */
export interface GlobalStyle {
  /** Unique identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** CSS styles */
  styles: Record<string, string>;

  /** Description */
  description?: string;

  /** Category (e.g., "Buttons", "Typography", "Layout") */
  category?: string;

  /** Tags for search */
  tags?: string[];
}

/**
 * Global Style Manager
 * Central hub for design system styles
 */
export class GlobalStyleManager extends EventEmitter {
  private composer: Composer;
  private styles: Map<string, GlobalStyle> = new Map();

  constructor(composer: Composer) {
    super();
    this.composer = composer;
  }

  /**
   * Define a global style (a user edit — marks the project dirty)
   */
  define(style: GlobalStyle): void {
    if (this.styles.has(style.id)) {
      throw new Error(`Global style "${style.id}" already exists`);
    }

    this.styles.set(style.id, style);
    this.emit(EVENTS.STYLE_DEFINED, style);
    this.composer.markDirty();
  }

  /**
   * Update a global style
   */
  update(id: string, updates: Partial<GlobalStyle>): void {
    const style = this.styles.get(id);
    if (!style) {
      throw new Error(`Global style "${id}" not found`);
    }

    // Apply updates
    Object.assign(style, updates);
    this.styles.set(id, style);

    this.emit(EVENTS.STYLE_UPDATED, { id, style });

    // Update all elements using this style
    this.updateElementsUsingStyle(id);

    // Mark project as dirty
    this.composer.markDirty();
  }

  /**
   * Delete a global style
   */
  delete(id: string): void {
    const style = this.styles.get(id);
    if (!style) {
      throw new Error(`Global style "${id}" not found`);
    }

    this.styles.delete(id);
    this.emit(EVENTS.STYLE_DELETED, { id });

    // Mark project as dirty
    this.composer.markDirty();
  }

  /**
   * Get a global style by ID
   */
  get(id: string): GlobalStyle | undefined {
    return this.styles.get(id);
  }

  /**
   * Get all global styles
   */
  getAll(): GlobalStyle[] {
    return Array.from(this.styles.values());
  }

  /**
   * Get styles by category
   */
  getByCategory(category: string): GlobalStyle[] {
    return this.getAll().filter((s) => s.category === category);
  }

  /**
   * Search styles by name or tags
   */
  search(query: string): GlobalStyle[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter((style) => {
      const nameMatch = style.name.toLowerCase().includes(lowerQuery);
      const tagMatch = style.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
      return nameMatch || tagMatch;
    });
  }

  /**
   * Apply global style to an element
   */
  apply(styleId: string, elementId: string): void {
    this.applyToElement(styleId, elementId);
  }

  /**
   * Apply global style to an element
   */
  applyToElement(styleId: string, elementId: string): void {
    const style = this.styles.get(styleId);
    if (!style) {
      throw new Error(`Global style "${styleId}" not found`);
    }

    const element = this.composer.elements.getElement(elementId);
    if (!element) {
      throw new Error(`Element "${elementId}" not found`);
    }

    // Apply all styles from global style
    Object.entries(style.styles).forEach(([property, value]) => {
      element.setStyle(property, value);
    });

    // Store reference to global style (for updates)
    element.setData("globalStyleId", styleId);

    this.emit(EVENTS.STYLE_APPLIED, { styleId, elementId });
  }

  /**
   * Apply global style via CSS class
   * Creates a CSS class for the global style
   */
  applyAsClass(styleId: string, className: string): void {
    const style = this.styles.get(styleId);
    if (!style) {
      throw new Error(`Global style "${styleId}" not found`);
    }

    // Create CSS rule for this class
    this.composer.styles.setRule(`.${className}`, style.styles);

    this.emit(EVENTS.STYLE_CLASS_CREATED, { styleId, className });
  }

  /**
   * Update all elements using a global style
   */
  private updateElementsUsingStyle(styleId: string): void {
    const style = this.styles.get(styleId);
    if (!style) return;

    // Get all elements (simplified - would need proper traversal)
    const activePage = this.composer.elements.getActivePage();
    if (!activePage) return;

    const rootElement = this.composer.elements.getElement(activePage.root.id);
    if (!rootElement) return;

    // Recursively update elements
    this.updateElementTree(rootElement, styleId, style);
  }

  /**
   * Recursively update element tree
   * Uses Element type from engine for proper typing
   */
  private updateElementTree(
    element: import("../elements/Element").Element,
    styleId: string,
    style: GlobalStyle
  ): void {
    // Check if this element uses the global style
    // Element.setData stores in data.data, Element.getCustomData retrieves from data.data
    const globalStyleId = element.getCustomData("globalStyleId");
    if (globalStyleId === styleId) {
      // Re-apply styles
      Object.entries(style.styles).forEach(([property, value]) => {
        element.setStyle(property, value);
      });
    }

    // Recurse to children - getChildren() returns Element[]
    const children = element.getChildren();
    children.forEach((child) => this.updateElementTree(child, styleId, style));
  }

  /**
   * Export global styles for project save
   */
  export(): GlobalStyle[] {
    return this.getAll();
  }

  /**
   * Import global styles from project load
   */
  import(styles: GlobalStyle[]): void {
    styles.forEach((style) => {
      if (!this.styles.has(style.id)) {
        this.styles.set(style.id, style);
      }
    });

    this.emit(EVENTS.STYLES_IMPORTED, { count: styles.length });
  }

  /**
   * Clear all styles
   */
  clear(): void {
    this.styles.clear();

    this.emit(EVENTS.STYLES_CLEARED);
  }

  /**
   * Destroy global style manager
   */
  destroy(): void {
    this.clear();
    this.removeAllListeners();
  }
}
