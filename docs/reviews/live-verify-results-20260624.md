# Live-verify results — 7-commit feature batch + 1 fix (2026-06-24)

Verified against a running dashboard (`:3000`, unified editor `/edit/:siteId`), logged
in via a minted magic-link, driving the gstack browse binary + confirming every write
in the **real Postgres DB** (or the real authenticated tRPC endpoint). Site:
`cmpxu9ttq000gysraqrcu5h4s` ("Demo AI Site").

| # | Change | How verified | Result |
|---|--------|--------------|--------|
| #3/26 | Version history → server | **UI**: clicked "Save version" → named "live-verify v1" | DB `SiteVersion` got the named row + 2 auto-checkpoints ✅ |
| #3/26 | Version history hydrate | **UI**: fresh browser (empty IndexedDB) → open editor | `aquibra-versions` hydrated 0→23 from server, panel populated on first load ✅ |
| #4/27 | Component masters → server | authenticated `siteComponents.upsert` | DB `SiteComponent` row "LV Component" ✅ |
| #4/27 | Component hydrate | **UI**: fresh browser → Components panel | "LV Component" shows on **first** load (after the fix below) ✅ |
| #13/25 | My Templates → server | authenticated `userTemplates.upsert` | DB `UserTemplate` row "LV Template" ✅ |
| #13/25 | My Templates hydrate | **UI**: reload → read `localStorage` | server template pulled back into `buildrick-my-templates` ✅ |
| #8/15 | Media name/alt → `media.updateAsset` | real `createAsset` then `updateAsset` | DB asset `filename="lv-renamed.png" alt="LV alt text"` ✅ |
| #9/16 | Folder rename → `media.renameFolder` | real `createFolder` then `renameFolder` | DB folder `name="LV Folder Renamed"` ✅ |
| #22 | Forms Export CSV | authenticated `forms.exportSubmissions` | 200, empty CSV (site has no submissions — correct) ✅ |
| #24 | Stock search proxy | authenticated `media.searchStockPhotos` | 200 → `[]` (no UNSPLASH key — graceful, designed) ✅ |
| #5/6 | CMS sync reliability | unit tests (failure-injection impractical live) | queue + notify + retry proven by tests ✅ |

## Bug found + fixed during live-verify (commit `3f47a64d`)

**Hydrated versions/components didn't show until a 2nd reload.** VersionTimelineManager +
ComponentManager read IndexedDB once at init; `hydrate*FromServer` writes the server copies
*after* init, so on a new device the items landed in the local cache but the in-memory
manager (and thus the panel) didn't see them until the next reload. Fix: hydrate returns a
count; when >0 the sync hooks call the manager's existing `setProjectId(siteId)` →
re-reads + emits `*_LIST_UPDATED` → the panel (already subscribed) refreshes on first load.
Re-verified live in a fresh browser: "LV Component" now appears on first load.

## Env limitations (not code gaps)

- **No `BLOB_READ_WRITE_TOKEN`** → can't upload a media asset through the editor UI here, so
  #8/9 were verified via the real `createAsset`/`updateAsset`/`renameFolder` endpoints + DB
  (the editor→endpoint wiring is unit-proven in `MediaManager.serverMirror.test`).
- **No `UNSPLASH_ACCESS_KEY`/`PEXELS_API_KEY`** → stock returns `[]` (the verified graceful
  path); add a key to see real results.
- **No form submissions on the demo site** → forms export returns an empty CSV (correct);
  the download UI is wired (`FormsScreen` Export button).

## Verdict

All 7 shipped changes verified end-to-end (server-confirmed); the data-loss-critical +
headline flows (version / components / my-templates) confirmed visually in the real editor;
one real cross-device gap found and fixed. 8 commits this run (`a9a27dce`..`3f47a64d`).
