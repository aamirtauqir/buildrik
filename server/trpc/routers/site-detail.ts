import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { checkSiteRole, assertSiteAccess, PermissionError } from "@/server/services/permission.service";
import type { PlanName } from "@/lib/constants/plan-limits";
import { getSiteOverview } from "@/server/services/site-detail.service";
import { getSiteSettings, updateSiteSettings } from "@/server/services/site-settings.service";
import { recordForSite } from "@/server/services/activity-log.service";
import { listRedirects, createRedirect, updateRedirect, deleteRedirect, importRedirects, exportRedirects } from "@/server/services/redirect.service";
import { listDomains, connectDomain, removeDomain, setPrimaryDomain } from "@/server/services/domain.service";
import { listShareLinks, createShareLink, revokeShareLink } from "@/server/services/share-link.service";
import { getSiteAnalytics } from "@/server/services/analytics.service";
import { updateSiteSettingsSchema, createRedirectSchema, connectDomainSchema, createShareLinkSchema, siteAnalyticsQuerySchema } from "@buildrik/shared/schemas/site-detail";

export const siteDetailRouter = router({
  overview: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
        const { id, ...data } = input;
        try {
          const result = await updateSiteSettings(id, data);
          const changedKeys = Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined);
          await recordForSite({
            siteId: id,
            actorId: ctx.session.user!.id!,
            action: "site.settings.updated",
            targetType: "site",
            targetId: id,
            description: `Updated ${changedKeys.length} setting${changedKeys.length === 1 ? "" : "s"}`,
            metadata: { changedKeys },
          });
          return result;
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "CUSTOM_CODE_NOT_AVAILABLE")
            throw new TRPCError({ code: "FORBIDDEN", message: "Custom code requires Pro or above" });
          throw e;
        }
      }),
  }),

  redirects: router({
    list: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
          where: { userId: ctx.session.user!.id! },
          include: { workspace: { select: { plan: true } } },
        });
        const planResult = z.enum(["FREE", "PRO", "BUSINESS"] as const).safeParse(member?.workspace?.plan ?? "FREE");
        const safePlan: PlanName = planResult.success ? planResult.data : "FREE";
        try {
          return await createRedirect(input.siteId, { fromPath: input.fromPath, toUrl: input.toUrl, type: input.type }, safePlan);
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
          where: { userId: ctx.session.user!.id! },
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
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
          const domain = await connectDomain(input.siteId, input.domain);
          await recordForSite({
            siteId: input.siteId,
            actorId: ctx.session.user!.id!,
            action: "site.domain.connected",
            targetType: "domain",
            targetId: domain.id,
            description: `Connected ${input.domain}`,
            metadata: { domain: input.domain },
          });
          return domain;
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
          select: { siteId: true, domain: true },
        });
        if (!domain) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, domain.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const result = await removeDomain(input.id);
        await recordForSite({
          siteId: domain.siteId,
          actorId: ctx.session.user!.id!,
          action: "site.domain.removed",
          targetType: "domain",
          targetId: input.id,
          description: `Removed ${domain.domain}`,
          metadata: { domain: domain.domain },
        });
        return result;
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
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
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
          const link = await createShareLink(siteId, data, ctx.session.user!.id!);
          await recordForSite({
            siteId,
            actorId: ctx.session.user!.id!,
            action: "site.share_link.created",
            targetType: "shareLink",
            targetId: link.id,
            description: `Share link "${data.name}" created`,
            metadata: {
              name: data.name,
              hasPassword: Boolean(data.password),
              expiresInDays: data.expiresInDays ?? null,
            },
          });
          return link;
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "NOT_WORKSPACE_MEMBER")
            throw new TRPCError({ code: "FORBIDDEN", message: "You are not an active member of this workspace" });
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
          select: { siteId: true, name: true },
        });
        if (!shareLink) throw new TRPCError({ code: "NOT_FOUND" });
        try {
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, shareLink.siteId, "ADMIN");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const result = await revokeShareLink(input.id);
        await recordForSite({
          siteId: shareLink.siteId,
          actorId: ctx.session.user!.id!,
          action: "site.share_link.revoked",
          targetType: "shareLink",
          targetId: input.id,
          description: `Share link "${shareLink.name}" revoked`,
          metadata: { name: shareLink.name },
        });
        return result;
      }),
  }),

  analytics: protectedProcedure
    .input(siteAnalyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      const { siteId, ...params } = input;
      return getSiteAnalytics(siteId, params);
    }),
});
