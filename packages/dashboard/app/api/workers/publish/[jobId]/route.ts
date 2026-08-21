import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { deliverWebhook } from "@/server/services/webhook.service";
import { prisma } from "@lib/prisma";
import { slugifyProjectName, type VercelFile } from "@lib/vercel";
import {
  pageCanonicalUrl,
  resolveSiteOrigin,
  buildSitemapXml,
  withSitemapDirective,
} from "@lib/publish-urls";
import {
  injectAnalyticsBeacon,
  injectWorkspaceApps,
  injectHeadTags,
  injectSeoTags,
  injectBadge,
} from "@lib/publish-html";
import type { PublishPage } from "@buildrik/shared/schemas/publish";
import { record as recordActivity } from "@server/services/activity-log.service";
import { notifyWorkspaceOwner } from "@server/services/notification.trigger";
import { runVercelDeploy } from "@server/services/publish.service";
import { decryptPublishedPassword } from "@server/services/site-settings.service";
import { getWorkspaceAppScripts } from "@server/services/marketplace.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Exported for unit testing. Next only treats HTTP-method exports (GET/POST/…)
// as route handlers; these named helper exports are ignored by the router.
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const secret = req.headers.get("x-worker-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "QUEUED") {
    return new Response("Job not found or not in QUEUED state", { status: 400 });
  }

  // Read HTML payload persisted by sites.publish (if editor provided one).
  const payload = (job.log ?? null) as { pages?: PublishPage[] } | null;
  const pages = payload?.pages ?? [];

  // Vercel path requires only a pages payload — the workspace OAuth
  // connection check lives inside runVercelDeploy (publish.service), which
  // returns null in dev when neither workspace OAuth nor env token is
  // available, letting runVercelDeployJob fall through to runSimulation.
  // Earlier gate also required isVercelConfigured() (env-only VERCEL_TOKEN
  // probe) which blocked dev workspaces that connected via OAuth from ever
  // reaching the real path.
  const useVercel = pages.length > 0;

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
    if (pages.length === 0 && !simulationAllowed) {
      throw new Error(
        "No page content to deploy. Open the site in the editor and publish from there.",
      );
    }

    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: {
        status: "BUILDING",
        startedAt: new Date(),
        progress: 0,
        steps: buildSteps(0),
      },
    });

    const publicUrl = useVercel
      ? await runVercelDeployJob(jobId, job.siteId, job.workspaceId, pages)
      : await runSimulation(jobId, job.siteId);

    await prisma.$transaction([
      prisma.publishBuildJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          steps: buildSteps(STEPS.length),
          // Clear `log` (raw page HTML payload). See publish.service.ts
          // for the data-at-rest rationale; same treatment in every
          // terminal-state update.
          log: Prisma.DbNull,
        },
      }),
      prisma.site.update({
        where: { id: job.siteId },
        data: {
          status: "PUBLISHED",
          publishedUrl: publicUrl,
          lastPublishedAt: new Date(),
        },
      }),
    ]);

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

    return new Response("OK", { status: 200 });
  } catch (err) {
    if (err instanceof CancelledError) {
      return new Response("Cancelled", { status: 200 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
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
        data: { status: "FAILED", error: message, steps: buildSteps(0, true), log: Prisma.DbNull },
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

    return new Response("Error", { status: 500 });
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
  });
}

/**
 * Real Vercel deployment path. Orchestrates steps/progress tracking,
 * delegates actual Vercel HTTP work to runVercelDeploy in publish.service.
 * Returns the public URL on success. Throws on failure.
 */
async function runVercelDeployJob(
  jobId: string,
  siteId: string,
  workspaceId: string,
  pages: PublishPage[],
): Promise<string> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { slug: true, name: true, publishedPassword: true, favicon: true, touchIcon: true, ogImage: true, canonicalUrl: true, allowIndexing: true, robotsTxt: true },
  });
  if (!site) throw new Error("SITE_NOT_FOUND");

  // Enforce the published-site password on the live URL via Vercel deployment
  // protection. null = no/legacy password → clears protection on deploy.
  const passwordPlain = decryptPublishedPassword(site.publishedPassword);

  // Free-plan "Made with Buildrick" badge (90-published): injected on FREE,
  // removed on paid plans. Read the workspace plan once for the whole deploy.
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { plan: true } });
  const showBadge = (ws?.plan ?? "FREE") === "FREE";

  const icons = { favicon: site.favicon, touchIcon: site.touchIcon, ogImage: site.ogImage };
  const seo = { canonicalUrl: site.canonicalUrl, allowIndexing: site.allowIndexing };

  // Workspace-app head scripts (Live Chat, …). Best-effort: an error here must
  // never fail an otherwise-good publish, so fall back to no injection.
  let appScripts = "";
  try {
    appScripts = await getWorkspaceAppScripts(workspaceId);
  } catch {
    appScripts = "";
  }

  const files: VercelFile[] = pages.map((p) => ({
    file: p.path,
    data: injectBadge(
      injectSeoTags(
        injectHeadTags(injectWorkspaceApps(injectAnalyticsBeacon(p.html, siteId), appScripts), icons),
        { canonical: pageCanonicalUrl(seo.canonicalUrl, p.path), allowIndexing: seo.allowIndexing },
      ),
      showBadge,
    ),
  }));

  // Named here rather than at the deploy call: the sitemap needs the origin
  // this deploy will land on, and that is derived from the project name.
  const projectName = slugifyProjectName(site.slug);

  /* The site's own origin, for the absolute URLs a sitemap and a canonical
     need: the canonical domain the owner typed, else a verified custom domain,
     else the Vercel project this deploy lands on. */
  const verifiedDomain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED" },
    select: { domain: true },
  });
  const origin = resolveSiteOrigin({
    canonicalUrl: seo.canonicalUrl,
    verifiedDomain: verifiedDomain?.domain ?? null,
    vercelProjectName: projectName,
  });

  // Technical SEO (d5): ship robots.txt — the site's custom rules if set, else a
  // sensible default driven by the indexing toggle. Plus the pointer to the
  // sitemap, unless the author wrote their own Sitemap: line.
  const robotsBody = site.robotsTxt?.trim()
    ? site.robotsTxt
    : `User-agent: *\n${site.allowIndexing ? "Allow: /" : "Disallow: /"}\n`;
  files.push({
    file: "robots.txt",
    data: site.allowIndexing ? withSitemapDirective(robotsBody, origin) : robotsBody,
  });

  /* sitemap.xml — published sites shipped none. SitemapGenerator has existed
     and been tested in the editor for months, but it only runs on the ZIP
     export and the publish payload carries pages, so it never reached a
     deploy. Skipped when indexing is off: a staging site asking to be crawled
     is the opposite of what the switch means. */
  if (site.allowIndexing && origin) {
    files.push({ file: "sitemap.xml", data: buildSitemapXml(origin, pages) });
  }

  // Step 0 — Generating pages: editor already rendered HTML; just mark done.
  await checkCancelled(jobId);
  await setStep(jobId, 0);

  // Step 1 — Optimizing images: not run in MVP. Reports "skipped" (see
  // SKIPPED_STEPS), never "done".
  await checkCancelled(jobId);
  await setStep(jobId, 1);

  // Step 2 — Deploying to CDN: delegate to service (handles OAuth connection gating).
  await checkCancelled(jobId);
  const result = await runVercelDeploy(workspaceId, projectName, files, passwordPlain);
  if (result === null) {
    // dev mode + no workspace connection → fall through to simulation
    return runSimulation(jobId, siteId);
  }
  await prisma.publishBuildJob.update({
    where: { id: jobId },
    data: { deploymentId: result.deploymentId },
  });
  await setStep(jobId, 2);

  // Step 3 — Verifying SSL: deployment already polled to READY by service.
  await checkCancelled(jobId);
  await setStep(jobId, 3);

  // Step 4 — Performance check (Lighthouse): not run in MVP. Reports "skipped"
  // (see SKIPPED_STEPS), never "done"; lighthouseScore stays null.
  await setStep(jobId, 4);

  // Prefer custom verified domain if configured, else Vercel-provided URL.
  const domain = await prisma.domain.findFirst({
    where: { siteId, status: "VERIFIED", isPrimary: true },
    select: { domain: true },
  });
  return domain?.domain ? `https://${domain.domain}` : result.url;
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
