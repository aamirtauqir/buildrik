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
  Popover,
} from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import { EVENTS } from "@/shared/constants/events";
import type { DrawerTab, PageSettingsOpenRequest } from "./types";
import { PageContextMenu } from "./components/PageContextMenu";
import { PageList } from "./components/PageList";
import { SiteStructureTree } from "./components/SiteStructureTree";
import { SearchListingsTable } from "./components/SearchListingsTable";
import { PageSettingsDrawer } from "./page-settings/PageSettingsDrawer";
import { useDirtyPages } from "@/editor/shared/useDirtyPages";
import { SettingsErrorBoundary } from "./page-settings/SettingsErrorBoundary";
import { usePages } from "./usePages";
import { usePageCommands } from "./usePageCommands";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { useFolders } from "./useFolders";
import { useBulkSelect } from "./useBulkSelect";
import "./PagesTab.css";

export interface PagesTabProps {
  composer: Composer | null;
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
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onRequestTemplates,
  openSettingsRequest,
}) => {
  const p = usePages(composer);

  // Folders — sidebar-only, localStorage-persisted
  /* This read was `(composer as { id?: string })?.id`, and Composer has no
     `id` — the cast made a missing property look like an optional one, so
     every site shared one folder blob. The site is the thing folders belong
     to, and the URL is where the editor already gets it. */
  const folderScopeId = getSiteIdFromUrl();
  const livePageIds = React.useMemo(
    () => new Set(p.pages.map((pg) => pg.id)),
    [p.pages]
  );
  const f = useFolders(folderScopeId, livePageIds);
  const bulk = useBulkSelect();

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

  // Name conflict error state (Screen GoEJk)
  const [nameError, setNameError] = React.useState<string | null>(null);

  /* The panel's rows in the one ⌘K palette (New page · Go to <page>), live
     while this panel is mounted. The panel-local palette and its own ⌘K
     listener are gone — decision #38, TODOS.md:393. */
  /* Every Add-page door asks for the New-page modal (decision #19). */
  const requestNewPage = React.useCallback(() => composer?.emit(EVENTS.UI_NEW_PAGE_REQUESTED, {}), [composer]);
  usePageCommands(composer, p.pages, p.selectPage, requestNewPage);

  // Redesign P4 (50-pages): the panel has two views — the page tree ("Pages")
  // and the whole-site search-listings table ("Search listings"). Default to the
  // tree; the table is the SEO-at-a-glance view that scales past a few pages.
  const [view, setView] = React.useState<"pages" | "listings" | "structure">("pages");

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

  const handleRenameCommit = React.useCallback(
    (pageId: string, name: string) => {
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
      p.commitRename(pageId, name);
    },
    [p]
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
      composer?.emit(EVENTS.UI_BROWSE_TEMPLATES, {});
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
    bulk.selectedIds.forEach((id) => p.duplicatePage(id));
    bulk.clearSelection();
  }, [bulk.selectedIds, p.duplicatePage, bulk.clearSelection]);

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
    (bulkDeleteIds ?? []).forEach((id) => p.deletePage(id));
    bulk.clearSelection();
  }, [bulkDeleteIds, p.deletePage, bulk.clearSelection]);

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

  return (
    // `bd-pg-panel` is the DS V2 root class — new PagesTab.css uses it as the
    // scope for all `.bd-pg-*` rules including the active-row 2px cobalt bar
    // and absolute-positioned bulk toolbar (requires `position: relative`).
    // `.bulk-mode` toggle activates the row checkbox column when selection exists.
    // No width prop — Pages host (LeftSidebar drawer, width from tabsConfig.ts)
    // controls sizing. TabFrame fills the host via width:100%.
    <PanelFrame className={`bd-pg-panel${bulkMode ? " bulk-mode" : ""}`}>
      {/* Board 4418:90494 header: the ⌘K keycap and the ⋯ panel menu ride in
          the header's `actions` slot — as children they were dropped on the
          floor and the keycap never rendered. */}
      <PanelFrame.Header
        title="Pages"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
        actions={
          <>
            {/* The keycap opens THE palette — the shell's ⌘K, which bands
                this panel's rows under PAGES (B7). */}
            <Button
              color="light"
              size="xs"
              className="bd-pg-kbd-btn tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
              data-testid="pages-open-palette"
              onClick={() => composer?.emit(EVENTS.UI_TOGGLE_COMMAND_PALETTE, {})}
              aria-label="Open command palette"
            >
              <span className="bd-pg-kbd">⌘K</span>
            </Button>
            <Popover
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              placement="bottom-end"
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
              <Menu label="Pages options">
                <MenuItem data-testid="pages-menu-select" onClick={runMenu(() => setSelectMode(true))}>
                  Select pages…
                </MenuItem>
                <MenuItem data-testid="pages-open-structure" onClick={runMenu(() => setView("structure"))}>
                  Show structure
                </MenuItem>
                <MenuItem data-testid="pages-menu-reload" onClick={runMenu(p.retrySync)}>
                  Reload
                </MenuItem>
                <MenuItem data-testid="pages-open-listings" onClick={runMenu(() => setView("listings"))}>
                  Listings
                </MenuItem>
              </Menu>
            </Popover>
          </>
        }
      />
      {/* Board 141:165 keeps the search band and the Add-page footer either
          side of the error, so the error is a BODY state inside PageList — not
          a replacement for the whole panel body. */}
      <PanelFrame.Body noScroll>
          {view === "structure" && !p.loadError ? (
            <SiteStructureTree pages={p.pages} onSelectPage={(id) => { p.selectPage(id); }} onBack={() => setView("pages")} />
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
              <Button
                color="light"
                size="xs"
                className="bd-pg-listings-back"
                data-testid="pages-listings-back"
                onClick={() => setView("pages")}
              >
                {"\u2039"} Pages
              </Button>
              <SearchListingsTable pages={p.pages} onEditPage={p.openSettings} onOpenFull={onExpandToggle} />
            </div>
          ) : (
          <PageList
            pages={p.pages}
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
            onAddPage={requestNewPage}
            onAddFolder={() => f.createFolder("New Folder")}
            onSelectPage={p.selectPage}
            onToggleSelect={handleToggleSelect}
            onBulkDuplicate={handleBulkDuplicate}
            onBulkMoveToFolder={handleBulkMoveToFolder}
            onBulkRemoveFromFolders={handleBulkRemoveFromFolders}
            onBulkDelete={handleBulkDelete}
            onClearSelection={leaveSelectMode}
            onContextMenu={p.openContextMenu}
            dirtyPages={dirtyPages}
            onRenameStart={p.startRename}
            onRenameCommit={handleRenameCommit}
            onRenameCancel={() => { setNameError(null); p.cancelRename(); }}
            onRequestTemplates={onRequestTemplates}
            onFolderToggle={f.toggleCollapse}
            onFolderRename={f.renameFolder}
            onFolderDelete={f.deleteFolder}
            onMovePageToFolder={f.movePageToFolder}
            onRemovePageFromFolder={f.removePageFromFolder}
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
        />
      )}
      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) p.deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        /* "permanently removed … you can undo" contradicted itself in one
           sentence, and this door raises no toast (only the page-tab bar
           does), so "immediately after" pointed at a control that is not
           there. Undo is the keyboard one — walked live. */
        message="This page and everything on it is removed. Undo (⌘Z) brings it back."
        confirmLabel="Delete Page"
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
        message={`${(bulkDeleteIds ?? [])
          .map((id) => `“${p.pages.find((pg) => pg.id === id)?.name ?? id}”`)
          .join(", ")} are removed from this site. One undo (⌘Z) brings them all back.`}
        confirmLabel="Delete pages"
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
            onClose={closeSettings}
            initialTab={doorTab}
          />
        </SettingsErrorBoundary>
      )}
    </PanelFrame>
  );
};

export default PagesTab;
