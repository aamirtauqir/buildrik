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
import type { LibraryItem } from "./data/mediaTypes";
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
  const [actionBarItem, setActionBarItem] = React.useState<LibraryItem | null>(null);

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

        {/* Search result count (65ma7) */}
        {state.librarySearch.trim().length > 0 && state.libraryItems.length > 0 && (
          <div className="med-search-count">
            {state.libraryItems.length} result{state.libraryItems.length !== 1 ? "s" : ""} for &ldquo;{state.librarySearch.trim()}&rdquo;
          </div>
        )}

        {/* Search no results (fVg54) */}
        {state.librarySearch.trim().length > 0 && state.libraryItems.length === 0 && (
          <div className="med-search-noresults">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ls-text-lighter, #94A3B8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <p className="med-search-noresults-title">No media for &ldquo;{state.librarySearch.trim()}&rdquo;</p>
            <p className="med-search-noresults-sub">Try a different search term or clear the query.</p>
          </div>
        )}

        {/* Upload zone — always visible at top */}
        {!state.selMode && (
          <UploadZone
            storage={state.storage}
            onUpload={state.upload}
            disabled={state.storage.used >= state.storage.total}
          />
        )}

        {/* Upload progress — per-file banner (Screen 8m) */}
        {state.uploadQueue.filter((u) => u.status !== "complete" && u.status !== "error").slice(0, 1).map((u) => (
          <UploadProgressBanner
            key={u.fileName}
            fileName={u.fileName}
            progress={u.progress}
            showCancel={false}
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

        {/* Success banner (hoPrk) — all uploads completed */}
        {state.uploadQueue.length > 0 && state.uploadQueue.every((u) => u.status === "complete") && (
          <div className="med-success-strip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ls-success-text, #166534)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="med-success-text">
              {state.uploadQueue.filter((u) => u.status === "complete").length} file{state.uploadQueue.filter((u) => u.status === "complete").length !== 1 ? "s" : ""} uploaded
            </span>
            <span className="med-strip-spacer" />
            <button className="med-success-action">View newest</button>
          </div>
        )}

        {/* Amber partial failure banner (pd04L) */}
        {state.uploadQueue.some((u) => u.status === "complete") && state.failedUploads.length > 0 && (
          <div className="med-warning-strip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ls-warning-text, #92400E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span className="med-warning-text">
              {state.uploadQueue.filter((u) => u.status === "complete").length} uploaded, {state.failedUploads.length} failed
            </span>
            <span className="med-strip-spacer" />
            <button className="med-warning-action" onClick={() => state.dismissFailedUploads()}>
              Retry failed
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
            onCtxMenu={(e, item) => { state.openCtxMenu(e, item); setActionBarItem(item); }}
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

      {/* Item action bar (t8D67) — shown when item is right-clicked */}
      {!state.selMode && actionBarItem && (
        <div className="med-action-bar">
          <span className="med-action-bar-name">{actionBarItem.name}</span>
          <span className="med-strip-spacer" />
          <button className="med-action-btn" onClick={() => state.openDetail(actionBarItem)}>Preview</button>
          <button className="med-action-btn" onClick={() => state.openDetail(actionBarItem)}>Rename</button>
          <button className="med-action-btn med-action-btn--danger" onClick={() => {
            state.requestDelete(actionBarItem.key);
            setActionBarItem(null);
          }}>Delete</button>
        </div>
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
              onClick={() => { state.copyUrl(state.ctxMenu!.item.src); state.closeCtxMenu(); }}>
              Copy URL
            </button>
            <button className="med-ctx-item" role="menuitem" tabIndex={-1}
              onClick={() => {
                navigator.clipboard?.writeText(state.ctxMenu!.item.name).catch(() => {});
                state.closeCtxMenu();
              }}>
              Copy Name
            </button>
            <button className="med-ctx-item" role="menuitem" tabIndex={-1}
              onClick={() => { state.openDetail(state.ctxMenu!.item); state.closeCtxMenu(); }}>
              Rename...
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
