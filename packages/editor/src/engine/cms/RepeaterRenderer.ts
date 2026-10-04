/**
 * RepeaterRenderer - Expands repeater elements with CMS data
 * Clones template elements for each CMS collection item
 * @license BSD-3-Clause
 */

import { escapeHtmlText, isDangerousUrl, URL_ATTRIBUTES } from "@buildrik/shared/schemas/element-markup";
import { CMS_COLLECTION_LIMIT_MAX, isSafeCmsBoundValue } from "@buildrik/shared/schemas/sites";
import { cmsRecordLabel, cmsTextOf } from "@buildrik/shared/schemas/cms";
import { sanitizeRichtext } from "../../shared/utils/html/sanitization";
import type { CMSContentItem } from "../../shared/types/cms";
import type { Composer } from "../Composer";
import type { CMSCollectionBinding, CMSElementBinding } from "./CMSBindingManager";

/**
 * Set on an element inside a Collection list whose field bindings were filled
 * from the list's CURRENT record (C0.8), valued with that collection's id. The
 * page-wide binding pass that runs after the list expands (CMSExportResolver,
 * useCMSPreview) skips those bindings — it would write one record into every
 * copy — and the export strips the marker.
 */
export const CURRENT_ITEM_ATTR = "data-cms-current-item";

/** Does `binding` follow "the record on this page / in this list" rather than
 *  a pinned record? */
export function followsContextRecord(binding: Pick<CMSElementBinding, "itemId">): boolean {
  return !binding.itemId || binding.itemId === "context";
}

/**
 * Write a resolved binding value into a rendered element: text semantics for
 * `content`, the attribute otherwise. An empty value writes nothing there —
 * "" for text and alt/title, no attribute for src/href (an empty URL
 * re-requests the page). Values come from CMS entries and property names from
 * stored bindings, so only the shared allowlist and safe URLs land.
 */
export function writeBoundValue(el: Element, property: string, value: string, richtext = false): void {
  if (!value) {
    if (property === "content") el.textContent = "";
    else if (property === "src" || property === "href") el.removeAttribute(property);
    else if (property === "alt" || property === "title") el.setAttribute(property, "");
    return;
  }
  if (!isSafeCmsBoundValue(property, value)) return;
  /* A rich text field fills an element with its markup, cut to the shared
     allow-list — as text it showed its own tags. */
  if (property === "content" && richtext) el.innerHTML = sanitizeRichtext(value);
  else if (property === "content") el.textContent = value;
  else el.setAttribute(property, value);
}

/** The keys of a collection's rich text fields. */
export function richtextKeys(fields: ReadonlyArray<{ slug: string; type: string }> | undefined): ReadonlySet<string> {
  return new Set((fields ?? []).filter((f) => f.type === "richtext").map((f) => f.slug));
}

/** Canvas keeps the template editable: record 0 renders INTO the real
 *  children (ids intact, so selection and overlays still find them), later
 *  records are clones marked `data-cms-repeater-clone`, and a list with no
 *  records keeps its template. Export renders every record and drops it. */
export interface CollectionListExpandOptions {
  canvas?: boolean;
}

/** A reference field's target records by id (and the target collection, for
 *  the record's display name). */
type ReferenceTables = Map<string, { collection: { displayField?: string; fields: Array<{ slug: string }> }; byId: Map<string, CMSContentItem> }>;

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
   * Expand every Collection list (a `repeat: "children"` binding) in `doc`.
   * Returns false, having touched nothing, when there is none — so a page
   * without one serializes exactly as before.
   */
  async expandCollectionLists(doc: Document, options: CollectionListExpandOptions = {}): Promise<boolean> {
    const bindings = this.composer.cms?.bindings;
    if (!bindings || !this.composer.cms.collections) return false;
    const lists = bindings.getAllCollectionBindings().filter((b) => b.repeat === "children");
    if (lists.length === 0) return false;
    const byId = new Map(lists.map((b) => [b.elementId, b]));
    const targets = Array.from(doc.querySelectorAll("[data-buildrick-id]")).filter((el) =>
      byId.has(el.getAttribute("data-buildrick-id")!),
    ) as HTMLElement[];
    await Promise.all(
      targets.map((el) => this.expandChildren(el, byId.get(el.getAttribute("data-buildrick-id")!)!, options)),
    );
    return targets.length > 0;
  }

  private async expandChildren(
    listEl: HTMLElement,
    binding: CMSCollectionBinding,
    { canvas = false }: CollectionListExpandOptions,
  ): Promise<void> {
    /* The canvas shows drafts too — the author is building the list before
       publishing its records; export ships only what the binding's status allows. */
    const { items } = await this.composer.cms.collections.queryContent({
      collectionId: binding.collectionId,
      status: canvas || binding.status === "all" ? undefined : binding.status,
      /* No limit is "All" (BD-08): queryContent's own default is 50, so an
         "All" list silently stopped at 50. */
      limit: binding.limit || CMS_COLLECTION_LIMIT_MAX,
    });
    const refs = await this.referenceTables(binding.collectionId, canvas);
    const templates = Array.from(listEl.children) as HTMLElement[];
    const pristine = templates.map((t) => t.cloneNode(true) as HTMLElement);
    items.forEach((item, index) => {
      const context: RepeaterContext = {
        item,
        index,
        total: items.length,
        isFirst: index === 0,
        isLast: index === items.length - 1,
      };
      const intoTemplate = canvas && index === 0;
      const nodes = intoTemplate ? templates : pristine.map((t) => t.cloneNode(true) as HTMLElement);
      for (const node of nodes) {
        this.applyContext(node, context, binding, null, refs);
        this.applyCurrentItem(node, listEl, item, binding.collectionId, canvas);
        if (intoTemplate) continue;
        if (canvas) node.setAttribute("data-cms-repeater-clone", String(index));
        else this.clearUnresolved(node, binding.itemVar || "item");
        listEl.appendChild(node);
      }
    });
    if (!canvas) templates.forEach((t) => t.remove());
  }

  /**
   * "Current item" (C0.8, BD-01): a field binding with no pinned record on an
   * element in this list's copy, bound to the list's own collection, reads
   * THIS copy's record. Resolved page-wide instead, every copy showed the
   * same record. An element inside a nested list belongs to that list.
   * The canvas keeps an element's own text when the record has no value
   * (as the page-wide preview does); the export writes the fallback, or
   * nothing (C0.7).
   */
  private applyCurrentItem(
    node: HTMLElement,
    listEl: HTMLElement,
    item: CMSContentItem,
    collectionId: string,
    canvas: boolean,
  ): void {
    const bindings = this.composer.cms.bindings;
    const rich = richtextKeys(this.composer.cms.collections?.getCollection?.(collectionId)?.fields);
    const isList = (el: Element) => bindings.getCollectionBinding?.(el.getAttribute("data-buildrick-id") ?? "")?.repeat === "children";
    const candidates = [node, ...Array.from(node.querySelectorAll<HTMLElement>("[data-buildrick-id]"))];
    for (const el of candidates) {
      const own = (bindings.getBindings?.(el.getAttribute("data-buildrick-id") ?? "") ?? []).filter((b) => b.collectionId === collectionId && followsContextRecord(b));
      if (own.length === 0) continue;
      let nested = false;
      for (let up = el.parentElement; up && up !== listEl; up = up.parentElement) {
        if (isList(up)) nested = true;
      }
      if (nested) continue;
      for (const b of own) {
        const value = cmsTextOf(item.data[b.fieldSlug]) || b.fallback || "";
        if (canvas && !value) continue;
        writeBoundValue(el, b.property, value, rich.has(b.fieldSlug));
      }
      el.setAttribute(CURRENT_ITEM_ATTR, collectionId);
      if (canvas) el.setAttribute("data-cms-bound", "true");
    }
  }

  /** A published page never shows `{{item.x}}` for a field the record does
   *  not have — the canvas keeps it visible so the author can re-aim it. */
  private clearUnresolved(el: HTMLElement, itemVar: string): void {
    const pattern = new RegExp(`\\{\\{\\s*${itemVar}\\.[\\w.-]+\\s*\\}\\}`, "g");
    const walker = (el.ownerDocument ?? document).createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent && pattern.test(node.textContent)) node.textContent = node.textContent.replace(pattern, "");
      pattern.lastIndex = 0;
    }
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
      /* No limit is "All" (BD-08): queryContent's own default is 50, so an
         "All" list silently stopped at 50. */
      limit: binding.limit || CMS_COLLECTION_LIMIT_MAX,
    });
    const refs = await this.referenceTables(binding.collectionId, false);

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
      this.applyContext(clonedEl, context, binding, `${originalId}-${index}`, refs);

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
   * The records each Reference field of `collectionId` points at (PD-1), so a
   * copy can read `{{item.author.name}}`. The canvas reads any status; an
   * export only published records — a draft author publishes as nothing.
   */
  private async referenceTables(collectionId: string, canvas: boolean): Promise<ReferenceTables> {
    const tables: ReferenceTables = new Map();
    const cms = this.composer.cms.collections;
    for (const f of cms.getCollection?.(collectionId)?.fields ?? []) {
      if (f.type !== "reference" || !f.referenceCollection) continue;
      const target = cms.getCollection?.(f.referenceCollection);
      if (!target) continue;
      const items = (await cms.getContentItems(target.id)).filter((i) => canvas || i.status === "published");
      tables.set(f.slug, { collection: target, byId: new Map(items.map((i) => [i.id, i])) });
    }
    return tables;
  }

  /**
   * Apply item context to a cloned element using safe DOM methods
   */
  private applyContext(
    el: HTMLElement,
    context: RepeaterContext,
    binding: CMSCollectionBinding,
    /** The clone root's new id, or null to keep every id (Collection list
     *  copies share their template's ids — the breakpoint CSS selects on them). */
    cloneId: string | null,
    refs: ReferenceTables = new Map()
  ): void {
    const { item, index } = context;
    /* `{{item.<field>}}` reads the value; through a Reference field it reads
       the record it points at — `{{item.author}}` its name,
       `{{item.author.name}}` one of its fields. A deleted or unpublished
       target reads as nothing. */
    const refRecord = (field: string) => {
      const table = refs.get(field);
      const id = item.data[field];
      return table && typeof id === "string" ? table.byId.get(id) : undefined;
    };
    const valueOf = (field: string, sub?: string): string => {
      if (refs.has(field)) {
        const target = refRecord(field);
        if (!target) return "";
        return sub ? cmsTextOf(target.data[sub]) : cmsRecordLabel(refs.get(field)!.collection, target.data);
      }
      return sub ? "" : cmsTextOf(item.data[field]);
    };
    const pathPattern = new RegExp(`\\{\\{\\s*${binding.itemVar || "item"}\\.([\\w-]+)\\.([\\w-]+)\\s*\\}\\}`, "g");
    const rich = richtextKeys(this.composer.cms.collections?.getCollection?.(binding.collectionId)?.fields);
    const itemVar = binding.itemVar || "item";
    const indexVar = binding.indexVar || "index";

    if (cloneId) el.setAttribute("data-buildrick-id", cloneId);

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

      // A path through a Reference field (`{{item.author.name}}`).
      text = text.replace(pathPattern, (_m, field: string, sub: string) => {
        injectedValue = true;
        return escapeHtmlText(valueOf(field, sub));
      });

      // Replace item fields. The replacement is a function so a value
      // containing "$&", "$1", etc. is inserted verbatim rather than being
      // interpreted as a String.replace substitution pattern. The value is
      // HTML-escaped so any markup it carries is inert once injected below.
      Object.entries(item.data).forEach(([fieldName, value]) => {
        const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
        text = text.replace(fieldPattern, () => {
          injectedValue = true;
          /* Rich text lands as its allow-listed markup; anything else as
             escaped text. */
          return rich.has(fieldName) ? sanitizeRichtext(cmsTextOf(value)) : escapeHtmlText(valueOf(fieldName));
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
        // a live node. This is the sink escapeHtmlText exists to protect.
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

        if (pathPattern.test(value)) {
          value = value.replace(pathPattern, (_m, field: string, sub: string) => valueOf(field, sub));
          modified = true;
        }
        pathPattern.lastIndex = 0;

        // Replace item fields. Replacer function so a value containing "$&"
        // etc. is inserted literally. The value is set through setAttribute
        // (a DOM sink) and serialized by innerHTML on the way out, which
        // entity-encodes it — no manual escaping needed (and pre-escaping
        // here would double-encode the attribute).
        Object.keys(item.data).forEach((fieldName) => {
          const fieldPattern = new RegExp(`\\{\\{\\s*${itemVar}\\.${fieldName}\\s*\\}\\}`, "g");
          if (fieldPattern.test(value)) {
            value = value.replace(fieldPattern, () => valueOf(fieldName));
            modified = true;
          }
        });

        if (!modified) return;
        // A CMS value in a URL attribute: a javascript:/data: URL never lands.
        if (URL_ATTRIBUTES.has(attr.name.toLowerCase()) && isDangerousUrl(value)) {
          element.removeAttribute(attr.name);
          return;
        }
        element.setAttribute(attr.name, value);
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
