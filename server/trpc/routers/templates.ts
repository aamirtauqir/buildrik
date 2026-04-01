import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { listTemplates, getTemplate, useTemplate } from "@/server/services/template.service";
import { createGenerationJob, getJobStatus, cancelJob } from "@/server/services/ai-generation.service";
import { listTemplatesSchema, generateSiteSchema } from "@buildrik/shared/schemas/templates";

async function getWorkspaceId(ctx: {
  prisma: { workspaceMember: { findFirst: Function } };
  session: { user: { id: string } };
}): Promise<string> {
  const member = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.session.user.id },
    select: { workspaceId: true },
  });
  if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "No workspace found" });
  return member.workspaceId;
}

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
          throw e;
        }
      }),

    status: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const status = await getJobStatus(input.jobId);
        if (!status) throw new TRPCError({ code: "NOT_FOUND" });
        return status;
      }),

    cancel: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => cancelJob(input.jobId)),
  }),
});
