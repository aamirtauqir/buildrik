/**
 * ActivityService — editor → dashboard site-activity bridge (B6, code-gap plan).
 *
 * Site-scoped activity rows (edits, comments, publish events) live in the
 * dashboard server. The editor reads them cross-origin via the dashboard tRPC
 * client, same pattern as NotificationService.
 *
 * Throws on user-visible lists (B6 plan #31) so the view can show
 * "couldn't load · Retry" instead of a fake-empty list (DF5 rule from
 * NotificationService). Filter narrowing is server-side — passing the chosen
 * filter does not filter client-side.
 *
 * The `activity.recent` tRPC procedure is the planned endpoint (code-gap
 * plan B6). It is not yet registered in the dashboard `AppRouter`, so the
 * call is `any`-cast at the service boundary. The view renders an error
 * state — not a fake success — when the procedure is absent.
 *
 * @license BSD-3-Clause
 */

import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";

export type ActivityFilter = "all" | "edits" | "comments" | "publish";

export type ActivityKind = "edit" | "comment" | "publish";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  actorName: string | null;
  summary: string;
  actionUrl: string | null;
  createdAt: string | Date;
}

/** siteId may be null when the editor is opened without a project (rare). */
export async function fetchRecentActivity(
  siteId: string | null | undefined,
  filter: ActivityFilter,
): Promise<ActivityEntry[]> {
  if (!siteId) return [];
  // activity.recent is the planned procedure; not yet present in AppRouter — see code-gap plan B6.
  const proc = (getBuildrikClient(DASHBOARD_URL) as any).activity?.recent;
  const rows = await proc.query({ siteId, filter });
  return (rows as ActivityEntry[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    actorName: r.actorName ?? null,
    summary: r.summary,
    actionUrl: r.actionUrl ?? null,
    createdAt: r.createdAt,
  }));
}
