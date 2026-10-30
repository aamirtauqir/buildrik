import { prisma } from "@/lib/prisma";
import { checkSiteRole } from "@/server/services/permission.service";
import {
  COMPONENT_TRASH_RETENTION_DAYS,
  componentTrashInfoSchema,
  type ComponentTrashInfo,
  type PurgeComponentsInput,
  type RestoreComponentsInput,
  type TrashedComponent,
} from "@buildrik/shared/schemas/site-component";

/**
 * Component trash — "Recently deleted" in the Components panel (design-2l9
 * K18 217:42047, K19 217:41750, K20 217:42370, K42 228:46627). The page-trash
 * pattern: a deleted master keeps its row with `deletedAt` set
 * (`deleteSiteComponent` / `deleteWorkspaceComponent`), and every read of live
 * masters filters `deletedAt: null`. No key rewrite: the (siteId, componentId)
 * key is the engine's generated id, and bringing that id back is the restore.
 *
 * Same owner decisions as page trash (2026-10-30): kept 30 days; EDITOR+ may
 * list and restore; permanent delete is ADMIN (typed DELETE on the board).
 */

export class ComponentTrashError extends Error {
  constructor(public code: "NOT_FOUND", message: string) {
    super(message);
    this.name = "ComponentTrashError";
  }
}

const RETENTION_MS = COMPONENT_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** A stored `trash` value, or null when it is missing or not the shape. */
function readTrash(value: unknown): ComponentTrashInfo | null {
  const parsed = componentTrashInfoSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** The site's trashed masters still inside the retention window, newest first. */
export async function listComponentTrash(userId: string, siteId: string): Promise<TrashedComponent[]> {
  await checkSiteRole(prisma, userId, siteId, "EDITOR");
  const rows = await prisma.siteComponent.findMany({
    where: { siteId, deletedAt: { gte: new Date(Date.now() - RETENTION_MS) } },
    orderBy: { deletedAt: "desc" },
    select: { componentId: true, name: true, deletedAt: true, deletedById: true, trash: true },
  });
  if (rows.length === 0) return [];

  const deleterIds = [...new Set(rows.map((r) => r.deletedById).filter((id): id is string => !!id))];
  const users = deleterIds.length
    ? await prisma.user.findMany({ where: { id: { in: deleterIds } }, select: { id: true, fullName: true, displayName: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.displayName || u.fullName || null]));

  return rows.map((r) => {
    const trash = readTrash(r.trash);
    return {
      componentId: r.componentId,
      name: r.name,
      deletedAt: r.deletedAt as Date,
      deletedBy: r.deletedById
        ? { id: r.deletedById, name: nameById.get(r.deletedById) ?? null, isYou: r.deletedById === userId }
        : null,
      detached: trash ? { instances: trash.instances.length, pages: trash.pageCount } : null,
    };
  });
}

/**
 * Bring trashed masters back. Answers each one's definition and what its
 * delete detached, for the editor to re-register the master and re-link the
 * instances nobody changed since. Ids no longer in the trash are skipped;
 * none at all is NOT_FOUND.
 */
export async function restoreComponents(
  userId: string,
  input: RestoreComponentsInput
): Promise<Array<{ componentId: string; payload: unknown; trash: ComponentTrashInfo | null }>> {
  await checkSiteRole(prisma, userId, input.siteId, "EDITOR");
  const rows = await prisma.siteComponent.findMany({
    where: { siteId: input.siteId, componentId: { in: input.componentIds }, deletedAt: { not: null } },
    select: { componentId: true, payload: true, trash: true },
  });
  if (rows.length === 0) throw new ComponentTrashError("NOT_FOUND", "These components are no longer in Recently deleted.");
  await prisma.siteComponent.updateMany({
    where: { siteId: input.siteId, componentId: { in: rows.map((r) => r.componentId) }, deletedAt: { not: null } },
    data: { deletedAt: null, deletedById: null },
  });
  return rows.map((r) => ({ componentId: r.componentId, payload: r.payload, trash: readTrash(r.trash) }));
}

/** Delete trashed masters for good (ADMIN; the schema demands the typed DELETE). */
export async function purgeComponents(userId: string, input: PurgeComponentsInput): Promise<{ deleted: number }> {
  await checkSiteRole(prisma, userId, input.siteId, "ADMIN");
  const res = await prisma.siteComponent.deleteMany({
    where: { siteId: input.siteId, componentId: { in: input.componentIds }, deletedAt: { not: null } },
  });
  if (res.count === 0) throw new ComponentTrashError("NOT_FOUND", "These components are no longer in Recently deleted.");
  return { deleted: res.count };
}

/** Retention purge (cron): trashed masters older than the window. */
export async function purgeExpiredComponentTrash(now: Date = new Date()): Promise<{ deleted: number }> {
  const res = await prisma.siteComponent.deleteMany({
    where: { deletedAt: { not: null, lt: new Date(now.getTime() - RETENTION_MS) } },
  });
  return { deleted: res.count };
}
