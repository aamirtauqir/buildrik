/**
 * Phase 5 codemod — Button shim deletion.
 *
 * Button was a Phase 4 BRIDGE shim mapping legacy Button to vibcoder Button.
 * This codemod:
 *   1. Rewrites `import { Button } from "@/shared/ui/Button"` (and relative variants)
 *      to `import { Button } from "@/editor/shared/vibcoder/Button"`.
 *   2. Rewrites `import { ButtonProps } from "@/shared/ui/Button"` → same path.
 *   3. Renames prop `loading` → `busy` on all `<Button>` elements.
 *   4. Replaces boolean `fullWidth` prop with `style={{ width: "100%" }}`:
 *      - If no existing `style` prop: adds `style={{ width: "100%" }}`.
 *      - If existing `style` with object expression: merges `width: "100%"` as
 *        first property (preserving consumer styles after).
 *      - If existing `style` with non-object expression (variable/call): drops
 *        `fullWidth` and adds `style={Object.assign({ width: "100%" }, <expr>)}`.
 *   5. Drops `icon` and `iconPosition` props (no real consumers use them; shim
 *      composed them as children but vibcoder Button accepts children directly).
 *
 * Skip rules via `_lib/skip-rules.ts`.
 *
 * @license BSD-3-Clause
 */
import type { Transform, JSXAttribute, JSXExpressionContainer, ObjectExpression } from "jscodeshift";
import { shouldSkipPath } from "../_lib/skip-rules";

const FROM_PATH_PATTERNS: (string | RegExp)[] = [
  "@/shared/ui/Button",
  /\.\.\/.*shared\/ui\/Button$/,
];

const TO_PATH = "@/editor/shared/vibcoder/Button";

const matchesFromPath = (value: string): boolean =>
  FROM_PATH_PATTERNS.some((pat) =>
    typeof pat === "string" ? value === pat : pat.test(value),
  );

const transform: Transform = (file, api) => {
  if (shouldSkipPath(file.path)) return file.source;

  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  // 1. Rewrite import path (Button + ButtonProps — same target path, no rename needed)
  root.find(j.ImportDeclaration).forEach((path) => {
    const sourceValue = path.node.source.value;
    if (typeof sourceValue !== "string") return;
    if (!matchesFromPath(sourceValue)) return;

    const specifiers = path.node.specifiers || [];
    let hasButton = false;

    for (const spec of specifiers) {
      if (spec.type !== "ImportSpecifier") continue;
      const importedName =
        spec.imported.type === "Identifier" ? spec.imported.name : null;
      if (importedName === "Button" || importedName === "ButtonProps") {
        hasButton = true;
      }
    }

    if (hasButton) {
      path.node.source = j.literal(TO_PATH);
      modified = true;
    }
  });

  // 2. Rewrite <Button> element props: loading → busy, drop fullWidth, drop icon/iconPosition
  root.find(j.JSXOpeningElement).forEach((path) => {
    if (
      path.node.name.type !== "JSXIdentifier" ||
      path.node.name.name !== "Button"
    ) return;

    const attrs = path.node.attributes || [];
    const newAttrs: typeof attrs = [];
    let styleAttr: JSXAttribute | null = null;
    let hasFullWidth = false;
    let hasStyleAttr = false;

    // First pass: identify fullWidth and existing style
    for (const attr of attrs) {
      if (attr.type !== "JSXAttribute") continue;
      const name = attr.name.type === "JSXIdentifier" ? attr.name.name : null;
      if (name === "fullWidth") hasFullWidth = true;
      if (name === "style") {
        styleAttr = attr as JSXAttribute;
        hasStyleAttr = true;
      }
    }

    if (!hasFullWidth) {
      // No prop transformations on this element beyond loading → busy and icon drops
      for (const attr of attrs) {
        if (attr.type !== "JSXAttribute") {
          newAttrs.push(attr);
          continue;
        }
        const name = attr.name.type === "JSXIdentifier" ? attr.name.name : null;
        if (name === "icon" || name === "iconPosition") {
          modified = true;
          continue; // drop
        }
        if (name === "loading") {
          // rename loading → busy
          (attr as JSXAttribute).name = j.jsxIdentifier("busy");
          newAttrs.push(attr);
          modified = true;
          continue;
        }
        newAttrs.push(attr);
      }
      path.node.attributes = newAttrs;
      return;
    }

    // Has fullWidth — need to handle style merging
    modified = true;

    if (!hasStyleAttr) {
      // No existing style: add style={{ width: "100%" }}
      const widthProp = j.objectProperty(
        j.identifier("width"),
        j.stringLiteral("100%"),
      );
      widthProp.shorthand = false;
      const newStyleAttr = j.jsxAttribute(
        j.jsxIdentifier("style"),
        j.jsxExpressionContainer(
          j.objectExpression([widthProp]),
        ),
      );

      for (const attr of attrs) {
        if (attr.type !== "JSXAttribute") {
          newAttrs.push(attr);
          continue;
        }
        const name = attr.name.type === "JSXIdentifier" ? attr.name.name : null;
        if (name === "fullWidth") {
          newAttrs.push(newStyleAttr as typeof attrs[0]);
          continue;
        }
        if (name === "loading") {
          (attr as JSXAttribute).name = j.jsxIdentifier("busy");
          newAttrs.push(attr);
          continue;
        }
        if (name === "icon" || name === "iconPosition") continue; // drop
        newAttrs.push(attr);
      }
    } else {
      // Has existing style attr — merge width:"100%" into it
      const existingStyleValue = (styleAttr as JSXAttribute).value;

      let newStyleExpr: JSXExpressionContainer;

      if (
        existingStyleValue !== null &&
        existingStyleValue!.type === "JSXExpressionContainer" &&
        (existingStyleValue as JSXExpressionContainer).expression.type === "ObjectExpression"
      ) {
        // Inline object: { width: "100%", ...existing }
        const existingObj = (existingStyleValue as JSXExpressionContainer).expression as ObjectExpression;
        const widthProp = j.objectProperty(
          j.identifier("width"),
          j.stringLiteral("100%"),
        );
        widthProp.shorthand = false;
        const mergedObj = j.objectExpression([widthProp, ...existingObj.properties]);
        newStyleExpr = j.jsxExpressionContainer(mergedObj);
      } else if (
        existingStyleValue !== null &&
        existingStyleValue!.type === "JSXExpressionContainer"
      ) {
        // Style is a variable/call — use Object.assign({ width: "100%" }, expr)
        const inner = (existingStyleValue as JSXExpressionContainer).expression;
        const widthProp = j.objectProperty(
          j.identifier("width"),
          j.stringLiteral("100%"),
        );
        widthProp.shorthand = false;
        newStyleExpr = j.jsxExpressionContainer(
          j.callExpression(
            j.memberExpression(j.identifier("Object"), j.identifier("assign")),
            [j.objectExpression([widthProp]), inner as Parameters<typeof j.callExpression>[1][0]],
          ),
        );
      } else {
        // Unexpected style value shape — keep as-is, just drop fullWidth
        newStyleExpr = existingStyleValue as JSXExpressionContainer;
      }

      for (const attr of attrs) {
        if (attr.type !== "JSXAttribute") {
          newAttrs.push(attr);
          continue;
        }
        const name = attr.name.type === "JSXIdentifier" ? attr.name.name : null;
        if (name === "fullWidth") continue; // drop
        if (name === "style") {
          (styleAttr as JSXAttribute).value = newStyleExpr;
          newAttrs.push(styleAttr as typeof attrs[0]);
          continue;
        }
        if (name === "loading") {
          (attr as JSXAttribute).name = j.jsxIdentifier("busy");
          newAttrs.push(attr);
          continue;
        }
        if (name === "icon" || name === "iconPosition") continue; // drop
        newAttrs.push(attr);
      }
    }

    path.node.attributes = newAttrs;
  });

  return modified ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
