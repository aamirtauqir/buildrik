/**
 * Media Tab — Shell Component
 * 5 fixed zones: header, source bar, type pills, body, upload zone.
 * All state lives in useMediaState. No state in this component.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useState } from "react";
import type { Composer } from "../../../../engine/Composer";
import { PanelHeader } from "../../shared/PanelHeader";
import { DiscoveryView } from "./DiscoveryView";
import { LibraryView } from "./LibraryView";
import { MEDIA_TIPS } from "./mediaData";
import type { LibraryItem } from "./mediaTypes";
import { fmtDur, fmtSize } from "./mediaUtils";
import { TypePills } from "./TypePills";
import { UploadZone } from "./UploadZone";
import { useMediaState } from "./useMediaState";

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
  const [searchVal, setSearchVal] = useState(state.searchQuery);
  const isDisc = state.source === "disc";

  // Sync search field → state (with local controlled value for responsiveness)
  const handleSearch = (q: string) => {
    setSearchVal(q);
    state.setSearch(q);
    if (isDisc) state.discSearchAll(q);
  };

  const tipText = MEDIA_TIPS[state.tipIdx % MEDIA_TIPS.length]?.text ?? "";

  return (
    <div
      className="med-tab"
      style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}
    >
      {/* ── Zone 1: Header ── */}
      <PanelHeader
        title="Media"
        isPinned={isPinned}
        onPinToggle={onPinToggle}
        onHelpClick={onHelpClick}
        onClose={onClose}
      />

      {/* ── Zone 2: Source bar (My Library | Discovery) ── */}
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

      {/* ── Search (Library only) ── */}
      {!isDisc && (
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
              placeholder="Search my files…"
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search library"
            />
            {searchVal && (
              <button
                className="med-search-clear"
                onClick={() => handleSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Zone 3: Type pills ── */}
      <TypePills
        activeType={state.activeType}
        counts={state.counts}
        discMode={isDisc}
        onTypeChange={state.setType}
      />

      {/* ── Zone 4: Body (scrollable) ── */}
      {isDisc ? (
        <DiscoveryView
          activeType={state.activeType}
          photos={state.stockPhotos}
          videos={state.stockVideos}
          icons={state.discIcons}
          fonts={state.discFonts}
          loading={state.discLoading}
          searchQuery={searchVal}
          onSearch={handleSearch}
          onLoadMore={state.loadMoreDisc}
          onSave={state.saveToLibrary}
          onInsert={state.insertToCanvas}
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
          searchQuery={state.searchQuery}
          onSort={state.setSort}
          onGridN={state.setGridN}
          onFmt={state.setFmtFilter}
          onSelToggle={state.toggleSelMode}
          onSelect={state.toggleSelect}
          onSelectAll={state.selectAll}
          onBulkDelete={state.bulkDelete}
          onDelete={state.deleteItem}
          onInsert={state.insertToCanvas}
          onRename={state.renameItem}
          onCtxMenu={state.openCtxMenu}
          onDetail={state.openDetail}
        />
      )}

      {/* ── Zone 5: Upload zone (Library only) ── */}
      {!isDisc && (
        <UploadZone
          storage={state.storage}
          onUpload={state.upload}
          uploadQueue={state.uploadQueue}
        />
      )}

      {/* ── Tip footer ── */}
      {!state.tipDismissed && tipText && (
        <div className="med-tip-footer">
          <div className="med-tip-row">
            <div className="med-tip-icon" aria-hidden="true">
              💡
            </div>
            <p className="med-tip-text">{tipText}</p>
            <button
              className="med-tip-dismiss"
              onClick={state.dismissTips}
              aria-label="Dismiss tips"
            >
              ×
            </button>
          </div>
          <div className="med-tip-dots" aria-hidden="true">
            {MEDIA_TIPS.map((_, i) => (
              <div
                key={i}
                className={`med-tip-dot${i === state.tipIdx % MEDIA_TIPS.length ? " active" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Context menu overlay ── */}
      {state.ctxMenu && (
        <div
          className="med-ctx-menu"
          style={{ left: state.ctxMenu.x, top: state.ctxMenu.y }}
          role="menu"
        >
          <div
            className="med-ctx-item"
            role="menuitem"
            onClick={() => {
              state.insertToCanvas(state.ctxMenu!.item.key);
              state.closeCtxMenu();
            }}
          >
            Insert to canvas
          </div>
          <div
            className="med-ctx-item"
            role="menuitem"
            onClick={() => {
              navigator.clipboard?.writeText(state.ctxMenu!.item.name);
              state.closeCtxMenu();
            }}
          >
            Copy name
          </div>
          <div className="med-ctx-sep" />
          <div
            className="med-ctx-item danger"
            role="menuitem"
            onClick={() => {
              state.deleteItem(state.ctxMenu!.item.key);
              state.closeCtxMenu();
            }}
          >
            Delete
          </div>
        </div>
      )}

      {/* Backdrop to close context menu */}
      {state.ctxMenu && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 8999 }}
          onClick={state.closeCtxMenu}
          aria-hidden="true"
        />
      )}

      {/* ── Detail overlay ── */}
      {state.detailItem && (
        <DetailOverlay
          item={state.detailItem}
          onRename={state.renameItem}
          onDelete={state.deleteItem}
          onInsert={state.insertToCanvas}
          onClose={state.closeDetail}
        />
      )}
    </div>
  );
}

// ─── Detail overlay (inline — no separate file needed) ─────────────────────

function DetailOverlay({
  item,
  onRename,
  onDelete,
  onInsert,
  onClose,
}: {
  item: LibraryItem;
  onRename(key: string, name: string): void;
  onDelete(key: string): void;
  onInsert(key: string): void;
  onClose(): void;
}) {
  const [name, setName] = useState(item.name);

  const commit = () => {
    if (name.trim() && name !== item.name) onRename(item.key, name.trim());
  };

  return (
    <div className="med-detail-overlay">
      <div className="med-detail-preview">
        {item.type === "vid" ? (
          <video src={item.src} controls style={{ maxWidth: "100%", maxHeight: "100%" }} />
        ) : (
          <img src={item.thumb ?? item.src} alt={item.name} />
        )}
      </div>

      <div className="med-detail-body">
        {/* Editable name */}
        <div className="med-detail-name-row">
          <input
            className="med-detail-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setName(item.name);
                (e.target as HTMLInputElement).blur();
              }
            }}
            aria-label="File name"
          />
        </div>

        {/* Meta rows */}
        <div className="med-detail-meta">
          <div className="med-detail-row">
            <span className="med-detail-key">Size</span>
            <span className="med-detail-val">{fmtSize(item.size)}</span>
          </div>
          {item.width && item.height && (
            <div className="med-detail-row">
              <span className="med-detail-key">Dimensions</span>
              <span className="med-detail-val">
                {item.width} × {item.height}
              </span>
            </div>
          )}
          {item.duration != null && (
            <div className="med-detail-row">
              <span className="med-detail-key">Duration</span>
              <span className="med-detail-val">{fmtDur(item.duration as number)}</span>
            </div>
          )}
          <div className="med-detail-row">
            <span className="med-detail-key">Type</span>
            <span className="med-detail-val">{item.mimeType}</span>
          </div>
          <div className="med-detail-row">
            <span className="med-detail-key">Added</span>
            <span className="med-detail-val">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="med-upload-zone" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="med-upload-btn"
            style={{ flex: 1, height: 30 }}
            onClick={() => onInsert(item.key)}
          >
            Insert to canvas
          </button>
          <button
            className="med-bulk-btn danger"
            style={{ height: 30 }}
            onClick={() => {
              onDelete(item.key);
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        className="med-detail-back"
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          background: "rgba(0,0,0,.5)",
          border: "none",
          borderRadius: 6,
          color: "#fff",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: 11,
        }}
        onClick={onClose}
        aria-label="Back"
      >
        ← Back
      </button>
    </div>
  );
}
