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
  CheckSquare,
  ChevronDown,
  FolderOpen,
  Search,
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

/* Board 1163:4641 draws the bulk bar's actions as 11/500 text on the accent
   tint — accent for Move/Download, error ink for Delete, muted for Clear —
   not as the outlined 27-tall .mgr-btn the toolbar above it uses. `link`
   carries the recipe; min-h-6 keeps the 24px target under the smaller text. */
const BULK_LINK = "tw:min-h-6 tw:text-[11px] tw:font-medium";
const BULK_LINK_DANGER = `${BULK_LINK} tw:text-[var(--bk-error-text)]`;
const BULK_LINK_MUTED = "tw:min-h-6 tw:text-[11px] tw:text-[var(--bk-ink-muted)]";

/* Clone 3695:44951 — the sort names its key AND its direction on the button
   ("Date added", "Name A–Z"), so the menu's separate Ascending/Descending row
   no longer has to be opened to learn which way the list runs. */
const SORT_OPTIONS: ReadonlyArray<{ value: MediaSortBy; label: string }> = [
  { value: "date", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "size", label: "Size" },
  { value: "type", label: "Type" },
];

/* Clone 3695:19968 — the Type column prints the format a person would say:
   IMG · VID · SVG · FONT. The bucket keys ("ico", "fnt") are internal. */
const LIST_TYPE_LABEL: Record<LibraryItem["type"], string> = {
  img: "IMG",
  vid: "VID",
  ico: "SVG",
  fnt: "FONT",
};

function sortButtonLabel(sort: MediaSortBy, dir: "asc" | "desc"): string {
  if (sort === "name") return dir === "asc" ? "Name A–Z" : "Name Z–A";
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Date added";
}

// ─── Props ────────────────────────────────────────────────────────────────

export interface AssetGridProps {
  state: MediaStateResult;
  /** Items after smart-folder + search filter (orchestrator-computed). */
  visibleItems: LibraryItem[];
  /** key → usage count (orchestrator-computed against composer). */
  usageMap: Map<string, number>;
  /** Smart folder gating the visibleItems filter (drives footer label). */
  smartFolder: SmartFolder;
  /** Board 1163:13948 — the error row's Dismiss. */
  onDismissUpload?: (fileName: string) => void;
  /** Board 1163:4641's bulk Download — routed to the engine's media layer. */
  onDownload: (assets: ReadonlyArray<{ src: string; name: string }>) => number;
  /** Whole grid becomes the drop zone while a file drag is over the manager. */
  isDragOver?: boolean;
  /** Selected item highlight + click target. */
  selectedAssetId: string | null;
  onSelectAsset(key: string): void;
  /** Double-click on a card or row — the orchestrator's insert-and-return. */
  onInsert(key: string): void;
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
  onDismissUpload,
  onDownload,
  isDragOver = false,
  selectedAssetId,
  onSelectAsset,
  onInsert,
  onUploadClick,
  onOpenStockModal,
  addToast,
}: AssetGridProps) {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  /* Board 1174:4867 — the format strip lists the formats THIS library
     actually holds, not a fixed JPG/PNG/SVG/MP4 row. A chip for a format
     with nothing behind it is a filter that can only ever empty the grid. */
  const availableFormats = React.useMemo(() => {
    const seen = new Set<string>();
    for (const i of state.libraryItems) {
      const ext = (i.mimeType ?? "").split("/")[1]?.split("+")[0];
      if (ext) seen.add(ext === "jpeg" ? "jpg" : ext);
    }
    return [...seen].sort();
  }, [state.libraryItems]);

  /* Board 1163:13948 — every row that is still in flight or has something to
     say. A completed upload keeps its green line briefly; its real evidence is
     the card that just appeared. */
  const activeUploads = React.useMemo(
    () => (state.uploadQueue ?? []).filter((u) => u.status !== "complete" || u.progress < 100),
    [state.uploadQueue],
  );

  /* Clone 3695:45155 — "24 files · All assets": the count line names the
     scope the grid is showing. It replaced two things at once: the V1 board's
     "Last added 2h ago" tail (1174:4866) and the grid foot's "Showing N of M
     in <scope>", which said the same count a third time. In a search the line
     reads `1 result for "menu"` (3695:44339). */
  const scopeLabel = React.useMemo(() => {
    if (smartFolder === "recent") return "Recent";
    if (smartFolder === "in-use") return "In use";
    if (smartFolder === "unused") return "Unused";
    if (state.currentFolderId) {
      return state.folders.find((f) => f.id === state.currentFolderId)?.name ?? "All assets";
    }
    return "All assets";
  }, [smartFolder, state.currentFolderId, state.folders]);
  const searchQuery = state.librarySearch.trim();
  const countLabel = searchQuery
    ? `${visibleItems.length} ${visibleItems.length === 1 ? "result" : "results"} for "${searchQuery}"`
    : `${visibleItems.length} ${visibleItems.length === 1 ? "file" : "files"} · ${scopeLabel}`;
  const [sortMenuOpen, setSortMenuOpen] = React.useState(false);
  const [bulkMovePickerOpen, setBulkMovePickerOpen] = React.useState(false);

  return (
    <div className={`mgr-main${isDragOver ? " dragover" : ""}`} data-testid="mgr-grid-col">
      {isDragOver && (
        <div className="mgr-dropzone" aria-hidden="true" data-testid="mgr-dropzone">
          <span className="mgr-dropzone-title" data-testid="mgr-dropzone-title">Drop files to upload</span>
          <span className="mgr-dropzone-sub" data-testid="mgr-dropzone-sub">
            Images, video, audio, SVG and fonts — up to {formatBytes(state.storage.total)} total
          </span>
        </div>
      )}
      {/*
        Board 1161:35 — the grid toolbar reads left to right: what you are
        looking at, what formats are in it, then how it is arranged. The
        type pills that used to lead were the drawer's control living twice;
        the board files by FORMAT here (fmtFilter), which is the finer cut
        the manager is for. A type filter carried in from the drawer still
        gets a visible, clearable chip — otherwise the manager would show a
        filtered library with no cause on screen.
      */}
      <div className="mgr-subbar" data-testid="mgr-subbar">
        <span className="mgr-count" data-testid="mgr-count">{countLabel}</span>

        {availableFormats.length > 0 && (
          <div className="mgr-fmt-strip" role="group" aria-label="Filter by format" data-testid="mgr-fmt-strip">
            {availableFormats.map((fmt) => (
              <Button
                key={fmt}
                className={`mgr-fmt${state.fmtFilter === fmt ? " active" : ""}`}
                data-testid={`mgr-fmt-${fmt}`}
                aria-pressed={state.fmtFilter === fmt}
                onClick={() => state.setFmtFilter(state.fmtFilter === fmt ? "" : fmt)}
              >
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
        )}

        {state.activeTypes.size > 0 && (
          <Button
            className="mgr-fmt active"
            aria-label="Clear the type filter carried in from the drawer"
            onClick={() => state.setType("all")}
          >
            {[...state.activeTypes].join(" + ")} ✕
          </Button>
        )}

        <div className="mgr-spacer" />

        {/* Clone 3695:45155 — the view reads as words: "Grid · 3 columns  2 3 4
            List". The V1 board's icon pair (1161:35) is gone; a label that says
            the column count is the only place that count was ever printed. */}
        <div className="mgr-view-toggle">
          <Button
            className={viewMode === "grid" ? "active" : ""}
            data-testid="mgr-view-grid"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
          >
            Grid · {state.gridN} columns
          </Button>
        </div>

        {/* Board's 2 / 3 / 4 — columns per row, not a view mode. */}
        <div className="mgr-gridn" role="group" aria-label="Columns" data-testid="mgr-gridn">
          {([2, 3, 4] as const).map((n) => (
            <Button
              key={n}
              className={`mgr-gridn-btn${state.gridN === n ? " active" : ""}`}
              data-testid={`mgr-gridn-${n}`}
              aria-pressed={state.gridN === n}
              onClick={() => {
                state.setGridN(n);
                setViewMode("grid");
              }}
            >
              {n}
            </Button>
          ))}
        </div>

        <div className="mgr-view-toggle">
          <Button
            className={viewMode === "list" ? "active" : ""}
            data-testid="mgr-view-list"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            List
          </Button>
        </div>

        <div className="mgr-sort-wrap">
          <Button className="mgr-sort" data-testid="mgr-sort" onClick={() => setSortMenuOpen((o) => !o)}>
            {sortButtonLabel(state.sort, state.sortDir)}
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

        {/* Clone 3695:19968 — the toolbar's ☑ ENTERS select mode: the List with
            its checkbox column and nothing checked ("Assets · List · no
            selection"). It used to select every file at once (V1 1163:4641's
            reading); select-all now lives in the list header's checkbox, where
            a person expects it. Pressing it again leaves select mode. */}
        <Button
          className="mgr-selectall"
          aria-label={state.selMode ? "Exit select mode" : "Select files"}
          aria-pressed={state.selMode}
          onClick={() => {
            if (!state.selMode) setViewMode("list");
            state.toggleSelMode();
          }}
        >
          <CheckSquare size={13} />
        </Button>
      </div>

      {/* Board 1163:4641 draws the bulk bar BELOW the toolbar, not in
          place of it: what you are filtering by stays on screen while a
          selection is live. */}
      {state.selMode && state.selectedKeys.size > 0 && (
        <div className="mgr-bulk-bar" data-testid="mgr-bulk-bar">
          <span className="mgr-bulk-count" data-testid="mgr-bulk-count">{state.selectedKeys.size} selected</span>
          <div className="mgr-spacer" />
          {/* Bug #4 fix: Move → folder picker popover */}
          <div className="mgr-sort-wrap">
            <Button variant="link" className={BULK_LINK} onClick={() => setBulkMovePickerOpen((o) => !o)}>
              Move to folder…
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
            variant="link"
            className={BULK_LINK}
            onClick={() => {
              // Board 1163:4641 draws Download between Move and Delete. The
              // browser pulls one file at a time, so the selection goes as
              // individual downloads — the engine owns the disk write.
              const items = state.libraryItems.filter((i) => state.selectedKeys.has(i.key));
              const n = onDownload(items.map((i) => ({ src: i.src, name: i.displayName ?? i.name })));
              addToast({
                description: `Downloading ${n} ${n === 1 ? "file" : "files"}`,
                tone: "info",
              });
            }}
          >
            Download
          </Button>
          <Button
            variant="link"
            className={BULK_LINK_DANGER}
            onClick={() => {
              const items = state.libraryItems.filter((i) => state.selectedKeys.has(i.key));
              state.requestBulkDelete(items);
            }}
          >
            Delete
          </Button>
          <Button variant="link" className={BULK_LINK_MUTED} onClick={state.clearSelection}>
            ✕ Clear
          </Button>
        </div>
      )}

      {/*
        Board 1163:13695 — a smart scope says what it is showing AND what that
        means. "Unused" is the one worth spelling out: the whole reason to open
        it is to delete, and the safety claim belongs next to the assets, not
        in a tooltip on the folder row.
      */}
      {smartFolder === "unused" && visibleItems.length > 0 && (
        <div className="mgr-scope-note" role="status" data-testid="mgr-scope-note">
          Showing {visibleItems.length} unused{" "}
          {visibleItems.length === 1 ? "asset" : "assets"} — safe to delete, nothing on
          the site references them.
        </div>
      )}

      {/* Board 1163:13948 — files still landing report themselves above the
          grid: what failed and why, what is still working, what arrived. */}
      {activeUploads.length > 0 && (
        <ul className="mgr-uploads" aria-label="Uploads">
          {activeUploads.map((u) => (
            <li key={u.fileName} className={`mgr-upload ${u.status}`}>
              <span className="mgr-upload-name">
                {u.fileName}
                {u.status === "error"
                  ? ` → ${u.error ?? "not supported"}`
                  : u.status === "complete"
                    ? ""
                    : " → uploading…"}
              </span>
              {u.status === "uploading" || u.status === "processing" || u.status === "optimizing" ? (
                <span className="mgr-upload-track" aria-hidden="true">
                  <span className="mgr-upload-fill" style={{ width: `${Math.round(u.progress)}%` }} />
                </span>
              ) : null}
              {u.status === "error" && onDismissUpload ? (
                <Button className="mgr-upload-dismiss" onClick={() => onDismissUpload(u.fileName)}>
                  Dismiss
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {visibleItems.length > 0 && viewMode === "list" && (
        <div className="mgr-list-head" data-testid="mgr-list-head">
          {(() => {
            const all = visibleItems.length > 0 && visibleItems.every((i) => state.selectedKeys.has(i.key));
            return (
              <span
                className={`mgr-list-check${all ? " on" : ""}`}
                role="checkbox"
                aria-checked={all}
                aria-label="Select all files"
                onClick={() => {
                  if (!state.selMode) state.toggleSelMode();
                  if (all) state.toggleSelMode();
                  else state.selectAll();
                }}
              >
                {all ? <Check size={10} /> : null}
              </span>
            );
          })()}
          <span>Name</span>
          <span>Type</span>
          <span>Size</span>
          <span>Usage</span>
        </div>
      )}
      {visibleItems.length > 0 ? (
        <div
          /* One literal anchor, with the mode as data. A ternary of two
             literals is invisible to check-anchors (lib.mjs `anchorForm`
             matches an attribute or a template prefix, not a conditional), so
             a recipe naming "mgr-grid" reported an anchor nobody renders while
             the element resolved perfectly in the browser. */
          data-testid="mgr-assets"
          data-view={viewMode}
          className={viewMode === "grid" ? "mgr-grid" : "mgr-list"}
          /* Clone 3695:44543 / 44747 — the toggle counts columns; the label
             above it says "Grid · N columns" and N is what you get. */
          style={
            viewMode === "grid"
              ? ({ "--mgr-cols": state.gridN } as React.CSSProperties)
              : undefined
          }
        >
          {visibleItems.map((item) => {
            const isSelected = selectedAssetId === item.key;
            /* Clone 3696:20326 — a video with no poster is a neutral tile under
               its play glyph. It used to fall through to <img src={videoBlob}>,
               which the browser renders as a broken image with the filename as
               its alt. */
            const thumbContent =
              (item.type === "img" || item.type === "vid") && item.thumb ? (
                <img src={item.thumb || item.src} alt={item.name} loading="lazy" />
              ) : item.type === "vid" ? null : item.type === "ico" ? (
                <img
                  src={item.src}
                  alt={item.name}
                  className="tw:h-9 tw:w-9 tw:object-contain"
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

            // Two drop targets read this drag: the canvas (src/type/name) and
            // the folder tree, which moves the asset and needs its KEY. The grid
            // only ever published the canvas payload, so dragging a card onto a
            // folder here did nothing — the drawer's AssetCell had the key line
            // and this one did not.
            const onDragStart = (e: React.DragEvent) => {
              e.dataTransfer.setData("application/x-aquibra-media-src", item.src);
              e.dataTransfer.setData("application/x-aquibra-media-type", item.type);
              e.dataTransfer.setData("application/x-aquibra-media-name", item.name);
              e.dataTransfer.setData("application/x-buildrik-media-asset-key", item.key);
              e.dataTransfer.setData("text/plain", item.key);
              e.dataTransfer.effectAllowed = "copyMove";
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
              const checked = state.selectedKeys.has(item.key);
              return (
                <div
                  key={item.key}
                  className={`mgr-list-row${isSelected || checked ? " selected" : ""}`}
                  data-testid={`mgr-list-row-${item.key}`}
                  onClick={onClick}
                  onDoubleClick={() => onInsert(item.key)}
                  onContextMenu={(e) => state.openCtxMenu(e, item)}
                  draggable
                  onDragStart={onDragStart}
                >
                  {/* Board 1163:4641 leads every row with its checkbox — list
                      view IS the bulk view, and dims left with it: the column
                      that decides a bulk action is usage, not pixels. */}
                  <span
                    className={`mgr-list-check${checked ? " on" : ""}`}
                    data-testid={`mgr-list-check-${item.key}`}
                    role="checkbox"
                    aria-checked={checked}
                    aria-label={`Select ${item.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!state.selMode) state.toggleSelMode();
                      state.toggleSelect(item.key);
                    }}
                  >
                    {checked ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    ) : null}
                  </span>
                  <div className="mgr-list-name">{item.displayName ?? item.name}</div>
                  <div className="mgr-list-type" data-testid={`mgr-list-type-${item.key}`}>{LIST_TYPE_LABEL[item.type]}</div>
                  <div className="mgr-list-size">{formatBytes(item.size, item.size >= 1024 * 1024 ? 1 : 0)}</div>
                  <div className={`mgr-list-use${(usageMap.get(item.key) ?? 0) > 0 ? "" : " unused"}`}>
                    {(usageMap.get(item.key) ?? 0) > 0
                      ? `used ×${usageMap.get(item.key)}`
                      : "unused"}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.key}
                className={`mgr-asset${isSelected ? " selected" : ""}`}
                data-testid={`mgr-asset-${item.key}`}
                onClick={onClick}
                onDoubleClick={() => onInsert(item.key)}
                onContextMenu={(e) => state.openCtxMenu(e, item)}
                draggable
                onDragStart={onDragStart}
              >
                <div className="mgr-asset-thumb" data-testid={`mgr-thumb-${item.key}`}>
                  {thumbContent}
                  {/*
                    Board 1161:66/80/111 — the only badge on a card says what
                    KIND of file it is (▶ video, ◆ vector, Aa font); an image
                    needs none. The old "UP/STOCK/AI" provenance badge sat on
                    every card saying where it came from, which is the one
                    thing the grid never has to answer.
                  */}
                  {item.type !== "img" && (
                    <div className="mgr-kind" aria-hidden="true">
                      {item.type === "vid" ? "▶" : item.type === "fnt" ? "Aa" : "◆"}
                    </div>
                  )}
                  {isSelected && (
                    <div className="mgr-sel-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="mgr-asset-meta" data-testid={`mgr-meta-${item.key}`}>
                  <div className="mgr-asset-name" data-testid={`mgr-name-${item.key}`}>{item.displayName ?? item.name}</div>
                  {/*
                    Board 1161:55 — dot + "used ×3" / "unused". Dimensions and
                    bytes moved to the details rail, which is where you go when
                    you care; on the card the question is always "can I delete
                    this?".
                  */}
                  <div
                    className={`mgr-asset-use${(usageMap.get(item.key) ?? 0) > 0 ? "" : " unused"}`}
                    data-testid={`mgr-use-${item.key}`}
                  >
                    <span className="mgr-use-dot" aria-hidden="true" />
                    {(usageMap.get(item.key) ?? 0) > 0
                      ? `used ×${usageMap.get(item.key)}`
                      : "unused"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mgr-empty" data-testid="mgr-empty">
          <div className="mgr-empty-hero" data-testid="mgr-empty-hero">
            <div className="mgr-empty-ring" data-testid="mgr-empty-icon">
              <FolderOpen size={32} />
            </div>
            {/* Board 1162:4617 — the empty library says where uploads GO,
                because the question at zero assets is "is this the right
                place?", not "what can I do here?". */}
            <h4 data-testid="mgr-empty-title">{state.librarySearch ? "No results" : "No images or files yet."}</h4>
            <p data-testid="mgr-empty-sub">
              {state.librarySearch
                ? `No assets match "${state.librarySearch}"`
                : "Everything you upload lives here, in one library for the whole site."}
            </p>
            {!state.librarySearch && (
              <div className="mgr-empty-actions" data-testid="mgr-empty-actions">
                <Button className="mgr-btn-primary" data-testid="mgr-empty-upload" onClick={onUploadClick}>
                  <Upload size={14} />
                  Upload
                </Button>
                <Button className="mgr-btn" data-testid="mgr-empty-stock" onClick={onOpenStockModal}>
                  <Search size={14} />
                  Browse stock
                </Button>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
}
