# Phase 2 lane brief (design-2l9)

You are lane **L-<X>** of the design-2l9 plan. Read, in this order:
1. Plan: `docs/superpowers/plans/2026-10-22-implement-2l9-design.md` — Global Constraints, Review Focus, Manifest schema, Phase 2 (lane table, integration), Budget. The accepted-obligation lists at the end: later lists win.
2. `packages/editor/docs/design-2l9/gap-inventory.md` (owner-decision defaults OD-1..OD-4 and lead auto-decisions) and your inventory file(s) under `inventory/`.
3. `packages/editor/docs/design-2l9/REQUESTS.md` (files you may not edit) and `packages/editor/CLAUDE.md`, the AGENTS.md of every folder you touch.

## Setup
- Worktree `~/Desktop/buildrik-worktrees/design-2l9-lane-<x>` on new branch `feat/design-2l9-lane-<x>` from `feat/design-2l9` (`git -C /Users/shahg/Desktop/pencil/buildrik worktree add ...`). `pnpm install --frozen-lockfile`.
- Never `git stash`. Never edit or stage `packages/editor/src/editor/shell/AquibraStudio.tsx`. Lead-owned files (`Topbar.tsx`, `StudioHeader.tsx`, `PageSwitcher.tsx`, `BottomBar.tsx`, `BreakpointSwitcher.tsx`, `InspectorHeader.tsx`, `StudioPanels.tsx`, `shell/hooks/*`, `src/engine/`) — do not edit; add a numbered entry to `REQUESTS.md` in your branch instead.
- Stay inside your owned paths (plan lane table). A server change goes through the full chain (shared Zod schema in `packages/shared/schemas` → service → router → client) with tests, and only when the row needs it.

## Work
1. Write your sub-plan `docs/superpowers/plans/2026-10-26-design-2l9-lane-<x>.md`: archetypes from your inventory ordered by user impact (Play-journey steps first, then the largest drift clusters), each with files, failing tests, and the board copy it adopts. List your `code-ahead` rows with a disposition. Commit it first.
2. Execute it with THE LOOP, smallest shippable slices, one commit per archetype (tests rewritten when they protected the old design; commit body "re-baseline: <surface>" when pins change). Board = visuals and copy; code contract = behaviour (`authority: code:<reason>` when code wins). Board sample data is never copied.
3. After each slice update the manifest rows in `packages/editor/scripts/conformance/boards-2l9.json` you closed: `verified: "drift-fixed"` only if you compared the result against the board (probe screenshot or live) — say how in `verifiedNote`; otherwise leave `drift-open` and note "built, not compared".
4. Light verification (owner preference): targeted vitest per slice; `npx tsc --noEmit > /tmp/tsc-<x>.log; echo $?` = 0 and `pnpm run verify:ds` before each commit batch; Playwright probe pins only for new visual states, on a SAFE private port via a temporary config you delete (your probe port: L-A 5171, L-B 5172, L-C 5173, L-D 5174, L-E 5175, L-F 5176; never 5060/5061). The 17 old pins in `visual-pins.spec.ts` already fail on main: do not re-baseline them. Do not start a Next dev server (the lead does live walks on the integration branch).
5. Commit early and often. Messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No `--no-verify`, no push.

## Stop and report when
- your sub-plan is done, or
- you have shipped ~10 archetype commits (report and stop; the lead merges and re-dispatches), or
- you hit an owner decision (record it in your sub-plan as `blocked:owner-<topic>` and continue with the rest).

Report (<400 words): branch, commits, archetypes closed (row counts), rows left, owner decisions raised, requests filed, tests/tsc/verify results.
