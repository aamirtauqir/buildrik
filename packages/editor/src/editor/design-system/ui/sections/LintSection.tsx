/**
 * LintSection — Brand › Brand checks, board 7316:84555 (C1 (ii); was the
 * drawer's Lint destination, 154:2).
 *
 * One card, a 48px row per finding: what is wrong over the token it is about,
 * ending in `Fix` (red) when the finding carries an auto-fix hint, `Open`
 * (accent) otherwise. Errors sort first — a banned hue is a shipping blocker,
 * a missing dark variant is a gap.
 *
 * The drawer's note said no rule sets `autoFixHint`. That stopped being true:
 * contrast findings carry `darken-22` / `lighten-22` (utils/contrastLint).
 * Fix STAGES the fixed value in the draft, the same as any edit on these
 * pages — the Draft chip lights, the live preview repaints, Save applies it.
 * For contrast the value is `suggestContrastFix`'s — searched to AA against
 * the customer's page — not the hint's fixed 22% shift, which measured live
 * took #EEEEEE to #B6B6B6 (still ~2:1) and left the finding standing.
 * Open goes to the token's own page with its card open.
 *
 * The header's "Run checks" (the workspace's page action) re-runs them now;
 * they also run by themselves on every staged edit (useDSLint, debounced).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { LintIssue, LintRuleId } from "../../../../engine/designSystem/linter";
import type { DesignToken } from "../../types";
import { suggestContrastFix } from "../../utils/contrastFix";
import { findSurfaceToken, resolveSurface } from "../../utils/contrastLint";
import { Button } from "@/editor/chrome-ui";
import { BrandCard, BrandRow } from "../BrandCard";

export interface LintSectionProps {
  issues: readonly LintIssue[];
  /** Stage the auto-fix for a finding that carries a hint. */
  onFix?: (issue: LintIssue) => void;
  /** Go to the finding's token. */
  onOpen?: (tokenId: string) => void;
}

/** What is wrong, as the row's title (7316:84555: "Banned hue — purple / violet"). */
const RULE_LABEL: Record<LintRuleId, string> = {
  contrast: "Contrast — fails WCAG AA on the page",
  "banned-hue": "Banned hue — purple, violet or indigo",
  "pure-black": "Pure black",
  "empty-value": "Empty value",
  "missing-dark": "No dark variant",
  "unresolved-binding": "Unresolved binding",
  "alias-depth-exceeded": "Alias chain too deep",
  "semantic-needs-alias": "Semantic token needs an alias",
};

const ACTION = "tw:h-auto tw:min-h-0 tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5";

/**
 * The staged edit a Fix makes — the value the page SHOWS in `mode` (light
 * value, or the dark one in dark mode) searched to AA against the page colour.
 * Null when there is nothing to change.
 */
export function contrastFixFor(
  token: DesignToken,
  colorTokens: readonly DesignToken[],
  mode: "light" | "dark",
): { value: string; darkValue?: string } | null {
  const surface = resolveSurface(findSurfaceToken(colorTokens), mode);
  if (mode === "dark" && token.darkValue) {
    const dark = suggestContrastFix(token.darkValue, surface);
    return dark ? { value: token.value, darkValue: dark } : null;
  }
  const value = suggestContrastFix(token.value, surface);
  return value ? { value } : null;
}

/** "N issues · auto-fix available" — the page header's caption. */
export function brandChecksCaption(issues: readonly LintIssue[]): string {
  const n = issues.length;
  const base = `${n} issue${n === 1 ? "" : "s"}`;
  return issues.some((i) => i.autoFixHint) ? `${base} · auto-fix available` : base;
}

export const LintSection: React.FC<LintSectionProps> = ({ issues, onFix, onOpen }) => {
  if (issues.length === 0) {
    return (
      <div className="tw:py-6 tw:text-center" data-testid="brand-checks-empty">
        <div className="tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]">Nothing to fix</div>
        <div className="tw:mt-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Every token passes the brand rules.
        </div>
      </div>
    );
  }

  const ordered = [...issues].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
  );

  return (
    <BrandCard label="Brand checks" data-testid="brand-checks-list">
      {ordered.map((issue) => {
        const key = `${issue.rule}:${issue.tokenId}`;
        const fixable = Boolean(issue.autoFixHint && onFix);
        return (
          <BrandRow
            key={key}
            data-lint-row={key}
            data-severity={issue.severity}
            title={issue.message}
            name={RULE_LABEL[issue.rule] ?? issue.rule}
            sub={issue.tokenId}
            trailing={
              fixable ? (
                <Button
                  size="xs"
                  variant="link"
                  onClick={() => onFix?.(issue)}
                  data-testid={`brand-check-fix-${issue.tokenId}`}
                  className={`${ACTION} tw:text-[var(--bk-error-text)]`}
                >
                  Fix
                </Button>
              ) : onOpen ? (
                <Button
                  size="xs"
                  variant="link"
                  onClick={() => onOpen(issue.tokenId)}
                  data-testid={`brand-check-open-${issue.tokenId}`}
                  className={`${ACTION} tw:text-[var(--bk-accent-text)]`}
                >
                  Open
                </Button>
              ) : undefined
            }
          />
        );
      })}
    </BrandCard>
  );
};

export default LintSection;
