# Buildrik Editor Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Buildrik editor UI in Pencil.dev, then connect the new designs to the existing Composer engine — without touching engine code.

**Architecture:** Design-first approach. Each phase designs screens in Pencil, validates with prototypes, then the code phase swaps `src/editor/*` components to match. Engine (`src/engine/`) stays untouched. Shared types and hooks stay. Only the UI shell changes.

**Tech Stack:** Pencil.dev (design + prototyping), React 18 + TypeScript + Emotion (implementation), existing Composer engine APIs

---

## Dependency Map

```
Phase 1: Design System (08) ← everything depends on this
Phase 2: Shell & Navigation (01) ← defines the container for everything
Phase 3: Canvas (02) + Inspector (03) ← the core editing experience, parallel
Phase 4: CMS (04) + Export (07) ← feature surfaces, parallel
Phase 5: AI (05) + Collaboration (06) ← advanced surfaces, parallel
Phase 6: Integration Testing + Polish
```

**Why this order:**
- Design System first — colors, typography, spacing tokens define every other screen
- Shell second — the layout grid (top bar, rail, sidebar, canvas, inspector) is the container. Can't design panels without knowing the container.
- Canvas + Inspector parallel — these are the core editing pair. Inspector depends on canvas selection but they can be designed together.
- CMS + Export parallel — independent feature surfaces that plug into the shell
- AI + Collab last — they overlay on top of existing surfaces (inspector, canvas, top bar)

---

## Phase 1: Design System Foundation

**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/08-design-system.md`
**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/00-overview.md` (principles V1-V6)

**Why first:** Every screen, every component, every surface will use these tokens. Designing anything else without this foundation = inconsistency.

### Task 1.1: Define Core Design Tokens in Pencil

**Output:** Pencil design system file with all base tokens

- [ ] **Step 1:** Create a new Pencil project for Buildrik Editor redesign
- [ ] **Step 2:** Define color tokens — surface hierarchy (dark backgrounds, 4-5 steps from darkest to lightest), text hierarchy (primary/secondary/muted/disabled via opacity), one accent color (indigo family), semantic colors (success green, warning amber, error red)
- [ ] **Step 3:** Define typography tokens — two font families (sans-serif for labels, monospace for values per P1/P4), size scale, weight scale
- [ ] **Step 4:** Define spacing tokens — 4px grid (per V2), all standard gaps/paddings
- [ ] **Step 5:** Define border tokens — subtle borders for surface separation (per V5), focus ring for interactive elements
- [ ] **Step 6:** Define elevation — surface color steps only, shadows reserved for floating elements only (per V5)
- [ ] **Step 7:** Take screenshot of token sheet, validate against principles V1-V6

### Task 1.2: Define Component Patterns in Pencil

**Output:** Reusable component library in Pencil

- [ ] **Step 1:** Panel header pattern — icon + title + pin + close (used by ALL sidebar tabs per V6)
- [ ] **Step 2:** Search bar pattern — used in Build, Layers, Media, History, Command Palette
- [ ] **Step 3:** Accordion section pattern — collapsible section with chevron (used in inspector + sidebar)
- [ ] **Step 4:** Input controls — number input with unit selector, dropdown, toggle, color swatch, segmented control, slider
- [ ] **Step 5:** Button styles — primary (accent), ghost (border), destructive (red), icon-only
- [ ] **Step 6:** Badge/chip styles — status (published/draft), tag (element type), shortcut key
- [ ] **Step 7:** Modal pattern — header + body + footer, backdrop, close behavior
- [ ] **Step 8:** Toast pattern — success, error, warning, info with dismiss
- [ ] **Step 9:** Validate all components use only tokens from Task 1.1

---

## Phase 2: Shell & Navigation

**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/01-shell-navigation.md`
**Depends on:** Phase 1 (design tokens + component patterns)

### Task 2.1: Design Editor Shell Layout in Pencil

**Output:** Master layout frame showing all zones

- [ ] **Step 1:** Design the 5-zone layout grid — Top Bar + Rail + Sidebar + Canvas + Inspector
- [ ] **Step 2:** Design canvas footer / bottom bar within the canvas zone
- [ ] **Step 3:** Validate proportions at 1440×900 (design target) and 1024×768 (minimum)
- [ ] **Step 4:** Show collapsed states — sidebar closed, inspector closed, both closed
- [ ] **Step 5:** Take screenshot, validate against principles

### Task 2.2: Design Top Bar in Pencil

**Output:** Top bar designs for all states

- [ ] **Step 1:** Design top bar with 7 controls: logo+name, save status, undo/redo, device switcher, preview, publish, share/avatar
- [ ] **Step 2:** Design top bar states: idle (saved), dirty (unsaved), saving, error, publishing, collaborators present
- [ ] **Step 3:** Validate: is every control necessary? Does it feel minimal like Linear? (principle V1)

### Task 2.3: Design Rail in Pencil

**Output:** Rail with icon grouping

- [ ] **Step 1:** Design rail with 8 icons — top group (Build, Media, Layers, Templates, Pages) + bottom group (Design, Settings, History)
- [ ] **Step 2:** Design icon states: default, hover, active (panel open), focused (keyboard)
- [ ] **Step 3:** Design tooltip pattern: tab name + keyboard shortcut
- [ ] **Step 4:** Validate: can user distinguish groups? Does active state pop?

### Task 2.4: Design Sidebar System in Pencil

**Output:** Sidebar with header pattern + 2-3 sample tabs

- [ ] **Step 1:** Design the consistent panel header (icon + title + pin + close) — must be IDENTICAL across all tabs (V6)
- [ ] **Step 2:** Design Build tab content as reference tab (search + favorites + categories + element grid)
- [ ] **Step 3:** Design Settings tab as drill-in reference (card grid → sub-screen with back navigation)
- [ ] **Step 4:** Design sidebar states: open-pinned, open-unpinned, collapsed, drag-to-resize (right edge)
- [ ] **Step 5:** Validate: do both tabs feel like they're part of the same system?

### Task 2.5: Design Canvas Footer in Pencil

**Output:** Canvas footer with overlay toggles + zoom

- [ ] **Step 1:** Design footer with left zone (overlay toggles: Grid, Guides, Spacing, Badges, X-Ray, Rulers) and right zone (zoom controls + help)
- [ ] **Step 2:** Design toggle on/off states
- [ ] **Step 3:** Optional: AI sparkle icon placement

---

## Phase 3: Canvas + Inspector (Parallel)

**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/02-canvas-interactions.md`
**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/03-inspector-properties.md`
**Depends on:** Phase 2 (shell layout defines the canvas and inspector zones)

### Task 3.1: Design Canvas States in Pencil

**Output:** Canvas designs for key interaction states

- [ ] **Step 1:** Design empty state — welcoming CTA (Browse Templates + Start Blank)
- [ ] **Step 2:** Design idle state — white canvas on dark background, page content visible
- [ ] **Step 3:** Design hover state — subtle outline + element type badge
- [ ] **Step 4:** Design selected state — indigo outline + 8 resize handles + floating toolbar
- [ ] **Step 5:** Design multi-select — group bounding box + multi-select toolbar
- [ ] **Step 6:** Design inline text editing — cursor + formatting toolbar (bold/italic/underline/link)
- [ ] **Step 7:** Design drag-from-sidebar — ghost + valid/invalid drop zones + insertion indicator
- [ ] **Step 8:** Design context menu — right-click element actions

### Task 3.2: Design Inspector in Pencil

**Output:** Inspector designs for all states and key sections

- [ ] **Step 1:** Design inspector header — element identity, breadcrumb, pseudo-state row, breakpoint pills, tab bar, DevMode toggle
- [ ] **Step 2:** Design empty state (nothing selected) — page info + tips
- [ ] **Step 3:** Design Layout tab with 2-3 key sections (Display, Flexbox, Spacing with box model)
- [ ] **Step 4:** Design Style tab with 2-3 key sections (Typography, Background, Border)
- [ ] **Step 5:** Design Effects tab with 1-2 key sections (Shadows, AI Suggestions)
- [ ] **Step 6:** Design multi-select toolbar — align, distribute, size match
- [ ] **Step 7:** Design pseudo-state editing mode — amber indicator, override dots
- [ ] **Step 8:** Design breakpoint override indicators — blue dots, tooltip showing desktop value
- [ ] **Step 9:** Validate: does inspector feel like Webflow density? Are values shown as real CSS (P1)?

### Task 3.3: Create Core Editing Flow Prototype in Pencil

**Output:** Clickable prototype of the main editing journey

- [ ] **Step 1:** Wire prototype: empty canvas → drag element → select → edit in inspector → see canvas update
- [ ] **Step 2:** Wire: select text → double-click → inline edit → formatting toolbar
- [ ] **Step 3:** Wire: switch device (desktop → tablet) → see breakpoint indicator change in inspector
- [ ] **Step 4:** Test the prototype — does the flow feel connected (U3)?

---

## Phase 4: CMS + Export (Parallel)

**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/04-cms-data-binding.md`
**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/07-export-publish.md`
**Depends on:** Phase 3 (CMS uses inspector chain icons, Export uses sidebar publish tab)

### Task 4.1: Design CMS Screens in Pencil

**Output:** Full CMS flow screens

- [ ] **Step 1:** Design Collection Setup modal — name + field schema (field type, required, reorder)
- [ ] **Step 2:** Design record management — add/edit/delete records in table or card view
- [ ] **Step 3:** Design binding dropdown — chain icon click → collection → field picker
- [ ] **Step 4:** Design bound state — field shows "Collection.Field" badge, read-only
- [ ] **Step 5:** Design CMS preview — record navigator "Record 1 of N" above CMS List on canvas
- [ ] **Step 6:** Design the "Data" category in Build tab containing CMS List element

### Task 4.2: Create CMS Flow Prototype in Pencil

**Output:** Clickable CMS prototype

- [ ] **Step 1:** Wire: drag CMS List → Collection Setup opens → create → bind fields → preview with data
- [ ] **Step 2:** Test: does the flow complete without dead-ends (U3)?

### Task 4.3: Design Export & Publish Screens in Pencil

**Output:** Export modal + Publish tab designs

- [ ] **Step 1:** Design Publish tab in sidebar — status badge, checklist (all items wired), URL, publish button, error/success states
- [ ] **Step 2:** Design Export modal — 5 format cards (HTML, React, Vue, Next.js, ZIP), page selection, download/preview buttons
- [ ] **Step 3:** Design states: publishing-in-progress, publish success, publish error with retry
- [ ] **Step 4:** Design code preview panel (see generated code before download)

---

## Phase 5: AI + Collaboration (Parallel)

**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/05-ai-surfaces.md`
**Spec:** `docs/superpowers/specs/2026-03-21-editor-redesign/06-collaboration.md`
**Depends on:** Phase 3 (AI overlays on canvas + inspector, Collab overlays on canvas + top bar)

### Task 5.1: Design AI Surfaces in Pencil

**Output:** AI assistant bar + copilot modal + inspector suggestions

- [ ] **Step 1:** Design AI Assistant Bar (Ctrl+J) — slides up from bottom of canvas, prompt input, context-aware placeholder, quick suggestions
- [ ] **Step 2:** Design AI Copilot modal — full-screen, prompt textarea, template chips, generate progress, preview with accept/reject
- [ ] **Step 3:** Design AI Suggestions section in inspector Effects tab — 3 suggestions with apply buttons
- [ ] **Step 4:** Design AI states: generating (loading), result preview, error/unavailable

### Task 5.2: Design Collaboration Surfaces in Pencil

**Output:** Presence + cursors + invite flow

- [ ] **Step 1:** Design presence avatars in top bar — avatar stack, overflow count, hover tooltip
- [ ] **Step 2:** Design live cursors on canvas — colored arrows + name labels
- [ ] **Step 3:** Design selection awareness — other users' colored outlines + name badges
- [ ] **Step 4:** Design invite/share flow — share button → link/email invite → permission picker
- [ ] **Step 5:** Design connection quality indicator — green/amber/red/gray states

### Task 5.3: Create AI Flow Prototype in Pencil

**Output:** Clickable prototype

- [ ] **Step 1:** Wire: select element → Ctrl+J → type prompt → generate → preview on canvas → apply/reject
- [ ] **Step 2:** Wire: open copilot → describe page → generate → preview → accept as new page

---

## Phase 6: Remaining Sidebar Tabs + Integration

**Depends on:** All previous phases (uses all established patterns)

### Task 6.1: Design Remaining Sidebar Tabs in Pencil

**Output:** All sidebar tabs fully designed

- [ ] **Step 1:** Design Media tab — source toggle (My Files/Stock), upload zone, library grid, asset detail, icon picker
- [ ] **Step 2:** Design Layers tab — element tree, visibility toggle, drag reorder, canvas sync, empty state
- [ ] **Step 3:** Design Templates tab — template grid, filter chips, preview modal, apply progress
- [ ] **Step 4:** Design Pages tab — page list, context menu, page settings drawer (SEO/Social/Advanced)
- [ ] **Step 5:** Design History tab — versions view (named + auto-saves), activity view, search
- [ ] **Step 6:** Design Design System tab — color/type/spacing tokens, draft indicator, review modal, export
- [ ] **Step 7:** Design all remaining Settings sub-screens — Site Settings, Domains, Analytics, Integrations, Advanced, Export

### Task 6.2: Design Modals & Overlays in Pencil

**Output:** All modal types designed

- [ ] **Step 1:** Design Command Palette (Ctrl+K) — search input, grouped results, keyboard navigation
- [ ] **Step 2:** Design Keyboard Cheat Sheet — two-column shortcut reference
- [ ] **Step 3:** Design Upgrade modal — gradient header, feature list, CTA
- [ ] **Step 4:** Design Project Settings modal — General/SEO/Domain/Advanced tabs
- [ ] **Step 5:** Design onboarding flow — Welcome modal, checklist, spotlight, achievement prompt

### Task 6.3: Full Flow Integration Test in Pencil

**Output:** Complete prototype covering the main user journey

- [ ] **Step 1:** Wire full flow: open editor → browse templates → apply template → select element → edit in inspector → add CMS data → bind to element → preview → publish
- [ ] **Step 2:** Wire secondary flow: open editor → use AI copilot → generate page → style elements → export as React
- [ ] **Step 3:** Validate: every flow completes without dead-ends. Every principle (P1-P4, U1-U6, V1-V6) holds.
- [ ] **Step 4:** Get stakeholder review on complete prototype before moving to code

---

## Phase 7: Code Implementation (After Pencil designs approved)

**This phase starts ONLY after all Pencil designs are reviewed and approved.**

### Task 7.0: Implement Design System Tokens FIRST

**Files:**
- Modify: `src/themes/default.css`
- Modify: `src/shared/ui/*`

- [ ] **Step 1:** Update CSS custom properties to match Pencil design tokens (colors, typography, spacing, borders)
- [ ] **Step 2:** Update shared UI primitives (Button, Modal, Input, etc.) to use new tokens
- [ ] **Step 3:** Verify existing editor still renders (no visual regressions in unchanged components)
- [ ] **Step 4:** Commit: "feat: updated design system tokens"

**Note:** This must happen BEFORE any other code task. All subsequent tasks build on these tokens.

### Task 7.1: Set Up New Editor Shell

**Files:**
- Modify: `src/editor/shell/AquibraStudio.tsx`
- Modify: `src/editor/shell/StudioHeader.tsx`
- Modify: `src/editor/shell/StudioPanels.tsx`
- Modify: `src/editor/rail/LeftRail.tsx`
- Modify: `src/editor/rail/LayoutShell.tsx`

- [ ] **Step 1:** Implement new top bar layout matching Pencil design (7 controls)
- [ ] **Step 2:** Implement new rail with grouped icons (8 icons, top/bottom groups)
- [ ] **Step 3:** Implement canvas footer bar with overlay toggles + zoom
- [ ] **Step 4:** Implement sidebar pin/unpin/collapse state machine + drag-to-resize
- [ ] **Step 5:** Implement inspector collapse/expand
- [ ] **Step 6:** Verify all keyboard shortcuts still work
- [ ] **Step 7:** Commit: "feat: new editor shell layout"

### Task 7.2: Implement Updated Inspector

**Files:**
- Modify: `src/editor/inspector/ProInspector.tsx`
- Modify: `src/editor/inspector/sections/*`
- Modify: `src/editor/inspector/config/propertiesRegistry.ts`

- [ ] **Step 1:** Implement context-aware section visibility (flex controls only on flex elements)
- [ ] **Step 2:** Implement empty state (nothing selected → page info)
- [ ] **Step 3:** Implement pseudo-state editing mode with visual indicators
- [ ] **Step 4:** Implement breakpoint override dots
- [ ] **Step 5:** Verify all inspector sections render per Pencil design
- [ ] **Step 6:** Commit: "feat: context-aware inspector with pseudo-state editing"

### Task 7.3: Implement Canvas Polish

**Files:**
- Modify: `src/editor/canvas/Canvas.tsx`
- Modify: `src/editor/canvas/CanvasEmptyCTA.tsx`
- Modify: `src/editor/canvas/hooks/*`
- Modify: `src/editor/canvas/overlays/*`

- [ ] **Step 1:** Implement canvas empty state CTA
- [ ] **Step 2:** Implement floating element toolbar
- [ ] **Step 3:** Implement improved resize handles with modifier keys
- [ ] **Step 4:** Implement snap line visual feedback
- [ ] **Step 5:** Implement drop zone highlighting (valid/invalid)
- [ ] **Step 6:** Implement inline text formatting toolbar
- [ ] **Step 7:** Commit: "feat: polished canvas interactions"

### Task 7.4: Implement CMS Surfaces

**Files:**
- Create: `src/editor/cms/CollectionSetupModal.tsx`
- Create: `src/editor/cms/RecordManager.tsx`
- Create: `src/editor/cms/BindingDropdown.tsx`
- Create: `src/editor/cms/CMSPreviewBar.tsx`
- Modify: `src/editor/inspector/` (add chain icon to bindable fields)

- [ ] **Step 1:** Implement Collection Setup modal → wired to `composer.cmsManager`
- [ ] **Step 2:** Implement Record CRUD UI (table/card view + CSV import) → wired to `composer.cmsManager`
- [ ] **Step 3:** Implement Binding dropdown in inspector → wired to `composer.cmsBindings`
- [ ] **Step 4:** Implement CMS preview bar with record navigator
- [ ] **Step 5:** Commit: "feat: CMS data binding surfaces"

### Task 7.5: Implement AI Surfaces

**Files:**
- Modify: `src/ai/AIAssistantBar.tsx`
- Modify: `src/ai/AICopilot.tsx`
- Create: `src/editor/inspector/sections/AISuggestionsSection.tsx`

- [ ] **Step 1:** Redesign AI Assistant Bar per Pencil design → wire to ContentWriter
- [ ] **Step 2:** Redesign AI Copilot modal per Pencil design → wire to PageGenerator
- [ ] **Step 3:** Implement AI Suggestions inspector section → wire to LayoutAnalyzer
- [ ] **Step 4:** Add AI entry points: Ctrl+J, canvas footer icon, context menu, command palette
- [ ] **Step 5:** Commit: "feat: AI surfaces wired to engine modules"

### Task 7.6: Implement Collaboration Surfaces

**Files:**
- Modify: `src/editor/collaboration/PresenceIndicators.tsx`
- Create: `src/editor/collaboration/LiveCursors.tsx`
- Create: `src/editor/collaboration/SelectionAwareness.tsx`
- Create: `src/editor/collaboration/InviteModal.tsx`

- [ ] **Step 1:** Redesign presence avatars per Pencil design
- [ ] **Step 2:** Implement live cursor rendering on canvas → wire to `composer.collaboration`
- [ ] **Step 3:** Implement selection awareness overlays
- [ ] **Step 4:** Implement invite/share flow
- [ ] **Step 5:** Commit: "feat: collaboration UI surfaces"

### Task 7.7: Implement Export & Publish Fix

**Files:**
- Modify: `src/editor/sidebar/tabs/publish/PublishTab.tsx`
- Modify: `src/editor/export/ExportModal.tsx`

- [ ] **Step 1:** Wire publish checklist to real data (fix hardcoded false values)
- [ ] **Step 2:** Enable all 5 export formats in modal (remove "Coming Soon" from working formats)
- [ ] **Step 3:** Implement code preview panel
- [ ] **Step 4:** Commit: "fix: wire publish checklist, enable all export formats"

### Task 7.8: Update Remaining Sidebar Tabs

**Files:**
- Modify: all files in `src/editor/sidebar/tabs/`

- [ ] **Step 1:** Update all tab headers to consistent pattern per Pencil design
- [ ] **Step 2:** Update each tab's content to match Pencil designs
- [ ] **Step 3:** Implement command palette (Ctrl+K)
- [ ] **Step 4:** Implement keyboard cheat sheet modal
- [ ] **Step 5:** Commit: "feat: redesigned sidebar tabs and command palette"

### Task 7.9: Design System Token Refresh

**Files:**
- Modify: `src/themes/default.css`
- Modify: `src/shared/ui/*`
- Modify: `src/features/design-system/`

- [ ] **Step 1:** Update CSS custom properties to match Pencil design tokens
- [ ] **Step 2:** Update shared UI primitives to match new visual language
- [ ] **Step 3:** Connect design tokens to inspector color/font pickers
- [ ] **Step 4:** Commit: "feat: updated design system tokens and UI primitives"

### Task 7.10: Final Integration & QA

- [ ] **Step 1:** Test all keyboard shortcuts (30+) work correctly
- [ ] **Step 2:** Test all 8 sidebar tabs open/close/pin correctly
- [ ] **Step 3:** Test canvas interaction modes: hover, select, drag, resize, inline edit, marquee
- [ ] **Step 4:** Test CMS flow end-to-end: create collection → bind → preview
- [ ] **Step 5:** Test AI flow: Ctrl+J → prompt → generate → apply
- [ ] **Step 6:** Test export: all 5 formats download correctly
- [ ] **Step 7:** Test publish: checklist reflects real data, publish succeeds
- [ ] **Step 8:** Validate against all 16 design principles
- [ ] **Step 9:** Final commit: "feat: editor redesign complete"
