# Site — Full-page Wireframes (everything that never touches the canvas)

> The third surface. `2026-07-18-editor-shell-wireframes.md` specs the editor; this specs **Site** — the full-page area opened from the editor's topbar `⋯ → Site`. It exists because ~14 destinations were being carried in a single line of the redesign doc (§4.3), and because none of them touch the canvas, which is the rule that decides rail membership.
>
> Same craft as the editor: cobalt `#2D6DFF` · no pure black · General Sans / Inter Tight · 4px grid · light theme · minimal motion.

---

## 1. Shape — a takeover, not a modal

Site is a **full-page takeover** of the editor viewport. Not a modal (too much content, deep-linkable), not a separate app (you must get back to the canvas in one click).

```
◄──────────────────────────────── 1440 ────────────────────────────────►
┌──────────────────────────────────────────────────────────────────────┐  ▲
│ ‹ Back to editor      Bella Cucina · Site                  ● Saved   │  │ 56
├──────────────────┬───────────────────────────────────────────────────┤  ▼
│ SITE             │                                                   │  ▲
│  General       ▸ │   General                                         │  │
│  SEO             │   ─────────────────────────────────────────       │  │
│  Analytics       │                                                   │  │
│  Custom code  🔒 │   Site name                                       │  │
│                  │   ┌─────────────────────────────────┐             │  │
│ DISTRIBUTION     │   │ Bella Cucina                    │             │  │
│  Domains         │   └─────────────────────────────────┘             │  │
│  Redirects    ⚠  │                                                   │  │ 844
│  Headers      ⚠  │   Favicon                                         │  │
│  Localization ⚠  │   ┌────┐                                          │  │
│                  │   │ 🍝 │  Replace   Remove                        │  │
│ DATA             │   └────┘                                          │  │
│  Forms         3 │                                                   │  │
│  Integrations 🔒 │   Language                                        │  │
│                  │   ┌─────────────────────────────────┐             │  │
│ SHIP             │   │ English (US)                  ▾ │             │  │
│  Publish history │   └─────────────────────────────────┘             │  │
│  Export          │                                                   │  │
│                  │                                                   │  │
│                  │                                                   │  │
│ ─────────────    │                                                   │  │
│  Members      ↗  │                                                   │  │
│  Billing      ↗  │                                                   │  │
│      240         │                     max 720, centred              │  ▼
└──────────────────┴───────────────────────────────────────────────────┘
```

| Region | Size | Notes |
|---|---|---|
| Header | **56h** | same height as the editor topbar so the swap doesn't jump. `‹ Back to editor` returns to the exact page and selection you left. Save pill mirrors the editor's. |
| Nav | **240w** | grouped, 5 groups + a divided workspace section. Group label 11px caps `--ink-soft`, 32h; item rows **32h**; active = 3px cobalt left bar + accent tint (same as the rail). |
| Content | **max 720, centred** in the remaining column | one column; label above control; field rows 32h; section gap 32. |
| Body height | **844** (900 − 56) | nav and content scroll independently |

**Nav badges** — the nav carries state so you don't have to open a screen to find a problem:

| Badge | Means |
|---|---|
| `🔒` | Pro-gated — the row is clickable and opens the screen in its locked state |
| `⚠` | Saved but **not enforced live** (Redirects · Headers · Localization) |
| `3` | Count — unread form submissions |
| `↗` | Leaves for the dashboard (Members · Billing) |

---

## 2. The 14 destinations

| Group | Screen | Status today | Notes |
|---|---|---|---|
| **SITE** | General | ✅ works | name · favicon · language · social links · legal links |
| | SEO | ✅ FIX | twitter handle · default OG image. **Score labels must show earned points, not max weights.** |
| | Analytics | ✅ works | GA4 (regex-validated) · Meta Pixel · cookie banner. Injected at publish. |
| | Custom code | ✅ works, **gate broken** | head/body scripts + global CSS. Defect **N1**: the Pro gate keys on `advanced` while the nav id is `custom-code`, so it never gates. Fix before shipping the lock. |
| **DISTRIBUTION** | Domains | 🟡 e2e untested | connect → DNS verify → SSL. Needs the guided flow in §4. |
| | Redirects | 🟡 saved-not-live | 301/302. `toUrl` validated. Banner required. |
| | Headers | 🟡 saved-not-live | CSP · HSTS · X-Frame · Referrer · Permissions |
| | Localization | 🟡 saved-not-live | default + enabled locales (24 common). Engine is locale-unaware. |
| **DATA** | Forms | ✅ works | inbox · filters (inbox/unread/spam/archived) · CSV export |
| | Integrations | 🔵 → **BUILD** | 6 connections in **three shapes** — §6. Netlify Forms replaced by Slack (Netlify Forms needs Netlify hosting; we publish to Vercel). |
| **SHIP** | Publish history | ✅ | job list · status · live URL · **rollback** — full flow at `2026-07-19-system-contracts.md` §5. Row 56h, exactly one live entry, rollbacks labelled `↩ from vN`. Footnote: *"Last 20 publishes. Approved ones are always kept."* |
| | Export | ✅ → **BUILD** | HTML · ZIP · React ship. **Vue + Next.js to build** (§7.5). Two intent groups: publish-anywhere vs hand-off-to-a-developer. |
| **WORKSPACE** | Members ↗ | ✅ | dashboard |
| | Billing ↗ | ✅ | dashboard |

---

## 3. The "saved but not live" pattern — used 3 times

Redirects, Headers and Localization all persist and none are enforced on the published site. That is a trust problem, so the pattern is explicit and identical on all three:

```
┌────────────────────────────────────────────────────────────┐
│ ⚠  Saved, not yet live                                     │  40h, amber wash
│    These rules are stored and will apply once redirect      │
│    support ships. They do not affect your live site today.  │
└────────────────────────────────────────────────────────────┘
```
- Banner sits **above** the screen's controls, always visible, **not dismissible**. A dismissible banner on a trust-lie is worse than none.
- The nav row carries `⚠` so the state is visible without opening the screen.
- The moment enforcement ships, the banner and the badge are deleted in the same PR. Leaving them is the failure mode.

---

## 4. Domains — guided connect

The one flow here that fails silently today (untested e2e).

```
State 1 — none          State 2 — pending             State 3 — verified
┌──────────────────┐    ┌──────────────────────────┐  ┌──────────────────────┐
│ No custom domain │    │ bellacucina.com          │  │ bellacucina.com   ✓  │
│                  │    │ ◷ Waiting for DNS        │  │ ● Live · SSL active  │
│ [ Add domain ]   │    │                          │  │                      │
│                  │    │ Add these records at     │  │ ( Remove domain )    │
│ Using            │    │ your registrar:          │  │                      │
│ bella.buildrick  │    │ ┌──────────────────────┐ │  └──────────────────────┘
│ .app             │    │ │ A     @    76.76.21.x│ │
└──────────────────┘    │ │ CNAME www  cname.…   │ │  State 4 — failed
                        │ └──────────────────────┘ │  ┌──────────────────────┐
                        │ ( Copy )  ⟳ Check now    │  │ ⚠ DNS not found      │
                        │ Checked 30s ago          │  │ Records may take 48h │
                        └──────────────────────────┘  │ ⟳ Check again        │
                                                      └──────────────────────┘
```
States: `none · adding · pending-dns · verified · failed · ssl-provisioning`. Auto-recheck every 30s while pending, backing off to 5 min after 10 minutes. Never claim "live" until SSL is actually issued.

---

## 5. Brand push — moved to Portfolio

**Brand push is not a Site destination.** It launches from the **Portfolio** — see `2026-07-19-portfolio-wireframes.md` §4, which carries the full five-step flow.

*Moved 2026-07-19 after the placement was found in three different homes (here, Portfolio, and Ch.14 `S4.7`). The deciding argument is not layout, it is the data model: a push writes into several sites' documents, and no single site's version history can author that record. The flow and its 24h undo therefore belong to the region that owns cross-site state. Launching a four-site destructive operation from one site's settings was also the mis-click surface nobody wanted.*

## 6. Integrations — and the correction that matters

**Decided 2026-07-19: build, not cut.** But the first version of this section, written the same day, **got the architecture wrong**, and the correction changes what you draw.

### 6.0 What these six actually are

An outside review checked the spec against the code and found it had collapsed three unrelated systems into one "connect an integration" model. Verified:

| | What it really is | Evidence |
|---|---|---|
| **Formspree** | an **export-time injector** — rewrites form `action` URLs in the published HTML | `engine/export/FormspreeInjector.ts` |
| **Stripe** | an **export-time injector** — generates cart + checkout scripts into the published HTML | `engine/export/StripeInjector.ts` |
| **Mailchimp · Zapier · Slack** | **workspace config blobs**, shared across every site | `addIntegrationSchema` provider enum, `packages/shared/schemas/account.ts:74` |
| **ConvertKit** | **not in the enum at all** — adding it is a schema change | same file |
| **Vercel** | the **only** real OAuth connection in the product — and it already lives under Publishing, not here | `integrations.service.ts:135` |

⚠ **The earlier draft of this section put Stripe under an "OAuth — click Connect" shape. Stripe has no OAuth flow here.** Drawing one would have produced a screen for a system that does not exist. Same for Formspree's "● Connected" state: an injector is configured, not connected.

### 6.1 The honest model — two shapes, not three

**Shape 1 · Baked in at publish** — Formspree · Stripe
These are **site settings that get compiled into the output**. There is no connection to be live or dead, no account to show, no token to expire. The correct mental model is the same as Analytics or Custom Code, which already sit in this Site page.

- Field + a `Test` action, **no connection state**.
- The truthful status line is about the *last build*, not a live link: `Included in your last publish · 18 Jul`.
- Because it only takes effect at publish, the screen must say so: **"Changes here apply the next time you publish."** Otherwise a user edits the endpoint, tests nothing, and assumes the live site changed.

**Shape 2 · Connected once, used everywhere** — Mailchimp · ConvertKit · Zapier · Slack
These are **workspace-level**, not per-site. That is a real IA consequence and it was missed: a connection made on Bella Cucina is already connected on all twelve sites.

- So the row shows **workspace scope explicitly** — `Connected for all sites · ali@studio.com`.
- Per-site the only choice is **on/off for this site**, not connect/disconnect. Disconnecting from one site's screen and silently killing eleven others is the mis-click class this product keeps having to design out.
- **Zapier** additionally shows the webhook URL + recent deliveries (§6.4) because a webhook with no delivery list is a black box.

### 6.2 What this means for the screen

```
┌─ max 720 ───────────────────────────────────────────┐
│ Integrations                                        │
│                                                     │
│ BAKED INTO YOUR SITE                                │  28
│ Applied when you publish.                           │  20
│ ┌─────────────────────────────────────────────────┐ │
│ │ ▣ Formspree      In your last publish · 18 Jul ›│ │  64
│ │ ▣ Stripe         ⚠ Test keys              ›    │ │  64
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ CONNECTED FOR ALL YOUR SITES                        │  28
│ Set up once, used across every client site.         │  20
│ ┌─────────────────────────────────────────────────┐ │
│ │ ▣ Slack       ● all sites · #inquiries    ☑    │ │  64
│ │ ▣ Mailchimp   ● all sites · ali@studio    ☑    │ │  64
│ │ ▣ ConvertKit     Connect                   ›    │ │  64
│ │ ▣ Zapier      ● all sites · 3 deliveries  ☑    │ │  64
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Two groups, and the sub-line under each header is load-bearing.** "Applied when you publish" and "Set up once, used across every client site" are the two facts that make the whole screen make sense, and neither is guessable from a card.
- **Row 64h** — logo 32 · name · status · a **checkbox** for shape 2 (on for this site) or `›` for shape 1.
- **⚠ Test keys** on Stripe stays — shipping a live client site on test keys is a silent failure that costs real money.

**States:** none-configured · some · attention (expired key, failed delivery) · pro-locked · loading.

### 6.3 Detail — Shape 1 (baked in)

```
│ ‹ Integrations                                      │  44
│ ▣ Formspree              Docs ↗                     │
│ Endpoint URL                                        │
│ ┌─────────────────────────────────────────────────┐ │  36
│ │ https://formspree.io/f/xxxxxxx                  │ │
│ └─────────────────────────────────────────────────┘ │
│ Which forms                                         │
│ ☑ Contact   ☑ Newsletter   ☐ Booking               │  32
│                                                     │
│ ⓘ Applies the next time you publish.                │  32
│ ( Send a test )                    [ Save ]         │  44
```

**`Send a test` is not decoration.** A wrong endpoint fails silently — the form appears to work and submissions vanish. The test posts a real payload and quotes what came back, including the provider's own error text.

**States:** empty · typing · testing · test-passed · test-failed · saved · saved-not-yet-published.

### 6.4 Detail — Shape 2 (workspace connection)

Connect is a simple key/URL form, **not OAuth** — none of these four has an OAuth flow in this product.

Zapier additionally carries **Recent deliveries**, which is the feature and not a log:

```
│ Your webhook URL                                    │
│ ┌─────────────────────────────────────┬───────────┐ │  36
│ │ https://api.buildrick.io/hooks/a7f… │  Copy     │ │
│ └─────────────────────────────────────┴───────────┘ │
│ Recent deliveries                          3        │  28
│ ✓ 14:02  Contact form            200                │  44
│ ✕ 09:15  Contact form            500  Retry ›       │  44
```

- Failed rows retry individually; keep the last 20.
- **Regenerate URL** sits in `⋯` and confirms — it breaks every Zap using the old one.
- **Disconnect confirms with the blast radius**: *"Slack is connected for all 12 sites. Disconnect everywhere?"*

**States:** never-fired · delivering · has-failures · regenerate-confirm · disconnect-confirm.

⚠ **Backend note for engineering, not the designer.** There is no site-level integrations router; the only one is `integrations.vercel`, and the generic config lives at workspace scope (`site-detail.ts` has `domains`, `redirects`, `sharing`, but no `integrations`). Shape 2's per-site on/off needs a join row that does not exist yet. **ConvertKit needs adding to the provider enum.**

## 6a. Locked / Pro screens

`🔒` rows open normally and render the screen **behind a lock panel**, not a separate wall — the user sees what they'd get.

```
┌────────────────────────────────────────────┐
│ 🔒  Custom code is on the Studio plan      │
│                                            │
│ Add scripts to <head>, custom CSS, and     │
│ third-party embeds across the whole site.  │
│                                            │
│ [ Upgrade ]      ( See plans )             │
└────────────────────────────────────────────┘
        the real screen renders below, dimmed 40%, non-interactive
```
Defect **N1** must be fixed first, or Custom code shows this panel to nobody.

---

## 7. States of the Site page

| # | State | Notes |
|---|---|---|
| 1 | Loading | nav renders immediately; content skeleton |
| 2 | Clean | no dirty fields; save pill "Saved" |
| 3 | Dirty | save bar appears at the bottom of the content column: `( Discard ) [ Save ]`, 56h, sticky |
| 4 | Saving / saved | pill mirrors the editor's |
| 5 | Save failed | inline error above the save bar with a retry; fields keep their values |
| 6 | Locked screen | §6 |
| 7 | Not-enforced screen | §3 banner |
| 8 | Leaving dirty | confirm dialog before `‹ Back to editor` discards |

---

## 7.5 Field catalog — the remaining settings screens

The shell (§1), the not-live banner (§3), the lock panel (§6) and the save bar (§7 state 3) are all specified. Each screen below is that pattern plus its fields. Field row 32h, label above control, section gap 32, content column max 720.

### SEO (site-level)
| Field | Control | Notes |
|---|---|---|
| Twitter handle | text, `@` prefix | validate `@[A-Za-z0-9_]{1,15}` |
| Default OG image | image picker | 1200×630 recommended; shows the ratio warning if off |
| SEO score | read-only chip | **must show earned points, not max weights** — the current label over-promises |

### Analytics
| Field | Control | Notes |
|---|---|---|
| GA4 measurement ID | text | regex `G-[A-Z0-9]+`; inline error |
| Meta Pixel ID | text | numeric |
| Google Ads ID | text | `AW-…` |
| Cookie consent banner | toggle | when on, reveals: banner text · accept label · decline label |
| Anonymise IP | toggle | default on |
All inject at publish, never in the editor preview. Say so in a 32h note.

### Custom code  🔒
| Field | Control | Notes |
|---|---|---|
| Head code | code editor, 200h | sanitised; live validation, error count in the gutter |
| Body-end code | code editor, 200h | same |
| Global CSS | code editor, 200h | same |
⚠ Defect **N1** — the Pro gate keys on `advanced` but the nav id is `custom-code`, so it gates nobody. Fix before shipping the lock, or the 🔒 badge lies.

### Redirects  ⚠ not live
Table, not a form. Columns: from · to · type(301/302) · ⋯. Row 40h. `+ Add redirect` opens an inline row.
| Field | Validation |
|---|---|
| From path | must start `/`; no duplicates |
| To URL | rejects `javascript:` and protocol-relative; relative or absolute |
| Type | 301 permanent / 302 temporary |
Empty: "No redirects yet. Add one when you move or rename a page."

### Headers  ⚠ not live
| Field | Control |
|---|---|
| Content-Security-Policy | textarea + 3 presets (strict · balanced · off) |
| HSTS | toggle + max-age select |
| X-Frame-Options | select (DENY · SAMEORIGIN · off) |
| Referrer-Policy | select (7 values) |
| Permissions-Policy | textarea |

### Localization  ⚠ not live
| Field | Control |
|---|---|
| Default locale | select (24 common) |
| Enabled locales | multi-select chips, add/remove |
| URL strategy | radio: subdirectory `/fr/` · subdomain · domain |
Note: the engine is locale-unaware; the banner must say routing ships later.

### Forms
Not a settings form — an inbox. Left: form picker (32h rows, unread count). Right: submission list.
- Filter pills: Inbox · Unread · Spam · Archived, each with a count
- Submission row 56h: name/email · first field excerpt · relative time · unread dot
- Row click → drill-in: all fields, submitted-at, page, actions (Mark read · Spam · Archive · Delete)
- Toolbar: `Export CSV` · `Mark all read`
- Empty: "No submissions yet. Forms on your published site will collect here."

### Export

**Decided 2026-07-19: build Vue and Next.js, not cut.** `ExportFormat` already types all six (`shared/types/export.ts:16`); `AVAILABLE_FORMATS` ships three and `COMING_SOON_FORMATS` holds `vue` and `nextjs` (`ExportOptions.tsx:20-23`).

| Format | State | Ships as |
|---|---|---|
| **HTML + CSS** | ✅ ready | one file, or linked CSS — a toggle |
| **ZIP** | ✅ ready | HTML + CSS + every asset |
| **React** | ✅ ready | components + CSS modules |
| **Vue** | **BUILD** | SFCs — `<template>` + `<style scoped>` |
| **Next.js** | **BUILD** | App Router — `app/page.tsx` per page + `globals.css` |

**Six formats do not fit one flat list.** Group them, or the user reads five equivalent options and picks wrongly:

```
┌─ max 720 ───────────────────────────────────────────┐
│ Export                                              │
│                                                     │
│ STATIC — publish anywhere                           │  28
│ ◉ HTML + CSS        one file, or linked CSS   ▾    │  56
│ ○ ZIP               everything, including assets    │  56
│                                                     │
│ CODE — hand off to a developer                      │  28
│ ○ React             components + CSS modules        │  56
│ ○ Vue               SFCs, scoped styles             │  56
│ ○ Next.js           App Router, one route per page  │  56
│                                                     │
│ ☑ Include assets    ☑ Format code    ☐ TypeScript  │  32
│                                                     │
│                              [ Export ]             │  44
└─────────────────────────────────────────────────────┘
```

- **Row 56h** — radio · format name 13/500 · what you get, 12 `--ink-soft`. The description is the choosing mechanism; a bare format name makes the user guess.
- **Two groups, named by intent** — *publish anywhere* vs *hand off to a developer*. That is the actual question behind the choice.
- **Options row 32h** applies to the selected format and **changes with it**: `TypeScript` appears only for React / Vue / Next, `Inline CSS` only for HTML. An option that does nothing for the current selection must not be visible.
- **Preview before download.** The existing `CodePreview.tsx` already renders a file tree plus the generated source — show it for the code formats, because a developer wants to see the shape before committing a download.
- Export runs client-side: a **44h progress row** (`Generating 12 of 27 pages…`), then the download.

**⚠ One thing the designer must draw, because it is a known live bug:** AI-generated sites store their content as **raw HTML inside a container**, and the export path escapes it — so an AI-built site exports as visible markup rather than a rendered page. Until that is fixed, the export screen needs an **honest pre-export warning** for AI-generated sites rather than a silently broken file.

**States:** idle · format-selected · previewing · generating · done (download) · failed · ai-site-warning · empty (no pages).

## 8. Still open

1. ~~Integrations~~ — **BUILD, decided 2026-07-19.** Specced in §6: three connection shapes, six cards. Netlify Forms → Slack.
2. ~~Per-screen permissions~~ — **settled**, `2026-07-19-system-contracts.md` §2. A DESIGNER may open every Site screen but cannot act on **Domains** or **Publish history rollback**; both render disabled with the reason. Members and Billing leave for the dashboard and are OWNER-only there.
3. ~~Publish history rollback~~ — **settled**, `2026-07-19-system-contracts.md` §5: rollback is a *new publish of an old version*, never a mutation of history; the draft is never touched; a failed build offers `Retry`, not `Rollback`.
4. ~~Export~~ — **BUILD Vue + Next.js, decided 2026-07-19.** Specced in §7.5 › Export: six formats in two intent groups, per-format options, preview for code formats.
5. ~~Mobile~~ — **settled**: Site is desktop-only, like the editor and the client review page. Founder-locked; reaffirmed 2026-07-18 against a cross-model argument for a mobile client page.
