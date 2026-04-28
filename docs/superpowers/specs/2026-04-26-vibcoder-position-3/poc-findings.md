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

---

## Phase 2 — Molecules findings (M4 milestone)

**Date:** 2026-04-26
**Scope:** 18 chrome molecules (list-row catch-up + 4 category batches)
**Outcome:** PASS-with-tuning — all 18 molecules ported, 2 polish items folded into M4 commit, 9 follow-ups carried forward to Phase 3.

### Per-batch summary

| Batch | Molecules | Components shipped | Tests shipped | Review fixup | Notes |
|---|---|---|---|---|---|
| T1 (catch-up) | list-row | 1 | 10 | none | slot composition canary; richest molecule first; commit `f85ccef` |
| T2 (nav/comp) | card, form-field, section-head, surface-head | 10 (Card×7 sibling exports + 3 primary) | 53 + 4 fixup | `5a1cff2` (FormField error="" lock + SectionHead NaN guard) | first cross-atom imports (FormField → Label + HelperText); commit `c721d78` |
| T3 (interactive) | actionbar, breadcrumb, chipbar, color-trigger, tabs | 15 (ActionBar×3 + Breadcrumb×4 + Chipbar×3 + Tabs×4 + ColorTrigger) | 69 + 5 fixup | `0303739` (Breadcrumb ref/prop leak + Tabs defaultPrevented + ColorTrigger value="" test) | first Contract B controlled state (color-trigger, tabs); first Contract D trigger wiring; commit `323927a` |
| T4 (notification) | popover, toast, toggle-row, tile-meta | 13 (popover.css splits into Popover×2 + Tooltip×4 + Menu×4 + Toast + ToggleRow + TileMeta) | 74 + 6 fixup | `3f2424d` (MenuItem ARIA role + lifecycle tests + role Omit + Toast tone default) | popover.css triple-split into 3 wrapper files; commit `c781719` |
| T5 (specialized) | rail-tile, search-input, toolbar, uploader | 7 (RailTile + SearchInput + Toolbar×4 + Uploader) | 70 + 7 fixup | `72819b1` (Uploader keyboard a11y + SearchInput focus preservation + cleanups) | rail-tile proves cross-molecule import (Tooltip from T4); uploader first non-trivial event handling; commit `76e06ff` |

Total components shipped: 46 React exports (vs 18 source CSS files — sibling exports + popover-split account for the multiplier).
Total Phase 2 tests: 298 new (10+57+74+80+77). Cumulative Phase 1+2: 233 → 531.

### Polish pass folded into M4

1. **#72 Gallery convention ESLint rule** — added custom rule `buildrik/no-gallery-shadow` at `packages/editor/eslint-rules/no-gallery-shadow.cjs`. Scoped to `src/preview/vibcoder-*.tsx`. Forbids module-scope declarations of `sectionLabel`, `stack`, `flexRow`, `field`, `darkSurface` — must import from `./_galleryStyles`. Error mode (not warn). Plant-and-revert verified the rule fires on a planted `const field = {}` in `vibcoder-list-row.tsx`. Phase 1's existing two shadows had already been fixed in M3 polish; Phase 2 lock prevents recurrence.
2. **#79 Gate 7 negative test** — added vitest test at `packages/editor/scripts/__tests__/ds-grep-gates.test.mjs`. Plants a fixture CSS file in `themes/design-system/` carrying `@media (prefers-reduced-motion: reduce) { … }`, runs `bash ds-grep-gates.sh`, asserts non-zero exit AND that stdout/stderr mentions `Gate 7`. Hard-coded fixture path (no shell injection surface), `existsSync` guard refuses to overwrite an existing file, `finally` block always cleans up.
3. **#73 Codemod 2 fold-table** — DEFERRED to Phase 3. Verification: `grep -E 'buildrick-color-' docs/reference/vibcoder/components/molecules/*.css` returns zero matches. No Phase 2 molecule shipped a `--buildrick-color-*` shape token in upstream source, so the seed fold table was never exercised. Defer extension until a Phase 3 organism actually surfaces a vibcoder-shape token.

### Per-batch CC time (actuals)

| Batch | Estimate (Phase 1 ratio) | Actual (incl. fixup) | Notes |
|---|---|---|---|
| T1 (catch-up) | ~30 min | ~8 min | Slot composition canary; richest molecule first; no review fixup |
| T2 (nav/comp) | ~50 min | ~9 min + ~3 min fixup | Card sibling exports + FormField cross-atom imports |
| T3 (interactive) | ~60 min | ~15 min + ~4 min fixup | First Contract B + first Contract D — judgment-call density (highest defect rate of Phase 2) |
| T4 (notification) | ~70 min | ~17 min + ~5 min fixup | popover.css triple-split into 3 wrapper files |
| T5 (specialized) | ~50 min | ~18 min + ~5 min fixup | uploader event handling + SearchInput focus preservation |

Total Phase 2 molecule port: roughly 90 minutes of CC dispatch time including review fixups. Sub-agent dispatching + locked per-component template kept defect rates flat across batches (~15-25% first-pass, all caught by code-quality reviewer before commit).

### Conventions reaffirmed (still hold after 18 molecule ports + 28 sibling exports)

- All Phase 1 conventions still hold (filename != classname, default-prop omits modifier class, forwardRef + displayName, state→aria pairing, sibling exports, Number.isFinite guards, defensive Omit<…>).
- **Slot composition contract** held across 5 molecules (form-field, surface-head, section-head, toggle-row, tile-meta + list-row canary). Slot props are typed as `ReactNode`; absence renders nothing.
- **Always-controlled state contract** held across 5 molecules (popover, tabs, toast, color-trigger, search-input). No internal state — caller owns it. Mirrors Phase 1's Switch/Checkbox controlled-only pattern.
- **Cross-atom imports proved scalable** — ~7 molecules import sibling atoms (FormField → Label + HelperText, RailTile → Tooltip, etc.). Bundle-size impact negligible because vendored CSS is layered once.
- **Cross-molecule imports proved** — RailTile imports Tooltip from T4 (first cross-batch dependency in the molecule tier). No structural rework needed.

### New tuning needed for Phase 3

(Carve-outs Phase 3 must address before organisms start.)

- [ ] **#73** — Codemod 2 fold-table extension. Re-evaluate during Phase 3 organisms; extend fold map per any `--buildrick-color-*` shape that surfaces.
- [ ] **Floating-UI integration** for Popover/Menu/Tooltip positioning (anchor + offset + flip + shift). Today's wrappers ship the surface and contract; Phase 3 organisms wire the positioning engine.
- [ ] **Toast queue manager** — Toast atom is single-instance. NotificationCenter organism scope owns the queue + ARIA-live region.
- [ ] **Tabs keyboard navigation** — arrow keys / Home / End. Ships in the Tabs organism that wraps `<Tabs>` + `<Tab>` primitives.
- [ ] **Color-picker organism** wires ColorTrigger to the actual swatch picker.
- [ ] **#90** Vendoring fix-policy upstream forwarding — the T3 source-edit fixes (chipbar + color-trigger + tile-meta + toolbar) and #81 grip.css comment fix should land upstream before next bundle pin bump.
- [ ] **#91** Gate 14 JSDoc exclusion parity with Gate 19 — Gate 19 already excludes CSS comments; Gate 14 (magic layout literals) does not, so JSDoc references to layout pixel sizes occasionally trip it.
- [ ] **#92** TileMeta lead slot — organism integration may want a first-child StatusDot composition shortcut on TileMeta. Defer until consumer surfaces the need.
- [ ] **#93** PopoverArrow Phase 3 fate — decide whether PopoverArrow stays a separate sibling export, gets folded into Popover, or moves to the floating-UI integration layer.

### Open follow-ups carrying forward to Phase 3

The full carry-forward list (M3 leftovers + new Phase 2 surface) is documented in the Phase 2 plan §Open follow-ups section. Summary: 9 items.

- #74-#76 (Switch button-reset footgun + preventDefault test + Thumb refactor) — chrome consumer prep.
- #77 (Icon sprite production-build resolution) — chrome integration phase blocker.
- #81 (grip.css upstream forward-fix) — vendoring fix-policy item.
- #82 (Vendoring fix-policy doc full version) — molecule-tier cases now available to inform the policy.
- #89 (ListRow negative ARIA test) — lock caller-owned ARIA contract.
- #90, #91, #92, #93 — see above.

### Recommendation

**Proceed to Phase 3 organisms.** Molecule alphabet complete (18 source CSS + 46 React exports, all gates green, 531 tests passing + 1 new Gate 7 negative test, type-check clean against 188-error baseline). API contracts (slot composition + always-controlled state + sibling exports + cross-atom + cross-molecule imports) held without re-write across all 18 molecules. Deferred items remain open; none block organism fan-out.

Master gallery index updated at `packages/editor/src/preview/vibcoder-index.html` with the Phase 2 section linking 20 molecule galleries (popover.css splits into popover + tooltip + menu).

---

## Phase 3 — Organisms findings (M5 milestone)

**Date:** 2026-04-27
**Scope:** 16 chrome organisms (Modal canary + T2 mega-batch of 12 + T3 composed pair) ported across 4 commits
**Outcome:** PASS-with-tuning — all 16 organisms ported, 2 polish items folded into M5 commit, 1 follow-up (#93 PopoverArrow) deferred to Phase 5 with reasoning documented below.

### Per-task summary

| Task | Organisms | Components shipped | Tests shipped | Review fixup | Notes |
|---|---|---|---|---|---|
| T1 (canary) | modal | 1 family (Modal + Trigger + Close + Header + Title + Description + Body + Footer) | 27 | folded into ed023a7 | Modal as Phase 3 canary; established Radix.Dialog wrapper template + asChild boundary (E1) + portal discipline (E3); commit `ed023a7` |
| T2 (mega-batch) | drawer, command-palette, color-picker, overlay-mount, topbar, footer, rail, left-panel, inspector, history-panel, empty-state, a11y-overlay, notification-center | ~38 React exports | ~430 | partial fold (T2 cleanup `0fc750c` dropped unused @radix-ui/react-toast) | Single mega-commit reduced subagent dispatch overhead; commit `0a95283` + cleanup `0fc750c` |
| T3 (composed) | pages-drawer, templates-drawer | 2 wrappers | 35 | `e7d242b` (T3 fix: body wrappers inherit `bd-drawer__body` so scroll/flex behavior survives composition) | First multi-organism composition (Drawer + ListRow / Drawer + Card); commit `7d745e3` + fix `e7d242b` |

**Total components shipped:** ~54 React exports across 16 organism CSS files (or 15 vendored CSS — overlay-mount is portal infrastructure with no CSS file).
**Total Phase 3 tests:** ~492 net-new (1107 → 1599 cumulative pass count from baseline + Phase 3 additions; some delta comes from incremental test additions across batches).
**Cumulative wrapper count:** 60 wrapper `.tsx` files in `packages/editor/src/editor/shared/vibcoder/` (44 pre-Phase-3 → 60 post-M5).

### Per-organism CSS↔Radix DOM alignment notes

**Overlay engine wrappers (4):**

- **Modal** (`Radix.Dialog`) — `bd-modal__overlay`, `bd-modal__panel`, `bd-modal__header/title/desc/body/footer/close`. asChild on `ModalTrigger` + `ModalClose`. Portal targeted via `useOverlayContainer()`.
- **Drawer** (`Radix.Dialog` + side variant) — same engine as Modal. Adds `side?: "left" | "right" | "bottom"` (default `"right"`) which maps to `bd-drawer--{side}`. asChild on `DrawerTrigger` + `DrawerClose`. Slide-in animation comes from vendored CSS, not Radix.
- **CommandPalette** (`cmdk`) — `bd-cmdk` namespace. Wraps `Command.Dialog` from cmdk. Sibling exports for Input/List/Empty/Group/Item. Search filter logic owned by cmdk; wrapper exposes `value`/`onValueChange` controlled-only props.
- **ColorPicker** (`react-colorful` inside `Radix.Popover`) — composite: `RadixPopover.Root` + `RadixPopover.Trigger` (asChild via `ColorPickerSwatch`) + `RadixPopover.Content` (`bd-color-picker` panel) wrapping `<HexColorPicker>` from react-colorful. Wrapper API exposes `value: string` (hex format), NOT react-colorful's internal `RgbaColor` shape. E2/E4 enforced.

**Portal infrastructure (1):**

- **OverlayMount** — single `<div id="vibcoder-overlay-root">` lazy DOM singleton. Mount once at app root. `useOverlayContainer()` returns the element for downstream Radix `Portal container=` props. Allow-listed for Gate 22 (only file allowed to reference `document.body`).

**Layout-only organisms (8):**

- **Topbar** — `bd-topbar` with `__brand/__nav/__actions` slots. Pure presentational.
- **Footer** — `bd-footer` with `__left/__center/__right` slots. Pure presentational.
- **Rail** — `bd-rail` with `__top/__main/__bottom` regions. Hosts `RailTile` (Phase 2 molecule) instances.
- **LeftPanel** — `bd-left-panel` 320px panel with `__head/__body/__foot` slot tree. Width set canonically per chrome-ssot decision (Q5).
- **Inspector** — `bd-inspector` 320px right panel. Mirror of LeftPanel structure, opposite anchor.
- **HistoryPanel** — `bd-history-panel` with `__entry` row composition.
- **EmptyState** — `bd-empty-state` with `__icon/__title/__desc/__cta` slots.
- **A11yOverlay** — `bd-a11y-overlay` debug overlay surface; toggleable focus/landmark visualization. Layout-only; consumer wires hot-key.

**Toast→panel pivot (1):**

- **NotificationCenter** — see "T2 NotificationCenter pivot" finding below for details. Implementation = layout-only sibling tree (NotificationCenter + Mark + Tabs + Tab + Body + Group + Foot), NOT a Radix.Toast queue.

**Composed organisms (2):**

- **PagesDrawer** — composes `Drawer` (right side) + `ListRow` (Phase 2 molecule). Plan-prescribed slot classes (`bd-pages-drawer__title/desc/body/group/item`) shipped as additive markers ON TOP of canonical drawer/list-row classes. T3 fix added `bd-drawer__body` co-class to body wrapper.
- **TemplatesDrawer** — composes `Drawer` (right side) + `Card` (Phase 2 molecule). Same additive-marker pattern. Same T3 fix applied to body wrapper.

### asChild boundary patterns (E1)

asChild Trigger/Close exports verified across **3 organism families**:

- `Modal` — `ModalTrigger` + `ModalClose` both accept `asChild` and forward to `RadixDialog.Trigger`/`.Close` (verified in tests).
- `Drawer` — `DrawerTrigger` + `DrawerClose` follow the same pattern.
- `ColorPicker` — `ColorPickerSwatch` accepts `asChild` and forwards to `RadixPopover.Trigger` (verified in tests).

(Note: PagesDrawer and TemplatesDrawer compose `Drawer`'s API rather than re-exposing their own asChild surface — their triggers are external/caller-owned.)

### Engine encapsulation enforcement (E2 + E4)

ESLint rule `packages/editor/eslint-rules/no-engine-public-export.cjs` shipped in T1 forbids `export … from '@radix-ui/*'` / `from 'cmdk'` / `from 'react-colorful'` patterns inside `packages/editor/src/editor/shared/vibcoder/*.tsx`. Verified:

- Zero `@radix-ui/*` types or values re-exported from `vibcoder/index.ts`.
- Zero `cmdk` types re-exported.
- Zero `react-colorful` types re-exported.
- All wrapper APIs expose vibcoder-shaped props (e.g., `ColorPicker` takes `value: string` hex, NOT `RgbaColor`).

This keeps the engine swappable: a future Phase 5 Floating-UI replacement of Radix.Popover can land without touching consumer call sites.

### Portal discipline (E3)

All 4 overlay engine wrappers (Modal, Drawer, CommandPalette, ColorPicker) call `useOverlayContainer()` and pass the returned element to Radix `Portal container={…}`. Gate 22 (grep gate added in M5 prep — see Phase 3 plan §Infrastructure) verifies that **only** `OverlayMount.tsx` references `document.body`. PASS at baseline.

### Stateful gallery harness (E5)

ESLint rule `packages/editor/eslint-rules/no-hardcoded-open-prop.cjs` shipped in T1 forbids hardcoded `open={true}` / `open={false}` JSX attributes inside `packages/editor/src/preview/vibcoder-*.tsx`. Six overlay galleries use the `<DemoTrigger>` + `useState` pattern to drive the open/close state realistically:

1. `vibcoder-modal.tsx`
2. `vibcoder-drawer.tsx`
3. `vibcoder-command-palette.tsx`
4. `vibcoder-color-picker.tsx`
5. `vibcoder-pages-drawer.tsx`
6. `vibcoder-templates-drawer.tsx`

`vibcoder-notification-center.tsx` ships an inline static demo (justified by the panel-not-queue pivot — there is no overlay state to drive). The other 9 layout-only organism galleries (topbar/footer/rail/left-panel/inspector/history-panel/empty-state/a11y-overlay) ship inline static demos because they have no overlay state.

### T2 NotificationCenter pivot finding

The plan specified `@radix-ui/react-toast` as the engine for NotificationCenter. The vendored CSS at `packages/editor/src/themes/components/organisms/notification-center.css` is a **380px-wide persistent dropdown panel** with `.bd-nc__head/__body/__group/__foot/__mark/__tabs/__tab/__foot` slots — **NOT** a transient toast queue. Implementation choice (sibling-tree layout-only) matches the actual CSS contract, not the plan's engine assumption.

`@radix-ui/react-toast` was installed at T1 (in case mega-batch needed it) and dropped at T2 cleanup commit `0fc750c` once it was confirmed unused. No production code referenced it. Bundle implication: zero (production tree-shake already excluded it).

**Lesson:** vendored CSS is the contract, not the plan's engine assumption. Read the CSS file before assuming the engine.

### T3 slot-class divergence finding

Plan prescribed slot classes following the pattern `bd-{pages,templates}-drawer__{title,desc,body,group,item,...}`. Vendored CSS for these organisms uses different slot taxonomies:

- `pages-drawer.css` ships `__tree`, `__row`, `__detail` slot names.
- `templates-drawer.css` ships `__filters`, `__chip`, `__card` slot names.

Implementer kept the plan-prescribed classnames as **additive markers** layered on top of the canonical drawer/list-row/card slot classes. Code-quality reviewer caught that the body wrappers needed `bd-drawer__body` as a co-class so scroll/flex behavior would inherit through composition. The gallery had only 4-7 children per drawer body, which masked the bug visually until it was traced and fixed. Fix shipped at `e7d242b`.

**Lesson:** when composing organism-of-organisms, the wrapping component must apply BOTH its own additive marker class AND the parent organism's slot class. Co-class composition is the rule when adding plan-prescribed markers over vendored slot taxonomies.

### Test infra additions

- **`packages/editor/src/test-setup.ts`** (NEW in T1) — polyfills `ResizeObserver` and `Element.prototype.scrollIntoView` for cmdk under jsdom. Required because cmdk uses both APIs internally during list rendering and jsdom omits them by default. Vitest config `setupFiles: ['./src/test-setup.ts']` reference shipped in same commit.

### Bundle deps added (live in `packages/editor/package.json`)

| Package | Version | Tier | Notes |
|---|---|---|---|
| `@radix-ui/react-dialog` | ^1.1.15 | Modal + Drawer engine | T1 |
| `@radix-ui/react-popover` | ^1.1.15 | ColorPicker engine | T2 |
| `@radix-ui/react-portal` | ^1.1.10 | Used by Dialog + Popover transitively | T1 |
| `@radix-ui/react-slot` | ^1.2.4 | asChild forwarding (E1) | T1 |
| `cmdk` | ^1.1.1 | CommandPalette engine | T2 |
| `react-colorful` | ^5.6.1 | ColorPicker swatch | T2 |
| ~~`@radix-ui/react-toast`~~ | — | Removed at `0fc750c` | Plan-spec engine; pivot eliminated need |

On-disk dep size (resolved via pnpm store):

- `@radix-ui/react-dialog`: 124 KB
- `@radix-ui/react-popover`: 112 KB
- `@radix-ui/react-portal`: ~25 KB (transitive; not directly measured)
- `@radix-ui/react-slot`: 60 KB
- `cmdk`: 116 KB
- `react-colorful`: 488 KB
- **Total cold disk impact: ~925 KB** across all six new direct + transitive engine deps.

### Bundle delta measurement (production `dist/`)

| Metric | Phase 2 (commit `d146bb0`) | Phase 3 (commit pre-M5, `e7d242b`) | Delta |
|---|---|---|---|
| Total `dist/` | 2.7 MB | 2.7 MB | **0 bytes** |
| Total JS bytes | 2,490,279 | 2,490,279 | **0 bytes** |
| Total CSS bytes | 273,899 | 273,899 | **0 bytes** |
| Main bundle (`index-*.js`) | 1,847.07 kB / 524.52 kB gz | 1,847.07 kB / 524.52 kB gz | 0 bytes |

**Methodology:** built both states in matching git worktree-isolated environments (`pnpm install --frozen-lockfile` + `pnpm exec vite build`), compared `dist/assets` totals.

**Why zero delta?** Vite builds production from `demo/index.html` only (`vite.config.ts` `root: "./demo"`). The vibcoder gallery files at `src/preview/vibcoder-*.tsx` are dev-server-only and never enter the production graph. The wrapper files at `src/editor/shared/vibcoder/*.tsx` are tree-shaken because chrome does NOT yet consume them — Phase 5 chrome integration will land the first production import. So the Phase 3 ship is **zero-cost to end users** until consumption begins.

**What this means for Phase 5:** the ~925 KB of new engine deps will land in production exactly once chrome starts importing wrappers. Floating-UI integration (deferred to Phase 5) is also outside today's measurement. Phase 5 will be the first time we report a non-zero `dist/` delta from this arc.

### ESLint rules shipped (Phase 3)

- `packages/editor/eslint-rules/no-engine-public-export.cjs` (T1) — E2/E4 enforcement: forbid Radix/cmdk/react-colorful re-exports from `vibcoder/*.tsx`.
- `packages/editor/eslint-rules/no-hardcoded-open-prop.cjs` (T1) — E5 enforcement: forbid hardcoded `open={true}` in overlay galleries.

### Grep gates shipped (Phase 3)

- **Gate 22** (`packages/editor/scripts/ds-grep-gates.sh`) — E3 portal discipline. Verifies only `OverlayMount.tsx` references `document.body`. PASS at baseline.

### Polish pass folded into M5

1. **#91 — Gate 14 JSDoc parity with Gate 19.** Gate 19 already excluded CSS comments via `grep -vE ':[[:space:]]*/?\*|//'`; Gate 14 (magic layout literals 28/32/36/40/44/48/56/60/240/300/320 px) did not, so JSDoc strings mentioning canonical chrome dimensions (e.g., the 280px panel reference, 48px header dimension) occasionally tripped the gate. Fixed by piping each Gate 14 grep through the same Gate 19 exclusion regex inline (NOT in `count_chrome` — other gates may want strict counting). Baseline rebased downward from 351 → 328 once false-positive comment hits were excluded. PASS at new baseline.
2. **`vibcoder-index.html` Phase 3 section** — added 15 entries + overlay-mount note (`<em>overlay-mount (no gallery — infrastructure)</em>`). Header `<p>` updated to "Phase 1+2+3 (24 atoms + 18 molecules + 16 organisms ported)".

### Phase 5 handoff items

- **#93 PopoverArrow** — **deferred to Phase 5** with reasoning. The Phase 2 task said "decide Phase 3 fate." Reality at M5: the current `PopoverArrow` is a `<span aria-hidden="true" className="bd-popover__arrow">` decorative wrapper — NOT a Radix component. The vibcoder Popover wrapper itself is hand-rolled (Phase 2), so swapping `PopoverArrow` for `RadixPopover.Arrow` would throw `Component must be inside Popover.Root` at runtime (Radix.Arrow requires Radix.Content ancestry). Phase 5 will reconcile the entire Popover surface with Radix when CommandPalette/ColorPicker patterns prove out the engine — at that point #93 has a clean home (re-export `RadixPopover.Arrow` from a Radix-based Popover). Until then, the `<span>` + CSS pseudo-element approach holds.
- **Floating-UI integration** — anchor + offset + flip + shift positioning for Popover/Tooltip/Menu. Carried forward from Phase 2.
- **Chrome integration** — the first time real chrome consumes vibcoder organisms (Phase 5). This is also when production bundle delta will materialize (~925 KB of engine deps).
- **#77 Icon sprite production-build** — still open from Phase 1; chrome integration phase blocker.
- **Vendoring fix-policy doc full version (#82)** — molecule + organism cases now available.
- **Carry-forward** from Phase 2: #74-76, #81, #89, #90, #92.

### Conventions reaffirmed (still hold after 16 organism ports + 54 React exports)

- All Phase 1 + Phase 2 conventions still hold (filename != classname, default-prop omits modifier class, forwardRef + displayName, state→aria pairing, sibling exports, controlled-only state, slot composition, cross-tier imports).
- **Engine encapsulation contract** held across 4 overlay engines (Radix.Dialog × 2, Radix.Popover, cmdk). Zero engine types leaked to wrapper APIs.
- **asChild boundary contract** held across 3 organism families. Trigger/Close siblings forward `asChild` to the underlying Radix primitive cleanly.
- **Portal discipline contract** held — Gate 22 PASS, single `vibcoder-overlay-root` div, all 4 overlay engine wrappers route through `useOverlayContainer()`.
- **Stateful gallery contract** held — 6 overlay galleries use `<DemoTrigger>` + `useState`, ESLint rule prevents regression.

### Per-task CC time (actuals from commit timestamps)

| Task | Estimate (Phase 2 ratio) | Actual (incl. fixup) | Notes |
|---|---|---|---|
| T1 (Modal canary + Phase 3 infra) | ~75 min | ~33 min | Established Radix.Dialog template + asChild boundary + portal discipline + 2 ESLint rules + Gate 22 + test-setup.ts polyfills |
| T2 (mega-batch of 12) | ~3 hr | ~25 min + ~3 min cleanup | Single-commit dispatch reduced overhead; `0fc750c` cleanup dropped unused @radix-ui/react-toast |
| T3 (composed pair) | ~45 min | ~12 min + ~6 min fix | First multi-organism composition; reviewer caught body co-class bug |

Total Phase 3 organism port: roughly 80 minutes of CC dispatch time including review fixups vs ~5 hr roadmap estimate. Mega-batch dispatch + locked per-component template held.

### Recommendation

**Proceed to Phase 5 chrome integration** (Phase 4 = re-port existing 37 components, sequenced separately). Organism alphabet complete (15 source CSS + 1 portal infra + 16 React families = 16 organisms / ~54 wrappers). All 22 DS gates green, 1599 tests passing, lint clean against pre-Phase-3 baseline (no new vibcoder lint errors), production bundle untouched (zero delta to consumers). Engine encapsulation + portal discipline + stateful gallery contracts proved across 4 distinct overlay engines (Radix.Dialog × 2, Radix.Popover, cmdk).

Master gallery index updated at `packages/editor/src/preview/vibcoder-index.html` with the Phase 3 section listing 15 organism gallery links + overlay-mount infrastructure note.

## Phase 4 findings (chrome re-port)

**Status:** SHIPPED 2026-04-28. M8 milestone closed.
**Scope:** Adapter shim layer for legacy `packages/editor/src/shared/ui/` primitives. Path-redirection contract — chrome consumers keep `@/shared/ui/<X>` imports while the shim translates props to vibcoder underneath.
**Goal:** Establish gate-keeper layer for vibcoder adoption without rewriting consumers. Phase 5 deletes shims after consumer rewrites.

### T-by-T summary

| Task | Commit(s) | Outcome |
|---|---|---|
| **T1** Button canary + Phase 4 infrastructure | `c7c870d`, polish `93d57c2` | First adapter shim. Established `_lib/` codemod helpers (`import-swap`, `skip-rules`, `jsx-query`). 1 shim, 1 codemod, baseline test pattern. |
| **T2** Form atoms (Input, Select, Switch, Checkbox, Slider) | `3faca35`, polish `51810c6` | 5 shims. T2 polish extracted `_lib/codemod-factory.ts` — eliminated boilerplate from per-codemod files. Checkbox kept bespoke (dual-scope label/wrapper). |
| **T3** Display atoms (Spinner, Skeleton, Icon, IconButton, Kbd, Badge, Tag) | `6257928`, spec correction `02de76f` | 7 shims initial. Spec correction at T3.5 — Spinner/Kbd/IconButton/Skeleton bumped from keep-legacy to bridge after audit found vibcoder coverage adequate. |
| **T4** Molecules (Card, Tabs, FormField, PanelHeader) | `a1492a4`, `2ad4b26`, `d5d657c`, `87b155a`, fix `cd5b080` | 4 shims. Card→`bd-card`, Tabs→Radix.Tabs-via-vibcoder, FormField→`bd-form-field`, PanelHeader→`surface-head` (closes the keep-as-extension entry from triage). T4.A fix scoped onClick to `clickable=true` only. |
| **T5** Modal canary | `3028d84`, `2ad8c65`, `cfe0289` | Highest-blast-radius shim. Three sub-tasks: Modal adapter shim, codemod with import-path forward-guard, 23 adapter contract tests. Radix.Dialog handles focus trap + scroll lock — `useFocusTrap` dropped on the Modal path. |
| **T6** Popover hybrid + plan amendment | T6.A `a065870`, plan amendment `37b3a47` | T6.1 inventory caught vibcoder Popover/Tooltip/Toast NOT being Radix-backed in Phase 3. Popover shipped as a hybrid (vibcoder CSS surface + retained `useFocusTrap`). Tooltip + Toast deferred to Phase 5. T7 plan amended to retain `useFocusTrap` and add Tooltip/Toast to the triage matrix. |
| **T7** Extensions triage | matrix `3cca170`, JSDoc stamps `aa77927` | 19-entry matrix. 0 new shims (PanelHeader@T4.D, SliderInput@T2.E, Icon@T3.C already shipped in earlier tasks). 17 keep-as-extension JSDoc stamps with per-entry Phase 5 disposition. |
| **T8** M8 milestone close | this commit | Doc consolidation, memory file, bundle delta documentation, stale-comment cleanup in Modal.tsx. |

### Codemod toolchain

**Location:** `packages/editor/scripts/codemods/phase4/` (19 codemods + 19 test files in `__tests__/`).
**Shared helpers:** `packages/editor/scripts/codemods/_lib/` — `codemod-factory.ts` (T2 polish extraction), `import-swap.ts`, `skip-rules.ts`, `jsx-query.ts`.

| Adoption | Codemods |
|---|---|
| Factory-based (`codemod-factory.ts`) | button, badge, card, form-field, icon, icon-button, input, kbd, modal, panel-header, popover, select, skeleton, slider, spinner, switch, tabs, tag (18 of 19) |
| Bespoke | checkbox (dual-scope: label sibling + wrapper) |

**Test pattern:** Each codemod has fixture-driven tests in `__tests__/<name>.codemod.test.ts`. Cumulative codemod test count: ~140 across 19 files.

**Adapter contract tests:** Each shim has companion `<Component>.adapter.test.tsx` in `src/shared/ui/__tests__/` — 21 adapter test files at HEAD, validating prop translation, untranslatable-prop drops, and behavior parity. Cumulative: 329 tests across the codemod + adapter contract suites combined (45 test files).

### Adapter shim strategy table

Per-primitive disposition at HEAD. "Bridge" = full prop translation; "Hybrid" = vibcoder CSS + retained legacy behavior; "Keep-legacy" = JSDoc stamp only.

| Primitive | Strategy | Vibcoder target | Phase 5 disposition |
|---|---|---|---|
| Button | bridge | `bd-btn` | shim deletion after consumer rewrite |
| Input | bridge | `bd-input` | shim deletion |
| Select | bridge | `bd-select` | shim deletion |
| Switch | bridge | `bd-switch` | shim deletion |
| Checkbox | bridge | `bd-checkbox` | shim deletion |
| Slider | bridge | `bd-slider` | shim deletion |
| Spinner | bridge | `bd-spinner` | shim deletion |
| Skeleton | bridge | `bd-skeleton` | shim deletion |
| Icon | bridge | `bd-icon` | shim deletion (distinct from Icons.tsx glyph palette) |
| IconButton | bridge | `bd-icon-btn` | shim deletion |
| Kbd | bridge | `bd-kbd` | shim deletion |
| Badge | bridge | `bd-badge` | shim deletion |
| Tag | bridge | `bd-tag` | shim deletion |
| Card | bridge | `bd-card` | shim deletion |
| Tabs | bridge | `bd-tabs` (Radix.Tabs) | shim deletion |
| FormField | bridge | `bd-form-field` | shim deletion |
| PanelHeader | bridge | `surface-head` | shim deletion (closes keep-as-extension from T7 matrix) |
| SliderInput | re-export → Slider | `bd-slider` | re-export removal after consumers rename |
| TextInput | re-export → Input | `bd-input` | re-export removal after consumers rename |
| Modal | bridge | `bd-modal` (Radix.Dialog) | shim deletion |
| Popover | hybrid | `bd-popover` + retained `useFocusTrap` | hybrid → bridge after vibcoder gets Radix.Popover backing |
| Tooltip | keep-legacy | (none — vibcoder Tooltip is passive surface only) | port after vibcoder Tooltip gets Radix.Tooltip backing |
| Toast | keep-legacy | (none — vibcoder Toast lacks queue/provider) | port if NotificationCenter organism gains queue capability |
| Accordion | keep-legacy | (none in alphabet) | re-evaluate with vibcoder Disclosure/Accordion primitive |
| ColorSwatch | keep-legacy | (none — distinct from ColorPicker/ColorTrigger) | re-evaluate |
| ContextMenu | keep-legacy | (none — needs Radix.ContextMenu install) | port after Radix.ContextMenu added |
| CopyButton | keep-legacy | (decorative composition over Button) | rewrite as composition over Button shim |
| ErrorMessage | keep-legacy | (none — Buildrik a11y shape) | re-evaluate |
| ErrorState | keep-legacy | (close to vibcoder EmptyState but not 1:1) | re-evaluate |
| HelpTooltip | keep-legacy | (cascades from Tooltip) | port with Tooltip in same commit |
| Icons.tsx | keep-legacy | (Buildrik domain glyph palette over Lucide) | stays — domain-specific, not a primitive |
| InfoBanner | keep-legacy | (triple export — InfoBanner + Tip + WarningBanner) | re-evaluate |
| PremiumBadge | keep-legacy | (Buildrik plan/billing variant of Badge) | rewrite as composition over Badge shim |
| QuickSwitcher | keep-legacy | (orchestration: Modal + cmdk + ranking) | stays — orchestration layer above primitives |
| Resizable | keep-legacy | (drag-handle utility) | stays |
| TreeView | keep-legacy | (generic data component) | stays |
| UpgradeGate | keep-legacy | (plan-gating business logic) | stays — not a primitive |
| UpgradeModal | keep-legacy | (composition: Modal + PremiumBadge + 403 listener) | inherits Modal swap automatically; rewrite when PremiumBadge ports |

### Gate movement

| Gate | Pre-Phase-4 | Post-Phase-4 | Notes |
|---|---|---|---|
| Gate 23 (shim layer is gate-keeper for mapped primitives) | not present | PASS | Wired in Phase 4. Forbids chrome consumers reaching into `@/editor/shared/vibcoder` directly for primitives that have a shim. |
| Gate 24 (inline `<button>/<input>/<select>/<textarea>` in editor/) | 264 | 100 (baseline 100) | Ratcheted 264 → 100 across Phase 4 (-164 / -62%). Codemods migrated chrome consumers to shim imports; bare elements that remain are non-chrome (engine/canvas/etc.) or test fixtures. |
| All other DS gates | green | green | No regressions. Gate 21 (no vibcoder-shape defs outside vendored components) holds. |

### Cumulative metrics (T1–T8)

```
Commits:                20  (21d80d0 → HEAD inclusive of T8)
Files changed (cumulative diff):  325
Insertions:             ~7,704
Deletions:              ~3,113
Adapter shims (PHASE 5 DELETE markers):  19
Keep-as-extension stamps (T7):           17
Codemods (factory + bespoke):            19  (18 factory + 1 bespoke)
Codemod test files:                      19
Adapter contract test files:             21
Cumulative tests passing (codemod + adapter):  329 across 45 files
Gate 24 ratchet:        264 → 100  (-164 / -62%)
Gate 23 added:          PASS at HEAD
```

### Bundle delta

Measured via `vite build` on baseline (pre-Phase-4 = `21d80d0~1` = `845f160`) vs HEAD (post-T7 = `aa77927`).

```
Baseline JS total:  2,490,279 B  (gzip main chunk:  524.52 KB)
HEAD JS total:      2,600,381 B  (gzip main chunk:  558.21 KB)
Delta:              +110,102 B   (+4.4% raw / +6.4% gzip on main chunk)
```

The growth concentrates in the main `index-*.js` chunk (1,847 KB → 1,959 KB). Source: vibcoder primitives + their Radix dependencies pulled into production via the new shim layer (Modal → `@radix-ui/react-dialog`, Tabs → `@radix-ui/react-tabs`, Popover hybrid → `@radix-ui/react-popover` references via vibcoder, plus cmdk transitive references via overlay infra).

This is a one-time adoption cost for Radix-backed primitives. Phase 5 consumer rewrites do not add code; they delete shim layers, so bundle should plateau or shrink slightly post-Phase-5. The +4.4% delta is documented and accepted — Phase 3's "zero delta" claim was specific to galleries-only landing; Phase 4 is the first phase that pulls vibcoder code into chrome consumers' production graph.

### Plan-vs-reality findings

**T3 spec correction (`02de76f`).** Initial T3 plan classified Spinner, Kbd, IconButton, and Skeleton as keep-legacy. Audit during T3.5 found vibcoder coverage was adequate for all four — they bumped to bridge. Lesson: per-primitive triage decisions need validation against the latest vibcoder alphabet, not the design-time decision table.

**T6.1 inventory (Popover/Tooltip/Toast not Radix-backed).** T6 originally scoped 3 shims. Inventory step found vibcoder Popover/Tooltip/Toast in Phase 3 are passive CSS surfaces — no Radix.Popover/Tooltip/Toast backing yet. T6.A shipped Popover as a hybrid (vibcoder CSS + retained `useFocusTrap`). Tooltip + Toast deferred to Phase 5. Lesson: vibcoder phase claims need a "what's actually shipped" audit step before consumption.

**T7 plan amendment (`37b3a47`).** Original T7 plan called for `useFocusTrap` deletion. After T6.A hybrid kept the hook, T7 was amended to retain `useFocusTrap` and document the call-site dependency. The Modal.tsx docstring carried a stale claim that "T7 deletes useFocusTrap" — fixed in T8 to match reality.

**T7 zero new shims.** All keep-as-extension candidates that originally hinted at potential ports (PanelHeader, SliderInput, Icon-atom-vs-Icons.tsx) were already shipped in earlier T-tasks. T7 reduced to documentation: 17 JSDoc stamps + the triage matrix. Lesson: when triage is the last task, the eligible-port count is usually 0 by virtue of earlier tasks doing the work.

### T7 extensions triage matrix

Inspected all 19 entries in `packages/editor/src/shared/ui/` (PanelHeader counted, plus the original 18). Direct-import counts (`@/shared/ui/<X>`) measured at HEAD via grep over `packages/editor/src`.

| Extension | Direct imports | Decision | Rationale | Status |
|---|---:|---|---|---|
| Accordion | 0 | keep-as-extension | No vibcoder Accordion / Disclosure primitive in Phase 3 alphabet. Self-contained collapse/expand logic; not in chrome rendering path. | JSDoc stamp |
| ColorSwatch | 0 | keep-as-extension | Vibcoder ships ColorPicker + ColorTrigger but neither matches the swatch grid shape. | JSDoc stamp |
| ContextMenu | 1 | keep-as-extension | No vibcoder ContextMenu (would require Radix.ContextMenu install in Phase 5). | JSDoc stamp |
| CopyButton | 1 | keep-as-extension | Decorative composition over Button — Buildrik-specific copy-to-clipboard UX (animated checkmark feedback). | JSDoc stamp |
| ErrorMessage | 0 | keep-as-extension | Title/why/action accessibility shape is Buildrik-specific; no vibcoder banner/error molecule. | JSDoc stamp |
| ErrorState | 1 | keep-as-extension | Includes ErrorBoundary class component + FieldError sibling. Vibcoder EmptyState close but not 1:1. | JSDoc stamp |
| HelpTooltip | 2 | keep-as-extension | Composes the kept Tooltip extension. Cascades from Tooltip decision. | JSDoc stamp |
| Icons | 6 | keep-as-extension | 869 lines of named Buildrik glyph wrappers (IconLink, IconImage, IconForm, etc.) over Lucide icons — distinct from the Icon atom shipped at T3. Buildrik domain palette; no vibcoder equivalent for these named glyphs. | JSDoc stamp |
| InfoBanner | 0 | keep-as-extension | Triple export (InfoBanner + Tip + WarningBanner). No vibcoder banner molecule. | JSDoc stamp |
| PanelHeader | 3 | port-to-X | Already shipped at T4.D as `surface-head` bridge. | shipped at T4.D |
| PremiumBadge | 1 | keep-as-extension | Variant of Badge atom — Buildrik plan/billing-specific styling (Pro / Enterprise label). | JSDoc stamp |
| QuickSwitcher | 0 | keep-as-extension | Composes Modal (now T5 shim) + cmdk + bespoke search ranking; orchestration layer above primitives. | JSDoc stamp |
| Resizable | 0 | keep-as-extension | Drag-handle utility wrapper; no vibcoder equivalent. | JSDoc stamp |
| SliderInput | 0 | port-to-X | Already shipped at T2.E as `slider` atom bridge. | shipped at T2.E |
| Tooltip | 7 | keep-as-extension | Vibcoder Tooltip (Phase 3 `bd-tooltip`) is purely a passive CSS surface — no hover-intent, no positioning, no delay, no portal. Legacy Tooltip provides all of those plus ESC dismiss + viewport-fit anchoring + shortcut hint slot. A hybrid bridge would carry behavior cost AND visual-regression risk in highly-visible chrome (Topbar, StatusIndicators, CanvasFooterToolbar). Phase 5 substitution to Radix.Tooltip is the correct migration target — T7 keeps the legacy intact. | JSDoc stamp |
| Toast | 26 | keep-as-extension | Phase 3 dropped @radix-ui/react-toast at commit `0fc750c`. Module-level HMR-persistent store + ToastProvider + queue/dedupe. Vibcoder Toast is a passive surface only — no provider, no queue, no auto-dismiss. Phase 5 reconsiders if NotificationCenter organism gains queue capability. | JSDoc stamp |
| TreeView | 0 | keep-as-extension | Generic `<TreeView<T>>` data component — no vibcoder equivalent. | JSDoc stamp |
| UpgradeGate | 0 | keep-as-extension | Buildrik plan-gating business logic (free / pro / enterprise). Not a primitive. | JSDoc stamp |
| UpgradeModal | 1 | keep-as-extension (composition) | Composes `Modal` (T5 shim) + `PremiumBadge` + 403 event listener. **Inherits T5 Modal swap automatically** via existing `import { Modal } from "./Modal"`. No separate codemod needed. | JSDoc stamp |

### Bridge-via-T7 ports shipped this task

None. All port-to-X candidates already shipped in earlier T-tasks:
- PanelHeader → T4.D (surface-head bridge)
- SliderInput → T2.E (slider atom bridge)
- Icon atom → T3.C (separate from Icons.tsx glyph palette)

### Keep-as-extension stamps (17 files)

Accordion, ColorSwatch, ContextMenu, CopyButton, ErrorMessage, ErrorState, HelpTooltip, Icons, InfoBanner, PremiumBadge, QuickSwitcher, Resizable, Tooltip, Toast, TreeView, UpgradeGate, UpgradeModal — all gain a `Phase 4 T7 triage: keep-as-extension` JSDoc block documenting rationale + Phase 5 disposition.

### Tooltip decision

**Decision:** keep-as-extension.

**Reasoning:**

1. **Behavior gap is large.** Vibcoder Tooltip is a presentational surface only (`bd-tooltip` div + sibling spans for title/desc/kbd). Legacy Buildrik Tooltip provides hover-intent delay, viewport-fit anchoring, ESC dismiss, portal-style fixed positioning, and a shortcut slot. A hybrid bridge à la T6.A Popover would re-host all that behavior — high carrying cost for a CSS-skin-only win.
2. **Visual regression risk.** Tooltip is in Topbar, StatusIndicators, and toolbar buttons — the most visible chrome surfaces. Vibcoder Tooltip uses `--bd-popover-*` token scale; legacy uses `--buildrick-bg-elevated` directly. Token cascade differences are likely to show as colour drift in regression-prone surfaces.
3. **Phase 5 has the right answer.** Radix.Tooltip-backed vibcoder Tooltip will give us hover-intent + delay + collision detection out of the box. T7 hybrid bridging buys nothing that survives Phase 5.
4. **Cost asymmetry.** Tooltip has 7 consumers; HelpTooltip has 2 (composes Tooltip). Switching now means writing a hybrid, codemodding 7 sites, then re-codemodding when Phase 5 lands the Radix-backed vibcoder Tooltip. Two codemods for one CSS change is a poor trade.

### useFocusTrap retention rationale

`useFocusTrap` retained at `packages/editor/src/shared/hooks/useFocusTrap.ts`. Verified call sites (excluding the hook file itself + tests):

```
packages/editor/src/shared/ui/Popover.tsx:40 — import
packages/editor/src/shared/ui/Popover.tsx:62 — call site
```

The T6.A Popover hybrid shim (`a065870`) is the load-bearing dependency. Vibcoder Popover (Phase 3) is intentionally a passive controlled surface — no Radix.Popover backing, no focus trap. Phase 5 deletes the hook after vibcoder Popover gets a Radix.Popover-backed upgrade. See T6 amendment commit `37b3a47` for plan-level codification.

Modal previously used the hook; T5 dropped it because Radix.Dialog handles focus trap internally — verified by Modal.tsx top docstring lines 25–27.

### Phase 5 handoff list

Phase 5 (chrome integration / vibcoder primitive upgrades) inherits the following work in three buckets:

**Bucket A — Hybrid simplification (delete legacy behavior shells after vibcoder Radix upgrades).**

1. **Popover (full bridge).** When vibcoder Popover gains Radix.Popover backing, delete `useFocusTrap` + drop the hybrid shim's behavior shell. Single load-bearing call site at `packages/editor/src/shared/ui/Popover.tsx:62` — see `useFocusTrap retention rationale` below.

**Bucket B — Keep-legacy → bridge ports (when vibcoder gets the missing Radix backing).**

2. **Tooltip.** When vibcoder Tooltip gains Radix.Tooltip backing, the legacy extension can be deleted via codemod. Estimate: 7 consumers → 1 codemod commit.
3. **Toast.** Only revisit if NotificationCenter organism gains a queue / provider API matching the legacy Toast surface contract (id, dedupe, auto-dismiss). Otherwise legacy stays. 26 consumers — highest dependency count of any keep-legacy extension.
4. **ContextMenu.** Radix.ContextMenu install would unblock a vibcoder ContextMenu primitive; until then legacy stays. 1 consumer.
5. **HelpTooltip.** Cascades from Tooltip. When Tooltip ports, port HelpTooltip in the same commit. 2 consumers.

**Bucket C — Adapter shim deletion (after consumer rewrites land).**

The 19 adapter shims (PHASE 5 DELETE markers in `packages/editor/src/shared/ui/`) are deleted once chrome consumers swap their `@/shared/ui/<X>` imports for `@/editor/shared/vibcoder` direct imports. This is the bulk of Phase 5 — codemod-driven consumer rewrites, then shim file removal. Order suggestion: T1-T4 atoms/molecules first (lowest blast radius), then T5 Modal (highest), then T6 Popover (after the Radix upgrade in Bucket A).

**Bucket D — Composition rewrites (no codemod, manual review).**

6. **CopyButton** — rewrite as composition over Button shim during shim deletion pass.
7. **PremiumBadge** — rewrite as composition over Badge shim.
8. **UpgradeModal** — already composes Modal shim transitively; rewrite when PremiumBadge ports.

**Bucket E — Stays as extension permanently.**

Icons.tsx (domain glyph palette), QuickSwitcher (orchestration layer), Resizable, TreeView, UpgradeGate, ErrorBoundary class component, InfoBanner triple-export. These are not primitive ports; they are Buildrik domain code that composes primitives.

### Acceptance summary (Phase 4 close-out)

- [x] T1–T7 shipped: 19 adapter shims, 17 keep-as-extension JSDoc stamps
- [x] Codemod toolchain reusable (factory + 19 codemods + 19 codemod test files)
- [x] Adapter contract tests (21 files); cumulative 329 tests passing across 45 files
- [x] Gate 23 wired (shim layer is gate-keeper)
- [x] Gate 24 ratcheted 264 → 100 (-62%)
- [x] All other DS gates green
- [x] `useFocusTrap` retained per T6.1 inventory + T7 amendment (`37b3a47`)
- [x] Modal.tsx stale comment fixed (T8)
- [x] Bundle delta documented (+4.4% raw / +6.4% gzip-main — one-time Radix adoption cost)
- [x] Phase 5 handoff list captured in 5 buckets above

## Phase 5 findings (chrome integration / shim deletion)

**Milestone:** M9 (2026-04-28) — same calendar day as M8 Phase 4 ship.

**Outcome:** PASS for Buckets C + D. Bucket A (Popover Radix upgrade) deferred upstream — see `lane-4-upstream-handoff.md`. Bucket B (Tooltip/Toast/ContextMenu/HelpTooltip) and Bucket E (permanent extensions) are no-action by design — Bucket E lives in `src/shared/extensions/` already.

**Scope shipped:** All 19 Phase 4 adapter shims deleted. 3 standalone compositions (CopyButton, PremiumBadge, UpgradeModal) relocated to `src/shared/extensions/`. 1 in-flight composition extraction (ConfirmDialog) created during T4 + relocated to extensions in T4 follow-up.

### Commit landings

| Task | Description | Commits |
|---|---|---|
| **T1** | Toolchain hardening (codemod factory + AST scanner) | `c951a53`, `f31e6f6`, `df16f81`, `50bf799` |
| **T2** | 15 atom shim deletions (Tag, Badge, Skeleton, IconButton, Icon, Kbd, Spinner, Switch, Slider, SliderInput, Checkbox, Select, Input, TextInput, Button) + 19 keep-as-extension JSDoc stamps | thru `543fe28`, follow-up `a0c50a2` |
| **T2.X** | Barrel-explosion codemod (split `from "../shared/ui"` → direct named-path imports across 25 files) | `a8e2ce0` |
| **T3.A** | Card molecule shim deletion (dead code — 0 production consumers) | `874d523` |
| **T3.B** | Tabs molecule shim deletion + 6 consumer hand-port (data-driven → compound API) | `64236e7` |
| **T3.C** | FormField molecule shim deletion (dead code — 0 production consumers) | `2341b5e` |
| **T3.D** | PanelHeader molecule shim → `src/shared/extensions/` (composition move) + 4 consumer rewrites | `20262fc` |
| **T4** | Modal shim deletion + 24 consumer hand-port + ConfirmDialog extracted | `b821002`, follow-up `c6f20e0` |
| **T5** | Composition rewrites — CopyButton, PremiumBadge, UpgradeModal → `src/shared/extensions/` | `524037d` |

### LOC delta

Approximate net-removed across T1-T5: **−1,800 LOC** of shim code + adapter tests + Phase 4 codemod artifacts. Each Phase 4 codemod retired alongside its corresponding shim deletion (Phase 4 chain reduced from 6 entries → 1 entry — only `popover` remains, blocked on Bucket A). Three barrel layers cleaned: `shared/ui/index.{ts,tsx}` + root `src/index.ts` (transitive fan-out) + `editor/sidebar/shared/index.ts` (sibling fan-out).

### Surfaced lessons (5 distinct inventory-script gaps)

The Phase 5 plan inventory script (`scripts/phase5-shim-inventory.mjs`) under-reports consumer counts in 5 specific failure modes. Each surfaced through real Phase 5 task drift:

1. **Transitive root barrel re-exports** (T3.B, T3.D, T4): `src/index.ts` re-exports from `./components` which re-exports from `shared/ui/index.ts`. Inventory script does not trace transitive fan-out — manual grep required.
2. **Sub-barrel re-exports** (T3.D): `src/editor/sidebar/shared/index.ts` re-exported PanelHeader independently. Sub-barrels at the same depth as middle-man wrappers go undetected.
3. **Middle-man wrapper files** (T3.D): `src/editor/sidebar/shared/PanelHeader.tsx` was a pure pass-through re-export. Inventory treats these as siblings, not redirect-only files. Detection rule: file body is a single `export * from "X"` + `export { default } from "X"`.
4. **Legacy `components/` folder redirects** (T3.D): `src/components/Panels/LeftSidebar/shared/PanelHeader.tsx` was a deeper redirect that the inventory script's scan-root excluded.
5. **Stale `vi.mock` paths** (T4 follow-up): test files mocking deleted module IDs. `vi.mock("X", …)` is silently inert when module ID does not match an actual import — tests pass under jsdom even when mock never applies.

### Decision rubric for Phase 5 task types

Phase 5 surfaced 3 distinct task patterns. T6+ should triage shim-deletion work using this rubric:

| Pattern | Signal | Approach | Reference |
|---|---|---|---|
| **Pure dead code** | 0 production consumers, only barrel re-exports | Inline delete: shim + adapter test + barrels + Phase 4 codemod | T3.A Card, T3.C FormField |
| **Translation shim** | N production consumers, prop translations are mechanical | Hand-port if N≤10, codemod if N>10 (assess composition complexity first) | T3.B Tabs (6, hand-port), T2.B.14 Button (180, codemod), T4 Modal (24, hand-port) |
| **Composition layer** | Shim adds project-specific composition on top of vibcoder primitive | Move to `src/shared/extensions/` — preserve abstraction, not deletion | T2.B Skeleton, T3.D PanelHeader, T4 ConfirmDialog, T5 ×3 |

### `src/shared/extensions/` folder contract

After T1-T5 the folder contains 6 files: `Skeleton.tsx`, `PanelHeader.tsx`, `ConfirmDialog.tsx`, `CopyButton.tsx`, `PremiumBadge.tsx`, `UpgradeModal.tsx`. Contract: project-specific compositions on top of vibcoder primitives. NOT vendored vibcoder code (those live in `src/editor/shared/vibcoder/`). NOT raw chrome JSX (that lives in `src/editor/`). NOT primitive design-system pieces (those stay in `src/shared/ui/`). Test: "if vibcoder ever ships this exact composition upstream, this file deletes and consumers swap import paths." If the answer is yes, it belongs in `extensions/`; otherwise in `editor/` or `shared/ui/` per existing rules.

### Open follow-ups (post-T5)

1. **Bucket A — Popover Radix upgrade** blocked on upstream vibcoder Popover gaining Radix.Popover backing. After upgrade lands, T7 deletes `useFocusTrap` from chrome + drops Popover hybrid shell. `codemod:phase4:popover` script entry retains until Popover shim deletes.
2. **Bucket B — Tooltip/Toast/ContextMenu/HelpTooltip** keep-legacy until vibcoder substrates upgrade. Tooltip/Toast in particular need Radix.Tooltip / Radix.Toast backing on the vibcoder side. T7 disposition.
3. **Inventory script enhancements** (5 failure modes above). Optional ratchet — each was caught manually in T1-T5; codifying would prevent recurrence in T7+.
4. **Stale `vi.mock` path detection** — single CI gate would prevent the T4 follow-up class of bug. Greppable: mock module IDs vs actual file existence.
5. **Bundle delta measurement** — Phase 4 reported +4.4% raw / +6.4% gzip-main from Radix adoption. Phase 5 expected to plateau or shrink slightly (only deletes consumer-side shim layers). Re-measure post-T5 to confirm hypothesis.

### Recommendation

**Phase 5 closes at T5.** Buckets C + D shipped (atom + molecule + Modal shim deletions + composition relocations). Bucket A blocked on upstream Popover Radix work; Bucket B blocked on upstream Tooltip/Toast Radix work. Both deferred to a future phase (T7) gated on the upstream vibcoder substrate upgrades. Phase 6 (visual regression infrastructure) is unblocked and should be next per the roadmap's dependency graph.

## Bucket A findings (Popover Radix.Popover backing)

**Milestone:** Bucket A close-out (2026-04-28) — same calendar day as M8 Phase 4 + M9 Phase 5 ship. Re-classified from "DEFERRED upstream" to "single-repo work" once verified the vibcoder bundle was already vendored in-repo.

**Outcome:** PASS. Popover compound now Radix.Popover-backed at `src/editor/shared/vibcoder/Popover.tsx`. The Phase 4 hybrid shim at `src/shared/ui/Popover.tsx` is deleted. `useFocusTrap` is no longer a chrome concept. The `codemod:phase4` chain is fully retired (last entry `popover` removed in T4). Issue #93 (PopoverArrow) is now resolved — `Popover.Arrow` re-exports `RadixPopover.Arrow` from the vibcoder compound.

### Commit landings

| Task | Description | Commit |
|---|---|---|
| **T1** | Vibcoder Popover wrapper rebuilt as Radix.Popover-backed compound (Root/Trigger/Anchor/Portal/Content/Arrow/Close) + E2/E3 contract waivers documented in docstring | `e0ef916` |
| **T2** | `src/shared/ui/Popover.tsx` shim deleted + 4 consumer hand-port (SizeSection, FontControls, ColorInput, RichTextEditor) | `e1874f9` |
| **T3** | `useFocusTrap` hook deleted (orphaned after T2) — file + tests + barrel export removed | `343957f` |
| **T4** | Phase 4 codemod toolchain officially retired — `popover` codemod + 12 orphan fixture pairs (checkbox/icon-button/kbd/select/skeleton/spinner) deleted; `codemod:phase4` script entry removed from package.json | `309890b` |

### LOC delta

34 files changed, 452 insertions, 1155 deletions (**net −703 LOC**). Larger gross-deletion than Phase 5's net average per task because T4 swept the entire Phase 4 codemod chain — not just `popover` but 6 already-orphaned fixture pairs left behind by prior Phase 5 codemod-deletion commits.

### Open issue #93 resolved

PopoverArrow now lives as `RadixPopover.Arrow` re-export from the vibcoder compound. Phase 3 deferral note in this doc (line 415) and the `lane-4-upstream-handoff.md` Bucket A unblocker both fold into T1's commit.

### T2 code-review concern (resolved inline)

Codex flagged an "Important" keyboard-activation gap on `ColorInput.tsx`: the popover trigger was a `<div role="button">` without keyboard handlers. Real `<button>` outer was infeasible because the trigger contains an `<Input>` plus a nested `<Button>` (button-in-button HTML invalid). Resolved via `onKeyDown` handler on the `<div>` — Enter / Space toggle `setIsOpen`. Equivalent behavior, valid HTML, same commit.

### T4 scope expansion + inventory-script gap

T4 was scoped as "remove `codemod:phase4:popover` + the popover codemod file + its fixtures." Inventory walk surfaced 12 additional orphan fixture pairs (checkbox / icon-button / kbd / select / skeleton / spinner) left behind by earlier Phase 5 commits that deleted the corresponding codemod scripts but not their `__tests__/fixtures/*.input.tsx` + `*.output.tsx` pairs. T4 deleted them alongside the popover sweep.

**Inventory-script gap (codify in T7+):** `scripts/phase5-shim-inventory.mjs` does not flag fixture-pair files as orphaned when their parent codemod script is deleted. This is a 6th distinct failure mode to add to the existing 5-item list above (Phase 5 surfaced lessons section). Detection rule: if `scripts/codemods/phase4/<X>.ts` is missing, then any `scripts/codemods/phase4/__tests__/fixtures/<X>.{input,output}.tsx` are orphans.

### E2 + E3 contract waivers (precedent for Bucket B)

The vibcoder `Popover.tsx` docstring captures two intentional deviations from Phase 3 wrapper contracts:

- **E2 waiver — Radix types deliberately leak.** Phase 3 wrappers were supposed to keep Radix types out of public APIs (E2 contract). Popover deviates because the positioning props (`side`, `sideOffset`, `align`, `alignOffset`, `avoidCollisions`, `collisionPadding`) **are the API**. Re-defining these as a buildrik-shaped subset would lose pixel-positioning fidelity that consumers rely on. Radix types pass through.

- **E3 waiver — PopoverPortal opts out of OverlayMount routing.** Phase 3 organisms route portals through `useOverlayContainer` for modal-stack discipline (E3 contract). Popover deliberately uses Radix's default portal target because Radix's anchor-relative positioning fights `useOverlayContainer`'s flat-stack reparenting. Popovers anchor to triggers; they do not stack like modals.

These two waivers are documented inline in the Popover.tsx docstring and are NOT placeholder TODOs — they are intentional architectural decisions. Future Bucket B Radix-backed wrappers (Tooltip / Toast / ContextMenu) should consult these waivers as precedent: positioning props are part of the API surface, and anchored overlays opt out of modal-stack portal routing.

### Recommendation

**Bucket A closes today (2026-04-28).** Phase 5 chrome arc is fully complete *sans* Bucket B (Tooltip / Toast / ContextMenu / HelpTooltip — still pending Radix.Tooltip / Radix.Toast / Radix.ContextMenu wraps in vibcoder). Phase 6 (visual regression infrastructure) remains the next unblocked roadmap target.

---

## Bucket B2 findings (ContextMenu — pure deletion, 2026-04-30)

### Disposition: shim was dead code

Bucket B2 was originally planned as a Radix.ContextMenu backing arc (install dep, create wrapper from scratch, migrate the 1 chrome consumer). Pre-flight inventory falsified both core assumptions:

1. **No live consumer of the component or hook.** The shim's `<ContextMenu>` and `useContextMenu()` had zero callers anywhere in `src/`. The single grep hit (`dropOperations.tsx`) imported only the *type* `ContextMenuItem`.

2. **The "consumer" path was a half-finished feature.** Inside `dropOperations.tsx`, ~65 LOC built a heading-block H1-H6 selection menu (drag a "heading" block → show a level picker) gated on `ctx.onShowContextMenu` being truthy. No caller ever passed `onShowContextMenu`. The branch had been silently dead since whoever wrote it.

3. **Shape mismatch — Radix.ContextMenu would not have fit anyway.** The dropOperations heading-menu flow needs an absolute-positioned drop-completion menu (callsite computes x/y from the drop event). Radix.ContextMenu models right-click anchored menus on a trigger element. Even with a live consumer, migrating to Radix would have required rewriting the architecture, not just translating props.

### What shipped

Single commit `d81bed1`. 5 files changed, 257 deletions, 0 insertions:

- `src/shared/ui/ContextMenu.tsx` deleted (179 LOC shim)
- Dead heading-menu branch deleted from `dropOperations.tsx` (~65 LOC) + `onShowContextMenu` callback param + `ContextMenuItem` type import
- Barrel cleanups: `shared/ui/index.ts`, `shared/ui/index.tsx`, `src/index.ts` (top-level re-export of `ContextMenu` + `useContextMenu`)
- No Radix.ContextMenu install. No new wrapper. No new tests.

### Forward note

If a right-click context menu is genuinely needed in the chrome later, the future implementer should:

1. Install `@radix-ui/react-context-menu` at that time.
2. Create a vibcoder wrapper following the Bucket A Popover.tsx precedent (E2 + E3 waivers apply — anchored overlay).
3. Consult `docs/superpowers/plans/2026-04-30-vibcoder-bucket-b2-contextmenu.md` for the original plan as a starting reference (the plan's Task 1 wrapper-creation steps remain valid; Task 2 should be skipped since no consumer exists today).

The half-finished heading-block drop-menu flow is a *separate* problem: it needs a drop-completion floating panel, not a right-click context menu. Product design call before code.

### Lessons surfaced

- **Audit before architecture, applied to plans too.** B2's plan was written assuming a live consumer based on grep matches that turned out to be type-only imports. The inventory step is not optional — it's the first verification gate. Original Bucket A plan-writing memory entry says "Inventory before architecture for theme specs" — extends to every Radix-backing plan.
- **Type-only imports inflate consumer counts.** Grep `from "@/shared/ui/X"` catches both component imports and bare type imports. Inventory scripts should distinguish — a type-only consumer is dead code in disguise when the type is only used in callback signatures with no live callers.
- **Half-finished features rot quietly.** A code path gated on a never-passed callback compiles, type-checks, ships, and lingers indefinitely. Worth a future gate: detect optional callback params with no caller-supplied implementations across the consumer graph.

---

## Bucket B1 findings (Tooltip — Radix.Tooltip backing, 2026-04-30)

### What shipped

| Task | SHA | Description |
|------|-----|-------------|
| T1 | `affe6fd` | Vibcoder Tooltip wrapper migrated from Phase 2 passive surface to Radix.Tooltip compound (Provider/Root/Trigger/Portal/Content + Title/Desc/Kbd siblings). E2 + E3 contract waivers in docstring follow Bucket A Popover precedent. RailTile (intra-vibcoder cross-import) updated to keep main green. Test fixture used `<span tabIndex={0}>` for asChild (avoids Gate 24 baseline bump). |
| T2 | `e72b9db` | `<TooltipProvider delayDuration={500}>` mounted at AquibraStudio shell, outermost in the provider stack. The 500ms delay matches the deleted Phase 4 shim default — chrome hover-intent behavior preserved bit-for-bit. |
| T3 | `8c9888b` | Phase 4 Tooltip shim deleted. 13 consumers hand-ported (10 listed in plan + 3 transitive: HelpTooltip, ColorSwatch, SeoTab — caught by tsc post-shim-deletion because the inventory grep regex missed `@shared/ui/Tooltip` and `./Tooltip` (relative within `shared/ui/`) shapes). 4 chrome-axiom gates improved as a side-effect (gradients 77→76, box-shadow 179→176, panel-radius 377→371, layout literals 335→322); baselines lowered to lock the wins. |

Net delta across T1-T3: 27 files changed, +1391/−965 (net +426 LOC, mostly from new test coverage and inline TooltipKbd usages replacing the old `shortcut` prop). Shim itself was 183 LOC; new wrapper is 138 LOC; rest is rewrites in 13 consumer files.

### Inventory grep gap (recurring)

For the third consecutive bucket (B2 ContextMenu was the second instance), the consumer grep regex `from ['\"](@/shared/ui/X|\\.\\./.*shared/ui/X)['\"]` missed import variants. B1 specifically missed:

- `@shared/ui/Tooltip` — alias without leading slash (used by SeoTab)
- `./Tooltip` — relative within `shared/ui/` itself (used by HelpTooltip, ColorSwatch)

Hardened grep that catches all four shapes:

```bash
grep -rEln "from ['\"]([@/.][^'\"]*shared/ui/Tooltip|\\.\\./.*shared/ui/Tooltip|@shared/ui/Tooltip)['\"]" src/
```

Action item: extract a reusable inventory helper (e.g., `scripts/grep-shim-consumers.sh <ShimName>`) so future Bucket B3 (Toast — 27 consumers) and Phase 6 onward don't undercount.

### Per-instance delayDuration overrides

Two consumers needed non-default delay (200ms): HelpTooltip and SeoTab help-icons. Translated to `<Tooltip delayDuration={200}>` on the Radix Root (overriding ambient Provider). All other 11 consumers use the implicit default 500 from the Provider — covered without per-instance overrides.

### asChild compatibility

All 13 consumers used DOM-element children (`<span>`, `<button>`, `<div>`) or vibcoder forwardRef components (`<Button>`, `<IconButton>`) as triggers. No asChild ref-forwarding issues encountered. This held because vibcoder atoms (Button, IconButton from Phase 1 atoms) all forward refs by spec.

### Side-effect gate improvements

4 of the 4 chrome-axiom gates improved because consumer rewrites replaced inline JSX with compound shapes that don't count toward inline-element gates:

| Gate | Before | After | Delta |
|------|--------|-------|-------|
| Gate 11 (chrome gradients) | 77 | 76 | −1 |
| Gate 12 (box-shadow tokens) | 179 | 176 | −3 |
| Gate 13 (panel-chrome border-radius) | 377 | 371 | −6 |
| Gate 14 (layout literals) | 335 | 322 | −13 |

Baselines locked at the new lower values. Future regressions on these gates will fail CI.

### Recommendation

**Bucket B1 closes 2026-04-30.** B3 (Toast — 27 consumers) is the last remaining bucket in the chrome arc. B3 should:
1. Use the hardened consumer-grep helper from the action item above
2. Reuse the TooltipProvider precedent at AquibraStudio (mount ToastProvider similarly outermost)
3. Pre-flight check for transitive shim-internal cross-imports (the HelpTooltip-class trap)
4. Strongly consider a jscodeshift codemod given the consumer count, with inline-string tests (Gate 25 enforces no orphan fixtures)

