/**
 * DSLintRunner — runs the design-system lint for the whole editor, headlessly.
 *
 * `useDSLint` is the only place the linter runs, and it publishes its findings
 * into `composer.designSystem.lintState`, which the shell bridges into the
 * topbar's Issues chip and the Issues panel. But every caller of that hook
 * lived inside the Brand panel, so the linter did not run until the user
 * opened Brand.
 *
 * Measured live on 2026-08-17: a freshly loaded editor reported "No issues" on
 * the topbar chip; opening Brand flipped it to "4 issues, 4 warnings" without
 * anything changing in the project. The chip is a PRE-PUBLISH signal — the
 * publish-anyway confirm (board 1168:4732) is gated on its error count — so
 * until the user happened to visit an unrelated panel, a publish with open
 * errors sailed through with no confirm at all.
 *
 * This renders nothing. It sits beside the other shell-level mounts inside
 * TokenRegistryProvider, which is where the token state the lint reads lives.
 * (`DSLintMount` looks like it should do this job and does not: it renders the
 * aggregate banner, which is a Brand-panel surface, and nothing outside its own
 * tests has mounted it for some time.)
 *
 * @license BSD-3-Clause
 */
import type * as React from "react";
import type { Composer } from "../../../engine";
import { useDSLint } from "../state/useDSLint";

export interface DSLintRunnerProps {
  composer: Composer | null | undefined;
}

export const DSLintRunner: React.FC<DSLintRunnerProps> = ({ composer }) => {
  // The publish into lintState is the point; the returned array is for
  // surfaces that render the findings themselves.
  useDSLint(composer);
  return null;
};
