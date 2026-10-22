/**
 * ESLint rule: no-get-property-value-ds
 * Bans `getComputedStyle(...).getPropertyValue('--buildrick-...')` — the namespace is dead.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow getPropertyValue on --buildrick-* tokens; the namespace is dead" },
    schema: [],
    messages: {
      directRead: "getPropertyValue('{{name}}') — --buildrick-* is a dead namespace; read a --bk-* token instead",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (!callee || callee.type !== "MemberExpression") return;
        if (!callee.property || callee.property.name !== "getPropertyValue") return;
        const arg = node.arguments[0];
        if (!arg || arg.type !== "Literal" || typeof arg.value !== "string") return;
        if (!arg.value.startsWith("--buildrick-")) return;
        context.report({ node, messageId: "directRead", data: { name: arg.value } });
      },
    };
  },
};
