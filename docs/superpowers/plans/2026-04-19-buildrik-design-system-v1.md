# Buildrik Design System V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement DS V1 per spec `docs/superpowers/specs/2026-04-19-buildrik-design-system-v1-design.md` — clean namespace (site vs shell), kill alias layers, migrate 265 chrome consumers, wire token versioning framework, enable CI gates.

**Architecture:** Parallel new DS in `src/themes/design-system/` behind stable `default.css` aggregator. Family-by-family consumer migration via `compat.css` layer. Token versioning with schema version + migration runtime + alias retention + published-CSS shim.

**Tech Stack:** React 18 + TypeScript 5.3 + Emotion + Vite + Vitest + Playwright + Codex CLI v0.121.0 (for phase-boundary reviews).

**Estimate:** 5-7 weeks solo (3 weeks minimum, 8 weeks pessimistic).

**Codex review after EACH phase** per user request.

---

## Phase 0 — Setup (zero user impact)

**Goal:** Scaffold new directory structure + helpers + schema field.

**Duration:** ~1 day

### Task 0.1: Create DS directory with placeholder files

**Files:**
- Create: `packages/editor/src/themes/design-system/color.css`
- Create: `packages/editor/src/themes/design-system/typography.css`
- Create: `packages/editor/src/themes/design-system/spacing.css`
- Create: `packages/editor/src/themes/design-system/radius.css`
- Create: `packages/editor/src/themes/design-system/shadow.css`
- Create: `packages/editor/src/themes/design-system/motion.css`
- Create: `packages/editor/src/themes/design-system/z-index.css`
- Create: `packages/editor/src/themes/design-system/layout.css`
- Create: `packages/editor/src/themes/design-system/design.css`
- Create: `packages/editor/src/themes/design-system/a11y.css`
- Create: `packages/editor/src/themes/design-system/index.css`

- [ ] **Step 1: Create directory**

```bash
mkdir -p packages/editor/src/themes/design-system
```

- [ ] **Step 2: Create 11 placeholder files**

Each file gets this content (adjust filename in comment header):

```css
/**
 * themes/design-system/<filename>.css
 * Buildrik DS V1 — see spec §5
 * @license BSD-3-Clause
 */
```

- [ ] **Step 3: Verify**

```bash
ls packages/editor/src/themes/design-system/ | wc -l
# Expected: 11
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/themes/design-system/
git commit -m "feat(ds-v1): scaffold themes/design-system/ directory with 11 placeholder files"
```

### Task 0.2: Create `getToken` helper

**Files:**
- Create: `packages/editor/src/shared/utils/tokens.ts`
- Create: `packages/editor/src/shared/utils/__tests__/tokens.test.ts`
- Create: `packages/editor/src/shared/utils/token-names.ts`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/shared/utils/__tests__/tokens.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getToken } from "../tokens";
import type { TokenName } from "../token-names";

describe("getToken", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty("--buildrick-accent", "#2D6DFF");
    document.documentElement.style.setProperty("--buildrick-bg-panel", "#F8FAFC");
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--buildrick-accent");
    document.documentElement.style.removeProperty("--buildrick-bg-panel");
  });

  it("returns trimmed value for defined token", () => {
    expect(getToken("accent")).toBe("#2D6DFF");
    expect(getToken("bg-panel")).toBe("#F8FAFC");
  });

  it("returns empty string for missing token", () => {
    expect(getToken("nonexistent" as TokenName)).toBe("");
  });

  it("warns in development when token is missing", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getToken("nonexistent" as TokenName);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not defined"));
    warn.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/editor && npx vitest run src/shared/utils/__tests__/tokens.test.ts
# Expected: FAIL — "Cannot find module '../tokens'"
```

- [ ] **Step 3: Create token-names.ts**

Create `packages/editor/src/shared/utils/token-names.ts`:

```ts
/**
 * Buildrik DS V1 — TokenName union type
 * Manually maintained. See themes/design-system/*.css for canonical set.
 * @license BSD-3-Clause
 */

export type TokenName =
  | "accent" | "accent-hover" | "accent-pressed" | "accent-subtle" | "accent-tint"
  | "bg-panel" | "bg-card" | "bg-input" | "bg-hover" | "bg-subtle" | "bg-elevated"
  | "text-primary" | "text-secondary" | "text-muted" | "text-tertiary" | "text-on-accent"
  | "border" | "border-light" | "border-medium" | "border-strong" | "border-hover" | "border-focus"
  | "error" | "error-light" | "success" | "success-light" | "warning" | "warning-light" | "info"
  | "text-xs" | "text-sm" | "text-md" | "text-lg" | "text-xl" | "text-2xl" | "text-3xl" | "text-4xl"
  | "font-family" | "font-family-display" | "font-family-mono"
  | "space-1" | "space-2" | "space-3" | "space-4" | "space-5" | "space-6" | "space-8" | "space-10" | "space-12"
  | "radius-sm" | "radius-md" | "radius-lg" | "radius-xl" | "radius-full"
  | "shadow-sm" | "shadow-md" | "shadow-lg" | "shadow-xl";
```

- [ ] **Step 4: Implement getToken**

Create `packages/editor/src/shared/utils/tokens.ts`:

```ts
/**
 * getToken — read a Buildrik chrome CSS variable at runtime.
 * @license BSD-3-Clause
 */

import type { TokenName } from "./token-names";

export function getToken(name: TokenName): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--buildrick-${name}`)
    .trim();
  if (!value && process.env.NODE_ENV === "development") {
    console.warn(`[tokens] --buildrick-${name} is not defined`);
  }
  return value;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
cd packages/editor && npx vitest run src/shared/utils/__tests__/tokens.test.ts
# Expected: PASS (3 tests)
```

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/shared/utils/tokens.ts \
       packages/editor/src/shared/utils/__tests__/tokens.test.ts \
       packages/editor/src/shared/utils/token-names.ts
git commit -m "feat(ds-v1): add getToken helper with TokenName type union"
```

### Task 0.3: Add schema version field to project types

**Files:**
- Modify: `packages/editor/src/shared/types/project.ts`

- [ ] **Step 1: Read ProjectSettings interface**

```bash
grep -n "ProjectSettings\|designTokens" packages/editor/src/shared/types/project.ts
```

- [ ] **Step 2: Add field before `designTokens`**

Edit `packages/editor/src/shared/types/project.ts`. In the `ProjectSettings` interface, add:

```ts
  /**
   * Schema version for designTokens array. See DS V1 spec §9.
   * Absent = treated as 1 (pre-DS-V1 projects).
   * Bumped when token names rename/split/remove.
   */
  designTokensSchemaVersion?: number;
```

Place directly above `designTokens?: DesignTokenRecord[];`.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd packages/editor && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/shared/types/project.ts
git commit -m "feat(ds-v1): add designTokensSchemaVersion field to ProjectSettings"
```

### Task 0.4: Scaffold ESLint config (disabled)

**Files:**
- Create: `packages/editor/.eslintrc.buildrik-ds.js`

- [ ] **Step 1: Create overlay**

Create `packages/editor/.eslintrc.buildrik-ds.js`:

```js
/**
 * Buildrik DS V1 — ESLint overlay (disabled until Phase 6).
 * @license BSD-3-Clause
 */

module.exports = {
  rules: {
    "no-restricted-imports": ["off", {
      paths: [{
        name: "../inspector/shared/controls/controlStyles",
        importNames: ["INSPECTOR_TOKENS"],
        message: "INSPECTOR_TOKENS deprecated. Use var(--buildrick-*) or getToken().",
      }],
    }],
    "no-restricted-syntax": ["off", {
      selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
      message: "Use getToken(name) instead of getPropertyValue. See DS V1 spec §6.",
    }],
  },
};
```

- [ ] **Step 2: Verify JS is valid**

```bash
cd packages/editor && node -e "require('./.eslintrc.buildrik-ds.js')"
```

- [ ] **Step 3: Commit**

```bash
git add packages/editor/.eslintrc.buildrik-ds.js
git commit -m "chore(ds-v1): scaffold ESLint DS rules (disabled; enabled in Phase 6)"
```

### Task 0.5: Codex review — Phase 0

**Files:** None

- [ ] **Step 1: Create review prompt**

Create `/tmp/codex-ds-phase0-review.md`:

```markdown
IMPORTANT: Do NOT read files under ~/.claude/, .claude/skills/, agents/. Skip them.

Review Phase 0 of Buildrik DS V1 — scaffolding only.

Verify:
1. `packages/editor/src/themes/design-system/` has 11 placeholder files
2. `packages/editor/src/shared/utils/tokens.ts` has getToken()
3. `packages/editor/src/shared/utils/token-names.ts` has TokenName type union
4. `packages/editor/src/shared/types/project.ts` has `designTokensSchemaVersion?: number`
5. `packages/editor/.eslintrc.buildrik-ds.js` has rules set to "off"

Run:
- `ls packages/editor/src/themes/design-system/`
- `cat packages/editor/src/shared/utils/tokens.ts`
- `grep -A 3 designTokensSchemaVersion packages/editor/src/shared/types/project.ts`

Report issues in one-line bullets. If clean: "PHASE 0 CLEAN."
```

- [ ] **Step 2: Run Codex**

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase0-review.md)"
```

- [ ] **Step 3: Apply fixes if flagged**

```bash
git add -u
git commit -m "fix(ds-v1): address Codex Phase 0 findings" || true
```

---

## Phase 1 — Write canonical DS files

**Goal:** 11 new CSS files with canonical tokens. `default.css` still imported; new DS not yet wired.

**Duration:** ~3-4 days

### Task 1.1: Write `color.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/color.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/color.css
 * Buildrik DS V1 — chrome color tokens
 * @license BSD-3-Clause
 */

:root {
  /* BACKGROUNDS */
  --buildrick-bg-panel: #F8FAFC;
  --buildrick-bg-card: #FFFFFF;
  --buildrick-bg-input: #FFFFFF;
  --buildrick-bg-elevated: #FFFFFF;
  --buildrick-bg-hover: rgba(15, 23, 42, 0.04);
  --buildrick-bg-subtle: #F1F5F9;

  /* TEXT */
  --buildrick-text-primary: #0F172A;
  --buildrick-text-secondary: #334155;
  --buildrick-text-muted: #64748B;
  --buildrick-text-tertiary: #94A3B8;
  --buildrick-text-on-accent: #FFFFFF;

  /* BORDERS */
  --buildrick-border: #64748B;
  --buildrick-border-light: #94A3B8;
  --buildrick-border-medium: #CBD5E1;
  --buildrick-border-strong: #94A3B8;
  --buildrick-border-hover: #94A3B8;
  --buildrick-border-focus: #2D6DFF;

  /* ACCENT (cobalt — single accent per DESIGN.md) */
  --buildrick-accent: #2D6DFF;
  --buildrick-accent-hover: #2557CC;
  --buildrick-accent-pressed: #1E4499;
  --buildrick-accent-subtle: rgba(45, 109, 255, 0.08);
  --buildrick-accent-tint: rgba(45, 109, 255, 0.12);

  /* SEMANTIC STATUS */
  --buildrick-error: #DC2626;
  --buildrick-error-light: rgba(220, 38, 38, 0.10);
  --buildrick-error-border: rgba(220, 38, 38, 0.30);
  --buildrick-error-bg: rgba(220, 38, 38, 0.05);
  --buildrick-success: #16A34A;
  --buildrick-success-light: rgba(22, 163, 74, 0.10);
  --buildrick-success-border: rgba(22, 163, 74, 0.30);
  --buildrick-warning: #D97706;
  --buildrick-warning-light: rgba(217, 119, 6, 0.10);
  --buildrick-warning-border: rgba(217, 119, 6, 0.30);
  --buildrick-warning-bg: rgba(217, 119, 6, 0.05);
  --buildrick-info: #2D6DFF;
  --buildrick-info-light: rgba(45, 109, 255, 0.08);

  /* AMBER / EMERALD FAMILIES */
  --buildrick-amber-light: rgba(217, 119, 6, 0.10);
  --buildrick-amber-dark: rgba(217, 119, 6, 0.20);
  --buildrick-amber-border: rgba(217, 119, 6, 0.30);
  --buildrick-emerald-light: rgba(22, 163, 74, 0.10);
  --buildrick-emerald-dark: rgba(22, 163, 74, 0.20);
  --buildrick-emerald-border: rgba(22, 163, 74, 0.30);

  /* OVERLAYS */
  --buildrick-overlay: rgba(15, 23, 42, 0.40);

  /* CANVAS CHROME */
  --buildrick-canvas-content: #FFFFFF;
  --buildrick-canvas-wrapper: #F8FAFC;
  --buildrick-canvas-dot: rgba(15, 23, 42, 0.08);

  /* MISC */
  --buildrick-destructive: #DC2626;
  --buildrick-input-ring: rgba(45, 109, 255, 0.08);
  --buildrick-input-ring-error: rgba(220, 38, 38, 0.10);
}
```

- [ ] **Step 2: Verify no duplicate keys within file**

Create a quick check script. Use node REPL:

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('packages/editor/src/themes/design-system/color.css', 'utf8');
const keys = [...content.matchAll(/--buildrick-[a-z0-9-]+/g)].map(m => m[0]);
const filtered = keys.filter(k => content.match(new RegExp('^\\\\s*' + k + '\\\\s*:', 'm')));
const seen = new Map();
filtered.forEach(k => seen.set(k, (seen.get(k)||0)+1));
const dups = [...seen.entries()].filter(([,n]) => n > 1);
console.log(dups.length ? 'DUPS: ' + JSON.stringify(dups) : 'OK');
"
# Expected: OK
```

- [ ] **Step 3: Commit**

```bash
git add packages/editor/src/themes/design-system/color.css
git commit -m "feat(ds-v1): write color.css with canonical chrome color tokens"
```

### Task 1.2: Write `typography.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/typography.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/typography.css
 * Buildrik DS V1 — chrome typography tokens
 * @license BSD-3-Clause
 */

:root {
  /* FONT FAMILIES */
  --buildrick-font-family: "Inter Tight", "Inter", sans-serif;
  --buildrick-font-family-display: "General Sans", "Inter Tight", sans-serif;
  --buildrick-font-family-mono: "Geist Mono", "JetBrains Mono", monospace;

  /* FONT SIZE SCALE */
  --buildrick-text-xs: 11px;
  --buildrick-text-sm: 12px;
  --buildrick-text-sm-plus: 13px;
  --buildrick-text-md: 14px;
  --buildrick-text-lg: 16px;
  --buildrick-text-xl: 18px;
  --buildrick-text-2xl: 20px;
  --buildrick-text-3xl: 24px;
  --buildrick-text-4xl: 32px;

  /* FONT WEIGHTS */
  --buildrick-font-weight-normal: 400;
  --buildrick-font-weight-medium: 500;
  --buildrick-font-weight-semibold: 600;
  --buildrick-font-weight-bold: 700;

  /* LETTER SPACING */
  --buildrick-tracking-tight: -0.02em;
  --buildrick-tracking-normal: 0;
  --buildrick-tracking-wide: 0.02em;
  --buildrick-tracking-wider: 0.04em;
  --buildrick-tracking-widest: 0.08em;

  /* LINE HEIGHT */
  --buildrick-line-tight: 1.2;
  --buildrick-line-normal: 1.5;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/typography.css
git commit -m "feat(ds-v1): write typography.css + new --buildrick-font-family-mono"
```

### Task 1.3: Write `spacing.css` (12 new tokens)

**Files:**
- Modify: `packages/editor/src/themes/design-system/spacing.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/spacing.css
 * Buildrik DS V1 — chrome spacing tokens
 * NEW: --buildrick-space-1..12. Replaces chrome consumption of --buildrick-design-space-*.
 * @license BSD-3-Clause
 */

:root {
  --buildrick-space-1: 4px;
  --buildrick-space-2: 8px;
  --buildrick-space-3: 12px;
  --buildrick-space-4: 16px;
  --buildrick-space-5: 20px;
  --buildrick-space-6: 24px;
  --buildrick-space-8: 32px;
  --buildrick-space-10: 40px;
  --buildrick-space-12: 48px;
  --buildrick-touch-min: 44px;
  --buildrick-touch-gap: 8px;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/spacing.css
git commit -m "feat(ds-v1): write spacing.css with NEW --buildrick-space-1..12 tokens"
```

### Task 1.4: Write `radius.css` (5 new tokens)

**Files:**
- Modify: `packages/editor/src/themes/design-system/radius.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/radius.css
 * Buildrik DS V1 — chrome radius tokens
 * NEW: --buildrick-radius-sm..full. Replaces 149 chrome consumers of --buildrick-design-radius-*.
 * @license BSD-3-Clause
 */

:root {
  --buildrick-radius-sm: 4px;
  --buildrick-radius-md: 8px;
  --buildrick-radius-lg: 12px;
  --buildrick-radius-xl: 16px;
  --buildrick-radius-full: 9999px;
  --buildrick-rounded: 6px;
  --buildrick-rounded-sm: 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/radius.css
git commit -m "feat(ds-v1): write radius.css with NEW --buildrick-radius-sm..full tokens"
```

### Task 1.5: Write `shadow.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/shadow.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/shadow.css
 * Buildrik DS V1 — chrome elevation + glow tokens
 * @license BSD-3-Clause
 */

:root {
  /* ELEVATION */
  --buildrick-shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --buildrick-shadow-md: 0 4px 12px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --buildrick-shadow-lg: 0 8px 24px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.05);
  --buildrick-shadow-xl: 0 16px 40px rgba(15, 23, 42, 0.10), 0 8px 16px rgba(15, 23, 42, 0.06);

  /* SEMANTIC ELEVATION */
  --buildrick-shadow-dropdown: 0 4px 12px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);

  /* GLOW (focus rings, selection indicators) */
  --buildrick-glow-selection: 0 0 0 4px rgba(45, 109, 255, 0.08);
  --buildrick-glow-primary: 0 0 0 3px rgba(45, 109, 255, 0.08);
  --buildrick-glow-cta: 0 0 0 3px rgba(45, 109, 255, 0.12);
  --buildrick-glow-publish: 0 0 0 3px rgba(22, 163, 74, 0.10);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/shadow.css
git commit -m "feat(ds-v1): write shadow.css with chrome elevation + glow tokens"
```

### Task 1.6: Write `motion.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/motion.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/motion.css
 * Buildrik DS V1 — motion tokens (minimal per DESIGN.md)
 * @license BSD-3-Clause
 */

:root {
  /* DURATIONS */
  --buildrick-duration-instant: 80ms;
  --buildrick-duration-fast: 120ms;
  --buildrick-duration-normal: 180ms;
  --buildrick-duration-slow: 240ms;

  /* EASINGS */
  --buildrick-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --buildrick-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --buildrick-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* TRANSITION SHORTHANDS */
  --buildrick-transition-fast: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-transition-normal: all 180ms cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-transition-slow: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-transition-colors: background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), border-color 120ms cubic-bezier(0.4, 0, 0.2, 1), color 120ms cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-transition-transform: transform 180ms cubic-bezier(0.4, 0, 0.2, 1);
  --buildrick-transition-all: all 180ms cubic-bezier(0.4, 0, 0.2, 1);

  /* HOVER TRANSFORMS */
  --buildrick-hover-lift: translateY(-1px);
  --buildrick-hover-scale: scale(1.02);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/motion.css
git commit -m "feat(ds-v1): write motion.css with durations, easings, transitions"
```

### Task 1.7: Write `z-index.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/z-index.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/z-index.css
 * Buildrik DS V1 — chrome z-index layering
 * @license BSD-3-Clause
 */

:root {
  --buildrick-z-base: 0;
  --buildrick-z-canvas: 1;
  --buildrick-z-sticky: 10;
  --buildrick-z-rail: 20;
  --buildrick-z-panel: 30;
  --buildrick-z-topbar: 40;
  --buildrick-z-dropdown: 100;
  --buildrick-z-popover: 200;
  --buildrick-z-modal: 300;
  --buildrick-z-overlay: 400;
  --buildrick-z-toast: 500;
  --buildrick-z-tooltip: 600;
  --buildrick-z-max: 9999;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/z-index.css
git commit -m "feat(ds-v1): write z-index.css with 13 layering tokens"
```

### Task 1.8: Write `layout.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/layout.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/layout.css
 * Buildrik DS V1 — chrome layout dimensions
 * Distinct from --buildrick-design-layout-* (user site layout, in design.css).
 * @license BSD-3-Clause
 */

:root {
  /* EDITOR SHELL DIMENSIONS */
  --buildrick-sidebar-width: 56px;
  --buildrick-sidebar-panel-width: 320px;
  --buildrick-right-panel-width: 280px;
  --buildrick-header-height: 48px;
  --buildrick-footer-height: 32px;
  --buildrick-layout-gap: 0px;

  /* PANEL INTERNALS */
  --buildrick-panel-input-height: 32px;
  --buildrick-panel-label-size: 12px;
  --buildrick-panel-label-weight: 500;
  --buildrick-panel-section-gap: 16px;
  --buildrick-panel-section-padding: 12px;

  /* HISTORY TAB DRAWER (renamed from --buildrick-tt-drawer-*) */
  --buildrick-layout-drawer-left: 344px;
  --buildrick-layout-drawer-right: 320px;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/layout.css
git commit -m "feat(ds-v1): write layout.css with editor shell dimensions"
```

### Task 1.9: Write `design.css` (user-editable baselines)

**Files:**
- Modify: `packages/editor/src/themes/design-system/design.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/design.css
 * Buildrik DS V1 — user-editable SITE tokens (pre-render baselines)
 *
 * Values MUST match DEFAULT_TOKENS in features/design-system/constants.ts.
 * Runtime setProperty (Design tab) overrides these after hydration.
 *
 * @license BSD-3-Clause
 */

:root {
  /* COLORS (9 — user-editable) */
  --buildrick-design-color-primary: #3B82F6;
  --buildrick-design-color-secondary: #8B5CF6;
  --buildrick-design-color-accent: #22C55E;
  --buildrick-design-color-background: #0A0A0A;
  --buildrick-design-color-text: #FFFFFF;
  --buildrick-design-color-muted: #71717A;
  --buildrick-design-color-border: #27272A;
  --buildrick-design-color-success: #22C55E;
  --buildrick-design-color-error: #EF4444;

  /* TYPOGRAPHY (11 — user-editable) */
  --buildrick-design-font-heading: "Inter";
  --buildrick-design-font-body: "Inter";
  --buildrick-design-font-mono: "JetBrains Mono";
  --buildrick-design-font-size-xs: 12px;
  --buildrick-design-font-size-sm: 14px;
  --buildrick-design-font-size-base: 16px;
  --buildrick-design-font-size-lg: 18px;
  --buildrick-design-font-size-xl: 20px;
  --buildrick-design-font-size-2xl: 24px;
  --buildrick-design-font-size-3xl: 30px;
  --buildrick-design-font-size-4xl: 36px;

  /* SPACING (9 — user-editable) */
  --buildrick-design-space-1: 4px;
  --buildrick-design-space-2: 8px;
  --buildrick-design-space-3: 12px;
  --buildrick-design-space-4: 16px;
  --buildrick-design-space-5: 20px;
  --buildrick-design-space-6: 24px;
  --buildrick-design-space-8: 32px;
  --buildrick-design-space-10: 40px;
  --buildrick-design-space-12: 48px;

  /* EFFECTS (10 — static DS defaults) */
  --buildrick-design-radius-none: 0;
  --buildrick-design-radius-sm: 4px;
  --buildrick-design-radius-md: 8px;
  --buildrick-design-radius-lg: 12px;
  --buildrick-design-radius-xl: 16px;
  --buildrick-design-radius-full: 9999px;
  --buildrick-design-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --buildrick-design-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --buildrick-design-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.15);
  --buildrick-design-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.25);

  /* LAYOUT (8 — static DS defaults) */
  --buildrick-design-layout-max-width: 1280px;
  --buildrick-design-layout-padding-x: 24px;
  --buildrick-design-layout-columns: 12;
  --buildrick-design-layout-gutter: 24px;
  --buildrick-design-section-padding-y: 80px;
  --buildrick-design-content-max-width: 720px;
  --buildrick-design-base-unit: 4px;
  --buildrick-design-breakpoint-mobile: 768px;

  /* ICONS (5 — static DS defaults) */
  --buildrick-design-icon-style: outline;
  --buildrick-design-icon-stroke: 1.5;
  --buildrick-design-icon-sm: 16px;
  --buildrick-design-icon-md: 20px;
  --buildrick-design-icon-lg: 24px;

  /* BUTTONS (8 — static DS defaults) */
  --buildrick-design-btn-height-sm: 32px;
  --buildrick-design-btn-height-md: 40px;
  --buildrick-design-btn-height-lg: 48px;
  --buildrick-design-btn-padding-x: 16px;
  --buildrick-design-btn-font-weight: 600;
  --buildrick-design-btn-font-size: 14px;
  --buildrick-design-btn-radius: 8px;
  --buildrick-design-cta-radius: 9999px;

  /* FORMS (8 — static DS defaults) */
  --buildrick-design-input-height: 40px;
  --buildrick-design-input-radius: 8px;
  --buildrick-design-input-border: #27272A;
  --buildrick-design-input-focus: #3B82F6;
  --buildrick-design-input-padding-x: 12px;
  --buildrick-design-label-font-size: 13px;
  --buildrick-design-label-weight: 500;
  --buildrick-design-placeholder-color: #71717A;
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/design.css
git commit -m "feat(ds-v1): write design.css with 68 runtime baseline tokens"
```

### Task 1.10: Write `a11y.css`

**Files:**
- Modify: `packages/editor/src/themes/design-system/a11y.css`

- [ ] **Step 1: Replace file content**

```css
/**
 * themes/design-system/a11y.css
 * Buildrik DS V1 — consolidated a11y media-query overrides.
 * Only file allowed to contain @media (prefers-*) blocks (spec §10 Gate 7).
 * @license BSD-3-Clause
 */

@media (prefers-contrast: high) {
  :root {
    --buildrick-border: #64748B;
    --buildrick-border-light: #94A3B8;
  }
  .buildrick-btn {
    border: 2px solid currentColor;
  }
  .buildrick-input,
  .buildrick-select,
  .buildrick-textarea {
    border-width: 2px;
  }
  :focus-visible {
    outline: 3px solid CanvasText;
    outline-offset: 2px;
  }
  [data-buildrick-id][data-selected="true"] {
    outline: 3px solid Highlight;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/design-system/a11y.css
git commit -m "feat(ds-v1): write a11y.css consolidating 3 @media prefers-contrast blocks"
```

### Task 1.11: Write `index.css` + parity verifier

**Files:**
- Modify: `packages/editor/src/themes/design-system/index.css`
- Create: `packages/editor/scripts/verify-design-baselines.mjs`

- [ ] **Step 1: Replace index.css**

```css
/**
 * themes/design-system/index.css
 * Buildrik DS V1 — public DS entry point.
 * @license BSD-3-Clause
 */

@import "./color.css";
@import "./typography.css";
@import "./spacing.css";
@import "./radius.css";
@import "./shadow.css";
@import "./motion.css";
@import "./z-index.css";
@import "./layout.css";
@import "./design.css";
@import "./a11y.css";
```

- [ ] **Step 2: Create parity verifier (pure fs, no shell spawn)**

Create `packages/editor/scripts/verify-design-baselines.mjs`:

```js
#!/usr/bin/env node
/**
 * Verify design.css baseline values match DEFAULT_TOKENS in constants.ts.
 * Fails if any --buildrick-design-X CSS value differs from JS value.
 *
 * Run: node packages/editor/scripts/verify-design-baselines.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Parse design.css
const css = fs.readFileSync(
  path.join(root, "src/themes/design-system/design.css"),
  "utf8"
);
const cssValues = {};
for (const line of css.split("\n")) {
  const match = line.match(/^\s*(--buildrick-design-[a-z0-9-]+)\s*:\s*([^;]+);/);
  if (match) cssValues[match[1]] = match[2].trim();
}

// Parse constants.ts DEFAULT_TOKENS
const ts = fs.readFileSync(
  path.join(root, "src/features/design-system/constants.ts"),
  "utf8"
);
const tsValues = {};
const blockRegex = /\{[^{}]*\}/gs;
for (const block of ts.match(blockRegex) ?? []) {
  const cssVarMatch = block.match(/cssVar:\s*"(--buildrick-design-[a-z0-9-]+)"/);
  const valueMatch = block.match(/value:\s*"([^"]+)"/);
  if (cssVarMatch && valueMatch) {
    tsValues[cssVarMatch[1]] = valueMatch[1];
  }
}

// Compare
const allKeys = new Set([...Object.keys(cssValues), ...Object.keys(tsValues)]);
const mismatches = [];
for (const key of allKeys) {
  if (cssValues[key] !== tsValues[key]) {
    mismatches.push({
      key,
      css: cssValues[key] ?? "(missing in CSS)",
      ts: tsValues[key] ?? "(missing in JS)",
    });
  }
}

if (mismatches.length > 0) {
  console.error("DS baseline parity FAILED:");
  for (const m of mismatches) {
    console.error(`  ${m.key}: CSS="${m.css}" vs JS="${m.ts}"`);
  }
  process.exit(1);
}

console.log(`DS baseline parity OK (${allKeys.size} tokens verified)`);
```

- [ ] **Step 3: Run parity check**

```bash
node packages/editor/scripts/verify-design-baselines.mjs
# Expected: "DS baseline parity OK (68 tokens verified)"
# If mismatch: fix values in design.css to match constants.ts, re-run
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/themes/design-system/index.css packages/editor/scripts/verify-design-baselines.mjs
git commit -m "feat(ds-v1): write index.css aggregator + DEFAULT_TOKENS parity verifier"
```

### Task 1.12: Codex review — Phase 1

**Files:** None

- [ ] **Step 1: Create review prompt**

Create `/tmp/codex-ds-phase1-review.md`:

```markdown
IMPORTANT: Do NOT read files under ~/.claude/, .claude/skills/, agents/.

Review Phase 1 of Buildrik DS V1 — 11 CSS files written.

Verify:
1. All 11 files exist in packages/editor/src/themes/design-system/
2. NO duplicate --buildrick-X keys within any single file
3. NO self-referential defs (--X: var(--X))
4. NEW chrome tokens present: --buildrick-space-1..12, --buildrick-radius-sm..full, --buildrick-font-family-mono
5. design.css is the ONLY file with --buildrick-design-* defs
6. a11y.css owns @media (prefers-contrast: high) + reduced-motion blocks
7. index.css imports in correct dependency order
8. `node packages/editor/scripts/verify-design-baselines.mjs` passes

Report problems in one-line bullets. If clean: "PHASE 1 CLEAN."
```

- [ ] **Step 2: Run Codex**

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase1-review.md)"
```

- [ ] **Step 3: Apply fixes + commit**

```bash
git add -u && git commit -m "fix(ds-v1): address Codex Phase 1 findings" || true
```

---

## Phase 2 — Wire aggregator

**Goal:** `default.css` becomes thin aggregator. Alias layers moved to `compat.css`.

**Duration:** ~1 day

### Task 2.1: Create `compat.css` with all alias families

**Files:**
- Create: `packages/editor/src/themes/compat.css`

- [ ] **Step 1: Write compat.css**

```css
/**
 * themes/compat.css
 * Buildrik DS V1 — deprecated alias layer (transitional)
 *
 * Phase 3 consumer migration drains each family; corresponding block deletes when
 * zero-consumer check passes. Entire file deleted in Phase 4.
 *
 * DO NOT use these aliases in new code.
 *
 * @license BSD-3-Clause
 */

:root {
  /* --accent (Phase 3.3) */
  --accent: var(--buildrick-accent);

  /* --ls-* LeftSidebar (Phase 3.1) */
  --ls-bg-panel: var(--buildrick-bg-panel);
  --ls-bg-card: var(--buildrick-bg-card);
  --ls-bg-subtle: var(--buildrick-bg-subtle);
  --ls-bg-hover: var(--buildrick-bg-hover);
  --ls-text-primary: var(--buildrick-text-primary);
  --ls-text-secondary: var(--buildrick-text-secondary);
  --ls-text-muted: var(--buildrick-text-muted);
  --ls-border: var(--buildrick-border);
  --ls-border-light: var(--buildrick-border-light);
  --ls-accent: var(--buildrick-accent);
  --ls-accent-subtle: var(--buildrick-accent-subtle);
  --ls-error: var(--buildrick-error);
  --ls-success: var(--buildrick-success);
  --ls-warning: var(--buildrick-warning);
  --ls-shadow-dropdown: var(--buildrick-shadow-dropdown);

  /* --rail-* LeftRail (Phase 3.2) */
  --rail-bg: var(--buildrick-bg-panel);
  --rail-active: var(--buildrick-accent);
  --rail-active-bg: var(--buildrick-accent-subtle);
  --rail-active-bg-hover: var(--buildrick-accent-tint);
  --rail-active-bar: var(--buildrick-accent);
  --rail-text-default: var(--buildrick-text-muted);
  --rail-text-hover: var(--buildrick-text-secondary);
  --rail-focus: var(--buildrick-border-focus);
  --rail-tooltip-bg: var(--buildrick-text-primary);
  --rail-badge-warn: var(--buildrick-warning);
  --rail-badge-info: var(--buildrick-accent);
  --rail-badge-ok: var(--buildrick-success);

  /* --surface-* / --brand-* V2 semantic (Phase 3.4) */
  --surface-primary: var(--buildrick-bg-panel);
  --surface-secondary: var(--buildrick-bg-card);
  --surface-hover: var(--buildrick-bg-hover);
  --surface-elevated: var(--buildrick-bg-elevated);
  --brand-primary: var(--buildrick-accent);
  --brand-primary-hover: var(--buildrick-accent-hover);

  /* --bar / --blue / --txt legacy navbar (Phase 3.5) */
  --bar: var(--buildrick-bg-panel);
  --blue: var(--buildrick-accent);
  --txt: var(--buildrick-text-primary);

  /* --primary-* old color variants (Phase 3.6) */
  --primary-500: var(--buildrick-accent);
  --primary-600: var(--buildrick-accent-hover);
  --primary-700: var(--buildrick-accent-pressed);

  /* --buildrick-control-* inspector aliases (Phase 3.7) */
  --buildrick-control-accent: var(--buildrick-accent);
  --buildrick-control-accent-alpha-08: rgba(45, 109, 255, 0.08);
  --buildrick-control-accent-alpha-10: rgba(45, 109, 255, 0.10);
  --buildrick-control-accent-alpha-20: rgba(45, 109, 255, 0.20);
  --buildrick-control-accent-alpha-30: rgba(45, 109, 255, 0.30);
  --buildrick-control-surface-input: var(--buildrick-bg-input);
  --buildrick-control-surface-overlay: var(--buildrick-bg-panel);
  --buildrick-control-surface-subtle: var(--buildrick-bg-subtle);
  --buildrick-control-text-primary: var(--buildrick-text-primary);
  --buildrick-control-text-secondary: var(--buildrick-text-secondary);
  --buildrick-control-text-muted: var(--buildrick-text-muted);
  --buildrick-control-text-tertiary: var(--buildrick-text-tertiary);

  /* --buildrick-build-* Build tab (Phase 3.8) */
  --buildrick-build-surface: var(--buildrick-bg-panel);
  --buildrick-build-card: var(--buildrick-bg-card);
  --buildrick-build-card-hover: var(--buildrick-bg-hover);
  --buildrick-build-border: var(--buildrick-border);
  --buildrick-build-border-hover: var(--buildrick-border-strong);

  /* --buildrick-ai-* AI panel (Phase 3.9) */
  --buildrick-ai-active: var(--buildrick-accent-pressed);
  --buildrick-ai-hover: var(--buildrick-accent-hover);
  --buildrick-ai-light: var(--buildrick-accent-tint);
  --buildrick-ai-muted: var(--buildrick-accent-subtle);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/editor/src/themes/compat.css
git commit -m "feat(ds-v1): create compat.css with deprecated alias layers"
```

### Task 2.2: Rewrite `default.css` as aggregator

**Files:**
- Modify: `packages/editor/src/themes/default.css` (replace entirely)

- [ ] **Step 1: Backup current default.css**

```bash
cp packages/editor/src/themes/default.css /tmp/default.css.phase2-backup
wc -l /tmp/default.css.phase2-backup
# Expected: ~5152 lines
```

- [ ] **Step 2: Extract class rules into `components.css`**

The current `default.css` has ~235 `.buildrick-*` class rules (component styling). These are NOT token defs; they must live somewhere. For DS V1, extract to a single `components.css` alongside DS files.

Create `packages/editor/src/themes/components.css` with all class rules from the backup (sections like `.buildrick-sidebar`, `.buildrick-toolbar`, `.buildrick-canvas`, `.buildrick-panel`, `.buildrick-left-tab`, etc.). Copy from backup lines 774-4260 (approximately — classes only, not `:root` or `@media` blocks).

```bash
# Preview class blocks in backup for reference
grep -nE '^\.buildrick-[a-z-]+ *\{' /tmp/default.css.phase2-backup | head -20
```

Manually copy class rules from backup to `components.css`. Skip the `:root` block (tokens now in design-system/) and the single `@media (prefers-contrast: high)` block (now in a11y.css).

- [ ] **Step 3: Replace default.css with aggregator**

```css
/**
 * themes/default.css
 * Buildrik DS V1 — public entry point (stable import contract).
 *
 * Imports:
 *   design-system/index.css — canonical DS
 *   compat.css — deprecated alias layers (deleted in Phase 4)
 *   components.css — .buildrick-* class rules
 *
 * @license BSD-3-Clause
 */

@import "./design-system/index.css";
@import "./compat.css";
@import "./components.css";
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/src/themes/default.css packages/editor/src/themes/components.css
git commit -m "feat(ds-v1): rewrite default.css as thin aggregator; extract class rules to components.css"
```

### Task 2.3: Verify editor loads

**Files:** None

- [ ] **Step 1: Start dev server**

```bash
cd packages/editor && npm run dev &
sleep 5
```

- [ ] **Step 2: Manual verification**

Open `http://localhost:5050/` in browser. Confirm:
- Editor loads, no white screen
- No console errors about missing CSS
- Topbar, rail, sidebar, inspector, canvas render
- Cobalt accent color, light chrome
- Click block — selection ring appears
- Design tab opens — controls visible

- [ ] **Step 3: Stop dev server**

```bash
pkill -f vite || true
```

### Task 2.4: Capture Playwright baselines

**Files:**
- Create: `packages/editor/tests/visual/ds-baselines.spec.ts`

- [ ] **Step 1: Verify Playwright available**

```bash
cd packages/editor && npx playwright --version
# If missing: npm install -D @playwright/test && npx playwright install chromium
```

- [ ] **Step 2: Write baseline spec**

Create `packages/editor/tests/visual/ds-baselines.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("DS V1 baselines — post aggregator, pre consumer migration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/editor/fixture-blank-project");
    await page.waitForLoadState("networkidle");
  });

  test("editor shell", async ({ page }) => {
    await expect(page).toHaveScreenshot("shell.png", { maxDiffPixelRatio: 0.02 });
  });

  test("rail (cobalt accent)", async ({ page }) => {
    await expect(page.locator("[data-rail]")).toHaveScreenshot("rail.png");
  });

  test("sidebar templates tab", async ({ page }) => {
    await page.click('[data-tab="templates"]');
    await expect(page.locator("[data-sidebar]")).toHaveScreenshot("tab-templates.png");
  });

  test("sidebar pages tab", async ({ page }) => {
    await page.click('[data-tab="pages"]');
    await expect(page.locator("[data-sidebar]")).toHaveScreenshot("tab-pages.png");
  });

  test("sidebar design tab", async ({ page }) => {
    await page.click('[data-tab="design"]');
    await expect(page.locator("[data-sidebar]")).toHaveScreenshot("tab-design.png");
  });

  test("inspector with element selected", async ({ page }) => {
    await page.goto("/editor/fixture-with-heading");
    await page.click('[data-element="heading-1"]');
    await expect(page.locator("[data-inspector]")).toHaveScreenshot("inspector-heading.png");
  });

  test("canvas with sample project", async ({ page }) => {
    await page.goto("/editor/fixture-sample-site");
    await expect(page.locator(".buildrick-canvas")).toHaveScreenshot("canvas-sample.png");
  });

  test("design tab runtime mutation updates canvas", async ({ page }) => {
    await page.goto("/editor/fixture-sample-site");
    await page.click('[data-tab="design"]');
    await page.fill('[data-token="color-primary"]', "#FF0000");
    await page.waitForTimeout(200);
    await expect(page.locator(".buildrick-canvas")).toHaveScreenshot("canvas-color-change.png");
  });
});
```

- [ ] **Step 3: Capture baselines**

```bash
cd packages/editor && npx playwright test tests/visual/ds-baselines.spec.ts --update-snapshots
# Expected: all tests "pass" (baselines captured)
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/tests/visual/
git commit -m "test(ds-v1): capture Playwright baselines at Phase 2"
```

### Task 2.5: Codex review — Phase 2

**Files:** None

- [ ] **Step 1: Create review prompt**

Create `/tmp/codex-ds-phase2-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 2 — aggregator wiring.

Verify:
1. `packages/editor/src/themes/default.css` is thin (~15 lines, only @import)
2. `packages/editor/src/themes/compat.css` exists with 10 alias families
3. `packages/editor/src/themes/components.css` has extracted .buildrick-* class rules
4. No orphan content left in old default.css
5. Playwright baselines captured (tests/visual/ds-baselines.spec.ts + screenshot files)

Check:
- `wc -l packages/editor/src/themes/default.css` (should be < 25)
- `grep -c '^\s*--' packages/editor/src/themes/compat.css` (should be 60+ alias lines)
- Editor still loads correctly (no cascade regressions)

If clean: "PHASE 2 CLEAN."
```

- [ ] **Step 2: Run Codex + apply fixes**

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase2-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 2 findings" || true
```

---

## Phase 3 — Family-by-family consumer migration

**Goal:** Migrate each alias family's consumers; delete block from compat.css; Codex review per family.

**Duration:** ~2-3 weeks

### Task 3.1: Migrate `--ls-*` consumers + Codex review

**Files:** Various `.css`/`.tsx` files under `packages/editor/src/` using `--ls-*`

- [ ] **Step 1: Find all --ls-* sites**

```bash
grep -rn 'var(--ls-' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' > /tmp/ls-consumers.txt
wc -l /tmp/ls-consumers.txt
```

- [ ] **Step 2: Rename via sed (15 mappings)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'ls-bg-panel:buildrick-bg-panel' 'ls-bg-card:buildrick-bg-card' 'ls-bg-subtle:buildrick-bg-subtle' 'ls-bg-hover:buildrick-bg-hover' 'ls-text-primary:buildrick-text-primary' 'ls-text-secondary:buildrick-text-secondary' 'ls-text-muted:buildrick-text-muted' 'ls-border-light:buildrick-border-light' 'ls-border:buildrick-border' 'ls-accent-subtle:buildrick-accent-subtle' 'ls-accent:buildrick-accent' 'ls-error:buildrick-error' 'ls-success:buildrick-success' 'ls-warning:buildrick-warning' 'ls-shadow-dropdown:buildrick-shadow-dropdown'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 3: Verify zero --ls-* consumers**

```bash
grep -rn 'var(--ls-' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
```

- [ ] **Step 4: Delete --ls-* block from compat.css**

Edit `packages/editor/src/themes/compat.css` — remove the entire `--ls-*` block (lines tagged `/* --ls-* LeftSidebar (Phase 3.1) */` through the last `--ls-shadow-dropdown` line).

- [ ] **Step 5: Visual spot-check + Playwright**

```bash
cd packages/editor && npm run dev &
sleep 5
# In browser: verify LeftSidebar, PagesTab, TemplatesTab render correctly
pkill -f vite
npx playwright test tests/visual/ds-baselines.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ds-v1): migrate --ls-* consumers to canonical --buildrick-*"
```

- [ ] **Step 7: Codex review**

Create `/tmp/codex-ds-phase3-1-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3.1 — --ls-* migration.

Verify:
1. `grep -rn 'var(--ls-' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts'` is EMPTY
2. compat.css no longer has --ls-* block
3. `.ls-panel-animate` class names NOT mutated (class selectors, not vars)

If clean: "PHASE 3.1 CLEAN."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-1-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 3.1 findings" || true
```

### Task 3.2: Migrate `--rail-*` consumers + delete dark fallbacks + Codex review

**Files:**
- Modify: `packages/editor/src/components/Layout/LeftRail.css` (main consumer, 29 dark fallback sites)
- Other rail consumer files

- [ ] **Step 1: Find all --rail-* sites**

```bash
grep -rn 'var(--rail-' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts'
```

- [ ] **Step 2: Rename via sed (12 mappings)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'rail-active-bg-hover:buildrick-accent-tint' 'rail-active-bg:buildrick-accent-subtle' 'rail-active-bar:buildrick-accent' 'rail-active:buildrick-accent' 'rail-bg:buildrick-bg-panel' 'rail-text-default:buildrick-text-muted' 'rail-text-hover:buildrick-text-secondary' 'rail-focus:buildrick-border-focus' 'rail-tooltip-bg:buildrick-text-primary' 'rail-badge-warn:buildrick-warning' 'rail-badge-info:buildrick-accent' 'rail-badge-ok:buildrick-success'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 3: Remove dark-value fallbacks in LeftRail.css**

Edit `packages/editor/src/components/Layout/LeftRail.css`. Find patterns like:

```css
background: var(--buildrick-bg-panel, #0c0c12);
color: var(--buildrick-accent, #818CF8);
```

Remove the fallback — change to:

```css
background: var(--buildrick-bg-panel);
color: var(--buildrick-accent);
```

Banned fallback values (delete each): `#0c0c12`, `#161620`, `#818CF8`, `#6366F1`, `rgba(99, 102, 241, ...)`, `#00d4aa`, `#3d4a5c`.

Keep `#7c88a0`-style light grays only if they match DESIGN.md neutrals; delete fallback entirely when in doubt.

- [ ] **Step 4: Verify zero --rail-* + no banned fallbacks**

```bash
grep -rn 'var(--rail-' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
grep -rE '#(0c0c12|161620|818CF8|6366F1|00d4aa)' packages/editor/src/components/Layout/LeftRail.css || echo 'NO BANNED FALLBACKS'
grep -rE 'rgba\(99, 102, 241' packages/editor/src/components/Layout/LeftRail.css || echo 'NO INDIGO RGBA'
```

- [ ] **Step 5: Delete --rail-* block from compat.css**

Edit `packages/editor/src/themes/compat.css` — remove entire `--rail-*` block.

- [ ] **Step 6: Visual spot-check + Playwright**

```bash
cd packages/editor && npm run dev &
sleep 5
# Verify rail renders COBALT (not indigo, teal, or black)
pkill -f vite
npx playwright test tests/visual/ds-baselines.spec.ts
# Rail screenshot will differ (indigo → cobalt). If intentional:
# npx playwright test tests/visual/ds-baselines.spec.ts --update-snapshots
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ds-v1): migrate --rail-* + remove 29 dark fallback sites in LeftRail.css"
```

- [ ] **Step 8: Codex review**

Create `/tmp/codex-ds-phase3-2-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3.2 — --rail-* migration + dark fallback cleanup.

Verify:
1. `grep -rn 'var(--rail-' packages/editor/src` is EMPTY
2. LeftRail.css has ZERO banned fallback values: #0c0c12, #161620, #818CF8, #6366F1, #00d4aa, rgba(99, 102, 241, ...)
3. compat.css no longer has --rail-* block
4. Rail renders cobalt (verified by Playwright)

If clean: "PHASE 3.2 CLEAN."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-2-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 3.2 findings" || true
```

### Task 3.3: Migrate `--accent` consumers + delete alias + Codex review

**Files:** 27 consumer files (see spec Appendix B)

- [ ] **Step 1: Find --accent consumer sites**

```bash
grep -rn 'var(--accent)' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts'
```

- [ ] **Step 2: Rename all 27 external consumers**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
find packages/editor/src/editor packages/editor/src/shared packages/editor/src/components packages/editor/src/blocks packages/editor/src/templates -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' 's/var(--accent)/var(--buildrick-accent)/g'
```

- [ ] **Step 3: Verify zero consumers**

```bash
grep -rn 'var(--accent)' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
```

- [ ] **Step 4: Delete `--accent` line from compat.css**

Edit `packages/editor/src/themes/compat.css` — remove the single line `--accent: var(--buildrick-accent);` (inside `/* --accent (Phase 3.3) */` block).

- [ ] **Step 5: Visual spot-check + Playwright**

```bash
cd packages/editor && npm run dev &
sleep 5
# Pages tab, canvas selection, templates progress — all should look correct
pkill -f vite
npx playwright test tests/visual/ds-baselines.spec.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(ds-v1): migrate --accent consumers; delete alias"
```

- [ ] **Step 7: Codex review**

Create `/tmp/codex-ds-phase3-3-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3.3 — --accent deletion.

Verify:
1. `grep -rn 'var(--accent)' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts'` is EMPTY
2. `grep -n '^\s*--accent\s*:' packages/editor/src/themes/compat.css` is EMPTY

If clean: "PHASE 3.3 CLEAN."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-3-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 3.3 findings" || true
```

### Task 3.4: Migrate `--surface-*` / `--brand-*` + Codex review

- [ ] **Step 1: Rename via sed**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'surface-primary:buildrick-bg-panel' 'surface-secondary:buildrick-bg-card' 'surface-hover:buildrick-bg-hover' 'surface-elevated:buildrick-bg-elevated' 'brand-primary-hover:buildrick-accent-hover' 'brand-primary:buildrick-accent'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + delete compat block + commit + Codex**

```bash
grep -rnE 'var\(--(surface-|brand-)' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
# Edit compat.css — remove --surface-*/--brand-* block
git add -A && git commit -m "refactor(ds-v1): migrate --surface-*/--brand-* to canonical"
```

Codex review (reuse prompt pattern with `--surface-|--brand-` regex).

### Task 3.5: Migrate `--bar` / `--blue` / `--txt` + Codex review

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'bar:buildrick-bg-panel' 'blue:buildrick-accent' 'txt:buildrick-text-primary'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + delete compat block + commit + Codex**

```bash
grep -rnE 'var\(--(bar|blue|txt)\)' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate --bar/--blue/--txt legacy navbar aliases"
```

Codex review (same pattern).

### Task 3.6: Migrate `--primary-*` + Codex review

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'primary-700:buildrick-accent-pressed' 'primary-600:buildrick-accent-hover' 'primary-500:buildrick-accent'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + delete compat block + commit + Codex**

```bash
grep -rnE 'var\(--primary-[0-9]' packages/editor/src --include='*.css' --include='*.tsx' --include='*.ts' || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate --primary-* to --buildrick-accent-* variants"
```

Codex review.

### Task 3.7: INSPECTOR_TOKENS codemod + `--buildrick-control-*` migration + Codex review

**Files:**
- Create: `packages/editor/scripts/codemod-inspector-tokens.mjs`
- Modify: ~32 files using `INSPECTOR_TOKENS`
- Modify: `packages/editor/src/editor/inspector/shared/controls/controlStyles.ts`

- [ ] **Step 1: Write codemod (pure node fs — no shell spawn)**

Create `packages/editor/scripts/codemod-inspector-tokens.mjs`:

```js
#!/usr/bin/env node
/**
 * Codemod: replace INSPECTOR_TOKENS.X references with inline var(--buildrick-*) strings.
 * Decision 6: single-commit convergence.
 *
 * Run: node packages/editor/scripts/codemod-inspector-tokens.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../src");

// Map INSPECTOR_TOKENS.<key> → replacement string
const MAP = {
  accent: '"var(--buildrick-accent)"',
  accentHover: '"var(--buildrick-accent-hover)"',
  accentPressed: '"var(--buildrick-accent-pressed)"',
  accentAlpha08: '"rgba(45, 109, 255, 0.08)"',
  accentAlpha10: '"var(--buildrick-accent-subtle)"',
  accentAlpha20: '"rgba(45, 109, 255, 0.20)"',
  accentAlpha30: '"rgba(45, 109, 255, 0.30)"',
  textPrimary: '"var(--buildrick-text-primary)"',
  textSecondary: '"var(--buildrick-text-secondary)"',
  textMuted: '"var(--buildrick-text-muted)"',
  textTertiary: '"var(--buildrick-text-tertiary)"',
  surfaceInput: '"var(--buildrick-bg-input)"',
  surfaceOverlay: '"var(--buildrick-bg-panel)"',
  surfaceSubtle: '"var(--buildrick-bg-subtle)"',
  border: '"var(--buildrick-border)"',
  borderInput: '"var(--buildrick-border-medium)"',
};

function walk(dir, collected = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, collected);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

const files = walk(SRC);
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("INSPECTOR_TOKENS")) continue;

  let content = original;

  // Remove import line
  content = content.replace(
    /import\s*\{\s*INSPECTOR_TOKENS[^}]*\}\s*from\s*['"][^'"]+controlStyles['"]\s*;?\n?/g,
    ""
  );

  // Replace property accesses
  for (const [key, value] of Object.entries(MAP)) {
    const pattern = new RegExp(`INSPECTOR_TOKENS\\.${key}\\b`, "g");
    content = content.replace(pattern, value);
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`- ${path.relative(SRC, file)}`);
    changed++;
  }
}

console.log(`\nChanged ${changed}/${files.length} files.`);
```

- [ ] **Step 2: Backup + dry-run verification**

```bash
cp -R packages/editor/src /tmp/editor-src-backup-inspector-tokens
node packages/editor/scripts/codemod-inspector-tokens.mjs
# Review a sample diff
diff /tmp/editor-src-backup-inspector-tokens/editor/inspector/sections/typography/FontControls.tsx packages/editor/src/editor/inspector/sections/typography/FontControls.tsx
```

- [ ] **Step 3: Verify no INSPECTOR_TOKENS references remain**

```bash
grep -rn 'INSPECTOR_TOKENS' packages/editor/src --include='*.ts' --include='*.tsx' || echo 'CLEAN'
```

- [ ] **Step 4: Delete INSPECTOR_TOKENS export**

Edit `packages/editor/src/editor/inspector/shared/controls/controlStyles.ts` — remove the entire `export const INSPECTOR_TOKENS = { ... }` block. Keep other exports.

- [ ] **Step 5: Replace direct getComputedStyle readers with getToken()**

Files (3 sites):
- `packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx:46`
- `packages/editor/src/editor/inspector/sections/typography/FontControls.tsx:44`
- `packages/editor/src/editor/inspector/sections/SizeSection.tsx:25`

In each, find:

```ts
getComputedStyle(document.documentElement).getPropertyValue('--buildrick-X').trim()
```

Replace with:

```ts
import { getToken } from '@/shared/utils/tokens';
// ...
getToken('X')
```

Confirm TokenName type has each X; add to type-names.ts if missing.

- [ ] **Step 6: Migrate `--buildrick-control-*` consumers**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-control-accent-alpha-08:accent-subtle' 'buildrick-control-accent-alpha-10:accent-subtle' 'buildrick-control-accent-alpha-20:accent-tint' 'buildrick-control-accent-alpha-30:accent-tint' 'buildrick-control-accent:accent' 'buildrick-control-surface-input:buildrick-bg-input' 'buildrick-control-surface-overlay:buildrick-bg-panel' 'buildrick-control-surface-subtle:buildrick-bg-subtle' 'buildrick-control-text-primary:buildrick-text-primary' 'buildrick-control-text-secondary:buildrick-text-secondary' 'buildrick-control-text-muted:buildrick-text-muted' 'buildrick-control-text-tertiary:buildrick-text-tertiary'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

Note: first 5 mappings target `buildrick-accent-*` (no prefix). Fix inline if sed misses:

```bash
sed -i '' 's/var(--accent-subtle)/var(--buildrick-accent-subtle)/g' packages/editor/src/**/*.css
sed -i '' 's/var(--accent-tint)/var(--buildrick-accent-tint)/g' packages/editor/src/**/*.css
sed -i '' 's/var(--accent)/var(--buildrick-accent)/g' packages/editor/src/**/*.css
```

- [ ] **Step 7: Verify TS compiles + editor runs**

```bash
cd packages/editor && npx tsc --noEmit
npm run dev &
sleep 5
# Verify inspector renders — color picker, font picker, size inputs all work
pkill -f vite
```

- [ ] **Step 8: Delete --buildrick-control-* block from compat.css**

Edit `packages/editor/src/themes/compat.css` — remove entire `--buildrick-control-*` block.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(ds-v1): INSPECTOR_TOKENS codemod + --buildrick-control-* migration"
```

- [ ] **Step 10: Codex review**

Create `/tmp/codex-ds-phase3-7-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3.7 — INSPECTOR_TOKENS codemod + --buildrick-control-* migration.

Verify:
1. `grep -rn 'INSPECTOR_TOKENS' packages/editor/src --include='*.ts' --include='*.tsx'` is EMPTY
2. `export const INSPECTOR_TOKENS` does NOT exist in controlStyles.ts
3. `grep -rnE 'var\(--buildrick-control-' packages/editor/src` is EMPTY
4. ColorInput.tsx, FontControls.tsx, SizeSection.tsx use getToken() helper (not getComputedStyle direct)
5. compat.css no longer has --buildrick-control-* block

If clean: "PHASE 3.7 CLEAN."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-7-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 3.7 findings" || true
```

### Task 3.8: Migrate `--buildrick-build-*` + Codex review

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-build-surface:buildrick-bg-panel' 'buildrick-build-card-hover:buildrick-bg-hover' 'buildrick-build-card:buildrick-bg-card' 'buildrick-build-border-hover:buildrick-border-strong' 'buildrick-build-border:buildrick-border'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + delete compat block + commit + Codex**

```bash
grep -rnE 'var\(--buildrick-build-' packages/editor/src || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate --buildrick-build-* aliases"
```

Codex review (same pattern).

### Task 3.9: Migrate `--buildrick-ai-*` + Codex review

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-ai-active:buildrick-accent-pressed' 'buildrick-ai-hover:buildrick-accent-hover' 'buildrick-ai-light:buildrick-accent-tint' 'buildrick-ai-muted:buildrick-accent-subtle'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + delete compat block + commit + Codex**

```bash
grep -rnE 'var\(--buildrick-ai-' packages/editor/src || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate --buildrick-ai-* to accent variants"
```

Codex review.

### Task 3.10a: Migrate `--buildrick-design-radius-*` chrome consumers (149 sites) + Codex review

- [ ] **Step 1: Rename in chrome dirs ONLY (preserve site-output code)**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-design-radius-full:buildrick-radius-full' 'buildrick-design-radius-xl:buildrick-radius-xl' 'buildrick-design-radius-lg:buildrick-radius-lg' 'buildrick-design-radius-md:buildrick-radius-md' 'buildrick-design-radius-sm:buildrick-radius-sm' 'buildrick-design-radius-none:buildrick-radius-sm'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

**NOTE:** Excludes `blocks/`, `templates/`, `shared/constants/defaultStyles.ts`, `features/design-system/utils/exportUtils.ts` — these generate user-site output and correctly use `--buildrick-design-*`.

- [ ] **Step 2: Verify chrome-scope has no --buildrick-design-radius-***

```bash
grep -rnE 'var\(--buildrick-design-radius-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui || echo 'CLEAN'
```

- [ ] **Step 3: Visual + Playwright + commit + Codex**

```bash
cd packages/editor && npm run dev &
sleep 5
# Verify buttons, modals, popovers render with correct radius
pkill -f vite
npx playwright test tests/visual/ds-baselines.spec.ts

git add -A
git commit -m "refactor(ds-v1): migrate 149 chrome --buildrick-design-radius-* → --buildrick-radius-*"
```

Codex review prompt:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3.10a — --buildrick-design-radius-* chrome migration.

Verify:
1. `grep -rnE 'var\(--buildrick-design-radius-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui` is EMPTY
2. `grep -rnE 'var\(--buildrick-design-radius-' packages/editor/src/blocks packages/editor/src/templates packages/editor/src/shared/constants/defaultStyles.ts` still has uses (site-output code untouched, correct)

If clean: "PHASE 3.10a CLEAN."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-10a-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 3.10a findings" || true
```

### Task 3.10b: Migrate `--buildrick-design-space-*` chrome consumers (47 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-design-space-12:buildrick-space-12' 'buildrick-design-space-10:buildrick-space-10' 'buildrick-design-space-8:buildrick-space-8' 'buildrick-design-space-6:buildrick-space-6' 'buildrick-design-space-5:buildrick-space-5' 'buildrick-design-space-4:buildrick-space-4' 'buildrick-design-space-3:buildrick-space-3' 'buildrick-design-space-2:buildrick-space-2' 'buildrick-design-space-1:buildrick-space-1'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + Playwright + commit + Codex (same pattern as 3.10a)**

```bash
grep -rnE 'var\(--buildrick-design-space-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate 47 chrome --buildrick-design-space-* → --buildrick-space-*"
```

### Task 3.10c: Migrate `--buildrick-design-font-size-*` chrome consumers (32 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-design-font-size-4xl:buildrick-text-4xl' 'buildrick-design-font-size-3xl:buildrick-text-3xl' 'buildrick-design-font-size-2xl:buildrick-text-2xl' 'buildrick-design-font-size-xl:buildrick-text-xl' 'buildrick-design-font-size-lg:buildrick-text-lg' 'buildrick-design-font-size-base:buildrick-text-md' 'buildrick-design-font-size-sm:buildrick-text-sm' 'buildrick-design-font-size-xs:buildrick-text-xs'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + Playwright + commit + Codex**

```bash
git add -A && git commit -m "refactor(ds-v1): migrate 32 chrome --buildrick-design-font-size-* → --buildrick-text-*"
```

### Task 3.10d: Migrate `--buildrick-design-color-error` chrome consumers (17 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' 's/var(--buildrick-design-color-error)/var(--buildrick-error)/g'
```

- [ ] **Step 2: Verify + commit + Codex**

```bash
grep -rnE 'var\(--buildrick-design-color-error' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate 17 chrome --buildrick-design-color-error → --buildrick-error"
```

### Task 3.10e: Migrate `--buildrick-design-font-mono` chrome consumers (10 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' 's/var(--buildrick-design-font-mono)/var(--buildrick-font-family-mono)/g'
```

- [ ] **Step 2: Verify + commit + Codex**

```bash
grep -rnE 'var\(--buildrick-design-font-mono\)' packages/editor/src/editor packages/editor/src/shared/ui || echo 'CLEAN'
git add -A && git commit -m "refactor(ds-v1): migrate 10 chrome --buildrick-design-font-mono → --buildrick-font-family-mono"
```

### Task 3.10f: Migrate `--buildrick-design-shadow-*` chrome consumers (8 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
for mapping in 'buildrick-design-shadow-xl:buildrick-shadow-xl' 'buildrick-design-shadow-lg:buildrick-shadow-lg' 'buildrick-design-shadow-md:buildrick-shadow-md' 'buildrick-design-shadow-sm:buildrick-shadow-sm'; do
  FROM="${mapping%%:*}"
  TO="${mapping##*:}"
  find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/components packages/editor/src/features/design-system/ui -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' "s/var(--${FROM})/var(--${TO})/g"
done
```

- [ ] **Step 2: Verify + commit + Codex**

```bash
git add -A && git commit -m "refactor(ds-v1): migrate 8 chrome --buildrick-design-shadow-* → --buildrick-shadow-*"
```

### Task 3.10g: Migrate `--buildrick-design-input-border` chrome consumers (2 sites) + Codex

- [ ] **Step 1: Rename**

```bash
cd /Users/shahg/Desktop/pencil/buildrik
find packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms -type f \( -name '*.css' -o -name '*.tsx' -o -name '*.ts' \) -print0 | xargs -0 sed -i '' 's/var(--buildrick-design-input-border)/var(--buildrick-border-medium)/g'
```

- [ ] **Step 2: Verify + commit + Codex**

```bash
git add -A && git commit -m "refactor(ds-v1): migrate 2 chrome --buildrick-design-input-border → --buildrick-border-medium"
```

### Task 3.11: Replace inline hex in chrome dirs + Codex review

**Files:** ~228 sites across chrome dirs (manual per-site)

- [ ] **Step 1: Identify sites with strict regex**

Create `packages/editor/scripts/find-inline-hex.mjs`:

```js
#!/usr/bin/env node
/**
 * Find inline hex colors in chrome directories.
 * Pure fs walk — no shell spawn.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(__dirname, "../src/editor"),
  path.resolve(__dirname, "../src/shared/ui"),
  path.resolve(__dirname, "../src/shared/forms"),
  path.resolve(__dirname, "../src/ai"),
  path.resolve(__dirname, "../src/features/design-system/ui"),
];

const HEX_STYLE = /(background|color|backgroundColor|borderColor|boxShadow):\s*["'`]?#[0-9A-Fa-f]{3,8}/;

function walk(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, collected);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      collected.push(full);
    }
  }
  return collected;
}

let totalSites = 0;
for (const root of ROOTS) {
  const files = walk(root);
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      if (HEX_STYLE.test(line)) {
        console.log(`${file}:${i + 1}: ${line.trim()}`);
        totalSites++;
      }
    });
  }
}

console.log(`\nTotal inline hex sites in chrome: ${totalSites}`);
```

```bash
node packages/editor/scripts/find-inline-hex.mjs > /tmp/inline-hex-chrome.txt
tail -5 /tmp/inline-hex-chrome.txt
# Expected: "Total inline hex sites in chrome: ~228" (or similar)
```

- [ ] **Step 2: Replace per-site (manual, batched by subdirectory)**

For each line in `/tmp/inline-hex-chrome.txt`, determine the token equivalent. Common mappings:

| Hex value | Target token |
|---|---|
| `#F8FAFC` | `var(--buildrick-bg-panel)` |
| `#FFFFFF` or `#fff` | `var(--buildrick-bg-card)` or `var(--buildrick-text-on-accent)` |
| `#0F172A` | `var(--buildrick-text-primary)` |
| `#334155` | `var(--buildrick-text-secondary)` |
| `#64748B` | `var(--buildrick-text-muted)` or `var(--buildrick-border)` |
| `#2D6DFF` | `var(--buildrick-accent)` |
| `#DC2626` or `#EF4444` | `var(--buildrick-error)` |
| `#16A34A` | `var(--buildrick-success)` |
| `#D97706` | `var(--buildrick-warning)` |

Work in batches by subdirectory. Commit per batch:

```bash
git add -A
git commit -m "refactor(ds-v1): replace inline hex in editor/inspector with tokens"
# ... per batch
```

- [ ] **Step 3: Verify zero chrome hex (with documented exceptions)**

```bash
node packages/editor/scripts/find-inline-hex.mjs | grep -v '@lint-hex-policy'
# Expected: ~0 remaining (exceptions with policy comment OK)
```

- [ ] **Step 4: Codex review (full Phase 3)**

Create `/tmp/codex-ds-phase3-final-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 3 completion — all consumer migration done.

All 8 spec §10 gates check:
1. No self-ref defs in DS files
2. No --buildrick-design-* defs outside design.css + features/design-system/
3. No --buildrick-design-* consumers in editor chrome (editor/, shared/ui/, shared/forms/, ai/, features/design-system/ui/)
4. No alias prefixes anywhere: --accent, --ls-*, --rail-*, --surface-*, --brand-*, --bar, --blue, --txt, --primary-*, --buildrick-control-*, --buildrick-build-*, --buildrick-ai-*
5. No --aqb-* or data-aqb-* survives
6. No duplicate keys within any DS file
7. No @media (prefers-*) outside a11y.css
8. No bare --accent, --buildrick-text, --buildrick-surface defs

If all 8 pass: "PHASE 3 COMPLETE — READY FOR PHASE 4."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase3-final-review.md)"
```

---

## Phase 4 — Delete `compat.css`

**Goal:** No alias layer. `default.css` = DS import only.

**Duration:** ~0.5 day

### Task 4.1: Pre-deletion gate verification

**Files:** None

- [ ] **Step 1: Run all 8 gates**

```bash
cd /Users/shahg/Desktop/pencil/buildrik

echo '=== Gate 1: self-ref ==='
grep -rE '^\s*(--buildrick-[a-z0-9-]+)\s*:\s*var\(\1' packages/editor/src/themes/design-system || echo 'CLEAN'

echo '=== Gate 2: design-* defs outside allowed ==='
grep -rE '^\s*--buildrick-design-' packages/editor/src --include='*.css' --exclude-dir=features | grep -v 'design-system/design.css' || echo 'CLEAN'

echo '=== Gate 3: design-* consumers in chrome ==='
grep -rnE 'var\(--buildrick-design-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui || echo 'CLEAN'

echo '=== Gate 4: alias prefixes (excluding compat.css self-def lines) ==='
grep -rE 'var\(--(accent|ls-|rail-|surface-|brand-|bar|blue|txt|primary-|buildrick-(control|build|ai)-)' packages/editor/src --exclude=compat.css || echo 'CLEAN'

echo '=== Gate 5: old --aqb-* ==='
grep -rE '(--aqb-|data-aqb-)' packages/editor/src --include='*.ts' --include='*.tsx' --include='*.css' || echo 'CLEAN'

echo '=== Gate 7: @media prefers outside a11y.css ==='
grep -rE '@media\s*\(prefers-' packages/editor/src --exclude='*a11y.css' || echo 'CLEAN'

echo '=== Gate 8: bare --accent/--buildrick-text/--buildrick-surface defs ==='
grep -rE '^\s*(--accent|--buildrick-text|--buildrick-surface)\s*:' packages/editor/src --include='*.css' || echo 'CLEAN'
```

All must print CLEAN (or empty). If any fails, return to Phase 3 for that family.

### Task 4.2: Delete compat.css

**Files:**
- Delete: `packages/editor/src/themes/compat.css`
- Modify: `packages/editor/src/themes/default.css`

- [ ] **Step 1: Delete compat.css**

```bash
rm packages/editor/src/themes/compat.css
```

- [ ] **Step 2: Update default.css**

```css
/**
 * themes/default.css
 * Buildrik DS V1 — public entry point
 * Phase 4: compat.css deleted. No alias layer remaining.
 * @license BSD-3-Clause
 */

@import "./design-system/index.css";
@import "./components.css";
```

- [ ] **Step 3: Full manual spot-check**

```bash
cd packages/editor && npm run dev &
sleep 5
```

Check each item:
- [ ] Editor loads, no console errors
- [ ] Topbar renders correctly
- [ ] Rail renders cobalt (not indigo, teal, black)
- [ ] All 6 sidebar tabs open
- [ ] Click block → selection ring cobalt
- [ ] Inspector opens, controls visible
- [ ] Design tab → change primary color → canvas updates
- [ ] Create page, add element, verify render
- [ ] Save project, reload, values restored

```bash
pkill -f vite
```

- [ ] **Step 4: Full Playwright suite**

```bash
cd packages/editor && npx playwright test tests/visual/ds-baselines.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(ds-v1): delete compat.css — Phase 4 complete"
```

### Task 4.3: Codex review — Phase 4

Create `/tmp/codex-ds-phase4-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 4 — compat.css deleted.

Verify:
1. `packages/editor/src/themes/compat.css` does NOT exist
2. `packages/editor/src/themes/default.css` imports only design-system/index.css + components.css
3. All 8 gates from spec §10 pass
4. Editor loads cleanly

If clean: "PHASE 4 COMPLETE."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase4-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 4 findings" || true
```

---

## Phase 5 — Token versioning runtime

**Goal:** Implement migration function, alias retention, published-CSS shim.

**Duration:** ~1 week

### Task 5.1: Migration framework

**Files:**
- Create: `packages/editor/src/features/design-system/migrations/index.ts`
- Create: `packages/editor/src/features/design-system/migrations/__tests__/index.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/features/design-system/migrations/__tests__/index.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../index";
import type { DesignToken } from "../../types";

describe("migrateDesignTokens", () => {
  it("CURRENT_SCHEMA_VERSION is 1 for DS V1", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
  });

  it("is no-op for same-version (V1 → V1)", () => {
    const tokens: DesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#FF0000",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    expect(migrateDesignTokens(tokens, 1, 1)).toEqual(tokens);
  });

  it("logs warning and returns unchanged when no migration defined", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tokens: DesignToken[] = [];
    const result = migrateDesignTokens(tokens, 1, 99);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No migration"));
    expect(result).toEqual(tokens);
    warn.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to fail**

```bash
cd packages/editor && npx vitest run src/features/design-system/migrations/__tests__/index.test.ts
# Expected: FAIL — module not found
```

- [ ] **Step 3: Implement framework**

Create `packages/editor/src/features/design-system/migrations/index.ts`:

```ts
/**
 * Buildrik DS V1 — Token migration framework.
 * See spec §9.
 * @license BSD-3-Clause
 */

import type { DesignToken } from "../types";

export const CURRENT_SCHEMA_VERSION = 1;

/**
 * Per-version migrations. Key = TARGET version.
 * V1 is baseline. Future entries: MIGRATIONS[2] = migrateV1toV2, etc.
 */
const MIGRATIONS: Record<number, (tokens: DesignToken[]) => DesignToken[]> = {
  // V1 is baseline.
};

/**
 * Apply migrations to bring tokens from fromVersion → toVersion.
 * Missing migrations log warning and pass through unchanged (should not happen
 * in production; indicates schema bump without migrator added).
 */
export function migrateDesignTokens(
  tokens: DesignToken[],
  fromVersion: number,
  toVersion: number,
): DesignToken[] {
  if (fromVersion >= toVersion) return tokens;

  let result = tokens;
  for (let v = fromVersion; v < toVersion; v++) {
    const target = v + 1;
    const migration = MIGRATIONS[target];
    if (!migration) {
      console.warn(
        `[ds] No migration from v${v} to v${target}; keeping tokens as-is.`,
      );
      continue;
    }
    result = migration(result);
  }
  return result;
}
```

- [ ] **Step 4: Run test to pass**

```bash
cd packages/editor && npx vitest run src/features/design-system/migrations/__tests__/index.test.ts
# Expected: PASS (3 tests)
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/features/design-system/migrations/
git commit -m "feat(ds-v1): add token migration framework"
```

### Task 5.2: Wire migration into TokenRegistryContext

**Files:**
- Modify: `packages/editor/src/features/design-system/state/TokenRegistryContext.tsx`

- [ ] **Step 1: Read current loader logic**

```bash
grep -n 'initialTokens\|localStorage\|storageKey' packages/editor/src/features/design-system/state/TokenRegistryContext.tsx
```

- [ ] **Step 2: Update loader to apply migrations + support versioned format**

Edit `TokenRegistryContext.tsx`. Around the `initialTokens = React.useMemo(...)` block (line ~64), replace with:

```tsx
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../migrations";

// Inside TokenRegistryProvider component:

const storageKey = `buildrick-design-tokens-${projectId ?? "default"}-v1`;

const initialTokens = React.useMemo((): DesignToken[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return DEFAULT_TOKENS;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_TOKENS;

    let tokens: DesignToken[];
    let storedVersion: number;

    if (Array.isArray(parsed)) {
      // Legacy array format — assume V1
      tokens = parsed as DesignToken[];
      storedVersion = 1;
    } else if (
      "schemaVersion" in parsed &&
      "tokens" in parsed &&
      Array.isArray((parsed as { tokens: unknown }).tokens)
    ) {
      tokens = (parsed as { tokens: DesignToken[] }).tokens;
      storedVersion = (parsed as { schemaVersion: number }).schemaVersion;
    } else {
      return DEFAULT_TOKENS;
    }

    if (storedVersion < CURRENT_SCHEMA_VERSION) {
      tokens = migrateDesignTokens(tokens, storedVersion, CURRENT_SCHEMA_VERSION);
    }

    return tokens.length > 0 ? tokens : DEFAULT_TOKENS;
  } catch {
    return DEFAULT_TOKENS;
  }
}, [storageKey]);
```

Find the save logic (where `localStorage.setItem(storageKey, ...)` is called) and update to write versioned format:

```tsx
// When persisting:
const versioned = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  tokens: tokensToSave,
};
localStorage.setItem(storageKey, JSON.stringify(versioned));
```

- [ ] **Step 3: Verify TS compiles**

```bash
cd packages/editor && npx tsc --noEmit
```

- [ ] **Step 4: Run editor, test save + reload cycle**

```bash
cd packages/editor && npm run dev &
sleep 5
# In browser:
# 1. Open Design tab
# 2. Change primary color to red
# 3. Save project (or auto-save)
# 4. Reload page
# 5. Verify color persists as red
pkill -f vite
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/src/features/design-system/state/TokenRegistryContext.tsx
git commit -m "feat(ds-v1): wire migration into TokenRegistryContext with versioned format"
```

### Task 5.3: Published-CSS compatibility shim

**Files:**
- Modify: `packages/editor/src/features/design-system/utils/exportUtils.ts`
- Create: `packages/editor/src/features/design-system/utils/__tests__/exportUtils.test.ts`

- [ ] **Step 1: Write failing test**

Create `packages/editor/src/features/design-system/utils/__tests__/exportUtils.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateCompatibilityShim } from "../exportUtils";

describe("generateCompatibilityShim", () => {
  it("returns empty string at V1 (no aliases needed — baseline)", () => {
    expect(generateCompatibilityShim(1)).toBe("");
  });

  it("returns empty string for unknown future version", () => {
    expect(generateCompatibilityShim(999)).toBe("");
  });
});
```

- [ ] **Step 2: Run test to fail**

```bash
cd packages/editor && npx vitest run src/features/design-system/utils/__tests__/exportUtils.test.ts
# Expected: FAIL — generateCompatibilityShim not exported
```

- [ ] **Step 3: Add exports**

Edit `packages/editor/src/features/design-system/utils/exportUtils.ts` — append:

```ts
/**
 * Generate CSS compatibility shim aliases for exported user sites.
 *
 * For each token deprecated in a prior version but within 2-version
 * retention, emit an alias line.
 *
 * V1 returns empty string — baseline, no deprecations yet.
 *
 * @license BSD-3-Clause
 */

interface AliasEntry {
  oldName: string;
  newName: string;
  deprecatedIn: number;
  removeIn: number;
}

const ALIAS_RETENTION: AliasEntry[] = [
  // Example for future (V2+):
  // {
  //   oldName: "--buildrick-design-color-primary",
  //   newName: "--buildrick-design-color-brand-primary",
  //   deprecatedIn: 2,
  //   removeIn: 4,
  // },
];

export function generateCompatibilityShim(fromVersion: number): string {
  const lines: string[] = [];
  for (const entry of ALIAS_RETENTION) {
    const inRetention = fromVersion >= entry.deprecatedIn && fromVersion < entry.removeIn;
    if (inRetention) {
      lines.push(`  ${entry.oldName}: var(${entry.newName});`);
    }
  }

  if (lines.length === 0) return "";

  return [
    "/* Buildrik DS compatibility aliases. 2-version retention policy. */",
    ":root {",
    ...lines,
    "}",
    "",
  ].join("\n");
}
```

- [ ] **Step 4: Run test to pass**

```bash
cd packages/editor && npx vitest run src/features/design-system/utils/__tests__/exportUtils.test.ts
# Expected: PASS (2 tests)
```

- [ ] **Step 5: Wire shim into CSS export**

Find the existing CSS export function in `exportUtils.ts` (search for "design-tokens.css" filename). Prepend the shim to output:

```ts
// In whatever function builds CSS output:
import { generateCompatibilityShim } from "./exportUtils";

const shim = generateCompatibilityShim(CURRENT_SCHEMA_VERSION);
const body = /* existing generation logic */;
const content = shim + body;
```

- [ ] **Step 6: Commit**

```bash
git add packages/editor/src/features/design-system/utils/
git commit -m "feat(ds-v1): published-CSS compatibility shim generator"
```

### Task 5.4: Codex review — Phase 5

Create `/tmp/codex-ds-phase5-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Review Phase 5 — token versioning runtime.

Verify:
1. `packages/editor/src/features/design-system/migrations/index.ts` exports CURRENT_SCHEMA_VERSION=1 and migrateDesignTokens
2. MIGRATIONS table empty (V1 baseline)
3. TokenRegistryContext handles legacy array + versioned format
4. Save writes versioned format ({schemaVersion, tokens})
5. exportUtils.generateCompatibilityShim returns "" at V1

Run:
- `cd packages/editor && npx vitest run src/features/design-system/migrations`
- `cd packages/editor && npx vitest run src/features/design-system/utils/__tests__/exportUtils.test.ts`

Critical: loading a project saved BEFORE DS V1 (legacy array format) must still work.

If clean: "PHASE 5 COMPLETE."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-phase5-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex Phase 5 findings" || true
```

---

## Phase 6 — Enable CI gates

**Goal:** All guards active.

**Duration:** ~0.5 day

### Task 6.1: Custom ESLint rule + enable overlay

**Files:**
- Create: `packages/editor/eslint-rules/no-inline-hex.js`
- Modify: `packages/editor/.eslintrc.buildrik-ds.js`
- Modify: main ESLint config (`.eslintrc.cjs` or equivalent)

- [ ] **Step 1: Write custom no-inline-hex rule**

Create `packages/editor/eslint-rules/no-inline-hex.js`:

```js
/**
 * ESLint rule: no-inline-hex
 * Forbids hex colors in style object literals within chrome directories.
 * Per-file override: /* @lint-hex-policy: site-generator *\/
 * @license BSD-3-Clause
 */

const HEX_PATTERN = /^["'`]?#[0-9A-Fa-f]{3,8}/;
const COLOR_PROPS = new Set([
  "background",
  "backgroundColor",
  "color",
  "borderColor",
  "boxShadow",
  "fill",
  "stroke",
]);

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow hardcoded hex in chrome inline styles" },
    schema: [{
      type: "object",
      properties: {
        chromeDirs: { type: "array", items: { type: "string" } },
        contentDirs: { type: "array", items: { type: "string" } },
      },
    }],
  },
  create(context) {
    const options = context.options[0] || {};
    const chromeDirs = options.chromeDirs || [];
    const contentDirs = options.contentDirs || [];
    const filename = context.getFilename();

    // Per-file override via comment
    const comments = context.getSourceCode().getAllComments();
    for (const c of comments) {
      if (c.value.includes("@lint-hex-policy:")) return {};
    }

    const inChrome = chromeDirs.some((d) => filename.includes(d));
    const inContent = contentDirs.some((d) => filename.includes(d));
    if (!inChrome || inContent) return {};

    return {
      Property(node) {
        const keyName = node.key.name || node.key.value;
        if (typeof keyName !== "string" || !COLOR_PROPS.has(keyName)) return;

        const value = node.value;
        if (
          value.type === "Literal" &&
          typeof value.value === "string" &&
          HEX_PATTERN.test(value.value)
        ) {
          context.report({
            node,
            message:
              "Inline hex forbidden in chrome. Use var(--buildrick-*). Override with /* @lint-hex-policy: site-generator */ for site-output files.",
          });
        }
      },
    };
  },
};
```

- [ ] **Step 2: Enable overlay rules (flip off → error)**

Replace `packages/editor/.eslintrc.buildrik-ds.js`:

```js
/**
 * Buildrik DS V1 — ESLint overlay (active).
 * @license BSD-3-Clause
 */

module.exports = {
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{
        name: "../inspector/shared/controls/controlStyles",
        importNames: ["INSPECTOR_TOKENS"],
        message: "INSPECTOR_TOKENS deprecated. Use var(--buildrick-*) or getToken().",
      }],
    }],
    "no-restricted-syntax": ["error", {
      selector: "CallExpression[callee.property.name='getPropertyValue'][arguments.0.value=/^--buildrick-/]",
      message: "Use getToken(name) instead of getPropertyValue. See DS V1 spec §6.",
    }],
  },
};
```

- [ ] **Step 3: Wire custom rule into main ESLint config**

Read main config:

```bash
ls packages/editor/.eslintrc* packages/editor/eslint.config.* 2>/dev/null
```

Add to main config (pattern may vary — adapt):

```js
// In packages/editor/.eslintrc.cjs or equivalent:
module.exports = {
  // ... existing ...
  rules: {
    // ... existing ...
    "buildrick-ds/no-inline-hex": ["error", {
      chromeDirs: [
        "packages/editor/src/editor/",
        "packages/editor/src/shared/ui/",
        "packages/editor/src/shared/forms/",
        "packages/editor/src/ai/",
        "packages/editor/src/features/design-system/ui/",
      ],
      contentDirs: [
        "packages/editor/src/blocks/",
        "packages/editor/src/templates/",
      ],
    }],
  },
  overrides: [
    {
      files: ["packages/editor/src/**/*.{ts,tsx}"],
      extends: ["./.eslintrc.buildrik-ds.js"],
    },
  ],
};
```

- [ ] **Step 4: Run ESLint**

```bash
cd packages/editor && npx eslint src --max-warnings 0
# Expected: passes (or reveals final violations to fix)
```

- [ ] **Step 5: Commit**

```bash
git add packages/editor/eslint-rules/ packages/editor/.eslintrc*
git commit -m "feat(ds-v1): enable ESLint rules for no-inline-hex + INSPECTOR_TOKENS ban"
```

### Task 6.2: Grep gates in CI script

**Files:**
- Create: `packages/editor/scripts/ds-grep-gates.sh`
- Modify: `packages/editor/package.json`

- [ ] **Step 1: Create grep-gates script**

Create `packages/editor/scripts/ds-grep-gates.sh`:

```bash
#!/usr/bin/env bash
# DS V1 CI grep gates.
# See spec §10.

set -e
cd "$(dirname "$0")/../../.."

fail() { echo "GATE FAIL: $1"; exit 1; }

echo "Gate 1: self-ref defs"
if grep -rE '^\s*(--buildrick-[a-z0-9-]+)\s*:\s*var\(\1' packages/editor/src/themes/design-system > /dev/null 2>&1; then
  fail "self-referential CSS var def"
fi

echo "Gate 2: design-* defs outside allowed"
LEAK=$(grep -rE '^\s*--buildrick-design-' packages/editor/src --include='*.css' 2>/dev/null | grep -v 'design-system/design.css' || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "design-* def outside allowed"; }

echo "Gate 3: design-* consumed by chrome"
LEAK=$(grep -rnE 'var\(--buildrick-design-' packages/editor/src/editor packages/editor/src/shared/ui packages/editor/src/shared/forms packages/editor/src/ai packages/editor/src/features/design-system/ui 2>/dev/null || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "design-* in chrome"; }

echo "Gate 4: alias-layer consumers"
LEAK=$(grep -rE 'var\(--(accent|ls-|rail-|surface-|brand-|bar|blue|txt|primary-|buildrick-(control|build|ai)-)' packages/editor/src 2>/dev/null || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "alias-layer consumer"; }

echo "Gate 5: old --aqb-*/data-aqb-*"
LEAK=$(grep -rE '(--aqb-|data-aqb-)' packages/editor/src --include='*.ts' --include='*.tsx' --include='*.css' 2>/dev/null || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "old --aqb-* found"; }

echo "Gate 6: duplicate keys in DS files"
for f in packages/editor/src/themes/design-system/*.css; do
  DUPS=$(awk '/^\s*--buildrick-/ {match($0,/--buildrick-[a-z0-9-]+/); print substr($0,RSTART,RLENGTH)}' "$f" | sort | uniq -d || true)
  [ -z "$DUPS" ] || { echo "$f has dups: $DUPS"; fail "duplicate keys"; }
done

echo "Gate 7: @media prefers outside a11y.css"
LEAK=$(grep -rE '@media\s*\(prefers-' packages/editor/src --exclude='*a11y.css' 2>/dev/null || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "@media prefers outside a11y.css"; }

echo "Gate 8: bare deprecated defs"
LEAK=$(grep -rE '^\s*(--accent|--buildrick-text|--buildrick-surface)\s*:' packages/editor/src --include='*.css' 2>/dev/null || true)
[ -z "$LEAK" ] || { echo "$LEAK"; fail "bare deprecated def"; }

echo ""
echo "All 8 DS gates passed"
```

```bash
chmod +x packages/editor/scripts/ds-grep-gates.sh
```

- [ ] **Step 2: Test locally**

```bash
bash packages/editor/scripts/ds-grep-gates.sh
# Expected: "All 8 DS gates passed"
```

- [ ] **Step 3: Add npm scripts**

Edit `packages/editor/package.json`, add to `scripts`:

```json
{
  "scripts": {
    "lint": "eslint src --max-warnings 0",
    "lint:ds": "bash scripts/ds-grep-gates.sh",
    "verify": "npm run lint && npm run lint:ds && npx tsc --noEmit"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/editor/scripts/ds-grep-gates.sh packages/editor/package.json
git commit -m "feat(ds-v1): wire 8 grep gates + verify script"
```

### Task 6.3: Verify CI blocks violations

**Files:** None (temporary test only)

- [ ] **Step 1: Introduce violation**

Temporarily add `var(--ls-bg-panel)` to any chrome CSS file.

- [ ] **Step 2: Run verify**

```bash
cd packages/editor && npm run verify
# Expected: FAIL with "alias-layer consumer"
```

- [ ] **Step 3: Revert**

```bash
git checkout -- packages/editor/src
```

- [ ] **Step 4: Re-verify**

```bash
cd packages/editor && npm run verify
# Expected: all pass
```

### Task 6.4: Final Codex review — DS V1 complete

Create `/tmp/codex-ds-final-review.md`:

```markdown
IMPORTANT: Do NOT read ~/.claude/, .claude/skills/, agents/.

Final review — Buildrik DS V1 complete across all 6 phases.

Verify:
1. 11 DS files in packages/editor/src/themes/design-system/
2. default.css is thin (~15 lines, just imports)
3. compat.css DELETED (not present)
4. shared/utils/tokens.ts has getToken()
5. shared/utils/token-names.ts has TokenName union
6. types/project.ts has designTokensSchemaVersion
7. features/design-system/migrations/index.ts with CURRENT_SCHEMA_VERSION=1
8. exportUtils has generateCompatibilityShim
9. ESLint rules active (no-inline-hex + INSPECTOR_TOKENS ban)
10. scripts/ds-grep-gates.sh passes
11. `npm run verify` exits 0

Answer:
- Is DS unified (no alias drift)?
- Could a new dev grasp architecture from spec + code?
- Is CI blocking future violations?
- Is versioning framework ready for future renames?

If all YES: "DS V1 COMPLETE. SHIP."
```

```bash
codex exec --sandbox workspace-write --cd /Users/shahg/Desktop/pencil/buildrik "$(cat /tmp/codex-ds-final-review.md)"
git add -u && git commit -m "fix(ds-v1): address Codex final findings" || true
```

---

## Phase 7 — Documentation updates

### Task 7.1: Update DESIGN.md

**Files:**
- Modify: `DESIGN.md`

- [ ] **Step 1: Append Token Public Contract section**

Add to `DESIGN.md`:

```markdown
## Token Public Contract (DS V1, 2026-04-19)

All `--buildrick-design-*` token names are part of Buildrik's public contract. They appear in:
- User project JSON (`settings.designTokens[].cssVar`)
- User's published site CSS output
- localStorage key `buildrick-design-tokens-${projectId}-v1`
- Exported `design-tokens.css` / `design-tokens.json` / `design-tokens.tailwind.js` files

Changing these names is a BREAKING change. Requires:
1. Schema version bump in `migrations/index.ts` (CURRENT_SCHEMA_VERSION)
2. Migration function in MIGRATIONS table
3. Alias retention for 2 major DS versions
4. Published-CSS compatibility shim
5. CHANGELOG entry with before/after mapping

Editor chrome tokens (`--buildrick-*` without `design-` prefix) are INTERNAL — may rename freely.

See: `docs/superpowers/specs/2026-04-19-buildrik-design-system-v1-design.md`
```

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add Token Public Contract section (DS V1)"
```

### Task 7.2: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md` (create if missing)

- [ ] **Step 1: Add DS V1 entry**

Prepend to `CHANGELOG.md`:

```markdown
## [DS V1] — 2026-04-19

### Added
- `themes/design-system/` directory with 11 focused token files
- `--buildrick-space-1..12`, `--buildrick-radius-sm..full`, `--buildrick-font-family-mono`
- `getToken(name)` helper + `TokenName` type union
- `designTokensSchemaVersion` field in project JSON
- Token migration framework (`features/design-system/migrations/`)
- Published-CSS compatibility shim generator
- ESLint `no-inline-hex` rule
- Playwright visual regression baselines

### Changed
- `themes/default.css` is now a thin aggregator (was 5152 lines, now ~15)
- Namespace invariant: `--buildrick-design-*` = SITE only; `--buildrick-*` = SHELL only
- 265 chrome consumers migrated off `--buildrick-design-*`
- INSPECTOR_TOKENS removed; consumers use Emotion styled() + var() or getToken()

### Removed
- 9 alias layers: `--accent`, `--ls-*`, `--rail-*`, `--surface-*`, `--brand-*`, `--bar/--blue/--txt`, `--primary-*`, `--buildrick-control-*`, `--buildrick-build-*`, `--buildrick-ai-*`
- 275 duplicate def lines from default.css
- 29 banned-value fallbacks from LeftRail.css
- 3 separate `@media (prefers-contrast: high)` blocks (consolidated)

### Migration
- V3 projects load unchanged (names preserved). Schema version 1.
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(ds-v1): CHANGELOG entry for DS V1 release"
```

---

## Completion criteria

- [ ] All 8 grep gates pass
- [ ] `npm run verify` exits 0
- [ ] Unit tests pass (tokens, migrations, exportUtils)
- [ ] Playwright visual regression within threshold
- [ ] Manual spot-check passes (spec §11 list)
- [ ] Codex reports "CLEAN" / "COMPLETE" for each phase
- [ ] DESIGN.md has Token Public Contract section
- [ ] CHANGELOG has DS V1 entry

---

## Self-review notes

**Spec coverage:** Every decision (1-7) and execution path mapped to tasks.

- Decision 1 (site/shell) → Phase 3.10 migration + gates 2/3
- Decision 2 (kill aliases) → Phases 3.1-3.9 + gate 4
- Decision 3 (--accent drain) → Task 3.3
- Decision 4 (a11y consolidation) → Task 1.10 + gate 7
- Decision 5 (intent+path lint) → Task 6.1
- Decision 6 (INSPECTOR_TOKENS codemod) → Task 3.7
- Decision 7 (versioning) → Phase 5

**Execution:** Aggregator pattern (Phase 2) + family-by-family (Phase 3) + compat deletion (Phase 4). No big-switch.

**Codex review after each phase** (Phase 0, 1, 2, each 3.x, 4, 5, final) per user request.

**Time budget:** 5-7 weeks solo. Phase 3 is 2-3 weeks (biggest chunk).
