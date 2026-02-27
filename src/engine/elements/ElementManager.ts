/**
 * Aquibra Element Manager
 * Facade for managing all elements/components in the composer
 *
 * @module engine/elements/ElementManager
 * @license BSD-3-Clause
 */

import type { ElementData, PageData, ExportOptions } from "../../shared/types";
import { generateId } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import { Element } from "./Element";
import { ElementCRUD } from "./manager/ElementCRUD";
import { HTMLParser } from "./manager/HTMLParser";
import { PageManager } from "./manager/PageManager";
import type { ElementManagerContext } from "./manager/types";

/**
 * Manages the element tree and operations
 * Acts as a facade for sub-managers: PageManager, ElementCRUD, HTMLParser
 */
export class ElementManager {
  private composer: Composer;
  private pages: Map<string, PageData> = new Map();
  private elements: Map<string, Element> = new Map();
  private activePageId: string | null = null;

  // Sub-managers
  private pageManager: PageManager;
  private elementCRUD: ElementCRUD;
  private htmlParser: HTMLParser;

  constructor(composer: Composer) {
    this.composer = composer;

    // Create shared context for sub-managers
    const context: ElementManagerContext = {
      composer: this.composer,
      elements: this.elements,
      pages: this.pages,
      getActivePageId: () => this.activePageId,
      setActivePageId: (id: string | null) => {
        this.activePageId = id;
      },
      buildElementTree: (data: ElementData, parent?: Element) =>
        this.buildElementTree(data, parent),
      cloneElementData: (data: ElementData) => this.cloneElementData(data),
      getAllDescendants: (element: Element) => this.getAllDescendants(element),
    };

    // Initialize sub-managers
    this.pageManager = new PageManager(context);
    this.elementCRUD = new ElementCRUD(context);
    this.htmlParser = new HTMLParser(context);
  }

  // ============================================
  // Page Operations (delegated to PageManager)
  // ============================================

  /** Create a new page */
  createPage(name: string, options?: Partial<PageData>): PageData {
    return this.pageManager.createPage(name, options);
  }

  /** Get page by ID */
  getPage(id: string): PageData | undefined {
    return this.pageManager.getPage(id);
  }

  /** Get all pages */
  getAllPages(): PageData[] {
    return this.pageManager.getAllPages();
  }

  /** Get active page */
  getActivePage(): PageData | undefined {
    return this.pageManager.getActivePage();
  }

  /** Update page metadata (name/slug/settings) */
  updatePage(id: string, data: Partial<Pick<PageData, "name" | "slug" | "settings">>): void {
    this.pageManager.updatePage(id, data);
  }

  /** Set active page */
  setActivePage(id: string): void {
    this.pageManager.setActivePage(id);
  }

  /** Mark a page as home (single home) */
  setHomePage(id: string): void {
    this.pageManager.setHomePage(id);
  }

  /** Delete a page */
  deletePage(id: string): boolean {
    return this.pageManager.deletePage(id);
  }

  /** Import a page */
  importPage(pageData: PageData): void {
    this.pageManager.importPage(pageData);
  }

  /** Export all pages */
  exportPages(): PageData[] {
    return this.pageManager.exportPages();
  }

  // ============================================
  // Element Operations (delegated to ElementCRUD)
  // ============================================

  /** Create a new element */
  createElement(type: ElementData["type"], options?: Partial<ElementData>): Element {
    return this.elementCRUD.createElement(type, options);
  }

  /** Get element by ID */
  getElement(id: string): Element | undefined {
    return this.elementCRUD.getElement(id);
  }

  /** Register an element (internal use) */
  registerElement(element: Element): void {
    this.elementCRUD.registerElement(element);
  }

  /** Add element to parent */
  addElement(element: Element, parentId: string, index?: number): boolean {
    return this.elementCRUD.addElement(element, parentId, index);
  }

  /** Remove element */
  removeElement(id: string): boolean {
    return this.elementCRUD.removeElement(id);
  }

  /** Move element to new parent */
  moveElement(elementId: string, newParentId: string, index?: number): boolean {
    return this.elementCRUD.moveElement(elementId, newParentId, index);
  }

  /** Duplicate element */
  duplicateElement(id: string): Element | null {
    return this.elementCRUD.duplicateElement(id);
  }

  /** Serialize element for clipboard (copy/paste) */
  serializeElement(id: string): ElementData | null {
    return this.elementCRUD.serializeElement(id);
  }

  /** Paste element from clipboard data */
  pasteElement(data: ElementData, target: Element, index?: number): Element | null {
    return this.elementCRUD.pasteElement(data, target, index);
  }

  // ============================================
  // Export/HTML Operations (delegated to HTMLParser)
  // ============================================

  /** Convert active page to HTML */
  toHTML(options?: ExportOptions): string {
    return this.htmlParser.toHTML(options);
  }

  /** Import raw HTML into the active page */
  importHTMLToActivePage(html: string): void {
    this.htmlParser.importHTMLToActivePage(html);
  }

  /** Insert HTML into an element at a specific index */
  insertHTMLToElement(parentId: string, html: string, index?: number): Element[] {
    return this.htmlParser.insertHTMLToElement(parentId, html, index);
  }

  // ============================================
  // Helper Methods (used by sub-managers via context)
  // ============================================

  /**
   * Build element tree from data
   */
  private buildElementTree(data: ElementData, parent?: Element): Element {
    const element = new Element(data, this.composer);
    this.elements.set(data.id, element);

    if (parent) {
      element.setParent(parent);
    }

    // Rebuild children through Element.addChild so that the
    // in-memory children list and data.children stay in sync
    // without duplicating entries that may already exist in
    // the raw ElementData coming from import/export.
    const originalChildren = data.children ? [...data.children] : [];
    data.children = [];

    originalChildren.forEach((childData) => {
      const child = this.buildElementTree(childData, element);
      element.addChild(child);
    });

    return element;
  }

  /**
   * Clone element data with new IDs
   */
  private cloneElementData(data: ElementData): ElementData {
    return {
      ...data,
      id: generateId("el"),
      children: data.children?.map((c) => this.cloneElementData(c)),
    };
  }

  /**
   * Get all descendants of an element recursively
   * Delegates to Element.getDescendants() to avoid duplication
   */
  private getAllDescendants(element: Element): Element[] {
    return element.getDescendants();
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.pageManager.clear();
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    this.clear();
  }
}
