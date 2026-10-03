/**
 * ArchiveSiteDialog — 8137:217085 `Archive <site>?` (560).
 *
 * Opened by the Danger zone's `Archive site`. Archive only hides the site
 * from the Sites list — the live site stays up (Q-B4) — so the confirm is
 * typed-free and the action is the accent primary, not the danger red.
 * `Archive site` runs `sites.archive` (ADMIN on the server, OWNER here —
 * the Danger zone is the owner's, PD-3); a refusal stays in the dialog.
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

export interface ArchiveSiteDialogProps {
  open: boolean;
  siteName: string;
  busy?: boolean;
  /** The server's refusal, under the body. */
  error?: string | null;
  onCancel(): void;
  onArchive(): void;
}

export function ArchiveSiteDialog({ open, siteName, busy = false, error, onCancel, onArchive }: ArchiveSiteDialogProps) {
  const title = `Archive ${siteName}?`;
  return (
    <ModalRoot open={open} onClose={busy ? undefined : onCancel}>
      <ModalContent size="question" srTitle={title} data-testid="set-danger-archive-dialog">
        <h2 className={LIBRARY_MODAL_TITLE}>{title}</h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY}>
            {siteName} will be hidden from the Sites list. The live site stays up. You can unarchive it later.
          </p>
          {error ? (
            <p className="tw:m-0 tw:mt-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button size="xs" variant="ghost" className={LIBRARY_MODAL_BTN_GHOST} autoFocus disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={onArchive}
            data-testid="set-danger-archive-confirm"
          >
            Archive site
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
