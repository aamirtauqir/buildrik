/**
 * CMS Binding Manager
 * Connects canvas elements to CMS collection content fields (collection + field selection).
 *
 * SCOPE — what this owns:
 *   - Mapping (collectionId, itemId | "context", fieldSlug) → element property
 *   - Repeater context resolution (when itemId === "context")
 *   - CMS-specific events (CMS collection updates, item edits)
 *
 * NOT COVERED:
 *   - Generic data source registration / resolution → DataManager
 *   - Style / attribute / text application for non-CMS bindings → Style/Trait/TextDataBinding
 *
 * Why split out from the data/* trio: CMS bindings have collection-aware semantics
 * (context vs explicit item, field schema, repeater iteration) that don't fit the
 * generic DataBinding shape. Keeping CMS as its own manager prevents leaking
 * collection concepts into the generic binding pipeline.
 *
 * @license BSD-3-Clause
 */

import type { CMSContentItem, CMSFieldType } from "../../shared/types/cms";
import { EVENTS } from "../../shared/constants/events";
import type { Composer } from "../Composer";
import { BaseBindingManager, type BindingWithData } from "../data/BaseBindingManager";
import type { CollectionManager } from "./CollectionManager";

/**
 * CMS element binding configuration
 */
export interface CMSElementBinding extends BindingWithData {
  /** Collection ID to bind from */
  collectionId: string;
  /** Specific content item ID, or 'context' for repeater context */
  itemId?: string;
  /** Field slug to bind */
  fieldSlug: string;
  /** Element property to bind (content, src, href, alt) */
  property: string;
  /** Fallback value if binding fails */
  fallback?: string;
}

/**
 * CMS collection binding for repeaters
 */
export interface CMSCollectionBinding {
  /** Element ID that serves as template */
  elementId: string;
  /** Collection to iterate */
  collectionId: string;
  /** Variable name for current item (default: 'item') */
  itemVar: string;
  /** Variable name for index (default: 'index') */
  indexVar?: string;
  /** Maximum items to render */
  limit?: number;
  /** Filter by status */
  status?: "published" | "draft" | "all";
  /** What repeats per record: the bound element itself (the original
   *  repeater, default) or its children (the Collection list element,
   *  G3-079 — the list stays one container, its children are the template). */
  repeat?: "self" | "children";
}

/** An element whose whole content is one `{{item.<field>}}` placeholder. */
const ITEM_PLACEHOLDER = /^\s*\{\{\s*item\.([\w-]+)\s*\}\}\s*$/;

/** Field types whose value reads as text in a placeholder. */
const TEXT_LIKE_FIELDS = new Set<CMSFieldType>(["text", "textarea", "richtext", "number", "select", "date", "datetime", "url", "email"]);

/**
 * CMS Binding Manager
 * Manages bindings between canvas elements and CMS content
 */
export class CMSBindingManager extends BaseBindingManager<CMSElementBinding> {
  private cmsManager: CollectionManager;
  private collectionBindings: Map<string, CMSCollectionBinding> = new Map();

  constructor(composer: Composer, cmsManager: CollectionManager) {
    super(composer);
    this.cmsManager = cmsManager;

    // Listen for CMS content changes
    this.cmsManager.on("content:created", () => this.reapplyAll());
    this.cmsManager.on("content:updated", () => this.reapplyAll());
    this.cmsManager.on("content:deleted", () => this.reapplyAll());
  }

  /**
   * Bind an element property to a CMS field
   */
  bindToField(
    elementId: string,
    collectionId: string,
    itemId: string | undefined,
    fieldSlug: string,
    property: string,
    fallback?: string
  ): void {
    const binding: CMSElementBinding = {
      binding: {
        sourceId: `cms:${collectionId}`,
        path: itemId ? `${itemId}.${fieldSlug}` : fieldSlug,
        type: "variable",
      },
      collectionId,
      itemId,
      fieldSlug,
      property,
      fallback,
    };

    this.bind(elementId, binding);
  }

  /**
   * Resolve a CMS binding to its actual value
   */
  async resolveBinding(binding: CMSElementBinding): Promise<string> {
    try {
      const { collectionId, itemId, fieldSlug, fallback } = binding;

      // If no itemId, we can't resolve (would need context)
      if (!itemId || itemId === "context") {
        return fallback || "";
      }

      // Get the content item. Only published records may resolve: static
      // resolution is the export default, so anything this returns ships to
      // the live site, and status is what the author's Published switch sets.
      // It is a three-value enum — "draft" and "archived" are both un-published,
      // so this asks for what IS published rather than excluding drafts.
      // A record that is not published takes the same exit as an unknown one
      // below: the author's fallback.
      const items = await this.cmsManager.queryContent({
        collectionId,
        status: "published",
        filter: {},
      });

      const item = items.items.find((i) => i.id === itemId);
      if (!item) {
        return fallback || "";
      }

      // Get the field value
      const value = item.data[fieldSlug];
      if (value === undefined || value === null) {
        return fallback || "";
      }

      return String(value);
    } catch {
      return binding.fallback || "";
    }
  }

  /**
   * Resolve binding with a specific context item (for repeaters)
   */
  async resolveBindingWithContext(
    binding: CMSElementBinding,
    contextItem: CMSContentItem
  ): Promise<string> {
    const { fieldSlug, fallback } = binding;

    const value = contextItem.data[fieldSlug];
    if (value === undefined || value === null) {
      return fallback || "";
    }

    return String(value);
  }

  /**
   * Apply binding to element
   */
  protected async applyBinding(elementId: string, binding: CMSElementBinding): Promise<void> {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return;

    const value = await this.resolveBinding(binding);

    /* The write below is a real project change — it must dirty the project
       and reach autosave — but it must NOT become an undo entry. Bindings live
       in a map outside the snapshot, so a history record of this write would
       be an entry that restores the text and not the binding: Undo would look
       armed, and undo nothing a user can see. That is exactly what was
       measured 2026-09-15: `bind()` had already declared the action
       unrecorded, then this write arrived, `markDirty` emitted
       PROJECT_CHANGED, HistoryManager recorded a normal patch, and the guard
       was silently re-armed 1000ms later. `runWithoutTracking` stops the
       recorder seeing this one emit while leaving the dirty flag and autosave
       untouched — they read the same event through their own listeners. */
    const write = () => {
      switch (binding.property) {
        case "content":
          element.setContent(value);
          break;
        case "src":
        case "href":
        case "alt":
        case "title":
          element.setTrait(binding.property, value);
          break;
        default:
          // For other properties, try setting as trait
          element.setTrait(binding.property, value);
      }
    };
    const history = this.composer.history;
    if (history?.runWithoutTracking) history.runWithoutTracking(write);
    else write();
  }

  /**
   * Get binding key for deduplication
   */
  protected getBindingKey(binding: CMSElementBinding): string {
    return `${binding.property}:${binding.collectionId}:${binding.fieldSlug}`;
  }

  /**
   * Reapply all bindings (called when CMS content changes)
   */
  private async reapplyAll(): Promise<void> {
    const exported = this.export();
    for (const elementId of Object.keys(exported)) {
      await this.applyAllBindings(elementId);
    }
  }

  // ============================================
  // Collection/Repeater Bindings
  // ============================================

  /**
   * Bind an element as a repeater for a collection
   */
  bindCollection(
    elementId: string,
    collectionId: string,
    options: Partial<Omit<CMSCollectionBinding, "elementId" | "collectionId">> = {}
  ): void {
    this.collectionBindings.set(elementId, {
      elementId,
      collectionId,
      itemVar: options.itemVar || "item",
      indexVar: options.indexVar || "index",
      limit: options.limit,
      status: options.status || "published",
      ...(options.repeat ? { repeat: options.repeat } : {}),
    });

    this.composer.markDirty();
    this.composer.emit(EVENTS.CMS_COLLECTION_BOUND, { elementId, collectionId });
  }

  /**
   * Bind a Collection list (G3-079): its children repeat once per record.
   * The starter `{{item.<field>}}` placeholders in the template that name no
   * field of this collection are pointed at fields it has — the display
   * field first, then its other text-like fields — so a fresh list shows the
   * records instead of blanks. Placeholders the author already aimed stay.
   */
  bindCollectionList(elementId: string, collectionId: string, options: { limit?: number } = {}): void {
    this.bindCollection(elementId, collectionId, { repeat: "children", limit: options.limit });
    const collection = this.cmsManager.getCollection(collectionId);
    const list = this.composer.elements.getElement(elementId);
    if (!collection || !list) return;
    const slugs = new Set(collection.fields.map((f) => f.slug));
    const placeholders = list.getDescendants().flatMap((el) => {
      const slug = ITEM_PLACEHOLDER.exec(el.getContent())?.[1];
      return slug ? [{ el, slug }] : [];
    });
    const used = new Set(placeholders.map((p) => p.slug).filter((slug) => slugs.has(slug)));
    const candidates = [
      collection.displayField,
      ...collection.fields.filter((f) => TEXT_LIKE_FIELDS.has(f.type)).map((f) => f.slug),
    ];
    const free = candidates.filter(
      (slug, i): slug is string => !!slug && slugs.has(slug) && !used.has(slug) && candidates.indexOf(slug) === i,
    );
    for (const { el, slug } of placeholders) {
      if (slugs.has(slug)) continue;
      const next = free.shift();
      if (!next) break;
      el.setContent(`{{item.${next}}}`);
    }
  }

  /**
   * Unbind a collection from an element
   */
  unbindCollection(elementId: string): void {
    if (this.collectionBindings.has(elementId)) {
      this.collectionBindings.delete(elementId);
      this.composer.markDirty();
      this.composer.emit(EVENTS.CMS_COLLECTION_UNBOUND, { elementId });
    }
  }

  /**
   * Get collection binding for an element
   */
  getCollectionBinding(elementId: string): CMSCollectionBinding | null {
    return this.collectionBindings.get(elementId) || null;
  }

  /**
   * Get all collection bindings
   */
  getAllCollectionBindings(): CMSCollectionBinding[] {
    return Array.from(this.collectionBindings.values());
  }

  /**
   * Check if element has collection binding
   */
  hasCollectionBinding(elementId: string): boolean {
    return this.collectionBindings.has(elementId);
  }

  /**
   * Export collection bindings for persistence
   */
  exportCollectionBindings(): Record<string, CMSCollectionBinding> {
    const exported: Record<string, CMSCollectionBinding> = {};
    for (const [elementId, binding] of this.collectionBindings) {
      exported[elementId] = binding;
    }
    return exported;
  }

  /**
   * Import collection bindings from persisted data
   */
  importCollectionBindings(data: Record<string, CMSCollectionBinding>): void {
    this.collectionBindings.clear();
    for (const [elementId, binding] of Object.entries(data)) {
      this.collectionBindings.set(elementId, binding);
    }
  }

  /**
   * Clean up on destroy
   */
  override destroy(): void {
    this.collectionBindings.clear();
    super.destroy();
  }
}
