import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getShareDraftRows,
  recordShareView,
  resolveShareLink,
} from "@server/services/share-link.service";
import { SharePasswordGate } from "./password-gate";
import { DraftPreview } from "./draft-preview";

export const dynamic = "force-dynamic";

// A share link is a private capability URL — never index it. (Also sent as an
// X-Robots-Tag header for /share/* in next.config.mjs.)
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * /share/<token> renders the site's current SAVED draft — every live page,
 * read-only, no editor chrome — which is what the Share modal promises
 * ("current saved design"). It used to redirect to `site.publishedUrl` and show
 * "isn't published yet" for everything else.
 *
 * Token states: missing / revoked / expired / deleted site → the gate's
 * "no longer available" path; a password link without the signed unlock
 * cookie (set by /api/share/<token>/verify-password) → the password gate.
 */
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const jar = await cookies();
  const access = await resolveShareLink(token, jar.get(`share_${token}`)?.value);

  if (access.state !== "open") return <SharePasswordGate />;

  const [rows] = await Promise.all([getShareDraftRows(access.siteId), recordShareView(access.linkId)]);
  return <DraftPreview siteName={access.siteName} rows={rows} />;
}
