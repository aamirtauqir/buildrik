# dc prototype vs live dashboard — visual audit

**Date:** 2026-07-20
**Prototype:** artifact `50a51e54-14d6-4ae7-859f-665602485cf6` ("Figma wireframing analysis"), 17 screens
**Live:** `localhost:3000/dashboard`, workspace "Vocab Check WS" (QA account)
**Scope:** UI only. Flows and business logic explicitly out of scope.

## Method

The prototype is div-soup with no semantic HTML, so heading/table selectors return
nothing on it. Both sides were instead read through **computed typography** — font
size and weight are the hierarchy in a design mock — walking every visible text node
and bucketing by size/weight. The same extractor ran against both, so the two sides
are measured the same way rather than by eye.

Shell dimensions were taken from `getComputedStyle`, not from JSX. Reading the class
list would have missed that live's active nav item resolves to the identical colour.

**One comparison was thrown out and redone.** The first nav-item measurement compared
the prototype's *inactive* Home against live's *active* Home and reported font-weight
and colour deltas that do not exist. Same-state comparison shows them identical.

## Headline

The gap is not what it looked like. **All 17 prototype screens already have built
implementations** — the small page files are thin wrappers delegating to real
components (`media/page.tsx` → `MediaLibrary`, `notifications/page.tsx` →
`NotificationPage`, and so on), so file size said nothing about completeness.

**The shell needs no work.** Measured like-for-like:

| | Prototype | Live |
|---|---|---|
| active bg / colour | `rgb(235,241,255)` / `rgb(64,110,214)` | identical |
| inactive colour | `rgb(107,115,128)` | identical |
| item height / radius | 30px / 8px | identical |
| accent token | `#406ed6` | `#406ed6` |
| aside padding | 10px | 0px |
| font-size / weight | 13px / 500 | 13.5px / 520 |
| icon gap | 10px | 11px |
| body font | Inter | **Inter Tight** |

Colours and structure match exactly. What remains is sub-pixel, and the font
difference favours live: DESIGN.md specifies Inter Tight, so the *prototype* is the
one deviating — it simply never loaded the right family.

## Real deltas

### Home
- Live carries a floating "Getting Started 0/7" panel and a FAB the prototype has no
  equivalent for.
- ~~Storage widget is visually broken~~ — **retracted, this was a tool artifact.**
  The first pass read a screenshot in which "Upgrade plan" appeared clipped to "ade
  plan" under a dark circular badge. The badge is `nextjs-portal`, Next.js's own
  dev-tools indicator, which sits at the bottom-left in development and never ships.
  Measured directly on a FREE-plan workspace the widget is intact: the link sits at
  x 0–292 inside a 293px sidebar, `fitsHorizontally` and `fitsVertically` both true,
  `scrollWidth === clientWidth`, and the only element over it is its own container.
  Nothing to fix.

### Projects
- ~~Title: "All projects" → live "Projects"~~ — **retracted, see the title section below.**
- ~~Primary CTA: "New project" → live "New site"~~ — **retracted.** Live's entity is
  Site end to end: the model, `/dashboard/sites/[id]`, the site-detail page, and the
  home quick action "Create a site". The prototype is not consistent here either — its
  own home screen also says "Create a site" while its Projects screen says "New
  project". Renaming one button would import that split for no gain.
- Tabs: prototype "All sites | Apps", live "All sites | Archived". The **Apps tab has
  no live counterpart**.
- Live has a "Select" bulk-mode affordance the prototype does not show.

### Media
- ~~Title: "Media library" → live "Media"~~ — **retracted, see below.**

### Templates
- Template cards offer **"Use"**; live shows **"Coming soon"** — the templates are not
  wired up.

### Settings
- ~~Title: "General settings" → live "Settings"~~ — **retracted, see below.**
- Prototype rows with no live equivalent *in settings*: **Review & comments**,
  **Partner program**. Both features exist in live, but under `/dashboard/agency/*`.
  This is an information-architecture difference, not missing functionality.
- Live rows the prototype lacks: **Personal** group (Account, Profile), **AI & credits**.

### Learn
Furthest-off screen in the audit.
- Prototype has a **"Continue learning" hero card** with a Resume button and
  "Client workflows · Lesson 3 of 6" progress. Live has nothing equivalent.
- Prototype paths carry **Completed / Not started status chips**. Live has none.
- Path topics differ entirely — prototype is workflow-oriented ("Designing with AI
  generation", "Client review & sign-off"), live is feature-oriented ("Managing
  Sites", "Team & Permissions").

### Help centre
- Category names differ: prototype "Publishing & domains", "Plans & billing",
  "Team & clients" vs live "Domains & DNS", "Billing & Plans", "Team & Permissions",
  "Managing Sites".
- Live has extras: Keyboard Shortcuts, Print.

### Getting started
- Same content. Live splits "2 of 5 complete" across separate elements where the
  prototype renders one string — minor, likely a styling artefact.

## Matches — no work

**Resources**, **Marketplace** (live even adds Memberships), **Usage & AI credits**
(all four metrics plus the bandwidth chart, structurally identical — the different
limits are plan tier, not design).

## Do NOT implement

Four places where following the prototype would make the product worse:

1. **Plans pricing.** Prototype: Starter $0 / Freelancer $18 / Agency $58 /
   Enterprise. Live: Free $0 / Pro $29 / Business $79. Live is the real model — it is
   what `plan-limits.ts` defines and what the Stripe Products were created against.
   The prototype's tiers are invented.
2. **Body font.** Prototype uses Inter; live uses Inter Tight per DESIGN.md.
3. **Settings → Notifications and Settings → Add-ons.** Both are dead links in the
   prototype itself — clicking them does not navigate. There is nothing to copy.
4. **The three page titles.** The first pass listed "All projects", "Media library"
   and "General settings" as trivial copy fixes. They were applied, then reverted:
   they are not three loose strings but one shipped IA v2 rule — each of the six
   workspace destinations is titled with its own nav label.

   | nav label | h1 |
   |---|---|
   | Projects | Projects |
   | Agency | Agency |
   | Media | Media |
   | Templates | Templates |
   | Settings | Settings |

   `e2e/dashboard.spec.ts:5` states it outright ("The 6 workspace destinations
   (IA v2). Each must render its own h1"), and Settings has its own written history:
   `e2e/settings-drill-in.spec.ts:18` records that it *used* to read "General
   settings" — the name of one of the cards on that very page — that two specs
   contradicted each other over it, and that "Settings" was the resolution. The
   prototype breaks the rule in all three places.

## Second pass — after seeding

The first pass left eight screens unauditable: the QA workspace was empty, so live
rendered empty states against a populated prototype and any comparison would have
been a list of *data* differences dressed up as design findings.

A separate workspace was seeded to unblock them — **`audit@buildrik.local` /
"Northwind Studio"**, deliberately not the QA account, because
`qa@buildrik.local` is what the Playwright suite provisions against and the two
have collided before. It carries a BUSINESS plan, an active subscription, three
invoices, four members, four clients, four sites and four domains across every
status. Two things had to be true before any of it rendered: the user needs a
completed `OnboardingState` or the dashboard bounces to the wizard, and the
workspace needs the **`agency_layer` feature flag** or every Agency route
redirects away.

### A real bug, not a design gap

**The billing page crashes outright.** With invoices present it renders "Failed to
load this page"; the console shows
`TypeError: Cannot read properties of undefined (reading 'tone')` thrown from a
`DataTable` column renderer.

The cause is a lookup map written from imagination rather than from the real
vocabulary — the same shape as the wizard `tone` bug fixed earlier the same day,
except this one throws instead of silently defaulting:

- **Write:** `stripe-webhook.service.ts:262` stores `invoiceData.status.toUpperCase()`.
  Stripe's invoice statuses are `draft | open | paid | uncollectible | void`, so the
  column holds `DRAFT | OPEN | PAID | UNCOLLECTIBLE | VOID`.
- **Read:** `invoice-table.tsx:36` does `STATUS[inv.status].tone`, and `STATUS` has
  only `PAID | FAILED | PENDING | REFUNDED`.

The single overlapping value is `PAID`. Every other real status yields `undefined`
and throws. `FAILED`, `PENDING` and `REFUNDED` are values Stripe never sends.

This matters most at the worst moment: `invoice.payment_failed` is one of the five
subscribed webhook events, and a failed payment leaves the Stripe invoice `open` —
so **the customer whose card just failed gets a crashed billing page**, precisely
when they need to reach the portal to fix it.

Nothing caught it because the type asserts what the code wishes were true: the
Prisma column is a bare `String`, and `InvoiceStatus` is declared twice
(`invoice-table.tsx:5` and `lib/constants/enums.ts:78`) with the same four invented
values in both places.

### Results

| Screen | Verdict |
|---|---|
| **Team** | Columns Member / Email / Role / Last active — **exact match**. Live adds a "Team Activity" section. |
| **Clients** | Columns Client / Sites / Contact / Status — **exact match**, plus Add client. |
| **Reviews** | Sections "Review queue" and "Latest comments" — **exact match**. |
| **Domains** | Same four columns, but **order differs**: prototype Domain/Site/**SSL/Status**, live Domain/Site/**Status/SSL**. |
| **Partner** | Same shape (tier + commission % + three stats). Live lacks the referral table and "Get referral link" — possibly just the empty state, unverified at zero referrals. |
| **Site detail** | Live is fully built — six metrics, Health Score, Recent Activity, Send for review / Unpublish. The prototype's own siteDetail could not be reached by any drill-in path tried, so this one is still uncompared. |
| **Client detail** | Prototype: stats 4/3/$58/1, Sites + Contact sections, Message and New site actions. Live equivalent exists at `/dashboard/agency/[id]`. |
| **Notifications** | Live has a real screen; the prototype's row is a **dead link**. Live is ahead. |
| **Account** | Live has Set a password / Email address / Connected accounts. No prototype equivalent. |

### The prototype predates a shipped IA decision

The prototype's sidebar carries **Clients** as a top-level item. Live does not, and
that is deliberate: the command palette records it as
`"Clients" → "Moved → Agency › Clients", agencyOnly: true`. Reviews, Comments,
Shared theme and Partner program were consolidated the same way, all behind the
`agency_layer` flag.

So five prototype entries correspond to one shipped Agency surface. **Implementing
the prototype's navigation literally would undo the IA v2 work.** Recommend keeping
the shipped IA, which is also what was agreed when scope was set.

### Still open

**Projects folders.** The prototype groups sites into folder cards with per-folder
stats ("Marketing Sites · 8 · 2 · 1.2k"); live shows a flat list even with four
sites present. Live has a "New folder" button, so folders exist as a concept — but
no folders were seeded, so whether live renders folder cards when they exist is
**still unverified**. Do not treat this as either matching or missing.

## Suggested order

1. **Invoice status crash** — not a design task and not optional. Real customers on
   any non-`PAID` invoice lose the billing page entirely. Fix the vocabulary at the
   source (one list, derived from what Stripe actually sends) rather than patching
   the map, and make the unknown case render a neutral pill instead of throwing.
2. **Learn screen** — the only screen with genuinely missing structure: the
   "Continue learning" hero card with Resume and progress, plus the per-path
   status chips. Largest single piece of UI work here.
3. **Domains column order** — swap SSL and Status. One line.
4. **Decide, do not assume.** Four places where the prototype and the shipped
   product genuinely disagree and someone has to choose: the Projects **Apps tab**,
   Help category naming, whether Projects should group into **folder cards**, and
   whether the prototype's flat sidebar should override the shipped Agency IA.
   The recommendation on the last one is no.
