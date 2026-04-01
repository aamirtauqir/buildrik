# Add / Build Tab

> **Module:** Sidebar — Tab 1
> **Source:** `src/editor/sidebar/tabs/build/`
> **Keyboard Shortcut:** A
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Add (Build) tab is the element catalog — the primary way users insert new elements onto the canvas. It organizes 150+ element types into searchable, categorized groups with **Sections as the default top category** (design teams think in Hero/CTA/Pricing, not div/text), a team-synced favorites system, and quick access to user-created components.

## Layout

```
+---------------------------+
| [Search: "Find elements"] |
+---------------------------+
| [Team Favorites ★]        |
|  [Hero] [CTA] [Card]      |
+---------------------------+
| Sections (DEFAULT TOP)    |
|  [Hero] [CTA] [Pricing]   |
|  [Testimonials] [Features] |
|  [Contact] [Footer]       |
+---------------------------+
| Navigation                |
|  [Navbar] [Menu]          |
|  [Header] [Footer]        |
|  [Breadcrumbs]            |
+---------------------------+
| Containers                |
|  [Container] [Section]    |
|  [Columns] [Grid] [Flex]  |
+---------------------------+
| Text                      |
|  [Heading] [Paragraph]    |
|  [Text] [Link] [List]     |
+---------------------------+
| Buttons                   |
|  [Button] [Icon Button]   |
+---------------------------+
| Forms                     |
|  [Input] [Textarea]       |
|  [Select] [Checkbox]      |
|  [Form] [Radio]           |
+---------------------------+
| Media                     |
|  [Image] [Video] [Audio]  |
|  [SVG] [Lottie] [Icon]    |
+---------------------------+
| Components (built-in)     |
|  [Card] [Badge] [Alert]   |
|  [Accordion] [Slider]     |
+---------------------------+
| E-commerce                |
|  [Product Card]           |
|  [Product Grid] [Cart]    |
+---------------------------+
| My Components             |
|  [UserComponent1]         |
|  [UserComponent2]         |
+---------------------------+
```

## Fields

### Search Bar
| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| Search input | Text | No | Empty | Fuzzy search across all element names and categories |

### Element Categories (Ordered by Design Team Priority)

| Category | Element Types | Count | Why This Order |
|----------|--------------|-------|----------------|
| **Sections** | Hero, CTA, Testimonials, Pricing, Features, Contact, Footer | 7+ | Design teams reach for pre-built sections first; reduces time-to-first-layout |
| **Navigation** | Navbar, Nav, Header, Footer, Breadcrumbs | 5 | Navigation is typically the first structural decision |
| **Containers** | Container, Section, Columns, Grid, Flex, Spacer, Divider | 7 | Structural layout building blocks |
| **Text** | Heading, Paragraph, Text, Link, List | 5 | Content elements |
| **Buttons** | Button, Icon Button | 2 | Action elements |
| **Forms** | Form, Input, Textarea, Select, Checkbox, Radio, Date, File Upload, Range, Toggle | 10+ | Form elements |
| **Media** | Image, Video, Audio, SVG, Lottie, Icon, Gallery | 7+ | Rich media elements |
| **Components** | Card, Badge, Alert, Accordion, Slider, Progress, Countdown | 7+ | Pre-built UI patterns |
| **E-commerce** | Product Card, Product Grid, Product Detail, Cart | 4 | Commerce-specific elements |
| **Layout** | Grid layouts, Flex layouts, Column presets | 7+ | Quick preset layout patterns |

### Team Favorites Section
| Field | Type | Behavior |
|-------|------|----------|
| Favorites grid | Element tiles | Shows team-shared favorited elements |
| Star toggle | Icon on each element | Click to add/remove from favorites |
| Sync | Automatic | Favorites sync across team members via SyncManager for collaborative projects; falls back to localStorage for solo projects |

### My Components Section
| Field | Type | Behavior |
|-------|------|----------|
| Component list | Element tiles | Shows user-created reusable components |
| Empty state | Message | "No components yet. Select elements and save as component." |

## Interactions

### Search Elements
- **Trigger:** Type in search bar
- **Behavior:** Fuzzy match filters visible elements in real-time → matching elements highlighted → categories with no matches collapse
- **Debounce:** Input debounced for performance
- **Reset:** Clear button (×) or empty search restores full catalog

### Insert Element (Drag)
- **Trigger:** Drag element tile toward canvas
- **Behavior:** Ghost preview follows cursor → canvas shows drop zones → release inserts element at drop position
- **Validation:** Element inserted as child of nearest valid container

### Insert Element (Click)
- **Trigger:** Click element tile
- **Behavior:** Element inserted inside currently selected element (or at page root if no selection) → element auto-selected after insertion
- **Toast:** "Element added" confirmation

### Favorite an Element
- **Trigger:** Hover element tile → click star icon
- **Behavior:** Element added to Team Favorites section → synced via SyncManager for collaborative projects
- **Unfavorite:** Click star again to remove

### Onboarding Tips
- **Trigger:** First-time users or tip not dismissed
- **Behavior:** Collapsible hint card at top of tab: "Drag sections onto the canvas to start building"
- **Dismiss:** Click × to dismiss; persisted so it doesn't reappear

## Business Rules

1. **Sections are the default top category** — positioned first in the list because design teams think in page sections (Hero, CTA, Pricing), not atomic elements (div, text, span)
2. Each element tile shows: icon + display name
3. Sections (Hero, CTA, etc.) insert pre-built multi-element compositions, not single elements
4. E-commerce elements require CMS collection setup to display real data
5. "My Components" section only appears when user has created at least one component
6. Element categories are hardcoded in `catalog.ts`; not user-configurable
7. **Team Favorites sync** via SyncManager for collaborative projects; localStorage fallback for solo projects

## Screen Relationships
- **To:** Canvas (elements inserted on canvas), Inspector (new element auto-selected → inspector shows properties)
- **Data coupling:** Element creation triggers Composer `element:created` event → Layers tab updates tree
