/**
 * Media Tab v2 — Simplified shell matching .pen Screen 8 design.
 * Removed: Discovery view, Source bar, Type pills, subtitle, tip footer.
 * Light theme with ls- tokens.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Upload, AlertCircle, Trash2 } from "lucide-react";
import type { Composer } from "../../../../engine/Composer";
import { PanelHeader } from "../../shared/PanelHeader";
import { SearchBar } from "../../shared/SearchBar";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { LibraryView } from "./components/LibraryView";
import { OnboardingEmptyState } from "./components/OnboardingEmptyState";
import { SelectionBanner, UploadProgressBanner } from "./components/SelectionBanner";
import { UploadZone } from "./components/UploadZone";
import { useMediaState } from "./hooks/useMediaState";
import "./MediaTab.css";

interface MediaTabProps {
  composer: Composer | null;
  isPinned?: boolean;
  onPinToggle?: () => void;
  onHelpClick?: () => void;
  onClose?: () => void;
}

export function MediaTab({ composer, isPinned, onPinToggle, onHelpClick, onClose }: MediaTabProps) {
  if (!composer) {
    return (
      <div className="med-tab">
        <PanelHeader title="Media" isPinned={isPinned} onPinToggle={onPinToggle} onClose={onClose} />
        <div className="med-no-project">Open a project to manage your media files.</div>
      </div>
    );
  }

  return (
    <MediaTabInner
      composer={composer}
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
    />
  );
}

function MediaTabInner({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}: Omit<MediaTabProps, "composer"> & { composer: Composer }) {
  const state = useMediaState(composer);
  const ctxMenuRef = React.useRef<HTMLDivElement>(null);

  const isEmpty = state.libraryItems.length === 0 && state.uploadQueue.length === 0;

  // Context menu keyboard navigation
  React.useEffect(() => {
    if (!state.ctxMenu) return;
    const firstItem = ctxMenuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']");
    firstItem?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); state.closeCtxMenu(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(ctxMenuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []);
        const current = document.activeElement as HTMLButtonElement;
        const idx = items.indexOf(current);
        const next = e.key === "ArrowDown" ? items[(idx + 1) % items.length] : items[(idx - 1 + items.length) % items.length];
        next?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.ctxMenu, state.closeCtxMenu]);

  return (
    <div
      className="med-tab"
      onDragEnter={state.handlePanelDragEnter}
      onDragLeave={state.handlePanelDragLeave}
      onDragOver={state.handlePanelDragOver}
      onDrop={state.handlePanelDrop}
    >
      {/* Drag overlay */}
      {state.panelDragOver && (
        <div className="med-drag-overlay" aria-hidden="true">
          <Upload size={24} />
          <span className="med-drag-label">Drop to upload</span>
        </div>
      )}

      {/* Header */}
      <PanelHeader title="Media" isPinned={isPinned} onPinToggle={onPinToggle} onHelpClick={onHelpClick} onClose={onClose} />

      {/* Content */}
      <div className="med-content">
        {/* Search */}
        <div className="med-search-wrap">
          <SearchBar
            value={state.librarySearch}
            onChange={state.setLibrarySearch}
            placeholder="Search..."
            debounceMs={0}
          />
        </div>

        {/* Upload zone — always visible at top */}
        {!state.selMode && (
          <UploadZone
            storage={state.storage}
            onUpload={state.upload}
            uploadQueue={state.uploadQueue}
            disabled={state.storage.used >= state.storage.total}
          />
        )}

        {/* Upload progress — per-file banner (Screen 8m) */}
        {state.uploadQueue.filter((u) => u.status !== "complete" && u.status !== "error").slice(0, 1).map((u) => (
          <UploadProgressBanner
            key={u.fileName}
            fileName={u.fileName}
            progress={u.progress}
            onCancel={state.dismissFailedUploads}
          />
        ))}

        {/* Failure strip (Screen 8n — pd04L) */}
        {state.failedUploads.length > 0 && (
          <div className="med-failure-strip">
            <AlertCircle size={14} className="med-failure-icon" />
            <span className="med-failure-text">
              {state.failedUploads.length} upload{state.failedUploads.length !== 1 ? "s" : ""} failed
            </span>
            <button className="med-failure-retry" onClick={() => state.dismissFailedUploads()}>
              Retry All
            </button>
            <button className="med-failure-dismiss" onClick={() => state.dismissFailedUploads()} aria-label="Dismiss">
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Body — empty state or grid */}
        {isEmpty && !state.selMode ? (
          <OnboardingEmptyState
            activeType="all"
            onUpload={state.upload}
            onBrowseStock={() => {}}
          />
        ) : (
          <LibraryView
            items={state.libraryItems}
            uploadQueue={state.uploadQueue}
            activeType="all"
            counts={state.counts}
            sort={state.sort}
            sortDir={state.sortDir}
            gridN={3}
            fmtFilter={state.fmtFilter}
            selMode={state.selMode}
            selectedKeys={state.selectedKeys}
            searchQuery={state.librarySearch}
            onSort={state.setSort}
            onGridN={state.setGridN}
            onFmt={state.setFmtFilter}
            onSelToggle={state.toggleSelMode}
            onSelect={state.toggleSelect}
            onSelectAll={state.selectAll}
            onRequestBulkDelete={state.requestBulkDelete}
            onRequestDelete={state.requestDelete}
            onInsert={state.insertToCanvas}
            onCtxMenu={state.openCtxMenu}
            onDetail={state.openDetail}
          />
        )}
      </div>

      {/* Selection banner — bottom */}
      {state.selMode && (
        <SelectionBanner
          count={state.selectedKeys.size}
          onExit={state.toggleSelMode}
          onDelete={() => {
            const selectedItems = state.libraryItems.filter((i) => state.selectedKeys.has(i.key));
            state.requestBulkDelete(selectedItems);
          }}
        />
      )}

      {/* Context menu */}
      {state.ctxMenu && (
        <>
          <div
            ref={ctxMenuRef}
            className="med-ctx-menu"
            style={{ left: state.ctxMenu.x, top: state.ctxMenu.y }}
            role="menu"
            aria-label="Asset options"
          >
            <button className="med-ctx-item" role="menuitem" tabIndex={-1}
              onClick={() => { state.insertToCanvas(state.ctxMenu!.item.key); state.closeCtxMenu(); }}>
              Add to page
            </button>
            <button className="med-ctx-item" role="menuitem" tabIndex={-1}
              onClick={() => { state.openDetail(state.ctxMenu!.item); state.closeCtxMenu(); }}>
              Rename...
            </button>
            <div className="med-ctx-sep" />
            <button className="med-ctx-item" role="menuitem" tabIndex={-1}
              onClick={() => { state.copyUrl(state.ctxMenu!.item.src); state.closeCtxMenu(); }}>
              Copy URL
            </button>
            <div className="med-ctx-sep" />
            <button className="med-ctx-item med-ctx-item--danger" role="menuitem" tabIndex={-1}
              onClick={() => { state.requestDelete(state.ctxMenu!.item.key); state.closeCtxMenu(); }}>
              Delete
            </button>
          </div>
          <div className="med-ctx-backdrop" onClick={state.closeCtxMenu} aria-hidden="true" />
        </>
      )}

      {/* Overlays */}
      {state.confirmDelete && (
        <ConfirmDeleteModal
          payload={state.confirmDelete}
          onConfirm={state.executeDelete}
          onCancel={state.cancelDelete}
        />
      )}

      {state.detailItem && (
        <AssetDetailOverlay
          item={state.detailItem}
          onInsert={state.insertToCanvas}
          onRename={state.renameItem}
          onDelete={(key) => { state.requestDelete(key); state.closeDetail(); }}
          onClose={state.closeDetail}
        />
      )}
    </div>
  );
}
