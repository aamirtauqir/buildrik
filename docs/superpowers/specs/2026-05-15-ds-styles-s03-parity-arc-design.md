# DS Styles s03 parity arc — Design Spec

- **Date**: 2026-05-15
- **Author**: Claude Opus 4.7
- **Status**: SHIPPED 2026-05-15 (commits `d0197988`..`fe266f1c`) — drill-in pattern adopted over two-pane after live verify caught 320px panel cramp
- **Reference prototype**: `file:///Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html#s03`
- **Predecessor**: DS full rewrite arc (T1-T10 + T34 + T6 fix) — covered Tokens sub-tab only

## Why this arc

DS rewrite arc closed Tokens sub-tab to prototype parity (s01/s02/s15). Live visual verify post-arc revealed **Styles sub-tab** is single-column accordion (`Buttons 3 presets / Cards 2 / Forms 1 / Links 2`) — does NOT match prototype s03 two-pane shape (11 categories left + variant-tabs + token-binding detail right).

Engine data model (`StylePreset` + `PresetBinding`) already supports the shape. 11 category registries exist (`useButtonPresets`, `useCardPresets`, etc). Pure UI rewrite.

## Goals

1. Left column: 11 preset category rows showing `<Category> · N variants` with right-aligned use count.
2. Right pane: shows selected category's detail — variant tabs + preview + token-binding rows + variant-tabs callout.
3. Click category → updates right pane.
4. Click variant tab → swaps bindings shown on right.
5. Click binding chip → opens token picker (defer to follow-up; chip is visual only first pass).
6. Each binding row = label left muted, green token chip right (`color.brand.primary` / `space.4` / `radius.md` etc).

## Non-goals

- New engine APIs (data model exists).
- Binding chip click → token picker (deferred — non-trivial token resolver UX).
- Multi-canvas preview render (preview area shows static variant chips, not real canvas).
- Pro/Beginner mode branching in Styles (single shape).
- Dark mode preview for Styles (inherits from T10 `[data-ds-preview]`).

## Tasks

### T1 — Two-pane router + state

`StylesRouter.tsx` (NEW, ~80 LOC) — owns `{ category, variant }` selection state. Wraps Styles sub-tab content. Renders two columns: left preset-category list + right detail pane.

```tsx
const [view, setView] = React.useState<{ category: PresetCategory; variant: string }>({
  category: "button",
  variant: "primary",
});
```

### T2 — Left column: category list

`StyleCategoryRow.tsx` (NEW, ~70 LOC) — single row in left column. Shows `Button · 4 variants` left, `9 uses` right. Active state = cobalt fg + left border. Click → setView({category, variant: firstVariant}).

11 rows mapped from `PRESET_CATEGORIES` const. Use count = sum of bindings across category's variants (engine method or count from registry).

### T3 — Right detail pane

`PresetDetailPane.tsx` (NEW, ~180 LOC) — header (`Button · primary` + mono `preset.button.primary`), preview area (static variant chips row), variant tabs (Primary/Secondary/Ghost/Link — clickable, swap variant), binding rows section, variant-tabs callout footer.

### T4 — Binding row primitive

`PresetBindingRow.tsx` (NEW, ~50 LOC) — label left muted + green chip right showing `<tokenId>`. Inline style amber bg `rgba(34,197,94,0.1)` / green fg `var(--bd-success-strong)` / mono font. Click → no-op v1 (defer to picker integration).

### T5 — Mount in StylesSection + delete legacy

Rewrite `StylesSection.tsx` (118 → ~40 LOC) — single child: `<StylesRouter>`. Delete `PresetCategoryCard.tsx` + `GenericPresetList.tsx` after grep confirms zero consumers outside StylesSection.

### T6 — Tests + visual verify

- `__tests__/sections/StylesRouter.test.tsx` — state machine: initial=button/primary, click category → updates, click variant → updates.
- `__tests__/sections/PresetDetailPane.test.tsx` — renders variant tabs, binding rows, header.
- `__tests__/sections/StyleCategoryRow.test.tsx` — active state, click handler.
- Live screenshot diff against prototype s03.

## Engine API audit

| API | Used by | Status |
|---|---|---|
| `usePresetsForCategory(category)` | T2, T3 | Shipped (`state/StylePresetRegistryContext.tsx`) |
| `useButtonPresets()` etc 11x | T3 | Shipped |
| `StylePreset.variant` field | T2, T3 | Shipped |
| `StylePreset.bindings` Record | T3, T4 | Shipped |
| Aggregate use count per category | T2 | NOT shipped — derive via `composer.designSystem.tokenUsage` summing token usages per category's bindings, OR omit "N uses" v1 |

**Decision**: omit "N uses" indicator v1 if engine API gap; show `· N variants` only. Document follow-up.

## Decisions baked

| # | Decision |
|---|---|
| **D1** | Selection state local to StylesRouter (no global) |
| **D2** | Initial selection: button/primary (matches s03 example) |
| **D3** | Binding chip click is no-op v1 (token picker deferred) |
| **D4** | Preview area = static variant chips row (no canvas render) |
| **D5** | "N uses" column omitted if aggregation API missing |
| **D6** | Delete PresetCategoryCard + GenericPresetList — no consumers outside StylesSection (probe before delete) |

## Test plan

- 3 new test files (StylesRouter, PresetDetailPane, StyleCategoryRow).
- Delete existing PresetCategoryCard tests if file deleted.

## Risk register

| Risk | Mit |
|---|---|
| Binding chip variant lookup wrong | Type model already maps variant → bindings; assert in test |
| 11 categories but some have zero presets | Show "0 variants" + disable click |
| Active category state stale after preset deletion | Effect-watch deleted variant; if active.variant gone, fall back to first variant in category |
| Variant tabs overflow horizontally (5+ variants) | Horizontal scroll container |

## Done definition

1. Live screenshot of Styles sub-tab matches s03 two-pane shape.
2. Click "Card" left → right shows Card · elevated/flat variants.
3. Click "Ghost" variant tab → right binding rows update.
4. PresetCategoryCard + GenericPresetList deleted.
5. New tests green.

## Out of scope

- Token picker on binding chip click
- Preset Add/Delete UI (currently inline in old card — defer to standalone modal)
- Variant Rename
- Canvas preview render
- Dark mode override for Styles (inherits T10 attribute)
