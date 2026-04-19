# Theme Unification V3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename `aqb-*` prefix to `buildrick-*` across all surfaces (CSS vars, keyframes, classnames, data-attrs, storage keys, dev flags), split into a two-namespace system (`--buildrick-*` chrome + `--buildrick-design-*` runtime-mutated), and enforce "chrome never mutated at runtime" as a CI-verifiable invariant.

**Architecture:** P0 builds a mapping table + Node codemod. P2b deletes the `applyTheme()` runtime mutator so the invariant holds before consumer rename runs. P3 codemod does all automated renames across ~5000 touchpoints; manual edits handle namespace remaps + regex-reader semantics. P4 destroys old definitions + fixes DESIGN.md-violating token shadows. P6 extends the existing storage migration pattern. Three Codex gates (P1/P4/P8) block progress on verification failures.

**Tech Stack:** Node ≥18 (codemod script, stdlib only — no child_process / no deps), Vite 7 + React 18 (editor), Emotion CSS-in-JS, Vitest, TypeScript strict mode. The codemod uses pure string/regex processing; verifications block is human-rerun reference, not auto-executed.

**Base branch:** `main` (solo workflow — direct-to-main commits per CLAUDE.md preference)

**Spec reference:** `docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md` (commit 9dd518e, Codex Gate 1 PASS on rev 4)

**Source inventory:** `scripts/theme-v3-audit.json` v2.0

---

## Pre-flight

- [ ] **Confirm clean working tree.**

Run: `git status`
Expected: `nothing to commit, working tree clean` (no untracked/modified files in `packages/editor/` or `docs/`)

If not clean, stash/commit existing work before starting.

- [ ] **Confirm on main branch.**

Run: `git branch --show-current`
Expected: `main`

- [ ] **Confirm Node version.**

Run: `node --version`
Expected: `v18.x.x` or higher.

---

## Task 1: P0 — Codemod + mapping table skeleton

**Files:**
- Create: `scripts/theme-v3-codemod.mjs`
- Create: `scripts/theme-v3-mapping.json`
- Create: `scripts/theme-v3-codemod.test.mjs`

- [ ] **Step 1.1: Create mapping JSON skeleton.**

Create `scripts/theme-v3-mapping.json` with the 6-domain structure + empty stubs:

```json
{
  "_meta": {
    "version": "1.0",
    "generated": "2026-04-19",
    "spec": "docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md"
  },
  "css_vars": {
    "chrome_and_canvas_operational": {},
    "design_runtime": {},
    "delete": [],
    "undefined_decisions": {}
  },
  "keyframes": {},
  "data_attributes": {},
  "classnames": {},
  "storage_keys": {},
  "dev_flags": {
    "aqb:trace:": "buildrick:trace:"
  },
  "deletions": {
    "css_classes_constant": "shared/constants/config.ts CSS_CLASSES export",
    "dead_scope_rules": ["themes/default.css .aqb-editor", "themes/default.css .aqb-layout"],
    "pages_panel_overrides": "PagesTab.css:2179-2214 .pages-panel dark overrides (DESIGN.md violation)",
    "canvas_dark_shim": "components/Canvas/Canvas.css DARK_THEME_SHIM values (file kept, values corrected)",
    "theme_scaffolding_p2b": [
      "themes/index.ts (entire file)",
      "src/index.ts:75 applyTheme/defaultTheme re-export",
      "demo/main.tsx:11 import",
      "demo/main.tsx:21 applyTheme() call",
      "shared/types/project.ts themeMode field",
      "storageKeys.ts THEME entry"
    ]
  },
  "manual_edits": {
    "category_b_1_namespace_remap": [],
    "category_b_2_regex_readers": [],
    "gate_1_flagged_auto_swap": []
  },
  "verifications": []
}
```

- [ ] **Step 1.2: Create codemod script skeleton (no child_process).**

Create `scripts/theme-v3-codemod.mjs`:

```js
#!/usr/bin/env node
// theme-v3-codemod: aqb-* → buildrick-* rename.
// Deleted in P8. See docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md.
// Pure stdlib — no child_process, no dependencies.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const MAPPING_PATH = 'scripts/theme-v3-mapping.json';
const DEFAULT_ROOTS = ['packages/editor/src', 'packages/editor/demo'];
const DOCS_ROOTS = [
  'packages/editor/src/docs',
  'packages/editor/src/project-documentation',
  'packages/editor/src/code-to-prd-output',
];

export function loadMapping() {
  return JSON.parse(readFileSync(MAPPING_PATH, 'utf8'));
}

export function walkFiles(roots, exts) {
  const out = [];
  for (const root of roots) {
    const queue = [root];
    while (queue.length) {
      const dir = queue.shift();
      try {
        for (const name of readdirSync(dir)) {
          if (name === 'node_modules' || name === 'dist' || name === '.git') continue;
          const full = join(dir, name);
          const st = statSync(full);
          if (st.isDirectory()) queue.push(full);
          else if (exts.includes(extname(name))) out.push(full);
        }
      } catch { /* root doesn't exist — skip */ }
    }
  }
  return out;
}

const mode = process.argv[2] || 'dry-run';

if (mode === 'dry-run') runDryRun();
else if (mode === '--verify') runVerify();
else if (mode === '--apply') runApply();
else if (mode === '--docs') runDocsSweep();
else {
  console.error('Usage: node theme-v3-codemod.mjs [dry-run|--verify|--apply|--docs]');
  process.exit(2);
}

export function runDryRun() { console.log('TODO: Task 3+'); }
export function runVerify() { console.log('TODO: Task 5'); }
export function runApply() { console.log('TODO: Task 5'); }
export function runDocsSweep() { console.log('TODO: Task 10'); }
```

- [ ] **Step 1.3: Create test file skeleton.**

Create `scripts/theme-v3-codemod.test.mjs`:

```js
// Run: node --test scripts/theme-v3-codemod.test.mjs
import { test } from 'node:test';
import assert from 'node:assert';

test('codemod module loads without error', async () => {
  await import('./theme-v3-codemod.mjs');
  assert.ok(true);
});
```

- [ ] **Step 1.4: Verify scripts are runnable.**

Run:
```bash
node scripts/theme-v3-codemod.mjs dry-run
```

Expected: `TODO: Task 3+`

Run:
```bash
node --test scripts/theme-v3-codemod.test.mjs
```

Expected: `1 passing`

- [ ] **Step 1.5: Commit.**

```bash
git add scripts/theme-v3-codemod.mjs scripts/theme-v3-codemod.test.mjs scripts/theme-v3-mapping.json
git commit -m "feat(theme-v3): P0 scaffold — codemod script + mapping table skeleton

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: P0 — Populate mapping table via grep (all 6 domains)

**Files:**
- Modify: `scripts/theme-v3-mapping.json`

Every verification command's output is captured in the `verifications` block as a claim-output pair. The codemod does NOT re-run these; they're reference for humans to re-run at Codex gates.

- [ ] **Step 2.1: Enumerate css_vars consumers via grep.**

```bash
grep -rhoE "var\(--aqb-[a-z0-9-]+" packages/editor/src/ packages/editor/demo/ | sort -u | sed 's/var(//' > /tmp/aqb-consumers.txt
grep -rhoE "var\(--ls-[a-z0-9-]+" packages/editor/src/ packages/editor/demo/ | sort -u | sed 's/var(//' > /tmp/ls-consumers.txt
grep -rhoE "var\(--accent[a-z0-9-]*" packages/editor/src/ packages/editor/demo/ | sort -u | sed 's/var(//' > /tmp/accent-consumers.txt
wc -l /tmp/aqb-consumers.txt /tmp/ls-consumers.txt /tmp/accent-consumers.txt
```

Expected: ~300 aqb, ~40 ls, ~7 accent.

For each token, decide target `--buildrick-*` name per spec Q2 (fold --accent-*) + Q14 (undefined decisions). Write entries into `scripts/theme-v3-mapping.json` under `css_vars.chrome_and_canvas_operational`. Example:

```json
{
  "--aqb-primary": "--buildrick-accent",
  "--aqb-primary-hover": "--buildrick-accent-hover",
  "--aqb-primary-active": "--buildrick-accent-pressed",
  "--aqb-primary-light": "--buildrick-accent-subtle",
  "--aqb-primary-subtle": "--buildrick-accent-tint",
  "--accent": "--buildrick-accent",
  "--accent-hover": "--buildrick-accent-hover",
  "--accent-pressed": "--buildrick-accent-pressed",
  "--accent-tint": "--buildrick-accent-tint",
  "--accent-subtle": "--buildrick-accent-subtle",
  "--accent-on": "--buildrick-accent-on",
  "--accent-glow": "--buildrick-accent-glow",
  "--ls-accent": "--buildrick-accent",
  "--aqb-text-primary": "--buildrick-text",
  "--aqb-text-muted": "--buildrick-text-muted",
  "--aqb-text-secondary": "--buildrick-text-muted",
  "--ls-text-subtle": "--buildrick-text-muted",
  "--ls-text-lighter": "--buildrick-text-muted",
  "--aqb-bg-card": "--buildrick-surface",
  "--aqb-bg-panel": "--buildrick-bg-panel",
  "--aqb-bg-panel-secondary": "--buildrick-bg-panel-secondary",
  "--aqb-border": "--buildrick-border"
}
```

Rule (R1 mitigation): if two tokens' computed values differ by more than `#e0e0e0` perceptual threshold, do NOT merge — split into distinct `--buildrick-*` names.

Repeat for every token in the grep output. At the end, `wc -l` of the chrome_and_canvas_operational entries should be ~300.

- [ ] **Step 2.2: Populate css_vars.design_runtime (for --buildrick-design-* namespace).**

Read `packages/editor/src/features/design-system/constants.ts` DEFAULT_TOKENS. For every `cssVar: "--aqb-X"` entry, add:

```json
{
  "--aqb-color-primary": "--buildrick-design-color-primary",
  "--aqb-color-secondary": "--buildrick-design-color-secondary",
  "--aqb-color-accent": "--buildrick-design-color-accent",
  "--aqb-color-background": "--buildrick-design-color-background",
  "--aqb-color-text": "--buildrick-design-color-text",
  "--aqb-color-muted": "--buildrick-design-color-muted",
  "--aqb-color-border": "--buildrick-design-color-border",
  "--aqb-color-success": "--buildrick-design-color-success",
  "--aqb-color-error": "--buildrick-design-color-error",
  "--aqb-font-heading": "--buildrick-design-font-heading",
  "--aqb-font-body": "--buildrick-design-font-body",
  "--aqb-font-mono": "--buildrick-design-font-mono",
  "--aqb-font-size-xs": "--buildrick-design-font-size-xs",
  "--aqb-font-size-sm": "--buildrick-design-font-size-sm",
  "--aqb-font-size-base": "--buildrick-design-font-size-base",
  "--aqb-font-size-lg": "--buildrick-design-font-size-lg",
  "--aqb-font-size-xl": "--buildrick-design-font-size-xl",
  "--aqb-font-size-2xl": "--buildrick-design-font-size-2xl",
  "--aqb-font-size-3xl": "--buildrick-design-font-size-3xl",
  "--aqb-font-size-4xl": "--buildrick-design-font-size-4xl",
  "--aqb-space-1": "--buildrick-design-space-1",
  "--aqb-space-2": "--buildrick-design-space-2",
  "--aqb-space-3": "--buildrick-design-space-3",
  "--aqb-space-4": "--buildrick-design-space-4",
  "--aqb-space-5": "--buildrick-design-space-5",
  "--aqb-space-6": "--buildrick-design-space-6",
  "--aqb-space-8": "--buildrick-design-space-8",
  "--aqb-space-10": "--buildrick-design-space-10",
  "--aqb-space-12": "--buildrick-design-space-12",
  "--aqb-radius-none": "--buildrick-design-radius-none",
  "--aqb-radius-sm": "--buildrick-design-radius-sm",
  "--aqb-radius-md": "--buildrick-design-radius-md",
  "--aqb-radius-lg": "--buildrick-design-radius-lg",
  "--aqb-radius-xl": "--buildrick-design-radius-xl",
  "--aqb-radius-full": "--buildrick-design-radius-full",
  "--aqb-shadow-sm": "--buildrick-design-shadow-sm",
  "--aqb-shadow-md": "--buildrick-design-shadow-md",
  "--aqb-shadow-lg": "--buildrick-design-shadow-lg"
}
```

- [ ] **Step 2.3: Populate css_vars.undefined_decisions (Q14 case-by-case for 29 tokens).**

Per spec Section 3 Q14, each gets exactly one action. Example decisions:

```json
{
  "--ls-TOKEN": { "action": "delete-consumer", "reason": "comment-only placeholder in ComponentsTab.css:5" },
  "--aqb-type-base-size": { "action": "delete-consumer", "reason": "comment-only in FontControls.tsx:7" },
  "--aqb-text": { "action": "rename-to-existing", "target": "--buildrick-text" },
  "--aqb-surface": { "action": "define-new", "value": "#F8FAFC", "file": "themes/default.css" },
  "--aqb-surface-elevated": { "action": "define-new", "value": "#FFFFFF", "file": "themes/default.css" },
  "--aqb-surface-hover": { "action": "define-new", "value": "#F1F5F9", "file": "themes/default.css" },
  "--aqb-bg-input": { "action": "define-new", "value": "#FFFFFF", "file": "themes/default.css" },
  "--aqb-primary-dark": { "action": "rename-to-existing", "target": "--buildrick-accent-pressed" },
  "--aqb-secondary": { "action": "rename-to-existing", "target": "--buildrick-text-muted" },
  "--aqb-border-active": { "action": "rename-to-existing", "target": "--buildrick-accent" },
  "--aqb-danger": { "action": "rename-to-existing", "target": "--buildrick-design-color-error" },
  "--aqb-danger-bg": { "action": "define-new", "value": "#FEF2F2", "file": "themes/default.css" },
  "--aqb-danger-border": { "action": "rename-to-existing", "target": "--buildrick-design-color-error" },
  "--aqb-error-border": { "action": "rename-to-existing", "target": "--buildrick-design-color-error" },
  "--aqb-text-faint": { "action": "rename-to-existing", "target": "--buildrick-text-muted" },
  "--aqb-text-subtle": { "action": "rename-to-existing", "target": "--buildrick-text-muted" },
  "--aqb-text-on-color": { "action": "define-new", "value": "#FFFFFF", "file": "themes/default.css" },
  "--aqb-font-sans": { "action": "rename-to-existing", "target": "--buildrick-design-font-body" },
  "--aqb-accent-bg": { "action": "rename-to-existing", "target": "--buildrick-accent-tint" },
  "--aqb-accent-primary": { "action": "rename-to-existing", "target": "--buildrick-accent" },
  "--aqb-color-primary": { "action": "rename-to-existing", "target": "--buildrick-design-color-primary" },
  "--aqb-color-secondary": { "action": "rename-to-existing", "target": "--buildrick-design-color-secondary" },
  "--aqb-color-success": { "action": "rename-to-existing", "target": "--buildrick-design-color-success" },
  "--aqb-canvas-content": { "action": "define-new", "value": "transparent", "file": "components/Canvas/Canvas.css" },
  "--aqb-canvas-wrapper": { "action": "define-new", "value": "transparent", "file": "components/Canvas/Canvas.css" },
  "--aqb-primary-alpha-15": { "action": "define-new", "value": "rgba(45, 109, 255, 0.15)", "file": "themes/default.css" },
  "--aqb-primary-bg": { "action": "rename-to-existing", "target": "--buildrick-accent-tint" },
  "--aqb-tt-drawer-left": { "action": "define-new", "value": "0", "file": "themes/default.css" },
  "--aqb-tt-drawer-right": { "action": "define-new", "value": "0", "file": "themes/default.css" }
}
```

Before committing each decision: grep consumers to confirm the rename-to-existing target makes visual sense. Where uncertain, prefer `define-new` with a conservative value.

- [ ] **Step 2.4: Populate keyframes section.**

```bash
grep -rhoE "@keyframes aqb-[a-z0-9-]+" packages/editor/src/ | sed 's/@keyframes //' | sort -u
```

For each keyframe, add rename entry. Plus two orphan deletions (see `aqb-slide-down`, `aqb-bar-slide-up` per inventory):

```json
{
  "aqb-spin": "buildrick-spin",
  "aqb-fade-in": "buildrick-fade-in",
  "aqb-fade-out": "buildrick-fade-out",
  "aqb-modal-in": "buildrick-modal-in",
  "aqb-toast-in": "buildrick-toast-in",
  "aqb-toast-out": "buildrick-toast-out",
  "aqb-tooltip-in": "buildrick-tooltip-in",
  "aqb-popover-in": "buildrick-popover-in",
  "aqb-menu-in": "buildrick-menu-in",
  "aqb-float-in": "buildrick-float-in",
  "aqb-slide-up": "buildrick-slide-up",
  "aqb-pulse": "buildrick-pulse",
  "aqb-skeleton-pulse": "buildrick-skeleton-pulse",
  "aqb-skeleton-wave": "buildrick-skeleton-wave",
  "aqb-skeleton-shimmer": "buildrick-skeleton-shimmer",
  "aqb-success-flash": "buildrick-success-flash",
  "aqb-error-shake": "buildrick-error-shake",
  "aqb-status-pulse": "buildrick-status-pulse",
  "aqb-progress-slide": "buildrick-progress-slide",
  "aqb-stagger-fade-in": "buildrick-stagger-fade-in",
  "aqb-stagger-fade-in-x": "buildrick-stagger-fade-in-x",
  "aqb-stagger-scale-in": "buildrick-stagger-scale-in",
  "aqb-flash": "buildrick-flash",
  "aqb-element-flash": "buildrick-element-flash",
  "aqb-scale-in": "buildrick-scale-in",
  "aqb-fadeInCard": "buildrick-fadeInCard",
  "aqb-fadeInSlide": "buildrick-fadeInSlide",
  "aqb-toast-slide-up": "buildrick-toast-slide-up",
  "aqb-hint-fade-in": "buildrick-hint-fade-in",
  "aqb-panel-fade-in": "buildrick-panel-fade-in",
  "aqb-dot-pulse": "buildrick-dot-pulse",
  "aqb-sync-fade-in": "buildrick-sync-fade-in",
  "aqb-slide-down": { "action": "delete", "reason": "orphan — no @keyframes defined anywhere; 2 consumer callsites at QuickSwitcher.styles.ts:56 + CommandPalette.tsx:292" },
  "aqb-bar-slide-up": { "action": "delete", "reason": "orphan — no @keyframes defined anywhere; 1 consumer callsite at AIAssistantBar.tsx:190" }
}
```

Verify completeness:

```bash
grep -rhoE "@keyframes aqb-[a-z0-9-]+" packages/editor/src/ | sed 's/@keyframes //' | sort -u > /tmp/keyframes-defined.txt
grep -rhoE "animation(-name)?:\s*aqb-[a-z0-9-]+" packages/editor/src/ | grep -oE "aqb-[a-z0-9-]+" | sort -u > /tmp/keyframes-consumed.txt
comm -23 /tmp/keyframes-consumed.txt /tmp/keyframes-defined.txt
```

Expected: only `aqb-slide-down` + `aqb-bar-slide-up`. Anything else = mapping gap — add rename or delete entry.

- [ ] **Step 2.5: Populate data_attributes section (all 19).**

```bash
grep -rnoE "data-aqb-[a-z-]+" packages/editor/src/ packages/editor/demo/ | sed 's/.*:data-aqb-/data-aqb-/' | sort -u
```

Expected 19 entries. Add all:

```json
{
  "data-aqb-binding": "data-buildrick-binding",
  "data-aqb-canvas": "data-buildrick-canvas",
  "data-aqb-cms-bound": "data-buildrick-cms-bound",
  "data-aqb-component": "data-buildrick-component",
  "data-aqb-context-menu": "data-buildrick-context-menu",
  "data-aqb-drag-source": "data-buildrick-drag-source",
  "data-aqb-dropzone": "data-buildrick-dropzone",
  "data-aqb-editable": "data-buildrick-editable",
  "data-aqb-hidden": "data-buildrick-hidden",
  "data-aqb-hovered": "data-buildrick-hovered",
  "data-aqb-id": "data-buildrick-id",
  "data-aqb-ids": "data-buildrick-ids",
  "data-aqb-interactions": "data-buildrick-interactions",
  "data-aqb-locked": "data-buildrick-locked",
  "data-aqb-name": "data-buildrick-name",
  "data-aqb-root": "data-buildrick-root",
  "data-aqb-section": "data-buildrick-section",
  "data-aqb-selected": "data-buildrick-selected",
  "data-aqb-type": "data-buildrick-type"
}
```

- [ ] **Step 2.6: Populate classnames section (~550 entries).**

```bash
grep -rhoE "\.aqb-[a-z0-9-]+" packages/editor/src/ packages/editor/demo/ | sed 's/^\.//' | sort -u > /tmp/classnames.txt
wc -l /tmp/classnames.txt
cat /tmp/classnames.txt | awk '{ printf "  \"%s\": \"buildrick-%s\",\n", $0, substr($0, 5) }' > /tmp/classnames-json-stub.txt
head /tmp/classnames-json-stub.txt
```

Paste contents into `mapping.json` classnames section. Remove trailing comma on last line. Add two dead-rule deletions:

```json
{
  "aqb-editor": { "action": "delete-rule", "reason": "dead scope wrapper — NO React component applies this className" },
  "aqb-layout": { "action": "delete-rule", "reason": "dead scope wrapper" }
}
```

- [ ] **Step 2.7: Populate storage_keys section (~68 entries including dynamic families).**

```bash
grep -rhnE "['\"]aqb-[a-z0-9-]+['\"]" packages/editor/src/ packages/editor/demo/ | grep -oE "aqb-[a-z0-9-]+" | sort -u > /tmp/storage-keys.txt
wc -l /tmp/storage-keys.txt
```

For each, add rename. Plus:

```json
{
  "aqb-project": "buildrick-project",
  "aqb-autosave": "buildrick-autosave",
  "aqb-last-file": "buildrick-last-file",
  "aqb-preferences": "buildrick-preferences",
  "aqb-theme": { "action": "delete", "reason": "Y=B scaffolding deletion — themeMode feature not implemented" },
  "aqb-migration-v1-complete": { "action": "preserve", "reason": "precedent marker from aquibra→aqb migration; NOT ours to rename" },
  "aqb-nav-*": { "_dynamic": true, "template": "aqb-nav-${storageKey}", "target": "buildrick-nav-${storageKey}" },
  "aqb-layers-*": { "_dynamic": true, "template": "aqb-layers-${pageId}-{hidden|locked|names|expanded}", "target": "buildrick-layers-${pageId}-..." },
  "aqb-design-tokens-*": { "_dynamic": true, "template": "aqb-design-tokens-${projectId}-v1", "target": "buildrick-design-tokens-${projectId}-v1" }
}
```

Plus all the ~60 other plain keys from `/tmp/storage-keys.txt`.

- [ ] **Step 2.8: Populate manual_edits section.**

Write:

```json
{
  "category_b_1_namespace_remap": [
    { "file": "packages/editor/src/features/design-system/types.ts", "line": 73, "from": "`--aqb-${id}`", "to": "`--buildrick-design-${id}`", "context": "tokenToCssVar helper" },
    { "file": "packages/editor/src/features/design-system/state/__tests__/useSpacingTokens.test.ts", "line": 22, "from": "`--aqb-${id}`", "to": "`--buildrick-design-${id}`", "context": "test fixture" },
    { "file": "packages/editor/src/features/design-system/utils/exportUtils.ts", "line": 15, "from": "`--aqb-color-${name}`", "to": "`--buildrick-design-color-${name}`", "context": "color generator" }
  ],
  "category_b_2_regex_readers": [
    { "file": "packages/editor/src/features/design-system/state/useTokenUsageMap.ts", "line": 32, "from": "/^var\\(--aqb-/", "to": "/^var\\(--buildrick-design-/", "reason": "design-token matcher" },
    { "file": "packages/editor/src/features/design-system/state/useTokenUsageMap.ts", "line": 36, "from": "/^var\\((--aqb-[^)]+)\\)/", "to": "/^var\\((--buildrick-design-[^)]+)\\)/", "reason": "design-token extractor" },
    { "file": "packages/editor/src/features/design-system/state/useTokenUsageMap.ts", "line": 73, "from": "cssVar.replace(/^--aqb-/, \"\")", "to": "cssVar.replace(/^--buildrick-design-/, \"\")", "reason": "token-id extraction" },
    { "file": "packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx", "line": 37, "from": "/^var\\(--aqb-/", "to": "/^var\\(--buildrick-design-/", "reason": "color-picker design-token check" },
    { "file": "packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx", "line": 49, "from": "/^var\\((--aqb-[^)]+)\\)$/", "to": "/^var\\((--buildrick-design-[^)]+)\\)$/", "reason": "color-picker design-token extract" },
    { "file": "packages/editor/src/editor/inspector/shared/controls/InputControls.tsx", "line": 152, "from": "/^var\\(--aqb-/", "to": "/^var\\(--buildrick-design-/", "reason": "verify semantic target in P0" },
    { "file": "packages/editor/src/editor/inspector/shared/controls/InputControls.tsx", "line": 157, "from": "/^var\\((--aqb-[^)]+)\\)$/", "to": "/^var\\((--buildrick-design-[^)]+)\\)$/", "reason": "same" },
    { "file": "packages/editor/src/editor/inspector/sections/typography/FontControls.tsx", "line": 40, "from": "/^var\\(--aqb-/", "to": "/^var\\(--buildrick-design-/", "reason": "design-namespace target" },
    { "file": "packages/editor/src/editor/inspector/sections/SizeSection.tsx", "line": 21, "from": "/^var\\(--aqb-/", "to": "/^var\\(--buildrick-design-/", "reason": "design-namespace target" },
    { "file": "packages/editor/src/editor/inspector/shared/TokenPickerPopover.tsx", "line": 57, "note": "Read file at P0, fill exact from/to — Codex caught this site" }
  ],
  "gate_1_flagged_auto_swap": [
    { "file": "packages/editor/src/shared/types/animations.ts", "line": 116, "pattern": "`aqb-${config.type}`", "concern": "verify @keyframes buildrick-${type} exists post-P2" },
    { "file": "packages/editor/src/engine/elements/ElementOperations.ts", "line": 223, "pattern": "`aqb-${config.type}`", "concern": "same" },
    { "file": "packages/editor/src/editor/inspector/sections/registry.tsx", "line": 562, "pattern": "`aqb-${anim.type} ${anim.duration}ms ${anim.easing} ${anim.delay}ms 1 normal forwards`", "concern": "multi-interpolation shorthand" },
    { "file": "packages/editor/src/editor/sidebar/shared/usePanelNavigation.ts", "line": 78, "pattern": "`aqb-nav-${storageKey}`", "concern": "migration shim dynamic loop covers this family" },
    { "file": "packages/editor/src/editor/sidebar/shared/usePanelNavigation.ts", "line": 96, "pattern": "`aqb-nav-${storageKey}`", "concern": "same" },
    { "file": "packages/editor/src/editor/panels/layers/hooks/layersPersistence.ts", "line": 22, "pattern": "`aqb-layers-${pageId}-hidden` + -locked + -names + -expanded (4 callsites)", "concern": "migration shim dynamic loop covers this family" },
    { "file": "packages/editor/src/shared/utils/devLogger.ts", "line": 85, "pattern": "`aqb:trace:${domain}` (4 callsites: 85, 172, 179, 195)", "concern": "verify no aqb:trace: literal elsewhere" }
  ]
}
```

- [ ] **Step 2.9: Populate verifications block with captured grep outputs.**

For each SSOT claim in spec Section 3:

```bash
# Capture each command's output manually and paste into mapping
grep -rnoE "data-aqb-[a-z-]+" packages/editor/src/ packages/editor/demo/ | sed 's/.*:data-aqb-/data-aqb-/' | sort -u > /tmp/data-attrs.txt
grep -rnE "setProperty\s*\(\s*['\"]--(aqb|ls|accent)-" packages/editor/src/ > /tmp/setproperty-hits.txt
grep -rE "import.*CSS_CLASSES|CSS_CLASSES\." packages/editor/src/ > /tmp/cssclasses-consumers.txt
```

Write the verifications block:

```json
{
  "verifications": [
    {
      "claim": "All data-aqb-* attrs enumerated (19, not 11 as DATA_ATTRIBUTES constant claims)",
      "command": "grep -rnoE 'data-aqb-[a-z-]+' packages/editor/src/ packages/editor/demo/ | sed 's/.*:data-aqb-/data-aqb-/' | sort -u",
      "captured_at": "2026-04-19",
      "captured_output_count": 19
    },
    {
      "claim": "setProperty('--aqb-*') only in themes/index.ts (deleted in P2b)",
      "command": "grep -rnE \"setProperty\\s*\\(\\s*['\\\"]--(aqb|ls|accent)-\" packages/editor/src/",
      "captured_output_count": 11,
      "captured_files": ["packages/editor/src/themes/index.ts"]
    },
    {
      "claim": "CSS_CLASSES orphan (zero real consumers — only re-export at index.ts:36)",
      "command": "grep -rE 'import.*CSS_CLASSES|CSS_CLASSES\\.' packages/editor/src/",
      "captured_output_count": 0
    },
    {
      "claim": "Template-literal aqb- hit count",
      "command": "grep -rnE \"\\`[^\\`]*aqb-[^\\`]*\\\\$\\{\" packages/editor/src/ packages/editor/demo/ | wc -l",
      "captured_output_count": 158
    }
  ]
}
```

These are human-rerun at Codex gates. Any count divergence = mapping is stale and must update before proceeding.

- [ ] **Step 2.10: Commit mapping table.**

```bash
git add scripts/theme-v3-mapping.json
git commit -m "feat(theme-v3): P0 mapping table — 6 domains populated from grep

- css_vars: ~300 chrome + 38 design_runtime + 29 undefined decisions
- keyframes: ~32 renames + 2 orphan deletes
- data_attributes: 19 attrs
- classnames: ~550 renames + 2 dead scope wrapper deletes
- storage_keys: ~68 renames + 3 dynamic key families
- manual_edits: 3 B.1 + 10 B.2 + 7 Gate-1-flagged
- verifications: SSOT claims captured

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: P0 — Codemod ops 1 + 1b (CSS variable renames)

**Files:**
- Modify: `scripts/theme-v3-codemod.mjs`
- Modify: `scripts/theme-v3-codemod.test.mjs`

- [ ] **Step 3.1: Write failing test for op 1.**

Append to `scripts/theme-v3-codemod.test.mjs`:

```js
import { applyOp1 } from './theme-v3-codemod.mjs';

test('op 1: var(--aqb-X) in CSS renames per mapping', () => {
  const mapping = {
    css_vars: {
      chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' },
      design_runtime: {}
    }
  };
  const input = `.foo { color: var(--aqb-primary); }`;
  assert.strictEqual(applyOp1(input, mapping), `.foo { color: var(--buildrick-accent); }`);
});

test('op 1: var() fallbacks preserved', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' }, design_runtime: {} } };
  const input = `.foo { color: var(--aqb-primary, #2d6dff); }`;
  assert.strictEqual(applyOp1(input, mapping), `.foo { color: var(--buildrick-accent, #2d6dff); }`);
});

test('op 1: unmapped aqb var aborts', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: {}, design_runtime: {} } };
  const input = `.foo { color: var(--aqb-unknown); }`;
  assert.throws(() => applyOp1(input, mapping), /unmapped/i);
});
```

- [ ] **Step 3.2: Run test, confirm failure.**

```bash
node --test scripts/theme-v3-codemod.test.mjs
```

Expected: 3 failures (applyOp1 not exported).

- [ ] **Step 3.3: Implement op 1.**

Add to `scripts/theme-v3-codemod.mjs` (before the `if (mode ===` block):

```js
export function applyOp1(content, mapping) {
  const csssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  return content.replace(/var\((--(?:aqb|ls|accent)-[a-z0-9-]+)(\s*,\s*[^)]+)?\)/g, (match, varName, fallback) => {
    const target = csssVars[varName];
    if (!target) throw new Error(`op1: unmapped CSS var ${varName}`);
    return `var(${target}${fallback || ''})`;
  });
}
```

- [ ] **Step 3.4: Run test, confirm pass.**

```bash
node --test scripts/theme-v3-codemod.test.mjs
```

Expected: `3 pass`.

- [ ] **Step 3.5: Write failing test for op 1b.**

```js
import { applyOp1b } from './theme-v3-codemod.mjs';

test('op 1b: plain JS string literal "--aqb-X" renames', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent' }, design_runtime: {} } };
  const input = `root.style.setProperty("--aqb-primary", merged.primary);`;
  assert.strictEqual(applyOp1b(input, mapping), `root.style.setProperty("--buildrick-accent", merged.primary);`);
});

test('op 1b: template literal with static var(--aqb-X) renames', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: { '--aqb-primary': '--buildrick-accent', '--aqb-success': '--buildrick-design-color-success' }, design_runtime: {} } };
  const input = 'const s = `linear-gradient(90deg, ${v}, var(--aqb-success), var(--aqb-primary))`;';
  const expected = 'const s = `linear-gradient(90deg, ${v}, var(--buildrick-design-color-success), var(--buildrick-accent))`;';
  assert.strictEqual(applyOp1b(input, mapping), expected);
});

test('op 1b: template literal with --aqb-${id} (namespace remap) NOT auto-rewritten', () => {
  const mapping = { css_vars: { chrome_and_canvas_operational: {}, design_runtime: {} } };
  const input = "const v = `--aqb-${id}`;";
  assert.strictEqual(applyOp1b(input, mapping), input);
});
```

- [ ] **Step 3.6: Run test, confirm failure.**

Expected: 3 new failures.

- [ ] **Step 3.7: Implement op 1b.**

```js
export function applyOp1b(content, mapping) {
  const cssVars = {
    ...mapping.css_vars.chrome_and_canvas_operational,
    ...mapping.css_vars.design_runtime,
  };
  // Match --aqb-X / --ls-X / --accent-X NOT immediately followed by ${ (those are Category B manual).
  return content.replace(
    /(--(?:aqb|ls|accent)-[a-z0-9-]+)(?!\$\{)/g,
    (match, varName) => {
      const target = cssVars[varName];
      if (!target) return match; // leave for abort detection in verify
      return target;
    }
  );
}
```

- [ ] **Step 3.8: Run all tests, confirm pass.**

```bash
node --test scripts/theme-v3-codemod.test.mjs
```

Expected: `6 pass`.

- [ ] **Step 3.9: Commit.**

```bash
git add scripts/theme-v3-codemod.mjs scripts/theme-v3-codemod.test.mjs
git commit -m "feat(theme-v3): codemod ops 1 + 1b — CSS var rename (CSS side + JS side)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: P0 — Codemod ops 2, 4, 5, 6, 7 (keyframes, data-attrs, classes, storage, dev-flags)

**Files:**
- Modify: `scripts/theme-v3-codemod.mjs`
- Modify: `scripts/theme-v3-codemod.test.mjs`

Each op follows TDD pattern. Commits after each passing op.

- [ ] **Step 4.1: Op 2 — keyframes rename + action:delete.**

Test (append to test file):

```js
import { applyOp2 } from './theme-v3-codemod.mjs';

test('op 2: @keyframes aqb-X renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('@keyframes aqb-spin { from {} to {} }', m), '@keyframes buildrick-spin { from {} to {} }');
});

test('op 2: animation-name: aqb-X renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('.foo { animation-name: aqb-spin; }', m), '.foo { animation-name: buildrick-spin; }');
});

test('op 2: animation: aqb-X <rest> renames', () => {
  const m = { keyframes: { 'aqb-spin': 'buildrick-spin' } };
  assert.strictEqual(applyOp2('.foo { animation: aqb-spin 200ms ease; }', m), '.foo { animation: buildrick-spin 200ms ease; }');
});

test('op 2: action:delete removes animation-name property line', () => {
  const m = { keyframes: { 'aqb-slide-down': { action: 'delete' } } };
  const input = '.foo {\n  color: red;\n  animation-name: aqb-slide-down;\n  padding: 4px;\n}';
  const expected = '.foo {\n  color: red;\n  padding: 4px;\n}';
  assert.strictEqual(applyOp2(input, m), expected);
});

test('op 2: multi-animation shorthand with orphan aborts', () => {
  const m = { keyframes: { 'aqb-slide-down': { action: 'delete' } } };
  const input = '.foo { animation: aqb-slide-down 200ms, other-live 100ms; }';
  assert.throws(() => applyOp2(input, m), /multi-animation/i);
});
```

Run: expect 5 failures.

Implementation:

```js
export function applyOp2(content, mapping) {
  let out = content;
  for (const [oldName, target] of Object.entries(mapping.keyframes)) {
    if (typeof target === 'string') {
      out = out.replace(new RegExp(`@keyframes\\s+${oldName}\\b`, 'g'), `@keyframes ${target}`);
      out = out.replace(new RegExp(`animation-name:\\s*${oldName}\\b`, 'g'), `animation-name: ${target}`);
      out = out.replace(new RegExp(`(animation:\\s*)${oldName}\\b`, 'g'), `$1${target}`);
    } else if (target && target.action === 'delete') {
      // Abort first on multi-animation shorthand
      const multi = new RegExp(`animation:\\s*${oldName}[^;]*,|,\\s*${oldName}\\b`);
      if (multi.test(out)) {
        throw new Error(`op2: multi-animation shorthand contains orphan ${oldName} — manual review required`);
      }
      out = out.replace(new RegExp(`^\\s*animation-name:\\s*${oldName}\\s*;\\s*\\n`, 'gm'), '');
      out = out.replace(new RegExp(`^\\s*animation:\\s*${oldName}[^,;]*;\\s*\\n`, 'gm'), '');
    }
  }
  return out;
}
```

Run: expect 5 pass. Commit: `feat(theme-v3): codemod op 2 — keyframes`.

- [ ] **Step 4.2: Op 4 — data-aqb-* pattern-based rename.**

Test:

```js
import { applyOp4 } from './theme-v3-codemod.mjs';

test('op 4: data-aqb-X renames (CSS selector)', () => {
  const m = { data_attributes: { 'data-aqb-id': 'data-buildrick-id' } };
  assert.strictEqual(applyOp4('[data-aqb-id="foo"] { color: red; }', m), '[data-buildrick-id="foo"] { color: red; }');
});

test('op 4: data-aqb-X in JSX', () => {
  const m = { data_attributes: { 'data-aqb-canvas': 'data-buildrick-canvas' } };
  assert.strictEqual(applyOp4('<div data-aqb-canvas="true" />', m), '<div data-buildrick-canvas="true" />');
});

test('op 4: data-aqb-X in template literal static portion', () => {
  const m = { data_attributes: { 'data-aqb-id': 'data-buildrick-id' } };
  assert.strictEqual(applyOp4('const sel = `[data-aqb-id="${id}"]`;', m), 'const sel = `[data-buildrick-id="${id}"]`;');
});

test('op 4: unmapped data-aqb-X aborts', () => {
  const m = { data_attributes: {} };
  assert.throws(() => applyOp4('<div data-aqb-wtf />', m), /unmapped/i);
});
```

Implementation:

```js
export function applyOp4(content, mapping) {
  return content.replace(/data-aqb-[a-z-]+/g, (match) => {
    const target = mapping.data_attributes[match];
    if (!target) throw new Error(`op4: unmapped data attr ${match}`);
    return target;
  });
}
```

Run + commit: `feat(theme-v3): codemod op 4 — data attributes`.

- [ ] **Step 4.3: Op 5 — class name rename (CSS + JSX + template literal static).**

Test:

```js
import { applyOp5 } from './theme-v3-codemod.mjs';

test('op 5: .aqb-X CSS selector renames', () => {
  const m = { classnames: { 'aqb-canvas': 'buildrick-canvas' } };
  assert.strictEqual(applyOp5('.aqb-canvas { color: red; }', m), '.buildrick-canvas { color: red; }');
});

test('op 5: "aqb-X" JSX className renames', () => {
  const m = { classnames: { 'aqb-selected': 'buildrick-selected' } };
  assert.strictEqual(applyOp5('className="aqb-selected"', m), 'className="buildrick-selected"');
});

test('op 5: template literal static portion renames', () => {
  const m = { classnames: { 'aqb-element': 'buildrick-element' } };
  assert.strictEqual(applyOp5('const c = `aqb-element-${id}`;', m), 'const c = `buildrick-element-${id}`;');
});

test('op 5: action:delete-rule removes entire rule block', () => {
  const m = { classnames: { 'aqb-editor': { action: 'delete-rule' } } };
  const input = '.aqb-editor {\n  color: red;\n  padding: 4px;\n}\n.other { font: x; }';
  const result = applyOp5(input, m);
  assert.ok(!result.includes('.aqb-editor'));
  assert.ok(result.includes('.other'));
});
```

Implementation:

```js
export function applyOp5(content, mapping) {
  let out = content;
  // Rule-block deletions first
  for (const [name, val] of Object.entries(mapping.classnames)) {
    if (val && typeof val === 'object' && val.action === 'delete-rule') {
      const ruleRe = new RegExp(`\\.${name}[^{]*\\{[^}]*\\}\\s*`, 'g');
      out = out.replace(ruleRe, '');
    }
  }
  // Pattern rename
  out = out.replace(/\.?aqb-[a-z0-9-]+/g, (match) => {
    const hasDot = match.startsWith('.');
    const name = hasDot ? match.slice(1) : match;
    const target = mapping.classnames[name];
    if (!target) throw new Error(`op5: unmapped class ${name}`);
    if (typeof target === 'object') return match; // already deleted above
    return (hasDot ? '.' : '') + target;
  });
  return out;
}
```

Run + commit.

- [ ] **Step 4.4: Op 6 — storage keys + dynamic families.**

Test:

```js
import { applyOp6 } from './theme-v3-codemod.mjs';

test('op 6: "aqb-X" plain storage key renames', () => {
  const m = { storage_keys: { 'aqb-panel-state': 'buildrick-panel-state' } };
  assert.strictEqual(applyOp6('localStorage.getItem("aqb-panel-state")', m), 'localStorage.getItem("buildrick-panel-state")');
});

test('op 6: template literal static portion (aqb-nav-*)', () => {
  const m = { storage_keys: { 'aqb-nav-*': { _dynamic: true, template: 'aqb-nav-${storageKey}', target: 'buildrick-nav-${storageKey}' } } };
  assert.strictEqual(applyOp6('const k = `aqb-nav-${sk}`;', m), 'const k = `buildrick-nav-${sk}`;');
});

test('op 6: preserve marker skipped', () => {
  const m = { storage_keys: { 'aqb-migration-v1-complete': { action: 'preserve' } } };
  const input = 'localStorage.getItem("aqb-migration-v1-complete")';
  assert.strictEqual(applyOp6(input, m), input);
});
```

Implementation:

```js
export function applyOp6(content, mapping) {
  let out = content;
  for (const [key, val] of Object.entries(mapping.storage_keys)) {
    if (val && typeof val === 'object') {
      if (val.action === 'preserve' || val.action === 'delete') continue;
      if (val._dynamic) {
        const oldPrefix = key.replace(/-\*$/, '-');
        const newPrefix = val.target.replace(/\$\{.*$/, '');
        const re = new RegExp(`(["'\`])${oldPrefix}([^"'\`]*?)\\$\\{`, 'g');
        out = out.replace(re, `$1${newPrefix}$2\${`);
      }
      continue;
    }
    // Plain rename
    const re = new RegExp(`(["'\`])${key}\\1`, 'g');
    out = out.replace(re, `$1${val}$1`);
  }
  return out;
}
```

Run + commit.

- [ ] **Step 4.5: Op 7 — dev flag colon-prefix.**

Test:

```js
import { applyOp7 } from './theme-v3-codemod.mjs';

test('op 7: aqb:trace: prefix renames in plain strings', () => {
  const m = { dev_flags: { 'aqb:trace:': 'buildrick:trace:' } };
  assert.strictEqual(applyOp7('localStorage.getItem("aqb:trace:hover")', m), 'localStorage.getItem("buildrick:trace:hover")');
});

test('op 7: aqb:trace: in template literal static renames', () => {
  const m = { dev_flags: { 'aqb:trace:': 'buildrick:trace:' } };
  assert.strictEqual(applyOp7('const k = `aqb:trace:${domain}`;', m), 'const k = `buildrick:trace:${domain}`;');
});
```

Implementation:

```js
export function applyOp7(content, mapping) {
  let out = content;
  for (const [oldPrefix, newPrefix] of Object.entries(mapping.dev_flags)) {
    out = out.split(oldPrefix).join(newPrefix);
  }
  return out;
}
```

Run + commit.

---

## Task 5: P0 — Codemod --verify, --apply, --docs modes

**Files:**
- Modify: `scripts/theme-v3-codemod.mjs`
- Modify: `scripts/theme-v3-codemod.test.mjs`

- [ ] **Step 5.1: Implement runVerify (static validation — no child_process).**

Replace the stub `runVerify` with:

```js
export function runVerify() {
  const mapping = loadMapping();
  const errors = [];

  // 1. css_vars targets — chrome targets must NOT start with --buildrick-design-
  for (const [from, to] of Object.entries(mapping.css_vars.chrome_and_canvas_operational)) {
    if (typeof to !== 'string') continue;
    if (!to.startsWith('--buildrick-') || to.startsWith('--buildrick-design-')) {
      errors.push(`chrome css_var wrong namespace: ${from} → ${to}`);
    }
  }
  // design_runtime targets MUST start with --buildrick-design-
  for (const [from, to] of Object.entries(mapping.css_vars.design_runtime)) {
    if (typeof to !== 'string') continue;
    if (!to.startsWith('--buildrick-design-')) {
      errors.push(`design css_var wrong namespace: ${from} → ${to}`);
    }
  }

  // 2. Template-literal abort detection: scan source for aqb- INSIDE ${...} interpolations
  const files = walkFiles(DEFAULT_ROOTS, ['.ts', '.tsx']);
  const unhandled = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Check for aqb- inside ${...}
      const interpMatch = /\$\{[^}]*aqb-/.test(line);
      if (interpMatch) unhandled.push(`${relative('.', f)}:${i + 1} — aqb- INSIDE interpolation`);
    });
  }
  if (unhandled.length > 0) {
    errors.push(`abort: ${unhandled.length} unhandled template literals:\n  ${unhandled.join('\n  ')}`);
  }

  if (errors.length > 0) {
    console.error('VERIFY FAILED:');
    errors.forEach(e => console.error('  ' + e));
    process.exit(1);
  }
  const counts = {
    chrome: Object.keys(mapping.css_vars.chrome_and_canvas_operational).length,
    design: Object.keys(mapping.css_vars.design_runtime).length,
    keyframes: Object.keys(mapping.keyframes).length,
    dataAttrs: Object.keys(mapping.data_attributes).length,
    classnames: Object.keys(mapping.classnames).length,
    storageKeys: Object.keys(mapping.storage_keys).length,
  };
  console.log(`verify: OK (${JSON.stringify(counts)})`);
}
```

- [ ] **Step 5.2: Implement runApply.**

```js
export function runApply() {
  if (!process.env.THEME_V3_VERIFY_OK) {
    console.error('apply: must set THEME_V3_VERIFY_OK=1 after --verify passes');
    process.exit(2);
  }
  const mapping = loadMapping();
  const files = walkFiles(DEFAULT_ROOTS, ['.css', '.ts', '.tsx', '.html']);
  let modified = 0;

  for (const f of files) {
    let content = readFileSync(f, 'utf8');
    const original = content;
    try {
      if (f.endsWith('.css')) {
        content = applyOp1(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp5(content, mapping);
      } else {
        content = applyOp1(content, mapping);
        content = applyOp1b(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp6(content, mapping);
        content = applyOp7(content, mapping);
        content = applyOp5(content, mapping);
      }
    } catch (e) {
      console.error(`apply: ${f}: ${e.message}`);
      process.exit(1);
    }
    if (content !== original) {
      writeFileSync(f, content, 'utf8');
      modified++;
    }
  }
  console.log(`apply: ${modified} files modified`);
}
```

- [ ] **Step 5.3: Implement runDocsSweep.**

```js
export function runDocsSweep() {
  const mapping = loadMapping();
  const files = walkFiles(DOCS_ROOTS, ['.md', '.json']);
  let modified = 0;
  for (const f of files) {
    let content = readFileSync(f, 'utf8');
    const original = content;
    // Liberal mode for markdown — catch errors and continue
    try { content = applyOp1(content, mapping); } catch {}
    try { content = applyOp1b(content, mapping); } catch {}
    try { content = applyOp2(content, mapping); } catch {}
    try { content = applyOp4(content, mapping); } catch {}
    try { content = applyOp5(content, mapping); } catch {}
    try { content = applyOp6(content, mapping); } catch {}
    try { content = applyOp7(content, mapping); } catch {}
    if (content !== original) {
      writeFileSync(f, content, 'utf8');
      modified++;
    }
  }
  console.log(`docs: ${modified} files modified`);
}
```

- [ ] **Step 5.4: Implement runDryRun (wrap apply without writing).**

```js
export function runDryRun() {
  const mapping = loadMapping();
  const files = walkFiles(DEFAULT_ROOTS, ['.css', '.ts', '.tsx', '.html']);
  const report = [];
  for (const f of files) {
    const original = readFileSync(f, 'utf8');
    let content = original;
    try {
      if (f.endsWith('.css')) {
        content = applyOp1(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp5(content, mapping);
      } else {
        content = applyOp1(content, mapping);
        content = applyOp1b(content, mapping);
        content = applyOp2(content, mapping);
        content = applyOp4(content, mapping);
        content = applyOp6(content, mapping);
        content = applyOp7(content, mapping);
        content = applyOp5(content, mapping);
      }
    } catch (e) {
      report.push(`ERROR ${f}: ${e.message}`);
      continue;
    }
    if (content !== original) {
      const origLines = original.split('\n').length;
      const newLines = content.split('\n').length;
      report.push(`CHANGE ${relative('.', f)} (${origLines}→${newLines} lines)`);
    }
  }
  console.log(report.join('\n'));
  console.log(`\ndry-run: ${report.filter(r => r.startsWith('CHANGE')).length} files would change, ${report.filter(r => r.startsWith('ERROR')).length} errors`);
}
```

- [ ] **Step 5.5: Run all tests.**

```bash
node --test scripts/theme-v3-codemod.test.mjs
```

Expected: all passing.

- [ ] **Step 5.6: Commit.**

```bash
git add scripts/theme-v3-codemod.mjs scripts/theme-v3-codemod.test.mjs
git commit -m "feat(theme-v3): codemod --verify + --apply + --docs + --dry-run modes"
```

---

## Task 6: P0 — Dry-run, report, Codex Gate 1

**Files:**
- Create: `scripts/theme-v3-codemod-report.txt`

- [ ] **Step 6.1: Run dry-run.**

```bash
node scripts/theme-v3-codemod.mjs dry-run > scripts/theme-v3-codemod-report.txt 2>&1
```

- [ ] **Step 6.2: Run --verify.**

```bash
node scripts/theme-v3-codemod.mjs --verify
```

Expected: `verify: OK` with counts. If errors, fix mapping and codemod.

- [ ] **Step 6.3: Commit dry-run report.**

```bash
git add scripts/theme-v3-codemod-report.txt
git commit -m "feat(theme-v3): P0 dry-run codemod report — ready for Codex Gate 1"
```

- [ ] **Step 6.4: Run Codex Gate 1.**

Use `/codex` skill or direct codex exec. Challenge: every dedup merge, undefined-token decision, SSOT verifications, manual-edits whitelist completeness, op 1b template literal risks, codemod ordering (op 6 before op 5 for storage-key specificity).

If Gate 1 PASS, proceed. If FAIL, fix issues, re-run dry-run, re-review.

---

## Task 7: P2 — Author new `--buildrick-*` definitions alongside old

**Files:**
- Modify: `packages/editor/src/themes/default.css`
- Modify: `packages/editor/src/features/design-system/constants.ts`

- [ ] **Step 7.1: Add `--buildrick-*` block in default.css.**

Immediately after the existing `:root { ... }` containing `--aqb-*` definitions, add a NEW block. Rule (spec Q2 + P2 authoring rule): author ONLY mapped canonical targets. NO lexical prefix mirroring — `--aqb-primary` maps to `--buildrick-accent`, so create `--buildrick-accent`, NOT `--buildrick-primary`.

Read `scripts/theme-v3-mapping.json#css_vars.chrome_and_canvas_operational`. For every unique TARGET value (right-hand side of each entry), define a variable. Example:

```css
:root {
  /* V3 theme unification — new canonical tokens (alongside old --aqb-*/--ls-*/--accent-*).
     Old tokens stay live through P3 for consumer rename; deleted in P4. */
  --buildrick-accent: #2D6DFF;
  --buildrick-accent-hover: #4B8DFF;
  --buildrick-accent-pressed: #1E58D9;
  --buildrick-accent-tint: rgba(45, 109, 255, 0.10);
  --buildrick-accent-subtle: rgba(45, 109, 255, 0.05);
  --buildrick-accent-on: #FFFFFF;
  --buildrick-accent-glow: 0 0 0 3px var(--buildrick-accent-tint);
  --buildrick-text: /* copy value of --aqb-text-primary */ #334155;
  --buildrick-text-muted: /* copy value of --aqb-text-muted */ #64748B;
  --buildrick-surface: #F8FAFC;  /* Q14 define-new */
  --buildrick-surface-elevated: #FFFFFF;  /* Q14 define-new */
  --buildrick-bg-input: #FFFFFF;  /* Q14 define-new */
  /* ... every unique target from mapping */
}
```

For each unique target in the mapping, look up its current `--aqb-*` value in `themes/default.css` and copy it. Plus `define-new` decisions from `undefined_decisions` — copy the `value` field from each entry.

- [ ] **Step 7.2: DEFAULT_TOKENS in constants.ts — comment only (codemod op 1b handles the cssVar strings in P3).**

Above the `DEFAULT_TOKENS` export in `packages/editor/src/features/design-system/constants.ts`, add:

```ts
/**
 * V3 theme unification: cssVar fields below will be renamed from --aqb-* to
 * --buildrick-design-* in P3 via codemod op 1b. Consumer hooks write whatever
 * cssVar each DesignToken carries. Chrome tokens live in themes/default.css
 * under --buildrick-*; design tokens live here.
 */
```

No other changes to constants.ts in P2 — codemod handles renames in P3.

- [ ] **Step 7.3: Type check + tests.**

```bash
cd packages/editor && npx tsc --noEmit
npx vitest run
```

Expected: clean + pass.

- [ ] **Step 7.4: Browser sweep — expect pixel-identical.**

```bash
cd packages/editor && npm run dev &
sleep 3
open http://localhost:5050
```

Walk all 7 tabs. Expected: pixel-identical (double definitions coexist; consumers still point at old `--aqb-*`).

Kill dev server.

- [ ] **Step 7.5: Commit.**

```bash
git add packages/editor/src/themes/default.css packages/editor/src/features/design-system/constants.ts
git commit -m "feat(theme-v3): P2 — author --buildrick-* + --buildrick-design-* alongside old

Double-definitions coexist through P3. Old tokens still consumed; new
tokens prepared for consumer rename. No visual change expected.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: P2b — Delete applyTheme() + themeMode scaffolding

**Files:**
- Delete: `packages/editor/src/themes/index.ts`
- Modify: `packages/editor/src/index.ts`
- Modify: `packages/editor/demo/main.tsx`
- Modify: `packages/editor/src/shared/types/project.ts`
- Modify: `packages/editor/src/shared/constants/storageKeys.ts`

- [ ] **Step 8.1: Delete themes/index.ts.**

```bash
rm packages/editor/src/themes/index.ts
```

- [ ] **Step 8.2: Remove re-export in src/index.ts.**

Read `packages/editor/src/index.ts:75`. Find `export { applyTheme, defaultTheme } from "./themes";` — delete that line.

- [ ] **Step 8.3: Remove applyTheme usage in demo.**

Read `packages/editor/demo/main.tsx`. Find + delete:
- Line 11: `import { applyTheme } from "../src/themes/index";`
- Line 21 (or nearby): `applyTheme();` (and any surrounding empty block)

- [ ] **Step 8.4: Remove themeMode field.**

Read `packages/editor/src/shared/types/project.ts`. Find `themeMode?: "light" | "dark" | "system";` — delete.

Grep for consumers:
```bash
grep -rn "themeMode" packages/editor/src/
```

Remove any found references.

- [ ] **Step 8.5: Update storageKeys.ts — remove THEME, add AQB_MIGRATION_FLAG_V1.**

Read `packages/editor/src/shared/constants/storageKeys.ts`. Find `THEME: "aqb-theme",` — delete.

Add near the bottom:

```ts
/** V3 theme rename migration completion marker */
AQB_MIGRATION_FLAG_V1: "buildrick-aqb-migration-v1-complete",
```

- [ ] **Step 8.6: Type check + tests.**

```bash
cd packages/editor && npx tsc --noEmit && npx vitest run
```

Expected: clean + pass. If errors about applyTheme/themeMode consumers, remove those references.

- [ ] **Step 8.7: Browser check — light-canonical rendering expected.**

Dev server. Chrome now renders with `themes/default.css` canonical light values instead of applyTheme's dark runtime overrides. This IS the DESIGN.md 2026-04-18 light-chrome correction.

Capture before/after screenshots for CHANGELOG.

- [ ] **Step 8.8: Commit.**

```bash
git add -u packages/editor/src/themes/ packages/editor/src/index.ts packages/editor/demo/main.tsx packages/editor/src/shared/types/project.ts packages/editor/src/shared/constants/storageKeys.ts
git commit -m "feat(theme-v3): P2b — delete applyTheme + themeMode scaffolding

Removes the only JS writer of --aqb-* chrome tokens. Invariant #1 (chrome
never mutated at runtime) now holds. Visible change: chrome renders per
DESIGN.md canonical light values (applyTheme previously wrote dark overrides
at runtime).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: P3 — Codemod apply + manual edits + verification

**Files:**
- Modify: ~160+ files

- [ ] **Step 9.1: Run --verify.**

```bash
node scripts/theme-v3-codemod.mjs --verify
```

Expected: `verify: OK`. If drift since P0, re-populate mapping and retry.

- [ ] **Step 9.2: Run --apply.**

```bash
THEME_V3_VERIFY_OK=1 node scripts/theme-v3-codemod.mjs --apply
```

Expected: `apply: ~180 files modified`.

- [ ] **Step 9.3: Apply Category B.1 manual edits (3 sites).**

File 1: `packages/editor/src/features/design-system/types.ts:73`
```ts
// Before:
  return `--aqb-${id}`;
// After:
  return `--buildrick-design-${id}`;
```

File 2: `packages/editor/src/features/design-system/state/__tests__/useSpacingTokens.test.ts:22`
```ts
// Before:
    cssVar: `--aqb-${id}`,
// After:
    cssVar: `--buildrick-design-${id}`,
```

File 3: `packages/editor/src/features/design-system/utils/exportUtils.ts:15`
```ts
// Before:
  return `--aqb-color-${name}`;
// After:
  return `--buildrick-design-color-${name}`;
```

- [ ] **Step 9.4: Apply Category B.2 manual edits (regex readers).**

`packages/editor/src/features/design-system/state/useTokenUsageMap.ts`:
- Line 32: `/^var\(--aqb-/` → `/^var\(--buildrick-design-/`
- Line 36: `/^var\((--aqb-[^)]+)\)/` → `/^var\((--buildrick-design-[^)]+)\)/`
- Line 73: `cssVar.replace(/^--aqb-/, "")` → `cssVar.replace(/^--buildrick-design-/, "")`

`packages/editor/src/editor/inspector/shared/controls/ColorInput.tsx`:
- Line 37: `/^var\(--aqb-/` → `/^var\(--buildrick-design-/`
- Line 49: `/^var\((--aqb-[^)]+)\)$/` → `/^var\((--buildrick-design-[^)]+)\)$/`

`packages/editor/src/editor/inspector/shared/controls/InputControls.tsx`:
- Line 152: `/^var\(--aqb-/` → `/^var\(--buildrick-design-/`
- Line 157: `/^var\((--aqb-[^)]+)\)$/` → `/^var\((--buildrick-design-[^)]+)\)$/`

`packages/editor/src/editor/inspector/sections/typography/FontControls.tsx`:
- Line 40: similar `/^var\(--aqb-/` → `/^var\(--buildrick-design-/` pattern

`packages/editor/src/editor/inspector/sections/SizeSection.tsx`:
- Line 21: similar pattern

`packages/editor/src/editor/inspector/shared/TokenPickerPopover.tsx`:
- Line 57: READ the file first, identify the exact regex, apply appropriate `--buildrick-design-` target.

- [ ] **Step 9.5: Spot-check Gate-1-flagged auto-swap sites.**

```bash
grep -n "buildrick-" packages/editor/src/shared/types/animations.ts
grep -n "buildrick-" packages/editor/src/engine/elements/ElementOperations.ts
grep -n "buildrick-" packages/editor/src/editor/inspector/sections/registry.tsx
grep -n "buildrick-nav-" packages/editor/src/editor/sidebar/shared/usePanelNavigation.ts
grep -n "buildrick-layers-" packages/editor/src/editor/panels/layers/hooks/layersPersistence.ts
grep -n "buildrick:trace:" packages/editor/src/shared/utils/devLogger.ts
```

Each should show `buildrick-` versions. If any still has `aqb-`, investigate codemod gap.

- [ ] **Step 9.6: Full verification grep suite (Spec Section 7.1).**

```bash
# CSS-side ghosts (expect empty)
grep -rE "var\(--aqb-|var\(--ls-|var\(--accent-|@keyframes aqb-|animation(-name)?:\s*aqb-" packages/editor/src/ packages/editor/demo/
grep -rE "^\s*--aqb-|^\s*--ls-|^\s*--accent-" packages/editor/src/ packages/editor/demo/
grep -rE "data-aqb-" packages/editor/src/ packages/editor/demo/
grep -rE "\.aqb-|[\"']aqb-" packages/editor/src/ packages/editor/demo/ --include="*.ts" --include="*.tsx" --include="*.css" --include="*.html"
grep -rE "aqb:trace:" packages/editor/src/ packages/editor/demo/

# JS-side ghosts (expect empty)
grep -rnE "setProperty\s*\(\s*['\"]--(aqb|ls|accent)-" packages/editor/src/
grep -rnE "['\"]--(aqb|ls|accent)-[a-z0-9-]+['\"]" packages/editor/src/
grep -rnE "\`[^\`]*aqb-[^\`]*\\\$\{" packages/editor/src/

# Namespace invariants
grep -rnE "setProperty\s*\(\s*['\"]--buildrick-" packages/editor/src/ | grep -v "buildrick-design-"
```

Any non-empty output = codemod or manual-edits gap. Extend mapping and re-run --apply, OR add more manual edits.

- [ ] **Step 9.7: Type check + tests + browser sweep.**

```bash
cd packages/editor && npx tsc --noEmit && npx vitest run
```

Expected: clean + pass.

Dev server. Walk all 7 tabs. Compare against POST-P2b state (not pre-migration) — P2b already flipped to light canonical, so this compare is for rename-correctness, not DESIGN.md-direction.

- [ ] **Step 9.8: Commit P3.**

```bash
git add -A packages/editor/src/ packages/editor/demo/
git commit -m "feat(theme-v3): P3 — codemod + manual edits complete

- Codemod ran: ~180 files modified
- Category B.1: 3 namespace-remap template literal manual edits
- Category B.2: 10 regex/prefix-reader manual edits
- Gate-1-flagged: 7 auto-swap sites verified
- All grep verification suite passes

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: P4 + P5 + P6 + P7 + P8 — Deletions, migration, docs, finalize

**Files:**
- Modify: `packages/editor/src/themes/default.css` (delete old defs)
- Modify: `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css` (delete dark overrides)
- Modify: `packages/editor/src/components/Canvas/Canvas.css` (fix DARK_THEME_SHIM)
- Modify: `packages/editor/src/shared/constants/config.ts` + `shared/constants/index.ts` (delete CSS_CLASSES)
- Modify: `packages/editor/src/shared/utils/storageMigration.ts` (add migrateAqbKeys)
- Modify: `packages/editor/src/editor/shell/AquibraStudio.tsx` (wire migrateAqbKeys)
- Modify: 33 markdown + 1 JSON (docs sweep)
- Modify: `DESIGN.md`, `CLAUDE.md`, `CHANGELOG.md`
- Delete: `scripts/theme-v3-codemod.mjs` + `.test.mjs`

- [ ] **Step 10.1: P4 gate — Codex Gate 2.**

Use `/codex` or direct exec. Review cumulative P2+P2b+P3 diff + full verification grep output. Challenge: any surviving aqb-* references anywhere, JS setProperty writing to chrome, data-attrs completeness, regex-reader retarget correctness. PASS verdict required.

- [ ] **Step 10.2: P4 — delete old CSS var definitions from default.css.**

Read `packages/editor/src/themes/default.css`. Delete all `--aqb-*`, `--ls-*`, `--accent-*` definition lines (not `var(...)` references — those were renamed in P3).

Keep: `--buildrick-*` definitions from P2.

Verify:
```bash
grep -E "^\s*--(aqb|ls|accent)-" packages/editor/src/themes/default.css
```
Expected: empty.

- [ ] **Step 10.3: P4 — delete PagesTab.css dark overrides block.**

Read `packages/editor/src/editor/sidebar/tabs/pages/PagesTab.css:2179-2214`. Delete the entire `.pages-panel { ... }` rule block that redefines tokens back to dark values.

- [ ] **Step 10.4: P4 — fix DARK_THEME_SHIM in components/Canvas/Canvas.css.**

Read `packages/editor/src/components/Canvas/Canvas.css`. Find the DARK_THEME_SHIM block (dark values for `--buildrick-surface-*`, text colors, etc. inside canvas scope). Replace dark hex values with DESIGN.md canonical light:

- dark hex like `#14141f` → `#F8FAFC` (matching `--buildrick-surface`)
- dark text `#f8fafc` → `#334155` (canonical text)
- dark muted `#a1a1aa` → `#64748B` (canonical muted)

Keep the CSS file (structural cleanup deferred). Just update values.

- [ ] **Step 10.5: P4 — verification + browser sweep.**

```bash
cd packages/editor && npx tsc --noEmit && npx vitest run
```

Dev server. Walk 7 tabs. Expected: pixel-identical to post-P3 EXCEPT PagesTab + canvas now render light canonical. These ARE the DESIGN.md value-correctness fixes.

- [ ] **Step 10.6: P4 — commit.**

```bash
git add -u packages/editor/src/
git commit -m "feat(theme-v3): P4 — delete old CSS defs + PagesTab dark overrides + DARK_THEME_SHIM fix

All --aqb-*/--ls-*/--accent-* definitions removed from default.css.
PagesTab.pages-panel dark-override block deleted (DESIGN.md violation).
components/Canvas/Canvas.css DARK_THEME_SHIM values corrected to light
canonical. Files structurally preserved.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 10.7: P5 — delete CSS_CLASSES constant.**

Read `packages/editor/src/shared/constants/config.ts:225-242`. Delete the entire `export const CSS_CLASSES = { ... }` block.

Read `packages/editor/src/shared/constants/index.ts:36`. Delete the `CSS_CLASSES` re-export.

Verify: `grep -rn "CSS_CLASSES" packages/editor/src/` → empty.

```bash
cd packages/editor && npx tsc --noEmit && npx vitest run
git add -u packages/editor/src/shared/constants/
git commit -m "feat(theme-v3): P5 — delete orphan CSS_CLASSES constant"
```

- [ ] **Step 10.8: P6 — add migrateAqbKeys() to storageMigration.ts.**

Read `packages/editor/src/shared/utils/storageMigration.ts`. Add after `migrateStorageKeys()`:

```ts
// AQB_TO_BUILDRICK_STORAGE_MAP is generated at build time from
// scripts/theme-v3-mapping.json#storage_keys (non-dynamic entries only).
// For now, hand-authored here to match mapping.json exactly.
const AQB_TO_BUILDRICK_STORAGE_MAP: Record<string, string> = {
  "aqb-project": "buildrick-project",
  "aqb-autosave": "buildrick-autosave",
  "aqb-last-file": "buildrick-last-file",
  "aqb-preferences": "buildrick-preferences",
  "aqb-license": "buildrick-license",
  "aqb-recent-projects": "buildrick-recent-projects",
  "aqb-panels": "buildrick-panels",
  "aqb-panel-state": "buildrick-panel-state",
  "aqb-guides": "buildrick-guides",
  "aqb-inspector-mode": "buildrick-inspector-mode",
  "aqb-recent-commands": "buildrick-recent-commands",
  "aqb-quick-switcher-recent": "buildrick-quick-switcher-recent",
  "aqb-saved-templates": "buildrick-saved-templates",
  "aqb-elements-recent": "buildrick-elements-recent",
  "aqb-elements-favorites": "buildrick-elements-favorites",
  "aqb-elements-tip-dismissed": "buildrick-elements-tip-dismissed",
  "aqb-elements-expanded-category": "buildrick-elements-expanded-category",
  "aqb-recent-templates": "buildrick-recent-templates",
  "aqb-my-templates": "buildrick-my-templates",
  "aqb-component-favorites": "buildrick-component-favorites",
  "aqb-sidebar-state": "buildrick-sidebar-state",
  "aqb-inspector-sections": "buildrick-inspector-sections",
  "aqb-inspector-sections-v2": "buildrick-inspector-sections-v2",
  "aqb-history": "buildrick-history",
  "aqb-ai-context": "buildrick-ai-context",
  "aqb-clipboard": "buildrick-clipboard",
  "aqb-assets": "buildrick-assets",
  "aqb-copied-style": "buildrick-copied-style",
  "aqb-vercel-token": "buildrick-vercel-token",
  "aqb-canvas-logs": "buildrick-canvas-logs",
  "aqb-debug-settings": "buildrick-debug-settings",
  "aqb-last-applied-template": "buildrick-last-applied-template",
  "aqb-recent-icons": "buildrick-recent-icons",
  "aqb-layers-display-prefs": "buildrick-layers-display-prefs",
};

const EXCLUDED_AQB_PREFIXES = [
  "aqb-migration-v1-complete",
  "aqb-migration-v1-timestamp",
];

export function migrateAqbKeys(): void {
  if (localStorage.getItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1)) return;

  let migratedCount = 0;

  // Static map pass
  Object.entries(AQB_TO_BUILDRICK_STORAGE_MAP).forEach(([oldKey, newKey]) => {
    try {
      const value = localStorage.getItem(oldKey);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        migratedCount++;
      }
    } catch {
      // silent per precedent
    }
  });

  // Dynamic-key pass
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }
  for (const key of keys) {
    if (!key.startsWith("aqb-")) continue;
    if (EXCLUDED_AQB_PREFIXES.includes(key)) continue;
    const newKey = "buildrick-" + key.slice("aqb-".length);
    try {
      const value = localStorage.getItem(key);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(key);
        migratedCount++;
      }
    } catch {
      // silent
    }
  }

  try {
    localStorage.setItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1, Date.now().toString());
  } catch {
    // storage full
  }

  if (migratedCount > 0) {
    devLog("Storage", `Migrated ${migratedCount} localStorage keys from aqb-* to buildrick-*`);
  }
}
```

- [ ] **Step 10.9: P6 — wire into AquibraStudio.tsx.**

Read `packages/editor/src/editor/shell/AquibraStudio.tsx:19`. The existing line calls `migrateStorageKeys();`. Change to:

```ts
migrateStorageKeys();
migrateAqbKeys();
```

Update import: `import { migrateStorageKeys, migrateAqbKeys } from "../../shared/utils/storageMigration";`

- [ ] **Step 10.10: P6 — browser test migration shim.**

Before starting dev server, open any browser tab, open DevTools → Console:

```js
localStorage.clear();
localStorage.setItem('aqb-panel-state', '{"foo":"bar"}');
localStorage.setItem('aqb-layers-test-page-hidden', '{"layer1":true}');
```

Start dev server, navigate to `localhost:5050`. After page loads, in DevTools Console:

```js
localStorage.getItem('aqb-panel-state')                       // expect null
localStorage.getItem('buildrick-panel-state')                 // expect '{"foo":"bar"}'
localStorage.getItem('aqb-layers-test-page-hidden')           // expect null
localStorage.getItem('buildrick-layers-test-page-hidden')     // expect '{"layer1":true}'
localStorage.getItem('buildrick-aqb-migration-v1-complete')   // expect timestamp
```

All 5 checks must pass.

- [ ] **Step 10.11: P6 — commit.**

```bash
git add -u packages/editor/src/shared/utils/storageMigration.ts packages/editor/src/editor/shell/AquibraStudio.tsx
git commit -m "feat(theme-v3): P6 — migrateAqbKeys migration shim + boot wiring

Preserves user's local state across rename. Mirrors precedent
migrateStorageKeys safety model: !newKey guard, per-key try/catch,
excluded precedent markers, new-prefix completion flag.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 10.12: P7 — docs sweep.**

```bash
node scripts/theme-v3-codemod.mjs --docs
```

Expected: ~20-33 files modified.

- [ ] **Step 10.13: P7 — update DESIGN.md namespace contract.**

Read `/Users/shahg/Desktop/pencil/buildrik/DESIGN.md`. Find the Theme/Color section. Add:

```markdown
## Token Namespace Contract (V3, 2026-04-19)

Two namespaces, one invariant.

- `--buildrick-*` — chrome tokens (sidebar, topbar, panels, inspector, buttons) and canvas operational tokens (selection glow, box-model, spacing on rendered user content). Static. Never mutated by JavaScript at runtime. Defined in `themes/default.css` + `components/Canvas/Canvas.css` + `editor/canvas/Canvas.css`.
- `--buildrick-design-*` — user-editable design tokens from the Design tab. Runtime-mutated ONLY by `useTokenBase` / `useColorTokens` / `useSpacingTokens` / `useTypeTokens`. Defined in `features/design-system/constants.ts` DEFAULT_TOKENS.

CI-enforceable invariants: see `docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md` Section 2.
```

- [ ] **Step 10.14: P7 — fix CLAUDE.md "dark-only" residual line.**

Read `/Users/shahg/Desktop/pencil/buildrik/CLAUDE.md`. Find `- Editor chrome is dark-only, desktop-only.`. Replace with:

```markdown
- Editor chrome uses the canonical light theme per DESIGN.md (see Color / Token Namespace Contract sections). Desktop-only. Dark-only was flipped 2026-04-18.
```

- [ ] **Step 10.15: P7 — CHANGELOG entry.**

Append to `/Users/shahg/Desktop/pencil/buildrik/CHANGELOG.md`:

```markdown
## Theme Unification V3 — 2026-04-19

### Changed
- Renamed all `--aqb-*` CSS variables to `--buildrick-*` (chrome) and `--buildrick-design-*` (user design tokens).
- Renamed all `aqb-*` class names, `data-aqb-*` attributes, `aqb-*` localStorage keys, `aqb:trace:*` dev flags to `buildrick-*` equivalents.
- Renamed all `@keyframes aqb-*` to `@keyframes buildrick-*`.
- Enforced "chrome never mutated at runtime" invariant via two-namespace split.
- Deleted runtime `applyTheme()` function (chrome now renders from `themes/default.css` canonical light values per DESIGN.md 2026-04-18).
- Added `migrateAqbKeys()` storage migration — preserves existing user state across rename.

### Fixed
- `PagesTab.css` dark-override block removed (was shadowing canonical tokens, DESIGN.md violation).
- `components/Canvas/Canvas.css` DARK_THEME_SHIM values corrected to light canonical.
- 29 previously-undefined-but-consumed tokens resolved (defined or renamed).
- 2 orphan `@keyframes` animation-name references deleted.
- Orphan `CSS_CLASSES` constant deleted.

### Known limitations
- Experimental Design-tab user customizations may reset to DEFAULT_TOKENS on first post-V3 load (Q4=C lossy retargeting).
- Structural debt (file consolidations in themes/, storage key duplication cleanup, engine class-name SSOT) explicitly deferred to separate specs.
```

- [ ] **Step 10.16: P7 — commit.**

```bash
git add -A docs/ DESIGN.md CLAUDE.md CHANGELOG.md packages/editor/src/docs/ packages/editor/src/project-documentation/ packages/editor/src/code-to-prd-output/
git commit -m "feat(theme-v3): P7 — docs sweep + DESIGN.md namespace contract + CHANGELOG"
```

- [ ] **Step 10.17: P8 — Codex Gate 3.**

Via `/codex` or direct exec. Review cumulative P2-P7 diff. Run all Section 7 verification greps. Verify DESIGN.md contract section + CHANGELOG + migration shim browser-tested. PASS verdict required.

- [ ] **Step 10.18: P8 — delete codemod script.**

```bash
rm scripts/theme-v3-codemod.mjs scripts/theme-v3-codemod.test.mjs
git add -u scripts/
git commit -m "feat(theme-v3): P8 — delete codemod script (job done)

Kept as historical record:
- scripts/theme-v3-mapping.json
- scripts/theme-v3-codemod-report.txt
- scripts/theme-v3-audit.json

Codex Gate 3 PASS. Migration complete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 10.19: Final grep sanity.**

```bash
grep -rE "aqb-|--aqb-|--ls-|--accent-|@keyframes aqb-|data-aqb-" packages/editor/src/ packages/editor/demo/
```

Expected: empty.

```bash
wc -l packages/editor/src/themes/default.css
```

Expected: < 4000 lines.

Migration complete.

---

## Post-migration deferred work (NOT in this plan)

Per spec Section 8, follow-up specs to consider later:

1. Structural cleanup of `themes/` (merge ux-fixes.css, consolidate Canvas.css files, reclassify design-tokens.css).
2. Real engine class-name SSOT (new constant, replace hardcoded engine strings).
3. Storage key consolidation (collapse 4 duplicates + 4 hardcoded-consumer gaps).
4. Real `themeMode` light/dark feature.
5. Inspector token picker UX review.
6. Dashboard (Next.js) package theme alignment.
7. Playwright visual regression infrastructure.

Each is a separate brainstorm → spec → plan cycle.
