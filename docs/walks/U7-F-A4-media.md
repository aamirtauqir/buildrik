# U7 · Media flow + F-A4 · Upload pipeline — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, 1440×900, real session, with a generated
64×64 PNG so the decoded size could be checked against a known value.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Media panel empty state | **PASS** — *"No images or files yet."* with **Upload** / **Browse stock**, and per-type counts (image 0 · video 0 · svg 0 · icon 0) that update live. |
| 2 | upload → auto-WebP | **PASS** — `walk-probe.png` landed as **`walk-probe.webp`**. The contract's auto-convert step is real. |
| 3 | server mirror | **PASS** — `POST /api/asset-upload` fired on upload. |
| 4 | insert onto the canvas | **PASS** — selecting the asset placed it: 9 → 10 elements. |
| 5 | **the image actually renders** | **PASS, and this is the one worth measuring** — the canvas `<img>` has `src: blob:http://localhost:3000/eee181db…` and **`naturalWidth: 64`**, matching the generated file exactly. It decoded; it is not a broken box. **Zero CSP complaints** in the console. |

Leg 5 is the point. `feedback_media_upload_unresolved` records this failing with
**three blocks stacked**: the CSP had no `blob:` in `img-src`, the sanitizer
dropped the attribute, and the rebuilt URL never reached the page. An `<img>`
being present proves none of that is fixed — `naturalWidth > 0` does. It is 64,
which is the width of the file I made.

## Not walked

Import-from-URL (whose modal tab is a documented ⛔ coming-soon stub), stock
search (Unsplash/Pexels/Pixabay), folders and smart folders, **Trash — which is
a `"Trash coming soon"` toast stub confirmed earlier this session**, bulk
move/delete, the alt-text detail rail and its AI generate, the Versions tab and
`replaceAcross`, the image editor (crop/adjust/resize), the optimizer, and the
369-icon Lucide picker.

Also not walked: the quota pre-check and its 80% / 95% warnings, the
`localOnly=true` retry queue when the mirror fails, the delete-during-upload
tombstone, and the FSM's intermediate states — the upload completed too fast to
observe `pending → uploading → optimizing → processing`.

## 2026-08-24 — the library stopped at 200 and said nothing

Found while chasing F-A2's unwalked gaps, fixed on the founder's call.

`loadServerMedia` asked for `limit: 200` under a comment saying the "UI can
paginate via media.listAssets cursor once user opens MediaTab"
(`BuildrikSyncProvider.ts`). The server had supported it the whole time —
`media.service.ts` over-fetches by one and returns `{ items, nextCursor }` — but
`client.media.listAssets` had **exactly one caller in the editor**, that one, and
it discarded `nextCursor`. No cursor consumer existed on any media surface. A
site past 200 assets showed 200, silently: the grid, the picker and
replace-across-site all read the same truncated set, with no count and no door.

The founder chose paging on demand over pulling everything at boot (a
50GB-quota site can hold tens of thousands of small assets, and the plan limit
is storage, not count) and over simply raising the cap, which moves the cliff
rather than removing it.

**Figma first.** Board `144:2` "Media · grid" now draws a `Load more` row
(`1311:11`) between the asset grid and the spacer — `Showing 200 of 412` on the
left, `Load more` on the right, 36h. The parent is a VERTICAL auto-layout whose
spacer has `layoutGrow: 1`, so appending the row let the spacer absorb the 36px
and left the footer exactly where it was — but only after the row was moved to
the spacer's index. Appended at the end it had shoved the footer up 36px, which
the read-back caught and a screenshot would not have.

**Then the code**, one page at a time end to end:

| layer | change |
|---|---|
| `media.service.ts` | returns `total` beside `items`/`nextCursor`, counted under the SAME `where` the page used |
| `BuildrikSyncProvider.ts` | `loadServerMedia(siteId, cursor?)` → `{ assets, folders, nextCursor, total }`; skips the folders round trip on a later page |
| `MediaManager` | holds `{ nextCursor, total }` and emits `SERVER_PAGE_CHANGED` — the first page is fetched by the shell at boot, "Load more" is pressed in the drawer, and the edges belong to neither tree |
| `useLibraryState` | `loadMoreAssets()`; `importServerAssets` already appends and skips known ids, so a double press cannot duplicate a row |
| `SlimLauncher` | the board's row: count, button, `Loading…` while in flight, `Try again` after a failure |

**Verified live** at 1440×900 against the running editor, with the real
`media.listAssets` envelope rewritten so only the paging edges were faked:

```
drawer:        gridWrap true, footer true, 1 cell
Load more row: "Showing 1 of 412" · "Load more" · enabled
after press:   a SECOND listAssets call —
               {"siteId":"…","limit":200,"cursor":"probe-cursor-1"}
```

So the whole chain runs: server count → provider → engine → hook → drawer →
click → next page requested with the cursor.

**Not verified:** a real library above 200 assets. The fixture cost was not paid;
what was verified is that the cursor is asked for and sent, which is the part
that never existed.

### Codex review of the paging fix — four findings, three of them mine to fix

**1 (High) — the in-flight lock was React state.** `loadingMore` disables the
button, but state lands on the next render, so two clicks in the same tick both
read it as false and both fire. Worse than a double fetch: if a later page
resolves first, the stale response writes its own older `nextCursor` back and
the next press re-fetches a page already imported. The lock is a **ref** now,
and a response only advances the edge if it still matches the cursor it was sent
with — a late response still imports its assets, because they are real, but it
does not rewind.

**2 (High) — skipping folders on later pages was not free.** Folders are not
paged, so re-fetching them looked like a wasted round trip. They are not FROZEN,
though: create a folder in another tab and move an asset into it between page 1
and page 2, and page 2 imports an asset whose `folderId` names a folder this
browser has never heard of. The root view then hides it for having a non-null
`folderId`, no picker entry exists, and the asset is simply invisible. Folders
are fetched on every page again — confirmed in the live probe, where the second
batch now carries `listAssets(cursor)` **and** `listFolders`.

**3 (Medium) — counting on every page.** `findMany` stops once it has a page;
`count` walks the whole match set, and on `search` there is no index on
`filename`/`altText` to walk. The count now runs only when there is no cursor;
later pages return `total: null` and the caller keeps the total it holds.
Falling back to the page length there would have shrunk the library to whatever
the last page contained.

**4 (Medium) — the count compared two different questions.** The row weighed
`serverPage.total` (a server-wide count) against `libraryItems.length` (filtered
on the client by type pill, folder and search). With the video pill on it read
"Showing 3 of 412"; with a search matching nothing, "Showing 0 of 412" beside
the no-results state, pushing the user toward Load more for an asset already
pulled and merely filtered out. Found in my own pass before the review came
back, and codex confirmed it against the pasted diff. It now compares what has
been PULLED.

Each guard was negative-tested: neutering the ref lock drops exactly the
same-tick test, neutering the cursor check drops exactly the late-response test,
and neither touches the other three.

### Also true, and not fixed here

**Search only searches what has been pulled.** The filters — type, folder,
search — all run on the client over the loaded set, so on a 412-asset library a
search reaches 200 of them. `listAssets` accepts a `search` argument the editor
never sends. That is a real gap, it is not what "Load more" was asked to fix,
and it is recorded here rather than folded in silently.

