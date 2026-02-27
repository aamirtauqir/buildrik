/**
 * CMS Collection Manager
 * High-level API for managing CMS collections and content
 * @license BSD-3-Clause
 */

import type {
  CMSCollection,
  CMSContentItem,
  CMSField,
  CMSQueryOptions,
  CMSQueryResult,
} from "../../shared/types/cms";
import { validateFieldValue } from "../../shared/types/cms";
import { EventEmitter } from "../EventEmitter";
import * as Storage from "./CollectionStorage";

// ============================================
// Collection Manager Class
// ============================================

export class CollectionManager extends EventEmitter {
  private collections: Map<string, CMSCollection> = new Map();
  private contentCache: Map<string, CMSContentItem[]> = new Map();
  private initialized = false;

  // ============================================
  // Initialization
  // ============================================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const collections = await Storage.loadCollections();
    for (const collection of collections) {
      this.collections.set(collection.id, collection);
    }

    this.initialized = true;
  }

  isReady(): boolean {
    return this.initialized;
  }

  // ============================================
  // Collection Operations
  // ============================================

  async createCollection(
    name: string,
    slug?: string,
    description?: string
  ): Promise<CMSCollection> {
    await this.ensureInitialized();

    const now = new Date().toISOString();
    const collection: CMSCollection = {
      id: this.generateId(),
      name,
      slug: slug || this.slugify(name),
      description,
      fields: [],
      createdAt: now,
      updatedAt: now,
    };

    await Storage.saveCollection(collection);
    this.collections.set(collection.id, collection);
    this.emit("collection:created", collection);

    return collection;
  }

  async updateCollection(
    id: string,
    updates: Partial<Omit<CMSCollection, "id" | "createdAt">>
  ): Promise<CMSCollection | null> {
    await this.ensureInitialized();

    const existing = this.collections.get(id);
    if (!existing) return null;

    const updated: CMSCollection = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await Storage.saveCollection(updated);
    this.collections.set(id, updated);
    this.emit("collection:updated", updated);

    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.collections.has(id)) return false;

    await Storage.deleteCollection(id);
    this.collections.delete(id);
    this.contentCache.delete(id);
    this.emit("collection:deleted", id);

    return true;
  }

  getCollection(id: string): CMSCollection | null {
    return this.collections.get(id) || null;
  }

  getCollectionBySlug(slug: string): CMSCollection | null {
    for (const collection of this.collections.values()) {
      if (collection.slug === slug) return collection;
    }
    return null;
  }

  getAllCollections(): CMSCollection[] {
    return Array.from(this.collections.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ============================================
  // Field Operations
  // ============================================

  async addField(collectionId: string, field: Omit<CMSField, "id">): Promise<CMSField | null> {
    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const newField: CMSField = {
      ...field,
      id: this.generateId(),
    };

    const updatedFields = [...collection.fields, newField];
    await this.updateCollection(collectionId, { fields: updatedFields });

    return newField;
  }

  async updateField(
    collectionId: string,
    fieldId: string,
    updates: Partial<Omit<CMSField, "id">>
  ): Promise<CMSField | null> {
    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const fieldIndex = collection.fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return null;

    const updatedField = { ...collection.fields[fieldIndex], ...updates };
    const updatedFields = [...collection.fields];
    updatedFields[fieldIndex] = updatedField;

    await this.updateCollection(collectionId, { fields: updatedFields });

    return updatedField;
  }

  async deleteField(collectionId: string, fieldId: string): Promise<boolean> {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const updatedFields = collection.fields.filter((f) => f.id !== fieldId);
    if (updatedFields.length === collection.fields.length) return false;

    await this.updateCollection(collectionId, { fields: updatedFields });
    return true;
  }

  async reorderFields(collectionId: string, fieldIds: string[]): Promise<boolean> {
    const collection = this.collections.get(collectionId);
    if (!collection) return false;

    const fieldMap = new Map(collection.fields.map((f) => [f.id, f]));
    const reorderedFields = fieldIds
      .map((id, index) => {
        const field = fieldMap.get(id);
        if (!field) return null;
        return { ...field, order: index };
      })
      .filter((f): f is CMSField => f !== null);

    if (reorderedFields.length !== collection.fields.length) return false;

    await this.updateCollection(collectionId, { fields: reorderedFields });
    return true;
  }

  // ============================================
  // Content Operations
  // ============================================

  async createContentItem(
    collectionId: string,
    data: Record<string, unknown> = {}
  ): Promise<CMSContentItem | null> {
    await this.ensureInitialized();

    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const now = new Date().toISOString();
    const item: CMSContentItem = {
      id: this.generateId(),
      collectionId,
      data,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    await Storage.saveContentItem(item);
    this.invalidateContentCache(collectionId);
    this.emit("content:created", item);

    return item;
  }

  async updateContentItem(
    id: string,
    updates: Partial<Pick<CMSContentItem, "data" | "status">>
  ): Promise<CMSContentItem | null> {
    const existing = await Storage.loadContentItem(id);
    if (!existing) return null;

    const updated: CMSContentItem = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Handle publish/unpublish
    if (updates.status === "published" && existing.status !== "published") {
      updated.publishedAt = updated.updatedAt;
    }

    await Storage.saveContentItem(updated);
    this.invalidateContentCache(existing.collectionId);

    if (updates.status === "published" && existing.status !== "published") {
      this.emit("content:published", updated);
    } else if (updates.status !== "published" && existing.status === "published") {
      this.emit("content:unpublished", updated);
    } else {
      this.emit("content:updated", updated);
    }

    return updated;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const existing = await Storage.loadContentItem(id);
    if (!existing) return false;

    await Storage.deleteContentItem(id);
    this.invalidateContentCache(existing.collectionId);
    this.emit("content:deleted", id, existing.collectionId);

    return true;
  }

  async getContentItem(id: string): Promise<CMSContentItem | null> {
    return Storage.loadContentItem(id);
  }

  async getContentItems(collectionId: string): Promise<CMSContentItem[]> {
    const cached = this.contentCache.get(collectionId);
    if (cached) return cached;

    const items = await Storage.loadContentItems(collectionId);
    this.contentCache.set(collectionId, items);
    return items;
  }

  async queryContent(options: CMSQueryOptions): Promise<CMSQueryResult> {
    let items = await this.getContentItems(options.collectionId);

    // Filter by status
    if (options.status) {
      items = items.filter((item) => item.status === options.status);
    }

    // Apply custom filter
    if (options.filter) {
      items = items.filter((item) => {
        for (const [key, value] of Object.entries(options.filter!)) {
          if (item.data[key] !== value) return false;
        }
        return true;
      });
    }

    // Sort
    if (options.sort) {
      const { field, direction } = options.sort;
      items.sort((a, b) => {
        const aVal = a.data[field] ?? "";
        const bVal = b.data[field] ?? "";
        const cmp = String(aVal).localeCompare(String(bVal));
        return direction === "desc" ? -cmp : cmp;
      });
    }

    const total = items.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return {
      items: items.slice(offset, offset + limit),
      total,
      hasMore: offset + limit < total,
    };
  }

  // ============================================
  // Validation
  // ============================================

  validateContent(
    collectionId: string,
    data: Record<string, unknown>
  ): { valid: boolean; errors: Record<string, string> } {
    const collection = this.collections.get(collectionId);
    if (!collection) return { valid: false, errors: { _collection: "Collection not found" } };

    const errors: Record<string, string> = {};

    for (const field of collection.fields) {
      const result = validateFieldValue(field, data[field.slug]);
      if (!result.valid && result.error) {
        errors[field.slug] = result.error;
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  // ============================================
  // Helpers
  // ============================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.initialize();
  }

  private invalidateContentCache(collectionId: string): void {
    this.contentCache.delete(collectionId);
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

export default CollectionManager;
