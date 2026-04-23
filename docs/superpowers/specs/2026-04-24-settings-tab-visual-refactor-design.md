# Settings Tab — Visual Refactor Design (prototype alignment)

**Date:** 2026-04-24
**Status:** Draft (approved section-by-section, awaiting spec review)
**Scope:** Visual-only refactor of the Settings tab to match the latest prototype. Data, fields, and engine surfaces stay untouched.

---

## 1. Intent

Bring `packages/editor/src/editor/sidebar/tabs/settings/` to 90%–100% visual parity with the latest prototype at `design-system/project/left-panel/tab-settings.html`. The prototype is the only source of truth for layout, spacing, typography, colors, sizing, hierarchy, component structure, and interaction states. Each screen's existing fields and composer I/O stay untouched.

Constraint: use only `--bd-*` tokens and prototype-aligned class names. Remove `--buildrick-*` from this scope. Delete dead code and unused CSS as part of the work.

## 2. Prototype summary

File: `design-system/project/left-panel/tab-settings.html`

- 3-column shell inside the panel: 48px rail (owned by LayoutShell) + 140px section nav + 1fr content
- 5 sections in nav: General, Branding, SEO, Integrations, Publishing
- Central dirty counter with sticky `.savebar` that slides up on first edit
- Confirm dialog on section switch while dirty
- Self-contained local state, commit via Save / revert via Discard

Prototype tokens used: `--bd-font`, `--bd-mono`, `--bd-fg-heading`, `--bd-fg-primary`, `--bd-fg-secondary`, `--bd-fg-muted`, `--bd-border`, `--bd-border-medium`, `--bd-bg-card`, `--bd-bg-subtle`, `--bd-accent`, `--bd-accent-hover`, `--bd-accent-tint`, `--bd-success`, `--bd-warning`, `--bd-error`.

## 3. Current state (what we are replacing)

`SettingsTab.tsx` (422 lines) + 11 screen files (1618 LOC):

- 2-column shell: 200px sub-nav + 1fr pane (prototype wants 140px sub-nav)
- Massive inline `React.CSSProperties` objects using legacy `--buildrick-*` tokens
- Per-screen dirty state flagged via `ScreenProps.onDirtyChange`; SettingsTab aggregates but some screens also render their own `StickyFooter` (e.g. `SiteSettingsScreen` line 213)
- 6 nav entries (General, Branding, SEO, Integrations, Publishing, Billing); prototype has 5 but user directive is "data rehney do" — Billing stays as the 6th row
- `Branding` delegates to the full `DesignSystemTab` component; this stays as-is (scope-limited)
- `SettingsNavGuard` modal handles dirty-switch confirm; reused unchanged

Composer surface (untouched):
- `composer.getProjectSettings()` / `composer.setProjectSettings(next)`
- `composer.saveProject()`
- `useSettingsScreen` hook wiring composer reads/writes to screen state

## 4. Chosen approach

**Option 1 — Shell rewrite + new primitives.** Rewrite the SettingsTab shell and the `shared.tsx` primitive catalog to match the prototype. Screens keep their existing fields and composer I/O; their JSX swaps imports from the same primitive names (new visual skin, same TS API). Central savebar replaces per-screen `StickyFooter`.

Considered and rejected:
- **Option 2 — Token + padding swap only.** Fastest (~1h) but misses prototype's switch-row info layout, field label mono treatment, section border-bottom pattern. ~60% parity.
- **Option 3 — Parallel `SettingsTabV2`.** Doubles surface area and contradicts "remove legacy" directive. Overkill.

## 5. Architecture

### File layout

```
packages/editor/src/editor/sidebar/tabs/settings/
├── SettingsTab.tsx          REWRITE — shell (140 snav + 1fr pane), central savebar
├── settings.css             NEW — all prototype classes scoped .bd-set-*
├── shared.tsx               REWRITE — Section, Field, Toggle, Input, Select, Textarea, Inwrap, Switch, Savebar, SnavRow, SerpPreview, PublishStatusCard, IntegrationRow
├── constants.ts             UNTOUCHED
├── types.ts                 UNTOUCHED
├── icons.tsx                UNTOUCHED
├── hooks/useSettingsScreen.ts UNTOUCHED
├── screens/*.tsx            IMPORT SWAPS ONLY — JSX unchanged, primitive names the same
│                            Except: SiteSettingsScreen drops StickyFooter (and any other screen
│                            currently rendering its own sticky footer).
```

### Shell grid

`grid-template-columns: 140px 1fr` inside `PanelShell.Content noScroll`. The outer 48px rail is already owned by `LayoutShell`.

### Shell dimensions (prototype-exact)

| Area | Values |
|---|---|
| Snav column | 140px wide, `background: var(--bd-bg-subtle)`, 1px right border `--bd-border` |
| Snav header block | padding 11px 12px 8px, font 600 11px `--bd-font`, color `--bd-fg-heading`, 1px bottom border |
| Snav rows | padding 6px 8px, border-radius 5px, font 500 11.5px, gap 1px between rows |
| Snav row active | `background: var(--bd-accent-tint); color: var(--bd-accent); font-weight: 600;` |
| Snav row count badge | font 500 9px mono, padding 1px 4px, radius 3, bg `--bd-bg-subtle`; active variant: color `--bd-accent` on white |
| Pane header | existing `PanelShell.Header` (44px, title + subtitle) |
| Pane body | flex 1, overflow auto, padding 0 (sections own their own 12px 12px 16px) |
| Savebar | sticky bottom, padding 8px 10px, 1px top border, `transform: translateY(100%)` → `translateY(0)` at 180ms |
| Save button | padding 5px 10px, radius 5, font 600 10.5px, bg `--bd-accent`, hover `--bd-accent-hover` |
| Discard button | transparent bg, color `--bd-fg-secondary`, hover bg `--bd-bg-subtle` |

### Ownership

- `SettingsTab` owns: nav state, resetKey for forced-remount discard, central dirtyCount, savebar rendering, dirty-switch ConfirmDialog
- Screens own: local form state + composer I/O, nothing else
- Primitives own: visual shell only (`.bd-set-section` border, `.bd-set-field` label, `.bd-set-switch` toggle markup)

## 6. Primitive catalog

Prototype CSS class → React primitive → class emitted:

| Prototype | Primitive | CSS class |
|---|---|---|
| `.ssection` | `<Section title desc>` | `.bd-set-section` + `.bd-set-section-h` + `.bd-set-section-d` |
| `.field` | `<Field label hint>` | `.bd-set-field` + `.bd-set-field-lbl` + optional `.bd-set-field-hint` / `.bd-set-field-cc` |
| `.field input/textarea/select` | `<Input>`, `<Textarea>`, `<Select>` | `.bd-set-input` |
| `.inwrap` + `.pfx` / `.sfx` | `<Inwrap prefix suffix>` | `.bd-set-inwrap` + `.bd-set-inwrap-pfx` / `.bd-set-inwrap-sfx` |
| `.switch-row` + `.switch` | `<SwitchRow title desc checked onChange>` | `.bd-set-switch-row` + `.bd-set-switch` + `.bd-set-switch-knob` |
| `.serp` | `<SerpPreview url title desc>` | `.bd-set-serp` |
| `.pub-card` | `<PublishStatusCard status deployedAt url>` | `.bd-set-pub-card` |
| `.int-row` | `<IntegrationRow logo name desc state onToggle>` | `.bd-set-int-row` |
| `.savebar` | `<Savebar changeCount onDiscard onSave>` | `.bd-set-savebar` (slide-up via `.on` modifier) |
| `.snav .row` | `<SnavRow icon label badge active onClick>` | `.bd-set-snav-row` |

The primitive React API stays compatible. `<Section>` gains an optional `desc` prop for the prototype's sub-heading line; this is additive so existing consumers don't need code changes.

Favicon chip (`.fav`) stays reserved — Branding delegates to `DesignSystemTab`, which has its own treatment. Skip mounting in V1; add to catalog only if a later screen needs it.

## 7. Data flow

```
Screen edits field
  → useSettingsScreen().markDirty()
    → ScreenProps.onDirtyChange(true)
      → SettingsTab increments central dirtyCount
        → Savebar mounts with slide-up, shows "N unsaved"

Save
  → SettingsTab.handleSave()
    → composer.saveProject()
      → useSettingsScreen hooks markClean on next composer read
        → Savebar slides down

Discard
  → SettingsTab.handleDiscard()
    → resetKey bump forces pane remount
      → screens re-read composer (unchanged state), forms reset
        → dirtyCount → 0, savebar hides

Snav click while dirty>0
  → SettingsTab intercepts → SettingsNavGuard opens
    → Discard+switch: resetKey bump + navigateTo
    → Cancel: stay
```

No new engine work. Composer types and methods unchanged.

## 8. Dead-code sweep (within this scope only)

1. Replace all `--buildrick-*` with `--bd-*` inside `settings/`. Source locations include `SettingsTab.tsx` (20+ inline styles), `SiteSettingsScreen.tsx` (lines 195, 203, 207), `shared.tsx`, and any screen with legacy color tokens.
2. Delete `const <foo>Styles: React.CSSProperties` blocks that become unreferenced after class migration.
3. Delete unused imports surfaced post-rewrite — most notably `StickyFooter` usages in screens that relied on per-screen save UI.
4. Audit `shared.tsx` exports. Current unused-or-redundant candidates: `Note`, `Warning`, `SuccessNote`, `ErrorHint`, `Muted`, `StatusRow`, `UrlRow`, `ToggleControlled` (alias of `Toggle`). Delete any with zero consumers after migration.
5. Screen-file orphans: compare `IntegrationsScreen.tsx` (93 LOC) vs `IntegrationsHub.tsx` (53 LOC); `AdvancedScreen.tsx`; `AnalyticsScreen.tsx`. Delete if proven orphan after IntegrationsHub rewrite.
6. Assess `FEATURE_FLAGS.domains` (currently `false`). If the flag has never flipped, remove the gate.
7. Remove commented-out or `@deprecated` symbols in `types.ts` or `shared.tsx`.

Rules (from `CLAUDE.md`):
- No pass-through wrappers
- No re-exports that only forward
- No `// keep for future` markers
- Delete aggressively; git has history

## 9. Out of scope

- Engine-side composer changes (no new field persistence)
- New fields shown in the prototype but not backed by composer today (site description, timezone, primary brand color, display font, dark mode default, meta title/description, integration on/off + ids, primary domain, force SSL, redirect www). These will be added in a later spec that owns the engine surface.
- Prototype's Branding inline controls. Branding continues to delegate to `DesignSystemTab` as today.
- Prototype's Publishing content beyond what `PublishingHub` already renders.

## 10. Testing

- **Automated (`__tests__/SettingsTab.test.tsx`):**
  - 6 snav rows render (General, Branding, SEO, Integrations, Publishing, Billing)
  - Click row → active class flips, pane body swaps
  - Dirty state → savebar mounts with `.on` class, shows changeCount
  - Discard → savebar unmounts, resetKey bumps (child remount)
  - Save → `composer.saveProject` called once
  - Dirty-switch → SettingsNavGuard opens; Discard dismisses & navigates; Cancel stays
  - Assertions updated to query new `.bd-set-*` class names instead of legacy tokens
- **`hooks/useSettingsScreen.test.ts`:** untouched — no behavior change.
- **Screen-level tests:** assertions targeting form fields continue to pass; any visual-shell assertions migrate to new classes.
- Framework: Vitest + React Testing Library per stack conventions.

## 11. Manual verification

1. Rail (48px) → Settings icon active → panel width 48 + 140 + content
2. Snav background `--bd-bg-subtle`; row hover bg subtle; active bg `--bd-accent-tint`, color `--bd-accent`, weight 600
3. Pane header uses `PanelShell.Header` — title + subtitle, height 44
4. Section h3 = 11.5px 600 heading; `.desc` = 10.5px muted
5. Field label = 10px mono, color `--bd-fg-secondary`
6. Input focus ring: `box-shadow: 0 0 0 3px var(--bd-accent-tint)` + border `--bd-accent`
7. Switch knob animates in 120ms
8. Savebar `.bd-set-savebar.on` slides from `translateY(100%)` to `translateY(0)` in 180ms
9. `grep -r "buildrick" packages/editor/src/editor/sidebar/tabs/settings/` returns zero matches
10. `grep "^export" shared.tsx` contains no unused symbols

## 12. Rollout

One PR, commit order for reviewability:

1. **ds-settings-css** — add `settings.css` + scoped classes (no consumer yet)
2. **ds-settings-primitives** — rewrite `shared.tsx` to use new classes; same TS API
3. **ds-settings-shell** — rewrite `SettingsTab.tsx`, central savebar, drop inline style objects
4. **ds-settings-screens** — drop `StickyFooter` from screens that had their own save UI
5. **ds-settings-cleanup** — delete unused primitives, dead inline styles, any orphan screens, `--buildrick-*` remnants

Per commit: `npx tsc --noEmit`, settings test file, dev server sanity click-through.

## 13. Done when

- Prototype side-by-side shows 90%+ visual match across the five active sections (Billing exempt)
- Zero `--buildrick-*` in `packages/editor/src/editor/sidebar/tabs/settings/`
- All existing tests green
- No dead exports in `shared.tsx`
- `tsc --noEmit` clean for touched files

## 14. Risks

- **Auto-save-on-blur in `SiteSettingsScreen`** conflicts with prototype's commit-on-Save model. Fix: remove blur-save once central savebar lands. Call out in commit message.
- **`DesignSystemTab` under Branding** has its own shell and header; will look out of place under the new pane header. Accept for V1; note as follow-up.
- **`SettingsNavGuard`** is an existing modal; confirm its styles work against the new shell or swap to a prototype-aligned confirm.
