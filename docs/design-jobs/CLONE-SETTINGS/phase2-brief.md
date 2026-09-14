# Settings · Clone S2 — DISTRIBUTION — agent brief

Domains · Analytics · Localization on the S1 shell. Everything is CACHED — **never call Figma**
(86 of today's 200 calls spent; the rest are reserved):

- Shots (1024-wide renders of 1440×900 frames; the sidebar is 256 real, the pane 1184):
  `/Users/shahg/Desktop/pencil/buildrik-settings/docs/design-jobs/CLONE-SETTINGS/shots/<id>.png`
  (`':'→'-'`). Read them with the Read tool.
  - Domains: `3397-32206` main · `3397-32985` loading · `3397-33034` empty · `3397-33085`
    load-error · `3397-33134` save-error · `3397-34402` remove-confirm · `3455-15509` removed ·
    `3737-43669` **Add a domain** dialog
  - Analytics: `3397-32295` main · `3953-49515` loading · `3953-49670` load-error · `3951-26455`
    save-error · `3397-34148` validation · `4256-26844` **Connection verified** dialog
  - Localization: `3397-32376` main · `3397-33194` loading · `3397-33241` load-error ·
    `3397-33288` save-error · `3737-44855` **Add locale** dialog · `3737-44869` **Translation
    checklist** dialog
- Edge graph: `…/CLONE-SETTINGS/reactions-settings-1.json` (indices 3 Domains · 4 Analytics · 5
  Localization) and `-2.json` / `-3.json` (the state frames).
- The approved backend delta: `…/CLONE-SETTINGS/phase2-backend.md` — §1 per-tab table, §2 the
  migration, §3 the server surface, §4 seed, §5 decided: Redirect/Subdomain = host rule if the host
  format allows else `blocked:host-redirect`; `Available` = database uniqueness; the GA events are
  OUR tracker's (`AnalyticsEvent`), labelled `events arrived`.
- The S1 shell you build inside: `…/CLONE-SETTINGS/phase1-brief.md` (§Contracts) and the code —
  `settings/shared.tsx` (`Screen` · `Section{title, desc?, anchor?}` = card + 2-col grid ·
  `Field{label, hint?, htmlFor?, span?}` · `Input` · `Select` · `Textarea` · `SwitchRow` ·
  `LoadCard{title, line, state, errorLine, onRetry}` · `SaveErrorBanner{message}` · `SET_BTN` ·
  `SET_EYEBROW`), `settings/types.ts` (`ScreenProps`: `composer`, `projectId`, `onDirtyChange`,
  `registerSaveHandler`, `registerFlushHandler`, `onLoadStateChange`, `registerRetryLoad`,
  `saveError`), `settings/hooks/useServerLoad.ts` (one read per screen, reports the load state,
  registers retry), `settings/SettingsTab.tsx` (`SAVE_ERROR_MESSAGES` per screen — add yours; the
  footer; `Save changes` runs the screen's `registerSaveHandler` when set — server-backed screens
  register one and it MUST reject on failure), `settings/screens/SeoScreen.tsx` (the finished S1
  pattern: `useServerLoad` + `LoadCard` + `SaveErrorBanner` + a label-left toggle row),
  `settings/components/*` (dialog shape: `ModalRoot` / `ModalContent size="table"` / `ModalBody` +
  `LIBRARY_MODAL_*` classes from `media/components/libraryModal.ts`), `settings/searchIndex.ts`
  (add your fields).

## Ground rules (founder decisions, grilling 2026-09-14 — unchanged)

- **Clone wins** (visual + copy) over the S7 boards and the code; later/more specific Clone frame
  wins a Clone-vs-Clone conflict — say so in your report. Sample data ("bellacucina.com",
  "G-4XQ2P7B1KD", "1,284 events", "4 of 6", "Namecheap") is SHAPE, never literal.
- **Behaviour is real.** No fixtures, no fake states: a state is reached the way the frame says
  (a request failed, a DNS record unverified, a locale with no translations).
- **Backend:** only what `phase2-backend.md` approved. Data flow Page → tRPC → Router → Service →
  Prisma; routers never touch Prisma; shared Zod in `packages/shared/schemas/`.
- **Density 32:** controls 32, rows 28/32, section titles 14/600 (cards), body 13; dialogs
  title 16/600 · body 13 ink-soft · buttons 32 · gap 8 · 640 wide (`size="table"`).
- **Chrome:** `@/editor/chrome-ui` only (Button, TextInput, Select, Textarea, ToggleSwitch,
  Badge, Modal*), no raw form elements (Gate 24), `tw:` utilities not new CSS (`settings.css` may
  only shrink), `var(--bk-*)`, no hex, twMerge over flowbite classes, weights ≤ 600.
- **Tests:** Vitest + RTL co-located; rewrite the tests that protected the old design in the same
  commit. Green: `npx vitest run <your dirs>`, `npx tsc --noEmit` (editor); B: root `npx vitest
  run server packages/shared` and `packages/dashboard` `npx tsc --noEmit`.
- **Git:** you are in a worktree on `worktree-agent-<id>`. FIRST: `git log -1 --format=%H` must be
  `bcefecb16e1e520a33cea94343066a3d4e54f1c2` (the `feat/settings-clone` tip); otherwise
  `git merge --ff-only bcefecb16e1e520a33cea94343066a3d4e54f1c2`, and if that refuses,
  `git reset --hard bcefecb16e1e520a33cea94343066a3d4e54f1c2` (your branch holds nothing yet).
  `node_modules` missing → `pnpm install --prefer-offline --frozen-lockfile`. One commit per frame:
  `J-<nodeId>: implemented — …` / `J-<nodeId>: backend — …`. Never stage
  `packages/editor/src/editor/shell/AquibraStudio.tsx` or `packages/editor/scripts/baselines/ssot.json`.
  Do not push. Never edit another agent's files; code to the contracts below.
- **Env files:** the worktree may lack `.env`; B reads `DATABASE_URL` from
  `/Users/shahg/Desktop/pencil/buildrik/packages/dashboard/.env` (symlink it; never print it).

## The frames

**Domains (`3397:32206`)** — header `SEO & publishing / Domains` · `Custom domain + DNS` · an
`Add domain` primary at the header's right. Body: an info strip `Domain actions apply as soon as
you confirm them. There is nothing to save on this screen.` · an amber strip `Restoring a site
version leaves this configuration unchanged.` · card **Custom domain**: label-left rows `Domain`
(read-only value) · `Status` (pill `VERIFIED` green / `PENDING` amber / `FAILED` red) · `Force
HTTPS` (toggle — writes `domains.update`) · `Remove <domain>…` (danger button) · card **DNS
records**: table `TYPE · NAME · VALUE · STATUS` (pill per record from `DnsRecord.verified`), a
`Check DNS` secondary (runs `domains.check`, the real resolver — keeps the code's action; the
frame's pills are its result). Footer: `Actions apply immediately · nothing to save here` · `Done`
(= Back to canvas; no Cancel / Save — report `onDirtyChange(false)` always). Several domains → one
Custom domain card per domain (primary first), one DNS card each.
**Add a domain (`3737:43669`)** — `Add a domain` · `<site> · Domains` · `Domain name` field with an
`Available` / `Already connected` tag at its right (from `domains.checkAvailability`, debounced) ·
`Domain type` segmented `Primary · Redirect · Subdomain` · `DNS provider` select (`Namecheap`,
`Cloudflare`, `GoDaddy`, `Other`) + hint `Cloudflare, GoDaddy and Other are also supported.` ·
`Nameservers` (read-only mono, per provider, `Read-only · set at your registrar`) · `DNS records`
(read-only mono table `TYPE NAME VALUE` — what `connect` will create: `A @ <ip>` · `CNAME www
<target>` · `TXT _buildrick brk-verify-…`; the values come from the server's response after connect
— show the provider's expected shape before, the real rows after) · `Force HTTPS` row with toggle
and `Redirect every http:// request to https://.` · `DNS can take up to 48 hours to propagate. SSL
is issued automatically.` · Cancel · `Add domain` (primary; disabled until the name is valid and
available). Success → the screen re-lists (new domain `PENDING`).
**remove-confirm (`3397:34402`)** — `Remove <domain>?` · `<domain> stops pointing at this site.
Visitors following that address get nothing until you reconnect it or change your DNS; the site
keeps serving on its buildrick.app address.` · Cancel · `Remove domain` (danger).
**removed (`3455:15509`)** — the empty screen with the line `<domain> removed. This site is still
available at its buildrick.app address.` under the empty card's copy (below); shown right after a
remove, gone on the next visit.
**empty (`3397:33034`)** — one card `CUSTOM DOMAIN` (eyebrow) · `Point your own domain at this
site. DNS changes happen at your domain registrar.` · `Add domain` (primary, 32).
**loading / load-error / save-error** — `LoadCard` `CUSTOM DOMAIN` · `Point your own domain at this
site. DNS changes happen at your domain registrar.` · `Loading…` / `Couldn't load your domains.
Check your connection, then try again.`; save-error banner `Domain changes were not saved. Your
changes are still here. Review the values, then retry.` (an action that failed — remove, toggle,
connect — shows it; footer stays `Actions apply immediately…`).

**Analytics (`3397:32295`)** — header `Visitors / Analytics` · `GA4, Plausible, PostHog, Pixel`
(the nav subtitle stays as the frame draws it). Cards in the frame's order: **Google Analytics**
(`Enable Google Analytics` toggle · `Google Analytics ID` · `Connection status` = pill
`RECEIVING DATA` green / `NO DATA YET` grey / `NOT VERIFIED` grey + `Measurement ID verified on
<date>` + a `Verify` secondary at the right · `Last received data` = `<date>, <time> · <n> events in
the last 24 hours` or `No events yet`) · **Google Tag Manager** (toggle · `GTM Container ID`) ·
**Meta Pixel** (toggle · `Pixel ID`) · then the code's **Microsoft Clarity** and **Consent** cards
below the fold as they are. Label-left rows (like SEO's Indexing card), 32 controls. `Verify`:
validates the id's shape, stores `verifiedAt` in `projectSettings.analytics.googleAnalytics`
(through the flush + Save — or an immediate save; decide and say), reads `analytics.status`, opens
**Connection verified (`4256:26844`)**: `Connection verified` · `<id> is receiving data. <n> events
arrived in the last 24 hours.` (or `<id> is verified. No events have arrived yet.`) · `Last checked
just now · Data usually appears within 30 minutes of the first visit.` · `Back to analytics`
(primary). **validation (`3397:34148`)**: an invalid id → the field in the error state + `This
doesn't look right. Your Google Analytics ID should start with G- followed by 10 characters, like
G-ABCD123456.` (per provider: `GTM-` + 7, pixel = 15–16 digits, Clarity = 10 alphanumerics); Save
disabled while invalid (the frame's layout is the reused loading template — the copy is the
contract, the CURRENT frame's cards are the layout). loading / load-error / save-error: `ANALYTICS`
· `GA4, Plausible, PostHog, Pixel.` · `Couldn't load your analytics settings. Check your connection,
then try again.` · `Analytics settings were not saved. Your changes are still here. Review the
values, then retry.`

**Localization (`3397:32376`)** — header `Site setup / Localization` · `Locale claim and preview` ·
`Add locale` primary at the header's right. Body: the amber strip `Restoring a site version leaves
this configuration unchanged.` · card **Default**: `Default locale` select (enabled locales,
`English (en-US)`-style label = `<Language> (<code>)`) · `Auto-redirect by browser` toggle
(`Site.localeAutoRedirect`) · card **Locales**: table `LOCALE · PATH · PAGES TRANSLATED · STATUS`
(`English · / · 6 of 6 · LIVE` / `French · /fr · 4 of 6 · PENDING` / `Arabic · /ar · 0 of 6 · NOT
STARTED`; the default locale's path is `/`; a row click opens the checklist; a non-default row also
carries `Remove` in a row menu — the code's remove stays). Footer: `All changes saved` · Cancel ·
`Save changes` (the screen's own save handler: `settings.update` with `defaultLocale`,
`enabledLocales`, `localeAutoRedirect`; must reject on failure).
**Add locale (`3737:44855`)** — `Add locale` · `<site> · Localization` · `Language` select listing
`<Language> — <Native>` with the code at the right (`English — English · en` … `Arabic — العربية ·
ar`, `Urdu — اردو · ur`) · `Locale code` (read-only, the bare code) with `URL prefix /<code>` at the
right · `Set as default locale` row + toggle (`Visitors without a matching language land here.`) ·
`Starts as a draft. Translate every required page before this locale can be published.` · Cancel ·
`Create locale` (adds the code to `enabledLocales`, and to `defaultLocale` when the toggle is on —
saved at once through `settings.update`; the table re-reads).
**Translation checklist (`3737:44869`)** — `<Language> · Translation checklist` · `<site> · /<code>
· Draft · <n> of <total> pages` · `Right-to-left locale. ` (only for ar/he/fa/ur) + `Begin with
<page>, then <page>, <page> …` (the pending pages in site order; all done → `Every page is
translated.`) · `Back to localization`. loading / load-error / save-error: `LOCALIZATION` ·
`Default locale, enabled locales and translation progress.` · `Couldn't load your locales. Check
your connection, then try again.` · `Localization settings were not saved. Your changes are still
here. Review the values, then retry.`

## Contracts (B builds — E1/E2/E3 read; typed against `packages/shared/schemas/site-detail.ts`)

```ts
// domains
domainKindSchema = z.enum(["PRIMARY", "REDIRECT", "SUBDOMAIN"]);
connectDomainSchema += { kind?: DomainKind; dnsProvider?: string; forceHttps?: boolean }
siteDetail.domains.checkAvailability({ domain }) → { available: boolean; reason?: "connected" | "invalid" }
siteDetail.domains.update({ id, forceHttps }) → the Domain row
siteDetail.domains.list({ siteId }) → rows now carry kind, forceHttps, dnsProvider, dnsRecords[{type, host, value, verified}]
siteDetail.domains.check({ id, siteId }) → also resolves TXT
// the provider table the dialog draws (nameservers per provider) is exported from shared:
DNS_PROVIDERS: { id: "namecheap"|"cloudflare"|"godaddy"|"other"; label: string; nameservers: string[] }[]
// analytics
siteDetail.analytics.status({ siteId }) → { lastEventAt: string | null; events24h: number }
// localization
siteDetail.locales({ siteId }) → { locales: { code; path; translated; total; status: "LIVE"|"PENDING"|"NOT_STARTED"; pending: string[] }[]; total: number }
updateSiteSettingsSchema += { localeAutoRedirect?: boolean }
```
`verifiedAt` (ISO) lives in `projectSettings.analytics.<provider>.verifiedAt` — the editor's
`AnalyticsConfig` type (`src/shared/types/project.ts`) gains it (E2 owns that edit).

## Work split

| agent | owns | delivers |
|---|---|---|
| **B** backend | `prisma/schema.prisma` + the migration `settings_s2_domains_locales`, `packages/shared/schemas/site-detail.ts`, `server/trpc/routers/site-detail.ts`, `server/services/{domain,site-detail,site-settings,analytics}.service.ts`, `lib/publish-files.ts` (the https + redirect-domain rules, or the `blocked:` note), `prisma/seed-settings-clone.ts` (§4), their tests | §2 + §3 exactly; run the migration locally; run the seed; report the live numbers |
| **E1** Domains | `settings/screens/DomainsScreen.tsx` (+ test), new `settings/components/{AddDomainDialog,RemoveDomainDialog}.tsx` (+ tests), the `domains` rows of `searchIndex.ts` | the screen, both dialogs, the 7 states |
| **E2** Analytics | `settings/screens/AnalyticsScreen.tsx` (+ test), new `settings/components/ConnectionVerifiedDialog.tsx` (+ test), `src/shared/types/project.ts` (`verifiedAt`), the `analytics` rows of `searchIndex.ts`, `settings/screens/analyticsIds.ts` (the per-provider shape rules + messages, unit-tested) | the screen, Verify + the dialog, validation, the 4 states |
| **E3** Localization | `settings/screens/LocalizationScreen.tsx` (+ test), new `settings/components/{AddLocaleDialog,TranslationChecklistDialog}.tsx` (+ tests), `settings/constants.ts` (`SITE_LOCALES` gains `native` names — E2 of S1 owns nothing now), the `localization` rows of `searchIndex.ts` | the screen, both dialogs, the 4 states |
| main | `SettingsTab.tsx` (`SAVE_ERROR_MESSAGES` for the three — say the strings in your report, main adds them), merge, migrate + seed on `:3001`, the live walk, fixes, `boards.json`, `phase2-journeys.md` | — |

Header actions (`Add domain`, `Add locale` at the header's right): the shell renders the header.
Contract: a screen may render its own header action through the existing `ScreenProps`
`registerHeaderAction?(node: React.ReactNode | null)` — **main adds this prop to `types.ts` and
the header slot to `SettingsTab.tsx` at merge**; E1/E3 call it in an effect on mount (and clear on
unmount) with a `Button size="xs"` of `SET_BTN`; until merge it is an optional prop you guard.

## data-testids

Domains: `set-dom-add` (header) · `set-dom-strip` · `set-dom-restore` · `set-dom-card-<id>` ·
`set-dom-status-<id>` · `set-dom-https-<id>` · `set-dom-remove-<id>` · `set-dom-dns-<id>` ·
`set-dom-dns-row-<id>-<i>` · `set-dom-check-<id>` · `set-dom-empty` · `set-dom-removed` ·
dialog `set-dom-dialog` · `set-dom-name` · `set-dom-avail` · `set-dom-kind-<primary|redirect|subdomain>`
· `set-dom-provider` · `set-dom-ns` · `set-dom-records` · `set-dom-force-https` · `set-dom-cancel` ·
`set-dom-submit` · confirm `set-dom-confirm` · `set-dom-confirm-cancel` · `set-dom-confirm-remove`.
Analytics: `set-an-ga-enable` · `set-an-ga-id` · `set-an-ga-status` · `set-an-ga-verified` ·
`set-an-ga-verify` · `set-an-ga-last` · `set-an-ga-error` · `set-an-gtm-enable` · `set-an-gtm-id` ·
`set-an-pixel-enable` · `set-an-pixel-id` · dialog `set-an-verified` · `set-an-verified-line` ·
`set-an-verified-note` · `set-an-verified-back`.
Localization: `set-loc-add` (header) · `set-loc-restore` · `set-loc-default` · `set-loc-redirect` ·
`set-loc-row-<code>` · `set-loc-row-status-<code>` · `set-loc-row-pages-<code>` · dialog
`set-loc-dialog` · `set-loc-language` · `set-loc-code` · `set-loc-prefix` · `set-loc-set-default` ·
`set-loc-cancel` · `set-loc-create` · checklist `set-loc-check` · `set-loc-check-meta` ·
`set-loc-check-line` · `set-loc-check-back`.
Every screen: `set-card-<slug>` on cards (from `Section`), `set-load-*`, `set-save-error`.

## Report format

```
Branch: worktree-agent-<id> @ <sha>
Commits: …
Frames: <id> <name>  <match | drift-fixed | driven | blocked:<why>>  <one line>
Contradictions decided: …
Contract notes: what you exposed / consumed; SAVE_ERROR_MESSAGES strings; header action usage
Tests: files / counts, tsc, gates run
Not done / needs the live walk: …
```
