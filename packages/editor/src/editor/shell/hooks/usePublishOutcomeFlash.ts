/**
 * usePublishOutcomeFlash — the topbar's 2-second publish outcome (T5, plan D10).
 *
 * A publish job stays `published` for as long as the deployment is live, but
 * the bar's "✓ Published" is a moment, not a state: it says *that just worked*
 * and then hands the primary action back. So this maps a durable job state to a
 * transient display one, and nothing else — the toast is
 * `useExportHandlers`' job (eng D10), the announcement is `StudioHeader`'s.
 *
 * The flash restarts on every fresh outcome. Republishing after a failure has
 * to read as a new result, not as the tail of the old one.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

export type PublishOutcome = "published" | "failed";

/** How long the outcome stays on the bar before the action returns. */
export const PUBLISH_FLASH_MS = 2000;

export function usePublishOutcomeFlash(uiState: string): PublishOutcome | null {
  const [outcome, setOutcome] = React.useState<PublishOutcome | null>(null);

  React.useEffect(() => {
    if (uiState !== "published" && uiState !== "failed") return;
    setOutcome(uiState);
    const timer = window.setTimeout(() => setOutcome(null), PUBLISH_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [uiState]);

  return outcome;
}
