import { type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@lib/prisma";
import { generatePage } from "@server/services/ai.service";

// AI site-generation worker. The dashboard creates an AIGenerationJob (QUEUED)
// and polls it — but nothing processed the queue, so the "AI is building your
// site" UI spun forever. This worker claims the job, generates each page via
// the AI service, writes a real Site + Pages, and marks the job COMPLETED.
//
// NOTE (smoke-test caveat): the generated content quality + per-section
// editing granularity should be verified against the live editor with real AI
// keys. Each AI section is stored as a <section> container whose innerHTML is
// the generated markup — the page renders as an editable draft.

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
      content: sec.html,
      children: [],
    })),
  } as Prisma.InputJsonValue;
}

async function uniqueSlug(base: string, workspaceId: string): Promise<string> {
  const root = slugify(base);
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i}`;
    const clash = await prisma.site.findFirst({ where: { workspaceId, slug: candidate }, select: { id: true } });
    if (!clash) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
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

  // Claim the job (QUEUED → BUILDING). Guard against a double-dispatch race.
  const claim = await prisma.aIGenerationJob.updateMany({
    where: { id: jobId, status: "QUEUED" },
    data: { status: "BUILDING", progress: 5 },
  });
  if (claim.count === 0) return new Response("Already claimed", { status: 409 });

  // generatePage takes a 3-value style; the job stores a richer `tone`. Map it.
  const tone = ((job.metadata as Record<string, unknown> | null)?.tone as string) ?? "";
  const safeStyle: "modern" | "minimal" | "bold" =
    tone === "minimal" ? "minimal" : tone === "bold" ? "bold" : "modern";
  const pages = job.selectedPages.length > 0 ? job.selectedPages : ["landing"];
  const description = job.description || job.businessType;

  console.log(`[ai-generate-worker] job=${jobId} pages=${pages.length} type=${job.businessType}`);

  try {
    const slug = await uniqueSlug(job.businessType, job.workspaceId);
    const site = await prisma.site.create({
      data: {
        name: job.businessType.slice(0, 100),
        slug,
        status: "DRAFT",
        workspaceId: job.workspaceId,
        createdBy: job.userId,
        creationMethod: "AI",
        pages: pages.length,
        lastEditedAt: new Date(),
      },
    });

    for (let i = 0; i < pages.length; i++) {
      const pageName = pages[i];
      const result = await generatePage({
        pageType: asPageType(pageName),
        description,
        style: safeStyle,
      });
      await prisma.page.create({
        data: {
          siteId: site.id,
          name: pageName,
          slug: i === 0 ? "home" : slugify(pageName),
          position: i,
          isHomePage: i === 0,
          blocks: sectionsToBlocks(result.sections),
        },
      });
      await prisma.aIGenerationJob.update({
        where: { id: jobId },
        data: { progress: Math.round(((i + 1) / pages.length) * 95) },
      });
    }

    await prisma.aIGenerationJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", progress: 100, siteId: site.id, completedAt: new Date(), error: null },
    });

    return Response.json({ ok: true, siteId: site.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    console.error(`[ai-generate-worker] job=${jobId} failed:`, message);
    await prisma.aIGenerationJob.update({
      where: { id: jobId },
      data: { status: "FAILED", error: message.slice(0, 500) },
    });
    return new Response("Generation failed", { status: 500 });
  }
}
