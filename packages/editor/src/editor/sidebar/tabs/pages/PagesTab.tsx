import { Button } from "@/editor/shared/vibcoder/Button";
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
import type { Composer } from "../../../../engine";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import { PanelShell } from "@shared/ui/panel";
import { PageCommandPalette } from "./components/PageCommandPalette";
import { PageContextMenu } from "./components/PageContextMenu";
import { PageList } from "./components/PageList";
import { PageSettingsDrawer } from "./page-settings/PageSettingsDrawer";
import { SettingsErrorBoundary } from "./page-settings/SettingsErrorBoundary";
import { usePages } from "./usePages";
import { useFolders } from "./useFolders";
import { useBulkSelect } from "./useBulkSelect";
import "./PagesTab.css";

export interface PagesTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
  /** Called when user clicks "From Template" — parent should switch to Templates tab */
  onRequestTemplates?: () => void;
}

export const PagesTab: React.FC<PagesTabProps> = ({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
  onRequestTemplates,
}) => {
  const p = usePages(composer);

  // Folders — sidebar-only, localStorage-persisted
  const composerId = (composer as { id?: string } | null)?.id ?? null;
  const livePageIds = React.useMemo(
    () => new Set(p.pages.map((pg) => pg.id)),
    [p.pages]
  );
  const f = useFolders(composerId, livePageIds);
  const bulk = useBulkSelect();

  // Prune stale folder references when pages are deleted
  React.useEffect(() => {
    f.pruneDeletedPages(livePageIds);
  }, [livePageIds, f.pruneDeletedPages]);

  // Delete confirmation state — UI concern lives here, not in usePages
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const deleteTarget = p.pages.find((pg) => pg.id === deleteTargetId);

  // Name conflict error state (Screen GoEJk)
  const [nameError, setNameError] = React.useState<string | null>(null);

  // ⌘K command palette
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Settings drawer — resolve the active page from the id stored in usePages
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

  const handleBulkDelete = React.useCallback(() => {
    const deletable = [...bulk.selectedIds].filter((id) => {
      const pg = p.pages.find((x) => x.id === id);
      return pg && !pg.isHome && p.pages.length > bulk.selectedIds.size;
    });
    deletable.forEach((id) => p.deletePage(id));
    bulk.clearSelection();
  }, [bulk.selectedIds, p.pages, p.deletePage, bulk.clearSelection]);

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
    // controls sizing. PanelShell fills the host via width:100%.
    <PanelShell className={`bd-pg-panel${bulk.hasSelection ? " bulk-mode" : ""}`}>
      <PanelShell.Header
        title="Pages"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <Button
          className="bd-pg-panel-kbd-btn"
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <span className="bd-pg-panel-kbd">⌘K</span>
        </Button>
      </PanelShell.Header>
      {/* Error state — takes priority over everything */}
      {p.loadError ? (
        <PanelShell.Content>
          <div className="bd-pg-error" role="alert" aria-live="assertive">
            <div className="bd-pg-error-msg">{p.loadError}</div>
            <div className="bd-pg-error-sub">Your connection dropped. Work is safe — nothing was lost.</div>
            <Button className="bd-pg-error-retry" onClick={p.retrySync}>
              Try again
            </Button>
          </div>
        </PanelShell.Content>
      ) : (
        <PanelShell.Content noScroll>
          <PageList
            pages={p.pages}
            renamingPageId={p.renamingPageId}
            nameError={nameError}
            canSearch={p.canSearch}
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
            onSettingsClick={p.openSettings}
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
        </PanelShell.Content>
      )}
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
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) p.deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        message="All content on this page will be permanently removed. You can undo immediately after."
        confirmText="Delete Page"
        variant="danger"
      />
      {/* ⌘K command palette */}
      {paletteOpen && (
        <PageCommandPalette
          pages={p.pages}
          onSelect={p.selectPage}
          onClose={() => setPaletteOpen(false)}
        />
      )}
      {/* Page settings drawer — opened by gear / context-menu via openSettings */}
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
    </PanelShell>
  );
};

export default PagesTab;
