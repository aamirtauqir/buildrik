# 93 · Gap walk: every door, every role (Phase 2b, G1–G3 + G5)

Date 2026-09-26. App `http://192.168.100.5:3100` (checkout `buildrik-af-verify`, HEAD `2e9a76bff`), DB `buildrik_verify`, headless Chromium 1440×900, one browser at a time. **G4 was not done here.** Fixes belong to the fix lane, so this report has no fix commits and no "after" column. The owner-decision list is in [owner-decisions.md](owner-decisions.md).

- Door inventory (G1): [`doors.json`](doors.json) has 272 doors, 188 in the editor and 84 in the dashboard. It was built by hand from code, and every row cites `file:line`, the handler and the expected destination. The source is `scripts/audit/verify/gap-walk/doors.mjs`, and `gen-doors.mjs` regenerates the JSON.
- Walker (G2): `scripts/audit/verify/gap-walk/walk.mjs <role> <s1|s2|s3> <editor|dash>`. Raw results are in `…/gap-walk/results/*.jsonl`. `aggregate.mjs` + `overrides.json` produce the final classes (`final.json`).
- Screenshots: `verify/shots/gap-<door>-<role>[-s2|-s3].png`. There is one for each non-ok door and one sample per surface (192 files).

## Method (and what "ok" means)

For each door the walker did the following:
1. Load the start state. For letter-key doors this is a fresh editor load, because the key's result depends on state.
2. Run the reach steps.
3. Take a DOM snapshot (URL, visible `data-testid`s, dialogs/menus, drawer title, body lines, canvas element count).
4. Click or press the door and snapshot again.
5. Check the door's expectation. The checks are: a named testid or drawer title, a dialog, a URL, a new tab, a toast, or a canvas element delta for inserts.
6. Try the way back (Esc, the door's own ✕ / Back to canvas, or browser Back). If the first way back fails, it tries any visible close/back control. A door only counts as `no-return` when nothing brings you back.

It logged console errors, page errors and every HTTP status ≥ 400. Mutating doors were handled in one of three ways:
- Undone with ⌘Z. The walker checked the element count went back each time, and every undo reported "restored".
- Opened to the confirm and then cancelled.
- Server request aborted at the network layer (delete, duplicate, archive, transfer, publish, unpublish, notifications read).

Rules for the read-only and out-of-scope roles:
- **Withheld is ok.** For a VIEWER, or a scoped EDITOR on S2, a write door that is hidden, disabled, or answers "View only — … need an Editor role" counts as `ok`.
- **Role-leak was tested on the server.** The VIEWER walk opened 30 dashboard write doors. For each kind of write behind them I called the real tRPC mutation as that role (`leak.mjs`): rename, archive, folder create, redirect create, workspace update, plus a scoped rename of S2. **Every call returned 403.** No probe row was created. Delete (OWNER) and transfer (OWNER) were checked in code (`sites.ts:176`, `sites.ts:252`) and not called. By this report's definition ("a write control that works"), there is **no role-leak**. Those doors are counted `ok` but tagged *offered-then-refused*; see OD-GW-1.

Harness settings, so the walk measures doors rather than overlays:
- The Next dev overlay is hidden.
- The first-use Add tip is marked as seen.
- The persisted `buildrik-panel-state` and `buildrik-inspector-shown` are cleared on each load. Otherwise one door's panel reopens on the next load (A04-13) and covers the canvas.

Several first-pass "dead" readings were the harness, not the product (Next compiling routes on first load, a stale filter state, submenu hover timing, and the inspector hidden by an earlier door). They were re-walked before being classified.

Figma cross-check: `flow-check.md` exists at `buildrik-audit-fix/.superpowers/sdd/2026-09-25-audit-fix/flow-check.md`, and was used. Its 45 edges that name a door are attached to those doors (`figma` field in doors.json), and all 45 were walked. Four of them have changed since that pass:
- Activity used to show "isn't in the editor yet". It is now a real panel.
- Duplicate site now has a confirm.
- Export now has Preparing/Ready states.
- Share-in-Preview is no longer drawn under the iframe.

`boards.json` (page 4418:45431 manifest) has no 4418 rows yet, so I could not do a per-board missing-screen check against it. See "Not walked".

## Counts by class (after G2/G3; "before" and "after" are the same because G4 is a separate lane)

| role | ok | dead | wrong-destination | no-return | error | missing-screen | role-leak | n/a | not-walked | total |
|---|---|---|---|---|---|---|---|---|---|---|
| OWNER (S1) | 252 | 2 | 1 | 1 | 2 | 0 | 0 | 14 | 0 | 272 |
| EDITOR (S1) | 249 | 2 | 3 | 1 | 2 | 0 | 0 | 15 | 0 | 272 |
| VIEWER (S1) | 199 | 2 | 2 | 0 | 0 | 0 | 0 | 69 | 0 | 272 |
| scoped EDITOR on S1 | 248 | 2 | 3 | 1 | 2 | 0 | 0 | 16 | 0 | 272 |
| scoped EDITOR on S2 (out of scope) | 11 | 0 | 1 | 0 | 0 | 0 | 0 | 6 | 0 | 18 |
| OWNER on S3 (review layer on) | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 6 |

How to read the table:
- **VIEWER `ok` = 199.** That is 97 correctly withheld write doors (13 of them show the View-only notice), 28 dashboard doors that are offered and then refused by the server, and 74 read doors that work.
- **`n/a` means gated off for this workspace or state, not a failure.** It covers the review layer off (Comments, Review chip, R, C, ⌘K Review), the agency layer off (Agency sidebar + 5 tabs), viewer-only rail buttons for other roles, "Replace with block…" on a non-section, an empty notification list, and view mode offering no palette or site-menu rows by design.
- **Scoped on S2 is correctly denied everywhere.** `sites.list` returns only S1, and the site detail says "Site not found … or you don't have access". The one non-ok row is the editor route's generic 404.

## Every non-ok door

| # | door (id) | roles | class | evidence | repro | suggested fix | size |
|---|---|---|---|---|---|---|---|
| 1 | Letter shortcut for a right-column panel after Esc (`key-H-after-esc`) | owner, editor, viewer, scoped | dead | `gap-key-H-after-esc-owner.png`; `probe.mjs` shows u→Esc→h gives no panel, `ESC=0` works, and a fresh H works | Load editor, press U (Publish panel opens), press Esc, press H: nothing opens. The same happens for any right-column letter (U/H/R) after Esc closes one. | The rail-letter handler (`useSidebarKeyboard` → `setLeftPanelTab`) must reopen the column when the tab is active-but-closed, the way ⌃H already does | S |
| 2 | History pill / H / U with the inspector hidden (`insp-hidden-history`) | owner, editor, scoped | dead | `gap-history-with-inspector-hidden-owner.png`; `history-panel` mounts with width 0 (`probe4.mjs`) | Select element → inspector ⋯ → Hide inspector → click History ›. The panel opens into a 0-px column. Publish/Review/Activity do the same. | Opening any `RIGHT_COLUMN_TABS` panel forces `inspectorShown = true`, exactly as the AI door already does (`StudioPanels.tsx:539`) | S |
| 3 | Inspector ⋯ → Hide inspector (`insp-menu-hide-inspector`) | owner, editor, scoped | no-return | `gap-insp-menu-hide-inspector-owner.png` (after reload: no inspector, no toggle anywhere) | Hide inspector, then reload. It stays hidden (`localStorage buildrick-inspector-shown=false`). The only ways back are typing "Toggle inspector" into ⌘K, or ⌘J. | A visible "Show inspector" affordance (right-edge tab or footer button). Optionally do not persist the hidden state across reloads | S |
| 4 | Canvas ⋯ / right-click → Bind to CMS field… (`ctx-bindtocmsfield`) | owner, editor, scoped | wrong-destination | `gap-ctx-bindtocmsfield-owner.png` (CMS workspace, "Select a collection", canvas covered) | Select a heading → right-click → Bind to CMS field…. The CMS workspace opens on the collection list and hides the element being bound. There is no field picker. | Route to Inspector › Settings › the Collection/binding section of the selected element (open inspector, switch tab, scroll). No server change | M |
| 5 | Layers row ⋯ → Copy link (`ly-copy-link`) | owner, editor, scoped | error | uncaught `TypeError: Cannot read properties of undefined (reading 'writeText')` (pageerror) | Layers → right-click a row → Copy link, on a non-secure origin (http LAN). Pages ⋯ Copy link on the same origin handles it with a toast. | One guarded copy helper (`navigator.clipboard?.writeText` + the Pages menu's "Couldn't copy" toast). Production over https is probably unaffected | S |
| 6 | History › Published tab (`hi-tab-published`) | owner, editor, scoped | error (console) | `gap-hi-tab-published-owner.png`; console "In HTML, `<div>` cannot be a descendant of `<p>` … hydration error" (LayoutShell.Inspector) | History › → Published | Make the empty-state `<p>` wrapper a `<div>` (or the inner `<div>` a `<span>`) | S |
| 7 | Topbar search field in view mode (`tb-search`) | viewer | dead | `gap-tb-search-viewer.png` | Open the editor as VIEWER (`?view=readonly`) and click "Search pages, layers, assets… ⌘K". Nothing happens, because the palette refuses in readOnlyView (`StudioHeader.tsx:343,365`) | Hide the field in view mode (smallest). The alternative, opening the palette with the viewer rows `CommandPalette` already filters, is OD-GW-3 | S |
| 8 | Home › Quick actions › Invite teammate (`dh-invite`) | editor, scoped, viewer | wrong-destination | `gap-dh-invite-editor.png` ("Team is admin-only"; `team.*` 403) | Log in as EDITOR → /dashboard → Invite teammate | Hide the quick action for non-admins. The editor site menu's "Invite teammates ↗" is the same door | S |
| 9 | Sites ⋯ → Transfer Site (`dp-more-transfer`) | editor, scoped, viewer | wrong-destination | `gap-dp-more-transfer-editor.png` (empty member select; `team.list` 403; server is OWNER-only, `sites.ts:252`) | Log in as EDITOR → Sites → ⋯ on Verify Site One → Transfer Site | Render Transfer only for the site owner | S |
| 10 | `/edit/<S2>` as the S1-scoped EDITOR (`editor-load`, scoped-S2) | scoped (out of scope) | wrong-destination | `gap-editor-load-scoped-s2.png` (generic "404 · Page Not Found") | Log in as scoped@ → open `/edit/<S2 id>` | Show the no-access state (same copy as site detail: "you don't have access"). Access itself is correctly denied | S |

## Small fixes for the fix lane (S/M, no new server contract)

1. **#1 letter-after-Esc.** Reopen the right column when the letter's tab is the active-but-closed tab. Add a regression test for the u → Esc → h sequence.
2. **#2 right-column panels force the inspector shown.** Reuse the AI door's `setInspectorShown(true)` + localStorage write.
3. **#3 visible way back from "Hide inspector".** Can land together with #2.
4. **#5 guarded clipboard in Layers Copy link.** Share it with the Pages menu's copy path so there is one helper.
5. **#6 `<p>`/`<div>` nesting** in the History Published empty state.
6. **#7 hide the topbar search in view mode.** If the owner prefers a viewer palette instead, see OD-GW-3.
7. **#8 hide "Invite teammate"** (Home quick action + editor site menu row) for non-admins.
8. **#9 Transfer only for the site owner** in the Sites ⋯ menu.
9. **#10 editor route access-denied state** for members without access to the site.
10. **#4 (M) Bind to CMS field…** should open the element's binding section instead of the CMS workspace.
11. *(optional, S)* The notifications empty state ("You're all caught up") drops the "View all activity ›" door. EDITOR, VIEWER and scoped users have no notifications, so they lose the popover's Activity door. The site menu and ⌘K still reach Activity.

## Found on the way (not doors)

- The `/api/sse/notifications` stream fails on every dashboard load (305×, `FAILED`). It may just be the dev server dropping the SSE connection; not investigated.
- Editor console noise on every load: "ResizeObserver loop completed" (41×, reported through `[Recovery] Runtime fault`) and a React warning about a style shorthand conflicting with a longhand (36×).
- A CMS collection named `t` (id `mui90nt2-lcnjq82`) appeared on S3 at 10:30 UTC. That was not during this walk (my S3 walk ran at about 13:37 UTC), so another lane probably created it. I left it in place.
- In the dashboard, ⋯ → Duplicate and ⋯ → Archive fire the request at once with no confirm. The editor's "Duplicate site" has one (board 4418:127239). See OD-GW-4.

## Doors not walked, and why

- **Destructive commits.** Delete site/account/workspace, Transfer, Publish, Unpublish, Duplicate, Archive and Apply template were opened to their confirm (or had their request aborted) and never committed, as the brief required.
- **Doors that need a published site.** Unpublish site…, View live site ↗ and Copy live URL (site menu), plus site-detail Unpublish. S1 is DRAFT; the rows are not rendered.
- **Review layer.** Comments, the Review chip, R, C and ⌘K Review were walked only as OWNER on S3 (Agency WS, review layer on). All 5 were ok. They were not walked as EDITOR, VIEWER or scoped, because only OWNER belongs to the agency workspace.
- **Agency sidebar + the 5 Agency tabs.** Gated off in Verify WS. They were not walked in Agency WS, because that needs switching the session's active workspace, which I avoided so as not to change session state.
- **Notification side effects.** "Mark all read" and notification row clicks were not clicked, because both would mark the owner's 9 unread notifications as read.
- **Account and workspace switching.** Logout and choosing a different workspace in the switcher were opened only.
- **Inner controls of panels and screens.** Walked at door level only, not every control inside: Publish panel Fix ›, Review ⋯, CMS records/fields, Assets upload/stock, Settings screen actions (Add domain…), Brand actions. flow-check.md covers many of these.
- **Canvas gestures.** Drag-reorder, drag-insert, inline text edit, multi-select Group/Ungroup, breakpoint switching.
- **Routes outside the door inventory.** `/onboarding/*`, `/auth/*`, the client pages `/review/<token>` and `/share/<token>`, and `/dashboard/templates/<id>` Use template (it creates a site).
- **Roles and widths not requested.** ADMIN, DESIGNER and outsider were not walked. Nothing was walked below 1440 px wide.
- **Missing-screen classification.** `boards.json` does not list the 4418:45431 v3 boards yet. Missing-screen could only be judged through the flow-check edges, and none of those is still missing. The board-level "unreachable" states in `boards.json` are states, not doors (Publish · not-connected, Issues · fixing / fix-failed, Components loading / load-error, Preview mobile device frame, Compare · resend-confirm, S1.3 new-page 3-way). They are listed for the owner in owner-decisions.md (OD-GW-5) and were not counted as doors.

## State restored

- **S1 page content and timestamps.** The Home `blocks` hash drifted after the ⌘Z sequences. It was restored from the pre-walk snapshot (`gap-walk/baseline/`). S1 Home, About and Contact `blocks`/`updatedAt` and the site's `lastEditedAt`/`updatedAt` now match the baseline, and table counts match (pages 14, versions 1, folders 0).
- **Nothing else was persisted.** No redirect, folder or site was created by the role probes (all returned 403). Notifications are untouched (9 unread). Auth `storageState` files were never rewritten, and browser contexts were ephemeral.
