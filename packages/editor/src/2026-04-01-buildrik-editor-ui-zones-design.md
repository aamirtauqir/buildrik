# Buildrik Editor — UI Zone Design
**Date:** 2026-04-01
**Status:** Draft

---

## Overview

Buildrik Editor ek site-specific editor hai jo dashboard se redirect ho kar aata hai. Editor ek particular site ke liye hai — yahan koi "All Projects" navigation nahi hogi. Layout 4 main zones + 1 full page se bana hai.

```
┌─────────────────────────────────────────────────────────────┐
│                         TOPBAR                              │
├──────────┬───────────────────────────────────┬──────────────┤
│          │                                   │              │
│   LEFT   │           CANVAS                  │    RIGHT     │
│   BAR    │                                   │    BAR       │
│          ├───────────────────────────────────┤              │
│          │       CANVAS FOOTER               │              │
└──────────┴───────────────────────────────────┴──────────────┘
```

---

## Zone 1 — TOPBAR
**Rule:** Sirf wo cheezein jo global/project level hain. Koi element-level kaam nahi.

### Layout (left → right)
```
← Dashboard  |  ↩ Undo  ↪ Redo  |  🚀 Publish ▾  ─────────  💾 Saved  ⚠ Issues  [Avatars]+Invite  ●  ⌘K  Preview ↗  ?  👤
```

### Features

#### Navigation
- **← Back to Dashboard** — Sirf arrow + "Dashboard" text. Koi site name nahi dikhega topbar mein.

#### Edit Actions
- **Undo** — Last action reverse
- **Redo** — Redo action

#### Publish (dropdown)
- **Publish / Unpublish button** — Frequent action, prominent placement
- Button pe **Published / Draft badge** — current status always visible
- Dropdown contents:
  - Publish Now
  - View Live Site ↗
  - Unpublish
  - Deployment Status tracking
  - Published URL (copy)

#### Status Bar (right side)
- **Save Status** — Idle / Saving / Unsaved / Error / Offline states
- **Sync Status Dot** — Real-time sync quality. Hover pe **last sync timestamp** tooltip dikhta hai
- **Issues Badge** — Error + warning count, click to open issues panel
- **Connection Quality Indicator** — Network quality

#### Presence / Collaboration
- **Online Presence Avatars** — Colored avatar circles of everyone currently in the editor
  - Each avatar has unique color matching their canvas cursor
  - Hover → name + role (editing / viewing)
  - Click avatar → **Follow Mode** (viewport follow karo unka)
  - Overflow: `+2` jab zyada log hon
  - Follow mode active hone pe topbar mein indicator: `Following Ayesha ✕`
- **Sync dot** — Connection quality (green = synced, yellow = slow, red = offline)

#### Tools
- **Preview ↗** — Live preview new tab mein
- **⌘K Command Palette** — Search any action globally (icon + keyboard shortcut)
- **? Help** — Keyboard shortcuts panel + onboarding checklist entry point
- **👤 Account Icon** — Opens Account Full Page within editor

### NOT in Topbar
- ~~Site name~~
- ~~Device Switcher~~ → Canvas Footer mein hai
- ~~All Projects / New Project~~ → Dashboard ka kaam hai
- ~~Export~~ → Account Full Page mein
- ~~Share/Invite~~ → Presence avatars ke saath inline

---

## Zone 2 — LEFT BAR
**Rule:** Sirf wo cheezein jo canvas se directly related hain — ya canvas pe drop hoti hain ya canvas structure represent karti hain.

### Tabs (7)

#### Tab 1 — ＋ Add Elements
Element palette — drag karke canvas pe drop karo.

| Group | Elements |
|---|---|
| Layout | Container, Section, Grid, Row, Column, Stack, Side-by-Side |
| Text & Buttons | Heading, Paragraph, Button, Link, Divider, Badge, Spacer, Label, Quote |
| Forms & Inputs | Input, Textarea, Select, Checkbox, Radio, Toggle, Slider, File Upload, Form |
| Media | Image, Video, Audio, Gallery, Carousel, SVG, Lottie |
| Page Sections | Hero, Navbar, Footer, Features, Pricing, CTA, Testimonial, FAQ |
| E-Commerce | Product Card, Cart, Checkout, Reviews |
| Advanced | Map Embed, Video Embed |

Features:
- Element search
- Favorites system (frequently used save karo)

#### Tab 2 — ⊟ Layers
Canvas ka hierarchy tree — direct structure representation.

- Element hierarchy tree view
- Expand / collapse layers
- Visibility toggle (show/hide on canvas)
- Lock / unlock element
- Rename inline
- Reparent via drag in layers panel

#### Tab 3 — 📄 Pages
Site ke pages — canvas switching.

- Page list
- Add new page
- Delete page (confirmation ke saath)
- Rename page
- Home page indicator
- Page search
- Duplicate page
- Import template as new page
- Page SEO settings — title, meta description, social preview image
- Page advanced settings — slug, robots.txt, canonical URL
- Page context menu (right-click)

#### Tab 4 — ⬡ Components
Reusable blocks jo canvas pe drag/drop hote hain.

- Component library browser
- Component search
- Create new component (canvas selection se)
- Component preview
- Rename component
- Delete component
- Nested component support
- Component detail view

#### Tab 5 — 🖼 Media / Assets
Files jo canvas pe directly add hoti hain.

- Image upload
- Drag & drop file upload
- Image editor — crop
- Image editor — brightness / contrast / saturation
- Image editor — compression & format optimization
- Icon picker — search + browse categories
- Video preview player
- Asset detail overlay
- Asset delete (confirmation ke saath)
- Filter by type (images / videos / icons)

#### Tab 6 — ⊞ Templates
Page/section templates jo canvas pe apply hote hain.

- Template browser
- Template search
- Template preview modal
- Apply template to page
- Apply progress tracking

#### Tab 7 — 🎨 Design Tokens
Color, spacing, typography tokens jo canvas elements use karte hain.

- Color tokens — list, add, edit, delete
- Spacing tokens — list, add, edit, delete
- Typography tokens — list, add, edit, delete
- Token review modal
- Export design tokens
- Draft status indicator

#### Tab 8 — 🕐 Version History (last tab)
Project ka complete version timeline.

- Version history timeline
- Change description per version
- Revert to previous version
- Timestamp tracking

---

### NOT in Left Bar
- ~~Inspector / Editing~~ → Right Bar
- ~~Publish~~ → Topbar
- ~~Site Settings~~ → Account Full Page
- ~~Billing~~ → Account Full Page

---

## Zone 3 — CANVAS
**Rule:** Canvas pe jo directly hota hai — element manipulation, visual overlays, collaboration.

### Element Interaction
- Click to select element
- Drag & drop (reorder + reparent)
- Resize handles (8-point)
- Marquee / box selection (drag to multi-select)
- Double-click inline text edit
- Keyboard move (arrow keys)
- Hover highlight (element outline)
- Parent highlight (container show on hover)
- Drop feedback indicator (where element will land)
- Auto-scroll during drag
- Touch drag support (mobile)
- Selection animation

### Guides & Alignment
- Smart guides (alignment lines during drag)
- Snap to grid
- Snap to other elements
- Ruler guides (manual drag from ruler)
- Spacing labels (margin/padding dimensions visible)

### Context & Overlays
- Element breadcrumb (hierarchy path)
- Right-click context menu
- Multi-select toolbar (align, distribute, group)
- Quick actions toolbar (context-sensitive floating)
- Slash commands (type `/` in canvas to add elements)
- Block picker modal (search elements)
- AI smart suggestions (style suggestions on selection)
- Remote cursors (collaborators — color matches their avatar)
- Conflict resolution modal (when two edits clash)
- Rich text editor (inline — bold, italic, links, lists)
- CMS preview bar (live content preview mode toggle)

### Canvas Footer
| Left | Center | Right |
|---|---|---|
| Grid toggle, Guides toggle, X-Ray, Dev Mode | 📱 Mobile · ⬜ Tablet · 🖥 Desktop · ▬ Wide · `1440px` | 100% ▾ (zoom) |

- Device Switcher — Mobile / Tablet / Desktop / Wide
- Viewport size input (custom px)
- Grid overlay toggle
- Ruler guides toggle
- X-Ray toggle
- Dev mode toggle
- Zoom in / out / fit to screen
- **CMS Preview toggle** — sirf tab visible jab project mein CMS bindings hon. Click karne pe floating bar aata hai:
  ```
  👁 CMS Preview  |  Blog Posts ▾  |  ← 2 of 8 →  |  ✕
  ```

---

## Zone 4 — RIGHT BAR (Inspector)
**Rule:** Selected element ki properties. Koi canvas structure nahi, sirf element-level editing.

### State Tabs (across all inspector tabs)
- Default
- Hover
- Focus
- Active
- Disabled
- Breakpoint indicator per property (responsive)

### Inspector Tab 1 — Layout
- Display type — Block / Flex / Grid / Inline
- Position — Static / Relative / Absolute / Fixed / Sticky
- Width + Height + Aspect Ratio
- Min / Max Width + Height
- Margin (T/R/B/L)
- Padding (T/R/B/L)
- Overflow — Visible / Hidden / Scroll / Auto
- Flexbox — direction, align, justify, gap, wrap
- CSS Grid — columns, rows, gap, placement
- Z-index

### Inspector Tab 2 — Style
- Background — Solid / Gradient / Image / Pattern
- Border — width, style, color, individual sides
- Border radius — all corners individually
- Typography — font family, size, weight, line-height, letter-spacing
- Text alignment + decoration
- Text color
- Opacity
- CSS classes — add, remove, edit
- Link / href — URL, target, rel
- Visibility — display, visibility, pointer-events

### Inspector Tab 3 — Effects
- Box shadow (multiple shadows)
- Text shadow
- Blur / Backdrop blur
- Transform — rotate, scale, translate, skew
- Transition settings
- Animation — preset + custom timing + easing
- CSS Filters — brightness, contrast, grayscale, invert, sepia

### Inspector Tab 4 — Advanced
- Raw CSS editor (full CSS)
- Click interactions — URL / page / element / JS action
- CMS field binding (dynamic content)
- Custom data attributes
- Element ID display + copy
- Component variant selector
- Dev mode — CSS code output per element (syntax highlighted)
- Copy code to clipboard (dev mode mein)

---

## Zone 5 — ACCOUNT FULL PAGE
**Rule:** Account icon click se editor ke andar hi full page khulega — redirect nahi hoga. User editor mein rehta hai.

> **Note:** Yeh cheezein dashboard mein bhi hain — duplication nahi hai, same data hai. Editor mein isliye rakh rahe hain taake user editor se bahar na jaye.

### Section 1 — Access & Team
- Access & Permissions — who can view/edit workspace
- Team Management — add/remove members, roles assign
- Collaboration Settings — real-time collab preferences

### Section 2 — Integrations
- Third-party integrations — Zapier, Webhooks, Analytics tools etc.

### Section 3 — Plans & Billing
- Current Plan — active plan name + features list
- Plan Details & Comparison — feature comparison, upgrade CTA
- Billing & Invoices — payment method, invoice history

### Section 4 — Site Settings
- Site Name & Description
- Favicon upload
- Custom Domain configuration
- Analytics / Tracking code integration
- Export settings — HTML / React / Vue format
- Global SEO settings
- Advanced settings — performance, caching, API

---

## Feature Count Summary

| Zone | Features |
|---|---|
| Topbar | 13 (#109 Publication badge, #159 Last sync timestamp added) |
| Left Bar | 53 (8 tabs — Version History added) |
| Canvas + Footer | 29 (CMS Preview toggle added) |
| Right Bar | 41 (#163 Code preview, #164 Copy code added) |
| Account Full Page | 14 |
| **Total** | **174 / 174** ✅ |

> Note: 4 features (#166 Welcome modal, #167 Spotlight tour, #169 Achievement prompts, #170 Progress tracking) auto-trigger behaviors hain — koi specific UI zone nahi, yeh app khud fire karta hai. Baaki 170 features saare zones mein properly place hain.

---

## Key Design Decisions

1. **No site name in topbar** — Editor ek site ka context hai, naam dikhane ki zaroorat nahi
2. **No "All Projects"** — Dashboard ka kaam hai, editor mein nahi
3. **Device Switcher → Canvas Footer** — Directly canvas viewport affect karta hai
4. **Publish → Topbar** — Frequent action, prominent hona chahiye
5. **Account → Full Page (not modal)** — Better UX, complex settings ke liye space chahiye
6. **No redirect for settings** — User editor se bahar nahi jaega, full page editor ke andar khulega
7. **Presence avatars = Follow Mode** — Click avatar → follow their viewport (Figma style)
8. **Cursor color = Avatar color** — Consistent visual identity per collaborator
9. **Share/Invite → inline** with presence avatars, not separate button

---

## Resolved Questions

- [x] **Onboarding** — Automatic trigger hoga. Welcome modal, feature tour, achievement prompts sab auto fire honge. Help (?) icon se manually bhi access ho sakta hai.
- [x] **Version History** — Left bar ka last tab hoga (Tab 8). Baaki tabs ke baad at the bottom.
- [x] **CMS Preview Bar** — Canvas footer mein ek toggle button hoga. Sirf tab visible hoga jab project mein CMS bindings hon. Click karne pe ek floating bar canvas ke upar aata hai jisme: CMS collection selector, entry navigation (← 2 of 8 →), aur close button hoga.

---

## CEO Review Expansions — 2026-04-01
**Source:** `/plan-ceo-review` — SCOPE_EXPANSION mode. 6 expansions accepted. Full spec in `~/.gstack/projects/codex/ceo-plans/2026-04-01-buildrik-editor-ui-zones.md`

### Expansion 1 — AI Build Mode (⌘K upgraded)

**Zone:** Topbar (⌘K shortcut, existing location)

⌘K is upgraded from a command palette to a full AI Build interface. The command palette functionality is absorbed — typing `/` triggers slash commands, natural language triggers AI generation (Notion/Linear pattern).

**v1 capabilities:** Generate section from prompt, add element, restyle selected element, edit text content, search actions via `/` prefix.

**v1 does NOT support:** Full page regeneration, CMS content generation, structural layout changes, cross-element operations.

**In-progress state:** Spinner + "Generating..." label, input disabled, Cancel link visible.

**Error states:** Timeout (>5s), unusable response, invalid markup — each shows inline error + "Try again." Response model: atomic round-trip (not streaming). Client and server both enforce 5s hard cutoff. Post-cancel responses are discarded.

---

### Expansion 2 — Inline Comments on Canvas

**Zone:** Canvas (comment indicators) + floating comment panel (right edge of canvas, NOT Right Bar)

- Comment dot badges on elements at all times (not behind a toggle)
- Right-click → "Add Comment" OR click comment icon in Topbar to enter comment mode
- Comment mode: clicking element with comment opens thread; clicking element without comment creates new thread; canvas selection disabled while in comment mode; exit via Escape or clicking comment icon again
- Floating panel: thread + @mention input + resolve button
- Navigate to new page → comment panel closes
- Deleted element: comment indicator removed from canvas, thread accessible via "View all comments" link in panel (marked with "?" icon + "Element no longer exists")

---

### Expansion 3 — Git-style Branching

**Zone:** Left Bar — Tab 8 (Version History) gains a "Branches" section at the top

**Phase 1 (this spec):** Create branch, switch branch, preview branch (live preview in new tab), merge (non-conflicting only).

**Phase 2 (separate spec):** Merge conflict diff view with per-element resolution.

Merge conflict Phase 1 behavior: blocking message only ("cannot be merged automatically"), no diff view.

Active branch shown in Topbar as a small badge (always visible in both Simple and Advanced mode).

Role: Editor or Admin only. Branching resets review state on merge — merged result starts in DRAFT.

---

### Expansion 4 — Async Review Workflow

**Zone:** Topbar — Publish button gains 4 review states

```
DRAFT → IN REVIEW → APPROVED → PUBLISHED
```

Publish badge becomes state badge. Dropdown adapts per state (see CEO plan for full state machine).

- DRAFT: Submit for Review, Publish Directly (Admin only)
- IN REVIEW: Approve (Editor/Admin, not the submitter), Request Changes (reverts to DRAFT)
- APPROVED: Publish Now
- PUBLISHED: Unpublish, Submit for Review (starts new revision cycle — live site stays live)

Self-approval blocked for Editors. Admin "Publish Directly" bypasses all blocks (solo team escape hatch).

---

### Expansion 5 — Progressive Disclosure (Simple/Advanced Toggle)

**Zone:** Topbar — rightmost area, before account icon

New users default to Simple mode. Toggle persists per-user. Switching is non-destructive — applied settings remain active, only controls are hidden.

**Simple mode hides:**
- Left Bar: Design Tokens (Tab 7), Version History (Tab 8)
- Right Bar: CSS Grid, Z-index, CSS classes, pointer-events Visibility, Effects tab (entire), Advanced tab (entire)
- Canvas Footer: Dev Mode toggle, X-Ray toggle
- Topbar: Branch name badge remains always visible

---

### Expansion 6 — Accessibility Overlay

**Zone:** Canvas Footer — new "A11y" toggle (next to Grid, Guides, X-Ray, Dev Mode)

**Prerequisite:** axe-core (or equivalent WCAG library) must be integrated before this feature is built.

When ON, canvas shows:
- **Text elements:** Contrast ratio badge (PASS/FAIL with ratio)
- **Images:** Red "No alt text" badge if alt missing
- **Interactive elements:** Keyboard nav order numbers — viewport scope only (known limitation: full-page report deferred to Phase 2)
- **Containers:** ARIA role label badge

**Action on click:**
- Contrast badge → Right Bar, Style tab, text/background color fields
- Alt text badge → Right Bar, Advanced tab, Alt text field
- ARIA role badge → Right Bar, Advanced tab, Semantic role field

**Advanced tab fields clarification:** Advanced tab must have four clearly separate fields: (1) Element ID, (2) Semantic role / ARIA role dropdown, (3) Alt text (image elements only), (4) Custom data-* attributes.

---

### Updated Topbar Layout

```
← Dashboard  |  ↩ Undo  ↪ Redo  |  🚀 [State] ▾  ─────────  💾 Saved  ⚠ Issues  [Avatars]+Invite  💬  ●  ⌘K(AI)  Preview ↗  ?  Simple/Advanced  👤
                                        ↑                                              ↑            ↑      ↑
                                   Review state badge                           Comment mode    Sync  AI Build Mode
```

### Updated Canvas Footer

```
Grid | Guides | X-Ray | Dev Mode | A11y | 📱 Mobile · ⬜ Tablet · 🖥 Desktop · ▬ Wide · 1440px | 100% ▾
                                   ↑
                          New A11y toggle
```

### Build Order

1. Progressive Disclosure (no deps)
2. Inline Comments (needs presence/sync layer)
3. Accessibility Overlay (needs axe-core bundled first)
4. AI Build Mode v1 (needs AI API)
5. Async Review Workflow (needs roles wired)
6. Branching Phase 1 (needs backend arch spike first)
