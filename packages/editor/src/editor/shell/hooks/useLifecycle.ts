/**
 * useLifecycle — the site's ONE next move, derived once.
 *
 * `deriveLifecycleState` is pure; this hook owns its reads. It used to live
 * inside StudioHeader, which meant the topbar was the only surface that knew
 * where the site stood: the Publish panel read "is a callback wired" and the
 * modal read the server's refusal, and the three disagreed on one screen
 * (B4, decision #34). AquibraStudio calls this once and hands `nextMove` to
 * the topbar AND to the panels — one call, one memo, one answer.
 *
 * What the hook owns besides the derivation is the review status it needs:
 *   · the mount read (fail-closed: `UNKNOWN_REVIEW_STATUS` until it answers,
 *     so nothing paints a guessed verb);
 *   · the focus refetch (approval lands while the editor is backgrounded),
 *     which keeps the last-known status on transport failure;
 *   · a refresh on `REVIEW_SENT`, so a send from any door moves the CTA and
 *     the panel in the same render;
 *   · the "Review closed" toast on the transition away from a live round.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { ReviewPillState } from "@buildrik/shared/schemas/reviews";
import type { ToastInput } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import {
  fetchReviewStatus,
  fetchReviewStatusOrNull,
  UNKNOWN_REVIEW_STATUS,
  type ReviewStatus,
} from "@/services/ReviewService";
import { useRefetchOnFocus } from "@/shared/hooks";
import { EVENTS } from "@/shared/constants";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { deriveLifecycleState, type NextMove, type PublishGate } from "../lifecycle";
import { useEditorRole } from "./useEditorRole";

export interface UseLifecycleInput {
  composer: Composer | null;
  addToast: (input: ToastInput) => string;
  /** Unsaved work counts as "waiting to ship" on its own. */
  isDirty: boolean;
  /** This session's save clock — preferred over the server's snapshot, which
   *  was taken at mount and cannot see an edit made since. */
  lastSavedAt: number | null | undefined;
  /** Browser offline OR dashboard sync disconnected. */
  offline: boolean;
  /** Blocking issues on the site. */
  errorCount: number;
  /** The canonical publish job — the live URL and the server's stamps. */
  publishedUrl: string | null;
  lastPublishedAt: string | null;
  serverHasUnpublishedChanges: boolean | null;
  /** `publishJob.blockedReason` — the server refused a publish. A refusal the
   *  pre-click derivation did not predict means the round moved under us;
   *  re-read it so every surface catches up. */
  serverBlock: string | null;
}

export interface Lifecycle {
  reviewStatus: ReviewStatus;
  /** `null` = the site has no next act (live, nothing waiting). */
  nextMove: NextMove | null;
  /**
   * The door behind the open-errors confirm — what "Publish anyway" opens
   * next. `open-errors` outranks `stale-approval`, so a site that is both
   * needs its acknowledgement AFTER the errors are waved through, not the
   * plain confirm. Derived from the same input with the errors acknowledged.
   */
  gateAfterErrors: PublishGate;
}

const LIVE_ROUND: ReadonlySet<ReviewPillState> = new Set(["pending", "opened-not-acted"]);

export function useLifecycle({
  composer,
  addToast,
  isDirty,
  lastSavedAt,
  offline,
  errorCount,
  publishedUrl,
  lastPublishedAt,
  serverHasUnpublishedChanges,
  serverBlock,
}: UseLifecycleInput): Lifecycle {
  const isViewer = useEditorRole() === "VIEWER";
  const publishEnabled = isFeatureEnabled("publish");

  /* S5.2: starts at UNKNOWN — `state: "none"` with the two flags null rather
     than asserting "reviews are on and publishing is ungated" before anyone
     has asked. A control that picks a verb from a guessed lifecycle position
     and changes it after paint is worse than one that arrives a beat late. */
  const [reviewStatus, setReviewStatus] = React.useState<ReviewStatus>(UNKNOWN_REVIEW_STATUS);
  React.useEffect(() => {
    let cancelled = false;
    void fetchReviewStatus().then((s) => {
      if (!cancelled) setReviewStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* F3/6A: approval usually lands while the editor is backgrounded — refresh
     on return. The OrNull variant keeps the last-known status on transport
     failure instead of erasing it (fail-closed is for the mount only). */
  const refresh = React.useCallback(() => {
    void fetchReviewStatusOrNull().then((s) => {
      if (s) setReviewStatus(s);
    });
  }, []);
  useRefetchOnFocus(refresh);

  /* A send from any door (topbar SendForReview, the Review panel, the stale
     modal's "Request fresh review") moves the round; the CTA and the panel
     read the new position together instead of waiting for a focus change. */
  React.useEffect(() => {
    if (!composer) return;
    composer.on(EVENTS.REVIEW_SENT, refresh);
    return () => {
      composer.off(EVENTS.REVIEW_SENT, refresh);
    };
  }, [composer, refresh]);

  /* The server refused a publish this derivation had allowed: the round moved
     under us. Re-read, so the CTA and the panel say what the server says. */
  React.useEffect(() => {
    if (serverBlock) refresh();
  }, [serverBlock, refresh]);

  /* Board 158:213 announces the close: "Review closed — Sara approved v3".
     Fires on the TRANSITION only, and only away from a live round, so opening
     an already-approved site does not congratulate you on news from last
     week. `answeredRef` starts unset and is seeded by the first status that
     lands, so the mount itself is never a transition. */
  const answeredRef = React.useRef<ReviewPillState | null>(null);
  React.useEffect(() => {
    const now = reviewStatus.state;
    const was = answeredRef.current;
    answeredRef.current = now;
    if (was === null || was === now) return;
    if (!LIVE_ROUND.has(was)) return;
    const who = reviewStatus.reviewerName ?? "Your client";
    if (now === "approved" || now === "approved-edited-since") {
      addToast({ title: "Review closed", description: `${who} approved this design.`, tone: "success" });
    } else if (now === "changes-requested") {
      addToast({ title: "Review closed", description: `${who} asked for changes.`, tone: "info" });
    }
  }, [reviewStatus.state, reviewStatus.reviewerName, addToast]);

  /* "Anything waiting to ship?" prefers THIS session's save clock over the
     server's snapshot. Unsaved work counts on its own — it is by definition
     not live. */
  const publishedAtMs = lastPublishedAt ? Date.parse(lastPublishedAt) : null;
  const hasUnpublishedChanges =
    isDirty ||
    (lastSavedAt != null && publishedAtMs != null
      ? lastSavedAt > publishedAtMs
      : serverHasUnpublishedChanges);

  const input = React.useMemo(
    () => ({
      reviewState: reviewStatus.state,
      reviewerName: reviewStatus.reviewerName,
      reviewsEnabled: reviewStatus.reviewsEnabled,
      editsRequireApproval: reviewStatus.editsRequireApproval,
      isPublished: Boolean(publishedUrl),
      hasUnpublishedChanges,
      isViewer,
      publishEnabled,
      offline,
      errorCount,
    }),
    [reviewStatus, publishedUrl, hasUnpublishedChanges, isViewer, publishEnabled, offline, errorCount],
  );

  const nextMove = React.useMemo(() => deriveLifecycleState(input), [input]);
  const gateAfterErrors = React.useMemo<PublishGate>(
    () =>
      nextMove?.gate === "open-errors"
        ? (deriveLifecycleState({ ...input, errorCount: 0 })?.gate ?? "none")
        : "none",
    [input, nextMove?.gate],
  );

  return { reviewStatus, nextMove, gateAfterErrors };
}
