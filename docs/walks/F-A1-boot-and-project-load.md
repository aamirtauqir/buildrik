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

The DS schema migration step. The other two are closed: `loadServerMedia`'s
200-asset cap (fixed 2026-08-24, see `U7-F-A4-media.md`) and per-site IndexedDB
scoping — worked below, because it turned out to be a live cross-site bleed.

## Addendum, 2026-08-24 — "per-site IndexedDB scoping" was a live data bleed

The walk listed this as unverified. It is not a hygiene item: two of the four
browser stores were never scoped at all, and the result is visible in the
product.

`useComposerInit` scoped `versions` and `components` by `setProjectId(siteId)`,
under a comment explaining exactly why that matters — *"every site edited in the
same browser shares the 'default' bucket"*. **Media and CMS were left out of that
list**, and neither manager knows what a site is: `MediaManager` and
`CollectionManager` each contain **zero** references to `siteId` or `projectId`,
their IndexedDB stores carry no site column, and nothing filters on read.

**Reproduced live.** A second site was created in the founder's own workspace,
opened in the same browser context immediately after the first:

```
site A (cmpxu9tt…) → {"cells":1,"names":["Aalv-renamed.png"]}
site B (cmt79bsu…) → {"cells":1,"names":["Aalv-renamed.png"]}
```

Site B was seconds old and had never been uploaded to. It was showing site A's
asset — not a stale cache, the actual row sitting in a browser-global store.

### The remedy, and the one it deliberately is not

`ComponentStorage` solves this with a `projectId` IndexedDB **index**, defaulting
to `"default"`. That buckets every pre-existing row under `"default"` and then
never reads it again. For components that is survivable — they re-hydrate from
the server. **A media asset can be local-only**: uploaded while offline, never
mirrored. Bucketing those away would make media disappear with no way back.

So instead: `MediaAsset.siteId?` and `CMSCollection.siteId?`; reads test
`siteId === current || siteId == null`; every write stamps the current site —
media through a single private `persist()`, because six call sites wrote assets
and none of them knew about the site; and the CMS server hydration, which writes
straight past the manager, stamps the site it fetched from.

Net effect: rows that predate scoping stay visible everywhere, everything from
here on is scoped, and because a server import stamps the site it came from, the
bleed stops after one load per site with nothing vanishing.

**Verified live, same probe:**

```
site A → {"cells":1,"names":["Aalv-renamed.png"]}
site B → {"cells":0,"names":[]}
```

### Not verified

CMS was fixed on the same shape and covered by tests, but the two-site CMS bleed
was not walked in the app — the media one was, and the code paths are the same
two lines. The scratch site created for this (`Bleed probe B`) is deleted; it is
one Prisma insert to recreate if a future walk needs two sites.

### Codex review of the bleed fix — four findings, three of them mine to fix

**1 (High) — the scope was applied and never announced.** `setProjectId` reloads
storage silently, and `useLibraryState` snapshots `getAssets()` on mount and
re-reads only on `INITIALIZED` / `MEDIA_*` / folder events. A drawer that had
already mounted therefore kept showing the pre-scope global library for the rest
of the session. **My live probe missed this by construction** — it navigates to
each site fresh, which mounts the drawer *after* scoping. `setProjectId` emits
`INITIALIZED` now, and only when the site actually changed.

**2 (High) — folders were still completely global.** Scoping assets and leaving
folders alone does not half-fix the bleed, it moves it: site B still lists site
A's folders, and dropping an asset into one writes across sites. `MediaFolder`
carries `siteId` now, reads filter it, and all five folder writes go through one
`persistFolder`.

**3 (Medium) — a legacy row is adopted by whichever site edits it first.** True,
and deliberate: the alternative is `ComponentStorage`'s index, which hides those
rows forever. Recorded rather than changed.

**4 — a filtered-out asset stopped getting its blob URL repaired.** A page in
this site may still point at an asset that now belongs to another, inserted back
when the library was global. The remap runs over **every** row again — only the
scoped set is exposed — so the image is repaired even though the drawer no
longer lists the asset.

Negative-tested: removing the emit drops exactly the announce test, unfiltering
folders drops exactly the folder test, dropping the folder stamp drops exactly
that one, and remapping over the scoped set only drops exactly the blob test.

