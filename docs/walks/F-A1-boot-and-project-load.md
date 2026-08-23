# F-A1 · Boot & project load — walk record

Walked 2026-08-24 · commit `b5deff5f` (the build now live on app.buildrick.io)
· localhost:3000, 1440×900, Playwright, real session storageState.

**Why localhost and not production:** walking prod needs a session in the live
app, which means minting a magic-link token against production data. That is a
real action on real users' infrastructure and was not authorised. The DEPLOY is
verified separately and independently (BUILD_ID read from the serving pid, plus
four string markers present/absent in the served bundle). This walk verifies the
BEHAVIOUR of the same commit.

## Legs

| # | leg | result |
|---|---|---|
| 1 | normal load with siteId | **PASS** — 6 elements on canvas, save pill seeded `Saved · just now`, toast `Project loaded / Loaded from dashboard` |
| 2 | load RPCs blocked → fallback | **PASS** — 2 RPCs aborted, canvas falls back, toast `Couldn't load this site from the dashboard. You're seeing local changes for now.` with Dismiss + Retry |
| 2b | **edit after a failed load** | **PASS, and this is the one that matters** — inserted an element, waited 6s (autosave debounce is 1s), **0 save POSTs attempted**. The `_loadedSites` guard holds. |
| 3 | `UNAUTHORIZED` on load | **PASS** — `Session expired. Sign in to load this site from the dashboard — you're seeing local changes for now.` with Dismiss / **Sign in** / Retry. Correctly distinguished from leg 2's generic failure. |
| 4 | crash recovery (`buildrick:last-crash`) | **NOT EXERCISED.** No crash was triggered. Code read instead: the sentinel is written by `recordCrash` (`RecoveryManager.ts:95`) and consumed+removed at the next bootstrap (`:113-115`), so its absence on a clean boot is correct, not a defect. Claiming this leg passes would be claiming a test I did not run. |

Leg 2b is the reason this flow is in the SHIP gate. `feedback_failed_load_then_autosave_wipes_the_site` records this exact path turning a
2-page site into a single "Page 1": the fallback project has a child, so it
counts as content, and a full-snapshot save deletes every page the payload
omits. The guard is `_loadedSites` in `BuildrikSyncProvider.ts` — a save is only
permitted for a site whose project actually came back from the server.

## Doc drift found (PRD Ch.11 §F-A1)

1. `else create "Page 1"` — **stale as of `7bb6653a` (today)**. All six call
   sites now route through `getDefaultPageName`, so an empty project gets
   **"Home"**. "Page 1" also slugified to `page-1`, the one slug the SEO score
   marks as a placeholder.
2. Toast copy is recorded as `"Load failed / falling back to local"` and
   `"Session expired / Sign in"`. The shipped copy is fuller and better on both
   — full sentences that say what happened and what the user is looking at now.
   Drift in the app's favour; the register is behind.

## Not covered by this walk

`loadServerMedia`'s 200-asset cap, the DS schema migration step, and per-site
IndexedDB scoping. Named so the next pass knows they are open, not assumed.
