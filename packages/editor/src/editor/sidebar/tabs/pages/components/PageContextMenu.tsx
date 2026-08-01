/**
 * PageContextMenu — portal context menu for page actions.
 *
 * Rules:
 * - Renders through <Portal> into the shared chrome overlay root
 * - "Delete Page" is DISABLED (not hidden) when: page is homepage OR only page
 * - Keyboard: Escape closes, ↑↓ rove focus
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PageItem } from "../types";
import { Button, Kbd, Portal } from "@/editor/chrome-ui";

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

  React.useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    first?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "ArrowDown"
        ? (idx + 1) % items.length
        : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  };

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
      className="bd-pg-menu"
      style={style}
      role="menu"
      aria-label={`Options for ${page?.name ?? "page"}`}
      onKeyDown={handleKeyDown}
    >
      <Button
        type="button"
        className="bd-pg-menu-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onRename(pageId))}
      >
        Rename <Kbd>F2</Kbd>
      </Button>
      <Button
        type="button"
        className="bd-pg-menu-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onDuplicate(pageId))}
      >
        Duplicate <Kbd>⌘D</Kbd>
      </Button>
      {!isHome && (
        <Button
          type="button"
          className="bd-pg-menu-item"
          role="menuitem"
          tabIndex={-1}
          onClick={() => act(() => onSetHomepage(pageId))}
        >
          Set as Homepage
        </Button>
      )}
      <Button
        type="button"
        className="bd-pg-menu-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onCopyLink(pageId))}
      >
        Copy Page Link
      </Button>
      <Button
        type="button"
        className="bd-pg-menu-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onSettings(pageId))}
      >
        Page Settings <Kbd>⌘,</Kbd>
      </Button>
      <div className="bd-pg-menu-divider" role="separator" />
      <Button
        type="button"
        className={`bd-pg-menu-item danger${deleteDisabled ? " disabled" : ""}`}
        role="menuitem"
        tabIndex={-1}
        aria-disabled={deleteDisabled}
        title={deleteTooltip}
        onClick={() => {
          if (!deleteDisabled) act(() => onDelete(pageId));
        }}
      >
        Delete Page
      </Button>
    </div>
  );

  return <Portal>{menu}</Portal>;
};
