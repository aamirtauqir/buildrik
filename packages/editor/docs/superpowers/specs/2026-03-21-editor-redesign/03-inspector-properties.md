# Module 03 — Inspector & Properties

## Problem

The inspector has 89 files and 20+ sections across 3 tabs — feature-rich but overwhelming. Sections don't adapt to element type (flex controls show on non-flex elements). Pseudo-state editing (hover/focus/active) is hidden. Breakpoint overrides are invisible — users can't tell which properties differ at tablet vs desktop. The empty state (nothing selected) shows nothing useful. DevMode toggle is buried.

## Requirements

### Inspector States

| State | What Shows |
|-------|-----------|
| Nothing selected | Page-level info: page name, slug, "Edit SEO" link, keyboard shortcut tips |
| Single element | Full inspector: element identity → pseudo-state row → tab bar → scrollable sections |
| Multi-select (2+) | Multi-select toolbar: align, distribute, size match, group, wrap, delete |
| CMS-bound element | Same as single but bound properties show data source badge + chain icon |
| Component instance | Same as single but Layout tab shows Variants section with variant picker |

### Inspector Header (when element selected)
- Element identity: icon + type name + HTML tag badge
- Element breadcrumb: clickable ancestor chain (body > section > div.hero)
- DevMode toggle: always visible in header, switches to raw CSS view
- Copy element ID to clipboard
- Delete button with confirmation

### Pseudo-State Editing
- Row of buttons: Normal, Hover, Focus, Active, Disabled
- Selecting non-Normal state = editing that pseudo-state's CSS
- Visual indicator that you're in pseudo-state editing mode (amber/warning color)
- Override dots on states that have CSS overrides defined
- Each overridden property shows a reset-to-normal action

### Breakpoint Awareness
- Row showing: Desktop, Tablet, Mobile, Watch
- Active breakpoint highlighted
- Override dots on properties that differ from desktop base
- Hovering override dot shows: "Desktop value: 48px, Tablet override: 32px"
- Reset-to-desktop action per overridden property

### Tab Bar
- 3 tabs: Layout, Style, Effects
- Tab switching preserves scroll position within each tab

### Sections per Tab

**Layout (context-sensitive):**
- Position (type, top/right/bottom/left, z-index)
- Display (block/flex/grid/inline/none, visibility, overflow)
- Size (width, height, min/max, aspect ratio)
- Spacing (margin + padding with visual box model diagram)
- Flexbox (only when display=flex — direction, wrap, justify, align, gap)
- Grid (only when display=grid — template columns/rows, gap, auto-flow)
- Variants (only for component instances — variant picker, override indicators)

**Style:**
- Typography (font family, size, weight, line-height, letter-spacing, color, align, decoration, transform)
- Background (color OR gradient OR image — with position, size, repeat, blur)
- Border (width, style, color, radius — each side independently or linked)
- CSS Classes (text input + applied classes list)
- Link (href, target, rel — for link elements)
- Visibility (show/hide per breakpoint — 4-column toggle matrix)
- Data Attributes (key/value pairs)
- Element Properties (tag-specific: img src/alt, input type/placeholder, video controls, etc.)

### CMS Binding Integration
Any inspector field that can be data-bound shows a chain icon (Lucide `link`, 12px) to its right. Clicking the chain icon opens the Binding Dropdown (see Module 04). Bound fields show the collection.field name as a badge and become read-only. See Module 04 for full binding flow details.

**Effects:**
- Shadows (multiple layers, each with offset/blur/spread/color/inset)
- Transforms (rotate, scale, translate, skew, transform-origin)
- Animation (GSAP — entrance type, trigger, duration, delay, easing, preview)
- Interactions (event → action → target — click/hover/scroll triggers)
- AI Suggestions (contextual "try this" per element type, apply/regenerate)
- All CSS / DevMode (raw CSS editor, computed values — full view when DevMode on)

### Control Types
- All values shown in real CSS (P1: CSS is the truth)
- Number inputs with unit selectors (px, %, rem, em, vw, vh, auto)
- Color swatches that open color picker (project tokens shown first)
- Segmented controls for enumerated options (flex-direction, text-align)
- Sliders with number inputs for continuous values (opacity, blur)
- Visual box model diagram for spacing (interactive — click edges to edit)
- Section accordion: collapsible, first 3 expanded by default

### Search
- Search input filters sections by keyword
- Collapse All / Expand All buttons

## Flows

### Style an Element
1. Select element on canvas → inspector populates
2. Click Style tab → see Typography section (likely most used)
3. Change font-size → live canvas update immediately
4. Switch to Tablet breakpoint → see inherited desktop value dimmed
5. Change font-size for tablet → blue override dot appears
6. Switch back to Desktop → value unchanged, tablet has its override

### Edit Pseudo-State
1. Select element → click "Hover" in pseudo-state row
2. Amber indicator appears: "Editing :hover state"
3. Change background-color → applies to :hover CSS rule
4. Canvas shows hover styles applied (even without actual hover)
5. Click "Normal" → return to base state editing
6. Amber dot remains on "Hover" button indicating it has overrides

### Multi-select
1. Shift+click two elements → inspector shows multi-select toolbar
2. Click "Align Left" → both elements align
3. Click "Same Width" → both elements match width of the first selected

## Engine APIs

| Surface | API | Methods |
|---------|-----|---------|
| Style editing | `composer.styles` | getRule(), update(), toCSS(), getPseudoClasses() |
| Element info | `composer.elements` | getById(), getActivePage(), getElementType() |
| Breakpoints | `composer.viewport` | getDevice(), setDevice() |
| Components | `composer.components` | getVariants(), setVariant() |
| Selection | `composer.selection` | getSelectedId(), getSelected() |
| History | `composer.history` | beginTransaction(), endTransaction() |

## Constraints

- Inspector updates must be synchronous with canvas (no perceptible lag)
- All number inputs support: arrow key increment (1), shift+arrow (10)
- Color picker must show project design tokens before generic colors
- Scroll position per element: inspector remembers where user scrolled for each element ID
- Tab key moves between controls within inspector (standard form navigation)

## Reference

- **Webflow:** CSS property names in inspector, style panel density, breakpoint indicator
- **Figma:** Right panel section organization, auto-layout controls
- **Framer:** Inspector visual quality, clean section separators

## Component Lifecycle

- **Create:** Select element(s) on canvas → right-click → "Create Component" → name input modal → saved to component library
- **Component library:** Visible in Build tab under "My Components" section
- **Edit master:** Double-click component instance → enters isolation mode (other elements dimmed at 30% opacity) → edit master freely → click "Back to canvas" button to exit isolation
- **Instance overrides:** Any property change on an instance = override (shown with a blue reset dot next to the property). Reset via right-click → "Reset to master"
- **Detach:** Right-click instance → "Detach from component" → becomes regular elements, loses sync with master
- **Variants:** Defined on the master component. Selectable on instances via dropdown in the inspector Layout tab Variants section
- **Engine API:** `composer.components` — `create()`, `getAll()`, `getVariants()`, `setVariant()`, `detach()`

> **DevMode clarification:** DevMode is an inspector-level toggle (positioned in the inspector header). When ON, the Effects tab Section 6 (All CSS) shows the full raw CSS editor. The canvas rendering does not change — DevMode only affects inspector content.
