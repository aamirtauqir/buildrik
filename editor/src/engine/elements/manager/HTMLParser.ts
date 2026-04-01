/**
 * HTML Parser
 * Handles HTML import and parsing operations
 *
 * @module engine/elements/manager/HTMLParser
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../../shared/constants";
import type { ElementData, ExportOptions } from "../../../shared/types";
import { generateId } from "../../../shared/utils/helpers";
import {
  isTextOnlyTag,
  getElementTypeFromTag,
  elementDataToHTML,
  sanitizeHTML,
} from "../../../shared/utils/html";
import { parseHTML, parseInlineStyles } from "../../../shared/utils/parsers";
import type { Element } from "../Element";
import type { ElementManagerContext } from "./types";

/**
 * Manages HTML parsing and import operations
 */
export class HTMLParser {
  private ctx: ElementManagerContext;

  constructor(context: ElementManagerContext) {
    this.ctx = context;
  }

  /**
   * Convert active page to HTML
   *
   * We generate HTML from the live root Element so that any
   * edits applied via Element APIs (styles, attributes, children)
   * are reflected immediately on the canvas.
   */
  toHTML(_options?: ExportOptions): string {
    const activePageId = this.ctx.getActivePageId();
    const page = activePageId ? this.ctx.pages.get(activePageId) : undefined;
    if (!page) return "";

    const rootElement = this.ctx.elements.get(page.root.id);
    const rootData = rootElement ? rootElement.toJSON() : page.root;

    // Use shared HTML generation with data attributes for editor mode
    return elementDataToHTML(rootData, { includeDataAttributes: true });
  }

  /**
   * Import raw HTML into the active page.
   *
   * Converts the provided HTML string into an ElementData tree and assigns it
   * as the children of the active page's root element. Rebuilds the internal
   * element map so that Composer remains the single source of truth.
   */
  importHTMLToActivePage(html: string): void {
    this.ctx.composer.beginTransaction("import-html-to-active-page");
    try {
      const activePageId = this.ctx.getActivePageId();
      let page = activePageId ? this.ctx.pages.get(activePageId) : undefined;

      // Ensure there is an active page - use PageManager via context
      if (!page) {
        // Create a default page if none exists
        page = {
          id: generateId("page"),
          name: "Page 1",
          slug: "page-1",
          root: {
            id: generateId("root"),
            type: "container",
            tagName: "div",
            classes: ["aqb-page-root"],
            children: [],
          },
        };
        this.ctx.pages.set(page.id, page);
        this.ctx.buildElementTree(page.root);
        this.ctx.setActivePageId(page.id);
        this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page });
      }

      const children = this.htmlToElementDataList(html);

      // Get the old root element
      const oldRoot = this.ctx.elements.get(page.root.id);

      // Only clear elements from THIS page (not all pages)
      if (oldRoot) {
        const descendants = this.ctx.getAllDescendants(oldRoot);
        descendants.forEach((el) => this.ctx.elements.delete(el.getId()));
        this.ctx.elements.delete(oldRoot.getId());
      }

      // Replace root children with imported tree
      page.root.children = children;

      // Only rebuild THIS page (not all pages)
      this.ctx.buildElementTree(page.root);

      this.ctx.composer.emit(EVENTS.PROJECT_CHANGED, { type: "page:imported", page });
      this.ctx.composer.markDirty();
    } finally {
      this.ctx.composer.endTransaction();
    }
  }

  /**
   * Insert HTML into an element at a specific index
   */
  insertHTMLToElement(parentId: string, html: string, index?: number): Element[] {
    const parent = this.ctx.elements.get(parentId);
    if (!parent || !html) return [];

    this.ctx.composer.beginTransaction("insert-html-to-element");
    try {
      const childrenData = this.htmlToElementDataList(html);
      const created: Element[] = [];

      childrenData.forEach((data, i) => {
        // Build tree WITHOUT parent - we'll add to parent manually at correct position
        const element = this.ctx.buildElementTree(data);
        parent.addChild(element, index !== undefined ? index + i : undefined);
        created.push(element);
      });

      this.ctx.composer.markDirty();
      return created;
    } finally {
      this.ctx.composer.endTransaction();
    }
  }

  /**
   * Convert an HTML string into a list of ElementData nodes
   * Sanitizes HTML before parsing to prevent XSS attacks
   */
  private htmlToElementDataList(html: string): ElementData[] {
    // Defense-in-depth: sanitize HTML to remove dangerous attributes (onclick, etc.)
    const safeHtml = sanitizeHTML(html || "");
    const fragment = parseHTML(safeHtml);
    const result: ElementData[] = [];

    fragment.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        result.push(this.domElementToElementData(node as HTMLElement));
      } else if (
        node.nodeType === Node.TEXT_NODE &&
        node.textContent &&
        node.textContent.trim() !== ""
      ) {
        result.push(this.createTextElementData(node.textContent));
      }
    });

    return result;
  }

  /**
   * Convert a DOM element into ElementData (recursive)
   */
  private domElementToElementData(el: HTMLElement): ElementData {
    const type = this.mapDomToElementType(el);
    const tagName = el.tagName.toLowerCase();

    const attributes: Record<string, string> = {};
    let styles: Record<string, string> | undefined;
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name;
      if (name === "class" || name === "data-aqb-id" || name === "data-aqb-type") {
        return;
      }
      if (name === "style") {
        if (attr.value && attr.value.trim().length > 0) {
          styles = parseInlineStyles(attr.value);
        }
        return;
      }
      attributes[name] = attr.value;
    });

    const classes = Array.from(el.classList);

    const children: ElementData[] = [];
    let textBuffer = "";
    let hasElementChildren = false;

    el.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        hasElementChildren = true;
        if (textBuffer.trim().length > 0) {
          children.push(this.createTextElementData(textBuffer));
          textBuffer = "";
        }
        children.push(this.domElementToElementData(node as HTMLElement));
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        textBuffer += node.textContent;
      }
    });

    // For text-only elements, store text as content instead of creating child text elements
    const isTextOnlyElement =
      !hasElementChildren && textBuffer.trim().length > 0 && isTextOnlyTag(tagName);

    if (!isTextOnlyElement && textBuffer.trim().length > 0) {
      children.push(this.createTextElementData(textBuffer));
    }

    const data: ElementData = {
      id: generateId("el"),
      type,
      tagName,
      children,
      ...(isTextOnlyElement && { content: textBuffer }),
    };

    if (Object.keys(attributes).length > 0) {
      data.attributes = attributes;
    }

    if (classes.length > 0) {
      data.classes = classes;
    }

    if (styles && Object.keys(styles).length > 0) {
      data.styles = styles;
    }

    return data;
  }

  /**
   * Map a DOM element to an internal ElementType
   */
  private mapDomToElementType(el: HTMLElement): ElementData["type"] {
    const dataType = el.getAttribute("data-aqb-type");
    const tag = el.tagName.toLowerCase();
    return getElementTypeFromTag(tag, dataType) as ElementData["type"];
  }

  /**
   * Create a simple text element
   */
  private createTextElementData(text: string): ElementData {
    return {
      id: generateId("el"),
      type: "text",
      tagName: "span",
      content: text,
      children: [],
    };
  }
}
