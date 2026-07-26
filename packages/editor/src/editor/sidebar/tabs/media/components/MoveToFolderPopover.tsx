import * as React from "react";
import { Button } from "@/editor/ui";
import { Folder, FolderRoot } from "lucide-react";
import type { MediaFolder } from "@shared/types/media";

interface Props {
  folders: MediaFolder[];
  onPick(folderId: string | null): void;
  onClose(): void;
}

export function MoveToFolderPopover({ folders, onPick, onClose }: Props) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="med-move-popover"
      role="listbox"
      aria-label="Move to folder"
      data-testid="move-to-folder-popover"
    >
      <div className="med-move-popover__title">Move to folder</div>
      <Button
        type="button"
        kind="ghost"
        size="sm"
        className="med-move-popover__item"
        role="option"
        aria-selected={false}
        onClick={() => onPick(null)}
      >
        <FolderRoot size={14} aria-hidden />
        <span>All assets (root)</span>
      </Button>
      {folders.length === 0 ? (
        <div className="med-move-popover__empty">No folders yet.</div>
      ) : (
        folders.map((f) => (
          <Button
            key={f.id}
            type="button"
            kind="ghost"
            size="sm"
            className="med-move-popover__item"
            role="option"
            aria-selected={false}
            onClick={() => onPick(f.id)}
          >
            <Folder size={14} aria-hidden />
            <span>{f.name}</span>
          </Button>
        ))
      )}
    </div>
  );
}
