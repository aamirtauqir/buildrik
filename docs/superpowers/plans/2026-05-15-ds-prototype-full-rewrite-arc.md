# DS prototype full rewrite arc — Implementation Plan

- **Date**: 2026-05-15
- **Author**: Claude Opus 4.7
- **Spec**: `docs/superpowers/specs/2026-05-15-ds-prototype-full-rewrite-arc-design.md`
- **Status**: APPROVED — executing via subagent-driven dev
- **Predecessor**: parity arc (`2026-05-15-ds-prototype-parity-arc.md` shipped)

This plan is for subagent implementer dispatch. Each task is self-contained with: files, exact diffs, test files, risks, success criteria.

---

## Execution mode

**Subagent-driven** per memory `project_ds_prototype_parity_arc_shipped_20260515`:
1. Implementer subagent (general-purpose): writes code + tests.
2. Spec-compliance reviewer (compound-engineering:review:ce-correctness-reviewer): verifies against this plan.
3. Code-quality reviewer (compound-engineering:review:ce-maintainability-reviewer): verifies clean implementation.

**Per task**: dispatch implementer → run tests → spec review → code review → fix loop → commit. Solo workflow → direct main, no PRs.

---

## Wave 1 — Quick wins (parallel-safe)

### T1 — ColorModeToggle 2-pill seg

**Files**
- MODIFY: `src/editor/design-system/ui/ColorModeToggle.tsx` (128 → ~70 LOC)
- REWRITE: `src/editor/design-system/ui/__tests__/ColorModeToggle.test.tsx`

**Diff outline**

```tsx
// ColorModeToggle.tsx — full rewrite
import * as React from "react";
import type { Composer } from "../../../engine";
import type { ThemeMode } from "../types";

export interface ColorModeToggleProps {
  composer: Composer;
}

export const ColorModeToggle: React.FC<ColorModeToggleProps> = ({ composer }) => {
  const [mode, setMode] = React.useState<ThemeMode>(() => composer.colorMode.get());

  React.useEffect(() => {
    const sync = () => setMode(composer.colorMode.get());
    composer.on("colorMode:changed", sync);
    return () => composer.off("colorMode:changed", sync);
  }, [composer]);

  const resolved = composer.colorMode.resolved?.() ?? mode;
  const active = resolved === "dark" ? "dark" : "light";

  const Pill: React.FC<{ value: "light" | "dark"; label: string }> = ({ value, label }) => {
    const isActive = active === value;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => composer.colorMode.set(value)}
        style={{
          padding: "3px 12px",
          fontSize: 11,
          fontWeight: 600,
          border: "none",
          borderRadius: 9999,
          cursor: "pointer",
          background: isActive ? "var(--bd-accent)" : "transparent",
          color: isActive ? "#fff" : "var(--bd-fg-muted)",
          transition: "background 80ms",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="tablist"
      aria-label="Color mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 2,
        borderRadius: 9999,
        border: "1px solid var(--bd-border)",
        background: "var(--bd-bg-subtle)",
      }}
    >
      <Pill value="light" label="Light" />
      <Pill value="dark" label="Dark" />
    </div>
  );
};
```

**Test cases**
- Renders 2 buttons with `role="tab"`.
- Initial render: pill matching `composer.colorMode.resolved()` has `aria-selected="true"`.
- Click `[Light]` → `composer.colorMode.set("light")` called.
- Click `[Dark]` → `composer.colorMode.set("dark")` called.
- After `colorMode:changed` emit, active pill swaps.
- `role="tablist"` on container.

**Risks**: `renderTrigger` prop used by external mount? Probe: `grep -rn "renderTrigger" src/`. If used → keep prop optional. If not → delete.

**Success**: tests pass + visual seg matches s01.

---

### T3 — Accordion header `COLOR · 12 TOKENS [-]`

**Files**
- MODIFY: `src/editor/design-system/ui/sections/TokensSection.tsx` accordion header rendering area
- EXTEND: `src/editor/design-system/ui/sections/__tests__/TokensSection.test.tsx` (or create if absent)

**Current state probe**
- Find header rendering — search for `ChevronDown` import in TokensSection.
- Header likely structured: `<div className="accordion-trigger">{label}{count}{ChevronDown}</div>`.

**Target shape**

```tsx
const SectionHeader: React.FC<{
  label: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
}> = ({ label, count, expanded, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={expanded}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "10px 12px",
      background: "transparent",
      border: "none",
      borderTop: "1px solid var(--bd-border)",
      cursor: "pointer",
      fontFamily: "var(--buildrick-font-family-mono, ui-monospace, monospace)",
      fontSize: 10.5,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--bd-fg-muted)",
    }}
  >
    <span>{label} · {count} TOKENS</span>
    <span style={{ flex: 1 }} />
    <span aria-hidden="true">[{expanded ? "−" : "+"}]</span>
  </button>
);
```

**Test cases**
- Section with 12 tokens collapsed → header has `· 12 TOKENS [+]`.
- Section expanded → header has `[-]`.
- Click toggles `aria-expanded`.
- All 14 sections render header with mono font + uppercase.

**Risks**: existing tests may assert on lucide ChevronDown — migrate to text glyph assertion.

---

## Wave 2 — Layout core (sequential)

### T9 — TokenRow SSOT (runs FIRST in wave 2 since T4/T5/T6/T7 consume it)

**Files**
- NEW: `src/editor/design-system/ui/sections/TokenRow.tsx` (~120 LOC)
- NEW: `src/editor/design-system/ui/sections/__tests__/TokenRow.test.tsx`

**TokenRow signature**

```tsx
export interface TokenRowProps {
  token: DesignToken;
  /** Left preview slot: swatch / Aa / spacing bar. */
  previewSlot: React.ReactNode;
  /** Pro mode reveals ID + alias arrow. */
  isPro?: boolean;
  /** Alias target (next-hop) when token aliases another. */
  aliasTarget?: string | null;
  /** Usage count from tokenUsage tracker. */
  usageCount?: number;
  /** Lint issues — when non-empty, row gets warn state. */
  lintIssues?: readonly LintIssue[];
  /** Row click → drill-in detail. */
  onClick?: () => void;
  /** Optional bespoke right-side content (overrides default chip+lint render). */
  rightSlot?: React.ReactNode;
}
```

**Render structure**

```tsx
<div
  role="button"
  data-token-row={token.id}
  data-lint-warn={hasLint ? "true" : undefined}
  tabIndex={0}
  onClick={onClick}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
  style={{
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: hasLint ? "8px 12px 8px 9px" : "8px 12px",
    background: hasLint ? "rgba(245, 158, 11, 0.08)" : "transparent",
    borderLeft: hasLint ? "3px solid var(--buildrick-warning-strong)" : "none",
    cursor: "pointer",
    borderRadius: 4,
    transition: "background 60ms",
  }}
  onMouseEnter={(e) => {
    if (!hasLint) e.currentTarget.style.background = "var(--bd-bg-subtle)";
  }}
  onMouseLeave={(e) => {
    if (!hasLint) e.currentTarget.style.background = "transparent";
  }}
>
  <span style={{ flexShrink: 0, marginTop: 1 }}>{previewSlot}</span>
  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--bd-fg-primary)" }}>
      {token.name}
    </span>
    {isPro && (
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--buildrick-font-family-mono)", color: "var(--bd-fg-muted)" }}>
        <span>{token.id}</span>
        {aliasTarget && <span style={{ color: "var(--bd-accent)" }}>→ {aliasTarget}</span>}
      </span>
    )}
    {hasLint && (
      <span style={{ fontSize: 11, fontStyle: "italic", color: "var(--buildrick-warning-strong)" }}>
        △ {lintIssues![0].description}
      </span>
    )}
  </div>
  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
    {rightSlot ?? (
      <>
        {usageCount !== undefined && <TokenUsageChip count={usageCount} />}
        {hasLint && <span className="lint-tag">lint</span>}
      </>
    )}
  </div>
</div>
```

**Test cases**
- Renders preview slot.
- isPro=true + token.id → ID visible.
- isPro=false → ID NOT visible.
- aliasTarget set → alias arrow chip visible.
- lintIssues non-empty → row has `data-lint-warn="true"`, amber bg, inline description, `[lint]` tag.
- Click → onClick called.
- Enter key → onClick called (a11y).

---

### T4 — ColorTokenList grid → row list

**Files**
- REWRITE: `src/editor/design-system/ui/colors/ColorTokenList.tsx` (767 → ~400 LOC)
- NEW: `src/editor/design-system/ui/colors/__tests__/ColorTokenList.row-shape.regression.test.tsx`
- REWRITE: existing ColorTokenList tests

**Render structure**

```tsx
return (
  <div data-color-token-list>
    {/* Search + filter (preserved) */}
    <SearchAndFilter ... />
    {/* T6: aggregate dark-missing header chip */}
    {resolvedMode === "dark" && missingDarkCount > 0 && <DarkMissingHeaderChip count={missingDarkCount} onClick={...} />}
    {/* WCAG banner (preserved) */}
    {filterMode === "issues" && <IssuesBanner ... />}
    {/* Groups → row stacks */}
    {groups.map((group) => (
      <div key={group.key} data-group={group.key}>
        <GroupHeader label={group.label} subtext={group.subtext} mini={group.mini} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {group.tokens.map((token) => (
            <TokenRow
              key={token.id}
              token={token}
              previewSlot={<ColorSwatch value={pendingDiff[token.id]?.value ?? token.value} />}
              isPro={isPro}
              aliasTarget={aliasTargetFor(token, composer)}
              usageCount={usageByTokenId?.get(token.id)}
              lintIssues={getLintIssues?.(token.id)}
              onClick={() => onRowClick?.(token.id)}
            />
          ))}
        </div>
      </div>
    ))}
    <AddTokenButton onClick={onAddToken} />
  </div>
);
```

**Deleted code**
- `SwatchGrid` component
- `compactLabel()` helper
- `PickerDrawer` component (moved to T8)
- `expandedId` / `expandedToken` state (drill-in handles this now)
- per-row `isDarkMode` + `onDarkMissingClick` prop chain (T6 makes it aggregate)
- `TokenLintRow` import (T7 deletes file)

**New props**
- `onRowClick: (tokenId: string) => void` (drill-in dispatch)
- `isPro: boolean` (T5)

**Regression test**

```tsx
// ColorTokenList.row-shape.regression.test.tsx
test("colors render as vertical row stack, not grid", () => {
  const { container } = render(<ColorTokenList {...minimalProps} />);
  const groupContainers = container.querySelectorAll("[data-group]");
  groupContainers.forEach((group) => {
    const rowContainer = group.querySelector("div[style*='flex-direction: column']");
    expect(rowContainer).toBeTruthy();
    // Anti-pattern check: no grid-template-columns in any descendant
    const gridSelectors = group.querySelectorAll("[style*='grid-template-columns']");
    expect(gridSelectors.length).toBe(0);
  });
  // Every token rendered as TokenRow (data-token-row marker)
  const rows = container.querySelectorAll("[data-token-row]");
  expect(rows.length).toBe(minimalProps.tokens.length);
});
```

**Test migration plan**
- Inventory: list all `ColorTokenList.*.test.tsx` files.
- For each test asserting `data-testid="swatch-tile-X"` → migrate to `data-token-row="X"`.
- For each test asserting `.bd-swatch-grid` or `display: grid` → DELETE assertion (or migrate to flex column).
- Color picker tests → defer to T8 (PickerDrawer moves to detail).

**Risks**: 10+ test cases need migration. Implementer subagent gets explicit list before starting.

---

### T5 — Pro mode branch in row

**Files**
- MODIFY: `src/editor/design-system/ui/sections/TokensSection.tsx` (pass `isPro` to ColorTokenList + sibling lists)
- MODIFY: `src/editor/design-system/ui/colors/ColorTokenList.tsx` (consume `isPro`, compute `aliasTarget`)
- NEW: `src/editor/design-system/ui/colors/__tests__/ColorTokenList.pro-mode.test.tsx`

**Implementation**

In TokensSection (around dsMode read):
```tsx
const isPro = dsMode?.mode === "pro";
// pass isPro into each <XxxTokenList isPro={isPro} ... />
```

In ColorTokenList:
```tsx
function aliasTargetFor(token: DesignToken, composer: Composer | null | undefined): string | null {
  if (!composer?.aliasResolver) return null;
  const chain = composer.aliasResolver.resolveChain?.(token.id);
  if (!chain || chain.length < 2) return null;
  return chain[1]?.targetId ?? null;
}
```

**Probe required**: `grep -rn "resolveChain\|aliasResolver" src/engine/`. If API shape different → adapt or no-op alias.

**Test cases**
- isPro=false → no `.id-mono` span in DOM.
- isPro=true + plain token → ID visible, no alias chip.
- isPro=true + aliased token → ID + `→ {target}` chip visible.

---

### T6 — Aggregate dark-missing header chip

**Files**
- MODIFY: `src/editor/design-system/ui/colors/ColorTokenList.tsx` (compute + render)
- REWRITE: `src/editor/design-system/ui/colors/__tests__/DarkMissingChip.test.tsx`

**Compute**
```tsx
const missingDarkCount = React.useMemo(
  () => tokens.filter((t) => t.kind === "color" && !t.darkValue).length,
  [tokens]
);
```

**Render**
```tsx
{resolvedMode === "dark" && missingDarkCount > 0 && (
  <button
    type="button"
    onClick={() => {
      const firstMissing = tokens.find((t) => t.kind === "color" && !t.darkValue);
      if (firstMissing) onRowClick?.(firstMissing.id);
    }}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 10px",
      marginBottom: 12,
      borderRadius: 6,
      border: "1px solid var(--buildrick-warning-strong)",
      background: "var(--buildrick-warning-soft)",
      color: "var(--buildrick-warning-strong)",
      fontSize: 11.5,
      fontWeight: 500,
      cursor: "pointer",
    }}
  >
    <span aria-hidden="true">⚠</span>
    <span>{missingDarkCount} {missingDarkCount === 1 ? "token" : "tokens"} missing dark variant</span>
  </button>
)}
```

**Test cases**
- 3 tokens, no darkValue, mode=dark → "3 tokens missing dark variant" visible.
- 1 token, no darkValue, mode=dark → "1 token missing dark variant" (singular).
- mode=light → chip NOT in DOM.
- all tokens have darkValue → chip NOT in DOM.
- click → onRowClick called with first missing token id.

---

### T7 — Inline lint highlight (delete TokenLintRow)

**Files**
- DELETE: `src/editor/design-system/ui/sections/TokenLintRow.tsx`
- DELETE: `src/editor/design-system/ui/sections/__tests__/TokenLintRow.test.tsx`
- MODIFY: `src/editor/design-system/ui/colors/ColorTokenList.tsx` (drop TokenLintRow mount)
- MODIFY: `src/editor/design-system/ui/tokens/GenericTokenList.tsx` (drop TokenLintRow mount if present)
- NEW: `src/editor/design-system/ui/colors/__tests__/ColorTokenList.lint-state.test.tsx`

**Pre-flight grep**
- `grep -rn "TokenLintRow" src/` — list every consumer. Update each.

**TokenRow already has** lint inline render (per T9 spec) — so removal is pure deletion in ColorTokenList + GenericTokenList. No new render code needed.

**Test cases**
- Render row with lintIssues=[{description: "contrast 2.8:1"}] → row has `data-lint-warn="true"`, amber bg via inline style, inline description "△ contrast 2.8:1", `[lint]` tag right.
- Render row with empty lintIssues → no lint markers.

**Risks**: Auto-fix + Ignore buttons used to live in TokenLintRow. They move to T8 detail view. Drop here entirely — `onLintAutoFix` and `onLintIgnore` props on ColorTokenList → DELETE (passed through to TokenLintRow only).

---

## Wave 3 — Detail surface

### T8 — Token detail drill-in view

**Files**
- NEW: `src/editor/design-system/ui/sections/TokenDetailView.tsx` (~250 LOC)
- NEW: `src/editor/design-system/ui/sections/TokensRouter.tsx` (~80 LOC)
- MODIFY: `src/editor/design-system/ui/sections/TokensSection.tsx` (wrap in TokensRouter)
- MODIFY: `src/editor/design-system/ui/colors/ColorTokenList.tsx` (emit onRowClick instead of inline picker)
- MODIFY: `src/editor/design-system/ui/tokens/GenericTokenList.tsx`, `type/TypeTokenList.tsx`, `spacing/SpacingTokenList.tsx` (emit onRowClick)
- NEW: 3 test files (TokenDetailView, TokensRouter, TokenDetailView.beginner-block)

**TokensRouter shape**

```tsx
export interface TokensRouterProps {
  children: (handlers: { onRowClick: (tokenId: string) => void }) => React.ReactNode;
  composer: Composer;
  tokens: ReadonlyArray<DesignToken>;
}

export const TokensRouter: React.FC<TokensRouterProps> = ({ children, composer, tokens }) => {
  const [view, setView] = React.useState<{ kind: "list" } | { kind: "detail"; tokenId: string }>({ kind: "list" });

  if (view.kind === "detail") {
    const token = tokens.find((t) => t.id === view.tokenId);
    if (!token) {
      setView({ kind: "list" });
      return null;
    }
    return (
      <TokenDetailView
        token={token}
        composer={composer}
        onBack={() => setView({ kind: "list" })}
      />
    );
  }

  return <>{children({ onRowClick: (tokenId) => setView({ kind: "detail", tokenId }) })}</>;
};
```

**TokenDetailView fields**

```tsx
export const TokenDetailView: React.FC<{
  token: DesignToken;
  composer: Composer;
  onBack: () => void;
}> = ({ token, composer, onBack }) => {
  const dsMode = useDSModeOptional();
  const isPro = dsMode?.mode === "pro";

  const usedCount = composer.designSystem.tokenUsage.getCount?.(token.id) ?? 0;
  const lintIssues = composer.designSystem.lintState.getIssues?.(token.id) ?? [];
  const aliasChain = composer.aliasResolver.resolveChain?.(token.id) ?? [];
  const cssVarName = `--ds-${token.kind}-${token.id.replace(/\./g, "-")}`;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ /* back arrow */ }}>← Back to tokens</button>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <TokenPreview token={token} size={24} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{token.name}</div>
          <div style={{ fontSize: 12, fontFamily: "mono", color: "muted" }}>{token.id}</div>
          {isPro && <div style={{ fontSize: 11, fontFamily: "mono", color: "muted" }}>{cssVarName}</div>}
        </div>
      </div>

      <FieldRow label="Light value" value={<LightValueInput token={token} composer={composer} />} />
      <FieldRow label="Dark value" value={<DarkValueInput token={token} composer={composer} />} />
      <FieldRow label="Used by" value={<span>{usedCount} elements</span>} />
      {aliasChain.length > 1 && <FieldRow label="Aliased by" value={<AliasChainDisplay chain={aliasChain} />} />}
      <FieldRow label="Lint" value={<LintStatusDisplay issues={lintIssues} token={token} composer={composer} />} />

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Button>Replace value</Button>
        <Button>Rename ID</Button>
        <Button
          variant="danger"
          aria-disabled={!isPro}
          disabled={!isPro}
          onClick={() => isPro && handleDelete()}
        >Delete</Button>
      </div>

      {!isPro && (
        <div style={{ marginTop: 12, padding: 10, background: "info-soft", borderLeft: "3px solid info-strong" }}>
          <strong>Delete blocked in Beginner mode.</strong> Pro shows replace-with / cascade-clear when {usedCount} elements bind.
        </div>
      )}
    </div>
  );
};
```

**Probes during impl**
- `composer.designSystem.tokenUsage.getCount(tokenId)` — does it exist? If not, use snapshot from `"tokenUsage:changed"` subscription.
- `composer.aliasResolver.resolveChain(tokenId)` — already used in T5.
- `composer.aliasResolver.findReverseRefs(tokenId)` — for "Aliased by". If absent → omit field.
- `composer.designSystem.computeAutoFix(value, hint)` — exists per prior arc T10.

**Wiring through tabs**
- TokensSection wraps content: `<TokensRouter composer={composer} tokens={allTokens}>{({onRowClick}) => <Accordion onRowClick={onRowClick} ... />}</TokensRouter>`.
- Accordion passes onRowClick down through ColorTokenList / TypeTokenList / SpacingTokenList / GenericTokenList.

**Test cases**
- Render with mock composer + color token → all fields render (Light value, Dark value, Used by, Lint, action buttons).
- Beginner mode → Delete `aria-disabled="true"` + notice visible.
- Pro mode → Delete enabled, notice absent.
- Click back arrow → `onBack` called.
- aliasChain.length===1 → "Aliased by" row absent.

**Risks**: largest task. Many engine probes. Implementer may discover API gaps → spec explicitly says: omit field if API missing, document as follow-up.

---

## Wave 4 — Visual chrome

### T10 — Panel chrome dark invert

**Files**
- MODIFY: `src/editor/design-system/ui/DesignSystemTab.tsx` (add `data-ds-preview` attribute)
- NEW: `src/themes/design-system/ds-panel-dark.css`
- MODIFY: `src/themes/default.css` (import new file)
- NEW: `src/editor/design-system/ui/__tests__/DesignSystemTab.dark-preview.test.tsx`

**DesignSystemTab change**

```tsx
const [resolvedMode, setResolvedMode] = React.useState<"light" | "dark">(
  () => composer.colorMode.resolved?.() ?? "light"
);

React.useEffect(() => {
  if (!composer.colorMode) return;
  const sync = () => setResolvedMode(composer.colorMode.resolved?.() ?? "light");
  composer.on("colorMode:changed", sync);
  return () => composer.off("colorMode:changed", sync);
}, [composer]);

return (
  <div data-ds-preview={resolvedMode} style={{ /* ... */ }}>
    {/* existing content */}
  </div>
);
```

**New CSS**

```css
/* themes/design-system/ds-panel-dark.css
   Scoped dark-mode preview chrome for DS panel ONLY. Editor chrome stays light. */
@layer overrides {
  [data-ds-preview="dark"] {
    --bd-bg-panel: #0F172A;
    --bd-bg-subtle: #1E293B;
    --bd-fg-primary: #F8FAFC;
    --bd-fg-muted: #94A3B8;
    --bd-fg-secondary: #CBD5E1;
    --bd-border: #1E293B;
  }
  [data-ds-preview="dark"] [data-token-row]:hover {
    background: #1E293B !important;
  }
  [data-ds-preview="dark"] [data-token-row][data-lint-warn="true"] {
    background: rgba(245, 158, 11, 0.15) !important;
  }
}
```

**Import in default.css**: `@import "./design-system/ds-panel-dark.css";`

**Test cases**
- Initial render with light mode → `data-ds-preview="light"` on wrapper.
- Mock `colorMode.resolved()` returns dark → after `colorMode:changed` emit, wrapper attribute flips to `"dark"`.
- Multiple toggles → attribute stays in sync.

**Risks**:
- CSS specificity. `!important` minimized to row hover/lint overrides only (specificity battle there).
- Need to verify vibcoder primitives in DS panel respect CSS var overrides (most do via `var(--bd-*)`).

---

## Close-out

### Final task — visual verify + memory log + spec flip

**Steps**:
1. Run full test suite: `npx vitest run`. Expect ~166 files / ~1010 passing.
2. Run TypeScript check: `npx tsc --noEmit`. Confirm no new DS-scope errors.
3. Browser visual verify via gstack /browse:
   - Open editor (port 5050).
   - Navigate to Design tab.
   - Screenshot Beginner mode → compare to prototype s01.
   - Click Pro pill → screenshot → compare to s02 (token IDs visible).
   - Click Dark pill → screenshot → compare to s15 (panel inverts, aggregate amber chip).
   - Click row → screenshot drill-in detail → compare to s02 right-pane.
   - Beginner-mode delete attempt → confirm blocked.
4. Write memory file `project_ds_full_rewrite_arc_shipped_2026MMDD.md` capturing:
   - Commits between spec creation and final close.
   - Engine APIs reused (no new APIs).
   - Decisions D1-D10 referenced.
   - Lessons (especially: row-shape regression test pattern; live-verify trumps file-existence audit).
   - Deferred items list.
5. Update MEMORY.md index with pointer.
6. Flip spec status: APPROVED → SHIPPED.

---

## Per-task review prompt template

For each implementer task, dispatch reviewer with:

```
Use template at requesting-code-review/code-reviewer.md

DESCRIPTION: Task <N> — <subject> per docs/superpowers/plans/2026-05-15-ds-prototype-full-rewrite-arc.md
PLAN_OR_REQUIREMENTS: Task <N> section in plan + Task <N> section in spec
BASE_SHA: <commit before task>
HEAD_SHA: <current commit>

Spec compliance specifics:
- <list test cases from plan>
- <list deleted files from plan>
- <list new files from plan>
- Visual regression: <link to prototype screenshot section>
```

---

## Commit strategy

Solo workflow → direct main, no PRs. One commit per task. Commit message format:

```
feat(ds): T<N> <subject> per prototype <section>

<2-3 lines on what changed>

Spec: docs/superpowers/specs/2026-05-15-ds-prototype-full-rewrite-arc-design.md
Plan: docs/superpowers/plans/2026-05-15-ds-prototype-full-rewrite-arc.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Co-author tag per CLAUDE.md.
