/**
 * Site component-master service (#4/27, 2026-06-24). Server persistence behind
 * the editor's ComponentManager (which keeps the local IndexedDB cache).
 * Upsert-on-(siteId, componentId) so a re-mirror is idempotent; list returns
 * metadata only; get returns the payload for hydrate/restore. No prune —
 * components are deliberate, low-churn artifacts (unlike auto-versioning).
 *
 * Trash (design-2l9 K18–K20): a delete sets `deletedAt` and keeps the row for
 * 30 days (component-trash.service.ts lists, restores and purges it). Every
 * read here is of LIVE masters and filters `deletedAt: null`.
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import { sanitizeComponentPayload } from "@/lib/sanitize-blocks";
import { Prisma } from "@prisma/client";
import type { ComponentTrashInfo, UpsertSiteComponentInput } from "@buildrik/shared/schemas/site-component";
import { siteScopeWhere } from "@/server/services/permission.service";

export async function upsertSiteComponent(
  input: UpsertSiteComponentInput
): Promise<{ componentId: string; updatedAt: Date }> {
  // "This page" scope must name a page of THIS site.
  const pageId = input.pageId ?? null;
  if (pageId) {
    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { siteId: true } });
    if (!page || page.siteId !== input.siteId) throw new Error("PAGE_NOT_FOUND");
  }
  // Masters are shared across the workspace and rendered on the canvas.
  const payload = sanitizeComponentPayload(input.payload);
  const row = await prisma.siteComponent.upsert({
    where: { siteId_componentId: { siteId: input.siteId, componentId: input.componentId } },
    create: {
      siteId: input.siteId,
      componentId: input.componentId,
      name: input.name,
      payload: payload as never,
      pageId,
      createdBy: input.createdBy ?? null,
    },
    // Saving a master again takes it out of the trash: an Undo of a delete
    // re-registers the master through this same upsert.
    update: {
      name: input.name,
      payload: payload as never,
      pageId,
      deletedAt: null,
      deletedById: null,
      trash: Prisma.DbNull,
    },
  });
  // updatedAt: the editor stamps its local copy with the SERVER's clock (C-4).
  return { componentId: row.componentId, updatedAt: row.updatedAt };
}

export async function listSiteComponents(siteId: string) {
  return prisma.siteComponent.findMany({
    where: { siteId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: { componentId: true, name: true, pageId: true, createdBy: true, createdAt: true, updatedAt: true },
  });
}

export async function getSiteComponent(siteId: string, componentId: string): Promise<unknown | null> {
  const row = await prisma.siteComponent.findFirst({
    where: { siteId, componentId, deletedAt: null },
    select: { payload: true },
  });
  return row?.payload ?? null;
}

/**
 * Move a master to "Recently deleted". `trash` is what the editor's delete
 * detached (instance links + fingerprints), for the restore to re-link.
 * updateMany so a missing or already-trashed row is a no-op, not a throw
 * (the editor mirror fires delete best-effort, and retries).
 */
export async function deleteSiteComponent(
  siteId: string,
  componentId: string,
  deletedById: string | null,
  trash?: ComponentTrashInfo
): Promise<{ ok: true }> {
  await prisma.siteComponent.updateMany({
    where: { siteId, componentId, deletedAt: null },
    data: { deletedAt: new Date(), deletedById, trash: trash ? (trash as never) : Prisma.DbNull },
  });
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
  workspaceId: string,
  userId: string
): Promise<Array<{ componentId: string; name: string; siteCount: number; updatedAt: Date }>> {
  // S-9: a member scoped to specific sites must never see components from a
  // site outside their grant, or have its usage counted in "used on N sites".
  const scope = await siteScopeWhere(prisma, userId, workspaceId);
  const rows = await prisma.siteComponent.findMany({
    where: { deletedAt: null, site: { workspaceId, deletedAt: null, ...scope } },
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
    where: { componentId, deletedAt: null, site: { workspaceId, deletedAt: null } },
    data: { name },
  });
  return { updated: res.count };
}

/**
 * P6 shared library: delete a component master from the whole workspace —
 * moves it to every carrying site's "Recently deleted" (30 days). Confirmed
 * at the UI (the library surfaces "used on N sites" first). Workspace-scoped.
 * Returns how many site-rows were trashed. No detach record: the dashboard
 * has no document to detach in.
 */
export async function deleteWorkspaceComponent(
  workspaceId: string,
  componentId: string,
  deletedById: string | null
): Promise<{ deleted: number }> {
  const res = await prisma.siteComponent.updateMany({
    where: { componentId, deletedAt: null, site: { workspaceId, deletedAt: null } },
    data: { deletedAt: new Date(), deletedById, trash: Prisma.DbNull },
  });
  return { deleted: res.count };
}

/**
 * FROM LIBRARY (board 4418:99857) / LINKED FROM LIBRARY (board 4418:142419):
 * the workspace's shared component library, as seen from one site. A master
 * is "in the library" when a SITE-scoped copy of it lives on another site of
 * the same workspace (the existing model: one SiteComponent row per site that
 * carries it). `onThisSite` marks the ones already linked here. Page-scoped
 * masters are never shared. The workspace is the SITE's, never client input.
 */
export async function listComponentLibrary(siteId: string, userId: string): Promise<
  Array<{ componentId: string; name: string; siteCount: number; onThisSite: boolean; updatedAt: Date }>
> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  /* BK-08: only the sites this member may open — a member scoped to one site
     read the masters of every site in the workspace. */
  const scope = await siteScopeWhere(prisma, userId, site.workspaceId);
  const rows = await prisma.siteComponent.findMany({
    where: { pageId: null, deletedAt: null, site: { workspaceId: site.workspaceId, deletedAt: null, ...scope } },
    select: { componentId: true, name: true, siteId: true, updatedAt: true },
  });
  const byId = new Map<string, { componentId: string; name: string; sites: Set<string>; updatedAt: Date }>();
  for (const r of rows) {
    const e = byId.get(r.componentId);
    if (!e) {
      byId.set(r.componentId, { componentId: r.componentId, name: r.name, sites: new Set([r.siteId]), updatedAt: r.updatedAt });
      continue;
    }
    e.sites.add(r.siteId);
    if (r.updatedAt > e.updatedAt) {
      e.updatedAt = r.updatedAt;
      e.name = r.name;
    }
  }
  return [...byId.values()]
    .filter((e) => [...e.sites].some((id) => id !== siteId))
    .map((e) => ({
      componentId: e.componentId,
      name: e.name,
      siteCount: e.sites.size,
      onThisSite: e.sites.has(siteId),
      updatedAt: e.updatedAt,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The newest site-scoped copy of a library master in the site's workspace —
 *  what "insert from library" brings onto this site. Null if not in it. */
export async function getLibraryComponent(siteId: string, componentId: string, userId: string): Promise<unknown | null> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  if (!site) throw new Error("SITE_NOT_FOUND");
  const scope = await siteScopeWhere(prisma, userId, site.workspaceId);
  const row = await prisma.siteComponent.findFirst({
    where: { componentId, pageId: null, deletedAt: null, site: { workspaceId: site.workspaceId, deletedAt: null, ...scope } },
    orderBy: { updatedAt: "desc" },
    select: { payload: true },
  });
  return row?.payload ?? null;
}
