/**
 * CMSExportResolver - Resolves CMS bindings for export
 * Supports static (embed data) and template (handlebars/liquid) modes
 * @license BSD-3-Clause
 */

import type { Composer } from "../Composer";

export type CMSExportMode = "static" | "template" | "none";
export type TemplateSyntax = "handlebars" | "liquid";

export interface CMSExportOptions {
  mode: CMSExportMode;
  syntax?: TemplateSyntax;
}

/**
 * Resolves CMS bindings in HTML for export
 */
export class CMSExportResolver {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Resolve CMS bindings in HTML based on export mode
   */
  async resolve(html: string, options: CMSExportOptions): Promise<string> {
    if (options.mode === "none" || !html) {
      return html;
    }

    if (options.mode === "static") {
      return this.resolveStatic(html);
    }

    if (options.mode === "template") {
      return this.resolveTemplate(html, options.syntax || "handlebars");
    }

    return html;
  }

  /**
   * Resolve with actual CMS content values (static mode)
   */
  private async resolveStatic(html: string): Promise<string> {
    if (!this.composer.cmsBindings) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("[data-aqb-id]");
    const promises: Promise<void>[] = [];

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-aqb-id");
      if (!elementId) return;

      const bindings = this.composer.cmsBindings.getBindings(elementId);
      bindings.forEach((binding) => {
        const promise = this.composer.cmsBindings.resolveBinding(binding).then((value) => {
          if (!value) return;
          this.applyValue(el as HTMLElement, binding.property, value);
        });
        promises.push(promise);
      });
    });

    await Promise.all(promises);

    // Clean up builder-specific attributes for production
    elements.forEach((el) => {
      el.removeAttribute("data-aqb-id");
      el.removeAttribute("data-aqb-selected");
      el.removeAttribute("data-cms-bound");
    });

    return doc.body.innerHTML;
  }

  /**
   * Convert to template syntax (template mode)
   */
  private resolveTemplate(html: string, syntax: TemplateSyntax): string {
    if (!this.composer.cmsBindings) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("[data-aqb-id]");

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-aqb-id");
      if (!elementId) return;

      const bindings = this.composer.cmsBindings.getBindings(elementId);
      bindings.forEach((binding) => {
        const templateVar = this.createTemplateVar(binding.collectionId, binding.fieldSlug, syntax);
        this.applyValue(el as HTMLElement, binding.property, templateVar);
      });

      // Handle collection bindings (repeaters)
      const collectionBinding = this.composer.cmsBindings.getCollectionBinding(elementId);
      if (collectionBinding) {
        this.wrapInLoop(el as HTMLElement, collectionBinding, syntax, doc);
      }
    });

    // Clean up builder-specific attributes for production
    doc.querySelectorAll("[data-aqb-id]").forEach((el) => {
      el.removeAttribute("data-aqb-id");
      el.removeAttribute("data-aqb-selected");
      el.removeAttribute("data-cms-bound");
      el.removeAttribute("data-cms-repeater-template");
    });

    return doc.body.innerHTML;
  }

  /**
   * Apply value to element based on property type
   */
  private applyValue(el: HTMLElement, property: string, value: string): void {
    switch (property) {
      case "content":
        el.textContent = value;
        break;
      case "src":
      case "href":
      case "alt":
      case "title":
        el.setAttribute(property, value);
        break;
      default:
        el.setAttribute(property, value);
    }
  }

  /**
   * Create template variable syntax
   */
  private createTemplateVar(
    collectionId: string,
    fieldSlug: string,
    syntax: TemplateSyntax
  ): string {
    // Use collection.field format
    const varPath = `${collectionId}.${fieldSlug}`;

    if (syntax === "handlebars") {
      return `{{${varPath}}}`;
    }

    if (syntax === "liquid") {
      return `{{ ${varPath} }}`;
    }

    return `{{${varPath}}}`;
  }

  /**
   * Wrap element in loop syntax for repeaters
   */
  private wrapInLoop(
    el: HTMLElement,
    binding: ReturnType<typeof this.composer.cmsBindings.getCollectionBinding>,
    syntax: TemplateSyntax,
    doc: Document
  ): void {
    if (!binding) return;

    const itemVar = binding.itemVar || "item";
    const collectionVar = binding.collectionId;

    if (syntax === "handlebars") {
      const startComment = doc.createComment(`#each ${collectionVar} as |${itemVar}|`);
      const endComment = doc.createComment("/each");
      el.parentNode?.insertBefore(startComment, el);
      el.parentNode?.insertBefore(endComment, el.nextSibling);
    } else if (syntax === "liquid") {
      const startComment = doc.createComment(`for ${itemVar} in ${collectionVar}`);
      const endComment = doc.createComment("endfor");
      el.parentNode?.insertBefore(startComment, el);
      el.parentNode?.insertBefore(endComment, el.nextSibling);
    }
  }

  /**
   * Check if document has any CMS bindings
   */
  hasBindings(): boolean {
    if (!this.composer.cmsBindings) return false;
    // Check if there are any bindings registered
    const page = this.composer.elements.getActivePage?.();
    if (!page?.root) return false;
    return this.checkElementBindings(page.root.id);
  }

  /**
   * Recursively check element and children for bindings
   */
  private checkElementBindings(elementId: string): boolean {
    const bindings = this.composer.cmsBindings?.getBindings(elementId) || [];
    if (bindings.length > 0) return true;

    const collectionBinding = this.composer.cmsBindings?.getCollectionBinding(elementId);
    if (collectionBinding) return true;

    const element = this.composer.elements.getElement(elementId);
    const children = element?.getChildren?.() || [];

    for (const child of children) {
      const childId = child.getId?.();
      if (childId && this.checkElementBindings(childId)) return true;
    }

    return false;
  }
}

export default CMSExportResolver;
