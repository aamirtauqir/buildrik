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

/**
 * C1: the component browser. Every distinct component master across the agency's
 * workspace, with how many sites carry it ("used on N sites"). A master shared
 * across sites is one SiteComponent row per site (unique [siteId, componentId]),
 * so the row count per componentId == the site count. Workspace-scoped (the
 * caller's workspace is supplied from the session, never client input).
 */
export async function listWorkspaceComponents(
  workspaceId: string
): Promise<Array<{ componentId: string; name: string; siteCount: number; updatedAt: Date }>> {
  const rows = await prisma.siteComponent.findMany({
    where: { site: { workspaceId, deletedAt: null } },
    select: { componentId: true, name: true, updatedAt: true },
  });
  const byId = new Map<
    string,
    { componentId: string; name: string; siteCount: number; updatedAt: Date }
  >();
  for (const r of rows) {
    const e = byId.get(r.componentId);
    if (e) {
      e.siteCount++;
      if (r.updatedAt > e.updatedAt) {
        e.updatedAt = r.updatedAt;
        e.name = r.name;
      }
    } else {
      byId.set(r.componentId, {
        componentId: r.componentId,
        name: r.name,
        siteCount: 1,
        updatedAt: r.updatedAt,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

/**
 * C1 jump-to + C3 blast-radius: which sites in the workspace carry a given
 * component master. Powers "used on N sites" with a drill-down, and "editing this
 * master affects these N sites — preview before propagate". Workspace-scoped.
 */
/**
 * P6 shared library: rename a component master across the whole workspace. A
 * master is one SiteComponent row per site (unique [siteId, componentId]), so
 * the "master name" is renamed on every site that carries it, in one write.
 * Workspace-scoped (never client-supplied) so a crafted componentId can't touch
 * another agency's components. Returns how many site-rows were renamed.
 */
export async function renameWorkspaceComponent(
  workspaceId: string,
  componentId: string,
  name: string
): Promise<{ updated: number }> {
  const res = await prisma.siteComponent.updateMany({
    where: { componentId, site: { workspaceId, deletedAt: null } },
    data: { name },
  });
  return { updated: res.count };
}

/**
 * P6 shared library: delete a component master from the whole workspace —
 * removes it from every site that carries it. Destructive and confirmed at the
 * UI (the library surfaces "used on N sites" first). Workspace-scoped. Returns
 * how many site-rows were removed.
 */
export async function deleteWorkspaceComponent(
  workspaceId: string,
  componentId: string
): Promise<{ deleted: number }> {
  const res = await prisma.siteComponent.deleteMany({
    where: { componentId, site: { workspaceId, deletedAt: null } },
  });
  return { deleted: res.count };
}

export async function getComponentUsage(
  workspaceId: string,
  componentId: string
): Promise<{
  componentId: string;
  siteCount: number;
  sites: Array<{ siteId: string; siteName: string; updatedAt: Date }>;
}> {
  const rows = await prisma.siteComponent.findMany({
    where: { componentId, site: { workspaceId, deletedAt: null } },
    orderBy: { updatedAt: "desc" },
    select: { siteId: true, updatedAt: true, site: { select: { name: true } } },
  });
  return {
    componentId,
    siteCount: rows.length,
    sites: rows.map((r) => ({ siteId: r.siteId, siteName: r.site.name, updatedAt: r.updatedAt })),
  };
}
