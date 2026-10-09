/**
 * useSiteOrigin — the host the published site's absolute URLs sit on, the way
 * the publish worker chooses it (`siteOrigin`: typed canonical → verified
 * primary domain → published URL). The composer holds only the published URL;
 * the canonical and the custom domains are server facts, read once per site.
 * Copy link, the page drawer's search preview and the ZIP sitemap all name
 * their host through this, so none of them reads a metadata field that does
 * not exist (SEO D2).
 *
 * Returns a getter, not a value: the published URL changes under a live
 * session, so the answer is computed from the composer at call time.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine/Composer";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { siteOrigin, type SiteDomainRow } from "@buildrik/shared/seo/urls";
import { devWarn } from "@/shared/utils/devLogger";

export function useSiteOrigin(composer: Composer | null, siteId: string | null | undefined): () => string | null {
  const [host, setHost] = React.useState<{ canonicalUrl: string | null; domains: SiteDomainRow[] }>({
    canonicalUrl: null,
    domains: [],
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
        if (!stale) setHost({ canonicalUrl: row.canonicalUrl ?? null, domains });
      })
      .catch((error) => devWarn("useSiteOrigin", "site origin read failed", error));
    return () => {
      stale = true;
    };
  }, [siteId]);

  return () => siteOrigin(host.domains, composer?.getProjectMetadata?.()?.publishedUrl, host.canonicalUrl);
}
