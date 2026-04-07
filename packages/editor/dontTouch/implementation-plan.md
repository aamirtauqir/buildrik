# Buildrik — Safe Implementation Plan

**Date:** 2026-03-12
**Role:** Staff Frontend Architect + Senior Product Engineer
**Inputs:** `stitch2-validated.md` (capability audit), `prd_final.md` (target PRD)
**Goal:** Upgrade editor UX to PRD spec without regressions

---

## 1. Implementation Strategy

### The Safest Approach: Thin-Shell-First, Inside-Out

The safest path is a **three-layer strategy** that separates concerns by blast radius:

**Layer 1 — Design System + Shared Primitives (zero UI change)**
Establish the CSS token system and shared UI components that all subsequent work depends on. No visual change to users yet. This is pure foundation.

**Layer 2 — Shell Reshaping (container changes only)**
Modify the editor shell (Topbar, Rail, Sidebar frame, Inspector frame) to match the PRD layout grid. Content inside panels does NOT change — only the containers around them. This means the existing panel content renders inside a new layout but is not rewritten.

**Layer 3 — Panel-by-Panel Content Upgrade (one panel at a time)**
Each sidebar tab, each inspector section, each modal is upgraded individually. Each upgrade is independently testable and independently revertible. No panel depends on another panel's upgrade being complete.

### Why This Order

1. **Tokens first** — every downstream component consumes tokens. Getting tokens wrong means reworking everything.
2. **Shell second** — the PRD changes layout dimensions (Topbar 52px, Rail 56px, Sidebar 280px, Inspector 280px). If we upgrade panel content first, it will need re-measuring when the shell changes.
3. **Content last** — each panel is independently scoped. Parallel work becomes possible after shell stabilizes.

### Key Safety Rule

**Never rewrite a working system. Extend, wrap, or restyle.** If a component works but looks wrong, change its styles. If a component works but is missing a feature, add the feature. If a component is in `components/` (legacy) and needs significant changes, migrate it to `editor/` — but preserve its logic.

---

## 2. What Can Be Reused

### Engine Layer (100% reuse — do not touch)

| System | File(s) | Reuse Strategy |
|--------|---------|---------------|
| Composer orchestrator | `src/engine/Composer.ts` (699 LOC, 29 managers) | Zero changes. All UI accesses via `composer.*` |
| HistoryManager | `src/engine/HistoryManager.ts` (470 LOC) | Zero changes. JSON Patch architecture preserved. |
| VersionHistoryManager | `src/engine/VersionHistoryManager.ts` | Zero changes. Named snapshots, IndexedDB storage. |
| StorageAdapter | `src/engine/storage/StorageAdapter.ts` (417 LOC) | Zero changes. 5 backends preserved. |
| SyncManager + OfflineQueue | `src/engine/sync/SyncManager.ts` | Zero changes. Offline queue preserved. |
| CollaborationManager | `src/engine/collaboration/CollaborationManager.ts` (790 LOC) | Zero changes. OT engine preserved. Transport gap is future work. |
| StyleEngine | `src/engine/styles/StyleEngine.ts` | Zero changes. Breakpoint-aware styles preserved. |
| GSAP Engine + InteractionRuntime | `src/engine/animations/GSAPEngine.ts`, `src/engine/interactions/InteractionRuntime.ts` | Zero changes. |
| PluginManager | `src/engine/PluginManager.ts` | Zero changes. CDN + SRI preserved. |
| FontManager | `src/engine/fonts/FontManager.ts` | Zero changes. 24h Google Fonts cache preserved. |
| FormHandler | `src/engine/forms/FormHandler.ts` | Zero changes. Webhook/email/store backends preserved. |
| ExportEngine | `src/engine/export/ExportEngine.ts` | Zero changes. HTML export preserved. React/Vue gated as "Coming soon." |
| CMSManager + DataManager + Bindings | `src/engine/cms/`, `src/engine/data/` | Zero changes. All 3 binding types preserved. |
| RecoveryManager | `src/engine/recovery/RecoveryManager.ts` | Zero changes. |
| CommandCenter | `src/engine/commands/` | Zero changes. All 30+ keyboard shortcuts preserved. |
| MediaManager | `src/engine/media/` | Zero changes. |
| ComponentManager | `src/engine/components/` | Zero changes. |

### Editor Layer (high reuse — extend, don't rewrite)

| System | File(s) | Reuse Strategy |
|--------|---------|---------------|
| AquibraStudio shell | `src/editor/shell/AquibraStudio.tsx` (639 LOC) | Refactor layout grid dimensions; preserve zone orchestration |
| Topbar | `src/editor/shell/Topbar.tsx` (318 LOC) | Restyle + reorganize controls per PRD §7; preserve all functional wiring |
| Rail + tabsConfig | `src/editor/rail/tabsConfig.ts` (243 LOC) | Extend RAIL_SLOTS from 8 → 10 (add Components + Publish); restyle icons |
| Canvas + all 12 overlays | `src/editor/canvas/` (130 files) | Canvas content: zero changes. Canvas footer: restyle per PRD §10.7 |
| Inspector + 13 sections | `src/editor/inspector/` | Extend to 20 sections per PRD §11. Existing 13 sections preserved. |
| Layers panel | `src/editor/panels/layers/` | Restyle; preserve tree logic, bidirectional hover sync, drag-to-reorder |
| All sidebar tab components | `src/editor/sidebar/tabs/` (11 files) | Restyle per PRD §9. Preserve all Composer integrations. |
| AI components | `src/editor/*/AI*`, `src/services/ai/AIServiceClient.ts` | Preserve facade to `/api/ai/*`. Restyle panels per PRD §14. |
| Onboarding | `src/editor/onboarding/` (8 files, 1231+ LOC) | Restyle. Add "Explore freely →" escape link per PRD §5G. |
| Media panel | `src/editor/media/` (13 files) | Restyle. Stock discovery: gate with "Connect API" if `searchStock()` returns `[]`. |
| Export modal | `src/editor/export/` (6 files) | Restyle. Gate React/Vue/Next.js as "Coming soon" per PRD §16.1. |
| Version history panel | `src/editor/panels/` | Restyle. Add Activity view per PRD §9.13 if not present. |
| Collaboration components | `src/editor/collaboration/` (3 files) | Restyle presence + connection quality. Gate live-cursor UI until transport exists. |

### Shared Layer (extend)

| System | File(s) | Reuse Strategy |
|--------|---------|---------------|
| CSS custom properties | `src/themes/default.css` | Extend with missing `--aqb-*` tokens from PRD. Do NOT rename existing tokens. |
| UI primitives | `src/shared/ui/` (36 files) | Restyle existing primitives. Add missing ones (PanelHeader, DrillInHeader, PillToggle). |
| Types | `src/shared/types/` (33 files) | Extend with new type definitions as needed. |
| Constants | `src/shared/constants/` (18 files) | Add new constants. Do NOT change existing constant values. |
| Hooks | `src/shared/hooks/` (8 files) | Reuse all. Add new hooks for new behavior. |
| Error tracking (Sentry) | `src/shared/utils/errorTracking.ts` | Zero changes. Already code-verified present. |

---

## 3. What Must Be Refactored First

These are **blocking** issues that will cause cascading problems if not resolved before new UX work begins.

### RF-1: Standardize Panel Header Pattern (CRITICAL — blocks all panel work)

**Problem:** Each sidebar panel currently uses a slightly different header structure. PRD §9.1 mandates a single PanelHeader pattern (48px, icon + title + pin + close) across all 10 tabs.

**Files to create/modify:**
- Create: `src/shared/ui/PanelHeader.tsx` — single-source-of-truth panel header component
- Modify: All 10 panel root components in `src/editor/sidebar/tabs/` to consume PanelHeader

**Risk if skipped:** Every panel upgrade will independently reinvent headers, causing visual inconsistency.

**Effort:** ~1 day

---

### RF-2: Normalize Rail Tab Config for 10 Tabs (CRITICAL — blocks rail + sidebar)

**Problem:** `tabsConfig.ts` defines 8 rail icon slots. PRD §8.1 requires 10 (add Components at position 6 TOP, Publish at position 3 BOTTOM).

**Files to modify:**
- `src/editor/rail/tabsConfig.ts` — add 2 entries to RAIL_SLOTS
- `src/editor/rail/` — ensure LeftRail renders new slots
- Verify sidebar routing handles new tab IDs

**Risk if skipped:** Components and Publish panels cannot be rail-navigated. Users lose discoverability per PRD §4.1.

**Effort:** ~0.5 day

---

### RF-3: Establish `--aqb-*` Token Completeness (HIGH — blocks all restyling)

**Problem:** `default.css` has the beginnings of the `--aqb-*` token system but may lack tokens specified in the PRD (shadow system, motion tokens, density specs).

**Files to modify:**
- `src/themes/default.css` — add missing tokens from PRD §6.2 (surface hierarchy, shadows, borders, text hierarchy, z-index)

**Risk if skipped:** Components will hardcode hex values instead of using tokens, creating maintenance debt.

**Effort:** ~0.5 day

---

### RF-4: Inspector Tab Rename: "Behavior" → "Effects" (MEDIUM — blocks inspector work)

**Problem:** Inspector tab label says "Behavior" but PRD §11.3 and internal code both use "Effects."

**Files to modify:**
- `src/editor/inspector/` — tab definition (likely in config or the ProInspector root component)

**Risk if skipped:** Design-code mismatch causes confusion in every inspector PR.

**Effort:** ~15 minutes

---

### RF-5: Gate Non-Functional Features (HIGH — blocks QA trust)

**Problem:** Several features render UI for capabilities that don't work yet:
- Export React/Vue (type only, no generator)
- Stock media discovery (returns `[]`)
- Collaboration transport (absent)
- Publish in demo (no `onPublish` wired)

**Action:** Add "Coming Soon" badges, disabled states, or conditional rendering for each.

**Files to modify:**
- Export modal — disable React/Vue format options
- Media panel DiscoveryView — show "Connect stock API" placeholder
- Collaboration UI — hide live cursor/presence if transport is null
- Publish tab — show clear "Integration required" state in demo mode

**Risk if skipped:** Users encounter dead ends, file bugs, lose trust.

**Effort:** ~1 day

---

### RF-6: Audit Legacy `components/` Imports (MEDIUM — informs migration scope)

**Problem:** 371 files in `src/components/` (legacy). Unknown how many are still rendered in the active editor shell. Need to know before starting shell work.

**Action:** Run import analysis to determine which legacy files are still imported by `editor/` or `demo/`.

**Effort:** ~0.5 day (analysis only, no code changes)

---

## 4. Workstreams

### WS-1: Design System & Tokens

**Scope:** CSS custom properties, shared UI primitives, Emotion theme patterns
**Owner concern:** Foundation that all other workstreams consume
**Key deliverables:**
- Complete `--aqb-*` token set in `default.css`
- PanelHeader, DrillInHeader, PillToggle, StatusBadge shared components
- Motion tokens (duration, easing per PRD gaps H2)
- Focus ring spec (2px solid #6366f1, 2px offset — global)
- Icon mapping spec (Lucide icon per function)

**Dependencies:** None (this is the leaf)

---

### WS-2: Editor Shell

**Scope:** AquibraStudio layout grid, Topbar, Rail, panel frames
**Owner concern:** The 4-zone layout (Rail + Sidebar + Canvas + Inspector)
**Key deliverables:**
- Topbar: reduce from ~15 to 7+4 controls per PRD §7
- Rail: extend to 10 icons per PRD §8.1
- Sidebar frame: 280px default, pin/close behavior per PRD §9.3
- Inspector frame: 280px default, collapse behavior
- Canvas footer: restyle toolbar per PRD §10.7

**Dependencies:** WS-1 (tokens must exist first)

---

### WS-3: Canvas

**Scope:** Canvas interaction states, overlays, empty state, context menu, floating toolbar
**Owner concern:** The central editing surface
**Key deliverables:**
- CanvasEmptyCTA per PRD §10.2
- Floating element toolbar per PRD §10.3
- Context menu completeness per PRD §10.8
- Canvas footer overlay toggles per PRD §10.7
- Resize handles spec per PRD §10.4
- Drop zone highlighting per PRD §10.6

**Dependencies:** WS-2 (shell must be stable for canvas to fit correctly)

---

### WS-4: Layers Panel

**Scope:** Tree view, hover sync, reorder, context menu, empty state
**Key deliverables:**
- Restyle tree per PRD §9.6
- Verify bidirectional canvas-layers hover sync works
- Add empty state per PRD §9.6

**Dependencies:** WS-1 (tokens), WS-2 (panel frame)

---

### WS-5: Inspector / Properties Panel

**Scope:** All 20 sections across 3 tabs, pseudo-states, breakpoint-aware editing, multi-select, empty state
**Key deliverables:**
- Extend from 13 to 20 sections per PRD §11.3
- Add missing sections: CSS Classes, Link, Visibility, Data Attributes, AI Suggestions, All CSS (DevMode)
- Pseudo-state editing UI per PRD §11.4
- Breakpoint indicator per PRD §11.5
- MultiSelectToolbar per PRD §11.6
- InspectorEmptyState per PRD §11.7
- DevModeToggle in inspector header per PRD §4.1
- Inspector search (filter sections)

**Dependencies:** WS-1 (tokens), WS-2 (inspector frame), WS-3 (canvas selection wiring)

---

### WS-6: Sidebar Panels (remaining 9 tabs)

**Scope:** Build, Templates, Pages, Components, Media, Design, Settings, Publish, History
**Key deliverables:**
- Build tab: restyle CatAccordion, add FavZone + tips per PRD §9.4
- Templates: preview modal, use drawer, apply overlay per PRD §9.5
- Pages: page settings drawer with 3 sub-tabs per PRD §9.7
- Components: detail screen, create flow per PRD §9.8
- Media: source toggle, upload states, stock gating per PRD §9.9
- Design System: draft chip, review modal, tab guard per PRD §9.10
- Settings: 6 drill-in screens, plan-gating per PRD §9.11
- Publish: checklist wiring, states per PRD §9.12
- History: ViewSwitcher, versions + activity views per PRD §9.13

**Dependencies:** WS-1 (tokens), WS-2 (panel frame + PanelHeader), RF-2 (rail config for Components + Publish)

---

### WS-7: Responsive System

**Scope:** Device switcher, breakpoint-aware inspector, responsive preview
**Key deliverables:**
- Topbar device switcher restyle (4-segment pill) per PRD §7.4
- BreakpointDropdown (custom sizes) per PRD §7.4
- Inspector breakpoint indicator (blue dot on overridden properties) per PRD §11.5
- Verify StyleEngine.setBreakpointStyles() still works through all UI changes

**Dependencies:** WS-2 (topbar), WS-5 (inspector)

---

### WS-8: History System

**Scope:** History panel, version save/restore/compare, activity log
**Key deliverables:**
- ViewSwitcher (Versions/Activity pill toggle) per PRD §9.13
- Named versions: save dialog, restore confirm, compare diff view per PRD §15
- Activity log view per PRD §15.2
- Undo/Redo buttons in panel
- Clear history with confirmation

**Dependencies:** WS-1 (tokens), WS-2 (panel frame)

---

### WS-9: Persistence & Sync

**Scope:** Save status, auto-save indicator, sync dot, offline behavior
**Key deliverables:**
- Save status indicator in Topbar (saved/saving/error states) per PRD §7.5
- Sync status dot per PRD §7.2 item 10
- Offline state handling per PRD §7.5

**Dependencies:** WS-2 (topbar)

---

### WS-10: Publish Pipeline

**Scope:** Publish tab, export modal, preview
**Key deliverables:**
- Publish tab states (unpublished, published, in-progress, error) per PRD §9.12
- Pre-publish checklist wired to real data per PRD §9.12
- Export modal with gated formats per PRD §16.1
- Preview (Ctrl+P) opens new tab per PRD §16.3

**Dependencies:** WS-2 (topbar publish button), WS-6 (publish panel content)

---

### WS-11: Accessibility

**Scope:** WCAG 2.1 AA compliance across all surfaces
**Key deliverables:**
- Focus traps in all modals (PRD gap IS1)
- Focus restoration after modal close (IS2)
- Tab order: Rail → Sidebar → Canvas → Inspector (IS3)
- Arrow key navigation in Rail (IS4)
- Keyboard navigation in command palette (IS5)
- aria-live announcements on selection (IS6)
- Global focus ring style (IS7)
- Touch targets 44×44px (IS8)
- prefers-reduced-motion for GSAP (IS10)
- Inspector section expand/collapse via keyboard (IS15)

**Dependencies:** Runs in parallel with all workstreams. Each workstream must self-check a11y before completion.

---

### WS-12: Modals & Overlays

**Scope:** All 13+ modal types
**Key deliverables:**
- Command Palette (Ctrl+K) per PRD §17.1
- Keyboard Cheat Sheet per PRD §17.2
- Template preview + use drawer per PRD §9.5
- Collection Setup modal per PRD §12.2
- Create Component modal per PRD §9.8
- Upgrade modal per PRD §9.11
- AI Copilot modal per PRD §14.2
- All existing modals in StudioModals.tsx restyled

**Dependencies:** WS-1 (tokens), WS-11 (focus traps)

---

### WS-13: AI Surfaces

**Scope:** AIAssistantBar, AI Suggestions, AI Copilot
**Key deliverables:**
- AIAssistantBar restyle per PRD §14.1
- AI Suggestions section in inspector per PRD §14.3
- AI Copilot modal per PRD §14.2
- Gate all AI features with clear "requires server" messaging if `/api/ai/*` is unavailable

**Dependencies:** WS-1 (tokens), WS-5 (inspector for AI Suggestions section), WS-12 (Copilot modal)

---

### WS-14: CMS Surfaces

**Scope:** Collection setup, binding flow, CMS preview
**Key deliverables:**
- Collection Setup modal per PRD §12.2
- Binding flow (chain icon → collection picker → live preview) per PRD §12.3
- CMS Preview mode ("Viewing record 1/N") per PRD §12.4

**Dependencies:** WS-5 (inspector binding icon), WS-12 (collection setup modal)

---

### WS-15: Collaboration Surfaces (Gate Phase)

**Scope:** Presence, cursors, selection awareness — gated until transport exists
**Key deliverables:**
- Restyle presence avatars in Topbar per PRD §13.1
- Gate live cursors and selection awareness behind transport check
- ConnectionQualityIndicator per PRD §13.5

**Dependencies:** WS-2 (topbar)

---

## 5. Milestones

### M0: Pre-flight (Week 1)

**What:** Refactors RF-1 through RF-6. No visual changes to end users.

| Task | Deliverable |
|------|------------|
| RF-1 | PanelHeader shared component |
| RF-2 | Rail config extended to 10 tabs |
| RF-3 | Complete `--aqb-*` token set |
| RF-4 | Inspector tab rename |
| RF-5 | Gate non-functional features |
| RF-6 | Legacy import audit |

**Exit criteria:** All refactors merged. Demo app still works identically. No visual change.

---

### M1: Design System Foundation (Week 2)

**What:** WS-1 complete. Shared primitives ready for consumption.

| Deliverable | File |
|------------|------|
| Token set complete | `src/themes/default.css` |
| PanelHeader, DrillInHeader | `src/shared/ui/` |
| PillToggle, StatusBadge | `src/shared/ui/` |
| Focus ring global style | `src/themes/default.css` |
| Motion tokens | `src/themes/default.css` |

**Exit criteria:** All new shared components have unit tests. Token set reviewed against PRD §6.2.

---

### M2: Shell Reshape (Weeks 3–4)

**What:** WS-2 + WS-9 complete. Editor layout matches PRD grid. All content still renders inside new containers.

| Deliverable | File |
|------------|------|
| Topbar 7+4 controls | `src/editor/shell/Topbar.tsx` |
| Rail 10 icons | `src/editor/rail/` |
| Sidebar 280px frame + pin/close | `src/editor/sidebar/` |
| Inspector 280px frame | `src/editor/inspector/ProInspector.tsx` |
| Canvas footer restyle | `src/editor/canvas/` |
| Save/sync indicators | `src/editor/shell/Topbar.tsx` |

**Exit criteria:** Layout pixel-matches PRD §6.1. All existing panel content renders correctly inside new frames. All 30+ keyboard shortcuts still work. Demo app functional.

---

### M3: Canvas Polish (Weeks 5–6)

**What:** WS-3 complete. Canvas interaction states match PRD.

| Deliverable | File |
|------------|------|
| CanvasEmptyCTA | `src/editor/canvas/` |
| Floating element toolbar | `src/editor/canvas/` |
| Context menu completeness | `src/editor/canvas/` |
| Canvas footer toggles | `src/editor/canvas/` |
| Resize handle styling | `src/editor/canvas/` |
| Drop zone highlighting | `src/editor/canvas/` |

**Exit criteria:** All 17 canvas states from PRD §10.1 verified. Selection, drag, inline edit all work.

---

### M4: Inspector Upgrade (Weeks 7–9)

**What:** WS-5 complete. Inspector has all 20 sections across 3 tabs.

| Deliverable | File |
|------------|------|
| 7 new sections | `src/editor/inspector/sections/` |
| Pseudo-state editing UI | `src/editor/inspector/` |
| Breakpoint indicator | `src/editor/inspector/` |
| MultiSelectToolbar | `src/editor/inspector/` |
| InspectorEmptyState | `src/editor/inspector/` |
| DevModeToggle in header | `src/editor/inspector/` |
| Inspector search | `src/editor/inspector/` |

**Exit criteria:** All 20 sections render. Pseudo-state editing works for hover/focus/active/disabled. Breakpoint switching shows correct values. Multi-select shows alignment tools.

---

### M5: Panel Content Upgrade (Weeks 10–13)

**What:** WS-4 + WS-6 + WS-8 complete. All 10 sidebar panels match PRD.

Can be parallelized — each panel is independent:

| Panel | Priority | PRD Section |
|-------|----------|-------------|
| Layers | High | §9.6 |
| Build/Add | High | §9.4 |
| Pages | High | §9.7 |
| Media | High | §9.9 |
| Templates | Medium | §9.5 |
| Components | Medium | §9.8 |
| Design System | Medium | §9.10 |
| History | Medium | §9.13 |
| Settings | Medium | §9.11 |
| Publish | High | §9.12 |

**Exit criteria:** Each panel matches PRD spec. All sub-features (drill-ins, drawers, modals) functional.

---

### M6: Modals, AI & CMS (Weeks 14–16)

**What:** WS-12 + WS-13 + WS-14 complete.

| Deliverable | PRD Section |
|------------|-------------|
| Command Palette | §17.1 |
| Keyboard Cheat Sheet | §17.2 |
| AI Copilot modal | §14.2 |
| Collection Setup modal | §12.2 |
| CMS binding flow | §12.3 |
| All other modals restyled | §5F |

**Exit criteria:** All 13 modal types triggerable. Ctrl+K and ? shortcuts work. CMS binding flow end-to-end.

---

### M7: Accessibility & Polish (Weeks 17–18)

**What:** WS-11 complete. Full accessibility pass.

| Deliverable | PRD Gap |
|------------|---------|
| Focus traps in all modals | IS1 |
| Focus restoration | IS2 |
| Tab order audit | IS3 |
| Rail keyboard nav | IS4 |
| prefers-reduced-motion | IS10 |
| Contrast audit (4.5:1) | WCAG AA |
| Touch target audit (44×44) | IS8 |

**Exit criteria:** WCAG 2.1 AA audit passes. Keyboard-only user can complete new-user-first-publish flow.

---

### M8: Integration Testing & Regression Sweep (Week 19)

**What:** Full regression testing against Anti-Downgrade Checklist (PRD Output E, 56 items).

| Test | Scope |
|------|-------|
| All 30+ keyboard shortcuts | Against `defaultCommands.ts` |
| All 10 sidebar tabs via rail | Click + keyboard shortcut |
| All 20 inspector sections | Per element context |
| All 13 modal types | Via documented entry points |
| Canvas overlays (all 12) | Toggle each on/off |
| Drag from sidebar + within canvas | Visual test |
| History save/restore | Named version round-trip |
| Export HTML | Download + render check |
| Auto-save + recovery | Kill tab + reopen |
| Multi-breakpoint styles | Desktop → Mobile round-trip |

**Exit criteria:** All 56 Anti-Downgrade items pass. Zero P1 regressions.

---

## 6. Regression Risks Per Milestone

### M0: Pre-flight

| Risk | Mitigation |
|------|-----------|
| RF-2 (adding rail tabs) could break sidebar routing | Test all 10 tab switches before merging. Verify `GROUPED_TABS_CONFIG` handles new IDs. |
| RF-5 (gating features) could hide something that works | Only gate features confirmed partial in `stitch2-validated.md`. Use feature flags, not code deletion. |

### M1: Design System Foundation

| Risk | Mitigation |
|------|-----------|
| New tokens could conflict with existing hardcoded values | Audit: search for hex values that match existing tokens. Replace with token references. |
| New shared components could have different API than ad-hoc patterns | Write migration guide showing old pattern → new component. |

### M2: Shell Reshape

| Risk | Mitigation |
|------|-----------|
| Topbar control reduction (15 → 7+4) could lose functionality | Verify every removed control has an equivalent path (overflow menu, keyboard shortcut, or dedicated panel). Map every control's new location before removing from Topbar. |
| Rail expansion (8 → 10) could overflow on small viewports | Implement Rail compact mode (PRD §8.5) simultaneously. Test at 700px viewport height. |
| Sidebar width change could break panel content layout | Test each panel at 280px, 320px, and 400px before merging shell changes. |
| Canvas dimensions change when shell dimensions change | Verify canvas recalculates via `useCanvasSize` hook after layout changes. |

### M3: Canvas Polish

| Risk | Mitigation |
|------|-----------|
| New floating toolbar could interfere with inline text editing | Test: double-click text element → toolbar must not capture keystrokes. |
| Context menu changes could lose "Select from stack" | Verify `elementsFromPoint` integration still works. |
| Drop zone highlighting could conflict with snap lines | Test: drag element near snap threshold while hovering drop target. Both visuals must coexist. |

### M4: Inspector Upgrade

| Risk | Mitigation |
|------|-----------|
| Adding 7 new sections could cause scroll performance issues | Virtualize section list if needed. Each section should be lazy-rendered (only when expanded). |
| Pseudo-state editing could mutate base styles instead of pseudo rules | Test: edit hover state → verify base state unchanged. Use StyleEngine API correctly. |
| Breakpoint indicator could show wrong values after switching | Test: set desktop value → switch to mobile → verify computed value reflects mobile override or desktop base. |
| CSS context system (`deriveCssContext()`) could hide new sections incorrectly | Test: each new section with multiple element types (div, text, image, form). |

### M5: Panel Content Upgrade

| Risk | Mitigation |
|------|-----------|
| Design System tab guard modal could block tab switches | Test: edit token → switch tab → verify guard fires → discard → verify switch completes. |
| History panel's activity view could have performance issues with large histories | Paginate or virtualize activity log entries. |
| Page Settings drawer could not save correctly | Test: edit SEO fields → navigate away → return → verify values persisted via Composer. |
| Media upload states could break existing upload flow | Test: drag-and-drop multiple files → verify progress → verify success → verify file appears in grid. |

### M6: Modals, AI & CMS

| Risk | Mitigation |
|------|-----------|
| Command palette could capture keyboard shortcuts it shouldn't | Test: Ctrl+K opens palette → Escape closes → Ctrl+Z still undoes. Verify no shortcut leaks. |
| CMS binding flow could break existing data bindings | Test: bind text field → verify canvas shows data → unbind → verify canvas shows original. |
| AI features with no backend could confuse users | Show clear loading → timeout → "AI service unavailable" message if `/api/ai/*` doesn't respond within 5s. |

### M7: Accessibility & Polish

| Risk | Mitigation |
|------|-----------|
| Focus traps could break Escape key behavior | Test: modal open → Escape → verify modal closes AND focus returns to trigger element. |
| prefers-reduced-motion could disable essential GSAP transitions | Only disable decorative animations. Functional transitions (panel open/close) use instant instead of 0ms. |

### M8: Regression Sweep

| Risk | Mitigation |
|------|-----------|
| Regressions found here are expensive to fix | Each earlier milestone includes its own regression check. M8 is the safety net, not the first pass. |

---

## 7. Definition of Done

### Per-Milestone DoD

| Milestone | Completion Criteria |
|-----------|-------------------|
| M0 | All 6 refactors merged. `npm run dev` works. No visual change. All existing tests pass. |
| M1 | Token set reviewed against PRD §6.2. All new shared components have unit tests. Storybook or equivalent visual review of each primitive. |
| M2 | Layout matches PRD §6.1 grid at 1440px and 1024px. All 10 rail icons clickable. All panel content renders inside new frames. All 30+ shortcuts work. |
| M3 | All 17 canvas states from PRD §10.1 demonstrable. Selection, drag, inline edit, marquee, context menu all work. Canvas footer toggles all 7 overlays. |
| M4 | All 20 inspector sections render for appropriate elements. Pseudo-state editing writes to correct CSS rules. Breakpoint switching shows correct computed values. Multi-select shows alignment tools. |
| M5 | Each of 10 panels matches PRD spec for that tab. All sub-features (drill-ins, drawers, modals) functional. No panel leaves dead-end states. |
| M6 | All 13 modal types triggerable via documented entry points. Ctrl+K returns results for all registered commands. CMS binding creates real data connections. |
| M7 | WCAG 2.1 AA: all text 4.5:1 contrast, all controls keyboard accessible, all modals focus-trapped, all focus restored on close. Keyboard-only first-publish flow passes. |
| M8 | All 56 Anti-Downgrade Checklist items pass. Zero P1 bugs. Performance: inspector renders <100ms on section switch. Panel switch <150ms. |

### Overall Project DoD

- All 8 milestones complete
- All 30+ keyboard shortcuts verified against `defaultCommands.ts`
- All 10 sidebar tabs accessible via rail AND keyboard shortcut
- All 20 inspector sections present and functional
- All 13 modal types accessible
- HTML export produces valid output
- Auto-save cycle works (edit → 5s → save indicator)
- History save/restore round-trips correctly
- No feature from `stitch2-validated.md` "Code-Verified Present" list is missing or broken
- `npx tsc --noEmit` passes
- `npx vitest run` passes

---

## 8. Suggested File/Module Touch Points

### M0: Pre-flight

| Action | Files |
|--------|-------|
| Create PanelHeader | `src/shared/ui/PanelHeader.tsx` (new) |
| Create DrillInHeader | `src/shared/ui/DrillInHeader.tsx` (new) |
| Extend rail config | `src/editor/rail/tabsConfig.ts` |
| Complete tokens | `src/themes/default.css` |
| Rename inspector tab | `src/editor/inspector/config/` or `ProInspector.tsx` |
| Gate features | `src/editor/export/`, `src/editor/media/`, `src/editor/collaboration/`, `src/editor/sidebar/tabs/PublishTab.tsx` |

### M2: Shell Reshape

| Action | Files |
|--------|-------|
| Topbar restructure | `src/editor/shell/Topbar.tsx` |
| Shell layout grid | `src/editor/shell/AquibraStudio.tsx` |
| Rail restyle | `src/editor/rail/LeftRail.tsx` (or equivalent) |
| Sidebar frame | `src/editor/sidebar/LeftSidebar.tsx` |
| Inspector frame | `src/editor/inspector/ProInspector.tsx` |
| Canvas footer | `src/editor/canvas/controls/CanvasFooter.tsx` (or equivalent) |
| Save indicator | `src/editor/shell/` (new or existing status component) |

### M3: Canvas

| Action | Files |
|--------|-------|
| Empty state | `src/editor/canvas/` — new `CanvasEmptyCTA.tsx` |
| Floating toolbar | `src/editor/canvas/controls/` — new or existing toolbar |
| Context menu | `src/editor/canvas/` — existing context menu component |
| Drop zones | `src/editor/canvas/overlays/DropFeedbackOverlay.tsx` |
| Resize handles | `src/editor/canvas/overlays/SelectionHandles.tsx` |

### M4: Inspector

| Action | Files |
|--------|-------|
| New sections | `src/editor/inspector/sections/` — 7 new section files |
| Pseudo-state UI | `src/editor/inspector/components/` — PseudoStateSelector |
| Breakpoint indicator | `src/editor/inspector/components/` — BreakpointIndicator |
| Multi-select | `src/editor/inspector/components/` — MultiSelectToolbar |
| Empty state | `src/editor/inspector/components/InspectorEmptyState.tsx` |
| DevMode toggle | `src/editor/inspector/components/` — DevModeToggle |
| Search | `src/editor/inspector/components/` — InspectorSearch |
| Section config | `src/editor/inspector/config/` — section definitions |
| Tab config | `src/editor/inspector/hooks/useInspectorSections.ts` |

### M5: Panel Content

| Action | Files |
|--------|-------|
| Build tab | `src/editor/sidebar/tabs/BuildTab.tsx` (or AddTab) |
| Templates | `src/editor/sidebar/tabs/TemplatesTab.tsx` |
| Layers | `src/editor/panels/layers/` |
| Pages | `src/editor/sidebar/tabs/PagesTab.tsx` |
| Components | `src/editor/sidebar/tabs/ComponentsTab.tsx` |
| Media | `src/editor/media/` |
| Design System | `src/editor/sidebar/tabs/DesignSystemTab.tsx` |
| Settings | `src/editor/sidebar/tabs/SettingsTab.tsx` + drill-in screens |
| Publish | `src/editor/sidebar/tabs/PublishTab.tsx` |
| History | `src/editor/panels/` — VersionHistoryPanel, ActivityView |

### M6: Modals

| Action | Files |
|--------|-------|
| Command Palette | `src/editor/panels/` or `src/editor/shell/` — CommandPalette |
| Keyboard Cheat Sheet | `src/editor/panels/KeyboardShortcuts.tsx` (exists) |
| All modals | `src/editor/shell/StudioModals.tsx` + individual modal files |
| Collection Setup | `src/editor/ecommerce/` |
| AI Copilot | `src/editor/` — new or existing AI modal |

---

## 9. Final Build Order

```
WEEK  1  ─── M0: Pre-flight ───────────────────────────────────
              RF-1: PanelHeader shared component
              RF-2: Rail config → 10 tabs
              RF-3: Complete --aqb-* tokens
              RF-4: Inspector tab rename
              RF-5: Gate non-functional features
              RF-6: Legacy import audit

WEEK  2  ─── M1: Design System Foundation ─────────────────────
              Shared UI primitives (PanelHeader, DrillInHeader, PillToggle, StatusBadge)
              Motion tokens, focus ring, icon mapping

WEEKS 3-4 ── M2: Shell Reshape ────────────────────────────────
              Topbar (7+4 controls)
              Rail (10 icons + compact mode)
              Sidebar frame (280px, pin/close)
              Inspector frame (280px, collapse)
              Canvas footer restyle
              Save/sync indicators
              ↳ Checkpoint: full layout matches PRD grid

WEEKS 5-6 ── M3: Canvas Polish ────────────────────────────────
              CanvasEmptyCTA
              Floating toolbar
              Context menu completion
              Footer toggles
              Resize handles + drop zones

WEEKS 7-9 ── M4: Inspector Upgrade ────────────────────────────
              +7 new sections (CSS Classes, Link, Visibility, Data Attributes,
                               AI Suggestions, All CSS/DevMode, Variants)
              Pseudo-state editing UI
              Breakpoint indicator
              MultiSelectToolbar
              InspectorEmptyState
              DevModeToggle in header
              Inspector search
              ↳ Checkpoint: 20 sections, all states working

WEEKS 10-13 ─ M5: Panel Content (parallelizable) ─────────────
              [Team member A]: Build + Templates + Components
              [Team member B]: Pages + Media + Design System
              [Team member C]: Settings + Publish + History
              [All]: Layers (quick, shared concern)

WEEKS 14-16 ─ M6: Modals, AI & CMS ───────────────────────────
              Command Palette (Ctrl+K)
              Keyboard Cheat Sheet (?)
              AI Copilot modal
              Collection Setup + binding flow
              All 13 modals restyled

WEEKS 17-18 ─ M7: Accessibility & Polish ──────────────────────
              Focus traps, restoration, tab order
              Rail keyboard nav
              prefers-reduced-motion
              Contrast audit
              Touch target audit

WEEK 19 ──── M8: Regression Sweep ─────────────────────────────
              56-item Anti-Downgrade Checklist
              Full keyboard shortcut test
              Performance benchmarks
              Sign-off
```

### Critical Path

```
M0 → M1 → M2 → M3 ──→ M4 ──→ M6 → M7 → M8
                  ↘            ↗
                   M5 (parallel)
```

M5 (panel content) can run in parallel with M4 (inspector) after M2 (shell) is stable. M6 (modals) needs both M4 and M5 to be substantially complete because modals reference inspector sections and panel states.

### Non-Negotiable Ordering Constraints

1. **M0 before everything** — refactors unblock all work
2. **M1 before M2** — shell consumes tokens
3. **M2 before M3, M4, M5** — panels and canvas need stable containers
4. **M4 before M6** — CMS binding flow needs inspector chain icon
5. **M7 before M8** — accessibility fixes before final regression check
6. **M8 is always last** — it validates everything

---

*End of implementation plan.*
