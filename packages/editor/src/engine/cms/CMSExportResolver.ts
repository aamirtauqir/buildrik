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
/**
 * Give back what we were given: a full document round-trips as a full document.
 *
 * Both resolvers returned `doc.body.innerHTML`, which was survivable while
 * nothing called them and fatal the moment resolution became the default — a
 * whole page went in and came back as a bare <div>, with the title, the
 * stylesheet, the SEO tags and the analytics gone.
 */
function serialize(doc: Document, original: string): string {
  const wasDocument = /<html[\s>]/i.test(original) || /<!doctype/i.test(original);
  if (!wasDocument) return doc.body.innerHTML;
  const doctype = /<!doctype[^>]*>/i.exec(original)?.[0] ?? "<!DOCTYPE html>";
  return `${doctype}\n${doc.documentElement.outerHTML}`;
}

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
    /* Optional all the way down. Now that resolution is the DEFAULT rather than
       an opt-in flag, every export runs through here — including composers
       built without a CMS manager at all, where `composer.cms.bindings` threw
       and the export returned `success: false` with no page at all. A site
       without bindings must come out exactly as it did before. */
    if (!this.composer.cms?.bindings) return html;
    if (typeof DOMParser === "undefined") return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("[data-buildrick-id]");
    const promises: Promise<void>[] = [];

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-buildrick-id");
      if (!elementId) return;

      const bindings = this.composer.cms.bindings.getBindings(elementId);
      bindings.forEach((binding) => {
        const promise = this.composer.cms.bindings.resolveBinding(binding).then((value) => {
          if (!value) return;
          this.applyValue(el as HTMLElement, binding.property, value);
        });
        promises.push(promise);
      });
    });

    await Promise.all(promises);

    /* Editor-only state goes; the ID STAYS. `data-buildrick-id` is what the
       StyleEngine's breakpoint rules target (`@media { [data-buildrick-id] }`)
       — stripping it leaves a deployed site unstyled at every breakpoint,
       which is a bug this export has already had once (ExportEngine:997). */
    elements.forEach((el) => {
      el.removeAttribute("data-buildrick-selected");
      el.removeAttribute("data-cms-bound");
    });

    return serialize(doc, html);
  }

  /**
   * Convert to template syntax (template mode)
   */
  private resolveTemplate(html: string, syntax: TemplateSyntax): string {
    if (!this.composer.cms?.bindings) return html;
    if (typeof DOMParser === "undefined") return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.querySelectorAll("[data-buildrick-id]");

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-buildrick-id");
      if (!elementId) return;

      const bindings = this.composer.cms.bindings.getBindings(elementId);
      bindings.forEach((binding) => {
        const templateVar = this.createTemplateVar(binding.collectionId, binding.fieldSlug, syntax);
        this.applyValue(el as HTMLElement, binding.property, templateVar);
      });

      // Handle collection bindings (repeaters)
      const collectionBinding = this.composer.cms.bindings.getCollectionBinding(elementId);
      if (collectionBinding) {
        this.wrapInLoop(el as HTMLElement, collectionBinding, syntax, doc);
      }
    });

    /* Same rule as the static path: editor state goes, the ID stays — the
       breakpoint CSS selects on it. */
    doc.querySelectorAll("[data-buildrick-id]").forEach((el) => {
      el.removeAttribute("data-buildrick-selected");
      el.removeAttribute("data-cms-bound");
      el.removeAttribute("data-cms-repeater-template");
    });

    return serialize(doc, html);
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
    binding: ReturnType<typeof this.composer.cms.bindings.getCollectionBinding>,
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
    if (!this.composer.cms.bindings) return false;
    // Check if there are any bindings registered
    const page = this.composer.elements.getActivePage?.();
    if (!page?.root) return false;
    return this.checkElementBindings(page.root.id);
  }

  /**
   * Recursively check element and children for bindings
   */
  private checkElementBindings(elementId: string): boolean {
    const bindings = this.composer.cms.bindings?.getBindings(elementId) || [];
    if (bindings.length > 0) return true;

    const collectionBinding = this.composer.cms.bindings?.getCollectionBinding(elementId);
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
