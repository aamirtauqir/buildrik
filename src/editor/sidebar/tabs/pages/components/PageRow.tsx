/**
 * PageRow — Single page item in the pages list.
 *
 * Fixes applied:
 * - Persistent 🏠 home badge (always visible, not hover-only)
 * - Status text badge (Published / Draft / Hidden / 🔒) replacing colored dot
 * - Tooltip on all 3 action buttons
 * - Drag handle affordance on hover
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";

interface Props {
  page: PageItem;
  isRenaming: boolean;
  isContextMenuOpen?: boolean;
  onSelect: () => void;
  onRenameCommit: (name: string) => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  onContextMenu: (x: number, y: number) => void;
  onSettingsClick: () => void;
}

function statusLabel(page: PageItem): string {
  switch (page.status) {
    case "hidden":
      return "Hidden";
    case "draft":
      return "Draft";
    case "password":
      return "🔒";
    case "external":
      return "↗";
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

export const PageRow = React.memo<Props>(
  ({
    page,
    isRenaming,
    isContextMenuOpen = false,
    onSelect,
    onRenameCommit,
    onRenameCancel,
    onRenameStart,
    onContextMenu,
    onSettingsClick,
  }) => {
    const [renameValue, setRenameValue] = React.useState(page.name);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (isRenaming) {
        setRenameValue(page.name);
        requestAnimationFrame(() => {
          inputRef.current?.select();
          inputRef.current?.focus();
        });
      }
    }, [isRenaming, page.name]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onRenameCommit(renameValue.trim() || page.name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onRenameCancel();
      }
    };

    const handleSettingsClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isRenaming) onRenameCommit(renameValue.trim() || page.name);
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
        className={["pg-row", page.isActive ? "pg-row--active" : ""].filter(Boolean).join(" ")}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onSelect}
        onContextMenu={handleContextMenuClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !isRenaming) onSelect();
          if (e.key === "F2" && !isRenaming) onRenameStart();
        }}
      >
        {/* Drag handle */}
        <div
          className="pg-row__drag"
          aria-hidden="true"
          title="Page reordering coming soon"
          style={{ cursor: "default" }}
        >
          <span />
          <span />
          <span />
        </div>

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

        {/* Name or inline rename input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            className="pg-row__rename"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onRenameCommit(renameValue.trim() || page.name)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Rename page"
          />
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
          </div>
        )}

        {/* Homepage badge — always visible */}
        {page.isHome && (
          <span className="pg-row__home-badge" aria-label="Homepage">
            🏠
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
    );
  }
);

PageRow.displayName = "PageRow";
