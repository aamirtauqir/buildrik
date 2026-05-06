import { prisma } from "@/lib/prisma";
import type { PrePublishChecksResult, PublishPage } from "@buildrik/shared/schemas/publish";
import { notifyWorkspaceOwner } from "@/server/services/notification.trigger";

export async function runPrePublishChecks(siteId: string): Promise<PrePublishChecksResult> {
  const [pageCount, site, domain, emptyPages] = await Promise.all([
    prisma.page.count({ where: { siteId } }),
    prisma.site.findUnique({
      where: { id: siteId },
      select: { metaTitleTemplate: true, touchIcon: true },
    }),
    prisma.domain.findFirst({
      where: { siteId, status: "VERIFIED" },
    }),
    prisma.page.findMany({
      where: { siteId, blocks: { equals: [] } },
      select: { id: true, name: true },
    }),
  ]);

  const checks: PrePublishChecksResult["checks"] = [];

  // Pages ready
  if (pageCount === 0) {
    checks.push({ label: "Pages ready", status: "fail", detail: "No pages found. Add at least one page before publishing." });
  } else {
    checks.push({ label: "Pages ready", status: "pass", detail: `${pageCount} page${pageCount > 1 ? "s" : ""} ready to publish.` });
  }

  // SEO configured
  if (!site?.metaTitleTemplate) {
    checks.push({ label: "SEO configured", status: "warning", detail: "No meta title template set. Search engines may not index your site properly." });
  } else {
    checks.push({ label: "SEO configured", status: "pass", detail: "Meta title template is configured." });
  }

  // Domain connected
  if (domain) {
    checks.push({ label: "Domain connected", status: "pass", detail: `Connected to ${domain.domain}.` });
  } else {
    checks.push({ label: "Domain connected", status: "warning", detail: "No verified domain. Your site will use a buildrik.com subdomain." });
  }

  // Empty pages
  if (emptyPages.length > 0) {
    checks.push({ label: "Empty pages", status: "warning", detail: `${emptyPages.length} page${emptyPages.length > 1 ? "s have" : " has"} no content blocks.` });
  } else {
    checks.push({ label: "Empty pages", status: "pass", detail: "All pages have content." });
  }

  // Favicon
  if (!site?.touchIcon) {
    checks.push({ label: "Favicon", status: "warning", detail: "No favicon set. Browsers will show a default icon." });
  } else {
    checks.push({ label: "Favicon", status: "pass", detail: "Favicon is configured." });
  }

  const hasFail = checks.some((c) => c.status === "fail");
  return { ready: !hasFail, checks };
}

export async function startPublish(
  siteId: string,
  workspaceId: string,
  userId: string,
  pages?: PublishPage[],
) {
  const existing = await prisma.publishBuildJob.findFirst({
    where: { siteId, status: { in: ["QUEUED", "BUILDING", "DEPLOYING"] } },
  });
  if (existing) {
    throw new Error("ALREADY_PUBLISHING");
  }

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { name: true },
  });

  // Persist HTML payload (if provided) on the job so the worker can deploy
  // without re-fetching from the editor. `log` is an existing Json column.
  // Pages omitted = worker falls back to dev simulation (current behavior).
  const job = await prisma.publishBuildJob.create({
    data: {
      siteId,
      workspaceId,
      status: "QUEUED",
      progress: 0,
      steps: [],
      log: pages ? { pages } : undefined,
    },
  });

  await prisma.site.update({
    where: { id: siteId },
    data: { status: "PUBLISHING", lastPublishedBy: userId },
  });

  notifyWorkspaceOwner(
    workspaceId,
    "SITE_PUBLISHED",
    `Site "${site?.name ?? "Untitled"}" publish started`,
    `/dashboard/sites/${siteId}`,
  ).catch(() => {});

  // Fire-and-forget: kick off the publish pipeline worker
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/workers/publish/${job.id}`, {
    method: "POST",
    headers: { "x-worker-secret": process.env.CRON_SECRET ?? "" },
  }).catch(() => {});

  return job;
}

export async function getPublishStatus(jobId: string) {
  return prisma.publishBuildJob.findUnique({ where: { id: jobId } });
}

export async function cancelPublish(jobId: string) {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job || !["QUEUED", "BUILDING"].includes(job.status)) {
    throw new Error("NOT_CANCELLABLE");
  }
  const [updated] = await prisma.$transaction([
    prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "CANCELLED" },
    }),
    prisma.site.update({
      where: { id: job.siteId },
      data: { status: "DRAFT" },
    }),
  ]);
  return updated;
}

export async function completePublish(jobId: string, publicUrl: string) {
  const job = await prisma.publishBuildJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("JOB_NOT_FOUND");

  const [updated] = await prisma.$transaction([
    prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: new Date() },
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

  return updated;
}

export async function unpublishSite(siteId: string) {
  return prisma.site.update({
    where: { id: siteId },
    data: { status: "DRAFT", publishedUrl: null },
  });
}
