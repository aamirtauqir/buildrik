/**
 * In-memory stand-in for engine/cms/CollectionStorage (IndexedDB).
 * jsdom ships no indexedDB; tests that exercise the real CollectionManager
 * swap the storage module for this map-backed twin via vi.mock.
 *
 * Mirrors the real module's observable contract: loadCollections sorts by
 * name, loadContentItems sorts by updatedAt desc, deleteCollection cascades
 * to its content items.
 *
 * @license BSD-3-Clause
 */
import { vi } from "vitest";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

export function createInMemoryCollectionStorage() {
  const collections = new Map<string, CMSCollection>();
  const content = new Map<string, CMSContentItem>();

  return {
    isStorageAvailable: vi.fn(() => true),

    saveCollection: vi.fn(async (collection: CMSCollection): Promise<void> => {
      collections.set(collection.id, { ...collection });
    }),

    loadCollections: vi.fn(async (): Promise<CMSCollection[]> => {
      return Array.from(collections.values()).sort((a, b) => a.name.localeCompare(b.name));
    }),

    loadCollection: vi.fn(async (id: string): Promise<CMSCollection | null> => {
      return collections.get(id) ?? null;
    }),

    loadCollectionBySlug: vi.fn(async (slug: string): Promise<CMSCollection | null> => {
      return Array.from(collections.values()).find((c) => c.slug === slug) ?? null;
    }),

    deleteCollection: vi.fn(async (id: string): Promise<void> => {
      collections.delete(id);
      for (const [key, item] of content) {
        if (item.collectionId === id) content.delete(key);
      }
    }),

    saveContentItem: vi.fn(async (item: CMSContentItem): Promise<void> => {
      content.set(item.id, { ...item });
    }),

    loadContentItems: vi.fn(async (collectionId: string): Promise<CMSContentItem[]> => {
      return Array.from(content.values())
        .filter((item) => item.collectionId === collectionId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }),

    loadContentItem: vi.fn(async (id: string): Promise<CMSContentItem | null> => {
      return content.get(id) ?? null;
    }),

    deleteContentItem: vi.fn(async (id: string): Promise<void> => {
      content.delete(id);
    }),

    deleteAllContentItems: vi.fn(async (collectionId: string): Promise<number> => {
      let deleted = 0;
      for (const [key, item] of content) {
        if (item.collectionId === collectionId) {
          content.delete(key);
          deleted++;
        }
      }
      return deleted;
    }),

    getContentCount: vi.fn(async (collectionId: string): Promise<number> => {
      return Array.from(content.values()).filter((item) => item.collectionId === collectionId)
        .length;
    }),

    /** Test-only: wipe both stores between tests. */
    __reset: () => {
      collections.clear();
      content.clear();
    },
  };
}
