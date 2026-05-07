# Q2 Day-2 — NumericStepper vibcoder primitive

**Date:** 2026-05-06
**Status:** Planned
**Prereq:** Q2 Day-1 shipped (12 commits `af8b88f2`..`14ab4bb0`)
**Branch:** `main` (solo workflow direct-commit)

## Goal

Phase A (visual regression check) verifies Day-1 commits 9-12 didn't break Animation Editor or RichTextEditor color popovers. Phase B extends vibcoder with a `NumericStepper` primitive (CLAUDE.md SSOT step 4: "extend vibcoder, don't fork around it"). Phase C migrates `shared/forms/NumberField.tsx` to compose the new primitive. Phase D drains orphaned CSS.

## Why this work

`NumberField` is the only composite form-field still using legacy `buildrick-number-*` CSS classes. Vibcoder has no equivalent NumericStepper primitive, so we cannot just "swap" — we must EXTEND vibcoder. Once landed:
- Inspector chrome (1 NumberField consumer in `editor/animation/AnimationEditor.tsx`) inherits vibcoder primitive transparently.
- `themes/components.css` drops `.buildrick-number-row`, `-stepper`, `-btn`, `-btn-dec`, `-btn-inc`, `-input`, `-unit` rules (~60 LOC drain).
- Pattern unblocks future NumericStepper consumers (any inspector field that needs +/- stepper).

## Phases + tasks

### Phase A — Visual regression check (5 min)

A1. Restart browse helper (`$B restart`) — buffer-flush bug accumulated.
A2. Navigate to editor, click into a project with elements.
A3. Open canvas element → Inspector → Animation tab.
A4. Verify SliderField rendering: Duration / Delay / Iterations / Scroll Offset sliders show vibcoder bd-slider track + thumb + label + value head row.
A5. Open canvas element → Text element → click into rich-text mode.
A6. Click Text Color toolbar button → verify ColorField popover renders: hex input + 11 preset swatches + native color picker.
A7. Click Highlight Color toolbar button → same verification.
A8. Take screenshots of both states for the record.

**Pass criteria:** Both sliders and color popovers render without layout collapse, missing labels, or mis-sized inputs. Console clean.

**Fail recovery:** If sliders broken → revert commit `4486493c` (SliderField rewrite). If color popover broken → revert `f5b6d60c` (ColorField rewrite). Each revert is independent; CSS drain commits (`24f784d5`, `14ab4bb0`) revert separately.

### Phase B — NumericStepper primitive (~2 hours)

Add new vibcoder primitive following the pattern of existing atoms (Button.tsx, IconButton.tsx, Input.tsx).

B1. Inventory: read existing vibcoder atom file structure (Button.tsx + button.css under `themes/components/atoms/`).
B2. Spec the API:

```tsx
export interface NumericStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  inputMode?: "decimal" | "numeric";
  /** Optional unit suffix rendered to right of input (no dropdown) */
  unit?: string;
  error?: boolean;
  "aria-label"?: string;
}
```

Variants: size sm/md (xs not needed per inspector chrome density). State: error, disabled. NO unit-select — keep flat (zero current callers want unit dropdown; see Day-1 inventory).

B3. Author CSS at `themes/components/atoms/numeric-stepper.css`:

```
.bd-stepper { display: flex; align-items: stretch; ... border + radius }
.bd-stepper__btn { width: 24px; ... }
.bd-stepper__btn--dec { ... }
.bd-stepper__btn--inc { ... }
.bd-stepper__input { ... padding tokens, font tokens }
.bd-stepper--sm { ... reduced sizes }
.bd-stepper--error { border-color: var(--buildrick-error) }
.bd-stepper.is-disabled, .bd-stepper--disabled { opacity, pointer-events }
```

Use `--buildrick-*` canonical tokens only. Zero hex literals (Gate 24).

B4. Author React wrapper at `editor/shared/vibcoder/NumericStepper.tsx`:
- forwardRef to inner `<input>` (focus management consumer).
- Internal state for input local value (text), separate from numeric `value` prop (matches NumberField.tsx pattern).
- Keyboard handlers: `ArrowUp`/`ArrowDown` increment/decrement (Shift+Arrow = 10×).
- Inner +/- buttons render as `<button class="bd-stepper__btn">` with inline SVG icons (Plus/Minus from lucide-react).
- Compose via existing exported atoms? Decision: NO — inner buttons are tightly-coupled stepper composition, NOT general IconButton. Direct `<button>` markup matches vibcoder Switch.tsx pattern.

B5. Add CSS @import to `themes/default.css`:
```css
@import "./components/atoms/numeric-stepper.css" layer(components);
```

B6. Add export to `editor/shared/vibcoder/index.ts`:
```ts
export { NumericStepper, type NumericStepperProps } from "./NumericStepper";
```

B7. Write test at `editor/shared/vibcoder/NumericStepper.test.tsx`:
- Renders + and - buttons + input.
- onChange fires with new value on click +/- or arrow keys.
- min/max clamping.
- Shift+Arrow = 10× step.
- Disabled blocks all interaction.
- error prop adds `bd-stepper--error` class + `aria-invalid`.

B8. Add preview gallery at `src/preview/vibcoder-numeric-stepper.html` (optional, follows existing preview pattern for visual QA).

**Pass criteria:** tsc clean, vitest passes, gallery renders cleanly in browser.

### Phase C — NumberField migration (~30 min)

C1. Rewrite `shared/forms/NumberField.tsx` as thin wrapper composing the new vibcoder NumericStepper.
- Drop the unit dropdown entirely IF zero callers pass non-empty `units` array (Day-1 confirmed: 1 caller, passes `units={[]}`). 
- If keeping unit dropdown for API compat: render `<NumericStepper>` + adjacent vibcoder `<Select size="sm">` in a Cluster.
- Keep public NumberField API unchanged (`label`, `error`, `hint`, `value`, `onChange`, `min`, `max`, `step`, `unit`, `units`, `onUnitChange`, `disabled`).
- For label/error/hint: wrap in vibcoder `<FormField>` like InputField/SelectField rewrites.

C2. tsc + vitest check.
C3. Browser verify: open Animation Editor → Iterations field → +/- buttons + keyboard work, value updates animation.iterations.

### Phase D — CSS drain + ship (~15 min)

D1. Re-run `/tmp/orphan-css-scan.py` — verify `.buildrick-number-*` family is now orphan.
D2. Update orphan list in `/tmp/css-orphan-drain.py`.
D3. Run drain. Expect ~7 rule blocks dropped (number-row, number-stepper, number-stepper:focus-within, number-stepper.has-error, number-btn × multiple states, number-btn-dec, number-btn-inc, number-input, number-unit). Approx -55 LOC.
D4. Verify components.css parses (no broken @media). `npx tsc --noEmit`. Vite dev hot-reload check.
D5. Commit sequence (each independently revertable):
   - `feat(vibcoder): add NumericStepper primitive (atom)` — Phase B work
   - `feat(vibcoder): rewrite NumberField to compose vibcoder NumericStepper` — Phase C work
   - `chore(vibcoder): drain N orphan CSS rules — number-* family` — Phase D work
D6. Push to origin/main.
D7. Update memory: `project_q2_day2_shipped_20260507.md` + MEMORY.md index entry.

## Risks

- **Stepper composition vs IconButton ambiguity (B4):** Decision is direct `<button>` markup. If future review prefers compose-via-IconButton, the change is local to NumericStepper.tsx — no consumer impact.
- **NumberField API drop — `unit`/`units`/`onUnitChange` props:** Day-1 inventory shows 1 caller passes `units={[]}`. If a future caller needs the unit dropdown, the API surface should be re-added. Keep `unit` (display-only) + drop `units`/`onUnitChange` is one option; or keep all three for API stability. **Decision deferred to C1** based on whether keeping the unit-select adds value vs YAGNI.
- **Visual regression in Animation Editor Iterations field:** Mitigation = browser verify in C3. If new NumericStepper visually drifts from old NumberField, adjust CSS spacing/border-radius in B3 to match.
- **Vibcoder primitive duplicate-API risk:** Confirm no existing `<Stepper>` or `<NumberInput>` in `editor/shared/vibcoder/` before B1 (per Day-1 lesson `feedback_inventory_before_deletion_wrappers.md`).

## Out of scope

- ChainControl primitive (separate Day-3 plan).
- CanvasOverlay primitives (separate Day-4 plan).
- `components.css` <300 LOC final target — depends on remaining canonical chrome migrations.
- Pre-existing 205 tsc baseline errors in canvas/shell/media paths.

## Done criteria

- All three commits land on main + push to origin.
- tsc baseline preserved (still 205 errors in pre-existing paths, no new errors).
- vitest passes for new NumericStepper test + existing NumberField tests (if any).
- Browser visual: Animation Editor Iterations field works (click +/-, type, arrow keys, shift+arrow, min/max clamping).
- `themes/components.css` < 470 LOC (516 - ~50 number-* drain).
- Live `buildrick-*` className refs drop from 50 → ~46.
- Memory updated.
