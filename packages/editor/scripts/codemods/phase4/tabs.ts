// packages/editor/scripts/codemods/phase4/tabs.ts
/**
 * Phase 4 codemod: ensure `<Tabs>` JSX in `src/editor/` consumers resolves
 * to the canonical Tabs shim at `@/shared/ui/Tabs`.
 *
 * Scope NOTE — there is NO `<tabs>` HTML element. The legacy implementation
 * lives at `shared/ui/Tabs.tsx`; the codemod only gates the import path so
 * any new `<Tabs>` JSX in chrome routes through the canonical shim, keeping
 * Gate 23 honest. The shim adapts the legacy data-driven `tabs={[...]}` API
 * to the vibcoder composition shape internally — no JSX body rewrite.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/tabs.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Tabs",
  toName: "Tabs",
  toImport: "@/shared/ui/Tabs",
});

export const parser = "tsx";
