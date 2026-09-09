> **SUPERSEDED 2026-09-08 by `DECISIONS-2026-09-08.md`.**
> Every item below was put to the founder and answered. This file is kept for
> the working — the measurements, the ratios, the reasons a code-side fix was or
> was not possible — not for its status column, which is now wrong. Two items it
> lists as open (`PanelHeader`, `bg-primary-600`) were already closed when it
> was written; `B13` closed during the arc that followed it.

# Open decisions — things agents correctly refused to settle

Every item here was found by measurement, has a named cause, and was left
*unfixed on purpose*. None is a task waiting for someone with more time; each is
a call that an implementer does not get to make alone, for a reason stated in
the row.

Updated 2026-09-08. Ordered by how much they cost while open.

---

## 1. `--bk-ink-muted` passes on white and fails on every tint · **Figma**

`#6B7280` is 4.83 on white, **4.39 / 4.38 / 4.29** on gray-100, blue-50 and
green-50 — the tints the system itself ships. 19 of 25 measured contrast
failures are this one pair. Used **699×** in `src/`.

The boards specify the pairing, so implementers keep faithfully reproducing it;
an agent conforming the compare strip *introduced* two fresh instances,
correctly. Minimal fix `#646C79` (worst case 4.70, preserves the muted/soft
tier that `ink-soft` at 6.87 would collapse).

Not fixable in code: `tokens.generated.css` is generated and checksum-locked by
`gate:tokens-generated`. Change the value in Figma → re-export → regenerate.
Full working: `CONTRAST-INK-MUTED.md`.

## 2. `--bk-success` is a fill token used as text in ~28 places · **Figma**

`#0E9F6E` is 3.39 on white and **3.00 on its own `--bk-success-tint`** — the
worst pair in the arc. `--bk-success-text` `#057A55` exists and clears both.

The obvious code fix disproved itself: board 171:67 *names* `--color/success`
for those glyphs, so swapping failed conformance three ways and was reverted.
The fix re-points the **boards'** text layers to `--color/success-text`, then
re-conforms — a design job of the same shape as the Goal-2 arc. Pair it with a
lint ban on `--bk-success` in a text position, or the ban fails on arrival.

## 3. `BK_TEXT_INPUT_THEME` is 10px too tall on every field · **founder**

Board 149:108 draws inputs **32 / 56** (textarea), radius 6,
`--color/border-input`. Live: **42 / 64**, radius 8, flowbite gray-300.

Blocked by `boards.json authority=open:input-fill` — 1172:4867 and 1205:4804
disagree about this control, and two disagreeing boards cannot re-settle it. The
Content targets are SKIPPED, not passed. This is the largest single number
measured in the tranche and needs the tie broken, not another agent hitting it.

## 4. Two board colours fail AA and the code cannot fix them · **Figma**

- **Rollback confirm: white on `#C27803` = 3.51:1** at 12/500, against a 4.5
  floor. Board 184:35 draws exactly that. A primary confirm button.
- **Tab helper `#9CA3AF` = 2.54:1** on white (boards 1657:7153 / 7156). An agent
  adopted it, the gate lit immediately, and it was backed out — the helper keeps
  `--bk-ink-muted` and **the board is wrong**.

Both are the board specifying an inaccessible pair. Neither can be corrected
without leaving the board, which the precedence rule forbids.

## 5. The Modal chassis has two readings · **founder**

Title 16/24 and 32-tall footer buttons on 184:24 and 1169:4725; live is 14 and
28 via `MODAL_FOOT_CLASS`, **whose own comment names 184:24 as one of the boards
it was measured against**. One board does not re-settle a primitive measured
against eight, so the chassis stands and the difference is recorded.

Same shape, same answer, three more places: `PanelHeader` (settled *for* the
code by the 2026-09-05 redraw of component board 2100:11651 — resolved),
chrome-ui `Tabs` (11 vs 13, cited by three boards), `EmptyState` (16/24 semibold
vs 13 live).

## 6. The 1080 Compare surface · **founder** — `BLOCKERS.md` B1

Everything depending on it: panes, body, skeleton bars. Already owned; listed so
this file is the single place to look.

## 7. Two boards name data the code never reports · **product**

- **184:44** draws *"Publishing v5 as v7 · 18 of 27 pages"*. `rollbackJob` is
  `{state, progress}`; deriving pages from a percentage invents a number the job
  never sent. Needs `pages` / `pagesTotal` threaded from `usePublishJob`.
- **184:2** rows name the publisher (*"published 2d ago · Ali"*).
  `PublishHistoryRow` carries no author — the same call this panel already
  records for 949:4474.

Both are behaviour, so under the precedence rule the CODE contract wins and the
board waits on a real field. Neither should be faked to make a board green.

---

## Resolved since the list opened

- **The History View toggle** — boards 163:2 / 163:113 drew bare text labels
  "Changes"/"Saves", colliding with the "Saves" tab a row above. Node 1657:7157,
  **redrawn 2026-09-05**, keeps the code's chips and renames them "Saved
  versions" / "This session". Board won the words, code won the control.
- **The Panel header** — ruled "48h/14px board vs 44h/11px code". Component
  board 2100:11651's own description says it was *"widened 2026-09-05 so the
  eight local copies could be adopted"*, and now draws 44 / 11 / ink-soft, which
  is the shipped `PanelHeader` exactly.
- **`bg-primary-600` at three call sites** — flowbite fills `Progress`
  `#1C64F2`, one step off the single accent. Not a board question at all:
  "one blue everywhere" is a DESIGN.md rule. Corrected at all three
  (`PublishHistory`, `PublishTab`, `IssuesPanel`), geometry left alone. A themed
  wrapper would be the SSOT fix but the closed wrapper set is
  `[TextInput, Select]` and `gate:chrome-ui-surface` requires pure re-exports.

**Both redraws mean the same thing: several "board vs code" standoffs in this
arc are stale rather than deadlocked.** Re-capturing a board before escalating
its conflict is cheaper than a founder call.
