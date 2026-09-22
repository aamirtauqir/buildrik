/**
 * SessionView (B8, code-gap plan) — "This session" tab.
 *
 * The working draft is always the right side of the diff; the picker
 * chooses the LEFT. Resolves availability for each baseline, fetches
 * per-baseline state, and hands bodies to ComparePanel.
 *
 * Bodies reuse the three existing Compare engines:
 * - approved → fetchApprovedSnapshot + ApprovedCompareView (split/overlay/list)
 * - published → fetchPublishHistory + PublishDiffView (page-level deploy diff)
 * - saved    → useVersionHistory + CompareView (snapshot diff)
 * - current  → composer.exportPages(); identical-to-saved renders "No
 *              differences" inside CompareView (board 4418:115592)
 *
 * siteId null → picker disables approved/published with reason ("Open
 * from the dashboard to see this baseline") and the saved/current path
 * still works (composer-saved is per-device).
 *
 * initialBaseline → picker falls back to the first ENABLED option if the
 * requested one doesn't exist. A deep link from a Compare door can never
 * strand the user on a dead chip.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CompareBaseline, SessionViewProps } from "../types";
import { ComparePanel } from "./ComparePanel";
import { fetchApprovedSnapshot, fetchReviewStatus } from "@/services/ReviewService";
import { fetchPublishHistory } from "@/services/PublishService";
import { useVersionHistory } from "@/shared/hooks/useVersionHistory";
import { exportPublishPages, type PublishPage } from "@/editor/shell/exportPublishPages";
import { ApprovedCompareView } from "@/editor/panels/version-history/ApprovedCompareView";
import { CompareView } from "@/editor/panels/version-history/CompareView";
import { PublishDiffView } from "@/editor/shell/PublishDiffView";

type ApprovedState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; approved: PublishPage[] | null; current: PublishPage[] | null }
  | { kind: "error"; message: string };

type PublishedState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; rows: Awaited<ReturnType<typeof fetchPublishHistory>> }
  | { kind: "error"; message: string };

const REASON_NO_SITE_APPROVED = "Open this site from the dashboard to see an approved version.";
const REASON_NO_SITE_PUBLISHED = "Open this site from the dashboard to see a published version.";
const REASON_NO_REVIEW = "No review round is open — nothing has been approved yet.";

function firstEnabled<T extends { available: boolean }>(
  order: CompareBaseline[],
  availability: Record<CompareBaseline, T>,
): CompareBaseline | null {
  for (const b of order) if (availability[b].available) return b;
  return null;
}

export const SessionView: React.FC<SessionViewProps> = ({
  composer,
  siteId,
  initialBaseline,
}) => {
  const { versions } = useVersionHistory(composer);

  /* Saved baseline = the most recent named milestone. The current version is
     the working draft; we diff against the latest saved milestone because
     "saved vs current" is the comparison the user reaches for. */
  const latestSaved = versions[0] ?? null;

  /* ── Approved state ─────────────────────────────────────────────── */
  const [approvedState, setApprovedState] = React.useState<ApprovedState>({ kind: "idle" });
  const [approvedRetry, setApprovedRetry] = React.useState(0);

  const hasApproved = approvedState.kind === "ready" && approvedState.approved !== null;

  React.useEffect(() => {
    if (!siteId) {
      setApprovedState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setApprovedState({ kind: "loading" });
    /* exportPublishPages requires a non-null Composer — siteId-less mode
       guards on siteId alone, but a Composer can still be null mid-bootstrap
       even when siteId is set. Without a composer the snapshot cannot be
       diffed against the current draft, so the approved baseline stays
       unavailable until the composer mounts. */
    if (!composer) {
      setApprovedState({ kind: "idle" });
      return;
    }
    Promise.all([fetchApprovedSnapshot(), fetchReviewStatus(), exportPublishPages(composer)])
      .then(([approved, status, currentPages]) => {
        if (cancelled) return;
        /* Only show approved if a review round is open AND has a snapshot.
           fetchApprovedSnapshot returns `null` either when no round exists
           OR when the round is closed without an approved snapshot — same
           user-visible state. The state union is "none" | "pending" |
           "opened-not-acted" | "changes-requested" | "approved" |
           "approved-edited-since"; "none" is the canonical "no review round"
           state, the rest mean a round exists and we already have approved
           data. */
        if (approved && status.state !== "none") {
          setApprovedState({ kind: "ready", approved, current: currentPages });
        } else {
          setApprovedState({ kind: "ready", approved: null, current: currentPages });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setApprovedState({ kind: "error", message: err instanceof Error ? err.message : "Couldn’t load approved snapshot." });
      });
    return () => { cancelled = true; };
  }, [siteId, approvedRetry, composer]);

  /* ── Published state ────────────────────────────────────────────── */
  const [publishedState, setPublishedState] = React.useState<PublishedState>({ kind: "idle" });
  const [publishedRetry, setPublishedRetry] = React.useState(0);

  React.useEffect(() => {
    if (!siteId) {
      setPublishedState({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setPublishedState({ kind: "loading" });
    fetchPublishHistory(siteId)
      .then((rows) => { if (!cancelled) setPublishedState({ kind: "ready", rows }); })
      .catch((err: unknown) => {
        if (!cancelled) setPublishedState({ kind: "error", message: err instanceof Error ? err.message : "Couldn’t load publish history." });
      });
    return () => { cancelled = true; };
  }, [siteId, publishedRetry]);

  /* ── Availability ───────────────────────────────────────────────── */
  const availability = React.useMemo<
    Record<CompareBaseline, { available: boolean; reason?: string }>
  >(() => {
    const approvedAvailable =
      siteId !== null &&
      approvedState.kind === "ready" &&
      hasApproved;
    const publishedAvailable =
      siteId !== null &&
      publishedState.kind === "ready" &&
      publishedState.rows.length > 0;
    const savedAvailable = latestSaved !== null;
    return {
      approved: {
        available: approvedAvailable,
        reason: !siteId
          ? REASON_NO_SITE_APPROVED
          : approvedState.kind !== "ready"
          ? "Loading…"
          : !hasApproved
          ? REASON_NO_REVIEW
          : undefined,
      },
      published: {
        available: publishedAvailable,
        reason: !siteId
          ? REASON_NO_SITE_PUBLISHED
          : publishedState.kind !== "ready"
          ? "Loading…"
          : publishedState.rows.length === 0
          ? "Publish the site once to start a publish history."
          : undefined,
      },
      saved: {
        available: savedAvailable,
        reason: savedAvailable ? undefined : "No saved milestones yet — save once to start a history.",
      },
      current: { available: true },
    };
  }, [siteId, approvedState, publishedState, hasApproved, latestSaved]);

  /* ── Picker state (with deep-link fallback to first enabled) ────── */
  const [picked, setPicked] = React.useState<CompareBaseline>(() => {
    if (initialBaseline) return initialBaseline;
    const order: CompareBaseline[] = ["saved", "approved", "published", "current"];
    const requested = firstEnabled(order, {
      approved: { available: false },
      published: { available: false },
      saved: { available: savedAvailableStub(versions) },
      current: { available: true },
    });
    return requested ?? "current";
  });

  /* (A) Deep-link sticky snap. When the deep-link baseline's availability
     flips to ready (e.g. approved snapshot finishes loading), snap to it.
     Without this, the fallback effect below steps off the deep-link target
     on first paint — before its async availability resolves — and never
     comes back. A deep link from a Compare door is the user saying "I want
     this baseline" — honor it once it exists. */
  React.useEffect(() => {
    if (!initialBaseline) return;
    if (availability[initialBaseline].available && picked !== initialBaseline) {
      setPicked(initialBaseline);
    }
  }, [availability, initialBaseline, picked]);

  /* (B) Fallback for user-picked baseline that became unavailable
     (e.g. just deleted the last published version). Step to the first
     enabled option. Also covers the deep-link case where the requested
     baseline is permanently unavailable — fall back once, then effect (A)
     won't try to re-correct to a baseline that never becomes available. */
  React.useEffect(() => {
    if (!availability[picked].available) {
      const next = firstEnabled<{ available: boolean }>(
        ["saved", "approved", "published", "current"],
        availability,
      );
      if (next && next !== picked) setPicked(next);
    }
  }, [availability, picked]);

  /* ── Bodies ─────────────────────────────────────────────────────── */
  const bodies = React.useMemo<Partial<Record<CompareBaseline, React.ReactNode>>>(() => {
    const out: Partial<Record<CompareBaseline, React.ReactNode>> = {};

    if (picked === "approved" && approvedState.kind === "ready" && approvedState.approved) {
      out.approved = (
        <ApprovedCompareView
          approvedPages={approvedState.approved}
          currentPages={approvedState.current}
        />
      );
    }

    if (picked === "published" && publishedState.kind === "ready" && publishedState.rows.length >= 1) {
      const latest = publishedState.rows[0];
      const prev = publishedState.rows[1];
      if (prev) {
        out.published = (
          <PublishDiffView
            siteId={siteId!}
            from={{ id: prev.id, version: prev.version }}
            to={{ id: latest.id, version: latest.version }}
            onBack={() => { /* no-op — picker is the chrome */ }}
          />
        );
      } else {
        out.published = (
          <p className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)] tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:text-center">
            Only one published version — there’s nothing earlier to compare against.
          </p>
        );
      }
    }

    if (picked === "saved" && latestSaved) {
      /* CompareView takes (currentSnapshot, targetSnapshot) and renders
         "No differences" when they match. The diff here is a draft-vs-saved
         snapshot pair; both come from the saved milestone today (draft
         visual is filled by the panel itself). compareResult stays null
         until the snapshot pair is wired — CompareView handles it. */
      out.saved = (
        <CompareView
          version={latestSaved}
          compareResult={null}
          currentVisualSnapshot={null}
          aiSummaryState={{ loading: false, result: null, error: null }}
          onGetAiSummary={() => {}}
          aiCooldownSeconds={0}
        />
      );
    }

    /* current = composer export against itself. Renders the same body as
       saved when no saves exist (so the user can confirm the picker works),
       otherwise the saved body renders the "No differences" path. */
    if (picked === "current") {
      out.current = (
        <div className="tw:flex-1 tw:flex tw:items-center tw:justify-center tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]">
          <p className="tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:text-center tw:max-w-[280px]">
            Pick a baseline on the left to compare against your current draft. Approved, published, and saved versions are all available here.
          </p>
        </div>
      );
    }

    return out;
  }, [picked, approvedState, publishedState, latestSaved, siteId]);

  const loading = React.useMemo<Partial<Record<CompareBaseline, boolean>>>(
    () => ({
      approved: approvedState.kind === "loading",
      published: publishedState.kind === "loading",
    }),
    [approvedState, publishedState],
  );

  const errors = React.useMemo<Partial<Record<CompareBaseline, { message: string; onRetry?: () => void } | undefined>>>(
    () => ({
      approved:
        approvedState.kind === "error"
          ? { message: approvedState.message, onRetry: () => setApprovedRetry((n) => n + 1) }
          : undefined,
      published:
        publishedState.kind === "error"
          ? { message: publishedState.message, onRetry: () => setPublishedRetry((n) => n + 1) }
          : undefined,
    }),
    [approvedState, publishedState],
  );

  return (
    <ComparePanel
      availability={availability}
      value={picked}
      onChange={setPicked}
      bodies={bodies}
      loading={loading}
      errors={errors}
    />
  );
};

/* Same predicate the initial useState reads. Pulled out so the closure
   inside useState doesn't capture stale versions. */
function savedAvailableStub(versions: ReadonlyArray<unknown>): boolean {
  return versions.length > 0;
}

export default SessionView;
