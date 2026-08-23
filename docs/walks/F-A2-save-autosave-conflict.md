# F-A2 · Save / autosave / conflict — walk record

Walked 2026-08-24 · commit `f297e791` · localhost:3000, 1440×900, real session.
Same localhost caveat as F-A1: walking prod needs a session minted against live
user data, which was not authorised.

## Legs

| # | leg | result |
|---|---|---|
| 1 | dashboard autosave announces the save to the engine | **PASS, fixed today** (`768e9661`). Before it, the topbar read "Saved · just now", the server had the edit, and the Pages tree still showed the page dirty — three readings of one question at one measured moment. |
| 2 | markers survive panel navigation | **PASS, fixed today.** Old code: 1 → 0 on a Layers→Pages round trip with the save blocked. New code: 1 → 1. |
| 3 | a superseded save does not announce itself | **PASS, fixed today** after codex review. A newer edit mid-flight now leaves the markers standing. |
| 4 | **SAVE_CONFLICT → ConflictModal** | **PASS.** Forced a `SAVE_CONFLICT:<ts>` on the save POST. Modal: *"This site changed somewhere else — Your copy is behind… We can't auto-merge, so pick how to continue. **Nothing is lost without your choice.**"* with Reload latest / Save a backup / Overwrite…. Save chip reads **"Conflict — reload"**, not a generic failure. |
| 4b | **the backup is real** | **PASS, and this is the one the promise rests on.** "Save a backup" produced `buildrik-backup-1787516295685.json`, **41,387 bytes**, keys `version/pages/styles/assets/metadata/settings`, **4 pages**, and "Home Copy" carries **7 elements** — the canvas went 6 → 7 with the edit that triggered the conflict, so the backup contains the *unsaved local work*. "Nothing is lost without your choice" is true, measured. |
| 5 | generic save failure | **PASS.** 500 on the save POST → chip **"Save failed — retry"**, retry affordance present, and clicking it issues another save POST. |
| 6 | empty tree never auto-saved before content is observed | **PASS** — covered by F-A1 leg 2b: an edit on a project that never loaded produced **0** save POSTs. |

## Doc drift found

**"retry ×1" is stale.** The PRD's F-A2 diagram says `retry ×1 → onSaveError`.
Measured: **one** save POST, not two. The reason is in the code —
`BuildrikSyncProvider.ts:477` records that the loop which retried once was
`initBuildrikSync`, *"that nothing ever called"*, deleted 2026-08-19. The
shipping path does not auto-retry.

**Recommendation: do not add one.** The chip tells the truth immediately and
offers the action; a silent retry delays the honest signal by a round trip, and
on a conflict-adjacent failure it risks making things worse rather than better.
The current behaviour is the more honest one. Recorded as a decision, not an
omission.

## Not covered by this walk

The offline queue's durability across a navigation (the queue carries CMS,
components, templates and versions — never the project, per
`BuildrikSyncProvider.ts:55`), `HistoryManager`'s 500 ms coalesce / max-100 /
checkpoint-every-10 numbers, and the Overwrite branch's "adopt token, re-save".
Named so they are known-open, not assumed-fine.
