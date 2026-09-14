/**
 * SettingsSavedDialog — Clone 3737:43624 "Settings saved" (640).
 *
 * Shown after every successful `Save changes` (edge `Action / Save changes|
 * CLIC|OVE>3737:43624` — decided: the frame's modal, not a toast). One
 * door, `Return to settings`, which takes focus; Escape and the scrim are
 * the same door, since there is nothing else this dialog could mean.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32-high
 * button) at the Clone's 640.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface SettingsSavedDialogProps {
  open: boolean;
  siteName: string;
  /** Also Escape and the scrim. */
  onReturn(): void;
}

export function SettingsSavedDialog({ open, siteName, onReturn }: SettingsSavedDialogProps) {
  return (
    <ModalRoot open={open} onClose={onReturn}>
      <ModalContent size="table" srTitle="Settings saved" data-testid="set-saved">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-saved-title">
          Settings saved
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-saved-body">
            {siteName ? `${siteName} · ` : ""}Configuration saved. Your canvas content is unchanged.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-saved-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} autoFocus onClick={onReturn} data-testid="set-saved-return">
            Return to settings
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
