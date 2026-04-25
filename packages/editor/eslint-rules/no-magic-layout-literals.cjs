/**
 * ESLint rule: no-magic-layout-literals
 * Bans raw pixel literals in layout-property contexts (width/height/padding/etc).
 * Consumers use named exports from src/shared/constants/layout.ts.
 * Honors `// @lint-layout-policy: <reason>` on preceding line as per-site escape.
 * @license BSD-3-Clause
 */
"use strict";

const LAYOUT_PROPS = new Set([
  "width", "height",
  "minWidth", "minHeight", "maxWidth", "maxHeight",
  "top", "left", "right", "bottom",
  "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "gap", "rowGap", "columnGap",
  "flexBasis",
]);

const POLICY_RE = /@lint-layout-policy:/;
const TEMPLATE_LAYOUT_RE = /\b(width|height|min-?width|min-?height|max-?width|max-?height|top|left|right|bottom|padding|margin|gap)\s*:\s*(\d{2,})px/gi;

function hasPolicyComment(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  let walker = node;
  while (walker) {
    const commentsBefore = sourceCode.getCommentsBefore(walker);
    if (commentsBefore.some((c) => POLICY_RE.test(c.value))) return true;
    if (!walker.parent || walker.parent.type === "Program") break;
    walker = walker.parent;
  }
  return false;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw pixel literals in layout-property contexts — use named exports from src/shared/constants/layout.ts",
    },
    schema: [],
    messages: {
      magicLiteral:
        "Magic layout literal '{{value}}' in '{{prop}}' — import from src/shared/constants/layout.ts or annotate with @lint-layout-policy: <reason>.",
    },
  },
  create(context) {
    return {
      Property(node) {
        const keyName =
          node.key.type === "Identifier" ? node.key.name :
          node.key.type === "Literal" ? node.key.value : null;
        if (!keyName || !LAYOUT_PROPS.has(keyName)) return;
        if (node.value.type !== "Literal") return;
        const val = node.value.value;
        if (typeof val !== "number") return;
        if (val < 10) return;
        if (hasPolicyComment(context, node)) return;
        context.report({
          node: node.value,
          messageId: "magicLiteral",
          data: { value: String(val), prop: keyName },
        });
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.cooked).join("");
        if (!TEMPLATE_LAYOUT_RE.test(raw)) return;
        if (hasPolicyComment(context, node)) return;
        TEMPLATE_LAYOUT_RE.lastIndex = 0;
        let m;
        while ((m = TEMPLATE_LAYOUT_RE.exec(raw)) !== null) {
          const prop = m[1].toLowerCase();
          const value = m[2];
          if (Number(value) < 10) continue;
          context.report({
            node,
            messageId: "magicLiteral",
            data: { value, prop },
          });
        }
      },
    };
  },
};
