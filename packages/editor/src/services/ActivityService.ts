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
 * plan B6) and is not registered in the dashboard `AppRouter` yet
 * (needs-dashboard). The call is typed here by the shape the view needs,
 * and a failure is thrown as an `ActivityReadError` whose `reason` tells the
 * view which state to draw: `unavailable` (the procedure does not exist —
 * NOT_FOUND), `unauthorized` (signed out / no role), `failed` (anything
 * else, retryable). Never a fake-empty list.
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

export type ActivityReadFailure = "unavailable" | "unauthorized" | "failed";

export class ActivityReadError extends Error {
  constructor(readonly reason: ActivityReadFailure) {
    super(`activity.recent: ${reason}`);
    this.name = "ActivityReadError";
  }
}

/** The planned procedure's shape — absent from `AppRouter` until the
 *  dashboard half lands, so the typed client cannot name it. */
interface ActivityRecentClient {
  activity: { recent: { query(input: { siteId: string; filter: ActivityFilter }): Promise<ActivityEntry[]> } };
}

function failureOf(err: unknown): ActivityReadFailure {
  const code = (err as { data?: { code?: unknown } } | null)?.data?.code;
  if (code === "NOT_FOUND") return "unavailable";
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN") return "unauthorized";
  return "failed";
}

/** siteId may be null when the editor is opened without a project (rare). */
export async function fetchRecentActivity(
  siteId: string | null | undefined,
  filter: ActivityFilter,
): Promise<ActivityEntry[]> {
  if (!siteId) return [];
  const client = getBuildrikClient(DASHBOARD_URL) as unknown as ActivityRecentClient;
  let rows: ActivityEntry[];
  try {
    rows = await client.activity.recent.query({ siteId, filter });
  } catch (err) {
    throw new ActivityReadError(failureOf(err));
  }
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    actorName: r.actorName ?? null,
    summary: r.summary,
    actionUrl: r.actionUrl ?? null,
    createdAt: r.createdAt,
  }));
}
