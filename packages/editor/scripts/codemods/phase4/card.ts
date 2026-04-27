// packages/editor/scripts/codemods/phase4/card.ts
/**
 * Phase 4 codemod: ensure `<Card>` JSX in `src/editor/` consumers resolves
 * to the canonical Card shim at `@/shared/ui/Card`.
 *
 * Scope NOTE — there is NO `<card>` HTML element. The legacy implementation
 * already lives at `shared/ui/Card.tsx`; the codemod only gates the import
 * path so any new `<Card>` JSX in chrome routes through the canonical shim,
 * keeping Gate 23 honest and matching T3 IconButton precedent.
 *
 * Sibling exports (CardHeader/CardBody/CardFooter) are not transformed —
 * the shim re-exports them, so existing consumers continue to import from
 * their current path. Only the root `<Card>` identifier is the gate.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/card.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Card",
  toName: "Card",
  toImport: "@/shared/ui/Card",
});

export const parser = "tsx";
