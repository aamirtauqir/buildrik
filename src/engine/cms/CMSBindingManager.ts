/**
 * CMS Binding Manager
 * Connects canvas elements to CMS content fields
 * @license BSD-3-Clause
 */

import type { CMSContentItem } from "../../shared/types/cms";
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
}

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

      // Get the content item
      const items = await this.cmsManager.queryContent({
        collectionId,
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
    });

    this.composer.markDirty();
    this.composer.emit("cms:collection:bound", { elementId, collectionId });
  }

  /**
   * Unbind a collection from an element
   */
  unbindCollection(elementId: string): void {
    if (this.collectionBindings.has(elementId)) {
      this.collectionBindings.delete(elementId);
      this.composer.markDirty();
      this.composer.emit("cms:collection:unbound", { elementId });
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
