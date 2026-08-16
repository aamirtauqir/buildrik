/**
 * RoleService — the signed-in member's effective role for the open site
 * (P6, Permissions boards 59:2 / 396:3777). The chrome renders denied
 * controls DISABLED WITH THE REASON ATTACHED, never hidden — so it needs
 * the role up front. Cached per session; server remains the enforcer.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";
import { currentSiteId } from "./ReviewService";

export type WorkspaceRole = "VIEWER" | "EDITOR" | "DESIGNER" | "ADMIN" | "OWNER";

const RANK: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  DESIGNER: 1,
  ADMIN: 2,
  OWNER: 3,
};

let cached: Promise<WorkspaceRole | null> | null = null;

/** The member's role for the open site's workspace. null = no site (demo) or
 *  the lookup failed — treat as "unknown", never as a grant OR a lock: the
 *  server enforces; unknown keeps the chrome as-is. */
export function fetchMyRole(): Promise<WorkspaceRole | null> {
  if (cached) return cached;
  const siteId = currentSiteId();
  if (!siteId) return Promise.resolve(null);
  cached = getBuildrikClient(DASHBOARD_URL)
    .sites.myRole.query({ siteId })
    .then((r: { role: string }) => (r.role as WorkspaceRole) ?? null)
    .catch(() => null);
  return cached;
}

export function roleAtLeast(role: WorkspaceRole | null, min: WorkspaceRole): boolean | null {
  if (role == null) return null; // unknown — let the server decide
  return RANK[role] >= RANK[min];
}
