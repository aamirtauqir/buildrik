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
import { Button, ModalBody, ModalContent, ModalRoot, Progress } from "@/editor/chrome-ui";
import { validateFile } from "@/engine/media/MediaHelpers";
import { fileExtensionLabel } from "@shared/constants/media";
import { formatBytes } from "@shared/utils/helpers/number";
import type { UploadProgress } from "@shared/types/media";
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
  /** Upload was confirmed — the lines read the queue until the batch resolves. */
  uploading: boolean;
  uploadQueue: UploadProgress[];
  onCancel(): void;
  /** Only the files the code accepts; a refused one never reaches here. */
  onUpload(files: File[]): void;
}

const LINE = `${LIBRARY_MODAL_BODY} tw:text-[var(--bk-ink)]`;
const REASON = "tw:m-0 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-warning-text)]";

export function UploadFilesModal({ open, files, uploading, uploadQueue, onCancel, onUpload }: UploadFilesModalProps) {
  const verdicts = React.useMemo(() => files.map((file) => ({ file, verdict: validateFile(file) })), [files]);
  const accepted = verdicts.filter((v) => v.verdict.valid).map((v) => v.file);
  const status = uploading
    ? "Uploading…"
    : accepted.length > 0
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
              const entry = uploading ? uploadQueue.find((u) => u.fileName === file.name) : undefined;
              const reason = !verdict.valid ? verdict.error : entry?.status === "error" ? (entry.error ?? "Upload failed") : null;
              const running = entry && entry.status !== "error" && entry.status !== "complete";
              return (
                <li key={`${file.name}-${i}`} className="tw:flex tw:flex-col tw:gap-1">
                  <span className="tw:flex tw:items-baseline tw:gap-2">
                    <span className={`${LINE} tw:min-w-0 tw:flex-1 tw:truncate`} data-testid={`mgr-upload-files-line-${i}`}>
                      {file.name} · {fileExtensionLabel(file.name)} · {formatBytes(file.size, 1)}
                    </span>
                    {running ? (
                      <span
                        className="tw:[font-family:var(--bk-font-mono)] tw:text-[length:var(--bk-text-11)] tw:font-medium tw:tabular-nums tw:text-[var(--bk-ink-muted)]"
                        data-testid={`mgr-upload-files-pct-${i}`}
                      >
                        {Math.round(entry.progress)}%
                      </span>
                    ) : null}
                  </span>
                  {running ? (
                    <span data-testid={`mgr-upload-files-bar-${i}`}>
                      <Progress
                        progress={Math.round(entry.progress)}
                        size="sm"
                        aria-label={`Uploading ${file.name}`}
                        theme={{ color: { default: "tw:bg-[var(--bk-accent)]" } }}
                      />
                    </span>
                  ) : null}
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
          {uploading ? null : (
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              data-testid="mgr-upload-files-cancel"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            data-testid="mgr-upload-files-confirm"
            disabled={uploading || accepted.length === 0}
            onClick={() => onUpload(accepted)}
          >
            {uploading ? "Uploading…" : accepted.length > 1 ? `Upload ${accepted.length} files` : "Upload file"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
