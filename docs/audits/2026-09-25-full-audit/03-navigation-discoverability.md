# 03: Navigation and Discoverability (Prompt 3)

**Agent:** B, Product Architecture · **Date:** 2026-09-25 · **Mode:** read-only.

**Scope:** navigation and discoverability only. That covers:
- routes;
- the editor rail, topbar, site menu (⋯) and both command palettes;
- keyboard doors, breadcrumbs, tabs, Back/Close/Exit, context menus and deep links;
- the entries for collaboration, comments, review, share and invite.

The code covered is `packages/editor`, `packages/dashboard`, `server`, `packages/shared` and `lib`.

Ownership and bucket placement were already covered by A01 (`01-information-architecture.md`). Where a finding here shares a root cause with an A01 item, it cites that item instead of repeating it.

---

## Method & runtime status

**What I did:**
- I read Prompt 3 in the playbook and used `00-inventory.md` as a map.
- For every door I traced the chain in code: control → handler → event or state setter → router or listener → the surface that renders → the Close/Back handler → what is restored.
- I also traced every dashboard → editor and editor → dashboard hand-off (hrefs, query params, `window.open` vs `location.assign`), and the server gates behind the doors (agency flag, roles).

**Commands run (read-only):**

| Command | Result |
|---|---|
| `pnpm --filter @buildrik/editor exec vitest run` on 11 navigation test files (SiteMenu.kbd, SiteMenu.publishDoor, StudioPanels.openRequests, panelStateMigration, useDeepLink, useEditorEventListeners, useEditorShortcuts, useStudioState, TabRouter.ai, FullPageRouter, shell CommandPalette) | **148 passed, 3 failed.** All 3 failures are in `shell/modals/__tests__/CommandPalette.test.tsx`: two expect 21 commands and get 23, and one expects "Open Insert panel". The label is now "Open Add panel" (from `tabsConfig.ts:80`), and the two extra commands are the v3 IA doors at `CommandPalette.tsx:161-176`. This is test drift, not a navigation defect. |
| grep, sed, rg over editor, dashboard and server | Evidence is cited as file:line throughout |

**NOT RUNTIME VERIFIED:**
- There is no browser and no Postgres in this sandbox, so no door below was clicked in a running app.
- Every "VERIFIED" status means the complete code chain was read. It does not mean the behaviour was observed.
- The production values of the build-time flags (`NEXT_PUBLIC_FEATURE_PUBLISH`, `_COLLAB`) and of the per-workspace `agency_layer` rows cannot be seen from the repo.

## Corrections to the inventory (verified in code)

| Inventory claim | Code |
|---|---|
| "`?rail=` chooses between three rail renderers" | **Only in dev builds.** `resolveRailMode` returns `"figma"` whenever `!IS_DEV_BUILD` (`packages/editor/src/shared/utils/editorViewMode.ts:67-72`). Production has exactly one rail. |
| AI is one surface reached by ✨ / ⌘K | **Two homes.** The same `AITab` can open either in the inspector column or in the left drawer, depending on the door used (A03-3). |
| Command palette issue = two palettes | There is also an internal duplication inside ⌘K. Two AI rows go to different places, and there are two Templates rows and two Undo rows (A03-12, extending A01-14). |

---

## Output table: per-feature navigation map

Abbreviations:
- `SM` = topbar site menu (`shell/SiteMenu.tsx`).
- `⌘K` = shell palette (`shell/modals/CommandPalette.tsx`).
- `⌘⇧P` = canvas palette (`canvas/hooks/useCanvasCommandPalette.ts`).
- "key" = the bare-letter handler `sidebar/useSidebarKeyboard.ts`.

Paths are relative to `packages/editor/src/editor/` unless prefixed with `D/` (`packages/dashboard/`) or `S/` (`server/`).

| Feature | Primary entry | Secondary entries | Route / action | Destination | Parent | Back / Close | Discoverability issue | Duplicate-entry issue | Proof | Prio | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Add | Rail "Add" | key A; ⌘K "Open Add panel"; Layers empty state "Open Insert"; context menu "Replace with block…"; onboarding | `onLeftPanelTabChange("add")` | Left drawer `BuildTab` | Rail | Click the active rail icon again, or the panel ✕ | The key door is silent when the drawer is closed (A03-4). The Layers empty state still says "Open Insert" (`panels/layers/components/LayersEmptyState.tsx:32`). | — | `rail/tabsConfig.ts:74-87`, `sidebar/LeftSidebar.tsx:471-484` | P3 | KEEP |
| Layers | Rail "Layers" | key L; footer ⌗ `StructurePopover`; context menu "Reveal in layers" (`SHOW_IN_LAYERS`) | tab `layers` | Drawer `LayersTab` | Rail | Same as Add | Key door (A03-4) | The popover is a valid secondary entry | `shell/hooks/useEditorEventListeners.ts:112-127`, `shell/AquibraStudio.tsx:739` | — | KEEP |
| Pages | Rail "Pages" | key P; `PageTabBar`; ⌘⇧P "Open page settings" | tab `pages` | Drawer `PagesTab` | Rail | Same as Add; "Back to <Page> SEO" from Settings (`shell/StudioPanels.tsx:296-303`) | Key door (A03-4) | — | `sidebar/TabRouter.tsx:169-177` | — | KEEP |
| Assets (quick) | Rail "Assets" | key M; ⌘⇧P "Open media library", "Search stock photos" | tab `assets` | Drawer `MediaTab` | Rail | Same as Add | Key door (A03-4) | — | `sidebar/TabRouter.tsx:190-199` | — | KEEP |
| Full Media | MediaTab "Open library" | Inspector "Manage video" (`ui:switch-tab {fullPage}`) | `mediaFullPage=true` | Portal `LibraryManager` | Assets drawer | Close returns to the Assets drawer (`StudioPanels.tsx:411-415`), which is correct | — | Dashboard `/dashboard/media` (scope issue, see A01-3) | `sidebar/FullPageRouter.tsx:77-97` | — | KEEP |
| CMS | Rail "CMS" | key D; context menu "Bind to CMS field…"; ⌘⇧P "Manage CMS records" | tab `content` | Drawer `ContentTab` | Rail | Same as Add | `CMSRecordsModal` can be reached **only** from ⌘⇧P (A03-6) | Records are managed inline in ContentTab **and** in the modal | `canvas/menus/actions/standaloneActions.ts:47-58`; `canvas/hooks/useCanvasCommandPalette.ts:166-172` | P2 | CHANGE |
| Components | Off-rail | ⇧A; SM Build › Components; ⌘K "Open Components panel"; context menu "Save as component" | tab `components` | Drawer `ComponentsTab` | none (off-rail) | Panel ✕ | Rail shows no active state for off-rail tabs (A03-13) | Add › COMPONENTS vs panel (A01-10) | `shell/SiteMenu.tsx:239-243`, `shell/hooks/useEditorShortcuts.ts:129-133` | P3 | KEEP |
| Brand | Rail "Brand" | key B; SM Build › Brand; Settings "Fonts & colours"; Inspector "Whole site"; Issues › Open Brand; onboarding | tab `design` | Drawer `DesignSystemTab` | Rail | Same as Add | — | Several doors, but one name ("Brand") and one destination | `shell/SiteMenu.tsx:244-249`, `shell/AquibraStudio.tsx:640-643` | — | KEEP |
| Inspector | Always mounted | Topbar inspector toggle | — | Right column | — | Toggle (remembered) | — | — | `shell/StudioPanels.tsx:245-259` | — | KEEP |
| Selected-element AI | ✨ in selection toolbar | context menu "Improve with AI" | Popover | `AiPromptPopover` | Selection | Popover dismiss | — | — | `canvas/menus/actions/standaloneActions.ts:37-46` | — | KEEP |
| AI panel | Inspector ✦ chip / ⌘J | ⌘K "Open AI assistant" (⌃⇧A); ⌘K "Open AI panel"; key I; palette "Ask AI" empty-state offer | `ui:switch-tab {ai}` → inspector column; **but** `UI_PANEL_OPEN {ai}` and key I → left drawer | **Two different places** | Inspector, or the rail | "‹ Inspector" in the column; ✕ in the drawer | The drawer home is reached by accident and persists across reloads | Two ⌘K rows, two destinations | A03-3 | P2 | CHANGE |
| Templates | Pages › "From template" | key T; SM Build › Templates; ⌘K "Open Templates panel" **and** "Open templates"; ⌘K "Replace page layout…"; ⌘⇧P "Browse templates" | tab `templates` | Drawer `TemplatesTab` | Pages | ✕ | "Save page as template" can be reached **only** from ⌘⇧P (A03-6) | Two ⌘K rows with the same destination (A03-12) | `shell/modals/CommandPalette.tsx:49-63,161-167`, `engine/commands/defaultCommands.ts:433-436` | P2 | CHANGE |
| Site Settings | SM "Site settings" (⌃,) | key S; ⌘K "Open Settings panel"; ⌘⇧P analytics/export/integrations; SM "Plugins"; Pages "Add redirect" | tab `settings` (+ sub-screen) | Full-screen portal `SettingsTab` (covers the topbar) | Canvas | "‹ Back to canvas" → **always the Add drawer** (A03-9) | The door lands on the last sub-screen, not Overview (A03-2) | Editor vs dashboard site tabs (A01-4) | `sidebar/FullPageRouter.tsx:105-123` | P1 | CHANGE |
| Publish | Topbar CTA (lifecycle "next move") | SM "Publish panel"; key U; ⌘K; onboarding; dashboard site header "Publish" → editor | CTA → confirm/deploy; panel → tab `publish` | `PublishConfirmModal` / drawer `PublishTab` | Topbar | Modal/drawer close | When the flag is off, the CTA is **disabled with a reason**, not hidden (`shell/lifecycle.ts:105`). This is correct. | Topbar fast path vs panel (deliberate, documented) | `shell/StudioHeader.tsx:681-695`, `shell/SiteMenu.tsx:204` | — | KEEP |
| History | SM "Version history" (⌃H) | SM "Publish history"; key H; ⌘K; Saves → Compare | tab `history` (+ `published`) | Drawer `HistoryTab` | SM | ✕ | "Version history" can open the Published list (A03-2) | — | `shell/AquibraStudio.tsx:514-515` | P1 | CHANGE |
| Review | Topbar review pill (only while a round exists) | SM "Review"; key R; ⌘K; ReviewBar Compare; onboarding ×2; orphan-comment modal | tab `review` (+ `compare`) | Drawer `ReviewTab` | SM | ✕ | Advertised in every workspace but gated server-side on `agency_layer` (A03-1). Compare re-opens on every visit (A03-2). | — | A03-1 / A03-2 | P1 | CHANGE |
| Comments (pins) | Topbar Comments toggle | key C | `ui:comment-mode` | Canvas `CommentLayer` | Canvas | Toggle | The thread list exists only inside ReviewTab, and only when a round exists (A03-1, A01-8). There is no deep link to a single comment (A03-7). | — | `shell/StudioHeader.tsx:708`, `sidebar/tabs/review/ReviewTab.tsx:499-543` | P2 | CHANGE |
| Issues | Topbar Issues chip | Publish-confirm "Fix issues first" | `setIssuesOpen(true)` | Absolute right panel | Topbar | ✕ | The row is `interactive` but only closes the panel (A03-10) | — | `shell/AquibraStudio.tsx:624-630` | P3 | CHANGE |
| Notifications (editor) | Bell | — | dropdown → `navigateFromNotification` | Dashboard URL, **same tab**, guarded | Topbar | — | Inconsistent with the site menu's dashboard doors, which open a new tab (A03-5) | Dashboard bell and page (SSE) | `shell/StudioHeader.tsx:518-525` | P3 | KEEP |
| Command palettes | ⌘K (no visible trigger) | ⌘⇧P (listed only in the `?` cheat sheet) | — | Two modals | — | Esc | Neither palette has a visible control. ⌘⇧P is effectively hidden but holds unique doors (A03-6). | ⌘K internal duplicates (A03-12); two palettes (A01-14) | `canvas/controls/KeyboardCheatSheet.tsx:92-94` | P2 | CHANGE |
| Keyboard help | SM "Keyboard shortcuts" (⌘/) | `?` cheat sheet; ⌘K "Keyboard shortcuts" | — | Two sheets, split on purpose (app chords vs canvas gestures) | — | Esc | — | Documented as a deliberate split (`shell/hooks/useEditorShortcuts.ts:33-41`) | — | — | KEEP |
| Export | SM "Export code" | ⌘K "Open exporter" (⌃⇧E); Settings "Export" door; ⌘⇧P "Open export settings" | exporter modal | Modal | SM | Close | ⌘⇧P "Open export settings" sends screen `export`, which is a **door**, not a screen, so it lands on whatever screen was last shown (A03-14) | — | `canvas/hooks/useCanvasCommandPalette.ts:259-265`, `sidebar/tabs/settings/SettingsTab.tsx:320-325`, `sidebar/tabs/settings/constants.ts:102` | P3 | CHANGE |
| View mode | SM Share › "Enter view mode" | — | URL `?view=readonly` | Same editor, read-only | Editor | "‹ Back to editing" leaves the *mode*, not the product | — | — | `shell/StudioHeader.tsx:508-516,762-763` | — | KEEP |
| Share preview link | SM Share › "Share preview link" | Dashboard site ⋯ More › "Share draft"; site "Sharing" tab | New tab `…/sites/<id>?share=1` | Dashboard `ShareDraftModal` | Site detail | Modal close leaves `?share=1` in the URL, so a refresh reopens it | — | Three entries, one flow; acceptable | `shell/SiteMenu.tsx:274-278`, `D/components/site-detail/site-header.tsx:39-42` | P3 | KEEP |
| Invite | SM Workspace › "Invite teammates" | Dashboard ⌘K "Invite Member"; home and getting-started | New tab `/dashboard/settings/team` | Team page (the modal is **not** opened) | Settings | — | The editor door and the palette's `?invite=true` both land on the page, and the modal stays closed (A03-11) | — | `D/app/dashboard/settings/team/page.tsx` has no search-param read | P3 | CHANGE |
| Collaboration (live) | SM Workspace › "Start collaboration" | ⌘⇧P `start-collab` | Both gated on `FEATURE_COLLAB` | Presence in the topbar | — | — | Flag-off; both doors are gated consistently (`useCanvasCommandPalette.ts:325`, `StudioHeader.tsx:846`) | — | — | — | KEEP (placement: A01-21) |
| Exit to dashboard | Topbar "‹ Exit" | — | `location.assign(/dashboard/projects)` with a dirty guard | Sites list | Sites | — | Skips the site-detail page the user may have come from; leaves a duplicate tab if the editor was opened in a new one (A03-5) | — | `shell/StudioHeader.tsx:504-506` | P2 | CHANGE |
| Element deep link | Layers ⋯ "Copy link" | — | `?el=&page=` | Editor with the element selected | — | — | Dropped by the login redirect (A03-15) | — | `panels/layers/hooks/useLayerContextActions.ts:28-41`, `shell/hooks/useDeepLink.ts` | P3 | CHANGE |
| Dashboard → editor | Site card hover "Edit" (new tab) | projects context menu (same tab); site header ⋯ More › "Edit in Editor" (new tab); header "Publish" (same tab); palette (same tab) | `/edit/<id>` | Editor | Site / Sites | Editor Exit → Sites | On site detail the primary "Edit" is buried in ⋯ More. Mixed new-tab and same-tab behaviour. VIEWERs are sent to a 404 (A03-5, A03-8). | — | see A03-5 | P2 | CHANGE |
| Site detail | Sites list "Manage" / row | Breadcrumb Dashboard › Sites › name; `SITE_DETAIL_TABS` (8) | `/dashboard/sites/<id>/*` | Tabbed page | Sites | Breadcrumb | The "Site not found" branch renders no breadcrumb and no link back (A03-16) | — | `D/app/dashboard/sites/[id]/layout.tsx:44-66` | P3 | CHANGE |
| Agency review/comment queues | Home attention queue → `/dashboard/agency/reviews` | ⌘K "moved" aliases | Agency tab | `ReviewQueue`, `CommentQueue` | Agency | Agency tabs | Rows carry no link to the site, editor, snapshot or pin (A03-7) | — | `S/services/dashboard.service.ts:429-432`, `D/components/comments/comment-queue.tsx:56-78` | P2 | CHANGE |
| Activity / Notifications pages | Home "View all" / bell "View all" | ⌘K "Notifications"; editor SM "Activity log" (anchor) | `/dashboard/activity`, `/dashboard/notifications` | Pages | Home | Browser back | Not in the sidebar by design, but reachable | — | `D/components/dashboard/shell/nav.ts:20-34` | — | KEEP |

---

## Findings

### P0 — IMMEDIATE FIX REQUIRED

**None.** No navigation door I found performs a permission bypass, a destructive action on the wrong object, or an unauthorised publish or delete.

The closest candidate is A03-1, but it fails closed: the server refuses with `FORBIDDEN`, and nothing leaks or is lost.

### P1

#### A03-1 · Review is advertised through five doors in every workspace, but only works when `agency_layer` is on (default off). Send fails with "Couldn't send — try again".
- **Severity:** P1. A dead end in a core flow: two of the new-user onboarding checklist steps lead into it.
- **Files:**
  - `packages/editor/src/editor/shell/SiteMenu.tsx:203`
  - `shell/StudioHeader.tsx:818`
  - `rail/tabsConfig.ts:233-247`
  - `shared/constants/onboardingSteps.ts:68-85`
  - `onboarding/OnboardingMount.tsx:224-226`
  - `shell/SendForReview.tsx:134-136,218-221`
  - `server/trpc/routers/reviews.ts:57-62`
  - `server/trpc/guards.ts:56-63`
  - `server/services/feature-flag.service.ts:12`
- **Symbols:** `SiteMenu.onOpenReview`, `DEFAULT_ONBOARDING_STEPS` (`connect-client`, `send-review`), `reviews.submit`, `requireAgencyLayer`.
- **Evidence:**
  - **The doors.** The site-menu "Review" row is passed whenever the editor is not in view mode (`StudioHeader.tsx:818`), with no check on `reviewStatus.reviewsEnabled`, which the header already holds. Bare key R and ⌘K "Open Review panel" come from `tabsConfig.ts:245` via `useSidebarKeyboard` and `CommandPalette.tsx:49-63`. Two onboarding steps, "Connect first client" and "Send for review", both use `actionKey: "open-review"`. Onboarding steps are not filtered by any flag (`useOnboardingOrchestrator.ts:150-164`).
  - **What the panel shows.** For a site with no round, ReviewTab renders "No review yet" and a live `SendForReview` (`ReviewTab.tsx:499-543`).
  - **What the server does.** `reviews.submit` calls `requireAgencyLayer`, which throws `FORBIDDEN "Agency layer is not enabled for this workspace"` (`reviews.ts:61`, `guards.ts:57-61`). A workspace with no `WorkspaceFeature` row is default-off (`feature-flag.service.ts:12`; `packages/shared/schemas/feature-flags.ts:6`).
  - **What the user sees.** `SendForReview` catches every error the same way and shows **"Couldn't send — try again."** That invites a retry that can never succeed.
  - **The comments list is caught too.** For the same user, the Comments toggle (C) works because `comments.*` is not gated. But ReviewTab's `!round` branch returns before any thread list renders, so pins have no list anywhere in the editor. The orphan-pin modal's "Open Review panel" (`canvas/comments/CommentLayer.tsx:579-585`) also lands on "No review yet".
  - **The dashboard gets this right.** The site header hides "Send for review" unless `features.agency_layer` is on (`D/components/site-detail/site-header.tsx:30-31,127-131`).
- **Expected behavior:**
  - In a non-agency workspace, the Review doors and the two onboarding steps are hidden.
  - Alternatively, the panel says "Client review is part of the Agency layer — turn it on in Settings" and links there.
  - Either way, a comments list is reachable without a round.
- **Root cause:** the server gate (IA v2 E1) was added after the editor doors existed. Only the dashboard adopted the flag.
- **Affected modules:** Review, Comments, Onboarding checklist, Command palette, Site menu.
- **Recommendation:**
  - Read `reviewsEnabled` (already fetched through `ReviewService`) and use it to gate the SM row, the ⌘K row, the R key and the onboarding steps.
  - Map `FORBIDDEN` to an explanatory state instead of "try again".
  - Decide where team comments are listed (A01-8).
- **Status:** VERIFIED (static; the full chain was read). NOT RUNTIME VERIFIED.

#### A03-2 · Sub-screen deep links are never cleared, so plain doors land on the wrong screen, and this survives reloads
- **Severity:** P1. Core menu entries reach the wrong destination, persistently.
- **Files:**
  - `packages/editor/src/editor/shell/hooks/useStudioState.ts:225-227,267-282,317-327`
  - `shell/StudioPanels.tsx:162`
  - `shell/AquibraStudio.tsx:509-515,554`
  - `sidebar/TabRouter.tsx:221,251`
  - `sidebar/tabs/history/HistoryTab.tsx:165-167`
  - `sidebar/tabs/settings/SettingsTab.tsx:320-325`
  - `sidebar/tabs/review/ReviewTab.tsx:342-347`
- **Symbols:** `openLeftPanelToTab`, `leftPanelSubTabs`, `onLeftPanelSubTabChange`.
- **Evidence:**
  - **The sub-tab is only ever overwritten, never cleared.** `openLeftPanelToTab(tab, subTab)` writes `leftPanelSubTabs[tab]` only when `subTab` is given (`useStudioState.ts:317-327`). Plain doors never clear it: SM "Version history" `openLeftPanelToTab("history")`, ⌃H, SM "Site settings", ⌃, and the `ui:switch-tab {settings}` event all omit it.
  - **The clearing callback is thrown away.** `StudioPanels` receives it and discards it as `onLeftPanelSubTabChange: _onLeftPanelSubTabChange` (`StudioPanels.tsx:162`). No tab ever reports that the user moved to another screen.
  - **The stale value survives reloads.** The map is persisted to `localStorage["buildrick-panel-state"]` (`useStudioState.ts:267-282`) and re-read on mount (`:225-227`).
  - **The consumers treat it as a live deep link:**
    - **History:** `HistoryTab` takes `initialView="published"` and "deep link wins for this mount" (`HistoryTab.tsx:166`). After one use of SM "Publish history", every "Version history" and ⌃H lands on the *Published* list.
    - **Settings:** `SettingsTab` navigates to `initialScreen` on mount, and `"plugins"` becomes `"integrations"` (`SettingsTab.tsx:321-323`). After one click on SM "Plugins", or ⌘⇧P "Open analytics settings", every later "Site settings" opens on Integrations or Analytics instead of Overview.
    - **Review:** `initialCompare` is true for every later mount after one ReviewBar "Compare" click (`TabRouter.tsx:251`). The `compareRequested` ref is per-mount (`ReviewTab.tsx:342-347`). So opening Review from the pill, the site menu or R starts Compare again, which runs `exportPublishPages` over the whole site each time.
- **Expected behavior:** a door with no sub-screen opens the tab's default screen. A deep link is consumed once.
- **Root cause:** the sub-tab chain was finished on the read side (the TabRouter comment at `:102-107` records that). The write-back half was never connected.
- **Affected modules:** History, Settings, Review/Compare, the Site menu, keyboard shortcuts, panel persistence.
- **Recommendation:**
  - Have `openLeftPanelToTab(tab)` with no `subTab` delete `leftPanelSubTabs[tab]`.
  - Or make sub-tabs one-shot, the way `settingsOpen` and `pagesOpen` already are (`StudioPanels.tsx:288-326`, cleared on leave).
  - Do not persist sub-tabs.
- **Status:** VERIFIED (static, every hop read). NOT RUNTIME VERIFIED.

### P2

#### A03-3 · The AI panel has two homes, chosen by which door is used
- **Files:**
  - `packages/editor/src/editor/shell/StudioPanels.tsx:334-356`
  - `shell/hooks/useEditorEventListeners.ts:143-160`
  - `sidebar/useSidebarKeyboard.ts:33-47`
  - `sidebar/TabRouter.tsx:155-156`
  - `shell/modals/CommandPalette.tsx:49-63`
  - `engine/commands/defaultCommands.ts:444-448`
  - `shell/hooks/useComposerInit.ts:443`
- **Evidence:**
  - **Doors that open the inspector column.** `ui:switch-tab {tab:"ai"}` is intercepted and sets `aiInInspector` (`StudioPanels.tsx:340-343`). This covers the inspector ✦ chip, ⌘J, the context menu's "Improve with AI", the palette's no-results "Ask AI", and ⌘K "Open AI assistant" (⌃⇧A, via `ui:toggle:ai`).
  - **Doors that open the left drawer.** `UI_PANEL_OPEN {panel:"ai"}` is allow-listed because `ai` is a registry tab. It goes through `openLeftPanelToTab("ai")`, and `TabRouter` renders `AITab` in the drawer. The same happens with bare key I through `safeTabChange("ai")`. Both are reachable through ⌘K "Open AI panel".
  - **The drawer home persists.** `leftPanelTab:"ai"` is saved, and `panelStateMigration.ts` keeps it, so the drawer home survives reloads.
- **Consequence:**
  - Two ⌘K rows ("Open AI panel", "Open AI assistant") open one feature in two places.
  - The drawer copy has no "‹ Inspector" way back.
  - The boards put AI in the inspector column (`StudioPanels.tsx:336-339`).
- **Recommendation:** route the `ai` id to `setAiInInspector` in the `UI_PANEL_OPEN` listener and in the sidebar-key path, and drop the duplicate ⌘K row. CHANGE.
- **Status:** VERIFIED (static).

#### A03-4 · Bare-letter panel shortcuts do nothing visible while the drawer is closed
- **Files:**
  - `packages/editor/src/editor/sidebar/LeftSidebar.tsx:443-452,522`
  - `sidebar/useSidebarKeyboard.ts:33-47`
  - `shell/StudioPanels.tsx:398-405,481-483`
- **Evidence:**
  - `useSidebarKeyboard` calls `safeTabChange` → `onTabChange` = `handleRailTabChange`, which only sets the tab. Its comment says it is "Tab-only… Drawer-toggle lives in LeftSidebar.handleBtnClick".
  - When the user has closed the drawer (active rail icon or panel ✕), pressing A, L, P, M, D, B, T, I, R, U, H or S changes an invisible tab.
  - S is a full-page tab and also needs `isLeftPanelOpen` (`fullPageMode={… && isLeftPanelOpen}`), so it shows nothing either.
  - ⇧A works only because `useEditorShortcuts.ts:129-133` handles it a second time through `openLeftPanelToTab`.
  - The ⌘K rows open the drawer, so the same shortcut printed in ⌘K behaves differently from the key.
- **Recommendation:** have the key path call `openLeftPanelToTab` (or open the drawer when it is closed), the same as the rail click. CHANGE.
- **Status:** VERIFIED (static). NOT RUNTIME VERIFIED.

#### A03-5 · Dashboard ↔ editor hand-offs have no consistent parent, and the primary "Edit" on site detail is buried
- **Files:**
  - `packages/dashboard/components/site-detail/site-header.tsx:100-160`
  - `D/app/dashboard/sites/[id]/layout.tsx:66-76`
  - `D/components/dashboard/site-card.tsx:61-69`
  - `D/components/sites/site-card-full.tsx:112`
  - `D/app/dashboard/projects/page.tsx:323-327`
  - `packages/editor/src/editor/shell/StudioHeader.tsx:504-506,518-525`
  - `shell/SiteMenu.tsx:117-119`
- **Evidence:**
  - **The primary Edit is hidden.** On `/dashboard/sites/<id>` the only "Edit in Editor" is inside the "⋯ More" menu (`site-header.tsx:138-160`). The visible buttons are View site, Send for review, Publish (DRAFT only; it routes to the editor) and Unpublish. A published site has no visible door into the editor at all.
  - **Tab behaviour is mixed:**
    - New tab: site cards, the full site card and ⋯ More (`target="_blank"`).
    - Same tab: the projects context menu, the dashboard ⌘K, the header "Publish", new-site creation and onboarding completion.
  - **Exit has one fixed target.** Editor "‹ Exit" always does `location.assign("/dashboard/projects")`. It skips the site-detail page that is the site's breadcrumb parent (`layout.tsx:57-63`). If the editor was opened in a new tab, Exit turns that tab into a second dashboard.
  - **Dashboard doors inside the editor disagree too.** Site-menu doors open a new tab (`openDashboard`), while notification clicks navigate the same tab (`navigateFromNotification`).
- **Expected behavior:**
  - One visible Edit primary on site detail.
  - One rule for new tab vs same tab.
  - Exit returns to the conceptual parent (the site, or wherever the user came from).
- **Recommendation:**
  - Promote "Edit" to a header button.
  - Pick same-tab everywhere, since the editor already has a dirty-exit guard.
  - Make Exit target `/dashboard/sites/<id>`, or `document.referrer` when it is same-origin.
- **Decision:** PRODUCT DECISION REQUIRED (the parent of the editor), then CHANGE.
- **Status:** VERIFIED (static).

#### A03-6 · Two editor modals can be reached only from the hidden ⌘⇧P palette
- **Files:**
  - `packages/editor/src/editor/canvas/hooks/useCanvasCommandPalette.ts:166-180`
  - `shell/hooks/useEditorEventListeners.ts:91-109`
  - `canvas/controls/KeyboardCheatSheet.tsx:92-94`
- **Evidence:**
  - `TEMPLATE_SAVE_REQUESTED` ("Save page as template") and `CMS_MANAGE_RECORDS` (`CMSRecordsModal`) are emitted only by the ⌘⇧P rows. A grep of `emit(EVENTS.TEMPLATE_SAVE_REQUESTED|CMS_MANAGE_RECORDS)` finds no other emitter.
  - ⌘⇧P has no visible control. Its only mention in the UI is one line of the `?` cheat sheet.
  - `ui-open-templates` and similar registry rows reach ⌘K, but these two are not registry commands, so ⌘K cannot reach them either.
- **Consequence:**
  - Saving a user template has no discoverable door. `tabs/templates/*.tsx` has no Save-as-template control, and a grep there finds no "My templates" view either. Where saved templates are listed was NOT VERIFIED.
  - `CMSRecordsModal` is a second records UI competing with ContentTab's inline records view, hidden behind a chord.
- **Recommendation:**
  - Add "Save page as template…" to the Templates panel, or to the Pages row menu.
  - Delete `CMSRecordsModal` or give it a ContentTab door.
  - Merge ⌘⇧P into ⌘K (A01-14).
- **Decision:** CHANGE.
- **Status:** VERIFIED (static).

#### A03-7 · Comment and review queues are dead ends: nothing links to the site, the snapshot or the pin
- **Files:**
  - `server/services/dashboard.service.ts:429-432`
  - `packages/dashboard/components/comments/comment-queue.tsx:56-78`
  - `D/components/reviews/review-queue.tsx:91-160`
  - `packages/editor/src/editor/shell/hooks/useDeepLink.ts:29-35`
- **Evidence:**
  - The home attention queue sends "open comments" and "edits need review" to `/dashboard/agency/reviews`.
  - There, comment rows are plain `<div>`s with body, site name and time. They have no link.
  - Review rows offer **Approve / Request changes** with no link to the site, the editor or the submitted snapshot. The approver decides without being able to open what they approve.
  - The editor deep link supports only `?el=&page=`. There is no `?comment=` or `?panel=review`, so the dashboard could not link to a specific thread even if it tried.
- **Recommendation:**
  - Link each comment to `/edit/<siteId>?page=…&comment=<id>` (a new param that opens Review on the thread), and each review to the snapshot or Compare.
  - At minimum, link both to the site.
- **Decision:** CHANGE.
- **Status:** VERIFIED (static).

#### A03-8 · VIEWERs are shown "Edit" everywhere and land on a generic 404
- **Files:**
  - `packages/dashboard/app/edit/[siteId]/page.tsx:17-22`
  - `server/services/sites.service.ts:795-810`
  - `D/app/not-found.tsx:21-28`
  - The Edit doors listed in A03-5
- **Evidence:**
  - `userCanEditSite` requires EDITOR, and a failure calls `notFound()`. The 404 says "Page Not Found… doesn't exist or has been moved".
  - No dashboard Edit door reads the member's role. The site cards, the header ⋯ More and the ⌘K "Open in editor" results all render unconditionally.
  - The editor already has a read-only view mode (`?view=readonly`, `Composer.readOnly`), but the route gate rejects VIEWERs before it can apply.
- **Consequence:** a correct denial is presented as a missing page. There is no path for a VIEWER to see the draft other than a share link.
- **Recommendation:**
  - Hide or relabel Edit as "View" for VIEWERs, and route them to `?view=readonly` (with a server-side read-only gate).
  - Or show an access-denied page that says why.
- **Decision:** PRODUCT DECISION REQUIRED (whether viewers get read-only editor access).
- **Status:** VERIFIED (static).

### P3

- **A03-9 · Closing Settings always lands in the Add drawer.**
  - `handleFullPageClose` calls `onLeftPanelTabChange("add")` for every full page except the media library (`shell/StudioPanels.tsx:411-420`). Its comment says "Return to last panel tab".
  - Opening Settings from Pages (Add redirect), from Brand or from the site menu and pressing "‹ Back to canvas" therefore opens Add, not the previous context.
  - The Settings portal also covers the topbar (`tw:fixed tw:inset-0`, `FullPageRouter.tsx:107-109`). If the tab is closed while Settings is open, the persisted `leftPanelTab:"settings"` reopens the editor directly into full-screen Settings (`useStudioState.ts:225,232`).
  - **Recommendation:** remember the previous tab and do not persist full-page tabs. CHANGE. VERIFIED (static).
- **A03-10 · An Issues row looks clickable but only closes the panel.**
  - `onSelectElement={() => setIssuesOpen(false)}` (`shell/AquibraStudio.tsx:624-630`) is bound to an `interactive` Row (`shell/IssuesPanel.tsx:265-269`).
  - Issues are DS-lint issues whose natural destination is the token in Brand. An "Open Brand" door already exists (`:640-643`).
  - **Recommendation:** route the row to Brand › token, or make it non-interactive. CHANGE. VERIFIED.
- **A03-11 · Invite and AI deep-link params are ignored.**
  - Dashboard ⌘K "Invite Member" uses `/dashboard/settings/team?invite=true`, but the team page never reads search params. The editor's "Invite teammates" lands on the same page with the modal closed.
  - ⌘K "Generate with AI" uses `/dashboard/sites/new?ai=true`, but the page reads only `?method=ai` (`D/app/dashboard/sites/new/initial-view.ts:15-17`), so it opens the chooser.
  - Contrast: `?share=1` does auto-open its modal.
  - **Recommendation:** honour `?invite=1` and fix the AI href. CHANGE. VERIFIED.
- **A03-12 · ⌘K duplicates within itself.**
  - Undo appears twice: "Undo" (`:71`) and "Undo last action" (`:143`), with the same chord and handler.
  - Templates appears twice: nav "Open Templates panel" and registry "Open templates". The label dedup is exact-lowercase (`:209-213`), so near-duplicates pass.
  - AI appears twice with two destinations (A03-3).
  - This extends A01-14. CHANGE. VERIFIED.
- **A03-13 · The rail shows no current location for off-rail panels.**
  - The Figma rail highlights only its 6 ids. Components, Templates, History, Review, Publish and the drawer copy of AI leave every rail icon inactive, so the panel header is the only "you are here".
  - Acceptable for secondary panels. Watch it if more panels move off-rail. KEEP. VERIFIED.
- **A03-14 · ⌘⇧P "Open export settings" targets a door, not a screen.**
  - The `screen:"export"` id is a `kind:"door"` (`tabs/settings/constants.ts:102`), and `SettingsTab` ignores ids that match no screen (`:320-325`). The user lands on the previous or default screen.
  - With A03-2, the id also sticks.
  - **Recommendation:** point the row at the exporter (`UI_TOGGLE_EXPORTER`). CHANGE. VERIFIED.
- **A03-15 · The login redirect drops the editor query.**
  - `redirect("/auth/login?next=/edit/<id>")` (`D/app/edit/[siteId]/page.tsx:18`) discards `?el=&page=` (Layers "Copy link") and `?view=readonly`.
  - A copied element link opened by a signed-out teammate loses its target.
  - CHANGE. VERIFIED (static).
- **A03-16 · The site-detail "Site not found" state is a dead end, and "Sites" lives at `/projects`.**
  - The not-found branch renders no breadcrumb and no link (`D/app/dashboard/sites/[id]/layout.tsx:44-55`).
  - The nav label and breadcrumb say "Sites", but the URL is `/dashboard/projects` (`nav.ts:26-29`), so a user who reads the URL learns a second name.
  - CHANGE (the link), KEEP (the URL, which is already documented). VERIFIED.
- **A03-17 · Leftover "Insert" vocabulary in doors.**
  - The Layers empty state link reads "Open Insert" (`panels/layers/components/LayersEmptyState.tsx:32`), but the destination is labelled "Add".
  - The same drift is behind the failing ⌘K tests (above) and A01-15.
  - CHANGE (copy, → C). VERIFIED.

---

## Good as-is (verified)

- **One production rail.** The e3 and legacy escape hatches are compiled out of production behaviour (`editorViewMode.ts:67-72`).
- **The tab registry decides what is a tab.** `UI_PANEL_OPEN` and panel-state migration both derive from `GROUPED_TABS_CONFIG` (`useEditorEventListeners.ts:143-146`, `panelStateMigration.ts:11`). Earlier hand-written lists had dropped Publish, Review, CMS and AI.
- **The site menu is a coherent global surface.**
  - It has named groups (Site / Build / Share / Workspace).
  - It uses one name per destination ("Brand" in both the rail and the menu).
  - It prints chords that actually reach the page (⌃H and ⌃, instead of the browser-eaten ⌘H and ⌘,).
  - It withholds build doors in view mode.
- **Exit and view-mode semantics.** "‹ Exit" passes through a dirty/offline/stranded guard. In view mode the leftmost control leaves the *mode* ("‹ Back to editing"), not the product (`StudioHeader.tsx:393-506,762-763`).
- **The Review door does not depend on review state.** The pill vanishes when there is no round, but the site-menu row keeps the panel reachable (`SiteMenu.tsx:45-55`). This is correct, apart from the flag issue in A03-1.
- **A blocked Publish is shown disabled with its reason, never hidden**, including when the flag is off.
- **Collaboration doors.** Both entries are gated on the same flag, so there is no stray second door.
- **Full Media closes back to the Assets drawer, not somewhere else.**
- **Context menu v3 doors.** Replace with block, Improve with AI, Bind to CMS, Add interaction, Save as component and Reveal in layers each route to the existing surface, not a copy of it.
- **Dashboard shell.** One nav SSOT (`nav.ts`) feeds the sidebar and the palette. The site-detail breadcrumb is Dashboard › Sites › name. The palette carries "moved →" aliases for IA v2 relocations.
- **Two help sheets, split on purpose.** `?` covers canvas gestures and ⌘/ covers app chords. The split is documented and the double-open bug is fixed (`useEditorShortcuts.ts:33-41`).

## Product decisions required

1. **Review in non-agency workspaces:** hide the entries, or show an upsell/explainer state (A03-1). This goes together with A01-8, where team comments should be listed.
2. **The editor's parent,** and new tab vs same tab for every dashboard ↔ editor hand-off (A03-5).
3. **VIEWER access to the editor:** read-only view, or no access with an explanation (A03-8).
4. **Whether ⌘⇧P survives at all** (A03-6, A01-14).

## Overlaps with other audits (observed, not audited here)

- **A01:** A01-14 (two palettes) is extended by A03-6 and A03-12. A01-8 (comments owned by Review) has its navigation consequence in A03-1. A01-4 (two settings workspaces) raises the stakes of A03-2.
- **Prompt 4 (surfaces):** the Settings full-page portal hides the topbar, including Exit and Publish. The Issues panel is an absolutely positioned div outside `LayoutShell`, so check whether it collides with the AI-in-inspector column. The AI drawer vs inspector split (A03-3) is also a surface-classification issue.
- **Prompt 5 (search):** the dashboard palette's "Pages" scope lists every site as "<site> — Pages", unfiltered by the query, and opens the editor, not a page (`D/components/search/command-palette.tsx:272-287`).
- **C (UX / signifiers):** A03-10 (a clickable row with no destination) and A03-17 (Insert vs Add). ⌘K has no visible trigger.
- **D (collaboration):** client comments and approvals through `/review/<token>` create no in-app notification. `createClientComment` and `resolveReviewByToken` call no notifier (`S/services/client-review.service.ts` imports only prisma and crypto). The only signal is the attention-queue count and the editor pill. I did not verify email coverage for these events.
- **G (verification):** the 3 failing `CommandPalette.test.tsx` cases are label and count drift. None of the A03-2 flows (sticky sub-tab) has a test that walks "deep link, then plain door".

---

## AUDIT HANDOFF

- **Agent / Prompt:** B, Product Architecture / Prompt 3: Navigation and Discoverability
- **Report:** `docs/audits/2026-09-25-full-audit/03-navigation-discoverability.md`
- **Counts:** P0 = 0 · P1 = 2 · P2 = 6 · P3 = 9
- **P0:** none.
- **P1:**
  - A03-1: Review doors (site menu, R, ⌘K, 2 onboarding steps) are shown to every workspace. `reviews.submit` is `agency_layer`-gated (default off), so Send fails as "try again".
  - A03-2: sub-screen deep links are never cleared and are persisted. "Version history" opens Published; "Site settings" opens Integrations or Analytics; Review re-runs Compare on every visit.
- **P2:**
  - A03-3: AI has two homes.
  - A03-4: letter shortcuts are silent while the drawer is closed.
  - A03-5: inconsistent dashboard ↔ editor hand-offs and a buried Edit.
  - A03-6: Save-as-template and CMS records can be reached only from ⌘⇧P.
  - A03-7: comment and review queues are dead ends.
  - A03-8: VIEWER Edit → generic 404.
- **Runtime verified:** none. The unit run of 11 navigation test files gave 148 passes and 3 failures, all in `CommandPalette.test.tsx`, all label and count drift.
- **NOT RUNTIME VERIFIED:**
  - every door in the table, since no browser was run;
  - the A03-1 FORBIDDEN path against a real workspace;
  - the A03-2 persistence across reloads;
  - the production values of `NEXT_PUBLIC_FEATURE_PUBLISH` / `_COLLAB`;
  - email coverage for client comments and approvals.
- **Dependencies:**
  - A03-1 needs the A01-8 decision (where comments are listed).
  - A03-5 and A03-8 share one product decision (the editor's parent and viewer access).
  - A03-6 and A03-12 should land with the A01-14 palette merge.
  - A03-2, A03-3, A03-4 and A03-9 all sit in `useStudioState` / `StudioPanels` panel routing, so they form one fix batch.
- **Inventory corrections:**
  - `?rail=` is dev-only.
  - AI has two homes (drawer and inspector), not one.
  - ⌘K contains internal duplicates.
- **Suggested next owners:**
  - **G:** a regression test for "deep link, then plain door" (A03-2), and an agency-off Review walk (A03-1).
  - **C:** A03-10 and A03-17 copy.
  - **Orchestrator:** batch A03-2, A03-3, A03-4 and A03-9 as "editor panel routing".
