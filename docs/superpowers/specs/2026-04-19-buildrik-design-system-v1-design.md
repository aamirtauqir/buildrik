# Buildrik Design System V1 — Spec

**Date:** 2026-04-19
**Status:** DESIGN (pre-implementation)
**Supersedes:** `theme-unification-v3` (shipped ~65%, superseded not deleted — see §2)
**Commits referenced:** HEAD at `ea45ba4` (V3 state at audit time)

---

## 1. Problem Statement

Buildrik's theme system is incoherent after 3 failed unification attempts. Concrete symptoms at HEAD `ea45ba4`:

- **275 duplicate CSS var def lines** in `packages/editor/src/themes/default.css` (555 total defs across 280 unique keys)
- **3-file namespace leak** for `--buildrick-design-*` (should be 0): `themes/default.css:116+`, `components/Canvas/Canvas.css:27+`, `editor/sidebar/tabs/design/styles/design-tokens.css:284+`
- **570 hardcoded hex literals** in `.tsx`/`.ts` inline styles across editor chrome
- **265 editor chrome consumers** of `--buildrick-design-*` tokens (should be 0 under the intended boundary)
- **29 dark-fallback sites** in `components/Layout/LeftRail.css` with banned indigo/teal values (DESIGN.md violations)
- **Bare `--accent: #2D6DFF`** + 27 external + 39 internal alias consumers (unprefixed, orphan naming)
- **9 accidental alias layers:** `--ls-*`, `--rail-*`, `--surface-*`, `--brand-*`, `--bar/--blue/--txt`, `--primary-*`, `--buildrick-control-*`, `--buildrick-build-*`, `--buildrick-ai-*`
- **No token versioning infrastructure:** hardcoded `-v1` localStorage key at `TokenRegistryContext.tsx:61`, no schema version in project JSON, no migration path, no published-CSS compatibility contract

This spec defines a clean design system (DS V1) that replaces the post-V3 state.

---

## 2. Context: What V3 Got Wrong

V1 and V2 spec attempts failed because they started from architecture before inventory. Codex killed both in review. V3 started with inventory and shipped, but shipped ~65% complete because:

1. Spec §2 invariant `--buildrick-design-*` = runtime-mutable was FALSE in practice. 75 editor-chrome files already read `--buildrick-design-*` tokens (LayoutShell.css:34, Button.tsx:41, controlStyles.ts:21, etc.). The invariant didn't match reality.
2. Alias layer cleanup was out of scope. Codemod renamed `--aqb-*` → `--buildrick-*` but preserved `--ls-*`, `--rail-*`, `--surface-*` alias blocks. These caused the 275 duplicate def lines in default.css.
3. No CI gates were wired. Namespace boundary was "grep-able" but not enforced.
4. INSPECTOR_TOKENS constant pattern conflicted with DESIGN.md's stated architecture (Emotion + CSS vars). Spec didn't address the migration.
5. No token versioning story. Project JSON, localStorage, and published user sites had no migration framework.

DS V1 spec addresses all 5 gaps explicitly.

---

## 3. Architecture Overview

### Three-layer separation

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BUILDRIK EDITOR (browser)                        │
│                                                                       │
│  ┌─────────────────────────────────────┐  ┌────────────────────────┐│
│  │  EDITOR SHELL (Buildrik team owns)  │  │  USER CANVAS (user owns)││
│  │                                     │  │                         ││
│  │  Tokens: --buildrick-*              │  │  Tokens:                ││
│  │  Purpose: Editor UI chrome          │  │    --buildrick-design-* ││
│  │  Mutation: Static, source code only │  │  Purpose: User's site   ││
│  │                                     │  │  Mutation: Runtime via  ││
│  │  Published to user's site? NO       │  │    Design tab setProperty││
│  │                                     │  │  Published to user site?│
│  │                                     │  │    YES                  ││
│  └─────────────────────────────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Namespace contract (Decision 1 v2)

| Prefix | Owner | Mutability | Consumers | Example |
|---|---|---|---|---|
| `--buildrick-*` | Buildrik team | Static (source code only) | Editor chrome files only | `--buildrick-bg-panel`, `--buildrick-accent`, `--buildrick-text-primary` |
| `--buildrick-design-*` | User (via Design tab) | Runtime (setProperty) | User's site output only (blocks, templates, published HTML) | `--buildrick-design-color-primary`, `--buildrick-design-font-body` |

### Invariants (enforceable via grep CI)

1. **No `--buildrick-design-*` defs outside DS source-of-truth locations:**
   - Definitions: only in `features/design-system/constants.ts` (JS) and `themes/design-system/design.css` (CSS pre-render baseline)
   - Gate: `grep -rE '^\s*--buildrick-design-' packages/editor/src --exclude-dir=features/design-system --exclude=design.css` → empty

2. **No `--buildrick-design-*` consumers in editor chrome:**
   - Allowed consumer paths: `shared/constants/defaultStyles.ts`, `shared/utils/html/generation.ts`, `features/design-system/utils/exportUtils.ts`, `blocks/*`, `templates/*`
   - Gate: `grep -rE 'var\(--buildrick-design-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui` → empty

3. **No alias-layer prefixes anywhere:**
   - Forbidden: `--accent`, `--ls-*`, `--rail-*`, `--surface-*`, `--brand-*`, `--bar`, `--blue`, `--txt`, `--primary-*`, `--buildrick-control-*`, `--buildrick-build-*`, `--buildrick-ai-*`
   - Gate: `grep -rE 'var\(--(accent|ls-|rail-|surface-|brand-|bar|blue|txt|primary-|buildrick-(control|build|ai)-)' packages/editor/src` → empty (post-migration)

4. **No self-referential defs:**
   - Pattern: `--X: var(--X);` invalidates the whole var chain (V3 burned us here at ea45ba4)
   - Gate: `grep -rE '^\s*(--buildrick-[a-z0-9-]+)\s*:\s*var\(\1' packages/editor/src` → empty

5. **No duplicate keys within a DS file:**
   - Each key appears exactly once per file
   - Exception: `a11y.css` may redefine keys inside `@media` scope (scoped overrides, not duplicates)

---

## 4. The 7 Decisions (final locked form)

### Decision 1 (v2) — Site vs Shell namespace

**Locked:** All 68 `--buildrick-design-*` tokens are SITE tokens (user-facing, consumed in published output). Editor chrome uses `--buildrick-*` exclusively. Zero CORE/shared tokens — clean boundary.

**Persistence boundary clarification:**
- Of 68 tokens, 32 are user-editable via Design tab + saved to project JSON (colors, typography, spacing categories per `DesignSystemTab.tsx:66 SAVEABLE_CATEGORIES`)
- 36 are static DS defaults (layout, buttons, icons, forms, effects categories) — consumed in site output but not user-editable. Documented as "DS defaults" in DEFAULT_TOKENS JSDoc.

**Migration debt:** 265 editor chrome consumer sites currently read `--buildrick-design-*`. All must migrate to `--buildrick-*` chrome equivalents. 18 new chrome tokens must be created (spacing 1-12, radius sm-full, font-family-mono).

### Decision 2 — Kill all alias layers

**Locked:** Delete all 9 alias families in migration:
- `--ls-*` (left sidebar, ~30 defs)
- `--rail-*` (rail, ~15 defs)
- `--surface-*` / `--text-*` / `--brand-*` (V2 semantic, ~30 defs)
- `--bar` / `--blue` / `--txt` (legacy navbar, ~6 defs)
- `--primary-*` (old color variants, ~80 defs)
- `--buildrick-control-*` (11 inspector aliases)
- `--buildrick-build-*` (5 build-tab aliases)
- `--buildrick-ai-*` (4 AI-panel aliases)

Consumers rename to canonical `--buildrick-*` tokens. ~200 duplicate def lines vanish in default.css.

### Decision 3 (revised) — `--accent` alias-then-drain-then-delete

**Locked:** `--accent` stays as temporary alias to `--buildrick-accent` during Phase 3 consumer migration.

```
Migration order (Phase 3.3):
  Step 1: --accent: var(--buildrick-accent);  (alias, no value change)
  Step 2: Rename 27 consumer sites: var(--accent) → var(--buildrick-accent)
  Step 3: Grep check — no consumers of var(--accent) remain
  Step 4: Delete --accent def entirely
```

No big-bang deletion. The 39 internal `--buildrick-X: var(--accent)` alias redefinitions inside default.css vanish naturally with Decision 2's alias-block removal.

### Decision 4 (revised) — `a11y.css` owns WHOLE a11y layer

**Locked:** `themes/design-system/a11y.css` consolidates all media-query accessibility overrides.

**Consolidates (removes from source files):**
- `themes/default.css:4265` — `@media (prefers-contrast: high)` border overrides
- `editor/canvas/Canvas.css:1243` — `@media (prefers-contrast: high)` focus-visible + selection outlines
- `components/Canvas/Canvas.css:1248` — same pattern as editor/canvas

**Ready for future expansion:**
- `@media (prefers-reduced-motion: reduce)` — disable transitions/animations
- `@media (prefers-color-scheme: dark)` — reserved (editor is light-only today; future editor theme support)
- `@media (forced-colors: active)` — Windows High Contrast mode

**Enforcement gate:** `grep -rE '@media\s*\(prefers-' packages/editor/src --exclude=themes/design-system/a11y.css` → empty

### Decision 5 (revised) — Intent+path hex lint with per-file override

**Locked:** ESLint `no-inline-hex` rule with directory-scoped defaults + per-file comment override.

**Directory rules (default):**
- Chrome: `editor/*`, `shared/ui/*`, `shared/forms/*`, `ai/*`, `features/design-system/ui/*` → hex FORBIDDEN
- User content: `blocks/*`, `templates/*` → hex ALLOWED (sample palettes for user's site)
- SVG fills/strokes everywhere → prefer `currentColor`; specific hex for brand multi-color icons with documented comment
- Legacy: `components/*` → grandfather (fix-on-touch)

**Per-file override:**
```ts
/* @lint-hex-policy: site-generator */
// Allows inline hex in this file (e.g., shared/constants/defaultStyles.ts 
// which generates user's site CSS from design tokens)
```

**Example overrides:**
- `shared/constants/defaultStyles.ts` → `site-generator`
- `shared/utils/html/generation.ts` → `site-generator`
- `features/design-system/utils/exportUtils.ts` → `site-generator`

### Decision 6 (revised) — Codemod + lint ban (single-commit convergence)

**Locked:** INSPECTOR_TOKENS migration is one commit, not gradual.

**Codemod scope:**
1. Replace `INSPECTOR_TOKENS.X` references in style objects with `var(--buildrick-*)` strings
2. Replace direct `getComputedStyle(document.documentElement).getPropertyValue('--buildrick-X')` calls with `getToken('X')` helper
3. Delete `controlStyles.ts` INSPECTOR_TOKENS export + fallback constant object

**Affected files:** 32 files importing INSPECTOR_TOKENS + 3+ direct getComputedStyle readers (ColorInput.tsx:46, FontControls.tsx:44, SizeSection.tsx:25)

**Post-codemod lint ban (ESLint rule):**
```js
"no-restricted-imports": ["error", {
  paths: [{
    name: "@editor/inspector/shared/controls/controlStyles",
    importNames: ["INSPECTOR_TOKENS"],
    message: "Use var(--buildrick-*) in styled() or .css files. Use getToken() for JS reads."
  }]
}],
"no-restricted-syntax": ["error", {
  selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
  message: "Use getToken(name) helper instead of direct getPropertyValue."
}]
```

### Decision 7 (NEW) — Token versioning contract (full framework)

**Locked:** Full token versioning framework. Schema version, migration runtime, alias retention, published-CSS compatibility shim.

**Full detail in §9.**

---

## 5. Token Architecture

### File structure of `themes/design-system/`

```
packages/editor/src/themes/design-system/
├── color.css           (~130 chrome color tokens)
├── typography.css      (~35 chrome typography tokens, incl. NEW --buildrick-font-family-mono)
├── spacing.css         (~15 chrome spacing tokens, incl. NEW --buildrick-space-1..12)
├── radius.css          (~8 chrome radius tokens, incl. NEW --buildrick-radius-sm..full)
├── shadow.css          (~12 chrome shadow tokens, incl. glow tokens)
├── motion.css          (~25 chrome motion tokens — easings, durations, transitions)
├── z-index.css         (13 chrome z-index tokens)
├── layout.css          (~40 chrome layout tokens — sidebar width, panel dimensions, header/footer heights)
├── design.css          (68 --buildrick-design-* pre-render baselines, mirrors DEFAULT_TOKENS)
├── a11y.css            (@media prefers-contrast, prefers-reduced-motion, forced-colors)
└── index.css           (public aggregator; @import's above files in dependency order)

packages/editor/src/themes/
├── default.css         (AGGREGATOR — imports design-system/index.css + compat.css)
└── compat.css          (deprecated aliases during Phase 3, deleted in Phase 5)
```

**Total DS token count:** ~329 tokens across 11 files (vs 555 duplicate def lines today in one file).

### Chrome token additions (18 new tokens)

These don't exist in V3 state; must be created in DS V1:

**`spacing.css` — 12 new:**
```css
--buildrick-space-1: 4px;
--buildrick-space-2: 8px;
--buildrick-space-3: 12px;
--buildrick-space-4: 16px;
--buildrick-space-5: 20px;
--buildrick-space-6: 24px;
--buildrick-space-8: 32px;
--buildrick-space-10: 40px;
--buildrick-space-12: 48px;
/* Plus --buildrick-touch-min, --buildrick-touch-gap from existing tokens */
```

**`radius.css` — 5 new:**
```css
--buildrick-radius-sm: 4px;
--buildrick-radius-md: 8px;
--buildrick-radius-lg: 12px;
--buildrick-radius-xl: 16px;
--buildrick-radius-full: 9999px;
```

**`typography.css` — 1 new:**
```css
--buildrick-font-family-mono: "Geist Mono", "JetBrains Mono", monospace;
```

### `index.css` import order

```css
/* themes/design-system/index.css */

/* Foundation — no dependencies */
@import "./color.css";
@import "./typography.css";
@import "./spacing.css";
@import "./radius.css";

/* Depends on color (rgba shadows) */
@import "./shadow.css";

/* Depends on spacing/timing — no color deps */
@import "./motion.css";
@import "./z-index.css";

/* Depends on spacing */
@import "./layout.css";

/* User-editable runtime baselines */
@import "./design.css";

/* Media-query overrides last */
@import "./a11y.css";
```

### `themes/default.css` aggregator (public contract)

```css
/* themes/default.css — public import path (stable during migration) */

@import "./design-system/index.css";

/* Deprecated aliases. Deleted in Phase 5 when zero-consumer check passes. */
@import "./compat.css";
```

---

## 6. Consumer Conventions

### Three patterns, three contexts

#### 1. Static styling → Emotion `styled()` or `.css` files

Default for 95% of components. Per CLAUDE.md: "Component styles: Emotion `styled()` or `css` prop."

```tsx
import styled from "@emotion/styled";

const PanelHeader = styled.div`
  background: var(--buildrick-bg-panel);
  color: var(--buildrick-text-primary);
  padding: var(--buildrick-space-3);
  border-bottom: 1px solid var(--buildrick-border);
`;

// With prop variants
const Button = styled.button<{ variant: "primary" | "ghost" }>`
  background: ${({ variant }) =>
    variant === "primary" ? "var(--buildrick-accent)" : "transparent"};
  padding: 0 var(--buildrick-space-4);
  border-radius: var(--buildrick-radius-md);
`;
```

#### 2. Dynamic inline → ONLY for runtime-computed values

Allowed only when values depend on runtime data (drag positions, computed transforms).

```tsx
// ALLOWED — transform depends on drag state
<div style={{
  transform: `translate(${x}px, ${y}px)`,
  background: "var(--buildrick-bg-panel)",  // color still uses var()
}} />

// FORBIDDEN — static styling in inline object
<div style={{
  background: "var(--buildrick-bg-panel)",  // move to styled()
  padding: 8,                                 // move to styled()
}} />

// FORBIDDEN — hex literal in chrome
<div style={{ background: "#F8FAFC" }} />   // ESLint blocks
```

#### 3. JS-read values → `getToken(name)` helper

For canvas drawing, color interpolation, data-driven logic.

```tsx
// src/shared/utils/tokens.ts
import type { TokenName } from "./token-names";

export function getToken(name: TokenName): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--buildrick-${name}`)
    .trim();
  if (!value) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[tokens] --buildrick-${name} is not defined`);
    }
  }
  return value;
}

// Usage
const accent = getToken("accent");           // "#2D6DFF"
const bgPanel = getToken("bg-panel");        // "#F8FAFC"
ctx.fillStyle = accent;
```

**Type-safe:** `TokenName` is a string union derived from DS files. Updated manually per-PR (~329 tokens, small enough to maintain without codegen).

### Decision matrix

| Situation | Convention |
|---|---|
| Component with static styling | Emotion `styled()` or `.css` file, use `var(--buildrick-*)` |
| Component with variants (props) | Emotion `styled()` with prop interpolation |
| Drag position / animated transform | Inline `style={{}}` for computed value, `var(--buildrick-*)` for colors |
| Canvas drawing / color math | `getToken(name)` helper |
| Block or template preview (user content) | Hex allowed (per Decision 5) |
| SVG icon (single-color) | `currentColor` |
| SVG icon (brand multi-color) | Hex with `/* intentional: brand color */` comment |
| Reading a token for export | `getToken(name)` |

---

## 7. Migration Strategy — Aggregator Pattern

### Why aggregator, not big-switch

**Rejected alternative (Path 2, original):** One commit replaces `default.css` (5152 lines) with 11 new DS files by swapping imports. Runtime behavior (setProperty, rehydration) risks missed by visual regression.

**Adopted (Path 3, aggregator):** `default.css` stays as the public import path. Becomes a thin aggregator file. DS files grow incrementally. `compat.css` holds deprecated aliases during migration. Delete `compat.css` last.

### Phase breakdown

```
Phase 0 — Setup                                   ~1 day
  - Create themes/design-system/ directory (empty)
  - Create shared/utils/tokens.ts with getToken() helper
  - Create shared/utils/token-names.ts with TokenName type
  - Scaffold ESLint rules (no-inline-hex, no-restricted-imports) DISABLED
  - Add designTokensSchemaVersion field to types/project.ts (Decision 7 scaffolding)

Phase 1 — Write DS files                          ~3-4 days
  - Write color.css, typography.css, spacing.css, radius.css, shadow.css,
    motion.css, z-index.css, layout.css, design.css, a11y.css, index.css
  - Create 18 new chrome tokens (spacing-1..12, radius-sm..full, font-family-mono)
  - Consolidate 3 @media (prefers-contrast) blocks into a11y.css (source files still have theirs)

Phase 2 — Wire aggregator                         ~1 day
  - Edit default.css to be: @import "./design-system/index.css"; @import "./compat.css";
  - compat.css contains ALL current alias layers (--ls-*, --rail-*, --surface-*, --brand-*,
    --bar/--blue/--txt, --primary-*, --accent, --buildrick-control-*, --buildrick-build-*,
    --buildrick-ai-*) extracted from default.css
  - Verify editor still works (all tokens resolve as before)
  - Run Playwright baseline screenshots

Phase 3 — Family-by-family consumer migration     ~2-3 weeks
  Each sub-phase is a separate PR. Within each PR:
    a. Rename consumers
    b. Grep check: zero consumers of the alias/leak remain in codebase
    c. Delete the relevant lines from compat.css OR migrate leak
    d. Playwright diff vs baseline
    e. Merge

  3.1  --ls-* consumer migration (LeftSidebar.css, PagesTab.css, TemplatesTab.css, etc.)
  3.2  --rail-* consumer migration + LeftRail.css dark fallback removal (29 sites)
  3.3  --accent consumer migration (27 sites) → delete --accent def
  3.4  --surface-*/--text-*/--brand-* consumer migration
  3.5  --bar/--blue/--txt consumer migration
  3.6  --primary-* consumer migration
  3.7  --buildrick-control-* consumer migration (inspector INSPECTOR_TOKENS codemod lives here)
  3.8  --buildrick-build-* consumer migration
  3.9  --buildrick-ai-* consumer migration
  3.10 --buildrick-design-* chrome consumer migration (265 sites → --buildrick-* equivalents)
       This is the BIGGEST sub-phase. Split further if needed:
         3.10a radius-* chrome migration (149 sites)
         3.10b space-* chrome migration (47 sites)
         3.10c font-size-* chrome migration (32 sites)
         3.10d color-* chrome migration (17 sites — CMSCollectionSetupModal, BindingPopover, PagesTab)
         3.10e font-mono chrome migration (10 sites — history, build, pages tabs)
         3.10f shadow-* chrome migration (8 sites)
         3.10g input-border chrome migration (2 sites — controlStyles.ts)
  3.11 Inline hex migration in chrome dirs (~228 lines estimated from strict scoped measurement)

Phase 4 — Delete compat.css                       ~0.5 day
  - Grep verification: zero consumers of any deprecated prefix remain
  - Delete compat.css
  - Remove @import from default.css
  - default.css is now just: @import "./design-system/index.css";

Phase 5 — Decision 7 runtime implementation       ~1 week
  - Implement migrateDesignTokens(projectJson, fromVersion, toVersion)
  - Wire into TokenRegistryContext.tsx to apply migrations on load
  - Document alias retention policy (how long a deprecated name works)
  - Implement published-CSS compatibility shim generator in exportUtils.ts
  - Add V1→V1 no-op migration (baseline — nothing to migrate since V4 keeps names)

Phase 6 — Enable CI gates                         ~0.5 day
  - Flip ESLint no-inline-hex rule to "error"
  - Flip no-restricted-imports rule for INSPECTOR_TOKENS
  - Add grep gates to CI: namespace boundary, alias-free, self-ref-free, duplicate-free
  - Verify: a violating PR fails, a clean PR passes
```

### Phase dependencies

```
Phase 0 (setup) ─┬─▶ Phase 1 (write DS) ─┬─▶ Phase 2 (wire aggregator) ─┬─▶ Phase 3.1 ...
                │                        │                              │
                │                        │                              ├─▶ Phase 3.10
                │                        │                              │     (can run parallel after 3.1-3.9)
                │                        │                              │
                │                        │                              └─▶ Phase 3.11
                │                        │                                    (inline hex)
                │                        │
                │                        └─▶ Phase 5 (Decision 7 runtime) ──────▶ can start in parallel
                │                                                                  with late Phase 3
                │
                └─▶ Phase 6 (CI gates) can scaffold early, enable only after Phase 4
```

**Parallelism:** Phases 3.1-3.9 are serialized (each depends on a stable compat.css). Phase 3.10 and 3.11 can run in parallel with late 3.x. Phase 5 can start in parallel with late Phase 3.

### Calendar estimate

- Minimum: 3 weeks (if nothing slips, fast consumer migration)
- Realistic: 5-6 weeks (accounting for testing, bug fixes, unknowns)
- Pessimistic: 8 weeks (major canvas rendering issue during 3.10a, requires architecture rethink)

**Budget: 5-7 weeks solo.** Announce no ship date externally.

---

## 8. Token Saveable Categories (Decision 1 persistence clarification)

Of 68 `--buildrick-design-*` tokens defined in `features/design-system/constants.ts`:

### Saveable (32 tokens — user-editable via Design tab)

| Category | Count | Tokens |
|---|---|---|
| Colors | 9 | primary, secondary, accent, background, text, muted, border, success, error |
| Typography | 11 | font-heading, font-body, font-mono, font-size-xs/sm/base/lg/xl/2xl/3xl/4xl |
| Spacing | 9 | space-1, 2, 3, 4, 5, 6, 8, 10, 12 |

These are listed in `DesignSystemTab.tsx:66 SAVEABLE_CATEGORIES = ["colors", "typography", "spacing"]`. They appear in `projectData.settings.designTokens` array and are round-tripped through localStorage `-v1` key.

### Static DS defaults (36 tokens — NOT user-editable)

| Category | Count | Purpose |
|---|---|---|
| Layout | 8 | Grid/section dimensions consumed in user's site output |
| Buttons | 8 | Button sizing/typography consumed by default button styles |
| Icons | 5 | Icon rendering style consumed by user's site icons |
| Forms | 8 | Input/label styling consumed by user's site forms |
| Effects | 10 | Radius + shadow values consumed by user's site cards/surfaces |

These are defined in DEFAULT_TOKENS but have no UI in DesignSystemTab. They're consumed in `shared/constants/defaultStyles.ts` (site-output generator), `blocks/*`, `templates/*`.

**Documented as:** "DS defaults — ship as part of Buildrik's design system baseline. Not user-editable in V1. Future releases may expose specific tokens via Design tab UI if demand warrants."

**JSDoc comment on each static token:**
```ts
{
  id: "btn-height-md",
  name: "Button MD Height",
  value: "40px",
  category: "buttons",
  cssVar: "--buildrick-design-btn-height-md",
  type: "length",
  group: "size",
  // V1: static DS default, not user-editable. See spec §8.
}
```

---

## 9. Token Versioning Contract (Decision 7 — full framework)

### Schema version field

**Location:** `types/project.ts`
```ts
export interface Project {
  // ... existing fields ...
  designTokensSchemaVersion?: number;  // V1 = 1. Nullable for backward compat with pre-DS-V1 projects.
  designTokens?: DesignTokenRecord[];
}
```

**Current value:** `1` (DS V1 release).

**Loading logic:**
```ts
// features/design-system/state/TokenRegistryContext.tsx
const CURRENT_SCHEMA_VERSION = 1;

function loadProjectTokens(project: Project): DesignToken[] {
  const version = project.designTokensSchemaVersion ?? 1;
  let tokens = project.designTokens ?? [];
  
  if (version < CURRENT_SCHEMA_VERSION) {
    tokens = migrateDesignTokens(tokens, version, CURRENT_SCHEMA_VERSION);
  }
  
  return mergeWithDefaults(tokens, DEFAULT_TOKENS);
}
```

### Migration function runtime

**Location:** `features/design-system/migrations/index.ts` (new directory)

```ts
// Per-version migration functions
const MIGRATIONS: Record<number, (tokens: DesignToken[]) => DesignToken[]> = {
  // V1 is baseline. No migrations yet.
  // Future: 2: migrateV1ToV2, 3: migrateV2ToV3, etc.
};

export function migrateDesignTokens(
  tokens: DesignToken[],
  fromVersion: number,
  toVersion: number,
): DesignToken[] {
  let result = tokens;
  for (let v = fromVersion; v < toVersion; v++) {
    const migration = MIGRATIONS[v + 1];
    if (!migration) {
      console.warn(`[tokens] No migration from v${v} to v${v + 1}; keeping as-is`);
      continue;
    }
    result = migration(result);
  }
  return result;
}
```

**Each migration function:**
- Takes old-schema tokens array, returns new-schema tokens array
- Handles renames (cssVar field updated)
- Handles splits (e.g., `color-primary` → `color-primary` + `color-primary-hover` + `color-primary-pressed`)
- Handles deletions (old token dropped, warning logged)

### Alias retention policy

**Rule:** Deprecated token names work as aliases for **2 major DS versions** after deprecation.

Example timeline:
```
DS V1 (current):  --buildrick-design-color-primary
DS V2:            Rename to --buildrick-design-color-brand-primary
                  compat.css adds: --buildrick-design-color-primary: var(--buildrick-design-color-brand-primary);
                  Migration function: rename cssVar in user's saved tokens
DS V3:            Alias still present for backward compat
DS V4:            Alias REMOVED. Old projects auto-migrated via migration function.
                  Published sites with hardcoded old name break if not republished.
```

**Why 2 versions:**
- User deploys site on V1. Deployed CSS has `var(--buildrick-design-color-primary)`.
- User upgrades editor to V2. Projects migrate automatically. Alias in `compat.css` keeps deployed sites working.
- If user republishes during V2 or V3, new CSS uses new name.
- Alias removed in V4. Any site still deployed with V1 CSS breaks (color falls back to initial value).

### Published-CSS compatibility shim generator

**Location:** `features/design-system/utils/exportUtils.ts`

When user publishes a site (export), the generator produces:

```css
/* user-site.css — exported from Buildrik DS V2 */

:root {
  /* Current token names */
  --buildrick-design-color-brand-primary: #3B82F6;
  
  /* Legacy aliases for 2-version backward compat */
  --buildrick-design-color-primary: var(--buildrick-design-color-brand-primary);
}

/* ... rest of user's site CSS ... */
```

**Shim generation rules:**
- For each deprecated alias still in retention window: include alias in exported CSS
- For each removed alias (past retention): omit
- Generator reads from `MIGRATIONS` table to know which names were deprecated when

### Public contract declaration

**In DESIGN.md:**
```markdown
## Token Public Contract

All `--buildrick-design-*` token names are part of Buildrik's public contract. They appear in:
- User project JSON (`settings.designTokens[].cssVar`)
- User's published site CSS output
- localStorage key `buildrick-design-tokens-${projectId}-v1`
- Exported `design-tokens.css` / `design-tokens.json` / `design-tokens.tailwind.js` files

**Changing these names is a BREAKING change.** Requires:
1. Schema version bump
2. Migration function implementation
3. Alias retention for 2 major DS versions
4. Published-CSS compatibility shim
```

### Enforcement

**CI gate — alias retention:**
```bash
# Parse MIGRATIONS table, verify each deprecated name still has an alias in compat.css
# OR has been past retention period (2 versions)
node scripts/verify-token-retention.mjs
# Exits non-zero if a token was removed before its retention window ended
```

**PR template checkbox:**
```markdown
- [ ] Does this PR rename/remove any `--buildrick-design-*` token?
  - [ ] If yes, I bumped `CURRENT_SCHEMA_VERSION`
  - [ ] If yes, I added a migration function in `features/design-system/migrations/`
  - [ ] If yes, I added the alias to `compat.css`
  - [ ] If yes, I updated `exportUtils.ts` shim generation
  - [ ] If yes, I set an expiry plan (which future version deletes the alias)
```

---

## 10. CI Gates & Enforcement

### Grep gates (all must exit 0)

```bash
# Gate 1: No self-referential defs
grep -rE '^\s*(--buildrick-[a-z0-9-]+)\s*:\s*var\(\1' \
  packages/editor/src/themes/design-system

# Gate 2: --buildrick-design-* defs only in approved locations
grep -rE '^\s*--buildrick-design-' packages/editor/src \
  --include='*.css' \
  --exclude-dir=features/design-system \
  --exclude=design.css

# Gate 3: --buildrick-design-* consumers only in approved locations
grep -rE 'var\(--buildrick-design-' \
  packages/editor/src/editor \
  packages/editor/src/shared/ui \
  packages/editor/src/shared/forms \
  packages/editor/src/ai \
  packages/editor/src/features/design-system/ui
# Allowed elsewhere: shared/constants/defaultStyles.ts, shared/utils/html/generation.ts,
# features/design-system/utils/exportUtils.ts, blocks/*, templates/*

# Gate 4: No alias-layer consumers
grep -rE 'var\(--(accent|ls-|rail-|surface-|brand-|bar|blue|txt|primary-|buildrick-(control|build|ai)-)' \
  packages/editor/src

# Gate 5: No old --aqb-* or --ls-* anywhere (leftover from V3)
grep -rE '(--aqb-|data-aqb-)' packages/editor/src \
  --include='*.ts' --include='*.tsx' --include='*.css'

# Gate 6: No duplicate keys within any DS file
for f in packages/editor/src/themes/design-system/*.css; do
  DUPS=$(awk '/^\s*--buildrick-/ {match($0,/--buildrick-[a-z0-9-]+/); print substr($0,RSTART,RLENGTH)}' "$f" \
    | sort | uniq -d)
  [ -z "$DUPS" ] || { echo "Duplicate in $f: $DUPS"; exit 1; }
done

# Gate 7: No @media (prefers-*) blocks outside a11y.css
grep -rE '@media\s*\(prefers-' packages/editor/src \
  --exclude=themes/design-system/a11y.css

# Gate 8: No bare --accent / --buildrick-text / --buildrick-surface defs
grep -rE '^\s*(--accent|--buildrick-text|--buildrick-surface)\s*:' \
  packages/editor/src --include='*.css'
```

### ESLint rules

```js
// .eslintrc.buildrik-ds.js

module.exports = {
  rules: {
    // Decision 5: Intent+path hex policy
    "buildrick/no-inline-hex": ["error", {
      chromeDirs: [
        "packages/editor/src/editor/**",
        "packages/editor/src/shared/ui/**",
        "packages/editor/src/shared/forms/**",
        "packages/editor/src/ai/**",
        "packages/editor/src/features/design-system/ui/**",
      ],
      contentDirs: [
        "packages/editor/src/blocks/**",
        "packages/editor/src/templates/**",
      ],
      legacyDirs: [
        "packages/editor/src/components/**",  // grandfather: warn only
      ],
      perFileOverride: "@lint-hex-policy:",
    }],
    
    // Decision 6: Ban INSPECTOR_TOKENS imports
    "no-restricted-imports": ["error", {
      paths: [{
        name: "@editor/inspector/shared/controls/controlStyles",
        importNames: ["INSPECTOR_TOKENS"],
        message: "INSPECTOR_TOKENS is deprecated. Use var(--buildrick-*) in styled() or getToken() for JS reads.",
      }],
    }],
    
    // Decision 6: Ban direct getComputedStyle on buildrick tokens
    "no-restricted-syntax": ["error", {
      selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
      message: "Use getToken(name) helper instead of getComputedStyle().getPropertyValue().",
    }],
  },
};
```

---

## 11. Testing Strategy

### Unit tests (Vitest — already in project)

```ts
// src/shared/utils/__tests__/tokens.test.ts
describe("getToken", () => {
  it("returns trimmed value for defined token", () => {
    document.documentElement.style.setProperty("--buildrick-accent", "#2D6DFF");
    expect(getToken("accent")).toBe("#2D6DFF");
  });
  
  it("returns empty string and warns for missing token in dev", () => {
    process.env.NODE_ENV = "development";
    const warn = vi.spyOn(console, "warn");
    expect(getToken("nonexistent" as TokenName)).toBe("");
    expect(warn).toHaveBeenCalled();
  });
});

// features/design-system/migrations/__tests__/migrate.test.ts
describe("migrateDesignTokens", () => {
  it("is no-op for same-version", () => {
    const tokens = [{id: "a", value: "x"}];
    expect(migrateDesignTokens(tokens, 1, 1)).toEqual(tokens);
  });
  
  it("logs warning and keeps tokens when no migration defined", () => {
    const warn = vi.spyOn(console, "warn");
    const tokens = [{id: "a", value: "x"}];
    migrateDesignTokens(tokens, 1, 99);  // no migration for 1→99
    expect(warn).toHaveBeenCalled();
  });
});
```

### Playwright visual regression

Baseline captured at Phase 2 (aggregator wired, no consumer migration yet). Each Phase 3 PR runs diff vs baseline. Threshold: `maxDiffPixelRatio: 0.02`.

Tests (~12 screenshots):
- Editor shell (topbar + layout)
- Rail (all icons + tooltips)
- Each of 6 sidebar tabs: templates, pages, build, media, design, settings, history
- Inspector with element selected
- Canvas with sample project
- Design tab runtime mutation (change primary color, verify canvas updates)
- High-contrast mode (`prefers-contrast: high` simulation)

### Computed-style diff script

```bash
# scripts/ds-migration-diff.mjs
# Captures getComputedStyle for ~20 key DOM nodes BEFORE migration.
# Re-captures AFTER. Diffs. Non-zero diffs surface migration gaps.
```

Run before each Phase 3 PR merge. Intentional changes (indigo → cobalt in rail) reviewed and accepted; unintentional changes block merge.

### Manual spot-check (before Phase 4)

- [ ] Editor loads, no console errors
- [ ] Topbar renders correctly
- [ ] Left rail icons render cobalt (not indigo, not teal)
- [ ] All 6 sidebar tabs open and render
- [ ] Click block → selection ring is cobalt
- [ ] Inspector opens, controls visible, hover states work
- [ ] Design tab: change primary color → canvas updates
- [ ] Design tab: change spacing → canvas updates
- [ ] Create page, add element, verify render
- [ ] Undo/redo works
- [ ] Save project, reload, values restored
- [ ] Publish project, view published HTML, tokens present

---

## 12. Acceptance Criteria

### Token count targets

| Metric | V3 (current) | DS V1 target |
|---|---|---|
| Total chrome def lines | 555 (default.css) + 40 (-design- leaks in 3 files) = 595 | ~329 |
| Unique chrome keys | 280 | ~280 + 18 new = ~298 |
| Duplicate def lines | 275 | 0 |
| Files with `-design-*` defs outside features/ | 3 | 0 |
| Alias layers | 9 | 0 (post Phase 4) |
| `-design-*` consumers in editor chrome | 265 | 0 |
| Hardcoded hex in chrome `.tsx` | ~228 (strict scoped) | 0 + documented exceptions |
| Banned-value fallbacks (indigo/teal) in chrome | 29 | 0 |
| Files in `themes/` | 1 (5152 lines) | 12 (11 DS files + default.css aggregator) |
| INSPECTOR_TOKENS imports | 32 files | 0 |
| Direct `getComputedStyle` on buildrick tokens | 3+ | 0 |

### Gate-pass requirement at each phase

| Phase | Gates that must pass |
|---|---|
| Phase 0 | TS compiles, build succeeds |
| Phase 1 | Gates 1, 6 (DS files self-consistent) |
| Phase 2 | All tokens resolve (no missing var warnings in DevTools cascade) |
| Phase 3.x | Gate 3/4/7 local to that family; visual regression within threshold |
| Phase 4 | All 8 gates pass after compat.css deletion |
| Phase 5 | Gate 6 on migration test; migration round-trip test |
| Phase 6 | CI config verified: violating PR blocked, clean PR passes |

### Published-site compatibility

User's sites deployed on V3 continue to work when editor upgrades to DS V1:
- `--buildrick-design-*` names preserved (Option A — no renames)
- localStorage `-v1` key remains valid
- Migration on load is no-op (V1 → V1)

---

## 13. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 3 consumer miss, alias leaked | MEDIUM | Visual regression in prod | Grep gate per-PR; Playwright diff; spot-check before merge |
| Aggregator cascade order wrong, tokens unresolved | LOW | Editor broken | Phase 2 verification; explicit import order in index.css |
| Decision 1 chrome migration breaks existing rendering | MEDIUM | Visual inconsistency | 18 new chrome tokens match values 1:1; computed-style diff catches drift |
| Codemod for INSPECTOR_TOKENS has edge cases | MEDIUM | Inspector partially broken post-3.7 | Manual review of codemod output; per-file diff; run editor post-migration |
| Playwright visual regression false positives | HIGH | Slowed iteration | Calibrate `maxDiffPixelRatio`; accept intentional-change baselines |
| Design tab runtime mutation regresses | MEDIUM | User's custom values stop applying | E2E test exercises setProperty flow; computed-style diff catches |
| Token versioning V1→V2 migration bug (future) | LOW today | User projects corrupted | Migration function unit tests; schema validation on load; rollback on error |
| Published-site `--buildrick-design-*` name change | LOW (Option A chosen) | User sites break on DS upgrade | Alias retention 2 versions; shim generator in exportUtils |
| New chrome token values drift from old design token values | MEDIUM | Subtle visual shift | Phase 1 task: copy values exactly; computed-style diff verifies |
| Large diff in Phase 3.10 (265 consumers) | HIGH | Hard to review | Split into 3.10a-g by token category; each a separate PR |

---

## 14. Out of Scope (explicit deferrals)

Captured here to prevent scope creep during implementation:

- **Editor themes (dark mode for chrome)** — editor is light-only per DESIGN.md 2026-04-18. Future feature if desired, separate namespace.
- **Design tab UI for non-saveable categories (layout, buttons, icons, forms, effects)** — 36 tokens remain static DS defaults in V1. Future release may expose.
- **Token auto-generation from design source (Figma Tokens, Style Dictionary)** — V1 keeps manual DEFAULT_TOKENS array. Future work.
- **Storybook / token documentation site** — useful but not blocking.
- **prefers-reduced-motion implementation** — `a11y.css` is ready for it; actual motion-disable logic is future work.
- **prefers-color-scheme: dark** — editor is light-only; user sites may implement per-project.
- **forced-colors: active (Windows High Contrast)** — same as above.
- **Performance benchmarking of setProperty burst (Design tab slider drag)** — assume acceptable, measure if complaints surface.
- **Token preset libraries (brand kits, industry templates)** — future feature, orthogonal to DS architecture.

---

## 15. Decision Summary Table

| # | Decision | Scope |
|---|---|---|
| 1 v2 | Site/Shell namespace; 68 site + ~298 shell | Migration: 265 chrome consumers + 18 new chrome tokens |
| 2 | Kill 9 alias layers | ~200 duplicate def lines removed |
| 3 | `--accent` alias-then-delete | 27 consumers renamed, then def deleted |
| 4 | a11y.css owns WHOLE a11y layer | 3 @media blocks consolidated |
| 5 | Intent+path hex lint with per-file override | ESLint rule + `@lint-hex-policy` comments |
| 6 | Codemod + lint ban for INSPECTOR_TOKENS | 32 files + 3 direct readers migrated in one commit |
| 7 | Full token versioning framework | Schema version, migration runtime, 2-version alias retention, published-CSS shim |

Execution path: aggregator pattern (no big switch). `default.css` stable import contract, compat.css holds deprecated aliases during Phase 3, deleted in Phase 4.

---

## Appendix A — 18 new chrome tokens (values to copy from existing DS)

```css
/* spacing.css — NEW */
:root {
  --buildrick-space-1:  4px;
  --buildrick-space-2:  8px;
  --buildrick-space-3:  12px;
  --buildrick-space-4:  16px;
  --buildrick-space-5:  20px;
  --buildrick-space-6:  24px;
  --buildrick-space-8:  32px;
  --buildrick-space-10: 40px;
  --buildrick-space-12: 48px;
}

/* radius.css — NEW */
:root {
  --buildrick-radius-sm:   4px;
  --buildrick-radius-md:   8px;
  --buildrick-radius-lg:   12px;
  --buildrick-radius-xl:   16px;
  --buildrick-radius-full: 9999px;
}

/* typography.css — NEW addition */
:root {
  --buildrick-font-family-mono: "Geist Mono", "JetBrains Mono", monospace;
  /* Font sizes already exist: --buildrick-text-xs..4xl */
}
```

Values copied 1:1 from DEFAULT_TOKENS (same values, different prefix). Ensures chrome migration is value-preserving.

---

## Appendix B — Chrome consumer migration map (265 sites)

| From → To | Site count | Top files |
|---|---|---|
| `--buildrick-design-radius-*` → `--buildrick-radius-*` | 149 | Button.tsx, Modal, Popover, Tooltip, LayoutShell.css, CanvasFooterToolbar.tsx |
| `--buildrick-design-space-*` → `--buildrick-space-*` | 47 | LayoutShell.css, PagesTab.css, layers.css, inspector sections |
| `--buildrick-design-font-size-*` → `--buildrick-text-*` | 32 | PagesTab.css, history.css, inspector |
| `--buildrick-design-color-error` → `--buildrick-error` | 17 | CMSCollectionSetupModal, BindingPopover, PagesTab |
| `--buildrick-design-font-mono` → `--buildrick-font-family-mono` | 10 | history.css, BuildTab.css, PagesTab.css |
| `--buildrick-design-shadow-*` → `--buildrick-shadow-*` | 8 | Modal, Popover |
| `--buildrick-design-input-border` → `--buildrick-border-medium` | 2 | controlStyles.ts |

Each row is a Phase 3.10 sub-PR.

---

## Appendix C — Files retained from V3

These V3 artifacts remain useful post-DS-V1 ship:

- `scripts/theme-v3-mapping.json` — historical rename table for V3→DS-V1 reference
- `scripts/theme-v3-audit.json` — inventory snapshot at V3 ship time
- `docs/superpowers/audits/2026-04-19-theme-unification-v3-audit.md` — V3 audit (declared ~65% complete), superseded by this spec

These can be deleted once DS V1 fully ships (end of Phase 6).

---

## Reviewer Concerns

None tracked yet — spec self-review and Codex cross-review pending before implementation.
