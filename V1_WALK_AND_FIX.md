# V1 Walk-and-Fix — Iteration Log

**Spec:** `docs/v1-walk-and-fix-design.md`
**Status:** Loop active. Day 0 setup complete.

## Locked walk script

```
1. dashboard login: qa@buildrik.local / qa-test-1234 (seeded via prisma/seed.ts)
2. dashboard → create site "test-site-N" (N = iteration number)
3. click "Open in editor"
4. editor: add Section → add Heading → add Image (from media tab) → add Button → save
5. editor: Publish dropdown → publish to Vercel
6. wait for live URL → open in new tab → verify 4 elements visible
7. close editor → reopen → verify 4 elements still present
```

## Triage rules

| Severity | Definition | Loop action |
|---|---|---|
| P0 — crash | console.error or uncaught exception breaks flow | Stop. Fix this iteration. |
| P0 — data loss | User edit doesn't persist after save | Stop. Fix this iteration. |
| P1 — flow break | Step fails but workaround exists | Fix after all P0 drained. |
| P2 — cosmetic / slow | Looks bad, works | Log to V1_POST_DEFERRED.md. Out of v1 scope. |

## Iterations

(Iteration entries appended below, newest at bottom.)

## Iteration 1 — 2026-05-18

- Walk: **1/7 steps attempted, 0 passed.** Blocked at Step 1.
- Environment caveat: claude-in-chrome extension UI bleeds into snapshots (MCP/Webhooks panel injected as `@e31+` refs). Did not affect 403 finding below — pure environment noise. Future walks should run in extension-free profile.

### P0 blockers

**P0-1: Login flow blocked at Step 1 — Continue button doesn't progress past email**

- Repro: navigate to `http://localhost:3000/auth`, fill email field with `qa@buildrik.local` (seeded account from `prisma/seed.ts`), click `Continue` button.
- Observed:
  1. First click via @ref returned: `Selector matched multiple elements. Be more specific or use @refs from 'snapshot'.` (browse-binary side effect — but click did register, page state changed)
  2. Pressed Enter on email field as fallback. Page advanced enough to disable Continue button (`@e9 [button] "Continue" [disabled]`).
  3. Console emitted: `[error] Failed to load resource: the server responded with a status of 403 (Forbidden)` at exactly the time of submit.
  4. URL stayed at `http://localhost:3000/auth` — no navigation to password step, magic-link sent state, or dashboard home.
  5. Network log shows no successful auth POST — server rejected the submission.
- Impact: User cannot login. Walk steps 2-7 (site create, editor open, edits, publish, persistence) all gated on login and unreachable.
- Severity rationale: console.error + flow continuation blocked = P0 per triage rules.

Screenshot: `packages/editor/src/.gstack/qa-reports/screenshots/01-auth-after-continue.png` (shows form still on email step after submit attempt).

### Other findings (not blocking Iteration 1)

- **P2 cosmetic**: Continue button is red, but DESIGN.md says single accent = cobalt `#2D6DFF`. Off-brand. Defer to `V1_POST_DEFERRED.md` post-v1.
- **P2 a11y**: Console warning `Missing 'Description' or 'aria-describedby={undefined}' for {DialogContent}`. Radix UI complaint. Defer.
- **P2 cosmetic**: Cookie consent banner (`Accept All` / `Essential Only` / `Manage Preferences`) overlays bottom of page on first visit. Could block clicks on full-width footer elements. Defer.

### Commit (none yet — fix not started)

### Re-walk (pending fix)

### Next blocker

User to pick: P0-1 is the only P0. Default = fix it.
