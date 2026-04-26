# Vibcoder Phase 3 Organisms — Design

**Date:** 2026-04-27
**Owner:** shahg
**Spec parent:** `docs/superpowers/specs/2026-04-26-vibcoder-position-3/`
**Predecessor:** Phase 2 molecules (M4 milestone closed at commit `d146bb0` + cosmetic `a364de5`)
**Status:** Approved, pending writing-plans handoff

## Goal

Port 16 vibcoder chrome organisms to behavior-complete React wrappers. Each organism ships positioning, focus trap, keyboard nav, portal mounting, scroll lock, and ARIA via the engine layer (Radix UI primitives + cmdk + react-colorful) under a vibcoder CSS skin. Hand off to Phase 5 chrome integration with a stable, fully-functional organism set so Phase 5 collapses to per-organism JSX swap commits in `src/editor/shell/`.

## Scope

16 chrome organisms per `SCOPE.md` CHROME bucket.

| Cluster | Organisms | Engine |
|---------|-----------|--------|
| Layout-only (8) | topbar, footer, rail, left-panel, inspector, history-panel, empty-state, a11y-overlay | none — pure CSS + Phase 1+2 composition |
| Radix overlays (4) | overlay-mount, modal, drawer, notification-center | `@radix-ui/react-{dialog,toast,portal,slot}` |
| Companion-lib (2) | command-palette, color-picker | `cmdk`, `react-colorful` (inside `@radix-ui/react-popover`) |
| Composed (2) | pages-drawer, templates-drawer | Phase 3 Drawer + Phase 1+2 ListRow/Card |
| **Total** | **16 chrome organisms** | |

**Sibling export fan-out:** ~50 React components total (Contract C inheritance — siblings per organism file).

**Out of scope.** asset-library, sheet (DASHBOARD/MOBILE per SCOPE.md). canvas (ENGINE wrapper-only — separate Phase 5 work). Deferred per `SCOPE.md` triage table.

## Architecture

Three-layer model. Layer 2 is NEW in Phase 3 (Phase 1+2 organisms had no engine layer).

```
┌──────────────────────────────────────────────────────────────┐
│  Phase 3 wrappers   src/editor/shared/vibcoder/*.tsx         │
│  - Apply vibcoder CSS classnames                              │
│  - Compose sibling exports (Contract C)                       │
│  - Translate vibcoder-shaped props → Radix props              │
│  - Enforce E2 (no engine types in public API)                 │
├──────────────────────────────────────────────────────────────┤
│  Behavior engines (NEW)   ~40-50kb gzipped                    │
│  @radix-ui/react-{dialog,toast,portal,slot,popover}           │
│  cmdk · react-colorful                                        │
│  Floating-UI (transitive via Radix.Popover)                   │
│  - Focus trap, scroll lock, click-outside, Esc, ARIA, portal  │
├──────────────────────────────────────────────────────────────┤
│  Vibcoder CSS skin   src/themes/components/organisms/*.css    │
│  - Visual styling only                                        │
│  - --buildrick-* canonical tokens + --bd-* aliases            │
└──────────────────────────────────────────────────────────────┘
```

**Cascade:** `@layer tokens, components, overrides;` (unchanged from Phase 1+2). Vendored CSS lands in `components` layer.

**Boundary clarity:** Wrappers never import legacy chrome (`src/shared/ui/*`). Legacy chrome unchanged. No editor shell modifications. All integration is parallel-impl during Phase 3-5 window. Bundle GROWS (+~32 kb gzipped) until Phase 5 swap deletes legacy.

## Inheritance from Phase 1+2 (no relitigation)

All Phase 1+2 conventions and contracts apply unchanged to Phase 3:

**Conventions (Phase 1):**
- Filename != classname (e.g., `Modal.tsx` renders `bd-modal`)
- Default-prop-value omits modifier class
- `forwardRef` + `displayName` on every wrapper
- State props pair with aria-* attrs
- `Number.isFinite` + clamp for value-driven primitives
- Defensive `Omit<…>` for native HTML attr clashes
- `e.defaultPrevented` escape hatch for click-handler composition
- Vendoring pipeline (4 codemods + bundle pin) unchanged
- Per-component template at `poc-findings.md` § "Per-component port template (locked)"

**Contracts (Phase 2):**
- **A — Slot composition.** Required slots = flat props. Variable content = children.
- **B — Always-controlled state.** `open` + `onOpenChange` REQUIRED. NO `defaultOpen`. NO uncontrolled mode.
- **C — Sibling exports in same file.** Modal.tsx exports Modal + ModalTrigger + ModalContent + ModalClose + ModalTitle + ModalDescription + ModalFooter.
- **D — Cross-atom + cross-molecule imports + trigger wiring.** Phase 3 organisms compose Phase 1 atoms + Phase 2 molecules freely. Trigger wiring via E1 (asChild).

See `poc-findings.md` § Phase 2 conventions section for the verified-against-46-wrappers list.

## API contracts (locked for Phase 3)

Five new contracts on top of Phase 2's A-D.

### E1 — asChild trigger composition

Every organism with a trigger ships `[Organism]Trigger` sibling. Trigger accepts `asChild: boolean` prop. When `asChild={true}`, single-child requirement validated in dev mode. Caller's child receives ARIA props + ref via `Radix.Slot` semantics.

**Pattern:**

```tsx
<Modal open={open} onOpenChange={setOpen}>
  <ModalTrigger asChild>
    <IconButton icon="settings" />
  </ModalTrigger>
  <ModalContent>
    <ModalTitle>Confirm action</ModalTitle>
    <ModalDescription>Are you sure?</ModalDescription>
    <ModalClose>Cancel</ModalClose>
  </ModalContent>
</Modal>
```

**Applies to:** Modal, Drawer, NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer (7 organisms).

### E2 — Engine encapsulation

Public API of Phase 3 organism MUST NOT export Radix/cmdk/react-colorful types. Wrapper props are vibcoder-named. Internal engine imports stay internal — barrel never re-exports `@radix-ui/react-*`, `cmdk`, or `react-colorful`. Phase 5 chrome consumers import only from `editor/shared/vibcoder/`.

**Enforcement:** ESLint rule `no-engine-public-export` at `packages/editor/eslint-rules/no-engine-public-export.cjs`. Forbids re-exports from configured module names list.

**Wrapper template:**

```tsx
// SHIPPING (E2-compliant)
import * as RadixDialog from "@radix-ui/react-dialog";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modal?: boolean;
  children: ReactNode;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(({ open, onOpenChange, ...rest }, ref) => (
  <RadixDialog.Root open={open} onOpenChange={onOpenChange}>{rest.children}</RadixDialog.Root>
));
Modal.displayName = "Modal";

// FORBIDDEN (E2 violation — leaks Radix types)
export type { DialogProps } from "@radix-ui/react-dialog"; // ❌
```

### E3 — Portal discipline

All overlay organisms (Modal, Drawer, NotificationCenter, CommandPalette, ColorPicker, plus Phase 2 Popover/Tooltip/Menu when wired) portal through single `#vibcoder-overlay-root` (mounted by OverlayMount organism at app root). Never `createPortal(node, document.body)` directly. Stack ordering managed centrally via overlay-mount, not z-index wars.

**Enforcement:** Grep gate added to `npm run ds:gates` chain. Forbids `document.body` substring in `editor/shared/vibcoder/*.tsx`. Allow-list: OverlayMount.tsx itself (it owns the root).

### E4 — Companion-lib boundary

cmdk types stay internal to CommandPalette wrapper. react-colorful types stay internal to ColorPicker wrapper. Vibcoder-shaped props at boundary.

**Example — ColorPicker:**

```tsx
// SHIPPING (E4-compliant)
export interface ColorPickerProps {
  value: string;            // hex string, vibcoder-shaped
  onChange: (hex: string) => void;
}

import { HexColorPicker } from "react-colorful";

export const ColorPicker = ({ value, onChange }: ColorPickerProps) => (
  <HexColorPicker color={value} onChange={onChange} className="bd-color-picker" />
);

// FORBIDDEN (E4 violation — leaks react-colorful Color type)
export type { Color } from "react-colorful"; // ❌
```

**Enforcement:** Same ESLint rule as E2 (`no-engine-public-export`), scoped to cmdk + react-colorful module names.

### E5 — Stateful gallery harness mandatory (overlay organisms only)

Every Phase 3 organism with open/close state ships a stateful gallery using shared `<DemoTrigger>` helper at `src/preview/_lib/DemoTrigger.tsx`. NO static `open={true}` shortcuts. Gallery file pattern: useState + DemoTrigger + organism.

**Applies to:** Modal, Drawer, NotificationCenter, CommandPalette, ColorPicker, PagesDrawer, TemplatesDrawer (7 organisms). Layout-only organisms (Topbar, Footer, Rail, LeftPanel, Inspector, HistoryPanel, EmptyState, A11yOverlay, OverlayMount) ship inline static demos — no DemoTrigger needed because there's no behavior to trigger.

**DemoTrigger contract:**

```tsx
// src/preview/_lib/DemoTrigger.tsx
interface DemoTriggerProps {
  label: string;
  children: (open: boolean, setOpen: (next: boolean) => void) => ReactNode;
}

export function DemoTrigger({ label, children }: DemoTriggerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="demo-trigger">
      <button onClick={() => setOpen(true)} className="bd-btn">{label}</button>
      {children(open, setOpen)}
    </div>
  );
}
```

**Gallery template:**

```tsx
// src/preview/vibcoder-modal.tsx
import { DemoTrigger } from "./_lib/DemoTrigger";
import { Modal, ModalContent, ModalTitle, ModalClose } from "@/editor/shared/vibcoder";

export default function ModalGallery() {
  return (
    <DemoTrigger label="Open modal">
      {(open, setOpen) => (
        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent>
            <ModalTitle>Confirm action</ModalTitle>
            <p>Are you sure?</p>
            <ModalClose>Cancel</ModalClose>
          </ModalContent>
        </Modal>
      )}
    </DemoTrigger>
  );
}
```

**Enforcement:** ESLint rule `no-hardcoded-open-prop` scoped to `src/preview/vibcoder-{modal,drawer,popover,menu,command-palette,notification-center,color-picker,pages-drawer,templates-drawer,color-trigger}.tsx`. Forbids `open={true}` literal as JSX attribute on these gallery files.

## Organism inventory

### Cluster 1 — Layout-only (8) · no engine

| Organism | Sibling exports | Composes |
|----------|-----------------|----------|
| Topbar | Topbar · TopbarBrand · TopbarActions | Phase 1 Button, IconButton |
| Footer | Footer · FooterStatus · FooterActions | Phase 1 IconButton |
| Rail | Rail · RailGroup | Phase 2 RailTile |
| LeftPanel | LeftPanel · LeftPanelHeader · LeftPanelBody | Phase 2 SectionHead |
| Inspector | Inspector · InspectorSection · InspectorHeader | Phase 2 SurfaceHead |
| HistoryPanel | HistoryPanel · HistoryItem | Phase 2 ListRow |
| EmptyState | EmptyState · EmptyStateIcon · EmptyStateTitle · EmptyStateDesc · EmptyStateAction | Phase 1 Icon, Button |
| A11yOverlay | A11yOverlay | none (debug overlay) |

### Cluster 2 — Radix overlays (4)

| Organism | Sibling exports | Engine |
|----------|-----------------|--------|
| OverlayMount | OverlayMount | `@radix-ui/react-portal` |
| Modal **(T1 canary)** | Modal · ModalTrigger · ModalContent · ModalClose · ModalTitle · ModalDescription · ModalFooter | `@radix-ui/react-dialog` |
| Drawer | Drawer · DrawerTrigger · DrawerContent · DrawerClose · DrawerTitle · DrawerDescription | `@radix-ui/react-dialog` + `data-side` variant |
| NotificationCenter | NotificationCenter · NotificationItem · NotificationProvider | `@radix-ui/react-toast` |

### Cluster 3 — Companion-lib (2)

| Organism | Sibling exports | Engine |
|----------|-----------------|--------|
| CommandPalette | CommandPalette · CommandPaletteInput · CommandPaletteList · CommandPaletteItem · CommandPaletteGroup · CommandPaletteEmpty | `cmdk` |
| ColorPicker | ColorPicker · ColorPickerSwatch · ColorPickerInput | `react-colorful` inside `@radix-ui/react-popover` |

### Cluster 4 — Composed (2) · depends on T2's Drawer

| Organism | Sibling exports | Composes |
|----------|-----------------|----------|
| PagesDrawer | PagesDrawer · PagesDrawerItem · PagesDrawerGroup | Phase 3 Drawer + Phase 2 ListRow |
| TemplatesDrawer | TemplatesDrawer · TemplatesDrawerItem · TemplatesDrawerCategory | Phase 3 Drawer + Phase 2 Card |

### Phase 2 carry-forward

PopoverArrow stub from Phase 2 (follow-up #93) → replaced with re-export of `RadixPopover.Arrow` as `PopoverArrow` sibling on existing Phase 2 Popover wrapper. Closes #93.

## Tasks

Same subagent-driven cadence as Phase 1+2. One subagent per task. Two-stage review per task (spec compliance → code quality). Commit on completion + 0+ fixup commits as review surfaces issues. Solo workflow direct to `main` per CLAUDE.md memory.

### T1 — Modal canary (standalone)

**Scope:** 1 organism (Modal + 7 sibling exports). Proves all Phase 3 contracts at once.

**Subagent must:**

- Install `@radix-ui/react-dialog` + `@radix-ui/react-portal` + `@radix-ui/react-slot`
- Vendor `modal.css` from bundle into `src/themes/components/organisms/`
- Build wrapper composing Radix.Dialog with vibcoder CSS classnames
- Ship `<DemoTrigger>` shared helper at `src/preview/_lib/DemoTrigger.tsx`
- Ship stateful gallery (`src/preview/vibcoder-modal.tsx`) using DemoTrigger
- Add ESLint rule `no-engine-public-export` at `packages/editor/eslint-rules/`
- Add ESLint rule `no-hardcoded-open-prop` at `packages/editor/eslint-rules/`
- Add grep gate for E3 portal discipline to `npm run ds:gates` chain
- Tests (~25-30): contracts E1/E2/E5, sibling export composition, vibcoder CSS class application, asChild forwarding

**Acceptance:** All 9 contracts (A-D inherited + E1-E5) verified on Modal. T2 inherits proven pattern.

### T2 — Mega-batch (13 organisms)

**Scope:** Cluster 1 (8 layout-only) + Cluster 2 remaining (3 Radix overlays — OverlayMount, Drawer, NotificationCenter) + Cluster 3 (2 companion-lib — CommandPalette, ColorPicker).

**Intra-task ordering (REQUIRED):**

1. OverlayMount FIRST (E3 portal root — all subsequent overlays depend on it)
2. Drawer + NotificationCenter (Radix overlays portal through OverlayMount)
3. CommandPalette + ColorPicker (companion-lib organisms portal through OverlayMount)
4. Layout-only batch (8 organisms — order independent)

**Subagent must:**

- Install `@radix-ui/react-toast` + `@radix-ui/react-popover` + `cmdk` + `react-colorful`
- Vendor 13 organism CSS files from bundle
- Build 13 wrappers per template
- Ship 13 stateful galleries using `<DemoTrigger>` (layout-only galleries can use static demo since no open/close state — but use DemoTrigger pattern anyway for consistency)
- Verify ESLint rules from T1 pass on all 13 wrappers
- Verify E3 grep gate passes
- Tests (~25-30 per organism × 13 ≈ 350-400 tests)

**Review surface:** Largest of any Phase 3 task. Spec reviewer reads contracts E1-E5 against each organism. Code reviewer audits for engine type leaks (E2/E4 violations), hardcoded portals (E3 violations), static gallery shortcuts (E5 violations).

### T3 — Composed drawer variants (2 organisms)

**Scope:** PagesDrawer + TemplatesDrawer. Each composes T2's Drawer + Phase 2 ListRow (PagesDrawer) or Phase 2 Card (TemplatesDrawer).

**Subagent must:**

- Vendor pages-drawer.css + templates-drawer.css from bundle
- Build wrappers composing Drawer + tree (PagesDrawer) / grid (TemplatesDrawer)
- Ship 2 stateful galleries
- Tests (~10-15 per organism)

**Acceptance:** Both organisms render via T2's Drawer wrapper, no direct Radix imports.

### M5 — Milestone task

**Scope:** Close-out work matching Phase 1 M3 + Phase 2 M4 shape.

**Subagent must:**

- Update master gallery index (`src/preview/vibcoder-index.html`) — append Phase 3 section with 16 entries
- Append Phase 3 findings section to `poc-findings.md` — per-organism CSS↔DOM alignment notes, asChild patterns, batch sequencing lessons, bundle delta measurement
- Update spec README status to "Phase 3 organisms — fan-out complete (16 organisms / ~54 wrappers / 4 batches)"
- Polish pass:
  - Q9c: PopoverArrow stub → `RadixPopover.Arrow` re-export (closes #93)
  - Q9d: Gate 14 JSDoc parity with Gate 19 (closes #91)
- Bundle delta measurement via `npm run build` + bundlephobia, recorded in findings
- Verify all ESLint rules + grep gate passing on full Phase 1+2+3 surface
- Memory update: new `project_vibcoder_phase_3_shipped_*.md` + MEMORY.md index entry

**Sequencing diagram:**

```
T1 (Modal canary, 7 siblings)
  ↓
T2 (mega-batch, 13 organisms)
  ↓
T3 (composed, 2 organisms — depends on T2's Drawer)
  ↓
M5 (milestone + polish + findings)
```

**Estimated wall-clock:** 6-8 hr per Q5 estimate. T1 highest-risk (canary), T2 longest review surface, T3+M5 small.

## Galleries

Per Q6=B + E5. Every organism ships a stateful gallery using shared `<DemoTrigger>`. Master gallery index (`src/preview/vibcoder-index.html`) gets new "Phase 3 — organisms (16 source CSS / ~54 wrappers)" section linking each gallery file. Manual smoke layer per Q7=A — open gallery in browser, hit Esc, click outside, Tab through.

Layout-only organisms (Topbar, Footer, Rail, LeftPanel, Inspector, HistoryPanel, EmptyState, A11yOverlay, OverlayMount) ship inline static demos — they have no open/close state, so DemoTrigger doesn't apply (per E5 scope). Gallery file pattern is just `export default function FooterGallery() { return <Footer>…</Footer>; }`.

## Tests

Per Q7=A. vitest + jsdom + @testing-library/react + userEvent. Same infra as Phase 1+2.

Test surface limited to what Phase 3 ADDS on top of engines:

- Markup correctness — vibcoder CSS classes applied (`bd-modal`, `bd-modal__overlay`, etc.)
- Sibling export composition — Modal + ModalTrigger + ModalContent renders together correctly
- asChild boundary — caller's child receives ARIA props + ref
- Phase 3 contracts — E1 single-child validation in dev, E2/E4 type encapsulation, E5 mandatory DemoTrigger

Out of scope: focus trap behavior, click-outside, Esc handling, scroll lock, positioning, ARIA correctness of Radix internals. Radix tests them upstream. Re-testing = duplicate work + false confidence.

**Estimated test count:** ~25-30 tests per organism × 16 = ~400 net-new tests. Combined with Phase 1+2: 545 + ~400 = ~945 total vibcoder tests at M5 close.

## Integration boundary

Phase 3 builds new layer alongside existing chrome. **No editor shell changes in Phase 3.** No imports from `editor/shell/*` reference Phase 3 organisms.

**Untouched in Phase 3 (Phase 5 reconciles):**

- `src/editor/shell/AquibraStudio.tsx` — still imports legacy chrome
- `src/shared/ui/Modal.tsx` (~254 lines, hand-rolled, still active)
- `src/shared/ui/Popover.tsx` (~169 lines, still active)
- `src/shared/ui/Tooltip.tsx` (~165 lines, still active)
- `src/shared/hooks/useFocusTrap.ts` — Radix has internal trap; reconcile in Phase 5
- `src/features/design-system/ui/colors/ColorPicker.tsx` (~332 lines, still active) — Phase 3 ships parallel ColorPicker

**Bundle behavior during Phase 3-5 window:**

- Bundle GROWS by ~32 kb gzipped (new Radix + cmdk + react-colorful + Phase 3 wrappers)
- Phase 3 organisms exist in tree with galleries + tests
- Gallery preview routes (`src/preview/vibcoder-*.tsx`) are dev-server-only per existing convention (Phase 1+2 atoms/molecules behave identically). They are NOT in the production editor bundle. Production bundle adds only the new Radix/cmdk/react-colorful deps + Phase 3 wrapper code, which sits unused (no editor shell imports it) until Phase 5 wiring.
- Tree-shaking caveat: if Vite's prod build cannot prove Phase 3 wrappers are unused (e.g., barrel re-exports drag them in), they ship. M5 measures actual delta to confirm.

**Risk:** Two parallel impls during Phase 3-5 window means divergent bug fixes. Mitigation: Phase 5 timeline matters. Don't let Phase 3 → Phase 5 gap exceed 4-6 weeks.

## Bundle delta budget

| Item | Delta (gzipped) |
|---|---|
| `@radix-ui/react-dialog` (Modal + Drawer share) | +9 kb |
| `@radix-ui/react-toast` (NotificationCenter) | +6 kb |
| `@radix-ui/react-portal` (OverlayMount) | +1 kb |
| `@radix-ui/react-slot` (asChild engine for E1) | +0.5 kb |
| `@radix-ui/react-popover` (ColorPicker container) | +5 kb |
| `cmdk` (CommandPalette) | +5 kb |
| `react-colorful` (ColorPicker) | +3 kb |
| Phase 3 wrappers (~16 files × ~30 lines) | ~3 kb gzipped |
| **Phase 3 ship total** | **~32 kb gzipped added** |
| Phase 5 deletes (`src/shared/ui/Modal.tsx`, `Popover.tsx`, `Tooltip.tsx`, etc.) | -~15 kb gzipped |
| Phase 5 ColorPicker reconcile (delete legacy 332-line impl) | -~8 kb gzipped |
| **Phase 5 net** | **~9 kb gzipped net add** |

Estimates are upper-bound (Radix tree-shakes per primitive). Verified by M5 task — actual `npm run build` size measurement recorded in `poc-findings.md`.

## Risks

1. **T2 mega-batch intra-task ordering.** OverlayMount must ship FIRST inside T2 dispatch (E3 portal root). Drawer/NotificationCenter/CommandPalette/ColorPicker depend on it. Mitigation: T2 plan task explicitly lists organism order; subagent prompt locks ordering; spec reviewer catches violations.

2. **Two parallel Modal/Popover/Tooltip impls during Phase 3-5 window.** Bundle bloat + divergent bug risk. Mitigation: Phase 5 timeline becomes the lever — don't exceed 4-6 weeks.

3. **Radix asChild gotchas.** Single-child requirement, ref forwarding required on caller's child, doesn't merge with `React.cloneElement`'s children. Mitigation: T1 canary surfaces; E1 contract enforces single-child via dev-mode check; Phase 1+2 wrappers all use forwardRef so pattern is established.

4. **Focus trap conflict deferred.** Radix uses internal focus trap. Existing chrome's `useFocusTrap` hook still in tree. Two trap impls during Phase 3-5 window. Mitigation: deferred to Phase 5 — Phase 3 doesn't touch `useFocusTrap`. Phase 5 reconcile commit drops `useFocusTrap` if no consumers remain.

5. **CSS structure mismatch.** Radix DOM structure may not match vibcoder CSS class structure for some primitives. Mitigation: handled per-organism in T1-T3. T1 canary surfaces Modal mismatches. If patterns repeat (e.g., Radix DialogPortal renders extra div that vibcoder CSS doesn't expect), document in `poc-findings.md` as a Phase 3 finding. Vendoring fix-policy (#82) applies when source-edit makes more sense than gate-widening.

6. **Bundle delta estimates are upper-bound.** Radix tree-shaking depends on import patterns. Mitigation: M5 measures actual via `npm run build`. If real number exceeds budget by >20%, surface in findings + revisit Phase 5 timeline.

## Phase 5 handoff

What Phase 3 hands forward to Phase 5 chrome integration:

- 16 Phase 3 organisms in `src/editor/shared/vibcoder/` with stateful galleries + tests
- All 9 contracts (A-D inherited + E1-E5) enforced via ESLint + grep gates
- `poc-findings.md` Phase 3 section documents per-organism CSS↔DOM alignment, asChild patterns, batch sequencing lessons
- Bundle delta measured + recorded
- Open Phase 5 items recorded:
  - Editor shell rewire scope per organism (`src/editor/shell/AquibraStudio.tsx` and downstream)
  - `useFocusTrap` reconciliation (delete or migrate consumers to Radix trap)
  - Legacy chrome file deletions (`src/shared/ui/Modal.tsx`, `Popover.tsx`, `Tooltip.tsx`, etc.)
  - ColorPicker reconcile (delete legacy 332-line impl, point all consumers to vibcoder ColorPicker)

## Non-goals (explicit)

- NOT touching `src/editor/shell/*` (Phase 5 owns shell rewire)
- NOT touching `src/shared/ui/*` (Phase 5 deletes after rewire)
- NOT touching `src/shared/hooks/useFocusTrap.ts` (Phase 5 reconciles)
- NOT touching existing ColorPicker at `src/features/design-system/ui/colors/ColorPicker.tsx` (Phase 5 reconciles)
- NOT virtualization for HistoryPanel (deferred to Phase 5 if needed)
- NOT Storybook-style multi-state galleries (Q6=B static stateful per gallery)
- NOT swipe gestures for Drawer (Q9a default — Radix.Dialog + CSS, vaul deferred indefinitely; editor is desktop-only per CLAUDE.md)
- NOT custom Toast queue manager (Q9b default — Radix.ToastProvider native pattern)

## M5 acceptance criteria

- All 16 organisms shipped at `src/editor/shared/vibcoder/`
- All 16 galleries shipped at `src/preview/vibcoder-{organism}.tsx`
- Master gallery index updated (Phase 3 section with 16 entries)
- ~400 net-new tests passing (~945 total vibcoder tests including Phase 1+2)
- ESLint rules `no-engine-public-export` + `no-hardcoded-open-prop` shipped + passing
- Grep gate for E3 portal discipline shipped + passing
- `poc-findings.md` Phase 3 section appended (per-organism findings + bundle delta + Phase 5 handoff)
- Spec README status updated to "Phase 3 organisms — fan-out complete (16 organisms / ~54 wrappers / 4 batches)"
- Memory updated: new `project_vibcoder_phase_3_shipped_*.md` entry + MEMORY.md index
- Phase 2 follow-ups #91 + #93 closed via M5 polish; #82, #89, #90, #92 stay pending (Phase 2-internal items, no Phase 3 surface)

## Decision log (brainstorm Q1-Q9)

| Q | Decision | Rationale |
|---|----------|-----------|
| Q1 | C — Wrappers + full behavior | Organisms are behavior; splitting wrappers from behavior creates artificial Phase 5 work |
| Q2 | D — Radix wholesale | Fastest fan-out (~6-8 hr), battle-tested, smallest hand-rolled surface |
| Q3 | B — asChild + sibling exports (compound API) | Idiomatic Radix; Phase 2 Contract C already established sibling exports |
| Q4 | A1 + B1 — cmdk + react-colorful | Smallest companion libs; Radix-style API; ~8 kb total |
| Q5 | B2 — 4 tasks (T1 canary + T2 mega-13 + T3 composed-2 + M5) | Honors mega-batch spirit while keeping composed-on-drawer dependency clean |
| Q6 | B — Stateful galleries via `<DemoTrigger>` | Mirrors Radix docs; gallery IS smoke test; Phase 5 consumers copy gallery shape |
| Q7 | A — jsdom + RTL only | Trust Radix for behavior; test only what we add (markup + composition + contracts) |
| Q8 | M2 — All 5 new contracts (E1-E5) enforced | Each is a small ESLint rule or grep gate; cheap to add now, hard to retro-fit |
| Q9a | Default — Radix.Dialog + CSS for Drawer | Editor desktop-only; vaul swipe gestures unnecessary |
| Q9b | Default — Radix.ToastProvider native queue | Native Radix pattern, no custom queue manager |
| Q9c | Default — PopoverArrow stub → `RadixPopover.Arrow` re-export | Closes #93; aligns with E2 (engine-backed, not hand-rolled) |
| Q9d | Default — fold #91 + #93 into M5 polish; #82/#89/#90/#92 stay pending | Only fold items touching Phase 3 surface |
