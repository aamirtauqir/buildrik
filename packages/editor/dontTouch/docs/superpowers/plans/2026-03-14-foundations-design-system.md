# Buildrik Design System — Phase 1: Foundations Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 56–60 missing design tokens to the Pencil file, build an 8-section Foundations documentation frame, and apply token references across all 29 editable screens.

**Architecture:** Sequential in 3 phases — (1) add all missing tokens so the variable system is complete, (2) build the Foundations documentation frame which visualizes those tokens, (3) apply `$--aqb-*` variable references to replace hardcoded values in all 29 editable screens. Each phase depends on the previous.

**Tech Stack:** Pencil MCP tools (`mcp__pencil__*`) — `get_variables`, `set_variables`, `batch_get`, `batch_design`, `get_screenshot`. Pencil file: `/Users/shahg/Desktop/pencil/buildrik.pen`. No code changes to the React codebase.

**Spec:** `docs/superpowers/specs/2026-03-14-foundations-design-system.md`

---

## Chunk 1: Pre-flight + Token Addition

### Task 1: Open file and pre-flight variable audit

**Pencil file:** `/Users/shahg/Desktop/pencil/buildrik.pen`

- [ ] **Step 1: Open the Pencil file**

  Call `mcp__pencil__open_document` with path `/Users/shahg/Desktop/pencil/buildrik.pen`. Confirm the editor state shows the file is active.

- [ ] **Step 2: Call get_variables and audit existing tokens**

  Call `mcp__pencil__get_variables()`. Record all of the following — you will reference these decisions throughout Tasks 2–8:

  **Record the baseline count:** Count total variables returned. Write it down as `BASELINE`. Every running total below is `BASELINE + N_new`.

  **Check these specific names and values:**
  - Total variable count → record as `BASELINE` (expected ~75)
  - Is `--aqb-bg-darker` present? (value should be `"#08080e"`)
  - Is `--aqb-border` present, or is it named `--aqb-border-default`? Record exact name as `BORDER_NAME`.
  - Is `--aqb-border-light` present? Record exact name.
  - Is `--aqb-border-subtle` present? Record exact name.
  - Is `--aqb-primary-muted` present? Record its value.
  - Are any of these already present: `--aqb-secondary-light`, `--aqb-bg-panel-secondary`, `--aqb-bg-panel-tertiary`? Record which are absent.
  - Are any of the 56 confirmed new tokens already present (e.g., does `--aqb-space-0` already exist)? If any confirmed tokens already exist, skip them in the relevant tasks below.

  **Decision rules from audit results:**
  - If `BORDER_NAME` differs from `--aqb-border` (e.g., is `--aqb-border-default`), note this — you will use the correct name in Chunk 3 screen updates.
  - If `--aqb-primary-muted` value is `rgba(99,102,241,0.18)`, mark it for update in Task 8.
  - Record which of the 4 conditional color tokens are absent — they will be added in Task 8.

- [ ] **Step 3: Commit audit notes**

  ```bash
  git commit --allow-empty -m "chore(design): pre-flight audit complete — starting Phase 1 token addition"
  ```

---

### Task 2: Add spacing scale tokens (11 tokens)

**What:** Add `--aqb-space-0` through `--aqb-space-16` as number-type variables.

- [ ] **Step 1: Call set_variables with spacing tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-space-0",  "value": 0,  "type": "number" },
    { "name": "--aqb-space-1",  "value": 4,  "type": "number" },
    { "name": "--aqb-space-2",  "value": 8,  "type": "number" },
    { "name": "--aqb-space-3",  "value": 12, "type": "number" },
    { "name": "--aqb-space-4",  "value": 16, "type": "number" },
    { "name": "--aqb-space-5",  "value": 20, "type": "number" },
    { "name": "--aqb-space-6",  "value": 24, "type": "number" },
    { "name": "--aqb-space-8",  "value": 32, "type": "number" },
    { "name": "--aqb-space-10", "value": 40, "type": "number" },
    { "name": "--aqb-space-12", "value": 48, "type": "number" },
    { "name": "--aqb-space-16", "value": 64, "type": "number" }
  ]
  ```

- [ ] **Step 2: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 11 `--aqb-space-*` entries exist with correct values. Total count should be `BASELINE + 11`.

  > **Note on token verification:** Token tasks (Tasks 2–8) verify via `get_variables()` — variable values have no visual representation to screenshot. Screenshots (`get_screenshot`) are used in Chunks 2–4 where visual elements are created or modified.

- [ ] **Step 3: Commit**

  ```bash
  git commit --allow-empty -m "design: add spacing scale tokens (--aqb-space-0 through --aqb-space-16)"
  ```

---

### Task 3: Add font-size tokens (10 tokens)

**What:** Add 10 font-size tokens (`--aqb-text-micro` through `--aqb-text-4xl`). Three of them — micro, xs, and sm — all have value `12`. This is intentional: they are semantic aliases for caption, label, and small-body text. Do not deduplicate them.

- [ ] **Step 1: Call set_variables with font-size tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-text-micro", "value": 12, "type": "number" },
    { "name": "--aqb-text-xs",    "value": 12, "type": "number" },
    { "name": "--aqb-text-sm",    "value": 12, "type": "number" },
    { "name": "--aqb-text-base",  "value": 13, "type": "number" },
    { "name": "--aqb-text-md",    "value": 14, "type": "number" },
    { "name": "--aqb-text-lg",    "value": 16, "type": "number" },
    { "name": "--aqb-text-xl",    "value": 18, "type": "number" },
    { "name": "--aqb-text-2xl",   "value": 20, "type": "number" },
    { "name": "--aqb-text-3xl",   "value": 24, "type": "number" },
    { "name": "--aqb-text-4xl",   "value": 32, "type": "number" }
  ]
  ```

- [ ] **Step 2: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 10 `--aqb-text-*` entries exist (including the three that share value 12). Total count should be `BASELINE + 21`.

- [ ] **Step 3: Commit**

  ```bash
  git commit --allow-empty -m "design: add font-size tokens (--aqb-text-micro through --aqb-text-4xl)"
  ```

---

### Task 4: Add font-weight and line-height tokens (9 tokens)

- [ ] **Step 1: Call set_variables with weight + line-height tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-font-normal",    "value": 400,   "type": "number" },
    { "name": "--aqb-font-medium",    "value": 500,   "type": "number" },
    { "name": "--aqb-font-semibold",  "value": 600,   "type": "number" },
    { "name": "--aqb-font-bold",      "value": 700,   "type": "number" },
    { "name": "--aqb-leading-none",   "value": 1.0,   "type": "number" },
    { "name": "--aqb-leading-tight",  "value": 1.25,  "type": "number" },
    { "name": "--aqb-leading-snug",   "value": 1.375, "type": "number" },
    { "name": "--aqb-leading-normal", "value": 1.5,   "type": "number" },
    { "name": "--aqb-leading-relaxed","value": 1.625, "type": "number" }
  ]
  ```

- [ ] **Step 2: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 9 new `--aqb-font-*` and `--aqb-leading-*` entries. Total count should be `BASELINE + 30`.

- [ ] **Step 3: Commit**

  ```bash
  git commit --allow-empty -m "design: add font-weight and line-height tokens"
  ```

---

### Task 5: Add z-index tokens (9 tokens)

- [ ] **Step 1: Call set_variables with z-index tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-z-base",     "value": 0,    "type": "number" },
    { "name": "--aqb-z-dropdown", "value": 100,  "type": "number" },
    { "name": "--aqb-z-sticky",   "value": 200,  "type": "number" },
    { "name": "--aqb-z-overlay",  "value": 300,  "type": "number" },
    { "name": "--aqb-z-modal",    "value": 400,  "type": "number" },
    { "name": "--aqb-z-popover",  "value": 500,  "type": "number" },
    { "name": "--aqb-z-tooltip",  "value": 600,  "type": "number" },
    { "name": "--aqb-z-toast",    "value": 700,  "type": "number" },
    { "name": "--aqb-z-max",      "value": 9999, "type": "number" }
  ]
  ```

- [ ] **Step 2: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 9 `--aqb-z-*` entries. Total count should be `BASELINE + 39`.

- [ ] **Step 3: Commit**

  ```bash
  git commit --allow-empty -m "design: add z-index scale tokens"
  ```

---

### Task 6: Add layout dimension tokens (8 tokens)

- [ ] **Step 1: Call set_variables with layout tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-header-height",       "value": 52,  "type": "number" },
    { "name": "--aqb-footer-height",       "value": 40,  "type": "number" },
    { "name": "--aqb-sidebar-width",       "value": 56,  "type": "number" },
    { "name": "--aqb-sidebar-panel-width", "value": 280, "type": "number" },
    { "name": "--aqb-right-panel-width",   "value": 300, "type": "number" },
    { "name": "--aqb-touch-min",           "value": 44,  "type": "number" },
    { "name": "--aqb-touch-gap",           "value": 8,   "type": "number" },
    { "name": "--aqb-panel-input-height",  "value": 30,  "type": "number" }
  ]
  ```

- [ ] **Step 2: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 8 layout dimension entries. Total count should be `BASELINE + 47`.

  > **Grouping note:** `--aqb-panel-input-height` is in this layout batch (not the panel batch in Task 7) because the spec defines it as a layout dimension token. The panel batch (Task 7) contains only `panel-section-gap`, `panel-label-size`, `panel-label-weight`.

- [ ] **Step 3: Commit**

  ```bash
  git commit --allow-empty -m "design: add layout dimension tokens"
  ```

---

### Task 7: Add panel-specific and input tokens (9 tokens)

- [ ] **Step 1: Call set_variables with panel tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-panel-section-gap",   "value": 8,   "type": "number" },
    { "name": "--aqb-panel-label-size",    "value": 12,  "type": "number" },
    { "name": "--aqb-panel-label-weight",  "value": 500, "type": "number" }
  ]
  ```

- [ ] **Step 2: Call set_variables with input tokens**

  Call `mcp__pencil__set_variables` with:
  ```json
  [
    { "name": "--aqb-input-bg",           "value": "rgba(0,0,0,0.25)",       "type": "string" },
    { "name": "--aqb-input-bg-hover",     "value": "rgba(0,0,0,0.3)",        "type": "string" },
    { "name": "--aqb-input-bg-focus",     "value": "rgba(0,0,0,0.35)",       "type": "string" },
    { "name": "--aqb-input-border",       "value": "rgba(255,255,255,0.1)",  "type": "string" },
    { "name": "--aqb-input-border-hover", "value": "rgba(255,255,255,0.15)", "type": "string" },
    { "name": "--aqb-input-border-focus", "value": "rgba(59,130,246,0.5)",   "type": "string" }
  ]
  ```

- [ ] **Step 3: Verify**

  Call `mcp__pencil__get_variables()`. Confirm 3 panel entries + 6 input entries = 9 new. Total count should be `BASELINE + 56`.

- [ ] **Step 4: Commit**

  ```bash
  git commit --allow-empty -m "design: add panel and input tokens"
  ```

---

### Task 8: Add conditional color tokens and fix discrepancy

**What:** Add color tokens that were absent per the pre-flight audit (Task 1). Fix `--aqb-primary-muted` if it had the wrong value. Only add tokens confirmed absent in Task 1.

- [ ] **Step 1: Add absent color tokens**

  For each token from this list that was **absent** in Task 1's audit, add it via `mcp__pencil__set_variables`. Only include the ones that were missing:

  ```json
  [
    { "name": "--aqb-bg-darker",          "value": "#08080e",                "type": "color" },
    { "name": "--aqb-secondary-light",    "value": "rgba(139,92,246,0.12)",  "type": "color" },
    { "name": "--aqb-bg-panel-secondary", "value": "#1c1c2a",                "type": "color" },
    { "name": "--aqb-bg-panel-tertiary",  "value": "#24243a",                "type": "color" }
  ]
  ```

- [ ] **Step 2: Fix --aqb-primary-muted if needed**

  If the Task 1 audit found `--aqb-primary-muted` was `rgba(99,102,241,0.18)`, call `mcp__pencil__set_variables` with:
  ```json
  [{ "name": "--aqb-primary-muted", "value": "rgba(99,102,241,0.08)", "type": "color" }]
  ```
  If it was already `rgba(99,102,241,0.08)`, skip this step.

- [ ] **Step 3: Verify final token count**

  Call `mcp__pencil__get_variables()`. Confirm:
  - All `--aqb-space-*` tokens present (11)
  - All `--aqb-text-*` tokens present (10)
  - All `--aqb-font-*` tokens present (4)
  - All `--aqb-leading-*` tokens present (5)
  - All `--aqb-z-*` tokens present (9)
  - All `--aqb-*-height`, `--aqb-*-width` tokens present (8)
  - All `--aqb-panel-*` tokens present (3)
  - All `--aqb-input-*` tokens present (6)
  - Color tokens added (however many were absent)
  - `--aqb-primary-muted` value is `rgba(99,102,241,0.08)`

  **Also verify the replacement map token names:** Confirm the exact names for border tokens (`--aqb-border`, `--aqb-border-light`, `--aqb-border-subtle`). If actual names differ, record the correct names — you will use them in Chunk 3 screen updates.

- [ ] **Step 4: Commit**

  ```bash
  git commit --allow-empty -m "design: add color tokens and fix primary-muted discrepancy — token addition complete"
  ```

---

## Chunk 2: Foundations Frame Build

### Task 9: Create the Foundations frame shell

**What:** Create the `🏗️ Foundations` frame at the correct y-position below all existing content.

- [ ] **Step 1: Find max-y of existing frames**

  Call `mcp__pencil__batch_get` with depth 1 on the root. From the response, for every top-level frame compute `frame.y + frame.height`. Take the maximum value. Call it `MAX_Y`.

- [ ] **Step 2: Create the Foundations frame**

  Call `mcp__pencil__batch_design` with:
  ```
  foundations=I("root", {
    name: "🏗️ Foundations",
    type: "frame",
    x: 0,
    y: MAX_Y + 200,
    width: 5600,
    height: 4800,
    fill: "#08080e",
    layout: "none"
  })
  ```
  Record the returned node ID as `FOUNDATIONS_ID`.

- [ ] **Step 3: Verify frame created**

  Call `mcp__pencil__get_screenshot` on `FOUNDATIONS_ID`. Confirm a large dark frame appears.

- [ ] **Step 4: Commit**

  > **Why `--allow-empty`:** The Pencil document lives at `/Users/shahg/Desktop/pencil/buildrik.pen`, which is outside this git repository (`/Users/shahg/Desktop/test/buildrik`). Pencil MCP operations save to that external file and produce no staged changes in this repo. All commits in Chunk 2 use `--allow-empty` for this reason — they serve as progress markers only.

  ```bash
  git commit --allow-empty -m "design: create Foundations frame shell (5600×4800px)"
  ```

---

### Task 10: Create the 8 section sub-frames

**What:** Insert the 8 section frames inside the Foundations frame at exact positions per spec:
- Row 1 (y=60): Sections 01, 02, 03 — each 1800×1400px at x=60, 1900, 3740
- Row 2 (y=1500): Sections 04, 05, 06 — each 1800×1000px at x=60, 1900, 3740
- Row 3 (y=2540): Sections 07, 08 — each 2720×900px at x=60, 2820

All sections: fill `#0f0f14`, 1px border `rgba(255,255,255,0.08)`, cornerRadius 8.

- [ ] **Step 1: Create Row 1 sections (01–03)**

  Call `mcp__pencil__batch_design` with:
  ```
  s01=I("FOUNDATIONS_ID", { name:"01 — Color System",     type:"frame", x:60,   y:60, width:1800, height:1400, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  s02=I("FOUNDATIONS_ID", { name:"02 — Spacing Scale",    type:"frame", x:1900, y:60, width:1800, height:1400, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  s03=I("FOUNDATIONS_ID", { name:"03 — Typography",       type:"frame", x:3740, y:60, width:1800, height:1400, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  ```

- [ ] **Step 2: Create Row 2 sections (04–06)**

  Call `mcp__pencil__batch_design` with:
  ```
  s04=I("FOUNDATIONS_ID", { name:"04 — Radius Scale",        type:"frame", x:60,   y:1500, width:1800, height:1000, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  s05=I("FOUNDATIONS_ID", { name:"05 — Shadows & Elevation", type:"frame", x:1900, y:1500, width:1800, height:1000, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  s06=I("FOUNDATIONS_ID", { name:"06 — Borders",             type:"frame", x:3740, y:1500, width:1800, height:1000, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  ```

- [ ] **Step 3: Create Row 3 sections (07–08)**

  Call `mcp__pencil__batch_design` with:
  ```
  s07=I("FOUNDATIONS_ID", { name:"07 — Motion & Easing",    type:"frame", x:60,   y:2540, width:2720, height:900, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  s08=I("FOUNDATIONS_ID", { name:"08 — Layout Dimensions",  type:"frame", x:2820, y:2540, width:2720, height:900, fill:"#0f0f14", stroke:"rgba(255,255,255,0.08)", strokeWidth:1, cornerRadius:8 })
  ```

- [ ] **Step 4: Verify grid layout**

  Call `mcp__pencil__get_screenshot` on `FOUNDATIONS_ID`. Confirm 8 dark section frames arranged in a 3-2-2 grid on the dark background.

- [ ] **Step 5: Commit**

  ```bash
  git commit --allow-empty -m "design: create 8 Foundations section sub-frames"
  ```

---

### Task 11: Build Section 01 — Color System

**What:** Inside section s01, add color swatches for all color tokens. Each swatch = 40×40px rect + token name text below + hex/rgba value text.

Surface colors to show: `--aqb-surface-1` through `--aqb-surface-5`, `--aqb-bg-darker`.
Text colors: primary, secondary, tertiary, muted, disabled, inverse.
Border colors: subtle, default, light, hover, focus.
Status: error, success, warning, info + light variants.
Primary scale: primary, primary-hover, primary-active, primary-light, primary-muted.
Secondary scale: secondary, secondary-hover, secondary-light.

**Label style for subsection headers:** 10px, fontWeight 600, letterSpacing 1, color `"#908D85"` (text-muted).

- [ ] **Step 1: Add section header label**

  Call `mcp__pencil__batch_design` to insert a text label at the top of s01:
  ```
  I("S01_ID", { type:"text", content:"01 — COLOR SYSTEM", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 2: Add Surfaces subsection label + swatches**

  Call `mcp__pencil__batch_design`. Place subsection label "SURFACES" at y=60, then 6 swatches (40×40px each, 8px gap) starting at y=80 for surface-1 through surface-5 and bg-darker:
  ```
  I("S01_ID", { type:"text", content:"SURFACES", x:20, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  sw1=I("S01_ID", { type:"rect", x:20,  y:80, width:40, height:40, fill:"$--aqb-surface-1", cornerRadius:4 })
  sw2=I("S01_ID", { type:"rect", x:68,  y:80, width:40, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  sw3=I("S01_ID", { type:"rect", x:116, y:80, width:40, height:40, fill:"$--aqb-surface-3", cornerRadius:4 })
  sw4=I("S01_ID", { type:"rect", x:164, y:80, width:40, height:40, fill:"$--aqb-surface-4", cornerRadius:4 })
  sw5=I("S01_ID", { type:"rect", x:212, y:80, width:40, height:40, fill:"$--aqb-surface-5", cornerRadius:4 })
  sw6=I("S01_ID", { type:"rect", x:260, y:80, width:40, height:40, fill:"$--aqb-bg-darker",  cornerRadius:4 })
  I("S01_ID", { type:"text", content:"surface-1", x:20,  y:125, fontSize:9, fill:"$--aqb-text-muted" })
  I("S01_ID", { type:"text", content:"surface-2", x:68,  y:125, fontSize:9, fill:"$--aqb-text-muted" })
  I("S01_ID", { type:"text", content:"surface-3", x:116, y:125, fontSize:9, fill:"$--aqb-text-muted" })
  I("S01_ID", { type:"text", content:"surface-4", x:164, y:125, fontSize:9, fill:"$--aqb-text-muted" })
  I("S01_ID", { type:"text", content:"surface-5", x:212, y:125, fontSize:9, fill:"$--aqb-text-muted" })
  I("S01_ID", { type:"text", content:"bg-darker",  x:260, y:125, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 3: Add Status, Primary, Secondary swatches**

  Continue adding subsections for: Text colors (y≈180), Border colors (y≈320), Status colors (y≈460), Primary scale (y≈620), Secondary scale (y≈760). Follow the same swatch pattern: subsection label → 40×40px rects with `$--aqb-*` fill references → token name labels below.

  Use `$--aqb-text-primary`, `$--aqb-text-secondary`, `$--aqb-text-muted`, `$--aqb-text-disabled` for text swatches.
  Use `$--aqb-error`, `$--aqb-success`, `$--aqb-warning`, `$--aqb-info` for status swatches.
  Use `$--aqb-primary`, `$--aqb-primary-hover`, `$--aqb-primary-active`, `$--aqb-primary-light`, `$--aqb-primary-muted` for primary swatches.
  Use `$--aqb-secondary`, `$--aqb-secondary-light` for secondary swatches.

- [ ] **Step 4: Screenshot and verify**

  Call `mcp__pencil__get_screenshot` on `S01_ID`. Confirm colored swatches arranged in rows with labels visible.

- [ ] **Step 5: Commit**

  ```bash
  git commit --allow-empty -m "design: build Foundations Section 01 — Color System"
  ```

---

### Task 12: Build Section 02 — Spacing Scale

**What:** 11 horizontal bars of increasing width. Each bar: width = token value (space-0=0px minimum bar width of 4px, space-1=4px, up to space-16=64px). Bar height = token value (capped at 64px). Fill = `$--aqb-success` at 40% opacity (`rgba(34,197,94,0.4)`). Token name + px value label below.

- [ ] **Step 1: Add section header**

  ```
  I("S02_ID", { type:"text", content:"02 — SPACING SCALE", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 2: Add the 11 spacing bars**

  Call `mcp__pencil__batch_design`. Place bars left-to-right starting at x=20, y=60. Each bar spaced 80px apart (to leave room for label).

  Token values: 0→show as 4px wide (symbolic), 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
  Bar width = max(4, token_value). Bar height = min(64, token_value) — minimum 4px for space-0.

  > **Note on token references:** Pencil `width` and `height` properties do NOT support `$--aqb-*` variable references — only `fill`, `stroke`, `color`, `fontSize`, `fontWeight`, `cornerRadius`, and `shadow` accept token refs. The bar pixel dimensions here ARE the token values themselves (e.g., `width:32` represents `$--aqb-spacing-8 = 32px`). This section is a visual pixel-ruler illustration, not a token-referencing exercise.

  ```
  I("S02_ID", { type:"rect", x:20,  y:80, width:4,  height:4,  fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:100, y:80, width:4,  height:4,  fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:180, y:76, width:8,  height:8,  fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:260, y:72, width:12, height:12, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:340, y:68, width:16, height:16, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:420, y:64, width:20, height:20, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:500, y:60, width:24, height:24, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:580, y:52, width:32, height:32, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:660, y:44, width:40, height:40, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:740, y:36, width:48, height:48, fill:"rgba(34,197,94,0.4)" })
  I("S02_ID", { type:"rect", x:820, y:20, width:64, height:64, fill:"rgba(34,197,94,0.4)" })
  ```

- [ ] **Step 3: Add labels below each bar**

  ```
  I("S02_ID", { type:"text", content:"space-0\n0px",  x:20,  y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-1\n4px",  x:100, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-2\n8px",  x:180, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-3\n12px", x:260, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-4\n16px", x:340, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-5\n20px", x:420, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-6\n24px", x:500, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-8\n32px", x:580, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-10\n40px",x:660, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-12\n48px",x:740, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  I("S02_ID", { type:"text", content:"space-16\n64px",x:820, y:92, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 4: Screenshot and verify**

  Call `mcp__pencil__get_screenshot` on `S02_ID`. Confirm ascending bars with labels.

- [ ] **Step 5: Commit**

  ```bash
  git commit --allow-empty -m "design: build Foundations Section 02 — Spacing Scale"
  ```

---

### Task 13: Build Section 03 — Typography

**What:** Show font sizes (10 sizes), font weights (4), line heights (5), font families (Inter + JetBrains Mono). Each sample has a `--aqb-surface-2` background rect.

- [ ] **Step 1: Add section header + font-size samples**

  > **Note on micro/xs/sm:** All three share 12px in this spec. They are visually identical in pixel size; their semantic distinction (line-height, use-context) is documented in code, not in the design frame. The content label ("micro", "xs", "sm") is the differentiator here.

  Call `mcp__pencil__batch_design` with all header and font-size sample operations in one call:

  ```
  I("S03_ID", { type:"text", content:"03 — TYPOGRAPHY", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"text", content:"FONT SIZES", x:20, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"rect", x:20, y:80,  width:200, height:28, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"micro (12px)  — Sample Text", x:28, y:92,  fontSize:12, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:116, width:200, height:28, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"xs (12px)  — Sample Text", x:28, y:128, fontSize:12, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:152, width:200, height:28, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"sm (12px)  — Sample Text", x:28, y:164, fontSize:12, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:188, width:200, height:29, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"base (13px) — Sample Text", x:28, y:200, fontSize:13, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:225, width:200, height:30, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"md (14px)  — Sample Text", x:28, y:237, fontSize:14, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:263, width:200, height:32, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"lg (16px)  — Sample Text", x:28, y:275, fontSize:16, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:303, width:200, height:34, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"xl (18px)  — Sample Text", x:28, y:315, fontSize:18, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:345, width:200, height:36, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"2xl (20px) — Sample Text", x:28, y:357, fontSize:20, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:389, width:200, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"3xl (24px) — Sample Text", x:28, y:401, fontSize:24, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"rect", x:20, y:437, width:200, height:48, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"4xl (32px) — Sample", x:28, y:449, fontSize:32, fill:"$--aqb-text-primary" })
  ```

- [ ] **Step 2: Add font-weight samples**

  Place font-weight subsection below font-sizes at y=510 (4xl block ends at y≈493, 17px breathing room):
  ```
  I("S03_ID", { type:"text", content:"FONT WEIGHTS", x:20, y:510, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"rect", x:20,  y:530, width:340, height:60, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"Regular — Aa Sample Text", x:28, y:552, fontSize:14, fontWeight:400, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"text", content:"400", x:28, y:575, fontSize:9, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"rect", x:370, y:530, width:340, height:60, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"Medium — Aa Sample Text", x:378, y:552, fontSize:14, fontWeight:500, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"text", content:"500", x:378, y:575, fontSize:9, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"rect", x:720, y:530, width:340, height:60, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"SemiBold — Aa Sample Text", x:728, y:552, fontSize:14, fontWeight:600, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"text", content:"600", x:728, y:575, fontSize:9, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"rect", x:1070, y:530, width:340, height:60, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S03_ID", { type:"text", content:"Bold — Aa Sample Text", x:1078, y:552, fontSize:14, fontWeight:700, fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"text", content:"700", x:1078, y:575, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 3: Add font family samples**

  Place at y=680:
  ```
  I("S03_ID", { type:"text", content:"FONT FAMILIES", x:20, y:680, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S03_ID", { type:"text", content:"Inter — The quick brown fox (UI font)", x:20, y:700, fontSize:14, fontFamily:"Inter", fill:"$--aqb-text-primary" })
  I("S03_ID", { type:"text", content:"JetBrains Mono — const x = 42 (code font)", x:20, y:730, fontSize:14, fontFamily:"JetBrains Mono", fill:"$--aqb-text-primary" })
  ```

- [ ] **Step 4: Screenshot and verify**

  Call `mcp__pencil__get_screenshot` on `S03_ID`. Confirm typography samples visible in ascending size order.

- [ ] **Step 5: Commit**

  ```bash
  git commit --allow-empty -m "design: build Foundations Section 03 — Typography"
  ```

---

### Task 14: Build Sections 04, 05, 06 — Radius, Shadows, Borders

- [ ] **Step 1: Build Section 04 — Radius Scale**

  Add section header, then 7 squares (32×32px each, 16px gap) with cornerRadius values xs(3), sm(5), md(8), lg(12), xl(16), 2xl(24), full(∞):

  ```
  I("S04_ID", { type:"text", content:"04 — RADIUS SCALE", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"rect", x:20,  y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-xs" })
  I("S04_ID", { type:"rect", x:68,  y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-sm" })
  I("S04_ID", { type:"rect", x:116, y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-md" })
  I("S04_ID", { type:"rect", x:164, y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-lg" })
  I("S04_ID", { type:"rect", x:212, y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-xl" })
  I("S04_ID", { type:"rect", x:260, y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-2xl" })
  I("S04_ID", { type:"rect", x:308, y:60, width:32, height:32, fill:"$--aqb-primary", opacity:0.6, cornerRadius:"$--aqb-radius-full" })
  I("S04_ID", { type:"text", content:"xs\n3px",   x:20,  y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"sm\n5px",   x:68,  y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"md\n8px",   x:116, y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"lg\n12px",  x:164, y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"xl\n16px",  x:212, y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"2xl\n24px", x:260, y:100, fontSize:9, fill:"$--aqb-text-muted" })
  I("S04_ID", { type:"text", content:"full\n∞",   x:308, y:100, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 2: Build Section 05 — Shadows & Elevation**

  Add header, then 8 floating cards (80×60px, fill `$--aqb-surface-3`) with shadow values applied. Place cards in a row with 20px gaps, starting at y=60:

  ```
  I("S05_ID", { type:"text", content:"05 — SHADOWS & ELEVATION", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"rect", x:20,  y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-xs" })
  I("S05_ID", { type:"rect", x:120, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-sm" })
  I("S05_ID", { type:"rect", x:220, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-md" })
  I("S05_ID", { type:"rect", x:320, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-lg" })
  I("S05_ID", { type:"rect", x:420, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-xl" })
  I("S05_ID", { type:"rect", x:520, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-2xl" })
  I("S05_ID", { type:"rect", x:620, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-inner" })
  I("S05_ID", { type:"rect", x:720, y:60, width:80, height:60, fill:"$--aqb-surface-3", cornerRadius:6, shadow:"$--aqb-shadow-glow" })
  I("S05_ID", { type:"text", content:"xs",    x:20,  y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"sm",    x:120, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"md",    x:220, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"lg",    x:320, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"xl",    x:420, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"2xl",   x:520, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"inner", x:620, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  I("S05_ID", { type:"text", content:"glow",  x:720, y:130, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 3: Build Section 06 — Borders**

  Add header, then 5 horizontal rule lines (full section width, 1px height each), 20px apart, each with a surface-1 background strip for visibility:

  ```
  I("S06_ID", { type:"text", content:"06 — BORDERS", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S06_ID", { type:"rect", x:20, y:60,  width:1760, height:1,  fill:"$--aqb-border-subtle" })
  I("S06_ID", { type:"rect", x:20, y:100, width:1760, height:1,  fill:"$--aqb-border" })
  I("S06_ID", { type:"rect", x:20, y:140, width:1760, height:1,  fill:"$--aqb-border-light" })
  I("S06_ID", { type:"rect", x:20, y:180, width:1760, height:1,  fill:"$--aqb-border-hover" })
  I("S06_ID", { type:"rect", x:20, y:220, width:1760, height:1,  fill:"$--aqb-border-focus" })
  I("S06_ID", { type:"text", content:"border-subtle  rgba(255,255,255,0.06)", x:20, y:70,  fontSize:9, fill:"$--aqb-text-muted" })
  I("S06_ID", { type:"text", content:"border         rgba(255,255,255,0.08)", x:20, y:110, fontSize:9, fill:"$--aqb-text-muted" })
  I("S06_ID", { type:"text", content:"border-light   rgba(255,255,255,0.12)", x:20, y:150, fontSize:9, fill:"$--aqb-text-muted" })
  I("S06_ID", { type:"text", content:"border-hover   rgba(255,255,255,0.16)", x:20, y:190, fontSize:9, fill:"$--aqb-text-muted" })
  I("S06_ID", { type:"text", content:"border-focus   rgba(59,130,246,0.5)",   x:20, y:230, fontSize:9, fill:"$--aqb-text-muted" })
  ```

  > **Border token names (canonical):** The five names used in the code above are `--aqb-border-subtle`, `--aqb-border`, `--aqb-border-light`, `--aqb-border-hover`, `--aqb-border-focus`. These match the spec. Task 8 pre-flight verifies they exist in the Pencil file. If pre-flight found a different exact name for any of them, substitute that name in the `fill` references above before running batch_design.

- [ ] **Step 4: Screenshot each section**

  Call `mcp__pencil__get_screenshot` on S04_ID, S05_ID, S06_ID. Confirm each section looks correct.

- [ ] **Step 5: Commit**

  ```bash
  git commit --allow-empty -m "design: build Foundations Sections 04-06 (Radius, Shadows, Borders)"
  ```

---

### Task 15: Build Sections 07 and 08 — Motion & Layout Dimensions

- [ ] **Step 1: Build Section 07 — Motion & Easing**

  ```
  I("S07_ID", { type:"text", content:"07 — MOTION & EASING", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S07_ID", { type:"text", content:"DURATIONS", x:20, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  ```

  Then 6 duration boxes (100×40px each, fill `$--aqb-surface-2`, 12px gap) with labels:
  - instant: 50ms, fast: 100ms, normal: 150ms, medium: 200ms, slow: 300ms, slower: 400ms

  Place at y=80, each 112px apart:
  ```
  I("S07_ID", { type:"rect", x:20,  y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"instant\n50ms",  x:30,  y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  I("S07_ID", { type:"rect", x:132, y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"fast\n100ms",    x:142, y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  I("S07_ID", { type:"rect", x:244, y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"normal\n150ms",  x:254, y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  I("S07_ID", { type:"rect", x:356, y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"medium\n200ms",  x:366, y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  I("S07_ID", { type:"rect", x:468, y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"slow\n300ms",    x:478, y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  I("S07_ID", { type:"rect", x:580, y:80, width:100, height:40, fill:"$--aqb-surface-2", cornerRadius:4 })
  I("S07_ID", { type:"text", content:"slower\n400ms",  x:590, y:90, fontSize:9, fill:"$--aqb-text-secondary" })
  ```

  Add easing note below:
  ```
  I("S07_ID", { type:"text", content:"EASING", x:20, y:150, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S07_ID", { type:"text", content:"ease-default  cubic-bezier(0.4, 0, 0.2, 1)\nease-in       cubic-bezier(0.4, 0, 1, 1)\nease-out      cubic-bezier(0, 0, 0.2, 1)\nease-in-out   cubic-bezier(0.4, 0, 0.2, 1)\nAnimation values are reference only — apply in code via CSS variables", x:20, y:170, fontSize:9, fill:"$--aqb-text-secondary" })
  ```

- [ ] **Step 2: Build Section 08 — Layout Dimensions**

  Add 3 subsections: Shell dimensions, Z-index stack, Touch targets.

  ```
  I("S08_ID", { type:"text", content:"08 — LAYOUT DIMENSIONS", x:20, y:20, fontSize:10, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S08_ID", { type:"text", content:"SHELL", x:20, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S08_ID", { type:"text", content:"TopBar height:  52px  ($--aqb-header-height)\nRail width:     56px  ($--aqb-sidebar-width)\nPanel width:    280px ($--aqb-sidebar-panel-width)\nInspector:      300px ($--aqb-right-panel-width)\nFooter height:  40px  ($--aqb-footer-height)", x:20, y:80, fontSize:10, fill:"$--aqb-text-secondary" })
  I("S08_ID", { type:"text", content:"Z-INDEX STACK", x:500, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S08_ID", { type:"text", content:"base:     0\ndropdown: 100\nsticky:   200\noverlay:  300\nmodal:    400\npopover:  500\ntooltip:  600\ntoast:    700\nmax:      9999", x:500, y:80, fontSize:10, fill:"$--aqb-text-secondary" })
  I("S08_ID", { type:"text", content:"TOUCH TARGETS", x:1200, y:60, fontSize:9, fontWeight:600, letterSpacing:1, fill:"$--aqb-text-muted" })
  I("S08_ID", { type:"rect", x:1200, y:80,  width:44, height:44, fill:"$--aqb-surface-3", stroke:"$--aqb-primary", strokeWidth:1 })
  I("S08_ID", { type:"text", content:"44×44\nmin touch", x:1252, y:90, fontSize:9, fill:"$--aqb-text-muted" })
  I("S08_ID", { type:"rect", x:1200, y:140, width:44, height:30, fill:"$--aqb-surface-3", stroke:"$--aqb-border", strokeWidth:1 })
  I("S08_ID", { type:"text", content:"44×30\npanel input", x:1252, y:150, fontSize:9, fill:"$--aqb-text-muted" })
  ```

- [ ] **Step 3: Screenshot Foundations frame**

  Call `mcp__pencil__get_screenshot` on `FOUNDATIONS_ID`. Confirm all 8 sections visible with content.

- [ ] **Step 4: Commit**

  ```bash
  git commit --allow-empty -m "design: build Foundations Sections 07-08 — Foundations frame complete"
  ```

---

## Chunk 3: Screen Updates — Groups 1–3

### Pre-screen setup (run once before Task 16)

- [ ] **Pre-flight re-verify:** Call `mcp__pencil__get_variables()`. Confirm `--aqb-bg-darker` exists and border token names are correct. If `--aqb-bg-darker` is absent, call `mcp__pencil__set_variables` to add it (`value: '#08080e'`, `type: 'color'`) before processing any screen — same as Task 8. If border names differ from the replacement map (e.g., `--aqb-border-default` instead of `--aqb-border`), use the correct names in all subsequent U() calls.

- [ ] **Get editable screen IDs:** Call `mcp__pencil__batch_get` on the root (depth 1). Filter to frames whose names do NOT contain "Restored". Record the node IDs for screens 01–29 in order.

---

### Task 16: Screen Group 1 — App Shell (screens 01–04)

**For each screen: before screenshot → batch_get → batch_design replacements → after screenshot.**

**Replacement map summary for quick reference:**
- Fills: `#0f0f14`→`$--aqb-surface-1`, `#16161d`→`$--aqb-surface-2`, `#1e1e26`→`$--aqb-surface-3`, `#26262f`→`$--aqb-surface-4`, `#2e2e38`→`$--aqb-surface-5`, `#08080e`→`$--aqb-bg-darker`
- Text fills: `#F5F5F0`→`$--aqb-text-primary`, `#B8B5AD`→`$--aqb-text-secondary`, `#908D85`→`$--aqb-text-muted`, `#6B6963`→`$--aqb-text-disabled`
- Borders/strokes: `rgba(255,255,255,0.08)`→`$--aqb-border`, `rgba(255,255,255,0.12)`→`$--aqb-border-light`, `rgba(255,255,255,0.06)`→`$--aqb-border-subtle`
- Brand: `#6366f1`→`$--aqb-primary`, `#22c55e`→`$--aqb-success`, `#ef4444`→`$--aqb-error`, `#f59e0b`→`$--aqb-warning`, `#3b82f6`→`$--aqb-info`
- Radius: `cornerRadius:3`→`$--aqb-radius-xs`, `:5`→`$--aqb-radius-sm`, `:8`→`$--aqb-radius-md`, `:12`→`$--aqb-radius-lg`
- Font size: `fontSize:12`→`$--aqb-text-xs`, `:13`→`$--aqb-text-base`, `:14`→`$--aqb-text-md`, `:16`→`$--aqb-text-lg`
- Font weight: `fontWeight:400`→`$--aqb-font-normal`, `:500`→`$--aqb-font-medium`, `:600`→`$--aqb-font-semibold`, `:700`→`$--aqb-font-bold`
- Shadows: `shadow` property → `$--aqb-shadow-xs`, `$--aqb-shadow-sm`, `$--aqb-shadow-md`, `$--aqb-shadow-lg`, `$--aqb-shadow-xl`, `$--aqb-shadow-2xl`, `$--aqb-shadow-inner`, `$--aqb-shadow-glow` (call `get_variables()` and retrieve the CSS values of these tokens from the pre-flight result; match each node's shadow property value against those to pick the correct token name. Screen 18 Floating Toolbar is the primary consumer.)

> **Note — gap/padding excluded (spec departure):** The spec's replacement map includes five gap/padding entries (`gap:8→$--aqb-space-2`, `gap:16→$--aqb-space-4`, `padding:8→$--aqb-space-2`, `padding:12→$--aqb-space-3`, `padding:16→$--aqb-space-4`). These have been removed from this plan based on confirmed Pencil tool behavior: `gap` and `padding` do NOT accept `$--aqb-*` token refs. Only `fill`, `stroke`, `color`, `fontSize`, `fontWeight`, `cornerRadius`, and `shadow` support token references. Gap and padding values remain as raw integers in this phase.

- [ ] **Screen 01 — Editor Shell**

  ```
  # Before
  get_screenshot(SCREEN_01_ID)

  # Read
  batch_get(SCREEN_01_ID, readDepth:3)

  # Replace — for each node with a hardcoded value in the map:
  batch_design("
    U('nodeId', { fill: '$--aqb-surface-1' })
    U('nodeId', { fill: '$--aqb-surface-2' })
    ... [all matching nodes]
  ")

  # After
  get_screenshot(SCREEN_01_ID) — confirm visually unchanged
  ```

- [ ] **Screen 02 — Top Bar**

  Repeat the before → read → replace → after pattern. Focus: 52px height nodes, background fill, text fills, button fills.

- [ ] **Screen 03 — Navigation Rail**

  Focus: 56px width, icon fills, active/hover state fills.

- [ ] **Screen 04 — Panel Header**

  Focus: 48px height node, border-bottom stroke, font sizes (12, 13, 14), font weights.

- [ ] **Commit Group 1**

  ```bash
  git commit --allow-empty -m "design: apply token references to screens 01-04 (App Shell)"
  ```

---

### Task 17: Screen Group 2 — Left Panel Tabs (screens 05–14)

**Follow the same before → read → replace → after pattern for each screen.**

- [ ] **Screen 05 — Build Tab:** section fills, text fills, border values
- [ ] **Screen 06 — Media Tab:** card fills, badge fills, text fills
- [ ] **Screen 07 — Layers Tab:** tree row fills, text fills
- [ ] **Screen 08 — Templates Tab:** thumbnail background fills, text fills, radius values
- [ ] **Screen 09 — Pages Tab:** row fills, text fills, border values
- [ ] **Screen 10 — Components Tab:** section fills, text fills
- [ ] **Screen 11 — Design System Tab:** fills, text fills, border values
- [ ] **Screen 12 — Settings Tab:** section fills, input areas, text fills
- [ ] **Screen 13 — Publish Tab:** fills, text fills, status colors
- [ ] **Screen 14 — History Tab:** row fills, text fills, timestamp text fills

- [ ] **Commit Group 2**

  ```bash
  git commit --allow-empty -m "design: apply token references to screens 05-14 (Left Panel Tabs)"
  ```

---

### Task 18: Screen Group 3 — Canvas & Toolbar (screens 15–19)

- [ ] **Screen 15 — Canvas Default States:** canvas background, grid line fills
- [ ] **Screen 16 — Canvas Selection States:** selection highlight nodes use `$--aqb-info` (value `#3b82f6`); canvas fill, handle fills
- [ ] **Screen 17 — Canvas Overlays:** guide line fills, snap indicator fills
- [ ] **Screen 18 — Floating Toolbar & Context Menu:** toolbar background fills, shadow references, text fills, border values
- [ ] **Screen 19 — Canvas Footer Toolbar:** 40px height node, background fill, text fills, border-top stroke

- [ ] **Commit Group 3**

  ```bash
  git commit --allow-empty -m "design: apply token references to screens 15-19 (Canvas & Toolbar)"
  ```

---

## Chunk 4: Screen Updates — Groups 4–5 + Final Verification

### Task 19: Screen Group 4 — Inspector (screens 20–24)

- [ ] **Screen 20 — Inspector Header:** tab bar fill, border-bottom, font sizes, font weights
- [ ] **Screen 21 — Inspector Layout Tab:** input background nodes use `$--aqb-input-bg`; input border nodes use `$--aqb-input-border`; label font sizes, row fills
- [ ] **Screen 22 — Inspector Appearance Tab:** color swatch fills, section fills, text fills
- [ ] **Screen 23 — Inspector Effects Tab:** shadow value label fills, section fills, text fills
- [ ] **Screen 24 — Inspector Multi-Select:** selection highlight fill, summary text fills

- [ ] **Commit Group 4**

  ```bash
  git commit --allow-empty -m "design: apply token references to screens 20-24 (Inspector)"
  ```

---

### Task 20: Screen Group 5 — Overlays & Surfaces (screens 25–29)

- [ ] **Screen 25 — Modals Catalog:** overlay background fill, modal background fill, button fills, text fills, radius values
- [ ] **Screen 26 — Onboarding Flow:** step indicator fills (primary colors), background fills, text fills
- [ ] **Screen 27 — Command Palette & Shortcuts:** palette background fill, input area fill (`$--aqb-input-bg`, `$--aqb-input-border`), item fills, text fills
- [ ] **Screen 28 — CMS Surfaces:** surface fills, text fills, border values
- [ ] **Screen 29 — AI Surfaces:** apply standard surface, text, and border token replacements from the map. No AI-specific tokens exist in this phase.

- [ ] **Commit Group 5**

  ```bash
  git commit --allow-empty -m "design: apply token references to screens 25-29 (Overlays & Surfaces)"
  ```

---

### Task 21: Final verification

- [ ] **Step 1: Take screenshots of all 29 screens**

  For each of the 29 editable screens, call `mcp__pencil__get_screenshot`. Confirm each looks visually identical to its before-state from the earlier steps.

- [ ] **Step 2: Verify token completeness**

  Call `mcp__pencil__get_variables()`. Confirm final token count is 131–135 (75 original + 56–60 new).

- [ ] **Step 3: Screenshot the Foundations frame**

  Call `mcp__pencil__get_screenshot` on `FOUNDATIONS_ID`. Confirm all 8 sections are populated.

- [ ] **Step 4: Final commit**

  ```bash
  git commit --allow-empty -m "design: Phase 1 Foundations complete — tokens added, Foundations frame built, 29 screens tokenized"
  ```

---

## Success Checklist

- [ ] 56 confirmed tokens added (spacing, text-size, font-weight, line-height, z-index, layout, panel, input)
- [ ] Up to 4 conditional color tokens added (only those absent from pre-flight audit)
- [ ] `--aqb-primary-muted` confirmed as `rgba(99,102,241,0.08)`
- [ ] `🏗️ Foundations` frame exists with 8 sections at exact grid positions, visually verified
- [ ] All 29 editable screens have replacement-map values swapped for `$--aqb-*` references
- [ ] Before/after screenshots for all 29 screens show no visual change
- [ ] Restored frames (32 total) were never touched
