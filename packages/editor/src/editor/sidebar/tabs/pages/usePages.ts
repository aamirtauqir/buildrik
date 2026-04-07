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
import { useToast } from "../../../../shared/ui/Toast";
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
            status: (p.settings?.visibility as PageItem["status"]) ?? "live",
            seo: p.settings?.seo,
            head: p.settings?.head,
          }))
        );
        setLoadError(null); // clear error on success
      } catch {
        setLoadError("Couldn't load your pages");
      }
    };
    sync();
    const evs = [
      EVENTS.PROJECT_CHANGED,
      "page:created",
      "page:deleted",
      "page:changed",
      "page:updated",
    ] as const;
    evs.forEach((ev) => composer.on(ev as string, sync));
    return () => evs.forEach((ev) => composer.off(ev as string, sync));
  }, [composer, retryKey]);

  // ── Close context menu on outside click ──────────────────────────────────
  React.useEffect(() => {
    if (!contextMenu) return;
    const handle = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".pg-ctx-menu")) return;
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
    composer.elements.createPage(name, { slug });
    setTimeout(() => {
      const all = composer.elements.getAllPages();
      const newest = all[all.length - 1];
      if (newest) setRenamingPageId(newest.id);
    }, 60);
  }, [composer, pages.length]);

  const selectPage = React.useCallback(
    (pageId: string) => {
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
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;
      const taken = new Set(pages.map((p) => p.slug));
      let slug = `${page.slug}-copy`;
      let n = 2;
      while (taken.has(slug)) slug = `${page.slug}-copy-${n++}`;
      composer.elements.createPage(`${page.name} Copy`, { slug });
      setContextMenu(null);
    },
    [composer, pages]
  );

  const deletePage = React.useCallback(
    (pageId: string) => {
      if (!composer) return;
      setContextMenu(null);
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      // Guard: last page
      if (pages.length <= 1) {
        addToast({ message: "Can't delete — your site needs at least 1 page", variant: "warning" });
        return;
      }
      // Guard: homepage
      if (page.isHome) {
        addToast({
          message: "Set another page as Homepage before deleting this one",
          variant: "warning",
        });
        return;
      }

      const name = page.name;
      composer.elements.deletePage(pageId);
      addToast({
        message: `"${name}" deleted`,
        variant: "info",
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
      if (page?.status === "external") {
        addToast({
          message: "External link pages can't be set as the homepage.",
          variant: "warning",
          duration: 4000,
        });
        setContextMenu(null);
        return;
      }
      composer?.elements.setHomePage?.(pageId);
      setContextMenu(null);
      addToast({
        message: "Homepage updated. Your navigation menu may need updating manually.",
        variant: "success",
        duration: 4000,
      });
    },
    [composer, pages, addToast]
  );

  const copyPageLink = React.useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      setContextMenu(null);
      if (!page) return;
      const slug = page.slug || page.id;
      const domain = (composer as { project?: { domain?: string } })?.project?.domain ?? null;
      const url = domain ? `https://${domain}/${slug}` : `https://yoursite.aquibra.io/${slug}`;
      navigator.clipboard
        .writeText(url)
        .then(() => {
          const msg = domain
            ? `Link copied: ${url}`
            : `Link copied: ${url} · Connect a custom domain in Settings →`;
          addToast({ message: msg, variant: "success", duration: 5000 });
        })
        .catch(() => {
          addToast({
            message: "Couldn't copy link — try again.",
            variant: "error",
            duration: 3000,
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
    isOnlyPage: pages.length <= 1,
    canSearch: pages.length >= 5,
    loadError,
    retrySync,
  };
}
