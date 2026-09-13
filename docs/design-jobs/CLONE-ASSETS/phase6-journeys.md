# Assets · Clone Phase 6 — Image editor · versions · replace results — walk log

Brief: `phase6-brief.md` (the decided version model: a saved edit is a hidden library
row flagged `versionOf=<parent>` carrying an `edits` snapshot; apply = `replaceAcross`
per source the placements carry). Graph: `reactions-p6.json` (34 frames, 101 edges).
Shots: `shots/3397-39917.png` … `shots/3695-43906.png` (29 of the 34 — the brief lists
the five that have none). Figma calls this phase: 1 census/graph + 29 shots (≈166 today
before the phase; none during it).

## Live env

Same as Phase 3 (`phase3-journeys.md` § Live env). Site `scratch-ver`; the walk used
`team-photo.webp` (1800 × 1200, a seed upload that stored no dimensions) and
`pasta-closeup.webp`. `team-photo` was deleted at the end of the walk (family of four —
the delete verification) and is gone from the scratch site.

## Work split

| agent | journey | files owned |
|---|---|---|
| X | the editor dialog: Crop · Adjust · Resize · Optimise · Saved · discard · failure | `media/ImageEditorModal.tsx` (rewritten) + `media/image-editor/{imageEdits,renderImageEdits,ImageEditorTabs}`, `components/{DiscardEditsModal,SaveFailedModal}.tsx`, `shared/constants/media.ts` (`MAX_IMAGE_EDIT_DIMENSION`), `shell/hooks/useStudioModals.ts` (`ImageEditorContext`/`ImageEditorOptions`), `StudioModals.tsx` |
| V | the version model, Asset versions, Apply confirm, Applying/applied, the rail's VERSIONS block, the save path | `shared/types/media.ts` (`versionOf`, `edits`, `EditsSnapshot`), `engine/media/MediaManager.ts` (userMetadata mirror + read-back), `useLibraryState.ts` (`versionsOf`, hidden rows), `LibraryManager.tsx`, `components/{VersionsModal,ApplyVersionModal}.tsx`, `AssetDetailsPanel.tsx` (VERSIONS) |
| R | the replace-across result cards | `components/ReplaceResultModal.tsx`, `libraryModal.ts` (`LIBRARY_MODAL_BTN_OUTLINE`), `LibraryManager.tsx` (the run), `MediaTab.tsx` (the drawer's run), V1 1174:4849 retired |
| main | merges (add/add on `ReplaceResultModal.tsx` → R's; V's `ImageEditorDoor` → X's `ImageEditorOptions` across six hops; the drawer's `MediaTab.handleEditImage` re-pointed to the version path), the live walk, the eight walk fixes, boards.json, report | — |

## Drift table

| screen | verdict | note |
|---|---|---|
| 3397:39917 Edit image (base) | drift-fixed | 960 × 740; head `Edit image · team-photo.webp · 1800 × 1200`; tab chips 112 × 32 (measured: rest `--bk-bg-subtle`, selected tint + `--bk-accent-text`, 13/500); preview card + mono status `1800 × 1200 · Free · WebP` + Reset all; foot note · Cancel · Save version. Supersedes V1 1124:4527. FOUND: Free was react-easy-crop's 4/3 default (read `1600 × 1200`, would have cropped the sides); opened on Optimise the focus ring sat on Crop — both fixed; live-3707-20536-optimise-from-rail |
| 3695:43236 / 3707:20431 / 20501 / 20536 / 3695:43705 Crop states | drift-fixed | 16:9 → `1600 × 900 · 16:9`, saved as v3; rotate 90° turns the Free box too; zoom 100–200; flips mirror the media. 1:1 and Flip V driven by tests only (no shots) |
| 3695:43319 / 3681:19920 Adjust | drift-fixed | sliders −100..100 / blur 0..20 with values; presets; B&W saved as v2 (`Preset: B&W` on its card) |
| 3695:43403 / 43547 / 43624 Resize | drift-fixed | lock/unlock; 25–100% chips; invalid → `Maximum is 8192 × 8192 px. Enter a smaller size to continue.` + Save disabled. 8192 is the code's cap (QA 3697:20354: the number comes from the code, not the design's 8000) |
| 3695:43480 / 43788 Optimise | drift-fixed | WebP · JPEG · PNG, Quality 85, `Original · 4.89 KB` / `Estimated …`, the note; reached from the rail's Optimize on the Optimise tab; JPEG saved as v4 (`Format: JPEG`). PNG driven by tests |
| 3681:20026 Saved | drift-fixed | `Version saved` · summary list · foot note · ‹ Back to editor (draft kept; Cancel then closes with no prompt) · Done → Asset versions; live-3681-20026-saved-v3. The `uploaded ✓` toast overlaps the foot for 4 s — left |
| 3695:45549 discard | drift-fixed | `Discard unsaved changes?` · Keep editing · Discard changes |
| 3695:45542 failure | drift-fixed | forced (`media.uploadFile` rejected once): `Version could not be saved` · body · Continue editing · Retry save → saved (v4); live-3681-19973-save-failed |
| 3695:45529 Asset versions | drift-fixed | cards newest first with dims/state/edit lines, `v1 · Original` last; Close · Edit latest saved version (→ editor on v2's file → saved v3 of the SAME family) · Apply latest saved version; the rail's rows open it; live-3695-45529-v4 |
| 3697:20326 / 20341 | superseded / drift-fixed | the row-bar design loses to 3695:45529's cards (later section); `Applied to site · 1 placement` + Apply disabled + rail APPLIED badge verified, and the badge follows the placements (Replace across onto terrace-2 cleared it) |
| 3695:45615 Apply confirm | drift-fixed | `Update 1 use on Home to the latest saved version. …` · `Apply to 1 use`; disabled with the reason at 0 uses |
| 3720:43313 Applying | drift-open (deliberate) | title `Applying saved version` (the frame's name — the shot reuses R's "Replacing image" card) over the board's line, held 350 ms |
| 3720:43316 Saved version applied | drift-fixed | `1 of 1 use updated` · `Home: 1 updated` · Done · View versions |
| 3695:43897 / 43900 Replacing → complete | drift-fixed | the busy card for the deferred microtask; `Replacement complete · 1 of 1 use updated · Home: 1 updated · Other elements are unchanged.` · Done; canvas src → terrace-2; live-3695-43900-fixed. FOUND: only the original's src was replaced while the placement sat on v2 (`0 of 0 uses updated`) — fixed, the family's sources |
| 3695:43903 / 43906 partial · retry | driven | the engine's replace is transactional per run — cannot be made to fail for one placement live; tests cover both cards (fixture `replaceAcross` returns a failed element, retry completes) |
| 3708:20650 Confirm delete (P2) with versions | drift-fixed | `Delete team-photo.webp? · Used in 1 site placement …` while the placement sat on the applied v4; Delete permanently → four `media.deleteAsset` calls, 34 → 30 engine assets; live-3708-20650-delete-family |
| drawer `used` pips | drift-fixed | no drawer card had ever shown its pips (the map walked `root.getDescendants()` / `el.attrs.src`, which the engine's roots and elements do not carry) — now read through `checkInUse`, family-aware: five files read `Used on 1 page`, pasta-closeup with its placement on v2; live-drawer-usage-pips |
| 3697:20354 QA reference | out-of-scope | text in the brief; both contract lines hold in the code |

## Notes

- **Contradictions decided (from the three reports + the walk):** the editor's tab row
  keeps density 32 (the Clone's 44 refused); `Free` = the whole frame; Zoom 100–200
  (3707:20536's 150% mid-track) not V1's 300; the Resize note names the file's intrinsic
  size, the head's, not the crop; `Format: Original` prints only when the output format
  equals the source's; the Saved state drops `Reset all`; INVALID's pale-blue disabled
  Save → the grey disabled token; Save version disabled ONLY on an invalid resize (every
  unsaved frame draws it enabled on a clean draft — a plain re-encode is what Optimize
  asks for); V1's §17 Compare hold removed; the cap is 8192 not 8000; 3697:20326/20341's
  row-bar versions lose to 3695:45529's cards; 3720:43313's title is the frame's own
  name; the busy copy is the shot's (`Updating N uses on Home. Please wait.`) not the
  brief's paraphrase; the version row is flagged at upload (`uploadFile(file,
  {versionOf, edits})`) not after it, so it never draws as a library card; usage is the
  FAMILY's everywhere (grid, SMART, rail, Replace across, the delete confirm, the drawer).
- **Found on the walk, fixed (8):** `checkInUse` read a private `id` (the engine answers
  `getId()`) so no placement ever resolved to a page name; Replace across site… replaced
  the original's src only; Free crop was 4/3; the opening focus on the wrong tab (Tabs +
  the trap skipping `tabIndex -1`); a file's delete stranded its versions and counted the
  original's src only; the drawer's `used` pips were dead and version-blind; the drawer's
  Edit image saved `_v1234` siblings (re-pointed at merge); the door type mismatch across
  six hops (folded at merge).
- **Open / known:** a version's card prints no dimensions when the original stored none
  (uploads before E7); a version saved while offline keeps `versionOf` locally but
  `retryLocalOnlyAssets` → `uploadAndCreate` sends no userMetadata (the same gap tags and
  `siteFont` have); the drawer's own `AssetDetailOverlay` keeps its V1 Optimise drill-in
  (1124:4562, live recipe — the brief's "leave it alone"), so `OptimizationPanel.tsx`
  stays for it alone; the `uploaded ✓` toast overlaps the Saved card's foot; the Replacing
  card is one microtask long (the engine is synchronous); three stale `blob:` loads
  (`ERR_FILE_NOT_FOUND`) at reload predate the phase and belong to no asset, element or
  version — not traced.
- **Not verified:** partial / retry live (see the table); PNG, 1:1 and Flip V as live
  clicks (tests only); Undo of a family delete (the toast expired before the click — the
  grace path is the P2 one, per row); a real deploy.
- Tests: 1006 files / 10158 green (the full editor suite; one intermediate failure was
  the usageMap test mid-rewrite, green on its own after) ; `tsc --noEmit` clean;
  `check-boards` / `check-anchors` / `check-copy` PASS; `verify:ds` run after this doc.
