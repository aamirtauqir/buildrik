# Editor ↔ Figma Product-Design Coverage Audit — 2026-07-25

**Mandate:** editor codebase = functional SSOT · Figma `g4GzQFqzNYz5sosz1QtZXC` ("Buildrick — Product") = visual/UX SSOT. Audit every editor surface against the design; list gaps both directions; produce phased convergence plan.

**Ground truth fetched live this session:** Figma pages 0:1 Foundations · 1:3 Editor (239 boards) · 1:4 Site (46) · 1:5 Portfolio (27) · plus Client review / Components / Dashboard spine / Archive (verified 2026-07-22 audit). Code inventory: 3 exhaustive sweeps over `src/editor/`, `src/services/`, `src/shared/`.

> **Correction of record:** 2026-07-24 memories/docs claimed this file is "Foundations-only, no screens". FALSE — page-list tool trap (only page 0:1 listed; direct node fetch shows all pages). Trap now recorded as `feedback_figma_page_list_unreliable`. Node `32-2` = "Inspector — 300 · CONTAINER profile" board **on the Editor page**, not a Foundations node.

---

## 0. Executive summary

The Figma file is a near-complete, state-exhaustive product design — 239 editor boards covering 12 shell states, all six target rail panels with per-state boards, S1–S6 job flows, inspector profiles, and modals. The editor codebase implements most of it. The real deltas:

1. **IA divergence (the big one):** shipped rail = `Add · Assets · Components · Layers · Pages` (+ bottom Design/Settings/Publish/History); Figma target rail = `Insert · Layers · Pages · Media · Content · Brand`. Known as "M5 rail convergence" since 07-22; still unshipped.
2. **Code-behind-design:** ~10 designed features/states not implemented (comment mode, review workflow buttons that are currently no-ops, issues auto-fix states, orphan-comment recovery, CmdK AI-offer, notifications jump-target-deleted, webhooks screens, post-approval S5.6 banners).
3. **Code-ahead-of-design:** a handful of shipped surfaces have no boards (AnimationEditor, MilestoneSuggestionBanner, AchievementPrompt, MigrationProgressModal, PageTabBar micro-states, ProjectSettingsModal) — small, mostly minor chrome.
4. **Editor craft debt independent of Figma:** two modal substrates with z-index chaos, dead code (WelcomeModal/SpotlightOverlay/ElementsTab/ConnectionQualityIndicator), fake presence avatars in prod, "coming soon" stub tab, duplicated media surfaces.
5. **Token layer: DONE.** 82 conformance tests green; single intentional deviation (warning #B45309 vs Figma #D97706, WCAG keep, locked in `A11Y_KEEPS`).

---

## 1. Figma-side inventory (fetched live)

### Foundations (page 0:1, frame 67:2) — live variables confirmed via variable defs
- Colour: 5 surfaces · 4 ink (#0F172A/#485465/#656F7E/#CBD5E1) · 4 borders (incl. border-input #8D949C) · semantic fill/text/tint ×3 · accent ×3 with Editor/Dashboard package modes (#406ED6/#3C68C9/#ECF0FB).
- Type: 11 styles (Inter ui/11–24, Geist Mono data/11–13).
- Spacing 2–64 · radius sm/md/lg/full · **size tokens: rail 60 · drawer 320 · inspector 300 · panel-right 360 · topbar 56 · header 44 · footer 32 · nav 240 · row 32/28/64.**

### Editor page (1:3) — 239 boards, grouped
| Cluster | Boards | Node anchors |
|---|---|---|
| Shell states 1–12 (First run, Returning, Element selected, Multi-select, Drawer closed, Comment mode, Preview, Review active, AI agent run, Offline, Saving→conflict, Loading) | 12 | 65:2…66:640, 199:2…200:213 |
| S1 ASSEMBLED master + 1280 pin-released + stress (40 pages/depth-5/62-char) + keyboard (F6 cycle) + empty-states-all-11 + permissions (DESIGNER 59:2, VIEWER 396:3777) | 7 | 52:2, 202:2, 55:2, 58:2, 57:2 |
| Panels: Insert ×7 · Pages ×7 · Layers ×8 · Media ×9 + drill-ins ×5 · Content ×9 · Brand ×14 · Review ×11 | 70 | 137:2…158:213 |
| Inspector: profiles (CONTAINER 32:2 + six missing 71:2) + states ×11 (single/no-selection/loading/multi/instance/bound-to-CMS/breakpoint-override/pseudo-state/reach-all-like-this/ai-agent-run/reach-whole-site) | 13 | 159:2…160:512, 189:2 |
| Versions ×7 · Compare ×8 · Issues ×5 · Notifications ×5 · CmdK ×6 | 31 | 162:2…169:92 |
| AI panel ×11 (idle→done, error-quota, not-configured) | 11 | 170:2…171:136 |
| Modals: instance sheets (46:2, 70:2) + lifecycle (open/dirty/submitting/error/success 183:2) + Rollback ×4 + Orphan comments ×3 + Brand sub-screens/chrome modals (74:2) | ~15 | |
| Flows: S1.1–S1.5 (boot/crash/new-page/checklist/session) ×18 · S2 AI ×11 · S3 build ×17 · S4 brand ×12 · S5 review ×21 · S6 publish ×5 · C6 recovery | ~85 | 294:1976…309:2234, 128:2…133:630 |
| Device frames + zoom §5.5 | 1 | 96:6 |

### Site page (1:4) — 46 boards
Site shell (22:2) · Domains ×6 (none→ssl-provisioning) · Export ×8 (idle→failed, ai-site-warning, empty) · Integrations ×5 · **Webhooks ×12** (Shape1 empty→saved-not-published, Shape2 never-fired→disconnect-confirm) · S6.4–S6.8 settings screens (SEO/Analytics/Custom-code/Redirects/Headers/Localization/Forms ×5/Publish history/General saved+dirty).

### Portfolio page (1:5) — 27 boards
Portfolio shell · Sites grid ×7 · BrandPush ×10 (pick→undone incl. blast-radius, partial-failure) · Handover ×4 · SharedLibrary ×5.

---

## 2. Coverage matrix — editor feature → Figma design

Legend: ✅ designed+implemented · 🟦 designed, code missing/partial (code-behind) · 🟧 implemented, no board (design-behind) · ⚠️ divergent (both exist, different shape) · 🗑 deliberate retirement (design dissolves the code surface).

### 2.1 Shell chrome
| Editor feature (code) | Code path | Figma | Status |
|---|---|---|---|
| Shell layout (rail 60/drawer 320/inspector 300/topbar 56/footer 32) | `LayoutShell.tsx`, size tokens | Foundations size tokens + S1 ASSEMBLED 52:2 | ✅ (sizes shipped `190bb69d`) |
| Rail — 5 items, 2 groups (figma mode) | `tabsConfig.ts`, `LeftSidebar.tsx` | Rail = Insert·Layers·Pages·Media·Content·Brand | ⚠️ **M5 convergence: Add→Insert naming ok; Components on rail (target: inside Brand); Media label; Content+Brand missing from rail; Design/Publish/History/Settings bottom-section vs topbar-escape** |
| Topbar (save state, review pill, publish, bell, ⋯ menu, AI, preview, offline chip, issues pill) | `Topbar.tsx` 689L | S1 ASSEMBLED + shell states 8–11 + REVIEW_PILL states | ✅ |
| Page tabs above canvas (dirty dot, home, context menu, inline rename+validation) | `PageTabBar.tsx` 529L | Visible in ASSEMBLED; no per-state boards (rename/menu) | 🟧 minor |
| Status bar (breadcrumb, device dims, zoom stepper 25–200, sync dot, version) | `StudioFooter.tsx` | ASSEMBLED footer + Device frames board 96:6 | ✅ |
| Shell loading skeleton | `StudioSkeleton` | Shell state 12 · Loading | ✅ |
| Crash boundary + reload | `StudioErrorBoundary` | S1.2 crash-recovery, load-error | ✅ |
| Recovery banner | `RecoveryBanner.tsx` | C6 · Recovery banner 307:2223 | ✅ |
| Load error (auth/network) | `LoadErrorBanner.tsx` | S1.5 session-expired/network-error/retrying | ✅ |
| Save conflict modal (2-stage overwrite) | `ConflictModal.tsx` | Shell state 11 · Saving → conflict | ✅ |
| Offline mode | online/offline listeners + chip | Shell state 10 · Offline | ✅ |
| Preview | new-window sanitized HTML | Shell state 7 · Preview (in-shell state) | ⚠️ code opens popup; design draws in-shell preview state |
| **Comment mode on canvas** | **none found (pending part-2 confirm)** | Shell state 6 · Comment mode 200:2 | 🟦 |
| Multi-select shell | canvas + inspector multi | Shell state 4 | ✅ |
| First-run / onboarding coach | OnboardingChecklist (S1.4 0/7→dismissed all match) | Shell state 1 + S1.4 ×5 | ✅ checklist / 🟦 WelcomeModal+Spotlight designed-adjacent, code exports dead |
| Keyboard model (F6 region cycle, shortcuts) | `useSidebarKeyboard`, roving focus | S1-keyboard 58:2 + legend | ✅ (F6 cycle: verify in part-2) |
| Permissions (what DESIGNER/VIEWER cannot do) | flags `clientView`; no per-role gating in editor UI | Permissions boards 59:2, 396:3777 | 🟦 role-gated chrome not systematically implemented |
| 1280 narrow (pin auto-release) | drawer overlay mode | 202:2 | ✅ |

### 2.2 Panels (drawer)
| Panel | Code | Figma boards | Status |
|---|---|---|---|
| Insert/Build | `BuildTab.tsx` + catalog 501L (accordions, search, drag, tips) | Insert ×7 | ✅ (disabled-item state: verify) |
| Pages | `PagesTab.tsx` (tree, folders, bulk, listings view, settings drawer) | Pages ×7 incl. listings | ✅ |
| Layers | `LayersPanel` 462L (search, drag w/ invalid-drop alerts, hidden/locked, display settings, breadcrumb) | Layers ×8 | ✅ |
| Media | `MediaTab` 3-mode + stock + quota + versions | Media ×9 + drill-ins ×5 | ✅ |
| Content | `ContentTab.tsx` 143L — source list + empty; records/fields live in modals | Content ×9 (root/empty/collection/record/unsaved-record/fields/data-sources/variables/conditions) | 🟦 **panel is a stub vs design: no in-panel collection/record/fields/variables/conditions views** |
| Brand/Design | `DesignSystemTab.tsx` 798L (Tokens/Styles/Components/Export, starters, lint, dirty, AI) | Brand ×14 | ✅ mostly; ⚠️ naming Design→Brand; classes/typography/colour-mode sub-views partial |
| Review | `ReviewTab.tsx` 432L | Review ×11 + S5.1–S5.3, S5.6 | ✅ panel; 🟦 S5.6 post-approval banners |
| Publish (sidebar tab) | `PublishTab.tsx` 629L (checklist ×7, history) | S6.1 ×5 + Site·Publish history | ✅ |
| History/Versions | `HistoryTab` + `VersionHistoryPanel` + TimeTravel | Versions ×7 | ✅ |
| AI | `AITab.tsx` chat+agent (stream, accept/reject, plan, gates) | AI ×11 + S2.x | ✅ core; 🟦 error-quota + not-configured boards vs code states (verify) |
| Templates | `TemplatesTab.tsx` 555L + 5 modals + apply overlay + usage drawer | **No Templates panel boards — design dissolves into S1.3 new-page + Insert** | 🗑 founder-ratified retirement pending (three-way audit §2) |
| Components | `ComponentsTab` 475L / V2 flag | No standalone rail panel; Brand · components sub-view | ⚠️ target home = Brand panel |
| Settings (fullpage) | `SettingsTab.tsx` 921L — 12 sections + 3 workspace deep-links | Site page S6.4–S6.8 + Integrations ×5 + Export ×8 + Domains ×6 | ✅ structure; 🟦 **Webhooks ×12 designed, zero code**; Domains = dashboard deep-link vs designed in-editor screens |

### 2.3 Modals & overlays
| Code modal | Figma | Status |
|---|---|---|
| Modal substrate (380/460/560) | Modal instances 46:2 (3 widths · 5 states) + lifecycle 183:2 | ✅ spec exists; code has 2 substrates (see §4) |
| Rollback confirm + flow | Rollback ×4 boards | ✅ |
| CMS setup wizard, records | S3.12b + Content boards | ✅-ish (placement divergence: modal vs panel) |
| Ecommerce collection setup | S3.13 ×3 | ✅ |
| Image editor / icon picker / stock | S3.6 ×2, drill-ins | ✅ |
| Export modal (format grid, tabs) | Site · Export ×8 | ⚠️ placement: code=editor modal, design=Site fullpage |
| Upgrade modal / pro gates | Brand·pro-locked, Integrations·pro-locked | ✅-ish; generic UpgradeModal board unverified |
| Orphan comments detected/reattach/dismissed | 184:56…184:87 | 🟦 no code |
| KeyboardShortcutsPanel | Keyboard legend 58:215 | ✅ |
| ProjectSettingsModal, TemplatesTab modal family, MigrationProgressModal, StarterGallery | 74:2 partial | 🟧 some unboarded (minor) |

### 2.4 Cross-surface features
| Feature | Code | Figma | Status |
|---|---|---|---|
| CmdK | shell CommandPalette 556L (recents, groups) | CmdK ×6 (incl. ai-offer, disabled-command, no-results) | 🟦 ai-offer + disabled-command states missing in code |
| Issues | IssuesPanel (All/Errors/Warnings) | Issues ×5 (incl. **fixing, fix-failed**) | 🟦 auto-fix affordance not in code |
| Notifications | NotificationBell (5 states) | Notifications ×5 | 🟦 jump-target-deleted missing |
| Review workflow actions | PublishDropdown Submit-for-Review/Approve/Request-Changes/Unpublish = **no-ops** | S5 flow ×21 fully designed | 🟦 **worst UX-lie in shipped editor** |
| Compare (approved vs current) | ApprovedCompareView + CompareView | Compare ×8 | ✅ |
| Collaboration | presence avatars only; MOCK_USERS fallback; no cursors | not drawn (deliberate — collab demo-only, memory: DO NOT ship) | 🗑/🟧 hide in prod |
| Animation editor (25 presets) | `AnimationEditor` 209L | **no board** | 🟧 needs design before further work |
| Achievement prompt, milestone banner | code | no boards | 🟧 minor |

---

## 3. Findings ledger (severity-ranked)

### Critical
| # | Finding | Evidence |
|---|---|---|
| F1 | **PublishDropdown renders 4 live-looking menu items that are silent no-ops** (Submit for Review, Approve, Request Changes, Unpublish) while the S5 review flow is fully designed (21 boards) and ReviewTab actually works via topbar Send-for-review. Two publish UIs disagree about what exists. | `PublishDropdown.tsx` "Phase 7 work, currently no-ops"; Figma 128:2…133:630 |
| F2 | **Fake presence in production:** `MOCK_USERS` ("You", "Ana") render whenever collab is disconnected — i.e. always, for real users when flag on. | `PresenceIndicators.tsx` demo fallback |
| F3 | **Rail IA divergence** — shipped 5-item rail vs designed 6-item rail (Content+Brand on rail; Components folded into Brand). Every S1–S6 board draws the target rail; every user sees the old one. | `tabsConfig.ts` vs 52:2 |

### Major
| # | Finding | Evidence |
|---|---|---|
| F4 | Comment mode (shell state 6) designed, absent from code (pending part-2 confirm — no comment-pin surface found in shell/panels/modals sweep). | 200:2 |
| F5 | ContentTab is a 143-line stub vs 9 designed boards (collection/record/fields/variables/conditions in-panel views). CMS editing lives in two modals instead. | `ContentTab.tsx` vs 148:2…151:87 |
| F6 | Webhooks: 12 boards designed (Site page), zero code. | 176:2…176:727 |
| F7 | Templates triple-surface still shipped (drawer tab + library modal + section inserts) while design dissolves it into S1.3 + Insert. Founder decision recorded 07-22, unexecuted. | three-way audit §2 |
| F8 | Two modal substrates: Radix `Modal` + ≥8 hand-rolled fixed overlays (z-index 200 / 9999 / 10000 / 2147483646), only ConflictModal documents why. No shared focus trap on hand-rolled ones. | part-3 sweep §cross-cutting |
| F9 | Role-gated chrome (Permissions boards: what DESIGNER/VIEWER cannot do) not systematically implemented — editor shows same chrome to all roles except `clientView` flag. | 59:2, 396:3777 |
| F10 | S5.6 post-approval states (approved-clean / approved-edited-since / re-sent) designed, not implemented as topbar/panel banners beyond REVIEW_PILL map. | 131:2…131:415 |
| F11 | Dead code shipping: WelcomeModal + SpotlightOverlay (exported, never mounted, orchestrator comment lies), ElementsTab (unrouted), ConnectionQualityIndicator (unmounted). | part-1/3 sweeps |

### Minor
| # | Finding |
|---|---|
| F12 | CmdK missing designed states: ai-offer, disabled-command, no-results. |
| F13 | Issues panel missing fixing / fix-failed states (auto-fix affordance). |
| F14 | NotificationBell missing jump-target-deleted state. |
| F15 | Orphan-comment recovery flow (3 boards) missing. |
| F16 | Stock "not configured" banner dead (`IS_STOCK_CONFIGURED=true` hardcoded); users get generic empty instead of actionable message. |
| F17 | MediaLibraryPanel (legacy modal, has "From URL — coming soon" stub) duplicates MediaTab; two parallel media surfaces. |
| F18 | Radix modal head CSS gap: `.bd-modal__head` padding/border never renders (documented in Modal.tsx). |
| F19 | Topbar dead props (device/zoom/undo/redo handlers no longer rendered). |
| F20 | Preview: code = popup window; design = in-shell preview state (shell state 7). |
| F21 | Editor surfaces with no boards: AnimationEditor, AchievementPrompt, MilestoneSuggestionBanner, MigrationProgressModal, PageTabBar rename/context-menu states, ProjectSettingsModal — design these in Figma before further work on them (per mandate). |

### Intentional deviations (keep, do not "fix")
- warning #B45309 (code) vs #D97706 (Figma) — WCAG AA keep, locked in `A11Y_KEEPS` conformance test. Figma should adopt code value; until then deviation stays declared.
- Inter Tight (code) vs Inter (Figma) — founder kept Inter Tight (FINDING-003).
- Collaboration multiplayer — demo-only by decision (6 P1 OT bugs); do not design/build further until Yjs arc.
- Dashboard/auth/onboarding screens deliberately code-canonical (not re-specified in Figma) — do not demand boards for them.

*(Inspector + canvas detail pending part-2 sweep — section appended below when complete.)*

---

## 2.5 Inspector + canvas coverage (part-2 sweep)

| Editor feature | Code | Figma | Status |
|---|---|---|---|
| Inspector shell (This▾/Desktop▾/Base▾ pills, flat scroll, 18-section registry, 7 element profiles) | `ProInspector.tsx` + `registry/` + `elementProfiles.ts` | 32:2 CONTAINER profile + 71:2 six missing profiles | ✅ (shipped `4cd71517`/`c2a89f5d`) |
| Inspector states: no-selection / multi-select / instance (variants+detach) / bound-to-CMS / breakpoint-override / pseudo-state / reach-all-like-this | InspectorEmptyState, MultiSelectToolbar+BatchStylePanel, VariantSection, BindingPopover, BreakpointPill dot, StateDropdown dots, ScopeDropdown blast-radius confirm | 159:2…160:412 | ✅ |
| Inspector · loading | none | 159:102 | 🟦 minor |
| Inspector · ai-agent-run | none | 160:512 | 🟦 |
| Inspector · reach-whole-site | ScopeDropdown option is an inert label | 189:2 | 🟦 wire or demote to label in design |
| All CSS section | registered in all 7 profiles but `devMode` hardcoded `false` → can never render | — | 🟧 dead path; delete or flag-gate |
| Canvas selection/resize/rotate, locked & CMS badges, size pill | SelectionBoxOverlay/SelectionHandles | S3.1 + shell state 3/4 | ✅ |
| Hover 3-level model (minimal/Alt hierarchy/Alt+Shift boxmodel), clone badge | ElementHoverOverlay | S3.1 boards | ✅ |
| Drop feedback (lines, slots, invalid reasons ×9, breadcrumb, depth badge, SR announce) | DropFeedbackOverlay + dropValidation | Insert·dragging, Layers·invalid-drop | ✅ |
| Marquee, click-through cycling, triple-click deep select | useCanvasMarquee/useSelectionBehavior | Shell state 4 | ✅ |
| Inline edit + RichTextEditor toolbar | useCanvasInlineEdit + RichTextEditor | S3.1·inline-edit | ✅ |
| Context menu (4 submenus + standalone, kbd nav, frozen-at-open) | ElementContextMenu | — (no per-state boards) | 🟧 minor |
| Floating toolbars (UnifiedSelectionToolbar, AlignmentToolbar, MediaQuickActions, SmartSuggestions, QuickAddBar) | controls/ | partially in S3 boards | ✅-ish |
| AI inline edit popover | AiPromptPopover (input→loading→diff→error) | S2.5 chat·reject + AI boards | ✅ |
| Rulers/guides/smart-guides/grid/x-ray/badges/spacing toggles | CanvasFooterToolbar + overlays | Device frames + zoom 96:6 | ✅ |
| Device frames (bezel), zoom presets, fit | DeviceFramePreview, ZOOM_PRESETS | 96:6 | ✅ |
| Empty canvas CTA | CanvasEmptyCTA | Empty states board 57:2 | ✅ |
| Section reorder handles | useSectionReorder | — | 🟧 minor |
| Remote cursors (collab) | RemoteCursorsOverlay (exists, flag-gated) | not drawn (collab frozen) | 🗑 leave |
| **F6 region cycle** (keyboard region navigation) | **absent** — full shortcut sweep has no F6 | S1-keyboard 58:2 | 🟦 a11y gap |
| Keyboard model (60+ shortcuts, cheat sheet, palette) | defaultCommands + hooks + KeyboardCheatSheet | S1-keyboard + legend | ✅ |
| Comment mode on canvas | **confirmed absent** (no pin overlay; comments exist only in ReviewTab list) | Shell state 6 · 200:2 | 🟦 F4 confirmed |

Additional part-2 code-quality finds (append to ledger):
- **F22** All-CSS dead render path (devMode hardcoded false).
- **F23** F6 region cycle designed, unimplemented.
- **F24** ScopeDropdown "Whole site" inert.
- **F25** `InspectorElementMenu` trigger absolutely-positioned inside flex cluster (escapes flow).
- **F26** `SmartGuidesOverlay` hardcodes `#FF00FF` + `zIndex:9999` bypassing tokens/Z_LAYERS.
- **F27** `useLayerDrag` is a stub; drop logic inline in `panels/layers/index.tsx`.

---

## 4. Broken / weak areas in the shipped editor (independent of Figma)

1. **Publish menu lies** (F1) — 4 no-op items styled as live actions.
2. **Fake collaborators in prod** (F2) — MOCK_USERS fallback renders "You, Ana" whenever disconnected.
3. **Dead surfaces shipping** (F11) — WelcomeModal, SpotlightOverlay (orchestrator comment claims they run), ElementsTab (unrouted but still imported by BlockPickerModal — verify before delete), ConnectionQualityIndicator.
4. **Two modal substrates** (F8) — Radix vs ≥8 hand-rolled overlays; z-index values 200/9999/10000/2147483646; hand-rolled ones lack focus traps. Radix head CSS never renders (F18).
5. **Two media surfaces** (F17) — legacy MediaLibraryPanel modal (with dead "From URL — coming soon" tab) beside the real MediaTab.
6. **Templates triple-surface** (F7) — drawer tab + TemplateLibrary modal + section inserts; design + PRD dissolve it.
7. **Stub/no-op controls** — stock not-configured banner unreachable (F16), Whole-site reach inert (F24), All-CSS unreachable (F22), Topbar dead props (F19).
8. **Three rail modes maintained** (figma/e3/legacy) — only figma is target; e3/legacy are drift surface.
9. Minor: InspectorElementMenu positioning (F25), SmartGuides token bypass (F26), useLayerDrag stub (F27).

---

## 5. Blockers & founder decisions

| # | Blocker | Type | Blocks |
|---|---|---|---|
| B1 | Retire TemplatesTab drawer (dissolution into S1.3 + Insert) — removes shipped surface | Founder decision (recommended 07-22, unexecuted) | Phase 1 |
| B2 | Review RBAC backend for Approve / Request-changes / Unpublish ("Phase 7" in code) — dashboard-side routers + role gates (ties into C1–C3 role conflicts from 07-22 audit, dashboard package) | Backend work outside editor pkg | Phase 2 full-wire (Phase 0 removes the lying items regardless) |
| B3 | Comment-mode anchoring: canvas pins need element-anchored comment data; verify reviews schema stores anchors (ReviewTab shows "pinned" flag) | Schema verify | Phase 2 |
| B4 | Webhooks: 12 boards designed, zero backend | Founder build-or-cut | Phase 6 |
| B5 | Issues auto-fix (fixing/fix-failed boards) — engine has no auto-fix capability | Scope decision | Phase 4 (can ship states without auto-fix by dropping the boards instead) |
| B6 | Figma-side token fix: warning #D97706 fails WCAG — Figma should adopt code's #B45309 (decision already locked code-side) | 5-min Figma edit | none — do in Phase 0 |
| B7 | Radix-in-dashboard portal breakage (ConflictModal precedent) constrains modal unification | Technical | Phase 5 approach |
| B8 | Collab frozen (6 P1 OT bugs) — no cursor/presence work beyond hiding mocks | Standing decision | keeps Phase 0 scope small |
| B9 | Code-ahead surfaces need boards BEFORE further work (AnimationEditor, MilestoneSuggestionBanner, AchievementPrompt, MigrationProgressModal, PageTabBar states, ProjectSettingsModal) | Design task (Figma) | any future work on those |

---

## 6. Phased convergence plan

Rule per phase: read the relevant boards → confirm states → implement → reconnect logic → test (vitest + verify:ds + live walk) → fix regressions → document. No business-logic rewrites; chrome and wiring only.

**Phase 0 — Truth & dead-weight (1 session, no design work needed)**
Remove/wire the lies: PublishDropdown no-op items (wire Submit-for-Review to existing topbar flow; drop Approve/Request-Changes/Unpublish until B2), gate MOCK_USERS to dev/demo only, delete WelcomeModal + SpotlightOverlay + ConnectionQualityIndicator + ElementsTab (verify BlockPickerModal dependency first), fix stock banner gating, drop Topbar dead props, resolve All-CSS path (delete from profiles or real flag), F25/F26/F27 nits. Figma-side: B6 warning-color fix. Exit: tsc + vitest + verify:ds green; live walk of publish menu + media + presence.

**Phase 1 — Rail/IA convergence to target shell (the visible redesign)**
`Insert · Layers · Pages · Media · Content · Brand` per 52:2: fold Components into Brand·components sub-view; Design→Brand rename; Content onto rail; Templates dissolution (B1): route full-page templates via S1.3 new-page flow, section templates stay in Insert; retire drawer tab + TemplateLibrary modal; delete e3/legacy rail modes if founder agrees (or park). Exit: every S1 board's rail matches shipped rail; all panel entry points still reachable (⌘K, topbar ⋯); tabsConfig tests updated.

**Phase 2 — Review arc completion (S5)**
S5.6 post-approval banners (approved-clean/edited-since/re-sent), review pill full map already shipped — verify against boards; canvas comment mode (shell state 6): pin overlay + comment-mode toggle wired to existing review comments (B3); orphan-comment detected/reattach/dismissed (184:56+). Exit: S5.1→S5.6 walkable live end-to-end vs boards.

**Phase 3 — Content panel build-out**
Replace 143-line stub with the 9-board design: in-panel collection list/record editor/fields/data-sources/variables/conditions views; CMS modals become drill-ins or stay as entry points per boards; keep all composer CMS logic. Exit: each Content board reproduced with real CMS data.

**Phase 4 — State-coverage sweep (small, board-exact)**
CmdK no-results/disabled-command/ai-offer; Notifications jump-target-deleted; Issues fixing/fix-failed (or B5 drop); Inspector loading + ai-agent-run; F6 region cycle (58:2); reach-whole-site wire-or-demote (F24). Exit: per-board state parity checklist.

**Phase 5 — Modal substrate + preview**
One substrate: migrate hand-rolled overlays onto Modal/OverlayMount within B7 constraints (ConflictModal stays exempt, documented); fix `.bd-modal__head` CSS (F18); z-index ladder from tokens. Preview: decide popup vs in-shell state 7 with founder; implement chosen. Exit: modal inventory single-substrate + focus-trap audit.

**Phase 6 — Founder-gated expansions**
Webhooks (B4, 12 boards, needs backend), permissions-aware chrome (F9, after C1–C3 role reconciliation), Domains in-editor screens vs deep-link decision.

**Continuous — design-first guard (B9)**
Before touching any code-ahead surface, draw its boards in Figma (Editor page, matching conventions: `Surface · state` naming, target rail, tokens).


---

## 7. Phase 0 execution record (2026-07-25, same session)

| Finding | Action | Proof |
|---|---|---|
| F1 | PublishDropdown narrowed to reachable states (`draft`/`published`); all no-op items removed (Submit for Review, Approve, Request Changes, Unpublish, Deployment Status); every remaining item wired; misleading sublabels ("Admin only…", "Shown only if previously published") deleted. StudioHeader/AquibraStudio types narrowed. Test rewritten to pin "no decorative items". | PublishDropdown.test.tsx green |
| F2 | MOCK_USERS presence fallback gated behind new `IS_DEV_BUILD` (runtimeEnv, Vite MODE / NODE_ENV dual-read). Production disconnected sessions render nothing. Test re-pinned to prod behavior. | PresenceIndicators tests green |
| F11 | Deleted WelcomeModal, SpotlightOverlay (+tests, +index exports, orchestrator comment fixed, dead `spotlightTarget` field/data removed), ConnectionQualityIndicator (+test, +index export, green-panel allowlist entry). **ElementsTab KEPT — corrected finding: it is the body of BlockPickerModal (canvas insert), not dead.** | tsc green; verify:ds green |
| F16 | Unreachable `IS_STOCK_CONFIGURED` flag + not-configured banner deleted; wiring note kept in StockService. Real configured-ness needs a server capability endpoint (recorded). | StockService test updated, green |
| F19 | Topbar dead props removed end-to-end: canUndo/canRedo/onUndo/onRedo/device/zoom/onDeviceChange/onZoomChange dropped from Topbar, StudioHeader (incl. dead handleDeviceChange/handleZoomChange), AquibraStudio call. | tsc green |
| F22 | `devMode` hardcoded-false replaced with `USE_DEV_MODE` localStorage flag (`buildrick:dev-mode`, mirrors schema-border pattern) — All CSS section reachable again. | tsc green |
| F24 | (deferred to Phase 4 — reach-whole-site wire-or-demote) | — |
| F25 | InspectorElementMenu trigger un-absoluted; wrapped in `position:relative` root, menu anchors to trigger. | tsc green |
| F26 | SmartGuidesOverlay zIndex 9999 → `Z_LAYERS.dropFeedback`. Magenta stays (purpose-built overlay color, same class as box-model overlay palette). | tsc green |
| F27 | useLayerDrag: unused `_composer` param dropped; doc-comment corrected to actual responsibility (state only). | tsc green |
| B6 | Figma `color/warning` variable (VariableID:2:22, Primitives/Default) set to **#B45309**; swatch hex label 67:93 updated. Read-back verified via variable defs. Conformance test updated: warning moved from A11Y_KEEPS (now empty, removed) into FIGMA_COLOR. | get_variable_defs shows #b45309; conformance 72 green |

Gates: `pnpm verify:ds` green (green-panel allowlist pruned of deleted file) · `npx tsc --noEmit` clean · targeted suites 396 green + conformance 72 green. Full-suite run recorded below.

---

## 8. Phase 1 execution record (2026-07-25, same session)

Target: board `S1 · Editor — ASSEMBLED` 52:2 (rail frame 52:6 fetched from node metadata: 6 items, ONE group, 48px pitch, 44×44 icon+label items, rail 60).

| Change | Detail | Proof |
|---|---|---|
| Rail contract | `RAIL_FIGMA` → single group `add · layers · pages · assets · content · design` (was stale 5-item Add/Assets/Components + Layers/Pages from the incomplete-fetch era). | tabsConfig.figma.test.ts rewritten: order, labels, one-group, partition, off-rail-shortcut contract — green |
| Rail visuals | `.ls-btn--labeled` 44×44 icon+label (token `--buildrick-size-rail-item`), `.ls-rail` 48px hardcode → `var(--buildrick-size-rail)` (60px — was drifting from the shipped token). | Live: computed `.ls-rail` width 60px; screenshot rail-final.png matches board |
| Design→Brand | tabsConfig label + aria, DesignSystemTab headerTitle. | Live: panel header "Brand"; ⌘K "Open Brand panel" |
| Components off-rail | Reachable via ⇧A + ⌘K (nav commands derive from config). | Live: ⇧A opens Components panel |
| Templates dedupe (B1 partial) | **TemplateLibrary modal + SectionTemplates quick-inserts DELETED** (2 of the 3 duplicate surfaces from three-way audit §2) with full prop-chain drain: StudioModals, useContentModals/useStudioModals, useComposerInit (⌘⇧T now opens the drawer via ui:switch-tab), AquibraStudio, StudioHeader, Topbar, StudioPanels, useStudioHandlers (handleSelectTemplate + dead templateActions.ts deleted). `Template` type moved to `src/templates/types.ts`. TemplatesTab drawer KEPT as the one browse surface until the S1.3 3-way new-page modal lands (Phase 2+); "From template" page-add entry already routes into it (TabRouter onSwitchToTemplates). | tsc clean; shell/templates suites green; live: T opens drawer |
| Gate ratchet | Chrome-axioms baselines lowered 174→173, 272→267, 337→333 (locking this phase's literal drains). | verify:ds full green |

Live verification (headless browse, localhost:5050): rail order/labels exact vs board; all six panels open; Brand panel content intact; T / ⇧A / ⌘K off-rail entries verified; empty-canvas + inspector-empty "Browse Templates" CTAs still functional (route to drawer).

Deferred within P1 (documented, deliberate): e3/legacy rail modes kept (escape hatches, `?rail=`); full drawer retirement + S1.3 3-way modal = Phase 2; Components fold into Brand·components sub-view = later phase per board 153:29.

---

## 9. Phase 2 execution record (2026-07-25, same session)

Prereqs verified first: **B3** — `Comment` model already stores anchors (`targetSelector`, `x`/`y` page-fractions, `pageId`); **B2** — RBAC exists (`reviews.resolve`: ADMIN + agency-gated, APPROVED|CHANGES_REQUESTED, can't-resolve-own-submission; client path via token).

| Piece | Built | Proof |
|---|---|---|
| Server | `comments.reattach` mutation (EDITOR-gated, site-scoped IDOR guard) + `reattachComment` service + `reattachCommentInput` schema | comment.service tests 14 green |
| Comment mode (board 200:2) | `CommentLayer` in canvas (event-driven: ui:comment-mode, comments:refresh/orphans/orphans-request/reattach-start/reattached), Topbar 💬 toggle + "Comment · Esc" pill, click-to-pin composer, numbered pins (fraction-positioned, zoom-inherited), overlay-piercing hit-test (`elementsFromPoint`) | Unit 36 green; LIVE: pin rendered, DB row `pageId`+`targetSelector`+fractions after real `comments.create` 200 |
| Orphan recovery (184:56/70/87) | Settle-delayed detection on delete/page-change, modal (board copy), ReviewTab **Detached** group with Reattach + Resolve, replay handshake for late-mounting panel, pick-to-reattach banner + flow | LIVE: deleted anchored element → modal on reload; Detached · 1 in panel; reattach click → DB selector updated dead→live |
| S5.6 (131:2 + 131:201) | Approved pill enriched ("Approved by {name} · {rel}"); `StaleApprovalModal` replaces generic ConfirmDialog — itemized page diff (approved snapshot vs current export), "Re-send for approval" (fresh round to same client) + amber "Publish anyway" | Modal tests 6 green (diff rows, re-send payload, publish-anyway) |
| ReviewService | `targetSelector` mapping, `createPinnedComment`, `reattachReviewComment` | typed + exercised by live E2E |

E2E environment: dashboard dev (3000) + editor Vite (5050) + magic-link login (dev procedure), seeded agency_layer + PENDING round on site `Pulse — Pricing`. Server log evidence: `comments.list`/`comments.create` 200 from the editor origin. Screenshots: scratchpad `e2e-pin.png`, `e2e-orphan-modal.png`, `e2e-detached.png`.

Gates: verify:ds full green (shadows/radii/width tokenized to keep chrome-axiom baselines); tsc clean both packages; touched suites 1382 green + server comment tests 14.

Deferred (documented): S5.6 modal live-fire needs an APPROVED round + edits + publish attempt (component-tested; wiring is the pre-existing blockedReason path); comment-pin rendering on the account-less client review page (that page still posts general notes only); known infra note — Turbopack /edit/[siteId] cold compile wedged the dev server twice (worktrees/ia-v2 dual-React contamination suspected), E2E ran via the documented :5050 flow instead.

---

## 10. Phase 3 execution record (2026-07-25, same session)

Content panel rebuilt from the 143-line stub to the nine boards (148:2 root ·
149:7 empty · 149:50 collection · 149:84 record · 149:108 unsaved · 151:2
fields · 151:46 sources · 151:62 variables · 151:87 conditions), entirely on
existing engine APIs — no engine edits:

| View | Backing | Live proof |
|---|---|---|
| Root + empty | `composer.cms.collections` (+ per-collection record counts), DataManager sources, persisted variables, element condition scan | "Menu items 1 › / Sources 0 / Variables 2 / Conditions 1" walked live |
| Collection | `getContentItems` (status dot = published), + Add, Fields › | created "Menu items", record listed with green dot |
| Record | field form (vibcoder Input/Textarea/Switch per CMSField type) + Published toggle + Unsaved savebar (Discard/Save per 149:108) | created "Margherita", published, saved through `createContentItem`/`updateContentItem` |
| Fields | list w/ type + required, + Add field (`addField`, slugified), delete via ConfirmDialog | Fields 1 › after wizard field |
| Sources | DataManager list + one-way-sync hint; **"+ Add a source (JSON)" via `importSampleData`** (documented divergence — external connectors unbuilt) | JSON import unit-tested; bad-JSON error state |
| Variables | `{{site.*}}` rows (mono + value), add/edit/delete with key validation; persisted per-project + **registered as the live `site` object source** so TemplateEngine/DataManager bindings resolve | added name + phone live; localStorage verified |
| Conditions | element condition-binding scan (summary "when available is false" formatter), Select (jump to element), remove; **+ New condition = inspector pick-mode reuse → expression form → `bindCondition`** | picked heading live → "heading · Heading / when site.open is true" row |

Live-walk findings fixed on the spot: (1) CollectionManager emits CMS events on
ITSELF, not the composer — panel reload now subscribes on
`composer.cms.collections`; (2) `DataManager.registerSource` THROWS on a
duplicate id — site-source registration is now an upsert (register-or-update).
Dead `useDataManager` hook deleted with the stub. New aliases
`--bd-border-input`, `--bd-accent-text` added to bd-aliases.css (Gate 17);
all form controls use vibcoder primitives (Gate 24 zero-tolerance stays 0).

Tests: contentPanelUtils 15 + ContentTab 8 (×2 dup path = 38 reported) new;
sidebar + comments regression 2048 green; tsc clean both packages; verify:ds
full green. Screenshot: scratchpad `p3-content-root.png`.

Deferred (documented): "Dynamic pages ›" row (no edit path for an existing
collection's page settings — needs CMSCollectionSetupModal edit mode);
external source connectors (Sheets); field edit-in-place (add/delete shipped);
board 151:46's "Connected · synced" meta awaits real connectors.

---

## 11. Phase 4 execution record (2026-07-25, same session)

Board-exact state sweep. Every remaining 🟦 item terminally resolved:

| Board | Disposition | Detail |
|---|---|---|
| CmdK · no-results 166:45 | **Built** | "Nothing matches '{q}'." + "Ask AI instead ›" (single-token queries) |
| CmdK · ai-offer 166:51 | **Built** | Multi-word queries: "That isn't a command — send it to AI?" + the diff-not-direct-writes explainer + "Ask AI ›" |
| CmdK · disabled 166:58 | **Built** | `disabled`/`disabledReason` on palette commands — visible, muted, reasoned, non-running (board rationale honored); real cases: Undo/Redo gated on `history.canUndo/canRedo` |
| Notifications · jump-target-deleted 165:71 | **Built** | null-`actionUrl` rows render as information (no button role, warn sub-line "nothing to jump to") instead of a dead clickable row |
| Inspector · ai-agent-run 160:512 | **Built** | `useAgentRunner` broadcasts `ai:agent-run {running, summary}`; inspector hands over to the "AI · {step}… / selection kept" card and restores after |
| Inspector · reach-whole-site 189:2 | **Built (wired)** | ScopeDropdown "Whole site" now switches the inspector to the site-wide banner ("Editing the whole site — every page") with **Open Brand** (→ Brand panel) + "Back to this element". Divergence: board draws editable controls in this scope — site-wide apply isn't built, so controls step aside instead of lying |
| Keyboard · F6 region cycle 58:2 | **Built** | `regionCycle.ts` (pure, 12 tests): board order 1→7 with wrap, ⇧F6 reverse, hidden regions (closed drawer, absent page-tabs/inspector) drop out; wired in useEditorShortcuts (works from editable surfaces) |
| Keyboard legend 58:215 rail letters | **Built** | Shortcuts remapped to the legend: L=Layers (was Z), D=Content (was C), B=Brand (was D); bare **C = comment-mode toggle**. ⌘K/Topbar/KeyboardShortcutsPanel derive automatically |
| Inspector · loading 159:102 | **Rejected** — the inspector derives context synchronously; no async path exists to load. Board presumes a future async inspector |
| Issues · fixing 164:42 / fix-failed 164:57 | **Deferred (B5)** — no issue-producer pipeline exists (shell issues list is manual); building auto-fix UI over nothing would be decorative. Note: real fixers exist as parts (engine `contrastFix.ts`, `AltTextService`) for a future issues arc |
| Legend n/p (Review/Compare/Issues) + ⌘⏎ publish | **Deferred** — documented, small follow-ups |

Verify: tsc clean both packages; verify:ds full green; palette 24 + bell 10 + regionCycle 12 + ProInspector P4 6 new/updated tests; shell+inspector+rail+ai suites green (2 load-flakes re-ran green in isolation). Live-walked on :5050: F6 → topbar → rail → drawer in board order; L/B/D open Layers/Brand/Content; C shows "Comment · Esc"; ⌘K "qqp" → Nothing matches, "make the hero warmer" → AI hand-off + explainer (disabled-row path unit-pinned — the live demo legitimately has history).
