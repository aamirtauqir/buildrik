/**
 * ConfirmFolderDeleteModal — boards B1-12 / B1-13.
 *
 * P0 — closes the silent-refusal gap from the old deleteFolder path. The empty
 * branch deletes on confirm; the non-empty branch counts files AND sub-folders
 * and offers a "Move files…" action that lifts the existing Move-to-folder
 * modal (wiring lives in LibraryManager, not here). Cancellation always
 * closes; an error elsewhere → toast, folder stays.
 *
 * Styles inline `tw:` utilities per chrome-ui contract — no companion CSS.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ModalContent, ModalRoot, Button } from "@/editor/chrome-ui";
import type { ConfirmFolderDeletePayload } from "../data/mediaTypes";

interface ConfirmFolderDeleteModalProps {
  payload: ConfirmFolderDeletePayload;
  onConfirm(): void;
  onCancel(): void;
  /**
   * Move files… — drops the user into the existing Move-to-folder modal so
   * they can empty the folder without losing anything. LibraryManager owns
   * this state (the picker is outside this modal's scope).
   */
  onMoveFiles?(): void;
}

export function ConfirmFolderDeleteModal({
  payload,
  onConfirm,
  onCancel,
  onMoveFiles,
}: ConfirmFolderDeleteModalProps) {
  const { folderName, assetCount, subFolderCount } = payload;
  const isEmpty = assetCount === 0 && subFolderCount === 0;

  // "N files and M folders" — Section 5 finding. Hiding the sub-folder count
  // (or using "N files" when folders are also present) is the wrong copy;
  // a delete without that count would silently swallow the children.
  const summary = isEmpty
    ? null
    : `${assetCount} ${assetCount === 1 ? "file" : "files"} and ${subFolderCount} ${subFolderCount === 1 ? "folder" : "folders"}`;

  return (
    <ModalRoot open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <ModalContent
        srTitle={isEmpty ? `Delete folder ${folderName}` : `Folder ${folderName} is not empty`}
        className="tw:p-4"
      >
        <h3
          className="tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:text-[var(--bk-ink)]"
          id="mgr-folder-del-title"
        >
          {isEmpty
            ? `Delete "${folderName}"?`
            : `Folder "${folderName}" isn't empty`}
        </h3>

        {!isEmpty && summary && (
          <p className="tw:mt-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]">
            It holds {summary}. Move them first, or delete the folder with its contents.
          </p>
        )}

        {!isEmpty && (
          <div
            className="tw:mt-3 tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text,var(--bk-warning))]"
            role="alert"
          >
            ⚠ Deleting this folder will remove its contents along with it.
          </div>
        )}

        {/* Actions */}
        <div className="tw:mt-4 tw:flex tw:flex-wrap tw:items-center tw:justify-end tw:gap-2">
          <Button
            className="tw:h-7 tw:min-h-0 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-card)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink-soft)]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {onMoveFiles && !isEmpty && (
            <Button
              className="tw:h-7 tw:min-h-0 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-bg-card)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)]"
              onClick={onMoveFiles}
            >
              Move files…
            </Button>
          )}
          <Button
            className="tw:h-7 tw:min-h-0 tw:rounded-md tw:border-0 tw:bg-[var(--bk-error)] tw:px-3.5 tw:text-[13px] tw:font-medium tw:text-[var(--bk-accent-on)]"
            onClick={onConfirm}
          >
            Delete{!isEmpty ? " folder with contents" : ""}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
