/**
 * Publish approval gate (m-approval).
 *
 * When a workspace has `editsRequireApproval` on, a publish is blocked unless the
 * site's latest review is APPROVED. Only the workspace OWNER is exempt (the policy
 * owner / approver-of-last-resort keeps an escape hatch). ADMINs are NOT exempt:
 * `sites.publish` already requires ADMIN+, so exempting ADMIN would make the gate
 * block nobody — exactly the §13-C1 bug ("any ADMIN publishes even when the
 * workspace demands review"). Gating ADMIN is the whole point of the setting.
 *
 * This is the enforcement that was missing: `editsRequireApproval` was read only
 * in the settings UI and never checked at publish, so the gate blocked nothing.
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
}

/**
 * True when this publish must be blocked pending approval.
 *   - gate off                       → never blocked
 *   - actor is OWNER                 → never blocked (exempt)
 *   - otherwise (ADMIN and below)    → blocked unless latest review is APPROVED
 */
export function isPublishBlockedByApproval(input: ApprovalGateInput): boolean {
  if (!input.editsRequireApproval) return false;
  if (APPROVAL_EXEMPT_ROLES.has(input.role)) return false;
  return input.latestReviewStatus !== "APPROVED";
}
