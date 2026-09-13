/**
 * ImportResultModal — Clone 3695:43873 "Image imported" and 3695:43876
 * "Image could not be imported": the two outcomes of an Import image from
 * URL, one component because a result is one thing that went one of two
 * ways, and the orchestrator holds exactly one of them at a time.
 *
 * Imported: `<file> · <Kind>` / `Added to your library · Not used on this
 * site.` (true by construction — a file that just arrived is placed nowhere)
 * · Done (primary) · View asset, which selects it in the details rail (the
 * rail IS the asset's details; the prototype's Asset details dialog
 * 3721:45823 is not built — its sub-dialogs say "Prototype preview only").
 *
 * Could not be imported: the sentence names the kinds the surface really
 * accepts (`acceptedMedia.ts`, the upload gate's own table) · Cancel · Edit
 * URL (primary — edge `Edit URL|CLIC|SWA>3397:18835`, the import dialog
 * again with the address kept). When the fetch succeeded and the UPLOAD
 * refused the file — 24 MB against a 10 MB limit — the type sentence would
 * be a lie, so the engine's own reason is the body then.
 *
 * Replaces the `<file> imported` / `Could not import from that URL` toasts.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { MediaAssetType } from "../../../shared/types/media";
import { acceptedFormats, kindLabel } from "@shared/constants/media";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

export type ImportResult =
  | {
      kind: "imported";
      /** The library key View asset selects. */
      key: string;
      name: string;
      type: MediaAssetType;
    }
  | {
      kind: "failed";
      url: string;
      /** The kinds this surface accepts — what the sentence lists. */
      accepts: readonly MediaAssetType[];
      /** The upload's own refusal, when the file was fetched but not admitted. */
      reason?: string;
    };

interface ImportResultModalProps {
  result: ImportResult | null;
  onClose(): void;
  onViewAsset(): void;
  onEditUrl(url: string): void;
}

/** "supported image … image URL" for an image-only field; "file" for a mixed accept set. */
function refusal(accepts: readonly MediaAssetType[]): string {
  const noun = accepts.length === 1 && accepts[0] === "image" ? "image" : "file";
  return `This URL does not return a supported ${noun}. Use a direct ${acceptedFormats(accepts)} ${noun} URL.`;
}

export function ImportResultModal({ result, onClose, onViewAsset, onEditUrl }: ImportResultModalProps) {
  if (!result) return null;
  const imported = result.kind === "imported";
  const title = imported ? "Image imported" : "Image could not be imported";
  return (
    <ModalRoot open onClose={onClose}>
      <ModalContent size="table" srTitle={title} data-testid="import-result" data-kind={result.kind}>
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="import-result-title">
          {title}
        </h2>
        <ModalBody>
          {imported ? (
            <>
              <p className={LIBRARY_MODAL_BODY} data-testid="import-result-body">
                {result.name} · {kindLabel([result.type])}
              </p>
              <p className={LIBRARY_MODAL_BODY} data-testid="import-result-note">
                Added to your library · Not used on this site.
              </p>
            </>
          ) : (
            <p className={LIBRARY_MODAL_BODY} data-testid="import-result-body">
              {result.reason ?? refusal(result.accepts)}
            </p>
          )}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="import-result-foot">
          {imported ? (
            <>
              <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} onClick={onClose} data-testid="import-result-done">
                Done
              </Button>
              <Button
                size="xs"
                variant="secondary"
                className={LIBRARY_MODAL_BTN_SECONDARY}
                onClick={() => {
                  onViewAsset();
                  onClose();
                }}
                data-testid="import-result-view"
              >
                View asset
              </Button>
            </>
          ) : (
            <>
              <Button
                size="xs"
                variant="secondary"
                className={LIBRARY_MODAL_BTN_SECONDARY}
                onClick={onClose}
                data-testid="import-result-cancel"
              >
                Cancel
              </Button>
              <Button
                size="xs"
                className={LIBRARY_MODAL_BTN_PRIMARY}
                onClick={() => {
                  onEditUrl(result.url);
                  onClose();
                }}
                data-testid="import-result-edit"
              >
                Edit URL
              </Button>
            </>
          )}
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
