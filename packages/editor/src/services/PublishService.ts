/**
 * PublishService — Editor → dashboard publish bridge.
 *
 * Companion to BuildrikSyncProvider. Calls `sites.publish` and
 * `sites.publishStatus` tRPC endpoints.
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

export interface PublishPagePayload {
  /** Path inside the deployment, e.g. "index.html", "about.html". */
  path: string;
  /** Pre-rendered HTML for this page. */
  html: string;
}

export interface PublishStatus {
  jobId: string;
  status: "QUEUED" | "BUILDING" | "DEPLOYING" | "COMPLETED" | "FAILED" | "CANCELLED" | string;
  progress: number;
  publishedUrl?: string | null;
  error?: string | null;
  deploymentId?: string | null;
}

/**
 * Trigger a publish job. Editor passes pre-rendered pages to the dashboard;
 * dashboard worker forwards to Vercel (when VERCEL_TOKEN configured) or
 * runs the dev simulation otherwise.
 *
 * Returns the created job's id, used to poll status.
 */
export async function publishSite(
  siteId: string,
  pages: PublishPagePayload[],
  acknowledgeStale?: boolean,
): Promise<{ jobId: string }> {
  // acknowledgeStale is the deliberate over-ride for a stale approval
  // (contracts §1.5): the site changed after the client signed off, and the
  // publisher is choosing to ship the un-approved changes. Omitted on a normal
  // publish so the server gate can still block.
  const result = await getClient().sites.publish.mutate(
    acknowledgeStale ? { siteId, pages, acknowledgeStale: true } : { siteId, pages },
  );
  return { jobId: result.id };
}

/**
 * Fetch latest publish job status.
 */
export async function fetchPublishStatus(jobId: string): Promise<PublishStatus> {
  const job = (await getClient().sites.publishStatus.query({ jobId })) as {
    id: string;
    status: string;
    progress: number;
    deploymentId: string | null;
    error: string | null;
    siteId: string;
  };

  // Resolve publishedUrl by reading the site after job completes.
  let publishedUrl: string | null = null;
  if (job.status === "COMPLETED") {
    const site = (await getClient().sites.get.query({ id: job.siteId })) as {
      publishedUrl?: string | null;
    };
    publishedUrl = site.publishedUrl ?? null;
  }

  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    publishedUrl,
    error: job.error,
    deploymentId: job.deploymentId,
  };
}

/**
 * Cancel an in-flight publish.
 */
export async function cancelPublish(jobId: string): Promise<void> {
  await getClient().sites.cancelPublish.mutate({ jobId });
}

/**
 * Read whether a site has been previously published. Used by editor mount
 * to hydrate the Topbar's "Published" state so a returning user sees the
 * correct status without having to re-publish.
 */
export async function fetchSitePublishState(
  siteId: string,
): Promise<{ isPublished: boolean; publishedUrl: string | null }> {
  const site = (await getClient().sites.get.query({ id: siteId })) as {
    status?: string | null;
    publishedUrl?: string | null;
  };
  return {
    isPublished: site.status === "PUBLISHED" && !!site.publishedUrl,
    publishedUrl: site.publishedUrl ?? null,
  };
}

/* ── P1 publish history + rollback ────────────────────────────────────────── */

export interface PublishHistoryRow {
  id: string;
  version: number;
  completedAt: string | Date | null;
  deploymentId: string | null;
  rollbackable: boolean;
  rolledBackFrom: string | null;
}

/**
 * A site's published-version history (contract §5). THROWS on a fetch error so
 * the panel can show "couldn't load · Retry" rather than a fake-empty list
 * (DF5) — the same rule as the P0 review thread.
 */
export async function fetchPublishHistory(siteId: string): Promise<PublishHistoryRow[]> {
  return getClient().sites.publishHistory.query({ siteId });
}

/**
 * Roll back to a prior version — re-publishes it as a NEW job. Throws on
 * failure (NOT_ROLLBACKABLE / already-publishing) so the UI can show the reason.
 */
export async function rollbackToVersion(siteId: string, jobId: string): Promise<void> {
  await getClient().sites.rollback.mutate({ siteId, jobId });
}
