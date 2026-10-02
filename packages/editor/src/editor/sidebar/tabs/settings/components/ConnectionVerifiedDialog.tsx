/**
 * ConnectionVerifiedDialog — Clone 4256:26844 "Connection verified" (640),
 * retitled per plan row #34 / SET-05: the check proves the id's FORMAT and
 * reads the tracker's count — it cannot prove a connection, so with no events
 * the dialog says "Format OK · no events yet" rather than "verified".
 *
 * Opened by the Analytics screen's "Check data is arriving" once the
 * Measurement ID's shape passed and the tracker's status was read again. The
 * line says what that read found — `<id> is receiving data. 1,284 events
 * arrived in the last 24 hours.` or `<id> has the right format. No events have
 * arrived yet.` — and the note
 * that the check was just now. One door, `Back to analytics`, which takes
 * focus; Escape and the scrim are the same door.
 *
 * Same shape as `SettingsSavedDialog` (`libraryModal.ts`: title 16/600, body
 * 13 ink-soft, 32-high button) at the Clone's 640.
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

/** `1,284 events` / `1 event` — the count as the frame draws it, here and on the screen's Last received data row. */
export function eventsPhrase(n: number): string {
  return `${n.toLocaleString("en-GB")} ${n === 1 ? "event" : "events"}`;
}

/** The dialog's line for a verified id and the events counted in the last 24 hours. */
export function connectionVerifiedLine(id: string, events24h: number): string {
  return events24h > 0
    ? `${id} is receiving data. ${eventsPhrase(events24h)} arrived in the last 24 hours.`
    : `${id} has the right format. No events have arrived yet.`;
}

/** The dialog's title: what the check could establish. */
export const connectionCheckTitle = (events24h: number) => (events24h > 0 ? "Data is arriving" : "Format OK · no events yet");

export interface ConnectionVerifiedDialogProps {
  open: boolean;
  /** The Measurement ID that was verified, e.g. `G-4XQ2P7B1KD`. */
  id: string;
  /** The tracker's count at the check. */
  events24h: number;
  /** Also Escape and the scrim. */
  onBack(): void;
}

export function ConnectionVerifiedDialog({ open, id, events24h, onBack }: ConnectionVerifiedDialogProps) {
  return (
    <ModalRoot open={open} onClose={onBack}>
      <ModalContent size="table" srTitle={connectionCheckTitle(events24h)} data-testid="set-an-verified">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-an-verified-title">
          {connectionCheckTitle(events24h)}
        </h2>
        <ModalBody className="tw:flex tw:flex-col tw:gap-2">
          <p className={LIBRARY_MODAL_BODY} data-testid="set-an-verified-line">
            {connectionVerifiedLine(id, events24h)}
          </p>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-an-verified-note">
            Last checked just now · Data usually appears within 30 minutes of the first visit.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="set-an-verified-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} autoFocus onClick={onBack} data-testid="set-an-verified-back">
            Back to analytics
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
