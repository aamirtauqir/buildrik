/**
 * Self-tests for no-inline-hex.cjs after PR3 rule-scope tighten.
 *
 * Pre-fix: TemplateLiteral matcher fired on EVERY template literal
 * containing hex anywhere in the file — produced 700+ false positives
 * in templates/ + blocks/ where the literal stores user-content HTML
 * strings, not chrome styling. The rule's own docstring said "Emotion
 * template literals," so the fix matches the documented intent:
 * fire only on Emotion-tagged templates (`css`, `styled.X`,
 * `keyframes`, `styled(C)`, `css(...)`).
 *
 * @license BSD-3-Clause
 */
import { RuleTester } from "eslint";
import rule from "../no-inline-hex.cjs";
import tsParser from "@typescript-eslint/parser";

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run("no-inline-hex", rule, {
  valid: [
    // Plain template literal storing HTML — NOT Emotion-tagged.
    // Pre-fix this fired; post-fix it's correctly ignored as data.
    { code: "const html = `<div style=\"color:#fff\">hi</div>`;" },
    // Plain string literal not in JSX style/css attribute — ignored.
    { code: 'const c = "#fff";' },
    // Tagged template with non-Emotion tag — not Emotion semantics.
    { code: "const t = String.raw`color: #fff`;" },
    // Per-site policy comment escapes the check.
    { code: "// @lint-hex-policy: branding\nconst c = css`color: #fff`;" },
    // JSX style attribute with token reference — token, not literal hex.
    {
      code: 'const c = <div style={{ color: "var(--buildrick-text)" }} />;',
    },
  ],
  invalid: [
    // Emotion css`...` with hex — fires.
    {
      code: "const c = css`color: #fff;`;",
      errors: [{ messageId: "inlineHex" }],
    },
    // styled.div`...` with hex — fires.
    {
      code: "const C = styled.div`color: #abc;`;",
      errors: [{ messageId: "inlineHex" }],
    },
    // keyframes`...` with hex — fires.
    {
      code: "const k = keyframes`from { color: #123; }`;",
      errors: [{ messageId: "inlineHex" }],
    },
    // styled(Component)`...` with hex — fires.
    {
      code: "const C = styled(Foo)`color: #f00;`;",
      errors: [{ messageId: "inlineHex" }],
    },
    // JSX style attribute with literal hex — fires.
    {
      code: 'const c = <div style={{ color: "#fff" }} />;',
      errors: [{ messageId: "inlineHex" }],
    },
    // JSX css attribute with literal hex — fires.
    {
      code: 'const c = <div css={{ color: "#aabbcc" }} />;',
      errors: [{ messageId: "inlineHex" }],
    },
  ],
});

console.log("no-inline-hex: all tests pass");
