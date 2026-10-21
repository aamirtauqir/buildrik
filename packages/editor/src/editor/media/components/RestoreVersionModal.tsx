/**
 * RestoreVersionModal — the library's confirm for restoring a version across
 * the site (Clone 3695:45615, the confirm, 560) and the progress card while
 * the placements update (3720:43313, 640 × 108). Phase 6.
 *
 * Restore means what it means in the drawer (REA 2026-10-20 M-5): every
 * placement the family has on the site moves onto this version's file. The
 * confirm says what will change in the site's own numbers: `Update 3 uses on
 * Home and Menu to v1 · Original. Every other version remains available.` —
 * the count is `getUsages`, the pages the join the delete confirm runs — and
 * its primary reads `Restore on 3 uses`. Nothing to move → the primary is
 * disabled and the body says why.
 *
 * `replaceAcross` itself is synchronous, so the progress card exists to be
 * SEEN: the orchestrator holds it for a beat (the prototype's own
 * AFTER-delay edge) before the result takes its place.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap).
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { namePages } from "@/editor/sidebar/tabs/media/data/mediaUtils";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface RestoreVersionModalProps {
  open: boolean;
  /** The parent's display name — the nothing-to-move body names it. */
  name: string;
  /** The version being restored, as the list labels it (`v1 · Original`). */
  label: string;
  /** Placements the restore would move. */
  uses: number;
  /** The pages those placements sit on; empty when none could be traced. */
  pages: string[];
  /** The progress card instead of the confirm (3720:43313). */
  applying: boolean;
  onClose(): void;
  onRestore(): void;
}

const useWord = (n: number) => `${n} ${n === 1 ? "use" : "uses"}`;

export function RestoreVersionModal({ open, name, label, uses, pages, applying, onClose, onRestore }: RestoreVersionModalProps) {
  const where = pages.length > 0 ? ` on ${namePages(pages)}` : "";

  if (applying) {
    return (
      <ModalRoot open={open} dismissOnScrimClick={false}>
        <ModalContent size="table" srTitle="Restoring version" data-testid="restore-version-applying">
          <h2 className={LIBRARY_MODAL_TITLE} data-testid="restore-version-applying-title">
            Restoring version
          </h2>
          <ModalBody>
            <p className={LIBRARY_MODAL_BODY} role="status" data-testid="restore-version-applying-line">
              Updating {useWord(uses)}{pages.length > 0 ? ` across ${namePages(pages)}` : ""}. Please wait.
            </p>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    );
  }

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle="Restore version across site" data-testid="restore-version-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="restore-version-title">
          Restore version across site
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="restore-version-body">
            {uses === 0
              ? `Nothing on the site uses ${name} yet, so there is nothing to update. Every version stays in Asset versions.`
              : `Update ${useWord(uses)}${where} to ${label}. Every other version remains available.`}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="restore-version-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_GHOST} onClick={onClose} data-testid="restore-version-cancel">
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={uses === 0}
            title={uses === 0 ? "Nothing on the site uses this asset yet" : undefined}
            onClick={onRestore}
            data-testid="restore-version-confirm"
          >
            Restore on {useWord(uses)}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
