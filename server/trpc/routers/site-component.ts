/**
 * Site component-master router (#4/27, 2026-06-24). Editor mirrors upsert/delete
 * + hydrates list/get. Read gate = any active member (guardSiteAccess).
 * createdBy defaults to the caller.
 *
 * @license BSD-3-Clause
 */
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  upsertSiteComponent,
  listSiteComponents,
  getSiteComponent,
  deleteSiteComponent,
  listWorkspaceComponents,
  getComponentUsage,
  renameWorkspaceComponent,
  deleteWorkspaceComponent,
} from "@/server/services/site-component.service";
import {
  upsertSiteComponentSchema,
  listSiteComponentsSchema,
  getSiteComponentSchema,
  deleteSiteComponentSchema,
  componentUsageSchema,
  renameWorkspaceComponentSchema,
} from "@buildrik/shared/schemas/site-component";
import { guardSiteAccess as guardSite, guardSiteRole } from "@/server/trpc/guards";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

// P6 shared library: managing the workspace component library (rename/delete a
// master everywhere) is an ADMIN action (contract §2 — VIEWER read-only,
// DESIGNER create-only in-editor). Reads stay open to any member.
async function requireWorkspaceAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  workspaceId: string,
): Promise<void> {
  try {
    await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

export const siteComponentsRouter = router({
  upsert: protectedProcedure
    .input(upsertSiteComponentSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      // Stamp the caller — never trust a client-supplied createdBy.
      return upsertSiteComponent({ ...input, createdBy: ctx.session.user.id });
    }),

  list: protectedProcedure
    .input(listSiteComponentsSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listSiteComponents(input.siteId);
    }),

  get: protectedProcedure
    .input(getSiteComponentSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return getSiteComponent(input.siteId, input.componentId);
    }),

  delete: protectedProcedure
    .input(deleteSiteComponentSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return deleteSiteComponent(input.siteId, input.componentId);
    }),

  // C1: the component browser — every master across the agency's workspace with
  // its "used on N sites" count. Workspace from the session (IDOR-safe).
  workspaceList: protectedProcedure.query(async ({ ctx }) => {
    const workspaceId = await resolveWorkspaceId(ctx);
    return listWorkspaceComponents(workspaceId);
  }),

  // C1 jump-to + C3 blast-radius: which sites carry a given master.
  usage: protectedProcedure
    .input(componentUsageSchema)
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      return getComponentUsage(workspaceId, input.componentId);
    }),

  // P6 shared library — rename a master everywhere (ADMIN).
  workspaceRename: protectedProcedure
    .input(renameWorkspaceComponentSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireWorkspaceAdmin(ctx, workspaceId);
      return renameWorkspaceComponent(workspaceId, input.componentId, input.name);
    }),

  // P6 shared library — delete a master from every site (ADMIN, confirmed at UI).
  workspaceDelete: protectedProcedure
    .input(componentUsageSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireWorkspaceAdmin(ctx, workspaceId);
      return deleteWorkspaceComponent(workspaceId, input.componentId);
    }),
});
