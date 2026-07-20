# Stripe go-live — deploy plan (2026-07-20)

Goal: get the billing code onto production and prove it works **in test mode
on prod**, before any live key exists. Live-mode provisioning is a separate,
later step and is deliberately not in this plan.

Everything below was measured against the live host on 2026-07-20, not assumed.

---

## 1. Where production actually is

| | |
|---|---|
| Prod | `app.buildrick.io`, SSH `vortyoyz`, app root `~/apps/dashboard` |
| BUILD_ID | `lfIX2p5LNQr6xAPv14rTC`, built 2026-07-19 20:15 PKT |
| Env | 28 / 34 checks pass — the 6 failures are exactly the `STRIPE_*` vars |
| DB | 41 / 41 migrations applied, 0 failed |

The build stops **immediately before** the Stripe work. Verified by marker
grep against the deployed bundle:

| Marker | From | In prod build |
|---|---|---|
| `Workspace name, branding, and defaults` | `c00e77df` (20:12) | present |
| `createCheckoutSession` | `4d785032` (22:34) | **absent** |
| `ALREADY_SUBSCRIBED` | `4d785032` | **absent** |
| `handleInvoicePaymentFailed` | `0436c405` | **absent** |

So production still runs the old `upgradePlan()`, which throws unconditionally.
**Setting `STRIPE_*` env vars on prod today would change nothing** — no
deployed code reads them.

## 2. What this deploy actually ships

Six commits are ahead of prod, but only two carry runtime code:

| Commit | Ships? |
|---|---|
| `4d785032` Stripe Checkout + Portal | **yes** |
| `0436c405` webhook payload-drift fixes | **yes** |
| `9ce3ea8a` settings drill-in tests | no — tests are not in the build |
| `d349d6b8` `stripe-setup.ts` | no — `scripts/` is not in the build |
| `3bc07bcb` / `d9f72878` `set-prod-env.mjs` | no — same |

This is a small, well-scoped deploy. It is not the month of dashboard design
work — that is already live.

**No migration.** `git diff c00e77df..HEAD -- prisma/` is empty, and the prod DB
already has every table the code touches (queried with the `@@map` physical
names, not the Prisma model names):

```
subscriptions             exists
invoices                  exists
processed_webhook_events  exists
workspaces.stripeCustomerId  exists
subscriptions rows: 0
```

### User-visible changes

1. **Plan prices change on `/dashboard/settings/plans`.** That page had its own
   hardcoded array — STARTER/FREELANCER/AGENCY at **$0 / $18 / $58**. It now
   renders from `PLAN_LIMITS`: FREE/PRO/BUSINESS at **$0 / $29 / $79**. Anyone
   who saw the old page sees a price rise. This is a correction — Stripe was
   always going to charge the `PLAN_LIMITS` number — but it is a real change of
   published pricing and is worth being deliberate about.
2. **Upgrade starts working.** The button currently errors; after this it opens
   Stripe Checkout.
3. Billing page plan header shows `$29/mo` rather than the raw-cents `$2900/mo`.

## 3. Sequence

### Phase A — build (local)

1. **Stop `next dev` first.** A prod build under a live dev server leaves every
   route 500ing.
2. `rm -rf .next && pnpm build` from `packages/dashboard`.
   - `next build` type-checks `e2e/` too; a stale error there fails the build
     even though the app runs fine. `tsc --noEmit` is currently clean, so this
     should pass — but it is the most common failure point.
   - `.env.production.local` (symlinked in) bakes `NEXT_PUBLIC_APP_URL=
     https://app.buildrick.io`. Confirmed present. Grep `.next/static` after the
     build to verify the baked URL is not `localhost`.
3. **Grafts Next omits from `standalone/`:**
   - `.next/static` → `standalone/packages/dashboard/.next/static`
   - `public` → `standalone/packages/dashboard/public`
   - `node_modules/.pnpm/openai@*/node_modules/openai` → `standalone/node_modules/openai`
     (with `serverExternalPackages:["openai"]` the tracer copies **zero** openai
     files; AI drafting dies without this)
4. **Smoke locally:** `PORT=3055 node server.js` from
   `standalone/packages/dashboard`, curl `/auth` → 200.

### Phase B — env (before the swap)

Prod needs the six `STRIPE_*` vars, in **test** values for now:

```bash
npm run env:set:prod -- --file stripe-prod-test.env            # dry run
npm run env:set:prod -- --file stripe-prod-test.env --apply
```

The file holds the test secret key, the four test price ids, and the signing
secret of a **new prod webhook endpoint** — created with:

```bash
npm run stripe:setup -- --url https://app.buildrick.io      # test key in env
```

(That endpoint is exactly what was deleted after verification yesterday; it is
correct to create it now, because now something on prod will answer it.)

Env before code is the safe order: the new code fails *cleanly* without these
vars (`PAYMENTS_NOT_CONFIGURED` → tRPC `PRECONDITION_FAILED`), and the old code
ignores them entirely. Neither order can break the running site — but this way
there is no window where billing is deployed and unconfigured.

> `STRIPE_*` are **not** `NEXT_PUBLIC_*`, so they are read at runtime. Swapping
> test keys for live keys later needs an env change and a restart — **no
> rebuild**.

### Phase C — swap

5. `rsync -az --delete --exclude='.env*' packages/dashboard/.next/standalone/ vortyoyz:apps/dashboard-new/`
   then verify the staged BUILD_ID, `static/`, and `node_modules/openai`.
6. `mv ~/apps/dashboard ~/apps/dashboard.old-$TS && mv ~/apps/dashboard-new ~/apps/dashboard`
7. **`kill -9` the old next-server, filtered by `/proc/PID/cwd`** — match
   `*dashboard*`, never `*ranklur*` (the same cPanel user runs an unrelated app).
   - Plain `kill` is not enough: on 2026-07-18 the process survived SIGTERM, its
     cwd having followed the `mv`, lsnode never respawned, and prod returned
     `000` for ~2 minutes. Verify with `kill -0 <pid>` that it is actually gone.
8. `curl https://app.buildrick.io/auth` to make lsnode respawn. Keep curling
   until 200 — a sweep can kill a freshly spawned good worker, which is fine.

### Phase D — verify on prod

9. New next-server's `/proc/$p/cwd/.next/BUILD_ID` == the new build; old PID
   gone; **ranklur PID still alive**.
10. `npm run env:check:prod` → 34 / 34.
11. `/dashboard/settings/plans` shows $0 / $29 / $79.
12. **The real test:** subscribe on prod with card `4242 4242 4242 4242`, then
    confirm in the DB that `workspaces.plan` flipped to `PRO`, a `subscriptions`
    row is ACTIVE, and an `invoices` row exists.

Do not skip 12. It is the only step that tests the thing local testing could
not — see below.

## 4. The risk this plan exists to retire

`app/api/webhooks/stripe/route.ts` verifies Stripe's signature by taking
**HMAC-SHA256 over the raw request body**. Yesterday's verification POSTed
straight to `localhost:3000` — nothing sat in between.

Production sits behind **LiteSpeed**. If that proxy alters the body at all —
encoding, whitespace, re-chunking — the HMAC will not match, every webhook
returns 400, and **no payment ever reaches ACTIVE even though the customer was
charged**.

This is the exact shape of failure this codebase keeps hitting: works in dev,
silently dead in prod (social login, AI drafting, SMTP `$`-mangling). In test
mode that discovery is free. In live mode it means taking money and delivering
nothing.

Step 12 is what turns that unknown into a known.

## 5. Rollback

Swap the directories back and hard-kill again:

```bash
mv ~/apps/dashboard ~/apps/dashboard-bad-$TS
mv ~/apps/dashboard.old-<TS> ~/apps/dashboard
# kill -9 by cwd, then curl to respawn
```

No migration ran, so there is nothing to unwind in the database. The `STRIPE_*`
env vars can stay — the old build ignores them.

Rollback triggers: `/auth` not 200 after respawn, BUILD_ID mismatch, ranklur
down, or `env:check:prod` regressing below its current 28.

## 6. Deliberately not in this plan

- **Live keys.** Nothing here needs one. Live mode is a decision to make after
  step 12 passes, and it should wait for a customer who actually wants to pay.
- **The PKR question.** Checkout currently presents **PKR 8,380.59** where the
  plans page says **$29** (Stripe adaptive pricing on a PK account). The stored
  invoice is correct at USD 2900, so this is not a data bug — but a customer
  seeing one number on the page and another at checkout is a trust problem, and
  it should be settled before anyone real reaches that screen. Product call:
  turn adaptive pricing off, or show the presentment currency on the page.
- **The uncommitted working tree** (DESIGN.md, `docs/`, `newdeisgn/`,
  `local.log`). Confirmed no app source is dirty, so none of it reaches the
  build. It neither blocks nor rides along.

## 7. Correction — the e2e suite does run locally

Earlier notes on this work (and the commit messages for `0436c405` and
`a341ca59`) say Playwright was not run because "this repo defines only
BrowserStack projects, which are remote and billable". **That is wrong.**

`playwright.config.ts:13` gates the project list on
`BROWSERSTACK_USERNAME && BROWSERSTACK_ACCESS_KEY`. Both are in `.env.local`,
which Playwright loads, so `isBS` is always true and the local `chromium` /
`chromium-onboarding` projects are swapped out. Unset them and the local suite
is right there, free:

```bash
BROWSERSTACK_USERNAME= BROWSERSTACK_ACCESS_KEY= npx playwright test
```

Run that way it is 109 tests. As of 2026-07-20 it does **not** pass: 26 onboarding
tests pass, `auth.setup.ts` fails, and the 81 tests that depend on it are skipped
— a shared QA user between two fixtures with opposite state requirements. Details
and the two ways to unblock it are in
`docs/reviews/qa-auth-onboarding-dashboard-20260720.md`.

Consequence for this plan: **the dashboard-side e2e coverage is currently
unverified**, and Phase D's manual checks are carrying more weight than they
should. Fixing the fixture before deploying would make Phase D much stronger.
