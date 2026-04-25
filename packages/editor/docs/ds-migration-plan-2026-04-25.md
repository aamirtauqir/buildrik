# Design System Migration Plan — Phase 2 Categorization

**Date:** 2026-04-25
**Branch:** `main`
**Input:** `ds-audit-2026-04-25.md` (1498 hex, 2076 inline px, 9 dead primitives, ~80% color compliance, <2% spacing compliance)
**Status:** read-only doc. No code modified.

---

## Categorization Framework

Every violation falls in one of four buckets:

| Bucket | Definition | Action |
|---|---|---|
| **A — Auto-fixable** | Mechanical 1:1 substitution. Hex matches a known token value, or px matches the 4-pt grid. | scripted codemod (sed / jscodeshift) |
| **B — Manual judgment** | Substitution depends on context (e.g. is `8px` a spacing-token candidate or a transform offset?). | file-by-file Edit pass |
| **C — Banned** | Should not exist anywhere. Block via ESLint rule promotion (WARN → ERROR). | rule change, no file edits |
| **D — Out of scope** | Legit raw value (color name lookup table, user-content fixture, picker tooling, system font fallback). | exclude from rule + grep gate |

---

## Bucket A — Auto-fixable (scripted codemod)

### A.1 — Hex literal → canonical token (~403 sites)

15 known canonical values cover ~30% of all hex. Mechanical substitution:

| Hex | Canonical token | Sites | Map to |
|---|---|---:|---|
| `#FFFFFF` | white card / on-accent | 86 | `var(--bd-bg-card)` (or `--bd-fg-on-accent`, context-dependent) |
| `#E2E8F0` | default border | 69 | `var(--bd-border)` |
| `#64748B` | secondary text | 55 | `var(--bd-fg-secondary)` |
| `#94A3B8` | muted text / strong border | 46 | `var(--bd-fg-muted)` |
| `#F8FAFC` | panel bg / canvas wrapper | 39 | `var(--bd-bg-panel)` |
| `#2D6DFF` | accent cobalt | 33 | `var(--bd-accent)` |
| `#F1F5F9` | subtle bg | 32 | `var(--bd-bg-subtle)` |
| `#334155` | primary text | 16 | `var(--bd-fg-primary)` |
| `#CBD5E1` | medium border | 12 | `var(--bd-border-medium)` |
| `#DC2626` | error | 10 | `var(--bd-error)` |
| `#0F172A` | heading text | 2 | `var(--bd-fg-heading)` |
| `#D97706` | warning | 2 | `var(--bd-warning)` |
| `#16A34A` | success | 1 | `var(--bd-success)` |
| `#4B8DFF` | accent hover | 0 | (already migrated) |
| `#1E58D9` | accent pressed | 0 | (already migrated) |

Codemod risk: **none** when value matches exactly. Edge case: hex inside a `template-fixture` HTML string (D-bucket files). Solution: exclude those files from the codemod glob.

**Approach:** Per-token sed pass scoped to `editor/`, `shared/`, `components/`, `blocks/`, `engine/`, `features/` (excluding `colorTypes.ts`, `templatesData.ts`, `TemplateLibrary.tsx`, `MediaManager.ts`, `FontManager.ts`, `gradientParser.ts`, `devLogger.ts`).

**Estimated impact:** **−403 hex sites in one batch.** Drops baseline from 1498 → 1095.

### A.2 — Integer 4-pt px → spacing token

Inline px values matching the 4-pt grid:

| px | Token | TS+CSS sites |
|---|---|---:|
| `4px` | `--bd-space-1` | 620 |
| `8px` | `--bd-space-2` | 811 |
| `12px` | `--bd-space-3` | 692 |
| `16px` | `--bd-space-4` | 397 |
| `20px` | `--bd-space-5` | 220 |
| `24px` | `--bd-space-6` | 214 |
| `32px` | `--bd-space-8` | 128 |
| `40px` | `--bd-space-10` | 113 |
| `48px` | `--bd-space-12` | 67 |
| **Total** | | **3262** |

**False-positive risk: high.** Many inline px values are NOT spacing:
- `transform: translateX(8px)` — sub-pixel offset, not a token candidate
- `width: 320px`, `height: 48px` — fixed shell dims (use `--bd-shell-*` instead)
- `borderRadius: 8px` — should use `--bd-radius-md`, different family
- `fontSize: 13px` — should use `--bd-text-sm-plus`, different family
- `boxShadow: 0 8px 32px ...` — shadow value, not spacing

Conservative codemod scope: **only padding / margin / gap / inset CSS properties**, not transforms / dimensions / radius / typography.

Property-scoped regex: `(padding|margin|gap|inset|top|right|bottom|left)(-[a-z]+)?\s*:\s*(\d+)px`

**Estimated impact:** ~50% of the 3262 sites are spacing properties. After codemod: **~1500-1700 sites migrated**, dropping spacing compliance from <2% → ~70%.

Batch by property: `padding` first (largest cluster), then `margin`, then `gap`. Each batch = one commit. `npx tsc --noEmit && npx vitest run` after each.

### A.3 — Delete dead `components/ui/` primitives (9 files)

| File | Imports |
|---|---:|
| `components/ui/Button.tsx` | 0 |
| `components/ui/Modal.tsx` | 0 |
| `components/ui/Tooltip.tsx` | 0 |
| `components/ui/Popover.tsx` | 0 |
| `components/ui/Card.tsx` | 0 |
| `components/ui/Badge.tsx` | 0 |
| `components/ui/Spinner.tsx` | 0 |
| `components/ui/Tabs.tsx` | 0 |
| `components/ui/IconButton.tsx` | 0 |

All 9 = dead code. `git rm` plus run typecheck + tests. **Estimated impact:** removes confusion + ~300-500 hex/px sites depending on file content.

### A.4 — Inline-style `style={{}}` static keys → Emotion `css\`...\``

1864 inline `style={{}}` objects. Most contain dynamic values (drag positions, computed transforms) — **D-bucket.** A subset use static colors/sizes (e.g. `style={{ color: "#64748B", padding: 12 }}`) — these can be lifted into Emotion blocks consuming `--bd-*` tokens.

Hard to script reliably (AST-aware codemod needed, not regex). **Defer to Phase 4** as manual passes, not Phase 3.

---

## Bucket B — Manual judgment (file-by-file)

### B.1 — Box-shadow tokenization

`--bd-shadow-*` consumed only 8 times. Inline `box-shadow:` definitions need cataloging. Each shadow has to be matched to one of: `xs / sm / md / lg / xl / modal / dropdown`. Not always 1:1 — some shadows in code are bespoke and need a judgment call:

- "Add to canonical" if the shadow recurs across the app
- "Replace with closest match" if it's near a canonical value
- "Mark as decorative violation" if it's invented (likely AI-slop)

**Estimated effort:** ~50-100 sites. ~30 min review.

### B.2 — Legacy `Canvas.css` purple → boxmodel tokens (10 sites)

`components/Canvas/Canvas.css` defines + uses `--buildrick-accent-purple-{05,30,45,50,60,08}` for box-model overlays. Memory note (2026-04-20 remediation): canonical replaces these with `--buildrick-boxmodel-{content,padding,margin}` (slate / green / orange).

Not a 1:1 substitution. Each purple alpha needs to map to an existing canonical or get a new token. Hand-pick + commit per overlay class.

### B.3 — `2px solid` border → `1px` (135 sites)

Top files:
- `components/Panels/LeftSidebar/LeftSidebar.css` (13)
- `components/Canvas/Canvas.css` (12)
- `editor/canvas/Canvas.css` (10)
- `editor/sidebar/tabs/build/BuildTab.css` (7)
- `editor/canvas/overlays/DropFeedbackOverlay.tsx` (6)

DESIGN.md: 1px universal, 2px allowed only under `prefers-contrast: high`. Most 2px borders are selection rings or drop overlays — visual emphasis. Decision needed per case:
- Selection / focus indicators → swap to `box-shadow: 0 0 0 3px var(--bd-accent-tint)` (canonical focus pattern)
- Decorative emphasis → swap to `1px` + accent border color
- Genuine accessibility need → wrap in `@media (prefers-contrast: high)`

### B.4 — Decorative gradients (~30 sites in chrome)

Total 161 gradients but most legit:
- `templatesData.ts` (19), `TemplateLibrary.tsx` (15), `BuildTab.css` (3 chrome / 17 fixture) — D bucket (user-content templates)
- `gradientParser.ts` (6), `GradientPicker.tsx` (5), `ColorSwatch.tsx` (4) — D bucket (gradient picker tool)
- `inspector/styles/inspector.css:98` — 180deg subtle elevation gradient on inspector header. **Real chrome violation.** DESIGN.md: zero decorative gradients in chrome.
- `LeftSidebar.css` skeleton shimmer pattern (lines 1183-1214) — common skeleton UX, may be acceptable
- `Canvas.css` (5 sites) — needs read

**Estimated chrome leakage:** ~10-30 real violations. Spot-pass per file.

### B.5 — `styles/tokens/canvas.tokens.ts` (21 hex + 22 px)

File NAME implies token references but file BODY uses literal hex/px. Refactor to import from `themes/design-system/*.css` via `getComputedStyle` lookup OR convert to a manifest module that re-exports canonical token names.

**Decision required:** convert in place vs delete + redirect callers to canonical CSS.

### B.6 — `shared/constants/{canvas.ts, defaultStyles.ts, uiStyles.ts}` (130 hex + 81 px combined)

Defines defaults for elements / blocks. Many hex values are intentional (default user-content colors). Spot-check each value:
- Block default background / text color → user-content default → leave OR use `--buildrick-design-*` tokens (user-website family).
- Spacing constants → migrate to `--bd-space-*` numeric values (TS) via a token-resolver utility.

### B.7 — Tailwind classes in editor (19 sites)

CLAUDE.md ban: editor uses Emotion only, no Tailwind. 19 `className="bg-* text-* p-*"` sites violate the rule. `shared/ui/DesignSystem/index.tsx:303-307` is the largest cluster (Tailwind gradient with banned `purple-600`).

Two paths:
1. **Delete or rewrite** the `shared/ui/DesignSystem/` folder if it's a stale demo / preview component.
2. **Convert** Tailwind to Emotion + tokens.

Read the file before deciding.

---

## Bucket C — Banned (ESLint rule promotion, no file edits)

Memory baseline 2026-04-20: hex gate WARN, ESLint WARN. Phase 5 was to flip these. But Phase 2 can pre-list which rules to promote:

| Rule | Current | Target | Scope |
|---|---|---|---|
| `no-raw-hex` | WARN (1498 baseline) | ERROR for `editor/`, `features/`. Keep WARN for `components/`, `blocks/`, `templates/` (legacy + user-content). | new code in new folders |
| `no-banned-color` (purple/violet/indigo/fuchsia) | not enforced | ERROR everywhere except `colorTypes.ts`, `devLogger.ts`, `templates*`, `colorPicker*` | universal |
| `no-banned-font` (Arial/Helvetica/Roboto/Times) | not enforced | ERROR everywhere except `FontManager.ts`, `MediaManager.ts`, `SelectFontField.tsx`, `TemplatePreview.tsx`, `TypeTokenList.tsx` font picker UI | font-family declarations only |
| `no-decorative-gradient` | not enforced | WARN initially → ERROR for `editor/` after Phase 4 | chrome only (allowlist `templatesData.ts`, `TemplateLibrary.tsx`, `gradientParser.ts`, `GradientPicker.tsx`, `ColorSwatch.tsx`) |
| `no-2px-border-outside-contrast` | not enforced | WARN | universal |
| `no-tailwind-class` | not enforced | ERROR | `editor/` only (CLAUDE.md rule) |
| `no-inline-style-static` | not enforced | WARN | flag inline `style={{}}` with literal values, ignore computed |
| `gate-hex-count-monotonic` | gate exists at WARN | flip to ERROR after Phase 3 codemod drops baseline | CI |

No file edits in this bucket. Just ESLint config + CI gate config changes. Defer to Phase 5.

---

## Bucket D — Out of scope (~270 hex + ~30 banned-color + ~12 banned-font sites)

Files / patterns confirmed legit. Add to allowlist for grep gate + ESLint disable directives:

| File | Why legit | Hex sites |
|---|---|---:|
| `shared/utils/parsers/colorTypes.ts` | CSS color name → hex lookup table (W3C spec) | 148 |
| `editor/sidebar/tabs/templates/templatesData.ts` | template HTML fixtures (user-content) | 20 |
| `templates/TemplateLibrary.tsx` | template fixtures | 22 |
| `templates/SectionTemplates.tsx` | template fixtures | 11 |
| `engine/fonts/FontManager.ts` | user-website font registry (must list Arial/Helvetica/Roboto for user choice) | 0 (font names only) |
| `engine/media/MediaManager.ts` | user-website font registry | 0 |
| `shared/forms/SelectFontField.tsx` | font picker UI lists banned fonts as user options | 0 |
| `shared/forms/ColorField.tsx` | color picker default palette | 13 |
| `shared/forms/GradientPicker.tsx` | gradient editor tool | 0 |
| `shared/utils/parsers/gradientParser.ts` | gradient parser tool | 0 |
| `shared/utils/devLogger.ts` | dev console color coding | ~5 |
| `shared/types/{canvas,media,media-image-editor}.ts` | type doc comments referencing color theory | 0 |
| `templates/TemplatePreview.tsx` | system font stack in iframe preview | 0 |
| `shared/ui/ColorSwatch.tsx` | swatch tool | ~4 |

**Total D-bucket hex sites:** ~270. Subtract from 1347 consumer count → **true chrome violations: ~1077**.

---

## Phase 3 Codemod Execution Plan

Bucketed Phase 3 batches with checkpoint commits to `main` (per solo workflow):

### Batch 3.1: Delete dead primitives (5 min)
```
git rm packages/editor/src/components/ui/{Button,Modal,Tooltip,Popover,Card,Badge,Spinner,Tabs,IconButton}.tsx
npx tsc --noEmit && npx vitest run
git commit -m "chore(ds): remove 9 dead primitives in components/ui (zero consumers)"
```

### Batch 3.2: Hex codemod, top 5 values (~261 sites, ~10 min)
- `#FFFFFF` → `var(--bd-bg-card)` (86)
- `#E2E8F0` → `var(--bd-border)` (69)
- `#64748B` → `var(--bd-fg-secondary)` (55)
- `#94A3B8` → `var(--bd-fg-muted)` (46)
- `#F8FAFC` → `var(--bd-bg-panel)` (39) — wait, this is `#F8FAFC` 39 sites
- ... actually skip `#F8FAFC` to batch 3.3, use `#2D6DFF` 33 here

Adjusted top 5 by impact: `#FFFFFF` 86 + `#E2E8F0` 69 + `#64748B` 55 + `#94A3B8` 46 + `#F8FAFC` 39 = **295 sites**.

```
sed -E 's/#FFFFFF\b/var(--bd-bg-card)/g' (scoped)
... per-token sed pass with file allowlist
npx tsc --noEmit && npx vitest run
git commit -m "chore(ds): codemod 5 canonical hex → bd-* tokens (295 sites)"
```

Caveat: hex appearing inside `box-shadow` or `rgba()` strings should NOT be touched. Need pre-filter regex.

### Batch 3.3: Hex codemod, remaining 10 canonical values (~108 sites)

`#F1F5F9` 32, `#2D6DFF` 33, `#334155` 16, `#CBD5E1` 12, `#DC2626` 10, `#0F172A` 2, `#D97706` 2, `#16A34A` 1 + lowercase variants. ~108 sites.

```
git commit -m "chore(ds): codemod 10 canonical hex → bd-* tokens (108 sites)"
```

After 3.2 + 3.3: hex baseline 1498 → ~1095. **−27%.**

### Batch 3.4: Spacing codemod — `padding`/`margin`/`gap` only (~800-1000 sites)

Property-scoped regex per-value. Skip transforms / dimensions / radius / shadow.

Per-value batches:
- `8px` in spacing properties → `var(--bd-space-2)` (largest cluster)
- `12px` → `var(--bd-space-3)`
- `16px` → `var(--bd-space-4)`
- `4px` → `var(--bd-space-1)`
- `20`, `24`, `32`, `40`, `48` → `--bd-space-{5,6,8,10,12}`

Tests + visual smoke at 5050 between batches.

```
git commit -m "chore(ds): codemod 4-pt grid px in padding/margin/gap → --bd-space-* (~900 sites)"
```

### Batch 3.5: Legacy .css hex sweep (4 files)

- `components/Panels/LeftSidebar/LeftSidebar.css` (83 hex)
- `components/Canvas/Canvas.css` (53 hex, includes purple legacy)
- `editor/sidebar/tabs/templates/TemplatesTab.css` (96 hex)
- `editor/sidebar/tabs/build/BuildTab.css` (72 hex)

These need manual review per-file. Many hex are inside `box-shadow`, gradients, or rgba() expressions. Manual edit, not codemod. **B-bucket actually**, defer to Phase 4.

---

## Estimated Phase 3 Outcome

| Metric | Today | After Phase 3 (codemod only) | Delta |
|---|---:|---:|---:|
| Hex consumer sites | 1347 | ~1095 | −403 |
| Hex baseline (incl themes/project) | 1498 | ~1095 | −403 |
| `--bd-space-*` consumption | 14 | ~900 | +900 |
| Inline 4-pt px (spacing only) | ~900-1000 (filtered) | ~50 (residual) | −850 |
| Dead component primitives | 9 | 0 | −9 |
| ESLint warnings | 931 | ~600-700 (estimate) | −230 |

After Phase 3:
- Color compliance: ~79% → ~89%
- Spacing compliance: <2% → ~70%

Phase 4 (manual B-bucket): legacy .css sweep + shadow tokenization + 2px borders + Tailwind cleanup. ~2-3 hrs.
Phase 5 (lockdown): ESLint promotion + gate flip to ERROR. ~15 min.

---

## Inconsistencies / Decisions Needed Before Phase 3

1. **`#FFFFFF` is ambiguous.** Used as card bg (86 sites should be `--bd-bg-card`) AND as text-on-accent (a few sites should be `--bd-fg-on-accent`). Codemod can't disambiguate without context. Decision: default to `--bd-bg-card` and accept ~5-10 manual fixups in B.4 pass, OR run AST-aware codemod that reads the CSS property.
2. **`shared/ui/DesignSystem/index.tsx` Tailwind usage.** Read this file to decide: is it a stale preview / demo to delete, or a real DS UI to convert?
3. **`styles/tokens/canvas.tokens.ts`** — keep as token bridge module (refactor to import canonical) or delete (callers re-import canonical CSS directly)?
4. **Banned `--buildrick-accent-purple-*` tokens in `components/Canvas/Canvas.css`** — these are LEGACY token aliases the file defines locally. Memory says canonical replaced these with `boxmodel-*`. Need to confirm: are any other files importing `--buildrick-accent-purple-*`, or is `Canvas.css` the only definer-and-consumer?
5. **`components/` folder modernization scope.** CLAUDE.md says "no new code in components/." Migration plan should NOT modernize legacy `components/` aggressively — just hex/px codemod in place. Don't refactor architecture. Confirm.

---

## Decision: Phase 3 Approval Needed

Phase 3 = codemod execution. Will modify code. Commits to `main` directly per solo workflow.

Three sub-options:

**A) Run all of Phase 3 (Batches 3.1 + 3.2 + 3.3 + 3.4) in sequence.** ~30-45 min. Dead primitives gone, ~400 hex + ~900 spacing migrated. Tests + typecheck between batches.

**B) Run only Batch 3.1 (delete 9 dead primitives).** Safest, smallest change. ~5 min. Validates pipeline before committing to bigger batches.

**C) Pause and answer the 5 decisions above first.** Then proceed.

Recommendation: **B first** (proves pipeline + nothing regresses), then **A** for the rest after a smoke check at port 5050. If anything regresses, back out single batch via `git revert`.
