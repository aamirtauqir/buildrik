# Right Panel Full Overhaul — Design Document

**Date:** 2026-03-07
**Scope:** `src/editor/inspector/` — all files
**Strategy:** Invisible fixes first → Progressive disclosure → Structural changes
**Approach:** 3 sequential phases, each shipping as an independent PR

---

## Background

A full UX audit of the right inspector panel identified three root problems:

1. **Control density too high** — input padding `8px 10px`, row margin `12px`, section header padding `14px 16px`. Panel feels chunky and wastes vertical space.
2. **No progressive disclosure** — all controls shown at once regardless of frequency of use. `useAdvancedSettings` and `MoreSettingsToggle` already exist but are never wired.
3. **Wrong tab structure** — Animation/Interactions grouped under Appearance (wrong mental model), Settings tab is a meaningless grab-bag, Visibility is in Layout instead of Behavior.

---

## Non-Goals

- AI Suggestions canvas relocation — separate sprint
- New design tokens — reuse existing `--aqb-*` variables
- Changes to the engine or Composer

---

## Phase 1 — Foundation (Day 1)

Code quality + density fixes. Zero visible structural change. Ships as PR 1.

### 1.1 Merge style systems (`controlStyles.ts`)

Delete `sharedStyles` entirely. Patch `baseStyles` to compact spec:

| Property | Before | After |
|----------|--------|-------|
| `row.marginBottom` | `12px` | `6px` |
| `row.gap` | `8px` | `6px` |
| `input.padding` | `8px 10px` | `4px 8px` |
| `input.borderRadius` | `6px` | `4px` |
| `label.minWidth` | `70px` | `56px` |
| `label.fontSize` | `12px` | `11px` |
| `sectionHeader.padding` | `14px 16px` | `10px 14px` |

Migrate all `sharedStyles` importers to `baseStyles` in the same commit.

### 1.2 Dead code removal

- Delete `tabs/DesignTab.tsx` (duplicates AppearanceTab + EffectsTab combined — 243 lines dead)
- Delete `@deprecated` functions in `sectionConfig.ts` (`getLayoutSectionsForElement`, `getDesignSectionsForElement`) after confirming 0 callers
- Rename `styles/index.tsx` → `styles/index.ts` (wrong extension, no JSX)

### 1.3 SSOT fixes

- Remove duplicate `colors.backgroundColor` from `propertiesRegistry.ts` (keeps `background.backgroundColor`)
- Export `ALL_SECTION_IDS` from `config/index.ts`, use in `useInspectorSections.ts` `expandAll()` instead of hardcoded array

### 1.4 VisibilitySection cleanup

- Replace local style object with `baseStyles` from `controlStyles.ts`
- Import breakpoints from `shared/types/breakpoints.ts` instead of hardcoding `1024/768/767`

### Phase 1 success criteria

- `npx tsc --noEmit` passes
- Vitest suite passes
- Panel visually ~25-30% less tall per section

---

## Phase 2 — Progressive Disclosure (Days 2–3)

Registry-driven tier system. Every property classified as `basic` or `advanced`. Ships as PR 2.

### 2.1 Extend `PropertyDefinition` type

```ts
export interface PropertyDefinition {
  // ... existing fields ...
  /** "basic" shown by default. "advanced" hidden behind More settings toggle. */
  tier: "basic" | "advanced";
}
```

### 2.2 Classification rules

- **basic** — used by >80% of elements, >80% of the time
- **advanced** — developer/edge-case controls

| Section | Basic | Advanced |
|---------|-------|----------|
| Layout/Display | display, position | isolation, contain, box-sizing |
| Size | width, height | min-w, max-w, min-h, max-h, aspect-ratio |
| Spacing | padding, margin | row-gap, column-gap separately |
| Typography | font-family, size, weight, align, color | word-break, overflow-wrap, white-space, text-overflow, text-shadow |
| Background | bg-color, bg-image | attachment, clip, origin, repeat variants |
| Border | border shorthand, radius | individual sides, outline, outline-offset |

### 2.3 Hook wiring

One `useAdvancedSettings` instance per tab, passed into sections:

```ts
// LayoutTab.tsx
const advanced = useAdvancedSettings({ searchQuery });
// Pass advanced.isExpanded / advanced.toggle into each section
```

### 2.4 Section pattern

Every section gets `MoreSettingsToggle` at its bottom:

```tsx
{/* Basic controls — always visible */}
<ControlRow label="Padding">...</ControlRow>

{/* Advanced controls — gated */}
{advanced.isExpanded("spacing") && (
  <>
    <ControlRow label="Row Gap">...</ControlRow>
    <ControlRow label="Column Gap">...</ControlRow>
  </>
)}
<MoreSettingsToggle
  isOpen={advanced.isExpanded("spacing")}
  onToggle={() => advanced.toggle("spacing")}
  advancedCount={2}
/>
```

Search auto-expands advanced sections — already built into `useAdvancedSettings`, no extra work.

### Phase 2 success criteria

- `MoreSettingsToggle` visible at bottom of all 6 sections
- Advanced controls hidden by default, revealed on click
- Search for "word-break" auto-expands Typography advanced section
- `npx tsc --noEmit` + Vitest pass

---

## Phase 3 — Structural Changes (Days 4–5)

Tab rename, ElementSettingsFooter, section regroups. Ships as PR 3.

### 3.1 Tab rename (`ProInspector.tsx`)

```ts
// Before
{ layout: "Layout", appearance: "Appearance", effects: "Effects", settings: "Element" }

// After — "settings" removed entirely
{ layout: "Layout", appearance: "Style", effects: "Behavior" }
```

### 3.2 Section regrouping

| Section | Current tab | Target tab |
|---------|------------|------------|
| VisibilitySection | Layout | Behavior |
| AnimationSection | Effects | Behavior (confirm already there) |
| InteractionsSection | Effects | Behavior (confirm already there) |
| TypographySection | Appearance | Style (rename only) |

### 3.3 `ElementSettingsFooter` (new component)

`src/editor/inspector/components/ElementSettingsFooter.tsx`

Pinned at bottom of every tab. Collapsible, closed by default:

```tsx
<div style={{ borderTop: "1px solid var(--aqb-border)", marginTop: 8 }}>
  <Section title="Element Settings" defaultOpen={false} id="element-settings-footer">
    {supportsLink && <LinkSection ... />}
    <CSSClassesSection ... />
    <ElementPropertiesSection ... />
    {devMode && <AllCSSSection ... />}
  </Section>
</div>
```

Added to LayoutTab, AppearanceTab (Style), EffectsTab (Behavior).

### 3.4 SettingsTab elimination

- Remove `AISuggestionSection` render call (canvas relocation = separate sprint)
- Remove `KeyboardHintsSection` render call + delete file
- Delete `SettingsTab.tsx` after confirming all retained contents are in footer

### 3.5 Structural file moves (Section G)

- `shared/sectionConfig.ts` → `config/sectionConfig.ts`
- `shared/cssContext.ts` → `config/cssContext.ts`
- Delete `shared/Controls.tsx` barrel — migrate all callers to direct `shared/controls/` imports
- Rename `sections/typography/TextControls.tsx` → `sections/typography/TypographyControls.tsx`
- Delete `sections/flexbox/styles.ts` — migrate generic styles to `controlStyles`
- Delete `sections/elementProperties/styles.ts` — migrate generic styles to `controlStyles`

### Phase 3 success criteria

- Inspector has exactly 3 tabs: Layout / Style / Behavior
- Element Settings footer appears at bottom of all 3 tabs, collapsed by default
- `SettingsTab.tsx` file no longer exists in codebase
- `AISuggestionSection` and `KeyboardHintsSection` render calls removed
- `npx tsc --noEmit` + Vitest pass
- No console errors on element selection

---

## Final State

```
tabs/
  LayoutTab.tsx      — Display, Size, Spacing, Position, Flexbox, Grid + ElementSettingsFooter
  AppearanceTab.tsx  — Typography, Background, Border, Effects + ElementSettingsFooter
  EffectsTab.tsx     — Animation, Transitions, Interactions, Visibility + ElementSettingsFooter
  ✂ SettingsTab.tsx  — DELETED

components/
  ElementSettingsFooter.tsx  — NEW: Link, CSS Classes, Element Properties, AllCSS (dev)

shared/controls/
  controlStyles.ts   — single unified style export (no sharedStyles split)
  MoreSettingsToggle.tsx — NOW WIRED into all 6 sections

config/
  propertiesRegistry.ts  — tier: "basic" | "advanced" on every property
  sectionConfig.ts       — MOVED from shared/
  cssContext.ts          — MOVED from shared/
```

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| `sharedStyles` import missed somewhere | `grep -r "sharedStyles"` before merging Phase 1 |
| `DesignTab` still imported somewhere | `grep -r "DesignTab"` before deleting |
| `SettingsTab` content not fully migrated | Checklist: LinkSection ✓, CSSClassesSection ✓, ElementPropertiesSection ✓, AllCSSSection ✓ |
| TypeScript errors from file moves | Run `npx tsc --noEmit` as exit gate for each phase |
| Vitest failures from renamed files | Update test imports as part of rename commits |
