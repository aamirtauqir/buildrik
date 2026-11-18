# R34 — Design normalization and remaining gaps

13 October 2026. Updated the existing improved page **8463:2** in [Buildrick — Product](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8690-13237). Application source and the original Figma baseline were not changed. Existing unrelated source edits were left untouched. This is design and prototype work, not backend implementation.

## Implemented in Figma

- **Shared navigation:** 43 existing AI, Agents and Team proposal screens now inherit the current Editor/Build header. Workspace switching returns to the current Editor or Build. Agents, connections and task history are discoverable from Build.
- **Dialog presentation:** 148 affected dialog roots now have a consistent 1440 × 1000 project surface, centered content cards and shared typography, spacing, controls and surfaces. Long cards scroll. Existing root IDs and prototype destinations were preserved. These are neutral project surfaces, not a live dimmed copy of every caller.
- **Typography:** added Sub-heading, Body large and Caption XS, completing the eight source typography slots alongside the existing five. Heading/Body/Mono font roles have draft, review, apply and discard states. The review compares saved and proposed family names; actual rendered font propagation remains a separate design gap.
- **CMS validation:** five new field forms have minimum/maximum selection, an invalid-range state and correction before key validation/save. The authored error is minimum 80 / maximum 2; arbitrary numerical entry is not simulated.
- **Media:** added search, matching List/Grid results, no-results recovery and an empty-library design. No-results/empty states reclaim the unused details column. Search and clear-search actions are connected to the existing library.
- **Build connections:** added MCP server entry, scoped authorization, failure, connected and disconnected sample states. Disconnect is hidden until connected. These are an authorized product proposal, not evidence of an original working MCP service.
- **Review and collaboration:** repaired the previously unconnected Send for review action; added recipient/expiry, snapshot request, pending and reviewer-view transitions. Added Request review to the collaboration review screen. Aligned the current actor with the Owner role used by Members and removed contradictory generic permission copy.
- **Recovery designs:** missing comment anchor, expired invitation, access changed, missing CMS reference, conversion impact, rejected upload and bounded History restore scope. These have appropriate recovery destinations and a review index. Several are review scenarios rather than automatically triggered product conditions.
- **In-file interaction contract:** drawer expansion, two/three-region ownership, narrow viewport rules, focus/keyboard behavior, validation and AI/MCP review boundaries. [Contract frame](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8820-14440).

## Architecture and component consistency

Editor owns direct manipulation and the selected-element inspector. Build owns conversation, task scope, generated proposals and agent runs. Both operate on one project. AI output requires review before applying; publishing and member administration stay in their existing workflows.

A drawer is appropriate for a short contextual task with useful canvas context. Expand to a workspace for collection management or editing several shared definitions. Two columns support paired fields or comparison. Three regions are justified when navigation, a collection and selected-item details are simultaneously useful. Empty states do not retain an unused inspector. Smaller viewports should disclose secondary regions; this continuation documents that rule but does not supply all responsive variants.

Existing action masters 8314:3/5/7/9, input 8531:318, property rows 8316:11, workspace navigation 8627:621/626 and existing Inter/8322 foundations were reused. No competing component master library was introduced. R34 prototype variables in collection 8814:15739 are hidden from publishing and represent sample workflow state, not new design tokens. Repeated dialog compositions reuse controls; not every composition is a shared component.

## Validation

The post-collaboration structural audit inspected **198 affected roots, 2,046 shared instances, 17 existing masters and 324 unique prototype destinations**. It found no missing inspected master/destination, visible auto-layout overflow or unexpected font family. Evidence: [native audit](evidence/r34-native-qa.json). This checks visible auto-layout children in unclipped containers; it does not certify every absolute-positioned layer, viewport or variable combination. The subsequent MCP visibility fix has its own mutation receipt and visual check.

At 1440 × 1000, screenshots were visually inspected for these journeys:

| Journey | Verified evidence |
|---|---|
| Font role change → impact review → apply → Styles | r34-font-impact.png; r34-font-library.png |
| Number minimum exceeds maximum → correction → save | r34-cms-range-error.png; r34-cms-range-saved.png |
| Search logo → no results → clear → library | r34-media-no-results.png; r34-media-search-recovered.png |
| Recipient change → send review → pending snapshot | r34-review-pending.png |
| Build → connections → scope review → authorize | r34-mcp-entry-retry.png; r34-mcp-authorize-retry.png; r34-mcp-connected-retry.png |
| Fresh connection hides Disconnect → authorize shows it → disconnect hides it | r34-mcp-disconnect-hidden.png; r34-mcp-connected-final.png; r34-mcp-disconnected-final.png |
| Matching query → selected result → Grid retains query and selection | r34-media-matching-list-final.png; r34-media-matching-grid-final.png |
| Collaboration role alignment and Request review placement | Figma screenshots in r34-team tool response; mutation receipt saved |

The first MCP walk clicked while the player was loading, so those initial MCP screenshots are **INVALID_PLAYBACK**, not passes. A 30-second browser wait also timed out. The retry after loading reached the intended states and was visually checked. Figma SWAP transitions preserve the initial URL; URL matching alone was not used to establish a pass.

Media playback exposed a filtered grid with an empty first slot, a generic heading and a hidden query. The grid now uses fixed-extent auto-layout, both views show Search results and the query is bound to the search field. Final playback confirms the matching asset occupies the first slot and its details stay selected. Evidence is `r34-media-final-walk.json.receipt.json` and the two final screenshots above. Earlier matching-grid screenshots show the pre-fix defect and are not the final result.

No application tests were run: application code was not changed. Backend functionality is not established by prototype state changes.

## Remaining design work

| ID | Severity | Status | Location and concrete correction |
|---|---|---|---|
| D34-01 | P1 | OPEN_TYPE_ADAPTATION | [55-type matrix](PHASE6-ELEMENT-TYPE-MATRIX.csv): complete type-specific Style, Settings and Interactions content and verify each leaf journey in the current shell. Existing partial states are not complete type coverage. |
| D34-02 | P1 | OPEN_RENDERED_PREVIEW | Brand: show real rendered font/token propagation and affected-instance previews for shared changes; verify every starter and preset outcome. Current independent draft values alone do not prove visual propagation. |
| D34-03 | P1 | OPEN_RESPONSIVE_DESIGN | Editor, Build, CMS, Media and Brand: create and inspect 1280/1024 workspace variants, drawer expansion/collapse and preservation of selection/return context. The contract alone does not close this. |
| D34-04 | P1 | PARTIAL_PROTOTYPE_COVERAGE | Connect remaining legacy routes and condition-specific recovery paths, including automatic entry to reference, invitation, upload and comment-anchor failures. Review-index access is explicitly weaker than a complete user journey. |
| D34-05 | P2 | OPEN_CONTENT_STATES | Long lists, long/localized names, arbitrary search/filter combinations, media search after deletion, all asset versions and collection-empty states need additional representation and QA. |
| D34-06 | P2 | OPEN_INTERACTION_STATES | Complete keyboard-visible focus, focus return, disabled/loading behavior and accessible dialog/drawer states. Written behavior rules do not demonstrate Tab order or focus trapping. |
| D34-07 | P2 | PARTIAL_CANVAS_SIMULATION | Drag/reorder/nesting, mixed selection and complete undo/history scope still need design reconciliation and representative prototypes. Figma will remain a finite simulation of an editor. |
| D34-08 | P2 | PARTIAL_SURFACE_NORMALIZATION | Remaining legacy dialogs and all caller-specific backdrops/return routes need inspection. The 148 normalized surfaces are the measured scope, not the entire file. |

Real AI/MCP execution, authorization, emails, payments, uploads, persistence and publishing are **implementation dependencies**, not evidence that their UI is absent. No source-code work is authorized by this continuation.

The [R34 capability matrix](R34-FEATURE-PARITY.csv) and existing 81-row ledger preserve explicit scope and prior evidence. R34 closes only the named design gaps above. Full feature parity and Phase 6 completion remain open; no completion percentage is asserted.
