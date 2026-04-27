/**
 * Phase 5 codemod — TextInput shim deletion.
 *
 * TextInput was a Phase 4 BRIDGE shim mapping to vibcoder Input. This codemod:
 *   1. Rewrites `import { TextInput } from "@/shared/ui/TextInput"` to
 *      `import { Input } from "@/editor/shared/vibcoder/Input"`.
 *   2. Renames the type import `TextInputProps` → `InputProps`.
 *   3. Rewrites JSX `<TextInput>` → `<Input>` (self-closing + paired).
 *   4. Renames prop `invalid` → `error` (vibcoder Input uses `error` for the
 *      same state modifier).
 *   5. Drops `inputSize` prop entirely (vibcoder Input has no size variants;
 *      Phase 4 shim silently no-op'd it).
 *
 * Skip rules via `_lib/skip-rules.ts`.
 *
 * @license BSD-3-Clause
 */
import type { Transform } from "jscodeshift";
import { shouldSkipPath } from "../_lib/skip-rules";

const FROM_PATH_PATTERNS: (string | RegExp)[] = [
  "@/shared/ui/TextInput",
  /\.\.\/.*shared\/ui\/TextInput$/,
];
const TO_PATH = "@/editor/shared/vibcoder/Input";

const matchesFromPath = (value: string): boolean =>
  FROM_PATH_PATTERNS.some((pat) =>
    typeof pat === "string" ? value === pat : pat.test(value),
  );

const transform: Transform = (file, api) => {
  if (shouldSkipPath(file.path)) return file.source;

  const j = api.jscodeshift;
  const root = j(file.source);
  let modified = false;

  // 1. Find ImportDeclarations for TextInput shim and rewrite
  root.find(j.ImportDeclaration).forEach((path) => {
    const sourceValue = path.node.source.value;
    if (typeof sourceValue !== "string") return;
    if (!matchesFromPath(sourceValue)) return;

    const specifiers = path.node.specifiers || [];
    let hasTarget = false;

    for (const spec of specifiers) {
      if (spec.type !== "ImportSpecifier") continue;
      const importedName =
        spec.imported.type === "Identifier" ? spec.imported.name : null;

      if (importedName === "TextInput") {
        spec.imported = j.identifier("Input");
        if (spec.local && spec.local.name === "TextInput") {
          spec.local = j.identifier("Input");
        }
        hasTarget = true;
      } else if (importedName === "TextInputProps") {
        spec.imported = j.identifier("InputProps");
        if (spec.local && spec.local.name === "TextInputProps") {
          spec.local = j.identifier("InputProps");
        }
        hasTarget = true;
      }
    }

    if (hasTarget) {
      path.node.source = j.literal(TO_PATH);
      modified = true;
    }
  });

  // 2. Rewrite JSX tag names: <TextInput> → <Input>
  root.find(j.JSXOpeningElement).forEach((path) => {
    if (
      path.node.name.type === "JSXIdentifier" &&
      path.node.name.name === "TextInput"
    ) {
      path.node.name = j.jsxIdentifier("Input");
      modified = true;

      // 3. Rename `invalid` → `error` and drop `inputSize` on this element's attributes
      const attributes = path.node.attributes || [];
      const newAttributes: typeof attributes = [];
      for (const attr of attributes) {
        if (attr.type !== "JSXAttribute") {
          newAttributes.push(attr);
          continue;
        }
        const name =
          attr.name.type === "JSXIdentifier" ? attr.name.name : null;
        if (name === "invalid") {
          attr.name = j.jsxIdentifier("error");
          newAttributes.push(attr);
        } else if (name === "inputSize") {
          // drop — don't push
        } else {
          newAttributes.push(attr);
        }
      }
      path.node.attributes = newAttributes;
    }
  });

  // 4. Rewrite closing JSX tag names: </TextInput> → </Input>
  root.find(j.JSXClosingElement).forEach((path) => {
    if (
      path.node.name.type === "JSXIdentifier" &&
      path.node.name.name === "TextInput"
    ) {
      path.node.name = j.jsxIdentifier("Input");
      modified = true;
    }
  });

  // 5. Rewrite type references: TextInputProps → InputProps
  root.find(j.TSTypeReference).forEach((path) => {
    if (
      path.node.typeName.type === "Identifier" &&
      path.node.typeName.name === "TextInputProps"
    ) {
      path.node.typeName = j.identifier("InputProps");
      modified = true;
    }
  });

  return modified ? root.toSource({ quote: "double" }) : file.source;
};

export default transform;
