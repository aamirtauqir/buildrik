/**
 * StockSavedModal — Clone 3695:45573 "Stock image saved".
 *
 * The result of `Save to library` on the Stock assets dialog (edge `Save to
 * library|CLIC|SWA>3695:45573`): `<file> is now in your asset library.` /
 * `Not used on this site. Choose it from Assets when you are ready to insert
 * or replace an image.` · Done (primary) · View asset, which selects the
 * file in the details rail. Replaces the "Saved to library ✓" toast.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface StockSavedModalProps {
  saved: { name: string } | null;
  onClose(): void;
  onViewAsset(): void;
}

export function StockSavedModal({ saved, onClose, onViewAsset }: StockSavedModalProps) {
  if (!saved) return null;
  return (
    <ModalRoot open onClose={onClose}>
      <ModalContent size="table" srTitle="Stock image saved" data-testid="stock-saved">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="stock-saved-title">
          Stock image saved
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="stock-saved-body">
            {saved.name} is now in your asset library.
          </p>
          <p className={LIBRARY_MODAL_BODY} data-testid="stock-saved-note">
            Not used on this site. Choose it from Assets when you are ready to insert or replace an image.
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="stock-saved-foot">
          <Button size="xs" className={LIBRARY_MODAL_BTN_PRIMARY} onClick={onClose} data-testid="stock-saved-done">
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
            data-testid="stock-saved-view"
          >
            View asset
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
