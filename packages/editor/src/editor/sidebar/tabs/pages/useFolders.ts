/**
 * useFolders — the Pages panel's PERSONAL page folders.
 *
 * Folders are a UI organisational concept, NOT stored in the engine: they are
 * this user's own grouping of the site's (shared) pages. With a site open they
 * live on the server (`pages.folders.*`, per user × site, via
 * PageFolderService) and follow the user across devices; they used to live in
 * this browser's localStorage only. localStorage stays as the offline/demo
 * copy: the panel paints from it at once, then the server's answer replaces it.
 * A site's folders that exist only in this browser (created before the server
 * store) are uploaded once, on the first load that finds none on the server.
 *
 * Every change is applied locally first and then sent; ids of folders created
 * this session are temporary until the server answers, and calls naming one
 * wait for its real id. A failed call re-reads the server's state.
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
import { pageFolderRemote } from "@/services/PageFolderService";

const STORAGE_KEY_PREFIX = "pg-folders-v1-";

const LEGACY_SHARED_KEY = STORAGE_KEY_PREFIX + "default";

function storageKey(siteId: string | null): string {
  return STORAGE_KEY_PREFIX + (siteId ?? "default");
}

function load(siteId: string | null): FolderItem[] {
  try {
    const key = storageKey(siteId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as FolderItem[];
    /* Whatever a user arranged before the key was site-scoped sits under the
       shared blob. It is MOVED to the first site that asks for it, never
       copied: a copy would hand the same folders to every site opened after,
       which is the bug this fixes. Sites opened later start empty, which is
       the truth about folders they never had. */
    if (key === LEGACY_SHARED_KEY) return [];
    const legacy = localStorage.getItem(LEGACY_SHARED_KEY);
    if (!legacy) return [];
    const adopted = JSON.parse(legacy) as FolderItem[];
    localStorage.setItem(key, legacy);
    localStorage.removeItem(LEGACY_SHARED_KEY);
    return adopted;
  } catch {
    return [];
  }
}

function persist(siteId: string | null, folders: FolderItem[]): void {
  try {
    localStorage.setItem(storageKey(siteId), JSON.stringify(folders));
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
  siteId: string | null,
  livePageIds: Set<string>
): UseFoldersReturn {
  const [folders, setFolders] = React.useState<FolderItem[]>(() =>
    load(siteId)
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
      persist(siteId, cleaned);
      return cleaned;
    });
  }, [siteId, livePageIds.size]);

  const update = React.useCallback(
    (updater: (prev: FolderItem[]) => FolderItem[]) => {
      setFolders((prev) => {
        const next = updater(prev);
        persist(siteId, next);
        return next;
      });
    },
    [siteId]
  );

  /* ── Server sync ─────────────────────────────────────────────────────── */
  /** temp id (created this session) → the server's id, once it answers. */
  const serverIds = React.useRef(new Map<string, Promise<string | null>>());
  const resolveId = React.useCallback(
    (id: string) => serverIds.current.get(id) ?? Promise.resolve(id),
    []
  );

  const adopt = React.useCallback(
    (serverFolders: FolderItem[]) => {
      setFolders(serverFolders);
      persist(siteId, serverFolders);
    },
    [siteId]
  );

  const reload = React.useCallback(() => {
    if (!siteId) return;
    void pageFolderRemote.list(siteId).then((list) => {
      if (list) adopt(list);
    });
  }, [siteId, adopt]);

  /** Send a change; a refusal or failure re-reads the server's truth. */
  const send = React.useCallback(
    (call: () => Promise<unknown>) => {
      if (!siteId) return;
      void call().then((ok) => {
        if (ok === null) reload();
      });
    },
    [siteId, reload]
  );

  React.useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    void (async () => {
      const list = await pageFolderRemote.list(siteId);
      if (cancelled || !list) return; // offline / demo: keep the local copy
      const local = load(siteId);
      if (list.length > 0 || local.length === 0) {
        adopt(list);
        return;
      }
      // One-time upload of folders that only ever lived in this browser.
      for (const folder of local) {
        const created = await pageFolderRemote.create(siteId, folder.name);
        if (!created) return; // try again next load; local copy untouched
        for (const pageId of folder.pageIds) {
          await pageFolderRemote.movePage(siteId, pageId, created.id);
        }
        if (folder.collapsed) await pageFolderRemote.update(created.id, { collapsed: true });
      }
      const uploaded = await pageFolderRemote.list(siteId);
      if (!cancelled && uploaded) adopt(uploaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId, adopt]);

  const createFolder = React.useCallback(
    (name: string): string => {
      const id = newId();
      const finalName = name.trim() || "Untitled Folder";
      update((prev) => [...prev, { id, name: finalName, pageIds: [], collapsed: false }]);
      if (siteId) {
        const created = pageFolderRemote.create(siteId, finalName).then((folder) => {
          if (!folder) {
            reload();
            return null;
          }
          update((prev) => prev.map((f) => (f.id === id ? { ...f, id: folder.id } : f)));
          return folder.id;
        });
        serverIds.current.set(id, created);
      }
      return id;
    },
    [update, siteId, reload]
  );

  const renameFolder = React.useCallback(
    (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      update((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f))
      );
      send(async () => {
        const id = await resolveId(folderId);
        return id ? pageFolderRemote.update(id, { name: trimmed }) : null;
      });
    },
    [update, send, resolveId]
  );

  const deleteFolder = React.useCallback(
    (folderId: string) => {
      update((prev) => prev.filter((f) => f.id !== folderId));
      send(async () => {
        const id = await resolveId(folderId);
        return id ? pageFolderRemote.remove(id) : null;
      });
    },
    [update, send, resolveId]
  );

  const foldersRef = React.useRef(folders);
  foldersRef.current = folders;

  const toggleCollapse = React.useCallback(
    (folderId: string) => {
      const collapsed = !foldersRef.current.find((f) => f.id === folderId)?.collapsed;
      update((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, collapsed } : f))
      );
      send(async () => {
        const id = await resolveId(folderId);
        return id ? pageFolderRemote.update(id, { collapsed }) : null;
      });
    },
    [update, send, resolveId]
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
      send(async () => {
        const id = await resolveId(folderId);
        return id && siteId ? pageFolderRemote.movePage(siteId, pageId, id) : null;
      });
    },
    [update, send, resolveId, siteId]
  );

  const removePageFromFolder = React.useCallback(
    (pageId: string) => {
      update((prev) =>
        prev.map((f) => ({ ...f, pageIds: f.pageIds.filter((id) => id !== pageId) }))
      );
      send(() => (siteId ? pageFolderRemote.movePage(siteId, pageId, null) : Promise.resolve(null)));
    },
    [update, send, siteId]
  );

  // Local only: the server drops deleted pages from its answer on read.
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
