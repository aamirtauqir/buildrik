# Phase 5 dedicated workspace screen specification

10 October 2026. Design proposal for the separate TO-BE page `8312:2`. This document specifies twelve delivered native screens; it does not change the application, approve implementation, or assert that proposed recovery behavior already works. Gate 4 closure is recorded in [the completion report](PHASE-4-COMPLETION-REPORT.md). The [IA proposal](INFORMATION-ARCHITECTURE-AUDIT.md), [workspace source state reference](AS-IS-WORKSPACE-STATE-SPEC.md), and [capability boundaries](PHASE5-CAPABILITY-BOUNDARIES.md) govern these screens.

## Design choice

Use dedicated, contextual workspaces with a shared 56px header and a 240–256px destination navigation column. A stable Back to canvas control names the return target when launched from an element/property. Wide tables, galleries and settings forms use the main area. Selected details use a task-specific column; confirmation and recovery dialogs remain inside the active workspace.

A universal drawer for every task would compress CMS records and asset metadata unnecessarily. An independent application shell for every destination would obscure site and return context. The selected approach shares navigation/control foundations while preserving each domain's existing owner, save model and useful advanced capability. Components remain under Add with one management destination; they do not move into Brand or Media.

Desktop composition is 1440×900 with white/cool-gray chrome, canonical Flowbite blue #1A56DB, Inter 12/13px controls and restrained 16/20px section hierarchy. These are editor chrome foundations, not site Brand tokens. The native screens reuse the shared root kit and its button component masters. Delivery IDs, screenshots and structural checks are recorded in [the workspace design review](PHASE5-WORKSPACE-DESIGN-REVIEW.md).

## Twelve screen contents

| Design ID | Screen and visible state | Primary content/actions | Finding trace |
|---|---|---|---|
| TB-W01 | CMS / Articles records | Collections navigation; Records, Fields, Dynamic pages, Settings tabs; searchable record table; Draft/Published record status; Add record and Import. Selected record opens its editor. A persistent return strip names Home / Heading / Content when entered through a binding. | UX-15/16/17, IA-06/07/10 |
| TB-W02 | CMS / Record conflict and return | Record editor with Title, Slug and read-only Draft status while the conflict is unresolved; retained local value beside changed server value; explicit “This record changed elsewhere”; Use server version and Keep my changes; Save record owns the record and is disabled until the conflict is resolved. Back to bound element passes through dirty guard. | IA-07/13; W-C07/08/12 source contracts |
| TB-W03 | Media / Library and chosen image | One Search all media field; Recent/In use/Unused/folders; clear Grid/List toggle; genuine content thumbnails; selected detail showing dimensions, type, usage, alt text, tags and versions. Return target and Use image appear only in property-pick mode. Manage mode uses Insert to canvas. | UX-20, IA-06/07 |
| TB-W04 | Media / Metadata save failed | Same library context, selected item and draft alt text retained; error beside the metadata section: “These details were not saved to the library.” Retry save and Discard edits; last server value remains distinguishable. No green Saved toast. | WS-01, IA-13 |
| TB-W05 | Media / Upload incomplete | Upload queue with separate File transfer and Add to library status. Example: file transferred; library registration failed. “1 file needs attention”; Retry adding to library and Close remain distinguishable; local availability is not cloud durability. | RT-01, WS-01, IA-13 |
| TB-W06 | Brand / Palette and selected token | Useful palette first; token name/value and bound usage where known; Light/Dark scope; live site preview; selected Page background token; Change and View bindings. Detail explicitly identifies global token versus local field binding. | UX-18/19, IA-10 |
| TB-W07 | Brand / Type and spacing foundations | Fonts & type styles with family/role/size/weight; spacing values and preset menu in an adjacent section; token rows and a token usage caveat; the companion palette screen carries the contextual preview. Show applied changes through document autosave, not a fabricated final workspace Save. Additional token kinds remain a named Advanced tokens door. | UX-18/19; F-024/078 |
| TB-W08 | Site Settings / SEO draft | Grouped settings navigation, site scope, Admin write role, page-level override hint; title/description/social fields, search preview; Unsaved changes footer with Discard and Save. Validation appears after interaction/submission, not on untouched fields. | UX-21, IA-13 |
| TB-W09 | Site Settings / Unsaved exit guard | SEO draft retained behind a modal; “Save SEO changes before leaving?”; Keep editing receives initial focus; Discard changes and Save and continue have explicit consequences. Save failure keeps the dialog/draft and offers retry. | UX-22, IA-07 |
| TB-W10 | Site Settings / Analytics evidence | GA measurement ID field and separate Buildrick event status; neutral “Buildrick events received” evidence card, “Google Analytics delivery not verified here”; footer save model and next-publish scope. Workspace Members/Billing/Integrations remain clearly labeled dashboard doors. | WS-04/05, IA-13 |
| TB-W11 | Templates / Selected starter preview | Gallery/category navigation; selected named template and responsive visual preview; label Own colours and typography or Site token placeholders according to template; Create page primary, Replace current page secondary; explicit page name and return context. | UX-03/04/08, IA-06/07 |
| TB-W12 | Templates / Replacement backup failed | Current page identity and selected template remain visible behind recovery modal; “Your page has not been replaced”; Try backup again primary, Keep current page secondary, Replace without backup separated as a deliberate risk choice. No success claim until actual apply completes. | UX-03/04; W-T05/06/07 source contracts |

Names and values are clearly labeled prototype examples in frame notes. A simulated error is a design state, not newly observed runtime evidence. Source-only contract IDs above link back to the AS-IS workspace spec; finding IDs retain their actual confidence.

## Transition and persistence contracts

### CMS

Collections load independently from the document. Loading, no collections, no records, no schema, filtered no matches, and failed read are distinct states. Records table row activation opens the record; Add record creates an unsaved draft, not a published page. Schema edits retain type/key/required/validation and used-field guards. Fields and Dynamic pages are direct tabs; dynamic setup names URL pattern, template page, title/description patterns and whether pages will be generated. Pages remains the owner of the template page. CSV/JSON import keeps mapping/validation/result semantics; Sheets/Airtable remain unavailable with a reason.

Save record has server-confirmed, local-only, refused, gone and conflict outcomes. A conflict never silently overwrites server data. Keep my changes expresses an intentional retry under the existing service contract; it is not a guarantee that authorization or revision checks will pass. Published is record status; site deployment is separate. Document Undo applies to binding edits, not record/schema persistence.

Return records site/page/element/field/breakpoint and the originating Inspector section. When a target is gone, return to the page with “The original element is no longer available”; do not select a different element silently. A dirty record invokes its own leave guard before destination change.

### Media

Choose, insert and manage are distinct intents on one library owner. Choice restores the exact target property; management preserves selection/filter/search/scroll. Upload progress separates bytes transferred from server asset registration. Metadata save owns its own status and retry; shell document Saved is not evidence of library durability. Retry UI for WS-01/RT-01 is a proposed contract dependent on reliable result propagation and reconciliation, not an invented implementation fix.

Local-only messaging must state only verified persistence. A thumbnail is not proof of a recoverable binary, durable queue or saved document reference. Pending failed work should not promise survival across reload unless the service verifies it. Close/leave warns when work may be lost; it does not falsely claim that closing cancels an already completed upload.

Asset detail retains image crop/adjust/resize/optimise, versions, usage, rename/move/tags/alt, delete grace and font management doors. Restore and delete use domain confirmations; they are not ordinary document Undo. Empty library differs from failed/partial remote search. AI alt generation is a provider action with pending/error/disabled states, not a decorative button.

### Brand

Color/token Apply changes the document and uses ordinary autosave; there is no final Brand Save. Color picker Cancel discards only that picker draft. Site token edits state global scope; one field's override/binding is local. Usage is labeled as known bindings and may be incomplete. No universal count or “all elements will update” promise.

Typography, spacing, presets and extra token kinds preserve their existing IDs and services. Preset Apply is an immediate token mutation and has a clear scope confirmation where needed. Restore points are separate from ordinary Undo. Starter/import/export and existing classes/component styles remain reachable, with disabled reasons for unsupported AI generation. Provider extraction is not simulated as successful.

### Settings

Navigation retains General, Languages, Brand door, SEO, Domains, Redirects, Access, Analytics, Form submissions, Custom code, Security headers and Danger zone. A compact grouped nav uses progressive disclosure/search rather than deleting advanced destinations. Scope and minimum write role stay visible where relevant.

Footer saves apply to General/SEO/Analytics/Custom code/Headers/Access and default language. Domains, redirects, form actions and lifecycle actions retain their immediate object contracts and relevant permission checks. Locale table actions differ from default-language draft save; only default-locale publishing is supported. Members, Billing and Integrations open dashboard destinations, with “Workspace · all sites” context; editor forms do not duplicate credential management.

Analytics evidence is precise: Buildrick events cannot certify a GA ID. A loading/error check must not render as verified. A proposed credential surface uses redacted status/replace controls; WS-05 remains a backend security dependency and is not closed by drawing masked input.

Dirty navigation resolves Keep editing / Discard / Save and continue. Pending Save disables duplicate submit; failure preserves entered values and context. Escape closes the innermost dialog only. Screen footer respects the active pane's save model and is absent for doors or read-only panes.

### Templates

Entry carries new-page name, selected starter and create/replace mode. Preview uses the correct starter, shows style provenance, and retains a Back to templates path. Create page and Replace page never share an ambiguous Apply button. Replacement names the target and defaults backup on. Backup failure stops ordinary replacement; Replace without backup is explicit and deliberately separated.

The checkpoint is a History version, not a backup page. Import progress offers cancellation only before the current source can safely stop. Failure after import starts must not guarantee a complete rollback. Preview is visual/content-only under current sandbox constraints; controls do not promise scripts/forms/widgets execute.

## Common keyboard, layout and accessibility behavior

Active workspace owns focus; covered canvas chrome is inert. Initial focus enters its heading/search or the specific requested field; exit returns to the invoking control when still available. Escape closes the innermost menu/dialog, then respects the workspace dirty guard. Tab order follows header, nav, main content, detail, footer. Menus use arrow navigation, Enter/Space activation and Escape return. Status/error feedback is announced without moving focus; invalid fields have associated text and are not color-only.

Main content scrolls independently from header and save footer. Long tables use a stable heading and visible horizontal-scroll affordance when columns cannot fit. Detail columns have a documented minimum width; at constrained widths they become a drill-in detail surface with Back to list. A workspace does not squeeze three columns below readable widths. Root's formal panel/breakpoint contract governs thresholds and transitions, including 1024×768 and 200% zoom; phone authoring is not silently promised.

Every visible interactive control will receive either a prototype destination/state action or an explicit simulation limitation in the Phase 6 action ledger. Complex editing, upload transport, provider calls, revision conflict resolution, template import and secure credential storage remain documented contracts when they cannot be accurately simulated in Figma. The Phase 5 screens are design readiness artifacts, not an implementation plan.

