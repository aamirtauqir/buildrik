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
   * Escape HTML special characters to prevent XSS. Setting textContent stores
   * the raw string; reading innerHTML serializes it with `&`, `<`, `>` encoded
   * as entities. (Reading textContent back — the previous implementation —
   * returned the input untouched, a no-op that only looked like escaping.)
   */
  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Expand all repeater elements in the given HTML
   */
  async expandRepeaters(rootHtml: string): Promise<string> {
    if (!rootHtml || !this.composer.cms.bindings) {
      return rootHtml;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(rootHtml, "text/html");

    // Find all elements bound to a collection (repeater templates).
    const repeaters = Array.from(doc.querySelectorAll("[data-buildrick-id]")).filter((el) => {
      const elementId = el.getAttribute("data-buildrick-id");
      return !!elementId && !!this.composer.cms.bindings.getCollectionBinding(elementId);
    });

    // Only expand top-level repeaters here. A repeater nested inside another
    // repeater is expanded recursively (inner-first per clone) by
    // expandRepeater, so expanding it here too would race the outer clone and
    // leave the copies inside those clones un-expanded.
    const topLevel = repeaters.filter(
      (el) => !repeaters.some((other) => other !== el && other.contains(el)),
    );

    await Promise.all(
      topLevel.map((el) => {
        const elementId = el.getAttribute("data-buildrick-id")!;
        const binding = this.composer.cms.bindings.getCollectionBinding(elementId)!;
        return this.expandRepeater(el as HTMLElement, binding, doc);
      }),
    );
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
    if (!this.composer.cms.collections) return;

    // Fetch items from collection
    // Note: status 'all' means no filter, so we only pass status if it's not 'all'
    const result = await this.composer.cms.collections.queryContent({
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
    const originalId = templateEl.getAttribute("data-buildrick-id");
    const clones: HTMLElement[] = [];

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
      clones.push(clonedEl);
    });

    // Replace template with expanded items
    if (templateEl.parentNode) {
      // Mark template as processed
      templateEl.setAttribute("data-cms-repeater-template", "true");
      templateEl.style.display = "none";

      // Insert expanded items after template
      templateEl.parentNode.insertBefore(fragment, templateEl.nextSibling);
    }

    // Recurse: a nested repeater lives inside each clone with its original
    // data-buildrick-id intact (applyContext only re-keys the clone's own
    // id). Expand those now so inner placeholders don't survive in the outer
    // clones.
    await this.expandNestedRepeaters(clones, doc);
  }

  /**
   * Expand any collection-bound descendants inside freshly-cloned repeater
   * items. Runs after the parent clones exist so the inner template's markup
   * is real DOM to clone from, not a raw string in the outer template.
   */
  private async expandNestedRepeaters(clones: HTMLElement[], doc: Document): Promise<void> {
    if (!this.composer.cms.bindings) return;

    const nested: Promise<void>[] = [];
    for (const clone of clones) {
      clone.querySelectorAll("[data-buildrick-id]").forEach((el) => {
        const elementId = el.getAttribute("data-buildrick-id");
        if (!elementId) return;
        const binding = this.composer.cms.bindings.getCollectionBinding(elementId);
        if (!binding) return;
        nested.push(this.expandRepeater(el as HTMLElement, binding, doc));
      });
    }
    await Promise.all(nested);
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
    el.setAttribute("data-buildrick-id", cloneId);

    // Process text content in all child elements
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      let text = textNode.textContent || "";
      let injectedValue = false;

      // Replace index variable (numeric — safe literal)
      const indexPattern = new RegExp(`\\{\\{\\s*${indexVar}\\s*\\}\\}`, "g");
      text = text.replace(indexPattern, () => String(index));

      // Replace item fields. The replacement is a function so a value
      // containing "$&", "$1", etc. is inserted verbatim rather than being
      // interpreted as a String.replace substitution pattern. The value is
      // HTML-escaped so any markup it carries is inert once injected below.
      Object.entries(item.data).forEach(([fieldName, value]) => {
        const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
        text = text.replace(fieldPattern, () => {
          injectedValue = true;
          return this.escapeHtml(String(value ?? ""));
        });
      });

      // Replace context helpers (boolean / count — safe literals)
      text = text.replace(/\{\{\s*isFirst\s*\}\}/g, () => String(context.isFirst));
      text = text.replace(/\{\{\s*isLast\s*\}\}/g, () => String(context.isLast));
      text = text.replace(/\{\{\s*total\s*\}\}/g, () => String(context.total));

      if (injectedValue) {
        // A field value was substituted and HTML-escaped. Inject through an
        // innerHTML sink so the escaped entities decode back to inert text —
        // a raw "<script>" in a CMS value lands as literal characters, never
        // a live node. This is the sink escapeHtml exists to protect.
        const template = (el.ownerDocument ?? document).createElement("template");
        template.innerHTML = text;
        textNode.replaceWith(template.content);
      } else {
        // Pure literal / index / helper text — assign as text so author
        // markup stays verbatim (no re-parse of trusted template text).
        textNode.textContent = text;
      }
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
          value = value.replace(indexPattern, () => String(index));
          modified = true;
        }

        // Replace item fields. Replacer function so a value containing "$&"
        // etc. is inserted literally. The value is set through setAttribute
        // (a DOM sink) and serialized by innerHTML on the way out, which
        // entity-encodes it — no manual escaping needed (and pre-escaping
        // here would double-encode the attribute).
        Object.entries(item.data).forEach(([fieldName, fieldValue]) => {
          const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
          if (fieldPattern.test(value)) {
            value = value.replace(fieldPattern, () => String(fieldValue ?? ""));
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
    if (!this.composer.cms.bindings) return false;
    return this.composer.cms.bindings.getCollectionBinding(elementId) !== null;
  }

  /**
   * Get the collection binding for a repeater
   */
  getRepeaterBinding(elementId: string): CMSCollectionBinding | null {
    if (!this.composer.cms.bindings) return null;
    return this.composer.cms.bindings.getCollectionBinding(elementId);
  }
}

export default RepeaterRenderer;
