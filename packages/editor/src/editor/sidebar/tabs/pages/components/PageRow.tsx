/**
 * PageRow — Single page item in the pages list.
 *
 * Settings gear click opens a 580px slide-over drawer rendered by PagesTab.
 * Supports multi-select (Ctrl/Cmd+click, Shift+click, Space key) and
 * drag-to-folder (when draggable prop is set).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../../engine";
import type { PageItem } from "../types";
import { relativeTime } from "../utils/relativeTime";
import { thumbnailKey } from "../utils/thumbnailKey";

interface Props {
  page: PageItem;
  pages: PageItem[];
  composer: Composer | null;
  isRenaming: boolean;
  nameError?: string | null;
  isContextMenuOpen?: boolean;
  /** Enables drag handle and drag-to-folder when true (pages inside folders). */
  draggable?: boolean;
  /** Whether this row is part of a multi-select. */
  isSelected?: boolean;
  /** Toggle multi-select for this page. */
  onToggleSelect?: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onSelect: () => void;
  onRenameCommit: (name: string) => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  onContextMenu: (x: number, y: number) => void;
  onSettingsClick: () => void;
}

function statusLabel(page: PageItem): string {
  // Text-only labels per DESIGN.md "no emoji as design elements" rule.
  // Visual indication (colored dot + text color) is driven by the
  // `.pg-row__status--<status>` class, not by emoji in the label.
  switch (page.status) {
    case "hidden":
      return "Hidden";
    case "draft":
      return "Draft";
    case "password":
      return "Password";
    case "external":
      return "External";
    case "error":
      return "Error";
    default:
      return "Live";
  }
}

function statusTooltip(page: PageItem): string {
  switch (page.status) {
    case "live":
      return "This page is publicly visible";
    case "draft":
      return "This page is a draft — not visible to visitors";
    case "hidden":
      return "This page is hidden from navigation menus";
    case "password":
      return "This page requires a password to access";
    case "error":
      return "This page has a configuration error";
    case "external":
      return "This opens an external URL";
    default:
      return "";
  }
}

// ── PageRow ────────────────────────────────────────────────────────────────

export const PageRow = React.memo<Props>(
  ({
    page,
    pages,
    composer,
    isRenaming,
    nameError = null,
    isContextMenuOpen = false,
    draggable: isDraggable = false,
    isSelected = false,
    onSelect,
    onToggleSelect,
    onRenameCommit,
    onRenameCancel,
    onRenameStart,
    onContextMenu,
    onSettingsClick,
  }) => {
    const [renameValue, setRenameValue] = React.useState(page.name);
    const inputRef = React.useRef<HTMLInputElement>(null);
    // A9 fix: Enter commits rename, then triggers blur, which used to fire a
    // SECOND onRenameCommit with the same value — producing two PROJECT_CHANGED
    // emits + two history snapshots for one rename. The committed-ref flag
    // makes the blur handler idempotent within a single rename session.
    const committedRef = React.useRef(false);
    const updatedLabel = relativeTime(page.updatedAt);
    const thumbClass = thumbnailKey(page);

    React.useEffect(() => {
      if (isRenaming) {
        setRenameValue(page.name);
        committedRef.current = false;
        requestAnimationFrame(() => {
          inputRef.current?.select();
          inputRef.current?.focus();
        });
      }
    }, [isRenaming, page.name]);

    const commitOnce = (value: string) => {
      if (committedRef.current) return;
      committedRef.current = true;
      onRenameCommit(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitOnce(renameValue.trim() || page.name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        committedRef.current = true; // prevent blur from committing after cancel
        onRenameCancel();
      } else if (e.key === " " && onToggleSelect) {
        e.preventDefault();
        onToggleSelect(e);
      }
    };

    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", page.id);
      e.dataTransfer.effectAllowed = "move";
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRenaming) commitOnce(renameValue.trim() || page.name);
      onSettingsClick();
    };

    const handleContextMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      let cx = e.clientX;
      let cy = e.clientY;
      if (cx + 200 > window.innerWidth) cx -= 200;
      if (cy + 280 > window.innerHeight) cy -= 280;
      onContextMenu(cx, cy);
    };

    const ariaLabel = [
      page.name,
      statusLabel(page),
      page.isHome ? "Homepage," : "",
      "press Enter to select",
    ]
      .filter(Boolean)
      .join(", ");

    return (
      <div
        className="pg-row-wrap"
        role="listitem"
        draggable={isDraggable}
        onDragStart={isDraggable ? handleDragStart : undefined}
      >
        {/* ── Row header ───────────────────────────────────────────────── */}
        <div
          className={["pg-row", page.isActive ? "pg-row--active" : ""].filter(Boolean).join(" ")}
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-current={page.isActive ? "page" : undefined}
          aria-pressed={onToggleSelect ? isSelected : undefined}
          onClick={(e) => {
            if (onToggleSelect && (e.ctrlKey || e.metaKey || e.shiftKey)) {
              onToggleSelect(e);
            } else {
              onSelect();
            }
          }}
          onContextMenu={handleContextMenuClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isRenaming) onSelect();
            if (e.key === "F2" && !isRenaming) onRenameStart();
            if (e.key === " " && onToggleSelect) { e.preventDefault(); onToggleSelect(e); }
          }}
        >
          {/* Selection indicator — shown on hover (via CSS) or when selected */}
          {onToggleSelect && (
            <button
              className={`pg-row__select-dot${isSelected ? " pg-row__select-dot--on" : ""}`}
              onClick={(e) => { e.stopPropagation(); onToggleSelect(e); }}
              aria-label={isSelected ? "Deselect page" : "Select page"}
              title={isSelected ? "Deselect" : "Select"}
              tabIndex={-1}
            >
              {isSelected ? (
                <svg viewBox="0 0 12 12" width="8" height="8" fill="currentColor" aria-hidden="true">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : null}
            </button>
          )}

          {/* Drag grip — visible on hover, activates browser drag when parent draggable=true */}
          <span className="pg-row__grip" aria-hidden="true" title="Drag to reorder">
            <svg viewBox="0 0 10 14" width="10" height="14" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1" /><circle cx="3" cy="7" r="1" /><circle cx="3" cy="11" r="1" />
              <circle cx="7" cy="3" r="1" /><circle cx="7" cy="7" r="1" /><circle cx="7" cy="11" r="1" />
            </svg>
          </span>

          {/* Page icon */}
          <div className="pg-row__icon">
            <svg
              viewBox="0 0 24 24"
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
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

          {/* Thumbnail placeholder — gradient by page status until real snapshots ship */}
          <div className={`pg-row__thumb pg-row__thumb--${thumbClass}`} aria-hidden="true">
            <span className="pg-row__thumb-ghost" />
            <span className="pg-row__thumb-ghost" />
          </div>

          {/* Name or inline rename input */}
          {isRenaming ? (
            <>
              <input
                ref={inputRef}
                className="pg-row__rename"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => commitOnce(renameValue.trim() || page.name)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Rename page"
              />
              {nameError && (
                <div className="pg-name-error" role="alert" aria-live="assertive">
                  {nameError}
                </div>
              )}
            </>
          ) : (
            <div
              className="pg-row__name"
              title={page.name}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRenameStart();
              }}
            >
              {page.name}
              {page.slug && (
                <span className="pg-row__slug">
                  {page.slug.startsWith("/") ? page.slug : `/${page.slug}`}
                </span>
              )}
            </div>
          )}

          {updatedLabel && <span className="pg-row__updated">{updatedLabel}</span>}

          {/* Homepage pill — cobalt "HOME" text per DESIGN.md (no emoji). */}
          {page.isHome && (
            <span className="pg-row__home-badge" aria-label="Homepage">
              HOME
            </span>
          )}

          {/* Status badge (text) */}
          <span
            className={`pg-row__status pg-row__status--${page.status ?? "live"}`}
            title={statusTooltip(page)}
          >
            {statusLabel(page)}
          </span>

          {/* Action buttons */}
          <div className="pg-row__actions">
            <button
              className="pg-row__act"
              title="Page settings"
              aria-label={`Open settings for ${page.name}`}
              onClick={handleSettingsClick}
            >
              <svg
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>
            <button
              className="pg-row__act"
              title="More options"
              aria-label={`More options for ${page.name}`}
              aria-expanded={isContextMenuOpen}
              aria-haspopup="menu"
              onClick={handleContextMenuClick}
            >
              <svg
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="1" fill="currentColor" />
                <circle cx="19" cy="12" r="1" fill="currentColor" />
                <circle cx="5" cy="12" r="1" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

PageRow.displayName = "PageRow";
