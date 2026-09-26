# Follow-up plan: C-5 — collaboration engine (replace vs repair)

Ledger ID: C-5. Status at time of writing: OPEN, guarded (not fixed) by S-12.

## Goal

Decide whether Buildrik's real-time collaboration engine
(`packages/editor/src/engine/collaboration/{CollaborationManager,OTEngine,
OTTypes,SSETransport}.ts`, `server/services/collab.service.ts`, the
`/api/collab/[siteId]/ops` and `/api/sse/collab/[siteId]` routes) is repaired
in place or replaced, and land whichever path behind a two-client test
harness that can actually prove convergence — not just unit-test the OT
transform functions in isolation.

**Done condition:** two browser sessions, same site, same page, concurrent
edits (text insert + style change on the same element, then a delete/insert
race) converge to the same document on both sides within the SSE reconnect
window, verified by the two-client harness below, not by eyeballing one
session.

## Why deferred

- PD-37 (replace with CRDT vs. server-authoritative vs. repair the existing
  OT engine) is unanswered and the plan explicitly says not to patch
  individual defects in the meantime — doing so would make a known-divergent
  engine look closer to shippable while the collab routes stay reachable in
  production regardless of the client feature flag.
- The engine has known structural problems beyond one bug: `SSETransport.ts`
  freezes its reconnect URL's `since=lastSeq` at construction, registers no
  `resync` handler, and its `hello` handler ignores the server's head
  sequence — so a dropped connection can silently resume from a stale
  cursor. This is a class of bug (missing resync semantics), not a
  one-line fix.
- No two-client test harness exists. `OTEngine.test.ts` and
  `CollaborationManager.test.ts` test the transform functions against
  hand-built op pairs; nothing runs two simulated clients against a shared
  server-side op log and asserts convergence. Building that harness is
  useful under EITHER outcome of PD-37 (it gates a CRDT rewrite's
  correctness too), so it can be built now, before the decision.
- `packages/editor/CLAUDE.md` names 6 known OT bugs and says collab is
  "demo-only (last-write-wins, 6 known OT bugs)" — `NEXT_PUBLIC_FEATURE_COLLAB`
  must stay off in production regardless of this plan's outcome until it is
  resolved.

## What landed instead (S-12, in the audit-fix branch)

- `/api/collab/[siteId]/ops` and `/api/sse/collab/[siteId]` 404 unless a
  server env flag (`COLLAB_ENABLED=true`) is set.
- Op payloads are zod-validated and reject `__proto__`/`constructor` keys.
- This closes the "reachable in production regardless of the client flag"
  gap without touching engine correctness.

## Decisions needed (founder / PD-37)

1. **Replace vs. repair.** Options, roughly in ascending cost:
   - (a) Repair the existing OT engine: fix the SSETransport resync gap,
     audit and fix the other 5 known bugs, keep last-write-wins semantics
     for genuine conflicts.
   - (b) Replace the transform layer with a CRDT (e.g. Yjs) while keeping
     the existing transport (SSE + ops POST) as the sync channel.
   - (c) Replace both the transform layer and the transport with a
     purpose-built collab service (e.g. Yjs + y-websocket, or a hosted
     CRDT backend).
2. **Server-authoritative vs. peer-merge.** Does the server ever resolve
   conflicts (rebasing ops against the current head), or does every client
   resolve independently against the same op log? This affects whether
   `server/services/collab.service.ts` needs real logic or stays a
   pass-through log.
3. **Scope of what ships first.** Text + style ops only, or also structural
   ops (element move/delete/reorder) which are the ones OT historically
   gets wrong (tree-shape conflicts).

## Proposed tasks (once PD-37 lands)

1. **Two-client harness** (buildable now, decision-independent): an
   in-memory transport double that two `CollaborationManager` instances
   share, driving the 11 scenarios named in A20-4 (concurrent insert,
   concurrent delete, insert-into-deleted-range, concurrent style on the
   same property, concurrent move of the same element, etc.). Lives at
   `packages/editor/src/engine/collaboration/__tests__/twoClient.harness.ts`.
2. **Fix or replace the transform layer** per the PD-37 answer.
3. **Fix `SSETransport`'s resync path**: accept the server's head sequence
   on `hello`, add a `resync` handler, and recompute the reconnect URL's
   `since` param on each reconnect attempt instead of freezing it at
   construction.
4. **Wire `server/services/collab.service.ts`** to whatever conflict model
   PD-37 picks (log-replay pass-through, or rebase-on-write).
5. **Flip `NEXT_PUBLIC_FEATURE_COLLAB`** to true in a canary workspace only
   once the harness's 11 scenarios are green, then staged rollout.
6. **Re-verify `HistoryManager.ts`** interaction: undo/redo across a
   collab session is a separate correctness axis (whose op is undone when
   two clients have interleaved ops) — needs its own scenario in the
   harness.

## Risks

- A CRDT swap changes the wire format and the persisted op log shape —
  existing in-flight sessions and any persisted op history need a
  migration or a hard cutover.
- Structural ops (move/delete of elements with children) are the highest-risk
  case for either OT or CRDT; do not ship those until the harness covers
  them explicitly.
- `packages/editor/CLAUDE.md`'s "AquibraStudio.tsx mid-edit in the founder's
  tree" trap applies here too if collab touches shell wiring — coordinate
  before staging changes.
