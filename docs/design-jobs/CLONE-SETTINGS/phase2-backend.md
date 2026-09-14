# Settings · Clone S2 — backend delta (for the founder's "go")

Phase: **S2 DISTRIBUTION** — Domains · Analytics · Localization, their states, and the overlays
the section reaches: `3737:43669` Add a domain · `3737:44855` Add locale · `3737:44869`
`<Locale> · Translation checklist` · `4256:26844` Analytics · Connection verified (all four cached
under `shots/`). Frames: `3397-32206` Domains + `3397-32985` loading + `3397-33034` empty +
`3397-33085` load-error + `3397-33134` save-error + `3397-34402` remove-confirm + `3455-15509`
removed · `3397-32295` Analytics + `3953-49515` / `3953-49670` / `3951-26455` + `3397-34148`
validation · `3397-32376` Localization + `3397-33194` / `3397-33241` / `3397-33288`.

Nothing below is built until this doc is approved (plan Q3c). **This phase has a migration.**

## 1. What the frames need vs what the code has

### Domains (`3397:32206`, `3737:43669`, `3397:34402`, `3455:15509`)

| the frame draws | code today | delta |
|---|---|---|
| header `Add domain` → dialog: Domain name (+ `Available`) · Domain type `Primary · Redirect · Subdomain` · DNS provider select (`Namecheap`, `Cloudflare, GoDaddy and Other are also supported.`) · Nameservers (read-only, per provider) · DNS records table `A @ 76.76.21.21 · CNAME www cname.vercel-dns.com · TXT _buildrick brk-verify-…` · Force HTTPS toggle · `DNS can take up to 48 hours to propagate. SSL is issued automatically.` · Cancel · Add domain | `siteDetail.domains.connect({siteId, domain})` creates the row + CNAME instructions (or Vercel's verification records when the workspace has Vercel); `Domain` has `isPrimary`, `status`, `sslStatus`; no type, no HTTPS flag, no provider, no TXT | **migration** `Domain.kind` (`PRIMARY`\|`REDIRECT`\|`SUBDOMAIN`, default `PRIMARY`; `isPrimary` stays the "which one is primary" flag), `Domain.forceHttps Boolean @default(true)`, `Domain.dnsProvider String?`. `connect` takes `{kind, dnsProvider, forceHttps}`, writes the three records the frame draws (A + CNAME + a `TXT _buildrick brk-verify-<token>` — the token is the row id's hash, no column), and the nameserver instructions come from a per-provider table in the service. **`Available`** = not connected to any site in this database (`Domain.domain` unique check, new query `domains.checkAvailability({domain})`); registrar availability is `blocked:external`. |
| Custom domain card: Domain · Status `VERIFIED` · Force HTTPS toggle · `Remove <domain>…` | status from `checkDomainDns` (real `dns.resolve4` / `resolveCname`); no toggle | **`domains.update({id, forceHttps})`** (new mutation, ADMIN). `checkDomainDns` also resolves **TXT** (`dns.resolveTxt`) so the `_buildrick` record can leave `PENDING`. |
| DNS records table with per-record `VERIFIED` / `PENDING` | `DnsRecord.verified` | as is (`check` refreshes it — a `Check DNS` action the screen keeps, the frame's status pills read it) |
| `Actions apply immediately · nothing to save here` · Done; remove-confirm → `<domain> removed` | `remove` exists | client |
| Force HTTPS on the published site | the publish worker writes `_redirects` / headers from `Redirect` rows and the header columns | the worker adds the `http://* → https://*` rule for a primary domain with `forceHttps` (`lib/publish-files.ts`, one rule; if the host has no such rule format, record `blocked:host-redirect` and keep the flag stored). |
| loading · empty · load-error · save-error | client | client (`domains.list` read; empty when none) |

### Analytics (`3397:32295`, `3397:34148`, `4256:26844`)

| the frame draws | code today | delta |
|---|---|---|
| Google Analytics card: Enable · Google Analytics ID · **Connection status** `RECEIVING DATA · Measurement ID verified on 2 Jul 2025` + `Verify` · **Last received data** `2 Jul 2025, 19:38 · 1,284 events in the last 24 hours` | `projectSettings.analytics.googleAnalytics {enabled, measurementId}`; the site's own tracker writes `AnalyticsEvent` rows; no verification, no receiving signal | **new query `siteDetail.analytics.status({siteId})`** → `{ lastEventAt, events24h }` from `AnalyticsEvent` (the site's own tracker — the number the frame draws is OUR events; GA's own Data API is OAuth = `blocked:external`, said on the row). **`Verify`** = a real check of the id's shape per provider (`G-…`, `GTM-…`, numeric pixel, Clarity id) + `verifiedAt` stored in `projectSettings.analytics.<provider>.verifiedAt` (JSON — no migration) + the status read; the `Connection verified` dialog reads `<id> is receiving data. <n> events arrived in the last 24 hours.` / `Last checked just now · Data usually appears within 30 minutes of the first visit.` No new mutation: `verifiedAt` rides the settings save. |
| Google Tag Manager · Meta Pixel (+ Clarity, Consent below the fold as the code has them) | exist | client restyle |
| validation (`3397:34148`) | format rules exist per field | client |
| loading · load-error · save-error | client | client |

### Localization (`3397:32376`, `3737:44855`, `3737:44869`)

| the frame draws | code today | delta |
|---|---|---|
| Default: `Default locale` select · **`Auto-redirect by browser`** toggle | `Site.defaultLocale`, `enabledLocales`; no redirect flag | **migration** `Site.localeAutoRedirect Boolean @default(false)`; `settings.update` accepts it; the client export engine emits the first-visit `navigator.language` redirect snippet when on (real behaviour, no host rule needed). |
| Locales table: `LOCALE · PATH · PAGES TRANSLATED · STATUS` (`English / 6 of 6 LIVE` · `French /fr 4 of 6 PENDING` · `Arabic /ar 0 of 6 NOT STARTED`) | `Page.translations` JSON per page; `pages.getTranslation/setTranslation`; the screen lists codes only | **new query `siteDetail.locales({siteId})`** → per enabled locale `{ code, path, translated, total, status }` (status: default or all pages translated → `LIVE`; some → `PENDING`; none → `NOT STARTED`), plus `pending: string[]` page names for the checklist. Read-only aggregation over existing tables. |
| header `Add locale` → dialog: Language list (`Spanish — Español · es-ES`, …) · `Locale code` + `URL prefix /es` · `Set as default locale` toggle · `Starts as a draft. Translate every required page before this locale can be published.` · Cancel · Create locale | `enabledLocales` is a string array of bare codes (`es`), the translations are keyed by them | client; the product's codes stay bare (`es`, the URL prefix `/es`) with the frame's `Language — Native` label; region-coded ids would re-key every translation. Recorded on the row. |
| row → `<Locale> · Translation checklist`: `<site> · /ar · Draft · 0 of 6 pages` · `Right-to-left locale. Begin with Home, then Menu, Contact, …` · Back to localization | — | client, from `siteDetail.locales` (`pending` page names in site order; RTL for `ar`, `he`, `fa`, `ur`) |
| `Restoring a site version leaves this configuration unchanged.` (amber strip, also on Domains) | — | client copy |
| loading · load-error · save-error | client | client |

## 2. Migration (one, `settings_s2_domains_locales`)

```prisma
model Domain {
  kind         String   @default("PRIMARY")   // PRIMARY | REDIRECT | SUBDOMAIN
  forceHttps   Boolean  @default(true)
  dnsProvider  String?
}
model Site {
  localeAutoRedirect Boolean @default(false)
}
```
Reversible (drop the four columns). Applied locally with `prisma migrate dev`; prod is the
founder's `prisma migrate deploy`.

## 3. New / changed server surface

| procedure | kind | notes |
|---|---|---|
| `siteDetail.domains.connect` | changed input `{siteId, domain, kind?, dnsProvider?, forceHttps?}` | writes A + CNAME + TXT `_buildrick` records; nameservers per provider from a service table |
| `siteDetail.domains.checkAvailability` | new query `{domain}` | `Domain.domain` not in use across the database (the table has no unique index — add none; a query) |
| `siteDetail.domains.update` | new mutation `{id, forceHttps}` | ADMIN via `checkSiteRole` like `remove` |
| `siteDetail.domains.check` | changed | `checkDomainDns` also `dns.resolveTxt` |
| `siteDetail.analytics.status` | new query `{siteId}` | `{ lastEventAt: Date \| null, events24h: number }` from `AnalyticsEvent` |
| `siteDetail.locales` | new query `{siteId}` | the per-locale summary + pending page names |
| `siteDetail.settings.update` | changed input | `+ localeAutoRedirect?: boolean` |
| shared schemas | `packages/shared/schemas/site-detail.ts` | `domainKindSchema`, `analyticsStatusSchema`, `localesSummarySchema`, the changed inputs |
| publish worker | `lib/publish-files.ts` | the https redirect rule for `forceHttps` (or `blocked:host-redirect`) |
| export engine (editor) | `ExportEngine.ts` | the auto-redirect snippet when `localeAutoRedirect` |

Tests: services (`domain.service` TXT + availability + kind/forceHttps, `analytics.status`,
`locales` summary), router access tests, the migration's generated client type-checks.

## 4. Seed + fixtures

`prisma/seed-settings-clone.ts` grows (same ids, same `--reset`): the seeded domain gets A + CNAME
`verified: true` and the TXT `verified: false` (the frame's `VERIFIED / VERIFIED / PENDING`),
`kind: PRIMARY`, `forceHttps: true`; a `fr` locale in `enabledLocales` with 2 of the 3 scratch pages
carrying `translations.fr` (→ `PENDING`), `ar` untouched (→ `NOT STARTED`); ~40 `AnalyticsEvent`
rows in the last 24 h + `projectSettings.analytics.googleAnalytics` `{enabled, measurementId:
"G-SCRATCH0001"}`. Forced states as in S1 (fetch patched for load/save errors); `remove-confirm` →
`removed` on the seeded domain, re-seeded after; DNS `check` runs the real resolver against
`scratchver.example.com` → `FAILED` — that is the honest live answer, recorded (`blocked:external`
for a VERIFIED walk).

## 5. Open questions (decide with the "go")

1. **Domain type `Redirect` / `Subdomain`** — stored and drawn (S2), but what a REDIRECT domain
   *does* on the published site (301 to the primary) is a host rule like Force HTTPS. Same
   treatment: the worker rule if the host format allows, else `blocked:host-redirect`. OK?
2. **`Available`** — DB uniqueness only (registrar lookups are external). OK?
3. **GA events** — the frame's `1,284 events` will be OUR tracker's events, labelled so
   (`events arrived` reads true for either). OK, or leave the two lines off until a GA Data API
   integration exists?
