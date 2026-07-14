/**
 * usePages — Single source of all Pages Tab business logic.
 *
 * Responsibilities:
 * - Sync pages list from composer (ONE source of truth)
 * - Page CRUD: add, rename, duplicate, delete, set homepage
 * - Context menu state
 * - Rename inline state
 * - Settings drawer open/close
 * - Guards: homepage deletion, last-page deletion
 *
 * Does NOT contain:
 * - Any JSX / render logic
 * - Settings form state (→ settings/usePageSettings.ts)
 * - Slug utils (→ utils/slug.ts)
 * - SEO score calc (→ utils/seoScore.ts)
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "../../../../shared/constants/events";
import { useToast } from "@/editor/shared/vibcoder";
import { getDefaultPageName } from "../../../../shared/utils/pageUtils";
import type { PageItem } from "./types";

interface ContextMenuState {
  pageId: string;
  x: number;
  y: number;
}

export interface UsePagesReturn {
  // Data
  pages: PageItem[];
  activePageId: string | null;

  // Rename state
  renamingPageId: string | null;
  startRename: (pageId: string) => void;
  commitRename: (pageId: string, name: string) => void;
  cancelRename: () => void;

  // Context menu state
  contextMenu: ContextMenuState | null;
  openContextMenu: (pageId: string, x: number, y: number) => void;
  closeContextMenu: () => void;

  // Settings drawer
  settingsPageId: string | null;
  openSettings: (pageId: string) => void;
  closeSettings: () => void;

  // Actions (all guard-checked)
  addPage: () => void;
  selectPage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  setHomepage: (pageId: string) => void;
  copyPageLink: (pageId: string) => void;

  // Derived
  isOnlyPage: boolean;
  canSearch: boolean;

  // Error state
  loadError: string | null;
  retrySync: () => void;
}

export function usePages(composer: Composer | null): UsePagesReturn {
  const { addToast } = useToast();
  const [pages, setPages] = React.useState<PageItem[]>([]);
  const [activePageId, setActivePageId] = React.useState<string | null>(null);
  const [renamingPageId, setRenamingPageId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [settingsPageId, setSettingsPageId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);

  // ── Sync from composer ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => {
      try {
        const raw = composer.elements.getAllPages();
        const active = composer.elements.getActivePage();
        setActivePageId(active?.id ?? null);
        setPages(
          raw.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug ?? p.name?.toLowerCase().replace(/\s+/g, "-") ?? p.id,
            route: (
              composer as { router?: { getPath?: (id: string) => string | undefined } }
            ).router?.getPath?.(p.id),
            isHome: p.isHome,
            isActive: p.id === active?.id,
            // Default to "draft" when visibility is unset (CAN-013).
            // A new page can't be Live before the project is published —
            // the top-bar Publish button correctly shows "Draft" in that
            // state, so the per-page badge must match.
            status: (p.settings?.visibility as PageItem["status"]) ?? "draft",
            seo: p.settings?.seo,
            head: p.settings?.head,
            updatedAt: p.updatedAt,
          }))
        );
        setLoadError(null); // clear error on success
      } catch {
        setLoadError("Couldn't load your pages");
      }
    };
    sync();
    // Filter PROJECT_CHANGED by payload.type so element-level edits (e.g.
    // canvas drag-resize spamming 60 events/sec) don't trigger a full page
    // list re-sync. Only page:* mutations need to refresh the list.
    // This was a real perf bottleneck flagged in the prior audit (B2):
    // the four legacy string-literal events were NEVER emitted — only
    // PROJECT_CHANGED fires — so we subscribe once and filter by type.
    const handler = (payload?: { type?: string }) => {
      if (!payload?.type || payload.type.startsWith("page:")) sync();
    };
    composer.on(EVENTS.PROJECT_CHANGED, handler);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, handler);
    };
  }, [composer, retryKey]);

  // ── Close context menu on outside click ──────────────────────────────────
  React.useEffect(() => {
    if (!contextMenu) return;
    const handle = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".bd-pg-menu")) return;
      setContextMenu(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [contextMenu]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const addPage = React.useCallback(() => {
    if (!composer) return;
    const name = getDefaultPageName(pages);
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    try {
      // Use createPage's synchronous return value directly. The previous
      // setTimeout(60) + getAllPages().last() pattern broke when pages are
      // prepended instead of appended and when PROJECT_CHANGED fired twice
      // in a tick.
      const newest = composer.elements.createPage(name, { slug });
      // PageRow owns focus: when it mounts with isRenaming=true, its own
      // effect selects + focuses the input. No rAF needed here — that was
      // a timing race when the row hadn't mounted within one frame.
      if (newest) setRenamingPageId(newest.id);
    } catch (err) {
      addToast({
        description: "Couldn't add page right now. Try again.",
        tone: "error",
        duration: 4000,
      });
      console.error("[pages] addPage failed", err);
    }
  }, [composer, pages.length, addToast]);

  const selectPage = React.useCallback(
    (pageId: string) => {
      setContextMenu(null);
      composer?.elements.setActivePage(pageId);
    },
    [composer]
  );

  const startRename = React.useCallback((pageId: string) => {
    setRenamingPageId(pageId);
    setContextMenu(null);
  }, []);

  const commitRename = React.useCallback(
    (pageId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed && composer) {
        composer.elements.updatePage(pageId, { name: trimmed });
      }
      setRenamingPageId(null);
    },
    [composer]
  );

  const cancelRename = React.useCallback(() => {
    setRenamingPageId(null);
  }, []);

  const duplicatePage = React.useCallback(
    (pageId: string) => {
      if (!composer) return;
      setContextMenu(null);
      try {
        // Delegate to the engine's real duplicate — deep clone, fresh IDs,
        // smart copy-suffix naming. Previously this built an EMPTY page with
        // a "Copy" name (feature-theater bug A1 from prior audit).
        const copy = composer.elements.duplicatePage(pageId);
        if (!copy) {
          addToast({
            description: "Couldn't duplicate — source page not found.",
            tone: "warning",
            duration: 3000,
          });
        }
      } catch (err) {
        addToast({
          description: "Duplicate failed — page may have corrupt content.",
          tone: "error",
          duration: 4000,
        });
        console.error("[pages] duplicatePage failed", err);
      }
    },
    [composer, addToast]
  );

  const deletePage = React.useCallback(
    (pageId: string) => {
      if (!composer) return;
      setContextMenu(null);
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      // Guard: last page
      if (pages.length <= 1) {
        addToast({ description: "Can't delete — your site needs at least 1 page", tone: "warning" });
        return;
      }
      // Guard: homepage
      if (page.isHome) {
        addToast({
          description: "Set another page as Homepage before deleting this one",
          tone: "warning",
        });
        return;
      }

      const name = page.name;
      composer.elements.deletePage(pageId);
      addToast({
        description: `"${name}" deleted`,
        tone: "info",
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => {
            composer.history?.undo?.();
          },
        },
      });
    },
    [composer, pages, addToast]
  );

  const setHomepage = React.useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      setContextMenu(null);
      if (page?.status === "external") {
        addToast({
          description: "External link pages can't be set as the homepage.",
          tone: "warning",
          duration: 4000,
        });
        return;
      }
      if (!composer) return;
      try {
        composer.elements.setHomePage?.(pageId);
        addToast({
          description: "Homepage updated. Your navigation menu may need updating manually.",
          tone: "success",
          duration: 4000,
        });
      } catch (err) {
        addToast({
          description: "Couldn't update homepage. Try again.",
          tone: "error",
          duration: 4000,
        });
        console.error("[pages] setHomepage failed", err);
      }
    },
    [composer, pages, addToast]
  );

  const copyPageLink = React.useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      setContextMenu(null);
      if (!page) return;
      const slug = page.slug || page.id;
      // A4: read real domain from ProjectData metadata. Was previously cast
      // from a nonexistent `composer.project.domain`, always undefined.
      const domain = composer?.getProjectMetadata?.()?.domain ?? null;

      // No domain means there is no link yet. Copying a made-up one (this used to
      // hand out `yoursite.aquibra.io/<slug>` — a host from the project this was
      // forked from) puts a dead URL in the user's clipboard, which is worse than
      // telling them there isn't one.
      if (!domain) {
        addToast({
          title: "No address yet",
          description: "Connect a custom domain in Settings, or publish the site first.",
          tone: "info",
        });
        return;
      }

      const url = `https://${domain}/${slug}`;
      const successMsg = `Link copied: ${url}`;

      // A8: navigator.clipboard is undefined in non-secure contexts (http://,
      // some iframes). Fall back to a toast that shows the URL so the user
      // can copy manually, instead of throwing TypeError.
      if (!navigator.clipboard?.writeText) {
        addToast({
          description: `Copy manually: ${url}`,
          tone: "info",
          duration: 8000,
        });
        return;
      }

      navigator.clipboard
        .writeText(url)
        .then(() => addToast({ description: successMsg, tone: "success", duration: 5000 }))
        .catch(() => {
          addToast({
            description: `Couldn't copy. Link: ${url}`,
            tone: "error",
            duration: 8000,
          });
        });
    },
    [composer, pages, addToast]
  );

  const retrySync = React.useCallback(() => {
    setRetryKey((k) => k + 1);
  }, []);

  const openContextMenu = React.useCallback((pageId: string, x: number, y: number) => {
    setContextMenu({ pageId, x, y });
  }, []);

  const closeContextMenu = React.useCallback(() => {
    setContextMenu(null);
  }, []);

  const openSettings = React.useCallback((pageId: string) => {
    setSettingsPageId(pageId);
    setContextMenu(null);
    setRenamingPageId(null);
  }, []);

  const closeSettings = React.useCallback(() => {
    setSettingsPageId(null);
  }, []);

  return {
    pages,
    activePageId,
    renamingPageId,
    startRename,
    commitRename,
    cancelRename,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    settingsPageId,
    openSettings,
    closeSettings,
    addPage,
    selectPage,
    duplicatePage,
    deletePage,
    setHomepage,
    copyPageLink,
    // Guards against deleting the final page. Semantically the "only" page is
    // exactly 1 — 0 pages is a different (empty-list) state handled by PageList.
    isOnlyPage: pages.length === 1,
    canSearch: pages.length >= 5,
    loadError,
    retrySync,
  };
}
