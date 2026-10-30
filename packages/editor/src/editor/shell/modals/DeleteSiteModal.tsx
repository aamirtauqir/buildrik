/**
 * Delete this site — 2L9 B8-S17 (238:14765). One step: what happens, then the
 * site's own name typed to arm the red "Delete site" — the same name the
 * server checks (`sites.delete`). The site goes offline and can be restored
 * from Recently deleted for 30 days (`sites.restore`). Opened from the Danger
 * zone and from the owner's Permissions dialog.
 *
 * It was two steps (8137:217905 → 8137:218168, typing DELETE); the 2L9 board
 * asks for the name up front.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_DANGER,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";

export const DeleteSiteModal: React.FC<{
  open: boolean;
  siteName: string;
  onClose: () => void;
  /** Resolves when the site is gone; rejects with the server's message. */
  onDelete: () => Promise<void>;
}> = ({ open, siteName, onClose, onDelete }) => {
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      setTyped("");
      setError(null);
    }
  }, [open]);
  const armed = typed.trim() === siteName.trim();

  const run = async () => {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't delete the site. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const title = `Delete ${siteName}?`;
  return (
    <ModalRoot open={open} onClose={busy ? undefined : onClose}>
      <ModalContent size="question" srTitle={title} data-testid="delete-site">
        <h2 className={LIBRARY_MODAL_TITLE}>{title}</h2>
        <ModalBody className="tw:flex tw:flex-col tw:gap-4">
          <p className={LIBRARY_MODAL_BODY} data-testid="delete-site-line">
            The site goes offline and moves to Recently deleted. You can restore it for 30 days.
          </p>
          <div className="tw:flex tw:flex-col tw:gap-1">
            <label htmlFor="delete-site-input" className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink)]">
              Type {siteName} to confirm
            </label>
            <TextInput
              id="delete-site-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void run();
              }}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              data-testid="delete-site-input"
            />
          </div>
          {error ? (
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button size="xs" variant="ghost" className={`${LIBRARY_MODAL_BTN_GHOST} tw:border tw:border-[var(--bk-border)]`} disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            variant="danger"
            /* B8-S17: unarmed, it reads unavailable (grey), not a faded red. */
            className={`${LIBRARY_MODAL_BTN_DANGER} tw:disabled:border-transparent tw:disabled:bg-[var(--bk-bg-subtle)] tw:disabled:text-[var(--bk-ink-muted)] tw:disabled:opacity-100`}
            disabled={!armed || busy}
            aria-busy={busy || undefined}
            onClick={() => void run()}
            data-testid="delete-site-confirm"
          >
            Delete site
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};
