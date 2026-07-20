# QA report — auth · onboarding · dashboard (local, 2026-07-20)

Report only. Nothing was fixed.

Target `http://localhost:3000` (dev server, test-mode Stripe). Branch `main`.
Method: the repo's own Playwright suite, run against local Chromium.

## Result

| Area | Verified | Evidence |
|---|---|---|
| Onboarding | **yes — 26 / 26** | all three paths (AI, template, blank), plus the three full walkthroughs |
| Auth | **yes** | suite fixture fails, but a manual browser walkthrough proves login + redirect are correct (see below) |
| Dashboard | **yes — 79 / 82** | 6 destinations, nav, links, a11y, responsive, settings drill-in; 3 failures, both page-title drift |
| a11y / link-integrity / responsive / settings-drill-in | **yes** | 71 of the 79; all green |

First run: `26 passed · 1 failed · 81 did not run (3.0m)`. After the fixture
unblocked: `79 passed · 3 failed (4.3m)` on the dashboard side.

All three areas are now proven. The first run could only prove onboarding —
Findings 1 and 2 below are why, and they are worth reading even though the
coverage gap they caused is closed, because both will recur.

Nothing found breaks functionality. The two real defects are page titles.

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

Nothing restores it afterwards. DB state for `qa@buildrik.local` at the time of
the first run:

```
OnboardingState: { completed: false, dismissed: false, step: 'ROLE_SELECT' }
```

`auth.setup.ts` then cannot pass, and because `chromium` declares
`dependencies: ["setup"]`, every dashboard-side test is skipped.

The user is currently at `step: CHECKLIST` — nudged there by the manual
walkthrough below, not by a fix — which is why the second run got through. **The
next `onboarding.setup.ts` run puts it back to `ROLE_SELECT` and re-breaks the
81.** This is unresolved.

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

### Open question — now answered, in the browser

The concern was: the wizard never writes `completed: true`, so a real user who
finishes onboarding gets dumped back into it on their next login. That would be
a bad product bug.

**It is not happening.** Walked it as a user against local dev:

| Step | Observed |
|---|---|
| Sign in (`completed:false, step:ROLE_SELECT`) | lands `/onboarding/ready` |
| Click **Open Editor** (the wizard's final CTA) | `step` → `CHECKLIST`; `completed` stays `false` |
| Sign in again, fresh magic link | lands **`/dashboard`** |

So `completed` is a red herring — it is **not** what gates the redirect. `step`
is. `CHECKLIST` reads as "past the wizard" and routes to the dashboard;
`ROLE_SELECT` reads as "still in it" and routes to the wizard. A real user is
never sent backwards.

**Correction (2026-07-20, later):** calling `completed` a red herring was half
right and the reason given was wrong. It is not vestigial — it means "finished
all of onboarding", not "finished the wizard". `completeWizard()` leaves it
false on purpose so `dashboard/page.tsx:35` keeps showing the dashboard
checklist; `completeDashboardTask` flips `step: COMPLETED` and `completed: true`
once the last of the 7 required tasks lands. Walked the lifecycle end to end:
after the wizard the checklist shows, after all 7 tasks it hides. The one place
gating on the flag uses it correctly, so the worry recorded here — that future
code gating on `completed` alone would misbehave — does not hold.

This also closes the loop on Finding 2: `onboarding.setup.ts` sets
`step: "ROLE_SELECT"`, and the login redirect then does exactly what it should —
send that user into the wizard. The fixture is not fighting a bug; it is getting
the behaviour it asked for, on a user another fixture also depends on.

**Conclusion: no product defect in auth or onboarding on this evidence.** The
failure is entirely test-fixture ownership.

## Dashboard — now actually tested

The blocker cleared itself. Walking onboarding in the browser (above) left
`qa@buildrik.local` at `step: CHECKLIST`, which is what `auth.setup.ts` needs, so
the fixture passed and the 81 ran.

`79 passed · 3 failed (4.3m)`

What the 79 cover:

| Spec | Tests | What it proves |
|---|---|---|
| `responsive-audit` | 33 | 11 routes × desktop 1440 / tablet 820 / mobile 390 — no horizontal overflow anywhere |
| `a11y-states-audit` | 23 | keyboard focus reaches a control and shows a visible ring on all 11 routes; no disabled control is a tab stop; focus-ring token resolves to the design accent |
| `settings-drill-in` | 14 | all 13 sub-pages title themselves correctly and offer a way back; directory shows no tab rail |
| `dashboard` | 9 | the 6 destinations render with persistent nav; brand + account pill; sidebar navigation |
| `link-integrity` | 1 | every internal link on the designed screens resolves to a real route |

Console on the pages walked manually: **0 errors, 0 warnings.**

### The 3 failures are both the same kind: page title drift

**1. Settings index is titled as if it were one of its own children.** (2 of the 3
failures — `dashboard.spec.ts:16` and `:31`.)

`app/dashboard/settings/layout.tsx:20`

```tsx
<PageHeader title="General settings" description="Workspace name, branding, and defaults." />
```

That is the fallback branch — the one that renders when no section matches, i.e.
**the index**. Confirmed in the browser: `/dashboard/settings` shows 6 groups and
~16 section cards under an `h1` reading "General settings", described as
"Workspace name, branding, and defaults."

That description belongs to the **Workspace & branding** card, which is a link on
that very page. The header describes one of its own children.

The file's own comment (lines 9–12) says the index "is the design's directory of
section cards" and that a sub-page is titled with the section you opened "not a
generic Settings". The code then titles the directory with a section name. It
contradicts its own stated intent.

**Judgment: the app is wrong and `dashboard.spec.ts` is right.** A directory of
sections should read "Settings". Worth a second opinion — this is a naming call,
not a crash — but nothing supports the current string.

Note `settings-drill-in.spec.ts` passes 14/14, including
`/dashboard/settings/workspace titles itself "Workspace & branding"`. So the
sub-pages are correct; only the index is not, and no spec owns that string except
the two failing ones.

**2. Media page title vs nav label.** `dashboard.spec.ts` expects `/^Media$/i`;
`components/media/media-library.tsx:163` renders `title="Media library"`. The
sidebar says "Media". Cosmetic, low severity, but it is a real inconsistency
between what the nav calls the destination and what the destination calls itself.
Pick one.

### Severity

| # | Issue | Severity |
|---|---|---|
| 1 | Settings index titled "General settings" + a child's description | **Medium** — every user who opens Settings sees a page mislabelled as a different page |
| 2 | "Media" (nav) vs "Media library" (h1) | **Low** — cosmetic |

Neither breaks functionality. No crashes, no console errors, no broken links, no
overflow, no focus-ring regressions.

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
