# Buildrik Left Panel — Pencil Design Prompts
**Date:** 2026-04-03
**Based on:** `2026-04-03-buildrik-leftpanel-complete-design.md`
**Note:** No design tokens, colors, or measurements — designer handles visual style. Prompts focus on layout, flow, and features only.

---

## How to use

Har prompt ek alag component ya state ka hai. Recommended order: 1 (Rail) → 2 (Add Tab) → 3 (Layers) → 4 (Pages) → baaki tabs → 9 (Master Sheet) last.

---

## PROMPT 1 — Rail + Panel Shell (Default State)

```
Design the left panel navigation system for a web app site builder called Buildrik. It has two parts: a narrow icon rail on the far left, and a wider panel that opens to the right of the rail.

RAIL (narrow vertical strip, always visible):
TOP ZONE — 6 icon buttons stacked vertically:
- Add (+) icon — "Add Elements"
- Templates (grid/boxes) icon — "Templates"
- Layers (stacked lines) icon — "Layers"
- Pages (document) icon — "Pages"
- Components (diamond/hexagon) icon — "Components"
- Media (image) icon — "Media"

A subtle divider line between top and bottom zones.

BOTTOM ZONE — 3 icon buttons:
- Design Tokens (palette) icon — "Design Tokens"
- Settings (gear) icon — "Settings"
- History (clock) icon — "History"

FOOTER ZONE — 1 icon button at the very bottom:
- Help (?) icon — external docs link, not a tab

Each icon button: the active/selected one is highlighted with an accent color or background. Others are muted.
Hover state: subtle background, tooltip to the right of icon showing tab name + keyboard shortcut (e.g. "Layers · Z")

PANEL (opens to the right of the rail):
Show the panel open to the "Layers" tab as the active example.
Panel has:
- A header row at the top: tab title "Layers" on the left, a pin icon and a close (✕) button on the right
- Tab content fills the rest of the panel
- At the very bottom: three small size-mode buttons (compact / normal / wide)

This is a dark-theme editor tool. The rail and panel float slightly above the canvas with a frosted glass / translucent effect.
```

---

## PROMPT 2 — Add Elements Tab

```
Design the "Add Elements" tab content for a web app site builder's left sidebar panel.

HEADER:
- Tab title: "Add" on the left, pin icon and close (✕) on the right

SEARCH:
- Full-width search input: placeholder "Search elements..."

CONTENT (scrollable):
Show these element groups as accordion sections. Each section has a label header. Under each header, elements are shown as small cards in a grid — each card has a simple icon and a short label below.

Section "FAVORITES" (appears first — shows recently/frequently used):
- Container, Button, Heading (3 items as example)

Section "LAYOUT":
- Container, Section, Grid, Row, Column, Stack

Section "TEXT & BUTTONS":
- Heading, Paragraph, Button, Link, Divider, Badge

Section "FORMS":
- Input, Textarea, Select, Checkbox, Toggle, Form

Section "MEDIA":
- Image, Video, Gallery, SVG, Lottie

Section "PAGE SECTIONS":
- Hero, Navbar, Footer, Features, Pricing, CTA

FOOTER:
A subtle tip strip at the very bottom: "💡 Drag elements onto the canvas to get started"

Show also: SEARCH RESULTS STATE
Same panel but search input has text "button" typed in it. Results filtered to show only matching elements. Non-matching categories are hidden.
```

---

## PROMPT 3 — Layers Tab

```
Design the "Layers" tab content for a web app site builder's left sidebar panel.

HEADER:
- Tab title: "Layers" on the left, pin icon and close (✕) on the right

BREADCRUMB (below header):
A path trail: "Home > Hero Section > Container"
Clicking any step navigates up the hierarchy.

LAYER TREE (scrollable):
Show a realistic element hierarchy tree. Indentation represents parent-child nesting. Each row has:
- Expand/collapse arrow (▾ or ▸) on the left
- Element type icon
- Element name label (editable on double-click)
- Eye (visibility) toggle icon on the right — clicking hides/shows element on canvas
- Lock toggle icon on the right — clicking locks element from canvas selection

Example tree:
▾ Page
  ▾ Hero Section
    ▾ Container   👁 🔒
      Heading      👁 🔒   ← currently selected (highlighted row)
      Paragraph    👁 🔒
      Button       👁 🔒
  ▾ Features Section
    ▾ Container   👁 🔒
      Heading      👁 🔒
      Text Grid    👁 🔒

The selected element row is highlighted. One element should show the "hidden" state (eye icon crossed out, row text muted/italic). One should show "locked" state (lock icon filled).

ALSO show: RIGHT-CLICK CONTEXT MENU state
The same layer tree but one row is right-clicked, showing a floating context menu:
- Rename
- Duplicate
- Delete
- Wrap in Container
- Group
- Bring to Front / Send to Back
- Show on Canvas
```

---

## PROMPT 4 — Pages Tab + Page Settings Drawer

```
Design the "Pages" tab content for a web app site builder's left sidebar panel. Show two states.

STATE 1 — Pages list:

HEADER:
- Tab title: "Pages" on the left
- A "+ Add Page" button on the right (small, secondary style)

PAGE LIST:
- 🏠 Home           (home icon, current active page — highlighted)
- About Us
- Contact
- Blog
- 404

Each page row has the page name on the left and a "···" overflow menu trigger on the right.
The active page (Home) is highlighted to show it's currently being edited on canvas.

Show also: right-click / overflow menu open on "About Us" row:
- Rename
- Duplicate
- Set as Home
- Delete
- Page Settings ↗

STATE 2 — Page Settings drawer:
A side drawer slides in from the right edge of the panel (it overlays the panel partially). The drawer has:

Header row: "← About Us" back button on the left, "Page Settings" title in center

Three tabs inside the drawer: SEO · Social · Advanced

SEO tab shown (default):
- Page Title: input field, placeholder "About Us — Buildrik"
- Meta Description: textarea, placeholder "Tell search engines what this page is about..."
- A live character count under the meta description

At the bottom: "Save Changes" primary button
```

---

## PROMPT 5 — Components Tab

```
Design the "Components" tab content for a web app site builder's left sidebar panel. Show two states.

STATE 1 — Component library list:

HEADER:
- Tab title: "Components" on the left
- A "+ Create" button on the right

SEARCH:
- Full-width search input: placeholder "Search components..."

COMPONENT LIST:
Show 4-5 components as list rows:
- Each row: a small preview thumbnail/icon on the left, component name on the right, "···" overflow on far right
- Example names: "Hero Card", "Pricing Row", "Nav Menu", "Footer Block", "Button Group"

STATE 2 — Component Detail Screen:
A drill-in screen that replaces the list. At the top: "← Components" back link.
Then:
- Component name: "Hero Card" (with edit/rename inline icon)
- A preview of the component (rectangular placeholder with the component's rough visual)
- Two action buttons: "Edit on Canvas" and "Delete Component"
- A small note below: "Instances: used 3 times on this site"
```

---

## PROMPT 6 — Media / Assets Tab

```
Design the "Media" tab content for a web app site builder's left sidebar panel. Show two states.

STATE 1 — Library view with assets:

HEADER:
- Tab title: "Media" on the left
- "Upload" button on the right

FILTER TABS:
- Pill tabs: All · Images · Videos · Icons
- "Images" is the active selected filter in this state

CONTENT — Thumbnail grid (3 columns):
Show 6-8 image thumbnails in a grid. Each thumbnail:
- Image preview
- On hover: file name tooltip appears

Show one asset with a hover state that reveals a small "✕" delete button in the top-right corner.

ALSO SHOW: Asset Detail Overlay state
One thumbnail is clicked, showing an overlay panel that slides in or expands:
- Large image preview at the top
- File name (editable inline)
- File info: "1.2 MB · JPG · 1920×1080"
- Buttons: "Copy URL", "Edit Image", "Delete"
- A close button

STATE 2 — Empty state (no uploads yet):
Same panel header but content area shows:
- A large dashed-border upload zone in the center
- Cloud upload icon
- "Drop files here or click to upload"
- Supported formats note: "JPG, PNG, WebP, SVG, GIF, MP4"
```

---

## PROMPT 7 — Design Tokens Tab

```
Design the "Design Tokens" tab content for a web app site builder's left sidebar panel.

HEADER:
- Tab title: "Design Tokens" on the left
- "+ Add Token" button and "Export ▾" dropdown button on the right
- A small "Draft" chip badge — visible when there are unsaved token changes

CONTENT — Three sections:

Section "COLORS":
Each row: a colored circle swatch + token name + hex value + edit icon + delete icon
- ● Primary Blue    #2563EB    ✎ 🗑
- ● Text Dark       #111827    ✎ 🗑
- ● Background      #F9FAFB    ✎ 🗑
- ● Accent          #F59E0B    ✎ 🗑

Section "SPACING":
Each row: a small square icon + token name + value + edit + delete
- ■ space-xs   4px    ✎ 🗑
- ■ space-sm   8px    ✎ 🗑
- ■ space-md   16px   ✎ 🗑
- ■ space-lg   32px   ✎ 🗑

Section "TYPOGRAPHY":
Each row: a "T" icon + token name + brief spec + edit + delete
- T heading-xl    Inter · 32px · Bold        ✎ 🗑
- T body-md       Inter · 16px · Regular     ✎ 🗑
- T label-sm      Inter · 12px · Medium      ✎ 🗑

STICKY FOOTER (visible when there are unsaved changes):
A strip at the bottom of the panel with a "Review Changes" button — primary style.
```

---

## PROMPT 8 — Settings Tab (Card View + Full Page)

```
Design the "Settings" tab for a web app site builder's left sidebar panel. Show two states.

STATE 1 — Settings card list (panel view):
HEADER:
- Tab title: "Settings" on the left

CONTENT — Settings cards in groups. Each card is a clickable row with an icon, title, and a "→" chevron:

Group "SITE":
- 🌐 Site Info       "Name, description, favicon"      →
- 🔗 Domain          "Connect a custom domain"          →
- 🔍 SEO             "Global meta title, description"   →

Group "INTEGRATIONS":
- 📊 Analytics       "Add tracking codes"               →
- 🔌 Integrations    "Zapier, Webhooks"                 →

Group "EXPORT":
- 📦 Export          "Download as HTML, React, or Vue"  →

Group "ADVANCED":
- ⚙ Advanced         "Performance, caching, API tokens" →

Some cards have a lock icon overlay — indicating they require a plan upgrade (premium/locked feature).

STATE 2 — Settings Full Page (opens when any card is clicked):
This is a FULL PAGE OVERLAY that opens inside the editor. Not a modal — a full screen.

Top bar of this full page:
- "← Back to Editor" button on the top left
- Page title: "Site Settings" centered

A left navigation sidebar within this page:
- Site Info
- Domain
- SEO (currently active/highlighted)
- Analytics
- Integrations
- Export
- Advanced

Main content area (right side) — showing the SEO screen:
- Section title: "Global SEO"
- Meta Title: input field with current value
- Meta Description: textarea with character count
- Default Social Image: image upload zone with current preview thumbnail
- A note: "Per-page SEO overrides are managed in Pages tab → Page Settings"
- "Save Changes" button at the bottom
```

---

## PROMPT 9 — Version History Tab

```
Design the "Version History" tab content for a web app site builder's left sidebar panel.

HEADER:
- Tab title: "History" on the left

BRANCHES SECTION (at the top):
- "+ New Branch" button
- Branch list:
  ● main (current — shown with a filled dot + "current" label)
    feature/hero-redesign (shown with an outlined dot)

Each non-main branch has: branch name, a "Preview ↗" link, and a "Merge into main" button.

VERSION TIMELINE (below branches, takes most of the space):
Grouped by day with day headers:

► TODAY
  14:32  Shah    Edited "Hero Heading"    [Revert]
  13:15  Ayesha  Added "Button"           [Revert]
  11:00  Shah    Published site           [Revert]

► YESTERDAY
  17:42  Shah    Edited "Navbar"          [Revert]
  14:10  Ayesha  Deleted "Sidebar"        [Revert]

Each version row: timestamp on left, user name, action description, "Revert" text button on right.

SHOW ALSO: Version detail expanded state
One row is clicked, expanding it inline to show the Activity View:
- "Hero Heading" element
- Changed: font size from 48px → 56px
- Changed: color from #111827 → #1E3A8A
- User: Shah · 14:32 today
These are shown as diff rows: property name, old value (strikethrough/muted), new value.
```

---

## PROMPT 10 — Master Sheet: Left Panel in 5 States

```
Design a master reference sheet showing the Buildrik left panel in 5 key states. Arrange them side by side horizontally. Add a small state label above each. Each panel should show the rail + panel at the same height.

PANEL 1 — Default (Add tab open):
Rail: "Add" tab icon highlighted.
Panel: Search box at top, element categories below (Layout, Text, Media sections visible), Favorites section at top.

PANEL 2 — Layers tab (element selected):
Rail: "Layers" icon highlighted.
Panel: Breadcrumb path at top, hierarchy tree with one row highlighted (selected element). Eye + lock icons visible on rows.

PANEL 3 — Pages tab with context menu:
Rail: "Pages" icon highlighted.
Panel: Page list visible, one page row has a right-click context menu open showing: Rename, Duplicate, Set as Home, Delete, Page Settings.

PANEL 4 — Design Tokens tab (unsaved changes):
Rail: "Design" icon highlighted.
Panel: Color/Spacing/Typography token lists visible. "Draft" chip visible in header. "Review Changes" button visible at bottom.

PANEL 5 — Panel collapsed (rail only):
Rail: All icons visible, no icon highlighted.
Panel: Width = 0, panel not visible. Only the narrow rail shows.
This state represents when the user has clicked the active tab icon to toggle the panel closed.

Keep all 5 panels at the same height. Rail is always visible in all states.
```

---

## Recommended order

1 (Rail shell) → 2 (Add tab) → 3 (Layers) → 4 (Pages + Drawer) → 5 (Components) → 6 (Media) → 7 (Design Tokens) → 8 (Settings + Full Page) → 9 (History) → 10 (Master Sheet last)
