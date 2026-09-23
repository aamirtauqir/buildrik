/**
 * UploadCompleteModal — Clone 3724:20832 "Upload complete" (640).
 *
 * The result of the Upload files confirm, once the batch has resolved: who
 * landed (`<name> is now in your library.` / `N files are now in your
 * library.`), that nothing on the site uses it yet, and two doors — Done,
 * and for a single file View asset, which selects it in the details rail.
 * The rail IS the asset's details (the prototype's 3721:45823 dialog is a
 * placeholder whose sub-dialogs say "Prototype preview only"), so View
 * asset lands there rather than in a fourth dialog.
 *
 * A file that failed in the same batch reads its reason under the result;
 * the grid's own failed rows stay the door for acting on it.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { MediaAsset } from "@shared/types/media";
import { displayNameFor } from "../../sidebar/tabs/media/data/mediaUtils";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface UploadCompleteModalProps {
  open: boolean;
  /** The assets that landed, in upload order. */
  landed: MediaAsset[];
  failed: Array<{ fileName: string; reason: string }>;
  onDone(): void;
  /** Selects the one landed file in the rail and closes. Ignored for N > 1. */
  onViewAsset(): void;
}

/** "svg" is an image to the person who chose it; the other engine kinds read as themselves. */
const NOUN: Record<string, string> = { image: "image", svg: "image", video: "video", font: "font", audio: "audio" };

export function UploadCompleteModal({ open, landed, failed, onDone, onViewAsset }: UploadCompleteModalProps) {
  const one = landed.length === 1 ? landed[0] : null;
  const hint = one
    ? `Not used on this site. Choose the ${NOUN[one.type] ?? "file"} when you are ready to insert it.`
    : "Not used on this site. Choose one when you are ready to insert it.";
  return (
    <ModalRoot open={open} onClose={onDone}>
      <ModalContent size="table" srTitle="Upload complete" data-testid="mgr-upload-complete">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-upload-complete-title">
          Upload complete
        </h2>
        <ModalBody>
          <p className={`${LIBRARY_MODAL_BODY} tw:text-[var(--bk-ink)]`} data-testid="mgr-upload-complete-body">
            {/* The name the library prints, not the file that was picked — the
                pipeline lands rasters as WebP (code:auto-webp). */}
            {one ? `${displayNameFor(one.name, one.mimeType)} is now in your library.` : `${landed.length} files are now in your library.`}
          </p>
          {failed.map((f, i) => (
            <p
              key={f.fileName}
              className="tw:m-0 tw:mt-1 tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-warning-text)]"
              data-testid={`mgr-upload-complete-failed-${i}`}
            >
              {f.fileName} — {f.reason}
            </p>
          ))}
          <p className={`${LIBRARY_MODAL_BODY} tw:mt-3`} data-testid="mgr-upload-complete-hint">
            {hint}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="mgr-upload-complete-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} data-testid="mgr-upload-complete-done" onClick={onDone}>
            Done
          </Button>
          {one ? (
            <Button
              size="xs"
              variant="secondary"
              className={LIBRARY_MODAL_BTN_SECONDARY}
              data-testid="mgr-upload-complete-view"
              onClick={onViewAsset}
            >
              View asset
            </Button>
          ) : null}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
