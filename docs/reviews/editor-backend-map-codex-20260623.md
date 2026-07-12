# Editor Backend Map — codex pass, 2026-06-23

Independent codex (read-only, file:line-grounded) map of the EDITOR's backend
surface. The editor calls the server via its own tRPC client
(`packages/editor/src/services/api-client.ts` + `ai/AiTrpcClient.ts`) + service
wrappers. **Counts: 20 backend-backed · 14 client-only · 5 server surfaces with NO
editor consumer.**

## Corrections vs the prior 7-agent audit (`feature-backend-map.md`)
1. **Project LOAD** is backend (`useComposerInit.ts:150,193` → `sites.get`/`pages.list`/`siteDetail.settings.get`) — was not listed separately.
2. **Forms inbox/submissions IS in the editor** (`FormsScreen.tsx` → `forms.listBlocks/listSubmissions/updateSubmission/deleteSubmission`) — prior answer said dashboard-only. WRONG; it's in the editor settings tab.
3. **Redirects · Localization · Security-headers** are editor settings screens hitting `siteDetail.*` — backend-backed inside the editor, not just dashboard.
4. **Comments · Share-links · Domains** have NO editor backend call-site — prior answer wrongly had comments as editor-backend. The editor doesn't consume them.
5. AI is richer than listed: `ai.content`/`ai.layout` (SeoTab), `ai.streamPrompt`, `ai.summarize` (version-history), `ai.milestoneSuggest`.
6. Editor's runtime **form-submit is RAM-only** (`FormSubmissionService`, in-memory Map) — NOT the server `submitForm`.
7. Media: list/upload/versions/folder-MOVE/quota are server; asset **metadata edits (name/alt) + folder RENAME are local IndexedDB only**.

`media.updateAsset` and `ai.page` exist server-side but have no live editor consumer.

---

## List A — Backend-Backed Editor Features (20)

| feature | editor call-site | server router.procedure | service fn | status |
|---|---|---|---|---|
| Project load (canvas/pages/layers/settings/tokens hydrate, site-backed) | `useComposerInit.ts:150,193` | `sites.get` · `pages.list` · `siteDetail.settings.get` | `sites.service:334 getSite` · `page.service:23 listPages` · `site-settings.service:57` | WORKING |
| Project save/autosave (full blob + mirrored settings) | `useSaveCallback.ts:69` · `useComposerInit.ts:354` | `sites.saveProject` · `siteDetail.settings.update` | `sites.service:506 saveProjectFromEditor` · `site-settings.service:102` | WORKING |
| Publish / status / cancel / SEO-inject | `usePublishJob.ts:70,99,150` · `useAiActionGate.ts:96` | `sites.publish` · `sites.publishStatus` · `sites.cancelPublish` | `publish.service:116 startPublish` · `:232 getPublishStatus` · `:252 cancelPublish` | WORKING |
| Review submit | `ReviewService.ts:20-24` · `Topbar.tsx:236` | `reviews.submit` | `review.service:26 submitReview` | WORKING |
| Media library hydrate | `BuildrikSyncProvider.ts:340-399` · `useComposerInit.ts:193` | `media.listAssets` · `media.listFolders` | `media.service:87` · `media-folder.service:20` | WORKING |
| Media upload + asset/folder create/delete + folder move | `AssetUploadService.ts:60-99,133-215` | `POST /api/asset-upload` · `media.createAsset/deleteAsset/createFolder/deleteFolder/moveAsset` | `media.service:120/296/343` · `media-folder.service:39/124` | WORKING |
| Media storage quota | `useServerStorageQuota.ts:61` | `media.checkStorageQuota` | `media.service:474` | WORKING |
| Media version history | `MediaTab.tsx:105,140` · `AssetDetailOverlay.tsx:114,126` | `media.listAssetVersions/createAssetVersion/restoreAssetVersion` | `media.service:368/386/442` | WORKING |
| AI alt-text | `useAltTextAutoTrigger.ts:53` · `LibraryManager.tsx:365` | `media.generateAltText` | `alt-text.service:125` | WORKING |
| CMS collections sync | `useCmsSync.ts:26-31` · `cmsSync.ts:32-107` | `cms.collections.list/upsert/delete` | `cms.service:25/34/62` | PARTIAL (local IndexedDB primary; mirror best-effort, dropped on fail) |
| CMS entries sync | `useCmsSync.ts:26-31` · `cmsSync.ts:109-135` | `cms.entries.list/upsert/delete` | `cms.service:78/83/104` | PARTIAL (no conflict resolution) |
| Forms inbox/admin (existing submissions) | `FormsScreen.tsx:86,111,141,154` | `forms.listBlocks/listSubmissions/updateSubmission/deleteSubmission` | `form-submission.service:112/78/103/108` | WORKING |
| Redirect management | `RedirectsScreen.tsx:62,97,135` | `siteDetail.redirects.list/create/delete` | `redirect.service:7/14/43` | WORKING |
| Localization settings | `LocalizationScreen.tsx:90,133` | `siteDetail.settings.get/update` | `site-settings.service:57/102` | WORKING |
| Security-headers settings | `HeadersScreen.tsx:69,100` | `siteDetail.settings.get/update` | `site-settings.service:57/102` | WORKING |
| AI text/layout gen + SEO helper copy | `AIAssistantBar.tsx:62,69` · `AICopilot.tsx:272` · `AIAssistant.tsx:107` · `SeoTab.tsx:63` | `ai.content` · `ai.layout` | `ai.service:166 generateContent` · `:227 generateLayout` | WORKING |
| AI edit-commands / page-edit / plan stream | `useStreamPrompt.ts:87` · `runPromptOnce.ts:83` | `ai.streamPrompt` | `ai.service:1167/1277/1409` | WORKING |
| AI propose / confirm action | `useAiActionGate.ts:44,69` | `actions.propose` · `actions.confirm` | `ai-actions.service:46` · `action-confirmation.service:23/46` | WORKING |
| AI version-history summary | `useAISummary.ts:109` | `ai.summarize` | `ai.service:328` | WORKING |
| AI milestone suggestion | `useAutoMilestone.ts:174` | `ai.milestoneSuggest` | `ai.service:391` | WORKING |

## List B — Client-Only Editor Features (14)

| feature | engine/manager | store | data-loss |
|---|---|---|---|
| Local-only project (no siteId) | `useComposerInit.ts` | `localStorage["buildrick-project"]` | **HIGH** — no server copy |
| Undo / redo | `engine/HistoryManager.ts` | RAM | **HIGH** — gone on refresh |
| Version snapshots | `engine/storage/VersionHistoryStorage.ts` | IndexedDB `aquibra-versions` | MEDIUM — browser/device-local |
| Components registry | `engine/components/ComponentStorage.ts` | IndexedDB `aquibra-components` | MEDIUM — not shared/server |
| CMS local cache | `engine/cms/CollectionStorage.ts` | IndexedDB `aquibra-cms` | MEDIUM — server mirror best-effort |
| CMS bindings | `engine/cms/CMSBindingManager.ts` | RAM maps | **HIGH** — in-memory unless in project blob |
| Editor runtime form-submit | `services/FormSubmissionService.ts` | RAM Map | **HIGH** — not using server submitForm |
| Media metadata edits (name/alt/source) | `engine/media/MediaManager.ts` | IndexedDB `aquibra-media` | MEDIUM — only folderId moves mirrored |
| Media folder rename | `engine/media/MediaManager.ts` | IndexedDB `aquibra-media` | MEDIUM — local only |
| Stock media discovery | `services/stock/StockService.ts` | RAM | LOW loss / HIGH incompleteness (stub → empty) |
| Layers panel state (hidden/locked/names/expanded) | `panels/layers/hooks/layersPersistence.ts` | `localStorage["buildrick-layers-*"]` | MEDIUM — UI state |
| Page sidebar folders | `sidebar/tabs/pages/useFolders.ts` | `localStorage["pg-folders-v1-*"]` | MEDIUM — organizational |
| Design-token/style-preset caches + DS mode | `design-system/state/*Context.tsx` | `localStorage["buildrick-design-*"]` | LOW-MEDIUM — until project save |
| Editor UI prefs (panels/inspector/recents/icons/onboarding) | `useStudioState.ts` etc. | `localStorage["buildrick-*"]` | LOW — prefs only |

## Absent (server exists, NO editor consumer)
`comments.*` · share-link APIs · `siteDetail.domains.*` · `ai.page` · `media.updateAsset`

> Source: codex read-only pass, 2026-06-23. Supersedes the editor rows in the prior
> audit where they conflict (see Corrections above).
