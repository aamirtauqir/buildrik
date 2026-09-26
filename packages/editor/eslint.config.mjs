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
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const buildrik = require("./eslint-rules/index.cjs");
// react-hooks: source files carry `// eslint-disable-next-line
// react-hooks/exhaustive-deps` directives that erroneously reported
// "rule definition not found" while the plugin was unregistered. Register
// it so those directives resolve; exhaustive-deps runs at WARN (advisory,
// non-blocking) matching the plugin's own recommended severity.
const reactHooks = require("eslint-plugin-react-hooks");

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
  // Token Binding primitives (Survivor #5). Box.tsx's `boxShadow:
  // resolveShadow(shadow)` resolves a typed token prop through the
  // resolver — syntactically it looks like a raw shadow to grep/ESLint,
  // but semantically it only emits var(--buildrick-*). Exempted per-file
  // so PanelShell.tsx and future primitive additions stay enforced.
  "src/shared/ui/ds/Box.tsx",
  "src/shared/ui/ds/tokens.ts",
  // B&W filter-preview gradient for stock photo source picker.
  // The linear-gradient is DATA representing a visual filter option,
  // not chrome styling. User-content preview, not chrome axiom scope.
  "src/editor/sidebar/tabs/media/components/StockSourceModal.tsx",
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
  // Global ignores: generated output, static assets, harness helper scripts and
  // untracked scratch files at the package root. `eslint .` visits all of these;
  // none is shipped code.
  { ignores: [".flowbite-react/**", "assets/**", "e2e/**/*.mjs", "*.mjs", "dist/**", "docs/**"] },
  js.configs.recommended,
  // Files outside src/ that `eslint .` still visits. Without a TS parser they
  // fail to PARSE ("Unexpected token <" / "as"), which is an error, which made
  // `pnpm run lint` — and every editor CI run behind it — red: 0 green runs in
  // the last 100 as of 2026-09-02, with the editor tests and the Figma
  // conformance step skipped every time. Parsed here, no DS rules applied.
  {
    files: ["e2e/**/*.{ts,tsx}", "*.config.{ts,mts}", "scripts/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    // TypeScript resolves names; `no-undef` on a .ts file only reports DOM/Node globals.
    // Base `no-unused-vars` flags parameter names inside function TYPES
    // (`(p: unknown) => void`); src/ turns it off for the same reason.
    rules: { "no-undef": "off", "no-unused-vars": "off" },
  },
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
    plugins: { buildrik, "@typescript-eslint": tseslintPlugin, "react-hooks": reactHooks },
    rules: {
      "buildrik/no-inline-hex": "error",
      "buildrik/no-inspector-tokens": "error",
      "buildrik/no-get-property-value-ds": "error",
      // Advisory only — resolves the in-source disable directives; never blocks.
      "react-hooks/exhaustive-deps": "warn",
      // Phase 0 sanitizer rule. Path-aware allowlist hard-coded inside
      // the rule (Canvas.tsx + AICopilot.tsx). Live audit per
      // 2026-05-07 plan: 2 expected hits — both inside the allowlist.
      "buildrik/no-dangerous-html": "error",
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
            "Survivor #3: magic layout literal banned. Chrome WIDTHS live in the generated tokens \u2014 read them with var(--bk-size-rail/drawer/inspector). RAIL_W, SIDEBAR_WIDE and INSPECTOR_W were deleted 2026-08-31 as second copies of those. Heights and row sizes still come from src/shared/constants/layout.ts (TOPBAR_H / HEADER_H / TOOLBAR_H / FOOTER_H / ROW_SM / ROW_MD / ROW_LG).",
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
      "buildrik/no-magic-layout-literals": "warn",
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
  // Layer-boundary rules (Audit Remediation 2026-05-07, PR2 ERROR-flip 2026-05-08).
  // Enforces import direction per packages/editor/CLAUDE.md "Import Direction Rules":
  //   engine/   → shared/ ONLY
  //   shared/   → leaf (no editor/)
  //   services/ → shared/ ONLY
  // Uses @typescript-eslint/no-restricted-imports with allowTypeImports: true so
  // type-only imports stay legal where idiomatic. ERROR mode flipped 2026-05-08
  // after PR1 closed the only engine→editor value import (StockService).
  //
  // D-6 (2026-09-26): the vibcoder-specific `no-engine-public-export` block
  // and the shared/extensions + ErrorState/HelpTooltip exemptions above it
  // were dropped — src/editor/shared/vibcoder/ and src/shared/extensions/
  // were deleted 2026-07-28 (packages/editor/CLAUDE.md, ds/fresh-token-system
  // stage 6), so the rule/ignores matched nothing. shared/forms/ keeps its
  // exemption: packages/editor/CLAUDE.md documents shared/forms/ → chrome-ui
  // as the one intentional shared/→editor/ edge (forms/ composes chrome-ui
  // controls with field wiring), not a vibcoder residual.
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**", "@editor/**"],
          message: "engine/ may not import from editor/ (engine is pure logic). Type-only imports allowed via `import type`.",
          allowTypeImports: true,
        }],
      }],
    },
  },
  // D-6: engine/ ↔ services/ boundary is new — WARN, not ERROR, until the
  // existing crossings it flags (Composer.ts's EmailService import,
  // FormHandler.ts, cmsSync/componentSync/versionSync) are triaged. See
  // ledger D-6 decision_free_fix. Uses the CORE `no-restricted-imports`
  // rule (a different key from `@typescript-eslint/no-restricted-imports`
  // above) so its "warn" severity does not get replaced by the ERROR
  // block's later-wins config-merge for the same files glob — flat config
  // has no per-pattern severity within one rule invocation. This rule has
  // no allowTypeImports equivalent, so a bare `import type` from services/
  // will also warn; acceptable at WARN (advisory) for a boundary this new.
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["warn", {
        patterns: [{
          group: ["**/services/**", "@/services/**", "@services/**"],
          message: "engine/ importing services/ — flagged for triage (D-6). engine/ should stay pure logic; services/ does transport/sync.",
        }],
      }],
    },
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    ignores: [
      // shared/forms/* compose @/editor/chrome-ui controls with field
      // wiring — the one documented shared/→editor/ edge (root CLAUDE.md
      // Global Invariants; packages/editor/CLAUDE.md folder-structure table).
      "src/shared/forms/**",
    ],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**", "@editor/**"],
          message: "shared/ is leaf — may not import from editor/.",
          allowTypeImports: true,
        }],
      }],
    },
  },
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/editor/**", "@/editor/**", "@editor/**"],
          message: "services/ may not import from editor/ (services consume shared/ only). Type-only imports allowed via `import type`.",
          allowTypeImports: true,
        }],
      }],
    },
  },
  // D-6: services/ ↔ engine/ boundary is new — WARN, not ERROR, until the
  // existing crossings it flags (cmsSync/componentSync/versionSync import
  // engine/cms types, etc.) are triaged. See ledger D-6 decision_free_fix
  // and the engine/ block above for why this uses the core rule key.
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["warn", {
        patterns: [{
          group: ["**/engine/**", "@/engine/**", "@engine/**"],
          message: "services/ importing engine/ — flagged for triage (D-6).",
        }],
      }],
    },
  },
  // Survivor #6 — REMOVED 2026-05-04. src/components/ deleted 2026-05-02;
  // `buildrik/no-legacy-components-import` rule (file + plugin registration
  // + config wiring + tests) drained 2026-05-04 once the actual cleanup
  // confirmed the rule had nothing left to enforce.
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
