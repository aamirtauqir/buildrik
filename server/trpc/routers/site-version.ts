/**
 * Site version-history router (#3/26, 2026-06-24). Editor mirrors create/delete
 * + hydrates list/get. Read gate = any active member (guardSiteAccess); the
 * editor only opens sites the user can edit. createdBy defaults to the caller.
 *
 * @license BSD-3-Clause
 */
import { protectedProcedure, router } from "../trpc";
import {
  createSiteVersion,
  listSiteVersions,
  getSiteVersion,
  deleteSiteVersion,
} from "@/server/services/site-version.service";
import {
  createSiteVersionSchema,
  listSiteVersionsSchema,
  getSiteVersionSchema,
  deleteSiteVersionSchema,
} from "@buildrik/shared/schemas/site-version";
import { guardSiteAccess as guardSite, guardSiteRole } from "@/server/trpc/guards";

export const siteVersionsRouter = router({
  create: protectedProcedure
    .input(createSiteVersionSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      // Always stamp the caller — never trust a client-supplied createdBy
      // (attribution spoofing in version history).
      return createSiteVersion({ ...input, createdBy: ctx.session.user.id });
    }),

  list: protectedProcedure
    .input(listSiteVersionsSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listSiteVersions(input.siteId);
    }),

  get: protectedProcedure
    .input(getSiteVersionSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return getSiteVersion(input.siteId, input.versionId);
    }),

  delete: protectedProcedure
    .input(deleteSiteVersionSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      return deleteSiteVersion(input.siteId, input.versionId);
    }),
});
