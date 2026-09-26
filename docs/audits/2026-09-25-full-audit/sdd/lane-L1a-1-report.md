# Lane L1a-1 report

Worktree: /Users/shahg/Desktop/buildrik-af-L1a-1, branch fix/audit-L1a-1, base e143ffbaf.
Commit range: 3766a978a..397437813 (20 commits total: 5 original + 10 fix-round-1 + 3 fix-round-2 + 1 fix-round-3 + 1 fix-round-4).

## Fix round 4 (merge-gate tsc finding)

Commit 397437813 (`fix(auth): S-5 — type the GitHub userinfo request`). The
merge gate's `npx tsc --noEmit -p packages/dashboard` found one error left
over from round 2: `server/auth.config.ts(54,25)` TS7031, the GitHub
`userinfo.request({ tokens })` override's destructured parameter had no
type. Typed it as `GitHubUserinfoRequestContext`, derived structurally from
the already-imported `GitHub` provider factory —
`Parameters<typeof GitHub>[0]["userinfo"]` narrowed to the object-handler
variant, then its `request` function's own first parameter — rather than
importing `@auth/core` directly, which is only a transitive dependency of
`next-auth` and confirmed NOT hoisted to this package's own
`node_modules/@auth/` under pnpm's strict layout (`ls node_modules/@auth`
shows only `prisma-adapter`, not `core`) — a direct import would have been a
phantom-dependency risk the merge gate would likely have flagged separately.
No `any`, no cast, behavior unchanged (the auth-config test file needed no
edits — still 18/18 passing). `npx tsc --noEmit -p packages/dashboard`: 0
errors (was 1).

## Fix round 3 (controller re-review response)

Commit d952de167. Round 2's N1, M7, M11, C3 were confirmed ADDRESSED (no
further work needed on those); this round covers the one new IMPORTANT
finding from that re-review.

### IMPORTANT — fixed, commit d952de167 (`fix(auth): S-5 — look up the provider link before touching any user row`)
The round-2 provider-link ownership guard ran AFTER the create/update/clear
side effects it was meant to guard. Reported scenario: user A signs up via
GitHub with verified a@x, later changes their GitHub account's verified
email to b@x. The email-first ordering looked up b@x, found no row, created
a second "verified" user + workspace, and only then reached the ownership
guard and refused — orphaning A's account permanently (a password signup
for a@x can't reclaim it post-EMAIL_EXISTS, and every later GitHub login
lands on the orphan, never A).

Binding ruling implemented literally: look up `Account` by
`provider_providerAccountId` BEFORE any email-based branching.
- Link found → `user.id` is set directly from the Account row and the
  callback returns `true` immediately — zero DB writes ("bump nothing
  else": no lastLoginAt, no emailVerified, no credential clearing, no audit
  log, no account.upsert). No larger refactor was needed: the `jwt`
  callback already resolves whatever `user.id` signIn set, which this
  lane's own round-1/round-2 branches already relied on for the same
  reason.
- Link not found → the existing verified-email-gated create/clear/link flow
  is unchanged. The bottom-of-callback ownership guard is now unreachable
  by construction in the normal case, kept as defense in depth against a
  TOCTOU race between the account-first read and the eventual upsert.

Minor (controller, cheap): the round-2 "link path" unverified-email test
didn't actually mock an existing row, so it couldn't distinguish "correctly
gated" from "mock never got a value" — now mocks a real existing VERIFIED
row and asserts the refusal happens before any lookup reaches it.

Tests: `__tests__/auth-config.test.ts` — account-first happy path (literally
zero prisma writes, checked one call at a time: user.findUnique, user.update,
txUserCreate, account.upsert, logAuditEvent all asserted not-called) even
when the profile's email differs from the linked user's stored email;
no-link path still creates normally; a TOCTOU-race test (two sequential
`account.findUnique` mock resolutions — null then a conflicting owner) still
refuses via the defense-in-depth guard. The two round-2 "ownership" tests
were replaced — their old scenario (link already exists → refuse) is now the
account-first SUCCESS path, not a refusal, under the new ruling; the refusal
now only fires on the race window.
`__tests__/db/auth-config-account-first.db.test.ts` (real Postgres, new) —
the exact reported scenario: user A linked via GitHub, GitHub's reported
email changes to b@x on the next login → signs in as A, zero new user rows,
zero new workspaces, no row exists for b@x, A's passwordHash/sessionVersion/
email completely untouched. Plus a first-time-login control. Added
`createTestAccount` + the `account` table to `__tests__/db/helpers.ts`'s
truncation map.

## Fix round 2 (controller scoped re-review response)

Commits 134c3af8a..55bb6b2f7. C1, C2 (as specified), C3, I5, I6, minors 8/9/10
from round 1 were ADDRESSED per the controller's scoped re-review; this round
covers the new findings from that re-review.

### CRITICAL N1 — fixed, commit 55bb6b2f7 (`fix(auth): S-5 — GitHub email trusted only when verified`)
The round-1 OAuth first-verification branch hardcoded GitHub's email as
verified on a false claim about the default provider's behavior. Confirmed
by reading the installed `@auth/core` GitHub provider source
(`node_modules/.../providers/github.js`): it reads `/user`'s free-text
public-email field first, and only falls back to `/user/emails`' `find(e =>
e.primary) ?? emails[0]` — primary, never checking `verified` — when that's
blank. Fixed by giving the GitHub provider a custom `userinfo.request`
(server/auth.config.ts) that ignores `/user`'s email entirely and always
resolves from `/user/emails`'s `verified: true` flag (primary+verified
preferred, else any verified, else `null`). `signIn`'s GitHub branch now
checks `Boolean(profile.email)` instead of a hardcoded `true`, and the outer
guard changed from `if (account && user.email)` to `if (account)` with an
explicit refusal when there's no verified email — the old condition let a
providerless-email case fall through to the unconditional `return true`
instead of being refused. Also added an `account.upsert` ownership guard:
refuses instead of silently reassigning an existing
`provider_providerAccountId` link to a different `user.id`.
Tests: the real `userinfo.request` function exercised against mocked
`/user`/`/user/emails` responses (unverified-primary-falls-back-to-verified-
secondary, no-verified-email-at-all → null, `/user`'s own email field
ignored); signIn refusing on both the first-verification and existing-row
link paths when GitHub gives no verified email; a positive control; two
tests for the account.upsert guard.

### MINOR 7 (new) — fixed, commit ad8162b61 (`docs: ...`)
`verifyMagicLink`'s comment still said "see the matching comment on
verifyEmail" — stale since round 1 reverted that clearing out of verifyEmail
entirely. Reworded to name the two paths that DO still clear (magic link,
OAuth).

### C3 hardening — fixed, commit 134c3af8a (`fix(server): S-5 — reclaim checks inside the transaction`)
The guarded `deleteMany` re-check (lastLoginAt/emailVerified still null)
relied on an unstated invariant that every path making a reclaimed row
unreclaimable also touches one of those two columns. It doesn't have to.
siteCount/otherMemberCount are now re-checked INSIDE the transaction, using
the `tx` client, immediately before the guarded delete — the
outside-transaction check earlier in the function is now explicitly
documented as a fast-path only, not the source of correctness.

### MINOR 11 — fixed, this report
Added a complete touched-files list (was missing dashboard.service.ts,
team.service.ts, routers/auth.ts, routers/sites.ts, routers/team.ts) — see
below.

### Parked (accepted as-is per controller)
IMPORTANT 4's OAuth-clearing case remains proven only by the mocked unit
test in `__tests__/auth-config.test.ts` — a DB-tier NextAuth harness is out
of scope, per the controller.

### Process note: a `git checkout --` recovery
While attempting to split `server/services/auth.service.ts`'s two unrelated
hunks (C3 hardening + the MINOR 7 comment fix) into separate commits, an
early `git checkout -- server/services/auth.service.ts` discarded the
uncommitted working-tree changes — a mistake; `git checkout --`/`git
stash`/similar destructive commands are exactly what CLAUDE.md's git
guidance warns against mid-execution. Recovered immediately and fully: the
full diff had already been captured to a temp file via `git diff` moments
before the checkout, and `git apply` reapplied it byte-for-byte (verified
via `git diff | diff - <saved-file>` showing zero difference) before any
further edits. No work was lost. Used `git apply` / reverse-`git apply` of
saved patch files for the actual hunk-splitting instead of any further
`checkout`.

## Fix round 1 (controller review response)

Commits 951b08ad9..41042aab6, addressing the controller's task review.

### CRITICAL 1 — reverted, commit 250e3d91c
`verifyEmail` (auth.service.ts) no longer clears passwordHash/2FA. Per
binding ruling: PD-5 clearing applies ONLY to first verification via magic
link or OAuth, never to clicking your own signup's verification link.
`verifyMagicLink`'s clearing is unchanged.

### CRITICAL 2 — fixed, commit ab2ba2aad (CROSS-LANE EDIT: server/auth.config.ts)
OAuth existing-user branch in the `signIn` callback: when
`existing.emailVerified` is null, one `prisma.user.update` now sets
emailVerified, clears passwordHash/twoFactorEnabled/twoFactorSecret/
backupCodes, bumps sessionVersion, and stamps lastLoginAt, then allows
sign-in — same anti-hijack treatment as verifyMagicLink, since Google/GitHub
already assert `email_verified` before this branch runs. The
`/auth/oauth-conflict` redirect now applies only to already-verified rows
with a password. Confirmed the `jwt` callback (auth.config.ts ~line 133)
reads `sessionVersion` fresh from the DB immediately after `signIn`
resolves, so the JWT minted for this sign-in already carries the bumped
version — no separate fix needed there.
Not verified: an actual browser OAuth round-trip (mocked unit test only,
`__tests__/auth-config.test.ts`).

### CRITICAL 3 — fixed, commit 250e3d91c
`signup()`'s reclaim delete and the create now share one `$transaction`. The
delete is a guarded `deleteMany({ where: { id, lastLoginAt: null,
emailVerified: null } })` requiring `count === 1`, relying on Postgres
serializing concurrent DELETEs on the same row (the loser's DELETE blocks
until the winner commits, then matches 0 rows) rather than a separate
`SELECT ... FOR UPDATE`. P2002 (unique email — covers the plain
brand-new-email race too) and P2025 from the transaction are mapped to
`EMAIL_EXISTS` in a catch. DB tests: two concurrent signups for the same
brand-new email, and two concurrent signups reclaiming the same abandoned
row — both cases: exactly one fulfills, the other rejects with
`EMAIL_EXISTS`, no 500, exactly one row survives.

### IMPORTANT 4 — DB tests added, commit 250e3d91c
`__tests__/db/s5-signup-reclaim.db.test.ts`: magic-link first verification
→ passwordHash null, 2FA off/cleared, sessionVersion +1 (real DB, real
token via `generateToken`). verifyEmail first verification → password/2FA
KEPT. OAuth first-verification clearing is covered by the mocked unit test
in commit ab2ba2aad (`__tests__/auth-config.test.ts`), not a DB test —
NextAuth's `signIn` callback isn't reachable from the Postgres-only db
tier without mocking `@/server/auth` (see the file's own comment on why);
flagging this as a gap if the controller wants OAuth clearing proven against
real Postgres too.

### IMPORTANT 5 — separate commit 951b08ad9 (`test(server): D-11 — listSites query-count`)
Spies on `prisma.site.findMany`/`prisma.siteAnalytics.groupBy` (the shared
`prisma` singleton has no `log:[{emit:'event'}]` config for a real query
log). Proves exactly 1 groupBy call and 2 site.findMany calls regardless of
matching-site count (tested at 12 and 30 sites), and that the id-scan
findMany's select is `{ id: true }` only.

### IMPORTANT 6 + minors 7, 8, 9 — fixed, commit 1b0424f47
`siteScopeWhere` now returns `Prisma.SiteWhereInput` (was
`Record<string, unknown>`). Extracted `managesWorkspace(role)` as the one
predicate shared by `resolveSiteScope` and `siteScopeWhere` (minor 8).
Reworded `getEffectiveSiteRole`'s stale "override wins" doc comment to
reflect the S-6 cap semantics (minor 7). `sites.service.ts`'s
`byId.get(id)!` non-null assertion replaced with a `flatMap` that skips a
page id gone missing between the id query and the payload fetch (minor 9).

### Minor 10 — test coverage added, commit 1b0424f47
`s9-site-scope-lists.db.test.ts`: added an unscoped NON-ADMIN control case
(EDITOR, 0 SitePermission rows, sees both sites — the existing ADMIN case
alone didn't prove the general "unscoped" rule).
`s6-permission-cap.db.test.ts`: added a direct `getEffectiveSiteRole`
assertion that the EDITOR+VIEWER-override case resolves to the literal
string `"VIEWER"`, not just that `checkSiteRole(EDITOR)` rejects.

### Minor 11 — complete touched-files list (was missing 5 files)

Production files touched, base e143ffbaf..HEAD (`git diff --stat`):

- `server/auth.config.ts` — CROSS-LANE (outside `server/services/*` /
  `server/trpc/routers/*`, this lane's stated ownership pattern). CRITICAL 2 +
  CRITICAL N1 (OAuth first-verification clearing, GitHub email trust,
  account.upsert ownership guard).
- `server/services/auth.service.ts` — S-6 is elsewhere; S-5 (signup reclaim,
  verifyEmail/verifyMagicLink).
- `server/services/dashboard.service.ts` — S-9 (siteScopeWhere in
  getDashboardStats/getRecentSites).
- `server/services/domain.service.ts` — S-9 (listWorkspaceDomains).
- `server/services/permission.service.ts` — S-6 (roleOverride cap) + S-9
  (siteScopeWhere, shared predicate).
- `server/services/site-component.service.ts` — S-9 (listWorkspaceComponents).
- `server/services/sites.service.ts` — A-10 (transferSite) + S-9/D-11
  (listSites scoping + traffic-path SQL aggregate).
- `server/services/team.service.ts` — B-5 (emailFailed reporting, resend
  send-before-bookkeeping).
- `server/services/workspace-transfer.service.ts` — S-5 (acceptTransfer
  DB-verified emailVerified check).
- `server/trpc/routers/account.ts` — S-5 (EMAIL_NOT_VERIFIED mapping for
  acceptTransfer).
- `server/trpc/routers/auth.ts` — S-5 (acceptInvite DB-verified emailVerified
  check).
- `server/trpc/routers/dashboard.ts` — S-9 (threading userId to
  getDashboardStats/getRecentSites).
- `server/trpc/routers/site-component.ts` — S-9 (threading userId to
  listWorkspaceComponents).
- `server/trpc/routers/site-detail.ts` — S-9 (threading userId to
  listWorkspaceDomains).
- `server/trpc/routers/sites.ts` — S-9 (threading userId to listSites).
- `server/trpc/routers/team.ts` — B-5 (INVITE_EMAIL_FAILED mapping).

All of `server/services/*` / `server/trpc/routers/*` above ARE this lane's
stated ownership pattern (`server/services/{...,auth,team,permission,sites,
dashboard}*`, `server/trpc/routers/{auth,team,sites,domains,site-components}*`)
— not cross-lane. `server/auth.config.ts` is the one genuine cross-lane file,
made on binding controller instruction both rounds.

Test files touched: `__tests__/auth-config.test.ts`,
`__tests__/dashboard-service.test.ts`,
`__tests__/dashboard-stats.regression-1.test.ts`,
`__tests__/permission-service.test.ts`, `__tests__/sites-service.test.ts`,
`__tests__/team-service.test.ts`,
`server/services/__tests__/component-usage.test.ts`,
`__tests__/db/helpers.ts`, and the `__tests__/db/*.db.test.ts` files named
throughout this report.

### Deferred 12 — not done, per controller instruction
`routers/auth.ts:285` router→Prisma read (pre-existing pattern) — left as
is.

### A real bug found and fixed while closing out IMPORTANT 6/9: `enrich()` return-type collapse
Commit 41042aab6. Running the required `npx tsc --noEmit -p packages/dashboard`
found 34 NEW errors (0 before this lane's S-9/D-11 commit, 4170d85ac) — every
dashboard consumer of `sites.list`'s output (`app/dashboard/projects/page.tsx`,
`components/clients/client-detail-view.tsx`, `components/search/command-palette.tsx`,
`components/team/invite-modal.tsx`, `components/templates/use-template-modal.tsx`)
broke because `listSites`'s `enrich()` helper's parameter type mixed named
fields with an index signature, which collapses TS's rest-destructuring
inference to just `{ domain, visitors30d }`. Retyped `site` with a
Prisma-derived payload type (`Prisma.SiteGetPayload<{ select: typeof
SITE_SELECT }>`) instead. Re-ran the full dashboard tsc after the fix: 0
errors, byte-diff confirmed against the pre-fix error list (all 34 gone,
nothing new). This is exactly the kind of regression the controller's
"run the dashboard tsc, it introduces no new errors" instruction was for —
would not have been caught by any of this lane's own test files.

## Fix-round test commands + outputs

- `npx vitest run --maxWorkers=2 __tests__/permission-service.test.ts __tests__/auth-service-signup-email.test.ts __tests__/auth-service-login.test.ts __tests__/auth-config.test.ts __tests__/sites-service.test.ts` → 5 files, 50 passed.
- `npx vitest run --config vitest.db.config.ts --maxWorkers=2` (full db suite, run twice — once before and once after the enrich() fix) → both runs: 7 files, 25 passed + 1 expected-fail (save-race.db.test.ts's pre-existing `it.fails` for A-2, unrelated to this lane).
- `npx tsc --noEmit -p packages/dashboard/tsconfig.json` — run twice. First run (before the enrich() fix): 34 errors, all `{domain,visitors30d}`-shape (the regression above). Second run (after the fix): 0 errors.
- Per the controller's resource rule (shared machine swapping, load 400+): no full-repo vitest run was attempted this round; only touched files + the full db suite + the one dashboard tsc, all with `--maxWorkers=2` where applicable.

## Fix-round-2 test commands + outputs (resource rule: `--maxWorkers=2`, touched files + `pnpm test:db` only, no full-repo/tsc-full runs)

- `npx vitest run --maxWorkers=2 __tests__/auth-config.test.ts` → 1 file, 17 passed (13 pre-existing + 4 GitHub userinfo tests, then re-run again after the signIn/account-upsert changes with the full 17-test file including the new signIn/upsert-guard tests → still 17 passed after those were added incrementally).
- `npx vitest run --maxWorkers=2 __tests__/auth-service-signup-email.test.ts __tests__/auth-service-login.test.ts` → 2 files, 7 passed (unaffected by the C3 in-tx hardening — these tests never exercise the `existing` reclaim branch).
- `npx vitest run --config vitest.db.config.ts --maxWorkers=2 __tests__/db/s5-signup-reclaim.db.test.ts` → 1 file, 9 passed (after the C3 hardening — confirms the reclaim-refusal and concurrent-signup-race tests still pass with the checks now duplicated inside the tx).
- `npx vitest run --maxWorkers=2 __tests__/auth-config.test.ts __tests__/auth-service-signup-email.test.ts __tests__/auth-service-login.test.ts __tests__/permission-service.test.ts __tests__/sites-service.test.ts` (final consolidated run, all round-2 changes in) → 5 files, 59 passed.
- `npx vitest run --config vitest.db.config.ts --maxWorkers=2` (full db suite, final run) → 7 files, 25 passed + 1 expected-fail (same pre-existing A-2 `it.fails`, unrelated).
- Dashboard tsc: NOT re-run this round per the resource rule ("run the dashboard tsc once at the end" was round 1's instruction and was satisfied then, 0 errors after the enrich() fix in commit 41042aab6; round 2's changes touch server/auth.config.ts and auth.service.ts only, neither of which the dashboard consumes through a type-changing export — `AuthError`, `signup`'s return shape, and `createWorkspaceForUser`'s signature are all unchanged).

## Fix-round-3 test commands + outputs (resource rule: `--maxWorkers=2`, touched files + `pnpm test:db` only)

- `npx vitest run --maxWorkers=2 __tests__/auth-config.test.ts` (after the account-first restructure + test rewrite) → 1 file, 18 passed.
- `npx vitest run --config vitest.db.config.ts --maxWorkers=2 __tests__/db/auth-config-account-first.db.test.ts` (new file alone) → 1 file, 2 passed.
- `npx vitest run --config vitest.db.config.ts --maxWorkers=2` (full db suite, final round-3 run) → 8 files, 27 passed + 1 expected-fail (same pre-existing A-2 `it.fails`, unrelated).
- `npx vitest run --maxWorkers=2 __tests__/auth-config.test.ts` (final re-confirm after the commit) → 1 file, 18 passed.
- No dashboard tsc this round — server/auth.config.ts's exported shape
  (`authConfig`) is unchanged; only its `signIn` callback's internal control
  flow moved, and `__tests__/db/helpers.ts`'s new `createTestAccount`
  export is additive. Not consumed by dashboard code.

## Known gap
IMPORTANT 4's OAuth-clearing case is proven only by a mocked unit test
(`__tests__/auth-config.test.ts`), not a DB test — flagged above.

## 1. S-6 (P0-6) resolver cap — fixed 3766a978a

`getEffectiveSiteRole` (server/services/permission.service.ts) now returns the
lower-ranked of `member.role` and this site's `roleOverride` by ROLE_RANK
(tie keeps the override), per PD-6. A workspace demotion now takes effect on
every site immediately, instead of a stale higher-ranked SitePermission row
silently outranking it.

Tests: flipped `__tests__/permission-service.test.ts:66` (was pinning the
bug) and added a second cap-direction case. DB tier:
`__tests__/db/s6-permission-cap.db.test.ts` — VIEWER+EDITOR-override and
EDITOR+VIEWER-override, both FORBIDDEN via `checkSiteRole(..., "EDITOR")`
against real Postgres.

Not verified: the ledger's browser runtime_check (invite → demote → editor
UI goes read-only → devtools mutation returns 403) — DB-tier only, no browser
session available here.

## 2. S-5 (P0-5) non-destructive reclaim + verified-only invite/transfer — fixed 9d8272bf4

- `signup()` reclaim (server/services/auth.service.ts) now requires
  `lastLoginAt === null` AND the user owns no site AND no owned workspace has
  another member; otherwise `EMAIL_EXISTS`, rows intact. `lastLoginAt` is set
  only by `login()`/OAuth, never by signup, so it's a sound proxy.
- `acceptInvite` (server/trpc/routers/auth.ts) and `acceptTransfer`
  (server/services/workspace-transfer.service.ts) now read `emailVerified`
  from the DB, not the session, and refuse (FORBIDDEN / EMAIL_NOT_VERIFIED —
  mapped in server/trpc/routers/account.ts) when unverified.
- `verifyEmail` and `verifyMagicLink` (auth.service.ts) now clear
  `passwordHash`, disable 2FA, and bump `sessionVersion` in the same
  transaction when the row was previously unverified — anti
  pre-account-hijack per PD-5, applied to BOTH verification paths (the
  ledger's decision_free_fix text names both; the risk_notes example happens
  to describe only the magic-link case, but the text and my task brief's PD-5
  restatement are unconditional — see note below).

Tests: `__tests__/db/s5-signup-reclaim.db.test.ts` (reclaim refusal with
login+site intact, refusal with another workspace member, still-reclaims a
genuinely abandoned row, acceptInvite FORBIDDEN when DB-unverified /
succeeds when DB-verified via `authRouter.createCaller`). Added
`createTestInvite` + `"invite"` to the truncation map in
`__tests__/db/helpers.ts`. Existing `__tests__/auth-service-signup-email.test.ts`
and `__tests__/auth-service-login.test.ts` unaffected (mocked `existing: null`
path, never reaches the new reclaim branch).

**Flag for controller**: the password/2FA-clearing behavior on first
verification is a real UX cost for the ordinary signup→verify-email flow (a
brand-new user who verifies via the emailed link, not a magic link, also
loses the password they just set and must reset it). I implemented it
literally per the ledger text and the task brief's unconditional PD-5
line, but the risk_notes only describe the magic-link scenario. Worth a
second look before this reaches users broadly.

Not verified: browser runtime_check (real signup/login/magic-link/invite
flow end to end) — DB-tier only.

## 3-4. S-3, S-4 — belong to lane L1a-2 (not touched).

## 5. A-10 transfer scope — fixed e8474dd1f

`transferSite` (server/services/sites.service.ts) now only preserves a
SitePermission row for the previous owner when they were ALREADY scoped
(`_count.sitePermissions > 0`); an existing override is left untouched on
update instead of being overwritten with `"EDITOR"` every transfer.

Tests: `__tests__/db/a10-transfer-scope.db.test.ts` — an unscoped EDITOR
keeps full access to a second site after transferring the first (0 new
SitePermission rows, `checkSiteRole` resolves); a scoped creator's existing
VIEWER override survives the transfer unchanged.

Not verified: browser runtime_check (dashboard site-settings transfer UI +
`/edit/Y` access) — DB-tier only.

## 6. S-9 siteScopeWhere — fixed 4170d85ac

Added `siteScopeWhere(db, userId, workspaceId)` to permission.service.ts
(same rule as `resolveSiteScope`: `{}` for ADMIN/OWNER or unscoped member,
`{ id: { in: [...] } }` for a scoped member) and spread it into all 5 call
sites: `listSites` (signature now takes `userId`), `getDashboardStats`,
`getRecentSites`, `domain.service.listWorkspaceDomains`,
`site-component.service.listWorkspaceComponents`. Threaded `userId` through
each router call site (`sites.ts`, `dashboard.ts`, `site-detail.ts`,
`site-component.ts`).

Tests: `__tests__/db/s9-site-scope-lists.db.test.ts` — a member scoped to
site S1 (of S1+S2) sees only S1 in all 5 lists; an unscoped ADMIN control
case sees both. Updated mocked unit tests for the new
`workspaceMember.findFirst` call and the signature changes:
`__tests__/sites-service.test.ts`, `__tests__/dashboard-service.test.ts`,
`__tests__/dashboard-stats.regression-1.test.ts`,
`server/services/__tests__/component-usage.test.ts`.

Not verified: browser runtime_check (dashboard as a scoped member, sites.list
network payload) — DB-tier only.

## 7. D-11 (listSites SQL aggregate part only) — fixed 4170d85ac (same commit as S-9)

`listSites`'s `hasTraffic`/`sort=traffic` path no longer fetches every
matching site's full payload (domains + every analytics row) to reduce() the
visitor sum in JS regardless of page. It now: (1) fetches matching ids in DB
order, (2) one `siteAnalytics.groupBy` aggregate for their 30-day visitor
sums, (3) filters/sorts/paginates the id list in memory, (4) fetches the full
payload only for the resulting page of ids.

Tests: `__tests__/db/d11-list-sites-traffic.db.test.ts` — `hasTraffic`
buckets (including a site with zero analytics rows, which must count as
"none"), and `sort=traffic` pagination across two pages. This pins the
OUTPUT only.

Not verified: the ledger's specific runtime_check ("Prisma query log shows
one aggregate query and no per-site analytics fetch") needs a query
log/EXPLAIN — not captured here; only correctness was verified. D-11's other
two locations (editor versionSync.ts PD-45, cmsSync.ts N+1) are out of this
lane's scope (server sites.service.ts listSites part only) and remain PARTIAL.

## 8. B-5 (server part) — fixed bef8a0986

- `inviteMembers` (server/services/team.service.ts) collects `emailFailed:
  string[]`, `console.error`s each failure with the invite id, and returns
  `{ sent: toInvite.length - emailFailed.length, skipped, emailFailed }`. The
  invite row is still created either way.
- `resendInvite` now sends BEFORE any bookkeeping write; only a successful
  send bumps `resendCount`/`expiresAt`. A failed send throws
  `INVITE_EMAIL_FAILED`, mapped in server/trpc/routers/team.ts to a
  `BAD_GATEWAY` TRPCError.

Tests: `__tests__/team-service.test.ts` — `inviteMembers` with one send
failure (emailFailed populated, sent excludes it, both invite rows still
created); `resendInvite` success (send-then-bump) and failure
(`INVITE_EMAIL_FAILED` thrown, `resendCount` never touched, mocked
`sendTeamInviteEmail` rejection).

**Cross-lane edits (out of my file ownership, NOT made — flagging for the
dashboard-UI lane)**: `packages/dashboard/app/dashboard/settings/team/page.tsx`
(the invite toast — currently reads only `result.sent`, needs to also read
`emailFailed` and toast a warning) and
`clients/client-detail-view.tsx:215` (same `team.invite` call, same gap).
PD-28's "Copy invite link" fallback is unaddressed (per ledger, needs its
own decision).

Not verified: browser runtime_check (break SMTP, invite via UI, resend via
UI) — DB-tier/mocked-unit only, and the UI half isn't wired yet (see above).

## Lane gate

- `npx vitest run --config vitest.db.config.ts` (full db suite, all files
  together): 6 files / 17 passed + 1 expected-fail (save-race.db.test.ts's
  pre-existing `it.fails` for A-2, unrelated to this lane) — green, run
  multiple times for stability (one transient Postgres connection blip on an
  early run, not reproducible, unrelated to code changes).
- Targeted `npx vitest run` over every unit test file touched (permission-service,
  auth-service-signup-email, auth-service-login, e2e-frontend-gaps,
  db-data-flows, sites-service, dashboard-service, dashboard-stats.regression-1,
  component-usage, site-component-scope-library, site-detail-domains-s2,
  team-service): all green.
- `npx tsc --noEmit -p .` (root, full repo): 3390 errors total, but every
  error touching a file this lane edited is one of two pre-existing classes:
  (1) `Cannot find module '@server/services/...'` / `'@buildrik/shared/schemas/...'`
  — a path-alias config gap in the root tsconfig (present for the whole repo,
  not just my files; `packages/dashboard/tsconfig.json` and `vitest.config.ts`
  resolve these fine), and (2) `server/trpc/routers/auth.ts:122,210` — two
  type errors at lines confirmed byte-identical to base
  (`git show e143ffbaf:server/trpc/routers/auth.ts` lines 110-135 match
  current file exactly), well outside every diff hunk this lane touched.
  No new tsc error was introduced by this lane's changes. The machine was
  running 6+ concurrent audit-fix lanes' full builds during this check
  (heavy load, several `buildrik-af-L*` tsc/vitest processes visible in
  `ps aux` at the same time), which is why this took unusually long.
- Full-repo `npx vitest run` was started but not waited out — the shared
  machine's contention (see above) made it impractically slow, and it exceeds
  what the gate requires (targeted files + full db suite, both green, already
  satisfy "every test directory you touched"). Not treated as a gate failure;
  flagging as NOT independently verified if the controller wants a true
  full-repo run.
- `pnpm run verify:ds`: not run — this lane touched no editor chrome or
  dashboard UI files.
