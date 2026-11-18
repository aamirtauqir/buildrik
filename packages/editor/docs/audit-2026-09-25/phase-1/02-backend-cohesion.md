# Audit 2 — cross-workspace module cohesion

Date: 2026-09-25. Scope: Pages, CMS, Brand, Settings, Components, Review, Publish and Sharing across editor/dashboard/server. Read-only source review; documentation only. **NOT RUNTIME VERIFIED.** This is an independent boundary review for Audit 2, not a full functional, security or architecture audit.

## Owner and exclusion map

| Module job and user intent | Established owner and data | Exclusions / apparent duplication disproved |
| --- | --- | --- |
| Pages: author the site's editable page hierarchy/content | Editor `usePages` reads Composer pages; cloud snapshot path writes `Page` rows through `sites.saveProject` → `saveProjectFromEditor` → `saveProjectData`. Evidence: `packages/editor/src/editor/sidebar/tabs/pages/usePages.ts:103`, `server/trpc/routers/sites.ts:268`, `server/services/sites.service.ts:489` | `pages` row API (`server/trpc/routers/pages.ts:36`) also addresses `Page`, but its narrower CRUD/translation contract does not establish a second user-facing page manager. No direct `pages.create/update/delete` client call was found in reviewed editor/dashboard source. Generated CMS URLs are excluded. |
| CMS: structure collections/records and their dynamic output configuration | CollectionManager local storage, event-based cmsSync, `cms` router/service, CmsCollection/CmsEntry. Evidence: `packages/editor/src/engine/cms/CollectionManager.ts:147`, `packages/editor/src/editor/shell/hooks/useCmsSync.ts:86`, `server/services/cms.service.ts:34` | Local cache and server mirror form one intended content workflow. Dynamic generation derives publish files rather than authored Page rows (`server/services/cms.service.ts:229`); complete trace is in `01-ia-backend.md`. |
| Brand: edit the current site's design tokens/presets | Brand's DesignSystemTab applies `projectSettings.designTokens` and `designPresets`; project save persists settings. Evidence: `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx:554`, `packages/editor/src/engine/Composer.ts:679`, `server/services/sites.service.ts:736` | Dashboard shared-theme administration is workspace distribution, not another in-editor token editor. However its data source is different from the Brand token owner: see COH-BE-01. |
| Settings: configure one site and its published metadata/policies | Editor project settings plus mirrored Site columns; dashboard uses the same `siteDetail.settings` API and `site-settings.service`. Evidence: `packages/editor/src/services/BuildrikSyncProvider.ts:398`, `packages/dashboard/app/dashboard/sites/[id]/settings/page.tsx:14`, `server/trpc/routers/site-detail.ts:83`, `server/services/site-settings.service.ts:252` | Multiple entrypoints do not establish duplicate business owners. Editor loads/merges Site columns and separately mirrors them on save; per-page SEO belongs to Pages. Workspace/account settings have different scope and are excluded from the site-setting owner. Atomicity/live-session reconciliation is not evaluated here. |
| Components: author reusable definitions; administer their workspace distribution | ComponentManager local definitions, componentSync, SiteComponent rows; dashboard LibraryPanel aggregates/manages those same rows. Evidence: `packages/editor/src/engine/components/ComponentManager.ts:213`, `packages/editor/src/services/componentSync.ts:47`, `server/services/site-component.service.ts:16`, `packages/dashboard/components/library/library-panel.tsx:24` | Workspace list/usage is a scoped view of site rows, not an independent library table (`server/services/site-component.service.ts:66`). Rename/delete authority nevertheless crosses the local/server definition boundary without a symmetric reconciliation path: see COH-BE-02. |
| Review: obtain sign-off and manage a review round | Editor ReviewService and dashboard review queue share `reviews` router and ReviewRequest; token client surface uses clientReview with Reviewer identity. Evidence: `packages/editor/src/services/ReviewService.ts:123`, `packages/dashboard/components/reviews/review-queue.tsx:34`, `packages/dashboard/app/review/[token]/review-client.tsx:126` | Internal admin resolution stamps `resolvedById` (`server/services/review.service.ts:476`); token-client resolution stamps `reviewerId` (`server/services/client-review.service.ts:281`). Different actors/context acting on the same round are not duplicate state stores. Review snapshots/sign-off are excluded from live editing, generic access links and deployment. |
| Publish: turn approved/exported content into a deployed site | Editor exports HTML and sends sites.publish; server creates PublishBuildJob, expands CMS files, and dashboard-hosted worker builds/deploys output. Evidence: `packages/editor/src/editor/shell/exportPublishPages.ts:38`, `server/trpc/routers/sites.ts:337`, `server/services/publish.service.ts:329`, `packages/dashboard/app/api/workers/publish/[jobId]/route.ts:390` | Progress UI and SSE/polling consume publish-job state; they do not own another deployment implementation. Review approval is an input to publication, not publication itself. Detailed failure semantics are excluded. |
| Sharing: create/manage a link to the published destination | Editor hands off to dashboard; dashboard ShareDraftModal uses siteDetail.sharing; share-link service writes ShareLink; `/share/[token]` opens publishedUrl. Evidence: `packages/editor/src/editor/shell/SiteMenu.tsx:275`, `packages/dashboard/components/site-detail/share-draft-modal.tsx:39`, `server/services/share-link.service.ts:68`, `lib/share-destination.ts:16` | This is neither a ReviewRequest nor a teammate permission nor an editor draft renderer. Editor handoff is a contextual entry into the dashboard owner, not a second link-creation handler. Its expressed preview/draft intent conflicts with destination scope; track with COH-BE-03. |

## COH-BE-01 — workspace shared-theme job does not address Brand's token data

**Severity:** P2 candidate pending product decision. **Status:** PRODUCT DECISION REQUIRED — different persisted data is verified statically; whether these surfaces promise the same payload/outcome requires a product decision. Live propagation was not exercised.

**Files / symbols:** `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx:524` / `handleApply`; `server/services/theme.service.ts:73` / `captureSharedTheme`; `server/services/theme.service.ts:138` / `pushSharedTheme`.

**Evidence:** Brand saves token records and presets into `composer.setProjectSettings` at `packages/editor/src/editor/design-system/ui/DesignSystemTab.tsx:554`. Composer exports settings separately from `styles` (`packages/editor/src/engine/Composer.ts:669`). Dashboard theme capture selects `Site.projectStyles` at `server/services/theme.service.ts:79`, saves it as `Workspace.sharedTheme` at `:99`, and push writes only `projectStyles`, schema version and edit timestamp at `:181`. The dashboard tells users that following sites adopt the theme's tokens (`packages/dashboard/components/theme/theme-manager.tsx:207`). The traced capture/push code does not read or write `projectSettings.designTokens`/`designPresets`.

**Expected behavior:** The workspace's token-distribution job should have an explicit relationship to the token data authored in Brand, or clearly state that it distributes a separate style-rule artifact.

**Root cause:** Two different persisted concepts, style rules and design-token settings, are assigned overlapping theme/brand responsibilities in the product surfaces.

**Affected modules:** Brand, workspace theme manager, server theme service, site persistence.

**Recommendation:** Decide and document the workspace theme payload's authority. If it is Brand distribution, include the canonical token/preset data in its contract; otherwise position it as style-rule distribution. Carry propagation verification into the functional audit. Do not infer that two similarly named interfaces are redundant or remove either entrypoint on that basis.

## COH-BE-02 — workspace component management and local definition management overlap

**Severity:** P2. **Status:** PARTIAL — competing writes and asymmetric reconciliation verified statically; stale display/resurrection not runtime reproduced.

**Files / symbols:** `server/services/site-component.service.ts:109` / `renameWorkspaceComponent`; `server/services/site-component.service.ts:127` / `deleteWorkspaceComponent`; `packages/editor/src/services/componentSync.ts:47` / `mirrorComponentUpsert`; `packages/editor/src/services/componentSync.ts:84` / `hydrateComponentsFromServer`.

**Evidence:** Dashboard workspace rename writes `SiteComponent.name` across matching site rows (`:114`), while delete removes those rows (`:131`). Editor mutation mirrors both the local definition's name and full payload (`packages/editor/src/services/componentSync.ts:53`). Server `upsertSiteComponent` writes both fields (`server/services/site-component.service.ts:25`). Hydration returns on an empty server list (`packages/editor/src/services/componentSync.ts:90`), skips all IDs already present locally (`:93`), and for absent IDs loads the stored payload rather than merging the separate row name (`:94`). The inspected workspace rename does not rewrite `payload.name`.

**Expected behavior:** Admin rename/delete of a workspace master and editor changes to that same master need an explicit authoritative definition and reconciliation contract, so both surfaces implement one management intent.

**Root cause:** Workspace management edits server row metadata/existence while editor authoring treats local full definitions as its source for later upserts; the hydration path is additive.

**Affected modules:** Dashboard Library, editor Components/ComponentManager, component sync, SiteComponent persistence.

**Recommendation:** Define authoritative rename/deletion semantics across cached definitions, row metadata and payloads; add a version/tombstone or other explicit reconciliation contract during remediation. Functional audit should verify rename/delete followed by editor open/update before severity is upgraded. This is not a recommendation to merge the useful workspace and per-site surfaces.

## COH-BE-03 — sharing handoff expresses draft-preview intent but owns live-site links

**Severity:** P2. **Status:** VERIFIED by source for owner/destination mismatch; NOT RUNTIME VERIFIED.

**Files / symbols:** `packages/editor/src/editor/shell/SiteMenu.tsx:275` / sharing menu item; `packages/dashboard/components/site-detail/share-draft-modal.tsx:79` / creation action; `lib/share-destination.ts:16` / `shareDestination`.

**Evidence:** The editor offers “Share preview link” and opens the dashboard `?share=1` flow. Its create action says “Create draft link” (`packages/dashboard/components/site-detail/share-draft-modal.tsx:81`), but `shareDestination` returns only `publishedUrl`; the receiving route redirects there or renders not-published (`packages/dashboard/app/share/[token]/page.tsx:39`). After creation the modal accurately explains it opens the published page and does not show the draft (`packages/dashboard/components/site-detail/share-draft-modal.tsx:90`). Review, separately, stores and serves rendered review snapshots.

**Expected behavior:** The handoff should preserve the user's intended scope: preview current draft, request frozen review, or share the published site. Each can have a distinct owner without competing promises.

**Root cause:** A draft-preview entry/action fronts the live-publication link owner; the downstream explanation and destination have narrower behavior.

**Affected modules:** Editor site menu, dashboard sharing modal, public share route; adjacent Review/Publish boundaries.

**Recommendation:** Define the preview/live-sharing responsibility and align entrypoint intent with the implemented destination, or provide an explicit draft-preview owner. Deduplicate this evidence against other Audit 2 findings. Detailed wording/navigation treatment belongs to its later category; no such audit or fix was performed here.

## Review limits

This review compared intent, scope, trigger, API destination, handler, mutation and outcome across the listed seams. The table excludes apparent duplicates with shared or intentionally different owners. It does not certify every invocation, background worker, offline transition or cross-device update. No Audit 3 work is included; recommendations are pending remediation, and no production code changed.
