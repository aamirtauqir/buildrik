/**
 * RemoveDomainDialog — Clone 3397:34402 `Remove <domain>?` (640).
 *
 * Opened by the Custom domain card's `Remove <domain>…` (edge on 3397:32206).
 * `Cancel` is the safe answer — it takes focus, and Escape and the scrim give
 * the same answer; `Remove domain` is the danger action and runs
 * `domains.remove`. The domain is in the title and the body, as the frame
 * writes it; the site name goes to the dialog's accessible name only.
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
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface RemoveDomainDialogProps {
  /** The domain to remove; `null` keeps the dialog closed. */
  domain: string | null;
  siteName: string;
  /** While `domains.remove` runs — both buttons wait for the answer. */
  busy?: boolean;
  /** Also Escape and the scrim. */
  onCancel(): void;
  onRemove(): void;
}

export function RemoveDomainDialog({ domain, siteName, busy = false, onCancel, onRemove }: RemoveDomainDialogProps) {
  const title = `Remove ${domain ?? ""}?`;
  return (
    <ModalRoot open={domain !== null} onClose={busy ? undefined : onCancel}>
      <ModalContent size="table" srTitle={siteName ? `${title} · ${siteName}` : title} data-testid="set-dom-confirm">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-dom-confirm-title">
          {title}
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-dom-confirm-body">
            {domain} stops pointing at this site. Visitors following that address get nothing until you reconnect it
            or change your DNS; the site keeps serving on its buildrick.app address.
          </p>
        </ModalBody>
        <div className={`${LIBRARY_MODAL_FOOT} tw:justify-end`} data-testid="set-dom-confirm-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            autoFocus
            disabled={busy}
            onClick={onCancel}
            data-testid="set-dom-confirm-cancel"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            disabled={busy}
            onClick={onRemove}
            data-testid="set-dom-confirm-remove"
          >
            Remove domain
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
