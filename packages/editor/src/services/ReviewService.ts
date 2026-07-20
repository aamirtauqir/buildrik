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
 * sign-off. `submitReview` always mints (or, on re-send, replaces) a review
 * token; supplying `clientEmail` additionally records the invited address and
 * emails the client the `/review/<token>` link. Omitted, a token is still
 * created but no invite is sent and the review page rejects unidentified
 * visitors — effectively internal, though a tokenised record exists.
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
