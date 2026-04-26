"use strict";
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("../no-hardcoded-open-prop.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-hardcoded-open-prop", rule, {
  valid: [
    // Stateful — allowed
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={open} />;",
    },
    {
      filename: "/p/preview/vibcoder-drawer.tsx",
      code: "const X = () => <Drawer open={isOpen} />;",
    },
    // open={false} — allowed (no behavioral concern)
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={false} />;",
    },
    // Outside scope — ignored
    {
      filename: "/p/preview/vibcoder-button.tsx",
      code: "const X = () => <Modal open={true} />;",
    },
    {
      filename: "/p/somewhere/else.tsx",
      code: "const X = () => <Modal open={true} />;",
    },
    // Layout-only gallery (not in scope) — ignored
    {
      filename: "/p/preview/vibcoder-topbar.tsx",
      code: "const X = () => <Topbar />;",
    },
  ],
  invalid: [
    {
      filename: "/p/preview/vibcoder-modal.tsx",
      code: "const X = () => <Modal open={true} />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
    {
      filename: "/p/preview/vibcoder-command-palette.tsx",
      code: "const X = () => <CommandPalette open={true} />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
    {
      filename: "/p/preview/vibcoder-color-picker.tsx",
      code: "const X = () => <ColorPicker open={ true } onChange={() => {}} value=\"#fff\" />;",
      errors: [{ messageId: "hardcodedOpen" }],
    },
  ],
});

console.log("no-hardcoded-open-prop: tests passed");
