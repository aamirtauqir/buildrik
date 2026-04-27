// packages/editor/scripts/codemods/_lib/import-swap.ts
/**
 * Add or replace a named import in a TSX file via jscodeshift.
 *
 * @license BSD-3-Clause
 */
import type { JSCodeshift, Collection, ImportDeclaration } from "jscodeshift";

export interface EnsureImportResult {
  skipped: boolean;
  reason?: string;
}

/**
 * Ensure `import { Name } from "path"` exists. Idempotent.
 *
 * Cross-path collision guard: if `importName` is ALREADY bound in the file
 * via any other import declaration (different path, default, namespace, or
 * aliased specifier), this function does nothing. Adding a second import
 * with the same local binding name would produce a duplicate-identifier
 * compile error. Callers that need a different binding must alias upstream.
 *
 * Local-export / local-declaration collision guard: if the target file
 * already exports `importName` (via `export const`, `export function`, or
 * `export { x as importName }`), or declares a top-level binding with the
 * same name, adding the import would cause a duplicate-identifier or
 * self-recursion error. Returns `{ skipped: true, reason: "..." }` in that
 * case without mutating the AST.
 */
export function ensureNamedImport(
  j: JSCodeshift,
  root: Collection<any>,
  importName: string,
  fromPath: string,
): EnsureImportResult {
  // --- Local-export collision check ---
  // Scan ExportNamedDeclaration nodes for:
  //   (a) export const/let/var/function/class <importName>
  //   (b) export { foo as importName } or export { importName }
  const exports = root.find(j.ExportNamedDeclaration);
  for (const exportPath of exports.paths()) {
    const node = exportPath.node;

    // (a) export const/function/class X — check the declaration's id(s)
    if (node.declaration) {
      const decl = node.declaration;
      if (
        (decl.type === "VariableDeclaration") &&
        decl.declarations.some(
          (d) =>
            d.id &&
            d.id.type === "Identifier" &&
            (d.id as { name: string }).name === importName,
        )
      ) {
        return { skipped: true, reason: `local export: '${importName}' is exported from this file` };
      }
      if (
        (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") &&
        decl.id &&
        (decl.id as { name: string }).name === importName
      ) {
        return { skipped: true, reason: `local export: '${importName}' is exported from this file` };
      }
    }

    // (b) export { foo as importName } or export { importName }
    if (node.specifiers) {
      for (const spec of node.specifiers) {
        const exported = spec.exported;
        if (exported && (exported as { name: string }).name === importName) {
          return { skipped: true, reason: `local export: '${importName}' is re-exported from this file` };
        }
      }
    }
  }

  // --- Top-level local declaration collision check ---
  // If a top-level `const/let/var/function/class <importName>` exists (even
  // without export), adding an import would shadow or conflict with it.
  const program = root.find(j.Program).paths()[0];
  if (program) {
    for (const stmt of program.node.body) {
      if (stmt.type === "VariableDeclaration") {
        const vd = stmt as { declarations: Array<{ id: { type: string; name?: string } }> };
        if (
          vd.declarations.some(
            (d) => d.id.type === "Identifier" && d.id.name === importName,
          )
        ) {
          return { skipped: true, reason: `local declaration: '${importName}' is declared at the top level of this file` };
        }
      }
      if (
        (stmt.type === "FunctionDeclaration" || stmt.type === "ClassDeclaration") &&
        (stmt as { id?: { name?: string } }).id?.name === importName
      ) {
        return { skipped: true, reason: `local declaration: '${importName}' is declared at the top level of this file` };
      }
    }
  }

  // --- Cross-path import collision check ---
  // Scan ALL existing import declarations and see whether the desired local
  // binding name is already in use. If so, bail — the file already has that
  // name bound from some path, so the rename codemod's JSX swap will resolve
  // correctly without a new import.
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
  if (alreadyBoundElsewhere) return { skipped: true, reason: `cross-path import: '${importName}' is already bound via another import` };

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
    return { skipped: false };
  }

  // No existing import — add a new one at the top of the file.
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier(importName))],
    j.literal(fromPath),
  );
  root.find(j.Program).get("body", 0).insertBefore(newImport);
  return { skipped: false };
}
