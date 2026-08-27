# Dashboard walk — every screen, every job

2026-08-27. Answers the founder's ask: *"walkthrough the whole dashboard, every
screen and every job we have on the screens, and fix all the bugs, broken flows,
bottlenecks and gaps"* — plus *"make sure we have everything in the Figma, and
update the Figma file if we have any mismatch"*.

Walked live in a real browser against the dev server. Not a probe render, not
the JSX, not a unit suite — all three have gone green over a broken feature in
this repo before.

## What was covered

| Surface | Routes | How |
|---|---|---|
| Dashboard (home, sites, media, agency, settings, site detail) | 43 | authenticated walk + interactive |
| Auth | 33 | walked twice — signed in AND signed out |
| Onboarding + templates + help | 16 | authenticated walk |
| Public token routes (`/review`, `/share`, `/transfer`) | 7 | signed out, valid AND bogus tokens |
| **Total distinct routes** | **99** | |

On top of the page walks: ~50 interactive jobs clicked (every primary button,
modal and form), a contrast sweep over 14 routes, and a **role sweep** running
the same screens as a DESIGNER and as the OWNER.

## What was fixed — 12 commits, each verified in the running app

**Money path**

1. **A monthly subscription that billed itself as yearly.** `PlanCard` priced
   every plan with `interval === "MONTHLY" ? "/mo" : "/yr"` — a ternary that
   fails OPEN on a money figure. `Subscription.interval` is an unconstrained
   String and Stripe's own word for the same idea is `"month"`, so a row holding
   Stripe's spelling rendered a $79/month plan as **"$79/yr"**. The customer was
   told they pay twelve times less than they do, on the one screen that exists
   to answer that question.
2. **Stripe's internal prose reaching the customer.** `translateBillingError`
   was written so the money mutations "cannot drift apart"; checkout and portal
   were never wired to it and ended in a bare `throw e`. A dead customer id
   toasted `Couldn't open billing portal — No such customer: 'cus_audit_seed'`,
   as a 500 — which tRPC's retry list treats as retryable.
3. **The unlimited plan that had run out of credits.** `-1` is the unlimited
   sentinel; the site-generation block read it as a number, so BUSINESS — the
   plan whose billing page advertises "Unlimited AI generations" — showed
   "0 remaining this month", "0/-1 credits used", and a **Generate New Site link
   greyed out with `pointer-events: none`**. The plan's headline feature was
   unreachable from the screen that runs it.

**The biggest one**

4. **Every primary button was white text on nothing.** flowbite-react reads its
   class prefix from a module singleton at render time. The module that sets it
   has no `"use client"` and is imported by a Server Component, so it only ever
   ran on the SERVER. Everything flowbite rendered in the browser emitted
   UNPREFIXED classes, which this package's Tailwind never compiles.

   `bg-blue-700 text-white` landed on every primary Button: `text-white` had a
   rule (dashboard code writes it), `bg-blue-700` had none (only flowbite does).
   **Contrast ratio 1.0.** Measured **23 controls across 14 routes** — "New site"
   (the main action on the Sites screen), "Upload", "Save changes", "Add client",
   "I want to delete my account", and the cookie banner's "Accept All" on every
   page in the app. Status pills, filter chips and checkboxes were unstyled for
   the same reason.

   `flowbite-react build` names this failure in its own output. The fix is the
   CLI-generated `<ThemeInit />`, which had been generated and never rendered.
   **23 → 0**, and the buttons now compute `rgb(26,86,219)` — `#1A56DB`, the
   DESIGN.md accent exactly.

**Permission boundaries — a class, not a one-off**

5. Running the dashboard as a DESIGNER found **8 of 10 admin/owner-gated
   controls offered anyway**. The server refused every one; the screens asked
   last instead of first. Worst cases: **"Delete workspace"** walked a Designer
   through the modal listing everything that would be destroyed and made them
   type the workspace name before answering 403; **"Connect"** on Integrations
   was a full `window.location` navigation to an ADMIN-only endpoint, so a
   non-admin landed **on a raw JSON 403** with no nav and no back link.
   Gated Delete workspace, Change plan, Cancel subscription, New token,
   Add client, Install/Configure and Connect on the role the server checks.
6. **A permission denial that arrived as a 500.** Sixteen routers call
   `checkWorkspaceRole`; fifteen translate its `PermissionError`. `account.ts`
   did not, across all four of its ADMIN mutations — so a denial came back as
   INTERNAL_SERVER_ERROR and the client retried it.

**Silent failures**

7. **Three security controls that failed in total silence.** The Security tab
   has one `error` state and two render sites for it, both inside conditionally
   mounted blocks. Enabling 2FA, removing a session and signing out everywhere
   all write into it while neither is mounted. Forced the failure with a route
   intercept: **text delta 0, zero toasts, the message nowhere in the DOM.**
   Also gave `twoFactor.enable`/`.confirm` the error mapping their sibling
   `.disable` already had.

**Gaps**

8. **Folders you could create but never file anything into.** The dashboard
   Media library creates, renames and deletes folders, and had no way to put an
   existing asset in one — uploads land in whatever folder you are viewing, so
   anything added from "All media" was stuck there. `media.moveAsset` already
   existed and the *editor's* media tab has been calling it all along. Only the
   screen where folders are created lacked the door.

## Figma — the ACTIVE file

Read back from the file itself, never from the inventory alone.

**Route coverage is complete.** Every `/dashboard` route on disk has a board,
and no board points at a route that no longer exists.

What was actually wrong was bookkeeping, and one real gap:

- **Four captured boards had no inventory row** (BL-0226/0227 review states,
  BL-0228/0229 dashboard at-limit). Page `0:1` held 48 top-level frames; the
  inventory recorded 38. Registered, each identified by copy only that state
  renders rather than by arrival order.
- **Three rows pointed at the wrong page** — `figmaPageId: "75:2"` while their
  own notes said "placed on the Dashboard page (0:1)", and Figma agreed with
  the notes.
- **BL-0181 was marked `blocked` on a capture that had landed.** It is node
  384:2, reading "Good evening, Viewer" / "Site limit reached (3/3)". A reported
  submit failure is not evidence that nothing arrived.
- **Two states were genuinely missing, and both blockReasons were wrong.**
  BL-0154 (team invite modal) blamed a dying submit; `figma-capture-live` checks
  its sentinel BEFORE replaying actions, so passing the modal's own heading as
  the sentinel can never pass. BL-0157 (delete-account flow) was not a harness
  problem at all — that button is disabled for a sole workspace OWNER, which is
  the only session the capture ever used. Captured both (from a DESIGNER session
  for the second), verified by reading their text back, filed on Modals+States.
- **Two anonymous "Buildrick" frames** on the Dashboard page were old editor
  captures — every html-to-design capture lands on the file's FIRST page named
  after the captured element. Named and recorded as BL-0307/0308, renamed in
  place rather than re-paged: the editor baseline is another lane's.

## Six findings that were the harness, not the product

Recorded because each one read exactly like a bug:

| Read as | Actually |
|---|---|
| Integrations page renders an empty body | 3.5s snapshot caught the loading skeleton |
| "Enable 2FA" does nothing | the mutation takes ~4s; the probe waited 2.5s |
| "Browse templates" is a dead link | dev route compile exceeded the poll window |
| `/onboarding` is a blank page | it redirects at ~3s; walker settled at 5.5s |
| Transfer / Team Select do nothing | native HTML5 validation; Select reveals 4 checkboxes |
| 23 buttons still broken after the fix | the sweep could not parse `lab()` colors |

The last one is the sharpest: the fix was already working and the measurement
said otherwise. A null result is the harness until proven otherwise.

## Not fixed, and why

- **`npx flowbite-react build` corrupts `tw-flowbite.css`.** It injects an
  `@import` *inside a block comment* and deletes the real `@plugin` directive.
  Reverted; the button fix was re-verified without it. Do not run that CLI
  without reading its diff.
- **Six procedures have no door**: `team.auditLog` (audit rows are written and
  no screen reads them), `templates.cloneFromSite`, `dashboard.quickActions`,
  `dashboard.recentSites`, `ai.getQuotaStatus`, `cms.dynamicPages`. Each is a
  feature decision, not a bug — listed so they are decided rather than forgotten.
- **`/dashboard/settings/domains` is read-only by design** — every row links to
  the site's own Domains tab, which is where the actions live.
- **Marketplace "Set up in Integrations"** is a link, not a mutation, so it
  stays open to everyone; the page it leads to is gated.

## Suite

103 test files, 681 tests, green — before and after. Five regression tests added
(plan-card intervals, AI unlimited, billing error translation, and the flowbite
client-half wiring).

Two of the new guards were **watched to fail** before being trusted: restoring
`throw e` on the portal mutation fails 7 of its 10 cases, and deleting
`<ThemeInit />` fails the wiring check. The second only failed after being fixed
— its first version matched the words "<ThemeInit />" inside the comment
explaining it, and passed with the real element deleted.
