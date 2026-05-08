/**
 * Phase F.1 / Tier-1 wireframe S09C: Design tab DS lint aggregate banner.
 *
 * Renders a single amber banner at the top of the Design tab summarizing
 * all lint issues by rule, with Review-all + Dismiss actions. Two other
 * surfaces from the wireframe (per-token row + Inspector chip) ship in
 * later tiers.
 *
 * Wires to:
 *   - composer.dsLinter.lint(tokens) (H.0) — pure call, debounced by caller
 *   - DESIGN.md compliance: amber accent, no purple/violet, cobalt for CTA
 *
 * Out-of-scope:
 *   - Auto-fix actions per rule (Phase F.2)
 *   - Suppression / "Ignore" wiring (Phase F.2)
 *   - Token-row inline warning (S09A — separate sub-phase)
 *   - Inspector chip with contrast-on-binding warning (S09B — Inspector phase)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { LintIssue, LintRuleId } from "../linter";

export interface DSLintBannerProps {
  issues: readonly LintIssue[];
  onReviewAll?: () => void;
  /** When defined, banner shows Dismiss button which calls this callback. */
  onDismiss?: () => void;
}

const RULE_LABEL: Record<LintRuleId, string> = {
  "banned-hue": "banned hue (purple/violet/indigo)",
  "pure-black": "pure-black value",
  "empty-value": "empty token value",
  "missing-dark": "missing dark variant",
};

export const DSLintBanner: React.FC<DSLintBannerProps> = ({
  issues,
  onReviewAll,
  onDismiss,
}) => {
  if (issues.length === 0) return null;

  const byRule = React.useMemo(() => {
    const map = new Map<LintRuleId, number>();
    for (const issue of issues) {
      map.set(issue.rule, (map.get(issue.rule) ?? 0) + 1);
    }
    return map;
  }, [issues]);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.length - errorCount;

  const tone = errorCount > 0 ? "error" : "warning";
  const headline =
    errorCount > 0
      ? `${errorCount} DS error${errorCount === 1 ? "" : "s"}` +
        (warnCount > 0 ? ` · ${warnCount} warning${warnCount === 1 ? "" : "s"}` : "")
      : `${warnCount} DS warning${warnCount === 1 ? "" : "s"}`;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`bd-ds-lint-banner bd-ds-lint-banner--${tone}`}
      style={{
        background: tone === "error" ? "var(--bd-error-tint, #fee2e2)" : "var(--bd-warning-tint, #fef9c3)",
        borderLeft: `3px solid ${tone === "error" ? "var(--bd-error, #dc2626)" : "var(--bd-warning, #eab308)"}`,
        padding: "10px 12px",
        borderRadius: "0 6px 6px 0",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 600 }}>{headline}</div>
      <ul
        style={{
          listStyle: "none",
          fontSize: 11,
          color: "var(--bd-text, #0f172a)",
          marginTop: 6,
          padding: 0,
          lineHeight: 1.7,
        }}
      >
        {Array.from(byRule.entries()).map(([rule, count]) => (
          <li key={rule}>
            {count} {RULE_LABEL[rule] ?? rule}
          </li>
        ))}
      </ul>
      {(onReviewAll || onDismiss) && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {onReviewAll && (
            <button
              type="button"
              className="bd-btn bd-btn--primary"
              onClick={onReviewAll}
              style={{ fontSize: 10 }}
            >
              Review all
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="bd-btn bd-btn--ghost"
              onClick={onDismiss}
              style={{ fontSize: 10 }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
};
