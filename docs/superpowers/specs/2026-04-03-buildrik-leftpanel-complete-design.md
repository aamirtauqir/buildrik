# Buildrik Editor — Left Panel Complete Design Doc
**Date:** 2026-04-03
**Status:** Approved for implementation
**Source:** Brainstorming session — zone categorization + Left Panel deep dive + UX audit

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
TOP ZONE (primary — large icons, full opacity):
  [+]   Add
  [⊞]   Templates
  [⊟]   Layers
  [📄]  Pages
  [⬡]   Components
  [🖼]   Media

  ─────  (divider)

BOTTOM ZONE (secondary — smaller icons, 70% opacity):
  [🎨]  Design Tokens
  [⚙]   Settings
  [🕐]  History

FOOTER ZONE:
  [?]   Help (external docs link, not a tab)
```

### Visual Hierarchy

**Two-tier rail:** TOP ZONE and BOTTOM ZONE icons are visually distinct.
- **TOP ZONE (primary):** Full icon size, 100% opacity, prominent. These are used 10–100x per session.
- **BOTTOM ZONE (secondary):** Icon size 20% smaller, 70% opacity at rest (100% on hover/active). These are configuration/utility tabs used 1–5x per session.
- The divider line visually separates the two tiers.
- All 9 tabs remain keyboard-accessible and function identically. The hierarchy is visual only — it does not change access.

### Rail Behavior

- Click icon → corresponding panel tab opens (panel expands if collapsed)
- Click active tab's icon again → panel collapses (toggle)
- **Hover tooltip:** When tab is NOT active → `"Layers · Z"`. When tab IS active and panel is open → `"Close Layers · Z"`. Tooltip always reflects what the click will do.
- Active tab: highlighted/accent state on icon
- Collapsed panel state: all icons visible but none highlighted

### Drag Lock Rule (CRITICAL)

**When any drag operation originates from the panel (dragging element to canvas, dragging media to canvas, dragging component to canvas) — the panel MUST NOT auto-collapse until the drag ends (success, cancel, or Escape).** The `mouseup` on canvas during a drop is NOT treated as a canvas click for auto-collapse purposes. This rule applies panel-wide regardless of pin state.

### Inline Edit Lock Rule

**Panel does NOT collapse if an inline rename input is currently focused** — this applies to layer rename, page rename, token rename, component rename. Clicking the active tab icon while rename is active is ignored.

### Keyboard Shortcuts (all global, not in input fields, not during canvas text editing)

| Tab / Action | Shortcut |
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
| Select parent element | Escape (first press when element selected) |
| Deselect all | Escape (second press, or first press at root) |

**Shortcut fire conditions:** Shortcuts only fire when:
- No canvas element is selected AND user is not in any inline editing mode (text edit, rename inputs)
- ⌘S / Ctrl+S is reserved for global Save — the "S" shortcut for Settings ONLY fires on bare "S" key with no modifier. No conflict with ⌘S.

**Escape key — select parent behavior:**
- When an element is selected on canvas: first Escape = select that element's parent. Layers panel scrolls to and highlights the parent if Layers is open.
- Second Escape (or first Escape when already at root level) = deselect all.
- Matches Figma behavior. Works regardless of whether the Layers panel is open.

### Panel Size Controls

Bottom of panel (when size control is enabled):
- Three size mode buttons: **Compact** (280px) · **Normal** (320px) · **Wide** (400px)
- Compact = visible for narrow monitor workflows
- Wide = visible when user needs to see more content (e.g. long token names)
- Last selected size persists globally in localStorage (same across all tabs)

### Panel Pin

- Pin icon in panel header — keeps panel open at all times (doesn't auto-collapse on canvas click)
- **Screen-aware default:**
  - Viewport > 1200px → panel is **pinned by default** (panel pushes canvas). Matches how Figma, Webflow, Framer behave on desktop.
  - Viewport ≤ 1200px → panel is **unpinned by default** (panel overlays canvas — space is tight).
- Default changed from previous: old default was unpinned on all screens. New default is pinned on wide screens.
- User can toggle pin manually at any time. Pin state persists in localStorage per viewport category (wide vs. narrow).
- Pinned state persists in localStorage

### Scroll Position Preservation

Each tab preserves its own scroll position in component memory (not localStorage). Switching from Layers to Add and back restores the Layers scroll position. Scroll resets on: browser refresh, tab component unmount from error boundary.

### Search State Rule

Search inputs in Add, Media, Components tabs are **cleared when the tab is unmounted** (user switches away). Search does not persist across tab switches. This prevents stale search confusion.

---

## Tab 1 — Add Elements (+)

**What it does:** Canvas pe naye elements add karne ka palette. Drag element → canvas pe drop karo.

### Layout

```
[Search box: "Search elements..."]

━━━ FAVORITES ━━━
[Recently used / pinned elements]

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
- Search resets on tab switch (see Search State Rule above)

**Category collapse persistence:**
- User can collapse any category section (click section header)
- Collapse state persists in localStorage per user
- Default: all categories expanded

**Favorites:**
- An element auto-appears in Favorites after it has been dragged or clicked **3 or more times** (tracked per-user in localStorage)
- Maximum 6 elements shown — if more than 6 qualify, show the 6 with the highest usage count
- **Manual pin:** Right-click any element → "Pin to Favorites" — adds it immediately regardless of usage count
- First visit (or count below threshold for all elements): Favorites section is hidden entirely
- Favorites section appears as soon as at least 1 element reaches the threshold
- Remove via right-click → "Remove from Favorites" (resets usage count to 0 for that element)

**Drag to canvas:**
- Click and hold element card → drag to canvas
- Drop feedback: blue dashed outline shows exact landing position
- Panel does NOT auto-collapse during drag (see Drag Lock Rule)
- Successful drop → element selected on canvas, Inspector opens on Right Bar
- Undo toast: `"Added Button · undo"`

**Click (no drag) — drop position logic:**
- If a **container-type element** (Container, Section, Grid, Row, Column, Stack) is currently selected on canvas → new element is added **inside** the selected container, at the end of its children
- If nothing is selected, or a non-container is selected → new element is added at the end of the last section on the current page
- Toast: `"Button added · undo"`

**Onboarding tip:**
- First time user opens Add tab → tip appears at bottom: `"Drag elements onto the canvas to get started"`
- Auto-dismissed after 1 use or after first successful drag

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
- Confirmation step before replace: `"This will replace all content on the current page. [Replace] [Cancel]"`

**Search empty state:**
- No results → show: `"No templates found for '[query]'"` centered in panel
- Clear search: `"Clear search"` link below the empty state message

**Apply progress overlay:**
- Applying hone ke dauraan: `"Applying template..."` loading overlay
- Canvas locks during apply — no editing possible
- On success: toast `"Template applied · undo"`

---

## Tab 3 — Layers (⊟)

**What it does:** Canvas ka complete element hierarchy tree. Structure dekho, reorder karo, visibility/lock manage karo.

**Cross-tab sync rule:** When the active page changes (via Pages tab or any page switch), the Layers panel automatically re-renders to show the new page's element tree. There is no manual refresh needed.

### Layout

```
[Search box: "Search layers..."]
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
- Element names are truncated at 24 characters with ellipsis (`…`) — full name visible on hover tooltip
- Selected element on canvas = highlighted row in layers tree
- Canvas pe element select karo → layers tree automatically scrolls to and highlights that row
- If Layers panel is closed when element is selected on canvas: tree does NOT auto-open. When user manually opens Layers, it scrolls to the currently selected element.
- Right-click on layer → context menu

**Context menu options:**
- Rename
- Duplicate
- Delete → undo toast: `"Deleted 'Hero Section' · undo"`
- Wrap in Container → undo toast: `"Wrapped in Container · undo"`
- Group
- Copy
- Paste
- Bring to Front / Send to Back *(Note: these move the element to top/bottom of its siblings in the tree — same as dragging to top/bottom of parent. They do NOT affect absolute z-index directly — tree order determines stacking.)*
- Show on Canvas (scrolls canvas to center on this element)

**Rename inline:**
- Double-click layer name → editable input field
- Enter to confirm, Escape to cancel
- Panel collapse is blocked while rename input is focused

**Visibility toggle (👁):**
- Click → element canvas pe hide/show ho jaata hai
- Hidden element: layer row muted/italic style
- **Parent + child conflict:** If parent has 👁 OFF and user clicks 👁 on a child → dialog: `"The parent section is hidden. Show both? [Show Both] [Cancel]"` — does not silently override.

**Lock toggle (🔒):**
- Click → canvas pe element select/drag nahi ho sakta
- **Locked elements CAN still be selected via the Layers panel** — clicking the layer row selects the element (Inspector opens). This is the intended escape hatch for locked elements.
- Locked element: lock icon filled/colored; canvas hover outline does not appear

**Drag to reparent:**
- Layer drag → blue insertion line shows where it will land
- Drop on a container → element becomes child
- Drop between layers → reorder in same parent
- **Hover-to-expand during drag:** If cursor pauses on a collapsed container for 600ms during drag, that container auto-expands so user can drop inside it
- Drop on page root: only Section-type elements can be at root level. Dragging a non-Section to root level → not allowed, drag reverts with toast: `"Only sections can be at the top level"`

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
[Search box: "Search pages..."]
[+ Add Page ▾] button — top right

━━━ PAGES ━━━
⠿ 🏠 Home           (home icon)    ···
⠿    About                         ···
⠿    Contact                       ···
⠿    Blog                          ···
```

*(⠿ = drag handle, visible on hover for reordering)*

### Behavior

**Page search:**
- Search input at top — real-time filter by page name
- Shown only when site has 5+ pages (hidden below that threshold)

**Page list:**
- Click page name → canvas switches to that page
- **Page switch with active text edit guard:** If user is currently in inline text editing mode on canvas when they click a different page:
  `"You're editing text. Switch pages? [Save & Switch] [Discard & Switch] [Cancel]"`
  Auto-saves on "Save & Switch". On "Discard & Switch": text edit cancelled, page switches.
- Current active page: highlighted/bold
- Home page: 🏠 icon ke saath

**Page reordering:**
- Drag handle (⠿) icon visible on hover at left of each page row
- Drag page row to reorder — new order reflected in site navigation
- Home page can be reordered in the list but its "Home" designation stays regardless of position

**Add new page:**
- "+ Add Page ▾" → dropdown:
  - Blank page — adds empty page, inline rename auto-starts
  - Import from template — opens Templates tab with "Add as new page" mode pre-selected
- Default name for blank page: `"Page N"` where N = page count + 1

**Rename page:**
- Double-click → inline rename
- Ya context menu se "Rename"

**Page context menu (··· or right-click):**
- Rename
- Duplicate → creates `"[Name] (Copy)"` (second duplicate: `"[Name] (Copy 2)"`)
- Set as Home
- Delete (confirmation ke saath)
- Page Settings →

**Page delete rules:**
- Home page delete attempt → toast: `"Can't delete the home page. Set another page as home first."`
- Last remaining page delete attempt → toast: `"Can't delete the only page."`
- All other pages: `"Delete [Name]? This cannot be undone. [Delete] [Cancel]"`

**Page Settings (full-page pattern):**
- Clicking "Page Settings →" from context menu opens a **full-page view inside the editor** — same pattern as Site Settings tab
- Top-left: `"← Back to Editor · About"` button (page name in the breadcrumb)
- Tabs within the settings view: **SEO** · **Social** · **Advanced**
- "← Back to Editor" returns to the canvas with Pages panel still active
- **Rationale:** Page Settings has 8+ fields across 3 tabs. The 280px panel drill-in is too cramped. Full-page is consistent with Site Settings and gives fields room to breathe.
- **Unsaved changes guard:** If any screen has unsaved changes and user clicks back: `"Save changes before leaving? [Save & Go Back] [Discard & Go Back] [Stay]"`

**Page SEO:**
- Page title — meta title
- Meta description — character count shown (160 max)
- Canonical URL

**Page Social:**
- Social preview image (OG image) — upload or pick from Media
- og:title (defaults to page title if empty)
- og:description (defaults to meta description if empty)

**Page Advanced:**
- URL slug — custom path (e.g. `/about-us`)
- Robots.txt directives (index/noindex, follow/nofollow)

---

## Tab 5 — Components (⬡)

**What it does:** Reusable UI blocks. Ek bar banao, baar baar use karo. Component update hone pe saari instances update hoti hain.

### Layout

```
[Search box: "Search components..."]
[+ Create Component] button

━━━ MY COMPONENTS ━━━
[Component list — naam + preview thumbnail]
```

### Behavior

**Search:**
- Real-time filter by component name
- Search resets on tab switch

**Empty state (no components yet):**
- Illustration + message: `"No components yet"`
- Sub-text: `"Select elements on the canvas and right-click → Create Component"`
- "+ Create Component" button (same action as the header button)

**Component library:**
- List view — naam, snapshot thumbnail (last-saved visual)
- Click → Component Detail Screen

**Component snapshot:**
- When a component is saved/created, a PNG snapshot is taken automatically
- This snapshot is what shows in the list thumbnail
- If component is edited and saved again, snapshot updates
- Snapshot is NOT a live render — it's a static "last saved" image

**Create component:**
- Canvas pe element/group select karo → right-click → "Create Component"
- Ya Components tab → "+ Create Component" button (if nothing selected: toast `"Select elements on canvas first"`)
- Modal: component name input. Validation: empty name blocked, duplicate name blocked (`"A component named 'Hero Card' already exists"`)
- On create: element converts to component, appears in library

**Component detail screen (drill-in):**
- Header: `"← Components · Hero Card"` (back + component name)
- Snapshot preview (static, labeled "Last saved")
- "Edit on Canvas" button
- "Rename" — inline
- "Delete" button
- Instance count: `"Used 3 times on this site"`

**"Edit on Canvas" — cross-page handling:**
- If component exists on the current page → directly enters component edit mode
- If component does NOT exist on current page → `"Hero Card is not on this page. Switch to Home to edit it? [Switch & Edit] [Cancel]"`
- If component exists on multiple pages → navigates to the page it was originally created on
- **If the original page was deleted:** Auto-navigate to the first page that has an instance of this component. No dialog, no dead end.
- **If ALL pages with this component were deleted (zero instances remain):** Toast: `"This component has no instances on any page. Drop it onto the canvas to use it."`

**Component delete — warning rewritten for clarity:**
`"Deleting this component won't remove it from your pages. All 3 instances will become regular elements — they'll stay on canvas but will no longer update together when you make changes. [Delete] [Cancel]"`

**Drag to canvas:**
- Component card drag karo → canvas pe drop karo
- Panel does NOT auto-collapse during drag (see Drag Lock Rule)
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
- Multiple files ek saath — progress shown per file with: filename, progress bar, size
- **File size limit:** 50MB per file. On exceed: `"[filename] is too large. Maximum size is 50MB. Try compressing the file first."`
- **Upload failure state:** Per-file error indicator: 🔴 filename, error reason (network error / unsupported format / quota full), "Retry" button. When 2 or more files have failed: a **"Retry All Failed"** button appears above the failed file list — retries all failed uploads in one click.
- Supported: JPG, PNG, WebP, SVG, GIF, MP4, WebM

**Drag from Media to canvas:**
- Images in the Media grid are directly draggable to canvas
- Panel does NOT auto-collapse during drag (see Drag Lock Rule)
- Drop creates an Image element on canvas with this asset pre-filled
- Drop feedback: same blue dashed outline as element drops

**Library view:**
- Grid of thumbnails — hover pe file name tooltip
- Click → Asset Detail Overlay

**Filter tabs:**
- All / Images / Videos / Icons — pill tabs

**Asset Detail Overlay:**
- Full preview (image: large thumbnail, video: player)
- File name — display name only (editable inline). **Renaming does NOT change the file URL.** The URL is permanent. A note below the name field: `"Renaming only changes the display label. The file URL stays the same."`
- File size + format
- Copy URL button
- Edit button (opens image editor — images only)
- Delete button

**Asset delete — in-use check:**
Before showing delete confirmation, check if asset is referenced in any canvas element on any page.
- If used: `"This file is used in 3 places on your site. Deleting it will show broken images there. [Delete Anyway] [Cancel]"`
- If not used: `"Delete [filename]? [Delete] [Cancel]"`
- After delete of in-use asset: affected canvas elements show a "missing media" placeholder (grey box with broken-link icon)

**Image editor:**
- Crop: drag corners, aspect ratio lock/unlock
- Brightness / Contrast / Saturation: sliders with real-time preview
- Compression & format: JPEG quality slider, convert to PNG/WebP
- **"Save" (overwrite) — usage warning:** Before overwriting: `"This will update the image in all N places it's used on your site. [Save] [Save as Copy] [Cancel]"`
- **"Save as Copy"** → new file created with `"[name]-copy.[ext]"`, original unchanged

**Multi-select:**
- Shift+click ya checkbox mode → bulk delete
- Selection banner: `"3 files selected · Delete"`
- Bulk delete: same in-use check runs across all selected files

**Empty state:**
- First time: upload CTA with drag target area + "Upload your first file" message

---

## Tab 7 — Design Tokens (🎨)

**What it does:** Color, spacing, typography tokens jo saare canvas elements use karte hain. Ek jagah change karo, sab jagah update hota hai.

### Real-time update semantics

Token changes update the canvas **immediately in real-time** as the user edits. This is the live preview behavior — user can see the effect instantly.

"Draft" state does NOT mean changes are hidden from canvas. It means: changes are in the editor but **not yet committed as the canonical published token set**. Export and Publish use the last reviewed/committed version, not the in-progress draft.

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
- Color: color picker opens (supports: hex input, RGB, HSL, opacity slider, eyedropper)
- Spacing: numeric input + unit selector (px / rem / %)
- Typography: font family, size, weight, line-height grouped in one modal

**Token rename:**
- Rename propagates automatically — all canvas elements referencing the old name update to the new name instantly
- No breakage occurs on rename. A note in the rename field: `"Renaming updates all usages automatically."`

**Delete token:**
- 🗑 button → confirmation dialog
- If token is in use on canvas elements → warning: `"This token is used in N places. Delete will revert those to raw values. [Delete] [Cancel]"`

**Draft indicator:**
- "Draft" chip visible jab canvas-updating-but-uncommitted changes hain
- **Draft persistence:** Draft changes are auto-saved to the server continuously. If user closes browser without reviewing → next session, Draft chip still shows and pending changes are present. On re-open: the Draft chip and "Review Changes" button immediately visible.
- **No silent discard.** Draft changes persist until user either Reviews+Publishes them or explicitly discards.

**Review Changes modal:**
- Before committing tokens as canonical: shows diff — what's added/edited/deleted
- Approve → changes become the published token set (Export and Publish now use these)
- Discard → reverts token values to last published state, canvas updates to match

**Export dropdown:**
- JSON format (design tool import ke liye)
- CSS custom properties (`:root { --primary-blue: #2563eb; }`)
- Export always exports **last published/reviewed** token state — not the current draft
- If tokens are in Draft state, a note appears: `"Draft changes not included. Review & Publish tokens first to export latest values."`

**Tab guard (REMOVED):**
- No dialog fires when user switches away from Design Tokens with unreview changes. Draft auto-saves to server continuously — nothing is lost.
- The **Draft chip** in the panel header is the visual signal that uncommitted changes exist. It stays visible regardless of which tab is active.
- **Browser close guard only:** If Draft changes exist when user closes/refreshes the browser tab, a standard `beforeunload` browser warning fires: "Changes you made may not be saved." This is the only guard.

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
- **"← Back to Editor" with unsaved changes:** If any screen has unsaved changes: `"You have unsaved changes. [Save & Go Back] [Discard & Go Back] [Stay]"`
- On Back: returns to Settings cards view (panel open, Settings tab active)
- User editor mein hi rehta hai — koi redirect nahi

### Settings Cards (panel view)

```
━━━ SITE ━━━
[🌐 Site Info]        Site name, description, favicon
[🔗 Domain]           Connect a custom domain          [🟡 Pending]  ← status badge
[🔍 SEO]              Global meta title, description

━━━ INTEGRATIONS ━━━
[📊 Analytics]        Google Analytics, tracking codes
[🔌 Integrations]     Zapier, Webhooks

━━━ EXPORT ━━━
[📦 Export]           HTML / React / Vue format

━━━ ADVANCED ━━━
[⚙ Advanced]          Performance, caching, API tokens
```

**Domain status badge on cards view:** The Domain card shows an inline status badge reflecting current verification state: `🟡 Pending` / `🟢 Verified` / `🔴 Error`. User can see domain status without entering the Domain screen.

### Each Screen (Full Page)

**Site Info screen:**
- Site name (text input)
- Site description (textarea)
- Favicon upload (32×32 or 64×64 recommended)
- Save button

**Domain screen:**
- Current subdomain display (`mysite.buildrik.app`)
- Custom domain input field
- DNS instructions (CNAME/A record details)
- Verification status indicator: Pending / Verified / Error
- Re-verify button
- **Async verification flow:** DNS propagation takes 24–72 hours. Status shows `"Pending — DNS changes can take up to 48 hours to propagate"`. The system polls every 15 minutes in the background. When verified, user gets an in-app notification and email.

**SEO screen:**
- Global meta title (applies to all pages unless page-level override)
- Global meta description
- Social/OG default image upload
- Note: `"Individual page SEO is managed in Pages tab → Page Settings →"`

**Analytics screen:**
- Google Analytics tracking ID field (UA-XXXXXXX or G-XXXXXXX)
- Custom `<head>` code textarea (for any other tracking scripts)
- Preview label: `"Injected into <head> on all pages on next publish"`
- **Tracking code goes live on next Publish — not immediately on Save.** Saving stores the setting; publishing injects it.

**Integrations screen:**
- Zapier webhook URL field
- Custom webhook URL — trigger events: on publish, on form submit
- Webhook test button — sends test payload
- Test failure handling: if endpoint returns error or is unreachable → inline error below URL field: `"Test failed: [status code / reason]. Check your endpoint and try again."`

**Export screen:**
- Format selector: HTML · React · Vue
- Download Zip button
- Export progress overlay during export
- **Code quality expectations note:** `"Exported code is functional and clean. React/Vue components are named based on your element labels. Minor cleanup may be needed for production use."`
- Export uses the currently saved canvas state — not pending unsaved changes

**Advanced screen:**
- Performance settings (lazy load images toggle)
- API access tokens — generate, view, revoke
- Cache settings

### Locked Screen

- Premium features ke liye upgrade gate
- Shows feature preview (blurred/dimmed) + "Upgrade to Pro" CTA
- **Free plan locked screens:** Domain screen, Integrations screen, Advanced screen
- Analytics and SEO screens are available on all plans

### Dirty state protection

- Settings mein unsaved changes hain aur user dusra tab switch karne ki koshish kare → confirmation dialog:
  `"Save changes before switching? [Save & Switch] [Discard & Switch] [Stay]"`
  *(Note: unlike Design Tokens — which auto-save Draft — Settings changes are NOT auto-persisted. This guard is legitimate.)*
- Same guard applies to "← Back to Editor" navigation: `"Save changes before leaving? [Save & Go Back] [Discard & Go Back] [Stay]"`

---

## Tab 9 — Version History (🕐)

**What it does:** Project ka complete version timeline + Git-style branching (Phase 1).

### When Are Versions Created?

Versions are created on these events only:
1. **Manual Save** (⌘S or save button)
2. **Publish** (any publish action)
3. **Branch create / switch / merge**

Auto-saves between manual saves do NOT create separate history entries — they update the in-progress state. This keeps the timeline clean and scannable.

### Layout

```
━━━ BRANCHES ━━━
[+ New Branch]
● main (current)
  feature/hero-redesign         [Preview ↗] [···]
  feature/pricing-test          [Preview ↗] [···]

━━━ VERSION TIMELINE ━━━
▸ Today
  14:32  Shah    Edited "Hero Section"    [Revert]
  13:15  Ayesha  Added "Button"           [Revert]

▸ Yesterday
  17:00  Shah    Published site           [Revert]
  10:22  Shah    Edited "Navbar"          [Revert]

[Load more ↓]
```

### Version Timeline Behavior

**Timeline:**
- Chronological list, newest first, grouped by day
- Each version: timestamp + who + what action
- **Pagination:** "Load more ↓" button at bottom — loads 30 entries at a time
- **Filter bar:** `All · My changes · [Date picker]` — above the timeline, visible when timeline has more than 20 entries

**Version detail (click):**
- Expands to show Activity View: exactly kya change hua
- Who changed, which element, what changed (color, text, position, etc.)
- Diff rows: added/removed/modified styling per row
- Deleted elements in diff: shown as `"[Element Name] — deleted"` with a small thumbnail of what it looked like (last snapshot before deletion)

**Revert:**
- "Revert to this version" button → confirmation dialog:
  `"Revert to [timestamp]? Current unsaved changes will be lost. [Revert] [Cancel]"`
- **On revert: a NEW entry is added to the timeline** — `"Reverted to version from [time]"`. History entries after the reverted-to point are NOT deleted. Forward history is preserved.
- Toast: `"Reverted to version from [time]"` (no undo — the confirmation dialog already protects against accidental reverts)

### Branching (Phase 1)

**What it does:** Git-style branches taake experimental changes main site ko affect na karein.

**Create branch:**
- "+ New Branch" → modal: branch name input
- Auto-suggestion: `feature/[yyyy-mm-dd]`
- **Branch name validation:** Alphanumeric + hyphens + forward slashes only. No spaces, no special characters. Max 50 chars. Reserved name "main" is blocked. Spaces are auto-converted to hyphens as user types.
- Creates copy of current state — switches to new branch automatically
- Toast: `"Switched to branch: feature/hero-redesign"`

**Switch branch:**
- Branch list mein click → checks unsaved changes first:
  `"Switch to main? [Save & Switch] [Discard & Switch] [Cancel]"`
- Canvas reloads to that branch's last saved state

**Preview branch:**
- "Preview ↗" next to branch name → opens in new tab
- **Preview URL format:** `[site-slug].preview.buildrik.app/branch/[branch-name]` — always available regardless of whether the site has been published. Does NOT require site to be live.

**Merge branch:**
- "Merge into main" button — accessible via branch row "···" context menu (not a visible button to avoid accidental clicks)
- **Merge confirmation:** `"Merge feature/hero-redesign into main? This will update main with your branch changes. [Keep Branch & Merge] [Merge & Delete Branch] [Cancel]"`
  - **Primary CTA: "Keep Branch & Merge"** — merges changes into main, branch stays (for reference/rollback). Default choice. Non-destructive.
  - **Secondary: "Merge & Delete Branch"** — merges and deletes the branch. Destructive action, secondary position.
- Phase 1: non-conflicting changes only
- **Merge conflict handling (Phase 1 — improved):** Instead of "Contact support", show which elements conflict:
  `"Can't auto-merge. Conflict on: Hero Section, Navbar. Both branches edited these elements. [Keep main version for conflicts] [Keep branch version for conflicts] [Cancel]"` — per-conflict resolution in Phase 2
- Successful merge: review state resets to DRAFT. Toast: `"Merged feature/hero-redesign into main"`

**Branch delete (without merge):**
- Branch row "···" context menu → "Delete Branch"
- Confirmation: `"Delete feature/hero-redesign? All changes on this branch will be lost. [Delete] [Cancel]"`
- Only non-main branches can be deleted

**Active branch indicator:**
- Currently active branch ka naam Topbar mein badge ke tor pe always visible

**Role restriction:**
- Branching: Editor ya Admin only. Viewers cannot create/switch/merge branches.

---

## Panel Behaviors

### Open / Close

- Closed state: panel width = 0, opacity = 0 (smooth CSS transition)
- Open state: panel width = selected size mode (280/320/400px)
- Opening animation: 0.3s ease-bounce
- Closing animation: 0.2s ease
- **Panel NEVER closes during an active drag** (see Drag Lock Rule in Rail section)

### Auto-collapse

- **Unpinned panel:** canvas click → panel auto-collapses
- **Pinned panel:** never auto-collapses
- **Default state:** On viewport > 1200px, panel starts pinned (no auto-collapse). On ≤ 1200px, panel starts unpinned.
- **Exception 1:** Drag in progress → no collapse (Drag Lock Rule)
- **Exception 2:** Inline rename input focused → no collapse

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
- Pages tab: only Home page, no others — page search hidden (< 5 pages threshold)
- Media tab: empty state with upload CTA
- History tab: no versions yet — `"No history yet. Start editing to see changes."`

### Offline state:
- Add tab: still functional (catalog is client-side)
- Layers tab: still functional (data in memory)
- Pages tab: still functional
- Media tab: uploads disabled — tooltip: `"Uploads unavailable while offline"`. Drag-to-canvas from existing assets: still works (local references).
- Design Tokens: editable (real-time canvas updates still work) but export disabled. Draft auto-save paused — saves when reconnected.
- Settings tab: read-only — save buttons disabled with tooltip: `"Cannot save while offline"`. Domain verification polling paused.
- History tab: still browsable (cached), revert disabled with tooltip: `"Revert unavailable while offline"`

### Small screen (≤ 1200px viewport):
- Panel defaults to compact (280px) size mode
- **Pin is OFF by default** (space is tight — panel overlays canvas)
- Rail always visible, panel overlays canvas (doesn't push canvas)

### Medium/Large screen (> 1200px viewport):
- Panel defaults to normal (320px)
- **Pin is ON by default** (enough space — panel pushes canvas to the right)
- Panel pushes canvas (doesn't overlay)
- This is the standard behavior of Figma, Webflow, Framer on desktop

### Multiple users editing same page:
- Layers tab: real-time sync — if Ayesha adds an element, it appears in Shah's Layers panel in real-time
- Pages tab: page list real-time updates — new pages appear, deleted pages disappear
- History tab: real-time activity — naye entries appear automatically
- Components tab: new components added by collaborators appear in real-time
- Design Tokens tab: if collaborator edits a token, both users see canvas update — Draft chip appears for both

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
| Settings tab pattern | Card list → Full Page drill-in | Complex settings need more space than 280px panel |
| Version History tab position | Bottom section (last) | Config tab — less frequently used than content tabs |
| Branching in Version History tab | Top of History tab (Branches section) | Naturally related to history/versioning |
| Page SEO in Pages tab | Inside Page Settings drill-in | Per-page setting — belongs with page management |
| Global SEO in Settings tab | Site Settings → SEO screen | Per-site default — belongs with site settings |
| Component Variants selector | Right Bar Inspector (Advanced tab) | Selection-dependent — not Left Bar |
| Templates tab kept | Yes, in Left Bar | Canvas-direct — templates drop onto canvas |
| Design Tokens tab kept | Yes, in Left Bar | Canvas-direct — tokens applied to canvas elements |
| Page Settings pattern | Full-page view (same as Site Settings) | 8+ fields in 280px panel = too cramped; full-page is consistent |
| Panel collapse during drag | Never collapses | Drag is the primary Add/Media/Component workflow |
| Revert behavior | Adds new history entry, never deletes forward history | Preserves ability to re-revert to any version |
| Revert undo toast | Removed | Confirmation dialog already protects. Undo would add noise to history |
| Branch merge conflict Phase 1 | Show which elements conflict + simple keep-main/keep-branch choice | "Contact support" was a dead end |
| Token "Draft" semantics | Real-time canvas update + Draft = uncommitted set | Users need live preview; Export/Publish use committed version |
| Token tab guard | Removed | Draft auto-saves to server; "discard" dialog was misleading. Draft chip is the signal |
| Panel pin default | Pinned on > 1200px, unpinned on ≤ 1200px | Desktop users need panel open constantly; small screens need the space |
| Rail visual hierarchy | 2-tier: top 6 primary (large), bottom 3 secondary (small/dim) | 9 equal icons create discovery problems; hierarchy matches usage frequency |
| Branch merge primary CTA | "Keep Branch & Merge" = primary | Deleting a branch is irreversible; conservative action should be default |
| Add Favorites threshold | 3 uses of same element | Predictable, not too aggressive, not too slow |
| Escape key behavior | First = select parent, second = deselect | Power user navigation; matches Figma muscle memory |

---

## UX Issues Fixed in This Version

| # | Issue | Resolution |
|---|---|---|
| B1 | Drag collapses panel mid-drag | Drag Lock Rule added to Rail section |
| B2 | Page switch loses active text edit | Guard dialog added to Pages tab |
| B3 | Layers doesn't refresh on page switch | Cross-tab sync rule added to Layers tab |
| B4 | Delete in-use asset breaks canvas | In-use check + warning added to Media tab |
| B5 | Save/overwrite image is silently destructive | Usage warning added to image editor |
| B6 | Branch switch has no "Save first" option | Three-option dialog added |
| B7 | Revert could destroy forward history | Revert adds new entry rule added |
| B8 | "Edit on Canvas" undefined cross-page | Cross-page navigation flow added |
| G1 | No hover-to-expand during drag in Layers | 600ms hover-expand added |
| G2 | Parent hidden + child show undefined | Warning dialog added |
| G3 | Locked elements unselectable in panel | Panel selection always allowed for locked elements |
| G4 | Page Settings drawer ambiguity | Drill-in pattern explicitly specified |
| G5 | Page reordering missing | Drag-to-reorder added to Pages tab |
| G6 | Page search missing | Search input added (visible at 5+ pages) |
| G7 | Duplicate naming undefined | `"[Name] (Copy)"` convention added |
| G8 | Token rename propagation undefined | Rename cascade rule added |
| G9 | Token draft on browser close | Auto-save + persistence on re-open added |
| G10 | Draft vs real-time semantic confusion | Semantics section added to Design Tokens |
| G11 | Analytics: save vs publish timing | "Goes live on next Publish" added |
| G12 | Settings Full Page dirty state on Back | Same guard as tab switch, added |
| G13 | Version creation timing undefined | Explicit trigger list added |
| G14 | Branch naming validation missing | Rules added |
| G15 | Branch preview for unpublished sites | Staging URL format added |
| G16 | Search persistence on tab switch | Search State Rule added to Rail section |
| G17 | Long layer names truncation | 24-char truncation + hover tooltip added |
| G18 | Export code quality expectations | Note added to Export screen |
| U1 | Tooltip doesn't change when tab active | "Close [Tab] · Z" tooltip behavior added |
| U2 | Click-to-add drop position ambiguous | Container-aware drop logic added |
| U3 | Category collapse state not persisted | localStorage persistence added |
| U4 | Bring to Front confusing in tree view | Clarification note added to context menu |
| U5 | Merge conflict is a dead end | Simple conflict resolution added Phase 1 |
| U6 | No timeline pagination | Load more + filter added |
| U7 | No branch delete | Branch delete via ··· context menu added |
| U8 | Component preview snapshot undefined | Snapshot spec added |
| U9 | Drag media to canvas not mentioned | Explicitly added to Media tab |
| U10 | Scroll position not preserved | Per-tab scroll preservation added |
| U11 | Token flat list doesn't scale | Noted as Phase 2 — grouping/namespacing |
| U12 | Domain status not visible from cards | Status badge on Domain card added |
