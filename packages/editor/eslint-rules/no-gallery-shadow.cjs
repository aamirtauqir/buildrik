/**
 * ESLint rule: no-gallery-shadow
 *
 * Prevents local declarations of names that already exist in
 * `packages/editor/src/preview/_galleryStyles.ts`. Gallery files (`vibcoder-*.tsx`)
 * must import these primitives instead of redeclaring them — local copies
 * silently shadow the shared shape and create per-gallery drift (Phase 1
 * caught two such shadows; Phase 2 polish #72 locks the convention).
 *
 * Scope: only files matching `**\/preview/vibcoder-*.tsx`.
 *
 * Forbidden top-level / module-scope declarations: `sectionLabel`, `stack`,
 * `flexRow`, `field`, `darkSurface` (every export from _galleryStyles.ts).
 * Identifiers introduced as function parameters, destructuring targets, or
 * inside nested scopes are allowed — only the module-scope shadow matters.
 *
 * Fix: replace the local declaration with
 *   `import { <name> } from "./_galleryStyles";`
 *
 * @license BSD-3-Clause
 */
"use strict";

const FORBIDDEN_NAMES = new Set([
  "sectionLabel",
  "stack",
  "flexRow",
  "field",
  "darkSurface",
]);

// Match `preview/vibcoder-<anything>.tsx`. Path separators normalised before test.
const FILE_RE = /\/preview\/vibcoder-[^/]+\.tsx$/;

function isGalleryFile(filename) {
  if (typeof filename !== "string") return false;
  return FILE_RE.test(filename.replace(/\\/g, "/"));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow local declarations of _galleryStyles exports inside preview/vibcoder-*.tsx (must import from ./_galleryStyles).",
    },
    schema: [],
    messages: {
      shadow:
        "Local declaration of '{{name}}' shadows _galleryStyles.{{name}} — import from './_galleryStyles' instead.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isGalleryFile(filename)) return {};

    return {
      VariableDeclaration(node) {
        // Only flag module-scope declarations. Parent of a top-level
        // VariableDeclaration is Program; everything else (BlockStatement,
        // ForStatement init, ExportNamedDeclaration's declaration child etc.)
        // either has an enclosing scope or wraps a module-scope decl.
        const parentType = node.parent && node.parent.type;
        if (parentType !== "Program" && parentType !== "ExportNamedDeclaration") return;
        for (const declarator of node.declarations) {
          if (!declarator.id || declarator.id.type !== "Identifier") continue;
          const name = declarator.id.name;
          if (!FORBIDDEN_NAMES.has(name)) continue;
          context.report({
            node: declarator.id,
            messageId: "shadow",
            data: { name },
          });
        }
      },
    };
  },
};
