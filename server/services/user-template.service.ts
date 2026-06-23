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
import type { UpsertUserTemplateInput } from "@buildrik/shared/schemas/user-template";

async function workspaceOf(siteId: string): Promise<string | null> {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { workspaceId: true } });
  return site?.workspaceId ?? null;
}

export async function upsertUserTemplate(
  input: UpsertUserTemplateInput
): Promise<{ templateId: string }> {
  const workspaceId = await workspaceOf(input.siteId);
  if (!workspaceId) return { templateId: input.templateId };
  await prisma.userTemplate.upsert({
    where: { workspaceId_templateId: { workspaceId, templateId: input.templateId } },
    create: {
      workspaceId,
      templateId: input.templateId,
      name: input.name,
      category: input.category ?? null,
      description: input.description ?? null,
      html: input.html,
      css: input.css ?? null,
      thumbnail: input.thumbnail ?? null,
      createdBy: input.createdBy ?? null,
    },
    update: {
      name: input.name,
      category: input.category ?? null,
      description: input.description ?? null,
      html: input.html,
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
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      templateId: true, name: true, category: true, description: true,
      html: true, css: true, thumbnail: true, updatedAt: true,
    },
  });
}

export async function deleteUserTemplate(
  siteId: string,
  templateId: string
): Promise<{ ok: true }> {
  const workspaceId = await workspaceOf(siteId);
  if (!workspaceId) return { ok: true };
  await prisma.userTemplate.deleteMany({ where: { workspaceId, templateId } });
  return { ok: true };
}
