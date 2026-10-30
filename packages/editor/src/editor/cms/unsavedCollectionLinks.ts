/**
 * unsavedCollectionLinks — a collection page that was made but whose link
 * the server has not confirmed (design-2l9 187:21035 / 187:22071). Held
 * outside the Dynamic pages tab so the state survives leaving it: the tab
 * shows "Page created, link not saved" when it comes back, and the page
 * itself can say "Collection link not saved · Retry in CMS ›" (Inspector,
 * L-B — REQUESTS A-26). Session-only, like the retry queue it mirrors; the
 * outbox still replays the write on reconnect.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export interface UnsavedCollectionLink {
  collectionId: string;
  collectionName: string;
  pageId: string;
  name: string;
  file: string;
  pattern: string;
}

let byCollection = new Map<string, UnsavedCollectionLink>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const unsavedCollectionLinks = {
  set(link: UnsavedCollectionLink): void {
    byCollection = new Map(byCollection).set(link.collectionId, link);
    emit();
  },
  clear(collectionId: string): void {
    if (!byCollection.has(collectionId)) return;
    byCollection = new Map(byCollection);
    byCollection.delete(collectionId);
    emit();
  },
  forCollection: (collectionId: string): UnsavedCollectionLink | null => byCollection.get(collectionId) ?? null,
  /** For the page's own notice: the collection whose link to it is unsaved. */
  forPage: (pageId: string): UnsavedCollectionLink | null => [...byCollection.values()].find((l) => l.pageId === pageId) ?? null,
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Tests only. */
  reset(): void {
    byCollection = new Map();
    emit();
  },
};

export function useUnsavedCollectionLink(collectionId: string): UnsavedCollectionLink | null {
  return React.useSyncExternalStore(
    unsavedCollectionLinks.subscribe,
    () => unsavedCollectionLinks.forCollection(collectionId),
    () => unsavedCollectionLinks.forCollection(collectionId),
  );
}
