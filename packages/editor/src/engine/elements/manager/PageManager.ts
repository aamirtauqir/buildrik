/**
 * Page Manager
 * Handles page CRUD operations
 *
 * @module engine/elements/manager/PageManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants";
import type { PageData } from "../../../shared/types";
import { generateId } from "../../../shared/utils/helpers";
import type { ElementManagerContext } from "./types";

/**
 * Manages page operations within the element manager
 */
export class PageManager {
  private ctx: ElementManagerContext;

  constructor(context: ElementManagerContext) {
    this.ctx = context;
  }

  /**
   * Create a new page
   */
  createPage(name: string, options?: Partial<PageData>): PageData {
    const page: PageData = {
      id: generateId("page"),
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      root: {
        id: generateId("root"),
        type: "container",
        tagName: "div",
        classes: ["aqb-page-root"],
        children: [],
      },
      ...options,
    };

    this.ctx.pages.set(page.id, page);

    // Build element tree for this page so the root element is available
    this.ctx.buildElementTree(page.root);

    if (!this.ctx.getActivePageId()) {
      this.ctx.setActivePageId(page.id);
    }

    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page });
    return page;
  }

  /**
   * Get page by ID
   */
  getPage(id: string): PageData | undefined {
    return this.ctx.pages.get(id);
  }

  /**
   * Get all pages
   */
  getAllPages(): PageData[] {
    return Array.from(this.ctx.pages.values());
  }

  /**
   * Get active page
   */
  getActivePage(): PageData | undefined {
    const activePageId = this.ctx.getActivePageId();
    return activePageId ? this.ctx.pages.get(activePageId) : undefined;
  }

  /**
   * Update page metadata (name/slug/settings)
   */
  updatePage(id: string, data: Partial<Pick<PageData, "name" | "slug" | "settings">>): void {
    const page = this.ctx.pages.get(id);
    if (!page) return;

    if (typeof data.name === "string" && data.name.trim()) {
      page.name = data.name.trim();
    }

    if (typeof data.slug === "string" && data.slug.trim()) {
      page.slug = data.slug.trim();
    }

    if (data.settings !== undefined) {
      page.settings = { ...page.settings, ...data.settings };
    }

    this.ctx.pages.set(id, page);
    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:updated", page });
  }

  /**
   * Set active page
   */
  setActivePage(id: string): void {
    if (this.ctx.pages.has(id)) {
      this.ctx.setActivePageId(id);
      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, {
        type: "page:activated",
        page: this.ctx.pages.get(id),
      });
    }
  }

  /**
   * Mark a page as home (single home)
   */
  setHomePage(id: string): void {
    if (!this.ctx.pages.has(id)) return;

    this.ctx.pages.forEach((page, pageId) => {
      page.isHome = pageId === id;
      this.ctx.pages.set(pageId, page);
    });

    const page = this.ctx.pages.get(id);
    if (page) {
      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:home", page });
    }
  }

  /**
   * Delete a page
   */
  deletePage(id: string): boolean {
    const page = this.ctx.pages.get(id);
    if (!page) return false;

    // Clean up all elements from this page to prevent memory leak
    const rootElement = this.ctx.elements.get(page.root.id);
    if (rootElement) {
      const descendants = this.ctx.getAllDescendants(rootElement);
      descendants.forEach((el) => this.ctx.elements.delete(el.getId()));
      this.ctx.elements.delete(rootElement.getId());
    }

    this.ctx.pages.delete(id);

    if (this.ctx.getActivePageId() === id) {
      const remaining = Array.from(this.ctx.pages.keys());
      this.ctx.setActivePageId(remaining.length > 0 ? remaining[0] : null);
    }

    this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:deleted", page });
    return true;
  }

  /**
   * Import a page
   */
  importPage(pageData: PageData): void {
    this.ctx.pages.set(pageData.id, pageData);

    // Build element tree
    this.ctx.buildElementTree(pageData.root);

    if (!this.ctx.getActivePageId()) {
      this.ctx.setActivePageId(pageData.id);
    }
  }

  /**
   * Export all pages
   *
   * The live Element instances are the single source of truth for
   * element data (attributes, classes, styles, children). We
   * reconstruct the PageData.root tree from the current element
   * hierarchy so that exports, history snapshots, and the canvas
   * HTML always reflect the latest edits.
   */
  exportPages(): PageData[] {
    const pages: PageData[] = [];

    this.ctx.pages.forEach((page) => {
      const rootElement = this.ctx.elements.get(page.root.id);

      // Fall back to stored root data if element instance is missing
      const rootData = rootElement ? rootElement.toJSON() : page.root;

      pages.push({
        ...page,
        root: rootData,
      });
    });

    return pages;
  }

  /**
   * Clear all pages and elements
   */
  clear(): void {
    this.ctx.pages.clear();
    this.ctx.elements.clear();
    this.ctx.setActivePageId(null);
  }
}
