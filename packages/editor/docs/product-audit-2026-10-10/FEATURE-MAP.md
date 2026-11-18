# Existing feature ownership and disposition

Coverage key: **R** = local runtime evidence in the earlier audit; **S** = source inspected for the named contract; **I** = inventoried entry point, deeper functionality still unverified. R does not mean every state in that row passed. Recommendations are target organization, not claims of completed migration.

| Existing feature | User task / relevance | Recommended home and behavior | Coverage / source |
|---|---|---|---|
| Add elements, blocks, sections | Build page structure; core | Left insertion drawer. Search and categories; insert relative to selection with visible placement feedback | S: `sidebar/TabRouter.tsx`, `tabs/build` |
| Templates | Start a page or replace a section; valuable | Expanded/full workspace for browsing; direct starter opens the chosen template. Explicit insert/replace scope and one completion outcome | R UX-03/04; S `FullPageRouter.tsx` |
| Layers | Understand hierarchy; core | Left resizable tree, meaningful names, selected path, lock/visibility, drag feedback. Keep canvas visible | R UX-08; S router; I deeper drag states |
| Pages/folders | Manage site navigation and page identity | Left tree; page settings drill-in. Site settings remain separate. Page creation returns to new page | R template creation; I `tabs/pages` full folder flows |
| Components | Reuse and safely update instances | Add > Components for insertion; library detail for management. Master editing has explicit scope and return-to-instance | S `ComponentsTab.tsx`; I propagation |
| Element selection | Identify edit target | Canvas plus persistent inspector title/path; multiselection distinct from single selection. No overlapping instructional chrome | R UX-07; S action context |
| Clipboard / duplicate / delete | Frequent local edits | Top-level context actions, shared commands. Clear multi-selection target; root and lock rules | S `menus/actions/editActions.ts`, `shared/elementActions.ts` |
| Group / wrap / unwrap | Restructure document | Context Structure group, eligibility based on parent and element capabilities; transactional undo | S `standaloneActions.ts`, `ElementManager.ts`; mutation edge cases unverified |
| Arrange | Change sibling order | Context Arrange; distinguish DOM order from visual stacking. Disable boundaries with reason | S `layoutActions.ts`, default commands |
| Typography | Style readable content | Inspector: family, weight, size, line height, alignment first; advanced typography collapsed | R UX-05/09/10/25; S section order |
| Layout / size / spacing | Responsive composition | Inspector ordered by layout model. Show relevant flex/grid/position controls and effective values | S section registry/capabilities; I all layout modes |
| Fill / border / shadows / effects | Visual style | Inspector sections; common fields first, advanced effects secondary | S section order; I individual controls |
| Classes / attributes / custom CSS | Advanced implementation | Advanced inspector disclosure; retain capability, avoid displacing basic tasks | S behavior registry |
| Breakpoints / overrides | Responsive editing; core | Persistent canvas device/width control and explicit property inheritance/reset | R UX-06/09/14; S export path |
| Interactions / animation | Add behavior | Context door opens relevant inspector section; advanced timeline/large editor only when complexity requires | S element actions, behavior registry; runtime preview gap |
| Links / navigation | Connect pages and destinations | Relevant inspector fields; page selector for internal links, no CMS/settings noise | S capabilities, PreviewOverlay link handling |
| Forms / form fields | Collect visitor input | Element inspector for authoring; submissions destination for operational data, linked from form | S section registry/settings nav; I submission backend |
| Sliders / media / embeds | Rich page content | Type-specific inspector, honest preview support; keep general design controls consistent | S capabilities; I interactive runtime |
| CMS binding | Connect selected element to data | Context shortcut + Content inspector. Show collection, field, sample record, unbind and open-record return path | S shared action/capabilities; I all binding types |
| CMS collections/records | Manage structured content | Broad workspace with collection nav, Records/Fields, record sheet. Useful central empty state | R UX-15/16/17; S `CmsWorkspace.tsx` |
| CMS fields/import/dynamic pages | Define schema and publishing | Collection-scoped tabs/actions; dynamic pages explicitly optional; import validates before committing | S workspace entry points; I import/reference/error matrix |
| Assets quick picker | Choose/replace current asset | Compact contextual picker with apply/cancel; preserve caller and selected asset | S TabRouter/pick-mode entry points |
| Asset library / versions / editing | Manage site media | Expand to workspace for search, folders, metadata, versions and bulk operations. Return chosen asset to caller | R UX-20; S FullPageRouter; I version replacement backend |
| Brand / design tokens | Maintain reusable visual language | Full workspace for authoring + small inspector token pickers. Semantic names, usage, scope and preview | R UX-18/19; S Brand host |
| AI assistance | Accelerate bounded edit tasks | Selection-aware right panel; disclose target and proposed changes, apply/undo. Site-wide generation a separate explicit task | R failure/recovery; S element action; success unverified |
| Preview | Validate current page across devices | Full canvas workspace retaining chosen page/device, resize controls, truthful runtime capabilities | R UX-09/11/13; S `PreviewOverlay.tsx`, `renderPreviewHtml` |
| Export | Deliver deployable output | Site menu / publish-related action, progress and failure recovery; parity with preview/publish | S preview versus publish export entry points; I formats |
| Publish / domains | Ship site reliably | Compact status/checklist panel; domains in site settings; logs or comparison may expand | S `usePublishJob.ts`, settings nav; I authenticated jobs |
| Review / comments | Gather feedback | Right-column task mode with canvas anchors, compare expansion when required | S router/role gates; I delivery and reviewer role sessions |
| Session undo / saved history / rollback | Recover work | Session undo stays immediate; History explains saved versions versus published deployments. Compare uses broad workspace | R Undo/Redo; S routers/publish-job adoption; I restore |
| Activity / notifications | Understand events | Right activity feed with contextual deep links; notification popover for recent events | S TabRouter and history deep-link routing |
| Site settings | Administer current site | Full workspace grouped by site, search/sharing, publishing, visitors, advanced, danger zone | R UX-21/22/24; S `settings/constants.ts` |
| SEO / localization / analytics / redirects | Site operation | Keep under site settings; page-level overrides link to page settings. Label save/apply/publish semantics | S settings nav; I production output and plans |
| Members / billing / integrations | Manage account/workspace | Explicit dashboard destination with workspace name and return path; never imply these are element properties | S settings workspace doors; authenticated dashboard unverified |
| Saving / conflicts / recovery | Protect work; essential | Persistent accurate save state, explicit unresolved conflict, preserve local draft, retry without duplicate writes | S `BuildrikSyncProvider.ts`; I remote round trips |
| Multiplayer | Concurrent editing | Preserve existing production gate until engine/server convergence and permissions are verified | S `engine/AGENTS.md` restriction; no production readiness claim |
| Command palette / help / onboarding | Discover and learn | Contextual commands, searchable with recent/relevant grouping; one onboarding task at a time | R UX-02/04/13/23 |

All source paths above are relative to `src/editor` unless qualified `engine`, `services`, or `shared`. The coverage intentionally separates routed/inventoried features from exercised workflows. A directory or test file's existence is not proof of production behavior.
