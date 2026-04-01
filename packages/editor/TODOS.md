# TODOS.md — Buildrik

Deferred work from CEO reviews and implementation sessions. Ordered by priority.

---

## P2 — Should Do Soon

### T-ISO-01: Component isolation mode — auto-exit on page navigation
**What:** When a user is in component isolation mode (Task 24: double-click to edit master component) and navigates to a different page, the editor has no defined behavior.
**Why:** Users can accidentally get stuck in isolation mode on a different page context. The canvas would show the wrong scope.
**How to apply:** On `composer.on('page:changed')` while `isolationMode === true`: auto-exit isolation, toast "Left component editing mode", restore normal selection. Wire to the page navigation event in PageTabBar.
**Effort:** S (human: ~2h / CC: ~5 min)
**Depends on:** Task 24 (Component Lifecycle) must be implemented first.

---

## P1 — Security (Do Before Shipping)

### T-SEC-RICHTEXT: RichTextEditor has no paste sanitization
**What:** `src/editor/panels/RichTextEditor.tsx` uses `contenteditable` + `execCommand` with no DOMPurify on paste. User-pasted HTML (e.g. `<img src=x onerror="...">`) executes in the editor context.
**Why:** XSS risk via paste. ExportUtils.ts has a custom sanitizer for preview output, but it does NOT cover in-editor input.
**How to apply:** Install `dompurify` + `@types/dompurify`. In the paste handler, wrap incoming HTML in `DOMPurify.sanitize(pastedHtml)` before applying via execCommand. Add a test: paste `<img src=x onerror="window.__XSS__=true">`, assert `window.__XSS__` is undefined.
**Effort:** XS (human: ~1h / CC: ~5 min)
**Depends on:** None. Non-blocking for Phase 0 but must ship before Task 5 (inline text editing).

---

## P3 — Do Eventually

### T-DESIGN-01: Create DESIGN.md — centralize design tokens
**What:** All color tokens, spacing scale, and typography definitions live scattered across `docs/superpowers/specs/`. No single source of truth for design decisions. Future wireframe frames and code components will drift.
**Why:** Token drift causes bugs: two "amber warning" banners ended up with different border colors (`#F59E0B` vs `#FDE68A`) before the design review caught it. At scale this produces inconsistent UI.
**How to apply:** Run `/design-consultation` to generate `DESIGN.md` from the existing editer.pen wireframes + specs. Output should include: color system (Tailwind slate palette + semantic overrides), spacing scale, typography scale (font sizes, weights, line heights), component vocabulary (chip, banner, modal, rail, topbar ref patterns).
**Effort:** S (human: ~4h / CC: ~15 min via /design-consultation)
**Depends on:** Design remediation sprint (Frames 25–35) should be complete first — extract tokens from the finished design, not the in-progress one.

---

### T-CMS-VIRT: RecordTable virtualization
**What:** CMS RecordTable (Task 15) has no virtualization for large datasets.
**Why:** At 10K+ records (real CMS use case), the DOM will become unresponsive. Column rendering with 10K+ rows is a hard DOM limit.
**How to apply:** Wire `@tanstack/react-virtual` or `react-virtualized` to the RecordTable row renderer. Only render visible rows + overscan buffer.
**Effort:** M (human: ~1 day / CC: ~15 min)
**Depends on:** Task 15 (CMS Record Management) must be implemented first.

### T-CMD-EMPTY: Command palette empty state
**What:** Task 1 specifies fuzzy search and grouped results but doesn't define the zero-results state.
**Why:** Users who type a query with no matches currently see a blank list — no affordance for what to try next.
**How to apply:** When fuzzy search returns 0 results: show centered "No results for 'xyz'" with a helpful suggestion ("Try 'Add text' or press Escape").
**Effort:** XS (human: ~30 min / CC: ~2 min)
**Depends on:** Task 1 (Command Palette) must be implemented first.
