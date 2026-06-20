# User-feedback → prioritized fix plan — 2026-06-21

First real user research on Buildrik (the learner ran it — Habit 2). Raw verbatim was harsh
("not easy to use", "interface not user-friendly", "no idea if a process errored or
succeeded", "broken features e.g. collaboration", "even where the backend exists it isn't
integrated with the front end", "it's shit", "make another version"). Below: that pain turned
into named, rated, fixable findings — and the strategic read.

## The strategic read (most important)
Two complaints, taken together, name the real problem:
- **"No idea if a process errored or succeeded"** → the UI has no system-status feedback.
- **"Backend exists but isn't integrated with the front end"** → capabilities exist but aren't reachable/wired.

→ **The product is HALF-WIRED, not broken.** The hard half (backend) largely exists. What's
missing is the front-end completion: (a) show every action's state, and (b) connect backend
capabilities to the UI. So working things *feel* broken. **This is finishing, not rewriting.**
A rewrite would discard the working backend and repeat the same UI mistakes. Users saying
"make another version" describe a feeling (it's hard/broken), not a technical prescription —
users report pain, they don't design fixes.

## Findings (rated; severity = frequency × impact × persistence)

| ID | User pain | Root cause | Severity | Fix (and why it's tractable) |
|----|-----------|-----------|----------|------------------------------|
| UF-1 | "No idea if a process errored or succeeded" | No success/error/loading feedback — Heuristic #1 Visibility of system status; constitution #2 (one status, one truth) + #13 (design every state) | **Critical** — makes even working flows feel broken; hits every action; persists | Add a consistent feedback layer: toast/inline status for every action (save, publish, upload, delete, AI, invite…). Use the [states checklist](../learning/product-design/reference/states-checklist.html). Highest ROI of anything here. |
| UF-2 | "Backend exists but front end isn't integrated" | Ghost / unwired features — capability shipped, UI never connected | **High** — features look missing/broken | Inventory which backend endpoints/services have no UI path; wire each to a control + its states (UF-1). Connection work, not new features. |
| UF-3 | "Collaboration doesn't work" | Real-time collab is integrated but UNSAFE — 6 P1 distributed-systems bugs (prior review, demo-only) | **High bug, not fast to fix** | GATE it (hide behind a flag) until it's production-ready — don't show a broken feature (constitution #3). Real fix = a dedicated OT/CRDT arc (evaluate Yjs), separate from this plan. |
| UF-4 | "Not easy to use / not user-friendly / complicated" | Density, weak grouping, inconsistency across surfaces | **High** (a program, not one fix) | The surface-by-surface redesign already underway (constitution + the loop). Topbar done. Continue, prioritized by where users actually stumble. |

## Execution order (by user impact)
1. **UF-1 — feedback states everywhere.** The single change that stops "it feels broken." Do it as a consistent pattern (one toast/status system), then apply per action.
2. **UF-3 — gate collaboration.** Cheap; removes a visibly-broken feature from sight. Quick win.
3. **UF-2 — wire the ghost features.** Inventory first (which backend things have no UI), then wire one at a time, each with UF-1 states.
4. **UF-4 — continue the redesign**, ordered by observed stumbles, not taste.

## What we need from more research (to sharpen this)
- The exact task users attempted, and the exact screen/button where each got stuck (to make UF-1/UF-2 specific).
- Which specific features were called "broken" — genuinely broken vs unwired vs just confusing.
- How many users, and whether they're real agency operators or friends (weights the signal).

## The reframe, in one line
**Not "make another version." Finish the wiring + show every state + hide what isn't ready + keep redesigning by user pain.** The product isn't shit — it's unfinished, and the expensive half is done.
