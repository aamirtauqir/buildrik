# QA report — auth · onboarding · dashboard (local, 2026-07-20)

Report only. Nothing was fixed.

Target `http://localhost:3000` (dev server, test-mode Stripe). Branch `main`.
Method: the repo's own Playwright suite, run against local Chromium.

## Result

| Area | Verified | Evidence |
|---|---|---|
| Onboarding | **yes — 26 / 26** | all three paths (AI, template, blank), plus the three full walkthroughs |
| Auth | **partly** | magic-link login works; the fixture never reaches `/dashboard` |
| Dashboard | **no** | 81 tests never ran |
| a11y / link-integrity / responsive / settings-drill-in | **no** | same 81 |

`26 passed · 1 failed · 81 did not run (3.0m)`

So: onboarding is proven. **Dashboard is not proven — it is unverified, which is
not the same as broken.** Nothing here says the dashboard is failing; it says
nobody has looked.

## Finding 1 — the e2e suite has been running in the cloud, not locally

`playwright.config.ts:13`

```ts
const isBS = !!(process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY);
```

Both of those live in `.env.local`, and Playwright loads `.env.local`. So `isBS`
is always true here, and the config swaps the local `chromium` /
`chromium-onboarding` projects out for three BrowserStack projects. `npx
playwright test` locally therefore targets the paid cloud grid, and
`--project=chromium` reports "not found".

Unset the two vars and the local projects come back — 109 tests, no BrowserStack:

```bash
BROWSERSTACK_USERNAME= BROWSERSTACK_ACCESS_KEY= npx playwright test
```

This is the reason the next finding has gone unnoticed: the cheap local run
that would have surfaced it was never the one being executed.

## Finding 2 — two fixtures share one QA user and want opposite state

Both setup projects default to the **same** account:

- `e2e/auth.setup.ts:10` — `PW_USER_EMAIL ?? "qa@buildrik.local"`, and asserts the
  post-login redirect lands on `/dashboard`, i.e. the user must be onboarded.
- `e2e/onboarding.setup.ts:9` — `PW_ONB_EMAIL ?? "qa@buildrik.local"`, and
  **resets** that user's `OnboardingState` to `completed:false, step:ROLE_SELECT`
  so the wizard shows.

Nothing restores it afterwards. Current DB state for `qa@buildrik.local`:

```
OnboardingState: { completed: false, dismissed: false, step: 'ROLE_SELECT' }
```

`auth.setup.ts` then cannot pass, and because `chromium` declares
`dependencies: ["setup"]`, every dashboard-side test is skipped.

**It is not a within-run race.** First run (both setups) failed at
`/onboarding/workspace`. Second run, with `setup-onboarding` excluded entirely,
still failed — at `/onboarding/ready`. The pollution outlives the run that
caused it, so excluding the onboarding fixture does not recover it.

Failure signature:

```
auth.setup.ts:33 page.waitForURL(/\/dashboard/) — timeout 60000ms
  navigated to /auth/callback?token=...
  navigated to /auth/redirect
  navigated to /onboarding/ready
```

Screenshot: `test-results/auth.setup.ts-authenticate-via-magic-link-setup/test-failed-1.png`

### What this is and is not

This is a **test-fixture** defect, not a product defect on the evidence so far.
Auth itself works — the token is accepted, the session is created, the redirect
chain runs. Sending a not-yet-onboarded user to the wizard is correct product
behaviour.

**Open question, not yet answered:** the redirect landed on `/onboarding/ready`
while the DB row said `step: ROLE_SELECT`, so the destination is computed by
`useOnboardingFlow`, not read from that column. Whether a real user who finishes
the wizard gets `completed: true` written — and therefore is not sent back into
onboarding on their next login — was **not** tested here. If that write is
missing, it is a genuine product bug and a bad one. It needs a user-level check:
complete onboarding as a fresh user, sign out, sign in, see where you land.

## How to get full coverage

Two ways to unblock the 81, in preference order:

1. **Give the two fixtures separate users.** `PW_ONB_EMAIL` already exists as an
   override — point it at a second seeded account so the onboarding fixture stops
   trampling the auth one. This is the durable fix.
2. **Restore the QA user's state**, then run with BrowserStack unset. Fastest way
   to a green run today, but the next onboarding run breaks it again.

Then:

```bash
BROWSERSTACK_USERNAME= BROWSERSTACK_ACCESS_KEY= npx playwright test
```

## Not covered by this report

- **Production.** Everything above is localhost. Prod runs a pre-Stripe build and
  was deliberately left untouched.
- **Billing/Stripe.** Verified separately and end-to-end in test mode earlier
  today (checkout → webhook → plan flip → invoice); it is not part of this suite.
- **Manual browser sweep.** This report is the automated suite only. A
  click-through pass over the dashboard would add visual/UX findings the suite
  cannot see.
