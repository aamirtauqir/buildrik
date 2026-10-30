/**
 * The publish tray's ONE CTA, decided in priority order: what is running or
 * has just failed speaks first, then what stops a new publish, then the door
 * itself. Pure, so the order is testable as a table (PublishTray tests).
 *
 * @license BSD-3-Clause
 */
import type { UsePublishJobResult } from "./hooks/usePublishJob";
import { PUBLISH_REFUSAL, type NextMove } from "./lifecycle";
import type { CmsSyncState } from "./PublishTray";

/* ── The one CTA ─────────────────────────────────────────────────────────── */

export type Cta =
  | { kind: "publish"; label: string }
  | { kind: "retry"; label: string }
  | { kind: "check-status"; label: string }
  | { kind: "connect"; label: string }
  | { kind: "shut"; label: string; reason: string | null };

interface CtaInput {
  nextMove: NextMove | null;
  publishJob?: UsePublishJobResult;
  wired: boolean;
  checkState: "loading" | "ready" | "error";
  vercelMissing: boolean;
  /** B8-PB22: the plan's site limit refuses this site — its sentence. */
  planLimit: string | null;
  cms: CmsSyncState;
  /** The site is live — a review verb's door still reads "Publish changes" (B8-PB15). */
  live: boolean;
}

/** In priority order: what is running or has just failed speaks first, then
 *  what stops a new publish, then the door itself. */
export function trayCta({ nextMove, publishJob, wired, checkState, vercelMissing, planLimit, cms, live }: CtaInput): Cta {
  const label = nextMove?.kind === "publish" ? nextMove.label : live ? "Publish changes" : "Publish";
  const ui = publishJob?.uiState;
  if (ui === "publishing") return { kind: "shut", label: "Publishing…", reason: null };
  if (ui === "failed" && publishJob?.pollLost && publishJob.jobId) return { kind: "check-status", label: "Check status" };
  if (ui === "failed" && publishJob?.error) return { kind: "retry", label: "Try again" };
  if (!wired) {
    return { kind: "shut", label, reason: nextMove?.blockedReason ?? PUBLISH_REFUSAL.off };
  }
  if (cms.stuck) return { kind: "shut", label, reason: `CMS changes couldn't sync: ${cms.stuck.reason}` };
  if (cms.pending) return { kind: "shut", label, reason: "Saving CMS changes…" };
  if (nextMove === null) return { kind: "shut", label: "Up to date", reason: null };
  if (planLimit) return { kind: "shut", label, reason: planLimit };
  if (vercelMissing) return { kind: "connect", label: "Connect Vercel" };
  if (checkState === "loading") return { kind: "shut", label, reason: "Checking…" };
  /* B8-PB15: the round's sentence is in the tray's body; the CTA only says why it waits. */
  if (nextMove.gate === "changes-requested") return { kind: "shut", label, reason: "Waiting on review" };
  if (nextMove.kind !== "publish") return { kind: "shut", label, reason: nextMove.gateReason ?? nextMove.blockedReason };
  if (nextMove.blockedReason) return { kind: "shut", label, reason: nextMove.blockedReason };
  return { kind: "publish", label };
}

