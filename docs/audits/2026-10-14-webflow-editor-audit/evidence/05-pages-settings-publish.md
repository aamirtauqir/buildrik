# 05 — Pages, Site Settings, Preview/Export/Publish, History & Recovery (areas H + recovery part of G)

Audit @df60cf9ec, 2026-10-14. Read-only, from code only. No live run. Evidence labels as defined in BRIEF.md.
DESIGN: not assessed (owner instruction).

Path conventions: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, `S/` = `server/`. Line numbers are at df60cf9ec.

Spot re-verified by the synthesiser, beyond the sub-readers:
- IA-08 / IA-09: `E/editor/shell/PreviewOverlay.tsx:119,211`
- RR-03: `E/editor/shell/hooks/useIssuesFeed.ts:127-128`
- History D1: autosave listeners at `E/editor/shell/hooks/useComposerInit.ts:906-909`; `restoreEntry` emits `HISTORY_RECORDED`, `E/engine/HistoryManager.ts:~816`
- Pages D1: `committedRef`, `E/editor/sidebar/tabs/pages/components/PageRow.tsx:87-116`
- Publish D11: `"running"` vs `"active"`, `PublishTab.tsx:307` vs `D/app/api/workers/publish/[jobId]/route.ts:48`
- Redirect `.html` / no `cleanUrls`: `packages/shared/seo/urls.ts:5-9`
- `PublishConfirmModal.tsx:149` disabled expression

## Prior-finding re-check summary

| ID | Status | Evidence |
|---|---|---|
| UX-03 (named starter opens whole catalogue) | **Confirmed in code @df60cf9ec** | `E/editor/canvas/CanvasEmptyCTA.tsx:75,98-99` all three cards call `onBrowseTemplates`; `E/editor/canvas/Canvas.tsx:824` emits `ui:browse-templates` with empty payload. `TemplatesOpenRequest.previewId` exists (`TemplatesTab.tsx:49,116-118`) and ⌘K uses it (`CommandPalette.tsx:322`), but the card doesn't pass it. |
| UX-04 (stacked creation feedback) | **Confirmed in code @df60cf9ec** | `TemplatesTab.tsx:359` sets success while the progress overlay is still mounted (closes after 2 paints, `:404-406`; both mounted `:607-640`). `page:created` (`:318`) triggers `OnboardingMount.tsx:103-109` → `AchievementPrompt` aria-modal z 10000 (`AchievementPrompt.tsx:53-56,153`). Plus 2 toasts (`TemplatesTab.tsx:383`; `BRAND_CONNECT_SUGGESTED` `engine/Composer.ts:513-516`). No arbitration between them. |
| UX-26 (Create page defaults to browsing) | **Confirmed in code @df60cf9ec**; the name does survive | `NewPageModal.tsx:44,52` default `template`; `:71-74` emits `UI_BROWSE_TEMPLATES {newPageName, addToNavigation}` with no page created. The name is carried `StudioPanels.tsx:600-605` → `FullPageRouter.tsx:126` → `TemplatesTab.tsx:70,318` and shown in the confirm (`TemplatesTabModals.tsx:166`). Lost if the tab changes (`StudioPanels.tsx:666`). The preview still offers "Replace page…" in this flow (`TemplatePreview.tsx:104`). EDITOR is refused at the catalogue (`TemplatesTab.tsx:153-162`), so the default path is a dead end for EDITOR. |
| UX-11 / IA-09 (Preview opens Desktop) | **Confirmed in code @df60cf9ec** | `PreviewOverlay.tsx:119` `useState<Breakpoint>("desktop")`; no device prop passed (`AquibraStudio.tsx:861-876`); width resets on every open (unmount `:162`). The page is preserved (`:870-875`). |
| IA-08 (Preview not an interaction runtime) | **Confirmed in code @df60cf9ec** | `PreviewOverlay.tsx:209-211` `sandbox="allow-same-origin"`, no `allow-scripts`; links handled from the parent (`:130-143`). Export modal preview is the same (`E/editor/export/PreviewFrame.tsx:147`). |
| UX-21 (premature red validation on General) | **Confirmed in code @df60cf9ec**, only when the stored value is invalid | `SiteSettingsScreen.tsx:242` `nameError` has no touched gate; rendered as alert `:407,412-416`. Footer `SettingsTab.tsx:780-790` ignores `clientFieldErrors` → "All changes saved". Save is disabled (`:1155`) with no reason. Server `min(2)` checks the untrimmed value (`packages/shared/schemas/site-detail.ts:136`) and the client trims (`:51-59`), so `"a "` reproduces. Same pattern on SEO title >60 (`SeoScreen.tsx:183-205,298-303`). |
| UX-22 (background controls reachable under full-page Settings) | **Confirmed in code @df60cf9ec** | Only drawer/canvas/inspector are `visibility:hidden` (`LayoutShell.css:318-327`). Topbar `header[role=banner]` (`AquibraStudio.tsx:694`), rail and skip link (`LayoutShell.tsx:309`) stay focusable. No `inert`/`aria-hidden`. `set-host` has no `role=dialog`/`aria-modal`/focus trap (`FullPageRouter.tsx:162-166`). |
| IA-13 (settings save semantics) | **Partly fixed; still true for 4 states** | Distinct today: loading, load error + retry, unsaved, save failure + retry, saved toast "Saved · applies on next publish" (`SettingsTab.tsx:621`). Missing: untouched-invalid (says saved), dirty-invalid (Save disabled, no reason), **saving** (no "Saving…"), **conflict** (none: `updateSiteSettingsSchema` has no version token, `site-detail.ts:134-175`; `updateSiteSettings` is a blind update, `S/services/site-settings.service.ts:392-395`). The save model is only implied by a scope line. |
| RR-02 (AI publish skips freshness/loaded checks) | **Confirmed in code @df60cf9ec, and wider** | `useAiActionGate.ts:68-71` → `S/services/ai-actions.service.ts:66` `startPublish(siteId, actorId, pages)` with no `expectedLastEditedAt`; `S/services/publish.service.ts:392-397` checks staleness only when given. Also: it ignores the publish flag (`AITab.tsx:126-127`), skips checks/confirm/CMS sync blocker, runs outside `usePublishJob` (topbar unaware), and domain errors other than `ALREADY_PUBLISHING` are untranslated in `S/trpc/routers/actions.ts:84-91`. |
| RR-03 (failed server checks look clean) | **Confirmed in code @df60cf9ec, and wider** | `useIssuesFeed.ts:124-129` catch → `setCheckIssues([])`; `IssuesPanel.tsx:236-246` "No issues."; scan-error banner (`:225-233`) covers only local scan. Knock-on: server `fail` rows drop out of `errorCount` (`AquibraStudio.tsx:446-449`), so the lifecycle `open-errors` gate also vanishes. |
| HIST-01 (compare omits page rename) | **Confirmed in code @df60cf9ec, and wider** | `engine/VersionTimelineManager.ts:720-811` flattens elements by id (`:844-864`), compares only type/tagName/styles/classes/content/attributes/traits (`:869-944`); pages matched by `page.id || page.name` (`:785-798`) so name/slug/isHome/settings/meta/styles are never compared. `CompareView.tsx:191-196` "The current draft matches". Also missing: project styles, site settings, cmsBindings, assets, layer names (`data`), parent/order (moves read as "matches"). |

---

## 1. Module map

### H1. Pages panel
- **Purpose:** list, create, organise and configure pages.
- **Entry points:**
  - rail tab `pages` (`E/editor/rail/tabsConfig.ts`; hidden for VIEWER via `VIEWER_TABS` `:325-338`)
  - `PageTabBar` (`E/editor/shell/PageTabBar.tsx`)
  - ⌘K `new-page`, `page-new` (`StudioPanels.tsx:287-292`)
  - `UI_NEW_PAGE_REQUESTED` (empty state, footer "+ Add page")
  - Inspector page panel `E/editor/inspector/components/PagePanel.tsx`
- **Actions:** create (blank / from template), folder CRUD, drag reorder, duplicate, rename + Keep/Update URL, delete + toast undo, set home, page settings (SEO / Social / Advanced), bulk select/move, Listings table, Site structure tree (both via ⋯ menu `PagesTab.tsx:402-407`).
- **Dependencies:**
  - `engine` `PageManager` (`createPage`, `updatePage`, `duplicatePage` `:303-344`, `reorderPage` `:349-371`, `deletePage` `:264-284`, `setHomePage` `:249-262`)
  - autosave `sites.saveProject` (`S/trpc/routers/sites.ts:364-376`, EDITOR) → `saveProjectData` (`S/services/sites.service.ts:975-1183`)
  - folders via `pages.folders.*` (`services/PageFolderService.ts:26-33` → `S/services/page-folder.service.ts`)
- **Evidence:** CODE + REACH.
- **Note:** the editor never calls `pages.create/update/delete` (`sites.service.ts:975-977`); every page change is a project snapshot.

### H2. Templates catalogue and create-page flow
- **Files:** `E/editor/sidebar/tabs/templates/*` (TemplatesTab, TemplatePreview, TemplatesTabModals, ApplyProgressOverlay), `NewPageModal.tsx`, `CanvasEmptyCTA.tsx`.
- **Entry points:**
  - canvas empty-state starters
  - New page modal (default source)
  - rail templates
  - ⌘K (with `previewId`)
  - `replace-layout`
- **Gates:** ADMIN on the client (`TemplatesTab.tsx:153`); premium (`:156`). **No server ADMIN rule**: the save path is EDITOR.
- **Evidence:** CODE + REACH.

### H3. Page settings dialog
- **Files:** `pages/page-settings/PageSettingsDrawer.tsx`, `SeoTab`, `SocialTab`, `AdvancedTab`, `usePageSettings.ts`, `UnsavedWarningModal`.
- **Model:** explicit Done/Save. Unsaved guard on ✕ / Esc / scrim. Save state `aria-busy` (`PageSettingsDrawer.tsx:193-194`); error state + toast (`usePageSettings.ts:288-292`).
- **Password per page:** removed by decision #21 (`usePageSettings.ts:55-56`). Old "password" values are read as hidden (`usePages.ts:37-39`).
- **Canonical per page:** stored and exported, but no UI field (`AdvancedTab.tsx:4-5`, "later").

### H4. Site Settings full-page tool
- **Mount:** `FullPageRouter.tsx:160-177`, a `Portal` fixed overlay `data-testid="set-host"`, rail tab `settings` `mode:"fullpage"` (`tabsConfig.ts:159-170`).
- **Entry points:**
  - SiteMenu `site-menu-site-settings` (`SiteMenu.tsx:164-166`)
  - Ctrl/⌘+`,` (`useEditorShortcuts.ts:151`)
  - rail
  - `ui:settings-open` (Publish rows `PublishTab.tsx:106,414`; Page SEO `SeoTab.tsx:167`)
  - deep link `?settings=<screenId>` (`useDeepLink.ts:45-47`; workspace doors excluded)
- **Screens** (`E/editor/sidebar/tabs/settings/screens/`):
  - Overview
  - General (`SiteSettingsScreen`)
  - Languages (`LocalizationScreen`)
  - Brand door
  - SEO
  - Domains
  - Redirects
  - Access (password, share-links door)
  - Analytics
  - Form submissions
  - Custom code (`AdvancedScreen`)
  - Security headers (`HeadersScreen`)
  - Danger zone
  - Locked
  - Workspace doors (Members / Billing / Integrations → `/dashboard/settings/{team,billing,integrations}`)
- **Shell owns:** nav, search mode (`searchIndex.ts`), scope line, read-only banner, plan lock, footer, guard, Esc.
- **Role and plan tables:** `SCREEN_MIN_ROLE`, `SCREEN_SAVE_MODEL`, `SCREEN_SCOPE` (`settings/constants.ts`); `SCREEN_PLAN_REQUIREMENTS` (`settings/types.ts:215`).
- **Save transport:** `saveSiteSettings` (`E/services/BuildrikSyncProvider.ts:491,524`) → in parallel:
  - `siteDetail.settings.update` (ADMIN, `S/trpc/routers/site-detail.ts:106-110`)
  - `siteDetail.projectSettings.update` (EDITOR; ADMIN when `customCode`, `:157-161`)

### H5. Preview
- **Files:** `PreviewOverlay.tsx`, `PreviewShareModal.tsx`; `renderPreviewHtml` called from `AquibraStudio.tsx:279-301,861-876`.
- **Entry points:** topbar eye (`StudioHeader.tsx:399-414`) → `UI_TOGGLE_PREVIEW`; ⌘K; onboarding.
- **Features:** device row Desktop/Tablet/Mobile (fixed widths), page `<select>` `preview-page`, Share preview.
- **Rendering:** static, sandboxed.

### H6. Export
- **Entry points:** SiteMenu "Export site…" (`SiteMenu.tsx:169-172`) → `ExportModal` (`StudioModals.tsx:165`); Settings Export row; ⌘K `UI_TOGGLE_EXPORTER`; `handleExportHTML` direct ZIP (`useExportHandlers.ts:60-80`).
- **Formats:** HTML / ZIP / React. Vue and Next.js are "Soon" (`ExportOptions.tsx:59-62`).
- **Gating:** no plan or role gate beyond the menu being hidden in view mode (`SiteMenu.tsx:150-160`).

### H7. Publish
- **Flag:** `FEATURE_PUBLISH` (`shared/utils/runtimeEnv.ts`, `featureFlags.ts:13-21`). It gates only:
  - `useLifecycle.ts:111` blocker copy
  - `TabRouter.tsx:200` panel CTA wiring
  The server never reads it.
- **Entry points:**
  1. topbar CTA (`StudioHeader.tsx:835-842` → `requestPublish` `AquibraStudio.tsx:560-564`)
  2. Publish panel CTA
  3. panel failure "Try again"
  4. failure-toast "Try again" (`useExportHandlers.ts`, bypasses gates: see D-P9)
  5. AI chat proposal (`useAiActionGate.confirm`)
  6. History "Republish vN" (`PublishHistory.tsx:239-250`)
- **Server:** `sites.publish` (`sites.ts:456-548`) → `startPublish` (`publish.service.ts:330-566`) → worker `D/app/api/workers/publish/[jobId]/route.ts` → Vercel.
- **Related procedures:** `cancelPublish` (ADMIN `:575`), `unpublish` (ADMIN `:666`), `rollback` (ADMIN `:741`), `publishHistory`/`publishDiff` (EDITOR).
- **Scheduled publish:** PLANNED / disabled. `schedulePublish` throws `NO_RENDERER` (`scheduled-publish.service.ts:40-57`). Cron still sweeps (`D/app/api/cron/scheduled-publish/route.ts:38`).
- **Domains:** under Settings › Domains (`DomainsScreen.tsx`, `S/services/domain.service.ts`).

### G-recovery. History, versions, save, conflict, recovery
- **Session undo:** `engine/HistoryManager.ts`, memory, 100 entries (`shared/constants/config.ts:107`). ⌘Z / ⇧⌘Z / ⌘Y (`useEditorShortcuts.ts:185-193`).
- **History tab:** `E/editor/sidebar/tabs/history/HistoryTab.tsx` → Session list (`ActivityView.tsx`) and Saves (`E/editor/panels/version-history/VersionHistoryPanel.tsx`, `VersionList`, `CompareView`).
- **Time-Travel:** ⌃⇧T (`TimeTravelHost.tsx`).
- **Rendered compare:** `CompareHost.tsx` + `compareSources.ts` (approved / published / saved / current).
- **Named versions:**
  - `VersionTimelineManager` → IndexedDB `aquibra-versions`/`versions` keyed by siteId (`useComposerInit.ts:238`)
  - mirrored best-effort to server `SiteVersion` (`prisma/schema.prisma:1164`; `S/services/site-version.service.ts`; router `site-version.ts:24-58`)
- **Save:** autosave in `useComposerInit.ts:627-917`; `BuildrikSyncProvider` chain (`:776-795`); CAS on `Site.lastEditedAt` (`sites.service.ts:1049-1092`).
- **Conflict:** `modals/ConflictModal.tsx:56-99`.
- **Save failure:** `SaveFailedBanner.tsx`.
- **Recovery:** unsaved-copy toast (`useComposerInit.ts:326-377`, `services/unsavedRecovery.ts`) and `RecoveryBanner.tsx` (crash marker, `RecoveryManager.ts:86-100`).

---

## 2. Screen / flow inventory

| Family | Surface | Path |
|---|---|---|
| Pages | Panel, list, row, folder, context menu, bulk toolbar, move dialog | `E/editor/sidebar/tabs/pages/{PagesTab.tsx, components/PageList.tsx, PageRow.tsx, PageFolder.tsx, PageContextMenu.tsx, BulkToolbar.tsx, MovePagesDialog.tsx}` |
| Pages | New page modal | `pages/components/NewPageModal.tsx` |
| Pages | Add page footer button | `pages/components/AddPageButton.tsx` |
| Pages | Rename URL decision (Keep / Update URL) | `pages/components/RenameUrlDecision.tsx` |
| Pages | Search Listings table; Site structure tree | `pages/components/SearchListingsTable.tsx`, `SiteStructureTree.tsx` |
| Pages | Page settings dialog: SEO / Social / Advanced; unsaved guard; error boundary | `pages/page-settings/*` |
| Pages | Page tab bar | `E/editor/shell/PageTabBar.tsx` |
| Pages | Inspector Page panel | `E/editor/inspector/components/PagePanel.tsx` |
| CMS | Dynamic pages pane (link page as collection template) | `E/editor/cms/DynamicPagesPane.tsx` |
| Templates | Catalogue, preview, confirm / success / error / backup-failed modals, apply progress overlay | `E/editor/sidebar/tabs/templates/*` |
| Templates | Canvas empty-state starters | `E/editor/canvas/CanvasEmptyCTA.tsx` |
| Onboarding | Achievement prompt (stacks on page create) | `AchievementPrompt.tsx`, `OnboardingMount.tsx` |
| Settings | Full-page host + router | `E/editor/sidebar/FullPageRouter.tsx`, `FullPageView.tsx` |
| Settings | Shell, nav, search, footer, guard | `settings/SettingsTab.tsx`, `constants.ts`, `searchIndex.ts`, `shared.tsx`, `hooks/*` |
| Settings | 14 screens | `settings/screens/*.tsx` |
| Settings | Slug change dialog; Add domain dialog | under `settings/components/` |
| Preview | Overlay; share modal | `E/editor/shell/PreviewOverlay.tsx`, `PreviewShareModal.tsx` |
| Export | Export modal, options, preview frame | `E/editor/export/*` |
| Publish | Panel, pre-publish checks list, confirm facts, gate banner, unpublish confirm | `E/editor/sidebar/tabs/publish/*` |
| Publish | Topbar CTA + status | `E/editor/shell/StudioHeader.tsx` |
| Publish | Gate modals (`PublishGateModal`, `StaleApprovalModal`, `PublishErrorsConfirmModal`, `PublishConfirmModal`) | `E/editor/shell/modals/*` |
| Publish | Publish history, publish diff | `E/editor/shell/PublishHistory.tsx`, `PublishDiffView.tsx` |
| Publish | Issues panel | `E/editor/shell/IssuesPanel.tsx`, `hooks/useIssuesFeed.ts` |
| Publish | Lifecycle derivation | `E/editor/shell/lifecycle.ts`, `hooks/useLifecycle.ts` |
| Review | Send for review; review tab | `E/editor/shell/SendForReview.tsx`, `sidebar/tabs/review/*` |
| History | Tab (Session / Saves) | `E/editor/sidebar/tabs/history/*` |
| History | Version panel, list, compare | `E/editor/panels/version-history/*` |
| History | Time-travel band | `E/editor/shell/TimeTravelHost.tsx` |
| History | Rendered compare | `E/editor/shell/CompareHost.tsx`, `compareSources.ts` |
| Save / recovery | Conflict modal | `E/editor/shell/modals/ConflictModal.tsx` |
| Save / recovery | Save failed banner; load error banner; recovery banner | `E/editor/shell/{SaveFailedBanner,LoadErrorBanner,RecoveryBanner}.tsx` |
| Save / recovery | Dirty registry; unload bypass | `E/editor/shell/{shellDirtyRegistry,unloadGuardBypass}.ts` |

---

## 3. Control traces

### Pages
| Control | UI → state | Validation | Persistence | Rendered result / break |
|---|---|---|---|---|
| Create blank | `NewPageModal` (Blank) → `elements.createPage(name)` (`:78`), `addPageToNavigation` (`:84`), `setActivePage` (`:85`) | Empty name disables Create (`:123`). No duplicate-name check. Slug made unique silently (`PageManager.ts:85`). No reserved slugs (`pages/utils/slug.ts:25-31`). No page-limit check on the client. | Autosave `sites.saveProject` | New active page. **Break:** over the plan limit the server refuses every subsequent save (`sites.service.ts:980-987`; `useComposerInit.ts:855-860`), see D-PG8. |
| Create from template | Catalogue → confirm → `runApply` → `createPage` → `setActivePage` → `importHTMLToActivePage` (`TemplatesTab.tsx:310-326`) | ADMIN + premium on the client only | Snapshot. `page.meta.appliedTemplates` (`PageManager.ts:191-207`) | **Break:** the page is created before the import. A failed import leaves an orphan, and Retry creates another (D-PG3). |
| CMS template page | `DynamicPagesPane.tsx:85-87` links an existing page via `pageTemplatePath` | Home page refused (`:47-53`; server BAD_REQUEST) | CMS collection | No "create template page" action. The Pages list shows read-only "+N from collections" (`PageList.tsx:348-358`). |
| Folder CRUD / move | `useFolders` updates local state first, then `pages.folders.*` | Server EDITOR (`page-folder.service.ts:33,40,82`) | Server per user × site, plus a localStorage cache | Folders are **personal grouping, not URL paths**, and not nestable (`types.ts:26-31`). Delete has no confirm or undo (`PageFolder.tsx:264-272`). **Break:** moving an unsaved page into a folder → `PAGE_NOT_FOUND` (`:82-83`), refetch, page drops out (inferred). |
| Reorder | Drop above/below → `elements.reorderPage` (`PageList.tsx:112-124`) | — | `position` in snapshot | Not available inside folders (`PageFolder.tsx:286-302`). No keyboard reorder (`PageRow.tsx:247-258`). |
| Duplicate | `elements.duplicatePage` (`usePages.ts:248`) | Unique "X Copy", `x-copy` | Snapshot | Toast with Open. ⌘D advertised (`PageContextMenu.tsx:114`) but not wired. |
| Rename | `PageRow` → `RenameUrlDecision` → `PagesTab.handleRenameCommit` → `elements.updatePage` (`usePages.ts:217`) | Case-insensitive duplicate-name check, UI only (`PagesTab.tsx:214-221`) | Snapshot | **Break:** gets stuck after a duplicate-name error (D-PG1). |
| Keep URL / Update URL | Keep: name only, toast "URL /x kept · Undo" (`usePages.ts:221-228`). Update: `slug: slugify(name)`, engine pushes `slugHistory` (`PageManager.ts:136-155`), opens settings with a redirect offer (`PagesTab.tsx:228-231`). | Slug made unique silently | `Page.slugHistory` (`sites.service.ts:1165-1183`). Redirect only when the user clicks "Add redirect" → Settings › Redirects → `Redirect` table (`S/services/redirect.service.ts:45-60`) → vercel.json at publish (`lib/publish-files.ts:135-139`) | **No automatic 301.** **Break:** the prefilled `from`/`to` are `/${slug}` (`SeoTab.tsx:37-39,149-150`), but the deploy serves `/<slug>.html` with no `cleanUrls` (`packages/shared/seo/urls.ts:5-9`), see D-PG2. |
| Delete | Confirm → `elements.deletePage` (`usePages.ts:299`) | Last and home page blocked in UI and menu (`usePages.ts:285-296`; `PageContextMenu.tsx:57-64`); last page also blocked on the server (`page.service.ts:128-129`) | Hard delete on next save: `deleteMany` page + formBlock rows (`sites.service.ts:1136-1146`) | Undo via the toast (`captureUndo`, `HistoryManager.ts:583-593`, refuses if anything newer happened) or ⌘Z within the session. Lost on reload; then only version restore. Folder membership not restored. |
| Set home | `setHomePage` (`PageManager.ts:249-262`) | None: a hidden page can be home | Snapshot | **Break:** a hidden home page hands the site root to another page silently (D-PG4). |
| Page settings Save | `usePageSettings` → `updatePage({settings})` | Slug normalised, lowercased, duplicate-checked (`usePageSettings.ts:213-235`); head-code check (`:85-94`) | Snapshot | **Break:** valid void `<meta>` / `<link>` rejected (D-PG5). |

### Page vs site precedence at export (`E/engine/export/SEOInjector.ts`, `ExportEngine.ts`)
| Field | Page | Site | Who wins |
|---|---|---|---|
| Title | `seo.metaTitle` | `Site.metaTitle`, `metaTitleTemplate` | Page title wrapped in the template, else site title (unwrapped), else page name wrapped (`:30-38`). Pages without a title all get the identical site title. |
| Description | `seo.metaDescription` | `Site.metaDescription` | Page, then legacy `settings.description`, then site (`:51`) |
| OG image | `seo.ogImage` (URL text field only) | `seo.defaultOgImage` / `Site.ogImage` | Page then site (`:129`). The Social tab preview ignores the site default (D-PG12). |
| Canonical | `seo.canonicalUrl` (no UI) | `Site.canonicalUrl` / server-built | Page if set, else server (`:133-138`) |
| robots | page `noIndex`/`noFollow` | `Site.allowIndexing`, `robotsTxt` | Merged; sitemap honours noindex |
| Head code | `settings.head` | `Site.headCode` (`customCode.headScripts`) | Both emitted. The site's comes after the page's (`SEOInjector.ts:234-235` vs `ExportEngine.ts:687-688,1024-1025`), so **site wins** conflicts. The comment at `SEOInjector.ts:231-233` claims the opposite. |
| Body code | — (no per-page body code) | `Site.bodyCode` | Site only (`ExportEngine.ts:718`) |
| Password | removed per page | `Site.publishedPassword` (Pro) | Vercel deployment protection at publish (worker `:321,401`) |

### Site Settings (save chain)
- **Footer screens:** edit → screen state → `buildNext` → shell `persistSettings` (`SettingsTab.tsx:566`) → `planSettingsSave` → `saveSiteSettings` → `settings.update` (Site columns) + `projectSettings.update` (project JSON) → toast "Saved · applies on next publish" → composer `adoptSavedProjectSettings`.
- **Applied on the live site:** only at next publish via the editor export (head/body code, analytics, meta) or the server (`publish-html.ts:100-123`; vercel.json redirects/headers via `publish-files.ts:135-162`).
- **Immediate screens:** Domains (Vercel API now), Redirects (DB now, live at next publish), Locales add/remove, Form submissions, Danger zone, Overview Unarchive.
- **Breaks:**
  - **D-ST1:** guard "Save and continue" bypasses client validation.
  - **D-ST2:** the name is pushed to the composer before the server accepts it.
  - **D-ST6:** the export reads stale composer values, not the server row.
  - **IA-13:** no conflict token.

### Preview
- **Chain:** eye → `UI_TOGGLE_PREVIEW` → `renderPreviewHtml` (exportHTML + CMS from the browser store) → `PreviewOverlay` srcdoc iframe, `sandbox="allow-same-origin"`, device local state (desktop).
- **Breaks:**
  - The editor device is not passed in (IA-09).
  - Scripts don't run (IA-08).
  - `renderPreviewHtml(...).then` has no catch (`AquibraStudio.tsx:293,874`), so a build failure is silent.
  - A page-switch race has no run-token (D-P15).
  - Preview CMS comes from the browser store while publish uses the server snapshot (`exportPublishPages.ts:87-90` vs `:161-165`).

### Publish
1. Click → `deriveLifecycleState` (`lifecycle.ts:281-421`) → `resolveGate` order (`:210-221`): shut doors → `open-errors` → `stale-approval` → `confirm`. The client blocks only for flag-off, viewer, offline, conflict, last save failed (`:236-243`).
2. Confirm modal: `PublishConfirmFacts` fetches checks; `PublishConfirmModal.tsx:149` disabled = `submitting || pageCount===0 || blockers.length>0`. **Enabled while loading or on fetch failure** (D-P3).
3. `exportPublishPages` (`exportPublishPages.ts:66-91`): live canvas or CMS scratch render; `cmsSyncBlocker`.
4. `publishSite` (`E/services/PublishService.ts:66-109`) → `sites.publish.mutate({siteId, pages, expectedLastEditedAt})`.
5. Router: EDITOR; `acknowledgeStale` needs ADMIN (`sites.ts:473-481`).
6. `startPublish`:
   - in-flight job check
   - deleted-site check
   - stale-copy check (`:392-397`)
   - approval gate (`:405-474`)
   - Vercel connection (`:485-488`)
   - **no `runPrePublishChecks`** (D-P1)
   - job QUEUED, site PUBLISHING, worker dispatched
7. Worker: QUEUED → BUILDING → DEPLOYING → `completePublish` (`publish.service.ts:640-650`; prunes payloads to 20). On failure: `steps: buildSteps(0,true)` (`route.ts:208`) and `lastPublishError` set.
8. `usePublishJob.ts`: polls every 2s; after 3 failures sets `pollLost` ("Check status"). The SSE route `D/app/api/sse/publish/[jobId]` is unused by the editor.
9. Outcome: toasts (`useExportHandlers.ts`), topbar flash, panel blocks.
10. `PublishHistory` → `sites.rollback` (ADMIN) → `startPublish(..., {bypassApproval, rolledBackFrom})` (`:806-823`); tracked via `onRollbackStarted` (`TabRouter.tsx:232`).

### History and recovery
- **Undo:** ⌘Z → `history.undo()` → `importScoped` (stays on the current page `HistoryManager.ts:428-436`) → `history:undo` → autosave. OK.
- **Session row restore:** confirm → `restoreEntry` → `importProject` (dirty=false) → `HISTORY_RECORDED`. **No autosave listener** (`useComposerInit.ts:906-909`), see D-H1.
- **Saved-version restore:** safety named version first (abort if it fails) → `importProject` → `version:restored` → autosave (`VersionTimelineManager.ts:282-324`). There is no server restore endpoint. ⌘Z is cleared (`HistoryManager.ts:131-158`); "Undo restore" exists only while the panel is mounted.
- **Conflict:** 409 `SAVE_CONFLICT:<iso>` → modal (Reload latest / Save a backup JSON / Overwrite… second confirm). Pending edit kept in `localStorage['bk-unsaved-v1-<siteId>']`.
- **Recovery toast:** on load, `readUnsaved` → "Restore my edits" → import + `PROJECT_CHANGED` → autosave with the fresh baseline. **No newer-on-server check** (D-H2).

---

## 4. State coverage

Legend: ✓ present (cite) · ✗ absent · ~ partial · n/a

| State | Pages panel | New page / templates | Page settings | Site Settings | Preview | Publish | History / versions | Save / recovery |
|---|---|---|---|---|---|---|---|---|
| empty | ✓ `PageList.tsx:146-171` | ✓ catalogue grid | n/a | ✓ Domains / Redirects empty lists | n/a | ✓ "Nothing has changed since the last deploy" | ✓ | n/a |
| loading | ✓ skeleton `:133-144` | ✓ progress overlay | ~ | ✓ LoadCard "Loading settings…" | ~ `previewLoading` cleared early (`StudioHeader.tsx:410-413`) | ✓ checksPending / "Checking review settings…" (`lifecycle.ts:333-337`); ✗ in confirm modal | ✓ | n/a |
| hover | ~ CSS only, not verified | ~ | ~ | ~ | ~ | ~ | ~ | n/a |
| focus | ✓ treeitem tabIndex (`PageRow.tsx:230-231`); ✗ arrow-key nav | ~ | ✓ | ~ focus leaks to background (UX-22) | ~ | ~ | ~ | n/a |
| selected | ✓ `aria-selected` / `aria-current` | ✓ | ✓ tab | ✓ nav item | ✓ device | n/a | ✓ | n/a |
| disabled | ✓ menu Delete with reason (`PageContextMenu.tsx:137-156`) | ✓ Create (empty name) | ✓ | ~ Save disabled, no reason (UX-21) | n/a | ✓ reasons (`PublishTab.tsx:517-526`) | ✓ viewer | n/a |
| read-only | ✓ panel hidden for VIEWER; ✗ ⌘K leak (D-PG6) | ✗ no role check in modal | ✗ | ✓ read-only banner + `SCREEN_MIN_ROLE` | ✗ Share offered to viewer (D-P10) | ✓ CTA disabled; ✗ Unpublish/Cancel offered to EDITOR (D-P5/6) | ✓ restore/delete disabled for VIEWER | ✓ autosave off in view mode (`useComposerInit.ts:627,664`) |
| validation-error | ✓ rename `nameError` (`PageRow.tsx:327`) | ✗ duplicate name | ✓ slug / head code | ✓ but premature (UX-21) | n/a | ✓ blockers | n/a | n/a |
| saving | ✗ global pill only | ✓ overlay | ✓ `aria-busy` | ✗ no "Saving…" (IA-13) | n/a | ✓ publishing; ✗ "Step N of M" (D-P11) | ~ | ✓ pill |
| saved | global pill | ✓ success modal | ✓ | ✓ toast | n/a | ✓ toast / flash | ✓ | ✓ "Saved · Xm ago" |
| unsaved | ✓ ● `isDirty` | n/a | ✓ guard modal | ✓ footer + guard | n/a | ✗ unsaved-not-yet-saving edits don't block (D-P14) | n/a | ✓ beforeunload (`StudioHeader.tsx:544-563`); ✗ after session restore (D-H1) |
| failure | ✓ load fail + Retry (`PageList.tsx:216-223`) | ✓ create error modal (but false copy, D-PG3) | ✓ toast | ✓ banner + Retry | ✗ silent (D-P15) | ✓ failure block + log (wrong step, D-P12) | ✓ toast | ✓ `SaveFailedBanner` |
| conflict | ✗ (global) | n/a | ✗ | ✗ (IA-13) | n/a | ✓ SAVE_CONFLICT; ✗ AI path (RR-02) | ✗ | ✓ `ConflictModal` |
| recovery | ✗ | ✗ orphan on failure | ✗ | ✗ | n/a | ✗ reload mid-publish loses state (D-P7) | ~ "Undo restore" ephemeral | ~ toast without freshness check (D-H2); banner mostly unreachable (D-H11) |

---

## 5. Ownership rows

| Property / action | Current editing location(s) | Value owner | Scope | Local / inherited / shared / overridden | Who may change it | Side effects | How the source is shown | Reset / revert | Applied vs saved vs published |
|---|---|---|---|---|---|---|---|---|---|
| Page name | Pages row rename; page settings; Inspector PagePanel | project JSON `pages[].name` → `Page.name` | page | local | EDITOR (server `sites.saveProject`); UI hidden for VIEWER, ⌘K leak | Optional slug change, `slugHistory`, redirect offer | Row label | ⌘Z / toast Undo (session); version restore | Canvas immediately; saved by autosave; live at publish. **Compare does not see it (HIST-01).** |
| Page slug / URL | Rename "Update URL"; page settings SEO | `pages[].slug` + `slugHistory` | page | local | EDITOR | **No automatic redirect**; suggested redirect has wrong paths (D-PG2) | Preview URL `.html` (`SeoTab.tsx:134`) | ⌘Z; slugHistory not user-visible | Live at publish; inbound old URLs 404 unless a redirect is added |
| Home page | Context menu "Set as home" | `pages[].isHomePage` | site (a page property with site effect) | local | EDITOR | Becomes `index.html`; **silently overridden if hidden** (D-PG4) | ⌂ icon (stays on the hidden page) | ⌘Z | Export picks the first live page if home is hidden |
| Page visibility (live / hidden) | Page settings Advanced | `settings.visibility` | page | local | EDITOR | Hidden pages excluded from deploy (`ExportEngine.ts:147-150,821`) | Row badge | ⌘Z | Publish only |
| Page SEO title / desc / OG | Page settings SEO / Social | `pages[].settings.seo.*` | page | **overrides** site defaults | EDITOR | — | Page dialog; Listings table uses a different rule (D-PG12) | Clear field → falls back to site | Publish |
| Site SEO defaults (title / desc / OG image) | Settings › SEO; dashboard SEO tab (read-only, shows home-page SEO, not site columns) | `Site.metaTitle/metaDescription/ogImage` | site | inherited by pages | ADMIN (client + server) | Pre-publish check grades them | Settings screen; no "inherited from site" hint in the page dialog | Clear → null | Publish (editor export + server) |
| Title template | **Nowhere** (D-ST4) | `Site.metaTitleTemplate` | site | inherited | n/a | Pre-publish warns "No meta title template set" with no way to fix | Dashboard shows a wrong default | n/a | Export |
| Head code | Page settings Advanced (page); Settings › Custom code (site) | `pages[].settings.head`; `Site.headCode` | page + site | **both emitted; site wins conflicts** | Page: EDITOR. Site: ADMIN + Pro (`site-settings.service.ts:160,306`) | Inline scripts stripped at export | Two separate surfaces, no cross-reference | Clear | Publish (editor export); stale composer can ship old site code (D-ST6) |
| Body code / global CSS | Settings › Custom code | `Site.bodyCode`; `projectSettings.customCode.globalCss` | site | — | ADMIN + Pro | — | Settings | Clear | Publish |
| Analytics IDs | Settings › Analytics | `projectSettings.analytics` (composer-sourced) | site | — | EDITOR | — | Settings (blocked if the status endpoint fails, D-ST5) | Toggle off | Publish |
| Redirects | Settings › Redirects; page SEO "Add redirect" offer | `Redirect` rows | site | — | EDITOR | — | Table | Delete row | Saved now; **live only at next publish** |
| Security headers | Settings › Headers | `Site.csp*/hsts*/…` | site | — | ADMIN | — | Settings | Clear | Publish (vercel.json) |
| Password protection | Settings › Access | `Site.publishedPassword` (hashed) | site | — | ADMIN + Pro | Vercel deployment protection | Settings | Turn off | Publish |
| Locales | Settings › Languages | `Site.defaultLocale/enabledLocales` | site | — | ADMIN | Only `<html lang>` ships; per-language pages PLANNED | Copy drift in nav subtitle (D-ST10) | — | Default: footer save → publish. Enabled list: immediate DB write |
| Site name | Settings › General; **dashboard Projects rename** (`D/app/dashboard/projects/page.tsx:186`, `sites.rename`) | `Site.name` | site | — | ADMIN (both) | Topbar name updates **before** save (D-ST2) | Topbar | Discard does not revert the topbar | Publish (og:site_name) |
| Site slug | Settings › General › Advanced (`SlugChangeDialog`) | `Site.slug` + `slugHistory` row | site | — | ADMIN | Pins Vercel project name (`site-settings.service.ts:310-324`); history row written even if update fails (D-ST8) | Dialog | — | Publish |
| Custom domain / primary | Settings › Domains; Publish panel Production row → Domains | `Domain` rows | site | — | ADMIN (`check`: EDITOR) | Vercel attach immediately; PENDING row even if attach fails non-409 (`domain.service.ts:383-397`) | Domains list + DNS records | Remove | Immediate |
| Archive / unarchive | Settings › Overview (Unarchive, **no gate**); Danger zone (**OWNER**); dashboard bulk (ADMIN) | `Site.archivedAt` | site | — | **Server ADMIN** (`sites.ts:165,177`) | — | Banner | Unarchive | Immediate. **Three competing role rules (D-ST3).** |
| Delete / transfer site | Danger zone | `Site` | site / workspace | — | Delete OWNER (`sites.ts:189`); transfer creator / OWNER | — | Confirm dialog | none | Immediate |
| Publish | Topbar; Publish panel; AI chat; failure toast | `PublishBuildJob`, `Site.status/publishedUrl/lastPublishedAt` | site | — | EDITOR (+ approval gate when `editsRequireApproval` && `agency_layer`) | Deploys **all** live pages (no page picker) | Topbar CTA label / status | Rollback (ADMIN) | Applied = live after worker completes |
| Approval | Review / client-review | latest unrevoked `ReviewRequest` | site | — | Reviewer | `acknowledgeStale` override ADMIN only, but offered to EDITOR (D-P2) | Gate banner | — | **Not bound to content**: unsaved edits can ship on an approval (D-P14) |
| Last published version | History › Published | Latest COMPLETED job (`log` holds pages; last 20 kept) | site | — | Rollback ADMIN | Rollback sets `lastPublishedAt=now`, so the editor thinks nothing is unpublished (D-P4) | `vN` label wrong after 20 (D-P13) | Republish older | — |
| Publish schedule | **No UI** | `ScheduledPublish` | site | — | EDITOR on the server; creation disabled | Cron still sweeps | — | — | PLANNED |
| Named version | History › Saves | IndexedDB + `SiteVersion` | site | per device + server mirror | create / rename / delete EDITOR (`site-version.ts`); list any member | Restore replaces pages, styles, **entire settings**, cmsBindings (`Composer.ts:888-906`) | Version list | "Undo restore" (ephemeral) / safety version | Restore persists only via autosave `saveProject`; column-backed site settings revert for non-ADMIN (D-H12) |
| Folders | Pages panel | `PageFolder` (per user × site) | **user** | personal | EDITOR | None on URLs | Panel | Folder delete has no undo | n/a (not published) |

Flags raised by this table:
- **Competing surfaces:**
  - Site name: dashboard rename vs Settings.
  - Archive: three rules.
  - Head code: page vs site; site silently wins.
  - SEO: page dialog vs site screen, with no inheritance indicator.
  - The dashboard SEO tab shows home-page SEO labelled as the site's.
- **Silent global effects:**
  - Hidden home page reassigns the root.
  - Restore replaces the entire settings object.
  - Rollback suppresses the "unpublished changes" state.
- **Misleading editability:**
  - Title template is graded but not editable.
  - Unarchive / Unpublish / Cancel / "Publish anyway" / Share preview are offered to roles the server refuses.
  - The "Preview deployment" row always shows "None" (`usePublishSnapshot.ts:183`).

---

## 6. Gap candidates vs Webflow

Webflow capabilities below are from memory; the doc agent should confirm them.

| Area | Buildrik evidence | Webflow capability | Classification | User impact | Suggested change | Priority |
|---|---|---|---|---|---|---|
| Slug change → 301 | Manual offer only; wrong `/slug` vs `.html` paths (D-PG2) | 301 redirects managed in Hosting settings; Webflow prompts to add a redirect on slug change, with clean URLs | Partial implementation + defect | Broken inbound links / SEO loss | Fix path form (or ship `cleanUrls`); auto-create redirect on Update URL with an undo | P1 |
| Folders | Personal grouping, not URL paths, not nested (`types.ts:26-31`) | Folders form URL paths (`/blog/post`), nestable, shared | Missing capability / intentional difference? | No URL hierarchy | Decide whether folders become path segments; at minimum label them "personal grouping" | P2 |
| CMS template pages | Link an existing page only (`DynamicPagesPane.tsx`) | Collection template page created automatically with each collection | Partial implementation | Extra steps, confusion | Auto-create a template page on collection create | P2 |
| Page password | Removed per page; site-wide only (Pro) | Per-page and per-folder password protection | Missing (intentional decision #21) | — | Keep, but document | P3 |
| Per-page body code | None | Page `<head>` and before `</body>` code | Missing capability | Page-specific embeds impossible | Add body slot | P3 |
| Per-page canonical / sitemap toggle | Canonical stored without UI; sitemap only via noindex | Sitemap exclusion per page; site-level canonical | Implemented but undiscoverable / partial | — | Expose canonical field | P3 |
| OG image upload | URL text field only (`SocialTab.tsx:75-77`) | Asset upload | Partial | Friction | Use media picker | P3 |
| Page keyboard ops | ⌘D / ⌫ advertised but unwired; no arrow-key nav or keyboard reorder | — | Inconsistent interaction | Accessibility; trust | Wire or remove hints | P2 |
| New-page flow | Default "template" browses; stacked dialogs (UX-03 / 04 / 26) | "+ page" creates a blank page inline immediately | Inconsistent interaction | Slow, confusing creation | Default to blank; pass `previewId`; one feedback owner | P1 |
| Staging / preview deployments | "Preview deployment" hard-coded `null` (`usePublishSnapshot.ts:183`) | webflow.io staging + custom domain; publish to selected domains | Missing capability (UI implies it exists) | Can't validate before prod | Hide the row or build a staging target | P1 |
| Publish selected pages | All live pages ship | Webflow can publish individual pages (paid plans) | Missing capability | — | Consider | P3 |
| Scheduled publish | Disabled `NO_RENDERER` (`scheduled-publish.service.ts:40-57`) | Scheduled publishing (CMS items, and site publishing on some plans) | PLANNED | — | Keep planned; remove cron sweep or guard it | P3 |
| Backups / restore | Named versions (local IDB + server mirror); no periodic auto-backup; no plan retention; no server restore; Overwrite loses other writer's work | Automatic backups on publish / interval; restore; named backups; retention by plan | Partial | Data loss risk | Periodic auto-snapshots; snapshot server state before Overwrite; server-side restore | P1 |
| Version compare | Misses page rename / SEO / styles / settings / moves (HIST-01) | Webflow has no visual diff | Differentiator but untruthful | Wrong restore decisions | Compare page metadata, styles and settings, or scope the label | P1 |
| Preview | Static, sandboxed, opens Desktop | Preview runs interactions at the current breakpoint | Partial (IA-08 / 09) | Can't verify interactions or mobile fast | Pass device; isolated scripted preview | P1 / P2 |
| Custom domains / DNS | Attach + DNS instructions + verify cron; no DNS hosting | Custom domains with DNS records shown; no DNS hosting | Parity (DNS CRUD PLANNED) | — | — | P3 |
| Site settings concurrency | Blind overwrite, no conflict (IA-13) | Site settings save explicitly | Missing state | Silent overwrite between admins | Version token | P2 |
| Site settings: title template, 404 page, timezone | Title template not editable; no 404 picker / timezone | Webflow: 404 page as a utility page; timezone in General | Missing / undiscoverable | — | Add title template field at least | P2 |
| Localization | Only `<html lang>`; per-language pages PLANNED | Webflow Localization (locales, subdirectories, translated content) | PLANNED | — | Clarify copy now (D-ST10) | P3 |
| Code export | HTML / ZIP / React; Vue / Next "Soon" | HTML / CSS / JS ZIP export (paid) | Parity / differentiator (React) | — | Preserve | — |
| Rollback | Redeploys an old build; does not touch the draft; ADMIN only | Restore backup, then republish | Intentional difference | Editor state misleading after rollback (D-P4) | Mark draft as differing from live | P2 |

---

## 7. Exists in code but hidden or poorly exposed

1. Single-template preview on open (`TemplatesOpenRequest.previewId`, `TemplatesTab.tsx:49,116-118`). Only ⌘K uses it; the canvas starters don't (UX-03).
2. Pages Listings table and Site structure tree: only via the ⋯ menu (`PagesTab.tsx:402-407`).
3. Per-page canonical URL: stored and exported (`SEOInjector.ts:133-138`), no UI.
4. `slugHistory`: recorded per page (`PageManager.ts:136-155`) but never shown, and not used to auto-generate redirects.
5. Page statuses `draft`, `scheduled`, `error` in the type (`pages/types.ts:11`), never set.
6. `Site.metaTitleTemplate`: applied at export and graded by pre-publish checks, no editor UI (D-ST4).
7. `localeAutoRedirect` column: stored, never read (SA-05).
8. Cookie-consent card: hidden; flag round-tripped (`AnalyticsScreen.tsx:4-7`).
9. Permissions-Policy header: in code, not on the board.
10. `?settings=` deep link cannot reach the workspace doors.
11. SSE publish stream `D/app/api/sse/publish/[jobId]` exists; the editor polls instead.
12. `Site.lastPublishError`: stored, never shown in the editor. A failure while away is invisible after reload.
13. `publishDiff`: only reachable via History.
14. Issues panel: only via the site menu or ⌘K (topbar chip removed by owner decision 11).
15. `ScheduledPublish` model + `sites.getScheduledPublish` + cron: no UI; creation disabled.
16. Two compare systems (CompareView element diff, CompareHost rendered diff) with different coverage; discoverability not assessed.
17. Time-Travel (⌃⇧T): keyboard-only entry, as far as traced.
18. Conflict "Save a backup" JSON: no in-app import path found (not verified).
19. `registerRetryLoad` prop on every Settings screen: never supplied by the shell (D-ST9), so dead plumbing.
20. `utils/keyboardShortcuts.ts` `shouldFocusSearch` in Pages: imported only by its test (dead).

---

## 8. Preserve

- **Settings shell architecture.** Explicit role table, plan table, scope table, read-only banner, plan lock, unsaved guard, search mode, and a "Saved · applies on next publish" toast that tells the truth about publish (`SettingsTab.tsx:621`, `settings/constants.ts`).
- **Site / workspace separation.** Members, Billing and Integrations are doors to the dashboard, not duplicated (`WorkspaceDoorScreen`).
- **Save conflict detection.** CAS on `lastEditedAt` inside the transaction (`sites.service.ts:1049-1092`). The three-way modal with a second confirm on Overwrite. Autosave held while a conflict is pending. Pending edits kept in localStorage.
- **Save robustness.** Chained saves, backoff retry + `online` retry, `ProjectNotLoadedError` refusal, beforeunload covering settings / CMS / mirror writes (`shellDirtyRegistry.ts`).
- **Saved-version restore safety.** Takes a named safety version first and aborts on failure (`VersionTimelineManager.ts:282-324`); copy states CMS / media are untouched (`VersionHistoryPanel.tsx:349-353`).
- **Rename Keep URL / Update URL decision.** Webflow-grade intent capture (`RenameUrlDecision.tsx`), plus `slugHistory`. Fix the paths, keep the flow.
- **Publish pipeline.**
  - Stale-copy refusal for the ordinary path (`PublishService.ts:80-87`).
  - Approval gate with shared copy.
  - Cancel-wins QUEUED→BUILDING CAS in the worker.
  - Job pruning.
  - Owner notifications.
  - Rollback via history.
  - `pollLost` "Check status".
  - Lifecycle gate ordering is explicit and testable (`lifecycle.ts`).
- **Pre-publish checks list and confirm facts.** Good model; just needs server enforcement.
- **Preview sandbox security choice.** Not enabling scripts with same-origin is correct. Keep it when adding an interactive mode on an isolated origin.
- **Code export to React.** Differentiator vs Webflow.
- **Rendered compare (approved / published / saved / current).** Differentiator once its coverage is truthful.
- **Pages panel states.** Skeleton, load-fail Retry, empty, no-results, delete-reason disabled menu items.

---

## 9. Defects found in code

Severity is a guess. All are CODE-level; none reproduced live. IDs: PG = pages / templates, ST = settings, P = preview / export / publish, H = history / recovery.

### Pages / templates
- **D-PG1 (High). Rename stuck after a duplicate-name error.**
  - `PageRow.tsx:106-110` sets `committedRef=true` before `onRenameCommit`. `PagesTab.tsx:214-221` rejects and keeps renaming.
  - `committedRef` only resets when `isRenaming`/`page.name` change (`PageRow.tsx:87-96`). `commitOnce` (`:113-114`) and Enter then no-op.
  - Scenario: rename "About" to an existing "Contact", error shows, fix to "Contact us", press Enter: nothing happens. Only Esc exits.
- **D-PG2 (High, SEO). Redirect offer uses paths the deploy doesn't serve.**
  - `SeoTab.tsx:37-39,149-150` builds `/${slug}`; `RedirectsScreen.tsx:381` saves it as-is.
  - The deploy serves `/<slug>.html`, no `cleanUrls` (`packages/shared/seo/urls.ts:5-9`). The server suggestion list has the same issue (`site-detail.service.ts:440`).
  - Old `/old.html` links get no redirect. Needs a live curl to confirm.
- **D-PG3 (High). Failed "new page from template" leaves an orphan, then a duplicate.**
  - `TemplatesTab.tsx:318-320` creates before import. On throw, the toast says "nothing was changed" (`:337`) and the modal says "Your pages are unchanged".
  - Retry (`:627`) creates a second page (`name-2`) because `addAsNewPageRef`/`pendingId` were not cleared.
- **D-PG4 (Medium). Hidden home page silently reassigns the site root.** `setHomePage` ignores visibility. Export drops hidden pages (`ExportEngine.ts:821-826`), and `resolveHomePageId` (`:172-195`) makes the first live page `index.html`. The panel still shows ⌂ on the hidden page.
- **D-PG5 (Medium). Valid void head tags rejected.**
  - `validateHeadCode` (`usePageSettings.ts:85-94`) counts `<meta …>` as unclosed, so Save is blocked.
  - The helper "Sanitized before save" (`AdvancedTab.tsx:96`) is false: raw text is saved (`usePageSettings.ts:252`) and sanitized at export (`SEOInjector.ts:234`).
- **D-PG6 (Medium). VIEWER can reach New page / templates via ⌘K.** `NAV_TAB_TARGET` lacks `new-page`/`replace-layout` (`CommandPalette.tsx:88-103,133-135,154`); `page-new` is registered for all (`StudioPanels.tsx:287-292`); `NewPageModal` has no role check. A local-only page is created, then refused or never saved.
- **D-PG7 (Medium). Inconsistent duplicate-name rules.** Rename refuses; create and engine accept (`NewPageModal.tsx:68-78`). "Update URL" silently uniquifies the slug (`PageManager.ts:136-139`) while the settings form shows an error.
- **D-PG8 (Medium). Exceeding the page limit blocks all saves.** No client limit; the server refuses saves with more pages (`sites.service.ts:980-987`). "Not saved — page limit reached" persists for every subsequent edit until a page is deleted.
- **D-PG9 (Low / Med). Advertised shortcuts unwired.** ⌘D / ⌫ (`PageContextMenu.tsx:114,141`) not handled (`PageRow.tsx:247-258`); `role=tree` without arrow keys.
- **D-PG10 (Low / Med). "Create blank page" and "+ Add page" open the modal on "From template"** (`PageList.tsx:158`, `AddPageButton.tsx:44-45`, `NewPageModal.tsx:52`).
- **D-PG11 (Low / Med). Folder membership fragile.** Unsaved page → `PAGE_NOT_FOUND` (`page-folder.service.ts:82-83`). Delete prunes folder membership (`PagesTab.tsx:103-105`), and undo restores the page at top level.
- **D-PG12 (Low). Previews diverge from export.** Social preview ignores the site default OG (`SocialTab.tsx:26-30` vs `SEOInjector.ts:129`). Listings table uses `metaTitle || page.name` and its own score (`SearchListingsTable.tsx:40-58`) vs `usePageSettings.ts:320-321` + `utils/seoScore.ts`. This is duplicated logic.
- **D-PG13 (Low). "Add redirect" bypasses the page-settings unsaved guard** (`SeoTab.tsx:165-170` vs `PageSettingsDrawer.tsx:92-98`). Possible silent loss of other unsaved fields. Not verified.
- **D-PG14 (Low). EDITOR in the default New-page path hits "Only an admin can apply a template"** (`TemplatesTab.tsx:153-162`), a dead end. The ADMIN rule is client-only; the server allows EDITOR.
- **Stale comments:** `PagesTab.tsx:78` (folders "localStorage-persisted"), `:526-529` (delete "raises no toast"), `SeoTab.tsx:140` (autosave), `SEOInjector.ts:231-233` (page code wins).

### Site Settings
- **D-ST1 (Medium). Guard "Save and continue" skips client validation** (`SettingsTab.tsx:595,659`). An empty name is dropped from the patch (`BuildrikSyncProvider.ts:330-331`) yet reported as success. Composer adopts `seo.siteName=""`, which feeds `{site_name}`/`og:site_name` (`SEOInjector.ts:69,174`) until reload.
- **D-ST2 (Medium). Site name pushed to the composer before save** (`SiteSettingsScreen.tsx:300` → `Composer.ts:1148-1155`). Failure or Discard (`SettingsTab.tsx:516`) leaves the topbar showing the unsaved name.
- **D-ST3 (Medium). Archive / unarchive has three role rules.** Overview Unarchive is ungated (`OverviewScreen.tsx:221-241`); Danger zone is OWNER (`DangerZoneScreen.tsx:246,277,290`); server and dashboard are ADMIN (`sites.ts:165,177,266-267`).
- **D-ST4 (Medium). `metaTitleTemplate` is not editable anywhere but graded** (`publish.service.ts:98-99`). The dashboard shows a wrong default (`seo-tab.tsx:68`).
- **D-ST5 (Medium). Analytics IDs uneditable when the `analyticsStatus` read fails** (`AnalyticsScreen.tsx:221-224,317`).
- **D-ST6 (Medium). Publish ships stale composer copies of site settings.** Screens re-read the server row but the export reads the composer (`ExportEngine.ts:635-719,984-1050`). The server only fills icons / og:image if missing (`publish-html.ts:72-88`). Another admin's head-code / favicon change is overwritten at this session's publish.
- **D-ST7 (Low). Direct `updateSiteColumns` writes don't advance `_baselineSiteColumns`** (`BuildrikSyncProvider.ts:542`). Redundant `defaultLocale` re-send and an extra activity entry.
- **D-ST8 (Low). `slugHistory.create` runs before the slug update and swallows errors** (`site-settings.service.ts:326-332`). A phantom history row is left when the update fails.
- **D-ST9 (Low). `registerRetryLoad` never supplied** (dead plumbing, `useServerLoad.ts:28`).
- **D-ST10 (Low). Copy drift.**
  - Languages nav subtitle vs screen (`constants.ts` `SETTINGS_NAV` vs `LocalizationScreen.tsx:228-236`).
  - Custom code header claims the worker injects head / body code (`AdvancedScreen.tsx:6-8`), but the worker doesn't select them (`route.ts:286-303`).
  - SiteMenu comment `⌘,` vs label `⌃,`.
- **D-ST11 (Low). Rule violations.** Banned `../../../../../` imports (`settings/hooks/useSettingsScreen.ts:12-14`; also `PublishTab.tsx:34,40`). Duplicated inline rename schema (`sites.ts:120` vs `packages/shared/schemas/sites.ts:10`).
- **D-ST12 = UX-22.** Background focusable under the full-page overlay.
- **D-ST13 = IA-13.** No conflict token on site settings, so concurrent admins overwrite silently.

### Preview / Export / Publish
- **D-P1 (High). Server never runs `runPrePublishChecks` in `startPublish`** (`publish.service.ts:330-566`). Only Vercel connection (`:485`) and zero-pages (client) are enforced. An unbound Collection list (`:210-224`) can publish via D-P3, D-P9, AI or a failed checks fetch.
- **D-P2 (Medium). "Publish anyway" on stale approval is offered to EDITOR** (`lifecycle.ts:396-405`, `StaleApprovalModal.tsx:245-251`), but the server requires ADMIN (`sites.ts:473-481`), so FORBIDDEN. That path also skips the facts confirm and checks (`AquibraStudio.tsx:897-900`).
- **D-P3 (High, combined with P1). Confirm "Publish now" is enabled while checks load or after the fetch fails** (`PublishConfirmModal.tsx:149`; `PublishConfirmFacts.tsx:137` `.catch(()=>null)`).
- **D-P4 (Medium). After rollback the editor says nothing to publish** (`publish.service.ts:648` `lastPublishedAt=now`; `PublishService.ts:223`; `lifecycle.ts:415` returns null). The draft is newer than live but the CTA is hidden.
- **D-P5 (Medium). Unpublish offered to non-admins in the Publish panel ⋯ menu** (`PublishTab.tsx:421`; server ADMIN `sites.ts:666`).
- **D-P6 (Medium). Cancel offered to EDITOR; server ADMIN** (`PublishTab.tsx:755` vs `sites.ts:575`).
- **D-P7 (Medium). Reload mid-publish hides the job and the live state.**
  - `isPublished` requires status PUBLISHED (`PublishService.ts:221`), and no `track()` runs for an active job on mount (`usePublishJob.ts:323-343`).
  - The topbar says "Not live yet". Publish click → CONFLICT. `lastPublishError` is never read.
- **D-P8 (Medium). Unpublish reports success even if the Vercel take-down failed** (`publish.service.ts:878-885`). No in-flight-job check, so a concurrent publish re-publishes.
- **D-P9 (Medium). Failure-toast "Try again" publishes with no gate, confirm or checks** (`useExportHandlers.ts` `runPublishRef.current(false)`).
- **D-P10 (Medium). Share preview offered to viewers** (`PreviewOverlay.tsx:198`); `sharing.create` requires EDITOR (`site-detail.ts:549`), so FORBIDDEN.
- **D-P11 (Low). "Step N of M" never renders.** Panel looks for `"running"` (`PublishTab.tsx:307`), the worker writes `"active"` (`route.ts:48`).
- **D-P12 (Low). Failure log always says step 1** (`route.ts:208` `buildSteps(0,true)`).
- **D-P13 (Low). Version numbering wrong after 20 publishes** (`publish.service.ts:786,791` `jobs.length - i`).
- **D-P14 (Medium). Unsaved, not-yet-saving edits can ship under an approval.** `settledBaselineLastEditedAt` waits only for an in-flight save (`BuildrikSyncProvider.ts:219-222`). Export reads the live canvas (`exportPublishPages.ts:75`); approval compares server `lastEditedAt` (`publish.service.ts:459`).
- **D-P15 (Low). Preview build failure is silent; page-switch race** (`AquibraStudio.tsx:293,874` no catch / no run token; `StudioHeader.tsx:410-413` clears loading early).
- **RR-02 / RR-03:** see the re-check table; both are defects too.

### History / recovery
- **D-H1 (High). Session-row and Time-Travel restore are never autosaved.** `restoreEntry` → `importProject` (dirty=false, `Composer.ts:867-868`) → `HISTORY_RECORDED` (`HistoryManager.ts:816`). Autosave listens only to `project:changed`/`history:undo`/`history:redo`/`version:restored` (`useComposerInit.ts:906-909`). No beforeunload warning. A reload reverts the restore; the truncated steps are gone.
- **D-H2 (High). "Restore my edits" has no newer-on-server check.**
  - `useComposerInit.ts:326-377` never compares `unsaved.at` to the loaded `lastEditedAt`. The autosave uses the fresh baseline, so the CAS passes.
  - A stale offline copy silently overwrites a teammate's newer save. `unsavedRecovery.ts:35-43` documents the risk but guards only the reload / backup path.
- **D-H3 (Medium). Conflict "Overwrite" keeps no snapshot of the overwritten server state** (`AquibraStudio.tsx:853-857`).
- **D-H4 (Medium). Named versions grow without bound.** Safety versions are named (`VersionTimelineManager.ts:166,298-301`); prune deletes only auto-saves (`VersionHistoryStorage.ts:207-209`; `site-version.service.ts:110-118`); `autoCheckpointEvents: []`. Server payload has no size cap (`packages/shared/schemas/site-version.ts`).
- **D-H5 (Medium). Version list drifts between devices.** Hydrate only adds (newest 20, `versionSync.ts:117,187`). Failed create-mirrors are queued in memory only (`versionSync.ts:128-130`), so a reload strands local-only versions. The toast "a reconnect replays the queue" (`useVersionSync.ts:72-74`) is false after reload.
- **D-H6 (Medium) = HIST-01 and wider compare blind spots.**
- **D-H7 (Low / Med). ⌘Z bypasses read-only during Time-Travel.** Undo is not routed through CommandCenter (`defaultCommands.ts:60-67`; `useEditorShortcuts.ts:188-193`), contrary to the comment at `TimeTravelHost.tsx:89-99`.
- **D-H8 (Low). Undo reverts off-screen page edits without navigating** (`HistoryManager.ts:428-436`).
- **D-H9 (Low). Undo of settings changes may be a visible no-op.** `importScoped` restores only tokens / presets / darkMode (`HistoryManager.ts:412-427`).
- **D-H10 (Low). Inconsistent restore safety.** Time-Travel continues on checkpoint failure (`TimeTravelHost.tsx:221`); the Session row takes no safety copy (`ActivityView.tsx:296-311`).
- **D-H11 (Low). RecoveryBanner misleading / unreachable.**
  - The crash marker fires on any unhandled rejection (`RecoveryManager.ts:86-100`).
  - It shows only on load failure (`AquibraStudio.tsx:682`), when the freshness fetch probably also fails.
  - "Keep changes" keeps a draft that cannot save.
  - It reads the global `localStorage['buildrick-project']` (`useComposerInit.ts:483`).
- **D-H12 (Low, inferred). Version restore of column-backed site settings reverts on reload for non-ADMIN** (`BuildrikSyncProvider.ts:866-878`).

---

## 10. Live checks needed

Target: `http://localhost:3300/edit/<siteId>` at 1440×900. Use an ADMIN account unless stated; EDITOR and VIEWER members are needed for role checks.

**Steps marked REAL DEPLOY need owner OK.** The QA workspace publishes to real Vercel.

1. **UX-03.** On an empty page, click `[data-testid="canvas-empty-template-site-saas-landing"]`.
   - Expected (defect): `[data-testid=tpl-workspace]` shows `.tpl-grid`, and `[data-testid=tpl-ws-preview]` is absent.
2. **UX-26 / D-PG10.** Click "+ Add page".
   - Expected: `[data-testid=new-page-source-template]` has `aria-checked="true"`.
   - Type "Pricing", click `[data-testid=new-page-create]`. Expected: no new row in the Pages list (count unchanged), and the catalogue opens.
   - As ADMIN, pick a template, then Create page. Expected: `[data-testid=tpl-create-confirm]` text contains "Pricing".
   - Repeat as EDITOR. Expected: "Only an admin can apply a template".
3. **UX-04.** Continue step 2 and confirm.
   - Poll every 16 ms: `document.querySelector('[data-testid=tpl-applying-card]')`, `[data-testid=tpl-create-success]`, `#achievement-title`.
   - Expected (defect): at least one frame where the first two coexist; `#achievement-title` present too if the onboarding checklist is active. Count toasts in the toast region.
4. **D-PG1.** Rename a page to another page's exact name and press Enter.
   - Expected: `.bd-pg-name-error` appears.
   - Change the text to a unique name and press Enter. Expected (defect): the input stays; no `sites.saveProject` in Network within 5 s.
5. **Keep / Update URL + D-PG2.**
   - Rename "About" to "Our story" and click `[data-testid=page-rename-keep-url]`. Expected: toast "URL /about kept".
   - Repeat with `[data-testid=page-rename-update-url]`. Expected: `[data-testid=pg-drawer]` opens, and `[data-testid=page-seo-redirect-offer]` reads "/about → /our-story" while the preview URL above ends in `.html`.
   - Reload, then evaluate `composer.elements.getAllPages().find(p=>p.name==="Our story").slugHistory[0].slug === "about"`.
6. **Delete + undo.** Delete a non-home page via `pages-menu-delete` and confirm.
   - Expected: toast "X deleted · Undo"; clicking Undo restores the row.
   - Repeat, wait for `sites.saveProject`, reload. Expected: page gone; ⌘Z is a no-op.
   - If the page was in a folder, check whether it returns at the top level (D-PG11).
7. **D-PG5.** Page settings › Advanced: put `<meta name="robots" content="noarchive">` in `[data-testid=adv-input-head]` and click `pg-drawer-done`.
   - Expected (defect): toast "Unclosed HTML tag detected"; dialog stays open.
8. **D-PG4.** Set page B as home, then set B's visibility to Hidden.
   - Expected: B still shows ⌂ in the list.
   - Open Export modal → HTML preview / file list. Expected (defect): another page is `index.html`.
9. **D-PG6.** As VIEWER, press ⌘K and type "New page".
   - Expected (defect): the row is present, and selecting it opens `[data-testid=new-page-modal]`; creating adds a local row; no `sites.saveProject` (or a 403) in Network.
10. **Settings entry + UX-22.**
    - Press Ctrl+, (or ⌘+,). Expected: `[data-testid=set-host]` appears.
    - Then evaluate `document.querySelector('header[role=banner]').inert` (expected `false`) and `document.querySelector('[data-testid=set-host]').getAttribute('role')` (expected `null`).
    - Press Tab 30 times, logging `document.activeElement.closest('header[role=banner], .layout-shell__rail, .bd-skip-link')`. Expected (defect): non-null hits.
11. **UX-21.**
    - As ADMIN, set the name through the console tRPC client: `siteDetail.settings.update({siteId, name:"a "})`.
    - Open Settings › General. Expected: `#site-name[aria-invalid="true"]`, a `role=alert` helper, and `[data-testid=set-foot-status]` text "All changes saved"; `[data-testid=set-foot-save]` disabled.
    - Measure `getComputedStyle(document.querySelector('#site-name')).borderColor` (red token).
12. **IA-13 (saving / conflict).**
    - Throttle to Slow 3G. Edit SEO title and click Save. Expected (defect): footer status stays "Unsaved changes", never "Saving…".
    - Open a second tab and save a different SEO title; then save from tab 1. Expected (defect): no conflict UI; `siteDetail.settings.get` returns tab 1's value.
13. **D-ST1 / D-ST2.**
    - Clear Site name and click Back to canvas → "Save and continue". Expected: the `siteDetail.settings.update` payload lacks `name`; the dialog closes with success; `composer.getProjectSettings().seo.siteName === ""`.
    - Separately, go offline, change the name, Save. Expected: the topbar name changes while the footer says "Not saved". Click Discard: the topbar keeps the new name.
14. **D-ST3.** On an archived site as EDITOR, open Settings › Overview.
    - Expected: `[data-testid=set-ov-unarchive]` enabled; clicking returns a FORBIDDEN error.
    - As ADMIN, Danger zone Unarchive is disabled while the server would allow it.
15. **IA-09 / UX-11.** Switch canvas to Mobile and click the topbar eye.
    - Expected: `[data-testid=preview-overlay]` with Desktop selected; `document.querySelector('[data-testid=preview-overlay] iframe').getBoundingClientRect().width` ≈ 1320 (not 375).
    - Choose Mobile, `[data-testid=preview-back]`, reopen. Expected: Desktop again.
16. **IA-08.** In preview, `iframe.getAttribute('sandbox') === "allow-same-origin"`.
    - On a page with an accordion or interaction, click the trigger. Expected: no state change (compare `iframe.contentDocument.body.innerHTML` before and after).
17. **D-P10.** As VIEWER, open preview → `[data-testid=preview-share-button]`.
    - Expected: Network shows `siteDetail.sharing.list` 200 then `sharing.create` 403; an error shows in the modal.
18. **RR-03.** DevTools request-block `*sites.prePublishChecks*`. Use a site whose only problem is a server check (no favicon or no Vercel).
    - Open Issues via `[data-testid=site-menu-issues]`. Expected (defect): "No issues." with `role=status` and no error banner.
19. **D-P3 / D-P1.** Add a Collection List with no collection; save.
    - Expected: the Publish panel footer CTA is disabled with the "Collection lists" fail row.
    - Throttle network, click the topbar Publish CTA. Expected (defect): while `sites.prePublishChecks` is pending, the "Publish now" button in `[data-testid=publish-confirm]` has no `disabled` attribute. **Do not click (REAL DEPLOY).**
20. **D-P5 / D-P6.** As EDITOR on a live site, open the Publish panel → `[data-testid=publish-menu]`.
    - Expected (defect): "Unpublish site…" present. Do not confirm.
    - The site menu shows no Unpublish row.
21. **D-P7 / D-P11 / D-P12 (REAL DEPLOY).** Start a publish on an already-live site.
    - Poll `sites.publishStatus`. Expected: steps use `status:"active"`; the panel shows only a percentage, no "step N of M".
    - Reload during BUILDING. Expected: the topbar hint says "Not live yet."; `sites.get.status === "PUBLISHING"`; clicking Publish gives CONFLICT.
22. **D-P4 (REAL DEPLOY, ADMIN).** History → Published → Republish an older version; wait for completion.
    - Expected (no-review workspace): the topbar publish CTA is hidden and the panel says "Nothing has changed since the last deploy", while the canvas differs from live.
    - Verify `sites.get.lastPublishedAt > lastEditedAt`.
23. **RR-02.** With `NEXT_PUBLIC_FEATURE_PUBLISH` unset, ask the AI tab to "publish the site".
    - Expected (defect): a confirm card with a Publish action appears. Inspect the `actions.propose` / `actions.confirm` request body: no `expectedLastEditedAt`. **Do not confirm (REAL DEPLOY).**
24. **Export.** As EDITOR: Site menu → `[data-testid=site-menu-export-code]`.
    - Expected: `[data-testid=export-modal]` opens; Vue and Next.js pills `aria-disabled="true"` with "Soon".
    - As VIEWER in view mode, check whether ⌘K "Export" opens the modal (not verified in code).
25. **HIST-01.** History › Saves → Save version "A". Rename page "Home" → "Home 2" with no other change. Open "Compare with current".
    - Expected (defect): `.version-compare-detail` text contains "The current draft matches".
    - Repeat for: layer rename, section reorder, Settings › SEO title change.
26. **D-H1.** Make 3 edits and wait for `sites.saveProject`. History → Session → click the first entry and confirm.
    - Expected (defect): no new `sites.saveProject` within 10 s; the save pill does not show unsaved; closing the tab shows no beforeunload prompt.
    - Reload. Expected: the post-edit state is back.
27. **Saved-version restore.** With a pending edit, restore "A".
    - Expected: `siteVersions.create` with name `Before restoring "A"`, then `sites.saveProject`; ⌘Z disabled; "Undo restore" brings the edit back.
28. **Conflict (two tabs) + D-H3.** Tabs T1 and T2. Edit in T1 and let it save; edit in T2.
    - Expected: T2 `sites.saveProject` 409 with message `SAVE_CONFLICT:<iso>`; conflict modal with 3 actions; `localStorage['bk-unsaved-v1-<siteId>']` present in T2.
    - Choose Overwrite and confirm; reload T1. Expected: T1's edit gone, with no new row in Saves.
29. **D-H2.**
    - T1: DevTools offline, edit, see "Offline — not saved"; `bk-unsaved-v1-<siteId>` exists.
    - T2 (online): a different edit, saved.
    - T1: go online, reload, click "Restore my edits". Expected (defect): `sites.saveProject` 200, no conflict; reloading T2 shows T2's edit overwritten.
30. **D-H5.** Profile P1: delete a saved version. Profile P2: open the site.
    - Expected (defect): the version is still listed in P2. Compare `siteVersions.list` with IndexedDB `aquibra-versions` › `versions` filtered by `projectId === siteId`.
31. **Viewer history.** As VIEWER, History › Saves.
    - Expected: Restore / Delete / Rename / Save disabled with tooltips; Compare and Time-Travel work.
    - Console `siteVersions.delete` → FORBIDDEN.
32. **D-H7.** Press ⌃⇧T, ← once, then ⌘Z.
    - Expected (defect): the live document changes (`history:undo` fires); the band exits.

### Not verified, and what would settle it
- Whether `/slug` without `.html` 404s on a deployed site: needs a real publish + curl.
- CompareHost coverage of `<title>` / meta / rename: step 25 using the rendered Compare instead.
- Whether exported forms submit anywhere: export a ZIP and submit a form.
- Whether ⌘K Export is blocked for viewers.
- Whether the tRPC error formatter hides INTERNAL_SERVER_ERROR messages on the AI path.
- Autosave debounce length (sets the D-P14 window).
- Hover styles across all panels.
- Whether the Save-a-backup JSON has any import path.
- Whether undo records site-settings changes at all (D-H9).
- Webflow capabilities in §6 are from memory; the doc agent should confirm them.
