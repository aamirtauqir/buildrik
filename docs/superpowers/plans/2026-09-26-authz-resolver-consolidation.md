# Follow-up plan: D-2 — authz resolver consolidation

Ledger ID: D-2. Status: OPEN. Not blocked by a PD — sequenced after S-2..S-10
per the plan, and after this audit-fix branch lands.

## Goal

Replace the four parallel workspace/permission resolvers
(`resolveWorkspaceId`, `requireWorkspace`, a local `getWorkspaceCtx` in
`account.ts` and in `team.ts`, plus `getWorkspaceMember` in
`dashboard.ts`) and the 84 scattered `instanceof PermissionError`
translations across 22 router files with two shared tRPC middlewares:
`workspaceProcedure` and `siteRoleProcedure(min)`.

**Done condition:** every router that currently resolves a workspace or
checks a site role does so through one of the two shared middlewares; a
`grep -rn "instanceof PermissionError"` across `server/trpc/routers/`
returns hits only inside the middleware definitions themselves, not in
individual routers; router role-gate tests (D-14b) pass unchanged in error
code and shape for every migrated router.

## Why deferred

- This is sequenced work, not decision-blocked: the plan explicitly places
  it after S-2..S-10 and after this branch lands, because unifying the
  resolvers changes error codes (`NOT_FOUND` vs `FORBIDDEN`) and
  bearer-token honouring behavior on `marketplace`/`account`/`features`
  routers — a change that needs to be proven safe per-router, one commit
  at a time, against a stable base, not layered on top of an
  already-in-flight audit-fix branch touching many of the same files.
- `cms.ts:31`'s `async function requireRead(ctx: any, siteId: string)` uses
  `ctx: any` — fixing the type alongside the resolver consolidation is
  correct sequencing (fix the type when the function moves, not before,
  to avoid a throwaway type-only commit).
- `auth.ts:261-340`'s `acceptInvite` has an inline `$transaction` that
  should become a service method as part of this same arc (extracting
  `team.service.acceptInvite`), and doing that extraction separately from
  the resolver consolidation would touch the same lines twice.
- Only some routers currently use the partial consolidation that DOES
  exist (`server/trpc/guards.ts`'s `guardSiteAccess`/`guardSiteRole`) —
  this plan's middlewares build on top of that partial work rather than
  replacing it, so confirm `guards.ts`'s current shape hasn't drifted
  before starting.

## Decisions needed

None blocking start. One judgment call per router during migration: which
existing resolver's semantics (bearer-honouring vs. session-only,
`NOT_FOUND` vs `FORBIDDEN` on no-access) is the "correct" one to
standardize on, if two routers currently disagree. Do this router-by-router
with a note in each migration commit, not as an upfront blanket decision —
the ledger explicitly flags this as something to "note any
NOT_FOUND→FORBIDDEN code changes the UI depends on," implying it needs
per-call-site verification, not a global rule.

## Proposed tasks

### Step 1 — build the middlewares, no behavior change yet
1. Add `workspaceProcedure` and `siteRoleProcedure(min)` in
   `server/trpc/trpc.ts`. Both centrally translate `PermissionError` to the
   tRPC error shape and reuse `resolveWorkspaceId`'s bearer-honouring
   `FORBIDDEN` variant (the more complete of the two existing
   `workspaceId` resolvers) as the canonical resolution path.
2. No router changes yet — this step only adds the middlewares and their
   own unit tests (mirroring D-14b's router role-gate test pattern).

### Step 2 — migrate one router per commit
3. Pick the smallest/simplest router first (likely `dashboard.ts` or
   `account.ts`, given they already have local resolvers that map cleanly)
   to prove the pattern, then work through the rest:
   `team.ts`, `cms.ts` (fix the `ctx: any` in the same commit since the
   function moves), `marketplace.ts`, `clients.ts`, `theme.ts`,
   `reviews.ts`, `billing.ts`, `api-tokens.ts`, `site-component.ts`,
   `pages.ts`.
4. Delete each router's local resolver helper as it migrates. Delete
   `require-workspace.ts` entirely once `marketplace.ts` (its last known
   consumer per the ledger) is migrated.
5. For each router: confirm error codes match pre-migration behavior (or
   document + verify a deliberate change), run that router's D-14b
   role-gate tests, and do a browser spot-check per the ledger's
   `runtime_check` (a VIEWER account on `/dashboard` gets the same
   denied-state UI on team invite and CMS write before and after).

### Step 3 — service extraction
6. Extract `team.service.acceptInvite(userId, token)` from
   `auth.ts:261-340`, moving the inline `$transaction` into the service
   layer per root CLAUDE.md's Page → Router → Service → Prisma chain (the
   router currently doing its own `$transaction` violates "Routers call
   services. Never touch Prisma directly").
7. Extract an `integrations.service` for the 7 direct Prisma calls
   currently in `integrations.ts`, same reasoning.

### Step 4 — cleanup
8. Once every router is migrated, `guards.ts`'s `guardSiteAccess`/
   `guardSiteRole` either get folded into `siteRoleProcedure` (if they're
   now redundant) or stay as the lower-level primitives the middleware is
   built on — decide based on what step 1-3 actually produced, not
   upfront.

## Risks

- Error-code changes are the primary risk: a client that pattern-matches
  on `NOT_FOUND` vs `FORBIDDEN` (or a specific error message) will break
  silently if a router's resolved code changes. Search the dashboard app
  for `error.data?.code ===` / `TRPCClientError` handling per migrated
  router before merging that router's migration.
- Do this strictly one router per commit — the ledger's own risk note
  says so, and D-14b's role-gate tests are the proof each migration is
  equal; landing multiple routers in one commit makes a regression
  unbisectable.
- Land D-14b (router role-gate tests) BEFORE starting router migrations if
  it hasn't already, per the ledger's explicit ordering note.
