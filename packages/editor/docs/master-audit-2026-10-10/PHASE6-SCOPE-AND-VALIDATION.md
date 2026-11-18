> **12 October final disposition:** Superseded for current status by [Phase 6 completion report](PHASE-6-COMPLETION-REPORT.md) and [final gate matrix](PHASE6-CURRENT-GATE-MATRIX.md). Older pending counts and open-gate notes below are historical. Explicit finite-scene restrictions remain limitations, not functional passes.

# Phase 6 — System and prototype work contract

Begins after PHASE-5-COMPLETION-REPORT.md. Scope is the user's requested design system and meaningful interactive prototype; application implementation and Code Connect source generation are deferred with Phases7/8.

## Locked inventory

Foundations: semantic colors, typography, spacing, radius, shadows/elevation, icon/control/panel sizes, grids, responsive rules, motion/reduced-motion and meaningful states. Preserve compatible existing Package/Primitives/text styles; isolate changed TO-BE values so AS-IS and earlier pages remain intact. Accent#1A56DB and Inter remain canonical. New proposal tokens must say they are proposed, with code syntax distinguished from current implemented values.

Components: buttons, inputs/property controls, select, tabs, tooltip, menu/context menu, dropdown/popover, dialog, panel header/section, tree/navigation item, toolbar/canvas control, color picker and notification. State variants include applicable default, hover, focus, selected, disabled, loading, error, inherited and mixed. Reuse the nine current TO-BE masters where suitable, preserve their IDs/instances, and bind foundations. Avoid a combinatorial variant explosion.

Prototype journeys: navigation/panels, context menus, Inspector selections/tabs, page switching and creation, component selection, Media choice/recovery, CMS setup/record return, Settings dirty return, responsive controls, important confirmations, Preview/mobile navigation and publishing checks/confirmation. Each journey needs a start, meaningful transition, return/cancel and explicit simulated or non-simulatable outcomes.

## Acceptance evidence

1. Native component/variant/token/style inventory with scopes, aliases, code syntax, bounds, representative bindings and existing-instance integrity.
2. Visual inspection of compact component state showcases; no unintentional clipping, empty labels or low-contrast active controls.
3. Actual Figma reactions and starting points read back from native state, with reachable destinations and no broken references.
4. Action ledger: important controls wired, disabled with reason, outside a covered modal, or individually documented as a simulation limitation. No blanket success for untested backend actions.
5. Representative journey traversal evidence and caller/cancel/recovery checks. Figma limitations are explicit; runtime keyboard/AT/persistence tests remain later.
6. Final requirement-by-requirement review of phases4/5/6 before claiming the active goal complete.

Discovery checkpoint: local source tokens read from `src/themes/tokens.generated.css`; existing Package/Primitives collections and eighteen text styles inspected. Published library discovery returned community kits, but targeted Button/surface/ui12 search returned no matches. Local TO-BE masters and compatible existing primitives therefore take priority; no competing framework is introduced.
