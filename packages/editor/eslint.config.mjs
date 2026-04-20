/**
 * ESLint flat config — DS V1 + Chrome Axioms (DESIGN.md §Chrome Axioms).
 *
 * Two layers of enforcement for chrome files:
 *   1. Base DS V1 rules (no-inline-hex, no-inspector-tokens, no-get-property-value-ds)
 *      from the local `buildrik` plugin — apply to all src/ files.
 *   2. Chrome Axiom A1 rules — `no-restricted-syntax` selectors scoped via a separate
 *      chrome-files block. Use a DIFFERENT rule key so they compose with the base's
 *      existing no-restricted-syntax from the plugin (if any), rather than stomping
 *      the DS V1 getPropertyValue restriction.
 *
 * WARN mode at introduction. Real enforcement is the grep gates in
 * scripts/ds-grep-gates.sh (+ scripts/.chrome-axioms-baseline). ESLint here is
 * advisory IDE feedback — CI step uses `|| true` intentionally; see DESIGN.md
 * §Chrome Axioms → Enforcement.
 *
 * @license BSD-3-Clause
 */
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const buildrik = require("./eslint-rules/index.cjs");

// Chrome paths — enforced by Chrome Axioms. Mirrors scope in
// scripts/ds-grep-gates.sh (gates 11-14) and DESIGN.md §Chrome Axioms → Scope.
const CHROME_FILES = [
  "src/editor/**/*.{ts,tsx}",
  "src/shared/ui/**/*.{ts,tsx}",
  "src/shared/forms/**/*.{ts,tsx}",
];

// LOCAL_SHADOW — files that legitimately render or edit user-site content.
// Keep in sync with scripts/ds-grep-gates.sh CHROME_EXCLUDE and
// DESIGN.md §Chrome Axioms → Scope.
const CHROME_EXEMPT = [
  "**/__tests__/**",
  "**/*.test.{ts,tsx}",
  "**/*.stories.{ts,tsx}",
  "src/editor/sidebar/tabs/design/**",
  "src/editor/inspector/sections/BackgroundSection.tsx",
  "src/editor/media/VideoPreview.tsx",
  "src/editor/export/PreviewFrame.tsx",
  "src/editor/wizard/sectionData.ts",
  "src/shared/forms/GradientPicker.tsx",
  "src/shared/utils/parsers/**",
];

// Form atoms — may use the full radius/shadow scale. Exempt ONLY from the
// radius-above-4 rule; gradient + raw-shadow axioms still apply.
const FORM_ATOMS = [
  "src/shared/ui/Button.tsx",
  "src/shared/ui/IconButton.tsx",
  "src/shared/ui/Tooltip.tsx",
  "src/shared/ui/Toast.tsx",
  "src/shared/ui/Modal.tsx",
  "src/shared/ui/Badge.tsx",
  "src/shared/ui/PremiumBadge.tsx",
  "src/shared/ui/Kbd.tsx",
  "src/shared/ui/SharedDialogs.tsx",
  "src/shared/forms/*.tsx",
];

export default [
  js.configs.recommended,
  // Base config — DS V1 rules apply to everything in src/.
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { buildrik },
    rules: {
      "buildrik/no-inline-hex": "error",
      "buildrik/no-inspector-tokens": "error",
      "buildrik/no-get-property-value-ds": "error",
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  // Chrome Axioms A1 + Survivor #3 — ALL chrome-file no-restricted-syntax
  // selectors MUST live in this single block. ESLint flat-config overrides
  // same rule key across matching blocks (last wins), so splitting across
  // blocks would cause selector stomping. This is the bug Codex flagged in
  // the Week 0 first draft (C2). Do NOT add a second `no-restricted-syntax`
  // block for chrome files elsewhere in this config — extend this list.
  {
    files: CHROME_FILES,
    ignores: CHROME_EXEMPT,
    rules: {
      "no-restricted-syntax": [
        "warn",
        // Chrome Axiom A1.1 — gradient in string literal.
        {
          selector:
            "Literal[value=/linear-gradient|radial-gradient|conic-gradient/]",
          message:
            "Chrome Axiom A1.1: no gradients in chrome. See DESIGN.md §Chrome Axioms.",
        },
        // Chrome Axiom A1.1 — gradient in Emotion tagged-template literal.
        {
          selector:
            "TemplateElement[value.raw=/linear-gradient|radial-gradient|conic-gradient/]",
          message:
            "Chrome Axiom A1.1: no gradients in chrome (Emotion). See DESIGN.md §Chrome Axioms.",
        },
        // Chrome Axiom A1.2 — box-shadow in Emotion templates must reference a token.
        {
          selector:
            "TemplateElement[value.raw=/box-shadow:\\s*(?!var\\(--buildrick-)/]",
          message:
            "Chrome Axiom A1.2: box-shadow must use a --buildrick-shadow-* token. See DESIGN.md §Chrome Axioms.",
        },
        // Chrome Axiom A1.2 — JSX inline-style boxShadow with raw string value.
        {
          selector:
            "Property[key.name='boxShadow'][value.type='Literal'][value.value=/rgb|rgba|#[0-9a-fA-F]|^[0-9]/]",
          message:
            "Chrome Axiom A1.2: boxShadow inline style must reference a --buildrick-shadow-* token via var(). See DESIGN.md §Chrome Axioms.",
        },
        // Chrome Axiom A1.1 — JSX inline-style backgroundImage with a gradient.
        {
          selector:
            "Property[key.name='backgroundImage'][value.type='Literal'][value.value=/gradient/]",
          message:
            "Chrome Axiom A1.1: backgroundImage inline style must not use a gradient. See DESIGN.md §Chrome Axioms.",
        },
        // Survivor #3 — banned magic layout literal in a React.CSSProperties
        // or Emotion object Property. Import from src/shared/constants/layout.ts.
        // 177 existing TSX violations (Gate 14 baseline); WARN until Week 3
        // PanelShell migration lowers the count.
        // Selector uses `value.raw` (string) not `value.value` (number) — regex
        // in ESLint selectors operates on strings.
        // Numeric form: `height: 44` — Literal.raw is "44".
        {
          selector:
            "Property[key.type='Identifier'][key.name=/^(height|width|minHeight|maxWidth|minWidth|maxHeight|padding|paddingLeft|paddingRight|paddingTop|paddingBottom|margin|marginLeft|marginRight|marginTop|marginBottom|top|bottom|left|right|gap|rowGap|columnGap)$/][value.type='Literal'][value.raw=/^(28|32|36|40|44|48|56|60|240|300|320)$/]",
          message:
            "Survivor #3: magic layout literal banned. Import from src/shared/constants/layout.ts (RAIL_W / SIDEBAR_W / INSPECTOR_W / TOPBAR_H / HEADER_H / TOOLBAR_H / FOOTER_H / ROW_SM / ROW_MD / ROW_LG).",
        },
        // String-px form: `height: "44px"` — Literal.raw is `"44px"` (with quotes).
        // Common in TSX files where CSS-property strings are used. Gate 14 counts
        // these; parity between ESLint and gate requires both selectors.
        {
          selector:
            "Property[key.type='Identifier'][key.name=/^(height|width|minHeight|maxWidth|minWidth|maxHeight|padding|paddingLeft|paddingRight|paddingTop|paddingBottom|margin|marginLeft|marginRight|marginTop|marginBottom|top|bottom|left|right|gap|rowGap|columnGap)$/][value.type='Literal'][value.raw=/^[\"'](28|32|36|40|44|48|56|60|240|300|320)px[\"']$/]",
          message:
            "Survivor #3: magic layout literal (string form) banned. Import from src/shared/constants/layout.ts and interpolate, e.g. height: `${HEADER_H}px`.",
        },
      ],
    },
  },
  // Chrome Axiom A1.3 — border-radius ≤ 4 on panel chrome. Form atoms exempt.
  {
    files: CHROME_FILES,
    ignores: [...CHROME_EXEMPT, ...FORM_ATOMS],
    rules: {
      "no-restricted-properties": [
        "warn",
        {
          object: "styles",
          property: "borderRadius",
          message:
            "Chrome Axiom A1.3: panel chrome border-radius must be ≤ 4 (--buildrick-radius-sm). Form atoms exempt. See DESIGN.md §Chrome Axioms.",
        },
      ],
    },
  },
  // Survivor #6 — ban legacy components/** imports from editor/** code.
  // CLAUDE.md already forbids this socially; this makes it a build gate.
  // Zero existing violations verified 2026-04-20, so ships as error (not warn).
  // Covers relative, absolute-src, and the tsconfig path aliases
  // @/components/* and @components/* (see packages/editor/tsconfig.json paths).
  {
    files: ["src/editor/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/components/**",
                "../components/**",
                "../../components/**",
                "../../../components/**",
                "@components/**",
                "@components",
                "@/components/**",
                "src/components/**",
              ],
              message:
                "src/components/ is legacy (CLAUDE.md: 371 files, do not add). Move the source to src/editor/ or src/shared/ui/, or import a shared primitive instead.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/__tests__/**",
      "**/*.test.{ts,tsx}",
      "vite.config.ts",
      "vitest.config.ts",
      "eslint.config.mjs",
      "eslint-rules/**",
      "scripts/**",
      "demo/**",
    ],
  },
];
