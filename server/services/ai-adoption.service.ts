import { prisma } from "@/lib/prisma";
import type { AiAdoptionInput } from "@buildrik/shared/schemas/ai-adoption";
import {
  summarizeAdoptionRows,
  type AiAdoptionSummary,
} from "./ai-adoption.summary";

/**
 * Persist one AI adoption event. Resolves the site's workspace and verifies the
 * actor is a member of it (capability scope — a user can only log against a site
 * they belong to). Like activity logging, this must NEVER throw into the edit
 * path: any failure is swallowed.
 */
export async function recordAiAdoption(
  actorId: string,
  input: AiAdoptionInput,
): Promise<void> {
  try {
    const site = await prisma.site.findUnique({
      where: { id: input.siteId },
      select: { workspaceId: true },
    });
    if (!site) return;

    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: site.workspaceId, userId: actorId },
      select: { id: true },
    });
    if (!member) return;

    const { siteId, event, surface, model, ...metrics } = input;
    await prisma.aiAdoptionEvent.create({
      data: {
        workspaceId: site.workspaceId,
        siteId,
        actorId,
        event,
        surface: surface ?? null,
        model: model ?? null,
        metadata: Object.keys(metrics).length ? (metrics as object) : undefined,
      },
    });
  } catch {
    // Adoption telemetry must never crash the editing path.
  }
}

/**
 * Aggregate the task-level adoption signals for a workspace. This is what the
 * STOP-AND-MEASURE gate reads: which jobs users actually run (commandFrequency /
 * bySurface), whether they keep AI edits (revertRate), and whether they accept
 * agent steps (agent.acceptanceRate). Fetch + delegate to the pure summarizer.
 */
export async function getAiAdoptionSummary(
  workspaceId: string,
  sinceDays = 30,
): Promise<AiAdoptionSummary> {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const rows = await prisma.aiAdoptionEvent.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    select: { event: true, surface: true, metadata: true },
  });
  return summarizeAdoptionRows(rows, sinceDays);
}
