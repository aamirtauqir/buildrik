# DS prototype parity arc — close 9 gaps to wireframe fidelity

**Date:** 2026-05-15
**Author:** Saqib + Claude (brainstorming session)
**Prototype source:** `file:///Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html`
**Audit screenshots:** `/tmp/proto-s01.png`, `/tmp/proto-s11.png`, `/tmp/editor-palette.png`, `/tmp/editor-components-2.png`
**Status:** **SHIPPED** 2026-05-15 — 21 commits from `07233be9` (plan) to `05ce0d85` (final fix). All 9 spec gaps closed. Live visual verify passed. Memory log: `project_ds_prototype_parity_arc_shipped_20260515.md`. Deferred follow-ups: history-push for auto-fix, openTokenEditor API, two CreateComponentModal coexistence, multi-select first-id grouping, group dropdown taxonomy, lint-row coverage for Type/Spacing.

## 1. Background

15-section prototype shipped 2026-05-07 as wireframe for the DS+Components arc. Memory log showed ~85% of sections shipped across Phase 0 / A.0-A.2 / B.0-B.3b / Tier-1 mounts / Tier-2 S1-S10 / D.1 between 2026-05-08 and 2026-05-10.

Live audit on 2026-05-15 surfaced 9 concrete gaps invisible to grep:

- s01 — DS landing reachable only via 3-click path (Settings → Branding → Open Palette); no Design rail icon.
- s01 — Page renders fullpage, not panel-with-canvas as in prototype.
- s01 — Light/Dark toggle missing from header despite `ColorModeToggle.tsx` existing.
- s01 — Token usage chips ("used 23×") missing on rows despite engine tracking counts.
- s01 — Beginner-mode hint chip missing.
- s09 surface A — Inline token-row lint with Auto-fix/Ignore not built (surfaces B + C shipped via DSBindingChip + DSLintBanner).
- s12 — `CreateComponentModal` has Name only; missing Group select + "Pre-fill bindings from DS" checkbox; no canvas right-click entry.
- s15 — `handleDetachInstance` fires directly; no confirm modal with snapshot bullets; not Pro-gated.
- s15 — Tokens in dark mode missing dark variant render no warning chip.

## 2. Decisions (locked in brainstorm)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Single arc, 9 fixes | User picked all-in-one over split |
| Layout | Revert to panel mode (320px) | User picked prototype fidelity over Templates-fullpage consistency |
| Save modal | Extend `CreateComponentModal` | Conditional binding fields on canvas-right-click flow; backward-compat with `+` button flow |
| Detach gate | Pro mode only | Matches prototype caption "Detach (Pro mode only)" |
| Lint chip visibility | Show in both Beginner + Pro | Teaching value beats simplicity |

## 3. Task list

Nine tasks, build order matters (A before B before E/D/F because they all sit in panel root).

### A. Layout revert — fullpage → panel mode

**Files:**
- `src/editor/sidebar/FullPageRouter.tsx:15, 66` — remove DesignSystemTab mount
- `src/editor/sidebar/LeftSidebar.tsx` (or panel host) — add `<DesignSystemTab>` in panel route
- `src/editor/sidebar/tabs/settings/SettingsTab.tsx` (Branding subsection) — change "Open Palette" trigger to `composer.ui.openTab('design')` instead of route nav

**Width:** 320px (`--bd-panel-width` token), matches Components panel exactly.

**Mutex:** rail enforces single-panel-open invariant. Opening Design auto-closes Components/Templates if open.

**Engine touch:** none. UI-only refactor.

**Migration:** 2 test files that import `FullPageRouter` DS branch must update assertions.

**LOC:** ~250

### B. Add Design rail icon

**Files:**
- `src/editor/rail/RailButtons.tsx` (or wherever `ls-rail` array lives) — insert between Components and Settings

**Spec:**
- `data-tab="design"`
- Icon: diamond glyph (matches prototype `D` ASCII placeholder; aligns with current Components diamond visually distinct via fill)
- `aria-label="Design system tokens, styles, components"`
- `title="Design tokens, styles, components"`

**Width contention:** With Design + Components both being 320px panels, mutex from A handles overlap.

**LOC:** ~30

### C. Mount ColorModeToggle in DS header

**Files:**
- `src/editor/design-system/ui/DesignSystemTab.tsx` — add `<ColorModeToggle />` next to existing `<DSModeToggle />` in header

**Engine touch:** none. `ColorModeToggle.tsx` already reads/writes `composer.designSystem.colorMode`.

**LOC:** ~5

### D. Token usage chips on Tokens rows

**Files:**
- `src/editor/design-system/ui/sections/TokenKindCard.tsx` — add chip column in row template
- `src/editor/design-system/state/tokenUsage.ts` (verify exists, else create)

**Engine API:**
- `composer.designSystem.getTokenUsage(tokenId): number` — verify exists. Memory log mentions usage data populated for S10 Pro mode. If missing, add wrapper around existing reverse-resolve.

**Style:** small green chip `used Nx`. Counts of 0 render gray "unused" chip.

**LOC:** ~40 (component) + ~30 (engine wrapper if needed)

### E. Beginner mode hint chip

**Files:**
- `src/editor/design-system/ui/sections/TokensSection.tsx` — append bottom hint

**Spec:**
```tsx
{dsMode === 'beginner' && (
  <div className="ds-beginner-hint">
    Beginner mode hides token IDs and alias graph. Toggle Pro to expose.
  </div>
)}
```

**LOC:** ~15 + CSS

### F. s09 surface A inline lint row

**Files:**
- `src/editor/design-system/ui/sections/TokenLintRow.tsx` (new) — amber row + 2 buttons
- `src/editor/design-system/ui/sections/TokenKindCard.tsx` — mount when `lintIssues.length > 0`
- `src/editor/design-system/state/lintSuppressions.ts` (new) — Map<tokenId, boolean> persisted

**Engine API additions:**
- `composer.designSystem.applyAutoFix(tokenId, fixType): void` — wraps existing `contrastFix.ts`
- `composer.designSystem.suppressLint(tokenId): void` — writes to lintSuppressions
- `composer.designSystem.getLintIssues(tokenId): LintIssue[]` — read-side

**UX:**
- Amber row with WCAG message ("⚠ 2.8:1 vs surface · WCAG AA needs 4.5")
- Auto-fix button → applies darken-22% via `contrastFix.ts`, undo-able
- Ignore button → suppresses for this token, persists in localStorage
- Pill count "3 lints" on the row when multiple issues

**LOC:** ~120 (component) + ~60 (engine wrapper) + ~30 (state)

### G. Extend CreateComponentModal with binding fields

**Files:**
- `src/editor/sidebar/tabs/component-library/CreateComponentModal.tsx` — add Group select + Pre-fill checkbox
- `src/editor/sidebar/tabs/component-library/useComponentsState.ts` — handle new submit payload
- `src/editor/canvas/contextMenu/CanvasContextMenu.tsx` (or wherever right-click menu lives) — add "Save as component" entry

**New props:**
```ts
interface CreateComponentModalProps {
  onClose: () => void;
  onSubmit: (payload: { name: string; group: string | null; prefillBindings: boolean }) => void;
  // New:
  selectionContext?: {
    selectionIds: string[];
    extractedBindings: Map<string, string>;  // styleProp → tokenId
  };
}
```

**UX:**
- When `selectionContext` undefined (current `+` button flow): hide Pre-fill checkbox, show Group only
- When `selectionContext` defined (canvas right-click flow): show all fields, checkbox checked by default
- Hint copy: "7 styles will bind to your DS tokens. Editing tokens later updates this component too."

**Engine API:**
- `composer.designSystem.resolveBindings(elementIds: string[]): Map<string, string>` — verify exists (memory says S6 schema interpreter needs it)
- `composer.components.createFromSelection(payload)` — verify exists or add

**LOC:** ~80 (modal) + ~40 (context menu) + ~30 (engine wrapper)

### H. Detach confirm modal (Pro mode only)

**Files:**
- `src/editor/sidebar/tabs/component-library/DetachConfirmModal.tsx` (new)
- `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:144` — wrap direct call with modal
- `src/editor/canvas/contextMenu/CanvasContextMenu.tsx` — gate Detach entry on Pro mode

**Spec:**
- Title: `Detach instance #N from master?`
- Subtitle: `Master: <name> · <N> instances total`
- 4 bullet rows:
  - ✓ Current resolved bindings will be snapshotted
  - ✓ This instance becomes free-form (edit anything)
  - ⚠ Master edits will no longer affect this instance
  - ↩ Undo restores the link (Cmd+Z)
- Cancel + Detach buttons (Detach is primary cobalt)

**Pro gate:**
- `composer.designSystem.dsMode === 'pro'` else hide menu entry entirely (not greyed)
- Per `feedback_dsmode_provider_initial_first_mount.md` — subscribe to mode changes, don't capture initial value

**LOC:** ~80 (modal) + ~20 (gate wiring)

### I. Dark-missing variant chip

**Files:**
- `src/editor/design-system/ui/sections/TokenKindCard.tsx` — color row render branch
- `src/editor/design-system/state/tokenSchema.ts` — verify `darkValue` field exists on color tokens

**Spec:**
- When `colorMode === 'dark'` AND `token.darkValue == null` AND `token.kind === 'color'`:
  - Render `<Chip variant="amber">no dark · falls back</Chip>` in chip slot
  - Click → opens token editor with dark value field focused

**LOC:** ~40

## 4. Engine API verify checklist (pre-flight)

Before starting implementation, grep to confirm:

```bash
# 1. Token usage tracking
grep -rn "getTokenUsage\|tokenUsage" src/engine/

# 2. Lint suppression state
grep -rn "lintSuppression\|suppressLint" src/engine/

# 3. Bindings extraction
grep -rn "resolveBindings\|extractBindings" src/engine/

# 4. Color mode state
grep -rn "colorMode\|darkValue" src/engine/

# 5. Right-click context menu
grep -rn "CanvasContextMenu\|onContextMenu" src/editor/canvas/
```

If any returns 0 hits, that's a sub-task to scope in the implementation plan.

## 5. Build order

```
A (layout) → B (rail icon) → [C, D, E] in parallel → F (lint row) → G (save modal) → H (detach modal) → I (dark chip)
```

A blocks all else (panel root must exist). B is simple but cosmetic — could ship before A. C/D/E are independent and parallelizable. F/G/H/I depend on no others except A.

## 6. Out of scope

- Visual fidelity beyond what prototype specifies
- New token types (color/spacing/typography/radius/shadow only — existing set)
- Re-styling Components panel (s06 already shipped)
- Inspector chip rework (s07 D.1 already shipped, no regression touched)
- Migration runner UI (s13 shipped)
- Starter gallery (s14 shipped)
- AI schema (s08 shipped)
- DS lint banner aggregate (s09 surface C shipped)
- Catalog drag E2E test (deferred; JS attribute presence sufficient)

## 7. Risks + mitigations

| Risk | Mitigation |
|------|------------|
| Panel width competes with Components + Inspector on 1280px viewport | Rail enforces single-panel-open mutex (existing pattern) |
| FullPageRouter mount removal breaks 2 test files | Update tests in same PR as A |
| Token usage API may not exist | Verify in pre-flight (§4); if missing, add to A scope |
| Beginner mode hint chip flickers on mode toggle | Static render gated on `dsMode` prop; no animation |
| Detach modal Pro-gate stale state | Per `feedback_dsmode_provider_initial_first_mount.md` — subscribe via context, don't read initialMode |
| Save modal conditional UI confusing | Hide Pre-fill checkbox entirely (not greyed) when no selection context |
| `replace_all` on prop-rename in 28+ draggable rows | Per `feedback_replace_all_word_boundary.md` — grep `\b<oldName>[A-Za-z]` first |
| Live-canvas <100ms promise unverified | Out of scope; assumed working via existing CSS-var pipeline |

## 8. Success criteria

After arc lands:

1. Click new Design rail icon → 320px DS panel opens, canvas + inspector remain visible
2. DS header shows Beginner/Pro toggle AND Light/Dark toggle
3. Every Tokens row shows usage chip (or "unused" if 0)
4. Beginner mode shows hint chip at bottom of Tokens section
5. Token with WCAG issue shows inline amber row with Auto-fix + Ignore
6. Right-click element on canvas → "Save as component" → modal shows Name + Group + "Pre-fill bindings from DS" checked
7. Right-click instance on canvas in Pro mode → Detach → confirm modal with 4 bullets fires before action
8. Switch to Dark mode → tokens without darkValue show amber "no dark · falls back" chip
9. All 5 deferred verifies from 2026-05-15 audit close (s01 visual fidelity + s11 drag E2E + s09 A + s12 + s15)

## 9. Memory tie-ins

Relevant prior memories to read before implementation:

- `feedback_dsmode_provider_initial_first_mount.md` — Pro gate state subscription
- `feedback_setter_closure_stale_state.md` — modal state callbacks
- `feedback_persistall_stale_state.md` — lint suppression writes
- `feedback_orphan_classes_pattern.md` — chip CSS must ship with className
- `feedback_downstream_first_upstream_gap.md` — wire selectionContext through entire prop chain
- `feedback_replace_all_word_boundary.md` — bulk renames in TokenKindCard rows
- `feedback_audit_by_file_presence_unreliable.md` — live-verify each gap close, not just file diff

## 10. Estimated effort

| Task | LOC | PRs |
|------|-----|-----|
| A. Layout revert | 250 | 1 (foundation) |
| B. Rail icon | 30 | 1 (cosmetic) |
| C. ColorModeToggle mount | 5 | bundle with B |
| D. Usage chips | 70 | 1 |
| E. Beginner hint | 15 | bundle with D |
| F. Inline lint row | 210 | 1 |
| G. Save modal + context menu | 150 | 1 |
| H. Detach modal + Pro gate | 100 | 1 |
| I. Dark-missing chip | 40 | bundle with C/D |
| **Total** | **~870** | **~6 PRs** |
