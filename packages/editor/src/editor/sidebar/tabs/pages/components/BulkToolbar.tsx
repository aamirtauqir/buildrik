/**
 * BulkToolbar — design-2l9 board 139:47668: a gray band under the view tabs
 * while any page is ticked. "3 selected" with Clear on the right, then
 * Duplicate · Move to… · Delete (red) side by side. The Pages footer stays.
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
  /** Some selected page sits in a folder — only then is Top level a move. */
  anyInFolder: boolean;
  /** The homepage's name when it is among the selected pages (139:52895). */
  homeSelected?: string | null;
  onDuplicate: () => void;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolders: () => void;
  onDelete: () => void;
  /** Clear — ends the selection (and select mode). */
  onClear: () => void;
}

const ACTION =
  "tw:h-7 tw:min-h-0 tw:flex-1 tw:justify-center tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:focus:ring-0 tw:enabled:hover:bg-[var(--bk-gray-200)]";

export const BulkToolbar: React.FC<Props> = ({
  selectedCount,
  selectedNames,
  folders,
  anyInFolder,
  homeSelected = null,
  onDuplicate,
  onMoveToFolder,
  onRemoveFromFolders,
  onDelete,
  onClear,
}) => {
  const [moveOpen, setMoveOpen] = React.useState(false);

  /* 139:52895: the homepage is never deleted from here — with it alone
     selected Delete is off, and the reason is said under the bar. */
  const deleteOff = homeSelected !== null && selectedCount === 1;
  return (
    <>
    <div
      className="tw:flex tw:shrink-0 tw:flex-col tw:bg-[var(--bk-gray-100)] tw:px-3 tw:pt-1.5 tw:pb-1"
      role="toolbar"
      aria-label={`${selectedCount} pages selected`}
      data-testid="pages-bulk-bar"
    >
      <div className="tw:flex tw:h-7 tw:items-center tw:justify-between">
        <span className="tw:text-[13px] tw:font-semibold tw:tabular-nums tw:text-[var(--bk-ink)]" data-testid="pages-bulk-count">
          {`${selectedCount} selected`}
        </span>
        <Button color="light" size="xs" className={`${ACTION} tw:flex-none tw:px-2`} data-testid="pages-bulk-clear" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="tw:flex tw:items-center">
        <Button color="light" size="xs" className={ACTION} onClick={onDuplicate}>Duplicate</Button>
        <Button color="light" size="xs" className={ACTION} data-testid="pages-bulk-move" onClick={() => setMoveOpen(true)}>
          Move to…
        </Button>
        <Button
          color="light"
          size="xs"
          className={`${ACTION} ${deleteOff ? "tw:text-[var(--bk-ink-disabled)]" : "tw:text-[var(--bk-error)]"}`}
          disabled={deleteOff}
          data-testid="pages-bulk-delete"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
      <MovePagesDialog
        open={moveOpen}
        pageNames={selectedNames}
        folders={folders}
        offerTopLevel={anyInFolder || folders.length === 0}
        onClose={() => setMoveOpen(false)}
        onMove={(target) => {
          setMoveOpen(false);
          if (target === TOP_LEVEL) onRemoveFromFolders();
          else onMoveToFolder(target);
        }}
      />
    </div>
    {homeSelected !== null && (
      <div className="tw:mx-3 tw:mt-2 tw:shrink-0 tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:px-2 tw:py-1.5" role="note" data-testid="pages-bulk-home-note">
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]">{`${homeSelected} is the homepage`}</p>
        <p className="tw:m-0 tw:mt-0.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          {`Set another page as the homepage before deleting ${homeSelected}.`}
        </p>
      </div>
    )}
    </>
  );
};

BulkToolbar.displayName = "BulkToolbar";
