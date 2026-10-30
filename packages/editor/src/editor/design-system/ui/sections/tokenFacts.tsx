/**
 * A token's live facts and the read-outs both edit surfaces show
 * (TokenDetailView, the B6-B02 ColorTokenEditor): where it is used and that
 * list, its visible Brand-check findings and their line, the contrast the
 * line reports, and the tokens that alias it — each re-read on its own event.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine/Composer";
import type { DesignToken } from "@/editor/design-system/types";
import type { LintIssue } from "@/engine/designSystem/LintState";
import type { UsageRef } from "@/engine/designSystem/TokenUsageTracker";
import { calcContrastRatio } from "@/engine/designSystem/colorMath";
import { findSurfaceToken, resolveSurface, shownValue } from "@/editor/design-system/utils/contrastLint";
import { ELEMENT_TYPE_LABELS } from "@/shared/constants/elementTypeLabels";
import { Button } from "@/editor/chrome-ui";

const MONO = "tw:[font-family:var(--bk-font-mono)]";
const LINK = "tw:h-auto tw:min-h-5 tw:-my-0.5 tw:p-0 tw:text-[length:var(--bk-text-12)] tw:leading-4";

export function useTokenFacts(composer: Composer | null | undefined, tokenId: string, allTokens: ReadonlyArray<DesignToken> | undefined) {
  const tracker = composer?.designSystem?.tokenUsage;
  const readBreakdown = React.useCallback((): readonly UsageRef[] => tracker?.getBreakdown?.(tokenId) ?? [], [tracker, tokenId]);
  const [usageRefs, setUsageRefs] = React.useState<readonly UsageRef[]>(() => readBreakdown());
  React.useEffect(() => {
    if (!tracker) return;
    setUsageRefs(readBreakdown());
    const handler = () => setUsageRefs(readBreakdown());
    tracker.on("tokenUsage:changed", handler);
    return () => {
      tracker.off("tokenUsage:changed", handler);
    };
  }, [tracker, readBreakdown]);
  /* One element can bind the token several times (base, tablet, :hover) —
     the row says "elements", so count elements. */
  const usageCount = new Set(usageRefs.map((r) => r.elementId)).size;

  const lintState = composer?.designSystem?.lintState;
  const [lintIssues, setLintIssues] = React.useState<readonly LintIssue[]>(() => lintState?.getVisibleIssues?.(tokenId) ?? []);
  React.useEffect(() => {
    if (!lintState) return;
    setLintIssues(lintState.getVisibleIssues(tokenId));
    const handler = () => setLintIssues(lintState.getVisibleIssues(tokenId));
    lintState.on("lint:changed", handler);
    return () => {
      lintState.off("lint:changed", handler);
    };
  }, [lintState, tokenId]);

  /* Aliased by: reverse lookup via composer.aliasResolver (D6.a). */
  const aliasResolver = composer?.aliasResolver;
  const computeAliases = React.useCallback((): readonly DesignToken[] => {
    if (!aliasResolver || !allTokens || allTokens.length === 0) return [];
    return aliasResolver.findAliasesOf(tokenId, allTokens);
  }, [aliasResolver, allTokens, tokenId]);
  const [aliases, setAliases] = React.useState<readonly DesignToken[]>(() => computeAliases());
  React.useEffect(() => {
    setAliases(computeAliases());
    if (!composer || typeof composer.on !== "function") return;
    const handler = () => setAliases(computeAliases());
    composer.on("tokens:alias-changed", handler);
    return () => {
      composer.off?.("tokens:alias-changed", handler);
    };
  }, [composer, computeAliases]);

  return { tracker, usageRefs, usageCount, lintState, lintIssues, aliases };
}

/** "5.9:1 contrast on Background" — the token as the page shows it against the
 *  customer's page colour (never the editor's); null when not measurable. */
export function tokenContrastLine(token: DesignToken, tokens: ReadonlyArray<DesignToken>, mode: "light" | "dark" = "light"): string | null {
  const surface = findSurfaceToken(tokens);
  const bg = resolveSurface(surface, tokens, mode);
  const fg = shownValue(token, tokens, mode);
  if (!fg || fg.toUpperCase() === bg.toUpperCase()) return null;
  const ratio = calcContrastRatio(fg, bg);
  if (!Number.isFinite(ratio)) return null;
  const on = bg.toUpperCase() === "#FFFFFF" ? "white" : (surface?.friendlyName ?? surface?.name ?? bg);
  return `${ratio.toFixed(1)}:1 contrast on ${on}`;
}

/** The elements bound to the token, each selecting itself. */
export function TokenUsageList({ composer, usageRefs }: { composer: Composer | null | undefined; usageRefs: readonly UsageRef[] }) {
  return (
    <ul className="tw:mb-2 tw:flex tw:flex-col tw:gap-0.5 tw:pl-1" data-used-by-list role="list">
          {usageRefs.map((ref, idx) => {
            const el = composer?.elements?.getElement?.(ref.elementId);
            const type = el?.getType?.();
            const name = type
              ? (ELEMENT_TYPE_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1))
              : ref.elementId;
            const where = ref.context ? `${ref.styleProp} · ${ref.context}` : ref.styleProp;
            return (
              <li key={`${ref.elementId}-${ref.styleProp}-${idx}`}>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => {
                    const target = composer?.elements?.getElement?.(ref.elementId);
                    if (target) composer?.selection?.select(target);
                  }}
                  aria-label={`Select ${name} · ${where}`}
                  data-used-by-entry={ref.elementId}
                  className={`${LINK} tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-accent)]`}
                >
                  <span>{name}</span>
                  <span className={`tw:ml-1 tw:text-[var(--bk-ink-muted)] ${MONO}`}>· {where}</span>
                </Button>
              </li>
            );
          })}
        </ul>
  );
}

/** "△ issue · Auto-fix · Ignore", or "✓ Brand checks pass · {contrast}". */
export function TokenChecksLine({ issue, contrast, onAutoFix, onIgnore }: { issue: LintIssue | undefined; contrast: string | null; onAutoFix: () => void; onIgnore: () => void }) {
  return (
    <div className="tw:mt-1 tw:flex tw:min-h-6 tw:flex-col tw:justify-center tw:gap-1.5">
        {issue ? (
          <div
            className="tw:flex tw:flex-wrap tw:items-center tw:gap-x-3 tw:gap-y-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-warning-text)]"
            data-testid="brand-token-lint-value"
            data-lint-status="fail"
          >
            <span>
              <span aria-hidden="true">△ </span>
              {issue.message}
            </span>
            {issue.autoFixHint && (
              <Button type="button" variant="link" size="xs" onClick={onAutoFix} aria-label="Auto-fix lint issue" className={LINK}>
                Auto-fix
              </Button>
            )}
            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={onIgnore}
              aria-label="Ignore lint issue"
              data-testid="brand-token-ignore"
              className={`${LINK} tw:text-[var(--bk-ink-muted)]`}
            >
              Ignore
            </Button>
          </div>
        ) : (
          /* `--bk-success-text` — the one green that passes AA at this size. */
          <div
            className="tw:flex tw:items-center tw:gap-1.5 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-soft)]"
            data-testid="brand-token-lint-value"
            data-lint-status="pass"
          >
            <span aria-hidden="true" className="tw:text-[var(--bk-success-text)]">✓</span>
            <span>Brand checks pass{contrast ? ` · ${contrast}` : ""}</span>
          </div>
        )}
      </div>
  );
}
