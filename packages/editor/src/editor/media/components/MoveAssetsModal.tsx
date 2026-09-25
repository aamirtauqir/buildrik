/**
 * MoveAssetsModal — Clone 3683:19950 "Move 2 assets".
 *
 * The bulk bar's `Move to folder…` (and the rail's `Move to folder`) open
 * it — prototype edge `Move to folder…|CLIC|OVE>Assets · Move selected
 * files`. Title counts the checked set; the body says where each file IS
 * ("hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled. Choose a
 * destination."); then one full-width secondary button per folder — every
 * folder the library holds, nested ones included, and the one a file is
 * already in (the result copy explains that case, 3699:20381) — and
 * Cancel. Choosing a folder IS the move; the orchestrator runs it and shows
 * the result in the rail.
 *
 * Displaces the bulk bar's inline picker popover (AssetGrid's
 * `bulkMovePickerOpen`), which moved on the spot, toasted "Moved N to X",
 * threw the person out of select mode, and offered a `Root` row the board
 * does not draw — unfiling stays a drop on `All assets`.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap). The folder buttons are the modal's secondary recipe at
 * full width, stacked on the same 8 gap.
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { LibraryItem, MediaFolder } from "../../sidebar/tabs/media/data/mediaTypes";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface MoveAssetsModalProps {
  open: boolean;
  /** The checked set, in the order the list shows it. */
  items: LibraryItem[];
  /** Every folder the library holds (`state.allFolders`). */
  folders: MediaFolder[];
  onClose(): void;
  /** The destination the person chose. Moving stays upstream. */
  onMove(folderId: string): void;
}

/** "hero-dark.jpg is in Hero shots; chef-intro.mp4 is unfiled." */
function whereEachIs(items: LibraryItem[], folders: MediaFolder[]): string {
  return items
    .map((item) => {
      const name = item.displayName ?? item.name;
      const folder = item.folderId ? folders.find((f) => f.id === item.folderId) : undefined;
      return folder ? `${name} is in ${folder.name}` : `${name} is unfiled`;
    })
    .join("; ");
}

export function MoveAssetsModal({ open, items, folders, onClose, onMove }: MoveAssetsModalProps) {
  const n = items.length;
  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle={`Move ${n} ${n === 1 ? "asset" : "assets"}`} data-testid="mgr-move">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="mgr-move-title">
          Move {n} {n === 1 ? "asset" : "assets"}
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="mgr-move-body">
            {whereEachIs(items, folders)}. Choose a destination.
          </p>
          <div className="tw:mt-3 tw:flex tw:flex-col tw:gap-2" data-testid="mgr-move-folders">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                size="xs"
                variant="secondary"
                className={`${LIBRARY_MODAL_BTN_SECONDARY} tw:w-full`}
                data-testid={`mgr-move-folder-${folder.id}`}
                onClick={() => {
                  onMove(folder.id);
                  onClose();
                }}
              >
                {folder.name}
              </Button>
            ))}
          </div>
        </ModalBody>
        {/* 4418:149891 — this one keeps its grey Cancel at the left, under the folder list. */}
        <div className={LIBRARY_MODAL_FOOT.replace("tw:justify-end", "tw:justify-start")} data-testid="mgr-move-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} data-testid="mgr-move-cancel" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
