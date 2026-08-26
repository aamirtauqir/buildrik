# W1 · Signup → live URL — the path no walk had taken

Walked 2026-08-26 · localhost:3000, 1440×900 · a **real signup**, not a fixture.

Every walk in both prior arcs started from an existing session on
`cmrsur1fp000unh3rvmmiq25t`, a workspace that already had sites, content and
`agency_layer` pre-enabled. Grepping `docs/walks/` for "signup" or "onboarding
wizard" returned **nothing**. This is that gap closed.

Account: `syed.aamir.tauqir+walk@gmail.com` (a Gmail alias — the founder's own
inbox, a genuinely new user row). Their existing dev account
(`syed.aamir.tauqir@gmail.com`, "aamir's Workspace", 3 sites) was not touched.

## The chain, end to end

| # | leg | result |
|---|---|---|
| 1 | signup form | **PASS** — two-step: email probe, then name/email/password with live rules |
| 2 | account creation | **PASS** — user + workspace ("Aamir Walk's Workspace", OWNER) + `OnboardingState` at `ROLE_SELECT` |
| 3 | verification email | **FAILED — and reported correctly.** See §SMTP |
| 4 | onboarding · workspace | **PASS** — renamed the signup workspace rather than creating a second |
| 5 | onboarding · site | **PASS — and this is the I2 fix, live.** See §I2 |
| 6 | onboarding · path | **PASS** — "Recommended because you selected Agency" |
| 7 | onboarding · blank | **PASS** — starting page + layout starter |
| 8 | onboarding · ready | **PASS** — site/workspace/method/pages summary, "Open Editor" |
| 9 | editor first open | **PASS** — 6 rail tabs, **0 console errors, 0 HTTP ≥400**, no review pill (correct: flag off) |
| 10 | flag flip | **PASS** — `/dashboard/settings/workspace`, one toggle, DB row written |
| 11 | agency tabs ×5 | **PASS** — all honest empty states, **0 errors**. Partner redirects (fix, 2026-08-26) |
| 12 | shared-theme capture | **PASS — the I3 fix, live.** See §I3 |
| 13 | send for review | **PASS, after a fix this walk found.** See §I6b |
| 14 | client review + approve | **PASS** — identity gate, "Request changes"/"Approve", terminal screen |
| 15 | approval reaches designer | **PASS** — topbar reads "Approved by Walk Client · just now" |
| 16 | publish | **CORRECTLY BLOCKED.** See §publish |

## §SMTP — the product told the truth; the credentials are wrong

`SIGNUP success` then `VERIFICATION_EMAIL_FAILED` — metadata
`Invalid login: 535 Incorrect authentication data`. `.env.local` carries all five
`SMTP_*` keys and no `SMTP_PASS_B64`.

**Not a product defect.** The chain is fully wired: `auth.service.ts:206-218`
returns `verificationEmailSent`, `routers/auth.ts:98` passes it,
`signup/page.tsx:62` appends `&sent=0`, and `verify-email/page.tsx:18` reads it.
Measured both branches:

- without the flag: *"We sent a verification link to …"*
- with `sent=0`: *"Your account was created, but we couldn't send the
  verification link to … just now. Use Resend below — nothing is lost."*

**I nearly filed this as a critical defect.** I loaded `/auth/verify-email`
directly, without the query parameter the real flow supplies, and read the happy
copy as the only copy. Follow the flow, not the destination.

## §I2 — the onboarding client step, fixed and confirmed on the real path

Step 2 now shows exactly one card — **"My own business"**. The "Existing client"
and "New client" branches are hidden because `clients.create` is flag-gated and
would throw. Before 2026-08-26, "New client" was the **default**, the client name
was a hard validation blocker, the email was labelled *"Used for review and
approval links"*, and `use-onboarding-complete.ts` swallowed the FORBIDDEN.

I found that by reading code. Only this walk confirmed it on the path a new user
actually takes.

**Still true and NOT fixed:** the role question (`Freelancer / Agency / In-house
/ Student`) is persisted as `OnboardingState.role` and its only consumer is the
path nudge on step 3. I selected **Agency** and got a product with no agency
features and no mention of them. That is the founder's flag decision, stated as
a measurement.

## §I3 — theme capture, fixed and confirmed on a genuinely new site

A brand-new site has no `projectStyles`. Capture now refuses:

> Couldn't capture theme — That site has no styles to capture yet — open it, set
> your brand colours and type, then capture.

Before the fix it wrote `Prisma.DbNull`, toasted **"Theme captured"**, and left
the panel reading "No shared theme captured yet" with Push disabled. A new
user's first agency action reporting success over a no-op. This walk is the only
place that scenario exists.

## §I6b — a gap in my own fix, that only a real first-send could show

The invite-failure notice shipped on 2026-08-25 and its tests passed. It worked
on **re-send** and not on **first send**: `SendForReview` rendered the notice in
its own popover, then called `onSent()`, which reloads the panel — and the panel
swaps out of its `!round` branch, unmounting `SendForReview` and the notice with
it. So the very first client invite wrote the audit row, the server knew, and
the user was told nothing.

Fixed (`adb00737`): the panel owns the message. Re-walked with SMTP genuinely
failing:

> Sent just now · syed.aamir.tauqir+client@gmail.com
> **Round created — but the invite email didn't go out. Send your client the
> link yourself.**

## §publish — the gate is correct and complete

    Target            No Vercel connection
    Pages             1 page
    Client approval   Approved by Walk Client on Aug 26.
    Rollback          The last 20 versions stay restorable
                      Sites deploy to your own Vercel account. Connect it to publish.
    [Cancel]          [Publish now]  ← disabled: true

Measured: `Publish now` is `disabled: true`. The wizard's review step is stricter
still — it swaps its primary for **Connect Vercel** rather than offering a dead
Continue.

**I nearly filed this too.** I clicked the button, saw nothing happen, and read
that as a silent failure. It is a disabled button behaving exactly as it should.
Read the control's state before reading its behaviour.

So the chain ends here, correctly and legibly. What is missing is a Vercel
connection **for this workspace** — and that is the whole of it.

**Correction to something I said out loud during this session:** I repeated a
subagent's claim that "nobody has ever published a site", sourced to F-A3.
F-A3 does not say that — it says its own last leg, a real deploy to the
internet, was *called out rather than performed*. The database says publishing
has run:

    2026-05-24  My New Site   https://buildrik-site-my-new-site-f3gfusk5w-shah8.vercel.app
    2026-05-24  test-site-qa1 https://buildrik-site-test-site-qa1.vercel.app
    2026-06-12  test-site-iter5 …

The first carries a deployment hash and a Vercel scope (`shah8`). The simulation
path returns `https://<siteId>.vercel.app` with no hash, so that one was a real
deploy to a real Vercel account. `WorkspaceIntegration` holds a live `vercel`
row created 2026-05-20.

So publishing is not unbuilt and has not never run. What is unknown is whether
it **still** works — the last real-looking deploy is three months old. That is a
walk, not a project, and it is the last unwalked leg. It could not be walked from
here: the connection belongs to the founder's own workspace, and this walk ran on
a workspace created minutes earlier, which correctly had none.

## What this walk did NOT assess

Visual and IA. The AI Draft and Template paths (Blank Canvas was taken). Multi-
user and role behaviour — this workspace has one OWNER. Anything at scale: one
site, one page, one element. Any second device or browser.

## Two numbers worth carrying

`pnpm funnel` now reads this walk: the signup, the site, the round sent, the
approval, and the invite that never left. It reported them off tables that
already held everything — no new writer was added.

And this walk produced **three false findings** before filing, all the same
shape: reading a destination without the flow's state (verify-email), clicking a
control without reading its state (publish), and clicking a control outside the
viewport (the flag toggle). The pattern across two days is consistent — measure
the control, then the behaviour, never the reverse.
