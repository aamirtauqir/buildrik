# Audit: packages/editor/src/features/
**Date:** 2026-04-29
**Module:** features/
**Files audited:** 29

---

## Performance (P)

### [P1] P — DesignSystemTab.tsx:113-121
**Description:** `typeDirtyCount` and `spacingDirtyCount` perform O(n²) scans (`filter` + `find` per token) on every render without memoization.
**Rule violated:** Feature flags evaluated repeatedly without memoization (generalized: repeated heavy conditional scans).
**Impact:** Every token keystroke re-renders `DesignSystemTab` and re-scans entire token arrays. Measurable overhead for large projects.
**Suggested fix:** Wrap `typeDirtyCount`, `spacingDirtyCount`, and `totalDirty` in `useMemo`.

### [P2] P — useTokenBase.ts:45-48
**Description:** `isDirty` is derived inline each render using `.some()` + `.find()` without memoization.
**Rule violated:** Unmemoized flag lookups (generalized: unmemoized derived state).
**Impact:** Every keystroke in spacing or type tokens triggers an O(n²) dirty scan even though the result only changes when `tokens` or `savedTokens` change.
**Suggested fix:** Replace with `useMemo(() => tokens.some(...), [tokens, savedTokens])`.

### [P2] P — useColorTokens.ts:68-80
**Description:** `pendingDiff` and `isDirty` are rebuilt from scratch on every render via inline array iteration.
**Rule violated:** Feature flags evaluated repeatedly without memoization.
**Impact:** Every render reconstructs the diff object and re-runs the length check even when state is unchanged.
**Suggested fix:** Wrap `pendingDiff` and `isDirty` in `useMemo`.

### [P2] P — ColorTokenRow.tsx:134
**Description:** `calcWcagLevel(token.value, "#0A0A0A")` is invoked on every render for every visible row.
**Rule violated:** Feature flags evaluated repeatedly without memoization.
**Impact:** WCAG contrast calculations run on every parent re-render even when `token.value` hasn't changed.
**Suggested fix:** Memoize `wcagLevel` with `useMemo(() => calcWcagLevel(token.value, BG), [token.value])`.

---

## Duplication (D)

### [D1] D — DesignSystemTab.tsx:113-121 + ReviewModal.tsx:54-61 + handleDiscard()
**Description:** The dirty-check pattern (`find saved token by id, compare values`) is copy-pasted in 5+ locations across the tab and modals.
**Rule violated:** Same feature gate logic copy-pasted.
**Impact:** Any change to dirty semantics requires editing multiple files; risk of drift between tab dirty chips, review modal, and discard undo capture.
**Suggested fix:** Export a single `isTokenDirty(token, savedTokens)` helper from `types.ts` or a shared utils file.

### [D1] D — useColorTokens.ts vs useTokenBase.ts
**Description:** `useColorTokens` reimplements the full undo/redo stack lifecycle that `useTokenBase` already provides for spacing and type tokens.
**Rule violated:** Duplicate flag definitions or checks (generalized: duplicate state management logic).
**Impact:** Two sources of truth for token undo/redo behavior. Fixes in one (e.g., batching, history limits) won't propagate to colors.
**Suggested fix:** Refactor `useColorTokens` to compose `useTokenBase` and layer color-specific features (diff map, filtering) on top.

### [D2] D — ColorTokenList.tsx:92-97 vs useColorTokens.ts:227-238
**Description:** Token search/filter logic (`name.toLowerCase().includes(...)`) is duplicated between the list UI and the hook's `filterTokens` method.
**Rule violated:** Same feature gate logic copy-pasted.
**Impact:** Divergent search behavior if one is updated and the other isn't.
**Suggested fix:** Use `filterTokens` from the registry in `ColorTokenList` instead of reimplementing it.

### [D2] D — ReviewModal.tsx + TabGuardModal.tsx + AddTokenModal.tsx
**Description:** Inline modal button style objects (primary/cancel/destroy) are redefined in each modal file with near-identical properties.
**Rule violated:** Repeated conditional rendering patterns (generalized: repeated inline style definitions).
**Impact:** Inconsistent UI if design tokens change; harder to maintain.
**Suggested fix:** Extract a shared `ModalButton` primitive to `shared/ui/` or at least a local `ModalButton` component.

---

## Business Logic (BL)

### [BL-P0] BL — useTokenBase.ts:45-48
**Description:** `isDirty` does not account for added tokens because it only checks `find` matches and omits a length comparison.
**Rule violated:** Missing fallback behavior when flag is undefined (generalized: missing fallback for unmatched tokens).
**Impact:** Adding a new spacing or type token does not mark the registry dirty, so the user can't save it. `useColorTokens.ts:80` correctly includes `|| tokens.length !== savedTokens.length`, but `useTokenBase` does not.
**Suggested fix:** Add `|| tokens.length !== savedTokens.length` to `useTokenBase.isDirty`, matching `useColorTokens`.

### [BL-P0] BL — useColorTokens.ts:68-79
**Description:** `pendingDiff` assumes `tokens` and `savedTokens` arrays are index-aligned. After `addToken`, `savedTokens[i]` is undefined for the new index, so the diff silently omits the new token.
**Rule violated:** State inconsistency.
**Impact:** Newly added color tokens don't appear as changed (no orange border) even though `isDirty` is true, causing UI inconsistency.
**Suggested fix:** Derive diff by token ID (`savedTokens.find(s => s.id === token.id)`) instead of array index, matching `useTokenBase`.

### [BL-P1] BL — TokenRegistryContext.tsx:68-103
**Description:** `initialTokens` is passed to `useColorTokens` / `useSpacingTokens` / `useTypeTokens` via `useState`, so changing `projectId` (and thus `storageKey`) never resets hook state.
**Rule violated:** Flags cached incorrectly (stale values).
**Impact:** Switching projects in the same session keeps the previous project's tokens in memory. The user sees wrong tokens until page refresh.
**Suggested fix:** Add a `key={projectId}` to `TokenRegistryProvider` or expose a `reset` action that the shell calls on project change.

### [BL-P1] BL — DesignSystemTab.tsx:152-163
**Description:** `handleApply` performs a read-modify-write on `composer.getProjectSettings()` without optimistic locking or revision checks.
**Rule violated:** Client-only flag logic that should be server-validated (generalized: client-side read-modify-write without concurrency guard).
**Impact:** If another tab/window changes project settings between get and set, those changes are overwritten. Multi-tab usage is explicitly supported (see `handleSettingsChange`), making this a real race.
**Suggested fix:** Pass only the `designTokens` delta to a composer merge method, or include a settings revision/timestamp and retry on conflict.

### [BL-P1] BL — DesignSystemTab.tsx:152-163
**Description:** `handleApply` filters `allTokens` to `SAVEABLE_CATEGORIES` (colors/typography/spacing), dropping effects/layout/icons/buttons/forms tokens permanently on save.
**Rule violated:** Missing fallback behavior when flag is undefined (generalized: missing fallback for unsupported categories).
**Impact:** Projects that rely on non-saveable default tokens (e.g., radius, shadows) lose them after the first apply. Data loss on round-trip.
**Suggested fix:** Preserve existing `designTokens` entries for unsupported categories during the merge, or add a comment warning if this is intentional.

### [BL-P1] BL — useTokenUsageMap.ts:73
**Description:** Token ID is derived from CSS var name with `cssVar.replace(/^--buildrick-design-/, "")`, assuming `id` and CSS var suffix are always identical.
**Rule violated:** State inconsistency (implicit coupling).
**Impact:** If a token's `cssVar` ever diverges from its `id` (e.g., custom token, future rename), the usage map will key under the wrong ID and break token→element lookups.
**Suggested fix:** Use the token's actual `id` field from the token registry instead of deriving it from the CSS var string.

### [BL-P2] BL — ColorTokenRow.tsx:148
**Description:** WCAG badge skip logic uses hardcoded substring checks on `token.id` (`includes("background")`, `includes("border")`).
**Rule violated:** Missing fallback behavior when flag is undefined (generalized: brittle heuristics).
**Impact:** A user-added token named "card-background" or "form-border" is incorrectly skipped. Logic should use `token.group` or `token.type`, not ID substrings.
**Suggested fix:** Replace substring checks with `token.group` or a dedicated `skipWcag` boolean field.
