# Phase 5 proposed interaction and panel specification

10 October 2026. Gate 4 is closed by the [authoritative completion report](PHASE-4-COMPLETION-REPORT.md). This is the proposed behavior contract for the separate [TO-BE page 8312:2](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8312-2). It refines [Phase 3 panel/context rules](PANEL-AND-CONTEXT-RULES.md) and respects [current capability boundaries](PHASE5-CAPABILITY-BOUNDARIES.md). **These are design choices to validate, not approved application implementation.** No browser, Figma or app mutation was performed for this specification. Phases 7/8 remain deferred.

## Decision and alternatives

Retain the existing 60px rail, 280px left drawer and 300px right column as the starting design profiles. Determine docking from remaining usable canvas space and the active task; retain dedicated workspaces for broad tasks. This preserves established controls while addressing obstruction and conflicting owners.

Keeping the current ≤1366px right overlay rule would preserve familiar geometry but not resolve narrow-authoring obstruction. Making every tool a floating/resizable window would add substantial window management without evidence of need. Neither is the proposed direction. A persistent third task column and continuous panel drag-resize are also excluded from this iteration. Canvas element resizing remains a core interaction with an explicit contract below.

## P5-PANEL: width, height and ownership

All numbers are proposed CSS pixels. A collapsed panel has width 0; that is a state, not its usable minimum. The 423px canvas review floor comes from 375px site content plus two 24px gutters. It is **an initial visual-review hypothesis, not a user study, proven authoring minimum or supported-browser guarantee**. Handles, selection labels, real content and zoom can require more.

| Editor viewport | Both docked: W−60−280−300 | Initial 423 floor | Proposed normal composition | Maximum expanded left while right remains docked |
|---|---:|---|---|---:|
|1440×900|800|Pass arithmetic|Both docked; retain page breakpoint/zoom|657 =1440−60−300−423|
|1280×720|640|Pass arithmetic|Both docked; verify short-height scrolling and overlay bounds|497 =1280−60−300−423|
|1024×768|384|Fails arithmetic|Keep actively used right 300, collapse left; canvas 664. Sustained left task can instead dock280 and collapse right; canvas 684|241, below proposed 280 minimum: expansion unavailable while both are docked|

The derived 1063px threshold is the sum 60+280+300+423. It is a comparison boundary for this proposed layout, not an accepted replacement for current source breakpoints. At 1440,700px expanded left plus 300 right leaves 380, so unbounded 700 is rejected. If a deliberate expanded left task uses 700 at 1440, right must collapse and canvas becomes 680; this state change must be explicit. At 1280 the same left-only 700 leaves 520. At 1024 the left-only expansion limit is 541. Opening a chooser must not silently change the site breakpoint or zoom to make panels fit.

**Panel profiles:** rail 60 fixed; left 280 default/provisional minimum, expanded maximum `min(700, W−60−dockedRight−423)`; right 300 default/provisional minimum/maximum. No draggable panel edges. Expansion must stop before a negative/insufficient budget and explain why. These content minima remain provisional until root compares actual long-name, mixed-property and error states.

**Narrow requests:** at 1024 with Inspector active, opening left for a brief pick/search is a temporary side overlay, not a second docked panel. It has a visible close/back target and intercepts pointer events over its bounds. Completing/cancelling the choice dismisses it and restores the prior right context. A sustained left task can explicitly replace the docked right context; retain its selection/tab/scroll for return. Never leave two temporary side overlays visible. A change of viewport during an active element gesture must not auto-fit, reflow docking or reinterpret its coordinate frame mid-gesture; show the settled responsive composition after the gesture finishes/cancels.

**Height:** header/footer/status and panel heading remain outside their content scroll; one primary vertical content scroller per ordinary panel. Menus/dialogs have a viewport-contained maximum height and internal body scroll. Required actions and error details remain reachable at 720px editor height. Tables may scroll horizontally; ordinary form labels/inputs may not depend on horizontal scrolling. Two hundred percent browser zoom is a reflow/focus test, not a smaller site breakpoint; represent a focus-preserving single-task layout if the effective CSS viewport cannot fit docking.

### Full workspace fit arithmetic

These figures expose pressure; they do not establish measured readability. Use the actual design's paddings when root supplies frames.

| Workspace model |1440|1280|1024|Proposed narrow response|
|---|---:|---:|---:|---|
|Brand: 256 navigation +468 secondary preview +48 total gutters|668 main|508 main|252 main|Treat preview as a secondary tab/drawer before main controls become unusable; retain a visible Preview entry|
|Media: 256 navigation +320 details +48 gutters|816 grid|656 grid|400 grid|Use selected-asset detail route at 1024; preserve selection and Back to results. Navigation may collapse, but details must not silently disappear|
|CMS retains 60 rail +280 collection drawer|1100 workspace|940|684|At 684 show records OR record/field detail, with clear back target; do not squeeze the current table and 300px detail together|
|Settings: 256 navigation +48 gutters|1136 form|976|720|Form remains primary; validate longest fields/error/footer before claiming fit; no fourth editor column|

For prototype comparison, 480px is a **proposed main form/table-review floor**, not validated product support. It flags Brand 1024 and Media 1024 for alternate composition. Broad content may require more. Root must evaluate these with real copy and annotate adopted revisions. At widths below the demonstrated fixtures, define a task-focused fallback rather than claim a complete mobile editor.

## P5-OWNER: one active responsibility and caller return

Every surface records caller, target/site/page/selection, mode, pending state and return target. This is a design-state description, not a new API/schema. Opening History while Issues is visible must visibly replace Issues; closing returns to the prior eligible Inspector. No hidden active task behind a separate boolean mode. The same destination opened from menu/palette/topbar resolves to one visible owner.

| Owner | Proposed responsibility and exit behavior |
|---|---|
|Add / Components|Add finds/inserts elements and blocks; Components remains its reusable-master drill-in. Drawer list→detail→instance return retains component identity. Master and instance action scope is explicit; preserve the actual current master-detail/Back-to-instance contract unless a separately labelled proposal changes it|
|Layers / Pages|Layers changes structural selection; Pages changes the active document/page. Closing a drawer never clears canvas selection. Search/expansion/scroll persist. Page settings/Templates return to their actual Pages caller|
|Inspector|Selected name/type, hierarchy breadcrumb, selection count and device/Base scope stay visible. Proposed tabs are Style / Content / Effects. Field-level inherited/override/mixed status and a distinct component source/override banner provide context; the relocation table below preserves current capabilities|
|Property media/token chooser|Caller and allowed media/token kind remain fixed while browsing; Use commits to that target, Cancel applies nothing. Escalation to manager retains pick intent. Managing metadata is not automatically using an asset|
|CMS / Brand / full Media / Settings|These own broad tasks. CMS record/schema durability stays separate from document history; Brand immediate token changes are not a fictional unsaved form. Settings uses screen-specific footer versus immediate actions. Escape/Back honors the correct pending state|
|Review / History / Activity / Issues / Publish / AI|Exactly one right task replaces Inspector. Closing restores its caller. Event history is not restoration; Issues is automated checks, Review is human approval. AI scope remains selected/page/site and names its target snapshot|
|Preview / Compare / Export|Viewport-contained task surfaces with explicit source/device/scope and return. Preview preserves caller/page/device/selection on return. Compare names the two sources and what differences are included. Export retains actual format support and never implies a download from a prototype|

## P5-FOCUS: focus, Escape and keyboard scope

Modal/full-workspace layers make covered editor chrome inert; docked panels do not trap focus. Keyboard-opened surfaces focus their search/heading/first meaningful field. Pointer canvas selection keeps keyboard focus stable unless the user enters a field. Return focus goes to the still-existing opener, otherwise a stable owner heading/canvas control.

Escape resolves one level only: active field-specific cancel → property popup/menu → dialog/sheet → temporary task/workspace → canvas selection. The exact field edit behavior takes precedence; Escape cannot both dismiss a dialog and close the underlying workspace. Destructive or dirty guards must be resolved, not bypassed. Outside click dismisses a nonmodal transient only if no draft/gesture would be discarded, and must not click through into covered content.

Shortcuts use the focused owner: Pages duplicate/delete targets the page; canvas targets elements; text fields retain native editing. A displayed shortcut is either operable in that context or absent with a reason. No accidental canvas delete from a Pages keypress. Undo routes to its actual model owner; immediate server actions do not advertise document Undo. Modifier labels follow the platform.

## P5-MENU: 55 types plus selection/role overlays

The [55-type source matrix](evidence/context-menu-type-matrix.json) remains the authoritative availability baseline, not proof that actions succeed. The new [proposed menu acceptance matrix](evidence/phase5-menu-type-acceptance.csv) enumerates all 55 canonical types once, retaining their CMS/Replace/type capabilities and applicable overlay checks. Exact direct CMS types are heading/text/paragraph/link/button/image. Exact Replace-block types are container/section/hero/features/header/footer/nav/navbar/cta/card/pricing/columns/grid/flex; stack is excluded. Reserved product-card/grid/detail remain generic containers. Unknown legacy types retain fallback behavior without invented specialized controls.

Group actions by intent: selected-object actions; clipboard; structure/order; styling; component/binding; lock/visibility; destructive actions. Root's final menu screens can refine ordering while retaining capabilities. Unsupported actions are omitted; supported but unavailable actions show a persistent reason reachable by keyboard and assistive technology. Disabled styling alone is insufficient. A reason is not hidden in a pointer-only tooltip.

Action eligibility is shared across canvas menu, Layers, Inspector, palette and shortcuts. A locked element or locked ancestor is read-only for mutation: inspect/select/copy and permitted navigation remain; unlock is offered only when role/context permits. Recheck eligibility when executing, because selection, lock or permission can change after opening. Mixed selections use the applicable capability intersection; target count and affected/refused members are explicit. Group requires eligible same-parent siblings; cross-parent or root-invalid operations are unavailable with a reason. Distribute requires at least three eligible targets. Do not silently skip locked members of a destructive operation.

Label sibling order honestly: Move earlier/later or equivalent tree-order wording when the operation reorders siblings, rather than implying absolute z-index. Distinguish Wrap one element from Group siblings. Component reset/detach identifies instance/master scope and confirms destructive consequences; no new commerce or global CMS-manager actions appear on arbitrary leaf menus.

Arrow Up/Down navigate items, Right/Left open/close submenus, Home/End reach ends, Enter/Space activates, Escape closes one menu level and returns focus. Disabled items may remain focusable for their reason but cannot execute. Shift+F10/context-menu key opens at the focused target in the **proposed** behavior; the audit's current tool-denied native trigger remains untested runtime. Menu placement measures actual rendered width/height, uses 16px viewport gutters, flips submenus and scrolls inside when necessary. Validate all four corners, long labels/reasons and 200% zoom. A fixed row-count estimate is not the contract.

## P5-CANVAS: selection, insertion, move and resize

Selection distinguishes hover, selected, primary in multiselect, locked, component instance, bound content and page root. Parent/nested selection must be available through hierarchy/breadcrumb without inventing a context-menu feature already absent from the baseline. Long identities remain readable through deliberate expansion/focus, not overlapping toolbar labels. Toolbar hints never obscure the selected text or the active resize handle.

Add click inserts into an explicit supported target; drag insertion/move shows before/inside/after destination and parent identity. Invalid descendant/root/cross-parent targets show a refusal before commit. Cancel leaves tree/order/selection history as before that operation. A committed insert/move is one undoable operation; repeated pointer events are not independent history entries. Continuous physics is annotated in the prototype when not faithfully simulated.

**Resize contract:** model dimensions are CSS/document units; pointer bounds are screen units. A single gesture captures starting model bounds, scale, scroll/coordinate frame, aspect-ratio state, handle and applicable constraints. Convert the pointer delta once. At 50% zoom, a 20-screen-pixel horizontal movement represents 40 model pixels; at 100%, 20. Untouched axes stay unchanged unless a visible ratio/constraint deliberately couples them. Never store NaN, Infinity, missing or negative-invalid dimensions; refusal preserves the prior model.

Keyboard resize is a distinct defined input: focused handle, arrow increments in model units, Shift uses a documented larger increment, Enter commits, Escape cancels. Proposed increments are 1px/10px; validate against selected units and accessibility before adoption. Do not synthesize missing pointer coordinates from keyboard events. Relative/auto units require a clear resolved-value policy before committing a pixel delta; show actual resulting units.

Cancel rolls back only the active gesture transaction, never a blind global Undo. Earlier edits and history pointer remain intact. Undo after commit restores only that operation. Lock/read-only/conflict changes during a gesture cancel/refuse its pending mutation with a reason. Align/distribute use the same writable-target/breakpoint/pseudo/component scope as other Inspector writes; unsupported layout semantics are refused rather than appearing to succeed. These outcomes require later engineering verification; drawing handles is not a fix for CAN-01/02/03 or CI-01.

## P5-INSPECTOR: effective values and scope

The selected proposal is **Style / Content / Effects**. This is an information-architecture relocation from the current Style / Behaviour / Effects interface, not evidence that the application already has these destinations. It supersedes the earlier Phase 3 suggestion to keep interactions under Behaviour.

| Proposed destination | Existing capability retained / relocation |
|---|---|
|Style|Layout, size, spacing, typography, fill and border; show only controls applicable to the selected type/context|
|Content|Element-specific content, source, alt text, link, form and CMS controls; preserve type-specific restrictions and site-scoped form-delivery ownership|
|Content → Advanced|Accessibility and attributes, with existing CSS classes still reachable; disclosure reduces initial density without removing controls|
|Effects|Existing visual effects and transforms, plus a distinctly titled Interactions section relocated from Behaviour; do not imply unsupported reverse behavior or script-enabled Preview|
|Inspector header|Selected name/type and hierarchy breadcrumb plus active device/Base scope; selection count when multiple; preserve long names without covering the canvas|
|Field state|Inherited, overridden, bound, mixed and read-only states beside the actual field; reset identifies the current scope|
|Component instance banner|Component source/master identity and instance override state remain distinct; Edit master and Back to instance retain actual supported ownership|

Form, slider, collection and other type-specific Behaviour controls must be allocated by meaning to Content or Effects and remain reachable; no blanket removal follows the tab rename. A final control inventory must trace every existing applicable control to one proposed location. The 55-type matrix records current capability categories so this can be reviewed without inventing new element features.

For each field distinguish authored value, inherited/computed effective value, token binding, active breakpoint/pseudo-state and component override. Empty does not mean zero. Mixed means values actually differ among applicable targets, not simply that multiple elements are selected. Labels/reset actions identify exactly what scope changes. Reset current override must not clear base styles or unrelated component/token values.

Common controls are visible first; advanced controls remain reachable without taking over initial typography. Preserve section disclosure by type/context without surprising expansion. Selection switches flush/cancel pending edits according to explicit input commit semantics before changing target; no stale value writes to the newly selected element. Locked/conflicted fields retain readable values and a single coherent reason. Form delivery configuration remains explicitly site-scoped/immediate; collection/field/record chooser states retain draft/published distinctions.

## P5-STATE: save, role and backend truth

| State contract | Proposed visible/action rule |
|---|---|
|Document dirty/saving/saved/failed|Saved means acknowledged for the named document boundary; keep retry/recover and last-known state. Do not claim assets, CMS records or deployment are saved from that one status|
|Local media/queued registration/server-confirmed|Keep asset identity and caller; label local-only or failed registration, expose recoverable retry where a real operation exists. Upload complete and cloud persistence cannot share an unqualified success claim|
|Component local/master mirror/error|Distinguish applied local master update from pending/failed remote work. Library fetch failure offers retry rather than empty onboarding. Design cannot promise reload-durable retries before engineering delivers them|
|CMS draft/record save/schema|Dirty record guard identifies the record and retained draft. Server validation/conflict/gone/offline are distinct. Published record, generated-page configuration and deployed page remain different states|
|Settings footer/immediate/provider|Save/Discard applies only to footer-owned fields. Immediate domain/share/form/lifecycle actions state their scope. Verified means the exact provider check performed; identifier validation is not delivery assurance|
|Roles/read versus mutation|Owner/admin/editor/viewer availability follows actual service rights. Allowed comments read is not hidden by a separately forbidden round request. Disabled UI is not authorization; wrong-target operations remain server-rejected dependencies|
|AI result/freshness/apply|Target/snapshot/proposal visible; stale or failed results cannot silently apply. Privileged publish uses the same save/freshness/loaded-state guard as the normal path. No paid/provider success fabricated in a prototype|
|Issues/review/publish|Pending/unknown/failed checks are not clean. Human approval names site/revision/round. Publish checks, confirmation, job running, failed and deployed are separate; canceling a panel does not cancel a remote job without a real API|
|Credentials/external side effects|Redact credentials and offer replace without reading secrets back. Figma has no real token/email/DNS/payment/webhook action; explicitly mark simulated outcomes and unimplemented capabilities|

Recovery retains context, identifies what was kept, and offers the actual supported next action. Avoid generic reassuring success where a backend state is unknown. In particular, the audit's empty-page template replacement was followed by an unsuccessful/unverified Undo attempt; later design must explicitly define replace/backup/cancel semantics rather than assume restoration worked. Keep blank versus nonempty replacement scope visible; a backup failure never implies replacement already completed. The actual nonempty Home guard was cancelled with Home unchanged; the empty audit page retained the template after the unverified Undo attempt.

## Design acceptance and accounting

The [60-finding proposed acceptance matrix](PHASE5-CRITICAL-FINDING-ACCEPTANCE.csv) maps every existing finding ID and priority to a concrete proposed treatment, observable design criterion, contract section and engineering boundary. It now contains actual TO-BE frame references from the final ledgers, with representative, partial and governance/engineering coverage distinguished. Page 8312:2 is the design page; no referenced screen is treated as runtime proof. The independent gate review records the remaining bounded validation checks.

Required design checks: long real labels and errors at 1440×900/1280×720/1024×768; proposed docking and workspace alternate states; keyboard/menu/focus return; mixed/locked/root/component/CMS contexts; responsive scope and 200% zoom reflow; dirty/refusal/retry/empty states; all 55 type-capability rows plus role/selection overlays. Figma can demonstrate state transitions and finite geometry, not certify real gestures, persistence, screen-reader semantics, authorization or external services. Mark those as implementation dependencies in the design instead of declaring them fixed.

Before Phase 5 closure, reconcile actual node IDs into the matrix, record measured fit and revisions to the provisional floors, and verify that each critical issue has a concrete design treatment. Phase 6 then connects the agreed design and reusable system. This document creates no implementation tickets, sequencing, migrations or code changes.
