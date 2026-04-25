/**
 * ESLint rule: no-legacy-components-import
 * Bans any import from src/editor/** that resolves to the legacy src/components/ folder.
 * Legacy folder is frozen per packages/editor/CLAUDE.md — new code lives in src/editor/.
 * @license BSD-3-Clause
 */
"use strict";

// Matches imports that resolve to packages/editor/src/components/.
// Three forms covered:
//   1. Alias   @components/*     (tsconfig paths: ./src/components/*)
//   2. Alias   @/components/*    (tsconfig paths: ./src/*)
//   3. Deep-relative from src/editor/**: three or more '../' segments landing on components/
const LEGACY_PATTERNS = [
  /^@components\//,
  /^@\/components\//,
  /^(\.\.\/){3,}components\//,
];

function isEditorFile(filename) {
  const parts = filename.replace(/\\/g, "/").split("/");
  const srcIdx = parts.lastIndexOf("src");
  return srcIdx !== -1 && parts[srcIdx + 1] === "editor";
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports from src/editor/** into the legacy src/components/ folder (frozen per CLAUDE.md)",
    },
    schema: [],
    messages: {
      legacyImport:
        "Import from legacy src/components/ ('{{source}}') — legacy folder is frozen. New code goes in src/editor/ or src/shared/. See packages/editor/CLAUDE.md.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isEditorFile(filename)) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (typeof source !== "string") return;
        for (const re of LEGACY_PATTERNS) {
          if (re.test(source)) {
            context.report({ node: node.source, messageId: "legacyImport", data: { source } });
            return;
          }
        }
      },
    };
  },
};
