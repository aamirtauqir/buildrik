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

  /** Is this a system style (non-deletable)? */
  system?: boolean;
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

    // Register default global styles
    this.registerDefaults();
  }

  /**
   * Register default global styles
   */
  private registerDefaults(): void {
    // Primary Button
    this.define({
      id: "btn-primary",
      name: "Primary Button",
      category: "Buttons",
      system: true,
      styles: {
        padding: "12px 24px",
        background: "#667eea",
        color: "#ffffff",
        border: "none",
        "border-radius": "8px",
        "font-weight": "600",
        cursor: "pointer",
        transition: "all 0.2s",
      },
      tags: ["button", "primary", "cta"],
    });

    // Secondary Button
    this.define({
      id: "btn-secondary",
      name: "Secondary Button",
      category: "Buttons",
      system: true,
      styles: {
        padding: "12px 24px",
        background: "transparent",
        color: "#667eea",
        border: "2px solid #667eea",
        "border-radius": "8px",
        "font-weight": "600",
        cursor: "pointer",
        transition: "all 0.2s",
      },
      tags: ["button", "secondary"],
    });

    // Heading 1
    this.define({
      id: "heading-1",
      name: "Heading 1",
      category: "Typography",
      system: true,
      styles: {
        "font-size": "48px",
        "font-weight": "700",
        "line-height": "1.2",
        margin: "0 0 24px 0",
        color: "#1a1a2e",
      },
      tags: ["heading", "h1", "typography"],
    });

    // Heading 2
    this.define({
      id: "heading-2",
      name: "Heading 2",
      category: "Typography",
      system: true,
      styles: {
        "font-size": "36px",
        "font-weight": "600",
        "line-height": "1.3",
        margin: "0 0 20px 0",
        color: "#1a1a2e",
      },
      tags: ["heading", "h2", "typography"],
    });

    // Body Text
    this.define({
      id: "body-text",
      name: "Body Text",
      category: "Typography",
      system: true,
      styles: {
        "font-size": "16px",
        "line-height": "1.6",
        color: "#333333",
      },
      tags: ["text", "body", "typography"],
    });

    // Container
    this.define({
      id: "container",
      name: "Container",
      category: "Layout",
      system: true,
      styles: {
        "max-width": "1200px",
        margin: "0 auto",
        padding: "0 20px",
      },
      tags: ["container", "layout", "wrapper"],
    });

    // Card
    this.define({
      id: "card",
      name: "Card",
      category: "Layout",
      system: true,
      styles: {
        background: "#ffffff",
        "border-radius": "12px",
        padding: "24px",
        "box-shadow": "0 4px 12px rgba(0,0,0,0.1)",
      },
      tags: ["card", "layout", "container"],
    });
  }

  /**
   * Define a global style
   */
  define(style: GlobalStyle): void {
    if (this.styles.has(style.id)) {
      throw new Error(`Global style "${style.id}" already exists`);
    }

    this.styles.set(style.id, style);
    this.emit("style:defined", style);

    // Mark project as dirty
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

    // Prevent updating system styles
    if (style.system && updates.styles) {
      throw new Error(`Cannot modify system style "${id}"`);
    }

    // Apply updates
    Object.assign(style, updates);
    this.styles.set(id, style);

    this.emit("style:updated", { id, style });

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

    // Prevent deleting system styles
    if (style.system) {
      throw new Error(`Cannot delete system style "${id}"`);
    }

    this.styles.delete(id);
    this.emit("style:deleted", { id });

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

    this.emit("style:applied", { styleId, elementId });
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

    this.emit("style:class:created", { styleId, className });
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
    // Only export non-system styles
    return this.getAll().filter((s) => !s.system);
  }

  /**
   * Import global styles from project load
   */
  import(styles: GlobalStyle[]): void {
    styles.forEach((style) => {
      // Don't override system styles
      if (!this.styles.has(style.id)) {
        this.styles.set(style.id, style);
      }
    });

    this.emit("styles:imported", { count: styles.length });
  }

  /**
   * Clear all non-system styles
   */
  clear(): void {
    const toDelete = this.getAll().filter((s) => !s.system);
    toDelete.forEach((s) => this.styles.delete(s.id));

    this.emit("styles:cleared");
  }

  /**
   * Destroy global style manager
   */
  destroy(): void {
    this.clear();
    this.removeAllListeners();
  }
}
