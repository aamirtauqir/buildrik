import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import {
  getReviewByToken,
  identifyReviewer,
  createClientComment,
  listClientComments,
  resolveReviewByToken,
  ClientReviewError,
} from "@/server/services/client-review.service";
import {
  reviewTokenInput,
  identifyReviewerInput,
  clientCommentInput,
  clientResolveInput,
} from "@buildrik/shared/schemas/reviews";

/**
 * The client review page (`/review/<token>`) — the only router in the app
 * whose procedures are `publicProcedure` by design rather than by omission.
 *
 * The token IS the credential. It authorises exactly one review on one site,
 * for comment + approve, and nothing else. Three rules hold this together and
 * all three live in `client-review.service.ts`:
 *
 *   1. Every service call takes the token first and resolves it itself. No
 *      procedure here passes a siteId or reviewId through from input.
 *   2. A token that is revoked or expired fails closed, with distinct codes so
 *      the page can say which — "expired" and "wrong link" are different
 *      problems for the person holding it.
 *   3. Commenting and approving additionally require identity. An unsigned
 *      approval cannot settle an argument, which is the only reason we collect
 *      approvals at all.
 *
 * NOT gated on the `agency_layer` flag, unlike `reviews.ts`. A link that was
 * legitimately issued must keep working; killing a client's live link because
 * a workspace flag flipped is a support ticket and a broken promise.
 */

function translate(e: unknown): never {
  if (e instanceof ClientReviewError) {
    const code =
      e.code === "INVALID_TOKEN"
        ? "NOT_FOUND"
        : e.code === "NOT_IDENTIFIED"
          ? "UNAUTHORIZED"
          : e.code === "ALREADY_RESOLVED"
            ? "CONFLICT"
            : // EXPIRED and REVOKED are both "this link is dead" — FORBIDDEN, so
              // the page can render the expired screen rather than a 404.
              "FORBIDDEN";
    throw new TRPCError({ code, message: e.message, cause: e.code });
  }
  throw e;
}

export const clientReviewRouter = router({
  /** Load the page. Safe before identity — the form renders over the site. */
  get: publicProcedure.input(reviewTokenInput).query(async ({ input }) => {
    try {
      return await getReviewByToken(input.token);
    } catch (e) {
      translate(e);
    }
  }),

  /** Name + email on first visit. Upserts, so round 2 knows the same person. */
  identify: publicProcedure.input(identifyReviewerInput).mutation(async ({ input }) => {
    try {
      return await identifyReviewer(input.token, input.name, input.email);
    } catch (e) {
      translate(e);
    }
  }),

  comments: publicProcedure.input(reviewTokenInput).query(async ({ input }) => {
    try {
      return await listClientComments(input.token);
    } catch (e) {
      translate(e);
    }
  }),

  comment: publicProcedure.input(clientCommentInput).mutation(async ({ input }) => {
    const { token, ...rest } = input;
    try {
      return await createClientComment(token, rest);
    } catch (e) {
      translate(e);
    }
  }),

  /** The signature. The reason the product exists. */
  resolve: publicProcedure.input(clientResolveInput).mutation(async ({ input }) => {
    try {
      return await resolveReviewByToken(input.token, input.status);
    } catch (e) {
      translate(e);
    }
  }),
});
