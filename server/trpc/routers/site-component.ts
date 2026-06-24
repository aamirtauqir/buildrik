/**
 * Site component-master router (#4/27, 2026-06-24). Editor mirrors upsert/delete
 * + hydrates list/get. Read gate = any active member (guardSiteAccess).
 * createdBy defaults to the caller.
 *
 * @license BSD-3-Clause
 */
import { protectedProcedure, router } from "../trpc";
import {
  upsertSiteComponent,
  listSiteComponents,
  getSiteComponent,
  deleteSiteComponent,
  listWorkspaceComponents,
  getComponentUsage,
} from "@/server/services/site-component.service";
import {
  upsertSiteComponentSchema,
  listSiteComponentsSchema,
  getSiteComponentSchema,
  deleteSiteComponentSchema,
  componentUsageSchema,
} from "@buildrik/shared/schemas/site-component";
import { guardSiteAccess as guardSite } from "@/server/trpc/guards";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";

export const siteComponentsRouter = router({
  upsert: protectedProcedure
    .input(upsertSiteComponentSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return upsertSiteComponent({ ...input, createdBy: input.createdBy ?? ctx.session.user.id });
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
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
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
});
