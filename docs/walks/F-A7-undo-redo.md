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
