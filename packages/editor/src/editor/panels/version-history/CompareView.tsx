/**
 * CompareView — D3 Stage 2 extraction (audit-remediation 2026-05-08).
 *
 * Renders the inline detail section that appears below an expanded
 * version row: visual/semantic toggle, screenshot diptych, change-list
 * summary badges, AI summary button + result/error.
 *
 * Pre-extraction: lines 39-236 of VersionHistoryPanel.tsx (interface
 * + toggle-pill style constants + function body). All references to
 * NamedVersion, CompareResult, aiSummaryState are passed via props
 * — CompareView is leaf-level and doesn't reach into the orchestrator's
 * state machinery.
 *
 * Stage 3 (next) will further split AI summary state + button + error
 * out of this file into AIPanel.tsx so the diff/visual rendering and
 * the AI surface stop bundling concerns.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { CompareResult, NamedVersion } from "../../../shared/types/versions";
import { AIResultText, AIControls } from "./AIPanel";
import { Button } from "@/editor/chrome-ui";
// ─── Style constants ──────────────────────────────────────────────────

const TOGGLE_PILL_CONTAINER: React.CSSProperties = {
  display: "inline-flex",
  gap: 2,
  padding: 2,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--bk-border)",
  borderRadius: 999,
  marginBottom: 8,
};

const TOGGLE_PILL_BTN: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 500,
  color: "var(--bk-ink-muted)",
  background: "transparent",
  border: "none",
  borderRadius: 999,
  cursor: "pointer",
  transition: "background 150ms ease-out, color 150ms ease-out",
};

const TOGGLE_PILL_ACTIVE: React.CSSProperties = {
  ...TOGGLE_PILL_BTN,
  background: "var(--bk-accent)",
  color: "var(--bk-accent-on)",
};

const TOGGLE_PILL_DISABLED: React.CSSProperties = {
  ...TOGGLE_PILL_BTN,
  opacity: 0.4,
  cursor: "not-allowed",
};

// ─── Props ────────────────────────────────────────────────────────────

export interface CompareViewProps {
  version: NamedVersion;
  compareResult: CompareResult | null;
  currentVisualSnapshot: string | null;
  aiSummaryState: { loading: boolean; result: string | null; error: string | null };
  onGetAiSummary: () => void;
  aiCooldownSeconds: number;
}

// ─── Component ────────────────────────────────────────────────────────

export function CompareView({
  version,
  compareResult,
  currentVisualSnapshot,
  aiSummaryState,
  onGetAiSummary,
  aiCooldownSeconds,
}: CompareViewProps) {
  const { summary, changes } = compareResult ?? { summary: null, changes: [] };

  const hasVisual = Boolean(version.visualSnapshot || currentVisualSnapshot);
  const [mode, setMode] = React.useState<"visual" | "semantic">(
    hasVisual ? "visual" : "semantic",
  );

  // Force semantic if no visuals exist (e.g., version saved before
  // snapshots shipped).
  React.useEffect(() => {
    if (!hasVisual && mode === "visual") setMode("semantic");
  }, [hasVisual, mode]);

  return (
    <div className="compare-view">
      {/* Visual / Semantic toggle */}
      <div style={TOGGLE_PILL_CONTAINER} role="tablist" aria-label="Compare mode">
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "visual"}
          style={
            hasVisual
              ? mode === "visual"
                ? TOGGLE_PILL_ACTIVE
                : TOGGLE_PILL_BTN
              : TOGGLE_PILL_DISABLED
          }
          onClick={() => hasVisual && setMode("visual")}
          disabled={!hasVisual}
          title={hasVisual ? undefined : "No visual snapshot available for this version."}
        >
          Visual
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={mode === "semantic"}
          style={mode === "semantic" ? TOGGLE_PILL_ACTIVE : TOGGLE_PILL_BTN}
          onClick={() => setMode("semantic")}
        >
          Semantic
        </Button>
      </div>
      {/* AI Summary text — shown ABOVE the diff body when a result
          (cached or fresh) exists. Component lives in ./AIPanel.tsx. */}
      <AIResultText cachedSummary={version.aiSummary} state={aiSummaryState} />
      {/* Visual mode — screenshots side-by-side */}
      {mode === "visual" && hasVisual && (
        <div className="compare-screenshots">
          {currentVisualSnapshot && (
            <div className="screenshot-thumb">
              <img src={currentVisualSnapshot} alt="Current" />
              <span className="screenshot-label">Current</span>
            </div>
          )}
          {version.visualSnapshot && (
            <div className="screenshot-thumb">
              <img src={version.visualSnapshot} alt={version.name} />
              <span className="screenshot-label">{version.name}</span>
            </div>
          )}
        </div>
      )}
      {/* Change summary badges — shown in both modes */}
      {summary && (
        <div className="diff-summary-badges">
          {summary.style > 0 && (
            <span className="diff-summary-badge style">{summary.style} style</span>
          )}
          {summary.text > 0 && (
            <span className="diff-summary-badge text">{summary.text} text</span>
          )}
          {summary.layout > 0 && (
            <span className="diff-summary-badge layout">{summary.layout} layout</span>
          )}
          {summary.content > 0 && (
            <span className="diff-summary-badge content">{summary.content} content</span>
          )}
          {summary.other > 0 && (
            <span
              className="diff-summary-badge"
              style={{
                background: "rgba(144,141,133,0.15)",
                color: "var(--bk-ink-muted)",
              }}
            >
              {summary.other} other
            </span>
          )}
        </div>
      )}
      {/* Page-level add/remove counts (Wave 1 CompareSummary fields) */}
      {summary && (summary.pagesAdded > 0 || summary.pagesDeleted > 0) && (
        <p style={{ fontSize: 11, color: "var(--bk-ink-muted)", margin: "4px 0 0" }}>
          {summary.pagesAdded > 0 &&
            `${summary.pagesAdded} page${summary.pagesAdded === 1 ? "" : "s"} added`}
          {summary.pagesAdded > 0 && summary.pagesDeleted > 0 && ", "}
          {summary.pagesDeleted > 0 &&
            `${summary.pagesDeleted} page${summary.pagesDeleted === 1 ? "" : "s"} removed`}
        </p>
      )}
      {/* Board 168:82 states the rule in its own annotation: "No panes render —
          an empty diff view reads as broken." Two ways to land here and they
          are different facts, so they get different sentences: the panel skips
          the diff entirely when the clicked version IS the newest (nothing to
          compare it against), and a computed diff can come back empty. Before
          this, both rendered a toggle over blank space. */}
      {mode === "semantic" && changes.length === 0 && (
        <p className="tw:mt-[var(--bk-space-8)] tw:mb-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)] tw:text-center">
          {compareResult === null
            ? "This is the newest version — there is nothing later to compare it against."
            : `Nothing changed since “${version.name}”.`}
        </p>
      )}
      {/* Semantic mode — change list */}
      {mode === "semantic" && changes.length > 0 && (
        <div className="diff-change-list">
          {changes.slice(0, 20).map((change, i) => (
            <div key={i} className="diff-change">
              <span
                className={`diff-op ${
                  !change.before ? "add" : !change.after ? "remove" : "replace"
                }`}
              >
                {!change.before ? "+" : !change.after ? "−" : "~"}
              </span>
              <span className="diff-change-prop">{change.property}</span>
              {change.before && (
                <span className="diff-change-val before">{change.before}</span>
              )}
              {change.after && (
                <span className="diff-change-val after">{change.after}</span>
              )}
            </div>
          ))}
          {changes.length > 20 && (
            <p style={{ fontSize: 11, color: "var(--bk-ink-muted)", marginTop: 4 }}>
              +{changes.length - 20} more changes
            </p>
          )}
        </div>
      )}
      {/* AI Summary controls — button + cooldown countdown + error.
          Component lives in ./AIPanel.tsx. */}
      <AIControls
        state={aiSummaryState}
        onGetSummary={onGetAiSummary}
        cooldownSeconds={aiCooldownSeconds}
      />
    </div>
  );
}
