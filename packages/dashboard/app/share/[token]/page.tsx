import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  getShareDraftRows,
  recordShareView,
  resolveShareLink,
} from "@server/services/share-link.service";
import { SharePasswordGate } from "./password-gate";
import { DraftPreview } from "./draft-preview";
import { ShareUnavailable } from "./unavailable";

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
 * Token states: unknown / revoked (or deleted site) / expired → their own
 * "no longer available" card (it used to be the password gate for all of
 * them); a password link without the signed unlock cookie (set by
 * /api/share/<token>/verify-password) → the password gate. `?page=<slug>`
 * opens that page; an unknown slug opens the first.
 */
export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const jar = await cookies();
  const access = await resolveShareLink(token, jar.get(`share_${token}`)?.value);

  if (access.state === "unavailable") return <ShareUnavailable reason={access.reason} />;
  if (access.state === "locked") return <SharePasswordGate />;

  const page = (await searchParams)?.page;
  const [rows] = await Promise.all([getShareDraftRows(access.siteId), recordShareView(access.linkId)]);
  return (
    <DraftPreview
      siteName={access.siteName}
      rows={rows}
      initialPage={typeof page === "string" ? page : null}
    />
  );
}
