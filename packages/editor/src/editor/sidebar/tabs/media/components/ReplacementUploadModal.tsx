/**
 * ReplacementUploadModal — Clone 3585:23326 "Upload this replacement file?"
 * (560; section 3397:16873's drawer flow, re-drawing V1 145:148's Retry).
 *
 * The drawer's rejected row said `Choose a smaller file…` and a file was
 * picked. Before it uploads, the pick is named against the limit its OWN
 * type has — the code's `getMaxFileSize`, not the board's 50 MB — and the
 * refused original is named by the size the engine measured. A pick the
 * engine would refuse too reads that reason instead and cannot be sent:
 * `validateFile` is the same gate `MediaManager.uploadFile` runs, so the
 * modal and the engine cannot disagree.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons). The board draws the primary full width and Cancel as a bare
 * text link beneath it — the one library dialog with that footer.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { validateFile } from "@/engine/media/MediaHelpers";
import { fileExtensionLabel, getAssetTypeFromMime, getMaxFileSize, mimeTypeForFile } from "@shared/constants/media";
import { formatBytes } from "@shared/utils/helpers/number";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import type { FailedUpload } from "../data/mediaTypes";

interface ReplacementUploadModalProps {
  open: boolean;
  /** The refused record — its `size` is what the engine measured. */
  original: FailedUpload;
  /** The pick from `Choose a smaller file…`. */
  file: File;
  onUpload(): void;
  onCancel(): void;
}

/** "svg" is an image to the person choosing it; the engine's other kinds read as themselves. */
const KIND: Record<string, string> = { image: "image", svg: "image", video: "video", font: "font", audio: "audio" };

export function ReplacementUploadModal({ open, original, file, onUpload, onCancel }: ReplacementUploadModalProps) {
  const verdict = validateFile(file);
  const mime = mimeTypeForFile(file);
  const kind = KIND[getAssetTypeFromMime(mime) ?? ""] ?? "file";
  const originalSize = original.size !== undefined ? ` The original ${formatBytes(original.size, 1)} file was not uploaded.` : "";
  return (
    <ModalRoot open={open} onClose={onCancel}>
      <ModalContent size="form" srTitle="Upload this replacement file?" data-testid="media-replacement-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="media-replacement-title">
          Upload this replacement file?
        </h2>
        <ModalBody>
          <p className={`${LIBRARY_MODAL_BODY} tw:text-[var(--bk-ink)]`} data-testid="media-replacement-file">
            {file.name} · {formatBytes(file.size, 1)}
          </p>
          <p
            className={`${LIBRARY_MODAL_BODY} ${verdict.valid ? "" : "tw:text-[var(--bk-warning-text)]"}`}
            data-testid="media-replacement-verdict"
          >
            {verdict.valid
              ? `${fileExtensionLabel(file.name)} ${kind} · Within the ${formatBytes(getMaxFileSize(mime), 0)} limit.${originalSize}`
              : verdict.error}
          </p>
        </ModalBody>
        <div className={`${LIBRARY_MODAL_FOOT} tw:flex-col tw:items-stretch`} data-testid="media-replacement-foot">
          <Button
            size="xs"
            className={`${LIBRARY_MODAL_BTN_PRIMARY} tw:w-full`}
            data-testid="media-replacement-confirm"
            disabled={!verdict.valid}
            onClick={onUpload}
          >
            Upload file
          </Button>
          <Button
            size="xs"
            variant="link"
            className="tw:self-start tw:font-normal tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]"
            data-testid="media-replacement-cancel"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
