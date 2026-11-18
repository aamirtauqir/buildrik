# Buildrick current Figma flow walkthrough — 2026-10-12

The supplied Figma file is accessible. This is a read-only review of the current improved product and its actual prototype routes, not a design-completion certificate. No Figma nodes or production source were changed in this walkthrough.

## Current authority and measured scope

- [Current handover, page 05](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8594-2): **HANDOVER / Flows before UI**.
- [Current flow reconciliation, page 04](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8463-2): 217 top-level items inventoried: 173 non-proposal flow/state/helper frames, 43 explicitly **PROPOSED / scope unverified** scenarios, one controls library. These are frame counts, not distinct user-journey counts.
- Page 02 contains the improved workspace bodies; page 03 owns canonical controls. Original pages remain the baseline. Their entire functionality was not re-audited during this walkthrough.
- Fresh native text/action/coordinate readback covered 100 of the 173 current flow frames. Figma MCP then returned the Professional Full-seat tool-call limit. The other 73 detailed reads remain pending; several of those screens were subsequently exercised in the browser, which does not replace component/variable inspection.
- Browser playback used the real Figma prototype at 1440 × 1000. Screenshots and sequential input receipts are in `evidence/walk-*`. URL matches establish navigation only; screenshots establish the visible result. Neither proves backend execution.
- The handover's previous 348 persisted-action/ownership checks are historical readback evidence, not fresh browser checks from this review.

The complete discovered screen list, including pending reads, is in [the screen register](CURRENT-FLOW-WALKTHROUGH-SCREEN-REGISTER.csv). [The screen-by-screen appendix](CURRENT-FLOW-WALKTHROUGH-APPENDIX.md) records the native routes actually read. Do not interpret an action's presence as proof that its control is visible through all ancestor layers.

## Flow-by-flow findings

| Flow | Actual path and result | Current evidence/status |
|---|---|---|
| Heading selection and inspector tabs | Heading → Settings → Interactions → trigger picker → On click → return to selected Heading. Selection remained Heading, Desktop/Base. | **BROWSER VERIFIED — limited path.** Action configuration explicitly remains unavailable. All 13 triggers were visible; only On click was applied in playback. |
| Text styles | Open text styles → each of the eight styles → inspector and canvas change. Cancel retained the final Caption XS choice. | **BROWSER VERIFIED — finite style choices.** Screens `walk-style-0` through `7`, plus cancel. |
| Responsive reset | Heading → Mobile → remove override → Desktop → Mobile. Reset Mobile returns with 72px inherited and zero local overrides. | **BROWSER VERIFIED — authored reset fixture.** A previously applied Desktop Caption XS style was not carried into this named fixture; arbitrary state persistence is not established. |
| Layout, appearance, hover, mixed selection | Native routes connect contextual tabs, corresponding Mobile companions, layout/hover/interaction destinations. | **NATIVE READBACK ONLY for the unplayed branches.** Mixed selection and per-state changes still need complete playback. |
| Grid | Project grid → two columns → Undo. Navigation and undo work, but the third project card is not visible in the two-column result. | **BROWSER VERIFIED with representation gap.** Three cards return on Undo. This does not establish correct reflow or arbitrary track editing. |
| Class/cascade | Class manager → shared impact review → Apply → Undo. The visible Heading changes from 72px to 64px; Undo restores the 72px class view. | **BROWSER VERIFIED — named sequence.** The second affected heading on About was not inspected; all cancellation branches and arbitrary class editing remain unverified. |
| Padding | Linked top → Space 8/32px updated all four values. Unlink → click left → picker incorrectly says right → Space 2/8px changes both horizontal values. Mobile companion opens with its own 24px fixture. | **CONFIRMED DEFECT.** Independent left/right editing fails. Token choices are finite; custom keyboard input was not established. |
| Image library selection | Authored-alt image → Source → upper gradient row → Use retained the old source. Reopen → lower gradient button → Use changed source to gradient-study.webp and preserved authored alt. Cancel returns without committing. | **BROWSER VERIFIED with duplicate-control defect.** The two representations of the same asset behave differently. |
| Image upload | Source → Upload → Upload without file produces required-file validation. Choose file → Upload shows studio-upload.webp loading. Cancel returns to chooser. | **PARTIAL / COMPLETION UNVERIFIED.** Loading remained after an additional ten-second wait. Ready/failure/retry transitions were not reached in this normal path. |
| Image URL | From URL → Check empty produces required-URL feedback. Click-to-fill fixture → Check shows Checking image. | **PARTIAL.** The check is a sample URL fixture. Ready/failure/commit were not verified. |
| Image fit, crop, adjust, resize, optimise | Native readback shows crop navigation to adjustment/resize/optimise and a generic version-saved destination. Source chooser preserves alt on the verified library path. | **PARTIAL / PLACEHOLDERS.** Fit preservation, real image changes, all transformation outcomes and saving versions need separate validation. |
| Email and form configuration | Typed settings, required-email result and companion Style/Interactions routes exist. Redirect missing URL → `/thank-you` correction → Save → Saved worked in playback. | **BROWSER VERIFIED for redirect fixture only.** No delivery/backend submission occurred. The form-add picker lists field types without connected add results in native readback. |
| Collection list | Collection settings and updated-limit state have their own Style/Interactions companions. | **NATIVE READBACK ONLY.** Limit/binding outcomes need playback; schema and record operations remain separate owners. |
| Component instance | Review reset → reset result; Edit master → back to instance; Detach review → detached element. Canvas label reflects detached state. | **BROWSER VERIFIED — named states.** First reset center click did not navigate; retry elsewhere within the button did. Master, detach-review and detached-result descriptions overlap controls. Master mutations and undo-detach still need verification. |
| CMS | From selected detached button → Articles records → Fields opens Projects/Fields. Caller return restores the detached button. | **CONFIRMED CONTEXT DEFECT.** Collection identity changes. Entry also wrongly says Linked from Home/Heading. Add/import/open-record results were not wired in native readback. |
| Pages and metadata | Pages opens; SEO & social settings opens metadata surface; caller return works in the exercised path. | **PARTIAL.** Page creation/deletion and arbitrary metadata editing/saving are not proven; advanced/page-delete routes include placeholders. |
| Media workspace | Asset workspace and editor/action surfaces exist. Native crop navigation and generic saved-version destination are present. | **PARTIAL / PLACEHOLDERS.** Upload queue, replace/delete and some tools do not have complete feature-specific outcomes. |
| Brand workspace | Variables, modes, styles, components, classes, presets, checks, starters and transfer surfaces are inventoried/read where available. | **PARTIAL / PLACEHOLDERS.** Change-colour/binding-return and many internal actions have no reaction. Dark-mode route uses generic options. A displayed list is not completed token editing. |
| Site settings | Site menu → settings opens Overview. Settings routes include General, Languages, SEO, Domains, Redirects, Access, Analytics, Submissions, Custom code, Security, Danger, Members, Billing and Integrations. | **PARTIAL.** Browser inspected Overview/Security; native readback identifies generic action/save/review dialogs across settings. Workspace handoffs are not completed service workflows. |
| History | History opens via shared action; restore-review action leads to history actions. Session/published/action surfaces exist. | **NATIVE READBACK / PARTIAL.** Restore, compare, visual/semantic review are not established; summary/delete include generic dialogs. |
| Selected AI | Selected-object scope is assigned by caller actions; current Selected AI overlay belongs to captured scope. | **PARTIAL / SERVICE GATED.** Response/apply not verified. The 12 AI expansion scenarios are explicitly proposed, not finalized. |
| Review, activity, share | Review opens an empty-state dialog and returns to selected element. Activity and preview-link surfaces are present in current handover/inventory. | **PARTIAL.** Send-for-review is unwired according to the current handover. No invitation, message or actual share was sent. Activity/share interactions still need playback. |
| Preview and publish | Both open and return. Preview explicitly says scripts/form delivery are not tested. Publish shows unsaved changes, missing destination/server checks and no release started. | **BROWSER VERIFIED — entry/return only.** Both display the older static canvas rather than the current selected screen's content. Publishing is not complete. |
| Site menu and supporting tools | Settings, issues, activity, shortcuts, share, export, duplicate, command palette, view mode, getting started, collaboration, site health, invites/account destinations are visible. | **PARTIAL / GATED.** Current handover records eight unwired/Planned actions. Issues rows and several view controls have no reactions. |
| AI, Agents and Team expansions | 43 explicitly proposed scenarios remain in the file. | **EXCLUDED FROM FINALIZED SCOPE.** Do not present these as validated existing product capabilities. |

## Confirmed issues and corrections needed

| ID | Severity | Evidence and location | Required correction |
|---|---|---|---|
| WF-01 | High | I05 `8465:6`: left control sets right-side context in native action readback. Browser `walk-padding-left-context.png` and `walk-padding-left-applied.png` show Unlinked and both sides changing. | Give each side independent variable binding and caller key. Recheck left/right independently, linked mode, Mobile and cancel. |
| WF-02 | High | CMS `8539:9881` Articles → `8539:11501` Projects/Fields. `walk-cms-records.png` and `walk-cms-fields.png`. | Preserve collection ID across Records/Fields/Dynamic pages/Settings; return to the same collection. |
| WF-03 | Medium | CMS entered from detached Primary button still says Home/Heading. Preview/publish also show a different static canvas. | Bind caller identity/content or clearly label a separate sample scenario; do not imply contextual continuity that the prototype does not demonstrate. |
| WF-04 | Medium | Image chooser top gradient row does not select; lower duplicated gradient button does. `walk-image-draft.png` versus `walk-image-real-applied.png`. | Consolidate each asset into one selectable row/card with a visible selected state and one commit action. |
| WF-05 | Medium | Master `8543:9344`, detach review `8543:9426`, result `8543:9508`: description text intersects first fields/buttons. | Fix vertical layout and text wrapping using shared inspector layout rules; recheck all three variants. |
| WF-06 | High (verification blocker) | Upload stayed in loading beyond an additional ten seconds; URL showed checking. | Inspect/replay delayed conditional transitions from the normal and forced-error fixture. Do not claim ready/retry paths work until reached. Browser timing versus prototype defect remains unresolved. |
| WF-07 | High (completion gap) | Shared generic `saved`, `version-saved`, `review-action`, `action-options` nodes are used for unrelated capabilities. Current handover acknowledges these placeholders. | Replace with feature-specific decisions and outcomes, or explicitly mark the action unavailable with its dependency. A generic dialog is not feature parity. |
| WF-08 | Medium (simulation limit) | Caption XS applied on Desktop does not carry into named Mobile/reset scenario, which returns fixed 72px. | Connect shared state across breakpoints or label the finite reset scenario so it does not imply arbitrary persistence. |
| WF-09 | High (representation gap) | Grid `8465:5` shows three projects; two-column result `8465:13` shows only two, with no third card visible below. Undo restores three. `walk-grid-start.png`, `walk-grid-two.png`, `walk-grid-undo.png`. | Preserve all three cards and show the third reflowing to the next row. Inspect layer/visibility state before treating this as actual deletion. |

First reset click mismatch is retained in batch 09; successful retry is in batch 10. It is not counted as a confirmed broken reset route. `walk-generic-options.png` is a historical filename: visual inspection showed Security headers, because Site settings opened Overview and the next coordinate selected Security. It is **not** evidence that an Advanced dialog opened.

## Placeholder register from fresh native readback/current handover

These paths must not be reported as complete merely because they have a destination:

- General favicon/touch icon/Advanced; redirects import/export/add; domain add; locale add.
- Archive/transfer/delete site; workspace settings from Members/Billing/Integrations.
- Page advanced/delete; dark-token configuration; CMS field/collection delete.
- Media upload queue/replace/delete; history summary/delete.
- Component update-from-selection, detach-all and delete-master are current handover gaps.
- Form-add type choices, CMS record/import operations, several Brand tools, issues rows, device choices and review-send lack meaningful result paths in the inspected evidence.

Selected tabs, intentionally disabled controls and read-only values are not classified as defects merely for lacking reactions.

## Remaining verification

The exhaustive walkthrough is **not complete**. The 73 pending native reads are explicitly listed in the JSON and screen register. Their browser visibility does not substitute for inspecting component reuse, variables, hidden layers or every branch.

Next verification order:

1. Resolve WF-01/WF-02 context errors before certifying normalization; inspect shared bindings and affected variants.
2. Replay upload/URL normal completion, forced failure, retry and cancel using review console `8593:12598` (caller variables matter).
3. Check all 13 triggers and isolated selected-object state; finish action-configuration specification.
4. Complete padding all sides/custom/cancel/Mobile, all ten Mobile companions, typed-element companion tabs and image fit/source combinations.
5. Finish component cancellation/undo/master mutation, CMS binding/limit/record/schema, and all workspace save/discard/destructive/return paths.
6. Reconcile placeholder and unwired operations against page 05's 99-state source register; complete native readback when tool access is restored.
7. Recheck cross-screen component usage and layout after corrections. This walkthrough alone does not certify the design system or full original-to-improved parity.

Evidence files are local QA artifacts. Prototype screenshots show design simulations; no backend save, upload, publish, email delivery or collaboration service was exercised.
