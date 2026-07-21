import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import { isFeatureEnabled } from "@/server/services/feature-flag.service";
import {
  checkSiteRole,
  checkWorkspaceRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  submitReview,
  listReviews,
  resolveReview,
  getReviewStatusForSite,
  ReviewError,
} from "@/server/services/review.service";
import {
  submitReviewInput,
  resolveReviewInput,
  reviewStatusForSiteInput,
  reviewStatusSchema,
} from "@buildrik/shared/schemas/reviews";

function translateReviewError(e: unknown): never {
  if (e instanceof ReviewError) throw new TRPCError({ code: e.code, message: e.message });
  throw e;
}

// Reviews are part of the agency layer (IA v2 E1) — same `agency_layer` flag
// that gates clients + theme. Mutations hard-fail when it's off; the list
// collapses to empty so a non-agency workspace never sees agency chrome.
async function requireAgencyLayer(workspaceId: string): Promise<void> {
  if (!(await isFeatureEnabled(workspaceId, "agency_layer"))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Agency layer is not enabled for this workspace",
    });
  }
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
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return submitReview(
        input.siteId,
        ctx.session.user.id,
        input.note,
        input.changeSummary,
        input.clientEmail,
        input.snapshotPages,
      );
    }),

  // Admins see the review queue + resolve it. Flag off → [] so the UI collapses
  // to an empty queue rather than erroring (mirrors clients.list).
  list: protectedProcedure
    .input(z.object({ status: reviewStatusSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      if (!(await isFeatureEnabled(workspaceId, "agency_layer"))) return [];
      await requireAdmin(ctx, workspaceId);
      return listReviews(workspaceId, input?.status);
    }),

  // The editor's review-status pill (S5.2) for the current site. Flag off →
  // { state: "none" } so the editor simply shows no pill (mirrors list). Any
  // EDITOR of the site may read it — it's their own review status.
  status: protectedProcedure
    .input(reviewStatusForSiteInput)
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      if (!(await isFeatureEnabled(workspaceId, "agency_layer")))
        return { state: "none" as const, reviewerName: null, at: null };
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
      return getReviewStatusForSite(input.siteId);
    }),

  resolve: protectedProcedure
    .input(resolveReviewInput)
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      await requireAgencyLayer(workspaceId);
      await requireAdmin(ctx, workspaceId);
      try {
        return await resolveReview(workspaceId, input.id, input.status, ctx.session.user.id);
      } catch (e) {
        translateReviewError(e);
      }
    }),
});
