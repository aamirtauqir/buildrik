/**
 * ApplyVersionModal — Clone 3695:45615 "Apply saved version across site"
 * (the confirm, 560) and 3720:43313 "Applying saved version" (the progress
 * card while the placements update, 640 × 108). Phase 6.
 *
 * The confirm says what will change in the site's own numbers: `Update 3
 * uses on Home and Menu to the latest saved version. The original and prior
 * saved version remain available.` — the count is `getUsages`, the pages the
 * join the delete confirm runs — and its primary reads `Apply to 3 uses`.
 * Nothing on the site → the primary is disabled and the body says why.
 *
 * `replaceAcross` itself is synchronous, so the progress card exists to be
 * SEEN: the orchestrator holds it for a beat (the prototype's own
 * AFTER-delay edge) before the result takes its place. The board's progress
 * frame is P6-R's "Replacing image" card reused; its title here names what
 * is actually happening, its line keeps the board's shape.
 *
 * Shape from `libraryModal.ts` (title 16/600, body 13 ink-soft, 32px
 * buttons, 8 gap).
 *
 * @license BSD-3-Clause
 */

import { Button, ModalBody, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import { namePages } from "../../sidebar/tabs/media/data/mediaUtils";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_BTN_SECONDARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "./libraryModal";

interface ApplyVersionModalProps {
  open: boolean;
  /** The parent's display name — the nothing-to-apply body names it. */
  name: string;
  /** Placements the apply would move. */
  uses: number;
  /** The pages those placements sit on; empty when none could be traced. */
  pages: string[];
  /** The progress card instead of the confirm (3720:43313). */
  applying: boolean;
  onClose(): void;
  onApply(): void;
}

const useWord = (n: number) => `${n} ${n === 1 ? "use" : "uses"}`;

export function ApplyVersionModal({ open, name, uses, pages, applying, onClose, onApply }: ApplyVersionModalProps) {
  const where = pages.length > 0 ? ` on ${namePages(pages)}` : "";

  if (applying) {
    return (
      <ModalRoot open={open} dismissOnScrimClick={false}>
        <ModalContent size="table" srTitle="Applying saved version" data-testid="apply-version-applying">
          <h2 className={LIBRARY_MODAL_TITLE} data-testid="apply-version-applying-title">
            Applying saved version
          </h2>
          <ModalBody>
            <p className={LIBRARY_MODAL_BODY} role="status" data-testid="apply-version-applying-line">
              Updating {useWord(uses)}{pages.length > 0 ? ` across ${namePages(pages)}` : ""}. Please wait.
            </p>
          </ModalBody>
        </ModalContent>
      </ModalRoot>
    );
  }

  return (
    <ModalRoot open={open} onClose={onClose}>
      <ModalContent size="form" srTitle="Apply saved version across site" data-testid="apply-version-modal">
        <h2 className={LIBRARY_MODAL_TITLE} data-testid="apply-version-title">
          Apply saved version across site
        </h2>
        <ModalBody>
          <p className={LIBRARY_MODAL_BODY} data-testid="apply-version-body">
            {uses === 0
              ? `Nothing on the site uses ${name} yet, so there is nothing to update. The saved version stays in Asset versions.`
              : `Update ${useWord(uses)}${where} to the latest saved version. The original and prior saved version remain available.`}
          </p>
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT} data-testid="apply-version-foot">
          <Button size="xs" variant="secondary" className={LIBRARY_MODAL_BTN_SECONDARY} onClick={onClose} data-testid="apply-version-cancel">
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={uses === 0}
            title={uses === 0 ? "Nothing on the site uses this asset yet" : undefined}
            onClick={onApply}
            data-testid="apply-version-confirm"
          >
            Apply to {useWord(uses)}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
