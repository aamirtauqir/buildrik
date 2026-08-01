/**
 * AssetGrid — D5 Stage 3 extraction (audit-remediation 2026-05-08).
 *
 * The MIDDLE asset grid + subbar + bulk-toolbar + grid-foot all live
 * here, lifted out of LibraryManager. Owns its own viewMode (grid
 * vs list), sort menu open state, and bulk-move picker open state —
 * those are pure UI toggles that have no readers outside this panel.
 *
 * Pre-extraction: lines 332-608 of LibraryManager.tsx (~276 LOC).
 *
 * Virtualization deferred — see comment block below.
 *
 * @license BSD-3-Clause
 */

/*
 * Why no react-window virtualization (deferred from audit Step 3):
 *
 * The audit recommended adding react-window FixedSizeGrid for perf,
 * with the rationale "premature opt is cheap; perf cliff is invisible
 * until it bites." Two reasons that's wrong here:
 *
 *   1. The existing `.mgr-grid` layout is driven by CSS Grid
 *      (`grid-template-columns: repeat(5, 1fr)`, dropping to 4 below
 *      1320px). Virtualization would have to reimplement column
 *      math in JS — duplicating CSS responsive behavior and risking
 *      drift.
 *   2. `state.gridN` is unused in this component (consumed by a
 *      sibling LibraryView.tsx at the sidebar-tab level). Adding
 *      virtualization that respects gridN would expand its surface
 *      without a real consumer here.
 *
 * Better trigger: real-user evidence of a perf cliff (e.g., user
 * libraries with 1000+ assets reporting jank). When that evidence
 * arrives, pick FixedSizeList with row-batching (chunk visibleItems
 * into rows of `Math.ceil(containerWidth / cardMinWidth)`) so the
 * CSS Grid responsive behavior collapses to a single dimension that
 * react-window can virtualize.
 */

import {
  Check,
  ChevronDown,
  FolderOpen,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import * as React from "react";
import type {
  LibraryItem,
  MediaSortBy,
  MediaStateResult,
  MediaTypeFilter,
} from "../../sidebar/tabs/media/data/mediaTypes";
import type { SmartFolder } from "./FolderTree";
import { formatBytes } from "@shared/utils/helpers/number";
import { Button } from "@/editor/chrome-ui";
// ─── Toast contract (matches @/editor/chrome-ui useToast) ───────────────────────

type ToastTone = "info" | "success" | "error" | "warning";
interface ToastInput {
  description: string;
  tone?: ToastTone;
  duration?: number;
}

// ─── Constants (kept here — sibling of "what tabs exist" pattern) ────────

const TYPE_PILLS: ReadonlyArray<{ id: MediaTypeFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "img", label: "Images" },
  { id: "vid", label: "Videos" },
  { id: "ico", label: "Icons" },
  { id: "fnt", label: "Fonts" },
];

const SORT_OPTIONS: ReadonlyArray<{ value: MediaSortBy; label: string }> = [
  { value: "date", label: "Recent" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "type", label: "Type" },
];

// ─── Props ────────────────────────────────────────────────────────────────

export interface AssetGridProps {
  state: MediaStateResult;
  /** Items after smart-folder + search filter (orchestrator-computed). */
  visibleItems: LibraryItem[];
  /** key → usage count (orchestrator-computed against composer). */
  usageMap: Map<string, number>;
  /** Smart folder gating the visibleItems filter (drives footer label). */
  smartFolder: SmartFolder;
  /** Breadcrumb path for the footer label. */
  breadcrumbPath: { id: string | null; name: string }[];
  /** Selected item highlight + click target. */
  selectedAssetId: string | null;
  onSelectAsset(key: string): void;
  /** Empty-state hero buttons. */
  onUploadClick(): void;
  onOpenStockModal(): void;
  /** Bulk-move toast trigger. */
  addToast(t: ToastInput): void;
}

// ─── Component ────────────────────────────────────────────────────────────

export function AssetGrid({
  state,
  visibleItems,
  usageMap,
  smartFolder,
  breadcrumbPath,
  selectedAssetId,
  onSelectAsset,
  onUploadClick,
  onOpenStockModal,
  addToast,
}: AssetGridProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [bulkMovePickerOpen, setBulkMovePickerOpen] = React.useState(false);

  return (
    <div className="mgr-main">
      {/* Bulk action toolbar (multi-select mode) */}
      {state.selMode && state.selectedKeys.size > 0 && (
        <div className="mgr-bulk-bar">
          <span className="mgr-bulk-count">{state.selectedKeys.size} selected</span>
          {/* Bug #4 fix: Move → folder picker popover */}
          <div className="mgr-sort-wrap">
            <Button className="mgr-btn" onClick={() => setBulkMovePickerOpen((o) => !o)}>
              <FolderOpen size={12} /> Move to...
            </Button>
            {bulkMovePickerOpen && (
              <>
                <div
                  className="mgr-sort-scrim"
                  onClick={() => setBulkMovePickerOpen(false)}
                />
                <div
                  className="mgr-sort-menu"
                  style={{ minWidth: 200, maxHeight: 280, overflowY: "auto" }}
                >
                  <Button
                    className="mgr-sort-item"
                    onClick={() => {
                      const keys = Array.from(state.selectedKeys);
                      state.bulkMoveAssets(keys, null);
                      addToast({
                        description: `Moved ${keys.length} to root`,
                        tone: "success",
                      });
                      setBulkMovePickerOpen(false);
                      state.toggleSelMode();
                    }}
                  >
                    <FolderOpen size={12} /> Root
                  </Button>
                  {state.folders.length > 0 && <div className="mgr-sort-sep" />}
                  {state.folders.map((folder) => (
                    <Button
                      key={folder.id}
                      className="mgr-sort-item"
                      onClick={() => {
                        const keys = Array.from(state.selectedKeys);
                        state.bulkMoveAssets(keys, folder.id);
                        addToast({
                          description: `Moved ${keys.length} to ${folder.name}`,
                          tone: "success",
                        });
                        setBulkMovePickerOpen(false);
                        state.toggleSelMode();
                      }}
                    >
                      <div
                        className="mgr-folder-dot"
                        style={{ background: "var(--bk-warning)" }}
                      />
                      {folder.name}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
          <Button
            className="mgr-btn danger"
            onClick={() => {
              const items = state.libraryItems.filter((i) => state.selectedKeys.has(i.key));
              state.requestBulkDelete(items);
            }}
          >
            <Trash2 size={12} /> Delete
          </Button>
          <div className="mgr-spacer" />
          <Button className="mgr-btn" onClick={state.selectAll}>
            Select all
          </Button>
          <Button className="mgr-btn" onClick={state.toggleSelMode}>
            Cancel
          </Button>
        </div>
      )}

      <div className="mgr-subbar">
        <div className="mgr-pills">
          {TYPE_PILLS.map((pill) => (
            <Button
              key={pill.id}
              className={`mgr-pill${state.activeType === pill.id ? " active" : ""}`}
              onClick={() => state.setType(pill.id)}
            >
              {pill.label}
              {state.counts[pill.id] > 0 && (
                <span style={{ marginLeft: 4, opacity: 0.7 }}>{state.counts[pill.id]}</span>
              )}
            </Button>
          ))}
        </div>
        <div className="mgr-spacer" />
        {/* Bug #3 fix: Sort dropdown */}
        <div className="mgr-sort-wrap">
          <Button className="mgr-sort" onClick={() => setSortMenuOpen((o) => !o)}>
            <SlidersHorizontal size={12} />
            Sort: {SORT_OPTIONS.find((o) => o.value === state.sort)?.label || "Recent"}
            <ChevronDown size={12} />
          </Button>
          {sortMenuOpen && (
            <>
              <div className="mgr-sort-scrim" onClick={() => setSortMenuOpen(false)} />
              <div className="mgr-sort-menu">
                {SORT_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    className={`mgr-sort-item${state.sort === opt.value ? " active" : ""}`}
                    onClick={() => {
                      state.setSort(opt.value, state.sortDir);
                      setSortMenuOpen(false);
                    }}
                  >
                    {opt.label}
                    {state.sort === opt.value && <Check size={12} />}
                  </Button>
                ))}
                <div className="mgr-sort-sep" />
                <Button
                  className="mgr-sort-item"
                  onClick={() => {
                    state.setSort(state.sort, state.sortDir === "asc" ? "desc" : "asc");
                    setSortMenuOpen(false);
                  }}
                >
                  {state.sortDir === "asc" ? "Ascending ↑" : "Descending ↓"}
                </Button>
              </div>
            </>
          )}
        </div>
        <div className="mgr-view-toggle">
          <Button
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <Grid2X2 size={12} />
          </Button>
          <Button
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <List size={12} />
          </Button>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className={viewMode === "grid" ? "mgr-grid" : "mgr-list"}>
          {visibleItems.map((item) => {
            const isSelected = selectedAssetId === item.key;
            const thumbContent =
              (item.type === "img" || item.type === "vid") && item.thumb ? (
                <img src={item.thumb || item.src} alt={item.name} loading="lazy" />
              ) : item.type === "ico" ? (
                <img
                  src={item.src}
                  alt={item.name}
                  style={{ width: 36, height: 36, objectFit: "contain" }}
                />
              ) : item.type === "fnt" ? (
                <span
                  style={{
                    fontSize: viewMode === "list" ? 18 : 32,
                    fontWeight: 700,
                    color: "var(--bk-ink)",
                  }}
                >
                  Aa
                </span>
              ) : (
                <img src={item.src} alt={item.name} loading="lazy" />
              );

            // Drag data for canvas drop.
            const onDragStart = (e: React.DragEvent) => {
              e.dataTransfer.setData("application/x-aquibra-media-src", item.src);
              e.dataTransfer.setData("application/x-aquibra-media-type", item.type);
              e.dataTransfer.setData("application/x-aquibra-media-name", item.name);
              e.dataTransfer.effectAllowed = "copy";
            };

            // Bug #10 fix: Cmd/Ctrl enters multi-select; in selMode, regular click toggles.
            const onClick = (e: React.MouseEvent) => {
              if (e.metaKey || e.ctrlKey) {
                if (!state.selMode) state.toggleSelMode();
                state.toggleSelect(item.key);
              } else if (state.selMode) {
                state.toggleSelect(item.key);
              } else {
                onSelectAsset(item.key);
              }
            };

            if (viewMode === "list") {
              return (
                <div
                  key={item.key}
                  className={`mgr-list-row${isSelected ? " selected" : ""}`}
                  onClick={onClick}
                  onDoubleClick={() => state.insertToCanvas(item.key)}
                  onContextMenu={(e) => state.openCtxMenu(e, item)}
                  draggable
                  onDragStart={onDragStart}
                >
                  <div className="mgr-list-thumb">{thumbContent}</div>
                  <div className="mgr-list-name">{item.name}</div>
                  <div className="mgr-list-type">{item.type.toUpperCase()}</div>
                  <div className="mgr-list-dims">
                    {item.width && item.height ? `${item.width}×${item.height}` : "—"}
                  </div>
                  <div className="mgr-list-size">{formatBytes(item.size)}</div>
                </div>
              );
            }

            return (
              <div
                key={item.key}
                className={`mgr-asset${isSelected ? " selected" : ""}`}
                onClick={onClick}
                onDoubleClick={() => state.insertToCanvas(item.key)}
                onContextMenu={(e) => state.openCtxMenu(e, item)}
                draggable
                onDragStart={onDragStart}
              >
                <div className="mgr-asset-thumb">
                  {thumbContent}
                  {/* Source badge */}
                  <div
                    className={`mgr-badge ${item.assetSource === "stock" ? "stock" : item.assetSource === "ai" ? "stock" : "uploaded"}`}
                  >
                    {item.assetSource === "stock"
                      ? "STOCK"
                      : item.assetSource === "ai"
                        ? "AI"
                        : "UP"}
                  </div>
                  {/* Usage chip */}
                  {(usageMap.get(item.key) ?? 0) > 0 && (
                    <div className="mgr-usage">{usageMap.get(item.key)}×</div>
                  )}
                  {isSelected && (
                    <div className="mgr-sel-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mgr-asset-meta">
                  <div className="mgr-asset-name">{item.name}</div>
                  <div className="mgr-asset-sub">
                    {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                    {formatBytes(item.size)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mgr-empty">
          <div className="mgr-empty-hero">
            <div className="mgr-empty-ring">
              <FolderOpen size={32} />
            </div>
            <h4>{state.librarySearch ? "No results" : "Your library is empty"}</h4>
            <p>
              {state.librarySearch
                ? `No assets match "${state.librarySearch}"`
                : "Upload your brand assets, browse free stock, or import from other tools."}
            </p>
            {!state.librarySearch && (
              <div className="mgr-empty-actions">
                <Button className="mgr-btn-primary" onClick={onUploadClick}>
                  <Upload size={14} />
                  Upload files
                </Button>
                <Button className="mgr-btn" onClick={onOpenStockModal}>
                  <Search size={14} />
                  Browse stock
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mgr-grid-foot">
        <span>
          Showing <strong>{visibleItems.length}</strong> of {state.counts.all}
          {smartFolder
            ? ` in ${smartFolder === "in-use" ? "In use" : smartFolder === "unused" ? "Unused" : "Recent"}`
            : state.currentFolderId && breadcrumbPath.length > 1
              ? ` in ${breadcrumbPath[breadcrumbPath.length - 1].name}`
              : ""}
        </span>
      </div>
    </div>
  );
}
