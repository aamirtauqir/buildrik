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
import { useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { slugify } from "@shared/utils/helpers/string";
import type { PageItem, PageStatus } from "./types";
import { getSiteIdFromUrl, hasProjectLoaded } from "@/services/BuildrikSyncProvider";
import { useSiteOrigin } from "@/editor/shared/useSiteOrigin";
import { writeClipboardText } from "@buildrik/shared/browser/clipboard";
import { pageFileNames } from "@/engine/export/pageFiles";
import { pageCanonicalUrl } from "@buildrik/shared/seo/urls";
import { useActivePageId } from "@/editor/shared/useActivePageId";

/** A page's stored visibility → its panel status. Unset is "live" (what the
 *  deploy does with it). C4 #26: a "password" stored before Password pages
 *  were removed reads as "hidden" — it is unpublished, like a hidden page. */
const PAGE_STATUSES: ReadonlyArray<PageStatus> = ["live", "draft", "hidden", "scheduled", "error"];
function pageStatus(visibility: string | undefined): PageStatus {
  if (visibility === "password") return "hidden";
  return PAGE_STATUSES.find((s) => s === visibility) ?? "live";
}

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
  commitRename: (pageId: string, name: string, updateUrl?: boolean) => void;
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
  selectPage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  /** Bulk delete with one report (v3 4418:96537). Guards are the caller's. */
  deletePages: (pageIds: string[]) => void;
  setHomepage: (pageId: string) => void;
  copyPageLink: (pageId: string) => void;

  // Derived
  isOnlyPage: boolean;

  // Error state
  loadError: string | null;
  retrySync: () => void;
  /** The site's project is still on its way. An empty list means "not known
      yet", not "no pages" — see the state below. */
  loading: boolean;
}

export function usePages(composer: Composer | null): UsePagesReturn {
  const { addToast } = useToast();
  const [pageRows, setPages] = React.useState<PageItem[]>([]);
  /* `isActive` is derived from the one active-page source, not set inside
     the list sync — the list and the active id used to come from separate
     subscriptions and could disagree (DQ-013). */
  const activePageId = useActivePageId(composer);
  const pages = React.useMemo(
    () => pageRows.map((p) => ({ ...p, isActive: p.id === activePageId })),
    [pageRows, activePageId],
  );
  const [renamingPageId, setRenamingPageId] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<ContextMenuState | null>(null);
  const [settingsPageId, setSettingsPageId] = React.useState<string | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  /* A server-backed project syncs an EMPTY page list before `loadProject`
     resolves, and the panel read that as "no pages yet" and offered to create
     one. Accepting cost the user their work: the real project lands,
     `importProject` replaces the whole page set, the created page is gone and
     ⌘Z says "Nothing to undo" — unrecoverable. The list is only empty in the
     sense that nothing has answered yet.

     Seeded from the same registry the save boundary consults rather than from
     `false`, so a panel remounted after the load completes does not sit on a
     skeleton waiting for a PROJECT_LOADED that already fired. */
  const siteId = React.useMemo(() => getSiteIdFromUrl(), []);
  const [loaded, setLoaded] = React.useState(() => !siteId || hasProjectLoaded(siteId));
  const [retryKey, setRetryKey] = React.useState(0);
  const getSiteOrigin = useSiteOrigin(composer, siteId);

  // ── Sync from composer ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => {
      try {
        const raw = composer.elements.getAllPages();
        setPages(
          raw.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug ?? (p.name ? slugify(p.name) : undefined) ?? p.id,
            route: (
              composer as { router?: { getPath?: (id: string) => string | undefined } }
            ).router?.getPath?.(p.id),
            isHome: p.isHome,
            /* Unset visibility is "live", because that is what the deploy
               does with it: `isPageLive` (ExportEngine) ships a page whose
               settings say nothing, and nothing writes the field unless the
               user opens Advanced. This read "draft" (CAN-013) to match the
               top-bar Publish badge, but that badge is a SITE fact — the
               project has never been published — and a per-page field cannot
               carry it. The result was a page the panel called "Draft", in
               its chip and in PageRow's aria-label, that publishing shipped.
               Every other reader already agrees: PageRow falls back to
               "live", and the settings drawer persists only live/hidden/
               password and reads anything else as "live". */
            status: pageStatus(p.settings?.visibility),
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
    /* PROJECT_LOADED is the other half, and its absence made undo look broken.
       Undo, redo and version-restore all go through `importProject`, which
       emits PROJECT_LOADED and never PROJECT_CHANGED — so deleting a page and
       pressing Cmd+Z restored it in the engine while this list went on saying
       "This site has one page". Closing and reopening the panel showed both
       pages, which is how it was caught. The delete dialog promises "You can
       undo immediately after", so the stale list reads as the undo failing.
       PageTabBar and useLayerTree already listen to both for the same reason.
       `syncOnLoad` ignores the payload: an import has no page:* type to
       filter on, and every import can change the whole list. */
    const syncOnLoad = () => {
      setLoaded(true);
      sync();
    };
    composer.on(EVENTS.PROJECT_CHANGED, handler);
    composer.on(EVENTS.PROJECT_LOADED, syncOnLoad);
    return () => {
      composer.off(EVENTS.PROJECT_CHANGED, handler);
      composer.off(EVENTS.PROJECT_LOADED, syncOnLoad);
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
    (pageId: string, name: string, updateUrl = false) => {
      const trimmed = name.trim();
      const before = pages.find((p) => p.id === pageId);
      if (trimmed && composer) {
        // G2-076: "Update URL" moves the slug with the name (the engine keeps
        // the old one in slugHistory); "Keep URL" renames only.
        composer.elements.updatePage(pageId, updateUrl ? { name: trimmed, slug: slugify(trimmed) } : { name: trimmed });
        /* v3 4418:94200 / 4418:91027: "Renamed to Our menu · URL /menu kept ·
           Undo". Update URL says nothing here — it lands in Page settings
           with the redirect offer instead. */
        if (!updateUrl && before && before.name !== trimmed) {
          const undoRename = composer.history?.captureUndo?.();
          addToast({
            description: before.isHome ? `Renamed to ${trimmed}` : `Renamed to ${trimmed} · URL /${before.slug} kept`,
            tone: "info",
            duration: 8000,
            action: { label: "Undo", onClick: () => undoRename?.() },
          });
        }
      }
      setRenamingPageId(null);
    },
    [composer, pages, addToast]
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
          return;
        }
        /* v3 4418:93381: "Menu duplicated · Menu copy · Open". */
        const sourceName = pages.find((p) => p.id === pageId)?.name ?? "Page";
        addToast({
          description: `${sourceName} duplicated · ${copy.name}`,
          tone: "info",
          duration: 8000,
          action: { label: "Open", onClick: () => composer.elements.setActivePage(copy.id) },
        });
      } catch (err) {
        addToast({
          description: "Duplicate failed — page may have corrupt content.",
          tone: "error",
          duration: 4000,
        });
        console.error("[pages] duplicatePage failed", err);
      }
    },
    [composer, pages, addToast]
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
      // The toast's Undo reverts this delete, never a later edit (L3-007).
      const undoDelete = composer.history?.captureUndo?.();
      /* v3 4418:90763: "Menu deleted · Undo" — the name bare, no quotes. */
      addToast({
        description: `${name} deleted`,
        tone: "info",
        duration: 8000,
        action: {
          label: "Undo",
          onClick: () => {
            undoDelete?.();
          },
        },
      });
    },
    [composer, pages, addToast]
  );

  /** v3 4418:96537 "one toast per action": a bulk delete reports once —
   *  "3 pages deleted · Menu, Contact, About · Undo" — and one undo brings
   *  them all back. The caller has already applied the home/last guards. */
  const deletePages = React.useCallback(
    (pageIds: string[]) => {
      if (!composer || pageIds.length === 0) return;
      const names = pageIds.map((id) => pages.find((p) => p.id === id)?.name).filter((n): n is string => !!n);
      pageIds.forEach((id) => composer.elements.deletePage(id));
      const undoDelete = composer.history?.captureUndo?.();
      addToast({
        description: `${pageIds.length} page${pageIds.length === 1 ? "" : "s"} deleted · ${names.join(", ")}`,
        tone: "info",
        duration: 8000,
        action: { label: "Undo", onClick: () => undoDelete?.() },
      });
    },
    [composer, pages, addToast]
  );

  const setHomepage = React.useCallback(
    (pageId: string) => {
      const page = pages.find((p) => p.id === pageId);
      setContextMenu(null);
      if (!composer) return;
      try {
        composer.elements.setHomePage?.(pageId);
        const undoHome = composer.history?.captureUndo?.();
        /* v3 4418:93657: "Menu is now the homepage · Undo". */
        addToast({
          description: `${page?.name ?? "This page"} is now the homepage`,
          tone: "info",
          duration: 8000,
          action: { label: "Undo", onClick: () => undoHome?.() },
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
      // The host the publish worker puts the page on (typed canonical → verified
      // primary → published URL). The old `getProjectMetadata().domain` field
      // does not exist, so Copy link always said "No address yet".
      const origin = getSiteOrigin();

      // No address means there is no link yet. Copying a made-up one (this used to
      // hand out `yoursite.aquibra.io/<slug>` — a host from the project this was
      // forked from) puts a dead URL in the user's clipboard, which is worse than
      // telling them there isn't one.
      if (!origin) {
        addToast({
          title: "No address yet",
          description: "Connect a custom domain in Settings, or publish the site first.",
          tone: "info",
        });
        return;
      }

      // The URL the deploy serves, the same as the page drawer's preview: the
      // file the export writes (index.html → `/`, `about.html`), not `/<slug>`,
      // which 404s while the generated vercel.json carries no cleanUrls.
      const url = pageCanonicalUrl(origin, pageFileNames(pages).get(page.id) ?? "index.html") ?? origin;
      /* v3 4418:93929: "Link copied · bellacucina.com/menu". */
      const successMsg = `Link copied · ${url.replace(/^https?:\/\//, "")}`;

      // A8: a copy that cannot land (no clipboard on an insecure origin,
      // or refused) shows the URL so the user can copy it by hand.
      writeClipboardText(url)
        .then(() => addToast({ description: successMsg, tone: "success", duration: 5000 }))
        .catch(() => {
          addToast({
            description: `Couldn't copy. Link: ${url}`,
            tone: "error",
            duration: 8000,
          });
        });
    },
    [pages, addToast, getSiteOrigin]
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
    selectPage,
    duplicatePage,
    deletePage,
    deletePages,
    setHomepage,
    copyPageLink,
    // Guards against deleting the final page. Semantically the "only" page is
    // exactly 1 — 0 pages is a different (empty-list) state handled by PageList.
    isOnlyPage: pages.length === 1,
    loadError,
    retrySync,
    /* A failed load is not a pending one: `loadError` owns that state and
       offers Retry, so the skeleton must stand down or the error never shows. */
    loading: !loaded && !loadError,
  };
}
