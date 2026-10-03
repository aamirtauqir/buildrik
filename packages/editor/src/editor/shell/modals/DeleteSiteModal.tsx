/**
 * Delete this site — 8137:217905 (confirm) → 8137:218168 (typed confirm),
 * the M17 copy over boards 5890:44728 / 5891:44701. Opened from the Danger
 * zone and from the owner's Permissions dialog.
 *
 * Step one says what happens: the live address is unpublished now (named when
 * there is one) and the site can be restored from Recently deleted for 30
 * days (`sites.restore`). Its red `Delete site` does not delete — it asks for
 * DELETE; typing it arms the same button, which runs the caller's delete. The
 * server's own check is the site's name (`sites.delete`), which the caller
 * supplies.
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

const WORD = "DELETE";

/** M17: what the delete takes down, and how long it can come back. */
function deleteSiteLine(liveAddress: string | null | undefined): string {
  const restore = "You can restore it from Recently deleted for 30 days.";
  return liveAddress ? `This unpublishes ${liveAddress} now. ${restore}` : `This takes the site offline now. ${restore}`;
}

export const DeleteSiteModal: React.FC<{
  open: boolean;
  siteName: string;
  /** The live address the delete unpublishes (`bellacucina.com`), when known. */
  liveAddress?: string | null;
  onClose: () => void;
  /** Resolves when the site is gone; rejects with the server's message. */
  onDelete: () => Promise<void>;
}> = ({ open, siteName, liveAddress, onClose, onDelete }) => {
  const [typing, setTyping] = React.useState(false);
  const [typed, setTyped] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      setTyping(false);
      setTyped("");
      setError(null);
    }
  }, [open]);
  const armed = typed.trim() === WORD;

  const run = async () => {
    if (!typing) {
      setTyping(true);
      return;
    }
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
            {deleteSiteLine(liveAddress)}
          </p>
          {typing ? (
            <div className="tw:flex tw:flex-col tw:gap-1">
              <label htmlFor="delete-site-input" className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink)]">
                Type DELETE to confirm
              </label>
              <TextInput
                id="delete-site-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={WORD}
                autoComplete="off"
                spellCheck={false}
                autoFocus
                data-testid="delete-site-input"
              />
            </div>
          ) : null}
          {error ? (
            <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button size="xs" variant="ghost" className={LIBRARY_MODAL_BTN_GHOST} disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="xs"
            variant="danger"
            className={LIBRARY_MODAL_BTN_DANGER}
            disabled={(typing && !armed) || busy}
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
