/**
 * Editor → dashboard "Send for review" (redesign E4). A content editor (the
 * ?view=client experience) submits the current site for an admin to approve,
 * instead of publishing. Calls the dashboard `reviews.submit` tRPC endpoint.
 *
 * @license BSD-3-Clause
 */
import { getBuildrikClient } from "./api-client";
import { DASHBOARD_URL } from "../shared/utils/runtimeEnv";

/** The site being edited, read from the unified-editor URL (/edit/<siteId>) or
 *  the legacy ?siteId param. */
export function currentSiteId(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname.match(/\/edit\/([^/?#]+)/);
  if (path) return decodeURIComponent(path[1]);
  return new URLSearchParams(window.location.search).get("siteId");
}

/**
 * Submit the current site for review.
 *
 * `clientEmail` is what turns this from an internal request into a client
 * sign-off: `submitReview` mints a review token when it receives one and emails
 * the client the `/review/<token>` link. Omitted, the submission goes to the
 * internal admin queue only and no link is ever issued — the two paths the
 * `submitReviewInput` schema documents.
 */
export async function submitForReview(
  note?: string,
  changeSummary?: string,
  clientEmail?: string,
): Promise<void> {
  const siteId = currentSiteId();
  if (!siteId) throw new Error("No site to send for review");
  await getBuildrikClient(DASHBOARD_URL).reviews.submit.mutate({
    siteId,
    note,
    changeSummary,
    clientEmail,
  });
}
