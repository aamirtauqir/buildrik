/**
 * PublishGateBanner — the publish gate, as the Publish panel draws it
 * (board B3-10 `7574:193972`, the panel behind the confirm).
 *
 * Two renderings of ONE derivation (`nextMove.gate` from lifecycle.ts,
 * decision #34): the "Client approval" row in PRE-PUBLISH CHECKS, and the
 * line under the footer CTA that says why the door is shut (or guarded) and
 * where the fix is. Both print `nextMove.gateReason` — the same sentence the
 * topbar's tooltip carries — so the four surfaces cannot disagree.
 *
 * Kept out of `PublishTab.tsx`'s body on purpose (decision #41): that file is
 * the panel's frame, and every gate state landing inline is how it reached
 * 941 lines.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import type { NextMove } from "@/editor/shell/lifecycle";
import { CheckIcon, CHECK_ROW, CHECK_LABEL, CHECK_DETAIL } from "./PrePublishChecks";

const LINK =
  "tw:flex-none tw:border-transparent tw:bg-transparent tw:p-0 tw:text-[13px] tw:text-[var(--bk-accent)]";

/** The door the gate offers. Every review gate's next move is the Review
 *  panel; the open-errors gate's is the Issues panel. */
function openDoor(composer: Composer | null, gate: NextMove["gate"]): void {
  if (gate === "open-errors") composer?.emit(EVENTS.UI_OPEN_ISSUES, undefined);
  else composer?.emit("ui:switch-tab", { tab: "review" });
}

function doorLabel(gate: NextMove["gate"]): string {
  return gate === "open-errors" ? "Open Issues ›" : "Open Review ›";
}

/** The gates that have something to say. `confirm` and `none` do not. */
function speaks(move: NextMove | null): move is NextMove & { gateReason: string } {
  return !!move && move.gate !== "confirm" && move.gate !== "none" && move.gateReason !== null;
}

export interface PublishGateProps {
  nextMove: NextMove | null;
  composer: Composer | null;
}

/**
 * Board B3-10's "Client approval — Blocks publish — Open ›" row. It sits in
 * the PRE-PUBLISH CHECKS list beside the server's rows, but its source is the
 * lifecycle, not `runPrePublishChecks` — the server's list is the SSOT for
 * the six site checks and never carried the round. Rendered only while the
 * round gates the publish: `waiting` and `changes-requested` block (red),
 * `stale-approval` advises (amber). An approved round says so in the
 * confirm's facts instead.
 */
export const ApprovalCheckRow: React.FC<PublishGateProps> = ({ nextMove, composer }) => {
  if (!speaks(nextMove) || nextMove.gate === "open-errors") return null;
  const blocks = nextMove.gate !== "stale-approval";
  return (
    <div
      className={CHECK_ROW}
      aria-label={`Client approval: ${blocks ? "blocking" : "warning"}. ${nextMove.gateReason}`}
      data-testid="publish-check-approval"
      data-gate={nextMove.gate}
    >
      <CheckIcon status={blocks ? "fail" : "warning"} />
      <span className={CHECK_LABEL}>Client approval</span>
      <span className={CHECK_DETAIL} data-testid="publish-check-approval-detail">
        {blocks ? "Blocks publish" : "Advisory"}
      </span>
      <Button color="light" size="xs" className={LINK} onClick={() => openDoor(composer, nextMove.gate)}>
        Open ›
      </Button>
    </div>
  );
};

/**
 * The line under the footer CTA: the reason and the door. Board B3-10 draws
 * "Waiting on Sara · Open Review ›" beside a disabled "Publish to production".
 */
export const PublishGateBanner: React.FC<PublishGateProps> = ({ nextMove, composer }) => {
  if (!speaks(nextMove)) return null;
  const blocks = nextMove.gate === "waiting" || nextMove.gate === "changes-requested";
  return (
    <div
      className="tw:flex tw:items-start tw:justify-between tw:gap-3"
      role={blocks ? "status" : undefined}
      data-testid="publish-gate-banner"
      data-gate={nextMove.gate}
    >
      <p
        className={`tw:m-0 tw:min-w-0 tw:text-[11px] tw:leading-[1.4] ${
          blocks ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-warning-text)]"
        }`}
        data-testid="publish-gate-reason"
      >
        {nextMove.gateReason}
      </p>
      <Button
        color="light"
        size="xs"
        className={`${LINK} tw:text-[12px]`}
        onClick={() => openDoor(composer, nextMove.gate)}
        data-testid="publish-gate-door"
      >
        {doorLabel(nextMove.gate)}
      </Button>
    </div>
  );
};

export default PublishGateBanner;
