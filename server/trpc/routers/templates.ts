import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listTemplates, getTemplate, useTemplate } from "@/server/services/template.service";
import { createGenerationJob, getJobStatus, cancelJob } from "@/server/services/ai-generation.service";
import { listTemplatesSchema, generateSiteSchema } from "@buildrik/shared/schemas/templates";
import { resolveWorkspaceId as getWorkspaceId } from "@/server/trpc/workspace-ctx";

export const templatesRouter = router({
  list: protectedProcedure
    .input(listTemplatesSchema)
    .query(async ({ input }) => listTemplates(input)),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const template = await getTemplate(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

  use: protectedProcedure
    .input(z.object({ templateId: z.string(), siteName: z.string().min(2).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await getWorkspaceId(ctx);
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
