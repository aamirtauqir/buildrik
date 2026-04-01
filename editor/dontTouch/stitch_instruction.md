# Precision Dark

## Product Overview

**The Pitch:** Buildrick is a high-fidelity visual web editor designed for developers. It eliminates the friction between design and code by providing a strict, DOM-accurate canvas with premium typographic and layout controls.

**For:** Frontend engineers and technical designers who demand precision over templates and CSS-native tooling over abstractions.

**Device:** desktop

**Design Direction:** Utilitarian premium. Deep zinc backgrounds, microscopic 1px borders, rigid alignments, and piercing indigo active states. Zero unnecessary gradients.

**Inspired by:** Linear, Vercel

---

## Screens

- **Editor Default:** Main canvas view with collapsed panels and top command bar
- **Layers Panel:** DOM tree navigator with drag-and-drop hierarchy
- **Element Selected:** Contextual properties sidebar for CSS manipulation
- **Responsive Preview:** Canvas scaled to mobile viewport with active breakpoints
- **Publish Overlay:** Deployment status and commit message modal

---

## Key Flows

**Styling a Layout Node:** Manipulating flexbox properties on a div.

1. User is on Editor Default -> sees main canvas
2. User clicks Canvas Node -> Element Selected state activates, Right Sidebar opens
3. User clicks Flex Direction Row -> Canvas updates instantly, DOM tree reflects changes

---

## Design System

### Color Palette

- **Primary:** `#6366F1` - Active states, toggles, primary buttons
- **Background:** `#09090B` - Main canvas area, absolute backdrop
- **Surface:** `#18181B` - Sidebars, toolbars, modals
- **Text:** `#FAFAFA` - High-contrast text, active icons
- **Muted:** `#A1A1AA` - Secondary text, inactive icons, `1px` borders (`#27272A`)
- **Accent:** `#38BDF8` - Selection outlines, hover indicators

### Typography

- **Headings:** JetBrains Mono, 600, 14px
- **Body:** Geist, 400, 13px
- **Small text:** Geist, 400, 11px
- **Buttons:** Geist, 500, 12px

**Style notes:** Ultra-dense UI. `4px` border radius everywhere. `1px solid #27272A` borders separate all panels. No drop shadows; elevation is denoted by border boundaries and background lightening.

### Design Tokens

```css
:root {
  --color-primary: #6366F1;
  --color-background: #09090B;
  --color-surface: #18181B;
  --color-surface-hover: #27272A;
  --color-border: #27272A;
  --color-text: #FAFAFA;
  --color-text-muted: #A1A1AA;
  --color-accent: #38BDF8;
  --font-sans: 'Geist', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius: 4px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
}
```

---

## Screen Specifications

### Editor Default

**Purpose:** Base starting state for canvas manipulation.

**Layout:** 48px top bar, 240px left sidebar (collapsed), 280px right sidebar (collapsed), center infinite canvas.

**Key Elements:**

- **Top Bar:** 48px height, `#18181B`, bottom border `#27272A`. Contains project name, breakpoint toggles, Publish button.
- **Canvas:** `#09090B` background. Renders iframe of user site.
- **Toolbar:** Floating vertically, left-aligned in canvas. 40px wide, `#18181B`, 1px border.

**States:**

- **Empty:** "Press [I] to insert node" watermark in `#A1A1AA` JetBrains Mono on canvas.
- **Loading:** Subtle `#6366F1` indeterminate progress bar at absolute top.
- **Error:** Red `#F87171` toast notification, bottom right.

**Components:**

- **Project Title:** JetBrains Mono, `#FAFAFA`, 14px.
- **Publish Button:** 28px height, `#FAFAFA` text, `#6366F1` background, 4px radius.

**Interactions:**

- **Hover Canvas Elements:** 1px solid `#38BDF8` outline appears.
- **Click Insert [I]:** Left sidebar expands instantly.

**Responsive:**

- **Desktop:** Locked to 100vw/100vh. No scrolling on body.

### Layers Panel

**Purpose:** DOM tree navigation and hierarchy management.

**Layout:** 240px left sidebar, flush against left screen edge.

**Key Elements:**

- **Panel Header:** 32px height, "LAYERS" text (`#A1A1AA`, 11px, JetBrains Mono).
- **Tree Node:** 28px height per row. Indented 12px per level.
- **Visibility Toggle:** Eye icon, appears on hover of Tree Node.

**States:**

- **Empty:** "No elements on canvas" text.
- **Dragging:** Blue `#6366F1` horizontal line indicates drop target.

**Components:**

- **Node Item:** 13px Geist text. Icon + tag name (`div`, `section`).

**Interactions:**

- **Hover Node:** Background changes to `#27272A`. Canvas element highlights `#38BDF8`.
- **Click Node:** Background changes to `#312E81` (Indigo 900), text `#FAFAFA`.

**Responsive:**

- **Desktop:** Fixed width 240px.

### Element Selected

**Purpose:** Modify CSS properties of active DOM node.

**Layout:** 280px right sidebar, split into accordion sections (Layout, Spacing, Typography).

**Key Elements:**

- **Class Selector:** Input field at top. `#18181B` bg, 1px `#27272A` border. Contains applied utility classes.
- **Flex Controls:** 3x3 grid of alignment boxes. `#27272A` inactive, `#6366F1` active.
- **Spacing Input:** Cross-shaped layout for margin/padding exact pixel inputs.

**States:**

- **Empty:** (If nothing selected) "Select an element to edit properties".
- **Inherited Value:** Text color `#A1A1AA` to show inherited CSS.

**Components:**

- **Accordion Header:** 32px height, 13px Geist, border-top `#27272A`.
- **Segmented Control:** 24px height, `#09090B` background, active pill `#27272A`.

**Interactions:**

- **Hover Input:** Border changes to `#6366F1`.
- **Drag Input Label:** Scrub value up/down. Arrow cursor.

**Responsive:**

- **Desktop:** Fixed width 280px. Scrollable Y axis.

### Responsive Preview

**Purpose:** Validate layout across device breakpoints.

**Layout:** Canvas shrinks to exact mobile dimensions, centered. Background dims.

**Key Elements:**

- **Viewport Ruler:** Horizontal bar above canvas showing pixel width.
- **Canvas Frame:** Wrapper around iframe. 1px `#27272A` border, adds drag handles on left/right edges.
- **Active Breakpoint Indicator:** Top bar icon highlights `#6366F1` (Mobile).

**States:**

- **Resizing:** Width overlay tooltip appears (e.g., `375px`).

**Components:**

- **Drag Handle:** 16px wide, `#18181B` background, vertical grip lines (`#A1A1AA`).

**Interactions:**

- **Drag Handle:** Canvas resizes smoothly. If passed breakpoint threshold, active breakpoint icon switches.

**Responsive:**

- **Desktop:** Surrounding UI remains static, only canvas frame changes size.

### Publish Overlay

**Purpose:** Confirm and deploy site changes.

**Layout:** Centered modal, 400px width. Canvas darkens.

**Key Elements:**

- **Backdrop:** `#000000` at 60% opacity, backdrop-blur 4px.
- **Modal Box:** `#18181B` background, 1px `#27272A` border, 8px radius.
- **Commit Input:** Textarea for deployment notes.

**States:**

- **Deploying:** Primary button changes to spinner, text "Deploying...".
- **Success:** Green checkmark `#34D399`, button text "View Live Site".

**Components:**

- **Modal Header:** 14px JetBrains Mono, "Deploy to Production".
- **Confirm Button:** 32px height, `#6366F1` background, 100% width.

**Interactions:**

- **Click Outside:** Dismiss modal.
- **Press ESC:** Dismiss modal.

**Responsive:**

- **Desktop:** Absolute center.

---

## Build Guide

**Stack:** HTML + Tailwind CSS v3

**Build Order:**

1. **Editor Default** - Establishes strict DOM layout (flex-col, flex-row), grid system, and 1px border tokens.
2. **Layers Panel** - Implements typography hierarchy and complex hover states.
3. **Element Selected** - Densest UI; proves out form inputs, segmented controls, and accordions.
4. **Responsive Preview** - Requires iframe wrapper logic and absolute positioning over center stage.
5. **Publish Overlay** - Tests z-index stacking context and blur filters.
