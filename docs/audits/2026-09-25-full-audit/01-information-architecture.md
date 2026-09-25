# 01: Information Architecture and Product Ownership (Prompt 1)

**Agent:** B, Product Architecture · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** product information architecture only. The audit asks, for each module:
- which bucket it belongs in: LEFT, RIGHT, GLOBAL, DEDICATED WORKSPACE, or TEMPORARY;
- who owns it, and at which scope (element, page, site or workspace);
- whether there are duplicate sources of truth or boundary violations.

It covers `packages/editor`, `packages/dashboard`, `server`, `prisma`, `packages/shared` and `lib`.

---

## Method & runtime status

**What I did:**
- I read the playbook's Prompt 1 and used `00-inventory.md` as a map. I re-checked every ownership claim in code, and corrected the inventory in three places (see "Corrections to the inventory" below).
- I traced ownership through the whole chain: UI entry → router/tab config → component → hook/service → tRPC procedure → server service → Prisma column.

**Commands run (read-only):**

| Command | Result |
|---|---|
| `pnpm vitest run server/services/__tests__/theme.service.test.ts` | 22/22 pass. The fixtures use a token-shaped `projectStyles` (`[{id:"c", value:"#fff"}]`) that the editor filters out on load (see A01-1). The suite passes, but that does not show the push is correct. |
| `pnpm --filter @buildrik/editor exec vitest run src/editor/rail/__tests__ src/editor/sidebar/__tests__` | 12 files, 80/80 pass. This confirms the rail and tab configuration as described below. |
| grep, sed, awk over source and `prisma/schema.prisma` | Evidence cited file:line throughout |

**NOT RUNTIME VERIFIED.** There is no Postgres and no browser in this sandbox. Nothing below was observed in a running app. In particular:
- **Both P0s are static traces.** Each chain was read end to end, but neither has been reproduced against a database.
- **`{{site.*}}` in published HTML:** not verified whether the bindings resolve (A01-5).
- **Production `NEXT_PUBLIC_FEATURE_PUBLISH`:** not verified. Whether the editor Publish entry exists in production depends on this build-time value, which the repo cannot show.

---

## Corrections to the inventory (verified in code)

| Inventory claim | What the code shows |
|---|---|
| "Full Media: three competing full-library surfaces" | **Two.** `media/MediaLibraryPanel.tsx` is a **picker**: `onSelect`, `allowedTypes` and `forLabel` are opened from Inspector fields (`inspector/sections/BackgroundSection.tsx:78`, `elementProperties/PropertyField.tsx:70`) through `useContentModals.openMediaLibrary`. That is a correct TEMPORARY surface. The real overlap is the editor `LibraryManager` versus the dashboard `/dashboard/media`. Those two also differ in scope (A01-3). |
| "Activity naming collision" | **Code-level only.** The editor never shows "Activity" to the user. The History tab's filter chips read "Saved versions" / "This session" (`HistoryTab.tsx:46-49`), and `ActivityView` is an internal component name. The dashboard shows "Recent Activity" (`overview-tab.tsx:306`), and the editor's site menu opens it in the dashboard (`SiteMenu.tsx`, `#activity-log`). Downgraded to P3 (A01-19). |
| "Components off-rail, reached only by ⇧A / ⌘K" | There is also a site menu entry, **Build › Components**, at `SiteMenu.tsx`, wired from `StudioHeader.tsx:840`. |

---

## Output table 1: bucket placement per module

**Buckets:**
- **LEFT:** build, navigate, organize, resources.
- **RIGHT:** inspect, configure, review, validate.
- **GLOBAL:** project, site or workspace chrome.
- **DEDICATED:** a complex-management workspace.
- **TEMP:** modal, popover, menu or picker.

**Where the editor rail is defined:**
- Rail order: `packages/editor/src/editor/rail/tabsConfig.ts:359`, `RAIL_FIGMA` (Add · Layers · Pages · Assets · CMS · Brand).
- Tab mode (panel or fullpage): `tabsConfig.ts:72-268`.
- Routing: `sidebar/TabRouter.tsx` for panels, `sidebar/FullPageRouter.tsx` for full pages.

| Module | Expected bucket | Current surface / entry (verified) | Owner file | Verdict |
|---|---|---|---|---|
| Add | LEFT (Build) | Rail `add`, drawer | `sidebar/tabs/build/BuildTab.tsx` | KEEP. Watch the "Components" meaning, A01-10. |
| Layers | LEFT (Navigate) | Rail `layers`, plus the footer `StructurePopover` | `tabs/layers/LayersTab.tsx`, `shell/StructurePopover.tsx` | KEEP (secondary entry is valid) |
| Pages | LEFT (Organize) | Rail `pages`, plus `PageTabBar`. Per-page SEO is in `page-settings/` (SeoTab, SocialTab). | `tabs/pages/PagesTab.tsx` | KEEP. Dynamic CMS pages are invisible here, A01-13. |
| Assets (Media Quick) | LEFT (Resources) | Rail `assets`, drawer | `tabs/media/MediaTab.tsx` | KEEP |
| Full Media | DEDICATED | `assets` + `mediaFullPage` → `FullPageRouter` → `LibraryManager` portal (`StudioPanels.tsx:258-272`, `FullPageRouter.tsx:85-97`). Also dashboard `/dashboard/media`. | `media/LibraryManager.tsx`, `D/components/media/media-library.tsx` | CHANGE: scope mismatch, A01-3 |
| Media picker | TEMP | Inspector → `MediaLibraryPanel` modal | `media/MediaLibraryPanel.tsx` | KEEP |
| CMS | LEFT (Resources/Data) | Rail `content` ("CMS") | `tabs/content/ContentTab.tsx` | CHANGE: site variables and sources are not persisted, A01-5 |
| Components | LEFT (Build library) | Off-rail: ⇧A, ⌘K, site menu Build › Components. Also dashboard `/dashboard/agency/library`. | `sidebar/tabs/ComponentsTab.tsx`, `D/components/library/library-panel.tsx` | PRODUCT DECISION, A01-10 |
| Brand | LEFT (config/styles), site scope | Rail `design` ("Brand"). Also the Settings "Fonts & colours" door, the site menu Build › Brand, and the Inspector "Whole site" door. | `design-system/ui/DesignSystemTab.tsx` | KEEP in the editor. The **workspace theme push is broken**, A01-1. |
| Inspector | RIGHT (Inspect/Configure) | Always mounted (`StudioPanels.tsx`) | `inspector/ProInspector.tsx` | KEEP. Element scope, and it defers "Whole site" to Brand (`ProInspector.tsx:545-590`). |
| Selected-element AI | TEMP (popover) | ✨ in `UnifiedSelectionToolbar` → `AiPromptPopover` | `canvas/controls/AiPromptPopover.tsx` | KEEP. The engine sits in the wrong folder, A01-17. |
| AI panel (chat/agent) | RIGHT or LEFT panel, secondary | Off-rail `ai`, reached from the Inspector ✨ (`ProInspector.tsx:404`), ⌘K and shortcut I | `tabs/ai/AITab.tsx` | KEEP |
| AI generation (site) | GLOBAL / onboarding | Dashboard `/onboarding/ai/*` → `templates.generate` → worker | `D/app/onboarding/ai/*` | KEEP |
| Review | RIGHT (Review) | Off-rail `review`: ReviewBar pill, site menu › Review. Dashboard agency/reviews; external `/review/[token]`. | `tabs/review/ReviewTab.tsx` | PRODUCT DECISION: Comments are nested in it, A01-8 |
| Comments | Canvas overlay + RIGHT list | Topbar Comments toggle (`StudioHeader.tsx:708`) → `CommentLayer`. The list is inside ReviewTab. | `canvas/comments/CommentLayer.tsx` | See A01-8 |
| Issues | RIGHT (Validate) | Topbar chip → `IssuesPanel` (DS lint) | `shell/IssuesPanel.tsx` | KEEP |
| History | LEFT panel, site scope | Off-rail `history`: site menu › Version history, and Publish history | `tabs/history/HistoryTab.tsx` | KEEP |
| Activity (server log) | GLOBAL (dashboard) | Site menu → dashboard `#activity-log` | `D/components/site-detail/overview-tab.tsx:306` | KEEP |
| Publish | GLOBAL (topbar CTA) plus panel | Topbar Publish (flag), site menu › Publish panel | `tabs/publish/PublishTab.tsx` | KEEP in the editor. The dashboard route is an orphan dead end, A01-12. |
| Notifications | GLOBAL | Header bell → `NotificationPanel`; dashboard dropdown and page | `shell/NotificationPanel.tsx`, `D/components/notifications/*` | KEEP. The Mentions filter is mislabelled, A01-9. |
| Site Settings | DEDICATED (site) | Off-rail `settings`, fullpage portal (`FullPageRouter.tsx:105-123`). Also the dashboard `sites/[id]/*` tabs. | `tabs/settings/SettingsTab.tsx`, `D/components/site-detail/*` | CHANGE: two owners, A01-2 and A01-4 |
| Workspace Settings | DEDICATED (dashboard) | `/dashboard/settings/*`, with doors from the editor (Members, Billing, Invite, Account) | `D/app/dashboard/settings/*` | KEEP. Webhooks leak into the site settings, A01-6. |
| Templates | LEFT (Build) / TEMP preview | Off-rail `templates`: T, Pages › From template, site menu. Dashboard `/dashboard/templates` and onboarding. | `tabs/templates/TemplatesTab.tsx` | CHANGE: two catalogs, A01-11 |
| Command Palette | GLOBAL | ⌘K `shell/modals/CommandPalette.tsx` **and** ⌘⇧P `canvas/controls/CommandPalette.tsx` | both | CHANGE, A01-14 |
| Collaboration (live) | GLOBAL (presence) | Flag-off: site menu Workspace › Start collaboration, and ⌘⇧P `start-collab` | `engine/collaboration/*` | Flag-off. Placement note in A01-21. |
| Invites / Roles / Sharing | GLOBAL (workspace) → dashboard | Site menu Workspace › Invite teammates; Share → dashboard `?share=1` (`site-header.tsx:41`) | `D/app/dashboard/settings/team`, `D/components/site-detail/site-header.tsx` | KEEP |

## Output table 2: required ownership pairs

| Pair | Expected boundary | What the code does | Verdict |
|---|---|---|---|
| Pages vs CMS | Pages owns the route tree. CMS owns collections, records and bindings. | Page CRUD goes through the project JSON (`sites.saveProject` → `saveProjectData`, `sites.service.ts:594`). Dynamic-page slug patterns are set in CMS (`ContentTab.tsx:308-327`) and expanded only at publish (`cms.service.ts:234-242`, called from `publish.service.ts:329`). The Pages panel has no CMS awareness (no `collection` or `pageSlugPattern` anywhere in `tabs/pages`). | PRODUCT DECISION (A01-13) |
| Add vs Components | Add inserts; Components manages masters | Add has four groups: ELEMENTS, BLOCKS, **COMPONENTS** (registry blocks, `catalog/groups.ts:40-41`) and **MINE** (user components, `BuildTab.tsx:70,94`). The Components panel manages site masters. The dashboard Library manages workspace masters. | CHANGE (A01-10) |
| Media Quick vs Full Media | Quick is a drawer; Full is a dedicated workspace, with the same dataset | In the editor, both read `media.listAssets({siteId})` through `BuildrikSyncProvider.ts:520`. The dashboard reads the user's assets across every site. | CHANGE (A01-3) |
| Brand vs Site Settings | Brand owns tokens; Settings owns identity, SEO and infrastructure | Settings "Fonts & colours" is a door to Brand (`SettingsTab.tsx:271-273`), which is correct. The **workspace theme push writes a different store from Brand** (A01-1). | KEEP in the editor; fix the theme push |
| Inspector vs Site Settings | Inspector covers the element only | The Inspector's "Whole site" mode steps aside and opens Brand (`ProInspector.tsx:545-581`). No site settings appear in the Inspector. | KEEP |
| Selected AI vs Generate-with-AI | Popover: a quick element edit. Panel: chat/agent. Onboarding: site generation. | Popover and panel share `useStreamPrompt` → `ai.streamPrompt`. The popover is element-only, `intent:"style-command"` (`AiPromptPopover.tsx:41-46`). The panel covers element, page and multi scopes (`useAIScope.ts:20-38`). Site generation is dashboard onboarding only. | KEEP (clear tiers) |
| Collaboration vs Review | Live co-editing vs async approval | Live collab is flag-off (`runtimeEnv.ts`). Review and comments are live and asynchronous. They share no code or UI. | KEEP (see A01-8 for Comments) |
| Collaboration vs Activity | Collab history = undo/op log; Activity = the server audit log | The collab ops never reach `ActivityLog`. The editor's local timeline is internal. The server log is in the dashboard only. | KEEP |
| Element / page / site / workspace scope | Each setting lives at exactly one scope | Four violations: **Media** is user-scoped (A01-3); **site variables** are browser-scoped (A01-5); **Webhooks** is workspace-scoped but lives in site settings (A01-6); **Components** is split between site and workspace (A01-10). | CHANGE |

---

## Findings

Every finding uses both the playbook evidence format and the Prompt 1 fields. Its "Expected owner" and "Current owner" lines state who should own the item and who does today.

### P0 — IMMEDIATE FIX REQUIRED

#### A01-1 · The agency "shared theme" push overwrites each target site's element CSS rules, not its Brand tokens
- **Severity:** P0 — IMMEDIATE FIX REQUIRED (destructive action on the wrong object / data corruption). Do not fix in this run.
- **Expected owner:** Brand tokens. `Site.projectSettings.designTokens` (and `designPresets`) is the Brand SSOT, written by `DesignSystemTab.tsx:553-558` (`setProjectSettings({ designTokens, designPresets })`).
- **Current owner:** `theme.service.ts` treats `Site.projectStyles` as "the site's tokens".
- **File:** `server/services/theme.service.ts:76-106` (`captureSharedTheme`), `:160-190` (push loop)
- **Symbol:** `captureSharedTheme`, the shared-theme push, `SiteThemeSnapshot`
- **Evidence (code):**
  - **What capture and push read and write.** Capture copies `site.projectStyles` into `Workspace.sharedTheme` (`theme.service.ts:77-101`). Push writes `projectStyles: styles` onto every unlocked target site (`:181-186`).
  - **What `projectStyles` holds.** It is the StyleEngine CSS rule list. The editor writes element-scoped rules keyed by `[data-buildrik-id="<elementId>"]`, per pseudo-state and breakpoint (`inspector/hooks/useStyleHandlers.ts:219-238, 313`), and global class rules (`engine/styles/GlobalStyleManager.ts:322`). The loader says so explicitly: "projectStyles holds StyleEngine CSS rules … tokens are hydrated separately by the DS layer" (`services/BuildrikSyncProvider.ts:356-370`). It also drops any entry without a `selector`, which is the token shape.
  - **Where Brand tokens actually live.** In `projectSettings.designTokens` (`DesignSystemTab.tsx:553-558`; `TokenRegistryContext.tsx:444`).
  - **What the UI promises.** "restore the tokens this site had before the push" (`D/components/theme/*`, title at line 48 of the snapshot control).
  - **What the tests prove.** `theme.service.test.ts:107` feeds `projectStyles: [{ id: "c", value: "#fff" }]`, a token shape that the editor load filter throws away. 22/22 pass, which only shows the service copies JSON.
- **Consequence (static trace, NOT RUNTIME VERIFIED):**
  - Pushing replaces every target site's hover, responsive and class CSS rules with the source site's rules.
  - Those source rules name element ids that do not exist on the target, so they are dead.
  - The Brand tokens the agency meant to share are never transferred.
- **Mitigations present:**
  - The push is gated on the `agency_layer` workspace flag. It is off by default, but the user can turn it on in settings (`agency-layer-toggle.tsx` → `features.set`).
  - Each push writes a `SiteThemeSnapshot` first, and rollback exists. Retention is 10 snapshots (`SNAPSHOT_RETENTION = 10`, `theme.service.ts:49`).
  - The push bumps `lastEditedAt`, so an open editor gets `SAVE_CONFLICT` instead of silently overwriting.
- **Expected behavior:** capture and push operate on `projectSettings.designTokens` and `designPresets`, which are the Brand SSOT. They never touch `projectStyles`.
- **Root cause:** the tokens moved from `projectStyles` to TokenRegistry and `projectSettings.designTokens`. That migration is recorded in the comment at `BuildrikSyncProvider.ts:357-361`. `theme.service.ts` was never moved with it, so there are two Brand stores and the workspace feature writes the stale one.
- **Affected modules:** Brand (site), agency Theme (workspace), Inspector-authored styles, Publish (the published CSS comes from `projectStyles`).
- **Recommendation:**
  - Re-point capture, push, preview and rollback to `projectSettings.designTokens` and `designPresets`.
  - Add a test that uses a real editor-shaped `projectStyles`, containing `[data-buildrik-id]` rules, and asserts those rules survive a push.
  - Until that lands, hide Push (G).
- **Decision:** CHANGE.
- **Status:** PARTIAL. The full static chain was read and the unit test was run. The push has not been run against a database.

#### A01-2 · Two writers own the same site-settings columns, and editor autosave silently reverts dashboard edits
- **Severity:** P0 — IMMEDIATE FIX REQUIRED (silent data loss of saved user settings). Do not fix in this run.
- **Expected owner:** one writer, or both writers under one concurrency check.
- **Current owner:** two uncoordinated writers:
  - the editor's `saveProject` dual-save, which runs on **every autosave**;
  - the dashboard `siteDetail.settings.update` forms.
- **File:**
  - `packages/editor/src/services/BuildrikSyncProvider.ts:192-230` (`extractSiteColumnPatch`), `:237-270` (`mergeSiteColumnsIntoSettings`), `:398-425` (`saveProject`)
  - `server/services/site-settings.service.ts:130-257` (`updateSiteSettings`)
- **Symbol:** `saveProject`, `extractSiteColumnPatch`, `updateSiteSettings`
- **Evidence (code):**
  - **On load,** the editor copies the Site columns into `projectSettings.seo` / `customCode`: name, favicon, defaultLocale, metaTitle, metaDescription, metaTitleTemplate, ogImage, allowIndexing, robotsTxt, touchIcon, socialLinks, headCode and bodyCode (`:246-258`). From then on, those keys are defined.
  - **On every autosave** (`useComposerInit.ts:517-527` → `saveProject(siteId, snapshot)`):
    - `extractSiteColumnPatch` emits every defined key (`:204-225`).
    - `hasSiteColumnChanges = Object.keys(patch).length > 0` is a presence check, not a comparison against the loaded values.
    - The patch is sent to `siteDetail.settings.update` next to `sites.saveProject` (`:406-421`).
  - **Only one of the two calls is protected.** `expectedLastEditedAt` is attached to `sites.saveProject` only (`:415`). `updateSiteSettings` does no version check and never writes `lastEditedAt`: there is no `lastEditedAt` in `site-settings.service.ts`, and both write paths are plain `site.update({ data: persistData })` (`:245-256`).
  - **The dashboard writes the same columns from forms loaded at page-load time:**
    - `components/site-detail/seo-tab.tsx:114-130`: `allowIndexing`, `robotsTxt`.
    - `components/site-detail/settings-tab.tsx:23-177`: name, slug, headCode, favicon, meta template, social links, saved through `app/dashboard/sites/[id]/settings/page.tsx:15,32`.
  - **The product invites the two-tab situation.** The editor's own Settings and site menu open the dashboard in a new tab (`SettingsTab.tsx:283-285`; `SiteMenu.tsx` "Site health", "Activity log", "Share").
- **Consequence:**
  - **Editor overwrites dashboard.** With the editor open, a user or teammate changes the site name, the meta title, the head code or **"Allow indexing"** in the dashboard. The next editor canvas edit autosaves and writes the load-time values back. No conflict dialog appears.
  - **Dashboard overwrites editor.** The reverse also happens: a dashboard form opened before an editor Settings change writes its stale fields back when saved.
  - **Worst case:** a reverted `allowIndexing` publishes an unintended indexing policy. NOT RUNTIME VERIFIED.
  - **Contrast:** the theme push *does* bump `lastEditedAt` (`theme.service.ts:186`), so only the settings path escapes the optimistic-concurrency contract.
- **Expected behavior:**
  - Mirror only the fields that changed since load, comparing against the baseline.
  - Either both writers participate in `expectedLastEditedAt`, or the settings get their own version check.
  - Better still, one surface owns these fields (A01-4).
- **Root cause:** the "P0.2b dual-save" made the Site columns canonical for both UIs, but only the page/project half got the conflict check.
- **Affected modules:** Site Settings (editor), Site detail (dashboard), SEO, Publish (reads these columns), Autosave.
- **Recommendation:**
  - Diff the column patch against a load-time baseline. Send only the changed keys.
  - Give `settings.update` an `expectedUpdatedAt`, and have it bump `lastEditedAt`.
  - Add a two-writer regression test.
- **Decision:** CHANGE.
- **Status:** PARTIAL. The chain was read end to end. The lost update has not been observed at runtime.

### P1

#### A01-3 · Media is scoped to the user, not the site or the workspace, so collaborators cannot see a site's assets
- **Severity:** P1 · **Priority:** P1
- **Expected owner:** the site (the site's media library) or the workspace (a shared library).
- **Current owner:** the uploading user.
- **File:**
  - `prisma/schema.prisma`, model `MediaAsset` (`userId String`, `siteId String?`, `@@unique([userId, url])`)
  - `server/services/media.service.ts:87-90`
  - `packages/editor/src/services/BuildrikSyncProvider.ts:519-538`
  - `packages/dashboard/components/media/media-library.tsx:43-44`
- **Symbol:** `listAssets`, `MediaLibrary`
- **Evidence:**
  - `listAssets` filters on `userId` and adds `siteId` only when one is given (`media.service.ts:88-90`).
  - The editor always sends `siteId` (`BuildrikSyncProvider.ts:521`). The result is the intersection of *this user* and *this site*.
  - The dashboard page accepts `workspaceId` and then discards it with `void workspaceId; // assets are user-scoped server-side` (`media-library.tsx:43-44`).
- **Consequence:**
  - An EDITOR opening a teammate's site sees none of the images already used on that site.
  - The dashboard "Media" page, which sits in the workspace dashboard, shows only the viewer's own uploads, across all sites.
  - The same asset concept therefore has three scopes, depending on the surface.
- **Expected behavior:** assets belong to the site, with an optional workspace-shared library. Every surface lists the same scope.
- **Root cause:** the data model predates team and workspace scoping, and neither surface reconciles it.
- **Affected modules:** Assets (Quick), Full Media, Inspector media picker, dashboard Media, Collaboration/Team.
- **Recommendation:** decide the scope (site or workspace), then migrate the `listAssets` filter and the unique key. Until then, label the dashboard page "My uploads".
- **Decision:** PRODUCT DECISION REQUIRED, followed by CHANGE.
- **Status:** VERIFIED (static). The runtime listing was not observed.

#### A01-4 · Site settings have two competing dedicated workspaces with different, overlapping coverage
- **Severity:** P1 · **Priority:** P1
- **Expected owner:** one site-settings workspace, with the other surface holding doors into it.
- **Current owner:** the editor `SettingsTab` (13 screens, fullpage) and the dashboard `sites/[id]/*` (8 tabs) both own it.
- **File:**
  - `packages/editor/src/editor/sidebar/tabs/settings/constants.ts:96-110` (nav)
  - `packages/dashboard/components/site-detail/tab-nav.tsx:7-16`
- **Symbol:** `SETTINGS_NAV`, `SITE_DETAIL_TABS`
- **Evidence:** a coverage matrix. Both surfaces call the same `siteDetail.*` backend.

  | Setting | Editor Settings | Dashboard site tabs |
  |---|---|---|
  | Name, favicon, social | General | Settings |
  | Slug, transfer | — | Settings |
  | SEO defaults, robots, indexing | SEO | SEO |
  | Domains | Domains | Domains |
  | Redirects | Redirects | Redirects |
  | Forms / submissions | Forms | "Submissions" (`feedback`) |
  | Analytics | Analytics (tracking IDs) | "Traffic" (data) |
  | Localization, Headers, Custom code | yes | — (head code only, in Settings) |
  | Sharing / access | — (door) | Sharing |
  | Webhooks (workspace) | yes | — |

  Neither surface is complete. Five settings areas can be edited in both places, which is the precondition for A01-2.
- **Expected behavior:** one dedicated owner. The editor Settings is the richer one, and it already has doors to the dashboard for Members and Billing. The other surface should be read-only summaries plus doors.
- **Root cause:** the settings UI was built twice, in two separate efforts, on one backend.
- **Affected modules:** Settings (editor), Site detail (dashboard), SEO, Domains, Redirects, Forms.
- **Recommendation:** pick the owner. Convert the other surface's duplicate forms into summaries with an "Open in editor Settings ›" link, or the reverse.
- **Decision:** PRODUCT DECISION REQUIRED.
- **Status:** VERIFIED (static).

#### A01-5 · CMS "Variables" (`{{site.*}}`) and "Sources" are site content stored only in this browser
- **Severity:** P1 · **Priority:** P1
- **Expected owner:** the site project (saved through `sites.saveProject`, or a server CMS model).
- **Current owner:** the CMS panel, which keeps them in `localStorage` (variables) or in memory only (sources).
- **File:**
  - `packages/editor/src/editor/sidebar/tabs/content/contentPanelUtils.ts:14-53`
  - `useContentPanel.ts:88-146, 217-219`
- **Symbol:** `loadSiteVariables`, `saveSiteVariables`, `registerSiteSource`
- **Evidence:**
  - **Where variables live.** They persist under `localStorage["buildrick-site-variables-<projectId>"]` (`contentPanelUtils.ts:22,31,49`).
  - **When `{{site.*}}` exists.** The `site` DataManager source is registered only when the CMS panel mounts (`useContentPanel.ts:140-146`). There are no other consumers: grepping for `loadSiteVariables` / `SITE_VARS_SOURCE_ID` finds only these two files.
  - **Sources are never saved.** DataManager sources are not part of the project save; `engine/data/DataManager.ts` has no serialization.
- **Consequence:**
  - A teammate, another device, or a cleared browser sees unresolved bindings.
  - On the author's own browser, bindings resolve only after the CMS panel has been opened in that session.
  - Whether published HTML resolves `{{site.*}}` is NOT VERIFIED: `engine/export` has no reference to DataManager.
- **Expected behavior:** site variables are saved with the project, or in the server CMS, like collections (`cmsSync` → `cms.*`).
- **Root cause:** the Variables and Sources views were built panel-local and were never given a persistence owner.
- **Affected modules:** CMS, Canvas bindings, Export/Publish, Collaboration.
- **Recommendation:** persist the variables in `projectSettings` (or a CMS collection), register the source when the composer initializes rather than when the panel mounts, and check export resolution.
- **Decision:** CHANGE.
- **Status:** PARTIAL. The storage and registration were read. Publish resolution is not verified.

### P2

#### A01-6 · Workspace webhooks are owned by the editor's per-site Settings
- **Severity:** P2
- **Expected owner:** dashboard workspace settings (next to Integrations and API tokens).
- **Current owner:** editor site Settings, group "Workspace".
- **File:** `tabs/settings/constants.ts:108`, `screens/WebhooksScreen.tsx:2-5, 88-145`, `prisma` `WorkspaceWebhook.workspaceId @unique`
- **Symbol:** `WebhooksScreen`
- **Evidence:**
  - The webhook is one row per workspace (`WorkspaceWebhook.workspaceId @unique`), and the screen says so: "every site stops sending" (`WebhooksScreen.tsx:284`).
  - No dashboard file calls `trpc.webhooks` (grep).
  - The two siblings in the same nav group, Members and Billing, are doors out to the dashboard (`SettingsTab.tsx:280-285`). Webhooks is the only workspace setting edited in place.
- **Recommendation:** move the webhook management to `/dashboard/settings/integrations`, and make the editor row a door like Members and Billing.
- **Decision:** CHANGE.
- **Status:** VERIFIED (static).

#### A01-7 · "Integrations" and "Plugins" name two unrelated things
- **Severity:** P2
- **Expected owner:** a single Integrations owner: workspace, dashboard.
- **Current owner:**
  - Editor Settings › Integrations is a static catalog of `status="soon"` links (`screens/IntegrationsScreen.tsx:1-40`).
  - The site menu's "Plugins" opens that same screen: `AquibraStudio.tsx:512` → `settings/plugins`, remapped at `SettingsTab.tsx:322`.
  - The dashboard `settings/integrations` holds the real Vercel OAuth connection (`components/settings/integrations-content.tsx`).
- **Recommendation:** rename the editor catalog (for example "Third-party setup guides"), drop "Plugins", and link to the dashboard Integrations page for real connections.
- **Decision:** CHANGE.
- **Status:** VERIFIED (static).

#### A01-8 · Team comments are owned by the "Client review" panel
- **Severity:** P2
- **Expected owner:** Comments as their own capability, available to any EDITOR. Review would consume comments for approval rounds.
- **Current owner:**
  - The comment thread list exists only inside `ReviewTab`, whose tab `ariaLabel` is "Client review — comments, approval, and the review link" (`tabsConfig.ts:242`).
  - Reviews are `agency_layer`-gated on the server (`reviews.ts:62,112,137,203`). Comments are not gated at all (`comments.ts:34-87`, plain `protectedProcedure`).
  - The canvas pins are reached through the topbar Comments toggle (`StudioHeader.tsx:708`), but listing and resolving them requires the Review panel (`ReviewService.fetchReviewComments`, `:183-200`).
- **Consequence:** a non-agency workspace has live team comments, but they sit inside a panel named after, and designed around, client approval.
- **Recommendation:** decide whether Comments is a peer panel (its own off-rail tab, or a Review sub-view that is not agency-flavoured) or part of Review only.
- **Decision:** PRODUCT DECISION REQUIRED.
- **Status:** VERIFIED (static).

#### A01-9 · The "Mentions" notification filter lists security and payment events
- **Severity:** P2
- **Expected owner:** @mentions from comments. That feature is not implemented; no mention parsing exists in `comment.service`.
- **Current owner:** `MENTION_NOTIFICATION_TYPES` = SECURITY_PASSWORD_CHANGED, SECURITY_2FA_CHANGED, SECURITY_LOGIN_NEW_DEVICE, PAYMENT_FAILED (`packages/shared/schemas/notifications.ts:13-18`). It is shown as the "Mentions" tab (`D/components/notifications/notification-page.tsx:13`).
- **Recommendation:** rename the tab (for example "For you" or "Account & billing"), or remove it until mentions exist.
- **Decision:** CHANGE (copy) or PRODUCT DECISION (build mentions).
- **Status:** VERIFIED.

#### A01-10 · "Component" has four meanings and two scopes, with no single owner
- **Severity:** P2
- **Evidence:**
  1. **Add › COMPONENTS** is a slice of the built-in registry (`catalog/groups.ts:40-41`, `componentBlockDefinitions`). These are not user components.
  2. **Add › MINE** holds the user's own components (`BuildTab.tsx:70, 94`, `composer.components`).
  3. **Components panel** manages site masters (`ComponentsTab`, `componentSync` → `siteComponents.upsert/list/get/delete`). It is off-rail.
  4. **Dashboard Library** manages workspace masters, including "delete a master from every site" (`site-component.ts:102-109`, `library-panel.tsx:24-50`). The editor has no workspace-library view: it has no caller of `workspaceList`.
- **Expected owner:**
  - Add should *insert* all of them, with clearly distinct labels ("Built-in blocks" vs "Your components").
  - A single Components owner should *manage* them, with both the site and workspace scopes visible.
- **Recommendation:** rename Add › COMPONENTS, and surface the workspace scope inside the editor Components panel. The concurrent-delete behaviour is for D/G.
- **Decision:** PRODUCT DECISION REQUIRED.
- **Status:** VERIFIED (static).

#### A01-11 · Two site-template catalogs
- **Severity:** P2
- **Expected owner:** one template catalog (the server `Template` table, which already has global and workspace rows).
- **Current owner:**
  - The editor `TemplatesTab` reads a hardcoded `SITE_TEMPLATES` (`tabs/templates/templatesData.ts`, 23 `id:` entries). It records applied templates in `localStorage` (`templatesStorage.ts:16`).
  - The dashboard and onboarding read `templates.list/get/use/applyToSite` from the seeded `Template` model (`prisma/seed.ts:243`).
- **Consequence:** the gallery a user sees in onboarding differs from the one in the editor.
- **Recommendation:** make `templates.*` the source for the editor gallery too. Keep `userTemplates` for "My templates".
- **Decision:** CHANGE.
- **Status:** VERIFIED (static). The catalogs' contents were not diffed.

#### A01-12 · The orphaned dashboard `sites/[id]/publish` route offers a Publish that cannot succeed
- **Severity:** P2
- **Expected owner:** Publish belongs to the editor. The site header already routes there: `app/dashboard/sites/[id]/layout.tsx:67-75` sends Publish to the editor href.
- **Current owner:** `app/dashboard/sites/[id]/publish/page.tsx:30-43` still calls `sites.publish.mutate({ siteId })` with **no pages**. In production the worker rejects every such job: `api/workers/publish/[jobId]/route.ts:100-104` throws "No page content to deploy". `SITE_DETAIL_TABS` (`tab-nav.tsx:7-16`) does not include `publish`, so the route can be reached only by URL.
- **Recommendation:** delete the route, or redirect it to the editor.
- **Decision:** CHANGE.
- **Status:** VERIFIED (static).

#### A01-13 · CMS dynamic pages are invisible to Pages
- **Severity:** P2
- **Evidence:**
  - The slug pattern is set in CMS (`ContentTab.tsx:308-327`), and the template path in `CMSCollectionSetupModal.tsx:229`.
  - The pages are generated only at publish (`cms.service.ts:226-242`).
  - `tabs/pages` has no reference to collections.
  - The `cms.dynamicPages` / `generateDynamicPages` procedures are orphan-allowlisted as "FOUNDER DECISION".
- **Expected owner:** Pages should list the generated routes (read-only, badged "from <collection>"). CMS keeps the binding.
- **Recommendation:** add a read-only group in Pages, or explicitly keep dynamic pages CMS-only.
- **Decision:** PRODUCT DECISION REQUIRED.
- **Status:** VERIFIED (static).

#### A01-14 · Global commands split across two editor palettes, with duplicates
- **Severity:** P2
- **Expected owner:** one global palette (⌘K).
- **Current owner:**
  - **⌘K** (`shell/modals/CommandPalette.tsx`) has Undo (`:71`) **and** "Undo last action" (`:143`), both on `Ctrl+Z` with the same handler. It also has Zoom and Preview.
  - **⌘⇧P** (`canvas/hooks/useCanvasCommandPalette.ts:87-317`) repeats undo, redo, zoom and preview, and adds unique entries: `start-collab`, `open-seo`, `open-integrations`, `cms-records`, `save-template`, `replace-media` and others.
- **Recommendation:** merge the ⌘⇧P registry into ⌘K and remove the in-palette Undo duplicate. Search-scope details are covered in Prompt 5.
- **Decision:** CHANGE.
- **Status:** VERIFIED (static). The 4 deterministic ⌘K test failures in the inventory (§9) are the same palette's label drift.

### P3

- **A01-15 · The rail config carries three IA vocabularies.**
  - Each `GroupedTabConfig` holds a `zone` (legacy rail), a `tool` (E3 rail) and the `RAIL_FIGMA` order (`tabsConfig.ts:52-68, 289-361`).
  - `RAIL_TOOL_META` names the tools "Insert", "Styles" and "Site" (`:315-322`). The live labels are "Add", "Brand" and "Settings".
  - So `?rail=e3` shows a different product vocabulary.
  - **Recommendation:** delete the unused renderers, or share the labels. CHANGE. VERIFIED.
- **A01-16 · Dead `templates` case in `FullPageRouter`.** Templates is `mode:"panel"` (`tabsConfig.ts:113`). `isFullPageMode` is never passed to `StudioPanels` (grep: declared at `StudioPanels.tsx:98,182`, no caller passes it), so `FullPageRouter.tsx:67-75` is unreachable. The header comment "Routes fullpage-mode tabs (Templates, Assets)" is stale. CHANGE. VERIFIED.
- **A01-17 · The AI engine lives inside a sidebar tab folder.**
  - The canvas popover imports `sidebar/tabs/ai/hooks/useStreamPrompt`, `applySetStyle`, `DiffRows` and `types` (`AiPromptPopover.tsx:10-13`). These are shared AI engine pieces owned by one panel's folder.
  - The AI tab's aria label reads "chat with Claude" (`tabsConfig.ts:93`), while the server providers are OpenAI and Ollama. No `anthropic` or `claude` string appears in `server/services/ai*`.
  - **Recommendation:** move the shared AI code to `editor/ai/`, and fix the copy. CHANGE. VERIFIED.
- **A01-18 · The site identity helper is owned by Review.** `currentSiteId()` lives in `services/ReviewService.ts:15-20` and is imported by `versionSync`, `componentSync`, `cmsSync`, `templateSync`, `RoleService`, `useVersionSync`, `useComponentSync` and `SettingsTab`. A near-copy, `getSiteIdFromUrl()`, is at `BuildrikSyncProvider.ts:590-600`. Make one owner in the sync layer. CHANGE (→ E). VERIFIED.
- **A01-19 · The "Activity" collision is internal only.** See the corrections table. Renaming `ActivityView` to `SessionChangesView` would stop future confusion. KEEP (optional rename). VERIFIED.
- **A01-20 · A vestigial project-settings modal seam.** `showProjectSettings` now only emits `UI_SWITCH_TAB settings` and clears itself (`StudioModals.tsx:136-146`). Inline it: route `openProjectSettings` straight to `openLeftPanelToTab("settings")`. CHANGE. VERIFIED.
- **A01-21 · "Start collaboration" sits under the site menu's Workspace group.** It starts a per-site live session (`SiteMenu.tsx`, Workspace group; `CollaborationManager.startSession`). It is flag-off today. If it ships, it belongs with the Share group or topbar presence. PRODUCT DECISION (low). VERIFIED.

---

## Good as-is (verified)

- **Brand vs Settings boundary in the editor.**
  - Settings › "Fonts & colours" is a *door* to Brand, not a second editor (`SettingsTab.tsx:271-273`).
  - The Inspector's "Whole site" mode steps aside to Brand (`ProInspector.tsx:545-590`).
- **Inspector scope.** The Inspector stays element-scoped, with an explicit "All like this" peer mode (`ProInspector.tsx:112-133`). No site or page settings leak into it.
- **Page vs site SEO.** Per-page SEO and Social live in Pages › page settings (`page-settings/SeoTab.tsx`, `SocialTab.tsx`). Site defaults live in Settings › SEO defaults. This is a correct scope split.
- **Workspace doors.**
  - Members, Billing, Invite teammates and Account settings are doors to the dashboard (`SettingsTab.tsx:280-285`; `SiteMenu.tsx`, Workspace group).
  - Site health and Activity log deep-link to real anchors (`overview-tab.tsx:184,306`).
  - Share hands off through `?share=1` (`site-header.tsx:41`).
- **Site menu.** It is grouped Site / Build / Share / Workspace, which is a coherent GLOBAL surface.
- **AI tiers.**
  - The popover handles quick element edits with one undo step (`AiPromptPopover.tsx:49-59`).
  - The panel handles chat and agent work across element, page and multi scopes.
  - Onboarding handles site generation.
  - All three use one streaming endpoint.
- **Version history.** IndexedDB is a cache, the server `SiteVersion` table is mirrored and hydrated (`versionSync.ts:1-15, 93-98`), and failures are queued rather than dropped.
- **Media picker.** The `MediaLibraryPanel` picker is a correct TEMP surface for Inspector fields.
- **Publish ownership.** The dashboard site header sends Publish to the editor (`layout.tsx:67-75`), apart from the orphan route in A01-12.
- **Settings screens load server truth.** They read `siteDetail.settings.get` on open (`hooks/useServerLoad.ts`). They are not stale snapshots, apart from the autosave mirror in A01-2.

## Product decisions required

1. **Site settings owner:** the editor Settings or the dashboard site tabs (A01-4). This precedes the A01-2 fix design.
2. **Media scope:** site, workspace or user (A01-3).
3. **Comments:** a peer capability, or a part of Review (A01-8).
4. **Components scope:** whether the workspace library shows in the editor, and how Add labels built-in vs user components (A01-10).
5. **Dynamic pages:** whether they appear in Pages (A01-13).
6. **Mentions:** build them, or drop the tab (A01-9).
7. **Collaboration entry placement:** decide if the flag ever ships (A01-21).

## Overlaps with other audits (observed, not audited here)

- **D (Collaboration):**
  - A01-2's missing version check on `settings.update` is the same class of problem as two live collaborators both autosaving.
  - `siteComponents.workspaceDelete` removes masters "from every site" while an editor may still hold them in memory. Does `componentSync` re-upsert them?
- **F (Security):**
  - `webhooks.connect/disconnect/regenerateSecret` are plain `protectedProcedure`. I did not verify the admin check. The screen copy implies admin-only.
  - Theme push: A01-1's workspace scoping looked correct (IDOR guard noted in the code). The damage is the wrong column, not the wrong tenant.
- **G (Verification):**
  - A01-1 and A01-2 need DB-backed runtime reproduction.
  - The theme tests use invented payload shapes, the same failure class CLAUDE.md records for Stripe.
  - Whether the editor Publish entry exists in production depends on the `NEXT_PUBLIC_FEATURE_PUBLISH` value baked at build time. If it is unset, the dashboard header's "Publish" sends users to an editor with no Publish button.
- **E (Architecture):** A01-17 and A01-18 (AI code in a tab folder; site-id helper owned by Review). `FullPageRouter`'s dead branch (A01-16).
- **C (UX):** A01-9 and A01-7 copy; the "chat with Claude" label.

---

## AUDIT HANDOFF

- **Agent / Prompt:** B, Product Architecture / Prompt 1: Information Architecture and Product Ownership
- **Report:** `docs/audits/2026-09-25-full-audit/01-information-architecture.md`
- **Counts:** P0 = 2 · P1 = 3 · P2 = 9 · P3 = 7
- **P0 (IMMEDIATE FIX REQUIRED; not fixed):**
  - A01-1: the theme push overwrites `projectStyles` (element CSS rules) instead of Brand tokens (`server/services/theme.service.ts:76-106,160-190`).
  - A01-2: the editor autosave mirrors every Site column to `siteDetail.settings.update` with no version check, which reverts dashboard edits (`packages/editor/src/services/BuildrikSyncProvider.ts:192-230,398-425`; `server/services/site-settings.service.ts:130-257`).
- **P1:**
  - A01-3: media is user-scoped.
  - A01-4: two site-settings workspaces.
  - A01-5: CMS site variables and sources are browser-only.
- **Runtime verified:** none. The only runtime evidence is the unit runs: theme service 22/22 and rail/sidebar 80/80.
- **NOT RUNTIME VERIFIED:**
  - the A01-1 push effect on a real site;
  - the A01-2 lost update across two tabs;
  - A01-5 `{{site.*}}` resolution in published HTML;
  - the production value of `NEXT_PUBLIC_FEATURE_PUBLISH`;
  - A01-11 catalog content differences.
- **Dependencies:**
  - Settle the A01-4 product decision before designing the A01-2 fix.
  - Settle the A01-3 scope decision before any Full Media or dashboard Media consolidation.
  - The A01-1 fix is independent and can go first.
- **Inventory corrections:** Full Media has 2 competing surfaces, not 3. "Activity" is an internal name only. Components also has a site-menu entry.
- **Suggested next owners:**
  - **G:** DB-backed reproduction of A01-1 and A01-2.
  - **F:** the webhooks admin check.
  - **D:** the component workspace-delete vs open editor.
  - **Orchestrator:** group A01-2, A01-4 and A01-6 under one "site-settings ownership" fix batch.
