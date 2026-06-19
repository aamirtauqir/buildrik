import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import {
  checkSiteRole,
  checkWorkspaceRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  submitReview,
  listReviews,
  resolveReview,
  ReviewError,
} from "@/server/services/review.service";
import {
  submitReviewInput,
  resolveReviewInput,
  reviewStatusSchema,
} from "@buildrik/shared/schemas/reviews";

function translateReviewError(e: unknown): never {
  if (e instanceof ReviewError) throw new TRPCError({ code: e.code, message: e.message });
  throw e;
}

async function requireAdmin(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  workspaceId: string,
): Promise<void> {
  try {
    await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
  } catch (e) {
    if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
    throw e;
  }
}

export const reviewsRouter = router({
  // A content editor (anyone with EDITOR access to the site) submits it for review.
  submit: protectedProcedure
    .input(submitReviewInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return submitReview(input.siteId, ctx.session.user.id, input.note);
    }),

  // Admins see the review queue + resolve it.
  list: protectedProcedure
    .input(z.object({ status: reviewStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAdmin(ctx, workspaceId);
      return listReviews(workspaceId, input?.status);
    }),

  resolve: protectedProcedure
    .input(resolveReviewInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAdmin(ctx, workspaceId);
      try {
        return await resolveReview(workspaceId, input.id, input.status, ctx.session.user.id);
      } catch (e) {
        translateReviewError(e);
      }
    }),
});
