/**
 * ESLint rule: no-get-property-value-ds
 * Bans `getComputedStyle(...).getPropertyValue('--buildrick-...')` — use getToken() helper.
 * @license BSD-3-Clause
 */
"use strict";

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow getPropertyValue on --buildrick-* tokens; use getToken()" },
    schema: [],
    messages: {
      directRead: "getPropertyValue('{{name}}') — use getToken('{{name}}') from shared/utils/tokens",
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
