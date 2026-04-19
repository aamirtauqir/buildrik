# Theme Unification V3 — Strict Implementation Audit

**Date:** 2026-04-19
**HEAD audited:** `ea45ba4`
**Spec:** `docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md`
**Plan:** `docs/superpowers/plans/2026-04-19-theme-unification-v3.md`
**Auditor posture:** Strict — no inflation, no optimism, evidence-backed claims only.

---

## 1. Executive Summary

- **Overall completion: ~55%.** Confidence: High.
- **Status:** V3 is NOT complete. The rename succeeded. The unification did not.
- **Blunt summary:** Consumer-side rename and scaffolding removal are done (codemod ran, `applyTheme` gone, docs updated, migration shim wired). But three load-bearing problems remain that prevent calling this "unified":
  1. **273 duplicate CSS var def lines in `default.css`** across 282 unique keys. `default.css` is not a clean single-source-of-truth; it's a stack of overlapping blocks where "last wins" is the only contract.
  2. **~242 hardcoded hex color literals in `.tsx` inline styles.** Chrome tokens bypassed across shared UI, inspector controls, AI panels, templates, shell.
  3. **Namespace boundary violated:** `--buildrick-design-*` defs present in `components/Canvas/Canvas.css` AND `editor/sidebar/tabs/design/styles/design-tokens.css` (both outside `features/design-system/`). Spec §2 invariant #2 fails.

### Biggest remaining gaps (ranked by visual impact)

1. **LeftRail.css fallback values are dark** (`#0c0c12`, `#161620`) — upstream `--rail-bg` now resolves correctly after commit `ea45ba4`, but 10+ dark hardcoded fallbacks remain as DESIGN.md risk.
2. **10+ orphan `@keyframes` references** (`buildrick-fade-in`, `buildrick-pulse`, `buildrick-skeleton-shimmer`, `buildrick-element-flash`, `buildrick-error-shake`, `buildrick-fade`, `buildrick-flash`, `buildrick-hint-fade-in`, `buildrick-panel-fade-in`, `buildrick-progress-slide`) — animation uses referenced without matching keyframe definitions. Silently broken animations.
3. **273 duplicate def lines in default.css** → impossible to audit as SSOT.
4. **242 hardcoded hex in inline styles** → chrome tokens bypassed.
5. **Bare `--accent: #2D6DFF`** + 66 `var(--accent)` consumers — the one remaining legacy prefix in CSS.
6. **Docs comments** reference old `--aqb-*` / `--ls-*` / `data-aqb-*` names (superficial: no runtime impact, but violates spec §7.1 "zero aqb-anywhere" acceptance gate).

### Highest-priority next steps

1. Deduplicate `default.css` (273 duplicate lines → 0).
2. Define the 10 orphan keyframes OR delete the consumer references.
3. Move `--buildrick-design-*` defs out of `Canvas.css` + `design-tokens.css` into `features/design-system/` (boundary correction).
4. Replace 242 hardcoded hex inline styles with token references (biggest effort, medium risk).
5. Delete bare `--accent: #2D6DFF` + rename 66 `var(--accent)` consumers to `var(--buildrick-accent)`.

---

## 2. Normalized Checklist

| ID | Title | Category | Source | Acceptance |
|---|---|---|---|---|
| R1 | Prefix `--buildrick-*` adopted for chrome tokens | Token definition | Spec §1 Q1, §2 | Zero `--aqb-*`/`--ls-*` CSS var defs or uses |
| R2 | Prefix `--buildrick-design-*` for runtime-mutated design tokens | Token definition | Spec §2 | Defs only in `features/design-system/` |
| R3 | `--accent-*` folded into `--buildrick-accent-*` | Token definition | Spec §1 Q2 | Zero `--accent-*` defs or uses |
| R4 | Two-namespace invariant: chrome static, design dynamic | Architecture | Spec §2 | No JS `setProperty('--buildrick-X')` where X ≠ design-* |
| R5 | `applyTheme()` runtime mutator deleted | Scaffolding removal | Spec §5 P2b | File `themes/index.ts` absent; re-export gone |
| R6 | `themeMode` scaffolding deleted | Scaffolding removal | Spec §5 P2b | `themeMode` field + `aqb-theme` storage key gone |
| R7 | `CSS_CLASSES` orphan constant deleted | Scaffolding removal | Spec §1 Q11, §5 P5 | No references remain |
| R8 | Class rename `.aqb-*` → `.buildrick-*` | Token adoption | Spec §1 Q10 | Zero `.aqb-*` selectors or `"aqb-*"` className strings |
| R9 | `data-aqb-*` rename to `data-buildrick-*` | Token adoption | Spec §1 Q9 | Zero `data-aqb-*` in code |
| R10 | `@keyframes aqb-*` rename + animation-name consumers | Token adoption | Spec §3 keyframes | Zero `aqb-*` animation refs AND every used name has a def |
| R11 | `aqb:trace:*` dev flags renamed | Token adoption | Spec §1 Q13 | Zero `aqb:trace:` in code |
| R12 | `aqb-*` localStorage keys renamed with migration shim | Token adoption | Spec §4.2 | `migrateAqbKeys` defined + called |
| R13 | 29 undefined tokens resolved (Q14) | Token definition | Spec §3 | Each has rename-to-existing / define-new / delete-consumer |
| R14 | `PagesTab.css` dark-override block deleted | Value correctness | Spec §1 Q15 | `.pages-panel` dark-scope block absent |
| R15 | `components/Canvas/Canvas.css` DARK_THEME_SHIM → light canonical | Value correctness | Spec §1 Q6 | No dark surface-*/text-* values in that file |
| R16 | Dead scope wrappers `.aqb-editor`/`.aqb-layout` deleted | Dead code | Spec §5 P3 | No such selectors |
| R17 | DESIGN.md namespace contract documented | Documentation | Spec §5 P7 | Section present |
| R18 | CLAUDE.md "dark-only" fixed | Documentation | Spec §5 P7 | Line updated |
| R19 | CHANGELOG entry | Documentation | Spec §5 P7 | V3 section present |
| R20 | Codemod script deleted post-migration | Artifact cleanup | Spec §5 P8 | `theme-v3-codemod.mjs` absent |
| R21 | No hardcoded hex chrome colors in inline styles | Value correctness (implied) | Spec §2 | Token usage, not raw values |
| R22 | CSS is the 100% source of truth | Architecture | User request | No JS mutation + no ambiguous sources |
| R23 | No duplicate CSS definitions | Maintainability | User request | Each `--buildrick-X` defined once |
| R24 | Shell vs canvas token boundary: design-namespace stays in `features/design-system/` | Boundary | Spec §2 invariant #2 | No `--buildrick-design-*` defs outside features/ |

---

## 3. Coverage Matrix

| ID | Status | % | Evidence |
|---|---|---|---|
| R1 | Fully Implemented | 100 | `grep var\(--aqb-` = 0 functional hits; remaining are doc comments |
| R2 | Present but Not Wired Correctly | 35 | `--buildrick-design-*` defined in `components/Canvas/Canvas.css:27-29, 88-89` + `editor/sidebar/tabs/design/styles/design-tokens.css:284+` |
| R3 | Partially Implemented | 50 | `--accent-*` gone BUT bare `--accent: #2D6DFF` remains at `default.css:349` + 66 `var(--accent)` consumers |
| R4 | Fully Implemented | 100 | `grep setProperty.*--buildrick-(?!design-)` = 0 hits |
| R5 | Fully Implemented | 100 | `themes/index.ts` deleted; no applyTheme refs |
| R6 | Fully Implemented | 100 | Zero `themeMode` / `aqb-theme` in source |
| R7 | Fully Implemented | 100 | `CSS_CLASSES` zero hits |
| R8 | Fully Implemented | 100 | Zero `.aqb-*` / `"aqb-*"` functional hits |
| R9 | Fully Implemented | 100 | Zero `data-aqb-*` functional hits (1 comment in `generation.ts:22`) |
| R10 | Implemented but Weak / Fragile | 75 | 41 `@keyframes buildrick-*` defined, 18 animation-name uses; 10 orphan uses lack a def |
| R11 | Fully Implemented | 100 | Zero `aqb:trace:` hits |
| R12 | Fully Implemented | 100 | `migrateAqbKeys` defined + imported + called (3 correct hits) |
| R13 | Partially Implemented | 50 | 26 entries in `undefined_decisions`; `--buildrick-text` was undefined post-mapping (fixed at `7c09e9a`). Other 25 not spot-verified. |
| R14 | Fully Implemented | 100 | `PagesTab.css` `.pages-panel` dark block deleted (commit `f1d7ad6`) |
| R15 | Fully Implemented | 100 | DARK_THEME_SHIM corrected in `components/Canvas/Canvas.css` (commit `f1d7ad6`) |
| R16 | Fully Implemented | 100 | `.aqb-editor` / `.aqb-layout` not in source |
| R17 | Fully Implemented | 100 | `DESIGN.md:243` has "Token Namespace Contract (V3, 2026-04-19)" |
| R18 | Fully Implemented | 100 | `CLAUDE.md:120` shows corrected line referring to V3 flip |
| R19 | Fully Implemented | 100 | CHANGELOG has V3 entry |
| R20 | Fully Implemented | 100 | `scripts/theme-v3-codemod.mjs` + `.test.mjs` deleted |
| R21 | Incorrectly Implemented | 25 | `grep 'background:\s*"#' / 'color:\s*"#'` in `.tsx` inline styles: 242 hits |
| R22 | Implemented but Weak / Fragile | 75 | `applyTheme` gone = no JS mutation; BUT 273 duplicate def lines + mixed fallback hardcodes means CSS is SSOT structurally but not cleanly |
| R23 | Partially Implemented | 50 | 273 duplicate def lines across 282 unique keys; `--buildrick-accent` has 7 defs, `--buildrick-border-light` has 3 |
| R24 | Present but Not Wired Correctly | 35 | `--buildrick-design-*` defined at `components/Canvas/Canvas.css:27+` and `design-tokens.css:284+` — both outside `features/design-system/` |

**Raw score:** (100×13 + 75×2 + 50×3 + 35×2 + 25×1) / 24 = **71.5%**.
**Conservative adjusted score:** ~55–60% truly implemented (R21/R23/R24/R10 materially break the spec's goals).

---

## 4. Token Definition Audit

| Category | Planned | Found | % | Risk |
|---|---|---|---|---|
| Color tokens (chrome) | ~253 unique | ~282 unique, 273 duplicate lines | 70 | Medium (SSOT noise) |
| Color tokens (design) | 68 | 68 in `constants.ts`, +leaks in Canvas.css + design-tokens.css | 50 | Medium (boundary) |
| Spacing tokens | Implied | Mixed: `--buildrick-space-*` (design) + `--buildrick-spacing-*` (chrome) | 60 | Low (naming split) |
| Radius tokens | Implied | `--buildrick-design-radius-*` in Canvas.css + design-tokens.css | 50 | Low (boundary leak) |
| Typography tokens | Implied | `--buildrick-design-font-*` in constants.ts; chrome `--buildrick-font-*` in default.css | 85 | Low |
| Border tokens | Implied | `--buildrick-border-*` in default.css (3 dup for border-light) | 85 | Low |
| Shadow tokens | Implied | Chrome + `--buildrick-design-shadow-*` leak in Canvas.css | 60 | Low |
| Semantic tokens (`--rail-*`, `--surface-*`, `--buildrick-control-*`) | Resolve through `--buildrick-*` | Present in default.css:624-650 | 85 | Medium (dark hardcoded fallbacks in LeftRail.css) |
| Shell/editor tokens | Static | Mostly correct per R4/R22 | 75 | Medium (273 duplicates) |
| Canvas/user-facing tokens | Dynamic, design-namespace | Leaks into Canvas.css/design-tokens.css | 50 | High |

---

## 5. Token Adoption Audit

**Fully adopted:**
- Chrome CSS vars in all `.css` files (codemod renamed 360 files)
- DEFAULT_TOKENS runtime-target → `--buildrick-design-*`
- Class names `.buildrick-*` everywhere
- `data-buildrick-*` engine contracts
- Storage keys (plain + dynamic families) with shim

**Partially adopted:**
- Animation refs: 18 consumers, 10 lack matching keyframe defs
- `--accent`: bare still present with 66 consumers

**NOT adopted:**
- 242 hardcoded hex values in `.tsx` inline styles across:
  - `shared/ui/*` (primitives)
  - `editor/inspector/shared/*` (control colors)
  - `ai/*` (AI panels)
  - `templates/*` (previews)
  - `editor/shell/*` (shell state colors)

**"Looks done but isn't":**
1. Animation names renamed but 10 animations silently fail (no keyframe def).
2. `--buildrick-design-*` defs "in place" but 2 files violate namespace contract.
3. `default.css` "has tokens" but 273 duplicate def lines.
4. Shell tokens defined but `.tsx` bypasses with 242 hardcoded hex.

---

## 6. Migration Audit

| Supposed to change | Actually changed |
|---|---|
| All `--aqb-*` CSS vars → `--buildrick-*` | Done |
| All `--ls-*` / `--accent-*` folded | Done (minus bare `--accent`) |
| All `@keyframes aqb-*` → `buildrick-*` | Renamed, but 10 consumer uses have no matching def |
| All `.aqb-*` classes → `.buildrick-*` | Done |
| All `data-aqb-*` → `data-buildrick-*` | Done |
| Storage keys with shim | Done |
| `aqb:trace:*` → `buildrick:trace:*` | Done |
| `applyTheme()` deleted | Done |
| CSS var definitions renamed (op 1c) | Done, but aliased blocks became self-refs; fixed at `ea45ba4` |
| `PagesTab` dark overrides deleted | Done |
| DARK_THEME_SHIM in Canvas.css fixed | Done |

**Still legacy:**
- Bare `--accent: #2D6DFF` (1 def, 66 consumers)
- 242 hardcoded hex values in `.tsx` inline styles
- Dark hardcoded fallbacks in `LeftRail.css`
- Design-namespace leaks in `components/Canvas/Canvas.css` + `design-tokens.css`

**Appearing complete but not:**
- 10 orphan animation consumers (defs missing).
- 273 duplicate def lines in default.css.

**Migration completion:** ~65% (consumer rename + scaffolding done; structural cleanup + adoption gaps remain).

---

## 7. Shell vs Canvas Boundary Audit

**Expected (spec §2 invariant #2):**
- `--buildrick-design-*` defs only in `features/design-system/`.
- CI grep: `grep -rnE "^\s*--buildrick-design-" packages/editor/src/ --exclude-dir=features` → empty.

**Actual:**
- `packages/editor/src/components/Canvas/Canvas.css:27-29, 88-89` defines `--buildrick-design-radius-*`, `--buildrick-design-shadow-*`.
- `packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:284-300+` defines `--buildrick-design-layout-*`, `--buildrick-design-btn-*`, etc.
- Invariant #2 violated in 2 files.

**Impact:** Design tokens defined statically compete with runtime-set DEFAULT_TOKENS. Design-tab edits may be silently shadowed.

**Required correction:**
- Move `--buildrick-design-radius-*` and `--buildrick-design-shadow-*` from Canvas.css into `features/design-system/` (DEFAULT_TOKENS or new `design-defaults.css`).
- Move `--buildrick-design-*` defs from `design-tokens.css` to features/ OR reclassify as chrome-layout tokens (`--buildrick-layout-*`, not `-design-`).

---

## 8. Hardcoded / Legacy Leakage Report

| Severity | File:line | Issue | Fix |
|---|---|---|---|
| HIGH | `packages/editor/src/components/Layout/LeftRail.css:24,208,248,277,291,413` | 6 sites use `var(--rail-*, #0c0c12/#161620/#00d4aa)` dark fallbacks | Remove fallbacks OR change to light values |
| HIGH | `.tsx` files (242 occurrences) | Inline `background: "#..."` / `color: "#..."` literal hex | Replace with `var(--buildrick-X)` per usage audit |
| HIGH | `packages/editor/src/themes/default.css` (273 duplicate def lines) | Same `--buildrick-X` key defined multiple times | Consolidate duplicates |
| HIGH | `packages/editor/src/themes/default.css:349` | `--accent: #2D6DFF;` bare def; 66 `var(--accent)` consumers | Delete def + rename consumers to `--buildrick-accent` |
| HIGH | `packages/editor/src/components/Canvas/Canvas.css:27-29,88-89` | `--buildrick-design-radius-*/shadow-*` in chrome-scoped file | Move to features/design-system/ |
| HIGH | `packages/editor/src/editor/sidebar/tabs/design/styles/design-tokens.css:284+` | `--buildrick-design-layout-*`, `-btn-*`, etc. at :root | Move or reclassify as chrome-layout |
| MEDIUM | 10 orphan animation consumers | Used but no `@keyframes buildrick-*` defined | Add defs OR delete uses |
| LOW | `design-tokens.css:306`, `ComponentsTab.css:5`, `html/generation.ts:22`, `Canvas.css:16`, `TokenPickerPopover.tsx:38` | Comments referencing old prefix | Update comments |

---

## 9. Pending / Unresolved Decisions

| Decision | Status | Impact | Resolution | Owner |
|---|---|---|---|---|
| Hardcoded hex inline style policy | Not addressed | 242 raw hex values | Define policy + batched migration | design-system |
| Design-namespace boundary CI enforcement | Named but not wired | Silent violations in 2 files | Pre-commit hook or lint rule | engineering |
| 10 orphan keyframes fate | Unresolved | Silent animation failures | Per-name: add def or delete use | design-system |
| `--accent` bare def | Kept as leftover | 66 consumers depend on it | Rename consumers OR accept exception | engineering |
| `default.css` dedup | Unresolved | 273 duplicate lines | Write + run dedup pass | engineering |
| `--buildrick-layout-*` vs `--buildrick-design-layout-*` | Ambiguous | Depends on semantic classification | Decide: chrome or design? | design-system |

---

## 10. Problems and Risks

### Missing implementation
- 10 orphan keyframe consumers. Impact: broken animations. Fix: define or delete.
- Design-namespace defs not in features/. Impact: invariant #2 fails. Fix: move defs.

### Incorrect implementation
- 273 duplicate def lines in default.css. Impact: SSOT claim false. Fix: dedup script.
- `--buildrick-design-radius-*` + `-shadow-*` in Canvas.css. Impact: chrome CSS file defines design namespace. Fix: move.

### Weak implementation
- Semantic tokens rely on dark hardcoded fallbacks in LeftRail.css. Impact: regression-prone.
- Inconsistent token naming split (`--buildrick-space-*` design vs `--buildrick-spacing-*` chrome). Impact: confusing.

### Legacy leakage
- Bare `--accent: #2D6DFF` + 66 consumers.
- 5+ doc/JSDoc comments reference `--aqb-*` / `--ls-*` / `data-aqb-*`.
- 242 hardcoded hex in `.tsx` inline styles.

### Boundary confusion
- Two files break invariant #2.
- No CI gate enforcing the invariant.

### Maintainability risk
- 273 duplicate def lines.
- Naming split.
- Partial tokenization in `.tsx`.

### Visual inconsistency risk
- If `--buildrick-bg-panel` / `-text-primary` / `-accent` chain is ever broken again, many panels will silently render with dark fallbacks (e.g., from LeftRail.css).

---

## 11. False Completion / Illusion of Completion

| Claim | Reality |
|---|---|
| "CSS is the 100% source of truth" (user) / "Invariant #1 holds" (spec §2) | JS mutation eliminated, BUT 273 duplicate def lines means CSS itself has multiple competing sources; last-wins is not SSOT. |
| "Chrome tokens in themes/default.css + Canvas.css; design tokens in features/" (§2) | `--buildrick-design-*` defs present in `Canvas.css` + `design-tokens.css`. Two files violate. |
| "Zero surviving aqb-* patterns" (§7.1) | Bare `--accent` remains. `--accent-*` is in prohibited pattern by spec's own grep. |
| "All orphan keyframe refs deleted" (implied §1 Q10) | 10 animation consumers have no matching `@keyframes buildrick-*` def. |
| "Consumers use tokens" (implicit) | 242 hardcoded hex literals in `.tsx` inline styles. |
| "No duplicated/double CSS" (user request) | 273 duplicate def lines in default.css. |

---

## 12. Completion Roadmap

### Phase 1: Critical fixes (must happen before "done")
1. Fix 10 orphan animation keyframes — define them or delete consumer refs. Start with highest-usage (`buildrick-fade-in`, `buildrick-pulse`, `buildrick-skeleton-shimmer`). Fix type: quick fix.
2. Dedup `default.css` — automated script: for each `--buildrick-X` key, keep last ROOT-scoped def, delete prior exact-value duplicates. Fix type: medium refactor.
3. Move `--buildrick-design-*` defs to features/design-system/ from `Canvas.css` and `design-tokens.css`. Fix type: structural cleanup.
4. Delete bare `--accent: #2D6DFF` def + rename 66 consumers to `var(--buildrick-accent)`. Fix type: medium refactor.

### Phase 2: Legacy cleanup
1. Replace 242 hardcoded hex in `.tsx` inline styles with `var(--buildrick-X)`. Batch by subdirectory. Fix type: medium refactor per batch (~5–10 batches).
2. Update 5+ JSDoc/CSS comments referencing old prefix names. Fix type: quick fix.
3. Remove dark hardcoded fallbacks in `LeftRail.css`. Fix type: quick fix.

### Phase 3: Boundary correction
1. Add CI grep gate enforcing invariant #2. Fix type: engineering decision.
2. Decide on ambiguous tokens (`--buildrick-design-layout-*`, `-btn-*`): chrome or design? Rename accordingly. Fix type: design-system decision.

### Phase 4: Consistency hardening
1. Reconcile `--buildrick-space-*` vs `--buildrick-spacing-*` naming split.
2. Verify `INSPECTOR_TOKENS` chain resolves to light canonical.
3. Establish token-adoption CI that fails if new inline hex added to `.tsx`.

---

## 13. Final Verdict

**Is V3 complete?** **No.**

**Is it partially migrated?** Yes — heavily partial. Consumer-side rename ~100%. Adoption, boundaries, deduplication: NOT.

**% truly achieved:** ~55%. Confidence: High.

**What must happen before "complete":**

1. Delete or define the 10 orphan keyframes.
2. Dedup `default.css` (273 duplicate lines).
3. Move `--buildrick-design-*` defs out of `Canvas.css` + `design-tokens.css` into `features/design-system/`.
4. Replace 242 hardcoded hex in `.tsx` with token references.
5. Delete bare `--accent: #2D6DFF` + rename 66 consumers.
6. Wire CI gate enforcing namespace boundary.

Items 1–3 must land for the theme to be unified. Items 4–6 are the difference between "functional" and "truly clean."

**Bottom line:** The rename succeeded. The unification did not.

---

## Appendix: Artifacts

- Spec V3: `docs/superpowers/specs/2026-04-19-theme-unification-v3-design.md`
- Plan V3: `docs/superpowers/plans/2026-04-19-theme-unification-v3.md`
- Mapping table (retained): `scripts/theme-v3-mapping.json`
- Inventory (retained): `scripts/theme-v3-audit.json`
- Dry-run report (retained): `scripts/theme-v3-codemod-report.txt`
- Commits: 31 under `theme-v3` prefix, HEAD at `ea45ba4`
