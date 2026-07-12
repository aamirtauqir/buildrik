# Editor PRD · Ch.02 — Sidebar (rail + 11 tabs)

> Part of BUILDRIK-PRD-EDITOR v2.0 · `main` @ `e5624ca1` · 2026-07-07 · paths under `packages/editor/src/editor/sidebar/` unless noted

## 2.1 Structure

Rail (60px, 3 zones creation/structure/config) + variable-width drawer (`LeftSidebar.tsx:105,475-513`). Canonical registry = 11 tabs (`rail/tabsConfig.ts:79-247`):

| id | label | ⌨ | width | pattern | router target |
|---|---|---|---|---|---|
| add | Insert | A | 280 | drill-in | BuildTab |
| ai | AI | I | 320 | standalone | AITab |
| templates | Templates | T | 320 | drill-in | TemplatesTab |
| assets | Media | M | 320 | standalone | MediaTab |
| layers | Layers | Z | 280 | standalone | → panels/layers (thin shell) |
| pages | Pages | P | 280 | standalone | PagesTab |
| components | Components | ⇧A | 280 | drill-in | ComponentsTab / V2 (flag) |
| design | Design | D | 320 | standalone | → design-system/ui/DesignSystemTab (external) |
| settings | Settings | S | 320 | drill-in | SettingsTab |
| publish | Publish | U | 280 | standalone | PublishTab |
| history | History | H | 280 | standalone | HistoryTab (→ panels/VersionHistoryPanel) |

Width rule locked 2026-05-22: 280 list/tree, 320 browse (`tabsConfig.ts:60-69`). TabRouter mounts one tab at a time (`TabRouter.tsx:6-19`). E3 4-tool rail collapses 11 → insert/pages/styles/site + assistant(topbar)/structure(footer); ⚠ config comment "no behaviour wired yet" is stale-ish — live rail renders from GROUPED_TABS_CONFIG (`tabsConfig.ts:273-311`).

## 2.2 Per-tab features (highlights)

- **Pages**: CRUD + folders (localStorage-only), bulk multi-select (⌘/Shift/Space) w/ bulk duplicate/move/delete, ⌘K palette, drag reorder, per-page settings drawer (SEO/Social/Advanced), copy link, "Search listings" SEO table view (`PagesTab.tsx:84,229-255`, `usePages.ts:34-333`).
- **Settings**: drill-in, 10 sections in 3 groups (SITE/DISTRIBUTION/PLUMBING) + 3 workspace deep-links (Domains/Members/Billing), central dirty counter + sticky savebar (`SettingsTab.tsx:72-120,798-815`).
- **Publish**: status badge, URL copy, 5-item checklist, read-only subscriber to Topbar's publishJob.
- **History**: Changes/Saves views, Time-Travel scrubber (Ctrl+Shift+T), auto-milestone banner.
- **AI**: Chat (accept/reject/regenerate diffs) + Agent (multi-step plan, approve/skip/auto-apply), model picker, scope chip.
- **Insert/BuildTab**: exclusive-accordion catalog, search, drag/click insert. ("Sections mode" ~1300 lines deleted 2026-04-23 as unreachable, `BuildTab.tsx:6-12`.)
- **Media**: 3 modes (280/320 launcher, 560 expanded, fullpage LibraryManager), type pills, stock modal, folders, bulk ops, detail overlay.
- **Components**: category groups, create-from-selection, instantiate, variant swap, detach; MAX 100 (`useComponentsState.ts:13,445`).
- **Templates**: 4-col grid, 2-stage filters, apply-to-current/add-as-page, usage drawer; panel 320 → 700 when detail open (`TemplatesTab.tsx:131-143`).

## 2.3 Validation rules

- Slug: normalize (lowercase, spaces→hyphens, strip non `[a-z0-9-/]`); errors empty/uppercase/spaces/invalid; duplicate check (`utils/slug.ts:3-27`, `usePageSettings.ts:201-216`).
- ⚠ SEO title counter shows /60 but maxLength 80 (`SeoTab.tsx:149,172-173`); desc counter /160 but slices 200 (`:211,218`).
- Head-code: tag-balance check "Unclosed HTML tag detected" (`usePageSettings.ts:71-80`). Save blocks on slugError/head error/empty password (`:242-257`). Autosave 500ms; ⌘S immediate.
- GA4 `/^G-[A-Z0-9]{10}$/i`; Meta Pixel `/^\d{15,16}$/` (`AnalyticsScreen.tsx:12,52`).
- Redirects: fromPath starts `/`, type 301/302 (`RedirectsScreen.tsx:84-93`).
- SEO score algorithm (max 100; noIndex → 0): title 10-60 +20, clean slug +20, desc 50-160 +30, title≥30 +10, desc≥100 +10, non-default slug +10 (`utils/seoScore.ts:10-22`).

## 2.4 State machines

Template apply idle→confirming→applying→success|error (15s timeout, `useTemplateApply.ts:82-163`) · AI agent idle→planning→running→done; step pending→running→awaiting→applied|skipped|nochange|failed (`useAgentRunner.ts:32-191`) · AI scope idle→locked during stream (`useAIScope.ts:19-72`) · page-settings save clean→saving→error (`usePageSettings.ts:19`) · settings drill-in root⇄section w/ 180ms lock + dirty guard (`SettingsTab.tsx:262-527`).

## 2.5 Enums

PageStatus ×7 live/draft/hidden/password/scheduled/error/external (`pages/types.ts:9`) — ⚠ drawer visibility only live/hidden/password (mismatch, `usePageSettings.ts:42`) · PlanTier starter/pro/enterprise · AIModel ×4 default sonnet (`ai/types.ts:1-7`) · MediaTypeFilter all/img/vid/ico/fnt · DiscSource unsplash/pexels/pixabay · TemplateIndustry ×5 · HSTS presets ×5 · locales ×24.

## 2.6 Business rules

MAX_COMPONENTS 100 · no page cap (guards: last page, homepage) · search shows at ≥5 pages · storage 1GB local fallback, server override, -1 unlimited (`media.ts:129`, `useUploadState.ts:110-123`) · MAX_RECENT elements 8 vs templates 3 (⚠ two values) · forms PER_PAGE 20 · delete-undo 8000ms · plan gating: only advanced+integrations require pro (`settings/types.ts:61-64`).

## 2.7 Defects (feeds §13)

1. **Brand chaos ×5 in one module**: `buildrick` CSS/storage, `buildrik.com/app` publish, `aquibra.io/com` help+slug domains — help links diverge docs.buildrik.com vs docs.aquibra.com (`LeftSidebar.tsx:469` vs `FullPageView.tsx:51`)
2. **SEO score labels lie**: UI says "slug +10 / indexing +40", code awards +20/none (`SeoTab.tsx:120-124` vs `seoScore.ts`)
3. **PublishTab computes 7 checks, renders 5** — hasContent, hasSocialImg dropped (`PublishTab.tsx:230-327`); "SEO title" checks site-level but hint points per-page
4. **Redirects & Headers saved but NOT enforced** on live sites (explicit banners, `RedirectsScreen.tsx:156-161`, `HeadersScreen.tsx:160-164`); Localization routing "Phase D"
5. **Integrations all "Coming Soon"** — doc links only (`IntegrationsScreen.tsx:2-4,81`)
6. Branding section = nav-map, no fields (`SettingsTab.tsx:130-211`)
7. Dead style constants (Headers/Localization/Redirects screens); BuildTab favorites plumbing vestigial (`useBuildTab.ts:260-287`)
8. Fixed-bug archaeology: 4 legacy `page:*` events never emitted (`usePages.ts:116-124`)

## 2.8 Integration

composer.elements (pages CRUD, importHTML, recordAppliedTemplate), composer.components, composer.media/mediaOps, project settings/save. tRPC: siteDetail.redirects/settings, forms.*, media.checkStorageQuota. Services: BuildrikSyncProvider (plan tier), MediaVersionService, adoptionTracker, streaming AI. Feature flags publish/componentsV2/dsAi/collab (all default OFF prod, `TabRouter.tsx:28,148,181`). ENV `VITE_DASHBOARD_URL` for deep-links.
