/**
 * usePageCapacity — how many pages this site may have, for New page's
 * capacity line (design-2l9 boards 101:29978 "6 of 10 pages on Free",
 * 101:38257 reached, 101:38980 checking, 101:39695 unavailable).
 *
 * The limit is the one the server enforces when the editor saves
 * (`sites.service` assertPageLimit, PAGE_LIMIT), read from
 * `siteDetail.settingsOverview` → `billing.pagesPerSite` (-1 = unlimited).
 * Without a site id (the standalone demo) there is nothing to check.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { getBuildrikClient } from "@/services/api-client";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export type PageCapacity =
  | { state: "none" }
  | { state: "checking" }
  | { state: "unavailable" }
  | { state: "known"; plan: string; limit: number };

export function usePageCapacity(open: boolean): { capacity: PageCapacity; retry: () => void } {
  const [capacity, setCapacity] = React.useState<PageCapacity>({ state: "none" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    const siteId = getSiteIdFromUrl();
    if (!siteId) {
      setCapacity({ state: "none" });
      return;
    }
    let cancelled = false;
    setCapacity({ state: "checking" });
    getBuildrikClient(DASHBOARD_URL)
      .siteDetail.settingsOverview.query({ siteId })
      .then((o) => {
        if (cancelled) return;
        const plan = o.billing.plan;
        setCapacity({
          state: "known",
          plan: plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase(),
          limit: o.billing.pagesPerSite,
        });
      })
      .catch(() => {
        if (!cancelled) setCapacity({ state: "unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [open, attempt]);

  const retry = React.useCallback(() => setAttempt((n) => n + 1), []);
  return { capacity, retry };
}
