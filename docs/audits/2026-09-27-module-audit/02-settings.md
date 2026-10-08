# 02 · Settings — UX / IA + form-validation audit (2026-09-27)

29 findings: 13 P1, 13 P2, 3 P3, no P0. Scope: editor Settings (`packages/editor/src/editor/sidebar/tabs/settings/**`),
dashboard `sites/[id]/{settings,seo,redirects}` and `settings/{integrations,workspace,team,domains}`, routers/services,
page-level SEO where it touches site SEO. Method: code, then live typing of invalid values with tRPC request/response
capture; persistence + cleanup checked with read-only DB SELECTs. All test edits reverted (DB-confirmed).

## 1. Module map

**Editor Settings** (Ctrl+, or site menu)
- Overview: summary cards + "Needs attention" (`siteDetail.settingsOverview`).
- Site setup — General (name, favicon URL, language, author, Twitter/Facebook/LinkedIn) · Brand ↗ · Localization (default locale, auto-redirect, locales table, Add locale = immediate).
- SEO & publishing — SEO defaults (meta title/description, Twitter handle, OG image, indexing, robots.txt preview read-only) · Domains (immediate) · Redirects (dialog immediate; 404-suggester switch uses footer Save) · Export… (modal).
- Visitors — Analytics (GA, GTM, Pixel, Clarity + Verify) · Forms (submissions inbox only).
- Advanced — Custom code (head, body, global CSS; Pro) · Headers (CSP, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy) · Integrations (static "Coming soon") · Webhooks ↗ (dashboard).
- Workspace — Members ↗, Billing ↗.

**Dashboard**
- Site tabs: Settings (name, SLUG, favicon/touch-icon upload, site password `type="text"`, head/body code, social links any platform) · SEO (read-only home-page SEO + Technical SEO: canonical, indexing, robots.txt) · Domains · Redirects (+ CSV import/export) · Submissions · Sharing.
- Workspace: Domains (workspace-wide) · Apps & Integrations (Vercel, Webhooks, GA "Tracking ID", Mailchimp, Zapier, Slack) · Workspace (name, slug, default language, timezone, accent, approvals) · Team. Marketplace: another "Google Analytics · Connect".

**Elsewhere**: Inspector › Form › After submit (success message, redirect URL, notify email, honeypot); Pages › Page settings (page SEO title/description, OG, per-page indexing, slug).

**Write paths**: General/SEO/Custom code/Analytics via whole-project save → `sites.saveProject` then `siteDetail.settings.update` only if a Site column changed and user ≥ ADMIN (`BuildrikSyncProvider.ts:589-600`). Headers + Localization call `settings.update` directly. Domains, Redirects dialog, Forms, Add locale save per action.
Schemas: `packages/shared/schemas/site-detail.ts:51-92` (`updateSiteSettingsSchema`), `:101` (`redirectTargetSchema`), `:166` (`domainNameSchema`), `analytics-ids.ts`, `webhooks.ts`, `account.ts:43`.

## 2. Scorecard (0–10)

| # | Lens | Score | Why |
|---|---|---:|---|
| 1 | Cohesion | 4 | Site settings split across editor page, 5 dashboard site tabs, 3 workspace pages, Inspector, Pages drawer |
| 2 | Misfit | 4 | Form config in Inspector while Settings › Forms promises "+ config"; Integrations catalog belongs to nothing; Workspace rows in site Settings |
| 3 | Duplicate doors | 2 | Domains ×3, Redirects ×2, Indexing ×3, Language ×3, GA ×3, Twitter ×2, Submissions ×2; name/favicon/social/code ×2 with different controls |
| 4 | Scope leakage | 4 | Workspace rows in site Settings; Webhooks = Advanced in nav, Workspace in search; slug/password/canonical/robots dashboard-only |
| 5 | Discoverability | 5 | Search works for editor fields; "slug", "password", "canonical", "notification email" → no match |
| 6 | Information scent | 3 | Fake GA id "verified"; Overview "3 connected" vs 0; "Suggest redirects from 404s" = slug history; dashboard "Meta title" = home page's |
| 7 | Bloat | 5 | Localization tracks never-published locales + redirects to them; Integrations all "Coming soon"; workspace language/timezone unused |
| 8 | Surface | 6 | Full page, dialogs, external links used sensibly |
| 9 | Navigation | 6 | Clear groups; two different guard dialogs |
| 10 | Collab ownership | 5 | Site-column fields locked below ADMIN; Headers + Localization not |
| 11 | Cognitive load | 5 | Two "Meta title"s, three "language"s, two save models on Redirects |
| — | **Form validation** | **3** | Save not blocked by inline errors; server message replaced by generic banner; many fields no rules; client ≠ server on 9 fields |

## 3. Findings

| ID | Lens | Sev | Finding | Evidence | Status |
|---|---|---|---|---|---|
| SET-01 | Validation | P1 | **Save not blocked by inline errors** (General, SEO, Custom code, Headers). Server refuses; user sees generic banner (never names field) + raw Zod toast ("name: String must contain at least 2 character(s)"). Footer "Not saved" vs topbar "Saved". Only Analytics blocks Save. | Live 13, 15, 22, 42. `SettingsTab.tsx:436-498` (server error only `console.error` :439; banner = `SAVE_ERROR_MESSAGES`); :852 Save disabled only while loading/saving | NEW |
| SET-02 | Validation/state | P1 | **Refused values keep coming back.** Rejected value stays in editor copy; project save succeeds before settings update is refused → every autosave re-sends (2+ HTTP 400 per Save) + toast. After Discard of refused name "a", breadcrumb still "a" and autosave keeps posting `name:"a"` (rollBack restores settings, not project-metadata name). | Live 16. `SettingsTab.tsx:397-407`; `SiteSettingsScreen.tsx:187-196`; `BuildrikSyncProvider.ts:589-600` | NEW |
| SET-03 | Validation | P1 | **Empty site name**: field error, Save enabled, "Settings saved", but no `settings.update` sent. | Live 11, 12. `BuildrikSyncProvider.ts:270-276` | NEW |
| SET-04 | Validation | P1 | **Favicon + social links: no rules either side.** `javascript:alert(1)`, `hello world`, `not-a-url` saved 200. Seeded favicon `qa-secret-123`. Favicon written verbatim into `<link rel=icon>` at publish. Social links silently dropped unless http(s); valid ones only feed JSON-LD `sameAs` (never explained). | Live 17, 18. `site-detail.ts:70,73`; `lib/publish-html.ts:77-78`; `SEOInjector.ts:236-243` | NEW |
| SET-05 | Scent | P1 | **Verify over-claims**: "G-FAKE000000 is verified" / "Measurement ID verified on 27 Sep 2026". Only checks format + own tracker's event count; never contacts Google. | Live 32. `AnalyticsScreen.tsx:223-241` | NEW |
| SET-06 | Validation (client≠server) | P1 | **Legacy analytics id locks the screen.** Client strict per-provider format; server `[A-Za-z0-9_-]{1,128}`. Stored enabled `G-SCRATCH0001` is red on open; every other change refused until user "fixes" an id the server accepts. | Live 30, 34. `analytics-ids.ts:19-28`; `AnalyticsScreen.tsx:249-253` | NEW |
| SET-07 | Validation | P2 | Silent normalisation: GA uppercased not trimmed; GTM/Clarity trimmed; Pixel strips letters ("abc12"→"12"); provider on with empty id saved as off, silently. | t5 log. `AnalyticsScreen.tsx:270-276,328,401,441,481` | NEW |
| SET-08 | Validation | P1 | **Headers accept anything.** Multi-line CSP and garbage Permissions-Policy saved "Settings saved"; go into deploy `vercel.json` with only ends trimmed (newlines inside header). `default-src 'none'` would blank every published page. | Live 43, 44 (reverted). `HeadersScreen.tsx:145-157`; `site-detail.ts:74,87`; `lib/publish-files.ts:143-151` | NEW |
| SET-09 | Correctness | P1 | **Auto-redirect sends visitors to missing pages.** Export now injects a script redirecting to `/fr/…`, `/ar/…`; screen itself says only the default locale is published. | Live 50, 52. `ExportHelpers.ts:299-313`; `ExportEngine.ts:645-648,982-983` | **REGRESSED** (A14-7) |
| SET-10 | Validation/cross-form | P1 | **Dashboard slug**: `BAD SLUG!!` saved; taken slug → raw Prisma "Unique constraint failed" (500). Slug = Vercel project name at publish → rename silently moves live site to a new project/URL; hint says only "Used in your site's URL". Not in editor; search finds nothing. | Live 82, 83 (reverted). `site-detail.ts:54` vs `sites.ts:55-63`; publish worker `route.ts:331`; `lib/vercel.ts:97-105` | NEW |
| SET-11 | Validation bypass | P1 | **Redirect CSV import skips every rule**: stored `javascript:alert(1)`, bare `new-page` (schema says fails whole publish), duplicate `/reservations`. | Live 92 (deleted). `redirect.service.ts:72-93` | NEW |
| SET-12 | Duplicate/scent | P1 | **Three integration catalogs disagree**: editor 6 "COMING SOON"; editor Overview "3 connected · 6 available"; dashboard Vercel + Webhooks connected + live Connect for GA/Mailchimp/Zapier/Slack. Dashboard GA "Tracking ID" never used; Marketplace GA not emitted. Only editor Analytics reaches published pages. | Live 01, 71, 86. `site-detail.service.ts:250,346`; `integrations-tab.tsx:8-12`; `marketplace-catalog.ts:53` | NEW |
| SET-13 | Cross-form | P1 | **"Meta title" means two things**: dashboard = home page's title; editor = site default (empty). "Edit SEO in the editor" opens canvas, not SEO. "Title template" shown but not editable anywhere. | Live 84 vs 20. `seo-tab.tsx:46-54,87`; `site-settings.service.ts:92-116` | NEW |
| SET-14 | Validation/cross-form | P1 | **Canonical accepts anything** ("not a url at all" → "Technical SEO saved"), silently dropped at publish. Editor robots/sitemap preview ignores canonical; publish uses it first → preview ≠ shipped. robots.txt dashboard-only, no pointer from editor. | Live 85. `site-detail.ts:65`; `publish-urls.ts:38-56`; `SeoScreen.tsx:62-85` | NEW |
| SET-15 | Duplicate/scope | P2 | Three "language" settings: General Site Language + Localization Default locale write same column; General offers 25 locales though only enabled allowed; workspace Default language + Timezone never read. Search "language" finds only General. | Live 14, t14, 86 | NEW |
| SET-16 | Collab | P2 | Headers + Localization don't lock for non-admins but saving needs ADMIN; EDITOR learns only from generic banner. | `site-detail.ts:104`; `shared.tsx:183-199` (code) | NEW |
| SET-17 | Misfit | P2 | Forms says "Submissions inbox + config" but no config; config in Inspector with no link; inbox doesn't name page/element. | Live 70. `constants.ts:124`; `FormAfterSubmitSection.tsx` | NEW |
| SET-18 | Stale copy | P2 | Webhook picker: "form.submit — … nothing sends it yet" but `form-submission.service.ts:173` sends it; a test pins the stale sentence. | Live 88. `webhooks-card.tsx:23`; `webhooks-card.test.tsx:47-49` | NEW (class of A14-6) |
| SET-19 | Scent | P2 | Editor Overview "A webhook delivery failed · 502" vs dashboard "✓ Delivering — last delivery 12d ago". | Live 01 vs 87 | NEW |
| SET-20 | Error UX | P2 | Dashboard forms: no client validation; raw server text ("url: Invalid url", raw Prisma). Workspace shows only first error. Team invite form is the good exception. | Live 81, 88, 89, 90 | NEW |
| SET-21 | Validation | P2 | Custom code "✓ HTML looks good" for 11 KB body code the server refuses (10,240 limit); no counter; unclosed tag doesn't block Save. | Live 41, 42. `AdvancedScreen.tsx:158-189` | NEW |
| SET-22 | Duplicates | P2 | Two full site-settings surfaces (Domains ×3, Redirects ×2, Indexing ×3, name/favicon/social/code ×2 — favicon URL vs upload, Submissions ×2). | Live 80, 86, 53 | STILL TRUE (A02-5 / PD-1) |
| SET-23 | Scope/discoverability | P2 | Workspace group in site Settings; Webhooks = Advanced in nav, Workspace in search index; dashboard-only fields (slug, password, canonical, robots, touch icon, sharing) have no editor link/search entry. | `constants.ts:128-131` vs `searchIndex.ts:202-213` | NEW |
| SET-24 | Navigation | P2 | Two unsaved-change dialogs: Ctrl+H "Leave and lose changes / Keep editing" (no Save) vs Esc "Discard / Keep editing / Save and continue". | Live 93, 94 | CHANGED (A04-2 data loss fixed) |
| SET-25 | Cross-form | P2 | Page SEO vs site SEO validate differently (page title hard-truncated at 60; site allows more then server refuses; page OG no rule, site OG http(s)); per-page "Indexed" shows while site indexing off, no precedence explained; no link between them. | `SeoTab.tsx:265-266,296-325`; `usePageSettings.ts:238-239` (code) | NEW |
| SET-26 | Honesty | P2 | "Settings saved" toast says "Your canvas content is unchanged" but Save runs `sites.saveProject` (saves pending canvas edits); "Return to settings" action does nothing. | `SettingsTab.tsx:451-455,477-490` | NEW |
| SET-27 | Validation/scent | P3 | Redirect dialog accepts self-loop, `/` as From, paths with spaces, `/(.*)` catch-all; Delete one click no confirm; "404 suggester" is slug history; `isValidToUrl` duplicates `redirectTargetSchema`. | Live 61. `RedirectDialog.tsx:76-92` | NEW |
| SET-28 | Polish | P3 | Integrations headings are raw lowercase ids; domain dialog rejects `https://www.example.com/` without saying drop `https://`. | Live 71, 54 | NEW |
| SET-29 | Duplicate | P3 | Two Twitter fields: General "Twitter" (URL, Site row) + SEO "Twitter Handle" (free text, unvalidated, not locked). | `SiteSettingsScreen.tsx:290-298`; `SeoScreen.tsx:251-262` | NEW |

## 4. Form validation matrix

Save models: **B** footer Save/Discard · **I** per action · **S** dashboard page Save.

| Field | Client rule | Server rule | Agree? | Live | Model | Verdict |
|---|---|---|---|---|---|---|
| Editor General · Site name | trimmed, required, 2–100 inline | min 2 / max 100 (`:53`); empty never sent | Partly | Empty: "Settings saved", no-op. 1 letter: banner + toast | B | ✗ |
| Editor General · Favicon URL | none | any string (`:73`) | both none | `javascript:` saved | B | ✗ |
| Editor General · Site Language | enabled locale (inline) | `DEFAULT_LOCALE_NOT_ENABLED` | Yes | Refused, repeated by autosave | B | △ |
| Editor General · Social links | `type=url` not enforced | any string record | both none | junk saved | B | ✗ |
| Editor SEO · Meta title / description | inline > 60 / 160 | max 60 / 160 | Yes | refused after Save | B | △ |
| Editor SEO · Twitter handle | none | none (project data) | — | junk accepted | B | ✗ |
| Editor SEO · OG image | must start http(s) | `z.string().url()` (accepts `ftp:`, `javascript:`) | **No** | inline error, then refused | B | △ |
| Editor Localization · Default locale / auto-redirect | select / toggle | locale check / boolean | Yes | — | B | auto-redirect ✗ (SET-09) |
| Editor Localization · Add locale | select of 25 | 2–10 chars, max 50 | Yes | error in dialog | I | ○ (commits pending removals) |
| Editor Domains · Domain | shared `domainNameSchema` | same | **Yes** | clear tags, submit disabled | I | ✓ |
| Editor Redirects · From / To | `/`-prefixed; path or http(s) | same | Yes | inline, Add disabled | I | △ (no loop checks) |
| Dashboard Redirects · CSV import | none | only `/`-prefixed, non-empty | — | bad rows imported | I | ✗ |
| Editor Analytics · GA/GTM/Pixel/Clarity | strict per provider | loose `[A-Za-z0-9_-]{1,128}` | **No** | Save refused | B | ✗ |
| Editor Custom code · Head/Body | HTML lint, no length | max 10,240; Pro | **No** | "looks good" then refused | B | ✗ |
| Editor Headers · CSP / Permissions-Policy | none | max 4,096 / 2,048 | — | junk saved | B | ✗ |
| Editor Headers · XFO / Referrer / HSTS | select | enum / int range | Yes | — | B | ✓ |
| Inspector · Form notify email / redirect URL | save on blur | email; absolute URL; ADMIN for email | Yes | not walked | I | △ |
| Pages drawer · SEO title / desc / OG | truncation / none | none | — | — | autosave | △/✗ |
| Dashboard Settings · Name | none | min 2 | — | raw toast | S | ✗ |
| Dashboard Settings · Slug | none | 3–50, no format, unique | — | junk saved; raw Prisma | S | ✗ |
| Dashboard Settings · Site password | none; `type="text"` | any string, no min | — | not tested | S | ✗ |
| Dashboard SEO · Canonical | none | max 255 | — | junk saved | S | ✗ |
| Dashboard Integrations · Webhook URL | none | URL, max 2000, SSRF guard | — | raw "url: Invalid url" | S | △ |
| Dashboard Integrations · GA Tracking ID | none | any config | — | not tested | S | ✗ (never used) |
| Dashboard Workspace form | hex colour only | `account.ts:43-52` | Partly | only first error, raw | S | △ |
| Dashboard Team · Invite | inline "Invalid: …", Send disabled | server schema | Yes | good | S | ✓ |

## 5. Cross-form relationship map

| Field (where edited) | Feeds | What the UI doesn't explain |
|---|---|---|
| Site name (editor General, dashboard Settings) | `Site.name`, topbar/breadcrumb, JSON-LD | Refused names leak into breadcrumb + autosave (SET-02); empty = silent no-op (SET-03) |
| Slug (dashboard only) | Vercel project name → default live URL + sitemap origin | Rename moves the live site; not in editor (SET-10) |
| Site Language = Default locale (2 screens) | `Site.defaultLocale`, `<html lang>`, redirect script | Same column twice; workspace language does nothing (SET-15) |
| Enabled locales + Auto-redirect | Export head script → `/<code>/` | Pages never published → 404s (SET-09) |
| Site meta / OG (editor SEO defaults) | Publish fallback when page has none | Dashboard shows home page's values under the same label (SET-13) |
| Page SEO (Pages drawer) | Overrides site defaults | No link from site screen; per-page indexing hides site switch (SET-25) |
| Indexing (editor SEO, dashboard, page drawer) | `noindex` + robots.txt | Three switches, no precedence |
| Canonical (dashboard) | Canonical tags; first choice for sitemap origin | Editor preview ignores it; invalid silently dropped (SET-14) |
| Domains (editor, site tab, workspace list) | robots origin, host redirects, publish URL | Three places |
| Redirects (editor dialog, dashboard tab/CSV, Pages door) | `vercel.json` redirects | CSV skips all rules (SET-11) |
| Favicon / touch icon (editor URL, dashboard upload) | `<link rel=icon>` | Two input models, one column; no validation (SET-04) |
| Social links | JSON-LD `sameAs` only | Invalid silently dropped (SET-04) |
| Head/body code (editor, dashboard) | Published head/body (inline scripts stripped) | Lint OK while server refuses length (SET-21) |
| Headers (editor only) | `vercel.json` headers | No checks, no preview (SET-08) |
| Analytics ids vs dashboard GA Tracking ID vs Marketplace GA | Only editor ids reach pages | 3 doors, 1 real; Verify over-claims (SET-05/06/12) |
| Canvas form → form record → Submissions (editor, dashboard) → form.submit webhook → notify email (Inspector) | End-to-end capture | Forms promises config; inbox has no page/element link; webhook copy says form.submit never fires (SET-17/18) |
| Workspace webhooks / integrations → editor Overview | Status + counts | Overview contradicts dashboard (SET-12/19) |

## 6. Prior-audit reconciliation

| Prior | Now |
|---|---|
| A02-1 / A01-2 / A12-1 / A16-1 (A-1) autosave pushes stale settings | **FIXED** (only changed fields, after page save). New: refused value loops every autosave (SET-02) |
| A02-2 non-admin autosave hits ADMIN-only update | **FIXED** for General/SEO/Custom code/Analytics (`BuildrikSyncProvider.ts:590`); Headers/Localization still editable (SET-16) |
| A02-5 / A01-4 / PD-1 two settings surfaces | **STILL TRUE** (Webhooks did move) |
| A02-16 grid/snap in General | **FIXED** |
| A04-2 shortcuts bypassed guard and lost edits | **CHANGED** — no data loss, two dialogs (SET-24) |
| A04-13/14, A14-13 sticky tab / ⌘⇧P Export landing | **FIXED** per fix report; reloads landed on canvas |
| A14-6 "not wired" copy | **FIXED** for redirects + Forms empty state; same class reappears in webhooks card (SET-18) |
| A14-7 / C-7 Localization has no consumer | **REGRESSED** — auto-redirect now emitted → 404s (SET-09) |
| A14 row 31 Integrations honest stub | **CHANGED** — Overview "3 connected", dashboard offers Connect (SET-12) |
| A19-3 upload site check | FIXED per fix report; not re-exercised |

## 7. Not verified
Anything needing Publish (CSP newlines in deploy, CSV redirects breaking deploy, auto-redirect 404s, canonical drop,
slug moving Vercel project) — from code. EDITOR/DESIGNER role (SET-16) code-only. FREE-plan locks (workspace is
Business). Production error masking. SET-02 exact line for post-Discard resend. SET-07 empty-id toggle (blocked by
SET-06). Pages drawer, Inspector form settings, dashboard site password, Add locale create, domain connect, Check DNS.
