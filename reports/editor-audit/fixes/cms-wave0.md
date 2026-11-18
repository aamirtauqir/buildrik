# CMS Wave 0: fix ledger

## Run metadata
- **Date:** 2026-10-09 (PKT)
- **Type:** code-fix batch. Requested by the owner ("Wave 0, commit to branch") as a separate code request, outside the `editor-product-architect` skill.
- **Base:** main `e8df3945b`.
- **Integration branch:** `fix/cms-wave0` @ `2a510f7c1`, in worktree `~/Desktop/buildrik-worktrees/cms-wave0`.
- **MERGED to main** as `6c3bb6fa8` on 2026-10-09, on the owner's instruction. **Not pushed.**
- **Post-merge checks on main:** `tsc` editor 0 / dashboard 0. Targeted vitest (`services`, `engine/cms`, `cms`, `shell`, `chrome-ui`, `CmsBindingSection`, `pages`, `canvas/hooks`): 281 files, 2850 passed, 3 todo, 0 failed.
- **Lanes** (worktrees `~/Desktop/buildrik-worktrees/cms-wave0-{a,b,c}`):

  | Lane | Area | Issues |
  |---|---|---|
  | `fix/cms-wave0-a` | sync + server | EDT-002, 021, 022 |
  | `fix/cms-wave0-b` | shell UI | EDT-007, 017, 018 |
  | `fix/cms-wave0-c` | engine + Pages | EDT-003, 056, 057 |

## Commits
| Issue | Commit | Change |
|---|---|---|
| EDT-002 (P0) | `231da28de` | Each tab saves against the server version it loaded or last saved (`cmsSync.ts`); outbox entries carry their base stamp. Test: `cmsSync.tabs.test.ts`. |
| EDT-021 | `bc7b67b87` | `_skipTouchCmsEdited` removed from the transport schema; it is now a server-only option for the CSV importer. Test: `cms-public-surface.test.ts`. |
| EDT-022 | `0c30cb0cc` | Public `cms.generateDynamicPages` and its input schema removed; orphan list updated. |
| EDT-007 | `bac84ad5f` | Drawer ✕ and an active-rail click with a dirty record go through `UnsavedTabSwitchDialog` (`useTabSwitchGuard`, `shellDirtyRegistry`, `AquibraStudio.tsx`). 6 tests. |
| EDT-017 | `d5dc15bb8` | Toasts drop below the modal scrim while a modal is open. Contract test `chrome-ui/__tests__/Toast.layering.test.tsx`. |
| EDT-018 | `493e76038` | The "Restore my edits" prompt is dismissed once its copy is handed over (Restore or Retry) or discarded. 5 tests. |
| EDT-003 | `83d88b997` | A pinned record resolves by id among all records, then requires published (`CMSBindingManager.resolveBinding`, `CmsBindingSection`). Test with 60 records. |
| EDT-056 | `995d1fa23` | `CollectionManager.followPageFiles`: a collection follows its template page's file name through slug changes, undo, redo and restore. Stop-gap until the D-12 pageId change. |
| EDT-057 | `b2de98252` | The Pages delete confirm names the collection using the page as template and its N record pages. |

## Verification
| Check | Result |
|---|---|
| `tsc --noEmit`, editor + dashboard | exit 0 / exit 0 |
| Editor vitest (`engine`, `services`, `cms`, `shell`, `chrome-ui`, `inspector`, `sidebar`, `canvas`) | 822/823 files and 8385 tests passed, 18 todo. 1 failure under machine load: `noChromeTokenWrites › Border · empty` (182 s timeout). **It passes 25/25 when re-run alone.** The branch does not touch that file. |
| Server/shared CMS vitest | 8 files, 134/134 passed |
| `pnpm run verify:ds` (`packages/editor`) | exit 0, 39 gates passed |
| **Live QA** (port 3620, Chromium 1440×900, qa@buildrik.local, throwaway site deleted, 0 publish requests) | **10/10 PASS:** EDT-002 (two tabs, offline replay, cross-profile), 021, 022, 007, 017, 018, 003, 056, 057, plus regressions (EDT-001 rich-text rename, EDT-006 binding save, live title). Evidence: `evidence/wave0-qa-2026-10-09/Q-runtime.md` + `shots/`. |

**EDT-017 caveat:** at 1440×900 the toast and the confirm's Cancel no longer overlap. The hit test proves the layering, not the original overlap geometry.

## New problems found by QA
These are not caused by this branch: each sits on code paths the branch did not change (CODE_EVIDENCE). They are candidates for the next `audit cms`, so they have no EDT IDs yet.

| # | Severity | Problem | Origin |
|---|---|---|---|
| New-1 | P1 | A record save also triggers a project save, so a second tab or user gets the site-wide "This site changed somewhere else" modal. Its backdrop covers the record conflict bar, so Keep mine / Use theirs can't be clicked. | Pre-existing coupling between record save and project dirty (binding reapply → project save). Lane A changed only the record precondition. |
| New-2 | **P1 data loss** | After a failed save and a reload, a new edit followed by "Retry save" puts the pre-reload copy back and silently drops the post-reload edit. It is still gone after reload. | "Retry restores the kept copy first" came from main `53346a2ec` (L5-074, the earlier audit-fix merge). Lane B's EDT-018 commit only adds the dismissal notification. |
| New-3 | P3 | After such a reload, "Couldn't save · Retry save" and "Save failed — retry" appear with no save attempt. | Related to EDT-059. |
| New-4 | P3 | React missing-key warning in the records table. | Existing (D-27 / EDT-053). |

## Still open from Wave 0 scope
- **EDT-013:** the server still accepts writes with no precondition. The client now always sends one for loaded rows.
- **EDT-059:** the cause is unclear, and the suggested fix was unsafe; not done.
- **The two banners in D-14:** the dashboard offline banner and the deliberate "Couldn't save" banner placement are layout decisions, not done.

## Next
1. ~~Merge decision~~: merged as `6c3bb6fa8`. Push only when the owner asks.
2. Fix **New-2** (data loss) next, then New-1.
3. Run `audit cms` to promote New-1…4 and close the fixed EDT IDs in `02-issues.md`.
