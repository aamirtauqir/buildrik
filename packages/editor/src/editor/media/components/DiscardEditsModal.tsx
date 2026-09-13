/**
 * DiscardEditsModal — Clone 3695:45549 "Assets · discard" (640).
 *
 * Cancel on an image-editor draft with unsaved edits opens it (edge
 * `Action / Cancel|CLIC|OVE>3695:45549 discard` on every unsaved editor
 * frame). `Keep editing` is the primary — the board draws it accent-filled,
 * with `Discard changes` in the error fill beside it — and Escape is the
 * same answer, because the only thing a stray key must never do here is
 * throw the edits away. The editor with a clean draft never shows this; it
 * closes at once.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * buttons, 8 gap) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface DiscardEditsModalProps {
  open: boolean;
  onKeepEditing(): void;
  onDiscard(): void;
}

export function DiscardEditsModal({ open, onKeepEditing, onDiscard }: DiscardEditsModalProps) {
  return (
    <ModalRoot open={open} onClose={onKeepEditing}>
      <ModalContent size="table" srTitle="Discard unsaved changes?" data-testid="image-editor-discard">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="image-editor-discard-title">
          Discard unsaved changes?
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="image-editor-discard-body">
            The original and saved versions will remain unchanged.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="image-editor-discard-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} onClick={onKeepEditing} data-testid="image-editor-discard-keep">
            Keep editing
          </Button>
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            onClick={onDiscard}
            data-testid="image-editor-discard-confirm"
          >
            Discard changes
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
