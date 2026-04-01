# MODULE 1: CORE EDITOR — Complete Specification
## Canvas + Breakpoints + Elements + Inspector (Modified Option D)

---

# PART 1: CANVAS SPECIFICATION

## 1.1 Canvas Overview

The Canvas is the primary editing surface where users build their pages visually using drag-and-drop.

### Canvas Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR (48px)                                                               │
├──────┬────────────────────────────────────────────────────┬──────────────────┤
│      │                                                     │                  │
│ RAIL │                    CANVAS AREA                    │    INSPECTOR     │
│ 56px │                    (scrollable)                    │      320px       │
│      │                                                     │                  │
│      │   ┌─────────────────────────────────────────┐     │                  │
│      │   │                                          │     │                  │
│      │   │          EDITOR CANVAS                  │     │                  │
│      │   │                                          │     │                  │
│      │   │    ┌─────────────────────────────┐       │     │                  │
│      │   │    │                             │       │     │                  │
│      │   │    │       PAGE CONTENT         │       │     │                  │
│      │   │    │                             │       │     │                  │
│      │   │    └─────────────────────────────┘       │     │                  │
│      │   │                                          │     │                  │
│      │   └─────────────────────────────────────────┘     │                  │
│      │                                                     │                  │
├──────┴────────────────────────────────────────────────────┴──────────────────┤
│ FOOTER TOOLBAR (optional)                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Canvas Interactions

### Selection Actions

| Action | Trigger | Description |
|--------|---------|-------------|
| **Single Select** | Click on element | Select one element |
| **Multi-Select (Add)** | Shift + Click | Add element to selection |
| **Multi-Select (Box)** | Click + Drag on empty | Select all elements in box |
| **Select All** | Cmd/Ctrl + A | Select all elements |
| **Deselect** | Click on empty area | Clear selection |
| **Invert Selection** | Cmd/Ctrl + Shift + I | Invert current selection |

### Manipulation Actions

| Action | Trigger | Description |
|--------|---------|-------------|
| **Move** | Drag selected element | Move element(s) |
| **Resize** | Drag handle | Resize element |
| **Inline Edit** | Double-click text | Edit text content directly |
| **Copy** | Cmd/Ctrl + C | Copy selected element(s) |
| **Paste** | Cmd/Ctrl + V | Paste copied element(s) |
| **Duplicate** | Cmd/Ctrl + D | Duplicate selected element(s) |
| **Delete** | Backspace / Delete | Delete selected element(s) |
| **Undo** | Cmd/Ctrl + Z | Undo last action |
| **Redo** | Cmd/Ctrl + Shift + Z | Redo undone action |

### Navigation Actions

| Action | Trigger | Description |
|--------|---------|-------------|
| **Pan** | Scroll / Space + Drag | Move canvas view |
| **Zoom In** | Cmd/Ctrl + Plus | Increase zoom |
| **Zoom Out** | Cmd/Ctrl + Minus | Decrease zoom |
| **Zoom Reset** | Cmd/Ctrl + 0 | Reset to 100% |
| **Zoom to Fit** | Cmd/Ctrl + 1 | Fit content in view |
| **Toggle Layers** | F | Show/hide layers overlay |

### Context Actions

| Action | Trigger | Description |
|--------|---------|-------------|
| **Context Menu** | Right-click | Show element actions |
| **Quick Actions** | Click element + hover | Show quick action buttons |

---

## 1.3 Selection Handles

### Handle Positions

```
┌──────────────────────────────────────────┐
│                                          │
│    ┌────────────────────────────────┐     │
│    │ ┌──┐                    ┌──┐  │     │
│    │ │  │                    │  │  │     │
│    │ │◄─│    SELECTED       │─►│  │     │
│    │ │  │      ELEMENT      │  │  │     │
│    │ └──┘                    └──┘  │     │
│    │ └──┘    ┌──┐        └──┘──┘ │     │
│    │         └──┘                  │     │
│    │    RESIZE HANDLES            │     │
│    └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
```

### Handle Types

| Position | Type | Function |
|----------|------|----------|
| Top-Left | Corner | Resize width + height |
| Top-Right | Corner | Resize width + height |
| Bottom-Left | Corner | Resize width + height |
| Bottom-Right | Corner | Resize width + height |
| Top-Center | Edge | Resize height |
| Bottom-Center | Edge | Resize height |
| Left-Center | Edge | Resize width |
| Right-Center | Edge | Resize width |
| Center | Move | Move element |

### Handle Visual States

| State | Color | Style |
|-------|-------|-------|
| Default | Blue (#0066FF) | Solid |
| Hover | Blue (#0066FF) | Solid, cursor change |
| Dragging | Blue (#0066FF) | Solid, element ghost |
| Locked | Gray (#9CA3AF) | Dashed |

---

## 1.4 Snap Guides

### Snap Behavior

```
┌────────────────────────────────────────────┐
│                                            │
│    DRAGGING ELEMENT                        │
│         │                                  │
│         │  Shows snap guides when near:     │
│         │  • Other element edges           │
│    ┌────▼────┐                             │
│    │ Element │ ←── Snap to element edge    │
│    └─────────┘                             │
│         │                                  │
│    ───────────  Snap to center line         │
│                                            │
└────────────────────────────────────────────┘
```

### Snap Settings

| Setting | Default | Options |
|--------|---------|---------|
| Snap to Elements | On | On / Off |
| Snap to Guides | On | On / Off |
| Snap to Grid | Off | On / Off |
| Snap Threshold | 10px | 5-20px |

### Guide Colors

| Guide Type | Color | Style |
|------------|-------|-------|
| Element Edge | Blue (#0066FF) | Dashed |
| Element Center | Cyan (#06B6D4) | Dashed |
| Page Margin | Purple (#8B5CF6) | Dashed |
| Custom Guide | Orange (#F59E0B) | Dashed |

---

## 1.5 Canvas Overlays

### Grid Overlay (Optional)

```
┌────────────────────────────────────────────┐
│  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐   │
│  ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤   │
│  │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │   │
│  ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤   │
│  │ │ │ │ │ │ │ │ │ │ │ │ │ │ │ │   │
│  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘   │
└────────────────────────────────────────────┘
```

### Ruler Overlay (Optional)

```
┌────────────────────────────────────────────┐
│   0    100   200   300   400   500  px │
│ ┌────────────────────────────────────────┐ │
│ │││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││││ │Rulers (optional)
└────────────────────────────────────────────┘
```

---

## 1.6 Empty Canvas State

```
┌────────────────────────────────────────────┐
│                                            │
│                                            │
│         ┌─────────────────┐               │
│         │                 │               │
│         │   EMPTY CANVAS │               │
│         │                 │               │
│         │  ┌───────────┐  │               │
│         │  │  Start    │  │               │
│         │  │ Template  │  │               │
│         │  └───────────┘  │               │
│         │                 │               │
│         │  ┌───────────┐  │               │
│         │  │   Add     │  │               │
│         │  │  Element  │  │               │
│         │  └───────────┘  │               │
│         └─────────────────┘               │
│                                            │
└────────────────────────────────────────────┘
```

---

## 1.7 Context Menu

```
┌────────────────────────────────────────────┐
│  Cut                    Cmd+X              │
│  Copy                   Cmd+C              │
│  Paste                  Cmd+V              │
│  Duplicate              Cmd+D              │
│  ──────────────────────────────           │
│  Bring to Front        Cmd+]              │
│  Send to Back          Cmd+[              │
│  Bring Forward         Cmd+Shift+]        │
│  Send Backward         Cmd+Shift+[        │
│  ──────────────────────────────           │
│  Create Component     Cmd+Shift+K        │
│  ──────────────────────────────           │
│  Lock Element                             │
│  ──────────────────────────────           │
│  Delete                Backspace          │
└────────────────────────────────────────────┘
```

---

# PART 2: BREAKPOINTS SPECIFICATION

## 2.1 Breakpoint Definitions

| Breakpoint | Width | Icon | Label |
|------------|-------|------|-------|
| Desktop | 1440px+ | 🖥 | Desktop |
| Tablet | 768px - 1439px | 📱 | Tablet |
| Mobile | <768px | 📱 | Mobile |

## 2.2 Breakpoint Switcher UI

### Top Bar Location

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LOGO  │ Project Name  │  Save  │  Preview  │  [💻 Desktop ▼]  100% │ USER │
└─────────────────────────────────────────────────────────────────────────────┘
                                              ↑
                                         Dropdown
```

### Dropdown Options

```
┌────────────────────┐
│  💻 Desktop  1440px │ ← Current
│  📱 Tablet    768px  │
│  📱 Mobile    375px  │
├────────────────────┤
│  ──────────────────  │
│  Custom: [____px]    │
└────────────────────┘
```

## 2.3 Breakpoint Canvas Behavior

### Desktop (Default)
- Canvas shows at actual 1440px width
- Or scaled to fit container
- All elements render normally

### Tablet (768px)
- Canvas shows at 768px width
- Elements may reflow
- Shows tablet-specific overrides

### Mobile (375px)
- Canvas shows at 375px width
- Stack layout for many elements
- Shows mobile-specific overrides

## 2.4 Breakpoint Indicator

```
┌────────────────────────────────────────────┐
│  📱 Mobile                    375px       │ ← Fixed indicator
│  ┌────────────────────────────────────┐   │
│  │         CANVAS                     │   │
│  │      (scaled to fit)              │   │
│  │                                    │   │
│  │   Content wraps/stacks            │   │
│  │   as needed for mobile             │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

## 2.5 Responsive Behavior Rules

| Behavior | Description |
|---------|-------------|
| **Viewport Width** | Canvas sets to breakpoint width |
| **Scaling** | Canvas scales to fit if larger than container |
| **Scroll** | Horizontal scroll if content wider than viewport |
| **Overrides** | Breakpoint-specific styles applied |
| **Base Styles** | Desktop styles apply unless overridden |

---

# PART 3: 20 CORE ELEMENTS

## 3.1 Element List

| # | Element | Icon | Category | Description |
|---|---------|------|---------|-------------|
| 1 | **Text** | T | Basic | Plain text content |
| 2 | **Heading** | H | Basic | H1-H6 headings |
| 3 | **Paragraph** | ¶ | Basic | Paragraph text |
| 4 | **Image** | 🖼 | Media | Image element |
| 5 | **Video** | ▶ | Media | Video player |
| 6 | **Audio** | ♪ | Media | Audio player |
| 7 | **Icon** | ★ | Media | Icon display |
| 8 | **Button** | ◻ | Interactive | Clickable button |
| 9 | **Link** | 🔗 | Interactive | Anchor link |
| 10 | **Input** | □ | Form | Text input field |
| 11 | **Textarea** | ▢ | Form | Multi-line input |
| 12 | **Select** | ▼ | Form | Dropdown select |
| 13 | **Checkbox** | ☑ | Form | Checkbox input |
| 14 | **Radio** | ◉ | Form | Radio button |
| 15 | **Form** | 📝 | Form | Form container |
| 16 | **Div** | ◻ | Layout | Generic container |
| 17 | **Container** | ◻ | Layout | Semantic container |
| 18 | **Section** | ▤ | Layout | Full-width section |
| 19 | **Nav** | ☰ | Layout | Navigation container |
| 20 | **Iframe** | ◻ | Embed | External content |

---

## 3.2 Element Categories

### Basic Elements
```
┌─────────────────────────────────────────────┐
│  BASIC                                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ Text │ │ Head │ │ Para │ │ Link │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────┘
```

### Media Elements
```
┌─────────────────────────────────────────────┐
│  MEDIA                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Image │ │Video │ │Audio │ │ Icon │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────┘
```

### Form Elements
```
┌─────────────────────────────────────────────┐
│  FORMS                                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │Input │ │Check │ │Radio │ │Select│        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐                          │
│  │ Text  │ │ Form │                          │
│  │ Area  │ │      │                          │
│  └──────┘ └──────┘                          │
└─────────────────────────────────────────────┘
```

### Layout Elements
```
┌─────────────────────────────────────────────┐
│  LAYOUT                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ Div  │ │Cont. │ │ Sec  │ │ Nav  │        │
│  └──────┘ └──────┘ └──────┘ └──────┘        │
└─────────────────────────────────────────────┘
```

### Interactive Elements
```
┌─────────────────────────────────────────────┐
│  INTERACTIVE                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐                │
│  │Button│ │ Link │ │ Iframe│                │
│  └──────┘ └──────┘ └──────┘                │
└─────────────────────────────────────────────┘
```

---

## 3.3 Element Properties Summary

### Basic Elements

| Element | Content Properties | Style Properties |
|---------|-------------------|-----------------|
| **Text** | content, font | color, size, weight, spacing |
| **Heading** | content, level (H1-H6) | font, color, size |
| **Paragraph** | content | font, color, spacing |
| **Link** | href, target | color, underline, hover |

### Media Elements

| Element | Content Properties | Style Properties |
|---------|-------------------|-----------------|
| **Image** | src, alt, object-fit | size, border, shadow |
| **Video** | src, autoplay, loop, controls | size, aspect-ratio |
| **Audio** | src, autoplay, loop, controls | width |
| **Icon** | icon-name, size | color |

### Form Elements

| Element | Content Properties | Style Properties |
|---------|-------------------|-----------------|
| **Input** | placeholder, type, value | border, padding, focus |
| **Textarea** | placeholder, rows | border, resize |
| **Select** | options, placeholder | border, arrow |
| **Checkbox** | checked, label | size, color |
| **Radio** | options, selected | size, color |
| **Form** | action, method | layout |

### Layout Elements

| Element | Content Properties | Style Properties |
|---------|-------------------|-----------------|
| **Div** | - | all box model |
| **Container** | tag (article, aside, etc.) | all box model |
| **Section** | tag (section) | all box model |
| **Nav** | - | all box model |

---

## 3.4 Element Default Styles

### Text Element
```css
.element-text {
  display: block;
  font-family: system-ui, sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #1F2937;
  line-height: 1.5;
}
```

### Heading Elements
```css
.element-h1 { font-size: 32px; font-weight: 700; }
.element-h2 { font-size: 24px; font-weight: 600; }
.element-h3 { font-size: 20px; font-weight: 600; }
.element-h4 { font-size: 18px; font-weight: 500; }
.element-h5 { font-size: 16px; font-weight: 500; }
.element-h6 { font-size: 14px; font-weight: 500; }
```

### Button Element
```css
.element-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: #3B82F6;
  color: #FFFFFF;
}
```

### Image Element
```css
.element-image {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: cover;
}
```

### Div/Container Element
```css
.element-div {
  display: block;
  width: 100%;
  min-height: 0;
}
```

---

## 3.5 Add Panel Structure

```
┌─────────────────────────────────────────────┐
│  🔍 Search elements...                        │
├─────────────────────────────────────────────┤
│                                             │
│  ── BASIC ─────────────────────────────     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ Text │ │ Head │ │ Para │ │ Link │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│  ── MEDIA ────────────────────────────      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Image │ │Video │ │Audio │ │ Icon │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│  ── LAYOUT ────────────────────────────      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ Div  │ │Cont. │ │ Sec  │ │ Nav  │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│  ── FORMS ──────────────────────────────    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Input │ │Check │ │Radio │ │Select│      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│  ┌──────┐ ┌──────┐                          │
│  │ Text │ │ Form │                          │
│  │ Area │ │      │                          │
│  └──────┘ └──────┘                          │
│                                             │
│  ── EMBED ─────────────────────────────     │
│  ┌──────┐                                   │
│  │Iframe│                                   │
│  └──────┘                                   │
│                                             │
└─────────────────────────────────────────────┘
```

---

# PART 4: KEYBOARD SHORTCUTS

## 4.1 Selection Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Select All | Cmd + A | Ctrl + A |
| Deselect All | Escape | Escape |
| Multi-Select Add | Shift + Click | Shift + Click |
| Box Select | Click + Drag | Click + Drag |

## 4.2 Edit Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Undo | Cmd + Z | Ctrl + Z |
| Redo | Cmd + Shift + Z | Ctrl + Shift + Z |
| Cut | Cmd + X | Ctrl + X |
| Copy | Cmd + C | Ctrl + C |
| Paste | Cmd + V | Ctrl + V |
| Duplicate | Cmd + D | Ctrl + D |
| Delete | Backspace / Delete | Backspace / Delete |

## 4.3 Layer Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Bring Forward | Cmd + ] | Ctrl + ] |
| Send Backward | Cmd + [ | Ctrl + [ |
| Bring to Front | Cmd + Shift + ] | Ctrl + Shift + ] |
| Send to Back | Cmd + Shift + [ | Ctrl + Shift + [ |

## 4.4 View Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Zoom In | Cmd + + | Ctrl + + |
| Zoom Out | Cmd + - | Ctrl + - |
| Zoom Reset | Cmd + 0 | Ctrl + 0 |
| Zoom to Fit | Cmd + 1 | Ctrl + 1 |
| Toggle Layers | F | F |
| Command Palette | Cmd + K | Ctrl + K |

## 4.5 File Shortcuts

| Action | Mac | Windows |
|--------|-----|---------|
| Save | Cmd + S | Ctrl + S |
| Preview | Cmd + P | Ctrl + P |
| Publish | Cmd + Shift + P | Ctrl + Shift + P |

---

# PART 5: ACCEPTANCE CRITERIA

## Canvas
- [ ] User can add elements via drag-drop
- [ ] User can select single element
- [ ] User can multi-select (Shift+click, box select)
- [ ] User can move elements by dragging
- [ ] User can resize via handles
- [ ] User can inline-edit text
- [ ] Right-click shows context menu
- [ ] Empty state shows 2 CTAs
- [ ] Snap guides appear when dragging
- [ ] Zoom works (25%-400%)

## Breakpoints
- [ ] Can switch Desktop/Tablet/Mobile
- [ ] Canvas shows breakpoint width
- [ ] Breakpoint indicator shows current
- [ ] Overrides save per breakpoint

## Elements
- [ ] All 20 elements available
- [ ] Elements organized by category
- [ ] Drag from panel to canvas works
- [ ] Each element has default styles

## Inspector (Modified Option D)
- [ ] 3 tabs: Box, Design, Content
- [ ] Simple + Advanced in each tab
- [ ] Expand/collapse works

## Shortcuts
- [ ] All shortcuts work as specified
- [ ] Undo/Redo functional

---

## FILE INFORMATION

| Property | Value |
|----------|-------|
| Document Name | Module1_CoreEditor_Complete.md |
| Version | 1.0 |
| Module | 1: Core Editor |
| Parts | Canvas, Breakpoints, Elements, Inspector, Shortcuts |
| Status | Complete Specification |
| Last Updated | 2026-03-24 |
