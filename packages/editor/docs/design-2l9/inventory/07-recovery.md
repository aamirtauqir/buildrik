# 07 · Recovery and access — gap inventory

Page `3:8` (`page-3-8.json`), 94 active boards, manifest family `07/recovery`. Read-only pass against `feat/design-2l9` @ `c7920dd91`. File paths are relative to `packages/editor/src/editor/` unless they say otherwise. The archetypes are judged from dump texts, instances and boxes, because screenshots do not exist yet.

**Counts:** match 2 · drift 34 · missing 53 · blocked 5 (4 `blocked:handoff-note`, 1 `blocked:superseded-one-undo`) · code-ahead 0 as row status (see dispositions).

Board sample data ("Fieldwork Studio", "Ana", "12 changes", "10:31", "v13", "12 Nov") is not counted as drift.

## Load-failed board copy (verbatim, for Phase 1 Task 1.6)

Each load-failed cause the code distinguishes (`LoadErrorKind`, `shell/LoadErrorBanner.tsx:33`; set by `shell/hooks/useComposerInit.ts:429`) is listed with the board that draws it. Every banner sits in a 40px "Global banner" slot at y=56, directly under the topbar, and pushes the workspace down. Today the code mounts it **above** the `<header>` (`shell/AquibraStudio.tsx:668`).

| Code kind | Board | Banner tone | Exact board copy |
|---|---|---|---|
| `network` | B7-G02 `225:2821` "Site didn't load / banner and read-only canvas" | error | Banner: `✕` · `Couldn’t load this site. You can look around; editing waits until it loads.` · buttons `Download local copy` · `Retry`. Inspector header line: `View only until the site loads`. Bottom bar status: `Not loaded · nothing saved yet`. Topbar: `Exit ‖ <site> ‖ Site settings ‖ In review · 2 open ‖ Preview` (**no Publish**). |
| `auth` (session expired) | B7-G04 `225:3888` banner, B7-G03 `225:3353` dialog | error | Banner: `Session expired — changes aren’t saving. They’re kept in this tab.` · `Sign in ↗`. Dialog (480 wide): title `Sign in again to save` · body `Your session expired. Your 12 changes are kept in this tab and in this browser. Sign in again to save them.` · `Keep editing` · `Try saving again` · `Sign in ↗`. |
| `missing` (site deleted) | B7-G22 `227:9531` | error | Banner: `This site was deleted. Your unsaved changes are kept in this browser. A site owner can restore it from Recently deleted for 30 days.` · `Download changes` · `Go to dashboard ↗`. Inspector line: `View only · this site was deleted`. |
| `forbidden` (role) | B7-G18 `227:7411` (closest board; it is drawn as a mid-session role change) | warning | `⚠` · `Your role changed to Viewer — editing is off. Changes that weren’t saved are kept in this browser.` · `Download them` · `Ask an admin`. Inspector line: `View only · your role changed`. |
| (opening, not a failure) | B7-G01 `225:2297` | — | Single skeleton with `Opening Fieldwork Studio…` (`Opening <site name>…`). |

Several conditions at once (B7-G31 `227:14297`) share one banner slot plus a `2 more  ⌄` popover. That board shows the session banner on top, then `You’re offline. Everything saves when you reconnect.` and `A new version of Buildrick is ready.` · `Reload`.

Known conflict: the `missing` copy in code (`LoadErrorBanner.tsx:15-17,97`) says "there is no trash to restore from". The board says "restore it from Recently deleted for 30 days", and so does the editor itself in `sidebar/tabs/settings/screens/DangerZoneScreen.tsx:326`. Task 1.6 must check which one the server actually does before taking the board's words.

## C · Canvas states (C01–C09)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Insertion target locked | 10:2 | 1 | `shell/hooks/useBlockInsertion.ts:81-92` | missing | The Add panel has no insertion-target card. The board wants `Hero is locked` / `Unlock the parent to insert here.` / `Unlock Hero`. |
| Insertion target stale | 10:370 | 1 | `shell/hooks/useBlockInsertion.ts:81-83` | missing | The board wants `Target no longer exists` / `Choose another container.` / `Select target`. Today the insert falls back to the page root. |
| Narrow insertion, Inspector closed (1280) | 10:3787 | 1 | — | missing | The board wants an `Insert into Hero` / `Home / Hero · At end` header, a `Text added to Hero` / `Selected on canvas · Focus stays here` receipt and a collapsed `Inspector` tab. |
| Mixed multi-selection | 10:1190 | 1 | `inspector/components/InspectorHeader.tsx:78`, `inspector/components/MultiSelectBar.tsx`, `inspector/sections/typography/FontPicker.tsx:124` | drift | "Mixed" fields match. The header says `2 selected · Elements` where the board says `2 elements`. The board's canvas bar `2 selected · Duplicate · Delete · Group · More` does not exist: `canvas/controls/UnifiedSelectionToolbar.tsx` is single-element only. |
| Save pending | 10:1626 | 1 | `chrome-ui/SaveStatus.tsx:58` | match | phase1 (bottom bar). |
| Save failed, edits retained | 10:2199 | 1 | `chrome-ui/SaveStatus.tsx:67`, `shell/SaveFailedBanner.tsx:74-95` | drift | phase1. The bottom bar reads `Couldn't save — Retry`; the code says `Save failed — retry`. The board's canvas strip reads `Save before publishing. Your changes are kept.` + `Retry`; the code draws a red card titled `Couldn't save <site · page>` with `Retry save` / `Keep editing`. |
| Focus mode | 10:2647 | 1 | — | missing | No hide-all-panels mode and no `Show panels` control. |
| Restored panel arrangement | 10:2795 | 1 | `shell/hooks/useStudioState.ts:190-211` | match | Panel state persists through `PANEL_STATE_KEY`. Still to be confirmed live. |
| Narrow window overlay (1366) | 10:3228 | 1 | — | missing | No narrow-window inspector overlay. The Phase 1 pins cover only the topbar and bottom bar. |

## G · Global states (G01–G37)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Opening skeleton | 225:2297 | 1 | `chrome-ui/Skeleton.tsx:91`, `shell/AquibraStudio.tsx:577` | drift | phase1. No site-name line. |
| Load failed / site deleted | 225:2821, 227:9531 | 2 | `shell/LoadErrorBanner.tsx:44-122`, `shell/AquibraStudio.tsx:668` | drift | phase1 Task 1.6. Copy, actions (`Download local copy` / `Download changes`, `✕` vs a `Dismiss` text button), slot position, and the inspector "View only" line all differ. See the copy table above. |
| Session expired dialog | 225:3353 | 1 | `shell/modals/SessionExpiredModal.tsx:86-131` | drift | Different title and body. The code adds an "N changes at risk" list. |
| Session expired banner | 225:3888 | 1 | `shell/hooks/useComposerInit.ts:821-829` | missing | A mid-session 401 only opens the modal or a toast. |
| Signed in again / different account | 225:4416, 225:4941 | 2 | — | missing | No automatic resend and no account-identity check. |
| Unsaved work, server older | 225:5474 | 1 | `shell/RecoveryBanner.tsx:129-139`, `shell/hooks/useComposerInit.ts:333-350` | drift | The code has two surfaces (banner "Recovered your work…" plus toast "Some work never reached the server" with `Restore my edits`). The board has one banner: `Unsaved edits from your last visit (today 10:12) were kept in this browser. The site hasn’t changed since.` · `Discard…` · `Restore my edits`. |
| Unsaved work, server newer / unknown | 225:6003, 225:6532 | 2 | `shell/RecoveryBanner.tsx:116` | missing | The code hides the banner in both cases. The board shows `Download my copy` · `Compare`. |
| Discard kept copy confirm | 225:7061 | 1 | `shell/RecoveryBanner.tsx:120-127` | missing | Discard is immediate. The board wants `Delete the kept copy?` with Cancel as the default. |
| Offline / can't reach | 225:7600, 225:8126 | 2 | `shell/hooks/useComposerInit.ts:800`, `chrome-ui/SaveStatus.tsx:66` | drift | Toast plus pill, where the board draws a warning banner (`Retry now` on G12). |
| Reconnecting | 225:8654 | 1 | — | missing | The retry schedule runs silently. |
| Conflict dialog | 225:9180 | 1 | `shell/modals/ConflictModal.tsx:59-101` | drift | The title matches. Body, button set and order differ (`Save a backup` vs `Download a copy`), and the board dialog is 720 wide. |
| Reload-latest confirm | 225:9715 | 1 | `shell/modals/ConflictModal.tsx:90` | missing | Reload runs immediately. |
| Overwrite confirm | 225:10249 | 1 | `shell/modals/ConflictModal.tsx:83-96` | drift | Inline warning only. The newer version is not kept as "Before overwrite" first (needs server support). |
| Overwrite stopped | 225:10783 | 1 | — | missing | |
| Role changed to Viewer | 227:7411 | 1 | `shell/hooks/useSaveCallback.ts:105`, `shell/hooks/useComposerInit.ts:325-332` | drift | Toast instead of banner. No `Download them` / `Ask an admin`. |
| Role raised / workspace deletion | 227:7943, 227:8473, 227:9003 | 3 | — | missing | |
| New version (ready / saving / stopped) | 227:10063, 227:10593, 227:11119 | 3 | — | missing | No build-version detection. |
| Editor stopped (crash) | 227:11649 | 1 | `shell/AquibraStudio.tsx:98-147` | drift | Code: `Something went wrong` / raw message / `Reload`. Board: `Something stopped the editor` · `You have unsaved changes — download a copy before reloading.` · `Error code …` · `Download a copy` · `Reload editor` · `Back to sites`. |
| Panel chunk skew | 227:12184 | 1 | — | missing | |
| Also open in another tab | 227:12711 | 1 | `shell/hooks/useOtherTabNotice.ts:33-40` | drift | Code: persistent toast with different copy. Board: banner plus `Edit here`. |
| Tab handoff (moved / refused) | 227:13239, 227:13769 | 2 | — | missing | |
| Banner stack "N more" | 227:14297 | 1 | — | missing | There is no single banner slot. |
| Narrow window / phone | 227:14836, 227:15364 | 2 | — | missing | |
| Toast stack | 227:15894 | 1 | `chrome-ui/Toast.tsx:325` | drift | No cap of ≤1 transient + ≤2 persistent, and no `+1 more`. |
| Notifications grouped | 227:16435 | 1 | `shell/NotificationPanel.tsx:206-218` | drift | The header and `Mark all read` match. Code groups by day; the board groups into `This site` / `Other sites`. |
| Site locked on Free / trial ended | 227:16980, 227:17512 | 2 | — | missing | No plan or trial state in the editor. |
| Handoff note | 227:18042 | 1 | — | blocked:handoff-note | Annotation only. |

## H · History, Saves, Published, Activity (H01–H16)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Session rows | 230:12999 | 1 | `sidebar/tabs/history/HistoryTab.tsx:33-37`, `sidebar/tabs/history/components/ActivityView.tsx` | drift | The tabs match. Rows lack verb · target · place, the inline `Restore to here` and the j/k footer hint. |
| Restore-to-here confirm | 230:13557 | 1 | `sidebar/tabs/history/components/ActivityView.tsx:361-375` | drift | Code titles by time; the board titles by step name. |
| Session restored row | 230:14116 | 1 | `shell/TimeTravelHost.tsx:141` | drift | |
| Saves filter + Save a version | 230:14662 | 1 | `panels/version-history/SavesFilter.tsx:36`, `sidebar/tabs/history/HistoryTab.tsx:404` | drift | The code uses an Author submenu where the board has a flat list. Save a version is a footer in code, a header button on the board. |
| Version details / inline compare | 230:15227 | 1 | `panels/version-history/VersionList.tsx:322`, `panels/version-history/CompareView.tsx:90` | drift | |
| Restore to draft + Undo restore | 230:15797 | 1 | `shell/TimeTravelHost.tsx:228` | drift | No `Undo restore` toast. |
| Delete version interim confirm | 230:16354 | 1 | `panels/version-history/VersionList.tsx:259` | drift | Inline confirm in code, a dialog on the board. |
| Delete version after RT-D1 | 230:16914 | 1 | — | missing | Needs server soft-delete (RT-D1). |
| Published releases | 230:17468 | 1 | `shell/PublishHistory.tsx:434` | drift | Code: `Compare with current`. Board: `Compare with live`. No Pruned row in code. |
| Republish confirm | 230:18022 | 1 | `shell/PublishHistory.tsx:656-680` | drift | Behaviour stays with the code contract (it republishes as a new version, `authority: code:`). Only the copy and title follow the board. |
| Compare view | 230:18582 | 1 | `shell/CompareHost.tsx:156-164` | drift | |
| Time Travel | 230:19126 | 1 | `shell/TimeTravelHost.tsx:332` | drift | |
| Activity list | 230:19664 | 1 | `sidebar/tabs/activity/ActivityLogView.tsx:50-57` | drift | No `Load more` (needs a cursor API). |
| History from Activity | 230:20217 | 1 | `sidebar/tabs/activity/BackToActivityRow.tsx:24` | drift | `‹ Activity` → `‹ Back to Activity`. |
| Saves offline | 230:20770 | 1 | — | missing | |
| Activity load error | 230:21326 | 1 | `sidebar/tabs/activity/ActivityLogView.tsx:218-219` | drift | Code has an extra body line. |

## P · Plans (P01–P12)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Plan chip in site menu | 231:16144, 231:16683, 231:17222 (+231:17763) | 4 | `shell/SiteMenu.tsx:149` | missing | 231:16683 inherits from 231:16144. |
| Pages at Free limit | 231:18302 | 1 | `shell/hooks/useComposerInit.ts:846-855` | missing | Code only refuses at save time. |
| Upgrade dialog, owner | 231:18866 | 1 | `chrome-ui/UpgradeModal.tsx:85-140` | drift | Title, feature list and CTA copy differ. |
| Upgrade dialog, non-owner | 231:19410 | 1 | `chrome-ui/UpgradeModal.tsx` | missing | |
| Page over Free limit / bell trial reminder | 231:19951, 231:20481 | 2 | — | missing | |
| Dashboard "Choose what stays active" | 231:21019, 231:21072, 231:21134 | 3 | `packages/dashboard/app/dashboard/settings/billing/page.tsx` | missing | Dashboard surface, outside the editor lanes. |
| Handoff note | 231:21190 | 1 | — | blocked:handoff-note | |

## CL · Collaboration, RJ · Recovery journey

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| Presence (Phase A) popover / viewer redaction / peer saved | 232:18928, 232:23250, 232:22183 | 3 | `collaboration/PresenceIndicators.tsx`, `shell/StudioHeader.tsx:296` | missing | Behind the collab flag (FLAGGED-VIABLE). Avatars only: no `N here` pill and no People popover. |
| Live editing (Phase B) | 232:19504, 232:20039, 232:20582 (+232:21118, 232:21651) | 5 | `canvas/overlays/RemoteCursorsOverlay.tsx` | missing | Remote selection, typing prompt, Follow, teammate-delete banner and remote-aware undo skip are all unbuilt. |
| Collab flag off row | 232:22718 | 1 | `shell/SiteMenu.tsx:220-230` | drift | Code: `Collaborate › Start collaboration · Planned`. Board: `People on this site — Planned`. |
| Undo hint toast | 232:23803 | 1 | `shell/hooks/useHistoryFeedback.ts:180` | drift | phase1 Task 1.2. |
| Undo names its step | 232:24836 | 1 | `canvas/CanvasFooterToolbar.tsx:71` | missing | phase1 Task 1.2 (topbar undo tooltip). |
| CMS delete toast Undo | 232:24328 | 1 | `cms/RecordSheet.tsx:346-351` | drift | |
| ⌘Z in CMS | 232:24584 | 1 | — | blocked:superseded-one-undo | The board is marked SUPERSEDED. |
| CMS restore outcomes | 250:48733, 250:48891, 250:49052 | 3 | `cms/CmsWorkspace.tsx:486-488` | missing | Restore silently re-saves the record. There is no pending, restored or failed state. |
| Handoff / fixture notes | 232:25361, 250:49215 | 2 | — | blocked:handoff-note | |

## Top drifts

1. **The load-failed banner (G02/G22) is in the wrong slot with the wrong copy.** It is above the header instead of under the topbar. It has no `Download local copy` or `Download changes`. It uses `Dismiss` where the board has `✕`. The inspector "View only until the site loads" line is missing, Publish is still shown, and the `missing` copy contradicts the board on the 30-day restore (phase1 Task 1.6).
2. **Banners are drawn as toasts.** Offline (G11), can't reach (G12), another tab (G28) and role change (G18) all use toasts or pills where the board puts one global banner slot under the topbar. The slot itself does not exist (G31).
3. **Unsaved-work recovery (G07) has two competing surfaces with different copy.** The server-newer and server-unknown cases (G08/G09) show nothing, where the board offers Download and Compare.
4. **The conflict dialog (G14–G16) has a different body and buttons.** Reload has no class-b confirm, and Overwrite does not keep "Before overwrite" first.
5. **The session-expired dialog (G03) has a different title and body.** There is no persistent session banner (G04).
6. **The crash screen (G26) is a raw "Something went wrong"** with no download-first path and no error code.
7. **The upgrade dialog (P06) has generic copy and no non-owner variant.** No plan chip, limits or trial UI exists anywhere in the editor (P01–P09).
8. **Multi-selection (C03) has a different header label** and no canvas multi-select action bar.
9. **History has copy drifts throughout.** Restore confirms by time not by step, `‹ Activity`, Compare chrome, Time Travel wording, and no Load more.
10. **CMS delete Undo (RJ02, RJ05–07)** uses different toast copy and has no restore pending, success or failure states.

## Code-ahead dispositions

- **SessionExpiredModal's "N changes at risk" list** (`shell/modals/SessionExpiredModal.tsx:95-115`): the board has only a count in the body. Fold it into the body sentence or drop it; the owner decides.
- **SaveFailedBanner's brand-refusal variants (TOKENS_INVALID)** (`shell/SaveFailedBanner.tsx:76-80`): the board has no equivalent. Keep them as variants of the save-failed surface (`code:tokens-invalid`).
- **ConflictModal's `brandFormat` variant** (`shell/modals/ConflictModal.tsx:72-76`): keep it inside the G14 dialog (`code:brand-format`).
- **LoadErrorBanner's `forbidden` kind:** no load-time board exists. Map it to the G18 banner shape.
- **MultiSelectBar align/distribute rows** (`inspector/components/MultiSelectBar.tsx`): not on C03. Keep, or move them under Placement; inspector lane decides.
- **ViewerRoleNotice** (`shell/ViewerRoleNotice.tsx`): no board on page 07 draws the viewer inspector column. G18 shows only a "View only · your role changed" line. Re-check against the inspector family boards.
- **SendForReview and `sidebar/tabs/review/`:** page 07 has no review boards ("In review · 2 open" is topbar sample data). Not mapped here.
- **The page-limit save refusal toast** (`shell/hooks/useComposerInit.ts:846-855`): keep it as a backstop once P05's up-front limit lands.

## Not mapped / not verified

- Nothing was compared live. All statuses come from dump text, instances and boxes against the code.
- 10:3228 (C08) and 10:2795 (C07) need a live check of the layout at 1366 and of panel persistence.
- The P10–P12 dashboard billing boards fall outside every editor lane and need an owner or dashboard lane.
