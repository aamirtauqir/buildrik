/**
 * useFolders — Sidebar-only page folder management.
 *
 * Folders are a UI organisational concept, NOT stored in the engine.
 * Persisted to localStorage keyed by composerId (or "default").
 *
 * Responsibilities:
 * - CRUD: create, rename, delete folder
 * - Membership: move page into folder, remove page from folder
 * - UI state: collapse/expand folder
 * - Cleanup: remove stale pageIds when pages are deleted
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FolderItem } from "./types";

const STORAGE_KEY_PREFIX = "pg-folders-v1-";

function storageKey(composerId: string | null): string {
  return STORAGE_KEY_PREFIX + (composerId ?? "default");
}

function load(composerId: string | null): FolderItem[] {
  try {
    const raw = localStorage.getItem(storageKey(composerId));
    if (!raw) return [];
    return JSON.parse(raw) as FolderItem[];
  } catch {
    return [];
  }
}

function persist(composerId: string | null, folders: FolderItem[]): void {
  try {
    localStorage.setItem(storageKey(composerId), JSON.stringify(folders));
  } catch {
    // localStorage quota — silently ignore, in-memory state still works
  }
}

function newId(): string {
  return "fld-" + Math.random().toString(36).slice(2, 9);
}

export interface UseFoldersReturn {
  folders: FolderItem[];
  /** pageId → folderId lookup (for quick membership check) */
  pageToFolder: Map<string, string>;

  createFolder: (name: string) => string;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  toggleCollapse: (folderId: string) => void;

  movePageToFolder: (pageId: string, folderId: string) => void;
  removePageFromFolder: (pageId: string) => void;

  /** Call when pages are deleted so stale refs are cleaned. */
  pruneDeletedPages: (livePageIds: Set<string>) => void;
}

export function useFolders(
  composerId: string | null,
  livePageIds: Set<string>
): UseFoldersReturn {
  const [folders, setFolders] = React.useState<FolderItem[]>(() =>
    load(composerId)
  );

  // Prune stale pageIds on mount and whenever livePageIds shrinks
  const liveRef = React.useRef(livePageIds);
  liveRef.current = livePageIds;

  React.useEffect(() => {
    setFolders((prev) => {
      const cleaned = prev.map((f) => ({
        ...f,
        pageIds: f.pageIds.filter((id) => liveRef.current.has(id)),
      }));
      // Skip re-render + write if nothing changed
      const changed = cleaned.some((f, i) => f.pageIds.length !== prev[i].pageIds.length);
      if (!changed) return prev;
      persist(composerId, cleaned);
      return cleaned;
    });
  }, [composerId, livePageIds.size]);

  const update = React.useCallback(
    (updater: (prev: FolderItem[]) => FolderItem[]) => {
      setFolders((prev) => {
        const next = updater(prev);
        persist(composerId, next);
        return next;
      });
    },
    [composerId]
  );

  const createFolder = React.useCallback(
    (name: string): string => {
      const id = newId();
      update((prev) => [...prev, { id, name: name.trim() || "Untitled Folder", pageIds: [], collapsed: false }]);
      return id;
    },
    [update]
  );

  const renameFolder = React.useCallback(
    (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      update((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f))
      );
    },
    [update]
  );

  const deleteFolder = React.useCallback(
    (folderId: string) => {
      update((prev) => prev.filter((f) => f.id !== folderId));
    },
    [update]
  );

  const toggleCollapse = React.useCallback(
    (folderId: string) => {
      update((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, collapsed: !f.collapsed } : f))
      );
    },
    [update]
  );

  const movePageToFolder = React.useCallback(
    (pageId: string, folderId: string) => {
      update((prev) =>
        prev.map((f) => {
          if (f.id === folderId) {
            // Add if not already present
            if (f.pageIds.includes(pageId)) return f;
            return { ...f, pageIds: [...f.pageIds, pageId] };
          }
          // Remove from any other folder
          return { ...f, pageIds: f.pageIds.filter((id) => id !== pageId) };
        })
      );
    },
    [update]
  );

  const removePageFromFolder = React.useCallback(
    (pageId: string) => {
      update((prev) =>
        prev.map((f) => ({ ...f, pageIds: f.pageIds.filter((id) => id !== pageId) }))
      );
    },
    [update]
  );

  const pruneDeletedPages = React.useCallback(
    (livePids: Set<string>) => {
      update((prev) =>
        prev.map((f) => ({ ...f, pageIds: f.pageIds.filter((id) => livePids.has(id)) }))
      );
    },
    [update]
  );

  const pageToFolder = React.useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    for (const f of folders) {
      for (const pid of f.pageIds) map.set(pid, f.id);
    }
    return map;
  }, [folders]);

  return {
    folders,
    pageToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    toggleCollapse,
    movePageToFolder,
    removePageFromFolder,
    pruneDeletedPages,
  };
}
