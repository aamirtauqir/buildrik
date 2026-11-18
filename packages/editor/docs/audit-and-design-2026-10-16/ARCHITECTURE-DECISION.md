> **SUPERSEDED (2026-10-17).** This 2026-10-16 proposal (top workspace switcher, Inspector 336, "CMS → Element conditions") is replaced by PRODUCT-DESIGN-BRIEF BD-01/BD-03/BD-20, INS-D07 (Inspector 300) and the panel specs in `panels/`. Kept as history only — do not design or build from it.

# Editor structure — alternatives and workflow decision

2026-10-16 · FIGMA DESIGN ONLY · C3 navigation and ownership proposal.

The earlier Heading regrouping and grayscale replicas did not establish a new product architecture. They are reference studies, not an accepted redesign. This decision starts from tasks and current capability owners. No application, saved-site or original-Figma edits are included.

## Evidence and actual problem

Baseline main19f964d5e7efda2c276a4c185782bb963da605ec. REPORT.md retains the full inventory and runtime limitations. Source reviews covered the registered Inspector, reusable objects/data and delivery/settings families; the review was read-only.

1. `inspector/config/sectionOrder.ts`: Style currently contains type content and visual properties; Behaviour contains form fields, CMS binding, links, visibility, interactions, classes and attributes. A user must know the implementation grouping to find semantic content. This is an organization problem, not a missing-feature problem.
2. `rail/tabsConfig.ts`: the primary rail combines Add/Layers/Pages with Assets/CMS/Brand; those destinations have different scopes and surface sizes. Components and Templates have real indirect doors that must survive any navigation redesign.
3. `ContextRow.tsx`: Desktop is implicit, pseudo state is explicit, and non-Desktop gets a chip. Breakpoint selection lives under canvas View. Editing scope can be separated from the control the user is changing.
4. Source owner boundaries differ: document fields use Composer; form after-submit uses server settings; asset revisions do not equal element assignment; CMS records are not canvas Undo; Brand ordinary edits apply immediately. A visually uniform Save button would misrepresent these owners.
5. Runtime canvas/Layers selection parity was observed for the same heading. Other successful static screenshots are not evidence of successful save/Undo or service operations.

No claims about user frequency, measured time savings or user-test preference are made. The expected clarity improvements below are design hypotheses.

## Task map before layout

| Task | Current path / owner | Proposed ownership invariant | Return / recovery |
|---|---|---|---|
| Create a page and place content | Pages → New; Add → catalog; Composer page/element graph | Page graph and current-page tree in one Structure surface; Add remains insertion, not resource management | Cancel keeps page; insert retains parent/index validation, transaction and IDs |
| Edit a selected object | Canvas/Layers → Style/Behaviour/Effects; registry-dependent controls | Object content, visual style, behaviour and effects have explicit homes; type eligibility remains unchanged | Same stable ID from all entries; rename, selection and inline-edit semantics retained |
| Edit responsive styles | View → Breakpoint; Inspector State and override dots | Show active authored breakpoint beside style controls; changing browser window does not change it | Preserve1024/768 thresholds; Custom width240–2560 selects existing layer; selection change resets pseudo to Base |
| Use reusable content | Add → Saved → detail; instance → master detail | Definition versus instance is explicit; keep Update from selection, not an invented direct-master editor | Back to source instance; update recovery gaps remain visible |
| Apply or manage media | Target field → picker; Assets → library | Picker assigns to one property; library manages asset metadata/bytes/revisions | Cancel returns to exact property; Save version stays distinct from Apply to usages |
| Edit structured content | CMS collection → Records/Fields/Dynamic pages | Collection workspace owns schema/records; Inspector owns eligible binding | Return retains collection+record+source element; dirty guards and outbox states remain owner-specific |
| Edit tokens and shared style resources | Brand → existing sections | Shared definitions remain in Brand; local assignments remain in Inspector | Preserve immediate ordinary edits, operation-specific preview/apply, keys and aliases |
| Prepare and deliver | Preview; Issues; Review; Publish | Layout preview, review snapshot and deployed release remain distinct | Return to original editor context; pending jobs use existing IDs; no fictional live/Undo success |
| Recover or export | History/Activity; conflict/recovery; Export | Session/Saves/Published stay distinct; backup/export is not publication | Preserve exact existing recovery choices and known failure dependencies |
| Configure the site | Site Settings → eleven screens and workspace doors | Settings remain site-owned; team/billing/integrations stay workspace-owned | Draft footer only where supported; immediate actions are not cancelled by unrelated form Cancel |

## Three genuinely different structures

All drawings use the same1440×900 host to make spatial costs comparable. Pixel budgets are proposed gross areas, not measured usable document dimensions. Wireframes show representative controls; the mapping below specifies the full retained inventory.

### A — Persistent structure and object editor (recommended for further design)

- Move site-wide Editor/CMS/Brand/Assets/Settings navigation into a labelled top workspace switcher. Project menu retains less-frequent site/account doors; History/Review/Preview/Publish stay explicit.
- Replace mutually exclusive Pages/Layers navigation with one256px Structure panel: page chooser and page actions at its top, current page tree beneath. The full page list opens from the chooser; do not put the entire site tree above the current element tree.
- Add is an insertion surface opened from a persistent button. It temporarily occupies the Structure panel with Back to structure; it retains all catalog groups, HTML/AI entries, saved-component management and the template door.
-336px selected-object Inspector with **Content / Style / Behaviour / Effects**. Content is a regrouping of existing semantic controls, not a new property system. Layout-type controls remain Style; content-type controls move to Content. Existing Effects stay directly discoverable.
- Style and Effects show active breakpoint and pseudo scope. Content shows all-breakpoint semantics only for fields that actually have that scope; server-owned form settings are separately labelled.
- Top88px leaves812px height;256+336 leaves848px gross center width. At1280, center688px. Under1120, Structure becomes an explicitly opened overlay; Inspector remains available. No breakpoint changes from this host fallback.

Trade-off: broad navigation migration and a new Content tab require explicit old→new mapping. Frequent semantic-content/typography alternation adds a tab switch; an existing Edit text on canvas shortcut/action stays available beside object identity to reduce that cost. This is a candidate, not user-tested preference.

### B — One task at a time

- Structure / Content / Appearance / Behaviour modes occupy a task bar. A single360px left work area changes with the task; the canvas receives1080px gross width at1440.
- Global site workspaces remain in Project navigation. Current selection persists across task modes; Appearance includes existing Style and Effects sections.
- Structure and properties cannot be seen together by default. Moving through nested elements while adjusting styles repeatedly switches task mode.

Trade-off: widest canvas without overlapping controls, but navigation state now depends on task mode. Reject as the default because the existing select→style→select workflow depends on concurrent structure and property access. Keep only as an exploratory alternative, not a new mode to ship automatically.

### C — Horizontal property workbench

-240px Structure panel and1200px-wide canvas above a full-width280px bottom property area. Content/Style/Behaviour/Effects remain within the workbench; properties can occupy several columns.
- At900px host height,88px top chrome and280px dock leave532px for canvas. At600px, only232px remains before canvas-specific gutters.

Trade-off: efficient horizontal property scanning and room for complex values, but poor vertical canvas space on short screens. Reject as the default. Do not create a second editor implementation or change stored property semantics merely to support this exploration.

## A: exhaustive destination mapping at section/module level

| Existing owner / capability | Proposed canonical destination | Preservation boundary |
|---|---|---|
| Pages, folders, bulk operations, page settings | Structure → page chooser/list → page row/menu; settings opens named page sheet | All menus, draft/Done, SEO/Social/Advanced and source page return remain |
| Layers selection/search/reorder/rename/lock/hide/move | Structure → current-page tree and row menu | Stable IDs, hierarchy, multi-select, keyboard/context actions retained |
| Add Elements/Blocks/Built-ins/Saved/Favourites/Recent | Add → temporary Structure replacement with Back | Current catalog and eligibility; no invented inline Templates catalog |
| Components and Templates | Add → Saved → Manage; page creation/template door | Existing definition/detail/update-from-selection and preview/create/replace flows |
| `component` section | Persistent selected-object instance summary → component detail; current variant/reset/detach controls | No new variant-authoring or direct-master-edit feature |
| `type` section | Content for semantics/media/content fields; Style for layout type bodies | Split by value owner, not file. Every registered body stays eligible under current rules |
| layout/typography/size/spacing/fill/border/text-inside | Style, in a meaningful section order | All units/advanced/custom/token values and conditional children survive |
| form-fields/slides/collection/cms-binding | Content | Current six field-list types versus fourteen direct-input types remain distinct; retain exact list/binding controls |
| link/form-settings/slider-settings/interactions | Behaviour | Preserve different document/server write boundaries and existing animation preset UI |
| visibility | Style → responsive visibility | Desktop/Tablet/Mobile semantics; no metadata changes from browser resizing |
| css-classes/attributes | Content → Advanced attributes | Class-name assignment only; no fabricated global CSS-rule editor |
| opacity/shadow/filters/transform-motion/effects-advanced | Effects | All current effect properties and raw CSS retained; CSS animation remains with Interactions in Behaviour |
| Assets, fonts, icons, revisions | Assets workspace; target-specific picker from Inspector | Asset metadata versus usage alt preserved; versions versus usage commits separate |
| CMS records/fields/import/dynamic pages | CMS workspace | Existing record/schema/routing owner and validation; no absent list sort/filter authoring |
| Sources/variables/conditions | CMS → Data | JSON sources; variables definitions; conditions remain element-owned bindings |
| Brand every existing page/advanced token kind | Brand workspace | Immediate ordinary edits; operation-scoped preview/apply; Component styles still opens Add Blocks |
| History/Review/Publish/Issues/contextual AI/Activity | Named right workflow surface with Back to object editor | Preserve selection and actual eligibility; expanded details only when task needs them |
| Preview and share | Preview overlay; existing link dialog; management door to dashboard | No password/expiry/revoke controls invented inside editor share modal |
| Site settings/export/recovery/workspace doors | Settings workspace; Project menu/contextual recovery | Eleven site screens; owner-specific Save; all original workspace doors |
| Product/commerce/collaboration partial capabilities | Existing registries and existing supported doors | Do not promote partial implementation into a new commerce or multiplayer product |

This matrix is complete at inspected section/module level, not a control-by-control visual acceptance pass for every module. Full control/state details remain in the source inventories and per-module design stages. No hidden section may be replaced with a summary in implementation.

## Tested-by-walkthrough scenarios (design reasoning, not runtime pass)

1. Page chooser → Home → heading in tree → Content H3/text → Style font size → same selected ID. A keeps tree visible; B changes task mode; C keeps both but reduces page height.
2. Image Source → media picker → cancel/apply → exact source field. Asset management opens separately; no tile click in manager assigns a value.
3. Bound text → Open record → CMS record → return to originating element. Preserve actual dirty guard and outbox status, not a universal Save promise.
4. Mobile + Hover → property reset. Reset removes that override; never claim it necessarily becomes Desktop, because Tablet cascade may remain. Bulk conflict safety is an engineering dependency.
5. Review Locate → matching page/element → edit → Back to review thread. Missing element stays detached until explicit reattach.

## Verification and exclusions

The decision compares existing tasks, geometry and ownership. It does not prove improved usability. Required next checks: fully draw A insertion, Content and Style states; page chooser; site-workspace return;1280×720 and short-height; long-value/locked/mixed/error states; then module-by-module preservation review. No final detailed visual system is approved here.

Verified Webflow comparison is limited: its Navigator documentation describes selecting an element and moving to Style, Element settings or Interactions; its Add documentation describes insertion into the Navigator. This supports evaluating structure+selection+property continuity, not copying its implementation or class engine. Sources: [Navigator](https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator), [Add panel](https://help.webflow.com/hc/en-us/articles/33961270096659-The-Add-panel). Buildrick retains its own existing class, breakpoint and save contracts.

## Delivered Figma architecture checkpoint

[Architecture alternatives page](https://www.figma.com/design/6yvgev9dRXrSLPluWkjDoz?node-id=28-1520).

| Frame | Node | Scope |
|---|---|---|
| A1 | 28:1521 | Persistent structure + Style |
| B | 28:1674 | Task-mode alternative |
| C | 28:1804 | Bottom-workbench alternative |
| A2 | 28:1954 | Content owner |
| A3 | 28:2062 | Add and explicit return |
| A4 | 28:2220 | Site data workspace and editor return |

Six native static frames created. All six screenshots inspected at1440×900; no major overlap or unreadable labels observed at that size. Corrected duplicated task navigation in B, restored Templates and Favourites/Recent doors in A3, and removed an implementation annotation from A4. Captures: evidence/architecture-0.png through architecture-5.png. Creation ledger: evidence/architecture-creation.json.

This is a spatial/ownership comparison, not approval of detailed controls. C deliberately uses schematic property summaries; those are not dropdown specifications. A3 catalog contents are schematic, with conditional Favourites/Recent only when available. A4 illustrates Sources, not a complete record-edit/return flow. None of the six frames has prototype reactions. No interaction, save, undo, cross-module return or responsive acceptance test has passed from these static frames.

Previous pages03/04 are retained and labelled NOT ACCEPTED. Historical test results on those studies do not approve this architecture. Remaining required work includes page chooser and insertion targeting, selected-object context/eligibility, all detailed module controls, responsive geometry, recovery/permissions/errors, and comparative feature-by-feature QA.

## Independent architecture gate

Reviewer: audit_spec_review. Verdict: A may advance as a static architecture candidate; detailed preservation/interaction acceptance remains pending.

Corrections: removed the Layout row from A1/A3/B Heading property panels because Heading has layout:false; canonical CSS-animation home is Behaviour → Interactions, including ElementAnimationRow. C remains a schematic comparison, not a Heading control contract.

Required conditions contract: CMS → Element conditions displays the source page, element name and stable ID. It edits that element's existing binding, never a global reusable condition. With no selected element, show a Select element action and disable condition editing. If selection changes outside the workspace, retain the displayed target until explicit switch; show the new selection as an available target. If target was deleted, disable writes and offer return/select another element. Back restores the originating page/selection where it still exists. These states are proposed and not yet drawn or runtime-verified.
