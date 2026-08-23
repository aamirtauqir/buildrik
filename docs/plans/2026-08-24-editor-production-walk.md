# Editor → production: the whole walk

> Founder goal, 2026-08-23: walk every flow and gap, make every feature match
> the PRD, make the UI and IA excellent ("like Webflow"), update Figma, run
> autoplan, and after each walkthrough take a codex review and fix what it
> finds. End state: a bug-free editor in production.
>
> This plan exists because the work so far has been **targeted, not
> systematic**. Eight commits fixed real defects; none of them came from a
> complete pass. The scope below is measured, not estimated.

## 1. Scope, counted

| surface | count | source |
|---|---|---|
| App flows `F-A1..F-A8` | 8 | Ch.11 §11.1 |
| User flows `U1..U12` | 12 | Ch.11 §11.2 |
| Feature flows `FF1..FF35` | 35 | Ch.11 §11.3 |
| Flow dead-ends | 6 | Ch.11 §11.4 |
| Feature rows | 134 | Ch.12 |
| PRD chapters not yet walked | 11 | Ch.01–10, 14 |
| Active boards measured against the app | **6 / 366 (1.6%)** | `gate:boards` |

**55 flows and 134 features.** That is the denominator. Anything reported as
progress states its numerator against it.

## 2. What is already done (2026-08-23/24)

Commits `159afa27`, `768e9661`, `ea33fe24`, `732397a0`, `7bb6653a`, `28a03bc4`,
`4176e77e`, `76184d91`, `bad65182`.

- **F-A2 (save/autosave)** — partially walked. Fixed: the dashboard autosave
  never told the engine it saved, so every page kept a dirty dot over work
  already on the server; markers were panel state and died on tab switch; a
  superseded save could announce itself. NOT walked: conflict resolution UI,
  offline queue, version-restore interaction.
- **U11 (pages)** — partially walked. Fixed: six call sites answering "this
  project has no pages" with three names; SEO slug promising 30 points and
  paying 20; the slug guidance rendering as a run-on inside a warning box.
- **PRD claim sweep** — 15 of 39 ⛔/🟡 claims verified. 11 were stale; the
  register's "defect N2" was not a defect and both its numbers were wrong.
- **Figma** — one from-code capture (`1306:2`) parked beside board `302:1978`.

Not started: 6 of 8 app flows, 10 of 12 user flows, all 35 feature flows, 119
of 134 feature rows, 11 chapters, 360 of 366 boards.

## 3. Per-increment protocol (founder's loop, unchanged)

One flow per increment. For each:

1. **Read the contract** — the PRD section, and the board(s) for its screens.
2. **Walk it live** in the running editor. Not the JSX, not a unit test.
3. **Fix what the walk finds**, with a test that is watched to FAIL.
4. **Full suite** — file count must match the expected number, or the run is
   inconclusive, not green (`--maxWorkers=4`; the default oversubscribes this
   box and silently drops files).
5. **Codex review**, then fix its findings with a stated recommendation —
   including when the recommendation is to decline, with the reason.
6. **Commit + push**, one concern per commit.

## 4. "Like Webflow" as a checkable standard

Vibes are not a gate. This is what the phrase resolves to here, and every one
of these is checkable:

1. **Guidance sits beside the control that fixes it.** Not stacked into a
   warning banner. (Broken and fixed 2026-08-24 in the SEO panel.)
2. **Warnings are warnings.** An amber box carries a consequence, not a tip.
3. **One clause per banner.** Chained em-dashes become a wall in a 260px panel.
4. **Every state a control can reach is drawn** — empty, loading, error,
   disabled-with-reason. A disabled control says why.
5. **The same concept looks the same everywhere** — helper text, counters,
   point labels, dirty markers.
6. **Nothing promises what it does not pay.** A "+30 pts" label that awards 20
   is a UI bug, not a copy nit.
7. **DESIGN.md holds**: one accent `#1A56DB`, Inter, 4px spacing, no purple,
   minimal motion, no banned font fallbacks.
8. **Verified by looking at the rendered panel**, at 1440×900, in the running
   app — never by reading the diff.

## 5. IA

Per flow, three questions, answered in writing:

- **What opens this?** A surface with no door is not shipped (7 finished
  editor surfaces once had none).
- **Where does it return to?** Dead ends are §11.4's own register.
- **Does the label match the permission?** ("Cannot publish" over a role that
  could publish shipped once.)

## 6. Figma policy

- Board exists and is current → **board wins** on visuals.
- Board predates the feature (`302:1978` draws 4 fields for a panel that has a
  score block) → it cannot adjudicate what it does not contain. Capture the app
  beside it, mark `code:capture`, leave the original alone.
- 241 of 422 entries already carry `code:*`. Board-behind is the majority
  position, not an exception being invented per case.
- Captures: modals need `[role="dialog"]` as the capture selector — a `body`
  capture returns the scrim only. Every submit returns 200, including the ones
  that produce junk. Read the node back and look at it.

## 7. Done-condition

Not "walked". For each flow: **the flow completes in the running app, its
failure modes produce the stated outcome, and what was NOT verified is named.**

Production-ready is claimed only when:
- all 55 flows have a walk record with a live verification line,
- every ⛔/🟡 register entry is either fixed, or re-verified stale, or carries a
  named owner and reason,
- the full suite is green at the expected file count,
- `pnpm run env:check:prod` passes against the live server,
- and the remaining founder decisions (§8) are closed.

Until then the honest answer to "is it production ready" is a number, not a
yes.

## 8. Open founder decisions (blockers, surfaced not assumed)

1. **Media Trash is a toast stub** and there is no trash/restore anywhere in
   the product — a deleted site does not come back either. Build trash, or
   remove the affordance and say deletion is permanent?
2. **`resetOverride`-class capability** — the per-property override reset is
   gone (dead code, deleted). The whole-instance "Reset to master" ships. Is
   per-property reset wanted?
3. **Collab stays off** (6 known OT bugs). Confirming it is out of the
   production scope, not a gap to close.
4. **Stripe live mode is unprovisioned** — the four live Price ids are a
   founder step in the Stripe dashboard; nothing in this walk can close it.

## 9. Order

Money and data-loss paths first, then the core loop, then the long tail.

1. `F-A2` finish · `F-A1` boot/load · `F-A6` versions · `F-A7` undo — anything
   that can lose work.
2. `F-A3` publish · `U1` first-run → first publish — the money path.
3. `U2` build-a-page · `U3` brand · `U4` components — the core loop.
4. `F-A4` media · `U7` · `F-A5` AI · `U8` CMS.
5. `FF1..FF35` swept against §11.3's own failure-mode column.
6. Ch.12's 134 rows, status-verified in bulk.

