# Buildrik Editor — Feature Inventory with Status (2026-10-16)

This is the complete list of every editor feature, built from the code on `main` @ 19f964d5e, for the full UI redesign. It replaces `editor-feature-inventory-2026-09-16.md`, which is a month old; much of what it described has since been rebuilt or removed.

**How it was made:** 9 readers checked every item of the 09-16 inventory against current code, added new features and marked the ones that were removed. They cited bugs from the trusted audits (10-08 full audit, 10-10 UI/UX and product audits) only after confirming them in current code. **This is a code read only. Nothing was walked in the live app.** Each module ends with a "Not verified" list.

**Unmerged fixes:** the Phase 1 branch `feat/phase1-s6-publish` is not merged. It fixes several 🐞 rows, including resize, the restore overwrite and focus reaching the hidden editor. On `main` these are still bugs.

## Status key

| Tag | Meaning |
|---|---|
| ✅ Complete | Wired end to end and reachable by real users |
| 🟡 Partial | Exists but has missing pieces or rough edges |
| 🐞 Bug | Confirmed defect in current code |
| 🚩 Flagged | Behind a FEATURE_* flag (publish / dsAi / collab). Planned product, not dead |
| 🔒 Plan-gated | Locked to Pro / Business |
| ⏳ Stub | Shows in the UI but is not wired, or says "coming soon" |
| 🧪 Dev-only | Only in the local demo or dev builds |
| ❌ Removed | Was in the 09-16 inventory and is gone now. Design it only if it is being revived |
| 🆕 | Added since 09-16 (appended to any status) |

## Totals (approximate: emoji counted per table row)

| Module | Rows | ✅ | 🟡 | 🐞 | 🚩 | 🔒 | ⏳ | 🧪 | ❌ | 🆕 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 Shell (top bar, rail, menus, dialogs, onboarding, ⌘K) | 156 | 114 | 14 | 6 | 5 | 2 | 1 | 0 | 14 | 45 |
| 2 Canvas + interactions | 154 | 106 | 13 | 12 | 3 | 0 | 3 | 0 | 17 | 27 |
| 3 Pages, Templates, Layers, History, Activity | 138 | 110 | 10 | 4 | 0 | 1 | 0 | 0 | 15 | 39 |
| 4 Add, Components, AI | 107 | 75 | 9 | 3 | 0 | 0 | 3 | 0 | 17 | 45 |
| 5 Assets, CMS, Forms | 129 | 79 | 21 | 16 | 0 | 0 | 2 | 1 | 10 | 42 |
| 6 Settings, Publish, Review, Export, E-commerce, Animation, Sync | 172 | 112 | 18 | 15 | 5 | 2 | 6 | 2 | 13 | 63 |
| 7 Inspector | 122 | 89 | 10 | 4 | 0 | 1 | 2 | 0 | 17 | 38 |
| 8 Brand workspace (+ chrome UI kit) | 65 | 40 | 4 | 5 | 4 | 0 | 2 | 0 | 10 | 35 |
| 9 Engine rules, gap register, open bugs | 195 | 117 | 17 | 25 | 5 | 8 | 11 | 4 | 13 | 18 |
| **Total** | **1238** | **842** | **116** | **90** | **22** | **14** | **30** | **7** | **126** | **352** |

Module 9's gap register and bug list repeat items from modules 1–8 on purpose, so everything incomplete is in one place. The totals therefore count those items twice.

## Biggest incomplete / broken items (for the redesign brief)

1. **Resize:**
   - It ignores zoom. The editor loads at about 60%, so the first resize shrinks the element.
   - Esc undoes the previous, unrelated edit.
   - Keyboard resize writes `NaNpx`.
   - With several elements selected, only the main one resizes.
2. **Duplicate, paste and ⌘-drag** lose Tablet/Mobile and :hover styles.
3. **Full-page tools (CMS, Brand, Settings):**
   - ⌘Z still works behind them, undoing canvas edits the user can't see.
   - Tab and screen readers still reach the hidden editor (UX-22 / IA-07).
4. **"Restore my edits"** can overwrite a teammate's newer work. Review revoke/resolve and the library/theme snapshots also have site-scope authorization holes.
5. **Image loss** after a failed asset registration: the temporary `blob:` URL is stripped on save.
6. **Breakpoints and preview:**
   - Breakpoints are hidden behind View ▸ Breakpoint.
   - Preview always opens on Desktop.
   - "Desktop" is 1024, 1320 or 1440px depending on the surface.
7. **SEO and Review:**
   - SEO is mostly unbuilt: no title template, structured data or sitemap UI.
   - The same page gets two different SEO scores.
   - Review v2 is not built (FG-001/007/009).
8. **CMS and Forms:**
   - Conditions don't hide anything.
   - Pasted sources are lost on reload.
   - The records table is thin.
   - The forms inbox lost its spam and archive views.
9. **Components:**
   - Masters can't be edited in place.
   - Variants have no UI.
   - Saved-component counts disagree between panels.
   - After a master is reordered, a master update can put an instance's edits on the wrong element.
10. **Inspector:**
    - Radio has no Value control.
    - Some fields disagree with the canvas (line height, align, font size).
    - Override info is shown 5 times for one change.
    - Interactions are trigger → animation only.
11. **Brand:**
    - Templates insert fixed colours, so Brand edits don't recolour them.
    - Leftover "draft / Save" copy remains.
    - Beginner/Pro is half-removed.
12. **Onboarding:**
    - Progress is stored globally, not per site, so a new site can show "Done 7/7".
    - Pop-ups stack on top of each other.
13. **Removed with no replacement:**
    - 40 block cards, the Row/Column presets and the e-commerce blocks (so e-commerce is effectively unreachable).
    - The status footer.
    - The Issues chip, so the issue count is now invisible.

---

# Editor Shell — Top Bar, Rail, Column Hosts, Global Dialogs, Publish/Review Gates, Recovery, Keyboard & Onboarding

The shell is the frame around everything else. It covers the 56px top bar (Exit, a site › page breadcrumb, save pill, review chip, Comments, presence, bell, Preview, the one blue CTA, ⋯ site menu), the left rail with its drawer, the page-tab strip at the top of the canvas, and the right column. Since Editor v3, that column hosts the Inspector, AI, Issues, Publish, Review, History and Activity. The shell also owns every global dialog, banner and toast, the keyboard layer (⌘K, letter keys, F6, help sheets) and first-run onboarding. Compared with the 2026-09-16 baseline, the status footer, the review bar under the top bar, the live chip, the Issues chip and the page-tab context menu are gone. Publish, Review and History moved from the drawer into the right column. Templates and Brand became full-screen takeovers.

Static code read of `main` @ 19f964d5e (2026-10-16). Paths are repo-relative.

## 1. Frame, layout and boot

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 1.1 | Shell grid | Top bar, then rail + drawer, canvas and right column. The columns run to the bottom of the window (no footer row). | ✅ Complete | packages/editor/src/editor/rail/LayoutShell.tsx:262; packages/editor/src/editor/shell/StudioPanels.tsx:823 | The `LayoutShell.Footer` slot still exists but nothing renders into it |
| 1.2 | Status footer (selection readout, size, Device·zoom button) | 32px bar at the bottom | ❌ Removed | commit 83854c5e3 "remove the status footer"; selection readout and zoom now in the canvas footer toolbar: packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:1 | Canvas module owns these now |
| 1.3 | Zoom flyout (fit/selection/100%/presets) | Opened upward from the footer | ❌ Removed (moved) | Now "100% ▾" and View ▸ Zoom in the canvas toolbar: packages/editor/src/editor/canvas/CanvasFooterToolbar.tsx:9 | Canvas module |
| 1.4 | Dev-only alternate rails (`?rail=e3`, `?rail=legacy`), drawer sub-tab chips, Structure popover | Dev experiments | ❌ Removed | packages/editor/src/editor/rail/tabsConfig.ts:287 ("legacy zone rail and the E3 tool rail were deleted with C5 G1-095") | — |
| 1.5 | Right column as a multi-mode host | One column swaps between Inspector, AI, Issues, Publish, Review, History and Activity, each with a "‹ Inspector" way back | ✅ Complete 🆕 | packages/editor/src/editor/rail/tabsConfig.ts:341; packages/editor/src/editor/shell/StudioPanels.tsx:949 | Seven things share one column; the user can't see which modes are stacked |
| 1.6 | Hide / show inspector | Inspector ✕, ⌘\ or ⌘K "Toggle inspector" hides it. A "Show inspector ⌘\" button then appears at the canvas top right. Hidden state is per session only. | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioPanels.tsx:340, :482, :898; packages/editor/src/engine/commands/defaultCommands.ts:562 | — |
| 1.7 | CMS workspace takeover | Rail CMS keeps the drawer open and covers canvas + inspector with the CMS workspace. Esc or Back to canvas leaves. | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioPanels.tsx:450, :921 | Third takeover shape (see 1.8). CMS module owns the contents |
| 1.8 | Full-screen takeovers | Templates, Asset library, Settings and Brand paint edge to edge, rail included, each with its own "‹ Back to canvas" | 🐞 Bug | packages/editor/src/editor/sidebar/FullPageRouter.tsx:114-200. Covered editor stays in the Tab order and accessibility tree (no `inert` anywhere in shell/rail/router): UX-22, IA-07. Brand host lacks `data-bk-surface="fullpage"`: FullPageRouter.tsx:189 | Four takeovers with Back in different places and styles (UX-24). Three takeover shapes in total (IA-06) |
| 1.9 | View mode (`?view=readonly`) | No rail, drawer or inspector, full-width canvas, trimmed top bar | ✅ Complete | packages/editor/src/editor/shell/StudioPanels.tsx:842, :938 | — |
| 1.10 | Viewer chrome (workspace VIEWER) | Rail shows Layers, Assets, History, Review and Activity, read-only. Right column shows "Workspace role: Viewer" with "View permission details". Opens on Layers. | ✅ Complete 🆕 | packages/editor/src/editor/rail/tabsConfig.ts:328; packages/editor/src/editor/shell/ViewerRoleNotice.tsx:1; packages/editor/src/editor/shell/StudioPanels.tsx:745 | — |
| 1.11 | Skip to Canvas link + landmarks | Hidden first focus stop. Toolbar, navigation, sidebar, canvas, properties and full-page regions are labelled. | ✅ Complete | packages/editor/src/editor/rail/LayoutShell.tsx:309 | UX-22: Skip link stays tabbable under full-page views |
| 1.12 | Boot skeleton | Placeholder chrome before the engine is ready | ✅ Complete | packages/editor/src/editor/shell/AquibraStudio.tsx:577 | — |
| 1.13 | Shell crash screen | "Something went wrong" + message + Reload | ✅ Complete | packages/editor/src/editor/shell/AquibraStudio.tsx:97-145 | Inline styles and a hand-styled button; not on the design system |
| 1.14 | Panel loading / crash fallback (drawer) | 5-row skeleton; "Something went wrong… Your work is safe." + Try Again | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:491; packages/editor/src/editor/sidebar/SidebarFallbacks.tsx:23 | — |
| 1.15 | Column panel loading / crash fallback | Skeleton and retryable error for Publish, Review and History in the right column. This stops a full editor remount on first open. | ✅ Complete 🆕 | packages/editor/src/editor/shell/RightColumnPanel.tsx:1 | — |
| 1.16 | "Project loaded" toast on open | Toast on every load | ❌ Removed | L1-028 fixed 8839e959c (on main) | — |
| 1.17 | Load toasts | "Project update failed" (design-system schema), "Load failed" (local copy unreadable) | ✅ Complete | packages/editor/src/editor/shell/hooks/useComposerInit.ts:299, :445, :472 | — |

## 2. Top bar

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 2.1 | Exit button | "‹ Exit" goes to the dashboard through the exit guard. In view mode it reads "‹ Back to editing" (owner) and leaves the mode. | ✅ Complete | packages/editor/src/editor/chrome-ui/Topbar.tsx:209; packages/editor/src/editor/shell/StudioHeader.tsx:566, :793 | — |
| 2.2 | Site › page breadcrumb | Site name in accent opens Pages; the page crumb closes the drawer. It shows "<site> › CMS" while the CMS workspace is open. Defaults to "Untitled site". | ✅ Complete 🆕 | packages/editor/src/editor/chrome-ui/Topbar.tsx:226-264; packages/editor/src/editor/shell/StudioHeader.tsx:261, :787 | Site name doubles as a Pages door, which is hard to discover |
| 2.3 | Save status pill | Six states: Saved · 2m ago, Saving…, Unsaved changes, Conflict — reload, Offline — not saved, Save failed — retry. Offline outranks the rest. Staged Brand/Settings edits also show as Unsaved. | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:631; packages/editor/src/editor/chrome-ui/Topbar.tsx:274 | — |
| 2.4 | Save pill click | Saved/Saving/Unsaved open History. Error retries the save. Conflict reopens the conflict dialog. Offline does nothing (tooltip only). | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioHeader.tsx:652-661 | Changed from "click = save now". ⌘S is now the only manual save |
| 2.5 | Timestamp drop on narrow bars | "· 2m ago" hidden under 1200px of bar width | ✅ Complete | packages/editor/src/editor/chrome-ui/Topbar.tsx:200 (container query) | — |
| 2.6 | Live chip (green dot + domain) | Was in the bar | ❌ Removed | Not in packages/editor/src/editor/chrome-ui/Topbar.tsx. Live URL is now only in ⋯ "View live site ↗" / "Copy live URL" | Live status is no longer visible at a glance |
| 2.7 | Review chip | Permanent "Review ›" door when reviews are on. States: Not sent · Waiting · Sara · Changes requested · 3 · Approved · Approved · edited since. Click opens Review. Hidden when the workspace has reviews off. | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioHeader.tsx:164-190; packages/editor/src/editor/chrome-ui/Topbar.tsx:278, :426 | Copy changed from "In review" / "Opened · no reply" |
| 2.8 | Review-closed toasts | "Review closed" / "Sara approved this design." when a round closes during the session | ✅ Complete | packages/editor/src/editor/shell/hooks/useLifecycle.ts:1 (review transitions) | Not re-walked |
| 2.9 | Comments toggle | Speech-bubble icon beside the review chip. Pressed while comment mode is on. Absent when reviews are off. | ✅ Complete | packages/editor/src/editor/chrome-ui/Topbar.tsx:283; packages/editor/src/editor/shell/StudioHeader.tsx:742 | Moved from the right cluster to the left |
| 2.10 | Issues chip | Shield / count chip | ❌ Removed | packages/editor/src/editor/shell/StudioHeader.tsx:664 ("the chip that carried it having left the bar (C3)") | Issue count now only in the ⋯ Issues row tooltip (L4-038, DECISION) |
| 2.11 | Presence avatars + connection pill | Up to 2 faces + "+N", plus Live / Reconnecting… / Offline | 🚩 Flagged (collab) | packages/editor/src/editor/shell/StudioHeader.tsx:296, :809; packages/editor/src/editor/chrome-ui/Topbar.tsx:292 | — |
| 2.12 | Notifications bell | Bell with a numeric unread badge (99+), not a dot. Toggles the panel. Refetches on focus. | ✅ Complete 🆕 | packages/editor/src/editor/chrome-ui/Topbar.tsx:294-309 | — |
| 2.13 | Preview button | 76px bordered text button "Preview"; spinner while building | ✅ Complete 🆕 | packages/editor/src/editor/chrome-ui/Topbar.tsx:311-323 | Was an eye icon |
| 2.14 | Primary CTA — verb by state | Send for review / Open feedback / Publish / Publish changes / "… anyway" when errors are open. Hidden when live with nothing changed. "✓ Published" for 2s. | 🚩 Flagged (publish) | packages/editor/src/editor/shell/lifecycle.ts:254-440; packages/editor/src/editor/chrome-ui/Topbar.tsx:326-380; flag read packages/editor/src/editor/shell/hooks/useLifecycle.ts:111 | With `FEATURE_PUBLISH` off the button is disabled: "Publishing isn't switched on for this workspace yet" |
| 2.15 | CTA blocked reasons | Disabled at 40% opacity with a tooltip. Reasons: flag off, viewer, offline, sync conflict, last save failed, waiting on approval, still checking review settings, couldn't check review settings. | ✅ Complete 🆕 | packages/editor/src/editor/shell/lifecycle.ts:236-243, :320-342 | Conflict / save-failed / "couldn't check" blockers are new (L5-060 fix) |
| 2.16 | CTA routing | Review verbs open the Review panel. Publish runs the gate: errors confirm, then stale approval, then facts confirm. The Publish panel's own CTA uses the same door. | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:726; packages/editor/src/editor/shell/lifecycle.ts:210-221 | One door for two entrances |
| 2.17 | Screen-reader announcements | Hidden live regions for save and publish outcomes | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:197, :777 | — |
| 2.18 | Viewer top bar | Viewer in view mode keeps Preview and a disabled Publish ("Viewers can't publish — ask an editor") | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioHeader.tsx:746, :835 | — |

## 3. ⋯ Site menu

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 3.1 | Menu shell | 260px popover in three groups: THIS SITE · COLLABORATE · LEAVES THE EDITOR | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:125-262 | Regrouped from Site/Build/Share/Workspace |
| 3.2 | Site settings ⌃, | Opens full-screen Settings | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:164 | — |
| 3.3 | Export site… | Opens the Export modal (formats, preview, ZIP) | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:169; packages/editor/src/editor/shell/StudioModals.tsx:165 | — |
| 3.4 | Duplicate site | Confirm "Duplicate site?" first, then a "Site duplicated" toast with Open (new tab). Error toast on failure. | ✅ Complete 🆕 | packages/editor/src/editor/shell/SiteMenu.tsx:174, :265; packages/editor/src/editor/shell/StudioHeader.tsx:593 | — |
| 3.5 | Issues | Opens the Issues panel; the issue count is only in the row's tooltip | 🟡 Partial | packages/editor/src/editor/shell/SiteMenu.tsx:179; L4-038 (DECISION, still live) | Errors that change the publish label have no always-visible count |
| 3.6 | Activity log | Opens the in-editor Activity panel (right column). It used to open the dashboard. | 🟡 Partial 🆕 | packages/editor/src/editor/shell/SiteMenu.tsx:184; L3-031 "stays empty after an hour of edits" — PARTLY fixed d32f6aced | Activity module |
| 3.7 | Command palette ⌘K | Opens the palette | ✅ Complete 🆕 | packages/editor/src/editor/shell/SiteMenu.tsx:189 | — |
| 3.8 | Enter / Exit view mode | Navigation through the exit guard. Withheld from viewers. | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:150-158, :194 | — |
| 3.9 | Keyboard shortcuts ⌘/ | Opens the one shortcuts sheet | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:197 | — |
| 3.10 | Share preview link | Opens an in-editor dialog that reuses or mints a `/share/<token>` link, with Open ↗ and Copy link | ✅ Complete 🆕 | packages/editor/src/editor/shell/SiteMenu.tsx:202; packages/editor/src/editor/shell/PreviewShareModal.tsx:1 | Used to leave for the dashboard. Password and expiry still only in the dashboard |
| 3.11 | Copy live URL | Only when live. Toast "Live URL copied" or "Couldn't copy". | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:207; packages/editor/src/editor/shell/StudioHeader.tsx:760 | Off-board, kept |
| 3.12 | Getting started | Replays the onboarding checklist | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:212 | See 12.6 |
| 3.13 | Start collaboration | Live row when the flag is on; otherwise a disabled row tagged "Planned" | 🚩 Flagged (collab) | packages/editor/src/editor/shell/SiteMenu.tsx:221-232 | — |
| 3.14 | Unpublish site… | Live + ADMIN only. Opens Publish and starts its typed confirm. | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:233; packages/editor/src/editor/shell/StudioHeader.tsx:871 | — |
| 3.15 | View live site ↗ | Live only, new tab | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:242 | — |
| 3.16 | Site health ↗ | Dashboard Site Health in a new tab | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:247 | Leaves the editor for a score that Issues partly covers |
| 3.17 | Invite teammates ↗ / Account settings ↗ | Dashboard tabs; Invite is ADMIN only | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:255-258 | — |
| 3.18 | View-mode menu | Only "Exit view mode", or "View only — ask an editor to make changes" for a viewer | ✅ Complete | packages/editor/src/editor/shell/SiteMenu.tsx:150-159 | View live / Copy URL no longer offered in view mode |
| 3.19 | Removed rows: Version history, Review, Publish panel, Publish history, Templates, Components, Brand, Plugins, Ask AI | Were menu doors | ❌ Removed | packages/editor/src/editor/shell/SiteMenu.tsx:12-15 | Each keeps another door (rail, chip, save pill, ⌘K, letter key) |

## 4. Left rail and drawer

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 4.1 | Six rail items | Add (A) · Layers (L) · Pages (P) · Assets (M) · CMS (D) · Brand (B), icon over label, tooltip with letter | ✅ Complete | packages/editor/src/editor/rail/tabsConfig.ts:294; packages/editor/src/editor/sidebar/LeftSidebar.tsx:80-180 | Brand and CMS open takeovers, not the drawer — same-looking items, different behaviour |
| 4.2 | Logo mark + divider at rail top | Accent logo | ❌ Removed | packages/editor/src/editor/sidebar/LeftSidebar.tsx:432 ("no logo mark, no divider") | — |
| 4.3 | Rail Help button | "? Help" at the rail foot opens the Keyboard legend card | ✅ Complete 🆕 | packages/editor/src/editor/sidebar/LeftSidebar.tsx:449-461 | Tooltip says "Keyboard shortcuts · ?" but `?` opens the full sheet, not this card |
| 4.4 | Active / hover / focus states | Accent tint + 3px edge bar when the drawer is open; grey plate when closed | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:172 | — |
| 4.5 | Click semantics | A new item switches the panel and opens the drawer; the active item toggles the drawer | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:296 | Re-clicking is the only close for Add and Layers |
| 4.6 | Rail keyboard | ↑/↓ moves and switches; Home/End; only the active tab is a Tab stop | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:312 | — |
| 4.7 | Rail "unsaved" dot | Amber dot on an item with unsaved edits | ❌ Removed | Only existed on the deleted legacy rail | — |
| 4.8 | Off-rail panels | Templates T (full screen), Components ⇧A, Settings S (full screen), Publish U / History H / Review R / Activity (right column), AI I / ⌘J (right column) | ✅ Complete | packages/editor/src/editor/rail/tabsConfig.ts:70-244 | Templates and Brand moved drawer → full screen. Publish, History and Review moved drawer → right column |
| 4.9 | Drawer container | 280px token width; panel "expand" widens it to 700. Closed = 0 width, `inert`. Remounts on tab change. | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:410, :483 | — |
| 4.10 | Remembered tab | Last tab and sub-view stored in localStorage; drawer always opens on a new session | ✅ Complete | packages/editor/src/editor/shell/hooks/useStudioState.ts:21, :246, :256 | — |
| 4.11 | Unsaved-switch guard | One shared confirm when leaving dirty Settings, staged Brand, or an open CMS record. "Keep editing" vs a leave action. | ✅ Complete 🆕 | packages/editor/src/editor/shell/modals/UnsavedTabSwitchDialog.tsx:1; packages/editor/src/editor/shell/hooks/useTabSwitchGuard.ts:1 | Replaces the Settings-only "Discard & Switch" |
| 4.12 | Cross-panel hand-offs | Pages → Templates (new-page mode); Unpublish → Publish; empty media block → Assets pick; Show in layers; Settings ↔ Pages SEO; Issues row → element | ✅ Complete | packages/editor/src/editor/shell/StudioPanels.tsx:600-760 | — |
| 4.13 | Create component guard | Components "Create" with nothing selected shows the info toast "Select an element on the canvas first…" | ✅ Complete | packages/editor/src/editor/sidebar/LeftSidebar.tsx:393 | — |
| 4.14 | Full-screen close return | Closing a takeover returns to the previous drawer tab (default Add); the Asset library returns to the slim Assets drawer | ✅ Complete | packages/editor/src/editor/shell/StudioPanels.tsx:753 | — |

## 5. Page tab bar

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 5.1 | Page tabs | 36px white strip at the TOP of the canvas column. Active page = grey chip; amber dot = unsaved page. Click to switch, ←/→ to move, Enter to open. | ✅ Complete 🆕 | packages/editor/src/editor/shell/PageTabBar.tsx:73-123, :145 | Moved from the bottom edge; ⌂ home glyph dropped |
| 5.2 | "+" button | Opens the Pages panel (does not create a page itself) | 🟡 Partial | packages/editor/src/editor/shell/PageTabBar.tsx:124-132 | Board omits it (owner override 10-03; "Board to be updated"). Not withheld in view mode, where there is no drawer to open — static read, not walked |
| 5.3 | Tab context menu / F2 rename / duplicate / set home / delete | Right-click menu and inline rename | ❌ Removed | packages/editor/src/editor/shell/PageTabBar.tsx:4-8 (owner decision 14) | All live in the Pages panel row menu |

## 6. Notifications

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 6.1 | Notification dropdown | 360px panel under the bell; Esc / outside click closes; focus returns to the bell | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:896; packages/editor/src/editor/shell/NotificationPanel.tsx:140 | — |
| 6.2 | States | Loading skeleton; error "Couldn't load notifications." + Try again; empty "You're all caught up" | ✅ Complete | packages/editor/src/editor/shell/NotificationPanel.tsx:231, :256, :274 | — |
| 6.3 | Rows | Five most recent, day bands (TODAY / YESTERDAY / date / EARLIER). A type glyph leads each row; unread = tint + edge bar. Click marks read and jumps through the exit guard. | ✅ Complete 🆕 | packages/editor/src/editor/shell/NotificationPanel.tsx:279-330 | Bell counts all unread but the list shows five |
| 6.4 | Mark all read | Header button; failure toast "Couldn't mark read" | ✅ Complete | packages/editor/src/editor/shell/NotificationPanel.tsx:177, :218 | — |
| 6.5 | Footer link | "View all activity ›" opens the in-editor Activity panel | ✅ Complete 🆕 | packages/editor/src/editor/shell/NotificationPanel.tsx:367 | Was "See all notifications" → dashboard |
| 6.6 | "What this points to was deleted" note | Amber note under rows with no target | ❌ Removed | packages/editor/src/editor/shell/NotificationPanel.tsx:338 (A-20) | Linkless rows are now plain, non-clickable info |

## 7. Issues panel

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 7.1 | Issues panel host | Opens in the right column with "‹ Inspector" back. Doors: ⋯ Issues, ⌘K "Open Issues", "Fix issues first". | ✅ Complete 🆕 | packages/editor/src/editor/shell/AquibraStudio.tsx:588; packages/editor/src/editor/shell/IssuesPanel.tsx:200 | Was a 360px overlay on the inspector |
| 7.2 | Issue sources | DS-lint, content scanner (alt text, broken links, contrast) and server pre-publish checks | 🟡 Partial 🆕 | packages/editor/src/editor/shell/hooks/useContentIssueScanner.ts:1; L4-040/FG-026: no real a11y module (DECISION) | — |
| 7.3 | Scan state | "Scanning for issues…", "Scan failed." + Try again | ✅ Complete 🆕 | packages/editor/src/editor/shell/IssuesPanel.tsx:222, :228 | — |
| 7.4 | Empty / scope / filter | "No issues."; This page / All pages toggle; All → Errors only → Warnings only; sorted by severity | ✅ Complete | packages/editor/src/editor/shell/IssuesPanel.tsx:246, :253, :133; L4-036 fixed | — |
| 7.5 | Row click → locate | Switches page if needed and selects the element, the first element using the token, or the right fix pane (favicon/SEO/domain) | 🟡 Partial | packages/editor/src/editor/shell/AquibraStudio.tsx:597-620; L4-037 PARTLY ("no way back", off-viewport elements not revealed) | Was "closes panel only" in the baseline |
| 7.6 | Fix › auto-fix | Fixing band "Auto-fix lands as ONE undo step", then an "Issue fixed" toast with Undo (8s) | ✅ Complete | packages/editor/src/editor/shell/IssuesPanel.tsx:374; packages/editor/src/editor/shell/AquibraStudio.tsx:626-645 | — |
| 7.7 | Fix failed band | "Couldn't fix this automatically." + Open Brand · Ignore for this token | ✅ Complete | packages/editor/src/editor/shell/IssuesPanel.tsx:298-316 | — |
| 7.8 | Ignored (n) | Suppressed tokens listed with restore | ✅ Complete 🆕 | packages/editor/src/editor/shell/IssuesPanel.tsx:402 | — |
| 7.9 | Issue copy | Messages | 🟡 Partial | L4-039 PARTLY ("developer-facing") | — |

## 8. Preview, Share and Compare

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 8.1 | Preview overlay | Full-screen with its own 56px bar: "‹ Back to canvas" · Desktop 1320 / Tablet 768 / Mobile 375 · page select · Share preview. Doors: Preview button, ⌘P, ⌘K. Esc closes. | 🟡 Partial 🆕 | packages/editor/src/editor/shell/PreviewOverlay.tsx:165-215 | Replaced the "Done" pill. Covers the top bar now |
| 8.2 | Preview keeps device | Always opens on Desktop, even from Mobile | 🐞 Bug | packages/editor/src/editor/shell/PreviewOverlay.tsx:119; UX-11 / IA-09 | — |
| 8.3 | Preview fidelity | Static render with no scripts, so interactions, sliders and forms don't run. Fonts and colours differ from the canvas. "Desktop" is 1024 on canvas, 1320 in preview, 1440 on export. | 🟡 Partial | packages/editor/src/editor/shell/PreviewOverlay.tsx:211; IA-08; L5-050 & L1-013 (DECISION); UX-09 | Users can't trust it as "what ships" |
| 8.4 | Preview page switching | Page select + internal links move preview and editor to that page | ✅ Complete 🆕 | packages/editor/src/editor/shell/PreviewOverlay.tsx:183; packages/editor/src/editor/shell/AquibraStudio.tsx:849; L5-051 fixed | — |
| 8.5 | Share preview dialog | From the preview bar or ⋯: link + Open ↗ + Copy → "Link copied" | ✅ Complete 🆕 | packages/editor/src/editor/shell/PreviewShareModal.tsx:1 | — |
| 8.6 | Compare overlay | One full-canvas Compare, opened from Review, History and Publish history. Picker per side (approved · published · saved · current draft). Split / overlay / list, or a page-level diff for two published versions. | ✅ Complete 🆕 | packages/editor/src/editor/shell/CompareHost.tsx:1; packages/editor/src/editor/shell/PublishDiffView.tsx:1 | Replaces the History-only "v3 → v4" diff view |
| 8.7 | Time travel | ⌃⇧T or History ⋯. Warning band over the canvas; ←/→ step through this session's undo points (rendered for real); Enter → restore confirm (saves a version first); Esc exits. | ✅ Complete 🆕 | packages/editor/src/editor/shell/TimeTravelHost.tsx:1, :117, :249 | History module overlap |

## 9. Review and publish dialogs

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 9.1 | Review bar under the top bar | 44px strip with "N open · Next › · Compare · Re-send" | ❌ Removed | packages/editor/src/editor/sidebar/tabs/review/ReviewTab.tsx:939 (owner D3) | Its walk and re-send moved into a band at the top of the Review panel |
| 9.2 | Send for review popover | Client email / What changed? / Note; Sending… → Sent for review ✓ → Send again; invite-failed box with "Copy the review link" | ✅ Complete | packages/editor/src/editor/shell/SendForReview.tsx:47-269 | Hosted in the Review panel |
| 9.3 | Review-sent outcome dialog | "Creating review link…" → "Sent ✓" with link + Copy/Open, or "We couldn't send the email." + Try email again | ✅ Complete | packages/editor/src/editor/shell/modals/ReviewSentModal.tsx:85-116 | — |
| 9.4 | "Publish with N open errors?" | Up to 3 issue rows + "+N more"; Fix issues first (primary) · Publish anyway (skips the facts confirm) | ✅ Complete | packages/editor/src/editor/shell/modals/PublishErrorsConfirmModal.tsx:1, :106; packages/editor/src/editor/shell/AquibraStudio.tsx:905 | — |
| 9.5 | Publish confirm (facts) | "Publish to production?": Target · Pages · Client approval · Rollback facts; live-replace warning; warnings line; EVERY failing server check listed. Cancel · Publish now. | 🚩 Flagged (publish) | packages/editor/src/editor/shell/modals/PublishConfirmModal.tsx:85-160; DQ-001 fixed | One title now (was "Publish this site?" / "Update the live site?") |
| 9.6 | Approval gate dialogs | "Waiting on <name>" / "Changes were requested" / "Not sent for review yet" → Open Review / See comments | ✅ Complete | packages/editor/src/editor/shell/modals/PublishGateModal.tsx:58-78; packages/editor/src/editor/shell/AquibraStudio.tsx:890 | Copy reworded around "approval lock" |
| 9.7 | Stale-approval dialog | Opened directly by the gate, before the server refuses. Changed-pages list; "Request fresh review" · "Publish anyway". | ✅ Complete | packages/editor/src/editor/shell/modals/StaleApprovalModal.tsx:108-243; packages/editor/src/editor/shell/lifecycle.ts:400-410 | — |
| 9.8 | Publish outcome toasts | "Published — site is live" + View live; Vercel not connected / connection lost; Publish failed + Try again; Cannot publish; Nothing to publish | ✅ Complete | packages/editor/src/editor/shell/hooks/useExportHandlers.ts:87-188 | — |
| 9.9 | Publish history (History panel) | Live banner, version rows with Compare; a "Republish v5 as v7" action on each row (admin only); progress / success / failure modals | ✅ Complete | packages/editor/src/editor/shell/PublishHistory.tsx:1-699; mounted at packages/editor/src/editor/sidebar/tabs/history/HistoryTab.tsx:23 | Vocabulary shifted from "Roll back" to "Republish"; some strings still say "Rolled back" (PublishHistory.tsx:42-58) |
| 9.10 | Rollback picker modal | Separate version picker screen | ❌ Removed | packages/editor/src/editor/shell/PublishHistory.tsx:9-10 (action is on the row) | — |

## 10. Recovery, errors and save surfaces

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 10.1 | Exit guard dialogs | "Leave with unsaved changes?" (Stay · Leave anyway · Save & leave); "You're offline with unsaved changes"; "Some changes are only on this device" (N queued) | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:457-486, :937-1004 | — |
| 10.2 | Browser leave prompt | Native prompt on refresh/close while dirty, saving, or with queued mirrors | ✅ Complete | packages/editor/src/editor/shell/StudioHeader.tsx:538-564 | — |
| 10.3 | Save-failed banner | Red card over the canvas: "Couldn't save <site> · <page>" + Retry save (or Retry save & leave) · Keep editing. A TOKENS_INVALID variant drops Retry. | ✅ Complete 🆕 | packages/editor/src/editor/shell/SaveFailedBanner.tsx:77-85; packages/editor/src/editor/shell/StudioHeader.tsx:920 | — |
| 10.4 | Recovered-work banner | "Recovered your work · 5 minutes ago · 3 pages" + Discard & reload · Keep changes. Local-only or failed-load sites only. | ✅ Complete | packages/editor/src/editor/shell/RecoveryBanner.tsx:130-137; packages/editor/src/editor/shell/AquibraStudio.tsx:662; L5-074/075 fixed | — |
| 10.5 | "Some work never reached the server" toast | Persistent, with "Restore my edits" | ✅ Complete | packages/editor/src/editor/shell/hooks/useComposerInit.ts:329, :343; L5-076 fixed | — |
| 10.6 | Load-error banner | Session expired (Sign in · Retry), network, site not found / no access (Go to dashboard), Retry → "Reconnecting…" | 🐞 Bug | packages/editor/src/editor/shell/LoadErrorBanner.tsx:95-120 | Not-found copy says "Deleting is permanent — there is no trash to restore from" (:97), but Delete site promises "restore it from Recently deleted for 30 days" (packages/editor/src/editor/shell/modals/DeleteSiteModal.tsx:29) |
| 10.7 | Session-expired dialog | "Your session expired" + "N changes at risk" list; Keep editing · Try saving again · Sign in (new tab) | ✅ Complete | packages/editor/src/editor/shell/modals/SessionExpiredModal.tsx:86-137 | — |
| 10.8 | Conflict dialog | "This site changed somewhere else": Reload latest · Save a backup (JSON download) · Overwrite… → Yes, overwrite. Save pill click reopens it. | ✅ Complete | packages/editor/src/editor/shell/modals/ConflictModal.tsx:70-95; packages/editor/src/editor/shell/AquibraStudio.tsx:809 | — |
| 10.9 | "Open in another tab" notice | Persistent toast "This site is open in another tab" on the second tab | ✅ Complete 🆕 | packages/editor/src/editor/shell/hooks/useOtherTabNotice.ts:34 | — |
| 10.10 | Save toasts | Saved (manual); Saved — site settings didn't; Saved — CMS bindings didn't; offline / unreachable; never loaded (+Reload); site gone; no access; Session expired; Save failed + reason | ✅ Complete | packages/editor/src/editor/shell/hooks/useSaveCallback.ts:104-387; packages/editor/src/editor/shell/hooks/useComposerInit.ts:825-860 | — |
| 10.11 | Page-limit save refusal | "Not saved — page limit reached" + the plan's limit | 🔒 Plan-gated 🆕 | packages/editor/src/editor/shell/hooks/useComposerInit.ts:847-853 | Error toast only; no upgrade door |
| 10.12 | Sync-failure toasts | CMS / component / version / template didn't sync (+Retry now); "<X> changed elsewhere"; "<name> wasn't saved to the server"; "Couldn't load your shared components" | ✅ Complete | packages/editor/src/editor/shell/hooks/useCmsSync.ts:76-164; packages/editor/src/editor/shell/hooks/useComponentSync.ts:52-95; packages/editor/src/editor/shell/hooks/useVersionSync.ts:71 | — |
| 10.13 | Engine error toasts | "Couldn't complete that action", "Couldn't save a local copy", "View only — nothing was changed" | ✅ Complete 🆕 | packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:91-112; DQ-005 fixed | — |

## 11. Global modals hosted by the shell

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 11.1 | Create component | Three fields: "Selected: Page › Name (type)…", Name, Scope (This site / This page), "Also convert N other matching groups" | ✅ Complete | packages/editor/src/editor/shell/modals/CreateComponentModal.tsx:1-175 | Description, category, tags, variant presets and the pre-fill toggle were removed |
| 11.2 | Create collection (CMS) | ONE modal: name, field rows, "Generate a page per entry"; step chips are labels only; "Field removed · Undo"; name-clash notice | ✅ Complete | packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:1-20 | Was two steps. UX-16/17 (opens looking like step 2) — CMS module |
| 11.3 | Records manager modal | "<Collection> — 12 records" table | ❌ Removed | No longer mounted in packages/editor/src/editor/shell/StudioModals.tsx | Replaced by the CMS workspace (1.7) |
| 11.4 | Set up Products collection | Auto-offered on first product block | ✅ Complete | packages/editor/src/editor/shell/StudioModals.tsx:204; "Collection Created" toast packages/editor/src/editor/shell/hooks/useComposerInit.ts:984 | Not re-walked |
| 11.5 | Save page as template | Name + description; "Template saved" toast | ✅ Complete | packages/editor/src/editor/shell/StudioModals.tsx:154; L2-001 fixed | — |
| 11.6 | New page modal | Shell-hosted; opened by every Add-page door (⌘K "New page") | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioModals.tsx:162 | Pages module |
| 11.7 | Site fonts modal | Mounted once, opened from Brand / typography doors | ✅ Complete 🆕 | packages/editor/src/editor/shell/StudioPanels.tsx:1033 | — |
| 11.8 | Upgrade Your Plan | PRO badge, "<Feature> requires the Pro plan", 4 benefits, Maybe Later · Upgrade to Pro | 🔒 Plan-gated | packages/editor/src/editor/chrome-ui/UpgradeModal.tsx:56-95; packages/editor/src/editor/shell/AquibraStudio.tsx:859 | — |
| 11.9 | Permissions dialog | What this role can and can't do. Doors: ⌘K "Permissions" (non-viewers) and the viewer notice. | ✅ Complete 🆕 | packages/editor/src/editor/shell/modals/PermissionsModal.tsx:1; packages/editor/src/editor/shell/PermissionsHost.tsx:37 | ⌘K row appears only when you type it |
| 11.10 | Delete site (owner) | Permissions › Delete this site: confirm → type DELETE. Then "<site> deleted" full screen + "← Back to your sites". | ✅ Complete 🆕 | packages/editor/src/editor/shell/modals/DeleteSiteModal.tsx:1-30; packages/editor/src/editor/shell/PermissionsHost.tsx:81-110 | Deleted screen doesn't mention the 30-day restore |
| 11.11 | Export modal | Formats, preview, code view, ZIP; "Export complete" / "Export failed" | ✅ Complete | packages/editor/src/editor/shell/StudioModals.tsx:165; packages/editor/src/editor/shell/hooks/useExportHandlers.ts:66-73 | Export module |

## 12. Onboarding

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 12.1 | Rail coach mark | White bubble beside the rail: "Everything you build lives behind these six." + Got it. First run only. | ✅ Complete | packages/editor/src/editor/onboarding/RailCoach.tsx:60-100 | UX-02: competes with an Add "Tip 1/4" and the checklist on first open |
| 12.2 | Getting-started chip | 44px plate at the rail foot above Help ("3/7", "Done"); click expands | ✅ Complete 🆕 | packages/editor/src/editor/onboarding/OnboardingChecklist.tsx:84, :296-312 | Moved from the removed footer |
| 12.3 | Checklist panel | 320px panel to the rail's right: "Get started 2/7", progress bar, accordion steps with CTA. Minimise; ✕ asks "Hide this?" | ✅ Complete | packages/editor/src/editor/onboarding/OnboardingChecklist.tsx:106-278 | — |
| 12.4 | Seven steps | Set your brand · Add your first page · Add a block · Connect first client · Send for review · Preview your site · Publish. Ticked by real outcomes; server-mirrored. | 🐞 Bug | packages/editor/src/shared/constants/onboardingSteps.ts:35-70; packages/editor/src/editor/onboarding/OnboardingMount.tsx:224 | The two review steps open Review even when reviews are off for the workspace. That panel then never opens (packages/editor/src/editor/rail/tabsConfig.ts:372; packages/editor/src/editor/sidebar/TabRouter.tsx:241), so 7/7 can't be reached. Static read |
| 12.5 | Progress scope | Progress key is global, not per site — a new site can show "Done" | 🐞 Bug | packages/editor/src/shared/constants/storageKeys.ts:117; L1-015 (DECISION, still live) | — |
| 12.6 | Step-complete prompt | 380px card "Step complete / <step> / Next up / Continue →", auto-dismisses after 4s; final "You're all set" | 🟡 Partial | packages/editor/src/editor/onboarding/AchievementPrompt.tsx:183-224; packages/editor/src/editor/onboarding/useOnboardingOrchestrator.ts:28 | UX-13: blocks the first Preview with a modal milestone |
| 12.7 | Hidden in view mode | Checklist and coach never show in read-only view | ✅ Complete | packages/editor/src/editor/onboarding/OnboardingMount.tsx:268 | — |
| 12.8 | Board coverage | Onboarding has no Figma boards | 🟡 Partial | FG-036 (WONTFIX-REASON) | Design gap for the redesign |

## 13. Command palette (⌘K)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 13.1 | One palette | 640px card with field "Search pages, layers, assets and actions…". Opened by ⌘K, ⌘⇧P alias, ⋯ row, or Pages keycap. Off in view mode and over modals. | ✅ Complete | packages/editor/src/editor/shell/modals/CommandPalette.tsx:1-20; packages/editor/src/editor/shell/StudioHeader.tsx:331, :366 | Canvas palette and Pages palette retired |
| 13.2 | Opening bands | RECENT (last 5) · NAVIGATE · EDIT · VIEW · ADD · TOOLS | 🟡 Partial | packages/editor/src/editor/shell/modals/CommandPalette.tsx:120-260, :506 | UX-23: tall list, navigation first, small text |
| 13.3 | Search-only results | Templates, layers on this page, assets, CMS records, Pages rows, Properties ("Jump to property"), plus every registry command under MORE | ✅ Complete 🆕 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:320-400, :470 | L1-033 rest (DECISION): no insert command per element |
| 13.4 | Disabled rows with reason | e.g. "No changes to undo", "select two or more", "nothing copied" | ✅ Complete | packages/editor/src/editor/shell/modals/CommandPalette.tsx:180-205 | Undo says "No changes…" but Redo says "nothing…" — inconsistent case |
| 13.5 | No results | "Nothing matches 'x'." + "Search stock photos for 'x'" + "Ask AI instead ›" | ✅ Complete 🆕 | packages/editor/src/editor/shell/modals/CommandPalette.tsx:675-681 | — |
| 13.6 | "Scope: everything" chip | Static label beside the field | ⏳ Stub | packages/editor/src/editor/shell/modals/CommandPalette.tsx:656 | Looks like a control, isn't one |
| 13.7 | Clear history | Browser `window.confirm`, then clears the undo stack | 🟡 Partial | packages/editor/src/editor/shell/modals/CommandPalette.tsx:284-296 | Native browser dialog inside a designed product |
| 13.8 | Start collaboration session | Command row when the flag is on | 🚩 Flagged (collab) | packages/editor/src/editor/shell/modals/CommandPalette.tsx:305 | — |
| 13.9 | Legend footer | "Click a command · Esc Close … Current editor" | 🟡 Partial | packages/editor/src/editor/shell/modals/CommandPalette.tsx:733-749 | UX-23: doesn't teach ↑↓/Enter |

## 14. Keyboard

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 14.1 | Keyboard shortcuts sheet (one sheet) | Search field over Selection · Edit · View · Panels · Regions; rows built from the command registry. Doors: `?`, ⌘/, ⌘K, ⋯, legend "All shortcuts ›". | ✅ Complete | packages/editor/src/editor/canvas/controls/KeyboardCheatSheet.tsx:1-173; packages/editor/src/editor/shell/StudioModals.tsx:169 | Two sheets merged into one (B7) |
| 14.2 | Keyboard legend card | Rail Help opens a 280px card: Tab, F6, Esc, ⌘K, rail letters, R, C, ⌘S, ⌘P/⌘J, ⌘Z + "All shortcuts ›" | 🐞 Bug | packages/editor/src/editor/canvas/controls/KeyboardLegend.tsx:17-30 | The ⌘K row says "focuses the shell search — scope follows the open panel", but there's no shell search; ⌘K opens the palette. R and C are listed even when reviews are off |
| 14.3 | Rail / panel letters | A L P M D B, T (Templates), S (Settings), U (Publish), H (History), R (Review, reviews-gated), ⇧A (Components), I (AI). No modifiers, not while typing, not over a modal. | ✅ Complete | packages/editor/src/editor/sidebar/useSidebarKeyboard.ts:24-75 | A bare B, S or T opens a full-screen takeover |
| 14.4 | Global chords | ⌘S save · ⌘Z / ⌘⇧Z / ⌘Y · ⌘P preview · ⌘/ sheet · ⌘J AI · ⌘, Settings · ⌘H History · ⌘⇧P palette · `?` sheet · C comments (reviews-gated) · ⌘\ inspector · ⌃⇧T time travel | ✅ Complete | packages/editor/src/editor/shell/hooks/useEditorShortcuts.ts:40-200; packages/editor/src/editor/shell/TimeTravelHost.tsx:117 | `?` now opens the full sheet (was the canvas cheat sheet). ⌘H is taken by macOS; the menu prints ⌃H |
| 14.5 | F6 / ⇧F6 region cycling | Top bar → rail → drawer → page tabs → canvas/full page → inspector; skips hidden regions | ✅ Complete | packages/editor/src/editor/shell/regionCycle.ts:1; packages/editor/src/editor/shell/hooks/useEditorShortcuts.ts:49 | The legend says "1 → 7", but the footer region is gone |
| 14.6 | Escape to the innermost surface | One `hasOpenEscapeSurface` rule; column panels own Esc via `useColumnPanelEscape` | ✅ Complete | packages/editor/src/editor/shell/hooks/useColumnPanelEscape.ts:1 | — |
| 14.7 | Deep links | `?el=&page=` selects an element; `?settings=<screen>` opens Settings on a screen | ✅ Complete 🆕 | packages/editor/src/editor/shell/hooks/useDeepLink.ts:1 | — |

## 15. Toasts and background behaviour

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 15.1 | Toast stacking rule | One transient toast at a time (newest replaces it); Undo toasts stay ≥8s; error toasts persist and stack above | 🟡 Partial 🆕 | packages/editor/src/editor/chrome-ui/Toast.tsx:1-30; L4-009 PARTLY ("error toasts pile up") | — |
| 15.2 | Undo / redo feedback | "Undo: <what>" + Redo; "Redo: <what>" + Undo; "Nothing to undo"; "Can't undo … newer edits came after it" | ✅ Complete | packages/editor/src/editor/shell/hooks/useHistoryFeedback.ts:177-223 | — |
| 15.3 | Editing / insert / clipboard toasts | Deleted with Undo, copied/cut/pasted, "Inserted: Hero", insert failures | ✅ Complete | packages/editor/src/editor/shell/hooks/useClipboardToasts.ts:1; packages/editor/src/editor/shell/hooks/useBlockInsertion.ts:1 | Not re-walked |
| 15.4 | "Connect to tokens" offer | After a template lands raw values that match tokens: toast with "Connect to tokens" (opens Brand) | ✅ Complete 🆕 | packages/editor/src/editor/shell/hooks/useConnectOfferToast.ts:25 | No board |
| 15.5 | Auto alt-text on upload | Silent AI alt text for uploaded images with no alt | ✅ Complete 🆕 | packages/editor/src/editor/shell/hooks/useAltTextAutoTrigger.ts:1 | Invisible to the user; nothing says it happened |

## Not verified

- Nothing was run. This is a static read of `main` @ 19f964d5e: no live app, no screenshots, no measurement of sizes or colours.
- Rows 5.2 (page-tab "+" in view mode) and 12.4 (onboarding review steps when reviews are off) are inferred from code paths, not reproduced.
- Real publish and Vercel paths (9.5–9.9) and the collab flag paths were not exercised.
- Toast copy for clipboard, insert, review-closed and products-collection (2.8, 11.4, 15.3) was checked only for existence, not word for word.
- Registry chords (⌘\, ⌘⇧E and others) are assumed bound by the engine keyboard manager; the binding was not traced.
- Contents of the Settings, Brand, Templates, Asset library, CMS workspace, Publish, Review, History and Activity panels belong to other modules and were not inventoried here.
- Audit rows marked "ALREADY-FIXED wave4/5/6" were spot-checked by commit ancestry (11 commits, all on HEAD), not each re-verified.

## Status counts

| Status | Count |
|---|---|
| ✅ Complete | 114 |
| 🟡 Partial | 14 |
| 🐞 Bug | 6 |
| 🚩 Flagged | 5 |
| 🔒 Plan-gated | 2 |
| ⏳ Stub | 1 |
| 🧪 Dev-only | 0 |
| ❌ Removed | 14 |
| **Total rows** | **156** |
| of which 🆕 new since 09-16 | 45 |


---

# Canvas — editing surface and canvas interactions

The canvas is the centre column where the user's page is drawn at a breakpoint width and zoom. It handles hover, selection, resize/rotate, inline text editing, drag-and-drop, the right-click / ⋯ element menu, keyboard editing, comment pins and (behind the collab flag) remote cursors. Since 09-16 it has been rebuilt to the v3 IA boards. The floating pill toolbar, bottom breadcrumb, multi-select align bar, canvas ⌘⇧P palette, Add-child modal, AI popover, Watch device, touch drag, Component view and the old Edit/Insert/Layout/Quick-Style menu are all gone. What replaces them: a docked footer bar (↶ ↷ · View ▾ · 100% ▾ · readout), a 3-button ink toolbar, an accent selection tag, and a grouped element menu built from one action registry. The biggest live risks on main are in **resize** (zoom not compensated; Esc undoes the previous edit) and in **duplicate/paste**, which drop responsive and :hover styles.

Paths are relative to `packages/editor/src/` unless they start with `docs/`. "Board" = Figma v3 IA board cited in code.

## 1. Canvas surface & page rendering

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 1.1 | Page card on grey canvas | Page drawn as a white card in a grey padded column. It scrolls internally; when wider than the column it left-aligns and scrolls (`safe center`) | ✅ Complete | editor/canvas/Canvas.tsx:733-913; editor/canvas/Canvas.css:806-814 | Desktop frame floors at 1024px, so at 1440 with drawer+inspector it is wider than the column (L1-012, owner DECISION) |
| 1.2 | Auto fit-to-width on load 🆕 | On first load, a Desktop frame wider than the viewport zooms to fit its width with a 60px gutter | ✅ Complete | editor/canvas/Canvas.tsx:583-594 | Usually puts the user below 100% zoom, which triggers the resize-zoom bug (6.4) |
| 1.3 | Click grey surround to deselect 🆕 | Clicking the grey area around the page clears the selection and emits a background click (closes Layers) | ✅ Complete | editor/canvas/Canvas.tsx:681-688 | |
| 1.4 | Page links/forms can't navigate the editor 🆕 | Clicking a link or submitting a form inside the page never leaves the editor | ✅ Complete | editor/canvas/hooks/useCanvasNavigationGuard.ts; Canvas.tsx:114-123 | |
| 1.5 | Live widget runtimes on canvas 🆕 | Sliders autoplay/arrows/dots, countdowns tick, accordions open/close on the canvas as on the live site | ✅ Complete | editor/canvas/Canvas.tsx:505-511 | |
| 1.6 | CMS-bound content preview + Collection list repeat 🆕 | Bound fields show record values; a Collection list repeats its card per record. Copies 2..N can't be clicked | 🟡 Partial | editor/canvas/hooks/useCMSPreview.ts; Canvas.css:830-846 | L3-017 (DECISION): canvas shows draft records and raw `{{item.*}}` when empty, while publish shows only published records |
| 1.7 | Element animations + global custom CSS live on canvas | Inspector animations play; Settings → Advanced custom CSS applies live | ✅ Complete | editor/canvas/Canvas.tsx:779-782 | |
| 1.8 | Locked element styling | 2px dotted muted outline + not-allowed cursor. It survives re-renders, and the menu Lock now styles it too | ✅ Complete | editor/canvas/Canvas.css:253-264; hooks/useCanvasEditorFlags.ts (fix 948197059, L1-006) | Pink dotted outline from 09-16 is gone (banned colour, DQ-022) |
| 1.9 | Hidden (Layers eye) element | Drawn at 25% opacity, ignores the mouse, still selectable from Layers | ✅ Complete | editor/canvas/Canvas.css:284-287 | |
| 1.10 | Hidden-per-breakpoint | Element hidden for the active breakpoint disappears on canvas | ✅ Complete | editor/canvas/Canvas.css:790-800 | |
| 1.11 | Empty container / columns placeholder | 60px dashed grey box reading "Drop a block here, or select this box and use +" | 🐞 Bug | editor/canvas/Canvas.css:136 | Stale copy: the "+" (Add child) button was removed from the selection toolbar (UnifiedSelectionToolbar.tsx:6-13), so the hint names a control that no longer exists |
| 1.12 | Empty column label | Empty column shows "Column" | ✅ Complete | editor/canvas/Canvas.css:212 | |
| 1.13 | Src-less image placeholder | Grey slab with picture glyph, no broken-image icon/alt | ✅ Complete | Canvas.css:88-100 (fix 552c0243e, L1-016) | |
| 1.14 | Drop/insert flash + settle animation | New element fades/settles; duplicated element glows | ✅ Complete | editor/canvas/Canvas.css:624-643; hooks/useSelectionAnimation.ts | |
| 1.15 | Layers-row hover highlights canvas element | Hovering a Layers row tints the element. Canvas hover also highlights the Layers row | ✅ Complete | editor/canvas/hooks/useCanvasHover.ts:66; Canvas.tsx:451-456 | |
| 1.16 | Read-only / view mode | Canvas renders and click-select works. No edit, drag, drop, context menu, keys, selection chrome, footer bar, empty CTA or container hints. Comment pins still work | ✅ Complete | editor/canvas/Canvas.tsx:725-752; overlays/CanvasOverlayGroup.tsx:244 | |
| 1.17 | "Pick an element" mode (inspector crosshair) | Crosshair over the whole canvas; next click picks the element and hands it to the panel; Esc cancels | ✅ Complete | editor/canvas/Canvas.tsx:222-244, 655-674; Canvas.css:280-282 | |
| 1.18 | Screen-reader live region | One polite region announces selection changes and inserts | ✅ Complete | editor/canvas/Canvas.tsx:977-985 | The hook drops repeats of its own message (noted in Canvas.tsx:642-645) |

## 2. Breakpoints, preview width & device frame

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 2.1 | Breakpoint switch (Desktop / Tablet 768 / Mobile 375) | Chosen via **View ▾ › Breakpoint**. The W/D/T/M segmented switcher is gone | 🟡 Partial | editor/canvas/CanvasFooterToolbar.tsx:146-150, 392-440 | UX-06 (High): the active breakpoint is not visible on the bar; it only reads "View · N". Top redesign item |
| 2.2 | Wide (1920) breakpoint | No longer offered in the canvas (table entry and chrome-ui switcher remain, used only by Preview) | ❌ Removed | shared/constants/breakpoints.ts:104; CanvasFooterToolbar.tsx:146 | FG-029 (DECISION): the Figma board still draws Wide |
| 2.3 | Watch device | Deleted | ❌ Removed | commit 3bddeb0db (C4 #26) | |
| 2.4 | Real-width Tablet/Mobile + re-fit on switch 🆕 | Switching breakpoint re-fits zoom: 100% if the frame fits, else fit to width | ✅ Complete | editor/canvas/Canvas.tsx:595-609 | |
| 2.5 | Width label under page 🆕 | "768px" / "375px" / custom width printed under the page for non-desktop | ✅ Complete | editor/canvas/Canvas.tsx:902-910 | |
| 2.6 | Custom width… 🆕 | View › Breakpoint › Custom width… opens a modal ("Preview width", 240–2560 px, Apply/Cancel). Canvas previews that width in the breakpoint it falls into | ✅ Complete | editor/canvas/controls/CustomWidthModal.tsx:12-91; Canvas.tsx:715-722, 945-953 | Preview-only; dropped on any other device pick |
| 2.7 | Device frame (phone/tablet bezel) | Toggle at the far right of the footer row on Tablet/Mobile only. Dark device shell with notch/home bar (mobile) | 🟡 Partial | editor/canvas/DeviceFramePreview.tsx:54-80, 223-275 | Hand-rolled inline-style button outside chrome-ui; its hover tint is white 8% on a white bar (invisible) |
| 2.8 | "Desktop" means three widths | Canvas 1024 min, Preview 1320, Export 1440 | 🟡 Partial | L1-013 (DECISION wave4) | Pick one Desktop width in the redesign |

## 3. Zoom

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 3.1 | Zoom menu "100% ▾" on the bar 🆕 | Opens Fit to screen · 50 · 75 · 100 · 150 · 200% | ✅ Complete | editor/canvas/CanvasFooterToolbar.tsx:155, 266-299, 496-520 | Menu has no 10/25/400, no Zoom in/out, no "Zoom to selection" row, though all are bound by key |
| 3.2 | View › Zoom submenu | Same rows inside the View menu | ✅ Complete | CanvasFooterToolbar.tsx:402-404, 441 | Duplicate door |
| 3.3 | Zoom keys ⌘0 / ⌘1 / ⌘2 / ⌘= / ⌘- | 100% · fit · zoom to selection · next/previous preset (10–400) | ✅ Complete | CanvasFooterToolbar.tsx:195-251; shared/constants/canvas.ts:360-368 | One step rule now (G2-016) |
| 3.4 | Zoom to fit / zoom to selection | Fit = whole page with 64px breathing room; selection = fit selected box and centre it (also ⌘K) | ✅ Complete | editor/canvas/Canvas.tsx:318-361 | Fit clamps to 500% in code but the engine caps at 400 (config.ts:88), so harmless |
| 3.5 | Zoom-aware overlays | Hover, selection, toolbar and tag compensate for zoom; toolbar/CTA counter-scale to stay 1:1 | 🟡 Partial | overlays/ElementHoverOverlay.tsx:120-128; controls/UnifiedSelectionToolbar.tsx:85-100 | The marquee rectangle is not compensated (7.6), and resize math is not either (6.4) |

## 4. Empty, loading and unavailable states

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 4.1 | Empty-page CTA (rebuilt) 🆕 | "This page is empty" / "Start with a template, drop a block, or describe your site." with 3 template cards, then **Browse all templates** (primary) · Add a block · ✦ Describe your site · Start blank | 🟡 Partial | editor/canvas/CanvasEmptyCTA.tsx:63-140; Canvas.tsx:820-847 | UX-01 (High): clips at 1280×720. UX-02: competes with onboarding tips |
| 4.2 | Template cards in empty CTA | Clicking a named card only opens the Templates panel. It does not preview or apply that template | 🟡 Partial | editor/canvas/CanvasEmptyCTA.tsx:93-99 | UX-03: the chosen intent is lost |
| 4.3 | Add a block / Describe your site doors 🆕 | Add a block opens the Add drawer on BLOCKS; Describe opens Add's AI block generator | ✅ Complete | editor/canvas/Canvas.tsx:829-841 | AI needs a configured provider |
| 4.4 | Start blank | Opens the Add drawer and hides the CTA. The 09-16 "state B" sentence is gone | ✅ Complete | editor/canvas/Canvas.tsx:842-845 | |
| 4.5 | Loading skeleton | Grey skeleton bars while the project loads; SR "Loading your site" | ✅ Complete | editor/canvas/CanvasLoadingSkeleton.tsx; Canvas.tsx:611, 805 | |
| 4.6 | Project unavailable | CTA suppressed; the shell banner explains | ✅ Complete | editor/canvas/Canvas.tsx:540-548, 576 | |

## 5. Hover

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 5.1 | Default hover | 1px dashed pale-accent outline + small grey name pill 18px above + small drag grip | ✅ Complete | editor/canvas/overlays/ElementHoverOverlay.tsx:200-247 | |
| 5.2 | Alt-hover "hierarchy" | Solid outline + dark "Parent › Element" pill + full grip; zoom-in cursor | ✅ Complete | ElementHoverOverlay.tsx:255-336; hooks/useCursorIntelligence.ts:70 | Hidden power feature with no visible door |
| 5.3 | Alt+Shift hover "box model" | Orange margin / green padding / blue content + value chips + info badge (name, link/flex/grid tags, parent, W×H, first class) + "Double-click to edit" | ✅ Complete | ElementHoverOverlay.tsx:342-406; ElementHoverOverlaySubComponents.tsx:191-252 | The 📊 CMS glyph from 09-16 is gone. Badge uses raw hex (#a5f3fc/#f9e2af) |
| 5.4 | Clone badge (⌘/Ctrl held) | Green ⊕ at element's top-right: "drag will duplicate" | ✅ Complete | ElementHoverOverlay.tsx:412-425 | |
| 5.5 | "Inspector mode" (force box-model, I key) | Toggle not mounted anywhere; code path gone | ❌ Removed | no `inspectorMode` in src (grep) | |
| 5.6 | Hover drag grip | Grip left of element; mouse-down drags it | ✅ Complete | editor/canvas/overlays/DragHandle.tsx | |

## 6. Selection, resize, rotation

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 6.1 | Selection box | 2px accent box around the selected element | ✅ Complete | editor/canvas/overlays/SelectionBoxOverlay.tsx:355-404 | |
| 6.2 | Selection tag 🆕 | Accent "Type · layer name" tag at the element's top-left, scaled with the page (replaces the 09-16 compact label with ancestor dropdown). Page root reads "Page · name" | ✅ Complete | editor/canvas/overlays/SelectionLabel.tsx:1-84 (fix ffe303b3a, L1-021) | Parent/ancestor picking moved to Layers / ← key / inspector ⋯ |
| 6.3 | Resize handles | 4 corners always; top/bottom edges when width >50; left/right edges now also on short elements | ✅ Complete | editor/canvas/overlays/SelectionHandles.tsx:90-195 (fix 8195b5628, L1-019) | |
| 6.4 | Resize at zoom ≠ 100% | Resize reads `getBoundingClientRect` (zoomed screen px) and writes those px as CSS width/height with no zoom division. At the default fit zoom (~60%) the first drag shrinks the element | 🐞 Bug | engine/canvas/canvasGeometry.ts:53-64; engine/canvas/resize/DOMUpdater.ts:27-28,117-118; ResizeHandler.ts:101 | Matches the 10-14 P0 "canvas resize zoom". Still on main |
| 6.5 | Esc cancels resize | Esc restores the DOM, then calls `history.undo()`. The model is only written on mouse-up, so no undo entry exists yet, and the undo removes the user's **previous unrelated edit** | 🐞 Bug | engine/canvas/ResizeHandler.ts:254-275 (undo at :266); model write only in finishResize :346-376 | 10-14 P0 "Escape-cancel undo", still on main |
| 6.6 | NaN risk in resize math | Aspect ratio = w/(h‖1) and multi-scale divides by start width/height. A 0-width element or aspect-locked image can produce Infinity/NaN sizes | 🐞 Bug | engine/canvas/ResizeHandler.ts:148; resize/resizeMath.ts:95-101, 199-200 | Code-read only, not reproduced |
| 6.7 | Resize modifiers & constraints | Shift = keep ratio (media always); Alt = from centre; Ctrl flips grid snap; edge/centre snapping; per-type minimums; writes at the active breakpoint through the lock gate; one undo step | ✅ Complete | engine/canvas/ResizeHandler.ts:88-176; fix e2e0d5e73 (L1-004) | Subject to the 6.4/6.5 bugs |
| 6.8 | Multi-select resize | Handles are drawn on the combined box, but the drag resizes only the primary element | 🐞 Bug | editor/canvas/overlays/SelectionBoxOverlay.tsx:125-134, 467-476 (startMultiResize never called) | Hide handles in multi-select or wire `startMultiResize` (ResizeHandler.ts:200) |
| 6.9 | Rotation handle | Stem + circle above the box; drag rotates; Shift = 15° snap; SR slider 0–360 | ✅ Complete | SelectionBoxOverlay.tsx:478-530 | |
| 6.10 | Size label while resizing | Accent "W × H" pill under the box | ✅ Complete | SelectionBoxOverlay.tsx:545 | During resize the box uses engine (screen-px) bounds, so it is misplaced at zoom ≠100 (6.4) |
| 6.11 | CMS-bound badge | Small accent database circle at top-left; tooltip "Element has CMS binding" | ✅ Complete | SelectionBoxOverlay.tsx:405-438 | |
| 6.12 | Locked badge | Amber padlock above the box; no handles/rotation; tooltip "Element is locked. Unlock in Layers panel." | ✅ Complete | SelectionBoxOverlay.tsx:440-466 | Copy differs from the click toast ("…in the inspector or in Layers") |
| 6.13 | Selection toolbar (rebuilt) 🆕 | Ink pill with 3 buttons: Duplicate (⌘D) · Delete (⌫) · ⋯ More (opens the element menu at the button). Sits inside the element's top-right; moves outside/above on small elements; clamped to the visible viewport | ✅ Complete | editor/canvas/controls/UnifiedSelectionToolbar.tsx:66-213 (fixes 5c0053cf6 L1-003/L2-007, 15d3a1b95) | |
| 6.14 | Toolbar caption | "⧉ Duplicate ⌘D · 🗑 Delete ⌫ · ⋯ More" printed under the pill, over the content | 🟡 Partial | UnifiedSelectionToolbar.tsx:203-210 | L2-035 / UX-07: the hint overlaps the content being edited |
| 6.15 | Select parent / ancestor dropdown / + Add child / Copy / Wrap / Move up-down / ✦ Edit with AI on toolbar | All removed from the toolbar. Now in Layers, ← key, the element menu, and the inspector's ✦ AI | ❌ Removed | UnifiedSelectionToolbar.tsx:6-13 | |
| 6.16 | "Add Child Element" picker modal | Deleted with the Element Picker | ❌ Removed | commit 09426507a (G2-115/116) | |
| 6.17 | "Edit with AI" popover (248px diff card) | Removed from the canvas; AI edits run in the AI panel / inspector ✦ | ❌ Removed | UnifiedSelectionToolbar.tsx:13 | |
| 6.18 | Bottom breadcrumb bar | Removed (board draws none) | ❌ Removed | commit 5fbd2e50d | Hierarchy now lives only in Layers and the tag; consider a path in the readout |
| 6.19 | Footer selection readout 🆕 | Right end of the bar: "Section · Hero · 680 × 250" | ✅ Complete | editor/canvas/CanvasFooterToolbar.tsx:530-538; hooks/useSelectionReadout.ts | |
| 6.20 | Click / Shift-click / ⌘-click cycle / double-click child / triple-click innermost | As 09-16; locked click toasts "This element is locked. Unlock it here in the inspector or in Layers." | ✅ Complete | editor/canvas/hooks/useSelectionBehavior.ts:25-190 | Triple-click was dropped from the shortcut sheet |
| 6.21 | Spacing "spots" (click-to-edit margin/padding) | With Spacing on: dashed margin/padding boxes with px chips; click → numeric field; Enter/blur commits at the active breakpoint via the lock gate; Esc cancels | ✅ Complete | editor/canvas/spots/CanvasSpotSpacing.tsx:20-118 | The 09-16 "auto-on at first selection" is gone; default off (useStudioState.ts:260) |

## 7. Multi-select & marquee

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 7.1 | Multi-select box | Dashed combined box; primary solid, others dashed; no rotation/badges | ✅ Complete | SelectionBoxOverlay.tsx:120-170, 360-404 | See 6.8 for the handles |
| 7.2 | Canvas multi-select align/distribute toolbar | Removed from the canvas; Align ×6 / Distribute ×2 live in the inspector multi-select state | ❌ Removed | overlays/CanvasOverlayGroup.tsx:278-291 | |
| 7.3 | Toolbar hidden in multi-select | Duplicate/Delete/More pill only for one element | 🟡 Partial | CanvasOverlayGroup.tsx:268 | No on-canvas door for multi actions; right-click a member keeps the selection (G2-056) |
| 7.4 | Multi-delete confirm 🆕 | Deleting more than one element asks first ("N elements"), then one transaction + Undo toast | ✅ Complete | editor/canvas/DeleteSelectionConfirm.tsx:17-41 | |
| 7.5 | Marquee (rubber-band) select | Drag on empty canvas past 5px: accent rectangle; release selects every intersecting element at any depth | 🟡 Partial | editor/canvas/hooks/useCanvasMarquee.ts:56-180 | Only starts outside any `[data-buildrick-id]`, and the page root fills the page, so in practice only the 20px padding strip works. It also selects parent and children together |
| 7.6 | Marquee drawing at zoom ≠ 100% | The rectangle is drawn in screen px inside the scaled overlay layer, so it lags the pointer at fit zoom | 🐞 Bug | useCanvasMarquee.ts:72-74, 88-90; canvasStyles.ts:126-138 (no scale division, unlike ElementHoverOverlay.tsx:121-127) | Code-read; not live-verified |

## 8. Inline text editing

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 8.1 | Double-click to edit text | Leaf text elements (p, h1–h6, span, a, button, li, td…) become editable with text selected; locked refuses | ✅ Complete | editor/canvas/hooks/useCanvasInlineEdit.ts:33-90 | |
| 8.2 | Inspector "Edit text on canvas" 🆕 | Inspector button starts the same inline edit | ✅ Complete | useCanvasInlineEdit.ts:124 (UI_INLINE_EDIT_REQUEST); commit a4c969ba6 | |
| 8.3 | Floating rich-text toolbar | 52px above: Text style (P/H1–H6) · size (10–48px) · B I U S · bullets/numbers · align ×4 · indent ±· text colour · highlight · link (https only, Remove/Apply) · clear | ✅ Complete | editor/panels/RichTextEditor.tsx:98-310; overlays/CanvasOverlayGroup.tsx:302-324 | Inline-style toolbar, not chrome-ui |
| 8.4 | Commit / cancel | Enter or outside left-click commits (sanitised, one undo step, autosave); Esc restores | 🟡 Partial | useCanvasInlineEdit.ts:156-211 | Enter (even Shift+Enter) always commits, so there are no line breaks and the toolbar's bullet/numbered lists can't get a second item |
| 8.5 | "Type here..." placeholder | Emptied text shows an italic placeholder | ✅ Complete | editor/canvas/Canvas.css:729 | |

## 9. View overlays (View ▾ menu)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 9.1 | View ▾ menu 🆕 | One menu replaces the 09-16 word-toggle bar: Snap guides ⌘; · Spacing ⌘⇧; · Grid (px ▸) · Rulers ⌘R · Badges ⌘B · X-Ray ⌘⇧X, then Breakpoint ▸ / Zoom ▸. Trigger shows "View · N" when overlays are on | ✅ Complete | editor/canvas/CanvasFooterToolbar.tsx:130-137, 338-495 | UX-06: mixes overlays with breakpoint, a core task |
| 9.2 | Overlay chords | ⌘; ⌘⇧; ⌘' ⌘R ⌘B ⌘⇧X toggle (⌘R overrides browser reload) | ✅ Complete | CanvasFooterToolbar.tsx:238-247 | Also fire behind full-page tools (see 13.10) |
| 9.3 | Snap / smart guides | While dragging/resizing: magenta alignment lines + red equal-gap / parent-padding labels; 1px at any zoom | ✅ Complete | editor/canvas/overlays/SmartGuidesOverlay.tsx:37-46; hooks/drag/useDragSnapGuides.ts | |
| 9.4 | Grid overlay + Grid size 🆕 | View › Grid opens Show grid ⌘' · Size 4/8/16 px · Custom (1–100) | 🟡 Partial | CanvasFooterToolbar.tsx:442-493; overlays/GridOverlay.tsx:20 | Composer default is 10px, which is not a preset; the row shows "8 px ▸" only when size is unknown |
| 9.5 | Snap-to-grid follows Grid 🆕 | One switch: Grid on = nudge/resize snap to grid (separate setting removed) | ✅ Complete | editor/canvas/Canvas.tsx:426-430 | |
| 9.6 | Rulers + guides | Light rulers with ticks; click or drag out of a ruler places a guide; drag moves; double-click removes; locked guides can't move | ✅ Complete | editor/canvas/overlays/RulersOverlay.tsx:55-80, 146-186; overlays/GuidesOverlay.tsx:42-121 | |
| 9.7 | Guides saved with the site 🆕 | Ruler guides persist in the project | ✅ Complete | editor/canvas/hooks/useCanvasGuides.ts:6, 44 | |
| 9.8 | Badges | Hover shows an accent type chip at the element's bottom-right | ✅ Complete | editor/canvas/Canvas.css:691-700 | |
| 9.9 | X-Ray | Wireframe: outlines, no fills, greyscale faded media | ✅ Complete | editor/canvas/Canvas.css:656-690 | |
| 9.10 | Component view / Outlines / Dev mode | Deleted | ❌ Removed | commits 3bddeb0db, 79cb2a2ce | |
| 9.11 | Overlay state remembered | Overlay toggles persist in saved studio state | ✅ Complete | editor/shell/hooks/useStudioState.ts:260-323 | |

## 10. Canvas footer bar

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 10.1 | Docked footer bar 🆕 | A 44px white bar flush to the canvas column's bottom, full width: ↶ ↷ · View ▾ · 100% ▾ · readout · device-frame toggle | ✅ Complete | editor/canvas/CanvasFooterToolbar.tsx:115-124, 301-540; canvasStyles.ts:152-164 | Owner override 2026-10-03 (board drew a floating card). The status footer was removed (83854c5e3) |
| 10.2 | Undo / Redo buttons | Icon buttons, tooltips "Undo · ⌘Z" / "Redo · ⌘⇧Z", muted when unavailable | ✅ Complete | CanvasFooterToolbar.tsx:304-337 | |
| 10.3 | Inspector toggle on bar | Removed; now ⌘\ / ⌘K "Toggle inspector" / inspector ✕ | ❌ Removed | CanvasFooterToolbar.tsx:15-18; engine/commands/defaultCommands.ts:565 | |
| 10.4 | Help (?) button on bar | Removed; Help lives on the rail (opens the Keyboard legend card) | ❌ Removed | commit 83a54a44e; editor/canvas/controls/KeyboardLegend.tsx | |
| 10.5 | Toasts anchored to canvas | Toasts sit bottom-right of the canvas column, 16px above the bar | ✅ Complete | editor/canvas/Canvas.tsx:730-739, 917 | |

## 11. Element menu (right-click and ⋯ More)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 11.1 | Open by right-click / Shift+F10 / toolbar ⋯ 🆕 | Right-click selects (or keeps a multi-selection if you hit a member) and opens at the pointer; ⋯ opens under the button. Right-click on a padding strip works | ✅ Complete | editor/canvas/Canvas.tsx:691-713, 875; hooks/useCanvasKeyboard.ts:114 | The ⋯ door that 09-16 said was missing now exists |
| 11.2 | Menu structure (rebuilt) 🆕 | ✦ Improve with AI · Duplicate · Delete │ Arrange › · Style › · Structure › │ Lock/Unlock · Group/Ungroup · Bind to CMS field… │ Add interaction. Built on chrome-ui Menu | ✅ Complete | editor/canvas/menus/contextMenuRegistry.ts:39-68 (DQ-018 3aaf24f47) | IA-02: clipboard is buried under Structure, Delete sits at the top next to AI |
| 11.3 | Keyboard in menu | ↑/↓, → / Enter / Space opens a submenu, ← / Esc returns, Tab closes from either level | ✅ Complete | editor/canvas/menus/ElementContextMenu.tsx:150-215 (fixes IA-01, 196fd33f7) | |
| 11.4 | Menu viewport clamping | Submenu flips left/up near edges, but the main menu is placed at raw clientX/Y with no clamp, so near the bottom/right edge it overflows the viewport | 🐞 Bug | ElementContextMenu.tsx:93-96 (submenu), :185 (main, unclamped) | IA-15 (Medium), still on main |
| 11.5 | Disabled-row reasons | Registry reasons ("Unlock it to replace it") are flattened to a boolean, so a greyed row says nothing | 🟡 Partial | editor/canvas/menus/actions/standaloneActions.ts:12-14; shared/elementActions.ts:232 | IA-03 |
| 11.6 | Duplicate / Delete rows | Shared engine commands (whole selection, lock-filtered); multi-delete confirms; toasts with Undo | ✅ Complete | menus/actions/editActions.ts:95-97; shared/elementActions.ts:107-188 | |
| 11.7 | Structure › Copy / Cut / Paste | Engine copy/cut/paste plus the OS clipboard as JSON; Paste greyed when the clipboard is empty; one toast via useClipboardToasts | ✅ Complete | menus/actions/editActions.ts:1-94 (fixes e1c08107e, d6c066144 L1-018) | |
| 11.8 | Structure › Wrap in container / Unwrap element | Wrap refuses locked with a reason; Unwrap greyed unless it has children; both one undo step through the lock gate | ✅ Complete | menus/actions/insertActions.ts:1-40 (fc052ec41) | |
| 11.9 | Structure › Replace with block… | Section-shaped elements only; greyed when locked; opens Add on Blocks in replace mode (replaces in place) | ✅ Complete | shared/elementActions.ts:226-237; commit b57aa51f1 | |
| 11.10 | Structure › Save as component… | Opens Create Component for the element/selection | ✅ Complete | shared/elementActions.ts:156-160 | |
| 11.11 | Arrange › Bring to front / forward / Send backward / to back | ⌘⇧] ⌘] ⌘[ ⌘⇧[ — one undo step | ✅ Complete | menus/actions/layoutActions.ts:1-56 | Moves DOM order (sibling index), not z-index; label implies layers |
| 11.12 | Style › Copy style / Paste style | ⌘⌥C / ⌘⌥V; Paste style disabled until copied | ✅ Complete | menus/actions/styleActions.ts; shared/elementActions.ts:117-133 | Reset style exists only in the inspector ⋯ |
| 11.13 | Lock / Unlock | One row by state, via the engine lock command | ✅ Complete | shared/elementActions.ts:163-176 | |
| 11.14 | Group (⌘G) / Ungroup (⌘⇧G) | Group shows for 2+ selected; Ungroup for a plain container with children | 🐞 Bug | menus/actions/standaloneActions.ts:24-56; engine/commands/defaultCommands.ts:124-150; engine/elements/ElementManager.ts:212-252 | Both skip the lock gate (`writableElements`), so locked elements can be grouped and a locked container dissolved. Code-read |
| 11.15 | Bind to CMS field… | Text/heading/paragraph/image/button/link: selects and focuses the inspector's CMS binding section | ✅ Complete | shared/elementActions.ts:201-213 (fix 9fd100c77) | |
| 11.16 | Add interaction | Selects and focuses the inspector's Interactions section | ✅ Complete | shared/elementActions.ts:214-224 | |
| 11.17 | Improve with AI | Shown only when AI is available; opens the AI panel scoped to the element | ✅ Complete | shared/elementActions.ts:192-200 | L5-016 (DECISION): no one-click rewrite/shorten/tone actions |
| 11.18 | Insert before / after / inside (First/Last), Wrap in section | Removed from the menu | ❌ Removed | contextMenuRegistry.ts:33-38; actions/insertActions.ts | Add is now via the Add drawer only |
| 11.19 | Layout "make it…" rows (flex row/column, grid 2 cols, center, space between) | Removed | ❌ Removed | actions/layoutActions.ts (ordering only) | |
| 11.20 | Quick Style presets (padding/margin/border/background/shadow) + Reset all styles | Removed from the canvas menu (Reset style kept in the inspector ⋯) | ❌ Removed | actions/styleActions.ts; shared/elementActions.ts:146-153 | |
| 11.21 | Reveal in layers / Select parent rows | Removed from the menu (← key and Layers remain) | ❌ Removed | contextMenuRegistry.ts:39-68 | |
| 11.22 | Menu closes on deselect / delete / scroll / resize | Closes when its element is deselected or deleted, on scroll or window resize, or Esc / outside click | ✅ Complete | hooks/useCanvasContextMenu.ts:65-82; Canvas.tsx:628-638 | |
| 11.23 | Windows shortcut hints | Hints keep "+" on Windows now | ✅ Complete | menus/shortcutHint.ts; commit 9d7991d37 | 09-16 "CtrlAltC" quirk fixed |

## 12. Drag & drop

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 12.1 | Drop target highlight | Valid: 2px dashed accent + tint; invalid: 2px solid red + tint | ✅ Complete | editor/canvas/overlays/DropFeedbackOverlay.tsx:180-197 | |
| 12.2 | Between-elements cue 🆕 | Insertion line + accent **"Drop here"** pill centred on it (tooltip "Insert before/after X") | ✅ Complete | DropFeedbackOverlay.tsx:199-218, 382-401 | Replaces 09-16 "Insert before X" dark label for before/after |
| 12.3 | Inside cue | "Insert inside X" dark label + slot preview + "Drop inside: A › B › C" path pill (≥2 deep) + "Level N" (≥3 deep) | ✅ Complete | DropFeedbackOverlay.tsx:208-230, 403-470 | |
| 12.4 | Add-drawer drag "Drop into" cue 🆕 | While dragging an Add row over a container: accent outline, "Drop into · Hero › Content" tag, 2px line, "{El} — release to place inside {X}" + "Esc — cancel insert" chips; also announced in the drawer/readout | ✅ Complete | DropFeedbackOverlay.tsx:338-380; overlays/CanvasOverlayGroup.tsx:171-182; canvas/insertDrag.ts | |
| 12.5 | Invalid-drop badge + messages | Red pill: Cannot have children · Text cannot contain elements · Cannot drop inside itself / child · Max depth reached · Not allowed here · Cannot nest interactive · Cannot place here · fallback "Cannot drop here"; announced | ✅ Complete | shared/utils/dragDrop/dropValidation.ts:22-30; DropFeedbackOverlay.tsx:336 | |
| 12.6 | Drop sources: Add element/block, saved component, catalog component, template, media asset, OS image file | Each inserts at the pointer or the nearest legal parent | ✅ Complete | editor/canvas/hooks/drag/dropOperations.tsx:86-621; drag/useDropExecution.ts:105-295 | Catalog drop is still a placeholder container (v1) |
| 12.7 | Insert toast "X added" + Undo 🆕 | A successful drop now shows a toast with Undo (newest replaces) | ✅ Complete | editor/canvas/Canvas.tsx:155-171 | |
| 12.8 | Media drop toast text | Media/OS-file success labels already end in "added ✓" / "applied ✓", and Canvas appends " added", so the toast reads "photo.jpg added ✓ added" | 🐞 Bug | drag/useDropExecution.ts:128-130, 280-282; Canvas.tsx:164-165 | New since the toast change; code-read |
| 12.9 | Media drop inserts an image (not src on section) | Library tile/asset dropped on a section inserts an image; dropped on an image/background replaces it; no re-upload | ✅ Complete | drag/mediaDrop.ts:35-76 (fix 2cb6d3a43, L4-001/L4-002) | |
| 12.10 | OS image drop | "Uploading file.png..." info toast, then insert/replace; "only on this device" warning for local-only | ✅ Complete | drag/useDropExecution.ts:240-292 | |
| 12.11 | Drop while inline editing | Refused: "Cannot drop while editing text" | ✅ Complete | drag/useDropExecution.ts:199 | |
| 12.12 | Auto-scroll near edges | Canvas scrolls when the pointer nears the viewport edge | ✅ Complete | hooks/useDragAutoScroll.ts; hooks/useElementDragAutoScroll.ts:45-65 | |
| 12.13 | Nesting rules | One validator plus a nesting guard on every engine write and load repair; 30-level ceiling; no interactive-in-interactive | ✅ Complete | shared/utils/dragDrop/dropValidation.ts; commit f8775594c (one nesting ceiling) | Table in 09-16 §2.5 not re-derived (see Not verified) |

## 13. Moving elements, section reorder, keyboard

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 13.1 | Drag-move an element | Element fades to 40%; ghost card with uppercase type chip; lands where the indicator shows; one undo step; locked refused | ✅ Complete | hooks/useCanvasElementDrag.ts:187-340 (fixes af8f870bc L1-010, fc052ec41 L1-005, 8ad1841d7 L2-038) | |
| 13.2 | ⌘/Ctrl-drag clone | A duplicate is created and dragged ("+ TYPE" chip) | 🐞 Bug | useCanvasElementDrag.ts:212-238, 368-393 | Uses `duplicateElement`, so it loses responsive/:hover styles (13.4). A cancelled clone-drag also leaves the copy in place (dragend never removes it) |
| 13.3 | Multi-element drag | Dragging a member moves the whole selection in order | ✅ Complete | useCanvasElementDrag.ts:241-270 | |
| 13.4 | Duplicate / paste keep styles | Clone copies element data with new ids, but breakpoint (Tablet/Mobile) and state (:hover/:focus) rules are stored in StyleEngine against `[data-buildrick-id="<old id>"]` and are not copied. The duplicate or paste looks right on Desktop/base and loses responsive and hover styling | 🐞 Bug | engine/elements/manager/ElementCRUD.ts:227-253, 273-288; engine/elements/ElementManager.ts:365-372; engine/styles/StyleEngine.ts:84-103, 253 | 10-14 P0 "duplicate drops responsive+hover", still on main; affects ⌘D, toolbar/menu Duplicate, ⌘V, clone-drag |
| 13.5 | Touch (tablet) long-press drag | Deleted | ❌ Removed | commit 3bddeb0db | |
| 13.6 | Section reorder grips | Accent grip on section boundaries (first section too); slot cue; Esc cancels; "Moved up/down" toast + Undo; keeps the section selected; no longer eats left-edge clicks | ✅ Complete | overlays/SectionReorderHandles.tsx:128, 209; hooks/useSectionReorder.ts:42, 291-295 (fixes 2a272c24f, 526ff717d L1-011) | |
| 13.7 | Arrow-key selection nav | Tab/⇧Tab next/prev; ↑↓ siblings; ← parent; → first child; Home/End | ✅ Complete | hooks/useCanvasKeyboard.ts:92-112, 178-255 | Canvas must have focus |
| 13.8 | Keyboard nudge (⇧/⌘ + arrows) | Moves **positioned** elements only (10px / 1px); in-flow elements get the toast "This element sits in the page flow. Set Position to move it with the arrow keys." | ✅ Complete | useCanvasKeyboard.ts:160-176, 185-230 (G2-047, dcaa0aa54 L1-038) | Changed from 09-16 (transform nudge removed) |
| 13.9 | ⌥↑/⌥↓, ⌥Home/⌥End reorder | Move among siblings | ✅ Complete | useCanvasKeyboard.ts:191-255 | |
| 13.10 | ⌘Z / ⌘⇧Z / ⌘Y and canvas chords behind full-page tools | Global undo/redo (and zoom/overlay chords) stand down only for `aria-modal` dialogs. Full-page tools (CMS, Brand, Settings…) are not modal, so ⌘Z there silently undoes hidden canvas edits | 🐞 Bug | editor/shell/hooks/useEditorShortcuts.ts:96, 186-194; chrome-ui/focus.ts:134-139; sidebar/FullPageView.tsx (no role/aria-modal) | 10-14 P0 "⌘Z leaking behind full-page tools", still on main; UX-22 is the same root cause |
| 13.11 | Clipboard & edit chords | ⌘C ⌘X ⌘V ⌘D, Delete/Backspace (multi asks), ⌘A, Esc deselect, ⌘G/⌘⇧G (toast when not applicable), ⌘⌥C/⌘⌥V, ⌘S | ✅ Complete | engine/commands/defaultCommands.ts:84-515; shell/hooks/useClipboardToasts.ts:43-117; useHistoryFeedback.ts:260-291 | |
| 13.12 | App chords | ⌘K and ⌘⇧P (alias) palette · ? and ⌘/ sheet · ⌘P preview · ⌘, settings · ⌘H history · ⌘J AI · ⌘\ inspector · ⌘⇧V Paste HTML… · ⌘⇧E exporter · ⌘⇧A AI · C comments · F6 regions | ✅ Complete | shell/hooks/useEditorShortcuts.ts:102-204; defaultCommands.ts:556-580 | |
| 13.13 | Canvas command palette (⌘⇧P, 520px, EDIT/VIEW/INSERT/TOOLS) | Gone; ⌘⇧P now opens the one shell ⌘K palette | ❌ Removed | useEditorShortcuts.ts:134-141; commit 86b39bec3 | L1-033: ⌘K gaps (no "Add heading", fuzzy false hits) |
| 13.14 | Keyboard shortcuts sheet | One sheet generated from the command registry plus chrome chords: Selection · Edit · View · Panels · Regions | ✅ Complete | editor/canvas/controls/KeyboardCheatSheet.tsx; controls/keyboardSheetRows.ts:111-196 | |
| 13.15 | Keyboard legend card (rail Help) 🆕 | Compact legend matching real bindings | ✅ Complete | editor/canvas/controls/KeyboardLegend.tsx (fix 1a78e115e, L1-014) | |

## 14. Comments on the canvas

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 14.1 | Comment mode toggle | Top-bar Comments button or C key; Esc leaves; a click pins without also selecting | ✅ Complete | editor/canvas/comments/CommentLayer.tsx:8-9, 198, 252-270; shell/hooks/useEditorShortcuts.ts:115-125 (fix 48314ce07, L1-036) | Saved sites only; C gated by `reviewsEnabled` |
| 14.2 | Pins | Numbered accent discs; tooltip "Name: first 80 chars"; click opens Review; re-measure on edits/resizes/page switch | ✅ Complete | CommentLayer.tsx:94, 480-512 | No count badge on the top-bar button |
| 14.3 | New-comment popover | "New comment" card: textarea "Leave a comment…" (2000 max), Cancel / Post ("Posting…"), ⌘Enter posts; toasts "Comment pinned" / "Couldn't post comment" | ✅ Complete | CommentLayer.tsx:438-441, 520-562 | |
| 14.4 | Re-pin detached comment | Banner; click an element; toasts "Pick an element" / "Comment re-pinned" / "Couldn't re-pin" | ✅ Complete | CommentLayer.tsx:400-416 | |
| 14.5 | Orphan comments modal | "A comment lost its element" / "N comments lost their element", quote + "was on: …", Open Review panel; once per orphan | ✅ Complete | CommentLayer.tsx:575-640 (fix 733c64302) | |
| 14.6 | Replies / threads / @mentions | Not available (Review panel lists flat comments) | ⏳ Stub / coming soon | L5-031 (DECISION not-done) | Plan the thread UI in the Review redesign |

## 15. Collaboration (behind `FEATURE_COLLAB`)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 15.1 | Start collaboration (Site menu / ⌘K) | With the flag on: the row starts a session ("Save your site first" / "Couldn't start collaboration" toasts). With it off: a disabled row tagged "Planned" | 🚩 Flagged | editor/shell/SiteMenu.tsx:219-232; shell/modals/CommandPalette.tsx:308-319; shell/StudioHeader.tsx:296, 614-625 | Planned product; design it as live |
| 15.2 | Presence avatars + connection pill | Up to 3 avatars, "+N", "N editing" / "Reconnecting…" / "Offline"; dev builds show a demo "You / Ana" pair | 🚩 Flagged | editor/collaboration/PresenceIndicators.tsx:37-55; StudioHeader.tsx:804-812 | |
| 15.3 | Remote cursors on canvas | Coloured arrow + name tag per remote user; cursor broadcast every 50ms | 🚩 Flagged | editor/canvas/overlays/RemoteCursorsOverlay.tsx:116-160; hooks/useCursorSync.ts | Overlay itself is not flag-checked; only renders while a session exists |
| 15.4 | Remote selections / "editing this" / soft-locks / latency | Tracked in the engine, with no UI | ⏳ Stub / coming soon | engine/collaboration/ (no chrome consumer) | Needed before collab ships |

## 16. Interactions door

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 16.1 | Interaction runtime (hover/click/focus/scroll/load/pressed triggers, presets) | Plays in preview/published pages, not while editing | ✅ Complete | engine/interactions/InteractionRuntime.ts:160-200 | Presets list not re-verified |
| 16.2 | "Reverse on leave/blur/release" | The option exists, but the reverse is a placeholder that only logs | ⏳ Stub / coming soon | engine/interactions/InteractionRuntime.ts (reverseAnimation: "For now, just a placeholder") | Hide the toggle or implement it |

## Not verified

- Static code read only; no live app was run. Every 🐞 marked "code-read" (6.6, 7.6, 11.14, 12.8, 13.2-cancel) is inferred from source, not reproduced. 6.4, 6.5, 13.4 and 13.10 are strong code-level confirmations of the 10-14 P0s, but they were still not exercised live.
- The 09-16 nesting table (§2.5) and the 42 animation presets were not re-derived line by line.
- Exact pixel geometry (handle sizes, pill offsets, colours) was not measured. Rows describe structure, not measurements.
- I did not trace whether `moveElement`/`removeElement` enforce locks internally, which would soften 11.14.
- Comments were not tested end to end against the server. The Review panel side is out of this slice.
- The shell ⌘K palette contents and the Layers/inspector halves of shared actions were only checked where they touch the canvas.

## Status counts

154 rows: ✅ Complete 106 · 🟡 Partial 13 · 🐞 Bug 12 · 🚩 Flagged 3 · ⏳ Stub 3 · ❌ Removed 17 · 🔒 0 · 🧪 0 (the dev-only demo presence pair is folded into 15.2). 🆕 marker on 27 rows.


---

# Pages, Templates, Layers, Version History (+ Activity)

Re-verified against `main @ 19f964d5e` (2026-10-16), replacing baseline lines 1704–2050 of `editor-feature-inventory-2026-09-16.md`. Since 09-16 a lot has moved. Templates is no longer a drawer: it is a full-canvas workspace with an in-place preview. History left the left drawer for the right (inspector) column, gained a separate Session tab and a canvas-band Time-Travel, and Activity is now its own panel. Pages and Layers dropped their toolbar glyphs and text links in favour of a header "⋯" menu, and Pages got a New-page modal, server-side folders, status chips and a rename→URL decision.

All paths are relative to `packages/editor/src/` unless noted.

## Pages — panel shell and list

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 1 | Pages panel | Rail item "Pages" (shortcut P) opens the left drawer panel "Pages" | ✅ Complete | editor/rail/tabsConfig.ts:112; editor/sidebar/tabs/pages/PagesTab.tsx:359 | One of six rail items (add, layers, pages, assets, content, design) — tabsConfig.ts:295 |
| 2 | Header "⋯" panel menu 🆕 | Select pages… · Listings · Show structure · rule · Reload · Widen/Narrow panel. In select mode the ⋯ becomes "Done" | ✅ Complete | PagesTab.tsx:365-417 | Replaced the "⊞ Listings / ⌸ Structure" text links and the expand button (audit G2-070). Listings/Structure are now buried one click deeper |
| 3 | "⌘K" keycap in the header | — | ❌ Removed since 09-16 | PagesTab.tsx:357-358 (comment: "No ⌘K keycap") | The topbar field is the ⌘K door now |
| 4 | Panel-local Go-to-page palette | — | ❌ Removed since 09-16 | usePageCommands.ts:4-11 (decision #38) | Replaced by global ⌘K rows, see #5 |
| 5 | ⌘K "New page" / "Go to {page} (home)" 🆕 | Global palette rows, there whether or not the panel is open | ✅ Complete | editor/sidebar/tabs/pages/usePageCommands.ts:94-96 | Registered from the shell |
| 6 | Search pages field | "Search pages…" under the header, only over the tree view. Matches names only; results go flat, a foldered page shows "in {Folder}"; Esc clears; the query is dropped when the drawer closes | ✅ Complete | PagesTab.tsx:146-149,425-427; components/PageList.tsx:125-127,298-302 | Doesn't search slug/title. Board 4418:92256 wanted the filter in the topbar; owner moved it under the header (10-03) |
| 7 | "/" focuses search | — | ❌ Removed since 09-16 | utils/keyboardShortcuts.ts:1 — only imported by its own test | The helper is dead code |
| 8 | No-results state | "No pages match your search." plus "Search everywhere for '…'" (hands off to ⌘K). No "Clear search" link here (Layers has one) | ✅ Complete | PageList.tsx:226-234; editor/shared/PanelStates.tsx:84-110 | Inconsistent with Layers, which also offers Clear search |
| 9 | Loading skeleton | Pulsing rows, "Loading pages", while the project loads; the footer stays | ✅ Complete | PageList.tsx:133-143 | — |
| 10 | Empty state | "No pages yet" / "Add your first page…" / "Create blank page" · "From template" | ✅ Complete | PageList.tsx:146-171 | — |
| 11 | Load error | "Couldn't load pages … to load this site's pages." + Retry; search and footer stay | ✅ Complete | PageList.tsx:216-223; usePages.ts:154 | — |
| 12 | One-page note | "This site has one page." — the second "+ Add page" link was removed (owner, 10-03) | ✅ Complete | PageList.tsx:306-315 | — |
| 13 | Footer legend 🆕 | "⌂ homepage · ● unpublished changes · ⠿ drag to reorder · ⋯ page menu"; while searching, "N of M pages match '…'" | ✅ Complete | PageList.tsx:360-368 | A legend standing in for affordances is a smell; consider self-evident row glyphs |
| 14 | "+N from collections ›" 🆕 | Footer link counting pages a CMS collection generates at publish; opens that collection's Dynamic pages tab | ✅ Complete | PageList.tsx:348-359; PagesTab.tsx:96-100; useDynamicPagesSummary.ts | Read-only hint: those pages have no rows of their own in the tree |
| 15 | Footer add actions | "+  Add page", "From template", "⋯" → "New folder" | ✅ Complete | components/AddPageButton.tsx:40-97 | "Add page" now opens the New-page modal (#41), not an instant page |

## Pages — page row

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 16 | Select / open a page | Click or Enter makes it the active page | ✅ Complete | components/PageRow.tsx:239-248 | — |
| 17 | Home glyph | Only the home page carries an icon (roof) | ✅ Complete | PageRow.tsx:297-310 | — |
| 18 | External-link page glyph/status | — | ❌ Removed since 09-16 | pages/types.ts:9-10 (no "external", G2-071) | — |
| 19 | Status chip 🆕 | Non-live pages show a chip: "Draft", "Hidden from publish", "Scheduled", "Error" | 🟡 Partial | PageRow.tsx:369-373; utils/statusLabel.ts; usePages.ts:37-41 | Only Live/Hidden can be set (page-settings/AdvancedTab.tsx:27), so Draft, Scheduled and Error can never appear |
| 20 | "● Unpublished" marker 🆕 | Dot plus the word "Unpublished" on a page with unsaved edits | 🟡 Partial | PageRow.tsx:363-368 | L3-009 is still an open DECISION: "Unpublished" here means *unsaved*, and screen readers hear "Live" on a site that was never published (PageRow.tsx:189-195) |
| 21 | Inline rename | Double-click, F2 or the menu. Shows the hint "Enter to save · Esc to cancel"; a duplicate name gives a red "A page with this name already exists" | ✅ Complete | PageRow.tsx:124-131,390-394; PagesTab.tsx:211-222 | — |
| 22 | Rename → URL decision 🆕 | When the name implies a new slug: "URL: /old → /new?" with Keep URL · Update URL · Cancel rename. Update URL opens Page settings with the redirect offer | ✅ Complete | components/RenameUrlDecision.tsx:24-55; PageRow.tsx:113-121,395-408; PagesTab.tsx:224-231 | The redirect refuses to hijack a live page (L3-005 fixed) |
| 23 | Drag to reorder | Drop before or after a row (top/bottom half) | ✅ Complete | PageList.tsx:112-124; PageRow.tsx:151-170 | — |
| 24 | Bulk selection | ⌘/Ctrl/Shift-click, Space, the checkbox, "Select pages…" mode, "Select all (N pages)" row; Esc or Done leaves | ✅ Complete | PagesTab.tsx:247-260,277-283; PageList.tsx:174-210; PageRow.tsx:240-257 | — |
| 25 | Page context menu | Rename… F2 · Duplicate ⌘D · Set as homepage · Replace layout with template… 🆕 · Copy link · Page settings… · Remove from {Folder} 🆕 · Delete page ⌫, with an inline reason when Delete is disabled 🆕 | ✅ Complete | components/PageContextMenu.tsx:111-156 | 224px wide, at the pointer |
| 26 | Menu chords ⌘D / ⌫ | The menu prints ⌘D and ⌫ next to Duplicate and Delete, but the row's key handler binds only Enter, F2 and Space | 🐞 Bug | PageContextMenu.tsx:114,141 vs PageRow.tsx:247-258 | Not verified what the global ⌘D/⌫ do while a page row has focus |
| 27 | Duplicate | Toast "{name} duplicated · {copy} · Open"; errors for a missing source or corrupt content | ✅ Complete | usePages.ts:256-272 | — |
| 28 | Set as homepage | Toast "{name} is now the homepage · Undo"; Undo reverts this action only (L3-007) | ✅ Complete | usePages.ts:350-359 | — |
| 29 | Copy link | Copies the served URL on the real host: "Link copied · host/path"; "No address yet" when there's no domain | ✅ Complete | usePages.ts:376-405 | — |
| 30 | Delete one page | Guards for home and the only page; confirm `Delete "Name"?`; names CMS collections whose template page this is 🆕; toast "{name} deleted · Undo" | ✅ Complete | PagesTab.tsx:116-130,236-245,517-533; usePages.ts:291-307 | — |
| 31 | Replace layout with template… 🆕 | Row menu (or ⌘K) makes the page active, then opens Templates in replace mode | ✅ Complete | PagesTab.tsx:265-272; editor/shell/modals/CommandPalette.tsx:135 | — |

## Pages — folders and bulk

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 32 | Server-backed folders 🆕 | Folders save per user × site on the server (`pages.folders.*`), cached in localStorage, and legacy local folders upload once. Tip: "Personal folders · Only you see these; URLs stay unchanged." | ✅ Complete | useFolders.ts:6-15,127-150; components/PageFolder.tsx:24 | No longer browser-only, but still private to each user |
| 33 | Folder row | Tri-state checkbox, chevron, folder glyph, name, ⓘ tip (first folder), count, hover Rename / "Delete folder (pages kept)" | ✅ Complete | PageFolder.tsx:130-277 | — |
| 34 | New folder | ⋯ → New folder; it opens straight into rename (L3-012) | ✅ Complete | PagesTab.tsx:472; PageList.tsx:262 | — |
| 35 | Move a page into a folder | Drag onto the folder row, or onto "Drag pages here" in an empty open folder. The member row's "×" is gone — removal is now the context menu's "Remove from {Folder}" | ✅ Complete | PageFolder.tsx:309-317; PageContextMenu.tsx:131-135 | Removing a page from a folder lost its one-click affordance |
| 36 | Reorder pages inside a folder | Member rows can be dragged but have no reorder drop handler | 🟡 Partial | PageFolder.tsx:287-303 (no `onReorderDrop`) vs PageList.tsx:289 | — |
| 37 | Bulk toolbar | "**N** selected" · Duplicate · Move to… · Delete, in place of the footer; the "×" is gone (header Done leaves) | ✅ Complete | components/BulkToolbar.tsx:43-52 | — |
| 38 | Move pages dialog 🆕 | "Move N pages to…" radio list of folders plus "Top level (no folder)" → "Move to {Folder}" | ✅ Complete | components/MovePagesDialog.tsx:36-79 | Replaced the small popover menu |
| 39 | Bulk delete | Confirm "Delete N pages?" naming each page and warning "Inbound links … will break"; one ⌘Z restores all; success state "N pages deleted." Home is spared | ✅ Complete | PagesTab.tsx:293-331,535-559 | — |
| 40 | Bulk duplicate | Duplicates each selected page, then clears the selection | ✅ Complete | PagesTab.tsx:286-289 | — |

## Pages — add page, Listings, Structure

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 41 | New page modal 🆕 | Every Add-page door opens "New page": Page name · Blank "Empty canvas" / From template "Pick from N layouts" · "Add to site navigation" toggle (on) · Cancel / Create page. Blank → toast "Page created"; From template → the catalogue, carrying the name | ✅ Complete | components/NewPageModal.tsx:1-20,63-88,153-166 | Mounted once in editor/shell/StudioModals.tsx |
| 42 | Plan page limit | The server refuses a save that adds pages past `pagesPerSite` and the toast names the limit. The New-page modal does not check the limit first | 🟡 Partial | editor/shell/hooks/useSaveCallback.ts:138; useComposerInit.ts:848-851; NewPageModal.tsx:68-88 | L3-013 PARTLY. Users find out only after creating the page |
| 43 | Listings view | ⋯ → Listings: "‹ Pages" back link, header PAGE · TITLE · DESC · SCORE, rows showing "Set"/"Missing" and a score (red under 50); click opens Page settings | ✅ Complete | PagesTab.tsx:434-455; components/SearchListingsTable.tsx:66-118 | — |
| 44 | SEO score consistency | The Listings score (100 minus penalties) and the SEO tab score (additive points) are different formulas, so one page shows two different numbers | 🐞 Bug | SearchListingsTable.tsx:34-62 vs utils/seoScore.ts:30-40 | FG-008 (row SEO dot) is blocked on choosing one score model |
| 45 | "Open full listings ›" | Only widens the drawer to 700px; it's the same table | 🟡 Partial | SearchListingsTable.tsx:126-139 | No dedicated full view exists |
| 46 | Structure view | ⋯ → Show structure: a route tree with page names as buttons and mono paths | ✅ Complete | PagesTab.tsx:432-433; components/SiteStructureTree.tsx:19-26 | — |

## Page settings dialog

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 47 | Dialog shell | "Page settings — {Page}" with SEO / Social / Advanced tabs and ✕, in the overlay root with a focus trap (DQ-019). Opened from the row menu, Listings, Templates' "Page created", and Redirects' "Back to {Page} SEO" | ✅ Complete | page-settings/PageSettingsDrawer.tsx:52-56,100-140; PagesTab.tsx:185-203 | — |
| 48 | Save model | **Changed:** no more autosave. Footer Cancel / Done (Done saves, then closes); ⌘S saves; toast "Page settings saved · Manage pages" | 🟡 Partial | PageSettingsDrawer.tsx:58-68,160-172; usePageSettings.ts:282-291 | FG-012: owner answer is Cancel / **Save**, code says "Done". UnsavedWarningModal.tsx:9-13 still claims autosave (stale comment) |
| 49 | Discard guard | ✕/Esc/scrim with unsaved edits → "Discard unsaved … changes?" Keep editing (focused) / Discard changes | ✅ Complete | page-settings/UnsavedWarningModal.tsx:46-110 | Tab switches are no longer guarded (#20) |
| 50 | SEO score pill on the tab | Amber number on "SEO" while indexing is on and the score is under 80 | ✅ Complete | PageSettingsDrawer.tsx:121 | Uses the additive score (see #44) |
| 51 | Google preview | Shows the real served host and path (not "yoursite.com"), the title, and the description or "No description — add one below…" | ✅ Complete | page-settings/SeoTab.tsx:373-395 | — |
| 52 | Score card and checklist | Number, "Looks good"/"Needs work", checks for Page title +30 / Meta description +40 / Clean URL slug +30 / Allow indexing Required; noIndex banner | ✅ Complete | SeoTab.tsx:440-500 | FG-007: no readability, focus keyphrase, schema type or canonical check (DECISION) |
| 53 | Meta title override 🆕 | "Meta title · page override"; the placeholder is the inherited site title; "Write with AI" (under 10 chars) or "Regenerate", grounded in the site and page copy | ✅ Complete | SeoTab.tsx:269-304,89-180 | The AI button needs the AI service; failures are reported (L5-018) |
| 54 | Meta description | Counter, placeholder "One sentence about this page" | ✅ Complete | SeoTab.tsx:318-338 | — |
| 55 | URL slug | Domain prefix and auto-format; warning that a published URL change breaks links; after save, an "Add redirect / Not now" offer that won't hijack a live page's path | ✅ Complete | SeoTab.tsx:113-260 | — |
| 56 | Search indexing in the SEO tab 🆕 | "Indexed · shown in search" / "Hidden · not in search" select; "{Site} · These overrides affect {Page} only."; "Site SEO defaults ›" door | ✅ Complete | SeoTab.tsx:342-367 | Duplicates the Advanced-tab toggle |
| 57 | Social tab | 1200×630 share preview; OG title / description / image URL | ✅ Complete | page-settings/SocialTab.tsx:25-86 | FG-011: no linked-vs-independent X switch |
| 58 | Visibility Live / Hidden | Two-segment control; Hidden = "Not published. Hidden pages are left out of the deploy." | ✅ Complete | page-settings/AdvancedTab.tsx:22-55 | — |
| 59 | Password-protected pages | — | ❌ Removed since 09-16 | AdvancedTab.tsx:4 (decision #21); usePages.ts:34-40 (legacy "password" reads as hidden) | Comes back only with published-site middleware |
| 60 | Indexing and Follow links toggles | "Allow indexing", "Follow links" | ✅ Complete | AdvancedTab.tsx:62-80 | — |
| 61 | Custom `<head>` code | Mono textarea, unclosed-tag validation, sanitized | ✅ Complete | AdvancedTab.tsx:85-100; usePageSettings.ts:91,239 | — |
| 62 | Settings error boundary | A crash shows "Settings error" with Try again, not a dead panel | ✅ Complete | page-settings/SettingsErrorBoundary.tsx | — |

## Templates (full-canvas workspace)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 63 | Full-canvas Templates view 🆕 | Opens edge to edge (FullPageRouter) in place of the canvas. Doors: Pages "From template", the New-page modal, row "Replace layout…", ⌘K template rows, the canvas empty state | ✅ Complete | editor/sidebar/tabs/templates/TemplatesTab.tsx:1-10; editor/sidebar/FullPageRouter.tsx:59; StudioPanels.tsx:642 | Not on the rail (tabsConfig.ts:295). Decision #24 |
| 64 | Compact 280px drawer gallery and "Browse all templates" | — | ❌ Removed since 09-16 | TemplatesTab.tsx:2-4 | — |
| 65 | Search, filter pills, tag chips, pagination | — | ❌ Removed since 09-16 | TemplatesTab.tsx:8 ("no search yet"); L2-036 doc fix 3eacf8490 | Fine with 10 templates; won't scale |
| 66 | Workspace sidebar 🆕 | "‹ Back to canvas" (or "‹ Back to templates" / "‹ Back to Pages"), "Templates", site name, PAGE TEMPLATES, "All page templates N", one row per template, help line, "⟳ Reload catalogue" | ✅ Complete | TemplatesTab.tsx:454-499 | 10-10 UI audit: the exit sits in a different place than in Brand and Assets |
| 67 | Catalogue grid 🆕 | "Page templates" heading; cards with a live-iframe thumbnail, an APPLIED badge, "N sections", "Built-in"/"Saved" (+ " · Pro"), "Preview template →" | ✅ Complete | TemplatesTab.tsx:514-543; components/TemplateCard.tsx:50-99 | — |
| 68 | Catalogue content | 10 built-ins (Pro: E-Commerce, Restaurant, SaaS Pro) plus the user's saved templates, in one flat list | ✅ Complete | templatesData.ts:147-251; TemplatesTab.tsx:136-140 | "Sections" group gone; no section templates ship |
| 69 | In-place preview 🆕 | Preview fills the main area: Desktop 1100 / Tablet 768 / Mobile 375, "Used on {page links}", Create page / Replace page… (red), foot note about the backup | ✅ Complete | TemplatePreview.tsx:38-146; TemplatesTab.tsx:500-512 | Replaces the detail panel and the full-screen preview modal; tokens resolve in the preview (L2-014) |
| 70 | Detail panel, "Where this template is used" dialog (Preview / Used in / Versions) | — | ❌ Removed since 09-16 | TemplatesTab.tsx:500-512 (only the "Used on" line survives, TemplatePreview.tsx:87-96) | Version-drift ("update available") is gone |
| 71 | Replace mode 🆕 | Banner "Replacing: {Page} · your current layout is backed up first · Cancel"; cards show "Use for {Page}" | ✅ Complete | TemplatesTab.tsx:519-540 | — |
| 72 | Replace confirm | "Replace this page with '{T}'?"; brand sentence differs for saved vs built-in; "Save the current page as a backup version first" (on), kept in History › Saves | ✅ Complete | TemplatesTabModals.tsx:85-121; TemplatesTab.tsx:186-200 | The backup is now a History version, not a "(backup)" duplicate page |
| 73 | "Reset global styles to template defaults" option | — | ❌ Removed since 09-16 | TemplatesTabModals.tsx:85-121 (no such option) | — |
| 74 | Backup-failed dialog 🆕 | "{Page} backup could not be saved" → Try the backup again / replace without one / Cancel | ✅ Complete | TemplatesTabModals.tsx:275-286; TemplatesTab.tsx:576-583 | — |
| 75 | New page from template | Create page → "Create a page from '{T}'?" → progress → "Page created" (Open page settings / Done) or "Couldn't create the page" (Try again) | ✅ Complete | TemplatesTabModals.tsx:155-250; TemplatesTab.tsx:585-626 | Uses the name from the New-page modal when there is one |
| 76 | Apply progress card | Steps: Resolving brand tokens / Importing template HTML / Rendering on canvas / Saving applied state, with per-section rows; Cancel until the import lands; 15s timeout | ✅ Complete | ApplyProgressOverlay.tsx:72-104; TemplatesTab.tsx:229-340,636-647; hooks/useTemplateApply.ts:78-86 | — |
| 77 | Admin-only apply | Below ADMIN → "Only an admin can apply a template" | ✅ Complete | TemplatesTab.tsx:153-162 | — |
| 78 | Pro templates | Locked only on the Starter tier (Pro/Business can use them, L2-009) → Upgrade modal | 🔒 Plan-gated | TemplatesTab.tsx:156-157,171,214 | — |
| 79 | Brand tokens after apply | Built-in templates insert literal colours, so after an apply the site's Brand tokens read "unused" | 🟡 Partial | templatesData.ts (3 token refs in the whole file); L4-024 DECISION | Owner default: re-author templates on semantic tokens |
| 80 | Canvas empty-state template cards | Clicking the "SaaS Landing" card opens the whole catalogue, not that template's preview | 🐞 Bug | editor/canvas/CanvasEmptyCTA.tsx:75,99 (`onBrowseTemplates`, no id) | `previewId` already exists (TemplatesTab.tsx:48; CommandPalette.tsx:329); 10-10 UI audit finding |
| 81 | Save page as template | Modal: Template Name / Description / tokens note / Save template. Saves locally and queues a server sync, with a "didn't reach the server · Retry" toast | 🟡 Partial | templates/SaveTemplate.tsx:48-98; editor/shell/hooks/useStudioHandlers.ts:30-100; CommandPalette.tsx:248 | Reachable only from ⌘K. Saved templates can't be renamed or deleted anywhere in the UI. Not verified whether other sites pull them back |
| 82 | Legacy My Templates list, old preview modal, engine template manager | — | ❌ Removed since 09-16 | `src/templates/` holds only SaveTemplate.tsx; no template manager in `src/engine/` | — |

## Layers

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 83 | Layers panel | Rail item "Layers" (L), left drawer | ✅ Complete | editor/rail/tabsConfig.ts:101; editor/sidebar/tabs/layers/LayersTab.tsx:219-266 | — |
| 84 | Header "⋯" menu 🆕 | Expand all · Collapse all · rule · Display settings… · Widen/Narrow panel | ✅ Complete | LayersTab.tsx:243-261 | Replaced the ⊞ ⊟ ⚙ glyph toolbar |
| 85 | Search layers | "Search layers…"; matches go flat (no indent or chevrons); footer reads "N of M layers match '…'"; Esc clears, then closes | ✅ Complete | LayersTab.tsx:71,93,266,302-303; editor/panels/layers/index.tsx:411-424 | — |
| 86 | Breadcrumb band and purpose line | — | ❌ Removed since 09-16 | panels/layers/index.tsx:456-458 | The path now lives in the canvas breadcrumb/status bar |
| 87 | Panel states | Loading skeleton; scoped error with Retry (count hidden); empty "No layers yet / Add an element…" (the "Open Insert" link is gone); no results "No matching layers" + Clear search + Search everywhere (L2-031 done) | ✅ Complete | LayersTab.tsx:20-60; components/LayersStateBlocks.tsx:14-35; components/LayersEmptyState.tsx:11-16 | The empty state has no call to action |
| 88 | Display settings | Show dimmed layers · Show lock badges · Compact rows · Highlight CMS-bound 🆕 · Show HTML tags. "Show element IDs" is gone | ✅ Complete | components/LayerDisplaySettings.tsx:27-31 | — |
| 89 | Layer row | Chevron, type icon, name rule, ◇ instance badge, HTML tag, "Bound to CMS" badge 🆕, M/T hidden-breakpoint badges, eye (dim), lock | ✅ Complete | panels/layers/LayerTreeItem.tsx:99-410 | — |
| 90 | Names and locks saved with the project 🆕 | Custom names and locks now live on the element (they used to be browser-only); dim and expand state stay per browser | ✅ Complete | hooks/layersPersistence.ts:1-12,85-96 | Renames are undoable (L2-013) |
| 91 | Dim in editor | The eye dims a node on the canvas only; a selected dimmed layer shows a note, "To hide on the site, use Inspector → Visibility", and "Show normally in editor"; footer ⓘ explains dim scope | ✅ Complete | LayerTreeItem.tsx:348-385; panels/layers/index.tsx:560-575; LayersTab.tsx:73,353-370 | Dimming survives re-renders (L1-006/L2-012) |
| 92 | Drag to reorder or nest | Top-level rows drag too now; locked rows don't. Rejections are spelled out, e.g. "X can't contain Y. Drop into a container instead." | ✅ Complete | LayerTreeItem.tsx:104-110; panels/layers/index.tsx:130-161 | — |
| 93 | Multi-select and Select mode 🆕 | ⌘/Ctrl/Shift-click; footer "Select" turns on checkbox mode with Select all / Deselect all / Done; count "N selected of M" | ✅ Complete | LayerTreeItem.tsx:231,250-258; LayersTab.tsx:298-345 | — |
| 94 | Multi-select banner (Group / Dim / Delete / Done) | — | ❌ Removed since 09-16 | panels/layers/index.tsx:466-467 (G2-068) | Bulk actions are now only in the context menu |
| 95 | Row keyboard | Enter/Space select, F2 rename, ←/→ collapse/expand, ↑/↓ move; Delete/Backspace runs the engine delete 🆕 | ✅ Complete | LayerTreeItem.tsx:160-198 | — |
| 96 | Layer context menu | Cut · Copy · Paste · Duplicate · Delete · Rename · Group · Move to page… 🆕 · Copy link, each naming its target ("Cut · Heading" / "· 3 elements"); engine commands and lock/instance gates | ✅ Complete | components/LayerContextMenu.tsx:60-139; hooks/useLayerContextActions.ts:72-119 | Moved onto chrome-ui Menu (DQ-018); stops bypassing the engine (DQ-002) |
| 97 | Move to page dialog 🆕 | "Move {subject} to a page" with a radio list of the other pages | ✅ Complete | components/MoveToPageDialog.tsx:39-62 | — |
| 98 | Delete a multi-selection | Confirm "Delete N elements?" naming them | ✅ Complete | panels/layers/index.tsx:469-477 | — |
| 99 | Lock/Unlock and Select children in the menu | Not offered (lock is only the row button) | 🟡 Partial | LayerContextMenu.tsx:80-83 | L2-032 owner default: add them |
| 100 | Viewer read-only Layers | VIEWER can select and expand only | ✅ Complete | LayerTreeItem.tsx:107-110 | — |
| 101 | Hover sync with the canvas | Hovering a row highlights the element, and the reverse | ✅ Complete | LayersTab.tsx (handleLayerHover, canvasHoveredId) | — |

## Version History (right column)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 102 | History panel location 🆕 | Now opens in the right (inspector) column, not the left drawer; shortcut H | ✅ Complete | editor/rail/tabsConfig.ts:130-136,339-344 | Off-rail; same column as Publish, Review, Activity |
| 103 | Tabs: Session / Saves / Published 🆕 | Session is its own tab (it was the "This session" chip); the default is Session | ✅ Complete | editor/sidebar/tabs/history/HistoryTab.tsx:33-37,123-130,235-251 | "Saved versions / This session" chips ❌ removed |
| 104 | History "⋯" menu | Search changes/saves · Time-Travel ⌃⇧T · Clear undo history… (confirm "Clear undo history?") | ✅ Complete | HistoryTab.tsx:193-226,416-422 | Search and Clear are hidden behind ⋯ (board draws neither) |
| 105 | Remembers the last view per site | localStorage key per site | ✅ Complete | HistoryTab.tsx:103-160 | — |
| 106 | Viewer read-only History | Browse, scrub and compare; restore, save and clear disabled with tooltips | ✅ Complete | HistoryTab.tsx:105-108,218,406 | — |
| 107 | "‹ Activity" back row 🆕 | Shown when an Activity row brought the user here | ✅ Complete | HistoryTab.tsx:254-256; activity/BackToActivityRow.tsx | — |
| 108 | Saves list | Date groups; rows show name/"Auto-save", time, "N changes" (opens the diff), "Auto" chip; clicking a row opens details (L5-045) | ✅ Complete | editor/panels/version-history/VersionList.tsx:51-52,172-248 | — |
| 109 | Version row ⋯ menu | View details · Name this version… 🆕 · Restore to draft… · Compare · Delete | ✅ Complete | VersionList.tsx:289-346 | Replaced the hover action strip |
| 110 | Saved-version details modal 🆕 | Site, "Inspect this save before restoring it…", Close / Compare with current / Restore this save… | ✅ Complete | editor/panels/VersionHistoryPanel.tsx:486-535 | — |
| 111 | Saves filter 🆕 | "Filter ▾": All / Named / Auto-saves, plus filter by author | ✅ Complete | version-history/SavesFilter.tsx:36-117 | — |
| 112 | Restore a version | Confirm "Restore '{name}' to the draft?" → saves current work first; "Undo restore" stays on the panel (L5-044) | ✅ Complete | VersionHistoryPanel.tsx:200-219,397-428 | — |
| 113 | Delete a version | Toast "Deleted {name}" / "Delete failed" | ✅ Complete | VersionHistoryPanel.tsx:235-241 | — |
| 114 | Save a version 🆕 | A "Save a version" modal with name suggestions ("Before design updates"…) replaces the inline form; toast "Version saved" | ✅ Complete | version-history/SaveVersionModal.tsx:12-86; SaveVersionFooter.tsx:28-40 | — |
| 115 | Inline compare with the live draft | Visual/Semantic toggle, summary chips, pages added/removed, "The current draft matches '{v}'." | ✅ Complete | VersionHistoryPanel.tsx:261-275; version-history/CompareView.tsx:104-195 | Always against the draft (L5-040); refreshes on a new save (L5-041) |
| 116 | Get AI Summary | Button with 60s cooldown; hidden when there's nothing to summarise (L5-020) | ✅ Complete | version-history/AIPanel.tsx:62-79; useAISummary.ts | Needs the AI service |
| 117 | Milestone suggestion banner (AI) | Suggests naming a checkpoint after page add, delete, a big change or a checkpoint run: Save / Edit / Dismiss | ✅ Complete | tabs/history/components/MilestoneSuggestionBanner.tsx:57-131; shared/hooks/useAutoMilestone.ts:259-272 | Best-effort; logs on failure |
| 118 | Approval band | "⚑ APPROVED · reviewer · date" + "Compare with current"; "Now — N changes since approval" | ✅ Complete | tabs/history/components/SavesChrome.tsx:40-160 | Opens CompareHost (#130) |
| 119 | Retention and prune notes | Caps are read from the managers: "{cap} versions kept…" / "the last {cap} steps…"; "Older auto-saves were removed" | ✅ Complete | SavesChrome.tsx:170-190; VersionHistoryPanel.tsx:452 | — |
| 120 | Saves states | Skeleton, load error ("Retry, or reopen Versions in a moment."), empty, no matches | ✅ Complete | VersionHistoryPanel.tsx:336-362; VersionList.tsx:504-508 | — |
| 121 | "Unavailable" hint names Ctrl+Z | Saves-unavailable state hardcodes "Use Ctrl+Z for undo" on macOS too; Session got the ⌘Z fix (L1-032), this one didn't | 🐞 Bug | VersionHistoryPanel.tsx:380 vs tabs/history/components/ActivityView.tsx:24 | Small copy bug |
| 122 | Session (undo trail) | Rows with label, author, time; expandable diff, "Show all N changes"; "Your change at …" | ✅ Complete | ActivityView.tsx:405-524 | Human labels, not raw ids (L5-042) |
| 123 | Restore to a step | Click the time → "Restore to 14:32?" → "Restore, discard N changes"; canvas cross-fade | ✅ Complete | ActivityView.tsx:300-375 | — |
| 124 | Session keyboard | j/k/↑/↓, g/G, Enter expand, Esc | ✅ Complete | ActivityView.tsx:205-255 | No visible keycap hint now |
| 125 | Session footer and states | "Save a version" footer under Session; empty "No undo history" with platform chord; error "Failed to load activity" | ✅ Complete | HistoryTab.tsx:401-407; ActivityView.tsx:550-601 | — |
| 126 | Time-Travel 🆕 | ⌃⇧T or History ⋯: a band across the canvas top, "Previewing {time · label} — nothing is written until you restore · Esc exits". The canvas shows the real reconstructed past state; ←/→ step, Enter → restore confirm | ✅ Complete | editor/shell/TimeTravelHost.tsx:1-27,248-345 | Replaced the bottom slider drawer and screenshot preview (❌) |
| 127 | Time-Travel restore safety | Saves a "Before restoring" version first; if that fails, "Couldn't save a version first" + "Restore anyway" (DQ-011) | ✅ Complete | TimeTravelHost.tsx:226-236 | — |
| 128 | Time-Travel "no preview" point | "No preview for … — restore would be blind" | 🟡 Partial | TimeTravelHost.tsx:276 | Some points can't be previewed |
| 129 | Published tab | Live version list, "Republish vN…" (renamed from "Roll back"), View details · Compare with current, "Every publish is restorable…"; ADMIN-gated | ✅ Complete | editor/shell/PublishHistory.tsx:277-292,333,362,455 | Full detail lives in the Publish module |
| 130 | Shared Compare view 🆕 | Full Compare with "Compare from / Compare to" source pickers (published, approved, current), load and error states | ✅ Complete | editor/shell/CompareHost.tsx:139-211 | One Compare for History, Review and Publish |

## Activity (own panel) 🆕

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 131 | Activity panel 🆕 | Right-column panel "Activity", opened from the site menu "Activity log", ⌘K "Open Activity", or the notifications "View all activity ›" | ✅ Complete | editor/sidebar/tabs/activity/ActivityTab.tsx:1-40; tabsConfig.ts:204 | Was a History tab; split out by the owner 09-25 |
| 132 | Filters and rows | Chips All / Edits / Comments / Publish; rows show actor and time; a row opens Review, History › Published or History › Session | ✅ Complete | activity/ActivityLogView.tsx:54-75,173-262; ActivityTab.tsx:31-38 | — |
| 133 | Activity states | No site; "Nothing here yet"; "Couldn't load activity" + Retry; permission → "Open in dashboard" | ✅ Complete | ActivityLogView.tsx:160-240 | — |

## Shared drawer pieces

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 134 | Panel frame and header | Title, actions slot (⋯), help, close | ✅ Complete | editor/chrome-ui/PanelFrame.tsx; PanelHeader.tsx | Expand moved into each panel's ⋯ as "Widen panel" |
| 135 | Panel search field | Esc clears, then passes through so the drawer can close | ✅ Complete | editor/chrome-ui/PanelSearch.tsx:12-15,61 | Pages, Layers |
| 136 | Shared panel states | Skeleton, load error with Retry, no-results with "Search everywhere" hand-off | ✅ Complete | editor/shared/PanelStates.tsx:16-110 | — |
| 137 | Drill-in header | "‹ Back to {Parent}" with a breadcrumb; now used only by Components detail | ✅ Complete | editor/sidebar/shared/DrillInHeader.tsx; tabs/component-library/ComponentDetailScreen.tsx | Templates no longer uses it |
| 138 | Old sidebar SearchBar (28px, ⌘F hint) | No screen imports it | ❌ Removed since 09-16 | editor/sidebar/shared/SearchBar.tsx (0 importers) | Dead file |

## Not verified

- I didn't open the running app. Everything here comes from reading code plus the 10-08 audit index, the 10-10 UI/UX audit and the 10-10 product audit; there are no screenshots and no getComputedStyle reads.
- What the global ⌘D/⌫ do while a page row has focus (#26).
- Whether saved templates synced to the server ever come back on another site or device (#81).
- Server-backed folders across two users (#32): read from the useFolders.ts header and code only.
- The Published tab's rollback/republish flow end to end (#129): owned by the Publish module.
- Plan page limit live (#42): the audit says QA runs on a BUSINESS workspace and it was not live-tested.
- Copy of PageFolder's empty-folder and drop states, Move-to-page dialog body text, and CompareHost's left/right rendering beyond the strings grepped.

**Status counts (138 rows):** ✅ Complete 110 · 🟡 Partial 10 · 🐞 Bug 4 · 🔒 Plan-gated 1 · ❌ Removed 13 · 🚩 0 · ⏳ 0 · 🧪 0. 32 rows carry 🆕 in the feature name; a few more rows describe new behaviour in their text.


---

# Add / Insert panel, Components, and the AI panel

Refreshed 2026-10-16 against `main @ 19f964d5e` (baseline: `packages/editor/docs/editor-feature-inventory-2026-09-16.md` lines 2051–2606). There have been about 140 commits since the baseline. **Add** now groups by source: ★ FAVOURITES · RECENT · ELEMENTS · BLOCKS (8 section blocks) · BUILT-IN COMPONENTS · SAVED COMPONENTS (+ FROM LIBRARY). It has an AI "Generate a block" screen, and Paste HTML now opens a dialog. The canvas Element Picker modal, the tips strip and the purpose line are gone. **Components** became a "manage saved master" surface with a workspace-shared library, page-scoped masters, Detach all, Structure / Used-on, inline rename and real thumbnails. Variant authoring still has no UI. The **AI panel** dropped the chat thread and the in-canvas "Edit with AI" popover. Every prompt is now a plan → review → per-step approval run, with a scope picker (element / multi / similar / page / site).

Evidence paths are relative to `packages/editor/src/` unless they start with `docs/`. Audit IDs (L1-…, L2-…, L5-…) are from `docs/audits/2026-10-08-editor-full-audit/ISSUE-INDEX.md` (repo root).

## A. Add panel (left drawer)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A1 | Panel frame + header | Title **"Add"**, then **⋯** ("Add options") and **✕**. Opened by the rail **Add** button (shortcut **A**). | ✅ | editor/sidebar/tabs/build/BuildTab.tsx:235-271; editor/rail/tabsConfig.ts:57-69 | Help is wired only if the parent passes `onHelpClick`. |
| A2 | Expand drawer to 700px | Expand/collapse corner-brackets button. | ❌ | BuildTab.tsx:233-238 (comment: "no expand"; no `onExpandToggle` passed) | The 2-col block grid used to gain columns when expanded. Decide if a wide Add mode is wanted. |
| A3 | ⋯ › Paste HTML… dialog | Menu item (kbd **⌘⇧V**) opens the "Paste HTML" modal. The textarea is prefilled from the clipboard when it can be read. A yellow note counts what will be stripped ("2 <script> tags and 1 event handler will be removed"). Cancel / Insert. Inserts through the normal block path. | ✅🆕 | BuildTab.tsx:240-269, 368-372; build/PasteHtmlModal.tsx:22-97; editor/shell/hooks/useEditorEventListeners.ts:142 | Replaces A4. |
| A4 | Pinned "⌥ Paste HTML…" row (direct clipboard insert, 2 error toasts) | — | ❌ | No such string in src | — |
| A5 | Search field | "Search elements…" under the header, **⌘F** hint. **/** focuses it (unless typing). **⌘F** takes focus only when focus is already in the panel, otherwise it is browser find (changed from "always hijack"). A closed drawer clears the query. | ✅ | BuildTab.tsx:178-217, 272-279 | — |
| A6 | Search results | One flat list across Elements, Blocks, Built-in components **and saved components** (new). Each row has a grey chip: Element / Block / Component. Blocks also match on the tags they contain. Short forms are understood (btn, pic, photo, separator, menu…). | ✅🆕 | build/utils/search.ts:23-106; build/components/SearchResults.tsx:34-37 | — |
| A7 | No-results state | "Nothing matches ‘{q}’." plus an accent **Clear search** link. | ✅ | SearchResults.tsx:66-76 | — |
| A8 | Selection-aware purpose line ("Click a row to add it…") | — | ❌ | String absent | Users no longer get told where a click will land; the toast says it afterwards (A37). |
| A9 | Group headers | 28–32px header: ▾/▸ chevron, caps label, mono count. Several groups can be open at once. Default open: ★ FAVOURITES (if any) + ELEMENTS. Labels renamed to **BUILT-IN COMPONENTS** and **SAVED COMPONENTS**. | ✅ | build/components/GroupSection.tsx:66-97; build/catalog/groups.ts:50-66; BuildTab.tsx:73-75 | Open state is not remembered. |
| A10 | ★ FAVOURITES group | ☆/★ toggle on element rows (shows on hover/focus). The group shows only when it has rows. Persisted in localStorage. | ✅🆕 | GroupSection.tsx:212-233; build/hooks/useBuildTab.ts:117-164; groups.ts:58 | Element rows only. Blocks and components cannot be favourited. |
| A11 | RECENT group | The last inserted or dragged elements, newest first. Shows only when non-empty. Persisted. | ✅🆕 | useBuildTab.ts:138-145, 198-221; groups.ts:59 | Only element rows are recorded. Blocks and components never appear. |
| A12 | ELEMENTS (54 rows, flat) | 54 rows across 6 hidden categories: Basic 12, Layout 8, Forms 15, Media 8, Navigation 3, Interactive 8. Each row has a per-type lucide glyph from the shared Layers icon map (replaces the hand-drawn SVGs) and a 13px label. Click inserts. | ✅ | build/catalog/catalog.ts:12-380; GroupSection.tsx:181-190 (DQ-016) | 53 rows when the Theme toggle is hidden (A14). |
| A13 | Collection list element | Basic › "Collection list": repeats its card once per CMS record. | ✅🆕 | catalog.ts:34-40; blocks/Layout/CollectionList.tsx:42 | Bind under Settings › Collection (CMS module). |
| A14 | Theme toggle element | Interactive › "Theme toggle" (Light/Dark switch). Offered **only while the site's Dark mode is Auto**, read live. | ✅🆕 | catalog.ts:332-338; useBuildTab.ts:249-270; blocks/Basic/ThemeToggle.ts | Disappears with no explanation when Dark mode is not Auto. |
| A15 | Upload element | — (the public form endpoint takes JSON only). | ❌ | catalog.ts:193-195 (L3-025) | Block stays registered for existing pages. |
| A16 | Element description bubble | Hover or focus on an element row shows its one-line description in a dark bubble under the row. | ✅🆕 | GroupSection.tsx:258-327 | — |
| A17 | Drag element to canvas + drag note | The row is draggable. While dragging, a note under it reads "Place the element in Home › Hero › Content. Release to drop it, or Esc to cancel." and the canvas/footer get a cue. | ✅🆕 | GroupSection.tsx:295-312; useBuildTab.ts:187-202 | — |
| A18 | Disabled "Soon" row + reason tooltip | Designed state. No row uses it. | ⏳ | GroupSection.tsx:200-255; catalog.ts:4 ("No disabled entries in production") | — |
| A19 | BLOCKS: 8 section cards | 2-col card grid: Hero, Features, Menu grid, Testimonials, CTA, Contact, Footer, Navbar. Click / Enter inserts. Baseline had 50 cards. | ✅ | groups.ts:41-46; blocks/blockRegistry.ts:157-165; GroupSection.tsx:338-413 | Menu grid, Contact and Testimonials section are new blocks. |
| A20 | Block thumbnails | Each card shows a token-coloured wireframe sketch of the section, not a render. A real `preview` image would win, but none ship. | 🟡 | build/components/BlockThumb.tsx:1-40; GroupSection.tsx:383-395 | No real previews. Generic band for unknown ids. |
| A21 | Block hover pill + preview card | Hovered card shows a blue **Add** pill. After 300ms a 320px card opens beside the drawer: name, description, larger thumb, **"Add {name}"** button, "or drag it onto the canvas". | ✅🆕 | GroupSection.tsx:338-428; build/components/BlockPreviewCard.tsx | — |
| A22 | Drag block cards | Block cards are now drag sources. | ✅🆕 | GroupSection.tsx:370-377; useBuildTab.ts:204-207 | — |
| A23 | Token-bound blocks | Footnote "Blocks use your Brand colours and fonts." Inserted blocks bind to semantic tokens. The old purple #667eea / #8b5cf6 defaults are gone. | ✅🆕 | GroupSection.tsx:540; commit a1111a2fb (grep finds no purple in src/blocks) | — |
| A24 | Blocks no longer in Add | Removed from Add: the 40 BLOCKS cards that duplicated ELEMENTS; Row / Column / 3 Columns; all 4 e-commerce blocks (Product Card / Grid / Detail, Cart Button). They remain in the registry but have no Add door and are not searchable. | ❌ | groups.ts:41-46 (Sections only); blockRegistry.ts:183-187 | Decide whether e-commerce blocks get a home. |
| A25 | "✦ Generate a block with AI…" row | Sits between ELEMENTS and BLOCKS. Drawn only while ELEMENTS is open. Opens part B. | ✅🆕 | BuildTab.tsx:303-319 | Hidden whenever ELEMENTS is collapsed. Easy to miss. |
| A26 | BUILT-IN COMPONENTS (14 rows) | Card, Slider/Carousel, Testimonials, Pricing Table, Progress Bar, Countdown Timer, Accordion/FAQ, Social Icons, Contact Form, Stack, Switch, Tabs, Modal, Table. Solid-square icon. Click only, not draggable. | ✅ | groups.ts:37, 63; GroupSection.tsx:458-465; blockRegistry.ts:197-212 | Most duplicate ELEMENTS rows (Card, Tabs, Modal…). |
| A27 | SAVED COMPONENTS | The user's masters in scope for the open page (site-wide plus "This page" ones), each with a "This page" meta tag and a ⠿ grip. Rows are draggable (drop instantiates). Empty copy: "No saved components yet. Select an element and choose Save as component." | ✅🆕 | GroupSection.tsx:466-492; BuildTab.tsx:51-61, 119-122 | Empty copy was missing at baseline. |
| A28 | FROM LIBRARY sub-list | Workspace-shared masters from other sites. A click adopts the master onto this site, then inserts it. Toasts: "That component is no longer in the library." / "This library component is damaged and can't be added." | ✅🆕 | GroupSection.tsx:493-510; BuildTab.tsx:124-148 | — |
| A29 | "Manage components ›" | Last row of SAVED COMPONENTS. Opens the Components panel. | ✅🆕 | GroupSection.tsx:511-524; BuildTab.tsx:346 | — |
| A30 | SAVED count vs Components panel | Add's count = own masters + **every** library entry, and it lists library rows. The Components panel lists only this site's masters and can say "No components yet" at the same moment. | 🐞 L1-024 (DECISION, still live) | BuildTab.tsx:112-115; component-library/useComponentList.ts:47; ComponentsTab.tsx:157 | One source of truth for "saved components". |
| A31 | "Page templates ›" link | Muted row at the end of the list. Opens Templates. | ✅🆕 | BuildTab.tsx:350-361 | — |
| A32 | First-use tip card | 800ms after the panel opens, a 300px card beside it: lightbulb + "Tip n/4", body text, **Got it**. Esc or an outside click also closes it. Shows one tip per open, 4 in total, remembered per browser. | 🟡🆕 | build/components/FirstUseTip.tsx:19-81; build/catalog/tips.ts:7-12 | L1-029 decision still open: it stacks with the rail explainer and the 0/7 checklist (docs/ui-ux-audit-2026-10-10/REPORT.md:27). |
| A33 | Tips strip (‹ › ✕, "bring back from Help") | — | ❌ | BuildTab.tsx:6-7 (G2-113) | — |
| A34 | "Quick Picks removed" one-time callout | — | ❌ | String absent | — |
| A35 | Loading skeleton / "Couldn't load the element library" states | — | ❌ | Strings absent | The catalog is static, so these states were unreachable anyway. |
| A36 | Click-insert placement | 150ms spam guard. Inserts inside the selection if it accepts the block, else after the branch at the nearest accepting ancestor, else at the end of the page. A selected text leaf is never the parent (L1-001). A Section's lone inner container is the slot (L1-037). Result is selected, flashes, and is one undo step. | ✅ | editor/shell/hooks/useBlockInsertion.ts:34-160 | — |
| A37 | Insert toasts | "{Block} added" (on the page) or "{Element} added to Home › Hero › Content", with **Undo**. Refusal (5s): "Can't add X — Y doesn't allow it. Try selecting a … first." Also: Editor not ready / No active page / root missing / not in registry / error toasts. | ✅ | useBlockInsertion.ts:39-73, 186-227 | — |
| A38 | Replace with block… | Right-click a section-type element → Add opens with BLOCKS. The next block takes its place. A locked element refuses. Toast "{Old} replaced with {Block}". | ✅🆕 | editor/shared/elementActions.ts:225-238; build/insertGroupRequest.ts:32-49; useBlockInsertion.ts:87-100, 194-195 | — |
| A39 | Media insert → Assets | Image / Video / Audio / Icon / SVG / Lottie inserted without a src switch the drawer to Assets and open the picker. There is no pick mode and no way back to Add. | 🟡 | useBlockInsertion.ts:162-173 | L1-017 DECISION (default: stay in Add, use the Inspector's "Choose image"). |
| A40 | Doors into Add | Rail Add (A). Empty canvas: "Add a block" (BLOCKS), "Describe your site" (Generate), "Start blank". Brand › Component styles rows. Components back row. Assets. | ✅ | editor/canvas/Canvas.tsx:820-846; editor/design-system/ui/BrandWorkspace.tsx:376-383; ComponentsTab.tsx:59-65; editor/sidebar/tabs/media/hooks/useMediaState.ts:233 | — |
| A41 | Keyboard | A (open), / and ⌘F (search), Enter/Space on rows/cards, ⌘⇧V (Paste HTML). | ✅ | tabsConfig.ts:66; BuildTab.tsx:187-217; insertGroupRequest.ts:67-75 | — |
| A42 | Block default-content copy debt | FAQ answers about "Aquibra", footer "© 2024 Buildrick", emoji social icons 📘🐦📷💼, 🗺️/🎬 embed placeholders. | 🟡 | blocks/Components/Accordion.tsx:37-44; blocks/Sections/Footer.tsx:19; blocks/Components/SocialIcons.tsx:14-17; blocks/Media/MapEmbed.tsx:15 | Sample content needs a copy pass. |
| A43 | Live embeds + runtimes | Video/Map/Lottie embeds render allowlisted iframes (YouTube, Vimeo, Google Maps, lottie.host). Countdown and Accordion run on the canvas and on published pages. Inserted blocks keep their real element type. | ✅🆕 | commits 854f64a9e, bf78a9692 (engine/export/{countdown,accordion}Runtime) | — |

## B. Generate a block (AI inside Add) — new since 09-16

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B1 | Generate screen | Back row "‹ Add" and title "Generate a block". Then: "Target:" band, field "Describe the block you need…", TRY prompts (3-col feature grid / testimonial carousel / FAQ accordion), note "The block goes straight onto the page, and one Undo takes it back…", GENERATE button ("Describe the block above to enable"), and a quota line "N generations left today" when the quota read answers. | ✅🆕 | build/components/GenerateBlockScreen.tsx:101-164, 228-293 | One single-shot run with no review step (L5-011 copy fixed). |
| B2 | Thinking + Stop | "Generating your block…" with Stop. Stop aborts the request and inserts nothing. | ✅🆕 | GenerateBlockScreen.tsx:299-306; L5-007 fixed (0764e514c) | — |
| B3 | Inserted state | Green band "Block inserted after {target}" with what changed, then Undo · Done. Done gives the toast "Block added" with Undo. | ✅🆕 | GenerateBlockScreen.tsx:200-210, 312-330 | — |
| B4 | Failure cards | "AI isn't available on this workspace." / "AI is out of credit." / "The AI service didn't respond." / "Nothing to insert." The prompt is kept, with **Try again**. | ✅🆕 | GenerateBlockScreen.tsx:118-134, 336-375; L5-009 fixed | — |
| B5 | Doors | Add row (A25), ⌘K "Generate a block with AI…", AI panel CREATE row, empty-canvas "Describe your site". | ✅🆕 | insertGroupRequest.ts:51-65; editor/shell/modals/CommandPalette.tsx:239-243; editor/sidebar/tabs/ai/EmptyThread.tsx:71-79; Canvas.tsx:838-841 | — |

## C. Quick-add Element Picker modal (canvas)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C1 | "Add Child Element" modal | The whole modal is gone: Recents/Favorites pills, amber tip, category accordions, star cards, "Added X to canvas". The selection toolbar's "+ Add child" now opens the Add panel. | ❌ | editor/canvas/controls/UnifiedSelectionToolbar.tsx:11-14; strings absent | Favourites and recents moved into Add (A10, A11). |

## D. Components (user's reusable masters)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| D1 | Entry points | ⇧A, ⌘K "Open Components", Add › "Manage components ›", right-click "Save as component…". Not on the 6-item rail. | ✅ | tabsConfig.ts:123-139, 288-295; CommandPalette.tsx:144; elementActions.ts:155-157 | — |
| D2 | Back row "‹ Add" | Above the Components header. Returns to Add. | ✅🆕 | editor/sidebar/tabs/ComponentsTab.tsx:59-65 | Components is framed as a child of Add. |
| D3 | List view | Intro: "Manage saved masters for this site. Insert places an instance; edits to a master affect its instances." Sections: **YOUR COMPONENTS (n)**, then **LINKED FROM LIBRARY (n)**. Each 32px row: name, **New** badge (created this session), "{n} on this site [· linked]". Rows are draggable; a click opens detail. Skeleton rows while loading. | ✅🆕 | ComponentsTab.tsx:243-351 | No search or filters. No › chevron is drawn, though comments mention one. |
| D4 | Detach-all notice | Top of list after Detach all: "{n} instances detached / {name} is still saved. Existing page content keeps its appearance." The row dims. | ✅🆕 | ComponentsTab.tsx:51-55, 324-333 | — |
| D5 | Empty / unavailable / error states | Empty: "No components yet." + "Select an element on the canvas and save it…" + "Create component". Compact variant: "No components saved yet." + "+ New". Unavailable: "Components require storage access…". Error: "Couldn't load your components." + "Try again". | ✅ | ComponentsTab.tsx:80-240 | — |
| D6 | Footer "+ Create component" | Primary button in a bordered footer, in both the list and the empty state. | ✅ | ComponentsTab.tsx:223-237, 354-368 | — |
| D7 | Create component modal | "Create component". Lead text "Selected: Page › Name (type). Creating a master converts this Name into its first instance…". Fields: **Name** (prefilled), **Scope** (This site / This page), checkbox "Also convert N other matching … groups on this page" (only when matches exist). Cancel / Create component ("Creating…"). Enter submits. Toast "X created as a component [· N matching groups converted]", then switches to Components. | ✅🆕 | editor/shell/modals/CreateComponentModal.tsx:60-175 | The selection becomes the first instance at once. |
| D8 | Old Create fields | Description, Category, Tags, "variant set" chips (Size/State/Theme), "Pre-fill from DS styles" toggle (now always on). | ❌ | CreateComponentModal.tsx:13-16 | Tags still feed search (A6) but cannot be set. |
| D9 | No-selection pre-check | Toast "Select an element on the canvas first — a component is made from something." | ✅ | editor/sidebar/LeftSidebar.tsx:394 | — |
| D10 | Page-scoped masters | "This page" masters are offered only on their page (Add + Components). | ✅🆕 | CreateComponentModal.tsx:79-82; useComponentList.ts:46-48 | — |
| D11 | Detail header + inline rename | Back row "Saved components" (or "Back to instance" when opened from an instance's Edit master), title "Components" + ✕. Click the name to rename inline (Enter/blur); failure toast. | ✅🆕 | component-library/ComponentDetailScreen.tsx:268-320 | The old Rename modal is gone (D27). |
| D12 | Insert from saved components | Sentence "{n} linked instances on {site}. Updating this master affects those instances…", then accent "Insert from saved components". With an instance selected it places after it, not inside (L2-006). | ✅ | ComponentDetailScreen.tsx:327-340; component-library/instantiate.ts | — |
| D13 | Update from selection… | Disabled with no canvas selection (tooltip). Confirm "Update component" with instance count and "To go back, use Undo on the confirmation that follows." Toast "X updated · N linked instances updated" with **Undo** (restores the master). An 8s warning if overrides were lost. | ✅ | ComponentDetailScreen.tsx:165-215, 451-466 | ⌘Z alone does not revert the master, only the toast Undo does. |
| D14 | Instance edits survive a master update (10-14 P0 check) | Text, style and attribute overrides are re-applied after an update and every element id is kept (L2-005 edc3c76dd, L2-015 c34bf7eea). Edits whose target path no longer exists are dropped and reported. | 🟡 | engine/components/ComponentInstances.ts:328-420; engine/components/ComponentInstance.ts:71-82, 126-156; engine/elements/ElementStyles.ts:38-50, 131-145 | Residual risk (code-read): overrides are keyed by **child index**, so reordering the master's children moves an edit onto a different element silently. Breakpoint and pseudo-state styles (`StyleEngine.setBreakpointStyle`, engine/styles/StyleEngine.ts:189-218) never call `recordInstanceOverride`, so Tablet/Mobile/hover edits on an instance are not tracked as overrides. Not live-verified. |
| D15 | Detach all | Disabled at 0 instances. Confirm "Detach all N instances of X?", then the list notice (D4). | ✅🆕 | ComponentDetailScreen.tsx:260-265, 349-356, 467-475 | — |
| D16 | Duplicate master | Immediate copy. | ✅ | ComponentDetailScreen.tsx:153-160, 358-364 | — |
| D17 | Delete master | Red "Delete {name} master". Confirm "Delete “X”?" says what happens to instances. Toast "X deleted · N instances detached" with **Undo**, which survives reload (L2-010). | ✅ | ComponentDetailScreen.tsx:63-93, 220-232, 440-449 | — |
| D18 | Master preview | "Master preview · {name}" box with an html2canvas thumbnail captured on create and on update, else "No preview yet". | 🐞 L2-020 (DECISION) | ComponentDetailScreen.tsx:370-382; component-library/captureComponentThumbnail.ts:1-45; editor/shell/hooks/useComponentSync.ts:67 | Blank for light-on-dark components. Capture is best-effort and silent. |
| D19 | STRUCTURE list | The master's top-level parts: layer name or type, plus "· CMS bound". | ✅🆕 | ComponentDetailScreen.tsx:385-397 | — |
| D20 | USED ON list | Pages with instances, "{n} instances". A click switches page and selects/scrolls to the first instance. | ✅🆕 | ComponentDetailScreen.tsx:236-252, 399-430 | — |
| D21 | No in-place master editing | "Edit master ↗" opens the management screen. You cannot edit the master on the canvas. | 🐞 L2-022 (DECISION) | editor/inspector/sections/ComponentRow.tsx:125-135; component-library/openMasterRequest.ts | Core redesign decision for components. |
| D22 | Inspector component row | Selected instance: "Variant [Default ▾]", "Edit master ↗", ⋯ → **Reset to master** / **Detach instance…** (confirms). Every write goes through the lock gate. | ✅🆕 | ComponentRow.tsx:1-170 | Replaces the baseline's "COMPONENT INSTANCE" band and the Pro-only Detach. |
| D23 | Per-field override dots | Fields an instance overrides show an "Overrides master" dot whose menu offers "Reset to master" for that field only. | ✅🆕 | editor/inspector/shared/controls/OverrideDot.tsx:6, 40; engine/components/ComponentManager.ts:627-629 | — |
| D24 | Instance root hides Layout/Text | An instance root shows no Layout or Text sections unless they are overridden. | ✅🆕 | editor/inspector/sections/registry/_shared.tsx:165-175 | — |
| D25 | Layers instance badge | ◇ "Component instance" badge on the row. | ✅ | editor/panels/layers/LayerTreeItem.tsx:320-324 | — |
| D26 | Variant authoring | No UI. The engine has `setVariantProperties` / `addVariant` / `updateVariant` / `removeVariant` and nothing in the editor calls them. The Variant dropdown therefore shows only "Default" for user masters. | ⏳ | ComponentManager.ts:440-482; ComponentRow.tsx:47, 73-83 | Decide: build variants or drop the dropdown. |
| D27 | Rename modal, Select Variant modal, legacy ⋯ row menu, favourites | — | ❌ | Strings absent; rename now inline (D11) | — |
| D28 | Export/import components to JSON file (engine-only) | — | ❌ | No export/import symbol in src/engine | — |
| D29 | Server mirror + workspace library | Masters live in IndexedDB, mirror to the dashboard with a retry queue, hydrate from the server, and are shared across the workspace's sites (feeds A28 and D3 LINKED). | ✅🆕 | services/componentSync.ts:1-60, 120-198 | — |
| D30 | 100-component cap | The engine caps at 100. The UI computes `isAtComponentLimit` but never shows it. | 🟡 | ComponentManager.ts:114; component-library/useComponentsState.ts:217, 261 | No user message at the cap. |

## E. Design-system component catalogue (27 canonical)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| E1 | 27-component DS catalogue (Button…Feature grid) | No UI lists or drags it. It is reachable only through AI "insert component" and a drop handler with no drag source. `useCatalog` has no consumer. | 🟡 | editor/components-catalog/catalog.ts (27 ids); editor/sidebar/tabs/ai/applySetStyle.ts:5-6, 445; editor/canvas/hooks/drag/dropOperations.tsx:597-605 | Invisible to users. Decide whether it surfaces in Add. |
| E2 | Brand › "Components" read-only summary (variants, "in use", saved count, read-only callout) | — | ❌ | Strings absent | — |
| E3 | Brand › Component styles | One card listing the 8 Add section blocks, "Default appearance ›". A row leaves Brand for Add › BLOCKS. There is no per-section style editor yet. The page action "✦ Generate with AI" has the tooltip "Coming soon: AI component styles aren't available yet" when AI is off. | 🟡🆕 | editor/design-system/ui/sections/ComponentsSection.tsx:1-30; BrandWorkspace.tsx:376-383, 605-616 | Owned by Brand. Listed here because it hands off to Add. |
| E4 | Draggable DS card grid (Atoms/Molecules/Organisms) — was built but never mounted | — | ❌ | "From your Design System" absent | — |

## F. AI panel

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| F1 | Placement | Opens in the right inspector column over the Inspector, which stays mounted. Back row "‹ Inspector" and "✕ Close AI", then the title "AI". Replaces Issues if that is open. | ✅ | editor/shell/StudioPanels.tsx:678-693, 958-972; editor/sidebar/tabs/ai/AITab.tsx:227-280 | — |
| F2 | Doors | Inspector header ✦ ("Ask AI about this element"), Page panel ✦ ("Ask AI about this page"), **⌘J**, ⌘K "Open AI assistant" / "Ask AI instead ›", right-click and Inspector ⋯ "Improve with AI" (seeds "Improve this element's copy and spacing"). | ✅ | editor/inspector/components/InspectorHeader.tsx:108; editor/inspector/components/PagePanel.tsx:236; editor/shell/hooks/useEditorShortcuts.ts:200-204; CommandPalette.tsx:129, 681; elementActions.ts:194; ai/types.ts:25 | — |
| F3 | Removed doors | AI rail tab + **I** shortcut; topbar "✨ Ask AI"; the selection-toolbar ✨ "Edit with AI" mini-popover (baseline E9). | ❌ | tabsConfig.ts (no "ai" id); editor/shell/SiteMenu.tsx:15; UnifiedSelectionToolbar.tsx:14 | L5-015 DECISION: no direct AI action on the selection toolbar. |
| F4 | Scope band + picker | "Scope: Heading text" with a ▾ menu: element · "N selected elements" · "All {type}s like this (n)" · "Page" · "Whole site (n pages)". Locked while a run is live ("Scope locked while the run is live"). | ✅🆕 | editor/sidebar/tabs/ai/ScopeChip.tsx:24-120; ai/hooks/useAIScope.ts:105-175 | — |
| F5 | Multi-element and site-wide runs | Multi-select, "similar" and site scopes run as planned runs. Baseline refused with "one element at a time in v1". | ✅🆕 | AITab.tsx:128-146 | — |
| F6 | Element column (board 35) | One element, nothing asked yet: placeholder "What would you like to change?", three suggestions (Make it more concise · Try a warmer tone · Suggest a headline), note "Returning keeps your Inspector tab, scroll and state." | ✅🆕 | AITab.tsx:55-60, 221, 370-383 | — |
| F7 | Page idle state | TRY: Make the hero warmer · Write alt text for every image · Shorten the menu descriptions. CREATE: "✦ Generate a block in Add". | ✅ | ai/EmptyThread.tsx:25-79; AITab.tsx:388-394 | The baseline DRAFT row became CREATE → Add. |
| F8 | Prompt composer | Textarea "Ask AI to change something…". Enter submits, Shift+Enter adds a newline. **Plan changes** button replaces the ↑ / ■ send-stop. Quota counter in the corner. Long prompts are trimmed to fit the URL (L2-037 fix). | ✅🆕 | ai/Composer.tsx:27-97; ai/hooks/runPromptOnce.ts | — |
| F9 | Pre-run scope note | "This run targets Hero only. Changes to page settings or publishing need a separate confirmation." (variants for multi / similar / site). | ✅🆕 | AITab.tsx:96-111, 384-387 | — |
| F10 | Chat thread | Bubbles, "Thinking…" streaming cursor, proposed-change card, "(stopped)", ↻ Regenerate. | ❌ | AITab.tsx:124-127 (Decision #23 "one conversation model") | — |
| F11 | Draft mode row + "Auto-apply steps" checkbox | — | ❌ | "Auto-apply" absent; every step waits for approval (ai/hooks/useAgentRunner.ts:265-268) | — |
| F12 | Plan review | The plan's steps are listed before anything runs. **Edit plan** (edit each step's instruction) / **Run N steps**. | ✅🆕 | ai/AgentPlan.tsx:299-323; useAgentRunner.ts:51-53, 80-82 | An element prompt skips review: it is a one-step run. |
| F13 | Run band + step list + Stop | Band: Planning / Running · i of n / Paused at step i / Done · k of n (or applied / skipped) / Stopped at step i / Stopped by you / Undone. Step glyph and word: Running, Needs approval, Pending, Skipped, No change, Failed. Stop aborts the request (L5-006). | ✅ | AgentPlan.tsx:99-146, 211-232, 327-334 | — |
| F14 | Step approval card | Amber card per step showing the from → to rows (L5-013). **Skip** / **Apply**. | ✅ | AgentPlan.tsx:336-360 | — |
| F15 | End states | Failure "Step i failed — reason" with Undo all · Keep N changes · Edit prompt. Edit prompt shows a residue note ("N changes are already applied…"). "All changes undone". Done (applied/skipped) hands back to the Inspector. | ✅ | AgentPlan.tsx:362-460; AITab.tsx:395-428 | — |
| F16 | Undo all | Reverts only the run's own history entries and stops at a newer user edit (L5-004). Re-selects the run's element. | ✅ | AITab.tsx:429-445; useAgentRunner.ts | — |
| F17 | Apply side effects | All-or-nothing apply. Honours element locks (L5-003). Touched elements flash on the canvas (FG-023). Session history rows read "AI: Rewrite the headline" (L5-022). | ✅🆕 | ai/applySetStyle.ts:634-640, 677-680, 705, 731-735 | — |
| F18 | Full-panel states | Not configured: "AI isn't available on this workspace." + "View workspace owner ↗" (composer hidden). Out of credit: "AI is out of credit." + reset time + "Workspace billing ↗". Service failed: "The AI service didn't respond." + Try again. All three end with "Continue by hand in the inspector". | ✅ | AITab.tsx:306-367 | Copy changed from the baseline. The raw server line is no longer shown. |
| F19 | Command set | set style / style variant (state + breakpoint), set text, set attribute, add element / add section, delete / duplicate / move, insert component (catalogue or saved), save as component, set page setting (SEO title / description / slug), set token, propose action. | ✅ | ai/applySetStyle.ts:132-580 | Same set as the baseline. |
| F20 | Privileged action (publish) confirm | Server-supplied title and consequence; Cancel / Publish ("Publishing…"). Toasts: Can't run that / Couldn't prepare that action / Publishing… / Published / Action failed. | ✅ | ai/hooks/useAiActionGate.ts:40-98; AITab.tsx:446-452 | — |
| F21 | One-click content actions on an element (rewrite, shorten, tone, grammar) | Not built. Only the 3 board-35 suggestion buttons approximate it. | 🟡 | L5-016 DECISION; AITab.tsx:60 | — |
| F22 | AI helpers elsewhere (pointers) | SEO "Write with AI", asset alt text, History AI summary, Brand "✦ Generate with AI". Each is owned by its own module. | ✅ | services/AltTextService.ts; editor/sidebar/tabs/pages/page-settings/SeoTab.tsx; services/ai/AIErrors.ts | — |
| F23 | Unified Editor / Build AI workspace (spec 2026-10-13) | The spec describes a separate "Build" view with tasks, drafts and agent supervision. **Nothing in code**: no Build workspace symbols in src. | ⏳ | packages/editor/docs/superpowers/specs/2026-10-13-unified-editor-ai-workspace-design.md:1-30 (status "first bounded Figma journey implemented"); no code match | Spec and Figma only. Do not treat it as shipped. |

## G. Element type reference

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| G1 | Engine element types | 52 types (heading … custom), now including **collection-list**. Theme toggle renders as a container. Layer labels come from the shared map (55 entries). | ✅ | shared/types/element.ts:85-150; shared/constants/elementTypeLabels.ts | The full table in the baseline Part F still holds apart from these additions. |

## Not verified

- No live run. Every status comes from reading code at `19f964d5e` plus the audit ledgers (2026-10-08 ISSUE-INDEX / status-not-done; 10-10 ui-ux and product audits). No screenshots, no board comparison.
- D14 residual risks (reorder misapplying overrides; breakpoint and state styles not tracked as instance overrides) are inferred from code and need a live test.
- Not checked: whether PanelSearch applies a debounce or Escape-to-clear; whether built-in component search hits are draggable; how the FROM LIBRARY count dedupes masters already on this site.
- Not checked: the server side of AI (quota, model selection, `ai.streamPrompt`) and the Generate prompt's server contract.
- The "Improve with AI" seeded prompt and the ⌘K AI rows were read in code, not exercised.
- Brand › Component styles (E3) is owned by Brand. Only its hand-off to Add was checked.

**Status counts (107 rows):** ✅ 75 (of which 🆕 43) · 🟡 9 (of which 🆕 2) · 🐞 3 · ⏳ 3 · ❌ 17 · 🚩 0 · 🔒 0 · 🧪 0


---

# Assets / Media Library · CMS / Content · Forms
Refreshed 2026-10-16 against main @ 19f964d5e. The baseline is lines 2607-2989 of `editor-feature-inventory-2026-09-16.md`. Every row was checked by reading the current code, not by walking the running app.

- **Assets** kept its shape: a drawer plus a full-page library, an image editor, stock, icons and fonts. Since 09-16 the drawer itself became the one image picker, stock collapsed to one modal, the drawer's Optimise panel and stock overlay were removed, and viewer read-only gating was added.
- **CMS** moved out of the drawer into a full **CMS workspace**: a records table, a record sheet with rich text and references, a fields table and inspector, dynamic pages, CSV/JSON import, and an inspector CMS binding section. The server is now the data authority, with an outbox, tombstones and a publish snapshot.
- **Forms** now publish to a real public endpoint, and the editor has a unified inbox. The old Store/Webhook/Email settings are gone.

**The three 10-14 P0s:**
- **Image loss after a failed asset registration: still on main** (row A56).
- **Form submissions broken: not true on current main.** The path is wired end to end in code (rows C13–C15).
- **Rich text exporting as escaped text: fixed in code on every reachable path** (row B39). The one exception is a template-export mode no caller uses (B40).

# PART A — ASSETS / MEDIA

Paths below are relative to `packages/editor/src/` unless they start with `server/`, `packages/` or `docs/`.

## A-1 Assets drawer (left sidebar, 320px)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A1 | Drawer header with live count | "Assets · N", a ⋯ menu that holds "Select assets…", and ×. The expand brackets are gone (G3-002). The count was stale after upload or delete until L4-005 fixed it. | ✅ | editor/sidebar/tabs/media/components/SlimLauncher.tsx:234-263 | The ⋯ is the only visible way into bulk select. Right-click on a card is the other, and nobody will find it. |
| A2 | Library search in the panel | `Search all N assets…` sits under the header. It moved out of the topbar (owner decision 2026-10-03). | ✅ | SlimLauncher.tsx:272-277 | The 09-16 placeholder was "Search". |
| A3 | Search-scope line (server-side search) | "Searching all 412 items…", "First 200 matches — narrow the search…" or "Couldn't reach the rest of your library". Shows only when the library is larger than the loaded page. | ✅ | SlimLauncher.tsx:335-366; editor/sidebar/tabs/media/hooks/useLibraryState.ts:373-488 | Not visible in the standalone demo, which has no server. |
| A4 | "Manage assets ›" door | A full-width quiet button under the search that opens the full-page library. | ✅ | SlimLauncher.tsx:279-298 | This is now the drawer's only door to the full library. |
| A5 | Filter ▾ popover (type + folder) 🆕 | One "Filter ▾" button. Its popover has TYPE (Images / Video / Icons) with counts and FOLDER. This replaces the 09-16 type-chip row and the separate folder dropdown. Zero-count types are disabled. | ✅ | SlimLauncher.tsx:368-440, 119-125 | Changed shape since 09-16. The filter state is hidden behind a button and shows only as "Filter (active)". |
| A6 | Asset grid + Load more | Two-column cards. "Showing N of M" with "Load more" → "Loading…" → "Try again". | ✅ | SlimLauncher.tsx:625-697 | — |
| A7 | Click-insert / replace selected | A click inserts the asset, then selects it and scrolls to it (L4-004). If a same-kind image or video is selected, the click replaces its source and carries the asset's alt (L4-003). | ✅ | editor/sidebar/tabs/media/hooks/useMediaState.ts:151-250 (replace :220) | The ~250ms double-click guard is still in place. |
| A8 | Drag asset onto canvas | Inserts at the drop point, or replaces the image or background under the cursor. It no longer writes `src` onto a section (L4-001). A library asset is no longer re-uploaded on every drag (L4-002). | ✅ | editor/canvas/hooks/drag/useDropExecution.ts:111-160; editor/canvas/hooks/drag/mediaDrop.ts | Stock drags still auto-save a forced `imported-*.webp` copy (:149-160). |
| A9 | OS file drop on canvas | Uploads the file, then places it at the drop point or replaces the image under it. Locked targets refuse. | ✅ | useDropExecution.ts:235-290 | — |
| A10 | Hover-to-select check 🆕 | Hovering a card shows a check in the thumb corner. Clicking it starts bulk select. | ✅ | editor/sidebar/tabs/media/components/AssetCell.tsx:47, 185-190 | New way into select mode. |
| A11 | Bulk bar (select mode) | A dark 44px band: "N selected · Move to… (in-drawer folder picker) · Delete · Done". | ✅ | SlimLauncher.tsx:700-797; editor/sidebar/tabs/media/MediaTab.tsx:298-310 | Move now picks a folder inside the drawer instead of opening the library. |
| A12 | Upload split button 🆕 | A dark "Upload" button with a ▾ caret that opens ADD FROM · Stock photos · Icons · Fonts. This replaces the 09-16 row of four links. The size limits moved into the Upload tooltip. | ✅ | SlimLauncher.tsx:812-890 | The accept line under Upload is gone. Its text is now only in the tooltip. |
| A13 | Drop strip, progress and failed-upload rows | A dashed strip while files are dragged over the drawer, per-file % rows, and failed rows with the reason. Size failures offer "Choose a smaller file…". An unsupported type now offers Dismiss, not Retry (L4-008). | ✅ | editor/sidebar/tabs/media/components/UploadZone.tsx:110-306 | The progress bar is synthetic. It stalls at 75% during the real PUT (audit 06 P2-2). |
| A14 | Quota band (≥80% / full) | "842 MB of 1 GB used" with "Optimise images to free space ›". When full, upload is off and the footer greys. Under 1 MB reads in KB (L4-017). | ✅ | editor/sidebar/tabs/media/components/StorageQuotaBar.tsx:80-143; UploadZone.tsx:116-118 | The engine gate now uses the plan's server quota (`c2fbccfd6`). |
| A15 | Replacement upload (oversize → smaller file) | The "Upload this replacement file?" modal, then a banner showing the landed file and "Manage in full library". | ✅ | editor/sidebar/tabs/media/components/ReplacementUploadModal.tsx; SlimLauncher.tsx:300-333 | — |
| A16 | Empty, error, loading and no-match states | Six skeleton cells while loading. Errors read "Couldn't load your media." with Try again · Browse stock. Empty reads "No images or files yet." No match reads "Nothing matches '…'" with Clear search, or "No assets matching this filter." with Clear filter. | ✅ | SlimLauncher.tsx:475-615 | — |
| A17 | Pick mode (drawer is the picker) 🆕 | When the inspector's Choose image, a background, a CMS image field or a page's share image asks for a file, the drawer becomes "Choose image". A click only chooses the card. "Use selected image" applies it. ↑ Upload and From URL open the Upload modal. Esc cancels the pick. | ✅ | editor/sidebar/tabs/media/components/PickModePanel.tsx:1-20, 97; editor/sidebar/tabs/media/data/assetPick.ts | Replaces both the 09-16 "Selecting image for:" bar, where the first click applied the file, and the 3-tab "Choose an image" modal. It is now one picker. |
| A18 | Viewer read-only gating 🆕 | A VIEWER sees Upload, Rename and Delete dimmed, with a reason tooltip. | ✅ | editor/sidebar/tabs/media/hooks/useMediaWriteAccess.ts:36-42; SlimLauncher.tsx:762-786 | The server enforces it too (`assertMediaWrite`). |
| A19 | Insert of a device-only asset | Warning toast "…is only on this device — it won't show on the page or publish." | 🐞 (see A56) | useDropExecution.ts:117-126 | The warning is correct, but the placement is then lost on save. See A56. |
| A20 | "APPLIED" badge and lock overlay on cards | The design draws them, but nothing in the drawer sets them. | ⏳ | AssetCell.tsx:11, 125 | Unchanged since 09-16. |

## A-2 Asset detail drill-in (drawer)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A21 | Hub: preview, dims, alt text + Generate | A 160px preview, then alt text that saves on blur or Enter, and a "Generate / Regenerate / Retry" link. The header's expand opens this asset in the full library 🆕. | ✅ | editor/sidebar/tabs/media/components/AssetDetailOverlay.tsx:305-420 | Auto alt runs on every upload. Owner decision L4-007 is still open (default: a workspace toggle). |
| A22 | Hub rows | Used in N places · Versions · Edit image · Optimise · Replace across site. | ✅ | AssetDetailOverlay.tsx:425-468 | — |
| A23 | Hub action list 🆕 | Insert to canvas · Rename… · Copy URL · Download · Delete, glyph-led. | ✅ | AssetDetailOverlay.tsx:473-479 | New since 09-16. It mirrors the library's actions. |
| A24 | Versions view + inline restore | Chips with the time and the size delta, plus an author line ("Ali") 🆕. The ⋯ opens an inline "Restore this version?" band. | ✅ | AssetDetailOverlay.tsx:80, 499-608 | The author comes from `media.listAssetVersions`. |
| A25 | Used-in view + Go | One row per placement with "Go ›". "Not used on any page" when unused, and the warning "Deleting this breaks N pages". | ✅ | AssetDetailOverlay.tsx:610-660 | — |
| A26 | Optimise drill-in panel | The drawer's own Optimise panel. | ❌ | AssetDetailOverlay.tsx:9-10 ("the drawer's own optimise panel is gone") | Optimise now opens the image editor's Optimise tab (A41). |
| A27 | Replace across site (drawer) | Picks the replacement from the library in pick mode (it used to be an OS file picker). The dialog then lists pages with checkboxes and "Replace N uses on M pages". One undo step covers it. | ✅ | MediaTab.tsx:131-147; editor/sidebar/tabs/media/components/ReplaceAcrossDialog.tsx:117-216 | Changed flow since 09-16. |

## A-3 Icons · Stock · Fonts
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A28 | Icon browser drill-in | Search N icons, a category dropdown, a RECENT band of 12, and a 6-column grid. A click inserts the icon. | ✅ | editor/sidebar/tabs/media/components/IconBrowserOverlay.tsx:1-40; MediaTab.tsx:338-350 | Recents are shared with the Select Icon modal. |
| A29 | "Select Icon" modal (inspector) | "N icons available", search, category pills, Size / Stroke / Colour controls, "Powered by Lucide Icons". | ✅ | editor/media/IconPickerModal.tsx:170-351 | — |
| A30 | Drawer stock browser overlay | Stock search inside the drawer. | ❌ | MediaTab.tsx:162-163 (FC-6 "StockBrowserOverlay is gone") | Both doors now open the one Stock modal (A31). |
| A31 | Stock assets modal (one surface) | Search with a Photos / Videos switch, Orientation ▾ · Colour ▾ filters, cards with attribution, Load more, and "Save to library". Saving never touches the canvas. | ✅ | editor/sidebar/tabs/media/components/StockSourceModal.tsx:1-30, 358-362, 457; MediaTab.tsx:315-337 | The 09-16 demo-icon "Icons" tab is gone (G3-036). |
| A32 | Stock: one provider missing | Shows the other provider's results instead of failing outright (`dd4665918`). The "not configured" state is still easy to reach from prominent doors (L4-010 PARTLY). | 🟡 | editor/sidebar/tabs/media/hooks/useDiscoveryState.ts:176; StockSourceModal.tsx:63 | Hide or soften the stock doors when no key is configured. |
| A33 | Stock save keeps alt and credit | No. `saveToLibrary` sets only `assetSource:"stock"`, so the provider alt and author are lost. Unsplash `download_location` is not pinged. | 🐞 audit 06 P2-4 | useDiscoveryState.ts:277-279 | Attribution is a licence obligation. Design a credit field. |
| A34 | Site fonts modal | Search, then "Uploaded fonts" cards with a sample line, "Add font" or "Added" · Remove, and the follow-on dialogs "Font added" / "No fonts found". | ✅ | editor/media/components/SiteFontsModal.tsx:57-245; editor/shell/StudioPanels.tsx:1030 | Opened by `ui:site-fonts` from every door. |

## A-4 Asset library (full-page manager)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A35 | Top bar | "Asset library", "Search all assets…" (⌘K focuses it), a tag token, a dark Upload split button (▾ Import from URL… · Add from stock…), and "‹ Back to canvas" on the right. Esc closes. | ✅ | editor/media/LibraryManager.tsx:150-170, 755-850 | UX-20 (10-10): Back to canvas sits top-right here but top-left in Templates and Brand. |
| A36 | Folder rail | Smart: Recent · In use · Unused. "My folders · Only you see these" holds All assets, nested folders and + New folder. A "Tags ▾" menu replaces the 09-16 tag pills. Assets can be dragged onto a folder. | ✅ | editor/media/components/FolderTree.tsx:359-490 | The rail says "only you" because the library is per-user, not per-site (see A57). |
| A37 | Folder delete with confirm 🆕 | Always confirms: empty folders get "Delete "X"?", non-empty ones show counts with Move files…. The 09-16 build deleted empty folders silently and ignored clicks on non-empty ones. | ✅ | LibraryManager.tsx:880-896; editor/sidebar/tabs/media/components/ConfirmFolderDeleteModal.tsx | — |
| A38 | "Trash" row | 09-16: a Trash row with a "Trash coming soon" toast. | ❌ | FolderTree.tsx (no Trash row; no "Trash coming soon" string anywhere in src) | Undo in the toast is the only recovery after a delete. |
| A39 | Grid toolbar | Count line, Filter ▾ (Format + File type), Grid/List segment, a "Grid ▾" column count (2/3/4), and a ⋯ menu with Sort by and Select assets…. | 🟡 | editor/media/components/AssetGrid.tsx:408-630 | UX-20: Grid/List is followed by a second control also labelled "Grid". Give the column count its own label. |
| A40 | List / grid views, drag ghost, file drop zone | List columns are Name · Type · Size · Usage. Cards show "used ×3" / "Unused". Dragging files over the grid shows "Drop files to upload". | ✅ | AssetGrid.tsx:365, 708-1032 | The provenance badge was removed from library cards (:957). |
| A41 | Details rail | Preview, meta line, alt text (125 max) with Generate/Regenerate, tags, versions (APPLIED marker), and "Used in" as navigable rows (FC-6). Actions: one quiet button plus a ⋯ (Rename… · Replace across site… · Optimize · Delete…). | ✅ | editor/media/components/AssetDetailsPanel.tsx:334-631, 735-878 | Most actions now sit behind a ⋯. |
| A42 | Library Regenerate alt on local-only asset | It passes the engine key as the server id, which fails for device-only assets with "try again later". | 🐞 audit 06 P2-8 | LibraryManager.tsx:988 | The drawer passes `assetId` correctly (MediaTab.tsx:184-186). |
| A43 | Asset context menu | Insert · Select · Rename… · Edit image… · Move to folder… · Copy URL · Copy alt text · Replace across pages… (now wired, G3-057) · Delete. | ✅ | editor/sidebar/tabs/media/components/MediaContextMenu.tsx:148-240; LibraryManager.tsx:1115-1120 | — |
| A44 | Library modals | Upload files / Upload complete / Import URL / Imported / Import failed / New folder (+ clash) / Rename (+ clash) / Move / Move failed / Download prepared / Versions / Apply version / Replace result (partial + Retry failed use). | ✅ | editor/media/components/*.tsx (UploadFilesModal, ImportUrlModal, ImportResultModal, CreateFolderModal, RenameAssetModal, MoveAssetsModal, MoveFailedModal, DownloadPreparedModal, VersionsModal, ApplyVersionModal, ReplaceResultModal) | All moved to the v3 dialog standard: 24px inset, right-aligned actions (`6d85414be`). |
| A45 | Confirm-delete + 8s Undo | Single or multi delete. Placements are cleared and Undo restores them. The typed-DELETE gate for more than 20 files is removed (decision #29). | ✅ | editor/sidebar/tabs/media/components/ConfirmDeleteModal.tsx:9-10; editor/sidebar/tabs/media/hooks/useSelectionState.ts:224-256 | ⌘Z still does not undo a media delete. |
| A46 | Status bar | "N assets · used / total", a quota track, and "⚠ N not on the server". | ✅ | LibraryManager.tsx (status bar), editor/sidebar/tabs/media/hooks/useServerStorageQuota.ts | — |

## A-5 Image editor
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A47 | Image editor modal (Crop · Adjust · Resize · Optimise) | A 960px modal with a cropper preview and four tabs. "Save version" creates a hidden child version, so the site is unchanged until the user applies it. | ✅ | editor/media/ImageEditorModal.tsx:137, 293-471; editor/media/image-editor/ImageEditorTabs.tsx | Restyled to v3 4418:149321 / 149547. |
| A48 | Saved state, discard and save-failed dialogs | "Version saved. Original retained." · "Discard unsaved changes?" · "Version could not be saved" with Retry. | ✅ | ImageEditorModal.tsx:385-391; editor/media/components/DiscardEditsModal.tsx:36; editor/media/components/SaveFailedModal.tsx | — |
| A49 | Output | WebP is the default, with JPEG and PNG on offer. AVIF is gone from the editor (it was offered only in the removed drawer panel). | ✅ | editor/media/image-editor/imageEdits.ts:18, 47, 97 | — |

## A-6 Pipeline / under-the-hood
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| A50 | Accepted kinds + limits | Images 10 MB, SVG 1 MB (sanitized), video 100 MB, fonts 5 MB. The engine accepts audio, but the library has no bucket for it. | 🟡 | shared/constants/media.ts:24, 72-73, 118-155 | Audio is still effectively unsupported in the UI. |
| A51 | Upload → Blob → `createAsset` registration | The signed Blob upload goes to `/api/asset-upload`, then `media.createAsset` is called (an idempotent upsert). Any failure falls back to device-only plus a retry queue. | 🟡 | services/AssetUploadService.ts:112-180; engine/media/MediaManager.ts:1061-1150, 335-420 | A failed registration discards the Blob URL and re-uploads the bytes on retry. |
| A52 | Upload progress | Fixed milestones (25/50/75), then no progress events during the network PUT. | 🟡 audit 06 P2-2 | MediaManager.ts:1002-1201; AssetUploadService.ts:128 (`onUploadProgress` is plumbed only when a caller passes it) | — |
| A53 | Auto alt text on upload | Quota-gated and rate-limited (L5-025). Alt edits now propagate to placements whose alt is empty or the old value (L4-014). | 🟡 | editor/shell/hooks/useAltTextAutoTrigger.ts:40-70 | Late mirrors still emit no `UPLOAD_COMPLETE`. Owner decision L4-007 (a toggle) is open. |
| A54 | Unconfigured alt provider | The server now maps NOT_CONFIGURED to PRECONDITION_FAILED. The client still folds every failure into "Couldn't generate alt text — try again later". | 🟡 (audit 06 P2-6 half-fixed) | server/trpc/routers/media.ts:63-86; services/AltTextService.ts (no PRECONDITION branch); editor/media/components/AssetDetailsPanel.tsx:735 | Needs a "not configured" state in the UI. |
| A55 | Server quota trusts declared bytes | `asset-upload` uses `clientPayload.bytes`. | 🐞 audit 06 P2-7 (route still gates and persists `parsedClientPayload.bytes` / `payload.bytes`) | packages/dashboard/app/api/asset-upload/route.ts:129-139, 234 | Security/billing, not UI. |
| A56 | **Image loss after failed asset registration (10-14 P0)** | If the upload or `createAsset` fails, the asset stays device-only with a `blob:` src. The element is placed, but every server save strips session URLs, so the server copy of the page has no `src`. A reload (or another device) before the retry succeeds shows an empty image. The retry remap (`LOCAL_URLS_REBUILT`) can only re-point elements that still hold the `blob:`, and the persisted page no longer does. | 🐞 confirmed on main | services/BuildrikSyncProvider.ts:830-840; shared/utils/html/sanitization.ts:261-295; engine/media/MediaManager.ts:613-649; engine/Composer.ts:475-481, 702 | Needs a visible "not yet uploaded" state on the placed element, plus blocking save/publish, or persisting an asset-id reference instead of the URL. |
| A57 | Library scope = user, not site | Two editors on one site do not see each other's uploads. | 🟡 (audit 06 P2-9; may be intended) | server/services/media.service.ts:153-156 | The rail already says "Only you see these". The owner must decide shared vs personal before the redesign. |

# PART B — CMS / CONTENT

Paths are relative to the repo root (`packages/editor/src/…` is shortened to `…/src/` only where unambiguous).

## B-1 Entry & navigation
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B1 | Rail entry | The rail tab "CMS" (shortcut D, bottom section) opens the drawer. | ✅ | packages/editor/src/editor/rail/tabsConfig.ts:231-242 | It is labelled "CMS", not "Content", and sits outside the locked 6-tool rail. |
| B2 | Drawer root | A "Collections" band with a count, a row per collection and "+ New collection". A "Data" band with Sources / Variables / Conditions rows and their counts. | ✅ | packages/editor/src/editor/sidebar/tabs/content/ContentViews.tsx:239-270 | The drawer now only picks a collection. Records open in the workspace. |
| B3 | Loading / error | Skeleton bands while loading. On error: "Couldn't load your collections." / "This is a connection problem, not a change to your data." / Try again. | ✅ | packages/editor/src/editor/sidebar/tabs/content/ContentTab.tsx:160-200 | Keep the "not a data loss" wording. |
| B4 | Drawer empty state | The spreadsheet-to-pages copy plus 4 links: Create a collection · Open Sources · Open Variables · Open Conditions. | 🐞 UX-15/16 (10-10): the links wrap, and the copy promises pages while the create modal says pages are optional and defaults the toggle off | ContentViews.tsx:159-230; packages/editor/src/editor/shell/modals/CMSCollectionSetupModal.tsx:133, 295-296 | Needs one honest model of what a collection is, and one main action. |
| B5 | CMS workspace takeover 🆕 | Replaces the canvas and inspector. Shows "CMS · {site}", "N collections · N records" and "+ New collection", with a right hint column. The topbar crumb reads "site › CMS". | 🐞 UX-15 / IA-11: the centre stays empty while the invitation sits in the far-right column | packages/editor/src/editor/cms/CmsWorkspace.tsx:137-143, 178-206 | Put the empty CTA in the centre and drop the permanent hint column. |
| B6 | Back to canvas 🆕 | "‹ Back to canvas" when the workspace was opened from an element (Open record › / Open collection ›). | ✅ | CmsWorkspace.tsx:169-176, 462-469 | Keep the return path to the element. |
| B7 | ⌘K "Manage CMS records" | Now switches to the CMS tab. The Records modal is gone. | ✅ | packages/editor/src/engine/commands/defaultCommands.ts:692-698; packages/editor/src/editor/shell/hooks/useEditorEventListeners.ts:167-175 | The label says "records" but the command opens the drawer, not a collection. |

## B-2 Collections workspace
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B8 | Collection header, tabs, ⋯ 🆕 | Name · count · primary (+ Add record / + Add field). Tabs: Records · Fields. The ⋯ holds Dynamic pages, Settings, Import CSV… and Import JSON…. | 🟡 L3-023: Dynamic pages and Settings hide behind the ⋯, and the active tab then reads only "•••" | CmsWorkspace.tsx:64-67, 216-231, 355-399 | Make Dynamic pages and Settings first-class tabs. |
| B9 | Google Sheets / Airtable | Disabled menu rows marked "Coming soon". | ⏳ | CmsWorkspace.tsx:388-397 | Needs OAuth and a security review. |
| B10 | Create Collection modal | One step: name, field rows (9 types, no reference) with "Field removed · Undo", a "Generate a page per entry" toggle and a name-clash notice. | 🐞 UX-17 / L3-023: the stepper always shows "✓ Name & Type" with "2 Fields" as the current step, even before a name is typed | CMSCollectionSetupModal.tsx:7-15, 282-293, 337, 380 | The board draws it this way, so this is a design decision. |
| B11 | Two-step wizard (baseline B9: content type, description, template/SEO) | Removed. Template and SEO moved to Dynamic pages. | ❌ | CMSCollectionSetupModal.tsx:7-15 | — |
| B12 | Collection Settings 🆕 | Rename the name and slug. A Source row. A Danger zone with a typed-DELETE delete that lists references and unbinds elements. | ✅ | packages/editor/src/editor/cms/CollectionSettingsPane.tsx:1-10; CmsWorkspace.tsx:329 | The hint copy mentions a "re-sync" that does not exist. |
| B13 | Products preset | Dropping an e-commerce block offers to auto-create a "Products" collection, optionally with sample data. | ✅ | packages/editor/src/editor/ecommerce/CollectionSetupModal.tsx; packages/editor/src/engine/cms/ProductCollectionService.ts; packages/editor/src/editor/shell/StudioModals.tsx:203-213 | This is a second create modal alongside B10. |

## B-3 Records
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B14 | Records table 🆕 | The display field, up to 3 short fields and Updated. Click a heading to sort. Cells can show "⚠ X required" or a "· Draft" suffix, and reference cells show the target's name or "Deleted record". Pages at 50 rows. | 🟡 L3-020: no status column, no row actions, no bulk select | packages/editor/src/editor/cms/RecordsTable.tsx:24-33, 160-235 | Add status and row/bulk actions. |
| B15 | Records search 🆕 | "Search {collection}…" searches every field, with a no-match state. | ✅ | CmsWorkspace.tsx:402-410; RecordsTable.tsx:205-214 | — |
| B16 | Empty collection states | "No fields yet · Add field". "No records yet · Add record · Import JSON · Import CSV". | ✅ | CmsWorkspace.tsx:250-296 | A good model for the other empty states. |
| B17 | Record sheet 🆕 | A wide sheet over the table, with fields two per row. Each type gets its own control: rich text (B/I/link/list), multiselect, reference picker, boolean, select, date and datetime, email, url, number, and an image picked through the Assets picker. | ✅ | packages/editor/src/editor/cms/RecordSheet.tsx:385-495; packages/editor/src/editor/cms/RichTextField.tsx:1-12; packages/editor/src/editor/cms/ReferenceField.tsx | Replaces the in-drawer form. No board draws the rich text toolbar. |
| B18 | Record footer | Eligibility line, Published switch, save state, Cancel and Save record / Retry save. A guard asks before discarding changes. | 🐞 L3-023: "Not eligible — not saved yet" is green text next to a warning icon | RecordSheet.tsx:657-667, 711, 725 | Colour the line by eligibility. |
| B19 | Record previews 🆕 | A live "Preview ▸" card column. The ⋯ menu has "Preview saved record", which renders the template page in a sandboxed iframe with "Open in new tab". | ✅ | RecordSheet.tsx:538-551, 600-610; packages/editor/src/editor/cms/RecordTemplatePreviewDialog.tsx; packages/editor/src/editor/cms/RecordPreview.tsx | Two preview concepts share one sheet. |
| B20 | Delete record | Deletes at once with an Undo toast. Typed DELETE is asked only when the record owns a generated page. | 🟡 Undo re-creates the record with a NEW id, so a binding pinned by id breaks (L3-020 decision open) | RecordSheet.tsx:336-351; CmsWorkspace.tsx:482-488 | — |
| B21 | Conflict / gone banners 🆕 | "Someone else changed this record. Keep mine / Use theirs". "This item is no longer available". | 🟡 L3-021: the user cannot see "theirs" before choosing | RecordSheet.tsx:612-652; CmsWorkspace.tsx:94-104 | Needs a field diff. |
| B22 | In-drawer collection / record / fields / dynamic-pages views (baseline B2–B5) | Removed. The drawer drills only into Data. | ❌ | ContentTab.tsx:1-14 | Replaced by the workspace. |

## B-4 Fields
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B23 | Fields table 🆕 | NAME · TYPE · REQUIRED · USED BY. A row opens the field inspector. | ✅ | packages/editor/src/editor/cms/FieldsTable.tsx:1-6 | Fields cannot be reordered anywhere. |
| B24 | + Add field 🆕 | Two steps: pick one of 10 types, then "Configure ‹Type› field" (Name, Key, Required, options, reference target). A key clash offers a free key. | ✅ | packages/editor/src/editor/cms/AddFieldDialog.tsx:1-14; packages/editor/src/editor/cms/fieldTypes.ts:16 | — |
| B25 | Field inspector 🆕 | Name, type and key; renaming the key migrates the records (L3-015 fixed). Required, validation, options, reference collection, and Used by with open-binding. Key and type lock while the field is bound. | ✅ | packages/editor/src/editor/cms/FieldInspector.tsx:1-12, 207-241; packages/editor/src/engine/cms/CollectionManager.ts:281-285 | Takes the inspector slot. |
| B26 | Delete field 🆕 | An unbound field gets a confirm. A bound one shows "Cannot delete — field is bound" with the way to the binding. | ✅ | packages/editor/src/editor/cms/DeleteFieldDialog.tsx:1-10 | — |
| B27 | Field-type coverage | The model has 16 types, Add field offers 10, and the create modal 9. | 🟡 | packages/shared/schemas/cms.ts:19-36; fieldTypes.ts:16; CMSCollectionSetupModal.tsx:337 | Pick one type list. |

## B-5 Dynamic pages
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B28 | Dynamic pages pane 🆕 | URL pattern, a Template page select (the home page is excluded) and SEO title/description patterns. Status lines cover no pattern, unknown field ("Use {slug}"), none published, missing template, collision and Ready, with a list of the pages it will generate. | ✅ | packages/editor/src/editor/cms/DynamicPagesPane.tsx:47-160 | Template and SEO now live here. |
| B29 | Server render + pre-publish checks 🆕 | Publishing renders one page per published record. Rich text goes out as sanitized markup and everything else is escaped. The checks catch stale or empty bindings and unbound lists. | ✅ | server/services/cms.service.ts:846-930, 1033; server/services/publish.service.ts:164-214 | Needs `FEATURE_PUBLISH` to reach users. |
| B30 | Pages-panel dynamic count | The count includes collections that have a pattern but no template. | 🐞 audit P2-4 | packages/editor/src/editor/sidebar/tabs/pages/useDynamicPagesSummary.ts:56-58 | Count only what will publish. |

## B-6 Data layer (sources / variables / conditions)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B31 | Sources | A list with a status dot, "Watching for changes", "+ Connect a source" (paste JSON) and a row ⋯ with Rename / Re-sync / Delete…. | 🐞 L3-018: sources are in memory only and vanish on reload | packages/editor/src/engine/data/DataManager.ts:315; ContentViews.tsx:303-460; ContentTab.tsx:103-137 | "Watching for changes" is false for pasted JSON. The owner default is to hide this until it is persisted. |
| B32 | Variables | `{{site.key}}` rows to add, edit or delete (with a confirm). They are now saved in project settings and substituted at export. | 🟡 the canvas still shows the braces; only the published page shows the value | ContentViews.tsx:490-497; packages/editor/src/engine/export/ExportEngine.ts:1108-1115; packages/editor/src/editor/sidebar/tabs/content/useContentPanel.ts:151-163 | — |
| B33 | Conditions | "+ New condition" starts a canvas pick, then asks for path, operator and value. The row ⋯ has Select element / Remove. | 🐞 a false condition sets `data-condition-hidden`, but nothing in CSS or export reads it, so nothing hides | DataManager.ts:513-521; ContentViews.tsx:648-779 | The baseline's "hides on canvas" is not true. |

## B-7 Binding
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B34 | Inspector › CMS binding section 🆕 | Source (Static / From CMS), Collection, Field (filtered by type), Record (newest published or a picked one), Open record ›, Unbind and + New collection…. A missing source shows "Source missing · Reconnect…". | ✅ | packages/editor/src/editor/inspector/sections/CmsBindingSection.tsx:1-24, 233-324 | Binds text, image src and link href, one undo step each. |
| B35 | Binding popover + header link button (baseline B11) | Removed. | ❌ | deleted in 4b088b255 / ebf064f4e | — |
| B36 | Bound chip | "🔗 label ▾" in the status marks, or "· missing" in the error tone. A click focuses the section. | ✅ | packages/editor/src/editor/inspector/components/StatusMarks.tsx:59-80 | — |
| B37 | Canvas follows publish / unpublish / delete | The bound element re-resolves. With no value it renders empty, the same as export (L3-016). | ✅ | packages/editor/src/engine/cms/CMSBindingManager.ts:116-118; packages/editor/src/editor/canvas/hooks/useCMSPreview.ts:84-135 | An empty bound element collapses to 0px. Its placeholder is a design call. |
| B38 | Collection list (repeater) | Collection, "Show items" and "Open collection ›". | 🟡 L3-017: the canvas shows drafts and raw `{{item.name}}` | packages/editor/src/engine/cms/RepeaterRenderer.ts:155, 344; packages/editor/src/blocks/Layout/CollectionList.tsx:44-51; packages/editor/src/editor/inspector/sections/CollectionListSection.tsx:1-7 | Needs a designed empty state and a draft marker. |
| B39 | **Rich text through export (10-14 P0)** | Rich text publishes as sanitized markup on every reachable path: bound element, list copy, dynamic page and template preview. | ✅ fixed | RepeaterRenderer.ts:42-55, 438-446; packages/editor/src/engine/cms/CMSExportResolver.ts:136-137; server/services/cms.service.ts:860-861; packages/editor/src/editor/cms/recordTemplatePreview.ts:57-61 | One allow-list on both sides. |
| B40 | Handlebars / Liquid template export mode | Emits `{{collection.field}}`, which would escape rich text. | 🧪 no caller passes `cmsMode` | CMSExportResolver.ts:197-215; ExportEngine.ts:77, 827 | Fix or delete before exposing it. |

## B-8 Sync & data authority
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B41 | Server is authority 🆕 | Opening the editor flushes the outbox and then hydrates from the server. The drawer waits for this (B3). | ✅ | packages/editor/src/editor/shell/hooks/useCmsSync.ts:50-52; packages/editor/src/services/cmsSync.ts:594 | Replaces the 09-16 "browser storage, hydrated on load". |
| B42 | Persistent outbox + retry 🆕 | Toast "Some content changes didn't sync · Retry now". Replays when back online. | ✅ | cmsSync.ts:116-141; useCmsSync.ts:71-90; packages/editor/src/services/syncRetryQueue.ts | — |
| B43 | Conflict handling 🆕 | Keep mine / Use theirs, in a toast and in the sheet. | 🟡 audit P2-7: Keep mine resends the copy from conflict time. L3-022: the server precondition is optional. | cmsSync.ts:932-934; useCmsSync.ts:110-130 | — |
| B44 | Gone / invalid 🆕 | "Record deleted" / "Collection deleted" toasts. A refused collection reads "…stays on this device only". | 🟡 L3-019: that collection's entries still queue and block publish | useCmsSync.ts:104-130 | Mark local-only collections in the UI. |
| B45 | Soft-delete tombstones 🆕 | Deleted rows get `deletedAt`, and the slug is rewritten so the name is free again. | ✅ | server/services/cms.service.ts:318, 445 | — |
| B46 | Publish gate + server snapshot 🆕 | Publish refuses with "N CMS changes haven't reached the server…" or "waiting for Keep mine or Use theirs". Pages render from the server's published rows. Caps: 100 collections, 10k entries, 200k chars. | ✅ | cmsSync.ts:459-497; packages/editor/src/editor/shell/exportPublishPages.ts:87-89; server/trpc/routers/cms.ts:138; packages/shared/schemas/cms.ts:59-61 | The caps are hard limits, not plan tiers (no CMS plan gating exists). |

## B-9 Import / export
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| B47 | Import CSV 🆕 | Upload, then a server preview with column mapping, then import. Up to 500 rows, with failed rows reported. | ✅ | packages/editor/src/editor/cms/CsvImportDialog.tsx:1-22; packages/shared/schemas/cms.ts:396; server/trpc/routers/cms.ts:118-130 | No record EXPORT (CSV/JSON) exists. |
| B48 | Import JSON | Pick a .json file; it reports "Imported N of M" and the skipped rows. | ✅ | packages/editor/src/editor/cms/useImportRecords.tsx:1-7; CmsWorkspace.tsx:385 | — |
| B49 | Records table modal (baseline B10) | Removed. | ❌ | `CMSRecordsModal.tsx` deleted in b74b4576b | Moved to B14 / B18 / B48. |

---

# PART C — FORMS

## C-1 Form building
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C1 | Form block | Build → Forms → "Form": Name and Email fields and a Submit button. | ✅ | packages/editor/src/blocks/Forms/Form.tsx:13-18; packages/editor/src/editor/sidebar/tabs/build/catalog/catalog.ts:239-243 | The fields have no labels (L3-029, not re-checked). |
| C2 | Contact Form component | Name, Email and Message with labels, and a "Send Message" button. | ✅ | packages/editor/src/blocks/Components/ContactForm.tsx:6-18; packages/editor/src/blocks/blockRegistry.ts:206 | The labels have no `for`. |
| C3 | Contact section 🆕 | The description promises "a short message form", but the right column is an empty bordered box. | 🐞 | packages/editor/src/blocks/Sections/Contact.tsx:10, 16 | — |
| C4 | Field elements | Input, Textarea, Select, Checkbox, Radio, Switch, Slider, Submit, Email, Number, Date, Time, Color. | ✅ | catalog.ts:147-244 | One flat list of about 15 items. Group it. |
| C5 | Password field on public forms | It can be placed in a form, and the value is stored and emailed in plain text. | 🐞 audit 05 P2-15 | catalog.ts:211; packages/dashboard/app/api/public/forms/[siteId]/[formBlockId]/route.ts:73 | Hide it inside forms, or warn. |
| C6 | Upload field | Hidden from Add because the endpoint rejects multipart (L3-025). | ❌ | catalog.ts:194-196; route.ts:36-38, 81 | Needs a real upload backend first. |

## C-2 Form settings (inspector, Behaviour tab)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C7 | Fields section 🆕 | Rows like "Name · Text · Required", drag to reorder, "+ Add field", and a drill-in for Label / Type / Required. | 🟡 "Label" writes `placeholder`, not a label or name, and `field-N` names can collide after a delete | packages/editor/src/editor/inspector/sections/FormFieldsSection.tsx:116-119, 135 | Separate the visible label from the submission key. |
| C8 | Per-field inspector 🆕 | Input type, Name, Placeholder, Default, Required, Disabled, plus Options/Multiple for Select. Checkbox and Radio get Name / Checked / Required. | ✅ | packages/editor/src/editor/inspector/sections/typeBlock/bodies/formBodies.tsx:47-63, 138-140 | Overlaps C7: Required and Type are editable in two places. |
| C9 | After submit 🆕 | Then: Show message or Redirect. Redirect takes a site path or an absolute URL. | ✅ | packages/editor/src/editor/inspector/sections/FormAfterSubmitSection.tsx:177-201; server/services/form-submission.service.ts:193-202 | — |
| C10 | Old settings (ACTION Store/Webhook/Email, WEBHOOK URL, ERROR MESSAGE, EMAIL FIELD NAME, FORM ID) | Removed. No UI writes `formConfig`, and the Formspree/webhook export path is dead code. | ❌ | packages/editor/src/engine/export/ExportEngine.ts:1024-1060; FormspreeInjector.ts:36-50 | Webhooks now exist only at workspace level (C17). |
| C11 | Send to (notification email) 🆕 | An email field only an ADMIN can change; anyone else sees "Only workspace Admins…". | ✅ | FormAfterSubmitSection.tsx:204; server/trpc/routers/forms.ts:81-87 | — |
| C12 | Spam protection toggle | The note says "Saved to your site straight away", but the honeypot and message change on the live site only after a republish. | 🟡 | FormAfterSubmitSection.tsx:210, 217; lib/publish-forms.ts:134-141 | Say "applies on next publish". |

## C-3 Submission path (published site)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C13 | **Publish wiring (10-14 P0 "submissions broken")** 🆕 | Each form without an action gets `action=<APP_URL>/api/public/forms/<siteId>/<elementId>`, POST, a `_return` field and an optional honeypot. The form row is upserted on publish, and publish refuses if `NEXT_PUBLIC_APP_URL` is unset. | ✅ in code; refutes the P0 | packages/dashboard/app/api/workers/publish/[jobId]/route.ts:349-356; lib/publish-forms.ts:120-160, 198-221; server/services/form-submission.service.ts:360-375 | Two risks: `\baction="` also matches `data-action=` (publish-forms.ts:129), and rows are recorded before the deploy. It applies only on the real Vercel path, not in simulation. |
| C14 | Public endpoint | Accepts urlencoded and JSON, caps bodies at 256 KB, validates with Zod, and keeps repeated keys (L3-024 fixed). | ✅ | route.ts:36-86 | — |
| C15 | Visitor outcome 🆕 | Success redirects with `?submitted=1&form=<id>` and the message replaces the form, or follows the redirect. Failures show a short page in plain words (429/413/400/404/402/500). | ✅ | route.ts:100-162; lib/publish-forms.ts:94-115 | There is no inline error state; the visitor leaves the page. |
| C16 | Spam / abuse limits | A honeypot, 10 posts per minute per IP per form, and a monthly plan cap (FREE 100 / 2,500 / unlimited). No captcha. | 🟡 | server/services/form-submission.service.ts:85-123; route.ts:40-55; lib/constants/plan-limits.ts:37, 58, 79 | The owner is not notified when the cap is hit. |
| C17 | Notifications 🆕 | Email to Send-to and the owner (deduped), an in-app notification, and the workspace `form.submit` webhook. | ✅ | form-submission.service.ts:129-178 | Real SMTP delivery not verified. |

## C-4 Forms inbox (editor Site Settings → Form submissions)
| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C18 | Unified inbox | "Submissions · All Forms" table. A row expands to its fields, with Mark spam, Archive and Delete (with a confirm). Prev/Next paging, Export CSV, and "No forms yet." when empty. | ✅ | packages/editor/src/editor/sidebar/tabs/settings/screens/FormsScreen.tsx:254-300, 370-441 | Redesigned since 09-16. |
| C19 | Inbox / Unread / Spam / Archived filters, per-form select, Not spam / Unarchive | Removed from the editor. A spammed or archived item disappears with no undo. The dashboard still has a per-form filter. | ❌ | FormsScreen.tsx:149-155, 383-389; packages/dashboard/components/site-detail/submissions-panel.tsx:186 | Add a spam/archive view or an undo. |
| C20 | "Configure in Inspector ›" 🆕 | Works only when the form is on the page already open, because `pageId` is never saved. | 🐞 | FormsScreen.tsx:217-219; form-submission.service.ts:368-374 | — |
| C21 | "Sent from <url>" | Never shows, because `sourceUrl` is never saved. | 🐞 | FormsScreen.tsx:382; form-submission.service.ts:125-127 | Save `returnUrl` into it. |
| C22 | Retention 🆕 | A cron job deletes submissions older than 365 days. | ✅ | packages/dashboard/app/api/cron/form-submission-purge/route.ts:12-15 | The UI says nothing about it. |
| C23 | Engine `FormHandler` (baseline C4 validation messages, actions, email defaults) | Built but never called at runtime. Published forms rely on the browser's `required` and type checks. | 🟡 | packages/editor/src/engine/Composer.ts:209; packages/editor/src/engine/forms/FormHandler.ts; packages/editor/src/shared/forms/FormStateOverlay.tsx (unused) | The baseline's messages no longer reach anyone. |

---

## Not verified
- **Nothing in this file was walked in the running app.** Every status comes from code tracing plus the trusted 10-08 and 10-10 audits.
- **Media**:
  - Real Vercel Blob uploads in production.
  - The A56 image-loss sequence end to end. The code path is clear, but it was not reproduced.
  - Plan quota above 1 GB.
  - CORS on Pexels video saves.
  - Undo after a click-insert.
  - The A46 status-bar copy (not re-read line by line).
- **CMS**:
  - L3-015 / L3-016 fixes in a live app.
  - Whether the bound marker survives a reload.
  - The CSV mapping UI, the rich text toolbar, and the Products preset trigger.
  - Undo re-create for a record bound by id.
  - Whether `sanitizeGeneratedPageHtml` keeps every allow-listed rich text tag on dynamic pages.
  - The "rich text escaped" P0 has no matching title in the trusted audits. It was checked directly in the export code instead.
- **Forms**:
  - A live publish, then a visitor submit, then the submission arriving in the inbox.
  - SMTP delivery.
  - The success script under a user CSP.
  - Whether the default Form block renders unstyled (L3-029).
  - DB-tier tests (not run).
- **Flags / plans**: No `FEATURE_*` flag touches media, CMS or forms. Only `publish`, `dsAi` and `collab` exist (`packages/editor/src/shared/utils/featureFlags.ts:11-16`). Dynamic pages and form wiring reach users only once Publish is on. There is no CMS or media plan gating apart from the storage quota and the form submission caps.

## Status counts (129 rows)
| Status | Assets (57) | CMS (49) | Forms (23) | Total |
|---|---|---|---|---|
| ✅ Complete | 40 | 27 | 12 | **79** |
| 🟡 Partial | 8 | 9 | 4 | **21** |
| 🐞 Bug | 5 | 7 | 4 | **16** |
| ❌ Removed since 09-16 | 3 | 4 | 3 | **10** |
| ⏳ Stub / coming soon | 1 | 1 | 0 | **2** |
| 🧪 Dev-only | 0 | 1 | 0 | **1** |
| 🚩 Flagged / 🔒 Plan-gated | 0 | 0 | 0 | **0** |

🆕 is marked on 43 rows: 9 in Assets, 24 in CMS and 10 in Forms.


---

# Site Settings, Publish, Review, Export, E-commerce, Animation, Integrations, Sync/Autosave/Recovery, Feature Flags

Refresh of baseline packages/editor/docs/editor-feature-inventory-2026-09-16.md lines 2990-3592, checked against main @ 19f964d5e (2026-10-16) by reading the code. No live walk was done. Since 09-16, Settings was rebuilt for Phase B: new IA, role-based read-only screens, Access, Danger zone, Search Mode and workspace doors. Integrations and Webhooks moved to the dashboard. The Publish wizard was folded into the Publish panel plus one shared confirm, and Animation became a row inside Interactions. Three P0 classes are still live on main: "Restore my edits" overwrites newer server work, resize gestures corrupt or undo edits, and some site-scope authz holes remain. Their fixes exist only on the unmerged feat/phase1-s* branches.

## Settings shell & navigation

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S1 | Full-pane Settings (sidebar 256 + pane) | Settings replaces the canvas: sidebar of grouped rows, pane with header, scope line, cards, conditional footer | ✅ | packages/editor/src/editor/sidebar/tabs/settings/SettingsTab.tsx:1-35 | Full-page takeover is the IA; keep site vs workspace split |
| S2 | Phase B nav IA 🆕 | Groups now: Site (General, Languages, Brand ↗) · Search & sharing (SEO) · Publishing (Domains, Redirects, Access) · Visitors (Analytics, Form submissions) · Advanced (Custom code, Security headers) · Danger zone · "Managed in workspace settings" (Members, Billing, Integrations & webhooks) | ✅ | settings/constants.ts:75-142 | One list feeds sidebar AND Overview — SSOT; renames ("Languages", "Security headers", "Form submissions") are owner copy |
| S3 | Old nav rows "Fonts & colours" / "Export" doors | Fonts & colours replaced by "Brand ↗" door (opens Brand panel); Export door removed from Settings (Export lives in Topbar/menu) | ❌ | settings/constants.ts:126-142 (no export row), :129 (branding door) | Do not re-add Export to Settings |
| S4 | Scope line per screen 🆕 | Under title: "<site> · all pages · applies on next publish" / "Live immediately · no publish needed" / "site lifecycle · changes apply immediately" / workspace line | ✅ | settings/constants.ts:203-226 | Users need to know publish vs live; preserve on every screen |
| S5 | Role-based read-only screens 🆕 | Below a screen's minimum role (ADMIN for site columns/domains, EDITOR for redirects/analytics/forms, OWNER for Danger zone) the screen opens read-only with a banner naming who can change it | ✅ | settings/constants.ts:168-180; SettingsTab.tsx:684-709 | Disabled-with-reason, never hidden — keep |
| S6 | Role foot + Permissions dialog 🆕 | Sidebar bottom: "Your role: Admin" · "Permissions" button opens the permissions dialog | ✅ | SettingsTab.tsx:1066-1080 | Not on the M0 board — redesign should place it deliberately |
| S7 | Search Mode (replaces Search modal) 🆕 | "Search" entry swaps the whole sidebar for a focused field + ✕; live results (screens + fields); ↑/↓, Enter opens screen and focuses field; Escape/✕ restores sidebar | ✅ | SettingsTab.tsx:26-35, :830-860, :950; settings/searchIndex.ts | Old centred "Search settings" modal is gone (owner override 2026-10-04) |
| S8 | Footer save bar (conditional) 🆕 | Footer only while something waits to save / save failed: status left ("Loading settings…", "Settings could not load", "Not saved", "Unsaved changes", "All changes saved"), Discard + Save right; "Retry save" after failure | ✅ | SettingsTab.tsx:779-797, :1127-1160 | Old always-on footer with Cancel/Done is gone; immediate screens get no footer |
| S9 | "Saved · applies on next publish" toast 🆕 | Successful Save shows a toast with a "Publish" action (opens the Publish panel, does not publish) | ✅ | SettingsTab.tsx:616-623 | Replaces the old "Settings saved" modal (❌) |
| S10 | Unsaved settings guard | Leaving a dirty screen (Back to canvas, Escape, nav click) asks: Keep editing / Discard / Save and continue (new third action) | ✅ | settings/components/UnsavedSettingsDialog.tsx:46; SettingsTab.tsx:475-490 | Keep all three exits guarded |
| S11 | Escape leaves Settings | Escape outside fields/dialogs leaves (guarded); in Search Mode closes search first | ✅ | SettingsTab.tsx:475-485 | — |
| S12 | Per-screen save-error banner | Red banner "X were not saved. Your changes are still here…" + server field errors under fields | ✅ | settings/constants.ts:248-258; SettingsTab.tsx:595-610 | — |
| S13 | Load / error cards blame "your connection" | Every screen's load error says "Check your connection, then try again." even for server failures | 🐞 L3-035 (DECISION) | settings/screens/OverviewScreen.tsx:173; SiteSettingsScreen.tsx:382; FormsScreen.tsx:242 | Copy needs a server-vs-network split |
| S14 | Remembered screen per site + deep links | Reopen lands on last screen; `?settings=<id>` and `ui:settings-open` (Publish checks, Page settings SEO, Pages slug repair) open a named screen | ✅ | SettingsTab.tsx:213; editor/shell/hooks/useDeepLink.ts:47; editor/sidebar/tabs/publish/PublishTab.tsx:106 | Deep-link ids are a contract (`SETTINGS_SCREEN_IDS`) |
| S15 | Plan gate — LockedScreen | Custom code below Pro shows one card "<Feature> is a Pro feature" + "Upgrade to Pro" → dashboard billing | 🔒 | settings/types.ts:215-218; screens/LockedScreen.tsx:1-10; SettingsTab.tsx:698-700 | Integrations is no longer a gated screen |
| S16 | Full-page Settings keeps covered editor chrome focusable | Tab goes through hidden Skip to Canvas / Help / Get started before Settings controls | 🐞 UX-22 / IA-07 | No `inert`/aria-hidden on background chrome in editor/sidebar/FullPageRouter.tsx or shell/StudioPanels.tsx (only LeftSidebar.tsx:483 drawer) | Full-page tools need one focus-containment contract |
| S17 | Inconsistent exits across full-page tools | Settings "Back to canvas" is a blue link top-left; Brand dark button; Assets top-right | 🐞 UX-24 | SettingsTab.tsx:985-992 | Unify exit placement in the redesign |

## Overview

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S18 | Overview group cards | One card per nav group; each screen name + live one-line summary (domain/DNS, redirects count, analytics provider, forms counts, headers, members seats, plan) | ✅ | settings/screens/OverviewScreen.tsx:1-15, :120 | Summary copy comes from `siteDetail.settingsOverview` |
| S19 | Needs attention card | Amber card listing items with "Open ›" to the named section; hidden when nothing | ✅ | OverviewScreen.tsx:216, :252 | L3-034 (stale webhook failure on a new site) FIXED wave5 |
| S20 | Site-state strips 🆕 | Archived site: "<site> is archived. The live site stays up." + Unarchive; workspace pending deletion strip with date | ✅ | OverviewScreen.tsx:234-250 | — |

## Site: General / Languages

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S21 | General · Site identity | Site name, Author, Favicon + Touch icon upload with preview, Favicon URL | ✅ | settings/screens/SiteSettingsScreen.tsx:400-472, :83-102 (upload) | Touch icon + uploads are new since 09-16 🆕 |
| S22 | General · premature validation | Empty Site name shows red error on open while footer says "All changes saved" | 🐞 UX-21 | SiteSettingsScreen.tsx:242, :407-414 (error not gated on touched) | Validate on touch/submit |
| S23 | General · Advanced › Site URL slug 🆕 | Collapsed card; edit slug, taken/format errors, confirm dialog naming the live host before save | ✅ | SiteSettingsScreen.tsx:498-499; components/SlugChangeDialog.tsx:40 | — |
| S24 | General · Language select, Social links, Grid size, Snap to grid | Moved: language → Languages, social → SEO; grid/snap no longer in Settings | ❌ | SiteSettingsScreen.tsx:21-22 | Where grid/snap went: not verified |
| S25 | Languages · Default locale (footer save) | Pick default locale, Save writes it; sets published `lang` | ✅ | settings/screens/LocalizationScreen.tsx:1-10, :239-240 | Two save models on one screen — make it visible |
| S26 | Languages · Locales table (immediate) | Add locale dialog (label — native, code), Remove with confirm (translations kept), row opens Translation checklist (RTL note) | ✅ | LocalizationScreen.tsx:265-280; components/AddLocaleDialog.tsx; RemoveLocaleDialog.tsx; TranslationChecklistDialog.tsx:47 | — |
| S27 | Languages · Auto-redirect by browser | Row removed from UI (stored value never sent); baseline listed it as honoured on published site | ❌ | LocalizationScreen.tsx:16 | Re-add only with a decision |

## Search & sharing: SEO

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S28 | SEO · Defaults card | Title, Description, Open Graph image URL | ✅ | settings/screens/SeoScreen.tsx:286-317 | — |
| S29 | SEO · Social profiles (6 networks) 🆕 | Moved from General; all six networks, @handle accepted for X | ✅ | SeoScreen.tsx:16-19; components/SocialProfilesCard.tsx | — |
| S30 | SEO · Indexing card 🆕 | Allow indexing switch, Canonical URL, editable robots.txt with generated-default preview (+ sitemap line) | ✅ | SeoScreen.tsx:57-64, :365-390 | — |
| S31 | Per-page overrides strip | Strip telling user per-page SEO lives in Pages › Page settings | ✅ | SeoScreen.tsx:5 | Two SEO homes (site vs page) — redesign must link them |
| S32 | Yoast-level SEO (structured data, sitemap UI, page overview, search/social previews, title template) | Not built; pre-publish "SEO configured" check cannot be cleared without title template | ⏳ FG-009 / L3-036 (DECISION) | No `titleTemplate` in settings/ (grep empty); SeoScreen.tsx has no preview component | Owner-planned arc (memory: SEO-M1…M12 boards) |

## Publishing: Domains / Redirects / Access

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S33 | Domains list | One card per domain, primary first with PRIMARY badge, "Connected · SSL active" line; empty card | ✅ | settings/screens/DomainsScreen.tsx:1-30 | Immediate (no footer) |
| S34 | Add a domain dialog | Domain name with live availability tag, Domain type (Primary · Redirect · Subdomain), DNS provider select, nameservers + DNS record shape preview, Force HTTPS | 🟡 | components/AddDomainDialog.tsx:1-20, :81-82, :270-302 | Nameservers are hard-coded per registrar (L3-033 DECISION) |
| S35 | Set as primary 🆕 | Non-primary verified domain → confirm dialog → live at once | ✅ | components/SetPrimaryDomainDialog.tsx:1-15; DomainsScreen.tsx:13-14 | — |
| S36 | Manage DNS view | "Domains / <domain>": status, Force HTTPS toggle, Remove (confirm), DNS records + Check DNS | ✅ | DomainsScreen.tsx:20-25 | Domain DNS CRUD (Vercel DNS) paused — FG-034, no boards |
| S37 | Redirects rules table | FROM · TO · TYPE, Edit (dialog with delete) · Delete (confirm) → toast with Undo | ✅ | settings/screens/RedirectsScreen.tsx:1-16; components/RedirectDialog.tsx; DeleteRedirectDialog.tsx | — |
| S38 | Redirects CSV import / export 🆕 | Header "Import CSV" (all-or-nothing, error/success states) · "Export CSV" | ✅ | RedirectsScreen.tsx:9, :240-251; components/RedirectCsvDialog.tsx | — |
| S39 | 404 suggester | "Suggest redirects from 404s" switch (saves at once); suggestion rows "renamed <date>" with Accept (creates 301) | ✅ | RedirectsScreen.tsx:17-22, :181 | — |
| S40 | Slug-change repair draft | After a page slug change in Page settings, Redirects opens with a prefilled repair card; Save / Cancel / "Back to <Page> SEO" | ✅ | components/RedirectRepairCard.tsx:51; RedirectsScreen.tsx:24-29 | L3-005 hijack fixed wave5 |
| S41 | Access · Password protection 🆕 | Pro card: switch, password field, "A password is set" + Change/Remove; footer save; enforced at publish via Vercel project protection | 🟡 | settings/screens/AccessScreen.tsx:1-30; server/services/publish.service.ts:996-1015 | Silently skipped (console.warn) when the workspace's Vercel plan lacks protection (402/403) — user is never told |
| S42 | Access · Share links door 🆕 | "Manage share links ↗" opens dashboard Sharing tab (all plans) | ✅ | AccessScreen.tsx:27-29 | Leaves the editor |

## Visitors: Analytics / Form submissions

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S43 | Analytics providers | GA4 (enable, Measurement ID, Connection status, Last received data), Tag Manager, Meta Pixel, Clarity; malformed id blocks Save | ✅ | settings/screens/AnalyticsScreen.tsx:1-20, :156-174 | Status reads Buildrick's own AnalyticsEvent rows, not GA |
| S44 | Analytics Verify + Connection verified dialog | Verify checks id shape, stamps verifiedAt, dialog "N events in 24h" | ✅ | AnalyticsScreen.tsx:15-18; components/ConnectionVerifiedDialog.tsx:54 | — |
| S45 | Analytics consent toggle | Hidden (nothing read it) | ❌ | AnalyticsScreen.tsx:4-6 | Re-add only with a real consent banner |
| S46 | Form submissions inbox (was "unbuilt") 🆕 | All-forms inbox FORM · FROM · RECEIVED · STATUS, 20/page; open a submission (marks read), Mark spam, Archive, Delete (confirm), Export CSV, "Configure in Inspector ›" | ✅ | settings/screens/FormsScreen.tsx:1-21, :168; lib/publish-forms.ts | Capture now real: publish rewrites action-less forms to /api/public/forms |
| S47 | Forms lifecycle edge | Never-published form already accepts public submissions; success redirect to non-existent site | 🐞 L3-027 (PARTLY fixed wave5) | docs/audits/2026-10-08-editor-full-audit/ISSUE-INDEX.md (L3-027) | Not re-walked live |

## Advanced / Danger zone / Workspace

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| S48 | Custom code | Head scripts, Body scripts (end), Global CSS cards; footer save; server refuses below Pro | 🔒 | settings/screens/AdvancedScreen.tsx:1-15; server/trpc/routers/site-detail.ts:129 (CUSTOM_CODE_NOT_AVAILABLE) | Inline `<script>` stripping note from baseline not re-verified |
| S49 | Security headers | Restore strip; CSP well; X-Frame-Options + Referrer-Policy selects; HSTS + Max age; Permissions-Policy; applied at publish | ✅ | settings/screens/HeadersScreen.tsx:1-18; lib/publish-files.ts (cspPolicy) | No board (FG-032 WONTFIX) |
| S50 | Danger zone · Archive / Unarchive 🆕 | OWNER: archive hides site from Sites list, live stays up; Unarchive at once | ✅ | settings/screens/DangerZoneScreen.tsx:1-12; components/ArchiveSiteDialog.tsx | — |
| S51 | Danger zone · Transfer site 🆕 | Creator or OWNER transfers; toast names new owner; stays enabled for creator-ADMIN | ✅ | DangerZoneScreen.tsx:11-13, :18-21; components/TransferSiteDialog.tsx | — |
| S52 | Danger zone · Delete site 🆕 | Delete modal names the live address it unpublishes; leaves to dashboard Recently deleted (30-day restore) | ✅ | DangerZoneScreen.tsx:13-16 | — |
| S53 | Workspace doors 🆕 | Members / Billing / Integrations & webhooks open a door card in the pane ("Close" · "Open workspace settings ↗") → dashboard | ✅ | settings/screens/WorkspaceDoorScreen.tsx:1-10; constants.ts:229-242, :266-270 | Replaces direct new-tab links |
| S54 | Integrations screen (Formspree, Netlify, Stripe, Mailchimp, ConvertKit, Zapier "coming soon") | Removed from the editor; integrations live on dashboard Settings › Integrations | ❌ | constants.ts:7-8, :141, :261-264 | Site menu "Plugins" deep link also gone (editor/shell/__tests__/SiteMenu.board.test.tsx:84) |
| S55 | Webhooks screen (endpoint, signing secret, deliveries) | Removed from editor (A-12) — moved to dashboard | ❌ | constants.ts:261-264 | — |
| S56 | Settings-server authz | settings/domains/redirects/forms procedures check site role (ADMIN/EDITOR) or access per siteId, and resolve row→siteId before delete | ✅ | server/trpc/routers/site-detail.ts:88-110, :289-300, :475-486; server/trpc/routers/forms.ts:22-57 | Spot-checked, not exhaustive |
## Publish panel

Path prefixes in this and later sections: `ed/` = packages/editor/src/editor/, `eng/` = packages/editor/src/engine/, `svc/` = packages/editor/src/services/, `srv/` = server/.

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| P1 | Pre-publish checks inside the panel 🆕 | Server checks list with Fix › / Connect doors; Retry state when checks fail to load | ✅ | ed/sidebar/tabs/publish/PublishTab.tsx:862-869; ed/sidebar/tabs/publish/PrePublishChecks.tsx:103-111 | Replaces wizard step 1; list is server-owned (`runPrePublishChecks`) |
| P2 | New check rows 🆕 | Image with no file, missing alt, broken link, CMS templates, template pages, empty CMS bindings, unbound Collection lists | 🟡 | srv/services/publish.service.ts:144-221; PublishTab.tsx:92-98 | Only 5 labels have a Fix › target; new rows are dead ends |
| P3 | "SEO configured" check | Fix › opens Settings › SEO, but the editor has no title-template field, so it cannot be cleared there | 🐞 L3-036 | srv/services/publish.service.ts:98; only packages/dashboard/components/site-detail/seo-tab.tsx writes `metaTitleTemplate` | Pair with Settings S32 |
| P4 | Client approval row 🆕 | "Client approval · Blocks publish / Advisory / Couldn't check" + Open › / Retry › | ✅ | ed/sidebar/tabs/publish/PublishGateBanner.tsx:52-77 | Sourced from shell/lifecycle.ts |
| P5 | Release to / Environment | Production row shows domain → Settings › Domains; Preview row "None" | 🟡 | PublishTab.tsx:871-897 | Preview environment has no backend |
| P6 | Changes in this session | Collapsible: change count, pages, ≤6 change rows, first-publish copy | ✅ | PublishTab.tsx:902-941 | Renamed from "SINCE LAST DEPLOY", collapsed by default |
| P7 | Last deploy | Collapsible "LIVE · vN · date" / "Not live" + All versions › | ✅ | PublishTab.tsx:945-977 | Unpublish moved to ⋯ |
| P8 | Panel ⋯ menu 🆕 | All versions › (History › Published); Unpublish site… while live | 🟡 | PublishTab.tsx:420-467; srv/trpc/routers/sites.ts:662-667 | Shown to EDITORs but server requires ADMIN — no UI role gate |
| P9 | Unpublish confirm 🆕 | Type UNPUBLISH to confirm; success/failure toasts | ✅ | ed/sidebar/tabs/publish/UnpublishConfirmModal.tsx:27-58; PublishTab.tsx:240-262 | One dialog for site menu + panel |
| P10 | Single CTA + gate reason 🆕 | "Publish to production"; disabled reason under it (offline, viewer, save failed, sync conflict, checks pending, nothing changed); tooltip "Replaces LIVE · vN" | ✅ | PublishTab.tsx:510-528, :1025-1079; ed/shell/lifecycle.ts:236-241 | Disabled CTA = accent at 40% |
| P11 | Progress block | "Publishing to production…", step N of M, elapsed, bar | ✅ | PublishTab.tsx:721-746 | — |
| P12 | Cancel running publish 🆕 | Cancel / Cancelling… → "Publish cancelled." + Publish again | 🟡 | PublishTab.tsx:338-350, :751-803; srv/trpc/routers/sites.ts:566-577 | Server: ADMIN only; UI shows Cancel to any publisher |
| P13 | Failure block 🆕 | "Publish failed." + reason; Try again / Repair connection / Check status | ✅ | PublishTab.tsx:533-582 | Check status resumes a lost poll |
| P14 | Publish log modal | "Publish log · Site / Production", failing step, step list | ✅ | PublishTab.tsx:585-627 | Was inline |
| P15 | Reconnect Vercel modal 🆕 | Explains fix is in dashboard; Open dashboard / "Connection restored · review publish" | ✅ | PublishTab.tsx:630-660 | — |
| P16 | Just published | Green "LIVE · vN", View live site, Compare vN-1 → vN; CTA "No new changes" | 🟡 | PublishTab.tsx:808-853, :1041 | Compare only switches to History, does not open the diff |
| P17 | Simulated publish notice 🆕 | "Simulated publish — nothing was deployed." | 🧪 | PublishTab.tsx:813-824 | Only with `PUBLISH_ALLOW_SIMULATION` |
| P18 | Flag off / deploy unreachable | "Connect Vercel to publish." / "Couldn't reach the deploy service." + Try again | 🚩 | ed/sidebar/TabRouter.tsx:200; PublishTab.tsx:677-716 | FEATURE_PUBLISH — PLANNED; only `NEXT_PUBLIC_` half ships |
| P19 | Legal line | Privacy policy · Terms of service | ✅ | PublishTab.tsx:1086-1095 | — |

## Publish confirm (wizard)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| W1 | Two-step wizard (Review → Confirm) | Stepper "Continue to Confirm →" | ❌ | PublishTab.tsx:6-10 (commit a8ababa50) | Step 1 → inline checks; step 2 → shared confirm |
| W2 | "Publish to production?" confirm | Target / Pages / Approval / Rollback facts, amber "replaces the live site" band, warnings band, blocking checks | ✅ | ed/shell/modals/PublishConfirmModal.tsx:43-140; ed/sidebar/tabs/publish/PublishConfirmFacts.tsx:188-218 | One confirm for panel + topbar |
| W3 | Checks-failed blocks confirm 🆕 | "Couldn't run the pre-publish checks, so this publish stays blocked." | ✅ | PublishConfirmFacts.tsx:80 | DQ-001 fixed |
| W4 | Open-errors gate 🆕 | "Publish with N open errors?" | ✅ | ed/shell/modals/PublishErrorsConfirmModal.tsx; ed/shell/lifecycle.ts:218 | Warnings never trigger it |
| W5 | Approval gate dialogs | No review sent / pending / changes requested, each with next step | ✅ | ed/shell/modals/PublishGateModal.tsx; ed/shell/AquibraStudio.tsx:544 | Copy mirrors server `PUBLISH_APPROVAL_MESSAGES` — change both sides together |
| W6 | Stale approval | "Publish anyway" over outdated approval (ADMIN) | ✅ | ed/shell/modals/StaleApprovalModal.tsx; srv/trpc/routers/sites.ts:476-484 | — |
| W7 | Options step / scheduled publish | Not in UI; server always refuses (NO_RENDERER) | ⏳ | srv/services/scheduled-publish.service.ts:40-56; srv/trpc/routers/sites.ts:599-660 | `schedulePublish` also passes session workspace, not site's (latent) |
| W8 | Topbar publish opens confirm over the panel | Both appear on one click | 🐞 L5-061 (DECISION) | PublishConfirmModal.tsx:76-79 | Owner decision open |

## Publish history / rollback

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| H1 | Published versions list | History › Published: LIVE · vN top, rows with ⋯, loading/error/empty | ✅ | ed/shell/PublishHistory.tsx:277-315 | Server requires EDITOR (sites.ts:685); viewer behaviour unverified |
| H2 | Republish (rollback) 🆕 | "Republish vN…" → "Republish vN as vM?" → progress / done / failed | ✅ | PublishHistory.tsx:332-336, :434, :523-663; srv/trpc/routers/sites.ts:736-771 | ADMIN only; others see disabled "Ask an admin to republish"; last 20 versions |
| H3 | Version details overlay 🆕 | "Published version", Compare with current, Republish | ✅ | PublishHistory.tsx:477-516 | — |
| H4 | One Compare host 🆕 | Split / overlay / list, picker per side; published-vs-published uses server page diff | ✅ | ed/shell/CompareHost.tsx:1-59; srv/trpc/routers/sites.ts:700-734 | Opened from Review, History, rows |

## Review

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| R1 | Availability | Review procedures return empty unless workspace has `agency_layer` DB flag | 🚩 | srv/trpc/routers/reviews.ts:146-178; srv/services/feature-flag.service.ts:9-15 | Per-workspace DB flag (not FEATURE_* env); off = approval enforcement off |
| R2 | Panel frame + status line 🆕 | "2 open · 1 resolved · Awaiting Sara"; internal-round wording | ✅ | ed/sidebar/tabs/review/ReviewTab.tsx:1-31, :138-154, :962-975 | L5-034 fixed |
| R3 | Team comments before any round 🆕 | Comments with Resolve + Send for review | ✅ | ReviewTab.tsx:1006-1008 | L5-030 fixed |
| R4 | Thread groups | OPEN · Page groups, Detached, Resolved / "Earlier resolved" | ✅ | ReviewTab.tsx:187, :825-829 | Page names, never ids |
| R5 | Locate › and Copy link 🆕 | Selects element; copies `?el=&page=` deep link; toast if element gone | ✅ | ReviewTab.tsx:484-519 | — |
| R6 | Next › walk 🆕 | Steps through open comments | ✅ | ReviewTab.tsx:198, :987-997 | Still no pager between rounds; older rounds' comments not fetchable |
| R7 | Reattach modal 🆕 | Picker for detached comments | ✅ | ed/sidebar/tabs/review/ReattachModal.tsx; ReviewTab.tsx:771 | Replaced canvas picking |
| R8 | Note composer | "Comment on <Page>…" internal notes | 🟡 | ReviewTab.tsx:1107 | No replies (L5-031), edit/delete (L5-033), @mentions (L5-032) — DECISIONS |
| R9 | Review ⋯ menu 🆕 | Compare rounds · Round history › · Open review link · Re-send / Send new link · Revoke / Withdraw | ✅ | ReviewTab.tsx:406-461 | Link only for ADMIN (token returned to ADMIN only) |
| R10 | Round history modal 🆕 | Newest first; Compare approved with current | ✅ | ed/sidebar/tabs/review/RoundHistoryModal.tsx | Replaced "Round 2 of 3 ▸" strip |
| R11 | Revoke / withdraw confirm | "Revoking does not change the approval lock or any comment." | 🐞 BK-08 | ReviewTab.tsx:1045-1059; srv/services/review.service.ts:461-478 | Authz hole: role checked on `input.siteId`, review matched only by workspace — cross-site revoke |
| R12 | Send for review popover | Client email / What changed? / Note; copy link if email failed | ✅ | ed/shell/SendForReview.tsx:59-63, :212-269; ReviewSentModal.tsx | Viewers disabled with reason |
| R13 | Compare with approved | Opens CompareHost approved → current draft | ✅ | ReviewTab.tsx:366-369; ed/shell/CompareHost.tsx | No longer a 1080×760 in-drawer window |
| R14 | Client `/review/<token>` page | Comment + sign off; "Request a new link" on dead link | 🟡 | srv/trpc/routers/client-review.ts:89-136 | No client element pins (FG-006); Review v2 (FG-001/002) unbuilt |
| R15 | Resolve as workspace ADMIN | `reviews.resolve` checks workspace ADMIN, ignores per-site cap | 🐞 BK-08 | srv/trpc/routers/reviews.ts:180-187 | Fix only on feat/phase1-s5-authz (unmerged) |
| R16 | Hand a comment to AI | — | ⏳ | — | L5-027 DECISION, behind FEATURE_DS_AI |

## Export

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| X1 | Export modal + entry points | Topbar ⋯ "Export code", ⌘K (Settings › Export door removed — see S3) | ✅ | ed/shell/StudioHeader.tsx:416-430, :860; ed/shell/StudioModals.tsx:165 | No plan gating |
| X2 | Formats | HTML / ZIP / React; Vue and Next.js "Soon"; JSON gone | ⏳ | ed/export/ExportOptions.tsx:26-29, :107-115 | Don't draw "Soon" tiles unless planned |
| X3 | Preview / Code / Options tabs | Device preview, HTML/CSS with Copy, CSS mode, minify/reset/meta, CMS content mode | ✅ | ed/export/ExportModal.tsx:338-355; ExportOptions.tsx:204-245 | "Desktop" = 1024 canvas / 1320 Preview / 1440 Export (L1-013 DECISION) |
| X4 | Preparing / Ready / Failed panels 🆕 | "Preparing your export…", "Export ready — file downloaded", "Export failed — …" + Try again | ✅ | ExportModal.tsx:58-77, :486-533 | Was toast-only |
| X5 | ZIP contents 🆕 | Every live page, styles.css, assets/, sitemap.xml (same rule as publish) | ✅ | ExportModal.tsx:72 (commit 5548d5ffc) | Hidden/password pages excluded |
| X6 | React export | Per-page .tsx + .module.css, index, package.json | ✅ | eng/export/ReactExporter.ts | Not previewable |
| X7 | Exported page fidelity | Element text with children, image without src | ✅ | docs/audits/2026-10-08-editor-full-audit/ISSUE-INDEX.md L1-002, L1-016 (fixed) | Hover on published site unverified (L2-008); DQ-023 partly fixed |

## E-commerce

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| C1 | Set Up Products Collection modal | Prompt on first product-block insert; "Include sample products" | 🟡 | ed/ecommerce/CollectionSetupModal.tsx:65-93; ed/shell/hooks/useComposerInit.ts:960-997 | Practically unreachable — Product Card/Grid/Detail not in Add panel (FG-037 DECISION) |
| C2 | Cart + Stripe checkout on published site | Add to Cart, cart count, Payment Link / checkout endpoint | ⏳ | eng/export/StripeInjector.ts:30-39; eng/export/ExportEngine.ts:654 | Nothing writes Stripe config; values injected unescaped — fix before shipping |

## Animation & Interactions

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| N1 | Standalone "Animation" inspector section | — | ❌ | ed/inspector/sections/interactions/ElementAnimationRow.tsx:1-9 (commit e51f9c98e) | Folded into Interactions; data/export unchanged |
| N2 | Animation row in Interactions 🆕 | "On page load · Fade In ›" opens editor; "Remove animation"; added via "+ Add interaction" → "Entrance animation…" | ✅ | ElementAnimationRow.tsx:17-71; ed/inspector/sections/interactions/index.tsx:150-166; AddInteractionPanel.tsx:142 | — |
| N3 | Animation editor | Entrance / Attention / Exit presets; Duration, Delay, Easing, Iterations; Preview; Generated CSS | ✅ | ed/animation/AnimationEditor.tsx:23-61, :88-92, :203-206 | ▶️ emoji Preview button breaks no-emoji rule |
| N4 | Interactions flat list + drill-in 🆕 | Rows open edit screen with ‹ back; "+ Add interaction" | ✅ | ed/inspector/sections/interactions/index.tsx:130-186 | — |
| N5 | Trigger picker | 14 grouped triggers, Lucide icons | ✅ | ed/inspector/sections/interactions/types.ts:90-109; AddInteractionPanel.tsx:127 | L2-027 fixed |
| N6 | Interaction editor | Preset, Duration, Delay, Easing, Preview, Enable/Disable, Delete | 🟡 | ed/inspector/sections/interactions/InteractionEditor.tsx:144-205 | Target / loop / reverse unsettable though runtime supports them (eng/interactions/types.ts:123-126) — hover-out never reverses |
| N7 | Published interaction runtime | click/hover/focus/mouse/scroll/page triggers, 39+ presets | 🟡 | eng/export/interactionRuntime.ts:195-211 | Ignores prefers-reduced-motion on published site |
| N8 | Transform & motion section 🆕 | Scale / rotate / move / skew + transition | ✅ | ed/inspector/sections/effects/TransformMotionSection.tsx:1-25 | Effects tab split (f7a712563) |

## Integrations (engine side)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| G1 | Email marketing (Mailchimp, SendGrid…) simulation | — | ❌ | commit 05cf74109 (DQ-009) | Module + Composer hook + form subscribe branch deleted |
| G2 | In-browser form/email service | Validation messages; "SMTP not supported in browser…" | ⏳ | svc/EmailService.ts:363-377; eng/forms/FormHandler.ts:102-109 | Real path is publish → packages/dashboard/app/api/public/forms (S46) |

## Sync, autosave & recovery

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| Y1 | Local autosave (non-dashboard sites) | Saves to browser on fixed 5 s interval | ✅ | eng/Composer.ts:582-583; eng/storage/StorageAdapter.ts:37-54 | Interval, not 5 s after last edit |
| Y2 | Dashboard autosave | Cloud save 1 s after last edit; local storage off | 🟡 | packages/editor/src/shared/constants/config.ts:112; ed/shell/hooks/useComposerInit.ts:219, :655-880 | Session-row restore never triggers a save (BK-19): eng/HistoryManager.ts:816 emits only HISTORY_RECORDED, unheard (useComposerInit.ts:897-900) |
| Y3 | Auto-retry failed save 🆕 | Network/5xx resent at 5 s doubling to 60 s, and on `online`; 4xx not resent | ✅ | useComposerInit.ts:135-137, :632-653 | Pill could show "retrying in Ns" |
| Y4 | Autosave held during conflict | Edits stay dirty under Conflict pill, not sent | ✅ | useComposerInit.ts:680-687 | Only intended stall |
| Y5 | Secrets kept out of browser storage | Email API key, site password stripped | ✅ | eng/storage/StorageAdapter.ts:170-187 | — |
| Y6 | Escape-cancelled resize | Undoes the previous unrelated edit; autosave saves the loss | 🐞 BK-03 | eng/canvas/ResizeHandler.ts:264-267 | Fix 9e1958a5e on feat/phase1-s1-gestures, unmerged |
| Y7 | Keyboard resize stores `NaNpx` | Width saves as NaNpx, survives reload | 🐞 BK-02 | ed/canvas/overlays/SelectionHandles.tsx:104-206 | Same unmerged branch |
| Y8 | Save refused (never loaded / site gone) | Typed refusal PROJECT_NOT_LOADED / gone | ✅ | svc/BuildrikSyncProvider.ts:153-166, :821-823 | — |
| Y9 | Save conflict dialog | Reload latest / Save a backup (🆕) / Overwrite (confirm); old brand format → Reload only | 🟡 | ed/shell/modals/ConflictModal.tsx:7-14, :59-83; svc/BuildrikSyncProvider.ts:193-210 | Overwrite keeps no "before overwrite" snapshot (BK-59; ed/shell/AquibraStudio.tsx:832-837) |
| Y10 | Serialized saves 🆕 | No false conflict when autosave and ⌘S overlap | ✅ | svc/BuildrikSyncProvider.ts:776-795 | — |
| Y11 | Settings mirror refused | Pages saved, setting rejected → smaller separate message; diff-only, ADMIN+ | ✅ | svc/BuildrikSyncProvider.ts:229-236, :862-874 | — |
| Y12 | CMS bindings too large 🆕 | Event fires before save is sent | 🟡 | svc/BuildrikSyncProvider.ts:238-247 | Needs visible copy |
| Y13 | Save pill | Saved · Nm ago / Save failed / Offline — changes not saved / Conflict | 🐞 BK-11 | ed/shell/StudioHeader.tsx:192-211, :374-380 | ⌘S/dirty honesty wrong on main; fix on unmerged feat/phase1-s3-recovery |
| Y14 | Save-failed card 🆕 | "Couldn't save <site> · <page>" + Retry / Keep editing | ✅ | ed/shell/SaveFailedBanner.tsx:1-12 | — |
| Y15 | Publish blocked after failed save 🆕 | "Save your changes before publishing — the last save failed" | ✅ | ed/shell/lifecycle.ts:241 | — |
| Y16 | Open in another tab notice 🆕 | Toast when a second tab opens the same site | ✅ | ed/shell/hooks/useOtherTabNotice.ts:1-18 | — |
| Y17 | Unsaved-work copy per site | Failed save keeps snapshot `bk-unsaved-v1-<site>`; never auto-applied | ✅ | svc/unsavedRecovery.ts:24-27, :96-104 | — |
| Y18 | "Restore my edits" toast | Restores kept copy over server version and saves it — teammate's newer work silently overwritten | 🐞 BK-04 (P0) | ed/shell/hooks/useComposerInit.ts:336-374; save uses fresh token svc/BuildrikSyncProvider.ts:758-760, :854 | No compare of `kept.at` vs server edit time; fix 765343348 unmerged |
| Y19 | Retry / ⌘S re-applies kept copy | Same overwrite through second entry point | 🐞 BK-04 | ed/shell/hooks/useSaveCallback.ts:208-211 | — |
| Y20 | View-mode variant 🆕 | Demoted member: "edits kept in this browser", nothing offered back | ✅ | useComposerInit.ts:326-335 | — |
| Y21 | Recovery banner (crash marker) | "Recovered your work…" Discard & reload / Keep changes; hidden when server newer | 🟡 | ed/shell/RecoveryBanner.tsx:85-116; mounted ed/shell/AquibraStudio.tsx:662-666 | Server-newer check exists but banner is off for dashboard sites — Y18 path has no check |
| Y22 | Toast closes once used 🆕 | Dismisses after hand-over/discard (EDT-018) | ✅ | svc/unsavedRecovery.ts:58-82 | — |
| Y23 | Shared mirror retry queue | Replays on online / Retry; "not on the server" toast clears on drain | ✅ | svc/syncRetryQueue.ts:57-65, :124, :181 | — |
| Y24 | Exit guard on pending mirrors | Leaving blocked while CMS/component/version/template mirrors pending | ✅ | svc/syncRetryQueue.ts:39-51; ed/shell/StudioHeader.tsx:481, :546 | — |
| Y25 | Persisted CMS outbox 🆕 | Unsent CMS edits survive reload (`bk-cms-outbox-v1`) | ✅ | svc/cmsSync.ts:116 | — |
| Y26 | CMS hydration error copy | "This is a connection problem, not a change to your data." | ✅ | ed/sidebar/tabs/content/ContentTab.tsx:167 | — |
| Y27 | Saved-templates hydration states | — | ❌ | commit d3e8b62ab; ed/shell/AquibraStudio.tsx:315-317 fire-and-forget | Failed load looks like "no templates" again |
| Y28 | Project save queue across reload | None — bare RPC; covered only by Y3 + Y17 | 🟡 | ed/shell/StudioHeader.tsx:199-204 | — |
| Y29 | Crash marker + recheck on return | Uncaught errors stamp a record; returning tab re-validates | ✅ | eng/recovery/RecoveryManager.ts:60-80, :113-126 | — |
| Y30 | Load-error banner 🆕 | auth / network / missing / forbidden with retry or sign in | ✅ | ed/shell/LoadErrorBanner.tsx:33-60 | — |
| Y31 | Local version history (50, prune auto first) | — | ✅ | eng/storage/VersionHistoryStorage.ts:184-200; eng/VersionTimelineManager.ts:54-63 | — |
| Y32 | Storage-full recovery | Drops 10 oldest auto-checkpoints and retries | ✅ | eng/storage/VersionHistoryStorage.ts:86-94 | — |
| Y33 | Versions export/import JSON | — | ❌ | commit eec76ebf6 | — |
| Y34 | Server versions + rename 🆕 | create/list/get/rename/delete | ✅ | srv/trpc/routers/site-version.ts:25-61 | — |
| Y35 | Migration progress modal | Driven by migration:* events | ✅ | ed/design-system/ui/MigrationProgressMount.tsx:6, :204; ed/shell/StudioPanels.tsx:816 | Now has UI |
| Y36 | "Project update failed" toast | "Could not update design system schema. Loaded as-is." | ✅ | useComposerInit.ts:296-303 | — |
| Y37 | Brand read-only after failed migration 🆕 | DESIGN_SYSTEM_READ_ONLY; stored tokens kept | ✅ | useComposerInit.ts:305-313 | Needs visible copy in Brand |
| Y38 | Notifications bell | Unread badge, list, error + Retry, mark read / all | ✅ | ed/chrome-ui/Topbar.tsx:296-301; ed/shell/NotificationPanel.tsx:133-266 | — |
| Y39 | Role gates disabled with reason | e.g. "Only an admin can change the domain"; ViewerRoleNotice 🆕 | ✅ | ed/sidebar/tabs/settings/screens/DomainsScreen.tsx:88; ed/shell/ViewerRoleNotice.tsx:23 | — |
| Y40 | Media upload local fallback + retry | — | 🟡 | svc/AssetUploadService.ts:142, :183 | BK-42 image loss fixed only on unmerged branch |
| Y41 | AI alt text auto | Requested automatically; typed text never overwritten | ✅ | ed/shell/hooks/useAltTextAutoTrigger.ts:40-58 | Needs OPENAI_API_KEY |
| Y42 | Asset versions | list / create / restore | ✅ | svc/MediaVersionService.ts:38-39; ed/media/components/VersionsModal.tsx:120 | — |
| Y43 | Unsaved tab-switch dialog 🆕 | Keep editing / Leave anyway | ✅ | ed/shell/modals/UnsavedTabSwitchDialog.tsx:24; ed/shell/shellDirtyRegistry.ts | — |
| Y44 | Site-scope authz on save/sync endpoints | saveProject, getProjectData, cms.*, site versions, components, user templates check role on that site | ✅ | srv/services/permission.service.ts:92-200; srv/trpc/routers/sites.ts:364-373 | — |
| Y45 | Site-scope authz holes elsewhere | `site-component.library`/`libraryGet` return whole workspace; `theme.targets`/`getShared`/`snapshots` no site scope | 🐞 BK-08 | srv/services/site-component.service.ts:185-188, :219-222; srv/trpc/routers/theme.ts:70-80, :156-163 | Fix 7140abdd2 on feat/phase1-s5-authz, unmerged |

## Feature flags

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| F1 | FEATURE_PUBLISH | Publish dropdown, CTA, confirm; off → "Connect Vercel to publish." / "Publishing isn't switched on…" | 🚩 | packages/editor/src/shared/utils/runtimeEnv.ts:84; packages/editor/src/shared/utils/featureFlags.ts:13-17; ed/shell/lifecycle.ts:237 | PLANNED; design as on |
| F2 | FEATURE_DS_AI | AI in Brand, AI client, server extractBrandFromUrl | 🚩 | runtimeEnv.ts:87; ed/design-system/ui/BrandWorkspace.tsx:596, :756, :853 | PLANNED |
| F3 | FEATURE_COLLAB | Presence, Collaborate CTA, palette entry; server kill switch | 🚩 | runtimeEnv.ts:98; ed/shell/StudioHeader.tsx:296; ed/shell/modals/CommandPalette.tsx:307 | PLANNED (owner 09-21) |
| F4 | Dev build (IS_DEV_BUILD) | Console warnings, demo presence, dirty-source tracing | 🧪 | runtimeEnv.ts:92; ed/collaboration/PresenceIndicators.tsx:53 | beforeunload prompt runs in all builds |
| F5 | Legacy static flags (AI_ASSISTANT … VERSION_HISTORY) | — | ❌ | commit 2744e419d; featureFlags.ts holds 3 flags | — |

## 10-14 P0 check (on main)

- **"Restore my edits" overwrites a teammate's newer work: STILL LIVE** (Y18, Y19). The code never compares the kept copy's timestamp with the server's last edit, and it saves with the token from the fresh load, so the server sees no conflict. RecoveryBanner does have a server-newer check, but it is switched off for dashboard sites (ed/shell/AquibraStudio.tsx:666).
- **"Autosave stalls after resize": NOT FOUND in the form described.** No resize handler touches the autosave timer, and the only intended stall is the conflict hold (Y4). Two related resize P0s are still live: BK-03 (Escape undoes the previous edit and autosave saves that loss) and BK-02 (keyboard resize saves `NaNpx`). The 10-14 audit also logged runs where no save fired, cause unexplained.
- **Site-scope authz: PARTLY FIXED.**
  - Settings, forms, publish and save/sync procedures check the caller's role on that site (S56, Y44).
  - Still open on main: `reviews.revoke` can revoke a review on another site in the same workspace (R11), `reviews.resolve` ignores a per-site role cap (R15), and the site-component library and theme snapshots are scoped to the workspace instead of the site (Y45).
  - Not an authz hole, but related: Cancel publish and Unpublish need ADMIN on the server, yet the UI shows them to EDITORs (P8, P12).

## Not verified

- Nothing was run live (no dev server). Every status comes from reading code and git history, so no Publish, Review, Export or Settings flow was exercised.
- UX-22 (focus leaking into the covered editor) is inferred from the absence of `inert` / `aria-hidden`; I did not run a Tab sequence.
- L3-027 (forms accept submissions before publish) and L3-035 (load errors blame "your connection") were taken from the audit status and copy grep, not re-walked.
- Where the old General "Grid size / Snap to grid" settings went (S24).
- Whether the baseline's custom-code inline `<script>` stripping still applies at publish.
- Password protection (S41): the code is read, but it was not tested against a real Vercel plan.
- Viewer behaviour on publishHistory / publishDiff, which require EDITOR (H1).
- Whether e-commerce blocks can be inserted through AI, templates or paste (C1).
- Hover/focus styles on the published site (L2-008); the audit itself marks this UNVERIFIED.
- The unmerged feat/phase1-* fixes were not reviewed for correctness.
- Sub-agent conflict: one agent listed "Settings › Export row" as an Export entry point, but settings/constants.ts:126-142 has no Export row. The code wins (S3, X1).

## Status counts (172 rows)

✅ 112 · 🟡 18 · 🐞 15 · 🚩 5 · 🔒 2 · ⏳ 6 · 🧪 2 · ❌ 12 — 🆕 on 62 rows.


---

# Inspector (right-hand properties panel)

The Inspector is the right-hand column that edits whatever is selected. Since Inspector v4 (landed 2026-10-02) it is a **three-tab panel — Style · Behaviour · Effects** — and no longer the flat single list described on 2026-09-16. Which sections appear comes from a per-type capability table rather than per-type section lists. A new **Page panel** replaces the "nothing selected" prompt, and the header gains a breadcrumb, in-place rename, status marks and a single ⋯ action registry. Scope/reach modes, the breakpoint picker, banners and several standalone sections (Flexbox, Grid, Corner radius, Animation, All CSS) are gone or have been folded into other sections.

Verified against code on `main @ 19f964d5e` (2026-10-16), read-only. Evidence paths: `insp/` = `packages/editor/src/editor/inspector/`, `src/` = `packages/editor/src/`. Baseline: `packages/editor/docs/editor-feature-inventory-2026-09-16.md` lines 3593-4158.

## 1. Panel frame, tabs and global states

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 1 | Tab strip Style · Behaviour · Effects | Three equal tabs, 32px tall, accent underline. Selecting another element of the same type keeps the tab; a different type returns to Style. | ✅ 🆕 | insp/ProInspector.tsx:56-62,174-179,359-368; insp/sections/registry/_shared.tsx:42-50 | Reverses 09-16's "no tab strip". Figma shells still say "Settings" for the middle tab (FG-020, WONTFIX). |
| 2 | Flat single scrolling section list (09-16 model) | — | ❌ | insp/config/sectionOrder.ts:15-54 (one order per tab) | Order is fixed per tab and the same for every type: define → shape → paint. |
| 3 | Page panel (nothing selected, or the page root selected) | Header "Home · Page"; Fill (labelled "Background"), Size (Max width only), Typography (Font + Text colour only), Spacing box; "SEO & social" link; "Your place here is kept". No tabs, no context row. | ✅ 🆕 | insp/components/PagePanel.tsx:52,101-218; insp/ProInspector.tsx:106-108,316 | Replaces the 09-16 empty state. The page is edited like an element (undo, lock gate). |
| 4 | Empty-state prompt "Select something on the canvas… / ✦ Ask AI ›" | — | ❌ | insp/ProInspector.tsx:316 (renders PagePanel instead) | |
| 5 | Page panel header actions | Breadcrumb (page alone), ✦ AI, ⋯ with a single item "Page settings…", ✕ hide. "SEO & social" shows an external-link icon but opens inside the editor. | 🟡 | insp/components/PagePanel.tsx:221-285,201-209; audit L2-034 (DECISION), L3-012 (PARTLY) | A one-item menu is a weak affordance. Decide what page actions belong here. |
| 6 | Loading skeleton (site still arriving) | 48px header bar with skeleton pill plus six skeleton rows. | ✅ | insp/components/InspectorLoading.tsx:29-51; insp/ProInspector.tsx:315 | |
| 7 | "Template applied!" banner | Pale-green card for 30 min after a template is applied: name + "Set Brand Colors" (opens Brand). Now sits on top of the Page panel. | ✅ | insp/components/PagePanel.tsx:57-58,78-99,288-307 | Uses a raw `text-white` + accent fill. |
| 8 | Error boundary | Red card "Inspector Error", the message, and "Try Again". Header stays. | ✅ | insp/components/InspectorErrorBoundary.tsx:40-81 | Uses inline style objects. |
| 9 | AI-run takeover | While the AI agent runs: "AI", the summary (or "Working…"), "Your selection is kept and restored when you go back." | ✅ | insp/ProInspector.tsx:112-126,349-356 | |
| 10 | Whole-site takeover ("Whole site" scope) | — | ❌ | (scope pill removed; see #33) | |
| 11 | Theme-toggle block inspector | A selected theme toggle shows its own panel: "Theme toggle", "Dark mode · Auto/Off", explanation, "Open Brand → Colour mode", and the warning "Dark mode is Off · Theme toggle is hidden on publish." | ✅ 🆕 | insp/components/ThemeToggleInspector.tsx:19-60; insp/ProInspector.tsx:319-325 | First "special" full-panel inspector. Pattern for other non-styleable blocks. |
| 12 | Read-only status line | "Locked — unlock to edit · Unlock" (runs unlock-element) or, tinted, "This site changed elsewhere — resolve to keep editing · Resolve". Fields stay legible but refuse edits. | ✅ 🆕 | insp/components/StatusLine.tsx:35-66; insp/ProInspector.tsx:238-250 | Replaces the old LockedBanner. |
| 13 | Section display modes | Each section is open, closed-with-summary, or a one-row "Name +" (empty, one click to add). ⌥-click / ⌥Enter on a header opens or closes every section on the tab. The choice is remembered per element type in localStorage `…-sections-v3`. | ✅ 🆕 | insp/shared/controls/Section.tsx:163-239; insp/hooks/useInspectorSections.ts:23-38; insp/tabs/InspectorTabContent.tsx:136-142 | Arrival rules: always / open / valued / closed (insp/sections/registry/_shared.tsx:86-94). |
| 14 | Per-section error band | A field that can't read its entry gets a red border, and the message appears in a live band under the section ("Enter a valid number. Choose the unit separately."). | ✅ 🆕 | insp/shared/controls/Section.tsx:62-98,256-265; insp/shared/controls/InputControls.tsx:154 | |
| 15 | Scroll memory per element | Re-selecting an element restores its scroll position; a new element starts at the top. | ✅ | insp/ProInspector.tsx:252-300 | |
| 16 | Selection announcement (screen reader) | Hidden live region: "Heading selected". | ✅ | insp/ProInspector.tsx:339-342 | |
| 17 | Footer "N of M sections apply" | — | ❌ | not in insp/ (grep "sections apply" = 0) | |
| 18 | Simplified density `?density=fewer` + "Show all controls" | — | ❌ | not in insp/ (grep "density" = 0 functional hits) | |
| 19 | "More settings" disclosure | Chevron + "More settings" + count chip; "Less" when open. Auto-opens once per element when an advanced property already has a value. | 🐞 | insp/shared/controls/MoreSettingsToggle.tsx:19-62; insp/hooks/useAdvancedSettings.ts:94-152; UX-05 (ui-ux-audit 10-10) | UX-05: template headings arrive with White Space / Word Break / Text Indent / Vertical Align already expanded, pushing Size and Spacing below the fold. The auto-open rule is unchanged on main; not re-run live. |
| 20 | ⌘K "Jump to property" | With an element selected, ⌘K lists property rows ("Padding · Style › Spacing"). Picking one switches tab, opens the section (and More settings if needed), scrolls to the row, focuses it and tints it for 1s. | ✅ 🆕 | insp/hooks/usePropertyJump.ts:1-16; insp/ProInspector.tsx:304-311 | Replaces an in-panel search bar (owner decision). |
| 21 | Hide inspector | ✕ in the header, "Hide inspector (⌘\)". | ✅ 🆕 | insp/components/InspectorHeader.tsx:116-123 | |

## 2. Header (single selection)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 22 | Breadcrumb path | "Home › Hero › Heading". The page crumb clears the selection (→ Page panel); an ancestor crumb selects it. | ✅ 🆕 | insp/components/InspectorHeader.tsx:37-51,89 | Replaces "Select parent". |
| 23 | Type icon + editable element name | Shows the layer name, else the type. Double-click, Enter or F2 renames in place; Esc cancels. Same writer as Layers. | ✅ 🆕 | insp/components/ElementNameField.tsx:22-84 | 09-16 said "not editable". |
| 24 | ✦ AI chip | "Ask AI about this element" → switches the sidebar to AI. | ✅ | insp/components/InspectorHeader.tsx:105-114 | This is the panel's only AI entry point. No one-click rewrite/shorten actions (L5-016, DECISION). |
| 25 | Pick element on canvas (crosshair) | — | ❌ | removed (InspectorElementMenu.tsx:8-10 comment) | |
| 26 | Select parent button | — | ❌ | replaced by #22 | |
| 27 | Header chain-link "Bind to collection field" popover + "Bound" chip | — | ❌ | moved to Behaviour › CMS binding (#78) | |
| 28 | Status marks row | Shown only when true: "◆ Component: {name}"; a binding chip "⌁ Collection.field ▾" (opens Behaviour › CMS binding; red "· missing" when the source collection was deleted); "🔒 Locked". | ✅ 🆕 | insp/components/StatusMarks.tsx:38-90 | Hidden during multi-select (ProInspector.tsx:344-346). |
| 29 | ⋯ Element actions menu | 320px popover: Duplicate ⌘D · Copy style ⌥⌘C · Paste style ⌥⌘V (disabled "Copy a style first") · Apply style to all {kind} "on this page (N)" · Reset style (toast with Undo) — Save as component… · Lock / Unlock — Delete ⌫. The same registry as the canvas menu and the keyboard. | ✅ | insp/components/InspectorElementMenu.tsx:38-119; src/editor/shared/elementActions.ts:105-190,243-255 | 4 more rows than on 09-16. ↑/↓/Home/End navigation, Esc returns focus. |
| 30 | "Apply style to all … on this page" confirm | "Apply this style to N H3 headings on Home?" with Copies (typography, fill, border, effects) / Keeps (text, links, CMS, layout) / Skipped (locked, inside component); a Brand text-style hint for text types; one transaction, then "Applied to N … · Undo". | ✅ 🆕 | insp/components/ApplyStyleDialog.tsx:35-88 | Replaces the "All like this" reach mode. |
| 31 | Inspector delete confirmation modal ("Delete Text?") | — (⋯ Delete runs the engine delete; the confirm appears only for N>1, from the canvas) | ❌ | src/editor/shared/elementActions.ts:178-190; insp/components/DeleteConfirmModal.tsx is now used only by src/editor/canvas/DeleteSelectionConfirm.tsx:16 | Delete is undoable (Undo toast). |

## 3. Context row — state, breakpoint, overrides

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 32 | Context row placement | Shown on Style and Effects only, never on Behaviour. | ✅ 🆕 | insp/ProInspector.tsx:327,369-380 | |
| 33 | Scope pill This / All like this / Whole site + reach banner | — | ❌ | replaced by #29/#30 (ContextRow.tsx:6-8) | |
| 34 | State chip "State: Base ▾" | Menu "Edit styles for": Base, :hover, :focus, :active, :disabled. An accent dot marks states that have overrides at this breakpoint. The chip is tinted when not Base. Edits land on that state's rule. | ✅ | insp/components/ContextRow.tsx:18-24,65-109; insp/config/pseudoOverrides.ts | Still no pressed/visited/checked/custom states. Canvas now shows :hover when the base value is inline (L2-008 fixed); the publish path was not verified. |
| 35 | State override line | "3 :hover overrides · Reset" (one undo step). | ✅ 🆕 | insp/components/ContextRow.tsx:120-127 | |
| 36 | Breakpoint picker inside the inspector | — (the inspector shows only a read-only chip "Tablet · N overrides"; the breakpoint is chosen outside, in View › Breakpoint) | ❌ | insp/components/ContextRow.tsx:110-118 | UX-06: the breakpoint is hidden in a View submenu. A redesign should decide where the breakpoint lives. |
| 37 | Breakpoint revert line | "Tablet · Revert" removes all of this element's overrides on the breakpoint. | ✅ 🆕 | insp/components/ContextRow.tsx:128-135 | |
| 38 | Field override dot as a control | A 6px dot by an overridden field, with a 24px target. It announces "Overridden on Tablet / :hover" or "Overrides master" and its menu offers "Reset to Desktop / Base / master". The section header carries a dot and a bottom note ("● Overridden on Tablet"). | ✅ 🆕 | insp/shared/controls/OverrideDot.tsx:1-40; insp/shared/controls/Section.tsx:224,251-253; insp/hooks/useFieldOverrides.ts:1-20 | Replaces the 09-16 "Overridden on Tablet — Base is 16px" rows. |
| 39 | Override information shown several times | One font-size change at Mobile produces the chip "Mobile · 1 override", a "Mobile · Revert" line, a section dot, a field dot and a note, plus a dot on Text style. | 🐞 | UX-14 (ui-ux-audit 10-10); insp/components/ContextRow.tsx:110-135 + OverrideDot.tsx | The structure is unchanged on main. Consolidate in the redesign. |
| 40 | State banner "Editing :hover — not Base" | — | ❌ | replaced by the chip tint (#34) | |
| 41 | "Detach instance" pill in the context row (Pro only) | — | ❌ | moved to Component row ⋯ (#49) | |
| 42 | Effective (inherited/computed) values in fields | At Tablet/Mobile and in :states, fields show inherited values, not type defaults (L2-018 fixed). However, the line height reads 1.1× while the canvas measures 1.5×, the Align group shows no selection for an inherited `center`, and Font size shows "16px" when unset. | 🐞 | UX-10, UX-25, IA-10 (10-10 audits); insp/sections/typography/FontControls.tsx:62-65,96-102 | "Inspector equals canvas" is the top trust gap per both 10-10 audits. Not re-measured live on main. |

## 4. Multi-selection (2+ elements)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 43 | Multi header | "3 selected · Headings" (or "· Elements"); the path is the shared parent's own. No type icon. | ✅ 🆕 | insp/components/InspectorHeader.tsx:75-80,92-100 | |
| 44 | Align / Distribute / Group bar | Align: 6 glyph buttons (2+). Distribute: Horizontal / Vertical (3+; tooltip "Distribute needs 3 or more elements"). Group (only when the elements share a parent). Note "Edits apply to all N. One Undo restores all N." | ✅ | insp/components/MultiSelectBar.tsx:38-117 | Group is new. Glyphs are text arrows (⇤↔⇥↥↕↧), not icons. |
| 45 | Same panel, intersection of sections, "Mixed" fields | The full tabbed panel. A section shows only if every selected type has it; the type block shows only if all share it. Fields that disagree read "Mixed" (amber). Writes land on every element in one undo step. | ✅ 🆕 | insp/tabs/InspectorTabContent.tsx:74-84; insp/ProInspector.tsx:142-148,218-232; insp/shared/controls/InputControls.tsx (Mixed) | |
| 46 | 5-row batch style panel (Background / Text color / Radius / Padding / Font size) | — | ❌ | replaced by #45 (MultiSelectBar.tsx:10-12) | |

## 5. Which sections appear for which element type

Style order: Component · Type block · Layout · Typography · Size · Spacing · Fill · Border · Text inside. Behaviour order: Fields · After submit · Slides · Playback · Collection · Link · CMS binding · Visibility · Interactions · CSS classes · Attributes. Effects (every type): Opacity · Shadow · Filters · Transform & motion · Advanced.

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 47 | Capability table drives presence | Every element type has one row of capabilities: type block, layout, typography (open / inside / none), link, CMS-bindable, extra behaviour sections, structural child. An unknown type reads as a container. | ✅ 🆕 | src/shared/constants/elementCapabilities.ts:47-194; insp/tabs/InspectorTabContent.tsx:75-84 | Replaces 09-16's per-type order profiles. |
| 48a | Text types: heading, text, paragraph, link, label | Style: Type block, Typography (open), Size, Spacing, Fill, Border. Behaviour: Link (link only), CMS binding (not label), Visibility, Interactions, Classes, Attributes. | ✅ | elementCapabilities.ts:114-118 | |
| 48b | Button | Style: Type block, Size, Spacing, Fill, Border, Text inside (closed). Behaviour: Link, CMS binding + common. | ✅ | elementCapabilities.ts:121 | |
| 48c | Form fields: input, textarea, select, upload; checkbox, radio, switch | Style: Type block (Input or Choice), Size, Spacing, Fill, Border, Text inside. Behaviour: Visibility, Interactions, Classes, Attributes only. | ✅ | elementCapabilities.ts:124-130 | Upload is hidden from Add (L3-025). |
| 48d | Media: image, video, audio, svg, icon, lottie, video-embed, map-embed | Style: Type block, Size, Spacing, Fill, Border (no typography, no layout). Behaviour: CMS binding (image only) + common. | ✅ | elementCapabilities.ts:133-140 | |
| 48e | Spacer, divider | Style: Size, Spacing, Fill, Border only (no type block). | ✅ | elementCapabilities.ts:141-142 | |
| 48f | Widgets: countdown, progress, accordion | Style: Type block, Size, Spacing, Fill, Border, Text inside. Accordion has no Layout. | ✅ | elementCapabilities.ts:146-149 | |
| 48g | Layout primitives: flex, stack, grid, columns | Style: Type block (flex/grid controls), Size, Spacing, Fill, Border, Text inside. No Layout section. | ✅ | elementCapabilities.ts:152-155 | |
| 48h | Containers: container, section, card, cta (+ Link); hero, features, header, footer, nav, navbar, pricing, social, testimonials, tabs, list, table, gallery, custom, product-* | Style: Layout, Size, Spacing, Fill, Border, Text inside. Behaviour: Link only for container/section/card/cta. | ✅ | elementCapabilities.ts:158-186 | navbar, tabs, gallery, social and product-* still have no type-specific settings (see Gaps). |
| 48i | Structural child (list-item) | Minimal panel: no Link and no CMS binding. | ✅ 🆕 | elementCapabilities.ts:62-64,176 | |
| 48j | form / slider / collection-list | Container sections plus Fields + After submit / Slides + Playback / Collection on Behaviour. | ✅ 🆕 | elementCapabilities.ts:179-181 | |
| 48k | Component instance root | Adds the Component row above the type block. Layout and Text inside are hidden unless the instance already overrides one of their keys. | ✅ 🆕 | insp/sections/registry/component.tsx:12-20; insp/sections/registry/_shared.tsx:164-174 | |

## 6. Style tab — Component row and type block

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 49 | Component row (instances) | "Variant [Default ▾]" (switches the variant); "Edit master ↗"; ⋯ → "Reset to master" / "Detach instance…", each with a confirm, then toast + Undo. Refused while read-only. | 🟡 | insp/sections/ComponentRow.tsx:117-179; audit L2-022 (DECISION), L2-029 fixed | "Edit master" opens a management screen; there is no in-place master editing (L2-022). |
| 50 | Type block frame | A section titled with the type's own name ("Heading", "Checkbox"), always open, its body chosen by the true type. | ✅ 🆕 | insp/sections/typeBlock/TypeBlockSection.tsx:22-31; insp/config/typeBlocks.ts:38-45 | |
| 51 | Heading block | Level H1–H6 segmented (rewrites the tag on the whole selection, one undo step); "Text style" select (Brand type styles bind `font-size` to the token; "Custom" unbinds without moving anything); "Edit text on canvas". | ✅ 🆕 | insp/sections/typeBlock/bodies/textBodies.tsx:45-85,124-130 | |
| 52 | Text / Paragraph / Link / Label block | Text style + "Edit text on canvas" (starts the canvas inline edit). | ✅ 🆕 | textBodies.tsx:132-137; insp/sections/typeBlock/EditTextRow.tsx:23-44 | The text-content textarea from 09-16 is gone on purpose; text is edited on the canvas only. |
| 53 | Button block | Edit text on canvas · Type Button / Submit / Reset · Disabled checkbox. | ✅ | textBodies.tsx:87-118,139-145 | 09-16's Button Label / Link URL / Open In moved to Link (#77). |
| 54 | Input / Textarea / Select / Upload block | Input type (14 types: Text…Color; no checkbox/radio), Name (with warning when the name is `name`/`id`/`submit`/`action`/`method`), Placeholder, Default; Rows (textarea); "Options (one per line)" (select); Required / Disabled / Multiple checkboxes. | ✅ | insp/sections/typeBlock/bodies/formBodies.tsx:30-91; insp/sections/typeBlock/PropertyField.tsx:58-125 | The name warning uses an inline style object (PropertyField.tsx:25-32). |
| 55 | Checkbox / Radio / Switch block | Edit text on canvas · Name · Checked by default · Required. Writes go to the inner `<input>`. | 🐞 | formBodies.tsx:115-143; src/blocks/Forms/Radio.tsx:19; insp/config/attributeFields.ts:23-100 (no radio row) | **No Value control for radio (10-14 item, confirmed on main).** The block ships `<input type="radio" name="radio-group"/>` with no `value`, and nothing in the inspector can set one, so every option in a group submits "on". The same gap applies to checkbox values. |
| 56 | Image block | Source row: thumbnail, file name, "2400 × 1600 · 428 KB", "Choose image"/"Replace" (Assets drawer in pick mode, "For Hero · Image"); Alt text + hint "Add alt text so everyone can understand this image."; Fit Cover / Contain / Fill (follows breakpoint/state); Loading Lazy/Eager. | ✅ | insp/sections/typeBlock/bodies/mediaBodies.tsx:65-77; insp/sections/typeBlock/SourceRow.tsx:109-165 | Fit lost None / Scale-down. Replacing now resets alt (L4-003 fixed). Decoding moved to Attributes. |
| 57 | Video block | Source row · Poster image (URL text field) · Autoplay · Muted · Loop · Show controls · Plays inline · warning "Browsers block autoplay with sound. Turn on Muted." | ✅ | mediaBodies.tsx:91-116 | Poster has no media picker. Preload moved to Attributes. |
| 58 | Audio block | Source row ("Choose audio") · Show controls · Loop · Autoplay. | ✅ 🆕 | mediaBodies.tsx:79-89 | |
| 59 | SVG block | Source row ("Choose SVG"). Picking a file turns an inline `<svg>` into `<img>`. | ✅ | SourceRow.tsx:96-107; mediaBodies.tsx:134-136 | The Asset library full page is no longer opened from here. |
| 60 | Icon block | "Change icon" (icon picker) · Icon size 16–64px · Stroke width 1–3. | ✅ | mediaBodies.tsx:118-163 | No icon-colour row (colour comes from Typography/Fill). |
| 61 | Video embed block | Video URL + "Detected: YouTube" (or "Not a link we can embed…"); Ratio 16:9 / 4:3 / 1:1 (also clears the legacy padding box); Autoplay; Muted; Show controls; autoplay-with-sound warning. | ✅ 🆕 | insp/sections/typeBlock/bodies/embedBodies.tsx:49-90 | |
| 62 | Map embed / Lottie blocks | "Location" (address or Google Maps link) / "Animation URL" (lottie.host), each with a "Detected: …" line. | ✅ 🆕 | embedBodies.tsx:92-98 | |
| 63 | Countdown block | "Ends at" (typed "2026-12-31 23:59") · "Uses the visitor's time zone." · When done Show message / Hide · Message. | 🟡 | insp/sections/typeBlock/bodies/widgetBodies.tsx:47-89 | Free-text date with no picker. An unreadable entry is silently not saved, with no error message. |
| 64 | Progress block | Value · Maximum (number fields with stepper) · Show label. | ✅ 🆕 | widgetBodies.tsx:104-181 | |
| 65 | Accordion block | One "1 · Reservations [Open/Closed]" row per item · "Allow several open at once". | 🟡 | widgetBodies.tsx:187-258 | Items cannot be added, removed, renamed or reordered from the inspector. |
| 66 | Flex / Stack block | The flex controls themselves (#69), with their own More settings toggle. | ✅ 🆕 | insp/sections/typeBlock/bodies/layoutBodies.tsx:42-44 | |
| 67 | Grid block; Columns block | Grid: grid controls (#70). Columns: Columns 2–6 + Gap None/8/16/24/32 (adds or removes column children). | ✅ | layoutBodies.tsx:21-51 | |
| 68 | Product type block | Reserved id. No body, so product-* elements fall back to the container panel. | ⏳ | src/shared/constants/elementCapabilities.ts:20-21,42,184-186; insp/config/typeBlocks.ts:7-8 | Ecommerce arc (Q7) deferred. |

## 7. Style tab — Layout, Typography, Size, Spacing, Fill, Border

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 69 | Layout › Display + flex controls | Display segmented Block · Flex · Grid · None; "Inline" select (Inline block / Inline / Inline flex / Inline grid) in More settings or when one is active. When Flex: Direction Row/Column, 3×3 align grid with words ("Align / Center / Center"), Wrap checkbox, Gap; More adds Reverse order, Justify, Align items, Reverse lines, Align lines, Row gap, Column gap. | ✅ | insp/sections/layout/DisplayControls.tsx:22-52; insp/sections/layout/FlexControls.tsx:93-223; insp/sections/layout/GapRow.tsx:22-45 | The 6 diagram glyphs, abbreviated "sta/cen/end" rows and "Enable Flex" box from 09-16 are gone. |
| 70 | Layout › grid controls | Columns (a count from 1–24, written as `repeat(N, 1fr)`), Gap. More: Column tracks (raw), Rows, Flow, Items 9-dot pad, Justify, Align rows, row/column gap. | ✅ | insp/sections/layout/GridControls.tsx:55-113 | The 8 column-template preset tiles (2 Col…Holy) were removed. |
| 71 | Layout › Position | "Position [Static ▾]" select with (i) help. When not static: offset cross (top/left/right/bottom) + Z-Index. | ✅ | insp/sections/layout/PositionControls.tsx:30-181 | Now on the face, not in More settings. The offset fields are raw TextInputs (no unit/stepper). |
| 72 | Layout › More: Overflow, Visibility & Float | Overflow vis/hid/scr/aut + X/Y selects + content/border box-sizing; Visible vis/hid/col; Float; Clear. | ✅ | insp/sections/layout/OverflowVisibilityControls.tsx:30-99; insp/sections/layout/index.tsx:57-64 | Still uses three-letter jargon buttons. |
| 73 | Standalone Flexbox / Grid / Corner radius sections | — | ❌ | insp/sections/registry/box.tsx:4-8; insp/sections/BorderSection.tsx:1-4 | Folded into Layout, the type blocks, Size (#76) and Border (#81). |
| 74 | Typography (open, text types) | Font (picker #75), Font size (px/em/rem/%/vw), Line height (px/×/em/%/normal), Weight, Colour, Align Left/Center/Right. More (9): Transform, Decoration, Letter, Word, Style, White Space, Word Break, Text Indent, Vertical Align. The Page panel shows Font + Text colour only. | ✅ | insp/sections/typography/index.tsx:48-87; insp/sections/typography/FontControls.tsx:40-104; insp/sections/typography/TypographyControls.tsx:27-140 | Justify was removed from Align. Font-size/line-height token chains are gone (Text style #51 replaces them). See #42 for value-accuracy bugs. |
| 75 | Text inside (closed with summary) | On containers, buttons, fields and widgets: the same typography body, closed, with a summary "Inter · 16px · Text / primary" (rendered values, tokens named). | ✅ 🆕 | insp/sections/registry/text.tsx:93-130 | |
| 76 | Font picker panel | Search "Search fonts...", tabs All / Sans Serif / Serif / Display / Monospace, "Showing 50 of N Google fonts", groups Uploaded · System (Inherit, System, Arial, Georgia, Times New Roman, Courier New) · Google Fonts, foot "Manage site fonts". | ✅ | insp/sections/typography/FontPickerDropdown.tsx:63,113,278,300,321; insp/sections/typography/FontPicker.tsx:34-46 | Capped at 50 results. These are site-output fonts, not chrome. |
| 77 | Size › Width / Height | The label is the mode menu: "Width · Fill" (Fixed / Fill / Hug). Fill shows the measured px as a readout; typing a number makes it Fixed. Hug shows "Hug · Auto ▾". Esc restores the value from focus. | ✅ | insp/sections/SizeSection.tsx:36-50,165-298 | The Fixed/Fill/Hug card buttons are gone (now a menu). |
| 78 | Size › spacing-token chain (Fixed) | Hover-revealed link icon → spacing token list. When bound: an accent pill with the token name and a click to unlink. | ✅ | SizeSection.tsx:56-119,286-292 | |
| 79 | Size › More: Min / Max width / height | Four unit rows (empty when unset). | ✅ | SizeSection.tsx:322-381 | |
| 80 | Size › flex/grid item controls | Parent is flex: Grow, Align self; More: Shrink, Basis, Order. Parent is grid: Column span / Row span (1–4, Full row; custom kept); More: Align self, Justify self. | ✅ 🆕 | insp/sections/layout/ItemControls.tsx:58-107; insp/sections/registry/box.tsx:77 | Explicit grid Col/Row start fields were removed (span only). |
| 81 | Size disabled-reason on inline elements | — The rule still marks width/height disabled with "Inline elements ignore width/height", but Size only reads `hidden`, so inline elements get live, ineffective width fields with no explanation. | 🟡 | insp/config/cssContext.ts:145-151; SizeSection.tsx:342,362-381 | Spacing passes `disabled` but shows no reason text (SpacingSection.tsx:68-69). |
| 82 | Spacing box | Grey margin box around a white padding box, a number on each edge, content chip in the middle. ↑/↓ step 1 (Shift 10), Esc reverts, unit kept, auto/inherit accepted; a token-bound side shows a green diamond that opens Brand on the token. "Link sides" writes all four sides of the box being edited. | ✅ | insp/shared/controls/SpacingControls.tsx:28-180,187-258; insp/sections/SpacingSection.tsx:51-96 | Numbers are 16px tall (owner exception to WCAG 2.5.8). "Link sides" isn't remembered. DQ-015: box labels render in mono (DECISION). |
| 83 | Spacing face pair rows (vertical/horizontal) and Gap rows | — | ❌ | SpacingSection.tsx:5-7 | Gap moved to the flex/grid controls. |
| 84 | Fill › Colour | Empty → "Fill +". Colour row (labelled "Background" on the Page panel). The Colour / Gradient / Image switch stays behind More settings until a gradient or image is set. | ✅ | insp/sections/BackgroundSection.tsx:126-160 | Shorthand `background` colour now read correctly (L2-011 fixed). |
| 85 | Fill › Gradient | Linear / Radial, Color 1, Color 2, Angle slider (linear). | 🟡 | BackgroundSection.tsx:161-260 | Two stops only. No multi-stop editor or stop positions. |
| 86 | Fill › Image | Image URL + "Browse" (media library). More: Size, Position (9), Repeat, Attachment (incl. Parallax), Blend Mode. | ✅ | BackgroundSection.tsx:265-375 | The header "+ Add background image" shortcut is gone. |
| 87 | Border | Face: Radius (one value, or TL/TR/BR/BL with link toggle once corners differ). Width / Style (9) / Colour appear once a stroke exists or More is open. More: Individual borders (Top/Right/Bottom/Left text), Outline Width / Style / Color / Offset. | ✅ | insp/sections/BorderSection.tsx:66-262 | Corner radius folded in. The hidden schema-driven border variant from 09-16 is no longer in BorderSection. |

## 8. Colour, tokens and shared controls

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 88 | Colour row | Swatch (opens the popover) + hex field. When bound, the token name sits inside the field (click → Brand on that token), with Unlink and then "Relink to X". Shows an inherited placeholder, "Mixed" for multi-select, and the error "Use a hex like #1A56DB or pick a token." | ✅ | insp/shared/controls/ColorInput.tsx:54-60,99-240; insp/sections/DSBindingChip.tsx:1-15 | The eye toggle was removed (G2-161). The amber "off-system ⚠" and blue preset chip states are gone. |
| 89 | Colour popover (board 33) | "Brand colours" rows (swatch, name, hex, Use) · "Add colours in Brand" · ✎ Edit token: "Update everywhere (N×)" or "Only this element" · Pro: search + "N of M match" · closed "Custom colour" visual picker (shade, hue, alpha, contrast ratio, Apply). | ✅ 🆕 | insp/shared/ColorFillPopover.tsx:1-60; src/editor/design-system/ui/colors/ColorPicker.tsx:3; ColorInput.tsx:336 | 09-16 said there was no alpha and no "Update everywhere"; both now exist. Still no eyedropper or recents. Internal primitives were filtered out (L4-025 fixed). |
| 90 | Number + unit field | Number, stepper, unit dropdown. ↑/↓ ±1, Shift ±10; Enter commits; Esc restores the value from focus; empty clears; an unreadable entry shows a red border + section error. A token-bound value shows its resolved number. | ✅ | insp/shared/controls/InputControls.tsx:122-400 | 09-16 said "no arrow-key nudging"; that is now built. Drag-to-scrub is still absent. |
| 91 | Live writes | The canvas follows the field during typing/dragging; a burst folds into one undo step. | ✅ | insp/hooks/useStyleHandlers.ts:325-334 | Replaced the 300ms debounce (L2-019 fixed). |
| 92 | Read-only + lock gate | When locked or in conflict, every control stays readable but refuses the change (never `disabled`). Every write passes the engine lock gate. | ✅ | insp/shared/controls/InspectorFieldContext.tsx:22-36; insp/sections/typeBlock/EditTextRow.tsx:24-38; src/editor/AGENTS.md:20 | |

## 9. Effects tab

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 93 | Opacity | "Opacity +" until set, then a 0–100% slider. | ✅ 🆕 | insp/sections/effects/OpacitySection.tsx:12-29; insp/sections/registry/effects.tsx:20-27 | |
| 94 | Shadow | Outer preset select (Subtle / Soft / Medium / Large / Glow / Custom), Inner preset select (Soft…All sides). More: "Outer CSS", "Inner CSS" raw fields. | ✅ | insp/sections/effects/ShadowSection.tsx:15-68 | The preset tiles became selects. No visual x/y/blur/spread/colour editor. |
| 95 | Filters | Sliders: Blur 0–20px, Brightness 0–200%, Contrast 0–200%, Grayscale 0–100%. Each merges into `filter`. | ✅ | insp/sections/effects/FiltersSection.tsx:15-38 | |
| 96 | Transform & motion | Scale %, Rotate °, Move X / Move Y (text), Skew °; "Transition": Animate (All…Shadow), Duration, Delay (free text), Easing. | ✅ | insp/sections/effects/TransformMotionSection.tsx:36-55 | Duration/Delay aren't validated or unit-guided. |
| 97 | Advanced (Effects) | Closed, summary "Cursor: auto · Blend: normal": Cursor (13), Blend (10), Text shadow, Will change. | ✅ | insp/sections/effects/EffectsAdvancedSection.tsx:14-58; insp/sections/registry/effects.tsx:60-69 | FG-022 (Figma "More effects" expander vs this split) is still a DECISION. |

## 10. Behaviour tab

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 98 | Link | "Link to [None ▾]" Page / URL / Email / Phone / Anchor. Page select ("Choose a page…"). URL ("example.com" becomes https://). Email / Phone / Anchor validation errors. "Open in new tab" checkbox (adds/removes only its own rel tokens). "Rel" field. Shown on link, button, container, section, card, cta. | ✅ | insp/sections/LinkSection.tsx:39-61,280-330; src/shared/constants/elementCapabilities.ts:118-161 | Anchor is a typed id (no section picker). Parent/Top frame targets are gone. Bare-domain fix: L2-030. |
| 99 | CMS binding | Source Static / From CMS · Collection (+ New collection…) · Field (only types that fit) · Record (default "Newest published record") · preview line · "Open record ›" · "Unbind" ("Unbind keeps the text you see now"). A deleted source shows red "Source missing…" with Reconnect… / Unbind. Shown on heading, text, paragraph, link, button, image. | ✅ 🆕 | insp/sections/CmsBindingSection.tsx:1-24,226-324; elementCapabilities.ts:58-59 | Replaces the header popover + binding banner. |
| 100 | CMS-conditional visibility ("Visibility condition") | — not built | ⏳ | audit FG-021 (DECISION, missing functionality); not in insp/ | The Figma board exists; there is no code. |
| 101 | Visibility | "Show on" checkboxes: Desktop · Tablet · Mobile (unticking writes `--hide-<bp>`). | ✅ | insp/sections/VisibilitySection.tsx:23-82 | The switches became checkboxes. |
| 102 | Interactions | List rows "On click › Fade In". "+ Add interaction" → "Choose Trigger" with 4 groups / 14 triggers (lucide icons, no longer emoji) and a "CSS Animation › Entrance animation…" door. The editor (drill-in "‹ On click") offers Animation (44 presets), Duration, Delay, Easing, Preview, Enable/Disable, Delete. | 🟡 | insp/sections/interactions/index.tsx:116-182; insp/sections/interactions/types.ts:49-53,88-110; insp/sections/interactions/AddInteractionPanel.tsx:125-147; insp/sections/interactions/InteractionEditor.tsx:118-200 | Still trigger → animation only: no actions (scroll to, show/hide, open modal, toggle class). The trigger picker uses inline style objects. Moved from Effects. |
| 103 | Element CSS animation (inside Interactions) | A row "On page load · Fade In ›" opens the editor: Entrance / Attention / Exit tabs, Duration, Delay, Easing, Iterations, "▶️ Preview Animation", Generated CSS, "Remove animation". | ✅ | insp/sections/interactions/ElementAnimationRow.tsx:19-72; src/editor/animation/AnimationEditor.tsx:90-206 | The standalone Animation section was removed (G2-157). The editor still has an emoji button label and commented-out code (AnimationEditor.tsx:80-82,203). |
| 104 | CSS classes | Chips "hero-title ▾" (▾ → Remove class). An "Add a class…" field accepts several classes at once (paste "card hero .wide"), with suggestions from the project's global classes. | ✅ | insp/sections/CSSClassesSection.tsx:37-147 | No per-class style editing. Chips changed from "×" to a ▾ menu. |
| 105 | Attributes (closed with summary) | Summary "id: hero-title · 1 attribute". Rows: ID, Title (not for links), Tab index + per type: image Decoding; video Preload; input Read only / Autocomplete; textarea Read only / Max length / Columns; form Action URL / Method / Encoding / Disable validation / Autocomplete. | ✅ | insp/sections/attributes/AttributesSection.tsx:27-47; insp/config/attributeFields.ts:17-106 | Replaces "Element Properties". Holds the rarely-changed per-type rows. |
| 106 | Custom data-* / aria-* attributes | Two fields "data-*" / "value" + "+" ("Add attribute"). A bare key is saved as `data-…`. | 🟡 | insp/sections/attributes/DataAttributeEditor.tsx:57-103 | Add-only: existing custom attributes are not listed, edited or removed (the summary counts them). Inline style objects. |
| 107 | Form › Fields | One row per field "⠿ Name · Text · Required ›", drag to reorder, "+ Add field". Drill-in: Label, Type (Text / Email / Phone / Number / Date / Long text; Long text swaps in a textarea), Required. | 🟡 | insp/sections/FormFieldsSection.tsx:30-56,89-221 | Type has no Select / Checkbox / Radio, so those rows show their raw type. "Label" edits the `placeholder`, not a visible `<label>`. |
| 108 | Form › After submit | Then Show message / Redirect · Message · Redirect to · Send to (Admin only; reverted with "Only workspace Admins can change the notification email.") · Spam protection · note that it's saved immediately and not part of Undo. Needs a dashboard-opened site. | 🟡 | insp/sections/FormAfterSubmitSection.tsx:1-30,150-220; audit L3-028 (PARTLY), L3-030 (WONTFIX) | No page picker for Redirect (L3-028 still partial). Forms can't be named. |
| 109 | Slider › Slides | Rows: drag handle, thumbnail, "Slide 2 · Dining room", ⋯ Duplicate / Delete; "+ Add slide". | ✅ 🆕 | insp/sections/SlidesSection.tsx:53-158 | The file header still says Playback isn't built, which is out of date (see #110). |
| 110 | Slider › Playback | Autoplay, Interval (seconds), Arrows, Dots. The runtime works on canvas and on publish. | ✅ 🆕 | insp/sections/SliderPlaybackSection.tsx:1-12,76-104 | |
| 111 | Collection list › Collection | Collection select ("None"), "+ New collection…", Show items ("All"), "Open collection ›". | ✅ 🆕 | insp/sections/CollectionListSection.tsx:58-95 | |
| 112 | All CSS (dev-mode raw inline style editor) | — | ❌ | not in insp/ (components/index.ts:5 notes its removal) | No custom CSS/code surface for anyone now. |

## Gaps still not built (for the redesign brief; not counted as rows)

- No type-specific settings for navbar (menu items, logo, sticky), tabs, modal, gallery, social, table, list or product-*. They all get the generic container panel.
- No interaction actions (scroll-to, show/hide, open modal, toggle class).
- No drag-to-scrub on numeric fields. No eyedropper or recent colours. No multi-stop gradients. No custom CSS for normal users.
- No dedicated ARIA label/role rows (only through custom `aria-*` attributes, which can't be listed or removed).
- No pressed/visited/checked/custom states.
- The breakpoint can't be changed from inside the Inspector.

## Not verified

- No live run of the editor this session. Every status comes from reading code on `main @ 19f964d5e`. Audit fixes marked FIXED were checked only as "commit is an ancestor of HEAD" (158788d09, 4eb728855, dcc133d5c, 1e890dc9c, da223041b, 0850e2874, 912cf3c9e, d009168e7, c89d33686), not re-run.
- UX-05, UX-10, UX-14 and UX-25 (rows 19, 39, 42) were not re-measured live. The code paths they describe are unchanged, so they are listed as 🐞.
- Visual conformance to the Figma boards (page 4418:45431) was not checked.
- Publish/export output for :hover rules, visibility flags, slider/accordion/countdown runtimes and the radio `value` was not exercised.
- The internals of the ColorPicker visual picker, the font-loading behaviour and the AnimationEditor tabs were spot-read only.
- Per-type rows in 48a–48k are derived from the capability table plus registry predicates. Each type was not rendered.

**Status counts (122 rows, counting 48a–48k as 11):** ✅ 89 (38 of them 🆕) · 🟡 10 · 🐞 4 · ⏳ 2 · ❌ 17 · 🚩 0 · 🔒 0 · 🧪 0. No `FEATURE_*` flag or plan gate touches the Inspector. The only gate is the role check on the form "Send to" field (Admin only).


---

# Brand / Design System workspace + Editor UI Component Kit

Since 2026-09-16 Brand has been rebuilt completely. The 280/700 px left drawer, with its Beginner/Pro row, Draft chip, Save/Discard footer and "Review N staged changes" modal, is gone. In its place is a **full-canvas workspace** (Figma 7315:80955): a 256 px nav, a 620 px pane and a 468 px live-preview column. Every edit **autosaves** and shares one ⌘Z stack with the canvas. Brand Parts 1a/1b/1c added server-validated v6 tokens (behind the `BRAND_TOKENS_V2` rollout flag), Dark mode Off/Auto, restore points, safe delete, Connect to tokens, a scale generator, brand-from-logo/URL (behind `dsAi`) and a theme-toggle block. Part B lists the chrome component kit (`src/editor/chrome-ui/`) and the `--bk-*` token counts.

Paths: `DS/` = `packages/editor/src/editor/design-system/`, `BW` = `DS/ui/BrandWorkspace.tsx`, `SEC/` = `DS/ui/sections/`.

# PART A — Brand workspace

## A1. Entry, frame and save model

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 1 | Rail "Brand" (palette icon, key **B**) | Opens Brand **full-page**. It covers the whole editor (fixed portal) and is no longer a drawer | ✅ 🆕 | `editor/rail/tabsConfig.ts:143-157` (`mode: "fullpage"`); `editor/sidebar/FullPageRouter.tsx:186-201` | One of four full-page hosts (Templates, Assets, Settings, Brand). Pick one shell pattern for all four |
| 2 | Other ways in | ⌘K "Open Brand". Inspector colour/spacing token chip opens Brand on that token. Issues row opens the token. Theme-toggle inspector has a "Dark mode" button. Template-applied toast has a "Connect to tokens" action | ✅ 🆕 | `shell/modals/CommandPalette.tsx:127`; `inspector/shared/controls/ColorInput.tsx:169`; `SpacingControls.tsx:95`; `shell/AquibraStudio.tsx:612,639`; `inspector/components/ThemeToggleInspector.tsx:46`; `shell/hooks/useConnectOfferToast.ts:25`; `DS/ui/brandOpenRequest.ts:17,33` | Deep links (page + token) are an existing contract. Keep them |
| 3 | Nav column | "‹ Back to canvas", an H1 "Brand", the site name, then 11 rows: Colours · Colour mode · Fonts & type styles · Styles · Component styles · Classes · Presets · Brand checks · Starters · Spacing · Import / export. Colours shows a count; Brand checks shows a count only when findings exist | ✅ 🆕 | `BW:126-138`, `BW:944-982`, `BW:912-916` | 11 flat rows mix token kinds, catalogue views and tools. That is a candidate for grouping |
| 4 | Leave Brand | "‹ Back to canvas" or Escape closes the workspace. Escape is ignored while a menu, dialog or input owns focus | ✅ 🆕 | `BW:385-409` | — |
| 5 | Page header | Page title + caption (e.g. "18 tokens · light / dark"), then "Review changes", "Restore points" and the page's own action | ✅ 🆕 | `BW:955-1018`, `BW:530-555` | Each page has one primary action at top right |
| 6 | Autosave + one undo stack | No Save/Draft. An edit is one `setTokens` write: the canvas repaints, autosave persists it, ⌘Z undoes it | ✅ 🆕 | `BW:27-34`, `BW:476-487` | Removes the whole draft/apply concept from the design |
| 7 | Review changes (popover) | Non-blocking list of this session's token edits, each with its own **Revert**. Rows that are stale (token changed again since) cannot be reverted. Empty state: "No changes to review yet." | ✅ 🆕 | `DS/ui/SessionEditsPopover.tsx:1-15`; `DS/state/useSessionEdits.ts`; `BW:993-1000` | Replaces the old blocking Review modal |
| 8 | Read-only banner | Amber strip, and every control is disabled. Copy depends on the reason: "Brand editing is paused while we upgrade brand tokens." (kill switch), "…rolled back — editing is paused." (held), or "We couldn't upgrade this site's brand…" (failed) | 🚩 | `BW:1024-1035`, `BW:209-216`; `shared/constants/brandReadOnly.ts:1-16`; `server/services/brand-tokens.ts:17-21` | Driven by the `BRAND_TOKENS_V2` / `BRAND_TOKENS_V2_WORKSPACES` server rollout |
| 9 | First-run "No brand set." card | Shown on Colours until the site's first token save. Buttons: **Browse starters** · **Import** | ✅ 🆕 | `BW:1041-1061` | L4-029 owner default is to reword it to "Using default tokens." (decision still open) |
| 10 | Live preview column | The site's active page rendered at a zoom, painted with the current tokens, with a page picker. Used-by and Connect highlights draw here. Falls back to swatches + type when there is no document | ✅ 🆕 | `DS/ui/BrandLivePreview.tsx:1-25`; `BW:1088-1112` | The preview takes 468 of 1440 px on every page except Import/export |
| 11 | Light / Dark preview switch | Segmented control in the preview card. **Preview only**: never saved, not in ⌘Z. Dark is disabled when the site's Dark mode is Off, and the switch waits while another preview flow runs | ✅ 🆕 | `DS/ui/ColorModeToggle.tsx:1-16`; `BW:278-301`, `BW:921` | L4-021 fixed: this used to flip a global persisted colour mode |
| 12 | Beginner / Pro mode toggle | **Removed from Brand.** The workspace is forced to Pro. `DSModeToggle` is still exported but has no mount. The inspector still reads the persisted mode (default Beginner) and nothing lets the user change it | ❌ | `BW:1218-1226`; `DS/ui/DSModeToggle.tsx` (0 consumers); `DS/state/DSModeContext.tsx:20,34` | Decide: delete Beginner entirely, or give it a home again. Today inspector users are stuck in Beginner |
| 13 | Drawer-era frame (Draft chip, mode row, back row, status-pill band, Save/Discard footer, Review N staged changes modal, "N changes discarded · Undo", cross-window/undo toasts) | Gone, replaced by A1 rows 3-7 | ❌ | Deleted: `DraftChip`, `DesignTabFooter`, `ReviewModal`, `BrandDiscardDialog`, `SectionStatusBadge`, `DesignSystemTab` (git log since 09-16) | — |
| 14 | Focus isolation of the full page | The editor underneath stays keyboard and screen-reader reachable. The Brand host also lacks the `data-bk-surface="fullpage"` attribute that the other three hosts carry | 🐞 IA-07 (product-audit 10-10) | `editor/sidebar/FullPageRouter.tsx:188-190` vs `:120,144,166`; no `inert` anywhere in `shell/` or `sidebar/` | Shared full-page contract: inert background, focus in, focus back |

## A2. Colours and the token card

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 15 | Colours table | Card with 40 px rows: swatch · TOKEN (id) · LIGHT · DARK · USED ("Used by N", or "Can't count right now" while components load). A row click selects the token. The first row is auto-selected | ✅ 🆕 | `DS/ui/colors/ColorTokenList.tsx:1-30`; `DS/ui/tokens/TokenTable.tsx`; `BW:439-449` | UX-18: first visit shows ~58 code-named tokens, mostly "Used by 0". The palette is not presented as a palette |
| 16 | Table keyboard | The table is one Tab stop; arrow keys move between rows | ✅ 🆕 | `TokenTable.tsx` (L4-032, `be89f97a3`) | — |
| 17 | "Used by N" highlight | Clicking the count outlines the elements in the live preview. A notice "Primary · Used by N elements across M pages" appears, plus a card with Next page / Clear highlight | ✅ 🆕 | `SEC/UsageHighlight.tsx:1-20`; `BW:1067-1077`, `BW:1135-1143` | — |
| 18 | "+ Add token" | 560 px dialog: Name + value, checked per kind (colour, spacing, the 11 generic kinds). Toast: `Token "X" added` | 🐞 | `DS/ui/modals/TokenAddDialog.tsx:88,97`; `BW:356-366` | The button reads **"Save to draft"**, but nothing is drafted (autosave). Copy contradicts the save model |
| 19 | Token card (right column) | Swatch/preview · name · id · ⋯ menu. Rows: Light value [Change], Dark value [Change/Set], Used by [View ›] with an element list that selects on the canvas, Aliased by, Brand checks status ("✓ Brand checks pass · 8.6:1 contrast", or a finding with Auto-fix / Ignore) | ✅ 🆕 | `SEC/TokenDetailView.tsx:1-30, 281, 561, 663-672`; `BW:1153-1185` | Replaces the drawer drill-in detail screen |
| 20 | Token card ⓘ "About drafts" hint | Tooltip: "Edits stay in the draft until you Save. Publish to put them live." | 🐞 🆕 | `SEC/TokenDetailView.tsx:693-699` | Stale copy: there is no draft and no Save. Delete it or rewrite it |
| 21 | Colour picker | One shared picker: shade canvas, hue, alpha, "Hex [old] New [hex]" with contrast ratio, WORKSPACE PALETTE, Cancel / Apply. Typing hex one key at a time is kept | ✅ 🆕 | `DS/ui/colors/ColorPicker.tsx:1-10` (`363f95bf3`) | The inspector Fill popover reuses it |
| 22 | ⋯ Rename token… | Dialog with a breadcrumb, Current ID, New ID with format help, and a note that bound elements follow. Focus starts in New ID. Disabled for type and spacing tokens | ✅ 🆕 | `SEC/TokenRenameDialog.tsx:1-12`; `TokenDetailView.tsx:384-391`; `BW:521-527` | L4-018 (bindings not moving) fixed. Replaces `window.prompt` |
| 23 | ⋯ Delete token… (safe delete) | Unused: "Delete X?". In use: "Replace X before deleting?" with a same-kind pick → Replace and delete (one ⌘Z, toast "X replaced with Y · Undo ⌘Z"). Usage unknown: "Can't delete X", Try again. Type and spacing cannot be deleted | ✅ 🆕 | `SEC/TokenDeleteDialog.tsx:1-20`; `BW:488-504` | L4-019 and L4-020 fixed |
| 24 | ⋯ Reset to default (seed tokens) | A seed token's Delete becomes Reset (toast "X reset to default · Undo ⌘Z") | ✅ 🆕 | `TokenDetailView.tsx:392-395`; `BW:505-514` | — |
| 25 | ⋯ Duplicate token | Not offered (no registry path) | ⏳ | `TokenDetailView.tsx:28` | Drawn on the board but not built |
| 26 | Colours action row | Under the table: **Generate colour scale** · **Connect to tokens** · **From logo or URL** (the last only with dsAi) | ✅ 🆕 | `BW:741-763` | — |
| 27 | Colour scale generator | Pick a colour → 11 swatches 50…950 → Preview (canvas repaints) → Confirm. A restore point is taken first and the result writes as one ⌘Z. Toast: "Colour scale applied · Undo ⌘Z". Reachable from the Colours row or a semantic token's ⋯ | ✅ 🆕 | `SEC/ScaleGenerator.tsx:1-25`; `BW:766-775` | — |
| 28 | Drawer-era colour list (search, All/Issues pills, WCAG banner + Fix all, group headings Semantic/Brand/Surface/States/Primitives, Pro-only primitives, dark-missing chip) | Gone. Contrast fixing moved to Brand checks | ❌ | `ColorTokenList.tsx:4-10` | Decide whether groups and search come back for ~58 tokens |
| 29 | "Add color token" modal and "Replace token" modal | Replaced by rows 18 and 23 | ❌ | Deleted `modals/AddTokenModal.tsx`, `SEC/TokenReplaceModal.tsx` | — |

## A3. Colour mode / Dark mode

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 30 | Dark mode card (Off / Auto) | Page title "Dark mode". Off: "Dark mode is off for this site." Off → Auto first fills missing semantic dark values ("Generated missing dark values" list → Preview in dark → Confirm). That writes a restore point, then the flag and values as one ⌘Z. Auto → Off takes no restore point | ✅ 🆕 | `SEC/DarkModeCard.tsx:1-28`; `BW:777-784` | L4-023 fixed: before this, no control could ship dark values. New sites start Off |
| 31 | Per-token dark values list | Card with one row per colour: "No dark value" + **Set**, or "#LIGHT → #DARK ✓". Missing ones come first. Set opens "Set the dark-mode value": 3 suggested shades with contrast, plus Custom… (the picker) | ✅ 🆕 | `SEC/ColourModeSection.tsx:1-30,147` | — |
| 32 | Theme-toggle block | A Light/Dark toggle element in Add, on the canvas (clicking it on an Auto site previews that theme) and in export. It is hidden on publish when Dark mode is Off, and the inspector says "Dark mode · Auto/Off" | ✅ 🆕 | `blocks/Basic/ThemeToggle.ts`; `DS/ui/ThemeTogglePreview.tsx:1-12`; `inspector/components/ThemeToggleInspector.tsx:30-46` | — |

## A4. Fonts, Styles, Spacing and other token kinds

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 33 | Fonts & type styles | One card: font roles Heading · Body · Mono ("<family> · <role> · N weights", weights measured from the page), then type styles (font-size tokens). A row selects the token; the card's Change opens a font popover or a size field | ✅ 🆕 | `SEC/TypographySection.tsx:1-30` | Desktop/Mobile 85% preview and B/I toggles are gone (row 37) |
| 34 | Font popover | "Current selection", the site fonts (Built in / Uploaded / Custom) with ✓, "Manage site fonts ›", "All fonts ›" (Google + typed stack), Cancel | ✅ 🆕 | `SEC/BrandFontPopover.tsx:1-18`; `SEC/FontFamilyPicker.tsx` | — |
| 35 | "+ Add a font" | Page action that opens the Site fonts dialog (no in-page upload) | ✅ 🆕 | `BW:711-718` | Uploads still live in Site fonts |
| 36 | Styles page | Reusable styles in one card: type styles ("Heading 1 / Inter Bold 36/40") and preset variants. Caption "Reusable · N". A preset row goes to Presets | ✅ 🆕 | `SEC/ReusableStylesSection.tsx:1-15`; `BW:792-801` | Read-only and overlaps Fonts + Presets. Merge candidate |
| 37 | Drawer type-scale editor (preview toggle, B/I toggles, ⚠ extreme size, per-row undo/redo) | Gone | ❌ | `SEC/TypographySection.tsx:8-10`; deleted `type/TypeTokenList.tsx` | — |
| 38 | Spacing page | Table: bar · TOKEN · VALUE · PRESET · USED. "+ Add token". ⋯ menu: Apply preset Compact 2px / Normal 4px / Spacious 6px, and Reset to defaults | ✅ 🆕 | `DS/ui/tokens/KindTokenList.tsx:1-20`; `BW:640-704` | Preset chips and the inline edit drawer are gone (now a menu) |
| 39 | Other 11 kinds (Radius, Shadow, Motion, Border, Opacity, Z-index, Breakpoint, Grid, Sizing, Icon, Imagery) | Reached **only** through a "Token kind" select in the Spacing page header. Each kind shows the same table + card, and has Add / Rename / Delete | 🟡 | `BW:145-157`, `BW:640-657`, `BW:870-873` | FG-018 (owner decision open): Figma draws 11 boards. Hiding 11 kinds behind Spacing's dropdown is hard to find |
| 40 | Drawer generic token rows (inline input, Restore, `[lint]` tag) | Gone, replaced by select + card | ❌ | Deleted `tokens/GenericTokenList.tsx` | — |

## A5. Catalogue pages: Component styles, Classes, Presets

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 41 | Component styles | Lists the site's **sections** (Add › Blocks set: Hero, Features, Menu grid, Testimonials, CTA, Contact, Footer, Navbar), "Default appearance", ›. A row leaves Brand for Add › Blocks. There is no per-section style editor | 🟡 | `SEC/ComponentsSection.tsx:1-15`; `BW:371-376` | The page title promises styling it does not offer. The 27-component catalogue from 09-16 is gone |
| 42 | "✦ Generate with AI" (Styles / Component styles) | With dsAi on: a modal that returns a schema, with no Accept (nowhere to put it). With dsAi off: disabled, tooltip "Coming soon: AI component styles aren't available yet" | 🚩 | `BW:588-614`, `BW:1199-1210`; `DS/ui/AIPromptModal.tsx:40-44` | L5-019 copy fixed. Even with the flag on, the result cannot be kept (FG-016 decision) |
| 43 | Classes | Card: `.class` · "used N×", measured from the live element tree. **"+ Add class"** adds the name to the canvas selection (Add is disabled with nothing selected). No class detail | ✅ 🆕 | `SEC/ClassesSection.tsx:1-20`; `SEC/ClassAddDialog.tsx:1-12`; `BW:616-622` | Add class is new |
| 44 | Presets | 11 categories (Button, Card, Form input, Link, Badge, Alert, Tooltip, Modal, Nav, Table, Layout) → drill-in detail: variant chips, variant tabs, binding rows (property → token) | 🟡 | `SEC/StylesRouter.tsx:1-10,142`; `SEC/PresetDetailPane.tsx` | Read-only. Clicking a binding row does nothing (`PresetBindingRow.tsx:4-5`). No add/rename/delete preset |

## A6. Brand checks

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 45 | Brand checks list | One row per finding, errors first: message over "<rule> · <token>", ending in **Fix** (when a hint exists, e.g. contrast) or **Open** (goes to the token's page with its card open). Empty: "Nothing to fix" | ✅ 🆕 | `SEC/LintSection.tsx:1-25,112`; `BW:810-827` | Fix and Open now exist. In the drawer era nothing could be fixed |
| 46 | Rules | Contrast on the page (mode-aware) · Banned hue (purple/violet/indigo) · Pure black · Empty value · No dark variant (only when Dark mode Auto) · Unresolved binding · Alias chain too deep · Semantic needs alias · **Theme toggle hidden — Dark mode is off** 🆕 · **Dark mode fixed colour** 🆕 | ✅ | `SEC/LintSection.tsx:62-73`; `engine/designSystem/linter/DSLinter.ts:29`; `DS/state/useDSLint.ts:94` | DQ-010: one contrast-fix algorithm (fixed) |
| 47 | "Run checks" | Page action that re-runs the checks now (they also run on every edit) | ✅ 🆕 | `BW:624-638` | — |
| 48 | Ignore (suppress) | Token card "Ignore". The Brand checks caption counts ignored checks | ✅ | `TokenDetailView.tsx:281,672`; `BW:259-260` | — |
| 49 | Connect to tokens | Raw values that exactly equal a token → "#1A56DB · 14 elements → Primary". Ties need a choice. Preview highlights the elements → Apply as one ⌘Z ("Tokens connected · Undo ⌘Z"). Empty: "No unconnected values match your tokens." | ✅ 🆕 | `SEC/ConnectTokensCheck.tsx:1-25`; `BW:828-838`; `LintSection.tsx:40-56` | — |
| 50 | Templates bind literal colours | After applying a template, every Brand token reads "unused", so Brand edits do not recolour template content | 🐞 L4-024 (DECISION, open) | `editor/sidebar/tabs/templates/utils/resolveTemplateTokens.ts:2` | UX-19: "applies to the site straight away" over-promises. This is the core Brand value gap |

## A7. Starters, brand from source, restore points

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 51 | Starters | Card of 6 rows (Buildrik Default, Stripe Blue, Notion Warm, Apple Minimal, Linear Dark, Vercel Mono): "<fonts> · <colour>" ›. A click **applies** the starter immediately (one ⌘Z; semantic aliases are kept). The chosen row stays tinted | 🐞 L4-028 (DECISION, open) | `SEC/StartersSection.tsx:1-20`; `DS/state/useApplyStarter.ts:1-12`; `DS/starters/*.ts:5` | Uses real-brand names and two indigo/violet primaries. Applying on click with no preview is inconsistent with the generator/logo flows, which preview first |
| 52 | Brand from logo or website | Starters/Colours entry. A logo is decoded in the browser; a URL is read by the SSRF-guarded server. Proposes Primary/Accent scales + heading/body fonts → canvas preview → Confirm (restore point, then one ⌘Z). States: loading / no colours / timeout / address refused | 🚩 dsAi | `SEC/BrandFromSource.tsx:1-15`; `BW:756-762,848-853`; `server/services/brand-extract.service.ts`; server gate `NEXT_PUBLIC_FEATURE_DS_AI` | Planned (flagged), not dead |
| 53 | Restore points | Header action on every page → "Brand restore points" list (reason + time, e.g. "Today, 14:32") → Restore (one ⌘Z, toast "Brand restored · Undo ⌘Z"). Empty: "No restore points yet". Stored on the server; created by the generator, Dark Auto, logo import and theme push | ✅ 🆕 | `SEC/RestorePointsSection.tsx:1-20,76-90`; `DS/state/useBrandRestorePoints.ts:17-30`; `BW:1001-1016` | Connect does not create a restore point (OQ-4) |
| 54 | Theme push results / Recapture (dashboard) | The skipped-sites list exists; the per-site Recapture is not built | ⏳ FG-015h | audit `status-not-done.md` (FG-015h) | Out of editor scope (dashboard theme manager) |
| 55 | Starter grid / thumbnails / "Starter applied" pill / first-run starter gallery | Gone | ❌ | Deleted `DS/ui/StarterGrid.tsx` | — |

## A8. Import / export and migration

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 56 | Import / export panel | A centred 760 px panel with ✕ (no preview column). **Dark strategy** menu (media-query / data-attr / off). Export rows CSS / JSON / Tailwind, each with Copy + Download. Stats line. Tailwind dark-drop warning. Preview code block | ✅ | `SEC/ExportSection.tsx:1-15,247-264,333`; `BW:860-867` | The only page that drops the 3-column frame |
| 57 | Figma Variables export row | Removed (it was "Coming soon") | ❌ | `SEC/ExportSection.tsx:10-12` | — |
| 58 | Import | Drop zone "Drop tokens.json — JSON only" (picker accepts .json only), or paste JSON → Parse. A Detected/Valid/Errors/Conflicts block, then **Replace** or **Merge · keep mine** → "Apply N valid only" (one ⌘Z, live at once) | 🟡 | `SEC/ImportCard.tsx:1-25,30-42,262-270` | Tailwind/.ts import was dropped (it only ever errored). Detection still names "Tailwind config (AST)" (`:97`) |
| 59 | Legacy Export dropdown | Deleted | ❌ | Deleted `DS/ui/ExportDropdown.tsx` | — |
| 60 | Project migration modal | "Updating your project" steps → on failure, **Restore snapshot** and **Retry** are now wired (they re-run and import the result) | ✅ | `DS/ui/MigrationProgressMount.tsx:1-30`; `DS/ui/MigrationProgressModal.tsx:164-168` | It was "close only" on 09-16. Email export (F.2) is still not built |
| 61 | Server token boundary (v6 validation, stale-tab refusal, held sites) | A save carrying stale or invalid tokens is refused; the v6 migration is gated per workspace | 🚩 BRAND_TOKENS_V2 | `server/services/brand-tokens.ts:17-21,60-115`; `server/services/theme.service.ts:254,464` | Invisible to users except through row 8 |
| 62 | Lint aggregate banner (unmounted) | Deleted | ❌ | Deleted `DS/ui/DSLintBanner.tsx`, `DSLintMount.tsx` | — |

## A9. Brand outside the workspace (one line each)

| # | Feature | What the user sees / does | Status | Evidence | Redesign note |
|---|---|---|---|---|---|
| 63 | Canvas token application | Saved tokens and any active Brand preview paint the canvas as CSS variables | ✅ | `DS/ui/ProjectTokensApplier.tsx`; `StudioPanels.tsx` | — |
| 64 | Background brand checks feed Issues | Lint runs headless and feeds the topbar/Issues panel and the publish confirm | ✅ | `DS/ui/DSLintRunner.tsx`; `shell/StudioPanels.tsx` | — |
| 65 | Onboarding "Set your brand" | Ticked by any Brand write (`BRAND_APPLIED`) | ✅ | `engine/designSystem/facade.ts:79` | — |

## Not verified

- Nothing was run in a live app or browser. Every status comes from reading code on `main` @ 19f964d5e and from the trusted audits (10-08 full audit, ui-ux-audit 10-10, product-audit 10-10). Visual conformance to boards was not checked.
- Whether the production cPanel env has `BRAND_TOKENS_V2=on` (from the memory note: 1a is on prod, 1b/1c not deployed as of 10-09).
- The engine half of the AI modal's request path with dsAi on. The brand-extract server path was not exercised.
- Restore-point server storage limits and retention.
- Inspector Beginner-mode effects (row 12) were inferred from `DSModeContext` defaults only.

**Part A status counts (65 rows):** ✅ 40 (33 of them 🆕) · 🟡 4 · 🐞 5 · 🚩 4 · ⏳ 2 · ❌ 10 · 🔒 0 · 🧪 0

---

# PART B — Chrome UI kit (`src/editor/chrome-ui/index.ts`, 195 lines)

How to read the counts: **files** = non-test files outside `chrome-ui/` that import the name from `@/editor/chrome-ui`. **uses** = JSX/identifier occurrences in those files. "int" = it is also used inside chrome-ui by another component. The counts come from a script, so treat them as approximate.

## B1. Components

| Name | What it is | Files / uses | Notes |
|---|---|---|---|
| Button | Wrapper (forwardRef, `variant` roles, BK theme) | 258 / 866 | The workhorse. One of 3 closed wrappers |
| TextInput | Wrapper over flowbite TextInput | 72 / 110 | Wrapper |
| Select | Wrapper over native select | 23 / 30 | Wrapper |
| TextField | Older chrome-owned text field | 15 / 15 | **Overlaps TextInput.** Merge candidate |
| Textarea, Label, HelperText | flowbite re-exports | 19/23 · 16/36 · 3/11 | Label is styled via `BK_LABEL_CLASS` (9 files) |
| Checkbox, Radio, ToggleSwitch | flowbite re-exports | 9/11 · 4/3 · 15/21 | — |
| Slider · RangeSlider | chrome Slider · flowbite RangeSlider | 4/5 · **0** | RangeSlider has no consumers; Slider covers it |
| Badge · Chip | flowbite Badge · chrome Chip | 3/2 · 3/5 | Both are small pills. Overlap |
| Avatar, AvatarGroup | flowbite | **0 / 0** | Avatar is used only inside Presence; AvatarGroup is unused |
| Progress | flowbite | 5 / 5 | — |
| Card | flowbite | **0** | Unused (media has its own local `Card`) |
| Tooltip · HintTooltip · HelpTooltip | Board-sized dark tooltip · hint wrapper · "?" help | 21/29 · 2/3 · **0** (int: Topbar, SaveStatus) | **Three tooltip components.** Consolidate. The barrel comment still says a "2-wrapper set" (stale) |
| Icon, IconButton, Kbd, Spinner | Icon primitives | 0 (int 8) · 35/53 · 4/4 · 8/10 | Icon is reached only through other components |
| CopyButton | Copy-to-clipboard button | 2 / 2 | — |
| Modal (+ `MODAL_*` classes) | One-shot modal | 23 / 35 | **Two modal APIs** (Modal vs ModalParts) |
| ModalRoot/Content/Title/Description/Body/Footer/Close | Composable modal parts | ~60 / 60-66 each | This is the dominant modal API |
| ConfirmDialog | Confirm/danger dialog | 16 / 23 | — |
| UpgradeModal, openUpgrade | Plan upsell | 1 / 1 | 🔒 plan gating |
| Popover, Menu, MenuItem, MenuGroup, MenuLabel, MenuSeparator | Overlay + menu | 38/50 · 37/48 · 37/144 · 2/7 · 6/11 · 10/11 | — |
| OverlayMount, Portal, getOverlayRoot | Overlay plumbing (Gate 22) | 4/4 · 13/17 · 0 (int 4) | — |
| ToastProvider, useToast, dismissToast(Key) | Toasts | 1 · 46/47 · 5 · 2 | — |
| useFocusTrap, isModalOpen | Focus utilities | 5/8 · 6/8 | — |
| Topbar, SiteMenuIcon | Editor top bar | 1 / 1 | Topbar renders SaveStatus internally |
| SaveStatus · StatusDot | Save pill · dot | 0 (int Topbar) · **0** (int Row variants) | Internal only |
| Presence, toneFor | Collaboration avatars | 1 / 1 · 0 | 🚩 collab flag |
| BreakpointSwitcher | Desktop/Tablet/Mobile segments | 1 / 1 | — |
| Tabs | Tab strip | 6 / 6 | — |
| Breadcrumb | Breadcrumb | 2 / 2 | — |
| Toolbar, ToolbarSpacer | Toolbar row | 3/3 · 2/2 | — |
| PanelFrame | Drawer panel frame | 13 / 34 | — |
| PanelHeader, PanelHeaderActions, PanelHeaderSize, PanelBackRow | Panel header parts | 4/4 · 1 · 1 · 3/3 | Brand rolls its own header (BW) instead of using these |
| PanelSearch (+ `PANEL_SEARCH_ATTR`, isPanelSearchInput) | Panel search field | 5 / 5 | — |
| SectionHeader | Section caption | 2 / 4 | — |
| Row (+ `ROW_*` classes) | Base list row | 3 / 6 (int 16) | The base for the row family |
| ListRow · TreeRow · VersionRow · RecordRow · FormatRow · IntegrationRow · CommentRow · NavItem | Row variants | 1/4 · **0** · 2/2 · **0** · **0** · **0** · 1/1 · **0** | **8 row variants, 5 with no external consumer.** Brand uses its own `BrandCard` rows instead. Prime consolidation target |
| EmptyState (+ Title/Desc/Actions) | Empty states | 12/20 · 4 · 3 · 3 | — |
| SkeletonBlock, SkeletonListItem, StudioSkeleton | Loading skeletons | 9/16 · 3/5 · 1/1 | — |
| MediaCard · SiteCard | Cards | **0** (int UpgradeModal) · **0** | SiteCard is unused |
| EditorShell · RightPanel · Rail/RailItem/RailSpacer · Footer/FooterSpacer · Drawer | Shell layout primitives | **all 0 external** | The live shell (`editor/shell`, `editor/rail`) does not use them. Likely dead or parallel shell. Verify before the redesign relies on them |
| FieldRow · FormField | Label+control row · form field | **0** · 6 / 12 | FieldRow is unused |
| `TYPE_*_CLASS` (5) | Type-ramp class strings | 1-2 files for 2 of them, 3 unused | — |
| `BK_*` theme constants, `CustomFlowbiteTheme` | Theme objects for wrappers | 0-9 | Internal to the wrappers |
| formatIssueSummary, plural | Copy helpers | 1 · 2 | Not components |

**Duplicates and overlaps to resolve in the redesign:**
- Three tooltips (Tooltip, HintTooltip, HelpTooltip).
- Two modal APIs (Modal, ModalParts).
- TextField overlaps TextInput.
- Badge overlaps Chip.
- Slider overlaps RangeSlider.
- Eight row variants.
- A shell layer (EditorShell/Rail/Footer/Drawer/RightPanel) that the live shell does not use.
- Brand workspace builds its own nav rows, header, `BrandCard` and `TokenTable` instead of using Row/PanelHeader.

**Unused exports (0 external, 0 real internal):** AvatarGroup, Card, RangeSlider, SiteCard, FieldRow, RecordRow, IntegrationRow, EditorShell, RightPanel, 3 `TYPE_*` classes.

## B2. `--bk-*` tokens (`src/themes/tokens.generated.css`, generated from Figma, light only, 189 unique)

| Group | Count | Contents |
|---|---|---|
| Colour | 90 | Ramps 45 (gray 10, blue 10, green 7, yellow 6, red 6, purple 6 for identity/PRO only). Roles 29 (accent 7, bg 5, ink 4, border 4, success/warning/error 3 each). Alpha 12. Box-model overlay 4 |
| Space | 13 | 2 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 36 · 40 · 48 · 64 |
| Radius | 8 | xs · sm · md · lg · xl · 2xl · card · full |
| Shadow / focus | 6 | shadow raised · overlay · drag · focus, plus focus ring 2 |
| Type | 24 | text sizes 7 (11/12/13/14/16/20/24) · leading 9 · tracking 3 · weight 3 (regular/medium/semibold, ≤600) · font 2 (ui, mono) |
| Size (layout) | 30 | control xs–xl, dialog sm–xl, icon xs–lg, row (dense/table/nav/2line/tall), rail, topbar, header, footer, drawer, sidebar, inspector, nav, panel-right, panel-footer, menu-item |
| Z-index | 10 | layering scale |
| Motion | 8 | motion 3 · ease 3 · transition 2 |

There is no dark-mode block for chrome (0 `prefers-color-scheme` / `data-theme` rules). The Brand workspace hard-codes widths (256 / 620 / 468 / 700 / 760 px), which are not in the `--bk-size-*` set.

**Part B:** 128 exported runtime names (≈70 components/hooks). About 18 have no consumer outside chrome-ui.


---

# 09 — Engine rules, gap register, open bugs (refresh of 2026-09-16 slice L5231–end)

Repo `main @ 19f964d5e` (2026-10-16). Paths are relative to `packages/editor/src/` unless they start with `docs/` or `lib/` (repo root) or `packages/`. Read-only code pass. Nothing was walked live in this session.

Status: ✅ Complete · 🟡 Partial · 🐞 Bug · 🚩 Flagged (FEATURE_* — PLANNED) · 🔒 Plan-gated · ⏳ Stub/coming soon · 🧪 Dev-only · ❌ Removed since 09-16 · 🆕 new since 09-16.

---

## PART A — Rules of the world the UI must respect

### A1. Element types and nesting

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A1.1 | Element type registry | 55 types. `ELEMENT_RULES` must cover the whole `ElementType` union, and TypeScript enforces that: container, columns, grid, flex, stack, card, pricing, social, section, hero, features, cta, header, footer, navbar, nav, text, label, heading, paragraph, link, button, image, video, audio, svg, lottie, gallery, icon, form, input, textarea, select, checkbox, radio, switch, upload, list, list-item, table, slider, testimonials, progress, countdown, accordion, tabs, product-card, product-grid, collection-list, product-detail, video-embed, map-embed, custom, spacer, divider | ✅ 🆕 | `shared/utils/nesting/rules.ts:15-597` | Types added since 09-16 or not listed then: stack, label, list-item, tabs, product-grid, **collection-list** (repeats children per CMS record, G3-079), product-detail, custom. |
| A1.2 | Element types are refined on load and paste | A stored `container` is upgraded to a real type only when its markup proves it. Upgrades never go backwards, and the rendered tag does not change | ✅ 🆕 | `engine/AGENTS.md:20`, `migration/refineElementTypes.ts` | Layers or the Inspector may show a different type than the one stored. |
| A1.3 | Types that cannot have children | image, audio, svg, lottie, icon, input, textarea, select, checkbox, radio, switch, upload, progress, countdown, video-embed, map-embed, spacer, divider | ✅ | `rules.ts` (`allowChildren: false`) | **video now accepts children** (`rules.ts:364-372`). |
| A1.4 | Restricted parents | gallery accepts only image, video and container. product-grid accepts only product-card and container | ✅ | `rules.ts:393`, `rules.ts:549` | |
| A1.5 | Strict HTML5 forbidden pairs | heading and paragraph refuse heading, paragraph, section, header, footer, nav, form, table, list, container, flex, grid, collection-list and columns. link refuses link, button, input, select and textarea. button refuses the same plus form. form refuses form. header and footer refuse header and footer | 🟡 | `rules.ts:600-651` | Changed: heading now also refuses container, flex and grid, and both now refuse collection-list and columns. The 09-16 row said link refuses sections, header, footer, nav, form, table and list, but the strict table no longer lists those. |
| A1.6 | Drop depth limit | `MAX_NESTING_DEPTH = 50`. The message is "Maximum nesting depth reached" (overlay shows "Max depth reached") | ✅ | `shared/constants/config.ts:135`, `shared/utils/dragDrop/dropValidation.ts:95-101`, `editor/canvas/overlays/DropFeedbackOverlay.tsx:26` | |
| A1.7 | Tree-audit messages: 30-level max, warning above 15, warning above 500 children | No string or constant left in src | ❌ | grep "nesting depth (", "Deep nesting", "max recommended" → no hits | Do not design Issues rows for these. |
| A1.8 | Lock gate on element writes | `writeElement` / `writableElements` / `canWrite` / `pasteStyles` form a single gate. Dropping a locked element emits `LOCKED_ELEMENTS_SKIPPED` (the "locked" toast) | ✅ 🆕 | `engine/AGENTS.md:19`, `engine/commands/commandOperations.ts` | Right-click on a locked element still selects it on main. Fixed on the unmerged branch (`cbdb7d6c8`). |
| A1.9 | Multi-delete confirmation | Deleting one element is immediate (Undo follows). Deleting more than one asks first (`UI_REQUEST_DELETE_SELECTION`). Locked elements and component instances are skipped | ✅ 🆕 | `engine/commands/defaultCommands.ts:96-122` | Decision #17. Needs a confirm design. |
| A1.10 | Page root | Cannot be deleted, is excluded from Select all and Tab cycling, and arrow-key moves are refused on it | ✅ | `editor/canvas/hooks/useCanvasKeyboard.ts:185-250` (`!isRoot`) | |

### A2. Undo, redo and history

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A2.1 | Undo depth | 100 steps | ✅ | `config.ts:107`, `engine/HistoryManager.ts:83` | |
| A2.2 | Coalesce window | 500 ms. Pressing ⌘Z inside the window commits the pending edit, then undoes it | ✅ | `HistoryManager.ts:85`, `:517` | `HISTORY_DEBOUNCE: 300` in config is a separate, unused-looking constant. |
| A2.3 | Checkpoint | Every 10 patches | ✅ | `HistoryManager.ts:84`, `:209` | |
| A2.4 | Undo, redo and version restore are autosaved | Listens to history:undo, history:redo and version:restored | ✅ | `editor/shell/hooks/useComposerInit.ts:896-899` | |
| A2.5 | Unrecorded change | The `HISTORY_UNRECORDED` event, then the toast "Can't undo …" | ✅ | `shared/constants/events.ts:128`, `editor/shell/hooks/useHistoryFeedback.ts` | |
| A2.6 | Spurious undo step on a fresh load (Date compare) | Fixed: dates now compare by time | ✅ 🆕 | `docs/audits/2026-10-08-editor-full-audit/status-not-done.md` L1-009 `37664078d` | |
| A2.7 | Brand panel's own ⇧⌘Z and ⌘Z obeying read-only/full-page | Not on main | 🐞 | Branch commits `80e0ad723`, `80a20de1a` (unmerged) | Fixed on the unmerged branch. |
| A2.8 | Version history cap | 50 versions. Named versions are never pruned | ✅ | `engine/storage/VersionHistoryStorage.ts:196`, `engine/VersionTimelineManager.ts:62,1000` | |
| A2.9 | Time-Travel scrubber | Ctrl+⇧T (Ctrl only, not ⌘). Inside it, ←/→ step, Enter restores and Esc closes. Viewers see Restore disabled | ✅ | `editor/shell/TimeTravelHost.tsx:117,249-257,302` | Not printed on the shortcuts sheet. |

### A3. Keyboard shortcuts (complete as bound on main)

"⌘" means Cmd or Ctrl. **Sheet** means the chord is printed by `editor/canvas/controls/keyboardSheetRows.ts`, the single sheet opened by both ? and ⌘/.

| # | Key | Action | Where handled | Status | Note |
|---|---|---|---|---|---|
| A3.1 | ⌘S | Save | `editor/shell/hooks/useEditorShortcuts.ts:167` (+ registry `defaultCommands.ts:84`) | ✅ | Sheet. The unmerged branch makes this one ⌘S path (`377e1197a`). |
| A3.2 | ⌘Z | Undo | `useEditorShortcuts.ts:188` | ✅ | Sheet |
| A3.3 | ⌘⇧Z / ⌘Y | Redo | `useEditorShortcuts.ts:185-193` | ✅ | ⌘Y is now printed |
| A3.4 | ⌘P | Toggle in-editor Preview | `useEditorShortcuts.ts:177` | ✅ | Sheet |
| A3.5 | ⌘K | Command palette | `editor/shell/StudioHeader.tsx:331` | ✅ | Sheet |
| A3.6 | ⌘⇧P | Same palette (alias of ⌘K) | `useEditorShortcuts.ts:137` | ✅ 🆕 | The separate canvas palette is ❌ (merged 2026-09-22) |
| A3.7 | ? and ⌘/ | Single keyboard-shortcuts sheet (? closes it again) | `useEditorShortcuts.ts:146,196`; `KeyboardCheatSheet.tsx:100` | ✅ 🆕 | The two separate sheets are ❌ |
| A3.8 | ⌘J | Open AI (inspector column) | `useEditorShortcuts.ts:200` | ✅ | Sheet: "Ask AI" |
| A3.9 | I | Open AI (inspector column) | `editor/sidebar/useSidebarKeyboard.ts:53` | ✅ | Not on the sheet: AI is no longer a rail tab (G2-127) |
| A3.10 | ⌘, | Site settings | `useEditorShortcuts.ts:151` | ✅ | Sheet |
| A3.11 | ⌘H | Left panel → History | `useEditorShortcuts.ts:156` | ✅ | Sheet. On Mac the browser eats ⌘H, so the menu prints Ctrl. |
| A3.12 | C | Comment mode | `useEditorShortcuts.ts:119` | 🔒 | Only when `reviewsEnabled` (the agency review layer) is on |
| A3.13 | F6 / ⇧F6 | Cycle shell regions (works inside fields too) | `useEditorShortcuts.ts:102` | ✅ | Sheet |
| A3.14 | Esc | Close the sheet, or deselect (registry `escape`). Per-surface closes: Layers, Brand, Preview, Settings, Templates, Comments, Pages select-mode | many (`LayersTab.tsx:183`, `BrandWorkspace.tsx:389`, `PreviewOverlay.tsx:148`, …) | ✅ | |
| A3.15 | A · T · M · L · P · B · S · U · H · R · D | Open Add · Templates · Assets · Layers · Pages · Brand · Settings · Publish · History · Review · CMS | `editor/rail/tabsConfig.ts:55-245` via `useSidebarKeyboard.ts:59-70` | ✅ | Sheet "Panels". R stands down unless reviews are on (FB-4). |
| A3.16 | ⇧A | Components | `useSidebarKeyboard.ts:62` | ✅ | The duplicate binding in the shell hook was removed (FB-1) |
| A3.17 | Delete / Backspace | Delete selection (asks first if more than one) | `defaultCommands.ts:96-97`, `useCanvasKeyboard.ts:136` | ✅ | |
| A3.18 | ⌘C / ⌘X / ⌘V | Copy / Cut / Paste | `defaultCommands.ts:270,287,310` | ✅ | |
| A3.19 | ⌘⇧V | Paste HTML… | `defaultCommands.ts:573` | ✅ 🆕 | |
| A3.20 | ⌘D | Duplicate | `defaultCommands.ts:157` | ✅ | |
| A3.21 | ⌘G / ⌘⇧G | Group / Ungroup | `defaultCommands.ts:129,143` | ✅ | |
| A3.22 | ⌘⌥C / ⌘⌥V | Copy style / Paste style | `defaultCommands.ts:191,208` | ✅ | Now registry commands, so they are on the sheet |
| A3.23 | ⌘] ⌘[ ⌘⇧] ⌘⇧[ | Bring forward, Send backward, Bring to front, Send to back | `defaultCommands.ts:459-483` | ✅ | |
| A3.24 | ⌘A | Select all (root excluded) | `defaultCommands.ts:495`, `useCanvasKeyboard.ts:84` | ✅ | |
| A3.25 | ⌘⇧E | Open exporter | `defaultCommands.ts:556` | ✅ | |
| A3.26 | ⌘\ | Toggle inspector | `defaultCommands.ts:565` | ✅ 🆕 | |
| A3.27 | ⌘⇧A | Open AI assistant | `defaultCommands.ts:580` | ✅ | |
| A3.28 | ⌘⇧C toggle component view | — | — | ❌ | No longer in the registry |
| A3.29 | Tab / ⇧Tab | Next / previous element | `useCanvasKeyboard.ts:92` | 🐞 | On main this also fires from controls in the canvas column (Tab on Zoom cycles the selection). Fixed on the unmerged branch, `cbdb7d6c8` (BK-28). |
| A3.30 | ↑ ↓ ← → / Home End | Sibling, parent, child, first, last | `useCanvasKeyboard.ts:185-255` | ✅ | |
| A3.31 | ⇧+arrow / ⌘+arrow | Move 10 px / 1 px | `useCanvasKeyboard.ts:187-226` | ✅ | |
| A3.32 | ⌥↑ ⌥↓ / ⌥Home ⌥End | Reorder / move to first or last | `useCanvasKeyboard.ts:191-250` | ✅ | |
| A3.33 | ⇧F10 / right-click | Context menu | `useCanvasKeyboard.ts:114` | ✅ | The menu's submenus are keyboard-operable now (IA-01 fixed) |
| A3.34 | ⌘0 · ⌘1 · ⌘2 · ⌘= / ⌘+ · ⌘- | 100% · fit · zoom to selection · zoom in · zoom out | `editor/canvas/CanvasFooterToolbar.tsx:212-232` | ✅ | The ⌘K "Ctrl+0" mismatch is fixed: the palette's "Reset zoom" row is ⌘0 (`CommandPalette.tsx:282`) |
| A3.35 | ⌘; · ⌘⇧; · ⌘' · ⌘B · ⌘R · ⌘⇧X | Guides · spacing · grid · badges · rulers · X-ray | `CanvasFooterToolbar.tsx:239-243` | ✅ | ⌘R overrides browser reload |
| A3.36 | / or ⌘F | Focus the Add panel search | `editor/sidebar/tabs/build/BuildTab.tsx:196-197` | ✅ 🆕 | The 09-16 "/ in Pages" binding is ❌ |
| A3.37 | ⌘↵ | Post comment; run Generate block | `editor/canvas/comments/CommentLayer.tsx:545`, `GenerateBlockScreen.tsx:252` | ✅ 🆕 | |
| A3.38 | ⌘K inside the media library | Focus library search | `editor/media/LibraryManager.tsx:163` | ✅ 🆕 | Shadows the global ⌘K while the library is open |
| A3.39 | Enter / Esc in inline text edit | Commit / cancel (Enter inserts a newline in textarea) | `editor/canvas/hooks/useCanvasInlineEdit.ts:205-208` | ✅ | |
| A3.40 | Device chords | None (⌘1–4 belong to zoom) | `defaultCommands.ts:612-618` | ✅ | |
| A3.41 | Global guard rules | Every chrome chord stands down while a modal is open. Letter keys ignore inputs and editable text. F6 works everywhere | `useEditorShortcuts.ts:96`, `useSidebarKeyboard.ts:30-45` | ✅ | |

### A4. Breakpoints and devices

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A4.1 | Breakpoints | Desktop ≥1024 (base), Tablet 768–1023 `(max-width:1023px)`, Mobile 0–767 `(max-width:767px)`. Desktop-first cascade | ✅ | `shared/constants/breakpoints.ts:4-58` | |
| A4.2 | Legacy 991/575 thresholds | No longer in src | ❌ | grep 991px / 575px → none | Drift row resolved |
| A4.3 | Device frames | wide 1920×100%, desktop 100%, tablet 768×1024, mobile 375×812 | ✅ | `breakpoints.ts:103-108` | **Watch was removed** (decision #26, `engine/Viewport.ts:74`). Wide is reachable only through ⌘K "Wide view" |
| A4.4 | Breakpoint switcher | Now only under the footer View ▸ Breakpoint menu (board 5936:44788) | 🐞 | `CanvasFooterToolbar.tsx:346-358`, `defaultCommands.ts:619-628` | UX-06: the active breakpoint is not visible ("View · 1"). |
| A4.5 | Three "Desktop" widths | Canvas 1024 / Preview 1320 / Export 1440 | 🟡 | `shared/constants/canvas.ts:345-348`, `editor/shell/PreviewOverlay.tsx:89`, `config.ts:161` | L1-013 is a DECISION, not reconciled |
| A4.6 | Toolbar device presets with emoji | Still emoji icons 🖥️ 📱 📲 | 🟡 | `canvas.ts:345-348` | Anti-slop risk if drawn |
| A4.7 | Preview starts on Desktop whatever the canvas device | `useState("desktop")` | 🐞 | `PreviewOverlay.tsx:119` | UX-11 (Medium) |

### A5. Size and count limits

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A5.1 | Zoom | 10–400%, presets 10/25/50/75/100/150/200/400 | ✅ | `config.ts:87-88`, `canvas.ts:360` | |
| A5.2 | Drag | start 5 px, edge auto-scroll 50 px, near-target 20 px, drop-zone edge 25% | ✅ | `config.ts:92-100` | |
| A5.3 | Marquee min | 3 px | ✅ | `config.ts:104` | |
| A5.4 | Element size | 10×10 to 10000×10000 px. Text minimum 20×16 | ✅ | `config.ts:120-127` | |
| A5.5 | Canvas max | 20000×20000 | ✅ | `config.ts:131-132` | |
| A5.6 | Components per project | 100 | ✅ | `engine/components/ComponentManager.ts:114`, `useComponentsState.ts:17` | Duplicated constant (SSOT smell) |
| A5.7 | Slug history | 100 per page | ✅ | `engine/elements/manager/PageManager.ts:31` | |
| A5.8 | Recents | Add panel 8 · templates 3 · icons 12 | 🟡 | `shared/constants/ui.ts:1`, `templatesData.ts:74`, `IconBrowserOverlay.tsx:38` | The baseline said 8 for icons. It is 12 now. |
| A5.9 | Media uploads | image 10 MB / 4096 px, SVG 1 MB, video 100 MB, audio 50 MB, font 5 MB. Image-editor output 8192 px | ✅ | `shared/constants/media.ts:21-51` | |
| A5.10 | Storage quota | Drawn from plan limits (500 MB / 5 GB / 50 GB). Warn at 80%, critical at 95%, polled every 30 s | ✅ | `lib/constants/plan-limits.ts:32,53,74`, `config.ts:143-145`, `StorageQuotaBar.tsx:33` | The 1 GB constant drift appears resolved (no 1 GB literal found) |
| A5.11 | Plan limits | sites 3/15/50, pages 10/30/50, AI generations 3/20/∞, prompts per day 10/200/∞ | ✅ | `lib/constants/plan-limits.ts:28-77` | |
| A5.12 | AI client rate limit | 30 per window, retry delay 1 s | ✅ | `services/ai/AiTrpcClient.ts:17-19` | |
| A5.13 | AI prompt payload | Recall lists are halved until the encoded input fits 7,000 chars | ✅ 🆕 | status-not-done L2-037 `5358a0b63` | |
| A5.14 | API | timeout 30 s, 3 retries, 1 s delay | ✅ | `config.ts:138-140` | |

### A6. Sanitization

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A6.1 | Single sanitizer | DOMPurify `sanitizeHTML`. Strips `on*` handlers and blocks `javascript:` / `vbscript:` | ✅ | `shared/utils/html/sanitization.ts:1-30` | Every ingestion path must route through it (`engine/AGENTS.md:16`) |
| A6.2 | URL schemes | `data:` only on media. `blob:` only on src, srcset and poster, never on a navigable URL | ✅ | `sanitization.ts:129-133` | |
| A6.3 | Session `blob:` URLs are dropped from persisted trees | They are re-pointed when a re-created asset is known, otherwise removed (including background images built on them) | ✅ 🆕 | `sanitization.ts:261-290` | Explains images that "vanish" after a reload |
| A6.4 | Head code allowlist | Tags: meta, link, script (src only), noscript, style, base, title. Attributes: no `on*` | ✅ | `shared/constants/headCode.ts:14-40`, `engine/export/sanitizeHeadCode.ts` | |
| A6.5 | Plain-text content never purified as HTML server-side | Not on main | 🐞 | branch `b05b746c6` | Fixed on the unmerged branch |
| A6.6 | Form wiring keeps attributes | Not on main | 🐞 | branch `931fb6c90`, `e8b25045a`, `1fb7ce981` | Fixed on the unmerged branch (security) |

### A7. Autosave, save failure and recovery

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A7.1 | Autosave debounce | 1 s after the last change (`AUTOSAVE_DEBOUNCE`) | ✅ | `config.ts:112`, `useComposerInit.ts:880` | `AUTOSAVE_INTERVAL 5000` still exists in config; whether the local 5 s mode still runs was not verified |
| A7.2 | Automatic retry after a failed save | Exponential backoff from 5 s, capped at 60 s. Also retries on `online` | ✅ 🆕 | `useComposerInit.ts:136-137,641`, `:891` | L5-070 fixed |
| A7.3 | Failure toasts | "Offline — not saved" · "Couldn't reach the server — not saved" · "Session expired" · "This site isn't there anymore" · "Not saved — this site never loaded" (+Reload) · "Save failed" (**+Retry now**) | ✅ 🟡 | `editor/shell/hooks/useSaveCallback.ts:290,371`, `useComposerInit.ts:857-876` | "Retry now" is new (board 7574:194162) |
| A7.4 | Conflict state | Any save or publish conflict puts the chip into `conflict`. A single conflict dialog exists only on the branch | 🟡 | `useComposerInit.ts:887-889`, `editor/shell/modals/ConflictModal.tsx`; branch `765343348` | |
| A7.5 | Reload recovery | `RecoveryBanner` compared against `serverEditedAt`. The 09-16 copy "Some work never reached the server" is no longer in src | 🟡 ❌ | `editor/shell/RecoveryBanner.tsx:73`, `AquibraStudio.tsx:662` | Restore and Keep now save (L5-074/075 fixed). The copy changed; check it before drawing |
| A7.6 | "Not saving" pill; the exit prompt firing on clean loads | Not on main | 🐞 | `StudioHeader.tsx:554` (dev instrumentation for 1-in-3 false prompts); branch `9e1958a5e` | |

### A8. Colour mode and plan gating (changed rules)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| A8.1 | Brand Light/Dark switch | **Preview-only.** Never saved and not in undo. Dark is disabled while the site's Dark mode is Off | ✅ 🆕 | `editor/design-system/ui/ColorModeToggle.tsx:1-30` | Replaces the 09-16 rule "global, persisted, light/dark/system" |
| A8.2 | Settings plan locks | `custom-code` → Pro (LockedScreen). `access` → Pro (draws its own lock on the Password card). **Integrations is no longer a locked screen**: it is the dashboard link "Integrations & webhooks" | 🔒 🟡 | `editor/sidebar/tabs/settings/types.ts:215-226`, `constants.ts:141,269` | |
| A8.3 | Upgrade modal triggers | Only premium templates call `openUpgrade` | 🔒 | `editor/sidebar/tabs/templates/TemplatesTab.tsx:171,214`; mounted `AquibraStudio.tsx:859` | Badge colour is still purple (`chrome-ui/UpgradeModal.tsx:116`; allowed for PRO only) |

---

## PART B — Gap register (whole editor)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| B1 | Publish flow | Publish request gated on `publish` | 🚩 | `editor/sidebar/TabRouter.tsx:200`, `editor/shell/hooks/useLifecycle.ts:111` | Production bundle must bake `"true"` (`gate:baked-flags`) |
| B2 | Real-time collaboration | Header presence, connection pill and the "Start collaboration session" palette row | 🚩 | `editor/shell/StudioHeader.tsx:296`, `editor/shell/modals/CommandPalette.tsx:307` | The engine OT is demo-only and does not converge (`engine/AGENTS.md:26`) |
| B3 | DS AI client | `ComponentSchemaAIClient` built only with `dsAi` | 🚩 | `useComposerInit.ts:207` | |
| B4 | Brand "AI component styles" CTA | Shown, aria-disabled, tooltip "Coming soon: AI component styles aren't available yet" when the flag is off | 🚩 ⏳ | `BrandWorkspace.tsx:596-612` | |
| B5 | Brand "From logo or URL" (colours page and Starters) | Hidden unless `dsAi` | 🚩 | `BrandWorkspace.tsx:756,853` | Server `theme.extractBrandFromUrl` → NOT_FOUND unless the flag is exactly "true" |
| B6 | Export as Vue / Next.js | aria-disabled "Soon" pills | ⏳ | `editor/export/ExportOptions.tsx:29,107-116` | |
| B7 | CMS import from Google Sheets / Airtable | Disabled menu items labelled "Coming soon" | ⏳ | `editor/cms/CmsWorkspace.tsx:392-395` | |
| B8 | CMS source dialog: Sheets / Airtable connect | Greyed rows labelled "Coming soon" | ⏳ | `editor/sidebar/tabs/content/DataRowDialogs.tsx:215-228` | Same gap as B7, second surface |
| B9 | Add-panel disabled rows | "Soon" tag + reason tooltip, no insert | ⏳ | `editor/sidebar/tabs/build/components/GroupSection.tsx:120,201,282` | Driven by `el.disabled` in the catalog; no entry currently sets it (grep) |
| B10 | Integration row "COMING SOON" status | Chrome primitive with no consumer | ⏳ | `editor/chrome-ui/IntegrationRow.tsx:13-21` | Unmounted primitive |
| B11 | Upload (file input) element | Hidden from Add (owner default) because multipart is rejected | ⏳ | audit L3-025 `92a339d83` | The element type still exists (A1.1) |
| B12 | Comment mode C and the R / Review panel | Only when the agency review layer is on | 🔒 | `useEditorShortcuts.ts:119`, `useSidebarKeyboard.ts:17-20`, `tabsConfig.ts:217-224` | Review is off-rail (no zone). No rail button yet |
| B13 | Custom code screen | Pro | 🔒 | `settings/types.ts:215-217`, `screens/LockedScreen.tsx` | |
| B14 | Access → Password protection | Pro (own lock, "Upgrade to Pro") | 🔒 | `screens/AccessScreen.tsx:169-172` | Share links on all plans |
| B15 | Premium templates | Upgrade modal | 🔒 | `TemplatesTab.tsx:156-214` | L2-009 fix (Business no longer blocked) on main |
| B16 | Settings header "Upgrade" | Opens the dashboard billing page | 🔒 | `SettingsTab.tsx:1110` | |
| B17 | Viewer role disabled doors | Restore (Time-Travel, Activity, Versions), Resolve/Reattach comment, media delete/rename, folder delete, bulk delete, asset details actions, Send for review | 🟡 | `TimeTravelHost.tsx:302`, `ActivityView.tsx:451`, `VersionHistoryPanel.tsx:510`, `ReviewTab.tsx:666,770`, `MediaContextMenu.tsx:187,257`, `FolderTree.tsx:217`, `SlimLauncher.tsx:778`, `AssetGrid.tsx:681,1013,1043`, `AssetDetailsPanel.tsx:262`, `SendForReview.tsx:163` | Role gates, not gaps. Consistent pattern: aria-disabled plus a tooltip reason |
| B18 | Read-only view `?view=readonly` | No rail, drawer or inspector; mutations refused | ✅ | `shared/utils/editorViewMode.ts:29` | `?rail=e3` / `?rail=legacy` hatches deleted |
| B19 | Presence mock users | `MOCK_USERS` when disconnected in dev builds | 🧪 | `editor/collaboration/PresenceIndicators.tsx:53` | |
| B20 | Agentation overlay | Demo app, `import.meta.env.DEV` only | 🧪 | `packages/editor/demo/main.tsx:63` | |
| B21 | Exit-reason instrumentation | `window.__bkExitReason` | 🧪 | `StudioHeader.tsx:554` | Exists because of a measured false exit prompt (A7.6) |
| B22 | Dev console warnings | Block registry mismatch; inspector interactions/animation not implemented on an element; unknown publish block reason | 🧪 | `useBuildTab.ts:212`, `inspector/sections/registry/behaviour.tsx:39,48,64`, `editor/shell/lifecycle.ts:181` | behaviour.tsx shows that some elements lack get/setInteractions |
| B23 | Preset binding row | "Click behaviour is no-op v1 — token picker integration deferred" | ⏳ | `editor/design-system/ui/sections/PresetBindingRow.tsx:5` (used by `PresetDetailPane.tsx:15`) | Drawn but inert |
| B24 | Brand Figma export row | Removed (G3-149) | ❌ | `design-system/ui/sections/ExportSection.tsx:11` | |
| B25 | Media "Trash" row | Removed (was a coming-soon toast) | ❌ | `editor/media/components/FolderTree.tsx:465` | |
| B26 | Brand unmounted pieces (LintBanner, ExportDropdown, BindingEditorRow, StarterGalleryModal) | No component files left | ❌ | grep → 0 tsx files | |
| B27 | Plugins | Menu entry gone. `PluginManager` engine stays; no UI | ❌ | `editor/shell/SiteMenu.tsx:15`, `panelStateMigration.ts:34`, `engine/PluginManager.ts` | |
| B28 | Snap-to-grid command | No longer in the registry; the grid size field 1–100 stays | ❌ | `defaultCommands.ts` id list; `CanvasFooterToolbar.tsx:484` | |
| B29 | Watch device | Removed (decision #26) | ❌ | `engine/Viewport.ts:74` | |
| B30 | Wide device | Palette only | 🟡 | `defaultCommands.ts:619-628` | No visible door |
| B31 | Hover level ("minimal / hierarchy / boxmodel") | The level type remains. Whether a toggle door exists was not re-verified | 🟡 | `editor/canvas/overlays/ElementHoverOverlay.tsx:29,81` | |
| B32 | Forms submissions inbox | Now a Settings screen (inbox, archive, Export CSV) | ✅ 🆕 | `screens/FormsScreen.tsx:1-11` | The 09-16 "always empty" claim is superseded. Delivery fixes are on the branch (`d1f65e938`, `1fb7ce981`) |
| B33 | Site SEO / Page SEO arc | No readability, keyphrase or structured-data UI. The robots sitemap line only | ⏳ | `screens/SeoScreen.tsx:58-64`; FG-007/009 | Owner answered (OWNER-ANSWERS FG-007/009); not built |
| B34 | Review v2 redesign | Not built | ⏳ | FG-001/002 | Owner: v2 is the design |
| B35 | Activity panel | Off-rail. Doors: site menu, ⌘K, notifications | ✅ 🆕 | `tabsConfig.ts:200-215` | |
| B36 | CMS / Content panel | Off-rail (D letter, ⌘K) although the rail contract lists it | 🟡 | `tabsConfig.ts:231-245`, `RAIL_FIGMA` `:290` | The rail draws Add · Layers · Pages · Assets · CMS · Brand |
| B37 | Purple in built-in templates | `#667eea` / `#764ba2` gradients in the Portfolio, Agency and Shop starters | 🐞 | `editor/sidebar/tabs/templates/templatesData.ts:162,173,184` | DESIGN.md bans purple. This is customer output, not chrome, so it needs an owner call |
| B38 | Onboarding progress key is global | "Done · 7 of 7" on a new site | 🐞 | status-not-done L1-015 (DECISION) | Still live per audit |

---

## PART C — Open known bugs on main (Critical + High)

Method: every fix commit cited for a Critical or High row in `docs/audits/2026-10-08-editor-full-audit/ISSUE-INDEX.md` was checked with `git merge-base --is-ancestor <hash> main`, and **all 47 hashes are on main**. Four Criticals were also spot-checked, and their regression tests are present (`engine/export/__tests__/ExportEngine.textWithChildren.test.ts`, `engine/__tests__/SelectionManager.pageSwitch.test.ts`). "Fixed" means "fix commit on main"; it does not mean re-walked today. The unmerged branch is `feat/phase1-s6-publish` (33 commits, `git log main..feat/phase1-s6-publish`).

### C1. 2026-10-08 full audit — Critical (4)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| C1.1 | L1-002 | Export/publish dropped an element's own text once it had a child | ✅ fixed | `7bf99a90f` on main, test present | |
| C1.2 | L2-001 | Save page as template corrupted HTML / stripped styling | ✅ fixed | `99bc72216` | |
| C1.3 | L3-002 | After a page switch, inserts landed on the previous page | ✅ fixed | `98024b024`, test present | |
| C1.4 | L4-001 | Media drag wrote `src` onto the section | ✅ fixed | `2cb6d3a43` | |

### C2. 2026-10-08 full audit — High (40)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| C2.1 | L1-001 | Click-insert went inside the selected heading | ✅ fixed | `1c98083b2` | |
| C2.2 | L1-003 / L2-007 | Selection toolbar covered small elements; a second click deleted or duplicated | ✅ fixed | `5c0053cf6` | UX-07 (Medium) says the toolbar still crowds content |
| C2.3 | L1-004 | Tablet/Mobile resize wrote the Desktop style | ✅ fixed | `e2e0d5e73` | Zoom-correct resize is on the branch (`9e1958a5e`) |
| C2.4 | L1-007 | Undo jumped to the first page | ✅ fixed | `39081ed5f` | |
| C2.5 | L2-002 / L3-001 | Duplicate slug → every autosave 500 | ✅ fixed | `94f47f080`, `2b91ea01c` | |
| C2.6 | L2-003 | Layers Delete removed a locked element | ✅ fixed | `1dd0a5bf6` | Right-click on a locked element still selects it: branch `cbdb7d6c8` |
| C2.7 | L2-004 | Layers Delete removed an instance child | ✅ fixed | `1dd0a5bf6`, `6a5673159` | |
| C2.8 | L2-005 | Instance text overrides lost on master update | ✅ fixed | `edc3c76dd` | |
| C2.9 | L2-006 | Insert from saved components nested in the same instance | ✅ fixed | `bd913f3de` | |
| C2.10 | L2-008 | :hover/:focus never shown on canvas | ✅ fixed | `c29411fc4` | Publish path UNVERIFIED in the audit |
| C2.11 | L2-009 | Pro templates blocked on Business | ✅ fixed | `8471a15c5` | |
| C2.12 | L2-010 | Component delete undo not persisted | ✅ fixed | `6c1dd5615` | |
| C2.13 | L3-015 | Field-key rename stripped rich text | ✅ fixed | `56a31dbbc` | |
| C2.14 | L3-016 | Stale bound text after unpublish/delete | ✅ fixed | `4180deaca`, `701c28522` | An empty bound element collapses to 0 px (design call) |
| C2.15 | L3-024 | Repeated field names dropped values | ✅ fixed | `6389005f0` | |
| C2.16 | L3-025 | Upload element multipart rejected | 🟡 hidden | `92a339d83` | Hidden from Add, not built (B11) |
| C2.17 | L4-002 | Library drag re-uploaded the asset | ✅ fixed | `2cb6d3a43` | |
| C2.18 | L4-003 | Replace image kept the old alt | ✅ fixed | `158788d09` | |
| C2.19 | L4-018 | Token rename did not move bindings | ✅ fixed | `1e97fefba`, `71f94ea41` | |
| C2.20 | L4-019 | Delete-and-replace left the token live | ✅ fixed | `71f94ea41`, `464b61855` | |
| C2.21 | L4-020 | Token usage reset to 0 after reload | ✅ fixed | `24640e769` | |
| C2.22 | L4-021 | Brand Light/Dark flipped a global persisted mode | ✅ fixed | `ColorModeToggle.tsx:7-14` (preview-only now) | The index still says PARTLY; the code says fixed |
| C2.23 | L4-022 | Contrast Fix › rewrote the colour the wrong way | ✅ fixed | `a6ed3fce2` | Fix click not live-exercised |
| C2.24 | L4-033 | Missing alt: editor error vs server warning | ✅ fixed | `9d7c118be` | |
| C2.25 | L4-034 | Whole-site issue selected an invisible element | ✅ fixed | `da223041b` | |
| C2.26 | L5-001 | Dev AI dead when Ollama is down | 🟡 | `e48cccd80` | Fails fast now; dev env still sets OLLAMA_BASE_URL |
| C2.27 | L5-002 | Element-scoped AI sent only the id | ✅ fixed | `21635494e` | |
| C2.28 | L5-003 | AI edits overwrote locked elements | ✅ fixed | `1cdb991dd` | |
| C2.29 | L5-004 | "Undo all" undid the user's edit | ✅ fixed | `3915996bd`, `675830d02` | |
| C2.30 | L5-007 | Generate block: Stop still inserted | ✅ fixed | `0764e514c` | |
| C2.31 | L5-030 | Team comments invisible before a round | ✅ fixed | `416ce8e61`, `1bbe010aa` | |
| C2.32 | L5-070 | Failed autosave never retried | ✅ fixed | `5dda5a9f4`; `useComposerInit.ts:641` | |
| C2.33 | L5-074 | Contradictory recovery surfaces | ✅ fixed | `9579895f2`, `53346a2ec` | |
| C2.34 | L5-075 | Restore/Keep did not save | ✅ fixed | `2bc953a43` | Branch `2d7ad38b8`: "restore Keep keeps recovering" (further fix) |
| C2.35 | FG-001 | Review panel v2 not implemented | 🐞 open | status-wave6 :93; OWNER-ANSWERS :17 | Owner: build v2 |
| C2.36 | FG-002 | Two "current" Review designs in Figma | 🐞 open (Figma) | status-wave6 :182-187 | Figma-only |
| C2.37 | FG-007 | Page SEO: no readability, keyphrase, schema or canonical validation | 🐞 open | no matching UI in `editor/` (grep) | Owner answered; not built |
| C2.38 | FG-009 | Site SEO: no structured data, sitemap UI or previews | 🐞 open | `SeoScreen.tsx` has only the robots sitemap line | Not built |

### C3. UI/UX audit 2026-10-10 — High (7)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| C3.1 | UX-01 | Empty-page intro clips at 1280×720 | ❓ can't tell | `editor/canvas/CanvasEmptyCTA.tsx` | Runtime only |
| C3.2 | UX-04 | Page creation stacks dialog, progress and onboarding modal | ❓ can't tell | L1-029 (one tip owner) still DECISION | Likely still present |
| C3.3 | UX-06 | Breakpoint hidden in "View · N" submenu | 🐞 present | `CanvasFooterToolbar.tsx:346-358` | |
| C3.4 | UX-09 | Mobile font override missing from Preview | 🟡 likely fixed on unmerged branch | branch `bee52ba1c` (canvas renders the published cascade), `2530f1626` (one content rule for canvas, Preview, export) | Not verified |
| C3.5 | UX-10 | Line-height field disagrees with render | 🟡 partly | L2-018 `dcc133d5c` on main (unset rows read rendered values); branch `89367e913` resolved-style contract | |
| C3.6 | UX-12 | Starter nav does not adapt at 375 px | 🐞 likely present | Template data unchanged (`templatesData.ts`) | Template content issue |
| C3.7 | UX-22 | Full-page Settings leaves covered chrome in the tab/AT order | 🐞 present on main · fixed on unmerged branch | no `inert` anywhere in main `editor/`; branch `cbdb7d6c8` adds a FullPageHost that inerts the editor behind it | |

### C4. Product audit 2026-10-10 — High (5)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| C4.1 | IA-01 | Keyboard cannot operate context-menu submenus | ✅ fixed | `editor/canvas/menus/ElementContextMenu.tsx:141,157` on main | |
| C4.2 | IA-07 | Full-page coverage is not focus isolation | 🐞 present · fixed on unmerged branch | Same as C3.7 | |
| C4.3 | IA-08 | Preview is not an interaction runtime | 🐞 present (by design) | `PreviewOverlay.tsx:211` `sandbox="allow-same-origin"` (no scripts) | Needs a security review before any change |
| C4.4 | IA-10 | Inspector does not show the effective value and its origin | 🟡 | branch `89367e913` (one resolved-style contract) | |
| C4.5 | IA-14 | Feature richness exceeds verified workflow coverage | 🐞 open (process) | — | Not a code bug |

### C5. Also open on main and fixed only on the unmerged branch (subjects; Webflow-audit IDs, outside the three audits but load-bearing for the redesign)

| # | Item | Detail | Status | Evidence | Note |
|---|---|---|---|---|---|
| C5.1 | Duplicate/paste/page-duplicate lose breakpoint and :state styles | BK-06 | 🐞 · fixed on unmerged branch | `5f57d4f29` | |
| C5.2 | ⌘Z ignores read-only and full-page gates | BK-05 | 🐞 · fixed on unmerged branch | `80e0ad723` | |
| C5.3 | A save claims edits made while it was in flight | BK-11 | 🐞 · fixed on unmerged branch | `377e1197a` | |
| C5.4 | Content rule differs across canvas, Preview and export | BK-40/51 | 🐞 · fixed on unmerged branch | `2530f1626` | |
| C5.5 | A live deploy recorded as failed | publish | 🐞 · fixed on unmerged branch | `d1f65e938` | |
| C5.6 | Server authz by target site (reviews, library, theme) | E-T5/BK-08 | 🐞 · fixed on unmerged branch | `7140abdd2` | Security |
| C5.7 | No load-time damage scan or repair | E-T9 | ⏳ · on unmerged branch | `5cfd71467` | New Issues rows |

---

## Not verified

- Nothing was walked in a running editor this session. Every status comes from code and git.
- "Fixed" in Part C means the cited commit is an ancestor of main and, for 4 Criticals, that the regression test file exists. Behaviour was not re-run.
- Whether `AUTOSAVE_INTERVAL` (5 s) still drives a local or standalone mode.
- Whether a door to hover levels (minimal / hierarchy / boxmodel) is mounted (B31).
- Undo/redo toast copy and History-row labels from the 09-16 slice were not re-checked line by line. Only their emitting files were confirmed (`useHistoryFeedback.ts`).
- 09-16 §9–§14 enumerations were not re-verified: validation copy, naming defaults, default styles, fonts, icons, animation presets, CMS field types, settings enums and image-editor enums. Treat them as carried forward unless contradicted above.
- UX-01, UX-04 and UX-12 need a live check. UX-09 and UX-10 need a live check after the branch merges.
- Medium and Low audit rows (about 248 in ISSUE-INDEX, 18 in REPORT, 11 in FINDINGS) were not triaged.
- The `master-audit-2026-10-10` 10-14 files were deliberately not used.

## Status counts

| Part | Rows | ✅ | 🟡 | 🐞 | 🚩 | 🔒 | ⏳ | 🧪 | ❌ | ❓ | 🆕 (tag) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A (A1–A8) | 96 | 77 | 6 | 7 | 0 | 3 | 0 | 0 | 3 | 0 | 16 |
| B | 38 | 3 | 4 | 2 | 5 | 5 | 9 | 4 | 6 | 0 | 2 |
| C (C1–C5) | 61 | 37 | 5 | 16 | 0 | 0 | 1 | 0 | 0 | 2 | 0 |

Rows that carry two tags (for example A7.3 ✅🟡, B4 🚩⏳, A7.5 🟡❌) are counted under their first tag. In Part C, "fixed on unmerged branch" rows are counted as 🐞, because they are still open on main.

Audit Critical + High still open on main: **0 of 4 Critical**. **5 of 40 High** from the 10-08 audit: FG-001, FG-002, FG-007 and FG-009 open, plus L3-025 hidden rather than built; L5-001 is only partly fixed. UI/UX audit: **5 of 7 High** present or uncertain. Product audit: **4 of 5 High** open, 2 of them fixed only on the unmerged branch.


---

