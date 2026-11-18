# R36 — End-to-end design acceptance and frontend handoff

13 October 2026. Existing Buildrick — Product file, improved page 8463:2. This register adopts the user's expanded acceptance standard. It does not certify all modules complete. Application source and the original Figma baseline are not edited.

## Current direction — 14 October 2026, R45

**Reference now resolved:** the user identified pages 02 and 04 as competing duplicates and explicitly chose Existing Application (page 01) as the UI to inspect/preserve. The working successor must use that existing structure and consolidate useful flows; do not treat either proposed shell as accepted. The reference-clarification hold below is historical. Duplicate/unique-flow mapping precedes consolidation; baseline page 01 and production code remain preserved.

**Subsequent user rejection:** the user rejected the work after the targeted repair. The exact UI/file to retain is awaiting clarification. Do not implement Page 04's appearance as an approved design. Figma edits are on hold; read-only reference comparison continues. The repair remains committed, with a known unresolved 2 px content-width change. See the latest [STATUS](STATUS.md) and [repair record](R45-WORKFLOW-REPAIR.md). This note supersedes any acceptance implication in the historical evidence below.

Keep the existing Buildrick UI and identity; adopt Webflow-like editing workflows with targeted usability fixes. This latest user direction supersedes the earlier visual-redesign direction. Review the existing editor workflow before more functional authoring. R46 Size/Layout remains planned but deferred; the goal still covers all 14 modules, all gates OPEN. Evidence below is chronological and bounded; older “next” statements are historical.

## Completion gate

### Implementation readiness question — 14 October 2026

The user asked whether correct flows can be implemented now, then explicitly instructed **do not touch code**. The source review below is informational and does not authorize implementation. No production changes were made. R47 has since partially restored the original shell structure in the existing Heading and Image Figma roots; drawer order and six device foreground aliases were corrected and native screenshots reviewed. Inspector tab ownership, shared Style overlay, broader shell fidelity and duplicate retirement remain open. Post-restoration browser playback is pending; preserved reaction signatures do not replace that verification.

Recommended first implementation slice: reconcile the normal responsive read cascade with the engine's Tablet→Mobile output, then verify existing property-scoped Reset and real global Undo/Redo in the browser. `commandOperations.ts:stylesAt` currently merges base+current only; `cssContext.computeEffectiveStyles` consumes it. Existing `TextStyleRow`, `setStyleAt`, `useFieldOverrides`, discrete transactions and device-flag writers already provide substantial functionality. Reuse them. Four existing targeted suites passed 41 tests ([receipt](evidence/r47-implementation-readiness-tests.txt)); these are not rendered cascade/persistence proof.

Image replacement is a separate viable slice using existing SourceRow and Assets picker: guard pending target/source identity, retain recoverable failure, clarify commit/close timing, and verify one real Undo plus persisted reload. Inspector replacement preserves placement alt; the separate Media command has a different alt policy. Do not merge those policies without a deliberate contract. Arbitrary real assets and async outcomes must replace the prototype's two-value examples.

R45's property-owned inverse after unrelated later edits is stronger than current global history behavior. `HistoryManager.captureUndo` refuses after intervening history; do not silently add a second Undo stack or call the Figma model runtime parity. Form remote saves, publish permissions, complete Effects/layout and broad feature parity remain unaccepted. UI restoration and duplicate consolidation also remain required design work.

A module passes only when an evidenced task has: a discoverable entry; understandable scope; an intended change; a recognizable outcome; failure recovery; and return to the correct context. Record design inspection, prototype playback, and running-application verification separately. Screen counts, action counts and a URL change are not task acceptance.

Work order: reconcile source/control inventory → ownership and context → main workflows and module transitions → validation/recovery/permissions → shared controls and visual consistency → prototype task playback → frontend handoff and coverage. Preserve original capabilities and Buildrick identity. This is a continuation of R35, not a replacement design or new feature roadmap.

## Users and verified permission facts

Actual roles are Owner, Admin, Editor, Designer and Viewer. Source: repository lib/constants/enums.ts and server/services/permission.service.ts. Editor and Designer have the same rank; do not imply that Editor is content-only or that Designer is automatically forbidden to publish. Viewer is described as read-only and cannot open the editor. Site grants and role overrides can restrict access; a token is workspace scoped.

Site publishing requires the Editor tier. Workspace approval policy can impose a separate approval gate, with Owner exemption described in sites.publish. A stale-approval override requires Admin. These are source observations, not fresh multi-account runtime tests. See server/trpc/routers/sites.ts:456–492. UI eligibility must use effective site permissions and execution must recheck them.

Primary tasks: designers/editors create pages and responsive layouts, edit content and interactions, maintain shared definitions, assets and CMS; owners/admins also manage appropriate configuration and team access; reviewers consume the existing review experience. Do not introduce a new role or collaboration capability to fit this list.

## Objects, ownership and persistence

| Object/change | Canonical editor | Scope and recovery |
|---|---|---|
| Site/page/element | Pages plus Editor/Layers/Inspector | Stable IDs connect selection, hierarchy and property values. Canvas edits use logical document Undo. Page path/SEO/social are page overrides. |
| Visual property | Style | Typography, layout, dimensions, spacing, borders, effects and image fit; current breakpoint/state and origin must be visible. |
| Content/semantics | Settings | Text, source, placement alt, links, heading level, attributes and CMS bindings. Do not imply content is breakpoint-local without source support. |
| Event behavior | Interactions | Trigger, action, target, timing and cancellation. |
| Tokens/shared styles | Brand | Shared definition and affected uses; local exceptions remain explicit. Editor chrome tokens are separate from the customer's Brand. |
| Component master/instance | Saved Components and component edit context | Master structure/behavior vs permitted overrides. Reset removes the override. Detach and incompatible updates need explicit consequences. |
| Collection/schema/record | CMS | Separate record/schema persistence and conflict recovery. Project binding writes are not the same save operation. |
| Asset/version/placement | Media; Settings for placement | Metadata/version creation is distinct from changing a placement or replacing site usage. Asset library recovery is not automatically canvas Undo. |
| Draft/review/live version | History, Review, Preview, Publish | Restore changes a draft; publishing is separate. Show reviewed/saved/live identities and destination. |
| Site/workspace configuration | Corresponding settings scope | Permissions, persistence and recovery depend on the specific operation; no generic document-save success. |

## Context contract for every cross-module route

Capture stable site/page/selected element IDs, breakpoint, pseudo/interaction state, Inspector tab, canvas view/zoom/scroll, tree expansion, relevant panel scroll, focus return anchor and unsaved field drafts. Preserve the initiating target separately from the current selection while async work runs.

Return to the initiating context after success, cancel or retry. If the element was deleted, return to the accessible originating page with no stale selection and an explanation; do not substitute Heading/Home. If access was revoked, retain recoverable draft data only within allowed storage rules, stop writes and show access recovery. Confirm server policy before exposing retained restricted data.

Opening a related editor must not silently commit invalid input or overwrite a more recent edit. Background results validate object identity/revision before application. Restore keyboard focus to the triggering control or its nearest surviving equivalent.

## Significant flow handoff: Mobile Image → picker/Media → return

Entry: Settings Source on Image 8843:20467, now connected to existing picker 8539:12728. Mobile state uses a 375 px sample width. The toolbar, Inspector and canvas captions share the selected context.

Controls: Source chooses a candidate; alt text remains placement-owned; Image fit links to shared Style 8841:14864. Source picker confirms Use or Cancel; nested Media returns the chosen asset to the picker before application. Unavailable source opens 8907:17361 and cannot be applied.

Persistence: candidate selection is a draft. Use updates the initiating Image source in the finite prototype; Cancel/failure leaves its source and authored alt unchanged. Undo restores the captured prior source. Runtime must execute a single eligible document transaction and leave the locked selection unchanged. Figma does not execute uploads or durable autosave.

Fit: Desktop base and Mobile override are separate sample values. Mobile Reset clears its override and reveals the base value. This fixture has no Tablet override. It does not certify the full source cascade or all five fit modes' rendered image behavior.

Source discrepancy requiring implementation reconciliation: Inspector SourceRow.tsx:124–134 writes src through writeSrc and retains the placement alt. MediaCommandLayer.replaceMedia:242–268 can replace/remove alt from the new asset. followAssetAlt:280–301 updates empty/following descriptions while preserving custom or locked placements. These routes must not be merged silently. The corrected Inspector prototype preserves authored alt and asks the user to check it against the new image.

Failure/retry: keep candidate source and original target/context. Retry must validate/load before Apply becomes eligible. The prototype's Retry returns to the chooser with invalid candidate still blocked; choosing a valid asset enables Apply. It is not a simulated successful network response.

Return: Image, Mobile, Settings and authored alt survive. Exact focus restoration, browser refresh recovery and remote write success still need runtime testing.

## Property-control contract

The control register lists authored type-specific and shared controls with IDs and source links. Finite sample values are not production range specifications. Unverified ranges/defaults are explicitly marked.

Before a control is implementation-ready, fill in eligibility; raw value type; allowed units/range; default vs inherited origin; zero/empty/Auto/Hug/Fill semantics; validation; commit/cancel; reset; breakpoint/state scope; shared/local scope; permissions and persistence. Keep invalid input visible with its error. Numeric input, unit, stepper, origin and shortcut should be independent component properties.

Known source examples: SizeSection.constraintTypeOf/valueForConstraint maps Fill to 100%, Hug to fit-content, and Fixed retains an existing fixed value or uses 200px. This is source behavior, not permission to silently replace malformed user input. commandOperations.setStyleAt removes the specific breakpoint property on empty reset; it does not copy Desktop into all breakpoints.

## Task coverage required across all modules

See R36-MODULE-ACCEPTANCE.csv. Each row is an open module gate with a concrete task and evidence lineage. Inherited R28–R35 evidence is retained only for its tested slice.

- Editor/Layers: nested/parent selection, off-screen locate, text editing, multi-selection, locks/hidden nodes; drag insertion/parent feedback and invalid-target cancellation; copy/paste/duplicate/reorder/delete and transaction Undo. Distinguish hover, selection and focus. Zoom changes the view.
- Style: numeric/unit/mixed/linked/empty states, inherited origin, current breakpoint/pseudo state and reset. Test editor widths independently from authored-site reflow.
- Settings/Forms: content/attributes, links, bindings, semantic controls, field validation and submission ownership. Form server settings may have a separate save/Undo boundary.
- Interactions/AI: supported triggers/actions, target scope, proposed change review, apply/cancel/Undo, stale result handling and permission loss. Planned behavior stays labelled.
- Pages/Templates: create/rename/path/SEO/social, folder/context actions, dependencies and guarded template replacement/backup/recovery.
- CMS: schema/record validation, required fields, duplicate paths, conflict/deleted source, dynamic pages, import rejection and schema dependency review.
- Media: import/upload failures, source target preservation, metadata/version/placement distinction, usage/deletion, partial replacement and rollback.
- Brand/Saved Components: master versus instance/token/local scope, affected usage, compatible overrides, reset/detach and incompatible dependency handling.
- Site Settings/Workspace: correct site/workspace ownership, effective roles, dirty exits, forbidden/read-only states and external provider handoffs.
- History/Versions: document vs asset vs record stores, restore scope, draft-only outcome and appropriate recovery outside canvas Undo.
- Review/Activity: snapshot/version identity, access/expiry, conflicts, deleted anchors and retained discussion.
- Preview/Publish: saved draft vs review snapshot vs live; destination and version, advisory warnings vs blockers, failed/retried/cancelled deployment, rollback/restore separation.
- Utilities: shortcuts/palette/help and workspace transitions preserve task context and expose unavailable reasons.

## Responsive, accessibility and performance requirements

Test editor widths 1440/1280/1136/1024 and constrained panel combinations; these are authoring-shell tests. Separately test site widths around 767/768 and 1023/1024, representative mobile 375, content wrapping, navigation, forms, image fitting and overflow. Intermediate width acceptance is open.

Source risk: commandOperations.stylesAt merges base with the selected breakpoint; CSS breakpoint queries overlap at Mobile. Confirm effective Tablet→Mobile fallback, stylesheet order, Inspector origin, reset and exported/preview output agree. Do not label every Mobile value as Desktop inheritance by assumption.

Editor accessibility: keyboard reachability/order; visible focus distinct from selection; labelled controls; announced invalid/save status; dialog focus trap/return; Escape/cancel; alternatives to drag. Authored-site accessibility: correct headings/alt/labels, reading order, focus/keyboard behavior and appropriate motion. Finite Figma key triggers do not prove DOM accessibility.

Proposed performance acceptance workload: 10,000 elements, 200 pages, 5,000 assets and 20,000 CMS records, including filtered lists and nested selections. Measure on an agreed reference device. Candidate targets: p95 selection feedback under 100 ms, typing feedback under 50 ms, and sustained drag near the display frame budget; these are handoff targets, not measured results. Background jobs must preserve context, be cancellable where supported, and reject stale results.

## Remaining runtime facts requiring verification

1. SourceRow and direct Media replacement alt policies, actual selected target/lock behavior and persistence after reload.
2. Effective breakpoint cascade/origin/reset and agreement between canvas, Inspector, preview and export.
3. Autosave acknowledgement, interruption/offline/refresh/tab-close recovery and transaction boundaries for each storage domain.
4. CMS outbox conflicts, stale record/schema operations, dependency guards and generated page output.
5. Effective role/site/token scope, approval-required publishing, stale approval override and mid-task revocation.
6. AI/MCP captured-target/revision validation, cancellation, partial application and Undo under real service responses.
7. Shared component/token propagation preserving compatible overrides and recovery from failed remote synchronization.
8. Real upload/version bytes, device-only assets, partial replace/delete recovery and backend idempotency.
9. Real preview/published typography, layout, forms, links, interactions and CMS parity; no live publishing is performed here.
10. Native keyboard/focus/announcements and measured performance under the workload above.

Design issues such as missing leaf states, remaining caller routes or unclear controls remain design work. They must not be reclassified as backend dependencies merely to close a module.

## R39 continuation packet — bounded Icon evidence

[R39 Icon output and recovery](R39-ICON-OUTPUT-QA.md) records the current entry, control IDs, scope, 153 authored-action checks and representative visual playback. Settings appearance links now open canonical Style; dimensions have finite Desktop/Mobile state, SVG stroke has explicit global scope, and glyph replacement preserves the fixture's appearance. One-step Undo preserves value and override presence; no-op edits do not overwrite useful history. The 112 R38 typography regression checks also passed.

These Figma behaviors are proposed corrected contracts. Reconcile wrapper CSS, metadata and embedded SVG output before claiming implementation parity. Complete arbitrary dimensions/units, color, catalog, eligibility, Tablet/pseudo states and full history/keyboard behavior. Keep the finite 32/48px picker out of production requirements as a restriction. Full module acceptance remains OPEN.

Next executable source-backed plans: [Columns structural count and removal recovery](R40-COLUMNS-CONTRACT-PLAN.md) and [Saved Components insertion/master/reset/detach recovery](R40-SAVED-COMPONENTS-TASK-PLAN.md). The [remaining module queue](R39-COVERAGE-HANDOFF-AUDIT.md) separates unverified design states from runtime-only proof. R40 plan documents do not imply those flows have been authored or played.

## R40 continuation packet — bounded Columns evidence

[Columns output and recovery](R40-COLUMNS-OUTPUT-QA.md) supersedes the prior plan-only status for the specifically evidenced count/Gap subset. Existing count and Gap controls were found natively and mapped into two new register entries; the current inventory has 531 unique rows. Count 2–6 changes finite specimens/Layers globally; reduction previews content loss, Cancel/Escape preserves content, and Undo restores original Contact. Re-increase creates a placeholder. Gap uses canonical responsive Style with finite values, Mobile origin/reset/Undo and reviewed spacing output.

The final action interpreter passed 142 Columns checks plus 153 Icon and 112 typography regression checks. Native inspection covered six roots, 159 instances and 40 destinations without missing inspected references. Final browser outcomes and known diagnostic failures are linked in the report. Logical slot/generation identities and ten display specimens do not prove real-engine subtree deletion, serialization or identity recovery. Protected descendant refusal is a proposed correction to the inspected source path.

Full mixed/bulk/missing-target states, component protection, transactional failure recovery, arbitrary content/units, full history and breakpoint cascades remain open. The plan's mixed/incompatible-selection leaf is still not authored. Continue the [Inspector queue](R40-INSPECTOR-REMAINING-QUEUE.md), then R36 module order. Saved Components remains planned. All 14 module acceptance gates remain OPEN; no application source was changed.

## R41 continuation packet — bounded Slider content recovery

[Slider output and recovery](R41-SLIDES-OUTPUT-QA.md) records the manager/actions, real heading/body preview specimens, visible Layers/order/count changes, named removal/Cancel and recovered Contact. The final authored-action suite passed 335 checks; native reference inspection found no missing inspected masters/destinations. Final Mobile/Desktop return and protection refusal have sampled browser evidence. Scope remains logical identities and four content aliases within six slots; it does not establish true engine IDs, descendants, CMS bindings, arbitrary drag or persistence.

The count field now retains its variable binding. Protection changes explicitly invalidate prior one-step recovery and Undo also checks parent lock, preventing stale snapshots from silently overwriting protection. This is a bounded correction, not a complete production history policy. Source Add copies the last slide; empty Add creates New slide. Per-click Undo, identity-preserving preview after reorder and nested protection require implementation reconciliation; see the [source audit](R41-SLIDES-SOURCE-CONTRACT.md). Playback and export remain separate.

Next source-backed task is [Form type replacement and remote submission recovery](R41-FORM-CONTRACT-PLAN.md): disclose non-preserved field properties, preserve target identity/recovery, distinguish server settings from canvas history, expose incomplete Redirect and failed-save states, and use effective site Admin recipient permissions. This plan is not authored or verified Form behavior. The register remains 531 unique entries and all 14 module gates remain OPEN. No application source edits.


## R42 continuation packet — bounded Form conversion and remote saves

[Form output and recovery](R42-FORM-OUTPUT-QA.md) supersedes R41's plan-only status for the evidenced Form subset. The three-field/six-type model preserves compatible default/maxlength and represented appearance, previews textarea/input replacement, guards stale/protected targets and restores logical generations with one-step Undo. This proposed correction deliberately differs from the current source whitelist, which loses properties. Select/options, arbitrary defaults, full labels/bindings/subtree restoration and native field behavior remain open.

After-submit settings use independent remote property groups: action+URL together; message, notification recipient and spam separately. Saved/draft/pending values, deterministic failure/retry, original-target guards, effective Admin recipient permission and dirty-exit decisions are authored. Invalid URL cannot block an independent Spam save. Canvas Undo does not change acknowledged remote settings; browser playback verifies that bounded sequence. Saving does not publish or activate a form. No real server request, durable read-back, delivery or backend permission proof is claimed.

Evidence: 1,831 field and 217 remote authored-action checks passed; native audit covers 15 roots, 149 instances, 35 destinations and 381 visible geometry checks without inspected reference/overflow errors. Sample browser conversions, recovery, independent save/failure/retry, Editor/Admin outcomes and cross-domain Undo were reviewed. Timing-sensitive outside dismissal during Saving remains native-only evidence. The report retains exact fixture and remaining design/runtime limits. All 14 module gates remain OPEN and the register remains 531 unique rows. Production application source is unchanged.


## R43 continuation packet — bounded Select options and Form caller

[Select output and recovery](R43-SELECT-OUTPUT-QA.md) extends R42 with a shared Service Select task at canonical Select `8843:19020`, Form `8843:30589` and Admin Form `9026:17615`. Three logical option identities preserve immutable submitted values through finite label changes, reorder and default selection. Named removal discloses default loss and first-option fallback; Cancel and one-step Undo preserve/restore the represented state. Single/multiple default reduction and stale/protected guards have interpreted native-action evidence. Select and remote Form settings retain separate recovery domains.

The source contract still requires canonical option representation and safe metadata preservation; production code is unchanged. Form Fields now has a fourth Service selector, while the original three fields retain their six-type conversion model. Select conversion to Text/Long text is explicitly unsupported without changing its options. Browser playback verifies Form entry, refusal, Options edit, Done/Back/Escape return, changed Mobile output and Service Layer reopening. Admin caller and all alternate default/empty/protection combinations are not browser-accepted.

Evidence: 9,186 passing authored-action assertions (repeated state checks, not accepted tasks), nine native scopes / 184 instances / 36 destinations / 453 geometry checks with no inspected errors. Values remain immutable literals; finite label actions and three-slot capacity are prototype limits. Arbitrary text/value editing, validation, imported optgroups/disabled metadata/content-child conflicts, actual native control semantics, engine identity/history and submission remain open. No module gate closes; register remains 531 unique rows. Next source-backed plan is [Video Ratio ownership](R43-VIDEO-RATIO-CONTRACT.md); no Video design change is claimed by R43. Continue the remaining Inspector and R36 module queues. Goal active; no production source edits.


## R44 continuation packet — Video Ratio ownership, output and recovery

[Video Ratio evidence](R44-VIDEO-OUTPUT-QA.md) replaces plan-only status for the evidenced R43 Video subset. Settings Ratio `8843:22463` routes to shared Style `8841:14864`, where canonical row `9051:17524` / field `9051:17526` owns the global video attribute. The three values 16:9/4:3/1:1 affect player `9051:19953` at 622px Desktop  / 277px Mobile width; heights derive from that player width, not the 720/375 website width. A tall square remains reachable by scrolling the canvas. Ratio is explicitly global despite its Style location; generic breakpoint/pseudo/class ownership must not override this exception.

Raw presence/value is distinct from resolved fallback. Clean same-effective-ratio choices preserve useful Undo; empty/malformed stored values normalize as real changes; Reset removes the attribute and resolves 16:9. Known stock base height/padding cleanup is part of the same modeled change, even from Mobile, and Undo restores exact raw ratio/pair state. Only the identified stock fixture migrates; unrelated style metadata is retained. Source cleanup needs reconciliation because its current active-breakpoint batch can miss the global/base box.

Ratio Undo recovers the raw ratio and restores the legacy pair only when that operation migrated it, with target/generation/revision/eligibility checks. Later unrelated sizing edits survive non-migration Undo; later changes to the migrated pair cause a no-write refusal. This ownership correction passed 128 additional action assertions. Later URL/playback edits survive. Reviewer Reset sample was corrected to clear coherent state. Source dialog `9055:17502` demonstrates finite draft validation, Apply/Cancel, missing/changed/protected target refusal and invalid-source recovery; one recognized YouTube fixture and one unsupported fixture do not establish arbitrary URL parsing, Vimeo or provider availability.

Evidence: 1,258 authored-action assertions passed, zero failures; six native scopes, 165 instances, 47 destinations and 180 visible geometry checks without inspected errors; all 83 Style destination routes gate Video eligibility and existing close/Back/Escape persistence is retained. Sample browser geometry, cross-device retention, no-op Undo, Reset/recovery, legacy migration/Undo, source recovery/isolation and locked/stale refusal were reviewed. Report separates these layers from runtime CSS/iframe rendering, full history/rollback, autosave/read-back, unknown legacy provenance, mixed bulk edits, permissions and accessible keyboard/focus behavior.

The new canonical Ratio control raises the register to 532 unique rows. All 14 module gates remain OPEN. Next design family is [named-device Visibility versus scoped Display with hidden-element selection/recovery](R45-VISIBILITY-CONTRACT-PLAN.md), followed by the remaining Inspector and module acceptance queues. Goal active; no production source edits. Whole src diff remains SHA256 `fcce0a4e7dd29361ad875a7cb89383b211d95c84816b4ecba2c2fb6e712db2bd`; ElementContextMenu-only remains `98a827cf4fedb2f6cbffa9191f169e7c3c5b3e58bb433272e99056885ec53c5f`.

## R45 — Named-device visibility, scoped Display and recoverable selection

See [R45 output QA](R45-VISIBILITY-OUTPUT-QA.md) and [source contract](R45-VISIBILITY-CONTRACT-PLAN.md). Heading `8843:16808` and Image `8843:20467` reuse Shared Style `8841:14864`, Display `8841:14889`, and Show on Desktop/Tablet/Mobile `8841:15289` / `15294` / `15299`. Exact Layers entries retain the selected hidden target. Tablet is a limited Visibility/Display preview, not full Inspector support. Display stays reachable independently of Gap eligibility. Reset removes only the owned flag or breakpoint declaration; one-step Undo owns that property and preserves unrelated later edits.

Reviewed browser evidence demonstrates named-device isolation, hidden Heading recovery/reflow, Tablet → Mobile Display inheritance, Mobile override/reset/verified Undo, and Image combined causes retaining hidden output after only Display resets. The report excludes two misleading historical capture filenames and does not claim browser completion of the Image's final-cause recovery. Final live-action interpretation passes 3,860 repeated finite assertions, zero failures, including the final owner/capture corrections and legacy/other-family preservation. Native audit covers seven roots, 227 instances, 52 destinations and 287 geometry checks with no inspected issues; that structural checkpoint predates owner/capture logic corrections. Evidence layers remain distinct.

Fixture-owner correction separates 12 canonical finite entries from three historical heading/image routes; final chooser capture uses active eligible fixture state. A prior 18-failure checkpoint is retained and superseded by the passing final run. Source's Mobile effective-style reader omits Tablet inheritance; the corrected finite origin is proposed design behavior. Source Visibility ownership in Behaviour also differs from Figma Shared Style. Full CSS/pseudo/ancestor/import handling, Flex/Grid output, partial protection, accessible focus, runtime history/persistence/export and all-module workflows remain OPEN.

Four existing control rows are updated; no duplicate Display or extra property rows for reset/Undo: total remains 532. All 14 module gates remain OPEN. Preserve Buildrick UI and improve editing workflows per the current user direction. R46 Size/Layout authoring is deferred; its plan and the full remaining Inspector/module queue remain applicable when resumed.
