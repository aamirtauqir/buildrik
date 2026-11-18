# Buildrick — Unified editor, AI and agent workspace design

Date: 2026-10-13  
Status: **DIRECTION ACCEPTED — Editor + separate Build; first bounded Figma journey implemented, broader capabilities remain open**  
Audience: product design, Figma implementation, engineering and QA

## 1. Recommendation and purpose

### Accepted product decision — 2026-10-13

The user has chosen to repair the existing **Editor** and add a separate **Build** workspace within the same product. This supersedes the subsequent suggestion to provide only an expandable AI panel. Editor and Build share project data, CMS, Brand, assets and design foundations. The design label below refers to the Editor working surface; implementation should use **Editor / Build** for the primary switch. This accepts the two-workspace direction and Figma work, not a claim that every proposed agent/backend capability exists. Production source changes remain outside the authorized design scope.

Execution order: repair evidenced Editor defects, reuse shared foundations, add bounded Build states, connect a meaningful Editor/Build journey, and validate changes.

The completed bounded pass, its prototype evidence and remaining work are recorded in the [R28 implementation and QA report](../../master-audit-2026-10-10/R28-EDITOR-BUILD-IMPLEMENTATION.md). That report takes precedence over broader proposed behavior below when describing what is currently implemented.

Buildrick should provide one project with shared pages, components, Brand foundations, CMS, assets and history. Within the Website workspace, users choose two working views:

- **Editor:** direct manipulation, precise properties, layers and responsive editing.
- **Build:** conversation, contextual generation, editable drafts and agent task supervision.

The working layout changes while project identity and document context remain stable. Sessions, proposed Changes, human Review and publishing are separate concepts with clear ownership. External agents connect to the same product capabilities through supported tools; connecting an agent does not create another editor or require users to abandon manual editing.

This proposal extends the existing product. It does not certify that page generation, agent execution, MCP integrations or concurrent drafts already exist. It specifies the experience those capabilities would need.

### Roman Urdu overview

Editor mein user khud canvas edit karega. Build mein AI ke saath task aur draft par kaam karega. Dono ek hi project ke views honge. CMS, Brand aur Assets apne existing owners ke paas rahenge. Chhota contextual kaam drawer mein; list aur detail ke liye two panes; third pane sirf useful selected detail ya review ke waqt. External MCP agent ka result bhi isi project mein understandable task aur changes ke saath nazar aayega.

## 2. Evidence, boundaries and authority

| Item | Evidence status | Consequence |
|---|---|---|
| Existing drawer, inspector and workspace ownership | Recorded in the local panel and Phase 5 specifications | Preserve suitable rules; declare proposed exceptions below |
| Current improved Figma and R27 handover | 2026-10-12 walkthrough, followed by targeted R28 implementation and playback on 2026-10-13 | R28 validates only the changed Editor patterns and bounded Build journey |
| 173 current flow/state/helper frames | Inventoried; 100 detailed native reads, 73 pending at tool limit | No claim that every screen or journey has been validated |
| Selected-element AI | Captured scope; response/apply service behavior unverified | First bounded AI scenario to specify and verify |
| 43 AI/Agents/Team expansion scenarios | Explicitly proposed/scope unverified in Figma | Retain for reference; do not promote to finalized functionality |
| Broad agent runs, external MCP writes, isolated drafts | Proposed capabilities; integration feasibility not established here | Design states must label simulation and engineering dependencies |

Figma access was restored and retested on 2026-10-13. The accepted direction has now been implemented as a bounded design pass: shared Editor/Build navigation on 82 current workspace frames, six Build states, task-status components, and a native heading draft/review/apply/undo journey. This does not implement a general AI service, agents, MCP execution or production code. The wider recommendations below remain proposed unless the execution report explicitly validates them. The earlier 2026-10-12 walkthrough remains historical evidence, not a completion certificate.

Current implementation: [Build entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8628-12592), [three-column review](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8628-12826), [Editor](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-3), and [review/simulation contract](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8633-12844).

Local authority:

- [Current walkthrough and defects](../../master-audit-2026-10-10/CURRENT-FLOW-WALKTHROUGH.md)
- [Every discovered current screen](../../master-audit-2026-10-10/CURRENT-FLOW-WALKTHROUGH-SCREEN-REGISTER.csv)
- [Native action appendix](../../master-audit-2026-10-10/CURRENT-FLOW-WALKTHROUGH-APPENDIX.md)
- [Panel and context rules](../../master-audit-2026-10-10/PANEL-AND-CONTEXT-RULES.md)
- [Phase 5 interaction specification](../../master-audit-2026-10-10/PHASE5-INTERACTION-AND-PANEL-SPEC.md)
- [Figma current handover](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8594-2)
- [Figma current flow reconciliation](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8463-2)

## 3. Reference products and design inference

These references inform principles; they do not establish feature parity with Buildrick or require copying layouts.

| Reference, consulted 2026-10-13 | Documented behavior | Proposed lesson for Buildrick |
|---|---|---|
| [Webflow AI site builder](https://help.webflow.com/hc/en-us/articles/38840145286035-Build-a-site-with-Webflow-s-AI-site-builder) | A new-site flow refines page/section structure, then generates theme and pages and continues into editing. Availability has product-specific restrictions. | Separate initial site planning from routine changes to an existing site; reuse shared foundations |
| [v0 Design mode](https://v0.app/docs/design-mode) | Selected preview elements accept visual edits and language instructions; applying creates a reviewable version. | Let direct editing and prompts operate on the same selected object |
| [Lovable Plan mode](https://docs.lovable.dev/features/plan-mode) | Discussion, planning and building have distinct intent; conversation carries across modes. | Make mutation intent explicit; use planning for complex work without burdening every small edit |
| [Webflow MCP](https://developers.webflow.com/mcp/reference/overview) | External agents use project tools under existing permissions; capabilities and limitations are documented. | Expose the same product operations to agents and disclose unsupported actions |
| [Framer Agents](https://www.framer.com/help/articles/how-to-use-agents/) | Agent entry is in the Properties panel; prompts create/update canvas content, and selection scopes follow-up changes. | Keep contextual AI close to the editable canvas; broader Build view is an optional expansion |
| [Framer external agents](https://www.framer.com/help/articles/use-external-agents-with-framer/) | External tools can connect to project context through Framer's native agent setup. The documentation distinguishes this from manual MCP setup. | Preserve project identity across internal/external work; do not assume all agent connections use the same transport |
| [Claude Artifacts](https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them) | Substantial output has a dedicated area beside conversation and can be iterated. | Give generated output persistent identity beyond a chat message |
| [Canonical adaptive layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts) | List-detail and supporting-pane patterns adapt to available space. | Choose panes by information relationship and measured fit |

## 4. Alternatives and decisions

### How closely this follows Webflow and Framer

This proposal adopts their documented product principles: shared project context, editable output, contextual AI, reusable foundations and external-agent access to project capabilities. The exact Design/Build switch, pane arrangement, Sessions placement and change-review contract are Buildrick design recommendations; they are not claimed to be the identical navigation or layout of either reference product. Framer's documented in-editor Agent entry particularly supports retaining lightweight contextual AI in Design instead of forcing every prompt into an expanded view.

The reference comparison is documentation-based. It is not an exhaustive hands-on audit or a claim of equivalent implementation quality, performance or feature coverage. Figma and runtime validation must establish those outcomes separately.

| Approach | Benefits | Costs | Decision |
|---|---|---|---|
| AI only in the existing inspector-sized task column | Familiar, economical for small edits | Long conversation, planning and comparison compete with inspection | Retain for contextual assistance; insufficient for larger creation |
| Design and Build views over shared project state | Supports both precision and generation; preserves manual/AI continuity | Needs explicit context, draft and switching contracts | **Recommended** |
| Separate standalone AI application and export/import | Allows a fully specialized creation UI | Duplicates navigation, content identity and handoff complexity | Not proposed for the current redesign |

Decision IDs below describe the proposed contract, not completed work:

| ID | Decision |
|---|---|
| D01 | Use one project/document model and shared operation rules across manual editing, AI and supported external tools |
| D02 | Offer Design/Build as Website working views; do not add duplicate CMS or Brand managers inside Build |
| D03 | Distinguish Sessions, AI Changes, human Review and History |
| D04 | Preserve existing compact panel defaults initially; validate Build-specific widths separately |
| D05 | Use native document objects for output advertised as fully visually editable |
| D06 | Default large document modifications to a proposed change set when that capability is implemented |
| D07 | Do not invent staging, cancellation or rollback for external operations that execute immediately |
| D08 | Apply is distinct from Publish; each action names its actual persistence owner |

## 5. Information architecture and shared shell

The following are ownership categories, not a command to rename every existing navigation label.

| Owner | Responsibilities | Entry and return |
|---|---|---|
| Website | Pages, elements, layout, interactions, component instances | Existing editor; Design/Build view switch |
| CMS | Collections, records, schema and dynamic-page configuration | CMS entry; contextual binding can hand off to manager |
| Brand | Tokens, text styles, reusable style definitions, usage and impact | Brand entry; property picker links to definition |
| Assets | Library organization, metadata, files and media operations | Existing Assets/Media entry; caller-aware pick mode |
| Templates | Discover, preview and insert supported page/section templates | Existing insertion/page entry; separate browse surface |
| Site settings | Site configuration, domain and integration surfaces | Existing site menu; workspace-owned settings remain handoffs |
| Sessions | Current and prior AI/agent tasks and their outputs | Compact task indicator or Build session selector |
| Changes | Proposed modifications from a task or draft | Task result and pending-changes entry |
| Review | Human/client comments and review of an explicit target/revision | Existing Review action; service gates remain explicit |
| History | Applied revisions and supported restore/compare operations | Existing History action |

The project/site identity, active page, document/draft status, task indicator, Preview and Publish remain predictable across Design/Build. Human Review retains its purpose. Label AI review as **Review changes**, never merely Review when the owner is ambiguous.

Do not add a permanent Agents destination solely to accommodate one running task. A dedicated task-management destination becomes justified if simultaneous long-running sessions are supported and frequent. In the first bounded design, Sessions is a shared utility.

## 6. Surface-selection rules

The relevant patterns are progressive disclosure, adaptive multi-pane layouts, list-detail and supporting panes. Drawer expansion is one mechanism, not the product architecture itself.

| Surface | Use when | Example | Exit/commit rule |
|---|---|---|---|
| Popover | One small contextual choice | Colour/token/unit | Apply defined value or cancel without changing it |
| Compact drawer | Short task while canvas remains useful | Pick an image, bind a CMS field | Caller remains identifiable; explicit selection/commit semantics |
| Expanded drawer | Same bounded task needs more room and fits beside canvas | Asset browse results | Explicit Expand/Collapse; preserve draft/filter/selection |
| Two-pane workspace | List/navigation and selected work need simultaneous visibility | Records + editor; conversation + preview | Explicit selection, stable list state and return |
| Three-pane workspace | A third independently useful relationship exists | Collections + records + selected record detail | Third pane opens for selected context and can close |
| Full workspace | Task becomes primary work or canvas context adds little | Brand definitions, CMS schema, template gallery | Restore caller on return; honor actual save model |
| Dialog | Bounded decision or operation needing focused input | Confirm scoped replacement | Modal focus and explicit decision; do not use generic dialogs as feature completion |

Expansion is user-driven through a clear control or a deliberate task entry such as Manage library. Selecting a routine item should update detail in the current surface. It should not unexpectedly launch a full workspace.

Only one temporary side overlay is active at a time. Nested property pickers are allowed with clear ownership and Escape order. Repeated drawer-on-drawer stacks are not proposed.

### Fit and width policy

Retain the recorded 60px rail, 280px drawer and 300px inspector defaults for initial Design-mode comparison. These are local-spec baselines, not a claim that every control currently fits. The existing 700px expanded drawer must be bounded by available space.

Build conversation starts with a **provisional 360px design fixture**, not a production minimum. An optional properties pane starts from the existing 300px inspector. The centre must meet a measured task-specific usability floor. A scaled mobile page fitting in the centre does not establish adequate desktop authoring space.

Compute available centre width from viewport minus visible rail, panes, dividers and gutters. If the required centre does not fit: collapse inactive navigation, then optional detail; preserve the actively edited pane. Offer a sequential detail view when simultaneous panes no longer fit. Do not silently change the site's breakpoint or zoom while resizing panels.

Validate 1440×900, 1280×720, 1024×768, long content and 200% browser zoom. These are test fixtures, not a promised browser support matrix. Do not introduce drag-resizing until its persistence, keyboard operation and min/max behavior are designed; explicit expansion is sufficient initially.

## 7. Working layouts

| Layout | Left | Centre | Right | Primary purpose |
|---|---|---|---|---|
| Design | Layers/Pages/discovery drawer | Native editing canvas | Selected-object inspector | Direct manipulation |
| Design with contextual AI | Preserve needed navigation | Same canvas and selection | AI task temporarily owns right column | Bounded selected-object request |
| Build default | Conversation, context and current task | Editable output/preview | Closed | Generate and iterate |
| Build precise edit | Conversation can collapse | Same output | Selected-object properties | Refine generated output |
| Review changes | Changed pages/elements | Before/after or selected preview | Change detail when it fits | Understand and apply proposal |
| Session management | Sessions list | Selected session summary/results | Optional details | Supervise supported task runs |

Design/Build never opens four permanent columns. Session navigation, conversation and object navigation compete for defined slots instead of accumulating beside each other.

The centre is labeled **Editing draft**, **Current document**, **Historical version** or **Preview** as appropriate. Selecting an object and interacting with a rendered site are distinct tools; the current interaction mode is visible. Historical versions cannot look like freely editable current content.

## 8. Module-specific behavior

### Templates

Small section insertion starts from Add with explicit insertion target. Full page/template browsing uses categories, gallery and optional selected preview. A large selected preview may replace the gallery with Back to results; three cramped panes are not required.

Insert and Replace are separate actions. A nonempty page replacement identifies affected content and supported recovery. Do not promise Undo merely because a proposed replacement UI exists: the older runtime audit recorded an unverified restoration attempt. Cancel preserves the current page. Returning from full browsing restores filters, selected template and insertion target when it still exists.

### CMS

Binding a selected heading/image is a contextual picker. Collection management uses the existing CMS workspace ownership; Design's property inspector yields to CMS record/schema tasks. Collection navigation, records and record detail form a valid three-pane relationship only when content fits.

Switching Records/Fields/Dynamic pages/Settings retains collection identity. Changing collection is explicit. Record dirty state is separate from document dirty state. Schema editing can occupy the main area; preserve a route back to the record/list. Invalid/deleted bindings are visible rather than silently replaced.

### Brand

Applying a token is a property picker action; editing its definition belongs to Brand. The manager supports category navigation, token/style definitions and optional usage/preview. A site-wide change names its impact.

The recorded Brand model uses immediate shared document changes with undo/autosave; this proposal does not silently introduce a Save button for that existing path. An AI proposal for a Brand change is staged separately before application when supported. Once applied, it follows Brand's actual persistence model.

### Assets

Pick mode and Manage mode use the same asset identity. Pick mode carries caller, permitted type and target field; Manage mode handles asset operations. Expanding into the library preserves pick context when entered from a picker. Closing the library is not equivalent to Use selected image.

Upload progress, local availability, server registration and final source application are different states. Preserve alt text and fit when only source changes. One asset has one coherent selected state across list and grid representations.

## 9. Shared context and switching contract

The product must preserve the following context where applicable:

- Project/site and document revision.
- Page and selected object IDs, including multiple selection.
- Breakpoint, interaction state and canvas viewport.
- Active draft/proposal and owning session.
- Module identity: collection/record, token, asset or template.
- Search, filters, scroll and focused return target.
- Unsaved changes and their actual persistence owner.

Design → Build carries the selection and shows readable scope chips. Build → Design opens the same draft or document, clearly labeled. Manual edits inside an AI draft revise that draft. Applying updates the intended current document after a freshness check. A detached historical preview requires an explicit branch/restore flow if supported.

If a caller was deleted, closing a manager returns to a stable page/workspace context with a clear notice. Do not select an unrelated element and claim that the original context was restored.

## 10. AI intent, input and generated output

The composer shows scope chips such as **Home / Hero / Desktop** and relevant Brand/CMS context. Selection does not automatically grant whole-site mutation scope. Changing scope is explicit. Keep user instructions and imported reference material distinguishable.

Two common intents are visible: **Discuss** and **Make changes**. An optional **Plan first** route handles broad work. Discuss may read allowed context but must not modify project content. A plan describes target, proposed changes, dependencies and meaningful checks; it is editable before execution. Small reversible edits need not visit a plan screen.

Outputs use product names: Page draft, Section, Component, Content draft and Change proposal. Each output has an identity, target, originating session, revision and applicable actions. It must remain discoverable after the originating chat message scrolls away.

| Output | Primary action | Required context |
|---|---|---|
| New section | Insert into page | Target page/parent and position |
| Section alternative | Replace selected section | Selected target, retained data and recovery |
| Page draft | Add page | Name, route and relevant shared dependencies |
| Component | Save to components | Master identity, variants/props where supported |
| CMS content proposal | Review record changes | Collection, records, schema and save ownership |
| Multi-object proposal | Review changes | Affected objects and grouped dependencies |

Native output uses supported Buildrick document nodes, components, tokens, bindings and responsive rules. Arbitrary generated code is a separate capability: advertise only controls that its representation supports. A rendered screenshot or embed is not a native editable page.

## 11. Agent sessions and execution states

A session is a user-understandable task with a scope, source, activity and outputs. A chat can contain multiple tasks; a task can generate multiple outputs. Session activity reports completed operations, tool results and next actions, not private model reasoning.

| State | Visible information | Appropriate actions |
|---|---|---|
| Draft task | Scope, instructions and references | Edit, start or discard |
| Queued | Waiting reason and task identity | Cancel if queue supports cancellation |
| Working | Current operation and completed milestones | Add instruction; stop/request cancellation if supported |
| Needs input | Specific unresolved decision or missing access | Provide answer or adjust scope |
| Ready for review | Outputs, changed objects and check results | Inspect, revise, apply or discard proposal |
| Applying | What is being committed and to which owner | Observe; prevent duplicate submission |
| Applied | Exact committed result and remaining work | Open target; supported undo/history |
| Partially applied | Committed operations versus failed/unapplied ones | Recover only unresolved operations; do not replay everything |
| Failed | Failed step, retained work and retry eligibility | Inspect draft, revise or retry supported step |
| Cancelled | Where execution stopped and what was retained/committed | Inspect partial work; start a new attempt when appropriate |
| Stale/conflicted | Current revision differs from proposal basis | Update proposal, compare or resolve target conflicts |

Never report a percentage unless the underlying task has measurable work units. A spinner alone is insufficient for long tasks. Operation messages might read “Read Projects collection”, “Created portfolio draft” or “Mobile check failed on card spacing.” A completed generation does not imply checks passed.

Closing Build or switching to Design does not cancel a task. Background continuation must be supported by the execution service; do not promise persistence across disconnects until implemented. On reconnect, reconcile actual server/session state before offering Retry.

Avoid Pause/Resume controls unless execution can genuinely checkpoint and resume. Cancelling a request is distinct from reversing operations already committed.

## 12. MCP and external-agent experience

MCP is a connection/tool protocol, not a user-facing working mode. This proposal distinguishes two directions:

| Direction | Example | Product requirement |
|---|---|---|
| Buildrick as tool host/client | Built-in agent reads an approved external content source | Connection setup, available operations and scoped context |
| Buildrick exposes tools/server | An external agent edits a Buildrick project | Supported project operations, access enforcement and attributable change records |

The availability of either direction is an engineering dependency. A connector in one direction does not imply the other exists. A read-only connection must not appear capable of editing.

### External task visibility

When an integration provides session correlation, display client/source name, target, observed activity, result and current status. If it provides only individual operations, show attributed activity entries; do not fabricate a complete task lifecycle or duplicate an unavailable external conversation.

Design mode may show “Agent activity on About — View details.” Viewing details is explicit. Selection, viewport and active editing should not be moved merely because an external operation arrived.

External operations must use the same eligibility and validation rules as equivalent user actions. Unsupported operations return meaningful limitations. Changes to locked or unauthorized objects are refused by the service, not merely hidden in the UI.

### Cancellation and mutation truth

If the external agent supports cancellation, expose the actual operation and state. Otherwise show that Buildrick cannot stop that run from this surface. Disconnecting or revoking access may prevent future calls but does not reliably cancel an in-flight action or undo previous writes.

If tools mutate the current document immediately, record **Applied changes** and their revision. They must not appear as an unapplied draft with an Apply button. To support staged external work, engineering must first provide a draft-aware operation target and commit contract.

Connection settings belong to workspace/site configuration. Task-level context shows relevant connection names and missing-access recovery. Avoid secret values in previews, logs or shared artifacts. Do not treat a connected service as permission to publish or mutate unrelated sites.

## 13. Changes, concurrency, persistence and recovery

### Manual and generated work

For large document tasks, the preferred future model is a proposal based on a known document revision. Manual changes can continue on the main document or within the proposal, with explicit identity. Applying compares the latest target revision against the proposal basis.

If the user edits the same heading while the agent works, do not silently replace the latest heading. Present the overlapping change and offer retaining the current value, using the proposed value or regenerating against the latest state. These are design requirements; conflict merging is not established by a Figma animation.

Independent agent tasks can be queued or isolated only when engineering supports it. Until then, serialize writes to overlapping targets. Do not add multi-agent orchestration merely because the UI can display several session cards.

### Persistence ownership

| Operation | Proposed UX contract | Recovery boundary |
|---|---|---|
| Manual document style/edit | Immediate document operation with actual autosave status | Document undo where supported |
| Small selected-element AI edit | Explicit apply or clear user-selected immediate-edit behavior | Same document operation/history model |
| Large document proposal | Preview before committing supported changes | Discard unapplied proposal; undo applied change set only when supported |
| Existing Brand definition edit | Retain recorded immediate shared model | Shared impact and document undo; no invented generic Save |
| CMS record save | Record-specific server save/validation state | Retained draft, conflict handling or explicit supported restore |
| Asset upload/registration | Distinguish local, uploading, registered and selected | Retry registration/upload appropriately; cancelling selection is separate |
| Domain/integration/external action | Describe exact service operation and returned result | No blanket canvas Undo claim |
| Publish | Explicit release action after applicable checks | Deployment/rollback depend on actual release service |

An operation spanning document, CMS and external systems may partially succeed. Show which owners committed and which did not. Retry uses operation identity or equivalent duplicate protection where the implementation provides it; a failed screen should not cause duplicate records or uploads.

### Review changes

Changed objects form the first pane; the centre shows a meaningful comparison; details show values, impact and check outcomes. Group inseparable dependencies, for example a component plus a new token required to render it. Selective application is offered only for independently valid groups.

Human Review remains separate: a client may review a page/version even when no AI proposal exists. Approving a client review does not automatically apply agent changes or publish a site.

## 14. Detailed user journeys

### J01 — Rewrite one selected heading

1. In Design, select Heading and invoke Rewrite with AI.
2. The contextual panel identifies Heading, page and scope; current content is visible.
3. User submits a request; the panel shows working then a proposed alternative.
4. Preview changes only the intended heading in the draft representation.
5. Apply commits the supported text operation; Cancel preserves current text.
6. Undo restores the prior applied value through the document's supported history.

Required alternatives: empty prompt, unavailable service, deleted target, changed target and cancelled generation. This journey must not change the whole page or reset the selected breakpoint.

### J02 — New site from a brief

1. New project offers supported Blank, Template and Create with AI entry paths.
2. AI entry collects purpose, pages and optional Brand/references without a lengthy mandatory questionnaire.
3. Proposed page/section structure appears; user can reorder/remove/add supported sections.
4. Shared foundations are selected or proposed; new styles are distinguishable from reused ones.
5. Generate produces a labeled site draft with progress and recoverable partial output.
6. User previews pages and enters Design or continues Build on the same project.

This is a future creation capability, not a required detour when modifying an existing site. Failure while generating one page must not silently erase completed drafts.

### J03 — CMS portfolio page with manual refinement

1. Open Build in an existing project; request a portfolio page using Projects and existing Brand.
2. Scope shows new page, Projects collection and relevant Brand references. Required schema changes are separate from layout work.
3. For this broader task, show a short editable plan and start execution when requested.
4. Agent produces an editable draft, binding references and meaningful check results.
5. User selects a card and changes spacing through the properties pane.
6. User asks AI to refine Mobile; generation uses the latest draft revision.
7. Review displays the new page and dependencies. Any CMS writes identify their separate persistence owner.
8. Apply commits supported changes; Design opens the same page and breakpoint.

Alternatives: collection missing, insufficient record access, invalid binding, concurrent token change, generation failure and partial cross-owner commit.

### J04 — External agent edits About

1. User authorizes a supported client connection and target scope through the integration's actual mechanism.
2. External conversation requests About changes; Buildrick records attributable operations/session evidence.
3. A compact indicator appears without moving the user's current canvas.
4. View details opens either a correlated session or operation history, according to integration support.
5. Staged output opens Review changes; direct mutations appear as Applied changes.
6. Recovery offers only supported cancellation, retry, undo or history operations.

No fabricated external chat, unconditional stop control or automatic publish is included.

### J05 — Picker expands into management and returns

1. Selected image → Source picker carries image ID, current source, alt and fit.
2. User opens Manage library; manager retains the picker origin and allowed media type.
3. User browses or completes a supported upload, then selects an asset.
4. Use selected image returns and commits only the source change.
5. Cancel returns without source mutation; search/filter state remains available.

Apply this caller contract to CMS bindings, Brand tokens and templates while respecting each owner's distinct persistence rules.

### J06 — Conflict and failed apply

1. Agent starts from revision A; user updates the same object to revision B.
2. Proposal becomes review-ready but is marked stale for that object.
3. Comparison shows current B and proposed result; user resolves or regenerates.
4. During commit, any server failure identifies whether a write occurred.
5. Retry targets only unresolved operations; saved manual work is retained.

## 15. Accessibility and interaction consistency

All views reuse shared typography, spacing, semantic states, buttons, tabs, fields, menus and focus treatment. AI does not receive a separate visual language that breaks established control anatomy.

Keyboard focus follows the active task. Switching views preserves a meaningful target; returning from a chooser restores its opener when it still exists. Escape closes one layer at a time. A modal traps focus; a nonmodal supporting pane does not. Outside click cannot discard unsaved work or pass through to modify the canvas.

Scope, run state and change status must not rely on colour alone. Progress announcements should be meaningful and restrained. Loading/skeleton states should not move active controls unexpectedly. Content must remain readable with long names, translated labels, validation text and zoom.

Separate intentional scrollers for long conversation, canvas and records are acceptable. Avoid nested scrolling within ordinary property sections. Primary task actions remain reachable at short viewport heights. Preserve established shortcut ownership for text editing, Pages, canvas and other modules.

## 16. Shared components and Figma implementation map

Reuse suitable components from the existing library first. Extend through variants/properties instead of detached copies.

| Component/pattern | Essential variants/state |
|---|---|
| Project shell | Design, Build, module workspace; same global ownership |
| Context header | Current document, draft, historical, preview; scope and revision |
| Pane host | Compact, expanded, docked, temporary, sequential detail |
| Scope chip | Selected object/page/site/reference; valid, removed, unavailable |
| Composer | Discuss, Make changes, optional Plan first; idle/working/error |
| Session row/card | Queued, working, input needed, review-ready, applied, failed |
| Output card | Page/section/component/content/proposal; selectable target actions |
| Change row | Added, updated, removed, conflicting, dependent group |
| Comparison view | Before/after; current/proposed identity |
| Operation feedback | Draft retained, partially applied, retryable, unknown outcome |
| Return control | Back to list, back to caller, close task — distinct meanings |

### Screen/state implementation queue

IDs below are specification IDs, **not existing Figma node IDs**. Map them to reused/updated frames before implementation. No frame is considered delivered by appearing in this table.

| Spec ID | Required state | Prototype connection / verification |
|---|---|---|
| UX01 | Design default with current selection | Existing working inspector path retained |
| UX02 | Contextual AI request | Scope matches selected object |
| UX03 | Small change preview | Apply/cancel affect intended object only |
| UX04 | Build entry with carried context | Same page, breakpoint and draft identity |
| UX05 | New-site structure review | Edit/reorder structure before generation |
| UX06 | Running task | Useful progress; closing view does not imply cancellation |
| UX07 | Editable generated draft | Select and manually refine native object |
| UX08 | Third-pane properties / collapsed alternative | Fit at target viewports |
| UX09 | Review changes | Specific result comparison and dependencies |
| UX10 | Applied result | Opens correct page; supported undo labeled |
| UX11 | Target conflict | Current/proposed values and valid recovery |
| UX12 | Failure/partial outcome | Retained output and accurate retry boundary |
| UX13 | Sessions list and selected task | Current task identity survives navigation |
| UX14 | External activity/session | Correlated versus operation-only states |
| UX15 | Connection unavailable/read-only | No impossible write or cancel affordance |
| UX16 | Picker → expanded manager → caller | Selection/draft/filter retained |
| UX17 | CMS list/detail and narrow alternative | Collection/record ownership preserved |
| UX18 | Brand definitions/usage and narrow alternative | Shared impact; actual persistence model |
| UX19 | Template browse/preview/replace | Explicit insertion target and supported recovery |
| UX20 | Human Review versus AI Changes | Distinct routes, titles and target versions |

Use finite fixture variables to demonstrate the chosen flows. Annotate engine-dependent execution, persistence, branching, cancellation and conflict merging. Do not route unrelated buttons to generic Saved/Action options screens to inflate prototype coverage.

## 17. Reconciliation with existing work

The existing 60/280/300 Design baseline and one right-column owner remain the initial default. Build's broader conversation/preview composition is an explicit new architectural exception. Full workspaces retain their own internal layout; do not mechanically impose Website panels on CMS or Brand.

Preserve successful Heading tabs, text-style selection and corrected redirect fixtures. Update shared shells only after inspecting affected instances. The original baseline is not a modification target.

| Existing issue | Connection to this proposal | Required verification |
|---|---|---|
| WF-01 padding left/right coupling | Precise native editing must work independently of AI | Four independent sides, linked mode, Mobile and cancel |
| WF-02 CMS collection switch | Workspace ownership and context identity | Articles remains Articles across all tabs |
| WF-03 wrong caller/static canvas | Shared view/context contract | Correct caller labels and current document content |
| WF-04 duplicate asset selection | One shared picker state | Each visible representation selects consistently |
| WF-05 inspector overlap | Shared pane anatomy and fit | Master/reset/detach descriptions and actions remain readable |
| WF-06 loading completion unverified | Execution/recovery truth | Normal/error/retry/cancel paths reached in playback |
| WF-07 generic placeholder actions | Feature-specific outcomes | Meaningful states or explicit unavailable behavior |
| WF-08 fixed responsive reset fixture | Shared revision/breakpoint state | Cross-view changes preserve authored values where claimed |
| WF-09 missing grid card | Capability preservation | Third card reflows and remains reachable |

These existing defects are not resolved by documenting the new architecture.

## 18. Delivery sequence and gates

This is a controlled extension to the user's eight-pass plan, not a claim that those passes are complete.

1. **Reconcile discovery and gaps:** retain inventory; identify which proposed AI/MCP operations have real implementation support. Preserve unresolved 73 native reads and historical limits.
2. **Amend architecture foundation:** map ownership, Design/Build switching, sessions, persistence and drawer/workspace transitions against existing rules.
3. **Extend design-system foundation:** reuse shared shell/pane/state components; validate meaningful width and text-fit variants.
4. **Repair current design:** fix confirmed context, selection, layout and preservation defects before using those flows as AI foundations.
5. **Design one bounded journey:** selected Heading AI + same-selection Design/Build handoff; distinguish simulation from service execution.
6. **Cross-screen normalization (Pass 6):** apply approved shell/ownership conventions to affected screens; preserve existing valid controls and dependencies.
7. **Meaningful prototypes (Pass 7):** connect UX states for J01/J05 first; extend to broad creation/external sessions only as supported/proposed scope permits.
8. **Product QA (Pass 8):** verify journeys, component reuse, feature mapping and unresolved service limits. Never close parity from visual consistency alone.

Broad site generation, multi-agent concurrency and external orchestration should be independently scoped increments. They need not block repairing the current selected-element and panel experience.

## 19. Acceptance matrix

All acceptance items below are **PENDING IMPLEMENTATION/VALIDATION**. This document does not mark any new design complete.

| ID | Test | Pass condition |
|---|---|---|
| A01 | Switch Design → Build → Design | Same site/page/selection/breakpoint and explicit draft identity |
| A02 | Open property picker, expand manager, cancel | No mutation; original caller and meaningful focus restored |
| A03 | CMS Records → Fields → Settings | Collection identity unchanged; record draft handled correctly |
| A04 | Three-pane fit at specified viewports/zoom | Required fields/actions reachable; secondary content has a usable alternate route |
| A05 | Heading AI apply and cancel | Only intended target changes; cancel leaves current value |
| A06 | Native generated output | Layers/properties remain meaningfully editable; bindings/tokens preserved |
| A07 | Manual edit during agent generation | Latest user edit retained or explicit conflict before overwrite |
| A08 | Agent failure/cancel | Accurate committed versus retained draft state; supported recovery |
| A09 | External direct write | Appears as applied operation, not an unapplied proposal |
| A10 | External cancellation unavailable | No false Stop success or implied rollback |
| A11 | Apply proposal with dependencies | Inseparable changes remain grouped; no broken partial result |
| A12 | AI Changes versus human Review | Distinct target/actions; neither implicitly publishes |
| A13 | Publish | Actual readiness and release state; no fabricated deployment |
| A14 | Shared component change | Relevant instances checked; no detached replacements introduced without justification |
| A15 | Current feature preservation | Existing valid capabilities remain mapped and reachable |
| A16 | Keyboard/focus/shortcuts | Correct owner, one Escape level, no click-through or hidden action traps |
| A17 | Cross-owner partial failure | Completed writes distinguished; retry does not knowingly duplicate them |
| A18 | History and saved-state claims | Match actual model/service behavior and named revision |

Figma QA can validate connected state representations, geometry and component usage. Runtime checks are required for real editing, persistence, concurrency, accessibility semantics, service permissions, cancellation and publishing.

## 20. Engineering gates and remaining decisions

These are explicit dependencies with proposed design fallbacks, not empty specification placeholders.

| Gate | Evidence required before implementation claim | Fallback in design |
|---|---|---|
| Native AI edits | Supported document operations and eligible types | Bounded selected-element simulation, labeled |
| Page/site generation | Native generation model, validation and recovery | Proposed new-site journey; no launch claim |
| Draft/change sets | Revision identity, freshness checks and commit behavior | Direct operations labeled honestly; no fake staging |
| MCP directions | Exposed/consumed tools, permissions and current limitations | Only supported connection capabilities shown |
| Correlated external sessions | Session/run IDs or reliable operation attribution | Activity entries instead of fabricated session lifecycle |
| Stop/retry/resume | Execution semantics and operation outcome reporting | Hide unsupported controls; show retained result accurately |
| Cross-owner commits | Partial-failure and duplicate-operation handling | Separate owner actions and clear outcomes |
| Agent concurrency | Isolation or target-write coordination | Sequential work on overlapping targets |
| Supported editor viewport | Measured populated workflows and accessibility testing | Provisional fit fixtures; no universal minimum claim |

The immediate design deliverable after this proposal is an updated shared-shell/pane contract and connected selected-element/picker journey in the improved Figma. Broader AI/MCP features remain explicitly proposed until their scope, behavior and implementation dependencies are validated.

