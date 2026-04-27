// packages/editor/scripts/codemods/_lib/import-swap.ts
/**
 * Add or replace a named import in a TSX file via jscodeshift.
 *
 * @license BSD-3-Clause
 */
import type { JSCodeshift, Collection, ImportDeclaration } from "jscodeshift";

/**
 * Ensure `import { Name } from "path"` exists. Idempotent.
 *
 * Cross-path collision guard: if `importName` is ALREADY bound in the file
 * via any other import declaration (different path, default, namespace, or
 * aliased specifier), this function does nothing. Adding a second import
 * with the same local binding name would produce a duplicate-identifier
 * compile error. Callers that need a different binding must alias upstream.
 */
export function ensureNamedImport(
  j: JSCodeshift,
  root: Collection<unknown>,
  importName: string,
  fromPath: string,
): void {
  // Cross-path check: scan ALL existing import declarations and see whether
  // the desired local binding name is already in use. If so, bail — the file
  // already has that name bound from some path, so the rename codemod's JSX
  // swap will resolve correctly without a new import.
  const allImports = root.find(j.ImportDeclaration);
  let alreadyBoundElsewhere = false;
  allImports.forEach((path) => {
    const decl = path.node;
    for (const spec of decl.specifiers ?? []) {
      // Local binding name is `local` (alias if `as`, otherwise the imported name).
      if (spec.local && spec.local.name === importName) {
        alreadyBoundElsewhere = true;
        return;
      }
    }
  });
  if (alreadyBoundElsewhere) return;

  const existing = root.find(j.ImportDeclaration, {
    source: { value: fromPath },
  });

  if (existing.size() > 0) {
    const decl = existing.nodes()[0] as ImportDeclaration;
    // Re-check on the same-path branch in case a default/namespace import on
    // this path already provides the binding under the desired name.
    const alreadyImported = decl.specifiers?.some(
      (s) => s.local && s.local.name === importName,
    );
    if (!alreadyImported) {
      decl.specifiers = decl.specifiers ?? [];
      decl.specifiers.push(j.importSpecifier(j.identifier(importName)));
    }
    return;
  }

  // No existing import — add a new one at the top of the file.
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier(importName))],
    j.literal(fromPath),
  );
  root.find(j.Program).get("body", 0).insertBefore(newImport);
}
