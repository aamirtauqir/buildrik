/**
 * PageRow — single page row in the pages tree.
 *
 * Class namespace: `.bd-pg-*` (DS V2). All visual state is class-driven:
 * `.active`, `.selected`, `.nested`, `.folder-row`, `.expanded-folder`.
 * The `bd-pg-panel.bulk-mode` parent gates the row checkbox via CSS;
 * this component always renders the checkbox slot.
 *
 * Settings/duplicate/delete actions live in the context menu — opened by
 * the single overflow button (right-click also opens it). The old per-row
 * action strip (settings gear + 3-dot more) is gone per DESIGN.md anti-slop.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Input } from "@/editor/ui";
import type { Composer } from "../../../../../engine";
import type { PageItem } from "../types";
import { getStatusLabel } from "../utils/statusLabel";

interface Props {
  page: PageItem;
  pages: PageItem[];
  composer: Composer | null;
  isRenaming: boolean;
  nameError?: string | null;
  isContextMenuOpen?: boolean;
  /** Enables drag handle and drag-to-folder when true (pages inside folders). */
  draggable?: boolean;
  /** When provided, the row is a reorder drop target: dropping another page
   *  here moves the dragged page to just after this one. */
  onReorderDrop?: (draggedPageId: string) => void;
  /** Renders with `.nested` class — left-padded for folder children. */
  nested?: boolean;
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

export const PageRow = React.memo<Props>(
  ({
    page,
    isRenaming,
    nameError = null,
    isContextMenuOpen = false,
    draggable: isDraggable = false,
    onReorderDrop,
    nested = false,
    isSelected = false,
    onSelect,
    onToggleSelect,
    onRenameCommit,
    onRenameCancel,
    onRenameStart,
    onContextMenu,
  }) => {
    const [renameValue, setRenameValue] = React.useState(page.name);
    const inputRef = React.useRef<HTMLInputElement>(null);
    // A9 fix: Enter commits rename, then triggers blur, which used to fire a
    // SECOND onRenameCommit. Idempotent flag clears once per rename session.
    const committedRef = React.useRef(false);

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
        committedRef.current = true;
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

    const handleReorderDragOver = (e: React.DragEvent) => {
      if (!onReorderDrop) return;
      e.preventDefault(); // allow drop
      e.dataTransfer.dropEffect = "move";
    };

    const handleReorderDrop = (e: React.DragEvent) => {
      if (!onReorderDrop) return;
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData("text/plain");
      if (draggedId && draggedId !== page.id) onReorderDrop(draggedId);
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

    const label = getStatusLabel(page.status ?? "live");

    const ariaLabel = [
      page.name,
      label ?? "",
      page.isHome ? "Homepage," : "",
      "press Enter to select",
    ]
      .filter(Boolean)
      .join(", ");

    const rowClasses = [
      "bd-pg-row",
      page.isActive ? "active" : "",
      isSelected ? "selected" : "",
      nested ? "nested" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className="bd-pg-row-wrap"
        role="listitem"
        draggable={isDraggable}
        onDragStart={isDraggable ? handleDragStart : undefined}
        onDragOver={onReorderDrop ? handleReorderDragOver : undefined}
        onDrop={onReorderDrop ? handleReorderDrop : undefined}
      >
        <div
          className={rowClasses}
          role="treeitem"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-selected={page.isActive ?? false}
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
            if (e.key === " " && onToggleSelect) {
              e.preventDefault();
              onToggleSelect(e);
            }
          }}
        >
          {/* Bulk-select checkbox slot — visible when .bd-pg-panel.bulk-mode is active */}
          <div
            className="bd-pg-row-checkbox"
            aria-hidden={!onToggleSelect}
            onClick={(e) => {
              if (!onToggleSelect) return;
              e.stopPropagation();
              onToggleSelect(e);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12l5 5L20 7" />
            </svg>
          </div>

          <span className="bd-pg-row-grip" aria-hidden="true" title="Drag to reorder">
            <svg viewBox="0 0 10 14" width="10" height="14" fill="currentColor" aria-hidden="true">
              <circle cx="3" cy="3" r="1" /><circle cx="3" cy="7" r="1" /><circle cx="3" cy="11" r="1" />
              <circle cx="7" cy="3" r="1" /><circle cx="7" cy="7" r="1" /><circle cx="7" cy="11" r="1" />
            </svg>
          </span>

          <span className="bd-pg-row-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
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
          </span>

          {isRenaming ? (
            <>
              <Input
                ref={inputRef}
                className="bd-pg-row-rename"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => commitOnce(renameValue.trim() || page.name)}
                onClick={(e) => e.stopPropagation()}
                aria-label="Rename page"
              />
              {nameError && (
                <div className="bd-pg-name-error" role="alert" aria-live="assertive">
                  {nameError}
                </div>
              )}
            </>
          ) : (
            <>
              <span
                className="bd-pg-row-name"
                title={page.name}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onRenameStart();
                }}
              >
                {page.name}
              </span>
              {page.slug && (
                <span className="bd-pg-row-slug">
                  {page.slug.startsWith("/") ? page.slug : `/${page.slug}`}
                </span>
              )}
            </>
          )}

          <span style={{ flex: 1 }} aria-hidden="true" />

          {page.isHome && (
            <span className="bd-pg-home-chip" aria-label="Homepage">
              <span className="dot" aria-hidden="true" />
              Home
            </span>
          )}

          {label && (
            <span
              className={`bd-pg-chip ${page.status ?? "live"}`}
              aria-label={`${page.status ?? "live"} status`}
            >
              <span className="dot" aria-hidden="true" />
              {label}
            </span>
          )}

          <Button
            className="bd-pg-row-overflow"
            type="button"
            aria-label={`More options for ${page.name}`}
            aria-expanded={isContextMenuOpen}
            aria-haspopup="menu"
            onClick={handleContextMenuClick}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="5" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="19" cy="12" r="1" fill="currentColor" />
            </svg>
          </Button>
        </div>
      </div>
    );
  },
);

PageRow.displayName = "PageRow";
