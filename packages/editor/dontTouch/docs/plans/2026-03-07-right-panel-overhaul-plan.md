# Right Panel Full Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the right inspector panel from chunky/messy to clean/logical through 3 sequential phases: density fixes → progressive disclosure → structural tab changes.

**Architecture:** Phase 1 is invisible code quality (no UX change). Phase 2 wires existing `useAdvancedSettings` + `MoreSettingsToggle` infrastructure to registry-driven `tier` field. Phase 3 renames tabs, creates `ElementSettingsFooter`, eliminates `SettingsTab`.

**Tech Stack:** React 18, TypeScript 5.3, Emotion CSS-in-JS, Vitest. All in `src/editor/inspector/`.

**Design doc:** `docs/plans/2026-03-07-right-panel-overhaul-design.md`

---

## PHASE 1 — Foundation (Code Quality + Density)

---

### Task 1: Merge sharedStyles + baseStyles — compact density values

**Files:**
- Modify: `src/editor/inspector/shared/controls/controlStyles.ts`

**Step 1: Open the file and locate both style objects**

Read `src/editor/inspector/shared/controls/controlStyles.ts`. You will see `sharedStyles` (lines ~42–85) and `baseStyles` (lines ~91–219). We are deleting `sharedStyles` and patching `baseStyles` to compact values.

**Step 2: Replace the sharedStyles block and patch baseStyles**

In `controlStyles.ts`, delete the entire `export const sharedStyles = { ... }` block (lines 42–85).

Then patch these values inside `baseStyles`:

```ts
// baseStyles.row — change marginBottom and gap
row: {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: 6,           // was: "var(--aqb-panel-section-gap, 8px)"
  marginBottom: 6,  // was: 12
},

// baseStyles.label — change minWidth and fontSize
label: {
  fontSize: 11,     // was: "var(--aqb-panel-label-size, 12px)"
  color: INSPECTOR_TOKENS.textTertiary,
  fontWeight: 500,  // was: "var(--aqb-panel-label-weight, 500)"
  minWidth: 56,     // was: 70
  flexShrink: 0,
},

// baseStyles.input — tighten padding and radius
input: {
  flex: 1,
  padding: "4px 8px",   // was: "8px 10px"
  background: INSPECTOR_TOKENS.surfaceInput,
  border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
  borderRadius: 4,      // was: 6
  color: INSPECTOR_TOKENS.textPrimary,
  fontSize: 12,
  outline: "none",
  transition: "border-color 0.2s",
},

// baseStyles.sectionHeader — tighten padding
sectionHeader: (isOpen: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px 14px",   // was: "14px 16px"
  background: isOpen ? INSPECTOR_TOKENS.accentAlpha10 : "transparent",
  borderBottom: isOpen ? `1px solid ${INSPECTOR_TOKENS.borderSubtle}` : "none",
  color: isOpen ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textSecondary,
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  transition: "all 0.2s",
}),

// baseStyles.select — tighten padding
select: {
  flex: 1,
  padding: "4px 8px",   // was: "8px 10px"
  background: INSPECTOR_TOKENS.surfaceInput,
  border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
  borderRadius: 4,      // was: 6
  color: INSPECTOR_TOKENS.textPrimary,
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  paddingRight: 24,     // was: 30
},

// baseStyles.unitSelect — tighten padding
unitSelect: {
  width: 50,
  padding: "4px 4px",   // was: "8px 4px"
  background: INSPECTOR_TOKENS.surfaceInput,
  border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
  borderLeft: "none",
  borderRadius: "0 4px 4px 0",   // was: "0 6px 6px 0"
  color: INSPECTOR_TOKENS.textTertiary,
  fontSize: 12,
  outline: "none",
  cursor: "pointer",
},

// baseStyles.inputWithUnit — tighten padding
inputWithUnit: {
  flex: 1,
  padding: "4px 8px",   // was: "8px 10px"
  background: INSPECTOR_TOKENS.surfaceInput,
  border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
  borderRadius: "4px 0 0 4px",   // was: "6px 0 0 6px"
  color: INSPECTOR_TOKENS.textPrimary,
  fontSize: 12,
  outline: "none",
},

// baseStyles.buttonGroupItem — tighten padding
buttonGroupItem: (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "5px 8px",   // was: "8px 12px"
  background: active ? INSPECTOR_TOKENS.accentAlpha20 : "transparent",
  border: "none",
  borderRadius: 4,
  color: active ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.15s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
}),
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: errors only about `sharedStyles` being missing (we fix those next). Zero errors if nothing imported `sharedStyles`.

**Step 4: Commit**

```bash
git add src/editor/inspector/shared/controls/controlStyles.ts
git commit -m "refactor(inspector): merge sharedStyles into baseStyles with compact density values

Row margin 12→6px, input padding 8px10px→4px8px, section header 14px→10px.
Deletes sharedStyles export — all callers migrated in next commit."
```

---

### Task 2: Migrate sharedStyles importers to baseStyles

**Files:**
- Search all files in `src/editor/inspector/` that import `sharedStyles`

**Step 1: Find all sharedStyles importers**

```bash
grep -r "sharedStyles" src/editor/inspector/ --include="*.ts" --include="*.tsx" -l
```

**Step 2: For each file found**

Replace any usage of `sharedStyles.row` with `baseStyles.row`, `sharedStyles.label` with `baseStyles.label`, `sharedStyles.input` with `baseStyles.input`, etc.

Also update the import line: remove `sharedStyles` from the import, keep `baseStyles` if already there or add it.

Example transformation:
```ts
// Before
import { sharedStyles, INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
// ...
<div style={sharedStyles.row}>

// After
import { baseStyles, INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
// ...
<div style={baseStyles.row}>
```

**Step 3: Verify TypeScript clean**

```bash
npx tsc --noEmit 2>&1 | grep "sharedStyles"
```

Expected: no output (zero sharedStyles errors).

**Step 4: Run tests**

```bash
npx vitest run 2>&1 | tail -20
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(inspector): migrate all sharedStyles usages to baseStyles"
```

---

### Task 3: Delete dead DesignTab.tsx

**Files:**
- Delete: `src/editor/inspector/tabs/DesignTab.tsx`
- Modify: `src/editor/inspector/tabs/index.ts`

**Step 1: Confirm zero external callers**

```bash
grep -r "DesignTab" src/ --include="*.ts" --include="*.tsx"
```

Expected output: only lines inside `tabs/DesignTab.tsx` and `tabs/index.ts` itself. If any other file imports `DesignTab`, update it first (should not exist since AppearanceTab + EffectsTab replaced it).

**Step 2: Remove from barrel**

Open `src/editor/inspector/tabs/index.ts`. Remove any export line referencing `DesignTab`.

**Step 3: Delete the file**

```bash
rm src/editor/inspector/tabs/DesignTab.tsx
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

**Step 5: Commit**

```bash
git add src/editor/inspector/tabs/index.ts
git rm src/editor/inspector/tabs/DesignTab.tsx
git commit -m "refactor(inspector): delete dead DesignTab.tsx

243 lines duplicating AppearanceTab + EffectsTab combined. Never imported
after the tab split. Confirmed zero callers."
```

---

### Task 4: Delete @deprecated functions in sectionConfig.ts

**Files:**
- Modify: `src/editor/inspector/shared/sectionConfig.ts`

**Step 1: Confirm zero callers**

```bash
grep -r "getLayoutSectionsForElement\|getDesignSectionsForElement" src/ --include="*.ts" --include="*.tsx"
```

Expected: only the function definitions in `sectionConfig.ts`. If callers exist, grep them, then remove the call sites before proceeding.

**Step 2: Delete the two deprecated functions**

Remove from `sectionConfig.ts`:
- `getLayoutSectionsForElement` function (~lines 246–249)
- `getDesignSectionsForElement` function (~lines 253–258)
- The `LegacyLayoutSectionName` type (line ~59)
- The `LegacyDesignSectionName` type (line ~60)
- The `LAYOUT_ELEMENT_SECTIONS` constant (lines ~62–64)
- The `DESIGN_ELEMENT_SECTIONS` constant (lines ~66–68)
- The `// LEGACY MAPS` comment block

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

**Step 4: Commit**

```bash
git add src/editor/inspector/shared/sectionConfig.ts
git commit -m "refactor(inspector): delete deprecated legacy section helpers

getLayoutSectionsForElement and getDesignSectionsForElement ignored their
argument and returned hardcoded arrays. Zero callers confirmed."
```

---

### Task 5: Rename styles/index.tsx to styles/index.ts

**Files:**
- Rename: `src/editor/inspector/styles/index.tsx` → `src/editor/inspector/styles/index.ts`

**Step 1: Confirm no JSX in the file**

```bash
grep -n "React\|jsx\|<" src/editor/inspector/styles/index.tsx
```

Expected: only the `import type * as React from "react"` line and some `React.CSSProperties` type references. No JSX elements.

**Step 2: Rename**

```bash
git mv src/editor/inspector/styles/index.tsx src/editor/inspector/styles/index.ts
```

**Step 3: Update any imports that reference `.tsx`**

```bash
grep -r "styles/index" src/editor/inspector/ --include="*.ts" --include="*.tsx"
```

Imports without extension auto-resolve — no changes needed unless explicitly importing with `.tsx` extension.

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

Expected: zero errors.

**Step 5: Commit**

```bash
git commit -m "refactor(inspector): rename styles/index.tsx → .ts (no JSX in file)"
```

---

### Task 6: Remove duplicate background-color from propertiesRegistry.ts

**Files:**
- Modify: `src/editor/inspector/config/propertiesRegistry.ts`

**Step 1: Find the duplicate**

```bash
grep -n "background-color" src/editor/inspector/config/propertiesRegistry.ts
```

Expected: two lines — one under `colors.backgroundColor` and one under `background.backgroundColor`.

**Step 2: Check callers of colors.backgroundColor**

```bash
grep -r "colors\.backgroundColor" src/ --include="*.ts" --include="*.tsx"
```

If callers exist, update them to use `background.backgroundColor` first.

**Step 3: Delete the duplicate entry**

In `propertiesRegistry.ts`, find and delete this block entirely:

```ts
"colors.backgroundColor": {
  css: "background-color",
  type: "tokenColor",
  token: "color",
  responsive: true,
  states: true,
},
```

Keep `background.backgroundColor` — that is the correct entry.

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 5: Commit**

```bash
git add src/editor/inspector/config/propertiesRegistry.ts
git commit -m "fix(inspector): remove duplicate background-color property registration

colors.backgroundColor and background.backgroundColor both mapped to the
same CSS property. Removed colors.backgroundColor — background namespace
is the canonical home."
```

---

### Task 7: Fix hardcoded expandAll IDs in useInspectorSections.ts

**Files:**
- Modify: `src/editor/inspector/config/index.ts`
- Modify: `src/editor/inspector/hooks/useInspectorSections.ts`

**Step 1: Add ALL_SECTION_IDS to config/index.ts**

Open `src/editor/inspector/config/index.ts`. Add this export:

```ts
/** Canonical list of all inspector section IDs — used by expandAll() */
export const ALL_SECTION_IDS = [
  "layout",
  "size",
  "spacing",
  "typography",
  "background",
  "border",
  "effects",
  "animation",
  "interactions",
  "visibility",
] as const;

export type SectionId = (typeof ALL_SECTION_IDS)[number];
```

**Step 2: Use ALL_SECTION_IDS in useInspectorSections.ts**

In `src/editor/inspector/hooks/useInspectorSections.ts`, find the `expandAll` function (~line 124):

```ts
// Before
const expandAll = React.useCallback(() => {
  const allSections = new Set([
    "layout",
    "size",
    "spacing",
    "typography",
    "background",
    "border",
    "effects",
  ]);
  // ...
```

Replace with:

```ts
import { ALL_SECTION_IDS } from "../config";

// ...

const expandAll = React.useCallback(() => {
  const allSections = new Set<string>(ALL_SECTION_IDS);
  setExpandedSections(allSections);
  userHasModifiedRef.current = true;
  saveUserPreferences(allSections);
}, [saveUserPreferences]);
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 4: Commit**

```bash
git add src/editor/inspector/config/index.ts src/editor/inspector/hooks/useInspectorSections.ts
git commit -m "fix(inspector): derive expandAll section IDs from canonical config constant

Hardcoded array in expandAll() silently excluded new sections. Now uses
ALL_SECTION_IDS from config — adding a section only requires one change."
```

---

### Task 8: Fix VisibilitySection — local styles + hardcoded breakpoints

**Files:**
- Modify: `src/editor/inspector/sections/VisibilitySection.tsx`

**Step 1: Check shared breakpoints type**

```bash
cat src/shared/types/breakpoints.ts
```

Find the exported breakpoint constants/types to import.

**Step 2: Replace local styles object**

In `VisibilitySection.tsx`, the local `styles` object (lines ~65–146) has `styles.row`, `styles.label` etc. Replace those with `baseStyles` from `controlStyles.ts`.

At top of file, add:
```ts
import { baseStyles } from "../shared/controls/controlStyles";
```

Replace `styles.row` → `baseStyles.row`, `styles.label` → `baseStyles.label` where they apply to generic layout. Keep only the toggle-specific styles (`.toggle`, `.toggleKnob`) as local since those are unique to this section.

**Step 3: Import breakpoints from shared types**

Replace the local `BREAKPOINTS` array:

```ts
// Before — hardcoded
const BREAKPOINTS: Breakpoint[] = [
  { id: "desktop", label: "Desktop", icon: "🖥️", minWidth: 1024, maxWidth: null, cssClass: "hide-desktop" },
  { id: "tablet", label: "Tablet", icon: "📱", minWidth: 768, maxWidth: 1023, cssClass: "hide-tablet" },
  { id: "mobile", label: "Mobile", icon: "📲", minWidth: null, maxWidth: 767, cssClass: "hide-mobile" },
];
```

Check what `src/shared/types/breakpoints.ts` exports. If it exports breakpoint definitions with the same IDs (`desktop`, `tablet`, `mobile`), import and use them. If the shape differs, create a local adapter that maps from the shared type — but never hardcode `1024`, `768`, `767` directly.

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Run tests**

```bash
npx vitest run 2>&1 | tail -10
```

**Step 6: Commit**

```bash
git add src/editor/inspector/sections/VisibilitySection.tsx
git commit -m "refactor(inspector): fix VisibilitySection — use baseStyles + shared breakpoints

Replaces local style object with baseStyles (visual consistency).
Removes hardcoded 1024/768/767 breakpoint values — imports from shared types."
```

---

### Task 9: Delete shared/Controls.tsx barrel and migrate callers

**Files:**
- Delete: `src/editor/inspector/shared/Controls.tsx`
- Modify: all files that import from `../shared/Controls` or `../../shared/Controls`

**Step 1: Find all callers**

```bash
grep -r "from.*shared/Controls" src/editor/inspector/ --include="*.ts" --include="*.tsx"
```

**Step 2: Migrate each caller to direct imports**

The barrel re-exports from `./controls/`. For each file, replace the import path:

```ts
// Before
import { Section, ControlRow, FourSideInput } from "../shared/Controls";

// After — direct imports
import { Section } from "../shared/controls/Section";
import { ControlRow } from "../shared/controls/ControlRow";
import { FourSideInput } from "../shared/controls/SpacingControls";
```

Or use the barrel index (which is correct):
```ts
import { Section, ControlRow, FourSideInput } from "../shared/controls";
```

The `shared/controls/index.ts` barrel already exports everything — use that.

**Step 3: Delete the file**

```bash
git rm src/editor/inspector/shared/Controls.tsx
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors.

**Step 5: Commit**

```bash
git commit -m "refactor(inspector): delete shared/Controls.tsx pass-through barrel

Its own comment said to prefer direct imports. All callers now import from
shared/controls/ directly (or via the controls/index.ts barrel)."
```

---

### Task 10: Move sectionConfig.ts + cssContext.ts to config/

**Files:**
- Rename: `src/editor/inspector/shared/sectionConfig.ts` → `src/editor/inspector/config/sectionConfig.ts`
- Rename: `src/editor/inspector/shared/cssContext.ts` → `src/editor/inspector/config/cssContext.ts`
- Modify: all importers

**Step 1: Find all importers**

```bash
grep -r "shared/sectionConfig\|shared/cssContext" src/editor/inspector/ --include="*.ts" --include="*.tsx"
```

**Step 2: Move the files**

```bash
git mv src/editor/inspector/shared/sectionConfig.ts src/editor/inspector/config/sectionConfig.ts
git mv src/editor/inspector/shared/cssContext.ts src/editor/inspector/config/cssContext.ts
```

**Step 3: Update all import paths**

For every file found in Step 1, replace `../shared/sectionConfig` with `../config/sectionConfig` (adjust `..` depth as needed). Same for `cssContext`.

**Step 4: Export from config/index.ts**

Add re-exports to `src/editor/inspector/config/index.ts`:
```ts
export * from "./sectionConfig";
export * from "./cssContext";
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 6: Commit**

```bash
git commit -m "refactor(inspector): move sectionConfig + cssContext to config/

These are configuration/logic files, not UI primitives.
shared/ is now exclusively UI primitives + types."
```

---

### Task 11: Delete flexbox/styles.ts and elementProperties/styles.ts

**Files:**
- Delete: `src/editor/inspector/sections/flexbox/styles.ts`
- Delete: `src/editor/inspector/sections/elementProperties/styles.ts`
- Modify: their importers

**Step 1: Find importers**

```bash
grep -r "flexbox/styles\|elementProperties/styles" src/editor/inspector/ --include="*.ts" --include="*.tsx"
```

**Step 2: Migrate generic styles to baseStyles**

For each importer, check what it uses from the local styles file:
- Generic row/label/input styles → replace with `baseStyles` from `controlStyles.ts`
- Section-specific styles (unique shapes, custom backgrounds) → inline them directly

**Step 3: Delete the files**

```bash
git rm src/editor/inspector/sections/flexbox/styles.ts
git rm src/editor/inspector/sections/elementProperties/styles.ts
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**

```bash
git commit -m "refactor(inspector): delete local section styles.ts files

flexbox/styles.ts and elementProperties/styles.ts duplicated generic
row/label/input styles from controlStyles.ts. Callers now use baseStyles."
```

---

### Task 12: Rename typography/TextControls.tsx to TypographyControls.tsx

**Files:**
- Rename: `src/editor/inspector/sections/typography/TextControls.tsx` → `TypographyControls.tsx`
- Modify: `src/editor/inspector/sections/typography/index.tsx`

**Step 1: Rename**

```bash
git mv src/editor/inspector/sections/typography/TextControls.tsx \
       src/editor/inspector/sections/typography/TypographyControls.tsx
```

**Step 2: Update import in typography/index.tsx**

```ts
// Before
import { TextControls } from "./TextControls";

// After
import { TypographyControls } from "./TypographyControls";
```

Update any other importers found with:
```bash
grep -r "typography/TextControls" src/ --include="*.ts" --include="*.tsx"
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 4: Run full test suite — Phase 1 complete**

```bash
npx vitest run
```

Expected: all tests pass.

**Step 5: Commit**

```bash
git commit -m "refactor(inspector): rename TextControls → TypographyControls

Resolves naming collision with shared/controls/TextControls.tsx.
typography/TypographyControls.tsx is unambiguously scoped to typography."
```

---

## PHASE 2 — Progressive Disclosure (Registry-Driven)

---

### Task 13: Add tier field to PropertyDefinition and classify all properties

**Files:**
- Modify: `src/editor/inspector/config/propertiesRegistry.ts`

**Step 1: Add tier to the interface**

Find `export interface PropertyDefinition` and add the `tier` field:

```ts
export interface PropertyDefinition {
  css?: string;
  uiOnly?: boolean;
  type: PropertyType;
  token?: string;
  units?: string[];
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  responsive: boolean;
  states: boolean;
  /** "basic" = shown by default. "advanced" = hidden behind More settings toggle. */
  tier: "basic" | "advanced";
}
```

**Step 2: Classify every property**

Apply `tier` to every property entry. Rules:
- `tier: "basic"` — used by >80% of elements in daily work
- `tier: "advanced"` — developer/edge-case, rarely needed

Complete classification list:

```ts
// LAYOUT / DISPLAY
"layout.display":       { ..., tier: "basic" },
"layout.visibility":    { ..., tier: "advanced" },
"layout.boxSizing":     { ..., tier: "advanced" },
"layout.isolation":     { ..., tier: "advanced" },
"layout.contain":       { ..., tier: "advanced" },

// SPACING
"spacing.margin":       { ..., tier: "basic" },
"spacing.padding":      { ..., tier: "basic" },
"spacing.negativeMargin": { ..., tier: "advanced" },
"layout.gap":           { ..., tier: "basic" },
"spacing.rowGap":       { ..., tier: "advanced" },
"spacing.columnGap":    { ..., tier: "advanced" },

// SIZE
"size.width":           { ..., tier: "basic" },
"size.height":          { ..., tier: "basic" },
"size.minWidth":        { ..., tier: "advanced" },
"size.maxWidth":        { ..., tier: "advanced" },
"size.minHeight":       { ..., tier: "advanced" },
"size.maxHeight":       { ..., tier: "advanced" },
"size.aspectRatio":     { ..., tier: "advanced" },

// POSITION
"position.position":    { ..., tier: "basic" },
"position.anchorUI":    { ..., tier: "basic" },
"position.inset":       { ..., tier: "basic" },
"position.zIndex":      { ..., tier: "advanced" },

// OVERFLOW
"overflow.overflow":    { ..., tier: "basic" },
"overflow.overflowX":   { ..., tier: "advanced" },
"overflow.overflowY":   { ..., tier: "advanced" },
"overflow.scrollBehavior":   { ..., tier: "advanced" },
"overflow.scrollSnapType":   { ..., tier: "advanced" },
"overflow.scrollSnapAlign":  { ..., tier: "advanced" },

// FLEX
"flex.direction":       { ..., tier: "basic" },
"flex.justify":         { ..., tier: "basic" },
"flex.align":           { ..., tier: "basic" },
"flex.wrap":            { ..., tier: "basic" },
"flex.alignContent":    { ..., tier: "advanced" },
"flex.childGrow":       { ..., tier: "basic" },
"flex.childShrink":     { ..., tier: "advanced" },
"flex.childBasis":      { ..., tier: "advanced" },
"flex.childOrder":      { ..., tier: "advanced" },
"flex.childAlignSelf":  { ..., tier: "basic" },

// GRID
"grid.columns":         { ..., tier: "basic" },
"grid.rows":            { ..., tier: "basic" },
"grid.areas":           { ..., tier: "advanced" },
"grid.autoFlow":        { ..., tier: "advanced" },
"grid.autoRows":        { ..., tier: "advanced" },
"grid.autoCols":        { ..., tier: "advanced" },
"grid.placeItems":      { ..., tier: "basic" },
"grid.placeContent":    { ..., tier: "advanced" },
"grid.placeSelf":       { ..., tier: "advanced" },
"grid.itemPlacement":   { ..., tier: "basic" },

// TYPOGRAPHY
"typography.fontFamily":   { ..., tier: "basic" },
"typography.fontSize":     { ..., tier: "basic" },
"typography.fontWeight":   { ..., tier: "basic" },
"typography.lineHeight":   { ..., tier: "basic" },
"typography.textAlign":    { ..., tier: "basic" },
"typography.letterSpacing": { ..., tier: "advanced" },
"typography.textTransform": { ..., tier: "basic" },
"typography.textDecoration": { ..., tier: "basic" },
"typography.whiteSpace":   { ..., tier: "advanced" },
"typography.wordBreak":    { ..., tier: "advanced" },
"typography.overflowWrap": { ..., tier: "advanced" },
"typography.textOverflow": { ..., tier: "advanced" },
"typography.textShadow":   { ..., tier: "advanced" },

// COLORS
"colors.textColor":        { ..., tier: "basic" },
"colors.mixBlendMode":     { ..., tier: "advanced" },

// BACKGROUND
"background.backgroundColor":  { ..., tier: "basic" },
"background.backgroundImage":  { ..., tier: "basic" },
"background.gradientPreset":   { ..., tier: "basic" },
"background.size":             { ..., tier: "basic" },
"background.position":         { ..., tier: "basic" },
"background.repeat":           { ..., tier: "advanced" },
"background.attachment":       { ..., tier: "advanced" },
"background.clip":             { ..., tier: "advanced" },
"background.origin":           { ..., tier: "advanced" },

// BORDER
"border.border":         { ..., tier: "basic" },
"border.radius":         { ..., tier: "basic" },
"border.borderTop":      { ..., tier: "advanced" },
"border.borderRight":    { ..., tier: "advanced" },
"border.borderBottom":   { ..., tier: "advanced" },
"border.borderLeft":     { ..., tier: "advanced" },
"border.outline":        { ..., tier: "advanced" },
"border.outlineOffset":  { ..., tier: "advanced" },

// EFFECTS
"effects.opacity":       { ..., tier: "basic" },
"effects.shadowPreset":  { ..., tier: "basic" },
"effects.boxShadow":     { ..., tier: "basic" },
"effects.filter":        { ..., tier: "advanced" },
"effects.backdropFilter": { ..., tier: "advanced" },
"effects.transformPreset": { ..., tier: "basic" },
"effects.transform":     { ..., tier: "advanced" },
"effects.clipPath":      { ..., tier: "advanced" },

// MOTION
"motion.transitionPreset": { ..., tier: "basic" },
"motion.transition":     { ..., tier: "advanced" },
"motion.animation":      { ..., tier: "basic" },
"motion.modalAnimationPreset": { ..., tier: "advanced" },

// All other properties (content, link, media, attributes, a11y, classes,
// interactions, data, visibilityRules, allCss, icon, modal, tabs,
// accordion, slider, navbar, form, button) → tier: "basic" unless
// they are developer-only edge cases (set those to "advanced")
```

**Step 3: Add helper function**

At the bottom of the file, add:

```ts
/**
 * Get all advanced property IDs for a section group
 * Used by useAdvancedSettings for search-based auto-expand
 */
export function getAdvancedPropsForGroup(groupPrefix: string): string[] {
  return Object.entries(PROPERTIES)
    .filter(([id, def]) => id.startsWith(groupPrefix) && def.tier === "advanced")
    .map(([id]) => id);
}
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: TS errors about missing `tier` field on any property you haven't updated yet — fix those.

**Step 5: Commit**

```bash
git add src/editor/inspector/config/propertiesRegistry.ts
git commit -m "feat(inspector): add tier field to all properties in registry

tier: 'basic' | 'advanced' classifies every property for progressive
disclosure. Basic shown by default, advanced hidden behind More settings.
Adds getAdvancedPropsForGroup() helper for search-based auto-expand."
```

---

### Task 14: Wire useAdvancedSettings into LayoutTab

**Files:**
- Modify: `src/editor/inspector/tabs/LayoutTab.tsx`

**Step 1: Import and instantiate useAdvancedSettings**

At the top of `LayoutTab.tsx`, add:

```ts
import { useAdvancedSettings } from "../hooks/useAdvancedSettings";
import { getAdvancedPropsForGroup } from "../config/propertiesRegistry";
```

Inside the component, before the return:

```ts
const advancedPropsMap = React.useMemo(() => ({
  layout:   getAdvancedPropsForGroup("layout"),
  spacing:  getAdvancedPropsForGroup("spacing"),
  size:     getAdvancedPropsForGroup("size"),
  position: getAdvancedPropsForGroup("position"),
  overflow: getAdvancedPropsForGroup("overflow"),
  flex:     getAdvancedPropsForGroup("flex"),
  grid:     getAdvancedPropsForGroup("grid"),
}), []);

const advanced = useAdvancedSettings({
  searchQuery,
  advancedPropsMap,
});
```

**Step 2: Pass advanced down to each section**

Each section in the return JSX needs the advanced state passed via props. Sections don't have an `advanced` prop yet — we add it per section in Tasks 15–20. For now just wire the hook instance. Add a comment:

```tsx
{/* advanced prop added in Task 15–20 */}
{showLayout && <LayoutSection ... />}
{showSize && <SizeSection ... />}
{showSpacing && <SpacingSection ... />}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add src/editor/inspector/tabs/LayoutTab.tsx
git commit -m "feat(inspector): wire useAdvancedSettings into LayoutTab

Hook instance ready. advancedPropsMap covers layout/spacing/size/position/
overflow/flex/grid groups. Section wiring follows in next tasks."
```

---

### Task 15: Wire useAdvancedSettings into AppearanceTab and EffectsTab

**Files:**
- Modify: `src/editor/inspector/tabs/AppearanceTab.tsx`
- Modify: `src/editor/inspector/tabs/EffectsTab.tsx`

**Step 1: AppearanceTab — same pattern as Task 14**

```ts
import { useAdvancedSettings } from "../hooks/useAdvancedSettings";
import { getAdvancedPropsForGroup } from "../config/propertiesRegistry";

// Inside component:
const advancedPropsMap = React.useMemo(() => ({
  typography:  getAdvancedPropsForGroup("typography"),
  background:  getAdvancedPropsForGroup("background"),
  border:      getAdvancedPropsForGroup("border"),
}), []);

const advanced = useAdvancedSettings({ searchQuery, advancedPropsMap });
```

**Step 2: EffectsTab — same pattern**

```ts
const advancedPropsMap = React.useMemo(() => ({
  effects: getAdvancedPropsForGroup("effects"),
  motion:  getAdvancedPropsForGroup("motion"),
}), []);

const advanced = useAdvancedSettings({ searchQuery, advancedPropsMap });
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 4: Commit**

```bash
git add src/editor/inspector/tabs/AppearanceTab.tsx src/editor/inspector/tabs/EffectsTab.tsx
git commit -m "feat(inspector): wire useAdvancedSettings into AppearanceTab and EffectsTab"
```

---

### Task 16: Add progressive disclosure to SizeSection

**Files:**
- Modify: `src/editor/inspector/sections/SizeSection.tsx`

**Step 1: Add advanced props to SizeSection interface**

```ts
interface SizeSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string; isOverridden?: boolean }>;
  isOpen?: boolean;
  /** Advanced settings state from parent tab */
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
}
```

**Step 2: Import MoreSettingsToggle**

```ts
import { MoreSettingsToggle } from "../shared/controls/MoreSettingsToggle";
```

**Step 3: Wrap advanced controls + add toggle**

Inside the Section, after the basic Width/Height rows, wrap min/max/aspect-ratio:

```tsx
<Section title="Size" icon="Ruler" isOpen={isOpen} id="inspector-section-size">
  {/* Basic — always visible */}
  {!hidden("width") && <InputWithUnit label="Width" ... />}
  {!hidden("height") && <InputWithUnit label="Height" ... />}

  {/* Advanced — gated behind toggle */}
  {advancedExpanded && (
    <>
      {!hidden("min-width") && <InputWithUnit label="Min W" ... />}
      {!hidden("max-width") && <InputWithUnit label="Max W" ... />}
      {!hidden("min-height") && <InputWithUnit label="Min H" ... />}
      {!hidden("max-height") && <InputWithUnit label="Max H" ... />}
      {!hidden("aspect-ratio") && <InputWithUnit label="Ratio" ... />}
    </>
  )}

  <MoreSettingsToggle
    isOpen={!!advancedExpanded}
    onToggle={onAdvancedToggle ?? (() => {})}
    advancedCount={5}
    collapsedLabel="Min / Max / Ratio"
  />
</Section>
```

**Step 4: Update LayoutTab.tsx to pass advanced props**

In `LayoutTab.tsx`, pass the advanced state to SizeSection:

```tsx
{showSize && (
  <SizeSection
    styles={styles}
    onChange={onChange}
    propertyStates={propertyStates}
    isOpen={autoExpandSection === "size" ? true : undefined}
    advancedExpanded={advanced.isExpanded("size")}
    onAdvancedToggle={() => advanced.toggle("size")}
  />
)}
```

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 6: Commit**

```bash
git add src/editor/inspector/sections/SizeSection.tsx src/editor/inspector/tabs/LayoutTab.tsx
git commit -m "feat(inspector): progressive disclosure for SizeSection

Min/max/aspect-ratio hidden behind 'Min / Max / Ratio' toggle.
Width + height always visible. Wired to LayoutTab advanced state."
```

---

### Task 17: Add progressive disclosure to SpacingSection

**Files:**
- Modify: `src/editor/inspector/sections/SpacingSection.tsx`

**Step 1: Same pattern as Task 16**

Add `advancedExpanded` + `onAdvancedToggle` props to `SpacingSectionProps`.

**Step 2: Wrap row-gap and column-gap as advanced**

After the basic Padding and Margin `FourSideInput` rows:

```tsx
{advancedExpanded && (
  <>
    <InputWithUnit label="Row Gap" value={styles["row-gap"] || ""} onChange={(v) => onChange("row-gap", v)} />
    <InputWithUnit label="Col Gap" value={styles["column-gap"] || ""} onChange={(v) => onChange("column-gap", v)} />
  </>
)}
<MoreSettingsToggle
  isOpen={!!advancedExpanded}
  onToggle={onAdvancedToggle ?? (() => {})}
  advancedCount={2}
  collapsedLabel="Row / Col Gap"
/>
```

**Step 3: Update LayoutTab.tsx**

```tsx
{showSpacing && (
  <SpacingSection
    styles={styles}
    onChange={onChange}
    onBatchChange={onBatchChange}
    advancedExpanded={advanced.isExpanded("spacing")}
    onAdvancedToggle={() => advanced.toggle("spacing")}
  />
)}
```

**Step 4: Verify TypeScript + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/inspector/sections/SpacingSection.tsx src/editor/inspector/tabs/LayoutTab.tsx
git commit -m "feat(inspector): progressive disclosure for SpacingSection

Row-gap and column-gap hidden behind 'Row / Col Gap' toggle."
```

---

### Task 18: Add progressive disclosure to LayoutSection (Display/Position)

**Files:**
- Modify: `src/editor/inspector/sections/layout/index.tsx`

**Step 1: Add props to LayoutSection**

Add `advancedExpanded` + `onAdvancedToggle` to the section's props interface.

**Step 2: Identify advanced controls**

Read the current section file. Controls for `isolation`, `contain`, `box-sizing`, `overflow` (individual X/Y), `scroll-snap-type`, `scroll-snap-align`, `scroll-behavior` are advanced.

Wrap them:

```tsx
{advancedExpanded && (
  <>
    {/* isolation, contain, box-sizing, overflow-x, overflow-y,
        scroll-snap-type, scroll-snap-align, scroll-behavior controls */}
  </>
)}
<MoreSettingsToggle
  isOpen={!!advancedExpanded}
  onToggle={onAdvancedToggle ?? (() => {})}
  advancedCount={7}
  collapsedLabel="Overflow / Scroll / Box"
/>
```

**Step 3: Update LayoutTab.tsx**

```tsx
{showLayout && (
  <LayoutSection
    styles={styles}
    onChange={onChange}
    onBatchChange={onBatchChange}
    cssContext={cssContext}
    isOpen={autoExpandSection === "layout" ? true : undefined}
    advancedExpanded={advanced.isExpanded("layout")}
    onAdvancedToggle={() => advanced.toggle("layout")}
  />
)}
```

**Step 4: Verify TypeScript + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/inspector/sections/layout/ src/editor/inspector/tabs/LayoutTab.tsx
git commit -m "feat(inspector): progressive disclosure for LayoutSection

isolation/contain/box-sizing/scroll controls hidden behind toggle."
```

---

### Task 19: Add progressive disclosure to TypographySection

**Files:**
- Modify: `src/editor/inspector/sections/typography/index.tsx`

**Step 1: Add props + wrap advanced controls**

Advanced typography: `letter-spacing`, `white-space`, `word-break`, `overflow-wrap`, `text-overflow`, `text-shadow`.

```tsx
{advancedExpanded && (
  <>
    {/* letter-spacing, white-space, word-break, overflow-wrap, text-overflow, text-shadow */}
  </>
)}
<MoreSettingsToggle
  isOpen={!!advancedExpanded}
  onToggle={onAdvancedToggle ?? (() => {})}
  advancedCount={6}
  collapsedLabel="Spacing / Wrap / Shadow"
/>
```

**Step 2: Update AppearanceTab.tsx**

```tsx
{showTypography && (
  <TypographySection
    styles={styles}
    onChange={onChange}
    isOpen={autoExpandSection === "typography" || !!q ? true : undefined}
    advancedExpanded={advanced.isExpanded("typography")}
    onAdvancedToggle={() => advanced.toggle("typography")}
  />
)}
```

**Step 3: Verify TypeScript + commit**

```bash
npx tsc --noEmit 2>&1 | head -10
git add src/editor/inspector/sections/typography/ src/editor/inspector/tabs/AppearanceTab.tsx
git commit -m "feat(inspector): progressive disclosure for TypographySection

letter-spacing/white-space/word-break/overflow-wrap/text-shadow hidden."
```

---

### Task 20: Add progressive disclosure to BackgroundSection + BorderSection

**Files:**
- Modify: `src/editor/inspector/sections/BackgroundSection.tsx`
- Modify: `src/editor/inspector/sections/BorderSection.tsx`

**Step 1: BackgroundSection advanced controls**

Advanced: `background-repeat`, `background-attachment`, `background-clip`, `background-origin`.

Basic: `background-color`, `background-image`, gradient preset, `background-size`, `background-position`.

Add `advancedExpanded` + `onAdvancedToggle` props. Wrap advanced controls. Add toggle with `collapsedLabel="Repeat / Clip / Origin"`.

Update `AppearanceTab.tsx` to pass `advanced.isExpanded("background")` + toggle.

**Step 2: BorderSection advanced controls**

Advanced: individual sides (`border-top`, `border-right`, `border-bottom`, `border-left`), `outline`, `outline-offset`.

Basic: `border` shorthand, `border-radius`.

Add props. Wrap advanced. Add toggle with `collapsedLabel="Individual Sides / Outline"`.

Update `AppearanceTab.tsx` to pass `advanced.isExpanded("border")` + toggle.

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 4: Run full test suite — Phase 2 complete**

```bash
npx vitest run
```

Expected: all pass.

**Step 5: Commit**

```bash
git add src/editor/inspector/sections/BackgroundSection.tsx \
        src/editor/inspector/sections/BorderSection.tsx \
        src/editor/inspector/tabs/AppearanceTab.tsx
git commit -m "feat(inspector): progressive disclosure for Background + Border sections

Background: repeat/attachment/clip/origin advanced.
Border: individual sides + outline advanced.
Phase 2 complete — all 6 sections have progressive disclosure."
```

---

## PHASE 3 — Structural Changes

---

### Task 21: Rename tabs — Appearance → Style, Effects → Behavior, remove Settings

**Files:**
- Modify: `src/editor/inspector/ProInspector.tsx`

**Step 1: Read ProInspector.tsx tab configuration**

Find the tab labels definition and the tab render array.

**Step 2: Update tab labels**

```ts
// Before
const tabLabels = {
  layout: "Layout",
  appearance: "Appearance",
  effects: "Effects",
  settings: "Element",
};

// After
const tabLabels = {
  layout: "Layout",
  appearance: "Style",
  effects: "Behavior",
};
```

**Step 3: Remove "settings" from the tabs array**

Find the tab iteration (something like `["layout", "appearance", "effects", "settings"].map(...)`). Remove `"settings"` from the array:

```ts
(["layout", "appearance", "effects"] as const).map((tab) => { ... })
```

**Step 4: Remove SettingsTab render block**

Find the `{activeTab === "settings" && <SettingsTab ... />}` block in the content area. Remove it (SettingsTab will be replaced by the footer in Task 23).

Remove the `SettingsTab` import at the top of the file.

**Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 6: Commit**

```bash
git add src/editor/inspector/ProInspector.tsx
git commit -m "feat(inspector): rename tabs Appearance→Style, Effects→Behavior, remove Settings tab

3 tabs now: Layout / Style / Behavior. Settings tab removed from nav —
ElementSettingsFooter added in next task replaces it."
```

---

### Task 22: Move VisibilitySection from LayoutTab to EffectsTab (Behavior)

**Files:**
- Modify: `src/editor/inspector/tabs/LayoutTab.tsx`
- Modify: `src/editor/inspector/tabs/EffectsTab.tsx`

**Step 1: Remove VisibilitySection from LayoutTab**

In `LayoutTab.tsx`:
- Remove the `import { VisibilitySection }` line
- Remove the `{showVisibility && <VisibilitySection ... />}` render block
- Remove the `showVisibility` variable

**Step 2: Add VisibilitySection to EffectsTab**

In `EffectsTab.tsx`:
```ts
import { VisibilitySection } from "../sections/VisibilitySection";
```

In the component, add after existing sections:
```tsx
{matchesSectionSearch("visibility", q) && (
  <VisibilitySection
    styles={styles}
    onChange={onChange}
  />
)}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 4: Commit**

```bash
git add src/editor/inspector/tabs/LayoutTab.tsx src/editor/inspector/tabs/EffectsTab.tsx
git commit -m "feat(inspector): move VisibilitySection from Layout to Behavior tab

Visibility rules = behavior (when to show/hide), not layout (how to size).
Correct mental model: Layout = dimensions, Behavior = motion + visibility."
```

---

### Task 23: Create ElementSettingsFooter component

**Files:**
- Create: `src/editor/inspector/components/ElementSettingsFooter.tsx`

**Step 1: Read SettingsTab.tsx to understand its content**

Note the props for `LinkSection`, `CSSClassesSection`, `ElementPropertiesSection`, `AllCSSSection`, and the `LINKABLE_ELEMENTS` + `supportsLink` logic.

**Step 2: Create the footer component**

```tsx
/**
 * ElementSettingsFooter - Collapsible identity/meta controls
 * Pinned at bottom of every inspector tab. Replaces SettingsTab.
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import type { PseudoStateId } from "../../../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { AllCSSSection } from "../sections/AllCSSSection";
import { CSSClassesSection } from "../sections/CSSClassesSection";
import { ElementPropertiesSection } from "../sections/elementProperties";
import { LinkSection } from "../sections/LinkSection";
import { Section } from "../shared/controls/Section";

const LINKABLE_ELEMENTS = ["button", "link", "text", "heading", "image", "icon", "card", "cta"];

export interface ElementSettingsFooterProps {
  composer: Composer | null | undefined;
  selectedElement: { id: string; type: string; tagName?: string };
  currentPseudoState: PseudoStateId;
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  devMode?: boolean;
}

export const ElementSettingsFooter: React.FC<ElementSettingsFooterProps> = ({
  composer,
  selectedElement,
  currentPseudoState,
  onOpenMediaLibrary,
  onOpenIconPicker,
  devMode,
}) => {
  const canLink = LINKABLE_ELEMENTS.includes(selectedElement.type);

  return (
    <div style={{ borderTop: "1px solid var(--aqb-border)", marginTop: 8 }}>
      <Section
        title="Element Settings"
        icon="Settings"
        defaultOpen={false}
        id="element-settings-footer"
      >
        {canLink && (
          <LinkSection
            composer={composer}
            selectedElement={selectedElement}
          />
        )}
        <CSSClassesSection
          composer={composer}
          selectedElement={selectedElement}
        />
        <ElementPropertiesSection
          composer={composer}
          selectedElement={selectedElement}
          onOpenMediaLibrary={onOpenMediaLibrary}
          onOpenIconPicker={onOpenIconPicker}
        />
        {devMode && (
          <AllCSSSection
            composer={composer}
            selectedElement={selectedElement}
            currentPseudoState={currentPseudoState}
          />
        )}
      </Section>
    </div>
  );
};

export default ElementSettingsFooter;
```

**Step 3: Export from components/index.ts**

```ts
export { ElementSettingsFooter } from "./ElementSettingsFooter";
export type { ElementSettingsFooterProps } from "./ElementSettingsFooter";
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Fix any prop mismatches by checking the actual prop signatures of `LinkSection`, `CSSClassesSection`, `ElementPropertiesSection`, `AllCSSSection`.

**Step 5: Commit**

```bash
git add src/editor/inspector/components/ElementSettingsFooter.tsx \
        src/editor/inspector/components/index.ts
git commit -m "feat(inspector): create ElementSettingsFooter component

Collapsible footer replacing the Settings tab. Contains Link, CSS Classes,
Element Properties, AllCSS (dev mode). Closed by default."
```

---

### Task 24: Add ElementSettingsFooter to all 3 tabs

**Files:**
- Modify: `src/editor/inspector/tabs/LayoutTab.tsx`
- Modify: `src/editor/inspector/tabs/AppearanceTab.tsx`
- Modify: `src/editor/inspector/tabs/EffectsTab.tsx`

**Step 1: Add ElementSettingsFooter props to each tab**

Each tab's props interface needs these additional fields (copy from SettingsTab props that are relevant):

```ts
composer?: Composer | null;
selectedElement: { id: string; type: string; tagName?: string };
currentPseudoState: PseudoStateId;
onOpenMediaLibrary?: (...) => void;
onOpenIconPicker?: (...) => void;
devMode?: boolean;
```

Check if `BaseTabProps` already includes some of these — avoid duplication.

**Step 2: Render footer at bottom of each tab**

At the very end of each tab's return, before the closing fragment:

```tsx
import { ElementSettingsFooter } from "../components/ElementSettingsFooter";

// At bottom of return:
<ElementSettingsFooter
  composer={composer}
  selectedElement={selectedElement}
  currentPseudoState={currentPseudoState}
  onOpenMediaLibrary={onOpenMediaLibrary}
  onOpenIconPicker={onOpenIconPicker}
  devMode={devMode}
/>
```

**Step 3: Update ProInspector.tsx to pass new props to tabs**

Since each tab now needs `composer`, `selectedElement`, `currentPseudoState`, `devMode`, confirm these are already passed (they likely are — ProInspector owns all of them). If any are missing, thread them through.

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add src/editor/inspector/tabs/ src/editor/inspector/ProInspector.tsx
git commit -m "feat(inspector): add ElementSettingsFooter to all 3 tabs

Link / CSS Classes / Element Properties / AllCSS now accessible from
Layout, Style, and Behavior tabs via collapsible footer."
```

---

### Task 25: Remove AISuggestionSection and KeyboardHintsSection

**Files:**
- Modify: `src/editor/inspector/tabs/SettingsTab.tsx` (to clean before deletion)
- Delete: `src/editor/inspector/sections/KeyboardHintsSection.tsx`

**Step 1: Remove AISuggestionSection from SettingsTab**

In `SettingsTab.tsx`, remove:
- The `import { AISuggestionSection }` line
- The `<AISuggestionSection ... />` render block

Do NOT delete `AISuggestionSection.tsx` — canvas relocation is a separate sprint.

**Step 2: Remove KeyboardHintsSection from SettingsTab**

In `SettingsTab.tsx`, remove:
- The `import { KeyboardHintsSection }` line (if present)
- The `<KeyboardHintsSection ... />` render block

**Step 3: Delete KeyboardHintsSection file**

```bash
grep -r "KeyboardHintsSection" src/ --include="*.ts" --include="*.tsx"
```

Confirm only SettingsTab references it (after Step 2 removal), then:

```bash
git rm src/editor/inspector/sections/KeyboardHintsSection.tsx
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 5: Commit**

```bash
git commit -m "feat(inspector): remove AISuggestionSection + KeyboardHintsSection from panel

AISuggestionSection preserved for future canvas relocation sprint.
KeyboardHintsSection deleted — low-value, no canvas alternative needed."
```

---

### Task 26: Delete SettingsTab.tsx

**Files:**
- Delete: `src/editor/inspector/tabs/SettingsTab.tsx`
- Modify: `src/editor/inspector/tabs/index.ts`

**Step 1: Confirm SettingsTab has zero render callers**

```bash
grep -r "SettingsTab" src/ --include="*.ts" --include="*.tsx"
```

Expected: only the file itself and `tabs/index.ts`. ProInspector.tsx render call was removed in Task 21.

**Step 2: Remove from barrel**

In `src/editor/inspector/tabs/index.ts`, remove the `export` line for `SettingsTab`.

**Step 3: Delete**

```bash
git rm src/editor/inspector/tabs/SettingsTab.tsx
```

**Step 4: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -10
```

**Step 5: Run full test suite — Phase 3 complete**

```bash
npx vitest run
```

Expected: all tests pass. If `TabNavigation.test.tsx` fails (it tests tab count/names), update it to expect 3 tabs (Layout/Style/Behavior) instead of 4.

**Step 6: Final commit**

```bash
git add src/editor/inspector/tabs/index.ts
git rm src/editor/inspector/tabs/SettingsTab.tsx
git commit -m "refactor(inspector): delete SettingsTab.tsx

Contents moved to ElementSettingsFooter (pinned in all 3 tabs).
Phase 3 complete — inspector has exactly 3 tabs: Layout / Style / Behavior."
```

---

## Final Verification

After all 26 tasks are complete, run:

```bash
# TypeScript clean
npx tsc --noEmit

# All tests pass
npx vitest run

# No dead imports
grep -r "DesignTab\|SettingsTab\|sharedStyles\|KeyboardHints" src/editor/inspector/ \
  --include="*.ts" --include="*.tsx"
# Expected: zero output
```

Verify in browser:
- Inspector shows exactly 3 tabs: Layout / Style / Behavior
- Each section has "More settings" toggle at bottom
- Element Settings footer visible (collapsed) at bottom of every tab
- Panel noticeably less tall/chunky than before
