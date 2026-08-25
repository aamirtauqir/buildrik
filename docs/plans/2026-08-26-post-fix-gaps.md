<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260826-014901.md -->
# Post-fix gaps — 2026-08-26

Status: DRAFT (input to /autoplan)

Three gaps surfaced by thinking about what the 2026-08-25 fix pass left standing.
All three are the SAME shape as the defects that pass fixed — something is built
and correct, and the last inch is missing — which is why they are worth doing
together rather than waiting for a walk to trip over them.

Out of scope (founder, 2026-08-25, unchanged): payments/Stripe, deploy.

---

## G1 — the differentiator is off by default, so the fix pass reaches nobody

`isFeatureEnabled` (`server/services/feature-flag.service.ts:17-25`) returns
`row?.enabled ?? false`, and nothing seeds a `workspaceFeature` row when a
workspace is created. Verified: workspaces are created at
`server/services/auth.service.ts:86` (signup) and
`server/services/workspace-settings.service.ts:72` (additional workspace);
neither writes a feature row.

So a new signup gets `agency_layer: false`. The whole agency layer —
`/dashboard/agency/*` redirects away at `layout.tsx:36` — plus the client review
loop that the 2026-08-25 pass just repaired, is invisible until an **ADMIN**
finds the toggle in Settings (`components/settings/agency-layer-toggle.tsx`,
`features.set`, ADMIN-gated at `routers/features.ts:19-30`).

**Not a missing door** — the door exists and works. A default.

The flag was shipped dark on purpose: the service's own comment says it exists
"to gate the riskiest epics with a runtime kill-switch". The question this plan
has to answer is whether that reason still holds now the loop demonstrably runs
end to end (2026-08-25: round sent → client requested changes → resend → client
approved → publish gate reflected it).

Options:
- **A. Seed on create.** Write `agency_layer: true` (and `client_mode`?) rows at
  both creation seams. New workspaces get it; existing ones are untouched; the
  kill-switch still works.
- **B. Change the default.** `?? false` becomes per-key. One line, but it flips
  EXISTING workspaces too, silently.
- **C. Leave it.** Keep it opt-in, and treat discovery as an onboarding problem.

## G2 — a failed client invite is silent, in exactly the shape just fixed

`notifyClientInvited` (`review.service.ts:409-430`) wraps the send in
`try { … } catch (e) { console.error(...) }`, and `submitReview` returns only
`request` (`:115`). Nothing carries send status to the caller, so
`ReviewService.submitForReview` cannot know, and the panel cannot say.

Consequence: with SMTP misconfigured in production the client never receives the
link, the round exists, the token exists, and the editor reads "Sent". The
designer waits on a client who was never told.

This repo has the precedent in its own root `CLAUDE.md`: `SMTP_PASS` carrying a
`$` was eaten by the cPanel shell, dev worked, prod returned 535. A mail failure
that only reaches `console.error` on the server is invisible to everyone who
needs it.

Best-effort SENDING is right — a mail failure must not fail the submit. Best-
effort REPORTING is not. The round should be created either way and the UI
should say the invite did not go.

## G3 — nothing is instrumented, so the next pass gets ranked by accident

Verified by grep across `server/`, `lib/`, `packages/dashboard/app` and
`packages/dashboard/components`: `posthog`, `mixpanel`, `amplitude`,
`analytics.track`, `signup_completed` — **zero matches**.

The 2026-08-25 ledger was ranked by measured severity, which is a property of
the code, not of the business. Both CEO voices called that out. Without one
event, the next pass gets ranked the same way — by whatever a walk happens to
bump into.

Scope discipline matters here: the founder is cost-anxious and this is a build,
not a one-liner. The smallest useful version is two events, not a platform:
- `signup_completed` — the funnel's first real number
- one editor event that proves the differentiator is used at all (the review
  round being sent is the obvious candidate, since that IS the wedge)

Open: which sink? A self-hosted table is cheapest and has no vendor cost; a
hosted product is faster to read. This plan should pick one, not list both.

---

## What binds this plan

- Done = observed in the running app. Dev server on :3000, `OLLAMA_BASE_URL`
  cleared. Rig at `scripts/baseline/editor-rig.mjs` (8 traps). Fixture site
  `cmrsur1fp000unh3rvmmiq25t`.
- Never edit `.env.local`; override env at process launch.
- Data-flow chain is not optional: Page → tRPC → Router → Service → Prisma.
- G1 and G2 touch `server/`, which has its own AGENTS.md rules (domain errors,
  no Prisma in routers).
- G3 must not add a module-level external client (root `CLAUDE.md`: lazy-init).
- Pre-push hook runs the full gate suite and BLOCKS.

## Verification contract

| # | The measurement that must flip |
|---|---|
| G1 | a NEW signup's workspace has the agency layer visible without an admin touching Settings |
| G2 | an invite whose mail fails tells the designer, and the round is still created |
| G3 | a signup and a review-send both leave a row/event that can be counted |

---

# Review addenda — 2026-08-26

## CODEX SAYS (CEO — strategy challenge)

1. **G1 as written is the wrong question.** "ON for every new workspace" — no.
   "ON for new workspaces that explicitly identify as agencies" — yes.
   `agency_layer` does not gate the review loop; it gates **the whole Agency
   IA** — Clients, Reviews, Handover, Library, Shared theme, Partner
   (`agency/(tabs)/layout.tsx`, `shell/agency-tabs.tsx`). This plan named only
   reviews. Worse, `Library` and `Partner` are not server-gated the same way:
   `dashboard.partner` and `siteComponents.workspaceList` are simply reachable
   once the route is. *"Universal default-on is not 'turn on the wedge'; it is
   'make agency mode the default product.' That is a positioning decision, not a
   flag tweak."*
2. **G2 — do it, as a truthfulness fix, smallest version.** *"A successful
   review submit with a failed email and a 'Sent' UI is a lie."* Round still
   created, visible failure state, and **a retry or copy-link fallback**.
3. **G3 — `signup_completed` is the wrong first event.** Measure
   `review_round_submitted` first, because it says whether the differentiator is
   touched at all. Second: `review_link_opened` / `client_review_started`. Sink:
   a cheap workspace-scoped Postgres table. **Not** `AnalyticsEvent` (that is
   page-traffic shaped — `siteId`, `path`, `userAgent`), and not `AiAdoptionEvent`
   (naming debt). And: *"writing events with no founder-facing view is dead
   data."*
4. **Missing:** a blast-radius inventory of everything the flag ships, and the
   segmentation decision — is Buildrick default-solo with an agency upsell, or
   default-agency from first login?
5. **Order:** flag-surface audit → G2 → one event → G1 last, and G1 only as
   seed-on-create for agency-selected workspaces.

## What I verified after reading that — three things change the plan

**The segmentation signal Codex says is missing already exists and is already
persisted.** Onboarding asks the question at
`packages/dashboard/app/onboarding/path/page.tsx:20-21` (`Freelancer` /
`Agency` / `In-house` / `Student`), `onboarding/workspace/page.tsx:74` saves it
via `saveAndGo(..., { workspace: { name, role, teamSize } })`, and
`prisma/schema.prisma:885` holds it as `OnboardingState.role`. So G1 does not
need a new question or a positioning decision — it needs to read an answer the
product already collects. That turns Codex's "seed for agency-selected
workspaces" from a proposal into a wiring job.

**The analytics sink already exists, is the right shape, and has a read path.**
`ActivityLog` (`schema.prisma:864-880`) is workspace-scoped with `siteId`,
`actorId`, `action`, `metadata` and an index on `[workspaceId, createdAt]` —
product-usage shaped, exactly what Codex asked for and not what
`AnalyticsEvent` is. `server/services/activity-log.service.ts` exposes
`record`, `recordForSite` and **`listWorkspaceActivity`**, so the founder-facing
read path Codex called missing is already built.

**And the wedge event is the one thing not being recorded.**
`server/trpc/routers/reviews.ts:21` already imports `recordForSite` — and uses
it in exactly one place, `review.revoked` (`:192-198`). The submit path records
nothing. `server/trpc/routers/client-review.ts` records nothing at all. So the
rare path is instrumented and the two that matter are not.

That collapses G3 from "wire up analytics" to two calls in the existing pattern,
with the existing naming convention (`noun.verb`, per every action string in the
repo today: `site.published`, `site.rolled_back`, `review.revoked`, …):

- `review.submitted` in the submit mutation
- `review.resolved` on the client path, with
  `metadata: { status: "APPROVED" | "CHANGES_REQUESTED" }`

No new table, no vendor, no platform. My original framing — "nothing is
instrumented" — came from grepping for third-party analytics
(posthog/mixpanel/amplitude), which was true and gave the wrong impression: the
repo has its own event log and uses it for eleven other actions.

## FLAG-SURFACE AUDIT — the thing the plan forgot

Codex was right that this was missing, and the audit changes G1 outright.

**`agency_layer` opens six tabs, not one.** `agency-tabs.tsx:10-17` — Clients,
Reviews, Handover, Library, Shared theme, **Partner** — plus a sidebar nav item,
five command-palette entries, the site-detail "Send for review" button, and ten
server procedures. G1 named only reviews.

Five of the six are ready. Three things are not, and they are not opinions:

1. **⛔ Partner is a stub that promises money.** `partner.service.ts:31` reads
   `prisma.referral.findMany`; a repo-wide grep for `referral.create|upsert|
   update|delete` returns **zero** — nothing has ever written a `Referral`. The
   page builds `${origin}/?ref=${code}` and nothing anywhere reads a `ref`
   param. A new user sees *"Bronze Partner · 15% commission"*, *"$0 of $1,000 to
   reach Silver"* and a **Get referral link** button for a program that does not
   exist. The service's own comment says the tiers are placeholders *"adjust when
   the commercial program is finalized"*. `dashboard.partner`
   (`routers/dashboard.ts:84-87`) also has **no server-side flag check** — the
   route is protected only by a client-side redirect its own comment calls
   *"UX"*, not security.
2. **⛔ "White-label branding" writes to fields nothing reads.**
   `client-detail-view.tsx:22-79` saves Logo URL, Custom domain and *"Hide
   Buildrick branding for this client"* via `clients.update`. Grep every consumer
   of `hideBuildrik`/`logoUrl` outside the clients CRUD: **nothing** — not
   publish, not export, not the client review page. `clients-view.tsx:252` sells
   it anyway: *"Clients group sites per customer with white-label branding."*
3. **⛔ "An admin has been notified" is false on a one-seat workspace** — which
   is what every new workspace is. `review.service.ts:459-461` filters recipients
   with `!!e && e !== requester?.email`, so a solo owner emails nobody, and
   `send-review-modal.tsx:23` toasts that an admin was told.

**`client_mode` gates nothing.** Declared in `FEATURE_KEYS`, referenced only by
comments and tests; all nine production `isFeatureEnabled` calls pass
`agency_layer`. Seeding it would imply a behaviour that does not exist.

**And the founder has already ruled on the flip.** `docs/PRODUCT-OVERVIEW.md:176-178`,
under *"Founder / pilot-gated (can't be done by engineering alone)"*:

> Flip `agency_layer` for a real named pilot workspace.

with `:183` recording *"Agency review flow is closer to internal-admin approval
than a polished external client experience."*

## G1 — REVISED

Defaulting the flag on is **not an engineering decision** and this plan should
not make it. It is already on the founder's own pilot-gated list, and the audit
shows why: turning it on ships a commission program that does not exist and a
white-label claim nothing honours.

What this plan does instead is **remove the three things that block that flip**,
so the decision becomes clean whenever the founder wants to make it:

- **G4** — Partner: it should not be reachable while `Referral` has no writer.
- **G5** — white-label: either wire `hideBuildrik` into publish/export, or stop
  claiming it.
- **G6** — the solo-workspace notification lie.

Plus the mechanical wiring that is uncontroversial either way:

- **G1a** — seed `agency_layer` from the role the product ALREADY collects
  (`OnboardingState.role === "agency"`), so the flip, when made, needs no
  backfill and no admin hunt. Ship it behind the founder's call, not ahead of it.

## CLAUDE SUBAGENT (CEO — independent) — and it breaks G3 open

Converges with Codex on G1 and adds three things that change the work.

**G3 is mostly already done, and my grep was the wrong instrument.** I searched
for the names I intended to introduce — `posthog|mixpanel|amplitude|
analytics.track|signup_completed` — not for whether the FACTS are recorded. Both
are:

- **Signup**: `logAuditEvent("SIGNUP", "success", …)` at `auth.service.ts:195`,
  plus `OAUTH_SIGNUP` at `auth.config.ts:82`. Rows land in `audit_logs`, indexed
  on `action` and `createdAt`. **All 17 cron routes checked — there is no
  audit-log purge**, so the full history since launch is sitting there uncounted.
- **Review round sent**: every send writes a `ReviewRequest` with `createdAt`,
  `status` and `invitedEmail`. `WHERE "invitedEmail" IS NOT NULL` **is** "a round
  that went to a client".

So the gap is not a writer. **Nobody has run the query.** G3 becomes one script
in `scripts/` printing weekly signups, sites, rounds sent, rounds approved and
send→approve conversion — no table, no vendor, no module-level client.

**G2 also has a precedent I missed.** `audit.service.ts:16` already carries
`VERIFICATION_EMAIL_FAILED`, with a comment that is G2's thesis verbatim:
*"The verification mail did not go out. Signup still succeeded, so nothing else
records it — and without a row here a broken SMTP config looks identical to
nobody signing up."* Called twice from `auth.service.ts`. So the server half is
one union member and one `logAuditEvent` in the catch I already touched.

**And a live defect better than any G1 option.** `/onboarding/site` defaults
`orgType` to **"New client"** (`page.tsx:43`), makes the client name a **hard
validation blocker** (`:75-80`), and labels the email *"Used for review and
approval links."* Then `use-onboarding-complete.ts:31-41` calls `clients.create`,
which throws FORBIDDEN because the flag is off, and an **empty `catch {}`
discards it**. Every new user is asked for a client, promised the review loop,
and has the answer thrown away.

**Two corrections to the audit above, both making things worse:**

- White-label is not merely unread. The Buildrick badge is decided by **plan
  alone** — `publish-html.ts:108-109`, *"Injected only on FREE"*. So a FREE
  agency ticks *"Hide Buildrick branding"* and the badge **still ships on the
  client's site**.
- **Shared theme fails on a new user's first action.** `createSite` never seeds
  `projectStyles`, so `captureSharedTheme` writes `Prisma.DbNull`
  (`theme.service.ts:87-91`), `getSharedTheme` reads it back as `null` (`:65`),
  and the UI toasts **"Theme captured"** while still showing *"No shared theme
  captured yet"* with Push disabled.

**On G1 itself it is blunter than I was:** Option A only affects future
workspaces, so it does not solve the stated problem at all; Option B is less
dangerous than I wrote (it flips only workspaces with **no row** — a deliberate
`false` survives); and the move the product doc already prescribes — flip it by
hand for a named pilot — is zero code and reaches a real person this week.

Also flagged: `clients.service.ts:48,116` `siteCount` omits the `deletedAt: null`
filter `listSites` applies, so one screen disagrees with itself after a delete;
and on Clients and Theme, non-admins see every action button live and get a
FORBIDDEN toast per click.

## CONSENSUS — what this plan becomes

Both voices, independently: **do not flip the flag from here.** It is on the
founder's own pilot-gated list, and turning it on today ships a commission
program that cannot pay, a white-label box publish ignores, and a theme capture
that lies. Both also independently say **remove the Partner tab first** — one
line, no dependencies, the only surface that could embarrass a pilot.

Work, in the order both voices converge on:

| # | Fix | Why now |
|---|---|---|
| I1 | Remove the Partner tab | promises commission with no `Referral` writer and no `?ref=` reader |
| I2 | Onboarding throws the client away | asks every new user, swallows FORBIDDEN, silent data loss |
| I3 | "Theme captured" over a no-op capture | a new user's FIRST agency action lies |
| I4 | White-label box publish ignores | badge is plan-decided; FREE agency ticks it and it still ships |
| I5 | "An admin has been notified" on a one-seat workspace | false for every new workspace |
| I6 | Invite email failure silent (was G2) | the pilot invite is the one that must not fail invisibly |
| I7 | A query script over data already on disk (was G3) | the rows exist; nobody has counted them |
| I8 | `siteCount` ignores `deletedAt` | one screen disagrees with itself |

**G1 stays with the founder.** `docs/PRODUCT-OVERVIEW.md:178` already says the
next move is to flip it for a named pilot workspace — one click in Settings,
zero code. This plan clears the blockers so that click is safe.
