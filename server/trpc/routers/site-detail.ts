import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { checkSiteRole, assertSiteAccess, PermissionError } from "@/server/services/permission.service";
import type { PlanName } from "@/lib/constants/plan-limits";
import { getSiteOverview } from "@/server/services/site-detail.service";
import { getSiteSettings, updateSiteSettings } from "@/server/services/site-settings.service";
import { listRedirects, createRedirect, updateRedirect, deleteRedirect, importRedirects, exportRedirects } from "@/server/services/redirect.service";
import { listDomains, connectDomain, removeDomain, setPrimaryDomain } from "@/server/services/domain.service";
import { listShareLinks, createShareLink, revokeShareLink } from "@/server/services/share-link.service";
import { getSiteAnalytics } from "@/server/services/analytics.service";
import { updateSiteSettingsSchema, createRedirectSchema, connectDomainSchema, createShareLinkSchema, siteAnalyticsQuerySchema } from "@buildrik/shared/schemas/site-detail";
import type { PlanName } from "@/lib/constants/plan-limits";

export const siteDetailRouter = router({
  overview: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return getSiteOverview(input.siteId);
    }),

  settings: router({
    get: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return getSiteSettings(input.siteId);
      }),

    update: protectedProcedure
      .input(updateSiteSettingsSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.id, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        if (input.headCode !== undefined || input.bodyCode !== undefined) {
          const site = await ctx.prisma.site.findUnique({
            where: { id: input.id },
            include: { workspace: { select: { plan: true } } },
          });
          if (!site) throw new TRPCError({ code: "NOT_FOUND" });
          const planResult = z.enum(["FREE", "PRO", "BUSINESS"]).safeParse(site.workspace.plan);
          const plan: PlanName = planResult.success ? planResult.data : "FREE";
          if (plan === "FREE") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Custom code requires Pro or above" });
          }
        }
        const { id, ...data } = input;
        return updateSiteSettings(id, data);
      }),
  }),

  redirects: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return listRedirects(input.siteId);
      }),

    create: protectedProcedure
      .input(createRedirectSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
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
      .mutation(async ({ ctx, input }) => {
        const redirect = await ctx.prisma.redirect.findUnique({
          where: { id: input.id },
          select: { siteId: true },
        });
        if (!redirect) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, redirect.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const { id, ...data } = input;
        return updateRedirect(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const redirect = await ctx.prisma.redirect.findUnique({
          where: { id: input.id },
          select: { siteId: true },
        });
        if (!redirect) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, redirect.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return deleteRedirect(input.id);
      }),

    import_csv: protectedProcedure
      .input(z.object({ siteId: z.string(), csv: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const member = await ctx.prisma.workspaceMember.findFirst({
          where: { userId: ctx.session.user!.id },
          include: { workspace: { select: { plan: true } } },
        });
        const planResult = z.enum(["FREE", "PRO", "BUSINESS"]).safeParse(member?.workspace?.plan ?? "FREE");
        const plan: PlanName = planResult.success ? planResult.data : "FREE";
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
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return { csv: await exportRedirects(input.siteId) };
      }),
  }),

  domains: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return listDomains(input.siteId);
      }),

    connect: protectedProcedure
      .input(connectDomainSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
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
      .mutation(async ({ ctx, input }) => {
        const domain = await ctx.prisma.domain.findUnique({
          where: { id: input.id },
          select: { siteId: true },
        });
        if (!domain) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, domain.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return removeDomain(input.id);
      }),

    setPrimary: protectedProcedure
      .input(z.object({ id: z.string(), siteId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return setPrimaryDomain(input.id, input.siteId);
      }),
  }),

  sharing: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return listShareLinks(input.siteId);
      }),

    create: protectedProcedure
      .input(createShareLinkSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const { siteId, ...data } = input;
        try {
          return await createShareLink(siteId, data, ctx.session.user.id);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "EDITORS_CANNOT_CREATE_LINKS")
            throw new TRPCError({ code: "FORBIDDEN", message: "Editors cannot create share links for this workspace" });
          throw e;
        }
      }),

    revoke: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const shareLink = await ctx.prisma.shareLink.findUnique({
          where: { id: input.id },
          select: { siteId: true },
        });
        if (!shareLink) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, shareLink.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return revokeShareLink(input.id);
      }),
  }),

  analytics: protectedProcedure
    .input(siteAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const { siteId, ...params } = input;
      return getSiteAnalytics(siteId, params);
    }),
});
