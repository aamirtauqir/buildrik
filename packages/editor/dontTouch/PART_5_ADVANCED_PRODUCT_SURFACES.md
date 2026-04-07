# PART 5 — ADVANCED PRODUCT SURFACES

> Extracted from `prd_final.md` — Sections §12, §13, §14, §15, §16, §17, §5F–5J, §30 (AR5–AR11, AR13, AR15, AR22–AR23), Output E §E.5–E.7.
> Anti-downgrade rule: **Current capability is the FLOOR, not the ceiling.**

---

## Table of Contents

1. [CMS Surfaces](#1-cms-surfaces)
2. [Collaboration Surfaces](#2-collaboration-surfaces)
3. [AI Surfaces](#3-ai-surfaces)
4. [Version History Surfaces](#4-version-history-surfaces)
5. [Export and Publish Surfaces](#5-export-and-publish-surfaces)
6. [Command Palette](#6-command-palette)
7. [Keyboard Cheat Sheet](#7-keyboard-cheat-sheet)
8. [Advanced Modals Catalog](#8-advanced-modals-catalog)
9. [Onboarding Flow](#9-onboarding-flow)
10. [Shared Rules for Advanced Surfaces](#10-shared-rules-for-advanced-surfaces)
11. [Power User Requirements](#11-power-user-requirements)
12. [Anti-Downgrade Warnings (Advanced Surfaces)](#12-anti-downgrade-warnings-advanced-surfaces)
13. [Source Notes and Unclear Items](#13-source-notes-and-unclear-items)

---

## 1. CMS Surfaces

> Source: §12.1–12.4, §5H, §30 AR5, Output E §E.6 (A1–A2)

### 1.1 CMS Entry Points

**CRITICAL NOTE:** The CMS engine layer is fully implemented (CollectionManager, CMSBindingManager with full CRUD, field validation, and content querying). However, **most CMS UI entry points described below do NOT exist in the codebase**. The engine has no corresponding frontend surfaces.

| # | Entry Point | How to Access | Status in Code |
|---|------------|--------------|----------------|
| CMS-E1 | Create collection | Build tab → "Data" category → "CMS List" | **NOT FOUND** — Build catalog has 7 categories (basic, layout, forms, media, sections, ecom, advanced). No "Data" category. No "CMS List" element. |
| CMS-E2 | Bind text property | Inspector → chain icon on text fields | **NOT FOUND** — No chain/link binding icon in inspector property fields. |
| CMS-E3 | Bind image source | Inspector → "From Collection" button on image src | **NOT FOUND** — No "From Collection" button in inspector. |
| CMS-E4 | Bind style property | Inspector → right-click → "Bind to data" | **NOT FOUND** — No binding context menu option. |
| CMS-E5 | Manage collections | Settings → Integrations → "CMS Collections" card | **NOT FOUND** — IntegrationsScreen shows Formspree, Netlify, Stripe, Mailchimp, ConvertKit, Zapier. No CMS card. |
| CMS-E6 | CMS List element settings | Inspector → "Collection Binding" section | **NOT FOUND** — No Collection Binding section in inspector. |

**What DOES exist:** CollectionManager (`src/engine/cms/CollectionManager.ts`) with full CRUD for collections, fields, and content items. CMSBindingManager for element-to-collection binding. CollectionSetupModal exists in StudioModals.tsx (modal #10). The engine supports 14 field types: text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email.

### 1.2 Collection Setup Modal

**Trigger:** CMS-E1 (drag CMS List element onto canvas).

**Modal container:**
- `width: 520px; max-height: 80vh`
- `background: var(--aqb-surface-1)` (`#0f0f14`)
- `border: 1px solid var(--aqb-border)`
- `border-radius: 12px`
- `shadow: var(--aqb-shadow-xl)` (`0 16px 40px rgba(0,0,0,0.4)`)
- `padding: 0` (sections handle their own padding)

**Layout:**

```
┌──────────────────────────────────────────────┐
│ HEADER                               [× close]│  padding: 20px 24px
│ "Set up your collection"                      │  font: 18px Inter; weight: 600; color: #F5F5F0
│ "Define the data structure for your          │  font: 13px Inter; color: #B8B5AD
│  dynamic content."                            │
├──────────────────────────────────────────────┤
│ BODY                                          │  padding: 0 24px 20px
│                                               │
│ Collection name                               │  label: 10px Inter; weight: 600; uppercase; color: #908D85
│ [Blog Posts                              ]    │  input: height 36px; full width
│                                               │
│ FIELDS                                        │  label: same as above
│ ┌──────────────────────────────────────────┐  │
│ │ [≡] Title      [Text ▼]    [req ●] [×]  │  │  field row, h: 40px
│ │ [≡] Body       [Richtext ▼] [req ○] [×] │  │  [≡] = drag handle (grip-vertical)
│ │ [≡] Cover      [Image ▼]   [req ○] [×]  │  │  [req] = required toggle
│ │ [≡] Published  [Date ▼]    [req ○] [×]  │  │  [×] = delete field
│ └──────────────────────────────────────────┘  │
│                                               │
│ + Add field                                   │  ghost button; click → new empty row appended
│                                               │
│ Field type options:                           │  shown in type dropdown
│ [Text] [Image] [Number] [Boolean]             │
│ [Date] [URL] [Richtext] [Reference]           │
│                                               │
├──────────────────────────────────────────────┤
│ FOOTER                              gap: 8px  │  padding: 16px 24px; border-top: 1px solid var(--aqb-border)
│ [Cancel]                 [Create Collection]  │  Cancel=ghost, Create=primary
└──────────────────────────────────────────────┘
```

**Field row spec:**
- `height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 8px`
- `background: var(--aqb-surface-2); border-radius: 6px; margin-bottom: 4px`
- Drag handle: `grip-vertical`, 12px, `color: #5a584f; cursor: grab`
- Name input: `flex: 1; height: 28px; font: 12px Inter; background: var(--aqb-surface-3); border-radius: 4px`
- Type dropdown: `width: 100px; height: 28px; font: 11px Inter`
- Required toggle: `width: 16px; height: 16px; border-radius: 50%`. On: `background: #6366f1`. Off: `background: var(--aqb-surface-4); border: 1px solid var(--aqb-border)`
- Delete: `trash-2`, 12px, `color: #908D85`. Hover: `color: #ef4444`

**Validation:**
- Collection name required (empty → red border + "Name is required")
- At least 1 field required
- Duplicate field names → red border + "Field name must be unique"
- Create button disabled until valid

### 1.3 Binding Flow (Step-by-Step)

**Step 1 — User clicks bind icon:**
- The bind icon (Lucide `link`, 12px) appears to the right of any bindable inspector property field
- Icon default: `color: #908D85`. Hover: `color: #6366f1`
- Click → binding dropdown opens

**Step 2 — Binding dropdown appears:**
- `width: 280px; max-height: 320px`
- `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 8px; shadow: var(--aqb-shadow-md)`
- Position: below the property field, left-aligned
- Header: `"Bind to data"` — `font: 12px Inter; font-weight: 600; color: #F5F5F0; padding: 8px 12px`
- Search: `"Search fields..."` input — `height: 28px; margin: 0 8px 8px; font: 11px Inter`

**Step 3 — User selects collection → field:**
- Collections listed as groups: `"Blog Posts"` with Lucide `database` icon
- Under each collection: fields listed with type icons (`type`=Text, `image`=Image, `hash`=Number, etc.)
- Each field row: `height: 32px; padding: 0 12px; font: 12px Inter; color: #B8B5AD`
- Hover: `background: var(--aqb-surface-3); color: #F5F5F0`
- Only compatible fields shown (text property → text/richtext/url fields; image property → image fields)

**Step 4 — Bound state UI:**
- Property field changes appearance:
  - Value replaced with: `"BlogPosts.title"` — `font: 11px JetBrains Mono; color: #6366f1`
  - Chain icon: now `#6366f1` (indigo, active state)
  - `background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 4px`
  - Field is read-only (value comes from CMS)

**Step 5 — Canvas shows live preview:**
- CMS List element renders with first collection record data
- CMS preview indicator appears (§1.4 below)

**Step 6 — Unbinding:**
- Click the indigo chain icon on bound field
- Popover: `"Unbind from BlogPosts.title?"` + [Unbind] destructive button + [Cancel]
- On unbind: field returns to normal editable state, value reverts to placeholder or empty

### 1.4 CMS Preview Mode

**When any CMS-bound element is on canvas:**

**Record navigator (appears above CMS List element on canvas):**
- `height: 28px; padding: 0 8px; border-radius: 6px; background: rgba(99,102,241,0.9); color: #FFFFFF`
- `font: 11px Inter; font-weight: 500`
- Layout: `[← prev] "Record 1 of 24" [next →]`
- Arrow buttons: `width: 20px; height: 20px; border-radius: 4px; background: rgba(255,255,255,0.15)`. Hover: `background: rgba(255,255,255,0.25)`
- Disabled at bounds (Record 1 → prev disabled; Record N → next disabled)

**Canvas rendering:**
- CMS List element shows data from the selected record
- Text elements with bindings show actual record text content
- Image elements with bindings show actual record image
- Unbound elements render normally
- Subtle CMS badge on each bound element: `"CMS"` pill — `font: 8px Inter; font-weight: 700; background: rgba(99,102,241,0.2); color: #6366f1; padding: 1px 4px; border-radius: 2px; position: absolute; top: -12px; right: 0`

### 1.5 CMS Contract (Non-Negotiable)

From §5H:

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| CollectionManager | Define schema with fields (14 types: text, textarea, richtext, number, date, datetime, boolean, select, multiselect, image, file, reference, color, url, email), manage records. **Engine-only — no UI entry points exist.** |
| StyleDataBinding | Bind CMS data → element CSS style properties |
| TraitDataBinding | Bind CMS data → element HTML attributes |
| TextDataBinding | Bind CMS data → element text content |
| Collection Setup modal | Field definition UI with add/remove, field type selection, required toggle |
| Binding flow | Chain icon on inspector fields → collection/field picker → live preview with first record |
| CMS Preview | "Viewing record 1/N" indicator, arrow to cycle through records |

---

## 2. Collaboration Surfaces

> Source: §13.1–13.5, §5I, §30 AR23, Output E §E.6 (A3–A5)

### 2.1 Presence in Top Bar

**Avatar stack (right side of top bar):**

- `display: flex; flex-direction: row-reverse` (newest on left, stack overlaps right)
- Max 4 avatars visible + overflow count badge (maxVisible = 4 in PresenceIndicators.tsx)
- Avatar overlap: each avatar offset `-8px` from the next (overlapping)

**Each avatar:**
- `width: 28px; height: 28px; border-radius: 50%`
- `border: 2px solid var(--aqb-surface-1)` (creates ring gap between overlapping avatars)
- Content: user's first initial, centered — `font: 11px Inter; font-weight: 700; color: #FFFFFF`
- Background: unique color per user from palette:
  - User 1: `#6366f1` (indigo)
  - User 2: `#ec4899` (pink)
  - User 3: `#14b8a6` (teal)
  - User 4: `#f59e0b` (amber)
  - User 5+: `#8b5cf6` (purple), cycling
- If user has profile image: shows image instead of initial, `object-fit: cover`
- Online indicator: `width: 8px; height: 8px; border-radius: 50%; background: #22c55e; border: 1.5px solid var(--aqb-surface-1); position: absolute; bottom: -1px; right: -1px`

**Overflow badge (when > 4 users):**
- `width: 28px; height: 28px; border-radius: 50%; background: var(--aqb-surface-3); border: 2px solid var(--aqb-surface-1)`
- `font: 10px Inter; font-weight: 600; color: #B8B5AD; text-align: center; line-height: 24px`
- Shows `"+2"`, `"+5"`, etc.
- Click → dropdown with full user list: each row shows avatar + name + current activity

**Hover tooltip (per avatar):**
- `background: var(--aqb-surface-5); border-radius: 6px; padding: 8px 12px; shadow: var(--aqb-shadow-sm)`
- Line 1: `"Sarah Chen"` — `font: 12px Inter; font-weight: 600; color: #F5F5F0`
- Line 2: `"Editing Hero Section"` — `font: 11px Inter; color: #B8B5AD`
- Arrow pointing to avatar

### 2.2 Live Cursors on Canvas

**Cursor shape:**
- SVG arrow pointer: `18×24px`, filled with user's color (same palette as avatar)
- Drop shadow: `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3))`
- Tip of arrow = exact cursor position

**Name label (attached to cursor):**
- Position: `8px` right and `20px` below cursor tip
- `font: 10px Inter; font-weight: 600; color: #FFFFFF`
- `background: [user-color]; padding: 2px 6px; border-radius: 3px`
- `white-space: nowrap; pointer-events: none`

**Fade behavior:**
- Active: cursor fully visible (`opacity: 1`)
- Idle (no movement for 3s): fade to `opacity: 0.4` over `500ms ease`
- Idle (no movement for 10s): fade to `opacity: 0` over `500ms ease` (cursor hidden)
- Movement resumes: instant return to `opacity: 1`
- User disconnects: cursor fades out over `300ms` then removed from DOM

**Broadcast:** `useCursorSync` sends `{x, y, userId}` on `mousemove`, throttled to 50ms (~20fps) per `throttleMs = 50` in useCursorSync.ts.

### 2.3 Selection Awareness

**When another user has an element selected:**
- Element outline: `2px solid [user-color]` (not indigo — that's reserved for local selection)
- Name badge above element: `font: 10px Inter; font-weight: 600; color: #FFFFFF; background: [user-color]; padding: 1px 6px; border-radius: 3px`
- Badge position: top-left corner of element, offset `0, -16px`
- If both local user and remote user select same element: local indigo outline takes priority on the element; remote user's name badge still visible but positioned further above

**When another user is inline editing:**
- Element outline: `2px solid [user-color]` with animated `stroke-dasharray` (marching ants effect)
- Badge shows: `"Sarah editing..."` with typing indicator animation (3 dots)

### 2.4 Conflict Resolution

**OT (Operational Transform) resolves automatically — no user action required.**

**Toast notification on conflict:**
- Variant: `info` (blue-tinted)
- Message: `"Your change was rebased to sync with Sarah's edit"`
- Duration: `5000ms` (longer than default 3000ms for user to read)
- Icon: Lucide `git-merge`, 16px
- No action required — dismiss or auto-dismiss

**Edge case — concurrent delete:**
- If another user deletes an element you're currently editing:
- Toast variant: `warning` (amber)
- Message: `"[Element type] was deleted by Sarah. Your changes were discarded."`
- Inspector: returns to IS-1 (empty state)
- Canvas: element removed

**Edge case — concurrent style conflict:**
- OT picks the later-timestamped change (last-writer-wins for same property on same element)
- No toast unless local user's change was overwritten — then info toast shown

### 2.5 Connection Quality

**ConnectionQualityIndicator (in top bar, near sync/save status dot):**

| State | Dot Color | Tooltip | Condition |
|-------|-----------|---------|-----------|
| Excellent | `#22c55e` (green) | "Connection quality: Excellent" | Best quality |
| Good | `#f59e0b` (yellow) | "Connection quality: Good" | Acceptable quality |
| Poor | `#ef4444` (red) | "Connection quality: Poor" | Degraded quality |
| Disconnected | `#6b7280` (gray) | "Disconnected" | No connection |

**Note:** ConnectionQualityIndicator.tsx uses `ConnectionQuality` type: `"excellent" | "good" | "poor" | "disconnected"`. Component renders only when connected (`if (!isConnected) return null`).

- Dot size: `8×8px; border-radius: 50%`
- Position: immediately right of save status indicator in top bar
- Pulsing animation on Degraded/Poor: `animation: pulse 2s ease-in-out infinite` (opacity cycles 0.5–1.0)
- Click on dot → popover with: latency value (ms), last sync time, "Reconnect" button (if Poor/Offline)

### 2.6 Collaboration Contract (Non-Negotiable)

From §5I:

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| PresenceIndicators | User avatars in top bar, max 4 shown (maxVisible=4) + "+N" overflow, hover shows name + current action |
| ConnectionQualityIndicator | Green/yellow/red/gray dot near sync dot, states: excellent/good/poor/disconnected. Only renders when connected. |
| Cursor broadcast | useCursorSync — other users' cursors shown as colored arrows with name label on canvas |
| Selection awareness | Other users' selected elements show colored outline (their color) + name above |
| OT conflict resolution | Automatic via CollaborationManager; toast "Your change was rebased to sync with [User]'s edit" |

---

## 3. AI Surfaces

> Source: §14.1–14.4, §5J, §30 AR6, Output E §E.6 (A6–A8)

### 3.1 AIAssistantBar (Ctrl+J)

**Trigger:** Ctrl+J keyboard shortcut, or click AI button (Lucide `sparkles`) in top bar.

**Container:**
- Slides up from bottom of canvas area (above canvas footer toolbar)
- `height: 56px; width: calc(100% - 32px); max-width: 720px; margin: 0 auto`
- `background: var(--aqb-surface-2)` (`#16161d`)
- `border: 1px solid rgba(99,102,241,0.25)`
- `border-radius: 12px 12px 0 0`
- `shadow: 0 -4px 20px rgba(0,0,0,0.3)`
- `padding: 0 12px`
- `display: flex; align-items: center; gap: 8px`
- `z-index: 500`
- Entry animation: `translateY(100%)` → `translateY(0)`, `200ms ease-out`
- Exit animation: reverse, `150ms ease-in`

**Layout:**

```
┌──────────────────────────────────────────────────────────────────┐
│ [✨]  [Prompt input...                              ] [Gen] [×] │
│  AI    placeholder varies by context                   btn  btn │
└──────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| AI icon | Lucide `sparkles`, `20×20px`, `color: #818cf8`. Animated: slow pulse `opacity: 0.7 ↔ 1.0` at `2s ease-in-out infinite` |
| Prompt input | `flex: 1; height: 36px; border-radius: 8px; background: var(--aqb-surface-3); border: 1px solid var(--aqb-border); padding: 0 12px; font: 13px Inter; color: #F5F5F0`. Focus: `border-color: rgba(99,102,241,0.5)` |
| Generate button | `height: 36px; padding: 0 16px; border-radius: 8px; background: var(--aqb-primary); color: #FFFFFF; font: 13px Inter; font-weight: 600`. Hover: `background: var(--aqb-primary-hover)`. Disabled when input empty |
| Close button | Lucide `x`, 16px, `color: #908D85`. `width: 28px; height: 28px; border-radius: 6px`. Hover: `background: var(--aqb-surface-3)` |

**Contextual behavior:**

| Context | Placeholder text | Quick suggestions (chips below input) |
|---------|-----------------|--------------------------------------|
| No element selected | "Describe what you want to build..." | "Add a hero section", "Create a contact form", "Design a pricing table" |
| Text element selected | "Describe changes for this text..." | "Rewrite text", "Make more concise", "Translate to Spanish" |
| Image element selected | "Describe changes for this image..." | "Suggest alt text", "Resize for hero", "Add caption" |
| Container/Section selected | "Describe layout changes..." | "Improve layout", "Make responsive", "Add animation" |
| Multiple elements selected | "Describe changes for [N] elements..." | "Align elements", "Apply consistent styling", "Create component" |

**Quick suggestion chips:**
- Appear in a second row below input when bar first opens, `height: 28px`
- `display: flex; gap: 6px; padding: 4px 12px 8px 44px` (left-padded past AI icon)
- Each chip: `height: 24px; padding: 0 10px; border-radius: 12px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); font: 11px Inter; color: #818cf8; cursor: pointer; white-space: nowrap`
- Click chip → fills input with chip text and auto-submits
- Chips hidden once user starts typing

**States:**

| State | Visual change |
|-------|--------------|
| Idle | Default layout above |
| Generating | Generate button → `"Generating..."` with spinner (Lucide `loader-2` spinning). Input disabled. `border-color: rgba(99,102,241,0.4)` pulsing |
| Result ready | Bar expands to `height: auto; max-height: 200px`. Shows result preview + action buttons below input |
| Error | Bar border: `border-color: rgba(239,68,68,0.4)`. Message: `"AI couldn't generate a result. Try rephrasing."` in `color: #ef4444; font: 12px Inter` |

**Result state layout (expanded):**

```
┌──────────────────────────────────────────────────────────────────┐
│ [✨]  [Your prompt text here                        ] [Gen] [×] │
│─────────────────────────────────────────────────────────────────│
│ "Preview applied to canvas"        [Apply ✓] [Reject ✗] [Edit] │
│ font: 12px Inter; color: #B8B5AD   primary    ghost     ghost   │
└──────────────────────────────────────────────────────────────────┘
```

- Canvas shows result as overlay (element changes highlighted with `rgba(99,102,241,0.1)` background)
- Apply: commits changes → toast "AI changes applied" + [Undo] → bar closes
- Reject: reverts preview → bar returns to idle
- Edit: puts result description back in input for refinement

### 3.2 AI Copilot Modal

**Trigger:** Ctrl+J keyboard shortcut (same as AIAssistantBar — both share the AI toggle). **Note:** There is NO overflow menu in the top bar and NO Ctrl+Shift+J shortcut. The AICopilot component (`src/ai/AICopilot.tsx`) is rendered via StudioModals.tsx when `showCopilot` is true.

**Modal container:**
- `width: 640px; max-height: 85vh`
- `background: var(--aqb-surface-1)` (`#0f0f14`)
- `border: 1px solid rgba(99,102,241,0.2)`
- `border-radius: 16px`
- `shadow: var(--aqb-shadow-xl)` (`0 16px 40px rgba(0,0,0,0.4)`)
- Backdrop: `background: rgba(0,0,0,0.6); backdrop-filter: blur(4px)`
- Entry: `opacity: 0; scale: 0.96` → `opacity: 1; scale: 1`, `200ms ease-out`

**Layout (idle state):**

```
┌──────────────────────────────────────────────────────┐
│                                              [× close]│
│                                                       │
│         [sparkles icon, 40px, #818cf8]                │
│                                                       │
│         "What would you like to build?"               │  font: 22px Inter; weight: 700; color: #F5F5F0
│         "Describe your page or section and            │  font: 14px Inter; color: #B8B5AD
│          AI will generate it for you."                │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │                                               │   │  textarea: min-height: 100px; max-height: 200px
│  │ "A modern SaaS landing page with a hero      │   │  font: 14px Inter; color: #F5F5F0
│  │  section, features grid, testimonials..."     │   │  background: var(--aqb-surface-3)
│  │                                               │   │  border: 1px solid var(--aqb-border)
│  └───────────────────────────────────────────────┘   │  border-radius: 8px; padding: 12px
│                                                       │
│  TEMPLATES                                            │  section label
│  [Landing Page] [About] [Portfolio] [E-commerce]     │  chips, same style as §3.1
│  [Blog] [Contact] [Pricing] [Team]                   │  click → fills textarea
│                                                       │
│  ┌─────────────────────┐ ┌─────────────────────┐    │
│  │  Generate Full Page │ │  Generate Section   │    │
│  └─────────────────────┘ └─────────────────────┘    │
│   primary, h: 44px          ghost, h: 44px          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Generating state:**
- Textarea disabled, buttons disabled
- Center of modal: animated progress indicator
  - `[sparkles icon spinning] "Building your page..."` — `font: 16px Inter; weight: 500; color: #B8B5AD`
  - Progress bar below: `width: 80%; height: 4px; border-radius: 2px; background: var(--aqb-surface-4)`. Fill: `background: var(--aqb-primary); animation: progress-indeterminate 2s ease-in-out infinite`
  - Sub-text cycles: "Generating structure..." → "Adding content..." → "Applying styles..." (every 3s)

**Result state:**
- Modal content replaced with preview:
  - Scaled-down iframe preview of generated page: `width: 100%; height: 400px; border-radius: 8px; border: 1px solid var(--aqb-border)`
  - Action buttons below preview:

```
  [Accept and replace page]    [Accept as new page]    [Reject]
   destructive (replaces        primary button          ghost button
   current page content)
```

- "Accept and replace page" → ConfirmDialog: `"Replace current page? Your current content will be saved as a version."` → [Replace] + [Cancel]
- "Accept as new page" → creates new page in Pages tab with generated content → navigates to it
- "Reject" → returns modal to idle state, clears textarea

### 3.3 AI Suggestions in Inspector (standalone section, bottom of Inspector)

**Note:** AISuggestionSection is NOT inside the Effects tab. It is rendered as a standalone section at the bottom of the entire Inspector panel, across all tabs. The Effects tab has exactly 4 sections (Effects, Animation, Interactions, Visibility) — no 5th AI section. Summary of layout:

- Section header: `"AI SUGGESTIONS"` (accordion label, same style as other sections)
- Context line: `"Based on your [element type]:"` — `font: 12px Inter; color: #B8B5AD`
- 3 suggestion cards, stacked vertically, `gap: 4px`
- Each card: `height: 36px; padding: 0 12px; border-radius: 6px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.12)`
  - Left: Lucide `sparkles` 12px `#818cf8` + suggestion text `font: 12px Inter; color: #B8B5AD`
  - Right: `[Apply]` ghost button `font: 11px Inter; font-weight: 600; color: #6366f1`
- Regenerate button: full width, ghost, `"↻ New suggestions"` — refreshes AI analysis
- Loading state: 3 shimmer skeleton rows (same height/width as suggestion cards)
- Error: `"Suggestions unavailable"` message + retry button

### 3.4 AI Modules (Engine Layer — No Direct UI)

| Module | UI Surface | Engine Class | Input | Output |
|--------|-----------|-------------|-------|--------|
| PageGenerator | Copilot modal (§3.2) | `AIPageGenerator` | Text prompt + optional template hint | Full page HTML structure + inline styles |
| ContentWriter | AIAssistantBar (§3.1), text context | `AIContentWriter` | Selected text + user instruction | Replacement text content |
| LayoutAnalyzer | AI Suggestions (§3.3) | `AILayoutAnalyzer` | Selected element + context (parent, siblings) | Array of style improvement suggestions |
| CodeGenerator | Export modal (§5.1) for React/Vue/Next.js | `AICodeGenerator` | Full page HTML + styles | Framework-specific component code |

- All modules are engine-layer (`src/engine/ai/`). No direct user surface.
- Components import via `composer.ai.[module].[method]()` (access path unverified at runtime)
- All AI calls are async with timeout (30s default). On timeout → error state in corresponding UI surface.
- AI unavailable fallback: if AI service returns 503, all AI surfaces show `"AI temporarily unavailable"` state with muted icon and retry button. Surfaces remain visible but disabled.

### 3.5 AI Contract (Non-Negotiable)

From §5J:

| Component | Must-Preserve Capability |
|-----------|-------------------------|
| AIAssistantBar (Ctrl+J) | Bottom bar slide-up, prompt input, context pre-fill when element selected, Generate/Clear/Close, result preview with Apply/Reject |
| Copilot modal | Full-screen, prompt textarea, template suggestions, Generate Full Page/Generate Section, preview with Accept/Reject |
| AI Suggestions | Inspector standalone section (bottom of panel, across all tabs — NOT inside Effects tab), context-aware suggestions based on element type, Regenerate button |
| LayoutAnalyzer | Engine-layer module — analyzes page layout for AI suggestions |
| CodeGenerator | Engine-layer module — generates framework code from designs (Export) |
| ContentWriter | Engine-layer module — AI text generation and rewriting |
| PageGenerator | Engine-layer module — generates full page HTML from prompts |

---

## 4. Version History Surfaces

> Source: §15.1–15.4, §9.14 (cross-ref), §30 AR10, Output E §E.2 (S19–S20)

Cross-reference: History tab sidebar panel design is fully specified in Part 3 (sidebar tabs). This section documents the restore and compare flows in detail.

### 4.1 History Tab — Versions View

**Named versions section:**
- Section header: `"NAMED VERSIONS"` — standard section label style (accordion pattern)
- "Save current version" button: Lucide `plus`, ghost button, full width, `height: 32px`
  - Click → inline dialog within panel:
    - `"Version name:"` label + text input (`height: 32px; font: 13px Inter; placeholder: "e.g., v1.2 — header redesign"`)
    - `[Save]` primary mini + `[Cancel]` ghost mini, `height: 28px`
    - Validation: name required, max 64 chars

**Each version row:**
- `height: 48px; padding: 8px 12px; border-radius: 6px; display: flex; align-items: center; gap: 8px`
- Left: Lucide `bookmark`, 16px, `color: #6366f1`
- Content: version name (`font: 13px Inter; font-weight: 500; color: #F5F5F0`) + date line (`font: 11px Inter; color: #908D85; "Mar 12, 2026 at 2:45 PM"`)
- "Current" badge on latest: `font: 9px Inter; font-weight: 700; text-transform: uppercase; background: rgba(34,197,94,0.15); color: #22c55e; padding: 1px 6px; border-radius: 3px`
- Hover: `background: var(--aqb-surface-3)` + action buttons appear:
  - `[Restore]` ghost mini — `font: 11px Inter; color: #6366f1; height: 24px; padding: 0 8px; border-radius: 4px`
  - `[Compare]` ghost mini — same spec

**Auto-saves section:**
- Collapsible accordion: `"AUTO-SAVES"` header with chevron
- Default: collapsed
- Each row: `height: 40px; padding: 4px 12px`
  - Left: Lucide `clock`, 14px, `color: #908D85`
  - Content: `"Auto-save"` + relative timestamp (`"2m ago"`, `"1h ago"`)
  - Hover: `[Restore]` button appears (no Compare for auto-saves)

### 4.2 Restore Flow

1. User clicks `[Restore]` on version or auto-save row
2. ConfirmDialog modal appears:
   - Title: `"Restore to [version name]?"` (or `"Restore to auto-save from [timestamp]?"`)
   - Body: `"Your current changes will be saved as an auto-save first. You can always go back."`
   - Buttons: `[Restore]` primary + `[Cancel]` ghost
3. On confirm:
   - Current state auto-saved (new auto-save entry created in History)
   - Canvas transitions: brief overlay (`150ms`, `background: rgba(0,0,0,0.3)`) then content swaps
   - Canvas loads restored state
   - Toast: `"Restored to [version name]"` — success variant, with `[Undo]` action button (restores back to the auto-save just created)
   - Inspector resets to IS-1 (no selection)
   - History tab: restored version now marked with `"Current"` badge

### 4.3 Compare Flow

1. User clicks `[Compare]` on version A row
2. Version row highlights in indigo: `background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25)`
3. History tab shows instruction: `"Select another version to compare"` — `font: 12px Inter; color: #818cf8`
4. User clicks another version row (version B)
5. Canvas enters comparison mode:

**Comparison view:**
- Canvas splits into two columns:
  - Left: `"Version A — [name]"` header badge, shows version A content
  - Right: `"Version B — [name]"` header badge, shows version B content
  - Divider: `2px solid var(--aqb-border); cursor: ew-resize` (draggable to resize panes)
- Changed elements highlighted: `outline: 2px solid #f59e0b; background: rgba(245,158,11,0.05)` (amber)
- Added elements (in B but not A): `outline: 2px solid #22c55e; background: rgba(34,197,94,0.05)` (green)
- Removed elements (in A but not B): `outline: 2px solid #ef4444; background: rgba(239,68,68,0.05)` (red)
- Change count badge in footer: `"[N] changes between versions"` — `font: 12px Inter; color: #B8B5AD`
- `[Close Comparison]` button in canvas footer: `height: 32px; padding: 0 16px; border-radius: 6px; background: var(--aqb-surface-2); font: 12px Inter; color: #F5F5F0`
- `[Restore Version A]` and `[Restore Version B]` buttons available

6. Click `[Close Comparison]` → canvas returns to current state, normal editing resumes

### 4.4 History Tab — Activity View

**Search:** `"Search activity..."` — `height: 32px; font: 12px Inter` — filters timeline by action description text

**Timeline entries (each):**
- `min-height: 40px; padding: 8px 12px; border-left: 2px solid var(--aqb-border-subtle); margin-left: 12px`
- Timeline dot: `width: 8px; height: 8px; border-radius: 50%; position: absolute; left: -5px` — color varies by action type
- Content: `"You [action] '[element name]' [detail]"` — `font: 12px Inter; color: #B8B5AD`
- Timestamp: `"2m ago"` — `font: 10px Inter; color: #5a584f`
- Click on entry: selects/highlights the affected element on canvas (if still exists)

**Action type icons and colors:**

| Action | Icon (Lucide) | Dot color |
|--------|--------------|-----------|
| Add element | `plus-circle` | `#22c55e` |
| Delete element | `trash-2` | `#ef4444` |
| Move element | `move` | `#6366f1` |
| Style change | `paintbrush` | `#8b5cf6` |
| Text edit | `type` | `#14b8a6` |
| Duplicate | `copy` | `#6366f1` |
| Resize | `maximize-2` | `#f59e0b` |

---

## 5. Export and Publish Surfaces

> Source: §16.1–16.3, §30 AR11, Output E §E.5 (M4)

### 5.1 Export Modal (Ctrl+Shift+E)

**Trigger:** Ctrl+Shift+E, or Settings → Export sub-screen → "Export" button. **Note:** There is NO "top bar overflow → Export" path — no overflow menu exists in the top bar.

**Modal container:**
- `width: 480px; max-height: 80vh`
- `background: var(--aqb-surface-1)`; `border: 1px solid var(--aqb-border)`; `border-radius: 12px`; `shadow: var(--aqb-shadow-xl)`
- `padding: 0`

**Layout:**

```
┌──────────────────────────────────────────────┐
│ HEADER                              [× close] │  padding: 20px 24px
│ "Export your site"                            │  font: 18px Inter; weight: 600; color: #F5F5F0
│ "Download your site files or get notified    │  font: 13px Inter; color: #B8B5AD
│  when new formats launch."                   │
├──────────────────────────────────────────────┤
│ FORMAT CARDS                     padding: 24px│
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [file-code icon]  HTML + CSS             │ │  card: bg var(--aqb-surface-2); border-radius: 8px
│ │                   "Multi-page, minified" │ │  padding: 16px; border: 1px solid var(--aqb-border)
│ │                   ● Available now        │ │  "Available" badge: green
│ │                                          │ │
│ │ Pages to export:                         │ │  checkbox list of all pages
│ │ [✓] Homepage                             │ │  default: all checked
│ │ [✓] About                               │ │
│ │ [✓] Contact                              │ │
│ │                                          │ │
│ │ [Download HTML + CSS ↓]     primary btn  │ │  full width within card
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [component icon]  React                  │ │  card: same style but dimmed
│ │                   "Component-based"      │ │  opacity: 0.7
│ │                   ○ Coming Soon          │ │  "Coming Soon" badge: amber
│ │ [Notify me →]              ghost btn     │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [component icon]  Vue                    │ │  same dim style
│ │                   ○ Coming Soon          │ │
│ │ [Notify me →]                            │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [hexagon icon]    Next.js                │ │
│ │                   ○ Coming Soon          │ │
│ │ [Notify me →]                            │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ [archive icon]    ZIP Bundle             │ │
│ │                   "All assets + HTML"    │ │
│ │                   ○ Coming Soon          │ │
│ │ [Notify me →]                            │ │
│ └──────────────────────────────────────────┘ │
│                                               │
└──────────────────────────────────────────────┘
```

**Format card spec:**
- Available format: `background: var(--aqb-surface-2); border: 1px solid var(--aqb-border); border-radius: 8px; padding: 16px; margin-bottom: 8px`
- Coming soon format: same but `opacity: 0.65`
- Icon: Lucide, `24×24px`, `color: #B8B5AD`
- Format name: `font: 14px Inter; font-weight: 600; color: #F5F5F0`
- Description: `font: 12px Inter; color: #908D85`
- Badge "Available now": `font: 10px Inter; font-weight: 600; background: rgba(34,197,94,0.15); color: #22c55e; padding: 1px 6px; border-radius: 3px`
- Badge "Coming Soon": `font: 10px Inter; font-weight: 600; background: rgba(245,158,11,0.15); color: #f59e0b; padding: 1px 6px; border-radius: 3px`

**"Notify me" flow:**
- Click → button transforms to email input inline: `[email input] [Submit]`
- Email input: `height: 32px; font: 12px Inter; placeholder: "your@email.com"`
- Submit → button shows `"✓ Subscribed!"` for 2s → reverts to `"Notify me"` with check icon
- Data sent to `NotificationService.subscribe(email, format)`

**Download flow:**
1. Click `[Download HTML + CSS]`
2. Button → loading state: `"Preparing download..."` with Lucide `loader-2` spinning
3. `ExportEngine.exportAllPages()` called
4. Browser auto-downloads ZIP file
5. Button → success state: `"✓ Download complete"` for 3s → reverts to default
6. Toast: `"Download complete — [filename].zip"` — success variant

### 5.2 Publish Tab

Full design in Part 3 (sidebar Publish tab — §9.12). No additional spec needed here.

### 5.3 Preview (Ctrl+P)

**Trigger:** Ctrl+P, or top bar "Preview" button (Lucide `eye`).

**Behavior:**
1. `composer.exportHTML().combined` generates full HTML string
2. HTML is written to a Blob URL: `URL.createObjectURL(new Blob([html], { type: 'text/html' }))`
3. `window.open(blobUrl, '_blank')` opens new browser tab
4. Toast in editor: `"Preview opened in new tab"` — info variant, `3000ms`

**Preview tab contents:**
- Full page rendered as it would appear published
- No editor UI visible
- URL bar shows blob URL (or `about:blank` in some browsers)
- Responsive: renders at browser window width (user can resize to test breakpoints)

**If export fails:**
- Toast: `"Preview failed — could not generate HTML. Check for errors."` — error variant
- No tab opened

---

## 6. Command Palette

> Source: §17.1, §30 AR22, Output E §E.5 (M1)

### 6.1 Command Palette (Ctrl+K)

**Trigger:** Ctrl+K (or Cmd+K on macOS). Always available regardless of current panel/modal state.

**Overlay:**
- Backdrop: `background: rgba(0,0,0,0.5); backdrop-filter: blur(2px)`
- `z-index: 4000` (Z_LAYERS.modal — above all other UI)
- Click backdrop → close palette

**Container:**
- `width: 520px; max-height: 60vh`
- `position: fixed; top: 20%; left: 50%; transform: translateX(-50%)`
- `background: var(--aqb-surface-1)` (`#0f0f14`)
- `border: 1px solid var(--aqb-border-light)` (`rgba(255,255,255,0.12)`)
- `border-radius: 12px`
- `shadow: var(--aqb-shadow-xl)`
- `overflow: hidden; display: flex; flex-direction: column`
- Entry: `opacity: 0; translateY(-8px)` → `opacity: 1; translateY(0)`, `150ms ease-out`

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│ SEARCH BAR                                    h: 52px│
│ [🔍] [Search commands, elements, pages...] [⌘K] [×]  │
├──────────────────────────────────────────────────────┤
│ RESULTS (scrollable)                   max-h: ~400px│
│                                                      │
│ EDIT                                    group header │
│ [↩ icon]      Undo                      Ctrl+Z       │
│ [↪ icon]      Redo                      Ctrl+Y       │
│ [copy icon]   Duplicate                 Ctrl+D       │
│ [trash icon]  Delete                     Del          │
│                                                      │
│ SELECTION                               group header │
│ [select-all]  Select All                 Ctrl+A       │
│               Deselect All               Escape       │
│                                                      │
│ VIEW                                    group header │
│ [+ icon]      Zoom In                   Ctrl+=       │
│ [- icon]      Zoom Out                  Ctrl+-       │
│ [maximize]    Zoom to Fit               —            │
│                                                      │
│ ADD                                     group header │
│               Add Text                   —            │
│               Add Image                  —            │
│               Add Button                 —            │
│               Add Container              —            │
│                                                      │
│ NAVIGATE                                group header │
│ [layout icon] Browse Templates           T            │
│               Open Analytics             —            │
│               Open SEO                   —            │
│               Open Export                —            │
│               Open Integrations          —            │
│               Toggle Layers              Z            │
│               Preview Site               Ctrl+P       │

NOTE: Actual command groups from useCanvasCommandPalette.ts are:
Edit, Selection, View, Add, Navigate. There are NO "RECENT",
"AI", or "EXPORT" groups. AI commands (Ctrl+J) and export
(Ctrl+Shift+E) are NOT accessible from the palette.
Search is simple substring match (not fuzzy), with no debounce.
└──────────────────────────────────────────────────────┘
```

**Search input:**
- `height: 52px; padding: 0 16px; font: 16px Inter; color: #F5F5F0; background: transparent; border: none; border-bottom: 1px solid var(--aqb-border)`
- Search icon: Lucide `search`, 18px, `color: #908D85`, left side
- Shortcut badge: `"⌘K"` — `font: 10px JetBrains Mono; color: #5a584f; background: var(--aqb-surface-3); padding: 2px 6px; border-radius: 3px` — right side
- Close button: Lucide `x`, 16px, rightmost
- Placeholder: `"Search commands, elements, pages..."` — `color: #5a584f`
- Auto-focused on open

**Search behavior:**
- Substring match (`searchText.includes(lowerQuery)`) — NOT fuzzy match
- Results update on each keystroke (no debounce — instant)
- Empty query: shows all groups (no RECENT group exists)
- With query: shows only matching commands, grouped, with match highlighted in `color: #6366f1; font-weight: 600`
- No results: `"No commands found for '[query]'"` — `font: 13px Inter; color: #908D85; text-align: center; padding: 32px`

**Group header:**
- `height: 28px; padding: 0 16px; font: 10px Inter; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #5a584f`
- Not selectable/focusable

**Each result row:**
- `height: 40px; padding: 0 16px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 0`
- Icon: Lucide, 16px, `color: #908D85`
- Label: `font: 13px Inter; font-weight: 400; color: #F5F5F0; flex: 1`
- Shortcut: `font: 11px JetBrains Mono; color: #5a584f`
- Hover: `background: var(--aqb-surface-3)`
- Active/focused (keyboard): `background: rgba(99,102,241,0.12); outline: none`
- Click or Enter: execute command → close palette

**Keyboard navigation:**
- Arrow Down: move focus to next result (wraps to top)
- Arrow Up: move focus to previous result (wraps to bottom)
- Enter: execute focused command
- Escape: close palette (focus returns to previously focused element)
- Tab: not used (Arrow keys only for navigation within palette)

---

## 7. Keyboard Cheat Sheet

> Source: §17.2, §30 AR7, Output E §E.5 (M2)

### 7.1 Keyboard Cheat Sheet (?)

**Trigger:** `?` key (when no input is focused), Ctrl+/ (also triggers it), or canvas footer help button `[?]`.

**Modal container:**
- `width: 640px; max-height: 60vh` (KeyboardShortcutsPanel.tsx uses 60vh, not 80vh)
- `background: var(--aqb-surface-1); border: 1px solid var(--aqb-border); border-radius: 12px; shadow: var(--aqb-shadow-xl)`
- `overflow-y: auto`

**Layout:**

```
┌──────────────────────────────────────────────────────────┐
│ "Keyboard Shortcuts"                          [× close]  │  font: 18px Inter; weight: 600; padding: 20px 24px
├──────────────────────────────────────────────────────────┤
│ Two-column layout, each column 50%             gap: 24px │
│                                                          │
│ COLUMN 1                    │ COLUMN 2                   │
│                             │                            │
│ GENERAL                     │ VIEW                       │
│ Save          Ctrl+S        │ Zoom In         Ctrl+=     │
│ Undo          Ctrl+Z        │ Zoom Out        Ctrl+-     │
│ Redo          Ctrl+Y        │ Reset Zoom      Ctrl+0     │
│ Preview       Ctrl+P        │ Desktop View    Ctrl+1     │
│ Deselect      Escape        │ Tablet View     Ctrl+2     │
│                             │ Mobile View     Ctrl+3     │
│ EDIT                        │                            │
│ Copy          Ctrl+C        │ PANELS                     │
│ Cut           Ctrl+X        │ Open Templates  T          │
│ Paste         Ctrl+V        │ Open Exporter   Ctrl+Shift+E│
│ Duplicate     Ctrl+D        │ Open AI         Ctrl+J     │
│ Delete        Del           │ Component View  Shift+A    │
│ Select All    Ctrl+A        │                            │

NOTE: Actual categories from KeyboardShortcutsPanel.tsx are:
General, Edit, View, Panels. NOT: EDITING, CANVAS, NAVIGATION,
ZOOM, ADVANCED. There is NO "Ctrl+Shift+J" shortcut for AI Copilot.
└──────────────────────────────────────────────────────────┘
```

**Category header:** `font: 10px Inter; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #908D85; margin-bottom: 8px; margin-top: 20px` (first category: `margin-top: 0`)

**Each shortcut row:**
- `height: 28px; display: flex; justify-content: space-between; align-items: center; padding: 0 12px`
- Action label: `font: 13px Inter; color: #B8B5AD`
- Shortcut keys: `font: 11px JetBrains Mono; color: #908D85`
- Each key in shortcut rendered as keyboard badge: `background: var(--aqb-surface-3); padding: 2px 6px; border-radius: 3px; border: 1px solid var(--aqb-border); font: 10px JetBrains Mono; font-weight: 600; color: #908D85`
- Multiple keys: separated by `+` character between badges

---

## 8. Advanced Modals Catalog

> Source: §5F

All 13+ modal types preserved:

| # | Modal | Trigger | File |
|---|-------|---------|------|
| 1 | TemplateLibrary | Ctrl+Shift+T / Templates tab | StudioModals.tsx |
| 2 | SaveTemplate | Internal (Build tab / context menu) | StudioModals.tsx |
| 3 | ExportModal | Ctrl+Shift+E | StudioModals.tsx |
| 4 | AIAssistant (AIAssistantBar) | Ctrl+J | StudioModals.tsx |
| 5 | AICopilot | Ctrl+J (keyboard — NO overflow menu exists) | StudioModals.tsx |
| 6 | KeyboardShortcutsPanel | ? / Ctrl+/ | StudioModals.tsx |
| 7 | MediaLibraryPanel | Inspector background prop / media context | StudioModals.tsx |
| 8 | ImageEditorModal | Internal (from Media) | StudioModals.tsx |
| 9 | IconPickerModal | Inspector icon prop | StudioModals.tsx |
| 10 | CollectionSetupModal | CMS element | StudioModals.tsx |
| 11 | ConflictModal | Collaboration conflict | StudioModals.tsx |
| 12 | CreateComponentModal | Context menu on canvas | StudioModals.tsx |
| 13 | ProjectSettingsModal | Logo click in top bar | StudioModals.tsx |

**Note:** The doc previously listed "Upgrade Modal" — this does NOT exist in StudioModals.tsx. ConflictModal (collaboration conflicts) exists instead.

**Non-negotiable:** All 13 modals must have visible trigger paths. No modal can be removed or merged with another.

---

## 9. Onboarding Flow

> Source: §5G, §18.1, §30 AR13, Output E §E.7

### 9.1 Components

| Component | Behavior |
|-----------|---------|
| WelcomeModal | First visit only (phase=active, completedCount=0). Two CTAs: "Browse Templates" (opens Templates tab) and "Start Blank" (dismisses modal, canvas ready). |
| OnboardingChecklist | Floating panel with **7 steps** (not 5): name-project, pick-start, add-element, edit-text, change-style, preview, publish. Steps auto-complete via Composer events. Minimize/Restore toggle. Dismiss (skipAll). |
| SpotlightOverlay | Dims everything except step target via box-shadow cutout. Uses `pointerEvents: "none"` — purely visual overlay with no text or interactive elements. **No "Explore freely →" escape link exists** — escape is via pointer passthrough. |
| AchievementPrompt | Fires on each step completion. Celebratory micro-animation. |

### 9.2 New User First Session Flow (target: < 10 min to publish)

| Step | User Action | UI Surface | Result | Onboarding Step |
|------|------------|-----------|--------|----------------|
| 1 | First visit → editor loads | WelcomeModal | Modal: `"Welcome to Buildrik!"` with name input + `[Browse Templates]` primary + `[Start Blank]` ghost | — |
| 2 | Clicks `[Browse Templates]` | Templates tab opens in sidebar | Template grid visible, 12+ templates with category pills | — |
| 3 | Clicks template card → preview | TemplatePreviewModal | Full-screen preview with `[Use This Template]` primary + `[Cancel]` | — |
| 4 | Clicks `[Use This Template]` | ApplyProgressOverlay | `"Applying template..."` progress bar → canvas populated with template content | Step 1 (`add-element`) auto-completes |
| 5 | Presses `A` or clicks Build rail icon | Build tab opens | Element catalog visible. OnboardingChecklist appears bottom-right: step 2 highlighted `"Drag an element to canvas"` | Step 2 active |
| 6 | Drags element card to canvas | Canvas CS-7 → drop → CS-4 | Element inserted, selected. SpotlightOverlay may highlight inspector. | Step 2 complete → AchievementPrompt `"Element added!"` |
| 7 | Double-clicks text element | Canvas CS-6 (inline editing) | Blinking cursor inside text. Inline formatting toolbar visible. | Step 3 active: `"Edit some text"` |
| 8 | Types new text, clicks outside | Canvas CS-4 | Text committed. Inspector shows element properties. | Step 3 complete → AchievementPrompt `"Text edited!"` |
| 9 | Inspector → Style tab → Typography → Color swatch | Color picker popover | User picks new color → live update on canvas | Step 4 active: `"Change a style"` |
| 10 | Closes color picker | Inspector | Style applied. | Step 4 complete → AchievementPrompt |
| 11 | Presses Ctrl+P | New browser tab opens | Preview of site | Step 5 active: `"Preview your site"` → auto-complete |
| 12 | Returns to editor, presses `U` | Publish tab opens | Pre-publish checklist visible. `[Publish Site]` primary button | Step 6 active: `"Publish your site"` |
| 13 | Clicks `[Publish Site]` | Publish tab → publishing state | Button: `"Publishing..."` → success → URL shown | Step 6 complete |
| 14 | Publication succeeds | Toast + AchievementPrompt | Toast: `"Site published!"` + AchievementPrompt: `"Your site is live!"` with confetti animation + link to open | Checklist 100% complete |

---

## 10. Shared Rules for Advanced Surfaces

### 10.1 Modal Pattern Rules

All modals follow these shared rules:
- Entry animation: `opacity: 0; scale: 0.96` → `opacity: 1; scale: 1`, `150ms ease-out` (E2)
- Exit animation: reverse, `100ms ease-in` (E3)
- Backdrop: `background: rgba(0,0,0,0.6); backdrop-filter: blur(4px)`
- Focus trap: `inert` attribute on background content while modal open
- Escape always closes modal
- Focus returns to triggering element on close (stored in `previousFocusRef`)

### 10.2 Toast Notification Rules

From §25.1 Principles 4 and 5:

| Context | Loading text | Completion text |
|---------|-------------|----------------|
| Save | "Saving..." | "Saved at 2:45 PM" |
| Publish | "Publishing..." | "Site published!" |
| Template apply | "Applying template..." (with progress stages) | "Template applied" |
| Export | "Preparing download..." | "Download complete" |
| AI generate | "Generating..." (with substage text) | "Result ready" |
| Upload | "Uploading [filename]..." with % progress | "Upload complete" |

**Success is acknowledged with next action:**

| Action | Success text | Next action shown |
|--------|-------------|------------------|
| Save | "Saved at 2:45 PM" (timestamp in top bar) | — (implicit) |
| Publish | "Site published!" toast | [Open site →] link in toast |
| Upload | "Upload complete" toast | Asset appears in media library |
| Version saved | "Version saved: [name]" toast | Version appears in History |
| AI applied | "AI changes applied" toast | [Undo] button in toast |
| Export download | "Download complete — [file].zip" toast | File auto-downloads |

### 10.3 Destructive Action Confirmation Rules

From §25.1 Principle 3:

| Action | Confirmation dialog text | Buttons |
|--------|------------------------|---------|
| Delete element | "Delete this [type]? This cannot be undone." | [Delete] destructive + [Keep] ghost |
| Delete multiple elements | "Delete [N] elements? This cannot be undone." | [Delete All] destructive + [Keep] ghost |
| Clear history | "Clear all history? Auto-saves will also be removed. This cannot be undone." | [Clear] destructive + [Cancel] ghost |
| Unpublish site | "Unpublish your site? It will no longer be accessible at [URL]." | [Unpublish] destructive + [Keep Published] ghost |
| Replace page (AI Copilot) | "Replace current page? Your current content will be saved as a version." | [Replace] destructive + [Cancel] ghost |
| Restore version | "Restore to [version name]? Your current changes will be saved as an auto-save first." | [Restore] primary + [Cancel] ghost |

### 10.4 Microcopy Principles

From §25.1:

1. **Always say what will happen** — not just what the button is ("Publish Site" not "Submit")
2. **Error messages explain why + what to do** — ("Could not save — check your connection and try again" not "Save failed")
3. **Destructive actions require confirmation** with stated consequence
4. **Progress always communicates status** — never silent loading
5. **Success is acknowledged** with next action available

### 10.5 Trust Signals

| # | Signal | Location | Spec |
|---|--------|----------|------|
| TS1 | Security badge | Publish tab | Lucide `shield-check`, 16px, `#22c55e` + `"Your site data is encrypted and stored securely"` |
| TS2 | Auto-save indicator | Top bar, save status area | `"Auto-saved 2m ago"` — always visible |
| TS3 | Version history always accessible | Rail History icon (H key) | Users always know they can undo to any point |
| TS4 | Error boundary recovery | Full-screen error overlay | `"Something went wrong"` + `"Your work was auto-saved. Reload to continue."` + `[Reload]` |
| TS5 | Undo availability | Throughout UI | Destructive actions from toolbar always include `[Undo]` in toast |
| TS6 | Offline indicator | Connection quality dot + top bar | `"Offline — changes saved locally"` badge |

---

## 11. Power User Requirements

### 11.1 Power User Daily Session Flow

From §18.2:

| Step | User Action | UI Surface | Result |
|------|------------|-----------|--------|
| 1 | Opens editor URL | Shell loads | Auto-save loaded from last session. Canvas shows last state. Top bar: `"Auto-saved 2m ago"` |
| 2 | Presses Ctrl+K | Command Palette | Palette opens. Types `"layers"` → `"Open Layers"` highlighted |
| 3 | Presses Enter | Layers tab opens | Element tree visible. Canvas shows element outlines |
| 4 | Clicks element in Layers tree | Canvas CS-4 | Element selected on canvas. Inspector populates. Canvas scrolls/zooms to show element |
| 5 | Inspector detects flex container | Inspector Layout tab | Auto-scrolls to Flexbox section (expanded). Flex controls visible |
| 6 | Changes `gap` value to `24px` | Inspector → Flexbox → gap input | Canvas live-updates: gap between flex children changes in real-time |
| 7 | Presses `D` | Design System tab opens | Color tokens section visible |
| 8 | Clicks color token → edits value | Color picker → new value | DraftChip appears: `"1 draft"` pulsing amber |
| 9 | Clicks `[Review Changes]` | Review modal | Modal shows diff: old color → new color, affected elements count |
| 10 | Clicks `[Apply All]` | Review modal closes | Canvas updates all elements using that token. Toast: `"1 token applied to 12 elements"` |
| 11 | Presses `H` | History tab opens | Versions view visible |
| 12 | Clicks `[Save current version]` | Inline version name input | Types `"v1.2 — color system update"` → Enter |
| 13 | Version saved | History tab | New version row appears with name + timestamp + `"Current"` badge |
| 14 | Presses Ctrl+P → reviews → closes tab | Preview | Site preview in new tab |
| 15 | Presses `U` → clicks `[Update Site]` | Publish tab | Publishing → success → Toast `"Site updated!"` |

### 11.2 CMS Data-Driven Page Flow

From §18.3:

| Step | User Action | UI Surface | Result |
|------|------------|-----------|--------|
| 1 | Presses `A` → Build tab → Data category | Build tab | Scrolls to "Data" category accordion |
| 2 | Drags `"CMS List"` element to canvas | Canvas CS-7 → drop | Element dropped → Collection Setup modal auto-opens |
| 3 | Names collection `"Blog Posts"`, adds fields | Collection Setup modal | Fields: Title (Text, required), Body (Richtext), Cover (Image), Published (Date) |
| 4 | Clicks `[Create Collection]` | Modal closes | CMS List element on canvas bound to collection. Preview data loaded |
| 5 | Clicks text element inside CMS List item | Canvas CS-4 → Inspector | Inspector shows text element. Style tab → Typography section |
| 6 | Clicks chain icon next to text content field | Binding dropdown | Dropdown: `"Blog Posts"` group → `Title`, `Body` fields listed |
| 7 | Selects `"Blog Posts.Title"` | Binding applied | Field shows `"BlogPosts.title"` in indigo. Canvas shows actual title from record 1 |
| 8 | Clicks image element → chain icon on `src` | Binding dropdown (image fields only) | Selects `"Blog Posts.Cover"` → image shows record 1 cover image |
| 9 | CMS preview navigator appears | Canvas above CMS List | `"Record 1 of 24"` with prev/next arrows |
| 10 | Clicks next arrow several times | Canvas | Content updates to show records 2, 3, 4... |
| 11 | Publishes | Publish tab | All CMS records rendered → site live with dynamic data |

---

## 12. Anti-Downgrade Warnings (Advanced Surfaces)

> Source: §30 AR5–AR11, AR13, AR15, AR22–AR23, Output E §E.5–E.7

### 12.1 Anti-Regression Items

| # | Risk | What could go wrong | Pass criteria |
|---|------|--------------------|--------------|
| AR5 | CMS UI not designed/implemented | CMS surfaces missing entirely | All 4 CMS entry points functional: (1) CMS List in Build tab catalog, (2) Collection Setup modal, (3) Chain icon in inspector, (4) Binding dropdown |
| AR6 | AI surfaces reduced to single button | Only AI button in top bar, no AIAssistantBar or Copilot | All 3 AI surfaces render and function: (1) Ctrl+J opens AIAssistantBar, (2) AICopilot via Ctrl+J/StudioModals (NO overflow menu), (3) AISuggestionSection at bottom of Inspector panel (NOT inside Effects tab) |
| AR7 | Keyboard shortcuts changed or removed | Shortcuts conflict with new UI, or are silently dropped | All 30+ shortcuts from §5B table produce correct action |
| AR10 | History reduced to undo stack only | Named versions, restore, and compare flows removed | All 3 capabilities functional: (1) "Save current version" button, (2) Restore flow with confirm, (3) Compare split-view |
| AR11 | Export simplified to HTML only | Coming-soon formats dropped from modal | Export modal shows all 5 formats (HTML+CSS, React, Vue, Next.js, ZIP). HTML+CSS downloadable. Others show "Coming Soon" + "Notify me" |
| AR13 | Onboarding flow removed | No WelcomeModal on first visit, no checklist | All 4 onboarding components present: (1) WelcomeModal, (2) OnboardingChecklist (7 steps, not 5), (3) SpotlightOverlay (pointer-passthrough, no escape link), (4) AchievementPrompt on step completion |
| AR15 | Design token export removed | Export dropdown in Design tab missing or reduced | Design tab → export button → dropdown shows CSS Variables, JSON, SCSS/Tailwind formats |
| AR22 | Command palette keyboard navigation broken | Arrow keys/Enter don't work | Arrow Down/Up moves focus, Enter executes, Escape closes |
| AR23 | Collaboration cursors not rendering | Collaborator cursors not visible | SVG arrow in user color + name badge. Fades after 3s idle |

### 12.2 Anti-Downgrade Validation Checklist (from Output E)

**E.5 — Modals and Overlays:**

| # | Feature | Check |
|---|---------|-------|
| M1 | Command Palette: search + grouped results + keyboard nav | Ctrl+K modal must exist |
| M2 | Keyboard Cheat Sheet: full shortcut reference | ? modal must exist |
| M3 | Templates modal: browse + preview + apply flow | Full modal designed |
| M4 | Export modal: HTML (live) + planned formats | Ctrl+Shift+E modal must exist |
| M5 | AI Copilot modal: full-page generation | Copilot modal must exist |
| M6 | AIAssistantBar: bottom slide-up panel | Ctrl+J surface must exist |
| M7 | Collection Setup: field definition UI | CMS modal must exist |
| M8 | Create Component modal: name input | Modal must exist |
| M9 | UpgradeModal: unlock prompt | Modal must exist |
| M10 | WelcomeModal: first visit | Welcome design must exist |

**E.6 — CMS, Collaboration, AI:**

| # | Feature | Check |
|---|---------|-------|
| A1 | CMS binding UI: chain icon on inspector properties | Visible in inspector |
| A2 | CMS preview: record cycling (1/N) indicator | Visible on canvas |
| A3 | Collaboration: presence avatars in top bar | Avatars visible |
| A4 | Collaboration: live cursors on canvas | Cursor design exists |
| A5 | Collaboration: connection quality indicator | Dot/indicator visible |
| A6 | AI: AIAssistantBar accessible from top bar | AI button visible |
| A7 | AI: Copilot accessible | Via Ctrl+J / StudioModals (NO overflow menu exists) |
| A8 | AI: AI Suggestions in Inspector | Standalone section at bottom of Inspector panel (NOT inside Effects tab) |

**E.7 — Onboarding:**

| # | Feature | Check |
|---|---------|-------|
| O1 | WelcomeModal designed | Visible in first-visit screen |
| O2 | OnboardingChecklist: 7-step floating panel (name-project, pick-start, add-element, edit-text, change-style, preview, publish) | Designed |
| O3 | SpotlightOverlay with pointer-passthrough escape | Uses `pointerEvents: "none"` — no text escape link |
| O4 | AchievementPrompt: step completion screen | Designed |

---

## 13. Source Notes and Unclear Items

### 13.1 Source Traceability

| Part 5 Section | PRD Source |
|---------------|-----------|
| §1 CMS Surfaces | §12.1–12.4, §5H |
| §2 Collaboration Surfaces | §13.1–13.5, §5I |
| §3 AI Surfaces | §14.1–14.4, §5J |
| §4 Version History | §15.1–15.4, §9.14 (cross-ref) |
| §5 Export/Publish | §16.1–16.3 |
| §6 Command Palette | §17.1 |
| §7 Keyboard Cheat Sheet | §17.2 |
| §8 Modals Catalog | §5F |
| §9 Onboarding | §5G, §18.1 |
| §10 Shared Rules | §25.1–25.2 |
| §11 Power User Flows | §18.2–18.3 |
| §12 Anti-Downgrade | §30 (AR5–AR15, AR22–AR23), Output E §E.5–E.7 |

### 13.2 Unclear / Ambiguous Items

1. **CMS-E6 Collection Binding section replaces Variants section** — PRD says "Variants section replaced by Collection Binding section for CMS elements" but does not specify what happens if the CMS List element is also a component variant. Potential conflict between CMS binding section and Variants section.

2. **AI timeout behavior (30s)** — PRD specifies 30s timeout for AI calls but does not specify whether the user can cancel during the wait, or only after timeout.

3. **Compare flow element diffing algorithm** — PRD specifies visual diff colors (amber changed, green added, red removed) but does not specify the diffing algorithm. How are "changed" vs "added" vs "removed" elements determined? By element ID? By position? By content?

4. **"Notify me" email storage** — PRD references `NotificationService.subscribe(email, format)` but this service is not documented anywhere else. It's unclear if this is a real backend service or a stub.

5. **Copilot modal "Generate Section" vs "Generate Full Page"** — PRD does not specify the difference in output between these two options beyond the obvious scope difference. Does "Generate Section" append to existing page or replace a selection?

6. **~~Onboarding checklist has 5 steps in §5G but 6 steps in §18.1~~ RESOLVED** — Actual code (`onboardingSteps.ts`) has **7 steps**: name-project, pick-start, add-element, edit-text, change-style, preview, publish. Both doc references (5 and 6) were undercounting.

7. **CMS UI surfaces entirely absent** — The CMS engine is fully implemented (CollectionManager, CMSBindingManager, 14 field types) but NO frontend entry points exist: no "Data" category in Build catalog, no chain icon in inspector, no CMS Collections card in Settings/Integrations. CollectionSetupModal exists in StudioModals.tsx but has no visible trigger path.

8. **Compare flow in History tab absent** — No split-view comparison component exists in `src/editor/sidebar/tabs/history/`. The History tab has Versions view and Activity view, but no compare/diff functionality.

9. **OT conflict toast absent** — OTEngine emits `divergence:detected` events but no UI toast notification is wired to these events. The "Your change was rebased" message described in §2.4 does not exist in code.

10. **Selection awareness UI absent** — Collaboration types include `selection?: string[]` in CollaborationUser, but no marching ants effect or remote selection highlighting UI was found in the codebase.

11. **NotificationService.subscribe absent** — The "Notify me" flow for coming-soon export formats references `NotificationService.subscribe(email, format)` which does not exist in the codebase.

---

*End of PART_5_ADVANCED_PRODUCT_SURFACES.md*
*Extracted from prd_final.md — no content invented, all specs traced to source sections*
