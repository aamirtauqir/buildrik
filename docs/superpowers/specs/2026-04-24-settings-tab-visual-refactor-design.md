# Settings Tab — Visual Refactor Design (prototype alignment)

**Date:** 2026-04-24
**Revision:** v2 (post CEO review — 11 issues resolved)
**Status:** Draft (approved section-by-section, awaiting final spec review)
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
- 6 nav entries (General, Branding, SEO, Integrations, Publishing, Billing); prototype has 5 but user directive is "data rehney do" — Billing stays as the 6th row AND is held to the same visual standard as the other five (see §5, §13)
- `Branding` currently delegates to the full `DesignSystemTab` component — this changes in V1 (see §4 decision)
- `usePanelNavigation` persists section per-project via localStorage key `settings-panel-${projectId}` — MUST be preserved during the rewrite (see §5 ownership list)
- `SettingsNavGuard` modal handles dirty-switch confirm; visual skin is updated to match prototype (see §13 done-when)

Composer surface (untouched):
- `composer.getProjectSettings()` / `composer.setProjectSettings(next)`
- `composer.saveProject()`
- `useSettingsScreen` hook wiring composer reads/writes to screen state

## 4. Chosen approach

**Option 1 — Shell rewrite + new primitives.** Rewrite the SettingsTab shell and the `shared.tsx` primitive catalog to match the prototype. Screens keep their existing fields and composer I/O; their JSX swaps imports from the same primitive names (new visual skin, same TS API). Central savebar replaces per-screen `StickyFooter`.

### Branding screen: drop the delegate

`DesignSystemTab` is a full `mode: "fullpage"` tab with its own `PanelShell.Header`, layout chrome, and scroll region. Rendering it inside Settings' pane would produce nested headers, double scroll areas, and token mismatches.

**V1 decision:** the Branding section renders a plain placeholder: "Design tokens live in the Palette tab →" with a link button that navigates to the `design` tab. No embedded DesignSystemTab. Keeps the section's shell clean and prototype-aligned. Users with intent to edit tokens click through to the dedicated Palette tab.

This is cleaner than stripping DesignSystemTab chrome (surgery on a separate tab) or accepting visual mismatch (poor first impression).

Considered and rejected:
- **Option 2 — Token + padding swap only.** Fastest (~1h) but misses prototype's switch-row info layout, field label mono treatment, section border-bottom pattern. ~60% parity.
- **Option 3 — Parallel `SettingsTabV2`.** Doubles surface area and contradicts "remove legacy" directive. Overkill.

## 5. Architecture

### File layout

```
packages/editor/src/editor/sidebar/tabs/settings/
├── SettingsTab.tsx          REWRITE — shell (140 snav + 1fr pane), central savebar
├── settings.css             NEW — all prototype classes scoped .bd-set-*
├── shared.tsx               REWRITE — Section, Field, Toggle, Input, Select, Textarea, Inwrap, Switch, Savebar, SnavRow; plus token migration for Locked primitives (see below)
├── constants.ts             UNTOUCHED
├── types.ts                 UNTOUCHED
├── icons.tsx                UPDATE — swap SVG shapes to match prototype (see §12 commit 3)
├── hooks/useSettingsScreen.ts UNTOUCHED
├── screens/*.tsx            IMPORT SWAPS ONLY (JSX unchanged) except:
│                            - SiteSettingsScreen: drops StickyFooter + auto-save-on-blur
│                            - Branding: replaced with placeholder linking to /design tab
│                            - LockedScreen: token-only migration (buildrick→bd), layout preserved
│                            - BillingScreen: migrated to new primitives like every other section
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

- **SettingsTab owns:**
  - Nav state (via `usePanelNavigation` — **PRESERVE** storage key `settings-panel-${projectId}` for section persistence per project)
  - resetKey bump for forced-remount discard
  - Central dirtyCount (aggregated from child `ScreenProps.onDirtyChange` callbacks)
  - Savebar rendering
  - Dirty-switch ConfirmDialog (`SettingsNavGuard` — new prototype-aligned visual skin, see §13)
  - Branding placeholder content + "Open Palette →" click handler routing to `design` tab
- **Screens own:** local form state + composer I/O, nothing else. No per-screen sticky footer.
- **Primitives own:** visual shell only (`.bd-set-section` border, `.bd-set-field` label, `.bd-set-switch` toggle markup)

## 6. Primitive catalog

Prototype CSS class → React primitive in `shared.tsx` (mount via `settings.css` classes):

**V1 — required primitives (used by every screen):**

| Prototype | Primitive | CSS class |
|---|---|---|
| `.ssection` | `<Section title desc>` | `.bd-set-section` + `.bd-set-section-h` + `.bd-set-section-d` |
| `.field` | `<Field label hint>` | `.bd-set-field` + `.bd-set-field-lbl` + optional `.bd-set-field-hint` / `.bd-set-field-cc` |
| `.field input/textarea/select` | `<Input>`, `<Textarea>`, `<Select>` | `.bd-set-input` |
| `.switch-row` + `.switch` | `<SwitchRow title desc checked onChange>` | `.bd-set-switch-row` + `.bd-set-switch` + `.bd-set-switch-knob` |
| `.savebar` | `<Savebar changeCount onDiscard onSave>` | `.bd-set-savebar` (slide-up via `.on` modifier) |
| `.snav .row` | `<SnavRow icon label badge active onClick>` | `.bd-set-snav-row` |

**V1 — preserved Locked primitives (token migration only):**

`LockedContainer`, `LockedIcon`, `LockedTitle`, `LockedDesc`, `LockedBtn` live in `shared.tsx` today, consumed by `LockedScreen.tsx`. Keep their current layout/spacing. Migrate `--buildrick-*` to `--bd-*` tokens. No structural change.

**V2 — deferred primitives (skipped in V1):**

The prototype demonstrates `.inwrap` (prefix/suffix input), `.serp` (SERP preview card), `.pub-card` (publish status card), `.int-row` (integration row), `.fav` (favicon chip). Grep shows zero current usage in any screen (SeoScreen has no SERP markup, PublishingHub has no status card, IntegrationsHub has no integration-row markup). Adding them in V1 would slip new features under a "visual refactor" banner.

Deferred to a V2 spec that owns both the visual treatment and the backing composer fields. V1 primitive catalog stays focused on what the current screens actually render.

The primitive React API stays compatible. `<Section>` gains an optional `desc` prop for the prototype's sub-heading line; this is additive so existing consumers don't need code changes.

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

### Behavior change: no auto-save-on-blur

Today `SiteSettingsScreen` auto-saves on input blur (lines 82–88, `handleBlur → handleSave`). This conflicts with prototype's commit-on-Save model. V1 removes the blur-save behavior. User must click Save to persist.

Release note copy (include in commit message for the step that makes this change): "Settings fields no longer auto-save on blur. The Save button commits changes; the savebar surfaces unsaved state."

Test impact: any test asserting blur-save behavior must migrate to click-save behavior.

## 8. Dead-code sweep (within this scope only)

**Rule of thumb:** before deleting any file or symbol, grep across the full `packages/editor/src/` tree, not just `settings/`. Past SSOT failures in this repo came from treating settings-local consumers as authoritative when other packages also imported.

Concrete sweep steps:

1. Replace all `--buildrick-*` with `--bd-*` inside `settings/` (including `LockedScreen.tsx` and all Locked primitives in `shared.tsx`). Source locations include `SettingsTab.tsx` (20+ inline styles), `SiteSettingsScreen.tsx` (lines 195, 203, 207), `shared.tsx`, and any screen with legacy color tokens.
2. Delete `const <foo>Styles: React.CSSProperties` blocks that become unreferenced after class migration.
3. Delete unused imports surfaced post-rewrite — most notably `StickyFooter` usages in screens that relied on per-screen save UI.
4. Audit `shared.tsx` exports. Verified unused-or-redundant candidates (zero external consumers): `Note`, `Warning`, `SuccessNote`, `ErrorHint`, `Muted`, `StatusRow`, `UrlRow`, `ToggleControlled` (alias of `Toggle`). Before deleting each: `rg -l "<SymbolName>" packages/editor/src/` — delete only if match count is zero outside `settings/shared.tsx`.
5. Screen-file orphans: `IntegrationsScreen.tsx` (93 LOC), `AdvancedScreen.tsx`, `AnalyticsScreen.tsx`. Run `rg -l "IntegrationsScreen|AdvancedScreen|AnalyticsScreen" packages/editor/src/` to confirm sole consumer is `IntegrationsHub.tsx`. If confirmed orphaned by the rewrite, delete. If any external `editor/` path imports them, keep.
6. Assess `FEATURE_FLAGS.domains` (currently `false`). If the flag has never flipped in git history, remove the gate.
7. Remove commented-out or `@deprecated` symbols in `types.ts` or `shared.tsx`.

Rules (from `CLAUDE.md`):
- No pass-through wrappers
- No re-exports that only forward
- No `// keep for future` markers
- Delete aggressively; git has history

## 9. Out of scope

- Engine-side composer changes (no new field persistence)
- New fields shown in the prototype but not backed by composer today (site description, timezone, primary brand color, display font, dark mode default, meta title/description, integration on/off + ids, primary domain, force SSL, redirect www). These will be added in a later spec that owns the engine surface.
- V2 primitives (`<Inwrap>`, `<SerpPreview>`, `<PublishStatusCard>`, `<IntegrationRow>`, `<FaviconChip>`) — deferred per §6.
- Rewriting `DesignSystemTab`. Branding section becomes a placeholder linking to the existing Palette tab.

## 10. Testing

### Automated

`__tests__/SettingsTab.test.tsx` — updated assertions:
- 6 snav rows render (General, Branding, SEO, Integrations, Publishing, Billing)
- Click row → active class flips, pane body swaps
- Branding row shows the placeholder + "Open Palette" link; clicking the link navigates to `design` tab
- Dirty state → savebar mounts with `.on` class, shows changeCount
- Discard → savebar unmounts, resetKey bumps (child remount)
- Save → `composer.saveProject` called once
- Dirty-switch → `SettingsNavGuard` opens; Discard dismisses & navigates; Cancel stays

**Pre-migration audit (required before updating assertions):**
- Grep the test file for queries by legacy class names (`.sett-*`, `buildrick`) or legacy token values in `style=` assertions.
- Migrate each to the new `.bd-set-*` class or token.
- If a query relies on an attribute that no longer exists (e.g., a `data-testid` that was on the old inline-styled div), add an equivalent `data-testid` to the new primitive. Do not rely on class-name presence alone — tests that match zero elements pass silently in RTL.

`hooks/useSettingsScreen.test.ts` — untouched (no behavior change).

Screen-level tests: assertions targeting form fields continue to pass. Any test in `SiteSettingsScreen` asserting blur-save behavior migrates to click-save behavior (per §7 behavior change).

Framework: Vitest + React Testing Library per stack conventions.

### Manual verification

See §11.

## 11. Manual verification

1. Rail (48px) → Settings icon active → panel width 48 + 140 + content
2. Snav background `--bd-bg-subtle`; row hover bg subtle; active bg `--bd-accent-tint`, color `--bd-accent`, weight 600
3. Snav icons match prototype shapes (not current `icons.tsx` shapes — verify SVG paths per prototype lines 175–183)
4. Pane header uses `PanelShell.Header` — title + subtitle, height 44
5. Section h3 = 11.5px 600 heading; `.desc` = 10.5px muted
6. Field label = 10px mono, color `--bd-fg-secondary`
7. Input focus ring: `box-shadow: 0 0 0 3px var(--bd-accent-tint)` + border `--bd-accent`
8. Switch knob animates in 120ms
9. Savebar `.bd-set-savebar.on` slides from `translateY(100%)` to `translateY(0)` in 180ms
10. `SettingsNavGuard` modal uses new primitives (body text `--bd-fg-primary`, buttons match savebar button treatment, bg `--bd-bg-card`, no legacy `--buildrick-*`)
11. All six sections (General, Branding, SEO, Integrations, Publishing, Billing) render under the same shell with consistent typography + spacing. No section visually stands out.
12. Branding section displays the placeholder: heading + one-line description + "Open Palette →" button. Clicking button activates the `design` tab in the rail.
13. Last-open section persists across reload (localStorage key `settings-panel-${projectId}` preserved)
14. `grep -r "buildrick" packages/editor/src/editor/sidebar/tabs/settings/` returns zero matches
15. `grep "^export" shared.tsx` contains no unused symbols (after §8 sweep)

## 12. Rollout

One PR, commit order for reviewability. **Important:** only commit 5 (the final) is visually correct across the whole tab. Commits 2–4 may show temporary misalignment where some surfaces use new skin and others still use old shell; that is expected for the commit-by-commit history. Reviewers should land the PR in one go; bisects between 2–4 will look broken.

1. **ds-settings-css** — add `settings.css` with `.bd-set-*` classes. No consumer yet. Visual: no change. TS: clean.
2. **ds-settings-primitives** — rewrite `shared.tsx` primitives to emit new classes. Keep same TS API. Locked primitives get token migration only. Visual: screens look different inside, shell unchanged. TS: clean.
3. **ds-settings-shell+icons** — rewrite `SettingsTab.tsx` shell (140+1fr), swap `icons.tsx` SVG shapes to prototype, central savebar, drop inline style objects, Branding section becomes placeholder linking to `design` tab. Visual: shell matches prototype. TS: clean.
4. **ds-settings-screens** — drop `StickyFooter` from `SiteSettingsScreen` and any other screen with per-screen save UI; remove auto-save-on-blur from `SiteSettingsScreen` (explicit commit message note per §7). Update `BillingScreen` to use new primitives like every other screen. Visual: full parity. TS: clean. Tests: migrated.
5. **ds-settings-cleanup** — delete confirmed-orphan primitives (`Note`, `Warning`, `SuccessNote`, `ErrorHint`, `Muted`, `StatusRow`, `UrlRow`, `ToggleControlled`), dead inline styles, verified-orphan screen files (`IntegrationsScreen`, `AdvancedScreen`, `AnalyticsScreen` — only if grep confirms), `--buildrick-*` remnants. Assess `FEATURE_FLAGS.domains` removal. Visual: no change from commit 4. TS: clean.

Per commit: `npx tsc --noEmit`, settings test file, dev server sanity click-through.

## 13. Done when

- Prototype side-by-side shows 90%+ visual match across all six sections (General, Branding, SEO, Integrations, Publishing, Billing). Billing is held to the same standard as the five prototype sections.
- Branding section shows placeholder + working "Open Palette →" link. No embedded DesignSystemTab chrome.
- `SettingsNavGuard` modal matches prototype visual language (body text, button grid, tokens).
- Last-open section persists per project across reload.
- Zero `--buildrick-*` in `packages/editor/src/editor/sidebar/tabs/settings/`.
- All existing tests green. Tests querying legacy classes migrated or data-testid'd.
- No dead exports in `shared.tsx`. Verified by grep across full `packages/editor/src/`.
- `tsc --noEmit` clean for touched files.

## 14. Risks

- **`SettingsNavGuard` is an existing modal component.** Its current styles are legacy. Updating its visual skin is now a §13 gate, not just a §14 afterthought.
- **DesignSystemTab under Branding (historical risk).** Resolved in §4: Branding becomes a placeholder linking to the `design` tab. DesignSystemTab is untouched and keeps its own Palette tab home.
- **Auto-save-on-blur removal** (§7) is a user-facing behavior change, not cosmetic. Release-note copy required in the commit message; tests must migrate.
- **V2 primitive scope creep.** Prototype shows `.serp`, `.pub-card`, `.int-row`, `.inwrap`, `.fav` but current screens don't render equivalent content. Holding the line: no new UI in V1 under the "visual refactor" banner. V2 spec owns those primitives + backing composer fields together.
- **Commit 2–4 visual regressions.** Documented in §12. Not a blocker for PR-level merge but bisects will look partial.

## 15. CEO review resolutions (v2 changelog)

Tracking for reviewer transparency. Issues identified during `/plan-ceo-review`:

| # | Issue | Resolution |
|---|---|---|
| 1 | Branding delegate = broken UX | §4: drop the delegate; render placeholder + link to `design` tab |
| 2 | Billing visual exemption = contradiction | §13: remove exemption; Billing held to same 90% standard |
| 3 | LockedScreen token sweep missing | §5 + §6 + §8: explicit token migration for Locked primitives, layout preserved |
| 4 | V2 primitives were scope creep | §6: SerpPreview / PublishStatusCard / IntegrationRow / Inwrap / FaviconChip deferred to V2 |
| 5 | Auto-save-on-blur change unflagged | §7 + §12 commit 4: explicit behavior change note + release copy |
| 6 | localStorage persistence not preserved | §5 ownership: explicit PRESERVE for `settings-panel-${projectId}` |
| 7 | Snav icons ambiguous | §5 + §11 + §12 commit 3: update `icons.tsx` SVG shapes to prototype |
| 8 | `SettingsNavGuard` style missing done-when | §13 + §11 item 10: added as explicit done-when gate |
| 9 | Test assertion audit missing | §10: pre-migration audit step for legacy class queries |
| 10 | Orphan screen deletion rule | §8: explicit grep-across-full-src/ rule before delete |
| 11 | Commit 2–4 visual regression | §12 preamble: documented as expected interim state |
