/**
 * Delete this site — boards 5890:44728 (typing) and 5891:44701 (confirmed).
 * Opened from the owner's Permissions dialog. Typing DELETE arms the red
 * button; the server's own check is the site's name (`sites.delete`), which
 * the caller supplies once DELETE is typed.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, TextInput } from "@/editor/chrome-ui";

const WORD = "DELETE";

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
  const armed = typed.trim() === WORD;

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Delete ${siteName}?`}
      testId="delete-site"
      footer={
        <>
          <Button color="light" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" disabled={!armed || busy} aria-busy={busy || undefined} onClick={() => void run()} data-testid="delete-site-confirm">
            Delete site
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-3">
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
          This permanently deletes the site and its project data from your workspace. This action cannot be undone.
        </p>
        <p
          className="tw:m-0 tw:flex tw:h-8 tw:items-center tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-error)] tw:px-3 tw:text-[12px] tw:text-white"
          role="note"
        >
          This is a permanent, project-level action.
        </p>
        <label className="tw:flex tw:flex-col tw:gap-1.5 tw:text-[12px] tw:font-medium tw:text-[var(--bk-ink)]">
          Type DELETE to confirm:
          <TextInput
            sizing="sm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Click to type DELETE"
            autoComplete="off"
            spellCheck={false}
            color={armed ? "success" : undefined}
            data-testid="delete-site-input"
          />
        </label>
        {armed ? (
          <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-success-text)]" data-testid="delete-site-armed">
            ✓ Confirmed — Delete site is enabled
          </span>
        ) : null}
        {error ? (
          <span className="tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </Modal>
  );
};
