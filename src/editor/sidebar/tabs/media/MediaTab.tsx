/**
 * Media Tab — Shell Component
 * 7 fixed zones: header, subtitle, source bar, type pills, search, body, upload zone.
 * All state lives in useMediaState. No state in this component.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useEffect, useRef } from "react";
import type { Composer } from "../../../../engine/Composer";
import { PanelHeader } from "../../shared/PanelHeader";
import { AssetDetailOverlay } from "./components/AssetDetailOverlay";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";
import { DiscoveryView } from "./components/DiscoveryView";
import { LibraryView } from "./components/LibraryView";
import { OnboardingEmptyState } from "./components/OnboardingEmptyState";
import { SelectionBanner } from "./components/SelectionBanner";
import { TypePills } from "./components/TypePills";
import { UploadZone } from "./components/UploadZone";
import { MEDIA_TIP_TEXT } from "./data/mediaData";
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
      <div className="med-tab" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <PanelHeader
          title="Media"
          isPinned={isPinned}
          onPinToggle={onPinToggle}
          onHelpClick={onHelpClick}
          onClose={onClose}
        />
        <div
          style={{
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--aqb-text-muted)",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Open a project to manage your media files.
        </div>
      </div>
    );
  }

  return (
    <MediaTabWithComposer
      composer={composer}
      isPinned={isPinned}
      onPinToggle={onPinToggle}
      onHelpClick={onHelpClick}
      onClose={onClose}
    />
  );
}

function MediaTabWithComposer({
  composer,
  isPinned,
  onPinToggle,
  onHelpClick,
  onClose,
}: Omit<MediaTabProps, "composer"> & { composer: Composer }) {
  const state = useMediaState(composer);
  const isDisc = state.source === "disc";
  const ctxMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state.ctxMenu) return;
    // Focus first item when menu opens
    const firstItem = ctxMenuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']");
    firstItem?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        state.closeCtxMenu();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(
          ctxMenuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []
        );
        const current = document.activeElement as HTMLButtonElement;
        const idx = items.indexOf(current);
        const next =
          e.key === "ArrowDown"
            ? items[(idx + 1) % items.length]
            : items[(idx - 1 + items.length) % items.length];
        next?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.ctxMenu, state.closeCtxMenu]);
  const isFull = state.storage.used >= state.storage.total;
  const isEmpty = state.libraryItems.length === 0 && state.uploadQueue.length === 0;

  const handleLibrarySearch = (q: string) => state.setLibrarySearch(q);
  const handleDiscSearch = (q: string) => state.discSearchAll(q);

  return (
    <div
      className="med-tab"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
      onDragEnter={state.handlePanelDragEnter}
      onDragLeave={state.handlePanelDragLeave}
      onDragOver={state.handlePanelDragOver}
      onDrop={state.handlePanelDrop}
    >
      {/* Panel drag overlay */}
      {state.panelDragOver && (
        <div className="med-drag-overlay" aria-hidden="true">
          <div className="med-drag-label">Drop to upload</div>
        </div>
      )}

      {/* Zone 1: Header */}
      <PanelHeader
        title="Media"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* Zone 2: Subtitle */}
      <p className="med-subtitle">Click to insert · Drag to canvas</p>

      {/* Zone 3: Source bar */}
      <div className="med-source-bar">
        <button
          className={`med-src-btn${!isDisc ? " active" : ""}`}
          onClick={() => state.setSource("mine")}
          aria-pressed={!isDisc}
        >
          My Library
        </button>
        <button
          className={`med-src-btn${isDisc ? " active" : ""}`}
          onClick={() => state.setSource("disc")}
          aria-pressed={isDisc}
        >
          Discovery
        </button>
      </div>

      {/* Zone 4: Type pills */}
      <TypePills
        activeType={state.activeType}
        counts={state.counts}
        discMode={isDisc}
        onTypeChange={state.setType}
      />

      {/* Zone 5: Search (independent state per source) */}
      <div className="med-search-row">
        <div className="med-search">
          <svg
            className="med-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder={isDisc ? "Search coming soon…" : "Search my files…"}
            value={isDisc ? state.discoverySearch : state.librarySearch}
            disabled={isDisc}
            onChange={(e) =>
              isDisc ? handleDiscSearch(e.target.value) : handleLibrarySearch(e.target.value)
            }
            aria-label={isDisc ? "Search Discovery (coming soon)" : "Search library"}
          />
          {(isDisc ? state.discoverySearch : state.librarySearch) && (
            <button
              className="med-search-clear"
              onClick={() => (isDisc ? handleDiscSearch("") : handleLibrarySearch(""))}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Zone 6: Body */}
      {isDisc ? (
        <DiscoveryView
          activeType={state.activeType}
          photos={state.stockPhotos}
          videos={state.stockVideos}
          icons={state.discIcons}
          fonts={state.discFonts}
          loading={state.discLoading}
          searchQuery={state.discoverySearch}
          onSearch={handleDiscSearch}
          onLoadMore={state.loadMoreDisc}
          onSave={state.saveToLibrary}
          onInsert={state.insertToCanvas}
        />
      ) : isEmpty && !state.selMode ? (
        <OnboardingEmptyState
          activeType={state.activeType}
          onUpload={state.upload}
          onDiscovery={() => state.setSource("disc")}
        />
      ) : (
        <LibraryView
          items={state.libraryItems}
          uploadQueue={state.uploadQueue}
          activeType={state.activeType}
          counts={state.counts}
          sort={state.sort}
          sortDir={state.sortDir}
          gridN={state.gridN}
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

      {/* Zone 7: Upload zone (Library only) — hide when empty-state already shows upload button */}
      {!isDisc && !(isEmpty && !state.selMode) && (
        <UploadZone
          storage={state.storage}
          onUpload={state.upload}
          uploadQueue={state.uploadQueue}
          disabled={isFull}
        />
      )}

      {/* Dismissable single tip footer */}
      {!state.tipDismissed && !isDisc && (
        <div className="med-tip-footer">
          <div className="med-tip-row">
            <div className="med-tip-icon" aria-hidden="true">
              💡
            </div>
            <p className="med-tip-text">{MEDIA_TIP_TEXT}</p>
            <button className="med-tip-dismiss" onClick={state.dismissTip} aria-label="Dismiss tip">
              ×
            </button>
          </div>
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
            <button
              className="med-ctx-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                state.insertToCanvas(state.ctxMenu!.item.key);
                state.closeCtxMenu();
              }}
            >
              Add to page
            </button>
            <button
              className="med-ctx-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                state.openDetail(state.ctxMenu!.item);
                state.closeCtxMenu();
              }}
            >
              Rename…
            </button>
            <div className="med-ctx-sep" />
            <button
              className="med-ctx-item"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                state.copyUrl(state.ctxMenu!.item.src);
                state.closeCtxMenu();
              }}
            >
              Copy URL
            </button>
            <div className="med-ctx-sep" />
            <button
              className="med-ctx-item danger"
              role="menuitem"
              tabIndex={-1}
              onClick={() => {
                state.requestDelete(state.ctxMenu!.item.key);
                state.closeCtxMenu();
              }}
            >
              Delete
            </button>
          </div>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 8999 }}
            onClick={state.closeCtxMenu}
            aria-hidden="true"
          />
        </>
      )}

      {/* Overlays */}
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
          onDelete={(key) => {
            state.requestDelete(key);
            state.closeDetail();
          }}
          onClose={state.closeDetail}
        />
      )}
    </div>
  );
}
