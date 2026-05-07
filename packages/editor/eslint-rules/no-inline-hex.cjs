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

/**
 * Audit-remediation PR3 (2026-05-08): detect whether a TemplateLiteral
 * is the body of an Emotion-tagged template. Emotion uses tagged-template
 * forms like:
 *   css`color: #fff`                  // Identifier `css`
 *   styled.div`color: #fff`           // MemberExpression styled.div
 *   styled(Component)`color: #fff`    // CallExpression styled(C)
 *   keyframes`from { color: #fff }`   // Identifier `keyframes`
 * The rule's intent per its docstring is "chrome JSX/Emotion" — fire
 * on Emotion templates only, not on raw template literals storing
 * HTML/markdown/data strings.
 */
function isEmotionTaggedTemplate(node) {
  const parent = node.parent;
  if (!parent || parent.type !== "TaggedTemplateExpression") return false;
  if (parent.quasi !== node) return false;
  const tag = parent.tag;
  if (!tag) return false;
  // `css\`...\`` or `keyframes\`...\``
  if (tag.type === "Identifier") {
    return tag.name === "css" || tag.name === "keyframes";
  }
  // `styled.X\`...\``
  if (tag.type === "MemberExpression" && tag.object.type === "Identifier") {
    return tag.object.name === "styled";
  }
  // `styled(C)\`...\`` — CallExpression with styled as callee
  if (tag.type === "CallExpression" && tag.callee.type === "Identifier") {
    return tag.callee.name === "styled" || tag.callee.name === "css";
  }
  return false;
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
        // Audit-remediation PR3 (2026-05-08): only fire when the template
        // literal is the body of an Emotion-tagged tag — i.e. `css`,
        // `styled.X`, `keyframes`, etc. Pre-fix, EVERY template literal
        // anywhere in the file fired the rule, producing 700+ false
        // positives in templates/ + blocks/ where the literal stores
        // user-content HTML strings, not chrome styling. The rule's
        // doc-comment said "Emotion template literals," so this matches
        // the documented intent.
        const isEmotionTagged = isEmotionTaggedTemplate(node);
        if (!isEmotionTagged) return;
        if (hasPolicyComment(context, node)) return;
        const matches = raw.match(HEX_RE);
        for (const hex of matches) {
          context.report({ node, messageId: "inlineHex", data: { hex } });
        }
      },
    };
  },
};
