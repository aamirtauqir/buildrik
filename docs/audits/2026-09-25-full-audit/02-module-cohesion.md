# 02: Module Cohesion, Feature Relevance and Functional Ownership

Agent B (Product Architecture) · Playbook **Prompt 2** · 2026-09-25 · **READ-ONLY**

**Scope:** for each of these 18 modules, what it is for, what it owns, what it should not own, and where the same job is done in more than one place:

Add, Layers, Pages, Assets, CMS, Components, Brand, Inspector, AI, Review, Issues, History, Activity, Publish, Settings, Templates, Media, Collaboration.

I traced them across `packages/editor`, `packages/dashboard`, `server`, `prisma`, `packages/shared` and `lib`. To decide whether two things are duplicates, I compared intent, scope, trigger, destination, handler, state mutation and outcome. Looking the same was not enough.

Path shorthand: `E/` = `packages/editor/src/`, `D/` = `packages/dashboard/`, `S/` = `server/`.

---

## Method & runtime status

**What I ran**
- I read the code along each path, from the UI control through the handler, hook, service, tRPC call and server service to Prisma. Every finding cites the `file:line` that proves it.
- `pnpm --filter @buildrik/editor exec vitest run src/services/__tests__/buildrik-sync-provider.test.ts`: **43/43 passed**. This suite shows the dual-save routing behind A02-1: `saveProject` sends Site-column fields to `siteDetail.settings.update` next to `sites.saveProject`.
- `node D/scripts/check-trpc-orphans.mjs`: PASS, with 286 procedures and 29 allowlisted orphans. I checked this result against my own greps. It misses some real orphans (see A02-13 and A02-19).
- grep and ripgrep for callers, mounts and flags. Every "no caller" claim below comes from grepping `E/`, `D/`, `S/` and `lib/`, with tests excluded.

**NOT RUNTIME VERIFIED**
- Nothing here was checked in a running app. There is no Postgres and no browser in the sandbox.
- Every finding is **static proof from code** (plus the one unit suite above), not an observed runtime failure.
- The scenarios in A02-1 and A02-2 (two surfaces or two tabs, and a non-admin editor) need a live two-tab walk to confirm.

**Where the inventory (00-inventory.md) is wrong** (confirmed in code):
1. **`?rail=` is not reachable in production.** `resolveRailMode` returns `"figma"` whenever `!IS_DEV_BUILD` (`E/shared/utils/editorViewMode.ts:69-74`). The e3 and legacy rails are dev-only, so `StructurePopover` and the topbar "Ask AI" are **dev-only** as well.
2. **CMS dynamic pages have a UI.** It is `DynamicPagesView` (`E/editor/sidebar/tabs/content/ContentTab.tsx:308-325`) plus `CMSCollectionSetupModal.tsx:229`, and publishing expands those pages (`S/services/cms.service.ts:229-246`, called from `publish.service.ts`). Only the server *preview* procedures `cms.dynamicPages` and `generateDynamicPages` have no caller.
3. **`MediaLibraryPanel` is not a third "full library".** It is the inspector's single-field **picker** (`E/editor/media/MediaLibraryPanel.tsx:1-27`). That is a different intent (choose one image for one field) and a legitimate temporary surface.
4. **The dashboard publish page is no longer linked.** `D/app/dashboard/sites/[id]/layout.tsx:67-75` sends Publish to the editor. The route at `/dashboard/sites/[id]/publish` still ships, reachable only by URL (A02-4).

---

## Module table (Prompt 2 output)

Priority is the highest finding for the module. K/M/R/Mg means Keep / Move / Remove / Merge.

| Module | Primary job | Owned responsibilities | Current features (as found) | Relevant | Questionable | Misplaced | Duplicate entry points | Correct owner | K/M/R/Mg | Proof | Pri |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Add** | Put new content on the page | Element/block/component insertion, paste HTML | `BuildTab` groups ELEMENTS / BLOCKS / COMPONENTS / MINE, search, Paste HTML, tips | All four groups; Paste HTML | MINE copies the Components insert logic | — | ⊕ toolbar `BlockPickerModal` (a different insert pipeline); `CanvasEmptyCTA` (a valid router) | Add | Keep; **merge** BlockPicker onto the Add pipeline | `BuildTab.tsx:85-99`; `BlockPickerModal.tsx:41-124`; `useBlockInsertion.ts:23-117` | P2 |
| **Layers** | Navigate and reorder the tree | Tree, select, reorder, rename, visibility | `LayersTab` → `LayersPanel` | Yes | — | — | `StructurePopover` uses the same `LayersPanel` but is **dev-only** in prod | Layers | Keep; remove the popover (or ship it on purpose) | `StructurePopover.tsx:1-18`; `StudioFooter.tsx:215`; `editorViewMode.ts:69-88` | P3 |
| **Pages** | Site page structure | Create, rename, reorder, delete pages; page settings (SEO, slug); new page from template | `PagesTab`, page-settings (with AI SEO title), `PageTabBar` switcher | Yes | AI title generation through the generic `ai.content` | — | `PageTabBar` is a valid secondary entry | Pages | Keep | `SeoTab.tsx:99` | P2 (A02-14) |
| **Assets (Media Quick)** | Drop an asset onto the page fast | Browse, upload, insert, quick detail | `MediaTab` + `AssetDetailOverlay` (alt text, edit, optimize) | Browse, upload, insert | **A second full asset-detail editor**, with its own alt-text AI (filename-based) | Alt-text authoring belongs to the library | "Manage library" leads to Full Media | Assets launcher; detail editing belongs to Full Media | Keep the launcher; **merge** detail into Full Media | `AssetDetailOverlay.tsx:274-293` | P2 |
| **Media (Full)** | Manage the site's media | Folders, versions, tags, alt text, replace-across, usage | `LibraryManager` (1199 lines) + `AssetDetailsPanel`; the dashboard `/dashboard/media` library; `MediaLibraryPanel` picker | Yes | Ownership is **per uploader user**, not per site or workspace | Quota comes from the user's *oldest* workspace | Editor library and dashboard library (different scopes, same user-scoped backend) | Site/workspace-owned media | **Change the owner scope** | `S/services/media.service.ts:24-31,87-90,285-398` | **P1** |
| **CMS** | Structured content | Collections, fields, records, sources, variables, dynamic pages | `ContentTab`, `CMSRecordsModal`, `CMSCollectionSetupModal`, `DynamicPagesView` | Yes | Dynamic pages are invisible to Pages | — | ⌘⇧P "Manage CMS records" (valid shortcut) | CMS owns collections; Pages should *show* generated routes | Keep | `ContentTab.tsx:308`; `PagesTab` has no CMS reference (grep) | P2 |
| **Components** | Reusable site components | Create, instantiate, rename, delete, detail | Off-rail `ComponentsTab`; Add → MINE; Brand → Components (read-only summary); dashboard agency library | Manage is a real job | **Three owners** in the editor; config says it "folds into Brand", while v3 IA says it lives in Add | — | ⇧A, ⌘K, Add MINE, Brand CTA, site menu | **PRODUCT DECISION** | Merge | `tabsConfig.ts:75-86,155-173,345-352`; `ComponentsSection.tsx:1-18` | P2 |
| **Brand** | The site's design system | Tokens, presets, starters, lint, DS-AI (flagged) | `DesignSystemTab` (989 lines), 7 destinations | Yes | Lint is duplicated into Issues | — | Rail and site menu (fine) | Brand | Keep | `DesignSystemTab.tsx:14`; `AquibraStudio.tsx:304-329` | P3 |
| **Inspector** | Configure the selection | Style, props, bindings, detach | `ProInspector` + sections | Yes | "Ask AI" button (one of 7 AI-chat doors) | — | — | Inspector | Keep | `ProInspector.tsx:404` | P3 |
| **AI** | Assisted editing and generation | Selected-element prompt, chat/agent, DS-AI, alt text, SEO copy, history summary and milestones, onboarding generation | `AiPromptPopover` (✨), `AITab`, DS-AI (flag), 2 alt-text engines, `SeoTab` title, `useAISummary`/`useAutoMilestone`, onboarding worker | Selected-AI, chat, onboarding | Dead client paths `generatePage`, `generateLayout`, `generateCode`, `improveContent`; the filename alt path | — | 7 ways into the chat panel | Selected-AI goes with the selection; chat is its own surface; media AI belongs to Media | Keep; remove the dead paths | `openai.ts:118-166`; `AiTrpcClient.ts:200-224`; the `ui:switch-tab {tab:"ai"}` emitters (7) | P2 |
| **Review** | Client/stakeholder approval loop | Send for review, rounds, approve/request changes, compare to approved, comment list | `ReviewTab` (1071 lines), `ReviewBar`, `SendForReview`, gate modals; dashboard queue; `/review/[token]` | Yes | Comments (ungated) have their only list here (the agency-gated concept) | — | ReviewBar, site menu, CommentLayer, PublishGateModal | Review | Keep | `S/trpc/routers/reviews.ts:58-130`; `comments.ts:34-87` | P2 (A02-11) |
| **Issues** | What is wrong with the site right now | Should cover content, SEO, a11y, links and DS problems | `IssuesPanel`, fed **only** by DS lint | Weak | Duplicates Brand lint; misses the page and SEO checks that 3 other evaluators compute | — | — | One validation service feeding Issues and pre-publish | Merge the evaluators | `AquibraStudio.tsx:304-329`; `publish.service.ts:18-105`; `site-detail.service.ts:19-148,310-331` | P2 |
| **History** | Versions of the site | Saved versions, session changes, published versions, rollback, compare | `HistoryTab` (Saves: "Saved versions" / "This session"; Published) | Yes | — | — | Site menu "Version history" / "Publish history" deep-link into it (fine) | History | Keep | `HistoryTab.tsx:28-49,381-400`; `AquibraStudio.tsx:514` | — |
| **Activity** | Who did what | Server `ActivityLog` (workspace, site, team) | Dashboard `/dashboard/activity`, site overview `#activity-log`, `team.activity`; editor links out | Yes | The editor's `ActivityView` *code name* means the undo timeline (UI label "This session") | — | — | Dashboard | Keep; rename the code symbol | `SiteMenu.tsx:222-227`; `HistoryTab.tsx:46-49` | P3 |
| **Publish** | Ship the site | Checks, publish, progress, unpublish, history, rollback, schedule | Editor `PublishTab`/`PublishWizard` (flag); dashboard publish route (unlinked); `sites.schedulePublish` + cron (no UI) | The editor path | Every **server-initiated** publish is guaranteed to fail | Rendering lives only in the editor client | Dashboard route; scheduled publish | Editor (until a server renderer exists) | Remove or hide the route; block the schedule | `D/app/api/workers/publish/[jobId]/route.ts:88-105`; `cron/scheduled-publish/route.ts:32-36` | P2 |
| **Settings (site)** | Configure the site | Identity, SEO, domains, redirects, locales, headers, analytics, forms, webhooks, integrations, custom code | Editor `SettingsTab` (13 screens) **and** dashboard `sites/[id]/*` (8 tabs) | Yes | **Two writers of the same Site columns; the editor autosave overwrites the dashboard** | "Canvas grid size / snap" (an editor preference) inside Site settings | Two whole UIs | **PRODUCT DECISION** on the canonical surface; the storage fix is required either way | Merge | `BuildrikSyncProvider.ts:159-231,392-442`; `site-detail.ts:94-99` | **P0** |
| **Templates** | Start from a design | Browse, preview, apply to page or site, save as template | Editor `TemplatesTab` (hardcoded `SITE_TEMPLATES`, 10 entries) + `userTemplates`; dashboard/onboarding `templates.*` (DB `Template`, seeded) | Yes | **Two catalogs** | — | Pages "From template", T, ⌘K, CanvasEmptyCTA | One server catalog | Merge | `templatesData.ts:175-304`; `prisma/seed.ts:103-111,146-249` | P2 |
| **Collaboration** | Working with others | Presence, live edit, comments, review, mentions, activity, sharing, invites, roles | Live collab is FLAGGED-OFF; comments are live; review is live (agency); mentions are absent; share, invite and roles live in the dashboard (the editor links out) | Comments, review, dashboard people management | "Mentions" filter mis-mapped; comments trigger no notification | — | Collab start (header, site menu, ⌘⇧P, all flagged) | See the collaboration decision below | Change | `shared/schemas/notifications.ts:13-18`; notification producers (grep) | P2 |

### Where each collaboration job belongs

| Capability | Belongs in | Current | Verdict |
|---|---|---|---|
| Presence (avatars, cursors) | Topbar (avatars) + canvas (cursors) | Topbar and canvas, behind `FEATURE_COLLAB` (`StudioHeader.tsx:225`) | Right placement; runtime is Agent D's |
| Live editing | Engine + topbar session control | Header, site menu and ⌘⇧P, all flagged | Right placement; keep it off |
| Comments | Canvas pins + Review panel list | `CommentLayer` + `ReviewTab` | Keep. Comments are ungated but listed in the agency-framed Review panel; see A02-11 |
| Review / approval | Review panel + dashboard queue + public token page | Same | Keep |
| Mentions | Comments composer → Notifications | **Not implemented**; the filter shows security/payment notifications | A02-11 |
| Activity | Dashboard (workspace/site/team) | Dashboard; the editor deep-links | Keep |
| Sharing / invites / roles | Workspace settings + site Access tab | Dashboard; editor site menu links out (`SiteMenu.tsx:275,288`) | Keep. One owner, with a valid editor door |
| Notifications of collab events | Notifications module | Reviews → **email only**; comments → **nothing** | A02-11 |

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

#### A02-1: The editor's autosave overwrites dashboard site-settings edits with the values it loaded when it opened (silent data loss)
- **Severity:** P0 — IMMEDIATE FIX REQUIRED (data loss/corruption). Not fixed in this run.
- **File:**
  - `E/services/BuildrikSyncProvider.ts:159-213` (`extractSiteColumnPatch`), `:233-260` (`mergeSiteColumnsIntoSettings`), `:392-442` (`saveProject`)
  - `E/editor/shell/hooks/useComposerInit.ts:519-527` (autosave)
  - `S/services/site-settings.service.ts:130-260`
  - `D/components/site-detail/{settings-tab,seo-tab}.tsx`
- **Symbol:** `saveProject`, `extractSiteColumnPatch`, `updateSiteSettings`
- **Evidence:**
  1. **Load.** On load, `mergeSiteColumnsIntoSettings` copies the Site row's `name`, `favicon`, `defaultLocale`, `metaTitle`, `metaDescription`, `metaTitleTemplate`, `ogImage`, `allowIndexing`, `robotsTxt`, `touchIcon`, `socialLinks`, `headCode` and `bodyCode` into the editor's in-memory `projectSettings` (`:246-258`).
  2. **Every save.** Every autosave (1000 ms debounce, `useComposerInit.ts:523-527`) calls `saveProject(siteId, composer.exportProject())`.
     - That extracts **every present field** (`extractSiteColumnPatch` tests `!== undefined`, not "changed").
     - It then calls `siteDetail.settings.update` whenever any field is present (`:411-424`).
     - After load, `name` is always present, so the call happens on **every** save, including saves where the user only moved a block. The server comment confirms it: "Editor auto-save sends headCode="" / bodyCode="" on every tick" (`site-settings.service.ts:160-163`).
  3. **No concurrency check.** `settings.update` takes no version or `expectedLastEditedAt`. `updateSiteSettings` does not bump `lastEditedAt` (grep of `:200-260`). A dashboard settings edit therefore does not even trip the editor's `SAVE_CONFLICT`.
  4. **Fires even on conflict.** The settings call is started "in the same tick" as `sites.saveProject` (`:413-424`). It runs **even when `saveProject` is then rejected with `SAVE_CONFLICT`** (`:426-439`), so the tab that loses the conflict still writes its stale settings.
  5. **The overlap is real.** The dashboard edits the same columns: `seo-tab.tsx` (allowIndexing, metaTitle, metaDescription, robotsTxt) and `settings-tab.tsx` (name, favicon, headCode, bodyCode, publishedPassword).
  6. **Test coverage.** `buildrik-sync-provider.test.ts` "routes Site-column fields to siteDetail.settings.update alongside the project save" passes (43/43). It asserts the routing. No test covers the stale-overwrite case.
- **Concrete failure (static):**
  1. User A has the editor open. User A (in another tab) or an ADMIN teammate sets **"Allow indexing" off** and edits `robots.txt` or head code in the dashboard SEO or Settings tab.
  2. The next canvas edit in the editor tab autosaves.
  3. `allowIndexing`, `robotsTxt`, `headCode` and the rest revert to the values from when the editor opened. There is no error and no conflict dialog. The next publish ships the reverted values: the site becomes indexable again, and a removed script comes back.
- **Expected:** one owner per Site column. Or at least: mirror only fields the user changed in this session, send a concurrency token, and never mirror when the page save is refused.
- **Root cause:** the settings are stored twice (`Site.projectSettings.seo.*` JSON and the Site columns), with a **client-side** mirror that pushes a full snapshot. The "Settings" module has two UIs and two storage locations, and the only owner is whichever save lands last.
- **Affected modules:** Settings (editor and dashboard), Publish (reads the Site columns), SEO, Collaboration (two live editors overwrite each other's settings), Autosave.
- **Recommendation:**
  - Make the Site columns the single source of truth and stop mirroring through autosave. Only the Settings screens' explicit Save (`SettingsTab.handleSave` flush) should write `siteDetail.settings.update`, and only with changed keys.
  - Alternatively, diff against the values loaded at open and send only the changed keys, gated on the page save succeeding.
  - Add a stale-overwrite regression test.
- **Status:** VERIFIED (static code path + unit suite showing the routing). NOT RUNTIME VERIFIED.

### P1

#### A02-2: Every autosave by a non-admin editor asks for an ADMIN-only mutation and shows "Saved — site settings didn't"
- **Severity:** P1
- **File:** `S/trpc/routers/site-detail.ts:94-99`; `E/services/BuildrikSyncProvider.ts:411-441`; `E/editor/shell/hooks/useSaveCallback.ts:96-106`; `S/services/sites.service.ts:799-802`
- **Symbol:** `siteDetail.settings.update`, `emitSettingsMirrorError`
- **Evidence:**
  - `settings.update` requires `checkSiteRole(…,"ADMIN")`.
  - The editor is open to EDITOR and DESIGNER (`userCanEditSite` → `checkSiteRole(…,"EDITOR")`). `ROLE_RANK` has EDITOR = DESIGNER = 1 and ADMIN = 2 (`permission.service.ts:4-11`).
  - Per A02-1, every autosave includes the settings call. For these roles it returns FORBIDDEN, and the shell turns each refusal into a toast: "Saved — site settings didn't … refused: …" (`useSaveCallback.ts:97-103`).
  - A related case: a FREE workspace whose Site row already has `headCode` gets `CUSTOM_CODE_NOT_AVAILABLE` on every tick (`site-settings.service.ts:164-189`).
- **Expected:** a canvas save by a content editor does not ask for site-admin writes. Site settings are written only by someone allowed to write them.
- **Root cause:** same as A02-1. The site-settings mirror rides the page-save pipeline, which has no idea of ownership or role.
- **Affected modules:** Autosave, Settings, the invited-designer flow.
- **Recommendation:** the fix for A02-1 fixes this. Short of that, skip the mirror when `roleAtLeast(role,"ADMIN")` is false.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED. I have not confirmed whether the toast is deduplicated.

#### A02-3: Media belongs to the uploader, not the site or workspace, so teammates cannot see or manage a site's assets
- **Severity:** P1
- **File:** `S/services/media.service.ts:24-31` (`getUserPlan`), `:87-90` (`listAssets` `where: { userId, siteId }`), `:285-290`, `:320-325`, `:367-372`, `:392-415` (update/delete/move/versions all check `asset.userId !== userId`); `prisma/schema.prisma:1027-1028` (`MediaAsset.userId`, `siteId?`); `E/services/BuildrikSyncProvider.ts:519-521`
- **Symbol:** `listAssets`, `updateAsset`, `deleteAsset`, `moveAsset`, `getUserPlan`
- **Evidence:**
  - The editor loads the site library through `media.listAssets({ siteId })`, which the service filters by the **caller's** `userId`.
  - A teammate opening the same site sees only their own uploads. The Media tab, the picker, "replace across site", usage counts and alt text all work on that partial set.
  - Editing an image a colleague uploaded fails the `userId` check.
  - Storage quota is taken from the plan of the caller's **oldest** active workspace membership (`orderBy: { joinedAt: "asc" }`), not from the workspace that owns the site.
- **Expected:** site assets are site- or workspace-owned. Any EDITOR+ on the site can list them and manage their metadata. Quota counts against the site's workspace.
- **Root cause:** the Media module was scoped to a single user, while sites are workspace-owned. The data model is out of step with the permission model.
- **Affected modules:** Assets, Full Media, the Inspector media picker, AI alt text, Collaboration (team editing), Billing and quotas, the dashboard `/dashboard/media`.
- **Recommendation:** re-scope reads and mutations to site access (`assertSiteAccess` / `checkSiteRole`) and quota to `site.workspaceId`. Keep `userId` as attribution. This needs a product decision on what the dashboard-level "my media" library means afterwards.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED.

### P2

#### A02-4: Every server-initiated publish is doomed: the dashboard publish route and scheduled publish
- **Severity:** P2
- **File:**
  - `D/app/api/workers/publish/[jobId]/route.ts:74-105` (a job with 0 pages throws "No page content to deploy" unless `PUBLISH_ALLOW_SIMULATION`)
  - `D/app/dashboard/sites/[id]/publish/page.tsx:30-43` (`sites.publish({siteId})`, no pages)
  - `D/app/dashboard/sites/[id]/layout.tsx:67-75` (the header now routes Publish to the editor, so the page has no inbound link; `tab-nav.tsx:8-15` has no Publish tab)
  - `D/app/api/cron/scheduled-publish/route.ts:32-36` (`startPublish(s.siteId, s.workspaceId, s.createdBy)`, no pages)
  - `S/trpc/routers/sites.ts:441-460` (`schedulePublish` has no UI caller; allowlisted `check-trpc-orphans.mjs:84-89`)
- **Symbol:** `PublishPage`, `startPublish`, cron `GET`
- **Evidence:** the HTML render (ExportEngine) exists only in the editor client. Any publish started from the server side (dashboard page, schedule cron) creates a `PublishBuildJob` that the worker must fail in production. The dashboard page is still reachable by URL. The cron keeps running and would fail every schedule if a UI were ever wired to it.
- **Expected:** Publish has one owner that can produce pages. Server-initiated publish is either implemented (a server renderer) or not offered.
- **Root cause:** rendering is owned by the client, while scheduling and dashboard publishing are server-side.
- **Affected modules:** Publish, the dashboard site detail, cron.
- **Recommendation:** remove or redirect the `sites/[id]/publish` route. Have `schedulePublish` refuse until there is a renderer, or store a snapshot. Keep the "FOUNDER DECISION" on scheduled publish open.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED.

#### A02-5: Site Settings is split across two full UIs with partly different coverage
- **Severity:** P2 · **PRODUCT DECISION REQUIRED**
- **File:** `E/editor/sidebar/tabs/settings/screens/*` (13 screens) vs `D/app/dashboard/sites/[id]/*` with `D/components/site-detail/tab-nav.tsx:8-15` (8 tabs)
- **Evidence:** from procedure-call greps:

  | Area | Editor | Dashboard |
  |---|---|---|
  | General / identity | `SiteSettingsScreen` | `settings-tab` |
  | SEO | `SeoScreen` | `seo-tab` |
  | Domains | `DomainsScreen` + dialogs | `domains` |
  | Redirects | `RedirectsScreen` + `RedirectDialog` | `redirects` |
  | Form submissions (`forms.*`) | `FormsScreen` | "Submissions" |
  | Analytics | status only | data |
  | Localization, Headers, Webhooks, Integrations, Advanced | editor only | — |
  | Sharing (`siteDetail.sharing.*`), health, activity, archive/unpublish | — | dashboard only |

  Both write the same `siteDetail.settings.update`. A02-1 is the data consequence.
- **Expected:** one canonical site-configuration surface, with the other either linking into it or offering a subset that is clearly different.
- **Root cause:** the editor Settings full page grew to parity without the dashboard tabs being retired.
- **Affected modules:** Settings, SEO, Domains, Redirects, Forms.
- **Recommendation:** decide the canonical owner (by scope: the editor keeps design-time settings, the dashboard keeps operational ones such as domains, sharing, analytics and submissions). Make the other side a deep link.
- **Status:** VERIFIED (static) · PRODUCT DECISION REQUIRED

#### A02-6: Two asset-detail editors, and the quick one's "✨ Generate alt text" guesses from the filename
- **Severity:** P2
- **File:** `E/editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx:274-293` → `E/shared/utils/openai.ts:92-115` → `ai.content`; vs `E/editor/media/components/AssetDetailsPanel.tsx:164-208` → `media.generateAltText` → `S/services/alt-text.service.ts:60-175` (vision, `image_url`, keeps text the user typed)
- **Symbol:** `generateAlt`, `generateContent`, `applyAltTextToAsset`
- **Evidence:**
  - The quick overlay prompts a text model with only `image file named "${display}"`, commits the result straight away (`onUpdate`), and swallows errors (`catch { /* AI unavailable */ }`).
  - The library panel sends the image to a vision model and skips assets whose alt text the user wrote.
  - The same asset gets two different "AI alt text" behaviours depending on which panel is open.
- **Expected:** one alt-text capability, owned by Media, using vision and respecting user-typed text.
- **Root cause:** detail editing was built twice (the quick overlay and the library detail).
- **Affected modules:** Assets, Full Media, AI, accessibility.
- **Recommendation:** route the overlay through `AltTextService`/`media.generateAltText`, or remove the overlay's editor and link to the library detail.
- **Status:** VERIFIED (static)

#### A02-7: Two insert pipelines with different placement rules (the Add panel vs the ⊕ toolbar picker)
- **Severity:** P2
- **File:** `E/editor/canvas/controls/BlockPickerModal.tsx:41-124,193-196` (mounted from `UnifiedSelectionToolbar.tsx:186,322-326`); `E/editor/shell/hooks/useBlockInsertion.ts:23-117`; `BuildTab.tsx:200-250`
- **Evidence:**
  - The ⊕ picker shows only `ElementsTab`: no blocks, components or MINE.
  - It calls `insertBlock` directly with `position:"child"`.
  - On invalid nesting it only `devLogger`s and closes (`:91-100`), so the user gets a silent no-op.
  - The Add panel goes through `useBlockInsertion`, which does smart parent suggestion (`getSuggestedParents`), a transaction, select and flash, and toasts.
  - Same intent (insert content here), different destination set, different rules, different failure behaviour.
- **Expected:** one insertion service; the picker is a thin trigger into it.
- **Recommendation:** have `BlockPickerModal` call `useBlockInsertion`, or open the Add panel with an insertion context.
- **Status:** VERIFIED (static)

#### A02-8: Components has three editor owners and two contradictory planned homes
- **Severity:** P2 · **PRODUCT DECISION REQUIRED**
- **File:**
  - `E/editor/rail/tabsConfig.ts:75-86` (Add: "Blocks and Components live inside this one panel") vs `:345-352` ("components … folds into Brand · components per the design in a later phase")
  - `BuildTab.tsx:66-99` (MINE + `insertMine`) vs `component-library/useComponentsState.ts:235-261` (`handleInstantiate`, the same code nearly line for line)
  - `design-system/ui/sections/ComponentsSection.tsx:1-18` (Brand read-only summary plus a CTA into the Components panel)
- **Evidence:** user components can be inserted from Add → MINE and from `ComponentsTab`, managed only in `ComponentsTab` (off-rail: ⇧A, ⌘K, site menu), and summarised in Brand. The insert logic is copied. The config comments name two different future owners.
- **Recommendation:**
  - Add owns *inserting* (built-in and mine).
  - One owner handles *managing* (rename, delete, detail). Choose between the Brand "Components" destination and a management view inside Add.
  - Delete the duplicate instantiate function.
- **Status:** VERIFIED (static) · PRODUCT DECISION REQUIRED

#### A02-9: Four independent "is this site OK?" evaluators, and Issues sees only one of them
- **Severity:** P2
- **File:**
  - `S/services/publish.service.ts:18-105` (`runPrePublishChecks`: pages, `metaTitleTemplate`, domain, empty pages, favicon)
  - `S/services/site-detail.service.ts:19-148` (dashboard `healthScore`: per-page SEO, content, SSL, favicon)
  - `:300-335` (editor `settingsOverview.attention`: localization, domains, webhooks)
  - `E/editor/shell/AquibraStudio.tsx:304-329` (Issues = DS lint only; also shown in Brand via `useDSLint`)
- **Evidence:** each has its own rule for the same concern. "SEO configured" is `metaTitleTemplate` in pre-publish but per-page `seoTitle`/`seoDescription` in health. The Issues panel, the natural owner, lists only token lint that Brand already shows.
- **Recommendation:** one site-validation service (server). Issues shows all of it, pre-publish gates on a subset, and health summarises it.
- **Status:** VERIFIED (static)

#### A02-10: Two template catalogs
- **Severity:** P2
- **File:** `E/editor/sidebar/tabs/templates/templatesData.ts:175-304` (`SITE_TEMPLATES`, 10 hardcoded) vs `prisma/seed.ts:146-249` → `Template` table → `templates.list` (dashboard, onboarding, `use-template-modal.tsx`)
- **Evidence:** `seed.ts:103-111` names the split itself ("collapsing the editor's hardcoded SITE_TEMPLATES into this model … left for a supervised migration"). The editor never calls `templates.*` (grep).
- **Recommendation:** one server catalog. The editor reads `templates.list`.
- **Status:** VERIFIED (static)

#### A02-11: Notifications owns no collaboration events, and "Mentions" is mislabelled
- **Severity:** P2
- **File:** `packages/shared/schemas/notifications.ts:13-18`; `S/services/notification.service.ts:10,82`; `D/components/notifications/notification-page.tsx:13`; notification producers (grep of `createNotification|notifyWorkspaceOwner`): `account`, `form-submission`, `publish` and the auth router only; `S/services/comment.service.ts` (no notify, email or activity call); `review.service.ts:502-575` (email only)
- **Evidence:**
  - The "Mentions" tab filters to `SECURITY_*` and `PAYMENT_FAILED`.
  - @mentions do not exist.
  - A new comment (team or client via `/review/[token]`) produces no notification.
  - A review submission or resolution produces an email but no in-app notification.
- **Recommendation:**
  - Rename the tab (for example "Account & billing") or implement mentions.
  - Have comment and review events call the notification trigger.
  - Decide whether comments stay in the agency-framed Review panel or get a team-comments list of their own (the comments router is not gated; the reviews router is).
- **Status:** VERIFIED (static) · PRODUCT DECISION REQUIRED (mentions scope)

#### A02-12: Two editor command palettes with overlapping commands and conflicting shortcut labels
- **Severity:** P2
- **File:** `E/editor/shell/modals/CommandPalette.tsx:48-175` (⌘K); `E/editor/canvas/hooks/useCanvasCommandPalette.ts:43-320` (⌘⇧P)
- **Evidence:**
  - Both offer Undo, Redo, Zoom in/out/fit, Preview, opening panels (layers, templates, media) and Duplicate/Delete (⌘K through the registry).
  - They label Redo differently: ⌘K "Ctrl+Y" (`:81-85`), ⌘⇧P "Cmd+Shift+Z" (`:95-100`).
  - ⌘K has both "Undo" (`:70-77`) and "Undo last action" (`:143-149`): same handler, same shortcut.
  - ⌘⇧P alone has CMS records, save-as-template, stock search, replace media and "start collab" (flagged). ⌘K alone has panel navigation and keyboard shortcuts.
  - The user has to know which palette holds which command.
- **Recommendation:** merge into ⌘K, built from one registry (with a canvas-context group).
- **Status:** VERIFIED (static)

#### A02-13: AI entry sprawl, and dead AI client paths that hide orphaned server procedures
- **Severity:** P2
- **File:**
  - Chat-panel doors (`ui:switch-tab {tab:"ai"}`): `InspectorEmptyState.tsx:90`, `MultiSelectToolbar.tsx:247`, `ProInspector.tsx:404`, `CommandPalette.tsx:342`, `useEditorShortcuts.ts:171`, `useComposerInit.ts:443`, `AquibraStudio.tsx:507` (e3, dev-only)
  - Dead code: `E/shared/utils/openai.ts:118-166` (`generateLayout`, `generateCode`, `improveContent`: not exported, not called); `E/services/ai/AiTrpcClient.ts:200-216` (`generatePage`, no caller)
- **Evidence:**
  - `ai.page` and `ai.layout` have no live caller. `check-trpc-orphans` counts them as called because the text `trpc().ai.page.mutate` sits in dead code.
  - There are 5+ AI capabilities in 6 modules: selected ✨, chat, DS-AI, 2× alt text, SEO title, history summary/milestone, onboarding.
- **Recommendation:**
  - Keep the ✨ popover (selection) and the chat panel.
  - Reduce the chat doors to ✨-expand, ⌘K and the shortcut.
  - Delete the dead client methods and allowlist or remove `ai.page` and `ai.layout`.
- **Status:** VERIFIED (static)

#### A02-14: CMS-generated pages are invisible in Pages (Pages vs CMS ownership)
- **Severity:** P2 · **PRODUCT DECISION REQUIRED**
- **File:** `E/editor/sidebar/tabs/content/ContentTab.tsx:308-325`, `ContentViews.tsx:684-735`; `S/services/cms.service.ts:229-246`; `E/editor/sidebar/tabs/pages/*` (grep: no cms, collection or dynamic reference)
- **Evidence:** a collection with `pageSlugPattern` and `pageTemplatePath` adds one route per record at publish. The Pages panel never lists or links these routes. It shows the template page as an ordinary page.
- **Recommendation:** Pages shows generated routes read-only ("from collection X"), with a door to the CMS dynamic-pages view.
- **Status:** VERIFIED (static)

### P3

#### A02-15: `StructurePopover`, the e3/legacy rails and `RAIL_TOOL_META` are compiled into production but reachable only in dev
- `E/shared/utils/editorViewMode.ts:69-88` (`fourToolRail` is false in prod); `StudioFooter.tsx:215` (the only trigger for the popover); `StudioHeader.tsx:847`; `tabsConfig.ts:295-330`. The popover duplicates `LayersTab` (both render `LayersPanel`).
- **Recommendation:** delete, or keep behind an explicit dev import. VERIFIED (static).

#### A02-16: Editor preferences live in Site Settings (scope leakage)
- `SiteSettingsScreen.tsx:117-121,200-201,324-345`: "Canvas → Grid size / Snap to grid" is written to composer state and saved in the project, so it applies to every collaborator.
- A per-user editor preference, not a site setting. **Recommendation:** move it to editor view preferences. VERIFIED (static).

#### A02-17: The name "Activity" means two things in code
- Editor `ActivityView` (`history/components/ActivityView.tsx:2`) is the undo timeline; its UI label is "This session" (`HistoryTab.tsx:46-49`). In the dashboard, "Activity log" is the server `ActivityLog`.
- The user-facing collision is small. **Recommendation:** rename the code symbol. VERIFIED (static).

#### A02-18: Stale workspace flag `client_mode`
- Declared at `packages/shared/schemas/feature-flags.ts:8`; nothing reads it (grep). **Recommendation:** remove it or build E4. VERIFIED (static).

#### A02-19: `pages.delete` and `pages.get` appear to have no client caller, but the orphan scan counts them
- My grep finds only `pages.list` callers (`BuildrikSyncProvider.ts:305`, `onboarding/ai/preview/page.tsx:57`).
- The scanner probably matches the engine's in-memory `ctx.pages.get/delete` (`PageManager.ts:45,97`). Page deletion really goes through `saveProjectData` (`sites.service.ts:614-640`).
- **Status:** NOT VERIFIED (I did not trace the scanner's regex). → Agent G.

#### A02-20: The Brand DS linter runs in three mounts
- `DSLintRunner` (always mounted, `StudioPanels.tsx:452`), `DSLintMount`, and `DesignSystemTab.tsx:226` each call `useDSLint`. That is repeated work for one result. → Agent E. VERIFIED (static).

---

## Good as-is (checked, no change)
- **History:** it owns saved versions, session changes, published versions and rollback. Site menu "Version history" and "Publish history" deep-link into it (`AquibraStudio.tsx:514`). The compare view is shared with Review rather than copied (`SavesChrome.tsx:132`, `ReviewTab.tsx:549`).
- **`MediaLibraryPanel`** is a legitimate single-field picker (temporary surface), not a competing library.
- **`CanvasEmptyCTA`** is a legitimate router to Templates or Add; it has no insert logic of its own.
- **`PageTabBar`** is a legitimate secondary page switcher.
- **Sharing, invites, roles and the activity log** are owned by the dashboard. The editor site menu links there (`SiteMenu.tsx:222-227,275,288`) instead of duplicating them. This is the right pattern.
- **Review and comment gating:** the server gates reviews on `agency_layer` and reports `reviewsEnabled:false` so the editor hides "Send for review" (`reviews.ts:104-125`).
- **Templates apply:** the dashboard "apply to site" is ADMIN-gated, confirmed as destructive, and bumps `lastEditedAt`, so an open editor gets `SAVE_CONFLICT` instead of overwriting (`template.service.ts` ~`:212-221`).
- **The rail itself** in production is one renderer (figma, six items).
- **The live-collab entry points** (header, site menu, ⌘⇧P) are all behind `FEATURE_COLLAB`.

## Functional ownership map

| Feature | Correct owner | Primary entry | Valid secondary entry | Duplicate to remove? |
|---|---|---|---|---|
| Insert element/block | Add | Rail Add (A) | CanvasEmptyCTA; ⊕ toolbar (as a trigger into Add's pipeline) | ⊕ `BlockPickerModal`'s own pipeline (A02-7) |
| Insert my component | Add (MINE) | Rail Add | ⇧A panel | `insertMine`/`handleInstantiate` duplicate code (A02-8) |
| Manage components | **Decision:** Brand › Components or Components panel | ⇧A | Site menu, ⌘K | One of Brand summary / ComponentsTab (A02-8) |
| Layers tree | Layers | Rail Layers (L) | — | `StructurePopover` (dev-only, A02-15) |
| Pages CRUD | Pages | Rail Pages (P) | `PageTabBar` | — |
| CMS generated routes | CMS (definition), Pages (visibility) | CMS › Dynamic pages | Pages (read-only list) | — (missing, A02-14) |
| Quick insert asset | Assets | Rail Assets (M) | Inspector picker (`MediaLibraryPanel`) | — |
| Asset detail / alt text / versions | Full Media | Assets › Manage library | — | `AssetDetailOverlay` editor + filename alt-text (A02-6) |
| Workspace media library | Dashboard media (after re-scope) | `/dashboard/media` | — | — (scope fix A02-3) |
| Design tokens / presets / lint | Brand | Rail Brand (B) | Site menu | Issues' lint copy (fold into unified Issues, A02-9) |
| Site validation | Issues (one service) | Footer/topbar Issues | Pre-publish gate, dashboard health | 3 separate rule sets (A02-9) |
| Selected-element AI | Selection toolbar ✨ | ✨ | — | — |
| AI chat / agent | AI panel | ✨ expand / ⌘K / I | Inspector empty state | Inspector, MultiSelect and composer-event doors (A02-13) |
| Media alt-text AI | Full Media (vision) | Library detail | Auto-trigger on upload | Quick overlay text-model path (A02-6) |
| Site settings (design-time) | Editor Settings | Site menu › Site settings | — | **Decision** (A02-5) |
| Site settings (operational: domains, sharing, analytics, submissions) | Dashboard site tabs | `/dashboard/sites/:id/*` | Editor deep link | Editor copies (**decision**, A02-5) |
| Site-column persistence | `siteDetail.settings.update` via explicit Save | Settings Save | — | **Autosave mirror (A02-1, P0)** |
| Publish | Editor Publish | Topbar Publish | Site menu › Publish panel | Dashboard `sites/[id]/publish` route (A02-4) |
| Scheduled publish | Publish (after renderer or snapshot) | — (no UI) | — | Block until it can deploy (A02-4) |
| Versions / rollback | History | Site menu › Version history | Publish history deep link | — |
| Undo/redo | Engine `HistoryManager` | ⌘Z / ⇧⌘Z | ⌘K | ⌘K "Undo last action" duplicate row (A02-12) |
| Command palette | ⌘K | ⌘K | — | ⌘⇧P palette (A02-12) |
| Review / approval | Review | ReviewBar / site menu | Publish gate modal, dashboard queue | — |
| Comments | Canvas CommentLayer + Review list | C (comment mode) | Dashboard comment queue | — |
| Mentions | Comments → Notifications | — | — | Mis-mapped "Mentions" filter (A02-11) |
| Notifications | Notifications | Topbar bell / dashboard bell | — | Transport split (poll vs SSE), Agent E |
| Activity log | Dashboard | `/dashboard/activity` | Editor site menu › Activity log | — |
| Sharing / invites / roles | Dashboard | Settings › Team, site Access | Editor site menu links | — |
| Live collaboration | Topbar session + engine | (flagged off) | — | — (runtime: Agent D) |
| Templates | One server catalog | Pages "From template" / T | Onboarding, dashboard gallery | Editor hardcoded catalog (A02-10) |
| Canvas grid/snap | Editor view preferences | View menu / canvas | — | Site Settings copy (A02-16) |

## Product decisions required
1. **Canonical site-settings surface (A02-5).** Which fields live in the editor and which in the dashboard? This is separate from the A02-1 storage fix, which is needed either way.
2. **Components' home (A02-8).** A Brand › Components destination, or management inside Add? The config comments name both.
3. **Media ownership (A02-3).** Site or workspace scope for site assets. What `/dashboard/media` shows afterwards (workspace-wide or per-user).
4. **Mentions (A02-11).** Build @mentions, or rename the filter. Should comments get a team-level list outside the agency-framed Review panel?
5. **Scheduled publish and dashboard publish (A02-4).** Build a server renderer or snapshot, or drop the features.
6. **Pages vs CMS (A02-14).** Should generated routes appear in Pages?

## Overlaps with other audits (observed, not audited here)
- **F (security):**
  - A02-1 also reverts security-relevant columns: `headCode`/`bodyCode` (script removal undone) and `allowIndexing`.
  - `reviews.*` gates `agency_layer` on the **session** workspace (`resolveWorkspaceId(ctx)`, `reviews.ts:60-62,85-86`) rather than the site's workspace. This is the same class as the approval-gate fix documented at `publish.service.ts:241-253`.
  - Whether `media.createAsset({siteId})` checks site access was not audited.
- **D (collab):** A02-1 makes two live collaborators overwrite each other's site settings on every autosave, even when the page save conflicts.
- **C (interaction):** ⌘K "Clear history" emits `HISTORY_CLEARED` with no confirm (`CommandPalette.tsx:151-155`). The ⊕ picker fails silently on invalid nesting (A02-7).
- **E (architecture):**
  - The notifications client transport is split: the editor polls, the dashboard uses SSE.
  - The DS lint runs three times (A02-20).
  - `LibraryManager` (1199 lines) and `ReviewTab` (1071 lines) are large.
- **G (verification):**
  - `check-trpc-orphans` false negatives: `ai.page` and `ai.layout` are in dead code; `pages.delete`/`pages.get` are possibly name collisions (A02-13, A02-19).
  - No test covers a stale settings overwrite (A02-1).
  - Needed runtime walks: A02-1 (dashboard edit + editor autosave) and A02-2 (EDITOR-role save toast).
- **Inventory corrections for A:** `?rail=` is dev-only in prod; CMS dynamic pages have a UI; `MediaLibraryPanel` is a picker; the dashboard publish route is unlinked (see Method).

---

```
AUDIT HANDOFF
Agent:            B — Product Architecture
Prompt:           2 — Module Cohesion, Feature Relevance & Functional Ownership
Report:           docs/audits/2026-09-25-full-audit/02-module-cohesion.md
Counts:           P0=1  P1=2  P2=11  P3=6
P0 (immediate):   A02-1 editor autosave mirrors a load-time snapshot of 13+ Site columns to
                  siteDetail.settings.update on every save (no diff, no concurrency token, fires even on
                  SAVE_CONFLICT) → silently reverts dashboard settings edits (allowIndexing, robotsTxt,
                  head/body code, name, favicon, meta). BuildrikSyncProvider.ts:159-213,392-442.
P1:               A02-2 non-admin editors hit ADMIN-only settings.update + warning toast every autosave;
                  A02-3 media owned per uploader user (list/manage/quota), not site/workspace.
Root causes:      (1) site settings stored twice + client-side mirror; (2) Media scoped to user while sites
                  are workspace-owned; (3) page rendering owned only by the editor client; (4) parallel
                  implementations never retired (palettes, insert pipelines, asset detail, template
                  catalogs, validation evaluators).
Fix dependencies: A02-2 is resolved by the A02-1 fix. A02-5's product decision should precede UI
                  consolidation but NOT block A02-1. A02-3 needs a product decision on /dashboard/media
                  before the scope change.
Hand to:          F (A02-1 security columns; reviews agency gate on session workspace; media siteId auth),
                  D (A02-1 under live collab), G (runtime walks for A02-1/A02-2; orphan-scan false negatives),
                  E (lint ×3, notifications transport, large files), C (silent picker failure, unconfirmed
                  Clear history).
Runtime verified: NONE. One unit suite run (buildrik-sync-provider, 43/43 pass) confirming the dual-save
                  routing. No DB, no browser, no Playwright.
Not verified:     live two-surface overwrite (A02-1); toast frequency and dedupe for EDITOR role (A02-2);
                  teammate media visibility at runtime (A02-3); orphan-scanner regex behaviour (A02-19);
                  whether the Publish panel opened via ⌘K/U with FEATURE_PUBLISH off is a dead end.
```
