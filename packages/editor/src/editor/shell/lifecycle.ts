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
 * reads live in StudioHeader, which calls this with the values it already has.
 *
 * @license BSD-3-Clause
 */
import type { ReviewPillState } from "@buildrik/shared/schemas/reviews";

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
function publishMove(i: LifecycleInput, hint: string, reason?: string | null): NextMove {
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
        };
      case "pending": {
        const who = whoever(i);
        return publishMove(
          i,
          `Sent to ${who.object} — waiting on approval.`,
          `Waiting on ${who.possessive} approval`,
        );
      }
      case "opened-not-acted": {
        const who = whoever(i);
        return publishMove(
          i,
          `${who.subject} has opened the review.`,
          `Waiting on ${who.possessive} approval`,
        );
      }
      case "changes-requested":
        return {
          kind: "open-feedback",
          label: "Open feedback",
          /* Reading what the client wrote is not an act on the site, so a
             viewer may do it. Offline is the one thing that stops it — the
             thread is a fetch. */
          blockedReason: i.offline ? "Can't load feedback while offline" : null,
          hint: `${whoever(i).subject} asked for changes.`,
        };
      case "approved":
        return publishMove(i, "Approved — ready to go live.");
      case "approved-edited-since":
        /* NOT blocked. The server's approval gate decides whether this needs an
           explicit acknowledgement (publish-approval.ts, contracts §1.5); the
           shell's job is to say the approval no longer covers what is here. */
        return publishMove(i, "Edited since approval — your client hasn't seen these changes.");
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
