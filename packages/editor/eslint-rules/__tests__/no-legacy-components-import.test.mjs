/**
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-legacy-components-import.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: { parser: tsParser, ecmaVersion: 2022, sourceType: "module" },
});

ruleTester.run("no-legacy-components-import", rule, {
  valid: [
    { code: `import { X } from "@/editor/shared/foo";`, filename: "src/editor/a.tsx" },
    { code: `import { X } from "@shared/ui/Button";`, filename: "src/editor/a.tsx" },
    { code: `import { X } from "../components/LocalChild";`, filename: "src/editor/sidebar/tabs/pages/PagesTab.tsx" },
    { code: `import { X } from "@components/LegacyThing";`, filename: "src/components/a.tsx" },
  ],
  invalid: [
    {
      code: `import { X } from "@components/LegacyThing";`,
      filename: "src/editor/a.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `import { X } from "@/components/LegacyThing";`,
      filename: "src/editor/a.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `import { X } from "../../../components/LegacyThing";`,
      filename: "src/editor/sidebar/tabs/pages/PagesTab.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
    {
      code: `import { X } from "../../components/LegacyThing";`,
      filename: "src/editor/sidebar/PagesTab.tsx",
      errors: [{ messageId: "legacyImport" }],
    },
  ],
});
console.log("no-legacy-components-import: all tests pass");
