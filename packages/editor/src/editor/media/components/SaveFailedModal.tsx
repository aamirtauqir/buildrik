/**
 * SaveFailedModal — Clone 3695:45542 "Assets · failure" (640).
 *
 * The image editor's `onSave` rejected (the upload, in the shipping host).
 * The draft is untouched behind it: `Continue editing` (and Escape) closes
 * only this dialog, `Retry save` re-runs the SAME save — the bytes already
 * rendered, the same edits snapshot — so a retry cannot quietly save
 * something other than what failed (edge `Retry save|CLIC|SWA>3681:20026`).
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * buttons, 8 gap) at the Clone's 640.
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

interface SaveFailedModalProps {
  open: boolean;
  /** A retry is in flight — both doors are inert until it settles. */
  retrying: boolean;
  onContinueEditing(): void;
  onRetry(): void;
}

export function SaveFailedModal({ open, retrying, onContinueEditing, onRetry }: SaveFailedModalProps) {
  return (
    <ModalRoot open={open} onClose={retrying ? () => {} : onContinueEditing} dismissOnScrimClick={false}>
      <ModalContent size="table" srTitle="Version could not be saved" data-testid="image-editor-failed">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="image-editor-failed-title">
          Version could not be saved
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="image-editor-failed-body">
            Your edits are retained. Check your connection and try again.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="image-editor-failed-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            onClick={onContinueEditing}
            disabled={retrying}
            data-testid="image-editor-failed-continue"
          >
            Continue editing
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            onClick={onRetry}
            disabled={retrying}
            data-testid="image-editor-failed-retry"
          >
            {retrying ? "Saving…" : "Retry save"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
