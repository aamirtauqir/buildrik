/**
 * AIPanel — D3 Stage 3 extraction (audit-remediation 2026-05-08).
 *
 * AI summary surface, split out of CompareView. Two distinct concerns
 * lived inside the diff-rendering component pre-Stage-3:
 *
 *   1. Cached/fresh result text (shown ABOVE the diff body when
 *      version.aiSummary OR aiSummaryState.result is truthy).
 *   2. The fetch button + cooldown countdown + error message
 *      (shown BELOW the diff body, regardless of result presence,
 *      so users can re-run after a 60s rate-limit window).
 *
 * Splitting them gives CompareView a single responsibility (diff
 * visualization) and lets the AI surface evolve independently —
 * model swap, rate-limit policy change, error UX etc. without
 * touching the diff renderer.
 *
 * Two exports rather than one with internal layout switching: the
 * top result and bottom control sit at different DOM positions
 * inside CompareView, so a single component would have to either
 * render in two places (impossible without portals) or be conditional
 * — the parent already orchestrates that split.
 *
 * @license BSD-3-Clause
 */

import { Button } from "@/editor/shared/vibcoder/Button";
import * as React from "react";

export interface AISummaryState {
  loading: boolean;
  result: string | null;
  error: string | null;
}

// ─── Result text bubble (top-of-CompareView) ──────────────────────────

export interface AIResultTextProps {
  /** Cached summary stored on the version row. */
  cachedSummary?: string | null;
  /** Live in-flight or just-completed summary state. */
  state: AISummaryState;
}

export function AIResultText({ cachedSummary, state }: AIResultTextProps) {
  const text = state.result ?? cachedSummary ?? null;
  if (!text) return null;
  return <div className="ai-summary">{text}</div>;
}

// ─── Controls: fetch button + error (bottom-of-CompareView) ───────────

export interface AIControlsProps {
  state: AISummaryState;
  onGetSummary: () => void;
  /** Seconds remaining until the next call is permitted (0 = ready). */
  cooldownSeconds: number;
}

export function AIControls({ state, onGetSummary, cooldownSeconds }: AIControlsProps) {
  const disabled = state.loading || cooldownSeconds > 0;
  const buttonLabel = state.loading
    ? "Generating..."
    : cooldownSeconds > 0
    ? `Get AI Summary (${cooldownSeconds}s)`
    : "Get AI Summary";

  return (
    <>
      <Button
        className={`ai-summary-btn${state.loading ? " loading" : ""}`}
        onClick={onGetSummary}
        disabled={disabled}
      >
        {state.loading ? (
          "Generating..."
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            {buttonLabel}
          </>
        )}
      </Button>
      {state.error && <p className="ai-summary-error">{state.error}</p>}
    </>
  );
}
