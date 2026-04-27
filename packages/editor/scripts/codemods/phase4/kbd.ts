// packages/editor/scripts/codemods/phase4/kbd.ts
/**
 * Phase 4 codemod: swap inline `<kbd>` JSX in `src/editor/` consumers
 * to the canonical Kbd shim at `@/shared/ui/Kbd`.
 *
 * Scope: matches `<kbd>` elements (lowercase native HTML keyboard
 * element). Does NOT touch `<Kbd>` (PascalCase, already a component).
 * The renamed JSX preserves children (the displayed key glyph) verbatim;
 * only the tag changes from `kbd` → `Kbd`.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/kbd.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "kbd",
  toName: "Kbd",
  toImport: "@/shared/ui/Kbd",
});

export const parser = "tsx";
