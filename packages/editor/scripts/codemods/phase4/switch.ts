// packages/editor/scripts/codemods/phase4/switch.ts
/**
 * Phase 4 codemod: ensure `<Switch>` JSX in `src/editor/` consumers
 * resolves to the vibcoder Switch via the shim layer at
 * `@/shared/ui/Switch`.
 *
 * Scope NOTE — this codemod differs from the lowercase-tag pattern used
 * by button/input/select: there is NO `<switch>` HTML element. The
 * legacy world had no hand-rolled `<Switch>` primitive in `shared/ui/`
 * either, so today's `<Switch>` JSX only lives inside the vibcoder folder
 * (which `shouldSkipPath` skips). The codemod is shipped here so that
 * future Phase 5 cleanup or accidental new `<Switch>` JSX outside the
 * vibcoder folder gets routed through the shim — keeping Gate 23 (shim
 * layer is gate-keeper) honest as the bundle evolves.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/switch.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Switch",
  toName: "Switch",
  toImport: "@/shared/ui/Switch",
});

export const parser = "tsx";
