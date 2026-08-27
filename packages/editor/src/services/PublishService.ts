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
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";

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

/** One row of the build log — board 784:4403's "View log". */
export interface PublishStep {
  name: string;
  status: "pending" | "running" | "done" | "failed" | string;
}

export interface PublishStatus {
  jobId: string;
  status: "QUEUED" | "BUILDING" | "DEPLOYING" | "COMPLETED" | "FAILED" | "CANCELLED" | string;
  progress: number;
  publishedUrl?: string | null;
  error?: string | null;
  deploymentId?: string | null;
  /**
   * The per-step build log. `getPublishStatus` has always selected `steps`
   * and returned it; this mapping dropped it on the floor, which is why board
   * 784:4403's "View log" link had nothing behind it and was never built.
   *
   * Not to be confused with the `log` column, which holds the raw page HTML
   * payload and is deliberately never sent to a client (see the explicit
   * select in publish.service.ts).
   */
  steps?: PublishStep[];
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
    steps: unknown;
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
    steps: parseSteps(job.steps),
  };
}

/** `steps` is a jsonb column, so it arrives as `unknown` and is narrowed here
    rather than cast — a malformed row must render no log, not crash the panel
    that is already telling the user their publish failed. */
function parseSteps(raw: unknown): PublishStep[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const steps = raw.flatMap((s) =>
    s && typeof s === "object" && typeof (s as PublishStep).name === "string"
      ? [{ name: (s as PublishStep).name, status: String((s as PublishStep).status ?? "pending") }]
      : [],
  );
  return steps.length ? steps : undefined;
}

/**
 * Cancel an in-flight publish.
 */
export async function cancelPublish(jobId: string): Promise<void> {
  await getClient().sites.cancelPublish.mutate({ jobId });
}

export interface SitePublishState {
  isPublished: boolean;
  publishedUrl: string | null;
  /**
   * Has the site changed since it last went live?
   *
   * `null` when it has never been published, or when the server did not send
   * the stamps — unknown, not "no".
   *
   * **The durable answer, and the only one that survives a reload.** The
   * editor's other "since last deploy" number counts entries in
   * `composer.history`, which is memory-only and cleared by `importProject` —
   * so publish, edit, close the tab, reopen tomorrow, and that count is 0 over
   * a site with real unpublished changes.
   *
   * Bias, stated rather than hidden: `Site.lastEditedAt` is written on every
   * `saveProjectData` **and** by `renameSite` and duplicate, so this can
   * over-report (a rename with no content change reads as "unpublished
   * changes"). It cannot under-report, which is the direction that matters — it
   * will never say "nothing to publish" over edits that are really there.
   */
  hasUnpublishedChanges: boolean | null;
  lastPublishedAt: string | null;
}

/**
 * Read whether a site has been previously published. Used by editor mount
 * to hydrate the Topbar's "Published" state so a returning user sees the
 * correct status without having to re-publish.
 *
 * `sites.get` has no `select`, so every scalar comes back; this used to narrow
 * the cast to `status` + `publishedUrl` and drop the rest on the floor.
 */
export async function fetchSitePublishState(siteId: string): Promise<SitePublishState> {
  const site = (await getClient().sites.get.query({ id: siteId })) as {
    status?: string | null;
    publishedUrl?: string | null;
    lastPublishedAt?: string | Date | null;
    lastEditedAt?: string | Date | null;
  };
  const publishedAt = site.lastPublishedAt ? new Date(site.lastPublishedAt) : null;
  const editedAt = site.lastEditedAt ? new Date(site.lastEditedAt) : null;
  return {
    isPublished: site.status === "PUBLISHED" && !!site.publishedUrl,
    publishedUrl: site.publishedUrl ?? null,
    hasUnpublishedChanges: publishedAt && editedAt ? editedAt.getTime() > publishedAt.getTime() : null,
    lastPublishedAt: publishedAt ? publishedAt.toISOString() : null,
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
 *
 * The server creates the job and returns it; the id is what lets the editor
 * watch the thing it just started.
 *
 * This used to return void. Without the id the panel had nothing to poll, so
 * boards 184:37 / 184:45 / 453:4064 were driven off `publishJob.uiState`
 * instead — which is "published" for any already-live site with no job in
 * flight. The confirm therefore reported "Rolled back — v5 is live" the
 * instant it was clicked, on a rollback that never reached the server.
 */
export async function rollbackToVersion(siteId: string, jobId: string): Promise<{ jobId: string }> {
  const result = (await getClient().sites.rollback.mutate({ siteId, jobId })) as { id: string };
  return { jobId: result.id };
}

/**
 * The server's pre-publish readiness contract (`runPrePublishChecks`).
 *
 * The panel MUST render this and not a local approximation. Until 2026-08-05 the
 * sidebar computed seven of its own heuristics off `composer.getProjectSettings()`
 * — a different set from the server's six, with no warning-vs-fail distinction,
 * and it never checked "Vercel connected" at all. That is the one check that
 * actually blocks a deploy, so an all-green sidebar could be followed by a hard
 * server refusal. Only `status: "fail"` blocks; `ready === !hasFail`.
 *
 * THROWS on a fetch error so the panel shows "couldn't load · Retry" rather than
 * a fake-passing checklist (DF5) — same rule as fetchPublishHistory.
 */
export async function fetchPrePublishChecks(siteId: string): Promise<PrePublishChecksResult> {
  return getClient().sites.prePublishChecks.query({ siteId });
}
