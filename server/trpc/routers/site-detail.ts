import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { checkSiteRole, assertSiteAccess, PermissionError } from "@/server/services/permission.service";
import type { PlanName } from "@/lib/constants/plan-limits";
import { getSettingsOverview, getSiteOverview, getLocales, getRedirectSuggestions } from "@/server/services/site-detail.service";
import { getSiteSettings, updateSiteSettings } from "@/server/services/site-settings.service";
import { recordForSite } from "@/server/services/activity-log.service";
import { listRedirects, createRedirect, updateRedirect, deleteRedirect, importRedirects, exportRedirects } from "@/server/services/redirect.service";
import {
  checkDomainDns,
  listDomains,
  connectDomain,
  removeDomain,
  setPrimaryDomain,
  listWorkspaceDomains,
  checkDomainAvailability,
  updateDomain,
} from "@/server/services/domain.service";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { listShareLinks, createShareLink, revokeShareLink } from "@/server/services/share-link.service";
import { getSiteAnalytics, getAnalyticsStatus } from "@/server/services/analytics.service";
import {
  updateSiteSettingsSchema,
  createRedirectSchema,
  updateRedirectSchema,
  connectDomainSchema,
  checkDomainAvailabilitySchema,
  updateDomainSchema,
  createShareLinkSchema,
  siteAnalyticsQuerySchema,
} from "@buildrik/shared/schemas/site-detail";

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

  // The editor's Settings → Overview (Clone 3397:32915): a summary line per
  // section + the NEEDS ATTENTION rows. Read-only, same access as `overview`.
  settingsOverview: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return getSettingsOverview(input.siteId);
    }),

  // Settings → Localization (Clone 3397:32376 Locales table, 3737:44869
  // checklist): one row per enabled locale with its translation progress.
  locales: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await getLocales(input.siteId);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
        throw e;
      }
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
          if (e instanceof Error && e.message === "SITE_PASSWORD_NOT_AVAILABLE")
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "A published-site password requires Pro or above",
            });
          if (e instanceof Error && e.message === "DEFAULT_LOCALE_NOT_ENABLED")
            throw new TRPCError({ code: "BAD_REQUEST", message: "The default locale must be in the enabled locales list." });
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

    // Settings S3 (Clone 3397:32517 "404 suggester"): the old page slugs the
    // site no longer serves and has no redirect for. Read-only, same access
    // as `list`.
    suggestions: protectedProcedure
      .input(z.object({ siteId: z.string() }))
      .query(async ({ ctx, input }) => {
        try {
          await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        return getRedirectSuggestions(input.siteId);
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
        const { siteId, ...data } = input;
        try {
          return await createRedirect(siteId, data, safePlan);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "REDIRECT_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "Redirect limit reached." });
          if (e instanceof Error && e.message === "REDIRECT_EXISTS")
            throw new TRPCError({ code: "CONFLICT", message: `A redirect from ${input.fromPath} already exists.` });
          throw e;
        }
      }),

    update: protectedProcedure
      .input(updateRedirectSchema)
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
        try {
          return await updateRedirect(id, redirect.siteId, data);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "REDIRECT_EXISTS")
            throw new TRPCError({ code: "CONFLICT", message: `A redirect from ${input.fromPath} already exists.` });
          throw e;
        }
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
          if (e instanceof Error && e.message === "CSV_TOO_LARGE")
            throw new TRPCError({ code: "BAD_REQUEST", message: "CSV exceeds 1000 rows." });
          if (e instanceof Error && e.message.startsWith("INVALID_CSV_ROW:"))
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid redirect on line ${e.message.split(":")[1]} — expected "/from,to[,301|302]".`,
            });
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

    // Cross-site monitor: every domain in the caller's workspace.
    listForWorkspace: protectedProcedure.query(async ({ ctx }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      return listWorkspaceDomains(workspaceId);
    }),

    // The Add-a-domain dialog's `Available` / `Already connected` tag. Not
    // site-scoped: a hostname is unique across the whole database, and the
    // answer reveals only what `connect` would say anyway (DOMAIN_IN_USE).
    checkAvailability: protectedProcedure
      .input(checkDomainAvailabilitySchema)
      .query(({ input }) => checkDomainAvailability(input.domain)),

    check: protectedProcedure
      .input(z.object({ id: z.string(), siteId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        try {
          // It writes (DnsRecord.verified, Domain.status), so a VIEWER may not.
          await checkSiteRole(ctx.prisma, ctx.session.user!.id!, input.siteId, "EDITOR");
        } catch (e) {
          if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
          throw e;
        }
        const result = await checkDomainDns(input.id, input.siteId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        return result;
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
          const { siteId, ...options } = input;
          const domain = await connectDomain(siteId, options);
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
          if (e instanceof Error && e.message === "DOMAIN_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "You've reached your plan's custom-domain limit. Upgrade to add more." });
          if (e instanceof Error && e.message === "SITE_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
          throw e;
        }
      }),

    // The card's Force HTTPS toggle (Clone 3397:32206). Same gate as `remove`:
    // the row names its site, and ADMIN on that site is required.
    update: protectedProcedure
      .input(updateDomainSchema)
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
        return updateDomain(input.id, { forceHttps: input.forceHttps });
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
        try {
          return await setPrimaryDomain(input.id, input.siteId);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "DOMAIN_NOT_VERIFIED")
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Verify this domain before making it primary." });
          if (e instanceof Error && e.message === "DOMAIN_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Domain not found." });
          throw e;
        }
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
          // Plan limits reached the client as a bare 500 (a password link on
          // FREE, walk 2026-09-24). FORBIDDEN + the plan's reason, like the
          // page limit in pages.create.
          if (e instanceof Error && e.message === "PASSWORD_LINKS_NOT_AVAILABLE")
            throw new TRPCError({ code: "FORBIDDEN", message: "Password-protected share links need the Pro plan or higher." });
          if (e instanceof Error && e.message === "EXPIRY_EXCEEDS_PLAN")
            throw new TRPCError({ code: "FORBIDDEN", message: "That expiry is longer than your plan allows." });
          if (e instanceof Error && e.message === "SHARE_LINK_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "Your plan allows 3 active share links per site. Revoke one or upgrade." });
          if (e instanceof Error && e.message === "SITE_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
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

  // Settings → Analytics (Clone 3397:32295 "Last received data", 4256:26844).
  // Top-level because `analytics` above is already a leaf procedure — a
  // `analytics.status` sub-router would have to replace it.
  analyticsStatus: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user!.id!, input.siteId);
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return getAnalyticsStatus(input.siteId);
    }),
});
