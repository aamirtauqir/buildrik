import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@lib/prisma";
import { generatePage } from "@server/services/ai.service";
import { rewriteImageSources, type ImagesPreference } from "@lib/ai/rewrite-image-sources";

// AI site-generation worker. The dashboard creates an AIGenerationJob (QUEUED)
// and polls it — but nothing processed the queue, so the "AI is building your
// site" UI spun forever. This worker claims the job, generates each page via
// the AI service, writes a real Site + Pages, and marks the job COMPLETED.
//
// Status vocabulary matches the wizard's checklist exactly
// (GENERATING_STRUCTURE → GENERATING_CONTENT → GENERATING_STYLES): the UI
// used to expect these while the worker only ever wrote BUILDING, so every
// step flipped from pending to done in a single jump at the end.
//
// Write-at-end design: all AI calls happen BEFORE any Site/Page row exists,
// then one transaction persists site + pages + the COMPLETED flip. A crash
// mid-generation leaves no orphan half-built site, and a cancellation
// (checked between AI calls and again inside the transaction) means no site
// row and no consumed quota — cancelled jobs are excluded from the monthly
// count in ai-generation.service.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_PAGE_TYPES = ["landing", "portfolio", "product", "pricing", "blog"] as const;
type PageType = (typeof VALID_PAGE_TYPES)[number];

function asPageType(name: string): PageType {
  const n = name.toLowerCase();
  return (VALID_PAGE_TYPES as readonly string[]).includes(n) ? (n as PageType) : "landing";
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "page";
}

/** Wrap generated HTML sections into a Page.blocks root (ElementData). */
function sectionsToBlocks(sections: Array<{ type: string; html: string }>): Prisma.InputJsonValue {
  return {
    id: "root",
    type: "container",
    tagName: "div",
    classes: ["buildrick-page-root"],
    children: sections.map((sec, i) => ({
      id: `ai-${sec.type}-${i}`,
      type: "container",
      tagName: "section",
      classes: [`ai-section-${sec.type}`],
      // Whole generated sections are markup, not text. Without this the export
      // path escapes them and the published site shows angle brackets.
      contentFormat: "html" as const,
      content: sec.html,
      children: [],
    })),
  } as Prisma.InputJsonValue;
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base);
  // Site.slug is GLOBALLY unique (not per-workspace), so the check must be
  // global too — the old per-workspace findFirst could pass and then hit a
  // P2002 on create. One query for all root-prefixed slugs instead of up to
  // 50 sequential lookups.
  const taken = new Set(
    (await prisma.site.findMany({ where: { slug: { startsWith: root } }, select: { slug: true } })).map((s) => s.slug),
  );
  if (!taken.has(root)) return root;
  for (let i = 1; i < 50; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

class CancelledError extends Error {
  constructor() {
    super("CANCELLED");
    this.name = "CancelledError";
  }
}

async function assertNotCancelled(jobId: string): Promise<void> {
  const current = await prisma.aIGenerationJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (current?.status === "CANCELLED") throw new CancelledError();
}

/** Advance status/progress, but never resurrect a CANCELLED job. */
async function setPhase(jobId: string, status: string, progress: number): Promise<void> {
  const updated = await prisma.aIGenerationJob.updateMany({
    where: { id: jobId, status: { not: "CANCELLED" } },
    data: { status, progress },
  });
  if (updated.count === 0) throw new CancelledError();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  if (req.headers.get("x-worker-secret") !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;
  const job = await prisma.aIGenerationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== "QUEUED") {
    return new Response("Job not found or not QUEUED", { status: 400 });
  }

  // Claim the job (QUEUED → GENERATING_STRUCTURE). Guards double-dispatch.
  const claim = await prisma.aIGenerationJob.updateMany({
    where: { id: jobId, status: "QUEUED" },
    data: { status: "GENERATING_STRUCTURE", progress: 5 },
  });
  if (claim.count === 0) return new Response("Already claimed", { status: 409 });

  // generatePage takes a 3-value style; the job stores a richer `tone`. Map it.
  const meta = job.metadata as Record<string, unknown> | null;
  const tone = (meta?.tone as string) ?? "";
  // Prefer the name the user typed; older jobs (no name in metadata) fall back
  // to a title-cased businessType instead of the raw "BUSINESS" enum.
  const siteName = (
    (meta?.name as string)?.trim() ||
    job.businessType.charAt(0) + job.businessType.slice(1).toLowerCase()
  ).slice(0, 100);
  const safeStyle: "modern" | "minimal" | "bold" =
    tone === "minimal" ? "minimal" : tone === "bold" ? "bold" : "modern";
  const pages = job.selectedPages.length > 0 ? job.selectedPages : ["landing"];
  const description = job.description || job.businessType;
  // "placeholders" (labelled grey boxes) is the safe default when unset.
  const imagesPref = ((meta?.images as ImagesPreference) ?? "placeholders") satisfies ImagesPreference;

  console.log(`[ai-generate-worker] job=${jobId} pages=${pages.length} type=${job.businessType}`);

  try {
    // Structure phase: resolve the site shell (slug) before content runs.
    const slug = await uniqueSlug(siteName);

    // Content phase: every AI call happens before any Site/Page write.
    await setPhase(jobId, "GENERATING_CONTENT", 10);
    const generated: Array<{ name: string; blocks: Prisma.InputJsonValue }> = [];
    for (let i = 0; i < pages.length; i++) {
      await assertNotCancelled(jobId);
      const pageName = pages[i];
      const result = await generatePage({
        pageType: asPageType(pageName),
        description,
        style: safeStyle,
      });
      const withImages = result.sections.map((s) => ({ ...s, html: rewriteImageSources(s.html, imagesPref) }));
      generated.push({ name: pageName, blocks: sectionsToBlocks(withImages) });
      await setPhase(jobId, "GENERATING_CONTENT", 10 + Math.round(((i + 1) / pages.length) * 70));
    }

    // Styles/assembly phase: persist everything atomically. The job flip
    // rides inside the same transaction with a CANCELLED guard — a
    // last-moment cancel rolls the whole site back instead of being
    // overwritten by COMPLETED.
    await setPhase(jobId, "GENERATING_STYLES", 85);
    const siteId = await prisma.$transaction(async (tx) => {
      const site = await tx.site.create({
        data: {
          name: siteName,
          slug,
          status: "DRAFT",
          workspaceId: job.workspaceId,
          createdBy: job.userId,
          creationMethod: "AI",
          pages: pages.length,
          lastEditedAt: new Date(),
        },
      });
      await tx.page.createMany({
        data: generated.map((g, i) => ({
          siteId: site.id,
          name: g.name,
          slug: i === 0 ? "home" : slugify(g.name),
          position: i,
          isHomePage: i === 0,
          blocks: g.blocks,
        })),
      });
      const flipped = await tx.aIGenerationJob.updateMany({
        where: { id: jobId, status: { not: "CANCELLED" } },
        data: { status: "COMPLETED", progress: 100, siteId: site.id, completedAt: new Date(), error: null },
      });
      if (flipped.count === 0) throw new CancelledError();
      return site.id;
    });

    return Response.json({ ok: true, siteId });
  } catch (err) {
    if (err instanceof CancelledError) {
      console.log(`[ai-generate-worker] job=${jobId} cancelled`);
      return new Response("Cancelled", { status: 200 });
    }
    const message = err instanceof Error ? err.message : "AI generation failed";
    console.error(`[ai-generate-worker] job=${jobId} failed:`, message);
    await prisma.aIGenerationJob.updateMany({
      where: { id: jobId, status: { not: "CANCELLED" } },
      data: { status: "FAILED", error: message.slice(0, 500) },
    });
    return new Response("Generation failed", { status: 500 });
  }
}
