# 06 · Collaboration + lifecycle ownership (2026-09-27)

Scope: Comments, Review, Presence, Activity, History, Notifications, Share/Invite, Publish + topbar lifecycle chips.
18 findings, 8 P1. Lowest: Activity 3/10; Review, Notifications, Share/Invite 4/10.
No send / re-send / withdraw / revoke / invite / publish performed; no comments created; share modal reused an existing link.

## 1. Ownership map

| Concern | Every entry point today | Owner today | Proposed single owner |
|---|---|---|---|
| **What happened on this site** | Editor ⋯ › Activity log; ⌘K "Open Activity"; bell "View all activity ›" (code `NotificationPanel.tsx:183`); History › Session / Saves / Published; Publish panel "Changes in this session" + "Last deploy". Dashboard: site Overview "Recent Activity"; `/dashboard/activity`; team activity | Split four ways; none records a canvas edit, review send, or client decision | **Activity** records every event (edits/saves, review sent, approved, changes requested, comments, publishes). History only restores/compares |
| **Who is here** | Nothing in production. ⋯ "Start collaboration · PLANNED" disabled. Presence cluster behind collab flag (`StudioHeader.tsx:851-866`). Only signal: conflict dialog after a refused save | Nobody (A-21 deferred) | Topbar presence cluster fed by a heartbeat independent of live co-editing |
| **What needs my attention** | Review chip; CTA label; editor bell (empty); dashboard bell (2 unread); `/dashboard/notifications`; agency Review queue; email (`review.service.ts:615-690`) | Four channels that disagree; client decisions reach no in-app channel | Bell = my inbox incl. review/comment events. Chip = this site's round. CTA = next action |
| **Review / approval** | Chip; R; ⌘K; Activity comment rows; publish gate "Open Review ›"; lifecycle CTA; panel "Invite a client…" → modal titled "Send for review"; dashboard header "Send for review"; agency queue Approve/Request changes/Withdraw; client `/review/<token>` | Two approval products writing one DB row | Editor **Review panel** owns send/re-send/withdraw + thread; dashboard queue = inbox linking into it |
| **Comments** | Topbar toggle; C; canvas pins; Review thread + composer ("team only"); Activity "Comments" filter; agency "Latest comments". No ⌘K row | Review panel | Keep in Review (pending PD-7), label "Comments"; add ⌘K row; hide Activity filter when reviews off |
| **Share draft link** | Editor ⋯ "Share preview link"; dashboard More › "Share draft" (`site-header.tsx:162-166`); dashboard "Sharing" tab; Review "Copy link" + "Open current review link" | Split: editor creates, dashboard manages (password, expiry, revoke) | Dashboard Sharing owns links; editor modal = front door with "Manage links ↗", site-scoped title |
| **Invite** | ⋯ "Invite teammates ↗"; dashboard Team "Invite"; Review "Invite a client…"; dashboard Clients | Team (members) + Review (clients) | Keep split, name it ("Invite teammates" vs "Invite a client to review"), both under ⋯ › Collaborate |
| **History / versions** | Save pill "History ›"; H; ⌘K (TOOLS band); Publish "All versions ›" (`PublishTab.tsx:440,963`); Activity rows; History ⋯ (Time-Travel, Search, Clear undo history); Compare; Saves "APPROVED" band; Review "Compare rounds" | History, mixing local Session + server Saves/Published | History = saved versions only; Session renamed "Undo" |
| **Publish** | Topbar CTA "Publish anyway"; U → panel "Publish to production"; ⌘K; ⋯ "Unpublish…"; dashboard "Publish" | `lifecycle.ts` (shared CTA + panel) | Same owner, one verb, visible door to the panel |

## 2. Scorecard (0–10)

| Sub-area | Score | Failing lenses | Worst issue |
|---|---|---|---|
| Review | 4 | 3, 6, 10 | Chip vs panel contradiction (COL-01) |
| Comments | 6 | 3, 5, 10 | "Team only" inside client-review panel; Activity leak when reviews off (COL-09) |
| Presence | 5 | 5, 10 | Nothing in production; disabled teaser (COL-14) |
| Activity | 3 | 3, 4, 6, 8, 10 | Dead-end edit rows; no review/publish/content events (COL-03/04) |
| History | 5 | 4, 6 | Local + server under one name; save pill lands on empty list (COL-10) |
| Notifications | 4 | 6, 9, 10 | "View all activity" opens wrong dataset; no client events (COL-04/05) |
| Share / Invite | 4 | 1, 3, 5, 9 | Three doors, three names, no ⌘K (COL-06/07) |
| Publish | 6 | 6 | "Publish anyway" beside "Waiting"; three verbs (COL-02/12) |
| Topbar | 5 | 6, 11 | Two look-alike chips; status only in tooltips (COL-15) |

## 3. Findings

| ID | Sev | Lenses | Finding | Evidence | Prior |
|---|---|---|---|---|---|
| COL-01 | P1 | 6/10/3 | **One review round tells four stories**: chip "Waiting" (tooltip "Sent to your client — waiting on approval") vs panel "Not sent yet" + "Invite a client…" + ⋯ "Re-send review link" vs dashboard "Awaiting sign-off". Server marks any PENDING round `pending`, including internal rounds with no `invitedEmail`. | `server/services/review.service.ts:276`; `shell/StudioHeader.tsx:173-176`; `review/ReviewTab.tsx:140-155, 443-447, 1198`; c01, c03, c05, c30, d07 | STILL TRUE (A07-15), now live |
| COL-02 | P1 | 6/11 | **Filled primary "Publish anyway" next to "Waiting"**. "Anyway" = 5 open errors, reads as "don't wait for reviewer". When approval is optional a pending round never affects the CTA, and publish gives no open-round warning. Tooltip "Not live yet." | `shell/lifecycle.ts:252-258, 410-416`; `chrome-ui/Topbar.tsx:420-430`; c01, c02 | NEW |
| COL-03 | P1 | 8/10/4 | Activity "Updated N settings" rows open History › Session → "No undo history". | `activity/ActivityTab.tsx:33-37`; `activity-log.service.ts:147-160`; c10, c20 | CHANGED (FB-2 backend fixed) |
| COL-04 | P1 | 10/5 | `ActivityAction` has no submitted/approved/changes-requested/comment actions; client resolve + client comment write no activity and no in-app notification. | `activity-log.service.ts:5-23`; `client-review.service.ts:281, 327-388, 405`; c07, c10 | STILL TRUE (A07-16; A-20 partial) |
| COL-05 | P1 | 3/6/10 | Bell "View all activity ›" → Activity log (prop at `StudioHeader.tsx:950`), not `/dashboard/notifications` as the code comment says. Empty state has no door. Editor bell empty while dashboard showed 2 unread. | `NotificationPanel.tsx:181-192, 273-275, 350-369`; c07, d01, d05. Empty-bell cause unverified (possibly null `siteId`) | NEW |
| COL-06 | P1 | 3/5/9/4 | Three share doors. Modal titled "Share preview of Home" but URL has no `?page=`; opening creates a link if none reusable; can't manage links; ⌘K "share" finds nothing. | `PreviewShareModal.tsx:68-83, 111, 141`; `site-header.tsx:162-166`; c12, c16, d03 | STILL TRUE (FB-7) + NEW |
| COL-07 | P2 | 1/2/9 | ⋯ "COLLABORATE" holds only disabled "Start collaboration · PLANNED" (+ "Unpublish…" once live). Share under THIS SITE; Invite under LEAVES THE EDITOR. | `shell/SiteMenu.tsx:184-256`; c08 | NEW |
| COL-08 | P1 | 3/6 | Dashboard "Send for review" (note only, offered while a round is pending) vs editor "Invite a client…" → modal titled "Send for review", client email optional. | `site-header.tsx:128-131`; `send-review-modal.tsx:53`; `ReviewTab.tsx:1198`; c32, d01 | STILL TRUE (A07-15 / PD-8) |
| COL-09 | P2 | 3/10 | Reviews off: Activity still lists comment rows; clicking opens `review` which TabRouter renders null (blank column, code-read). Composer says "team only" inside client-review panel. No ⌘K comments row. | `TabRouter.tsx:235-239`; `ReviewTab.tsx:1087`; `useEditorShortcuts.ts:117-123` | CHANGED (A07-7 gating fixed) |
| COL-10 | P2 | 6/8/4 | Save pill settled label "History ›" ("Saved" only in tooltip); opens empty Session saying "Ctrl+Z" on Mac. Saves rows print time twice; nested labels ("Before restoring "Before restoring…"). | `chrome-ui/SaveStatus.tsx:115-118`; `HistoryTab.tsx:126-129`; c04, c14 | NEW |
| COL-11 | P2 | SSOT | History Saves "APPROVED" band reads review status on its own and counts "changes since approval" from local undo stack (empty after reload); can contradict chip "Approved · edited since". | `history/components/SavesChrome.tsx:79-100` (code) | NEW |
| COL-12 | P2 | 3/6/5 | "Publish anyway" / "Publish to production" / "Publish"; panel reachable only by U, ⌘K, or "Unpublish…". | `PublishTab.tsx:1034`; c13 | STILL TRUE (FB-6) + NEW verbs |
| COL-13 | P2 | 5/9 | ⌘K puts "Open History" under TOOLS, other panels under NAVIGATE; "Clear history" clears undo but reads like History panel; no rows for comments/share/invite/notifications/collab. | `shell/modals/CommandPalette.tsx:279`; run2.log | NEW |
| COL-14 | P2 | 10/5 | No awareness of other editors in production. | `StudioHeader.tsx:304-308, 851-866`; c08 | STILL TRUE (A07-14 / A-21) |
| COL-15 | P2 | 11/6 | "● History ›" and "● Waiting ›" same shape, different meanings, meaning in tooltips; bar = 3 status signals + 6 doors. | `chrome-ui/Topbar.tsx:327-340`; c01, c03 | NEW |
| COL-16 | P2 | 8 | "Locate ›" stacks a "Comment located" band above Review header — two headers, two closes. | `ReviewTab.tsx:201-204`; c31 | CHANGED (FA-1) |
| COL-17 | P3 | a11y | Review ⋯ button has no accessible name. | run3.log; c30 | NEW |
| COL-18 | P2 | 3/10 | Dashboard site "Recent Activity", `/dashboard/activity` and editor Activity use different filters/wording (×17 vs · 17 times), same gaps. | d01, d04, c10 | STILL TRUE (FB-2 "one log or two") |

## 4. Prior-audit reconciliation
- **Fixed:** A07-1 / S-6; A07-6 / A-2; A07-8 / A-9; A07-7 gating (code); A07-18 (tabs All / Unread / Account & billing); FB-3 (`TabRouter.tsx:239`, `reviewChip` null, `tabsConfig.ts:357-372`); FB-2 backend (`server/trpc/routers/activity.ts`); A07-19 / FC-9 per fix report X-8 (not re-walked).
- **Guarded, not fixed:** collab transport/OT (A07-2…5, 9-13; A16-2…15) — routes 404 while flag off (S-12); engine rework C-5 not done.
- **Still true:** A07-14, A07-15 (now live), A07-16, A07-23, FB-6, FB-7, FB-2 overlap half.
- **Changed:** A07-17 partial (stale publish → 409); A07-21 (Activity own panel; undo list = History › Session); FC-8 (one derivation drives CTA + panel, but CTA hint uninformative — COL-02); FA-1 (panels replace each other; Locate still stacks — COL-16).

## 5. Not verified
Reviews-off workspace (COL-09 + A07-7/FB-3 gating code-read); approval-required workspace (lifecycle "Send for review",
"Open feedback", disabled Publish; COL-11); any Publish (errors-confirm, stale-approval, gate dialogs code-read); any
send/re-send/withdraw/revoke/invite (invite modal opened + cancelled); client `/review/<token>`; empty editor bell
cause (DB not checked); collab flag on, viewer role, multi-user; dashboard "Share draft" modal; Figma comparison.
`/sites/[id]/feedback` = form submissions, not review feedback.
