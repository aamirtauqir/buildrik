# F-A7 · Undo / redo — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session. Same localhost
caveat as F-A1/F-A2.

## Legs

| # | leg | result |
|---|---|---|
| 1 | fresh load offers nothing to undo | **FAILED, fixed here.** See below. |
| 2 | one edit → one undo restores exactly one step | **PASS** — 9 → 8 via the button, and via ⌘Z with canvas focus |
| 3 | redo restores it | **PASS** — 8 → 9, and Redo correctly disabled until an undo exists |
| 4 | 500 ms coalesce | **PASS** — three inserts 120 ms apart went 7 → 10, and **one** undo returned to 7 |
| 5 | an undo is persisted | **PASS** — 2 save POSTs followed the undo. Autosave listens to `history:undo`, so an undo is not lost on reload |
| 6 | RAM-only across reload | **PASS** — after reload Undo is disabled again, which is the contract (`depth 100; RAM-only`) |

## The defect (leg 1)

On a freshly loaded site, two surfaces answered the same question differently:

```
command palette   "Undo last action · nothing to undo · ⌘+Z"      correct
canvas footer     Undo button ENABLED, and clicking it did nothing  wrong
```

The palette calls `composer.history.canUndo()` at render. The footer reads a
React mirror (`useSaveState.canUndo`) refreshed by events. The mirror was stale.

**Cause, and it is a documented trap:** `importProject` — which runs on project
load, inside undo/redo, and on version restore — rebuilds the tree and emits
only `project:loaded`. It emits no `history:*` event. The mirror listened to
four `history:*` events and nothing else, so after a load it kept whatever the
last history event had left and was never corrected.

**Fix:** `EVENTS.PROJECT_LOADED` and `EVENTS.VERSION_RESTORED` join that
listener set. Measured after: fresh load → `undo: disabled=true`, matching the
palette; the full cycle still works (insert → undo 9→8 → redo 8→9 → undo 9→8).

Same shape as the dirty-dot bug fixed this morning (`768e9661`): a React copy of
engine state, refreshed by an incomplete event list, telling the user something
the engine would refuse.

Codex review: no findings. Negative test: removing the two events drops exactly
the two new specs and nothing else.

## Reported, then withdrawn

The first probe showed ⌘Z doing nothing after an insert. It did **not**
reproduce under a controlled focus state — both the button and the chord undo
correctly. That reading was the harness, not the product, and it is recorded
here rather than filed as a defect.

## Not covered

The `runWithoutTracking` / collab-remote-op / restore-in-progress exclusions,
the depth-100 cap, and the "bail out without mutation if the patch path
diverges" guard.

---

## Addendum, 2026-08-25 — the exclusions and caps, verified

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. This record's "Not
covered" list is three engine-internal guards with **no UI of their own**, so
the instrument is code verification plus the existing suites, not a walk. Said
plainly rather than dressed up as a walk.

All three are present at HEAD in `packages/editor/src/engine/HistoryManager.ts`:

| leg | verified |
|---|---|
| `runWithoutTracking` | `:432` — sets `isRecording = false` **and** `isRestoringFromHistory = true`, both restored in a `finally`. Its docstring names the failure it prevents: `importProject` re-emits `PROJECT_LOADED`, which the load handler would otherwise treat as a fresh project and wipe history. Only caller is `Composer.ts:967`, a transaction rollback |
| restore-in-progress exclusion | `:131` — `if (this.isRestoringFromHistory) return;` in the record path |
| "bail out without mutation if the patch diverges" | `:193` — `if (isPatchEmpty(patch)) return;`, before anything is pushed |
| depth-100 cap | `maxHistory: THRESHOLDS.HISTORY_MAX_SIZE` (`:71`), and `HISTORY_MAX_SIZE: 100` in `shared/constants/config.ts:108`. **The number in the PRD is the number in the code** |
| the other two contract numbers | `checkpointInterval: 10` and `coalesceDelay: 500` (`:72-73`) — matching "500 ms coalesce / checkpoint-every-10". F-A2's record read these too; this is a second, independent confirmation |

**Corrected, not confirmed — the collab exclusion.** This record listed
"collab-remote-op" among the exclusions. What the code actually does at
`:230-233` is the opposite direction: when a collab session is connected it
**broadcasts the local op outward** (`collab.broadcastOperation(op)`). Whether
an *incoming* remote op is excluded from the local undo stack is not settled by
this code path, and this pass did not chase it into the collab manager.
Recorded as still-open rather than claimed — and note `NEXT_PUBLIC_FEATURE_COLLAB`
is off by founder policy, so nothing here is reachable in production today.

**Tests:** `HistoryManager.test.ts`, `.noop.test.ts`, `.entryIndex.test.ts` —
**9 passed**. No new test: this lane found no defect. The one-undo-step contract
itself was measured live in the F-A5 lane (AI apply → single ⌘Z reverts), which
is the strongest evidence in this area and it holds.

### What this walk did NOT assess

Visual and IA. And the collab-remote-op direction, named above.
