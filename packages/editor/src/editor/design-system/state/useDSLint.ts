/**
 * useDSLint — the design-system lint result, debounced on token change.
 *
 * Extracted from `DSLintMount` when Lint graduated from a banner to a
 * destination (M5). The banner and the Lint section must never disagree about
 * how many findings there are, and the only way to guarantee that is for both
 * to read the same computation instead of each running their own.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import type { LintIssue } from "../../../engine/designSystem/linter";
import type { LintIssue as StoredLintIssue } from "../../../engine/designSystem/LintState";
import { buildContrastIssues } from "../utils/contrastLint";
import {
  useColorRegistry,
  useSpacingRegistry,
  useTypeRegistry,
} from "./TokenRegistryContext";

/** Debounce per spec D21 — a token edit should not re-lint on every keystroke. */
const DEBOUNCE_MS = 500;

export function useDSLint(composer: Composer | null | undefined): readonly LintIssue[] {
  const colorState = useColorRegistry();
  const spacingState = useSpacingRegistry();
  const typeState = useTypeRegistry();

  const allTokens = React.useMemo(
    () => [
      ...(colorState?.tokens ?? []),
      ...(spacingState?.tokens ?? []),
      ...(typeState?.tokens ?? []),
    ],
    [colorState?.tokens, spacingState?.tokens, typeState?.tokens],
  );

  const [issues, setIssues] = React.useState<readonly LintIssue[]>([]);

  React.useEffect(() => {
    if (!composer) return;
    const timer = window.setTimeout(() => {
      /* Contrast is computed here, not in DSLinter — it needs the resolved
         mode. Merged so the Lint destination, the banner and the colour
         list's chip can never tell three different stories again. */
      const mode = composer.colorMode?.resolved?.() ?? "light";
      const found = [
        ...composer.dsLinter.lint(allTokens),
        ...buildContrastIssues(colorState?.tokens ?? [], mode),
      ];
      setIssues(found);

      /* Publish into the engine store the rest of the editor reads. This hook
         is the only place the linter runs, and nothing wrote to lintState at
         all — so the Issues panel (AquibraStudio's bridge) and the per-token
         lint row in TokenDetailView both showed nothing no matter how much the
         linter had found. Grouped by token, replaced wholesale so a token that
         has been fixed stops reporting. */
      const byToken = new Map<string, StoredLintIssue[]>();
      for (const issue of found) {
        const list = byToken.get(issue.tokenId);
        if (list) list.push({ type: issue.rule, severity: issue.severity, message: issue.message });
        else byToken.set(issue.tokenId, [
          { type: issue.rule, severity: issue.severity, message: issue.message },
        ]);
      }
      composer.designSystem?.lintState?.setAllIssues(byToken);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [composer, allTokens]);

  return issues;
}
