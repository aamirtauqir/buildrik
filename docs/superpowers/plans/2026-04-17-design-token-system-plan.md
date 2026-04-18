# Design Token System Unification Plan

## Problem Statement

The editor has three conflicting design token systems that produce inconsistent visuals and maintenance nightmares:

1. **`default.css`** (5170 lines) — Primary CSS custom properties: `--aqb-*`, `--ls-*`, `--aqb-accent-*`
2. **`themes/index.ts`** — JavaScript theme object with 11 tokens, applied via `applyTheme()`
3. **`constants.ts`** (`features/design-system/`) — `DEFAULT_TOKENS` with `--aqb-color-*` prefix

**Core problems:**
- `--aqb-color-primary` (#3B82F6) ≠ `--aqb-primary` (#2d6dff) — same role, different values
- `--aqb-color-*` tokens are never declared in any CSS file — no defaults
- `applyTheme()` sets only 11 of ~100+ tokens — rest rely on static CSS
- 29+ TSX files have hardcoded color values instead of CSS variables
- Topbar plain CSS classes (`.tbWrap`, `.tbIconBtn`) use hardcoded `#F8FAFC`, `#334155`, etc.

---

## Goals

1. **Single source of truth** — One file defines all design tokens
2. **Consistent values** — No conflicting tokens for the same role
3. **Zero hardcoded colors** — Every color from CSS variable
4. **Full token coverage** — Every CSS variable has a default value
5. **applyTheme parity** — JS theme system can override all tokens

---

## Scope

### In Scope

- Audit and document ALL design tokens across all sources
- Identify conflicting/duplicate/missing tokens
- Fix `--aqb-color-*` CSS declarations (add defaults matching `--aqb-*`)
- Migrate hardcoded TSX colors to CSS variables
- Extend `applyTheme()` to cover all tokens
- Ensure `DEFAULT_TOKENS` and `default.css` agree on values

### Out of Scope

- New visual designs or UI changes
- Emotion/styled component migration (no `styled()` API found)
- Light theme support (editor is dark-only)
- Font or typography system changes

---

## Implementation Approach

### Approach: CSS-Only Unification

**Decision:** Keep tokens primarily in CSS (`default.css`) as the authoritative source. JavaScript (`themes/index.ts`) reads from CSS computed style for `applyTheme()`. `DEFAULT_TOKENS` in `constants.ts` becomes a read-only reference that must match CSS values.

**Why:** The CSS is already the runtime source of truth. JS theme object is a thin layer. Design system tab already writes to CSS vars at runtime. No need for a JS-first token system when the whole rendering pipeline is CSS-based.

**Effort:** M | Risk: Low | Completeness: 8/10

---

## Phase 1: Audit & Document (Day 0)

### 1.1 Produce Token Inventory

Create `packages/editor/src/docs/design-system/token-inventory.md` with a structured table format:

```markdown
## CSS Custom Properties — default.css

| Token | Value | Status | Source |
|-------|-------|--------|--------|
| --aqb-primary | #2d6dff | canonical | default.css:46 |
...

## JavaScript Theme — themes/index.ts

| Token | JS Property | Maps to CSS | Status |
|-------|-------------|-------------|--------|
| primary | "#2d6dff" | --aqb-primary | synced |
...

## Design System Tab — constants.ts DEFAULT_TOKENS

| ID | cssVar | Default Value | Agrees with CSS? |
|----|--------|---------------|-----------------|
| color-primary | --aqb-color-primary | #3B82F6 | NO (CSS: #2d6dff) |
...

## Hardcoded Colors — TSX files

Grep pattern: `grep -rn '#[0-9A-Fa-f]\{6\}' --include='*.tsx' | grep -v 'var(' | grep -v 'color-mix'`

| File | Hardcoded Values Found | Replace With |
|------|----------------------|--------------|
| InspectorControls.tsx | #e4e7e7, #6c7086, #cdd6f4 | var(--aqb-border), etc. |
...
```

### 1.2 Identify Conflicts

Map same-role tokens across systems:
- Primary: `--aqb-primary` (#2d6dff, cobalt) vs `--aqb-color-primary` (#3B82F6, Tailwind blue) vs `--ls-accent`
- **RESOLVED:** `--aqb-color-primary` will be aliased to `--aqb-primary` (cobalt). No other primary token allowed.
- Secondary: `--aqb-color-secondary` (#8B5CF6, purple) — **DEPRECATED**, see Decision #1 below
- Success: `--aqb-success` (#22c55e) vs `--aqb-color-success` (#22C55E) — near-identical, align both
- Backgrounds: `--aqb-bg-*` vs `--aqb-surface-*` vs `--ls-bg-*`
- Text: `--aqb-text-*` vs `--aqb-color-text` vs `--ls-text-*`

### 1.3 Audit Hardcoded Colors

Run comprehensive grep for all hardcoded hex/rgba (not just indigo/violet):

```bash
# All hardcoded hex colors in TSX (exclude var() calls)
grep -rn '#[0-9A-Fa-f]\{3,6\}' --include='*.tsx' packages/editor/src \
  | grep -v 'var(' \
  | grep -v 'color-mix' \
  | sort -u

# Specifically check for indigo/violet (design rule violation)
grep -rni '#6366F1\|#4F46E5\|#818CF8\|#8B5CF6\|#7C3AED\|indigo\|violet' \
  --include='*.tsx' --include='*.ts' --include='*.css' \
  packages/editor/src
```

Expected files with hardcoded colors:
- `InspectorControls.tsx` — #e4e7e7, #6c7086, #cdd6f4
- `DevModeToggle.tsx` — rgba cobalt variants
- `FeatureCard.tsx` — #FEF3C7, #92400E (amber palette — will need `--aqb-warning-*` or keep as-is if intentional)
- `SearchBar.tsx` — #FFFFFF, #94A3B8, #0F172A — use `--ls-*` tokens
- `InspectorEmptyState.tsx` — #4ade80, green/blue rgba — use `var(--aqb-success)`, `var(--aqb-primary)`
- Topbar CSS — `.tbWrap`, `.tbBar`, `.tbIconBtn` classes in `default.css` lines ~1553-1891

---

## Phase 2: Fix Token Declarations (Day 1)

### 2.1 Add Missing `--aqb-color-*` CSS Declarations

In `default.css`, add canonical declarations:

```css
/* Design System Tab compatibility layer — all --aqb-color-* aliases resolve to --aqb-* */
:root {
  /* Primary: cobalt ONLY — DESIGN.md violation to use anything else */
  --aqb-color-primary: var(--aqb-primary);           /* #2d6dff */
  --aqb-color-primary-hover: var(--aqb-primary-hover);

  /* Secondary accent: DEPRECATED — cobalt is the only accent */
  /* --aqb-accent (purple #a78bfa) is deprecated. Use --aqb-primary instead. */
  /* --aqb-color-secondary is deprecated. Remove after migration. */

  /* Accent (standalone green — not a cobalt replacement) */
  --aqb-color-accent: #22c55e;  /* Green — used for success states, not accent actions */

  /* Semantic aliases */
  --aqb-color-background: var(--aqb-bg-dark);
  --aqb-color-surface: var(--aqb-bg-panel);
  --aqb-color-text: var(--aqb-text-primary);
  --aqb-color-muted: var(--aqb-text-muted);
  --aqb-color-border: var(--aqb-border);
  --aqb-color-success: var(--aqb-success);  /* Both resolve to #22c55e */
  --aqb-color-error: var(--aqb-error);
}
```

This way, `--aqb-color-*` tokens always resolve to `--aqb-*` tokens when not overridden by design system tab. Purple accent tokens are explicitly deprecated with comments.

### 2.2 Verify `--ls-*` Token Coverage — GATE

**Prerequisite gate for Phase 3.2.** Before migrating TSX colors, `--ls-*` coverage must be complete.

Run this grep and for each unique token found, verify it exists in `default.css`:

```bash
# List all --ls-* token references in TSX/TS files
grep -roh 'var(--ls-[^)]*)' packages/editor/src --include='*.tsx' --include='*.ts' \
  | sed 's/var(\([^)]*\)).*/\1/' \
  | sort -u > /tmp/ls-tokens-used.txt

# For each token, check if it exists in CSS (value is not empty/undefined)
# Any missing token = add to default.css or remove reference from code
```

**Remediation path for missing `--ls-*` tokens:**
1. If token is referenced but missing from CSS → add it to `default.css` with appropriate value
2. If token reference is dead code (not rendered) → remove the reference from code
3. If token name is wrong (should be `--aqb-*`) → refactor to correct token

### 2.3 Update `constants.ts` Defaults

**CRITICAL:** `DEFAULT_TOKENS` values in `constants.ts` must match CSS defaults exactly.

Enforce sync with a comment in `constants.ts`:
```ts
// IMPORTANT: These values MUST match the CSS defaults in default.css.
// Do not change these without updating default.css AND running Phase 5 verification.
// Use grep check: grep -n '#3B82F6\|#8B5CF6' constants.ts  // should return 0 hits
```

Fix the specific conflicts:
- `--aqb-color-primary`: currently `#3B82F6` → change to `#2d6dff` (matches CSS/cobalt)
- `--aqb-color-secondary`: currently `#8B5CF6` (purple) → **REMOVE** (deprecated per Decision #1)

---

## Phase 3: Migrate Hardcoded Colors (Day 2-3)

**Dependency:** Phase 2.2 (`--ls-*` token coverage gate) must be complete before Phase 3.2 can proceed. If `--ls-*` tokens are missing, Phase 3.2 will have nothing to migrate SearchBar.tsx and others TO.

### 3.1 Topbar CSS Classes

Replace hardcoded colors in `default.css` lines ~1553-1891 with CSS variables:

```css
.tbWrap   { background: var(--aqb-bg-panel); }
.tbBar    { background: var(--aqb-bg-dark); }
.tbIconBtn { color: var(--aqb-text-secondary); }
.tbIconBtn:hover { background: var(--aqb-border-light); }
.tbIconBtn.active { color: var(--aqb-primary); }
```

Verify no visual regression on topbar chrome after migration.

### 3.2 TSX Hardcoded Colors

Replace inline hex/rgba values with token variables:

| File | Hardcoded Found | Replace With |
|------|----------------|--------------|
| `InspectorControls.tsx` | `#e4e4e7` (zinc-200) | `var(--aqb-border-light)` |
| `InspectorControls.tsx` | `#6c7086` (zinc-400) | `var(--aqb-text-muted)` |
| `InspectorControls.tsx` | `#cdd6f4` (blue-gray) | `var(--aqb-primary)` with opacity |
| `DevModeToggle.tsx` | `rgba(0,115,230,0.6)` | `var(--aqb-primary)` at 60% opacity via CSS |
| `FeatureCard.tsx` | `#FEF3C7` (amber-100) | **Keep as-is** — this is an intentional semantic color (warning/notification), not a brand color. Move to `--aqb-warning-subtle` if it becomes a recurring pattern. |
| `FeatureCard.tsx` | `#92400E` (amber-800) | Same — semantic warning, keep or map to `--aqb-warning` |
| `SearchBar.tsx` | `#FFFFFF`, `#D1D9E6`, `#94A3B8` | `var(--ls-bg-card)`, `var(--ls-border)`, `var(--ls-text-muted)` — **requires Phase 2.2 gate** |
| `InspectorEmptyState.tsx` | `#4ade80` | `var(--aqb-success)` |
| `InspectorEmptyState.tsx` | green/blue rgba | Use `var(--aqb-success)` / `var(--aqb-primary)` with opacity |

**Note:** For rgba with opacity — use CSS `color-mix(in srgb, var(--token) <alpha>)` where supported, or add an alpha token (e.g., `--aqb-primary-60: rgba(45,109,255,0.6)`) to `default.css`.

---

## Phase 4: Extend applyTheme() (Day 4)

### 4.1 Full Token List

`applyTheme()` currently sets 11 tokens. Extend to cover all CSS variables matching our prefixes:

```typescript
const CSS_VAR_PREFIXES = [
  '--aqb-',    // all --aqb-* tokens
  '--ls-',    // left sidebar tokens
];

// For each prefix, read all computed styles and include in theme object
// This ensures applyTheme() can override any token at runtime
```

### 4.2 readCssVariables() Helper

Bidirectional sync between JS theme and CSS variables:

```typescript
// Read only our tokens (not browser-prefixed or third-party)
function readCssVariables(): Record<string, string> {
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const result: Record<string, string> = {};

  // CSSStyleDeclaration is iterable — for...of gives property names, not values
  // This correctly iterates over custom properties like --aqb-primary, --ls-accent, etc.
  for (const token of styles) {
    if (token.startsWith('--aqb-') || token.startsWith('--ls-')) {
      result[token] = styles.getPropertyValue(token).trim();
    }
  }
  return result;
}

// Write theme values back to CSS (used by applyTheme)
// theme keys are CSS variable names directly (e.g., '--aqb-primary', '--aqb-bg-dark')
// no camelCase-to-dash mapping needed — the JS theme object uses the same names
function writeCssVariables(theme: Record<string, string>): void {
  const root = document.documentElement;
  for (const [token, value] of Object.entries(theme)) {
    if (token.startsWith('--aqb-') || token.startsWith('--ls-')) {
      root.style.setProperty(token, value);
    }
  }
}
```

**Scope restriction:** Only read/write tokens matching `--aqb-` or `--ls-` prefixes. Ignore browser-internal variables and any third-party tokens. This prevents collision with unknown variables.

**TokenRegistryContext interaction:** `useColorTokens.ts`, `useSpacingTokens.ts`, `useTypeTokens.ts` call `document.documentElement.style.setProperty()` directly. After Phase 4.2, these writes go through `writeCssVariables()` so `applyTheme()` knows about them. No breaking changes to the hooks — just wrap the write call.

---

## Phase 5: Verify & Test (Day 5)

### 5.1 Grep Audit

Run: `grep -rn '#3B82F6\|#8B5CF6\|#a78bfa' --include='*.tsx' --include='*.ts' packages/editor/src | grep -v var(`
Zero results = no hardcoded indigo/violet.

### 5.2 Token Usage Map

Use `useTokenUsageMap.ts` to verify every design system tab token maps to a CSS variable that exists in `default.css`.

### 5.3 Visual Smoke Test

Open editor, verify:
- [ ] All sidebar tabs render with correct dark theme
- [ ] Inspector shows cobalt accents (not purple/indigo)
- [ ] Topbar matches sidebar chrome
- [ ] Design system tab color picker uses correct values

---

## Decisions Made

1. **Cobalt is the ONLY accent color.** `--aqb-accent` (purple `#a78bfa`) is deprecated. `--aqb-color-secondary` (purple `#8B5CF6`) is deprecated. All accent actions use `--aqb-primary` (cobalt `#2d6dff`). DESIGN.md enforces this — purple/indigo/violet are banned tokens.

2. **`--aqb-color-*` is an alias layer, not a separate system.** All `--aqb-color-*` tokens resolve to `--aqb-*` tokens. `constants.ts` `DEFAULT_TOKENS` values must match CSS defaults exactly.

3. **`constants.ts` is documentation, not source of truth.** CSS is authoritative. `DEFAULT_TOKENS` is a read-only reference that must be kept in sync via comments and verification scripts.

4. **`--ls-*` coverage gate:** Phase 2.2 must complete before Phase 3.2. Missing `--ls-*` tokens = add to CSS, not skip migration.

5. **`FeatureCard.tsx` amber colors are semantic (warning/notification), not brand.** Keep as-is or map to `--aqb-warning-*` if a pattern emerges. Not a brand color violation.

---

## Decisions Still Open

6. **Topbar: migrate to CSS vars or keep hardcoded?** Topbar is legacy (pre-token). Worth migrating for consistency? (Effort: 2h human / 30 min CC+gstack — included in Phase 3.1)

7. **`--aqb-color-accent` (green #22c55e):** Keep as-is. It's a semantic success color, not an accent. No change needed.

8. **`applyTheme()` bidirectional sync vs design system tab writes:** Phase 4.2 ensures no collision between JS theme overrides and design system tab runtime writes. Acceptable? Any concern about TokenRegistryContext direct writes?

---

## Effort Estimates

| Phase | Task | Human | CC+gstack |
|-------|------|-------|-----------|
| 1.1 | Token inventory audit | 2h | 15 min |
| 1.2 | Conflict identification | 1h | 10 min |
| 1.3 | Hardcoded color audit | 1h | 10 min |
| 2.1 | Add `--aqb-color-*` CSS | 1h | 15 min |
| 2.2 | `--ls-*` coverage check | 30 min | 10 min |
| 2.3 | constants.ts alignment | 30 min | 15 min |
| 3.1 | Topbar CSS migration | 2h | 30 min |
| 3.2 | TSX color migration | 4h | 1h |
| 4.1 | Extend applyTheme() | 2h | 30 min |
| 4.2 | readCssVariables helper | 1h | 15 min |
| 5.1-3 | Verify & test | 2h | 30 min |

**Total: ~17 hours human / ~3.5 hours CC+gstack**

---

## References

- `packages/editor/src/themes/default.css` — primary token source
- `packages/editor/src/themes/index.ts` — JS theme system
- `packages/editor/src/features/design-system/constants.ts` — DEFAULT_TOKENS
- `packages/editor/src/features/design-system/state/TokenRegistryContext.tsx` — runtime token management