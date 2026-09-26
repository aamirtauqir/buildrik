import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  listFormBlocks,
  listSubmissions,
  updateSubmission,
  deleteSubmission,
  exportSubmissions,
  getFormBlockSettings,
  updateFormBlock,
  FormError,
} from "@/server/services/form-submission.service";
import {
  listSubmissionsSchema,
  updateSubmissionSchema,
  getFormBlockSchema,
  updateFormBlockSchema,
} from "@buildrik/shared/schemas/forms";
import { guardSiteAccess as guardSite, guardSiteRole } from "@/server/trpc/guards";

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
      await guardSiteRole(ctx.prisma, ctx.session.user.id, submission.siteId);
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
      await guardSiteRole(ctx.prisma, ctx.session.user.id, submission.siteId);
      return deleteSubmission(input.id);
    }),

  getBlock: protectedProcedure
    .input(getFormBlockSchema)
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return getFormBlockSettings(input.siteId, input.blockId);
    }),

  updateBlock: protectedProcedure
    .input(updateFormBlockSchema)
    .mutation(async ({ ctx, input }) => {
      await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId);
      // Who a form's submissions get emailed to is a data-exfil surface —
      // same precedent as the outbound-webhook gate (account.ts
      // integrations.add): changing it needs ADMIN. Every other AFTER
      // SUBMIT / PROTECTION field stays EDITOR-writable via the guard above.
      if (input.notifyEmail !== undefined) {
        await guardSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "ADMIN");
      }
      try {
        return await updateFormBlock(input);
      } catch (e: unknown) {
        if (e instanceof FormError) {
          throw new TRPCError({ code: e.code, message: e.message });
        }
        throw e;
      }
    }),

  exportSubmissions: protectedProcedure
    .input(z.object({
      siteId: z.string(),
      formBlockId: z.string().optional(),
      format: z.enum(["csv", "json"]),
    }))
    .query(async ({ ctx, input }) => {
      await guardSite(ctx.prisma, ctx.session.user.id, input.siteId);
      return exportSubmissions(input.siteId, input.formBlockId, input.format);
    }),
});
