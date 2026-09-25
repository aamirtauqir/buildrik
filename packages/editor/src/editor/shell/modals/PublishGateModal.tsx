/**
 * PublishGateModal — S5.4's three approval gates (boards 307:2193 pending ·
 * 307:2203 changes-requested · 307:2213 no-review-sent).
 *
 * The server refuses a publish for four reasons (contracts §1.5 / §2). One of
 * them, `stale-approval`, has always had a dialog — there is an approval to
 * over-ride, so there is a decision to take. The other three had a TOAST:
 * `APPROVAL_GATE_TOASTS` in useExportHandlers, which described the way out in
 * prose ("Open the Review panel (press R)") instead of offering it, and then
 * dismissed itself. All three boards draw a modal with the door in it, and the
 * whole point of splitting one `needs-approval` into three was that the next
 * move differs: send one, wait for one, or go read the comments that came back.
 *
 * The round is fetched here rather than passed in, exactly as StaleApprovalModal
 * does it: the block arrives from a failed mutation and carries no client, and
 * the boards name the client in the sentence.
 *
 * Geometry is the board's, INSIDE the shared frame. `ModalContent size="md"` is
 * 520, which is what 307:2194 is drawn at; its 16 radius is not restated,
 * because MODAL_FRAME_BASE_CLASS is shared by every dialog in the product and
 * one screen board does not re-settle it (the same call publish-confirm's
 * recipe records for 914:4507). Everything inside it — the 32 gutter, the 30
 * top, the 14 stack gap, the 16/24 title, the 14 body, the 32-tall buttons at
 * gap 10 — is the board's.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ModalContent, ModalRoot } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { fetchCurrentRound, type CurrentRound } from "@/services/ReviewService";

/** The three gates that have no over-ride path. `stale-approval` is the fourth
 *  and keeps its own dialog — it is the only one with something to acknowledge. */
export type PublishGateReason = "no-review" | "review-pending" | "changes-requested";

export function isPublishGateReason(r: string | null): r is PublishGateReason {
  return r === "no-review" || r === "review-pending" || r === "changes-requested";
}

interface PublishGateModalProps {
  /** `null` = no gate is blocking; the modal is closed. */
  reason: PublishGateReason | null;
  composer: Composer | null;
  /** Dismiss without publishing — the board's Cancel. */
  onClose: () => void;
}

/** Board copy, with the round's real client in place of "Sara". */
function gateCopy(reason: PublishGateReason, round: CurrentRound | null) {
  const who = round?.reviewerName ?? round?.invitedEmail ?? null;
  const first = round?.reviewerName?.split(" ")[0] ?? null;
  switch (reason) {
    /* Boards 4418:120066 / 5931:44782: the title names who holds the door,
       the body names the round, the lock, and what Open Review does. */
    case "review-pending":
      return {
        title: first ? `Waiting on ${first}` : "Waiting on approval",
        body:
          `Round ${round?.roundNumber ?? 1} is with ${who ?? "your reviewer"} for approval. ` +
          "Publishing to production stays locked until they approve it, or until a workspace admin turns the approval lock off. " +
          "Open Review to check its status.",
        action: "Open Review",
      };
    case "changes-requested":
      return {
        title: "Changes were requested",
        body: `${who ?? "Your reviewer"} asked for changes. Resolve their comments, then re-send for review before publishing.`,
        action: "See comments",
      };
    case "no-review":
      return {
        title: "Not sent for review yet",
        body:
          `Round ${round ? round.roundNumber + 1 : 1} has not been sent to ${who ?? "your client"} yet. ` +
          "Approval lock is on, so publishing to production waits for their approval. " +
          "Open Review to send this draft as a review round.",
        action: "Open Review",
      };
  }
}

/* Board 307:2194: 32 gutter, 30 top, a 14 stack. `pb-[30px]` mirrors the top —
   the export carries no bottom padding at all, which would sit the buttons on
   the card's edge. */
const CARD = "tw:flex tw:flex-col tw:items-start tw:gap-[14px] tw:px-8 tw:pt-[30px] tw:pb-[30px]";
/* 337:2240 / 337:2242 — `--size/row` (32) with a 16/10 inset on an 8 radius,
   NOT the 28 the modal footer caps its buttons at. These are not in a footer:
   the boards draw them inside the card, left-aligned, with no rule above. */
const GATE_BUTTON = "tw:h-8 tw:min-h-0 tw:px-4 tw:py-2.5 tw:text-[13px] tw:leading-5";
/* The radius goes through `style`, not a utility, and the reason is measured:
   the SAME `tw:rounded-lg` on these two buttons computes 8px on the `light`
   one and 4px on the primary — same class string, same stylesheet, one
   element apart. Whatever wins on the filled button wins from outside this
   file, and a utility that is right on one button and wrong on its neighbour
   is not a thing to ship. `style` is the same escape hatch CommentRow uses for
   the geometry that has to win, and it stays token-valued. */
const GATE_RADIUS = { borderRadius: "var(--bk-radius-lg)" } as const;

export const PublishGateModal: React.FC<PublishGateModalProps> = ({ reason, composer, onClose }) => {
  const [round, setRound] = React.useState<CurrentRound | null>(null);

  React.useEffect(() => {
    if (!reason) return;
    let cancelled = false;
    setRound(null);
    /* A failed read is not a failure of the gate: the sentence falls back to
       "its reviewer" and the door still opens. */
    void fetchCurrentRound()
      .then((r) => {
        if (!cancelled) setRound(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reason]);

  if (!reason) return null;
  const copy = gateCopy(reason, round);

  return (
    <ModalRoot open onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="prompt" srTitle={copy.title} data-testid="publish-gate">
        <div className={CARD}>
          <span
            className="tw:text-[16px] tw:font-semibold tw:text-[var(--bk-ink)]"
            role="heading"
            aria-level={2}
            data-testid="publish-gate-title"
          >
            {copy.title}
          </span>
          {/* 307:2196 is 456 wide, which IS 520 less the 32 gutters — the width
              is the padding, not a literal. */}
          <span
            className="tw:w-full tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
            data-testid="publish-gate-body"
          >
            {copy.body}
          </span>
          <div className="tw:flex tw:items-start tw:gap-[10px] tw:pt-2" data-testid="publish-gate-actions">
            <Button
              className={GATE_BUTTON}
              style={GATE_RADIUS}
              data-testid="publish-gate-primary"
              onClick={() => {
                /* Every gate's next move is the Review panel: it is where a
                   round is sent from, where its comments are read, and where
                   its state is shown. StudioPanels owns this event. */
                composer?.emit("ui:switch-tab", { tab: "review" });
                onClose();
              }}
            >
              {copy.action}
            </Button>
            <Button
              color="light"
              /* --color/border and gray-700, not flowbite `light`'s gray-300 /
                 gray-900 — the same call-site correction DrawerGallery carries
                 for board 1138:13422. */
              className={`${GATE_BUTTON} tw:border-[var(--bk-border)] tw:text-[var(--bk-gray-700)]`}
              style={GATE_RADIUS}
              data-testid="publish-gate-cancel"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </ModalContent>
    </ModalRoot>
  );
};

export default PublishGateModal;
