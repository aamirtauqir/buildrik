/**
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-magic-layout-literals.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-magic-layout-literals", rule, {
  valid: [
    { code: `const s = { width: 1 };` },
    { code: `import { RAIL_W } from "@/shared/constants/layout"; const s = { width: RAIL_W };` },
    { code: `const s = { fontSize: 44 };` },
    { code: `// @lint-layout-policy: sprite-sheet offset\nconst s = { width: 60 };` },
    { code: "const s = `width: ${RAIL_W}px`;" },
  ],
  invalid: [
    {
      code: `const s = { width: 60 };`,
      errors: [{ messageId: "magicLiteral" }],
    },
    {
      code: `const s = { height: 240 };`,
      errors: [{ messageId: "magicLiteral" }],
    },
    {
      code: `const s = { minWidth: 320, maxHeight: 56 };`,
      errors: [{ messageId: "magicLiteral" }, { messageId: "magicLiteral" }],
    },
    {
      code: "const s = `width: 60px`;",
      errors: [{ messageId: "magicLiteral" }],
    },
  ],
});
console.log("no-magic-layout-literals: all tests pass");
