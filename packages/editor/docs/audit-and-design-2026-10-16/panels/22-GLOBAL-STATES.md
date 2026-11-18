# Panel 22 — Global states: session, connection, errors and notifications (FD-PNL-22)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by G-2, G-12, G-13, G-14 · not VERIFIED.** *(R-1018: + G-13 recovery server check, G-14 "Before overwrite" save)* Independent `design-qa-critic` review: pass 1 PROPOSAL (8 blocking B1–B8) + 11 notes (N1–N11) — fixed 2026-10-17; pass 2: 2 blocking fixed 2026-10-17. Runtime NOT RUN; geometry NOT MEASURED. Written after a code inventory (file:line below). *(DS)* = designer-selected; owner instruction 2026-10-17: designer recommendations accepted (still marked *(DS)*); OD-1…3 decided as recommended (SC-22). Panel 00 (SC-1…SC-22) wins on conflicts.
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S1, S2, S3, S4, V5 (via DS §2.10); FINAL §4 items 1, 6 (CS-02/08/09/10/12), 13; gap rows T5-01, T5-14, T1-16, T1-18, D3-2, D3-3, D3-4, D3-15, D3-20, D3-21, D3-23, CS-08, CS-09, CS-10, CS-12, CS-13; new state rows F-PB-Y11, F-PB-Y32.

**No AI in this version (owner 2026-10-17, Panel 00 SC-21):** every AI entry point in this panel is hidden; AI text below is kept for the later AI Build tab; backend unchanged.

Governing IA: **IAF-22** (A–M, `evidence/ia-final-2026-10-16/module-specifications.md:1185`), IAF-19 (bell, `:1015`), IAF-20 I (role lost / resource gone, `:1071`), Panel 01 (§5.1 Exit, §5.7 bell, §7 exit guard), Panel 11 §8 (status button + details), Panel 12 RT-04 (task boundaries), Panel 14 §5.4–5.5 (publish across reload/session), Panel 05 §9 (toast floor), SC-2, SC-4, SC-6, SC-9, SC-11, SC-15, SC-16, SC-18 (session one-liner — expanded here), SC-20. Strategy (00-STRATEGY §3): supporting job **"never lose work"**; protects every step of the core loop.

---

## 1. Purpose and boundary

Panel 22 answers one question whenever the cause sits outside any single panel: **"Is my work safe, can I keep working, and what do I do next?"**

Job: S supporting — "never lose work" (00-STRATEGY §3) *(R-1018)*

- In: editor load and route refusals; session expiry and re-sign-in; offline / can't reach the server / reconnecting; the global Save-failed and Conflict dialogs (Panel 11's status opens them); permission lost mid-session; workspace deletion scheduled; site deleted elsewhere; new editor version while open; crash and error boundaries; toast system rules; the notifications bell's row behaviour; narrow windows and unsupported browsers; the same site open in several tabs; **every notice shown near the topbar** — other panels' notices (Panel 23 trial ended, Panel 21 teammate changes) enter only through the §4.2 banner slot with a priority entry (CS-08) *(R-1018)*; the **offline announcement** (one polite announcement, §5.3 — no other surface announces offline, CS-10) *(R-1018)*.
- Out (owned elsewhere): status button and details popover layout (Panel 11 §8); per-owner messages for CMS records and uploads (Panels 07, 08); publish outcomes (Panel 14); History restore (Panel 12); real-time collaboration (flag `NEXT_PUBLIC_FEATURE_COLLAB`, §10).

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
Editor paths under `packages/editor/src/`; dashboard under `packages/dashboard/`; server from repo root.

| ID | Area | Today |
|---|---|---|
| GS-01 | Route: signed out | redirect to `/auth/login?next=/edit/{id}` keeping the query (`app/edit/[siteId]/page.tsx:18-34`) |
| GS-02 | Route: no site / no access | full page `DeniedState` "You don't have access to this site" + "Back to sites" — one answer for both (`page.tsx:36-51`). `getEffectiveSiteRole` does not exclude soft-deleted sites (`server/services/permission.service.ts:162-169`), so a deleted site passes this gate and fails at load (GS-05) |
| GS-03 | Route: viewer | forced `?view=readonly` (`page.tsx:58-68`) |
| GS-04 | Boot | `EditorSkeleton` during dynamic import (hex, rail 60 / drawer 280 / inspector 300 / bottom 24, `components/editor-route/EditorSkeleton.tsx:5-65`) → `StudioSkeleton` "INITIALIZING ENGINE" + spinner while no composer (`editor/shell/AquibraStudio.tsx:576-578`, `chrome-ui/Skeleton.tsx:91-121`) → canvas "project arriving" state, no "Start blank" while loading (`editor/canvas/Canvas.tsx:555-560`) |
| GS-05 | Load failed | `LoadErrorBanner` kinds auth / network / missing / forbidden, `role=alert`, **dismissible**, Retry = full reload, Sign in opens a new tab (`editor/shell/LoadErrorBanner.tsx:33-126`; mounted `AquibraStudio.tsx:668-677`). After any failure the editor loads the **localStorage fallback and stays editable** (`editor/shell/hooks/useComposerInit.ts:403-449`); saves are refused `PROJECT_NOT_LOADED` (`services/BuildrikSyncProvider.ts:156-170`); the canvas drops its start actions only for `missing` (`Canvas.tsx:540-547`) |
| GS-06 | "Missing" copy | "Deleting is permanent — there is no trash to restore from" (`LoadErrorBanner.tsx:15-17,97`) — **false**: sites have a 30-day Recently deleted with OWNER restore (`server/services/sites.service.ts:661-701`, `packages/shared/schemas/sites.ts:55`, `components/sites/recently-deleted.tsx`, `server/trpc/routers/sites.ts:227-237`) |
| GS-07 | Session expiry | a 401 on manual save or autosave opens `SessionExpiredModal`: "Your session expired" · "{n} changes at risk" (undo-stack labels since last save) · Keep editing / Try saving again / Sign in (new tab, `/auth?reason=session-expired`); Esc/scrim = Keep editing; closes when any save lands (`editor/shell/modals/SessionExpiredModal.tsx:53-137`; `AquibraStudio.tsx:213-216,366-370,919-925`). Detection is a **message regex** (`editor/shell/hooks/useSaveCallback.ts:51-57`; load `useComposerInit.ts:403-405`). Manual 401 keeps a browser copy (`useSaveCallback.ts:355-365`); **autosave 401 keeps none and schedules no retry** (`useComposerInit.ts:818-830`). Nothing resends automatically after sign-in |
| GS-08 | Offline / unreachable | `online`/`offline` listeners (`AquibraStudio.tsx:378-385`); pill offline: no click, tooltip "Offline — changes aren't reaching the server. Reconnect to keep saving." (`StudioHeader.tsx:660-661`); network save failure keeps a browser copy + toast "Offline — not saved" / "Couldn't reach the server — not saved", told apart by `navigator.onLine` (`useSaveCallback.ts:258-310`); autosave backoff 5 s → 60 s and replay on `online` (`useComposerInit.ts:136-137,633-653`); CMS/component/template/version mirrors in `SyncRetryQueue`, replayed on `online`, **memory only** (`services/syncRetryQueue.ts:57-65`); CMS outbox persisted `bk-cms-outbox-v1` (`services/cmsSync.ts:116-141`), sheet copy "Saved on this device only…" (`cmsSync.ts:438-441`) |
| GS-09 | Save failed | toast keyed `save-failed` with Retry + canvas `SaveFailedBanner` + pill retry (`useSaveCallback.ts:38,384-393`); message map `explainSaveError` (`:136-157`). A **NOT_FOUND** save (router `sites.ts:385-388`) falls to "Could not save project." + Retry |
| GS-10 | Conflict | `SAVE_CONFLICT_EVENT` → `ConflictModal` "This site changed somewhere else": Reload latest / Save a backup / Overwrite (+confirm); brand-format conflict hides Overwrite (`editor/shell/modals/ConflictModal.tsx:59-90`; `AquibraStudio.tsx:394-405,809-840`); closing keeps the conflict state; autosave held (`useComposerInit.ts:680-686`). **Save a backup reloads in `finally`, even when the backup failed** (`AquibraStudio.tsx:818-830`; IAF-22 G) |
| GS-11 | Recovery after reload | kept copy `bk-unsaved-v1-{siteId}` in localStorage (`services/unsavedRecovery.ts:23-27,93-120`, **not user-scoped**) → persistent toast "Some work never reached the server" + "Restore my edits", never auto-applied (`useComposerInit.ts:323-375`); local crash draft `RecoveryBanner` (`editor/shell/RecoveryBanner.tsx:77-116`, `engine/recovery/RecoveryManager.ts:49-113`) |
| GS-12 | Permission lost | seen **only when a write is refused** FORBIDDEN: keep copy, toast "You don't have access to save this site", re-read role, below EDITOR → reload into `?view=readonly` (`useSaveCallback.ts:74-125`); after reload a persistent toast explains (`useComposerInit.ts:327-335`). Role cached per page load (`services/RoleService.ts:24-52`) |
| GS-13 | Workspace deletion scheduled | 30-day grace (`server/services/workspace-settings.service.ts:150-166`); publish refused "This workspace is scheduled for deletion. Cancel the deletion to publish." (`server/trpc/routers/sites.ts:66-67,502-503`; `publish.service.ts:380-386`); cancel = owner only (`workspace-settings.service.ts:171-176`). **Editor shows nothing until Publish**; date only in dashboard site detail (`server/services/site-detail.service.ts:349`) |
| GS-14 | Version skew | route boundary: `ChunkLoadError` → "Editor was updated. Reload to continue." + hard reload (`components/editor-route/EditorClient.tsx:41-57`). 18 `React.lazy` chunks inside `editor/` fail into panel boundaries whose "Try Again" remounts the same dead chunk (`editor/sidebar/SidebarFallbacks.tsx:20-40`). No build-id check, no proactive prompt |
| GS-15 | Crash | route `EditorErrorBoundary`: console.error only, "Editor crashed unexpectedly.", button **"Reload" calls remount** for non-chunk errors, hex + 'Inter Tight' (`EditorErrorBoundary.tsx:17-90`; `EditorClient.tsx:43-55`). Shell `StudioErrorBoundary`: shows raw `error.message`, empty `componentDidCatch` (`AquibraStudio.tsx:98-151`). Panel boundaries capture to Sentry (`editor/inspector/components/InspectorErrorBoundary.tsx:44`, `SettingsErrorBoundary.tsx:32`) and say "This panel encountered an error. Your work is safe." unconditionally (`SidebarFallbacks.tsx:23-25`). `initErrorTracking` (`shared/utils/errorTracking.ts:31`) is called only by the port-5050 demo (`demo/main.tsx:26`), not in the Next-bundled editor. The `beforeunload` guard lives in `StudioHeader` (`StudioHeader.tsx:541-564`), so a shell crash unmounts it (inference, NOT RUN) |
| GS-16 | Toasts | module store: ≤1 transient (newest replaces), persistent = error or `Infinity`, kept first, **unbounded**; default 5 s, Undo ≥ 8 s, error never times out; `key` replaces; hover/focus pauses; bottom-right of the canvas column above `data-bk-toast-floor`, 48/48 in full-page areas; drops under modals; one viewport `role=status` whose `aria-live` flips polite ↔ assertive; 460 wide (`chrome-ui/Toast.tsx:1-70,125-175,236-340,353-440`). Manual save toasts "Saved · Project saved successfully" 1.8 s (`useSaveCallback.ts:218-226`) |
| GS-17 | Bell | **this site only** (`services/NotificationService.ts:21-26`), 5 rows, count failure → 0 (`:53-58`; `NotificationPanel.tsx:85-96`), refetch on focus (`StudioHeader.tsx:372`). Row: mark read — **a failed mark-read is swallowed and the jump goes ahead** (`NotificationPanel.tsx:157-163`) — then **full-page navigation through the exit guard — even for this site's own events** (`NotificationPanel.tsx:153-167`; `StudioHeader.tsx:580-587`). Publish / form rows link to `/dashboard/sites/{id}` (`app/api/workers/publish/[jobId]/route.ts:168-173,224-230`; `server/services/form-submission.service.ts:129-135`); `REVIEW_LINK_REQUESTED` has no `siteId`, so it never reaches the editor bell (`server/services/client-review.service.ts:407-412`); recipients = workspace owner only (`server/services/notification.trigger.ts:53-66`) |
| GS-18 | Exit guard | dirty / risky (offline) / stranded (mirrors) dialogs; Save & leave 3 s timeout; `beforeunload` decided at fire time (`StudioHeader.tsx:457-564`) |
| GS-19 | Several tabs | `BroadcastChannel` hello/here → persistent warning toast "This site is open in another tab" **in both tabs, once each** (the older tab toasts on the `hello`, the newer on the `here`; `editor/shell/hooks/useOtherTabNotice.ts:24-40`, test `useOtherTabNotice.test.ts:32`); no way to choose which tab edits; the other tab's save meets the optimistic token → conflict (`BuildrikSyncProvider.ts:173-212`) |
| GS-20 | Width / browser | no minimum-width or browser check; ≤1366 the Inspector overlays (`editor/rail/LayoutShell.css:330-358`); no browserslist |

## 3. Problems this design solves (job: never lose work · publish safely)
1. **Persistent conditions ride toasts** (other tab, recovery offer, role change — GS-11/12/19) and pile up unbounded (GS-16). A recovery copy is keyed by site only, so on a shared browser it can be offered to the wrong person (GS-11).
2. **Session expiry needs the user to know the trick:** nothing resends after sign-in; autosave 401 keeps no copy; the copy says "this tab" while a browser copy exists (GS-07).
3. **Dead ends with wrong facts:** a deleted site loops "Could not save project · Retry" (GS-09) and the missing copy denies a restore that exists (GS-06).
4. **A failed load stays editable** although nothing done there can ever save (GS-05).
5. **Invisible until it bites:** role loss and workspace deletion appear only when a write or Publish is refused (GS-12/13).
6. **New deploys break panels** with a Retry that cannot work (GS-14).
7. **Crash screens leak raw errors, promise safety they can't know, and may reload without the unsaved-work guard** (GS-15).
8. **The bell throws the user out of the editor** for this site's own events (GS-17).
9. **No guidance below 1024 px or in unsupported browsers** (GS-20).

## 4. Target layout

### 4.1 Global state ladder — one surface per severity *(DS)*
| Level | Surface | Use for | Never for |
|---|---|---|---|
| L1 | **Full-screen state** (centred card 480) | the editor cannot run: route denied, shell crash, version required | anything with usable work on screen |
| L2 | **Dialog** (480 question / 720 conflict) | a decision is needed now and work is at risk: session expired with unsaved changes, conflict, crash with unsaved changes | information |
| L3 | **Global banner** (§4.2) | a condition that persists and changes what you can do | the outcome of a click |
| L4 | **Bottom status** (Panel 11 §8) | save / sync state, SC-4 priority; **mirror / sync-queue failures** (CMS, component, template, version mirrors) are a Details row with **Retry now** — not a toast *(R-1018, T1-16: settled by this ladder)* | conditions that are not about saving |
| L5 | **Toast** (§5.10) | the outcome of the user's own action, Undo | a persistent condition (**Fix**: GS-11/12/19 toasts → banners) |
| L6 | **Bell** (§5.11) | events that happened elsewhere or later | anything blocking |

### 4.2 Global banner slot (NEW position; content of existing banners kept)
```
┌ topbar 56 ─────────────────────────────────────────────────────────────────────┐
├ ⚠ Session expired — changes aren't saving. They're kept in this tab.   [Sign in]  1 more ⌄ ┤ 40 (wraps)
├ rail │ left panel │ canvas / area                           │ Inspector / task  ┤
└ bottom bar 32: Pages · strip ·  ● Offline — will save when back online · Details ⌄ ┘  (R-1018, CS-12 save vocabulary)
```
- One slot **below the topbar, full editor width, pushing content down** (never over the canvas) — the conditions are editor-wide, so the banner is not inside one area *(DS)*. `LoadErrorBanner` moves here (Move; today above the header, `AquibraStudio.tsx:668`).
- Shows **one** banner; others collapse into "N more ⌄" (list popover, each row with its own actions). Priority: (1) Site unavailable (deleted / no access) · (2) Session expired · (3) Couldn't load this site · (4) Unsaved work from an earlier visit (recovery) · (4b) Locked on Free · (5) Editing is off — role changed · (6) Offline / Can't reach Buildrick · (7) Editing moved to another tab · (8) New version available · **(8a) Teammate change** — Panel 21 "Ana saved changes · Get latest" (after MP-12) and "Ana applied the starter '{name}' to Brand · Review changes ›" (Phase B) *(R-1018, D3-21)*; also Panel 21 §5.2 Phase B peer edits — "Ana changed Padding after you · Undo", "Ana deleted Hero — your change to Padding (24 px) wasn't applied", "Ana deleted the page Menu" *(R-1018, reconciled from Panel 21 toasts)* · (9) Workspace scheduled for deletion · **(9a) Trial ended** — Panel 23 §5.5 notice, dismissible per user per workspace *(R-1018, D3-4)* · (10) Narrow window / browser.
- **Single slot for every notice near the topbar** *(R-1018, CS-08)*: no panel draws its own notice under or beside the topbar; a new notice needs an entry in this list. Panel-local banners inside a task or form (Panel 07 record banner, Panel 10 Site settings concurrent-edit line) stay where they are.
- Glyph + sentence + ≤2 actions + Dismiss only where §7 says dismissible. Tone by the token pair of the existing banner (error tint for 1–3, warning for 4–7, info for 8–10 incl. 8a and 9a) — never colour alone. **Info tone is neutral grey + icon** (V2, DS §2) *(R-1018)*.
- **SaveFailedBanner** and **RecoveryBanner** stay on the canvas (Panel 11 §8, Keep): they are about this page's save. **RecoveryBanner "Discard & reload"** uses the existing SC-15 confirm for **discarding a kept unsaved copy** ("Delete the kept copy? This can't be undone." [Delete copy] [Cancel], §7) — the crash draft is the same kind of copy *(R-1018, T1-18)*; its "Keep changes" follows the §5.2 server check (S1).

### 4.3 Full-screen state card (route denied, crash, version required)
```
            ┌──────────────────────────────────────────────┐
            │  ✕  Something stopped the editor              │  title 16/600
            │  Your last change was saved at 10:42.         │  safety line (true state, §5.9)
            │  Error code 7F3A-21  ⧉                        │  for support; never the raw message
            │  [ Download a copy ]   [ Reload editor ]      │  primary = the action that fixes it
            │  Back to sites                                │
            └──────────────────────────────────────────────┘
```
Uses chrome-ui tokens and Inter (**Fix** hex + Inter Tight, GS-15). Route `DeniedState` (GS-02) keeps its dashboard component and copy.

## 5. Flows

### 5.1 Editor load
1. Signed out → login with `next` (Keep GS-01). No site / no access → full page (Keep GS-02). Viewer → read-only (Keep GS-03).
2. Boot: one skeleton matching the target shell (topbar 56, rail, bottom bar 32 — Panel 11) *(Fix: two skeletons with different shapes; 24 → 32)*; label "Opening {site name}…" when the name is known, else "Opening the editor…" (**Fix** "INITIALIZING ENGINE").
3. Load failure → banner (§4.2) by kind; **the canvas becomes read-only until the site loads** (Change, OD-1 decided SC-22): selection and Layers work, edits are refused with "This site didn't load — Retry first". Retry reloads (Keep). The local fallback stays reachable as "Download local copy" so nothing is lost.
4. Load `missing` → §5.7 copy; `forbidden` → §5.5 copy; `auth` → §5.2 with nothing at risk (banner only, no dialog).

### 5.2 Session expiry and re-sign-in (expands SC-18)
- **Detect:** any tRPC 401 (not only saves) — by error code, not message (**G-3**); plus a session probe when the tab regains focus (**G-1**, reuses `useRefetchOnFocus`).
- **With unsaved changes:** existing dialog (Keep), copy fixed: "Your session expired. Your {n} changes are kept in this tab and in this browser. Sign in again to save them." Actions **Sign in** (primary, new tab — Keep) · Try saving again (Keep) · Keep editing (Esc — Keep). Both save paths keep the browser copy (**Fix** autosave, GS-07).
- **Keep editing** → banner (2) "Session expired — changes aren't saving · Sign in". Edits continue to queue; status shows Save failed per SC-4; the exit guard uses its **risky** variant because nothing reached the server — the one unsaved-changes dialog (S3): "Leave without saving?" · **Keep editing** (default) · **Discard changes**, body naming what is lost *(R-1018, CS-02; was "Leave and lose changes")*.
- **After sign-in** (focus probe answers signed in **as the same user**, **G-2** ⛔): the editor **resends automatically** — page save, then CMS outbox flush, then `SyncRetryQueue.retry()` — dialog/banner close; toast "Signed in again — changes saved" (count after receipt registry, SC-9). Until G-2 ships: no automatic resend; "Try saving again" stays the path (today).
- **Different account signed in:** nothing is sent. Dialog "You're signed in as {B}. These changes were made as {A}." → Download a copy · Sign in as {A}. *(DS — never attribute A's edits to B.)*
- Publish running: the job continues server-side (Keep). **Resuming the running view after sign-in is NEW** and needs Panel 14 **P-3** (active-job query, Panel 14 §5.4 "Reload / second tab"); until P-3 the next Publish press answers "A publish is already running" (P-3 fallback) and the result arrives as a notification after P-6.
- **Kept copy and accounts (⛔ G-12):** the browser copy stores the **user id inside the payload** from now on; it is offered ("Restore my edits") **only to that user**. On explicit **Sign out** the editor clears that user's kept copies after the exit guard has offered Download a copy; a session that merely **expires** keeps them (that is the case this flow protects). Until G-12 ships the user-scoped key, a copy whose payload user ≠ current user is ignored, never offered.
- **"Restore my edits" checks the server first (S1, ⛔ G-13)** *(R-1018, T5-01 — Critical)*. Before anything is applied, the editor compares the kept copy's time (`kept.at`) with the server's current revision time (last save of the site):
  - **Server older than (or equal to) the kept copy** → **Restore my edits** applies the copy and saves it (today's action).
  - **Server newer** (a teammate or another tab saved after the copy was kept) → the offer changes to "Someone saved this site after your copy was kept." · **Download my copy** · **Compare** (opens Compare, IAF-18: kept copy ↔ current server version). **Never a silent apply**; no Restore button in this state.
  - **Server time unknown** (read failed, offline) → treated as newer: Download my copy + Compare only, line "Couldn't check the server version".
  - The same check guards the **second entry point**, Retry / ⌘S re-applying the kept copy (INV Y19) — a server-newer state never re-applies it.
  - **Interim guard (mandatory until G-13 merges, fix `765343348`):** the offer shows Download my copy + Compare only — no Restore that writes to the server (SC-9 row "Recovery Restore checks the server first").

### 5.3 Offline, can't reach Buildrick, reconnecting
- **Offline** (`navigator.onLine` false): banner (6) **"You're offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect."** — the same sentence is the Panel 11 §8 offline tooltip/details line (amendment text in §14). Basis: page edits → `keepUnsaved` (GS-08); CMS records → persisted outbox, "Saved on this device only" (Keep, Panel 07); component/template/version mirrors → memory only, so the exit guard's stranded dialog stays (Keep). Exit guard risky dialog = the one unsaved-changes dialog (S3: "Leave without saving?" · Keep editing · Discard changes); its body reads **"Page edits stay in this browser only."** when only page edits are pending, and **"Changes that need this tab open will be lost."** when memory-only mirrors are pending *(R-1018, CS-02; was "Leave — changes stay in this browser only" / "Leave and lose changes")*.
- **Offline announcement — Panel 22 is the only owner** *(R-1018, CS-10, D3-15)*: one polite announcement when the connection drops ("You're offline. Everything saves when you reconnect.") and one when it returns (below). The Panel 21 presence pill, Panel 11 status, Panel 17 task and toasts do not announce offline; while banner (6) shows, the presence pill is silent.
- **Can't reach Buildrick** (online, but requests fail — existing distinction, `useSaveCallback.ts:262-268`): same banner, title "Can't reach Buildrick", + Retry now.
- **Needs a connection:** Publish (existing reason), uploads, Templates apply, Site settings save, share link → disabled with "Needs a connection" (SC-18 pattern). Editing the canvas continues. **This list wins over panel text** (D3-2: Panel 15 Templates create/replace offline is disabled, because the backup checkpoint needs the server); every panel's offline reason is the one string "Needs a connection" (D3-17) *(R-1018)*.
- **Reconnecting:** banner reads "Reconnecting… saving {n} changes" while the existing replays run (autosave `online` replay, outbox flush, mirror retry); success → banner leaves + polite announcement "Back online — changes saved"; partial → status Save failed with Details (Panel 11 §8). Never "Saved" before the server receipt (IAF-22 H).

### 5.4 Save failed and conflict (global dialogs; Panel 11 status opens them)
- **Save failed:** Keep toast + canvas banner + status Retry; messages specific (`explainSaveError`, Keep) plus: NOT_FOUND → §5.7 (**Fix** GS-09); PAGE_LIMIT → SC-18 plan pattern (Keep).
- **Conflict** (720, IAF-22 F): title "This site changed somewhere else" (Keep) + "Changed {time} in another tab or by a teammate" (name after **G-4**). Actions: **Download a copy** (no reload; result line **"Download started"** — information only, never treated as proof the file was kept, IAF-22 G) · **Reload latest** (**always** confirms "Reload the latest version? Your changes in this tab will be replaced." — Reload / Cancel; a started download does not skip the confirm, IAF-22 G/H; this is an **SC-15 class (b) consequence confirm**, S2, default = Cancel *(R-1018)*) · **Overwrite** (hidden for brand format — Keep). **Overwrite (S4, ⛔ G-14)** *(R-1018, T5-14)*: class (b) consequence confirm "Overwrite the newer version? It is kept in History › Saves as 'Before overwrite'." [Overwrite] [Cancel] (default Cancel) → the editor first writes the **server's current version** to History › Saves as **"Before overwrite · {time}"**, then overwrites; toast "Site overwritten · **Before overwrite in Saves ›**" (link opens History › Saves on that save). If the "Before overwrite" save fails, **nothing is overwritten**: inline "Couldn't keep the newer version — nothing was overwritten." **Retry** · **Cancel**; the conflict stays. **Fix GS-10:** a failed backup keeps the dialog, the conflict, the local copy and the draft — inline "Couldn't create the copy." with **Retry** · **Cancel**; nothing reloads.
- Closing keeps the Conflict status (Keep); Esc closes (SC-2).

### 5.5 Permission lost mid-session
- **Detect:** refused write FORBIDDEN (Keep) **and** a role re-read on focus (**G-4**) so the change shows before the next edit.
- **Below EDITOR:** keep the copy (Keep) → view mode (Keep navigation, `useSaveCallback.ts:114-124`) → banner (5) "Your role changed to Viewer — editing is off. Changes that weren't saved are kept in this browser." · Download them · Ask an admin *(Fix: today a persistent toast)*.
- **Role raised:** banner (info) "You can edit this site now · Reload to edit".
- **Removed from the workspace / site:** §5.7 with "You no longer have access to this site" (existing forbidden copy, trimmed).

### 5.6 Workspace scheduled for deletion (NEW in editor; needs **G-5**)
Banner (9), dismissible per day: "This workspace will be deleted on {date}. Publishing is off." Owner: **Cancel deletion ›** (dashboard workspace settings, new tab). Others: "Ask the owner to cancel it." Editing and saving continue (Keep). Publish shows the existing server sentence (Panel 14 §7).

### 5.7 Site deleted or no longer available
- On load (`missing`) or a NOT_FOUND write: autosave stops, canvas read-only, banner (1): "This site was deleted. Your unsaved changes are kept in this browser. A site owner can restore it from Recently deleted for 30 days." Actions: **Download changes** · **Go to dashboard** (Recently deleted filter) — **Fix GS-06** copy; owner: "Restore site" after **G-10**.
- **Change:** a missing site now keeps the unsaved copy (today deliberately not, `useSaveCallback.ts:357-362`) — because restore exists (GS-06).
- Not dismissible while the site is gone.

### 5.8 New editor version while open (NEW, needs **G-6**)
- Build id read on focus and every 10 min *(DS)*. Different id → banner (8) "A new version of Buildrik is ready · Reload". Reload = flush saves first; if anything is unsaved it waits ("Saving first…"); then reload restoring area + page (after **G-9**; until then Editor + current page via the existing `?page=` deep-link). **Never auto-reload** with unsaved work.
- Reload while offline or when the flush fails: no reload; inline "Couldn't save — **Download a copy** · **Stay**" (Stay keeps the banner).
- **Hard skew** (a lazy chunk 404s): that panel shows "This part of the editor was updated. Reload to use it." + Reload (not "Try again" — **Fix GS-14**); the rest of the editor keeps working. Route-level ChunkLoadError copy kept.

### 5.9 Crash and error boundaries
Four levels, each with Sentry capture tagged `{level, area, siteId, build}` (**Fix**, **G-8**): **panel/task** (exists; all tasks per Panel 12 RT-04 — six; five while SC-21 hides the AI task *(R-1018, D3-20)*) → **area** (CMS, Assets, Brand, Site settings, Templates, Components — `FullPageView` already has one) → **shell** → **route**.
- Copy never shows the raw message; shows an **error code** = the Sentry event id (copyable; part of **G-8** — until then no code line).
- **Safety line is computed, never assumed** (**Fix** "Your work is safe"; per-owner truth needs **G-11**): page Saved + empty queues → "Your work is saved (10:42)"; unsaved → "You have unsaved changes — download a copy before reloading" and **Download a copy** becomes the first action; state unknown (no receipt registry, or the crash took the state) → **"We can't confirm what was saved — download a copy."**
- Shell crash: the unsaved-work guard **must survive** (registered at route level — engineering note, GS-15); "Reload editor" goes through it.
- Retry labels match the action: "Try again" remounts; "Reload editor" reloads (**Fix** GS-15 route button).

### 5.10 Toast rules (system; L5)
| Rule | Value |
|---|---|
| Visible | ≤1 transient + ≤2 persistent; beyond → "+N more" row that opens them *(DS; Fix unbounded)* |
| Durations | 5 s default · Undo ≥ 8 s · error persists (Keep) · pause on hover/focus (Keep) |
| WCAG 2.2.1 | every toast action has a durable equivalent (Undo = ⌘Z / History; "View live" = Publish task; Retry = status) — so the time limit is not essential; persistent errors stay until closed |
| Content | outcome of the user's own action only; persistent conditions are banners (§4.1) |
| Copy templates *(R-1018, CS-13, T2-24)* | delete: "{Name} deleted · Undo · Recently deleted ›" (the last link only where the object has a Recently deleted); insert/add: "{Name} added · Undo"; failure: "Couldn't {action} — Retry" |
| **Achievement toast (Panel 16 §4.4)** *(R-1018, CS-09, D3-3, T1-14)* | a **persistent-class** toast in this stack — same position (bottom-right above the toast floor), counts against the ≤2 persistent, closes with ✕ or when its action runs, **no own `role=status`**; announced once through the polite pipe. Panel 16's "checklist corner, 6 s, own live region" is overridden |
| Automatic saves | never toast; **manual ⌘S** → status shows "Saved" + polite announcement, no toast *(DS, Change — duplicate of the status; also drops the "Project" noun, SC-11)* |
| Position | Panel 05 §9: 16 above the toast floor (bottom edge of the canvas column, above the 32 bottom bar); full-page areas 48 right / 48 + 32 bottom *(Change: clears the bottom bar)*; under modal scrim (Keep) |
| Live regions | toasts stop owning a live region; they announce through the **existing single live pipe** — polite `role=status` + assertive `bk-announce-assertive` (`StudioHeader.tsx:777-784`), which moves to the bottom bar with the status (Panel 11 §8) — errors to assertive, everything else polite *(Fix: no politeness flip)* |
| Focus | toasts never take focus; ✕ and actions reachable by Tab from the region |

### 5.11 Notifications bell (Panel 01 §5.7 rows)
- **One list, grouped** *(R-1018, owner decision N6; replaces the "This site" / "All" scope tabs — there is no "All" tab)*: group header **"This site"** first, then **"Other sites"** (NEW — the personal rows from the user's other sites). Other-site rows open **in a new tab** ↗ (Panel 00 SC-10 register, bell row; "out-of-editor rows" below), so the editor stays.
- **Same-site rows open in place** — no navigation, no exit guard *(Fix GS-17; needs G-7)*: comment / review → Review task on that thread; publish succeeded / failed → Publish task outcome; form submission → Site settings › Form submissions; review link requested → Review task. Return per SC-1/SC-7.
- **Out-of-editor rows** (account security, billing, another site) open **in a new tab** ↗ *(DS)* so the editor stays; until G-7, unknown targets keep today's guarded navigation.
- **Mark read is a separate acknowledgement (Fix, IAF-19 H):** today a failed row mark-read is swallowed and the jump continues (`NotificationPanel.tsx:157-163`). Target: the jump still happens, the row stays unread and the panel says "Couldn't mark as read — Retry" on return; Mark all read failure keeps its existing toast (Keep). Count failure → "Status unavailable" (Panel 01 Fix). Informational rows (no target) do nothing on click and say so ("No link").
- **Target states (IAF-19 I):** target deleted → row opens nothing, line "This {comment / release / submission} no longer exists"; forbidden → "You don't have access to this anymore"; temporarily unavailable (load failed) → "Couldn't open — Retry". **Viewer** on a form-submission row → disabled with "Form submissions need Editor access" (SC-6: Site settings not available to viewers).

### 5.12 Same site in several tabs (same browser)
- Both tabs already learn of each other (Keep, GS-19). **Change (surface):** the persistent toast becomes banner (7) "This site is also open in another tab. Edit in one tab at a time." · **Edit here** (NEW).
- **Edit here** (NEW) broadcasts a take-over: the other tab saves first, then turns read-only with banner "Editing moved to another tab · Edit here instead" *(DS — browser-local lock on the existing BroadcastChannel; no server)*.
- **Failure:** if the other tab's save fails, it stays **editable** with status Save failed (SC-4) and the requesting tab shows "The other tab couldn't save — finish there first"; nothing turns read-only.
- **Race:** two Edit here at once → the **last broadcast wins**; the loser turns read-only with the same banner. Other browsers / devices: existing conflict path (Keep) until collaboration (§10).
- On focus a tab re-reads save state and Publish status (Panel 14 T-PB-21).

### 5.13 Narrow windows and unsupported browsers
- **Desktop at any zoom** — window < 1024 CSS px: only banner (10), dismissible and remembered per device: "Buildrick is built for windows at least 1024 px wide — some panels will overlap." **Never blocks**: at 200 % browser zoom a 1440 window is 720 CSS px, and blocking would lock out low-vision users (WCAG 1.4.4). Viewport width is never used to detect a phone.
- **Phone** (OD-2 decided, SC-22) — detected only by `(pointer: coarse)` **and** `screen.width` < 600 device px: L1 card "Buildrick needs a larger screen" + **Open read-only anyway** (view mode, SC-6); no editing.
- Unsupported browser (missing BroadcastChannel / ResizeObserver / IndexedDB): banner "This browser isn't supported. Use the latest Chrome, Edge, Firefox or Safari." Supported list: last 2 versions of Chrome, Edge, Firefox, Safari (desktop) — OD-3 decided, SC-22.

## 6. States and permissions
| Role / plan | Behaviour |
|---|---|
| VIEWER | banners for site unavailable, offline ("View only — content may be out of date"), new version, narrow width; no session dialog (nothing at risk — banner only); bell rows open read-only tasks (SC-6) |
| EDITOR / DESIGNER | all flows; workspace deletion: "Ask the owner to cancel it"; deleted site: "Ask a site owner to restore it" |
| ADMIN | same as EDITOR for deletion/restore (both are OWNER-only on the server) |
| OWNER | Cancel deletion › (`workspace-settings.service.ts:171-176`); Restore site (after G-10; `sites.ts:227-237` requires OWNER) |
| Plan (SC-20) | trial reminders stay notifications + email, not banners — **except the one "Trial ended" notice, banner (9a)**, shown on the first editor open after the trial ends (Panel 23 §5.5) *(R-1018, D3-4)*; plan limits use SC-18 inline pattern. **Site locked on Free** (over a Free limit after the trial, SC-20): banner (4b), canvas read-only as a viewer (SC-6), view / Preview / export / Delete only, status "View only · Versions ›"; detected at load and on the G-4 focus read, so a trial ending mid-session locks the site without a reload |

## 7. Content
| State | Sentence | Actions | Dismiss |
|---|---|---|---|
| Couldn't load | "This site didn't load. Nothing you do here can be saved until it does." | Retry · Download local copy | no |
| Site deleted | §5.7 | Download changes · Go to dashboard | no |
| No access | "You no longer have access to this site. Ask a workspace admin." | Download changes · Go to dashboard | no |
| Session expired (banner) | "Session expired — changes aren't saving. They're kept in this tab." | Sign in | no |
| Offline | §5.3 | — | no |
| Can't reach Buildrick | "Can't reach Buildrick. Changes stay in this tab — we'll keep trying." | Retry now | no |
| Role changed | §5.5 | Download changes · Ask an admin | yes (per session) |
| Other tab | §5.12 | Edit here | yes |
| New version | "A new version of Buildrick is ready." | Reload | yes (returns on next focus) |
| Workspace deletion | §5.6 | Cancel deletion › (owner) | per day |
| Recovery offer — server older | "Some work from an earlier visit never reached the server." | Restore my edits (Keep) · **Not now** (hides the banner for this visit; copy kept) · **Discard…** → confirm "Delete the kept copy? This can't be undone." [Delete copy] [Cancel] — existing SC-15 item "discarding a kept unsaved copy" (§14) | Not now only |
| Recovery offer — server newer or unknown *(R-1018, S1)* | "Some work from an earlier visit never reached the server. Someone saved this site after your copy was kept." (unknown: "…Couldn't check the server version.") | **Download my copy** · **Compare** · Not now · Discard… (same confirm) — **no Restore** (§5.2) | Not now only |
| Locked on Free | "This site is over the Free limit. You can view, preview, export or delete it." | Owner: **Upgrade to edit and publish** · **Choose what stays active** (Panel 23 §5.5a); others: "Ask the workspace owner to upgrade" (SC-22 OD-PL-4) *(R-1018, D3-23 — one sentence and action set with Panel 23)* | no |
| Teammate change (8a) *(R-1018, D3-21)* | Panel 21 §7: "Ana saved changes" · "Ana applied the starter '{name}' to Brand" · Phase B peer edits (Panel 21 §5.2: Overwritten, Remote delete) *(R-1018)* | Get latest (→ Reload latest consequence confirm, §5.4, after the backup) / Review changes ›; Phase B peer edits: Undo (Overwritten) or none *(R-1018)* | yes (per event) |
| Trial ended (9a) *(R-1018, D3-4)* | Panel 23 §5.5 sentence | See what changed › | yes — per user per workspace; the bell keeps the item |
| Narrow / browser | §5.13 | — | yes, remembered |
| Site settings not saved, pages saved (INV Y11) *(R-1018, F-PB-Y11)* | L5 persistent error toast (outcome of the user's save): "Pages saved · Site settings change not saved — {reason}" — reason per role pattern, e.g. "Site settings changes need Admin access" | Open Site settings › | ✕ |
| Browser storage full (INV Y32) *(R-1018, F-PB-Y32; DS)* | Recovered (oldest 10 automatic local saves dropped, retry succeeded): **no interruption**; status Details line "Older automatic saves in this browser were removed to make room". Still full after the retry: persistent error toast "This browser's storage is full — local saves stopped. Changes still save to the server." | Download a copy | ✕ |
| Overwrite done *(R-1018, S4)* | toast "Site overwritten" | Before overwrite in Saves › | toast rules (§5.10) |
Nouns per SC-11 (Site, not project). US English.

## 8. Geometry and accessibility (NOT MEASURED)
- Banner 40 min, full width, wraps at 200 % text (grows, never truncates actions); "N more" popover 360. Full-screen card 480 (viewport − 32). Dialogs 480 / 720 bounded, body scroll. Toast 460 max (viewport − 32).
- **Single alert owner:** the exit-guard dialog stays the only `role=alert` in the tree (existing rule, `StudioHeader.tsx:780-781`). Banners carry **no live role**: banners 1–3 announce through the existing assertive pipe `bk-announce-assertive`, banners 4–10 (incl. 4b, 8a, 9a) through the polite pipe (`StudioHeader.tsx:777-784`, moving to the bottom bar per Panel 11 §8) — **Fix** `LoadErrorBanner`'s own `role=alert` (`LoadErrorBanner.tsx:88`). Panel 23's trial-ended notice therefore has **no `role=status`** of its own *(R-1018, D3-4)*. Offline is announced **once**, politely, by this pipe only (§5.3) *(R-1018, D3-15)*. New banner never moves focus; dialogs focus their primary (Sign in, Download a copy) — Esc per SC-2 (session: Keep editing; conflict: close, status stays).
- Read-only states keep Layers, selection and Preview keyboard paths working; refused edits announce the reason once per gesture.
- Glyph + text for every tone; reduced motion: no banner slide, no spinner animation (`motion-reduce`, existing). Motion uses only the DS §2.10 tokens 100 / 160 / 240 ms, no pulse (V5) *(R-1018)*.
- Region cycle (SC-5): the banner slot joins the cycle after the topbar when present (SC-5 amendment text in §14).

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| GS-01–03 route redirects + DeniedState | §5.1 | Keep |
| GS-04 two skeletons, "INITIALIZING ENGINE" | one shell skeleton, "Opening {site}…" | Change + Fix |
| GS-05 LoadErrorBanner (4 kinds, Retry, Sign in new tab) | global banner slot, same kinds/actions | Move + Keep |
| GS-05 editing the unloaded local fallback | read-only until loaded + Download local copy | **Change** (OD-1 decided, SC-22) |
| GS-06 missing copy | restore-aware copy | Fix |
| GS-07 SessionExpiredModal + actions | same dialog, honest copy, banner after Keep editing, auto-resend (G-2) | Keep + Fix + NEW |
| GS-08 offline toasts / pill tooltip / replays | banner + Panel 11 status; replays unchanged | Change (surface) + Keep |
| GS-09 Save failed toast/banner/Retry | Keep; NOT_FOUND → §5.7 | Keep + Fix |
| GS-10 ConflictModal 3 ways out | Download separate from Reload; failure keeps conflict; Overwrite first keeps "Before overwrite" in Saves (S4) *(R-1018)* | Keep + Fix |
| GS-11 recovery toast + Restore my edits | recovery banner, same action + Not now + confirmed Discard; offered only to the copy's user; Restore only when the server is not newer, else Download my copy + Compare (S1) *(R-1018)* | Move + NEW + Fix |
| GS-12 FORBIDDEN → view mode + toast | banner; role re-read on focus | Keep + Change |
| GS-13 publish refusal | + editor banner | Keep + NEW |
| GS-14 ChunkLoadError screen | Keep; + version banner, panel "updated — Reload" | Keep + NEW + Fix |
| GS-15 boundaries | 4 levels, Sentry, error code, computed safety line | Keep + Fix |
| GS-16 toast store rules | §5.10 (caps, two live regions, ⌘S toast → status) | Keep + Change |
| GS-17 bell | in-place same-site rows, one list grouped This site / Other sites *(R-1018, N6)*, new-tab external, mark-read ack | Keep + Fix + NEW |
| GS-18 exit guard | unchanged; risky copy names "this browser only" when true; survives shell crash | Keep + Change + Fix |
| GS-19 other-tab toast (both tabs) | banner in both tabs + Edit here | Change (surface) + NEW |
No capability removed except editing an unloaded fallback copy, removed by OD-1 (decided, SC-22) — the local copy stays downloadable.

## 10. Planned (reserved, not designed)
Real-time collaboration (presence, live merge — flag `NEXT_PUBLIC_FEATURE_COLLAB`, server kill switch `collab.service.ts`); cross-device draft sync; offline-first project queue in IndexedDB (today page edits are tab + localStorage copy only); server push (SSE) for role / site / workspace events instead of focus polling; push for notifications.

## 11. Engineering dependencies (add to SC-9)
| ID | Dependency | Fallback until shipped |
|---|---|---|
| G-1 | Cheap session probe (signed in? as whom) on focus | user presses "Try saving again" (today) |
| ⛔ G-2 | Client knows the session user id at load and after re-auth; resend only for the same user | **no automatic resend**; manual Try saving again only |
| G-3 | Typed 401 / 403 / 404 codes read from tRPC `data.code` on every path (not message regex) | regex as today (`useSaveCallback.ts:51-70`) |
| G-4 | `editorState` read on focus: effective role, site `deletedAt`, workspace `deletionScheduledAt`, **effective plan + site lock state** (detects a trial ending mid-session, SC-20), last editor of the server revision | detection on refused write / Publish only (today) |
| G-5 | (part of G-4) deletion date in the editor | no banner; Publish refusal sentence only |
| G-6 | Build id (Next `deploymentId` or a version endpoint) | ChunkLoadError screen only |
| G-7 | Notifications typed (`targetType`, `targetId`) and `siteId` on every site event (incl. `REVIEW_LINK_REQUESTED`) | all rows: guarded navigation (today) |
| G-8 | Sentry init confirmed for the Next-bundled editor (today only `demo/main.tsx:26` calls `initErrorTracking`); shell + route boundaries capture; the Sentry event id is the user-facing error code | console logs; no error-code line |
| G-9 | URL state for area / page / task (Panel 02 §10) | reload lands in Editor on the current page |
| G-10 | Restore a deleted site from the editor (OWNER) | link to dashboard Recently deleted |
| G-11 | Receipt registry (SC-9 existing) for "N changes saved" and the crash safety line | "Changes saved" without count; crash line "We can't confirm what was saved — download a copy" |
| ⛔ G-12 | User-scoped recovery key (`bk-unsaved-v1-{userId}-{siteId}`) + clear-on-sign-out | **mandatory interim guard:** user id stored inside the payload; copy offered only to that user, otherwise ignored; cleared on explicit Sign out after Download offer (§5.2) |
| ⛔ G-13 *(R-1018, S1 / T5-01)* | "Restore my edits" and Retry / ⌘S compare the kept copy's time with the server revision before applying (fix `765343348`, unmerged) — SC-9 row "Recovery Restore checks the server first" | **mandatory interim guard:** Download my copy + Compare only; no Restore that writes to the server |
| ⛔ G-14 *(R-1018, S4 / T5-14)* | Overwrite writes the server version to History › Saves as "Before overwrite · {time}" first (INV Y9, BK-59) — SC-9 row "'Before overwrite' save" | none — the redesigned Overwrite ships only with the snapshot |
| (Panel 14) P-3 | Active-job query | resume of the Publish view after sign-in/reload not offered; "A publish is already running" |

## 12. Acceptance (specified, NOT RUN)
| ID | Case | Depends on |
|---|---|---|
| T-GS-01 | Signed-out deep link `/edit/x?el=a&page=b` → login → back to the same element and page | — |
| T-GS-02 | Load network failure → banner "This site didn't load…", canvas edits refused with reason, Download local copy works, Retry reloads | — |
| T-GS-03 | Deleted site (soft-deleted) → banner names Recently deleted / 30 days; no "no trash" text; not dismissible | — |
| T-GS-04 | Autosave 401 → dialog; closing the tab and reopening offers "Restore my edits" (copy kept on both paths) | — |
| T-GS-05 | 401 → Keep editing → banner "Session expired…"; exit shows the risky dialog | — |
| T-GS-06 | Sign in (same user) in the new tab → return focus → changes resend; status Saved after the receipt (G-1/G-2) | **BLOCKED** G-1, G-2 |
| T-GS-07 | Sign in as a different user → nothing sent; "signed in as {B}" dialog with Download a copy | G-1, G-2 |
| T-GS-08 | Offline → banner + status "Offline — will save when back online" *(R-1018, CS-12)*; exactly one polite offline announcement (none from the presence pill); Publish/uploads disabled "Needs a connection"; canvas editable; back online → "Reconnecting… saving n" → saved, no "Saved" before receipt | G-11 (count) |
| T-GS-09 | Server 500 while online → "Can't reach Buildrick" (not "offline") + Retry now | — |
| T-GS-10 | Conflict → Download a copy does not reload and shows "Download started"; Reload latest always asks to confirm, even after a download; forced backup failure keeps dialog + conflict + local copy with Retry / Cancel (IAF-22 G/H) | — |
| T-GS-11 | Role lowered to Viewer in another session → on next focus banner "Your role changed…" before any edit (G-4) | **BLOCKED** G-4 |
| T-GS-12 | Workspace deletion scheduled → banner with date; owner sees Cancel deletion ›; editor sees "Ask the owner" | **BLOCKED** G-5 |
| T-GS-13 | Site deleted by teammate mid-session → next save → §5.7 banner, autosave stops, no Retry loop | G-3 |
| T-GS-14 | New deploy while open → banner "new version" on focus; Reload waits for saves and returns to the same page | **BLOCKED** G-6, G-9 |
| T-GS-15 | Lazy panel chunk 404 → panel says "updated — Reload"; rest of the editor works | — |
| T-GS-16 | Forced shell crash with unsaved edits → card shows "You have unsaved changes", Download a copy first; Reload is guarded; Sentry event with error code | G-8, G-11 |
| T-GS-17 | Panel crash when saved → "Your work is saved (time)"; when unsaved → no "safe" claim | G-11 |
| T-GS-18 | 3 persistent + 1 transient toast → 2 persistent + transient + "+1 more"; error announced only in the assertive region | — |
| T-GS-19 | Every toast action has a durable equivalent (audit list); Undo toast ≥ 8 s, pauses on hover/focus | — |
| T-GS-20 | Bell row "Publish failed" on this site → opens Publish task outcome, no navigation, no exit dialog (G-7) | **BLOCKED** G-7 |
| T-GS-21 *(R-1018, N6)* | Bell shows one list: "This site" group first, then "Other sites"; no scope tabs; an Other sites row opens in a new tab; editor tab unchanged | **BLOCKED** G-7 |
| T-GS-22 | Two tabs → both show "also open"; Edit here in B → A saves then turns read-only | — |
| T-GS-23 | Window 900 px or 1440 at 200 % zoom → narrow banner only, dismissible, editor usable; phone (`pointer: coarse`, `screen.width` 390) → L1 card + Open read-only anyway | — |
| T-GS-24 | Only one `role=alert` exists at any time with stacked banners; "N more" lists the rest with their actions | — |
| T-GS-25 | Existing tests (LoadErrorBanner, SessionExpiredModal, ConflictModal, Toast, NotificationPanel, useOtherTabNotice, exit-guard e2e, boot-clean e2e) updated in the same change, not deleted | — |
| T-GS-26 | Kept copy written by user A; user B signs in on the same browser → no "Restore my edits" offer; explicit Sign out offers Download, then clears A's copy | G-12 interim guard |
| T-GS-27 | Recovery banner: Not now hides it for this visit (copy kept); Discard… asks "Delete the kept copy? This can't be undone." | — |
| T-GS-28 | Bell row mark-read fails → jump still happens; row stays unread with "Couldn't mark as read — Retry" | — |
| T-GS-30 | Trial ends while the editor is open on a site over the Free limit → on next focus banner (4b), canvas read-only, status "View only · Versions ›"; owner sees Upgrade, others "Ask the workspace owner to upgrade" | **BLOCKED** G-4 |
| T-GS-29 | Banners 1–3 announce via `bk-announce-assertive`; no banner has `role=alert`; exit dialog remains the only alert | — |
| T-GS-31 *(R-1018, S1)* | Kept copy at 10:00; teammate saves at 10:05; reopen → offer shows "Someone saved this site after your copy was kept" with Download my copy + Compare, **no Restore**; Retry / ⌘S does not re-apply the copy; server read fails → same state with "Couldn't check the server version". Copy newer than the server → Restore my edits applies and saves | **BLOCKED** G-13 (interim: Download + Compare only) |
| T-GS-32 *(R-1018, S4)* | Conflict → Overwrite → consequence confirm (default Cancel) → History › Saves gains "Before overwrite · {time}" holding the server version, then the overwrite lands; toast link opens that save. Forced snapshot failure → nothing overwritten, conflict stays with Retry / Cancel | **BLOCKED** G-14 |
| T-GS-33 *(R-1018, D3-4, D3-21)* | Trial ended → banner (9a) in the slot (not a separate notice), no `role=status`; ✕ keeps it hidden for this user in this workspace on reload; a teammate's save (MP-12) shows banner (8a) in the same slot, under higher-priority banners via "N more" | TR-1, MP-12 |
| T-GS-34 *(R-1018, CS-09)* | Getting-started achievement fires with 2 persistent toasts on screen → it joins the bottom-right stack as persistent class ("+1 more" row); no second live region exists | — |
| T-GS-35 *(R-1018, T1-18)* | RecoveryBanner "Discard & reload" → "Delete the kept copy? This can't be undone." confirm; Cancel keeps the draft | — |
| T-GS-36 *(R-1018, F-PB-Y11)* | Editor without Admin rights saves pages + a settings change → pages save; persistent toast "Pages saved · Site settings change not saved — Site settings changes need Admin access" | — |
| T-GS-37 *(R-1018, F-PB-Y32)* | Fill browser storage → oldest automatic local saves dropped, no toast, status Details line shown; still full → persistent error toast with Download a copy; server saves continue | — |

## 13. Code defects found during this inventory (engineering, not design)
1. "Missing" banner says there is no trash; sites have a 30-day Recently deleted (`LoadErrorBanner.tsx:15-17,97` vs `sites.service.ts:661-701`).
2. A NOT_FOUND save maps to "Could not save project." + Retry (`sites.ts:385-388` → `useSaveCallback.ts:156,384-393`).
3. Autosave 401 keeps no recovery copy and schedules no retry; the manual path keeps one (`useComposerInit.ts:818-830` vs `useSaveCallback.ts:355-365`).
4. `SessionExpiredModal` header and copy say nothing local is written; `keepUnsaved` writes localStorage (`SessionExpiredModal.tsx:6-8,92-93` vs `unsavedRecovery.ts:93-97`).
5. Conflict "Save a backup" reloads in `finally` even when the backup throws (`AquibraStudio.tsx:818-830`).
6. `StudioErrorBoundary` shows the raw `error.message` and captures nothing (`AquibraStudio.tsx:106-127`).
7. Route `EditorErrorBoundary` logs to console only; its "Reload" button remounts for non-chunk errors; hex colours + 'Inter Tight' in editor chrome (`EditorErrorBoundary.tsx:24-38,57-87`; `EditorClient.tsx:50-55`).
8. `initErrorTracking` has no caller in the Next-bundled editor — only the port-5050 demo calls it (`errorTracking.ts:31`, `demo/main.tsx:26`).
9. `SidebarErrorFallback` claims "Your work is safe" unconditionally; "Try Again" title case (`SidebarFallbacks.tsx:25,40`).
10. The `beforeunload` guard lives inside `StudioHeader`, which a shell crash unmounts (`StudioHeader.tsx:541-564`) — inference, NOT RUN.
11. `EditorSkeleton` comment points to an SSR skeleton in `layout.tsx`, which is a pass-through file; bottom strip 24 (`EditorSkeleton.tsx:2-3,56-62`; `app/edit/[siteId]/layout.tsx:15-21`).
12. "INITIALIZING ENGINE" is internal jargon shown to users (`Skeleton.tsx:121`).
13. `REVIEW_LINK_REQUESTED` is created without `siteId`, so the editor's site-scoped bell never lists it (`client-review.service.ts:407-412`).
14. Unread count failure shows 0 (`NotificationService.ts:53-58`) — Panel 01 Fix, restated.
15. `getEffectiveSiteRole` ignores `deletedAt`, so the route renders the editor for a deleted site (`permission.service.ts:162-169`, `page.tsx:36`).
16. Recovery key not user-scoped — on a shared browser user B can be offered user A's edits (`unsavedRecovery.ts:23-27`).
17. A failed row mark-read is swallowed; the user never learns the row stayed unread (`NotificationPanel.tsx:157-163`; IAF-19 H).
18. Persistent toasts unbounded; one viewport flips `aria-live` polite ↔ assertive, which screen readers handle unreliably (`Toast.tsx:155-162,322-329`).
19. Manual save toast says "Project saved successfully" (SC-11 noun is Site) (`useSaveCallback.ts:221-226`).
20. 401 detection by message regex on both paths (`useSaveCallback.ts:51-57`; `useComposerInit.ts:403-405`).
21. `LoadErrorBanner` uses `role=alert` (`LoadErrorBanner.tsx:88`), breaking the "exit dialog is the only alert" rule (`StudioHeader.tsx:780-781`).

## 14. Review, follow-up texts and not verified
Independent `design-qa-critic` pass 1: PROPOSAL, 8 blocking (B1 other-tab facts; B2 Reload confirm / Download started; B3 recovery-copy account safety; B4 Not now vs Discard; B5 single alert owner; B6 honest offline copy; B7 publish resume = NEW via P-3; B8 mark-read Fix) + 11 notes (N1–N11) — all fixed 2026-10-17 in this file. Pass 2: 2 blocking (B1 Locked on Free banner + G-4 plan read; B2 phone detection by pointer + device screen width) — fixed 2026-10-17.

**Follow-up texts for other docs — SC-5 / SC-10 / SC-15 / 01 §5.7 / 11 §8 applied:**
- **SC-5 amendment:** "F6 order: topbar → **global banner slot (Panel 22 §4.2, only while a banner shows)** → rail → left panel / local nav → canvas toolbar + canvas (or workspace body) → Inspector / right task → bottom bar. ⌃` / ⌃⇧` follow the same order."
- **SC-10 row:** "| Global banner slot under the topbar; banners join the F6 cycle; persistent conditions move from toasts to banners | Panel 22 (R-1017) | SC-5, 01, 11, 05 §9 |"
- **SC-15 declared exception (add to the confirm list):** "…and **discarding a kept unsaved copy** (Panel 22 §7: 'Delete the kept copy? This can't be undone.') — the copy is the only record of work the server never received, so there is nothing to undo to."
- **Panel 01 §5.7 follow-up:** "Row click: rows about this site open their in-editor target (Review task, Publish task outcome, Site settings › Form submissions) with no navigation and no exit guard; rows elsewhere open in a new tab ↗; a failed mark-read leaves the row unread with 'Couldn't mark as read — Retry'; deleted / forbidden / unavailable targets show their line (Panel 22 §5.11). Scope: This site · All."
- **Panel 11 §8 amendment:** "Offline status tooltip and Details line: 'You're offline. Page edits are kept in this browser; other changes need this tab open. Everything saves when you reconnect.' (replaces 'Offline — changes aren't reaching the server…'; same sentence as Panel 22 banner 6). The live pipe (polite + `bk-announce-assertive`) carries Panel 22 banner and toast announcements as well."
- **SC-9 rows:** G-1 … G-12 from §11 (⛔ G-2, ⛔ G-12) under "Panel 22". *(R-1018)* ⛔ G-13 = SC-9 "Recovery Restore checks the server first"; ⛔ G-14 = SC-9 "'Before overwrite' save" (both already in SC-9).
- *(R-1018)* **SC-15 class (b) consequence confirms owned here:** Reload latest (discards local), Overwrite in conflict (after the "Before overwrite" save). Existing SC-15 item kept: discarding a kept unsaved copy (incl. RecoveryBanner Discard).
- *(R-1018)* **Not applied (needs a decision):** T1-07 review-closed toasts (retire vs exception to §5.10); T1-13 bell "View all" vs Load more; T1-24 "Project update failed" ladder level; T5-16 whether RecoveryBanner mounts for dashboard sites.

Not verified: runtime of every state; whether a soft-deleted site's save returns NOT_FOUND or FORBIDDEN (router mapping read, service path not traced); Sentry init in the Next bundle; whether React render errors reach `RecoveryManager`'s window `error` listener in production; screen-reader output; geometry. No new keyboard shortcuts are added.

**Owner decisions — Decided (SC-22)**
- **OD-1 — Decided (SC-22):** load failed → read-only canvas + Download local copy (those edits could never be saved, GS-05).
- **OD-2 — Decided (SC-22):** phone (`(pointer: coarse)` + `screen.width` < 600 device px) → L1 card "Buildrick needs a larger screen" + Open read-only anyway; no editing.
- **OD-3 — Decided (SC-22):** last 2 versions of Chrome, Edge, Firefox and Safari (desktop), stated in Help and the banner.
