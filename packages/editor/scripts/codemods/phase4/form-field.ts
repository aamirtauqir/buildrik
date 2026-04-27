// packages/editor/scripts/codemods/phase4/form-field.ts
/**
 * Phase 4 codemod: ensure `<FormField>` JSX in `src/editor/` consumers
 * resolves to the canonical FormField shim at `@/shared/ui/FormField`.
 *
 * Scope NOTE — there is NO `<formfield>` HTML element. The legacy
 * implementation lives at `shared/ui/FormField.tsx`; the codemod only gates
 * the import path so any new `<FormField>` JSX in chrome routes through the
 * canonical shim, keeping Gate 23 honest and matching T3 IconButton precedent.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/form-field.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "FormField",
  toName: "FormField",
  toImport: "@/shared/ui/FormField",
});

export const parser = "tsx";
