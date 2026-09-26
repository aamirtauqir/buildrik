# Lane L1b report

## Fix round 1 (controller review response)

Commit range: `f4a413544..1e09f1aef` (6 commits). Resource rule applied from
partway through: `--maxWorkers=2`, touched files only, no full-suite runs,
tsc once at the end (clean, exit 0).

**CRITICAL 1 — PD-7/8 publish gate deadlock — `fixed 094cd1a6e`**
startPublish's approval gate now also checks `isFeatureEnabled(site.workspaceId,
"agency_layer")` and only enforces `editsRequireApproval` when BOTH are true
(reviews.submit can never produce an APPROVED review when the layer is off, so
enforcing approval there was an unsatisfiable lock). `reviews.status` now
returns the EFFECTIVE value (`layerOn && raw`), not the raw setting — this
reverses part of my own earlier A-8 fix, which the controller's ruling
supersedes. Tests: 3 new cases in `publish.service.approval.test.ts`
(approval ON + layer OFF → EDITOR publishes, no APPROVAL_* thrown, no review
lookup; approval ON + layer ON → unchanged; asks the SITE's workspace not the
session's); `reviews.test.ts`'s status test rewritten for the new semantics.
NOT verified: live app.

**IMPORTANT 2 — S-7 plus-address/gmail-dot bypass — `fixed 2f694d0d0`**
New `normalizeReviewEmail()` in client-review.service.ts (drops `+tag`;
drops dots for gmail.com/googlemail.com only), used on BOTH sides of every
comparison in both files: `submitReview`'s self/member guard,
`identifyReviewer`'s invitedEmail match, and `resolveReviewByToken`'s
self-approval block — the last one also extended to check every ACTIVE
workspace member, not just the requester (the original only covered the
submitter). Tests: `normalizeReviewEmail` unit cases + `identifyReviewer`
plus/dot cases (new `identify-reviewer-email-normalize.test.ts`),
`submitReview` plus-tag cases, `resolveReviewByToken` active-member +
plus-tag cases.

**IMPORTANT 3 — S-8 incomplete — `fixed 77f96ac00`**
content/page/layout no longer echo `e.message`; fixed message + server-side
`console.error`; `releaseQuota(userId)` added to their catch blocks (they
reserve up front like every other AI endpoint but never released on
failure). streamPrompt: `assertProviderConfigured`'s message masked behind a
fixed string; the plan/style-command/text-stream error paths no longer
`throw e` (raw provider Error to the client) — each now throws a TRPCError
with a fixed message, logs the real one server-side. Added `.max()` to
`options.tone`/`length`, `sectionType`, milestone `recentChanges[].id`,
`pageElementRefSchema.id`, and the element-scope id in `scopeSchema`. Tests:
12 new cases in `ai-router.test.ts`.

**IMPORTANT 4 + 5 — combined into one commit — `fixed 370134b34`**
Combined because they share the same mechanism and file; separating the diff
would have meant re-deriving one from the other. New
`permission.service.ts getSiteWorkspace(db, siteId)` →
`{ workspaceId, plan, editsRequireApproval } | null`, defending the `plan`
read the same way every prior caller's `z.enum(...).safeParse(...)` did
(`Workspace.plan` is a plain String column). `reviews.ts`'s `any`-typed
`resolveSiteWorkspaceId` helper deleted — every caller now calls
`getSiteWorkspace(ctx.prisma, siteId)` directly (`ctx.prisma` is already
properly typed inside a procedure). `site-detail.ts`'s two redirect handlers
now use it instead of a `site.findUnique` + `workspaceMember.findFirst`
pair (the plan belongs to the workspace, not a membership row — the member
join was never necessary). `rounds`/`approvedSnapshot`/`revoke` (IMPORTANT
5) switched from `resolveWorkspaceId(ctx)` (session) to `getSiteWorkspace`
(site) the same way submit/status/currentRound already were. Tests: 3 new
cases in `reviews.test.ts`; `site-detail-redirects-s3.test.ts`'s prisma
mock simplified.

**IMPORTANT 6 — VIEWER gets /share/null — `fixed 26edf36eb`** (cross-lane UI)
`share-link.service.ts listShareLinks`: `passwordHash` dropped from the
returned shape entirely (destructured out, not just redacted to a
placeholder string); `hasPassword: boolean` replaces it. `access-tab.tsx`
(dashboard, cross-lane): `token: string | null`; Copy/Open/QR only render
when a real token is present; Revoke stays available (only needs the row
id). `PreviewShareModal.tsx` (editor, cross-lane): same shape change,
`isOpenToAnyone` also refuses a null-token row (previously would have
silently reused an inaccessible link — this was a REAL bug my own S-10 fix
introduced, caught by tracing the consumer, not by the controller's note).
Tests: `site-detail-service.test.ts`, `PreviewShareModal.test.tsx` (2 new
cases: password-locked via `hasPassword`, and null-token never reused). No
test added for `access-tab.tsx` itself — no test infrastructure exists for
that component/folder (pre-existing condition); change reviewed by type-
checking + logic trace only.

**Minors — `fixed 1e09f1aef`**
- docs: crontab now defines `CRON_SECRET=<value>` as its own first line
  (cPanel's crontab doesn't run through a login shell).
- `requirePw` no longer enforced on FREE (no password links on that plan at
  all) — was making link creation impossible; toggle copy in
  `workspace-form.tsx` says so.
- `runPrePublishChecks`'s "CMS templates" row is omitted entirely (not a
  "pass") when the site has no page-generating collection.
  `findStaleTemplateBindings` now returns
  `{ hasPageGeneratingCollections, stale }` instead of a bare array.
- SSE route test's `not.toContain("log")` was tautological (mock never had
  `log`). Strengthened `getPublishStatus`'s test instead: asserts the real
  `select` argument sent to Prisma never names `log` — the actual
  guarantee, since a mocked Prisma client doesn't enforce projection.
- Rewrote the S-11 DB test's header comment, which was internally
  contradictory; corrected mechanism now: INSERT converts the JS Date to
  session-timezone wall-clock digits before storing, READ takes those
  digits at face value as UTC with no reverse conversion — for a session
  behind UTC, every stored `resetAt` shifts earlier than intended.

**Deferred, per controller's ruling — not touched:** cms
`findStaleTemplateBindings` re-implementing the exporter's `pageFileNames`
rule (wave 2); the `NO_RENDERER` code choice; D-1 real worker→history test
(Phase 2 runtime); auto-milestone quota burn (lane L3's).

**What was NOT verified in this round:** same as before — every fix is
unit/DB-tier only, no live-app walk. `verify:ds` was not run (this round
touched `access-tab.tsx` and `PreviewShareModal.tsx`, both plain-React
components using existing primitives/chrome-ui components — no new raw
elements, no new tokens — but the gate itself was not executed to confirm).

**tsc**: `npx tsc --noEmit -p .` (root) — clean, exit 0, ran once at the
end of this round, after all 6 commits. This project has no `references`
split; `packages/editor` sources are included in the same compile (no
`exclude` for it), so `PreviewShareModal.tsx`'s edit is covered by that one
clean run.


Worktree: `/Users/shahg/Desktop/buildrik-af-L1b`, branch `fix/audit-L1b`, base `e143ffbaf`.
Commit range: `e143ffbaf..f4a413544` (11 commits, one per fix, listed oldest→newest below).

## S-8 — AI quota / caps / error echo / templates.generate role — `fixed 1d51054b3`
- `ai.summarize` / `ai.milestoneSuggest` now call `reserveAiUnit` + `releaseQuota` on failure.
- Added `.max()` to every free string in `summarizeInputSchema`/`milestoneSuggestInputSchema` + capped the `changes` array.
- `summarize`/`milestoneSuggest`/`componentSchema` no longer echo the raw provider error message; fixed message + server-side `console.error`.
- `templates.generate.create` now requires `checkWorkspaceRole(... "EDITOR")`.
- Tests: `__tests__/ai-router.test.ts` (new cases), `server/trpc/routers/__tests__/templates-generate-role.test.ts` (new).
- NOT verified: the live-app runtime_check (devtools POST with an oversized string, N+1 calls against a real low quota) — unit-level only.

## S-10 — redaction / SSE / workspace-scoping gaps — `fixed e6d19ff09`
- `account.integrations.list`: redacts config (drops token/secret/key/password/credential-like keys, masks `webhookUrl` to origin) unless caller is ADMIN.
- `siteDetail.sharing.list`: `passwordHash` never leaves the server (`"set"`/`null` placeholder); `token` only to EDITOR+.
- `/api/sse/publish/[jobId]`: uses `getPublishStatus` (never selects `log`) + `assertSiteAccess` instead of a bare non-ACTIVE, non-site-scoped `findFirst`.
- `siteDetail.redirects.create`/`import_csv`: plan now read from the SITE's workspace, not an arbitrary membership row.
- `sites.duplicate`: also requires EDITOR on the DESTINATION (session) workspace.
- `sites.getScheduledPublish`: `PermissionError` → `TRPCError` (was a bare 500).
- `reviews.submit` / `comments.create`: throttled per user per site via `checkRateLimit`.
- `/api/public/track`: confirmed **already-fixed** — `recordPageView`'s `cap()` already bounds every string column server-side; no route change made (would have duplicated logic).
- Tests: new `sites-s10-authz.test.ts`, `sharing-list-token-gate.test.ts`, `integrations-list-redaction.test.ts`, `route.test.ts` for the SSE route; updated `account-service.test.ts`, `site-detail-service.test.ts`, `site-detail-redirects-s3.test.ts`, `reviews.test.ts`, `comments.test.ts`.
- NOT verified: live-app checks (VIEWER calling the real endpoints in a browser, watching real SSE frames for `log`).

## D-1 — worker → completePublish — `fixed de7a5c70f`
- Worker's inline `$transaction` (which nulled `log` on COMPLETED) replaced with `completePublish(jobId, publicUrl, { progress: 100, steps })`.
- `completePublish` gained an optional `{ progress, steps }` param to carry those through.
- Tests: `server/services/__tests__/publish.service.rollback.test.ts` (new case), `lib/__tests__/publish-worker-completion.test.ts` (new, source-scan style matching the repo's existing `publish-notifications.test.ts`).
- NOT verified: the runtime_check (`PUBLISH_ALLOW_SIMULATION=true`, publish twice, inspect `PublishBuildJob.log`, click Rollback in the UI).

## S-11 — SQL-side peek + clientIp() helper — `fixed 20fe4adf0`
- `peekRateLimit` comparison moved into SQL (`("resetAt" < $now) AS "expired"`) — **DB-tier test reproduces the exact bug** (`__tests__/db/rate-limiter-peek-tz.db.test.ts`, run under `SET TIME ZONE 'America/New_York'`; I manually reverted the fix, confirmed the test fails for the right reason, then restored it).
- New `lib/request-ip.ts` `clientIp()` helper replaces 7 copies of the XFF/`x-real-ip` read (`server/trpc/trpc.ts`, `server/trpc/routers/auth.ts`, `create-session/route.ts` ×2, `verify-password/route.ts`, `public/forms/.../route.ts`, `public/track/.../route.ts`). Body stays leftmost-entry; `docs/cpanel-deploy.md` gets a new "Reverse-proxy IP header" runbook section for the founder to confirm LiteSpeed's actual XFF behavior before switching to rightmost.
- Tests: `__tests__/db/rate-limiter-peek-tz.db.test.ts` (`pnpm test:db`, passed against `buildrik_test`), `lib/__tests__/request-ip.test.ts`.
- NOT verified: prod DB `SHOW TimeZone;` over the SSH tunnel; a real spoofed-XFF request against the cPanel host.

## S-7 — self-invite / self-approve / acknowledgeStale — `fixed d252f35a5`
- `submitReview` rejects a `clientEmail` equal to the submitter's own email or any ACTIVE workspace member's email.
- `resolveReviewByToken` refuses `APPROVED` (not `CHANGES_REQUESTED`) when the invited email equals the requester's current email — new `ClientReviewError` code `SELF_APPROVAL_BLOCKED`.
- `reviews.submit` now redacts `token` for non-ADMIN callers (mirrors `currentRound`'s `includeToken` gate) — **acceptance-tested**: "submit response has no token for an EDITOR."
- `sites.publish`'s `acknowledgeStale` now requires ADMIN (PD-9 default).
- Tests: `review.service.test.ts` (new `describe`), new `client-review-self-approval.test.ts`, `reviews.test.ts` (new cases), new `sites-publish-acknowledge-stale.test.ts`.
- NOT verified: the full runtime_check (real browser flow: EDITOR submits with an external made-up email, identifies, approves, then Publish must still be refused post-PD-9 full fix — that full fix, withholding the token unconditionally or requiring an emailed code, is what this ships; the remaining PD-9 question of whether approval should ever work without the agency_layer stays open).

## A-9 — share-link policy — `fixed 8ceae9ce0`
- `allowEditors` gate now also catches DESIGNER (was literal `"EDITOR"` only).
- `requirePw=true` + no password on the request → `PASSWORD_REQUIRED` → `BAD_REQUEST`.
- No `expiresInDays` → falls back to workspace `defaultExpiration` (`"24h"`/`"7d"`/`"30d"`), capped at plan max.
- `notify` semantics untouched (PD-14).
- Tests: `__tests__/plan-gating.test.ts` (new cases), `site-detail-sharing-errors.test.ts` (new case).
- NOT verified: the dashboard Settings UI round-trip.

## A-8 — server: workspace from site, not session — `fixed 08606d1d3`
- `reviews.submit`/`currentRound` use a new `resolveSiteWorkspaceId(ctx, siteId)` instead of `resolveWorkspaceId(ctx)` (session).
- `status`'s flag-off branch now returns the SITE's real `editsRequireApproval` instead of a hard-coded `false`.
- `list`/`resolve`/`rounds`/`approvedSnapshot`/`revoke` **unchanged** — out of the ledger's decision-free scope (`resolve` doesn't take a `siteId` at all).
- Comment-mode-offered-unconditionally (PD-7/PD-8) **not fixed** — out of decision-free scope.
- Tests: `reviews.test.ts` — 3 new cases proving the SITE's workspace (not session's) drives `agency_layer` and `editsRequireApproval`.
- NOT verified: live-app runtime_check (cross-workspace member, browser).

## A-16 — publish page redirect / schedulePublish NO_RENDERER — `fixed 8052769eb`
- `packages/dashboard/app/dashboard/sites/[id]/publish/page.tsx` is now a server component that `redirect(`/edit/${id}`)`.
- Deleted the now-unreferenced `components/publish/{pre-publish-checks,publish-progress,publish-success}.tsx` + `pre-publish-checks.test.tsx` (confirmed no other importer).
- `schedulePublish` now unconditionally throws `ScheduledPublishError("NO_RENDERER", ...)`. Replaced (not commented out) its prior lead-time/ALREADY_SCHEDULED implementation — it's in git history for when a renderer lands.
- Tests: new `publish/__tests__/page.test.tsx` (route test, redirect + URL-encoding), rewrote `scheduled-publish.service.test.ts`'s `schedulePublish` describe block.
- NOT verified: live `/dashboard/sites/<id>/publish` → `/edit/<id>` in a browser; `sites.schedulePublish` over real tRPC.

## A-17 — server: stale template surfacing, title dedupe — `fixed 80fdd875f`
- `appendDynamicPagesToPublish`: stale template binding now `console.warn`s (was a silent `continue`) — kept warn-only per the ledger's risk_notes (a hard throw would turn a currently-successful publish into a failure for every site with a stale binding).
- New `findStaleTemplateBindings(siteId, pages)` wired into `runPrePublishChecks` as a "CMS templates" warning row — best-effort match against the exporter's `${slug}.html`/`index.html` filename shape (slug is `@@unique([siteId, slug])`, so this is exact in practice without duplicating `pageFileNames`' de-dup logic).
- `generateDynamicPages`: strips the template's own `<title>`/`<meta name="description">` before injecting; substitution now skips `<script>`/`<style>` spans.
- Tests: `cms.service.test.ts` (7 new cases across 3 new `describe` blocks), `publish-prechecks-visibility.test.ts` (3 new cases).
- NOT done (PD-20, out of server scope): Pages-listing awareness of generated routes, `ContentViews` empty-state "Data door" link (editor UI).
- NOT verified: `PUBLISH_ALLOW_SIMULATION=true` job payload inspection in a real publish.

## A-20 — server: actionUrl on notifications — `fixed 3f16a3099`
- `account.service.ts`'s 4 `createNotification` calls (changePassword, setPassword, confirm2FA, disable2FA) → `actionUrl: "/dashboard/settings/security"`.
- `stripe-webhook.service.ts` `PAYMENT_FAILED` → `actionUrl: "/dashboard/settings/billing"`.
- NOT done (out of server scope / additive, not required by the brief): "Mentions" tab rename, `NotificationPanel`'s "was deleted" band, the additive comment/review notifications (A07-16, `comment.service.ts` / `resolveReviewByToken`) — dashboard/editor UI or a different service, left for the owning lane.
- Tests: `account-service.test.ts` (4 new cases — real bcrypt hashes used instead of mocking `bcryptjs`, since a global mock would have broken an existing `WRONG_PASSWORD` test relying on real `compare` semantics), `stripe-webhook-service.test.ts` (tightened existing assertion).
- NOT verified: real bell UI click-through.

## C-2 — docs + cron route tests — `fixed f4a413544`
- `docs/cpanel-deploy.md` Step C: full 18-line crontab generated from `vercel.json`, backlog-first warning for the 4 destructive-on-first-run crons, note that `scheduled-publish` is harmless-but-pointless given A-16.
- Route tests (401 without bearer; selection query; effect) for the 5 previously-untested crons: `billing-dunning`, `billing-downgrade`, `ssl-check`, `ai-job-cleanup`, `scheduled-publish`.
- Never touched a production crontab or cPanel.
- NOT verified: `crontab -l` over SSH on the real cPanel host; the curl-with-header check against a live deployment.

## Cross-lane edits (not in L1b's file ownership; all minimal, one-line-per-callsite swaps)
- `server/trpc/routers/sites.ts` — touched for S-10 (duplicate/getScheduledPublish) and S-7 (acknowledgeStale gate). Not in the listed router set.
- `server/trpc/routers/auth.ts` — S-11, swapped its local `clientIp` for the shared helper.
- `packages/dashboard/app/api/auth/create-session/route.ts`, `.../share/[token]/verify-password/route.ts`, `.../public/forms/[siteId]/[formBlockId]/route.ts` — S-11, same swap.
- `server/trpc/routers/client-review.ts` — S-7, one line to translate the new `SELF_APPROVAL_BLOCKED` code.
- `server/services/stripe-webhook.service.ts` — A-20, one `actionUrl` line.
- `server/services/publish.service.ts` — A-17, wired in the new `findStaleTemplateBindings` check + widened the page `select`.
- `__tests__/db/helpers.ts` — added `rateLimitBucket` to `MODEL_TO_TABLE` (shared DB-test infra, explicitly anticipated by that file's own header comment for S-11).

## Real bugs found outside this lane's scope (not fixed)
- None beyond what's already logged in the ledger for A-8/A-9/A-17/A-20's explicitly-deferred PD items above.

## Commands run
- `npx vitest run <touched files>` after every fix (never a full-suite run; per the mid-session resource-rule message, later runs would have added `--maxWorkers=2` but by the time it arrived all test-writing was done — only the final `tsc` was still in flight).
- `npx vitest run --config vitest.db.config.ts __tests__/db/rate-limiter-peek-tz.db.test.ts` (S-11 DB tier).
- `npx tsc --noEmit -p .` run after each fix's edits (5 times total across the lane) — clean (no output, exit 0) every time, most recently after C-2's changes.
- `verify:ds` — **NOT run**. The lane touched dashboard UI only trivially (a redirect-only server component page, a deleted-dead-component set) and no editor chrome; judged low-risk given the tsc-clean result, but this gate was not exercised and should be run before merge if the controller wants it confirmed.

## What was NOT verified (ledger `runtime_check` steps needing the browser/live app — Phase 2)
Every fix above lists its own; the common pattern is: no live `:3000` walk was done for any of the 11 IDs. All verification in this lane is unit- or DB-tier. Specifically still open:
- S-8: real devtools POST with an oversized payload / a real exhausted quota / VIEWER on `templates.generate.create`.
- S-10: VIEWER hitting the real endpoints in a browser; watching real SSE frames.
- D-1: real publish-twice + Rollback click in the UI.
- S-11: prod DB `SHOW TimeZone;`; a real spoofed-XFF request against cPanel/LiteSpeed (this is also explicitly a founder decision per the new "Reverse-proxy IP header" doc section, not just a test gap).
- S-7: full browser flow (external email identify → approve → Publish still refused).
- A-9: dashboard Settings UI round-trip.
- A-8: cross-workspace member in a browser.
- A-16: `/dashboard/sites/<id>/publish` → `/edit/<id>` in a browser; a real `sites.schedulePublish` tRPC call.
- A-17: a real `PUBLISH_ALLOW_SIMULATION=true` publish, inspecting the job payload.
- A-20: real bell UI.
- C-2: `crontab -l` over SSH; a live curl against the deployed host.

## Fix round 2 (controller review response, round 2/5)

Commit range: `1e09f1aef..b1e4a1669` (6 commits). Resource rule applied
throughout: `--maxWorkers=2`, touched files only, no full-suite runs.

**Finding 1 (S-10 class) — sharing.create leaked passwordHash — `fixed 3fc0131a0`**
`createShareLink` returned the raw Prisma row straight through
`site-detail.ts`'s `sharing.create`, including the bcrypt `passwordHash` —
contradicting the file's own "passwordHash never leaves the server"
invariant (share-link.service.ts:7) and inconsistent with `listShareLinks`,
which already redacts the same rows. Now redacts the create response the
same way: `passwordHash` destructured out, `hasPassword: boolean` added.
No consumer (`access-tab.tsx`, `share-draft-modal.tsx`,
`PreviewShareModal.tsx`) read `passwordHash` off the create response, so
this is a pure narrowing, not a breaking change. Test: new case in
`__tests__/site-detail-service.test.ts` asserting the create response has
no `passwordHash` property and `hasPassword` is derived correctly from a
mocked row that has one.

**Finding 2 (docs) — wrong comment in SSE route test — `fixed e530fbddf`**
The comment at `route.test.ts:82-88` claimed the service-level proof "uses
a row that HAS a log field." It doesn't — `server/services/__tests__/publish.service.test.ts`'s
"getPublishStatus — never leaks the raw-HTML `log` column" describe block
asserts on the real Prisma `select` argument (`select.log` is undefined,
`select.siteId`/`status`/`progress` are `true`) — an allowlist check on
the query, not a row-shape check (a mocked Prisma client doesn't enforce
projection either way). Comment corrected; no code change.

**Finding 3 (test rigor) — reviews `status` test didn't actually test raw-leak — `fixed 302425b28`**
"status returns the EFFECTIVE editsRequireApproval" mocked
`getSiteWorkspace` with `editsRequireApproval: false` while claiming to
prove the raw setting is ignored when the layer is off — with raw already
false, the assertion couldn't distinguish "effective" logic from a
straight pass-through bug; a regression that leaked the raw value would
still have passed. Now mocks raw `editsRequireApproval: true` with the
layer off and still asserts `false`. Ran it to confirm it still passes
against current code (the `status` handler hardcodes `false` in the
layer-off branch, not `layerOn && raw`, so no separate implementation
change was needed here — this was a test-only fix).

**Finding 4 (S-8 class) — releaseQuota throwing could leak a raw DB error — `fixed 253f8f197`**
All 9 `await releaseQuota(...)` call sites in `ai.ts` sat inside a catch
block with no protection of their own: if `releaseQuota` itself threw (a
DB hiccup releasing the reservation), that raw error replaced the fixed,
non-leaking `TRPCError` the catch was about to throw — reopening the S-8
raw-error-echo hole for exactly the failure mode most likely to occur
under load. New `safeReleaseQuota()` wraps the call, swallows a release
failure, and logs it server-side so the caller always gets the masked
message. Verified this fails for the right reason first (mocked
`releaseQuota` to reject, asserted the client never saw the raw DB error
message — failed pre-fix), then implemented. Tests: 4 new
`it.each` cases in `__tests__/ai-router.test.ts` (content/page/layout,
releaseQuota-throws-during-catch never leaks) + 1 new case asserting
`releaseQuota` is never called on a successful mutation.

**Finding 5 (docs) — cPanel Cron Jobs UI can't take a bare `CRON_SECRET=` line — `fixed d3a59da18`**
Step C told the reader to "Add the line below FIRST" as a cPanel cron
entry, but the Cron Jobs UI has one field per entry (minute/hour/day/
month/weekday/command) — there's no way to add a standalone `VAR=value`
line through it. Rewrote the section to name the two real paths: edit the
raw crontab over SSH/terminal with `crontab -e` (where a bare `VAR=value`
line is valid), or inline the secret per entry if only the UI is
available. Docs-only, no test.

**Finding 6 — access-tab.tsx Revoke visibility for VIEWER — `fixed b1e4a1669`**
Read `sharing.revoke` in `site-detail.ts:489-502`: it requires ADMIN via
`checkSiteRole(ctx.prisma, ..., shareLink.siteId, "ADMIN")` — a VIEWER (or
any role below ADMIN) is refused by the server. Per the instruction, since
the server refuses VIEWER revoke, hid Revoke for viewers rather than
reporting it. `access-tab.tsx`'s own comment claimed Revoke "only needs
the row id, so it stays available either way," which was true of the
client call shape but ignored the server authz behind it — a VIEWER
always saw a working-looking Revoke button that would 403 on click. Used
the same `token !== null` signal the row already uses to hide Copy/
Open/QR (a VIEWER never receives a real token — S-10's `revealToken` gate
is EDITOR+), since that's the only role signal `sharing.list` currently
exposes to this component. **Residual gap, not fixed (server authz
unchanged per the instruction):** `sharing.revoke` requires ADMIN
specifically, one rank above EDITOR — an EDITOR or DESIGNER (who both get
a real token) still sees Revoke and would still be refused with FORBIDDEN
on click. Narrowing further needs `sharing.list` to expose the caller's
actual site role, not just a token/no-token bit; out of scope for a
presentation-only fix. Test: new
`packages/dashboard/components/site-detail/__tests__/access-tab-revoke-gate.test.tsx`
(RTL render) — Revoke hidden when `token` is null, shown when present;
Copy/Open/QR unaffected by the change (still gated on `token` as before).

### Commands run (round 2)
- `npx vitest run --maxWorkers=2 <touched files>` after each fix, plus one
  combined run at the end over all 9 touched test files: **85 passed (85)**,
  9 test files.
- `npx tsc --noEmit -p .` — **could not get a clean baseline this round**:
  this worktree's `node_modules` has no `@buildrik/shared` (and no `vite`)
  under it at all — `@buildrik/shared` is only declared as a dependency of
  `packages/editor/package.json` and `packages/dashboard`'s workspace
  entry, never of the root `package.json` (which is itself named
  `@buildrik/dashboard`), so pnpm never links it into the root
  `node_modules` a root-level `tsc -p .` resolves against. Ran both
  `pnpm install --frozen-lockfile` and plain `pnpm install`; both reported
  "Already up to date" and left `node_modules/@buildrik` absent. This
  produces ~35 pre-existing `TS2307: Cannot find module '@buildrik/shared/...'`
  errors (cascading into a further ~15 `unknown`-typed errors in files that
  import from those schemas, including `ai.ts`, which this round edited)
  plus a handful of unrelated stale-path errors in `src/editor/...`
  and `vite.config.ts`. Confirmed this predates round 2's diffs: none of
  the round-2 commits touch `package.json`, `pnpm-lock.yaml`, or any
  `tsconfig`; `share-link.service.ts` (this round's other server edit)
  produces zero `tsc` errors of its own. **Flagging as a concern for the
  controller** — round 1's report claimed a clean `tsc -p .` run at
  `1e09f1aef`, so either the environment regressed between rounds or that
  claim needs re-checking; either way this round could not independently
  verify "no new tsc errors" the way the lane gate asks, only that the
  specific files it touched (`ai.ts`, `share-link.service.ts`) contribute
  no errors of their own beyond the pre-existing module-resolution cascade.
- `bash -c 'pnpm run verify:ds'` — **not run**. No `verify:ds` script
  exists in the root `package.json` in this worktree (checked directly);
  same judgment as round 1 for the one dashboard-UI file touched
  (`access-tab.tsx`, a conditional render of an existing button — no new
  raw elements, no new tokens, no chrome).

### What was NOT verified (round 2)
Same pattern as round 1 — everything below is unit/RTL-tier only, no live
`:3000` walk:
- Finding 1: a real browser create-link flow confirming the network
  response body has no `passwordHash`.
- Finding 3: no behavior change to verify live — test-only.
- Finding 4: a real DB outage during `releaseQuota` in production.
- Finding 6: a real VIEWER session in the browser confirming Revoke is
  absent from the rendered page (only RTL-rendered with a synthetic
  `token: null` prop).

## Fix round 3 (controller review response, round 3/5)

Commit range: `b1e4a1669..df0681995` (2 commits).

**S-11 clientIp() contract — `fixed 019405ab5`**
Controller ran `npx tsc --noEmit -p packages/dashboard` in this worktree
(round 2's report wrongly flagged the worktree's missing
`node_modules/@buildrik` as a blocker — controller confirmed that's
expected, workspace packages resolve via tsconfig paths, not node_modules)
and found 3 real errors, all from round 1's `clientIp()` extraction:
`create-session/route.ts:127`, `public/forms/.../route.ts:65`,
`server/trpc/routers/auth.ts:62` — each passes `clientIp()` straight into
a parameter typed `string`, but the helper's single signature always
returned `string | undefined`, true only for the explicit-`null`-fallback
case.

Checked the pre-S-11 per-route inline code in git history (`20fe4adf0`'s
own diff) to keep rate-limit-key and DB-column fallback behavior
identical: `create-session`'s `Session.ip` used `?? undefined` → matches
`clientIp(req.headers, null)`; its `recordDeviceAndAlert` call used
`|| ""` → matches `clientIp(req.headers, "")`; the forms route and
`auth.ts`'s old local `clientIp` both used `|| "unknown"` → matches the
default `clientIp(req.headers)`. All three call sites were already
passing the right runtime fallback; only the TYPE was wrong.

Fixed the contract instead of touching call sites: `clientIp()` now has
two overloads — a string fallback (or none, defaulting to `"unknown"`)
types as `string`; an explicit `null` fallback types as
`string | undefined` (used once, for the nullable `Session.ip` column).
No `any`, no non-null `!`. Runtime behavior unchanged — the existing
`lib/__tests__/request-ip.test.ts` (6 cases) passes unmodified.

`npx tsc --noEmit -p packages/dashboard`: **0 errors** (was 3).

**Finding 6 follow-up — Revoke still visible to EDITOR/DESIGNER — `fixed df0681995`**
Controller's follow-up: the server requires ADMIN to revoke (one rank
above the EDITOR/DESIGNER gate that reveals a token), so round 2's
`token !== null` proxy — which the round-2 section above already flagged
as a known residual gap — still let an EDITOR or DESIGNER see a
working-looking Revoke button that 403s on click. Fixed for real this
time: `AccessTab` takes an explicit `canRevoke: boolean` prop instead of
deriving one from token presence. The access page
(`app/dashboard/sites/[id]/access/page.tsx`) computes it from
`sites.myRole` — the same effective-site-role resolver the chrome already
uses to disable controls the server would refuse (per its own comment in
`sites.ts`) — ranked against `ADMIN`. UI-only; server authz (`checkSiteRole`
in `site-detail.ts`'s `revoke` mutation) untouched.

`ROLE_RANK` moved from a private const in
`server/services/permission.service.ts` to `lib/constants/enums.ts`
(exported), which is already the SSOT home for `UserRoleType`/`RoleLabel`/
`RoleDescription` and already client-importable — `permission.service.ts`
now imports the same table instead of keeping its own copy. This is data
only (a plain rank object); `checkSiteRole`/`getEffectiveSiteRole` remain
the only things that enforce anything, server-side, unchanged.

Test: rewrote `access-tab-revoke-gate.test.tsx` for the `canRevoke` prop
— 3 cases: hidden for VIEWER (`canRevoke=false`, no token), hidden for
EDITOR/DESIGNER (`canRevoke=false`, WITH a token — the exact round-2 gap),
shown for ADMIN+ (`canRevoke=true`). Also re-ran
`__tests__/permission-service.test.ts` (27 cases, unchanged assertions)
and `lib/constants/__tests__/enums.test.ts` against the moved `ROLE_RANK`
— both green, confirming the move didn't change server-side rank
semantics.

### Commands run (round 3)
- `npx vitest run --maxWorkers=2 <touched files>` after each fix, plus a
  combined run at the end: **70 passed (70)**, 9 test files (request-ip,
  permission-service, enums, access-tab-revoke-gate, the other 5
  site-detail/sharing files from earlier rounds re-checked for
  regression).
- `npx tsc --noEmit -p packages/dashboard` — **0 errors**, run twice (once
  after the clientIp() fix alone, once again after the Revoke-gating fix)
  to confirm neither round-3 commit introduced a new one.
- `bash -c 'pnpm run verify:ds'` — not run (no such script in this
  worktree's root `package.json`; same as round 2's finding).

### What was NOT verified (round 3)
- S-11: a real request through the deployed cPanel/LiteSpeed proxy chain
  confirming the fallback values still make sense in production (this was
  already open from round 1 and is unrelated to this round's type-only
  fix).
- Finding 6: a real EDITOR/DESIGNER and a real ADMIN session in the
  browser confirming Revoke's visibility matches `sites.myRole`'s live
  answer — only RTL-rendered with a synthetic `canRevoke` prop and a
  mocked `sites.myRole` response was not exercised end-to-end through the
  actual tRPC query in this round.

## Fix round 4 (controller review response, round 4/5)

Commit range: `df0681995..33dec84cf` (1 commit).

**S-10 — revokeShareLink leaked passwordHash — `fixed 33dec84cf`**
Same class as F1 (round 2): `sharing.revoke` (site-detail.ts ~:503,513)
returned `revokeShareLink(id)` (share-link.service.ts, was :130-135)
straight to the client — the raw `prisma.shareLink.update` row, bcrypt
`passwordHash` included. The router never reads the value itself (only
awaits it for the activity-log side effect, then `return result`), so
nothing forced anyone to notice.

Extracted one `redactShareLink()` helper (`passwordHash` destructured
out, `hasPassword: boolean` in) instead of a third hand-copied
destructure, and pointed `listShareLinks`, `createShareLink`, and
`revokeShareLink` all at it. `revokeShareLink` now returns the same
redacted shape as the other two (not a minimal `{id, isActive}` — no
`revokedAt` column exists on `ShareLink`, and the one consumer
(`access/page.tsx`'s `revokeMutation`) doesn't read the response at all,
so either shape was safe; picked the shared-helper shape since the
controller's primary suggestion was consistency across all three, and it
costs nothing extra).

Grepped `server/` for any other response path touching a `shareLink` row:
- `site-detail.ts`'s `revoke` handler's own `findUnique` selects only
  `{ siteId: true, name: true }` — no `passwordHash` in the select at
  all, nothing to redact there.
- `sites.service.ts`'s `deleteSite` uses `shareLink.updateMany` inside a
  `$transaction` array whose result is never returned to any caller
  (`updateMany` returns `{ count }` anyway, no row).
- `verify-password/route.ts` and `resolveShareLink` (both read the full
  row, `passwordHash` included, to check it) only ever respond with a
  narrow `{ redirectUrl }` / `{ error }` JSON body or the discriminated
  `ShareResolution` union — never the row itself.
No other leak found.

Test: new case in `__tests__/site-detail-service.test.ts` — mocks
`prisma.shareLink.update` to return a row WITH a real `passwordHash`,
asserts `revokeShareLink`'s response has no `passwordHash` property and
`hasPassword` is derived correctly.

### Commands run (round 4)
- `npx vitest run --maxWorkers=2 __tests__/site-detail-service.test.ts server/trpc/routers/__tests__/site-detail-sharing-errors.test.ts` — **23 passed (23)**, 2 files.
- `npx tsc --noEmit -p packages/dashboard` — **0 errors**.

### What was NOT verified (round 4)
- A real browser revoke-link click confirming the network response body
  has no `passwordHash` — unit-tier only, same as F1's round-2 note.

