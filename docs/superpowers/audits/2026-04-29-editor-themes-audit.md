# Audit: packages/editor/src/themes/
**Date:** 2026-04-29
**Module:** themes/
**Files audited:** 87

## Performance (P)

### [P1] P — default.css:20
**Description:** `default.css` imports `components.css`, a 1,729-line monolithic legacy grab-bag that is not tree-shakeable.
**Rule violated:** Large CSS imports not tree-shakeable.
**Impact:** Every consumer of `default.css` ships legacy `.tb-*`, `.buildrick-*`, `@keyframes`, and global element selectors regardless of which classes they actually use.
**Suggested fix:** Finish per-component migration tracked in the file header and delete `components.css`; replace the import with granular per-component CSS or co-located Emotion styles.

### [P2] P — components.css:374-382,512-520,1123-1131
**Description:** Three identical `@keyframes` spin animations (`tbSpin`, `spin`, `buildrick-spin`) coexist in the same file.
**Rule violated:** Duplicate CSS rules.
**Impact:** ~27 lines of redundant animation definitions shipped to every importer.
**Suggested fix:** Consolidate to a single `@keyframes` name and codemod remaining legacy consumers.

### [P2] P — components.css:1290-1541
**Description:** Global element selectors (`input[type="range"]`, `input[type="color"]`, `:focus-visible`) and universal disabled rules are unscoped.
**Rule violated:** Un-tree-shakeable imports / module-level CSS serialization overhead.
**Impact:** Browser style recalculation is forced across the entire document; these rules cannot be eliminated by the bundler even when unused.
**Suggested fix:** Scope to `.buildrick-*` namespaces or migrate to component-level CSS.

### [P2] P — components.css:374-1281
**Description:** The legacy file contains ~15 `@keyframes` blocks for animations that most consumers never trigger.
**Rule violated:** Un-tree-shakeable imports.
**Impact:** Wasted parse time and bytes for animations (modal-in, toast-in, popover-in, float-in, etc.) that ship unconditionally.
**Suggested fix:** Move keyframes next to the components that use them, or delete unused ones after consumer audit.

## Duplication (D)

### [P1] D — components.css:574-588 / ux-fixes.css:21-55
**Description:** `.buildrick-input:hover`, `.buildrick-input:focus`, `.buildrick-select:hover`, `.buildrick-textarea:focus` are defined in both legacy files with overlapping but divergent declarations.
**Rule violated:** Duplicate CSS rules.
**Impact:** Specificity wars and maintenance drift; a change to input hover must be made in two places.
**Suggested fix:** Delete the overlapping rules from `ux-fixes.css` (already marked for retirement) and keep canonical definitions in `components.css` until full primitive migration.

### [P1] D — components.css:528-547 / atoms/button.css:10-26
**Description:** `.buildrick-btn` and `.bd-btn` implement the same button atom (inline-flex, gap, padding, radius, transition, primary/secondary/ghost variants).
**Rule violated:** Same utility classes in multiple theme definitions.
**Impact:** Two sources of truth for button styling; consumers use either legacy or modern class depending on migration status.
**Suggested fix:** Migrate remaining `.buildrick-btn` consumers to `.bd-btn` and delete legacy rules.

### [P1] D — components.css:1580-1608 / atoms/icon-button.css:14-62
**Description:** `.buildrick-icon-btn` and `.bd-icon-btn` both implement the same square ghost icon button pattern.
**Rule violated:** Same utility classes in multiple theme definitions.
**Impact:** Same pattern, two files; any focus-ring or sizing change must be edited twice.
**Suggested fix:** Migrate remaining `.buildrick-icon-btn` consumers to `.bd-icon-btn` and delete legacy rules.

### [P2] D — design-system/color.css:19-20
**Description:** `--buildrick-text-muted: #94A3B8` and `--buildrick-text-tertiary: #94A3B8` have identical values.
**Rule violated:** Duplicate color/token definitions across theme files.
**Impact:** Two names for the same concept; consumers arbitrarily pick one, making future renaming or deprecation risky.
**Suggested fix:** Deprecate `--buildrick-text-tertiary` and migrate all consumers to `--buildrick-text-muted`.

### [P2] D — components.css:1383-1449 / ux-fixes.css:212-270
**Description:** `.buildrick-empty-state`, `.buildrick-empty-state-icon`, `.buildrick-empty-state-title`, `.buildrick-empty-state-desc`, and `.buildrick-empty-state-compact` are duplicated across both legacy files.
**Rule violated:** Duplicate CSS rules.
**Impact:** Rules diverge slightly (e.g. `ux-fixes.css` adds `animation: float 3s ease-in-out infinite` which violates DESIGN.md "No entrance animations on load").
**Suggested fix:** Delete the `ux-fixes.css` copies and migrate consumers to the `bdr-empty` organism.

### [P2] D — components.css:704-749 / ux-fixes.css:105-125
**Description:** `.buildrick-switch-track` and `.buildrick-switch-thumb` rules are duplicated in both legacy files.
**Rule violated:** Duplicate CSS rules.
**Impact:** Hover shadows and transitions defined twice with different easings (`cubic-bezier(0.4, 0, 0.2, 1)` vs token easing).
**Suggested fix:** Delete the `ux-fixes.css` copies.

### [P2] D — components.css:848-903 / ux-fixes.css:133-161
**Description:** `.buildrick-slider` and `::-webkit-slider-thumb` rules are duplicated in both legacy files.
**Rule violated:** Duplicate CSS rules.
**Impact:** Thumb hover/active scales differ between files (`scale(1.1)` vs `scale(1.15)`), causing inconsistent interaction feel.
**Suggested fix:** Delete the `ux-fixes.css` copies.

### [P2] D — components.css:780-822 / ux-fixes.css:172-199
**Description:** `.buildrick-color-swatch` and `.buildrick-color-preset` rules are duplicated in both legacy files.
**Rule violated:** Duplicate CSS rules.
**Impact:** Transition durations and hover transforms differ (`transform: scale(1.05)` vs `scale(1.1)`).
**Suggested fix:** Delete the `ux-fixes.css` copies.

### [P2] D — design-system/bd-aliases.css vs components/_aliases.generated.css
**Description:** Two parallel alias layers map `--bd-*` to `--buildrick-*`; ~58 tokens exist only in the generated file and ~55 exist only in the manual file.
**Rule violated:** Same utility classes in multiple theme definitions / semantic duplication.
**Impact:** Confusion about which alias layer to use; consumers may import one layer and reference tokens from the other.
**Suggested fix:** Consolidate to a single alias layer or split by consumer domain (chrome JSX vs vibcoder gallery).

## Business Logic (BL)

### [P1] BL — components.css:418
**Description:** `.pill` uses `var(--buildrick-border, rgba(255, 255, 255, 0.12))` — the fallback is a dark-theme value.
**Rule violated:** Missing fallback colors for undefined tokens.
**Impact:** On light surfaces the fallback renders as near-white (invisible), breaking the pill border when the token is missing.
**Suggested fix:** Remove the dark-theme fallback and rely on the canonical `--buildrick-border` token.

### [P1] BL — components.css:448
**Description:** `.ico` hardcodes `color: rgba(235, 245, 255, 0.9)`, a dark-theme leftover.
**Rule violated:** Missing fallback colors for undefined tokens.
**Impact:** On the light theme (per DESIGN.md) this color is nearly invisible against light backgrounds.
**Suggested fix:** Replace with `--buildrick-text-secondary` or `--buildrick-text-muted`.

### [P1] BL — Multiple vendored component files
**Description:** Many component CSS files reference `--buildrick-*` tokens that do not exist in the canonical `design-system/` entry point (`default.css` / `design-system/index.css`).
**Rule violated:** Missing fallback colors for undefined tokens.
**Impact:** Runtime CSS variables resolve as undefined, causing invisible shadows, missing backgrounds, and collapsed borders.
**Representative samples:**
- `popover.css:13` — `--buildrick-ink-18`, `--buildrick-ink-06`
- `badge.css:47` — `--buildrick-accent-alpha-08`
- `skeleton.css:22` — `--buildrick-accent-alpha-08`
- `toast.css:46` — `--buildrick-error-soft`
- `a11y-overlay.css:100` — `--buildrick-error-soft`
- `rail-tile.css:106` — `--buildrick-ink-08`
- `empty-state.css:34` — `--buildrick-radius-2xl`
- `kbd.css:30` — `--buildrick-text-3xs`
- `drawer.css:18` — `--buildrick-z-drawer`
- `modal.css:12` — `--buildrick-ink-48`
- `color-picker.css:53` — `--buildrick-shadow-black-30`
**Suggested fix:** Either promote the missing tokens from `project/vibcoder/reference/color.css` into the canonical DS files, or vend a token bridge that imports the reference file before component CSS.

### [P2] BL — components.css:465
**Description:** `.brand` references `var(--pillStroke)` which is never defined in the canonical DS.
**Rule violated:** Missing fallback colors for undefined tokens.
**Impact:** The brand chip renders with no border color.
**Suggested fix:** Replace with `--buildrick-border` or `--buildrick-border-medium`.

### [P2] BL — a11y.css:26-28
**Description:** `@media (prefers-contrast: high)` uses system colors `CanvasText` and `Highlight`.
**Rule violated:** Missing fallback colors for undefined tokens.
**Impact:** On systems where the OS light theme matches the app light theme, `CanvasText` may render as a near-invisible low-contrast shade.
**Suggested fix:** Use explicit high-contrast hex values or canonical `--buildrick-text-heading` instead of system colors.

### [P2] BL — color-picker.css:52-53
**Description:** Hue spectrum strip hardcodes `#ff0000`, `#ffff00`, `#00ff00`, `#00ffff`, `#0000ff`, `#ff00ff`.
**Rule violated:** Theme state managed in multiple places / missing fallback colors.
**Impact:** Hardcoded hex values break SSOT; any global color palette shift won't affect the picker.
**Suggested fix:** Acceptable as a structural rainbow exemption, but document the exemption explicitly in a comment or move to a `--buildrick-spectrum-*` token series.

### [P2] BL — design-system/bd-aliases.css:41
**Description:** `--bd-border-light: var(--buildrick-border);` maps to `--buildrick-border` (#E2E8F0), but the semantic `--buildrick-border-light` token is #94A3B8.
**Rule violated:** Theme state managed in multiple places.
**Impact:** Callers using `--bd-border-light` receive a much lighter gray than the semantic namesake suggests.
**Suggested fix:** Change to `var(--buildrick-border-light)`.

### [P2] BL — components.css:62
**Description:** `.buildrick-page-card.is-active` hardcodes `#4fd1a1` instead of using `--buildrick-success`.
**Rule violated:** Theme state managed in multiple places.
**Impact:** If the success semantic token changes, this rule stays stale.
**Suggested fix:** Replace with `var(--buildrick-success)`.
