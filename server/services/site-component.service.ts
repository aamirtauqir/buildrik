/**
 * Site component-master service (#4/27, 2026-06-24). Server persistence behind
 * the editor's ComponentManager (which keeps the local IndexedDB cache).
 * Upsert-on-(siteId, componentId) so a re-mirror is idempotent; list returns
 * metadata only; get returns the payload for hydrate/restore. No prune —
 * components are deliberate, low-churn artifacts (unlike auto-versioning).
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import type { UpsertSiteComponentInput } from "@buildrik/shared/schemas/site-component";

export async function upsertSiteComponent(
  input: UpsertSiteComponentInput
): Promise<{ componentId: string }> {
  const row = await prisma.siteComponent.upsert({
    where: { siteId_componentId: { siteId: input.siteId, componentId: input.componentId } },
    create: {
      siteId: input.siteId,
      componentId: input.componentId,
      name: input.name,
      payload: input.payload as never,
      createdBy: input.createdBy ?? null,
    },
    update: {
      name: input.name,
      payload: input.payload as never,
    },
  });
  return { componentId: row.componentId };
}

export async function listSiteComponents(siteId: string) {
  return prisma.siteComponent.findMany({
    where: { siteId },
    orderBy: { updatedAt: "desc" },
    select: { componentId: true, name: true, createdBy: true, createdAt: true, updatedAt: true },
  });
}

export async function getSiteComponent(siteId: string, componentId: string): Promise<unknown | null> {
  const row = await prisma.siteComponent.findUnique({
    where: { siteId_componentId: { siteId, componentId } },
    select: { payload: true },
  });
  return row?.payload ?? null;
}

export async function deleteSiteComponent(
  siteId: string,
  componentId: string
): Promise<{ ok: true }> {
  // deleteMany so a missing row is a no-op, not a P2025 throw (the editor
  // mirror fires delete best-effort).
  await prisma.siteComponent.deleteMany({ where: { siteId, componentId } });
  return { ok: true };
}
