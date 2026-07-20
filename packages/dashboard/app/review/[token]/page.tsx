import type { Metadata } from "next";
import { ReviewClient } from "./review-client";

export const dynamic = "force-dynamic";

/**
 * `/review/<token>` — the client's half of the sign-off loop, and the only page
 * in the product built for someone who will never have an account.
 *
 * The token in the URL is the entire credential. Nothing here reads a session,
 * and no siteId or reviewId is ever accepted from the caller — every lookup
 * goes through `client-review.service.ts`, which resolves the token itself.
 * See the security invariant at the top of that file.
 *
 * Deliberately NOT indexed. A review link is a private URL to an unpublished
 * client site; letting a crawler in would leak work the agency has not shown
 * anyone yet.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // Resolution happens client-side through tRPC rather than here, so the four
  // dead-link states (invalid · expired · revoked · already answered) render as
  // real screens with their own copy instead of a Next.js error boundary.
  return <ReviewClient token={token} />;
}
