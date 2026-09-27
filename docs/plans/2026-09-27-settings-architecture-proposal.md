# Settings — Current vs Proposed Architecture (Phase 22 deliverable)

Date 2026-09-27 · Status: **APPROVED 2026-09-27 (see report). Nothing in the product changed yet.**
Scope: editor Settings (`packages/editor/src/editor/sidebar/tabs/settings/**`), dashboard workspace/account
settings (`packages/dashboard/app/dashboard/settings/**`), dashboard site tabs (`/dashboard/sites/[id]/*`),
and the tRPC/services/Prisma behind them.

Evidence base:
- `docs/audits/2026-09-27-module-audit/02-settings.md` (SET-01…SET-29, **live-tested** this morning; cited as `SET-nn`).
- Three code sweeps from this session (editor tab, dashboard, server). Claims tagged **(code)** were read but not run.
  **(live)** means reproduced in 02-settings.md. **(unverified)** means inferred from code only.
- Re-read in this session: `sites.service.ts:759-762` (projectSettings stored verbatim), `ExportEngine.ts:630-676`
  (publish reads JSON customCode), `sanitizeHeadCode.ts` (allows `<script src>`), `sites.service.ts:341-346`
  (`getSite` has no `select`), `account.service.ts:337-362` (`enable2FA`), `workspace-settings.service.ts:154`
  (nothing reads `deletionScheduledAt`), `SiteSettingsScreen.tsx:180-184` (socials rewritten as three keys).

Design reference: Figma family `Settings · Clone` (56 rows in `boards.json`, page `3397:13062`). The v3 IA page `4418:45431` has
IA nodes that the code cites but `boards.json` does not track (`4418:127313 … 165478`, `6816:60270`).

---

## 1. Complete current Settings inventory

### 1a. Editor Settings (full page, rail **S**, ⌃, / site menu / ⌘K / Publish "Fix ›" / Page settings doors)

| Group | Row | Kind | Controls (label → store) | Save | UI gate |
|---|---|---|---|---|---|
| — | Overview | screen | read-only cards + "Needs attention" (`siteDetail.settingsOverview`) | — | — |
| SITE SETUP | General | screen | Site name → `Site.name`; Favicon URL → `Site.favicon`; Site Language → `Site.defaultLocale`; Author → project metadata; Twitter/Facebook/LinkedIn → `Site.socialLinks` | footer | ADMIN on Site columns |
| | Brand ↗ | door | → Brand full page | — | — |
| | Localization | screen | Default locale, Auto-redirect, Locales table (Remove staged), Add locale dialog (immediate) | footer + immediate | **none** |
| SEO & PUBLISHING | SEO defaults | screen | Meta title/description, OG image → Site cols; Twitter Handle → JSON only; Allow indexing; robots.txt **read-only preview** | footer | ADMIN (cols) |
| | Domains | screen | Add domain dialog, Force HTTPS, Remove (confirm), DNS table, Check DNS | immediate | ADMIN (Check DNS ungated) |
| | Redirects | screen | Rules CRUD dialog (Delete = no confirm), repair card from Pages, 404-suggester toggle → JSON | immediate + footer | **none** |
| | Export… | door | → Export modal | — | — |
| VISITORS | Analytics | screen | GA / GTM / Meta Pixel / Clarity: enable + ID, Verify dialog; hidden Consent | footer | none (JSON) |
| | Forms | screen | Form select, filters, submissions, Export CSV, Mark spam/Archive/Delete (confirm) | immediate | **none** |
| ADVANCED | Custom code | screen (Pro) | Head → `Site.headCode`, Body → `Site.bodyCode`, Global CSS → JSON | footer | Pro + ADMIN (cols) |
| | Headers | screen | CSP, X-Frame-Options, Referrer-Policy, HSTS + max-age, Permissions-Policy | footer (direct `settings.update`) | **none** |
| | Integrations | screen (Pro) | static "coming soon" list of 6 providers → docs links | — | Pro |
| | Webhooks ↗ | external | → dashboard Integrations (new tab) | — | — |
| WORKSPACE | Members ↗ · Billing ↗ | external | → dashboard (new tab) | — | — |

Shell: search (filters nav + focuses field, "Search everywhere" → ⌘K), unsaved dialog (Discard / Keep editing /
Save and continue), footer Save/Discard, per-screen load/error/save-error, last screen kept in localStorage.

### 1b. Dashboard workspace/account settings (`/dashboard/settings`, card directory)

| Group (today) | Page | Scope | Contents | Save |
|---|---|---|---|---|
| Workspace | Workspace & branding | workspace | name, URL slug, default language, timezone, icon, accent, "Edits need approval"; Sharing defaults card; Agency layer switch; Transfer ownership | explicit ×2, agency switch immediate |
| | Security | **user** | 2FA enable/disable, sessions (remove, sign out all), login history | immediate |
| | Notifications | user | 8 categories × in-app / email | optimistic immediate |
| | Team | workspace | invite, role, revoke, remove, bulk remove, pending invites, team activity | immediate + modals |
| Plan & billing | Plans · Billing · Usage & AI credits | workspace (OWNER) | plan cards → Stripe; payment, cancel, reactivate, invoices; usage | Stripe / modals |
| Sites & clients | Domains | workspace | read-only list → site Domains tab | — |
| | Apps & Integrations | workspace | Vercel connect/team picker/disconnect; Webhooks card; GA / Mailchimp / Zapier / Slack config | explicit / immediate |
| Developer | API tokens · AI & credits | workspace / read-only | tokens create/revoke/delete; credits | immediate |
| Personal | Account · Profile | user | email, password, connected accounts; profile fields | explicit |
| Danger zone | Delete workspace / Export data / Delete account | workspace / user | typed confirms | modal |

### 1c. Dashboard site tabs (`/dashboard/sites/[id]/*`)
Settings (name, **slug**, favicon + touch-icon **upload**, **site password**, head/body code, 5 social links) · SEO
(read-only home-page preview + **canonical, indexing, robots.txt**) · Domains (connect / **set primary** / remove) ·
Redirects (+ **CSV import/export**) · Submissions · Sharing · Overview · Traffic. The Sites list context menu holds
Rename / Archive / Transfer / **Delete site** (typed name).

### 1d. Settings-like controls in other modules
- Pages › Page settings: page SEO title/description/OG, per-page indexing, slug, page head code.
- Inspector › Form › After submit: success message, redirect URL, notify email (ADMIN), honeypot.
- Brand: tokens, fonts, presets.
- Publish panel: pre-checks that open Settings.
- Editor shell `PermissionsHost`: delete site.

## 2. Discovered scopes

| Scope | Where it lives | Owner module | Who can change it (server) |
|---|---|---|---|
| **Personal** (me only) | `User`, `UserPreference`, `NotificationPref`, sessions, 2FA | dashboard Personal | self |
| **Workspace** | `Workspace`, `WSSharingSettings`, `WorkspaceFeature`, `WorkspaceMember`, `Invite` | dashboard Workspace | ADMIN; transfer and delete OWNER |
| **Workspace connections** | `WorkspaceIntegration`, `WorkspaceWebhook`, `WorkspaceApp`, `ApiToken` | dashboard Apps & Integrations | ADMIN |
| **Billing** | `Workspace.plan` + `Subscription.plan` (**two copies**) | dashboard Billing | OWNER |
| **Site identity + output** | `Site.*` columns + `Site.projectSettings` JSON (**two copies**, §6) | editor Settings **and** dashboard site tabs | ADMIN (columns) / EDITOR (JSON, **bypass**) |
| **Site objects** | `Domain`, `DnsRecord`, `Redirect`, `FormBlock` submissions, `ShareLink` | editor Settings + dashboard site tabs | ADMIN (domains), EDITOR (redirects, submissions) |
| **Page** | `Page.seoTitle/Description` + `Page.settings.seo` (**two copies**) | Pages | EDITOR |
| **Element** | Form block after-submit | Inspector | EDITOR (notify email ADMIN) |
| **Published vs draft** | Most site settings apply **on next publish**; domain connect/remove apply **live**; password pushed at deploy | Publish | — |
| **Per-viewer local** | last Settings screen (localStorage `buildrick-nav-settings-panel-<id>`) | editor | self |

## 3. Settings responsibility model (proposed definition)

> **Site Settings** is where you configure how *this site* is identified, found, served, secured, measured, and
> reached, across every page, for everyone who visits it. What you set there appears in the published output or
> in site-wide behaviour, and it persists until someone changes it.
>
> It is **not** where you configure one page (Pages), one element (Inspector), the look (Brand), people and money
> (workspace), or your own account (Personal). Those appear in Site Settings only as **labelled doors**, never as
> a second editor for the same value.
>
> **Workspace settings** (dashboard) is where you configure the team, connections, billing, and defaults shared by
> every site. **Personal settings** affect only the signed-in user.

Test for each capability: *does the change persist, apply site-wide, and live outside the canvas task?* If yes, it is a
site setting. If it applies to one page or element, the owner module is primary and Settings links to it. If it applies to
people, money, or connections, the workspace owns it.

## 4. Feature ownership map (setting → scope → owner → Settings role → affected area)

| Capability | Scope | Primary owner (proposed) | Settings role | Affects | Risk |
|---|---|---|---|---|---|
| Site name | site | editor Settings › General | primary | topbar, `<title>` fallback, JSON-LD | low |
| Site URL slug | site | editor Settings › General (Advanced) | primary | **Vercel project name, default URL** | **high** |
| Favicon / touch icon | site | editor Settings › General | primary | published `<head>` | low |
| Social profiles | site | editor Settings › SEO & sharing | primary | JSON-LD `sameAs` | low |
| Default + enabled locales | site | editor Settings › Languages | primary | `<html lang>`, publish routing | med |
| SEO defaults (title, description, OG) | site | editor Settings › SEO & sharing | primary; overridden per page | published `<head>` | med |
| Indexing, canonical, robots.txt | site | editor Settings › SEO & sharing (Indexing) | primary | robots.txt, sitemap, noindex | **high** |
| Page SEO / page indexing / page head | page | Pages › Page settings | deep link | that page | med |
| Domains | site object | editor Settings › Domains | primary | live routing, SSL | **high** |
| Redirects (incl. CSV) | site object | editor Settings › Redirects | primary | `vercel.json` | med |
| Site password | site | editor Settings › Access | primary (Pro) | Vercel protection | med |
| Share links | site object | dashboard Sharing (per 06-collab) | deep link | preview access | med |
| Analytics IDs | site | editor Settings › Analytics | primary | published scripts | med |
| Form submissions | site data | editor Settings › Form submissions | primary (inbox) | — | med (delete) |
| Form after-submit config | element | Inspector | deep link per form | that form | low |
| Custom code | site | editor Settings › Custom code | primary (Pro, ADMIN) | published `<head>`/`<body>` | **high** |
| Security headers | site | editor Settings › Security headers | primary (ADMIN) | `vercel.json` headers | **high** |
| Archive / transfer / delete site | site | editor Settings › Danger zone **(PD-3)** + Sites list | administrative | site existence | **critical** |
| Brand | site design | Brand | door | canvas + output | — |
| Export | action | Site menu / ⌘K / topbar | none (action, not config) | — | — |
| Members, roles | workspace | dashboard Team | door | access | high |
| Billing, plan, usage | workspace | dashboard Billing | door + read-only plan pill | feature gates | high |
| Vercel, webhooks, 3rd-party apps, API tokens | workspace | dashboard Apps & Integrations | door | publish, events | high |
| Workspace name/icon/accent/approval | workspace | dashboard Workspace | — | all sites | med |
| Profile, security, notifications | personal | dashboard Personal | — | me | med |

## 5. Cross-module integration map

| Relationship | Entry | Destination | Context passed | Return path | Permission | Sync |
|---|---|---|---|---|---|---|
| Publish pre-check → Settings | Publish "Fix ›" | Settings › seo / domains / general | screen id | none (user re-opens Publish) | as screen | fresh read on open |
| Page settings → Site SEO | "Site SEO defaults ›" | Settings › SEO | screen | **none** | — | — |
| Page slug change → Redirect | "Add redirect" | Settings › Redirects repair card | pageId, from, to | **"Back to <Page> SEO"** ✓ | EDITOR | immediate |
| Settings → Brand | Brand ↗ | Brand full page | none | lost (Settings unmounts; last screen kept) | — | — |
| Settings → Export | Export… | Export modal | none | closes Settings | — | — |
| Settings → Members / Billing / Webhooks | ↗ rows | dashboard, **new tab** | none | tab close | ADMIN/OWNER there | no refresh on return |
| Settings › Forms ↔ Inspector form config | — | **no link either way** (SET-17) | — | — | — | — |
| Overview → any screen | "Open ›" | screen | screen id | Overview row in nav | — | — |
| Dashboard SEO "Edit SEO in the editor" | link | editor **canvas**, not SEO (SET-13) | none | — | — | — |
| Dashboard Domains (workspace) → site Domains | row | `/dashboard/sites/[id]/domains` | siteId | back link | ADMIN | — |
| Editor Analytics vs dashboard GA integration vs Marketplace GA | — | **three stores, only editor reaches pages** (SET-12) | — | — | — | none |
| Settings save → publish | — | nothing tells user a republish is needed | — | — | — | — |

## 6. Duplicate configuration map

| Pair | Same SoT? | Classification | Evidence |
|---|---|---|---|
| Site custom code: `Site.headCode/bodyCode` vs `projectSettings.customCode` | **No, publish uses JSON, Overview reports columns** | **DUPLICATE SOURCE OF TRUTH** | `ExportEngine.ts:642,676`; `site-detail.service.ts:344` |
| Favicon/OG/meta: `Site.*` vs `projectSettings.seo.*` | JSON wins at publish when set | **DUPLICATE SOURCE OF TRUTH** | `publish-html.ts:77-84`; `SEOInjector.ts:124,185` |
| Page SEO: `Page.seoTitle` vs `Page.settings.seo` | page JSON wins | **DUPLICATE SOURCE OF TRUTH** | `site-settings.service.ts:92-116` |
| Plan: `Workspace.plan` vs `Subscription.plan` | gates vs billing page read different ones | **DUPLICATE SOURCE OF TRUTH** | `permission.service.ts:113`; `billing.service.ts:84` |
| Site name: editor General vs dashboard Settings vs Sites-list rename | same column; **rename = EDITOR, settings = ADMIN** | REDUNDANT CONFIGURATION (role conflict) | `sites.ts:110` vs `site-detail.ts:104` |
| Social links: editor (3 keys) vs dashboard (5 keys) | same column; **editor save drops instagram/youtube/github** (unverified) | REDUNDANT + data loss | `SiteSettingsScreen.tsx:180-184` |
| Favicon: editor URL text vs dashboard upload | same column | REDUNDANT CONFIGURATION | SET-22 |
| Head/body code: editor vs dashboard | same column | REDUNDANT CONFIGURATION | SET-22 |
| Domains: editor screen vs dashboard site tab vs workspace list | same procedures; set-primary dashboard-only | editor/site tab REDUNDANT; workspace list = VALID SECONDARY ENTRY (read-only roll-up) | SET-22 |
| Redirects: editor vs dashboard tab (CSV) | same procedures; **CSV skips validation** | REDUNDANT CONFIGURATION | SET-11 |
| Indexing: editor SEO vs dashboard SEO vs page drawer | site ×2 same column; page = different scope | site pair REDUNDANT; page = RELATED BUT DIFFERENT (needs precedence copy) | SET-25 |
| Language: General "Site Language" vs Localization "Default locale" | same column, two paths | **UNNECESSARY CROSS-SURFACE DUPLICATION** (same screen family) | SET-15 |
| Workspace default language / timezone | never read | dead config (REMOVE or wire) | SET-15 |
| Twitter: General "Twitter" URL vs SEO "Twitter Handle" | different fields | RELATED BUT DIFFERENT, merge into one Social profiles block | SET-29 |
| Analytics: editor IDs vs dashboard GA "Tracking ID" vs Marketplace GA | three stores, one real | **REDUNDANT, and two of them do nothing** | SET-12 |
| Integrations: editor stub vs Overview counts vs dashboard | disagree | **UNNECESSARY CROSS-SURFACE DUPLICATION** | SET-12, SET-19 |
| Submissions: editor Forms vs dashboard Submissions | same data | VALID SECONDARY ENTRY (dashboard is outside-editor triage) | — |
| Unsaved dialog: Settings dialog vs shell tab-switch dialog | different copy/actions | UNNECESSARY duplication | SET-24 |
| Usage (dashboard Usage) vs Billing usage bars | different data sources | REDUNDANT | dashboard sweep §5 |
| "Usage & AI credits" vs "AI & credits" cards | overlapping | REDUNDANT | dashboard sweep §0 |
| Plans page vs Billing inline PlanComparison | same job | REDUNDANT | dashboard sweep §5 |

## 7–17. Findings by lens

Every row gives Finding · Evidence · Current → Proposed · Scope/Owner/Settings role · Affected modules · Dependencies ·
Risk · Priority · Decision · Confidence. User job is in the Finding text.

### P0 — ship-stoppers that are not IA (security / data / trust)
These fall under the prompt's permissions (Phase 14), destructive-flow (Phase 15) and dependency (Phase 13) lenses. They need fixing whatever
IA we choose. **Approval asked separately (D1).**

| ID | Finding | Evidence | Current → Proposed | Affected | Risk | P | Decision | Conf |
|---|---|---|---|---|---|---|---|---|
| SA-01 | An EDITOR on FREE can publish custom `<script src>`, favicon, OG and meta through `sites.saveProject`. This bypasses ADMIN and Pro, because publish reads the JSON copy | `sites.service.ts:759-762`; `ExportEngine.ts:642,676`; `sanitizeHeadCode.ts` allows `<script src>` (code) | JSON stored verbatim → server strips column-backed keys from `projectSettings` (or rejects them below role/plan); publish reads **columns only** (one SoT) | server sites.service, ExportEngine, SEOInjector, BuildrikSyncProvider | high (security) | **P0** | MERGE (single SoT) | high |
| SA-02 | `sites.get` returns `publishedPassword` ciphertext to every member, including VIEWER | `sites.service.ts:341-346` (no `select`) (code) | → explicit `select` / redact like `settings.get` | server | high | **P0** | KEEP feature, fix leak | high |
| SA-03 | `twoFactor.enable` can rotate an active 2FA secret with no re-auth | `account.service.ts:337-362` (code) | → refuse when enabled, or require current code/password | Security page | high | **P0** | KEEP, fix | high |
| SA-04 | Delete workspace: copy says "permanent… subscription cancelled immediately". The service only schedules +30d, and **no processor exists**, so it never deletes | `workspace-settings.service.ts:150-157`; no reader of `deletionScheduledAt` (verified grep) | → **PD-5**: build the processor + cancel subscription, or change copy to what happens | Danger zone, Home banner | high (trust) | **P0** | PRODUCT DECISION | high |
| SA-05 | Auto-redirect sends visitors to `/fr/`, `/ar/` pages that are never published (regressed) | SET-09 (live) | → hide the toggle and stop emitting the script until per-locale publish ships | Localization, Export | high (visitor 404) | **P0** | ADVANCED → hidden-until-relevant | high |
| SA-06 | A slug change silently moves the live site to a new Vercel project and strands its domains. No format rule; a taken slug returns a raw 500 | SET-10 (live); `lib/vercel.ts:97-106` | → decouple project name from slug, or confirm with "moves live URL" + validation + uniqueness check | publish, domains | high | **P0** | ADVANCED + confirm | high |
| SA-07 | Delete site leaves the Vercel deployment and domains live. No restore, no activity entry | `sites.service.ts:530-556`; purge cron (code) | → unpublish on delete; activity log; restore within 30d (**PD-6**) | Sites list, editor PermissionsHost | high (trust) | **P0** | KEEP, fix | med |
| SA-08 | An editor General save rewrites `socialLinks` as {twitter, facebook, linkedin}, dropping links set in the dashboard | `SiteSettingsScreen.tsx:180-184` (code, **unverified at runtime**) | → merge the patch; one Social profiles block with all 5 networks | General, dashboard Settings | med (data loss) | P0 if repro | MERGE | med |

### Save model / forms / validation (Phases 11–12)

| ID | Finding | Evidence | Current → Proposed | P | Decision | Conf |
|---|---|---|---|---|---|---|
| SA-10 | Save is not blocked by inline errors. The server refusal shows a generic banner that never names the field | SET-01 (live) | → Save disabled while any field is invalid; server Zod path → field error | P1 | KEEP, fix | high |
| SA-11 | Refused values loop on every autosave; Discard doesn't restore the breadcrumb name | SET-02 (live) | → settings save independent of project autosave (SA-13); rollback covers metadata | P1 | fix | high |
| SA-12 | Empty site name reports "Settings saved" but sends nothing | SET-03 (live) | → blocked by SA-10 | P1 | fix | high |
| SA-13 | Settings Save runs `sites.saveProject` (saves canvas too) while the toast says "canvas unchanged"; "Return to settings" does nothing | SET-26; `SettingsTab.tsx:451-455` | → dedicated `settings.update` + `projectSettings` patch; honest toast "Saved · applies on next publish [Publish]" | P1 | fix | high |
| SA-14 | Client ≠ server on 9 fields: analytics loose server vs strict client; OG `z.url()` accepts `javascript:`; custom-code length; headers anything; favicon/social/canonical none | SET-04/06/08/14/21 | → one shared Zod schema in `packages/shared/schemas/site-detail.ts` drives client and server; legacy analytics IDs grandfathered as a warning, not a lock | P1 | MERGE (SSOT) | high |
| SA-15 | Second edit after a Save may not mark dirty (`markClean` never called) → no footer, no guard | `useSettingsScreen.ts:62-63` (code, unverified) | → dirty = value ≠ snapshot (as Redirects does) | P1 | fix | med |
| SA-16 | Three save models with no rule: footer, immediate, and mixed on Redirects and Localization (Add locale commits staged edits) | SET map; editor sweep §3, §6 | → **Rule:** *fields* = per-screen footer Save; *objects* (domain, redirect, locale, submission) = immediate with their own dialog. The 404 toggle becomes immediate. Add locale stops committing staged edits. Header shows "Saves immediately" / "Save to apply" per region | P1 | REORGANIZE | high |
| SA-17 | Two unsaved dialogs with different actions | SET-24 | → one dialog (Discard / Keep editing / Save and continue) for every exit, shell tab-switch included | P2 | MERGE | high |
| SA-18 | Dashboard forms: raw server text, no client validation; the dirty flag ignores icon/favicon/social; `beforeunload` only | SET-20; dashboard sweep §1, §10 | → same shared schemas client-side; in-app nav guard | P2 | fix | high |
| SA-19 | Silent failures: workspace icon upload, integration remove, Vercel disconnect, webhook disconnect/regenerate, `sites.rename`, notification rollback | dashboard sweep (code) | → every mutation gets `onError` toast naming the action | P1 | fix | high |
| SA-20 | Password form clears on failure; client hints but doesn't enforce server complexity | `account-tab.tsx:139-141` | → keep values, enforce same schema | P2 | fix | high |

### Permissions (Phase 14)

| ID | Finding | Evidence | Proposed | P | Decision | Conf |
|---|---|---|---|---|---|---|
| SA-21 | Headers, Localization, Redirects, Forms: no UI role gate; the server needs ADMIN (Headers/Loc) or EDITOR | SET-16; editor sweep §3, §6, §8, §10 | → screen-level read-only banner "Only admins can change security headers" + disabled controls, driven by one table of min-role per procedure | P1 | fix | high |
| SA-22 | Dashboard site Settings/SEO/Domains/Redirects, workspace form, webhooks, integration remove, token revoke/delete, Plans CTAs, Reactivate: no UI gate | server sweep §2 table | → same pattern in dashboard | P1 | fix | high |
| SA-23 | Site name: EDITOR via rename, ADMIN via settings | `sites.ts:110` vs `site-detail.ts:104` | → **PD-4** pick one (recommend ADMIN for both, since the name ships in output) | P1 | PRODUCT DECISION | high |
| SA-24 | ADMIN can switch off the approval gate that governs ADMINs; `cancelDelete` is ADMIN while delete is OWNER | `publish.service.ts:357`; `account.ts:229` | → approval + agency switches OWNER-only; cancelDelete OWNER | P1 | fix | high |
| SA-25 | ADMIN can delete another ADMIN / the last admin; revoke logs the user out of **all** workspaces | `team.service.ts:196-231` | → last-admin guard on delete; per-workspace revoke | P2 | fix | med |
| SA-26 | Delete account asks for no password/2FA | `SH/account.ts:85-87` | → re-auth | P1 | fix | high |

### Destructive / high-risk (Phase 15)

| Action | Today | Proposed confirmation | Recovery | Log |
|---|---|---|---|---|
| Delete site | typed name; soft 30d; deployment stays live | typed name + "unpublishes <domain> now" | restore in 30d (PD-6) | activity (missing today) |
| Delete workspace | typed name; **does nothing** | typed name; honest copy | cancel in 30d | activity |
| Delete account | typed DELETE, no re-auth; re-request after cancel → 500 | typed + re-auth | cancel in 30d; upsert fix | audit |
| Transfer workspace / site | no modal / no typed confirm | typed name | cancel pending | activity |
| Slug change | none | confirm modal naming old → new URL | revert slug | activity |
| Remove domain | modal ✓ | keep | re-add | ✓ |
| Unpublish | modal ✓ | keep | republish | ✓ |
| Delete redirect | **one click** | inline undo toast (5s) | undo | activity (missing) |
| Remove locale | staged, no confirm | confirm when locale has translations | re-add | activity |
| Delete submission | strong modal ✓ | keep | none (by design) | — |
| Disconnect Vercel / webhook / integration | none / inline / none | modal naming what stops (publishing / deliveries) | reconnect | audit |
| Revoke session / sign out all / revoke invite / delete token | none | confirm for "sign out all" only; others undo toast | — | — |
| Cancel subscription | reason modal ✓ | keep | reactivate | billing |

### Scope clarity (Phase 9)

| Setting class | Affects | Current indication | Proposed indication |
|---|---|---|---|
| All editor site screens | this site, all collaborators, published output | breadcrumb "Group / Title" only | header scope line **"<Site name> · all pages · applies on next publish"** |
| Domains, Forms inbox | live, immediately | "Saves immediately" | "Live immediately · no publish needed" |
| Workspace rows in editor | every site + team | ↗ icon, new tab | separate footer group **"Managed in workspace settings ↗"**, never mixed with site groups |
| Page overrides (SEO, indexing) | one page | strip on SEO screen | per-field "Overridden on 3 pages · View" link (PD-7 if data cost is too high) |
| Dashboard Security, Profile, Notifications, Account | only me | Security sits under **Workspace** | all under **Personal** group ("Only affects you") |
| API tokens | workspace | labelled "Personal access tokens" | rename "Workspace API tokens" |
| Workspace default language / timezone | nothing today | looks active | remove, or label "Default for new sites" once wired (PD-8) |

### Discoverability, search & IA (Phases 7, 8, 19)
- **Search: KEEP.** It works: 15 sections + fields, focuses the field, hands off to ⌘K. Gaps (SET-23): no entries for slug, password,
  canonical, robots edit, touch icon, notify email; Webhooks group mismatch nav vs index; Headers anchors ≠ index ids.
  Proposed: index every field that moves in, add aliases (url→slug, noindex→indexing, tracking→analytics, favicon→icon),
  and fix anchors. Search stays scoped to *site* settings, and its placeholder says so: "Search site settings".
- Info-scent defects to fix in place: Verify says "verified" for fake IDs (SET-05) → rename to "Check data is arriving",
  state "Format OK · no events yet". Overview "3 connected" vs stub (SET-12/19) → Overview reads real integration state or
  omits the row. Integrations headings are raw ids (SET-28). "Submissions inbox + config" (SET-17).
- Cognitive load: editor nav has 15 rows in 5 groups plus 3 external. That is fine in count; the problem is mixing: Export
  (action), Integrations (stub), 3 workspace doors, Brand door. Dashboard: 15 cards in 6 groups with 3 overlapping pairs.

### States (Phase 18)
Present and good: loading / load-error / save-error / empty per editor screen (Clone-conformed). Missing:
**read-only (role)** screen state; **"requires publish"** after-save state; **plan-locked row pill** in nav (only
`data-locked` today); **integration disconnected** status on Overview; **pending-deletion** state visible inside
Settings (only a Home banner today); dashboard **permission-denied** only on Team.

### Consistency & a11y (Phases 20–21), code-level only
- Editor screens compose `chrome-ui` consistently (Section/Field/LoadCard). Dashboard uses a separate component set; no change proposed (different app).
- Disabled-with-reason uses `title` tooltips in dashboard (Vercel, API tokens), which keyboard and touch users cannot reach → visible helper text.
- Remove dead `SwitchRow`, `SCREEN_SUCCESS/NOTICE/NOTE`, `registerRetryLoad`, dashboard `IntegrationsTab` (dead).
- 2FA QR is rendered by third-party `api.qrserver.com`, **sending the TOTP secret off-site** → render locally (P1, security).
- Not verified: focus order, contrast, target sizes live. Needs a `/design-review` pass after implementation.

## 18–24. Decisions per capability

| Decision | Items |
|---|---|
| **KEEP** (as is, fix defects) | Overview; General (name, favicon, author); SEO defaults; Domains; Redirects; Analytics; Custom code; Headers (renamed); Forms inbox (renamed); settings search; Clone state set; dashboard Team, Notifications, Profile, Account, Billing, API tokens, Apps & Integrations, Danger zone |
| **MOVE into editor Settings** (PD-1) | slug (→ General › Advanced), site password (→ new **Access**), canonical + editable robots.txt (→ SEO › Indexing), touch icon + favicon upload (→ General), 5-network social links (→ SEO & sharing › Social profiles), set-primary domain (→ Domains), redirect CSV import/export (→ Redirects) |
| **MOVE within dashboard** | Security → Personal group; Transfer ownership → Danger zone |
| **MERGE** | General "Site Language" into Languages (one control); Twitter URL + Twitter Handle → Social profiles; Webhooks ↗ + Integrations → one "Integrations & webhooks ↗" door; Plans into Billing; "Usage & AI credits" + "AI & credits" → "Usage & credits"; two unsaved dialogs → one; site-setting copies in JSON → columns (SA-01) |
| **SPLIT** | "SEO & publishing" group → **Search & sharing** (SEO, social, indexing) and **Publishing** (Domains, Redirects, Access); dashboard Account card copy vs Security (sessions) |
| **DEEP LINK (door)** | Brand ↗; Members ↗; Billing ↗ (+ read-only plan pill); Integrations & webhooks ↗; Share links ↗ (dashboard Sharing); page SEO overrides → Pages; each form → Inspector form config; dashboard site Settings/SEO/Domains/Redirects tabs → **read-only summary + "Edit in editor › Settings › X"** (PD-1) |
| **ADVANCED** (collapsed, admin) | slug; robots.txt edit; canonical; HSTS max-age; auto-redirect (hidden until per-locale publish, SA-05); Danger zone (PD-3) |
| **REMOVE** | Editor **Integrations** stub screen and its Pro lock (PD-2); **Export…** from Settings nav (stays in site menu/⌘K/topbar + search as action); dashboard GA "Tracking ID" integration + Marketplace GA (they do nothing; SET-12) (PD-2); dead workspace `notify` sharing flag + default language/timezone unless wired (PD-8); dead code listed §20 |

## 25. Proposed Settings hierarchy

### Editor · Site settings (site scope only)
```
‹ Back to canvas            Search site settings
<Site name> · all pages · applies on next publish      ← scope line on every screen

Overview
SITE
  General            name · favicon + touch icon · author · ▸ Advanced: URL slug (confirm)
  Languages          default locale · enabled locales (objects) · [auto-redirect hidden, SA-05]
  Brand ↗
SEARCH & SHARING
  SEO                defaults (title, description, OG) · Social profiles (5 networks)
                     · ▸ Indexing: allow indexing · canonical · robots.txt (editable)
                     · "Page overrides live in Pages ›"
PUBLISHING
  Domains            add · set primary · force HTTPS · DNS · remove          (live immediately)
  Redirects          rules · 404 suggestions · CSV import/export             (live on publish)
  Access             site password (Pro) · Share links ↗
VISITORS
  Analytics          GA · GTM · Pixel · Clarity · "Check data is arriving"
  Form submissions   inbox · export · per-form "Configure in Inspector ›"
ADVANCED            (admin)
  Custom code        head · body · global CSS (Pro)
  Security headers   CSP · XFO · Referrer · HSTS · Permissions
DANGER ZONE         (owner, PD-3)
  Archive · Transfer · Delete site
───────────────
Managed in workspace settings ↗   Members · Billing (plan pill) · Integrations & webhooks
```
Net: 13 site screens → 11 (−Integrations stub, −Export action, +Access); 3 workspace doors grouped out of
the site IA; every site-scope field now has exactly one editor.

### Dashboard · Workspace settings
```
WORKSPACE     General & branding (+ sharing defaults, agency layer) · Team
CONNECTIONS   Apps & integrations (Vercel · Webhooks · apps) · Domains (roll-up) · Workspace API tokens
BILLING       Plan & billing (plans merged) · Usage & credits (merged)
PERSONAL      Profile · Account & sign-in · Security (2FA, sessions) · Notifications      "Only affects you"
DANGER ZONE   Transfer workspace · Export my data · Delete workspace · Delete account
```
Dashboard site tabs: Overview · Traffic · Submissions · Sharing stay. Settings / SEO / Domains / Redirects become
read-only summaries with "Edit in Site settings ›", which opens `/edit/:id` with Settings on that screen (PD-1).

## 26. Proposed scope model
Five scopes, each with one home and a visible label:
**Personal** (dashboard › Personal) · **Workspace** (dashboard) · **Billing** (dashboard, OWNER) · **Site** (editor Settings) ·
**Page/Element** (Pages / Inspector). The editor never edits workspace or personal values, and the dashboard never edits
site values (PD-1). Site config has one DB home per value: columns for Site-row values. `projectSettings` keeps only
values without a column (analytics, global CSS, 404 toggle, consent), and the server validates those too (new shared
`projectSettingsSchema`).

## 27. Proposed save model
| Region | Model | Indicator | Guard |
|---|---|---|---|
| Site setting **fields** (General, Languages defaults, SEO, Access, Analytics, Custom code, Headers) | per-screen footer Save/Discard; Save disabled while invalid; dedicated settings mutation (not saveProject) | footer "Unsaved changes"; after save: toast "Saved · applies on next publish [Publish]" | one unsaved dialog, all exits |
| Site **objects** (domain, redirect, locale, submission) | immediate, each via its own dialog; destructive = confirm or undo | header "Live immediately" / "Saved · applies on next publish" | none needed |
| Dashboard workspace/personal forms | explicit Save; same shared schema client-side | dirty covers every field | in-app route guard |
| Toggles with no payload (notifications, agency) | immediate optimistic with **error toast + rollback** | — | — |

## 28. Open product decisions
PD-1 … PD-8 are the approval questions (asked alongside this doc):
- **PD-1** Editor Settings is the single site-settings editor; dashboard site tabs become read-only summaries + deep links.
- **PD-2** Remove editor Integrations stub + dashboard GA/Marketplace GA (dead doors) vs keep as doors.
- **PD-3** Add a site Danger zone (archive/transfer/delete) to editor Settings vs keep it in the Sites list only.
- **PD-4** Site rename role: ADMIN everywhere vs EDITOR everywhere.
- **PD-5** Workspace deletion: build the processor (+ Stripe cancel) vs change copy to the real behaviour.
- **PD-6** Site restore within 30 days (new procedure) vs hard "gone" copy.
- **PD-7** Per-field "overridden on N pages" counts (needs a page-override query) vs one static strip.
- **PD-8** Workspace default language/timezone + sharing `notify`: wire as defaults for new sites vs remove.
- **D1 (sequencing)** Fix P0 SA-01…SA-08 first, independent of IA approval, vs bundle with the redesign.

Not verified (carried from 02-settings §7 plus this session): anything requiring a Publish (JSON-vs-column precedence at
deploy, auto-redirect 404s, slug moving the Vercel project), non-OWNER roles live, FREE-plan locks live, SA-08 and SA-15 at
runtime, dashboard settings pages at runtime, a11y live.

## GSTACK REVIEW REPORT

| Run | Status | Findings |
|---|---|---|
| plan-design-review (2026-09-27, target: Settings product surface) | Phase 22 delivered; stopped at the approval gate | 8 P0 (SA-01…08), ~17 P1, ~8 P2; IA: 13→11 site screens, 15→12 dashboard cards |
| Evidence | 02-settings.md (live) + 3 code sweeps + 7 claims re-read this session | — |
| Mockups | **Not generated.** The prompt forbids redesign before architecture approval (Phase 23) | — |
| Outside voices | Not run | — |

Design completeness of current Settings: **4/10** (states strong; ownership, save model, scope labels, and
validation weak). Proposed architecture if approved: **8/10** on paper. The remaining gap is visual design (mockups
after approval) and live verification.

DECIDED (founder, 2026-09-27): D1 = fix P0 SA-01…08 first, separately from the redesign · PD-1 = editor Settings owns
site settings; dashboard site Settings/SEO/Domains/Redirects become read-only summaries + deep links · PD-2 = remove
editor Integrations stub, dashboard GA integration and Marketplace GA · PD-3 = owner-only Danger zone in editor Settings.

PD-4 = site rename needs ADMIN everywhere (`sites.rename` raised to ADMIN) · PD-5 = build the workspace-deletion
processor (30-day grace, Stripe cancel, unpublish sites) and make the copy match · PD-6 = add "Recently deleted" +
Restore within 30 days · PD-7 = keep the static page-override strip (no counts) · PD-8 = remove workspace Default
language, Timezone and sharing `notify` (read by nothing).

VERDICT: ARCHITECTURE APPROVED IN FULL (9/9 decisions, all recommended options). Next: P0 fix arc (SA-01…08), then
Phase 23 redesign against §25–27, then Phase 24 validation.

NO UNRESOLVED DECISIONS
