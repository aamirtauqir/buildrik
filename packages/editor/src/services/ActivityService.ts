/**
 * ActivityService — Editor → dashboard activity log bridge.
 *
 * B6 (code-gap plan) reader for the Activity tab. Mirrors the dashboard
 * activity log the SiteMenu deep-links into today, so the editor's copy
 * and the dashboard's copy use the same vocabulary.
 *
 * Editor half built against the `activity.recent` tRPC procedure shape
 * (plan §P5: "packages/editor alone is enough | ACCEPT with a named gap").
 * The dashboard procedure does not exist yet — when it lands the call
 * site does not change. The dashboard half is logged as a needs-dashboard
 * gap in the code-gap plan; this file is the editor-side reader.
 *
 * THROWS on a fetch error so the view can show "couldn't load · Retry"
 * rather than a fake-empty list (DF5 — same rule as `fetchPublishHistory`).
 * Permission failures (401/403) come back as `Error` too; the view's
 * permission-state machine pattern-matches the message to decide whether
 * to show the deep-link.
 *
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

/** Filter chip on the activity log. */
export type ActivityFilter = "all" | "edits" | "comments" | "publish";

/** One row of the activity log. */
export interface ActivityEntry {
  id: string;
  /** Site the row is scoped to — used by the view for client-side filtering
   *  and for the "Open in dashboard" deep-link. */
  siteId: string;
  /** What happened. The view's filter chip is "all + this", so the list
   *  is a tag-driven UI, not a per-kind render. */
  kind: "edit" | "comment" | "publish";
  /** Short human-readable line — the row's primary text. */
  summary: string;
  /** Actor's user id (server-side actor reference). */
  actorId: string;
  /** Display name for the actor. */
  actorName: string;
  /** ISO timestamp; the view formats this for display. */
  createdAt: string;
  /** Optional deep-link to the dashboard view that shows the same row.
   *  Nullable on purpose — the comment row in the unit test sets it to
   *  `null` and the view hides the "View in dashboard" link when missing. */
  actionUrl?: string | null;
}

/**
 * Fetch the recent activity rows for a site, optionally filtered.
 * Throws on a transport failure (DF5 — dropped reads must surface as a
 * retryable error, never a fake-empty list).
 */
export async function fetchRecentActivity(
  siteId: string,
  filter: ActivityFilter,
): Promise<ActivityEntry[]> {
  return getClient().activity.recent.query({ siteId, filter });
}
