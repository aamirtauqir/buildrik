# Audit: packages/editor/src/components/
**Date:** 2026-04-29
**Module:** components/
**Files audited:** 222

## Summary

The `components/` directory is a legacy transition layer. **214 of 222 files** are pure redirect barrels (re-exporting to `editor/`, `shared/`, etc.) with zero logic. Only **4 CSS files** and **2 stub React components** contain actual content. The primary audit finding is structural: the entire module violates the "No middle-man files" and "No pass-through wrappers" architecture rules.

---

## Performance (P)

No React performance issues were found within the audited files. The 214 redirect files contain no runtime logic, props, or component definitions. The 4 CSS files contain `@keyframes` animations, but they are lightweight, finite-duration, and scoped to specific CSS classes. No unmemoized expensive components, inline objects, or missing `React.memo` issues exist in this module because there are virtually no actual React components here.

---

## Duplication (D)

### [P1] D — LeftSidebar.css:1,3
**Description:** Duplicate `@import "../LayersPanel/styles/layers.css";` statement, and line 3 contains malformed syntax (`{@import` — stray `{` character).
**Rule violated:** Duplication — repeated import block / malformed CSS.
**Impact:** The duplicate import may cause the same CSS to be evaluated twice by the browser. The stray `{` on line 3 is a CSS syntax error that will break parsing of the subsequent imports.
**Suggested fix:** Remove the duplicate import and the stray `{` on line 3. Keep only line 1.

### [P1] D — Module-wide: 214 redirect barrel files
**Description:** Every file in `AI/`, `Canvas/` (except `.css` files), `Editor/`, `Media/`, `Panels/` (except stubs), `forms/`, `ui/`, and most `Canvas/` subdirectories exists solely to re-export from another file.
**Rule violated:** Duplication — "No middle-man files" and "No pass-through wrappers" rules.
**Impact:** Creates indirection, fragments the dependency graph, increases build/module resolution overhead, and forces developers to trace through two file paths for every import. Violates the "Flat over nested" and "No spaghetti execution" conventions.
**Suggested fix:** Complete Phase 5 barrel cleanup — delete `components/` and retarget all consumers to canonical `editor/` and `shared/` paths.

### [P2] D — Canvas.css:20-25
**Description:** Typography scale tokens (`--buildrick-font-xs` through `--buildrick-font-xl`) are redefined inside `.buildrick-canvas`, shadowing canonical DS V1 tokens.
**Rule violated:** Duplication — Single Source of Truth (SSOT) violation for design tokens.
**Impact:** Token drift risk; if the canonical typography scale changes, the canvas will render with stale sizes.
**Suggested fix:** Remove scoped redefinitions and import canonical tokens from `themes/design-system/`.

### [P2] D — Canvas.css:450-505
**Description:** Empty CTA styles hardcode hex colors (`#1e293b`, `#475569`, `#fff`) and a linear-gradient instead of using canonical CSS variables.
**Rule violated:** Duplication — token values hardcoded where variables exist.
**Impact:** Visual inconsistency if themes change; maintenance burden.
**Suggested fix:** Replace hardcoded colors with `--buildrick-text-primary`, `--buildrick-text-secondary`, and `--buildrick-accent` tokens.

---

## Business Logic (BL)

### [P1] BL — Panels/StylesPanel/index.tsx:9-10
**Description:** Stub component accepts `composer?: unknown` and `selectedElement?: unknown` with no runtime validation or type narrowing.
**Rule violated:** Business Logic — missing validation on user-facing inputs / weak typing.
**Impact:** Consumers of this stub receive zero type safety. Any property access on `composer` or `selectedElement` requires manual casting or will fail at runtime. The component returns `null`, so it also represents an incomplete feature path.
**Suggested fix:** Either complete the migration to canonical `editor/panels/styles` and delete this stub, or add proper Zod/runtime validation if it must remain as a boundary.

### [P1] BL — Panels/TraitPanel/index.tsx:9-10
**Description:** Same as StylesPanel — stub component with `unknown` props and no validation.
**Rule violated:** Business Logic — missing validation on user-facing inputs.
**Impact:** Zero type safety on core editor panel props; runtime failure risk.
**Suggested fix:** Complete migration to canonical `editor/panels/traits` or add runtime validation.

### [P2] BL — Canvas.css:771,807,812
**Description:** `var(--buildrick-accent, #667eea)` fallback uses indigo/violet (`#667eea`), which violates DESIGN.md's single-accent rule (cobalt `#2D6DFF` is canonical; indigo/violet tokens are being migrated out).
**Rule violated:** Business Logic — direct use of deprecated token values instead of canonical accent.
**Impact:** If `--buildrick-accent` is undefined, the canvas falls back to a banned color, causing visual inconsistency with the design system.
**Suggested fix:** Replace `#667eea` fallback with `#2D6DFF`.

### [P2] BL — Canvas.css:715
**Description:** `font-family: monospace` used in x-ray mode labels.
**Rule violated:** Business Logic — DESIGN.md mandates `Geist Mono` for data/monospace contexts; `monospace` is a banned default fallback.
**Impact:** Typography inconsistency; renders system default monospace instead of the design-system font.
**Suggested fix:** Replace `font-family: monospace` with `var(--buildrick-font-mono)` or `Geist Mono`.

### [P2] BL — LeftSidebar.css:3
**Description:** Malformed CSS line: `@import "../LayersPanel/styles/layers.css"; {@import "./tabs/history/styles/history.css";` contains a stray `{` before the history import.
**Rule violated:** Business Logic — syntax error in production CSS that could block parser execution.
**Impact:** Browser CSS parser may fail to load `history.css`, `settings.css`, `design-tokens.css`, and `media.css` because the stray `{` invalidates the rule block.
**Suggested fix:** Remove the stray `{` and the duplicate layers import on line 3.

---

## File Coverage

| Subdirectory | Files | Actual Content | Redirect Barrels |
|---|---|---|---|
| AI/ | 10 | 0 | 10 |
| Canvas/ | 96 | 3 (.css) | 93 |
| Editor/ | 26 | 0 | 26 |
| Layout/ | 1 | 0 | 1 |
| Media/ | 10 | 0 | 10 |
| Panels/ | 55 | 3 (.css + 2 stubs) | 52 |
| forms/ | 19 | 0 | 19 |
| ui/ | 2 | 0 | 2 |
| Root | 3 | 1 (index.ts) | 3 |
| **Total** | **222** | **7** | **215** |

*(Note: `Panels/index.ts` is a redirect barrel that also references local stubs, counted as redirect. `Canvas/index.ts` and `AI/index.ts` are redirect barrels with curated exports.)*

---

## Self-Review Notes

- **False positives checked:** The redirect barrels are explicitly marked "TRANSITION REDIRECT" with Phase 5 cleanup notes. They are intentional migration artifacts, but they still violate the "No middle-man files" rule and should be catalogued.
- **Performance:** No React runtime code exists in the redirect files, so no memoization or prop-object issues are present.
- **Business Logic:** The only real code lives in 4 CSS files and 2 stub components. CSS issues are catalogued. The stub components are incomplete by design but represent weak type boundaries.
- **All files covered:** Every `.ts`, `.tsx`, and `.css` file in `packages/editor/src/components/` was inspected.
