"use strict";
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("../no-dangerous-html.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const PROP = "dangerously" + "SetInnerHTML";

ruleTester.run("no-dangerous-html", rule, {
  valid: [
    // Allowlist — engine canvas mount.
    {
      filename: "/abs/path/packages/editor/src/editor/canvas/Canvas.tsx",
      code: `const x = <div ${PROP}={{__html: ""}} />;`,
    },
    // Allowlist — sanitized AI messages.
    {
      filename: "/abs/path/packages/editor/src/ai/AICopilot.tsx",
      code: `const x = <div ${PROP}={{__html: ""}} />;`,
    },
    // Plain JSX in a non-allowlisted file — fine.
    {
      filename: "/abs/path/packages/editor/src/editor/sidebar/SomePanel.tsx",
      code: `const x = <div className="foo">hi</div>;`,
    },
    // Comment mentioning the prop — not a JSX attribute, fine.
    {
      filename: "/abs/path/packages/editor/src/editor/sidebar/Other.tsx",
      code: `// comment about ${PROP} should not trigger\nconst x = <div />;`,
    },
  ],
  invalid: [
    // Sidebar panel — disallowed.
    {
      filename: "/abs/path/packages/editor/src/editor/sidebar/SomePanel.tsx",
      code: `const x = <div ${PROP}={{__html: ""}} />;`,
      errors: [{ messageId: "forbidden" }],
    },
    // Inspector — disallowed.
    {
      filename: "/abs/path/packages/editor/src/editor/inspector/Foo.tsx",
      code: `const x = <span ${PROP}={{__html: "<b>x</b>"}} />;`,
      errors: [{ messageId: "forbidden" }],
    },
  ],
});

console.log("no-dangerous-html: tests passed");
