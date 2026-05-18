# Vibcoder Phase 2 Molecules — Design

**Date:** 2026-04-26
**Owner:** shahg
**Spec parent:** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/`
**Predecessor:** Phase 1 atoms (M3 milestone closed at commit `bcfeda1`)
**Status:** Approved, pending writing-plans handoff

## Goal

Port 18 vibcoder chrome molecules to React wrappers via Path B Hybrid (vendored CSS + className render). Establish slot-composition + controlled-state contracts that all 18 molecules share. Hand off to Phase 3 organisms with a stable molecule alphabet.

## Scope

18 chrome molecules per `SCOPE.md` CHROME bucket.

| Bucket | Molecules |
|--------|-----------|
| Navigation/composition (4) | card, form-field, section-head, surface-head |
| Interactive (5) | actionbar, breadcrumb, chipbar, color-trigger, tabs |
| Notification (4) | popover, toast, toggle-row, tile-meta |
| Specialized (4) | rail-tile, search-input, toolbar, uploader |
| Catch-up (1) | list-row (POC over-claim correction; mirrors Phase 1 tag) |
| **Total** | **18 chrome molecules** |

**Out of scope.** workspace-chip (DASHBOARD/MOBILE), table + table-frame (CMS). Deferred per `SCOPE.md` triage table.

## Inheritance from Phase 1 (no relitigation)

The following conventions are locked from Phase 1 and apply unchanged to Phase 2:

- Filename != classname (e.g., `IconButton.tsx` renders `bd-icon-btn`)
- Default-prop-value omits modifier class
- `forwardRef` + `displayName` on every wrapper
- State props pair with aria-* attrs
- Sibling exports in one file for related primitives (Spinner+StatusDot precedent)
- `Number.isFinite` + clamp for value-driven primitives
- Defensive `Omit<…>` for native HTML attr clashes
- Vendoring pipeline (4 codemods + bundle pin) unchanged
- Per-component template at `poc-findings.md` § "Per-component port template (locked)"
- `_galleryStyles.ts` for shared gallery layout primitives

See `poc-findings.md` § "Conventions reaffirmed" for the verified-against-25-wrappers list.

## API contracts (locked for Phase 2)

### Slot composition

For molecules composing multiple atoms in fixed positions:

- **Required structural slots → flat props.** TS-required (`label`, `title`, `count`). Compile-time catch for missing required content.
- **Variable content slot → React children.** The interactive primitive caller passes (input, action button, badge).
- **Optional decorative slots → flat-prop boolean OR object discriminator.** Mirror Phase 1 Label pattern (`info?: boolean | { onClick, "aria-label" }`).

**Applies to:** form-field, surface-head, section-head, toggle-row, tile-meta (5 molecules).

**Wrapper template:**

```tsx
interface FormFieldProps {
  label: string;                    // required slot, flat prop
  required?: boolean;               // decorative slot, flat boolean
  helper?: string;                  // optional slot, flat prop
  error?: string;                   // optional slot, flat prop
  disabled?: boolean;               // state
  children: ReactNode;              // content slot — caller passes the input
  className?: string;
}
```

### Controlled state

For molecules owning observable state:

- Wrapper accepts `value` + `onChange` (or `open` + `onOpenChange`) as **required** props.
- **No** `defaultValue` / `defaultOpen` (no uncontrolled mode).
- Wrapper renders state-derived classes + ARIA attrs from controlled value.
- **Internal `useState` forbidden** in molecule wrappers.

**Applies to:** popover, tabs, toast, color-trigger, search-input (5 molecules).

**Why no uncontrolled.** Editor chrome state lives in Composer + React state hooks. Uncontrolled wrappers hide state from coordination (close-all-popovers-on-navigate, persist tab via URL, restore search across mounts). Phase 1 Slider already proved this contract works.

### Compound subcomponent convention

For compound molecules with multiple sub-elements:

**Sibling exports in one file** (mirrors Phase 1 Spinner+StatusDot, Kbd+KbdSeq).

```tsx
// Tabs.tsx
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(...)
export const TabList = forwardRef<HTMLDivElement, TabListProps>(...)
export const Tab = forwardRef<HTMLButtonElement, TabProps>(...)
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(...)
```

Caller usage:

```tsx
<Tabs value={tab} onValueChange={setTab}>
  <TabList>
    <Tab id="layout">Layout</Tab>
  </TabList>
  <TabPanel for="layout">...</TabPanel>
</Tabs>
```

**Why sibling exports (not `Tabs.List` dot-notation):**

- Tree-shakable (each export is a separate import target)
- Matches Phase 1 precedent (no new pattern to learn)
- Grep-able by name
- Caller imports only what they use

**Applies to:** tabs, popover, card (header/body/footer), and any other compound molecule the source CSS surfaces sub-elements for.

## Per-batch deferred decisions

The spec acknowledges these patterns exist but defers the choice to per-batch implementer judgment.

### Polymorphism (per-molecule decision)

For molecules holding ordered child items:

- Default: composition (`<Toolbar><Button/>...</Toolbar>`)
- Choose data-driven (`items={[{kind, ...}]}`) only if source CSS docstring or HTML demo shows clear config-driven intent
- Choose uniform-children when items are homogeneous (chipbar, breadcrumb)

**Implementer flags choice in JSDoc + status report.** No spec-wide preset.

**Affected molecules:** toolbar, actionbar, chipbar, breadcrumb, tabs.

### Trigger element wiring (per-molecule decision)

For molecules with a trigger child needing internal state:

- Implementer picks `asChild` + cloneElement, render-prop, OR ref-forwarding
- Whatever picked must wire ARIA correctly (aria-expanded, aria-controls, aria-haspopup)
- Document choice in wrapper JSDoc

**Affected molecules:** popover, color-trigger.

## Cross-atom imports (new pattern)

Molecule wrappers import constituent atoms from sibling files in `editor/shared/vibcoder/`:

```tsx
// FormField.tsx
import { Label } from "./Label";
import { HelperText } from "./HelperText";

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, required, helper, children, ...rest }, ref) => (
    <div ref={ref} className="bd-form-field" {...rest}>
      <Label required={required}>{label}</Label>
      {children}
      {helper && <HelperText>{helper}</HelperText>}
    </div>
  ),
);
```

**Phase 1 precedent:** IconButton imports Icon. Pattern is established. Phase 2 exercises it heavily — at least 7 molecules import constituent siblings.

**Bundle-size concern:** negligible. Atoms are tiny; tree-shake handles unused exports.

## Task structure

6 tasks total, mirrors Phase 1 cadence (1 catch-up + 4 batches + 1 milestone).

| Task | Title | Scope |
|------|-------|-------|
| T1 | list-row catch-up | 1 molecule (canary for slot composition contract) |
| T2 | Batch 1 navigation/composition | 4 molecules: card, form-field, section-head, surface-head |
| T3 | Batch 2 interactive | 5 molecules: actionbar, breadcrumb, chipbar, color-trigger, tabs |
| T4 | Batch 3 notification | 4 molecules: popover, toast, toggle-row, tile-meta |
| T5 | Batch 4 specialized | 4 molecules: rail-tile, search-input, toolbar, uploader |
| T6 | M4 milestone | gallery index + Phase 2 findings + polish pass + spec README status |

**Workflow:** subagent-driven dispatch per task. Two-stage review per task (spec compliance + code quality). Solo workflow direct to main per `CLAUDE.md` memory — no PRs.

## Per-component template additions for molecules

Inherits Phase 1 template at `poc-findings.md` § "Per-component port template (locked)". Phase 2 appends 4 molecule-specific items the implementer must address per molecule:

1. **Cross-atom imports inventory** — wrapper JSDoc lists every sibling atom imported (e.g., "imports Label, HelperText").
2. **Slot composition shape** — flat-props/children breakdown documented in wrapper JSDoc.
3. **Controlled-state contract** — wrapper JSDoc declares "always-controlled — `value` + `onChange` required" if applicable.
4. **Sub-component manifest** — for sibling-export molecules (Tabs, Popover), wrapper JSDoc lists every export with its purpose.

## Vendoring pipeline (unchanged from Phase 1)

Per molecule:

1. Copy `docs/reference/vibcoder/components/molecules/<name>.css` → `packages/editor/src/themes/components/molecules/<name>.css`
2. Run codemod 1 (`bun packages/editor/scripts/vibcoder-codemod-1.mjs`)
3. Run codemod 2 (`bun packages/editor/scripts/vibcoder-codemod-2.mjs` — token fold; #73 may surface here)
4. Run codemod 3 (`bun packages/editor/scripts/vibcoder-codemod-3.mjs` — alias bridge regen)
5. Re-pin bundle (`bun packages/editor/scripts/vibcoder-bundle-pin.mjs`)
6. Variants discovery (`bun packages/editor/scripts/vibcoder-variants.mjs molecules/<name>`)
7. Wrapper + tests + gallery (.tsx + .html pair)
8. Update `packages/editor/src/editor/shared/vibcoder/index.ts` with new exports

## Polish pass scope (folded into M4 milestone commit)

All 6 open Phase 1 tuning items folded:

| # | Item | Action in M4 |
|---|------|--------------|
| #72 | Gallery convention sweep | Add ESLint rule preventing local declarations of `_galleryStyles` exports in `preview/vibcoder-*.tsx` |
| #73 | Codemod 2 fold-table extension | If any Phase 2 molecule triggered the fold table, document; else mark "no Phase 2 trigger, defer to Phase 3" |
| #74 | Switch button-reset footgun | Formally re-captured in Phase 3 chrome-consumer prep spec; closed as out-of-Phase-2 |
| #75 | Switch preventDefault test | Same — re-captured in Phase 3 spec; closed as out-of-Phase-2 |
| #76 | Thumb discriminated union refactor | Same — re-captured in Phase 3 spec; closed as out-of-Phase-2 |
| #79 | Gate 7 negative test | Add inline (5-line test) |

Plus any new tuning items surfaced during Phase 2 batches (mirrors Phase 1 #80 Slider NaN, #71 variants script fix).

## Cross-references

- **Source bundle:** `docs/reference/vibcoder/components/molecules/` (21 source files; we ship 18, defer 3)
- **Per-component template:** `poc-findings.md` § "Per-component port template (locked)" + Phase 1 conventions section
- **Phase 1 atom alphabet:** `packages/editor/src/editor/shared/vibcoder/index.ts` (25 components — molecules import these)
- **Variants script:** `packages/editor/scripts/vibcoder-variants.mjs` (now correctly classifies `selectable`/`pressed`/`pulse` as states)
- **Master gallery index:** `packages/editor/src/preview/vibcoder-index.html` (Phase 2 section appended at M4)
- **Spec README:** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/README.md`

## Success criteria

- [ ] 18 chrome molecule CSS files vendored at `packages/editor/src/themes/components/molecules/`
- [ ] 18+ React wrappers at `packages/editor/src/editor/shared/vibcoder/` (more than 18 if any compound molecule ships sibling exports — Tabs alone may ship 4)
- [ ] All molecule galleries serve 200 from dev server
- [ ] Master gallery index updated with Phase 2 section
- [ ] All 13 DS gates + 4 chrome-axiom gates + green-panel + Gates 19/21 + check-vibcoder-port green
- [ ] No new TS errors above baseline (188 at end of Phase 1)
- [ ] Polish pass items #72/#79 shipped; #73 documented
- [ ] Phase 2 findings section appended to `poc-findings.md`
- [ ] Spec README status updated: `[x] Phase 2 molecules — fan-out complete`
- [ ] M4 milestone commit
- [ ] Memory entry updated to `project_vibcoder_phase_2_shipped_<date>.md`

## Risks + mitigations

| Risk | Mitigation |
|------|------------|
| Slot composition contract breaks on first compound molecule | list-row catch-up canary surfaces it on simplest applicable molecule before fan-out |
| Controlled-state contract surfaces edge case (e.g., toast queue management) | Per-batch fixup loop (Phase 1 cadence) absorbs; no spec re-write |
| Polymorphism per-batch judgment varies wildly across batches | Spec acknowledges this is per-molecule; M4 findings doc captures actual choices made for cross-batch reference |
| Render-prop wiring on popover sets bad pattern for color-picker (Phase 3) | color-trigger ships in Batch 2 (interactive); popover ships in Batch 3 (notification) — color-trigger lands first, sets pattern |
| Cross-atom import bundle bloat | Negligible — atoms are tiny; tree-shake handles unused exports |
| Codemod 2 fold-table actually needed mid-batch | Implementer flags + applies inline (Gate 19 widening precedent from Phase 1 Batch 4); polish pass adopts |

## Cost estimate

Phase 1 actuals: ~4 hr CC for 23 atoms (vs ~15 hr roadmap estimate). Phase 2 has fewer items (18 vs 23) but richer APIs (compound molecules + slot composition + controlled state). Estimate: **~5-7 hr CC total** for 18 molecules + milestone. Subagent-driven dispatch + per-molecule template keeps the multiplier. Roadmap's "~1.5 weeks dispatched, ~4 commits" estimate predates Phase 1's measured velocity — actuals will likely beat it the same way Phase 1 did.

## Handoff

After spec approval, transition to `superpowers:writing-plans` skill to produce the detailed Phase 2 implementation plan at `docs/superpowers/plans/2026-04-26-vibcoder-phase-2-molecules.md`.
