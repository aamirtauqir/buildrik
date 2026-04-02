# Buildrik Editor — Left Panel Complete Design Doc
**Date:** 2026-04-03
**Status:** Approved for implementation
**Source:** Brainstorming session — zone categorization + Left Panel deep dive

---

## Core Principle

Left Panel mein sirf wo cheezein hain jo canvas se **directly** related hain — elements jo canvas pe drop hoti hain, canvas ka structure (layers, pages), assets jo canvas pe use hoti hain, aur design tokens jo canvas elements pe apply hote hain.

Canvas-indirect cheezein (publish, collaboration, account) **Topbar** mein hain.
Element-level editing **Right Bar** (Inspector) mein hai.

---

## Left Panel Layout Overview

```
┌────┬────────────────────────────────┐
│    │                                │
│ R  │         PANEL CONTENT          │
│ A  │         (280–400px wide)        │
│ I  │                                │
│ L  │  Active tab ka content yahan   │
│    │  render hota hai               │
│    │                                │
└────┴────────────────────────────────┘
  60px
```

**Two parts:**
1. **Rail** — 60px narrow icon strip on the far left. Tab navigation + keyboard shortcuts.
2. **Panel** — Expandable drawer (280–400px). Active tab ka content.

---

## Rail — Icon Navigation Bar

### Rail Layout (Top → Bottom)

```
TOP ZONE:
  [+]   Add
  [⊞]   Templates
  [⊟]   Layers
  [📄]  Pages
  [⬡]   Components
  [🖼]   Media

  ─────  (divider)

BOTTOM ZONE:
  [🎨]  Design Tokens
  [⚙]   Settings
  [🕐]  History

FOOTER ZONE:
  [?]   Help (external docs link, not a tab)
```

### Rail Behavior

- Click icon → corresponding panel tab opens (panel expands if collapsed)
- Click active tab's icon again → panel collapses (toggle)
- Hover → tooltip shows tab name + keyboard shortcut: `"Layers · Z"`
- Active tab: highlighted/accent state on icon
- Collapsed panel state: all icons visible but none highlighted

### Keyboard Shortcuts (all global, not in input fields)

| Tab | Shortcut |
|---|---|
| Add | A |
| Templates | T |
| Layers | Z |
| Pages | P |
| Components | ⇧A |
| Media | J |
| Design Tokens | D |
| Settings | S |
| History | H |

### Panel Size Controls

Bottom of panel (when size control is enabled):
- Three size mode buttons: **Compact** (280px) · **Normal** (320px) · **Wide** (400px)
- Compact = visible for narrow monitor workflows
- Wide = visible when user needs to see more content (e.g. long token names)
- Last selected size persists in localStorage

### Panel Pin

- Pin icon in panel header — keeps panel open at all times (doesn't auto-collapse on canvas click)
- Default: unpinned — panel collapses when user clicks canvas
- Pinned state persists in localStorage

---

## Tab 1 — Add Elements (+)

**What it does:** Canvas pe naye elements add karne ka palette. Drag element → canvas pe drop karo.

### Layout

```
[Search box: "Search elements..."]

━━━ FAVORITES ━━━
[Recently used elements — auto-tracked]

━━━ LAYOUT ━━━
[Container] [Section] [Grid] [Row] [Column] [Stack] [Side-by-Side]

━━━ TEXT & BUTTONS ━━━
[Heading] [Paragraph] [Button] [Link] [Divider] [Badge] [Spacer] [Label] [Quote]

━━━ FORMS ━━━
[Input] [Textarea] [Select] [Checkbox] [Radio] [Toggle] [Slider] [File Upload] [Form]

━━━ MEDIA ━━━
[Image] [Video] [Audio] [Gallery] [Carousel] [SVG] [Lottie]

━━━ PAGE SECTIONS ━━━
[Hero] [Navbar] [Footer] [Features] [Pricing] [CTA] [Testimonial] [FAQ]

━━━ E-COMMERCE ━━━
[Product Card] [Cart] [Checkout] [Reviews]

━━━ ADVANCED ━━━
[Map Embed] [Video Embed]
```

### Behavior

**Search:**
- Real-time filter across all categories as user types
- Categories with no matches collapse automatically
- "No results" state with suggestion to try different keyword
- Search clears on Escape key

**Favorites:**
- Top 6 most frequently dragged elements auto-appear here
- First visit: no favorites shown — section hidden
- Cleared via right-click → "Remove from favorites"

**Drag to canvas:**
- Click and hold element card → drag to canvas
- Drop feedback: blue dashed outline shows exact landing position
- Successful drop → element selected on canvas, Inspector opens on Right Bar

**Click (no drag):**
- Single click on element → adds to center of current viewport (canvas scroll position)
- Toast: `"Button added · undo"`

**Onboarding tip:**
- First time user opens Add tab → tip appears at bottom: `"Drag elements onto the canvas to get started"`
- Auto-dismissed after 1 use

---

## Tab 2 — Templates (⊞)

**What it does:** Pre-made page and section templates jo canvas pe apply hote hain.

### Layout

```
[Search box: "Search templates..."]

━━━ PAGE TEMPLATES ━━━
[Thumbnail grid — 2 columns]

━━━ SECTION TEMPLATES ━━━
[Thumbnail grid — 2 columns]
```

### Behavior

**Browse:**
- Grid of template thumbnails — naam aur category label
- Hover → "Preview" overlay button appears on thumbnail

**Preview modal:**
- Full-size preview of template
- Two buttons: `"Use Template"` + `"Close"`

**Use Template drawer:**
- Opens from preview modal — options:
  - Replace current page
  - Add as new page
- Confirmation step before replace (current page content lost)

**Apply progress overlay:**
- Applying hone ke dauraan: `"Applying template..."` loading overlay
- Canvas locks during apply — no editing possible
- On success: toast `"Template applied · undo"`

---

## Tab 3 — Layers (⊟)

**What it does:** Canvas ka complete element hierarchy tree. Structure dekho, reorder karo, visibility/lock manage karo.

### Layout

```
[Breadcrumb: Home > Section > Container]

━━━ LAYER TREE ━━━
▾ Page
  ▾ Hero Section
    ▾ Container
      ▾ Heading      👁 🔒
      ▾ Paragraph    👁 🔒
      ▾ Button       👁 🔒
  ▾ Features Section
    ...
```

### Behavior

**Tree display:**
- Each layer row: indent (nesting level) + type icon + element name + visibility toggle + lock toggle
- Selected element on canvas = highlighted row in layers tree
- Canvas pe element select karo → layers tree automatically scroll + highlight kare
- Right-click on layer → context menu

**Context menu options:**
- Rename
- Duplicate
- Delete
- Wrap in Container
- Group
- Copy
- Paste
- Bring to Front / Send to Back
- Show on Canvas (scroll canvas to this element)

**Rename inline:**
- Double-click layer name → editable input field
- Enter to confirm, Escape to cancel

**Visibility toggle (👁):**
- Click → element canvas pe hide/show ho jaata hai
- Hidden element: layer row muted/italic style

**Lock toggle (🔒):**
- Click → canvas pe element select/drag nahi ho sakta
- Locked element: lock icon filled/colored

**Drag to reparent:**
- Layer drag → blue insertion line shows where it will land
- Drop on a container → element becomes child
- Drop between layers → reorder in same parent

**Breadcrumb:**
- Shows current drill-in path
- Click any crumb → navigate up to that level

**Selection banner:**
- Multiple elements select karo (Shift+click canvas) → banner: `"3 elements selected"`

---

## Tab 4 — Pages (📄)

**What it does:** Site ke saare pages manage karna. Click karo → canvas us page pe switch ho jaata hai.

### Layout

```
[+ Add Page] button — top right

━━━ PAGES ━━━
🏠 Home           (home icon)    ···
   About                         ···
   Contact                       ···
   Blog                          ···
```

### Behavior

**Page list:**
- Click page name → canvas switches to that page
- Current active page: highlighted/bold
- Home page: 🏠 icon ke saath

**Add new page:**
- "+ Add Page" → blank page add, default name `"Page N"`, inline rename mode auto-starts
- Import template as new page option in add dropdown

**Rename page:**
- Double-click → inline rename
- Ya context menu se "Rename"

**Page context menu (··· or right-click):**
- Rename
- Duplicate
- Set as Home
- Delete (confirmation ke saath — home page delete nahi ho sakta)
- Page Settings ↗

**Page SEO:**
- URL slug — custom path (e.g. `/about-us`)
- Page title — meta title
- Meta description
- Canonical URL
- Robots.txt directives (index/noindex, follow/nofollow)

**Page Social:**
- Social preview image (OG image)
- og:title
- og:description

**Page Settings drawer:**
- Side drawer — slides in from right edge of panel
- Tabs within drawer: SEO · Social · Advanced
- "← Back" button to close drawer aur wapas page list pe jaao

---

## Tab 5 — Components (⬡)

**What it does:** Reusable UI blocks. Ek bar banao, baar baar use karo. Component update hone pe saari instances update hoti hain.

### Layout

```
[Search box: "Search components..."]
[+ Create Component] button

━━━ MY COMPONENTS ━━━
[Component list — naam + preview icon]
```

### Behavior

**Component library:**
- List view — naam, preview icon
- Click → Component Detail Screen

**Create component:**
- Canvas pe element/group select karo → right-click → "Create Component"
- Ya Add tab se "Create Component" button
- Modal: naam do, confirm → element component ban jaata hai library mein

**Component detail screen:**
- Naam + preview
- "Edit" — canvas mein directly edit karo component ko
- "Rename" — inline
- "Delete" — confirmation, existing instances unlinked ho jaati hain (remain on canvas, just detached)
- "← Back to Library" button

**Drag to canvas:**
- Component card drag karo → canvas pe drop karo
- Instance ban jaati hai — source component se linked

**Variant selector:**
- Agar component ke multiple variants hain → Right Bar Inspector ke Advanced tab mein dropdown

---

## Tab 6 — Media / Assets (🖼)

**What it does:** Project ki saari uploaded files — images, videos. Canvas pe directly use karo.

### Layout

```
[Upload button]  [Filter: All | Images | Videos | Icons]

━━━ LIBRARY ━━━
[Thumbnail grid]

━━━ DISCOVER (stock images) ━━━
[Discovery grid]
```

### Behavior

**Upload:**
- "Upload" button → file picker
- Ya panel mein drag & drop — files drop karo directly
- Multiple files ek saath — progress shown per file
- Supported: JPG, PNG, WebP, SVG, GIF, MP4, WebM

**Library view:**
- Grid of thumbnails — hover pe file name tooltip
- Click → Asset Detail Overlay

**Filter tabs:**
- All / Images / Videos / Icons — pill tabs

**Asset Detail Overlay:**
- Full preview (image: large thumbnail, video: player)
- File name (editable inline)
- File size + format
- Copy URL button
- Edit button (opens image editor)
- Delete button

**Image editor:**
- Crop: drag corners, aspect ratio lock/unlock
- Brightness / Contrast / Saturation: sliders with real-time preview
- Compression & format: JPEG quality slider, convert to PNG/WebP
- "Save" → overwrites original, "Save as copy" → new file

**Multi-select:**
- Shift+click ya checkbox mode → bulk delete
- Selection banner: `"3 files selected · Delete"`

**Empty state:**
- First time: upload CTA with drag target area + "Upload your first file" message

---

## Tab 7 — Design Tokens (🎨)

**What it does:** Color, spacing, typography tokens jo saare canvas elements use karte hain. Ek jagah change karo, sab jagah update hota hai.

### Layout

```
[+ Add Token] [Export ▾]  [Draft chip — visible when unsaved]

━━━ COLORS ━━━
● Primary Blue    #2563EB   ✎ 🗑
● Text Dark       #111827   ✎ 🗑
● Background      #F9FAFB   ✎ 🗑

━━━ SPACING ━━━
■ space-sm        8px       ✎ 🗑
■ space-md        16px      ✎ 🗑
■ space-lg        32px      ✎ 🗑

━━━ TYPOGRAPHY ━━━
T heading-xl     Inter 32px Bold    ✎ 🗑
T body-md        Inter 16px Regular ✎ 🗑

[Review Changes] button — bottom, visible when unsaved changes exist
```

### Behavior

**Add Token:**
- Click "+ Add Token" → Add Token modal
- Fields: Name (text), Type (Color/Spacing/Typography), Value
- Validation: duplicate names blocked, empty name blocked

**Edit token:**
- Click token row → inline edit
- Color: color picker opens
- Spacing: numeric input + unit selector
- Typography: font family, size, weight, line-height grouped

**Delete token:**
- 🗑 button → confirmation dialog
- If token is in use on canvas elements → warning: `"This token is used in N places. Delete will revert those to raw values."`

**Draft indicator:**
- "Draft" chip visible jab unpublished changes hain
- Changes are live in editor but not "published" as canonical tokens yet

**Review Changes modal:**
- Before publishing tokens: shows diff — what's added/edited/deleted
- Approve to publish, reject to discard

**Export dropdown:**
- JSON format (design tool import ke liye)
- CSS custom properties (`:root { --primary-blue: #2563eb; }`)

**Tab guard (unsaved warning):**
- Agar unsaved token changes hain aur user dusra tab switch karna chahta hai → dialog:
  `"You have unsaved token changes. Switching tabs will discard them. [Discard & Switch] [Stay]"`

---

## Tab 8 — Site Settings (⚙)

**What it does:** Is site ke liye settings — domain, SEO, analytics, integrations, export. Editor ke andar hi full page mein khulta hai.

### Important Distinction

**Site Settings (yahan, Left Bar):**
Site-specific settings jo har site ke liye alag hain — domain, tracking codes, export format.

**Account Settings (Topbar Account icon):**
Workspace-level settings jo saari sites pe same hain — billing, team members, collaboration preferences.

### Settings Tab → Full Page Pattern

- Settings tab click karo → panel mein settings cards dikhti hain
- Kisi bhi settings card click karo → **Full Page khulta hai editor ke andar**
- Full Page ke top-left: `← Back to Editor` button
- User editor mein hi rehta hai — koi redirect nahi

### Settings Cards (panel view)

```
━━━ SITE ━━━
[🌐 Site Info]        Site name, description, favicon
[🔗 Domain]           Custom domain connect karo
[🔍 SEO]              Global meta title, description

━━━ INTEGRATIONS ━━━
[📊 Analytics]        Google Analytics, tracking codes
[🔌 Integrations]     Zapier, Webhooks

━━━ EXPORT ━━━
[📦 Export]           HTML / React / Vue format

━━━ ADVANCED ━━━
[⚙ Advanced]          Performance, caching, API tokens
```

### Each Screen (Full Page)

**Site Info screen:**
- Site name (text input)
- Site description (textarea)
- Favicon upload (32×32 or 64×64 recommended)
- Save button

**Domain screen:**
- Current subdomain display (`mysite.buildrik.app`)
- Custom domain input field
- DNS instructions (CNAME/A record)
- Verification status indicator: Pending / Verified / Error
- Re-verify button

**SEO screen:**
- Global meta title (applies to all pages unless page-level override)
- Global meta description
- Social/OG default image upload
- Note: "Individual page SEO is managed in the Pages tab → Page Settings"

**Analytics screen:**
- Google Analytics tracking ID field (UA-XXXXXXX or G-XXXXXXX)
- Custom `<head>` code textarea (for any other tracking scripts)
- Preview where code gets injected: `"Injected into <head> on all pages"`

**Integrations screen:**
- Zapier webhook URL field
- Custom webhook URL — trigger events: on publish, on form submit
- Webhook test button — sends test payload

**Export screen:**
- Format selector: HTML · React · Vue
- Download Zip button
- Export progress overlay during export

**Advanced screen:**
- Performance settings (lazy load images toggle)
- API access tokens — generate, view, revoke
- Cache settings

### Locked Screen

- Premium features ke liye upgrade gate
- Shows feature preview (blurred/dimmed) + "Upgrade to Pro" CTA
- Free plan pe: Domain, Advanced screens locked

### Dirty state protection

- Settings mein unsaved changes hain aur user dusra tab switch karne ki koshish kare → confirmation dialog:
  `"You have unsaved changes. Switching tabs will discard them. [Discard & Switch] [Stay]"`

---

## Tab 9 — Version History (🕐)

**What it does:** Project ka complete version timeline + Git-style branching (Phase 1).

### Layout

```
━━━ BRANCHES ━━━
[+ New Branch]
● main (current)
  feature/hero-redesign

━━━ VERSION TIMELINE ━━━
▸ Today
  14:32  Shah edited "Hero Section"    [Revert]
  13:15  Ayesha added "Button"         [Revert]

▸ Yesterday
  17:00  Shah published site           [Revert]
  10:22  Shah edited "Navbar"          [Revert]
```

### Version Timeline Behavior

**Timeline:**
- Chronological list, newest first, grouped by day
- Each version: timestamp + who + what action

**Version detail (click):**
- Expands to show Activity View: exactly kya change hua
- Who changed, which element, what changed (color, text, position, etc.)
- Diff rows: added/removed/modified styling per row

**Revert:**
- "Revert to this version" button → confirmation dialog
  `"Revert to [timestamp]? Current unsaved changes will be lost. [Revert] [Cancel]"`
- On revert: canvas reloads to that state, toast: `"Reverted to version from [time] · undo"`

### Branching (Phase 1)

**What it does:** Git-style branches taake experimental changes main site ko affect na karein.

**Create branch:**
- "+ New Branch" → modal: branch name input (auto-suggests `feature/[date]`)
- Creates copy of current state — switches to new branch automatically
- Toast: `"Switched to branch: feature/hero-redesign"`

**Switch branch:**
- Branch list mein click → confirms if unsaved changes: `"Switch to main? Unsaved changes will be discarded. [Switch] [Cancel]"`
- Canvas reloads to that branch's last saved state

**Preview branch:**
- "Preview ↗" next to branch name → live preview new tab mein us branch ka state

**Merge branch:**
- "Merge into main" button on non-main branches
- Phase 1: non-conflicting only
- Merge conflict (Phase 1 behavior): blocking message: `"This branch cannot be merged automatically. Contact support or resolve manually."`
- Successful merge: branch deleted, main updated, review state resets to DRAFT

**Active branch indicator:**
- Currently active branch ka naam Topbar mein badge ke tor pe always visible

**Role restriction:**
- Branching: Editor ya Admin only. Viewers cannot create/switch branches.

---

## Panel Behaviors

### Open / Close

- Closed state: panel width = 0, opacity = 0 (smooth CSS transition)
- Open state: panel width = selected size mode (280/320/400px)
- Opening animation: 0.3s ease-bounce
- Closing animation: 0.2s ease

### Auto-collapse

- Unpinned panel: canvas click karo → panel auto-collapses
- Pinned panel: never auto-collapses

### Error Boundary

- Har tab mein error boundary hai
- Agar tab crash ho jaye → "Something went wrong. [Retry]" fallback shown
- Retry: tab remounts fresh

### Loading Skeleton

- Tab switch hone pe → skeleton shimmer shown while tab lazy-loads
- Usually < 100ms — skeleton barely visible

---

## States & Edge Cases

### Empty project (fresh canvas):
- Add tab: onboarding tip shown
- Layers tab: shows only root page node, no children
- Pages tab: only Home page, no others
- Media tab: empty state with upload CTA
- History tab: no versions yet — "No history yet. Start editing to see changes."

### Offline state:
- Add tab: still functional (catalog is client-side)
- Layers tab: still functional (data in memory)
- Pages tab: still functional
- Media tab: uploads disabled — tooltip: "Uploads unavailable while offline"
- Design Tokens: editable but export disabled
- Settings tab: read-only — save disabled with tooltip: "Cannot save while offline"
- History tab: still browsable (cached), revert disabled

### Small screen (< 1200px viewport):
- Panel defaults to compact (280px) size mode
- Pin is off by default (space is tight)
- Rail always visible, panel overlays canvas (doesn't push canvas)

### Large screen (> 1600px viewport):
- Panel defaults to normal (320px)
- Pin defaults to on (enough space)
- Panel pushes canvas (doesn't overlay)

### Multiple users editing same page:
- Layers tab: remote cursors na dikho layers mein (canvas pe dikhte hain woh)
- Pages tab: page list real-time updates — agar Ayesha naya page add kare toh list update ho jaaye
- History tab: real-time activity — naye entries appear karte raho

---

## What is NOT in Left Panel

| Feature | Actual Location | Reason |
|---|---|---|
| Publish | Topbar (button) | Global action — not canvas-direct |
| Undo / Redo | Topbar | Global edit action |
| Account (billing, team) | Topbar → Account Full Page | Workspace-level — not per-site |
| Collaboration settings | Topbar → Account Full Page | Workspace-level |
| Inspector (element props) | Right Bar | Element editing — selection-dependent |
| Comment Mode toggle | Right Bar | Element-level feature |
| Canvas overlays (Grid, Guides, X-Ray) | Canvas Footer | Direct canvas view control |
| Device Switcher | Canvas Footer | Direct canvas viewport control |
| Save Status | Canvas Footer | Canvas-level feedback |

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| Publish tab removed from Left Bar | Moved entirely to Topbar | Publish = global action, not canvas structure |
| Billing removed from Settings tab | Moved to Account Full Page | Billing = workspace level, not per-site |
| Team management removed from Settings tab | Moved to Account Full Page | Workspace-level, not per-site |
| Settings tab pattern | Card list → Full Page | Complex settings need more space than 280px panel |
| Version History tab position | Bottom section (last) | Config tab — less frequently used than content tabs |
| Branching in Version History tab | Top of History tab (Branches section) | Naturally related to history/versioning |
| Page SEO in Pages tab | Inside Page Settings drawer | Per-page setting — belongs with page management |
| Global SEO in Settings tab | Site Settings → SEO screen | Per-site default — belongs with site settings |
| Component Variants selector | Right Bar Inspector (Advanced tab) | Selection-dependent — not Left Bar |
| Templates tab kept | Yes, in Left Bar | Canvas-direct — templates drop onto canvas |
| Design Tokens tab kept | Yes, in Left Bar | Canvas-direct — tokens applied to canvas elements |
