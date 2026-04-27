// packages/editor/scripts/codemods/phase4/icon.ts
/**
 * Phase 4 codemod: ensure `<Icon name="...">` JSX in `src/editor/`
 * consumers resolves to the canonical Icon shim at `@/shared/ui/Icon`.
 *
 * Scope NOTE — there is NO `<icon>` HTML element. The chrome has many
 * occurrences of `<Icon>` that are NOT the legacy shared Icon component
 * but rather parameterized Lucide icon variables (e.g.
 * `const Icon = ICON_MAP[tab.iconName]; ... <Icon size={20} />`). To
 * avoid harmful import injection in those files, the codemod only acts
 * on `<Icon name="...">` JSX (the literal-name shape of both the legacy
 * shared Icon and vibcoder Icon). Today consumers in `src/editor/` have
 * zero `<Icon name="...">` literals outside vibcoder, so this is a
 * 0-hit forward-guard.
 *
 * Skip rules: see _lib/skip-rules.ts.
 *
 * Run: pnpm exec jscodeshift -t scripts/codemods/phase4/icon.ts \
 *      --extensions=ts,tsx --parser=tsx src/editor/
 *
 * @license BSD-3-Clause
 */
import type { JSXAttribute, JSXElement } from "jscodeshift";
import { makeRenameJsxCodemod } from "../_lib/codemod-factory";

/**
 * Skip `<Icon>` elements that lack a `name="..."` (or `name={"..."}`)
 * attribute. These are almost always a locally-bound Lucide icon variable
 * (`const Icon = ICON_MAP[id]; <Icon size={20} />`), NOT the legacy/vibcoder
 * Icon primitive. Acting on them would inject a colliding import.
 */
function hasNameAttribute(_: unknown, el: JSXElement): boolean {
  const attrs = (el.openingElement.attributes ?? []) as JSXAttribute[];
  return attrs.some((a) => a.type === "JSXAttribute" && a.name?.name === "name");
}

export default makeRenameJsxCodemod({
  fromTag: "Icon",
  toName: "Icon",
  toImport: "@/shared/ui/Icon",
  // Skip rule is the inverse — return true to SKIP an element.
  shouldSkipElement: (j, el) => !hasNameAttribute(j, el),
});

export const parser = "tsx";
