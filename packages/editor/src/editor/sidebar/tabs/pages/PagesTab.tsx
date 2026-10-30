/**
 * PagesTab — Shell component.
 *
 * Wires usePages hook to sub-components. Zero business logic here.
 * Business logic: ./usePages.ts
 * Settings logic: ./page-settings/usePageSettings.ts
 *
 * Page settings live in a 580px slide-over drawer (PageSettingsDrawer)
 * rendered here, opened via settingsPageId and wrapped in a local error
 * boundary so a bad page doesn't crash the whole tab.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  EmptyStateTitle,
  IconButton,
  Menu,
  MenuItem,
  PanelFrame,
  PanelSearch,
  Popover,
  Tabs,
  useToast,
} from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { listNames, slugify } from "@shared/utils/helpers/string";
import type { DrawerTab, PageSettingsOpenRequest } from "./types";
import { PageContextMenu } from "./components/PageContextMenu";
import { MovePagesDialog, TOP_LEVEL } from "./components/MovePagesDialog";
import { PageList } from "./components/PageList";
import { SiteStructureTree } from "./components/SiteStructureTree";
import { AddPageButton } from "./components/AddPageButton";
import { LiveUrlConfirm, type LiveUrlChange } from "./components/LiveUrlConfirm";
import { usePagesNotice } from "./usePagesNotice";
import { SearchListingsTable } from "./components/SearchListingsTable";
import { PageSettingsDrawer } from "./page-settings/PageSettingsDrawer";
import { useDirtyPages } from "@/editor/shared/useDirtyPages";
import { SettingsErrorBoundary } from "./page-settings/SettingsErrorBoundary";
import { usePages } from "./usePages";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useSiteOrigin } from "@/editor/shared/useSiteOrigin";
import { useFolders } from "./useFolders";
import { pageRoute } from "./utils/slug";
import { useBulkSelect } from "./useBulkSelect";
import { useDynamicPagesSummary } from "./useDynamicPagesSummary";
import { pageFileNames } from "@/engine/export";
import "./PagesTab.css";

type PageView = "pages" | "listings" | "structure";
const PAGE_VIEWS: ReadonlyArray<{ id: PageView; label: string }> = [
  { id: "pages", label: "Pages" },
  { id: "listings", label: "Listings" },
  { id: "structure", label: "Structure" },
];

/**
 * One place up or down among the top-level pages, as the engine's "put it
 * after <id>" (null = first). Moving up lands after whatever precedes the
 * previous top-level page in SITE order, so folder members keep their
 * places. Null at either end.
 */
export function rootMove(
  siteOrder: readonly string[],
  rootIds: readonly string[],
  pageId: string,
  direction: -1 | 1,
): { afterId: string | null; position: number } | null {
  const i = rootIds.indexOf(pageId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= rootIds.length) return null;
  if (direction === 1) return { afterId: rootIds[j], position: j + 1 };
  const order = siteOrder.filter((id) => id !== pageId);
  const at = order.indexOf(rootIds[j]);
  return { afterId: at > 0 ? order[at - 1] : null, position: j + 1 };
}

export interface PagesTabProps {
  composer: Composer | null;
  /** False while the drawer is closed but the panel stays mounted — the
   *  topbar field goes back to being the ⌘K door. */
  isOpen?: boolean;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Called when user clicks "From Template" — parent should switch to Templates tab */
  onRequestTemplates?: () => void;
  /** `ui:pages-open-settings`, held by StudioPanels while this lazy panel
   *  mounts (the emit fires before it exists); a fresh object per request. */
  openSettingsRequest?: PageSettingsOpenRequest | null;
}

export const PagesTab: React.FC<PagesTabProps> = ({
  composer,
  isOpen = true,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onRequestTemplates,
  openSettingsRequest,
}) => {
  const p = usePages(composer);
  const { notice, setNotice } = usePagesNotice(p.pages);

  // Folders — sidebar-only, localStorage-persisted
  /* This read was `(composer as { id?: string })?.id`, and Composer has no
     `id` — the cast made a missing property look like an optional one, so
     every site shared one folder blob. The site is the thing folders belong
     to, and the URL is where the editor already gets it. */
  const folderScopeId = getSiteIdFromUrl();
  /* The Structure view's root (board 63:21939): the published host. */
  const getSiteOrigin = useSiteOrigin(composer, folderScopeId);
  const siteOrigin = getSiteOrigin();
  const siteHost = siteOrigin ? siteOrigin.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const livePageIds = React.useMemo(
    () => new Set(p.pages.map((pg) => pg.id)),
    [p.pages]
  );
  const f = useFolders(folderScopeId, livePageIds);
  const [newFolderId, setNewFolderId] = React.useState<string | null>(null);
  const bulk = useBulkSelect();

  /* FC-1 (fix-all 2026-09-25): pages a page-generating CMS collection
     produces at publish don't have Page rows and never showed up here.
     Read-only hint row only — opening a collection's own Dynamic pages tab
     is still where the pattern/template are edited. */
  const dynamicPages = useDynamicPagesSummary(composer);
  const manageCollection = React.useCallback(
    (collectionId: string) => composer?.emit(EVENTS.UI_CMS_OPEN, { collectionId, tab: "dynamic-pages" }),
    [composer],
  );

  // Prune stale folder references when pages are deleted
  React.useEffect(() => {
    f.pruneDeletedPages(livePageIds);
  }, [livePageIds, f.pruneDeletedPages]);

  // Delete confirmation state — UI concern lives here, not in usePages
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  /* Board 183:2 confirms a BULK delete by name before it happens — "Delete 3
     pages?" over the list of them. The single-page path has always asked;
     selecting three and pressing Delete removed all three on the spot. */
  const [bulkDeleteIds, setBulkDeleteIds] = React.useState<string[] | null>(null);
  const deleteTarget = p.pages.find((pg) => pg.id === deleteTargetId);
  /* EDT-057 (board E3): deleting a collection's template page stops its
     record pages publishing — the confirm names the collection and how many. */
  const deleteTemplateNote = React.useMemo(() => {
    if (!composer || !deleteTargetId) return "";
    const file = pageFileNames(composer.elements.getAllPages()).get(deleteTargetId);
    const generating = (composer.cms?.collections.getAllCollections() ?? []).filter(
      (c) => c.pageSlugPattern && file && c.pageTemplatePath === file
    );
    if (generating.length === 0) return "";
    const counts = generating.map((c) => dynamicPages.byCollection[c.id]);
    const n = counts.every((x) => x !== undefined) ? counts.reduce<number>((sum, x) => sum + (x ?? 0), 0) : null;
    const pagesStop =
      n === null ? "record pages stop" : `${n} record page${n === 1 ? " stops" : "s stop"}`;
    return ` It is the template for ${listNames(generating.map((c) => c.name))} — ${
      generating.length === 1 ? "its" : "their"
    } ${pagesStop} publishing.`;
  }, [composer, deleteTargetId, dynamicPages.byCollection]);

  // Name conflict error state (Screen GoEJk)
  const [nameError, setNameError] = React.useState<string | null>(null);

  /* v3 FC-2 (2026-09-25): the panel's ⌘K rows (New page · Go to <page>) now
     register from the SHELL (usePageSummaries + usePageCommands, called once
     in StudioPanels) so they're in the palette whether or not this panel is
     mounted — like Layers/Assets/Records/Templates. The panel-local palette
     and its own ⌘K listener are still gone — decision #38, TODOS.md:393. */
  /* Every Add-page door asks for the New-page modal (decision #19). */
  const requestNewPage = React.useCallback(() => composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {}), [composer]);

  /* The filter sits under the header (owner decision 2026-10-03; v3
     4418:92256 put it in the topbar field, "Search pages…"). A closed drawer
     stays mounted and drops the query, as handing the topbar field back did. */
  const [search, setSearch] = React.useState("");
  React.useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  // Redesign P4 (50-pages): the panel has two views — the page tree ("Pages")
  // and the whole-site search-listings table ("Search listings"). Default to the
  // tree; the table is the SEO-at-a-glance view that scales past a few pages.
  const [view, setView] = React.useState<PageView>("pages");
  /* Board 63:21262 draws Listings in the wide drawer, Pages and Structure in
     the narrow one. Only a CHANGE of view moves the width, and the drawer
     narrows again only if Listings widened it — "Narrow panel" / "Widen
     panel" in ⋯ still win while a view is showing. */
  const viewRef = React.useRef(view);
  const widenedForListings = React.useRef(false);
  React.useEffect(() => {
    if (viewRef.current === view) return;
    viewRef.current = view;
    if (!onExpandToggle) return;
    if (view === "listings" && !isExpanded) {
      widenedForListings.current = true;
      onExpandToggle();
    } else if (view !== "listings" && isExpanded && widenedForListings.current) {
      widenedForListings.current = false;
      onExpandToggle();
    }
  }, [view, isExpanded, onExpandToggle]);

  /* Board 7069:79383 "Pages · Panel menu (⋯)": Select pages… · Show structure ·
     Reload, plus the Listings row (EP-11, 7576:197553). Listings and Structure
     used to be text links on the search band (audit G2-070: pattern, not
     capability). "Select pages…" (7069:78984) turns the row checkboxes on
     before anything is ticked; a selection turns them on by itself. */
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectMode, setSelectMode] = React.useState(false);
  const runMenu = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  // Settings drawer — resolve the active page from the id stored in usePages
  const dirtyPages = useDirtyPages(composer);
  const settingsPage = p.settingsPageId
    ? p.pages.find((pg) => pg.id === p.settingsPageId) ?? null
    : null;

  /* The way back from Settings › Redirects' saved card — `Back to <Page> SEO`
     (Clone 3519:20096) — and any other door that names a page and a tab. Two
     routes into one handler: the prop, which StudioPanels holds while this
     lazy panel mounts (the emit fires before it exists), and the live event,
     for a door fired while the panel is already up (the Templates modal). An
     id this panel does not list opens nothing — `settingsPage` above resolves
     to null. The tab rides to the drawer as `initialTab` and is forgotten on
     close, so a later context-menu open is not steered by a door that has
     already closed. The handler is stable on purpose: the prop stays held for
     the whole visit, and an effect that re-ran on every page re-sync would
     reopen a drawer the user had just closed. */
  const [doorTab, setDoorTab] = React.useState<DrawerTab | undefined>(undefined);
  const { openSettings, closeSettings: closePageSettings } = p;
  const onOpen = React.useCallback(
    ({ pageId, tab }: PageSettingsOpenRequest) => {
      openSettings(pageId);
      setDoorTab(tab);
    },
    [openSettings],
  );
  React.useEffect(() => {
    if (openSettingsRequest) onOpen(openSettingsRequest);
  }, [openSettingsRequest, onOpen]);
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.UI_PAGES_OPEN_SETTINGS, onOpen);
    return () => {
      composer.off(EVENTS.UI_PAGES_OPEN_SETTINGS, onOpen);
    };
  }, [composer, onOpen]);

  const closeSettings = React.useCallback(() => {
    setDoorTab(undefined);
    closePageSettings();
  }, [closePageSettings]);

  const [movedFrom, setMovedFrom] = React.useState<{ pageId: string; slug: string } | null>(null);
  /* design-2l9 63:15255: "Update URL" on a LIVE page asks first. Live is
     real state: the site has been published (project metadata's
     publishedUrl) and the page is not hidden from publish. */
  const [liveUrlChange, setLiveUrlChange] = React.useState<LiveUrlChange | null>(null);
  const handleRenameCommit = React.useCallback(
    (pageId: string, name: string, updateUrl?: boolean, confirmed = false) => {
      const trimmed = name.trim();
      if (trimmed) {
        const exists = p.pages.some(
          (pg) => pg.id !== pageId && pg.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (exists) {
          setNameError("A page with this name already exists");
          return;
        }
      }
      setNameError(null);
      const page = p.pages.find((pg) => pg.id === pageId);
      const before = page?.slug;
      const siteLive = Boolean(composer?.getProjectMetadata?.()?.publishedUrl);
      if (updateUrl && !confirmed && page && !page.isHome && siteLive && page.status !== "hidden") {
        setLiveUrlChange({ pageId, current: page.name, name: trimmed, from: pageRoute(page), to: `/${slugify(trimmed)}` });
        p.cancelRename();
        return;
      }
      p.commitRename(pageId, name, updateUrl);
      if (!updateUrl && page && !page.isHome && trimmed && trimmed !== page.name) {
        setNotice({ text: `Page renamed. URL kept at ${pageRoute(page)}.` });
      }
      /* Boards 6887:75724 / 75760 / 79128: "Update URL" lands in Page settings
         with the redirect offer for the URL it just moved off. */
      if (updateUrl && before) {
        setMovedFrom({ pageId, slug: before });
        p.openSettings(pageId);
      }
    },
    [p, composer]
  );

  const handleDeleteRequest = (pageId: string) => {
    const page = p.pages.find((pg) => pg.id === pageId);
    if (!page) return;
    // Guards are in usePages.deletePage — short-circuit for guarded cases
    if (page.isHome || p.isOnlyPage) {
      p.deletePage(pageId); // shows toast warning, no actual delete
      return;
    }
    setDeleteTargetId(pageId); // show confirm dialog
  };

  // Escape — leave select mode and clear the bulk selection
  const bulkMode = selectMode || bulk.hasSelection;
  const leaveSelectMode = React.useCallback(() => {
    setSelectMode(false);
    bulk.clearSelection();
  }, [bulk.clearSelection]);
  React.useEffect(() => {
    if (!bulkMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") leaveSelectMode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bulkMode, leaveSelectMode]);

  /* Board 6883:69504 row menu "Replace layout with template…": the flow lives
     in Templates and works on the ACTIVE page, so the row's page goes active
     first (audit G2-078 — the door existed only in ⌘K). */
  const handleReplaceLayout = React.useCallback(
    (pageId: string) => {
      p.selectPage(pageId);
      /* 4428:149355: the catalogue opens in replace mode for that page. */
      composer?.emit(EVENTS.UI_BROWSE_TEMPLATES, { replace: true });
    },
    [p, composer],
  );

  // Ordered page ids for shift-range selection
  const orderedPageIds = React.useMemo(() => p.pages.map((pg) => pg.id), [p.pages]);

  const handleToggleSelect = React.useCallback(
    (pageId: string, e: React.MouseEvent | React.KeyboardEvent) => {
      const shift = "shiftKey" in e ? e.shiftKey : false;
      bulk.toggleSelect(pageId, { shift, orderedIds: orderedPageIds });
    },
    [bulk.toggleSelect, orderedPageIds]
  );

  // Bulk actions
  const handleBulkDuplicate = React.useCallback(() => {
    p.duplicatePages([...bulk.selectedIds]);
    bulk.clearSelection();
  }, [bulk.selectedIds, p.duplicatePages, bulk.clearSelection]);

  /** Resolve what a bulk delete would actually remove, applying the same
   *  guards as the per-page path: never the home page, never the last one. */
  const resolveBulkDeletable = React.useCallback((): string[] => {
    const selected = [...bulk.selectedIds];
    // The home page is never bulk-deletable (matches the per-page guard).
    let deletable = selected.filter((id) => {
      const pg = p.pages.find((x) => x.id === id);
      return pg && !pg.isHome;
    });
    // A site always needs ≥1 page. If the selection would wipe every page
    // (e.g. no page is flagged home), spare the first one in tree order so
    // the action isn't a silent no-op.
    if (deletable.length >= p.pages.length && orderedPageIds.length > 0) {
      const spareId = orderedPageIds[0];
      deletable = deletable.filter((id) => id !== spareId);
    }
    if (deletable.length === 0) {
      // Nothing bulk-deletable (only the home/last page was selected) —
      // route through the guarded single-delete so the user still gets the
      // explanatory toast instead of nothing happening.
      if (selected.length > 0) p.deletePage(selected[0]);
      bulk.clearSelection();
      return [];
    }
    return deletable;
  }, [bulk.selectedIds, p.pages, p.deletePage, orderedPageIds, bulk.clearSelection]);

  const handleBulkDelete = React.useCallback(() => {
    const deletable = resolveBulkDeletable();
    if (deletable.length > 0) setBulkDeleteIds(deletable);
  }, [resolveBulkDeletable]);

  /* The dialog is NOT closed here. Board 183:60 keeps it up long enough to
     report what happened ("3 pages deleted." / "Closing…") and then closes
     itself — the panel used to drop the modal on the same tick and leave the
     result to whatever toast deletePage happened to raise, which is a report
     from a different surface about a different unit of work. */
  const confirmBulkDelete = React.useCallback(() => {
    p.deletePages(bulkDeleteIds ?? []);
    bulk.clearSelection();
  }, [bulkDeleteIds, p.deletePages, bulk.clearSelection]);

  const handleBulkMoveToFolder = React.useCallback(
    (folderId: string) => {
      bulk.selectedIds.forEach((id) => f.movePageToFolder(id, folderId));
      bulk.clearSelection();
    },
    [bulk.selectedIds, f.movePageToFolder, bulk.clearSelection]
  );

  const handleBulkRemoveFromFolders = React.useCallback(() => {
    bulk.selectedIds.forEach((id) => f.removePageFromFolder(id));
    bulk.clearSelection();
  }, [bulk.selectedIds, f.removePageFromFolder, bulk.clearSelection]);

  /* Boards 137:53911 / 137:59625: one place up or down among the TOP-LEVEL
     pages (folder members are not ordered). The engine orders the whole site
     ("after <id>"), so moving above the previous top-level page lands after
     whatever precedes it in site order. Page order is not in the composer's
     history, so the receipt's Undo puts the page back after its old
     neighbour itself. */
  const { addToast } = useToast();
  const rootIds = React.useMemo(
    () => p.pages.filter((pg) => !f.pageToFolder.has(pg.id)).map((pg) => pg.id),
    [p.pages, f.pageToFolder],
  );
  const movePage = React.useCallback(
    (pageId: string, direction: -1 | 1) => {
      const page = p.pages.find((pg) => pg.id === pageId);
      const order = p.pages.map((pg) => pg.id);
      const move = rootMove(order, rootIds, pageId, direction);
      if (!composer || !page || !move) return;
      /* Where it sat, so Undo can put it back (boards 137:53911 / 137:59625). */
      const at = order.indexOf(pageId);
      const wasAfter = at > 0 ? order[at - 1] : null;
      if (!composer.elements.reorderPage(pageId, move.afterId)) return;
      addToast({
        description: `${page.name} moved to position ${move.position}${page.isHome ? " · Still the homepage" : ""}`,
        tone: "info",
        action: { label: "Undo", onClick: () => { composer.elements.reorderPage(pageId, wasAfter); } },
      });
    },
    [composer, p.pages, rootIds, addToast],
  );

  /* Board 131:41791 "Move to folder…" — the one-page Move dialog. */
  const [movingPageId, setMovingPageId] = React.useState<string | null>(null);
  const movingPage = p.pages.find((pg) => pg.id === movingPageId);
  const moveToTarget = React.useCallback(
    (target: string) => {
      const page = movingPage;
      setMovingPageId(null);
      if (!page) return;
      const from = f.folders.find((fd) => fd.id === f.pageToFolder.get(page.id));
      const to = f.folders.find((fd) => fd.id === target);
      if (target === TOP_LEVEL) f.removePageFromFolder(page.id);
      else f.movePageToFolder(page.id, target);
      /* Boards 131:41086 / 127:40244 (no Undo: folders are not composer
         history — REQUESTS #13). */
      addToast({
        description: to
          ? `${page.name} moved to ${to.name} · ${pageRoute(page)} unchanged`
          : `${page.name} removed from ${from?.name ?? "its folder"} · Page kept`,
        tone: "info",
      });
    },
    [movingPage, f, addToast],
  );

  /* Board 137:58206: "{Folder} deleted · About kept at top level" — its
     pages stay, at the top level. No Undo: folders are outside composer
     history (A-13). */
  const deleteFolder = React.useCallback(
    (folderId: string) => {
      const folder = f.folders.find((fd) => fd.id === folderId);
      f.deleteFolder(folderId);
      if (!folder) return;
      const kept = folder.pageIds.map((id) => p.pages.find((pg) => pg.id === id)?.name).filter((n): n is string => !!n);
      addToast({
        description: kept.length
          ? `${folder.name} deleted · ${listNames(kept)} kept at top level`
          : `${folder.name} deleted`,
        tone: "info",
      });
    },
    [f, p.pages, addToast],
  );

  /* Board 63:13820 "Save as template…": the save-template modal saves the
     ACTIVE page, so the row's page goes active first. */
  const saveAsTemplate = React.useCallback(
    (pageId: string) => {
      p.selectPage(pageId);
      composer?.emit(EVENTS.TEMPLATE_SAVE_REQUESTED, {});
    },
    [p, composer],
  );

  const menuFolderId = p.contextMenu ? f.pageToFolder.get(p.contextMenu.pageId) : undefined;
  const menuRootIndex = p.contextMenu ? rootIds.indexOf(p.contextMenu.pageId) : -1;
  const menuFolderName = f.folders.find((fd) => fd.id === menuFolderId)?.name;

  return (
    // `bd-pg-panel` is the DS V2 root class — new PagesTab.css uses it as the
    // scope for all `.bd-pg-*` rules including the active-row 2px cobalt bar
    // and absolute-positioned bulk toolbar (requires `position: relative`).
    // `.bulk-mode` toggle activates the row checkbox column when selection exists.
    // No width prop — Pages host (LeftSidebar drawer, width from tabsConfig.ts)
    // controls sizing. TabFrame fills the host via width:100%.
    <PanelFrame className={`bd-pg-panel${bulkMode ? " bulk-mode" : ""}`}>
      {/* v3 4418:90494 header: the ⋯ panel menu rides in the header's
          `actions` slot. No ⌘K keycap — the topbar field is the ⌘K door. */}
      <PanelFrame.Header
        title={`Pages · ${p.pages.length}`}
        onHelpClick={onHelpClick}
        onClose={onClose}
        actions={
          <>
            {/* Board 139:47668: with pages ticked the header keeps ⋯ and the
                bulk band's Clear ends the selection; Done is select mode
                with nothing ticked yet. */}
            {bulkMode && !bulk.hasSelection ? (
              /* v3 7069:78984: select mode swaps the ⋯ for "Done". */
              <Button
                color="light"
                size="xs"
                className="tw:border-transparent tw:bg-transparent tw:px-1 tw:text-xs tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0"
                data-testid="pages-select-done"
                onClick={leaveSelectMode}
              >
                Done
              </Button>
            ) : (
            <Popover
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              placement="bottom-end"
              /* End-aligned on ⋯ it would start 42px into the rail; the board
                 starts it at the drawer's left edge. */
              className="tw:-mr-[42px]"
              label="Pages options"
              trigger={
                <IconButton
                  label="Pages options"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  data-testid="pages-panel-menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  ⋯
                </IconButton>
              }
            >
              {/* design-2l9 board 65:17148: Select pages… · Listings · Show
                  structure · Reload, no rule, 280 wide from the drawer's left
                  edge. Listings widens the drawer by itself, so the old
                  "Widen panel" row is gone. The board's "Recently deleted"
                  is the page trash (P3, not built). */}
              <Menu label="Pages options" className="tw:-mx-2 tw:w-[276px]">
                <MenuItem data-testid="pages-menu-select" onClick={runMenu(() => setSelectMode(true))}>
                  Select pages…
                </MenuItem>
                <MenuItem data-testid="pages-open-listings" onClick={runMenu(() => setView("listings"))}>
                  Listings
                </MenuItem>
                <MenuItem data-testid="pages-open-structure" onClick={runMenu(() => setView("structure"))}>
                  Show structure
                </MenuItem>
                <MenuItem data-testid="pages-menu-reload" onClick={runMenu(p.retrySync)}>
                  Reload
                </MenuItem>
              </Menu>
            </Popover>
            )}
          </>
        }
      />
      {/* Over all three views (boards 63:6393 / 63:21262 / 63:21939): it
          filters names and URLs in each. */}
      <PanelSearch placeholder="Search pages…" value={search} onChange={setSearch} data-testid="pages-search" />
      {/* Board 63:6393: the three views as tabs under the search (they were
          ⋯ rows only; the ⋯ keeps them too, as board 65:17148 draws). */}
      {!p.loadError && (
        <Tabs
          label="Pages view"
          tabs={PAGE_VIEWS}
          value={view}
          onChange={(id) => setView(id as PageView)}
          data-testid="pages-view-tabs"
          /* Board 63:6393: a gray well, the chosen view on a white chip. */
          className="tw:mx-3 tw:my-2 tw:gap-0 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:p-0.5"
          tabClassName="tw:h-7 tw:flex-1 tw:px-0 tw:text-[13px] tw:text-[var(--bk-ink-soft)] tw:aria-selected:bg-[var(--bk-bg-card)] tw:aria-selected:text-[var(--bk-ink)] tw:aria-selected:hover:bg-[var(--bk-bg-card)] tw:aria-selected:[box-shadow:var(--bk-shadow-raised)]"
        />
      )}
      {/* Board 141:165 keeps the search band and the Add-page footer either
          side of the error, so the error is a BODY state inside PageList — not
          a replacement for the whole panel body. */}
      <PanelFrame.Body noScroll>
          {view === "structure" && !p.loadError ? (
            <div className="tw:flex tw:h-full tw:min-h-0 tw:flex-col">
              <SiteStructureTree
                pages={p.pages}
                onSelectPage={(id) => { p.selectPage(id); }}
                onRowMenu={p.openContextMenu}
                host={siteHost}
                collections={dynamicPages.collections}
                search={search}
              />
              {/* Board 63:21939 keeps the Pages footer under the tree too. */}
              <div className="bd-pg-footer" data-testid="pages-footer">
                <AddPageButton
                  onAddBlank={requestNewPage}
                  onFromTemplate={onRequestTemplates}
                  onAddFolder={() => { setView("pages"); setNewFolderId(f.createFolder("New Folder")); }}
                />
              </div>
            </div>
          ) : view === "listings" && !p.loadError ? (
            /* PanelFrame.Body is `flex-1 min-h-0 overflow-hidden` — flex-1 as a
               CHILD, but it is not itself display:flex, so these two stack as
               blocks. The table then took h-full (the WHOLE body) while
               starting below the back link, and ran 32 pixels past the panel: the
               "Open full listings" footer, which board 141:207 pins to the
               panel's bottom edge, sat 22px below it and out of reach. The
               back link's own `flex-shrink:0` / `align-self:flex-start` were
               inert for the same reason — written for a flex parent it never
               had. */
            <div className="tw:flex tw:h-full tw:min-h-0 tw:flex-col">
              <SearchListingsTable pages={p.pages} onEditPage={p.openSettings} onRowMenu={p.openContextMenu} search={search} />
              {/* Board 63:21262 keeps the Pages footer under the listing. A new
                  folder only shows in the Pages view, so it goes there. */}
              <div className="bd-pg-footer" data-testid="pages-footer">
                <AddPageButton
                  onAddBlank={requestNewPage}
                  onFromTemplate={onRequestTemplates}
                  onAddFolder={() => { setView("pages"); setNewFolderId(f.createFolder("New Folder")); }}
                />
              </div>
            </div>
          ) : (
          <PageList
            pages={p.pages}
            notice={notice}
            renamingPageId={p.renamingPageId}
            nameError={nameError}
            loadError={p.loadError}
            loading={p.loading}
            onRetry={p.retrySync}
            openContextMenuPageId={p.contextMenu?.pageId ?? null}
            composer={composer}
            folders={f.folders}
            pageToFolder={f.pageToFolder}
            selectedIds={bulk.selectedIds}
            search={search}
            onAddPage={requestNewPage}
            onAddFolder={() => setNewFolderId(f.createFolder("New Folder"))}
            newFolderId={newFolderId}
            onSelectPage={(id) => {
              setNotice(null);
              p.selectPage(id);
            }}
            onToggleSelect={handleToggleSelect}
            onBulkDuplicate={handleBulkDuplicate}
            onBulkMoveToFolder={handleBulkMoveToFolder}
            onBulkRemoveFromFolders={handleBulkRemoveFromFolders}
            onBulkDelete={handleBulkDelete}
            onClearSelection={leaveSelectMode}
            onContextMenu={p.openContextMenu}
            onMovePage={movePage}
            dirtyPages={dirtyPages}
            onRenameStart={p.startRename}
            onRenameCommit={handleRenameCommit}
            onRenameCancel={() => { setNameError(null); p.cancelRename(); }}
            onRequestTemplates={onRequestTemplates}
            onFolderToggle={f.toggleCollapse}
            onFolderRename={f.renameFolder}
            onFolderDelete={deleteFolder}
            onMovePageToFolder={f.movePageToFolder}
            onRemovePageFromFolder={f.removePageFromFolder}
            collectionPages={dynamicPages.collections}
            onOpenTemplatePage={p.selectPage}
            onManageCollection={manageCollection}
            onClearSearch={() => setSearch("")}
          />
          )}
      </PanelFrame.Body>
      {/* Context menu (portal) */}
      {p.contextMenu && (
        <PageContextMenu
          pageId={p.contextMenu.pageId}
          x={p.contextMenu.x}
          y={p.contextMenu.y}
          pages={p.pages}
          onClose={p.closeContextMenu}
          onRename={p.startRename}
          onDuplicate={p.duplicatePage}
          onDelete={handleDeleteRequest}
          onSetHomepage={p.setHomepage}
          onReplaceLayout={handleReplaceLayout}
          onCopyLink={p.copyPageLink}
          onSettings={p.openSettings}
          folderName={menuFolderName}
          onRemoveFromFolder={f.removePageFromFolder}
          onSaveAsTemplate={saveAsTemplate}
          onMoveToFolder={setMovingPageId}
          onMove={movePage}
          rootPosition={menuRootIndex >= 0 ? { index: menuRootIndex, count: rootIds.length } : null}
        />
      )}
      <MovePagesDialog
        open={!!movingPage}
        pageNames={movingPage ? [movingPage.name] : []}
        folders={f.folders}
        current={movingPage ? { target: f.pageToFolder.get(movingPage.id) ?? TOP_LEVEL, url: pageRoute(movingPage) } : undefined}
        onMove={moveToTarget}
        onClose={() => setMovingPageId(null)}
      />
      {/* Delete confirmation dialog */}
      {liveUrlChange && (
        <LiveUrlConfirm
          change={liveUrlChange}
          onCancel={() => setLiveUrlChange(null)}
          onConfirm={() => {
            setLiveUrlChange(null);
            handleRenameCommit(liveUrlChange.pageId, liveUrlChange.name, true, true);
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) p.deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        /* v3 4418:93099: curly quotes, "Delete page". */
        title={`Delete “${deleteTarget?.name}”?`}
        /* "permanently removed … you can undo" contradicted itself in one
           sentence, and this door raises no toast (only the page-tab bar
           does), so "immediately after" pointed at a control that is not
           there. Undo is the keyboard one — walked live. */
        message={`This page and everything on it is removed.${deleteTemplateNote} Undo (⌘Z) brings it back.`}
        confirmLabel="Delete page"
        tone="destructive"
      />
      {/* Board 183:2 — the bulk confirm names what goes. */}
      <ConfirmDialog
        open={!!bulkDeleteIds}
        onClose={() => setBulkDeleteIds(null)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${bulkDeleteIds?.length ?? 0} page${(bulkDeleteIds?.length ?? 0) === 1 ? "" : "s"}?`}
        /* Said "This cannot be undone." Bulk delete is the SAME deletePage
           call in a loop, and the loop lands in one history entry: selected
           two pages in the running editor, deleted them, and a single ⌘Z
           brought both back. Telling a user an action is irreversible when it
           is not is the expensive direction to be wrong in — they stop
           looking for the way back. */
        /* v3 6887:77911 — the names as a sentence, what goes with them, and
           the way back. The board's "Undo is available for 30 seconds" is
           not how undo works here: ⌘Z has no clock. */
        message={`${listNames(
          (bulkDeleteIds ?? []).map((id) => p.pages.find((pg) => pg.id === id)?.name ?? id),
        )} — and everything on them — are removed. Inbound links to these pages will break. One undo (⌘Z) brings them all back.`}
        confirmLabel={`Delete ${bulkDeleteIds?.length ?? 0} page${(bulkDeleteIds?.length ?? 0) === 1 ? "" : "s"}`}
        tone="destructive"
        testId="pages-bulk-delete"
        success={{
          title: "Deleted",
          message: `${bulkDeleteIds?.length ?? 0} page${(bulkDeleteIds?.length ?? 0) === 1 ? "" : "s"} deleted.`,
        }}
      />

      {/* Page settings drawer — opened via openSettings, from the row's
          context menu ("Page settings…") or a Listings row. The per-row gear
          it used to name was deleted with the row action strip. */}
      {settingsPage && (
        <SettingsErrorBoundary onClose={closeSettings}>
          <PageSettingsDrawer
            page={settingsPage}
            allPages={p.pages}
            composer={composer}
            onClose={() => {
              setMovedFrom(null);
              closeSettings();
            }}
            initialTab={doorTab}
            previousSlug={movedFrom?.pageId === settingsPage.id ? movedFrom.slug : undefined}
          />
        </SettingsErrorBoundary>
      )}
    </PanelFrame>
  );
};

export default PagesTab;
