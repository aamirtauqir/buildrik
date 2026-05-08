# DS Arc · Phase B.2 — Live-Edit Dark Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the brief "light-then-dark" flash that happens when a user edits a color token in dark mode. Move all `applyToRoot` calls OUT of `useColorTokens` and centralize CSS-var application in `TokenRegistryProvider`'s already-existing dark-mode-aware effect.

**Architecture:**
- `useColorTokens` becomes a pure state hook (no DOM side effects). All 7 `applyToRoot(cssVar, value)` call sites — the helper + 6 callers (updateToken, undoToken, redoToken, discardAll, resetFromSaved, addToken) — get removed.
- `TokenRegistryProvider`'s existing useEffect (B.1) already runs on every `colorState.tokens` change. Phase B.2 just makes it ALWAYS apply (composer-resolved when present, raw `token.value` when no composer) so the no-composer legacy path keeps working after the inner applyToRoot calls disappear.
- Net behavior: in dark mode, edits go straight to `darkResolver.resolve(token, "dark")` — no light-value flash. In light mode or no-composer mode, edits go to `token.value` directly. Single render, single setProperty.

**Tech Stack:** TypeScript 5.3 (strict) · Vitest · React 18.3 · @testing-library/react

---

## File Structure

| Path | Responsibility | Status |
|---|---|---|
| `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx` | Effect always-applies (composer-resolved or raw) | MODIFY |
| `packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx` | Add "no composer + light" coverage | MODIFY |
| `packages/editor/src/editor/design-system/state/useColorTokens.ts` | Delete applyToRoot helper + 6 call sites | MODIFY |

---

## Pre-flight

- [ ] **Step P.1: Confirm B.1 tag exists**

Run: `git tag -l 'ds-phase-b1-complete'`
Expected: `ds-phase-b1-complete` printed.

- [ ] **Step P.2: Confirm useColorTokens tests don't assert DOM side effects** (so removing applyToRoot won't fail them)

Run: `grep -nE "applyToRoot|setProperty|documentElement" packages/editor/src/editor/design-system/state/__tests__/useColorTokens.test.ts | head`
Expected: empty output.

---

## Task 1: TokenRegistryProvider effect — always apply (composer-resolved or raw)

**Files:**
- Modify: `packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx`
- Modify: `packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`

- [ ] **Step 1.1: Update the existing test for the new no-composer behavior**

The B.1 test "when composer prop is omitted: no-op" must flip: in B.2, no-composer means the effect STILL applies (raw value, no dark resolution). Replace that test case body in `TokenRegistryContext.darkMode.test.tsx`:

```typescript
  it("when composer prop is omitted: still applies raw token.value (legacy fallback)", () => {
    localStorage.setItem(
      "buildrick-design-tokens-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        tokens: [
          {
            id: "color-primary", name: "Primary", value: "#fff",
            category: "colors", cssVar: "--bd-color-primary", type: "color",
            darkValue: "#000",
          },
        ],
      })
    );

    render(
      <TokenRegistryProvider projectId="test">
        <div />
      </TokenRegistryProvider>
    );
    // No composer = no dark resolution = raw token.value applied.
    expect(setPropertySpy).toHaveBeenCalledWith("--bd-color-primary", "#fff");
    expect(setPropertySpy).not.toHaveBeenCalledWith("--bd-color-primary", "#000");
  });
```

- [ ] **Step 1.2: Run test, expect FAIL on this case (effect short-circuits when composer absent)**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`
Expected: FAIL on the new "still applies raw" case.

- [ ] **Step 1.3: Update the effect to always apply**

Modify the useEffect in `TokenRegistryContext.tsx` (added in B.1):

```typescript
  React.useEffect(() => {
    const apply = () => {
      const resolved = composer?.colorMode.resolved() ?? "light";
      colorState.tokens.forEach((t) => {
        const value = composer
          ? composer.darkResolver.resolve(t, resolved)
          : t.value;
        document.documentElement.style.setProperty(t.cssVar, value);
      });
    };

    apply();

    if (!composer) return;
    const handler = () => apply();
    composer.on("colorMode:changed", handler);
    return () => composer.off("colorMode:changed", handler);
  }, [composer, colorState.tokens]);
```

- [ ] **Step 1.4: Run tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`
Expected: PASS · 4 tests.

- [ ] **Step 1.5: Commit**

```bash
git add packages/editor/src/editor/design-system/state/TokenRegistryContext.tsx \
  packages/editor/src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx
git commit -m "feat(ds-phase-b2): TokenRegistryProvider effect always applies (raw or dark-resolved)"
```

---

## Task 2: Remove applyToRoot from useColorTokens

**Files:**
- Modify: `packages/editor/src/editor/design-system/state/useColorTokens.ts`

- [ ] **Step 2.1: Delete the helper + all 6 call sites**

Modify `useColorTokens.ts`:

Delete the helper block (lines ~47-51):

```typescript
// ─── Side effect: apply a CSS var to :root ───────────────────────────────────

function applyToRoot(cssVar: string, value: string) {
  document.documentElement.style.setProperty(cssVar, value);
}
```

Remove every `applyToRoot(...)` call inside the hook body. The 6 sites are:

- Inside `updateToken` (after building the next array)
- Inside `undoToken` (after applying entry.snapshot)
- Inside `redoToken` (after applying entry.snapshot)
- Inside `discardAll` (inside the map's branch where token.value !== saved.value)
- Inside `resetFromSaved` (the `colorOnly2.forEach` line)
- Inside `addToken` (after pushing the new token)

After the surgery, every state mutation just returns the next array. The TokenRegistryProvider effect re-applies on the resulting `colorState.tokens` change.

- [ ] **Step 2.2: Run useColorTokens tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/useColorTokens.test.ts`
Expected: PASS — useColorTokens tests are pure state, no DOM assertions.

- [ ] **Step 2.3: Run TokenRegistryContext.darkMode tests, expect PASS**

Run: `cd packages/editor && pnpm vitest run src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx`
Expected: PASS · 4 tests — the centralized effect now owns all CSS-var application.

- [ ] **Step 2.4: Commit**

```bash
git add packages/editor/src/editor/design-system/state/useColorTokens.ts
git commit -m "refactor(ds-phase-b2): remove applyToRoot from useColorTokens — provider effect owns it"
```

---

## Task 3: Closure baseline + tag

- [ ] **Step 3.1: Run B.0 + B.1 + B.2 path-scoped tests**

Run: `cd packages/editor && pnpm vitest run src/engine/darkResolver src/engine/colorMode src/engine/__tests__/Composer.darkResolver.test.ts src/editor/design-system/state/__tests__/TokenRegistryContext.darkMode.test.tsx src/editor/design-system/state/__tests__/useColorTokens.test.ts --reporter=dot 2>&1 | tail -5`
Expected: all pass.

- [ ] **Step 3.2: Tag**

```bash
git tag ds-phase-b2-complete
git tag --list 'ds-phase-*'
```

---

## Closure Checklist

- [ ] All 3 tasks complete with passing tests
- [ ] No applyToRoot calls remain in useColorTokens
- [ ] TokenRegistryProvider effect applies in all paths (with/without composer)
- [ ] Tag `ds-phase-b2-complete` exists locally
- [ ] CLAUDE.md memory entry written

## Out-of-Scope (still deferred)

- Inspector warn chip on `tokens:dark-missing` — UI sub-phase.
- Migration to seed `darkValue` for shipped color tokens — defer.
- CI gate `gate:ds-dark` — defer.
- Real browser smoke (toggle dark mode visually) — needs a Design tab UI control to flip mode.
