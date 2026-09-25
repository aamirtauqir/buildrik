/**
 * ConflictModal (61-conflict) — single-writer save-conflict resolver.
 *
 * Shown when the server rejects a save because the site changed somewhere else
 * (another tab / device) since this editor loaded it. We never auto-merge, so
 * nothing is lost without the user choosing:
 *   - Reload latest   → discard local, reload the newer server copy
 *   - Save a backup   → download the local project, then reload
 *   - Overwrite       → force the local copy over the server's (with confirm)
 *
 * Mounted through the chrome-ui overlay primitive (B-7 / A13-10): the bespoke
 * fixed overlay it replaced put role="dialog" on the scrim, closed on a scrim
 * click, never moved focus in and let Tab walk out into the editor behind it.
 * OverlayMount owns the portal, the focus trap (focus lands on "Reload latest",
 * the least destructive way out) and Escape. A scrim click does NOT dismiss:
 * this dialog is the only thing standing between the user and a lost edit, and
 * the "Conflict" pill re-opens it after an explicit Escape anyway.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  Button,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTitle,
  OverlayMount,
} from "@/editor/chrome-ui";

export interface ConflictModalProps {
  open: boolean;
  onReload: () => void;
  onSaveBackup: () => void;
  onOverwrite: () => void;
  onClose: () => void;
}

const TITLE_ID = "conflict-modal-title";

export function ConflictModal({ open, onReload, onSaveBackup, onOverwrite, onClose }: ConflictModalProps) {
  const [confirmOverwrite, setConfirmOverwrite] = React.useState(false);
  React.useEffect(() => { if (!open) setConfirmOverwrite(false); }, [open]);

  return (
    <OverlayMount open={open} onClose={onClose} dismissOnScrimClick={false} labelledBy={TITLE_ID}>
      <ModalContent size="question" data-testid="conflict-modal">
        <ModalTitle id={TITLE_ID} data-testid="conflict-title">This site changed somewhere else</ModalTitle>
        <ModalBody>
          <p data-testid="conflict-body" className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
            Your copy is behind — it was edited in another tab or device since you opened it.
            We can&apos;t auto-merge, so pick how to continue. Nothing is lost without your choice.
          </p>
          {confirmOverwrite && (
            <p className="tw:mt-2.5 tw:mb-0 tw:text-[13px] tw:text-[var(--bk-warning-text)]">
              Overwrite replaces the newer copy with yours. The other changes will be gone.
            </p>
          )}
        </ModalBody>
        <ModalFooter data-testid="conflict-actions">
          <Button onClick={onReload}>Reload latest</Button>
          <Button color="light" onClick={onSaveBackup}>Save a backup</Button>
          {confirmOverwrite ? (
            <Button color="red" onClick={onOverwrite}>Yes, overwrite</Button>
          ) : (
            <Button color="light" onClick={() => setConfirmOverwrite(true)} className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]">Overwrite…</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </OverlayMount>
  );
}
