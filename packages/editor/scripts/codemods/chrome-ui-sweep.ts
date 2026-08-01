// packages/editor/scripts/codemods/chrome-ui-sweep.ts
/**
 * B3 sweep codemod (chrome-ui-single-surface spec §4 B3).
 *
 * Mechanical part ONLY: re-points every `flowbite-react` (bare or subpath)
 * import outside `src/editor/chrome-ui/` onto `@/editor/chrome-ui`. Does
 * NOT touch `theme={...}` props — the plan explicitly bans a blanket
 * codemod for that (byte-identical-default drops are reviewed by hand,
 * file by file).
 *
 * Also re-points deep `@/editor/chrome-ui/<file>`-style imports (e.g.
 * `@/editor/chrome-ui/selectTheme`, `/textInputTheme`, `/labelTheme`) onto
 * the same barrel (plan §2d) — every one of those deep files' exports is
 * already re-exported from `chrome-ui/index.ts` itself.
 *
 * For each target file:
 *  - collect every named specifier (value or type-only) across ALL matching
 *    import declarations in the file (a file may have two separate import
 *    statements from the same module — seen in shared.tsx and
 *    PublishHistory.tsx),
 *  - remove those import declarations,
 *  - insert one new `import { ... } from "@/editor/chrome-ui";` at the
 *    position of the first removed declaration, preserving aliases and
 *    per-specifier `type` modifiers.
 *
 * Usage: npx tsx scripts/codemods/chrome-ui-sweep.ts <glob-or-file>...
 *
 * @license BSD-3-Clause
 */
import { Project, QuoteKind } from "ts-morph";
import { resolve } from "node:path";

const EDITOR_ROOT = resolve(import.meta.dirname, "../..");
const NEW_SPECIFIER = "@/editor/chrome-ui";
const TARGET_SPECIFIER = new RegExp(
  `^(flowbite-react(/.*)?|${NEW_SPECIFIER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/.+)$`,
);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: chrome-ui-sweep.ts <file>...");
  process.exit(1);
}

const project = new Project({
  tsConfigFilePath: resolve(EDITOR_ROOT, "tsconfig.json"),
  manipulationSettings: { quoteKind: QuoteKind.Double },
});

let changedFiles = 0;

for (const rawPath of args) {
  const absPath = resolve(rawPath);
  const sf = project.addSourceFileAtPathIfExists(absPath);
  if (!sf) {
    console.error(`[chrome-ui-sweep] SKIP (not found): ${rawPath}`);
    continue;
  }

  const imports = sf.getImportDeclarations();
  const targets = imports.filter((d) => TARGET_SPECIFIER.test(d.getModuleSpecifierValue()));
  if (targets.length === 0) continue;

  type Spec = { name: string; alias: string | null; isTypeOnly: boolean };
  const specs: Spec[] = [];
  const seen = new Set<string>();

  for (const decl of targets) {
    const declTypeOnly = decl.isTypeOnly();
    for (const named of decl.getNamedImports()) {
      const name = named.getName();
      const alias = named.getAliasNode()?.getText() ?? null;
      const isTypeOnly = declTypeOnly || named.isTypeOnly();
      const key = `${name}:${alias}`;
      if (seen.has(key)) continue;
      seen.add(key);
      specs.push({ name, alias, isTypeOnly });
    }
    if (decl.getDefaultImport() || decl.getNamespaceImport()) {
      throw new Error(
        `[chrome-ui-sweep] ${absPath}: unexpected default/namespace import from flowbite-react — codemod only handles named imports.`,
      );
    }
  }

  if (specs.length === 0) {
    // Bare `import "flowbite-react"` side-effect import (not expected, but
    // don't silently drop it).
    throw new Error(`[chrome-ui-sweep] ${absPath}: flowbite-react import with no named specifiers — needs manual handling.`);
  }

  const insertIndex = targets[0].getChildIndex();

  for (const decl of targets) {
    decl.remove();
  }

  specs.sort((a, b) => a.name.localeCompare(b.name));
  const namedImportsText = specs
    .map((s) => `${s.isTypeOnly ? "type " : ""}${s.name}${s.alias ? ` as ${s.alias}` : ""}`)
    .join(", ");

  // Insert as raw statement text — ts-morph's structured namedImports API
  // fights per-specifier `type` modifiers when set via ImportSpecifierStructure.
  sf.insertStatements(insertIndex, `import { ${namedImportsText} } from "${NEW_SPECIFIER}";`);

  changedFiles += 1;
}

project.saveSync();
console.log(`[chrome-ui-sweep] rewrote ${changedFiles} file(s).`);
