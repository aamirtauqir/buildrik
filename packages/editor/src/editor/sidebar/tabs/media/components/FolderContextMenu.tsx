import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/editor/chrome-ui";

interface Props {
  folderId: string;
  folderName: string;
  x: number;
  y: number;
  onClose(): void;
  onRename(id: string): void;
  onDelete(id: string): void;
}

export function FolderContextMenu({
  folderId,
  folderName,
  x,
  y,
  onClose,
  onRename,
  onDelete,
}: Props) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const first = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"])',
    );
    first?.focus();
  }, []);

  React.useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

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
    top: Math.min(y, window.innerHeight - 120),
    left: Math.min(x, window.innerWidth - 200),
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
      aria-label={`Options for ${folderName}`}
      onKeyDown={handleKeyDown}
    >
      <Button
        type="button"
        className="bd-pg-menu-item"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onRename(folderId))}
      >
        Rename
      </Button>
      <div className="bd-pg-menu-divider" role="separator" />
      <Button
        type="button"
        className="bd-pg-menu-item danger"
        role="menuitem"
        tabIndex={-1}
        onClick={() => act(() => onDelete(folderId))}
      >
        Delete
      </Button>
    </div>
  );

  return createPortal(menu, document.body);
}
