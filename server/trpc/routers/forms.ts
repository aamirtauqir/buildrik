import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listFormBlocks,
  listSubmissions,
  updateSubmission,
  deleteSubmission,
  exportSubmissions,
} from "@/server/services/form-submission.service";
import { listSubmissionsSchema, updateSubmissionSchema } from "@buildrik/shared/schemas/forms";
import { assertSiteAccess, PermissionError } from "@/server/services/permission.service";

async function guardSite(prisma: typeof import("@/lib/prisma").prisma, userId: string, siteId: string): Promise<void> {
  try {
    await assertSiteAccess(prisma, userId, siteId);
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

export const formsRouter = router({
  listBlocks: protectedProcedure
    .input(z.object({ siteId: z.string() }))
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listFormBlocks(input.siteId);
    }),

  listSubmissions: protectedProcedure
    .input(listSubmissionsSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return listSubmissions(input);
    }),

  updateSubmission: protectedProcedure
    .input(updateSubmissionSchema)
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.formSubmission.findUnique({
        where: { id: input.id },
        select: { siteId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      await guardSite(ctx.prisma, ctx.session.user.id, submission.siteId);
      return updateSubmission(input);
    }),

  deleteSubmission: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.prisma.formSubmission.findUnique({
        where: { id: input.id },
        select: { siteId: true },
      });
      if (!submission) throw new TRPCError({ code: "NOT_FOUND" });
      await guardSite(ctx.prisma, ctx.session.user.id, submission.siteId);
      return deleteSubmission(input.id);
    }),

  exportSubmissions: protectedProcedure
    .input(z.object({
      siteId: z.string(),
      formBlockId: z.string(),
      format: z.enum(["csv", "json"]),
    }))
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return exportSubmissions(input.siteId, input.formBlockId, input.format);
    }),
});
