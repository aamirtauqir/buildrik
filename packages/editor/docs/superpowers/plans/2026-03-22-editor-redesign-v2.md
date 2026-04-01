# Buildrik Editor Redesign — Implementation Plan v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Buildrik editor UI to surface all engine capabilities with Webflow density + Framer polish, then connect the redesigned UI to the existing 29-manager Composer engine.

**Architecture:** Component-first approach. Build reusable shell components FIRST (TopBar, Rail, Sidebar, Canvas, Inspector, Footer), then compose every screen from those components. This guarantees visual consistency — if the sidebar component changes, it changes everywhere. Engine stays untouched.

**Core Rule:** NEVER build a screen by copy-pasting layout code. Every screen MUST compose from the shared shell components. If a new screen needs a zone that doesn't exist as a component, create the component first, then use it.

**Tech Stack:** React 18 + TypeScript + Emotion CSS-in-JS + Lucide React icons + existing Composer engine

---

## Build Order & Dependencies

```
Phase 0: Shared Shell Components (BUILD THESE FIRST — everything else uses them)
  Task 0A: Design tokens refresh
  Task 0B: EditorShell component (the master layout grid)
  Task 0C: TopBar component (fixed, reusable, never changes across screens)
  Task 0D: Rail component (fixed, reusable, icon grouping)
  Task 0E: SidebarPanel component (the container — header + pin/close + search + content slot)
  Task 0F: InspectorPanel component (the container — header + tabs + content slot)
  Task 0G: CanvasFooter component (overlay toggles + zoom)
  Task 0H: Shared control components (inputs, buttons, sections, badges, toasts, modals)

Phase A: Core Screens (compose from Phase 0 components)
  Task 1: Canvas states (empty, hover, selected, multi-select, inline edit, drag, context menu)
  Task 2: Inspector states (empty, single element, multi-select, style tab, effects tab)
  Task 3: Pseudo-state editing + breakpoint overrides
  Task 4: Command Palette (Ctrl+K)

Phase B: Sidebar Tabs (each tab plugs into SidebarPanel component)
  Task 5: Build/Add tab content
  Task 6: Layers tab content
  Task 7: Pages tab content
  Task 8: Templates tab content
  Task 9: Media tab content
  Task 10: Design System tab content
  Task 11: Settings tab content
  Task 12: History tab content

Phase C: Feature Surfaces
  Task 13: Publish flow (sidebar tab + top bar button wiring)
  Task 14: Export modal (5 formats, code preview)
  Task 15: CMS Collection Setup + Entry Points
  Task 16: CMS Record Management
  Task 17: CMS Binding Flow (inspector chain icons)
  Task 18: CMS Preview Mode
  Task 19: AI Assistant Bar (Ctrl+J)
  Task 20: AI Copilot Modal
  Task 21: AI Suggestions in Inspector

Phase D: Collaboration + Polish
  Task 22: Collaboration presence (top bar avatars)
  Task 23: Live cursors + conflict toasts + connection quality
  Task 24: Invite/Share flow
  Task 25: Component lifecycle (create, edit master, detach, variants)
  Task 26: Accessibility pass
  Task 27: Final integration testing
```

---

## COMPONENT-FIRST ARCHITECTURE

Every screen in the editor is a COMPOSITION of these shared components:

```
<EditorShell>                          ← Task 0B: master grid, responsive
  <TopBar />                           ← Task 0C: SAME on every screen
  <div className="editor-body">
    <Rail />                           ← Task 0D: SAME on every screen
    <SidebarPanel                      ← Task 0E: container with slot
      icon="plus" title="Add Elements"
      showSearch={true}
    >
      {/* Tab-specific content here */}  ← Phase B tasks fill this
    </SidebarPanel>
    <div className="canvas-zone">
      <Canvas />                       ← Phase A tasks
      <CanvasFooter />                 ← Task 0G: SAME on every screen
    </div>
    <InspectorPanel>                   ← Task 0F: container with slot
      {/* Context-specific sections */}  ← Phase A tasks fill this
    </InspectorPanel>
  </div>
</EditorShell>
```

**Why this matters:**
- TopBar is built ONCE in Task 0C. Every screen uses `<TopBar />`. Change it once → changes everywhere.
- SidebarPanel is a CONTAINER with a content slot. Each tab (Build, Layers, Pages, etc.) only provides the content — the header, pin/close, search are automatic.
- InspectorPanel is a CONTAINER. Each inspector state (empty, single, multi-select) only provides the sections — the header, tabs, breadcrumb are automatic.
- CanvasFooter is built ONCE. Never duplicated.
- No screen ever builds its own top bar, rail, sidebar header, or footer. EVER.

---

## Phase 0: Shared Shell Components

> **RULE:** Build these FIRST. Every task in Phase A-D uses these components. Never duplicate their code.

### Task 0A: Design Tokens Refresh

**Files:**
- Modify: `src/themes/default.css`
- Note: `src/shared/ui/tokens.ts` does NOT exist. Token definitions live in `src/themes/default.css` only (CSS custom properties). Do NOT create a tokens.ts file — all Emotion consumers must reference CSS variables via `var(--aqb-*)` strings. If a TypeScript token map is needed in the future, that is a separate task.

- [ ] **Step 1:** Read current `src/themes/default.css` — verify `:root.light-theme` block is present and complete (per CEO amendment — use light theme values, not dark)
- [ ] **Step 2:** Verify/add the following in `:root.light-theme` (authoritative values per CEO amendment):
  - `--aqb-surface-1: #ffffff` (panels)
  - `--aqb-surface-2: #f8fafc` (secondary panels)
  - `--aqb-surface-3: #f1f5f9` (tertiary / inputs)
  - `--aqb-surface-4: #e2e8f0` (borders, separators)
  - `--aqb-primary: #6366f1` (indigo accent)
  - `--aqb-bg-canvas: #ffffff`
  - `--aqb-text-primary: #1e293b`
  - Semantic: `--aqb-error: #EF4444`, `--aqb-warning: #F59E0B`, `--aqb-success: #22C55E`, `--aqb-info: #3B82F6`
  - Radius: `--aqb-radius-sm: 4px`, `--aqb-radius-md: 6px`, `--aqb-radius-lg: 8px`, `--aqb-radius-xl: 12px`
  - Do NOT modify the dark `:root` block
- [ ] **Step 3:** Verify editor still renders with updated tokens (no visual regressions in unchanged components)
- [ ] **Step 4:** Run `npx vite build` to confirm no build errors
- [ ] **Step 5:** Commit: `feat: refresh design tokens to match redesign spec`

---

### Task 0B: EditorShell Component (Master Layout Grid)

**Files:**
- Modify: `src/editor/shell/AquibraStudio.tsx`
- Modify: `src/editor/rail/LayoutShell.tsx`

- [ ] **Step 1:** Read both `src/editor/shell/AquibraStudio.tsx` and `src/editor/rail/LayoutShell.tsx` to understand current structure
- [ ] **Step 2:** Add `__EDITOR_V2__` feature flag to `vite.config.ts` define block (already done — verify `__EDITOR_V2__: JSON.stringify(false)` is present) and `declare const __EDITOR_V2__: boolean;` is in `src/vite-env.d.ts`
- [ ] **Step 3:** Wrap new shell render path in AquibraStudio.tsx: `if (__EDITOR_V2__) { /* new SidebarPanel, InspectorPanel, TopBar, Rail */ } else { /* existing LeftSidebar + ProInspector */ }`
- [ ] **Step 4:** Update layout grid dimensions: top bar 44px (from 52), rail 44px (from 56), sidebar 260px (from 280), inspector 280px (stays)
- [ ] **Step 5:** Store panel widths in `usePanelState` (same hook used for `isLeftPanelOpen`) — NOT local component state. Both sidebar and inspector resize must read/write from this hook so widths can be persisted.
- [ ] **Step 6:** Add responsive behavior:
  - Below 1024px: render "Editor requires 1024px minimum" blocker. When blocker is shown, unsubscribe canvas listeners (prevent Composer from receiving events with no canvas target).
  - 1024-1280px: auto-collapse inspector, sidebar stays
  - 1440px+: all panels open
- [ ] **Step 7:** Add auto-collapse priority: inspector first, then sidebar. Rail never collapses
- [ ] **Step 8:** Implement sidebar drag-to-resize: drag right edge, 260-360px range (writes to `usePanelState`)
- [ ] **Step 9:** Test at 1024px, 1280px, 1440px browser widths
- [ ] **Step 10:** Write `src/editor/shell/__tests__/LayoutShell.test.tsx`: renders without crash, responsive blocker renders below 1024px, panel widths update on resize drag
- [ ] **Step 11:** Commit: `feat: updated shell layout grid with responsive behavior and panel resize`

---

### Task 0C: TopBar Component

**Files:**
- Both `src/editor/shell/StudioHeader.tsx` AND `src/editor/shell/Topbar.tsx` exist. Read both. Identify which is actually rendered (check AquibraStudio.tsx imports). Delete the unused one. Implement in the surviving file.

- [ ] **Step 1:** Read `StudioHeader.tsx` and `Topbar.tsx` — grep AquibraStudio.tsx imports to determine which is live. Delete the dead file.
- [ ] **Step 2:** Read the surviving top bar to identify all ~15 controls
- [ ] **Step 3:** Reduce to 7 controls: logo+project name, save dot+status, undo/redo, device switcher, Preview (ghost button), Publish (primary button), collaboration avatars
- [ ] **Step 4:** Move AI button, export, overflow menu actions to Command Palette (Ctrl+K)
- [ ] **Step 5:** Add share/invite action next to avatars (for collaboration — Phase D)
- [ ] **Step 6:** Verify all keyboard shortcuts still work (Ctrl+Z, Ctrl+Y, Ctrl+P, etc.)
- [ ] **Step 7:** Write `src/editor/shell/__tests__/TopBar.test.tsx`: renders without crash, all 7 controls present, Publish button has `--aqb-primary` background
- [ ] **Step 8:** Commit: `feat: simplified top bar to 7 essential controls`

---

### Task 0D: Rail Component

**Files:**
- Modify: `src/editor/rail/LeftRail.tsx` (or `IconRail.tsx`)
- Modify: `src/editor/rail/tabsConfig.ts`

- [ ] **Step 1:** Read current rail config (10 icons) and tab definitions
- [ ] **Step 2:** Regroup to 8 icons with visual separator:
  - Top: Add (A), Media (J), Layers (Z), Templates (T), Pages (P)
  - Bottom: Design (D), Settings (S), History (H)
- [ ] **Step 3:** Remove Publish from rail (now top bar button)
- [ ] **Step 4:** Remove Components from rail (now section inside Build tab)
- [ ] **Step 5:** Update icon states: default (#5A584F), hover (#908D85), active (indigo bg + indigo icon), focused (2px indigo outline)
- [ ] **Step 6:** Ensure tooltips show tab name + keyboard shortcut
- [ ] **Step 7:** Write `src/editor/rail/__tests__/LeftRail.test.tsx`: renders without crash, exactly 8 icons present, active icon has indigo background, tooltip shows on hover
- [ ] **Step 8:** Commit: `feat: rail regrouped to 8 icons with top/bottom separation`

---

### Task 0E: SidebarPanel Component

**Files:**
- Modify: `src/editor/sidebar/LeftSidebar.tsx`
- Create: `src/editor/sidebar/SidebarPanel.tsx` (if not exists as shared component)

- [ ] **Step 1:** Read all 8 sidebar tab implementations to understand current header patterns
- [ ] **Step 2:** Create `SidebarPanel` as a reusable container component with props:
  - `icon`: Lucide icon name (14px)
  - `title`: string (13px Inter 600)
  - `showSearch`: boolean (renders search bar below header)
  - `searchPlaceholder`: string
  - `children`: React.ReactNode (content slot)
  - `onPin`/`onClose`: callbacks
  - `pinned`: boolean state
- [ ] **Step 3:** Header pattern is FIXED inside the component: 44px height, [icon] [title] [spacer] [pin 12px] [close 12px]. No tab can override this.
- [ ] **Step 4:** Search bar (when enabled): 28px height, surface-3 bg, search icon, fixed position below header
- [ ] **Step 5:** Pin/unpin behavior: pinned panels stay on outside click, unpinned close
- [ ] **Step 6:** Add deprecation comment to `LeftSidebar.tsx`: `// DEPRECATED: Use <SidebarPanel> for all new tabs. Will be deleted after Tasks 10A-10H complete.` Do NOT attempt to migrate all 8 existing tabs in this task — each tab migrates within its own task (10A-10H).
- [ ] **Step 7:** Write `src/editor/sidebar/__tests__/SidebarPanel.test.tsx`: renders without crash, pinned=true stays open on outside click, pinned=false closes on outside click, onPin/onClose callbacks fire, search bar renders when showSearch=true
- [ ] **Step 8:** Commit: `feat: SidebarPanel shared component — consistent headers guaranteed`

### Task 0F: InspectorPanel Component

**Files:**
- Modify: `src/editor/inspector/ProInspector.tsx`
- Create: `src/editor/inspector/InspectorPanel.tsx` (if not exists as shared component)

- [ ] **Step 1:** Read current inspector to understand header/tab structure
- [ ] **Step 2:** Create `InspectorPanel` as a reusable container with props:
  - `selectedElement`: element data or null
  - `selectedCount`: number (0 = empty state, 1 = single, 2+ = multi-select)
  - `children`: React.ReactNode (section content slot per tab)
  - `activeTab`: 'layout' | 'style' | 'effects'
  - `onTabChange`: callback
- [ ] **Step 3:** When `selectedCount === 0`: render empty state automatically (page info + tips + shortcuts)
- [ ] **Step 4:** When `selectedCount === 1`: render header (icon + type + tag + breadcrumb + DevMode) + tab bar + scrollable content slot
- [ ] **Step 5:** When `selectedCount >= 2`: render MultiSelectToolbar automatically (align, distribute, size match, group, wrap, delete)
- [ ] **Step 6:** Tab bar: Layout | Style | Effects — indigo underline on active, scroll position preserved per tab AND per element ID
- [ ] **Step 7:** Collapse/expand: drag left edge, 280-400px range. Write width to `usePanelState` (same hook as sidebar — not local state).
- [ ] **Step 8:** Add deprecation comment to `ProInspector.tsx`: `// DEPRECATED: Use <InspectorPanel> for all new inspector states. Will be deleted after Task 26 integration testing passes.`
- [ ] **Step 9:** Write `src/editor/inspector/__tests__/InspectorPanel.test.tsx`: renders empty state when selectedCount=0, renders element header when selectedCount=1, renders MultiSelectToolbar when selectedCount>=2, onTabChange fires on tab click, onPin/onClose callbacks fire
- [ ] **Step 10:** Commit: `feat: InspectorPanel shared component — states and tabs guaranteed`

### Task 0G: CanvasFooter Component

**Files:**
- Modify: `src/editor/canvas/CanvasFooterToolbar.tsx`

- [ ] **Step 1:** Read current footer implementation
- [ ] **Step 2:** Update layout: left zone (overlay toggles), center (AI sparkle + help), right zone (zoom controls)
- [ ] **Step 3:** Implement toggle on/off states: OFF = #5A584F, ON = #6366F1 text + #6366F11A bg
- [ ] **Step 4:** Wire toggles to `composer.canvasIndicators` (NOT `composer.indicators` — the correct property name is `canvasIndicators`): `showGrid()`, `showGuides()`, `showSpacing()`, `showRulers()`
- [ ] **Step 5:** Make zoom percentage editable on click
- [ ] **Step 6:** Write `src/editor/canvas/__tests__/CanvasFooterToolbar.test.tsx`: renders without crash, Grid toggle calls `composer.canvasIndicators.showGrid()` on click (mock `canvasIndicators`)
- [ ] **Step 7:** Commit: `feat: redesigned canvas footer with overlay toggles and zoom`

---

### Task 0H: Shared Control Components

**Files:**
- Modify: `src/shared/ui/` (existing primitives)

- [ ] **Step 1:** Read existing shared UI components (Button, Modal, Tooltip, Input, etc.)
- [ ] **Step 2:** Ensure these shared controls exist and match the redesign spec:
  - `NumberInput`: value (JetBrains Mono) + unit suffix (px/rem/%), right-aligned
  - `SegmentedControl`: surface-2 bg, active option = indigo subtle bg + indigo text
  - `SectionAccordion`: 9px uppercase header + chevron, expandable body, consistent across inspector + sidebar
  - `Badge`: Published (green), Draft (amber), ElementTag (indigo mono), ShortcutKey (surface-3 + border)
  - `Toast`: success (green left border), error (red + retry), warning (amber), info (blue)
  - `ModalShell`: header (title + close X) + body slot + footer slot (right-aligned buttons), dark backdrop, focus trap
  - `Toggle`: 36×20px, OFF = surface-4, ON = indigo, white thumb
  - `ColorSwatch`: 28×28px, border, click → color picker
- [ ] **Step 3:** Every control must use design tokens from Task 0A — no hardcoded colors. Replace any `#EF4444`, `#F59E0B`, `#22C55E`, `#3B82F6` literals with `var(--aqb-error)`, `var(--aqb-warning)`, `var(--aqb-success)`, `var(--aqb-info)`
- [ ] **Step 4:** Verify all controls work in light theme context (`light-theme` class active)
- [ ] **Step 5:** Write `src/shared/ui/__tests__/SharedControls.test.tsx`: each control renders without crash, ModalShell traps focus on open and returns focus to trigger element on close
- [ ] **Step 6:** Commit: `feat: shared control components for editor redesign`

---

## Phase A: Core Screens (composed from Phase 0 components)

> Every screen below MUST use `<EditorShell>`, `<TopBar>`, `<Rail>`, `<SidebarPanel>`, `<InspectorPanel>`, `<CanvasFooter>`. No exceptions. No duplicated layout code.

### Task 1: Command Palette (Ctrl+K)

**Files:**
- Modify: `src/editor/canvas/controls/CommandPalette.tsx`

- [ ] **Step 1:** Read existing command palette implementation
- [ ] **Step 2:** Update visual design: 560px centered modal, dark backdrop, 52px search input
- [ ] **Step 3:** Implement grouped results: RECENT, NAVIGATION (8 tabs), EDIT, VIEW, AI, EXPORT
- [ ] **Step 4:** Wire to `composer.commands` — fuzzy match against command label and ID
- [ ] **Step 5:** Add keyboard nav: Arrow up/down, Enter to execute, Escape to close
- [ ] **Step 6:** Add fuzzy search with match highlighting
- [ ] **Step 7:** Test: Ctrl+K from any state, search "layers" → shows "Open Layers (Z)", Enter opens it
- [ ] **Step 8:** Commit: `feat: command palette with fuzzy search and grouped results`

---

### Task 2: Canvas Visual Polish

**Files:**
- Modify: `src/editor/canvas/overlays/ElementHoverOverlay.tsx`
- Modify: `src/editor/canvas/overlays/SelectionBoxOverlay.tsx`
- Modify: `src/editor/canvas/overlays/SelectionHandles.tsx`
- Modify: `src/editor/canvas/toolbars/FloatingElementToolbar.tsx` (or create if missing)

- [ ] **Step 1:** Update hover overlay: 2px teal (#14B8A6) at 60% opacity + element type badge (teal bg, white text, 9px)
- [ ] **Step 2:** Update selection overlay: 2px solid indigo (#6366F1)
- [ ] **Step 3:** Update resize handles: 8px white squares with 1.5px indigo border, 8 positions
- [ ] **Step 4:** Implement floating toolbar above selected element: parent/duplicate/move-up/move-down/copy/wrap | delete (red)
- [ ] **Step 5:** Toolbar positioning: 12px above element, repositions below if near top edge, hides during drag
- [ ] **Step 6:** Commit: `feat: polished canvas hover, selection, handles, floating toolbar`

---

### Task 3: Canvas Empty State

**Files:**
- Modify: `src/editor/canvas/CanvasEmptyCTA.tsx`

- [ ] **Step 1:** Read current empty state implementation
- [ ] **Step 2:** Redesign CTA card: centered, surface-2 bg, 12px radius, 40px padding
  - Layout icon (48px, muted), "Start building your site" (18px 600), description (13px), Browse Templates (primary) + Start Blank (ghost)
- [ ] **Step 3:** Wire "Browse Templates" → opens Templates tab in sidebar
- [ ] **Step 4:** Wire "Start Blank" → dismisses CTA, canvas enters idle state
- [ ] **Step 5:** Commit: `feat: welcoming canvas empty state CTA`

---

### Task 4: Canvas Drag/Drop Zone Feedback

**Files:**
- Modify: `src/editor/canvas/overlays/DropFeedbackOverlay.tsx`
- Modify: `src/editor/canvas/hooks/useCanvasDragDrop.ts`

- [ ] **Step 1:** Read existing drag/drop implementation
- [ ] **Step 2:** Update valid drop target: teal dashed border + light teal bg
- [ ] **Step 3:** Update invalid drop target: red dashed border + "Cannot drop here" label
- [ ] **Step 4:** Add insertion indicator: animated indigo line between sibling elements
- [ ] **Step 5:** Add snap lines during element drag: teal lines at 6px threshold
- [ ] **Step 6:** Commit: `feat: improved drag/drop zone feedback with snap lines`

---

### Task 5: Inline Text Editing Toolbar

**Files:**
- Modify: `src/editor/panels/RichTextEditor.tsx`
- Modify: `src/editor/canvas/hooks/useCanvasInlineEdit.ts`

- [ ] **Step 1:** Read existing inline editing implementation
- [ ] **Step 2:** Implement formatting toolbar: B/I/U/Strikethrough | Text style dropdown | Align L/C/R/J | Link | Color swatch | More (superscript, subscript, clear formatting)
- [ ] **Step 3:** Position toolbar: 8px above element, flip below if near top
- [ ] **Step 4:** Selection outline changes to purple (#818CF8) during inline edit
- [ ] **Step 5:** Escape commits text + returns to selected state
- [ ] **Step 6:** Commit: `feat: inline text editing toolbar with formatting controls`

---

### Task 6: Context Menu Redesign

**Files:**
- Modify: `src/editor/canvas/menus/ElementContextMenu.tsx`

- [ ] **Step 1:** Read current context menu implementation
- [ ] **Step 2:** Update menu items: Select, Select from stack (submenu), separator, AI: Improve (indigo), separator, Copy (⌘C), Cut (⌘X), Paste (⌘V), Duplicate (⌘D), separator, Wrap in Container, Create Component, Show in Layers, separator, Move Up/Down, separator, Delete (red, Del)
- [ ] **Step 3:** Add keyboard nav: Arrow up/down, Enter, Right (submenu), Left (back), Escape (close)
- [ ] **Step 4:** Wire "AI: Improve" → opens AI Assistant Bar (Ctrl+J) with element context
- [ ] **Step 5:** Commit: `feat: redesigned context menu with AI and component actions`

---

### Task 7: Inspector Content (sections, context-awareness)

**Files:**
- Modify: `src/editor/inspector/ProInspector.tsx`

- [ ] **Step 1:** Read current inspector structure
- [ ] **Step 2:** Implement empty state (nothing selected): page name, slug, "Edit SEO →" link, keyboard shortcuts tips
- [ ] **Step 3:** Implement element header: icon + type name + `<tag>` badge + DevMode toggle + breadcrumb
- [ ] **Step 4:** Implement 3-tab bar: Layout | Style | Effects — indigo underline on active, scroll position preserved per tab AND per element ID
- [ ] **Step 5:** Implement multi-select inspector state: when 2+ elements selected, show MultiSelectToolbar (align, distribute, size match, group, wrap, delete) instead of tab content
- [ ] **Step 6:** Add search input to filter sections by keyword
- [ ] **Step 7:** Commit: `feat: inspector shell with empty state, header, tabs, multi-select toolbar`

---

### Task 8: Pseudo-State Editing UI

**Files:**
- Modify: `src/editor/inspector/config/propertiesRegistry.ts`
- Modify: `src/editor/inspector/config/elementProfiles.ts`

- [ ] **Step 1:** Read current section visibility logic
- [ ] **Step 2:** Implement context-aware hiding: Flexbox section only when display=flex, Grid only when display=grid, Variants only for component instances
- [ ] **Step 3:** Ensure all values display in JetBrains Mono, all labels in Inter
- [ ] **Step 4:** Implement section accordion: 9px uppercase header + chevron, first 3 expanded by default
- [ ] **Step 5:** Commit: `feat: context-aware inspector sections`

---

### Task 9: Breakpoint Override Indicators

**Files:**
- Modify: `src/editor/inspector/ProInspector.tsx`
- Create: `src/editor/inspector/PseudoStateSelector.tsx` (if not exists)

- [ ] **Step 1:** Implement pseudo-state row: Normal/Hover/Focus/Active/Disabled buttons
- [ ] **Step 2:** Active editing state: amber bg + "Editing :hover state" banner below
- [ ] **Step 3:** Override dots: amber 6px circles on states that have CSS overrides
- [ ] **Step 4:** Per-property override indicator: 3px amber left border + reset icon on hover
- [ ] **Step 5:** Wire to `composer.styles.getPseudoClasses()` and `.update()` with pseudo-state
- [ ] **Step 6:** Commit: `feat: pseudo-state editing with override indicators`

---

---

## Phase B: Sidebar Tabs (each plugs into SidebarPanel)

> Every tab below renders INSIDE `<SidebarPanel icon="..." title="...">`. The header, pin/close, search are automatic. Each task only builds the CONTENT.

### Task 10: Sidebar Tab Contents (All 8 Tabs)

**Files:**
- Modify: All tab files in `src/editor/sidebar/tabs/`

> Each tab wraps its content in `<SidebarPanel>`. This task ensures every tab's CONTENT matches the redesign spec.

- [ ] **Step 1:** **Build/Add tab** — element catalog with categories (Structure, Text, Media, Forms, Navigation, Advanced + Data for CMS), search, favorites section, "My Components" section, 4-column element card grid
- [ ] **Step 2:** **Media tab** — source toggle (My Files / Stock), type filter pills (All/Images/Videos/Fonts), upload zone, 3-column library grid, asset detail overlay, icon picker
- [ ] **Step 3:** **Layers tab** — element tree with indentation (16px/depth), expand/collapse chevrons, element type icons, visibility eye toggle, selected state (indigo left border), drag-to-reorder, bi-directional canvas sync (hover/selection)
- [ ] **Step 4:** **Templates tab** — 2-column template grid, filter chips (All/Pages/Sections/Landing/E-commerce), preview modal with "Use This Template" CTA, apply progress overlay
- [ ] **Step 5:** **Pages tab** — page list with file icon + name + "Home" badge, active page (indigo border), context menu (rename/set home/duplicate/delete), "Add new page" dashed button, PageSettingsDrawer (SEO/Social/Advanced sub-tabs)
- [ ] **Step 6:** **Design System tab** — color tokens (swatch + name + hex), typography tokens (Aa preview + details), spacing tokens (bar + value), draft indicator, review modal, export dropdown (CSS/JSON/SCSS/Tailwind)
- [ ] **Step 7:** **Settings tab** — card grid home (Site Settings, Domains, Analytics, Integrations, Advanced, Export, Get Started Tour), each card → drill-in sub-screen with back arrow
- [ ] **Step 8:** **History tab** — view switcher (Versions/Activity), named versions list with save/restore/compare, auto-saves section, activity timeline with action icons, search
- [ ] **Step 9:** Verify ALL 8 tabs render inside `<SidebarPanel>` with consistent headers — no tab builds its own header
- [ ] **Step 10:** Commit: `feat: all 8 sidebar tab contents redesigned`

---

## Phase C: Feature Surfaces

> All modals use `<ModalShell>` from Task 0H. All sidebar content uses `<SidebarPanel>` from Task 0E.

### Task 11: Publish Checklist Wiring

**Files:**
- Modify: `src/editor/sidebar/tabs/publish/PublishTab.tsx`

- [ ] **Step 1:** Read current publish tab to find hardcoded `false` values
- [ ] **Step 2:** Wire `hasContent` to `composer.elements.getAll().length > 0`
- [ ] **Step 3:** Wire `hasSeoTitle` to page SEO data from composer
- [ ] **Step 4:** Wire `hasMetaDesc` to page meta description data
- [ ] **Step 5:** Wire `hasSocialImg` to page social image data
- [ ] **Step 6:** Add navigation hints on incomplete items ("Set in Pages → SEO tab" as clickable link)
- [ ] **Step 7:** Commit: `fix: wire publish checklist to real data`

---

### Task 12: Export Modal — Enable All Formats

**Files:**
- Modify: `src/editor/export/ExportModal.tsx`
- Modify: `src/editor/export/ExportOptions.tsx`

- [ ] **Step 1:** Read current export modal to find "Coming Soon" labels
- [ ] **Step 2:** Remove "Coming Soon" from React, Vue, Next.js, ZIP — these are implemented in ExportEngine
- [ ] **Step 3:** Add page selection checkboxes per format
- [ ] **Step 4:** Add code preview button (opens CodePreview component)
- [ ] **Step 5:** Add loading state: "Preparing download..." with spinner per-format
- [ ] **Step 6:** Add error state: toast "Export failed — [reason]" with retry
- [ ] **Step 7:** Commit: `feat: enable all 5 export formats with code preview`

---

### Task 13: Design System Token Polish

**Files:**
- Modify: `src/editor/sidebar/tabs/design/` components
- Modify: `src/features/design-system/ui/` components

- [ ] **Step 1:** Read current design system tab implementation
- [ ] **Step 2:** Polish DraftChip: amber pulsing dot + count
- [ ] **Step 3:** Strengthen ReviewModal: before→after side-by-side per token
- [ ] **Step 4:** Add inspector integration: color picker shows project tokens first
- [ ] **Step 5:** Add font picker integration: project typography tokens shown first
- [ ] **Step 6:** Commit: `feat: design system polish with inspector token integration`

---

*Note: Sidebar header consistency is now guaranteed by the `<SidebarPanel>` component from Task 0E. No separate task needed — all 8 tabs use the same component.*

### Task 14: CMS Collection Setup

**Files:**
- Modify: `src/editor/ecommerce/CollectionSetupModal.tsx`
- Create: `src/editor/cms/CollectionManager.tsx`

- [ ] **Step 1:** Read existing CollectionSetupModal
- [ ] **Step 2:** Redesign modal per Pencil design: header + name input + field list (drag handle + name + type dropdown + required toggle + delete) + "Add field" + Cancel/Create footer
- [ ] **Step 3:** Support 8 field types: Text, Image, Number, Boolean, Date, URL, Richtext, Reference
- [ ] **Step 4:** Validation: name required, at least 1 field, no duplicate field names
- [ ] **Step 5:** Wire to `composer.cmsManager.createCollection()`
- [ ] **Step 6:** Add loading, error, empty states per Module 04 spec
- [ ] **Step 7:** Add "Data" category to Build tab containing CMS List and CMS Item elements
- [ ] **Step 8:** Add CMS collection management link in Settings → Integrations sub-screen
- [ ] **Step 9:** Commit: `feat: CMS collection setup with Build tab entry point`

---

### Task 15: CMS Record Management

**Files:**
- Create: `src/editor/cms/RecordManager.tsx`
- Create: `src/editor/cms/RecordTable.tsx`

- [ ] **Step 1:** Build record table view: columns from schema, rows from records
- [ ] **Step 2:** Add record: form with fields matching collection schema
- [ ] **Step 3:** Edit record: inline editing in table cells
- [ ] **Step 4:** Delete record: confirmation dialog
- [ ] **Step 5:** CSV import: file upload → parse → preview → confirm
- [ ] **Step 6:** Wire to `composer.cmsManager` — addRecord(), updateRecord(), deleteRecord(), getRecords()
- [ ] **Step 7:** Commit: `feat: CMS record management with table view and CSV import`

---

### Task 16: CMS Binding Flow

**Files:**
- Modify: `src/editor/inspector/` (add chain icons to bindable fields)
- Create: `src/editor/cms/BindingDropdown.tsx`

- [ ] **Step 1:** Add chain icon (Lucide `link`, 12px) next to all bindable inspector fields
- [ ] **Step 2:** Build binding dropdown: 280px popover, "Bind to data" header, search, collection groups → fields (type-filtered)
- [ ] **Step 3:** Bound state: field shows "Collection.Field" badge in indigo, becomes read-only
- [ ] **Step 4:** Unbind: click chain icon on bound field → confirm → revert to editable
- [ ] **Step 5:** Wire to `composer.cmsBindings`, `composer.textBindings`, `composer.styleBindings`, `composer.traitBindings`
- [ ] **Step 6:** Commit: `feat: CMS data binding flow with inspector chain icons`

---

### Task 17: CMS Preview Mode

**Files:**
- Create: `src/editor/cms/CMSPreviewBar.tsx`
- Modify: `src/editor/canvas/hooks/useCanvasContent.ts`

- [ ] **Step 1:** Build record navigator: "Record 1 of N" with prev/next arrows, positioned above CMS List on canvas
- [ ] **Step 2:** Canvas renders actual data from selected record for bound elements
- [ ] **Step 3:** Add subtle "CMS" badge on each bound element
- [ ] **Step 4:** Wire to CMS engine for record data + RepeaterRenderer
- [ ] **Step 5:** Commit: `feat: CMS preview mode with record navigator`

---

### Task 18: AI Assistant Bar (Ctrl+J)

**Files:**
- Modify: `src/ai/AIAssistantBar.tsx`

- [ ] **Step 1:** Read existing AI assistant bar implementation
- [ ] **Step 2:** Redesign: slides up from canvas bottom, sparkle icon, prompt input, Generate button, close
- [ ] **Step 3:** Add contextual placeholders based on selection (no selection, text, image, container, multi-select)
- [ ] **Step 4:** Add suggestion chips below input (context-aware, auto-submit on click)
- [ ] **Step 5:** Implement generate → preview → apply/reject flow
- [ ] **Step 6:** Add states: idle, generating (spinner + cancel), result (apply/reject), error (red border + retry), unavailable (muted sparkle + "AI temporarily unavailable"), rate limited (countdown timer + disabled input)
- [ ] **Step 7:** Wire to AI ContentWriter module
- [ ] **Step 8:** Add entry points: Ctrl+J shortcut, canvas footer sparkle, context menu "AI: Improve"
- [ ] **Step 9:** Commit: `feat: AI assistant bar with contextual prompts and preview`

---

### Task 19: AI Copilot Modal

**Files:**
- Modify: `src/ai/AICopilot.tsx`

- [ ] **Step 1:** Read existing copilot implementation
- [ ] **Step 2:** Redesign: full-screen modal, sparkle icon, "What would you like to build?", textarea, template chips
- [ ] **Step 3:** Implement "Generate Full Page" and "Generate Section" buttons
- [ ] **Step 4:** Add progress state: spinner + cycling status text ("Generating structure..." → "Adding content..." → "Applying styles...")
- [ ] **Step 5:** Add result preview with Accept (replace/new page) / Reject
- [ ] **Step 6:** Wire to AI PageGenerator module
- [ ] **Step 7:** Commit: `feat: AI copilot modal for full page generation`

---

### Task 20: AI Suggestions in Inspector

**Files:**
- Create: `src/editor/inspector/sections/AISuggestionsSection.tsx`

- [ ] **Step 1:** Build section for Effects tab: "AI SUGGESTIONS" header, context label, 3 suggestion cards
- [ ] **Step 2:** Each suggestion: sparkle icon + description + Apply button
- [ ] **Step 3:** Apply = instant preview on canvas + undo available + toast
- [ ] **Step 4:** "New suggestions" regenerate button
- [ ] **Step 5:** Loading state: 3 shimmer skeleton rows
- [ ] **Step 6:** Wire to AI LayoutAnalyzer module
- [ ] **Step 7:** Commit: `feat: AI suggestions section in inspector Effects tab`

---

---

## Phase D: Collaboration + Polish

### Task 21: Collaboration Presence

**Files:**
- Modify: `src/editor/collaboration/PresenceIndicators.tsx`

- [ ] **Step 1:** Read current presence implementation
- [ ] **Step 2:** Redesign avatar stack: max 3 + "+N" overflow, unique colors per user, -8px overlap
- [ ] **Step 3:** Each avatar: initial or profile image, 2px surface-1 border, green online dot
- [ ] **Step 4:** Hover tooltip: user name + current activity ("Editing Hero Section")
- [ ] **Step 5:** Overflow click: dropdown with full user list
- [ ] **Step 6:** Wire to `composer.collaboration.getPresence()`
- [ ] **Step 7:** Commit: `feat: collaboration presence avatars in top bar`

---

### Task 22: Live Cursors + Conflict Toasts + Connection Quality

**Files:**
- Modify: `src/editor/canvas/overlays/RemoteCursorsOverlay.tsx`

- [ ] **Step 1:** Read current cursor overlay
- [ ] **Step 2:** Implement colored arrow cursors with name labels per remote user
- [ ] **Step 3:** Add fade behavior: active (1.0) → idle 3s (0.4) → hidden 10s (0.0) → reappear on movement
- [ ] **Step 4:** Add selection awareness: remote user's selected element gets colored outline + name badge
- [ ] **Step 5:** Wire cursor broadcast to `composer.collaboration.broadcastCursor()` throttled to 60fps
- [ ] **Step 6:** Implement conflict resolution toasts: auto-resolved ("Your change was rebased"), concurrent delete (warning), same-property last-writer-wins (info)
- [ ] **Step 7:** Build ConnectionQualityIndicator: green/amber/red/gray dot near save status, click → popover with latency, last sync time, reconnect button
- [ ] **Step 8:** Commit: `feat: live cursors, conflict toasts, connection quality indicator`

---

### Task 23: Invite/Share Flow

**Files:**
- Create: `src/editor/collaboration/InviteModal.tsx`

- [ ] **Step 1:** Build share modal: copy invite link, email input, permission picker (Editor/Viewer)
- [ ] **Step 2:** Active collaborator list with remove action
- [ ] **Step 3:** Trigger from top bar share button
- [ ] **Step 4:** Connection quality indicator integration (green/amber/red/gray)
- [ ] **Step 5:** Commit: `feat: collaboration invite/share modal`

---

### Task 24: Component Lifecycle

**Files:**
- Create: `src/editor/inspector/ComponentLifecycle.tsx`
- Modify: `src/editor/canvas/menus/ElementContextMenu.tsx`

- [ ] **Step 1:** Add "Create Component" to context menu → name input modal → `composer.components.create()`
- [ ] **Step 2:** Component library in Build tab "My Components" section
- [ ] **Step 3:** Edit master: double-click instance → isolation mode (other elements dimmed) → "Back to canvas"
- [ ] **Step 4:** Override indicators: blue reset dots on overridden properties
- [ ] **Step 5:** Detach: right-click instance → "Detach from component"
- [ ] **Step 6:** Implement Variants section in inspector Layout tab: variant picker dropdown, selectable on instances via `composer.components.getVariants()` / `setVariant()`
- [ ] **Step 7:** Commit: `feat: component create, edit master, override, detach, variants lifecycle`

---

### Task 25: Accessibility Pass

**Files:**
- Modify: Multiple files across `src/editor/`

- [ ] **Step 1:** Add ARIA roles: `tablist`/`tab`/`tabpanel` for sidebar tabs, `role="dialog"` + `aria-modal` for modals, `role="menu"` for context menus
- [ ] **Step 2:** Add focus management: modals trap focus, return focus to trigger on close
- [ ] **Step 3:** Add `aria-live` regions: `polite` for save/selection/panel changes, `assertive` for errors
- [ ] **Step 4:** Add skip link: "Skip to canvas" visually hidden, appears on first Tab press
- [ ] **Step 5:** Add `prefers-reduced-motion` support: disable GSAP animations, use instant transitions
- [ ] **Step 6:** Verify color contrast: all text meets WCAG AA 4.5:1 minimum
- [ ] **Step 7:** Commit: `feat: accessibility pass — ARIA, focus management, reduced motion`

---

### Task 26: Final Integration Testing

- [ ] **Step 1:** Test all 30+ keyboard shortcuts work correctly
- [ ] **Step 2:** Test all 8 sidebar tabs open/close/pin correctly with consistent headers
- [ ] **Step 3:** Test canvas states: hover (teal), select (indigo), drag, resize, inline edit, marquee
- [ ] **Step 4:** Test CMS flow end-to-end: create collection → add records → bind → preview
- [ ] **Step 5:** Test AI flow: Ctrl+J → prompt → generate → apply
- [ ] **Step 6:** Test export: all 5 formats download correctly
- [ ] **Step 7:** Test publish: checklist reflects real data, publish succeeds
- [ ] **Step 8:** Test command palette: Ctrl+K → search → execute command
- [ ] **Step 9:** Test responsive: 1024px (inspector collapses), 1280px, 1440px
- [ ] **Step 10:** Validate against all design principles (P1-P4, U1-U6, V1-V6)
- [ ] **Step 11:** Final commit: `feat: editor redesign complete`

---

### Task 27B: Remove `__EDITOR_V2__` Feature Flag

**Prerequisite:** ALL of the following must be true before this task runs:
- All 8 sidebar tabs render inside `SidebarPanel` (Tasks 10A-10H complete)
- All inspector states render inside `InspectorPanel`
- Task 26 integration testing passes with 0 failures
- Old `LeftSidebar.tsx` and `ProInspector.tsx` are not imported anywhere

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/editor/shell/AquibraStudio.tsx`
- Delete: `src/editor/sidebar/LeftSidebar.tsx`
- Delete: `src/editor/inspector/ProInspector.tsx`

- [ ] **Step 1:** Run `grep -r "LeftSidebar\|ProInspector" src/ --include="*.tsx" --include="*.ts"` — must return 0 results (if any exist, fix imports first)
- [ ] **Step 2:** Remove `if (__EDITOR_V2__)` branching from `AquibraStudio.tsx` — keep only the new path
- [ ] **Step 3:** Delete `src/editor/sidebar/LeftSidebar.tsx` and `src/editor/sidebar/LeftSidebar.css`
- [ ] **Step 4:** Delete `src/editor/inspector/ProInspector.tsx`
- [ ] **Step 5:** Remove `__EDITOR_V2__` from `vite.config.ts` define block
- [ ] **Step 6:** Remove `declare const __EDITOR_V2__: boolean;` from `src/vite-env.d.ts`
- [ ] **Step 7:** Run `npx tsc --noEmit` — must pass with 0 errors
- [ ] **Step 8:** Run `npx vitest run` — must pass with 0 failures
- [ ] **Step 9:** Commit: `feat: remove __EDITOR_V2__ flag — redesign complete, legacy shell deleted`
