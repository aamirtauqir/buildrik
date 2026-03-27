import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getSiteOverview } from "@/server/services/site-detail.service";
import { getSiteSettings, updateSiteSettings } from "@/server/services/site-settings.service";
import { listRedirects, createRedirect, updateRedirect, deleteRedirect, importRedirects, exportRedirects } from "@/server/services/redirect.service";
import { listDomains, connectDomain, removeDomain, setPrimaryDomain } from "@/server/services/domain.service";
import { listShareLinks, createShareLink, revokeShareLink } from "@/server/services/share-link.service";
import { getSiteAnalytics } from "@/server/services/analytics.service";
import { updateSiteSettingsSchema, createRedirectSchema, connectDomainSchema, createShareLinkSchema, siteAnalyticsQuerySchema } from "@/lib/validations/site-detail";
import type { PlanName } from "@/lib/constants/plan-limits";

export const siteDetailRouter = router({
  overview: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ input }) => getSiteOverview(input.siteId)),

  settings: router({
    get: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ input }) => getSiteSettings(input.siteId)),

    update: protectedProcedure
      .input(updateSiteSettingsSchema)
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSiteSettings(id, data);
      }),
  }),

  redirects: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ input }) => listRedirects(input.siteId)),

    create: protectedProcedure
      .input(createRedirectSchema)
      .mutation(async ({ ctx, input }) => {
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { userId: ctx.session.user.id },
          include: { workspace: { select: { plan: true } } },
        });
        const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
        try {
          return await createRedirect(input.siteId, { fromPath: input.fromPath, toUrl: input.toUrl, type: input.type }, plan);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "REDIRECT_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "Redirect limit reached." });
          throw e;
        }
      }),

    update: protectedProcedure
      .input(z.object({ id: z.string(), fromPath: z.string().optional(), toUrl: z.string().optional(), type: z.enum(["301", "302"]).optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateRedirect(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => deleteRedirect(input.id)),

    import_csv: protectedProcedure
      .input(z.object({ siteId: z.string(), csv: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { userId: ctx.session.user!.id },
          include: { workspace: { select: { plan: true } } },
        });
        const plan = (member?.workspace?.plan ?? "FREE") as PlanName;
        try {
          return await importRedirects(input.siteId, input.csv, plan);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "REDIRECT_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "Redirect limit exceeded." });
          throw e;
        }
      }),

    export_csv: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ input }) => ({ csv: await exportRedirects(input.siteId) })),
  }),

  domains: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ input }) => listDomains(input.siteId)),

    connect: protectedProcedure
      .input(connectDomainSchema)
      .mutation(async ({ input }) => {
        try {
          return await connectDomain(input.siteId, input.domain);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "DOMAIN_IN_USE")
            throw new TRPCError({ code: "CONFLICT", message: "Domain already in use." });
          throw e;
        }
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => removeDomain(input.id)),

    setPrimary: protectedProcedure
      .input(z.object({ id: z.string(), siteId: z.string() }))
      .mutation(async ({ input }) => setPrimaryDomain(input.id, input.siteId)),
  }),

  sharing: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ input }) => listShareLinks(input.siteId)),

    create: protectedProcedure
      .input(createShareLinkSchema)
      .mutation(async ({ input }) => {
        const { siteId, ...data } = input;
        return createShareLink(siteId, data);
      }),

    revoke: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => revokeShareLink(input.id)),
  }),

  analytics: protectedProcedure
    .input(siteAnalyticsQuerySchema)
    .query(async ({ input }) => {
      const { siteId, ...params } = input;
      return getSiteAnalytics(siteId, params);
    }),
});
