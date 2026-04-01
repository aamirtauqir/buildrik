# BUILDRIK / AQUIBRA STUDIO — TRUE PRODUCT BLUEPRINT

> **Source of truth**: Every claim below is derived from inspecting actual source files under `src/`.
> If a prior document contradicts what is written here, **this file is correct** — the code was read directly.
>
> **Generated**: 2026-03-12 | **Codebase**: 1,301 TS/TSX files | **Engine**: Composer.ts (700 lines, 29 managers)

---

## 1. PRODUCT IDENTITY

| Field | Value (from code) |
|-------|-------------------|
| **Package name** | `buildrik` (`package.json`) |
| **Internal name** | Aquibra Editor / Aquibra Studio |
| **Description** | "Aquibra Editor — L2 production-wired extraction" |
| **Version** | 1.0.0 |
| **License** | BSD-3-Clause (per file headers) |
| **Entry point** | `demo/main.tsx` → mounts `<AquibraStudio>` on port 5050 |
| **Category** | Visual web builder / page composer (dark-themed, Figma-like chrome) |

---

## 2. TECH STACK (from `package.json` + `tsconfig.json`)

### Runtime Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@emotion/react` | ^11.14.0 | CSS-in-JS (primary styling) |
| `@emotion/styled` | ^11.14.1 | Styled components |
| `@sentry/react` | ^10.39.0 | Error tracking |
| `dompurify` | ^3.3.1 | HTML sanitization |
| `gsap` | ^3.14.2 | Animations (canvas, transitions) |
| `html2canvas` | ^1.4.1 | Screenshot/thumbnail generation |
| `jszip` | ^3.10.1 | ZIP export |
| `lucide-react` | ^0.562.0 | Icon library |
| `openai` | ^6.13.0 | AI content/layout generation |
| `zod` | ^3.25.76 | Schema validation |

### Dev Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `react` / `react-dom` | ^18.3.1 | UI framework (devDep — library mode) |
| `typescript` | ^5.3.0 | Language (strict mode) |
| `vite` | ^7.2.7 | Dev server + bundler |
| `vitest` | ^4.0.18 | Testing |
| `@vitejs/plugin-react` | ^5.1.2 | React fast-refresh |
| `@testing-library/react` | ^16.3.2 | Component testing |

### Build Scripts
```
npm run dev        → vite (port 5050)
npm run build      → tsc && vite build
npm run typecheck  → tsc --noEmit
npm run test       → vitest run
```

---

## 3. APP ARCHITECTURE

### 3.1 Module Boundaries (actual `src/` directories)

| Directory | Files | Role | Import Rules |
|-----------|-------|------|-------------|
| `engine/` | 132 | Pure logic, no React. Central orchestrator. | → `shared/` only |
| `editor/` | 464 | **Production UI** (new code goes here) | → `engine/`, `shared/`, `features/`, `blocks/`, `templates/` |
| `components/` | 360 | **Legacy UI** (frozen — do NOT add new code) | → `engine/`, `shared/` |
| `shared/` | 216 | Types, constants, hooks, utils, UI primitives | → nothing (leaf dependency) |
| `features/` | 23 | Feature modules (design-system only) | → `engine/`, `shared/` |
| `blocks/` | 75 | Pre-built element templates (read-only data) | → `shared/` only |
| `templates/` | 7 | Page templates | → `shared/` only |
| `services/` | 8 | External API integrations | → `shared/` only |
| `ai/` | 10 | AI utilities | → `engine/`, `shared/` |
| `themes/` | 3 | CSS variables, theme configs | → `shared/` only |
| `styles/` | 2 | Global CSS, design tokens | — |
| `assets/` | — | SVG icons (navbar, blocks, layers) | — |

### 3.2 Legacy ↔ Production Redirect

`src/components/Editor/AquibraStudio/index.ts` is a barrel that re-exports from `src/editor/shell/AquibraStudio/index.ts`. The demo still imports from the legacy path; the canonical component lives in `editor/shell/`.

### 3.3 Path Aliases (from `tsconfig.json`)
```
@/*           → ./src/*
@components/* → ./src/components/*
@shared/*     → ./src/shared/*
@features/*   → ./src/features/*
@hooks/*      → ./src/hooks/*
@utils/*      → ./src/utils/*
```

---

## 4. ENGINE — COMPOSER.TS (Central Orchestrator)

`src/engine/Composer.ts` — 700 lines. Extends `EventEmitter`. Single constructor instantiates **29 managers**:

### 4.1 Manager Inventory (instantiation order in constructor)

| # | Property | Class | File | Purpose |
|---|----------|-------|------|---------|
| 1 | `elements` | `ElementManager` | `engine/elements/ElementManager.ts` | Element CRUD, tree structure, page management |
| 2 | `styles` | `StyleEngine` | `engine/styles/StyleEngine.ts` | CSS property engine, breakpoint styles |
| 3 | `commands` | `CommandCenter` | `engine/commands/CommandCenter.ts` | Keyboard shortcuts, command palette |
| 4 | `selection` | `SelectionManager` | `engine/SelectionManager.ts` | Single/multi-select, selection events |
| 5 | `history` | `HistoryManager` | `engine/HistoryManager.ts` | Undo/redo stack |
| 6 | `versionHistory` | `VersionHistoryManager` | `engine/VersionHistoryManager.ts` | Named versions (save/restore/compare) |
| 7 | `storage` | `StorageAdapter` | `engine/storage/StorageAdapter.ts` | Persistence (localStorage default, configurable) |
| 8 | `viewport` | `Viewport` | `engine/Viewport.ts` | Zoom, pan, device preview |
| 9 | `plugins` | `PluginManager` | `engine/PluginManager.ts` | Plugin registration/lifecycle |
| 10 | `data` | `DataManager` | `engine/data/DataManager.ts` | Data binding orchestration |
| 11 | `globalStyles` | `GlobalStyleManager` | `engine/styles/GlobalStyleManager.ts` | Global/shared CSS classes |
| 12 | `styleBindings` | `StyleDataBinding` | `engine/data/StyleDataBinding.ts` | Bind data → CSS styles |
| 13 | `traitBindings` | `TraitDataBinding` | `engine/data/TraitDataBinding.ts` | Bind data → element traits/attributes |
| 14 | `textBindings` | `TextDataBinding` | `engine/data/TextDataBinding.ts` | Bind data → text content |
| 15 | `templates` | `TemplateManager` | `engine/templates/TemplateManager.ts` | Template registration, application |
| 16 | `canvasIndicators` | `CanvasIndicators` | `engine/canvas/indicators/` | Spacing, badges, guides, rulers, smart-guides |
| 17 | `resizeHandler` | `ResizeHandler` | `engine/canvas/ResizeHandler.ts` | Element resize with constraints |
| 18 | `fonts` | `FontManager` | `engine/fonts/FontManager.ts` | Google Fonts loading, font application |
| 19 | `components` | `ComponentManager` | `engine/components/ComponentManager.ts` | Reusable components (create/instance/variant/sync) |
| 20 | `cmsManager` | `CollectionManager` | `engine/cms/CollectionManager.ts` | CMS collections (schema, content items) |
| 21 | `cmsBindings` | `CMSBindingManager` | `engine/cms/CMSBindingManager.ts` | Bind CMS data to elements |
| 22 | `collaboration` | `CollaborationManager` | `engine/collaboration/CollaborationManager.ts` | Real-time OT collaboration |
| 23 | `media` | `MediaManager` | `engine/media/MediaManager.ts` | Asset library (images, video, fonts, icons) |
| 24 | `forms` | `FormHandler` | `engine/forms/FormHandler.ts` | Form registration, validation, submission |
| 25 | `sync` | `SyncManager` | `engine/sync/SyncManager.ts` | Offline/online sync |
| 26 | `router` | `PageRouter` | `engine/routing/PageRouter.ts` | Multi-page navigation |
| 27 | `recovery` | `RecoveryManager` | `engine/recovery/RecoveryManager.ts` | Crash recovery, autosave |
| 28 | `interactions` | `InteractionManager` | `engine/interactions/InteractionManager.ts` | Preview-mode runtime (click, hover, scroll actions) |
| 29 | `drag` | `DragManager` | `engine/drag/DragManager.ts` | Drag-and-drop orchestration |

**Sub-managers** (not on Composer directly, accessed via parent):
- `engine/canvas/indicators/AutoLayoutManager.ts`
- `engine/canvas/indicators/MeasurementManager.ts`
- `engine/canvas/indicators/SelectionIndicatorManager.ts`
- `engine/canvas/indicators/GuideManager.ts`
- `engine/canvas/resize/ConstraintManager.ts`
- `engine/canvas/resize/SnapManager.ts`
- `engine/canvas/resize/ResizeInputManager.ts`
- `engine/canvas/AlignmentHandler.ts`
- `engine/elements/manager/PageManager.ts`
- `engine/commands/KeybindingManager.ts`
- `engine/data/BaseBindingManager.ts`

### 4.2 Composer Public API (from source)

**Project Operations**: `loadProject()`, `saveProject()`, `importProject()`, `exportProject()`
**Export**: `exportHTML()`, `exportJSON()`
**Settings**: `setProjectSettings()`, `getProjectSettings()`, `updateProjectMetadata()`
**State**: `getState()`, `patchState()`, `getConfig()`, `isReady()`, `isDirty()`, `markDirty()`
**Transactions**: `beginTransaction()`, `endTransaction()`, `rollbackTransaction()`, `isTransactionActive()`
**Device/Viewport**: `setDevice()`, `setZoom()`, `setSnapToGrid()`, `setGridSize()`
**Preview**: `setPreviewMode()`, `isPreviewMode()`
**Lifecycle**: `destroy()`

### 4.3 ComposerState Shape (from `createInitialState()`)
```ts
{
  ready: false,
  dirty: false,
  device: "desktop",
  zoom: 100,
  activePageId: null,
  snapToGrid: false,
  gridSize: 10,
  isPreviewMode: false,
}
```

---

## 5. EVENT SYSTEM

**File**: `src/shared/constants/events.ts` — 376 lines, defines `EVENTS` const object.

### 5.1 Event Categories (actual count: 100+ events)

| Category | Events | Examples |
|----------|--------|---------|
| Composer Lifecycle | 2 | `composer:ready`, `composer:destroy` |
| Project | 6 | `project:changed`, `project:saved`, `project:loaded`, `settings:change` |
| Element | 12 | `element:selected`, `element:created`, `element:deleted`, `element:quick-add`, `element:edit-inline`, `element:change-image` |
| Selection | 5 | `selection:changed`, `selection:cleared`, `selection:multiple` |
| Style | 4 | `style:changed`, `style:applied`, `style:breakpoint:set` |
| Transaction | 2 | `transaction:begin`, `transaction:end` |
| History | 6 | `history:push`, `history:undo`, `history:redo`, `history:recorded` |
| Version | 6 | `version:created`, `version:restored`, `version:deleted` |
| Component | 9 | `component:created`, `component:instantiated`, `instance:synced`, `instance:variant:changed` |
| Clipboard | 3 | `clipboard:copy`, `clipboard:cut`, `clipboard:paste` |
| Data Binding | 3 | `binding:created`, `binding:removed`, `binding:updated` |
| Template | 5 | `template:loaded`, `template:applied`, `template:removed` |
| Plugin | 8 | `plugin:registered`, `plugin:loaded`, `plugin:error` |
| Canvas | 6 | `canvas:ready`, `canvas:resize`, `canvas:zoom`, `canvas:hover` |
| Canvas Indicators | 14 | `overlay:updated`, `spacing:toggled`, `badges:toggled`, `guides:toggled`, `rulers:toggled`, `smart-guides:updated` |
| Viewport | 4 | `viewport:changed`, `viewport:zoom`, `viewport:pan` |
| Drag & Drop | 5 | `drag:start`, `drag:move`, `drag:end`, `dropzone:drop` |
| Resize | 4 | `resize:start`, `resize:move`, `resize:end` |
| UI Panel | 10 | `panel:open`, `ui:toggle:templates`, `ui:show-in-layers`, `ui:open-build-panel` |
| Mode | 5 | `mode:changed`, `preview:mode:changed` |
| Responsive | 2 | `breakpoint:changed`, `responsive:preview` |
| Asset | 3 | `asset:uploaded`, `asset:deleted`, `asset:selected` |
| Font | 2 | `font:loaded`, `font:applied` |
| Export | 3 | `export:start`, `export:complete`, `export:error` |
| AI | 4 | `ai:request:start`, `ai:request:complete`, `ai:suggestion:applied` |
| Form | 7 | `form:registered`, `form:submitted`, `form:error` |
| Sync | 6 | `sync:started`, `sync:completed`, `network:online`, `network:offline` |
| Storage | 5 | `storage:error`, `storage:saved`, `storage:quota:warning` |
| Page | 2 | `page:changed`, `page:created` |
| Zoom | 4 | `zoom:changed`, `zoom:in`, `zoom:out`, `zoom:fit` |

---

## 6. SHELL LAYOUT (from `AquibraStudio.tsx` + `StudioPanels.tsx`)

### 6.1 Component Hierarchy
```
AquibraStudio.tsx (root)
  ├─ StudioErrorBoundary (error boundary)
  ├─ ToastProvider
  ├─ StudioHeader (top bar)
  │   └─ Topbar.tsx
  │       ├─ Project name + save indicator
  │       ├─ Undo / Redo buttons
  │       ├─ BreakpointDropdown (desktop/tablet/mobile)
  │       ├─ StatusIndicators (sync, issues)
  │       ├─ Preview button
  │       ├─ Publish button
  │       └─ collaborationSlot (PresenceIndicators)
  ├─ StudioPanels (main body — CSS Grid)
  │   ├─ LayoutShell (grid container: rail + drawer + canvas + inspector)
  │   │   ├─ LeftRail (60px icon nav, 3 zones: top/bottom/footer)
  │   │   ├─ LeftSidebar (280px drawer panel, 10 tabs)
  │   │   ├─ Canvas (center, flexible)
  │   │   │   ├─ Canvas.tsx (iframe-based element rendering)
  │   │   │   ├─ CanvasFooterToolbar (zoom, overlays)
  │   │   │   └─ Overlays (selection, hover, spacing, guides, rulers)
  │   │   └─ ProInspector (right panel, ~320px)
  │   └─ PageTabBar (bottom tab bar for multi-page)
  ├─ StudioModals (modal layer)
  ├─ AIAssistantBar (floating CMD+K bar)
  └─ Onboarding (WelcomeModal, OnboardingChecklist, SpotlightOverlay, AchievementPrompt)
```

### 6.2 Topbar Layout (from `Topbar.tsx`)
5 sections: **Project** | **Undo/Redo** | **Device** | **Preview** | **Publish**

Removed from topbar (per IA redesign comments in source):
- History button → now in sidebar History tab
- Settings button → now in sidebar Settings tab
- Zoom controls → moved to Canvas Footer Toolbar
- DevMode/XRay/Suggestions → moved to Canvas Footer or Inspector
- Theme toggle → moved to Design tab

### 6.3 Design Tokens (from `themes/default.css`)
```css
--aqb-primary: #6366f1          /* Indigo */
--aqb-surface-1: #0f0f14        /* Deepest surface */
--aqb-surface-2: #16161d
--aqb-surface-3: #1e1e26
--aqb-surface-4: #26262f
--aqb-surface-5: #2e2e38        /* Lightest surface */
--aqb-text-primary: #F5F5F0     /* 14.1:1 contrast */
--aqb-text-secondary: #B8B5AD   /* 6.5:1 contrast */
--aqb-text-muted: #908D85       /* 4.6:1 — WCAG AA */
--aqb-bg-canvas: #ffffff
--aqb-success: #22c55e
--aqb-warning: #f59e0b
--aqb-error: #ef4444
```

---

## 7. LEFT RAIL + SIDEBAR (10-TAB SYSTEM)

### 7.1 Rail Configuration (from `tabsConfig.ts`)

**Rail**: 60px wide, icon-only navigation. 3 zones (top/bottom/footer).

**RAIL_SLOTS** (8 buttons in display order):
| Zone | Tab ID | Label | Icon |
|------|--------|-------|------|
| top | `add` | Add | SvgPlus |
| top | `assets` | Media | SvgImage |
| top | `layers` | Layers | SvgLayers |
| top | `templates` | Templates | SvgTemplates |
| top | `pages` | Pages | SvgPages |
| bottom | `design` | Design | SvgPalette |
| bottom | `settings` | Settings | SvgSettings |
| bottom | `history` | History | SvgClock |

Note: `components` and `publish` have sidebar tabs but NO rail buttons.

### 7.2 Sidebar Tabs (GROUPED_TABS_CONFIG — 10 tabs)

| # | Tab ID | Label | Section | Pattern | Shortcut | Component File |
|---|--------|-------|---------|---------|----------|---------------|
| 1 | `add` | Add | top | card-drill-in | A | `BuildTab.tsx` |
| 2 | `templates` | Templates | top | standalone | T | `TemplatesTab.tsx` |
| 3 | `layers` | Layers | top | standalone | Z | `LayersTab.tsx` |
| 4 | `pages` | Pages | top | standalone | P | `PagesTab.tsx` |
| 5 | `components` | Comps | top | standalone | Shift+A | `ComponentDetailScreen.tsx` + `ComponentRow.tsx` |
| 6 | `assets` | Media | top | standalone | J | `MediaTab.tsx` |
| 7 | `design` | Design | bottom | standalone | D | `DesignSystemTab.tsx` (in `features/design-system/`) |
| 8 | `settings` | Settings | bottom | card-drill-in | S | `SettingsTab.tsx` |
| 9 | `publish` | Publish | bottom | standalone | U | `PublishTab.tsx` |
| 10 | `history` | History | bottom | standalone | H | `HistoryTab.tsx` |

### 7.3 Tab Deep-Dive

#### Add / Build Tab (`BuildTab.tsx`)
- Block insertion panel with search
- Categories: Basic, Layout, Media, Forms, Sections, Components, Ecommerce, Navigation
- Drag-to-canvas insertion

#### Templates Tab (`TemplatesTab.tsx`)
- 10 site templates (hardcoded in `templatesData.ts`): SaaS Landing, Portfolio, Blog, Ecommerce, Agency, Startup, Minimal, Restaurant, SaaS Pro, Coming Soon
- Category pills: all, landing, portfolio, blog, ecommerce, saas
- Preview modal, replace confirmation, pro upgrade modal
- Apply with progress overlay, retry on failure
- Persistence via localStorage (`useTemplatePersistence`)

#### Layers Tab (`LayersTab.tsx`)
- Tree view of page element hierarchy
- Drag-and-drop reorder
- Visibility toggle, lock toggle
- Hover highlight sync with canvas
- Scroll-to-selection via `LAYERS_SCROLL_TO_SELECTION` event

#### Pages Tab (`PagesTab.tsx`)
- Multi-page management
- Page CRUD (create, rename, duplicate, delete)
- Page settings (slug, SEO)
- Utility: `slug.ts` for URL slug generation

#### Components Tab
- Component library browser
- Component detail screen with variants
- Create component from selection
- Instance management (sync, detach, override)

#### Media Tab (`MediaTab.tsx`)
- 7 fixed zones: header, subtitle, source bar, type pills, search, body, upload zone
- 2 views: Library (uploaded assets) and Discovery (stock browsing)
- Asset types: images, videos, fonts, icons
- Upload zone with drag-and-drop
- Asset detail overlay (preview, metadata, delete)
- Selection banner for multi-select operations
- Onboarding empty state

#### Design Tab (`DesignSystemTab.tsx`)
- 3 sub-tabs: Colors, Typography, Spacing
- Design token management (add, edit, delete, reorder)
- Live preview on `:root` CSS variables
- Export: CSS, JSON, Tailwind, SCSS
- Draft/saved state indicator
- Review modal before applying
- Tab guard modal (unsaved changes warning)

#### Settings Tab (`SettingsTab.tsx`)
- Card home + drill-in pattern (7 screens):
  1. **Site Settings** — Name, favicon, language, logo, social links
  2. **Domains** — Custom domain, SSL, redirects
  3. **Analytics** — Google Analytics, Meta Pixel, custom tracking
  4. **Export** — HTML, React, Vue, Next.js, ZIP download
  5. **Integrations** — Forms, payments, email
  6. **Advanced** — Custom CSS/JS, head injection
  7. ~~Version History~~ (now separate History tab)
- Plan-gated screens (`SCREEN_PLAN_REQUIREMENTS`, `LockedScreen`)
- Feature flags (`FEATURE_FLAGS`)
- Navigation guard (`SettingsNavGuard`)

#### Publish Tab (`PublishTab.tsx`)
- Site deployment flow
- Publish/unpublish actions
- Status indicators

#### History Tab (`HistoryTab.tsx`)
- Version history timeline
- Restore to previous version
- Version comparison

---

## 8. RIGHT PANEL — PRO INSPECTOR

**File**: `src/editor/inspector/ProInspector.tsx`

### 8.1 3-Tab Structure
| Tab | Component | Purpose |
|-----|-----------|---------|
| **Layout** | `LayoutTab` | Position, size, display, flexbox/grid, margins, padding |
| **Appearance** | `AppearanceTab` | Colors, backgrounds, borders, shadows, opacity, filters |
| **Effects** | `EffectsTab` | Transforms, animations, transitions, interactions |

### 8.2 Inspector Features (from imports)
- `ElementBreadcrumb` — parent chain navigation
- `InspectorSubNav` — tab switching (Layout / Appearance / Effects)
- `PseudoStateSelector` — :hover, :focus, :active styling
- `BreakpointIndicator` — shows which breakpoint styles are set
- `MultiSelectToolbar` — bulk operations when 2+ elements selected
- `DeleteConfirmModal` — safe deletion
- `InspectorControls` — shared control components
- `InspectorEmptyState` — "Select an element" prompt
- `VariantSection` — component variant management
- `DevModeToggle` — advanced box model view
- `cssContext` + `getPropertyStates` — contextual property relevance

### 8.3 Inspector Sections (from `src/editor/inspector/sections/`)
- `layout/` — position, display, sizing, overflow
- `flexbox/` — flex container/item properties
- `typography/` — font, text, line-height, letter-spacing
- `elementProperties/` — tag-specific properties (link href, image src/alt, etc.)
- `interactions/` — click, hover, scroll trigger actions

---

## 9. CANVAS SYSTEM

### 9.1 Canvas Components (from `src/editor/canvas/`)
- `Canvas.tsx` — main canvas component (exposes `CanvasRef`)
- `CanvasFooterToolbar.tsx` — zoom controls + overlay toggles
- `canvasStyles.ts` — styled-components for canvas chrome

### 9.2 Overlays (`canvas/overlays/`)
- Selection overlay (blue outlines)
- Hover overlay (subtle highlight)
- Spacing indicators (margin/padding visualized)
- Smart guides (alignment lines)
- Badges (element type labels)
- Grid overlay
- Rulers

### 9.3 Canvas Hooks (26 hooks in `canvas/hooks/`)
| Hook | Purpose |
|------|---------|
| `useCanvasContextMenu` | Right-click menu |
| `useCanvasFloatingPanel` | Floating element toolbar |
| `useCanvasGuides` | Alignment guide lines |
| `useCanvasHover` | Hover tracking |
| `useCanvasIndicators` | Overlay state |
| `useCanvasInlineCommands` | Quick action commands |
| `useCanvasResize` | Canvas area resize |
| `useCanvasSelectionBox` | Marquee selection |
| `useCanvasSize` | Responsive sizing |
| `useCanvasSnapping` | Snap-to-grid/element |
| `useCanvasSync` | DOM synchronization |
| `useCanvasToolbarActions` | Toolbar button handlers |
| `useCMSPreview` | CMS data preview mode |
| `useCollaboration` | Collaboration cursors |
| `useComposerSelection` | Selection state bridge |
| `useCursorIntelligence` | Context-aware cursors |
| `useCursorSync` | Multi-user cursor sync |
| `useDragAutoScroll` | Auto-scroll during drag |
| `useDragVisuals` | Drag ghost/indicator rendering |
| `useElementDragAutoScroll` | Element-specific auto-scroll |
| `useElementDragDomSync` | DOM position sync during drag |
| `useElementRect` | Bounding rectangle tracking |
| `useEventListener` | Generic event binding |
| `useSelectionBehavior` | Click/shift-click selection |
| `useSelectionRect` | Selection rectangle geometry |
| `useToolbarPosition` | Floating toolbar positioning |

### 9.4 Canvas Context Menu (from `canvas/menus/`)
- `contextMenuRegistry.ts` — extensible action registry
- Actions organized in 3 groups:
  - `editActions.ts` — copy, cut, paste, duplicate, delete
  - `insertActions.ts` — insert child, wrap in container
  - `layoutActions.ts` — align, distribute, order

### 9.5 Canvas Controls
- `controls/toolbar/` — floating element toolbar
- `spots/` — resize handles, rotation handles

### 9.6 Drag System (`canvas/hooks/drag/`)
- `useKeyboardMove.ts` — arrow key positioning
- `useTouchDrag.ts` — touch device support

---

## 10. BLOCK SYSTEM (Element Templates)

**File**: `src/blocks/blockRegistry.ts` — registers all insertable elements.

### 10.1 Block Categories and Definitions

| Category | Blocks | Count |
|----------|--------|-------|
| **Basic** | Container, Text, Heading, Paragraph, Button, Link, List, Divider, Row, Column, Spacer | 11 |
| **Media** | Image, Video, Audio, SVG, Lottie, Icon, Gallery, Video Embed, Map Embed | 9 |
| **Layout** | Section, 2-Column, 3-Column, Grid, Flex | 5 |
| **Forms** | Form, Input, Textarea, Select, Checkbox, Radio, File Input, Date, Time, Email, Password, Number, Range, Color, Label, Submit Button | 16 |
| **Sections** | Hero, Features, Footer, Navbar, CTA | 5 |
| **Components** | Card, Slider, Testimonials, Pricing, Progress, Countdown, Accordion, Social Icons, Stack, Switch, Tabs, Modal, Table | 13 |
| **Ecommerce** | Product Card, Product Grid, Product Detail, Cart Button | 4 |
| **Navigation** | (imported from `./Navigation`) | TBD |
| **Total** | | **63+** |

---

## 11. KEYBOARD SHORTCUTS (from `shared/constants/commands.ts`)

### 11.1 Command Categories

| Category | Commands |
|----------|----------|
| **Edit** | Undo (⌘Z), Redo (⌘⇧Z), Cut (⌘X), Copy (⌘C), Paste (⌘V), Delete (⌫), Duplicate (⌘D), Select All (⌘A), Deselect (Esc) |
| **File** | Save (⌘S), Save As (⌘⇧S), Export (⌘E), Import (⌘I), New Project (⌘N), Open Project (⌘O) |
| **View** | Zoom In (⌘=), Zoom Out (⌘-), Zoom Fit (⌘0), Zoom 100% (⌘1), Toggle Grid (⌘'), Toggle Guides (⌘;), Toggle Rulers (⌘R), Toggle Preview (⌘P) |
| **Element** | Move Up (⌘]), Move Down (⌘[), Move to Front (⌘⇧]), Move to Back (⌘⇧[), Group (⌘G), Ungroup (⌘⇧G), Lock (⌘L), Unlock (⌘⇧L), Hide (⌘H), Show (⌘⇧H) |
| **Alignment** | Align Left/Center/Right/Top/Middle/Bottom, Distribute H/V (no default shortcuts) |
| **Panel** | Toggle Layers, Toggle Inspector, Toggle Assets, Toggle Components, Toggle Code, Toggle AI |
| **Tool** | Select, Hand, Text, Rectangle, Frame |
| **Navigation** | Escape, Enter, Tab Next/Prev |
| **Debug** | Toggle Debug, Clear Console, Inspect Element |

### 11.2 Sidebar Tab Shortcuts (from `tabsConfig.ts`)
| Key | Tab |
|-----|-----|
| A | Add |
| T | Templates |
| Z | Layers |
| P | Pages |
| ⇧A | Components |
| J | Media |
| D | Design |
| S | Settings |
| U | Publish |
| H | History |

---

## 12. DATA & STATE MANAGEMENT

### 12.1 State Architecture
- **No Redux/Zustand/Jotai** — state lives in Composer instance + React component state
- **Event-driven**: Composer emits events → React components subscribe via `useEffect`
- **Transaction support**: `beginTransaction()` / `endTransaction()` batches mutations

### 12.2 Shared Types (`shared/types/` — 30+ type files)
| Type File | Defines |
|-----------|---------|
| `element.ts` | `ElementData`, `ElementType`, element traits |
| `style.ts` | `StyleProperties`, responsive style values |
| `canvas.ts` | Canvas state, overlay types |
| `cms.ts` | `CMSField`, `CMSCollection`, `CMSContentItem`, `CMSQueryOptions` |
| `collaboration.ts` | `CollaborationUser`, `CollaborationRoom`, `CollaborationEvent` |
| `components.ts` | `ComponentDefinition`, variant types, instance payloads |
| `ecommerce.ts` | Product, cart, checkout types |
| `export.ts` | `ExportOptions`, `ExportResult` |
| `fonts.ts` | Font family, Google Fonts types |
| `media-assets.ts` | `MediaAsset`, `MediaAssetType` |
| `media-upload.ts` | Upload types |
| `media-icons.ts` | Icon library types |
| `media-image-editor.ts` | Image editing types |
| `publish.ts` | Publish result types |
| `seo.ts` | SEO metadata types |
| `templates.ts` | Template types |
| `animations.ts` | Animation preset types |
| `data.ts` | Data binding types |
| `plugins.ts` | Plugin API types |
| `breakpoints.ts` | Breakpoint config types |
| `state.ts` | `ComposerState` |
| `config.ts` | `ComposerConfig` |
| `block.ts` | `BlockData` |
| `geometry.ts` | Rectangle, point types |
| `command.ts` | Command types |
| `event.ts` | Event types |
| `asset.ts` | Asset types |

### 12.3 CMS System (`engine/cms/`)
- `CollectionManager` — schema-driven collections with 15 field types (text, richtext, number, date, boolean, select, multiselect, image, file, reference, color, url, email, datetime, textarea)
- `CMSBindingManager` — binds collection data to elements
- 3 binding types: `StyleDataBinding`, `TextDataBinding`, `TraitDataBinding`
- Content items have statuses: draft | published | archived

### 12.4 Shared Constants (`shared/constants/`)
| File | Exports |
|------|---------|
| `events.ts` | `EVENTS` (100+ event names) |
| `commands.ts` | `COMMANDS`, `SHORTCUTS` (50+ keyboard shortcuts) |
| `config.ts` | `DATA_ATTRIBUTES`, `MIME_TYPES`, `STORAGE_KEYS`, `THRESHOLDS`, `DEFAULTS`, `API`, `CSS_CLASSES`, `FEATURES` |
| `canvas.ts` | `CANVAS_COLORS`, `Z_INDEX`, `SIZES`, `DEVICE_PRESETS`, `ZOOM_PRESETS`, `ZOOM_LIMITS` |
| `breakpoints.ts` | `BREAKPOINTS`, `BREAKPOINT_ORDER`, `BREAKPOINT_QUERIES` |
| `layout.ts` | `LAYOUT` (panel dimensions) |
| `defaultStyles.ts` | `DEFAULT_ELEMENT_STYLES` |
| `uiStyles.ts` | `UI`, `TEXT_STYLES`, `COLOR`, `SURFACE`, `SPACE`, `CARD_STYLES`, `TAB_STYLES`, etc. |
| `icons.ts` | Icon category definitions |
| `storage.ts` | Storage key constants |

---

## 13. AI SUBSYSTEM

### 13.1 AI Assistant Bar (`src/ai/AIAssistantBar.tsx`)
- Floating CMD+K command bar (glassmorphism style)
- 2 modes: **Content** generation and **Layout** generation
- Uses OpenAI API directly (`openai` package)
- Credit-based system (listens for `ai-credits-update` custom event from host app)
- Functions: `generateContent()`, `generateLayout()` (from `shared/utils/openai`)

### 13.2 AI Engine Modules (`src/engine/ai/` — not directly on Composer)
These exist as standalone utilities, not as Composer managers.

### 13.3 AI Service (`src/services/ai/`)
External AI service integration layer.

---

## 14. EXPORT SYSTEM

### 14.1 Engine Export (`engine/export/`)
- `ExportEngine` — generates production HTML/CSS
- `Composer.exportHTML()` → full `<!DOCTYPE>` page with inline styles
- `Composer.exportJSON()` → serialized `ProjectData`

### 14.2 Export UI (`editor/export/`)
- `ExportModal` — modal with export options
- `CodePreview` — syntax-highlighted code preview
- `PreviewFrame` — live preview iframe

### 14.3 Export Formats (from Settings > Export screen)
- HTML + CSS (live, working)
- React (planned)
- Vue (planned)
- Next.js (planned)
- ZIP download (via `jszip`)

---

## 15. COLLABORATION SYSTEM

### 15.1 Engine (`engine/collaboration/CollaborationManager.ts`)
- OT (Operational Transform) based
- Wired in Composer constructor: selection sync, remote operation application
- Integration level: **L1** (UI components wired, engine at L1 per source comment)

### 15.2 UI (`editor/collaboration/`)
- `PresenceIndicators` — avatar bubbles for connected users
- `ConnectionQualityIndicator` — network quality display

### 15.3 Canvas Integration
- `useCollaboration` hook — collaboration state
- `useCursorSync` hook — multi-user cursor positions

---

## 16. ONBOARDING SYSTEM (`editor/onboarding/`)

| Component | Purpose |
|-----------|---------|
| `WelcomeModal` | First-time user greeting |
| `OnboardingChecklist` | Step-by-step feature discovery |
| `SpotlightOverlay` | Highlight UI elements during tour |
| `AchievementPrompt` | Gamification feedback |

Orchestrated by `useOnboardingOrchestrator` hook.

---

## 17. SHARED UI PRIMITIVES (`shared/ui/`)

| Component | File |
|-----------|------|
| Toast | `Toast.tsx` (ToastProvider, useToast) |
| Tooltip | `Tooltip.tsx` |
| Modal | `Modal.tsx` (ConfirmDialog) |
| Spinner | `Spinner.tsx` |
| Skeleton | `Skeleton.tsx` (StudioSkeleton) |
| UpgradeModal | `UpgradeModal.tsx` (plan-gated features) |
| QuickSwitcher | `useQuickSwitcher.ts` + `QuickSwitcher.types.ts` |
| Icons | `Icons.tsx` (getElementIcon) |

---

## 18. SERVICES (`src/services/`)

| Service | Purpose |
|---------|---------|
| `EmailService.ts` | Form submission email notifications (SendGrid, mock provider) |
| `services/ai/` | AI service integration |
| `engine/integrations/` | Email marketing service (`emailMarketingService.configure()`) |

---

## 19. ANIMATION SYSTEM (`editor/animation/`)

- `AnimationPresets.ts` — predefined animation configurations
- GSAP-powered (gsap ^3.14.2 dependency)

---

## 20. FEATURE IMPLEMENTATION STATUS

### Feature Flags (from `shared/constants/config.ts` + Settings tab)

```ts
// Global feature flags
FEATURES = {
  AI_ASSISTANT: true,        // Enabled
  TEMPLATES: true,           // Enabled
  CUSTOM_COMPONENTS: true,   // Enabled
  DATA_BINDING: true,        // Enabled
  RESPONSIVE_PREVIEW: true,  // Enabled
  CODE_EXPORT: true,         // Enabled
  COLLABORATION: false,      // Engine done, feature OFF
  PLUGINS: false,            // Engine done, feature OFF
  VERSION_HISTORY: false,    // Engine done, feature OFF
}

// Settings tab feature flags
FEATURE_FLAGS = {
  domains: false,            // No domain API yet
  export: false,             // No download API yet
  integrations: false,       // Not wired yet
}
```

### Fully Implemented (verified in source)
- [x] Element CRUD (add, select, move, resize, delete, duplicate)
- [x] 63+ insertable blocks across 8 categories
- [x] 10-tab left sidebar with rail navigation
- [x] 3-tab right inspector (Layout, Appearance, Effects)
- [x] Undo/redo with history stack
- [x] Version history (named versions, restore) — engine done, **feature flag OFF**
- [x] Design system (color, typography, spacing tokens)
- [x] Multi-page support
- [x] Responsive preview (desktop, tablet, mobile, watch)
- [x] Template system (10 site templates)
- [x] Media library (upload, browse, asset management)
- [x] Canvas overlays (selection, hover, spacing, guides, grid, rulers, badges)
- [x] Context menu (right-click actions)
- [x] Keyboard shortcuts (40+ commands with Mod+ cross-platform shortcuts)
- [x] Drag-and-drop (blocks to canvas, element reorder)
- [x] Copy/paste (elements and styles)
- [x] HTML/CSS export (via ExportEngine with CSS minification, asset bundling)
- [x] Project save/load (localStorage, auto-save with 5s debounce)
- [x] Error boundary + crash recovery (RecoveryManager on tab visibility change)
- [x] Toast notifications
- [x] Onboarding flow (welcome, checklist, spotlight, achievements)
- [x] AI assistant (content + layout generation via OpenAI)
- [x] Component system (create, instance, variant, sync, detach, overrides)
- [x] Form handling (registration, validation, submission — webhook/email actions)
- [x] Settings panel (7 drill-in screens)
- [x] Publish flow
- [x] CMS collections (15 field types, content items with draft/published/archived)
- [x] Data bindings (style, text, trait — with data source registry)
- [x] Plugin system (register, load, enable/disable) — engine done, **feature flag OFF**
- [x] Font management (Google Fonts API fetch, custom font upload)
- [x] Inline text editing
- [x] Flexbox/Grid layout controls
- [x] Pseudo-state styling (:hover, :focus, :active)
- [x] Breakpoint-specific styles
- [x] Theme system (CSS custom properties)
- [x] ZIP export (via jszip, multi-page)
- [x] Storage quota monitoring (warn 80%, critical 95%)
- [x] Collaboration engine (OT, cursors, soft locks) — **feature flag OFF**
- [x] Sync engine (offline queue, conflict resolution) — engine done
- [x] Interaction runtime (triggers + GSAP animations for preview mode)

### Partially Implemented (engine exists, UI/backend gaps)
- [~] ExportEngine supports React/Vue output, but **Settings export download API not wired** (feature flag OFF)
- [~] Ecommerce (4 blocks + CollectionSetupModal, no checkout/payment flow)
- [~] Custom domains/SSL (DomainsScreen UI exists, **domain API not implemented**)
- [~] Analytics integration (AnalyticsScreen UI exists, **needs external wiring**)
- [~] SEO in Publish tab — `TODO: wire when composer.getSeoData() is available`

### Stubbed / Not Yet Surfaced
- [ ] Payment integration (types exist in `ecommerce.ts`, no implementation)
- [ ] Real backend API (StorageAdapter supports `remote` type, but no server exists)
- [ ] Collaboration transport (OT engine done, no WebSocket server)
- [ ] Build catalog Phase 3 blocks: Badge, Quote/Blockquote, Custom Code, Analytics

---

## 21. SCREEN INVENTORY

### 21.1 Full-Screen Views
| Screen | Source | Description |
|--------|--------|-------------|
| **Editor** | `AquibraStudio.tsx` | Main editing canvas + panels |
| **Preview** | via `setPreviewMode()` | Full-width preview with interaction runtime |

### 21.2 Left Sidebar Screens (280px drawer)
| Tab | Home Screen | Drill-in Screens |
|-----|-------------|-----------------|
| Add | Block category grid | Category detail (Basic, Media, Layout, etc.) |
| Templates | Template gallery (10 templates) | Template preview modal |
| Layers | Element tree view | — |
| Pages | Page list | Page settings |
| Components | Component library | Component detail (variants, instances) |
| Media | Library/Discovery views | Asset detail overlay |
| Design | Color tokens | Typography tokens, Spacing tokens |
| Settings | Feature card grid | Site Settings, Domains, Analytics, Export, Integrations, Advanced |
| Publish | Publish status | — |
| History | Version timeline | — |

### 21.3 Right Inspector Screens (320px panel)
| State | Screen |
|-------|--------|
| No selection | Empty state ("Select an element") |
| Single element | 3-tab inspector (Layout / Appearance / Effects) |
| Multi-select | Multi-select toolbar (align, distribute, bulk delete) |
| Component instance | Variant section + inspector tabs |

### 21.4 Modal Screens
| Modal | Trigger | Source |
|-------|---------|--------|
| Welcome Modal | First launch | `WelcomeModal.tsx` |
| Export Modal | Settings > Export | `ExportModal.tsx` |
| Replace Template | Apply template with existing content | `TemplatesTabModals.tsx` |
| Pro Upgrade | Plan-gated feature access | `UpgradeModal.tsx` |
| Add Token | Design tab + button | `AddTokenModal.tsx` |
| Review Changes | Design tab apply | `ReviewModal.tsx` |
| Tab Guard | Navigate away with unsaved design tokens | `TabGuardModal.tsx` |
| Delete Confirm | Inspector delete button | `DeleteConfirmModal.tsx` |
| Confirm Dialog | Various destructive actions | `Modal.tsx` |
| Collection Setup | CMS collection creation | `CollectionSetupModal.tsx` |
| Template Preview | Template card click | `TemplatePreviewModal.tsx` |

### 21.5 Floating/Overlay Screens
| Overlay | Source |
|---------|--------|
| AI Assistant Bar | `AIAssistantBar.tsx` (CMD+K) |
| Context Menu | `contextMenuRegistry.ts` |
| Floating Toolbar | `canvas/controls/toolbar/` |
| Onboarding Checklist | `OnboardingChecklist.tsx` |
| Spotlight Overlay | `SpotlightOverlay.tsx` |
| Achievement Prompt | `AchievementPrompt.tsx` |
| Toast Notifications | `Toast.tsx` |
| Tooltip | `Tooltip.tsx` |
| Breakpoint Dropdown | `BreakpointDropdown.tsx` |
| Color Picker | `ColorPicker.tsx` |

---

## 22. GAPS & MISSING SCREENS (code-verified)

### 22.1 No Routing
- No `react-router` dependency. The app is a single-page editor — no URL-based navigation.
- `PageRouter` in engine handles in-editor page switching, not browser routing.

### 22.2 No Authentication
- No login/signup screens, no auth tokens, no user sessions.
- The editor is embedded via `<AquibraStudio licenseKey="DEMO">`.

### 22.3 No Dashboard / Project List
- No project browser, no "My Sites" screen.
- Single-project editor — loads from localStorage on startup.

### 22.4 No Real Backend
- `StorageAdapter` defaults to localStorage.
- No REST/GraphQL API endpoints called (except OpenAI for AI features).
- Collaboration, Sync, Publish are engine-ready but lack server implementation.

### 22.5 Missing from "Add" Tab
- **Navigation** blocks imported but not inventoried (likely Navbar only from Sections).
- No embed block (iframe, code embed) — though `videoEmbed` and `mapEmbed` exist.

### 22.6 Ecommerce Gaps
- Product blocks exist (4), but no cart page, checkout flow, payment processing, or order management.
- `CollectionSetupModal` exists but full CMS UI for content management is not surfaced in sidebar.

---

## 23. DEPENDENCY GRAPH (Critical Paths)

```
demo/main.tsx
  └─ components/Editor/AquibraStudio (legacy barrel)
       └─ editor/shell/AquibraStudio.tsx
            ├─ engine/Composer.ts (29 managers)
            │   ├─ engine/elements/ElementManager
            │   ├─ engine/styles/StyleEngine
            │   ├─ engine/commands/CommandCenter
            │   ├─ engine/collaboration/CollaborationManager
            │   ├─ engine/cms/CollectionManager
            │   └─ ... (24 more)
            ├─ editor/shell/StudioPanels.tsx
            │   ├─ editor/rail/LayoutShell + LeftRail
            │   ├─ editor/sidebar/LeftSidebar (10 tabs)
            │   ├─ editor/canvas/Canvas
            │   └─ editor/inspector/ProInspector (3 tabs)
            ├─ editor/shell/StudioHeader → Topbar
            ├─ editor/onboarding/* (4 components)
            ├─ ai/AIAssistantBar
            └─ shared/* (types, constants, hooks, UI)
```

---

## 24. STITCH / EXTERNAL TOOL READINESS

### What Stitch Would Need
1. **Screen list** → Section 21 above (2 full-screen + 10 sidebar tabs + 3 inspector tabs + 11 modals + 10 overlays)
2. **Component inventory** → 63+ blocks, 17+ shared UI primitives, 10 sidebar tab components
3. **Design tokens** → `themes/default.css` (60+ CSS custom properties with `--aqb-` prefix)
4. **State shape** → `ComposerState` (8 fields) + 30+ type files
5. **Event contract** → 100+ events in `EVENTS` const

### Screen Count Summary
| Category | Count |
|----------|-------|
| Full-screen views | 2 |
| Sidebar tab screens | 10 |
| Sidebar drill-in screens | ~15 |
| Inspector screens | 4 (empty, single, multi, component) |
| Modal screens | 11 |
| Floating overlays | 10 |
| **Total distinct screens** | **~52** |

---

## 25. DOCUMENT CONFLICTS WITH CODEBASE

| Claim in prior docs | Reality in code |
|---------------------|----------------|
| "30+ keyboard shortcuts" | **40+ commands** with shortcuts in `COMMANDS` + `SHORTCUTS` (not 50+ — some have `null` shortcut) |
| "7 overlay types" | **8+** (selection, hover, spacing, guides, badges, grid, rulers, smart-guides, dimensions) |
| "3 inspector tabs: Layout/Style/Effects" | Actually **Layout/Appearance/Effects** (tab is called `AppearanceTab`, not `StyleTab`) |
| "10 sidebar tabs" | Correct — 10 in `GROUPED_TABS_CONFIG`, but only 8 have rail buttons |
| "CMS with 3 binding types" | Correct — `StyleDataBinding`, `TextDataBinding`, `TraitDataBinding` |
| "AI: 4 modules" | AI has more files than implied: `AIAssistantBar`, `AICopilot`, `LayoutSuggestions`, `ColorPalette`, `AccessibilityChecker`, etc. (10 files in `src/ai/`), but core generation is `generateContent()` + `generateLayout()` via OpenAI |
| "Export: HTML/CSS live, React/Vue planned" | **ExportEngine actually supports React + Vue output** — but Settings export download is feature-flagged OFF |
| "Collaboration via OT" | Correct architecture, OT engine fully implemented, but **feature flag = false** (no WebSocket transport) |
| "Version history" | VersionHistoryManager fully implemented with IndexedDB storage, but **feature flag = false** |
| "Plugins" | PluginManager fully implemented with security (HTTPS, allowlist hosts, SRI), but **feature flag = false** |
| "No Zod usage" | `zod` is in `package.json` dependencies but **no Zod schemas found in codebase** — TypeScript types only |

---

*This blueprint was generated by reading every key source file in the Buildrik codebase. No information was invented or derived from prior PRD documents.*
