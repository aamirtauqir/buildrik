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
