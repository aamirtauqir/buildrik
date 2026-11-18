# Design tokens — Figma is the source of truth

The editor's chrome colours, spacing, radii, shadows, type and z-index are
**generated**. Nothing in `src/` may define a chrome token by hand.

```
Figma variables  ──export──▶  figma-tokens.json  ──generate.mjs──▶  tokens.generated.css
(Primitives + Package)         (in this folder)                     tokens.generated.ts
```

## Change a colour

1. Change the variable in Figma (file `2L9OTGzBrL6kYmU18yA1c7`, collections
   `Buildrick / Primitives` (mode `Value`), `Buildrick / Chrome` (mode `Light`)
   for semantic colours, `Buildrick / Geometry` (mode `Value`) for spacing,
   radius and sizes). `figma-tokens.json` was last exported from
   `g4GzQFqzNYz5sosz1QtZXC` (`Primitives` + `Package`); see the 2L9 diff below.
2. Re-export (below).
3. `npm run tokens:generate`
4. Commit the regenerated files. Every consumer updates — there is nothing else to edit.

## Re-export from Figma

Run this read-only script through the Figma MCP `use_figma` tool, then paste the
result into `figma-tokens.json`:

```js
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const out = {};
for (const c of cols) {
  const mode = c.modes.find(m => m.name === 'Editor') || c.modes[0];
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    let raw = v.valuesByMode[mode.modeId];
    if (raw && raw.type === 'VARIABLE_ALIAS') {
      const s = await figma.variables.getVariableByIdAsync(raw.id);
      raw = s ? Object.values(s.valuesByMode)[0] : null;
    }
    if (raw && typeof raw === 'object' && 'r' in raw) out[v.name] = hex(raw);
    else if (typeof raw === 'number' || typeof raw === 'string') out[v.name] = raw;
  }
}
return out;
```

2L9 has no `Editor` mode, so the script falls back to each collection's first
mode (`Light` for Chrome, `Value` for the others).

Only the values change between exports. The structure of `figma-tokens.json`
(which groups exist, what they are called) is a deliberate design decision and
is edited by hand.

## 2L9 diff (2026-10-22, design-2l9 Task 1.1)

Export of `2L9OTGzBrL6kYmU18yA1c7` diffed against `figma-tokens.json`:

- **Colours:** all 25 `Buildrick / Chrome` values equal their `semantic`
  counterparts (`color/canvas-guide` #F05252 equals `palette.red/500`).
- **Spacing and radius:** equal (`spacing/*`, `radius/sm|md|lg|xl|full`).
- **Sizes used by the Phase-1 shell:** equal — `size/topbar` 56,
  `size/bottom` 32 = `size.footer`, `size/inspector` 300,
  `size/toolbar` 44 = `size.header`, `size/control` 32 = `size.control-sm`,
  `size/row-dense` 28.
- **Deltas left for owner review (not Phase-1 surfaces):** `size/rail` 56 vs
  `size.rail` 60; `size/drawer` 284 vs `size.drawer` 280. Keys only in 2L9:
  `size/task` 360, `size/property-label` 88, `size/unit-control` 40,
  `size/property-control-height` 28.

No token value was changed by this diff.

## One flat tier

Every token holds a literal value. Nothing in this file references anything else:

```css
--bk-accent: #1A56DB;      /* not var(--bk-blue-700) */
--bk-border: #E5E7EB;      /* not var(--bk-gray-200) */
```

**The indirection lives in Figma, not in CSS.** In the Figma file `color/accent`
is an alias of `flowbite/blue/700`. Change that alias, regenerate, and every
consumer follows — exactly as if the CSS had a var() chain, but without the chain
being something a human has to read, maintain, or accidentally fork.

So: **Figma holds the decision, CSS shows the result.** One Figma variable = one
flat CSS line. That rule is the whole system.

Components reference **role** names (`--bk-accent`, `--bk-ink`, `--bk-border`),
not ramp steps (`--bk-blue-700`). The role name says what a colour is *for*, so a
rebrand is a Figma edit, not a find-and-replace.

The previous system had three tiers, one of which (`--bd-*`) existed only to
mirror another (`--buildrick-*`). That mirror is what rotted: 213 tokens ended up
referenced by nothing, and 42 were the same value under different names.

Two more rules that make whole categories of mess impossible:

- **Spacing is named by pixel value** (`--bk-space-16` is 16px). You cannot
  introduce a competing scale, because `space-4` and `space-1` cannot both mean 4px.
- **The generated file is checksummed by CI.** Hand-edit it and `gate:tokens-generated`
  fails with the diff.

## What is NOT in here

`src/themes/design-system/design.css` defines `--buildrick-design-*` — the
tokens that ship inside **customers' published websites**, overwritten at
runtime by the Brand panel. That is user data in a different domain. Changing it
restyles live customer sites on their next publish, so it is a product decision
with a migration, not a token refactor. `check-tokens-generated.mjs` carves it
out explicitly; keep it that way.

## Files

| File | Role |
|---|---|
| `figma-tokens.json` | Exported values + the group structure. Source of truth. |
| `generate.mjs` | Emits the CSS and TS artifacts. |
| `legacy-map.json` | The 379 old→new token mappings used for the one-time migration. Kept for archaeology. |
| `codemod.mjs` | Applied `legacy-map.json` across the tree. Already run; kept so the migration is repeatable and reviewable. |
| `../check-tokens-generated.mjs` | CI gate: output is current, no legacy token has come back. |
