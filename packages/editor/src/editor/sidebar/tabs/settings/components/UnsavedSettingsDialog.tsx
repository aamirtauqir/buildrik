/**
 * UnsavedSettingsDialog — Clone 3737:43639 "Unsaved settings" (640).
 *
 * The guard on every way out of a dirty settings screen: `‹ Back to canvas`,
 * `Cancel`, `Done`, Escape and any nav click (edge `Action / Cancel|CLIC|OVE>
 * 3737:43639` on every screen). `Keep editing` is the safe answer — it takes
 * focus, and Escape and the scrim give the same answer, because the one
 * thing a stray key must never do here is throw the edits away. `Discard and
 * return to canvas` is the danger action. The frame's buttons render
 * unstyled (a broken frame); the copy is its contract, the shape is
 * `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high buttons, 8 gap)
 * at the Clone's 640, the same as the media library's Discard dialog.
 *
 * The site name is not in the frame's body, so it goes to the dialog's
 * accessible name only.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface UnsavedSettingsDialogProps {
  open: boolean;
  siteName: string;
  /** Also Escape and the scrim. */
  onKeepEditing(): void;
  onDiscard(): void;
}

export function UnsavedSettingsDialog({ open, siteName, onKeepEditing, onDiscard }: UnsavedSettingsDialogProps) {
  return (
    <ModalRoot open={open} onClose={onKeepEditing}>
      <ModalContent
        size="table"
        srTitle={siteName ? `Unsaved settings · ${siteName}` : "Unsaved settings"}
        data-testid="set-unsaved"
      >
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-unsaved-title">
          Unsaved settings
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-unsaved-body">
            These settings have not been saved. Keep editing to finish them, or discard the pending edits and return
            to the canvas.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-unsaved-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            autoFocus
            onClick={onKeepEditing}
            data-testid="set-unsaved-keep"
          >
            Keep editing
          </Button>
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            onClick={onDiscard}
            data-testid="set-unsaved-discard"
          >
            Discard and return to canvas
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
