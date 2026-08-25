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


---

## Addendum, 2026-08-25 — the two legs this record left uncovered, walked live

Lane 1 of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. Both remaining
entries from "Not covered by this walk" are now exercised against the running
editor on the committed rig (`scripts/baseline/editor-rig.mjs`), fixture
`cmrsur1fp000unh3rvmmiq25t`, 1440×900. Editor booted with **0 console errors**.

### Leg 4 — crash recovery. **PASS**, and this record's reasoning about it was wrong.

The 08-24 entry said the sentinel is *"consumed+removed at the next bootstrap
(`:113-115`)"*. Nothing in bootstrap calls it. The real consumer is
`RecoveryBanner.tsx:47`, which calls `RecoveryManager.consumeLastCrash()` **in
a `useState` initialiser on first render**. Same net effect, different
mechanism — and the difference matters, because a bootstrap consumer would fire
with no UI attached while this one cannot surface unless the banner mounts.

Walked with a **real uncaught error**, not a hand-written key:

| step | observed |
|---|---|
| clean boot | `sessionStorage["buildrick:last-crash"]` = `null` — correct, and this record was right that absence is not a defect |
| `setTimeout(() => { throw … })` | sentinel written: `{"at":…,"source":"error","reason":"walk F-A1: simulated runtime fault"}` |
| reload, same tab | banner renders: **"Recovered your work** after an unexpected close · moments ago · 4 pages."· `Discard & reload` · `Keep changes` |
| after render | sentinel `null` — consumed once, will not re-surface |

`role="status"`, `aria-label="Recovered work"`, page count correct against the
4-page fixture. Board `C6 · Recovery banner` covers this state.

**Note, not a defect:** the banner is 53px and pushes the whole shell down. It
stacks with the review bar (32px) and the cookie-consent bar at the bottom, so
in the worst case the canvas loses ~85px of height at the top and ~40px at the
bottom at once. Visual, so out of this arc's instrument — recorded for the
redesign arc.

**Dead event:** `EVENTS.RUNTIME_FAULT_CAUGHT` is emitted at
`RecoveryManager.ts:101` and has **zero subscribers** outside its own test.
The banner reads the sentinel instead, so nothing is broken — but the emit is
decoration.

### Leg — the DS/storage schema migration. **v3 PASS · v1 partial, and it litters.**

Two generations run at module scope from `AquibraStudio.tsx:64-65`:
`migrateStorageKeys()` (`aquibra-` → canonical) then `migrateAqbKeys()`
(`aqb-` → `buildrick-`). Walked by seeding both legacy generations, clearing
both completion flags, and reloading.

**v3 (`aqb-` → `buildrick-`) — full pass.**

| case | result |
|---|---|
| static map — `aqb-recent-icons` | → `buildrick-recent-icons` = `WALK_V3_STATIC`, old key removed |
| dynamic family — `aqb-layers-PAGE1-open` | → `buildrick-layers-PAGE1-open` = `WALK_V3_DYNAMIC`, old key removed |
| completion flag | `buildrick-aqb-migration-v1-complete` written |
| the flag itself | correctly **excluded** from the dynamic rename (`EXCLUDED_AQB_PREFIXES`), so it cannot rename itself mid-loop |

**v1 (`aquibra-` → canonical) — migrates, but abandons what it skips.**

`aquibra-guides` → `buildrick-guides` = `WALK_V1_GUIDES`. But
`aquibra-inspector-mode` was **not** migrated and **was left in place**, because
`buildrick-inspector-mode` already held a value.

That skip is the documented safety model — never clobber an existing new-key
value — and it is right. What is not right is the litter:

```js
if (value !== null && !localStorage.getItem(newKey)) {   // storageMigration.ts
  localStorage.setItem(newKey, value);
  localStorage.removeItem(oldKey);        // <- only reached when NOT skipped
}
```

The skip branch does nothing at all, so the legacy key survives. And the
completion flag is written **unconditionally** after the pass, so the next boot
returns early and never revisits it. For any user who had both keys, the
`aquibra-*` row is permanent: never read, never removed, forever. Same shape in
`migrateAqbKeys`.

Low severity — no data loss, no user-visible effect, and it is bounded by the
size of `MIGRATION_MAP`. Recorded rather than fixed, because the safe fix
(remove the old key on skip) discards a value a user might still want if the
new key was written by accident, and that is a product call.

**Verified remaining after the walk:** `aqb-migration-v1-complete` (v1's own
flag, correctly excluded), `aquibra-inspector-mode` and `aquibra-project` (the
skipped rows).

### What this walk did NOT assess

**Visual and IA.** A walk exercises behaviour, state and data. It does not
detect visual or information-architecture defects — see the arc plan's
"What a walk detects". The redesign arc's ledger rates surfaces this walk
touched (`R0` element glyphs, `R2` stacked floats) and none of that is visible
from here.

### Figma — coverage exists; one duplicate and one copy conflict

No boards drawn (board creation belongs to the redesign arc). Coverage checked
against `boards.json`, then both candidates read at native size.

**Duplicate.** `C6 · Recovery banner` (`307:2223`, 1440×140) is a banner-only
crop of the exact state `S1.2 · crash-recovery` (`297:2027`, 1440×900) already
shows in context — same flow-step, same state, different name. Recorded in
`boards.json`; not deleted, that is the founder's call.

**Both boards' copy contradicts the shipped product, and the product is right.**

| | board `297:2027` / `307:2223` | shipped, walked 2026-08-25 |
|---|---|---|
| copy | "↩ Restore unsaved work from 3 minutes ago?" | "Recovered your work after an unexpected close · moments ago · 4 pages." |
| buttons | **Restore** · Discard | **Discard & reload** · **Keep changes** |
| framing | a question — nothing restored yet | a statement — the work is already back |

Not a wording nit. The board's framing says the restore has not happened and
offers to perform it; the code has already restored and offers to throw it
away. Opposite mechanisms wearing similar words — a behaviour claim dressed as
copy. Per the repo's precedence rule behaviour follows the **code**, so both
boards are the stale side, and `authority` on each is now `code:copy-wins`.

The shipped copy is **test-locked** — `RecoveryBanner.test.tsx` asserts
`/recovered your work/i`, `/keep changes/i`, `/discard/i` and the page count —
so it cannot drift back to the board silently.

### Tests

`RecoveryManager.test.ts` + `RecoveryBanner.test.tsx` — **30 passed**. No new
test written: this lane found no code defect that needed fixing. The migration
litter is recorded-not-fixed (the safe fix discards a value a user may want,
which is a product call) and the dead `RUNTIME_FAULT_CAUGHT` emit is
decoration, not a fault.

**Lane 1 status: both uncovered legs closed.** Crash recovery passes end to
end; the schema migration passes on v3 and litters on v1.
