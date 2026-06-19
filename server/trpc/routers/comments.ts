import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import {
  assertSiteAccess,
  checkSiteRole,
  PermissionError,
} from "@/server/services/permission.service";
import {
  createComment,
  listComments,
  resolveComment,
  CommentError,
} from "@/server/services/comment.service";
import {
  createCommentInput,
  listCommentsInput,
  resolveCommentInput,
} from "@buildrik/shared/schemas/comments";

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
