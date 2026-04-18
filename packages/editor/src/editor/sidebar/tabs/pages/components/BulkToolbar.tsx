/**
 * BulkToolbar — Sticky action bar shown when 2+ pages are selected.
 * Visual port of prototype .bulk-toolbar.
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
    <div className="pg-bulk" role="toolbar" aria-label={`${selectedCount} pages selected`}>
      <span className="pg-bulk__count"><b>{selectedCount}</b> selected</span>
      <span className="pg-bulk__spacer" />

      <button className="pg-bulk__btn" disabled title="Coming soon — publish flow">Publish</button>
      <button className="pg-bulk__btn" disabled title="Coming soon — unpublish flow">Unpublish</button>

      <div className="pg-bulk__folder-wrap" ref={pickerRef}>
        <button
          className="pg-bulk__btn"
          onClick={() => setFolderPickerOpen((o) => !o)}
          aria-expanded={folderPickerOpen}
          aria-haspopup="menu"
        >
          Move to…
        </button>
        {folderPickerOpen && (
          <div className="pg-bulk__folder-menu" role="menu">
            {folders.length === 0 ? (
              <div className="pg-bulk__folder-empty">No folders yet</div>
            ) : folders.map((f) => (
              <button
                key={f.id}
                className="pg-bulk__folder-item"
                role="menuitem"
                onClick={() => { onMoveToFolder(f.id); setFolderPickerOpen(false); }}
              >
                {f.name}
              </button>
            ))}
            <div className="pg-bulk__folder-sep" />
            <button
              className="pg-bulk__folder-item"
              role="menuitem"
              onClick={() => { onRemoveFromFolders(); setFolderPickerOpen(false); }}
            >
              Remove from folder
            </button>
          </div>
        )}
      </div>

      <button className="pg-bulk__btn" onClick={onDuplicate}>Duplicate</button>
      <button className="pg-bulk__btn pg-bulk__btn--danger" onClick={onDelete}>Delete</button>

      <button className="pg-bulk__clear" onClick={onClear} aria-label="Clear selection" title="Clear selection">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

BulkToolbar.displayName = "BulkToolbar";
