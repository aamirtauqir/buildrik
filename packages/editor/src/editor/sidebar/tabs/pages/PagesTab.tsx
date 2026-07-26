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
import { Button, ConfirmDialog, EmptyState, EmptyStateActions, EmptyStateDesc, EmptyStateTitle, PanelFrame } from "@/editor/ui";
import type { Composer } from "../../../../engine";
import { PageCommandPalette } from "./components/PageCommandPalette";
import { PageContextMenu } from "./components/PageContextMenu";
import { PageList } from "./components/PageList";
import { SearchListingsTable } from "./components/SearchListingsTable";
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

  // Redesign P4 (50-pages): the panel has two views — the page tree ("Pages")
  // and the whole-site search-listings table ("Search listings"). Default to the
  // tree; the table is the SEO-at-a-glance view that scales past a few pages.
  const [view, setView] = React.useState<"pages" | "listings">("pages");

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
      return;
    }
    deletable.forEach((id) => p.deletePage(id));
    bulk.clearSelection();
  }, [bulk.selectedIds, p.pages, p.deletePage, orderedPageIds, bulk.clearSelection]);

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
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      >
        <Button
          kind="ghost"
          size="sm"
          style={{ display: "inline-grid", placeItems: "center", width: 26, height: 22, padding: 0 }}
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
        >
          <span style={{ font: "500 10px var(--bk-font-mono)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--bk-border)", background: "var(--bk-bg-subtle)", color: "var(--bk-ink-muted)" }}>
            ⌘K
          </span>
        </Button>
      </PanelFrame.Header>
      {/* Error state — takes priority over everything */}
      {p.loadError ? (
        <PanelFrame.Body>
          <EmptyState size="compact" style={{ margin: "var(--bk-space-12)" }} role="alert" aria-live="assertive">
            <EmptyStateTitle>{p.loadError}</EmptyStateTitle>
            <EmptyStateDesc>Your connection dropped. Work is safe — nothing was lost.</EmptyStateDesc>
            <EmptyStateActions>
              <Button kind="secondary" size="sm" onClick={p.retrySync}>
                Try again
              </Button>
            </EmptyStateActions>
          </EmptyState>
        </PanelFrame.Body>
      ) : (
        <PanelFrame.Body noScroll>
          {/* View segment — page tree vs whole-site search-listings (50-pages) */}
          <div
            role="tablist"
            aria-label="Pages view"
            style={{
              display: "inline-flex",
              margin: "8px 12px 0",
              border: "1px solid var(--bk-border)",
              borderRadius: 4,
              overflow: "hidden",
              alignSelf: "flex-start",
            }}
          >
            {([["pages", "Pages"], ["listings", "Search listings"]] as const).map(([v, label], i) => {
              const on = view === v;
              return (
                <Button
                  key={v}
                  kind="ghost"
                  size="sm"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setView(v)}
                  style={{
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: on ? 600 : 400,
                    borderRadius: 0,
                    borderRight: i === 0 ? "1px solid var(--bk-border)" : undefined,
                    background: on ? "var(--bk-accent)" : "transparent",
                    color: on ? "var(--bk-accent-on)" : "var(--bk-ink-muted)",
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </div>
          {view === "listings" ? (
            <SearchListingsTable pages={p.pages} onEditPage={p.openSettings} />
          ) : (
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
          )}
        </PanelFrame.Body>
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
        open={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) p.deletePage(deleteTargetId);
          setDeleteTargetId(null);
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        message="All content on this page will be permanently removed. You can undo immediately after."
        confirmLabel="Delete Page"
        destructive
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
    </PanelFrame>
  );
};

export default PagesTab;
