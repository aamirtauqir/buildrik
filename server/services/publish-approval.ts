/**
 * Publish approval gate (m-approval).
 *
 * When a workspace has `editsRequireApproval` on, a non-Owner/non-Admin member
 * cannot publish directly — the site's latest review must be APPROVED. Owners and
 * Admins are exempt (they can self-publish urgent fixes). This is the enforcement
 * that was missing: `editsRequireApproval` was read only in settings UI and never
 * checked at publish, so the gate blocked nothing.
 *
 * Pure decision function (no DB) so it is trivially unit-testable; the DB reads
 * live in startPublish, which calls this with the fetched values.
 *
 * Known limitation (documented, not a bug): approval is validated against the
 * LATEST ReviewRequest. Edits made AFTER an approval are not auto-invalidated —
 * closing that needs change-since-approval tracking, a separate feature.
 *
 * @license BSD-3-Clause
 */

/** Workspace roles that may publish without an approved review. */
const APPROVAL_EXEMPT_ROLES: ReadonlySet<string> = new Set(["OWNER", "ADMIN"]);

export interface ApprovalGateInput {
  /** Workspace-wide setting: do edits require approval before publish? */
  editsRequireApproval: boolean;
  /** The publishing actor's role in the workspace (OWNER/ADMIN/EDITOR/VIEWER). */
  role: string;
  /** Status of the site's most recent ReviewRequest, or null if none exists. */
  latestReviewStatus: string | null;
}

/**
 * True when this publish must be blocked pending approval.
 *   - gate off                       → never blocked
 *   - actor is OWNER or ADMIN        → never blocked (exempt)
 *   - otherwise                      → blocked unless latest review is APPROVED
 */
export function isPublishBlockedByApproval(input: ApprovalGateInput): boolean {
  if (!input.editsRequireApproval) return false;
  if (APPROVAL_EXEMPT_ROLES.has(input.role)) return false;
  return input.latestReviewStatus !== "APPROVED";
}
