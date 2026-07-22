/**
 * Publish approval gate (m-approval).
 *
 * When a workspace has `editsRequireApproval` on, a publish is blocked unless the
 * site's latest review is APPROVED. Only the workspace OWNER is exempt (the policy
 * owner / approver-of-last-resort keeps an escape hatch). ADMINs are NOT exempt —
 * since M3, `sites.publish` gates at EDITOR (a DESIGNER may publish; the approval
 * is the real control), so the gate must hold for everyone below OWNER or it
 * blocks nobody — exactly the §13-C1 bug ("any ADMIN publishes even when the
 * workspace demands review"). Gating ADMIN is the whole point of the setting.
 *
 * This is the enforcement that was missing: `editsRequireApproval` was read only
 * in the settings UI and never checked at publish, so the gate blocked nothing.
 *
 * Pure decision function (no DB) so it is trivially unit-testable; the DB reads
 * live in startPublish, which calls this with the fetched values.
 *
 * Stale-approval (contracts §1.5): an approval covers the version that was
 * approved, not later edits. If the site was edited after it was approved
 * (`siteLastEditedAt > latestReviewResolvedAt`), the approval is STALE — the
 * client signed off on something that has since changed. A stale approval does
 * not silently pass: publish is blocked until the publisher either re-sends for
 * review or explicitly acknowledges the staleness (`acknowledgeStale`). It is
 * not revoked — the acknowledgement path keeps publish possible, per the
 * contract, but makes "I am shipping something the client did not approve" a
 * deliberate act rather than an accident.
 *
 * @license BSD-3-Clause
 */

/**
 * Workspace roles that may publish without an approved review. OWNER only — the
 * workspace principal who set the policy. ADMIN is deliberately excluded (§13-C1).
 */
const APPROVAL_EXEMPT_ROLES: ReadonlySet<string> = new Set(["OWNER"]);

export interface ApprovalGateInput {
  /** Workspace-wide setting: do edits require approval before publish? */
  editsRequireApproval: boolean;
  /** The publishing actor's role in the workspace (OWNER/ADMIN/EDITOR/VIEWER). */
  role: string;
  /** Status of the site's most recent ReviewRequest, or null if none exists. */
  latestReviewStatus: string | null;
  /** When that review was resolved (approved). Null if never resolved. */
  latestReviewResolvedAt?: Date | null;
  /** The site's last content edit — used to detect edits-after-approval. */
  siteLastEditedAt?: Date | null;
  /** The publisher explicitly acknowledged a stale approval and wants to ship anyway. */
  acknowledgeStale?: boolean;
}

/**
 * True when the site was edited after its approval, so the approval no longer
 * covers the current version (contracts §1.5). Only meaningful for an APPROVED
 * review; false when the timestamps are absent (older callers that don't pass
 * them get the prior behaviour).
 */
export function isApprovalStale(input: ApprovalGateInput): boolean {
  if (input.latestReviewStatus !== "APPROVED") return false;
  const approvedAt = input.latestReviewResolvedAt;
  const editedAt = input.siteLastEditedAt;
  if (!approvedAt || !editedAt) return false;
  return editedAt.getTime() > approvedAt.getTime();
}

/** Why a publish is blocked by the approval gate, or null when it is allowed. */
export type PublishApprovalBlock = "not-approved" | "stale-unacknowledged" | null;

/**
 * The reason this publish is blocked, or null if it may proceed.
 *   - gate off / actor is OWNER      → allowed
 *   - latest review not APPROVED     → "not-approved"
 *   - approved but edited-since, not acknowledged → "stale-unacknowledged"
 *   - approved and current (or acknowledged stale) → allowed
 */
export function publishApprovalBlock(input: ApprovalGateInput): PublishApprovalBlock {
  if (!input.editsRequireApproval) return null;
  if (APPROVAL_EXEMPT_ROLES.has(input.role)) return null;
  if (input.latestReviewStatus !== "APPROVED") return "not-approved";
  if (isApprovalStale(input) && !input.acknowledgeStale) return "stale-unacknowledged";
  return null;
}

/**
 * True when this publish must be blocked pending approval. Thin back-compat
 * wrapper over publishApprovalBlock; callers that want to distinguish
 * not-approved from stale should use publishApprovalBlock directly.
 */
export function isPublishBlockedByApproval(input: ApprovalGateInput): boolean {
  return publishApprovalBlock(input) !== null;
}
