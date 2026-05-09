# Token Binding Resolver (P3, Phase 1) — Implementation Plan

**Date:** 2026-05-09
**Source:** CEO plan AD1 + AD2 (revised iter-3)
**Goal:** Engine-free token resolver primitive at the apply call site. Templates carry `{{token.kind.name}}` placeholders; resolver swaps in current-DS values before sanitize+import. Phase 1 ships ONLY the pure utilities; consumer wiring (useTemplateApply integration) and inverse resolver (P4) come later.

---

## Inventory

- DEFAULT_TOKENS at `editor/design-system/constants.ts` — token shape: `{ id, name, value, cssVar, kind, ... }`. IDs kebab-case (`color-primary`, `spacing-md`).
- CSS vars: `--buildrick-design-${id}` set on `:root` by TokenRegistryContext applier.
- DOMPurify available + already used at `engine/export/sanitizeHeadCode.ts`, `templates/TemplatePreview.tsx`, etc.
- `composer.elements.importHTMLToActivePage(html)` exists — apply call site per AD1.
- TemplatesTab apply path: `useTemplateApply.ts` → eventually calls `importHTMLToActivePage`.
- AD1 says: live in `editor/sidebar/tabs/templates/utils/resolveTemplateTokens.ts` — engine untouched.

---

## File Structure

**Create:**
- `packages/editor/src/editor/sidebar/tabs/templates/utils/tokenSnapshot.ts` — type + builders
- `packages/editor/src/editor/sidebar/tabs/templates/utils/resolveTemplateTokens.ts` — regex pass + DOMPurify
- `packages/editor/src/editor/sidebar/tabs/templates/utils/__tests__/resolveTemplateTokens.test.ts` — full coverage

**NOT in this slice:**
- useTemplateApply integration (next slice)
- DEFAULT_TOKENS migration to add `{{token.*}}` to existing 25 templates (P3 codemod, separate slice)
- Inverse resolver (P4)

---

## Public API

```ts
// tokenSnapshot.ts
export interface TokenSnapshot {
  colors:     Record<string, string>;
  spacing:    Record<string, string>;
  typography: Record<string, string>;
  radius:     Record<string, string>;
}

/** Build a snapshot from in-memory DesignToken[] (test path / direct path). */
export function snapshotFromTokens(tokens: ReadonlyArray<DesignToken>): TokenSnapshot;

/** Build a snapshot from :root computed style — runtime path. */
export function snapshotFromComputedStyle(
  el: HTMLElement,
  tokens: ReadonlyArray<DesignToken>,
): TokenSnapshot;

// resolveTemplateTokens.ts
export function resolveTokens(html: string, snapshot: TokenSnapshot): string;
```

**Resolution rules:**

- Regex: `/\{\{token\.([a-z]+)\.([a-z0-9-]+)\}\}/g`
- Capture groups: kind + name
- Kind aliases: `color` → `colors`, `space` / `spacing` → `spacing`, `type` / `typography` → `typography`, `radius` → `radius`
- Lookup: `snapshot[kindMapped][name]` → string
- Miss: leave placeholder verbatim (debuggable; future: emit warning)
- HTML escape: substituted values are plain strings; no HTML semantics expected (token values are CSS values, e.g., `#2D6DFF` or `8px`)
- After resolve: `DOMPurify.sanitize(resolvedHtml, { ADD_ATTR: ['data-buildrick-id'] })`

---

## Tasks (TDD, atomic)

### Task 1 — tokenSnapshot.ts

Build shape + tests:
- `snapshotFromTokens` groups DesignToken[] by kind; uses `name` as key (lowercase)
- `snapshotFromComputedStyle` reads `getPropertyValue(token.cssVar).trim()` per token; falls back to `token.value` when computed is empty (test environment without :root)

### Task 2 — resolveTemplateTokens.ts

Regex pass + DOMPurify:
- Single regex sweep across HTML
- Per match: kind alias + lookup; verbatim on miss
- DOMPurify last with ADD_ATTR for data-buildrick-id

### Task 3 — Tests

Coverage:
- Single placeholder substitutes
- Multiple placeholders mixed types
- Unknown kind / name → verbatim
- Inline style attribute substitution
- ClassName substitution
- DOMPurify removes `<script>` tags (sanitize confirmed in pipeline)
- HTML preserves data-buildrick-id attrs after sanitize
- Empty html / empty tokens → returns sanitized empty string

### Task 4 — Commit + tag

`p3-token-resolver-engine-complete` (LOCAL).

---

## Self-review

- ☐ Engine boundary preserved: file lives in `editor/sidebar/tabs/templates/utils/` per AD1
- ☐ DOMPurify wraps every resolved output (XSS contract closed)
- ☐ Token miss leaves placeholder verbatim — easier to spot vs silent empty-string
- ☐ TokenSnapshot shape matches AD1 exactly so future consumer integration is mechanical
- ☐ No DEFAULT_TOKENS template changes this slice — codemod is separate scope
