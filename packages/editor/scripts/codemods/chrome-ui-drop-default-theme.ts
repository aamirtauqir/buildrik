// packages/editor/scripts/codemods/chrome-ui-drop-default-theme.ts
/**
 * B3 theme-prop rule (chrome-ui-single-surface spec §4 B3): drop `theme={...}`
 * ONLY where it is byte-identical to the wrapper's own default —
 * `theme={BK_TEXT_INPUT_THEME}` on a `<TextInput>` element, or
 * `theme={BK_SELECT_BASE_THEME}` on a `<Select>` element. Now that both
 * wrappers apply that exact theme by default (chrome-ui/TextInput.tsx,
 * chrome-ui/Select.tsx), repeating it at the call site is redundant.
 *
 * AST-precise on purpose (not a text regex): only removes a JsxAttribute
 * named "theme" whose initializer is a JsxExpression containing EXACTLY the
 * bare identifier BK_TEXT_INPUT_THEME / BK_SELECT_BASE_THEME (no ternary, no
 * spread, no merge call), and only on a JSX element literally named
 * TextInput / Select. This is why the three documented exemptions
 * (InputControls.tsx's inline theme object, BK_SELECT_BARE_UNIT_THEME,
 * BK_SELECT_BARE_VALUE_THEME) are structurally untouched — different
 * identifiers, never matched by this script at all.
 *
 * After removing the attribute, if the dropped identifier is no longer
 * referenced anywhere else in the file, its import specifier is removed too
 * (dead-import cleanup) — from whichever declaration currently holds it,
 * deep chrome-ui/textInputTheme|selectTheme path or the barrel.
 *
 * Usage: npx tsx scripts/codemods/chrome-ui-drop-default-theme.ts <file>...
 *
 * @license BSD-3-Clause
 */
import { Project, QuoteKind, Node, SyntaxKind } from "ts-morph";
import { resolve } from "node:path";

const EDITOR_ROOT = resolve(import.meta.dirname, "../..");

const RULES: { tag: string; identifier: string }[] = [
  { tag: "TextInput", identifier: "BK_TEXT_INPUT_THEME" },
  { tag: "Select", identifier: "BK_SELECT_BASE_THEME" },
];

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: chrome-ui-drop-default-theme.ts <file>...");
  process.exit(1);
}

const project = new Project({
  tsConfigFilePath: resolve(EDITOR_ROOT, "tsconfig.json"),
  manipulationSettings: { quoteKind: QuoteKind.Double },
});

let changedFiles = 0;
let droppedAttrs = 0;
let removedImports = 0;

for (const rawPath of args) {
  const absPath = resolve(rawPath);
  const sf = project.addSourceFileAtPathIfExists(absPath);
  if (!sf) {
    console.error(`[chrome-ui-drop-default-theme] SKIP (not found): ${rawPath}`);
    continue;
  }

  let fileChanged = false;
  const droppedIdentifiers = new Set<string>();

  for (const rule of RULES) {
    const openingElements = [
      ...sf.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
      ...sf.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ];

    for (const el of openingElements) {
      const tagName = el.getTagNameNode().getText();
      if (tagName !== rule.tag) continue;

      const themeAttr = el.getAttribute("theme");
      if (!themeAttr || !Node.isJsxAttribute(themeAttr)) continue;

      const init = themeAttr.getInitializer();
      if (!init || !Node.isJsxExpression(init)) continue;
      const expr = init.getExpression();
      if (!expr || !Node.isIdentifier(expr) || expr.getText() !== rule.identifier) continue;

      themeAttr.remove();
      droppedAttrs += 1;
      fileChanged = true;
      droppedIdentifiers.add(rule.identifier);
    }
  }

  if (!fileChanged) continue;

  // Dead-import cleanup: if a dropped identifier has zero remaining
  // references anywhere in the file, remove its import specifier.
  for (const identifier of droppedIdentifiers) {
    const remainingRefs = sf
      .getDescendantsOfKind(SyntaxKind.Identifier)
      .filter((id) => id.getText() === identifier);
    // Any remaining reference means it's still used (e.g. passed as a
    // caller theme to compose with a different default) — leave it alone.
    const stillUsed = remainingRefs.some((id) => {
      const parent = id.getParent();
      return !(parent && Node.isImportSpecifier(parent));
    });
    if (stillUsed) continue;

    for (const imp of sf.getImportDeclarations()) {
      const named = imp.getNamedImports().find((n) => n.getName() === identifier);
      if (!named) continue;
      named.remove();
      removedImports += 1;
      if (imp.getNamedImports().length === 0 && !imp.getDefaultImport() && !imp.getNamespaceImport()) {
        imp.remove();
      }
    }
  }

  changedFiles += 1;
}

project.saveSync();
console.log(
  `[chrome-ui-drop-default-theme] ${changedFiles} file(s) changed, ${droppedAttrs} theme prop(s) dropped, ${removedImports} now-dead import specifier(s) removed.`,
);
