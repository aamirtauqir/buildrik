/**
 * SetPrimaryDomainDialog — 8136:214574 `Set <domain> as primary?` (560).
 *
 * Opened by a non-primary domain card's `Set as primary` (8136:214348).
 * `Cancel` is text only and takes focus; `Set as primary` is the accent
 * primary and runs `domains.setPrimary` (ADMIN, VERIFIED domains only — the
 * server refuses the rest and the dialog shows its sentence). The change is
 * live at once, so the body says no publish is needed.
 *
 * Shape from `libraryModal.ts` (the v3 dialog standard: 24 inset, 20/28
 * title, 14 body, right-aligned 32-high actions in an 8 gap).
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export interface SetPrimaryDomainDialogProps {
  /** The domain to make primary; `null` keeps the dialog closed. */
  domain: string | null;
  /** While `domains.setPrimary` runs — both buttons wait for the answer. */
  busy?: boolean;
  /** The server's refusal, shown under the body. */
  error?: string | null;
  /** Also Escape and the scrim. */
  onCancel(): void;
  onConfirm(): void;
}

export function SetPrimaryDomainDialog({ domain, busy = false, error, onCancel, onConfirm }: SetPrimaryDomainDialogProps) {
  const title = `Set ${domain ?? ""} as primary?`;
  return (
    <ModalRoot open={domain !== null} onClose={busy ? undefined : onCancel}>
      <ModalContent size="question" srTitle={title} data-testid="set-dom-primary-confirm">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="set-dom-primary-title">
          {title}
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="set-dom-primary-body">
            {domain} becomes the address visitors land on. This change is live immediately; no publish is needed.
          </p>
          {error ? (
            <p
              className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error-text)]"
              role="alert"
              data-testid="set-dom-primary-error"
            >
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button
            size="xs"
            variant="ghost"
            className={LIBRARY_MODAL_BTN_GHOST}
            autoFocus
            disabled={busy}
            onClick={onCancel}
            data-testid="set-dom-primary-cancel"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={onConfirm}
            data-testid="set-dom-primary-ok"
          >
            Set as primary
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
