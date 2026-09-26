/**
 * BulkToolbar — dark floating pill, absolute-positioned at bottom of pages panel.
 * Shown when 2+ pages are selected. Disabled Publish/Unpublish buttons removed
 * per DESIGN.md anti-slop rule (no disabled actions in primary chrome).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { FolderItem } from "../types";
import { Button } from "@/editor/chrome-ui";
import { MovePagesDialog, TOP_LEVEL } from "./MovePagesDialog";

interface Props {
  selectedCount: number;
  /** The selected pages' names, for the Move dialog's line. */
  selectedNames: string[];
  folders: FolderItem[];
  onDuplicate: () => void;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolders: () => void;
  onDelete: () => void;
}

export const BulkToolbar: React.FC<Props> = ({
  selectedCount,
  selectedNames,
  folders,
  onDuplicate,
  onMoveToFolder,
  onRemoveFromFolders,
  onDelete,
}) => {
  const [moveOpen, setMoveOpen] = React.useState(false);

  return (
    <div
      className="bd-pg-bulk-toolbar"
      role="toolbar"
      aria-label={`${selectedCount} pages selected`}
      data-testid="pages-bulk-bar"
    >
      <span className="bd-pg-bulk-count tabular">
        <b>{selectedCount}</b> selected
      </span>
      {/* v3 4418:94471: the count, Duplicate, Move to…, Delete. No ✕ — the
          header's "Done" (7069:78984) leaves select mode. */}
      <Button type="button" onClick={onDuplicate}>Duplicate</Button>
      <Button type="button" data-testid="pages-bulk-move" onClick={() => setMoveOpen(true)}>
        Move to…
      </Button>
      <Button type="button" className="danger" onClick={onDelete}>Delete</Button>
      <MovePagesDialog
        open={moveOpen}
        pageNames={selectedNames}
        folders={folders}
        onClose={() => setMoveOpen(false)}
        onMove={(target) => {
          setMoveOpen(false);
          if (target === TOP_LEVEL) onRemoveFromFolders();
          else onMoveToFolder(target);
        }}
      />
    </div>
  );
};

BulkToolbar.displayName = "BulkToolbar";
