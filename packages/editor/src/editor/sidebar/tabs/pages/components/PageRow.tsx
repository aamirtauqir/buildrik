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
import type { Composer } from "../../../../../engine";
import type { PageItem } from "../types";
import { getStatusLabel } from "../utils/statusLabel";
import { Button, TextField } from "@/editor/chrome-ui";
import { slugify } from "@shared/utils/helpers/string";
import { RenameUrlDecision } from "./RenameUrlDecision";

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
  /** `updateUrl` answers the URL decision (G2-076); absent = the URL was not at stake. */
  onRenameCommit: (name: string, updateUrl?: boolean) => void;
  onRenameCancel: () => void;
  onRenameStart: () => void;
  onContextMenu: (x: number, y: number) => void;
  /** Board 141:40 search results: the owning folder, shown muted right. */
  searchContext?: string;
  /** Board 140:21 / 1171:4729 — 8px warning dot when the page has unsaved edits. */
  isDirty?: boolean;
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
    searchContext,
    isDirty = false,
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

    /* G2-076: a new name whose slug differs from the page's URL waits for
       Keep URL / Update URL. The home page answers on "/" whatever it is
       called, so its rename never asks. */
    const [pendingName, setPendingName] = React.useState<string | null>(null);
    React.useEffect(() => {
      if (!isRenaming) setPendingName(null);
    }, [isRenaming]);

    const finish = (value: string, updateUrl?: boolean) => {
      if (committedRef.current) return;
      committedRef.current = true;
      setPendingName(null);
      onRenameCommit(value, updateUrl);
    };

    const commitOnce = (value: string) => {
      if (committedRef.current) return;
      const nextSlug = slugify(value);
      if (!page.isHome && value !== page.name && nextSlug && nextSlug !== page.slug) {
        setPendingName(value);
        return;
      }
      finish(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitOnce(renameValue.trim() || page.name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        committedRef.current = true;
        onRenameCancel();
      }
      /* No Space branch here. This handler is on the RENAME INPUT, where a
         space is a character in a page name — it used to preventDefault and
         toggle the row's selection instead, so "Renamed Page" was saved as
         "RenamedPage" and the row silently got selected. The search box in the
         same panel took spaces fine, which is what made it look like a
         keyboard problem rather than this. */
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
      isDirty ? "unsaved changes," : "",
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
      /* No `role="listitem"`: this wrapper sits inside `role="tree"`
         (PageList), where a tree's only allowed children are treeitem and
         group. axe flagged all three of the resulting errors on the live panel
         — "Element has children which are not allowed: [role=listitem]",
         "Required ARIA parent role not present: list", and the treeitems'
         missing group/tree parent. Presentation is the honest role for a drag
         wrapper: it carries no semantics of its own. */
      <div
        className="bd-pg-row-wrap"
        role="presentation"
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
          aria-current={page.isActive ? "page" : undefined}
          /* `aria-pressed` is not allowed on a treeitem (axe: "ARIA attribute
             is not allowed"), and it duplicated what this row already says:
             `aria-selected` carries the multi-select state below. */
          aria-selected={onToggleSelect ? isSelected : (page.isActive ?? false)}
          data-testid={`page-row-${page.id}`}
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
            /* `!isRenaming` for the same reason as its two neighbours: the
               rename input sits INSIDE this row, so its keystrokes bubble
               here. Without the guard, every space typed into a page name was
               eaten and toggled selection instead. */
            if (e.key === " " && onToggleSelect && !isRenaming) {
              e.preventDefault();
              onToggleSelect(e);
            }
          }}
        >
          {/* Bulk-select checkbox slot — visible when .bd-pg-panel.bulk-mode is active */}
          <div
            className="bd-pg-row-checkbox"
            data-testid={`page-row-checkbox-${page.id}`}
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

          {/* Board 140:2: plain page rows carry NO icon — only Home draws
              the roof glyph (140:19). */}
          {page.isHome && (
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
              <path d="M3 11l9-8 9 8" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          </span>
          )}

          {isRenaming ? (
            <>
              <TextField
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
                data-testid={`page-row-name-${page.id}`}
                title={page.name}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onRenameStart();
                }}
              >
                {page.name}
              </span>
            </>
          )}

          <span style={{ flex: 1 }} aria-hidden="true" />

          {searchContext && (
            <span
              className="bd-pg-row-incontext"
              data-testid={`page-row-incontext-${page.id}`}
              aria-label={`in ${searchContext}`}
            >
              in {searchContext}
            </span>
          )}

          {/* Board 4418:93381 — "● Unpublished" for unsaved edits, then the
              page's status chip ("Draft", "Hidden from publish"); a live page
              with nothing pending draws neither (C5 G2-071). */}
          {isDirty && (
            <span className="bd-pg-row-unpublished" aria-hidden="true">
              <span className="bd-pg-row-dirty" data-testid="page-dirty-dot" />
              <span data-testid={`page-dirty-label-${page.id}`}>Unpublished</span>
            </span>
          )}
          {!isRenaming && label && page.status && page.status !== "live" && (
            <span className={`bd-pg-chip ${page.status}`} data-testid={`page-status-chip-${page.id}`} aria-hidden="true">
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
        {isRenaming && pendingName !== null && (
          <RenameUrlDecision
            pageId={page.id}
            fromSlug={page.slug}
            toSlug={slugify(pendingName)}
            onKeep={() => finish(pendingName, false)}
            onUpdate={() => finish(pendingName, true)}
            onCancel={() => {
              committedRef.current = true;
              setPendingName(null);
              onRenameCancel();
            }}
          />
        )}
      </div>
    );
  },
);

PageRow.displayName = "PageRow";
