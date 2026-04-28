# Audit: packages/editor/src/preview/
**Date:** 2026-04-29
**Module:** preview/
**Files audited:** 129

## Performance (P)
No P0/P1/P2 issues identified.

The module consists entirely of dev-only static galleries. Every `Demo` component is a leaf mount point with no upstream state prop-drilling, no iframes, no synchronous DOM reads/writes, no resize handlers, and no heavy computation inside render paths. Re-renders are limited to local gallery interaction state (e.g., toggles, sliders) and do not affect large sibling subtrees.

---

## Duplication (D)

### [P2] D — Phase 1 HTML files
**Files:** `vibcoder-avatar.html`, `vibcoder-badge.html`, `vibcoder-button.html`, `vibcoder-checkbox.html`, `vibcoder-count.html`, `vibcoder-divider.html`, `vibcoder-grip.html`, `vibcoder-helper-text.html`, `vibcoder-icon.html`, `vibcoder-icon-button.html`, `vibcoder-input.html`, `vibcoder-kbd.html`, `vibcoder-label.html`, `vibcoder-link.html`, `vibcoder-progress.html`, `vibcoder-select.html`, `vibcoder-skeleton.html`, `vibcoder-slider.html`, `vibcoder-spinner.html`, `vibcoder-switch.html`, `vibcoder-tag.html`, `vibcoder-textarea.html`, `vibcoder-thumb.html`
**Description:** Identical CSS utility blocks (`.row`, `.grid`, `.col`, `.stack`, `.field`) and HTML shell patterns are copy-pasted across ~25 side-by-side gallery entry files.
**Rule violated:** Repeated iframe/document setup code.
**Impact:** Changing gallery spacing or the side-by-side layout requires editing ~25 files; divergence is already visible in minor `max-width` and `gap` deltas.
**Suggested fix:** Extract a shared `gallery-base.css` that each HTML shell imports; delete the duplicated `<style>` blocks.

### [P2] D — All `.tsx` entry files
**Files:** Every `vibcoder-*.tsx` gallery entry (64 files)
**Description:** The imperative mount block `const root = document.getElementById("react-root"); if (root) createRoot(root).render(<Demo />);` is duplicated verbatim in every TSX entry point.
**Rule violated:** Repeated iframe/document setup code.
**Impact:** Any change to root-mount semantics (e.g., HMR guard, StrictMode wrapper, error boundary) requires touching 64 files.
**Suggested fix:** Extract a `mountGallery(id, element)` helper in `_lib/` and replace the two-line mount with a one-liner.

### [P2] D — HTML gallery shell duplicated across ~60 entry files
**Files:** All `.html` gallery entries (~60 files)
**Description:** Each `.html` file repeats the same `<!doctype html>`, `<meta charset="utf-8">`, base theme link tags (`default.css`, `_aliases.generated.css`), `body` font/padding/max-width styles, `#react-root` div, and `<script type="module" src="./vibcoder-xxx.tsx">` tag.
**Rule violated:** Repeated iframe/document setup code.
**Impact:** Adding a new theme file or changing base body styles requires a 60-file edit.
**Suggested fix:** Generate HTML shells from a single template at build time, or use a Vite plugin/transform to inject the common scaffold.

### [P2] D — `formRow` + `fieldMock` style objects
**Files:** `vibcoder-helper-text.tsx:2477–2483`, `vibcoder-label.tsx:3325–3331`
**Description:** The exact same `formRow` and `fieldMock` inline style objects are defined independently in two gallery files.
**Rule violated:** Duplicate preview rendering logic across file types.
**Impact:** Semantic duplication; drift risk if one gallery updates spacing and the other is missed.
**Suggested fix:** Move both objects into `_galleryStyles.ts` and import them.

---

## Business Logic (BL)

### [P1] BL — All `.tsx` entry files
**Files:** Every `vibcoder-*.tsx` gallery entry (64 files)
**Description:** Imperative `createRoot(root).render(<Demo />)` calls lack an HMR guard. When Vite hot-reloads a gallery module, the module re-executes and attempts to call `createRoot` on a container that React has already marked as mounted. React 19 throws `Target container already React-rendered`.
**Rule violated:** Missing error handling + memory leaks from iframe/event listeners (re-mount leaks the old root reference).
**Impact:** Dev-only crash path on HMR; breaks the local gallery workflow.
**Suggested fix:** Wrap mounting in a shared `_lib/mountGallery.ts` that checks for an existing root (or unmounts first) before calling `createRoot`.

### [P2] BL — All `.tsx` entry files
**Files:** Every `vibcoder-*.tsx` gallery entry (64 files)
**Description:** No ErrorBoundary wraps the `<Demo />` render tree. Any unhandled exception inside a gallery component (e.g., a malformed icon name, a missing CSS import, or a third-party image fetch failure) crashes the entire page to a blank white screen.
**Rule violated:** Missing error handling.
**Impact:** Gallery debugging is harder because a single defective primitive demo zeroes out the whole page.
**Suggested fix:** Wrap `<Demo />` in an `<ErrorBoundary>` inside the shared mount utility.
