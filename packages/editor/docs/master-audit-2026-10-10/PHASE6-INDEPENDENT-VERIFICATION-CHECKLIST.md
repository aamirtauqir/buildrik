# Phase 6 independent verification checklist

10 October 2026. This checklist derives from the user's authorized Phases 4–6 outcome as recorded in [the acceptance checklist](PHASE-4-5-6-ACCEPTANCE-CHECKLIST.md), its twelve representative journeys, [Phase 6 scope](PHASE6-SCOPE-AND-VALIDATION.md), and the closed Phase 5 report. It does not invent new product features, require every type permutation, or authorize application implementation. Root serializes Figma mutations. This preparation performed read-only Figma inspection and documentation writes only.

## Requirements and evidence required to close

| Requirement | Final evidence | Pass boundary |
|---|---|---|
|P6-01 Foundations|Collection/variable/style inventory with IDs, scopes, aliases, proposed code syntax, values/modes; semantic mapping for color/type/space/radius/elevation/control/panel/grid/motion|Chrome separated from site Brand; canonical Inter/#1A56DB; compatible primitives reused; original and AS-IS values not changed accidentally|
|P6-02 Families|Native component-set/master inventory for buttons, property/input/select, tabs, tooltip, menu/popover, dialog, panel/section, tree/nav, toolbar/canvas control, picker, notification, used table/workspace compositions|Reusable native relationships and appropriate Auto Layout; count alone is not completeness|
|P6-03 States|Compact showcases for applicable default/hover/focus/selected/disabled/loading/error/inherited/mixed and relevant pressed/success states|Valid combinations documented; no arbitrary cross-product. Disabled reasons remain readable|
|P6-04 Adoption|Master IDs preserved where reused; sample original instances before/after binding; named exceptions for fixture/site content|No AS-IS mutation, orphaned instances or per-workspace duplicate kit. Binding changes do not clip text|
|P6-05 Connectivity|Reaction readback and graph for J-01–12 with genuine source controls, actual destination IDs and start points|Entry, meaningful result and return/cancel; no navigation to unrelated frame merely to make a button clickable|
|P6-06 Recovery|Dirty/invalid/refused/failed/retry and destructive-confirm/cancel branches, including R01|Honest finite simulation, target/caller retained, no real service effects; no generic success for failed work|
|P6-07 Responsive|E12/E13/E14/E20/E21/E22/E23 plus Mobile editor/Preview context; explicit scroll and overlay model|Browser viewport versus site breakpoint distinct; intentional scroll clipping is not loss. No implicit zoom reset between linked frames|
|P6-08 Per-control accounting|Action audit matching actual visible controls, including disabled and covered controls|Each control wired, disabled with reason, covered/inert or individually limited. Decorative text is excluded deliberately, never used as an excuse for a dead CTA|
|P6-09 Walkthrough|Scenario logs with source/control/destination, native readback, viewed result, return/cancel/retry and defect|Distinguish graph/readback inspection from actual presentation traversal; no claim native click playback happened if only reactions were read|
|P6-10 Gate report|Library/prototype links, requirement-by-requirement result and remaining limits|Design scope only. Real gesture math, DOM focus/AT, server rights, durable storage and providers remain engineering/runtime work|

## Current reusable candidates

[Baseline readback](evidence/phase6-library-discovery-baseline.json) found nine standalone COMPONENT masters, each native Auto Layout: primary/secondary/ghost/danger/disabled buttons (`8314:3/5/7/9/11`) and default/inherited/mixed/disabled property controls (`8316:11/16/21/26`). They are not yet a complete variant library. Preserve their IDs/instances when consolidating. E01 had eight shared instances, no reaction-bearing descendants, and the TO-BE page had no flow starting points at this snapshot.

The master containers and direct text children largely lack semantic bindings/text-style IDs. The three active property inputs already alias an existing white variable; preserve compatible aliases. There are eighteen local text styles: Inter UI roles (11–28px) and Geist Mono data roles (11–13px). Package contains 77 variables in Editor/Dashboard modes; Primitives contains 156. Older prototype collections belong to earlier pages and must not become accidental shared state for this prototype.

Existing UI12/18 styles are close to the helper's 12px ×145%=17.4px but not identical. Apply a style, inspect row/label fit, then propagate deliberately; do not claim nominal font-size equality preserves all geometry. Proposed control border #8591A3 passes 3:1 against white but not #F4F6F9; actual adjacent colors matter. Keep subtle #98A2B3 for inactive/decoration, not meaningful active metadata.

No Code Connect source files should be generated. Figma code syntax can identify existing/proposed tokens, but it must not masquerade as an implemented CSS variable. Published-library search and source discovery from root already justify local compatible foundations; no new framework is required.

## Native reaction capability: documented versus verified

The installed Figma API reference declares `setReactionsAsync(Reaction[])`, with `trigger` plus `actions[]`. Use awaited writes and read back the resulting reactions. The declaration supports NODE navigation (`NAVIGATE`, `SWAP`, `OVERLAY`, `SCROLL_TO`, `CHANGE_TO`), BACK/CLOSE, variables/conditionals, URL and supported media actions. Triggers include click/hover/press/drag, mouse events, timeout and keyboard key codes. This is API capability evidence, not proof this tool executes every feature correctly.

Prefer finite click navigation/overlay/state changes first. `ON_DRAG` can switch a finite specimen; it is not continuous editor resizing. `ON_KEY_DOWN` can demonstrate a key route; it does not establish DOM focus order or screen-reader semantics. BACK is history-dependent; for caller-sensitive return either preserve tested history or use an explicit known caller destination. CLOSE belongs to an overlay, not an arbitrary full-screen navigation. Do not use URL actions to perform external/provider operations.

Frame overflow can express scroll regions. Reactions should preserve/reset scroll and interactive component state deliberately. Overlay background dismissal must obey dirty/confirmation rules; do not blindly close on outside click. Covered canvas controls must not retain active hotspots through the foreground dialog. Flow-start APIs are declared read-only in the installed typings (`flowStartingPoints`, `prototypeStartNode`); root must inspect actual supported write mechanism/tool behavior rather than assume direct assignment works. Record explicit limitations if a tool operation is unavailable.

Reference read: installed `figma-use/references/plugin-api-standalone.d.ts`, Reaction/Action/Trigger near lines3344–3488, ReactionMixin near6593–6753, PageNode start properties near8164–8179. No Figma writes were performed for this capability review.

## Bounded missing destinations to resolve

1. **Publish final confirmation.** E09 is intentionally blocked. A representative ready-to-confirm review/target/revision state with Cancel is required by J-11. A simulated queued outcome can be a clearly labelled compact state; no provider/deployed success is necessary.
2. **Component destructive scope and master return.** IN-06 exposes Reset/Edit master/Actions. Reset/Detach require a target-named confirmation or explicit limited control; an Edit master destination must visibly change ownership and offer Back to instance. R01 covers failure, not master editing itself.
3. **Meaningful page switch and mobile edit/Preview round trip.** A Pages action that always returns to unchanged Home is not a page switch. A finite About result and a Mobile editing context can be small variants. E10/E17 already cover mobile Preview; they do not by themselves demonstrate entering Preview from the same Mobile edit state.
4. **Token edit and recovery retry results.** Brand has palette/detail; a picker Apply/Cancel can reuse the required picker component. R01 Retry needs a loading/repeated-error or explicitly labelled successful-read finite outcome; navigating to unrelated editor content must not imply remote sync succeeded.

These are destination needs for already-agreed journeys, not demands for separate full screens for every state. Existing overlays/variants can supply them. Text inputs, file/browser operations, providers, actual conflict resolution, arbitrary typing and continuous gestures may remain explicit per-control simulations/limits. Root should identify the chosen finite outcome in the action ledger before wiring.

## Action-audit and walkthrough schema

Use [the machine-readable schema](evidence/phase6-action-audit.schema.json). A row identifies the actual visible control and owner, not just its label. Required context includes site/page/selection/breakpoint/caller as applicable. Coverage classes are `wired`, `disabled_reason`, `simulation_limit`, `covered_inert`, or `pending`; only the first four can remain at closure. A disabled action has a specific reason and no executing mutation. Covered controls have an identified modal owner. A limited control describes its actual supported or simulated behavior and where the user sees that limitation.

Verification has separate levels: `unverified`, `native_readback`, `presentation_traversed`, `failed`. A graph with valid IDs is useful evidence but cannot be relabelled presentation traversal. Record return/cancel and whether the expected context was retained. At closure, reconcile control counts against current native frames; stale creation-history anchors do not count. Shared shell controls can share a contract/template, but each actual source node still needs a valid reaction or explicit coverage row.

[Root destination candidates](evidence/phase6-root-state-candidates.csv) enumerate E01–E23 and R01. They are routing suggestions, not written reactions or fabricated control IDs. Resolve actual control nodes from current ledgers/native reads. The same source frame can be reached from more than one caller, so hard-coded return must not silently erase intent.
