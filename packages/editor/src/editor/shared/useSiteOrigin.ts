/**
 * useSiteOrigin — the host the published site's absolute URLs sit on, the way
 * the publish worker chooses it (`siteOrigin`: typed canonical → verified
 * primary domain → published URL). The composer holds only the published URL;
 * the canonical and the custom domains are server facts, read once per site.
 * Copy link, the page drawer's search preview and the ZIP sitemap all name
 * their host through this, so none of them reads a metadata field that does
 * not exist (SEO D2).
 *
 * The origin is a getter, not a value: the published URL changes under a live
 * session, so the answer is computed from the composer at call time.
 *
 * `servesCleanUrls` (BD-39 (4)) says whether the LIVE deploy serves `/about`
 * or only `/about.html` — the server reads it off the last publish's own
 * vercel.json. Until it is known, false: a `.html` link opens on either
 * deploy (cleanUrls 308s it), a clean one 404s on an old one. It is read once
 * per site, so a publish inside this session flips it on the next load.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { siteOrigin, type SiteDomainRow } from "@buildrik/shared/seo/urls";
import { devWarn } from "@/shared/utils/devLogger";

interface SiteHost {
  getOrigin: () => string | null;
  servesCleanUrls: boolean;
}

export function useSiteOrigin(composer: Composer | null, siteId: string | null | undefined): SiteHost {
  const [host, setHost] = React.useState<{ canonicalUrl: string | null; domains: SiteDomainRow[]; servesCleanUrls: boolean }>({
    canonicalUrl: null,
    domains: [],
    servesCleanUrls: false,
  });

  React.useEffect(() => {
    if (!siteId) return;
    let stale = false;
    const client = getBuildrikClient(DASHBOARD_URL);
    Promise.all([
      client.siteDetail.settings.get.query({ siteId }),
      client.siteDetail.domains.list.query({ siteId }).catch((): SiteDomainRow[] => []),
    ])
      .then(([row, domains]) => {
        if (!stale) setHost({ canonicalUrl: row.canonicalUrl ?? null, domains, servesCleanUrls: row.servesCleanUrls === true });
      })
      .catch((error) => devWarn("useSiteOrigin", "site origin read failed", error));
    return () => {
      stale = true;
    };
  }, [siteId]);

  return {
    getOrigin: () => siteOrigin(host.domains, composer?.getProjectMetadata?.()?.publishedUrl, host.canonicalUrl),
    servesCleanUrls: host.servesCleanUrls,
  };
}
