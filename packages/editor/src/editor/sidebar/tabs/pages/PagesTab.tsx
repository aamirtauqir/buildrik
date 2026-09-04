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
import { ConfirmDialog, EmptyState, EmptyStateActions, EmptyStateDesc, EmptyStateTitle, PanelFrame, Button } from "@/editor/chrome-ui";
import type { Composer } from "../../../../engine";
import { PageCommandPalette } from "./components/PageCommandPalette";
import { PageContextMenu } from "./components/PageContextMenu";
import { PageList } from "./components/PageList";
import { SiteStructureTree } from "./components/SiteStructureTree";
import { SearchListingsTable } from "./components/SearchListingsTable";
import { PageSettingsDrawer } from "./page-settings/PageSettingsDrawer";
import { useDirtyPages } from "@/editor/shared/useDirtyPages";
import { SettingsErrorBoundary } from "./page-settings/SettingsErrorBoundary";
import { usePages } from "./usePages";
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
}

export const PagesTab: React.FC<PagesTabProps> = ({
  composer,
  isExpanded,
  onExpandToggle,
  onHelpClick,
  onClose,
  onRequestTemplates,
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

  // ⌘K command palette
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Redesign P4 (50-pages): the panel has two views — the page tree ("Pages")
  // and the whole-site search-listings table ("Search listings"). Default to the
  // tree; the table is the SEO-at-a-glance view that scales past a few pages.
  const [view, setView] = React.useState<"pages" | "listings" | "structure">("pages");

  // Settings drawer — resolve the active page from the id stored in usePages
  const dirtyPages = useDirtyPages(composer);
  const settingsPage = p.settingsPageId
    ? p.pages.find((pg) => pg.id === p.settingsPageId) ?? null
    : null;

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

  // ⌘K / Ctrl+K shortcut — open command palette; Escape — clear bulk selection
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if (e.key === "Escape" && bulk.hasSelection) {
        bulk.clearSelection();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bulk.hasSelection, bulk.clearSelection]);

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

  const confirmBulkDelete = React.useCallback(() => {
    (bulkDeleteIds ?? []).forEach((id) => p.deletePage(id));
    setBulkDeleteIds(null);
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
    <PanelFrame className={`bd-pg-panel${bulk.hasSelection ? " bulk-mode" : ""}`}>
      <PanelFrame.Header
        title="Pages"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <Button
          color="light"
          size="xs"
          style={{ display: "inline-grid", placeItems: "center", width: 26, height: 22, padding: 0 }}
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette" className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
        >
          <span style={{ font: "500 11px var(--bk-font-mono)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--bk-border)", background: "var(--bk-bg-subtle)", color: "var(--bk-ink-muted)" }}>
            ⌘K
          </span>
        </Button>
      </PanelFrame.Header>
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
            onOpenListings={() => setView("listings")}
            onOpenStructure={() => setView("structure")}
            openContextMenuPageId={p.contextMenu?.pageId ?? null}
            composer={composer}
            folders={f.folders}
            pageToFolder={f.pageToFolder}
            selectedIds={bulk.selectedIds}
            onAddPage={p.addPage}
            onAddFolder={() => f.createFolder("New Folder")}
            onSelectPage={p.selectPage}
            onToggleSelect={handleToggleSelect}
            onBulkDuplicate={handleBulkDuplicate}
            onBulkMoveToFolder={handleBulkMoveToFolder}
            onBulkRemoveFromFolders={handleBulkRemoveFromFolders}
            onBulkDelete={handleBulkDelete}
            onClearSelection={bulk.clearSelection}
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
      />

      {/* ⌘K command palette */}
      {paletteOpen && (
        <PageCommandPalette
          pages={p.pages}
          onSelect={p.selectPage}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {/* Page settings drawer — opened via openSettings, from the row's
          context menu ("Page settings…") or a Listings row. The per-row gear
          it used to name was deleted with the row action strip. */}
      {settingsPage && (
        <SettingsErrorBoundary onClose={p.closeSettings}>
          <PageSettingsDrawer
            page={settingsPage}
            allPages={p.pages}
            composer={composer}
            onClose={p.closeSettings}
          />
        </SettingsErrorBoundary>
      )}
    </PanelFrame>
  );
};

export default PagesTab;
