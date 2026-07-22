/**
 * "My Templates" router (#13/25, 2026-06-24). Editor mirrors upsert/delete +
 * hydrates list. Read gate = any active member of the editing site
 * (guardSiteAccess); the service resolves the workspace from that site.
 *
 * @license BSD-3-Clause
 */
import { protectedProcedure, router } from "../trpc";
import {
  upsertUserTemplate,
  listUserTemplates,
  deleteUserTemplate,
} from "@/server/services/user-template.service";
import {
  upsertUserTemplateSchema,
  listUserTemplatesSchema,
  deleteUserTemplateSchema,
} from "@buildrik/shared/schemas/user-template";
import { guardSiteAccess as guardSite, guardSiteRole } from "@/server/trpc/guards";

export const userTemplatesRouter = router({
  upsert: protectedProcedure
    .input(upsertUserTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      // Stamp the caller — never trust a client-supplied createdBy.
      return upsertUserTemplate({ ...input, createdBy: ctx.session.user.id });
    }),

  list: protectedProcedure
    .input(listUserTemplatesSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listUserTemplates(input.siteId);
    }),

  delete: protectedProcedure
    .input(deleteUserTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return deleteUserTemplate(input.siteId, input.templateId);
    }),
});
