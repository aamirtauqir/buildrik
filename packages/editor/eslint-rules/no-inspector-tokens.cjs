/**
 * ESLint rule: no-inspector-tokens
 * Bans INSPECTOR_TOKENS import and usage (Phase 3.7 codemod eliminated this indirection).
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow INSPECTOR_TOKENS indirection — use var(--buildrick-*) directly" },
    schema: [],
    messages: {
      tokensImport: "INSPECTOR_TOKENS import banned — use var(--buildrick-*) directly",
      tokensAccess: "INSPECTOR_TOKENS access banned — use var(--buildrick-*) directly",
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        for (const spec of node.specifiers) {
          if (spec.imported && spec.imported.name === "INSPECTOR_TOKENS") {
            context.report({ node: spec, messageId: "tokensImport" });
          }
        }
      },
      Identifier(node) {
        if (node.name === "INSPECTOR_TOKENS") {
          const parent = node.parent;
          if (!parent) return;
          if (parent.type === "VariableDeclarator" && parent.id === node) return;
          if (parent.type === "ImportSpecifier") return;
          if (parent.type === "MemberExpression" && parent.property === node && !parent.computed) return;
          context.report({ node, messageId: "tokensAccess" });
        }
      },
    };
  },
};
