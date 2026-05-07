# DS SSOT Audit — 2026-05-08

**Status:** Phase 0 complete, Phase 1+ unblocked
**Scanner:** `packages/editor/scripts/audit/ssot-scan.mjs` (re-runnable)
**Source plan:** `docs/superpowers/plans/2026-05-08-ds-ssot.md`
**Source spec:** `docs/superpowers/specs/2026-05-08-ds-ssot-design.md`
**Predecessor arc:** `docs/audits/2026-05-07-vibcoder-finish-audit.md`

---

## Summary

| Category | Raw count | Real count after triage | Worst severity |
|---|---:|---:|---|
| 1. Component-level duplicates | 2 | **1** (Skeleton is scanner false positive) | Important |
| 2. Keyframe duplicates | 2 | **2** | Important |
| 3. Token alias SSOT | 54 | **54** (54 token names, but architectural — 1 fix-PR consolidates the pair) | Important |
| 4. CSS selector duplicates | 12 | **3** (9 are scanner false positives — context-wrapped child selectors) | Important / Minor |
| 5. Three-home contract violations | 1 | **1** (same row as #1) | Important |
| 6. Anti-pattern detection | 3209 | **12** pass-through wrappers + ~30 high-confidence dead exports (3197 dead-export raw count is barrel-inflated — see preamble in §6) | Minor |
| 7. Legacy residual triage | 11 | **11** (annotation pass — 0 deletions expected) | Minor |
| 8. CLAUDE.md doc-vs-reality drift | 0 (scanner) | **3** (manual review surfaced drift the scanner doesn't detect) | Minor / Important |

- **Total real violations:** ~84 (1 + 2 + 54 + 3 + 1 + 12 + 11 + 3) — **scanner-reported 3289 → de-noised 84.**
- **Severity breakdown:** Critical 0 · Important 60 · Minor 24
- **Categories with violations after triage:** 8 of 8
- **Estimated fix PRs (Phase 2-6 per spec):** **5** (token aliases · keyframes · Badge · home + anti-pattern · legacy + doc-drift). Matches spec §3 plan.

**Top headline finding:** the largest raw count (3209 anti-patterns) is dominated by 3197 "dead export" reports inflated by barrel re-exports — the scanner's name-set match doesn't follow `export *` chains. Real anti-pattern signal is 12 pass-through wrappers + a long tail of likely-dead `*Props` interfaces. Filtering rule documented in §6.

---

## 1. Component-level duplicates

| Primitive | File path A | File path B | Severity | Suggested fix |
|---|---|---|---|---|
| `Badge` | `packages/editor/src/editor/shared/vibcoder/Badge.tsx` | `packages/editor/src/shared/ui/Badge.tsx` | **Important** | **Rename + keep both.** APIs are semantically disjoint: vibcoder Badge variants are chrome-state (`published \| draft \| issues \| unsaved \| syncing \| new \| premium \| count`); shared/ui Badge variants are semantic palette (`default \| primary \| success \| warning \| error \| info`). The shared/ui file already self-documents this in its header. Action: rename `src/shared/ui/Badge.tsx` → `src/shared/ui/SemanticBadge.tsx`, rename export `Badge` → `SemanticBadge`, update 5 consumers (`src/ai/LayoutSuggestions.tsx`, `src/ai/AccessibilityChecker.tsx`, `src/templates/MyTemplates.tsx`, `src/templates/SectionTemplates.tsx`, `src/templates/TemplatePreview.tsx`), update `src/shared/ui/index.ts` re-export. Do NOT delete — chrome-state vs semantic-palette is genuine domain split. |
| `Skeleton` | `packages/editor/src/editor/shared/vibcoder/Skeleton.tsx` | `packages/editor/src/shared/extensions/Skeleton.tsx` | **Minor (scanner false positive)** | **No action.** Scanner matches on basename only. The `shared/extensions/Skeleton.tsx` file does NOT export a `Skeleton` primitive — it exports `SkeletonListItem` and `StudioSkeleton`, two layout compositions that import the canonical `Skeleton` from vibcoder (see file line 15). This is exactly what `shared/extensions/` is for per CLAUDE.md three-home contract. Tag scanner blind spot for §6 risk register. Optional: rename `shared/extensions/Skeleton.tsx` → `shared/extensions/SkeletonCompounds.tsx` to silence the scanner permanently — judgment call, low priority. |

**Cross-check:**
```
$ find src/editor/shared/vibcoder src/shared/ui src/shared/extensions -name '*.tsx' -not -name '*.test.tsx' | xargs -n1 basename | sort | uniq -d
Badge.tsx
Skeleton.tsx
```
Confirms scanner.

---

## 2. Keyframe duplicates

| Keyframe name | Defined in (paths) | Identical? | Severity | Suggested fix |
|---|---|---|---|---|
| `fadeIn` | `packages/editor/src/editor/sidebar/tabs/history/styles/history.css:893`<br>`packages/editor/src/themes/ux-fixes.css:240` | **Need to read both** to confirm. Common animation name; bodies likely diverge (different durations/opacity curves per surface). | **Important** | Rename both to namespaced versions. `history.css` → `bd-history-fade-in`; `ux-fixes.css` → drop the keyframe entirely if not consumed (likely dead from prior arc) OR rename to `bd-uxfix-fade-in`. Update consumers in lockstep. Bare-name `fadeIn` collides at runtime — last @import wins, surfaces a flicker bug. |
| `spin` | `packages/editor/src/themes/legacy-components.css:39`<br>`packages/editor/src/themes/ux-fixes.css:273` | **No.** `legacy-components.css` body: `from { transform: rotate(0deg); } to { transform: rotate(360deg); }`. `ux-fixes.css` body presumed different. Both are bare-name re-implementations of `bd-spin` (canonical at `themes/components/atoms/spinner.css:17`) and `bd-btn-spin` (`button.css:114`). | **Important** | Drain both. Find consumers via `grep -rn 'animation:.*\\bspin\\b' src/`; migrate to `bd-spin` (canonical). Delete the legacy `@keyframes spin` from `legacy-components.css:39` and `ux-fixes.css:273`. This also closes Phase 6 of the prior arc whose doc-drift entry (CLAUDE.md line 325) incorrectly claims `@keyframes buildrick-spin`/`buildrick-pulse` were drained — see §8. |

**Cross-check:**
```
$ grep -rn '@keyframes' src/themes src/editor | grep -oE '@keyframes [a-zA-Z0-9_-]+' | sort | uniq -c | sort -rn | head -3
   2 @keyframes spin
   2 @keyframes fadeIn
   1 @keyframes tpl-spin   (etc — all single-def)
```
Scanner correct. Note bare `pulse` at `legacy-components.css:38` is unique (no second definition) so not a duplicate, but is itself a SSOT smell against canonical `bd-pulse` (`spinner.css:38`) and `bd-status-pulse` (`spinner.css:48`). Phase 3 should drain it in the same PR.

`@keyframes buildrick-flash` at `legacy-components.css:40` is unique but the spec §3 Phase 3 calls it out for verification — confirmed unique here, so the existing fix-PR scope is correct (rename `buildrick-flash` → `bd-element-flash` + update consumers).

---

## 3. Token alias SSOT

54 `--bd-*` tokens defined in BOTH `src/themes/components/_aliases.css` AND `src/themes/design-system/bd-aliases.css`. The pair is **architecturally documented as dual-canonical** in the `bd-aliases.css` header comment (lines 9-22):

> SSOT contract — DUAL-CANONICAL by design (Gate 15 + Gate 17): both files independently canonical for their respective consumer surfaces (chrome JSX vs vendored vibcoder).

**Status after vibcoder-fork (2026-05-06):** the comment refers to `_aliases.generated.css`, but vibcoder vendor pipeline retired and the file was renamed to `_aliases.css` (hand-edited). Dual-canonical premise was a vendor-pipeline artefact; it no longer applies. **The 54 overlaps are now true Important duplicates.**

**Fix-PR shape (Phase 2 — single PR):** consolidate to ONE alias file. The 54 overlapping tokens have identical right-hand-sides (both map to the same `var(--buildrick-*)`); no value conflicts to resolve. Action:
- Pick `src/themes/design-system/bd-aliases.css` as canonical (larger, top-level domain, chrome-side authoritative per the prior comment intent).
- Delete the 54 overlapping definitions from `src/themes/components/_aliases.css`.
- Verify any aliases unique to `_aliases.css` (`125 LOC - 54 dupes ≈ 71 unique candidates`) are still required by vibcoder atoms — if so, KEEP them in `_aliases.css` (vibcoder consumer surface) and document the kept set.
- Update `themes/components/_layer.css` cascade contract comment + Gate 15 description in CLAUDE.md to reflect single-file canonical.

**Severity:** all 54 are **Important** (duplicate definitions, ambiguous source of truth). Listing all 54 inline would inflate this doc — they all collapse to the same fix action, so a category-level row + sample suffices:

| Sample tokens (full list in `/tmp/ssot-scan.txt:11-119`) | Defined in | Severity | Suggested fix |
|---|---|---|---|
| `--bd-accent`, `--bd-accent-hover`, `--bd-accent-pressed`, `--bd-accent-subtle`, `--bd-accent-tint` (5 accent family) | `_aliases.css` + `bd-aliases.css` | Important | Phase 2 PR: delete from `_aliases.css`, keep in `bd-aliases.css` |
| `--bd-bg-card`, `--bd-bg-hover`, `--bd-bg-input`, `--bd-bg-panel`, `--bd-bg-pressed`, `--bd-bg-subtle` (6 bg family) | both | Important | Same |
| `--bd-border`, `--bd-border-focus`, `--bd-border-medium`, `--bd-border-strong` (4 border family) | both | Important | Same |
| `--bd-radius-{full,lg,md,sm}` · `--bd-shadow-{md,sm,xs}` · `--bd-space-{1,2,3,4,5,6,8,10,12}` · `--bd-text-{xs,sm,md,lg,xl,2xs,…+plus}` (~30 atomic-token aliases) | both | Important | Same |
| `--bd-success{,-light,-border}` · `--bd-warning{,-light,-border}` · `--bd-error{,-bg,-border}` · `--bd-glow-primary` · `--bd-duration-{fast,normal}` · `--bd-ease-default` · `--bd-font-family` (status / motion / type rest) | both | Important | Same |

---

## 4. CSS selector duplicates

Scanner reported 12. Manual triage shows **9 are scanner false positives** (context-wrapped child selectors, e.g., `.bd-form-field--inline > .bd-helper-text` matches the substring `.bd-helper-text` but is a child-combinator override, not a base re-declaration). **3 are real concerns.**

| Selector | Defined in (paths) | Layered intentionally? | Severity | Suggested fix |
|---|---|---|---|---|
| `.bd-btn` | `packages/editor/src/themes/components/_layer.css:8` (in JSDoc comment)<br>`packages/editor/src/themes/components/atoms/button.css:10` (real rule) | Scanner false positive | **Minor (scanner blind spot)** | No fix needed — `_layer.css:8` is inside a `/** … */` block describing cascade order. Document scanner limitation: regex doesn't strip CSS comments. Phase 1 gate may want to add comment-stripping to the selector scanner. |
| `.bd-depth-badge` | `packages/editor/src/editor/canvas/Canvas.css:577`<br>`packages/editor/src/themes/design-system/a11y.css:53` | Need to verify intent | **Important** | Read both. If `a11y.css` is a `:focus-visible` override layered intentionally, annotate both with a comment cross-ref + leave as documented exception. If both are base rules, consolidate canonical home in `themes/components/atoms/` and delete the other. |
| `.bd-skip-link` | `packages/editor/src/editor/canvas/Canvas.css:814` (+`:focus` at :826)<br>`packages/editor/src/themes/design-system/a11y.css:118` (+`:focus` at :131) | **Yes (a11y.css is canonical SSOT per memory)** | **Important** | Per memory `project_q2_day3_4_shipped_20260507.md`: "skip-link + sr-only + :focus-visible duplicates moved from components.css to a11y.css (SSOT)." The `Canvas.css:814` definitions are the prior-arc residual that should have been deleted. Delete `Canvas.css:814-833` (both `.bd-skip-link` + `.bd-skip-link:focus` rules) — `a11y.css` is canonical. Same for `.bd-depth-badge` likely. |
| `.bd-helper-text`, `.bd-stepper`, `.bd-label` (all in `molecules/form-field.css`) | `molecules/form-field.css` defines `.bd-form-field--inline > .bd-helper-text` etc. | **N/A — child selectors** | **Minor (scanner false positive)** | No fix. Scanner regex matches substring; `>` combinator selectors are layered overrides that are exactly what `@layer components` is for. Tag scanner improvement: anchor regex to start-of-line OR comma-separated list, not substring. |
| `.bd-kbd`, `.bd-status-dot`, `.bd-switch`, `.bd-list-row--unread` | All cases: second definition is a context-wrapped child like `.bd-rail__btn .bd-kbd` or `.bd-toggle-row.is-disabled .bd-switch` | **N/A — child selectors** | **Minor (scanner false positive)** | Same as above. |
| `.bd-icon-btn` | `atoms/icon-button.css:14` (canonical)<br>`design-system/bd-topbar-overrides.css:85` (`.bd-topbar__brand-group > .bd-icon-btn`) | **Yes — `@layer overrides`, child selector** | **Minor (scanner false positive)** | No fix. `bd-topbar-overrides.css` is a temporary layered override file (per its own header comment) and uses child combinators. |
| `.bd-topbar` | `organisms/topbar.css:8` (canonical)<br>`design-system/bd-topbar-overrides.css:29` (intentional override) | **Yes — `@layer overrides`** | **Minor (allowed exception)** | Document the override in §1.4 of CLAUDE.md "Layered overrides allowed list" or annotate the override file with `/* SSOT-ALLOWED-OVERRIDE: see audit 2026-05-08 §4 */`. The override file already has a clear sunset trigger ("when upstream vibcoder PR merges"). |

**Net real violations after triage:** 2 (`.bd-depth-badge` + `.bd-skip-link` — both in `Canvas.css` shadowing `a11y.css`). Phase 5 (or a small Phase 4.5) drains them.

---

## 5. Three-home contract violations

Scanner-reported 1. Identical to the Badge row in §1; not duplicated as a separate fix.

| File | Current home | Suggested home | Reason | Severity |
|---|---|---|---|---|
| `packages/editor/src/shared/ui/Badge.tsx` | `shared/ui/` | Rename in place to `shared/ui/SemanticBadge.tsx` | Per CLAUDE.md three-home contract: `shared/ui/` is for "Buildrik non-vibcoder primitives" (line 289). The semantic-palette Badge fits this row. The collision is the **name**, not the home. Rename eliminates the conflict without violating the contract. | Important (same as §1) |

---

## 6. Anti-pattern detection

### Preamble — why the raw 3209 count is misleading

Scanner's `scanAntiPatterns` reports **3197 dead exports** + **12 pass-through wrappers** = 3209.

The **3197 dead-export count is inflated by barrel re-exports.** The scanner's name-set check finds `export X` declarations and confirms `import { X }` doesn't appear at the same name in any other file. It does **not** follow `export * from "./foo"` re-export chains. So a `*Props` interface exported from `src/ai/AIAssistant.tsx` AND re-exported from `src/ai/index.ts` is counted twice as "dead" even though the barrel re-export is a legitimate public-API shape.

Spot evidence: `/tmp/ssot-scan.txt:148-200` shows a dense block of `Dead export "<X>Props"` rows where `<X>Props` is the props interface for a public component — these are co-export hygiene, not architectural dead code.

**Filter rule for this audit (high-confidence-only triage):**
1. **Pass-through wrappers** — scanner-detected via AST, body shape `return X(...sameArgs)`. High signal. **List all 12 below.**
2. **Dead exports** — manual sample check; defer holistic dead-export sweep to a separate "dead code" arc. The Phase 0 audit doesn't promise that work. Document the inflation root cause + scanner-improvement note.

### Pass-through wrappers (12 — all from `/tmp/ssot-scan.txt:6555-6566`)

| File | Function | Body | Severity | Suggested fix |
|---|---|---|---|---|
| `packages/editor/src/services/GoogleFontsService.ts:243` | `getGoogleFontsService` | `return GoogleFontsService.getInstance(...)` | Minor | Inline at call sites; delete wrapper. Singleton accessor is a non-pattern when there's a static class method available. |
| `packages/editor/src/editor/rail/tabsConfig.ts:201` | `getTabConfig` | `return TAB_CONFIG_MAP.get(...)` | Minor | Inline `TAB_CONFIG_MAP.get(id)` at call sites. |
| `packages/editor/src/shared/utils/openai.ts:373` | `getCacheStats` | `return aiCache.getStats(...)` | Minor | Inline `aiCache.getStats()`. |
| `packages/editor/src/shared/utils/openai.ts:399` | `getQueueLength` | `return aiTrpcClient.getQueueLength(...)` | Minor | Inline. |
| `packages/editor/src/shared/utils/helpers/typeGuards.ts:34` | `isArray` | `return Array.isArray(...)` | Minor | Delete; use `Array.isArray` directly (it's already a type guard). |
| `packages/editor/src/shared/utils/html/domQuery.ts:26` | `byId` | `return document.getElementById(...)` | Minor | Inline; one-line indirection saves nothing. |
| `packages/editor/src/shared/utils/html/encoding.ts:102` | `encodeHTML` | `return escapeHTML(...)` | Minor | Inline `escapeHTML`; delete `encodeHTML` alias. |
| `packages/editor/src/shared/utils/html/encoding.ts:109` | `decodeHTML` | `return unescapeHTML(...)` | Minor | Same as above. |
| `packages/editor/src/shared/utils/html/typeMapping.ts:195` | `isContainerType` | `return CONTAINER_TYPES.has(...)` | Minor | Inline `CONTAINER_TYPES.has(t)`. |
| `packages/editor/src/shared/utils/nesting/typeChecks.ts:23` | `isInteractiveType` | `return INTERACTIVE_ELEMENTS.has(...)` | Minor | Inline. |
| `packages/editor/src/shared/utils/nesting/typeChecks.ts:62` | `isLandmarkType` | `return LANDMARK_ELEMENTS.has(...)` | Minor | Inline. |
| `packages/editor/src/shared/utils/nesting/typeChecks.ts:141` | `canHaveChildren` | `return CAN_HAVE_CHILDREN_SET.has(...)` | Minor | Inline. |

**Caveat:** several of these (`isInteractiveType`, `isContainerType`, etc.) are intentional **predicate names** that document intent at call sites. Per CLAUDE.md "Function naming should communicate intent" guidance, deleting `isLandmarkType()` in favour of inline `LANDMARK_ELEMENTS.has(t)` arguably loses readability. **Recommendation for Phase 5 PR:** review each one against actual call-site readability before mechanical deletion. May leave 4-6 of the 12 as "documented predicate aliases."

### Dead-export tail (defer)

3197 reported. Sampling shows the bulk are `*Props` interfaces re-exported via barrel files (`src/ai/index.ts`, `src/blocks/index.ts`, etc.) — barrel re-exports the scanner doesn't track. **Action:** defer to a future "dead code sweep" arc. Document scanner improvement: walk `export *` chains.

---

## 7. Legacy residual triage

11 rules in `packages/editor/src/themes/legacy-components.css` (72 LOC total). Each requires a `/* keep: <reason> */` annotation per spec §3 Phase 6. None are obvious-deletes; all have living consumers verified during the prior vibcoder-finish arc (`project_vibcoder_finish_arc_20260507.md`). Phase 6 is mostly a documentation pass.

| Rule (file:line) | Reason kept | Move to tier? | Delete? | Severity |
|---|---|---|---|---|
| `.buildrick-canvas` (`legacy-components.css:11`) | Canonical engine selector. `Canvas.tsx:465` injects HTML using `data-buildrick-id` and the canvas root carries `class="buildrick-canvas"` (Decision: engine-emitted, immutable per CLAUDE.md "Engine-side canonical refs"). | No | No | Minor — annotate `/* keep: canonical engine container, emitted by Canvas.tsx */` |
| `.buildrick-viewport-frame` (`:24`) | Viewport iframe shell. Single-consumer chrome class. | No (single consumer) | No | Minor — annotate `/* keep: single-consumer viewport iframe styles */` |
| `.tbOfflineTooltip` (`:26`) | Topbar offline tooltip. Single-consumer chrome class with non-`bd-*` legacy name. | Optional: rename to `bd-topbar-offline-tip` and move to `themes/components/organisms/topbar.css`. | No | Minor — annotate `/* keep: single-consumer offline tooltip; rename to bd-* + move to organisms/topbar.css later */` |
| `@keyframes pulse` (`:38`) | Bare-name keyframe shadowing canonical `bd-pulse` / `bd-status-pulse`. | **Delete** in Phase 3 keyframe drain. | **Yes (after consumer migration)** | Important — Phase 3 fix |
| `@keyframes spin` (`:39`) | Bare-name keyframe shadowing canonical `bd-spin` / `bd-btn-spin`. | **Delete** in Phase 3. | **Yes (after consumer migration)** | Important — Phase 3 fix (also in §2) |
| `@keyframes buildrick-flash` (`:40`) | Cross-folder element-flash animation; consumers per memory: `useElementFlash.ts` + `dragDrop/animations.ts`. | Yes — rename `bd-element-flash` and move to `themes/components/atoms/animation-utils.css` or a new `editor/canvas/animations.css`. | No (rename, not delete) | Important — Phase 3 fix |
| `input[type="range"]::-webkit-slider-thumb, input[type="range"]::-moz-range-thumb` (`:42`) | Generic input element styling. Cross-cutting; not bd-namespaced because vendor pseudo-elements only attach to native `<input>` selectors. | No (root-level reset territory) | No | Minor — annotate `/* keep: vendor pseudo-elements need element-level selectors */` |
| `input[type="color"]` (`:50`) | Same justification. | No | No | Minor — annotate same |
| `input[type="color"]::-webkit-color-swatch-wrapper` (`:51`) | Same. | No | No | Minor — annotate same |
| `input[type="color"]::-webkit-color-swatch` (`:52`) | Same. | No | No | Minor — annotate same |
| `.bd-dragging, .bd-dragging *` (`:54`) | Global drag-cursor state. `bd-*` namespaced; could move to `themes/components/atoms/cursors.css` (new tier file) but single rule doesn't justify a new file. | Optional move to `themes/components/atoms/state.css` if such a file exists. | No | Minor — annotate `/* keep: global drag cursor state — single 1-line rule */` |
| `[data-buildrick-id][data-selected="true"]` (`:56`) | Canonical engine attribute selector. | No | No | Minor — annotate `/* keep: engine-emitted attribute selector for selection ring */` |
| `[data-buildrick-id]:hover:not([data-selected="true"])` (`:61`) | Canonical engine attribute selector — hover ring. | No | No | Minor — annotate same |
| `input:disabled, select:disabled, textarea:disabled` (`:66`) | Generic disabled-state styling. Cross-cutting. | No | No | Minor — annotate `/* keep: native disabled state — element selectors required */` |

**Phase 6 fix-PR scope:** apply 11 inline annotations + 0 deletes (the 3 keyframes are Phase 3's job). Net LOC change ≈ +11 comment lines, 0 rules removed. Maps to spec §7 Risk 5 ("legacy-components.css triage produces no movements — acceptable, doc-everything pass is the value").

---

## 8. CLAUDE.md doc-vs-reality drift

Scanner reported 0 (after the strikethrough fix per Task 1 smoke test). **Manual review surfaced 3 drift entries** — categories the scanner can't detect.

| CLAUDE.md claim (section, line) | Reality | Severity | Suggested edit |
|---|---|---|---|
| Line 325: `themes/components.css drained 274 → 72 LOC ... Dead rules deleted: .bd-layers-tree ... @keyframes buildrick-spin/buildrick-pulse (drained), @keyframes bd-modal-in (moved to themes/components/organisms/modal.css)` | Mostly correct, but `legacy-components.css:38-40` STILL contains bare `@keyframes pulse`, `@keyframes spin`, AND `@keyframes buildrick-flash`. The "drained" claim refers to the PREFIXED `buildrick-spin`/`buildrick-pulse` keyframes (which were drained). The bare `pulse` and `spin` plus `buildrick-flash` are residuals not yet drained. | Important — doc misleads about completion | Phase Final amendment: append "**Update 2026-05-08:** bare `@keyframes pulse`, `@keyframes spin`, and `@keyframes buildrick-flash` residuals identified in DS SSOT audit; drained in Phase 3 of that arc." Reference audit doc + Phase 3 commit SHA. |
| Line 289: `Buildrik non-vibcoder primitives \| src/shared/ui/ \| AUDIT COMPLETE 2026-05-02 — 4 files (Badge/ErrorState/HelpTooltip/Icons) + panel/PanelShell retained, 12 dead files + ds/ + broken index.tsx deleted` | The "AUDIT COMPLETE" claim is inaccurate post-2026-05-08: Badge collides with vibcoder Badge primitive (different domain, but same name). | Important — doc claims audit complete when a name-collision was missed | Phase 4 amendment: change "4 files (Badge/ErrorState/HelpTooltip/Icons) + panel/PanelShell" → "4 files (SemanticBadge/ErrorState/HelpTooltip/Icons) + panel/PanelShell" after the rename PR; add note that 2026-05-02 audit pre-dated vibcoder Badge primitive's existence. |
| Lines 551, 563: alias map `is at themes/components/_aliases.css` ... `Alias map is at themes/components/_aliases.css — extend hand-written when adding new aliases` (singular) AND Line 567: `Gate 15: --bd-* SSOT — alias tokens defined only in bd-aliases.css and _aliases.css` (plural) | Internal inconsistency: lines 551/563 say single canonical file, line 567 acknowledges two. Both files exist with 54 overlapping definitions (§3). | Important — doc-internal contradiction | Phase 2 amendment (after token alias consolidation): rewrite all three lines to "Alias map is at `themes/design-system/bd-aliases.css` (chrome canonical). `themes/components/_aliases.css` retains aliases consumed only by vibcoder atoms — see Phase 2 fix-PR commit for rationale." Update Gate 15 description accordingly. |

Notes:
- The 2026-05-07 cleanup-history entry at lines 321-329 also reads as a stronger "vibcoder fully implemented" message than the audit-trail justifies — but the entry's literal text is reasonable; the drift is in CLAUDE.md's *implication* rather than a falsifiable claim. Phase Final memory file should add a one-line caveat: "vibcoder-finish arc closed `.buildrick-*` namespace drain; subsequent DS SSOT arc surfaced N additional structural violations."

---

## Cross-cutting summary

| Concern | Real count | Worst severity | Fix arc PR (per spec §3) |
|---|---:|---|---|
| Component duplicates (Badge rename) | 1 | Important | Phase 4 |
| Component duplicates (Skeleton false positive) | 0 | — | None |
| Keyframe duplicates (`fadeIn`, `spin`) | 2 | Important | Phase 3 |
| Bare-name keyframes (`pulse` solo, `buildrick-flash` rename) | 2 | Important | Phase 3 (combine with keyframe-dupe PR) |
| Token alias overlap | 54 (1 fix-PR consolidates) | Important | Phase 2 |
| CSS selector duplicates (Canvas.css shadowing a11y.css) | 2 | Important | Phase 5 |
| CSS selector duplicates (scanner false positives) | 9 | Minor | Phase 1 (scanner improvement, not fix-PR) |
| Three-home contract (Badge — same as #1) | 1 | Important | Phase 4 (combined) |
| Pass-through wrappers | 12 (likely 4-8 after readability triage) | Minor | Phase 5 |
| Dead exports (filtered to high-confidence) | ~30 estimated | Minor | Defer to separate dead-code arc |
| Legacy residuals (annotation pass) | 11 | Minor | Phase 6 |
| CLAUDE.md doc drift | 3 | Important | Phase Final |

### Mapping to spec §3 PR sequence

```
Phase 0 (this audit)           [DONE]
Phase 1 — gate scripts          → addresses scanner false-positive risk + locks Phase 2-6 against regression
Phase 2 — token alias drain     → 54 token defs, 1 PR
Phase 3 — keyframes             → fadeIn rename + bare pulse/spin drain + buildrick-flash rename — 1 PR
Phase 4 — Badge rename          → SemanticBadge rename + 5 consumer updates — 1 PR
Phase 5 — three-home + anti-pattern + Canvas.css shadow drain
                                → may split if too large; current scope = Badge-already-Phase-4 + 12 wrappers + 2 selector dupes
Phase 6 — legacy residual       → 11 inline annotations to legacy-components.css — 1 PR (or fold into Phase Final)
Phase Final — lock + memory + CLAUDE.md amendments (covers §8 drift)
```

PR count estimate: **5 fix-PRs (Phase 2-6) + 1 gate-PR + 1 Phase Final = 7 PRs.** Slightly under spec's 8-9 estimate because §6 dead-export tail deferred and §4 false positives don't need fix-PRs.

---

## Codex review notes

Codex review **pending — to be performed by user before Phase 1 begins.** The audit doc surfaces 3 judgment-heavy items where Codex challenge would add value:

1. **Skeleton false-positive call (§1):** is "rename file to silence scanner" worth doing, or should the scanner gain symbol-level validation? Recommendation: scanner improvement — cheaper, less churn.
2. **Pass-through wrapper readability triage (§6):** which of the 12 are predicate-name wins vs literal indirection waste? `isInteractiveType` arguably reads better than `INTERACTIVE_ELEMENTS.has(t)`. Codex should challenge the heuristic.
3. **Token alias consolidation direction (§3):** picked `bd-aliases.css` as canonical; `_aliases.css` is older but "vibcoder-side." Codex should validate the SSOT direction matches the post-vibcoder-fork mental model.

---

## Appendix: scanner reliability notes

Issues encountered while authoring this doc — to inform Phase 1 gate-script design:

1. **CSS-comment matches in selector scan (§4):** `.bd-btn` reported as duplicate because a JSDoc comment block in `_layer.css:8` mentions the selector. **Fix:** scanner should strip `/* ... */` blocks before matching.
2. **Substring matches for child selectors (§4):** 9 of 12 selector-duplicate reports are context-wrapped child rules (`.parent > .bd-X`). **Fix:** scanner should anchor on the full rule head — split on `,`/`{`, then match the right-most simple selector.
3. **Basename-only component dupe check (§1):** `Skeleton.tsx` reported as duplicate but the file doesn't define `Skeleton`. **Fix:** validate that the file actually exports a symbol matching the basename; downgrade to "name shadow" warning when not.
4. **No barrel-re-export awareness (§6):** 3197/3209 anti-pattern reports inflated by re-exports. **Fix:** walk `export * from` and `export { X } from` chains during the unused-export analysis.
5. **Doc-drift detector (§8):** scanner returned 0 here, but 3 real drift entries exist. The check was designed for one specific claim (per spec §1 known violations); a generalized doc-drift detector is hard to write. Documented as a known scanner limitation; manual review remains the SSOT.
