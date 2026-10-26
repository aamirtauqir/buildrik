/**
 * LintSection — Brand › Checks, Figma 2L9 B6-B18.
 *
 * One card, a row per finding: what is wrong over what the finding says,
 * ending in the board's three actions — Open (the token's page), Fix (when
 * the finding carries an auto-fix hint; one write, one ⌘Z) and Ignore (the
 * token's findings are hidden: `lintState.suppress`). "Show ignored · N"
 * lists what was ignored, each with Restore. Errors sort first.
 *
 * Contrast findings carry a `contrast:<surface>` hint; the fixed value is
 * `suggestContrastFix`'s, searched to AA against the page colour (DQ-010).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { LintIssue, LintRuleId } from "@/engine/designSystem/linter";
import type { DesignToken } from "@/editor/design-system/types";
import { suggestContrastFix } from "@/engine/designSystem/colorMath";
import { findSurfaceToken, resolveSurface } from "@/editor/design-system/utils/contrastLint";
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
  /** Hide a token's findings (B6-B18 "Ignore"). */
  onIgnore?: (tokenId: string) => void;
  /** The ignored tokens and their findings — "Show ignored · N". */
  ignored?: ReadonlyArray<{ tokenId: string; rule?: LintRuleId; message?: string }>;
  onRestore?: (tokenId: string) => void;
}

/* The door to Connect to tokens: BRP1-M7 draws the check as a page under
   Brand checks (the nav keeps Brand checks current there) but no board draws
   its entry row — it is one 48px row in the page's own card style. */
const ConnectDoor: React.FC<{ onConnect?: () => void }> = ({ onConnect }) =>
  onConnect ? (
    <div className="tw:mt-4">
    <BrandCard label="More checks" data-testid="brand-checks-more">
      <BrandRow
        name="Connect to Brand colors"
        sub="Use a color token where a page has the same color typed in"
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
  "missing-dark": "Missing dark value",
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

export const LintSection: React.FC<LintSectionProps> = ({ issues, onFix, onOpen, onConnect, onIgnore, ignored = [], onRestore }) => {
  const [showIgnored, setShowIgnored] = React.useState(false);
  const ordered = [...issues].sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1,
  );

  const ignoredBlock = ignored.length > 0 && (
    <div className="tw:mt-4 tw:flex tw:flex-col tw:gap-2">
      <Button
        type="button"
        variant="link"
        size="xs"
        aria-expanded={showIgnored}
        onClick={() => setShowIgnored((v) => !v)}
        data-testid="brand-checks-show-ignored"
        className={`${ACTION} tw:self-start tw:text-[var(--bk-accent-text)]`}
      >
        {showIgnored ? "Hide ignored" : `Show ignored · ${ignored.length}`}
      </Button>
      {showIgnored && (
        <BrandCard label="Ignored checks" data-testid="brand-checks-ignored-list">
          {ignored.map(({ tokenId, rule, message }) => (
            <BrandRow
              key={tokenId}
              name={rule ? (RULE_LABEL[rule] ?? rule) : tokenId}
              sub={message ?? tokenId}
              trailing={
                onRestore && (
                  <Button size="xs" variant="link" onClick={() => onRestore(tokenId)} data-testid={`brand-check-restore-${tokenId}`} className={`${ACTION} tw:text-[var(--bk-accent-text)]`}>
                    Restore
                  </Button>
                )
              }
            />
          ))}
        </BrandCard>
      )}
    </div>
  );

  if (ordered.length === 0) {
    return (
      <>
      <div className="tw:py-6 tw:text-center" data-testid="brand-checks-empty">
        <div className="tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]">Nothing to fix</div>
        <div className="tw:mt-1 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Every token passes the brand rules.
        </div>
      </div>
      {ignoredBlock}
      <ConnectDoor onConnect={onConnect} />
      </>
    );
  }

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
            sub={issue.message}
            trailing={
              <span className="tw:flex tw:flex-none tw:items-center tw:gap-3">
                {onOpen && (
                  <Button size="xs" variant="link" onClick={() => onOpen(issue.tokenId)} data-testid={`brand-check-open-${issue.tokenId}`} className={`${ACTION} tw:text-[var(--bk-accent-text)]`}>
                    Open
                  </Button>
                )}
                {fixable && (
                  <Button size="xs" variant="link" onClick={() => onFix?.(issue)} data-testid={`brand-check-fix-${issue.tokenId}`} className={`${ACTION} tw:text-[var(--bk-error-text)]`}>
                    Fix
                  </Button>
                )}
                {onIgnore && (
                  <Button size="xs" variant="link" onClick={() => onIgnore(issue.tokenId)} data-testid={`brand-check-ignore-${issue.tokenId}`} className={`${ACTION} tw:text-[var(--bk-ink-soft)]`}>
                    Ignore
                  </Button>
                )}
              </span>
            }
          />
        );
      })}
    </BrandCard>
    {ignoredBlock}
    <ConnectDoor onConnect={onConnect} />
    </>
  );
};

export default LintSection;
