import { TRPCError } from "@trpc/server";
import { publicProcedure, createRateLimitedProcedure, router } from "../trpc";
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
 *
 * Public by design still means budgeted. The three mutations are rate-limited
 * per IP (see below); they were not, and `createRateLimitedProcedure` had two
 * callers in the entire app, both in auth.ts.
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
          : e.code === "EMAIL_MISMATCH" || e.code === "NOT_INVITED"
            ? // Deliberately BAD_REQUEST, not FORBIDDEN: the page shows this
              // inline under the email field, and it must not read as "your
              // link is dead" when the link is fine and the address is wrong.
              "BAD_REQUEST"
            : // EXPIRED and REVOKED are both "this link is dead" — FORBIDDEN, so
              // the page can render the expired screen rather than a 404.
              "FORBIDDEN";
    /* An OBJECT, not the bare code string: the global errorFormatter lifts a
       cause's enumerable fields with Object.entries, so a string arrived at the
       client as {0:"E",1:"X",2:"P"…} and the page could not read it. */
    throw new TRPCError({ code, message: e.message, cause: { reason: e.code } });
  }
  throw e;
}

/* `identify` matches the visitor's email against the address the link was sent
   to. Unthrottled that is an address oracle for anyone holding the link, and
   the address it accepts becomes the identity that signs the approval.
   `resolve` is the signature itself. Both take the strict budget auth uses for
   2FA and token verification — a real client types their email once.

   `comment` is looser: a reviewer leaves several in one sitting, and being
   wrong there costs spam rather than a forged sign-off.

   The two reads stay unthrottled. The token is 32 random bytes, so there is
   nothing cheap to guess, and throttling a read breaks a reviewer who
   refreshes the page. */
const strictClientLimit = createRateLimitedProcedure(5, 15 * 60 * 1000);
const commentLimit = createRateLimitedProcedure(20, 15 * 60 * 1000);

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
  identify: strictClientLimit.input(identifyReviewerInput).mutation(async ({ input }) => {
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

  comment: commentLimit.input(clientCommentInput).mutation(async ({ input }) => {
    const { token, ...rest } = input;
    try {
      return await createClientComment(token, rest);
    } catch (e) {
      translate(e);
    }
  }),

  /** The signature. The reason the product exists. */
  resolve: strictClientLimit.input(clientResolveInput).mutation(async ({ input }) => {
    try {
      return await resolveReviewByToken(input.token, input.status);
    } catch (e) {
      translate(e);
    }
  }),
});
