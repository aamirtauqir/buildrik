/**
 * CMSExportResolver - Resolves CMS bindings for export
 * Supports static (embed data) and template (handlebars/liquid) modes
 * @license BSD-3-Clause
 */

import { CURRENT_ITEM_ATTR, followsContextRecord, RepeaterRenderer, richtextKeys, writeBoundValue } from "./RepeaterRenderer";
import type { Composer } from "../Composer";
import { URL_ATTRIBUTES } from "@buildrik/shared/schemas/element-markup";

export type CMSExportMode = "static" | "template" | "none";
export type TemplateSyntax = "handlebars" | "liquid";

export interface CMSExportOptions {
  mode: CMSExportMode;
  syntax?: TemplateSyntax;
  /** The published file name of the page being resolved (pageFileNames).
   *  On a collection's template page (pageTemplatePath), a binding to "the
   *  record on this page" is written as the publish worker's {fieldSlug}
   *  token, which it fills once per record. */
  pageFile?: string;
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

const ITEM_PLACEHOLDER = /\{\{\s*item\.[\w.-]+\s*\}\}/g;

/**
 * A published page never carries `{{item.…}}` (BD-06, BD-19): what is left
 * after the lists expanded — a Collection list bound to nothing, a field a
 * record lacks in an ATTRIBUTE (the text pass already cleared text) — is
 * removed. A URL attribute left empty goes entirely (an empty src/href
 * re-requests the page). The pre-publish check names unbound lists first.
 */
function clearItemPlaceholders(doc: Document): void {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent && ITEM_PLACEHOLDER.test(node.textContent)) node.textContent = node.textContent.replace(ITEM_PLACEHOLDER, "");
    ITEM_PLACEHOLDER.lastIndex = 0;
  }
  doc.body.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (!ITEM_PLACEHOLDER.test(attr.value)) continue;
      ITEM_PLACEHOLDER.lastIndex = 0;
      const value = attr.value.replace(ITEM_PLACEHOLDER, "").trim();
      if (!value && URL_ATTRIBUTES.has(attr.name.toLowerCase())) el.removeAttribute(attr.name);
      else el.setAttribute(attr.name, value);
    }
  });
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
      return this.resolveStatic(html, options.pageFile);
    }

    if (options.mode === "template") {
      return this.resolveTemplate(html, options.syntax || "handlebars");
    }

    return html;
  }

  /**
   * Resolve with actual CMS content values (static mode)
   */
  private async resolveStatic(html: string, pageFile?: string): Promise<string> {
    /* Optional all the way down. Now that resolution is the DEFAULT rather than
       an opt-in flag, every export runs through here — including composers
       built without a CMS manager at all, where `composer.cms.bindings` threw
       and the export returned `success: false` with no page at all. A site
       without bindings must come out exactly as it did before. */
    if (!this.composer.cms?.bindings) return html;
    if (typeof DOMParser === "undefined") return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    /* Collection lists first (G3-079): their per-record copies are what the
       field bindings below then resolve over. A page without one is left
       untouched by this step. */
    await new RepeaterRenderer(this.composer).expandCollectionLists(doc);
    const elements = doc.querySelectorAll("[data-buildrick-id]");
    const promises: Promise<void>[] = [];

    elements.forEach((el) => {
      const elementId = el.getAttribute("data-buildrick-id");
      if (!elementId) return;

      const bindings = this.composer.cms.bindings.getBindings(elementId);
      const currentItemOf = el.getAttribute(CURRENT_ITEM_ATTR);
      bindings.forEach((binding) => {
        const onPageRecord = followsContextRecord(binding);
        /* Already filled from its list copy's own record (C0.8). */
        if (onPageRecord && currentItemOf === binding.collectionId) return;
        if (onPageRecord && pageFile && this.composer.cms.collections?.getCollection?.(binding.collectionId)?.pageTemplatePath === pageFile) {
          writeBoundValue(el, binding.property, `{${binding.fieldSlug}}`);
          return;
        }
        const promise = this.composer.cms.bindings.resolveBinding(binding).then((value) => {
          /* resolveBinding already answers the fallback when the record or
             its field has no value. Nothing at all (no fallback either) is
             written as nothing: keeping the element's stored text shipped
             the canvas sample — or a record since unpublished or deleted —
             to the live site (BD-03). runPrePublishChecks lists these. */
          const rich = richtextKeys(this.composer.cms.collections?.getCollection?.(binding.collectionId)?.fields);
          writeBoundValue(el, binding.property, value, rich.has(binding.fieldSlug));
        });
        promises.push(promise);
      });
    });

    await Promise.all(promises);

    clearItemPlaceholders(doc);

    /* Editor-only state goes; the ID STAYS. `data-buildrick-id` is what the
       StyleEngine's breakpoint rules target (`@media { [data-buildrick-id] }`)
       — stripping it leaves a deployed site unstyled at every breakpoint,
       which is a bug this export has already had once (ExportEngine:997). */
    elements.forEach((el) => {
      el.removeAttribute("data-buildrick-selected");
      el.removeAttribute("data-cms-bound");
      el.removeAttribute(CURRENT_ITEM_ATTR);
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
        writeBoundValue(el, binding.property, templateVar);
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
    const [open, close] =
      syntax === "handlebars"
        ? [`#each ${collectionVar} as |${itemVar}|`, "/each"]
        : [`for ${itemVar} in ${collectionVar}`, "endfor"];
    const startComment = doc.createComment(open);
    const endComment = doc.createComment(close);
    /* A Collection list (G3-079) repeats its children; the older repeater
       repeats itself. */
    if (binding.repeat === "children") {
      el.insertBefore(startComment, el.firstChild);
      el.appendChild(endComment);
    } else {
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
