# Settings · Clone S1 — Shell + SITE — agent brief

Source: Figma page `Editor v1 Clone` (`3397:13062`), section `3397:32010` "Configure site and
workspace · Settings". Everything is CACHED — **never call Figma** (82 of today's 200 calls are
spent; the rest are reserved):

- Shots (1024-wide renders of 1440×900 frames, scale 0.711 — a 256px sidebar reads 182px):
  `/Users/shahg/Desktop/pencil/buildrik-settings/docs/design-jobs/CLONE-SETTINGS/shots/<id with ':'→'-'>.png`.
  Read them with the Read tool. S1's frames:
  `3397-32915` Overview · `3397-32011` General · `3953-26363` General loading · `3953-26503`
  General load-error · `3950-26309` General save-error · `3397-32076` SEO · `3953-26646` /
  `3953-26785` / `3951-26319` SEO loading / load-error / save-error · `3397-32456` Custom code ·
  `3953-49260` / `3953-49386` / `3951-26607` its loading / load-error / save-error · `3397-32859`
  Custom code locked (Pro) · `3737-43639` Unsaved settings · `3737-43624` Settings saved ·
  `3737-46109` Search settings · `3737-43652` Edit social profile (a prototype stand-in).
- Prototype edges: `…/CLONE-SETTINGS/reactions-settings-1.json` and `-5.json` (`sigs`:
  `"control|TRIGGER|action @frame-indices"`, `sizes` lists the indices).
- The approved backend delta: `…/CLONE-SETTINGS/phase1-backend.md`. The plan with every locked
  decision: `/Users/shahg/Desktop/pencil/buildrik-settings/docs/plans/2026-09-14-settings-clone.md`.

## Ground rules (founder decisions, grilling 2026-09-14)

- **Clone wins** over the V1 S7 boards and over the shipped code, visual AND copy. Where two
  Clone frames disagree the later / more specific frame wins — record every such call in your
  report. Sample data ("Bella Cucina", "@bellacucina", "Neapolitan pizza…", "/assets/favicon.ico")
  is SHAPE, never literal: real site data, honest empty states.
- **Behaviour is real.** No fixtures, no fake states. A state is reached the way the frame says it
  is (a request that failed, a plan that is FREE), and the walk forces it live.
- **Backend:** only what `phase1-backend.md` approved — one new query `siteDetail.settingsOverview`
  + shared schema + seed. Nothing else on the server. Data flow Page → tRPC → Router → Service →
  Prisma; routers never touch Prisma; shared Zod in `packages/shared/schemas/`.
- **Density 32:** controls 32px, rows 28/32, section titles 13/600, body 13. The frames' taller
  controls are refused (`founder:density-32`). Dialogs: title 16/600, body 13 ink-soft, buttons 32,
  gap 8, radius token — the shape in `packages/editor/src/editor/media/components/libraryModal.ts`
  (reuse its class constants).
- **Chrome rules:** import UI only from `@/editor/chrome-ui` (Button, TextInput, Select, Textarea,
  ToggleSwitch, ModalRoot/ModalContent/ModalBody, Toast…); no raw `<button>/<input>/<select>/
  <textarea>` (Gate 24); `tw:`-prefixed utilities, NOT new CSS (the styling ratchet refuses growth —
  `settings.css` may only shrink); `var(--bk-*)` tokens, no hex, no raw shadows; twMerge when
  overriding a flowbite Button's own classes. Weights ≤ 600.
- **Tests:** Vitest + RTL, co-located `__tests__/`; rewrite the tests that protected the old
  design in the same commit. `npx vitest run <your dirs>` green; `npx tsc --noEmit` clean (editor);
  dashboard: `pnpm --filter dashboard test` (or `npx vitest run` in `packages/dashboard`) for B.
- **Git:** you are in a worktree on branch `worktree-agent-<id>`. First thing: `git log -1
  --format=%H` must be `7831ad613…`; if behind, `git merge --ff-only 7831ad613`. Commit on your
  branch, one commit per closed frame: `J-<nodeId>: implemented — <what>` (B: `J-<nodeId>:
  backend — <what>`). Never stage `packages/editor/src/editor/shell/AquibraStudio.tsx` or
  `packages/editor/scripts/baselines/ssot.json`. Do not push. No `../../` imports.
- **Worktree deps:** if `node_modules` is missing, run `pnpm install --prefer-offline
  --frozen-lockfile` at the worktree root (26 s from the store).
- **Never edit another agent's files** (ownership table below). Where you need something from
  another agent, code to the CONTRACT below and say so in your report.

## The frames — what each draws (density 32 applied)

**Shell (every frame):** a 256px sidebar `‹ Back to canvas` (top) · `Settings` (20/600) · the site
name (12 muted) · nav in five groups with 12px uppercase group labels: `Overview` (own row, above
the groups) · **SITE SETUP** General · Fonts & colours · Localization · **SEO & PUBLISHING** SEO
defaults · Domains · Redirects · Export · **VISITORS** Analytics · Forms · **ADVANCED** Custom
code · Headers · Integrations · **WORKSPACE** Webhooks · Members ↗ · Billing ↗. Rows 32 high, icon
+ label, the current one on the accent tint with accent text. Pane: header `Group / Screen`
(20/600 — `Site setup / General`, `SEO & publishing / SEO defaults`, `Advanced / Custom code`) +
subtitle (13 muted: `Manage your site identity, language and social profiles.` · `Search & social
preview` · `Head, body, CSS injections`), a rule, then the body on the panel-subtle background with
cards (white, 1px border, radius-lg, 24 padding, title 14/600) in a two-column field grid (label
13, control 32, gap 16). Footer (56 high, rule above): status text left · `Cancel` (secondary) ·
`Save changes` (primary) right. Footer states: `All changes saved` (muted) · `Changes not saved`
(danger) + `Retry save` · `Loading settings…` (muted, Save disabled) · `Settings could not load`
(danger, Save disabled). Doors: `‹ Back to canvas` → the canvas (guarded when dirty, see Unsaved
settings) · `Fonts & colours` → the Brand panel (`onOpenDesignTab`) · `Export` → the Export modal
(`3397:23956`; door: emit `ui:open-exporter`, handled in `StudioHeader.tsx` beside its
`handleExport`) · `Members ↗` / `Billing ↗` → dashboard deep links (existing `WORKSPACE_LINKS`) ·
the rest → in-tab screens (S2–S4's screens keep their current components; only the shell changes
around them in S1).

**Overview (`3397:32915`):** header `Settings` · `<site> · everything on this page is scoped to
this project.` · a `Search settings` field top-right (opens the Search modal). A **NEEDS ATTENTION
<n>** card (amber) listing attention rows — `<title>` / `<detail>` / `Open ›` — e.g. `Arabic locale
has no translated pages · 0 of 6 pages · not started` / `One DNS record is still pending · TXT
_buildrick for bellacucina.com` / `A webhook delivery failed · site.published · 502 Bad Gateway ·
1 Jul`; hidden when empty. Then section cards in a 3-column grid, one card per group (SITE SETUP ·
VISITORS · SEO & PUBLISHING / ADVANCED · WORKSPACE), each row = icon · title · one summary line ·
`›` (external rows `↗`), an amber dot on rows with attention. Summary lines from
`siteDetail.settingsOverview` (schema below). Footer: `Pick a section to edit its settings` ·
`Done` (= Back to canvas — decided).

**General (`3397:32011`):** card **Site identity** — `Site name` · `Favicon URL` · `Site Language`
(select) ; card **Social links** — `Twitter` · `Facebook` · `LinkedIn`. Loading (`3953:26363`): one
card `SITE IDENTITY` (11 uppercase muted) · `Site name, favicon, language and social profiles.` ·
`Loading…`; footer `Loading settings…`. Load-error (`3953:26503`): the same card with `Couldn't
load your site settings. Check your connection, then try again.` + `Try again` (primary, right);
footer `Settings could not load`. Save-error (`3950:26309`): a danger banner above the cards `Site
settings were not saved. Your changes are still here. Review the values, then retry.`; footer
`Changes not saved` · `Cancel` · `Retry save`.

**SEO defaults (`3397:32076`):** an info strip `Site-wide SEO defaults are set here. Per-page titles,
descriptions and social images are edited in Page settings — values set there override these
defaults.`; card **Site SEO** — `Meta title` · `Meta description` · `Twitter Handle` · `Default OG
Image URL`; card **Indexing** — `Allow search indexing` (toggle) · `robots.txt` (a read-only mono
block: `User-agent: *` / `Allow: /` or `Disallow: /` / `Sitemap: https://<primary domain>/sitemap.xml`
— `Site.robotsTxt` verbatim when set). Loading / load-error / save-error as General with
`SEO DEFAULTS` · `Title, description and social preview defaults.` · `Couldn't load your SEO
defaults. …` · `SEO defaults were not saved. Your changes are still here. Review the values, then
retry.`

**Custom code (`3397:32456`):** three cards **Head scripts** (`<head>` label · code textarea) ·
**Body scripts (end)** (`</body>`) · **Global CSS** (`styles`), mono 12. Loading / load-error /
save-error with `CUSTOM CODE` · `Head, body and CSS injections.` · `Couldn't load your custom
code. …` · `Custom code was not saved. Your changes are still here. Review the values, then
retry.` Locked (`3397:32859`, plan FREE): header gets an `Upgrade` primary at the right; the body is
one card: `PRO` pill · `Custom code is a Pro feature` (14/600) · `Custom code injects your own
<head> markup, end-of-<body> scripts and CSS into every published page — analytics, fonts, chat
widgets. It ships on every publish.` · `Upgrade to Pro` (primary) → the dashboard billing page.
(That frame's subtitle `CSP, HSTS, security policy` is Headers' — the CURRENT frame's `Head, body,
CSS injections` wins; its sidebar search box and missing Overview row are the earlier nav — the
CURRENT nav wins.)

**Unsaved settings (`3737:43639`):** `Unsaved settings` · `These settings have not been saved. Keep
editing to finish them, or discard the pending edits and return to the canvas.` · `Keep editing`
(secondary, autofocus) · `Discard and return to canvas` (danger/primary). Raised by `‹ Back to
canvas`, `Cancel`, `Done`, Escape and any nav click while dirty (the frame's buttons render
unstyled — a broken frame; the modal shape above is the contract).

**Settings saved (`3737:43624`):** `Settings saved` · `<site> · Configuration saved. Your canvas
content is unchanged.` · `Return to settings` (primary). Shown after every successful Save
changes (decided: the frame's modal, not a toast).

**Search settings (`3737:46109`):** `Search settings` · `<site> · <n> results for "<q>"` ·
`Search` field with clear ✕ · result rows `title` / `description` / GROUP (uppercase, right) —
sections AND fields (`Domains · Custom domain + DNS · SEO & PUBLISHING`, `DNS records · A, CNAME
and TXT for <domain> · DOMAINS`, `Force HTTPS · Redirect every http:// request · DOMAINS`,
`Redirects · 301 / 302 redirects · SEO & PUBLISHING`) · foot `<n> results` · `Clear search` ·
`Cancel`. A row → that screen (and the field scrolled into view). Empty query lists the sections.

**Edit social profile (`3737:43652`):** a prototype stand-in for typing into the Twitter field
("Designed state — field values are fixed sample content, not typed input"); its `Save failure
example` is the door to the save-error frame. NOT a dialog to build — the real input stays;
recorded as such.

## Contracts

**`siteDetail.settingsOverview` (B builds, E1 reads)** — `packages/shared/schemas/site-detail.ts`:

```ts
export const settingsOverviewSchema = z.object({
  site: z.object({ name: z.string(), defaultLocale: z.string(), plan: z.enum(["FREE", "PRO", "BUSINESS"]) }),
  general: z.object({ siteName: z.string(), language: z.string() }),            // "English (en-US)" label built client-side from defaultLocale
  localization: z.object({ locales: z.number(), notStarted: z.array(z.string()) }),
  seo: z.object({ allowIndexing: z.boolean(), robotsTxtSet: z.boolean() }),
  domains: z.object({ primary: z.string().nullable(), pendingDns: z.number() }),
  redirects: z.object({ rules: z.number(), suggestions: z.number() }),
  analytics: z.object({ providers: z.array(z.string()), receiving: z.boolean() }),
  forms: z.object({ forms: z.number(), submissions: z.number() }),
  customCode: z.object({ head: z.boolean(), body: z.boolean(), css: z.boolean() }),
  headers: z.object({ csp: z.boolean(), hsts: z.boolean() }),
  integrations: z.object({ connected: z.number(), available: z.number() }),
  webhooks: z.object({ endpoints: z.number(), lastDelivery: z.enum(["ok", "failed"]).nullable() }),
  members: z.object({ used: z.number(), seats: z.number() }),
  billing: z.object({ plan: z.string(), priceMonthly: z.number() }),
  attention: z.array(z.object({
    kind: z.enum(["locale-not-started", "dns-pending", "webhook-failed"]),
    title: z.string(), detail: z.string(), section: z.string(),               // section = the nav id to open
  })),
});
export type SettingsOverview = z.infer<typeof settingsOverviewSchema>;
```
Router: `siteDetail.settingsOverview` · input `{ siteId }` · `assertSiteAccess` · returns the
schema's shape. Editor reads it through `createBuildrikApiClient(DASHBOARD_URL)` the way
`HeadersScreen.tsx:18` does.

**Shell ↔ screens (E1 owns the shell, E2 the screens)** — `settings/types.ts` `ScreenProps` gains:
```ts
/** The screen's server read: the shell's footer and the screen's own card follow it. */
onLoadStateChange?: (state: "loading" | "ready" | "error") => void;
/** Registered by a screen that loads from the server; the load-error card's Try again calls it. */
registerRetryLoad?: (fn: (() => void) | null) => void;
/** The last Save's failure, set by the shell; the screen renders the banner above its cards. */
saveError?: string | null;
```
and the shell keeps its existing `registerSaveHandler` / `registerFlushHandler` / `onDirtyChange`.
The shell owns: footer state, `Retry save` (re-runs the same save), the Settings saved dialog, the
Unsaved settings guard. The screen owns: its cards, its load card (loading / error + Try again)
and the save-error banner (text per screen above). Shared card primitives live in `shared.tsx`
(E1 restyles `Screen` / `Section` / `Field` / `Input` / `Select` / `Textarea` to the Clone shape
and adds `LoadCard` + `SaveErrorBanner` there; E2 uses them).

**Dialogs + search (E3 builds, E1 mounts)** — `settings/components/UnsavedSettingsDialog.tsx`
`{ open, siteName, onKeepEditing, onDiscard }` · `SettingsSavedDialog.tsx` `{ open, siteName,
onReturn }` · `SearchSettingsModal.tsx` `{ open, siteName, onClose, onOpen(screenId, fieldId?) }`
over a static registry `settings/searchIndex.ts` (`{ id, title, description, group, screen,
fieldId? }[]` — every nav section + every field label in S1's three screens; S2–S4's screens'
fields from their current labels).

## Work split

| agent | owns | delivers |
|---|---|---|
| **B** backend | `server/trpc/routers/site-detail.ts` (one procedure), `server/services/site-detail.service.ts` (`getSettingsOverview`), `packages/shared/schemas/site-detail.ts`, `prisma/seed-settings-clone.ts`, `server/services/__tests__/site-detail-settings-overview.test.ts` | the query per `phase1-backend.md` §2 (every line from existing tables; `available` = `INTEGRATION_CATALOG.length` — move that catalog's length to a shared constant if it must be read server-side, else return the count the editor already has); the seed (idempotent, `--reset`); tests. No migration. |
| **E1** shell + Overview | `settings/SettingsTab.tsx`, `settings/settings.css` (shrink), `settings/shared.tsx`, `settings/types.ts`, `settings/screens/OverviewScreen.tsx` (new), `settings/icons.tsx`, `sidebar/FullPageRouter.tsx` / `FullPageView.tsx` only if a prop must pass, `shell/StudioHeader.tsx` (the `ui:open-exporter` listener), their tests | the persistent-sidebar layout, five nav groups, header/subtitle per screen, footer with its four states, Cancel / Save changes / Retry save, the guard + saved dialog mounts, `Export` → modal, `Fonts & colours` → Brand, the Overview screen on `settingsOverview` (loading/error states like the screens'), `Done` |
| **E2** screens | `screens/SiteSettingsScreen.tsx`, `screens/SeoScreen.tsx`, `screens/AdvancedScreen.tsx`, `screens/LockedScreen.tsx`, `services/BuildrikSyncProvider.ts` (the dual-save map: `siteName → name`, `favicon`, `language → defaultLocale`, `allowIndexing`, `robotsTxt`), their tests | the three screens to the frames incl. loading / load-error / save-error per the contract; SEO's indexing toggle + robots.txt preview; the locked card + `Upgrade` |
| **E3** dialogs + search | `settings/components/{UnsavedSettingsDialog,SettingsSavedDialog,SearchSettingsModal}.tsx`, `settings/searchIndex.ts`, their tests | the three dialogs to the frames, the registry, `onOpen(screen, field)` |
| main | merges, seed + plan flip, live walk at `localhost:3001/edit/scratchver0000000000000001` (1440×900), fixes, `boards.json`, `phase1-journeys.md` | — |

## data-testids the walk will drive (add exactly these)

Shell: `set-back` · `set-title` · `set-site` · `set-nav-<id>` (ids: `overview general branding
localization seo domains redirects export analytics forms custom-code headers integrations webhooks
members billing`) · `set-head-title` · `set-head-sub` · `set-head-upgrade` · `set-foot-status` ·
`set-foot-cancel` · `set-foot-save` (label `Save changes` / `Retry save`) · `set-search-open`.
Screens: `set-card-<slug>` (`site-identity social-links site-seo indexing head-scripts
body-scripts global-css`) · `set-load-card` · `set-load-title` · `set-load-line` ·
`set-load-retry` · `set-save-error` · `set-locked` · `set-locked-upgrade` · fields keep
`id`s = their label slug (`site-name`, `favicon-url`, `site-language`, `social-twitter`…,
`seo-meta-title`, `seo-allow-indexing`, `seo-robots`, `code-head`, `code-body`, `code-css`).
Overview: `set-ov-attention` · `set-ov-attention-<i>` · `set-ov-attention-open-<i>` ·
`set-ov-group-<group>` · `set-ov-row-<id>` · `set-ov-row-line-<id>` · `set-ov-done`.
Dialogs: `set-unsaved` · `set-unsaved-keep` · `set-unsaved-discard` · `set-saved` ·
`set-saved-return` · `set-search` · `set-search-input` · `set-search-clear` · `set-search-row-<i>`
· `set-search-count` · `set-search-cancel`.

## Report format (end of your run)

```
Branch: worktree-agent-<id> @ <sha>
Commits: <n> — <sha> <message> …
Frames: <id> <name>  <match | drift-fixed | driven | blocked:<why>>  <one line>
Contradictions decided: …
Contract notes: what you exposed / consumed, anything the others must know at merge
Tests: <files / counts>, tsc, gates you ran
Not done / needs the live walk: …
```
