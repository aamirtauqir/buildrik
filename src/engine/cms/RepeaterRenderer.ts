/**
 * RepeaterRenderer - Expands repeater elements with CMS data
 * Clones template elements for each CMS collection item
 * @license BSD-3-Clause
 */

import type { CMSContentItem } from "../../shared/types/cms";
import type { Composer } from "../Composer";
import type { CMSCollectionBinding } from "./CMSBindingManager";

interface RepeaterContext {
  item: CMSContentItem;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * RepeaterRenderer - Expands repeater elements in HTML with CMS data
 *
 * Security Note: Content comes from the internal CMS system which is
 * trusted. For additional safety, field values are escaped when rendered.
 */
export class RepeaterRenderer {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Escape HTML special characters to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.textContent || "";
  }

  /**
   * Expand all repeater elements in the given HTML
   */
  async expandRepeaters(rootHtml: string): Promise<string> {
    if (!rootHtml || !this.composer.cmsBindings) {
      return rootHtml;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(rootHtml, "text/html");

    // Find all elements with data-aqb-id that have collection bindings
    const elements = doc.querySelectorAll("[data-aqb-id]");
    const expansionPromises: Promise<void>[] = [];

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-aqb-id");
      if (!elementId) return;

      const binding = this.composer.cmsBindings.getCollectionBinding(elementId);
      if (!binding) return;

      // Queue expansion for this repeater
      expansionPromises.push(this.expandRepeater(el as HTMLElement, binding, doc));
    });

    await Promise.all(expansionPromises);
    return doc.body.innerHTML;
  }

  /**
   * Expand a single repeater element
   */
  private async expandRepeater(
    templateEl: HTMLElement,
    binding: CMSCollectionBinding,
    doc: Document
  ): Promise<void> {
    if (!this.composer.cmsManager) return;

    // Fetch items from collection
    // Note: status 'all' means no filter, so we only pass status if it's not 'all'
    const result = await this.composer.cmsManager.queryContent({
      collectionId: binding.collectionId,
      status: binding.status === "all" ? undefined : binding.status,
      limit: binding.limit,
    });

    const items = result.items;
    if (items.length === 0) {
      // No items - hide the template or show empty state
      templateEl.style.display = "none";
      templateEl.setAttribute("data-cms-repeater-empty", "true");
      return;
    }

    // Create a fragment to hold all cloned elements
    const fragment = doc.createDocumentFragment();
    const originalId = templateEl.getAttribute("data-aqb-id");

    items.forEach((item, index) => {
      const context: RepeaterContext = {
        item,
        index,
        total: items.length,
        isFirst: index === 0,
        isLast: index === items.length - 1,
      };

      // Clone the template element
      const clonedEl = templateEl.cloneNode(true) as HTMLElement;
      this.applyContext(clonedEl, context, binding, originalId!);

      // Add repeater metadata
      clonedEl.setAttribute("data-cms-repeater-item", String(index));
      clonedEl.setAttribute("data-cms-item-id", item.id);
      clonedEl.removeAttribute("data-cms-repeater-template");

      fragment.appendChild(clonedEl);
    });

    // Replace template with expanded items
    if (templateEl.parentNode) {
      // Mark template as processed
      templateEl.setAttribute("data-cms-repeater-template", "true");
      templateEl.style.display = "none";

      // Insert expanded items after template
      templateEl.parentNode.insertBefore(fragment, templateEl.nextSibling);
    }
  }

  /**
   * Apply item context to a cloned element using safe DOM methods
   */
  private applyContext(
    el: HTMLElement,
    context: RepeaterContext,
    binding: CMSCollectionBinding,
    originalId: string
  ): void {
    const { item, index } = context;
    const itemVar = binding.itemVar || "item";
    const indexVar = binding.indexVar || "index";

    // Generate unique ID for this clone
    const cloneId = `${originalId}-${index}`;
    el.setAttribute("data-aqb-id", cloneId);

    // Process text content in all child elements
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      let text = textNode.textContent || "";

      // Replace index variable
      const indexPattern = new RegExp(`\\{\\{\\s*${indexVar}\\s*\\}\\}`, "g");
      text = text.replace(indexPattern, String(index));

      // Replace item fields (escaped for safety)
      Object.entries(item.data).forEach(([fieldName, value]) => {
        const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
        text = text.replace(fieldPattern, this.escapeHtml(String(value ?? "")));
      });

      // Replace context helpers
      text = text.replace(/\{\{\s*isFirst\s*\}\}/g, String(context.isFirst));
      text = text.replace(/\{\{\s*isLast\s*\}\}/g, String(context.isLast));
      text = text.replace(/\{\{\s*total\s*\}\}/g, String(context.total));

      textNode.textContent = text;
    });

    // Process attributes
    const allElements = el.querySelectorAll("*");
    [el, ...Array.from(allElements)].forEach((element) => {
      Array.from(element.attributes).forEach((attr) => {
        let value = attr.value;
        let modified = false;

        // Replace index variable
        const indexPattern = new RegExp(`\\{\\{\\s*${indexVar}\\s*\\}\\}`, "g");
        if (indexPattern.test(value)) {
          value = value.replace(indexPattern, String(index));
          modified = true;
        }

        // Replace item fields
        Object.entries(item.data).forEach(([fieldName, fieldValue]) => {
          const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
          if (fieldPattern.test(value)) {
            value = value.replace(fieldPattern, this.escapeHtml(String(fieldValue ?? "")));
            modified = true;
          }
        });

        if (modified) {
          element.setAttribute(attr.name, value);
        }
      });
    });
  }

  /**
   * Check if an element is a repeater template
   */
  isRepeaterTemplate(elementId: string): boolean {
    if (!this.composer.cmsBindings) return false;
    return this.composer.cmsBindings.getCollectionBinding(elementId) !== null;
  }

  /**
   * Get the collection binding for a repeater
   */
  getRepeaterBinding(elementId: string): CMSCollectionBinding | null {
    if (!this.composer.cmsBindings) return null;
    return this.composer.cmsBindings.getCollectionBinding(elementId);
  }
}

export default RepeaterRenderer;
