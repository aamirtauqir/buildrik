# Follow-up plan: A-21 — presence heartbeat ("also editing" awareness)

Ledger ID: A-21. Status: OPEN. New feature — no decision-free subset exists.

## Goal

Give editors awareness of who else is currently on the same site, so two
people don't silently overwrite each other's work and discover it only
through the post-hoc `ConflictModal`.

**Done condition:** two browser profiles, two users both with EDITOR role
on the same site, both open `/edit/:id`. Within ~30 seconds each session's
header shows "X is also editing." Closing one tab clears that signal for
the other session within the TTL window (~30-60s), verified live, not by a
mocked store.

## Why deferred

- PD-25 (build presence-lite vs. rely on a soft lock) is unanswered, and
  per the ledger there is no meaningful decision-free code fix here — this
  is new product surface, not a bug fix.
- A repo-wide grep for heartbeat/`activeEditors`/"also editing" across
  server, editor src, dashboard app and shared code finds nothing real
  (only unrelated animation and SSE-notification hits) — there is no
  partial implementation to extend.
- Must be built without touching the collab op log (C-5) — presence and
  the collaborative-editing engine are separate concerns that happen to
  live near each other in the shell (`StudioHeader.tsx`), and conflating
  them would couple this plan to C-5's much larger open decision (PD-37).
- Must work on cPanel: no long-lived in-memory state survives across
  Passenger worker restarts/recycling, so a naive in-memory
  `Map<siteId, Set<userId>>` on the Node process is not viable — state
  needs to live in Postgres (or a cache layer if one gets added later).

## Decisions needed (PD-25)

1. **Presence-lite vs. soft lock.**
   - Presence-lite: show who else is viewing/editing, but everyone can
     still write — informational only, matches the "also editing" copy in
     the ledger's evidence.
   - Soft lock: the first editor to touch an element (or the whole page)
     gets a lock; others see a locked indicator and can request/wait.
     Stronger conflict prevention, but a bigger UX and product surface
     (lock timeout, lock release on disconnect, lock override for admins).
2. **Granularity**, if presence-lite: site-level ("2 people on this site")
   or page-level ("X is on the Home page too")? Page-level is more useful
   but needs the heartbeat payload to carry the active page id and update
   on navigation, not just on open.
3. **Whether this ships ahead of or alongside C-5.** Presence-lite doesn't
   need the collab engine to be fixed — it's a much smaller, independent
   feature — so it could ship first as a stopgap while C-5's PD-37 decision
   and rebuild are still pending.

## Proposed tasks (assuming presence-lite, site-level — the ledger's own
recommendation, pending PD-25 confirmation)

1. **Schema:** either a new lightweight table (`SitePresence`:
   `siteId`, `userId`, `lastSeenAt`, unique on `[siteId, userId]`) or reuse
   an existing session-adjacent table if one fits — needs a real Prisma
   migration either way (root CLAUDE.md: "Any Prisma schema change gets a
   new migration ... plus a line in CHANGELOG.md deploy notes").
2. **`sites.heartbeat` protectedProcedure**, gated by the same site-read-
   access check the rest of the editor's site-scoped procedures use (reuse
   `guardSiteAccess`/`guardSiteRole` from `server/trpc/guards.ts`, not a
   new one-off check — this keeps it in step with D-2's resolver
   consolidation work rather than adding a fifth ad-hoc guard).
3. **Client:** `StudioHeader.tsx` polls `sites.heartbeat` every ~20s while
   the tab is visible (use the Page Visibility API to pause polling on a
   backgrounded tab — don't burn a request every 20s from an abandoned
   tab).
4. **TTL-based expiry:** a presence row older than ~30-60s is treated as
   stale by readers (filter in the query, e.g. `lastSeenAt > now() -
   interval '60 seconds'`) rather than requiring an explicit
   disconnect/cleanup job — this is simpler and self-heals if a tab closes
   without firing a cleanup call.
5. **UI:** "X is also editing" in `StudioHeader.tsx`, near where
   `collabOn`/`useCollaboration` presence would render if `FEATURE_COLLAB`
   were on — but this feature works independently of that flag.

## Risks

- A naive per-20s poll from every open editor session is real load at
  scale; make sure the query is cheap (indexed on `siteId`, short TTL
  window) before shipping broadly.
- If PD-25 picks soft-lock instead of presence-lite, this plan's schema
  and polling design still mostly applies, but the UI and the "what
  happens when you try to edit a locked element" flow is a materially
  bigger feature — re-scope task list if that's the answer.
- Coordinate the `StudioHeader.tsx` UI slot with C-5's existing
  `collabOn`-gated presence UI (`useCollaboration`) so the two don't paint
  overlapping "who's here" indicators if both ship.
