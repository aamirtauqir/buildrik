# DS prototype full rewrite arc — Design Spec

- **Date**: 2026-05-15
- **Author**: Claude Opus 4.7
- **Status**: SHIPPED 2026-05-15 (commits `f5f13f6e`..`d3fde9f0`) — see `~/.claude/projects/.../memory/project_ds_full_rewrite_arc_shipped_20260515.md`
- **Reference prototype**: `file:///Users/shahg/.gstack/projects/aamirtauqir-buildrik/designs/ds-components-prototype-20260507/index.html`
- **Predecessor**: `2026-05-15-ds-prototype-parity-arc-design.md` (T1-T13 SHIPPED) — that arc closed structural gaps; this arc fixes the visual paradigm mismatch the parity arc missed.

---

## 0. Why this arc exists

The prior parity arc (13 tasks, 21 commits, 2026-05-15) added new engine APIs (`tokenUsage`, `lintState`, `tokenBindingResolver`), reverted DS layout from fullpage to 320px panel, and surfaced 9 spec gaps. Visual verify at close-out screened against s01/s11 only and missed:

1. Token rendering paradigm: live ships **6-column swatch grid**; prototype shows **vertical horizontal rows**. Live treats colors as palette catalog (legacy); prototype treats them as token registry.
2. Pro mode visual surface: spec said "Pro exposes everything (token IDs, aliases, CSS var names)"; live shows zero of these regardless of mode. DSMode prop chain stops at TokensSection (only used for beginner hint chip), never reaches ColorTokenList.
3. Dark mode chrome: prototype s15 inverts entire DS panel to dark `#0F172A`; live keeps light chrome and shows per-swatch amber "no dark" chips beneath tiles. Aggregate "N missing dark" chip absent.
4. Token detail surface: prototype s02 shows two-pane (list + right-pane detail editor with Light/Dark value · Used by · Aliased by · Lint · Replace/Rename/Delete actions). Live has NO per-token detail view; row click opens inline ColorPicker drawer only.
5. ColorModeToggle UX: prototype is 2-pill `[Light][Dark]` seg; live is single icon-cycle button (Sun → Moon → Monitor cycle).
6. Accordion header: prototype `COLOR · 12 TOKENS [-]` (mono uppercase + count + glyph); live `Color  9 tokens ⌄` (lucide chevron, no count visible in header).
7. Lint placement: prototype highlights offending row yellow inline; live mounts separate TokenLintRow spanning full grid width below.

**Audit failure root cause**: parity-arc audit checked "chip present, lint row mounts, dark-missing chip exists" without checking primary renderer layout shape. T7-T10 of prior arc layered new chips/lints onto existing 6-col grid renderer rather than rewriting to row paradigm. Memory `feedback_audit_by_file_presence_unreliable` exists for exactly this anti-pattern — was not invoked during parity-arc close-out.

---

## 1. Goals + non-goals

### Goals
- DS tab visual structure matches prototype s01/s02/s10/s15 row-paradigm.
- Pro mode reveals token IDs, alias arrows, CSS var names per s02/s10.
- Click a row → drill-in detail view per s02 right-pane shape.
- Dark mode toggle inverts DS panel chrome only (not editor) per s15.
- ColorModeToggle = 2-pill seg `[Light][Dark]`.
- Accordion header `COLOR · 12 TOKENS [-]` mono format.
- Lint state inline on row, not separate span row.
- Lock with row-shape regression test so v13 doesn't revert to grid in future.

### Non-goals
- New engine APIs. All needed work reuses `composer.aliasResolver`, `composer.designSystem.tokenUsage`, `composer.designSystem.lintState`, `composer.designSystem.computeAutoFix`, `composer.colorMode`.
- "Used by N elements · M presets · K instances" breakdown (defer until engine adds element/preset/instance split).
- Manual "Browse starters" re-open button (StarterGalleryModal already first-run-only via `seen-flag`).
- Token detail Aliased-by reverse lookup unless `aliasResolver.findReverseRefs()` exists today (probe during T8 impl; if absent → omit field, document follow-up).
- Editor-wide dark mode. Only DS panel chrome inverts. Inspector + canvas + topbar stay light.

---

## 2. Baked architectural decisions

| # | Decision | Rationale |
|---|---|---|
| **D1** | Drop System mode from UI cycle | Prototype shows 2-pill seg only. System remains in `composer.colorMode` state (auto-detect first load), but not user-toggleable. |
| **D2** | StarterGalleryModal stays first-run-only | Already gated via `seen-flag` localStorage. No manual re-open this arc. |
| **D3** | Drill-in detail (not pane-split) | Saved memory `feedback_drill_in_drawer_preference` locked this for sidebar UX. Click row → push detail onto DS panel; back arrow returns. |
| **D4** | Delete PickerDrawer | Inline picker drawer dies. ColorPicker mounts inside detail view "Light value" field instead. |
| **D5** | Aggregate dark-missing chip > per-swatch | Reduces visual noise. Single chip at top of color section, click pops first missing token's detail view (stub if no `openTokenEditor` API). |
| **D6** | TokenRow as SSOT | New shared component `ui/sections/TokenRow.tsx`. ColorTokenList, TypeTokenList, SpacingTokenList, GenericTokenList all adopt. Bespoke FontFamilyRow/TypeScaleRow/ValueChip die. |
| **D7** | TokenLintRow component deleted | Lint becomes inline row state (className + bg + border-left + inline lint description). Auto-fix/Ignore buttons move to detail view. |
| **D8** | Dark panel via `data-ds-preview` attribute | Outermost DesignSystemTab wrapper gets `data-ds-preview={resolvedMode}`. CSS overrides scoped to `[data-ds-preview="dark"] *`. No `<html>`-level swap. |
| **D9** | Drill-in stack state local to TokensSection | No global router. `useState<{ kind: "list" } \| { kind: "detail", tokenId }>` lives inside TokensSection (or new TokensRouter wrapper). |
| **D10** | "Used by" displays single count first | `composer.designSystem.tokenUsage.usedBy()` returns count today. Element/preset/instance split = follow-up. |

---

## 3. The 10 tasks

### T1 — ColorModeToggle 2-pill seg

**Change**: `editor/design-system/ui/ColorModeToggle.tsx` (128 → ~70 LOC)
- Replace IconButton with 2-pill seg container (`<div role="tablist">`).
- Two `<button role="tab">` pills: `[Light]` `[Dark]`. Active pill = cobalt bg + white fg. Inactive = transparent + muted fg.
- Click handlers call `composer.colorMode.set("light"|"dark")`. System mode dropped from UI.
- Tooltip preserved (missing-dark count surfaces here if non-zero).
- WAI-ARIA: `role="tablist"` on container, `role="tab"` + `aria-selected` on pills.

**Tests rewrite**: `__tests__/ColorModeToggle.test.tsx` — assert 2 pills, active state, aria-selected, click dispatches correct mode.

### T3 — Accordion header format

**Change**: `editor/design-system/ui/sections/TokensSection.tsx` accordion header (~lines 200-260)
- Replace `<ChevronDown />` lucide with custom `+`/`-` text glyph.
- Header format: `COLOR · 12 TOKENS [+]` (collapsed) / `COLOR · 12 TOKENS [-]` (expanded).
- Font: `var(--buildrick-font-family-mono)`, uppercase, letterSpacing 0.08em, color `var(--bd-fg-muted)`.
- Inline count between label and glyph, also mono.
- Layout: flex row, alignItems center, gap 8, label left, divider line center, count + glyph right.

**Tests**: extend `TokensSection.test.tsx` — assert count appears in header, plus/minus glyph swaps on toggle.

### T4 — ColorTokenList grid → row list

**Change**: `editor/design-system/ui/colors/ColorTokenList.tsx` (767 → ~400 LOC)
- Delete `SwatchGrid` component entirely.
- Delete `compactLabel()` helper (used full token.name in rows).
- Delete `PickerDrawer` component (moved to T8 detail view).
- New: `ColorTokenRow` component (or use shared T9 TokenRow with swatch slot).
- Group structure preserved (brand → surface → state).
- Row click emits `onRowClick(tokenId)` to parent (drill-in trigger).
- Search/filter (all/issues) preserved.
- "Fix all" + per-row contrast fix preserved but rendered in row, not grid sidebar.

**New regression test**: `__tests__/ColorTokenList.row-shape.regression.test.tsx` — asserts:
- Container has NO `grid-template-columns` style.
- Children render as vertical stack (display flex column on container).
- Each row has `role="button"` or `data-token-row` marker.
- Lock against future v13 swing back to grid.

**Tests rewrite**: ALL existing ColorTokenList tests asserting `data-testid="swatch-tile-X"` or grid shape → migrate to row shape.

### T5 — Pro mode branch in row

**Change**: `editor/design-system/ui/sections/TokensSection.tsx` + `colors/ColorTokenList.tsx`
- TokensSection reads `dsMode?.mode === "pro"`, passes `isPro` prop to ColorTokenList.
- ColorTokenList → ColorTokenRow gets `isPro`.
- Row template (Pro-only conditional):
  - ID line: `<span className="mono">{token.id}</span>` (e.g., `color.brand.primary`)
  - Alias arrow chip: when `composer.aliasResolver.resolveChain(token.id).length > 1` → `→ {chain[1].targetId}` mono chip.
  - CSS var name: defer to detail view (T8); too long for row.

**Source for alias chain**: `composer.aliasResolver.resolveChain(tokenId)` — probe API during impl, fall back to omitting alias chip if not present.

**Tests**: new `__tests__/ColorTokenList.pro-mode.test.tsx`
- Render with `isPro=false` → expect ID NOT in DOM.
- Render with `isPro=true` → expect ID + (if aliased) alias chip in DOM.

### T6 — Aggregate dark-missing header chip

**Change**: `editor/design-system/ui/colors/ColorTokenList.tsx` header area
- Drop `isDarkMode` + `onDarkMissingClick` from per-row prop chain.
- Compute at list level: `missingDark = tokens.filter(t => t.kind === "color" && !t.darkValue).length`.
- Render aggregate chip at top of color section (before first GroupHeader): only when `resolvedMode === "dark"` AND `missingDark > 0`.
- Chip style: amber bg + fg per `var(--buildrick-warning-soft)` / `var(--buildrick-warning-strong)`, icon `⚠`, text `N tokens missing dark variant`, click → emit `onDarkMissingClick(firstMissingId)` (drill-in trigger).

**Tests refactor**: `__tests__/colors/DarkMissingChip.test.tsx` — currently asserts per-row chip. Rewrite to assert aggregate header chip:
- Render with 3 color tokens, no darkValue, mode dark → expect "3 tokens missing dark variant" in DOM.
- Render in light mode → expect chip NOT in DOM.
- Render with all darkValues set → expect chip NOT in DOM.

### T7 — Inline lint highlight (delete TokenLintRow)

**Change**:
- Delete `editor/design-system/ui/sections/TokenLintRow.tsx` (~120 LOC).
- Delete `editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx`.
- ColorTokenList → ColorTokenRow reads `getLintIssues(token.id)` (already wired).
- If non-empty:
  - Row container className adds `is-lint-warn` modifier.
  - Inline styles: `bg: rgba(245,158,11,0.08)`, `borderLeft: 3px solid var(--buildrick-warning-strong)`, `paddingLeft: 9px` (offset for border).
  - Row appends inline lint description line: `△ {issue.description}` (12px italic amber).
  - Right side gets `[lint]` mono tag.
- Auto-fix + Ignore buttons → moved to detail view (T8) only.

**Tests**: new `__tests__/ColorTokenList.lint-state.test.tsx`
- Render row with lint issue → expect `is-lint-warn` class, inline description text, `[lint]` tag.
- Render row without lint → expect none of above.

### T8 — Token detail drill-in view

**New files**:
- `editor/design-system/ui/sections/TokenDetailView.tsx` (~250 LOC)
- `editor/design-system/ui/sections/TokensRouter.tsx` (~80 LOC) — drill-in stack wrapper around TokensSection content.

**TokensRouter shape**:
```tsx
const [view, setView] = React.useState<
  { kind: "list" } | { kind: "detail"; tokenId: string }
>({ kind: "list" });
return view.kind === "list"
  ? <TokenAccordion onRowSelect={(id) => setView({ kind: "detail", tokenId: id })} />
  : <TokenDetailView tokenId={view.tokenId} onBack={() => setView({ kind: "list" })} />;
```

**TokenDetailView fields** (per s02 right-pane):
- Back arrow header: `← Back to tokens`
- Token preview: 24×24 swatch + name (16px) + id mono (12px) + css-var (`--ds-color-X` derived from token kind+id).
- Light value: input field + ColorPicker inline (color tokens) OR text input (other kinds).
- Dark value: input field (color tokens) OR `+ add (currently falls back)` placeholder if empty.
- Used by: `composer.designSystem.tokenUsage.usedBy(tokenId)` → single count "N×". Element/preset/instance split deferred.
- Aliased by: if `aliasResolver.findReverseRefs()` exists, show reverse alias list. Else omit (document follow-up).
- Lint: pass/fail status from `lintState.getIssues(tokenId)`. Pass green checkmark + ratio. Fail amber + description + [Auto-fix] [Ignore] buttons.
- Action buttons: `[Replace value]` `[Rename ID]` `[Delete]`.
- Beginner-block notice: `dsMode?.mode !== "pro"` → disable Delete button + inline notice "Delete blocked in Beginner mode. Pro shows replace-with / cascade-clear when N elements bind."

**TokensSection changes**: wrap accordion in TokensRouter. Pass row-click handler through ColorTokenList → ColorTokenRow.

**Tests**:
- `__tests__/sections/TokenDetailView.test.tsx` — render with mock composer, assert all field rows present, Replace/Rename/Delete buttons.
- `__tests__/sections/TokensRouter.test.tsx` — assert drill-in state machine, back arrow returns to list.
- `__tests__/sections/TokenDetailView.beginner-block.test.tsx` — assert Delete disabled in Beginner.

### T9 — TokenRow SSOT + Type/Spacing row parity

**New file**: `editor/design-system/ui/sections/TokenRow.tsx` (~120 LOC)
- Generic row template: `<div role="button" data-token-row>`.
- Props: `token`, `previewSlot` (16×16 swatch / Aa preview / spacing ruler), `usageChip`, `lintState`, `isPro`, `alias`, `onClick`.
- Render structure: `[previewSlot] [name + id + alias] [usageChip + lintTag]`.

**Adopt in**:
- `ColorTokenList`: previewSlot = 16×16 swatch with bg = token.value.
- `TypeTokenList`: replace FontFamilyRow/TypeScaleRow with TokenRow. previewSlot = `Aa` in token's font family / size.
- `SpacingTokenList`: replace ValueChip with TokenRow. previewSlot = horizontal bar with width = token.value (capped at 80px).
- `GenericTokenList`: replace inline row template with TokenRow.

**Tests**: new `__tests__/sections/TokenRow.test.tsx` — generic row contract:
- Renders previewSlot.
- Renders name + id (when isPro).
- Renders usage chip.
- Click emits onClick.

### T10 — Panel chrome dark invert

**Change**: `editor/design-system/ui/DesignSystemTab.tsx` outermost wrapper
- Add `data-ds-preview={resolvedMode}` attribute (`light` | `dark`).
- `resolvedMode` from `composer.colorMode.resolved()` + subscribe to `colorMode:changed`.

**New CSS file**: `themes/design-system/ds-panel-dark.css`
- `[data-ds-preview="dark"]` overrides:
  - `--bd-bg-panel`: `#0F172A`
  - `--bd-bg-subtle`: `#1E293B`
  - `--bd-fg-primary`: `#F8FAFC`
  - `--bd-fg-muted`: `#94A3B8`
  - `--bd-fg-secondary`: `#CBD5E1`
  - `--bd-border`: `#1E293B`
  - Row hover bg: `#1E293B`
  - Lint row bg: `rgba(245, 158, 11, 0.15)` (darker amber)
- Import line added to `themes/default.css`.

**Tests**: new `__tests__/DesignSystemTab.dark-preview.test.tsx`
- Render with `colorMode.resolved() === "light"` → expect `data-ds-preview="light"` on wrapper.
- Subscribe to mock `colorMode:changed`, flip to dark → expect `data-ds-preview="dark"`.

---

## 4. Engine API audit

| API | Used by | Status |
|---|---|---|
| `composer.colorMode.get()` / `set()` / `resolved()` | T1, T10 | Shipped (B.0) |
| `composer.colorMode "colorMode:changed"` event | T1, T6, T10 | Shipped |
| `composer.aliasResolver.resolveChain(tokenId)` | T5 | Shipped — probe shape during impl |
| `composer.aliasResolver.findReverseRefs(tokenId)` | T8 (Aliased by field) | UNKNOWN — probe; omit field if absent |
| `composer.designSystem.tokenUsage.usedBy(tokenId)` | T8 (Used by count) | Probe — may need new method on TokenUsageTracker if today only exposes counts via "tokenUsage:changed" snapshot map |
| `composer.designSystem.lintState.getIssues(tokenId)` | T7, T8 | Shipped (prior arc T10) |
| `composer.designSystem.computeAutoFix(value, hint)` | T8 (Auto-fix button) | Shipped (prior arc T10) |

**Probes scheduled in T5 + T8 implementer subtasks**.

---

## 5. Test plan

### New tests (count: 8)
- `ColorTokenList.row-shape.regression.test.tsx`
- `ColorTokenList.pro-mode.test.tsx`
- `ColorTokenList.lint-state.test.tsx`
- `sections/TokenRow.test.tsx`
- `sections/TokenDetailView.test.tsx`
- `sections/TokenDetailView.beginner-block.test.tsx`
- `sections/TokensRouter.test.tsx`
- `DesignSystemTab.dark-preview.test.tsx`

### Rewrites (count: 3)
- `ColorModeToggle.test.tsx` — seg pills instead of cycle button
- `ColorTokenList.test.tsx` — row shape instead of grid shape (~10 cases)
- `colors/DarkMissingChip.test.tsx` — aggregate header chip instead of per-swatch

### Deletes (count: 1)
- `sections/TokenLintRow.test.tsx`

### Existing tests preserved
- All TokensSection.*.test.tsx — accordion mechanics unchanged.
- All TypeTokenList/SpacingTokenList/GenericTokenList tests — preserve token kind coverage but assert new TokenRow contract.

**Target**: ~166 test files / ~1010 passing at arc close (up from 156/982 post-parity-arc).

---

## 6. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Visual regression in non-Design tabs | LOW | Dark CSS scoped to `[data-ds-preview]` attribute, not `<html>`. |
| Test churn in ColorTokenList suite | HIGH | Plan enumerates each test; subagent migrates in T4. |
| Row-shape revert in future PR (v13 swing) | MED | Regression test in T4 locks `display: flex column` shape. |
| `aliasResolver.findReverseRefs` absent | MED | Spec says: omit "Aliased by" field if API missing. Document follow-up. |
| `tokenUsage.usedBy` doesn't expose count per token | MED | Probe during T8. If absent → use `tokenUsage.getCount(tokenId)` or compute from event-bound snapshot. |
| CSS specificity battle on dark preview | MED | Cascade order: `@layer tokens, components, overrides;` — dark CSS lands in overrides layer. |
| Beginner-mode Delete-block accessibility | LOW | Use `aria-disabled` + visible notice, not just disabled prop. |

---

## 7. Ordering + dependencies

```
T1 (parallel)  ─┐
T3 (parallel)  ─┼─→ baseline header polish
T10 (last)     ─┘   (chrome dark scoped + non-blocking)

T9 TokenRow SSOT ─→ T4 ColorTokenList rewrite (consumes TokenRow)
                  ─→ T5 Pro branch (consumes TokenRow.isPro)
                  ─→ T6 dark-missing chip (renders before group rows)
                  ─→ T7 lint inline (uses TokenRow.lintState)
                  ─→ T8 detail (consumes onRowClick from TokenRow)
```

**Wave structure**:
- **Wave 1** (parallel, isolated): T1, T3
- **Wave 2** (sequential): T9 → T4 → T5 → T6 → T7
- **Wave 3** (single): T8
- **Wave 4** (visual only): T10
- **Close-out**: visual verify + memory log + spec status flip

---

## 8. Done definition

1. Live screenshot of Design tab matches prototype s01 (Beginner landing) row-list shape.
2. Live screenshot in Pro mode matches s02/s10 — token IDs + alias arrows visible.
3. Click any row → drill-in detail view matching s02 right-pane fields.
4. Click `[Dark]` pill → entire DS panel chrome inverts (s15).
5. Aggregate "N tokens missing dark variant" chip visible at top of color section in dark mode.
6. Accordion headers show `COLOR · 12 TOKENS [-]` mono format.
7. Lint state highlights offending row yellow inline (no separate span row).
8. Regression test locks row shape — future PRs cannot revert to grid without test failure.
9. All new + rewritten tests pass.
10. No new TS errors in DS scope. Pre-existing TS errors in trpc/Canvas/BuildrikSyncProvider remain (out of arc scope).

---

## 9. Out of scope (follow-ups)

- "Used by N elements · M presets · K instances" detailed breakdown.
- Manual "Browse starters" re-open button.
- `openTokenEditor` engine API (replaces aggregate-chip-click console.warn stub).
- History-aware Auto-fix (wraps `computeAutoFix` in transactional `history.push()`).
- Inspector binding chip uses TokenRow shape (Phase D.1 surface; separate arc).
- Token-detail field for canvas-class binding visibility (preset chain visualizer).

---

## 10. Memory linkage

This arc invokes saved memories:
- `feedback_drill_in_drawer_preference` — D3 decision
- `feedback_orphan_classes_pattern` — avoid className without matching CSS
- `feedback_audit_by_file_presence_unreliable` — close-out MUST do live visual verify, not file existence check
- `feedback_check_git_log_before_assuming_uncleaned` — verify TokenLintRow + per-swatch chip not referenced elsewhere before delete

On close-out, write new memory `project_ds_full_rewrite_arc_shipped_<DATE>.md` with shipped commit range + lessons.
