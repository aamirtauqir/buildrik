# Buildrik / Aquibra Studio — All App Flows

> Last updated: 2026-03-29
> Based on: source code audit of `src/editor/`

---

## Flow 1: App Open / First Load

```
User opens app
  ↓
AquibraStudio.tsx mounts
  ↓
useComposerInit → Composer engine initialize hota hai
  ↓
localStorage check: "aqb-template-first-run" key hai?
  ├── NAHI (first time) → TemplatesTab automatically khulta hai
  │     User template choose karta hai → ApplyProgressOverlay → Canvas populate
  └── HAA (returning user) → Canvas last state ke saath load hota hai
```

**States:**
- Loading (Composer init)
- First run (template picker)
- Returning user (canvas direct)

**Gap:** Koi loading spinner nahi — blank screen dikhti hai Composer init ke dauran.

---

## Flow 2: Element Add Karna

```
User Add tab click karta hai (rail icon ya shortcut A)
  ↓
Sidebar: BuildTab opens
  ↓
Option A — Drag karo:
  User element card ko canvas pe drag karta hai
    ↓
  useCanvasDragDrop → drop zone highlight
    ↓
  Element canvas pe insert hota hai
    ↓
  Toast: "Inserted: Heading" (2 sec)

Option B — Click karo:
  User element card pe click karta hai
    ↓
  onBlockClick → composer.elements.add()
    ↓
  Canvas re-renders with new element

Option C — Search:
  User search bar mein type karta hai
    ↓
  SearchResults show hoti hain (filtered catalog)
    ↓
  Same as Option A or B
```

**States:**
- Default (category accordions)
- Searching (SearchResults component)
- Dragging (canvas shows drop zones)
- Empty search (no results message)

**Gap:** Koi "inserting..." loading state nahi. Large sections insert pe freeze ho sakta hai.

---

## Flow 3: Element Select → Style Edit

> Main flow of the app — most used

```
User canvas pe element click karta hai
  ↓
useComposerSelection → selectedId update
  ↓
Blue selection box + resize handles appear (SelectionBoxOverlay)
  ↓
Right Inspector (ProInspector) automatically update hota hai
  ↓
User inspector mein koi property change karta hai:
  e.g. color, font-size, padding
    ↓
  handleStyleChange → composer.styles.update()
    ↓
  Canvas re-renders instantly (live preview)
```

**Inspector 3 tabs:**
- **Layout** — position, size, flexbox, constraints, overflow
- **Appearance** — typography, background, border
- **Effects** — shadow, opacity, animation, interactions, raw CSS

**States:**
- No selection → "Select an element" empty state
- Single select → full 3-tab inspector
- Multi-select → alignment toolbar only, reduced inspector
- Inline editing (double-click) → text formatting toolbar

**Gap:** Koi indicator nahi ke aap kis breakpoint ke styles edit kar rahe ho.

---

## Flow 4: Responsive / Breakpoint Switch

```
User topbar ya canvas footer mein device switch karta hai
  ↓
Device: mobile / tablet / desktop / wide
  ↓
Canvas resize hota hai us device ki width pe
  ↓
Inspector → currentBreakpoint prop update
  ↓
Inspector ab us breakpoint ke styles dikhata hai
```

**States:**
- Desktop (default, 1280px)
- Tablet (768px)
- Mobile (375px)
- Wide (1440px)

**Gap:**
- Device switcher **do jagah hai** — topbar aur canvas footer dono mein. Confusing.
- Inspector mein koi visual indicator nahi ke "ye styles base se alag hain (overridden)"

---

## Flow 5: Pseudo-State Styling (:hover, :focus, etc.)

```
User element select karta hai
  ↓
Inspector header mein pseudo-state selector dikhta hai:
  [ :default ] [ :hover ] [ :focus ] [ :active ] [ :disabled ]
  ↓
User ":hover" click karta hai
  ↓
Inspector ab hover state ke styles dikhata hai
  ↓
User color/size change karta hai → sirf hover pe apply hota hai
  ↓
States with existing overrides = indicator dot dikhta hai (statesWithOverrides)
```

**States:**
- default (normal styles)
- :hover (mouse over)
- :focus (keyboard/click focus)
- :active (click held)
- :disabled (disabled state)

---

## Flow 6: Layer Tree Navigation

```
User Layers tab kholta hai (rail icon ya shortcut Z)
  ↓
LayersTab → LayersPanel renders DOM tree
  ↓
User layer row pe click karta hai
  ↓
Canvas element select hota hai (bidirectional sync)

Reverse:
Canvas pe element hover → Layers panel mein woh row highlight
Canvas pe element select → Layers panel mein scroll to that row
```

**Actions per layer row:**
- Click → select on canvas
- Double-click → rename
- Eye icon → toggle visibility
- Lock icon → lock/unlock
- Drag handle → reorder
- Right-click → context menu (delete, duplicate, etc.)
- Shift+click → multi-select

**Gap:** Empty canvas pe "Add Block" CTA dikhta hai layers panel mein — good UX.

---

## Flow 7: Pages Management

```
User Pages tab kholta hai (rail icon ya shortcut P)
  ↓
PageList shows all pages (name + status)
  ↓
User page pe click karta hai → canvas us page pe switch karta hai

Page add karna:
  [+ Add Page] button → new page create → canvas switches to it

Page settings:
  [⋮] menu → "Settings" → PageSettingsDrawer slides in
    ├── SEO tab: title, meta, slug, canonical
    ├── Social tab: OG image, OG title, OG description
    └── Advanced tab: noindex, custom code, redirect

Page delete:
  [⋮] menu → "Delete" → confirm dialog → page removed
```

**States:**
- Page list view
- Page settings drawer (3 sub-tabs)
- Confirm delete dialog

**Gap:** Koi bulk operations nahi (select multiple pages to reorder/delete).

---

## Flow 8: Media Upload + Use

```
User Media tab kholta hai (rail icon ya shortcut J)
  ↓
MediaLibraryPanel → asset grid (images, videos, fonts)
  ↓
Upload karna:
  [Upload ↑] button → file picker → upload → asset grid mein appear

Use karna (image element pe):
  Canvas pe image element select karo
    ↓
  Inspector → Appearance → Background ya Image Source
    ↓
  Media picker opens (IconPickerModal ya MediaLibraryPanel)
    ↓
  Asset choose karo → element update

Edit karna:
  Asset card pe click karo → ImageEditorModal
    ├── CropOverlay — crop/resize
    ├── OptimizationPanel — quality/format
    └── VideoPreview (videos ke liye)
```

**Gap:** Upload progress indicator nahi panel mein. Koi "this asset is used on X pages" info nahi.

---

## Flow 9: Design Tokens Edit

```
User Design tab kholta hai (rail icon ya shortcut D)
  ↓
DesignSystemTab → 3 sections:
  COLORS → ColorTokenList
  TYPOGRAPHY → TypeTokenList
  SPACING → SpacingTokenList

Token edit karna:
  Token row pe click → inline edit
    ↓
  DraftChip appear hota hai (unsaved changes indicator)
    ↓
  [Review] button → ReviewModal (changes preview)
    ↓
  Save → tokens update → all elements using this token update

Token add karna:
  [+ Add] button → AddTokenModal → name + value → save

Unsaved changes hain aur user tab switch karna chahta hai:
  TabGuardModal → "Save changes?" confirm
```

**Gap:** Token ka koi usage count nahi ("5 elements use this color"). Undo within design tab nahi.

---

## Flow 10: Settings Screens

```
User Settings tab kholta hai (rail icon ya shortcut S)
  ↓
SettingsTab — card list view (card-drill-in pattern)
  ↓
User koi card pe click karta hai → detail screen slide in

9 screens:
  ├── Site Settings — site name, favicon, language, logo
  ├── SEO — global meta, robots.txt, sitemap
  ├── Domains — custom domain connect
  ├── Analytics — GA/GTM integration
  ├── Integrations — third-party apps
  ├── Export — download HTML/CSS/ZIP
  ├── Advanced — custom code, scripts
  ├── Billing — plan + payment
  └── Locked — feature-gated (upsell screen)
```

**States:**
- Card list (main settings view)
- Detail screen (back button to return)
- Locked screen (upgrade prompt)

**Gap:** Koi global "unsaved changes" indicator nahi across all settings screens.

---

## Flow 11: Publish Flow

```
User Publish tab kholta hai (shortcut U — NO rail button)
  ↓
PublishTab shows:
  - Status badge: Draft / Published
  - Pre-publish checklist:
      ✓ Page title set       (computed from data)
      ✓ Favicon uploaded     (computed from data)
      ✓ Pages exist          (computed from data)
      ✗ SEO title            ← ALWAYS FAILS (hardcoded false — BUG)
      ✗ Meta description     ← ALWAYS FAILS (hardcoded false — BUG)
      ✗ Social image         ← ALWAYS FAILS (hardcoded false — BUG)
  - [Publish] button
  - URL: https://[slug].buildrik.com [Copy]

User [Publish] click karta hai:
  ↓
  onPublish callback fire hota hai (host app inject karta hai)
  ↓
  Agar callback nahi hai → KUCH NAHI HOTA (silent failure)
  ↓
  Success pe → StatusBadge "Published" ho jata hai

User [Unpublish] click karta hai:
  ↓
  onUnpublish callback → site unpublish
```

**Critical Bugs:**
1. SEO/meta/social checks hamesha ✗ dikhte hain
2. Publish tab ka koi rail button nahi — users dhundh nahi paate
3. Host callbacks required — standalone use mein kaam nahi karta
4. Koi publishing progress state nahi (spinner)
5. Koi publish error state nahi (retry option)

---

## Flow 12: History / Undo

```
Undo/Redo (shortcut Ctrl+Z / Ctrl+Y):
  Topbar ke undo/redo buttons
    ↓
  composer.history.undo() / redo()
    ↓
  useHistoryFeedback → toast notification ("Undone: ...")

History panel (shortcut H — NO rail button):
  User HistoryTab kholta hai
    ↓
  ActivityView → list of actions (e.g. "Added heading 2 min ago")
    ↓
  Entry pe click karo → DiffRow shows before/after
```

**Gap:** History entries pe click karne se sirf diff dikhta hai — **revert nahi hota**. "Jump to this version" feature missing.

---

## Flow 13: Template Apply

```
Option A — First run:
  App open hoti hai (fresh)
    ↓
  localStorage mein "aqb-template-first-run" nahi
    ↓
  TemplatesTab automatically open hota hai
    ↓
  User template select karta hai → TemplatePreviewModal
    ↓
  [Use Template] → TemplateUseDrawer → confirm
    ↓
  ApplyProgressOverlay (blocks interaction during apply)
    ↓
  Canvas template ke saath populate hota hai

Option B — Existing project mein:
  User Templates tab kholta hai (shortcut T — NO rail button)
    ↓
  Same flow from TemplatesTab step
```

**Gap:** No error state if template fails to load. No "applied successfully" toast.

---

## Flow 14: Component Create + Reuse

```
Create component:
  User Components tab kholta hai (shortcut ⇧A — NO rail button)
    ↓
  [+ New Component] → CreateComponentModal
    ↓
  Component canvas pe banta hai
    ↓
  ComponentDetailScreen → edit component

Use component:
  Components tab → ComponentRow → [Use] button
    ↓
  Component canvas pe insert hota hai
  (linked — changes propagate to all instances)
```

**Gap:** Components tab ka koi rail button nahi — most users will never find this feature.

---

## Flow 15: Inline Text Edit

```
User canvas pe text element pe double-click karta hai
  ↓
useCanvasInlineEdit → editing mode ON
  ↓
Text cursor appear hota hai
  ↓
useCanvasInlineCommands → keyboard commands active:
  - Bold (Ctrl+B)
  - Italic (Ctrl+I)
  - Link (Ctrl+K)
  - etc.
  ↓
Click bahar → editing mode OFF → changes save
```

---

## Flow 16: Multi-Select + Align

```
Option A — Marquee select:
  Canvas pe empty space pe click + drag
    ↓
  Rubber-band rectangle → elements inside select hote hain

Option B — Shift+click:
  Pehla element select → Shift + doosra element click

Multi-select state mein:
  ↓
  AlignmentToolbar appear hota hai canvas pe
  ↓
  Inspector mein simplified view (alignment controls only)
  ↓
  MultiSelectBadge shows count (e.g. "3 selected")
  ↓
  Align left / center / right / top / middle / bottom
  Distribute horizontally / vertically
```

---

## Flow 17: Context Menu (Right-Click)

```
User canvas pe element pe right-click karta hai
  ↓
ElementContextMenu appear hota hai:
  - Edit
  - Duplicate
  - Copy / Paste
  - Delete
  - Move: Up / Down / To Front / To Back
  - AI Request ← AI assistant ko element ke baare mein poocho
  - Lock
```

---

## Flow 18: Command Palette

```
User Cmd+K press karta hai (ya canvas footer button)
  ↓
CommandPalette modal open hota hai
  ↓
User type karta hai → commands filter hote hain
  ↓
Enter → command execute
```

Available commands: elements add, settings open, publish, undo, zoom, etc.

---

## Flow 19: Export

```
User Settings → Export click karta hai
  ↓
ExportModal open hota hai
  ↓
Options:
  - Format: HTML + CSS / ZIP
  - Include assets: yes/no
  - Minify: yes/no
  ↓
[Export] → CodePreview (generated code preview)
  ↓
Download button → file download
```

---

## Flow 20: Collaboration (Real-time)

```
Multiple users same project mein hain:
  ↓
useCursorSync → each user ka cursor canvas pe dikhta hai
  ↓
Ek user element move karta hai → doosre users ko live update
  ↓
Conflict hone pe:
  ConflictModal → "Accept theirs / Keep mine / Merge"
  SyncStatusIndicator → connection status
```

---

## Summary — Flows Status

| # | Flow | Status |
|---|------|--------|
| 1 | App open / first load | ✅ Works, no loading state |
| 2 | Element add | ✅ Complete |
| 3 | Select → style edit | ✅ Core flow, works well |
| 4 | Responsive / breakpoints | ✅ Works, dual device switcher confusing |
| 5 | Pseudo-state styling | ✅ Complete |
| 6 | Layer tree navigation | ✅ Most complete feature |
| 7 | Pages management | ✅ Complete |
| 8 | Media upload + use | ✅ Works, missing progress UI |
| 9 | Design tokens | ✅ Complete |
| 10 | Settings screens | ✅ 9 screens, no unsaved indicator |
| 11 | Publish | ⛔ 3 hardcoded bugs, no rail button |
| 12 | History / Undo | ⚠️ No revert to version |
| 13 | Template apply | ✅ Works, no error state |
| 14 | Component create/reuse | ⚠️ Hidden — no rail button |
| 15 | Inline text edit | ✅ Complete |
| 16 | Multi-select + align | ✅ Complete |
| 17 | Context menu | ✅ Complete |
| 18 | Command palette | ✅ Complete |
| 19 | Export | ✅ Complete |
| 20 | Collaboration | ✅ Infrastructure ready |

---

## Top 5 Issues to Fix First

1. **Publish tab ka rail button add karo** — most critical feature hidden hai
2. **Publish checklist bugs fix karo** — 3 items hardcoded false
3. **Auto-save indicator add karo** — user ko pata nahi chalta save ho raha hai ya nahi
4. **Components tab rail button add karo** — feature discoverable nahi
5. **Dual device switcher hata do** — sirf ek jagah rakho (topbar)
