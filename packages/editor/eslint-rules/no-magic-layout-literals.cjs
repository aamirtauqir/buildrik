/**
 * ESLint rule: no-magic-layout-literals
 * Bans raw pixel literals in layout-property contexts (width/height/padding/etc).
 * Consumers use named exports from src/shared/constants/layout.ts.
 * Honors `// @lint-layout-policy: <reason>` on the line above the offending
 * site as a per-site escape. Scope is the immediate enclosing statement only —
 * a comment at file top does NOT exempt the whole file.
 * @license BSD-3-Clause
 */
"use strict";

const LAYOUT_PROPS = new Set([
  "width", "height",
  "minWidth", "minHeight", "maxWidth", "maxHeight",
  "top", "left", "right", "bottom", "inset",
  "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "gap", "rowGap", "columnGap",
  "flexBasis",
]);

const POLICY_RE = /@lint-layout-policy:/;

// Template-literal pattern. Covers shorthand + every long-hand padding/margin
// variant + row-gap / column-gap + flex-basis + inset. Stays in sync with
// LAYOUT_PROPS (any addition there should be mirrored here).
const TEMPLATE_LAYOUT_PATTERN =
  /\b(width|height|min-?width|min-?height|max-?width|max-?height|top|left|right|bottom|inset|padding(?:-top|-bottom|-left|-right)?|margin(?:-top|-bottom|-left|-right)?|(?:row-|column-)?gap|flex-basis)\s*:\s*(\d{2,})px/gi;

// Skip values < 10. Covers border widths (1-4), zero gaps, decorative offsets.
// Every chrome dimension constant in shared/constants/layout.ts sits at 28+
// (ROW_SM=28 up to SIDEBAR_WIDE=320). Anything below 10 is unlikely to be a
// chrome layout dimension and would create noise.
const MIN_LITERAL = 10;

function hasPolicyCommentOnEnclosingStatement(context, node) {
  const sourceCode = context.sourceCode ?? context.getSourceCode();
  // Walk one hop up to the enclosing Statement (VariableDeclaration,
  // ExpressionStatement, ReturnStatement, JSXAttribute, etc.). Comments
  // typically attach there, not to the deeply-nested Property/TemplateLiteral.
  // Bounded walk: stop at the first ancestor with a leading policy comment,
  // OR at the first Statement ancestor (whichever comes first), OR at Program.
  let walker = node;
  let hops = 0;
  while (walker && walker.type !== "Program" && hops < 6) {
    const commentsBefore = sourceCode.getCommentsBefore(walker);
    if (commentsBefore.some((c) => POLICY_RE.test(c.value))) return true;
    // Stop at the immediate Statement boundary so a top-of-file policy comment
    // does NOT exempt the whole file.
    if (walker.type && walker.type.endsWith("Statement")) return false;
    if (walker.type === "VariableDeclaration") return false;
    walker = walker.parent;
    hops += 1;
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
        if (val < MIN_LITERAL) return;
        if (hasPolicyCommentOnEnclosingStatement(context, node)) return;
        context.report({
          node: node.value,
          messageId: "magicLiteral",
          data: { value: String(val), prop: keyName },
        });
      },
      TemplateLiteral(node) {
        const raw = node.quasis.map((q) => q.value.cooked).join("");
        if (hasPolicyCommentOnEnclosingStatement(context, node)) return;
        // matchAll avoids stateful lastIndex on a shared module-scope regex.
        for (const m of raw.matchAll(TEMPLATE_LAYOUT_PATTERN)) {
          const prop = m[1].toLowerCase();
          const value = m[2];
          if (Number(value) < MIN_LITERAL) continue;
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
