"use strict";
const { RuleTester } = require("eslint");
const tsParser = require("@typescript-eslint/parser");
const rule = require("../no-engine-public-export.cjs");

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-engine-public-export", rule, {
  valid: [
    // Internal import — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'import * as RadixDialog from "@radix-ui/react-dialog"; export const Modal = () => null;',
    },
    // Local export — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: "export const Modal = () => null;",
    },
    // Re-export from sibling — allowed
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export { Foo } from "./helpers";',
    },
    // Forbidden source but file outside scope — ignored
    {
      filename: "/path/to/somewhere/else.tsx",
      code: 'export { Root } from "@radix-ui/react-dialog";',
    },
  ],
  invalid: [
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export { Root } from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export type { DialogProps } from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/CommandPalette.tsx",
      code: 'export { Item } from "cmdk";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/ColorPicker.tsx",
      code: 'export type { Color } from "react-colorful";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
    {
      filename: "/path/to/editor/shared/vibcoder/Modal.tsx",
      code: 'export * from "@radix-ui/react-dialog";',
      errors: [{ messageId: "forbiddenReExport" }],
    },
  ],
});

console.log("no-engine-public-export: tests passed");
