/**
 * Mount component for DSLintBanner — reads tokens from TokenRegistryContext,
 * runs composer.dsLinter (debounced per spec D21), and renders the
 * aggregate banner. Hidden when no issues.
 *
 * Wires:
 *   - useDSLint — the shared, debounced lint result
 *   - useColorRegistry / useSpacingRegistry / useTypeRegistry — token sources
 *     for the dismissed-flag reset only
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
import { useDSLint } from "../state/useDSLint";
import { DSLintBanner } from "./DSLintBanner";

export interface DSLintMountProps {
  composer: Composer | null | undefined;
  onReviewAll?: () => void;
}

export const DSLintMount: React.FC<DSLintMountProps> = ({ composer, onReviewAll }) => {
  const colorState = useColorRegistry();
  const spacingState = useSpacingRegistry();
  const typeState = useTypeRegistry();

  /* The lint itself moved to `useDSLint` (M5) so the banner and the Lint
     destination cannot disagree about the count. The registries are still read
     here because the dismissed flag resets on a token edit. */
  const allTokens = React.useMemo(
    () => [
      ...(colorState?.tokens ?? []),
      ...(spacingState?.tokens ?? []),
      ...(typeState?.tokens ?? []),
    ],
    [colorState?.tokens, spacingState?.tokens, typeState?.tokens]
  );

  const issues = useDSLint(composer);
  const [dismissed, setDismissed] = React.useState(false);

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
