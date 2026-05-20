/**
 * PublishService — Editor → dashboard publish bridge.
 *
 * Companion to BuildrikSyncProvider. Calls `sites.publish` and
 * `sites.publishStatus` tRPC endpoints.
 *
 * @license BSD-3-Clause
 */

import { createBuildrikApiClient } from "@buildrik/shared";

const DASHBOARD_URL =
  import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

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
): Promise<{ jobId: string }> {
  const result = await getClient().sites.publish.mutate({ siteId, pages });
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
