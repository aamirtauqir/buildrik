/**
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-gallery-shadow.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const galleryFile =
  "/Users/x/buildrik/packages/editor/src/preview/vibcoder-foo.tsx";
const otherFile =
  "/Users/x/buildrik/packages/editor/src/preview/_galleryStyles.ts";

ruleTester.run("no-gallery-shadow", rule, {
  valid: [
    // Imports the canonical helper — fine.
    {
      filename: galleryFile,
      code: `import { sectionLabel } from "./_galleryStyles"; export const Demo = () => null;`,
    },
    // Renames around the forbidden name (no `field` decl) — fine.
    {
      filename: galleryFile,
      code: `const formRow = { display: "block" };`,
    },
    // Identifier appears as a function param, not a top-level decl — fine.
    {
      filename: galleryFile,
      code: `function fn(field) { return field; }`,
    },
    // Outside the gallery scope — rule skips entirely.
    {
      filename: otherFile,
      code: `export const sectionLabel = { fontSize: 12 };`,
    },
  ],
  invalid: [
    {
      filename: galleryFile,
      code: `const sectionLabel = { fontSize: 12 };`,
      errors: [{ messageId: "shadow", data: { name: "sectionLabel" } }],
    },
    {
      filename: galleryFile,
      code: `const stack = { display: "flex" };`,
      errors: [{ messageId: "shadow" }],
    },
    {
      filename: galleryFile,
      code: `const flexRow = { display: "flex" };`,
      errors: [{ messageId: "shadow" }],
    },
    {
      filename: galleryFile,
      code: `const field = { display: "block" };`,
      errors: [{ messageId: "shadow" }],
    },
    {
      filename: galleryFile,
      code: `const darkSurface = { background: "#000" };`,
      errors: [{ messageId: "shadow" }],
    },
    // Exported declarations still count.
    {
      filename: galleryFile,
      code: `export const field = { display: "block" };`,
      errors: [{ messageId: "shadow" }],
    },
    // Multiple decls in one statement — both fire.
    {
      filename: galleryFile,
      code: `const stack = {}, field = {};`,
      errors: [{ messageId: "shadow" }, { messageId: "shadow" }],
    },
  ],
});
console.log("no-gallery-shadow: all tests pass");
