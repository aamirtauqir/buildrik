import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listTemplates, getTemplate, useTemplate, cloneSiteAsTemplate, applyTemplateToSite, TemplateError } from "@/server/services/template.service";
import { createGenerationJob, getJobStatus, cancelJob } from "@/server/services/ai-generation.service";
import { listTemplatesSchema, generateSiteSchema, applyTemplateToSiteSchema } from "@buildrik/shared/schemas/templates";
import { resolveWorkspaceId as getWorkspaceId } from "@/server/trpc/workspace-ctx";
import { checkSiteRole, checkWorkspaceRole, PermissionError } from "@/server/services/permission.service";

export const templatesRouter = router({
  list: protectedProcedure
    .input(listTemplatesSchema)
    .query(async ({ ctx, input }) => listTemplates(input, await getWorkspaceId(ctx))),

  // T4: clone one of the agency's sites into a workspace-private template.
  cloneFromSite: protectedProcedure
    .input(z.object({ siteId: z.string(), name: z.string().min(2).max(100), category: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      // Creating a template from a site is an editor-level action, not a
      // read — a VIEWER shouldn't mint workspace templates.
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await cloneSiteAsTemplate(workspaceId, input.siteId, input.name, input.category);
      } catch (e: unknown) {
        if (e instanceof TemplateError) throw new TRPCError({ code: "NOT_FOUND", message: e.message });
        throw e;
      }
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      const template = await getTemplate(input.id, workspaceId);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

  use: protectedProcedure
    .input(z.object({ templateId: z.string(), siteName: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      // Creating a site consumes plan quota — gate to EDITOR+ (not VIEWER).
      try {
        await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await useTemplate(workspaceId, ctx.session.user.id, input.templateId, input.siteName);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "SITE_LIMIT")
          throw new TRPCError({ code: "FORBIDDEN", message: "Site limit reached." });
        if (e instanceof Error && e.message === "TEMPLATE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
        throw e;
      }
    }),

  // Part ③: destructively replace an existing site's pages with a template's.
  applyToSite: protectedProcedure
    .input(applyTemplateToSiteSchema)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
      // This wipes every page of the site — destructive, so ADMIN, matching the
      // archive/delete tier. Was ungated: any ACTIVE member incl. VIEWER could
      // wipe any workspace site.
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "ADMIN");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      try {
        return await applyTemplateToSite(workspaceId, ctx.session.user.id, input.siteId, input.templateId);
      } catch (e: unknown) {
        if (e instanceof TemplateError && e.code === "SITE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Site not found." });
        if (e instanceof Error && e.message === "TEMPLATE_NOT_FOUND")
          throw new TRPCError({ code: "NOT_FOUND", message: "Template not found." });
        throw e;
      }
    }),

  generate: router({
    create: protectedProcedure
      .input(generateSiteSchema)
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await getWorkspaceId(ctx);
        try {
          return await createGenerationJob(workspaceId, ctx.session.user.id, input);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "AI_RATE_LIMITED")
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "AI generation rate limited. Max 3 per hour." });
          if (e instanceof Error && e.message === "AI_MONTHLY_LIMIT")
            throw new TRPCError({ code: "FORBIDDEN", message: "AI_MONTHLY_LIMIT" });
          throw e;
        }
      }),

    status: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ ctx, input }) => {
        const workspaceId = await getWorkspaceId(ctx);
        const status = await getJobStatus(input.jobId, workspaceId);
        if (!status) throw new TRPCError({ code: "NOT_FOUND" });
        return status;
      }),

    cancel: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const workspaceId = await getWorkspaceId(ctx);
        try {
          return await cancelJob(input.jobId, workspaceId);
        } catch (e: unknown) {
          if (e instanceof Error && e.message === "JOB_NOT_FOUND")
            throw new TRPCError({ code: "NOT_FOUND", message: "Generation job not found." });
          if (e instanceof Error && e.message === "JOB_NOT_CANCELLABLE")
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Job can no longer be cancelled." });
          throw e;
        }
      }),
  }),
});
