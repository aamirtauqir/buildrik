/**
 * The editor's ONE next move.
 *
 * The product's loop is `Edit → send for client review → client approves →
 * publish → live`. The shell never named a position in it. The topbar held a
 * Publish button whose only inputs were the feature flag, the viewer role and
 * the network — so a site awaiting a client's sign-off, a site whose client had
 * asked for changes, and a site already live with nothing to ship all rendered
 * the same control, and the only way to learn which one you were looking at was
 * to press it and read the refusal.
 *
 * `docs/designs/2026-07-18-editor-shell-wireframes.md` §2 already specified the
 * fix and nothing implemented it: "The CTA is **state-dependent**:
 * `[ Send for review ]` before a review, `[ Publish ]` once approved, disabled
 * with a 'needs approval' tooltip while `pending`/`changes-requested`. It is the
 * only filled cobalt button in the shell chrome."
 *
 * ONE deviation from that line, stated rather than slipped in: at
 * `changes-requested` the client HAS replied and there is a real next act —
 * read the feedback. A disabled Publish names only what you cannot do. That row
 * returns `open-feedback` instead, pointed at the Review panel that already
 * exists. Every `kind` here routes to a door the shell already owns; this module
 * adds no surface.
 *
 * Pure — no React, no fetch — so the table below is testable as a table. The
 * reads live in `useLifecycle` (shell/hooks), which is called ONCE, by
 * AquibraStudio; the topbar and the Publish panel both receive the result.
 *
 * ── The publish gate (2026-09-22, code-gap B4, decisions #20/#34) ───────────
 *
 * Three surfaces used to hold three truths about whether a publish could go
 * ahead: the topbar's CTA read this derivation, the Publish panel's CTA read
 * "is a callback wired" (`canPublish = !!onVercelPublish`), and the modal
 * read the server's post-click refusal (`publishJob.blockedReason`). With
 * reviews on and a round pending the topbar was disabled "Waiting on Sara's
 * approval", the panel offered an enabled Publish, and pressing it produced a
 * gate modal. `NextMove.gate` is the one answer, in priority order:
 *
 *   waiting            the review round has not cleared (not sent · pending ·
 *                      opened) — the door is SHUT: disabled + `gateReason`
 *   changes-requested  the client replied with changes — the door opens the
 *                      changes-requested gate modal (B1-09), never a publish
 *   open-errors        the site has blocking issues — the door opens the
 *                      "Publish with N open errors?" confirm (B1-11) first
 *   stale-approval     approved, then edited — the door opens the stale-
 *                      approval acknowledgement (B1-10)
 *   confirm            the plain path — the door opens the four-facts confirm
 *                      (B3-10) and nothing else
 *   unchecked          `reviews.status` FAILED — the flags are unknown and
 *                      will stay unknown until asked again. Shut, with the
 *                      reason and a Retry (QA 2026-09-24: this used to read
 *                      as "not answered yet" and spun forever)
 *   none               there is no publish door: a permission/network block
 *                      (the CTA carries its own `blockedReason`), or a server
 *                      refusal this module does not recognise
 *
 * The plan lists `open-errors` first. Here every BLOCK outranks it, because
 * the errors confirm ends in "Publish anyway", and an invitation on a door
 * the server will refuse is the defect this module was written to remove
 * (`lifecycle.test.ts`: "a real block outranks the error re-label — one
 * refusal, not two"). Among the doors that can open, the plan's order holds.
 *
 * The server's post-click refusal (`publishJob.blockedReason`) maps onto the
 * SAME enum through `gateFromBlockReason`, so a refusal the pre-click
 * derivation could not see (a revision that went stale between paint and
 * click) lands in the same dialog the pre-click gate would have opened.
 *
 * @license BSD-3-Clause
 */
import type { ReviewPillState } from "@buildrik/shared/schemas/reviews";
import { IS_DEV_BUILD } from "@/shared/utils/runtimeEnv";

export interface LifecycleInput {
  /** The review round's position, from `reviews.status`. */
  reviewState: ReviewPillState;
  /**
   * Who is reviewing, from `reviews.status`. Boards 307:2193 and 307:2203 name
   * the reviewer in every sentence they write about the round — "Sara asked for
   * changes", not "your client asked for changes" — and the shell had the name
   * (it is already on the approved pill and in the resend toast) while these
   * lines said "your client". Optional, and `null` when the server did not send
   * one: `whoever()` falls back rather than writing a sentence with a hole.
   */
  reviewerName?: string | null;
  /**
   * Is the agency review layer on for this workspace? **`null` = we have not
   * been told yet**, which is not the same as "off": guessing "off" offers
   * Publish on a workspace that requires approval, and guessing "on" offers a
   * Send that hard-fails. Unknown returns no move at all.
   */
  reviewsEnabled: boolean | null;
  /**
   * Workspace policy: must a review approve edits before they can go live?
   * Decides whether the review round is the REQUIRED path or an optional one.
   * `null` = unknown, treated the same as `reviewsEnabled: null`.
   */
  editsRequireApproval: boolean | null;
  /** The `reviews.status` read failed (not merely pending). Unknown flags
   *  with this set are the `unchecked` gate, not an in-flight beat. */
  reviewStatusFailed?: boolean;
  /** Has this site ever gone live? */
  isPublished: boolean;
  /** Changed since it last went live. `null` = unknown (never published, or no
   *  stamps) — offer Publish rather than claim there is nothing to ship. */
  hasUnpublishedChanges: boolean | null;
  /** The actor's role is VIEWER — may look, may not act. */
  isViewer: boolean;
  /** The `publish` feature flag for this workspace. Gates publish only; a
   *  review can still be sent with publishing switched off. */
  publishEnabled: boolean;
  offline: boolean;
  /** Blocking issues on the site. Does not block publish — it re-labels it. */
  errorCount: number;
}

/** Which door the single filled button opens. Both review kinds land on the
 *  Review panel (`onOpenReview`); `publish` runs the existing publish flow. */
export type NextMoveKind = "send-for-review" | "open-feedback" | "publish";

/** The publish DOOR — what pressing a publish verb opens, or why it will not.
 *  See the header for the priority order and what each value routes to. */
export type PublishGate =
  | "open-errors"
  | "changes-requested"
  | "waiting"
  | "stale-approval"
  | "confirm"
  | "unchecked"
  | "none";

export interface NextMove {
  kind: NextMoveKind;
  /** The verb on the button. */
  label: string;
  /** Non-null → render disabled and say this. A blocked move is never hidden:
   *  the user has to be able to find out why (P6 permissions boards). */
  blockedReason: string | null;
  /**
   * One sentence naming where the site stands. Deliberately not a counter —
   * "3 open comments" is a number, not a position, and the shell already has
   * five places that show counts.
   */
  hint: string;
  /** The publish door, ONE derivation for the topbar CTA, the Publish
   *  panel's footer, its gate banner and whichever dialog opens. */
  gate: PublishGate;
  /** The sentence beside a door that is shut or guarded (`waiting`,
   *  `changes-requested`, `open-errors`, `stale-approval`); null when the door
   *  simply opens or when there is none. The panel and the topbar print THIS,
   *  so they cannot say two different things about one gate. */
  gateReason: string | null;
}

/**
 * The server's refusal, on the same enum. `publishJob.blockedReason` is the
 * message-classified reason the dashboard's approval gate sent back after a
 * click; each one is a gate this derivation also knows. `no-review` is the
 * approval workspace that was never sent — the round has not cleared, which
 * is `waiting`. A string this map does not know is `none`: the server still
 * blocks, and a dev build says so rather than inventing a dialog.
 */
export function gateFromBlockReason(reason: string | null | undefined): PublishGate {
  switch (reason) {
    case null:
    case undefined:
      return "none";
    case "review-pending":
    case "no-review":
      return "waiting";
    case "changes-requested":
      return "changes-requested";
    case "stale-approval":
      return "stale-approval";
    default:
      if (IS_DEV_BUILD) {
        console.warn(`[lifecycle] unknown publish block reason "${reason}" — no gate mapped`);
      }
      return "none";
  }
}

/** The errors confirm's own line — a count, because that dialog is the one
 *  place the shell asks the user to weigh a number. */
function openErrorsLine(n: number): string {
  return `${n} open error${n === 1 ? "" : "s"} will go live exactly as ${n === 1 ? "it is" : "they are"}.`;
}

/** What the review round says about the publish door, before the blocks and
 *  the error count are weighed against it. */
interface ReviewGate {
  gate: "waiting" | "stale-approval" | "unchecked" | null;
  reason: string | null;
}

const NO_REVIEW_GATE: ReviewGate = { gate: null, reason: null };

/**
 * The door, in priority order (see the header). A block from outside the
 * review (flag · role · network) shuts the door with nothing behind it; a
 * review that has not cleared shuts it with its reason on the front; then
 * the open-errors confirm; then the stale acknowledgement; then the plain
 * confirm.
 */
function resolveGate(
  i: LifecycleInput,
  blockedReason: string | null,
  review: ReviewGate,
): Pick<NextMove, "gate" | "gateReason"> {
  if (review.gate === "waiting") return { gate: "waiting", gateReason: review.reason ?? blockedReason };
  if (review.gate === "unchecked") return { gate: "unchecked", gateReason: review.reason };
  if (blockedReason) return { gate: "none", gateReason: null };
  if (i.errorCount > 0) return { gate: "open-errors", gateReason: openErrorsLine(i.errorCount) };
  if (review.gate === "stale-approval") return { gate: "stale-approval", gateReason: review.reason };
  return { gate: "confirm", gateReason: null };
}

/** The reviewer by name where we have one. Two forms because English needs
 *  both: `Sara` / `your client` as a subject, `Sara's` / `your client's` as a
 *  possessive. */
function whoever(i: LifecycleInput): { subject: string; object: string; possessive: string } {
  const n = i.reviewerName?.trim();
  return n
    ? { subject: n, object: n, possessive: `${n}'s` }
    : { subject: "Your client", object: "your client", possessive: "your client's" };
}

/** Why publish is refused here, or null. Ordered: a workspace that cannot
 *  publish at all outranks a role that cannot, which outranks a dropped
 *  connection. */
function publishBlocker(i: LifecycleInput): string | null {
  if (!i.publishEnabled) return "Publishing isn't switched on for this workspace yet";
  if (i.isViewer) return "Viewers can't publish — ask an editor";
  if (i.offline) return "Can't publish while offline";
  return null;
}

/** The publish move, labelled for what is actually waiting to ship. */
function publishMove(
  i: LifecycleInput,
  hint: string,
  reason?: string | null,
  review: ReviewGate = NO_REVIEW_GATE,
): NextMove {
  /* Resolve the refusal BEFORE the label. Reading only the review reason here
     put "Publish anyway" on a button whose tooltip said "Can't publish while
     offline" — an invitation and a refusal in the same control. */
  const blockedReason = reason ?? publishBlocker(i);
  const label = i.isPublished && i.hasUnpublishedChanges === true ? "Publish changes" : "Publish";
  return {
    kind: "publish",
    /* errorCount does not block — it re-labels, so pressing it is a stated
       choice rather than a surprise. Same rule the Topbar's "anyway" state
       has always used. Never on a button nobody can press. */
    label: i.errorCount > 0 && !blockedReason ? `${label} anyway` : label,
    blockedReason,
    hint,
    ...resolveGate(i, blockedReason, review),
  };
}

/**
 * The site's next move, or `null` when there is genuinely nothing to do.
 *
 * `null` is load-bearing and is NOT an error: a site that is live with no
 * changes since has no next act, and inventing one ("Publish" over an
 * already-published, unchanged site) is how a control comes to mean nothing.
 * The caller renders the settled `✓ Published` state there.
 *
 * `null` is also the answer while the review flags are unknown — the first
 * paint after mount. A verb that changes after the answer lands is worse than
 * a beat with no verb.
 */
export function deriveLifecycleState(i: LifecycleInput): NextMove | null {
  /* Strictly `null`, and `undefined` deliberately does NOT land here. The two
     mean different things and want different answers:

       null       our own sentinel — we have not asked yet, or the request
                  failed. A beat. Hold an in-flight control.
       undefined  the server answered and does not carry these fields at all:
                  a deploy older than them, or a version skew mid-rollout.
                  That is not a beat, it is a standing condition, and holding a
                  disabled Publish through it makes publishing impossible for
                  as long as the skew lasts. Fall through to the publish path
                  instead — `publish-approval.ts` is the real gate and refuses
                  with the actual reason if approval is required.

     This distinction was accidental before it was deliberate: `undefined`
     silently took the reviews-off branch because nothing checked for it. */
  /* A flag is "answered" only when it is a real boolean. `null` is our own
     sentinel (not asked yet); `undefined` is a server too old to carry the
     field. Both are unanswered — but they want different things, so they are
     told apart below rather than lumped by a loose `== null`.

     The first version tested `=== null` on each flag independently, which left
     a hole review caught: `reviewsEnabled: true` with
     `editsRequireApproval: undefined` skipped the unknown branch AND failed the
     `&&` below, so a workspace whose approval policy was simply missing got the
     no-review path and an unguarded Publish. Mixed states now resolve on the
     WEAKER of the two. */
  const answered = (v: boolean | null | undefined): v is boolean => typeof v === "boolean";
  const bothAnswered = answered(i.reviewsEnabled) && answered(i.editsRequireApproval);
  const anyPending = i.reviewsEnabled === null || i.editsRequireApproval === null;

  if (!bothAnswered && anyPending && i.reviewStatusFailed) {
    /* The read FAILED. Asking again is the only way forward, so the door is
       shut with the reason and the panel offers Retry — a spinner here never
       ends (QA 2026-09-24, reviews.status erroring). A blocker we already
       know still outranks it, as below. */
    const reason = "Couldn't check this site's review settings.";
    return publishMove(i, "Couldn't check where this site stands.", publishBlocker(i) ?? reason, {
      gate: "unchecked",
      reason,
    });
  }

  if (!bothAnswered && anyPending) {
    /* First paint, before `reviews.status` answers. Not `null`: withholding the
       CTA here empties the topbar's right side on every load and then pops a
       button in, and an empty slot reads as broken rather than as loading. Not
       an enabled Publish either — on an approval workspace that is a door into
       a mutation the server refuses. An in-flight control, which is what
       ReviewService's three-valued contract exists to make possible.
       A blocker we DO already know (flag off, viewer, offline) outranks it —
       those answers do not depend on the review flags and are final. */
    return publishMove(
      i,
      "Checking where this site stands.",
      publishBlocker(i) ?? "Checking this site's review settings…",
    );
  }

  /* Reviews on, and the workspace requires one: the round IS the path, so the
     verb follows the round. With reviews on but approval optional, a review is
     something you may send (the Review panel owns that door) — it is not what
     the site is waiting on, so the verb stays publish. */
  /* Only a fully-answered pair can put the review round on the path. A field
     the server never sent falls through here deliberately (see the note above);
     `publish-approval.ts` is the real gate and refuses with the actual reason. */
  if (bothAnswered && i.reviewsEnabled && i.editsRequireApproval) {
    switch (i.reviewState) {
      case "none":
        return {
          kind: "send-for-review",
          label: "Send for review",
          blockedReason: i.isViewer
            ? "Viewers can't send for review — ask an editor"
            : i.offline
              ? "Can't send for review while offline"
              : null,
          hint: "This workspace publishes after a client approves.",
          /* The SEND is the move; the publish door behind it is shut until a
             round clears. The panel's Publish reads this, not the CTA's
             (enabled) blockedReason. */
          gate: "waiting",
          gateReason: "Send for review first — this workspace publishes after a client approves.",
        };
      case "pending": {
        const who = whoever(i);
        const reason = `Waiting on ${who.possessive} approval`;
        return publishMove(i, `Sent to ${who.object} — waiting on approval.`, reason, {
          gate: "waiting",
          reason,
        });
      }
      case "opened-not-acted": {
        const who = whoever(i);
        const reason = `Waiting on ${who.possessive} approval`;
        return publishMove(i, `${who.subject} has opened the review.`, reason, {
          gate: "waiting",
          reason,
        });
      }
      case "changes-requested": {
        const who = whoever(i);
        return {
          kind: "open-feedback",
          label: "Open feedback",
          /* Reading what the client wrote is not an act on the site, so a
             viewer may do it. Offline is the one thing that stops it — the
             thread is a fetch. */
          blockedReason: i.offline ? "Can't load feedback while offline" : null,
          hint: `${who.subject} asked for changes.`,
          /* The publish door opens the changes-requested gate (B1-09), whose
             one action is the same Review panel this CTA opens. */
          gate: "changes-requested",
          gateReason: `${who.subject} asked for changes — resolve them and re-send for review before publishing.`,
        };
      }
      case "approved":
        return publishMove(i, "Approved — ready to go live.");
      case "approved-edited-since":
        /* NOT blocked. The server's approval gate decides whether this needs an
           explicit acknowledgement (publish-approval.ts, contracts §1.5); the
           shell's job is to say the approval no longer covers what is here —
           and to open the acknowledgement directly rather than let the server
           refuse first (the door is `stale-approval`). */
        return publishMove(
          i,
          "Edited since approval — your client hasn't seen these changes.",
          undefined,
          { gate: "stale-approval", reason: "Approval is older than your latest edits." },
        );
    }
  }

  /* No review in the path. The only question left is whether anything is
     waiting to ship. */
  if (i.isPublished && i.hasUnpublishedChanges === false) return null;
  return publishMove(
    i,
    i.isPublished ? "Changes since this site went live." : "Not live yet.",
  );
}
