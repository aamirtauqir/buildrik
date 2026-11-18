# Phase 6 product expansion — 12 October 2026

The user rejected the earlier bounded prototype as a complete product design. Phase 6 is reopened, and the older completion report and gate matrix are explicitly superseded for product coverage.

## Review links

- [Start with the product overview](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8471-2795&starting-point-node-id=8471%3A2795)
- [Figma design page](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8463-2)
- [Inspector](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-2)
- [AI](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-19)
- [Agents](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-31)
- [Collaboration](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-46)

## Deliverable

62 native proposed product states: 19 inspector, 12 AI, 15 agents and 16 collaboration states. A separate overview provides four workspace entry points. The previous prototype entry now links to this expansion. Existing AS-IS screens and historical scenario evidence remain intact.

The inspector adds class/cascade visibility, explicit property origins, responsive override/reset, flex/grid/spacing/appearance/semantics/interactions, shared-class impact, and a direct numeric font-size edit popover. Mobile is a reflowed native layout. Applied AI copy is also shown on an editor canvas result.

AI includes selected-element/page/site scopes, context, generation/cancel, before/after review, apply/discard/undo, stale/error/quota/history states. Agents include scoped tasks, budgets, plans and approvals, progress/cancel/failure, full/partial results, freshness guards, audit history and a separate read-only site audit. Collaboration includes presence, roles/invites, comments/resolve/reopen, activity, pinned client reviews and local/server conflict choices. External reviewer states expose only reviewer navigation.

Two additional reusable component families support this expansion: a six-state property-origin family and a workflow evidence card. Existing buttons, semantic tokens and text styles are reused.

## Verification

- Independent final native readback: 62 screens, 6,344 descendant nodes, 1,710 instances and 6,007 variable-bound nodes; rendered text families are Inter.
- Zero full-UI raster layers (zero image-filled nodes in this expansion).
- No missing native destinations, no detected overflow in the inspected workspace/inspector/mobile/popover containers, and no visible reviewer links into editor workspaces.
- Visual composition inspection covered the main inspector, Mobile override, AI assistant, agent review, conflict resolution, external reviewer, product index and numeric popover. Fixed Mobile text reflow, input affordances, selection boundaries, numeric-popover height and reviewer shortcuts.
- Main browser playback: 44/44 navigation checks passed. The first attempt stopped at the grid because the shorter loading wait did not yield navigation; that failed attempt is retained. The same grid action passed after increasing the Figma loading wait. Do not count the failed attempt as an additional success.
- Direct-field and AI-canvas playback: 9/9 passed, including font-size popover cancel/review/apply, direct grid columns, and AI result returning to the updated editor canvas. Together the two final runs contain 53 passing checks. They do not cover all 62 screens or every control.

Native navigation counts do not prove browser coverage of every action or a live service. Figma fields use authored scenario values; they are not general editable runtime controls. Animation preview here specifies an end state, not a validated runtime animation engine.

## Gate remains open

This expansion addresses the four areas raised by the user. Full product acceptance still needs the 81-row inventory and 55 element types reconciled against the new shared shell, type-specific forms/CMS/components/media inspector integration, remaining empty/loading/permission and invitation lifecycle states, and consistency with the older Media/CMS/Brand/save/release journeys. These are visible remaining requirements, not silently excluded completed scope.

No application source changes, provider requests, invitations, deployments or publishing were performed. The former agent-confirmation and multiplayer runtime limitations remain engineering dependencies. Phase 7/8 is not declared complete or started by this design work.

## Evidence

See PHASE6-PRODUCT-EXPANSION.md for the detailed design contract and official Webflow references; PHASE6-EXPANSION-ACCEPTANCE.md for acceptance boundaries. The evidence directory contains phase6-expansion-screen-spec.json, phase6-expansion-receipts.json, phase6-expansion-actions.json, phase6-expansion-final-62-validation.json and the browser playback JSON/script.
