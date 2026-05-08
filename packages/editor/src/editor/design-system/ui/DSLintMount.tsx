/**
 * Mount component for DSLintBanner — reads tokens from TokenRegistryContext,
 * runs composer.dsLinter (debounced per spec D21), and renders the
 * aggregate banner. Hidden when no issues.
 *
 * Wires:
 *   - useColorRegistry / useSpacingRegistry / useTypeRegistry — token sources
 *   - composer.dsLinter (H.0) — pure lint
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import {
  useColorRegistry,
  useSpacingRegistry,
  useTypeRegistry,
} from "../state/TokenRegistryContext";
import type { LintIssue } from "../linter";
import { DSLintBanner } from "./DSLintBanner";

const DEBOUNCE_MS = 500;

export interface DSLintMountProps {
  composer: Composer | null | undefined;
  onReviewAll?: () => void;
}

export const DSLintMount: React.FC<DSLintMountProps> = ({ composer, onReviewAll }) => {
  const colorState = useColorRegistry();
  const spacingState = useSpacingRegistry();
  const typeState = useTypeRegistry();

  const allTokens = React.useMemo(
    () => [
      ...(colorState?.tokens ?? []),
      ...(spacingState?.tokens ?? []),
      ...(typeState?.tokens ?? []),
    ],
    [colorState?.tokens, spacingState?.tokens, typeState?.tokens]
  );

  const [issues, setIssues] = React.useState<readonly LintIssue[]>([]);
  const [dismissed, setDismissed] = React.useState(false);

  // Re-lint on a token change with a 500ms debounce per spec D21.
  React.useEffect(() => {
    if (!composer) return;
    const timer = window.setTimeout(() => {
      const result = composer.dsLinter.lint(allTokens);
      setIssues(result);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [composer, allTokens]);

  // Token edit clears the dismissed flag — user changing tokens means
  // a fresh chance to surface lint state.
  React.useEffect(() => {
    setDismissed(false);
  }, [allTokens]);

  if (dismissed) return null;
  if (!composer) return null;

  return (
    <DSLintBanner
      issues={issues}
      onReviewAll={onReviewAll}
      onDismiss={() => setDismissed(true)}
    />
  );
};
