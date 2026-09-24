/**
 * UnsavedSettingsDialog — "Unsaved settings", board 4418:165478 (560; was
 * Clone 3737:43639 at 640). Three answers, in the board's order: Discard
 * changes (danger) · Keep editing · Save and continue (primary — saves, then
 * finishes the nav or the exit that raised the dialog).
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

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_OUTLINE,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface UnsavedSettingsDialogProps {
  open: boolean;
  siteName: string;
  /** Also Escape and the scrim. */
  onKeepEditing(): void;
  onDiscard(): void;
  /** Save the screen, then carry on with what was asked. */
  onSaveAndContinue(): void;
  /** A save is running — the primary shows it and cannot be pressed twice. */
  saving?: boolean;
}

export function UnsavedSettingsDialog({ open, siteName, onKeepEditing, onDiscard, onSaveAndContinue, saving = false }: UnsavedSettingsDialogProps) {
  /* Keep editing takes focus. In the board's order Discard comes first, and
     the modal focuses its first control — Enter must never discard. */
  const keepRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (!open) return;
    keepRef.current?.focus();
    const id = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);
  return (
    <ModalRoot open={open} onClose={onKeepEditing}>
      <ModalContent
        className="tw:w-[560px]"
        srTitle={siteName ? `Unsaved settings · ${siteName}` : "Unsaved settings"}
        data-testid="set-unsaved"
      >
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-unsaved-title">
          Unsaved settings
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-unsaved-body">
            These settings have not been saved. Save them and continue, keep editing, or discard the pending edits.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-unsaved-foot">
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            onClick={onDiscard}
            data-testid="set-unsaved-discard"
          >
            Discard changes
          </Button>
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_OUTLINE}
            ref={keepRef}
            onClick={onKeepEditing}
            data-testid="set-unsaved-keep"
          >
            Keep editing
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={saving}
            onClick={onSaveAndContinue}
            data-testid="set-unsaved-save"
          >
            {saving ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
