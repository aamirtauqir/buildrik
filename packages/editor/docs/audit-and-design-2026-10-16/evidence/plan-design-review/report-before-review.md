# Buildrick: product audit and editing design specification

Date: 2026-10-16. Mode: **AUDIT_AND_DESIGN**. Primary user: **designer / freelancer**, confirmed by the owner. Baseline commit: `19f964d5e7efda2c276a4c185782bb963da605ec`, branch `main`.

This document is a proposed design and frontend handoff, not an implementation claim. Application code and deployment are outside this task. No Figma document, image, API, prior Figma audit, or design board was used as a reference. Historical comments in the source are not treated as design authority. Findings below come from current source, local application observations, selected existing tests, and explicitly identified official Webflow documentation.

## 1. Actual repository and runtime baseline

The repository is a pnpm workspace. The dashboard is Next.js App Router; the editor package is React chrome around a headless Composer engine. The real editor mounts inside `/edit/[siteId]` through `packages/dashboard/components/editor-route/EditorClient.tsx`. The standalone Vite demo is not a substitute for real saved-site behavior. The server has tRPC routers, domain services, Prisma/PostgreSQL, and separate CMS, component, media, publishing, review, and version services.

At audit start neither expected application port, 3000 nor 5050, was listening. PostgreSQL was listening on 5432. The dashboard was started on 3000 using its existing script; no installation, database migration, seed reset, or deployment was performed. An existing local QA browser session was reused. The accessible workspace is QA Workspace, with an existing two-page site, `s0-qa site` (`cmv8uviql000bucorbmjjol97`). The initial Sites list labelled it Draft; later detail/editor reads showed Publishing/Published with a simulated `.invalid` URL. The fixture was not isolated from other sessions, and the cause of that change was not established. Runtime observations of empty lists describe this fixture, not the absence of an implemented feature. A separate audit browser was used after the default browser daemon was busy. An initial Getting started navigation timed out during local development; a later capture loaded its 3/5-complete checklist. The timeout alone does not establish a production performance defect.

Existing uncommitted work was present before the task, including root CLAUDE.md and several reports/evidence folders. See [baseline status](evidence/baseline-git-status.txt). This audit's documents live only in this directory. Browser navigation changes UI/session preferences; no intentional saved document/content mutation, invite, review delivery, purchase, publication, or deletion was executed.

### Startup and checks discovered from the project

| Purpose | Existing instruction | Audit treatment |
|---|---|---|
| Real app | From `packages/dashboard`: `pnpm dev` (equivalent script invoked with `npm run dev -- --port 3000`) | Started; runtime baseline |
| Standalone demo | `pnpm --filter @buildrik/editor dev`, port 5050 | Not accepted as saved-site evidence |
| Clean checkout | Node 22+, pnpm 10+, Postgres 16; `pnpm install`, Prisma generate/migrate/seed | Documented only; do not rerun over saved work |
| Local authentication | Dashboard Playwright setup mints a magic link | Existing session reused instead; setup also changes onboarding/agency preconditions |
| Unit tests | Root `pnpm test`; editor `npm test` | Eight relevant existing test files run, 64 test cases passed |
| Related source checks | Root `pnpm test:related <files>` | Discovered, not run |
| DB tests | `pnpm test:db` | Not run; setup truncates test tables |
| Editor parity | `pnpm --filter @buildrik/editor test:parity`, local Chromium on 5051 | Not run; not evidence for this design |
| Dashboard browser tests | `PW_FORCE_LOCAL=1` with dashboard Playwright | Read-only screen audit used; full suite would mutate fixtures |
| Type / design gates | `node packages/editor/scripts/check-tsc-baseline.mjs`, `verify:ds` | Discovered, not run; no application change to validate |

Sources: repository `README.md:26–96`, root and package `package.json`, editor `vite.config.ts`, both Playwright configs, editor `vitest.config.ts`. Root and dashboard packages share a package name, so filtering dashboard startup can start the wrong root app. Dashboard Playwright can select BrowserStack when credentials are present; local verification must explicitly force local. The editor parity config deliberately rejects remote credentials unless explicitly allowed.

### Evidence vocabulary

- **R — runtime observed:** an actual local screen, navigation, or state was inspected. This does not imply its mutation, persistence, permissions, or every error branch was tested.
- **S — source inspected:** current executable source establishes the capability/path or defect. Comments alone do not establish correctness.
- **T — existing test passed:** the listed assertions passed in this audit, with their mocks and scope; this is not a full end-to-end result.
- **D — design-ready proposal:** specified below for implementation; not shipped, not user-approved as a final UI, and not runtime verified.
- **U — unavailable/unreviewed:** explicitly outside obtained runtime coverage. Never convert U into “works.”

The evidence directory contains route text, accessibility snapshots and selected screenshots. `file-inventory.txt` records 3,277 discovered files across source/demo/dashboard/server/shared; that number is an inventory count, not a claim that every file was read. `control-inventory.json` records declarations from 333 screen/component files; extraction is a discovery aid, not a substitute for the human analysis below. The final route ledger identifies all 102 Next page routes: 42 have screen or redirect evidence, and 60 remain runtime-unreviewed. A [capture manifest](evidence/manifest.json) records file hashes and evidence caveats.

## 2. Discovered module inventory and canonical ownership

Paths in this table are relative to `packages/editor`, except `dashboard/`, `server/`, and `shared/`, which mean the sibling dashboard package, repository server, and shared package. “Owner” is a product/data responsibility, not an invented team assignment.

| ID | Module and implemented screens | Current source anchors | Canonical owner / proposed surface |
|---|---|---|---|
| M01 | Authentication, signup, password/magic link, OAuth, verification, 2FA, invites, access/session errors | `dashboard/app/auth/**`, auth components, `server/services/auth.service.ts` | Account/session; dedicated auth pages |
| M02 | Onboarding: workspace, path, blank, template selection/preview, AI basics/goal/brand/generating/preview, ready | `dashboard/app/onboarding/**`, wizard context | Site creation; resumable wizard |
| M03 | Home, Getting started, workspace switch, search, notifications, activity | `dashboard/components/dashboard/shell/nav.ts`, dashboard routes | Workspace overview; keep dashboard |
| M04 | Sites: grid/list, filters, folders, selection, archive, recently deleted, new site | `dashboard/app/dashboard/projects`, site components | Workspace site library; keep list/grid |
| M05 | Site overview, settings summaries, domains, SEO, redirects, access, analytics, feedback | `dashboard/app/dashboard/sites/[id]/**`, site-detail components | Site context; summaries link to actual edit owner |
| M06 | Profile, account/login, security, workspace/branding, team, notifications | `dashboard/components/settings/**`, team components | Personal account versus workspace; retain separate scope |
| M07 | Billing/plans, usage, AI credits, API tokens, integrations/webhooks, transfer/delete | billing/settings components, respective routers/services | Workspace administration; dedicated settings |
| M08 | Agency clients/detail, review queue, handover, shared library/theme, partner gate | `dashboard/app/dashboard/agency/**` | Workspace agency layer; keep feature gate |
| M09 | Marketplace, templates/detail, Learn, Resources, Help/articles/tickets | dashboard ecosystem routes | Discovery/support; separate from active editing |
| M10 | Editor shell, site/page identity, save, commands, help, panels, notifications | `src/editor/shell/**`, `rail/tabsConfig.ts` | Editor navigation/session; coherent return context |
| M11 | Canvas selection, inline text, multi-select, menus, drag/drop, resize, guides, rulers, grid, X-ray | `src/editor/canvas/**`, engine canvas/selection/commands | Document editing; keep direct canvas tools |
| M12 | Add: elements, blocks, built-in components, saved components, recent/favourites, HTML paste, AI block | `sidebar/tabs/build/**`, `src/blocks/**` | Insert intent; searchable drawer |
| M13 | Layers tree/search, lock/hide, rename, reorder, multi-select, move to page | `panels/layers/**`, `sidebar/tabs/layers` | Current page structure; persistent navigator drawer |
| M14 | Pages, folders, page search/structure, bulk operations, new/duplicate/delete/home | `sidebar/tabs/pages/**` | Site page graph; Pages drawer |
| M15 | Page SEO, Social/Open Graph, Advanced visibility/index/follow/head code | `pages/page-settings/**` | Page metadata; contextual sheet |
| M16 | Templates gallery, filters, preview, new page, replace layout, saved templates | `sidebar/tabs/templates/**` | Template choice/application; dedicated workspace |
| M17 | Inspector style: type block, layout, typography, size, spacing, fill, border | `inspector/ProInspector.tsx`, `config/sectionOrder.ts`, registry | Selection style/content; right inspector |
| M18 | Responsive/state editing, inherited/override/mixed/locked fields, advanced CSS | `inspector/hooks`, `config/cssContext.ts`, `shared/constants/breakpoints.ts` | Explicit style scope; inspector context |
| M19 | Element settings: text/link/media/embed/widget/form types and attributes | `inspector/sections/typeBlock/bodies/**`, `elementCapabilities.ts` | Selected element; contextual controls, not global settings |
| M20 | Forms/field list/after-submit and submission inbox | `FormFieldsSection`, `FormAfterSubmitSection`, settings `FormsScreen` | Form structure on canvas; submissions in Site settings |
| M21 | Slider, accordion, countdown, progress, tabs/navbar/gallery and structural children | type-block bodies, Slides/Playback sections, block runtimes | Selected widget; preserve existing per-type limits |
| M22 | Interactions and animation; opacity/shadows/filters/transforms/transitions | inspector interactions/effects, `engine/interactions`, `animation` | Selection behavior and appearance; contextual inspector |
| M23 | Saved components: create/browse/detail/insert/rename/duplicate/update master/detach/delete/variants | `ComponentsTab`, `component-library/**`, `engine/components/**` | Component definition versus instance; scoped master workspace |
| M24 | Asset launcher/library: search, folders, upload/import/stock, detail, usage, replace, versions | `sidebar/tabs/media/**`, `media/LibraryManager` | Asset manager versus insertion picker; shared asset data |
| M25 | Image edits, icon picker, site fonts, image versions/download results | `editor/media/**`, `engine/media/**` | Asset revision or element assignment; distinct commits |
| M26 | Content: CMS collections, data sources, site variables, conditions | `sidebar/tabs/content/**`, `engine/data/**` | Structured data; keep separate from style tokens |
| M27 | CMS records, record sheet, fields/validation/options/reference/rich text, CSV/JSON import | `editor/cms/**`, `engine/cms/**`, `services/cmsSync.ts` | Collection schema and records; dedicated workspace |
| M28 | CMS field binding, collection lists, dynamic page/template/SEO setup | `CmsBindingSection`, `CollectionListSection`, `DynamicPagesPane` | Element binding versus collection routing; explicit cross-links |
| M29 | Brand colours/modes/fonts/styles/component styles/classes/presets/checks/starters/spacing/advanced tokens/import/export/restore | `design-system/ui/**`, token services | Site design system; dedicated workspace |
| M30 | Contextual AI, scope, models/quota, suggestions, planned changes, review/run/stop/undo | `sidebar/tabs/ai/**`, `services/ai`, server AI | Editing assistant; right panel with larger run detail when needed |
| M31 | Preview/page navigation/device frames, share-preview/password gate | `PreviewOverlay`, `PreviewShareModal`, dashboard share route | Safe preview and share-link access; distinct from deployment |
| M32 | Publish/checks/approval/confirm/progress/retry/unpublish/history | `sidebar/tabs/publish/**`, shell publish hooks, server publish | Release state; one publish flow |
| M33 | Review rounds/comments/pins/locate/reattach/resend/signoff | review tab, canvas comments, dashboard review token route | Review snapshot/round; preserve client context |
| M34 | History session/saves, version preview/restore, compare/time travel, activity | history tab, version panel, `CompareHost`, `TimeTravelHost` | Distinct session undo, saved snapshot, deployed release histories |
| M35 | Site settings: General, Languages, SEO, Domains, Redirects, Access, Analytics, Forms, Custom code, Headers, Danger, workspace doors | `sidebar/tabs/settings/**` | Canonical site settings workspace; individual contracts below |
| M36 | Save failure, offline recovery, conflict, access loss, migrations, export/import | save hooks, recovery/migration/storage, `ExportModal` | Document durability and portable output |
| M37 | Viewer/roles/locks, keyboard/focus/Escape, error boundaries, loading/empty states, responsive chrome | `useEditorRole`, `chrome-ui`, `shellDirtyRegistry`, shared utils | Cross-cutting interaction contract |
| M38 | Product collection/ecommerce blocks, Stripe export, collaboration/presence | `editor/ecommerce`, `engine/cms/ProductCollectionService`, `engine/export/StripeInjector`, `engine/collaboration` | Preserve partial capabilities; do not claim full commerce or production multiplayer |

## 3. Office-hours framing and decision

**Problem:** a designer should be able to identify an object, know the scope of the next edit, perform it, check its effect, and return without losing context or work. “Like Webflow” is a workflow-quality goal, not evidence that Buildrick needs Webflow's full feature set or exact panel arrangement.

**Premises tested against the implementation:** (1) much of the necessary capability exists already; (2) ownership and state communication deserve changes before decoration; (3) page, component, collection, asset, token, and workspace are different edit scopes; (4) a clean screenshot cannot prove durability; (5) usage/conversion claims remain unknown because no user study or analytics was provided.

| Approach | Effort / risk | Reuse / benefits | Cost |
|---|---|---|---|
| A. Repair existing surfaces | M / low-medium | Fix misleading labels, broken suggestions, preservation defects, dirty guards and return paths using existing components | Some deep tasks remain cramped; master editing still relies on canvas promotion |
| B. Scope-led evolution, recommended | L / medium | Keep engine/data contracts; consolidate navigation/return context; regroup inspector controls; expand only proven complex tasks into dedicated workspaces | Needs explicit state migration, component propagation design and regression matrix |
| C. Replace the editor with a Webflow-style architecture | XL / high | Could unify class-first editing from scratch | Risks existing inline styles, bindings, IDs and user work; unsupported feature expansion; rejected |

This report specifies **B**, with A's essential corrections first. That is a recommendation for review, not permission to implement. No true visual class-authoring engine, external data connectors, ecommerce order admin, branching, simultaneous multi-breakpoint canvas, or production multiplayer is included merely because Webflow has such features.

### Verified benchmark, limited to relevant tasks

These are official documentation comparisons retrieved during this audit, not measurements from a Webflow account. Any timing, exact current spacing, role-specific entitlement, or undocumented Webflow behavior is **unverified**.

| Ref | Verified task evidence | Applicable Buildrick decision |
|---|---|---|
| W1 | [Navigator](https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator): selecting hierarchy items connects to style, settings and interactions | Layers and canvas must select the same object and expose the same actions |
| W2 | [Style panel](https://help.webflow.com/hc/en-us/articles/33961362040723-Style-panel-overview): selector/style controls and inheritance sources are exposed | Show actual element/state/breakpoint/token scope; do not pretend class names change write targets |
| W3 | [Breakpoints](https://help.webflow.com/hc/en-us/articles/33961300305811-Breakpoints-overview): styles respond to breakpoint cascade, structural edits apply across breakpoints | Explain style overrides versus structural/global edits; preserve Buildrick's own thresholds |
| W4 | [Variables](https://help.webflow.com/hc/en-us/articles/33961268146323-Variables): reusable variables can be edited and used from style controls, updating linked elements | Brand owns definitions, Inspector owns binding; show impact before global updates |
| W5 | [Intro / component canvas](https://help.webflow.com/hc/en-us/articles/33961260162323-Intro-to-Webflow), [component variants](https://help.webflow.com/hc/en-us/articles/51307110086547-Component-variants): main-component context and variants have a focused editing context | Separate master edits from instance overrides; extend existing manager, not import Webflow data semantics |
| W6 | [Manage CMS Collections](https://help.webflow.com/hc/en-us/articles/33961244391059-Manage-CMS-Collections), [Collection pages](https://help.webflow.com/hc/en-us/articles/33961277976467-Structure-and-style-Collection-pages): schema/items/template are separate responsibilities | CMS workspace owns fields and records; canvas owns template layout; maintain return to bound element |
| W7 | [Publishing](https://help.webflow.com/hc/en-us/articles/33961351954579-How-do-I-publish-or-unpublish-a-Webflow-site): publishing is an explicit action with destinations/permissions | Distinguish saved, eligible for next publish, and actually live |
| W8 | [Backups](https://help.webflow.com/hc/en-us/articles/33961244069395-Save-and-restore-backups): preview a saved version before restoring; restoration has consequences | Separate session undo, project restore and release rollback; preserve a recoverable before-state |

## 4. Shared navigation, panel and control contracts (proposed)

Every module contract below inherits this section; exceptions are explicit. These are acceptance requirements, not a claim that the baseline already satisfies all of them.

### N1. Navigation and return context

All entry points (rail, keyboard, command search, inspector deep link, dashboard summary) resolve to one destination descriptor: site ID, workspace ID, surface, subview, object ID, source object, page ID, selection IDs, breakpoint/state, canvas scroll/zoom, and return focus target. Keep transient navigation separate from ProjectData. A module switch must not create document history. Persist only safe UI preferences; never restore a stale mutation, open confirmation, secret, or in-flight action from localStorage.

Opening a workspace suspends the source canvas context. Back returns to that context, including selection and scroll. If the source was deleted, select the surviving parent or page and explain why; never select an unrelated same-index node. If the site changed, discard the old return context. Browser Back follows actual route transitions; in-place drills have an explicit Back row. Do not require designers to know keyboard shortcuts to reach supported capabilities.

Escape closes only the innermost popup, then a drill/surface, then selection. Use existing `hasOpenEscapeSurface()` and `useColumnPanelEscape`; canvas-authored menus/dialog roles must not capture editor navigation. For in-app Back, Escape, rail, page and route changes, dirty guards use one pending destination, never a chain of independent confirms. Browser reload/tab close is separate: use a best-effort native beforeunload warning where supported and recovery already persisted during editing. Do not promise a custom three-action prompt, reliable async save during unload, or a warning on every mobile termination. Focus returns to the opener; if gone, the destination heading.

### P1. Surface sizing and ownership

| Surface | Specification at 1440×900 | Narrow-window behavior | Reason / keep versus change |
|---|---|---|---|
| Editor chrome | Existing 56px header and 60px rail; preserve tokens | At 1024–1279 use compact labels and one active side drawer; below 1024 expose canvas-first mode with explicitly opened sheets | Keep familiar structure; reserve room for the page |
| Add / Layers / Pages | Default 280px, adjustable 260–360px; independent vertical scroll | Overlay with clear close, never silently overlay focused canvas objects | Keep context beside canvas |
| Inspector | Default 320px, adjustable 300–400px; sticky identity/tabs/context; fields scroll | 320px sheet clamped to viewport minus 16px; opening closes conflicting transient drawer | Resize/regroup existing 300px surface; use measured layout, not a copied skin |
| Publish / Review / History / Activity / AI | Replace inspector; visible title + Back to Inspector; selection retained | Same sheet policy; long compare/run details get dedicated overlay | Keep one active right-column owner |
| Page settings | 480–560px sheet, sticky page identity + tabs + Save/Cancel | Full usable width under 720px | Metadata needs space without becoming a new product area |
| CMS | Collection navigation 240–280px; main content flexible; field inspector 300–360px only while selected | Table scroll belongs to table; record form becomes one column below 900px | Keep existing dedicated workspace; remove empty inspector-width filler where no detail exists |
| Brand / Assets / Templates / Site settings | Shared workspace frame, navigation 224–256px; content min 480px; optional 320px contextual preview/detail | Collapsible navigation below 1100px; details overlay; no fixed 360+420px table columns at narrow widths | Keep workspaces, unify frame/return and field sizing |
| Component master | Dedicated focus canvas, master name/instance count, existing Layers + Inspector; Update/Cancel footer | Same canvas-first policy | Extend master workflow because global structure edits need explicit scope |
| Dialogs | Compact decision 400–480px; editor task 640–800px; max `calc(100vw - 32px)` and `calc(100dvh - 32px)` | Inner body scroll; title/actions remain reachable | Dialog only for a bounded decision or edit |

Widths are D targets requiring future browser acceptance, not measured baseline values. Keep existing `chrome-ui` primitives, `--bk-*` chrome tokens and site token separation. This handoff does not require Figma; use existing tokens and, if necessary, a reviewed code-local token source change in a future implementation task rather than hand-editing generated files.

### C1. Exact common control behavior

| Control | Contract |
|---|---|
| Text/numeric property | Keep temporary input (`-`, `.`, empty) while typing. Enter/blur validates and commits a valid value; Escape restores pre-focus value. Invalid input shows adjacent text and does not mutate the document. Clear removes the current override, not an explicit zero. Preserve unit; choose only units valid for that property. Arrow steps 1, Shift+arrow 10 where numerical; clamp only when the control states a real bound. |
| Continuous sliders/drag | Preview continuously; begin one transaction at pointer-down/first key; commit once on end/blur; Escape cancels. No hundreds of undo entries. On selection/scope switch flush or cancel the pending transaction deliberately. |
| Select/toggle | Apply immediately within its declared save model, one reversible document transaction where applicable. Keyboard selection and visible focus work. A boolean with mixed values displays mixed until explicitly chosen. |
| Scope/reset | Context reads `This element / Tablet / Hover` (or actual target). Reset removes only the chosen scope value and reveals inheritance. Token reset and detach are different actions. Metadata/attributes show `All breakpoints` rather than inheriting an unrelated responsive selector. |
| Multi-select | Common compatible controls only; mixed display never writes a guessed default. Apply to stable selected IDs through `writableElements`; report skipped locked/incompatible targets. One transaction for a batch. |
| Search/filter | Search the visible domain; clear returns the previous list/selection; no results differs from empty library. Keyboard focus never jumps after asynchronous results. Stale responses cannot replace results for a newer query. |
| Destructive action | Name the affected object, count, dependencies, live/draft effect and recovery. Safe action initially focused. Request only necessary confirmation. Disable duplicate submission. If undo is supported, restore exact prior IDs/relationships; otherwise state the actual recovery path. |
| Permission/plan gate | Show reason and the permitted next action without losing typed work. Loading/unknown role is not an affirmative write grant. Server authorization stays authoritative. Preserve read-only inspection/export where already allowed. |

### S1. Required workflow states and durability

Every async surface distinguishes initial loading, loaded-empty, loaded-with-data, filtered-empty, validation error, submitting, server-confirmed success, offline/queued, recoverable failure, permission loss, stale/conflict, object deleted and feature unavailable. Show only applicable states but never collapse error into empty or local completion into server success. Keep submitted values after failure. Retry the same logical operation, not a duplicate create. After navigation, an old response cannot affect the new site/object.

Document edits use Composer transactions/history and the site's save pipeline. CMS rows use their existing local store, outbox, conflict and direct-save mechanisms. Asset uploads/revisions use media services and version recovery. Settings use explicit server Save or immediate object mutations according to screen; browser undo is not server rollback. Publish/review/invites/integrations are external operations, requiring their own status and recovery. See each module for the exact distinction.

**Save-and-continue decision table (D).** Confirmed server save proceeds. A CMS operation may also proceed after both its payload and durable outbox/recovery identity are successfully persisted locally; retain a site-wide “Saved on this device · waiting to sync” status, pending count and reopen/retry door after navigation. An in-memory pending request alone is not durable and cannot release the guard. Validation error, failed local persistence, unresolved conflict or permission refusal stays on the form with draft intact. Server-only settings/form/credential operations have no queued exception: proceed only after acknowledgement. **Discard** abandons only the current uncommitted input draft and resets to the resource owner's last accepted state, which may include an already durably queued edit. It does not delete outbox operations, undo confirmed server changes, revoke an invite or remove an uploaded asset. Cancelling a queued operation requires a separate explicit supported recovery action; do not imply one exists by labelling the draft button Discard.

### A0. Universal acceptance matrix

For each changed workflow, exercise mouse and keyboard, loaded and empty data, long/localized labels, read-only and allowed roles, error/retry, narrow and wide host widths, selection change during async work, site switch, and relevant offline/conflict recovery. Record assertions against actual IDs and persisted values, not screenshots alone. Compare serialized project before/after migration and reload; unsupported fields survive unchanged. These are future acceptance tests unless listed in the test evidence section.

## 5. Module specifications: workspace, entry and administration

The following contracts specify the desired behavior of retained and changed surfaces. A preservation requirement is not automatically a finding that the current behavior is broken. Issue IDs in section 10 identify actual findings and design hypotheses separately. Module source locations are in section 2; narrower anchors appear below.

### M01–M02 · Account entry and site creation

**Evidence and scope.** Auth/onboarding routes and components were inventoried; the existing authenticated session reached the dashboard. The New site name and Template/AI/Scratch chooser was opened without creating a site. Fresh signup, email delivery, OAuth, 2FA, recovery and generation were not exercised. Preserve these routes and the separate blank/template/AI paths. There is insufficient evidence to justify replacing authentication or inventing new creation capabilities.

**Surface/navigation.** Keep dedicated account pages and a resumable site-creation wizard. Entry is signed-out destination or Dashboard → New site; preserve the originally requested authorized URL after login. Wizard Back returns to the previous completed step, not to an unrelated dashboard. Cancel returns to the site list; if a server site already exists, identify it as a draft rather than silently creating another on retry. Opening template preview returns to the same filter and tile.

**Controls/states/durability.** Field errors remain next to fields; submitting disables repeat submit, not Cancel when cancellation is safe. Expired/used invite or magic link offers the existing resend/sign-in path and preserves destination. Server response owns account/session success. AI creation must distinguish waiting, generating, preview-ready, failed and partial/draft-created; refresh must resolve an existing job/site ID before offering another generation. Never claim cancellation refunds usage unless the service does. Passwords and tokens must not be put in shared navigation preferences. This is a contract for existing flows, not a new generation queue architecture.

**Acceptance A01.** Using dedicated test accounts: sign-in destination survives; expired link is recoverable; duplicate clicks create one logical site; template Back preserves selection; generation failure retains inputs and exposes any created draft; denied invites do not open another workspace. Provider callbacks and email delivery remain U until integration testing.

### M03–M05 · Workspace home, sites and site overview

**Evidence.** Local Home, Sites, workspace shell and site summary routes were opened. Sites provides grid/list, folders, filters, archived and recently deleted views. Site detail exposes Overview, Traffic, Domains, SEO, Submissions, Redirects, Sharing and Settings. The existing fixture initially appeared Draft in Sites; a later detail read showed a simulated published URL. This non-isolated fixture discrepancy is not proof of a publish initiated by this audit or of a deterministic product defect. Reconcile with a fresh shared server revision before fixing status derivation.

**Owner/surface decision.** Keep dashboard as workspace context and site overview as operational summary. Editing belongs to the real editor/site-settings owner. Do not create second editable settings forms in summaries. Regroup actions into Edit site, Review and Publish status; preserve archive/restore/delete, duplicate, rename, folder moves and existing bulk selection.

**Navigation/control contract.** Site title/Manage opens the summary; Edit opens the last valid page of that site. A Publish or fix-SEO action carries explicit destination intent into `/edit/[id]`; it must not merely open a generic canvas. Back from editor goes to the originating site list/detail with folder/filter restored. Search and sorting are workspace scoped. Bulk selection lists affected IDs/count and excludes disallowed sites with reasons. Moving a site between folders changes organization, not URL, page IDs or publication. Restore returns the same site identity. Permanently deleting is a distinct action from archive; use existing retention semantics, never promise recovery without service support.

**States/persistence.** Site data and publication come from server records; optimistic list updates reconcile or roll back on failure. Loading has a skeleton, zero sites has creation guidance, filters with zero results have Clear filters, failed fetch has Retry. Do not show zero traffic when fetching failed. Workspace switch cancels/ignores old list responses. A site may be live while its latest attempted publish failed; show both statuses.

**Acceptance A03.** Two workspaces with identically named sites cannot mix state; filtered list survives Edit→Back; archive/restore keeps site/pages/assets; bulk partial failure reports exact failures; summary Publish opens the canonical gate; stale list/detail converges on the same server revision. Test simulated deploys as simulated, never as verified public sites.

### M06–M07 · Personal settings, workspace administration and integrations

**Evidence.** Profile, workspace, account, security, notifications, team, billing/plans, usage, AI credits, API tokens, integrations and danger routes were opened with the existing owner-like session. This verifies visible screens, not external mutations. Team role copy says Viewer cannot open the editor, while the actual editor route supports a read-only viewer. API-token UI explicitly says the public API is coming soon. Integration webhook copy says form capture is unbuilt, while `server/services/form-submission.service.ts` calls `deliverWebhook(..., "form.submit", ...)`.

**Owner/layout.** Keep account settings (identity/login/security/personal notification preference) separate from workspace settings (name/brand/team/billing/integrations). Retain full-page forms. A common header must name the scope and workspace. Editor doors to Members/Billing/Integrations open the existing workspace destination, explicitly marked as another tab where that is current behavior; leaving the editor must not discard local work.

**Exact contracts.** Profile/workspace field edits commit with their own Save action and keep dirty drafts on failure. Team invite/role/remove uses the existing permission matrix; Viewer description must match read-only editor access. Pending invite, expired invite, seat limit and owner-protection are distinct. Resend invite is an external action, not undoable document editing. Billing must show current plan, pending transition, provider failure and entitlement refresh separately; successful checkout redirect is insufficient until server plan confirms. Usage values retain their actual estimated/observed labels. AI-credit display must distinguish available in-editor assistance from any future creation feature. API tokens may remain manageable, but the CTA/help must state their actual current usability; no invented working public API. Webhooks retain event selection, endpoint, secret/reveal-once behavior, test/delivery logs/retry only where implemented. Correct stale `form.submit` copy from actual server availability rather than promising delivery reliability that was not tested.

**Persistence/recovery.** Server mutations are canonical; use revision/refetch handling and retain unsaved form data on permission loss. Credential rotation/revocation, active-session removal and destructive workspace actions are not covered by canvas Undo. Before transfer/delete, show exact affected workspace/site and authorization outcome; never migrate sites as a side effect of a layout change.

**Acceptance A06.** Test viewer actual route access against all role descriptions; field Save failure preserves drafts; plan-gate success waits for confirmed entitlement; token unavailable state stays explicit; form webhook availability derives from actual implementation and a future integration test; switching workspace during request cannot update the new workspace. Payment/OAuth/email/delivery/2FA runtime branches are U here.

### M08–M09 · Agency, ecosystem and support

**Evidence.** Agency list/reviews/handover/library/theme/partner and marketplace/templates/learn/resources/help routes were visited. Empty/gated fixture states limit record-detail verification; template details, agency-client details and support-ticket threads require specific records. Later captures verified the Shared theme empty state and Following site row. The partner URL redirected to the agency client list, so partner-specific UI remains unavailable. Some earlier fast captures precede hydration; the route ledger links to the later evidence.

**Decision.** Keep these as workspace/discovery tasks. Agency client ownership, handover and review queues should link to the same sites/rounds used in the editor, not duplicate their data. Templates remain a discovery library whose Apply hands off to M16; marketplace/install actions retain existing entitlement checks. Support belongs outside canvas editing and keeps a return destination.

**Controls/workflow.** Filter/search retains current list on Back from detail. Empty agency state offers only implemented setup paths. Gate explains required plan/agency status and retains destination after successful enablement; do not enable agency by changing server flags during design. Handover identifies receiving account/workspace, permissions and transfer consequences before commit. Shared library/theme changes disclose scope; a site copy must not silently convert into a globally linked asset/component. Learning/resource external links announce leaving the app. Ticket submission preserves text/attachments on network failure and only claims submission after server acknowledgement.

**Acceptance A08.** Agency queue→round→site returns to the same queue filter; transfer failure preserves ownership; a template preview does not create a site; failed ticket submission can retry without duplicate ticket. No new CRM, marketplace seller workflow or learning platform is proposed. Runtime external transfers, installs and ticket delivery remain U.

## 6. Module specifications: editing the document

### M10–M11 · Editor shell, canvas and direct manipulation

**Evidence/owner.** `tabsConfig`, `StudioPanels`, `FullPageRouter`, shell hooks, selection/element-action registries establish a substantial existing editor. Assets/Templates/Settings/Brand already have larger workspaces; CMS has its own canvas-replacement surface. The redesign must extend these, not report that all editing currently happens in a tiny rail. Canvas is engine-mounted DOM, not React-owned content.

**Keep and regroup.** Keep direct selection, inline text, drag/drop, resize, breadcrumbs, context menu, zoom, device width, guides/rulers/grid/X-ray and multi-select. Keep the existing primary rail: Add, Layers, Pages, Assets, CMS (Content), Brand. Site identity/menu owns Site settings, History, Activity, Export and leaving the editor; header owns page, viewport, undo/redo, preview and publication. Existing command/shortcut access stays as acceleration. Every command is discoverable through a visible owner. A right-column workflow must show its name and Back to Inspector instead of appearing to erase selection.

**Exact canvas contract.** Click selects a stable element ID and synchronizes Layers/Inspector; double-click editable text enters text mode, Escape exits text mode first. Multi-select exposes only common compatible controls. Drag shows parent/position before dropping; invalid parent, locked ancestor and cross-page restrictions are explained without applying a partial insertion. Resize previews active-breakpoint dimensions, commits one history entry, cancels with Escape. Keyboard delete/copy/undo must not intercept text editing or unrelated input. Context menu and toolbar use the same `elementActions` registry and lock gates. Hover is transient and cannot become saved selection. Root selection exposes page controls rather than arbitrary element properties.

**Durability/states.** Flush history's pending 500ms coalescing before snapshots, version save, export and context transitions that require a stable document. Navigation/zoom/selection do not dirty ProjectData. All writes go through Composer/`writableElements`; React must not mutate canvas DOM as a substitute for engine commands. Save header distinguishes saving, locally recoverable/offline, saved, error and conflict. Existing layout preferences migrate rather than reset.

**Acceptance A10.** Same action from canvas/Layer/context menu serializes identically; lock respected at all entry points; drag/resize is one undo; cancelling reverts exactly; text typing cannot trigger global shortcuts; site switch cannot autosave one site's tree into another. Existing Escape, multi-target and undo tests are evidence for parts of this contract, not full coverage.

### M12–M13 · Add and Layers

**Evidence and decision.** Add already groups elements, blocks and saved components; templates and component management also have separate entry doors. Layers has structure operations. Keep two compact drawers with P1 sizing. Do not turn Add into a second asset/CMS manager.

**Add contract.** Entry via rail A or command; retain search, categories, recent/favourites, built-in/saved component browsing, HTML paste and AI-block entry where available. Single-click insertion states the target parent and index; drag uses the same validation. If no compatible selected container, insert at the current page's valid root and announce position. A structural block insertion creates all descendants in one undo transaction and preserves IDs on undo/redo. HTML import must retain existing sanitization and make rejected/unsupported content visible, not execute custom scripts. Empty Mine links to Save selection as component; Manage opens M23 and Back preserves query. A template opens preview before replace/new-page choice.

**Layers contract.** Select/reveal scrolls to the matching node without collapsing unrelated expanded branches. Inline rename commits Enter/blur, Escape cancels. Lock and visibility show different icons and scope: editor locking is not publish visibility; display changes say which breakpoint they affect. Reorder/nest previews destination; root, cyclic nesting and locked-descendant moves are refused. Multi-move and Move to page disclose the target and preserve bindings/IDs; return to source or reveal destination according to explicit action. Search reveals matching ancestor path; Clear restores previous expansion.

**Acceptance A12.** Insert by click/drag gives equivalent trees; component/source data survive insert→undo→redo; filtered layers can select/reveal the correct ID; hide at mobile does not hide desktop; move-page preserves internal references or reports unsupported references before commit. Search/collapse/favourite preferences must not mark the document unsaved.

### M14–M16 · Pages, page metadata and templates

**Evidence.** Existing pages/folders/bulk actions, three page-settings tabs and full-page template browsing/application were inspected in source. `useTemplateApply` has 13 passing tests in this audit. Page Advanced currently uses a “Live” control with “Page is publicly accessible” helper; this confuses eligibility with actual deployment.

**Ownership/surface.** Pages owns site structure, routes and home page. Page settings currently commits its three-tab draft through Done (not per-field autosave); retain one validated commit and Cancel. Resize it into a contextual 480–560px sheet; Site settings owns defaults. Templates retains its dedicated preview workspace. Entry: Pages→row/settings or current-page menu; Back returns to the same page row. Metadata sheet names the page even when canvas selection changes. Template preview return restores gallery filters; Apply returns to the resulting page and selects its root.

**Control matrix.** Page create/duplicate takes a unique name/slug; home changes keep one valid home; delete lists affected internal links, CMS template usage and recovery before removal. Page folders preserve actual route semantics—do not infer URL nesting from visual indentation. SEO edits title/description/slug/indexing with inherited site defaults explicitly identified; Social edits current Open Graph values/image; Advanced edits inclusion/index/follow and sanitized head code. Rename “Live” to **Include in next publish** with separate last-live status. Index and Follow remain independent. Clearing a page override reveals site default; it does not delete the site default. Slug change offers an existing supported redirect path, not an automatic redirect claim. Template action must explicitly choose **Add as new page** or **Replace this page's layout**, identify the target and retention/loss boundary, capture the before-state and apply once. Preserve current template save/delete/preview flows and imported unknown fields.

**States/recovery.** Page changes use document history and autosave; metadata uses the actual existing commit path, consolidated into the explicit sheet transaction rather than pretending it is a separate server resource. Replacement errors leave the original page intact; template asset load failure must not silently produce a successful empty page. Missing current page after remote change returns to a surviving page with notice.

**Acceptance A14.** Duplicate preserves bindings/metadata but creates valid distinct IDs; deleting a dynamic template cannot orphan a collection silently; home stays valid; replace→Undo restores tree, bindings and metadata; page inclusion on a never-published site never claims a live URL; cancel metadata leaves serialized project unchanged; reload retains committed values.

### M17–M18 · Style, inheritance and responsive editing

**Evidence.** `ProInspector`, `sectionOrder`, type registry, `cssContext` and style handlers show three existing tabs Style/Behaviour/Effects. Responsive and multi-target tests passed (2 + 9). Buildrick's engine writes element styles; adding CSS class names is not Webflow's class-first selector model. Current base is Desktop ≥1024, Tablet 768–1023 and Mobile <768; responsive rules use max-width 1023/767. Wide 1920 is a viewport preset, not another override breakpoint.

**Decision.** Keep right Inspector, resize and regroup it; retain Style/Behaviour/Effects names to avoid needless navigation migration. Sticky top rows show selected type/name, lock/instance status and actual scope. Style owns visual/layout properties, Behaviour owns semantics/data/actions, Effects owns visual effects/animation controls. Type-specific content appears before generic sections, never buried under global Brand settings. All advanced properties remain available.

| Group | Controls that must survive | Exact scope/behavior |
|---|---|---|
| Layout | Display block/flex/grid/none/inline variants; flex direction/wrap/justify/align/gaps; grid tracks/rows/flow/alignment; child span/grow/shrink/basis/order | Reveal controls only when relevant to parent/element display; preserve hidden values; raw track syntax validates without replacing valid custom CSS with guessed presets |
| Position and size | Static/relative/absolute/fixed/sticky, offsets/z-index, width/height/min/max and overflow | Position gates offsets; unit-aware fields; auto/intrinsic/custom preserved; no dimension write merely from opening a section |
| Spacing | Margin/padding per side and linked editing | Link action must say whether it copies a value; unlink preserves four values; negative margin allowed where supported, invalid padding refused |
| Typography | Family/site fonts, size, weight, line-height, alignment, transform, decoration, letter/word spacing, style, whitespace, breaking, indent, vertical-align | Token binding remains visible; unitless line-height preserved; font missing/loading uses fallback without erasing saved family |
| Fill and border | Existing solid/gradient/image/background controls; per-edge border/radius | Preserve multiple layers and unsupported serialized values; editing one stop/edge cannot reset the rest |
| Scope | Desktop/Tablet/Mobile; pseudo-state; inherited/local/token/mixed indication | Property writes only to selected scope. Structural/attribute controls explicitly say All breakpoints. Clear removes local override and reveals inherited result. Wide preview never creates new CSS scope |

**States/recovery.** C1 applies, including temporary invalid numeric drafts and transaction grouping. A property's displayed value must distinguish authored value from computed/inherited result; show source on focus/popover. Multi-target intersection and skipped locked targets are explicit. Changing viewport cannot silently persist a new breakpoint or alter canvas content.

**Acceptance A17.** Base→tablet override→mobile inheritance→clear override matches exported CSS; Hover reset does not erase Base; mixed multi-select writes only when chosen; custom CSS values round-trip; inline type restrictions explain disabled size/spacing; 1920 preview creates no breakpoint data. Changes to the editor's own width do not change the authored site's responsive rule.

### M19–M21 · Contextual elements, forms and widgets

**Evidence.** `shared/constants/elementCapabilities.ts` plus type-block bodies cover text, headings, links/buttons, form controls, image/video/audio/SVG/icon/Lottie/embeds, spacer/divider, layout containers, countdown/progress/accordion and compound blocks. Product types fall back to generic containers; do not claim a completed product inspector. Contextual controls must remain available for legacy instances even when absent from the current Add menu.

| Object / editing location | Retained controls and exact proposed behavior | Navigation/recovery/acceptance |
|---|---|---|
| Text/heading/link/button, type block | H1–H6; content/text-style bindings; URL/page/email/phone/anchor targets as currently supported; target/rel; native button/submit/reset type. Structural heading/type changes retain ID, children, style, classes and bindings | Edit on canvas or Inspector; page/link picker returns to same element. A19a: type switch preserves serialized unknown fields and accessible name; invalid URL draft does not erase previous target |
| Inputs, textarea, select, checkbox, radio, switch, upload | Name, placeholder, default value, required, available input types/options and existing validation. Separate actual label text, accessible name and placeholder | Form field list selects the actual child and opens contextual controls. A19b: changing type retains data, IDs, styles, classes, events and binding references; unsupported conversions explain what cannot map before commit |
| Image/video/audio/SVG/icon | Source/alt, loading/object-fit where supported; poster/playback; icon choice/size/stroke; asset versus element scope | Pick assets in M24 with selected element/property retained. Alt belongs to usage, file name to asset. A19c: cancelling picker leaves source; replacing one usage does not replace all; blocked autoplay is not reported as save failure |
| YouTube/Vimeo/map/Lottie embeds | Supported URL/source, aspect and available playback controls; validation beside field | Keep Inspector, open larger source editor only for existing raw source. A19d: invalid/unsupported provider preserved as draft, safe exported markup verified; no invented provider integration |
| Spacer/divider/columns and compound sections | Dimensions/orientation; column count 2–6 and existing gap presets; underlying grid/flex controls; nested header/nav/tabs/table/list/gallery children | Structural controls identify affected children; never delete extra-column children without a migration choice. A19e: count change and Undo restore order/content; semantic children retain roles and IDs |
| Slider/accordion | Slide list add/select/reorder/duplicate/delete; slider playback/controls and available accordion open/closed settings | Keep canvas and contextual list; select slide reveals its content. At least one valid child where engine requires it. A21a: last-child boundary, current-index update, one-step Undo, exported runtime behavior tested |
| Countdown/progress | Countdown date/timezone/end behavior; progress value/max | Keep compact type block. A21b: invalid date/max blocked with retained draft; timezone is explicit; changing max cannot silently corrupt value; zero and elapsed states have defined output |

**Forms: essential correction, not polish.** `FormFieldsSection.tsx` currently labels a field “Label” while writing `placeholder`. Its `replaceField` creates a new input/textarea with only name, placeholder, aria-label, required and DOM id, removing the original engine node. This risks losing styles/classes/default values/bindings/interactions and stable identity. Select is included in the field list but its field-type calculation defaults to text for non-textarea elements lacking `type`. Existing six passing FormFields/Slides tests do not prove correct semantics or preservation; one explicitly asserts the placeholder write.

**Form contract.** Rename current placeholder control honestly; actual label editing must target a real label relationship, not invent text from placeholder. Preserve form name, action/endpoint and existing after-submit success/redirect/error controls. A field morph must use an engine-supported identity-preserving operation with complete before snapshot; if impossible, remap all references atomically and abort on unsupported mapping. Handle select as select and retain options, not as a text input. A contextual **View submissions** door opens Site settings → Form submissions filtered to the same form/site; Back returns to the form. The inbox owns list/detail/export/delete supported by its service; visual field editing remains on canvas. Webhook configuration remains workspace-owned.

**Acceptance A20.** A styled, bound select with options and a linked label survives any allowed type round-trip or conversion is refused with reason; Undo restores exact original tree/IDs/references. Placeholder edit does not change accessible label. Submit in exported/runtime fixture produces one server submission; success, validation failure, offline failure, spam/protection and webhook failure remain distinguishable. This audit did not submit visitors' forms or execute delivery.

### M22 · Effects and interactions

**Evidence/decision.** Keep existing effects and interaction capabilities; they do not require a new timeline product. Source exposes opacity, inner/outer shadows and raw CSS, blur/brightness/contrast/grayscale, scale/rotate/translate/skew, transition property/duration/delay/easing, cursor/blend/text-shadow/will-change. Interaction triggers include click, hover/active/focus/blur, page load/scroll/leave, viewport entry/exit/while-scrolling and mouse movement; preserve existing preset catalog and legacy easing strings.

**Editing contract.** Effects remain in Inspector; an expanded interaction editor is a sheet for a selected rule, not a detached page without target identity. Trigger, target, action/preset, duration, delay, easing and enabled status appear in that order. Display seconds and convert once to engine milliseconds. Reorder/delete applies to the selected rule ID. Native CSS transitions/animations and engine interactions remain separately labelled so editing one does not erase the other. Duplicate makes an independent rule; reset only resets chosen property/rule. Reduced-motion behavior must preserve any existing policy and be tested in exported output; inventing a new policy is optional future work.

**States/impacts/recovery.** Selection/viewport changes stop transient previews and preserve authored values. Invalid easing/custom CSS retains draft. Locked/read-only target prevents writes. Trigger preview cannot publish, send forms or execute arbitrary custom code in the trusted editor. Changes are document transactions and affect exported runtime, so editor animation alone is insufficient verification.

**Acceptance A22.** Duration 0.25s serializes 250ms once; load/save does not multiply; legacy easing round-trips; deleting one rule retains others; Undo restores IDs/order; pointer/keyboard trigger and exported interaction match supported engine semantics. No GSAP visual timeline, arbitrary new trigger, or Webflow interaction parity is claimed.

## 7. Module specifications: reusable objects, assets and content

### M23 · Components, instances and variants

**Evidence/problem.** Saved component insertion/management, variants, instance propagation and override handling exist. `ComponentDetailScreen` updates a master by promoting the current canvas selection. `ComponentManager.applyMaster` saves a new master/version and synchronizes instances; `ComponentInstances.syncInstance` retains compatible overrides and drops incompatible ones. The existing revert path restores the prior master tree, but does not capture the original override maps of every affected instance. This is a source-backed recovery risk, not a destructive runtime experiment.

**Owner/surface decision.** Keep Add → Saved components for browsing/inserting and existing component management list/detail. **Extend master editing into a dedicated focus workspace** because changing a reused structure has site-wide consequences. Do not make normal canvas selection implicitly mean “edit master.” The focus workspace reuses current canvas/Layers/Inspector and existing component IDs. It is a D extension of supported master updates, not an implemented screen.

**Entry/edit/return.** Instance Inspector identifies component name, variant and local override count; Edit main component opens master workspace with `returnTo` instance/page. Component library → Edit opens same owner without requiring a sacrificial canvas selection. Header reads “Editing main component · N instances”; Cancel discards draft and returns to the same instance/library filter. Update opens impact summary, then returns with updated instance selected. If instance was removed, return to its page with notice.

**Controls/workflow.** Preserve save selection, insert, rename, duplicate, variant assignment/creation where implemented, reset override, detach and delete. Instance property edits remain overrides. Detach preserves rendered content/style/children and IDs/reference mapping while severing component link. Delete master must disclose referenced instances and follow existing allowed unlink behavior; never erase canvas instances incidentally. Master draft → validate → compare affected instances → confirm update → apply atomically → confirm save. Impact summary names removed/changed fields and overrides that cannot survive. A preflight is required before irreversible dropping, not a toast afterward.

**Persistence/undo.** Snapshot master tree/version plus every affected instance tree, override map, variant and mapping before propagation. Commit once; failure rolls back all changed objects or presents an explicit partial state with recovery. Restore must restore the complete snapshot, including dropped overrides. Keep a recoverable checkpoint across reload if the action promises later recovery; otherwise label Undo's session boundary. This requires engine/service work beyond frontend-only restyling.

**Acceptance A23.** Two instances on different pages with distinct overrides, nested children, variant assignments and bindings survive compatible update; incompatible update names losses before commit; failure halfway through propagation restores all objects; Undo exactly restores original maps, not only appearance; reopen/reload keeps master/instances consistent; Cancel creates no component version.

### M24–M25 · Assets, fonts, icons and image revisions

**Evidence.** Assets has a launcher, full library and picker use cases; library components cover folders/search/selection, upload, URL import, stock, usage/replace, versions and partial-result dialogs. `ImageEditorModal` already has Crop/Adjust/Resize/Optimise, a shared draft, dirty-discard protection, encoding retry with the same bytes, and a separate saved state. Saving an image version and applying it to usages are separate operations. Retain this distinction.

**Owner/layout.** Keep launcher for quick insertion; full library for multi-asset organization and usage. Picker reuses the library with an explicit target banner “Choose image for [element/property]” and one Select action; managing assets must not accidentally assign the selected tile. Image editing remains a large bounded dialog (current 960×740 maximum frame) with responsive stacked controls, not a permanent inspector tab. Site fonts live in the same asset ownership layer and are referenced from Brand/typography. Icons remain a dedicated picker.

**Control/state contract.** Upload supports existing type/size/quota rules, per-file progress, partial success and retry only failed items. Folder move/delete names descendants and references. URL import validates/fetches and distinguishes unreachable/CORS/invalid-file/quota failure; do not call any failed import an empty library. Stock results keep query, attribution/license metadata and provider failure state. Usage detail identifies pages/components/properties; **Replace this usage** changes only selected binding, **Replace across site** previews all affected references. Preserve original asset identity where the service requires it.

**Image editing.** Crop keeps aspect/free behavior, rotation/flip/zoom; Adjust keeps existing brightness/contrast/saturation/blur and presets; Resize preserves ratio/width/height validation; Optimise keeps format/quality/output-size estimate. Reset all resets the draft, not stored asset. Invalid dimensions disable Save version. Save encodes a frozen draft once, awaits service, then shows Version saved with Back to editor/Done. Retry uses identical failed bytes and snapshot. Cancel/Escape/backdrop share the dirty guard. Applying a version to usages is a second explicit commit and displays impact count. A failed estimate is not necessarily a failed save.

**Durability/recovery.** Asset data/version service is canonical; assigning an asset to an element is a Composer history operation. Global replacement needs its own full reference snapshot or version-reapply recovery; do not promise global rollback from canvas Undo without implementation. Upload success must not leave only a session blob URL as durable source. Font upload/removal warns about usages; icon choice preserves original attributes except the chosen icon properties.

**Acceptance A24.** Mixed-validity upload reports each result and does not duplicate successes on retry; folder move preserves URLs; picker Cancel retains prior image; version save does not alter rendered usages until Apply; replacement failure has exact affected/unaffected lists; reapply previous version recovers; font missing/error keeps original saved family. Image edits round-trip across tabs and failed Save retains draft. This audit did not upload, replace or download user assets.

### M26 · Content sources, site variables and conditions

**Evidence/decision.** Content source code has collections plus JSON data-source import/refresh/replace/remove, site variables and conditions. The runtime rail labels this area **CMS**. Keep current primary CMS identity, but expose a clearly named **Data & variables** subview so non-CMS data does not disappear behind an inaccurate collection-only model. Do not add Google Sheets/Airtable or other connectors without implementation evidence.

**Ownership/paths.** CMS workspace owns collections; Data & variables owns sources, variable definitions and reusable conditions. Inspector owns per-element binding and conditional visibility. From a bound property, Manage source/variable opens the corresponding existing object and returns to the same property; global definitions must not be edited in an unlabeled inline text field on an element.

**Controls/states.** JSON import validates before mutation, shows usable shape/sample and records the source identity; Refresh does not silently replace mappings with an incompatible schema. Rename preserves stable keys or explicitly remaps every reference; Replace previews affected paths and preserves bindings that remain compatible. Remove source/variable/condition identifies dependencies and offers only supported keep-resolved-value/unbind behavior. Site variables are distinct from Brand style tokens. Conditions expose actual operators/types, truth/false result and unavailable-value state; missing data must not silently equal false without engine semantics.

**Persistence/recovery.** Preserve current engine serialized definitions and IDs. Binding edits use document history; source imports/refreshes use their existing storage mechanism and require a before snapshot for any promised recovery. Hydration has loading and failure states so an empty list cannot overwrite saved definitions. A source update affects lists/bindings/export; show scope before commit.

**Acceptance A26.** Rename does not break bound text; source replacement with missing path explains impact; delete/unbind preserves displayed text only when explicitly chosen; variable and token names cannot route to the wrong editor; refresh failure retains last valid source and labels stale data; reload preserves definitions and conditions.

### M27 · CMS schema, records and imports

**Evidence.** Dedicated `CmsWorkspace` has Records/Fields, record sheets, field detail, imports, collection settings and dynamic-page doors. Current addable field types: text, number, rich text, image, boolean, reference, slug, textarea, date, multiselect. Legacy/storage `file` fields must survive but are not grounds to invent a new create control. `cmsSync` has durable outbox/conflict/deleted/invalid states; 22 existing tests passed. Record sheet already distinguishes confirmed versus queued saves and guards dirty work.

**Surface/ownership.** Retain dedicated workspace; collection rail/list is 240–280px, records main area, optional field detail. Record sheet is wide enough for content and status/metadata; stack at narrow widths. Entry is CMS rail or bound-element Manage collection; Back restores source element/page/scope. Collection navigation never changes canvas selection to an unrelated object. Records and Fields are sibling tasks; dynamic routing and collection settings are explicit secondary destinations, not hidden behind ambiguous global settings.

**Record controls/state machine.** New opens a local draft with stable logical ID; Save validates required/unique/type/reference constraints, freezes the submitted draft, then shows **Saved to server**, **Saved on this device · waiting to sync**, **Conflict**, **No longer exists**, or **Failed**. Queued is not equivalent to published or remotely durable. Subsequent retry must reuse the same create identity. Record status/slug and available publish eligibility remain explicit; filtering/search/sort do not alter values. Reference picker distinguishes missing referenced record from empty reference. Rich-text preserves supported marks/links while sanitizing output. Delete uses the service's reference/dependency rules and does not promise canvas Undo.

**Schema controls.** Add field chooses actual supported type; name and immutable/stable key are distinct. Rename preserves key unless an explicit safe remap exists. Required/unique/default/options constraints preview invalid existing records before commit; type conversion cannot silently coerce/discard data. Reorder controls presentation, not field IDs. Remove field lists bindings/templates/records impacted and requires a recoverable data snapshot or an explicit irreversible disclosure consistent with service semantics.

**Import.** Keep existing CSV/JSON support. Parse → map to fields → show validation errors/counts → commit accepted rows → result with succeeded/failed/queued. Do not retry already accepted rows as new records. Preserve the source rows or downloadable failure report when supported; if no failure-report export exists, a new export is optional, not baseline. Cancel before commit leaves collection unchanged.

**Acceptance A27.** Offline create→reload→retry produces one record; unique collision retains draft; conflict offers local/server comparison with a deliberate resolution; deleted record cannot resurrect silently; incompatible schema edits cannot lose bindings/data; import partial failure identifies exact rows; returning to canvas uses the original stable element ID. Direct server saves, IndexedDB and outbox must be tested together in future end-to-end coverage.

### M28 · Binding, collection lists and dynamic pages

**Evidence/problem.** Element `CmsBindingSection`/`CollectionListSection` and collection `DynamicPagesPane` are separate owners already. `StudioPanels` implements a return-to-source-element path worth preserving. Dynamic page and collection settings drafts do not register the same shell dirty guard used by record sheets. Their local collection update can finish before asynchronous server mirroring; a success toast cannot prove remote save. These are concrete source findings, not a reason to replace the CMS engine.

**Binding contract.** Select element → Behaviour → Data binding. Pick collection/context, compatible field, destination property and supported fallback. Show resolved preview and data origin; edit value opens the actual record, edit definition opens schema, layout stays on canvas. Disconnect explicitly chooses remove binding while preserving rendered value according to existing engine support. Collection list chooses collection/filter/sort/limit using supported operators, owns repeat item structure and empty state; editing one repeated visual template must not accidentally edit an arbitrary record. Broken/missing binding is a visible error with repair link.

**Dynamic routing contract.** CMS → collection → Dynamic pages. Choose an eligible non-home page template, URL pattern, field substitutions, title/description and eligibility. Show example URLs and uniqueness/collision/invalid-field errors before Save. Label the existing generation action **Save page-generation settings** with “Pages are generated on the next publish”; do not show “Generate N pages” as immediate publication. Opening template selects its actual page and provides Back to [collection] routing setup. Preserve dynamic-page configuration and record eligibility on unrelated schema edits.

**Dirty/persistence correction.** Register DynamicPagesPane and CollectionSettingsPane with the shell dirty owner. Navigation away has Stay / Discard / Save and continue; failed/queued save must not misleadingly claim remote confirmation. Collection settings name/slug validation and delete-reference blocking remain. Delete can unbind and retain displayed text only through existing explicit engine behavior. Data/schema changes have a separate durability status from document autosave, and pending CMS sync blocks publication as current service logic requires.

**Acceptance A28.** Every in-app exit path—including rail, Back, Escape and page switch—uses the routing/settings draft guard; browser reload/termination tests separately verify already persisted recovery and best-effort native warning without requiring async unload save; save failure leaves entered values; local queued update is labelled; generated URL collision prevents commit/publish; template edit→Back returns to the correct collection; deleting a collection with references cannot silently erase page content; canvas and exported CMS values agree for published-eligible records.

### M29 · Brand, tokens, styles and classes

**Evidence.** Brand already has a dedicated workspace: Colours, Colour mode, Fonts & type, Styles, Component styles, Classes, Presets, Brand checks, Starters, Spacing, Import/export, with advanced token kinds (radius, shadow, motion, border, opacity, z-index, breakpoint, grid, sizing, icon, imagery). Token aliases, usages, preview/apply, restore points and legacy data must be preserved. Inspector class suggestions call optional `getGlobalClasses()` through a cast, but current `StyleEngine` has no such implementation; Brand Classes independently tallies class names from the live tree.

**Owner/layout.** Keep Brand as site-wide definitions, Inspector as usage/binding. Shared workspace frame with optional preview supports dense token editing; advanced types stay discoverable under More tokens and search. A token opened from a property returns to that exact property and retains current breakpoint/state. Distinguish **Site Brand** from workspace agency theme and editor chrome appearance.

**Controls/workflow.** Token rows show name, value, type/mode, alias and usage count. Edit draft → validate type/alias cycle/name → preview affected usages → Apply → actual save status. A global token edit lists impacted pages/components; rebinding one element is a different action. Rename retains existing CSS-variable/key contracts or performs complete mapped migration; deletion previews dependencies and chooses safe replace/detach only when implemented. Colour modes preserve all mode values; font/type style edits retain fallback and units. Preset/starter/import previews disclose replacement scope before Apply and offer a recoverable before-state; export includes existing supported formats only. Brand checks link to actual element/property, then return to check result.

**Classes correction.** Build one read model of authored class names and usage across loaded project pages, backed by actual engine events, and reuse it for suggestions and Brand list. Class-name assignment is element metadata; make that scope explicit. Do not display a Webflow-style global selector editor unless a real class-rule write/read/export architecture is built separately. Global class-rule authoring is an optional architectural proposal, not required to correct empty suggestions. Preserve external/custom classes and CSS untouched.

**Persistence/recovery.** Brand commits use existing token/design-system storage and integration with project save; local preview must never claim server success. Apply/import must capture a restore point with original token keys/aliases. Canvas Undo alone is not assumed to revert service-backed global changes. Undo label must state exact supported scope.

**Acceptance A29.** Token rename preserves references/exported variables; cyclic alias blocked; mode change retains other modes; cancelling preview leaves document/Brand unchanged; restore recovers values and bindings; class suggestion appears after adding a class through another surface and survives page switch; deleting a class assignment does not remove custom CSS. Advanced imported token kinds round-trip even if current UI cannot author every value.

### M30 · Contextual AI

**Evidence.** Existing AI has element/multiple/similar/page/site scopes, suggestions, planning/review/running/done phases, stop/abort and captured undo handles. Provider/model choice is server-owned; provider execution and credits were not used in this audit. Keep AI as an editing assistant, not a replacement navigation system.

**Surface/navigation.** Entry from selected object, page or command; right panel shows scope and actual model/availability. Selection changes must not silently expand an in-progress request's scope. Larger plan/run details may expand as a bounded overlay with Back to Inspector and preserved selection. A scope wider than selection requires explicit choice.

**Control/state contract.** Prompt→planning→proposed changes→review→run→per-step result. Clearly separate generated suggestion from applied change. Show affected IDs/pages and blocked/unsupported actions before Run. Stop aborts remaining steps, identifies already applied steps and retains their undo/recovery handles. Retry only failed/unapplied steps when safe; otherwise propose a new plan against the updated document. Quota, missing provider, offline, invalid response, permission loss and stale plan are distinct. Publishing, sending review and other external operations stay separate explicit operations, never incidental AI text effects.

**Persistence/recovery.** Freeze selected IDs/scope/revision when plan is reviewed; revalidate before applying if document changed. Document writes use engine commands/transactions; arbitrary unvalidated HTML/scripts do not bypass sanitization. Undo must identify the applied step/run it can revert and preserve intervening user edits, rather than blindly restoring the whole page.

**Acceptance A30.** Element scope cannot mutate other pages; stale plan prompts re-review; Stop leaves honest partial result; undo after a user edit restores only supported AI changes or refuses destructive overlap; credits/provider failures preserve prompt; no external action executes without its existing explicit intent. New model/provider features and AI usage pricing are outside this design.

## 8. Module specifications: validation, release and site operations

### M31 · Layout preview, share preview and actual runtime

**Evidence/problem.** `PreviewOverlay` uses a sandboxed `srcdoc` frame without scripts, intercepts internal page links and opens external HTTP links separately. It does not establish form submission or interaction-runtime correctness. Desktop is labelled 1320 while its frame is `w-full max-w-[1320px]`, so the actual viewport can be smaller. The local site exposes a `.dev-simulated.invalid` deployment URL; editor status text calls it live, which must not be interpreted as a verified public deployment.

**Owner/surface.** Keep fullscreen preview with Back, device/page selectors and Share preview. Label the current mode **Layout preview** and show actual rendered CSS width. If the host cannot fit the desired width, either keep fixed iframe width with a separately labelled visual scale or report the real width; do not mislabel a compressed viewport as 1320. Back restores page/selection/zoom, and changing preview page does not accidentally change the designer's document.

**Control/state contract.** Page selection loads that page; missing/deleted page falls back with notice. Device controls change preview frame, not authored styles. Internal links navigate within the preview using existing routing; unsupported hrefs remain safe and explain limitation if interaction is attempted. Share-preview modal retains existing create/revoke/password/access behavior; a share link is not public publication. Expired, revoked, password-required, denied and unavailable preview are distinct. A simulated deployment must say **Simulated publish** and avoid “View live” claims.

**Recovery/acceptance A31.** Closing share modal does not close underlying preview; Escape closes one level. Reopening preserves intended source context. At host 1280, measured iframe width must equal the shown width. A disabled/sandboxed form must not appear to have submitted. Shared-link revocation persists server-side and cannot be restored through canvas Undo. An isolated built-in interactive preview could be added later, but is an optional extension requiring a separate sandbox/export-runtime design; do not simply enable arbitrary scripts in the trusted editor.

### M32 · Checks, publish, unpublish and deployment history

**Evidence/keep.** PublishTab and shell use one job state machine, pre-publish checks, gating/confirmation, progress/logs, cancel, failed-stage retry, polling-loss check-status, unpublish and durable last-live state. Source explicitly retains last successful publication when a republish fails. Preserve these capabilities and any review/approval gate. No actual publication was invoked by this audit.

**Entry/owner.** Header/command/dashboard Publish intent all open the canonical release flow. Publish stays a right panel for summary; confirmation is a bounded dialog with site/destination/pages/revision/approval facts. Failing check → exact owner (page SEO, asset, CMS, settings, element) → Return to publish with selection and check anchor. Re-run affected checks after fixing, never assume the previous pass remains valid.

**State machine.** Unchecked → checking → blocked/warnings/ready → confirmation → preparing/building/deploying → success, cancelled or failed. Pending document save/CMS outbox/conflict must resolve before a release snapshot is accepted. Confirm identifies the exact revision and replacement of last live release. While running, prevent duplicate job creation; Cancel reports what the service actually cancelled. Lost polling offers **Check status** using existing job ID before **Try again** can create a job. Keep logs available after failure. A failed republish displays “Live: previous version; latest attempt failed.” Unpublish names current domain and interruption, uses existing typed confirmation and does not delete draft. Re-publish is its recovery, not Undo.

**Acceptance A32.** Topbar/panel/dashboard produce the same gate and one job; offline/CMS pending cannot publish stale data; Check status does not launch a second build; failed republish preserves last-live facts; cancelling confirmation has no external effects; deployment simulation is marked in all status owners. Release rollback targets a real saved deployment and does not claim to roll back unsaved canvas work.

### M33 · Review rounds, comments and client handoff

**Evidence.** ReviewTab supports loading/error, open/resolved/detached comments, locate/reattach, round history, compare, resend/revoke and invited-recipient preservation. Its source notes no endpoint for arbitrary older-round comment browsing; do not design a working older-round thread pager without service support. Review invitation/delivery was not sent.

**Owner/surface.** Keep right review panel linked to canvas pins and existing external review-token page. Round/snapshot identity and current draft difference remain visible. Review is not an approval checkbox on the current unsaved page. Header shows current reviewer/round/status; history opens read-only supported round facts and compare, not fabricated comments.

**Controls/states.** Locate selects matching element/page and scrolls; detached comment opens explicit candidate reattach, never attaches by similar text automatically. Reply preserves draft on failure; resolved comments remain understandable and may be reopened if permitted. Resend identifies recipient and replacement/revocation behavior before executing; distinguish round-created/link-created from email-delivery-failed. Revoke checks current revision and refreshes stale round. Signed-off/closed/expired/revoked states explain allowed actions. External reviewer view must identify the reviewed snapshot and survive missing target with an orphan state.

**Persistence/recovery.** Comments/rounds are server records, independent of document undo. Reattach preserves comment ID/history; document deletion can detach it. A review snapshot must not be overwritten when the canvas changes. Status transitions are server-authorized; Undo label must not imply an email can be unsent.

**Acceptance A33.** Comment→Locate→Back preserves thread; deleted target appears detached; reattach keeps identity; failed reply keeps text; resend retains intended recipient and reports mail failure honestly; stale revision cannot revoke a newer round; viewer cannot mutate protected state. Client delivery and token-based review mutations are U in this audit.

### M34 · Session history, saved versions, compare and activity

**Evidence/decision.** History already separates Session, Saves and Published; Activity is a separate panel. Preserve this distinction, search, save-version/milestone, preview/restore, compare/time travel, published rollback and existing read-only restrictions. Stored legacy `changes` maps to Session and `activity` preference migration is handled in source; keep this compatibility.

**Navigation/control contract.** History button opens last valid view; a specific activity row opens the matching saved/deployed/session item and offers Back to Activity. Session undo list is chronological, one edit transaction per logical operation. Clear undo history must explain it removes session recovery, not saved versions or published releases. Saves list names author/time/version and supports read-only preview before Restore; restoration names affected pages/Brand/CMS scope actually included in snapshot. Compare shows chosen pair and missing data honestly. Time travel remains a preview until explicit restore/commit. Published shows server release state, not Composer snapshots.

**Durability/recovery.** Flush pending edits before making a snapshot; preserve a recoverable before-state before destructive restoration. Version preview must not autosave old data merely by opening it. A snapshot that excludes separately stored CMS records/assets cannot promise to restore them; state this in confirmation. Restore failure keeps the current document or reports explicit partial state, never a success toast. Viewer can browse/compare where supported but not restore/save/clear. Retain existing prune/retention information without inventing retention guarantees.

**Acceptance A34.** Session edits→undo→redo restore live engine values (3 existing integration tests passed); saved preview→Cancel leaves hash unchanged; restoration preserves current before-snapshot; compare cannot mutate; old preference migration keeps access; deployment rollback and document restore have different labels and services.

### M35 · Site settings, screen by screen

**Evidence/layout decision.** `SettingsTab`, `constants.ts` and individual screen source already separate site screens and workspace doors, minimum roles, save model and publish/live scope. Keep the full-page workspace and search, resize its content grid for narrow hosts, and preserve these distinctions. Settings search lands on an exact screen/control and returns to query. Every page names site + effect timing. The footer has one owner for dirty field forms; immediate object mutations use their own dialogs/results, never an unrelated footer Save.

| Screen / minimum write role | Controls and canonical responsibility | Save/effect and exact workflow | Future acceptance |
|---|---|---|---|
| General / ADMIN | Site name, slug, favicon/touch icon, author and site language available in `SiteSettingsScreen` | Footer Save; next publish. Slug change discloses URL effect and uses existing conflict/redirect handling. Asset picker returns to selected icon field | A35a: invalid/duplicate slug retains draft; cancelled picker does not clear icon; save failure keeps all fields |
| Languages / ADMIN | Default locale; enabled locale list; add/remove; translation checklist | Default is footer-saved; locale add/remove is immediate. Label mixed semantics beside controls. Preserve bare locale keys and translation maps; remove keeps stored translations per current service behavior | A35b: add then Cancel footer does not pretend to undo locale creation; remove/re-add preserves translations; default cannot become missing; Urdu/Arabic labels/RTL checked; no automatic redirects promised |
| SEO / ADMIN | Site title/description/default OG image/social profiles/indexing/robots/canonical settings actually exposed | Footer Save; next publish. Page overrides remain in M15. Preview is illustrative, not a search-engine guarantee | A35c: clear page override inherits site default; robots/custom canonical validation retains custom data; failed save retains all fields |
| Domains / ADMIN | Attach domain, DNS instructions/verify, primary choice, remove | Immediate server object mutations/live effect. Distinguish pending DNS, verification failed, verified, primary and removal failure; no arbitrary polling success | A35d: old primary remains until new primary succeeds; Retry rechecks same domain; remove states affected address and keeps draft site |
| Redirects / EDITOR | 301/302 source/target rules, add/edit/delete, CSV import, repair suggestions | Object changes saved immediately, applied at next publish. Validate loops, duplicate source and target format; keep partial import results | A35e: imported partial failure identifies rows; invalid loop blocked; saved-but-unpublished rule not called live; undo/recovery follows redirect service, not canvas |
| Access / ADMIN | Published-site password status/change/remove and share-link doors | Footer Save; next publish for site protection. Existing password shown only as set/unset, never actual secret. Share preview is its own immediate link service | A35f: blank unchanged password does not remove it; cancel change retains existing secret; share revoke does not change site password |
| Analytics / EDITOR | GA ID/enable, GTM container/enable, Meta Pixel/enable, Clarity project/enable, verification and last received data | Footer Save; next publish. Verification reads actual saved/active ID and distinguishes no events from connection error; switching ID invalidates stale verification | A35g: format validation per provider; verification cannot validate a different draft ID; disabled provider retains saved ID without emitting tag |
| Form submissions / EDITOR | Site/form inbox, list/detail and supported export/delete controls | Immediate server reads/mutations/live data. Entry from selected canvas form carries filter; Back restores form. Empty inbox distinguishes no form, no submissions, filtered-empty and failed read | A35h: same form IDs across pages do not mix incorrectly; server delete failure retains row; export scope matches filter; permission loss leaves data read-only |
| Custom code / ADMIN | Head, body and CSS injections through `AdvancedScreen` | Footer Save; next publish. Preserve sanitization/trust boundaries; distinguish code stored from code executed; no execution in trusted designer preview | A35i: invalid/disallowed content explained; existing supported code round-trips; Cancel leaves bytes unchanged; exported placement tested |
| Security headers / ADMIN | CSP, HSTS and available security policies through `HeadersScreen` | Footer Save; next publish. Validate syntax and expose effect on embeds/forms/analytics; custom policy strings are not silently rewritten by presets | A35j: changing preset preserves explicit custom overrides or clearly asks replacement; invalid policy retains draft; generated response headers tested |
| Danger zone / OWNER | Archive, transfer, delete site | Immediate lifecycle actions; distinct dialogs name site, destination and recovery. Archive is not delete; transfer changes authority only after server success | A35k: cancelled/failed operation preserves ownership and editor; successful archive returns to proper library state; no false Undo for permanent deletion |
| Brand door | Opens site's design system | Apply dirty guard before leaving; N1 restores settings source | A35l: token edit→Back preserves correct settings screen |
| Members / Billing / Integrations doors | Workspace settings, not site-level duplicates | Label workspace and external-tab behavior; retain editor state | A35m: correct workspace destination; no lost unsaved site draft |

**Shared state/return.** On settings-screen switch with dirty fields: Stay keeps focus, Discard resets this form, Save and continue awaits truthful result. Immediate sub-dialog commits are reflected in the original screen even if field draft remains. Permission downgrade after opening preserves entered text, disables write and offers authorized destination. Loading cannot initialize empty defaults and overwrite existing values. Returning to canvas restores page/selection; browser Back must not bypass the dirty registry.

### M36 · Save, conflict, recovery, migration and export

**Evidence.** Save callback/conflict tests passed (4). Existing recovery distinguishes device-local work from server-confirmed work, suppresses unsafe recovery when server state is newer/unknown, and supports local backup/reload/confirmed overwrite. Brand-format conflict refuses overwrite. These are implemented safeguards to preserve, not features missing from the product.

**Control contract.** Save indicator is a status with details, not an unexplained green dot. Saving→Saved requires confirmed site revision. Error exposes Retry and local-backup route; queued/local says device-only. Conflict opens local-versus-server decision: Reload latest, Save local backup then reload, or explicitly confirmed Overwrite where allowed. Show which copy each action keeps; backup must actually finish before destructive reload. Escape may close the dialog while conflict status remains actionable, but cannot resume unsafe autosave. Access loss freezes writes and retains recoverable local draft. Do not add auto-merge claims to a single-writer implementation.

**Export/import.** Keep supported HTML, ZIP and React export controls/options/code preview, CMS static/template choices and custom-CSS behavior. Vue/Next are labelled Soon; internal JSON types do not prove a visible supported exporter. Export is a download, not publication. Flush pending edits, name actual included scope and distinguish failed encoding/asset retrieval from completed download. Import validates/sanitizes and takes a recoverable before snapshot; migration deep-copies and retains unknown serialized fields. Never normalize legacy content destructively merely to fit the new UI.

**Acceptance A36.** Two tabs conflict without last-write-wins loss; backup failure cannot discard local copy; old Brand format cannot overwrite newer server format; reload with site switch cannot resurrect stale recovery; export includes last pending edit; imported legacy fields/IDs/bindings survive load-save round trip. IndexedDB/localStorage quota/unavailable conditions retain an honest failure state.

### M37–M38 · Shared behavior, accessibility and partial capabilities

**Roles and locks.** Use the current role context and server authorization at every mutation. Loading role is unknown, not permission. Preserve viewer inspection, permitted history and review access; hide/disable writes with reasons. Locks protect direct manipulation, keyboard commands, Inspector multi-target writes, AI and component operations. A locked parent/child boundary must be evaluated consistently.

**Keyboard/focus.** Retain `chrome-ui` primitives and one Escape owner. Tabs use roving focus; modal trap includes sticky actions; close restores opener. Tooltip is supplementary, not sole accessible name. State/errors are readable without color; async save/error announcements are polite and do not steal focus. Site-authored dialogs/menus cannot masquerade as editor escape surfaces. Development Agentation/Next controls in captures are not production product defects.

**Responsive shared behavior.** Test host widths 1440/1280/1024/900/768/390 independently from authored Desktop/Tablet/Mobile. P1 defines layout decisions; controls must stay reachable with keyboard and at increased text size. Tables own horizontal overflow; workspace page must not hide Save/Back. Mobile host support is a proposed limited inspect/edit sheet layout, not a claim of complete existing mobile authoring parity. Host-size changes must not rewrite site breakpoints. Respect current reduced-motion/contrast tokens and test actual exported page behavior separately.

**Partial commerce/collaboration.** Preserve product collection setup modal, product block data/bindings and Stripe export injection where wired. Product-card/grid/detail's generic type fallback is not evidence of orders, inventory, checkout configuration or a complete commerce admin. Keep existing pending/unsupported states explicit; end-to-end checkout is U. Collaboration/presence engine exists but engine instructions mark it demo-only/production-blocked. Runtime menu says Start collaboration Planned. Do not enable it or promise production multi-user editing as a design correction; maintain current single-writer conflict behavior.

**Acceptance A37.** Viewer/Designer/Editor/Admin/Owner test matrix with actual server decisions; locked multi-selection skips exactly protected elements; one Escape closes one surface; 200% text has reachable actions; narrow host has no unintended document-width overflow. **A38:** legacy product data round-trips without commerce expansion; cancelled product setup creates no collection; planned collaboration cannot start a production session. Accessibility/concurrency/checkout remain deeper verification tasks, not passed audits.

### Additional scope facts confirmed during the screen audit

- **Form After submit is a server owner:** `FormAfterSubmitSection.tsx` reads/writes `forms.getBlock/updateBlock` by `(siteId, elementId)`. Message/redirect/spam protection are Editor-writable; notification email requires Admin. MESSAGE/REDIRECT and redirect URL travel together; an incomplete REDIRECT draft is not submitted. This is immediate server persistence, explicitly outside document Undo. Preserve the on-screen note. Proposed improvement: retain a recoverable failed input alongside the last confirmed value, clearly marked unsaved; never display a refused value as saved.
- **Languages are partial:** runtime/source explicitly state only default locale ships today. Enabled locale rows and translation progress remain, but no live per-locale routes or automated language redirects are claimed. Preserve existing translations for future support.
- **Designer is an actual permission role:** shared role rank treats DESIGNER and EDITOR equally. All role acceptance matrices include OWNER, ADMIN, EDITOR, DESIGNER and VIEWER; persona “designer/freelancer” does not itself grant any role.
- **Workspace domains:** `/dashboard/settings/domains` is a cross-site inventory with loading/error/empty and DNS/SSL status. Keep it read-only; each site link routes through site summary to canonical Domain settings. Return retains workspace table context; no duplicate domain-writing surface.
- **Agency shared theme:** `ThemeManager` already supports capture from source site, server preview of affected targets, push, per-site lock/held/version skips, partial results and durable snapshot rollback. Preserve these exact operations; do not replace them with a blanket “Apply everywhere.” Admin/Owner controls mutate; Designer can inspect. A08 additionally requires preview counts to equal applied/skipped results, and rollback to remain discoverable after reload. Shared component library mutations likewise keep workspace-wide scope and references explicit.
- **Marketplace:** `lib/marketplace-catalog.ts`, `marketplace.service.ts`, and route source distinguish OAuth Connect (Mailchimp/Search Console door to Integrations), install records (Commerce/Typeform/Memberships), and configured script injection (Tawk.to, HubSpot, LinkedIn, TikTok, Pinterest, site-verification codes). A stored installation record is not proof that every catalog marketing claim is operational. Keep install/uninstall and config persistence; Configure must load existing values before accepting edits, validate through the existing schema, save+install once, and explain workspace-wide next-publish effect. Cancel preserves stored config; failed Save retains draft; uninstall does not promise already deployed scripts vanish immediately. A09 includes duplicate configure, denied Admin role, stale fetch versus typed draft, and generated script escaping. Runtime external provider operation is U.

## 9. Ownership and capability-preservation map

### Data ownership boundaries

| Resource | Canonical editor | Commit authority | Return and recovery boundary |
|---|---|---|---|
| Element tree, attributes, styles, page graph | Canvas/Layers/Pages/Inspector | Composer + site revision save | N1; document transaction/undo and saved versions |
| Page SEO versus site defaults | Page sheet versus Site settings SEO | Actual page/project or site-settings service respectively | Return to page; never reset site defaults while clearing page override |
| Form children versus after-submit | Canvas field list versus contextual server form settings | Composer versus `forms.updateBlock` | Same form ID; Undo only for tree, explicit server state for response settings |
| Component definition versus instance | Proposed master focus workspace versus instance Inspector | Component manager + propagation | Complete master/instance checkpoint; local overrides retained |
| Record/schema versus binding/template | CMS workspace versus Inspector/canvas | CMS store/outbox/server versus project | Return to bound element/property; separate sync and document states |
| Asset bytes/revision versus usage | Asset library/editor versus element picker | Media service versus Composer usage reference | Version reapply versus document undo; distinguish global replacement |
| Tokens/classes versus binding | Brand definitions/class read model versus Inspector | Design-system storage versus element style/class assignment | Restore point versus local property reset; no fictitious class-rule engine |
| Shared agency theme versus site Brand | Workspace ThemeManager versus site Brand | Theme service with target snapshots versus site tokens | Per-target rollback; locks and held sites respected |
| Saved document versus release | Site save pipeline versus publish job | Site revision versus deployment record | Document restore and deployed rollback remain separate |
| Review round/comments | Review panel and external snapshot page | Review/comment service | Reattach/resolve/revoke workflows; not canvas Undo |
| Personal identity versus workspace administration | Account settings versus workspace settings | Account/team/billing/integration service | Server confirmation, no document Undo |
| UI navigation/preferences | Editor shell/workspace frame | Versioned local UI state | No ProjectData mutation; migrate old panel/history preferences |

### Old → new map (all inventoried module groups)

| ID | Existing capability preserved | Proposed location/change | Preservation gate |
|---|---|---|---|
| M01 | All auth/error/invite/2FA routes | Keep account pages | A01; no auth schema rewrite |
| M02 | Blank/template/AI onboarding and new-site flow | Keep wizard; explicit resume/return | Stable created site/job IDs; no duplicate drafts |
| M03 | Home/checklist/workspace/search/notifications/activity | Keep dashboard, clearer scoped destinations | Preferences/read states survive |
| M04 | Grid/list/folders/bulk/archive/deleted/new | Keep site library | Same site IDs, folder membership, recovery rules |
| M05 | Summary/traffic/domains/SEO/submissions/sharing/settings | Keep summaries; carry edit intent | Same server source; deep links return |
| M06 | Profile/account/security/team/notifications | Keep separate account/workspace scope | Roles, invites, sessions, settings retained |
| M07 | Plans/billing/usage/AI/tokens/integrations/lifecycle | Keep administration; truthful availability | No entitlement, secret or provider-schema migration |
| M08 | Clients/reviews/handover/shared library/theme/partner | Keep agency workspace, explicit global impact | Existing flags/locks/target snapshots retained |
| M09 | Catalog/templates/learning/resources/help | Keep discovery, connect to actual owner | Installed/configured IDs, learning/support state retained |
| M10 | Shell/menus/commands/save/help/panels | Regroup using N1/P1 | Old shortcuts and panel preference migration |
| M11 | Selection/text/drag/resize/multi/context/view aids | Keep direct editing | All engine IDs/history/lock invariants |
| M12 | Elements/blocks/built-ins/Mine/HTML/AI insert | Keep searchable Add | Entire existing element catalog and saved objects |
| M13 | Tree/search/rename/lock/hide/reorder/move | Keep Layers; decode display text safely | Names/expansion/order/IDs preserved |
| M14 | Pages/folders/home/bulk/duplicate/delete | Keep Pages drawer | Slugs/home/links/template references preserved |
| M15 | SEO/Social/Advanced page settings | Resize sheet; correct publication copy | All metadata, custom head and unknown fields |
| M16 | Browse/preview/new-page/replace/saved templates | Keep dedicated workspace | Original snapshot survives replacement/recovery |
| M17 | All style/type controls | Regroup/resize Inspector | Units, custom CSS, token references retained |
| M18 | Breakpoints/states/mixed/lock/inheritance | Explicit sticky scope/reset source | Same 1024/768 thresholds; Wide stays preview |
| M19 | All contextual element attributes/content | Keep type-specific Inspector | ID/reference-preserving type changes |
| M20 | Form fields/settings/submissions | Split tree/server/inbox ownership clearly | Field data and `(siteId, blockId)` identity |
| M21 | Structural widget children/playback/options | Keep contextual list/control sets | Child IDs, order, widget data and export runtime |
| M22 | Effects/interactions/native CSS animation | Keep; optional expand detail | Trigger IDs/timings/easing/legacy values |
| M23 | Component save/insert/master/variants/overrides | Extend with master focus workspace | Full master+instance recovery checkpoint |
| M24 | Asset upload/import/stock/folders/usage/replace | Keep launcher/library/picker modes | Asset IDs/URLs/folders/usage references |
| M25 | Image edit/version/fonts/icons | Keep bounded editors/pickers | Original bytes/revisions/font names/alt usage |
| M26 | JSON sources/variables/conditions | CMS → Data & variables subview | Existing source keys/operators/bindings |
| M27 | Records/schema/types/import/conflict/outbox | Keep CMS workspace; strengthen state contract | Records/field IDs, legacy file type and queued writes |
| M28 | Bindings/repeaters/dynamic templates/routing | Clear canvas↔CMS return; dirty guard | Existing URL patterns/template IDs/record eligibility |
| M29 | All Brand sections/advanced tokens/import/restore/classes | Keep workspace; unify class discovery | Token keys/CSS variables/aliases/modes/custom CSS |
| M30 | Context/scope/planning/run/stop/undo AI | Keep contextual assistance | Provider/quota semantics and captured edit handles |
| M31 | Preview device/page/link/share/password | Keep; truthful width/layout/simulation labels | Share-token access and canvas return |
| M32 | Checks/gates/publish/cancel/retry/unpublish/logs | Keep single release flow | Existing job/revision/live-state semantics |
| M33 | Review/pins/reply/resolve/reattach/history/signoff | Keep round owner; explicit snapshot | Comment/round/token IDs and recipient |
| M34 | Session/Saves/Published/Activity/compare/time travel | Keep separate histories | Snapshots/retention/legacy preferences retained |
| M35 | Every settings screen and workspace door | Keep full workspace; consistent save labels | Locale keys, policy/code strings, server settings |
| M36 | Save/conflict/recovery/import/export/migrations | Keep safety paths; honest durability | Unknown data, backups and revision guard |
| M37 | Roles/locks/focus/keyboard/loading/errors/responsive | Shared control/layout contract | Existing allowed capabilities never removed for style |
| M38 | Partial products/Stripe export/demo collaboration | Preserve and label actual availability | No commerce/multiplayer expansion or data deletion |

No capability is removed solely to simplify the shell. If future implementation cannot map a legacy field into the new control, retain its serialized value and a read-only/custom-value representation. Any actual removal requires a separate approved migration decision; it is not authorized by this report.

## 10. Evidence-backed issue and proposal register

Priority: **E1** essential data/recovery correction, **E2** essential clarity/correctness, **D** design improvement (hypothesis, not measured user harm), **P** visual polish, **O** optional expansion. Each row inherits the named module's entry/edit/return, state, persistence and acceptance contract; those references are part of the specification, not an invitation to invent behavior later.

| ID / priority | Evidence and current location | User problem / change decision | Canonical owner, scope, acceptance |
|---|---|---|---|
| I01 E1 | S `FormFieldsSection.tsx:66–77` constructs replacement with a small attribute whitelist | Field type conversion can discard saved properties/identity. Replace conversion implementation with preserving morph or atomic full-reference remap; keep contextual UI | M19–20 engine/form tree, A19b/A20; no server form-row orphaning |
| I02 E2 | S `FormFieldsSection.tsx:50,116,172`; current tests assert placeholder behavior | “Label” edits placeholder; select inferred as text. Redesign exact controls to separate label/placeholder and correctly type select | M20 Inspector, A20; existing value retained, explicit Undo for tree |
| I03 E1 | S ComponentDetailScreen:175–206; ComponentManager:393+; ComponentInstances synchronization | Incompatible overrides dropped; master-only revert cannot establish full recovery. Add preflight plus complete checkpoint before propagation | M23 component manager/service, A23; cross-page/variant impact |
| I04 E1 | S DynamicPagesPane/CollectionSettingsPane local `dirty`, absent record-style `shellDirty` registration | Navigation can lose draft routing/settings. Extend dirty registry to every exit path and preserve failed values | M27–28 CMS/shell, N1/A28 |
| I05 E2 | S DynamicPagesPane:85/232; CollectionSettingsPane:79; CollectionManager local save followed by sync | “Generate N pages” and save success overstate immediate generation/server durability. Rename action; show local/queued/confirmed | M28 CMS sync/publish, S1/A28/A32 |
| I06 E2 | S `CSSClassesSection.tsx:112`; no getGlobalClasses implementation; Brand Classes derives own count | Suggestions cannot use a real shared class inventory. Extend common read model and live events; keep element assignment semantics | M17/M29 style engine/Brand, A29; class-rule authoring excluded |
| I07 E2 | S page-settings Advanced “Live” helper | Eligibility for next publish presented as current public access. Rename control and show separate live revision | M15/M32 page metadata/release, A14/A32 |
| I08 E2 | S PreviewOverlay sandbox + max-width; runtime measurement in evidence | Static preview can be mistaken for working runtime; labelled width may exceed actual frame. Relabel layout mode and measured width | M31 preview owner, A31; don't enable arbitrary scripts |
| I09 E2 | R editor initial text/site-menu; S StudioHeader:715 vs PublishTab:273/811+ | Simulated `.invalid` publish described as live outside Publish panel. Use shared simulation-aware status projection | M05/M10/M31/M32 server release facts→UI, A32; no deploy changes |
| I10 E2 | R team route; S `lib/constants/enums.ts:52` versus editor viewer route | Viewer role description contradicts read-only editor access. Correct centralized role copy and test actual role matrix | M06/M37 account/permission owner, A06/A37 incl Designer |
| I11 E2 | R integrations; S webhooks-card:23 versus form-submission.service:173 | Existing form webhook incorrectly described as unbuilt. Correct availability copy and add future delivery integration test | M07/M20 integrations/form service, A06/A20; delivery reliability remains U |
| I12 E2 | R Layers screenshot and selected-element footer; S layerUtils.ts:19 strips tags without decoding entities | “Tom &amp; Jerry”/“Q&amp;A” differs from canvas; searching visible text can fail. Decode inert text for labels/search without altering saved HTML | M13 shared display-text utility, A12: entities/numeric entities/markup/unsafe strings; no content mutation |
| I13 E2 | S dashboard sites/[id]/publish/page.tsx:20 redirects to bare editor URL | Publish entry loses task intent. Extend existing URL/panel intent to open canonical release gate, preserving origin | M05/M32 navigation, N1/A03/A32; runtime redirect branch still U |
| I14 D | R editor-content.png: centre blank, empty guidance in rightmost 300px region | Empty CMS appears unfinished and separates guidance from New collection. Regroup empty guidance centrally; remove inactive detail region | M27 CMS workspace, P1/A27; populated table/detail preserved |
| I15 D | R Inspector has State row while Breakpoint is nested in bottom View menu; S scope handlers | Designer must inspect separate places to know write scope. Add sticky current breakpoint/state + inheritance source | M17–18 Inspector/view context, C1/A17; preserve existing selectors/thresholds |
| I16 D | S current master promotion requires selection; W5 focused-main-component task | Global definition edits need explicit master identity. Extend to dedicated focus workspace; reuse engine, not canvas rewrite | M23 + N1/P1/A23; implement only after I03 |
| I17 D | R/S distinct Back paths and existing CMS return support | Navigation contracts differ across workspaces. Unify destination/return descriptor and dirty handling without deleting working return paths | M10/M23–30/M35 shell, N1/A10; migrate local prefs |
| I18 E2 | R API tokens says unusable but empty CTA says script deploys; AI page labels broad tools Coming soon | Availability messages invite incorrect expectations. Align CTA/copy to actual provider/API/AI scope; retain future labels | M07/M30 administration, A06/A30; no API/AI expansion |
| I19 P | R Brand 1280 screenshot: Review changes · 0 wraps over three lines in header | Dense global actions are harder to scan. Resize action area, use no-wrap count, wrap toolbar as a whole at narrow widths | M29/P1; 1280/900/768 and long labels, no token state change |
| I20 P | R/S disparate drawer/workspace geometry; no failure established on Languages at 900 | Normalize spacing/type/field alignment through existing chrome tokens. Keep functioning responsive layout, measure before replacing | M10/M24/M29/M35/P1/A37; cosmetic-only serialized hash unchanged |
| I21 O | W2 class selector comparison; S element-based engine | Full reusable class-rule authoring could help some designers, but needs selector/cascade/export architecture. Defer; I06 does not depend on it | Separate architecture proposal, no implementation-ready promise or new baseline capability |
| I22 O | S static preview versus exported runtimes | Isolated interactive preview could test widgets safely. Defer pending sandbox/runtime plan and threat model | M31 future extension; not arbitrary script execution in editor |
| I23 U/investigate | R Sites initially Draft; later detail Publishing/Published and quota values changed | Shared fixture/stale-read/concurrent-state cause not isolated. Refresh same server revision and inspect mutation logs before classifying a defect | M03–05/M32 evidence gap; do not fix guessed cause |

E1/E2 corrections are essential. D items are proposed workflow changes, not evidence of measured conversion or user-study outcomes. P work follows correctness. O items are deliberately not required for this audit's recommended implementation scope. Localization publishing, production collaboration, full commerce administration, unsupported exporters and external data connectors remain excluded capabilities, not hidden commitments.

**I24 · E2, narrow-host correction.** R: [390px editor](evidence/editor-390.png) and its metadata show `innerWidth=390`, document `scrollWidth=425`, a clipped site/page identity and almost no exposed canvas behind the Inspector. The 900px editor and Languages at 900 had no document-width overflow. Owner M10/M37; scope is responsive chrome, not the authored page. Apply P1's compact header and one explicit overlay sheet, preserve visible site/page identity and a reachable canvas-return action. Opening/closing the sheet must not change selected element or breakpoint. A37: measure shell scrollWidth≤host width excluding intentional inner canvas/table scrolling at 390/768/900/1024; keyboard Back/close works and 200% text keeps actions reachable. The fixture does not establish complete mobile authoring support.

## 11. Frontend and engineering handoff

### Decisions ready to implement in a subsequent authorized task

The data-preservation fixes, truthful labels, class discovery, CMS dirty guards, scope/return contracts, panel targets and module acceptance criteria above are **D specifications**. No proposed screen or fix is implemented by this audit. Component-master workspace is design-ready at the interaction level but depends on checkpoint/propagation engineering first; global class-rule authoring and interactive preview are intentionally not design-ready build tickets.

| Work package / dependency | Concrete files or seams | Deliverable and exit condition |
|---|---|---|
| H1 · Preservation first | `FormFieldsSection`, engine element morph/serialization; `ComponentManager`, `ComponentInstances`, component master service | I01–03; complete before/after fixtures prove stable IDs, unknown attributes, bindings and override recovery. Do not launch master workspace before A23 passes |
| H2 · Correct scope/status | page-settings Advanced, `StudioHeader`, `PublishTab`, `PreviewOverlay`, centralized role descriptions, webhooks/API/AI copy | I07–12/I18; one release-status projection for real/simulated/live/failed, safe decoded display labels, actual preview dimensions, truthful role/service availability |
| H3 · Durability and CMS | `shellDirtyRegistry`, `DynamicPagesPane`, `CollectionSettingsPane`, `RecordSheet`, `cmsSync`/CollectionManager | I04–05; dirty guards and explicit local/queued/confirmed status without replacing outbox. A27/A28 + publish blocking pass |
| H4 · Navigation and Inspector | `StudioPanels`, `FullPageRouter`, `useStudioState`, panel-state migration, `tabsConfig`, `ProInspector`, style handlers, dashboard publish redirect | I13/I15/I17/I24; N1 destination adapter, sticky scope, P1 responsive shell; preserve old panel keys and command IDs; no schema change just for routing |
| H5 · Shared object surfaces | Brand Classes + `CSSClassesSection`, `CmsWorkspace`, asset picker/library integration, proposed component focus workspace | I06/I14/I16; one class read model, useful empty state, explicit master context, correct cross-workspace return; depends on H1/H3/H4 as applicable |
| H6 · Visual consistency | Existing `chrome-ui`, workspace frame styles and `--bk-*` tokens | I19/I20; spacing/header actions/field alignment after functional gates. Same serialized project before/after purely visual changes |

Do not estimate delivery dates from file count. H1 and H3 have engine/server complexity; H6 should not mask unresolved data-loss issues. Existing source comments that reference older design boards are not requirements for this handoff.

### Proposed frontend interfaces and invariants

These are responsibilities, not new persisted backend schemas:

- **Destination descriptor:** `{siteId, workspaceId, surface, subview?, objectId?, sourceObjectId?, returnContext?}`. `returnContext` carries stable page/selection IDs, style scope, scroll/zoom and focus key. A resolver validates existence/permission; invalid IDs show an explicit fallback. Keep it in shell session state/route query where appropriate, never embed transient UI state into the site's content tree.
- **Write-scope descriptor:** `{resourceKind, targetIds, breakpoint?, pseudoState?, tokenId?, componentId?, mode: local|global|server}`. Render it from actual engine/service target, not from the clicked tab label. Attributes, CMS records and server form settings must not inherit a misleading responsive scope.
- **Durability projection:** `clean | dirty | saving | local-only | queued | confirmed | conflict | failed | denied | gone`, with revision/job/operation ID and last confirmation time when available. Resource owners translate their actual state into this read model; do not force all saves through a single generic mutation API.
- **Dirty participant:** provide `isDirty`, `discard`, and an async `save` result that distinguishes confirmed/queued/failed. Navigation coordinator owns one pending destination; module owns validation. Existing no-save draft surfaces may offer Stay/Discard only; never display a Save action with no implementation.
- **Operation receipt:** for component/global replacement operations, identify exact affected IDs and a recovery token/snapshot. Claim “Undo” only if receipt can restore the full before-state. Canvas history entries and server receipts remain distinct types.

**Rendering constraints.** Composer mounts canvas content. React chrome subscribes to engine state and invokes commands; no React reconstruction of saved HTML. Continue sanitizer SSOT, `runtimeEnv` for dashboard-safe imports, lock guards and existing overlay primitives. Use stable keys for site/object transitions and ignore stale async results. Reuse module providers rather than creating a second copy of token/CMS/media state inside each panel.

**Migration contract.** Before any subsequent implementation, capture representative fixture exports including legacy fields, custom CSS, components/variants/overrides, tokens/modes/aliases, multiple pages/locales, CMS bindings and outbox items. Compare semantic data before/after opening and saving with the new UI. Migrate only UI preference schema where necessary; keep old identifiers readable. A versioned content migration requires an explicit tested inverse/backup policy. No bulk rewrite or cleanup of saved user work is part of the proposed UI refactor.

### Acceptance scenarios for frontend signoff

| Scenario | Observable success | Required persisted/recovery assertion |
|---|---|---|
| Designer changes mobile heading spacing | Inspector states Mobile/Base and inherited source; Clear returns inherited value | Desktop unchanged; exported mobile rule correct; one undo restores override |
| Designer changes a form field type | Existing field stays selected and no hidden data disappears | Stable block/label/binding references; style/default/options preserved or conversion refused; exact undo |
| Designer updates reused component | Master mode unmistakable; impact count before Update; returns to source instance | All affected override maps captured; partial failure rollback; exact full recovery |
| Designer edits CMS routing then leaves | One dirty prompt, failed save retains values, queued state honest | No lost draft; no duplicate sync; pending outbox prevents stale publish |
| Designer edits image and uses it | Saved version appears before explicit application; target usage is named | Original revision survives; only confirmed usages change; replacement recovery works |
| Designer edits Brand token from a property | Global impact disclosed; Back restores exact property/scope | Token key/alias bindings preserved; Cancel applies nothing; restore point recovers |
| Designer fixes a publish failure | Fix door opens exact owner and Return to publish preserves context | Recheck against correct revision; one job; prior live release preserved on failure |
| Designer returns after network loss | Local/server distinction and valid recovery choices visible | No stale tab/site overwrite; local backup completes before discard; conflict guards remain |
| Viewer or Designer opens protected settings | Inspect works; disallowed writes have correct reason | Server rejects unauthorized mutation; Designer/Editor role equivalence stays as implemented |
| Designer uses narrow window | Identity and close/Back/actions reachable; one overlay at a time | Host resize changes no document, breakpoint, selection or token data |

These are future signoff scenarios. They were not all run during this report-only task. The targeted passing tests below are the actual automated verification performed.

### Rough visual handoff

[Open the standalone workflow sketch](workflow-sketch.html). It illustrates three proposed states: scoped element/form editing, CMS record editing with sync/return context, and component-master impact review. It is a documentation artifact with illustrative values, not a working product, application code, an external design dependency, or evidence that the proposed screens already exist. The detailed contracts in this report take precedence over the sketch. Its standalone desktop render was visually inspected; [rendered sketch](evidence/design-sketch-desktop.png). This checks documentation layout only, not application implementation.

## 12. Verification, evidence and remaining access limits

### 12.1 Actual automated result

The following existing tests ran once against the current checkout: **8 files, 64 test cases passed, 0 failed**. The JSON reporter counts nested `describe` groups as 23 suites; that is not 23 files. [Machine-readable result](evidence/targeted-tests.json).

| Test file under editor | Test cases | What this supports / does not support |
|---|---:|---|
| `src/editor/inspector/hooks/__tests__/useStyleHandlers.responsive.test.ts` | 2 | Selected responsive write/reset behavior; not all CSS properties or actual browser cascade |
| `src/editor/inspector/hooks/__tests__/useStyleHandlers.multiTarget.test.ts` | 9 | Multi-target writes/guards covered by these tests; not every type/lock combination |
| `src/editor/inspector/sections/__tests__/FormFieldsAndSlides.test.tsx` | 6 | Existing handler behavior; does **not** prove correct label semantics or full field-data preservation |
| `src/editor/shell/hooks/__tests__/useSaveCallback.conflict.test.ts` | 4 | Save conflict paths under test mocks; not two real browser sessions |
| `src/editor/shell/hooks/__tests__/useColumnPanelEscape.test.tsx` | 5 | Escape ownership for covered surfaces; not full keyboard accessibility |
| `src/services/__tests__/cmsSync.outbox.test.ts` | 22 | Durable queue/retry scenarios under test storage/network; not live offline mutation on saved QA data |
| `src/editor/sidebar/tabs/templates/hooks/__tests__/useTemplateApply.test.ts` | 13 | Template application cases; not an applied template in this runtime audit |
| `src/engine/__tests__/undo-redo-live.integration.test.ts` | 3 | Live engine undo/redo integration; not component-service or asset-service rollback |

Reproduce from `packages/editor` with `npx vitest run` followed by these eight paths; add `--reporter=json --outputFile=docs/audit-and-design-2026-10-16/evidence/targeted-tests.json` for the same report format. Full build, full unit suite, typecheck, database tests, visual parity and Playwright mutation suite were not run. No failing check was concealed by changing implementation or test expectations.

### 12.2 Runtime evidence and interpretation

| Evidence group | Actual coverage | Limits |
|---|---|---|
| `dashboard-*.snapshot/text/meta` | Workspace home/sites/media/agency and settings/ecosystem route navigation | Some initial captures precede hydrated content; retry files take precedence. No purchase/invite/config mutation |
| `site-*.snapshot/text/meta` | QA site's operational summary, stored-setting summaries, empty traffic/submission/share/domain/redirect views | No live domain, external visitor analytics or release validity proven; simulated URL observed |
| `editor-initial`, `editor-layers/pages/assets/content/brand` | Real saved site with two pages and 567 layer rows on Home; current UI and existing asset; CMS empty | This is a QA/performance fixture with repeated text, not a representative designed landing page; its content quality is not an editor defect |
| `inspector-heading-*`, `inspector-form`, `editor-view-menu` | Actual heading Style/Behaviour/Effects, form child list and server after-submit controls, view aids/breakpoint entry | No style/type/write actions performed; other element-specific states assessed in source, not all instantiated |
| `brand-*`, `settings-*` | Brand subview navigation and all core site-setting screens; record actual buttons/fields | No token/settings commits. `settings-billing-pro` is an unsuccessful selector capture, not Billing-door proof; dashboard Billing has separate evidence |
| `asset-library`, `asset-image-*`, `editor-templates`, `template-preview` | Existing library, image Crop/Adjust/Resize/Optimise tabs, gallery and template preview | No upload, image save, asset replacement or template application |
| `editor-history`, `history-saves/published`, `editor-review`, publish/AI captures | Session, saved/published history and empty review; publish readiness/gates and assistant entry where visible | Round mutations, restore/rollback, provider AI generation and deployment not invoked; capture contents, not filename, establish actual screen |
| `editor-preview`, `preview-mobile`, `preview-measurement.json` | Desktop labelled1320 measured1232 CSS pixels at host1280; sandbox `allow-same-origin` without scripts; mobile frame inspected | No interactive runtime/form playback claim |
| `editor-900`, `editor-390`, `settings-languages-900` | Host-width checks distinct from site breakpoints | 390 host had425 document width; no full responsive matrix or touch-device testing |

The browser's accessibility/text dump can include underlying mounted canvas and development-overlay controls behind a workspace. Screenshot plus visible container/selected-state checks are authoritative for what was actually on screen. Failed selector/timeouts and lazy-loading transitions are not automatically product bugs. Earlier incorrect menu/AI captures were not used as positive evidence for their filenames. Source and runtime evidence are intentionally not interchangeable.

### 12.3 Inaccessible and unreviewed states

All routes not opened are explicitly listed in the route ledger below. Within opened modules, these states remain **U at runtime**:

- Auth mutation and identity states: new signup, password reset, verification, OAuth callback/conflict, 2FA/backup codes/lockouts, CAPTCHA, suspicious-device handling, invite acceptance/decline/expiry, access removal, workspace creation/switch under another account. Route source/mutation/label inventory is [auth-onboarding-source-index.json](evidence/auth-onboarding-source-index.json); it is not provider testing.
- Onboarding/new-site completion, AI generation/job cancellation/retry, client creation, blank/template creation, quota exhaustion and entitlement unlock. Existing session was preserved rather than reset into onboarding.
- CMS populated record sheets/schema/reference/import/dynamic-routing/settings in the existing fixture: there are no collections. Their source and selected outbox tests were inspected. No collection or record was invented in saved user data to make screenshots look complete.
- Saved component detail/master/variants/instance propagation: fixture has zero saved components. Source defect analysis and proposed recovery are not runtime proof of loss or fix.
- Contextual types not fully opened in the runtime fixture: text-input/textarea/select/checkbox/switch/upload validation variants; link target variants; video/audio/SVG/icon/Lottie/map/provider embeds; countdown/progress/accordion/slider/tabs/navbar/gallery/table/list/columns; commerce product-specific states. Implemented control families and fallbacks were inventoried in M19–M22; individual combinations still require acceptance fixtures.
- Brand mutation/alias errors/deletion/restore, advanced token editors not individually exercised, imported legacy token formats, site-font uploads, asset bulk operations/revisions/replacement/stock-provider errors and large-image processing. Existing source contracts, not successful runtime commits.
- Populated review rounds, external reviewer/share tokens, password-protected public pages, signoff/email failure/revocation, detached-comment reattach and archived round comparison. No message/link was sent to another person.
- Failed save/offline/conflict/recovery/access-loss in actual browser, historical snapshot restore/time-travel commit, deployment rollback, export downloads/import/migration. Tests cover only the stated subset; no deliberate disruption of saved site was used.
- Billing checkout, invoices/provider failures, OAuth integration connection/disconnection, token use, webhook delivery, DNS/SSL provisioning, analytics ingestion, form submission/email routing, shared-theme push/rollback, client/site/workspace transfer, archive/delete/restore, support delivery, marketplace provider operation and checkout. No external side effects were triggered.
- Production collaboration, full ecommerce administration, non-default locale publication, Next/Vue export and external data connectors are not established supported workflows. Do not classify their absence as a regression or fabricate specifications to implement them in this task.
- Browser engines other than the audit Chromium, real touchscreen/screen-reader use, exhaustive keyboard/contrast/200%-zoom coverage, all error boundaries, all permission combinations, and production performance. Owner-like QA access does not validate other roles.

These are verification limits, not a request to stop the design or an assertion that the features are broken. The design covers their existing ownership and preservation requirements; release readiness requires the matching A-series tests in an isolated seeded environment.

### 12.4 Complete application route ledger

Every discovered Next `page.tsx` is listed below (route groups removed). **R** means a corresponding local URL was captured, sometimes only loading/empty state; it never means the entire workflow passed. **U** means not runtime-reviewed. Source pages were inventoried; specific behavior inspected is cited in the module sections. Dynamic token/record routes require valid isolated fixtures for deeper review.

<!-- ROUTE_LEDGER_START -->
| Route | Runtime | Limit |
|---|---|---|
| `/auth/2fa/backup` | U | Identity/session/error flow; existing login retained |
| `/auth/2fa` | U | Identity/session/error flow; existing login retained |
| `/auth/access-removed` | U | Identity/session/error flow; existing login retained |
| `/auth/account-unlocked` | U | Identity/session/error flow; existing login retained |
| `/auth/callback` | U | Identity/session/error flow; existing login retained |
| `/auth/change-email` | U | Identity/session/error flow; existing login retained |
| `/auth/check-inbox` | U | Identity/session/error flow; existing login retained |
| `/auth/device-alert` | U | Identity/session/error flow; existing login retained |
| `/auth/email-exists` | U | Identity/session/error flow; existing login retained |
| `/auth/error/2fa-locked` | U | Identity/session/error flow; existing login retained |
| `/auth/error/captcha` | U | Identity/session/error flow; existing login retained |
| `/auth/error/expired-link` | U | Identity/session/error flow; existing login retained |
| `/auth/error/invite-expired` | U | Identity/session/error flow; existing login retained |
| `/auth/error/locked` | U | Identity/session/error flow; existing login retained |
| `/auth/error/rate-limited` | U | Identity/session/error flow; existing login retained |
| `/auth/error/session-expired` | U | Identity/session/error flow; existing login retained |
| `/auth/error/social-error` | U | Identity/session/error flow; existing login retained |
| `/auth/error/suspicious` | U | Identity/session/error flow; existing login retained |
| `/auth/forgot-password` | U | Identity/session/error flow; existing login retained |
| `/auth/invite` | U | Identity/session/error flow; existing login retained |
| `/auth/join-workspace` | U | Identity/session/error flow; existing login retained |
| `/auth/login` | U | Identity/session/error flow; existing login retained |
| `/auth/magic-link` | U | Identity/session/error flow; existing login retained |
| `/auth/magic-link/sent` | U | Identity/session/error flow; existing login retained |
| `/auth/oauth-conflict` | U | Identity/session/error flow; existing login retained |
| `/auth` | U | Identity/session/error flow; existing login retained |
| `/auth/password-changed` | U | Identity/session/error flow; existing login retained |
| `/auth/redirect` | U | Identity/session/error flow; existing login retained |
| `/auth/reset-password` | U | Identity/session/error flow; existing login retained |
| `/auth/signup` | U | Identity/session/error flow; existing login retained |
| `/auth/verify-email` | U | Identity/session/error flow; existing login retained |
| `/auth/workspace-select` | U | Identity/session/error flow; existing login retained |
| `/auth/workspace-setup` | U | Identity/session/error flow; existing login retained |
| `/dashboard/activity` | R · [capture](evidence/dashboard-activity.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/agency/handover` | R · [capture](evidence/dashboard-agency-handover.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/agency/library` | R · [capture](evidence/dashboard-agency-library.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/agency` | R · [capture](evidence/dashboard-agency.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/agency/partner` | R · [capture](evidence/dashboard-agency-partner-settled.snapshot.txt) | Requested partner route redirected to /dashboard/agency; partner-specific UI unavailable |
| `/dashboard/agency/reviews` | R · [capture](evidence/dashboard-agency-reviews.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/agency/theme` | R · [capture](evidence/dashboard-agency-theme-settled.snapshot.txt) | Empty shared-theme state and site Following row; capture/push/rollback not executed |
| `/dashboard/agency/[id]` | U | Requires a valid client record fixture; static agency/theme is not client-detail evidence |
| `/dashboard/getting-started` | R · [capture](evidence/dashboard-getting-started-settled.snapshot.txt) | Checklist 3/5 completed; no setup action executed |
| `/dashboard/help/[slug]` | U | Requires a valid token/record fixture |
| `/dashboard/help` | R · [capture](evidence/dashboard-help.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/learn` | R · [capture](evidence/dashboard-learn.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/marketplace` | R · [capture](evidence/dashboard-marketplace.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/media` | R · [capture](evidence/dashboard-media.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/notifications` | R · [capture](evidence/dashboard-notifications.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard` | R · [capture](evidence/dashboard.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/projects` | R · [capture](evidence/dashboard-projects.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/resources` | R · [capture](evidence/dashboard-resources.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/account` | R · [capture](evidence/dashboard-settings-account.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/ai` | R · [capture](evidence/dashboard-settings-ai.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/api-tokens` | R · [capture](evidence/dashboard-settings-api-tokens.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/billing` | R · [capture](evidence/dashboard-settings-billing-settled.snapshot.txt) | Free-plan summary/usage captured; checkout and provider states unreviewed |
| `/dashboard/settings/danger` | R · [capture](evidence/dashboard-settings-danger.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/domains` | R · [capture](evidence/dashboard-settings-domains-settled.snapshot.txt) | Empty cross-site domain overview; connection/provisioning not executed |
| `/dashboard/settings/integrations` | R · [capture](evidence/dashboard-settings-integrations.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/integrations/vercel-team-picker` | U | No runtime capture |
| `/dashboard/settings/notifications` | R · [capture](evidence/dashboard-settings-notifications.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings` | R · [capture](evidence/dashboard-settings-settled.snapshot.txt) | Settings index captured; personal/workspace categories visible |
| `/dashboard/settings/plans` | R · [capture](evidence/dashboard-settings-plans.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/profile` | R · [capture](evidence/dashboard-settings-profile.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/security` | R · [capture](evidence/dashboard-settings-security.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/team` | R · [capture](evidence/dashboard-settings-team.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/usage` | R · [capture](evidence/dashboard-settings-usage.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/settings/workspace` | R · [capture](evidence/dashboard-settings-workspace.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/access` | R · [capture](evidence/site-access.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/analytics` | R · [capture](evidence/site-analytics.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/domains` | R · [capture](evidence/site-domains.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/feedback` | R · [capture](evidence/site-feedback.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]` | R · [capture](evidence/site-overview.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/publish` | U | Requires a valid token/record fixture |
| `/dashboard/sites/[id]/redirects` | R · [capture](evidence/site-redirects.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/seo` | R · [capture](evidence/site-seo.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/[id]/settings` | R · [capture](evidence/site-settings.snapshot.txt) | Screen/route only; mutations not run |
| `/dashboard/sites/new` | R · [capture](evidence/dashboard-sites-new-settled.snapshot.txt) | Name and Template/AI/Scratch chooser only; no site created |
| `/dashboard/templates/[id]` | U | Requires a valid token/record fixture |
| `/dashboard/templates` | R · [capture](evidence/dashboard-templates.snapshot.txt) | Screen/route only; mutations not run |
| `/dev/states` | U | Developer state gallery; not used as actual workflow evidence |
| `/edit/[siteId]` | R · [capture](evidence/editor-initial.snapshot.txt) | Screen/route only; mutations not run |
| `/maintenance` | U | No runtime capture |
| `/onboarding/ai/basics` | U | Creation flow; existing onboarding state retained |
| `/onboarding/ai/brand` | U | Creation flow; existing onboarding state retained |
| `/onboarding/ai/generating` | U | Creation flow; existing onboarding state retained |
| `/onboarding/ai/goal` | U | Creation flow; existing onboarding state retained |
| `/onboarding/ai/preview` | U | Creation flow; existing onboarding state retained |
| `/onboarding/blank` | U | Creation flow; existing onboarding state retained |
| `/onboarding` | U | Creation flow; existing onboarding state retained |
| `/onboarding/path` | U | Creation flow; existing onboarding state retained |
| `/onboarding/ready` | U | Creation flow; existing onboarding state retained |
| `/onboarding/site` | U | Creation flow; existing onboarding state retained |
| `/onboarding/template` | U | Creation flow; existing onboarding state retained |
| `/onboarding/template/preview` | U | Creation flow; existing onboarding state retained |
| `/onboarding/template/selected` | U | Creation flow; existing onboarding state retained |
| `/onboarding/workspace` | U | Creation flow; existing onboarding state retained |
| `/` | U | No runtime capture |
| `/privacy` | U | No runtime capture |
| `/review/[token]` | U | Requires a valid token/record fixture |
| `/share/[token]` | U | Requires a valid token/record fixture |
| `/terms` | U | No runtime capture |
| `/transfer/accept` | U | No runtime capture |
<!-- ROUTE_LEDGER_END -->


## 13. Independent specification review and delivery status

The invoked [office-hours skill](/Users/shahg/.codex/skills/gstack-office-hours/SKILL.md) requires an independent specification review. Two rounds examined completeness, consistency, clarity, scope and feasibility. Round 1 scored 8/10 and found four issues: a static agency route incorrectly counted as client-detail coverage; an incorrect submissions destination in the sketch; ambiguous queued-save/discard navigation; and an overbroad browser-unload guarantee. All four were corrected in the report, route ledger and sketch. Round 2 scored **9/10, PASS on all five dimensions**, with no remaining actionable contradiction. This is a review of internal design quality, not a substitute for the unperformed runtime acceptance tests. [Review metrics](evidence/spec-review.json).

The deliverable is the consolidated report, its supporting evidence and a static workflow sketch. Essential corrections, design extensions, polish and optional proposals are separated in the issue register and handoff sequence. No application source was edited, no deployment was made, and no saved-site content mutation was intentionally performed. Final tracked diff remains the pre-existing root CLAUDE.md change recorded at baseline. The locally started dashboard remains available on port 3000.
