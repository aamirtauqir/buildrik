// packages/editor/scripts/codemods/phase4/input.ts
/**
 * Phase 4 codemod: swap inline `<input>` JSX in `src/editor/` consumers
 * to vibcoder Input via the shim layer at `@/shared/ui/TextInput`.
 *
 * Note on file alias: legacy file is `shared/ui/TextInput.tsx`; consumers
 * keep importing from there. The codemod points new imports at the same
 * legacy filename so existing barrel exports / IDE history stay stable.
 *
 * Scope: only matches `<input>` elements (lowercase). Does NOT touch
 * `<input type="checkbox">` — checkbox primitives are owned by the
 * dedicated Checkbox codemod (T2.D), where they are rewritten to
 * `<Checkbox>`.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/input.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";
import { hasStringLiteralAttr } from "../_lib/jsx-query";

export default makeRenameJsxCodemod({
  fromTag: "input",
  toName: "TextInput",
  toImport: "@/shared/ui/TextInput",
  // Skip <input type="checkbox"> — owned by the checkbox codemod.
  shouldSkipElement: (_, el) => hasStringLiteralAttr(el, "type", "checkbox"),
});

export const parser = "tsx";
