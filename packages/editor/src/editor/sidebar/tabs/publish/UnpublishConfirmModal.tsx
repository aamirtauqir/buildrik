/**
 * UnpublishConfirmModal — board `4418:98016` (Site menu · Unpublish, typed
 * confirm, 560).
 *
 * Taking a site down is wide — every visitor loses it at once — so both doors
 * (the site menu's "Unpublish site…" and the panel's own button) land on this
 * ONE confirm, and it asks for the word rather than a click (G1-017 / G1-051,
 * decision 29: typed confirm where the action is wide). The plain
 * `ConfirmDialog` it replaces could be cleared by a stray Enter.
 *
 * The copy is the dashboard's, verbatim: the same sentence in both products
 * for the same act.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalRoot,
  ModalTitle,
  TextField,
} from "@/editor/chrome-ui";

export const UNPUBLISH_WORD = "UNPUBLISH";

export interface UnpublishConfirmModalProps {
  open: boolean;
  siteName: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const UnpublishConfirmModal: React.FC<UnpublishConfirmModalProps> = ({
  open,
  siteName,
  busy = false,
  onConfirm,
  onClose,
}) => {
  const [typed, setTyped] = React.useState("");
  /* A closed dialog forgets the word: reopening it half-typed would let the
     next Enter take the site down. */
  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const armed = typed.trim() === UNPUBLISH_WORD;

  return (
    <ModalRoot open={open} onOpenChange={(o) => !o && onClose()} dismissOnScrimClick={false}>
      <ModalContent size="form" srTitle="Unpublish site?" data-testid="unpublish-confirm">
        <ModalTitle>Unpublish site?</ModalTitle>
        <ModalBody>
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]" data-testid="unpublish-body">
            <strong className="tw:font-medium tw:text-[var(--bk-ink)]">{siteName}</strong> will be taken offline and
            its public URL will stop working until you publish again.
          </p>
          <p className="tw:mb-1.5 tw:mt-4 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
            Type <strong>{UNPUBLISH_WORD}</strong> to confirm:
          </p>
          <TextField
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={UNPUBLISH_WORD}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            aria-label={`Type ${UNPUBLISH_WORD} to confirm`}
            data-testid="unpublish-word"
            onKeyDown={(e) => {
              if (e.key === "Enter" && armed && !busy) onConfirm();
            }}
          />
        </ModalBody>
        <ModalFooter>
          <Button color="light" size="xs" disabled={busy} onClick={onClose} data-testid="unpublish-cancel">
            Cancel
          </Button>
          {/* `red`, not `failure` — ConfirmDialog is the precedent; flowbite's
              "failure" rendered a neutral grey button. Disabled until the word
              is typed: the confirm NAMES the action, and cannot be reached by
              a reflex. */}
          <Button
            color="red"
            size="xs"
            className="tw:bg-[var(--bk-error)] tw:hover:bg-[var(--bk-error-text)]"
            disabled={!armed || busy}
            aria-busy={busy || undefined}
            onClick={onConfirm}
            data-testid="unpublish-confirm-button"
          >
            {busy ? "Unpublishing…" : "Unpublish"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default UnpublishConfirmModal;
