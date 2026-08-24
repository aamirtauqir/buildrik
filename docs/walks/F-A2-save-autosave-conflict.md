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

## Addendum, 2026-08-24 — the three gaps this walk named, chased down

The "Not covered by this walk" list above is worked below. Two of the three
turned out to hide defects. **Everything here is a code-contract reading, not a
live observation** — the live walk is the next step and is named at the end.

### Closed, no defect

**`HistoryManager`'s numbers are what the walk said.** `coalesceDelay: 500`,
`checkpointInterval: 10`, `maxHistory: THRESHOLDS.HISTORY_MAX_SIZE`
(`HistoryManager.ts:71-73`), and `HISTORY_MAX_SIZE: 100`
(`shared/constants/config.ts:108`). The cited figures match the code exactly.

**The Overwrite branch's "adopt token, re-save" is sound.** The suspicion was a
stale-closure: `setBaselineLastEditedAt(conflict.serverToken)` followed on the
very next line by `saveProject()` (`AquibraStudio.tsx:655-657`). It is not a
React setter — it writes a module-level variable in `BuildrikSyncProvider`
(`:94`) that the save reads synchronously at `:359`. The token round-trips
intact, too: the server throws `SAVE_CONFLICT:${site.lastEditedAt.toISOString()}`
(`sites.service.ts:604-606`), the client regexes that ISO string out and echoes
it back unchanged, and the server compares the same `toISOString()` form. The
event's `serverLastEditedAt` is correctly mapped to `serverToken` at
`AquibraStudio.tsx:334`. Autosave during an open conflict is handled as well —
`useComposerInit.ts:435` catches `SaveConflictError` separately and leaves the
dirty state standing rather than painting "Save failed" over the modal.

### D1 — a successful retry leaves the failure notice on screen for good

`SyncRetryQueue.run()` deletes the key on success and returns — it never calls
`notify()` (`syncRetryQueue.ts:81-83`). Only the failure path notifies. So no
subscriber is ever told the queue drained.

Beside that, a toast's action button does not dismiss its own toast
(`Toast.tsx:194` renders `onClick={action.onClick}` and nothing else), and all
four stranded-mirror toasts are `duration: Infinity` with a **Retry now**
action — `useCmsSync.ts:58`, `useComponentSync.ts`, `useVersionSync.ts`, and the
template one at `useStudioHandlers.ts:105`.

Put together, both branches after pressing **Retry now** are wrong:

- the retry SUCCEEDS → nothing notifies, nothing dismisses, and a permanent
  toast keeps asserting the change never reached the server;
- the retry FAILS again → the click already reset the `toastShown` latch
  (`useCmsSync.ts:63`), the subscriber fires, and a **second identical
  Infinity toast stacks** beside the first.

### D2 — the queue promises a replay it cannot survive to make

The queue is `private queue = new Map<string, () => Promise<boolean>>()`
(`syncRetryQueue.ts:25`) — closures, in memory. Nothing in that file persists or
rehydrates them; its only storage mention is a comment about the *local* write
that already happened. A reload or a navigation therefore discards every queued
mirror permanently.

All four toasts tell the user: *"Retry now, or leave it — a reconnect replays the
queue."* That is true only while the tab stays open (`syncRetryQueue.ts:30`
listens for `online`), and nothing says so.

Both exit doors are blind to it. `StudioHeader.tsx:404` guards `beforeunload` on
`isDirty || saveStatus === "saving"`, and the in-app `guardedNavigate`
(`:353-367`) keys on `offline`, `isDirty`, `saveStatus`. Every one of those is
**project**-save state; the stranded mirrors are CMS collections, components,
templates and versions, which never touch the project save. A clean project with
N stranded mirrors leaves silently.

The local IndexedDB copy survives, so the editor keeps showing the component or
collection. The server never receives it — which is why this is a divergence the
user cannot see rather than an error they can.

`getCmsSyncPendingCount` / `getComponentSyncPendingCount` /
`getTemplateSyncPendingCount` / `getVersionSyncPendingCount` all exist and have
**zero callers** outside their own modules. The signal the guard needs is already
built.

### D3 — the media pull is capped at 200 and the pagination it promises was never built

`loadServerMedia` asks for `limit: 200` (`BuildrikSyncProvider.ts:430`) under a
comment that says the "UI can paginate via media.listAssets cursor once user
opens MediaTab". The server supports it properly — `media.service.ts:107-117`
over-fetches by one and returns `{ items, nextCursor }`. But
`client.media.listAssets` has exactly one caller in the whole editor, that one,
and it discards `nextCursor`. No cursor pagination exists in any media surface.

A site with more than 200 assets shows 200, silently, with no count and no
"load more" — and the picker, the replace-across-site flow and the grid all read
that same truncated set.

### Verified live, 2026-08-24 — D1 and D2 both reproduced and both fixed

Walked in the running editor (`localhost:3001/edit/<site>`, Demo AI Site) with
`siteVersions.create` refused at the network layer, so a real version save
strands a real mirror. Toasts counted off the fixed bottom-right viewport
container, not by matching `[role="status"]` — the inspector hint and the search
live-region carry that role too and made the first count read 5.

| step | before | after |
|---|---|---|
| mirror refused | 1 notice | 1 notice |
| **Retry while the server still refuses** | a SECOND identical notice stacks | still exactly **1** |
| **Retry once the server accepts** | the notice stays, still saying it failed | **0** — it retracts |
| **Exit, project clean, 1 mirror stranded** | no dialog, page leaves, queue dies | dialog, quoted below |

> **Some changes are only on this device**
> 1 change hasn't reached the server yet. Leaving drops the retry queue — they
> stay in this browser, and your other sites won't see them.
> *Stay* · *Leave anyway*

The topbar read clean at that moment (`Unsaved` absent), which is the whole
point: nothing in the project-save state knew anything was outstanding.

Guard tests were negative-tested — neutering each fix drops exactly the three
StudioHeader stranded cases, the queue's drain case, and three of the four
retract cases, and nothing else.

### Still not verified

**D3, the 200-asset media cap, remains code-read only.** Reproducing it needs a
site with more than 200 assets, which is a fixture cost this walk did not pay.
Its code path is deterministic and quoted above; nothing about it is fixed yet.
Fixing it properly needs a "load more" affordance that no board draws, so it is
a founder decision, not a silent widening of this increment.

### Harness notes, so the next walk does not pay for them again

- `verifyMagicLink` is rate limited to **5 attempts per 15 minutes**
  (`server/trpc/routers/auth.ts:21`). Probe re-runs burned through it twice and
  every login then failed in a way that reads exactly like a broken login. Save
  a `storageState` once and reuse it.
- The magic-link callback is a client component whose `useEffect` fires twice
  under React StrictMode in dev: the first call consumes the single-use token
  and sets the session, the second finds it used and redirects to
  `/auth/error/expired-link`. **Landing on that screen does not mean the login
  failed** — judge on the session cookie.
- tRPC refuses any POST whose `Origin` is not `EDITOR_ORIGIN` or
  `NEXT_PUBLIC_APP_URL` (`app/api/trpc/[trpc]/route.ts:21-26`), answering
  `403 Forbidden: origin not allowed`. Running the dashboard on a non-default
  port therefore breaks every mutation until `NEXT_PUBLIC_APP_URL` is set to
  match. This cost an hour that looked like an auth bug.
- Port 3000 on this machine is shared with the founder's `ranklar-new` dev
  server. It had taken 3000, so the editor was being served someone else's
  marketing site; buildrik now runs on 3001 here.

## Codex review of the fix, 2026-08-24 — five findings, all five real

The first fix passed its own tests and its own live walk and was still wrong in
five places. Each was checked against the code before being accepted; none was
taken on the reviewer's word.

**1 (High) — `drop()` drained the queue in silence.** The delete paths call
`queue.drop("<upsert>:<id>")` to cancel a queued upsert a deletion has made moot
(`componentSync.ts:69`, and the same shape in `versionSync` / `cmsSync`), then
`run()` a delete that usually succeeds first try. That `run()` cannot notify —
nothing was ever queued under the delete's own key — and `drop()` did not
either, so the count reached zero with nobody told and the permanent notice
stood over an empty queue. `drop()` now notifies when it actually removed
something.

**2 (High) — the template notice could not be retracted by a reconnect.** It was
raised inline from the save handler, which sees only its own mirror's outcome.
`templateSync` has the same `online` auto-replay as the others, so regaining
connectivity without pressing Retry left the notice claiming the template was
device-only after it had reached the server.

**3 (Medium) — and two template failures stacked two permanent notices**, with
one Retry dismissing only its own while re-raising a third.

2 and 3 have the same root: templates were the odd domain out — nothing
subscribed to `onTemplateSyncError` at all. The notice is now a coalesced
subscriber in `useStudioHandlers`, the same shape `useCmsSync`,
`useComponentSync` and `useVersionSync` use: one notice for N failures,
retracted when the count reaches zero however it got there.

**4 (Medium) — the instance registry had no removal path.** `totalPendingMirrors`
summed a `Set` of every `SyncRetryQueue` ever constructed. A dev hot-reload of a
sync module leaves the abandoned queue in that set, still carrying whatever was
pending when it was replaced, so the exit guard warns about work no live queue
holds; ad-hoc queues in tests contaminated the same total (the first test had to
compensate with a `before` offset, which was the smell). Registration is now
**keyed by domain** — `registerPendingSource("cms", …)` — so a reload replaces
its own entry and an unregistered queue cannot be counted at all.

**5 (Low) — the exit copy overclaimed.** It said *"your other sites won't see
them"*, but the count also covers CMS entries and saved versions, which are
site-scoped and would never appear on another site even after a perfect sync.
Now: *"they stay on this device and never reach your account."*

Re-verified live after the fixes — same probe, same refused `siteVersions.create`
— and the dialog reads with the corrected copy. Negative-tested again: neutering
`drop()`'s notify drops exactly the supersession test, and neutering the template
drain drops exactly the retraction test.

## Figma updated, 2026-08-24 — board `1172:4804` now draws three exit states

The change adds a third exit-guard state, and the board drew two. Cloned
`risky-offline` into a `stranded` frame and rewrote its copy through
`use_figma`; the parent is renamed
**`Exit · guard — dirty · risky-offline · stranded`** and `boards.json` is
synced to match, so the census does not drift.

Read back rather than trusted (`figma-mcp.mjs get_metadata`):

```
<frame id="1309:2" name="stranded" x="888" y="0" width="420" height="117">
  <text id="1309:3" name="Some changes are only on this device" …/>
  <text id="1309:4" name="2 changes haven't reached the server yet. Leaving drops
        the retry queue — they stay on this device and never reach your account." …/>
  <frame id="1309:5" name="foot">  btn/Stay · btn/Leave anyway  </frame>
</frame>
```

Two traps avoided, both by checking rather than assuming:

- The parent is **HORIZONTAL auto-layout** and each state is **VERTICAL**. The
  script set `x`/`y` and resized only when `layoutMode` was `NONE`, so the
  documented `resize()` collapse never got the chance — auto-layout grew the
  parent to 1308 itself.
- The new body is 15 characters longer than the one it was cloned from, and
  every state frame has `clipsContent: true`. Read back:
  `textAutoResize: "HEIGHT"`, `truncation: "DISABLED"`, height 26 — the same
  two lines as before, so the height is computed, not cropped.

