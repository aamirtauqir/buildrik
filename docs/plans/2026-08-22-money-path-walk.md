# Money-path walk — one unbroken chain, fixed where it breaks

**Written** 2026-08-22 · branch `main` · HEAD `bd7c161e`
**Supersedes** `2026-08-22-prd-walk-and-fix.md` (register-first; rejected 6/6 by
both review voices, and by three of the primary's own probes — see that file's
`## GSTACK REVIEW REPORT`).
**Founder decision** at the autoplan premise gate: option A, money-path first.

---

## 1. The chain

One user, one unbroken sequence. Every link is a real action in the running
product, not a code reading:

```
  1 sign up            →  unverified user + workspace + onboarding state exist
  2 verify email       →  token consumed, account usable
  3 log in             →  /auth/redirect routes on (may stop at workspace-select)
  4 onboard            →  wizard → first site created → EDITOR OPENS → checklist
  5 build              →  edit a page in the editor, changes persist
  6 send for review    →  /review/<token> opens for someone who is not the owner
  7 client approves    →  resolved through clientReview.resolve, publish gate honours it
  8 publish            →  editor-originated deploy, live URL serves the built site
  9 hit the site limit →  upgrade offered
 10 pay                →  Stripe Checkout → verified webhook → plan ACTIVE
```

Links 2, 3 and the editor-open half of 4 were missing from the first draft of
this chain; the eng review found them in code. `signup` only creates an
UNVERIFIED user and emails a token (`auth.service.ts:152`), and onboarding does
not end at site creation — the wizard flips to the checklist when the user
reaches the editor (`use-onboarding-flow.ts:18`, `onboarding.service.ts:76`).
Link 9 is the site limit specifically (`sites.ts:73`, `dashboard.ts:96`); that is
the only concrete quota on the spine that offers an upgrade.

**The rule: walk link N, and fix whatever stops link N, before walking N+1.**
No link is "verified" on a code reading. Verified means the action was taken in
the running app and the result was observed.

This is still a whole-codebase walk against the PRD — auth, onboarding,
editor, engine, publish, billing, review, media all sit on this chain. It is
ordered by the money path instead of by register id, because the registers
turned out not to be a backlog (§4).

## 2. What is already known to be broken on the chain

Probed today, not inherited from a document:

| Link | Finding | Evidence |
|---|---|---|
| 8 | **Nobody can pay.** Production has zero Stripe env vars. `getStripe()` throws `PAYMENTS_NOT_CONFIGURED`; the webhook route 500s on every delivery, so no plan ever reaches ACTIVE. | `pnpm run env:check:prod` against the live cPanel env: 36 checks, 30 pass, 6 fail — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, all four Price ids |
| 1 | **2FA backup codes come from `Math.random()`.** Ten codes, one non-CSPRNG stream, and they bypass TOTP entirely. The repo already learned this once: `auth.service.ts:71` says "CSPRNG suffix — Math.random() made the disambiguator guessable". | `server/services/account.service.ts:336-339` |
| 4-5 | **The client-review loop has never been walked end to end.** The router and the route both exist and nobody has driven them with a real external approver. | `PRODUCT-OVERVIEW.md` §4 ("a founder/pilot step, not something shipped-and-observed"); `server/trpc/routers/client-review.ts`; `packages/dashboard/app/review/[token]/` |
| all | **The funnel is invisible.** `DASHBOARD-PRD-2026-07-06.md` §15 is an approved CEO-reviewed strategy whose first action is "fire ONE event — `signup_completed`". Grep for it, or for any PostHog wiring: zero hits, 6.5 weeks on. | `sidebarAnalytics.ts:4` still reads "Currently logs to console in debug mode" |
| 3 | `contactFormBlockConfig` is exported but never registered, so the block is unreachable from Insert. | `src/blocks/index.ts:93`; absent from `blockRegistry.ts` |

## 3. Order of work

**Link 1 first, because it carries the only live security defect.** Then
straight down the chain. Measurement is not a separate sprint: each link gets
its §15 event as it is walked, so the funnel exists by the time the walk ends.

| # | Link | Fix known now | Event fired |
|---|---|---|---|
| 1-3 | sign up, verify, log in | CSPRNG backup codes | `signup_completed` |
| 4 | onboard → editor opens | — | `onboarding_completed`, `first_site_created` |
| 5 | build | contact-form registration (done, `07dbe5f3`) | — |
| 6-7 | review + approve | walk it; fix what breaks | — |
| 8 | publish | walk it for real (§5) | `first_publish` |
| 9 | site limit | — | `near_limit`, `limit_blocked` |
| 10 | pay | prove test-mode checkout → webhook → ACTIVE first | — |

**Product events only, never visitor tracking.** Publish already injects a
first-party beacon into every deployed page, and the public `track` endpoint is
`Access-Control-Allow-Origin: *`, stores path / referrer / sessionId /
user-agent / country / viewport, and rate-limits on visitor IP — with no consent
gate, opt-out, or DPA path anywhere in it (`publish-html.ts:22`,
`track route.ts:12,44`, `analytics.service.ts:59`). That is a live compliance
exposure this arc did not create and must not extend. The six events below are
authenticated product actions on the owner's own session; nothing here touches
published-site traffic, and the beacon question goes to the founder separately.

Six events is exactly §15 Sprint 1's list. Doing them inline costs a few minutes
per link and closes an approved commitment that has been open since 2026-07-06.

## 4. The registers are demoted, not discarded

`docs/prd/*` §12/§13 registers stay as **hints**, consulted when the walk
reaches their module. They are not the backlog:

- The plan's own table summed to 102, not the 81 it quoted.
- 6 of 8 sampled items were already fixed (`editsRequireApproval` enforced at
  `publish.service.ts:259`; `persistAll` writes all 14 token kinds;
  `fileUploadMaxMB` wired at presign; team router on `resolveWorkspaceId`;
  DEPLOYING written and reaped; upload validates before minting a token).
- 1,362 commits and 2,320 of 4,553 tracked files have changed since the
  registers' HEAD `e5624ca1`, so every `file:line` citation is presumptively dead.

When the walk reaches a module, `git log e5624ca1..HEAD -- <cited path>` answers
"could this still be true" in one command. That is cheap. Reading 102 rows first
is not.

## 5. Publishing, and the line that is not crossed

Link 6 has to be real: a blocked-network publish proves the block works, not
that publishing works, and the 2026-08-21 incident was exactly a case where the
simulated and real paths diverged.

So: publish **one throwaway site** from a scratch workspace to its own
`.vercel.app` URL, on a Vercel connection the founder authorises for this
purpose, and delete it after. Nothing publishes to a customer domain. Nothing
runs with `PUBLISH_ALLOW_SIMULATION` set — that flag permits the fallback, it
does not force it, which is how a "simulation" publish went live before.

Four more conditions, all from the eng review, all in code:

- **Publish from the editor, not the dashboard.** The dashboard route calls
  `sites.publish` with only `siteId`, so no page payload is persisted and the
  worker hard-fails with "Open the site in the editor and publish from there"
  (`publish/page.tsx:42`, `publish-worker route.ts:89`). Publishing there would
  produce a false failure and prove nothing.
- **Scratch workspace with no outbound integrations.** A real publish also fires
  workspace webhooks and owner notifications, records activity, and upserts or
  deactivates `formBlock` rows (`publish-worker route.ts:146,309`).
- **`allowIndexing=false`.** Publish emits `robots.txt` and `sitemap.xml`
  (`publish-files.ts:52`), so the throwaway URL is crawlable by default.
- **Password protection is not a safety rail.** Vercel 402/403/404 responses are
  swallowed as warnings (`publish.service.ts:595`), so a "protected" site can
  deploy unprotected and the job still reads as fine.

Link 8 needs the founder to create live-mode Products in the Stripe dashboard;
that is not a code task. Test-mode Price ids already exist in `.env.local`, so
the checkout → webhook → ACTIVE chain can be proven end to end in test mode
first, and the live switch becomes six env vars.

## 6. Not in scope

- Collaboration. Six known P1 OT bugs is a rewrite; the flag stays off.
- Figma re-capture of the ~30 stale editor states. Capped to the surfaces the
  chain actually touches. Both review voices called the full re-capture work
  with no customer impact for a product no one can buy yet.
- Paid AI generation calls, except one, at link 2, with the founder's explicit
  yes — the chain cannot be walked without generating at least one site.
- The remaining register items, until a walk reaches their module.

## 7. Done-condition

Not "N rows have verdicts". Two of these are events in the running product:

1. A person who is not the founder signs up, gets a site, sends it for review,
   an external approver opens the token link and approves, and the site
   publishes to a live URL that loads.
2. A test-card checkout flips a workspace to ACTIVE through a verified webhook,
   observed in the database.
3. The six §15 funnel events are visible in PostHog.
4. Every fix made along the way has a test that was watched to fail first, and
   anything left undone is named with its reason.
