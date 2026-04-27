// packages/editor/scripts/codemods/phase4/modal.ts
/**
 * Phase 4 codemod: ensure `<Modal>` JSX in `src/editor/` consumers resolves
 * to the canonical Modal shim at `@/shared/ui/Modal`.
 *
 * Scope NOTE — there is NO `<modal>` HTML element. The legacy implementation
 * lived at `shared/ui/Modal.tsx`; T5.A swapped it to a vibcoder Modal adapter
 * shim. The codemod only gates the import path so any new `<Modal>` JSX in
 * chrome routes through the canonical shim, keeping Gate 23 honest and
 * matching T3 IconButton + T4.A Card precedent. Identity rename — no JSX
 * tag change.
 *
 * Sibling export `ConfirmDialog` is not transformed — the shim re-exports
 * it from the same path, so existing consumers continue to import from
 * their current path. Only the root `<Modal>` identifier is the gate.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/modal.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

export default makeRenameJsxCodemod({
  fromTag: "Modal",
  toName: "Modal",
  toImport: "@/shared/ui/Modal",
});

export const parser = "tsx";
