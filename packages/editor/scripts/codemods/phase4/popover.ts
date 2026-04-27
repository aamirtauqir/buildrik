// packages/editor/scripts/codemods/phase4/popover.ts
/**
 * Phase 4 codemod: ensure `<Popover>` JSX in `src/editor/` consumers resolves
 * to the canonical Popover shim at `@/shared/ui/Popover`.
 *
 * Scope NOTE — there is NO `<popover>` HTML element. The legacy implementation
 * lived at `shared/ui/Popover.tsx`; T6.A swapped it to a hybrid shim that
 * renders the vibcoder bd-popover surface inside the legacy positioning +
 * dismiss + focus-trap shell. The codemod only gates the import path so any
 * new `<Popover>` JSX in chrome routes through the canonical shim, keeping
 * Gate 23 honest and matching T5 Modal precedent. Identity rename — no JSX
 * tag change.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/popover.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Popover",
  toName: "Popover",
  toImport: "@/shared/ui/Popover",
});

export const parser = "tsx";
