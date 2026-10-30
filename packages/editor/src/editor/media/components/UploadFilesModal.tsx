/**
 * UploadFilesModal — Clone 3724:20828 "Upload files" (640).
 *
 * The header ↑ Upload's picker (and the two empty-state Uploads that share
 * its input) used to hand the files straight to `state.upload`. The Clone
 * puts a confirm between the two: one line per file — `name · EXT · size` —
 * the code's verdict on each, and the count in the primary. A file the
 * engine will refuse reads its reason on its line and is never handed over;
 * with nothing to hand over the primary is disabled. `validateFile` is the
 * gate `MediaManager.uploadFile` runs, so the modal and the engine agree.
 *
 * Once confirmed the same modal waits on the upload: each accepted line
 * reads its queue entry's progress, a failure reads its reason in place.
 * The orchestrator swaps in Upload complete when the batch resolves.
 *
 * Shape from `libraryModal.ts`. Progress bars are chrome-ui's `Progress`
 * rather than a styled span — no inline width to carry.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { validateFile } from "@/engine/media/MediaHelpers";
import { fileExtensionLabel } from "@shared/constants/media";
import { formatBytes } from "@shared/utils/helpers/number";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface UploadFilesModalProps {
  open: boolean;
  files: File[];
  onCancel(): void;
  /** Only the files the code accepts; a refused one never reaches here. */
  onUpload(files: File[]): void;
}

const LINE = `${LIBRARY_MODAL_BODY} tw:text-[var(--bk-ink)]`;
const REASON = "tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-warning-text)]";

/* 2L9 199:39336 — the confirm closes on Upload; progress and failures are the
   grid's own rows from then on, so this dialog never reads the queue. */
export function UploadFilesModal({ open, files, onCancel, onUpload }: UploadFilesModalProps) {
  const verdicts = React.useMemo(() => files.map((file) => ({ file, verdict: validateFile(file) })), [files]);
  const accepted = verdicts.filter((v) => v.verdict.valid).map((v) => v.file);
  const status = accepted.length > 0
      ? "Ready to upload to this site library."
      : "Nothing to upload.";
  return (
    <ModalRoot open={open} onClose={onCancel}>
      <ModalContent size="table" srTitle="Upload files" data-testid="mgr-upload-files">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-upload-files-title">
          Upload files
        </h2>
        <ModalBody>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0" data-testid="mgr-upload-files-lines">
            {verdicts.map(({ file, verdict }, i) => {
              const reason = verdict.valid ? null : verdict.error;
              return (
                <li key={`${file.name}-${i}`} className="tw:flex tw:flex-col tw:gap-1">
                  <span className={`${LINE} tw:min-w-0 tw:truncate`} data-testid={`mgr-upload-files-line-${i}`}>
                    {file.name} · {fileExtensionLabel(file.name)} · {formatBytes(file.size, 1)}
                  </span>
                  {reason ? (
                    <p className={REASON} data-testid={`mgr-upload-files-reason-${i}`}>
                      {reason}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className={`${LIBRARY_MODAL_BODY} tw:mt-3`} data-testid="mgr-upload-files-status">
            {status}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-upload-files-foot">
          <Button
            size="xs"
            variant="secondary"
            className={LIBRARY_MODAL_BTN_SECONDARY}
            data-testid="mgr-upload-files-cancel"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            data-testid="mgr-upload-files-confirm"
            disabled={accepted.length === 0}
            onClick={() => onUpload(accepted)}
          >
            {accepted.length > 1 ? `Upload ${accepted.length} files` : "Upload file"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
