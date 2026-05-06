/**
 * Aquibra Element Manager
 * Facade for managing all elements/components in the composer
 *
 * @module engine/elements/ElementManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants/events";
import type { ElementData, PageData, ExportOptions } from "../../shared/types";
import { generateId } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import { Element } from "./Element";
import { PreviewLayer } from "./PreviewLayer";
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
  private previewLayer: PreviewLayer = new PreviewLayer();

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

  /** Update page metadata (name/slug/settings/slugManuallySet) */
  updatePage(
    id: string,
    data: Partial<Pick<PageData, "name" | "slug" | "settings" | "slugManuallySet">>
  ): void {
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

  /** Duplicate a page (deep clone with fresh IDs + smart copy-suffix naming) */
  duplicatePage(sourceId: string): PageData | null {
    return this.pageManager.duplicatePage(sourceId);
  }

  /** Reorder pages. `afterId === null` prepends. */
  reorderPage(pageId: string, afterId: string | null): boolean {
    return this.pageManager.reorderPage(pageId, afterId);
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

  /**
   * Get every registered element, across all pages.
   * Used by `useUsageMap` to build a `Map<src, count>` in one pass instead
   * of re-scanning per asset.
   */
  getAllElements(): Element[] {
    return Array.from(this.elements.values());
  }

  previewUpdate(id: string, props: Record<string, unknown>): void {
    this.previewLayer.set(id, props);
    this.composer.emit(EVENTS.ELEMENT_PREVIEW_CHANGED, id);
  }

  clearPreview(id: string): void {
    if (!this.previewLayer.has(id)) return;
    this.previewLayer.clear(id);
    this.composer.emit(EVENTS.ELEMENT_PREVIEW_CHANGED, id);
  }

  getPreview(id: string): Record<string, unknown> | undefined {
    return this.previewLayer.get(id);
  }

  hasPreview(id: string): boolean {
    return this.previewLayer.has(id);
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

  // ============================================
  // Media Operations
  // ============================================

  /**
   * Insert a media element onto the active page.
   * Creates the right element type based on the media asset type,
   * sets its src, and adds it to the page root.
   * Returns the new element's ID, or null if the page has no root.
   *
   * Thin alias for `insertMediaAt` without placement hints — kept for
   * backward compatibility with existing call sites.
   */
  insertMedia(
    src: string,
    type: "image" | "video" | "audio" | "svg" | "icon" | "lottie"
  ): string | null {
    const result = this.insertMediaAt(src, type);
    return result && result.kind === "element" ? result.elementId : null;
  }

  /**
   * Result of insertMediaAt. `kind: "element"` means a new element was
   * created; `kind: "font-applied"` means a font was applied to selected
   * text (no new element); `null` means the operation failed and the
   * caller should emit INSERT_FAILED with the given reason.
   */
  // ... see type in ../../shared/types/media.ts if exported; kept inline for now

  /**
   * Insert a media element onto the active page with optional placement hints.
   *
   * @param src  URL or data: URI of the asset
   * @param type Asset type. Images/video/icon/svg/audio/lottie create an
   *             element. `font` applies `font-family: <src>` to the
   *             selected text element(s) — no element is created.
   * @param opts Placement hints. `x`/`y` set the element's position (image
   *             and video elements only). `targetElementId` inserts into
   *             or replaces the src of a specific element. If omitted, the
   *             same smart-insert logic as `insertMedia` applies.
   * @returns    Result describing what happened, or `null` with
   *             `reason` set so the caller can emit INSERT_FAILED.
   */
  insertMediaAt(
    src: string,
    type: "image" | "video" | "audio" | "svg" | "icon" | "lottie" | "font",
    opts?: {
      x?: number;
      y?: number;
      targetElementId?: string;
    },
  ):
    | { kind: "element"; elementId: string }
    | { kind: "font-applied"; elementIds: string[] }
    | { kind: "failed"; reason: "no-active-page" | "invalid-type" | "no-text-selected" }
    | null {
    const page = this.getActivePage();
    if (!page) return { kind: "failed", reason: "no-active-page" };

    // Font type: apply font-family to selected text instead of creating an element.
    if (type === "font") {
      const selectedIds = this.composer.selection?.getSelectedIds?.() ?? [];
      if (selectedIds.length === 0) {
        return { kind: "failed", reason: "no-text-selected" };
      }
      const applied: string[] = [];
      for (const id of selectedIds) {
        const el = this.getElement(id);
        if (!el) continue;
        const elType = el.getType?.();
        // Accept any text-bearing element type. Conservative list keeps
        // this safe against future element types.
        if (elType === "text" || elType === "heading" || elType === "paragraph") {
          el.setStyle("font-family", src);
          applied.push(id);
        }
      }
      if (applied.length === 0) {
        return { kind: "failed", reason: "no-text-selected" };
      }
      this.composer.emit(EVENTS.ELEMENT_STYLE_UPDATED, {
        elementIds: applied,
        property: "font-family",
        value: src,
      });
      return { kind: "font-applied", elementIds: applied };
    }

    const elementTypeMap: Record<string, ElementData["type"]> = {
      image: "image",
      video: "video",
      audio: "audio",
      svg: "svg",
      icon: "icon",
      lottie: "lottie",
    };

    const elementType = elementTypeMap[type];
    if (!elementType) return { kind: "failed", reason: "invalid-type" };

    // If target is specified, replace its src instead of creating a new element.
    if (opts?.targetElementId) {
      const target = this.getElement(opts.targetElementId);
      if (target) {
        const bgImage = target.getStyle("background-image");
        if (bgImage && bgImage.includes("url(")) {
          target.setStyle("background-image", `url(${src})`);
        } else {
          target.setAttribute("src", src);
        }
        this.composer.emit(EVENTS.ELEMENT_STYLE_UPDATED, {
          elementIds: [opts.targetElementId],
          property: "src",
          value: src,
        });
        return { kind: "element", elementId: opts.targetElementId };
      }
      // Fall through if the target doesn't exist — create a new element.
    }

    // Build placement styles. Coords only apply to visually-positioned
    // elements (image, video). Audio/icon/svg/lottie use default layout.
    const placementStyles: Record<string, string> = {};
    if ((type === "image" || type === "video") && (opts?.x !== undefined || opts?.y !== undefined)) {
      placementStyles.position = "absolute";
      if (opts.x !== undefined) placementStyles.left = `${opts.x}px`;
      if (opts.y !== undefined) placementStyles.top = `${opts.y}px`;
    }

    const element = this.createElement(elementType, {
      attributes: { src },
      styles: type === "image" || type === "video"
        ? { width: "auto", "max-width": "100%", ...placementStyles }
        : placementStyles,
    });

    const rootId = page.root?.id;
    if (!rootId) return { kind: "failed", reason: "no-active-page" };

    // Smart insert: selected empty container > selected parent > root.
    // Skipped when coords are given — coords imply absolute placement on the page root.
    let parentId = rootId;
    let insertIndex: number | undefined;

    const hasCoords = opts?.x !== undefined || opts?.y !== undefined;
    if (!hasCoords) {
      const selectedIds = this.composer.selection?.getSelectedIds?.() ?? [];
      if (selectedIds.length === 1) {
        const sel = this.getElement(selectedIds[0]);
        if (sel) {
          const selSrc = sel.getAttribute("src");
          const selChildren = sel.getChildren?.() ?? [];
          if (!selSrc && selChildren.length === 0) {
            parentId = sel.getId();
          } else {
            const parent = sel.getParent();
            if (parent) {
              const siblings = parent.getChildren();
              const idx = siblings.findIndex((c) => c.getId() === sel.getId());
              parentId = parent.getId();
              insertIndex = idx >= 0 ? idx + 1 : undefined;
            }
          }
        }
      }
    }

    const added = this.addElement(element, parentId, insertIndex);
    if (!added) return null;

    this.composer.emit(EVENTS.ELEMENT_INSERTED, {
      elementId: element.getId(),
      type: elementType,
      src,
    });

    return { kind: "element", elementId: element.getId() };
  }

  /**
   * Find all elements on the active page that reference a given media src.
   * Checks both the `src` attribute and `background-image` CSS property.
   */
  findByMediaSrc(src: string): Element[] {
    const results: Element[] = [];
    if (!src) return results;

    for (const element of this.elements.values()) {
      const elSrc = element.getAttribute("src");
      if (elSrc === src) {
        results.push(element);
        continue;
      }

      const bgImage = element.getStyle("background-image");
      if (bgImage && bgImage.includes(src)) {
        results.push(element);
      }
    }

    return results;
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
