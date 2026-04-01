# Components Tab

> **Module:** Sidebar — Tab 5
> **Source:** `src/editor/sidebar/tabs/component-library/`
> **Keyboard Shortcut:** Shift+A
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Components tab manages reusable component definitions — the core of a design team's consistency system. Users can create components **from canvas selection or from scratch**, view all instances, manage overrides and variants, and insert component instances onto the canvas. Similar to Figma's component system with main components and instances.

## Layout

```
+---------------------------+
| Components                |
| [+ From Selection]        |
| [+ Create from Scratch]   |
+---------------------------+
| [Search: "Find..."]       |
| [Filter: All|In Use|Unused]|
+---------------------------+
| 📦 Hero Banner     (×3)  |
|    Used 3 times           |
+---------------------------+
| 📦 Card Component  (×7)  |
|    Used 7 times           |
+---------------------------+
| 📦 Nav Link        (×12) |
|    Used 12 times          |
+---------------------------+
```

### Component Detail Screen (drill-in)
```
+---------------------------+
| [← Back] Card Component   |
+---------------------------+
| Preview                   |
| +----------------------+  |
| | [Component preview]  |  |
| +----------------------+  |
+---------------------------+
| Variants                  |
|  [Primary ✓] [Secondary] |
|  [Outline] [+ Add]       |
+---------------------------+
| Instances (7)             |
|  - Page: Home, Header     |
|  - Page: About, Hero      |
|  - ...                    |
+---------------------------+
| [Rename] [Delete] [Lock]  |
+---------------------------+
```

## Fields

### Component List
| Element | Type | Behavior |
|---------|------|----------|
| Component icon | Badge | Component type icon |
| Component name | Text | Display name |
| Instance count | Badge | Number of instances across all pages |
| Filter chips | Button group | All, In Use (has instances), Unused (no instances) |

### Component Detail
| Field | Type | Behavior |
|-------|------|----------|
| Preview | Rendered | Visual preview of the component |
| Variant selector | Chip group | Switch between named variants; add new variants |
| Instance list | List | Shows every instance with page name + parent context |
| Rename | Action | Change component name |
| Delete | Action | Delete component (warning if instances exist) |
| Lock | Toggle | Prevent instance overrides |

## Interactions

### Create Component from Selection
- **Trigger:** Select element(s) on canvas → Click "+ From Selection" or use context menu
- **Behavior:** Selected element(s) become a component definition → original elements become the first instance → name input prompt → component appears in list
- **Requirement:** At least one element must be selected

### Create Component from Scratch
- **Trigger:** Click "+ Create from Scratch" button
- **Behavior:** Name input prompt → empty component shell created → component detail screen opens → user builds the component's element tree inside a mini-canvas or by dragging elements from Add Tab into the component definition
- **Use case:** Design team lead defines the component library structure BEFORE building pages — design-system-first workflow

### Insert Component Instance
- **Trigger:** Drag component from list to canvas, or click to insert
- **Behavior:** New instance of component created → linked to main component definition → inherits all styles and children → overrides can be applied per-instance

### Override Instance Property
- **Trigger:** Select a component instance on canvas → edit any property in Inspector
- **Behavior:** Changed property becomes an "override" on that instance → overridden properties are marked in Inspector → main component retains original value

### Sync Instance to Main
- **Trigger:** Main component is edited
- **Behavior:** All instances update to match main component changes → except for properties with local overrides, which retain their override values

### Detach Instance
- **Trigger:** Right-click instance → "Detach from Component"
- **Behavior:** Instance becomes regular elements → no longer linked to component → loses auto-sync

### Delete Component
- **Trigger:** Component detail → Delete button
- **Behavior:** Warning if instances exist ("This will detach N instances") → confirmation → all instances detached → component removed from library

### Component Variants
- **Trigger:** Component detail → Add Variant, or click variant chip
- **Behavior:** Create named variants (e.g., "Primary", "Secondary", "Outline") → instances can switch between variants → each variant has its own style set

### Switch Variant (Canvas Context Menu)
- **Trigger:** Right-click a component instance on canvas → "Switch Variant" submenu
- **Behavior:** Shows all available variants → clicking one switches the instance's active variant immediately
- **Rationale:** One-click variant switching on canvas is faster than opening Inspector → finding variant selector for the rapid iteration design teams need

## Business Rules

1. A component is defined by a "main" element tree; instances are linked clones
2. Overrides are per-instance and per-property; non-overridden properties sync with main
3. Deleting a component detaches all instances (they become regular elements)
4. Components are stored in IndexedDB via ComponentStorage and synced across team members via SyncManager
5. Component variants allow style switching without creating separate components
6. Locked components prevent instance overrides entirely
7. **Two creation paths:** "From Selection" (bottom-up) and "From Scratch" (top-down, design-system-first)
8. **Variant switching is available in canvas context menu** — not just Inspector

## Screen Relationships
- **From:** Canvas (create component from selection, context menu variant switch)
- **To:** Canvas (insert instance), Inspector (shows component variant selector and override indicators)
- **Data coupling:** Component changes propagate to all instances across all pages; components sync across team via SyncManager
