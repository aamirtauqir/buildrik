# Settings · Clone S1 — backend delta (for the founder's "go")

Phase: **S1 Shell + SITE** — Overview · General · SEO defaults · Custom code · nav · save bar ·
the dialogs the section reaches (Unsaved settings, Settings saved, Search settings, the
"Edit social profile" stand-in). Plan: `docs/plans/2026-09-14-settings-clone.md` (Q3c: nothing
below is built until this doc is approved).

Frames read: `shots/3397-32915` (Overview), `3397-32011` General + `3953-26363` loading +
`3953-26503` load-error + `3950-26309` save-error, `3397-32076` SEO + `3953-26646` / `26785` /
`3951-26319`, `3397-32456` Custom code + `3953-49260` / `49386` / `3951-26607` + `3397-32859`
locked (Pro), `3737-43639` Unsaved settings, `3737-43624` Settings saved, `3737-46109` Search
settings, `3737-43652` Edit social profile. Edge graph: `reactions-settings-1.json` /
`-5.json`.

## 1. What the frames need vs what the code has

| frame | needs | code today | delta |
|---|---|---|---|
| General | Site name · Favicon URL · Site Language · Twitter · Facebook · LinkedIn; loads from the server, can fail, can retry; save can fail, "Retry save" | `SiteSettingsScreen` writes `projectSettings.seo.{siteName,favicon,language,socialLinks}`; the sync provider dual-saves `socialLinks` to the Site row but **not** `siteName` → `Site.name`, **not** `favicon` → `Site.favicon` (publish reads `Site.favicon` — the editor's favicon never reaches a published site), **not** `language` → `Site.defaultLocale` | **client**: map the three through the existing `siteDetail.settings.update` (`name`, `favicon`, `defaultLocale` are already accepted — `site-settings.service.ts:129`); per-screen `siteDetail.settings.get` on open with Try again; save-error banner + Retry. **No new endpoint.** |
| SEO defaults | Meta title · Meta description · Twitter handle · Default OG image · **Allow search indexing** toggle · **robots.txt** preview block | `SeoScreen` has title template / twitter / OG; `allowIndexing` + `robotsTxt` exist as Site columns, written only by the dashboard SEO tab, read by publish (`workers/publish/[jobId]/route.ts:292`) | **client**: the two fields join the screen and the dual-save map (`allowIndexing`, `robotsTxt` accepted today). robots.txt renders as the frame draws it — a read-only preview derived from the toggle + the primary domain's sitemap, with `Site.robotsTxt` (dashboard-editable) shown verbatim when set. **No new endpoint.** |
| Custom code | Head scripts · Body scripts (end) · Global CSS; loading / load-error / save-error; **locked (Pro)** with `Upgrade to Pro` | `AdvancedScreen` → `projectSettings.customCode`; `headCode`/`bodyCode` dual-saved; `globalCss` stays in `projectSettings` (the client export engine injects it, `ExportEngine.ts:553`); server gate `CUSTOM_CODE_NOT_AVAILABLE` on `FREE` (`site-settings.service.ts:184`); editor gate `getEditorPlanTier()` from the loaded plan | **none** — states and the gate are reachable with a plan flip. `Upgrade to Pro` → dashboard billing (existing link). |
| Overview | per-section summary lines + a NEEDS ATTENTION list + Done | nothing — the code lands on General; `siteDetail.overview` serves the dashboard's site page (visitors/pages/SEO health), a different shape | **NEW query `siteDetail.settingsOverview`** (§2) |
| nav · save bar | 5 groups (SITE SETUP · SEO & PUBLISHING · VISITORS · ADVANCED · WORKSPACE), `Fonts & colours` → Brand panel, `Export` → the Export modal, `Members ↗` / `Billing ↗` → dashboard; `All changes saved` / `Changes not saved` / `Loading settings…` / `Settings could not load` · Cancel · Save changes / Retry save | 3 groups; Branding is an in-tab map; `export` is an in-tab screen (`unreachable`) | **client** only |
| Unsaved settings · Settings saved · Search settings | dialogs | `ConfirmDialog` guard exists (copy differs); no saved-dialog; no search | **client** only. Search indexes the nav + every screen's field labels (a static registry per screen), no endpoint. |
| Edit social profile | prototype stand-in for typing into a field ("field values are fixed sample content, not typed input"); `Save failure example` leads to save-error | — | recorded as the stand-in it is; the real input stays (Q3e: shape) |

## 2. NEW — `siteDetail.settingsOverview`

**Router** `server/trpc/routers/site-detail.ts`: `settingsOverview: protectedProcedure.input({ siteId }).query` → `assertSiteAccess` → `getSettingsOverview(siteId)`.

**Service** `server/services/site-detail.service.ts` (same domain as `getSiteOverview`): one `Promise.all` over existing tables — no new columns:

| section line | source |
|---|---|
| General — `<site name> · <language label>` | `Site.name`, `Site.defaultLocale` |
| Fonts & colours — `Site fonts and colour tokens` | static |
| Localization — `<n> locales · <locale> not started` | `Site.enabledLocales`; a locale is "not started" when no `Page.translations[locale]` exists |
| SEO defaults — `Indexing allowed|blocked · robots.txt set|default` | `Site.allowIndexing`, `Site.robotsTxt != null` |
| Domains — `<primary> · <n> DNS pending` / `No custom domain` | `Domain` (isPrimary), `DnsRecord.verified = false` count |
| Redirects — `<n> rules · <m> suggestions` | `Redirect` count; suggestions = `SlugHistory` rows whose `oldSlug` has no `Redirect.fromPath` (the "404 suggester" the nav promises and S3 builds) |
| Export — `HTML, ZIP or React` | static |
| Analytics — `<provider> receiving data` / `No provider` | `projectSettings.analytics` (provider ids) + `SiteAnalytics` rows in the last 7 days |
| Forms — `<n> forms · <m> submissions` | `FormBlock` count, `FormSubmission` count |
| Custom code — `Head, body and CSS set` (the set ones named) / `None set` | `Site.headCode`, `Site.bodyCode`, `projectSettings.customCode.globalCss` |
| Headers — `CSP and HSTS on` / `Defaults` | `Site.cspPolicy`, `Site.hstsMaxAge` |
| Integrations — `<n> connected · <m> available` | `WorkspaceIntegration` (isActive) count; available = the client catalog length (returned as `catalogSize` from the shared constant so the line is one source) |
| Webhooks — `<n> endpoints · last delivery <ok|failed>` | `WorkspaceWebhook` count; latest `WebhookDelivery.status` |
| Members — `<n> of <seats> seats used` | `WorkspaceMember` (ACTIVE) count, `PLAN_LIMITS[plan].teamMembers` |
| Billing — `<Plan> · $<price> / month` | `Workspace.plan`, `Subscription.price/interval` else `PLAN_LIMITS[plan].priceMonthly` |
| NEEDS ATTENTION | derived from the above: a locale with 0 translated pages · a DNS record pending · the last webhook delivery failed (each row carries `section` for its `Open ›`) |

**Shared schema** `packages/shared/schemas/site-detail.ts`: `settingsOverviewSchema` (Zod) + `SettingsOverview` type — the transport contract the editor reads.

**Tests**: `server/services/__tests__/site-detail-settings-overview.test.ts` (each line from seeded rows; the attention derivations; an empty site → every line's empty form), router access test.

**Migration**: **none** in S1.

## 3. Seed + fixtures (Q6)

- `prisma/seed-settings-clone.ts` (new, `pnpm tsx prisma/seed-settings-clone.ts [--reset]`), scoped to the scratch workspace / site `scratchver0000000000000001`: 1 domain (`isPrimary`, one `DnsRecord.verified=false`), 3 redirects + 2 `SlugHistory` rows without redirects, 3 `FormBlock` + 38 `FormSubmission`, 1 `WorkspaceWebhook` + a failed `WebhookDelivery`, `enabledLocales` = `en, ar` with no `ar` translations, 2 `WorkspaceIntegration`, `SiteAnalytics` rows this week. Idempotent (upsert by stable ids); `--reset` deletes exactly what it created.
- Plan flip for the locked/unlocked walk: `UPDATE workspaces SET plan='PRO' WHERE id=<scratch>` and back to `FREE` — recorded in `phase1-journeys.md`, reverted before the report.
- Save-error: forced by blocking `siteDetail.settings.update` in the browser (request abort) — no code hook. Load-error: block `siteDetail.settings.get` before opening the screen.

## 4. Nothing else on the server

`sites.rename`, `siteDetail.settings.get/update`, `sites.saveProject` (dual save) stay as they are. The Pro gate stays server-side (`FREE` → `CUSTOM_CODE_NOT_AVAILABLE`); the editor's gate reads the same plan.

## 5. Open questions (decide with the "go")

1. **Overview's `Done`** — the frame's only footer action. Reads as "back to canvas"? The graph's `Action / Done` on other screens goes to the Unsaved-settings guard; on the Overview there is nothing to save. Recommend: Done = Back to canvas.
2. **`Members ↗` / `Billing ↗`** — the graph opens overlays `3737:46094` / `3737:46102` ("Ali's Studio · Members / Billing") INSIDE the editor. The code deep-links to the dashboard pages (they exist). Building in-editor member/billing management = a workspace-domain backend arc. Recommend: S1 keeps the deep links; the two overlays are recorded `superseded:code:deep-link` unless you want them (then S5 + its own delta).
3. **`Settings saved` dialog** vs the product's toast pattern — the frame draws a modal with `Return to settings`. Q3a says the frame wins; building it as drawn. Say if you want the toast instead.
