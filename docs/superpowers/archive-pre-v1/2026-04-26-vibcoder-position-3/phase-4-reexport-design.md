# Phase 4 — vibcoder chrome re-port (adapter shim layer)

**Date:** 2026-04-27
**Owner:** shahg
**Branch:** main (solo workflow per CLAUDE.md memory)
**Companion:** `phase-3-organisms-design.md`, `poc-findings.md`, `roadmap.md`
**Brainstorm:** 6 questions, 6 decisions locked
**Status:** Design approved, ready for plan

## Goal

Make all chrome consume vibcoder. Phase 1-3 built the primitive alphabet (24 atoms + 18 molecules + 16 organisms = 60 wrapper files at `editor/shared/vibcoder/`) but **zero** chrome currently imports from there. Phase 4 closes that gap by:

1. Re-porting every legacy primitive in `src/shared/ui/` (~21 mapped + 18 extensions = 39 files) via adapter shim pattern
2. Auditing every inline pattern across 280 chrome consumer files (`src/editor/`) for codemod-driven swap to vibcoder primitives

When Phase 4 ships, every `<button>`, `<input>`, `<Modal>`, etc. in chrome flows through a vibcoder wrapper. Phase 5 chrome integration becomes per-organism JSX swap commits in `editor/shell/`. Phase 5 also deletes the shim layer.

## Scope

**IN scope:**
- `src/shared/ui/*.tsx` — 39 legacy primitive files (21 mapped + 18 extensions)
- `src/editor/**/*.tsx` — 280 chrome consumer files (codemod-swap inline patterns)
- 21 jscodeshift codemods at `packages/editor/scripts/codemods/phase4/`
- ~150 net-new tests (~80 contract tests + ~50 codemod snapshot tests + ~20 T5 Modal extras)
- 2 new gates (Gate 23 import discipline + Gate 24 inline-pattern enforcement)

**OUT of scope (Phase 5):**
- Per-organism JSX swap in `editor/shell/*` (Topbar, StudioHeader, Inspector, etc.)
- Shim layer DELETION (Phase 5 codemods consumers off shims, then deletes)
- Floating-UI integration (anchor + offset + flip + shift)
- #93 PopoverArrow Radix-backing (becomes possible when Popover swaps to Radix engine)

**OUT of scope (Phase 6):**
- Playwright visual regression infra
- Per-route screenshot capture

**Non-goals:**
- No new vibcoder wrappers (alphabet locked at Phase 3)
- No legacy primitive deletion (Phase 5 owns)
- No new tokens or DESIGN.md changes

## Architecture

### 3-layer model

```
consumers (280 chrome files)
    │
    │  imports from @/shared/ui (existing barrel) — UNCHANGED
    ▼
shim layer (shared/ui/<X>.tsx) — adapter, throwaway, // PHASE 5 DELETE
    │
    │  renders vibcoder wrapper, translates legacy props
    ▼
vibcoder wrapper (editor/shared/vibcoder/<X>.tsx) — Phase 1-3 alphabet, locked
    │
    │  for overlays only
    ▼
engine (Radix.Dialog / Radix.Popover / cmdk / react-colorful) — Phase 3 deps
```

**Why shim layer (Q4 decision).** The shim contains prop divergence in one place per primitive. Consumers stay quiet (no codemod blast radius for atoms). Shim is throwaway with Phase 5 deletion date. Alternative C (rewrite all 280 consumers per codemod) has the same end state but distributes the prop reconciliation work into Phase 4 instead of Phase 5 — adapter shim is the cleaner cut.

### Adapter shim contract

Each shim file at `shared/ui/<X>.tsx`:

1. **Re-exports vibcoder TypeScript types** as the public surface
2. **Renders vibcoder wrapper internally** (no engine import here — engine stays inside vibcoder layer per Contract E2)
3. **Maps legacy props to vibcoder props** via inline switch/object lookup
4. **Throws at render** when legacy prop has no vibcoder mapping:
   ```tsx
   throw new Error(
     `[shared/ui/Button] legacy prop 'flat' has no vibcoder Button mapping. ` +
     `See poc-findings.md Phase 4 Q4 mapping table for migration. ` +
     `Phase 5 deletes this shim after consumers codemod off it.`
   );
   ```
5. **Carries `// PHASE 5 DELETE` comment** at top + JSDoc adaptation note documenting the prop translation table

Example shim:
```tsx
// PHASE 5 DELETE — Phase 4 adapter shim. Replaces hand-rolled Button.
/**
 * Adapter shim — translates legacy Button API to vibcoder Button.
 *
 * Prop translations (Phase 4 Q4 mapping):
 *   flat: boolean → variant: "ghost"
 *   loading: boolean → loading: boolean (passthrough)
 *   icon: ReactNode → leftIcon: ReactNode
 *
 * Untranslatable (THROWS):
 *   - none currently (revisit if legacy props surface that vibcoder doesn't model)
 *
 * @license BSD-3-Clause
 */
import { Button as VibcoderButton, type ButtonProps as VibcoderButtonProps } from "@/editor/shared/vibcoder";
import type { ReactNode } from "react";

export interface ButtonProps extends Omit<VibcoderButtonProps, "variant" | "leftIcon"> {
  flat?: boolean;
  icon?: ReactNode;
  variant?: VibcoderButtonProps["variant"];
}

export function Button({ flat, icon, variant, ...rest }: ButtonProps) {
  const resolved = flat ? "ghost" : (variant ?? "primary");
  return <VibcoderButton {...rest} variant={resolved} leftIcon={icon} />;
}
```

### Codemod pipeline

- `packages/editor/scripts/codemods/phase4/<primitive>.ts` — one jscodeshift codemod per primitive
- `packages/editor/scripts/codemods/_lib/` — shared helpers (AST query for JSX element by tag, import-path-aware swap, dry-run preview)
- Each codemod has matching `__tests__/<primitive>.codemod.test.ts` with input/output AST fixture pairs
- npm scripts: `pnpm --filter @buildrik/editor run codemod:phase4:button` (one per codemod, plus `:all` aggregate)
- Codemod output committed in same task commit as the shim file

**Codemod scope.** Most codemods touch chrome consumers (rewrite `<button>` JSX → `<Button>` import + JSX). Atom shims also installed in same task — the shim file IS the codemod target for the import side.

### Two new gates

**Gate 23 — shim layer is gate-keeper (post-T2):**
- Forbids `from "@/shared/ui/<MappedPrimitive>"` outside `shared/ui/` itself
- Prevents bypass — every consumer must go through the barrel which goes through the shim which goes through vibcoder
- Mapped primitives list = the 21 shims actually installed by T1-T6
- Implementation: `ds-grep-gates.sh` greps for direct imports of mapped primitives, excludes `shared/ui/` self-imports

**Gate 24 — inline-pattern enforcement:**
- Forbids inline `<button>`, `<input>`, `<select>`, `<textarea>` JSX in `src/editor/` consumers
- Baseline mode initially (capture current count), ratchet down per task as codemods clean up
- Same shape as Gate 14 (counted, baselined, ratcheted)
- **Use anchored regex from M5 fix** — `^[[:space:]]*//` for JS comment exclusion (NOT `//` global, which leaks per Gate 14 lesson)

## Tasks

### T1 — Button canary + Phase 4 infrastructure

**Why first:** Lowest-risk primitive (atom, mechanical swap). Establishes the codemod toolchain + shim template + per-task verification cadence + 2 new gates. All subsequent tasks reference T1 as canonical.

**Files:**
- Create: `packages/editor/scripts/codemods/_lib/{jsx-query.ts,import-swap.ts,dry-run.ts}` (shared helpers)
- Create: `packages/editor/scripts/codemods/phase4/button.ts` (codemod)
- Create: `packages/editor/scripts/codemods/phase4/__tests__/button.codemod.test.ts` (codemod tests)
- Modify: `packages/editor/src/shared/ui/Button.tsx` (replace internals with adapter shim)
- Create: `packages/editor/src/shared/ui/__tests__/Button.adapter.test.tsx` (contract tests)
- Modify: `packages/editor/scripts/ds-grep-gates.sh` (add Gate 23 + Gate 24, baseline mode)
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (extend with Gate 24 baseline)
- Modify: `packages/editor/package.json` (add `codemod:phase4:button` script)

**Steps (per Phase 3 cadence):**
1. Build codemod toolchain (jscodeshift helpers)
2. Write button.ts codemod
3. Write codemod tests (input/output fixture pairs)
4. Write Button.tsx adapter shim
5. Write contract tests (legacy prop surface still works)
6. Write Gate 23 + Gate 24 in ds-grep-gates.sh, capture initial baselines
7. Run codemod against chrome consumers (`pnpm exec jscodeshift -t scripts/codemods/phase4/button.ts src/editor/`)
8. Verify: vitest + DS gates + check-vibcoder-port all green
9. Commit

### T2 — Form atoms (Input, Select, Switch, Checkbox, Slider)

**Why grouped:** All low-risk form atoms with similar shim shape. 5 codemods + 5 shims in one task per Phase 3 mega-batch precedent.

**Files:** 5× `(codemod + codemod test + shim + contract test)` + Gate 24 baseline ratchet

**Notes:**
- Some shims may be near-trivial (props align 1:1 with vibcoder)
- Gate 24 baselines for `<input>`, `<select>`, `<textarea>` ratchet down by N (codemod swap counts)

### T3 — Display atoms (Spinner, Skeleton, Icon, IconButton, Kbd, Badge, Tag)

**Why grouped:** 7 visual atoms, no behavior change. Some may be re-export-only.

**Files:** 7× `(codemod + codemod test + shim + contract test)`

### T4 — Molecules (Card, Tabs, FormField, PanelHeader→surface-head, etc.)

**Files:** ~5× `(codemod + codemod test + shim + contract test)`

**Notes:**
- PanelHeader → vibcoder surface-head molecule (composition shape change, not 1:1)
- TextInput likely composes vibcoder input + form-field
- Code-quality risk: composition diffs more likely than atom-level

### T5 — Modal canary (alone — highest blast radius)

**Why alone:** T5 is Phase 4's hardest task. Modal swap touches:
- **Focus management:** Modal.tsx legacy uses `useFocusTrap` (1 of 2 call sites; Popover.tsx is the other) → vibcoder Modal uses Radix.Dialog internal focus trap
- **Portal mounting:** legacy `ReactDOM.createPortal` → vibcoder `OverlayMount` (Phase 3 lazy DOM singleton)
- **ARIA wiring:** legacy hand-rolls `aria-modal`/`aria-labelledby`/`role` → Radix.Dialog automates
- **Click-outside semantics:** legacy hand-rolls outside-click detection → Radix.Dialog handles via Overlay
- **Escape key:** legacy hand-rolls → Radix.Dialog handles

**Files:**
- Create: `packages/editor/scripts/codemods/phase4/modal.ts` + tests
- Modify: `packages/editor/src/shared/ui/Modal.tsx` (HEAVY adapter shim)
- Create: `packages/editor/src/shared/ui/__tests__/Modal.adapter.test.tsx` (~15-20 tests covering focus, portal, ARIA, escape, click-outside)

**Steps include explicit focus restoration verification.** When Modal closes, focus must return to the triggering element. Vibcoder Modal (Radix.Dialog) handles this automatically; the contract test guards the behavior.

### T6 — Popover + Tooltip + Toast (3 in one task; OPEN RISK)

**Open risk:** Toast and Tooltip mappings uncertain.
- **Toast:** Phase 3 dropped `@radix-ui/react-toast` at T2 cleanup commit `0fc750c` (NotificationCenter pivoted from toast queue to persistent panel). Legacy `shared/ui/Toast.tsx` may have NO vibcoder equivalent.
- **Tooltip:** May map to vibcoder Popover variant OR may be extension-only.

**T6 Step 1 = inventory:** Check vibcoder Popover supports tooltip variant. Check if any vibcoder primitive matches Toast shape. If NO mapping for one or both:
- Defer to T7 triage as keep-as-extension
- T6 still ships as ONE commit — just contains fewer shims (Popover only, or Popover + Tooltip)
- Document deferred items in T6 commit message + inline plan note

**Popover-specific:** Kills the 2nd of 2 useFocusTrap call sites. After T6 ships, useFocusTrap can be deleted (T7 cleanup or M8 polish).

**Files:** 1-3× `(codemod + codemod test + shim + contract test)` depending on T6.1 outcome

### T7 — Extensions triage (18)

**One-pass triage** of all 18 Buildrik-specific primitives in `shared/ui/` per SCOPE.md:
- Accordion, ColorSwatch, ContextMenu, CopyButton, ErrorMessage, ErrorState, HelpTooltip, Icons, InfoBanner, PanelHeader, PremiumBadge, QuickSwitcher, Resizable, SliderInput, Tooltip, TreeView, UpgradeGate, UpgradeModal

**Per-extension decision** in poc-findings.md Phase 4 section:
- **port-to-X** with vibcoder equivalent → ports happen in T7 commit
- **keep-as-extension** with rationale (no equivalent OR genuinely Buildrik-specific)

**Also handles T6 deferrals.** If T6 inventory deferred Toast/Tooltip, T7 captures the keep-as-extension decision for them (or schedules port if upstream landed something).

**Cleanup:** If T6 killed both useFocusTrap call sites, T7 deletes the hook + barrel re-export.

**Files:** 0-N shims + 0-N consumer files (depends on triage outcomes) + ~5-30 tests + poc-findings.md update

### M8 — Milestone (Phase 4 close-out)

**Files:**
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/poc-findings.md` (append Phase 4 section, ~250 lines)
- Modify: `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md` (status line)
- Modify: `packages/editor/scripts/.chrome-axioms-baseline` (final Gate 24 ratchet)
- Create: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/project_vibcoder_phase_4_shipped_<date>.md`
- Modify: `~/.claude/projects/-Users-shahg-Desktop-pencil-buildrik/memory/MEMORY.md` (index entry)

**Steps:**
1. Append `## Phase 4 findings (chrome re-port)` section to poc-findings.md covering: per-task summary table, per-primitive prop mapping table (Q4), T6 outcome, T7 triage outcomes (18 extensions), Gate 23 + Gate 24 final state, bundle delta measurement (FIRST non-zero — methodology + actual numbers vs ~925KB estimate), Phase 5 handoff list, conventions reaffirmed
2. Update README status line
3. Final Gate 24 ratchet (target: 0 for all primitives the codemods cleaned)
4. Bundle delta measurement: `pnpm exec vite build` at HEAD vs at M8 commit, capture dist/ size + per-asset hashes
5. Memory file + index entry
6. Final commit

## Tests

**No new galleries** (Phase 4 doesn't add new wrappers — gallery alphabet locked at Phase 3).

**~150 net-new tests across 8 tasks:**
- `shared/ui/__tests__/<Primitive>.adapter.test.tsx` × 21 shims, ~3-5 tests each → ~80 tests
- `scripts/codemods/phase4/__tests__/<primitive>.codemod.test.ts` × 21 codemods, ~2-3 tests each → ~50 tests
- T5 Modal extras (~15-20 tests): focus, portal, ARIA, escape, click-outside

**Existing tests stay** (~60 = 6 in `shared/ui/__tests__` + 54 consumer). Become regression net.
- `Popover.focus.test.tsx` is load-bearing for T6 useFocusTrap removal — must stay green.

**Per-task verification (canary cadence):**
1. `pnpm exec vitest run` — full suite stays green (1599 baseline → ~1750 at M8)
2. `bash scripts/ds-grep-gates.sh` — Gate 23 + Gate 24 at expected baseline (drops by N per task)
3. `bash scripts/check-vibcoder-port.sh` — vibcoder port discipline holds
4. `git diff --stat` — sanity check consumer file count touched matches expected codemod scope
5. `pnpm exec vite build` — production build succeeds (smoke check, not bundle measurement)

**Failure detection:**
- Adapter shim throws at render when legacy prop has no vibcoder mapping
- Vitest catches via `expect(...).toThrow(/'flat' has no vibcoder/)` in adapter tests
- Production renders surface as runtime errors with clear remediation pointer

## Bundle delta + Phase 5 handoff

### Bundle delta (FIRST non-zero in this arc)

- Phase 3 = 0 bytes (wrappers tree-shaken; no chrome imported them)
- Phase 4 = **~925 KB cold add expected** (Radix-{dialog,popover,portal,slot} + cmdk + react-colorful actually load now via shims)
- Methodology: `pnpm exec vite build` at HEAD vs at M8 commit, compare `dist/` size + per-asset hashes
- M8 records actual numbers; numbers replace estimates
- >2MB triggers investigation, NOT ship-block

### Phase 5 handoff

| Item | Source | Note |
|---|---|---|
| `shared/ui/<MappedPrimitive>.tsx` shim DELETION | T1-T6 ships shims | Phase 5 codemods consumers off shims, then deletes |
| Per-organism JSX swap in `editor/shell/*` | New from Phase 4 | Phase 5 swaps StudioHeader, Topbar, Inspector, etc. to use vibcoder organisms directly |
| Floating-UI integration | Phase 3 carry | Anchor + offset + flip + shift positioning |
| #93 PopoverArrow Radix-backing | Phase 3 carry | Possible after Popover Radix swap |
| #77 Icon sprite production-build | Phase 1 carry | Chrome integration phase blocker |
| T6 Toast/Tooltip resolution (if deferred) | T7 triage outcome | Phase 5 keep-or-drop per upstream evolution |
| T7 extension ports (if "port-to-X eventually") | T7 triage outcome | Phase 5 schedules per-extension |

## Risks (8)

| # | Risk | Mitigation |
|---|---|---|
| R1 | Prop divergence widespread | T1 canary builds Q4 mapping table; subsequent shims reference; throw-on-untranslatable surfaces gaps fast |
| R2 | Toast no vibcoder mapping (Phase 3 dropped Radix.Toast) | T6 inventory step. If confirmed, T7 keeps as extension |
| R3 | Tooltip mapping uncertain | T6 inventory step. Maps to Popover variant OR T7 keep-as-extension |
| R4 | Bundle delta exceeds ~925KB significantly | M8 measures. >2MB triggers investigation, NOT ship-block |
| R5 | Codemod blast radius (one bug = 280-file regression) | T1 canary proves toolchain on Button alone; snapshot tests catch transform bugs; per-task vitest run is gate |
| R6 | useFocusTrap removal regresses focus behavior | T5 contract tests verify focus restoration on Modal close + tab cycling. `Popover.focus.test.tsx` load-bearing for T6 |
| R7 | Gate 24 baseline rebase trap (M5 Gate 14 lesson) | Write Gate 24 explicit grep (not via `count_chrome`); use anchored `^[[:space:]]*//` exclusion |
| R8 | Solo workflow: bad codemod blocks subsequent commits | Per-task verification: vitest + gates + check-vibcoder-port. Abort task if not green. T1 sets the cadence |

## Decision log (Q1-Q6)

| Q | Decision | Rationale |
|---|---|---|
| Q1 | Wide audit (280 files) | A/B leave inline-pattern debt forever; C closes the loop. Multi-week scope accepted |
| Q2 | jscodeshift detection | AST > grep accuracy. Phase A toolchain reused. Per-codemod tests easy |
| Q3 | 8 tasks (hybrid) | Modal canary alone (highest blast radius). Atoms split form/display for cleaner blame. T7 extensions one-pass |
| Q4 | Adapter shim topology | Contains prop divergence in one place per primitive. Throwaway with Phase 5 deletion date |
| Q5 | Per-shim contract + codemod snapshot tests | Trust-existing-tests too thin. Visual regression deferred to Phase 6 |
| Q6 | All defaults | Codemod paths, 2 gates, T7 single-pass triage, throw-on-untranslatable, paths, bundle delta documented |

## Acceptance criteria (M8 close-out)

- All 24 DS gates green (22 existing + Gate 23 + Gate 24)
- 1599 baseline + ~150 net-new = ~1750 tests passing
- 21 jscodeshift codemods shipped at `scripts/codemods/phase4/` with matching tests
- 21 adapter shims at `shared/ui/<X>.tsx` with `// PHASE 5 DELETE` comment + JSDoc adaptation note
- 18 extensions triaged in poc-findings.md Phase 4 section (each: port-to-X OR keep-as-extension with rationale)
- Gate 24 baseline = 0 for all primitives the codemods cleaned (Button, Input, Select, Textarea, etc.)
- Bundle delta measured + documented in poc-findings.md (~925KB cold add expected)
- README status line: `Phase 4 — re-port complete (~21 shims + 18 extension decisions / 8 tasks)`
- Memory file + MEMORY.md index entry written
- Working tree clean (excluding `packages/editor/src/project/` untracked dump)
- Phase 5 chrome integration unblocked

**Total commits expected:** 8 task commits (T1-T7 + M8) + 0-N fixup commits as two-stage review surfaces issues during subagent-driven execution.
