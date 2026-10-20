# L6 live results: collaboration, roles, a11y, interactions, AI

Lane L6 · code map `06-collab-roles-a11y-ix.md` §10 (22 checks) plus the assigned journeys.
Ran against `http://localhost:3300` (main @ df60cf9ec), Chromium at 1440×900, on site `audit1014-L6` (`cmv7v827o0017i7dbmkni4fbu`) in workspace "E2E Blank WS 0a95fc", with `agency_layer` ON.
Evidence is in `live/L6/ev/` and the scripts are in `live/L6/` (`daemon.mjs` is a multi-role browser daemon; `fixtures.mjs` and `siteb.mjs` handle DB fixtures).
Nothing was published. Publish dialogs were opened and then cancelled with Escape; no `publish` mutation appears in the network logs.

## Summary

| Verdict | Count | IDs |
|---|---|---|
| CONFIRMED | 15 | 1, 2, 3, 4, 5 (works as expected), 8, 10, 11, 12, 14, 15, 16, 19, 20, 22 |
| PARTIAL | 3 | 6, 9, 21 |
| NOT REPRODUCED | 3 | 7, 17 (Chromium), 18 |
| BLOCKED | 1 | 13 (plus the WebKit half of 17) |

Requested new defects: D-1 is **CONFIRMED**. D-3 is **PARTIAL**: in Brand, Backspace/Delete do nothing, ⌘Z leaks, and Escape is fine. The ⌘Z leak has a different root cause and also affects Settings. D-4 is **CONFIRMED**. D-7(a)(b)(c)(d) are **CONFIRMED**. D-11 is **CONFIRMED** for History and **PARTIAL** for the aria-disabled controls.

This run also found 14 new issues (N1–N14). The most serious are N1 (every AI prompt fails with HTTP 431, which the UI reports as "service didn't respond"), N2 (a global ⌘Z handler undoes canvas history behind full-page tools), N3 (a keyboard trap on the footer Zoom control) and N4 (every internal comment is credited to "You").

## Check table (§10)

| # | ID / claim | Steps run | Measured | Verdict | Evidence |
|---|---|---|---|---|---|
| 1 | D-1 Interaction Preview never plays | OWNER selects H2 "Our menu" › Behaviour › + Add interaction › On hover › clicks the **interaction's** Preview (scoped to `inspector-section-interactions`). Then each of the 10 Easing options, plus a fresh "On click" interaction with Bounce. | `el.style.animation === ""` straight after every click. `getAnimations().length` was 0 at 0 ms and at 50 ms, and `animationName` stayed `none`, for all 10 easings, the default `easeOut` and Bounce. Control: setting `bd-anim-fadeIn 300ms ease-out …` directly gives 1 running animation `bd-anim-fadeIn`. So the shorthand is dropped because the easing token is invalid. (My first probe picked up the topbar Preview button by mistake; it was discarded and re-run.) | CONFIRMED | `ev/d1-after-hover.png`, `ix-list.png` |
| 2 | D-1 Easing select default | Read the Easing `<select>` on a fresh interaction | Stored easing is `"easeOut"`, but `select.value` is `""` and the select displays "Select…". No option has the value `easeOut`. | CONFIRMED | `ev/d1-after-hover.png` |
| 3 | CI-02 editor runtime never started | Hovered the H2 that has a hover/fadeIn interaction; sampled 6× at 60 ms | opacity stays 1, transform `none`, no inline opacity/transform, `getAnimations()` 0, no `window.gsap`. `window.__composer` doesn't exist, so `isPreviewMode()` couldn't be read. | CONFIRMED (behavioural) | — |
| 4 | Preview overlay plays no interactions | Topbar Preview › hovered and clicked the H2 inside `iframe[title="Site preview"]` | `sandbox="allow-same-origin"` with 0 `<script>`. The `data-buildrick-interactions` attribute is present, but `contentDocument.getAnimations()` is 0 after hover and after click. | CONFIRMED | `ev/preview-overlay-click.png` |
| 5 | Published (exported) interactions play | Site menu › Export site… › Export as HTML; opened the file in Chromium | 1 animation on load (scroll-into-view). Hover adds a running WAAPI animation (`cubic-bezier(0.075,0.82,0.165,1)`, i.e. circ.out mapped). Click runs a 300 ms animation. No page errors. | CONFIRMED (works; no defect) | `ev/export-index.html` |
| 6 | D-3 Brand doesn't suspend canvas shortcuts | Selected "Grid Item 3"; opened Brand from the rail; focused the "Colours" button; pressed Backspace, Delete, ⌘D, ArrowRight, ⌘Z. Control: Backspace on the canvas. | `brand-host` has **no `data-bk-surface`** (confirmed). Backspace, Delete and ⌘D are `preventDefault`-ed by CommandCenter, but node count stays 82 and nothing is deleted or duplicated; the canvas selection tag and breadcrumb are empty while Brand is open. Control on the canvas: Backspace deletes (82→81, toast "Container deleted"). **⌘Z in Brand undid canvas history** (toast "Undo: Changed interactions"). **⌘Z in Settings did too** (Settings has `data-bk-surface="fullpage"`), which dropped the H2's interactions from 3 to 2. Root cause: `useEditorShortcuts.ts:188` calls `composer.history.undo()` with only an `isModalOpen()` and text-field guard, with no full-page guard (see N2). | PARTIAL: the delete leak isn't reproduced, the undo leak is confirmed and is wider than claimed | `ev/d3-after-keys.png`, `d3-back-on-canvas.png` |
| 7 | D-3 Escape leaves Brand and deselects | Selected Grid Item 3 › Brand › focused Colours › Escape | Brand closes. Back on the canvas, the selection tag is "Container" and the breadcrumb is "Home › Grid › Container", so the element is still selected. | NOT REPRODUCED | `ev/d3-escape.png` |
| 8 | UX-22 full-page focus isolation | Opened Settings, Brand, Assets (Manage assets) and Templates (⌘K "Browse Templates"); logged focus on open; pressed Tab 45–60×; closed; logged focus again | Focus on open is BODY or the rail button, never inside the host. Tab presses that landed outside the host: Settings 11/45, Brand 19/60, Assets 18/50, Templates 19/50. They reached the header (‹ Exit, History, Review, Comments, Notifications, Preview, Publish, Site menu), the rail and Skip to Canvas. The header, `.bk-header` and rail all have `inert=false` and no `aria-hidden`. Focus after close is always BODY, never the opener. `data-bk-surface`: set-host, mgr-host and tpl-host are `fullpage`; brand-host is null. | CONFIRMED | `ev/ux22-*.png` |
| 9 | RR-04 viewer Review door | Opened as VIEWER | Redirected to `?view=readonly`. The rail has no Review tab and the topbar has no Comments toggle; pressing `C` does nothing. `reviews.status` 403, `reviews.currentRound` 403, `comments.list` 200 `[]`. ⌘K "Review" returns **no rows**, so the ReviewTab error state couldn't be reached. | PARTIAL: hidden door confirmed; error state unreachable | `ev/viewer-open.png` |
| 10 | Viewer can comment via the server | VIEWER `POST comments.create` | 200, comment created with `authorId` = viewer. The UI offers viewers no comment door. | CONFIRMED | — |
| 11 | D-4 capped admin approves | ADMIN with `SitePermission.roleOverride=VIEWER` on L6. `sites.myRole` returns VIEWER and the editor opens read-only. Called `reviews.resolve({id:<L6 PENDING round sent by EDITOR>, status:"APPROVED"})`. | 200; DB shows `status APPROVED`, `resolvedById` = capped admin. Afterwards the topbar chip reads "Approved ›" and the Publish dialog says "Approval: Approved by the client on Oct 14" (see N5). Done via the API; the dashboard review-queue UI was not walked. | CONFIRMED | `ev/cappedadmin-editor.png`, `designer-publish-surface.png` |
| 12 | RR-01 cross-site revoke | Created site `audit1014-L6b` in the same workspace with a PENDING review. As the EDITOR (scoped to L6 only; `sites.myRole` on L6b returns 403 "You don't have access to this site"), called `reviews.revoke({siteId:L6, reviewId:<L6b review>, expectedRevision})`. | `200 {"revoked":true}`; DB shows the L6b review with `revokedAt` set. | CONFIRMED (security) | — |
| 13 | RR-02 AI publish freshness | — | AI can't run at all (N1: 431), and this lane isn't authorised to publish. | BLOCKED | — |
| 14 | D-7(b) template permission copy | EDITOR: ⌘K › Permissions, then ⌘K › Browse Templates › Minimal › Create page | The modal says "Apply a template **Allowed**". The button is enabled; clicking it gives the toast "Only an admin can apply a template", with no network call. DESIGNER and ADMIN modals also say Allowed. | CONFIRMED | `ev/editor-permissions.png`, `editor-template-apply.png` |
| 15 | D-7(a) invite copy | ADMIN `/dashboard/settings/team` › Invite | Viewer row reads "Read-only. Cannot open the editor." A VIEWER does open the editor read-only (check 9). | CONFIRMED | `ev/d7a-invite-modal.png` |
| 16 | D-11 disabled reasons | VIEWER › History › ⋯ menu; Saves › "+ Save a version"; Assets › Upload | "Clear undo history…" is native `disabled` with the reason only in `title` ("Viewers can't clear undo history — ask an editor"). ArrowDown cycles Search↔Time-Travel and skips it, and the AX tree shows `menuitem [disabled]` with no description. "+ Save a version" and Upload use `aria-disabled` + Tooltip: both are Tab-reachable and the tooltip appears on keyboard focus ("Viewers can't save a version…" / "View only — ask an editor to upload"), but neither has `aria-describedby`, so the AX node is just `button [disabled]` with no reason. "+ Save a version" is also styled in full accent blue, so it looks enabled. | CONFIRMED (History); PARTIAL (aria-disabled pattern: keyboard OK, SR reason missing) | `ev/viewer-history-menu.png`, `viewer-save-version-hover.png`, `viewer-assets-upload-focus.png` |
| 17 | D-13 dialog role with `display:contents` | ⌘K › Permissions; aria snapshot | The `role=dialog` element computes `display: contents` but is exposed in Chromium as `dialog "Permissions — signed in as OWNER"`, `aria-modal=true`. Tab trap: 25 Tabs never left the dialog. Escape closes it. WebKit isn't installed in the Playwright cache (`webkit-2311` missing). | NOT REPRODUCED (Chromium); BLOCKED (WebKit) | `ev/permissions-owner-aria.txt` |
| 18 | Focus ring in AI panel | AI failed state, real keyboard Tab | Close AI, Scope, Prompt, Try again and "Continue by hand…" all match `:focus-visible` with a `2px solid` outline. | NOT REPRODUCED | `ev/ai-focus-kbd.png` |
| 19 | D-15 role unknown → "Back to editing" | VIEWER with `sites.myRole` aborted (`page.route`), loaded `?view=readonly` | The topbar shows only "‹ Back to editing", Notifications and Site menu (no rail, no Preview or Publish). Clicking it navigates and lands back on `?view=readonly`. | CONFIRMED | `ev/d15-myrole-blocked.png` |
| 20 | Collab flag off | Topbar, ⌘K "collab", `/api/sse/collab/:id`, `POST /api/collab/:id/ops` | No Collaborate CTA in the topbar; ⌘K has 0 rows; SSE 404; ops 404. Not in the claim: the Site menu shows a disabled row "Start collaboration PLANNED" (`aria-disabled=true`, no reason). | CONFIRMED | — |
| 21 | AI states | OWNER selects H2 › "✦ AI" chip › "Make this heading bold" › Enter | The composer is present (the not-configured state isn't shown). The state goes to `ai-state-failed`: "The AI service didn't respond. Nothing changed…" with Try again and "Continue by hand". Real cause: `ai.streamPrompt` → **HTTP 431**. The subscription is a GET with a 16,855-character URL (the whole brand token list goes in the query). Undo-all and the lock-refusal checks couldn't run. | PARTIAL: failure UI is honest about "nothing changed" but misattributes the cause; Undo-all and lock BLOCKED | `ev/ai-after-prompt.png` |
| 22 | WS-04 GA "receiving data" | Posted 3 Buildrick beacon events (`/api/public/track/:id`). Settings › Analytics: entered `G-AAAAAAAAAA` › Check data is arriving. | Dialog: "**G-AAAAAAAAAA is receiving data.** 3 events arrived in the last 24 hours." Even before any ID was entered, the status pill read "RECEIVING DATA" with GA disabled and an empty ID. Changes were discarded afterwards and the events deleted. | CONFIRMED | `ev/ws04-analytics.png`, `ws04-dialog.png` |

## Role journeys

Fixtures were created directly in the local DB (see Cleanup). Effective roles were confirmed with `sites.myRole`.

| Action | VIEWER | EDITOR (site-scoped to L6) | DESIGNER | ADMIN | ADMIN capped to VIEWER |
|---|---|---|---|---|---|
| Editor entry | redirected to `?view=readonly`; inspector replaced by ViewerRoleNotice ("Workspace role: Viewer") | full editor | full | full | `?view=readonly`; notice says "**Workspace role: Viewer**" though the workspace role is ADMIN (D-16 confirmed) |
| Rail | Add, Layers, Pages, Assets, CMS, Brand, History, Activity. Add/Pages/CMS/Brand look enabled; clicking shows the toast "View only — adding, pages, CMS and brand edits need an Editor role." and stays on Layers (N6). | Add, Layers, Pages, Assets, CMS, Brand | same | same | same as viewer |
| Topbar | Exit, Notifications, Preview, Publish `aria-disabled`, Site menu (no Review, no Comments) | + History, Review, Comments, Publish | + "Approved ›" chip | same | as viewer |
| Edit text/style/add | inspector hidden; the canvas showed no edit affordance | allowed (not exhaustively exercised) | allowed | allowed | read-only |
| Pages / CMS / Brand | toast after click (enabled-then-refuse) | — | — | — | — |
| Templates apply | modal: "Viewers cannot apply templates" | modal says Allowed; click gives toast "Only an admin can apply a template" (D-7b) | modal Allowed | modal Allowed (apply not executed) | — |
| Settings | — | not walked | — | — | — |
| Publish | `aria-disabled`, no reason seen | opens confirm | confirm says "Approved by the client on Oct 14" (N5); cancelled | same; cancelled | disabled |
| Comments | no door; API create succeeds (check 10) | `C`/toggle → click H2 → "New comment" dialog (focus in textarea) → Post → toast "Comment pinned…" → `comments.create` 200 | — | — | — |
| Review | hidden; ⌘K has no row | Review panel: Locate › selects the H2; Resolve moves the comment to RESOLVED (`comments.resolve` 200); Send for review (internal) → round 1 PENDING; composer reply = a flat new comment, no thread. Every comment is credited to "You" (N4). | — | — | approved via API (D-4) |
| History | opens; "+ Save a version" aria-disabled + tooltip; "Clear undo history…" disabled + title only (D-11); empty state tells a viewer "Use ⌘Z to undo changes" | not walked | — | — | — |
| Activity | lists "Commented: …"; clicking the row opens nothing and the right column reverts to the notice (N7) | — | — | — | — |
| Notifications | `role=dialog`, non-modal, "You're all caught up"; Escape closes and focus stays on the bell | — | — | — | — |

Interactions journey (OWNER): added hover (fadeIn), click (bounce) and scroll-into-view (fadeIn). The list shows three rows. Inspector Preview is dead (D-1), the canvas never runs them (CI-02) and the Preview overlay never runs them (check 4). The exported HTML runs them. After a reload, hover and click had persisted; scroll-into-view had been removed by the ⌘Z-in-Settings leak (N2).

Keyboard-only pass:
- The header Tab order is logical, with 2px `#1A56DB` focus rings.
- The modals (Permissions, New comment, Send for review) take focus and trap Tab. Escape closes them. Viewer Permissions returns focus to its opener.
- Full-page tools and the Preview overlay don't take focus, don't contain it and don't return it (check 8, N8).
- In the canvas, Tab cycles element selection with live announcements, and F6 exits. On the footer Zoom control, the same cycling becomes a trap (N3).

## New findings

| ID | Sev | Finding | Steps / measurement | Evidence |
|---|---|---|---|---|
| N1 | P1 | **Every AI prompt fails with HTTP 431, reported as "The AI service didn't respond."** `ai.streamPrompt` is a GET subscription whose `input` carries the scope context plus every brand token. | On L6 the URL is 16,855 chars (cookie 853 B), and the response is 431 Request Header Fields Too Large. Try again repeats it. The UI blames service availability, so any site with a real token set can't use AI. | `ev/ai-after-prompt.png` |
| N2 | P1 | **Global ⌘Z / ⇧⌘Z undo canvas history behind full-page tools.** `useEditorShortcuts.ts:184-193` has no full-page guard, unlike `CommandCenter.shouldHandleShortcut`. | In Settings (which has `data-bk-surface=fullpage`), focus on a button, ⌘Z → toast "Undo: Changed interactions" and the H2's interactions go 3→2, silently, behind the Settings page. Same in Brand. | `ev/d3-after-keys.png` |
| N3 | P1 a11y | **Keyboard trap on the footer "Zoom 100%" button.** It sits inside the canvas wrapper (`tabindex=0`, `data-bk-toast-anchor`), whose `useCanvasKeyboard` Tab handler `preventDefault`s and cycles element selection. | With focus on Zoom: 8× Tab and 4× Shift+Tab all keep focus on "Zoom 100%" while the selection cycles Text→Container→Section→Heading. Only F6 escapes (WCAG 2.1.2). | `ev/canvas-focus.png` |
| N4 | P2 | **Every internal comment is credited to "You".** | A VIEWER posted a comment, then the EDITOR posted one. The EDITOR's panel and the OWNER's panel both show "You · General" on both comments. | `ev/editor-review-tab.png`, `owner-review-attribution.png` |
| N5 | P2 | **The publish confirm calls an internal approval a client approval.** | The round was approved via `reviews.resolve` by the capped admin (no client involved). DESIGNER and ADMIN Publish dialogs say "Approval: Approved by the client on Oct 14." | `ev/designer-publish-surface.png` |
| N6 | P3 | Viewer rail shows Add/Pages/CMS/Brand as enabled tabs that only toast after click. This contradicts the `VIEWER_TABS` claim in the code map and the "every unavailable action explains" modal pattern. | Click any of them → toast, and the drawer stays on Layers. | `ev/viewer-tab-*.png` |
| N7 | P3 | Viewer Activity › comment row is a dead door. | Clicking "Commented: …" makes no network call and shows no panel; the right column reverts to the ViewerRoleNotice. | `ev/viewer-activity-open-comment.png` |
| N8 | P2 a11y | Preview overlay is `role="region"` with no `aria-modal`. Focus isn't moved in (BODY) or returned (BODY), and Tab reaches covered chrome (15/15 stops outside). Escape does nothing while focus is inside the iframe; it works once focus is on the parent document. | Topbar Preview opened via keyboard Enter. | `ev/preview-overlay.png` |
| N9 | P3 a11y | Review comment row is a `div role="button" tabindex=0` containing the buttons Resolve, Copy link and Locate (nested interactive). Its accessible name is the whole row text, including the button labels. | aria snapshot of `review-comment-row-1`. | — |
| N10 | P3 | After a reload the Review panel shows a "RESOLVED" group header with nothing under it. Resolved comments are session-only, but the header is still drawn. | OWNER reload › Review. | `ev/owner-review-attribution.png` |
| N11 | P3 | Internal "Send for review" (no client email) shows "Creating review link…" and no success toast. | EDITOR, client email blank. | `ev/editor-review-sent.png` |
| N12 | P3 a11y | aria-disabled controls with a reason (Save a version, Upload) have no `aria-describedby`, so screen readers never hear the reason. "+ Save a version" also stays full accent colour while disabled. | See check 16. | — |
| N13 | P3 | Viewer History empty state tells a viewer "Use ⌘Z to undo changes" (undo is refused for viewers). | — | `ev/viewer-history.png` |
| N14 | P3 a11y | Assets manager "Search all assets" input shows `outline: none` and no box-shadow on keyboard focus; it may only change its border (not verified visually). | Tab walk inside mgr-host. | `ev/ux22-assets.png` |

## Not verified

- **RR-02 / check 13**: AI is broken by N1 and this lane may not publish.
- **AI Undo-all and AI lock refusal (check 21)**: no AI run can complete.
- **ReviewTab error state for viewers (check 9)**: no door exists, not even through ⌘K.
- **WebKit AX for `display:contents` (check 17)**: the WebKit browser isn't installed. I didn't install it.
- **Dashboard review queue UI** for D-4: reproduced via the tRPC call only.
- **The `C` shortcut and arrow nudge behind full-page tools**: N2 measured only ⌘Z.
- **1280×720**: not run; every check was at 1440×900.
- **Client `/review/<token>` page, agency screens, notification delivery**: not walked.
- **EDITOR/DESIGNER Settings, CMS, history restore**: not exercised in depth. History restore wasn't attempted for any role.
- **InteractionEditor target/reverse/loop**: the controls I saw were Animation, Duration, Delay, Easing, Preview, Disable and Delete.

## Fixtures and cleanup (verified)

**What I created:**
- Users `audit1014-{viewer,editor,designer,admin,cappedadmin}@buildrik.local`, all ACTIVE members of `cmpa9oi4n0001wrjuvh7j2h8m`:
  - VIEWER
  - EDITOR, plus SitePermission EDITOR on L6 (scoped)
  - DESIGNER
  - ADMIN
  - ADMIN, plus SitePermission roleOverride VIEWER on L6
- Site `audit1014-L6b` with one review.
- 3 analytics events on L6.
- Comments and a review round on L6.

**What I deleted:** all of the above, through `fixtures.mjs delete`, `siteb.mjs delete` and an analytics `deleteMany`. Checks afterwards: 0 L6 users left, 0 L6 memberships, 0 L6 site permissions, the L6b site count is 0, and 3 analytics rows were removed.

**Incident:** my delete matched on the `audit1014` email prefix, so it also removed lane L5's user `cmv7y5eo00000r9mvvljca2g9` (`audit1014-l5-editor@buildrik.local`) and its membership. I recreated it with the same id and email and an ACTIVE **EDITOR** membership in the same workspace. The role is my guess from L5's `auth-editor.json`; I don't know its original role or any site override. After the restore, L5's stored session returns `sites.myRole` = EDITOR on L5's site with 200. **L5 should confirm its fixture is right.**

**Left on L6:**
- The "Our menu" H2 keeps two interactions (hover fadeIn with easing `circ.out`, click bounce).
- The Settings analytics change was discarded.
