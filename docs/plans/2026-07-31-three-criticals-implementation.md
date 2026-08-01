# Three Criticals — Implementation Plan

> **For agentic workers:** implement task-by-task in the order given. Steps use checkbox (`- [ ]`) syntax. Every task ends with tests green + a dashboard/server-scoped commit.

**Goal:** Fix the three critical defects found by `/qa` on 2026-07-31, each of which is a *silent* failure — the UI reports success while the real-world effect never happens.

| # | Defect | User-visible lie |
|---|---|---|
| C1 | Dashboard Publish sends no page payload; the worker hard-fails in production and silently simulates in dev | "Published" + a fake URL for a deployment that never happened |
| C2 | `cancelSubscription` never calls Stripe | "Cancels on `<date>`" while the card keeps being charged |
| C3 | Session revocation deletes DB rows that nothing validates | "Revoke session" / password reset claim to end sessions that stay live |

**Branch:** `flowbite-bigbang` (current). **All commits use explicit `packages/dashboard`, `server/`, `prisma/`, `__tests__/` pathspecs** — a parallel session owns `packages/editor` and its tree must not be touched.

**Tech stack:** Next.js 16 App Router, tRPC 11, Prisma 5 + Postgres, NextAuth 5 (`@auth/core` 0.41), Stripe SDK 22.3.2, Vitest, Playwright.

---

## Global Constraints

- **`packages/editor` is OFF LIMITS.** A parallel session is mid-migration there. C1 must not edit, extract from, or refactor that package. Importing its already-published entry points is allowed only if it requires zero edits there.
- **No fix may be verified by mocks alone.** Each task names a real-world verification: Stripe test-mode API for C2, a live browser session for C3, a real job row + worker invocation for C1. The three bugs all shipped green under mocked tests; a mock-only regression test repeats the mistake.
- **Fail closed, but never on the happy path.** C2 and C3 both add a remote/DB dependency to a path that previously had none. Each must define what happens when that dependency is down.
- **No user-visible mass logout.** C3 must not invalidate currently-valid sessions on deploy.
- Existing invariants hold: services own business logic, routers translate domain errors, pages call tRPC only (CLAUDE.md data-flow chain).

---

## Sequencing and why

**C2 → C3 → C1.** C2 is the smallest and has a real external oracle (Stripe test mode) available right now, so it is the fastest complete loop and it proves the "verify against reality" bar for the rest. C3 is medium and self-contained. C1 is the largest by an order of magnitude and carries the `packages/editor` constraint, so it goes last with the most review attention.

---

## C2 — Stripe cancel/reactivate must reach Stripe

### Ground truth (verified)

- `server/services/billing.service.ts:286` `cancelSubscription` and `:312` `reactivateSubscription` write only the local Prisma row. `getStripe()` has exactly 4 call sites repo-wide (`:178`, `:219`, `:255`, `stripe-webhook.service.ts:95`); **no `subscriptions.update` exists anywhere.**
- `Subscription.stripeSubscriptionId` is NOT NULL with a single writer (`stripe-webhook.service.ts:107`, from a real `subscriptions.retrieve`), so rows normally carry a real `sub_…` id. Grandfathered rows are anticipated (`createPortalSession:251` `GRANDFATHERED_NO_PORTAL`) and may hold a placeholder Stripe will 404 on.
- The webhook already reads `cancel_at_period_end` correctly (`stripe-webhook.service.ts:195`) and already reads both drifted shapes correctly (`parent.subscription_details.subscription`; `items.data[N].current_period_*`). **The ingest half is right; the egress half does not exist.** That is why the bug is silent: any later `customer.subscription.updated` writes Stripe's `false` over the local `true`, so the banner disappears with no error.
- Stripe client passes **no `apiVersion`**, so SDK 22.3.2 sends `2026-06-24.dahlia` (not the `2026-01-28.clover` CLAUDE.md names). Both carry the same drifted shapes, so handlers are correct on both — but the mismatch should be recorded.
- `__tests__/billing-service.test.ts:292-342` mocks `getStripe` and **never asserts against it**; the cancel test asserts its own mock's return value. It cannot catch this.
- Test mode is live and reachable — verified this session: `livemode=false`, both products present. Stripe CLI is installed but **not authenticated**, and `stripe listen` mints a different `whsec_` than the stored one, so webhook forwarding requires swapping `STRIPE_WEBHOOK_SECRET` or every event 400s on signature.

### Tasks

- [x] **C2.1 — Map our cancel reasons to Stripe's `cancellation_details.feedback` enum.** Stripe accepts `customer_service | low_quality | missing_features | other | switched_service | too_complex | too_expensive | unused`. Ours live in `packages/shared/schemas/billing.ts:37-44`. Add the map next to the schema (SSOT rule), not inside the service.
- [x] **C2.2 — `cancelSubscription`: Stripe first, DB second, mirror the response.**
  - Call `subscriptions.update(stripeSubscriptionId, { cancel_at_period_end: true, cancellation_details: { feedback, comment } })`.
  - Pass a Stripe `idempotencyKey` so a double-click cannot emit two events.
  - Write the local row **from the response** (`updated.cancel_at_period_end`, period end off `items.data[0]`), never optimistically.
  - **Never write the local flag when the Stripe call throws.**
  - *(Review finding A4)* The reverse order also has a failure case: Stripe succeeds, then the local Prisma write fails. State in a code comment that this is **safe by design** — Stripe emits `customer.subscription.updated`, and `handleSubscriptionUpdated:195` already writes `cancel_at_period_end` authoritatively, so the webhook is the reconciler. This is exactly why the order must be Stripe-first: the inverse (local-first) has no reconciler and is the bug being fixed.
- [x] **C2.3 — Same for `reactivateSubscription`** with `{ cancel_at_period_end: false }`. Do **not** send `cancel_at` — it is a different mechanism on dahlia and mixing them produces a cancel that will not clear. Do **not** use `subscriptions.cancel()`, which terminates immediately and contradicts the UI's "stays active until the end of your billing period".
- [x] **C2.4 — Failure modes, each with an explicit branch and a router translation:**
  - `resource_missing` (grandfathered/bogus id) → domain error surfaced like `GRANDFATHERED_NO_PORTAL`, not a 500, and **no local write**.
  - Stripe network/API error → abort before Prisma, surface a tRPC error the existing toast (`billing/page.tsx:109`) can render.
  - Already in the desired state on Stripe's side → treat as **idempotent success**: reconcile the local row and return. The current `ALREADY_CANCELLED` (`:298`) / `NOT_CANCELLED` (`:321`) guards reflect a possibly-stale mirror and must not block a user whose intent already holds.
  - `billing.reactivate` (`routers/billing.ts:81-85`) has **no error mapping at all** today — add it.
- [x] **C2.5 — Close the two webhook gaps this fix will start exercising for real:**
  - `handleSubscriptionDeleted:209` sets status + workspace plan in **two un-transacted writes** and never calls `reconcileWorkspaceToFreePlan`. Once real cancellations start landing, a Business workspace with 40 published sites drops to FREE with all 40 still live. Wrap in `$transaction` and call the reconcile.
  - Null `cancelReason`/`cancelFeedback` when `cancel_at_period_end` transitions true→false, so a Portal-driven reactivate cannot leave a stale reason.
- [x] **C2.6 — Tests that would have caught this.** In `__tests__/billing-service.test.ts`: assert `subscriptions.update` was called with the right id and args; assert **the DB is not written when the Stripe call rejects**. In `__tests__/stripe-webhook-service.test.ts`: add the first-ever `cancel_at_period_end: true` case, plus the true→false transition clearing the reason.
- [x] **C2.7 — REAL verification against Stripe test mode (not a mock).** Create a test customer + subscription via the SDK, run `cancelSubscription`, then **read the subscription back from Stripe** and assert `cancel_at_period_end === true`. Repeat for reactivate. Tear the fixtures down. Record the output in the commit message. This is the acceptance gate for C2.

---

## C3 — Session revocation must actually invalidate

### Ground truth (verified)

- `session: { strategy: "jwt" }` (`server/auth.config.ts:41`), **no adapter**. `token.sid` is written at `create-session/route.ts:98` and read in exactly one place — `auth.config.ts:168`, a pass-through into `session.user.sessionId`. **Zero DB reads keyed on `sid` anywhere.**
- The `jwt` callback **does run on every `await auth()`** — confirmed in `@auth/core@0.41.0/lib/actions/session.js:28`; and returning `null` there is the supported kill switch (`:55,61` push `sessionStore.clean()`). This is the hook.
- **OAuth logins create no Session row at all** (`prisma.session.create` exists only at `create-session/route.ts:78`), so they have no `sid`, `isCurrent` is always false for them, and "Revoke all other sessions" early-returns (`security-tab.tsx:122`).
- Highest-severity instance: **password reset** (`server/services/auth.service.ts:297`) deletes rows while a stolen cookie keeps full access. `changePassword` (`account.service.ts:9-29`) does not even attempt revocation.
- `User.passwordChangedAt` (`prisma/schema.prisma:35`) is **already migrated and has zero readers or writers repo-wide** — a ready-made hook requiring no migration.
- Precedent already accepted in this codebase: `resolveWorkspaceId` (`server/trpc/workspace-ctx.ts:44-74`) treats a JWT claim as a hint and re-validates against the DB **per request** — which is exactly why "removed from workspace" works while "revoke session" does not. `verifyApiToken` does the same with `revokedAt`.
- Middleware is **edge runtime** (no `export const runtime` anywhere, no `experimental` block) so it cannot use Prisma. It will keep saying "logged in" for a revoked cookie; the enforcement point is `auth()`.
- `sessions` has **no index on `userId`** — every revoke/list is a seq scan.

### Decision: sessionVersion (B) now, per-device `sid` (A) layered

**B first** because it fixes the actual security claims (password reset, revoke-all, member removal), works for OAuth immediately, and — critically — **grandfathers existing tokens so nobody is logged out on deploy**. **A layered on** gives genuine per-device revocation, which is what the per-row Revoke button promises; it requires `sid` to exist on every path, so OAuth must start creating a Session row first. Option C (database strategy + PrismaAdapter) is rejected: it invalidates every cookie, forces a middleware rewrite (edge cannot resolve an opaque id), and requires porting the 5-path `session_grant` flow that exists specifically to keep 2FA off NextAuth's provider surface.

### Tasks

- [x] **C3.1 — Add the version claim.** Use `User.passwordChangedAt`? **No** — it is a timestamp with password semantics and C3 must also cover non-password revocations. Add `User.sessionVersion Int @default(0)` (one defaulted column; the default backfills every existing row to 0, which is what makes C3.3 safe). **Add `@@index([userId])` on `sessions` in this same migration** — five call sites query that table by `userId` (`account.service.ts:132,149,155`, `auth.service.ts:297`, `logout/route.ts:23`) and today every one is a seq scan. *(Review finding A3: the index was originally parked in C3.7, but every one of those call sites runs from C3.5 onward, so it has to land here.)*
- [x] **C3.2 — Bake `sv` into both JWT mint paths:** `create-session/route.ts:92-99` (the 5 non-OAuth paths) and `auth.config.ts:127` (OAuth). Read the user's current `sessionVersion` at mint time.
- [x] **C3.3 — Validate in the `jwt` callback: treat a missing `sv` as `0`, do NOT blanket-grandfather.**
  On each call, compare `token.sv ?? 0` against the user's DB `sessionVersion` and **return `null` on mismatch**.
  *(Review finding A1 — this is a correctness fix to the original plan, which said a token with no `sv` is simply valid.)* Blanket-grandfathering keeps the exact hole we are fixing open for the full 30-day cookie life: a password reset today would still not kill a pre-deploy stolen cookie. Reading a missing claim as `0` is strictly better on both axes:
  - **Nobody is logged out on deploy** — every existing row defaults to `sessionVersion = 0`, so `0 === 0` and old tokens keep working.
  - **The hole closes immediately, not in 30 days** — the first revocation bumps the user to `1`, and the old claim-less token (`0`) no longer matches.

  ```
  token.sv ?? 0   vs   user.sessionVersion
  ─────────────────────────────────────────────────────────────
  pre-deploy token,  no revocation yet →  0 vs 0  → VALID  (no mass logout)
  pre-deploy token,  after a reset     →  0 vs 1  → NULL   (hole closed now)
  post-deploy token, after a reset     →  1 vs 2  → NULL
  DB read throws                       →  fail OPEN (C3.4)
  ```
- [x] **C3.4 — Fail OPEN on a DB error in that callback, not closed.** A Postgres blip must not log out every user on every surface. Log it. (Contrast with C2, where failing closed is correct because money moves.) State this tradeoff explicitly in the code comment — it is a deliberate security/availability call, not an oversight.
- [x] **C3.5 — Bump the version everywhere revocation is claimed:** `resetPassword` (`auth.service.ts:297`), `changePassword` (`account.service.ts:9`), `revokeAllOtherSessions` (`account.service.ts:154`), `revokeMember`/member delete (`team.service.ts:184,210`). Each bump replaces or accompanies the existing `deleteMany`, which stays for the Security-tab display list.
- [x] **C3.6 — Fix the logout route's blast radius.** `app/api/auth/logout/route.ts:23` deletes **all** of the user's rows, so signing out on a laptop erases the phone's row from the Security tab while the phone stays logged in. Delete only the caller's own row (by `sid`).
- [x] **C3.7 — DEFERRED (done: relabelled + recorded), and the per-row Revoke button gets relabelled instead.** *(Codex finding, accepted.)* This was written as "layer A" as if it were an increment on C3.1-C3.6. It is not — it is **a second session-mint pipeline**. `create-session/route.ts:59` does far more than insert a row: `rememberMe` expiry, IP/UA capture, the 10-session cap, the `SESSION_CREATED` audit entry, and new-device alerting. The OAuth callback in `auth.config.ts:47` has none of that request context. Adding only a bare `Session` row makes OAuth and password sessions diverge again in a new way; adding parity is materially bigger than this plan's budget.

  So: ship C3.1-C3.6 (which is what actually closes the security hole), defer per-device revocation, and **relabel the per-row Revoke control to say what it really does** so no button lies in the meantime. Add the deferred work to `TODOS.md` with the parity list above, because that list is the whole reason it was deferred.
- [x] **C3.8 — Tests.** Every existing revocation test asserts the Prisma call, not the security outcome (`__tests__/account-service.test.ts:66-71` asserts `deleteMany` was called). Add tests that assert the **outcome**: a token whose `sv` is stale resolves to `null`; a token with no `sv` still resolves; a DB throw resolves to the token (fail-open).
- [x] **C3.9 — REAL verification in a browser.** Log in via magic link, confirm `/dashboard` loads, bump `sessionVersion` directly in the DB, reload, confirm the session is dead. Then confirm a second, untouched user's login still works (proves the bump is scoped, not a global logout). This is the acceptance gate for C3.

  *(Codex finding, accepted:)* this proves the **global kill switch only** — it does not prove per-device revoke, because C3.7 is deferred. That is exactly why C3.7 carries a mandatory relabel: the verification and the UI must claim the same thing. Do not describe C3 as "per-device revocation" in the commit message or the changelog.

---

## C1 — Dashboard publish must work in production

### Ground truth (verified)

- `publish/page.tsx:42` sends `{ siteId }` only. `publishInputSchema` marks `pages` **optional** (`packages/shared/schemas/publish.ts:37-56`), so it validates. `startPublish` writes `log: undefined` (`publish.service.ts:256-266`), the worker reads `pages = payload?.pages ?? []` and in production throws (`workers/publish/[jobId]/route.ts:91-95`).
- In dev it falls to `runSimulation` (`route.ts:429-463`) which returns `https://<slug>.dev-simulated.invalid` and **the caller still flips the site to PUBLISHED with that URL** (`route.ts:125-132`), fires the `site.publish` webhook and writes an activity row. Textbook `dev_configured_never_to_fail`.
- The AI privileged action has the same hole (`ai-actions.service.ts:55`, `pages` optional).
- **The DB holds everything the renderer needs.** `Page.blocks` is written by the *same* serializer the renderer reads (`Composer.exportProject` → `elements.exportPages()` at `Composer.ts:503` vs `ExportEngine.ts:479`), plus `Site.projectStyles` / `projectSettings` / SEO columns. All render functions are pure over JSON with no DOM.
- Two real gaps: (a) publish never saves first and autosave is a 5 s debounce, so a DB-sourced render ships last-*saved* state; (b) `packages/editor/src/shared/utils/html/sanitization.ts:120-125` **falls back to `stripAllTags` without a DOM**, so a naive server port would publish every AI/template raw-HTML site as plain text — the same class as the `ai_sites_raw_html_export_escaped` memory.
- Zero e2e coverage of publish. `publish.service.approval.test.ts:58` stubs `NODE_ENV=development` *specifically to skip the Vercel check* and calls `startPublish` 3-arg — **the suite itself publishes with no pages and passes.**

### Approach

`pages ?? renderSiteFromDb(siteId)` in `startPublish` — a server-side renderer as the fallback, with the editor payload still preferred when present. This fixes all three entry points at once (dashboard, AI action, any future API/cron publish) and makes the production guard genuinely unreachable.

**The `packages/editor` constraint is the crux and must be resolved before coding.** The render functions live in `packages/editor/src/engine/export/`. Extracting them into `packages/shared` is the clean answer but edits a package another session owns. **C1.0 exists to decide this and is a STOP point.**

### Tasks

- [x] **C1.0 — DECIDE AND RECORD the renderer's home** (was a STOP; *review finding A2* — a STOP point contradicts the standing instruction to complete all three fixes in this session, so this is a decision made against fixed criteria and written down, not a halt).

  Evaluate in this order and take the first that passes:
  1. **Import `@buildrik/editor`'s existing export path server-side, zero edits to that package.** Passes if a `Composer` can be constructed headlessly from DB JSON and `ExportEngine.exportAllPages` runs in Node. `@buildrik/editor` is already in `transpilePackages` and `isomorphic-dompurify` is already a `serverExternalPackage`, so the plumbing exists. **This is the preferred outcome: one renderer, no drift, no edit to the parallel session's package.**
  2. **If (1) fails on a hard DOM or bundling dependency:** implement C1 as far as it can honestly go without `packages/editor` (worker guard honesty + `runSimulation` de-`NODE_ENV`-ing, C1.3), and record the renderer itself as blocked on the editor migration merge — with the dashboard Publish button routed to the editor in the meantime so it stops lying.
  3. **Do NOT** hand-write a second renderer in the dashboard. Two renderers over the same JSON drift, and the failure mode is silent wrong output on the customer's live site.

  Record the outcome, with the evidence that decided it, in this task before writing C1 code.

  **DECISION (recorded 2026-07-31, after Codex review): take option 2 — do not build or import a renderer this session.**
  Codex's argument is decisive and matches the evidence: with `packages/editor` off-limits, "import the editor export path server-side" is an aspiration, not a plan — `ExportEngine` is editor-side by construction, needs a live `Composer`, and its sanitizer degrades to `stripAllTags` without a DOM. Attempting it inside this session risks the worst outcome on the list: a half-working second renderer that publishes AI sites as plain text onto customers' live domains.

  **C1 therefore ships as honesty, not capability:** stop the dashboard and AI paths from claiming a publish they cannot perform, keep the production guard, and remove the dev simulation's ability to fake success. The renderer itself is recorded in `TODOS.md` as blocked on the editor migration merge. This is a smaller C1 than originally scoped, and it is deliberately smaller — see the Codex Review Absorption note.
- [~] **C1.1 (moot — no renderer was built; requirement carried into TODOS) — Sanitizer must not degrade server-side.** Whatever path is chosen, raw-HTML containers must go through `isomorphic-dompurify`, and a test must assert an AI-shaped raw-HTML block survives a server render with its tags intact. This single check is the difference between "works" and "every AI site publishes as plain text".
- [~] **C1.2 (moot — dashboard no longer publishes; carried into TODOS) — Freshness.** Either force a save before publish, or keep the editor payload preferred (which `pages ?? render()` already does) and state in the UI that a dashboard publish ships the last saved state.
- [x] **C1.3 — Make `runSimulation` opt-in behind an explicit flag, never `NODE_ENV`.** It is the sole reason this shipped and survived. Keep the `pages.length === 0 && production` guard as a last-resort honesty check.
- [x] **C1.4 — Tests + REAL verification (rewritten; the original gate was impossible).**
  *(Codex finding, accepted — a factual miss in the first draft.)* The original text said "assert the job reaches COMPLETED with real page content in `log`". That can never pass: the worker sets `log: Prisma.DbNull` on the COMPLETED transition (`workers/publish/[jobId]/route.ts:119`, and on every other terminal transition) precisely so raw page HTML is not left at rest. Asserting on `log` after completion asserts on a field the code is contractually required to have emptied.

  Replaced with gates that can actually pass:
  - a test that the production guard fires — invoke the worker with an empty payload under `NODE_ENV=production` and assert the job goes FAILED with the honest message (today **no test invokes `POST` at all**; only the pure `buildSteps` helper is covered);
  - a test that the dev simulation cannot run unless its explicit flag is set (C1.3), so `NODE_ENV` alone can never fake a success again;
  - a live check that the dashboard no longer offers a publish it cannot perform.

---

## Test strategy (applies to all three)

Every one of these bugs shipped with green mocked tests. The rule for this plan: **each fix needs one assertion against something the code does not control** — Stripe's own API (C2), a real browser session (C3), a real job row and worker run (C1). Mocked unit tests are added as regression guards *in addition*, never as the acceptance gate.

### Coverage diagram (eng review §3)

```
CODE PATHS                                                  USER FLOWS
[C2] server/services/billing.service.ts
  ├── cancelSubscription()
  │   ├── [GAP] Stripe update called w/ right id + args     [C2] Cancel subscription
  │   ├── [GAP] DB NOT written when Stripe throws             ├── [GAP] [→REAL] Cancel, then read back from Stripe
  │   ├── [GAP] resource_missing (grandfathered id)           ├── [GAP] Stripe down -> user sees an error, not silence
  │   └── [GAP] already-cancelled -> idempotent success       └── [GAP] Reactivate clears the banner
  ├── reactivateSubscription()  [GAP] all four, same shape
  └── [★★ TESTED] local write happens — billing-service.test.ts:292 (mock-tautology, asserts its own mock)
[C2] stripe-webhook.service.ts
  ├── handleSubscriptionUpdated  [★★ TESTED] :171,187,211 — but cancel_at_period_end hardcoded FALSE in all 3
  │   └── [GAP] cancel_at_period_end: true  |  [GAP] true->false clears cancelReason
  └── handleSubscriptionDeleted  [GAP] $transaction  |  [GAP] calls reconcileWorkspaceToFreePlan

[C3] server/auth.config.ts jwt callback
  ├── [GAP] token.sv < db  -> returns null                  [C3] Revocation
  ├── [GAP] token.sv absent (=0) + db 0 -> valid              ├── [GAP] [→REAL] login, bump sv in DB, reload -> dead
  ├── [GAP] token.sv absent (=0) + db 1 -> null               ├── [GAP] [→REAL] 2nd untouched login still works
  └── [GAP] DB throws -> fail OPEN (returns token)            └── [GAP] password reset kills a live cookie
[C3] revocation call sites  [★ TESTED] account-service.test.ts:66 asserts deleteMany was CALLED, not the outcome
  └── [GAP] each of the 4 bump sites actually bumps

[C1] publish.service.startPublish
  ├── [GAP] no pages arg -> job.log.pages non-empty
  ├── [GAP] raw-HTML container survives server render with tags intact   <-- the AI-site killer
  └── [★★ TESTED] job row + status — publish.service.test.ts (but approval.test.ts:58 stubs NODE_ENV=development
                   and calls startPublish 3-arg, i.e. the suite itself publishes with no pages and passes)
[C1] worker route  [GAP] pages.length===0 guard is never invoked by any test (only buildSteps helper is tested)

COVERAGE (new/changed paths): 0/22 tested   QUALITY: ★★:3 ★:1 (all pre-existing, none covers a fix)
GAPS: 22  (3 [→REAL] acceptance gates, 19 unit)
```

Legend: `[→REAL]` = the acceptance gate, asserted against something this code does not control.

**The single most important row** is the C1 raw-HTML one. `sanitization.ts:120-125` falls back to `stripAllTags` with no DOM, so a server render without that guard publishes every AI-generated site as plain text — silently, on the customer's live domain.

## NOT in scope

- **Migrating to NextAuth database sessions (C3 option C).** Invalidates every cookie, forces a middleware rewrite (edge cannot resolve an opaque session id), and requires porting the 5-path `session_grant` flow that exists to keep 2FA off NextAuth's provider surface. Correct-by-construction but a rewrite of the auth layer, not a fix.
- **Repairing the other 27 high/medium findings from the same QA pass.** They are recorded in `TODOS.md`; this plan is scoped to the three criticals the founder named.
- **`PaymentMethod` / `isGrandfathered`** — both have zero writers repo-wide, so `PaymentMethodCard` can never render. Real, separate, not a critical.
- **Editor-side publish changes.** `packages/editor` belongs to a parallel session.

## What already exists (reuse, do not rebuild)

- **C2:** the *ingest* half is already correct — `handleSubscriptionUpdated:195` reads `cancel_at_period_end`, and both drifted Stripe shapes are read correctly. Only the *egress* call is missing. `ProcessedWebhookEvent` already gives inbound idempotency.
- **C3:** `resolveWorkspaceId` (`workspace-ctx.ts:44-74`) is the same "JWT claim is a hint, re-validate per request" pattern, already accepted and already paying one DB query per request — this fix rides alongside it rather than introducing a new pattern. `verifyApiToken` already does per-request revocation correctly for API tokens.
- **C1:** the server already generates and mutates site HTML (`cms.service.ts:187-219` plus five injectors in the worker) and already walks the block tree with jsdom (`lib/sanitize-blocks.ts`). The renderer is the missing piece, not the capability.

## Failure modes (eng review required output)

| New codepath | Realistic production failure | Test? | Error handling? | User sees |
|---|---|---|---|---|
| C2 Stripe call | Stripe API down at cancel time | C2.6 | abort before DB write | clear toast error |
| C2 Stripe call | grandfathered id → `resource_missing` | C2.6 | explicit branch | explicit message, no local write |
| C2 local write | DB fails after Stripe succeeded | — | webhook reconciles | brief stale banner, self-heals |
| C3 jwt callback | Postgres blip on every request | C3.8 | **fail open** | nothing (deliberate) |
| C3 jwt callback | user row deleted mid-session | C3.8 | null → logged out | redirected to login |
| C1 server render | raw-HTML AI site loses all tags | **C1.1 — critical gap if skipped** | none today | **silent**: live site becomes plain text |

**Critical gap:** the C1 raw-HTML path is the one failure here that is silent, untested, and unhandled today. C1.1 exists solely to close it and is not optional.

## Rollback

Each task is an independent commit. C2 and C3 are revertible in isolation. C3.1's column is additive and defaulted, so a revert of the code leaves a harmless unused column. C1 is gated behind C1.0 and does not start until that decision is recorded.

## Risks

| Risk | Mitigation |
|---|---|
| C3 logs everyone out on deploy | Grandfather clause for tokens with no `sv` (C3.3); dated comment for removal |
| C3 turns a DB blip into a global auth outage | Fail **open** on DB error, deliberately (C3.4) |
| C2 writes local state after a failed Stripe call | Stripe first, mirror the response, never write on throw (C2.2) |
| C2's real cancellations expose the un-reconciled downgrade path | C2.5 fixes `handleSubscriptionDeleted` before real cancels start landing |
| C1 touches `packages/editor` mid-migration | C1.0 STOP point; import-only or defer |
| C1 publishes AI sites as plain text | C1.1 explicit sanitizer test |

## Codex Review Absorption (2026-07-31)

Codex reviewed the first draft with high reasoning effort against the real code. Six substantive findings, all resolved:

| # | Codex finding | Resolution |
|---|---|---|
| 1 | C3.3 grandfathering preserves the exact vulnerability being fixed — a pre-deploy stolen cookie survives password reset for 30 days | **Already fixed independently** by eng-review finding A1 before Codex returned: missing `sv` reads as `0`, so the first revocation kills old tokens immediately. Two models finding the same flaw from opposite directions is the strongest signal in this review. |
| 2 | C3.7 is not a "layer", it is a second session-mint pipeline (rememberMe, IP/UA, 10-session cap, audit, device alerts) | **Accepted.** C3.7 deferred; per-row Revoke button relabelled so nothing lies; parity list recorded in TODOS. |
| 3 | C1 overreaches under a blocked dependency; the honest move is to kill the lying path, not build a second renderer | **Accepted.** C1.0 decided as option 2. |
| 4 | C1.4's acceptance gate is impossible — the worker nulls `log` on COMPLETED | **Accepted, factual miss on our side.** C1.4 rewritten with gates that can pass. |
| 5 | C3's verification proves only the global kill switch, not the per-row button or the logout blast radius | **Accepted.** Recorded in C3.9; the relabel in C3.7 is what keeps the UI and the verification claiming the same thing. |
| 6 | C2.5 (webhook `handleSubscriptionDeleted` cleanup) is adjacent scope creep | **Rejected, with reasons.** It is not pre-existing debt we wandered into: C2 is what starts producing real cancellations, and `handleSubscriptionDeleted` is the handler that then runs at period end. Shipping C2 without it means the first real cancellation drops a Business workspace to FREE with its published sites still live. Codex is right that it is not on the *current* silent-failure path; it is on the one C2 creates. Kept, scoped to two writes plus one existing function call. |

Codex also flagged our `@auth/core` citation as pointing at the wrong file. **Checked: both `lib/utils/session.js` and `lib/actions/session.js` exist in this install**, and the per-request `callbacks.jwt` invocation this plan depends on is at `lib/actions/session.js:28`, which is what we cited. No change.

## Self-review (done at write time)

- **Every claim above carries a file:line** and came from reading the code this session, not from assumption. The three claims most load-bearing for the design were re-verified directly: the `jwt` callback runs per request (`@auth/core` `session.js:28`), Stripe test mode is reachable (`livemode=false`, 2 products), and `gate:ds` behaviour.
- **Known uncertainty, flagged not hidden:** C1.0 is genuinely undecided and is marked STOP rather than guessed. The `apiVersion` discrepancy (dahlia vs the clover CLAUDE.md documents) is recorded but does not change handler correctness.
- **Ordering rationale is explicit** (C2 → C3 → C1) rather than by severity alone.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 1 | issues_found | 6 findings, 5 accepted / 1 rejected with reasons |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open | 4 issues, 1 critical gap (C1 raw-HTML sanitizer) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **CODEX:** 6 findings against the first draft. C1 rescoped from "build a renderer" to "stop the path lying"; C3.7 deferred with a mandatory button relabel; C1.4's acceptance gate replaced because the worker nulls `log` on COMPLETED, making the original assertion impossible.
- **CROSS-MODEL:** both reviewers independently found the C3 grandfathering flaw from different directions (eng review A1 by reasoning about the version comparison, Codex by reasoning about the stolen-cookie lifetime). Converging on the same defect is the strongest signal in this review, and the fix was already in the plan before Codex returned. The one disagreement is C2.5, kept with the rationale recorded above.
- **VERDICT:** ENG + CODEX absorbed — C2 and C3 ready to implement; C1 rescoped to the honesty fix with the renderer recorded as blocked.

**UNRESOLVED DECISIONS:**
- C1's server-side renderer stays blocked until the `packages/editor` migration merges. Until then the dashboard cannot publish at all, which is honest but is a capability gap, not a fix — the founder should know publishing remains editor-only.

---

## Outcome (2026-07-31)

| Fix | Commit | Acceptance gate (asserted against something this code does not control) |
|---|---|---|
| C2 Stripe cancel | `9d8c57fb` | Real Stripe test-mode: created a live subscription, ran the exact calls this code makes, read it back — `cancel_at_period_end=true` + `feedback=too_expensive`, then `false` after reactivate |
| C3 session revocation | `a3dd2902` | Live browser: logged in, bumped `sessionVersion` 0→1 in Postgres, reloaded → every API call 401 and the workspace fell back to an empty shell; re-login restored full access |
| C1 publish honesty | `b629fb97` | Live browser: clicking Publish lands on `/edit/<siteId>` instead of a route that cannot publish |

110 tests across the nine suites touching these fixes pass; 7/7 DS gates green. Three unrelated test files fail in the full run and are recorded in TODOS — none of their subjects appear in these commits.

**What did NOT get fixed, and why:** the server-side renderer (C1's capability half) is blocked on the `packages/editor` migration, and per-device session revocation is blocked on OAuth session-row parity. Both are in TODOS with the specific requirements that will bite whoever picks them up. The UI was relabelled so nothing claims a capability that is not there.
