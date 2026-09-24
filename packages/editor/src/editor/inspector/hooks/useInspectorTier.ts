/**
 * useInspectorTier — Beginner / Pro, remembered per user.
 *
 * Board 4428:141170 (Style tab · Beginner) hides the sections the registry
 * tags `tier: "advanced"` behind a "Show all (N more)" row; 4428:141406 (Pro)
 * shows everything. Decision #29 (plan 2026-09-21): the choice is a per-user
 * preference in localStorage, a new user starts on Beginner, and the
 * `?density=fewer` query parameter this replaces is gone — it trimmed to the
 * first three sections by POSITION, which is not what either board draws.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type InspectorTier = "beginner" | "pro";

const STORAGE_KEY = "buildrick-inspector-tier";

function readStoredTier(): InspectorTier {
  if (typeof window === "undefined") return "beginner";
  try {
    return localStorage.getItem(STORAGE_KEY) === "pro" ? "pro" : "beginner";
  } catch {
    return "beginner";
  }
}

export function useInspectorTier(): [InspectorTier, (next: InspectorTier) => void] {
  const [tier, setTierState] = React.useState<InspectorTier>(readStoredTier);
  const setTier = React.useCallback((next: InspectorTier) => {
    setTierState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the choice still holds for this session */
    }
  }, []);
  return [tier, setTier];
}
