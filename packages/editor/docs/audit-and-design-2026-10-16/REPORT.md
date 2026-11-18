# Buildrick: product audit and editing design specification

> **SUPERSEDED / historical — do not design from. Current specs: panels/00–25 + design-audit-2026-10-18.** *(R-1018, D1-6/D1-22; owner decisions 2026-10-18)*

> Superseded specifics *(R-1018)*: Inspector 320 (300–400) → 300 fixed (INS-D07); rail with Pages and Site settings in the site menu → BD-05/BD-14; keep 3 tabs → BD-08 four tabs; conditions in Data & variables → D13 (Inspector Content); "View submissions" per-form filter and upload field → Panel 10 / deferred (T4-13, T4-14); ARCH is not "the architecture decision" (D1-22).

Date: 2026-10-16. Mode: **AUDIT_AND_DESIGN**. Primary user: **designer / freelancer**, confirmed by the owner. Baseline commit: `19f964d5e7efda2c276a4c185782bb963da605ec`, branch `main`.

This document is a proposed design and frontend handoff, not an implementation claim. Application code and deployment are outside this task. Sections 1–13 were produced without Figma input, from current source, local application observations, selected existing tests, and explicitly identified official Webflow documentation. Historical comments in source are not design authority. **Latest scope: section 15 audits the existing Figma AS-IS page, now explicitly authorized by the owner, with existing capabilities only.** It supersedes the section 14 form-comparison feedback gate and narrows earlier redesign proposals; those proposals are not automatically accepted into an improved file. Start with [section 15](#15-existing-figma-as-is-audit--existing-capabilities-only) for the latest audit and [the visual evidence gallery](AS-IS-REVIEW.html).

**Latest design checkpoint:** Figma design only. The owner rejected the early detailed/grayscale studies as insufficient redesign; pages03/04 now say NOT ACCEPTED. The [architecture decision and preservation map](ARCHITECTURE-DECISION.md) documents three structural alternatives and source-review corrections. The [new architecture page](https://www.figma.com/design/6yvgev9dRXrSLPluWkjDoz?node-id=28-1520) contains six native static wireframes, not a completed editor or verified interactive prototype. The [staged improvement plan](IMPROVEMENT-PLAN.md) remains the broader work inventory; historical audit-stage statements about no new file describe earlier checkpoints.

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

**Evidence/problem.** Saved component insertion/management, variants, instance propagation and override handling exist. `ComponentDetailScreen` updates a master by promoting the current canvas selection. `ComponentManager.applyMaster` saves a new master/version and synchronizes instances; `ComponentInstances.syncInstance` retains compatible overrides and drops incompatible ones. `snapshotComponent` captures instance records, including override maps, but the update Undo action passes only the prior master tree and does not restore those captured instance records. Per-instance rollback exists; full-operation recovery is not established. This is a source-backed recovery risk, not a destructive runtime experiment.

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


## 14. Plan design review, in progress

**Superseded next-step gate:** the owner subsequently requested an audit of the existing AS-IS Figma design first, with no extra capabilities. Section 15 is the active scope. The raster form board below is unapproved exploration, not a baseline or a prerequisite for the AS-IS audit. The earlier no-Figma constraint applied to this review stage; the later explicit request authorizes Figma reads for section 15. No improved file has been created.

Invoked `plan-design-review` on 2026-10-16; owner confirmed **all seven passes equally**. This reviews and improves the same specification. It authorizes no application changes, deployment, paid product scope, capability removal or Figma dependency. The earlier 9/10 score evaluated report consistency; the initial **design-completeness score is 7.5/10** under the broader visual/interaction rubric. No final review score or visual approval is claimed yet.

### System audit and initial findings

Baseline HEAD remains `19f964d5e`. Branch/base for this local document review is `main` (no PR comparison required). Root DESIGN.md exists. Current code tokens, `chrome-ui`, editor AGENTS.md and relevant root conventions were inspected; historical Figma material and linked Figma artifacts were excluded. Root TODOS.md contains prior work on save honesty, issue-message quality, onboarding preview and browser coverage. Those older entries are leads, not current defect evidence; this review does not append duplicates or change their status without checking implementation. The gstack review reader reported `NO_REVIEWS`; section13's independent office-hours assessment remains recorded locally and is not an engineering signoff.

| Finding | Evidence | Required design improvement / current status |
|---|---|---|
| DPR01: Inspector sizing does not yet prove whole-workspace fit | P1 proposes300–400px Inspector,260–360px drawer; existing tokens define300/280; sketch uses320/240 | Compare fixed inspector, resizable inspector and bounded field-detail surface with the same content. Record horizontal and short-height budgets before selecting a direction. Open visual choice |
| DPR02: Sketch is not token-faithful | `workflow-sketch.html` uses system-ui, #1955dd and one-off neutral colours; generated tokens use Inter/Geist Mono and #1A56DB | Treat original sketch as structural only. New proposals use stated product typography/accent; final handoff must name actual tokens/primitives. No global token migration is authorized |
| DPR03: Source/document design contradiction | DESIGN.md limits editor text to#334155, while `tokens.generated.css:79` defines `--bk-ink:#111827`; root docs also contain superseded shortcut/layout sections | Record actual versus intended values. Preserve live application tokens in implementation until reconciled; do not claim both sources agree or silently recolour all chrome. No Figma needed |
| DPR04: Responsive fallback can be mistaken for mobile product support | Root CLAUDE.md states desktop-only; M37 explicitly proposes limited narrow sheets;390px runtime capture has overflow | Specify narrow desktop/browser-zoom recovery without promising full phone authoring or removing reachable capabilities. Mark mobile product support as unapproved scope |
| DPR05: State vocabulary needs visible copy and clear persistence owners | S1 names states but many module paragraphs do not define exact message/action presentation; `useSaveCallback.ts:270–305`, `SaveStatus.tsx`, CMS outbox are distinct | Add module-family state tables. Dashboard document failure must not borrow CMS queued-sync success. Recovery snapshot is not server save or automatic synchronization |
| DPR06: Keyboard and hierarchy need task-level detail | A0/M37 are general; Layers, virtualized lists, inspector field focus, resizing and async announcements need specific contracts | Define focus entry/return, non-drag operation paths, live-region ownership and state priority. Preserve compact desktop rows; do not mislabel44px as WCAG AA's universal minimum |

### What already exists and should be reused

- Editor chrome: `PanelHeader`, `Toolbar`, `Footer`, `FieldRow`, `FormField`, `Select`, `TextInput`, `EmptyState`, `Skeleton`, `SaveStatus`, `Modal`, `ConfirmDialog`, `BreakpointSwitcher`, portal/focus primitives and the single Escape/action registries. Use these through `chrome-ui`; do not add a parallel UI kit.
- Tokens: `--bk-font-ui`, `--bk-font-mono`, `--bk-accent`, `--bk-bg-panel`, `--bk-border`, existing semantic text roles, spacing/radius/type scales, topbar56, rail60, drawer280, Inspector300. Proposed320 is not an existing approved default. Auth/dashboard/site-output styling retain their separate scopes.
- Dedicated workspaces and M01–M38 capability/owner map remain the baseline. No new module inventory is created by this review.

### Scope exclusions for this review

Application implementation/deploy; new Webflow feature parity; new global style/class engine; changing user data or role entitlements; Figma references or token regeneration; declaring mobile-authoring support; publishing/testing external delivery on the saved QA site. Mockups depict hypothetical content and are not runtime evidence.

### Review progress and visual decision

Initial image generation produced three comparison sheets with all alternatives repeated inside each image. Those are retained as rejected exploration, not approved design references. A second generation produced one screen per alternative. Automated visual checks passed A and rejected B/C geometry after one automatic retry each. These image checks do not establish pixel-accurate sizing or product behavior. The original single-screen A/B/C comparison board stays stable for feedback; later B-2/C-2 outputs are retained as rejected dimension checks, not silently substituted while the owner reviews. All images remain unapproved. Compare the same form task: **A** existing300px inspector with stacked long controls; **B** resizable320px inspector with persistent context; **C** existing inspector plus bounded field-detail sheet. The comparison is about workspace composition, not adding form capabilities.

All seven passes remain to be finalized: information architecture, state coverage, journey, visual specificity, design-system alignment, responsive/accessibility, unresolved decisions. Clear specification corrections can proceed without additional permission. A real choice between the alternative editing compositions will be recorded from the owner's visual feedback; absence of feedback is not approval. No root TODOS.md changes or final review-readiness claims have been made.

**Live comparison board:** [Inspector composition review](http://127.0.0.1:53554/boards/b-20261015-211313-oocoqq/). Persistent local [board artifact](/Users/shahg/.gstack/projects/v2:aamirtauqir-buildrik/designs/plan-review-form-20261016/single-screens/design-board.html). Initial recommendation: A's compact composition with explicit persistent context and separate document/form-server status; this is not a user decision yet. The canvas budget and control-preservation contracts take precedence over all raster images. The board shows only this representative form task, not visual coverage of all38 modules.

**Additional source clarification:** `src/services/unsavedRecovery.ts:93` makes best-effort localStorage recovery snapshots and swallows storage/quota failures. This is not the CMS durable synchronization queue and cannot justify “saved on this device and will sync” for dashboard document edits. `StudioHeader.tsx:688–782` owns save announcements; preserve its single announcement pipeline rather than adding an aria-live region to every status chip.

**Reference checks for the accessibility pass:** W3C's [target-size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) describes24×24 CSS pixels with specified exceptions at AA;44px is a stronger design target, not that criterion's blanket threshold. [Tree view keyboard guidance](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) distinguishes focus from selection. [Focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) informs sticky-header/footer and overlay checks. These are reference inputs for the pending review, not claims of application conformance.


## 15. Existing Figma AS-IS audit — existing capabilities only

**Decision: improve the existing editor through a separately traceable design, after this audit; do not treat any earlier TO-BE page or generated alternative as approved.** The owner supplied the Buildrick file link and asked for the AS-IS design to be audited first. Original Figma nodes, application code, saved project content and deployment were not modified. This section is an audit and constrained correction brief, not a newly completed redesign.

### 15.1 Actual baseline and coverage

- Confirmed file: [Buildrick, supplied Foundations link](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=0-1). Audit page: [01 — EXISTING APPLICATION / AS-IS, 8280:2](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8280-2).
- Direct page lookup found **200 top-level frames: 99 numbered application screens, 99 evidence notes, one index, one audit-annotation board**. The initial unscoped metadata response showed only Foundations; it was not a complete page inventory.
- All 99 screen subtrees were structurally inspected. **Zero component instances, component definitions, Auto Layout descendants and prototype reactions** were returned within those subtrees; all 99 root layouts are NONE. This describes this AS-IS reconstruction, not the rest of the file, the product's saved components, or its React architecture. No claim about variable bindings or published libraries is made.
- **95 fresh screenshots were captured and reviewed at overview scale** in 16 contact sheets. Sixteen also received full-frame inspection: 02, 06, 10, 22, 25, 43, 59, 66, 68, 72, 80, 83, 87, 90, 94, 97. Overview review is not a pixel-by-pixel or interaction test. The four missing fresh captures are **95, 96, 98, 99**, blocked by the connector's tool-call limit. Their names, dimensions and structural counts were read, but no fresh visual pass is claimed.
- Frames are 1280×720 or 1440×900. Mobile examples 31, 79 and 97 show a mobile *authored page inside a desktop editor*, not a phone-sized editor.
- The Figma captures show the historical “Master audit 1010 disposable” fixture, with three pages, CMS content and saved component examples. The current local baseline is the existing “s0-qa site” fixture from section 1. Different content/counts are not regressions.
- Current HEAD remains the baseline in section 1. The local server had stopped; it was restarted through the existing dashboard dev script. The existing local QA login was reused without printing credentials. A fresh read-only [runtime recheck](evidence/figma-as-is-runtime-recheck.snapshot.txt) reached the editor at 1280×720, scroll width 1280. It shows 53 Add elements, 8 blocks, 14 built-in components and no saved components in this fixture. It does not replay all 95 historical states or verify mutations.
- Earlier same-task runtime captures of [Brand](evidence/editor-brand.png), [Publish](evidence/editor-publish.png), [Form](evidence/inspector-form.png) and [CMS](evidence/editor-content.png) were compared with corresponding Figma families. The historical first-ten fidelity report documents reconstructed text wrapping and placeholder-tone differences; these prevent treating every Figma rendering defect as an application defect.
- Evidence: [inventory](evidence/figma-as-is-inventory.json), [all-screen structural results](evidence/figma-as-is-structure.json), [capture manifest with hashes](evidence/figma-as-is-captures.json), [visual gallery](AS-IS-REVIEW.html). No new application tests were run in this stage. Section 12's 64 passing test cases retain their original limited scope.

**Scope rule for the next design:** each visible action must map to a current capability ID, executable source and old entry point. A Figma button alone does not prove implementation. An existing code path alone does not prove reachability. Unknowns remain unknown. Do not add class-authoring, production multiplayer, commerce administration, external data connectors, new AI abilities, new export formats, or multilingual publishing because a competitor supports them. Do not remove existing supported controls simply because they are not drawn in these 99 screenshots.

### 15.2 Module review and preservation map

The existing M01–M38 inventory remains canonical. This table maps the Figma screen families to it; the final ledger gives every exact node. “Keep/regroup” below is a recommendation for a later improved file, not an implemented change.

| Existing module / frames | What this design actually represents | Audit decision, owner and preserved task |
|---|---|---|
| Shell, selection and commands: 02–06, 17, 24, 35–40, 77–82, 97; M10–19/M37 | Rail, page tabs, canvas, contextual inspector, menus, shortcut dialog, multi-selection, lock and responsive views | Keep direct manipulation and contextual inspector. Regroup scope indicators and correct space budgets. Shell owns navigation; document/selection owns edits. Preserve menu actions, keyboard entry and supported advanced controls |
| Add and saved library: 06–07, 29; M12/M23 | Searchable catalog, sections/counts, saved components and manager empty state | Keep creation versus management distinction. Preserve supported catalog/types, favourites/recent/library entries. Empty saved library is fixture state, not feature absence |
| Layers: 04, 80–81, 97; M13 | Tree search, selected rows, multi-selection, lock, wide view | Keep structure navigator; preserve hidden/locked state and names. Wide view needs an explicit canvas tradeoff, not a silently larger default |
| Pages: 05, 32–33, 40–43, 84–85; M14–15 | Page list/actions, root inspector, creation, SEO/Social/Advanced modal, empty page | Keep page metadata separate from selected-element styling and site defaults. Preserve page IDs, folders, slug, home page, duplicate and template entry. Correct “Live” wording without changing visibility data |
| Templates: 27–28, 98–99; M16 | Gallery/detail, Create page versus Replace page; historical applied/guard states | Keep dedicated template workspace and two distinct actions. Preserve replacement confirmation/backup semantics. 98–99 require fresh visual verification; no automatic layout replacement |
| Inspector style and type-specific content: 02, 36–40, 80–83, 97; M17–21 | Heading, image, container, form, mixed and locked states | Keep Style/Behaviour/Effects and current supported value types, units, reset/inheritance semantics. A collapsed section or missing screenshot is not permission to delete its controls |
| Forms: 83, 94, 50; M20/M35 | Canvas form layout; Fields/After submit; separate submissions screen | Keep field tree in contextual inspector and submissions in site settings. Correct placeholder/type semantics. Keep server form settings separate from document Undo. No new form product or label-authoring operation is assumed |
| Effects/interactions/bindings: 38–39, 92–93; M18/M22/M28 | CMS source choice, visibility, triggers, classes and attributes, effects categories | Keep contextual target, current presets/triggers, CSS values and bindings. Trigger chooser is not a complete interaction flow. Do not invent a timeline or make incomplete class tools appear fully functional |
| Components: 07, 29, 86–91; M23 | Create from selection, library, instance/variant, reset/detach, expanded manager, master detail, return | Keep existing selection-to-master update and manager/detail operations. Clarify master versus instance scope. Earlier proposed dedicated master workspace is outside this strict AS-IS improvement baseline |
| Assets/media: 08–09, 70–73, 95; M24–25 | Quick chooser, full library, metadata, actions and Crop dialog; image chooser structure | Keep picker assignment distinct from asset management. Preserve current Crop/Adjust/Resize/Optimise behavior and version boundaries. Version save must not imply all usages changed. 95 fresh visual unavailable |
| CMS/data: 10–12, 66–69, 92; M26–28 | Collection/record/field views, local draft controls, dynamic page config, collection settings, binding | Keep dedicated workspace. Collections own records/schema; routing config owns dynamic pages; inspector owns element binding. Sources/Variables/Conditions remain present; their deeper screens are not covered by this AS-IS set |
| Brand: 13–16, 58–65, 96; M29 | Colours/modes, fonts/type, spacing, styles, component styles, classes, presets, checks, starters and import/export | Keep dedicated global-resource workspace. Fix header fit; retain apply-local versus edit-global distinction and token references. Do not convert class copy into a promise of a new visual CSS engine. 96 fresh visual unavailable |
| AI: 26; M30 | Selected-heading entry and prompt suggestions | Preserve selection scope and return to inspector. This frame does not establish run/review/error/quota/undo states or successful provider execution |
| Preview, publish and export: 25, 30–31, 34, 43; M31–32/M36 | Preview devices, sharing entry, deployment checks/targets, export dialog, page visibility | Keep these separate. A saved draft, preview, page inclusion setting and successful deployment are different states. Preserve supported formats and disabled/Soon gates |
| Review/history/diagnostics: 01, 19–23, 74–76; M33–34 | Empty review, session/saved/published history, compare/menu, notifications, issues, activity | Keep existing ownership and navigation. Empty review cannot specify populated rounds/replies. Session Undo, saved restore and deployed history must remain distinct |
| Site settings and workspace doors: 18, 44–57; M35/M06–07 | General, overview, SEO, redirects, domains, access, analytics, submissions, languages, code, headers, danger, workspace doors | Keep canonical site settings and explicit workspace handoffs. Do not duplicate billing/team/integrations inside the site or turn gated capabilities on |
| Outside this AS-IS page: M01–09 and wider M36–38 branches | Auth/onboarding/dashboard/agency/support and numerous error, delivery, migration, commerce/collaboration branches are not a complete Figma screen set here | Retain section 12's runtime/source gaps. Do not call this page a complete whole-product design or infer missing frames mean absent features |

### 15.3 Evidence-backed issue register

Priority **E** means essential for a credible improvement; **P** means visual polish. **F** is observed in Figma, **R** is earlier/current runtime observation, **S** is current source; **U** identifies unverified behavior. These identifiers extend, rather than replace, section 10.

| ID / priority | Evidence and user problem | Canonical owner, scope and smallest appropriate correction | Acceptance / remaining limit |
|---|---|---|---|
| FA01 E — capture library is not a handoff system | F: all 99 screen subtrees have zero instances/Auto Layout/reactions. Fixed snapshots cannot establish resizing or control transitions | Design artifact only. Preserve original captures; build reusable chrome/control components in a future separate file, tracing every instance to existing controls. Add state annotations/prototype paths for existing flows | Existing control inventory maps one-to-one; resize/long-label/state examples retain controls. No claim that original product components or navigation are absent |
| FA02 E — expanded drawer consumes the editing context | F: 89–94/97 reserve approximately 60+700+300px at 1440px; only 380px center remains before gutters. S: LeftSidebar.tsx:282–287,407–410 explicitly supports 700px expansion | Shell/panel geometry, C3 presentation change. Keep wide-view capability; revise its composition/return so ordinary editing can recover usable canvas. 700px is an expanded state, **not the default**. Do not infer accidental persistence from captures alone | Normal and expanded views at 1280/1440/short height; selection/breakpoint/zoom/document unchanged by chrome resize. No loss of expand or close action. Proposed fit rules below require design validation |
| FA03 E — issue/publish explanations compete with actions | F: 22 and 25 visibly clip long reasons; 25 has Fix links competing on the same line. R: current Publish also truncates explanations, although its Fix links are separated more clearly | Diagnostics/release panels; redesign rows within existing width. Status/title first; wrapping reason second; explicit existing Fix/Connect action in its own slot | Long messages visible through wrapping/disclosure; action keyboard reachable; Fix targets exact object/settings and returns to originating check. No invented checks, provider or publish success |
| FA04 P — Brand actions wrap inside short controls | F: 13–16/59–60, full-frame59. R: editor-brand.png shows Review changes/count and Restore points broken across lines | Brand header; regroup/resize existing buttons, not new navigation. Allow action group its own row when needed; reuse current tokens | At 1280 and1440 all labels/counts stay inside button bounds; long site/token names do not displace primary action. No token/data migration |
| FA05 E — CMS starting context is displaced to the side | F: 66 places Select a collection in right column with blank center. R: current empty collection state similarly leaves center blank | CMS workspace; regroup existing empty-state instruction/action into main content, retaining collection navigation and Sources/Variables/Conditions | Zero collections: existing Create action visible centrally; existing collection unselected: prompt to select, not fabricated records. Error/loading must not become empty. No automatic creation/selection mutation |
| FA06 E — form field semantics and preservation | S: FormFieldsSection.tsx:42–51,66–78,107–120,172–184. Label writes placeholder; select defaults to text; textarea conversion replaces node using five attributes | Form field editor/engine. Rename existing control Placeholder; represent actual select type. **Do not add real label authoring** without a verified supported path. Preserve data on allowed conversion | Name/placeholder edit independent; select retains options. Replacement-path conversion preserves IDs/style/classes/bindings/unknown fields or is refused. Existing six tests do not establish this. F83/94 show context, not the replacement bug itself |
| FA07 E — master/instance distinction and incomplete update Undo | F: 87/90/91 show instance inspector alongside master-detail operations. S: snapshotComponent captures instances, but update Undo passes only old masterTree; sync filters dropped overrides | M23 existing master-detail/update operation. Keep selection source and name target master/affected instances explicitly; preserve separate Back to instance/All saved components destinations. Engineering recovery correction required | Compatible update and cancelled update preserve maps; incompatible change discloses losses before commit; Undo restores captured instance state. Per-instance rollback exists; full-operation recovery remains unverified. Do not depict a new standalone master editor as existing |
| FA08 E — some CMS drafts escape the shared guard | S: DynamicPagesPane.tsx:32–75; CollectionSettingsPane.tsx:32–49; CmsWorkspace.tsx:309–314 and cmsWorkspaceStore.ts:57–68. F68/69 locate the surfaces | CMS draft owner/shell dirty registry. Extend existing guarded-navigation pattern to these panes; retain RecordSheet's existing guard | Tab/collection/workspace/back exit with edits offers Keep editing / Discard and leave, following RecordSheet.tsx:725–747. Save remains a separate action before retrying navigation; failed save retains values. Record editing is not universally unguarded. No new storage subsystem is proposed |
| FA09 E — save/generation wording exceeds verified outcome | S: DynamicPagesPane.tsx:85–96,228–232; CollectionManager.ts:171–175; useCmsSync.ts:163–188. Generate N pages label configures next publish; success description already mentions that. Local save precedes server mirror | CMS config/synchronization/release owners. Clarify action and status using actual acknowledgement; preserve current queue/error mechanisms | No immediate-generation claim before publish; refused sync cannot stay server-saved; retained draft/retry follows existing service. Do not claim CMS has no sync/error reporting |
| FA10 E — page visibility looks like deployment status | F43 says Live and Page is publicly accessible. S/R: prior I07–09 establish visibility/publish truth distinctions and simulated deployment issue | Page metadata versus publish owner. Change wording to inclusion/visibility on next publish; deployment status comes from actual release result | Unpublished page never presented as publicly live from visibility alone. Preserve stored visibility/index/follow/head-code values; Cancel does not publish. Simulation must not display real live success |
| FA11 E — device/state/zoom information is split | F78/97: breakpoint via View menu, authored width375 and canvas zoom61%, inspector State:Base plus Mobile badge. Existing responsive indicators are present, not absent | Shell viewport and inspector style scope. Regroup the **existing** indicators so selected breakpoint and pseudo-state remain understandable; retain custom width and zoom | Desktop→Mobile→Base/Hover/reset changes only intended scope; chrome fit never creates breakpoint values. No multi-canvas or phone-editor product added |
| FA12 E — library presence is mistaken for implemented parity | F34 includes Soon exports; F51 explicitly limits multilingual publishing; F61 class copy promises shared rules. Current source has partial/gated capabilities (M29/M38) | Each owning module. Preserve real gates/limitations and correct overpromising copy; never fill visual empty space with a competitor feature | Every actionable control has a current handler/permission/data contract. Unsupported entries remain disclosed/gated. Asset uploads, deliveries, provider runs and production publish not executed for this audit |
| FA13 E — incomplete workflow evidence | F has zero prototype reactions, an empty Review state and only a trigger chooser. Four fresh screenshots unavailable; many errors/details absent | Design coverage/QA, not an app feature. Document missing existing states and required transitions in the future file | No “complete editor redesign” claim until control-level coverage and state/return paths are supplied. Static screenshots cannot certify keyboard, save/reopen, Undo or permissions |

### 15.4 Existing-workflow contracts for the improvement handoff

These contracts constrain a future design. They are not newly verified runtime behavior. Existing detailed controls and acceptance IDs in sections 4–12 remain useful where consistent with the stricter scope above.

| Workflow / exact entry and owner | Edit / feedback / return contract | Persistence, recovery and state boundary |
|---|---|---|
| Select element → Inspector Style/Behaviour/Effects (02/36–39/80–83/97) | Preserve selected IDs, page, tab, breakpoint and pseudo-state; show mixed/locked/inherited values rather than substituting zero. Close temporary detail returns focus to initiating control | UI tab/collapse/resize changes create no authored mutation/Undo step. Valid value edits use existing transaction path. Keep units/reset/custom values; invalid draft does not overwrite previous valid value |
| Form → Behaviour → Fields → existing field detail (94) | Field name/type/required/placeholder refer to actual child. Rename misleading Label only. After submit retains supported choices and separate destination scope | Document field edits use document Undo. Existing site form settings already say they save immediately and are outside Undo; preserve that boundary and admin restriction. Show pending/failure based on actual service; no fictional universal Undo |
| Component instance → existing Edit master/detail (87–91) | Show current selected source and target master; preserve Update from selection, insert, duplicate, detach and delete. Back to instance restores that page/selection; All saved components returns library/filter | Do not add a direct master-canvas editor. Complete Undo restoration is an engineering dependency FA07, not a solved design state. Failure must not silently report all instances updated |
| CMS → collection → Records/Fields/current overflow destination (10–12/67–69) | Preserve collection/record/field IDs and each existing edit owner. Back to Fields selects the original field. Unsaved routing/collection settings use same guarded exit principle as existing record editing | Local draft, local persistence, pending mirror, server confirmation and publish generation remain separate. Existing collection deletion's irreversible boundary must be shown honestly; no canvas Undo promise |
| Assets quick chooser → Manage assets, or Image → Choose image (08–09/70–73/95) | Manager selects/manages resources; property picker assigns to the originating property. Cancel returns with previous source. Edit image retains all four tabs and current draft | Save version creates asset revision; applying it to usages is separate. Preserve existing failed-encoding/save retry; do not apply on mere tile selection. Frame95 visual verification still required |
| Brand → token/style → current change/apply flow (13–16/58–65/96) | Keep global owner, usage information, modes, reset and existing preview. Return to same element/property from a contextual picker | Changing shared value and assigning its reference locally are different transactions. Preserve token IDs and unknown legacy values; do not hard-code copied visual values into bindings |
| Page → Page settings SEO/Social/Advanced (32/40–43/85) | Modal names page; exact current tab; Cancel/Done and focus return to originating row/control. Page overrides link conceptually to site defaults, not competing values | Existing page metadata is retained. Changing visibility is not deploying. Cancel/discard behavior must follow actual draft implementation; no new save policy inferred from Figma labels |
| Issues or Publish → existing Fix/Connect (22/25) | Exact selected image/page/setting, then return to originating diagnostics with check status refreshed. Full reason readable without obscuring action | Navigating to a fix does not publish. Existing pending-save, provider, role and approval gates remain enforced. Retry/status reflects existing job, not invented duplicate deployment |
| Preview → device/page → Back to canvas (30–31) | Preserve page and prior selection/zoom/context when returning. Display actual authored viewport separately from editor viewport | Preview does not save/publish; static sandbox limitations remain disclosed. Accurate desktop width is existing I08 correction, not a new interactive preview engine |
| Templates → preview → Create page or Replace current page (27–28/98–99) | Keep separate actions, explicit target page and existing replacement guard. Cancel returns to preview and leaves page intact | Backup/recovery must match existing implementation. 98 is historically an applied result, not evidence of a confirmation dialog; fresh98/99 verification pending |
| History → Session/Saves/Published → existing action (19–20/74–76) | Keep list/filter/version identity, preview/compare/restore and return. Review empty state (01) retains Send for review entry but does not invent a populated conversation | Session history, saved snapshot recovery and published-release history are separate. Long version names remain discoverable; restore compatibility and delivery states require runtime checks |
| Site settings → workspace Members/Billing/Integrations door (55–57) | State workspace scope; keep exact existing external destination and safe return. Site editing draft must resolve before leaving | Keep role/plan restrictions; no parallel site billing store. No invitations, purchases or webhook calls were made |
| Advanced/hidden supported controls | Preserve section-order registry, contextual capabilities, menus, keyboard actions and applicable collapsed values from current implementation | Before handoff, enumerate any controls omitted by screenshots. Screen count alone cannot prove control-level preservation |

**State requirement for every affected existing control:** normal, focused, populated/empty, disabled/permission-gated, invalid, loading/pending, success, failure/retry and cancel/return must be specified *where the operation supports them*. Use not-applicable with a reason instead of inventing unnecessary backend states. Preserve label, value source, units, validation, commit trigger, scope, history owner, keyboard entry and focus return. The Figma AS-IS page alone does not supply this contract.

### 15.5 Panel decisions and geometry boundary

Use current code tokens as the baseline: topbar56, rail60, drawer280 and inspector300. The expanded drawer is700 in current source. On a 1440px host, a normal simultaneous rail/drawer/inspector leaves **800px center**; the expanded combination leaves **380px**. At1280 these are640px and220px. Canvas gutters/zoom reduce visible authored area further. These are workspace budgets, not authored breakpoints.

| Surface | Retain / change recommendation | Future fit/scroll/return specification to validate |
|---|---|---|
| Standard canvas, rail, left drawer, inspector | Keep existing ownership and 280/300 starting defaults; do not widen every panel | Topbar/page context and panel context headers remain available; panel body scrolls independently of canvas. Long controls stack rather than shrink labels. Restore original widths/context on leaving temporary expanded work |
| Existing 700px expanded drawer | Retain wide-view capability, redesign its composition | Compare a bounded expanded drawer with a temporary focus view of the **same existing task**. No invented new editor. Candidate limit: protect at least480px center while canvas work is active, giving drawer cap440 at1280 and600 at1440 with60rail/300inspector. This limit is a proposal, not approved production geometry; full700 can be retained where a temporary task composition intentionally gives it space |
| Issue/Publish panels | Keep existing right-side ownership; redesign text/action rows before considering added width | Title/status, wrapping explanation and action occupy predictable slots; footer/action stays visible with scrollable checks. Test300px at720px host height and longer content |
| Forms/contextual controls | Keep inspector and existing field-detail interaction | Stack long message/destination fields within existing surface; do not replace form editing with the unapproved generated form workspace. Preserve neighbouring controls, scroll and selection |
| Component library/detail | Keep existing manager/detail/instance relationship | Separate source instance context from global actions; wide view must not hide the source selection needed by Update from selection. Exact alternative composition remains a later design decision |
| CMS, Brand, Media, Templates, Settings | Keep existing dedicated workspaces | Main content owns its scrolling; contextual detail owns only its own scroll. Fix empty-state placement and header fit. Return to actual prior canvas context; preserve existing toolbar/footer ownership |
| Page settings and image editor dialogs | Keep bounded dialogs | Header/context and commit/cancel footer remain reachable; body scrolls at short height. Preserve tabs/drafts; show target page/asset. Do not interpret clipped static reconstruction as proof a runtime action is unreachable |
| Narrow desktop / browser zoom | Respect desktop-first existing product scope | Preserve access through supported collapse/overlay behavior and test keyboard reachability. Phone authoring is not newly promised. Mobile authored page still uses existing breakpoint data |

Essential changes are FA02/03/05–13 and truthful scope/state representation. Visual polish is FA04 plus consistent spacing/type/icon alignment using existing tokens. Creating a reusable Figma component library is necessary design-artifact work for maintainability (FA01), not a new user-facing feature. Arbitrary new panels, a class-first engine, dedicated master authoring, new AI/ecommerce features and automatic migrations remain outside this requested baseline.

### 15.6 Separate improved-file brief and readiness

A separate improved file is a suitable next deliverable, preserving the original as an immutable comparison reference. **No new Figma file or page was created in this audit.** The improved file should contain: baseline index linked to these99 nodes; reused tokens/control components; improved versions of existing screen families; existing-flow state/return examples; and a preservation ledger. Its labels should distinguish observed AS-IS, proposed correction, engineering dependency and unavailable evidence.

For each improved screen require:
1. Original frame ID + M-module/capability IDs + current source/entry.
2. Explicit list of retained, relocated and clarified controls; no unmapped new action.
3. Current versus proposed dimensions, scroll ownership and canvas budget.
4. Existing workflow's entry, target, normal/error/cancel/return and permissions.
5. Persistence/Undo owner and engineering dependency where current behavior is deficient.
6. Side-by-side comparison at matching host viewport and authored breakpoint, plus long-content/short-height check.
7. Acceptance checks from this section and sections4–12, adjusted to exclude superseded expansion proposals.

**This audit is PARTIALLY VERIFIED:** 99 structural inspections, 95 overview visual reviews, 16 full-frame visual reviews, selective source corroboration and a local runtime accessibility recheck. It is not DESIGN READY or IMPLEMENTATION VERIFIED. The four blocked fresh screenshots, unrepresented state branches, current-versus-historical pixel fidelity, keyboard behavior, mutation/save/reopen and complete recovery remain explicit gaps. Existing tests were not rerun because no application code changed. The independent reviewer checked the source interpretation of forms, component recovery and CMS drafts; final document review is recorded below.

**Unreviewed/inaccessible:** fresh visual95/96/98/99 (connector limit); all99 interactive Figma workflows (no reactions, no playback claim); other Figma pages/libraries for whole-file design-system quality; offscreen controls and alternate states not represented by these frames; populated review rounds/provider AI/deployment/delivery/asset mutation and destructive operations; deeper Sources/Variables/Conditions and most contextual widget detail screens absent from this page; dashboard/auth/onboarding/etc outside this page. Section12 retains its 60 runtime-unreviewed routes. None of these are silently counted as passed.

### 15.7 Screen-by-screen coverage ledger

S = live structural inspection. V = fresh overview visual review. D = additional full-frame inspection. U = fresh visual unavailable. Screens link directly to original Figma nodes; local images are read-only evidence. No screen is claimed interaction-tested from these captures.


| # | Original screen | Module family | Host size | Reviewed | Evidence / gap |
|---|---|---|---|---|---|
| 01 | [Review / empty · 1280](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8281-2) | Review | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/01.png) |
| 02 | [Heading / Style](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-2) | Canvas and inspector | 1280×720 | S; V, D | [Capture](evidence/figma-as-is-screens/02.png) |
| 03 | [Selected element actions](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-299) | Canvas and inspector | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/03.png) |
| 04 | [Layers](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-610) | Layers | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/04.png) |
| 05 | [Pages](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-935) | Pages | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/05.png) |
| 06 | [Add catalog](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-1249) | Add and components | 1280×720 | S; V, D | [Capture](evidence/figma-as-is-screens/06.png) |
| 07 | [Saved components](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-1654) | Add and components | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/07.png) |
| 08 | [Assets quick chooser](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-1998) | Assets | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/08.png) |
| 09 | [Full Media](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-2325) | Assets | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/09.png) |
| 10 | [CMS records](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8283-2523) | CMS | 1280×720 | S; V, D | [Capture](evidence/figma-as-is-screens/10.png) |
| 11 | [CMS record / draft](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-2) | CMS | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/11.png) |
| 12 | [CMS fields](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-272) | CMS | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/12.png) |
| 13 | [Brand / colors](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-511) | Brand | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/13.png) |
| 14 | [Brand color picker](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-733) | Brand | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/14.png) |
| 15 | [Brand typography](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-985) | Brand | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/15.png) |
| 16 | [Brand spacing](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-1160) | Brand | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/16.png) |
| 17 | [Site menu](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-1357) | Shell and diagnostics | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/17.png) |
| 18 | [Settings / General](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8286-1613) | Settings | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/18.png) |
| 19 | [History / Session](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-2) | History | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/19.png) |
| 20 | [History / Saves](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-178) | History | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/20.png) |
| 21 | [Notifications / empty](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-364) | Shell and diagnostics | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/21.png) |
| 22 | [Issues / six warnings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-660) | Shell and diagnostics | 1280×720 | S; V, D | [Capture](evidence/figma-as-is-screens/22.png) |
| 23 | [Activity / event](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-862) | Shell and diagnostics | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/23.png) |
| 24 | [Command palette](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1033) | Shell and diagnostics | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/24.png) |
| 25 | [Publish / checks and targets](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1233) | Publish preview export | 1280×720 | S; V, D | [Capture](evidence/figma-as-is-screens/25.png) |
| 26 | [AI / selected heading](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1463) | AI | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/26.png) |
| 27 | [Templates / gallery](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1629) | Templates | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/27.png) |
| 28 | [Template preview](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1811) | Templates | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/28.png) |
| 29 | [Components / manager empty](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-1952) | Add and components | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/29.png) |
| 30 | [Preview / Desktop](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-2250) | Publish preview export | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/30.png) |
| 31 | [Preview / Mobile 375](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-2518) | Publish preview export | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/31.png) |
| 32 | [Pages / page Inspector](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-2797) | Pages | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/32.png) |
| 33 | [New page dialog](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-3051) | Pages | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/33.png) |
| 34 | [Export dialog](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-3332) | Publish preview export | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/34.png) |
| 35 | [Keyboard shortcuts](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8290-3619) | Canvas and inspector | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/35.png) |
| 36 | [Heading Style — 1440px](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-2) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/36.png) |
| 37 | [Image Style — 1440px](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-373) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/37.png) |
| 38 | [Image Behaviour — current controls](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-734) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/38.png) |
| 39 | [Image Effects — current controls](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-994) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/39.png) |
| 40 | [Page Inspector — selected root](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-1239) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/40.png) |
| 41 | [Page settings — SEO](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-1528) | Pages | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/41.png) |
| 42 | [Page settings — Social](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-1858) | Pages | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/42.png) |
| 43 | [Page settings — Advanced](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8293-2168) | Pages | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/43.png) |
| 44 | [Settings / Overview](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-2) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/44.png) |
| 45 | [Settings / SEO](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-234) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/45.png) |
| 46 | [Settings / Redirects](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-473) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/46.png) |
| 47 | [Settings / Domains — no custom domain](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-682) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/47.png) |
| 48 | [Settings / Access](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-883) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/48.png) |
| 49 | [Settings / Analytics](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-1095) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/49.png) |
| 50 | [Settings / Form submissions — empty](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-1327) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/50.png) |
| 51 | [Settings / Languages](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-1527) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/51.png) |
| 52 | [Settings / Custom code](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-1748) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/52.png) |
| 53 | [Settings / Security headers](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-1966) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/53.png) |
| 54 | [Settings / Danger zone](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-2194) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/54.png) |
| 55 | [Settings / Members — workspace door](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-2404) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/55.png) |
| 56 | [Settings / Billing — workspace door](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-2608) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/56.png) |
| 57 | [Settings / Integrations — workspace door](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8302-2812) | Settings | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/57.png) |
| 58 | [Brand / Colour mode](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-74) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/58.png) |
| 59 | [Brand / Styles](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-308) | Brand | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/59.png) |
| 60 | [Brand / Component styles](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-505) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/60.png) |
| 61 | [Brand / Classes — empty](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-690) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/61.png) |
| 62 | [Brand / Presets](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-836) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/62.png) |
| 63 | [Brand / Brand checks](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-1034) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/63.png) |
| 64 | [Brand / Starters](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-1184) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/64.png) |
| 65 | [Brand / Import / export](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8304-1357) | Brand | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/65.png) |
| 66 | [CMS / No collection selected](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8306-241560) | CMS | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/66.png) |
| 67 | [CMS / Title field settings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8307-241530) | CMS | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/67.png) |
| 68 | [CMS / Dynamic pages](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8307-241775) | CMS | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/68.png) |
| 69 | [CMS / Collection settings](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8307-241979) | CMS | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/69.png) |
| 70 | [Media / Selected asset](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8307-242190) | Assets | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/70.png) |
| 71 | [Media / Asset properties](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-2) | Assets | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/71.png) |
| 72 | [Media / Crop editor](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-228) | Assets | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/72.png) |
| 73 | [Media / Asset actions](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-505) | Assets | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/73.png) |
| 74 | [History / Published empty state](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-737) | History | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/74.png) |
| 75 | [History / Version actions](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-879) | History | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/75.png) |
| 76 | [History / Compare with current](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-1048) | History | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/76.png) |
| 77 | [Canvas / View menu](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-1227) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/77.png) |
| 78 | [Canvas / Breakpoint menu](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-1472) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/78.png) |
| 79 | [Canvas / Mobile viewport](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-1701) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/79.png) |
| 80 | [Inspector / Multiple selected](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-1927) | Canvas and inspector | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/80.png) |
| 81 | [Inspector / Locked element](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-2246) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/81.png) |
| 82 | [Inspector / Container](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-2638) | Canvas and inspector | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/82.png) |
| 83 | [Inspector / Form](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-3082) | Forms | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/83.png) |
| 84 | [Pages / Empty page](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-3572) | Pages | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/84.png) |
| 85 | [Pages / Page actions](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8308-3973) | Pages | 1280×720 | S; V | [Capture](evidence/figma-as-is-screens/85.png) |
| 86 | [Components / Create dialog](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-2) | Add and components | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/86.png) |
| 87 | [Components / Instance controls](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-461) | Add and components | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/87.png) |
| 88 | [Components / Instance actions](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-887) | Add and components | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/88.png) |
| 89 | [Components / Expanded manager](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-242881) | Add and components | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/89.png) |
| 90 | [Components / Master detail](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-243286) | Add and components | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/90.png) |
| 91 | [Components / Back to instance](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-243704) | Add and components | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/91.png) |
| 92 | [Inspector / CMS binding chooser](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-244123) | CMS | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/92.png) |
| 93 | [Inspector / Add interaction](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-244434) | Interactions | 1440×900 | S; V | [Capture](evidence/figma-as-is-screens/93.png) |
| 94 | [Inspector / Form behaviour](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-244811) | Forms | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/94.png) |
| 95 | [Inspector / Image chooser](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-245270) | Assets | 1440×900 | S; U | Connector limit; no fresh visual |
| 96 | [Inspector / Spacing token picker](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-245692) | Brand | 1440×900 | S; U | Connector limit; no fresh visual |
| 97 | [Inspector / Heading at Mobile](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-246171) | Canvas and inspector | 1440×900 | S; V, D | [Capture](evidence/figma-as-is-screens/97.png) |
| 98 | [Templates / Empty page replacement applied](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-246610) | Templates | 1440×900 | S; U | Connector limit; no fresh visual |
| 99 | [Templates / Replacement guard](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8309-247369) | Templates | 1440×900 | S; U | Connector limit; no fresh visual |


### 15.8 Independent review and artifact checks

The read-only design-guard reviewer found no critical scope/preservation contradiction. Two wording corrections were applied: component snapshots do capture instance override records, but update Undo does not restore them; the current CMS record exit offers Keep editing / Discard and leave, with save separate. Coverage IDs, module mapping, 95 screenshot hashes and all gallery image paths passed local validation. The gallery opened in the browser; its interactive filter check was not run because the browser cookie-origin guard blocks JavaScript on file URLs. These are document/evidence checks, not application tests. [Final review record](evidence/figma-as-is-final-review.json). Overall readiness remains PARTIALLY VERIFIED for the explicitly listed visual/workflow gaps.
