/**
 * The publish worker's job run: claim a QUEUED job, build/check/deploy its
 * bundle (or simulate), and write the outcome — job status, site status,
 * notification, activity. Moved out of
 * `app/api/workers/publish/[jobId]/route.ts` (which now only authenticates
 * and maps the result to HTTP) so the route no longer touches Prisma.
 */
import { Prisma } from "@prisma/client";
import { deliverWebhook } from "@/server/services/webhook.service";
import { prisma } from "@/lib/prisma";
import { resolveVercelProjectName, type VercelFile } from "@lib/vercel";
import { resolveSiteOrigin } from "@lib/publish-urls";
import { buildDeployFiles, verifiedPrimaryDomain } from "@lib/publish-files";
import { planPublishPages } from "@lib/publish-forms";
import { getPublishedFormSettings } from "@server/services/form-submission.service";
import {
  activatePublishedForms,
  bundleContext,
  bundleHash,
  bundleStillEntitled,
  checkBundle,
  type Bundle,
  type FormsPlan,
} from "@server/services/publish-bundle.service";
import type { PublishPage } from "@buildrik/shared/schemas/publish";
import { record as recordActivity } from "@server/services/activity-log.service";
import { notifyWorkspaceOwner } from "@server/services/notification.trigger";
import {
  applyPublishedPassword,
  assertProjectNameFree,
  runVercelDeploy,
  completePublish,
} from "@server/services/publish.service";
import { decryptPublishedPassword } from "@server/services/site-settings.service";
import { getWorkspaceAppScripts } from "@server/services/marketplace.service";

export const STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

// Steps that are NOT actually run in the MVP. They must report "skipped", never
// "done" — a green checkmark for work that didn't happen is a false signal
// (image optimization and the Lighthouse performance check both come later).
// Keep this in sync with the STEPS indices above.
export const SKIPPED_STEPS: ReadonlySet<number> = new Set([
  1, // Optimizing images
  4, // Performance check (Lighthouse)
]);

function stepProgress(stepIndex: number): number {
  return Math.round(((stepIndex + 1) / STEPS.length) * 100);
}

export function buildSteps(activeIndex: number, failed = false) {
  return STEPS.map((name, i) => {
    if (i === activeIndex) return { name, status: failed ? "failed" : "active" };
    if (i > activeIndex) return { name, status: "pending" };
    // i < activeIndex — the pipeline has passed this step: it either genuinely
    // ran ("done") or was never run ("skipped"). Never claim "done" for a skip.
    return { name, status: SKIPPED_STEPS.has(i) ? "skipped" : "done" };
  });
}

/**
 * How a worker run ended. The worker route maps each to its HTTP response.
 * - not-queued: no such job, or it is not QUEUED (nothing ran)
 * - not-claimed: it left QUEUED (a cancel) before the run could claim it
 * - completed / cancelled: the run finished or honoured a cancel
 * - live-step-failed: the deployment is live but a later step failed (O6)
 * - failed: the publish failed before going live; job FAILED, site restored
 */
export type PublishJobResult = "not-queued" | "not-claimed" | "completed" | "cancelled" | "live-step-failed" | "failed";

/** Run one queued publish job end to end (the publish worker's whole body). */
export async function runPublishJob(jobId: string): Promise<PublishJobResult> {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "QUEUED") {
    return "not-queued";
  }

  // Read HTML payload persisted by sites.publish (if editor provided one).
  const payload = (job.log ?? null) as { pages?: PublishPage[] } | null;
  const pages = payload?.pages ?? [];
  /* D11: a rollback carries the bundle that already shipped — it is
     redeployed byte for byte, never rebuilt from today's settings. */
  const storedBundle = (job.bundle ?? null) as Bundle | null;
  /* O6: where the run is, so a failure says whether the live site changed. */
  const progress: PublishProgress = { phase: "build" };

  // Vercel path requires only a pages payload — the workspace OAuth
  // connection check lives inside runVercelDeploy (publish.service), which
  // returns null in dev when neither workspace OAuth nor env token is
  // available, letting runVercelDeployJob fall through to runSimulation.
  // Earlier gate also required isVercelConfigured() (env-only VERCEL_TOKEN
  // probe) which blocked dev workspaces that connected via OAuth from ever
  // reaching the real path.
  const useVercel = pages.length > 0 || Boolean(storedBundle?.files?.length);

  // Single log line — primary debug signal for Phase 1d ("did real Vercel
  // path fire or did we fall through to sim?"). See editor CLAUDE.md
  // "Phase 1d — Local publish smoke test" runbook.
  console.log(
    `[publish-worker] job=${jobId} site=${job.siteId} pages=${pages.length} ` +
      `mode=${useVercel ? "vercel" : "simulation"}`,
  );

  try {
    // Honesty guard: a job with no page payload cannot really deploy. Falling
    // through to runSimulation marks it COMPLETED and tells the user a
    // non-existent site went live, with a `.dev-simulated.invalid` URL stored
    // as `publishedUrl`.
    //
    // This used to be keyed on NODE_ENV, which is exactly why the dashboard's
    // Publish button shipped broken and stayed broken: it sends no pages
    // (only the editor does), so in production every dashboard publish failed
    // here — while locally the same click produced a green "Published" state
    // and nobody could see the bug. Simulation is now opt-in via an explicit
    // flag, so no environment can silently fake a successful deploy.
    const simulationAllowed = process.env.PUBLISH_ALLOW_SIMULATION === "true";
    if (!useVercel && !simulationAllowed) {
      throw new Error(
        "No page content to deploy. Open the site in the editor and publish from there.",
      );
    }

    /* Conditional claim: the QUEUED read above is not a lock. A cancel landing
       between it and this write was overwritten by BUILDING and the job
       deployed anyway; now the cancel wins and nothing is written. */
    const claimed = await prisma.publishBuildJob.updateMany({
      where: { id: jobId, status: "QUEUED" },
      data: {
        status: "BUILDING",
        startedAt: new Date(),
        progress: 0,
        steps: buildSteps(0),
      },
    });
    if (claimed.count === 0) {
      return "not-claimed";
    }

    /* DEPLOYING is written HERE, and until 2026-09-09 nothing ever wrote it.
       The enum carried the state and `publish.service.ts:206,227` FILTERED on
       it — a read with no writer — so four boards drew a phase the product
       could never enter (BLOCKERS E1, confirmed 2026-09-03, taken 2026-09-08).
       The transition belongs at exactly this line: everything above is page
       generation, everything below is the deploy the provider is running. The
       stale-job sweeps that already look for BUILDING/DEPLOYING past a cutoff
       now see a state that actually occurs, which is what they were written
       for. Step 2 is "Deploying to CDN", so the progress row moves with it. */
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "DEPLOYING", progress: stepProgress(2), steps: buildSteps(2) },
    });

    const outcome = useVercel
      ? await runVercelDeployJob(jobId, job.siteId, job.workspaceId, pages, storedBundle, job.formsPlan as FormsPlan | null, progress)
      : { url: await runSimulation(jobId, job.siteId), deploymentId: null, postDeployError: null, hasForms: false };
    const publicUrl = outcome.url;

    // D-1: the worker was the only live COMPLETED writer, and it duplicated
    // (and diverged from) completePublish's own transaction — including
    // nulling `log` here, which made every real publish NOT_ROLLBACKABLE
    // despite the service and the UI already shipping rollback (PD-41: keep
    // the payload, bounded by completePublish's own 20-version prune).
    /* The deployment id lands with COMPLETED in one write: unpublish and the
       deletion take-down pick the latest COMPLETED job that has one, so a
       live job without it would take down the PREVIOUS deployment. */
    await completePublish(jobId, publicUrl, {
      progress: 100,
      steps: buildSteps(STEPS.length),
      deploymentId: outcome.deploymentId,
    });

    /* O6: a step after the deployment went live failed — the site IS live
       (not FAILED, never demoted); the step is retried on its own. */
    if (outcome.postDeployError) {
      await prisma.publishBuildJob.update({
        where: { id: jobId },
        data: { failedPhase: "post-deploy", error: outcome.postDeployError },
        select: { id: true },
      });
    }

    /* A3/O3: forms switch over now that the deploy is live — never before.
       PENDING was written with the bundle, so a worker that dies here is
       picked up by the cron (O5); the publish is done. */
    if (outcome.hasForms) {
      await activatePublishedForms(jobId).catch((e: unknown) => {
        console.error(`[publish-worker] forms activation for job=${jobId}:`, e instanceof Error ? e.message : e);
      });
    }

    // P6 workspace webhook — best-effort, never blocks the publish result.
    void deliverWebhook(job.workspaceId, "site.publish", {
      siteId: job.siteId,
      jobId,
      url: publicUrl,
    });

    const completedSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { workspaceId: true, lastPublishedBy: true, name: true },
    });
    if (completedSite) {
      /* The OUTCOME notification. Only the publish START sent one, so the bell
         filled with "publish started" lines and never once said whether the
         site went live — and `SITE_PUBLISH_FAILED`, a type that has always been
         in the enum with its own preference category, had no writer at all: a
         failed deploy notified nobody. */
      notifyWorkspaceOwner(
        completedSite.workspaceId,
        "SITE_PUBLISHED",
        `Site "${completedSite.name}" is live at ${publicUrl}`,
        `/dashboard/sites/${job.siteId}`,
        job.siteId,
      ).catch(() => {});

      await recordActivity({
        workspaceId: completedSite.workspaceId,
        siteId: job.siteId,
        actorId: completedSite.lastPublishedBy,
        action: "site.published",
        targetType: "publishJob",
        targetId: jobId,
        description: `Published to ${publicUrl}`,
        metadata: { jobId, publicUrl, mode: useVercel ? "vercel" : "simulation", pages: pages.length },
      });
    }

    return "completed";
  } catch (err) {
    if (err instanceof CancelledError) {
      return "cancelled";
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    /* The deployment went live before this threw: the publish is not FAILED
       and its stored copy stays (it is what serves, and what a rollback to
       it needs). Make sure it reads COMPLETED, record the step, stop. */
    if (progress.phase === "live") {
      console.error(`[publish-worker] job=${jobId} after the deploy went live:`, message);
      try {
        const current = await prisma.publishBuildJob.findUnique({ where: { id: jobId }, select: { status: true } });
        if (current?.status !== "COMPLETED" && progress.liveUrl) {
          await completePublish(jobId, progress.liveUrl, {
            progress: 100,
            steps: buildSteps(STEPS.length),
            deploymentId: progress.deploymentId,
          });
        }
        await prisma.publishBuildJob.update({
          where: { id: jobId },
          data: { failedPhase: "post-deploy", error: `after going live: ${message}` },
          select: { id: true },
        });
        if (current?.status === "COMPLETED" || progress.liveUrl) await activatePublishedForms(jobId).catch(() => null);
      } catch (e: unknown) {
        console.error(`[publish-worker] job=${jobId} could not record the post-deploy failure:`, e instanceof Error ? e.message : e);
      }
      return "live-step-failed";
    }
    // Preserve PUBLISHED status on republish failure — the live deployment
    // from a prior successful publish is still serving. Discriminator is
    // publishedUrl presence (not site.status, which is "PUBLISHING" during
    // the in-flight attempt). Only demote to DRAFT when the very first
    // publish failed (site never had a live URL). Job→FAILED and the site
    // demotion commit together — a crash between the two would otherwise
    // leave the site stuck in PUBLISHING with no active job.
    const currentSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { publishedUrl: true },
    });
    await prisma.$transaction([
      prisma.publishBuildJob.update({
        where: { id: jobId },
        /* O6: every failure here happened before the deploy went live —
           checks, build or the deploy itself — and says which. */
        data: {
          status: "FAILED",
          error: message,
          failedPhase: progress.phase,
          steps: buildSteps(0, true),
          log: Prisma.DbNull,
          bundle: Prisma.DbNull,
          formsStatus: null,
        },
      }),
      prisma.site.update({
        where: { id: job.siteId },
        data: {
          status: currentSite?.publishedUrl ? "PUBLISHED" : "DRAFT",
          lastPublishError: message,
        },
      }),
    ]);

    const failedSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { workspaceId: true, lastPublishedBy: true, name: true },
    });
    if (failedSite) {
      notifyWorkspaceOwner(
        failedSite.workspaceId,
        "SITE_PUBLISH_FAILED",
        `Site "${failedSite.name}" didn't publish: ${message}`,
        `/dashboard/sites/${job.siteId}`,
        job.siteId,
      ).catch(() => {});

      await recordActivity({
        workspaceId: failedSite.workspaceId,
        siteId: job.siteId,
        actorId: failedSite.lastPublishedBy,
        action: "site.publish_failed",
        targetType: "publishJob",
        targetId: jobId,
        description: `Publish failed: ${message}`,
        metadata: { jobId, error: message, mode: useVercel ? "vercel" : "simulation" },
      });
    }

    return "failed";
  }
}

class CancelledError extends Error {
  constructor() {
    super("CANCELLED");
    this.name = "CancelledError";
  }
}

async function checkCancelled(jobId: string): Promise<void> {
  const current = await prisma.publishBuildJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (current?.status === "CANCELLED") throw new CancelledError();
}

async function setStep(jobId: string, stepIndex: number): Promise<void> {
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: {
      progress: stepProgress(stepIndex),
      steps: buildSteps(stepIndex + 1),
    },
    select: { id: true },
  });
}

interface PublishProgress {
  /** "live": the deployment serves — nothing after it may mark the job FAILED. */
  phase: "build" | "checks" | "deploy" | "live";
  liveUrl?: string;
  deploymentId?: string | null;
}

interface DeployOutcome {
  url: string;
  deploymentId: string | null;
  /** A step after the deployment went live failed (O6). */
  postDeployError: string | null;
  /** This publish carries a forms plan to switch over once live. */
  hasForms: boolean;
}

/**
 * Real Vercel deployment path. Builds (or reuses) the bundle, checks it,
 * deploys it through runVercelDeploy, then runs the post-deploy steps. Throws
 * before the deploy goes live; after it, a failed step comes back as
 * `postDeployError` (O6), never as a throw from those steps.
 */
async function runVercelDeployJob(
  jobId: string,
  siteId: string,
  workspaceId: string,
  pages: PublishPage[],
  storedBundle: Bundle | null,
  storedFormsPlan: FormsPlan | null,
  progress: PublishProgress,
): Promise<DeployOutcome> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      slug: true,
      vercelProjectName: true,
      name: true,
      publishedPassword: true,
      favicon: true,
      touchIcon: true,
      ogImage: true,
      canonicalUrl: true,
      allowIndexing: true,
      robotsTxt: true,
      // Settings S3: the Headers screen's columns ship in vercel.json.
      cspPolicy: true,
      hstsMaxAge: true,
      xFrameOptions: true,
      referrerPolicy: true,
      permissionsPolicy: true,
    },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");

  /* Settings S3: the Redirects screen's rules and the REDIRECT-kind domains
     become vercel.json redirects (publish-files.ts). Until now neither left
     the database — a redirect saved in Settings never redirected anything. */
  const [redirects, domains] = await Promise.all([
    prisma.redirect.findMany({
      where: { siteId },
      orderBy: { createdAt: "asc" },
      select: { fromPath: true, toUrl: true, type: true, matchQuery: true },
    }),
    prisma.domain.findMany({ where: { siteId }, select: { domain: true, kind: true, isPrimary: true, status: true } }),
  ]);

  // Enforce the published-site password on the live URL via Vercel deployment
  // protection. null = no/legacy password → clears protection on deploy.
  const passwordPlain = decryptPublishedPassword(site.publishedPassword);

  // Free-plan "Made with Buildrick" badge (90-published): injected on FREE,
  // removed on paid plans. Read the workspace plan once for the whole deploy.
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } });
  const showBadge = (ws?.plan ?? "FREE") === "FREE";

  // Workspace-app head scripts (Live Chat, …). Best-effort: an error here must
  // never fail an otherwise-good publish, so fall back to no injection.
  let appScripts = "";
  try {
    appScripts = await getWorkspaceAppScripts(workspaceId);
  } catch {
    appScripts = "";
  }

  // Named here rather than at the deploy call: the sitemap needs the origin
  // this deploy will land on, and that is derived from the project name.
  const projectName = resolveVercelProjectName(site);
  if (!site.vercelProjectName) await assertProjectNameFree(siteId, projectName);

  let files: VercelFile[];
  let formsPlan: FormsPlan | null;
  const context = bundleContext(showBadge, appScripts);
  /* A rollback's stored bytes ship only under the entitlements they were
     built with; otherwise it rebuilds from its pages with today's (no badge
     dodged after a downgrade, no uninstalled app's script). */
  if (storedBundle && bundleStillEntitled(storedBundle, context)) {
    files = storedBundle.files;
    formsPlan = storedFormsPlan;
  } else {
    /* The shared page post-processing (forms + widget runtimes — the same
       step the ZIP export runs). Forms: every actionless one is pointed at
       the public endpoint. The plan is recorded only once the deploy is live
       (A3/O3) — recording it here left a failed deploy's forms switched on
       and the live site's switched off. */
    const plan = planPublishPages(pages, {
      siteId,
      appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "",
      formSettings: await getPublishedFormSettings(siteId),
    });
    if (plan.error) throw new Error(plan.error);
    formsPlan = plan.forms.length > 0 || plan.deactivateMissing ? { forms: plan.forms, deactivateMissing: plan.deactivateMissing } : null;

    files = buildDeployFiles({
      siteId,
      pages: plan.pages,
      origin: resolveSiteOrigin({
        canonicalUrl: site.canonicalUrl,
        verifiedDomain: verifiedPrimaryDomain(domains),
        vercelProjectName: projectName,
      }),
      icons: { favicon: site.favicon, touchIcon: site.touchIcon, ogImage: site.ogImage },
      canonicalUrl: site.canonicalUrl,
      allowIndexing: site.allowIndexing,
      robotsTxt: site.robotsTxt,
      appScripts,
      showBadge,
      redirects,
      domains,
      headers: {
        cspPolicy: site.cspPolicy,
        hstsMaxAge: site.hstsMaxAge,
        xFrameOptions: site.xFrameOptions,
        referrerPolicy: site.referrerPolicy,
        permissionsPolicy: site.permissionsPolicy,
      },
    });
  }

  /* D11: the checks read the files that ship, and these exact files are what
     deploys — a setting changed after this point cannot reach this publish. */
  progress.phase = "checks";
  const reasons = checkBundle(files);
  if (reasons.length > 0) throw new Error(`PUBLISH_BLOCKED: ${reasons.join(" ")}`);
  const hash = bundleHash(files);
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: {
      bundle: { files, context } as unknown as Prisma.InputJsonValue,
      bundleHash: hash,
      /* PENDING from here: a worker that dies after COMPLETED is still
         picked up by the cron, which only reads PENDING (O5). A failed or
         cancelled job clears it. */
      ...(formsPlan ? { formsPlan: formsPlan as unknown as Prisma.InputJsonValue, formsStatus: "PENDING" } : {}),
    },
  });

  // Step 0 — Generating pages: editor already rendered HTML; just mark done.
  await checkCancelled(jobId);
  await setStep(jobId, 0);

  // Step 1 — Optimizing images: not run in MVP. Reports "skipped" (see
  // SKIPPED_STEPS), never "done".
  await checkCancelled(jobId);
  await setStep(jobId, 1);

  // Step 2 — Deploying to CDN: delegate to service (handles OAuth connection gating).
  await checkCancelled(jobId);
  progress.phase = "deploy";
  const result = await runVercelDeploy(workspaceId, projectName, files);
  if (result === null) {
    // dev mode + no workspace connection → fall through to simulation
    return { url: await runSimulation(jobId, siteId), deploymentId: null, postDeployError: null, hasForms: Boolean(formsPlan) };
  }
  progress.phase = "live";
  progress.liveUrl = result.url;
  progress.deploymentId = result.deploymentId;

  /* O6: the deployment is live from here. A step that fails now does not
     make the publish FAILED (and never demotes the site) — it is reported
     and retried on its own, never by a redeploy. */
  let postDeployError: string | null = null;
  const step = async (name: string, run: () => Promise<unknown>) => {
    try {
      await run();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[publish-worker] post-deploy ${name} for job=${jobId}:`, msg);
      postDeployError ??= `${name}: ${msg}`;
    }
  };
  // SA-06: pin the project this site now lives on, so a later slug change
  // keeps deploying here instead of creating a new project.
  if (!site.vercelProjectName) {
    await step("project pin", () => prisma.site.update({ where: { id: siteId }, data: { vercelProjectName: projectName } }));
  }
  await step("password protection", () => applyPublishedPassword(workspaceId, projectName, passwordPlain));
  await step("progress", async () => {
    await setStep(jobId, 2);
    // Step 3 — Verifying SSL: deployment already polled to READY by service.
    await setStep(jobId, 3);
    // Step 4 — Performance check (Lighthouse): not run in MVP. Reports "skipped".
    await setStep(jobId, 4);
  });

  // Prefer custom verified domain if configured, else Vercel-provided URL.
  const domain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED", isPrimary: true },
    select: { domain: true },
  });
  return {
    url: domain?.domain ? `https://${domain.domain}` : result.url,
    deploymentId: result.deploymentId,
    postDeployError,
    hasForms: Boolean(formsPlan),
  };
}

/**
 * Dev simulation fallback. Used when VERCEL_TOKEN is unset or no HTML
 * payload was sent. Preserves existing dev-without-credentials behavior.
 */
async function runSimulation(jobId: string, siteId: string): Promise<string> {
  for (let i = 0; i < STEPS.length; i++) {
    await checkCancelled(jobId);
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: {
        progress: Math.round((i / STEPS.length) * 100),
        steps: buildSteps(i),
      },
    });
    await delay(2000);
    await setStep(jobId, i);
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { slug: true },
  });
  const domain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED", isPrimary: true },
    select: { domain: true },
  });
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: { deploymentId: `sim_${jobId.slice(0, 8)}` },
  });
  // `.invalid` is reserved by RFC 2606 and can never resolve. The simulation
  // used to return a real-looking `<slug>.buildrick.app` URL, which is how a
  // dead domain survived so long: dev publishes appeared to succeed and handed
  // back an address nobody ever clicked. A URL that visibly cannot work keeps
  // the fake path honest.
  return domain?.domain
    ? `https://${domain.domain}`
    : `https://${site?.slug ?? siteId}.dev-simulated.invalid`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
