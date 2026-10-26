# Design 2L9 · Lane L-F · Recovery, access, review — sub-plan

> Parent: `docs/superpowers/plans/2026-10-22-implement-2l9-design.md` (Global Constraints, Review Focus,
> manifest schema, Phase 2 lane table). This file inherits all of them; nothing here relaxes one.
> Inventory: `packages/editor/docs/design-2l9/inventory/07-recovery.md` / `.json`, F5 in `inventory/09-play.md`.
> Branch `feat/design-2l9-lane-f` from `feat/design-2l9`, worktree `~/Desktop/buildrik-worktrees/design-2l9-lane-f`.

**Goal:** the recovery, access and review surfaces read and behave like Figma `2L9OTGzBrL6kYmU18yA1c7`
page 07 (`3:8`) and Play F5, inside the code contract.

**Precedence:** behaviour → code contract (Zod schemas, service returns). Visual and on-screen copy →
the board. Board sample data ("Fieldwork Studio", "Ana", "10:31", "12 changes", "Lena") is never copied:
where the code does not know a fact the board shows (who changed the site, how many changes), the
sentence is written without it and the row records `authority: code:<reason>` for that part.

## Ownership (lane table + this brief)

Owned: `shell/LoadErrorBanner.tsx`, `shell/siteLoadStatus.ts`, `shell/RecoveryBanner.tsx`,
`shell/SaveFailedBanner.tsx`, `shell/ViewerRoleNotice.tsx`, `shell/SendForReview.tsx`,
`sidebar/tabs/review/`, `collaboration/`, the dashboard client review page through the full chain.

Taken by this lane because the brief's first slices name them and no other lane owns them:
`shell/modals/ConflictModal.tsx`, `shell/modals/SessionExpiredModal.tsx`,
`shell/modals/ReviewSentModal.tsx` (the SendForReview outcome dialog), and new files
`shell/globalBanners.ts`, `shell/GlobalBannerSlot.tsx`, `shell/keptWorkOffer.ts`,
`shell/workSnapshot.ts`, `shell/EditorStoppedScreen.tsx`. One service addition:
`services/versionSync.ts › keepBeforeOverwrite` (existing `siteVersions.create` endpoint, no server change).

Not edited (lead / founder): `AquibraStudio.tsx`, `StudioHeader.tsx`, `StudioPanels.tsx`,
`shell/hooks/*`, `src/engine/`. Each producer change there is a numbered `REQUESTS.md` entry.
The pattern for reaching them without an edit is `siteLoadStatus.ts`'s: a small store the lead-owned
producer writes in one line, read by the surface this lane owns.

## Archetypes, in order of user impact

Each slice = one commit: failing tests first, then the change, manifest rows updated in the same commit.
Verification is light (owner preference): targeted vitest, `tsc --noEmit`, `verify:ds` per batch.
No board screenshots exist in the dump, so a row moves to `drift-fixed` only after a screenshot
comparison; until then it stays `drift-open` with "built, not compared; copy matches dump".

### S1 · F5.04 Preview failed — the designer chooses (Play F5 failing step)
- Rows: `307:16107` (F5.04), `307:15711` (F5.03), `307:16503` (F5.05), `310:23087` (F5.42) + inherited variants.
- Files: `shell/SendForReview.tsx`, `shell/modals/ReviewSentModal.tsx`, `sidebar/tabs/review/ReviewTab.tsx` (round number).
- Today: a render failure sends without a preview, silently (`SendForReview.tsx:110`).
- Board copy: preparing "Preparing the review preview…" / "Creating the frozen Round {n} snapshot. Nothing has been sent yet.";
  failed "We couldn’t render a preview" / "Your client would see no pages. Nothing was sent. Your email and note are kept." ·
  Cancel · Try again · Send without preview; sending "Sending Round {n}…" / "The frozen preview is ready. Waiting for the
  review and invitation outcome." (or "No preview will be included. …").
- Failing tests: `SendForReview › a preview render failure sends nothing and offers Cancel / Try again / Send without preview`;
  `› Send without preview submits with no snapshot`; `› Try again re-renders`; `› Cancel keeps email and note`;
  `ReviewSentModal › preparing and sending copy names the round`.

### S2 · One global banner slot with "N more" (G31) and the conditions that move out of toasts
- Rows: `227:14297` (G31), `225:7600` (G11 offline), `225:8126` (G12 can't reach), `225:8654` (G13 reconnecting),
  `227:12711` (G28 other tab), `227:7411` (G18 role changed), `225:3888` (G04 session banner), `225:2821` / `227:9531`
  (G02/G22 download action).
- Files: new `shell/globalBanners.ts` (store: show / clear by id, ordered error → warning → info, then newest),
  new `shell/GlobalBannerSlot.tsx` (one 40 px bar + "{n} more ⌄" popover listing the rest with their actions),
  `shell/LoadErrorBanner.tsx` (its bar becomes the slot's lead entry, so the slot is live at today's mount
  with no AquibraStudio edit), new `shell/workSnapshot.ts` (download the work as JSON: registered provider,
  else the kept unsaved copy).
- Offline is produced by the slot itself from `online` / `offline` window events (nothing else needs it).
  Can't reach, reconnecting, other tab and role changed are produced in lead hooks: exported
  `show*Banner` helpers carry the board copy (one home for it) and REQUESTS ask for the one-line swap
  from `addToast` to the helper.
- Board copy (verbatim): G11 "You’re offline. Page edits are kept in this browser; other changes need this tab open.
  Everything saves when you reconnect."; G12 "Can’t reach Buildrick. Your edits are kept and will save when it responds."
  · Retry now; G13 "Reconnecting… saving {n} changes" (count optional → "Reconnecting… saving your changes");
  G28 "This site is also open in another tab. Edit in one tab at a time." · Edit here; G18 as Task 1.6 +
  Download them · Ask an admin; G02 + Download local copy; G22 + Download changes.
- G28 "Edit here" needs tab handoff (G29/G30, missing): the banner is dismissible (✕) until the handoff slice;
  row stays `drift-open` with that note. "Ask an admin" opens the Permissions dialog (no access-request
  API exists) → `authority: code:no-access-request-api`.
- Failing tests: `GlobalBannerSlot › one bar; the rest behind "{n} more"`; `› error outranks warning outranks info`;
  `› popover lists the others with their actions`; `› offline banner on the offline event, cleared on online`;
  `› load-failed bar is the lead entry`; `LoadErrorBanner › Download local copy / Download changes / Download them`.

### S3 · Unsaved-work recovery — one surface (G07–G10)
- Rows: `225:5474` (G07), `225:6003` (G08), `225:6532` (G09), `225:7061` (G10).
- Files: `shell/RecoveryBanner.tsx`, new `shell/keptWorkOffer.ts` (the load path publishes the off-screen copy and its
  restore; the banner is the one surface that offers it).
- Board copy: G07 "Unsaved edits from your last visit ({when}) were kept in this browser. The site hasn’t changed since."
  · Discard… · Restore my edits; G08 "Someone saved this site after your copy was kept ({time}). Your copy is still in this
  browser." · Download my copy · Compare; G09 "Couldn’t check the server version, so your kept copy can’t be restored
  safely right now." · Download my copy · Compare; G10 dialog "Delete the kept copy?" / "This can’t be undone. The site
  stays as it was last saved." · Cancel (default focus) · Delete copy.
- Compare (kept copy vs server) needs a `CompareHost` source it does not have → `drift-open`, Compare not rendered,
  REQUEST for a compare source; Download is.
- The toast in `useComposerInit.ts:369` is the second surface: REQUEST to publish `setKeptWorkOffer(...)` instead.
- Failing tests: `RecoveryBanner › server older: Discard… / Restore my edits`; `› server newer: Download my copy, no restore`;
  `› server unknown: same, its own copy`; `› Discard… asks first, Cancel focused, Delete copy discards`;
  `› Restore runs the published restore once`.

### S4 · Conflict dialog (G14–G17)
- Rows: `225:9180`, `225:9715`, `225:10249`, `225:10783`.
- Files: `shell/modals/ConflictModal.tsx`, `services/versionSync.ts`.
- Board: 720 wide; "This site changed somewhere else" / "Changed at {time} in another tab or on another device. Your
  changes in this tab haven’t been saved." (who and how many are not in the code contract → `code:conflict-no-author`);
  buttons Overwrite… · Download a copy · Reload latest… (primary). Reload latest… → "Reload the latest version?" /
  "Your changes in this tab will be replaced. A download, if you started one, isn’t checked." · Cancel · Reload.
  Overwrite… → "Overwrite the newer version?" / "The version from {time} is kept in History › Saves as “Before overwrite”
  first. Then your changes replace it." · Cancel · Overwrite; on failure "Couldn’t keep the newer version — nothing was
  overwritten." · Cancel · Retry.
- "Before overwrite": fetch the server's project (`loadProject`) and create a server version named "Before overwrite"
  (`siteVersions.create`) before `onOverwrite` — existing endpoints, full chain already in place.
- "Download a copy" downloads and stays (the board's G15 line presumes it); brand-format variant keeps no Overwrite
  (`code:brand-format`).
- Failing tests: order and copy; Reload confirm; Overwrite keeps the version first; failure keeps the server and offers Retry.

### S5 · Session expired — dialog and persistent banner (G03/G04)
- Rows: `225:3353`, `225:3888`.
- Files: `shell/modals/SessionExpiredModal.tsx` (+ `globalBanners.ts`).
- Board: "Sign in again to save" / "Your session expired. Your {n} changes are kept in this tab and in this browser.
  Sign in again to save them." · Keep editing · Try saving again · Sign in ↗ (primary); 480 wide.
  "and in this browser" is said only when a kept copy exists (`readUnsaved`) — code truth.
- Keep editing raises the G04 banner ("Session expired — changes aren’t saving. They’re kept in this tab." · Sign in ↗);
  a later successful save clears it.
- Code-ahead: the "N changes at risk" list folds into the body count (disposition below).

### S6 · Editor stopped — crash screen with error code and download (G26)
- Row: `227:11649`.
- Files: new `shell/EditorStoppedScreen.tsx` (boundary + screen), `shell/workSnapshot.ts`.
- Board: "Something stopped the editor" / "You have unsaved changes — download a copy before reloading." /
  "Error code {code} ⧉" · Download a copy (primary) · Reload editor · Back to sites. The code is a short hash of the
  error, reported with it (no message or stack on screen).
- `StudioErrorBoundary` lives in `AquibraStudio.tsx`: REQUEST to swap it for `EditorStoppedBoundary`.

### S7 · Save failed strip (C04) — copy
- Row: `10:2199`. File `shell/SaveFailedBanner.tsx` (mounted by StudioHeader). Board: "Save before publishing. Your changes
  are kept." · Retry. Brand-refusal variants stay (`code:tokens-invalid`).

## Later slices (listed, not started)

- **R-13 · Client approval code (F5.20–F5.33), server slice.** Contract to write before code:
  - `packages/shared/schemas/client-review.ts`: `requestApprovalCodeSchema {token}`,
    `verifyApprovalCodeSchema {token, code: /^\d{6}$/}`; results
    `{status: "sent", maskedEmail, resendAfterSec} | {status: "rate-limited", retryAfterSec} | {status: "email-failed"}` and
    `{status: "approved", receiptId} | {status: "incorrect", attemptsLeft} | {status: "expired"} | {status: "already-answered"}`.
  - Prisma: `ReviewApprovalCode {id, reviewRoundId, codeHash, expiresAt (10 min), attempts, sentAt, consumedAt}`; one live
    code per round; hash with HMAC (`NEXTAUTH_SECRET`), never stored plain.
  - Service `client-review.service.ts`: issue (rate limit 3 / 10 min per round, uses the email service), verify (5 attempts,
    constant-time compare, approve in the same transaction that consumes the code).
  - Router `client-review.ts`: two public procedures keyed by the review token; domain errors → tRPC codes.
  - Client: `packages/dashboard/app/review/` approval dialog states F5.20–F5.33 (entry, pending "Check status", receipt,
    incorrect, expired, sending new code, sent, email failed, rate limited, failed with code kept, offline).
  - Owner decision first: is a code required for every approval, or only for invited (emailed) reviewers?
    `blocked:owner-approval-code`.
- **F5.08 client pinned comments** (dashboard client page; anchored composer, keyboard placement) — needs an anchor field on
  client comments (server chain).
- **G29/G30 tab handoff** ("Edit here" / "Editing moved to another tab") — needs an engine lock reason (lead).
- **G05/G06 signed in again / different account**, **G19–G21 role raised / workspace deletion**, **G23–G25 new version**,
  **G27 chunk skew**, **G32/G33 narrow / phone**, **G34 toast stack cap**, **G35 notifications grouping**.
- **H01–H16 History / Saves / Published / Activity** copy drifts (page 07, touch `sidebar/tabs/history/`,
  `panels/version-history/`, `TimeTravelHost`, `CompareHost`; `PublishHistory` is L-E's).
- **C01–C09 canvas states** — insertion target, multi-select bar, focus mode, narrow overlay: canvas / inspector lanes
  (L-A / L-B); recorded here so the 07 family has an owner per row.
- **Plans / trial (P01–P12)**, **collab presence and live editing (CL, flag)**, **billing boards** — do not start (brief).

## Code-ahead dispositions

| Code feature | Disposition |
|---|---|
| SessionExpiredModal "N changes at risk" list | Folded into the board's body count ("Your {n} changes are kept…"); the labels list goes (the board has none). `authority: board`. |
| SaveFailedBanner TOKENS_INVALID refusal variants | Kept as variants of the save-failed strip, `code:tokens-invalid`. |
| ConflictModal brand-format variant | Kept inside the G14 dialog without Overwrite, `code:brand-format`. |
| LoadErrorBanner `forbidden` load kind | Mapped to the G18 banner shape (warning, Download them, Ask an admin). |
| LoadErrorBanner Copy details / retry attempts / Reload page | Kept (Task 1.6 obligations), inside the bar. |
| ViewerRoleNotice | Kept in the inspector column (no page-07 board draws it); re-check against the inspector family boards. `open:viewer-column-board`. |
| SendForReview / `sidebar/tabs/review/` beyond F5 | Kept; F5 covers them. |
| Page-limit save refusal toast | Kept as the backstop once P05 lands (plans slice). |
| MultiSelectBar align / distribute | L-B decides (inspector). |

## Owner decisions raised

- `blocked:owner-approval-code` — R-13 above.
- `open:viewer-column-board` — which board draws the viewer inspector column.

## Status (2026-10-26, end of first run)

| Slice | Commit | Rows touched | State |
|---|---|---|---|
| S1 F5.04 preview failed | `f647cd0f9` | 307:16107, 307:15711, 307:16503, 310:23087 | built; panel re-send needs REQUESTS #10 |
| S2 global banner slot | `6db7893c9` | 227:14297, 225:7600, 225:8126, 225:8654, 227:12711, 227:7411, 225:2821, 227:9531 | built; producers REQUESTS #11–#15 |
| S3 kept-work recovery | `4c77be4fd` | 225:5474, 225:6003, 225:6532, 225:7061 | built; toast retirement + Compare source REQUESTS #16 |
| S4 conflict dialog | `25389400a` | 225:9180, 225:9715, 225:10249, 225:10783 | built (no lead change needed) |
| S5 session expired | `74a444737` | 225:3353, 225:3888 | built (no lead change needed) |
| S6 editor stopped | `480eb22cc` | 227:11649 | built; mount swap REQUESTS #17 |
| S7 save-failed strip (C05 `10:2199`) | — | — | **not started**: the board's line "Save before publishing. Your changes are kept." names a publish context the save-failed strip does not have (it also serves the exit path). `open:save-failed-copy-context` — lead/owner to confirm whether the line is publish-only before it is adopted. |

Every touched row stays `drift-open` with "built, not compared": the dump has no board screenshots and
no probe or live comparison was run in this lane (owner: light verification; no Next server in lanes).
The lead's live walk on the integration branch is what moves them to `drift-fixed`.

## Wave 2 (coordinator, 2026-10-26) — after merging `feat/design-2l9` (F-12…F-15 closed by lead1)

Not touched: `AquibraStudio.tsx`, `shell/hooks/*`, `StudioPanels.tsx`, `FullPageRouter.tsx`, `src/engine/`.
F5.20–F5.33 stay `blocked:owner-approval-code`. Paths taken for this wave (assigned rows, no other lane
owns them): `sidebar/tabs/history/`, `panels/version-history/`, `sidebar/tabs/activity/`,
`shell/TimeTravelHost.tsx`, `shell/CompareHost.tsx`, `shell/NotificationPanel.tsx`; `shell/PublishHistory.tsx`
(L-E's) for H09/H10 copy only.

| # | Archetype | Rows | Files |
|---|---|---|---|
| W1 | Save-failed strip: board copy in the publish context + a context-free variant (`open:save-failed-copy-context` kept) | 10:2199 | `shell/SaveFailedBanner.tsx` |
| W2 | History · Session rows: verb · target · place, inline Restore to here, step-named confirm, restored row | H01–H03 | `sidebar/tabs/history/components/ActivityView.tsx` |
| W3 | History · Saves: flat filter, header Save a version, details, delete confirm dialog, offline note | H04, H05, H07, H15 | `SavesChrome.tsx`, `SavesFilter.tsx`, `VersionList.tsx`, `HistoryTab.tsx` |
| W4 | Restore to draft + Undo restore; Compare and Time Travel chrome | H06, H11, H12 | `TimeTravelHost.tsx`, `CompareHost.tsx`, `CompareView.tsx` |
| W5 | Activity: Load more (if the API has a cursor), Back to Activity, load error | H13, H14, H16 | `sidebar/tabs/activity/` |
| W6 | Published: Compare with live, Republish confirm copy | H09, H10 | `shell/PublishHistory.tsx` |
| W7 | Slot-owned conditions: narrow window banner, phone screen with Open read-only anyway | G32, G33 | `GlobalBannerSlot.tsx`, `globalBanners.ts` |
| W8 | Condition banners: role raised, workspace deletion, new version (save first, then reload; stop on a failed save), panel updated | G19–G21, G23–G25, G27 | `globalBanners.ts`, new `shell/reloadAfterSaving.ts` |
| W9 | Tab handoff: Edit here / editing moved / refused | G29, G30 | new `shell/tabHandoff.ts` (+ lead request for the mount) |
| W10 | Notifications grouped This site / Other sites; signed in again / different account | G35, G05, G06 | `shell/NotificationPanel.tsx`, `modals/SessionExpiredModal.tsx` |

Out of this lane's paths: G34 toast cap lives in `chrome-ui/Toast.tsx` (lead request). H08 needs RT-D1 server soft delete.
