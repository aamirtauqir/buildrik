/**
 * useDynamicPagesSummary — FC-1 (fix-all 2026-09-25).
 *
 * Pages only ever listed the site's real Page rows; a CMS collection with a
 * `pageSlugPattern` set silently generates more pages at publish time that
 * never showed up here at all. This computes how many, for a read-only
 * "+N from collections ›" row (PagesTab renders it, PageList stays business-
 * logic-free per its own header comment).
 *
 * Uses the server's `cms.dynamicPages` query (server/trpc/routers/cms.ts:84,
 * `resolveDynamicPages`) rather than re-deriving slugs client-side (the way
 * `DynamicPagesPane`'s preview does) so the count always agrees with what a
 * publish will actually emit — including collision/pattern edge cases only
 * the server's `applyPattern` resolves.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../../engine";
import { EVENTS } from "@/shared/constants/events";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

export interface DynamicPagesSummary {
  /** Total published dynamic pages across every page-generating collection. */
  count: number;
  /** The first page-generating collection with output — where the row's "›"
   *  opens (CMS has no single "every collection's dynamic pages" screen). */
  collectionId: string | null;
  /** Each page-generating collection's own count — the template page's
   *  delete confirm names what stops publishing (EDT-057). */
  byCollection: Record<string, number>;
}

const EMPTY: DynamicPagesSummary = { count: 0, collectionId: null, byCollection: {} };

export function useDynamicPagesSummary(composer: Composer | null): DynamicPagesSummary {
  const [summary, setSummary] = React.useState<DynamicPagesSummary>(EMPTY);

  React.useEffect(() => {
    if (!composer) {
      setSummary(EMPTY);
      return;
    }
    let cancelled = false;

    const recompute = () => {
      const siteId = getSiteIdFromUrl();
      // Optional chaining: test doubles for Composer are commonly a partial
      // mock with no `cms` manager at all (real Composer always has one).
      const pageCollections = (composer.cms?.collections.getAllCollections() ?? []).filter(
        (c) => !!c.pageSlugPattern
      );
      if (!siteId || pageCollections.length === 0) {
        if (!cancelled) setSummary(EMPTY);
        return;
      }
      Promise.all(
        pageCollections.map((c) =>
          client()
            .cms.dynamicPages.query({ siteId, collectionId: c.id })
            // Best-effort: one collection's server error should not blank the
            // whole row's count for the collections that did resolve.
            .then((pages) => ({ id: c.id, count: pages.length }))
            .catch(() => ({ id: c.id, count: 0 }))
        )
      ).then((results) => {
        if (cancelled) return;
        setSummary({
          count: results.reduce((sum, r) => sum + r.count, 0),
          collectionId: results.find((r) => r.count > 0)?.id ?? null,
          byCollection: Object.fromEntries(results.map((r) => [r.id, r.count])),
        });
      });
    };

    /* These are the CollectionManager's OWN events — it is a separate emitter
       from the composer (X-6: subscribed on the composer, the row computed
       once against a store not yet loaded and never heard the refresh). The
       entry events matter too: the count is PUBLISHED entries only. */
    const store = composer.cms?.collections;
    const storeEvents = [
      EVENTS.CMS_STORE_REFRESHED,
      EVENTS.CMS_COLLECTION_CREATED,
      EVENTS.CMS_COLLECTION_UPDATED,
      EVENTS.CMS_COLLECTION_DELETED,
      EVENTS.CMS_CONTENT_PUBLISHED,
      EVENTS.CMS_CONTENT_UNPUBLISHED,
      EVENTS.CMS_CONTENT_DELETED,
    ] as const;
    recompute();
    storeEvents.forEach((ev) => store?.on(ev, recompute));
    return () => {
      cancelled = true;
      storeEvents.forEach((ev) => store?.off(ev, recompute));
    };
  }, [composer]);

  return summary;
}
