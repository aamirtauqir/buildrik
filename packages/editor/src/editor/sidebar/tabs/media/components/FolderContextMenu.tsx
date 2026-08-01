import * as React from "react";
import { Menu, MenuItem, MenuSeparator, Portal } from "@/editor/chrome-ui";

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
    const handlePointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  // Arrow/Home/End roving lives in <Menu> (it also skips disabled items and
  // keeps a single tab stop). Escape and click-outside stay here: Menu is the
  // list, not the surface that owns dismissal.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
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
    <div ref={menuRef} style={style}>
      <Menu label={`Options for ${folderName}`} onKeyDown={handleKeyDown}>
        <MenuItem onClick={() => act(() => onRename(folderId))}>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem danger onClick={() => act(() => onDelete(folderId))}>
          Delete
        </MenuItem>
      </Menu>
    </div>
  );

  return <Portal>{menu}</Portal>;
}
