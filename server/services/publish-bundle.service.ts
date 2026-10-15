/**
 * The publish bundle (CEO D11) and the post-deploy forms switch-over (A3, O3,
 * O4, O5).
 *
 * A bundle is the exact files a publish ships — after every transform (forms
 * wiring, runtimes, head tags, badge, sitemap, vercel.json). It is built once,
 * hashed, checked, deployed, and stored on the job; a rollback redeploys the
 * stored bytes. Until now the job kept only the input pages and the worker
 * re-applied every transform from today's database, so the settings checked
 * were not the settings shipped and a rollback shipped neither.
 *
 * Forms switch over only once the deploy is live. They were recorded before
 * the deploy, so a failed or cancelled deploy still left the new forms
 * accepting entries and the old ones switched off.
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { DiscoveredForm } from "@/lib/publish-forms";
import { recordPublishedForms } from "@/server/services/form-submission.service";
import { applyPublishedPassword } from "@/server/services/publish.service";
import { decryptPublishedPassword } from "@/server/services/site-settings.service";
import { resolveVercelProjectName } from "@/lib/vercel";

export interface BundleFile {
  file: string;
  data: string;
}

export interface Bundle {
  files: BundleFile[];
}

export interface FormsPlan {
  forms: DiscoveredForm[];
  deactivateMissing: boolean;
}

/** sha256 over every file, in path order: the same files give the same hash. */
export function bundleHash(files: readonly BundleFile[]): string {
  const h = createHash("sha256");
  for (const f of [...files].sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0))) {
    h.update(f.file);
    h.update("\0");
    h.update(f.data);
    h.update("\0");
  }
  return h.digest("hex");
}

/**
 * What the shipped files themselves must satisfy — read off the bundle, not
 * the database, so what is checked is what deploys. Empty = fine.
 */
export function checkBundle(files: readonly BundleFile[]): string[] {
  const reasons: string[] = [];
  const pages = files.filter((f) => f.file.endsWith(".html"));
  if (pages.length === 0) reasons.push("There are no pages to publish.");
  else if (!files.some((f) => f.file === "index.html")) reasons.push("There is no home page (index.html).");
  /* A `blob:` URL exists only in the tab that made it (BK-42). */
  const sessionUrls = pages.filter((f) => /\bblob:/i.test(f.data)).map((f) => f.file);
  if (sessionUrls.length > 0) {
    reasons.push(`An image on ${sessionUrls.join(", ")} was never uploaded (it points at this browser only).`);
  }
  return reasons;
}

const FORMS_RETRY_LIMIT = 3;

export type FormsOutcome = "ACTIVE" | "PENDING" | "FAILED" | "SUPERSEDED" | null;

/**
 * Apply a completed job's forms plan — only while that job is still what is
 * live (O3): a retry of an older job never switches the newer one's forms
 * off. Idempotent; a failure stays PENDING for the cron until the third
 * attempt, then FAILED with its error (O5).
 */
export async function activatePublishedForms(jobId: string): Promise<FormsOutcome> {
  const job = await prisma.publishBuildJob.findUnique({
    where: { id: jobId },
    select: { id: true, siteId: true, status: true, formsPlan: true, formsAttempts: true },
  });
  if (!job || job.status !== "COMPLETED" || !job.formsPlan) return null;

  const live = await prisma.publishBuildJob.findFirst({
    where: { siteId: job.siteId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    select: { id: true },
  });
  if (live?.id !== job.id) {
    await prisma.publishBuildJob.update({ where: { id: jobId }, data: { formsStatus: "SUPERSEDED" } });
    return "SUPERSEDED";
  }

  const plan = job.formsPlan as unknown as FormsPlan;
  try {
    /* O4: an empty plan that may deactivate is real work — the last form
       removed from the site — and is recorded like any other. */
    await recordPublishedForms(job.siteId, plan.forms, plan.deactivateMissing);
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { formsStatus: "ACTIVE", formsError: null, formsAttempts: { increment: 1 } },
    });
    return "ACTIVE";
  } catch (e) {
    const attempts = job.formsAttempts + 1;
    const status = attempts >= FORMS_RETRY_LIMIT ? "FAILED" : "PENDING";
    await prisma.publishBuildJob.update({
      where: { id: jobId },
      data: { formsStatus: status, formsError: e instanceof Error ? e.message : String(e), formsAttempts: attempts },
    });
    return status;
  }
}

/** O5: activation left PENDING (a worker that died after COMPLETED, a failed
 *  attempt) is picked up again after `olderThanMs`. */
export async function recoverPendingForms(olderThanMs = 2 * 60_000): Promise<number> {
  const stale = await prisma.publishBuildJob.findMany({
    where: { formsStatus: "PENDING", completedAt: { lt: new Date(Date.now() - olderThanMs) } },
    select: { id: true },
    take: 50,
  });
  for (const { id } of stale) await activatePublishedForms(id);
  return stale.length;
}

/** "Retry form update" (decision 7): the user's own retry of a FAILED switch-over. */
export async function retryFormsActivation(siteId: string, jobId: string): Promise<FormsOutcome> {
  const job = await prisma.publishBuildJob.findFirst({ where: { id: jobId, siteId }, select: { id: true } });
  if (!job) throw new Error("NOT_FOUND");
  await prisma.publishBuildJob.update({ where: { id: jobId }, data: { formsAttempts: 0 } });
  return activatePublishedForms(jobId);
}

/**
 * O6: re-run the step that failed after a deployment went live (today: the
 * password protection) — never a redeploy. Clears the job's post-deploy error
 * once it lands.
 */
export async function retryPostDeployStep(siteId: string, jobId: string): Promise<void> {
  const job = await prisma.publishBuildJob.findFirst({
    where: { id: jobId, siteId, status: "COMPLETED", failedPhase: "post-deploy" },
    select: { id: true, workspaceId: true, site: { select: { slug: true, vercelProjectName: true, name: true, publishedPassword: true } } },
  });
  if (!job) throw new Error("NOT_FOUND");
  await applyPublishedPassword(
    job.workspaceId,
    resolveVercelProjectName(job.site),
    decryptPublishedPassword(job.site.publishedPassword),
  );
  await prisma.publishBuildJob.update({ where: { id: jobId }, data: { failedPhase: null, error: null } });
}
