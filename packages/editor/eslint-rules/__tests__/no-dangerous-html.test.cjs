"use strict";
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const path = require("path");
const rule = require("../no-dangerous-html.cjs");

// Set CWD to the editor package root so context.cwd matches the rule's
// real-world expected cwd (where eslint.config.mjs lives). Filenames in
// tests are then absolute paths under that root, and path.relative()
// produces "src/..." paths that match ALLOWED_FILES.
const PKG_ROOT = path.resolve(__dirname, "..", "..");
process.chdir(PKG_ROOT);

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const PROP = "dangerously" + "SetInnerHTML";

function caseAt(repoRel, code, extras = {}) {
  return {
    filename: path.join(PKG_ROOT, repoRel),
    code,
    ...extras,
  };
}

ruleTester.run("no-dangerous-html", rule, {
  valid: [
    // Allowlist — engine canvas mount.
    caseAt(
      "src/editor/canvas/Canvas.tsx",
      `const x = <div ${PROP}={{__html: ""}} />;`
    ),
    // Allowlist — sanitized AI messages.
    caseAt(
      "src/ai/AICopilot.tsx",
      `const x = <div ${PROP}={{__html: ""}} />;`
    ),
    // Plain JSX in a non-allowlisted file — fine.
    caseAt(
      "src/editor/sidebar/SomePanel.tsx",
      `const x = <div className="foo">hi</div>;`
    ),
    // Comment mentioning the prop — not a JSX attribute, fine.
    caseAt(
      "src/editor/sidebar/Other.tsx",
      `// comment about ${PROP} should not trigger\nconst x = <div />;`
    ),
    // Spread of a pre-built variable — out of static analysis scope (allowed).
    caseAt(
      "src/editor/sidebar/Foo.tsx",
      `const props = {}; const x = <div {...props} />;`
    ),
    // Spread of a function call result — out of scope (allowed).
    caseAt(
      "src/editor/sidebar/Foo.tsx",
      `function makeProps() { return {}; } const x = <div {...makeProps()} />;`
    ),
  ],
  invalid: [
    // Direct attribute — disallowed in non-allowlisted file.
    caseAt(
      "src/editor/sidebar/SomePanel.tsx",
      `const x = <div ${PROP}={{__html: ""}} />;`,
      { errors: [{ messageId: "forbidden" }] }
    ),
    // Direct attribute — different non-allowlisted file.
    caseAt(
      "src/editor/inspector/Foo.tsx",
      `const x = <span ${PROP}={{__html: "<b>x</b>"}} />;`,
      { errors: [{ messageId: "forbidden" }] }
    ),
    // [P1B] JSXSpread with object literal — primary bypass codex flagged.
    caseAt(
      "src/editor/sidebar/Bypass.tsx",
      `const x = <div {...{ ${PROP}: { __html: "evil" } }} />;`,
      { errors: [{ messageId: "forbiddenSpread" }] }
    ),
    // [P1B] JSXSpread with string-literal key.
    caseAt(
      "src/editor/sidebar/Bypass2.tsx",
      `const x = <div {...{ "${PROP}": { __html: "evil" } }} />;`,
      { errors: [{ messageId: "forbiddenSpread" }] }
    ),
    // [P1B] Nested spread within spread — recursive detection.
    caseAt(
      "src/editor/sidebar/Bypass3.tsx",
      `const x = <div {...{ ...{ ${PROP}: { __html: "evil" } } }} />;`,
      { errors: [{ messageId: "forbiddenSpread" }] }
    ),
    // [P2B] Mirror path under node_modules — must NOT inherit exemption.
    caseAt(
      "node_modules/some-vendor/editor/canvas/Canvas.tsx",
      `const x = <div ${PROP}={{__html: ""}} />;`,
      { errors: [{ messageId: "forbidden" }] }
    ),
    // [P2B] Path outside cwd (rel would start with ../, getting rejected).
    {
      filename: "/totally/different/path/Canvas.tsx",
      code: `const x = <div ${PROP}={{__html: ""}} />;`,
      errors: [{ messageId: "forbidden" }],
    },
  ],
});

console.log("no-dangerous-html: tests passed");
