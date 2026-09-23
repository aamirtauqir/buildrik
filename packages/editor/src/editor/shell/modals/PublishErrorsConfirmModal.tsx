/**
 * PublishErrorsConfirmModal — board B1-11 `7563:269418` (was 1168:4732):
 * "Publish with N open errors?"
 *
 * The `open-errors` publish gate (lifecycle.ts). Errors > 0 opens this instead
 * of publishing in one click; warnings alone never confirm — the Issues chip
 * already carried that signal. It lived inside StudioHeader as the topbar's
 * private dialog, which meant the Publish PANEL had no such stop at all: the
 * same site, two doors, one of them silent about the errors (B4, decision
 * #34 — one confirm door). AquibraStudio mounts it once and routes both doors
 * through it.
 *
 * The SERVER approval gate can still reject the attempt afterwards — its
 * acknowledge flow owns that path, not this modal.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalContent, ModalDescription, ModalFooter, ModalRoot, ModalTitle, plural } from "@/editor/chrome-ui";
import type { Issue } from "../hooks/useStudioState";
import "../header.css";

export interface PublishErrorsConfirmModalProps {
  open: boolean;
  issues: Issue[];
  /** The reviewer's name when a round is open — board 1168:4732's D13 note
   *  says who will see the published site. `null` = no round in flight. */
  reviewerInRound: string | null;
  /** The safe door: opens the Issues panel. */
  onFixFirst: () => void;
  /** The stated choice: proceed to the next door (the facts confirm, or the
   *  stale acknowledgement when the approval is also stale). */
  onPublishAnyway: () => void;
  onClose: () => void;
}

export const PublishErrorsConfirmModal: React.FC<PublishErrorsConfirmModalProps> = ({
  open,
  issues,
  reviewerInRound,
  onFixFirst,
  onPublishAnyway,
  onClose,
}) => {
  if (!open) return null;
  const errorCount = issues.filter((i) => i.type === "error").length;
  const warnCount = issues.filter((i) => i.type === "warning").length;
  // D12: top-3 concrete rows, errors first — real messages from the shipped
  // Issue shape, never invented categories.
  const rows = issues
    .filter((i) => i.type !== "info")
    .sort((a, b) => (a.type === b.type ? 0 : a.type === "error" ? -1 : 1))
    .slice(0, 3);
  const more = errorCount + warnCount - rows.length;

  return (
    <ModalRoot open onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="question" aria-labelledby="bk-pubconfirm-title" data-testid="publish-errors-confirm">
        <ModalTitle id="bk-pubconfirm-title">
          {/* Board 1168:4732 says "open errors", not "errors" — the word is
              doing work: these are errors the user has already been shown
              and left, not ones this dialog is reporting. */}
          Publish with {errorCount} open {errorCount === 1 ? "error" : "errors"}?
        </ModalTitle>
        {/* Board 1168:4732 states the consequence, not the options — the
            options are the two buttons. */}
        <ModalDescription>
          These will ship to every visitor exactly as they are now.
          {reviewerInRound !== null
            ? ` A review round is open — ${reviewerInRound} will see the published site.`
            : ""}
        </ModalDescription>
        <div className="bk-pubconfirm__list">
          {rows.map((i) => (
            /* Each row carries its OWN severity tint. They used to share one
               amber box with only the text colour differing, which dressed
               an error as a warning — the single distinction the modal
               exists to make. */
            <p
              key={i.id}
              className={`tw:m-0 tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-8)] tw:rounded-[var(--bk-radius-md)] tw:text-[length:var(--bk-text-12)] tw:leading-[var(--bk-leading-normal)] ${
                i.type === "error"
                  ? "tw:text-[var(--bk-error-text)] tw:bg-[var(--bk-error-tint)]"
                  : "tw:text-[var(--bk-warning-text)] tw:bg-[var(--bk-warning-tint)]"
              }`}
            >
              <span aria-hidden="true">{i.type === "error" ? "●" : "▲"}</span>{" "}
              {/* `location` is the human "where" the Issue shape already
                  carries ("Brand › color.accent"); `pageId` is an id and
                  would print as one. */}
              {i.location ? `${i.location} · ` : ""}
              {i.message || `A ${i.type} will go live exactly as it looks now.`}
            </p>
          ))}
          {more > 0 ? (
            <Button
              color="light"
              size="xs"
              onClick={onFixFirst}
              className="tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]"
            >
              +{plural(more, "more warning")}
            </Button>
          ) : null}
        </div>
        {/* Board 1168:4732 makes "Fix issues first" the strong primary and
            "Publish anyway" the amber secondary — the safe action is the
            solid CTA on a dialog opened *because* the site has unresolved
            errors. Same amber treatment as StaleApprovalModal's "Publish
            anyway". autoFocus stays on the safe action. */}
        <ModalFooter>
          <Button autoFocus onClick={onFixFirst}>
            Fix issues first
          </Button>
          <Button
            /* Same properties flowbite sets, so twMerge drops its accent fill
               for the warning tone. Utilities rather than a `style` object —
               the ratchet counts inline styles. */
            className="tw:bg-[var(--bk-warning)] tw:border-[var(--bk-warning)] tw:hover:bg-[var(--bk-warning)]"
            onClick={onPublishAnyway}
          >
            Publish anyway
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishErrorsConfirmModal;
