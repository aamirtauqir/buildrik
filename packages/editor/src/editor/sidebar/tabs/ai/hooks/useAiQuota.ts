/**
 * useAiQuota — the daily AI counter the boards draw ("7 left today" in the
 * prompt field, 4418:104313; "7 generations left today", 5946:51667) — G2-129.
 *
 * Reads `ai.quota` → { used, limit, resetsAt } (aiQuotaSchema). `limit === -1`
 * is unlimited: no count is drawn (never "of -1"). While loading or failing
 * the read returns null and nothing is drawn — no number without a source.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AiQuota } from "@buildrik/shared/schemas/ai";
import { getAiSubscriptionClient } from "@/services/ai/subscriptionClient";

/** The quota, or null when the read fails. */
export async function fetchAiQuota(): Promise<AiQuota | null> {
  try {
    return await getAiSubscriptionClient().ai.quota.query();
  } catch {
    return null;
  }
}

/** "7 left today" / "7 generations left today"; null when unlimited. */
export function quotaLeftLabel(q: AiQuota, noun?: string): string | null {
  if (q.limit === -1) return null;
  const left = Math.max(0, q.limit - q.used);
  return `${left} ${noun ? `${noun} ` : ""}left today`;
}

/** Read once on mount, and again whenever `refreshKey` changes (a run ending
 *  spends one). */
export function useAiQuota(refreshKey?: unknown): AiQuota | null {
  const [quota, setQuota] = React.useState<AiQuota | null>(null);
  React.useEffect(() => {
    let live = true;
    void fetchAiQuota().then((q) => live && setQuota(q));
    return () => {
      live = false;
    };
  }, [refreshKey]);
  return quota;
}
