# Every queue row that has not landed, and what each one is

## The first version of this file undercounted, and the reason matters

It counted 38 rows and called 24 of them unfinished. It built that set from
`queue-state.json` — **the record of rows the applier has ATTEMPTED**. A row that
was never attempted has no entry there and was therefore invisible to the count,
which is the same shape of error as measuring coverage from applier receipts and
missing every board a bespoke script had repaired.

Counted from `queue.json` instead — the rows that were *authored* — the real
figure at the time was 83, not 38. Corrected below.

## Where it stands (measured 2026-09-07 17:05)

`queue-state.json`: **962 landed** (731 OK + 231 SAME) of 1,204 authored rows.

Of the rest, **159 belong to other scripts by design** — `advisory` rows are
notes, and `add-board` / `clone-board` / `manual-draw` each have a dedicated
builder. `apply-queue` files them "unusable" because it cannot run them, not
because they failed.

That leaves **83 rows apply-queue owns and has not landed.**

## CORRECTION — the "largest block" was not blocked. Most of it is already done.

This section previously claimed ~46 rows were blocked on `resolve-selectors.mjs`,
a tool that exists and had never been run. The tool was then run, and the claim
did not survive it.

**`history-text.json`: 0 of 28 selectors resolved. All 28 matched nothing.**
That is not a resolver failure and not a schema mismatch — the resolver handles
`contains` (`resolve-selectors.mjs:39`). The boards genuinely hold no such text,
and reading them says why:

```
162:2   History · Saves           "Named milestones"  "Saved versions"  "This session"
163:64  History · Saves · empty   "Named milestones"  "Saved versions"  "This session"
163:2   History · Saves · changes "This session only - the last 100 steps, ..."
```

The chips already say **"Saved versions"** and **"This session"**. The unresolved
rows are searching for **"Milestones"** and **"All changes"** — the strings those
rows were written to REPLACE. `history-text#0` and `#1` landed and did exactly
that; their siblings `#2`–`#27` are looking for a string their own plan already
removed. They are **obsolete, not pending.**

`settings-text.json` came back 0 of 31 (1 ambiguous) — the same shape.

### The lesson, which is the coverage lesson pointing the other way

`queue-state.json` marks these rows "never attempted", and I read that as *"this
work never happened."* It means **"this ROW never ran."** The work happened by
another route — a sibling row, a bespoke script — exactly as the coverage
measurement undercounted because bespoke scripts leave no receipt.

The state file describes the applier's activity. It has now produced a false
negative in both directions from that single fact, and neither direction was
visible without reading the file itself.

**So the 104 selector rows are not a backlog of 104 pending fixes.** An unknown
share are already satisfied. Resolution now costs one call per plan purely to
find out which — worth doing, but it ranks below looking at boards, and it has
been moved to the end of the queue for that reason.

## What the earlier "blocked on a tool nobody ran" section said

**~46 of the 83 carry a `{ selector: {...} }` and no node id.** `apply-queue`
files each one as *"unresolved node id — run resolve-selectors first"*, prints
that in its unusable list, and moves on. `resolve-selectors.mjs` exists for
exactly this, resolves a whole plan in one call, and **had never been run on any
of them.**

Across 11 plan files there are **104 such rows**:

| rows | plan |
|---|---|
| 31 | `settings-text.json` |
| 28 | `history-text.json` |
| 11 | `publish-crosssection.json` |
| 8 | `pages-nodes-08-newboards.json` |
| 8 | `pages-text-08-newboards.json` |
| 6 | `shell-text-fixes.json` |
| 4 | `publish-text-4-preview.json` |
| 3 | `insert-text-fixes-unresolved.json` |
| 2 | `insert-geometry.json` |
| 2 | `shell-instance-overrides.json` |
| 1 | `shell-deletions.json` |

Queued, one call each. The resolver refuses any row matching zero or several
nodes rather than guessing — a plan that silently picks the first of three
matches is how the wrong string gets rewritten.

**One trap found before it fired:** the resolver writes `<plan>.resolved.json`
*next to* the plan, and `normalize-plans.mjs` globs `*.json` over that directory.
Folding the result in without deleting the copy would have ingested every
resolved row twice under a second slug. The runner now folds and deletes.

## The rest, itemised

| rows | what | verdict |
|---|---|---|
| 18 | hotspots targeting `hotspot/state · …` names that do not exist (6 Pages, 6 History, 6 Shell `hotspot/more-*`) | **open** — the boards exist, the trigger nodes were never created |
| 11 | `zz-settings-headers-queue` deletes matching text (`Plausible`, `PostHog`, `HSTS`, `security poli'`) | **undetermined** — a delete whose target is absent is indistinguishable from a delete that worked. Note `security poli'` is cut mid-word; that plan's strings were themselves truncated |
| 5 | `text` op aimed at a `FRAME` (`NOTTEXT`) | **open** — selector matched the container, not the string |
| 3 | targets that are placeholder tokens (`UNRESOLVED-ID`, `DOES-NOT-EXIST-YET`, `TIP-NAV-NODE`) | **open** — authored with a placeholder and never resolved |
| 2 | `MISSINGTARGET` — insert hotspots pointing at `137:26` / `137:38` | **open** |
| 2 | `move` against an auto-layout parent (`AUTOLAYOUT`) | **closed** — the parent owns x/y; the applier refused rather than reporting a write that would not exist |
| 1 | `REFUSED` — would have printed `Drawer slot · 320`, a width the code does not have | **closed** — the guard was right |
| 1 | `delete 1758:8372`, node absent | undetermined, as above |

## Honest total

962 of 1,204 authored rows have landed. 159 are another script's job. Of the 83
apply-queue owns: **3 are correctly closed**, **12 are undetermined** (deletes
whose absent target proves nothing either way), and **68 are genuinely
outstanding** — ~46 of them blocked on one resolver call per plan, and the
remaining ~22 on hotspot trigger nodes and placeholder targets that need
authoring, not running.
