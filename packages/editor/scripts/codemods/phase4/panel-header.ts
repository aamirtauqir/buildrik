// packages/editor/scripts/codemods/phase4/panel-header.ts
/**
 * Phase 4 codemod: ensure `<PanelHeader>` JSX in `src/editor/` consumers
 * resolves to the canonical PanelHeader shim at `@/shared/ui/PanelHeader`.
 *
 * Scope NOTE — there is NO `<panelheader>` HTML element. The legacy
 * implementation lives at `shared/ui/PanelHeader.tsx`; the codemod only
 * gates the import path so any new `<PanelHeader>` JSX in chrome routes
 * through the canonical shim, keeping Gate 23 honest. The shim adapts the
 * legacy single-prop API to the vibcoder SurfaceHead primitive internally —
 * no JSX body rewrite.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/panel-header.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "PanelHeader",
  toName: "PanelHeader",
  toImport: "@/shared/ui/PanelHeader",
});

export const parser = "tsx";
