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
      setIssues(composer.dsLinter.lint(allTokens));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [composer, allTokens]);

  return issues;
}
