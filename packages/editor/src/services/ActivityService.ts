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
 * `activity.recent` (dashboard `server/trpc/routers/activity.ts`) is typed
 * through `AppRouter`. A failure is thrown as an `ActivityReadError` whose
 * `reason` tells the view which state to draw: `unauthorized` (signed out, no
 * role, or the site is gone — NOT_FOUND; retrying will not fix any of them),
 * `failed` (anything else, retryable). Never a fake-empty list.
 *
 * @license BSD-3-Clause
 */

import type { SiteActivityFilter, SiteActivityKind, SiteActivityEntry } from "@buildrik/shared/schemas/activity";
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";

export type ActivityFilter = SiteActivityFilter;

export type ActivityKind = SiteActivityKind;

export type ActivityEntry = Omit<SiteActivityEntry, "createdAt"> & {
  createdAt: string | Date;
};

export type ActivityReadFailure = "unauthorized" | "failed";

export class ActivityReadError extends Error {
  constructor(readonly reason: ActivityReadFailure) {
    super(`activity.recent: ${reason}`);
    this.name = "ActivityReadError";
  }
}

function failureOf(err: unknown): ActivityReadFailure {
  const code = (err as { data?: { code?: unknown } } | null)?.data?.code;
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "NOT_FOUND") return "unauthorized";
  return "failed";
}

/** siteId may be null when the editor is opened without a project (rare). */
export async function fetchRecentActivity(
  siteId: string | null | undefined,
  filter: ActivityFilter,
): Promise<ActivityEntry[]> {
  if (!siteId) return [];
  let rows: ActivityEntry[];
  try {
    rows = await getBuildrikClient(DASHBOARD_URL).activity.recent.query({ siteId, filter });
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
