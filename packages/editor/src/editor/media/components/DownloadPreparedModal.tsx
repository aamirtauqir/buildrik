/**
 * DownloadPreparedModal — Clone 3701:20394 "Download prepared".
 *
 * Shown once the bulk bar's Download has handed every selected file to the
 * browser (`MediaManager.downloadAssets` returns how many it started). The
 * "Downloading N files" toast the bar fires is the progress signal; this is
 * the result the Clone draws.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { LIBRARY_MODAL_BODY, LIBRARY_MODAL_BTN_PRIMARY, LIBRARY_MODAL_FOOT, LIBRARY_MODAL_TITLE } from "./libraryModal";

interface DownloadPreparedModalProps {
  open: boolean;
  onClose(): void;
}

export function DownloadPreparedModal({ open, onClose }: DownloadPreparedModalProps) {
  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle="Download prepared" data-testid="mgr-download-prepared">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-download-title">
          Download prepared
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="mgr-download-body">
            The selected file or selected-file archive is ready. Your assets and site placements are unchanged.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-download-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="mgr-download-done" onClick={onClose}>
            Done
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
