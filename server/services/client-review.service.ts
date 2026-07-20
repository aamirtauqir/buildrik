import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Client sign-off — the token-authenticated half of the review loop, and the
 * only layer that resolves a review token to a review.
 *
 * WHY THIS IS A SEPARATE FILE FROM `review.service.ts`
 * ----------------------------------------------------
 * They are two different loops that happen to share a table:
 *
 *   review.service.ts   designer submits → workspace ADMIN approves.
 *                       Every caller is an authenticated member; scoping is by
 *                       workspaceId taken from the session.
 *
 *   this file           designer sends → an ACCOUNT-LESS CLIENT approves.
 *                       Callers are unauthenticated; the token IS the
 *                       authorisation, and it authorises exactly one review on
 *                       one site — nothing else, ever.
 *
 * Both survive: an admin approving in-app is still legitimate (see the
 * permissions matrix in `docs/designs/2026-07-19-system-contracts.md` §2).
 * Merging them would mean one function whose authorisation rule changes
 * depending on how it was called, which is how auth bugs are written.
 *
 * SECURITY INVARIANT: every exported function below takes the token as its
 * first argument and resolves it through `requireLiveReview`. There is no path
 * in this file that accepts a siteId or reviewId from the caller — a token
 * holder must never be able to name a different site.
 */

/** 90 days — long enough for a slow client, short enough that a leaked link dies. */
const TOKEN_TTL_DAYS = 90;

export class ClientReviewError extends Error {
  constructor(
    public code:
    | "INVALID_TOKEN"
    | "EXPIRED"
    | "REVOKED"
    | "ALREADY_RESOLVED"
    | "NOT_IDENTIFIED"
    | "NOT_INVITED"
    | "EMAIL_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "ClientReviewError";
  }
}

function mintToken(): string {
  // 32 bytes of CSPRNG, base64url. Not randomUUID (which ShareLink uses):
  // a UUIDv4 carries 122 bits of entropy in a recognisable shape, and this
  // token guards a client's unpublished site with no second factor behind it.
  return crypto.randomBytes(32).toString("base64url");
}

export function tokenExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Issue a fresh token for a review and kill any previous one.
 *
 * Called on first send AND on every re-send. Re-sending must invalidate the
 * old link — otherwise every round a designer ever sent stays live forever,
 * and a client who bookmarked round 1 keeps approving a site that has moved on.
 */
export async function issueReviewToken(reviewId: string, invitedEmail?: string) {
  return prisma.reviewRequest.update({
    where: { id: reviewId },
    data: {
      token: mintToken(),
      expiresAt: tokenExpiry(),
      revokedAt: null,
      ...(invitedEmail ? { invitedEmail: invitedEmail.trim().toLowerCase() } : {}),
    },
    select: { id: true, token: true, expiresAt: true, siteId: true, invitedEmail: true },
  });
}

/** Kill a link by hand. A revoked token is never reissued — re-send mints a new one. */
export async function revokeReviewToken(workspaceId: string, reviewId: string) {
  const owned = await prisma.reviewRequest.findFirst({
    where: { id: reviewId, site: { workspaceId } },
    select: { id: true },
  });
  if (!owned) throw new ClientReviewError("INVALID_TOKEN", "Review not found");
  return prisma.reviewRequest.update({
    where: { id: reviewId },
    data: { revokedAt: new Date() },
    select: { id: true, revokedAt: true },
  });
}

/**
 * Resolve a token to its review, or say precisely why not.
 *
 * The three failure codes are distinct on purpose: the client page renders a
 * different screen for each, and "expired" must not look like "wrong link"
 * (one is "ask for a new link", the other is "you are in the wrong place").
 */
async function requireLiveReview(token: string) {
  const review = await prisma.reviewRequest.findUnique({
    where: { token },
    select: {
      id: true,
      siteId: true,
      status: true,
      note: true,
      changeSummary: true,
      expiresAt: true,
      revokedAt: true,
      reviewerId: true,
      invitedEmail: true,
      createdAt: true,
      site: { select: { id: true, name: true, workspaceId: true } },
    },
  });
  if (!review) throw new ClientReviewError("INVALID_TOKEN", "This review link is not valid.");
  if (review.revokedAt) {
    throw new ClientReviewError("REVOKED", "This review link was replaced by a newer one.");
  }
  if (review.expiresAt && review.expiresAt < new Date()) {
    throw new ClientReviewError("EXPIRED", "This review link has expired.");
  }
  return review;
}

/**
 * What the client page loads. Safe to call before identity capture — the page
 * renders the name/email form first and the site behind it.
 */
export async function getReviewByToken(token: string) {
  const review = await requireLiveReview(token);
  const reviewer = review.reviewerId
    ? await prisma.reviewer.findUnique({
        where: { id: review.reviewerId },
        select: { id: true, name: true, email: true },
      })
    : null;
  return {
    reviewId: review.id,
    siteId: review.siteId,
    siteName: review.site.name,
    status: review.status,
    note: review.note,
    changeSummary: review.changeSummary,
    sentAt: review.createdAt,
    /** Null until the client signs. The page shows the capture form when null. */
    reviewer,
  };
}

/**
 * Capture name + email on first visit. Not a login — a signature.
 *
 * Upserts on (siteId, email) so round 2 recognises the same person after a
 * re-send has minted a fresh token: identity belongs to the relationship, not
 * to the link. Re-identifying a client every round is the friction the whole
 * account-less design exists to avoid.
 */
export async function identifyReviewer(token: string, name: string, email: string) {
  const review = await requireLiveReview(token);
  const normalised = email.trim().toLowerCase();

  // The signature must belong to the person the link was sent to. Without this
  // the token holder can sign as anyone — including as an existing reviewer on
  // the same site, overwriting their name — and a forgeable approval is worse
  // than none, because it reads as authoritative in the dispute it exists to
  // settle. No invited address means no client was invited, so nobody may sign.
  if (!review.invitedEmail) {
    throw new ClientReviewError("NOT_INVITED", "This link was not sent to anyone.");
  }
  if (normalised !== review.invitedEmail) {
    throw new ClientReviewError(
      "EMAIL_MISMATCH",
      "That is not the address this link was sent to.",
    );
  }

  const reviewer = await prisma.reviewer.upsert({
    where: { siteId_email: { siteId: review.siteId, email: normalised } },
    create: { siteId: review.siteId, name: name.trim(), email: normalised },
    update: { name: name.trim(), lastSeenAt: new Date() },
    select: { id: true, name: true, email: true },
  });

  await prisma.reviewRequest.update({
    where: { id: review.id },
    data: { reviewerId: reviewer.id },
  });
  return reviewer;
}

async function requireIdentifiedReview(token: string) {
  const review = await requireLiveReview(token);
  if (!review.reviewerId) {
    throw new ClientReviewError("NOT_IDENTIFIED", "Tell us who you are before you comment.");
  }
  return { review, reviewerId: review.reviewerId };
}

/** A comment authored by the client. `authorId` stays null — the CHECK constraint
 *  on `comments` enforces that exactly one of the two author columns is set. */
export async function createClientComment(
  token: string,
  input: { body: string; pageId?: string; x?: number; y?: number; targetSelector?: string },
) {
  const { review, reviewerId } = await requireIdentifiedReview(token);
  return prisma.comment.create({
    data: {
      siteId: review.siteId,
      reviewerId,
      body: input.body,
      pageId: input.pageId ?? null,
      x: input.x ?? null,
      y: input.y ?? null,
      targetSelector: input.targetSelector ?? null,
      status: "OPEN",
    },
    select: { id: true, body: true, x: true, y: true, pageId: true, createdAt: true },
  });
}

/**
 * The client's own comments, oldest first.
 *
 * Requires identity, and the reviewerId filter is a concrete id — never
 * `undefined`. An earlier version read `review.reviewerId ?? undefined`, and
 * Prisma treats `undefined` as "omit this filter", so an unidentified token
 * holder received EVERY comment on the site, internal team ones included.
 * Verified exploitable before the fix; a probe read back an internal note
 * about the client. Do not reintroduce `?? undefined` in a where clause.
 */
export async function listClientComments(token: string) {
  const { review, reviewerId } = await requireIdentifiedReview(token);
  return prisma.comment.findMany({
    where: { siteId: review.siteId, reviewerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, x: true, y: true, pageId: true, status: true, createdAt: true },
  });
}

/**
 * The client approves, or asks for changes. This is the signature the whole
 * product is built to collect.
 *
 * Requires identity first: an unsigned approval cannot settle an argument with
 * a client six weeks later, which is the only reason approvals exist.
 */
export async function resolveReviewByToken(
  token: string,
  status: "APPROVED" | "CHANGES_REQUESTED",
) {
  const { review, reviewerId } = await requireIdentifiedReview(token);
  if (review.status !== "PENDING") {
    throw new ClientReviewError("ALREADY_RESOLVED", "This review has already been answered.");
  }
  const resolved = await prisma.reviewRequest.update({
    where: { id: review.id },
    data: {
      status,
      resolvedAt: new Date(),
      // resolvedById stays null: the resolver is a Reviewer, not a User.
      // `reviewerId` on the row already names who signed.
      reviewerId,
    },
    select: { id: true, status: true, resolvedAt: true, siteId: true },
  });
  return resolved;
}
