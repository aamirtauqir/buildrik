/**
 * PageContextMenu — Portal context menu for page actions.
 *
 * Rules:
 * - Renders via createPortal(menu, document.body)
 * - "Delete Page" is DISABLED (not hidden) when: page is homepage OR only page
 * - Keyboard: Escape closes
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createPortal } from "react-dom";
import type { PageItem } from "../types";

interface Props {
  pageId: string;
  x: number;
  y: number;
  pages: PageItem[];
  onClose: () => void;
  onRename: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetHomepage: (id: string) => void;
  onCopyLink: (id: string) => void;
  onSettings: (id: string) => void;
}

export const PageContextMenu: React.FC<Props> = ({
  pageId,
  x,
  y,
  pages,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onSetHomepage,
  onCopyLink,
  onSettings,
}) => {
  const page = pages.find((p) => p.id === pageId);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isHome = page?.isHome ?? false;
  const isOnly = pages.length <= 1;
  const deleteDisabled = isHome || isOnly;
  const deleteTooltip = isHome
    ? "Set another page as Homepage before deleting this one"
    : isOnly
      ? "A site needs at least 1 page. Add another page first."
      : undefined;

  // Focus first item on mount
  React.useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])'
    );
    first?.focus();
  }, []);

  // Arrow key roving focus + Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  // Keep within viewport
  const style: React.CSSProperties = {
    position: "fixed",
    top: Math.min(y, window.innerHeight - 260),
    left: Math.min(x, window.innerWidth - 220),
    zIndex: 9999,
  };

  const act = (fn: () => void) => {
    fn();
    onClose();
  };

  const menu = (
    <div
      ref={menuRef}
      className="pg-ctx-menu"
      style={style}
      role="menu"
      aria-label={`Options for ${page?.name ?? "page"}`}
      onKeyDown={handleKeyDown}
    >
      <button
        className="pg-ctx-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onRename(pageId))}
      >
        Rename <kbd>F2</kbd>
      </button>
      <button
        className="pg-ctx-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onDuplicate(pageId))}
      >
        Duplicate <kbd>⌘D</kbd>
      </button>
      {!isHome && (
        <button
          className="pg-ctx-item"
          role="menuitem"
          tabIndex={-1}
          onClick={() => act(() => onSetHomepage(pageId))}
        >
          Set as Homepage
        </button>
      )}
      <button
        className="pg-ctx-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onCopyLink(pageId))}
      >
        Copy Page Link
      </button>
      <button
        className="pg-ctx-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onSettings(pageId))}
      >
        Page Settings <kbd>⌘,</kbd>
      </button>
      <div className="pg-ctx-divider" role="separator" />
      <button
        className={`pg-ctx-item pg-ctx-item--danger${deleteDisabled ? " pg-ctx-item--disabled" : ""}`}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={deleteDisabled}
        title={deleteTooltip}
        onClick={() => {
          if (!deleteDisabled) act(() => onDelete(pageId));
        }}
      >
        Delete Page
      </button>
    </div>
  );

  return createPortal(menu, document.body);
};
