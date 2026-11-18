/**
 * MoveFailedModal — Clone 3699:20347 "Files could not be moved".
 *
 * Shown when the move the person asked for — from the Move modal or a drop
 * on a folder — was refused for some or all files (`bulkMoveAssets` names
 * them). A refused file stays where it was; Retry moves only those again;
 * the orchestrator holds which.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_GHOST, LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface MoveFailedModalProps {
  open: boolean;
  /** Files that did move before the refusal — 0 when none did. */
  movedCount: number;
  /** Files the server refused; Retry moves these. */
  failedCount: number;
  onClose(): void;
  onRetry(): void;
}

export function MoveFailedModal({ open, movedCount, failedCount, onClose, onRetry }: MoveFailedModalProps) {
  const files = (n: number) => `${n} file${n === 1 ? "" : "s"}`;
  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle="Files could not be moved" data-testid="mgr-move-failed">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-move-failed-title">
          Files could not be moved
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="mgr-move-failed-body">
            {movedCount > 0
              ? `${files(movedCount)} moved. ${files(failedCount)} could not be moved and stayed where ${failedCount === 1 ? "it was" : "they were"}. Try again.`
              : "No files moved. Your selection and current folders are unchanged. Try again."}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-move-failed-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_GHOST} data-testid="mgr-move-failed-cancel" onClick={onClose}>
            Cancel
          </Button>
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="mgr-move-failed-retry" autoFocus onClick={onRetry}>
            Retry
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
