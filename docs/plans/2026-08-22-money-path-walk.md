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

---

## 8. Walk log — what was found and what was left (2026-08-22)

Every row below was measured in code or by running it, not read off a document.

### Fixed on the chain

| Link | Defect | Commit |
|---|---|---|
| 5→8 | A published Form block posted nowhere and shipped its markup as escaped text — the first reading was my own harness (`createElement` with raw content is not how blocks are inserted); the real path parses it into an element tree and exports correctly | probe only, no fix needed |
| 8 | A missing `NEXT_PUBLIC_APP_URL` skipped form wiring, then fed the empty result to a `notIn` sweep, deactivating **every** form on the site while reporting success | `a7f5a2fd` |
| 4 | The invited checklist had no door — `variant` was never passed by any caller, so every invited member got the owner list | `b6170b5c` |
| 4 | `completeStep` advanced from the step the *caller named*, so one call could finish all of onboarding and permanently hide the checklist | `514a1d84` |
| 9 | Two of three site-limit doors (duplicate, apply-template) named the limit and offered no way past it | `01010146` |
| 9 | The upgrade button was shown to editors, who are refused at checkout by `requireOwner`; plus health's storage sum counted media on soft-deleted sites | `de4eb01a` |
| 6-7 | Expired and superseded review links told the client the link was mistyped and to click it again — two of four dead-link screens were unreachable, and the reason travelled as a bare string the errorFormatter shredded into character indices | `201d7885` |
| 1-2 | A failed verification email was invisible to everyone: empty catch, a router that answered "Verification email sent" regardless, and a screen telling the user to check an inbox nothing reached | `ce3b97a3` |
| 6 | A draft share link built with no configured origin was a bare `/share/<token>` — not a link once pasted. Trailing-slash double-slash found by the test | `dc842554` |
| 5 | **A save carrying no pages deleted every page on the site and returned `{success: true}`.** `[].every(...)` is true, so an empty list read as a complete snapshot of an empty site. Proved by running it: `page.deleteMany({id:{in:["p_1","p_2"]}})` | `6cae115c` |

### One correction to the record

`6cae115c`'s message says "there is no client-side guard either — BuildrikSyncProvider
has no page-count check". The second half is true and the first half is not: the
editor refuses to save a siteId that is not in `_loadedSites`
(`BuildrikSyncProvider.ts:346`, `ProjectNotLoadedError`, added in `1ebb1a71` after
the 2026-08-19 wipe). I grepped for a page-count check and concluded no guard
existed — the same mistake as grepping one syntactic form and missing the other.

The server-side guard is still the right fix and still needed: the editor guard
protects the editor's own path, while the delete is issued at a boundary any
caller can reach. Two guards, different scopes. But the commit overstates what
was missing.

### Recorded, not fixed

- **Nothing gates on `User.emailVerified`.** `login()` never reads it and no
  middleware checks it; the only `emailVerified` logic in `auth.config.ts` is the
  OAuth provider's own flag. A credentials user who never verifies can use the
  product fully, so the verification flow currently gates nothing. Changing that
  is a founder decision — a hard gate would lock out every unverified account
  that already exists.

- **The checklist is self-report.** Ticking "Publish your site" marks it done; nothing observes a publish. Fine as a design, but `onboarding_completed` derived from it would not mean what §15 wants it to mean. Decide before wiring that event.
- **`components/billing/limit-reached.tsx` has zero consumers.** It is role-aware and shows usage — better than the inline block it lost to — but wiring it is a visual change with no board, and it hard-codes `$29/mo` where `plan-limits.ts` is the SSOT.
- **Published forms emit no `_honeypot` field.** The endpoint reads one; the export never writes one. Spam defence is rate-limiting alone.
- **`saveWizard` / `completeWizard` / `dismiss` call `update` on a row that may not exist**, giving a 500 rather than a clean error. Reachable only if a client skips `getState`, which nothing currently does.
- **Onboarding can create a second site** if the wizard restarts after S2. FREE allows 3, so nobody is trapped today.

### Walked and found sound

- **Review round lifecycle.** One PENDING row behind a partial unique index, a
  P2002 loser that converges on the winner instead of erroring, revocation
  guarded on both `revokedAt: null` and the revision the editor last saw, and a
  token rotation that only fires when a client is actually being invited. The
  90-day TTL in `client-review.service.ts` matches the 90 days the expiry screen
  promises. Comments are never deleted, so "your earlier comments are still
  saved" is true.
- **The public form endpoint** accepts urlencoded as well as JSON, redirects a
  browser back with `?submitted=1`, and validates before storing.

### Still needs the founder — unchanged

1. **SMTP** — links 1 and 6 send real mail from `info@buildrick.io`.
2. **A Stripe test-mode subscription** — `handleCheckoutCompleted` calls a real `subscriptions.retrieve`.
3. **PostHog** — no analytics SDK in the repo; `NEXT_PUBLIC_POSTHOG_KEY` is baked at build.

---

## 9. Figma baseline — what this arc put into the file (2026-08-22)

File `Micuc1rmLcFhjxF1A08Kk2`. The MCP tools were not registered in this
session; the keychain-token route in
`reference_figma_mcp_session_registry_gap` reached all 32 of them.

Every fix in §8 that changes something a person sees is now a frame, each one
read back after writing — by screenshot where the copy is the point.

| Frame | State | Why it did not exist before |
|---|---|---|
| BL-0225 | `/auth/verify-email` send-failed | `signup` only started reporting the failure in `ce3b97a3`; the page claimed the mail was sent either way |
| BL-0226 | `/review/:token` expired | `201d7885` — the copy map was keyed on the tRPC code and both reasons map to one FORBIDDEN, so this screen could not render |
| BL-0227 | `/review/:token` superseded | same |
| BL-0228 | create-site at 3/3, owner | the owner half of `de4eb01a` |
| BL-0229 | create-site at 3/3, non-owner **+ checklist 0/3** | the non-owner half of `de4eb01a`, and `b6170b5c` — the 3-item invited checklist had no caller |
| BL-0106, BL-0110, BL-0126–BL-0129 | publish dropdown, review pill, four inspector states | not new, just stale: they were still an 08-19 prod render |

### What the harness was doing wrong

`figma-capture-live.mjs` raced a promise that never settles against a 45s timer
and resolved `{ submitted: true }` from the timer. A submit that died on the
network printed success and nothing landed. The submit's own HTTP status is the
signal now.

Then the correction: **a reported failure is not proof of nothing landing.**
Four runs reported `ERR_NETWORK_CHANGED` and every one of them arrived — the
POST completed server-side and only the response was lost. Retrying on that
signal left five duplicate frames, which had to be deleted. Read the page back
and count.

`BK_STATE` picks the session, because BL-0228 and BL-0229 are the same screen
and differ only by who is looking.

### Editor page — final

| | before | after |
|---|---|---|
| BL frames on the page | 71 | 98 |
| states with a current capture | 19 | **48** |
| held as UNVERIFIED (captured, state not proven) | — | 9 |
| genuinely stale editor states | 37 | **0** |

The three frames that still read as stale are Site health, Activity log and
Share preview link — doors that open a new tab, so an editor frame was never the
right surface for them. Their names say so now.

Both of those are now captured. The blur-trap diagnosis above was wrong:
BL-0168's recipe worked the whole time — the harness's own PRE-CAPTURE line
shows the menu open — and I had judged the frame against menu items I invented
("Bring forward"), then deleted a good capture. BL-0160 failed for a precise
reason: "Icons and SVG" is an aria-label on a pill whose visible text is "svg0",
so a `text=` selector for it matches nothing; the picker opens from the plain
"Icons" button.

Five canvas-overlay frames were relabelled rather than re-captured — this page's
own earlier note records them as 2026-08-22 captures, so the label now says that
and says whose claim it is.

### Still out

- **Five site-menu doors have no frame at all** — Publish panel, Site health,
  Activity log, Open client view, Share preview link. Found by driving the real
  menu, which prints sixteen rows against the board's ten. Recipes exist
  (BL-0230–BL-0234); captures do not.
- **BL-0120 baselines the wrong surface.** "Invite teammates" opens the
  dashboard in a new tab, so the editor frame shows an unchanged editor. The
  frame name now says so.
- **Media list view cannot differ from grid view** until the library has an
  asset. Both render the same empty state.
- ~~Sixteen editor states have no recipe~~ — closed. Every state in
  `screens-editor.json` now has one, derived by driving the panels and reading
  their controls rather than guessing selectors.
- The editor page's own note still records drift measured against the 08-19
  cluster. It is accurate for the frames that remain stale.
