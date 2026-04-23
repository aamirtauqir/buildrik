# Layers Tab — Prototype Port Design

**Date:** 2026-04-24
**Owner:** saqib@vortexwebinnovate.com
**Status:** Draft → awaiting user review
**Prototype source of truth:** `/Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html`
**Shell context:** editor chrome v2 (commit `1610b29`), bridge tokens in `editor/shell/chrome.css`
**Related memory:** `project_new_design_shell_20260423.md`, `project_editor_ds_intake_20260423.md`

---

## 1. Goal

Port the Layers tab UI to match the latest prototype at 90–100% visual fidelity. Zero change to business logic, API calls, DB writes, validations, or workflows. Presentation code, CSS, layout, and component structure may be refactored freely inside the Layers panel subtree.

## 2. Constraints

1. Prototype is the sole visual source of truth. Do not reference legacy layers mockups, older specs, or legacy `--buildrick-*` tokens.
2. Only the `--bd-*` token family (already bridged into `editor/shell/chrome.css`) may be referenced by new CSS.
3. Business-logic contract: every hook, every `composer.*` call, every `EVENTS.*` emission, every localStorage key stays as-is.
4. No new runtime dependencies. No Emotion imports in new files. Plain CSS stylesheet.
5. No `!important`. No dark mode work.
6. Touch only `editor/sidebar/tabs/layers/**` and `editor/panels/layers/**`. Do not modify engine, hooks internals, or shared utilities.

## 3. Scope decisions (from brainstorming Q&A)

| Decision | Chosen option |
|---|---|
| Panel header shape | Drop `PanelShell.Header`. Single prototype `panel-h` row with h2, count sub, expand-all, collapse-all, gear. No pin / help / close buttons. |
| Features retained with new styling | Selection banner, breadcrumb, context menu, inline delete-confirm, drop-feedback alert, display-settings popover, drag indicators, empty state, lock icon. Restyled end-to-end with `--bd-*` tokens. |
| Features dropped | "Selection synced from canvas" transient banner (legacy chrome, redundant with row selection). |
| CSS strategy | Full rewrite. One new file `editor/panels/layers/styles/layers-v2.css`. Delete `styles.ts` and `styles/layers.css`. New namespace `.bdc-layers-*` and `.bdc-lr*`. |
| Component composition | `LayersTab` owns the panel frame (header, search, body container). `LayersPanel` owns the tree body only. Prior two-row header pattern replaced by prototype's single row. |

## 4. File layout

```
editor/
├── sidebar/tabs/layers/
│   └── LayersTab.tsx                 ← rewrite: frame owner
└── panels/layers/
    ├── index.tsx                     ← rewrite: body owner, classname swap
    ├── LayerTreeItem.tsx             ← rewrite: classname swap, drop isHovered state
    ├── styles/
    │   └── layers-v2.css             ← NEW: only stylesheet
    └── components/
        ├── LayerBreadcrumb.tsx       ← classname swap
        ├── LayerContextMenu.tsx      ← classname swap
        ├── LayerDisplaySettings.tsx  ← classname swap
        ├── LayerSelectionBanner.tsx  ← classname swap
        └── LayersEmptyState.tsx      ← classname swap
```

Deleted in a final commit:

- `editor/panels/layers/styles.ts`
- `editor/panels/layers/styles/layers.css`

Imported once from `editor/panels/layers/index.tsx`:

```ts
import "./styles/layers-v2.css";
```

## 5. Token usage (SSOT: `chrome.css` bridge)

All values reference `--bd-*` only. No hex literals except `#fff` where the prototype uses a plain white surface.

| Role | Token |
|---|---|
| Panel background | `#fff` (matches prototype `.panel`) |
| Sub-panel / search background | `var(--bd-bg-subtle)` |
| Row hover | `var(--bd-bg-subtle)` |
| Row selected background | `var(--bd-accent-tint)` |
| Row selected foreground | `var(--bd-accent)` |
| Foreground primary | `var(--bd-fg-primary)` |
| Foreground secondary (icons) | `var(--bd-fg-secondary)` |
| Foreground muted (hint text) | `var(--bd-fg-muted)` |
| Foreground heading | `var(--bd-fg-heading)` |
| Borders | `var(--bd-border)` |
| Warning (lock on) | `var(--bd-warning)` |
| Error (destructive menu, drop alert) | `var(--bd-error)` |
| Body font | `var(--bd-font)` — Inter Tight |
| Mono font | `var(--bd-mono)` — Geist Mono |

## 6. Panel header and state lift

### DOM (in `LayersTab.tsx`)

```html
<section class="bdc-panel bdc-layers">
  <div class="bdc-panel-h">
    <div class="bdc-panel-h-ttl">
      <h2>Layers</h2>
      <div class="bdc-panel-sub">{N} nodes · {S} selected</div>
    </div>
    <div class="bdc-panel-h-acts">
      <button class="bdc-icon-btn" title="Expand all">…</button>
      <button class="bdc-icon-btn" title="Collapse all">…</button>
      <button class="bdc-icon-btn" title="Display settings">…</button>
    </div>
  </div>

  <label class="bdc-psearch">
    <svg>…</svg>
    <input placeholder="Find a layer" />
  </label>

  <div class="bdc-pbody bdc-pbody-scroll">
    <LayersPanel … />
  </div>
</section>
```

### State moved up into `LayersTab`

- `search: string` + `setSearch`
- `displaySettingsOpen: boolean` + anchor ref for popover
- Stats: `{ total: number, selected: number }` read from `LayersPanel` via a composer event `layers:stats-change`

### State owned by `LayersPanel` (unchanged)

- `expandedIds`, `hiddenIds`, `lockedIds` (from `useLayersState`)
- `selectedIds` (from `useLayerSelection`)
- `dragState`, `editingId`, `contextMenu`, `hoveredLayerId`, `customNames`
- `displayPrefs` (persisted)

### Button wiring

| Button | Action |
|---|---|
| Expand all | Emits `layers:expand-all` → new listener inside `LayersPanel` calls existing `state.treeHook.expandAll()` |
| Collapse all | Emits `layers:collapse-all` → new listener inside `LayersPanel` calls existing `state.treeHook.collapseAll()` |
| Display settings | Toggles `displaySettingsOpen`; renders `<LayerDisplaySettings>` popover anchored to gear button |

The listener pattern is additive to `LayersPanel` (`index.tsx`) — it mirrors the existing `layers:scroll-to-selection` registration inside the same file. `useLayersState` and every other hook under `hooks/` stay untouched.

Stats (`totalCount`, `selectedCount`) are emitted from `LayersPanel` via a new `layers:stats-change` event on mount and when `treeHook.totalCount` / `selectionHook.selectedIds.size` change. `LayersTab` subscribes and renders the sub text. Again, additive to `index.tsx` only.

## 7. Tree row anatomy (`LayerTreeItem.tsx`)

### Structure

```html
<div
  class="bdc-lr [bdc-sel] [bdc-hidden] [bdc-leaf] [bdc-closed] [bdc-editing]"
  style="padding-left: {6 + depth * 14}px"
  role="treeitem"
  aria-selected
  draggable
>
  <span class="bdc-lr-chev"><svg>chevron</svg></span>
  <span class="bdc-lr-ic">{categoryIcon}</span>
  <span class="bdc-lr-nm">{displayName}</span>
  <span class="bdc-lr-lock [bdc-on]"><svg>lock</svg></span>
  <span class="bdc-lr-eye [bdc-off]"><svg>eye</svg></span>
</div>
```

### Core CSS rules (final form in `layers-v2.css`)

```css
.bdc-lr {
  position: relative;
  display: flex; align-items: center; gap: 5px;
  padding: 4px 6px; border-radius: 4px;
  font: 500 11px var(--bd-font);
  color: var(--bd-fg-primary);
  cursor: pointer; user-select: none;
}
.bdc-lr:hover { background: var(--bd-bg-subtle); }
.bdc-lr.bdc-sel { background: var(--bd-accent-tint); color: var(--bd-accent); font-weight: 600; }
.bdc-lr.bdc-hidden .bdc-lr-nm { color: var(--bd-fg-muted); font-style: italic; }

.bdc-lr-chev { width: 12px; height: 12px; display: inline-flex; align-items: center; justify-content: center; color: var(--bd-fg-muted); transition: transform 120ms; }
.bdc-lr.bdc-closed .bdc-lr-chev { transform: rotate(-90deg); }
.bdc-lr.bdc-leaf .bdc-lr-chev { visibility: hidden; }

.bdc-lr-ic { color: var(--bd-fg-secondary); display: inline-flex; flex-shrink: 0; }
.bdc-lr.bdc-sel .bdc-lr-ic { color: var(--bd-accent); }
.bdc-lr-ic svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }

.bdc-lr-nm { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.bdc-lr-eye,
.bdc-lr-lock {
  color: var(--bd-fg-muted);
  display: inline-flex;
  padding: 2px;
  opacity: 0;
  transition: opacity 120ms;
}
.bdc-lr:hover .bdc-lr-eye,
.bdc-lr.bdc-sel .bdc-lr-eye,
.bdc-lr-eye.bdc-off { opacity: 1; }
.bdc-lr-eye.bdc-off { opacity: 0.6; }
.bdc-lr-eye:hover { color: var(--bd-fg-primary); }

.bdc-lr:hover .bdc-lr-lock,
.bdc-lr-lock.bdc-on { opacity: 1; }
.bdc-lr-lock.bdc-on { color: var(--bd-warning); }
```

### Drag indicators

```css
.bdc-lr[data-drop="before"]::before,
.bdc-lr[data-drop="after"]::after {
  content: ""; position: absolute; left: 6px; right: 6px; height: 2px;
  background: var(--bd-accent); border-radius: 2px;
}
.bdc-lr[data-drop="before"]::before { top: -1px; }
.bdc-lr[data-drop="after"]::after { bottom: -1px; }
.bdc-lr[data-drop="inside"] {
  box-shadow: inset 0 0 0 1.5px var(--bd-accent);
  background: var(--bd-accent-tint);
}
.bdc-lr.is-dragging { opacity: 0.5; }
```

The 30% / 40% / 30% hit zone thresholds in `handleDragOver` are unchanged.

### Rename input

While `editingId === layer.id`, `.bdc-lr-nm` renders `<input class="bdc-lr-edit">`. Style: transparent background, 1px solid `var(--bd-accent)` bottom border, same font. Logic (`actionsHook.renameLayer`, Enter commit, Esc cancel) unchanged.

### State removed from `LayerTreeItem`

- `isHovered` local state → replaced by pure CSS `:hover`. Saves ~20 LOC.
- `onMouseEnter` kept solely for canvas hover-highlight emission (not for reveal animation).

## 8. Sub-component styling

### Selection banner (`LayerSelectionBanner.tsx`)

Renders when `selectedIds.size > 1`. Sticky above tree.

- Container: `.bdc-layers-banner`, 6/10 padding, `var(--bd-bg-subtle)` background, 1px `var(--bd-border)` bottom.
- Count pill: 10px Geist Mono, `var(--bd-fg-secondary)`.
- Action buttons: `.bdc-icon-btn` 24×24, 13px SVG, `var(--bd-fg-secondary)` default → `var(--bd-fg-primary)` on hover.

Actions wired unchanged: `onGroup`, `onHide`, `onDelete`, `onExit`.

### Breadcrumb (`LayerBreadcrumb.tsx`)

Shown between `psearch` and tree body when exactly one layer selected.

- Container: `.bdc-layers-crumb`, horizontal overflow-x auto.
- Crumbs: 9.5px Geist Mono, `var(--bd-fg-muted)`, 1/4 padding.
- Separator `/`: `var(--bd-fg-muted)`.
- Active crumb: `.bdc-on` → `var(--bd-accent)`, 600 weight.

### Context menu (`LayerContextMenu.tsx`)

Floating, positioned at `(x, y)`.

- Container: `.bdc-menu`, `#fff`, 1px `var(--bd-border)`, 8px radius, shadow `0 8px 24px -6px rgba(15,23,42,0.18)`, 4px inner padding.
- Items: `.bdc-menu-item`, 6/10 padding, 11px Inter Tight, icon 13px muted, kbd pill 9.5px Geist Mono in `var(--bd-bg-subtle)`.
- Separator: `.bdc-menu-sep`, 1px `var(--bd-border)`.
- Destructive: `.bdc-menu-item.bdc-danger:hover` → `var(--bd-error)` foreground.

All 11 action dispatches through `useLayerContextActions` unchanged.

### Display settings popover (`LayerDisplaySettings.tsx`)

Anchored to gear button in panel-h.

- Container: `.bdc-popover.bdc-layers-settings`, `#fff`, 8px radius, 1px border, menu-like shadow, 10/12 padding.
- Section header: 10px Geist Mono uppercase, `var(--bd-fg-muted)`, 0.08em tracking.
- Toggle row: 11px Inter Tight, mini switch (18×10px, `var(--bd-accent)` when on).
- Density toggle drives `.bdc-layers-tree` → `.bdc-layers-tree-compact` parent class. Compact row padding becomes `2px 6px`, gap stays.

localStorage persistence (`layersPersistence`) unchanged.

### Empty state (`LayersEmptyState.tsx`)

- Container: `.bdc-layers-empty`, center flex column, 24px vertical padding.
- Icon: 32px `var(--bd-fg-muted)` stroke.
- Heading: 13px 600 `var(--bd-fg-heading)`.
- Copy: 11.5px `var(--bd-fg-secondary)`.
- CTA: `.bdc-btn.bdc-primary` (existing class in `chrome.css` — cobalt on `#fff`). Wires `onAddBlockClick` unchanged.

### Drop feedback alert

Inline alert, 3-second auto-clear logic unchanged.

- Container: `.bdc-layers-drop-alert`, `rgba(220,38,38,0.08)` background, left border 1px `var(--bd-error)` 0.3 alpha, 6/10 padding, 11px Inter Tight, `var(--bd-error)` foreground.

### Inline delete-confirm

- Container: `.bdc-layers-confirm`, `rgba(217,119,6,0.08)` background, 2px left border `var(--bd-warning)`, 6/12 padding, 11px Inter Tight.
- Buttons: `.bdc-btn.bdc-danger` and `.bdc-btn.bdc-ghost`. Both are **new modifiers defined inside `layers-v2.css`** (scoped under `.bdc-layers-confirm`) — not promoted to `chrome.css` in this spec. `.bdc-danger` uses `var(--bd-error)` background / `#fff` foreground at 4/10 padding, 10.5px. `.bdc-ghost` uses transparent background / `var(--bd-fg-secondary)` foreground with `:hover` → `var(--bd-bg-subtle)`.

## 9. Logic preservation contract

### Files explicitly unchanged

- `engine/**`
- `editor/panels/layers/hooks/**` — `useLayersState`, `useLayerSearch`, `useLayerSelection`, `useLayerTree`, `useLayerDrag`, `useLayerActions`, `useLayerContextActions`, `layersPersistence`
- `editor/panels/layers/data/**` — `layerUtils.ts`, test
- `editor/panels/layers/types.ts`
- `shared/constants/events.ts`
- `shared/utils/nesting.ts`

### Invariants (acceptance criteria)

All must hold after the port:

1. Click row → `composer.selection.select(id)` fires; canvas highlights; inspector opens.
2. Shift/meta click → `selectedIds` updates; selection banner appears when size > 1.
3. Eye click → `composer.elements.setHidden(id, bool)`; row gets `.bdc-hidden`; canvas element hides.
4. Lock click → `composer.elements.setLocked(id, bool)`; row gets `.bdc-lr-lock.bdc-on`; drop-into-locked rejected with drop alert.
5. Double-click name → rename input; Enter commits, Esc cancels.
6. Typing in psearch → `useLayerSearch` filters tree; ancestors of matches auto-expand.
7. Chevron click or Alt+←/→ → expand / collapse via `treeHook`.
8. Drag row → `handleLayerDrop` executes inside `composer.beginTransaction("move-layer")` with same 30/40/30 thresholds.
9. Right-click → context menu at cursor; all 11 actions dispatch correctly.
10. Canvas click → `EVENTS.ELEMENT_SELECTED` → tree scrolls to matching row + expands ancestors.
11. Gear → display settings popover; toggles persist to localStorage.
12. No layers → `LayersEmptyState` renders; `onAddBlockClick` wired.
13. Arrow-key navigation, Space toggle, F2 rename, Del delete shortcuts unchanged.

### Explicitly removed behavior

- `PanelShell.Header` pin / help / close buttons and the `isPinned`, `onPinToggle`, `onHelpClick`, `onClose` prop handling inside `LayersTab`. The props remain in the type signature to avoid breaking parent callers; their values are ignored. Parent removal is out of scope.
- `selectionSynced` transient banner and its `syncTimerRef` timer in `LayersTab`.

## 10. Rollout

### Commit plan

1. **feat(layers): add layers-v2.css and bdc-layers tokens.** New CSS file only. App behavior unchanged.
2. **feat(layers): port LayerTreeItem to bdc-lr classes.** Swap classnames, drop `isHovered` state, drop inline styles. Tree rows switch to new visuals; panel header still legacy.
3. **feat(layers): port sub-components to bdc-layers-\*.** Classname swap in `LayerBreadcrumb`, `LayerContextMenu`, `LayerDisplaySettings`, `LayerSelectionBanner`, `LayersEmptyState`. Delete their internal `<style>` blocks.
4. **feat(layers): lift header into LayersTab, drop PanelShell wrapper.** Prototype `panel-h` + `psearch` shape. Drop selection-synced banner. Wire stats event. Drop internal search bar in `LayersPanel`.
5. **chore(layers): delete legacy layers.css and styles.ts.** Remove all `--buildrick-*` references in the Layers subtree.

Each commit leaves the application in a working state; each is independently revertable.

### Testing

- `npm run dev` on port 5050. Manually exercise all 13 invariants on a project with nested elements.
- `npx tsc --noEmit` passes.
- `npx vitest run src/editor/panels/layers` passes. Classname assertions (if any) updated; behavior assertions unchanged.
- Side-by-side visual diff against `file:///Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html` at matching 280px panel width.

### Visual acceptance gate

Target ≥90% match. Any of the following blocks merge:

- Row padding, gap, font, or indent multiplier drifts > 2px.
- Hex literal leaks into `layers-v2.css` beyond the allowed exceptions. Allowed: (a) `#fff` where the prototype uses a plain white surface; (b) `rgba(...)` alpha washes for `--bd-error` and `--bd-warning` tinted backgrounds (prototype has no alpha tokens for error/warning — same pattern as prototype's `.w-note` using `#FFF3CD`). Every other hex literal blocks merge.
- `--buildrick-*` reference survives in the Layers subtree.
- Wrong font family (no Arial, Helvetica, Roboto fallbacks).
- Selected row missing tinted background, missing accent foreground, or missing 600 weight.

## 11. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Global rules in `components.css` / `ux-fixes.css` leak into `.bdc-lr` via element selectors | Medium | Medium | Grep for bare role selectors, scope with `.bdc-layers` parent if needed. No `!important`. |
| Expand-all / collapse-all event timing breaks on first render | Low | Low | Event listener registered in existing `useLayersState` mount effect; same pattern as `layers:scroll-to-selection`. |
| Parent sidebar grid breaks when `PanelShell` disappears | Low | Medium | `LayersTab` returns a full-height `<section class="bdc-panel">`. Parent grid cell is unchanged. |
| Lucide-based element icons drift in size / stroke | Medium | Low | Global `.bdc-lr-ic svg` rule enforces `width/height: 13; stroke-width: 1.5`. |
| Hex-gate CI fails on new CSS | Low | High | `layers-v2.css` uses `var(--bd-*)` only; audited manually before commit 1. |

## 12. Out of scope

- Rail, topbar, footer, canvas, inspector. Shell v1 handles these.
- Other sidebar tabs (Add, Pages, Templates, Design, Settings, History, Components, AI, Media). Each gets its own spec.
- Dark mode. Editor chrome is canonical light per DESIGN.md (2026-04-18 flip).
- Keyboard shortcut overlay, drag ghost thumbnails, layer preview thumbnails. New features, not in the prototype.
- Removal of pin / help / close in other tabs' `PanelShell.Header`.

## 13. References

- Prototype: `/Users/shahg/Desktop/design-system/project/left-panel/tab-layers.html`
- Prototype tokens: `/Users/shahg/Desktop/design-system/project/left-panel/_shared.css`
- Bridge tokens + shell v2: `packages/editor/src/editor/shell/chrome.css`
- Current Layers tab entry: `packages/editor/src/editor/sidebar/tabs/layers/LayersTab.tsx`
- Current Layers panel: `packages/editor/src/editor/panels/layers/index.tsx`
- Sibling precedent: `docs/superpowers/specs/2026-04-18-pages-tab-prototype-port-design.md`
- Memory: `project_new_design_shell_20260423.md`, `project_editor_ds_intake_20260423.md`
