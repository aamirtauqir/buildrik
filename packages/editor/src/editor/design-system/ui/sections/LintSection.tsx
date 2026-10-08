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
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

export interface LintSectionProps {
  issues: readonly LintIssue[];
  /** Stage the auto-fix for a finding that carries a hint. */
  onFix?: (issue: LintIssue) => void;
  /** Go to the finding's token. */
  onOpen?: (tokenId: string) => void;
  /** The Connect to tokens check (BRP1-M7) — a page under Brand checks. */
  onConnect?: () => void;
}

/* The door to Connect to tokens: BRP1-M7 draws the check as a page under
   Brand checks (the nav keeps Brand checks current there) but no board draws
   its entry row — it is one 48px row in the page's own card style. */
const ConnectDoor: React.FC<{ onConnect?: () => void }> = ({ onConnect }) =>
  onConnect ? (
    <div className="tw:mt-4">
    <BrandCard label="More checks" data-testid="brand-checks-more">
      <BrandRow
        name="Connect to tokens"
        sub="Bind raw values that exactly match a token"
        trailing={<BrandChevron />}
        onSelect={onConnect}
        data-testid="brand-check-connect"
      />
    </BrandCard>
    </div>
  ) : null;

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
  "theme-toggle-hidden": "Theme toggle hidden — Dark mode is off",
  "dark-mode-pair": "Dark mode — fixed colour on a token that turns dark",
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
  const surface = resolveSurface(findSurfaceToken(colorTokens), colorTokens, mode);
  const light = resolveTokenLiteral(colorTokens, token.id, "light") ?? "";
  const darkValue = token.modes.dark ? resolveTokenLiteral(colorTokens, token.id, "dark") : null;
  if (mode === "dark" && darkValue) {
    const dark = suggestContrastFix(darkValue, surface);
    return dark ? { value: light, darkValue: dark } : null;
  }
  const value = suggestContrastFix(light, surface);
  return value ? { value } : null;
}

/** "N issues · auto-fix available" — the page header's caption. */
export function brandChecksCaption(issues: readonly LintIssue[], ignored = 0): string {
  const n = issues.length;
  const base = `${n} issue${n === 1 ? "" : "s"}`;
  const withFix = issues.some((i) => i.autoFixHint) ? `${base} · auto-fix available` : base;
  /* G3-123: the "Warnings suppressed" pill became this suffix. */
  return ignored > 0 ? `${withFix} · ${ignored} ignored` : withFix;
}

export const LintSection: React.FC<LintSectionProps> = ({ issues, onFix, onOpen, onConnect }) => {
  if (issues.length === 0) {
    return (
      <>
      <div className="tw:py-6 tw:text-center" data-testid="brand-checks-empty">
        <div className="tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]">Nothing to fix</div>
        <div className="tw:mt-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Every token passes the brand rules.
        </div>
      </div>
      <ConnectDoor onConnect={onConnect} />
      </>
    );
  }

  const ordered = [...issues].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
  );

  return (
    <>
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
    <ConnectDoor onConnect={onConnect} />
    </>
  );
};

export default LintSection;
