# Phase 3 information architecture — evaluated proposal

The proposed architecture keeps the existing editor engines and services, organizes entry points around user tasks, and makes ownership, scope and persistence visible. **This is an evaluated design proposal, not an approved implementation.** No application, test or Figma file was changed. The current implementation remains the AS-IS baseline, including its defects and intentionally unavailable capabilities.

The accompanying [81-row matrix](INFORMATION-ARCHITECTURE-MATRIX.csv) has one row for each F-001–F-081 inventory ID. Every row records current location/responsibility, proposed location, technical owner, user intent, context, permissions, interactions, dependencies, decision, rationale, finding links, preservation contract and remaining verification. Decisions: **33 KEEP, 45 IMPROVE, 3 RELOCATE**. No MERGE, REBUILD or DEPRECATE is justified at this stage. Combining navigation entry points does not justify merging services or removing capabilities. KEEP means preserve the boundary; it does not mean all its runtime paths passed.

## Evidence and decision method

The proposal uses the [Phase 2 completion report](PHASE-2-COMPLETION-REPORT.md), [feature inventory](FEATURE-INVENTORY.csv), three domain coverage reports, earlier [runtime findings](../ui-ux-audit-2026-10-10/REPORT.md) and [source findings](../product-audit-2026-10-10/FINDINGS.md). Runtime failures, source-confirmed risks and design judgments remain distinct. Native drag/reorder remains unverified after an incomplete browser attempt; neither KEEP nor a placement recommendation converts that into a pass.

Current routing was checked against `src/editor/rail/tabsConfig.ts`, `sidebar/TabRouter.tsx`, `sidebar/FullPageRouter.tsx`, `sidebar/tabs/build/BuildTab.tsx` and `build/catalog/groups.ts`. The actual rail is Add / Layers / Pages / Assets / CMS / Brand. Components already has direct management doors from Add, its shortcut and the palette. Templates, Brand and Settings use full-screen workspaces; full Media uses an override; CMS uses a dedicated canvas region. Publish, Review, History and Activity replace Inspector in the right column; AI and Issues have separate shell modes. Comments in older files sometimes describe obsolete placements, so executable registration/consumers take precedence over those comments.

No click-frequency or task-time study was available. The navigation recommendation follows task continuity, scope and audited behavior; it is not a claim of measured superiority. Comparative research and prototype validation can challenge it before TO-BE approval.

## Evaluating the requested starting layout

The user's proposed left Add / Layers / Pages / Media / Components / Brand, right Inspector / AI / Review / History / Issues / Activity / Publish, and dedicated Templates / Settings / full Media / CMS provide the starting hypotheses. They are not treated as a fixed icon arrangement.

| Area | Proposed disposition | Reason and tradeoff |
|---|---|---|
| Add | Left drawer; searchable Elements, Sections, Built-in components and Saved components | Frequent insertion keeps the canvas visible. Preserve Favorites, Recent, registry blocks, generated blocks and HTML paste. Section blocks are not the page-template gallery. |
| Layers | Left drawer with readable hierarchy and shared contextual actions | Supports finding, selecting and restructuring existing content. Preserve tree state and reveal the current selection. |
| Pages | Left drawer owns page/folder identity, URLs, navigation and template entry | CMS-generated pages reference Pages templates; CMS must not become a second owner of the page tree. |
| Media | Left quick chooser; Manage media opens dedicated library | Choosing one asset and maintaining metadata/versions have different space and return-context needs. “Media” is a proposed user label; keep existing `assets` route IDs/deep links. Font ownership must remain explicit through Brand/Settings and the library. |
| Components | Named insertion area in Add; one separate management view, with direct shortcut/palette access | Preserves master/instance administration without duplicating the insertion catalog. An independent rail icon remains a testable alternative, not a deleted capability. |
| CMS | Direct left entry opens quick collection context and dedicated records workspace | Retains a visible route for the bind → edit record → return-to-element workflow. A dedicated destination can have a rail entry without becoming a drawer-sized spreadsheet. |
| Brand | Left entry opens dedicated Brand workspace; relevant fields offer token shortcuts | Broad token governance needs room; applying one token should not force a full-screen detour. Components do not move into Brand merely because both are reusable. |
| Inspector | Default right mode for the current selection | Selection and edit scope remain visible; capability-aware fields stay with the engine write contract. |
| AI / Review / History / Issues / Activity / Publish | Distinct mutually exclusive right modes with appropriate contextual/topbar/menu doors | Preserve seven responsibilities without showing seven simultaneous panels or requiring seven equal-priority rail icons. Publish stays prominent in the topbar; Review remains feature/role aware. |
| Templates | Dedicated workspace from Pages > New page, named starter, shortcut/palette and site menu | Create page and Replace page must remain explicit, with backup and correct return target. Do not fold full-template selection into Add's section-block insertion. |
| Settings | Dedicated Site Settings; clearly labeled workspace destinations | Preserve site vs account/workspace ownership and each pane's save model. |

**Recommended left entry set:** Add / Layers / Pages / Media / CMS / Brand. This retains six visible destinations, substitutes a clearly named Components section and direct manager door for an independent Components rail slot, and keeps CMS discoverable. It is an IA recommendation, not authorization to overwrite current Figma or route configuration.

## Components: Add versus independent rail

Three separate intents exist: insert a built-in widget; instantiate a saved master; maintain masters, library adoption and instance overrides. Current Add already distinguishes Built-in components and Saved components. The same `useComponentList` and instantiation contract support Add and the Components management view. Retain those domain distinctions even if the label “Components” groups their entry points.

The recommended Add structure exposes Saved components without burying it behind an ambiguous “Mine” category, supplies a visible Manage components action, and opens the existing manager directly with the selection/master context intact. Shift+A and command-palette doors remain. The manager owns usage, updates, master scope and workspace library operations; the Inspector owns exceptions on the selected instance. There is one manager and one source of library state.

A separate Components rail icon improves persistent recognition for users who repeatedly govern large libraries. Its costs are another top-level destination and possible duplication of Add's insert intent; replacing CMS would weaken the known binding/content return workflow. No usage evidence establishes which cost dominates. Prototype comparison should ask users to insert a saved component, find/edit its master, adopt a workspace master, preserve an instance override and recover from a failed library read. Compare direct access, mistaken destinations and context loss. If a separate icon proves necessary, make it an alias to the same manager, never a second library or data model.

Placement does not solve [WS-02](WORKSPACES-SERVICES-COVERAGE.md) reload-lost retry work or [WS-03](WORKSPACES-SERVICES-COVERAGE.md) library errors rendered as empty results. Both states must appear in AS-IS evidence and TO-BE acceptance. Keep verified local master updates and override behavior.

## Brand: workspace plus contextual token selection

Brand remains the owner of named colors, typography, spacing and other design tokens, usage, presets and restore points. Its first view should be usable palettes/type styles with a truthful summary of where bindings apply; technical token details remain accessible. This addresses [UX-18/19](../ui-ux-audit-2026-10-10/REPORT.md) without discarding advanced tokens or claiming that every hard-coded style automatically follows a global edit.

Inspector color/type/spacing fields offer a lightweight token picker using the same token IDs and resolver. “Edit token in Brand” records the originating element, field, breakpoint and selection; return restores them. Editing a global token names global impact; detaching or overriding one field names local impact. Restore points are separate from ordinary document Undo and must retain their existing service boundary. The [verified color propagation/Undo/Redo/save/reload](EXTENDED-RUNTIME-AUDIT.md) is a preservation contract, not evidence that every token type or provider generator works.

## Responsibility and context rules

| Responsibility | Owner and caller contract | Boundary to preserve |
|---|---|---|
| Document structure and style | Composer, ElementManager, StyleEngine and shared write helpers; drawers/Inspector/menus invoke them | React chrome does not replace engine-rendered canvas HTML; role/capability/lock checks and one-operation history remain shared. |
| Page identity and navigation | Pages/PageManager plus pages service | Stable page IDs, Keep URL, home-page protection and dynamic-template references; a CMS workspace does not own another page tree. |
| Reuse | ComponentManager, ComponentStorage and componentSync | Master versus instance, site versus workspace, scoped overrides and explicit remote durability. |
| Content records/schema | CollectionManager, CollectionStorage, cmsSync and CMS service | Record saves/outbox and publishing status are independent of document binding Undo. |
| Media | MediaManager, AssetUploadService and media service | Binary upload, server asset registration, metadata updates and image references are separate states; preserve versions and deletion grace. |
| Site design tokens | Brand/Composer.setTokens and theme services | Site tokens remain separate from editor chrome tokens; global writes and local bindings carry different scope. |
| Site/workspace configuration | Settings screens and existing domain services | Each pane owns its draft/validation/save status. Workspace billing, membership and provider credentials remain dashboard-owned. |
| Review and release | Review/comment services, PublishService and worker | Review token/round and document revision are explicit; all publish callers require the same guarded baseline contract. |
| Recovery | HistoryManager, site-version service and domain-specific sync | Session Undo, local recovery, saved checkpoint restore and deployment rollback are different operations. |
| Global navigation | Existing shell routing and command registry | One destination policy may describe host, focus, close, return and capability rules; preserve distinct full-screen, canvas-region and compare-overlay shapes. |

The matrix's “Primary owner” names technical responsibility rather than assigning work to an invented team. Dependencies identify the real domain boundary that a UI proposal must call, not a new service to build.

The three explicit location changes are F-013 classes/attributes/custom CSS to Inspector Advanced, F-016 links to Inspector Content, and F-019 data binding to Inspector Content beside the bound value. Site-wide custom code stays in Settings. Interactions and animation remain Behaviour. These placements are proposals addressing [IA-10](../product-audit-2026-10-10/FINDINGS.md); they do not require a new document schema.

## Surface policy for later design

**Left drawers** support browse/select/insert while viewing the canvas. **Right modes** support selection editing, contextual assistance, review, diagnosis and release status. Only one right mode owns keyboard/focus at a time; switching back to Inspector preserves selection. A right mode opened from its door must not disappear because Inspector was hidden.

**Dedicated workspaces** provide wide tables, galleries and configuration. Templates, Settings, Media and Brand may keep their full-screen host; CMS may keep its canvas-region host with site navigation available. Shared policy must describe each host rather than force all surfaces into one identical portal. [IA-06/07](../product-audit-2026-10-10/FINDINGS.md) call for consistent contracts, not a wholesale StudioPanels rewrite.

For every transition, record caller, site, page, selection, viewport, relevant tab/search/scroll and pending draft. Returning from a media chooser restores the target property; returning from CMS restores the bound element; returning from Brand restores the token field; returning from Preview restores editing device/selection/zoom. Validate the referenced IDs still exist before restoration and present a deliberate fallback when they do not.

Escape closes the innermost owned menu/dialog first, then the parent surface according to its save guard; it must not cancel an unrelated engine transaction. Covered chrome becomes inert while a full-screen workspace is active, without making the active portal or its owned dialogs inert. Focus enters the active surface and returns to its opener. Settings' actual draft guard remains authoritative. These rules address [UX-22](../ui-ux-audit-2026-10-10/REPORT.md), [CAN-03](PHASE-2-CANVAS-FINDINGS.md) and [IA-07](../product-audit-2026-10-10/FINDINGS.md).

At constrained widths, preserve a usable canvas and one active task surface; collapse an unpinned secondary drawer or use an explicitly transient panel. Do not hard-code a new width threshold from this proposal. Validate 1440×900, 1280×720, 1024×768 and 200% browser zoom, short-height dialogs and menu corners. A phone-authoring support policy is unresolved. [IA-12/15](../product-audit-2026-10-10/FINDINGS.md) and [UX-01/07](../ui-ux-audit-2026-10-10/REPORT.md) supply the evidence and acceptance concerns.

## Permissions and persistence are part of the architecture

The matrix describes preserved/source-traced permission boundaries, not a complete runtime permission certification. Existing backend roles and feature/plan gates remain authoritative. A route being visible does not authorize its actions; a disabled control should explain a relevant restriction, while an unrelated capability need not appear. Unknown role/loading cannot justify granting a write. Site overrides, workspace roles and scoped API tokens remain separate.

Preserve read-only inspection where currently permitted. Resolve [RR-04](REVIEW-RELEASE-COVERAGE.md) deliberately: allowed comments should not disappear because a coupled review-round query is denied, and intended viewer comment policy must agree across UI and service. Do not fix navigation by broadly relaxing server authorization. [RR-01](REVIEW-RELEASE-COVERAGE.md) requires the review target to match the authorized site. [RR-02](REVIEW-RELEASE-COVERAGE.md) requires every publish entry, including AI, to carry the ordinary freshness/load contract.

The topbar may describe **document** save state. CMS, component sync, media registration/metadata and settings panes must show their own pending/error/recovery state when relevant. A global Saved indicator cannot certify all of them. “Upload complete” must identify whether file transfer, registration and the owning document save have finished. This addresses [RT-01](EXTENDED-RUNTIME-AUDIT.md), [WS-01/02](WORKSPACES-SERVICES-COVERAGE.md) and [IA-13](../product-audit-2026-10-10/FINDINGS.md) without treating an intermittent development DB failure as a diagnosed upload algorithm defect.

Domain helper F-047 is explicitly preserved as the **server error translation boundary**, not a payload serializer: `server/trpc/routers/__internal__/translateCms.ts` converts CmsError into TRPCError and retains `CMS_CONFLICT:`, `CMS_GONE:` and `CMS_INVALID:` prefixes consumed by client retry classification. Removing those discriminators for cleaner generic errors could change recovery semantics.

Backend helper/service rows default to KEEP. IMPROVE is used only where an assigned verified finding requires a boundary or consumer contract change: F-048/064 credential handling; F-049/075 privileged publish; F-067 media persistence feedback/reconciliation; F-071 review authorization/read policy; F-072 component retry/library status; F-073 analytics assurance; F-074 comparison accuracy. This does not authorize migrations, API removals or secret access. For example, [WS-05](WORKSPACES-SERVICES-COVERAGE.md) calls for a separately reviewed credential design, not copying secrets into editor state.

## Preserve valuable capabilities and be explicit about limits

Retain working document/CMS/component/Brand/history round trips, all registered useful block types, clipboard/group/wrap/arrange, rich text, forms, media editing/versions, dynamic CMS, template backup, saved templates, shared components, token restore points, review, export formats and publish gates. Dense or advanced controls can move into context/disclosure; lack of exhaustive runtime verification is not evidence that a feature should be removed.

Do not turn unsupported states into apparently working design promises: full interactive Preview, reverse-on-exit behavior, multilingual route publishing beyond the default locale, Sheets OAuth, remote audio mirroring, Vue/Next export and production collaboration retain their documented limits. Prototype representations must label future/unsupported behavior. Export HTML/ZIP/React remain distinct implemented paths; download initiation is not a completed hosted-site validation.

Tailwind, Flowbite, existing `chrome-ui` components, shared tokens and overlay primitives remain the implementation basis. Preserve document schemas, tRPC/REST contracts, server guards, engine transactions, stored IDs and route/deep-link aliases. The proposal contains no framework replacement, new design-system library, broad engine rebuild or deprecation plan.

## Validation needed before TO-BE acceptance

| Representative flow | What the proposal must demonstrate |
|---|---|
| New page from a named starter | Correct template opens; create/replace is explicit; no stacked blocking flow; backup failure truthful; returns to the intended page. |
| Add → select → style at Mobile → Preview → return | Insertion target and selection stay clear; effective values match scope; Preview retains device; limitations explicit; edit context restored. |
| Components in Add versus rail alternative | User can insert, find master, inspect usage, preserve/reset override and recover library error without duplicate management. Collect navigation mistakes and lost-context evidence. |
| Select text → bind → edit CMS record → return | Binding and record save ownership remain distinct; correct collection/field/record opens; return selects the original element. |
| Media choose → manage → replace → save/reload | Caller property preserved; binary/local/remote states truthful; metadata error/retry and deletion grace distinguish document Undo. |
| Brand token → used element → local override → reset | Global versus local scope clear; useful palette first; usage claim matches actual bindings; existing round trip preserved. |
| Viewer Review and Issues after a failed server check | Permitted comment reads survive unrelated denial; writes remain guarded; unavailable checks never become No issues. |
| History compare/restore and Publish from ordinary/AI doors | Correct metadata diff; session/saved/published boundaries legible; common publish freshness/approval contract; no accidental external action. |
| Full workspace and nested dialogs with keyboard | Covered chrome inaccessible; Escape closes one layer; draft guard runs; focus returns; target can be revealed at narrow widths. |

Provider/staging, multi-role, collaboration, offline/concurrent recovery and broader accessibility/performance verification remain the [Phase 2 handoff limits](PHASE-2-COMPLETION-REPORT.md). This proposal does not require them to be silently marked passing and does not create an additional approval of those gaps. Root-owned comparative research, responsibility/action matrices, AS-IS reconstruction and later TO-BE/prototype work must consume these decisions and challenge the open tradeoffs. Implementation still requires the later explicit approval phase.

## Artifact validation

The CSV was checked against the current inventory: 81 rows, 81 unique IDs, exact F-001–F-081 coverage, 18 populated columns and only the allowed decision vocabulary. Finding IDs link to the actual audit report families. The matrix and this report are the only Phase 3 outputs changed by this worker; no application/test/Figma edits, deployments or external messages were performed.
