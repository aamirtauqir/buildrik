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
import { EVENTS } from "../../../shared/constants/events";
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

  /* "Run checks" (Brand checks, 7316:84555): the one trigger this hook takes
     from outside. It re-runs the same pass immediately instead of after the
     edit debounce — coordinator-approved trigger-only change to state/. */
  const [runNonce, setRunNonce] = React.useState(0);
  const lastNonce = React.useRef(0);
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const run = () => setRunNonce((n) => n + 1);
    composer.on(EVENTS.BRAND_CHECKS_RUN, run);
    return () => {
      composer.off(EVENTS.BRAND_CHECKS_RUN, run);
    };
  }, [composer]);

  React.useEffect(() => {
    if (!composer) return;
    const immediate = runNonce !== lastNonce.current;
    lastNonce.current = runNonce;
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
        const stored: StoredLintIssue = { type: issue.rule, severity: issue.severity, message: issue.message, autoFixHint: issue.autoFixHint };
        if (list) list.push(stored);
        else byToken.set(issue.tokenId, [stored]);
      }
      composer.designSystem?.lintState?.setAllIssues(byToken);
    }, immediate ? 0 : DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [composer, allTokens, runNonce]);

  return issues;
}
