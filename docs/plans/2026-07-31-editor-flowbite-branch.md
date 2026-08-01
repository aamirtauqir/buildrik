# `editor-flowbite` — the merge-ready, editor-only branch

Created 2026-07-31 from merge-base `ccddd1a5`, by founder decision: ship the editor
migration on its own, leave everything a parallel session put on `flowbite-bigbang`
behind.

## What is on this branch

Only the editor Flowbite migration:

- `packages/editor/**` — byte-identical to the fully-verified `flowbite-bigbang` tree
  (`git diff flowbite-bigbang -- packages/editor` is empty).
- The arc's plan/outcome docs under `docs/plans/`.

## What was deliberately left off

Everything a parallel session landed on the same branch. All of it reverted to its
`ccddd1a5` state here, and all of it still lives on `flowbite-bigbang`:

| Left behind | Why it matters |
|---|---|
| `prisma/migrations/20260731152036_session_version_and_sessions_userid_index` + `schema.prisma` | A schema change (`users.sessionVersion`, `sessions.userId` index). Hard to reverse once run. |
| `server/auth.config.ts`, `server/services/**`, `types/next-auth.d.ts` | JWT session-revocation mechanism. |
| `server/trpc/**`, `packages/shared/**`, billing/Stripe service + tests | Cancel/reactivate flow changes. |
| `packages/dashboard/**` | The dashboard's own Flowbite reskin, including the `#406ED6 → #1A56DB` accent flip. |
| Root `CLAUDE.md`, `DESIGN.md`, `TODOS.md` | Edited by that session for the accent flip. |

None of it was reviewed or tested by this arc. It should ship on its own branch, with
its own review.

## The one dependency the next person must not miss

`flowbite-react` keeps its prefix in a **module-level singleton shared across packages**
(`dist/store/index.js` is a plain `const store = {...}`). This editor sets it to `tw` at
import time (`chrome-ui/flowbiteStore.ts`, side-effect-imported by `AquibraStudio.tsx`)
because the canvas mounts customer site HTML in the same document and unprefixed
utilities would collide with customer classnames.

At `ccddd1a5` the dashboard had **zero** Flowbite files, so on this branch there is
nothing to collide with — verified, not assumed (`git grep -l flowbite-react ccddd1a5 --
packages/dashboard` → 0).

**The moment the dashboard's Flowbite work merges, the collision is live:** the editor
flips the shared prefix, the dashboard's own components render classes it never compiled,
and browser-Back leaves the whole dashboard unstyled until a hard refresh. The fix already
exists on `flowbite-bigbang` (commits `281e6754` + `447f06b6`) — dashboard config
`prefix: "tw"`, a prefixed class-list, its own `flowbiteStore.ts`, and a separate
`app/tw-flowbite.css` entry (a second `@import` inside `globals.css` silently broke
Turbopack's content detection — found by build, not by reading). **Whoever merges the
dashboard reskin must bring those two commits with it.**

## Verification on this branch

- `npx tsc --noEmit` — clean.
- `npx vite build` — succeeds.
- `bash scripts/ds-grep-gates.sh` — 0 failures; `gate:chrome-ui-surface` (ERROR mode) and
  `gate:editor-ui-gone` both pass.
- Full editor suite — see the arc outcome doc; the same tree passed 0 failed / 7931 passed
  on `flowbite-bigbang`, and is re-run here.

## Where the full record lives

`flowbite-bigbang` keeps the complete commit-by-commit history (68 editor commits, every
task review, three gate bugs found and fixed by planted negative tests). This branch is the
shippable subset, not a replacement for that record.
