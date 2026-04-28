# Audit: packages/editor/src/styles/
**Date:** 2026-04-29
**Module:** styles/
**Files audited:** 2

## Performance (P)

### P1 — canvas.tokens.ts:252
**Description:** `cssFragments.transition` uses `transition: all`.
**Rule violated:** Synchronous blocking in style application / un-tree-shakeable imports.
**Impact:** Forces the browser to monitor every animatable property for changes, increasing compositor workload and jank during interactions.
**Suggested fix:** Replace `all` with an explicit property list (e.g., `transform, box-shadow, opacity`).

### P1 — canvas.tokens.ts:275
**Description:** `cssFragments.glass` applies `backdrop-filter: blur(12px)` without containment or `@supports` guard.
**Rule violated:** Synchronous blocking in style application.
**Impact:** `backdrop-filter` forces the browser to create an expensive GPU compositing layer; on large surfaces this causes frame drops, especially on lower-end devices.
**Suggested fix:** Add `contain: paint` and wrap in `@supports (backdrop-filter: blur(12px))` with a solid-color fallback.

### P2 — canvas.tokens.ts:250
**Description:** `cssFragments` is a monolithic object exported at module level.
**Rule violated:** Un-tree-shakeable imports.
**Impact:** Bundlers cannot eliminate unused fragments because they are properties of a single exported object; consumers pay serialization cost for every fragment even if they only need one.
**Suggested fix:** Export each fragment as a top-level named export so tree-shaking can dead-code eliminate unused ones.

### P2 — canvas.tokens.ts:191
**Description:** Five `keyframes` objects are instantiated at module level.
**Rule violated:** Un-tree-shakeable imports / synchronous blocking in style application.
**Impact:** All five animations are serialized and hashed on every module import, regardless of whether the importing code uses any of them.
**Suggested fix:** Lazily create keyframes inside the components that consume them, or export them individually rather than inside a monolithic `animations` object.

## Duplication (D)

### P1 — canvas.tokens.ts:20-21
**Description:** `colors.primary.subtle` and `colors.primary.alpha10` hold the identical raw value `rgba(45, 109, 255, 0.1)`.
**Rule violated:** Repeated token values that should reference a single variable.
**Impact:** One token change requires two edits; risk of drift if only one is updated.
**Suggested fix:** Delete `subtle` and point consumers to `alpha10`, or make `subtle` an alias reference rather than a duplicated raw string.

### P1 — canvas.tokens.ts:37,72
**Description:** `colors.surface.border` and `colors.border.default` both store `rgba(255, 255, 255, 0.08)`.
**Rule violated:** Duplicate CSS rules / repeated token values that should reference a single variable.
**Impact:** Two semantic names for the same visual value; updates can become inconsistent.
**Suggested fix:** Pick one canonical name and reference it from the other, or collapse into a single token.

### P1 — canvas.tokens.ts:56,65
**Description:** `colors.status.errorBg` and `colors.action.deleteBg` are both `rgba(239, 68, 68, 0.1)`.
**Rule violated:** Repeated token values that should reference a single variable.
**Impact:** Same raw error red duplicated under two semantic namespaces.
**Suggested fix:** Reference a single `errorAlpha10` base token from both `status.errorBg` and `action.deleteBg`.

### P1 — canvas.tokens.ts (multiple)
**Description:** Hardcoded color values defined in this SSOT file are copy-pasted in 20+ other files across `packages/editor/src/`.
**Rule violated:** Duplicate CSS rules / repeated token values that should reference a single variable.
**Impact:** The file claims to be the "single source of truth for all canvas styling" but consumers bypass it, spreading raw `rgba(45, 109, 255, 0.1)`, `#10B981`, `#EF4444`, etc. throughout the codebase.
**Suggested fix:** Replace all inline raw values in consumers with imports from `canvasTokens` and add an ESLint rule to block raw color literals in `src/`.

## Business Logic (BL)

### P1 — canvas.tokens.ts:17-45 (multiple)
**Description:** CSS custom properties (`var(--bd-accent)`, `var(--bd-bg-card)`, `var(--bd-fg-primary)`, etc.) are used without fallback values.
**Rule violated:** Missing fallback colors.
**Impact:** If the theme CSS file fails to load or a variable is renamed, these tokens evaluate to `invalid` and render as transparent or default black, breaking the canvas UI.
**Suggested fix:** Provide fallback values for every `var()` call, e.g., `var(--bd-accent, #2D6DFF)`.

### P1 — canvas.tokens.ts:14-89
**Description:** Theme state is split between CSS variables and hardcoded JS color values.
**Rule violated:** Theme state managed in multiple places.
**Impact:** Colors like `#0A0A0A`, `#B8B5AD`, `#10B981`, and `#EF4444` are baked into JS objects. A runtime theme switch that updates CSS variables will leave these hardcoded colors unchanged, producing a visually inconsistent canvas.
**Suggested fix:** Move all canonical color values into CSS custom properties and reference them uniformly; reserve JS tokens for derived numeric values (spacing, z-index, sizing).

### P2 — canvas.tokens.ts:250,191
**Description:** Emotion `css` and `keyframes` calls execute at module-import time.
**Rule violated:** Side effects in module-level code.
**Impact:** Every import of this file triggers style serialization/hashing for all fragments and keyframes, adding import-time CPU overhead even when the importing module only needs a single numeric token like `canvasTokens.spacing.xs`.
**Suggested fix:** Lazily evaluate Emotion objects inside component render cycles or memoized factories rather than at the top level of the module.
