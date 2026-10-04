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
import { cmsRecordClash, cmsSlugField } from "@buildrik/shared/schemas/cms";
import { EVENTS } from "../../shared/constants/events";
import { EventEmitter } from "../EventEmitter";
import * as Storage from "./CollectionStorage";

/**
 * A record was published with field values its own collection forbids. Thrown
 * by `updateContentItem`, caught by the two record editors (Content panel,
 * CMS records modal) to mark the offending fields.
 */
export class CMSValidationError extends Error {
  constructor(readonly errors: Record<string, string>) {
    super(Object.values(errors).join(", "));
    this.name = "CMSValidationError";
  }
}

// ============================================
// Collection Manager Class
// ============================================

export class CollectionManager extends EventEmitter {
  private collections: Map<string, CMSCollection> = new Map();

  /**
   * The site this store belongs to. Null in the standalone demo, which has no
   * site and nothing to bleed into. Same defect and same remedy as
   * `MediaManager` — rows with no `siteId` stay visible, everything written
   * from here on carries one, and a server hydration stamps the site it came
   * from, so the bleed stops after one load per site with nothing disappearing.
   */
  private projectId: string | null = null;
  private contentCache: Map<string, CMSContentItem[]> = new Map();
  private initialized = false;
  /** Set by loadSnapshot: this store is exactly the snapshot, never IndexedDB. */
  private snapshotOnly = false;

  // ============================================
  // Initialization
  // ============================================

  /** Scope this store to a site and re-read what belongs to it. */
  async setProjectId(projectId: string): Promise<void> {
    if (this.projectId === projectId) return;
    this.projectId = projectId;
    if (this.initialized) await this.refreshFromStorage();
  }

  /** Another site's rows share this browser store; `siteId == null` predates
   *  scoping and survives on purpose. */
  private mine(collections: CMSCollection[]): CMSCollection[] {
    return this.projectId
      ? collections.filter((c) => c.siteId === this.projectId || c.siteId == null)
      : collections;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const collections = this.mine(await Storage.loadCollections());
    for (const collection of collections) {
      this.collections.set(collection.id, collection);
    }

    this.initialized = true;
  }

  /**
   * Make this store exactly `collections` + `items`, in memory, for a scratch
   * composer rendering a project it does not own (the /share draft). Nothing
   * is written to IndexedDB, and nothing is read from it afterwards — that
   * store is browser-global, and a visitor's own cache must never fill in a
   * binding the snapshot does not carry. Items keep the order given.
   */
  loadSnapshot(collections: CMSCollection[], items: CMSContentItem[]): void {
    this.snapshotOnly = true;
    this.initialized = true;
    this.collections = new Map(collections.map((c) => [c.id, c]));
    this.contentCache = new Map(collections.map((c) => [c.id, items.filter((i) => i.collectionId === c.id)]));
  }

  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Re-read the store after something outside this manager wrote to it.
   *
   * `initialize()` reads IndexedDB once and latches. The server hydration
   * (`cmsSync.hydrateCmsFromServer`) writes collections and entries straight
   * into that store — so on a device that has never opened this site, the
   * site's collections landed in IndexedDB and this manager stayed empty for
   * the whole session: the Content panel showed none, the binding popover had
   * nothing to bind to, and `hasProductsCollection()` answered false, which
   * offers to create a SECOND Products collection and mirrors the duplicate
   * back to the server.
   */
  async refreshFromStorage(): Promise<void> {
    const collections = this.mine(await Storage.loadCollections());
    this.collections = new Map(collections.map((c) => [c.id, c]));
    this.contentCache.clear();
    this.initialized = true;
    this.emit(EVENTS.CMS_STORE_REFRESHED, this.getAllCollections());
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
      id: this.nextId(),
      name,
      slug: slug || this.slugify(name),
      description,
      fields: [],
      createdAt: now,
      updatedAt: now,
    };

    await Storage.saveCollection(this.projectId ? { ...collection, siteId: this.projectId } : collection);
    this.collections.set(collection.id, collection);
    this.emit(EVENTS.CMS_COLLECTION_CREATED, collection);

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

    await Storage.saveCollection(this.projectId ? { ...updated, siteId: this.projectId } : updated);
    this.collections.set(id, updated);
    this.emit(EVENTS.CMS_COLLECTION_UPDATED, updated);

    return updated;
  }

  async deleteCollection(id: string): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.collections.has(id)) return false;

    await Storage.deleteCollection(id);
    this.collections.delete(id);
    this.contentCache.delete(id);
    this.emit(EVENTS.CMS_COLLECTION_DELETED, id);

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
      id: this.nextId(),
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

    const previous = collection.fields[fieldIndex];
    const updatedField = { ...previous, ...updates };
    const updatedFields = [...collection.fields];
    updatedFields[fieldIndex] = updatedField;

    /* A new key moves every record's value to it — records store data by
       key, so an unmigrated rename would orphan them all — and follows into
       the two places the collection names a field by key. Each moved record
       is emitted so the server mirror moves it too; before, only the local
       copy moved (DM-02). */
    const renamed = updates.slug !== undefined && updates.slug !== previous.slug;
    const keyed: Partial<CMSCollection> = {};
    if (renamed) {
      const from = previous.slug;
      const to = updatedField.slug;
      for (const item of await Storage.loadContentItems(collectionId)) {
        if (!(from in item.data)) continue;
        const { [from]: value, ...rest } = item.data;
        const moved = { ...item, data: { ...rest, [to]: value }, updatedAt: new Date().toISOString() };
        await Storage.saveContentItem(moved);
        this.emit(EVENTS.CMS_CONTENT_UPDATED, moved);
      }
      this.invalidateContentCache(collectionId);
      if (collection.pageSlugPattern) keyed.pageSlugPattern = collection.pageSlugPattern.split(`{${from}}`).join(`{${to}}`);
      if (collection.displayField === from) keyed.displayField = to;
    }

    await this.updateCollection(collectionId, { fields: updatedFields, ...keyed });

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
    data: Record<string, unknown> = {},
    options: {
      /** Created straight into this status — a new record saved as Published
         is ONE write, checked before it exists. Created as a draft and then
         published, a refused publish left the draft behind and every retry
         made another (CMS-01), and the server could see the draft last (RT-02). */
      status?: CMSContentItem["status"];
      /** An id the caller reserved with `nextId()` — the record sheet marks
         it for its own mirror before the create's event fires. */
      id?: string;
    } = {}
  ): Promise<CMSContentItem | null> {
    const status = options.status ?? "draft";
    await this.ensureInitialized();

    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const now = new Date().toISOString();
    const item: CMSContentItem = {
      id: options.id ?? this.nextId(),
      collectionId,
      data,
      status,
      createdAt: now,
      updatedAt: now,
      ...(status === "published" ? { publishedAt: now } : {}),
    };
    if (status === "published") await this.assertPublishable(item);

    await Storage.saveContentItem(item);
    this.invalidateContentCache(collectionId);
    this.emit(EVENTS.CMS_CONTENT_CREATED, item);

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

    /* Publishing is where the collection's own rules start to matter.
       `validateContent` was written with the schemas and then called by
       nothing, so "Validation rules included" (the ecommerce setup modal) and
       the "required" tag beside a field in the Content panel described checks
       that never ran: a Product could go live with no Name, no Price and a
       negative Inventory. Drafts stay free-form on purpose — an unfinished
       record is the point of a draft. */
    if (updated.status === "published") await this.assertPublishable(updated);

    // Handle publish/unpublish
    if (updates.status === "published" && existing.status !== "published") {
      updated.publishedAt = updated.updatedAt;
    }

    await Storage.saveContentItem(updated);
    this.invalidateContentCache(existing.collectionId);

    if (updates.status === "published" && existing.status !== "published") {
      this.emit(EVENTS.CMS_CONTENT_PUBLISHED, updated);
      /* `updates.status !== "published"` was true when `updates` carried no
         status key at all, because `undefined !== "published"`. So every
         ordinary data-only edit to a live record emitted `unpublished` rather
         than `updated` — and the two canvas refresh paths
         (CMSBindingManager.ts:75-77, useCMSPreview.ts:123-124) subscribe only
         to created/updated/deleted, so the canvas went stale whenever anyone
         edited the text of a published record. Only an explicit status change
         away from published is an unpublish. */
    } else if (
      updates.status !== undefined &&
      updates.status !== "published" &&
      existing.status === "published"
    ) {
      this.emit(EVENTS.CMS_CONTENT_UNPUBLISHED, updated);
    } else {
      this.emit(EVENTS.CMS_CONTENT_UPDATED, updated);
    }

    return updated;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const existing = await Storage.loadContentItem(id);
    if (!existing) return false;

    await Storage.deleteContentItem(id);
    this.invalidateContentCache(existing.collectionId);
    this.emit(EVENTS.CMS_CONTENT_DELETED, id, existing.collectionId);

    return true;
  }

  /* C0a (Task 5): drop a local row whose server copy is already gone, without
     firing CMS_*_DELETED — the sync layer called us, and the matching
     `_DELETED` listener would otherwise try to mirror a delete back to a row
     the server no longer holds. Storage is rewritten first so the in-memory
     cache is rebuilt from it; emits CMS_STORE_REFRESHED so any UI bound to
     that signal (Content panel, RecordsTable, binding popover) re-reads. */
  async forgetLocal(kind: "collection" | "entry", id: string): Promise<void> {
    if (kind === "collection") {
      await Storage.deleteCollection(id);
      this.collections.delete(id);
      this.contentCache.delete(id);
    } else {
      const existing = await Storage.loadContentItem(id);
      if (existing) {
        await Storage.deleteContentItem(id);
        this.invalidateContentCache(existing.collectionId);
      }
    }
    this.emit(EVENTS.CMS_STORE_REFRESHED);
  }

  async getContentItem(id: string): Promise<CMSContentItem | null> {
    return Storage.loadContentItem(id);
  }

  async getContentItems(collectionId: string): Promise<CMSContentItem[]> {
    const cached = this.contentCache.get(collectionId);
    if (cached) return cached;
    if (this.snapshotOnly) return [];

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

  /**
   * Throw `CMSValidationError` unless `item` may publish: the collection's
   * field rules (the shared validator — the server runs the same on its
   * PUBLISHED upsert) and its place among the other records — a slug no
   * other record holds (CMS-07), a page path that is neither empty nor
   * another published record's (BD-14).
   */
  private async assertPublishable(item: CMSContentItem): Promise<void> {
    // The collections map is the validator's source; a cold manager has an
    // empty one and would read as "Collection not found" on every publish.
    await this.ensureInitialized();
    const check = this.validateContent(item.collectionId, item.data);
    if (!check.valid) throw new CMSValidationError(check.errors);
    const collection = this.collections.get(item.collectionId);
    if (!collection) return;
    const peers = this.snapshotOnly ? [] : await Storage.loadContentItems(item.collectionId);
    const clash = cmsRecordClash(
      collection,
      item,
      peers.map((p) => ({ id: p.id, data: p.data, published: p.status === "published" })),
    );
    if (clash) throw new CMSValidationError({ [cmsSlugField(collection.fields)?.slug ?? "_record"]: clash });
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

  /** A fresh collection / field / record id. */
  nextId(): string {
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
