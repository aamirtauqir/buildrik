import { Button } from "@/editor/shared/vibcoder/Button";
/**
 * BulkToolbar — dark floating pill, absolute-positioned at bottom of pages panel.
 * Shown when 2+ pages are selected. Disabled Publish/Unpublish buttons removed
 * per DESIGN.md anti-slop rule (no disabled actions in primary chrome).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FolderItem } from "../types";

interface Props {
  selectedCount: number;
  folders: FolderItem[];
  onDuplicate: () => void;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolders: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export const BulkToolbar: React.FC<Props> = ({
  selectedCount,
  folders,
  onDuplicate,
  onMoveToFolder,
  onRemoveFromFolders,
  onDelete,
  onClear,
}) => {
  const [folderPickerOpen, setFolderPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!folderPickerOpen) return;
    const handle = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setFolderPickerOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [folderPickerOpen]);

  return (
    <div className="bd-pg-bulk-toolbar" role="toolbar" aria-label={`${selectedCount} pages selected`}>
      <span className="bd-pg-bulk-count tabular">
        <b>{selectedCount}</b> selected
      </span>
      <span className="bd-pg-bulk-spacer" />
      <div className="bd-pg-bulk-folder" ref={pickerRef}>
        <Button
          type="button"
          onClick={() => setFolderPickerOpen((o) => !o)}
          aria-expanded={folderPickerOpen}
          aria-haspopup="menu"
        >
          Move to…
        </Button>
        {folderPickerOpen && (
          <div className="bd-pg-bulk-menu" role="menu">
            {folders.length === 0 ? (
              <div className="bd-pg-bulk-menu-empty">No folders yet</div>
            ) : (
              folders.map((f) => (
                <Button
                  key={f.id}
                  type="button"
                  className="bd-pg-bulk-menu-item"
                  role="menuitem"
                  onClick={() => {
                    onMoveToFolder(f.id);
                    setFolderPickerOpen(false);
                  }}
                >
                  {f.name}
                </Button>
              ))
            )}
            <div className="bd-pg-bulk-menu-sep" />
            <Button
              type="button"
              className="bd-pg-bulk-menu-item"
              role="menuitem"
              onClick={() => {
                onRemoveFromFolders();
                setFolderPickerOpen(false);
              }}
            >
              Remove from folder
            </Button>
          </div>
        )}
      </div>
      <Button type="button" onClick={onDuplicate}>Duplicate</Button>
      <Button type="button" className="danger" onClick={onDelete}>Delete</Button>
      <Button
        type="button"
        className="bd-pg-bulk-close"
        onClick={onClear}
        aria-label="Clear selection"
        title="Clear selection"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </Button>
    </div>
  );
};

BulkToolbar.displayName = "BulkToolbar";
