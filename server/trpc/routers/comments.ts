import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { resolveWorkspaceId } from "@/server/trpc/workspace-ctx";
import {
  assertSiteAccess,
  checkSiteRole,
  checkWorkspaceRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  createComment,
  reattachComment,
  listComments,
  listWorkspaceComments,
  resolveComment,
  CommentError,
} from "@/server/services/comment.service";
import {
  createCommentInput,
  listCommentsInput,
  resolveCommentInput,
  reattachCommentInput,
} from "@buildrik/shared/schemas/comments";
import { paginationInput } from "@buildrik/shared/schemas/pagination";
import { checkRateLimit } from "@/server/services/rate-limiter";

// Any member with site access can post — throttle per user per site so a
// VIEWER can't script a comment flood (S-10).
const CREATE_MAX = 30;
const CREATE_WINDOW_MS = 60 * 1000;

function translatePermission(e: unknown): never {
  if (e instanceof PermissionError) throw new TRPCError({ code: e.code, message: e.message });
  throw e;
}

export const commentsRouter = router({
  // Any member with access to the site can pin a comment (viewers included).
  create: protectedProcedure
    .input(createCommentInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        translatePermission(e);
      }
      const rl = await checkRateLimit(
        `comments-create:${ctx.session.user.id}:${input.siteId}`,
        CREATE_MAX,
        CREATE_WINDOW_MS,
      );
      if (!rl.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many comments. Please slow down." });
      }
      return createComment(input.siteId, ctx.session.user.id, input);
    }),

  list: protectedProcedure
    .input(listCommentsInput)
    .query(async ({ ctx, input }) => {
      try {
        await assertSiteAccess(ctx.prisma, ctx.session.user.id, input.siteId);
      } catch (e) {
        translatePermission(e);
      }
      return listComments(input.siteId, input.status);
    }),

  // Agency triage view — every comment across the workspace's sites. Admin-gated.
  workspaceList: protectedProcedure
    .input(z.object({ status: z.enum(["OPEN", "RESOLVED"]).optional() }).merge(paginationInput).optional())
    .query(async ({ ctx, input }) => {
      const workspaceId = await resolveWorkspaceId(ctx);
      try {
        await checkWorkspaceRole(ctx.prisma, ctx.session.user.id, workspaceId, "ADMIN");
      } catch (e) {
        translatePermission(e);
      }
      return listWorkspaceComments(workspaceId, input?.status, { limit: input?.limit, cursor: input?.cursor });
    }),

  // Re-anchoring an orphaned pin is an editorial action, same tier as resolve.
  reattach: protectedProcedure
    .input(reattachCommentInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        translatePermission(e);
      }
      try {
        return await reattachComment(input.siteId, input);
      } catch (e) {
        if (e instanceof CommentError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
    }),

  // Resolving/reopening is an editorial action — the agency, not the commenter.
  resolve: protectedProcedure
    .input(resolveCommentInput)
    .mutation(async ({ ctx, input }) => {
      try {
        await checkSiteRole(ctx.prisma, ctx.session.user.id, input.siteId, "EDITOR");
      } catch (e) {
        translatePermission(e);
      }
      try {
        return await resolveComment(input.siteId, input.id, input.status, ctx.session.user.id);
      } catch (e) {
        if (e instanceof CommentError) throw new TRPCError({ code: e.code, message: e.message });
        throw e;
      }
    }),
});
