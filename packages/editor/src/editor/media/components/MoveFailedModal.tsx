/**
 * MoveFailedModal — Clone 3699:20347 "Files could not be moved".
 *
 * Shown when the move the person asked for — from the Move modal or a drop
 * on a folder — was rejected by the engine (`bulkMoveAssets` rejects).
 * Nothing changed: the selection and the folders are as they were. Retry
 * runs the same move again; the orchestrator holds which one.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface MoveFailedModalProps {
  open: boolean;
  onClose(): void;
  onRetry(): void;
}

export function MoveFailedModal({ open, onClose, onRetry }: MoveFailedModalProps) {
  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle="Files could not be moved" data-testid="mgr-move-failed">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-move-failed-title">
          Files could not be moved
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="mgr-move-failed-body">
            No files moved. Your selection and current folders are unchanged. Try again.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-move-failed-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} data-testid="mgr-move-failed-cancel" onClick={onClose}>
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
