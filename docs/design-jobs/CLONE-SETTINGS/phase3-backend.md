# Settings · Clone S3 — backend delta (for the founder's "go")

Phase: **S3 PLUMBING-1** — Redirects · Headers, their states, and the overlays the section reaches:
`4254:75736` Add redirect · `4254:75747` Edit redirect (cached). Frames: `3397-32517` Redirects +
`3397-33479` loading + `3397-33526` empty + `3397-33573` load-error + `3397-33620` validation +
`3951-26730` save-error + `3519-19920` / `3519-20096` About URL repair draft / saved +
`3519-20272` / `3519-20448` Our story URL repair draft / saved · `3397-32602` Headers +
`3397-33335` loading + `3397-33383` load-error + `3397-33431` save-error + `3397-34227` unsaved
changes. Nothing below is built until this doc is approved (plan Q3c). **This phase has a
migration, and one item that changes what a publish ships.**

## 1. What the frames need vs what the code has

### Redirects (`3397:32517`, the two dialogs, the URL-repair frames)

| the frame draws | code today | delta |
|---|---|---|
| header `Add redirect` → dialog: `From path` · `To URL` · `Redirect type` `301 Permanent · 302 Temporary` · **`Match query strings`** row + toggle (`Forward ?utm_source and other parameters to the destination.`) · **`Notes`** (`Optional — why this redirect exists.`) · `Paths must start with /. A 301 is cached by browsers — use it for permanent moves; a 302 stays uncached while you test.` · Cancel · Add redirect | `Redirect { fromPath, toUrl, type }`; `redirects.create/update/delete` | **migration** `Redirect.matchQuery Boolean @default(false)`, `Redirect.notes String?`; `create` / `update` inputs + the shared schema gain them |
| Redirects table `FROM PATH · TO URL · TYPE · Edit` → Edit redirect dialog (same fields, `Save changes` · `Delete redirect`) | `list`, an inline editor | client + the widened `update` |
| **404 suggester** card: `Suggest redirects from 404s` toggle · rows `/pizza-menu → /menu · Accept` | nothing; S1's overview counted `SlugHistory` rows (site renames) | the suggester's source is the PAGE slug history the editor already records on every slug change (`Page.slugHistory[] {slug, changedAt}`, `PageManager.updatePage`): a suggestion = an old page slug with no `Redirect.fromPath` — **new query `siteDetail.redirects.suggestions({siteId})`** → `[{ fromPath, toUrl, pageName, changedAt }]`; `Accept` → `redirects.create` (301). The toggle is a per-site preference: `projectSettings.redirects.suggestFrom404s` (JSON, no migration). S1's overview `suggestions` count switches to the same source (one rule). |
| **URL repair** (`3519:19920` → `20096`, `20272` → `20448`): after a page's slug changes in Pages, Settings → Redirects opens with an inline draft above the table — `Redirect for <Page>` · `<site> · URL change /about → /about-us` · From path / To path (prefilled) · `301 · Permanent redirect` · `Save redirect` · Cancel · `Unsaved redirect · Save this rule for <site>.`; saved → the rule joins the table, the draft shows `Saved`. The door is the Pages panel's slug change (`3437:13517`, the graph's `Build · Manage pages`). | the editor records the change; nothing offers the redirect | client (the draft reads the newest `slugHistory` entry the site has no redirect for; the Pages panel's slug-change path emits `ui:switch-tab {tab:"settings", screen:"redirects", repair:<pageId>}`) + the same `create`. No server change beyond the suggester. |
| validation (`3397:33620`): `Paths must start with /` etc. | inline rules exist | client |
| loading · empty · load-error · save-error | client | client |
| **Redirects on the published site** | **none** — the deploy ships pages + `robots.txt` + `sitemap.xml` only; `Redirect` rows and the header columns never reach Vercel (`publish-urls.ts:81`); S2 recorded `blocked:host-redirect` for the same reason | **`vercel.json` in the deployment files** (`lib/publish-files.ts` `buildDeployFiles`): `redirects` from the `Redirect` rows (`{source, destination, permanent: type==="301"}`; `matchQuery` → Vercel's query pass-through), `redirects` for a `REDIRECT`-kind domain (`{source: "/(.*)", has: [{type: "host", value: "<domain>"}], destination: "https://<primary>/$1", permanent: true}`), and `headers` (below). Vercel honours file-based config on every deployment — this is the host's own mechanism, the thing S2's flag was waiting for. Tested with `lib/__tests__/publish-files`. |

### Headers (`3397:32602`, `3397:34227`)

| the frame draws | code today | delta |
|---|---|---|
| Content Security Policy (mono textarea) · X-Frame-Options select · Referrer-Policy select · HSTS (`Enable HSTS` toggle · max-age · include subdomains · preload) · Permissions-Policy | `Site.cspPolicy / xFrameOptions / referrerPolicy / hstsMaxAge / permissionsPolicy`, `siteDetail.settings.get/update`, `HeadersScreen` saves through `registerSaveHandler` | client restyle; **HSTS `includeSubDomains` / `preload`** have no column — the frame draws them (confirm in the walk; if drawn: **migration** `Site.hstsIncludeSubdomains Boolean @default(false)`, `Site.hstsPreload Boolean @default(false)`; else nothing) |
| `unsaved changes` (`3397:34227`) — the S1 shell's `Unsaved changes` footer + the dialog | exists | client |
| **headers on the published site** | none (above) | the same `vercel.json`: `headers: [{ source: "/(.*)", headers: [{key: "Content-Security-Policy", value}, {key: "Strict-Transport-Security", value: "max-age=<n>[; includeSubDomains][; preload]"}, X-Frame-Options, Referrer-Policy, Permissions-Policy] }]` from the Site row at publish time |
| loading · load-error · save-error | client | client |

## 2. Migration (`settings_s3_redirects_headers`)

```prisma
model Redirect {
  matchQuery Boolean @default(false)
  notes      String?
}
model Site {                                   // only if the Headers walk confirms the frame draws them
  hstsIncludeSubdomains Boolean @default(false)
  hstsPreload           Boolean @default(false)
}
```
Reversible. Local `migrate deploy` (a hand-written file, as S2 — `migrate dev` still trips on the
pre-existing drift); prod is the founder's.

## 3. New / changed server surface

| procedure | kind | notes |
|---|---|---|
| `siteDetail.redirects.create` / `update` | changed inputs | `+ matchQuery?: boolean`, `+ notes?: string \| null` |
| `siteDetail.redirects.suggestions` | new query `{siteId}` | old page slugs (`Page.slugHistory`) with no redirect; `pageName`, `changedAt` |
| `siteDetail.settingsOverview` | changed | `redirects.suggestions` counts the same source |
| `siteDetail.settings.update` | changed | `+ hstsIncludeSubdomains? / hstsPreload?` if the columns land |
| `lib/publish-files.ts` | changed | `vercel.json` with `redirects` + `headers` (+ the REDIRECT-domain rule); the worker passes the site's redirects, domains and header columns into `buildDeployFiles` |
| shared schemas | `packages/shared/schemas/site-detail.ts` | the changed inputs, `redirectSuggestionSchema` |

Tests: the file builder (`vercel.json` shape per case, none when nothing is set), the suggester
(a renamed page with / without a redirect), router access, the overview count.

## 4. Seed + fixtures

The seed's 3 redirects gain `matchQuery` / `notes` on one; one page's `slugHistory` carries an
old slug with no redirect (`/pizza-menu → /menu`) so the suggester and the URL-repair draft have
a real row; the header columns set (CSP · SAMEORIGIN · strict-origin-when-cross-origin · HSTS
31536000). Forced states as before. The `vercel.json` is verified by reading the deployment
file list the worker builds (a unit test + a dry run of `buildDeployFiles` against the seeded
site), not by a real Vercel deploy (`blocked:external` for the live redirect).

## 5. Open questions (decide with the "go")

1. **`vercel.json`** changes what every publish ships (redirects + headers become live on the
   next publish for every site that has them — including sites that set a CSP long ago and never
   saw it applied). That is the frames' promise, but it is a production behaviour change. Go, or
   gate it behind a per-site `Apply on publish` toggle first?
2. **The 404 suggester's source** — page slug history (what the editor records) rather than real
   404 hits (the published site sends no 404 events to us). The card's title stays `404
   suggester` as drawn; the row copy says where the suggestion came from (`renamed 12 Sep`). OK?
3. **HSTS `includeSubDomains` / `preload`** — only if the walk shows them drawn; otherwise no Site
   migration this phase.
