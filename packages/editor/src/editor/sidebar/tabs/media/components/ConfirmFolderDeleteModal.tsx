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
import { Modal, Button } from "@/editor/chrome-ui";

/* dialog/footer buttons (7401:1280): Cancel is plain gray-700 text; the
   secondary is outlined; primary accent; destructive red. Size comes from
   the Modal foot. */
const CANCEL_CLASS = "tw:border-transparent tw:bg-transparent tw:text-[var(--bk-gray-700)] tw:hover:text-[var(--bk-ink)]";
const SECONDARY_CLASS = "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-gray-700)]";
const PRIMARY_CLASS = "tw:border-0 tw:bg-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent-hover)] tw:text-[var(--bk-accent-on)]";
const DESTRUCTIVE_CLASS = "tw:border-0 tw:bg-[var(--bk-error)] tw:text-[var(--bk-accent-on)]";
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

  /* Board frame (560, pad 24, 20/30 title, 32px right-aligned actions)
     comes from chrome-ui's Modal. Empty: board B1-12 (7564:185450) — a body
     line and a BLUE Delete, since an empty folder takes nothing with it.
     Non-empty keeps the code's contract (Move files… or delete with
     contents); the red destructive button stays because files DO go. */
  return (
    <Modal
      open
      onClose={onCancel}
      title={isEmpty ? `Delete “${folderName}”?` : `“${folderName}” isn’t empty`}
      testId="mgr-folder-del"
      footer={
        <>
          <Button color="alternative" className={CANCEL_CLASS} onClick={onCancel}>
            Cancel
          </Button>
          {onMoveFiles && !isEmpty && (
            <Button color="alternative" className={SECONDARY_CLASS} onClick={onMoveFiles}>
              Move files…
            </Button>
          )}
          <Button
            className={isEmpty ? PRIMARY_CLASS : DESTRUCTIVE_CLASS}
            onClick={onConfirm}
          >
            Delete{!isEmpty ? " folder with contents" : ""}
          </Button>
        </>
      }
    >
      {isEmpty ? (
        "The folder is empty. Deleting it does not touch any file in the library."
      ) : (
        <>
          <p className="tw:m-0">It holds {summary}. Move them first, or delete the folder with its contents.</p>
          <div
            className="tw:mt-3 tw:rounded-md tw:bg-[var(--bk-warning-tint)] tw:px-2.5 tw:py-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text,var(--bk-warning))]"
            role="alert"
          >
            ⚠ Deleting this folder will remove its contents along with it.
          </div>
        </>
      )}
    </Modal>
  );
}
