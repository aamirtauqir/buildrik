# Remaining editor modules — incorporated handoff

FD-IA-09 / 2026-10-16. Selected design, not implementation. Part of the [authoritative brief](../../PRODUCT-DESIGN-BRIEF.md) and [remaining IA handoff](../../REMAINING-IA-HANDOFF.md). Source anchors are relative to packages/editor. Evidence R=bounded runtime observation, S=source inspected, P=proposed design, U=not verified. All NAV/GEO/CTRL contracts apply; repeated controls inherit their update timing, reset, persistence, undo and keyboard behavior, with exceptions below. Existing Inspector FD-INS-02/03 and BIC-01 remain normative. No Figma input.

[Detailed package, access and settings contracts](control-and-package-contracts.md). Acceptance IDs are requirements, not passed implementation tests. Unchanged controls keep existing validated values and canonical writers; the preservation ledger retains each intake description.

## IAF-01 — Editor shell and task hosting

### A. Purpose, users and supported tasks

All permitted editor users locate their current site, page, workspace and task. A task completes without unexpectedly leaving another draft.

### B. Existing controls and evidence

S: competing left Panel Tab, Issues and AI modes; present dirty registry covers Settings/CMS. R: standalone shell and rail visible. P: single task arbiter.

Source anchors: `src/editor/shell/StudioPanels.tsx`, `src/editor/rail/tabsConfig.ts`, `src/editor/shell/shellDirtyRegistry.ts`, `src/editor/shell/hooks/useTabSwitchGuard.ts`, `src/editor/shell/RightColumnPanel.tsx`.

### C. Problem and consequence

Independent modes can obscure each other; current discard guard can continue after failed discard. The same task needs a valid host in resource workspaces.

### D. Ownership and editing scope

Session owns navigation, not the document. module Workspace and active Task are independent; owner-specific drafts remain authoritative. IAF-20 adjudicates each action.

### E. Information architecture and layout

Topbar: site identity + labelled Site settings; notifications/Preview/eligible release; saved-version History via command entry and document-status details (not a topbar control). Rail: Add, Layers, Assets, CMS, Brand and Help utility. Bottom: Pages and status only. Inspector remains contextual. One active named task follows NAV-02; off-canvas AI opening requires explicit visible Editor target before execution.

### F. Panel/workspace decision and dimensions

REDESIGN arbitration; KEEP approved placements. GEO-01. Resource task tray overlays body; Editor task replaces Inspector. Header contains task title, scope, close/back; body scrolls once; footer only when a task owns actions. Reject a permanent extra task column and automatic canvas navigation.

### G. End-to-end workflow

Open named task → preserve origin → use or follow exact target → result → Close/Back restores frame. Replacing task runs its draft/operation guard. Unknown/denied request leaves current task intact. Nested comparison/picker owns a child frame. Direct rail navigation does not grow Back stack.

### H. Controls and validation

Open/Close task: NAV-01/02, no content write/Undo. Site settings label remains discoverable at compact width. Command search uses exact same destination/capability as visible buttons; unavailable action explains why. Splitter: 16 px keyboard steps, bounds GEO-01, preference-only reset. Discard failure: “Could not discard this draft. Retry or stay”; never continue navigation.

### I. States, permissions and recovery

Loading/failed task body uses existing error isolation; focus returns to invoking control. Hidden workspaces inert. Task drafts, cancelled navigation, unknown role and deleted target have distinct states. One foreground modal; no global shortcut mutates hidden canvas.

### J. Cross-module dependencies

IAF-02,05,14–22; existing Inspector integration contracts; navigation preference aliases and command registry.

### K. Preservation and compatibility

Preserve all seven right-column modes including Inspector, old shortcuts, error boundaries and useful global dialogs. Migrate old panel IDs to canonical host; no page/schema rewrite.

### L. Acceptance cases — NOT RUN in the application

T-IAF01-1: CMS record draft → History → Close restores text/query/focus. -2: Issues replaces AI only after draft decision. -3: failed discard keeps origin. -4: denied target leaves prior task. -5: F6/Tab/Escape never enter inert canvas.

### M. Verification and assumptions

Actual redesigned shell not implemented; specimen tests validate only selected navigation and geometry. Full browser/assistive-technology and role combinations remain acceptance.

## IAF-02 — Canvas, selection and responsive editing

### A. Purpose, users and supported tasks

Designers compose the intended page at an explicit authored breakpoint; view adjustments must not create accidental responsive overrides.

### B. Existing controls and evidence

S: Desktop base≥1024, Tablet 768–1023, Mobile<768; existing Wide 1920 preset. R: empty canvas/local View and zoom. Existing Inspector runtime evidence remains separate.

Source anchors: `src/editor/canvas/CanvasFooterToolbar.tsx`, `src/shared/constants/breakpoints.ts`, `src/editor/canvas/controls/CustomWidthModal.tsx`, `src/editor/canvas/Canvas.tsx`.

### C. Problem and consequence

View dimensions, authored breakpoint and available editor space can be conflated. Resize and style-copy integrity risks remain FI-01/02, not solved by toolbar relocation.

### D. Ownership and editing scope

Document owns element tree/style overrides. Session owns selection, pan/zoom, overlays and preview width. Page root and element scope remain distinct; Inspector FD-INS/BIC control semantics remain normative.

### E. Information architecture and layout

Local toolbar above canvas: Undo/Redo; ancestry; Desktop/Tablet/Mobile; width; Zoom/Fit; View (View also hosts Record switcher / Show drafts on template pages or pages with Collection lists, and Show hidden elements whenever the page has ≥1 condition, FD-DYN-01 §13; they fold into View below 720). Width input does not become a topbar site setting. Wide is a Desktop preview preset. Selection labels identify component boundary and hidden/inherited state.

### F. Panel/workspace decision and dimensions

REGROUP local toolbar; KEEP canvas. GEO-01 44h, two rows at canvas-column<720, growing with text. Inspector overlay at≤1366 changes occlusion only. Desktop authoring preview proposed 1440, Tablet 768, Mobile 375, Wide 1920; preserve stored custom width. Reject auto-switching CSS breakpoints on panel opening.

### G. End-to-end workflow

Select canvas/tree → synchronized selection → optionally enter text editing/nested target → edit valid scope → explicit commit/cancel → Undo bounded edit. Desktop base cascades down; Tablet overrides continue to Mobile unless overridden; reset removes only that layer. Changing width resolves actual breakpoint and labels it; Fit changes zoom only.

### H. Controls and validation

Custom width integer 240–2560 px; strict parsing, blank draft stays blank, zero/fraction/out-of-range inline error; Enter applies, Escape cancels. Do not strip invalid characters into a different valid number. Zoom uses existing supported presets/manual bounds; Fit explicit, no history. Parent/breadcrumb navigation is session-only. Drag shows valid parent/index, rejects invalid nesting, Escape cancels before drop; Move menu/keyboard alternative uses same validator. Inline text has visible editing mode; Escape leaves without losing already committed segments. Multi-select mixed values follows FD-INS, never reports first value as shared.

### I. States, permissions and recovery

Empty page vs loading vs unavailable page distinct. Hidden breakpoint elements remain reachable through Layers and explain current invisibility. Read-only/locked operations blocked at command layer. Selection deleted by remote change clears to valid parent/page. Resize cancel restores starting values; no partial multi-selection mutation.

### J. Cross-module dependencies

Layer synchronization; engine nesting rules; responsive/pseudo style serialization; text editors; component overrides; preview/export renderers.

### K. Preservation and compatibility

Keep marquee, nested selection, precise targeting, rotation/resize, overlays, device frame, copy/paste, keyboard and context-menu operations. Preserve breakpoint/: state payloads on clone/paste and undo. No new breakpoint schema.

### L. Acceptance cases — NOT RUN in the application

T-IAF02-1: open/resize panels at 1440/1280/1024 without changing authored width or override layer. -2: width validation and Fit distinction. -3: nested/multi/hidden/text selection round trip. -4: invalid drop/cancel/keyboard Move parity. -5: responsive styles survive duplicate/save/reopen/export.

### M. Verification and assumptions

Current Resize/Clipboard bugs not fixed. Device performance and full mutation/output parity not rerun in this phase.

## IAF-03 — Layers / Navigator

### A. Purpose, users and supported tasks

Designers target nested or invisible elements, understand hierarchy and reorganize safely.

### B. Existing controls and evidence

S: tree, search/display settings, context actions and cross-page move exist. P: coherent selection/return contract; mutation tests not run.

Source anchors: `src/editor/panels/layers/index.tsx`, `src/editor/panels/layers/LayerTreeItem.tsx`, `src/editor/panels/layers/components/LayerContextMenu.tsx`, `src/editor/panels/layers/components/MoveToPageDialog.tsx`, `src/editor/sidebar/tabs/layers/LayersTab.tsx`.

### C. Problem and consequence

Tree movement, hidden status and canvas targeting need identical semantics; moving across pages can break page-scoped resources.

### D. Ownership and editing scope

Tree/document owns order/nesting and element identity; expansion/search are session preferences. A lock limits mutation, not ability to inspect. Component definition/instance boundaries stay visible.

### E. Information architecture and layout

Rail Layers → sticky title/search/display options → virtualized tree → contextual menu. Indent+disclosure+type/name+visibility/lock signals. No CMS/assets management in the tree.

### F. Panel/workspace decision and dimensions

KEEP/REGROUP;284 default 260–360, one tree scroll. Tree indentation cannot consume action targets; truncate names with full accessible name/tooltip, horizontal navigation remains keyboard-accessible.

### G. End-to-end workflow

Search → reveal ancestors → select exact ID → canvas reveals target if possible → rename/move/hide/lock → receipt or inline error. Cross-page move → destination page/parent → dependency validation → one transaction → destination selected, origin return available. Cancel leaves tree unchanged.

### H. Controls and validation

Rename preserves empty stored custom name/type-label behavior from FD-INS; Enter/blur commits validated draft, Escape cancels. Visibility labels distinguish current-breakpoint hide from editor-only visibility. Move up/down/into/out and Move to page are keyboard alternatives to drag. Tree arrow keys navigate/expand; selection and expanded state independent. Multi actions preflight whole target set and show mixed state.

### I. States, permissions and recovery

No elements, no search matches and failed tree load differ. Invalid parent/locked ancestor/page-scoped component boundary explains reason before move. Remote deleted/relocated node updates selection by ID, not row position.

### J. Cross-module dependencies

IAF-02/05/11; nesting, lock, page/component scope and history validators.

### K. Preservation and compatibility

Keep all current context actions/display options/search, multi-selection and page move. Preserve ID s, bindings, responsive and interaction targets during reparent. Page-local master cannot be stranded invisibly.

### L. Acceptance cases — NOT RUN in the application

T-IAF03-1: hidden nested child selected from tree. -2: invalid nesting rejected via drag and menu. -3: keyboard reorder one Undo. -4: cross-page component reference preflight. -5: search/expansion preserved after resource return.

### M. Verification and assumptions

Large hierarchy/focus virtualization and movement persistence require actual implementation validation.

## IAF-04 — Add, quick insertion and generated blocks

### A. Purpose, users and supported tasks

Editors insert the right primitive, composed block or linked component at an explicit valid target.

### B. Existing controls and evidence

S: Add sections, catalogues, generation and linked definitions are distinct. BIC existing 69 block contracts govern supported registry insertion. P: clarify task grouping and restricted generation dispatcher.

Source anchors: `src/editor/sidebar/tabs/build/BuildTab.tsx`, `src/editor/sidebar/tabs/build/components/GenerateBlockScreen.tsx`, `src/editor/sidebar/tabs/ComponentsTab.tsx`, `src/blocks/blockRegistry.ts`.

### C. Problem and consequence

Catalogue items can be mistaken for reusable user masters. Generated commands currently rewrite section anchors but can forward unrelated mutation families.

### D. Ownership and editing scope

Add owns insertion intent; document owns resulting nodes; Components owns saved masters. No inserted block automatically becomes a linked component. Generating a block is insertion, not a general AI editing run.

### E. Information architecture and layout

Add local categories Elements / Blocks / Catalog components / Saved components, + contextual **CMS fields** group at the top only with a record context and "List of {collection}" entries under the Collection list block (FD-DYN-01 §9–10). Search, favorites/recents retained. Saved components exposes Manage components; Section templates live in Add → Blocks and insert in place; Blocks also carries a "Page templates…" link that opens the Templates workspace (designer-selected; primary page-template entry is Pages → New page → From template; no fifth Add category); Generate a block remains Add subview.

### F. Panel/workspace decision and dimensions

REGROUP existing 284 panel; quick-add modal retains bounded layout and target. Generated result uses same panel with prompt/result/status/Stop/Undo. Reject an additional permanent Build workspace.

### G. End-to-end workflow

Choose category/search → choose target parent/index → insert validated node/instance → select result → Inspector. Generate captures page/root/anchor → request → validate insertion-only commands → commit → show result/Undo. Stop/Back/unmount invalidates run and aborts pending result; committed insertion remains honestly reported.

### H. Controls and validation

Category/search changes no content. Search returns named kind and insertion scope. Insert disabled with parent/role/capacity reason. Generated prompt uses existing endpoint limits, not invented unlimited context. Result may only create the supported insertion tree; reject mutation of existing elements, tokens, page settings, component registry or release. Stale anchor requires reselection; no active-page fallback. Undo bound to transaction; refusal after newer history retains result and explains recovery. Generate prompt Cmd/Ctrl+Enter starts generation only when idle and valid; plain Enter inserts a newline. Active generation disables starting another run. This is a CTRL-01 keyboard exception.

### I. States, permissions and recovery

No results vs unavailable catalogue vs quota/provider failure; generating/stopping/cancelled/inserted distinct. Keyboard Enter inserts at declared target; drag alternative available. No success toast before engine receipt.

### J. Cross-module dependencies

BIC/FD-INS; nesting; component adoption; template page mode; IAF-12 quota and AI contracts.

### K. Preservation and compatibility

Keep all registry types, valid contextual/quick-add/paste routes, supported advanced native data, recents/favorites. Engine-only commerce/variant authoring has explicit IAF-23 disposition, not silent removal.

### L. Acceptance cases — NOT RUN in the application

T-IAF04-1: each BIC insertion route retains supported payload. -2: generated out-of-scope token/page command rejected whole step. -3: Stop before commit inserts nothing; after commit reports insertion. -4: stale target no wrong-page insertion. -5: Add → Manage → Back restores query/target.

### M. Verification and assumptions

No production generation request was run; provider/context quality and execution remain unverified.

## IAF-05 — Pages and page settings

### A. Purpose, users and supported tasks

Editors switch/create/organize pages and change the intended page’s metadata without editing site defaults accidentally.

### B. Existing controls and evidence

S: folders, bulk operations, filename/slug, page settings staged SEO/Social/Advanced. P: primary bottom Pages management and exact owner return.

Source anchors: `src/editor/sidebar/tabs/pages/PagesTab.tsx`, `src/editor/sidebar/tabs/pages/usePages.ts`, `src/editor/sidebar/tabs/pages/page-settings/usePageSettings.ts`, `../shared/schemas/pages.ts`.

### C. Problem and consequence

Page switch, rename and URL change have different consequences; page visibility must not imply unimplemented page-password protection.

### D. Ownership and editing scope

Page ID owns document/metadata; folder owns organization only. Site SEO defaults stay IAF-14. Existing permissions/capacity checked per operation; no role grant through bottom tabs.

### E. Information architecture and layout
 **Amendment 2026-10-17 (panels/11-PAGES-AND-BOTTOM-BAR.md §7, owner request):** Page settings footer is Save/Cancel (was Done/Cancel).
Bottom Pages switcher opens all-page list/management; active page named. Management has search, folders, Add page, bulk selection. Exact page action → Page settings with SEO/Social/Advanced and Done/Cancel. Page selection from any workspace intentionally enters Editor on selected page.

### F. Panel/workspace decision and dimensions

REGROUP page access; work-area Pages sheet/default 560, max 720, bounded viewport−48; narrow full work area. Page settings dialog 720 max with sticky tabs/footer, one body scroll. Bottom remains Pages/status only; no canvas controls.

### G. End-to-end workflow

Pages → exact page → switch after draft guards. Rename offers Keep URL / Update URL; URL change validates conflicts and redirect implications. Duplicate preserves subtree/styles/bindings with fresh node ID s and remapped internal refs. Delete prevents homepage/last-page removal, previews inbound links/templates/component scope; bulk validates all. Settings tab change retains same draft; Done awaits confirmed writer; failure retains input.

### H. Controls and validation

Page name trim 1–100; folder 1–80; preserve canonical page schema validators. SEO title≤60, description≤160 on this writer; empty uses displayed fallback without copying it into storage. Slug uniqueness/route validation before commit. Visibility Live/Hidden; legacy password data displayed as unsupported/hidden, never newly promises protected output. Advanced head code remains existing permission/sanitization boundary. Reset field removes page override only where underlying model supports it.

### I. States, permissions and recovery

Empty/search/permission/capacity states; saving/conflict/invalid slug; deleted page origin resolves containing list. Keyboard tab/arrow page navigation does not bypass unsaved guard. Existing multi operations one transaction with per-page outcome if backend differs.

### J. Cross-module dependencies

IAF-06 templates; CMS dynamic template filename/path; internal links; localization; shared component scopes; document save.

### K. Preservation and compatibility

Keep folders, listings/structure modes, home/duplicate/delete/bulk/move, metadata and template routes. Renaming template filename must update or warn on dependent CMS path references; no silent broken dynamic pages.

### L. Acceptance cases — NOT RUN in the application

T-IAF05-1: metadata tabs retain unsaved input. -2: rename Keep URL versus Update URL. -3: delete home/last rejected. -4: duplicate retains responsive/native data. -5: CMS template page rename impact and resource → page switch explicit.

### M. Verification and assumptions

Backend role/capacity and broken-reference scans not exercised in empty demo; schema differences across other writers require integration tests.

## IAF-06 — Templates and page import

### A. Purpose, users and supported tasks

Editors start a new page or deliberately replace a named page with a reusable layout.

### B. Existing controls and evidence

S: template workspace, preview, filters/plan gate, create/replace and backup-version path. New-page import catch can claim nothing changed after page creation.

Source anchors: `src/editor/sidebar/tabs/templates/TemplatesTab.tsx`, `src/editor/sidebar/tabs/templates/TemplatePreview.tsx`, `src/editor/sidebar/tabs/templates/TemplatesTabModals.tsx`.

### C. Problem and consequence

Insertion/replacement scope and backup failure need truthful outcomes; component packages must not be mistaken for page templates.

### D. Ownership and editing scope

Template catalogue owns source layout; application writes chosen/new page. Site design tokens apply through supported existing paths, not guaranteed magical conversion. Component identities are independent.

### E. Information architecture and layout

Pages → New page → From template (primary), Add → Blocks › Page templates…, or empty-page entry → Templates workspace (designer-selected single destination) with categories/search/cards and preview; section templates from Add insert in place. Persistent header shows Create new page / Replace [page]. Premium/locked state names actual entitlement. Back preserves Add query or page origin.

### F. Panel/workspace decision and dimensions

KEEP dedicated workspace; GEO-01 local nav/list. Template preview full work area with primary Apply, secondary Back, mode+target visible. Import dialog uses bounded 720 shape. No resource task UI behind active modal.

### G. End-to-end workflow

Preview → choose create/replace → preflight dependencies/dirty state → for replacement create safety backup → apply → select resulting page. Backup failure offers Retry/Cancel or separately warned Replace without backup. Import failure reconciles whether page was created/partially changed; offer receipt-based recovery, not false “nothing changed”.

### H. Controls and validation

Create page name follows IAF-05; target page required for Replace. Apply cannot double-submit; operation ID/revision binds response. Search/filter is view-only. Brand compatibility is a read-only summary: a tokenized template resolves current site Brand values; a fixed built-in template keeps its own styling. This design adds no Brand application toggle or shared-token mutation. HTML/template import keeps sanitization and supported native mappings; report unsupported portions.

### I. States, permissions and recovery

Loading/empty/no match/plan restriction/provider failure; backup pending/failed; import partial/conflicted. Cancel before commit no page mutation; after commit Close returns result. Keyboard preview navigation/focus preserved.

### J. Cross-module dependencies

Pages, Brand, template parser, history backup, publication eligibility and component/pasted HTML boundary.

### K. Preservation and compatibility

Keep catalogue categories, premium gating, preview and new-page/replace routes. Preserve prior page backup and original references until commit. Do not flatten linked components silently.

### L. Acceptance cases — NOT RUN in the application

T-IAF06-1: new page fails after creation reports actual state. -2: replace backup failure cannot silently continue. -3: role/target change before apply blocks stale commit. -4: Back returns exact filter. -5: imported supported styles round-trip.

### M. Verification and assumptions

Premium template retrieval and import mutation/runtime outputs not tested here.

## IAF-07 — CMS collections, records and dynamic pages

### A. Purpose, users and supported tasks

Content editors (site read; writes EDITOR+) manage schema and records; designers connect templates. Success means server-confirmed content, correct bindings and known publication eligibility.

### B. Existing controls and evidence

S: four collection screens exist; only Records/Fields top tabs, others menu. Record save awaits mirror receipt; field update is fire-and-forget. Delete recovery creates new record ID. R: empty CMS navigation/collection actions visible only.

Source anchors: `src/editor/cms/CmsWorkspace.tsx`, `src/editor/cms/RecordSheet.tsx`, `src/editor/cms/FieldInspector.tsx`, `src/editor/cms/fieldTypes.ts`, `src/editor/cms/DynamicPagesPane.tsx`, `src/editor/cms/CollectionSettingsPane.tsx`, `src/editor/sidebar/tabs/content/useContentPanel.ts`, `../../server/trpc/routers/cms.ts`.

### C. Problem and consequence

Hidden dynamic/settings destinations weaken discovery; optimistic schema state can overstate persistence; fake Undo can break record references.

### D. Ownership and editing scope

Site collection/schema/record ID s are canonical; Inspector owns binding/presentation, never source content. Collection writes and document bindings are separate operations with separate receipts. Record Published flag means eligible for next site output, not a deployment.

### E. Information architecture and layout

CMS workspace navigation: Collections list and Data. Collection header names collection and exposes Records / Fields / Dynamic pages / Collection settings as visible local tabs. Records table → record subview. Fields list → detail. Import CSV / Import JSON local collection actions; no extra global module.

### F. Panel/workspace decision and dimensions

REGROUP existing workspace. GEO-01 nav 240/table flex/detail 320; record work area subview 720–960 with header Back/title/status and footer Save record/Cancel. Long record form one scroll; field inspector stays detail, becoming subview if<480 remains.

### G. End-to-end workflow

Create/select collection → define fields → record → edit → Save record → pending → confirmed/failed/conflict. Preview draft fields is explicitly local; Preview saved record uses saved template data. Dynamic pages: choose non-home template path, slug pattern and SEO fields → validate → Save dynamic-page settings → eligible count. Template edit follows exact page with return. Collection delete preflights records/bindings/generated pages; do not unbind document before server result without compensating transaction.

### H. Controls and validation

Field name/key separate; key lower case letter first then letters/digits/_/-, reserved/duplicate guards. Stored types (16, `packages/shared/schemas/cms.ts:19-36`): text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email, slug; the Add field dialog currently offers 10 (text, number, richtext, image, boolean, reference, slug, textarea, date, multiselect — `editor/cms/fieldTypes.ts:17`); all stored types preserved. Required, text min/max, numeric constraints: unset≠0; invalid draft retained. Bound key/type/reference target locked with usage explanation. Dynamic slug uses {field-key}; report missing keys/template/duplicate URL s/empty results. Record published checkbox explicit next-publish meaning. CSV preview/mapping/partial result; JSON import cannot claim atomic server save. Recovery after delete labelled Restore as new record with new-ID/incoming-reference warning; exact undelete deferred pending backend support. **Amendment 2026-10-17 (panels/07-CMS.md §5, standing "apply recommended" instruction; owner may veto):** records are already soft-deleted, so exact Restore (same ID, tombstoned slug restored) is the target once a small undelete endpoint ships; Restore as new record remains the fallback until then.

### I. States, permissions and recovery

No collections, no records, no matching results and failed load differ. Saving locally/queued/confirmed/conflicted separate; failed form stays. Required/missing/deleted references visible; no replacement by first record. Schema mismatch disables incompatible bindings, retains saved raw reference for repair. Bulk operation report per record; no general mixed schema edit.

### J. Cross-module dependencies

IAF-08 bindings/data; Pages template filename; assets references; export/publish; CMS service tombstones and conflict handling.

### K. Preservation and compatibility

Keep all existing field types, constraints, CSV/JSON imports, record preview and dynamic settings. Collection export is not established in the inspected UI; no new export interface is promised. IDs/references stay unchanged by navigation. Acknowledged schema writers and coordinated collection deletion are required fixes. Existing delete recovery remains available as explicitly Restore as new record.

### L. Acceptance cases — NOT RUN in the application

T-IAF07-1: failed/queued field save never Saved. -2: rename/delete bound field preflight. -3: draft preview vs saved vs deployment. -4: deleted record restore clearly new ID, incoming refs not falsely repaired. -5: dynamic URL collision/template rename. -6: partial CSV/JSON retry cannot duplicate confirmed records.

### M. Verification and assumptions

Authenticated service persistence, real data binding and dynamic-page output not runtime verified. Large tables/field migration acceptance still required.

## IAF-08 — Data sources, site variables and element conditions

### A. Purpose, users and supported tasks

Designers bind supported data and distinguish reusable strings from session providers and element visibility logic.

### B. Existing controls and evidence

S: sources currently in-memory; site Variables in project settings; string condition operands are literal while resolver expects source Id objects; hidden marker has no established output consumer.

Source anchors: `src/editor/sidebar/tabs/content/ContentViews.tsx`, `src/editor/sidebar/tabs/content/useContentPanel.ts`, `src/engine/data/DataManager.ts`, `src/engine/export/ExportEngine.ts`, `src/engine/cms/CMSBindingManager.ts`.

### C. Problem and consequence

Durable/live-source claims and apparently working conditions would mislead users. Schema, record content and presentation binding must stay distinct.

### D. Ownership and editing scope

CMS → Data owns session Sources and site Variables. The selected element owns its bindings and conditions. A binding is managed on the property's own row in its owning Inspector tab (Content; Behaviour › Link; Style for background; Advanced attributes); Inspector Content holds the read-only Dynamic bindings summary and owns Conditions and Collection list (FD-DYN-01 §8, §11–12). Static property ownership remains FD-INS: href/playback Behaviour, background Style. An adjacent Bind affordance opens the same property-specific binding editor and returns to that row. Device visibility remains Behaviour.

### E. Information architecture and layout

CMS → Data → Sources / Site variables; a read-only Conditions index may list page/element and Locate. Locate enters the exact Inspector Content condition with an origin return frame. No second condition writer in the final IA. Preserve the current raw legacy entry/data until validated migration; after relocation the old entry redirects to the same Inspector owner. BD-20 P1–P5 expanded dynamic capability is approved direction with detailed contracts in FD-DYN-01 (DESIGN READY for written scope, 2026-10-17; §7–12.4, §14–15), not optional rejected scope.

### F. Panel/workspace decision and dimensions

REGROUP existing CMS → Data navigation; MOVE element condition editing to existing Inspector Content, not a separate expression workspace. Existing property rows keep their static tab owners; shared binding subview names property, record context and scope. New dynamic controls follow the FD-DYN-01 detailed handoff (§8–13); no untested control-density claim.

### G. End-to-end workflow

Source → inspect/replace JSON → validate → session result. Variable → key/value → usage impact → commit document. Conditions index → exact page/element → Inspector Content → inspect legacy expression/unsupported status → edit only through the supported owner → return to originating index/field. Legacy rules stay stored and read-only as "Not active — review" until the user Activates each one; published output is unchanged until then (FD-DYN-01 §12.4). Never promise working published visibility from the current no-op consumer. New property binding/condition/filter/sort output follows FD-DYN-01.

### H. Controls and validation

Variable key ^[A-Za-z][A-Za-z0-9_-]*$, unique; empty string valid. Rename/delete previews known placeholders; unresolved export literals remain diagnostics. Source JSON errors retain draft; Refresh only with provider getData, otherwise Replace JSON. Preserve raw condition operators ==, !=, >, <, >=, <=, contains, startsWith, endsWith, exists, empty and AND/OR groups; legacy string operands remain literals, source objects retain sourceId. Unknown operators stay stored/unsupported. New typed semantics, migration and publication policy are specified in FD-DYN-01 §12 (operators by field type, §12.3 output, §12.4 legacy), not by this IA closure. Binding reset removes the reference, not a record.

### I. States, permissions and recovery

Session source loss on reload is explicit. Invalid JSON/key, missing reference, mismatch, failed lookup and unsupported condition output differ. Preserve raw expression data and permission guards through relocation. Approved future authoring is labelled Planned; no simulated evaluator or automatic publication block is implied.

### J. Cross-module dependencies

BD-20 / CMS-DYNAMIC-BINDING-DESIGN.md owns the expanded dynamic-system detailed design. P1–P5 are specified there (DESIGN READY for written scope, 2026-10-17), awaiting implementation; P5 is conditional and members wait for D7, live sources for D8. Durable external providers and a new publication-block policy require separate decisions. Current site variables retain document persistence.

### K. Preservation and compatibility

Preserve source IDs, raw expressions and existing binding identities. Never reinterpret legacy strings as paths, silently remove a current authoring path before replacement, or keep two final writers. M07-100 future Behaviour/optional placement is superseded only by BD-20; device visibility remains Behaviour. CMS Sources/site variables stay distinct from Brand tokens.

### L. Acceptance cases — NOT RUN in the application

T-IAF08-1: session-source reload limitation. -2: legacy literals/source objects/operators round-trip unchanged. -3: deleted source/field repair retains references. -4: current unsupported output never appears verified. -5: variable rename shows usage. -6: Conditions index/old entry enters exact Inspector Content target with return and no duplicate writer. -7: Bind from a Behaviour/Style row returns to that row. -8: BD-20 expanded feature cannot ship without its separate detailed/output/migration acceptance.

### M. Verification and assumptions

Existing-product IA and expanded BD-20 destinations are settled. Those detailed questions are decided in FD-DYN-01 (D3 hidden render, D4 Create dynamic page, D6 strip rich text, D5 Show drafts); it is DESIGN READY for its written scope (2026-10-17); open only D7 members and D8 live-source runtime. Durable providers remain outside approved expansion.

## IAF-09 — Assets, fonts and image versions

### A. Purpose, users and supported tasks

Users find/manage their assets; site editors assign exact placements and manage site fonts without assuming workspace-wide asset sharing.

### B. Existing controls and evidence

S: user-owned discovery, optional site association; page/CSS usage only; version creates new asset; grace delete separate from Composer Undo. R: Assets drawer and manager empty state captured; service mutations not tested.

Source anchors: `src/editor/media/LibraryManager.tsx`, `src/editor/sidebar/tabs/media/MediaTab.tsx`, `src/editor/sidebar/tabs/media/hooks/useLibraryState.ts`, `src/editor/media/image-editor/imageEdits.ts`, `src/editor/media/components/SiteFontsModal.tsx`, `src/engine/media/MediaCommandLayer.ts`, `../../server/trpc/routers/media.ts`.

### C. Problem and consequence

Zero known page placements is not globally unused; uploading/versioning, choosing and replacing all uses have distinct effects. Folders/font/library identity must not be broadened to team ownership casually.

### D. Ownership and editing scope

Asset owner user; write additionally requires site EDITOR when site-associated. Page/CMS field owns chosen source and local alt. Asset default alt differs from placement override. Site fonts are resources; applying font is Inspector/Brand.

### E. Information architecture and layout

Rail Assets opens workspace: All/Recent/Used on this site/No known page placements/My folders/Fonts. Search+type/format/tag/folder/sort; grid/list+density; multi toolbar. Detail tabs metadata/known usage/versions. Contextual picker reuses library query but carries target/property and Choose/Cancel; no unrelated auto assignment. Preserve insertion separately: Assets manager offers Insert and return / Place on canvas. These deliberately return to Editor with a temporary left Asset picker replacing Add/Layers (284px, same bounds), keeping the canvas exposed. The picker names Insert image at [parent/index] or Replace [image/property]; selecting an image element does not silently decide replace versus create. Choose/Cancel and Back to library preserve origin/query. Drag starts only from this visible picker, uses canvas drop validation and cancels with Escape. OS file drop remains available directly on Editor canvas. Click/keyboard Choose uses the same captured valid target and transaction as drag.

### F. Panel/workspace decision and dimensions

REGROUP/KEEP management workspace GEO-01; detail 320. Image editor dedicated work area subview with own preview/controls; below 1280 controls stack, no tiny inspector. Picker 720 dialog; large selection uses full work area while preserving captured target.

### G. End-to-end workflow

Upload → progress → confirmed asset → optional Choose target. Edit image → preview → Save version → new asset receipt → optional Replace on chosen pages. Existing placements unchanged until explicit replacement. Replace across site previews known page placements/version family, chosen pages and unknown CMS/other-site usage; atomic document transaction proposed. Delete asset uses grace recovery; folder delete has separate consequence, no fake global Undo. Selected replacement policy: preflight the entire captured page-placement set, then apply all document replacements in one transaction/Undo unit. Any invalid target prevents the batch; there is no partial-success claim for this new transaction. Asset upload/version history is a separate receipt and cannot be rolled back by that document Undo. The current per-source partial implementation must change to meet this contract. If the original placement target disappears or becomes locked, retain the chosen asset and require a new target; never mutate the current arbitrary selection. Upload confirmation and placement confirmation are separate. Completing insertion restores the prior Add/Layers panel and selects the inserted element; replacement retains original selection. Cancel returns to the previous workspace/picker and does not delete completed uploads.

### H. Controls and validation

Crop Free/1:1/4:3/3:2/16:9; rotation/flip/zoom; brightness/contrast/saturation−100..100; blur 0..20 px. Resize positive integer≤8192, empty follows crop,0 invalid, aspect lock. Export Web P/JPEG/PNG, default Web P quality 85 (10–100); PNG quality applicability explained. Save version separate asset upload and history receipt; history failure does not erase successful file. Search indicates partial/truncated server result; reset filters view only. Choose revalidates target/resource access; alt field distinguishes default vs override. Fonts upload/add never implies applied typography.

### I. States, permissions and recovery

No assets/no results/failed list/truncated list; upload pending/failed/cancelled; duplicate/version conflict; missing/deleted asset fallback. In flight upload deletion immediate versus post upload grace explicitly different. Permission/retry/recovery visible. Bulk selection stable ID s across pagination.

### J. Cross-module dependencies

IAF-07CMS src fields; FD-INS media; Brand fonts; ingestion limits; usage scanner coverage; asset GC/grace server jobs.

### K. Preservation and compatibility

Keep stock/icons/font management, filters/sorting/metadata, folders, paste URL, image editor, clone/version/replace/delete/recovery. Keep ID s/version relationships; no new workspace asset sharing. Fix FI-03 independently. Preserve used assets even when partial scanner reports 0.

### L. Acceptance cases — NOT RUN in the application

T-IAF09-1: picker return exact image/record field after workspace visit. -2: Save version preserves existing placements. -3: replacement all-or-none with one Undo; failed preflight changes no placements. -4: search failed≠empty. -5: grace Undo vs folder/in flight delete. -6: CMS usage not declared absent by page-only scan. -7: management → Place on canvas → keyboard/drag create or replace → exact return; invalid drop/cancel and OS file drop retain supported behavior.

### M. Verification and assumptions

Actual upload/quota/provider/image-output/GC and cross-site privacy not exercised. All numeric image controls source-located, not newly tested.

## IAF-10 — Brand and shared website design resources

### A. Purpose, users and supported tasks

Designers manage site tokens/type styles and apply them with known shared reach; chrome design tokens remain an entirely separate system.

### B. Existing controls and evidence

S:14 token kinds, shared Composer history, duplicated style catalogues, inert preset binding, class apply depends selection, JSON import fidelity limits. R: Brand workspace navigation and token groups observed.

Source anchors: `src/editor/design-system/ui/BrandWorkspace.tsx`, `src/editor/design-system/state/useProjectTokens.ts`, `src/editor/design-system/ui/sections/StylesRouter.tsx`, `src/editor/design-system/ui/sections/ClassesSection.tsx`, `src/editor/design-system/ui/sections/ExportSection.tsx`.

### C. Problem and consequence

Brand definitions, catalogues and local class application lack one clear task model; importing/previewing may imply unsupported fidelity or hidden global changes.

### D. Ownership and editing scope

Site project.settings.designTokens owns tokens/aliases/type styles; Composer history and document save. Inspector applies references/local overrides. Preview Light/Dark is session; Dark mode Off/Auto is saved. Component masters remain IAF-11.

### E. Information architecture and layout

Brand local nav: Tokens (Colours, Typography, Spacing, Other named kinds), Reusable styles (Type styles/presets, Classes), Tools (Dark mode, Checks, Starters, Import/export). Other kinds explicitly lists radius, shadow, motion, border, opacity, z-index, breakpoint, grid, sizing, icon, imagery. Header Undo/Redo, Review changes, Restore points. Catalogue component styles becomes Browse sections in Add link, never master management.

### F. Panel/workspace decision and dimensions

REGROUP workspace; GEO-01 nav 240/detail 320, preview flex; token detail replaces body if insufficient space. Colour scale/logo URL/connect-to-token bounded subtasks, exact return. Reject wider Inspector and duplicated style editors.

### G. End-to-end workflow

Open exact token from Inspector → usage/scope → edit compatible value → live applied → document pending/saved → Back exact element. Delete used token → replacement compatible choice → usage impact → one transaction. Starters now Preview → Confirm → one Undo with restore point. Import → validate → mapping/impact → apply → receipt; export names fidelity. Before starter commit capture a local token/document checkpoint usable by document Undo. When a server restore point is available, create it before commit. If unavailable/offline/standalone, retain the existing local starter capability: show “Local recovery only; no server restore point” and allow explicit Apply with local Undo, or Cancel. A failed local checkpoint blocks application. Never claim a queued server restore point is confirmed.

### H. Controls and validation

Token edit uses existing kind validators; invalid values remain local draft, no silent seed reset. Alias must same compatible kind; cycles/deleted targets blocked. Seed reset and delete separate. Classes Apply shows named selection; absent target choose Editor target, no hidden selection. Dark Auto creates missing dark aliases only after restore point; existing preserved. JSON array or {schemaVersion, tokens}; Update matching retains absent, Keep existing skips matches; show added/modified/skipped/type+spacing unsupported new/alias literalization. CSS/JSON/Tailwind exports distinct; Tailwind dark-mode loss explicit. CSS strategy media/data attribute/off export-only, not site Dark mode.

### I. States, permissions and recovery

Loading/migration read-only/invalid tokens/usage unknown/empty type distinct. Used token delete blocks when usage unknown with Retry. No generic Save button for live applied edits. Restore point retrieval server confirmed, restoring one document Undo unit, conflict check; cannot claim external CMS/media restore.

### J. Cross-module dependencies

Inspector resolved values; font assets; shared history; export token closure; starter application; migration gates.

### K. Preservation and compatibility

Keep all 14 kinds, aliases, colour tools, checks, classes, presets, starters/import export/restore points. Preserve legacy tokens and unsupported inert metadata; label read-only catalogue. No independent class rule engine invented.

### L. Acceptance cases — NOT RUN in the application

T-IAF10-1: Inspector → token → Back exact context. -2: used token replacement and alias cycle. -3: import counts/fidelity match actual result. -4: Dark Auto preserves existing. -5: starter cancel unchanged/commit one Undo. -6: migration hold reason not permission denial.

### M. Verification and assumptions

Live shared changes across real projects/output and JSON lossless claim remain unverified; no new variant/preset binding authoring promised.

## IAF-11 — Workspace components, site adoption and packages

### A. Purpose, users and supported tasks

Editors create once and reuse across the same workspace, transfer editable packages, and understand local versus shared updates.

### B. Existing controls and evidence

S: per-site definitions/same-ID adoption/latest updated aggregation, positional overrides, ID-only cache, incomplete variant duplication; not canonical workspace versioning. P: explicit resource identity/revisions, PKG-01.

Source anchors: `src/shared/types/components.ts`, `src/engine/components/ComponentManager.ts`, `src/engine/components/ComponentInstances.ts`, `src/engine/components/ComponentStorage.ts`, `src/editor/sidebar/tabs/component-library/ComponentDetailScreen.tsx`, `../../server/trpc/routers/site-component.ts`, `../../server/services/site-component.service.ts`, `../../prisma/schema.prisma`.

### C. Problem and consequence

Cross-site reuse currently lacks stable canonical revision/lifetime; structural updates can misapply overrides; source ACL filtering and recovery need engineering fixes.

### D. Ownership and editing scope

New Workspace Library Component identity +immutable Component Revision with dependency snapshot/stable node keys; destination-site adoption pin. Page-only definitions preserved. EDITOR/DESIGNER can create new/shared identity and author local draft; ADMIN/OWNER manage/publish next revision of existing workspace identity. No automatic cross-site propagation.

### E. Information architecture and layout

Add → Saved components → Manage components; manager list This page / This site (adopted/local legacy) / Workspace library; detail shows identity, scope, version, usages, variants, updates. Import/Export in manager; dashboard existing administration remains. Contextual instance → exact master → return. No new permanent rail entry.

### F. Panel/workspace decision and dimensions

DEDICATED manager work area and detail GEO-01; source update remains Update from selection, not invented master canvas. Import dialog 720 min 480 max 960; no Inspector package UI. Reject dashboard-only transfer and automatic global updates.

### G. End-to-end workflow

Create from selection → name → Workspace library default or This page → Create and publish component (shared) /Create component(page). Preserve first instance conversion/identical groups option. Adopt pinned revision → Insert. Local update → site-local draft based N; Review update shows old/new, instances, override conflicts, deps → Apply to this site/Keep current. Existing workspace publish next revision explicit ADMIN. Package flow PKG-01. When the manager hides the canvas, Update from selection retains the original source ID/page. Choose on canvas deliberately opens Editor in source-picking mode; select an eligible source, then Return to component review. Cancel restores the manager and original source unchanged. Recheck source revision/role and destination before update; this is not an in-place master editor.

### H. Controls and validation

Name trim 1–200 general; AI creation limit 60 separate. Scope wording visible before commit. Update from selection names both source and destination. Stable definition node keys preserve semantic override target; ambiguous legacy positional mapping requires user resolution. Variant selection preserves stored ID/default/variantProperties/variants; unresolved state not first variant fallback. Delete workspace=tombstone future discovery; existing pins render. Delete site master materializes complete instances before detach; recovery includes master/instances/variants/overrides, not document Undo. Preserve Rename, Duplicate, Detach all and Used on. Rename a local master follows site edit permission; rename workspace identity requires ADMIN. Duplicate creates a fresh independent definition and complete variants/dependencies, never overwrites an existing identity. Detach all is explicitly limited to accessible current-site instances, previews count and materializes full supported output; it cannot claim to detach other sites. Used on lists authorized usages and locates the exact page/instance with a return to the same detail and query. Failed or stale resource recovery retains the receipt and offers review/copy rather than destructive overwrite.

### I. States, permissions and recovery

Authorized list empty/search/loading/restricted/update available/local draft/conflict/missing revision/locked instance/capacity. Apply all site targets atomic or no success; server recheck. Restore after intervening changes offers new revision/copy rather than overwrite. Page-deleted masters keep recoverable page context.

### J. Cross-module dependencies

PKG-01; FI-05 server ACL; stable ID s; cache migration; site capacity; token/CSS/media/CMS/forms/commerce dependencies; IAF-20.

### K. Preservation and compatibility

Preserve old(workspace, component ID, payload hash)snapshots; identical may link, divergent kept pending explicit reconciliation; no timestamp winner. Migrate cache(site ID, component ID)+revision cache. Published library survives origin site delete. Fix duplicate variants now; Defer new variant authoring until identity/update/output tests pass.

### L. Acceptance cases — NOT RUN in the application

T-IAF11-1: A → B same workspace pin survives A delete. -2: other workspace/restricted resources blocked. -3: reorder preserves override targets. -4: divergent legacy snapshots retained. -5: duplicate/import all variant metadata. -6: local draft/global publish distinction. -7: delete/detach conditional recovery. Plus T-PKG01–12.

### M. Verification and assumptions

Additive schema/API/cache work required; no package/version migration implemented or runtime verified. Existing server capability does not automatically authorize proposed new endpoint.

## IAF-12 — Scoped AI editing

### A. Purpose, users and supported tasks

Editors propose and approve bounded changes, understand what was actually applied and recover without undoing unrelated work.

### B. Existing controls and evidence

S: element/multi/similar/page/site, plan review, partial steps; context cap 200 and request trimming; active page read/Undo all false completion risks. Provider not run.

Source anchors: `src/editor/sidebar/tabs/ai/AITab.tsx`, `src/editor/sidebar/tabs/ai/hooks/useAgentRunner.ts`, `src/editor/sidebar/tabs/ai/hooks/useAIScope.ts`, `src/editor/sidebar/tabs/ai/applySetStyle.ts`, `src/editor/sidebar/tabs/ai/hooks/runPromptOnce.ts`.

### C. Problem and consequence

Wide scope can overpromise; target can change midrun; global token/component resource writes lie outside ordinary document rollback.

### D. Ownership and editing scope

AI proposal/session owner; actual writes dispatched to document/Brand/components/publish authoritative owners. AI never new permission owner. Site publish separate consequence gate. Similar means same element type on active page.

### E. Information architecture and layout

AI right task GEO-01; visible scope chip/page/target count/context coverage above prompt; plan list → step before/after → Approve/Skip/Stop; results ledger. Off canvas opening preserves workspace; Run requires deliberate Editor target confirmation. Add Generate remains IAF-04.

### F. Panel/workspace decision and dimensions

KEEP/REGROUP 360 task host; no Build workspace. Wide scope plan uses same panel with expand comparison child surface; primary decision sticky, detail scroll. No hidden mutations behind resource workspace.

### G. End-to-end workflow

Settle origin valid draft → choose scope → pin run/page ID s/allowed ID s/revisions/breakpoint/state → single element proposed step or wider editable plan → Run N steps → review each → revalidate → approve atomic batch → result counts → Back Inspector. Stale target requires regenerate/review. Stop prevents new steps; applied changes remain. Undo all stops at unrelated history and reports N undone/M remaining. II-03 remains normative: Back to Inspector does not cancel an active run or approve a step. Retain the run owner/status and visible Open AI run action. A switch to another task/resource preserves the run and status; no new mutations execute invisibly without the user returning to the visible approval step. Stop is a separate explicit action.

### H. Controls and validation

Prompt 1–5000 chars; max 8 plan steps, title≤120, instruction≤500. Style≤200 allowlist; plaintext≤2000 no markup. Supported state hover/focus/active/disabled and tablet/mobile; create heading/text/paragraph/button/link/list/container/section/columns/grid/flex; sections 1–12 children; move up/down. Page SEO 60/160/slug 100+collision. AI component name≤60, tree≤200. Model server owned. Quota{used, limit, resetsAt},−1 unlimited, unknown≠0. Show included/total context, request remaining batch or narrow; no false whole-site completion. Entire step commands validated before apply. Shared Brand change and component creation separate impact/receipt/recovery cards. Each style proposal names its actual base, breakpoint or pseudo-state destination. Plain set-style writes base; it must not inherit the toolbar’s current authored state implicitly. AI prompt Enter sends only when idle and valid; Shift+Enter inserts a newline. During review/running, Enter cannot start an overlapping run. These are explicit CTRL-01 textarea exceptions.

### I. States, permissions and recovery

Idle/planning/review/running/done and pending/running/awaiting/applied/skipped/no change/failed steps preserved. Provider/quota/offline/denied/stale/partial Undo distinct. Prompt retained on error/return. Stop button reachable; keyboard Approve cannot bypass comparison scope.

### J. Cross-module dependencies

IAF-01 draft registry; command permission/lock/target parent checks; tokens; components; publication consequence gate; engine undo provenance.

### K. Preservation and compatibility

Keep scopes/plan suggestions/partial results/skips top retry/Inspector return. Correct silent invalid commands and false Undone status. No automatic shared resource change bundled with local style approval.

### L. Acceptance cases — NOT RUN in the application

T-IAF12-1: page switch mid run never retargets. -2: locked/deleted parent blocks insert. -3: set-token separate approval. -4: component creation residue disclosed. -5: intervening edit Undo all honest. -6: trimmed context cannot report exhaustive completion. -7: denied publish separate.

### M. Verification and assumptions

AI generation quality/quota/provider and mutation behavior not runtime tested; source gap corrections not implemented.

## IAF-13 — Forms and submissions

### A. Purpose, users and supported tasks

Designers build forms and configure their server-owned after-submit behavior; site operators inspect, export and manage submissions. Native markup, server form settings and received data remain distinct.

### B. Existing controls and evidence

S: native form controls and FormAfterSubmitSection in Inspector; FormsScreen has site-wide Export CSV, pagination/detail, read/spam/archive and permanent delete. Server list/get/export require site access; mutation EDITOR, actual recipient change ADMIN. The Settings Forms screen currently has an EDITOR UI gate. No authenticated delivery test run.

Source anchors: `src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx`, `src/editor/inspector/sections/FormAfterSubmitSection.tsx`, `src/engine/export/ExportEngine.ts`, `../../server/trpc/routers/forms.ts`, `../shared/schemas/forms.ts`.

### C. Problem and consequence

Form name/field name/output delivery/inbox must share identity; a previewed form is not proof of production delivery.

### D. Ownership and editing scope

Document form owns native markup/attributes, field names and validation. Server FormBlock keyed by (siteId, blockId=form element ID) owns successAction, successMessage, redirectUrl, notifyEmail and spamProtection. Its canonical UI remains Inspector → Behaviour → After submit with immediate service save outside Composer Undo. Submission records are a third server resource. Keep current Settings UI eligibility and distinguish actual endpoint access under ACC-01.

### E. Information architecture and layout

Add → Elements → Form → Inspector Content/Behaviour. Form submissions stays Site settings → Form submissions. Its existing Configure in Inspector action intentionally navigates to the exact page/form and opens Behaviour → After submit, preserving inbox filter/selected row/scroll and a return path. Missing form resolves to a clear unavailable-target state, not a generic integration page. Actual provider integration doors remain separate owners where implemented.

### F. Panel/workspace decision and dimensions

KEEP selected form Inspector 300; REGROUP inbox workspace GEO-01 table/detail. Field type controls match BIC native validity; no new form builder workspace.

### G. End-to-end workflow

Build form → configure native fields → Behaviour → After submit → immediate confirmed service settings → preview layout with script/delivery limitations → actual published submission → inbox record. Readable detail opens independently of whether marking read succeeds. Configure in Inspector → exact form → edit server setting → Back to inbox. Spam/Archive actions get confirmed receipts; proposed Spam/Archived views offer Unspam/Unarchive. Export CSV is explicitly site-wide under the current request. Delete submission confirms permanent removal/no Undo; cancellation leaves it intact, failure retains the row.

### H. Controls and validation

FORM-01 in [control-and-package-contracts.md](control-and-package-contracts.md) is normative for Then, Message≤500, Redirect to, Send to≤320 and Spam protection, linked-field validation, commit timing, permissions and failure draft recovery. Native form types/required/name/action/method follow BIC. Keep pagination and full detail display. Export scope label must match its site-wide request. Submission flags are service operations, not document Undo. Delete has explicit irreversible consequence. No fake Save settings footer for these immediate actions.

### I. States, permissions and recovery

No forms/no submissions/no filter matches/load failed separate. Delivery unconfigured/disabled/failing with next setup step. Invalid field names and required input visible; published success only after actual request receipt. Read/spam/archive failure retry; no Composer Undo for inbox updates.

### J. Cross-module dependencies

BIC form contracts, site integration/permissions, published endpoint, spam/rate/upload constraints, asset field handling.

### K. Preservation and compatibility

Keep native form tags, field types, After submit, submission inbox/detail/pagination, site-wide CSV export, permanent delete and real delivery path. Existing editing/navigation retains form IDs. Duplicate/import allocates new structural IDs and remaps references; preserve semantically valid field names, but require explicit new FormBlock/delivery setup without cloning submissions, recipients or secrets.

### L. Acceptance cases — NOT RUN in the application

T-IAF13-1: native fields and server FormBlock stay separate through save/history. -2: configure-in-Inspector exact form and inbox return. -3: readable detail despite denied mark-read; endpoint/UI policy distinct. -4: linked redirect and ADMIN recipient validation. -5: site-wide CSV scope and permanent delete cancel/failure. -6: Unspam/Unarchive recovery. -7: copy/import gets new form ID. Plus T-FORM01.

### M. Verification and assumptions

Actual published submission/security/delivery provider behavior not exercised; retained source contracts require integration acceptance.

## IAF-14 — Site settings, localization and workspace doors

### A. Purpose, users and supported tasks

Administrators configure site behavior; editors access permitted operational screens. Users know which change requires publishing and which acts immediately.

### B. Existing controls and evidence

S: screen role/save/scope matrices exist; staged footer and immediate operations; workspace external doors. P: locked topbar placement and consistent guarded return.

Source anchors: `src/editor/sidebar/tabs/settings/SettingsTab.tsx`, `src/editor/sidebar/tabs/settings/constants.ts`, `src/editor/sidebar/tabs/settings/screens/LocalizationScreen.tsx`, `src/editor/sidebar/tabs/settings/screens/HeadersScreen.tsx`, `src/editor/sidebar/tabs/settings/screens/WorkspaceDoorScreen.tsx`.

### C. Problem and consequence

Generic Settings/Save labels can blend document, live operations and workspace administration; role unknown must not act as grant.

### D. Ownership and editing scope

Site settings owns site configuration; resource Brand and page SEO remain independent. ADMIN general/languages/SEO/domains/access/custom code/headers; EDITOR redirects/analytics/forms; OWNER danger. Server effective permissions authoritative; workspace admin actions follow own end points.

### E. Information architecture and layout

Topbar gear+Site settings → local group nav: Site(General, Languages, Brand door); Search&sharing(SEO); Publishing(Domains, Redirects, Access); Visitors(Analytics, Form submissions); Advanced(Custom code, Security headers); Danger zone; Organization workspace(Members, Billing, Integrations&web hooks doors). Header exact screen/scope; footer only staged screens.

### F. Panel/workspace decision and dimensions

REGROUP/KEEP workspace; GEO-01 nav 240/content preferred 960 with form max 720; two-column fields stack when<640. Immediate operations have inline pending/receipt. No hidden top dropdown-only entry andno Settings rail duplication.

### G. End-to-end workflow

Open exact screen → resolve access → edit → Save settings(footer writer awaited) → Saved for next publish or live operation receipt → return. Section navigation guards draft; Save and leave awaitsack; failed save/discard stays. Workspace door opens named dashboard new tab, keeping Editor context; nofake Editor Billing form.

### H. Controls and validation

Preserve all values/validators and unknown legacy options. General name/author/favicon/touch icon/site URLs lug; SEO defaults/OG/canonical/indexing/robots; Access password set/change/remove separate and plan bound; Languages default locale footer, locale stable add/remove immediate (25 existing locale ID s, RTL actual codes, no automatic translation promise). Redirect source/destination/type rules and CSV/suggestions preserved. Analytics enable+provider ID s and connection/test statuses distinct. Custom head/body/CSS staged; headers CSP/frame/referrer/HSTS/permissions preserve custom max age seconds and known options. Danger actions per actual endpoint confirmation. See SET-01 in [control-and-package-contracts.md](control-and-package-contracts.md) for write scopes.

### I. States, permissions and recovery

Checking access/could not verify/restricted/available; unsaved/saving/saved/failed/conflict; plan restriction distinct role. Immediate DNS pending/failed not Saved settings. Discard only unapplied fields; cannot revert live operation. Focus first invalid field, long code editor own label keyboard escape; no infinite focus capture.

### J. Cross-module dependencies

IAF-13 forms/16 publish; pagevs SEO inheritance; provider API; Role Service; workspace routes. Header/custom code effects require output validation, not UI alone.

### K. Preservation and compatibility

Keep all screen controls, role/save models, workspace doors and legacy values. Primary relocation no schema change. Canonical writer conflicts need engineering resolution; no implicit migration from page/site values.

### L. Acceptance cases — NOT RUN in the application

T-IAF14-1: each screen role/save/scope SET-01 matrix. -2: failed save/discard does not navigate. -3: page SEO does not overwrite global default. -4: locales add/default save distinct. -5: DNS live/publish setting state. -6: unknown role blocks destructive execution. -7: workspace door returns unchanged.

### M. Verification and assumptions

Provider DNS/password/header enforcement/billing and authenticated permission paths not runtime verified; no legal/security certification.

## IAF-15 — Preview, share and export

### A. Purpose, users and supported tasks

Editors inspect authored output and export supported formats with clear limits; preview never implies saved or deployed.

### B. Existing controls and evidence

S: preview sandbox allow-same-origin without scripts; export HTML/ZIP/React available, Vue/Next stub. JSON type exists not this format picker. P: honest mode/fidelity labels.

Source anchors: `src/editor/shell/PreviewOverlay.tsx`, `src/editor/shell/PreviewShareModal.tsx`, `src/editor/export/ExportOptions.tsx`, `src/engine/export/ExportEngine.ts`, `src/engine/cms/CMSExportResolver.ts`.

### C. Problem and consequence

Script less preview cannot certify interactions/forms/provider behavior; template export syntax isnot fully hosted CMS.

### D. Ownership and editing scope

Preview/export consume captured document+declared resource revision; neither owns editing. Export options are job settings, not website content unless existing model persists it. Share endpoint/permission separate from publish.

### E. Information architecture and layout

Topbar Preview → full work area read-only preview with local width/device/close and limitations. Export under Site menu → dialog Format/Options/Code preview/Download. Share preview retains actual link/expiry/permissions only where provided. No extra primary rail.

### F. Panel/workspace decision and dimensions

KEEP preview work area/export bounded 720 dialog. Preview inherits chosen authored width; controls remain local; Close exact origin. Options scroll, sticky Export action; code view copy keyboard accessible.

### G. End-to-end workflow

Preflight draft owners → capture consistent configuration → render/export → ready or failed → download/share action → return. Failed preflight stays owner. Preview shows which draft and CMS record state included; uncommitted record excluded unless explicit draft preview. Export unsupported required feature explains affected output instead of false parity.

### H. Controls and validation

Format HTML/ZIP/React; Vue/Next disabled Soon, not working. CSS embedded/external/inline; minify/reset CSS/meta/viewport toggles preserve existing defaults. CMS None/Embed data/Template; template Handle bars/Liquid; mode None warns bindings unresolved. Export page title distinct page SEO unless actual writer. Download generated≠file saved. Preview does not run arbitrary scripts; retain security boundary rather than making interaction demo implicit scope.

### I. States, permissions and recovery

Preparing/ready/failed/blocked resource/expired share; offline or permission failure keeps original draft. No editing or Undo in preview; close valid returns. Missing media/data shows diagnostic rather than blank unexplained page.

### J. Cross-module dependencies

IAF-08/13/16, saved configuration, token/font closure, preview renderer/export resolver, output sanitization.

### K. Preservation and compatibility

Keep current formats/options/code preview/share and supported multiple pages; do not promote json/vue/next type presence to UI capability. No change to script policy without separate engineering/security decision.

### L. Acceptance cases — NOT RUN in the application

T-IAF15-1: preview explicit draft scope and exact return. -2: format options preserved. -3: CMS none/static/template fidelity labels. -4: preview script limits visible. -5: failed export does not claim download. -6: matching stored config across renderers.

### M. Verification and assumptions

Full published runtime behavior/share expiry/provider and React export compatibility not verified. Script less preview intentional boundary preserved.

## IAF-16 — Publish, release gates and Issues

### A. Purpose, users and supported tasks

Permitted editors release the intended saved snapshot to a named destination; administrators recover releases without accidentally restoring drafts.

### B. Existing controls and evidence

S: prepublish/review gates, destination connection, job history/rollback; R: demo Publish disabled while checking review settings, not eligible live publish.

Source anchors: `src/editor/sidebar/tabs/publish/PublishTab.tsx`, `src/editor/sidebar/tabs/publish/PrePublishChecks.tsx`, `src/editor/sidebar/tabs/publish/PublishConfirmFacts.tsx`, `src/editor/sidebar/tabs/publish/PublishGateBanner.tsx`, `../../server/trpc/routers/sites.ts`, `../../server/services/publish.service.ts`.

### C. Problem and consequence

Save, review approval, publish request and live provider deployment differ; network time out must not create false failure or duplicate job.

### D. Ownership and editing scope

Publish job/release server owned; document revision and approval snapshot captured. EDITOR normal publish plus gates; ADMIN rollback/unpublish/cancel/stale approval override. Issues owns diagnostics, not values; Fix goes to exact owner.

### E. Information architecture and layout

Topbar primary eligible action → Publish task any workspace; tabs Current/History as actual tasks. Preflight checks → Fix owner → Back; confirm destination, snapshot, review status, impact. Issues right task show severity, affected object and action. Bottom status may open task but adds no tools.

### F. Panel/workspace decision and dimensions

REGROUP 360 task host; Publish confirmation 720 bounded modal, build log within body. Long domains/messages wrap. No CMS workspace forced close just to inspect release.

### G. End-to-end workflow

Preflight drafts → save captured revision → checks → review eligibility → choose actual configured connection/destination → Confirm Publish → job ID → build/deploy → confirmed result. On ambiguous network failure query job before Retry. Fix link exact settings/page/element/resource with return. Publication done only provider/server confirmed; live but recording failed requires reconciliation state, not blind redeploy.

### H. Controls and validation

Publish button names destination and revision; no auto switch production target. Warnings may acknowledge only where existing policy allows; errors block. Cancel job ADMIN serverack; abandoning panel≠cancel. Rollback label Republish this release, creates new job from retained released pages, does not restore Editor. Unpublish names live consequence and confirmation. Issue Dismiss only if existing model allows; do not hide a blocking diagnostic for cosmetic cleanliness. Preserve Schedule publish and Cancel scheduled publish where currently available: EDITOR+, exact site, user-selected future date/time with visible timezone and resolved UTC instant. Service validation remains authoritative; schedule receipt is not a successful publish. Show the current scheduled time, cancel pending/confirmed, and recheck approval at execution. Merely closing the task does not cancel a schedule.

### I. States, permissions and recovery

Checking role/approval/connection, blocked/warning/ready/queued/building/deploying/succeeded/failed/unknown outcome/cancel pending distinct. No enabled action while eligibility unknown. Old release pruned unavailable separate permission denied. Back does not lose job.

### J. Cross-module dependencies

IAF-14 provider/settings,17 review,18 history,22 save/conflicts, server job idempotency; FI-05 authorization.

### K. Preservation and compatibility

Keep approval/stale override/connection requirements, build logs/history/rollback/unpublish and issue fix paths. No application publish performed. Saved version/CMS content/library master are different rollback domains.

### L. Acceptance cases — NOT RUN in the application

T-IAF16-1: unsaved drafts checked before capture. -2: stale approval rechecked server. -3: network time out reconcile job no duplicate. -4: provider live database record failure reported honestly. -5: rollback leaves draft unchanged. -6: Fix returns from exact owner. -7: Viewer restriction section-level.

### M. Verification and assumptions

No authenticated publish/review/provider job run. Existing functional risks remain engineering acceptance, not closed by wire frame.

## IAF-17 — Review rounds and comment threads

### A. Purpose, users and supported tasks

Review participants understand requested feedback/approval; editors locate feedback and return to its thread without losing reply drafts.

### B. Existing controls and evidence

S: review rounds/approved snapshots require EDITOR, client credentials ADMIN; site comments read/create can include VIEWER. Located/page-only/gone distinct.

Source anchors: `src/editor/sidebar/tabs/review/ReviewTab.tsx`, `src/editor/sidebar/tabs/review/locate.ts`, `src/editor/sidebar/tabs/review/ReattachModal.tsx`, `src/editor/sidebar/tabs/review/RoundHistoryModal.tsx`, `../../server/trpc/routers/reviews.ts`, `../../server/trpc/routers/comments.ts`.

### C. Problem and consequence

One generic review permission conflates comments, rounds, client credentials and approval; reply drafts absent from old guard.

### D. Ownership and editing scope

Review round/server approval separate from pin comment resource. Actual review procedure availability includes agency flag; creation/resolve/reattach/client link checked individually. Review approval not a saved-document flag.

### E. Information architecture and layout

Review task 360: roundheader/status/actions, thread list/detail, reply composer; Round history child. Locate target opens correct page/element with Back to thread. Restricted round section may coexist with permitted site comments.

### F. Panel/workspace decision and dimensions

KEEP/REGROUP task host GEO-01; long thread one body scroll and owned reply footer; client/send confirmation bounded 720; reattachment work area target mode with cancel.

### G. End-to-end workflow

Open review → resolve access/round → read/reply/send/approve as eligible → server receipt → status refresh. Locate → located/page-only/gone → explicit repair or back. Reply retained per thread+round through task replacement; changed round requires review draft before post. Send snapshot preflight and version named; later edits mark approval stale according existing policy.

### H. Controls and validation

Reply post names round/thread, trim/length use existing server validation; blank not post. Resolve/reattach EDITOR+, reply capability from comments rather than same gate as round read. Client link ADMIN; never expose credential in unauthorized state. Reattach select explicit new anchor and page, show before/after. Approve/revoke/send consequence and permission from actual endpoint, not global Edit role.

### I. States, permissions and recovery

No review/awaiting/changes requested/approved/stale/revoked; thread loading/empty/deleted anchor/denied/reply failed. Save failed retains input. Resolve button remains pending until acknowledgement. Exact locate clears stale invalid selection; does not choose unrelated element.

### J. Cross-module dependencies

IAF-19 pinned comments,16 publish gates,20 per action capabilities,22 revision/save.

### K. Preservation and compatibility

Keep round history, approved comparison, thread/reply/resolve/reattach and client review paths. No Viewer grant to review rounds just because comment create allowed. No extra Review workspace.

### L. Acceptance cases — NOT RUN in the application

T-IAF17-1: Viewer comments vs rounds distinction. -2: reply draft task round switch. -3: located/page-only/gone results. -4: permissions change before post. -5: approved snapshot stale after edit. -6: request failure does not claim sent.

### M. Verification and assumptions

Authenticated review/approval/client flow not runtime executed. Completion authority remains server, not prototype.

## IAF-18 — History, Compare, Time Travel and Activity

### A. Purpose, users and supported tasks

Users inspect changes, compare versions and deliberately recover the right data domain.

### B. Existing controls and evidence

S: session restore truncates redo; saved restore makes Before restoring version; Compare Host and Saves Compare View different capabilities; Activity links module-level.

Source anchors: `src/editor/sidebar/tabs/history/HistoryTab.tsx`, `src/editor/panels/VersionHistoryPanel.tsx`, `src/editor/panels/version-history/CompareView.tsx`, `src/editor/shell/CompareHost.tsx`, `src/editor/shell/TimeTravelHost.tsx`, `src/engine/VersionTimelineManager.ts`, `src/engine/HistoryManager.ts`, `src/editor/sidebar/tabs/activity/ActivityTab.tsx`.

### C. Problem and consequence

Viewing/rewinding/importing saved data/republishing are different; compare Current draft is captured not live; backend resources are not restored by document import.

### D. Ownership and editing scope

Session history local document; saved versions server/local mirror; published release jobs server. Compare view state only. Activity audit events server, not Undo. Saved reads Viewer allowed; published history/approved snapshots EDITOR; restore writes EDITOR; release ADMIN.

### E. Information architecture and layout

History task local Session/Saves/Published; section restrictions honest. Session → Time Travel; Saves inline Visual/Semantic/screenshot/change/AI-summary remains +Open comparison. Shared Compare working area A/B source(Current draft, Saved, Approved, Published where authorized); split/overlay/unified modes as compatible. Activity All/Edits/Comments/Publish filters task.

### F. Panel/workspace decision and dimensions

REGROUP History 360; KEEP dedicated Compare/Time Travel work area. GEO-01 unified A/Bbelow 1280; no Inspector writes in old snapshot. Inline Saves comparison preserved rather than replaced with rendered only. Local comparison controls/top source identity, body preview, footer return.

### G. End-to-end workflow

History → select version → inspect/compare → return to exact row/filter. Current draft capture labels revision/time and offers Refresh. Both Session restore and Saved restore first perform an explicit guarded transition to Editor, resolving the current workspace/task drafts; then recheck role, source and document revision. Session restore creates a safety checkpoint and warns that later session history/redo will be truncated. On session checkpoint failure offer Retry/Cancel; the existing Time Travel Restore anyway bypass is retained only for session restoration as a separately warned action with no guaranteed recovery. Saved-version restore must create the Before restoring safety version before importing: if that fails, Retry/Cancel only, no bypass. On success show persistent Undo restore, subject to current revision checks. Published rollback uses IAF-16 and leaves draft untouched. Activity events without stable target IDs say Open review/Open Session, not Locate exact event.

### H. Controls and validation

Compare selectors use actual source IDs, not display name; missing/pruned/denied/request failed distinct. AI-summary cooldown/status retained; no fabricated summary. Time Travel scrub transient read-only, exit restores mode; history mutation exits safely. Restore labels exact scope: pages/styles/bindings/project settings/metadata, excluding CMS records/media/independent masters. Undo restore validates revision; no overwrite newer remote edits. Time Travel No preview separates two cases: absent/unreconstructable snapshot disables Restore with a specific reason; a valid reconstructed snapshot whose visual rendering failed offers Retry preview and explicit Restore without preview only after the normal transition, safety-checkpoint and impact preflight. Do not equate render failure with missing history. Clear session history is separate from restore/delete saved versions: show stack scope and loss of local Undo/Redo, require explicit confirmation, preserve the document and server versions, then confirm only when the stack clears. It is unavailable in read-only or unresolved-conflict states.

### I. States, permissions and recovery

Empty/filtered/loading/version pruned/restricted/compare failed; checkpoint pending/queued/failed; restoring/conflicted/recovered. Selected saved version deleted retain explanation. Keyboard timeline controls step, arrows not scroll hijack; focus returns selected entry.

### J. Cross-module dependencies

IAF-22 recovery/conflicts; components/CMS external resources; authorization; renderer historical dependencies; AI-summary endpoint.

### K. Preservation and compatibility

Keep visual and semantic comparison/screenshots/AI-summary, source pair compare, session Time Travel, saved restore persistent Undo, published history and Activity filters. No assumption historical snapshot includes historical external dependencies.

### L. Acceptance cases — NOT RUN in the application

T-IAF18-1: compare closed returns CMS draft+selected history row. -2: Current draft refresh label. -3: session restore truncation warning+checkpoint. -4: saved restore does not roll CMS/media/master back. -5: pruned vs denied states. -6: Activity module-level link honest. -7: Viewer section restrictions.

### M. Verification and assumptions

Full restore fidelity, remote convergence and historical visual parity unverified; prototype cannot certify them.

## IAF-19 — Notifications, canvas comments and collaboration

### A. Purpose, users and supported tasks

Users follow relevant updates and coordinate without mistaking presence for saved or locked state.

### B. Existing controls and evidence

S: notifications personal/site-filtered; count failure can look zero; commented anchor uses active page at post; presence includes dev mocks, collab server flag+EDITOR.

Source anchors: `src/editor/shell/NotificationPanel.tsx`, `src/services/NotificationService.ts`, `src/editor/canvas/comments/CommentLayer.tsx`, `src/editor/collaboration/PresenceIndicators.tsx`, `src/editor/shell/hooks/useOtherTabNotice.ts`, `../../server/services/collab.service.ts`.

### C. Problem and consequence

Opening notification and mark read are not one atomic operation. Retained comment draft can be mis attributed after page switch. Mock presence is not collaboration proof.

### D. Ownership and editing scope

Notification user owned; event target module owned. Pin comment server resource bound page ID+anchor. Presence/transport separate from permission, save and locks; other-tab notice same-site browser coordination only.

### E. Information architecture and layout

Topbar bell/compact overflow → Notifications with scope This site/All personal; full inbox entry preserved. Activity different destination. Canvas comment mode with pins/thread local popover; Review thread links reuse identity. Presence cluster connection details, not another primary workspace.

### F. Panel/workspace decision and dimensions

KEEP/REGROUP bounded 360 notification popover(max viewport−24),360 task when expanded; short height body scroll. Comment editor anchored with viewport clamp; mode explicit and Escape/Cancel. Passive presence cannot steal focus.

### G. End-to-end workflow

Notification → resolve target → guard navigation → open → separate mark-read acknowledgement/retry. Cancel navigation retains origin. No action URL means informational, not deleted. Pin create capture page+anchor → draft → Post same captured target or reselect → ack. Role/anchor changes block stale commit. Reconnect/resync shows the actual pending state.

### H. Controls and validation

Mark read/all read requires server acknowledgement and names the actual scope; failed counts Status unavailable, not 0. Comment pin location page/element/coordinates stored from the captured target; site comment create Viewer allowed if site access, resolve/reattach EDITOR. Header/shortcut use identical resolved flag, unknown not enabled. Participant names real transport only; demo users labelled demo. Connection Retry not Save.

### I. States, permissions and recovery

None/no results/load failed/unread update failed; target deleted/forbidden/temporary unavailable; comment draft cancelled/failed; connected/reconnecting/offline/resync/permission revoked. Offline pending operations follow actual queue, not implied delivery. Focus return to notification/thread.

### J. Cross-module dependencies

IAF-17 review,18Activity,20 flags/ACL,22 conflict/recovery; additive exact event target payload if desired later.

### K. Preservation and compatibility

Keep all personal notifications, site filter, read/unread and actual Activity links; retain comment reanchor/resolved status; presence/transport/other-tab warning separate. Do not replace complete inbox with site Activity.

### L. Acceptance cases — NOT RUN in the application

T-IAF19-1: notification cancel navigation does not lose origin. -2: read update failure truthful. -3: pin page turn cannot retarget draft. -4: unknown flag shortcut/header parity. -5: presence≠save/lock. -6: revoked collab access stops writes.

### M. Verification and assumptions

No live multi-user session, notifications service or remote conflict tested. Transport features remain flagged, not enabled for audit.

## IAF-20 — Roles, flags, read-only modes and capability resolution

### A. Purpose, users and supported tasks

All users see relevant permitted actions and actionable restriction reasons; authorization stays enforced at data boundary.

### B. Existing controls and evidence

S: VIEWER0, EDITOR/DESIGNER1, ADMIN2, OWNER3; active assignment/effective role overrides; unknown role possible; frontend Viewer tabs broader than some endpoint access.

Source anchors: `src/services/RoleService.ts`, `src/editor/rail/tabsConfig.ts`, `../../server/trpc/guards.ts`, `../../server/services/permission.service.ts`, `../../server/trpc/routers/sites.ts`, `../../server/trpc/routers/reviews.ts`, `../../server/trpc/routers/comments.ts`.

### C. Problem and consequence

Visible entry does not prove all child permissions; role unknown/feature unknown/read-only/plan restriction require different actions.

### D. Ownership and editing scope

Effective capability combines workspace membership, site assignment/override, resource ACL, action endpoint, server/environment/site flag, plan, current view mode and migration state. Keep owner separate from resource ownership.

### E. Information architecture and layout

Share one resolved capability result across rail/topbar/command/context/shortcut/deep link. Accessible container stays with section-level Restricted; inaccessible resources redacted. Disabled action with reason when useful; feature off follows actual policy, no false missing module claim.

### F. Panel/workspace decision and dimensions

KEEP screens; REDESIGN shared capability feedback. Inline Checking access/Retry/Restricted block, not modal for each denial. No extra Settings permission editor added.

### G. End-to-end workflow

Enter → resolve → available/restricted/unknown → act → server recheck → receipt. On revocation retain recoverable draft, stop mutations and route to nearest permitted parent. Retry resolves fresh permission; never rewrites user role. Viewer read-only and Owner chosen read-only are distinct.

### H. Controls and validation

ACC-01 in [control-and-package-contracts.md](control-and-package-contracts.md) is normative per action. Unknown checking/could not verify cannot enable destructive execution; service adjudication required. Feature-off states cannot be overridden by the frontend. Brand migration hold shows actual reason. Request access only when real route exists; otherwise explain contact owner without fake button.

### I. States, permissions and recovery

Loading/error/restricted/available; role lost mid operation; expired review credentials; plan exhausted; feature off; migration read-only; resource gone. Server 403 retains draft and refreshes role cache;401 reauth without discard.

### J. Cross-module dependencies

All modules; server policy/transport/commands; FI-05. No blanket frontend role boolean substitutes for ACL.

### K. Preservation and compatibility

Preserve existing permissions and read-only inspection. No Viewer grant to Publish history/Review just because container listed. Any tightening of existing rights must be an explicit security correction with compatibility review, not navigation accident.

### L. Acceptance cases — NOT RUN in the application

T-IAF20-1: matrix via UI/shortcut/deep link and direct endpoint. -2: unknown role/flag no implicit grant. -3: owner read-onlyvs Viewer. -4: revocation draft recovery. -5: restricted source component not exposed by destination membership. -6: client review token not leaked.

### M. Verification and assumptions

This is source-informed access design, not complete authorization audit; all server route combinations require actual tests.

## IAF-21 — Help, keyboard guidance and onboarding

### A. Purpose, users and supported tasks

Users learn permitted tasks and revisit guidance without treating personal learning progress as site launch readiness.

### B. Existing controls and evidence

S: seven steps, user-level server progress, browser cache global; replay local reset later union; preview intent not confirmed outcome.

Source anchors: `src/shared/constants/onboardingSteps.ts`, `src/editor/onboarding/OnboardingMount.tsx`, `src/editor/onboarding/useOnboardingOrchestrator.ts`, `src/editor/onboarding/AchievementPrompt.tsx`, `../../server/services/onboarding.service.ts`.

### C. Problem and consequence

Global browser cache can attribute another account completion; unavailable tasks distort progress; achievement focus can override active work.

### D. Ownership and editing scope

User learning progress(server per user), account-scoped cache; anonymous demo progress remains separate. Site capability determines eligible actions, not progress ownership. This is not per-site checklist; persistent step IDs unchanged.

### E. Information architecture and layout

Help bottom rail → Keyboard shortcuts /Getting started. Checklist seven steps preserved: Set brand, Add page, Add block, Connect client, Send review, Preview, Publish. CTA opens actual permitted owner and return; headings Getting started (amended 2026-10-17, SC-11 — was "Learn Buildrick/Getting started"); progress completed eligible/eligible.

### F. Panel/workspace decision and dimensions

KEEP help dialog bounded 720 and existing checklist; REGROUP overlay priority: safety conflict/permission interrupt > explicit confirmation > Compare/help > passive onboarding. One foreground focus owner; queue achievement, no auto focus steal.

### G. End-to-end workflow

Open Help → choose guidance → CTA → actual confirmed outcome → record user progress → return. Unavailable task explains why and excluded from eligible denominator, not marked complete. Replay guidance without clearing server history. Dismiss only defers guidance. Failed progress mirror pending retry.

### H. Controls and validation

> **Amended 2026-10-17 by Panel 16 §4.3:** a user-started page-template apply also completes `insert-section` (template **load** at bootstrap still does not); all step IDs unchanged; checklist name "Getting started".

Proposed Add block completion rule: a successful, user-initiated registered block insertion through Add → Blocks or its drag/keyboard equivalent completes insert-section. Generate a block also qualifies only after its supported block insertion commits. Primitive Elements insertion, template load, project load/bootstrap, duplicate, paste and history restore do not qualify. Preserve the existing step ID and prior server-confirmed completion. Preview completes only after it actually opens; Publish after a confirmed successful job; Connect client after a confirmed invitation. Namespace local cache by account; never assign legacy anonymous/shared-browser completion to a new account. Merge server-known user progress. Keyboard legend reflects actual platform/context bindings; text inputs suppress global letter shortcuts.

### I. States, permissions and recovery

New/partial/complete eligible/restricted/pending mirror/offline; zero compatible actions explains access with no 0/0 celebration. Help return restores focus. Passive achievement cancelled/queued behind modal; no page write/Undo.

### J. Cross-module dependencies

IAF-04/05/10/15–17,20; confirmed outcome events, account identity and server progress.

### K. Preservation and compatibility

> **Amended 2026-10-17 by Panel 18 §9:** the Keyboard legend card (`KeyboardLegend.tsx`, board 4418:126882) is **removed** as a separate surface. Its rows move, corrected to SC-12 and the user's platform, into the Keyboard shortcuts sheet's BASICS group; rail Help opens the Help popover (Keyboard shortcuts · Getting started). Help dialog, replay, dismiss, achievement and the seven step IDs are unchanged.

Keep seven ID s, help/legend/replay/dismiss/achievement. Fix cache account scope rather than invent per-site progress migration. New guidance copy cannot promise all blocks use live tokens unless verified.

### L. Acceptance cases — NOT RUN in the application

T-IAF21-1: account switch does not inherit local completion. -2: Viewer eligible progress honest. -3: failed preview not complete. -4: replay shows history retained. -5: achievement behind conflict modal. -6: CTA s respect draft guards.

### M. Verification and assumptions

Onboarding events/remote progress and assistive technology not runtime validated; personal learning metrics are hypotheses.

## IAF-22 — Saving, offline state, conflicts and recovery

### A. Purpose, users and supported tasks

Editors know what is safely stored and recover without overwriting newer work or unrelated resources.

### B. Existing controls and evidence

S: local recovery banner Keep changes dismisses only; conflict Reload latest/Save backup/Overwrite, Brand format conflict blocks Overwrite; document import scope bounded. Existing FI-04 collaboration recovery risk.

Source anchors: `src/editor/shell/RecoveryBanner.tsx`, `src/editor/shell/modals/ConflictModal.tsx`, `src/engine/Composer.ts`, `src/engine/VersionTimelineManager.ts`, `src/editor/shell/shellDirtyRegistry.ts`.

### C. Problem and consequence

Queued/local/synchronized/published are different; save completion cannot claim edits made after captured revision. Closing conflict is not resolution.

### D. Ownership and editing scope

Document revision owned Composer+site persistence; CMS/asset/component/site-setting writes separate. Draft registry tracks applied/unapplied/job state. Save receipt must name captured revision/hash and server revision.

### E. Information architecture and layout

Bottom status only: Unsaved /Saving revision… /Saved at… /Offline—local changes /Conflict /Save failed. Click opens status details with owners/jobs/retry. Recovery notice own actions; conflict foreground modal; saved history recovery IAF-18.

### F. Panel/workspace decision and dimensions

REGROUP status+recovery; bounded 720 conflict form grow with diff; no extra always-on panel. Notification alone insufficient for blocking conflict; stable banner/status entry remains.

### G. End-to-end workflow

Edit → local applied → queue captured revision → serverack → mark that revision only. Newer edits remain pending. Offline queue as actually supported, otherwise explicit local only. Recovery offer preview/backup → Keep changes(local dismiss)or Reload latest guard → reconcile. Conflict Reload latest/Save backup/Overwrite as eligible; Overwrite CAS recheck and impact, not blanket remote-reset. Closing dialog keeps conflict status. Backup failure must not discard local recovery or trigger reload. Separate Download backup from an explicit Continue to reload: successful generation/download initiation is labelled “Download started”, not proof that a file was retained. On serialization/download-initiation failure retain conflict, local recovery and draft; offer Retry/Cancel. Reload requires deliberate confirmation and current-revision checks. This corrects the source-only risk in ConflictModal and AquibraStudio, whose current finally path can reload after backup failure.

### H. Controls and validation

Save/retry idempotent per captured operation; no formatting-time out Saved guess. Discard draft not Undo already applied shared operations. Backup download/generated receipt distinct server sync. Overwrite unavailable Brand format conflict. Restore check current revision and dependencies; after new work offer new copy/merge/review only if implemented, otherwise Save backup+Reload rather than fake automatic merge.

### I. States, permissions and recovery

Loading/local dirty/saving/confirmed/failed/offline/queued/conflicted/recovered/permission lost; partial multi owner receipt shows which saved. UI status live announcement polite except blocking error; focus retained on retry.

### J. Cross-module dependencies

Every writer, collaboration CAS, history checkpoints, provider jobs; FI-03/04 and IA-X integrity risks.

### K. Preservation and compatibility

Keep autosave/manual save/local recovery/backup/conflict actions and bounded history. No assumption document Undo reverses server CMS/media/master operations. Authoritative value not duplicated in shell state.

### L. Acceptance cases — NOT RUN in the application

T-IAF22-1: edit during save leaves new revision dirty. -2: queued≠server Saved. -3: conflict close unresolved. -4: Brand format Overwrite blocked. -5: restore after remote edit no false Undo. -6: multi owner partial save Retry only unfinished. -7: Keep changes≠synchronized.

### M. Verification and assumptions

No remote conflict/offline convergence or full save-path runtime verification. These are engineering blockers separate from written IA closure.

## IAF-23 — Preserved engine capabilities, advanced controls and deliberate deferrals

### A. Purpose, users and supported tasks

Existing projects retain advanced data and supported behavior while unsupported authoring is honestly labelled and sequenced.

### B. Existing controls and evidence

Inventory M 06/M 09 includes engine-only/stub/removed/branch-only reports. Their original status is not new proof; specific source paths linked through intake and other IAF records.

Source anchors: `src/engine/Composer.ts`, `src/engine/data/DataManager.ts`, `src/shared/types/components.ts`, `src/editor/export/ExportOptions.tsx`, `src/editor/inspector/config/sectionOrder.ts`.

### C. Problem and consequence

A cleaner IA could silently drop advanced native/commerce/animation/integration data or promote engine types to shipped UI.

### D. Ownership and editing scope

Existing canonical owners unchanged: element interaction/animation in Inspector Behaviour/Effects; component variants IAF-11; commerce catalog/provider external owner; integrations workspace/site configuration. Saved unknown inert metadata preserved, unsafe executable payload never promoted.

### E. Information architecture and layout

No new Commerce/Animation/Integrations rail. Existing compatible blocks/routes remain; unavailable authoring named read-only/Not available in this version with actual alternative only if verified. Issues links unresolved configuration to owner. Runtime/output unsupported markers visible where consequential.

### F. Panel/workspace decision and dimensions

KEEP supported controls, DEFER unsupported new authoring; no automatic timeline workspace. Dedicated timeline justified only when new multi track authoring is actually scoped; existing animation controls retain closed Inspector home.

### G. End-to-end workflow

Load legacy project → preserve payload → identify known supported/unsupported condition → show editable compatible fields+stored unresolved values → repair through real owner or leave untouched → save without loss. Unknown feature package blocks affected root per PKG-01, not flattening. Branch-only fix must be verified against current revision before called fixed.

### H. Controls and validation

Interaction contracts retain trigger, target, action, timing/scope, preview/reset/deleted target/conflicting style authority per FD-INS/BIC. Unknown operator/type preserve and diagnose. Commerce import requires destination catalog mapping. Stub Vue/Next not selectable as working. Variant selection retained; new authoring deferred until stable identity+revision roundtrip. Session Sources durability deferred until new store contract.

### I. States, permissions and recovery

Unsupported/gated/removed historical/engine-only/unknown all separate from Missing. Existing valid data read-only accessible where permitted. No false empty on parser failure; backup before conversion. Mutations must not drop unrecognized inert fields.

### J. Cross-module dependencies

All intake rows; existing Inspector 69/120 contracts; serializer/output; package compatibility; server integration gates.

### K. Preservation and compatibility

Every row has explicit disposition. Defer means defer unsupported UI revival/addition, not delete current data/capability. Restore only when a verified existing useful route is broken; source-only reported bugs remain verification tasks. ID s/schema unchanged except explicit versioned proposals.

### L. Acceptance cases — NOT RUN in the application

T-IAF23-1: legacy advanced values roundtrip. -2: flagged engine feature does not become fake working UI. -3: unsupported package graph blocks before mutation. -4: every 1238 intake row maps contract/disposition. -5: duplicate reports not counted new features. -6: each defer has dependency trigger.

### M. Verification and assumptions

Long-tail engine paths not exhaustively rerun. Provider-specific commerce checkout/integration timeline authoring outside existing validated scope; clearly deferred rather than presented complete.

