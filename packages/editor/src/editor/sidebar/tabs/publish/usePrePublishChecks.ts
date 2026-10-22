/**
 * The server's readiness list for one site (`runPrePublishChecks`), with its
 * load state. Shared by the Publish panel and the publish tray (design-2l9
 * Task 1.7) so the two read one list the same way: never a local
 * approximation, never a fake-passing list on a failed load (DF5), and
 * re-read when a publish settles, since a first deploy can resolve the Vercel
 * row.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { fetchPrePublishChecks } from "@/services/PublishService";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";

export interface PrePublishChecksState {
  checkState: "loading" | "ready" | "error";
  checks: PrePublishChecksResult | null;
  reload: () => Promise<void>;
}

export function usePrePublishChecks(siteId: string | null, publishUiState?: string): PrePublishChecksState {
  const [checkState, setCheckState] = React.useState<"loading" | "ready" | "error">("loading");
  const [checks, setChecks] = React.useState<PrePublishChecksResult | null>(null);

  const reload = React.useCallback(async () => {
    if (!siteId) {
      setCheckState("ready");
      setChecks(null);
      return;
    }
    setCheckState("loading");
    try {
      setChecks(await fetchPrePublishChecks(siteId));
      setCheckState("ready");
    } catch {
      setChecks(null);
      setCheckState("error");
    }
  }, [siteId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  React.useEffect(() => {
    if (publishUiState === "published" || publishUiState === "failed") void reload();
  }, [publishUiState, reload]);

  return { checkState, checks, reload };
}
