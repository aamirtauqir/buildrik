/**
 * PageRow — Single page item in the pages list.
 * Renders: drag handle (visual) | status dot | icon | name/rename-input | badges | actions
 *
 * FIX H1: Draft dot color updated via CSS to #5A5A7A.
 * FIX C3: onSettingsClick commits rename before opening drawer (caller responsibility
 *         handled here — we call onRenameCommit then onSettingsClick in sequence).
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem, PageStatus } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageRowProps {
  page: PageItem;
  isRenaming: boolean;
  /** True when this row's context menu is open — keeps row highlighted */
  isCtxOpen?: boolean;
  /** Called when row is clicked to activate the page */
  onSelect: () => void;
  /** Called with committed name when rename finishes (Enter or blur) */
  onRenameCommit: (name: string) => void;
  /** Called when rename is cancelled (Escape) */
  onRenameCancel: () => void;
  /** Called on right-click — passes event for position calculation */
  onContextMenu: (e: React.MouseEvent) => void;
  /** FIX C3: commits rename first if isRenaming, then opens settings */
  onSettingsClick: () => void;
  /** Opens the page URL in a new browser tab for preview */
  onOpenPage: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PageRow = React.memo<PageRowProps>(
  ({ page, isRenaming, isCtxOpen, onSelect, onRenameCommit, onRenameCancel, onContextMenu, onSettingsClick, onOpenPage }) => {
    const [renameValue, setRenameValue] = React.useState(page.name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Sync rename value when a new rename session starts
    React.useEffect(() => {
      if (isRenaming) {
        setRenameValue(page.name);
        requestAnimationFrame(() => {
          inputRef.current?.select();
          inputRef.current?.focus();
        });
      }
    }, [isRenaming, page.name]);

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRenameCommit(renameValue.trim() || page.name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onRenameCancel();
      }
    };

    const handleRenameBlur = () => {
      onRenameCommit(renameValue.trim() || page.name);
    };

    // FIX C3: commit rename (if active) then open settings
    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRenaming) {
        onRenameCommit(renameValue.trim() || page.name);
      }
      onSettingsClick();
    };

    const status: PageStatus = page.status ?? "live";

    return (
      <div
        className={[
          "pages-row",
          page.isActive ? "pages-row--active" : "",
          isCtxOpen ? "pages-row--ctx-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        role="button"
        tabIndex={0}
        aria-label={page.name}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isRenaming) onSelect();
        }}
      >
        {/* Drag handle (visual only — DnD wired when engine supports ordering) */}
        <div className="pages-row__drag" aria-hidden>
          <span />
          <span />
          <span />
        </div>

        {/* Status dot */}
        <div className={`pages-row__dot pages-row__dot--${status}`} aria-label={status} />

        {/* Page icon */}
        <div className="pages-row__icon">
          <svg
            viewBox="0 0 24 24"
            width="11"
            height="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {page.status === "external" ? (
              <>
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </>
            ) : (
              <>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </>
            )}
          </svg>
        </div>

        {/* Name or inline rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            className="pages-row__rename"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={handleRenameBlur}
            onClick={(e) => e.stopPropagation()}
            aria-label="Rename page"
          />
        ) : (
          <div
            className="pages-row__name"
            onDoubleClick={(e) => {
              e.stopPropagation();
              // Trigger rename from parent via context menu or F2
              // Double-click on name starts rename — dispatch custom event so PagesTab handles it
              const event = new CustomEvent("pg-rename-start", { detail: page.id, bubbles: true });
              e.currentTarget.dispatchEvent(event);
            }}
          >
            {page.name}
          </div>
        )}

        {/* Home badge */}
        {page.isHome && <span className="pages-row__home">HOME</span>}

        {/* External badge */}
        {page.status === "external" && <span className="pages-row__ext">↗</span>}

        {/* Action buttons */}
        <div className="pages-row__actions">
          <button
            className="pages-row__act"
            title="Open page in new tab"
            aria-label="Open page in new tab"
            onClick={(e) => { e.stopPropagation(); onOpenPage(); }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <button
            className="pages-row__act"
            title="Settings"
            aria-label="Page settings"
            onClick={handleSettingsClick}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
          <button
            className="pages-row__act"
            title="More options"
            aria-label="More options"
            onClick={(e) => { e.stopPropagation(); onContextMenu(e); }}
          >
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
              <circle cx="5" cy="12" r="1" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);

PageRow.displayName = "PageRow";
