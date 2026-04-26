# Vibcoder Phase 0 POC — Findings

**Date:** 2026-04-26
**POC component:** atoms/button (vibcoder source: `docs/reference/vibcoder/components/atoms/button.css`)
**Outcome:** PASS-with-tuning — pipeline works end-to-end, but Phase A surfaced 5 plan defects + 1 component-shape defect. All fixed in flight.

## Pipeline observations

- Codemod 1 rewrites: 1 file (button.css transformed `bdr-btn` → `bd-btn` + variants)
- Codemod 2 rewrites: 0 files (button.css uses canonical `--buildrick-*` tokens, NOT vibcoder-shape `--buildrick-color-*`. Seed fold table not exercised.)
- Codemod 3 alias count: 32 (button.css consumes 32 distinct `var(--buildrick-*)` tokens)
- All gates PASS after fixes (Gate 19 + Gate 21 + check-vibcoder-port + Gate 15 widening)
- Bundle pin stable: digest `e4741a24e0a1…` (144 files in source bundle)

## Phase A defects surfaced + fixed in flight (commit 0f3c62e)

1. **Gate 15 (`--bd-*` SSOT) didn't account for `_aliases.generated.css`** — codemod 3 generates this file but the SSOT gate only allowed `bd-aliases.css`. Widened to allow both canonical files.

2. **Gate 19 (`bdr-*` leak detection) false-positived on CSS doc comments** — vendored button.css has comment `/* renamed from bdr-button via codemod 1 */`. Gate 19's grep matched the comment text. Fixed by excluding CSS comment lines (`grep -vE ':[[:space:]]*/?\*|//'`).

3. **`check-vibcoder-port.sh` assumed filename = classname** — vibcoder convention uses short forms (`button.css` defines `.bd-btn`, not `.bd-button`). Rewrote to extract actual classname from CSS file rather than derive from filename. Also tries both `bd-*` (post-codemod) and `bdr-*` (manifest source) when matching against COMPONENTS.md.

## Component-shape defect (vendor-side)

4. **Plan 2 spec used stale class strings** — written before vendoring revealed actual classnames. Plan said `.bd-button`, `bd-button--primary`. Actual: `.bd-btn`, `bd-btn--primary`. Tasks 3-6 (wrapper, tests, gallery sides) all corrected at implementation time. Plan should be patched in a future revision.

5. **Plan 2 wrapper variant count was incomplete** — plan listed 3 variants (primary/secondary/ghost). Actual CSS defines 5 (added `danger` + `publish`). Plus `bd-btn--busy` state modifier. Wrapper was extended to cover full surface.

## Vite preview wiring

6. **No Vite config change needed for dev mode** — gallery serves at `/src/preview/vibcoder-button.html` directly. T7 verified via curl. T8 implementer over-corrected with `root: "."` + `rollupOptions.input` change; reverted. Phase 6 production build may need `rollupOptions.input` extension if vibcoder gallery is included in dist (but dev mode doesn't).

## Visual diff

| Check | Status | Notes |
|---|---|---|
| Gallery HTML serves 200 | PASS | T8 functional verification |
| All 3 CSS files load | PASS | default.css → _aliases.generated.css → button.css cascade |
| React .tsx transforms | PASS | Vite emits createRoot + Button import |
| HTML side button class counts | PASS | 5 variants × expected counts present |
| Pixel-identity HTML vs React | DEFERRED | Manual human eyes OR Phase 6 automated regression |

## Tuning needed for Phase 1

- [ ] **codemod 2 fold table extension** — button atom didn't exercise it because button uses canonical token names. As Phase 1 fans out to 25 more atoms, monitor for atoms that DO use `--buildrick-color-*` shapes. Extend TOKEN_FOLDS map per atom that surfaces them.
- [ ] **Plan 2 patch (filename vs classname)** — patch the plan's Tasks 3-6 to use `bd-btn`-shape examples + acknowledge filename ≠ classname as a vibcoder convention.
- [ ] **Plan 2 patch (variant count)** — patch Task 3 spec to direct implementer to read actual CSS modifiers rather than rely on placeholder variant list.
- [ ] **Variants discovery script** — Phase 1 might benefit from a tiny helper that prints all `^\.bd-X--` modifier classes from a vendored CSS file, so wrappers can be exhaustive without manual inspection.

## Per-component port template (locked from POC)

For each future atom/molecule/organism port:

1. `cp docs/reference/vibcoder/components/<tier>/<name>.css packages/editor/src/themes/components/<tier>/<name>.css`
2. `npm run vibcoder:vendor` (auto-runs pin + 3 codemods)
3. Verify gates: `bash packages/editor/scripts/ds-grep-gates.sh && bash packages/editor/scripts/check-vibcoder-port.sh`
4. Inspect actual classname + modifiers:
   - `grep -E '^\.bd-' packages/editor/src/themes/components/<tier>/<name>.css | head -20`
5. Write wrapper at `packages/editor/src/editor/shared/vibcoder/<Name>.tsx`:
   - `ButtonProps`-style interface extending the right HTMLAttributes
   - Type unions for variant + size pulled directly from the CSS modifier inspection
   - Pure prop → className mapping. No state, no logic.
6. Write tests at `packages/editor/src/editor/shared/vibcoder/<Name>.test.tsx`:
   - Default variant + size emits expected classes
   - All variant strings emit `bd-<name>--<variant>`
   - All size strings emit `bd-<name>--<size>`
   - Caller `className` merges in
   - Event forwarding (onClick, etc.)
   - Any state modifier props (busy, loading, etc.)
7. Add gallery entry pair: `packages/editor/src/preview/vibcoder-<name>.html` + `vibcoder-<name>.tsx` (mirror button POC structure)
8. (Manual) visual diff in browser. Capture screenshots for findings if pixel-imperfect.
9. Commit per-component (one PR per batch of N components per Phase 1 dispatching cadence — see roadmap).

## Cost analysis (POC arc)

- Plan 1 (15 tasks): 21 commits (15 task commits + 4 fix commits + 2 plan corrections)
- Plan 2 (so far, Tasks 1-8): 8 commits (1 vendored output + 1 infrastructure-fix from T1, plus T2-T6 wrappers/tests/gallery, T7+T8 no-commit)
- Subagent dispatches per task (avg): ~3 (implementer + spec reviewer + code-quality reviewer) — minus skipped reviews on trivial tasks
- Defect rate Plan 1: ~50% first-pass (review caught 5 substantive issues)
- Defect rate Plan 2: ~25% first-pass (mostly stale-spec mismatches caught by implementer using actual CSS)

## Recommendation

**Proceed to Phase 1.** Phase 0 POC validated the pipeline + surfaced infrastructure defects + locked the per-component template. Atoms fan-out (25 more) is unblocked.

The single remaining unknown is **visual identity** between HTML and React renders — this requires either (a) human verification of the button POC gallery, or (b) Phase 6 automated visual regression. Recommend the user open `http://localhost:5050/src/preview/vibcoder-button.html` and eye-check before Phase 1 dispatches.

---

## Phase 1 — Atoms findings (M3 milestone)

**Date:** 2026-04-26
**Scope:** 23 atoms (tag catch-up + 5 batches × 3-5 primitives) + 1 reused (button)
**Outcome:** PASS-with-tuning — all 23 atoms ported, 4 polish items folded into M3 commit, 2 follow-ups still open (#77 sprite production-build, #81 grip.css upstream forward-fix).

### Per-batch summary

| Batch | Primitives | Canary result | Visual diff result | Gates |
|---|---|---|---|---|
| 0 | tag | PASS | gallery serves; manual eyeball deferred to M3 sweep | PASS |
| 1 | input, select, textarea, checkbox, switch | PASS | PASS | PASS |
| 2 | icon, avatar, badge, count, thumb | PASS | PASS (icon sprite mounts in dev via Vite — production build deferred to chrome integration phase) | PASS |
| 3 | icon-button, slider, link | PASS-with-tuning | PASS | PASS (review fixup ff55f0b: gallery cleanup + Slider clamping) |
| 4 | progress, skeleton, spinner, helper-text | PASS-with-tuning | PASS | PASS (follow-up 9bf17cd: Progress NaN guard + indeterminate __pct omit) |
| 5 | breakpoint-switcher, divider, grip, label, kbd | PASS-with-tuning | PASS | PASS-with-Gate-19-widening (codemod 1 keeps `--bdr-` custom property prefix by design) + grip.css comment-prefix snapshot fix |

### Polish pass folded into M3

Four follow-ups bundled into the milestone commit alongside the gallery index + findings:

1. **Label gallery `field` shadow** (Batch 5 M1) — local `field` const in `vibcoder-label.tsx` (and `vibcoder-helper-text.tsx`) shadowed `_galleryStyles.field` (different shape: column-flex vs block+maxWidth). Renamed to `formRow` in both files. No other gallery has this shadow.
2. **Label `info={{}}` discriminator test** (Batch 5 M3) — added test asserting truthy empty-object collapses to `info={true}` behavior (default `aria-label="More info"`, no onClick, button rendered, click is no-op). Closes the `info?: boolean | LabelInfoProps` discriminator coverage matrix.
3. **Slider NaN/Infinity guard parity** (#80) — applied the same `Number.isFinite(value) ? value : min` guard that Progress.tsx received. Falls back to `min` (not 0) because Slider has arbitrary min/max range. `safeValue` is also forwarded to the native input + head-row label so `aria-valuenow` and visible value text reflect the safe number. 3 new tests cover NaN, +Infinity, -Infinity.
4. **Variants script STATE_TOKENS** (#71) — added `selectable`, `pressed`, `pulse` to `STATE_TOKENS` Set in `vibcoder-variants.mjs`. All three are confirmed used as state props in shipped wrappers (Tag, IconButton, StatusDot via Spinner.tsx). After fix, `bun packages/editor/scripts/vibcoder-variants.mjs atoms/tag` correctly groups `selectable` under `states:` instead of `variants:`.

Test count delta: 229 → 233 (+1 Label discriminator + 3 Slider NaN/Infinity).

### New tuning needed for Phase 2

(Carve-outs Phase 2 must address before molecules start.)

- [ ] **#77 — Icon sprite production-build resolution.** Dev server (`<use href="...">`) resolves the SVG sprite via Vite's URL transform. Production build path needs verification: does Vite emit the sprite to `dist/` and rewrite the `<use>` href? Phase 6 chrome integration must surface this before Icon ships into shipped chrome.
- [ ] **#82 — Vendoring fix-policy doc.** Interim 2-paragraph version captured below; full doc deferred to Phase 2 prep so the policy can absorb molecule-tier real-world cases.
- [ ] **#73 — Codemod 2 fold-table extension.** No Phase 1 atom triggered the fold table (all 23 atoms used canonical `--buildrick-*` token names). Defer until a Phase 2 molecule actually surfaces a `--buildrick-color-*`-shape token.
- [ ] **#72 — Gallery convention sweep / lint rule.** Polish #1 fixed the two gallery files with `field` shadow. A small ESLint rule could prevent future shadows of `_galleryStyles` exports. Defer to Phase 2 prep.
- [ ] **#74-#76 — Switch button-reset, preventDefault, Thumb discriminated union.** Chrome consumer prep. Defer until chrome consumes the wrappers and surfaces actual interaction needs.
- [ ] **#79 — Gate 7 negative test.** Defer to Phase 2 prep.
- [ ] **#81 — grip.css forward-upstream fix.** Open. Documented as a known transparency hole below. Vibcoder bundle ships a malformed CSS comment continuation in grip.css that Gate 19's existing exclusion couldn't handle cleanly. Local snapshot fixed; upstream fix should land before the next vibcoder bundle pin bump.

### Conventions reaffirmed (still hold after 23 atom ports + 2 sibling exports)

- Filename != classname (verified 25× — Spinner ships StatusDot, Kbd ships KbdSeq as siblings)
- Default-prop-value omits modifier class (verified 25×)
- forwardRef on focusable elements (verified — every form atom + every interactive atom + every measurement-consumer atom)
- State props pair with aria-* (verified — `busy`, `pressed`, `pulse`, `selectable`)
- Variants helper as ground truth (zero drift incidents when followed; the heuristic miss for `selectable` was caught and folded back into the script in this milestone)

### Per-batch CC time (actuals from commit timestamps)

| Batch | Estimate | Actual | Notes |
|---|---|---|---|
| 0 (Tag catch-up) | n/a (added) | ~30 min | One atom; roadmap mis-claim correction |
| 1 (form, 5 atoms) | ~3 hr | ~47 min | input/select/textarea/checkbox/switch |
| 2 (display, 5 atoms) | ~3 hr | ~33 min | avatar/badge/count/thumb/icon — icon sprite added complexity but flowed through Vite cleanly |
| 3 (interactive, 3 atoms) | ~3 hr | ~57 min + ~11 min review fixup | icon-button/slider/link; ff55f0b cleaned gallery + Slider clamping |
| 4 (status, 4 atoms) | ~3 hr | ~19 min + ~15 min Progress NaN fix | progress/skeleton/spinner/helper-text |
| 5 (structural, 5 atoms) | ~3 hr | ~25 min | breakpoint-switcher/divider/grip/label/kbd; grip.css snapshot fix + Gate 19 widening for `--bdr-` custom property prefix |

Total Phase 1 atom port: roughly 4 hr including review fixups vs ~15 hr roadmap estimate. Subagent-driven dispatch + per-component template (locked from POC) drove the speedup.

### Vendoring fix-policy decision (interim)

Two distinct fix-policy decisions surfaced during Phase 1:

**Batch 4 widened Gate 19 for `--bdr-` custom property prefix.** Codemod 1 intentionally preserves `--bdr-*` custom-property prefixes (vibcoder shipped tokens with this naming and the codemod design treats CSS custom-property names as part of the API contract — renaming them would silently break consumers reading those properties). Gate 19 was widened to allow `--bdr-` defs in vendored CSS. The right move: widen the gate when the codemod design intentionally permits the pattern.

**Batch 5 fixed the local snapshot for grip.css comment continuation.** Vibcoder upstream ships grip.css with a malformed CSS comment continuation that triggers Gate 19's `bdr-*` regex on a comment-line token. Gate 19's existing CSS-comment exclusion (`grep -vE ':[[:space:]]*/?\*|//'`) couldn't handle the multi-line continuation cleanly. Fixed locally in the vendored output (transient bundle artifact). The right move: fix the source when forward-upstream is feasible AND the issue is a transient artifact, not part of an API contract.

**Interim rule:** fix source when forward-upstream is feasible AND the issue is a transient bundle artifact; widen the gate when codemod design intentionally permits the pattern (e.g., custom-property API contract). Full policy doc (#82) folded back into Phase 2 prep so molecule-tier cases can refine the rule.

### Recommendation

**Proceed to Phase 2 molecules.** The atom alphabet is complete (24/24 ported, all gates green, 233 tests passing, type-check clean against 188-error baseline). The per-component template held across 23 atoms with zero structural rework. Two follow-ups are open but neither blocks molecule fan-out:

- #77 (Icon sprite production resolution) blocks chrome integration phase, not Phase 2.
- #81 (grip.css upstream fix) is documentation-only; local snapshot is correct.

Master gallery index lives at `packages/editor/src/preview/vibcoder-index.html` for visual review.
