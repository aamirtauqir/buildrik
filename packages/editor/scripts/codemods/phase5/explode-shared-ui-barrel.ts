/**
 * Phase 5 prereq codemod — barrel-explosion.
 *
 * Splits `import { Modal, Button } from "../shared/ui"` (and any relative-depth
 * variant: `../shared/ui`, `../../shared/ui`, `../../../../shared/ui`, etc.) into
 * N separate named-path imports against the `@/shared/ui/<X>` alias path.
 *
 * Why: Phase 5 atom shim deletion codemods (T2.B-T2.G) operate on direct-path
 * imports `from "@/shared/ui/<X>"`. Barrel imports bundle multiple names and
 * survive per-atom rewrites only partially — making per-atom deletion codemods
 * unreliable. This prereq codemod normalizes all consumers to direct paths so
 * atom-deletion codemods can operate cleanly.
 *
 * Skip rules (via _lib/skip-rules.ts):
 *   - __tests__/ paths
 *   - *.test|spec.tsx
 *   - scripts/ paths
 *   - shared/vibcoder/ (already vibcoder)
 *   - preview/ (gallery-controlled)
 *   - The barrel file itself (src/shared/ui/index.tsx or index.ts)
 *
 * @license BSD-3-Clause
 */
import type { Transform, ImportSpecifier } from "jscodeshift";
import { shouldSkipPath } from "../_lib/skip-rules";

/** Matches any relative path ending in `shared/ui` (no trailing slash or subpath). */
const BARREL_PATH_REGEX = /^(\.\.\/)+shared\/ui$/;

const transform: Transform = (file, api) => {
  if (shouldSkipPath(file.path)) return file.source;

  // Skip the barrel file itself
  if (
    file.path.endsWith("shared/ui/index.tsx") ||
    file.path.endsWith("shared/ui/index.ts")
  ) {
    return file.source;
  }

  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  root.find(j.ImportDeclaration).forEach((nodePath) => {
    const sourceValue = nodePath.node.source.value;
    if (typeof sourceValue !== "string") return;
    if (!BARREL_PATH_REGEX.test(sourceValue)) return;

    const specifiers = nodePath.node.specifiers ?? [];
    if (specifiers.length === 0) return;

    // Filter to ImportSpecifier only (skip ImportDefaultSpecifier / ImportNamespaceSpecifier)
    const named = specifiers.filter(
      (s): s is ImportSpecifier => s.type === "ImportSpecifier",
    );
    if (named.length === 0) return;

    // Build one ImportDeclaration per specifier. For type-only specifiers where
    // the name ends in "Props" (e.g. `type ButtonProps`), strip the "Props"
    // suffix to resolve to the same module as the value import (ButtonProps →
    // @/shared/ui/Button). All other names map directly to @/shared/ui/<Name>.
    const newDecls = named.map((spec) => {
      const importedName = (spec.imported as { name: string }).name;
      const localName = (spec.local as { name: string }).name;
      const isTypeOnly = (spec as { importKind?: string }).importKind === "type";

      // Derive the module segment: strip "Props" suffix for type specifiers
      // so `type ButtonProps` routes to `@/shared/ui/Button` alongside `Button`.
      const moduleSegment =
        isTypeOnly && importedName.endsWith("Props")
          ? importedName.slice(0, -"Props".length)
          : importedName;

      const newSpec = j.importSpecifier(
        j.identifier(importedName),
        localName !== importedName ? j.identifier(localName) : j.identifier(importedName),
      );
      if (isTypeOnly) {
        (newSpec as { importKind?: string }).importKind = "type";
      }

      return j.importDeclaration(
        [newSpec],
        j.literal(`@/shared/ui/${moduleSegment}`),
      );
    });

    if (newDecls.length === 0) return;

    // Splice the new declarations into the parent body array in-place so that
    // order is preserved (index 0 = first specifier, etc.).
    const parentBody = nodePath.parentPath?.value as unknown[];
    const idx = (parentBody as { indexOf: (n: object) => number }).indexOf(
      nodePath.node,
    );
    if (idx >= 0) {
      (parentBody as unknown[]).splice(idx, 1, ...newDecls);
    } else {
      // Fallback: replaceWith first, insertAfter rest in reverse (produces
      // correct order because each insertAfter injects immediately after the
      // anchor).
      j(nodePath).replaceWith(newDecls[0]);
      for (let i = newDecls.length - 1; i >= 1; i--) {
        j(nodePath).insertAfter(newDecls[i]);
      }
    }

    modified = true;
  });

  return modified ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
