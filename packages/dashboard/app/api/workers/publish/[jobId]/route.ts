import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@lib/prisma";
import { slugifyProjectName, type VercelFile } from "@lib/vercel";
import type { PublishPage } from "@buildrik/shared/schemas/publish";
import { record as recordActivity } from "@server/services/activity-log.service";
import { runVercelDeploy } from "@server/services/publish.service";
import { decryptPublishedPassword } from "@server/services/site-settings.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const STEPS = [
  "Generating pages",
  "Optimizing images",
  "Deploying to CDN",
  "Verifying SSL",
  "Performance check",
] as const;

function stepProgress(stepIndex: number): number {
  return Math.round(((stepIndex + 1) / STEPS.length) * 100);
}

function buildSteps(activeIndex: number, failed = false) {
  return STEPS.map((name, i) => ({
    name,
    status:
      i < activeIndex ? "done"
      : i === activeIndex ? (failed ? "failed" : "active")
      : "pending",
  }));
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
    // Honesty guard: in production, a job with no page payload cannot really
    // deploy — falling through to runSimulation would mark it COMPLETED and the
    // user would believe a non-existent site went live. Fail loudly instead.
    // (Dev keeps the simulation path so local flows work without Vercel.)
    if (pages.length === 0 && process.env.NODE_ENV === "production") {
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

    const completedSite = await prisma.site.findUnique({
      where: { id: job.siteId },
      select: { workspaceId: true, lastPublishedBy: true },
    });
    if (completedSite) {
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
      select: { workspaceId: true, lastPublishedBy: true },
    });
    if (failedSite) {
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
/**
 * Inject the first-party analytics beacon into a page's HTML before deploy.
 * The deployed site is cross-origin, so the beacon posts to the dashboard's
 * absolute /api/public/track/<siteId> on load. sendBeacon keeps it
 * fire-and-forget; a per-browser sessionId enables unique-visitor counts.
 * Without this the analytics write path is never triggered and stats stay 0.
 */
function injectAnalyticsBeacon(html: string, siteId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) return html; // no dashboard URL configured → skip silently
  const url = `${base}/api/public/track/${siteId}`;
  const snippet = `<script>(function(){try{var s=localStorage.getItem("_bk_sid");if(!s){s=Math.random().toString(36).slice(2)+Date.now().toString(36);try{localStorage.setItem("_bk_sid",s)}catch(e){}}var d={path:location.pathname,referrer:document.referrer,sessionId:s,viewportWidth:window.innerWidth};var b=new Blob([JSON.stringify(d)],{type:"application/json"});if(navigator.sendBeacon){navigator.sendBeacon(${JSON.stringify(url)},b)}else{fetch(${JSON.stringify(url)},{method:"POST",body:b,keepalive:true})}}catch(e){}})();</script>`;
  if (html.includes("</body>")) return html.replace("</body>", `${snippet}</body>`);
  return html + snippet;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Inject favicon / apple-touch-icon / og:image into <head>. These were
 * uploaded + stored on the Site row but never reached the deployed HTML
 * (the editor's head builder only emits og:image, and only when the editor
 * config carries it). Injecting server-side from the canonical columns
 * guarantees the icons ship, and skips any tag the page already declares.
 */
function injectHeadTags(
  html: string,
  icons: { favicon: string | null; touchIcon: string | null; ogImage: string | null },
): string {
  const tags: string[] = [];
  if (icons.favicon && !/<link[^>]+rel=["']?icon/i.test(html)) {
    tags.push(`<link rel="icon" href="${escapeAttr(icons.favicon)}">`);
  }
  if (icons.touchIcon && !/<link[^>]+rel=["']?apple-touch-icon/i.test(html)) {
    tags.push(`<link rel="apple-touch-icon" href="${escapeAttr(icons.touchIcon)}">`);
  }
  if (icons.ogImage && !/<meta[^>]+property=["']?og:image/i.test(html)) {
    tags.push(`<meta property="og:image" content="${escapeAttr(icons.ogImage)}">`);
  }
  if (tags.length === 0) return html;
  const block = tags.join("");
  if (html.includes("</head>")) return html.replace("</head>", `${block}</head>`);
  return block + html;
}

/**
 * Technical SEO (d5) — inject canonical link + robots meta into <head> from the
 * Site's canonical columns. allowIndexing=false emits noindex,nofollow (the
 * staging opt-out). Skips any tag the page already declares.
 */
function injectSeoTags(
  html: string,
  seo: { canonicalUrl: string | null; allowIndexing: boolean },
): string {
  const tags: string[] = [];
  if (seo.canonicalUrl && !/<link[^>]+rel=["']?canonical/i.test(html)) {
    tags.push(`<link rel="canonical" href="${escapeAttr(seo.canonicalUrl)}">`);
  }
  if (!seo.allowIndexing && !/<meta[^>]+name=["']?robots/i.test(html)) {
    tags.push(`<meta name="robots" content="noindex,nofollow">`);
  }
  if (tags.length === 0) return html;
  const block = tags.join("");
  if (html.includes("</head>")) return html.replace("</head>", `${block}</head>`);
  return block + html;
}

/**
 * Free-plan badge (90-published): a small fixed "Made with Buildrick" pill linking
 * back to the marketing site. Injected only on FREE; paid plans ship clean.
 * Self-contained inline styles so it never depends on the page's CSS.
 */
function injectBadge(html: string, show: boolean): string {
  if (!show) return html;
  const badge =
    `<a href="https://buildrik.com?ref=badge" target="_blank" rel="noopener" ` +
    `style="position:fixed;bottom:12px;right:12px;z-index:2147483647;` +
    `display:inline-flex;align-items:center;gap:6px;padding:6px 10px;` +
    `background:#111;color:#fff;font:500 12px/1 sans-serif;` +
    `border-radius:999px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.2)">` +
    `Made with Buildrick</a>`;
  if (html.includes("</body>")) return html.replace("</body>", `${badge}</body>`);
  return html + badge;
}

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
  const files: VercelFile[] = pages.map((p) => ({
    file: p.path,
    data: injectBadge(injectSeoTags(injectHeadTags(injectAnalyticsBeacon(p.html, siteId), icons), seo), showBadge),
  }));

  // Technical SEO (d5): ship robots.txt — the site's custom rules if set, else a
  // sensible default driven by the indexing toggle.
  files.push({
    file: "robots.txt",
    data: site.robotsTxt?.trim()
      ? site.robotsTxt
      : `User-agent: *\n${site.allowIndexing ? "Allow: /" : "Disallow: /"}\n`,
  });

  // Step 0 — Generating pages: editor already rendered HTML; just mark done.
  await checkCancelled(jobId);
  await setStep(jobId, 0);

  // Step 1 — Optimizing images: skipped in MVP.
  await checkCancelled(jobId);
  await setStep(jobId, 1);

  // Step 2 — Deploying to CDN: delegate to service (handles OAuth connection gating).
  await checkCancelled(jobId);
  const projectName = slugifyProjectName(site.slug);
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

  // Step 4 — Performance check: skipped in MVP (Lighthouse comes later).
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
  return domain?.domain
    ? `https://${domain.domain}`
    : `https://${site?.slug ?? siteId}.buildrik.app`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
