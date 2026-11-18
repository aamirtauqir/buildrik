# 06 · Site delivery — gap inventory

Page `page-3-7.json` (Figma page 06). 687 active frames (manifest `boards-2l9.json`, page 06; 1 out-of-scope note excluded). Read-only pass, zero Figma calls. Method: archetypes by name prefix + shared structure; board copy compared with code by literal string search over the settings/publish/review/export/shell sources plus the dashboard client review page, then spot reads of each surface.

**Counts:** drift 274 · missing 402 · blocked:handoff-note 9 · match 2 · 234 rows carry `inheritsFrom` (grid siblings that differ only by destination / device origin / dataset; error, loading, pending, offline and read-only variants never inherit).

Paths: `settings/` = `packages/editor/src/editor/sidebar/tabs/settings/`, `publish/` = `…/sidebar/tabs/publish/`, other editor paths are relative to `packages/editor/src/editor/`.

Shell chrome common to every frame (topbar, rail, bottom bar, inspector header) is Phase 1 and not re-analysed per row. Settings rows carry one shared shell drift, tagged phase1: the board draws Site settings **inside** the editor shell (Topbar 56 + Rail + bottom bar "Editor keeps Home open — return with ‹ Back to Editor"), while code renders it as a full-screen portal with its own 256 nav (`sidebar/FullPageRouter.tsx:160`).

## Publish (B8-PB · phase1 Task 1.7 tray)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| PB01 blocking check | 233:2 | 1 | `shell/lifecycle.ts:256` | drift | phase1 T1.7 tray. Board: red check blocks publish; code re-labels "Publish anyway" — behaviour conflict, needs owner call |
| PB02 tray ready | 233:649 | 1 | `publish/PublishTab.tsx:1001` | drift | phase1 T1.7: no tray; panel has Checks/Release to/Changes/Last deploy, CTA "Publish to production" |
| PB03 What will change | 233:1237 | 1 | `shell/PublishDiffView.tsx:1` | drift | phase1 T1.7: diff is version↔version only; draft-vs-live per-page Compare needs P-2 |
| PB04-06 review-and-publish dialog | 233:1802, 233:2418, 233:3034 | 3 | `shell/modals/PublishConfirmModal.tsx:85` | drift | "Publish to production?" facts confirm; no tick boxes; stale override is a separate modal |
| PB07-08 publishing progress | 233:3648, 233:4197 | 2 | `publish/PublishTab.tsx:724` | drift | progress block exists; no step list/elapsed, no topbar "Publishing n/3", Cancel not Admin+queued-only |
| PB09 published | 233:4748 | 1 | `publish/PublishTab.tsx:809` | drift | result block exists; "See what changed" missing (P-4) |
| PB10 publish failed | 233:5303 | 1 | `publish/PublishTab.tsx:534` | drift | Try again + View log exist; copy must name the live version kept |
| PB11-12 lost/unknown start | 233:5851, 233:6396 | 2 | `publish/PublishTab.tsx:553` | drift | pollLost "Check status" exists; start-timeout state (Try again off) not distinct |
| PB13 live not recorded | 233:6942 | 1 | — | missing | no "live but not recorded" outcome in usePublishJob |
| PB14 simulation | 233:7488 | 1 | `publish/PublishTab.tsx:810` | drift | simulation notice exists; board wants server flag (P-5) and tray copy |
| PB15 changes requested gate | 233:8034 | 1 | `publish/PublishGateBanner.tsx:1` | drift | gate banner exists; tray layout and "Waiting on review" reason differ |
| PB16-17 password on Free | 233:8594, 233:9161 | 2 | — | missing | no publish-time password-on-Free block or Remove-protection-and-publish confirm |
| PB18 unpublish typed | 233:9714 | 1 | `publish/UnpublishConfirmModal.tsx:62` | drift | types UNPUBLISH; board types the domain, Admin only |
| PB19-21 publish refused reasons | 233:10270, 233:10827, 233:11377 | 3 | `shell/lifecycle.ts:237` | drift | PB20 copy matches; PB19/PB21 copy differs ("Publishing needs Editor access", "Needs a connection"); tray T1.7 |
| PB22 over Free limit | 233:11934 | 1 | — | missing | no site-limit publish lock in lifecycle publishBlocker |
| PB23 checks loading | 233:12491 | 1 | `publish/PublishTab.tsx:520` | drift | "Checking readiness…" vs tray "Checking…" |

## Export (B8-EX)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| EX01-03 export dialog tabs | 236:4951, 236:5523, 236:6085 | 3 | `export/ExportModal.tsx:288` | drift | title "Export site as X"; Vue/Next "Soon" shown (ExportOptions.tsx:29); no Free custom-code note |
| EX04 preparing | 236:6656 | 1 | `export/ExportModal.tsx:503` | match | "Preparing your export…" + "Exporting…" (:457) |
| EX05-06 ready/failed | 236:7208, 236:7760 | 2 | `export/ExportModal.tsx:383` | drift | phases exist; "Export ready — <file> downloaded" and reason line copy differ |
| EX07 offline | 236:8312 | 1 | — | missing | no offline handling in ExportModal |
| EX08 preview failed | 236:8864 | 1 | — | missing | no preview load-error state with Retry |

## Issues (B8-IS)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| IS01/IS03 issues list | 236:9417, 236:10492 | 2 | `shell/IssuesPanel.tsx:213` | drift | errors-first exists; no "n block publishing · n tips" summary or per-row location |
| IS02 fixing band | 236:9961 | 1 | — | missing | no "‹ Back to Issues · Fixing 1 of 2" band after Fix |

## Site settings (B8-S, AN, SH, PM, CF, SG, GUARD/SAVING, Permissions return, GAP-ST-*)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| S01 Overview | 238:9980 | 1 | `settings/screens/OverviewScreen.tsx:175` | drift | plan card exists, trial card missing; settings is a full-page portal (FullPageRouter.tsx:160), board sits in shell — phase1 |
| S02-04 General staged save | 238:10283, 238:10586, 238:10889 | 3 | `settings/SettingsTab.tsx:1157` | drift | footer "Save" vs "Save settings"; scope chip copy; "Back to canvas" vs "‹ Back to Editor · Home" |
| S05 offline save | 238:11192 | 1 | — | missing | no offline detection in Settings |
| S06 leave guard | 238:11495 | 1 | `settings/components/UnsavedSettingsDialog.tsx:60` | drift | "Unsaved settings"/"Save and continue" vs "Leave without saving?"/"Save and leave" |
| S07 Languages | 238:11810 | 1 | `settings/screens/LocalizationScreen.tsx:65` | drift | staged default vs immediate locales; removal Undo + translated counts differ |
| S08 SEO | 238:12118 | 1 | `settings/screens/SeoScreen.tsx:101` | drift | no Page settings link, no "SEO analysis · Planned" |
| S09 Domains | 238:12413 | 1 | `settings/screens/DomainsScreen.tsx:141` | drift | cards/DNS view differ; Make primary + Undo present |
| S10 Redirects | 238:12721 | 1 | `settings/screens/RedirectsScreen.tsx:286` | drift | delete + Undo exist; "Redirects · 3 of 100" header, scope copy differ |
| S11 Access | 238:13017 | 1 | `settings/screens/AccessScreen.tsx:201` | drift | password card exists; checkbox copy + trial line differ |
| S12 Access off and publish | 238:13310 | 1 | — | missing | no turn-off-and-publish consequence confirm |
| S13-14 Form submissions | 238:13598, 238:13898 | 2 | `settings/screens/FormsScreen.tsx:92` | drift | single all-forms inbox; no form filter, bulk select, "Delete n" |
| S15 Custom code on Free | 238:14186 | 1 | `settings/screens/AdvancedScreen.tsx:151` | drift | "Saved · not published on Free" line missing |
| S16-17 Danger zone | 238:14472, 238:14765 | 2 | `settings/screens/DangerZoneScreen.tsx:104` | drift | archive/transfer/delete + typed delete exist (DeleteSiteModal); copy differs |
| S18 change site URL | 238:15056 | 1 | `settings/components/SlugChangeDialog.tsx:41` | drift | title + "Change URL" match; body copy differs |
| S19 Domains read-only | 238:15344 | 1 | `settings/SettingsTab.tsx:712` | drift | ReadOnlyBanner exists; copy "Domains need Admin access…" differs |
| S20 settings search | 238:15632 | 1 | `settings/SettingsTab.tsx:1015` | drift | search mode exists; result row "Screen › Group › Field" + Open › differ |
| S21 1280 collapsed nav | 238:15920 | 1 | — | missing | no compact settings navigation at 1280×640 |
| AN analytics provider screen | 245:45159, 245:45416, 245:45673 | 10 | `settings/screens/AnalyticsScreen.tsx:376` | drift | 4 providers + verify pill exist; tracker disclaimer, status copy, footer states differ |
| AN07 offline | 245:46707 | 1 | — | missing | no offline state |
| AN11 not configured | 245:47736 | 1 | `settings/screens/AnalyticsScreen.tsx:134` | match | all board copy present |
| SH security headers screen | 245:47988, 245:48243, 245:48510 | 9 | `settings/screens/HeadersScreen.tsx:117` | drift | fields exist; "Browser policies" group, HSTS "1 year · 31536000 seconds" labels, custom-value note differ |
| SH04 offline | 245:48768 | 1 | — | missing | no offline state |
| SH09 checking access | 245:50045 | 1 | — | missing | no "Checking your access… · Save unavailable" footer state |
| PM permissions matrix | 245:50300, 252:49216, 252:49487 | 3 | `shell/modals/PermissionsModal.tsx:52` | drift | modal lists editor actions; board = settings min-role matrix (data in constants.ts:168) |
| CF settings conflict | 245:50545, 245:50779, 245:51002 | 3 | — | missing | no per-field settings conflict; CMS has the pattern (services/cmsSync.ts:219) |
| SG01 guard keeps destination | 245:51225 | 1 | `settings/SettingsTab.tsx:659` | drift | save-and-continue to pending nav exists; dialog copy differs |
| Return to editor | 245:51515 | 1 | `settings/SettingsTab.tsx:988` | drift | "Back to canvas" vs "‹ Back to Editor · Home"; phase1 shell |
| Permissions return | 248:16302, 248:16547, 248:16786 | 17 | `shell/modals/PermissionsModal.tsx:52` | drift | Permissions over each screen; matrix copy differs |
| GUARD general draft → dest | 248:20642, 248:21107, 248:21572 | 10 | `settings/components/UnsavedSettingsDialog.tsx:60` | drift | guard exists; board names the destination |
| SAVING general draft → dest | 248:20853, 248:21318, 248:21783 | 10 | `settings/components/UnsavedSettingsDialog.tsx:98` | drift | button "Saving…" only; board "Saving General settings… · Stay in General" |
| AN13-14 load states | 252:47222, 252:47480 | 2 | `settings/screens/AnalyticsScreen.tsx:324` | drift | load/error exist; "Couldn’t load Analytics" copy differs |
| SH12-13 load states | 252:47733, 252:47989 | 2 | `settings/SettingsTab.tsx:786` | drift | shell load/error exist; per-screen copy differs |
| AN15-16 / SH14-15 compact 1280 | 252:48242, 252:48492, 252:48740 | 4 | — | missing | no compact nav popover / fixed footer at 1280×640 |
| GAP-ST-L Languages default save | 277:25315, 277:25524, 277:25733 | 8 | `settings/screens/LocalizationScreen.tsx:65` | drift | staged-default save/ack/failure + Français Undo states differ |
| GAP-ST-H HSTS save | 277:26371, 277:26615, 277:26859 | 3 | `settings/screens/HeadersScreen.tsx:61` | drift | HSTS presets exist; saved/saving/failure copy differs |
| GAP-ST-T acknowledged target | 277:27105, 277:27321 | 2 | `settings/SettingsTab.tsx:659` | drift | lands on destination after save; ack copy differs |
| GAP-ST Brand return to settings | 277:27516, 277:107722, 277:107940 | 4 | — | missing | Brand has only "‹ Back to canvas" (design-system/ui/BrandWorkspace.tsx:254); no return to Site settings (L-D) |
| GAP-ST guard draft→dest | 277:27746, 277:28527, 277:29308 | 26 | `settings/components/UnsavedSettingsDialog.tsx:60` | drift | guard exists; destination-named copy differs |
| GAP-ST saving→dest | 277:27988, 277:28769, 277:29551 | 26 | `settings/components/UnsavedSettingsDialog.tsx:98` | drift | pending state only on the button |
| GAP-ST save failed→dest | 277:28233, 277:29014, 277:29797 | 26 | `settings/SettingsTab.tsx:659` | drift | failure keeps the screen; no "Retry save and leave" dialog |
| GAP-ST-ORG workspace door | 277:38019, 277:38294, 277:38571 | 9 | `settings/screens/WorkspaceDoorScreen.tsx:30` | drift | door card exists; "Organization workspace · X", "Back to Site settings" copy differ |
| GAP-ST-PM permissions return | 277:39669, 278:78177 | 2 | `shell/modals/PermissionsModal.tsx:52` | drift | matrix copy differs |
| GAP-ST publish from settings | 277:39946, 277:42403, 277:40172 | 26 | — | missing | Settings portal has no Publish; no "Save settings first?" pre-publish guard · sub-states: PB draft-excluded (2), PC draft-excluded (2), PR draft-excluded (2), PW draft-excluded (2), PB included (3), PC included (3), PR included (3), PW included (3) |
| GAP-ST-ACK saved→dest | 278:61847, 278:62059, 278:62270 | 25 | `settings/SettingsTab.tsx:659` | drift | navigates after ack; destination screens carry their own drifts |

## Form submissions (GAP-FM, GAP-FMC)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| FM Spam/Archived/filter views | 272:21156, 272:21455, 272:21754 | 4 | — | missing | no Spam/Archived views or form filter (server listSubmissions supports them) |
| FM inbox list | 272:22068, 272:22660, 272:22932 | 4 | `settings/screens/FormsScreen.tsx:92` | drift | all-forms inbox + detail + delete exist; per-form header, bulk select, counts differ |
| FM08/10 delete pending/failed | 272:23206, 272:23770 | 2 | `settings/screens/FormsScreen.tsx:188` | drift | error line exists; selection-kept + pending states differ |
| FM export per view/form | 272:24050, 272:24871, 272:25629 | 9 | — | missing | view-aware export needs server (exportSubmissions has no view, server/trpc/routers/forms.ts:91) · sub-states: Preparing CSV (3), CSV prepared (3), CSV failed (3) |
| FM export Inbox/All forms | 272:26387, 272:26650, 272:26917 | 3 | `settings/screens/FormsScreen.tsx:192` | drift | Export CSV exists; preparing/ready/failed copy differs · sub-states: Preparing CSV (1), CSV prepared (1), CSV failed (1) |
| FM unspam/unarchive | 272:27190, 272:27978, 272:27440 | 6 | — | missing | no Unspam/Unarchive actions (updateSubmission supports isSpam/isArchived) · sub-states: Pending (2), Acknowledged (2), Failed (2) |
| FM11 configure return | 272:28766 | 1 | `settings/screens/FormsScreen.tsx:7` | drift | Configure in Inspector exists; no "‹ Back to submissions" return |
| FMC context grid | 277:336979, 277:337275, 277:337616 | 203 | — | missing | filter/view/export context grid; views, form filter, view-aware export absent · sub-states: dataset (29), Filter (36), Export-pending (36), Export-ready (36), Export-failed (36), Configure (18), Delete-confirm (3), Delete-pending (3), Delete-failed (3), No-selection-export (1), Zero-selection-filter (1), Zero-selection-configure (1) |

## Review: editor task + client page (B8-R, GAP-RV, GAP-RVC) · lane L-F / dashboard

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| R01-05 review task panel | 237:8258, 237:8840, 237:9422 | 5 | `sidebar/tabs/review/ReviewTab.tsx:141` | drift | L-F. Status line/page groups/Locate exist; round card, Client/Team/All, Next ›, audience picker differ |
| R06 unsent reply guard | 237:11120 | 1 | — | missing | no leave guard for an unsent reply |
| R07 preview render failed | 237:11712 | 1 | `shell/SendForReview.tsx:110` | drift | code silently sends without preview; board stops and asks |
| R08-14 client review page | 237:12304, 237:12354, 237:12411 | 7 | `packages/dashboard/app/review/[token]/review-client.tsx:478` | drift | notes + approve exist; no pins, anchored composer, device switch, 6-digit code, offline, phone sheet |
| GAP-RV approval with code | 276:28306, 276:28376, 276:28444 | 28 | — | missing | OTP approval needs server R-13; client approve is one confirm (review-client.tsx:516) |
| GAP-RV phone placement/comments | 276:29801, 276:29852, 276:29893 | 20 | — | missing | no phone pin placement, pan, comments sheet on the client page |
| GAP-RV request-changes flow | 276:30195, 276:30262, 276:30321 | 15 | `packages/dashboard/app/review/[token]/review-client.tsx:494` | drift | request changes + note exist; posting/resolving/partial-failure states differ |
| GAP-RVC device-origin approval | 280:70080, 280:71247, 280:72414 | 78 | — | missing | OTP approval per device origin; needs R-13 + phone placement · sub-states: entry (5), ready (5), pending (5), receipt (5), approved (5), incorrect (5), expired (5), sending (5), sent (5), sendfail (5), rate (5), already (5), failure (5), offline (5), approved-comments (5) |

## Account › Privacy (dashboard)

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| S22-24 Account › Privacy | 239:12234, 239:12256, 239:12280 | 3 | — | missing | dashboard account settings has no usage-data toggle |

## Handoff / spec annotation frames

| archetype | example nodeIds | count | code surface | status | notes |
|---|---|---|---|---|---|
| handoff/spec note | 233:13038, 236:11031, 237:12639 | 9 | — | blocked:handoff-note | annotation frame, not a UI state; recommend out-of-scope |

## Top drifts

1. **The publish tray does not exist (PB01–PB23, 23 rows, phase1 Task 1.7).** The publish surfaces today are the Publish panel (`publish/PublishTab.tsx:1001`, sections Pre-publish checks / Release to / Changes in this session / Last deploy, CTA "Publish to production") and the facts confirm (`shell/modals/PublishConfirmModal.tsx:85`). The board instead draws a tray with a status card, What will change, Checks, Approval, Goes to and "Publish changes" with a reason line, plus one review-and-publish dialog with tick boxes. **Behaviour conflict:** on the board a red check blocks publishing ("Fix 1 blocking issue to publish"). In code, `errorCount` only re-labels the CTA "Publish anyway" (`shell/lifecycle.ts:256-262`). Task 1.7's test adopts the board, so the owner has to confirm, because precedence says behaviour follows the code.
2. **Settings host and nav copy (every settings row, phase1).** Board: Settings sits inside the shell with "‹ Back to Editor · Home", "ORGANIZATION WORKSPACE ↗", "Integrations ↗", "Your role: Admin · Permissions ›" and "Save settings". Code: a full-screen portal (`sidebar/FullPageRouter.tsx:160`) with "Back to canvas" (`settings/SettingsTab.tsx:988`), "Managed in workspace settings ↗" and "Integrations & webhooks" (`settings/constants.ts:94,141`), and "Save" (`settings/SettingsTab.tsx:1157`). The 1280×640 compact nav is missing.
3. **Unsaved guard and destination-aware save (about 150 rows: S06, B8-GUARD/SAVING, GAP-ST-G/W/E/ACK/LG/LW/LE).** Code: "Unsaved settings" / "Save and continue" (`settings/components/UnsavedSettingsDialog.tsx:60,98`), and the save goes on to the pending nav (`settings/SettingsTab.tsx:659`). Board: "Leave without saving?" names the destination, then "Saving <screen>… · Stay in <screen>", and a failure dialog offers "Retry save and leave". The failure branch was not exercised live.
4. **Form submissions (about 230 rows: GAP-FM, GAP-FMC, S13–S14).** Code has one all-forms inbox with single-row delete and Export CSV (`settings/screens/FormsScreen.tsx:92,192`). Missing: Spam and Archived views, the form filter, bulk select, Unspam and Unarchive, and the "Back to submissions" return from Configure. The server list already supports form + spam/archived filters. **View-aware export needs a server change:** `forms.exportSubmissions` takes form only (`server/trpc/routers/forms.ts:91`), so it needs the full chain plus `packages/shared/schemas/forms.ts`.
5. **Client review page (about 130 rows: B8-R08–R14, GAP-RV, GAP-RVC; dashboard, lane L-F).** `packages/dashboard/app/review/[token]/review-client.tsx` has notes plus a one-click approve confirm (:516). Missing: the 6-digit approval code (server R-13, no OTP anywhere in `server/services/review.service.ts`), pins and an anchored composer, the device switch, an offline state, and the phone comments sheet and pan/placement.
6. **Offline and settings-conflict states are missing everywhere on this page** (S05, AN07, SH04, EX07, PB21 copy, CF01–03). Nothing in settings, publish or export reads connectivity. A per-field Keep mine / Use theirs exists only for CMS (`services/cmsSync.ts:219`).
7. **Permissions.** `shell/modals/PermissionsModal.tsx:52` lists editor actions. The board (PM01, 17 "Permissions return" rows, GAP-ST-PM/LPM) shows the settings minimum-role matrix, whose data already exists in `settings/constants.ts:168` (`SCREEN_MIN_ROLE`). The access-check loading and failure states are missing.
8. **Publish from Settings (26 GAP-ST-P* rows).** "Save settings first?" → save → whole-site publish confirm → pending job: missing. The Settings portal has no Publish entry at all.
9. **Languages staged default (S07, GAP-ST-L01–L08).** The board stages the default locale while locale add/remove applies at once with Undo and per-default translated counts. `settings/screens/LocalizationScreen.tsx:65` differs.
10. **Export dialog.** It shows Vue and Next "Soon" formats (`export/ExportOptions.tsx:29`), but the board says HTML · ZIP · React only. The title is "Export site as X" (`export/ExportModal.tsx:288`). The offline and preview-failed states and the Free custom-code note are missing.

## Code-ahead dispositions

No board row is `code-ahead`. These capabilities ship in code but the boards do not draw them:

- **Publish history and rollback** (`shell/PublishHistory.tsx`, `publish/PublishTab.tsx:946` "Last deploy · All versions"). Keep it under the tray's ⋯ menu / History, not in the tray body.
- **Preview vs production environment rows** (`publish/PublishTab.tsx:889`). Fold them into the tray's "Goes to" row.
- **Vercel connection repair/reconnect** (`publish/PublishTab.tsx:558,634`) and **Cancel of a running job** (:759). Keep both. Connect Vercel is a blocking check row (Task 1.7 test list). Cancel is gated Admin + queued per PB08.
- **Issues auto-fix** (`shell/IssuesPanel.tsx:7`, `designSystem.applyAutoFix`). Keep it as the Fix › action where a fix exists; otherwise Fix opens the target (IS02).
- **Redirect CSV import and URL-repair card** (`settings/components/RedirectCsvDialog.tsx`, `RedirectRepairCard.tsx`), the **SEO social profiles card** (`SocialProfilesCard.tsx`), the **translation checklist** (`TranslationChecklistDialog.tsx`), the **domain connection-verified dialog** (`ConnectionVerifiedDialog.tsx`), and **Access share links** (`settings/screens/AccessScreen.tsx`). These stay on their own screens. The boards are silent, so nothing should be removed. The owner should confirm before L-E restyles them.
- **Review detached comments and round history** (`sidebar/tabs/review/ReattachModal.tsx`, `RoundHistoryModal.tsx`). Keep them; the board's "From Round 1 · may have moved" is the nearest home.
