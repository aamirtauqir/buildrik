/**
 * TEMPORARY — replace with the shared import at merge.
 *
 * `siteDetail.analytics.status({ siteId })` is B's (S2 backend, phase2-backend
 * §3): `{ lastEventAt, events24h }` counted off OUR tracker's `AnalyticsEvent`
 * rows. Until that router lands, `AppRouter` still types `siteDetail.analytics`
 * as the old overview query, so the Analytics screen types the contract here
 * and reaches the procedure through a structural cast. At merge:
 *
 *   - `AnalyticsStatus` → `z.infer<typeof analyticsStatusSchema>` from
 *     `@buildrik/shared/schemas/site-detail`
 *   - `readAnalyticsStatus(client, siteId)` → the direct
 *     `client.siteDetail.analytics.status.query({ siteId })`
 *   - delete this file.
 *
 * @license BSD-3-Clause
 */

import type { BuildrikApiClient } from "@/services/api-client";

export interface AnalyticsStatus {
  /** ISO timestamp of the newest event, or null when the tracker has never heard from the site. */
  lastEventAt: string | null;
  /** Events in the last 24 hours. */
  events24h: number;
}

interface AnalyticsStatusProcedure {
  analytics: { status: { query(input: { siteId: string }): Promise<AnalyticsStatus> } };
}

export function readAnalyticsStatus(client: BuildrikApiClient, siteId: string): Promise<AnalyticsStatus> {
  const siteDetail = client.siteDetail as unknown as AnalyticsStatusProcedure;
  return siteDetail.analytics.status.query({ siteId });
}
