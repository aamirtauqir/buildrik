/**
 * useAISummary — D3 Stage 4 hook extraction (audit-remediation 2026-05-08).
 *
 * Encapsulates the AI summary state machinery formerly inlined in
 * VersionHistoryPanel.tsx:
 *   - per-version state map (loading / result / error)
 *   - 60s per-version rate-limit gate using a timestamp Map ref
 *   - cooldown countdown re-render via a tick state setter
 *   - cached-summary short-circuit (skips the fetch + cooldown)
 *   - fetch against `/api/trpc/ai.summarize` with the version's
 *     compare data
 *   - persist-back via the version-history hook's updateAiSummary
 *
 * Pre-extraction: lines 135-145 + 250-345 of VersionHistoryPanel.tsx
 * (state declarations + handleGetAiSummary callback + getCooldownSeconds
 * helper).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CompareResult, NamedVersion } from "../../../shared/types/versions";
import type { AISummaryState } from "./AIPanel";

const AI_COOLDOWN_MS = 60_000;

export interface UseAISummaryArgs {
  versions: NamedVersion[];
  compareResults: Record<string, CompareResult | null>;
  updateAiSummary: (versionId: string, summary: string) => Promise<void>;
}

export interface UseAISummaryResult {
  /** Per-version state. Empty record entries default to idle. */
  aiSummaryStates: Record<string, AISummaryState>;
  /** Trigger an AI summary for one version (rate-limited). */
  handleGetAiSummary: (versionId: string) => Promise<void>;
  /** Seconds until the next call is permitted (0 = ready). */
  getCooldownSeconds: (versionId: string) => number;
}

export function useAISummary({
  versions,
  compareResults,
  updateAiSummary,
}: UseAISummaryArgs): UseAISummaryResult {
  const [aiSummaryStates, setAiSummaryStates] = React.useState<
    Record<string, AISummaryState>
  >({});

  // Per-version timestamp of the last call. Map ref so updates don't
  // trigger re-renders (countdown re-renders are driven by setCooldownTick).
  const aiCallTimestamps = React.useRef<Map<string, number>>(new Map());

  // Tick counter forces a re-render once a cooldown expires so the
  // countdown UI clears even when nothing else changes.
  const [, setCooldownTick] = React.useState(0);

  const handleGetAiSummary = React.useCallback(
    async (versionId: string) => {
      const version = versions.find((v) => v.id === versionId);

      // Cached result: surface immediately, no rate-limit penalty.
      if (version?.aiSummary) {
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: {
            loading: false,
            result: version.aiSummary ?? null,
            error: null,
          },
        }));
        return;
      }

      // Rate-limit check.
      const lastCall = aiCallTimestamps.current.get(versionId) ?? 0;
      const elapsed = Date.now() - lastCall;
      if (elapsed < AI_COOLDOWN_MS) {
        const remaining = Math.ceil((AI_COOLDOWN_MS - elapsed) / 1000);
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: {
            loading: false,
            result: null,
            error: `Please wait ${remaining}s before requesting another summary`,
          },
        }));
        return;
      }

      // Record timestamp BEFORE fetch so a failed call still counts
      // (prevents retry spam).
      aiCallTimestamps.current.set(versionId, Date.now());
      // Schedule a re-render when the cooldown expires so the
      // countdown UI clears.
      setTimeout(() => setCooldownTick((n) => n + 1), AI_COOLDOWN_MS + 50);

      setAiSummaryStates((prev) => ({
        ...prev,
        [versionId]: { loading: true, result: null, error: null },
      }));

      try {
        const compareData = compareResults[versionId];
        if (!compareData) {
          throw new Error("Compare data not loaded yet");
        }
        const response = await fetch("/api/trpc/ai.summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            versionName: version?.name ?? "",
            changes: compareData,
          }),
        });

        if (!response.ok) throw new Error("AI summary unavailable");
        const json = await response.json();
        // tRPC HTTP endpoint wraps the result in { result: { data: T } }
        const summary: string =
          json?.result?.data?.summary ?? json?.summary ?? "";
        if (!summary) throw new Error("Empty summary returned");

        await updateAiSummary(versionId, summary);

        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: { loading: false, result: summary, error: null },
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Summary unavailable";
        setAiSummaryStates((prev) => ({
          ...prev,
          [versionId]: { loading: false, result: null, error: message },
        }));
      }
    },
    [compareResults, updateAiSummary, versions],
  );

  const getCooldownSeconds = React.useCallback((versionId: string) => {
    const last = aiCallTimestamps.current.get(versionId) ?? 0;
    if (last === 0) return 0;
    const remaining = AI_COOLDOWN_MS - (Date.now() - last);
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, []);

  return { aiSummaryStates, handleGetAiSummary, getCooldownSeconds };
}
