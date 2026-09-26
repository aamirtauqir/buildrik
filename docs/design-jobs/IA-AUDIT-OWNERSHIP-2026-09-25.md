# Editor IA Ownership Audit — against `main` 6875289 (v0.4.0.0), re-checked on 92ff53f84, 2026-09-25

**Scope:** information architecture only. The questions are: where each feature lives (left drawer, right column, global chrome, full screen, modal, popover), which feature owns which job, and whether the module boundaries make sense. Visual styling, typography, accessibility, search quality, click targets and prototype bugs are out of scope. The audit is read-only; no product code was changed.

## How this audit got here

Earlier passes (v1 and v2) audited an older local snapshot of this repo. Every file they cited is different on `main`. Release **0.4.0.0, "Code-gap Oct 1 — Editor v3 to Figma"**, landed on 2026-09-24 and fixed most of v1/v2's P0s. So this version re-checked every earlier finding against `main` and rebuilt the placement matrix from `main`'s code. Findings that no longer hold are listed as fixed in §5, not repeated.

**Re-checked on `92ff53f84`** ("Code-gap round 2", #26, which landed after the audit and touched eight of the files behind open findings). All eight — FA-1, FB-1, FB-2, FB-3, FB-5, FB-7, FB-8, FC-6 — still hold there; the line numbers below are from `92ff53f84`.

**Evidence used:**

- **Code:** `packages/editor/src/editor/` at `6875289`. Every open finding cites file:line on `main`. The headline claims (the two "Settings" labels, the missing `activity` router, the right-column mechanisms, the Share title, "Bind to CMS field") were checked by hand. The rest were checked by adversarial verifiers told to disprove each claim.
- **v3 Figma, the source of truth (page `4418:45431`):** read through the committed inventory in `packages/editor/docs/audit-2026-09-21/02-figma-inventory.md` (1,098 live boards) and the gap matrix `03-gap-matrix.md` (459 rows, IDs `G1-…`, `G2-…`, `G3-…`). Row status comes from `packages/editor/docs/plans/2026-09-23-c5-ledger.md`. Owner rulings come from `2026-09-23-code-gap-oct1-completion.md` and `2026-09-14-editor-v3-ia.md` §16.
- **Live Figma could not be read:** the Figma connection in the auditing session belonged to an account without access to file `g4GzQFqzNYz5sosz1QtZXC`. Every v3 node ID below comes from the committed inventory, not from a fresh screenshot.
- **Nothing was run in a live app.** Findings marked *code-read* should be reproduced at 1440×900 before they are fixed.

---

## 1. Placement matrix on `main`

Paths are relative to `packages/editor/src/editor/`. `SP` = `shell/StudioPanels.tsx`, `AS` = `shell/AquibraStudio.tsx`.

| Feature | Renders | Scope | Entry points | v3 board | Match |
|---|---|---|---|---|---|
| Add (+ Generate a block) | LEFT drawer | page | rail, A, ⌘K, canvas "Replace with block…", empty canvas; generator: Add row, ⌘K, AI panel "Generate a block in Add ›" | `4428:140817`, `5946:51667` | ✓ |
| Layers | LEFT drawer | page | rail, L, ⌘K | `4418:81300` | ✓ |
| Pages (+ folders) | LEFT drawer; page settings in a slide-over | site pages; folders per user | rail, P, ⌘K, topbar site crumb | `4418:90494`, `4418:92679` | ~ (see FB-9) |
| Assets (quick) | LEFT drawer | site | rail, M, ⌘K, inspector "Choose image" | `4418:59771` | ✓ |
| Full media library | Full-screen portal (`sidebar/FullPageRouter.tsx:355-366`) | site | "Manage assets ›", ⌘K "Open Asset library", inspector "Manage video" | `4418:152293` | ✓ |
| CMS (+ workspace) | LEFT drawer; the workspace replaces the canvas and inspector (`SP:349-351, 634-640`); records edit in a side sheet | site | rail, D, ⌘K (+ Records band), context "Bind to CMS field…" | `4428:140486`, `4428:143182` | ~ (see FB-5) |
| Components | LEFT drawer; also Add › Built-in / Saved | site, and now per page | ⇧A (two listeners), ⌘K, Add "Manage components ›" | `4418:142419`, `4418:99857` | ✓ |
| Brand | Full-screen (`FullPageRouter.tsx:399-414`) | site | rail, B, ⌘K, Settings "Brand ↗", Issues "Open Brand" | `7315:80955` | ✓ |
| Inspector | RIGHT column; tabs Style · **Settings** · Effects | element | selection | `4428:141170` / `141642` / `142686` | ✓ placement; name clash (FB-1) |
| Selected-element AI | RIGHT column, as its own state (`SP:260, 432-435`) | element / page | I, ⌘J, ⌘K, inspector ✦, empty canvas "Describe your site" | `4418:104454` | ✓ placement; stacking ✗ (FA-1) |
| Review | RIGHT column (`SP:57`) | site | topbar chip/CTA, R, ⌘K, Activity rows | `4418:115784` | ✓; no gate (FB-3) |
| Issues | `position:absolute` block over the right column (`AS:647-660`) | page or site | site menu, ⌘K, Publish gate banner, errors-confirm modal | `4418:147641` | Geometry ✓; not part of the column system (FA-1) |
| History | RIGHT column; tabs Session · Saves · Published | session + site | save pill, H, ⌃H, ⌘K, Publish "All versions ›", Activity rows | `4418:73545` | ✓ |
| Activity | RIGHT column (`rail/tabsConfig.ts:199-212`) | site | site menu "Activity log", ⌘K, notifications "View all activity ›" | `4418:140587` | ✗ backend missing (FB-2) |
| Publish | Topbar CTA → confirm **modal** (`AS:494-502`); panel in the RIGHT column | site | CTA; panel only via U, ⌘K, site menu "Unpublish…" | `4418:97118`, `7574:193972` | ~ (FB-6) |
| Settings (site) | Full-screen | site + workspace | site menu, ⌃,, S, ⌘K, Pages "Add redirect" | `4418:127313` | ✓; name clash (FB-1) |
| Templates | Full-screen | page (new page / replace) | T, ⌘K + Templates band, New-page modal, Pages row "Replace layout…", empty canvas | `4418:54134`, `4428:149355` | ✓ |
| Share (draft link) | Modal | titled per page, links to the whole site | site menu, Preview "Share" | `4418:165739` | ✗ (FB-7) |
| Command palette | One modal; ⌘⇧P is an alias | global | ⌘K, ⌘⇧P, topbar search, Pages keycap | `4418:141220`, `4418:141171` | ~ (FC-2) |

### Recommended IA: what belongs where

| Region | Owns | Rule |
|---|---|---|
| **LEFT rail + drawer** | Add (incl. Generate a block), Layers, Pages, Assets, CMS collection list, Components | *Build and structure the site.* Opening something here never changes the right column. |
| **RIGHT column** | Inspector (default), AI, Issues, Publish, Review, History, Activity | **One slot, one state.** The last surface opened wins. ✕ or Escape returns to the Inspector. Nothing is drawn on top of the slot. |
| **Full screen** | Site settings, Brand, Templates, Full media library, Compare | A takeover with its own "Back to canvas". |
| **Canvas-region takeover** | CMS workspace | Replaces the canvas and inspector; the left drawer stays. Write this down as a third, deliberate shape. |
| **Modal** | Publish confirm, template replace confirm, Share, save-as-component, CMS setup | Short, blocking decisions only. |
| **Topbar (global)** | Save state, Review chip, Publish CTA, notifications, site menu, ⌘K | Status and doors, not panels. |

---

## 2. The eight ownership pairs, on `main`

| Pair | Verdict on `main` |
|---|---|
| **Pages vs CMS** | **Clean, matching v3.** CMS owns collections and dynamic pages (`cms/DynamicPagesPane.tsx`, template page is now a picker). The one gap: Pages gives no hint that CMS-generated pages exist (FC-1). |
| **Add vs Components** | **Fixed.** Add groups are "Built-in components" and "Saved components" (`catalog/groups.ts:61-62`). "Manage components ›" leads to the Components drawer that v3 draws. Leftovers: ⇧A is handled by two listeners, and components can now be page-scoped (FC-5). |
| **Media quick vs full** | **The split is right** (drawer + "Manage assets ›" → full library). Two detail views still fork: Versions (FB-8) and Stock / Used-in (FC-6). |
| **Brand vs Site Settings** | **Correct.** Both are full-screen. Settings links into Brand ("Brand ↗") and does not duplicate it. |
| **Inspector Settings vs Site Settings** | **Collision is now live.** Three surfaces say "Settings" (FB-1). |
| **Selected-element AI vs Generate-with-AI** | **Resolved in principle.** Editing happens in the right column (one engine, one home). Creating happens in Add › Generate a block, on the same engine and quota (owner decision #22). Open: "Describe your site" on an empty canvas opens the editing AI rather than the creator, and "Improve with AI" is unreachable (FC-3). |
| **Page-level vs site-level** | Share is titled per page but shares the site (FB-7). Page folders are personal, but nothing says so (FC-4). "Settings" spans element, page, site and workspace (FB-1). |
| **Canvas-level vs project-level** | **Fixed** for breakpoints: the canvas owns the control and the inspector pill is gone. The palettes are one now. Remaining: letter keys that open project panels while a dialog is up (FB-4). |

---

## 3. Open findings on `main`

**Fields per finding:** Finding · Current structure · Figma proof · Why it matters · Recommended IA · Priority · Decision. The earlier ID each finding came from is in brackets.

### P0

**FA-1 · The right column has no single rule for which panel wins** [v2 FB-8, widened]
- **Current structure:** four mechanisms share the right side of the screen.
  1. **Column panels.** Publish, Review, History and Activity occupy the left drawer's single tab slot but render in the right column: `RIGHT_COLUMN_TABS` (`SP:57`), `rightColumnTab` (`SP:319`).
  2. **AI.** A separate flag, `setAiInInspector(true)` (`SP:443`).
  3. **Issues.** A separate `issuesOpen` overlay, drawn `position:absolute` above both (`AS:647-660`).
  4. **CMS workspace.** It hides the inspector (`SP:349-351`).
- **Consequences** (*code-read*):
  - ⌘K "Open AI" or `I` shows nothing while History is open, and AI reappears when History closes.
  - The Publish gate banner opens Issues on top of Publish (`sidebar/tabs/publish/PublishGateBanner.tsx:31`).
  - Escape handles only the four column panels (`shell/hooks/useColumnPanelEscape.ts`). It can close the hidden Publish panel and leave Issues on screen.
  - Opening a column panel closes the left drawer, and the drawer does not return.
- **Figma proof:** v3 draws every one of these in the inspector column: Issues `4418:147641`, Publish `4418:97118`, Review `4418:115784`, History `4418:73545`, Activity `4418:140587`, AI `4418:104454`. No board draws two of them at once. Gap-matrix rows G1-088 and G2-127. There is no ledger row for the stacking.
- **Why it matters:** the right column is the editor's context slot. With three owners, the same click gives different results depending on what was opened before.
- **Recommended IA:** one column state, `inspector | ai | issues | publish | review | history | activity`. Last opened wins; ✕ or Escape returns to the Inspector. Move Issues into it; remove the overlay.
- **Priority:** P0 · **Decision:** CHANGE (confirm the stacking live first).

### P1

**FB-1 · Three things are called "Settings"** [v2 FB-10, now live]
- **Current structure:** the inspector tab strip reads Style · **Settings** · Effects (`inspector/sections/registry/_shared.tsx:53-56`, rendered `inspector/ProInspector.tsx:423`). The rail's full-screen site screen is "Settings" (`rail/tabsConfig.ts:161`). Pages has a page-settings slide-over. Site settings also holds workspace items: Members, Billing, and Webhooks subtitled "Workspace event deliveries" (`sidebar/tabs/settings/constants.ts:108-110`).
- **Figma proof:** `4428:141642` (inspector Settings tab) and `4418:127313` (site Settings). Gap-matrix row G2-137. The boards themselves use the same word.
- **Why it matters:** one word covers four scopes: element, page, site, workspace. Asking "where is the setting for X" has no single answer.
- **Recommended IA:** keep the inspector's board label if the owner insists, but make every Settings surface show its scope ("Element settings", "Page settings", "Site settings"). Group Members and Billing under a "Workspace" heading.
- **Priority:** P1 (earlier passes said this would become P0 once the tab shipped. It stays P1 because it confuses users but does not block any job.) · **Decision:** PRODUCT DECISION REQUIRED

**FB-2 · The Activity panel has doors but no backend, and it overlaps History** [v2 FC-7, changed]
- **Current structure:** Activity is a right-column panel (`rail/tabsConfig.ts:199-212`). The site menu "Activity log" opens it (`AS:576`). It calls `client.activity.recent` (`services/ActivityService.ts:71`), but the server has **no `activity` router** (checked: none in `server/trpc/router.ts` or `server/trpc/routers/`). So production always shows the "unavailable" state.
- **Overlap with History:** an Activity "edit" row opens History › Session, which is this browser's own undo list, so a teammate's edit never appears there (`sidebar/tabs/activity/ActivityTab.tsx:33-37`). Publish rows open History › Published, the same list as Publish's "All versions ›". The dashboard keeps its own activity feed (`dashboard.activity`) with different filters.
- **Figma proof:** `4418:140587`, `6278:147177`. Ledger R2: "needs dashboard".
- **Recommended IA:** hide every Activity door until `activity.recent` exists. Send edit rows to History › Saves (shared), not Session (local). Decide whether the editor's log and the dashboard's log are one feature or two.
- **Priority:** P1 · **Decision:** CHANGE (hide doors) + PRODUCT DECISION REQUIRED (one log or two)

**FB-3 · Review has no client-side gate** [v2 FB-4, still true]
- **Current structure:** `TabRouter.tsx:235-242` renders `ReviewTab` with no flag check. Nothing under `sidebar/tabs/review/` reads `reviewsEnabled`. The only gate is server-side (`server/trpc/routers/reviews.ts:85,112,152`).
- **Doors that stay open for every workspace:** `R` (`rail/tabsConfig.ts:223`), ⌘K "Open Review" (`shell/modals/CommandPalette.tsx:96`), and the topbar chip, which falls back to "Review" when reviews are off (`shell/StudioHeader.tsx:158-160`).
- **What improved:** the site menu's panel rows are gone (G1-016 `done 0cee7653e`), and Review now opens on the right.
- **Figma proof:** the Review families (`4418:115784`, …) all assume an agency workspace; no board draws the non-agency state.
- **Recommended IA:** when `reviewsEnabled === false`, remove the tab ID from ⌘K, the letter keys and the chip.
- **Priority:** P1 · **Decision:** CHANGE

**FB-4 · Letter keys open off-rail panels, even behind dialogs** [v2 FB-6, still true]
- **Current structure:** `sidebar/useSidebarKeyboard.ts:20-58` binds A T M L P ⇧A B S U H R D, plus I. It checks only inputs and modifier keys, with **no `isModalOpen()` guard**. `shell/hooks/useEditorShortcuts.ts:87` does have that guard. ⇧A is handled by both files.
- **Figma proof:** the keyboard legend `4418:126882` shows "A L P M D B". Rows G1-089 and G1-091 are done, but for other items.
- **Recommended IA:** add the modal guard now. Then decide whether U, H, R, S, T stay as letters or become ⌘-chords shown in one shortcut sheet.
- **Priority:** P1 · **Decision:** CHANGE (guard) + PRODUCT DECISION REQUIRED (which letters)

**FB-5 · "Bind to CMS field…" opens the wrong surface**
- **Current structure:** the canvas context-menu row emits `UI_SWITCH_TAB {tab:"content"}` (`canvas/menus/actions/standaloneActions.ts:71`). That opens CMS, whose workspace now covers the canvas and inspector. Binding lives in Inspector › Settings › Content (`inspector/sections/ContentSection.tsx:105-109`).
- **Figma proof:** `4428:149540` (Inspector · Settings · From CMS). Q6 of the v3 plan. G2-055 said to repoint this row once G2-144 landed; G2-144 is done.
- **Recommended IA:** emit `UI_INSPECTOR_FOCUS_SECTION {section:"content"}`, as "Add interaction" already does.
- **Priority:** P1 · **Decision:** CHANGE

**FB-6 · The Publish panel has no visible door**
- **Current structure:** the topbar Publish CTA goes straight to the confirm modal (`AS:494-502`). The panel, with its pre-publish checks, domain and version list, is reachable only by `U`, ⌘K, or the site menu's "Unpublish…".
- **Figma proof:** `4418:97118` (panel), `7574:193972` (confirm, kept by owner ruling). G1-043 routes the topbar to "panel or gate".
- **Recommended IA:** add a "Details ›" link from the confirm modal and its blocked state to the panel.
- **Priority:** P1 · **Decision:** PRODUCT DECISION REQUIRED

**FB-7 · Share says "page" but shares the whole site**
- **Current structure:** the modal title is `Share preview of ${page}` (`shell/PreviewShareModal.tsx:141`). The URL is `${DASHBOARD_URL}/share/${token}` with no page parameter (`:106`). The dashboard route supports `?page=` and otherwise opens the first page.
- **Figma proof:** `4418:165739`.
- **Recommended IA:** append `?page=<slug>`, or title the modal for the site. Also name the three share concepts in one place: draft link, review link, and the dashboard's password/expiry links.
- **Priority:** P1 · **Decision:** CHANGE

**FB-8 · Media "Versions" still shows two models** [v2 FB-9, partly fixed]
- **Current structure:** one image-edit save now writes both a `versionOf` sibling and a server restore point (`sidebar/tabs/media/MediaTab.tsx:150-158`). But the drawer shows restore points (`AssetDetailOverlay.tsx:15-16`) while the full library shows siblings (`media/components/VersionsModal.tsx:6`).
- **Figma proof:** drawer `4418:62883` / `6930:80106` (G3-024); library `4418:154593` / `4418:154224` (G3-050). v3 draws both.
- **Recommended IA:** pick one list and show it in both places.
- **Priority:** P1 · **Decision:** PRODUCT DECISION REQUIRED

### P2

| ID | Finding on `main` | Evidence | v3 / ledger | Recommended | Decision |
|---|---|---|---|---|---|
| FC-1 | Pages gives no hint that CMS-generated pages exist. v3 puts them only in CMS, so this matches the board, but it is a discoverability gap. `resolveDynamicPages` has no client caller. | `sidebar/tabs/pages/` (no refs); `server/trpc/routers/cms.ts:84` | `4428:147857`, G3-072 done | A "+N from collections ›" row linking to CMS › Dynamic pages | PRODUCT DECISION |
| FC-2 | ⌘K page jumps exist only while the Pages drawer is open; Layers, Assets, Records and Templates rows are always there. | `sidebar/tabs/pages/usePageCommands.ts:5-11` | `4418:141171` (no condition) | Register page jumps from the shell | CHANGE |
| FC-3 | "Improve with AI" can never show, because `AquibraStudio` passes no `onAIRequest`. Its v3 home in the Inspector ⋯ menu isn't built. G2-055 is marked done anyway. "Describe your site" opens the editing AI, not Add's generator. | `AS:593-641`; `canvas/menus/actions/standaloneActions.ts:45`; `canvas/Canvas.tsx:789` | `7048:77991`; G2-055 | Wire the row or delete it; fix the ledger row; route "Describe your site" to the creator | CHANGE |
| FC-4 | Page folders are personal (per user) inside a shared panel, and nothing says so. The CHANGELOG says "personal + shared", but only personal folders exist. Tooltip `7069:78978` says "This browser only", which is wrong because folders sync. | `prisma/schema.prisma:1580-1596`; `server/trpc/routers/pages.ts:115-116` | `4418:92679` | Label them "My folders" or build shared folders; fix the CHANGELOG and the tooltip | PRODUCT DECISION |
| FC-5 | Components' home and scope contradict each other. There is a drawer plus Add groups plus Brand › Component styles. Components can now be page-scoped, which cuts against "reusable". A comment says they fold into Brand, but Q4 says Add. ⇧A has two listeners. | `BuildTab.tsx:65`; `rail/tabsConfig.ts:251-252`; `useEditorShortcuts.ts:148` | `4418:142419` | Fix the comment; name the "This page" scope; drop one ⇧A listener | CHANGE |
| FC-6 | Media detail views are still forked. Used-in is a joined string in the library but has "Go ›" rows in the drawer. There are still two stock browsers. | `media/components/AssetDetailsPanel.tsx:389`; `StockBrowserOverlay.tsx:10-11` | G3-023 vs G3-048; G3-029 vs G3-036 | Share the Used-in rows; choose one stock surface | CHANGE / PRODUCT DECISION |
| FC-7 | The editor now has three takeover shapes (full-screen portal, CMS canvas region, Compare overlay), and no written contract. Comments disagree: `FullPageView.tsx:4` says "Templates, Settings, History"; `FullPageRouter.tsx:2` says "Templates, Assets". | as cited | G3-068, G1-002 | One short contract doc; correct both comments | CHANGE |
| FC-8 | Publish readiness has two sources, the lifecycle gate and the server checklist, and only the panel shows both before the click. | `shell/lifecycle.ts:37`; `sidebar/tabs/publish/PublishTab.tsx:498` | G1-043/044/045 | Show checklist blockers in the confirm modal too | CHANGE |
| FC-9 | Viewers cannot open read-only History, Review or Activity. Their rail is Layers and Assets only, and column panels are blocked in view mode. | `SP:54, 309, 509-513` | G1-062 done | Decide read-only access for viewers | PRODUCT DECISION |
| FC-10 | Dead code: `generatePage` (`services/AiTrpcClient.ts:200`), `useStreamPrompt` (tests only). There are also three separate subscriptions to the component list. | as cited | — | Delete; one `useComponentList` hook | CHANGE |
| FC-11 | Settings is reached two ways: the site menu and ⌃, go through a modal flag that renders nothing; S and ⌘K go direct. | `shell/StudioModals.tsx:129-133` | — | One route | CHANGE |
| FC-12 | Documentation drift. `packages/editor/CLAUDE.md` never says Client sign-off is the dashboard `/review/<token>` page. `807:8723` and the retired drill-in board `1344:7162` are still `active`. The v3 Backups boards (`4418:78906`) are still drawn although the owner retired Backups. `boards.json` has zero v3 rows (highest nodeId `4256:26844`), so the conformance harness measures nothing against v3. | as cited | G1-074 | Mark superseded boards; register v3 boards; one line in CLAUDE.md | CHANGE |
| FC-13 | Brand is a full-screen workspace with 10 destinations. Beginner/Pro controls only density; the Q5 Simple/Advanced split is still not built. | `BrandWorkspace.tsx`; `DSModeToggle.tsx:18-19` | `7315:80955`, G3-120 done | Merge the two toggles when Q5 lands | KEEP now / PRODUCT DECISION |

---

## 4. Verified correct on `main` — protect these

- One command palette. ⌘⇧P is an alias. It has Pages, Records and Templates bands (`shell/modals/CommandPalette.tsx:2-15, 62`).
- One AI engine, with one editing home in the right column. Creating lives in Add and uses the same engine and quota.
- Breakpoint has one owner, the canvas footer switcher.
- Add labels are unambiguous ("Built-in" / "Saved" components), and "Manage components ›" is the door v3 draws.
- Templates open neutral from generic doors. Replace only comes from the Pages row ⋯ menu or ⌘K, and takes a History backup first.
- CMS has one record UI: the workspace table plus side sheet. The old records modal is gone, and the template page is a picker.
- One Compare (`CompareHost.tsx`), with a picker for each side.
- Brand vs Site Settings are cleanly separated; Settings links into Brand and does not copy it.
- Export has one home. History's Session and Saves are distinct, and Backups is retired by owner ruling.
- The single six-item rail; the dev rails and `RAIL_TOOL_META` are deleted.

## 5. Fixed since the earlier passes (for the record)

| Earlier finding | Fixed by (C5 ledger) |
|---|---|
| ⌘K bound twice / three palettes | G2-038, G2-083 `86b39bec3` |
| Canvas "+" opened an old picker | G2-116 `09426507a` (toolbar button removed) |
| AI in three places, two engines | G2-127 `a31cf941e`, G2-117 `a09ea05b6` |
| Breakpoint owned twice | G2-013 `9ed632211` |
| "Components" meant two things in Add | G2-107 `6f18799aa` |
| Templates opened in replace mode; no Pages-row replace | G2-093/095 `f23bcc0dc`, G2-098 `9022282fc` |
| Hidden CMS records modal; no table view | G3-068 `bb20b2d64` + `b74b4576b` |
| CMS template page was free text | G3-072 `d7f9cd294` |
| Two unrelated "Compare" features | plan B8 (`CompareHost`) |
| Dead Layers context menu; drifted rail metadata; mislabelled ⌘K rows; two export homes | G1-095 `30a11c779` and others |

## 6. Not verified

- **No live app.** Before fixing, walk the right-column stacking (FA-1), the letter keys behind a dialog (FB-4), the Review panel in a non-agency workspace (FB-3), and the Activity "unavailable" state (FB-2) at 1440×900.
- **No fresh Figma read.** Node IDs come from the committed v3 inventory. The side on which `4418:140587` draws Activity was not confirmed from the board itself.
- **Not re-audited:** every ledger row, the dashboard's share list and notifications, and the 56 site-settings screens one by one.
