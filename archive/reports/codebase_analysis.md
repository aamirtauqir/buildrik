# Aquibra new-editor-l2 — Comprehensive Codebase Analysis

> **Generated:** 2026-02-21
> **Scope:** `packages/new-editor-l2/src/` (875 code files, 6.8 MB)
> **Stack:** React 18 · TypeScript 5.3 strict · Vite 7 · BSD-3 license

---

## 1. Project Overview

### What it is

`@aquibra/new-editor-l2` is a **self-contained visual web page builder** distributed as an NPM library. Consumers embed `<AquibraStudio />` in their React application and get a full no-code editor: drag-and-drop element placement, multi-page management, responsive breakpoints, CSS property inspector, reusable components, media library, and one-click HTML/CSS export.

### Architecture Pattern

**Event-Driven Manager Pattern** with a central SSOT (Single Source of Truth) hub called `Composer`. All state lives in 28 specialised manager classes. UI components are pure read/write adapters — they read from Composer and emit events to trigger mutations. No Redux, no Zustand, no Context for business state.

### Language & Versions

| Technology   | Version                    |
| ------------ | -------------------------- |
| TypeScript   | 5.3 (strict)               |
| React        | 18.3.x                     |
| Vite         | 7.2.x                      |
| Lucide-react | 0.562.x (icons)            |
| DOMPurify    | 3.3.x (sanitization)       |
| JSZip        | 3.10.x (export)            |
| OpenAI SDK   | 6.13.x (AI integration)    |
| Zod          | 3.25.x (schema validation) |

---

## 2. Detailed Directory Structure Analysis

```
packages/new-editor-l2/
├── src/
│   ├── index.ts                 ← NPM public API barrel
│   ├── engine/                  ← ALL state & business logic
│   ├── components/              ← ALL React UI
│   ├── constants/               ← Events, commands, tabs, styles
│   ├── types/                   ← TypeScript type definitions
│   ├── utils/                   ← Stateless helpers
│   ├── services/                ← External API clients
│   ├── hooks/                   ← Top-level React hooks
│   ├── features/                ← Barrel redirects to components/
│   ├── shared/                  ← Barrel redirects to local modules
│   ├── themes/                  ← CSS custom properties
│   └── styles/                  ← Design tokens
├── demo/                        ← Development harness (main.tsx)
├── dist/                        ← Build output (not committed)
├── package.json
└── tsconfig.json
```

### Directory Purposes

| Directory                         | Purpose                                                        | Key Files                                            |
| --------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| `engine/`                         | All state, no React. 28 managers extending EventEmitter.       | `Composer.ts`, `ElementManager.ts`, `StyleEngine.ts` |
| `components/Editor/`              | Editor shell — bootstraps Composer, keyboard shortcuts, modals | `AquibraStudio.tsx`, `StudioPanels.tsx`              |
| `components/Canvas/`              | Editing surface — drag/drop, selection, keyboard, overlays     | `Canvas.tsx`, `hooks/` (22 hooks), `overlays/`       |
| `components/Panels/LeftSidebar/`  | 9-tab left panel with content per tab                          | `index.tsx`, `TabRouter.tsx`, `tabs/`                |
| `components/Panels/ProInspector/` | Right property inspector (Layout, Style, Advanced)             | `index.tsx`, `sections/`, `tabs/`                    |
| `components/Blocks/`              | Block registry — all draggable element definitions             | `blockRegistry.ts`, `Basic/`, `Media/`, `Layout/`    |
| `components/Layout/`              | Shell layout grid (Rail + Drawer + Canvas + Inspector)         | `LayoutShell.tsx`, `LeftRail.tsx`                    |
| `components/ui/`                  | Low-level UI primitives: Modal, Toast, Tooltip, etc.           | `Modal.tsx`, `Toast.tsx`, `Button.tsx`               |
| `constants/`                      | Single source of truth for events, tabs, commands              | `events.ts`, `tabs.ts`, `commands.ts`                |
| `types/`                          | All TypeScript interfaces                                      | `index.ts`, `element.ts`, `style.ts`, `media.ts`     |
| `utils/`                          | Pure helpers: color, drag, nesting, HTML, parsers              | `dragDrop/`, `parsers/`, `nesting/`, `html/`         |
| `services/`                       | External API wrappers (cloud sync, AI, fonts)                  | `CloudSyncService.ts`, `AIServiceClient.ts`          |
| `features/`                       | Barrel redirects (canonical import aliases for new code)       | `editor/`, `ai/`, `templates/`                       |
| `themes/`                         | CSS custom properties (`--aqb-*` design tokens)                | `default.css`, `ux-fixes.css`                        |

---

## 3. File-by-File Breakdown

### 3.1 Core Application Files

#### Entry Points

| File              | Role                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `src/index.ts`    | NPM package API barrel — exports Composer, AquibraStudio, all types       |
| `demo/main.tsx`   | Development-only harness — mounts AquibraStudio in a standalone HTML page |
| `demo/index.html` | Vite dev server entry point                                               |

#### Editor Shell

| File                                           | Lines | Role                                                                                                                 |
| ---------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| `components/Editor/AquibraStudio.tsx`          | 348   | Main entry component — wraps ToastProvider + ErrorBoundary, initialises Composer via hooks, connects all sub-systems |
| `components/Editor/StudioPanels.tsx`           | 648   | 3+1 column layout orchestrator — distributes Composer + callbacks to Rail, Sidebar, Canvas, Inspector                |
| `components/Editor/StudioHeader.tsx`           | —     | Top toolbar: device switcher, zoom, undo/redo, save status, AI button                                                |
| `components/Editor/StudioModals.tsx`           | —     | All modal/overlay state: templates, export, AI, media library, icon picker                                           |
| `components/Editor/hooks/useComposerInit.ts`   | —     | Constructs Composer instance, wires event listeners, subscribes to history changes                                   |
| `components/Editor/hooks/useStudioState.ts`    | —     | All React state for the editor shell (device, zoom, panel tabs, overlay flags)                                       |
| `components/Editor/hooks/useStudioModals.ts`   | —     | Modal open/close state with typed payloads                                                                           |
| `components/Editor/hooks/useStudioHandlers.ts` | —     | Action handlers: AI request, template select, quick-add, copilot insert                                              |

#### Canvas

| File                                                     | Lines | Role                                                                                                                    |
| -------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| `components/Canvas/Canvas.tsx`                           | 477   | Editing surface — forwardRef component, orchestrates 22 hooks, renders overlays, exposes `openCommandPalette()` via ref |
| `components/Canvas/Canvas.types.ts`                      | —     | `CanvasProps`, `CanvasRef`, `DEVICE_SIZES`                                                                              |
| `components/Canvas/hooks/useCanvasDragDrop.ts`           | 424   | Drop zone detection, nesting validation, DOM manipulation on drop                                                       |
| `components/Canvas/hooks/useCanvasElementDrag.ts`        | 489   | Element drag ghost, drag data encoding, SSOT update via DragManager                                                     |
| `components/Canvas/hooks/useCanvasKeyboard.ts`           | 620   | ALL canvas keyboard shortcuts: delete, duplicate, move, select all, group                                               |
| `components/Canvas/hooks/useCanvasContent.ts`            | —     | Renders element tree from Composer SSOT into live DOM                                                                   |
| `components/Canvas/hooks/useCanvasSync.ts`               | —     | Keeps React state in sync with Composer events                                                                          |
| `components/Canvas/overlays/`                            | —     | Visual overlays: SelectionBox, HoverHighlight, DropFeedback, SmartGuides, Grid                                          |
| `components/Canvas/controls/UnifiedSelectionToolbar.tsx` | 637   | Toolbar that appears above selected element — align, distribute, group actions                                          |
| `components/Canvas/controls/CommandPalette.tsx`          | 449   | Cmd+K command palette with fuzzy search                                                                                 |

#### Left Sidebar (9-Tab System)

| File                                                     | Lines   | Role                                                                                       |
| -------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `components/Panels/LeftSidebar/index.tsx`                | 200     | Panel shell — error boundary, suspense, state hooks, renders TabRouter                     |
| `components/Panels/LeftSidebar/TabRouter.tsx`            | —       | Routes active tab ID → correct tab component                                               |
| `components/Panels/LeftSidebar/tabs/BuildTab.tsx`        | 504     | "Add" tab — elements grid + templates list, Card-drill-in pattern                          |
| `components/Panels/LeftSidebar/tabs/LayersTab.tsx`       | —       | DOM tree hierarchy with hover sync to Canvas                                               |
| `components/Panels/LeftSidebar/tabs/PagesTab.tsx`        | **197** | Page list (orchestrator — after split)                                                     |
| `components/Panels/LeftSidebar/tabs/pages/`              | —       | PageRow, PageSettingsScreen, types, styles                                                 |
| `components/Panels/LeftSidebar/tabs/ElementsTab.tsx`     | **176** | Element block picker (orchestrator — after split)                                          |
| `components/Panels/LeftSidebar/tabs/elements/`           | —       | ElementCard, useElementsState, constants, types                                            |
| `components/Panels/LeftSidebar/tabs/ComponentsTab.tsx`   | **340** | Reusable components (orchestrator — after split)                                           |
| `components/Panels/LeftSidebar/tabs/components/`         | —       | ComponentRow, ComponentDetailScreen, ComponentIcon, styles, types                          |
| `components/Panels/LeftSidebar/tabs/MediaTab.tsx`        | 395     | Images, icons, fonts, files upload + browse                                                |
| `components/Panels/LeftSidebar/tabs/DesignSystemTab.tsx` | 351     | Global color/typography/spacing tokens                                                     |
| `components/Panels/LeftSidebar/tabs/SettingsTab.tsx`     | —       | Site config, SEO, analytics, export (Card-drill-in)                                        |
| `components/Panels/LeftSidebar/tabs/PublishTab.tsx`      | 494     | Deploy to live site — Vercel/Netlify export                                                |
| `components/Panels/LeftSidebar/tabs/HistoryTab.tsx`      | 243     | Page revision history                                                                      |
| `components/Panels/LeftSidebar/tabs/templates/`          | —       | TemplatesTab, TemplateFlatView, TemplateGroupView, TemplateDetailScreen, TemplateUseDrawer |

#### Right Inspector (ProInspector)

| File                                                        | Lines | Role                                                                      |
| ----------------------------------------------------------- | ----- | ------------------------------------------------------------------------- |
| `components/Panels/ProInspector/index.tsx`                  | 603   | Inspector shell — 3 tabs: Layout, Style, Advanced                         |
| `components/Panels/ProInspector/tabs/LayoutTab.tsx`         | —     | Flexbox, grid, position, spacing controls                                 |
| `components/Panels/ProInspector/tabs/StyleTab.tsx`          | —     | Background, border, shadow, effects                                       |
| `components/Panels/ProInspector/tabs/AdvancedTab.tsx`       | —     | Custom CSS, interactions, accessibility                                   |
| `components/Panels/ProInspector/sections/`                  | —     | Per-property section components (FlexboxSection, TypographySection, etc.) |
| `components/Panels/ProInspector/hooks/useInspectorState.ts` | —     | Reads element from Composer, section expand/collapse (localStorage)       |
| `components/Panels/ProInspector/hooks/useStyleHandlers.ts`  | —     | Writes style changes back to Composer.styles.\*                           |

### 3.2 Engine (State Layer)

| File                                           | Lines   | Role                                                                                   |
| ---------------------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| `engine/Composer.ts`                           | 694     | Central SSOT hub — owns 28 managers, exposes project load/save/export, transaction API |
| `engine/EventEmitter.ts`                       | —       | Custom typed EventEmitter base class                                                   |
| `engine/elements/ElementManager.ts`            | —       | Create, read, update, delete elements; page management                                 |
| `engine/elements/Element.ts`                   | —       | Element class — type, children, styles, attributes, serialisation                      |
| `engine/styles/StyleEngine.ts`                 | 672     | All CSS property management — per-element, per-breakpoint                              |
| `engine/SelectionManager.ts`                   | —       | Selection SSOT — select(), deselect(), getSelectedIds()                                |
| `engine/HistoryManager.ts`                     | —       | Undo/redo with full snapshot strategy                                                  |
| `engine/drag/DragManager.ts`                   | —       | Drag state machine: IDLE → PENDING → DRAGGING → IDLE                                   |
| `engine/canvas/ResizeHandler.ts`               | —       | Resize handle math, constraint enforcement                                             |
| `engine/components/ComponentManager.ts`        | —       | Reusable component create/instantiate/sync                                             |
| `engine/collaboration/CollaborationManager.ts` | **789** | WebSocket-based real-time collaboration (L1)                                           |
| `engine/export/ExportEngine.ts`                | 650     | Full HTML/CSS page export with asset bundling                                          |
| `engine/commands/CommandCenter.ts`             | —       | Keyboard command registry, keybinding manager                                          |
| `engine/media/MediaManager.ts`                 | —       | IndexedDB media storage, image processing                                              |
| `engine/storage/StorageAdapter.ts`             | —       | Pluggable storage: localStorage / IndexedDB / remote                                   |
| `engine/sync/SyncManager.ts`                   | —       | Cloud sync with offline queue (L1)                                                     |

### 3.3 Configuration Files

| File             | Role                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------ |
| `package.json`   | Dependencies, scripts: `dev`, `build`, `typecheck`                                   |
| `tsconfig.json`  | Strict TypeScript, `bundler` resolution, path aliases (`@/*`, `@components/*`, etc.) |
| `vite.config.ts` | Vite bundler config, React plugin, SVG handling                                      |

### 3.4 Shared Constants

| File                         | Lines | Role                                                    |
| ---------------------------- | ----- | ------------------------------------------------------- |
| `constants/events.ts`        | 521   | All 100+ typed event constants with payload type map    |
| `constants/tabs.ts`          | 305   | 9-tab configuration: IDs, sections, patterns, shortcuts |
| `constants/commands.ts`      | —     | COMMANDS + SHORTCUTS keyboard binding registry          |
| `constants/uiStyles.ts`      | —     | Shared React inline style objects (CSS-in-JS constants) |
| `constants/defaultStyles.ts` | —     | Default CSS properties per element type                 |

### 3.5 Type Definitions

| File                     | Lines | Role                                                             |
| ------------------------ | ----- | ---------------------------------------------------------------- |
| `types/index.ts`         | 803   | Core: ComposerConfig, ProjectData, ElementData, DeviceType, etc. |
| `types/element.ts`       | —     | ElementType union, ElementData shape                             |
| `types/style.ts`         | —     | StyleData, CSSPropertyMap                                        |
| `types/media.ts`         | 783   | MediaAsset, MediaAssetType, ImageEditorConfig                    |
| `types/components.ts`    | —     | ComponentDefinition, ComponentInstance                           |
| `types/versions.ts`      | —     | VersionData, NamedVersion                                        |
| `types/collaboration.ts` | —     | CollaborationUser, CursorPosition                                |

### 3.6 Utilities

| Directory            | Lines | Role                                                              |
| -------------------- | ----- | ----------------------------------------------------------------- |
| `utils/dragDrop/`    | ~300  | 19-file drag library: ghost, zones, sorting, touch, scroll        |
| `utils/parsers/`     | ~400  | Color (RGB/HSL/Lab), CSS, gradient, shadow, transform parsers     |
| `utils/html/`        | ~300  | DOM query, diffing, accessibility, HTML generation, sanitization  |
| `utils/nesting/`     | ~200  | Nesting rules — which elements can contain which                  |
| `utils/helpers/`     | ~200  | Array, object, string, async, tree utilities                      |
| `utils/devLogger.ts` | —     | Structured `devLogger.drag()`, `.canvas()`, etc. — no console.log |

---

## 4. API Endpoints Analysis

This package is a **frontend-only NPM library**. It has no server or API routes. External API calls:

| Service         | How                                                    | Auth                          |
| --------------- | ------------------------------------------------------ | ----------------------------- |
| Google Fonts    | `services/GoogleFontsService.ts` — fetch()             | Public API key                |
| OpenAI          | `services/ai/AIServiceClient.ts` via `utils/openai.ts` | `VITE_OPENAI_API_KEY` env     |
| Cloud sync      | `services/CloudSyncService.ts` — WebSocket + REST      | Bearer token                  |
| Email marketing | `engine/integrations/EmailService.ts` — SendGrid/Mock  | API key from project settings |

---

## 5. Architecture Deep Dive

### 5.1 The Golden Rule

```
User Action → Composer Manager → Event Emitted → SSOT Updated → History Entry → React Re-render → UI Updates
```

UI components **never** hold authoritative state. All mutations go through `composer.*` manager methods. Composer emits events, React components subscribe via `useEffect` listeners.

### 5.2 Engine Architecture

The `Composer` class is the application's single object. It extends `EventEmitter` and instantiates 28 managers in its constructor — in dependency order:

```
Composer
├── ElementManager        ← create/read/update/delete elements + pages
├── StyleEngine           ← CSS properties per element per breakpoint
├── CommandCenter         ← keyboard command registry
├── SelectionManager      ← selection SSOT (array of IDs)
├── HistoryManager        ← undo/redo snapshots
├── VersionHistoryManager ← named version saves
├── StorageAdapter        ← pluggable persistence (local/remote)
├── Viewport              ← zoom, pan, device size
├── PluginManager         ← third-party plugin lifecycle
├── DataManager           ← data binding hub
│   ├── StyleDataBinding  ← bind CSS props to data variables
│   ├── TraitDataBinding  ← bind element traits to data
│   └── TextDataBinding   ← bind text content to data
├── GlobalStyleManager    ← global CSS classes / design tokens
├── TemplateManager       ← template library operations
├── CanvasIndicators      ← overlay state (spacing, badges, guides, grid)
├── ResizeHandler         ← resize math + constraints
├── FontManager           ← Google Fonts + custom font loading
├── ComponentManager      ← reusable component create/instantiate/sync
├── CollectionManager     ← CMS data collections
├── CMSBindingManager     ← CMS → element binding resolution
├── CollaborationManager  ← real-time WebSocket collaboration (L1)
├── MediaManager          ← image/video storage + processing
├── FormHandler           ← form state tracking + submission
├── SyncManager           ← cloud sync with offline queue (L1)
├── PageRouter            ← multi-page navigation
├── RecoveryManager       ← crash recovery / auto-restore
├── InteractionManager    ← click/hover/scroll interaction runtime
└── DragManager           ← drag state machine (IDLE/PENDING/DRAGGING)
```

### 5.3 Transaction System

Operations that touch multiple managers use `beginTransaction()` / `endTransaction()` to batch all `PROJECT_CHANGED` events into one, creating a single undo history entry:

```typescript
composer.beginTransaction('insert-template');
try {
  composer.elements.createPage(...);
  composer.elements.importHTMLToActivePage(...);
} finally {
  composer.endTransaction(); // emits single PROJECT_CHANGED
}
```

### 5.4 React ↔ Engine Bridge

Each canvas hook or UI component:

1. Subscribes to Composer events in `useEffect` (with cleanup)
2. Reads from Composer in render
3. Calls Composer managers on user interaction

Example pattern from `useComposerSelection`:

```typescript
useEffect(() => {
  const handler = (element) => setSelectedId(element?.getId() ?? null);
  composer.on(EVENTS.ELEMENT_SELECTED, handler);
  composer.on(EVENTS.SELECTION_CLEARED, () => setSelectedId(null));
  return () => { composer.off(...); };
}, [composer]);
```

### 5.5 Block Registry Pattern

All draggable element types are defined in `blockRegistry.ts`. Each `BlockBuildConfig` specifies:

- `id`: unique string
- `elementType`: maps to engine's `ElementType`
- `label`, `category`, `html`: display + default markup
- `defaultStyles`: CSS applied on insertion

`insertBlock(composer, def, parentId, insertIndex)` is the single function that handles all block insertion — it calls `ElementManager.createElement()`, applies default styles, and returns the new element ID.

### 5.6 9-Tab Left Panel Architecture

Tab routing uses a **Card-drill-in** pattern for complex tabs (Add, Settings) and **standalone** pattern for focused tabs (Layers, Pages, Components, Assets, Design, Publish, History):

```
LeftSidebar
└── TabRouter
    ├── add       → BuildTab (cards: Elements, Templates)
    ├── layers    → LayersTab
    ├── pages     → PagesTab → [PageRow, PageSettingsScreen]
    ├── components → ComponentsTab → [ComponentRow, ComponentDetailScreen]
    ├── assets    → MediaTab
    ├── design    → DesignSystemTab
    ├── settings  → SettingsTab (cards: Page, Site, Domains, Analytics, Export...)
    ├── publish   → PublishTab
    └── history   → HistoryTab
```

### 5.7 Layout Grid

`LayoutShell` is a CSS grid with 4 named areas:

```
┌──────┬──────────────────────────┬──────────┐
│ Rail │    Drawer (sliding)      │  Canvas  │
│ 60px │    280px (collapsible)   │  flex-1  │
│      │                          │          │ Inspector
│      │                          │          │   300px
└──────┴──────────────────────────┴──────────┘
```

- **Rail** — 60px icon strip (LeftRail.tsx)
- **Drawer** — 280px sliding panel (LeftSidebar)
- **Canvas** — fills remaining space (Canvas.tsx + overlays)
- **Inspector** — 300px right panel (ProInspector)

---

## 6. Environment & Setup

### Installation

```bash
npm install @aquibra/new-editor-l2
```

### Embedding the Editor

```tsx
import { AquibraStudio } from "@aquibra/new-editor-l2";

function App() {
  return (
    <AquibraStudio
      licenseKey="your-key"
      onReady={(composer) => console.log("ready", composer)}
      onUpdate={(data) => saveToServer(data)}
      options={{
        storage: { type: "local", autoSave: true, autoSaveInterval: 5000 },
      }}
    />
  );
}
```

### Development

```bash
cd packages/new-editor-l2
npm run dev        # Start Vite dev server (demo/main.tsx)
npm run build      # tsc + vite build → dist/
npm run typecheck  # npx tsc --noEmit
```

### Environment Variables (for AI features)

```
VITE_OPENAI_API_KEY=sk-...       # Required for AI content generation
```

### Path Aliases (tsconfig.json)

```
@/*              → src/*
@components/*    → src/components/*
@hooks/*         → src/hooks/*
@utils/*         → src/utils/*
@types/*         → src/types/*
@features/*      → src/features/*
```

---

## 7. Technology Stack Breakdown

| Layer          | Technology               | Notes                                                      |
| -------------- | ------------------------ | ---------------------------------------------------------- |
| UI Framework   | React 18.3               | Hooks-based, no class components except ErrorBoundary      |
| Type System    | TypeScript 5.3 strict    | `noImplicitAny`, discriminated unions throughout           |
| Bundler        | Vite 7.2                 | Instant HMR in dev, optimised ESM output                   |
| Styling        | CSS Custom Properties    | `--aqb-*` design tokens, no Tailwind, no CSS-in-JS library |
| Icons          | Lucide-react 0.562       | Tree-shaken SVG icons                                      |
| Animation      | GSAP / ScrollTrigger     | Optional animation engine (L1)                             |
| State          | Custom EventEmitter      | No Redux, Zustand, or Context for business state           |
| Storage        | localStorage / IndexedDB | Pluggable via StorageAdapter                               |
| AI             | OpenAI SDK               | Content, layout, code generation                           |
| Real-time      | WebSocket                | CollaborationManager (L1 — partial wiring)                 |
| HTML Export    | JSZip + DOMPurify        | Multi-file export bundles                                  |
| Validation     | Zod 3.25                 | Schema validation for project data                         |
| Error tracking | Sentry (@sentry/react)   | `utils/errorTracking.ts` integration                       |

---

## 8. Visual Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NPM PACKAGE  @aquibra/new-editor-l2                                        │
│  Entry: src/index.ts                                                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   AquibraStudio.tsx     │  Main React component
                    │   (error boundary +     │  with ToastProvider
                    │    ToastProvider)       │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────▼──────────────────┐
              │         StudioPanels.tsx             │
              │  (props router — no own state)       │
              └──┬────────┬──────────────┬──────────┘
                 │        │              │
     ┌───────────▼──┐  ┌──▼──────────────▼──┐  ┌──────────────────┐
     │  LeftRail    │  │  LeftSidebar        │  │  ProInspector    │
     │  (60px rail) │  │  (280px drawer)     │  │  (300px right)   │
     │              │  │  9-Tab System:      │  │  3-Tab System:   │
     │  • Add       │  │  Add/Layers/Pages   │  │  Layout/Style/   │
     │  • Layers    │  │  Comps/Assets       │  │  Advanced        │
     │  • Pages     │  │  Design/Settings    │  │                  │
     │  • Comps     │  │  Publish/History    │  │  Reads SSOT via  │
     │  • Assets    │  │                     │  │  Composer events │
     │  • Design    │  │  TabRouter → Tab    │  │                  │
     │  • Settings  │  │  Components         │  └────────┬─────────┘
     │  • Publish   │  └──────────┬──────────┘           │
     │  • History   │             │                       │
     └──────────────┘             │              ┌────────▼─────────┐
                                  │              │  Canvas.tsx      │
                    ┌─────────────▼──────────────┤  (editing area)  │
                    │                            │                  │
                    │     Composer (SSOT)        │  22 Hooks:       │
                    │                            │  DragDrop        │
                    │  28 Manager Pattern:       │  ElementDrag     │
                    │  ElementManager            │  Keyboard        │
                    │  StyleEngine               │  Selection       │
                    │  SelectionManager          │  Sync            │
                    │  HistoryManager            │  Content         │
                    │  DragManager               │  Overlays:       │
                    │  ComponentManager          │  SelectionBox    │
                    │  MediaManager              │  HoverHighlight  │
                    │  ExportEngine              │  DropFeedback    │
                    │  CollaborationManager      │  SmartGuides     │
                    │  + 18 more...              │  Grid            │
                    │                            │                  │
                    │  Event Bus (100+ events)   └──────────────────┘
                    │  EVENTS.* constants
                    └────────────────────────────────────────────────
                                  │
              ┌───────────────────┴────────────────────────────┐
              │                  SERVICES                       │
              │  CloudSyncService  ─── REST + WebSocket         │
              │  AIServiceClient   ─── OpenAI SDK               │
              │  GoogleFontsService ── Google Fonts API         │
              └────────────────────────────────────────────────┘
```

### Data Flow: "User Drops a Block onto Canvas"

```
1. User drags ElementCard from sidebar
   └→ DragEvent on LeftSidebar element div
   └→ e.dataTransfer.setData("block-id", "image")

2. Canvas drop zone fires onDrop
   └→ useCanvasDragDrop hook receives event
   └→ Validates nesting via nestingRules.ts
   └→ Calls composer.beginTransaction("drop-block")

3. ElementManager.createElement(type, parentId, index)
   └→ Creates Element instance
   └→ Emits EVENTS.ELEMENT_CREATED

4. StyleEngine.setElementStyle(id, defaultStyles)
   └→ Applies default CSS from blockRegistry
   └→ Emits EVENTS.STYLE_CHANGED

5. HistoryManager listens to PROJECT_CHANGED
   └→ Saves full snapshot for undo

6. SelectionManager.select(newElement)
   └→ Emits EVENTS.ELEMENT_SELECTED

7. React canvas re-renders (useCanvasSync listener)
   └→ New element appears in DOM

8. ProInspector re-renders (useInspectorState listener)
   └→ Shows properties for new element
```

---

## 9. Key Insights & Recommendations

### 9.1 Code Quality Assessment

**Strengths:**

- **Strict TypeScript throughout** — discriminated unions, typed events, no `any` except legacy areas
- **Clean SSOT discipline** — UI never holds authoritative state, Composer is the single source
- **Transaction system** — `beginTransaction()` / `endTransaction()` correctly batches mutations into single undo entries
- **Event type safety** — `EventPayloads` interface maps every event name to its payload type
- **Separation of concerns** — engine has zero React imports; components have zero direct state

**Weaknesses / Technical Debt:**

- **142 pre-existing TS errors** — all in barrel files referencing planned-but-unbuilt files (promises without implementations)
- **CollaborationManager at 789 lines** (L1 — only partial wiring; real-time sync works but UI is incomplete)
- **SyncManager L1** — offline queue exists but cloud sync UI is not surfaced in Settings tab
- **`features/` directory** — barrel redirects to `components/` with migration comments; physical files were never moved

### 9.2 Integration Completeness (L0/L1/L2)

| Feature             | Level  | Notes                                                                   |
| ------------------- | ------ | ----------------------------------------------------------------------- |
| Element CRUD        | **L2** | Full lifecycle: create → select → style → history → render              |
| Selection           | **L2** | Multi-select, Shift+click, cmd-click all wired                          |
| History/Undo        | **L2** | Full snapshot undo, toast feedback                                      |
| CSS Inspector       | **L2** | 3-tab ProInspector, per-breakpoint styles                               |
| Multi-page          | **L2** | Create, delete, rename, reorder pages                                   |
| Templates           | **L2** | Apply to new/replace page, TemplateUseDrawer                            |
| Media               | **L2** | IndexedDB storage, upload, grid browse                                  |
| Reusable Components | **L2** | Create, instantiate, sync, variants                                     |
| AI Content          | **L1** | OpenAI connected, UI in AIAssistantBar; page generator not surfaced     |
| Collaboration       | **L1** | CollaborationManager built, WebSocket logic present; no join/leave UI   |
| Cloud Sync          | **L1** | SyncManager + OfflineQueue exist; no sync status in Settings UI         |
| Interactions        | **L1** | InteractionManager exists; runtime starts in preview mode; no UI editor |
| CMS                 | **L1** | CollectionManager, CMSBindingManager exist; no CMS panel rendered       |
| Ecommerce           | **L0** | CollectionSetupModal stub; no product browsing or checkout              |

### 9.3 Security Considerations

- **DOMPurify** sanitises all user-provided HTML before import — correct
- **OpenAI key** exposed via `VITE_OPENAI_API_KEY` — client-side only; should be proxied through a backend
- **SVG handling** — inline SVG icons use DOMPurify-safe rendering
- **localStorage** — project data stored unencrypted; acceptable for a visual builder but note this in docs

### 9.4 Performance Observations

- **22 canvas hooks** share a single Composer event bus — listener count could grow large on complex pages
- **CollaborationManager** is always instantiated even when not used — add a `collaboration.enabled` config guard
- **Full snapshot undo** — HistoryManager stores complete project JSON per mutation. For large pages (100+ elements), a JSON-patch diff approach would be more memory-efficient
- **`canvasContent` re-render** — `useCanvasContent` re-renders the entire element tree on any element change. Shadow DOM diffing or React key optimisation could limit this

### 9.5 Maintainability Suggestions

1. **Fix barrel promises** — 142 TS errors are all "declared but not built" barrel entries. Either build the files or remove the barrel entries
2. **Physical move `features/` → `components/`** — or delete the redirects once all imports are updated
3. **L1 → L2 upgrades to tackle in order:** CMS panel, Collaboration join/leave UI, Cloud sync settings tile
4. **Split ProInspector/index.tsx** (603 lines) — extract `InspectorTabs.tsx` and `InspectorEmptyState.tsx` to bring under 500 lines
5. **Address CollaborationManager** (789 lines) — only after L1→L2 upgrade; split into `PresenceManager`, `OperationEngine`, `ConnectionHandler`

---

## 10. Top 20 Most Important Files to Understand First

Ranked by impact on editor flow — understanding these 20 files gives you a complete mental model of the entire system.

| Rank   | File                                                  | Why It Matters                                                                                                                                                                      |
| ------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1**  | `engine/Composer.ts` (694L)                           | The entire engine in one file — lists all 28 managers, their construction order, transaction system, project load/save API. Reading this tells you every capability the system has. |
| **2**  | `constants/events.ts` (521L)                          | Lists all 100+ typed events with payload types. Understanding which events fire when is essential for following any data flow.                                                      |
| **3**  | `components/Editor/AquibraStudio.tsx` (348L)          | The React root — shows which hooks initialize Composer, which keyboard shortcuts exist, how modals open, and which callbacks connect to engine events.                              |
| **4**  | `components/Editor/StudioPanels.tsx` (648L)           | The 4-column layout router — shows how Rail, Sidebar, Canvas, and Inspector connect and how callbacks flow between them.                                                            |
| **5**  | `constants/tabs.ts` (305L)                            | Defines the 9-tab information architecture with shortcuts, patterns, and section grouping.                                                                                          |
| **6**  | `engine/elements/ElementManager.ts`                   | Owns all element CRUD: create, delete, move, reparent, page management. Every UI action ultimately calls this.                                                                      |
| **7**  | `engine/styles/StyleEngine.ts` (672L)                 | Owns all CSS: per-element, per-breakpoint, import/export. Every inspector control writes through this.                                                                              |
| **8**  | `components/Canvas/Canvas.tsx` (477L)                 | The editing surface — lists all 22 hooks that power it and the overlay system.                                                                                                      |
| **9**  | `components/Canvas/hooks/useCanvasKeyboard.ts` (620L) | All canvas keyboard shortcuts in one place — shows editor's interaction model.                                                                                                      |
| **10** | `components/Canvas/hooks/useCanvasDragDrop.ts` (424L) | Drop zone detection + nesting validation — explains how elements land in the DOM tree.                                                                                              |
| **11** | `engine/SelectionManager.ts`                          | Selection SSOT — understanding `select()`, `getSelectedIds()`, and which events fire is key to ProInspector logic.                                                                  |
| **12** | `engine/HistoryManager.ts`                            | Full snapshot undo/redo — explains why PROJECT_CHANGED triggers must be carefully controlled.                                                                                       |
| **13** | `components/Blocks/blockRegistry.ts`                  | The master list of every draggable element type — reading it maps all UI categories to engine element types.                                                                        |
| **14** | `components/Panels/LeftSidebar/index.tsx` (200L)      | Panel shell — shows how TabRouter, state hooks, error boundary, and keyboard shortcuts compose.                                                                                     |
| **15** | `components/Panels/LeftSidebar/TabRouter.tsx`         | Maps tab IDs → tab components — the routing table for all 9 sidebar tabs.                                                                                                           |
| **16** | `components/Panels/ProInspector/index.tsx` (603L)     | Inspector shell — shows how element selection maps to property controls and the 3-tab structure.                                                                                    |
| **17** | `components/Layout/LayoutShell.tsx`                   | The 4-area CSS grid (Rail + Drawer + Canvas + Inspector) — explains the physical layout contract.                                                                                   |
| **18** | `engine/drag/DragManager.ts`                          | Drag state machine — IDLE/PENDING/DRAGGING. Understanding this explains why drag events fire in the order they do.                                                                  |
| **19** | `utils/nesting/rules.ts`                              | Nesting validation — which element types can contain which. This is what makes some drops valid and others invalid.                                                                 |
| **20** | `engine/export/ExportEngine.ts` (650L)                | Full HTML/CSS export — explains how the element tree and styles serialise to production output.                                                                                     |

### Reading Order for a New Developer

```
Day 1 (System Mental Model):
  #1 Composer.ts → #2 events.ts → #6 ElementManager → #11 SelectionManager → #12 HistoryManager

Day 2 (UI Shell):
  #3 AquibraStudio.tsx → #4 StudioPanels.tsx → #17 LayoutShell.tsx → #5 tabs.ts

Day 3 (Canvas):
  #8 Canvas.tsx → #9 useCanvasKeyboard → #10 useCanvasDragDrop → #19 nesting/rules → #18 DragManager

Day 4 (Sidebar + Inspector):
  #14 LeftSidebar/index.tsx → #15 TabRouter → #13 blockRegistry → #16 ProInspector/index.tsx → #7 StyleEngine

Day 5 (Output):
  #20 ExportEngine → browse engine/cms/ and engine/collaboration/ to understand L1 features
```

---

_Analysis accurate as of 2026-02-21. The codebase had 875 code files and 6.8 MB total at time of writing._
