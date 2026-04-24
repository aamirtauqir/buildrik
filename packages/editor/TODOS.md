# TODOS.md — Buildrik

Deferred work from CEO reviews and implementation sessions. Ordered by priority.

---

## P2 — Should Do Soon

### T-DS-LEAK-01: Migrate 179 chrome files from --buildrick-* to --bd-*
**What:** Codex DS audit (2026-04-25) found 179 chrome files still referencing canonical `--buildrick-*` tokens directly instead of going through the `--bd-*` alias layer. The bridge contract holds for reconciled primitives (Button, FormInput, NumericStepper, Badge, Modal, Popover, TextInput, Section) but legacy chrome bypasses it.
**Why:** Single Source of Truth violation. The `--bd-*` layer exists so canonical values can change in one place (color.css) without grepping 179 files. Right now changing the cobalt accent requires editing each consumer.
**How to apply:** Mechanical sweep with `sed -i '' 's/var(--buildrick-/var(--bd-/g'` on chrome files (editor/, shared/ui/, shared/forms/, ai/, features/design-system/ui/, themes/components.css, themes/ux-fixes.css). For each consumer, verify alias exists in bd-aliases.css; add missing aliases as needed (use Gate 17 ghost-alias scan first). Test visually after each tab/feature directory. Sample violators: components.css:56-79, ux-fixes.css:22-23, LibraryManager.css:4-14, Canvas.css:3-31, CMSCollectionSetupModal.tsx:66-99, AccountModal.tsx:76-107, SelectFontField.tsx:87-131.
**Effort:** L (human: ~2 days / CC: ~half-day with adversarial review per phase)
**Depends on:** Add Gate 17 (ghost-alias guard) FIRST so the sweep doesn't introduce silent renders.

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

### T-DS-SHADOW-PAGES-MENUS: Tokenize 2 raw dropdown shadows in PagesTab.css
**What:** PagesTab.css:493 and :574 both ship `box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18)` (identical) on `.bd-pg-add-options` and `.bd-pg-bulk-menu` (popover menus). Landed in Pages tab rewrites between commits f378cc3 and 244b792 while Gate 2 was failing and masking Gate 12.
**Why:** SSOT violation — same shadow duplicated. Alpha 0.18 is 3× heavier than `--bd-shadow-dropdown` (0.06), so this isn't a drop-in tokenization — author chose a deliberately heavier elevation. Either matches an existing token semantic the team wants to extend (modal-style elevation on menus) or warrants a new token like `--buildrick-shadow-popover-elevated`.
**How to apply:** Decide intent: (a) accept lighter look, swap both to `var(--bd-shadow-dropdown)`; (b) keep heavy look, add new token `--buildrick-shadow-popover-elevated: 0 8px 24px rgba(15, 23, 42, 0.18)` to shadow.css + `--bd-shadow-popover-elevated` alias in bd-aliases.css, then tokenize both call sites. After tokenization, lower baseline 177 → 175 in `.chrome-axioms-baseline`.
**Effort:** XS (human: ~10 min / CC: ~2 min)
**Depends on:** Designer call on visual intent — heavier vs lighter shadow on these menus.

### T-DS-SHADOW-01: Replace 25 raw rgba(0,0,0,*) shadows with --bd-shadow-* tokens
**What:** Codex DS audit caught 25 sites still using inline `rgba(0,0,0,*)` box-shadows instead of consuming `--bd-shadow-*` tokens. Locations: components.css:470,493,812,1298,1308; ux-fixes.css:164; SelectFontField.tsx:131; SharedDialogs.css:22; Tooltip.tsx:93; Toast.tsx:231; CommandPalette.tsx:150; LayoutShell.css:126 (and 13 more).
**Why:** Same SSOT violation as token leak. Shadow values can drift across components. DESIGN.md says shadows should be tokenized. Also blocks Gate 12 from passing — currently 188 > 179 baseline because detector only counts tokenized shadows.
**How to apply:** Audit each site against `--bd-shadow-{xs,sm,md,lg,xl,modal,dropdown}` (defined in shadow.css). Pick the closest token by visual blur+spread. For one-off shadows, add to canonical shadow.css if reused, or accept as `@lint-hex-policy:` exempted with rationale.
**Effort:** M (human: ~4h / CC: ~30 min)
**Depends on:** None. Can run after or in parallel with T-DS-LEAK-01.

### T-DS-LEGACY-01: Delete components.css + ux-fixes.css runtime imports
**What:** components.css (1771 lines) is imported via `themes/default.css:18` and ux-fixes.css (362 lines) via `editor/shell/AquibraStudio.tsx:38`. Both have honest "retirement in progress" headers but their consumers (legacy `.buildrick-*` class hooks like `.tb-*`, `.buildrick-input/select/textarea/switch/slider`, `.buildrick-empty-state`, `.buildrick-icon-btn`, etc.) still need them on the runtime path.
**Why:** Dead-code retirement is partial. Codex called it "theater" because the files themselves still ship. Honest end-state: per-component extraction so those rules live with their consumers (FormInput, Toast, Spinner) and the legacy files can be deleted.
**How to apply:** For each cluster listed in components.css header (.tb-* PageTabBar, .buildrick-form-field, .buildrick-btn-group, .buildrick-input/select/textarea, .buildrick-empty-state, .buildrick-icon-btn, .buildrick-number-btn/stepper, .buildrick-slider, .pill, .buildrick-switch, .buildrick-color-swatch/preset, .buildrick-canvas, nav-*, @keyframes buildrick-*): identify owning component, extract rules into co-located CSS or Emotion styled-components, verify visual parity, delete cluster from components.css. When components.css and ux-fixes.css both reach 0 active rules, delete the imports.
**Effort:** XL (human: ~1 week / CC: ~half-day with adversarial review per cluster)
**Depends on:** T-DS-LEAK-01 should run first (sweep --buildrick-* → --bd-* in remaining rules first, so the retirement narrative is clean before extraction).

### ~~T-GATE-12-DETECTOR~~: Update box-shadow gate to recognize --bd-shadow-* — SHIPPED 2026-04-25
**Status:** DONE. Detector regex extended at `packages/editor/scripts/ds-grep-gates.sh:188` and `:256` from `var\(--buildrick-(shadow|glow)` to `var\(--(buildrick|bd)-(shadow|glow)`. Recognized 7 additional tokenized box-shadows (Tooltip, Toast, etc.) that previously counted as raw. Gate 12 raw count dropped 182 → 175. Baseline lowered to 175 in `.chrome-axioms-baseline`. Gate 11 also dropped 85 → 78 due to indigo-gradient removal in `fe0c792` + `17c6be0`; baseline lowered. Unblocks downstream gates 13-17 from running once Gate 2 (pre-existing) is unblocked.

### T-GATE-16-FLIP: Flip Gate 16 from REGRESSION to ERROR mode
**What:** Gate 16 currently runs `find-inline-hex-v2.mjs --editor-only --exclude-fallback` (regression mode, baseline 684). When editor-scoped baseline reaches 0, flip to `--fail` mode + rename gate "ERROR mode (zero tolerance)".
**Why:** Stop shipping new inline hex in editor/** non-inspector code. Currently the baseline lets 684 sites slide.
**How to apply:** When `.hex-baseline-editor` hits 0: edit `ds-grep-gates.sh:317` to add `--fail` flag, update pass message to "ERROR mode (zero tolerance)", remove `.hex-baseline-editor` file (no longer needed in --fail mode).
**Effort:** XS (human: ~10 min / CC: ~2 min)
**Depends on:** Editor baseline reduced to 0 via T-DS-SHADOW-01 + per-tab inline-hex sweeps.

### ~~T-GATE-17-GHOSTS~~: Add ghost-alias detection gate — SHIPPED 2026-04-25
**Status:** DONE. Gate 17 landed at `packages/editor/scripts/ds-grep-gates.sh:308-345`. Failure path tested by injecting a fake `var(--bd-test-ghost-marker)` reference; gate detected it and reported the consumer file:line. Currently passes with zero ghosts. Unblocks T-DS-LEAK-01 (the 179-file --buildrick-* sweep can run with ghost-introduction protection).
