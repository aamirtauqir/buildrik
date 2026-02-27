/**
 * Media Tab — My Library View
 * Renders all 4 type sections inline (img/vid/ico/fnt).
 * Sections are functions, not standalone components — no pass-through wrappers.
 * @license BSD-3-Clause
 */

import * as React from "react";
import { useState } from "react";
import { EMPTY_MSGS, FORMAT_OPTIONS, SORT_OPTIONS } from "./mediaData";
import type { LibraryItem, LibraryViewProps } from "./mediaTypes";
import { extStyle, fmtDur, fmtSize } from "./mediaUtils";

// ─── Inline section renderers ────────────────────────────────────────────────

function ImageSection({
  items,
  gridN,
  selMode,
  selectedKeys,
  onSelect,
  onDelete,
  onInsert,
  onCtxMenu,
  onDetail,
}: {
  items: LibraryItem[];
  gridN: 2 | 3 | 4;
  selMode: boolean;
  selectedKeys: Set<string>;
  onSelect(key: string): void;
  onDelete(key: string): void;
  onInsert(key: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  onDetail(item: LibraryItem): void;
}) {
  return (
    <div className="med-grid" data-cols={gridN}>
      {items.map((item) => {
        const sel = selectedKeys.has(item.key);
        return (
          <div
            key={item.key}
            className={`med-img-card${sel ? " selected" : ""}`}
            onContextMenu={(e) => onCtxMenu(e, item)}
            onClick={() => (selMode ? onSelect(item.key) : onDetail(item))}
            role="button"
            tabIndex={0}
            aria-label={item.name}
          >
            <div className="med-img-card-bg">
              <img src={item.thumb ?? item.src} alt={item.name} loading="lazy" />
            </div>
            <div className="med-img-overlay" />
            <div className="med-img-top">
              {selMode && (
                <button
                  className="med-chk"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(item.key);
                  }}
                  aria-label={sel ? "Deselect" : "Select"}
                >
                  {sel && "✓"}
                </button>
              )}
              <button
                className="med-del-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.key);
                }}
                aria-label="Delete"
              >
                ×
              </button>
            </div>
            <div className="med-img-meta">
              <span className={`med-ext-badge ${extStyle(item.mimeType)}`} data-type={item.type}>
                {item.mimeType.split("/")[1]?.toUpperCase().slice(0, 4)}
              </span>
              <div className="med-img-name">{item.name}</div>
              <div className="med-img-size">{fmtSize(item.size)}</div>
            </div>
            <button
              className="med-insert-btn"
              onClick={(e) => {
                e.stopPropagation();
                onInsert(item.key);
              }}
              aria-label="Insert"
            >
              Insert
            </button>
          </div>
        );
      })}
    </div>
  );
}

function VideoSection({
  items,
  gridN,
  onInsert,
  onCtxMenu,
  onDetail,
}: {
  items: LibraryItem[];
  gridN: 2 | 3 | 4;
  onInsert(key: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
  onDetail(item: LibraryItem): void;
}) {
  return (
    <div className="med-grid" data-cols={Math.min(gridN, 2) as 2 | 3 | 4}>
      {items.map((item) => (
        <div
          key={item.key}
          className="med-vid-card"
          onContextMenu={(e) => onCtxMenu(e, item)}
          onClick={() => onDetail(item)}
          role="button"
          tabIndex={0}
          aria-label={item.name}
        >
          {item.thumb && (
            <div className="med-img-card-bg">
              <img src={item.thumb} alt={item.name} loading="lazy" />
            </div>
          )}
          <div className="med-vid-play">
            <svg viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
          {item.duration != null && <div className="med-vid-dur">{fmtDur(item.duration)}</div>}
          <button
            className="med-insert-btn"
            onClick={(e) => {
              e.stopPropagation();
              onInsert(item.key);
            }}
            aria-label="Insert"
          >
            Insert
          </button>
        </div>
      ))}
    </div>
  );
}

function IconSection({
  items,
  onInsert,
  onCtxMenu,
}: {
  items: LibraryItem[];
  onInsert(key: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
}) {
  return (
    <div className="med-ico-grid">
      {items.map((item) => (
        <div
          key={item.key}
          className="med-ico-card"
          onContextMenu={(e) => onCtxMenu(e, item)}
          onClick={() => onInsert(item.key)}
          role="button"
          tabIndex={0}
          aria-label={item.name}
          title={item.name}
        >
          <img src={item.thumb ?? item.src} alt={item.name} width="16" height="16" />
          <span className="med-ico-label">{item.name}</span>
        </div>
      ))}
    </div>
  );
}

function FontSection({
  items,
  onInsert,
  onCtxMenu,
}: {
  items: LibraryItem[];
  onInsert(key: string): void;
  onCtxMenu(e: React.MouseEvent, item: LibraryItem): void;
}) {
  return (
    <div className="med-fnt-list">
      {items.map((item) => (
        <div
          key={item.key}
          className="med-fnt-card"
          onContextMenu={(e) => onCtxMenu(e, item)}
          role="button"
          tabIndex={0}
          aria-label={item.name}
        >
          <div className="med-fnt-top">
            <span className="med-fnt-name">{item.name}</span>
            <button
              className="med-insert-btn"
              style={{ position: "static", display: "flex" }}
              onClick={() => onInsert(item.key)}
              aria-label="Use font"
            >
              Use
            </button>
          </div>
          <div className="med-fnt-preview" style={{ fontFamily: item.name }}>
            Aa Bb Cc 123
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ type, searchQuery }: { type: string; searchQuery: string }) {
  const msg = EMPTY_MSGS[type as keyof typeof EMPTY_MSGS] ?? EMPTY_MSGS.all;
  return (
    <div className="med-empty">
      <div className="med-empty-title">{searchQuery ? "No results" : msg.title}</div>
      <div className="med-empty-sub">
        {searchQuery ? `No files matching "${searchQuery}"` : msg.sub}
      </div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────────

export function LibraryView({
  items,
  uploadQueue,
  activeType,
  sort,
  sortDir,
  gridN,
  fmtFilter,
  selMode,
  selectedKeys,
  searchQuery,
  onSort,
  onGridN,
  onFmt,
  onSelToggle,
  onSelect,
  onSelectAll,
  onBulkDelete,
  onDelete,
  onInsert,
  onCtxMenu,
  onDetail,
}: LibraryViewProps) {
  const [sortOpen, setSortOpen] = useState(false);

  const imgItems = items.filter((i) => i.type === "img");
  const vidItems = items.filter((i) => i.type === "vid");
  const icoItems = items.filter((i) => i.type === "ico");
  const fntItems = items.filter((i) => i.type === "fnt");

  const showAll = activeType === "all";
  const fmtOpts = FORMAT_OPTIONS[activeType === "all" ? "img" : activeType] ?? [];
  const currentSortLabel = SORT_OPTIONS.find((s) => s.by === sort)?.label ?? "Date added";

  // Upload ghost cards
  const ghosts = uploadQueue.filter((u) => u.status !== "complete" && u.status !== "error");

  return (
    <div className="med-library-view" style={{ flex: 1, overflowY: "auto" }}>
      {/* Bulk bar */}
      {selMode && selectedKeys.size > 0 && (
        <div className="med-bulk-bar">
          <span className="med-bulk-count">{selectedKeys.size} selected</span>
          <button className="med-bulk-btn" onClick={onSelectAll}>
            All
          </button>
          <button className="med-bulk-btn danger" onClick={onBulkDelete}>
            Delete
          </button>
        </div>
      )}

      {/* Toolbar: sort + grid + sel mode */}
      <div className="med-sec-hdr" style={{ position: "relative" }}>
        <span className="med-sec-label">Library</span>
        <span className="med-sec-count">{items.length}</span>
        <div className="med-sec-spacer" />
        {/* Format strip toggle (only for non-all when fmtOpts exist) */}
        {activeType !== "all" && fmtOpts.length > 0 && (
          <div className={`med-fmt-strip${fmtFilter ? " visible" : ""}`}>
            {fmtOpts.map((f) => (
              <button
                key={f}
                className={`med-fmt-btn${fmtFilter === f ? " active" : ""}`}
                onClick={() => onFmt(fmtFilter === f ? "" : f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {/* Sort */}
        <div className="med-sort-wrap" style={{ position: "relative" }}>
          <button className="med-sort-lbl" onClick={() => setSortOpen((v) => !v)}>
            {currentSortLabel}
            <svg
              width="7"
              height="7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {sortOpen && (
            <div className="med-sort-dd">
              {SORT_OPTIONS.map((opt) => (
                <div
                  key={opt.by}
                  className={`med-sort-opt${sort === opt.by ? " active" : ""}`}
                  onClick={() => {
                    onSort(opt.by, sort === opt.by && sortDir === "asc" ? "desc" : "asc");
                    setSortOpen(false);
                  }}
                >
                  {opt.label}
                  {sort === opt.by && (
                    <span className="med-sort-chk">{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Grid toggle */}
        {([2, 3, 4] as const).map((n) => (
          <button
            key={n}
            className={`med-grid-tog${gridN === n ? " active" : ""}`}
            onClick={() => onGridN(n)}
            aria-label={`${n} columns`}
          >
            {n}
          </button>
        ))}
        {/* Sel mode toggle */}
        <button
          className={`med-grid-tog${selMode ? " active" : ""}`}
          onClick={onSelToggle}
          aria-label="Select mode"
          aria-pressed={selMode}
        >
          ☑
        </button>
      </div>

      {/* Upload ghost cards */}
      {ghosts.length > 0 && (
        <div className="med-grid" data-cols={gridN}>
          {ghosts.map((u) => (
            <div key={u.fileName} className="med-upload-ghost">
              <div className="med-upload-ghost-bar" style={{ width: `${u.progress}%` }} />
              <div className="med-upload-ghost-pct">{u.progress}%</div>
              <div className="med-img-size">{u.fileName.slice(0, 12)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Image section */}
      {(showAll || activeType === "img") && (
        <>
          {showAll && (
            <div className="med-sec-hdr">
              <span className="med-sec-label">Images</span>
              <span className="med-sec-count">{imgItems.length}</span>
            </div>
          )}
          {imgItems.length > 0 ? (
            <ImageSection
              items={imgItems}
              gridN={gridN}
              selMode={selMode}
              selectedKeys={selectedKeys}
              onSelect={onSelect}
              onDelete={onDelete}
              onInsert={onInsert}
              onCtxMenu={onCtxMenu}
              onDetail={onDetail}
            />
          ) : (
            <EmptyState type="img" searchQuery={searchQuery} />
          )}
        </>
      )}

      {/* Video section */}
      {(showAll || activeType === "vid") && (
        <>
          {showAll && (
            <div className="med-sec-hdr">
              <span className="med-sec-label">Videos</span>
              <span className="med-sec-count">{vidItems.length}</span>
            </div>
          )}
          {vidItems.length > 0 ? (
            <VideoSection
              items={vidItems}
              gridN={gridN}
              onInsert={onInsert}
              onCtxMenu={onCtxMenu}
              onDetail={onDetail}
            />
          ) : (
            <EmptyState type="vid" searchQuery={searchQuery} />
          )}
        </>
      )}

      {/* Icon section */}
      {(showAll || activeType === "ico") && (
        <>
          {showAll && (
            <div className="med-sec-hdr">
              <span className="med-sec-label">Icons</span>
              <span className="med-sec-count">{icoItems.length}</span>
            </div>
          )}
          {icoItems.length > 0 ? (
            <IconSection items={icoItems} onInsert={onInsert} onCtxMenu={onCtxMenu} />
          ) : (
            <EmptyState type="ico" searchQuery={searchQuery} />
          )}
        </>
      )}

      {/* Font section */}
      {(showAll || activeType === "fnt") && (
        <>
          {showAll && (
            <div className="med-sec-hdr">
              <span className="med-sec-label">Fonts</span>
              <span className="med-sec-count">{fntItems.length}</span>
            </div>
          )}
          {fntItems.length > 0 ? (
            <FontSection items={fntItems} onInsert={onInsert} onCtxMenu={onCtxMenu} />
          ) : (
            <EmptyState type="fnt" searchQuery={searchQuery} />
          )}
        </>
      )}
    </div>
  );
}
