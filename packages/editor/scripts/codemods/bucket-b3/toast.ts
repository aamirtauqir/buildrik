/**
 * Bucket B3 codemod — Toast shim deletion + prop translation.
 *
 * Two-step transform per file:
 *   1. Import path rewrite: `@/shared/ui/Toast` (and 3 alternates) →
 *      `@/editor/shared/vibcoder`. Specifiers preserved as-is, with one
 *      type-only rename: `ToastVariant` → `ToastTone` at the specifier.
 *   2. addToast({...}) ObjectExpression property rename:
 *        - `message:` → `description:`
 *        - `variant:` → `tone:`
 *      The walk is purely syntactic — any CallExpression where callee is
 *      Identifier `addToast` with arg[0] as ObjectExpression is rewritten.
 *      Computed keys, string-literal keys, spread elements are left alone.
 *
 * Type-rename strategy at usage sites:
 *   This codemod renames `ToastVariant` ONLY at the import specifier (to
 *   `ToastTone`). It does NOT walk every Identifier in the file to rename
 *   `ToastVariant` references. Result: a file that imports + uses
 *   `ToastVariant` will be left in a half-renamed state (import says
 *   ToastTone, body still says ToastVariant). T4 manual sweep handles
 *   those <5 files.
 *   Rationale: scope-aware identifier renames are a separate hard problem;
 *   the conservative spec keeps the codemod fast + reviewable. The 27
 *   consumer list confirms only 3 type-only ToastVariant imports exist,
 *   all of which T4 manually verifies.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - shared/vibcoder/ (already vibcoder, recursion guard)
 *   - *.test|spec.tsx
 *   - scripts/, preview/
 *   - files exporting a local useToast/ToastProvider (collision guard,
 *     mirrors the makeImportPathRewriteCodemod policy).
 *
 * @license BSD-3-Clause
 */
import type { Transform } from "jscodeshift";
import { shouldSkipPath } from "../_lib/skip-rules";

const FROM_PATH_PATTERNS: (string | RegExp)[] = [
  "@/shared/ui/Toast",
  "@shared/ui/Toast",
  /^\.\.\/.*shared\/ui\/Toast$/,
];
const TO_PATH = "@/editor/shared/vibcoder";

/** Names whose presence in the rewritten import triggers the collision-guard. */
const COLLISION_GUARD_NAMES = new Set([
  "useToast",
  "ToastProvider",
  "Toast",
]);

/** Type-only specifier rename map: source name → target name. */
const TYPE_SPECIFIER_RENAMES: Record<string, string> = {
  ToastVariant: "ToastTone",
};

const transform: Transform = (file, api) => {
  if (shouldSkipPath(file.path)) return file.source;

  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  const matchesFromPath = (value: string) =>
    FROM_PATH_PATTERNS.some((pat) =>
      typeof pat === "string" ? value === pat : pat.test(value),
    );

  // ---------------------------------------------------------------
  // Step 1: Import path rewrite + ToastVariant→ToastTone specifier
  // ---------------------------------------------------------------
  root.find(j.ImportDeclaration).forEach((path) => {
    const sourceValue = path.node.source.value;
    if (typeof sourceValue !== "string") return;
    if (!matchesFromPath(sourceValue)) return;

    const specifiers = path.node.specifiers ?? [];
    if (specifiers.length === 0) return;

    // Local-export collision guard — if this file exports its own
    // useToast / ToastProvider / Toast, leave the import alone.
    const hasLocalExport =
      root
        .find(j.ExportNamedDeclaration)
        .filter((p) => {
          const decl = p.node.declaration;
          if (!decl) {
            return (p.node.specifiers ?? []).some((s) => {
              const exportedName = (s as { exported?: { name?: string } })
                .exported?.name;
              return exportedName ? COLLISION_GUARD_NAMES.has(exportedName) : false;
            });
          }
          if (decl.type === "VariableDeclaration") {
            return decl.declarations.some((d) => {
              const idName = (d as { id?: { name?: string } }).id?.name;
              return idName ? COLLISION_GUARD_NAMES.has(idName) : false;
            });
          }
          if (
            decl.type === "FunctionDeclaration" ||
            decl.type === "ClassDeclaration"
          ) {
            const idName = (decl as { id?: { name?: string } }).id?.name;
            return idName ? COLLISION_GUARD_NAMES.has(idName) : false;
          }
          return false;
        })
        .size() > 0;

    if (hasLocalExport) {
      console.warn(
        `[codemod] skipped Toast path rewrite in ${file.path}: local export collision`,
      );
      return;
    }

    // Rename ToastVariant → ToastTone at the specifier (type-only or value).
    for (const spec of specifiers) {
      if (spec.type !== "ImportSpecifier") continue;
      const importedName = (spec.imported as { name?: string }).name;
      if (!importedName) continue;
      const renameTo = TYPE_SPECIFIER_RENAMES[importedName];
      if (!renameTo) continue;
      const local = (spec.local as { name?: string }).name;
      // If consumer used `as Foo` alias, preserve it — only rename the
      // imported (external) name. If the local name === imported name
      // (no alias), rename both so the consumer body still resolves.
      (spec.imported as { name: string }).name = renameTo;
      if (local === importedName) {
        (spec.local as { name: string }).name = renameTo;
      }
    }

    path.node.source = j.literal(TO_PATH);
    modified = true;
  });

  // ---------------------------------------------------------------
  // Step 2: addToast({...}) prop rename
  // ---------------------------------------------------------------
  // Purely syntactic — assumes any addToast call in scope is the shim's.
  // T4 manual sweep verifies. (Documented in brief.)
  root.find(j.CallExpression).forEach((path) => {
    const callee = path.node.callee;
    if (callee.type !== "Identifier" || callee.name !== "addToast") return;
    const args = path.node.arguments;
    if (args.length === 0) return;
    const first = args[0];
    if (first.type !== "ObjectExpression") return;

    for (const prop of first.properties) {
      if (prop.type !== "Property" && prop.type !== "ObjectProperty") continue;
      // Skip computed keys ([k]: ...).
      if ((prop as { computed?: boolean }).computed) continue;
      const key = (prop as { key: unknown }).key as
        | { type: string; name?: string; value?: unknown }
        | undefined;
      if (!key) continue;
      // Only rename plain Identifier keys. String-literal keys (e.g.
      // "message") are left alone — out of scope, conservative.
      if (key.type !== "Identifier" || typeof key.name !== "string") continue;
      if (key.name !== "message" && key.name !== "variant") continue;
      // Shorthand properties like `addToast({ message, variant })` share
      // the key + value Identifier node in the printed source. Renaming
      // `key.name` would flip BOTH the key AND the local value reference,
      // producing `addToast({ description })` that points at a missing
      // local. Skip with a warn so the human running the codemod can
      // hand-fix instead of silently corrupting the call.
      if ((prop as { shorthand?: boolean }).shorthand) {
        console.warn(
          `[codemod] skipped shorthand prop '${key.name}' in ${file.path}: rename would break the value identifier`,
        );
        continue;
      }
      if (key.name === "message") {
        key.name = "description";
        modified = true;
      } else if (key.name === "variant") {
        key.name = "tone";
        modified = true;
      }
    }
  });

  return modified ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
