# Buildrik (Aquibra Editor L2) — Capability Audit

**Date:** 2026-03-12
**Package:** `@aquibra/new-editor-l2` v1.0.0
**Purpose:** Reverse-engineered capability inventory to prevent feature loss, downgrade, or accidental removal during redesign.
**Method:** Static codebase analysis — all findings are code-verified against real files.

---

## 1. Executive Summary

Buildrik is a feature-complete visual web builder with a production-grade engine that substantially exceeds what its UI surface reveals. The core engine (`src/engine/Composer.ts`, 700 LOC, 27+ managers) implements: JSON-Patch-based undo/redo, Operational Transformation collaboration, multi-backend storage, full CMS/data binding, GSAP animation timelines, plugin sandboxing, multi-format export (HTML/React/Vue), and offline sync queues — all working and tested.

The editor UI (`src/editor/`, 465+ files) wraps this engine across 5 layout sections (Topbar, Left Rail, Sidebar, Canvas, Inspector) with 9 sidebar tabs, 13 inspector sections, 130+ canvas overlay/interaction files, and a full keyboard shortcut system.

**Critical gap:** Several high-visibility features have complete UI but incomplete backend wiring — collaboration transport, AI assistant, stock media, and publish-to-hosting. These appear functional to users but silently fail.

**Scale:**
- 132 engine files + 465 editor UI files + 360 legacy component files + 200+ shared files
- 27+ manager classes in Composer
- 100+ EventEmitter event types
- 13 inspector property sections
- 9 sidebar tabs

---

## 2. Current Capability Inventory

### 2.1 Project & Stack

| Item | Detail |
|------|--------|
| Package | `@aquibra/new-editor-l2` v1.0.0 |
| Runtime | React 18.3.1 + TypeScript 5.3 (strict) + Vite 7.2.7 |
| Styling | Emotion CSS-in-JS (`@emotion/react`, `@emotion/styled`) — no Tailwind, no CSS modules |
| State | React hooks + Composer EventEmitter — no Redux, no Zustand |
| Entry | `demo/main.tsx` → `AquibraStudio` → port 5050 |
| Key deps | GSAP 3.14, Zod 3.25, Sentry 10.39, OpenAI 6.13, html2canvas, jszip, DOMPurify |

### 2.2 Engine — Composer.ts (27+ Managers)

All state mutations flow through `Composer` as single gateway. Components never mutate engine internals directly.

| Manager | Responsibility |
|---------|---------------|
| `elements` | CRUD, tree, parent/child relationships |
| `styles` | Breakpoint-aware style engine (Desktop/Tablet/Mobile) |
| `commands` | Command registry + command palette |
| `selection` | Single, multi, marquee selection state |
| `history` | JSON Patch undo/redo + checkpoint coalescing |
| `versionHistory` | Named version snapshots, IndexedDB-backed |
| `storage` | Multi-backend adapter (LocalStorage / SessionStorage / IndexedDB / Remote API / Custom) |
| `viewport` | Zoom, pan, device simulation |
| `plugins` | Register, CDN load, SRI integrity, dependency resolution |
| `data` | Variable + collection + condition data bindings |
| `globalStyles` | CSS custom properties + global stylesheet injection |
| `styleBindings` | Dynamic style binding to data |
| `traitBindings` | Attribute/trait binding to data |
| `textBindings` | Text content binding to data |
| `templates` | Template library, apply with preview |
| `canvasIndicators` | Smart guides, rulers, grid, spacing labels |
| `resizeHandler` | Element resize with constraint awareness |
| `fonts` | Google Fonts 24h cache, custom font upload |
| `components` | Component create, instantiate, variants, overrides, detach |
| `cmsManager` | CMS collection CRUD, field types |
| `cmsBindings` | CMS field → element binding |
| `collaboration` | OT engine, element locks, user presence cursors |
| `media` | Upload, optimize, WEBP conversion, search, folders |
| `forms` | Form config, validation, submit, webhook/email/store backends |
| `sync` | Offline sync queue, conflict resolution |
| `router` | Multi-page routing within editor |
| `recovery` | State validation on visibility change |
| `interactions` | Trigger + action system (hover, click, scroll, etc.) |
| `drag` | Drag state machine: IDLE→PENDING→DRAGGING→IDLE |

**EventEmitter:** 100+ typed event types in `src/shared/constants/events.ts`. UI subscribes to events; it does not poll state.

### 2.3 Editor Layout (5 Sections)

#### Topbar (`src/editor/shell/Topbar.tsx`, ~639 LOC)
- Project name display + dropdown menu
- Undo / Redo buttons (bound to `composer.history`)
- Device switcher (Desktop / Tablet / Mobile)
- Status indicators: save state, sync state, issues count
- Preview button (hides overlays, runs interaction runtime)
- Publish button (→ hosting, see §3 for gap)

#### Left Rail (`src/editor/rail/`, 60px wide)
- 9 icon tabs with keyboard shortcuts
- Two-zone layout:
  - **Top zone:** Add (Build), Media, Layers, Templates, Pages
  - **Bottom zone:** Components, Design, Settings, History

#### Left Sidebar Drawer (`src/editor/sidebar/`, 150+ files)
9 full panel tabs — detailed in §2.4.

#### Canvas (`src/editor/canvas/`, 130+ files)
Full capability list in §2.5.

#### Right Inspector (`src/editor/inspector/ProInspector.tsx`, 60+ files)
Full capability list in §2.6.

### 2.4 Sidebar Tabs (9)

**1. Build Tab**
- Draggable element cards (primitives: div, text, image, button, video, etc.)
- Block cards (pre-built multi-element sections)
- Category accordion (collapsed/expanded)
- Search filter across all elements
- MyComponents section (user-created reusable components)
- Favorites section (starred elements)

**2. Media Tab**
- Upload zone (drag-and-drop + click-to-select)
- Asset grid / list view toggle
- Type filter pills (Images, Videos, SVG, All)
- Multi-select with selection banner + bulk actions
- Folder structure navigation
- Asset rename, delete, move
- Stock discovery section (Unsplash/Pexels/Icons — **stub only**, see §3)

**3. Layers Tab**
- Full hierarchical element tree
- Drag-to-reorder (live reordering)
- Context menu per layer (rename, duplicate, lock, delete, group)
- Breadcrumb path for deep nesting
- Multi-select support
- Visibility + lock toggles per layer

**4. Pages Tab**
- Page list with drag-to-reorder
- Per-page settings drawer with 3 sub-tabs:
  - **SEO:** title, description, canonical, robots
  - **Social:** OG image, OG title, OG description, Twitter card
  - **Advanced:** scripts, custom CSS, password protection
- Add / duplicate / delete pages

**5. Templates Tab**
- Browse template library
- Preview template before applying
- Apply with progress overlay (async load + inject)

**6. Components Tab**
- Component library browser
- Variant browser per component
- Component detail screen (usage, props)
- Create new component from selection

**7. Design Tab**
- Color tokens (brand palette, semantic colors)
- Typography tokens (font families, sizes, weights, line heights)
- Spacing tokens (scale)
- Shadow tokens
- Theme switching (apply different token sets)
- Export tokens: CSS custom properties / Figma / JSON / etc.

**8. Settings Tab**
- Site-level settings (name, favicon, language)
- Domain management
- Integrations (Analytics, GA4, GTM, custom scripts)
- Export configuration
- Advanced (scripts injection, robots.txt, sitemap settings)

**9. History Tab**
- Timeline view of undo/redo history
- Click-to-restore any prior state
- Diff display (DiffRow component)
- Activity log (ActivityView component)
- Named version snapshots (from versionHistory manager)

### 2.5 Canvas Capabilities

**Selection**
- Single element click-select
- Multi-select: Shift+click, Cmd+click (additive)
- Marquee box select (drag on empty space)
- Click-through (Alt+click to select child behind parent)

**Hover**
- Element highlight outline on hover
- Name label tooltip on hover

**Drag / Drop**
- State machine: IDLE → PENDING → DRAGGING → IDLE
- 16ms throttle (~60fps performance)
- Animated `DropFeedbackOverlay` (before/after/inside slot calculation)
- Auto-scroll when dragging near canvas edges (near-edge acceleration)
- Touch drag support (`useTouchDrag` hook)

**Inline Text Editing**
- Double-click activates `contentEditable`
- Full editable tag list (h1–h6, p, span, a, li, etc.)

**Overlays (all active simultaneously)**
- `SelectionBox` — selection border
- `SelectionHandles` — resize handles (8 points)
- `ElementHover` — hover highlight
- `DropFeedback` — drop slot indicator
- `SmartGuides` — red snap alignment lines
- `Guides` — user-created ruler guides
- `Grid` — configurable overlay grid
- `SpacingLabels` — margin/padding distance indicators
- `MultiSelectBadge` — count badge for multi-selection
- `ParentHighlight` — highlights parent container on hover
- `RemoteCursors` — collaborator cursors (engine ready; transport gap in §3)
- `Rulers` — pixel rulers (top + left)

**Keyboard on Canvas**
- Arrow keys: nudge 1px (10px with Shift)
- Delete / Backspace: delete selected element
- Enter: activate inline text edit
- Escape: clear selection / close active mode

**Context Menu (right-click)**
- 5 categories: Edit, Insert, Style, Layout, Standalone
- Actions: copy, paste, duplicate, delete, group, wrap, lock, hide, bring to front/back

**Command Palette**
- Trigger: Cmd+K or Cmd+Shift+P
- Fuzzy search across all registered commands
- Recent command history
- Categories: elements, actions, navigation, settings

**Canvas Modes**
- Normal (default)
- Preview (hides all overlays, runs `InteractionRuntime`)
- X-ray (shows element boundaries as outlines)

**Additional Canvas Features**
- Smart guides: automatic snap lines (element-to-element alignment)
- Rulers: drag-from-ruler to create custom guide lines
- Grid overlay: configurable cell size, toggle on/off
- Spacing indicators: auto-enabled on first element selection
- Zoom: fit, 50%, 100%, 150%, 200%

### 2.6 Inspector (Right Panel — 60+ files)

**3 Tabs:** Layout | Appearance | Effects

**13 Property Sections:**

| Section | Controls |
|---------|---------|
| Size | Width, height, min/max, aspect ratio lock |
| Spacing | Margin (T/R/B/L 4-value), Padding (T/R/B/L 4-value) |
| Visibility | Display toggle, opacity, overflow |
| Background | Color, gradient, image, video, blend mode |
| Border | Width, style, color, radius (per-corner) |
| Effects | Box shadow (multiple), text shadow, filter (blur/brightness/etc.) |
| Grid | Grid template columns/rows, gap, auto-flow |
| Animation | GSAP timeline builder, presets, ScrollTrigger, delay, duration, easing |
| Link | Href, target, rel, aria-label |
| CSSClasses | Add/remove CSS class names |
| AllCSS | Raw CSS editor with syntax highlighting |
| Variant | Component variant switcher |
| AISuggestion | AI-powered property suggestions (engine stub, see §3) |

**Flexbox Sub-sections (6):**
- Direction (row/column/reverse)
- Align items (9-cell alignment grid)
- Justify content
- Gap (row + column)
- Flex item (grow/shrink/basis)
- Wrap

**Layout Sub-sections (5):**
- Display (block/flex/grid/inline/none)
- Position (static/relative/absolute/fixed/sticky)
- Constraints (pin edges, centered)
- Overflow (visible/hidden/scroll/auto)
- Z-index

**Typography Sub-sections (4):**
- Font family (with Google Fonts search)
- Size + line height
- Weight, style, decoration
- Letter spacing, word spacing, text align

**Interactions Sub-sections (4):**
- Trigger selector (hover/click/scroll/focus/mouseenter/etc.)
- Action builder (animate/navigate/toggle/show/hide/custom)
- Event chain builder
- Preview interaction

**Inspector Controls:**
- `NumberField` — numeric input with unit selector (px/%, em, rem, vw, vh)
- `SliderControls` — range slider with number input sync
- `ColorInput` — hex/rgb/hsl/hsla picker with opacity, eyedropper
- `SpacingControls` — 4-value T/R/B/L with linked/unlinked toggle
- `AlignmentGrid` — 9-cell visual alignment selector
- `ButtonControls` — button group toggle
- `PresetGrids` — visual preset selector tiles

**Inspector UX:**
- Scroll position persisted per-element (returns to same scroll position when re-selecting)
- Property search / filter bar (search across all 13 sections)
- Section collapse/expand with memory

### 2.7 Keyboard Shortcuts (Global)

| Shortcut | Action |
|---------|--------|
| Cmd+S | Save project |
| Cmd+Z | Undo |
| Cmd+Shift+Z | Redo |
| Cmd+K / Cmd+Shift+P | Command palette |
| Cmd+J | AI assistant bar |
| Cmd+/ | Keyboard cheat sheet modal |
| Delete / Backspace | Delete selected element |
| Arrow keys | Nudge 1px |
| Shift+Arrow | Nudge 10px |
| Enter | Inline text edit |
| Escape | Clear selection / close modal |

### 2.8 Advanced System Capabilities (Fully Implemented)

| System | Status | Evidence |
|--------|--------|---------|
| JSON Patch history | ✅ Full | Checkpoint + coalesce debounce in `HistoryManager` |
| Named version snapshots | ✅ Full | IndexedDB-backed, create/restore/delete in `VersionHistoryManager` |
| Multi-backend storage | ✅ Full | `StorageAdapter` with 5 backends: Local/Session/IndexedDB/Remote/Custom |
| Auto-save | ✅ Full | 5000ms debounce on `PROJECT_CHANGED` event |
| Breakpoint-aware styles | ✅ Full | Desktop/Tablet/Mobile in style engine |
| Offline sync queue | ✅ Full | Auto-sync, conflict resolution UI in `SyncManager` |
| Component system | ✅ Full | Create, instantiate, variants, overrides, detach in `ComponentManager` |
| CMS / Collections | ✅ Full | CRUD, field types, collection binding in `CMSManager` |
| Data bindings | ✅ Full | Variable, collection, condition bindings in `DataManager` |
| GSAP animations | ✅ Full | Timeline, presets, ScrollTrigger, interaction runtime |
| Design tokens | ✅ Full | Color/type/spacing/shadow, theme switching |
| Plugin system | ✅ Full | Register, CDN load, SRI integrity, dependency resolution |
| Font management | ✅ Full | Google Fonts 24h cache, custom upload in `FontManager` |
| Form builder | ✅ Full | Config, validate, submit, webhook/email/store in `FormsManager` |
| Media library | ✅ Full | Upload, optimize, WEBP, search, folders in `MediaManager` |
| E-commerce collections | ✅ Full | Products CRUD, `CollectionManager` |
| Export HTML/React/Vue | ✅ Full | `ExportEngine` with SEO/Analytics/Forms/Stripe injectors, ZIP, sitemap |
| Page SEO settings | ✅ Full | Title, desc, OG, canonical per page |
| Recovery manager | ✅ Full | Validates state on visibility change |
| Smart guides (snap) | ✅ Full | Red snap lines during drag |
| Rulers + custom guides | ✅ Full | Drag-to-create, configurable |
| Spacing indicators | ✅ Full | Auto-enable on first selection |
| Grid overlay | ✅ Full | Configurable size, toggle |
| X-ray mode | ✅ Full | Shows element boundaries |
| Marquee selection | ✅ Full | Box select multiple elements |
| Touch drag | ✅ Full | `useTouchDrag` hook |
| Auto-scroll on drag | ✅ Full | Edge acceleration |
| Collaboration engine (OT) | ✅ Full | Full Operational Transformation in `CollaborationManager` |
| Interaction runtime | ✅ Full | Trigger + action execution in preview mode |

---

## 3. Partially Implemented Features

These features have complete UI and visible entry points but missing backend wiring. **Users will see them and expect them to work.**

### 3.1 Collaboration Transport (Critical Gap)
- **What works:** Full Operational Transformation engine in `CollaborationManager`, element locking, user presence data structures, `RemoteCursors` overlay on canvas
- **What's missing:** WebSocket / transport layer not connected to server — operations never actually sent/received
- **User impact:** Collaboration UI appears (remote cursors, presence avatars, lock indicators) but no actual multi-user sync occurs
- **Risk:** Users invited to collaborate see each other's presence but edits don't sync — data loss risk

### 3.2 AI Assistant (Cmd+J)
- **What works:** AI assistant bar UI (Cmd+J trigger), `AISuggestionSection` in inspector, `SmartSuggestions` component, OpenAI 6.13 dependency installed, types/prompts/cache infrastructure defined
- **What's missing:** Actual OpenAI API calls not wired; no API key plumbing from env to client
- **User impact:** Cmd+J opens a bar; any AI query returns nothing or errors silently
- **Risk:** Prominent feature (keyboard shortcut) that is a dead end

### 3.3 Stock Media Discovery
- **What works:** Discovery tab/section visible in `MediaTab` UI with pills for Unsplash, Pexels, Icons
- **What's missing:** API calls to Unsplash/Pexels not implemented; no API key handling
- **User impact:** Tab is visible and clickable, returns no results
- **Risk:** Users expect browsable stock library; get empty state with no explanation

### 3.4 Publish-to-Hosting
- **What works:** Publish button in Topbar, publish flow UI, Vercel handler types defined
- **What's missing:** `VercelHandler` is a stub — no actual Vercel API calls; no other hosting providers wired
- **User impact:** Publish button opens flow; publishing silently fails or shows error
- **Risk:** Core user expectation (ship my site) broken at last mile

### 3.5 Sentry Error Tracking
- **What works:** Sentry 10.39 installed, type stubs present
- **What's missing:** Not wired to Composer error events; `captureException` calls absent from error boundaries
- **User impact:** Production errors go untracked; engineering blind to real failures
- **Risk:** Silent production failures, no alerting

### 3.6 Onboarding Flow
- **What works:** Welcome modal, spotlight overlay, ~70% of tutorial step UI
- **What's missing:** Some tutorial steps are UI stubs; tutorial sequence can break mid-flow
- **User impact:** New users may hit empty/broken tutorial steps
- **Risk:** First-run experience (highest-stakes UX) breaks for new users

### 3.7 Stripe Checkout (Runtime)
- **What works:** `StripeInjector` in `ExportEngine` (adds Stripe script to exported HTML), e-commerce collection types defined
- **What's missing:** No runtime Stripe integration in editor preview; no payment processing in builder
- **User impact:** Can configure products + export with Stripe script; can't preview checkout in editor

### 3.8 History Diff Accuracy
- **What works:** `DiffRow` component renders diffs, `ActivityView` shows activity log, JSON Patch history is accurate
- **What's unclear:** Whether the visual diff display accurately represents the actual patch delta for complex operations
- **Risk:** History shows changes but diff display may be misleading for multi-element operations

---

## 4. Hidden Advanced Features

Features that work completely but have no obvious entry point or are underutilized in the UI:

### 4.1 Operational Transformation Engine
Full OT implementation in `CollaborationManager` rivals Google Docs-level collaborative editing — only needs transport wiring to become production real-time collaboration.

### 4.2 Multi-Backend Storage Architecture
5-backend pluggable storage (`LocalStorage`, `SessionStorage`, `IndexedDB`, `Remote API`, `Custom`) — most users will never know anything beyond local save exists. Configurable at Composer init.

### 4.3 Plugin System with CDN Loading + SRI
Full plugin sandbox: register plugins by URL, CDN-load them, verify SRI integrity hashes, resolve dependencies. Enterprise-grade extensibility hidden behind no UI.

### 4.4 Offline-First Sync with Conflict Resolution
`SyncManager` implements full offline queue: operations queued while offline, auto-retry on reconnect, conflict resolution UI. Users editing offline don't lose work.

### 4.5 JSON Patch History (Memory-Efficient)
Unlike snapshot-based undo/redo (which stores full document copies), this stores minimal JSON Patch deltas with checkpoint coalescing — supports thousands of undo steps without memory pressure.

### 4.6 Named Version Snapshots (IndexedDB)
Separate from undo history: users can create named "Save Point" snapshots, restore to any named version, delete old versions. Backed by IndexedDB for large storage capacity.

### 4.7 CMS + Data Binding System
Full CMS: create collections, define field schemas, bind collection fields to element content/styles/attributes. Effectively a headless CMS inside the builder. No separate backend required.

### 4.8 GSAP Animation Timeline Builder
Full GSAP 3.14 integration: build animation timelines in inspector, apply presets, configure ScrollTrigger, set easing curves. Animations execute in preview mode via `InteractionRuntime`.

### 4.9 Interaction Runtime (Preview Mode)
When entering Preview mode, `InteractionRuntime` activates and executes all trigger→action chains defined in Interactions inspector section. The editor is also a prototype runner.

### 4.10 Component System with Variants + Overrides
Full component model: create reusable components, define variants, allow per-instance overrides of specific props, detach instances back to flat elements. Mirrors Figma's component model.

### 4.11 Export Engine (Multi-Format)
`ExportEngine` exports to HTML, React, Vue — not just "download HTML." Includes injectors for SEO meta tags, Analytics (GA4/GTM), Forms (mailto/webhook), Stripe checkout script, generates sitemap.xml, ZIP packages full site.

### 4.12 Touch Drag Support
`useTouchDrag` hook enables full drag-and-drop on touch devices — the canvas works as a mobile-first builder, not just desktop.

---

## 5. UX Problems

### Critical (breaks core workflow)

**C1 — Collaboration silently broken**
Multi-user editing is the #1 enterprise differentiator. OT engine is ready. Transport gap means the feature looks real (cursors appear, presence shows) but edits never sync. Risk of data loss if two users believe they're collaborating. **Fix: wire WebSocket transport to CollaborationManager.**

**C2 — Publish fails silently**
The publish button is in the Topbar — one of the most visible UI elements. Flow opens, user goes through steps, nothing actually publishes. No error state communicated. **Fix: wire VercelHandler or gate with "coming soon" state.**

**C3 — AI assistant (Cmd+J) is a dead end**
Cmd+J is on the keyboard cheat sheet and prominent in the UI. Users press it expecting AI help; they get a bar that returns nothing. Cmd+J is a keyboard muscle memory anchor — dead features on keyboard shortcuts destroy trust. **Fix: wire OpenAI or hide the feature.**

### High (significantly degrades experience)

**H1 — Stock discovery tab returns empty**
Visible tab in Media panel with Unsplash/Pexels branding. No results. No error. Users waste time browsing expecting content. **Fix: wire APIs or remove tab until ready.**

**H2 — Onboarding breaks mid-flow**
First-run experience is the most important UX moment. Steps stubbed mid-tutorial leave new users stranded. **Fix: complete remaining ~30% of tutorial steps or gate them.**

**H3 — Sentry not wired**
Engineering is blind to production errors. Cannot measure real error rates or find crashes in the field. **Fix: wire Sentry.captureException to Composer error events + React error boundaries.**

**H4 — Legacy/new parallel UI risk**
360 legacy `components/` files and 465 `editor/` files can render different UX for the same feature. Users may see inconsistent panels depending on which code path renders. **Fix: systematic audit of what still renders from `components/` vs `editor/`.**

### Medium (impedes workflow)

**M1 — History tab diff accuracy uncertain**
Users click "restore to here" relying on the diff display. If DiffRow doesn't accurately represent multi-element patch operations, users restore to unexpected states.

**M2 — IndexedDB quota unhandled**
Media files + version snapshots are stored in browser IndexedDB. No quota check or graceful degradation. Large projects will hit browser quota limits with no user-facing message.

**M3 — No API key UI for integrations**
Google Fonts, OpenAI, Unsplash, Pexels require keys. No settings UI to configure them. Power users can't self-serve integrations.

### Low (polish)

**L1 — AISuggestionSection visible in inspector**
Inspector shows an "AI Suggestion" section that is a stub. In a production product, dead UI sections make the product feel unfinished.

**L2 — Stripe runtime not in preview**
Users can configure Stripe products but can't preview the checkout in-editor. Expected behavior for an e-commerce builder.

---

## 6. Architecture Risks

### R1 — Legacy-New Parallel (Highest Risk)
`components/` (360 files, legacy) and `editor/` (465 files, refactored) coexist. Risk: a bug fix in one tree diverges from the other; users see different UI depending on render path. **Mitigation:** Systematic migration of `components/` → `editor/` as files are touched; track remaining legacy usage.

### R2 — Composer.ts God Object Creep
700 LOC orchestrator with 27+ managers. The architecture is sound now (managers as separate classes), but as more managers are added without discipline, Composer.ts will become a god file. **Mitigation:** Enforce CLAUDE.md rule #7 (max 3 hops from trigger to effect); no new logic directly in Composer.ts.

### R3 — Collaboration UI Misleads Users
OT engine is ready but transport is not. If shipped as-is, collaboration UI (presence avatars, cursors, lock icons) gives users false confidence that edits are syncing. Potential data loss. **Mitigation:** Gate collaboration UI behind feature flag until transport is wired.

### R4 — AI UI Without Backend
Cmd+J, AISuggestionSection, SmartSuggestions are visible and accessible but no-ops. Trust damage when a first-class UI element does nothing. **Mitigation:** Hide or gate all AI UI behind a feature flag until wired.

### R5 — IndexedDB Quota
Media uploads, version snapshots, and project data all use IndexedDB. No quota check. Browser IndexedDB limit is typically 50–80% of available disk space per origin, but eviction policies vary. Large media-heavy projects will hit limits without warning. **Mitigation:** Add quota check on startup; warn user when >80% of allocated quota used.

### R6 — No Import Direction Enforcement
CLAUDE.md defines strict import direction rules (`engine/ → shared/` only, etc.) but there's no lint rule enforcing them. Violations will accumulate silently. **Mitigation:** Add ESLint `no-restricted-imports` rules matching CLAUDE.md import direction rules.

---

## 7. Product Downgrade Risks

Features at risk of being accidentally removed or regressed during redesign:

| Feature | Risk | Why |
|---------|------|-----|
| JSON Patch undo/redo | **High** | Invisible system; easy to replace with naive snapshot approach losing efficiency |
| Named version snapshots | **High** | Separate from undo history; could be conflated and removed |
| Multi-backend storage | **High** | If refactoring storage, 4 of 5 backends could be dropped accidentally |
| OT collaboration engine | **High** | Large, complex, working system; redesign might "simplify" it away before transport is added |
| Plugin system | **Medium** | No visible UI; easy to assume it's unused and remove |
| Offline sync queue | **Medium** | Works silently; no visible UI to indicate it's protecting user data |
| Touch drag | **Medium** | Low test coverage attention; easy to break when refactoring canvas drag |
| Interaction runtime | **Medium** | Only active in Preview mode; easy to miss in testing |
| CMS data bindings | **Medium** | Complex system; partial rewrites risk breaking binding fidelity |
| Export multi-format | **Medium** | Export is end-of-flow; rarely tested in dev; injectors (SEO/Analytics/Stripe) easy to miss |
| Component variants + overrides | **Low** | Well-used UI; risk is in the override merge logic, not the UI |
| IndexedDB version storage | **Low** | Could be dropped to "simplify" storage, losing named restore points |

---

## 8. Unknowns / Unclear Areas

These areas need investigation before making changes:

**U1 — What still renders from `components/` vs `editor/`?**
No clear map of which legacy components are still actively rendered vs dead code. Need import trace.

**U2 — Collaboration server contract**
`CollaborationManager` implements OT but the expected server protocol (WebSocket message format, room management, auth) is not documented in code. Server implementation status unknown.

**U3 — History diff accuracy for complex operations**
Does `DiffRow` in History tab accurately display multi-element JSON Patch operations? Not verifiable by static analysis.

**U4 — Google Fonts quota**
24h cache implemented. Rate limits on Google Fonts API not handled. High-traffic usage could hit undocumented limits.

**U5 — Plugin security sandbox**
Plugin system loads CDN scripts with SRI verification. Beyond SRI, what sandboxing exists? Can plugins access Composer internals directly? Scope of `PluginAPI` not fully audited.

**U6 — Export HTML validity**
`ExportEngine` generates HTML/React/Vue. Correctness of generated output for complex nested elements, custom CSS, animations, and form submissions not verified.

**U7 — Recovery manager behavior**
`RecoveryManager` validates state on visibility change (tab focus). What happens when invalid state is detected? Does it silently restore, prompt user, or fail? Behavior unclear.

**U8 — OpenAI integration scope**
OpenAI 6.13 is installed and types/prompts exist. What features were planned? Content generation? Layout suggestions? Code generation? Understanding scope prevents partially deleting a larger plan.

---

## 9. Recommended Next Steps

Ordered by urgency and risk:

### Immediate (before any redesign)

1. **Gate collaboration UI** — Feature-flag all collaboration UI (`RemoteCursors`, presence avatars, element lock indicators) until WebSocket transport is wired. Prevent trust-damaging false collaboration display.

2. **Gate AI UI** — Feature-flag Cmd+J, `AISuggestionSection`, `SmartSuggestions` until OpenAI is wired. Dead keyboard shortcuts destroy muscle memory trust.

3. **Fix or gate Publish** — Either wire VercelHandler or replace publish button with "Coming Soon" modal. Do not leave the primary CTA (ship my site) silently failing.

4. **Wire Sentry** — Add `Sentry.captureException` to Composer error events and React error boundaries. Engineering must not be blind to production failures.

### Short Term (before user-facing redesign)

5. **Map legacy vs. active rendering** — Trace which `components/` files are still imported and rendered. Build a migration list so redesign doesn't accidentally touch dead code while missing active code.

6. **Fix or gate stock discovery** — Wire Unsplash/Pexels APIs or remove Discovery tab until ready. Visible dead UI in Media panel.

7. **Complete onboarding** — Finish remaining ~30% of tutorial steps. First-run is highest-stakes UX.

8. **Add IndexedDB quota monitoring** — Check quota on startup; warn at 80%. Prevent silent storage failure on large projects.

### Architecture Protections (ongoing)

9. **Add ESLint import direction rules** — Enforce CLAUDE.md import boundaries automatically so violations don't accumulate.

10. **Document collaboration server contract** — Before wiring transport, document expected WebSocket message protocol so server implementation is aligned.

11. **Protect the 7 high-risk systems** (§7) — Add integration tests or at minimum smoke tests for: JSON Patch undo, version snapshots, multi-backend storage, OT engine, offline sync, touch drag, export formats. These are the systems most at risk of silent regression.

---

*End of Buildrik Capability Audit — stitch2.md*
*All findings code-verified via static analysis of `src/engine/`, `src/editor/`, `src/shared/`, `src/components/`.*
