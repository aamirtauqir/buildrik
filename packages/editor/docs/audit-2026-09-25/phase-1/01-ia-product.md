# Audit 1 — Editor product ownership evidence

Date: 2026-09-25. Specialist: Product Architecture. Scope: Phase 1, Audit 1 only.

Production inspection was read-only. This report is the only file created by this specialist. Existing staged and untracked changes were preserved. Runtime executed: NO. Tests executed: none. Every conclusion below is **NOT RUNTIME VERIFIED**. VERIFIED means statically verified source behavior, not an exercised UI flow.

## Coverage and evidence standard

Read the master playbook's global rules, whole-repository inventory requirement, and Prompt 1, plus `src/editor/AGENTS.md` and `src/engine/AGENTS.md`. Comments, prior audits, screenshots, and design-board references were not treated as proof. File references below are relative to `packages/editor` unless stated otherwise.

Enumerated package files and the entire `src` subtree. Inventory grouped production `.ts`/`.tsx` files, excluding tests, into editor areas: animation 2, canvas 115, chrome-ui 63, collaboration 2, components-catalog 9, design-system 89, ecommerce 2, export 6, inspector 114, media 30, onboarding 6, panels 30, rail 3, shared 2, shell 64, sidebar 197. Also inventoried engine manager families, blocks, services, shared utilities/types/hooks, templates, package tooling and test locations. Enumeration is not line-by-line inspection of every file.

Deep reads and targeted symbol inspections concentrated on shell composition, routing, module roots, the handlers and engine objects they actually call, and boundary cases listed in Prompt 1. Whole-repository application/backend/security inspection belongs to the orchestrator and other assigned specialists; this report alone does not fulfill the playbook's whole-repository completion requirement.

## Active composition and ownership

The local demo imports and mounts `AquibraStudio` at `demo/main.tsx:9` and `demo/main.tsx:42`. The package barrel exports the same component at `src/index.ts:39`. The shell creates its state, modals and composer at `src/editor/shell/AquibraStudio.tsx:151`, `:152`, and `:170`; it renders `StudioPanels` at `:539`. The downstream dashboard host must be reconciled by the repository lead.

`src/editor/rail/tabsConfig.ts:359` defines the six-item rail: Add, Layers, Pages, Assets, CMS, Brand. `src/editor/sidebar/LeftSidebar.tsx:653` chooses the rail implementation; `:714` renders `TabRouter`. Actual content ownership is therefore determined by the routers and handlers, not by the `sidebar/tabs` folder name or older placement comments.

`src/editor/shell/StudioPanels.tsx:477` composes the left sidebar, `:506` the canvas, `:542` the right inspector slot, and `:572` the conditional full-page view. Site Settings is full-page despite living under `sidebar/tabs`; Media management is a portaled workspace despite its underlying tab ID remaining `assets`.

The central document owners are explicit in `src/engine/Composer.ts:122` and `:139`: elements, selection, undo history, versions, data, global styles, templates, components, media, CMS and collaboration managers. Their construction is at `:240`–`:277`. Chrome reads/mutates these managers rather than owning independent document copies in the normal paths inspected.

## Module ownership map

| Module | Current surface and entry | Scope and actual owner | Evidence and assessment |
| --- | --- | --- | --- |
| Add / Insert | LEFT, Add rail item → `TabRouter` → `BuildTab` | Active-page element/block/component insertion; engine elements and components | `src/editor/sidebar/TabRouter.tsx:139`; `src/editor/sidebar/tabs/build/BuildTab.tsx:227` wires group actions, `:94` instantiates saved components. `src/editor/shell/hooks/useBlockInsertion.ts:40` resolves active page and `:117` invokes `insertBlock`. KEEP. |
| Layers | LEFT, Layers rail item; secondary shell Structure popover | Active page tree, selection and structure; `composer.elements`/selection | `src/editor/sidebar/TabRouter.tsx:158`; `src/editor/panels/layers/hooks/useLayerTree.ts:59` reads active page/root; `src/editor/shell/AquibraStudio.tsx:739` mounts secondary Structure popover. KEEP; no separate document owner shown. |
| Pages | LEFT, Pages rail item; page settings TEMPORARY drawer | Site page inventory and each page's metadata/SEO; `composer.elements` | `src/editor/sidebar/TabRouter.tsx:169`; `src/editor/sidebar/tabs/pages/usePages.ts:103` reads all pages, `:192` creates a page, `:210` sets active page; `src/editor/sidebar/tabs/pages/PagesTab.tsx:414` mounts settings; `src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts:267` calls `updatePage(page.id, ...)`. KEEP. |
| Assets / Media Quick | LEFT, Assets rail item → `MediaTab`/`SlimLauncher` | Quick use of site media; `composer.media` and `composer.mediaOps` | `src/editor/sidebar/TabRouter.tsx:190`; `src/editor/sidebar/tabs/media/MediaTab.tsx:73` calls shared `useMediaState`, `:276` mounts launcher, `:320` forwards bulk move to full library. KEEP. |
| Full Media Library | DEDICATED WORKSPACE, Quick Media's open-library callback or contextual manage action | Asset/folder/version and bulk management; same media manager, not an independent asset library | `src/editor/shell/StudioPanels.tsx:493`; `src/editor/sidebar/FullPageRouter.tsx:85` mounts portaled `LibraryManager`; `src/editor/media/LibraryManager.tsx:110` uses shared media state, `:503` uploads through `composer.media`. `src/editor/sidebar/tabs/media/hooks/useLibraryState.ts:75` reads engine assets and `:98` subscribes to media changes. KEEP. |
| Contextual media picker | TEMPORARY modal from Inspector/shell | Select asset for the caller's element/property; engine media | `src/editor/shell/StudioModals.tsx:181` mounts `MediaLibraryPanel`; `src/editor/media/MediaLibraryPanel.tsx:93` uses `useMediaManager` and caller selection contract. Distinct picker versus manager jobs; KEEP. |
| CMS | LEFT, CMS rail item → `ContentTab`; temporary collection setup and records modals | Collection schema, records, dynamic slug patterns; `composer.cms.collections`. External/sample sources, site variables and conditions use `composer.data` | `src/editor/sidebar/TabRouter.tsx:256`; `src/editor/sidebar/tabs/content/useContentPanel.ts:167` updates records, `:195` adds fields, `:244` binds conditions; `src/editor/sidebar/tabs/content/ContentTab.tsx:320` saves `pageSlugPattern` on the collection. `src/editor/shell/StudioModals.tsx:266` and `:273` mount CMS modals. KEEP ownership separation from Pages; generated-route reconciliation needs backend evidence. |
| Components | Global SiteMenu entry opens LEFT resource-management panel; Add inserts same reusable objects | Site reusable component definitions, master updates and instances; `composer.components` | `src/editor/shell/SiteMenu.tsx:240`; `src/editor/shell/AquibraStudio.tsx:516`; `src/editor/sidebar/TabRouter.tsx:179`; `src/editor/sidebar/tabs/component-library/useComponentsState.ts:255`, `:281`, `:326` insert/delete/rename; `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:193` updates master. KEEP Add as insertion context, Components as management owner. |
| Brand | LEFT Brand rail item, secondary SiteMenu and Settings links | Site design tokens/presets, classes, typography, color mode, lint, import/export | `src/editor/sidebar/TabRouter.tsx:261`; `src/editor/design-system/ui/DesignSystemTab.tsx:147` defines destinations; `:554` writes project design tokens and presets. `src/editor/sidebar/tabs/settings/SettingsTab.tsx:272` forwards branding to Brand. KEEP token ownership; see component-scope decision below. |
| Inspector | RIGHT, selected element | Element content/configuration/style, breakpoint/pseudo-state and bound-instance context | `src/editor/shell/StudioPanels.tsx:552`; `src/editor/inspector/ProInspector.tsx:447` scope selector; `src/editor/inspector/hooks/useStyleHandlers.ts:135` resolves selected element and `:250` writes breakpoint style. Whole-site context forwards to Brand at `src/editor/inspector/ProInspector.tsx:581`. KEEP; no second site-settings editor proved. |
| Selected-element AI | Normally RIGHT, replaces Inspector through `ui:switch-tab` | Selection-aware AI edits; engine element/style commands | `src/editor/shell/StudioPanels.tsx:340` routes AI right, `:544` mounts `AITab`; `src/editor/sidebar/tabs/ai/hooks/useAIScope.ts:20` and `:32` manage page/selection scope; `src/editor/sidebar/tabs/ai/AITab.tsx:184` applies accepted edits. CHANGE competing command-palette ownership, finding IA-PROD-01. |
| AI page editing / agent drafting | Same `AITab`, page scope and Draft mode | Page command batches and agent steps, with privileged action gate | `src/editor/sidebar/tabs/ai/AITab.tsx:102` constructs page context, `:138` streams request, `:188` delegates privileged proposal, `:345` enters agent mode. A contextual capability can legitimately offer page scope; no automatic misplacement finding based solely on broad scope. |
| Brand AI generation | TEMPORARY `AIPromptModal` launched from Brand Component styles | Generates component binding/preset schema; currently no application owner | `src/editor/design-system/ui/DesignSystemTab.tsx:923`, `:973`; `src/engine/designSystem/services/AIAssistService.ts:29` schema; `src/editor/design-system/ui/AIPromptModal.tsx:87` generation and `:219` conditional acceptance. PRODUCT DECISION REQUIRED, IA-PROD-03. |
| Review | Global topbar/menu action opens LEFT `ReviewTab` | Site review rounds, comments, approval comparison; `ReviewService` | `src/editor/shell/AquibraStudio.tsx:518`; `src/editor/sidebar/TabRouter.tsx:243`; `src/editor/sidebar/tabs/review/ReviewTab.tsx:200` loads round/comments, `:273` resolves/reopens comments; `src/services/ReviewService.ts:186` calls site-scoped comments API, `:212` current-round API. Placement decision IA-PROD-04; full collaboration ownership belongs to the collaboration specialist. |
| Issues | RIGHT shell overlay invoked globally | Page/site validation and repair routing | `src/editor/shell/AquibraStudio.tsx:606` places overlay right, `:618` mounts issues, `:633` delegates token repair to design-system manager, `:638` forwards to Brand; `src/editor/shell/IssuesPanel.tsx:116` supports page/site scope. KEEP validation owner; actual repair completeness belongs to later functional audit. |
| History / Versioning | Global SiteMenu entry opens LEFT resource panel | Saved milestones, undo changes and published versions; engine history/versions and publication API | `src/editor/shell/AquibraStudio.tsx:513`; `src/editor/sidebar/TabRouter.tsx:216`; `src/editor/sidebar/tabs/history/HistoryTab.tsx:147` reads saved versions, `:150` history; `:241` exposes Saves/Published; `src/shared/hooks/useVersionHistory.ts:103` restores through versions manager. `src/editor/shell/PublishHistory.tsx:252` starts server rollback and hands job to shell. KEEP distinct recovery and publishing sources. |
| Activity | GLOBAL site activity entry goes to dashboard; local changes are a History filter | Server site audit/activity versus current editor undo history | `src/editor/shell/SiteMenu.tsx:225` opens `/dashboard/sites/${siteId}#activity-log`; `src/editor/sidebar/tabs/history/HistoryTab.tsx:381` mounts `ActivityView` for All changes; `src/editor/sidebar/tabs/history/components/ActivityView.tsx:135` reads undo history. These are distinct jobs/data, not proved duplicate audit logs. KEEP distinction. Dashboard target behavior unverified here. |
| Publish | GLOBAL topbar primary action plus LEFT publish details panel and TEMPORARY confirmation | Site publication and current job; shell `usePublishJob` | `src/editor/shell/StudioHeader.tsx:681` resolves publish action; `src/editor/shell/AquibraStudio.tsx:511` opens details; `src/editor/sidebar/TabRouter.tsx:205` passes same job; `src/editor/shell/hooks/usePublishJob.ts:195` calls publish API, `:158` polls status. KEEP shared job owner. |
| Notifications | GLOBAL bell → temporary notification surface | User notification inbox, not current page state | `src/editor/shell/StudioHeader.tsx:788`; `src/editor/shell/NotificationPanel.tsx:113`; `src/services/NotificationService.ts:30` queries recent notifications without page/site input and `:53` mutates notification read state. KEEP; backend scope verified elsewhere. |
| Settings | DEDICATED WORKSPACE from global SiteMenu | Site configuration; workspace membership/billing are external destinations | `src/editor/sidebar/FullPageRouter.tsx:105`; `src/editor/sidebar/tabs/settings/SettingsTab.tsx:479` dispatches screens; `:438` exports site snapshot and `:440` uses sync save; `:281` forwards Members/Billing to dashboard, `:272` forwards Brand. KEEP element/page/site/workspace distinctions. |
| Templates | LEFT resource panel from SiteMenu, Pages From template, or command palette | Site/page layout resource, apply to new or current page | `src/editor/shell/AquibraStudio.tsx:515`; `src/editor/sidebar/LeftSidebar.tsx:724` sets new-page intent; `src/editor/sidebar/TabRouter.tsx:144` passes it; `src/editor/sidebar/tabs/templates/TemplatesTab.tsx:278` resolves brand tokens, `:293` creates page, `:299` imports HTML. KEEP Pages→Templates secondary workflow. |
| Commands | GLOBAL TEMPORARY command palette | Dispatches existing navigation/engine actions; should not independently own feature placement | `src/editor/shell/modals/CommandPalette.tsx:46` builds commands, `:59` emits panel request, `:149` delegates undo to engine. Competing AI dispatch exception is IA-PROD-01. |

## Findings

### IA-PROD-01 — AI has two active surface owners and separate session state

- Severity: **P2**. Status: **VERIFIED (static)**. Action: **CHANGE**. Runtime: **NOT RUNTIME VERIFIED**.
- Expected owner: one AI destination, with contextual element work in the right Inspector and explicit modes for page/agent work. Secondary commands should dispatch to that owner.
- Current owners: right `StudioPanels` AI drill-in and left `TabRouter` AI panel.
- Evidence: `src/editor/rail/tabsConfig.ts:89` defines `ai` with a shortcut. `src/editor/shell/modals/CommandPalette.tsx:50` generates a navigation command for every shortcut-bearing tab and `:59` emits `UI_PANEL_OPEN` with `panel: tab.id`. `src/editor/shell/hooks/useEditorEventListeners.ts:145` allowlists every tab ID and `:155` directly calls `openLeftPanelToTab`, so `nav-ai` reaches `src/editor/sidebar/TabRouter.tsx:155` and mounts a left `AITab`. The contextual `ui:switch-tab` path is independently intercepted at `src/editor/shell/StudioPanels.tsx:340`, setting `aiInInspector`, whose render at `:544` mounts another `AITab`. Each instance holds its own mode and messages at `src/editor/sidebar/tabs/ai/AITab.tsx:49` and `:50`.
- Root cause: feature placement was moved in one event path while the generic left-tab registry/handler retains the former owner. `UI_PANEL_OPEN` and `ui:switch-tab` are not normalized through one semantic destination.
- Affected modules: AI, Inspector, command palette, shell, left navigation.
- Recommendation: decide canonical AI home and route both events through it; prevent independently mounted AI sessions unless explicitly designed and identified as separate workspaces. Keep any alternate rail modes deliberate and covered.
- Dependencies: shell destination contract, AI session ownership. Later regression: open AI through context and palette in both orders; verify a single session, intended scope, and return to Inspector. No runtime outcome is asserted here.

### IA-PROD-02 — Brand “Component styles” includes reusable component objects

- Severity: **P2**. Status: **PRODUCT DECISION REQUIRED**. Action: **PRODUCT DECISION REQUIRED**. Runtime: **NOT RUNTIME VERIFIED**.
- Expected owner: Brand owns token/preset styles; Components owns saved masters and instances; Add owns insertion. A summary in Brand can be valid if explicitly a reference to the resource owner.
- Current owner: Brand's Component styles section mixes static component-type style catalogue with saved reusable component definitions.
- Evidence: `src/editor/design-system/ui/DesignSystemTab.tsx:158` names the destination “Component styles” and `:913` renders `ComponentsSection`. That section reads `composer.components.getAllComponents()` at `src/editor/design-system/ui/sections/ComponentsSection.tsx:101` and renders “Your saved components” at `:216`, with “1 master” and instance counts at `:242`. The actual reusable definition mutation owner remains `src/editor/sidebar/tabs/component-library/useComponentsState.ts:281` and `:326`, and master editing at `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx:193`.
- Root cause: the Brand summary aggregates two different product objects: type-level styling and saved element-tree components. Renaming the parent destination did not separate the underlying object scopes.
- Affected modules: Brand, Components, Add.
- Recommendation: explicitly retain this as a cross-link summary to Components, or limit Component styles to presets/bindings and keep saved masters in Components. Do not remove Add's legitimate insertion entry. No duplicate data store is claimed.
- Dependencies: component versus preset vocabulary; canonical management owner. Later audits can assess the existing rows' interaction behavior separately.

### IA-PROD-03 — Brand AI output has no assigned application owner

- Severity: **P2**, conditional on `dsAi` being enabled. Status: **PARTIAL; PRODUCT DECISION REQUIRED**. Action: **PRODUCT DECISION REQUIRED**. Runtime: **NOT RUNTIME VERIFIED**.
- Expected owner: a schema-generation feature must identify whether its result belongs to Brand preset registries, reusable Components, or an explicitly preview-only experiment.
- Current owner: Brand launches a temporary schema-generation modal; no result application owner is provided.
- Evidence: `src/editor/design-system/ui/DesignSystemTab.tsx:923` exposes the generation callback only when `dsAi` is enabled. The mounted `AIPromptModal` at `:973` receives `open`, `onOpenChange`, and `service`, with no `onAccept`. `src/editor/design-system/ui/AIPromptModal.tsx:87` calls `generateComponentSchema`; `:219` only renders Accept if `onAccept` exists. The returned shape at `src/engine/designSystem/services/AIAssistService.ts:29` is `{componentTypeId, variants, bindings}`. It is not a saved component element tree. The ordinary Brand apply path writes `designPresets` at `src/editor/design-system/ui/DesignSystemTab.tsx:558`, but the generated result is not connected to that path.
- Root cause: generation capability is exposed before the product defines and implements the receiving object/owner. The flag guards availability, not output ownership.
- Affected modules: Brand, design-system AI, Components terminology, preset application.
- Recommendation: decide whether this is a Brand preset generator or an explicitly preview-only capability. For a generator, plan mapping/validation into the chosen preset owner before calling the feature complete; do not wire this schema to component creation without an appropriate model conversion.
- Dependencies: product outcome decision, preset schema validation, feature-flag deployment configuration. Provider execution and real flag values were not verified. Later functional audit should exercise success/application only after the decision.

### IA-PROD-04 — Review placement conflicts with the requested right-side taxonomy

- Severity: **P2 (taxonomy alignment)**. Status: **PRODUCT DECISION REQUIRED**. Action: **PRODUCT DECISION REQUIRED**. Runtime: **NOT RUNTIME VERIFIED**.
- Expected owner under Prompt 1: RIGHT for Inspect / Configure / Review / Validate, with global site review launchers.
- Current owner: global launchers target the LEFT drawer; Review remains a site-scoped module.
- Evidence: `src/editor/shell/AquibraStudio.tsx:518` passes `onOpenReview={() => state.openLeftPanelToTab("review")}`. `src/editor/sidebar/TabRouter.tsx:243` mounts `ReviewTab`. In contrast, Issues is mounted at the right edge at `src/editor/shell/AquibraStudio.tsx:610` and Inspector at `src/editor/shell/StudioPanels.tsx:542`. `src/services/ReviewService.ts:186` and `:212` scope comments/current review round to `siteId`, so this is placement disagreement, not evidence of incorrect review data scope.
- Root cause: Review inherits the generic left-tab ownership model, while validation and inspection have right-side ownership.
- Affected modules: Review, shell, left resources, right Inspector/Issues.
- Recommendation: confirm whether the playbook's taxonomy is binding or descriptive. If binding, assign Review an explicit right-side or dedicated review workspace destination and preserve global launchers; otherwise document the accepted left-side exception. Do not mechanically move production UI during this audit.
- Dependencies: review-versus-inspector co-existence decision and collaboration specialist's scope map. Detailed panel arbitration belongs to Audit 4, not this finding.

## Boundaries that should be retained

- Pages edits page records; CMS edits collection records/schema and collection slug patterns. This pass found no proof of duplicate page/CMS state ownership. Generated-page routes need repository/backend reconciliation before a stronger conclusion.
- Add and Components share `composer.components`: insertion versus master/library management is a valid contextual split.
- Quick Media, full management, and the contextual picker share media ownership while serving different jobs.
- Site Settings forwards Brand and workspace operations; Inspector forwards whole-site styling to Brand. Those links do not constitute independent setting sources.
- Published-history rollback is initiated in History and tracked through the shell publication job. Different entry points do not prove conflicting job ownership.
- Local undo changes and dashboard site activity are different sources. Do not label them duplicate activity logs without inspecting the dashboard/backend path.

## Inspected sources and remaining gaps

The ownership table and findings name the primary files actually read or inspected at relevant symbols. Additional direct inspections included `src/editor/shell/hooks/useStudioState.ts`, `useStudioHandlers.ts`, `useEditorShortcuts.ts`, `useComposerInit.ts`, `src/editor/sidebar/tabs/content/ContentViews.tsx`, `src/editor/sidebar/tabs/history/types.ts`, `src/editor/sidebar/tabs/settings/constants.ts`, `src/editor/sidebar/tabs/settings/index.ts`, `src/editor/shell/StudioModals.tsx`, `src/editor/rail/LayoutShell.tsx` inventory, `src/engine/elements/ElementManager.ts`, `src/engine/components/ComponentManager.ts`, and `src/services/PublishService.ts` symbol searches. `src/engine/cms`, `src/engine/export`, the inspector registry, block registry and template sync were searched to locate downstream owners, not exhaustively audited.

Not examined deeply: all 115 canvas files; all inspector section bodies; every Settings screen; every design-system registry and persistence adapter; the full Add catalogue; every media modal; every template storage path; application-host integration; server/database routes; worker-generated CMS pages; workspace-scoping enforcement; transport/security/permissions; complete live collaboration semantics; alternate rail-mode runtime; feature-flag deployments. No claim of release readiness, functional completeness, security correctness or full inventory audit completion is made.

No P0 or P1 IA issue was established by this specialist. This does not certify absence of security/data-loss issues, which were outside this focused pass. The collaboration specialist should reconcile Review, Activity, presence and sharing evidence. The orchestrator should consolidate this file with repository-wide source and runtime evidence before closing Audit 1 or beginning Audit 2.

## Audit 1 closure addendum

This addendum closes the IA-specific ownership gaps above. Earlier coverage limitations remain an honest record of the initial pass; the following targeted source inspections supersede the unresolved CMS, alternate-rail and inspector-root ownership questions. Functional correctness, security and comprehensive runtime scenarios are deferred to their scheduled audits, not indefinite gates on IA closure. Runtime remains **NOT RUNTIME VERIFIED** for this specialist.

### CMS generated routes versus Pages — KEEP, ownership established

`src/services/cmsSync.ts:164` (`syncCollectionUpsert`) sends the collection's `pageSlugPattern` at `:179` and `pageTemplatePath` at `:182` to `cms.collections.upsert`. At repository-root `server/services/cms.service.ts:187`, `generateDynamicPages` reads the collection and PUBLISHED CMS entries (`:198`), maps record fields into template HTML, and returns `{path, content}` at `:217`. `appendDynamicPagesToPublish` at `:229` selects collections with both a pattern and template path (`:234`), finds the matching exported editor page (`:240`), and appends generated `{path, html}` output (`:243`). Neither function writes `Page` rows.

The workspace specialist independently traced `server/services/publish.service.ts:329`, where `startPublish` expands the submitted pages, and `:333`/`:340`, where the expanded payload is saved in `PublishBuildJob.log`. These specific publication-service lines are specialist handoff evidence; the CMS service body was directly inspected here after reading `server/AGENTS.md`.

Disposition: Pages owns authored page/template documents; CMS owns collection records and generation configuration; Publish owns derived route/output materialization. Generated routes need not appear as independently editable Page records. No IA defect is established by their absence from `composer.elements.getAllPages()`. Correct template binding, collision handling and deployed output remain later functional/security verification, not IA ownership blockers.

### Brand AI conditional ownership — finding retained, exposure bounded

`src/shared/utils/runtimeEnv.ts:87` enables `FEATURE_DS_AI` only when the Vite or Next public flag equals the string `"true"`; absent configuration evaluates false. `src/shared/utils/featureFlags.ts:15` exposes it as `dsAi`. `src/editor/shell/hooks/useComposerInit.ts:132` conditionally constructs `ComponentSchemaAIClient`, whose mutation forwards to `ai.componentSchema` at `:136`; otherwise it supplies no client. `DesignSystemTab` uses that same flag to offer its generation callback at `:923`.

Disposition: IA-PROD-03 is a conditional product decision about the receiving preset/schema owner. It is not proof that every production user reaches an incomplete generator. The acceptance callback absence and schema type remain verified source facts. Deployed flag values and provider execution are deferred; deciding the receiving owner can be included in the consolidated Phase 1 fix plan without blocking remaining read-only audits.

### Alternate rail modes — KEEP as development-only comparison surfaces

`src/shared/utils/editorViewMode.ts:70` (`resolveRailMode`) forces `"figma"` when `IS_DEV_BUILD` is false (`:71`). Only development can select `?rail=e3` or `?rail=legacy`. `src/editor/sidebar/LeftSidebar.tsx:653` chooses the four-tool renderer, `:659` the six-item Figma renderer, and `:667` the zone renderer. `FourToolRail` maps tool buttons through `TOOL_PRIMARY_TAB` at `:242` and `:277`; `FigmaRail` resolves explicit groups at `:214`; legacy `RailZone` uses `getTabsByZone` at `:133`. These renderers share the same module IDs and downstream content owner.

Disposition: do not report three live production IAs or demand removal of the development comparison renderers. The AI competing-owner finding remains independent: the command palette's `UI_PANEL_OPEN` path runs with the normal six-item rail and is not protected by the rail-mode development gate. Runtime behavior of alternate rails is deferred to navigation/surface verification.

### Inspector root and similarly named sources — KEEP single root

Production source import/render search found `src/editor/shell/StudioPanels.tsx:24` importing `ProInspector` and `:552` mounting it. `src/editor/inspector/index.ts:12` re-exports the same root, not a second implementation. `ProInspector` renders `InspectorTabContent` at `src/editor/inspector/ProInspector.tsx:608`; registry/section/tabs directories feed this root rather than competing for product ownership.

`src/editor/panels/RichTextEditor.tsx:22` is a distinct canvas text-formatting toolbar: `src/editor/canvas/overlays/CanvasOverlayGroup.tsx:16` imports it and `:354` mounts it with `onInlineCommand`. Its presence in the `panels` barrel is not proof of a competing Inspector or site-settings owner. Old `StylesPanel`/`TraitPanel` names surfaced only in comments during this source search and are not treated as live modules.

Disposition: no second active Inspector root established. IA-PROD-01 concerns two AI instances within the real shell, not multiple inspector implementations.

### Closure disposition

- IA-PROD-01: **CHANGE**, statically verified P2 competing owner; carry into Phase 1 consolidation.
- IA-PROD-02: **PRODUCT DECISION REQUIRED**, saved components in Brand's style summary; retain for consolidation.
- IA-PROD-03: **PRODUCT DECISION REQUIRED**, conditional generator receiving owner; retain with explicit feature-flag boundary.
- IA-PROD-04: **PRODUCT DECISION REQUIRED**, Review side/workspace taxonomy; retain for consolidation with collaboration evidence.
- CMS/Pages, alternate rail modes and Inspector root: **KEEP** on IA evidence; no additional ownership defect found.
- Product specialist's Audit 1 ownership coverage is ready for orchestrator closure. Broad implementation/runtime/security gaps listed earlier are scheduled follow-up audit work, not a claim that Audit 1 must remain open indefinitely. No Audit 2 work was started in this addendum.
