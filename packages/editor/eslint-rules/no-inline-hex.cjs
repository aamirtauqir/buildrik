/**
 * ESLint rule: no-inline-hex
 * Bans #RRGGBB literals in JSX style values and Emotion template literals.
 * Honors `// @lint-hex-policy: <reason>` on preceding line as per-site escape.
 * @license BSD-3-Clause
 */
"use strict";

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;
const POLICY_RE = /@lint-hex-policy:/;

function hasPolicyComment(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  const commentsBefore = sourceCode.getCommentsBefore(node);
  return commentsBefore.some((c) => POLICY_RE.test(c.value));
}

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow inline hex color literals in chrome JSX/Emotion" },
    schema: [],
    messages: {
      inlineHex: "Inline hex '{{hex}}' — use a var(--buildrick-*) token or mark with @lint-hex-policy: <reason>",
    },
  },
  create(context) {
    function checkString(str, node) {
      const matches = str.match(HEX_RE);
      if (!matches) return;
      if (hasPolicyComment(context, node)) return;
      for (const hex of matches) {
        context.report({ node, messageId: "inlineHex", data: { hex } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        if (node.value.length < 4) return;
        if (!HEX_RE.test(node.value)) return;
        const parent = node.parent;
        if (!parent) return;
        let walker = parent;
        while (walker && walker.type !== "Program") {
          if (walker.type === "JSXAttribute" && walker.name && ["style", "css"].includes(walker.name.name)) {
            checkString(node.value, node);
            return;
          }
          walker = walker.parent;
        }
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.cooked).join("");
        if (!HEX_RE.test(raw)) return;
        if (hasPolicyComment(context, node)) return;
        const matches = raw.match(HEX_RE);
        for (const hex of matches) {
          context.report({ node, messageId: "inlineHex", data: { hex } });
        }
      },
    };
  },
};
