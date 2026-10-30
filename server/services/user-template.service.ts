/**
 * "My Templates" service (#13/25, 2026-06-24). Server persistence behind the
 * editor's local save-as-template (localStorage MY_TEMPLATES). Workspace-scoped
 * (resolved from the editing site) so an agency's saved templates are reusable
 * across its client sites. list returns html (templates are few + low-churn,
 * unlike version snapshots).
 *
 * @license BSD-3-Clause
 */
import { prisma } from "@/lib/prisma";
import { sanitizeTemplateHtml } from "@/lib/sanitize-blocks";
import { checkSiteRole } from "@/server/services/permission.service";
import {
  USER_TEMPLATE_TRASH_RETENTION_DAYS,
  type PurgeUserTemplateInput,
  type RestoreUserTemplateInput,
  type TrashedUserTemplate,
  type UpsertUserTemplateInput,
} from "@buildrik/shared/schemas/user-template";

/* Saved-template trash (design-2l9 B6-T24…T33): delete keeps the row with
   `deletedAt` set for the retention window; restore clears it (same row,
   same templateId); permanent delete is ADMIN with the name typed back. */
export class UserTemplateTrashError extends Error {
  constructor(public code: "NOT_FOUND" | "CONFIRM_MISMATCH", message: string) {
    super(message);
    this.name = "UserTemplateTrashError";
  }
}

const RETENTION_MS = USER_TEMPLATE_TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const TEMPLATE_ROW = {
  templateId: true, name: true, category: true, description: true,
  html: true, css: true, thumbnail: true, updatedAt: true,
} as const;

async function workspaceOf(siteId: string): Promise<string | null> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  return site?.workspaceId ?? null;
}

export async function upsertUserTemplate(
  input: UpsertUserTemplateInput
): Promise<{ templateId: string }> {
  const workspaceId = await workspaceOf(input.siteId);
  if (!workspaceId) return { templateId: input.templateId };
  // Workspace-wide: every site of the agency can apply it.
  const html = sanitizeTemplateHtml(input.html);
  await prisma.userTemplate.upsert({
    where: { workspaceId_templateId: { workspaceId, templateId: input.templateId } },
    create: {
      workspaceId,
      templateId: input.templateId,
      name: input.name,
      category: input.category ?? null,
      description: input.description ?? null,
      html,
      css: input.css ?? null,
      thumbnail: input.thumbnail ?? null,
      createdBy: input.createdBy ?? null,
    },
    update: {
      name: input.name,
      category: input.category ?? null,
      description: input.description ?? null,
      html,
      css: input.css ?? null,
      thumbnail: input.thumbnail ?? null,
    },
  });
  return { templateId: input.templateId };
}

export async function listUserTemplates(siteId: string) {
  const workspaceId = await workspaceOf(siteId);
  if (!workspaceId) return [];
  return prisma.userTemplate.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    select: TEMPLATE_ROW,
  });
}

export async function deleteUserTemplate(
  siteId: string,
  templateId: string
): Promise<{ ok: true }> {
  const workspaceId = await workspaceOf(siteId);
  if (!workspaceId) return { ok: true };
  /* To Recently deleted, not gone (B6-T16/T24). */
  await prisma.userTemplate.updateMany({ where: { workspaceId, templateId, deletedAt: null }, data: { deletedAt: new Date() } });
  return { ok: true };
}

/** The workspace's deleted saved templates still inside the window, newest first. */
export async function listUserTemplateTrash(siteId: string): Promise<TrashedUserTemplate[]> {
  const workspaceId = await workspaceOf(siteId);
  if (!workspaceId) return [];
  const rows = await prisma.userTemplate.findMany({
    where: { workspaceId, deletedAt: { gte: new Date(Date.now() - RETENTION_MS) } },
    orderBy: { deletedAt: "desc" },
    select: { templateId: true, name: true, html: true, deletedAt: true },
  });
  return rows.map((r) => ({ ...r, deletedAt: r.deletedAt as Date }));
}

/** Back to the saved templates as it was — the same templateId (B6-T26). */
export async function restoreUserTemplate(input: RestoreUserTemplateInput) {
  const workspaceId = await workspaceOf(input.siteId);
  const row = workspaceId
    ? await prisma.userTemplate.findFirst({
        where: { workspaceId, templateId: input.templateId, deletedAt: { not: null } },
        select: { id: true },
      })
    : null;
  if (!row) throw new UserTemplateTrashError("NOT_FOUND", "This template is no longer in Recently deleted.");
  return prisma.userTemplate.update({ where: { id: row.id }, data: { deletedAt: null }, select: TEMPLATE_ROW });
}

/** Delete one deleted saved template for good (ADMIN; the typed name must match). */
export async function purgeUserTemplate(userId: string, input: PurgeUserTemplateInput): Promise<{ success: true }> {
  await checkSiteRole(prisma, userId, input.siteId, "ADMIN");
  const workspaceId = await workspaceOf(input.siteId);
  const row = workspaceId
    ? await prisma.userTemplate.findFirst({
        where: { workspaceId, templateId: input.templateId, deletedAt: { not: null } },
        select: { id: true, name: true },
      })
    : null;
  if (!row) throw new UserTemplateTrashError("NOT_FOUND", "This template is no longer in Recently deleted.");
  if (input.confirmName.trim() !== row.name) {
    throw new UserTemplateTrashError("CONFIRM_MISMATCH", `Type ${row.name} to confirm.`);
  }
  await prisma.userTemplate.delete({ where: { id: row.id } });
  return { success: true };
}

/** Retention purge (cron): deleted saved templates older than the window. */
export async function purgeExpiredUserTemplateTrash(now: Date = new Date()): Promise<{ deleted: number }> {
  const { count } = await prisma.userTemplate.deleteMany({
    where: { deletedAt: { not: null, lt: new Date(now.getTime() - RETENTION_MS) } },
  });
  return { deleted: count };
}
