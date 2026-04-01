# Pencil Wireframing — Buildrik Interaction Wiring & Prototyping

> **Goal:** Wire the 32 static screens from `pencil_prompts.md` into interactive, clickable flows. This makes the Pencil prototype a working simulation of the Buildrik editor — not just static mockups.
>
> **Prerequisites:**
> 1. ALL 32 static screen prompts from `pencil_prompts.md` MUST be built first
> 2. Design tokens (PROMPT 0) MUST already be set via `set_variables`
>
> **Rules:**
> 1. Use Pencil MCP tools: `batch_design` (with `connection` type nodes for arrows), `batch_get`, `get_screenshot`, `snapshot_layout`, `find_empty_space_on_canvas`
> 2. Each flow prompt creates a **flow frame** showing before → after states with connecting arrows
> 3. Arrows use `connection` type nodes in Pencil to link source hotspot → target state
> 4. Interaction annotations use `note` type nodes with trigger descriptions
> 5. All flows reference existing frames from PROMPT 1–32 by name — copy (C) relevant portions, don't rebuild
> 6. Flow direction: **left-to-right** for sequential flows, **top-to-bottom** for branching flows
> 7. Color coding for connection arrows:
>    - `#6366f1` (indigo) — primary navigation / click actions
>    - `#22c55e` (green) — success / completion paths
>    - `#ef4444` (red) — destructive / error paths
>    - `#f59e0b` (amber) — conditional / branching paths
>    - `#908D85` (muted) — hover / passive state transitions

---

## PROMPT 33: MASTER FLOW MAP

**Frame name:** `33 — Master Flow Map`
**Source:** All PARTs, all 32 screen prompts
**Pencil tool:** `batch_design` — connections between thumbnail copies of all screens

**Purpose:** Bird's-eye view of the entire Buildrik editor — every screen linked to every screen it can navigate to.

**Layout:** 2400×1800px frame, dark bg (`#08080e`)

**Screen thumbnails (scaled 0.15x copies of each frame):**

```
ROW 1 — SHELL & NAVIGATION
[01-Shell] ──→ [02-TopBar] ──→ [03-Rail] ──→ [04-PanelHeader]

ROW 2 — LEFT SIDEBAR PANELS (connected from Rail)
[05-Build] [06-Media] [07-Layers] [08-Templates] [09-Pages]
[10-Components] [11-Design] [12-Settings] [13-Publish] [14-History]

ROW 3 — CANVAS STATES
[15-CanvasDefault] [16-Selection] [17-Overlays] [18-FloatingToolbar] [19-Footer]

ROW 4 — INSPECTOR
[20-InspHeader] [21-Layout] [22-Appearance] [23-Effects] [24-MultiSelect]

ROW 5 — MODALS & FLOWS
[25-Modals] [26-Onboarding] [27-CmdPalette] [28-CMS] [29-AI] [30-Collab] [31-States] [32-KnownIssues]
```

**Connection arrows (primary navigation paths):**

| From | To | Trigger | Arrow Color |
|------|----|---------|-------------|
| Rail icon "Add" | 05-Build | Click rail icon A | #6366f1 |
| Rail icon "Media" | 06-Media | Click rail icon J | #6366f1 |
| Rail icon "Layers" | 07-Layers | Click rail icon Z | #6366f1 |
| Rail icon "Templates" | 08-Templates | Click rail icon T | #6366f1 |
| Rail icon "Pages" | 09-Pages | Click rail icon P | #6366f1 |
| Rail icon "Design" | 11-Design | Click rail icon D | #6366f1 |
| Rail icon "Settings" | 12-Settings | Click rail icon S | #6366f1 |
| Rail icon "History" | 14-History | Click rail icon H | #6366f1 |
| Keyboard ⇧A | 10-Components | Keyboard only | #f59e0b |
| Keyboard U | 13-Publish | Keyboard only | #f59e0b |
| TopBar "Publish" btn | 13-Publish | Click button | #6366f1 |
| TopBar "Preview" btn | New browser tab | Click button | #6366f1 |
| TopBar "Logo" | 25-Modals (ProjectSettings) | Click logo | #6366f1 |
| TopBar "Undo/Redo" | Canvas state change | Click | #6366f1 |
| Canvas element click | 20-InspHeader | Selection | #6366f1 |
| Canvas right-click | 18-FloatingToolbar (ctx menu) | Right click | #6366f1 |
| Canvas empty | 15-CanvasDefault (EmptyCTA) | No elements | #908D85 |
| EmptyCTA "Browse Templates" | 08-Templates | Click | #6366f1 |
| EmptyCTA "Start Blank" | Canvas active | Click | #22c55e |
| Template card click | 25-Modals (TemplatePreview) | Click | #6366f1 |
| Footer "?" | 27-CmdPalette (shortcuts) | Click | #6366f1 |
| Ctrl+J | 29-AI (AssistantBar) | Keyboard | #6366f1 |
| Ctrl+Shift+P | 27-CmdPalette | Keyboard | #6366f1 |
| First visit | 26-Onboarding | Auto | #f59e0b |

**Annotation notes (placed around map):**
- "Keyboard-only paths shown in amber ⚠️"
- "Green = success/completion, Red = destructive"
- "All panels accessible via Rail except Components (⇧A) and Publish (U)"

---

## PROMPT 34: RAIL → PANEL NAVIGATION FLOW

**Frame name:** `34 — Rail Panel Navigation`
**Source:** PROMPT 3, PROMPT 4, PROMPT 5–14
**Pencil tool:** `batch_design`

**Flow frame:** 2400×900px

**Show 6 sequential states left-to-right:**

```
STATE 1            STATE 2              STATE 3              STATE 4              STATE 5              STATE 6
┌──────────┐      ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│ All panels│  ──→ │ Click    │   ──→   │ Build    │   ──→   │ Click    │   ──→   │ Build    │   ──→   │ Click    │
│ closed    │      │ Add icon │         │ panel    │         │ Media    │         │ closes,  │         │ Add icon │
│ Rail only │      │ (hover)  │         │ slides in│         │ icon     │         │ Media    │         │ again    │
│ visible   │      │          │         │ 280px    │         │          │         │ opens    │         │          │
└──────────┘      └──────────┘         └──────────┘         └──────────┘         └──────────┘         └──────────┘
                                                                                                        ↓
                                                                                                  Panel closes
                                                                                                  (toggle off)
```

**Per-state specs:**

| State | Rail | Sidebar | Transition | Duration |
|-------|------|---------|------------|----------|
| 1 — Closed | All icons default (#908D85) | Width: 0px, hidden | — | — |
| 2 — Hover | Add icon brightens | Still 0px | Icon color transition | 100ms |
| 3 — Open (Add) | Add icon: active state (left-bar + bg tint #7c6dfa) | Slides in from left, 280px, Build tab content | `transform: translateX(-100%) → translateX(0)` + opacity 0→1 | 300ms bounce `cubic-bezier(0.34, 1.56, 0.64, 1)` for transform; 150ms `cubic-bezier(0.4, 0, 0.2, 1)` for opacity |
| 4 — Switch hover | Media icon brightens, Add still active | Build panel still showing | Icon color transition | 100ms |
| 5 — Switched | Media icon: active, Add icon: default | Build content fades, Media content fades in | Cross-fade content, rail indicator moves | 150ms |
| 6 — Toggle close | Add icon clicked while already open → closes | Slides out to left, 280px → 0px | `translateX(0) → translateX(-100%)` + opacity 1→0 | 300ms bounce for transform; 150ms smooth for opacity |

**Annotations (note nodes):**
- Between state 1→2: "Hover: 100ms color transition"
- Between state 2→3: "Click: 300ms bounce slide-in + 150ms opacity fade"
- Between state 4→5: "Switch: content cross-fade 150ms, no slide"
- Between state 5→6: "Toggle: same icon click = close, 300ms bounce slide-out + 150ms opacity fade"
- Global note: "Only ONE panel open at a time. Switching doesn't close+reopen — it swaps content."

---

## PROMPT 35: PANEL PIN / UNPIN / RESIZE FLOW

**Frame name:** `35 — Panel Pin Unpin Resize`
**Source:** PROMPT 4
**Pencil tool:** `batch_design`

**Flow frame:** 2000×1200px

**3 parallel tracks (top-to-bottom per track):**

### Track A — Pin Flow (left column):

```
[Panel Open - Unpinned]     pin icon = 📌 (pin), panel renders as overlay
        │
        ↓  Click pin icon
[Panel Open - Pinned]       pin icon = 📌 (pin-off), panel becomes non-overlay (inline in grid)
        │
        ↓  Click outside panel
[Panel STAYS OPEN]          (pinned panels don't close on outside click — they're inline, not overlay)
        │
        ↓  Click pin-off icon
[Panel Open - Unpinned]     back to overlay mode
```

> **⚠️ Code note:** No special `border-right: 2px solid #6366f1` exists for pinned state. The visual difference is that pinned panels are **inline in the grid layout** (push canvas), while unpinned panels are **overlays** (float over canvas). Pin state is tracked via `drawerPinned` in `useSidebarState.ts`.

### Track B — Unpin + Outside Click (center column):

```
[Panel Open - Unpinned]
        │
        ↓  Click outside panel (canvas/inspector)
[Panel Closes]              200ms slide-out
        │
        ↓  Rail icon returns to default state
[Closed state]
```

### Track C — Size Mode Flow (right column):

```
[Panel at 280px (compact)]
        │
        ↓  Click "Normal" size button in panel header
[Panel at 320px (normal)]   canvas adjusts
        │
        ↓  Click "Extended" size button
[Panel at 400px (extended)] canvas shrinks further
        │
        ↓  Click "Compact" size button
[Panel at 280px (compact)]  canvas expands back
```

> **⚠️ Code note:** Panel resizing uses **discrete size mode buttons** (Compact 280px / Normal 320px / Extended 400px) in `LeftSidebar.tsx`, NOT a drag handle. There is no freeform drag-to-resize. Size constants from `shared/constants/layout.ts`: `DRAWER_WIDTH_COMPACT: 280`, `DRAWER_WIDTH_NORMAL: 320`, `DRAWER_WIDTH_EXTENDED: 400`.

**Visual specs per state:**
- Unpinned: overlay mode, floats over canvas
- Pinned: inline in grid layout, pushes canvas
- Size mode buttons: toolbar below panel header with 3 icon buttons
- Pin icon toggle: `pin` (Lucide) when unpinned, `pin-off` when pinned

---

## PROMPT 36: SETTINGS DRILL-IN FLOW

**Frame name:** `36 — Settings Drill-In`
**Source:** PROMPT 12
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1000px

```
HOME VIEW                    DRILL-IN                      LOCKED SCREEN
┌──────────────────┐        ┌──────────────────┐          ┌──────────────────┐
│ Settings         │        │ [← Back] Site    │          │ [← Back] Domains │
│ ┌────┐ ┌────┐   │        │                  │          │                  │
│ │Site│ │Dom.│   │──click──→│ Site name: [...] │          │  🔒 Coming Soon  │
│ └────┘ └────┘   │  Site   │ Favicon: [upload]│          │                  │
│ ┌────┐ ┌────┐   │        │ Language: [▾]    │          │  Feature desc... │
│ │Ana.│ │Exp.│   │        │                  │          │  [Notify Me]     │
│ └────┘ └────┘   │        │ [Save Changes]   │          │                  │
│ ┌────┐ ┌────┐   │        └──────────────────┘          └──────────────────┘
│ │Int.│ │Adv.│   │              ↑                              ↑
│ └────┘ └────┘   │──click──→───┘ (Export, Integrations, Adv)   │
│                  │                                             │
│                  │──click Domains──→───────────────────────────┘
│                  │──click Analytics──→ (same LockedScreen)
└──────────────────┘
```

**Transition specs:**

| Action | Animation | Duration |
|--------|-----------|----------|
| Card click → drill-in | Content slides left, new content slides in from right | 200ms ease |
| Back arrow click | Content slides right, home view slides in from left | 200ms ease |
| DrillInHeader appear | Replaces standard panel header | Instant (part of slide) |

**DrillInHeader anatomy:**
```
[← arrow-left 16px, #B8B5AD, hover: #F5F5F0]  [Title 14px semibold #F5F5F0]     [action buttons if any]
Height: 44px, padding: 0 12px
```

**Card → Screen mapping:**

| Card | Drill Target | Locked? | Lock Type |
|------|-------------|---------|-----------|
| Site | SiteSettings sub-screen | No | — |
| Domains | LockedScreen | Yes | Feature flag — "Coming Soon" badge |
| Analytics | AnalyticsSettings sub-screen | No | — (accessible, no lock) |
| Export | LockedScreen | Yes | Feature flag — "Coming Soon" badge |
| Integrations | IntegrationsSettings sub-screen | Yes | Plan-locked — "Pro" badge |
| Advanced | AdvancedSettings sub-screen | Yes | Plan-locked — "Pro" badge |

> **⚠️ Code source:** `SettingsTab.tsx` lines 103–147, `FEATURE_FLAGS` for Domains/Export, `SCREEN_PLAN_REQUIREMENTS` in `types.ts` for Integrations/Advanced ("pro" plan). Analytics is NOT locked — the original pencil_prompts.md was wrong about this.

---

## PROMPT 37: TEMPLATE APPLICATION FLOW

**Frame name:** `37 — Template Application Flow`
**Source:** PROMPT 8, PROMPT 15, PROMPT 25
**Pencil tool:** `batch_design`

**Flow frame:** 3000×900px (wide — 5 step linear flow)

```
STEP 1               STEP 2                  STEP 3                STEP 4                STEP 5
Template Grid    →   TemplatePreviewModal  →  TemplateUseDrawer  →  ApplyProgress       →  Canvas with
                                               (ALWAYS shown)        Overlay                template
┌─────────────┐     ┌─────────────────────┐  ┌─────────────────┐  ┌──────────────────┐   ┌──────────────┐
│ [card] [card]│     │                     │  │ How to apply?    │  │                  │   │              │
│ [card] [card]│     │  Full-screen scaled  │  │                  │  │  ⟳ Applying      │   │  Template    │
│             │     │  preview of template │  │ ○ Replace page   │  │  template...     │   │  rendered    │
│ Click card  │────→│                     │──│ ○ Add as section │──│                  │──→│  on canvas   │
│             │     │ [Use Template] [✕]  │  │                  │  │ rgba(0,0,0,0.6)  │   │              │
└─────────────┘     │                     │  │ [Apply] [Cancel]  │  │  spinner center   │   │  zoom-to-fit │
                    └─────────────────────┘  └─────────────────┘  └──────────────────┘   └──────────────┘
```

> **⚠️ Code note:** The TemplateUseDrawer is ALWAYS shown after clicking "Use This Template" — there is no blank-canvas skip. The code in `TemplatesTab.tsx` line 141 (`handleUseFromPreview`) always triggers `setShowReplace(true)` regardless of canvas state.

**Per-step specs:**

| Step | Trigger | Visual | Transition |
|------|---------|--------|------------|
| 1 → 2 | Click template card | Modal opens: opacity 0 + scale(0.98) → 1 + scale(1) | 150ms ease |
| 2 → 3 | Click "Use This Template" | TemplateUseDrawer slides up from bottom (always, regardless of canvas state) | 200ms ease-out |
| 3 → 4 | Click "Replace entire page" or "Add as new section" | Drawer closes, overlay appears | 150ms |
| 4 → 5 | Template apply complete | Overlay fades out, canvas shows template, zoom-to-fit | 300ms |
| Any → Cancel | Click ✕ or Cancel or backdrop | Modal/drawer closes | 150ms ease-in |

**TemplatePreviewModal spec:**
- Full-screen, bg: rgba(0,0,0,0.8)
- Scaled preview centered (max 80vw × 80vh)
- Bottom bar: [Cancel] ghost + [Use This Template] primary #6366f1

**TemplateUseDrawer spec:**
- 400px wide, slides from bottom
- Two radio options: "Replace entire page" / "Add as new section"
- [Apply] primary + [Cancel] ghost

---

## PROMPT 38: ONBOARDING FLOW

**Frame name:** `38 — Onboarding Flow`
**Source:** PROMPT 26
**Pencil tool:** `batch_design`

**Flow frame:** 3000×1200px

```
TRIGGER                 STEP 1                  STEP 2                    STEP 3                  STEP 4
First visit          →  WelcomeModal          →  OnboardingChecklist     →  SpotlightOverlay     →  AchievementPrompt
(completedCount=0)                               (floating, bottom-right)   (per step)              (per step)

┌──────────────┐       ┌────────────────────┐   ┌──────────────────┐     ┌──────────────────┐    ┌──────────────────┐
│              │       │ Welcome to          │   │ Getting Started  │     │ ╔══════════════╗ │    │                  │
│  New user    │──→──→ │ Buildrik!           │   │                  │     │ ║ Highlighted  ║ │    │  ✓ Element       │
│  loads app   │       │                     │   │ ☑ Name project   │     │ ║ target area  ║ │    │    added!        │
│              │       │ [Name: ________]    │   │ ☐ Pick start     │←──→ │ ╚══════════════╝ │    │                  │
│              │       │                     │   │ ☐ Add element    │     │                  │    │  [micro-anim]    │
│              │       │ [Templates] [Blank] │   │ ☐ Edit text      │     │ "Drag an element │    │                  │
│              │       └────────────────────┘   │ ☐ Change style   │     │  onto canvas"    │    │  (confetti on    │
│              │              │                  │ ☐ Preview        │     │                  │    │   final step)    │
│              │              ↓                  │ ☐ Publish        │     │ [Explore freely →]│    │                  │
│              │       User picks Templates     │                  │     └──────────────────┘    └──────────────────┘
│              │       OR Blank                  │ [Minimize ▾]     │            ↑   ↓
└──────────────┘              ↓                  └──────────────────┘     Step completion
                       Canvas loads               ↕ Syncs with canvas      triggers next
                       Checklist appears          actions automatically     spotlight
```

**Flow connections:**

| From | To | Trigger | Arrow |
|------|----|---------|-------|
| New user | WelcomeModal | `completedCount === 0` | #f59e0b (auto) |
| WelcomeModal "Templates" | TemplatePreviewModal (PROMPT 37 flow) | Click | #6366f1 |
| WelcomeModal "Blank" | Canvas + Checklist appears | Click | #6366f1 |
| Checklist step unchecked | SpotlightOverlay on target | Click step or auto | #6366f1 |
| SpotlightOverlay action done | AchievementPrompt | Event (e.g., element added) | #22c55e |
| AchievementPrompt dismiss | Checklist updates (☑) | Auto after 2s or click | #22c55e |
| "Explore freely →" | Spotlight closes, checklist stays | Click | #908D85 |
| All 7 steps done | Confetti + "You're all set!" | Auto | #22c55e |
| Checklist "Minimize" | Collapsed to small FAB | Click | #908D85 |

**SpotlightOverlay spec:**
- Full-screen dark overlay: `rgba(0,0,0,0.6)`
- Cut-out: target element + 8px padding, border-radius matches target
- Arrow: SVG pointer from instruction text to target
- Instruction text: 14px Inter, white, max-width 280px
- "Explore freely →" link: 12px, #B8B5AD, underline

**AchievementPrompt spec:**
- Toast-like popup, bottom-right above checklist
- bg: surface-2, border-left: 4px solid #22c55e
- Icon: ✓ 16px green + message 13px
- Auto-dismiss: 2000ms

---

## PROMPT 39: INSPECTOR TAB & STATE SWITCHING

**Frame name:** `39 — Inspector Tab & State Switching`
**Source:** PROMPT 20–24
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1400px

### Track A — Tab Switching (top half):

```
LAYOUT TAB              STYLE TAB               EFFECTS TAB
┌──────────────────┐   ┌──────────────────┐    ┌──────────────────┐
│ [Layout̲] Style Eff│   │ Layout [Style̲] Eff│    │ Layout Style [Eff̲]│
│                  │   │                  │    │                  │
│ Display: [block▾]│   │ Typography       │    │ Effects          │
│ Size: w[__] h[__]│──→│ Font: [Inter ▾]  │──→ │ Shadows: [+ Add] │
│ Spacing: [box]   │   │ Background       │    │ Animation        │
│ Flexbox (if flex)│   │ Color: [■ swatch]│    │ Interactions     │
│ Position         │   │ Border           │    │ Visibility       │
└──────────────────┘   └──────────────────┘    └──────────────────┘

> **⚠️ Code-verified:** The third tab label is **"Effects"** (not "Behavior"). Internal IDs: `layout`, `appearance`, `effects`. Display labels: "Layout", "Style", "Effects". The "Behavior" label from pencil_prompts.md is NOT present in current code — it was either fixed or never existed.
```

- Click tab label → content swaps instantly (no animation)
- Active tab: 13px weight 600, #F5F5F0, underline 2px #6366f1
- Inactive tab: 13px weight 400, #B8B5AD

### Track B — Pseudo-State Switching (middle):

```
[Normal]  →  Click [Hover]  →  Click [Focus]  →  Click [Active]  →  Click [Disabled]

┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ [Normal̲] H F A D│   │ N [Hover̲] F A D│   │ N H [Focus̲] A D│   │ N H F [Active̲] D│   │ N H F A [Dis̲]  │
│              │   │              │   │              │   │              │   │              │
│ Base styles  │   │ ⚠ Editing    │   │ ⚠ Editing    │   │ ⚠ Editing    │   │ ⚠ Editing    │
│              │   │ Hover state  │   │ Focus state  │   │ Active state │   │ Disabled     │
│ (no banner)  │   │ (amber banner│   │ (amber banner│   │ (amber banner│   │ (amber banner│
│              │   │  at top)     │   │  at top)     │   │  at top)     │   │  at top)     │
│ Properties   │   │ Override dots│   │ Override dots│   │ Override dots│   │ Override dots│
│ show base    │   │ on changed   │   │ on changed   │   │ on changed   │   │ on changed   │
│ values       │   │ properties   │   │ properties   │   │ properties   │   │ properties   │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

- Amber banner: "Editing [State] state" — bg: rgba(245,158,11,0.12), text: #f59e0b, 12px
- Override dots: 6px circle, #f59e0b, next to property label
- Active pseudo button: pill bg, amber dot indicator

### Track C — Breakpoint Switching (bottom):

```
[Desktop (default)]  →  Click [Tablet]  →  Click [Mobile]

┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│        [Tab][Mob] │   │        [Tab̲][Mob] │   │        [Tab][Mob̲] │
│                  │   │                  │   │                  │
│ Desktop values   │   │ Tablet overrides │   │ Mobile overrides │
│ (no pill active) │   │ Override dots:   │   │ Override dots:   │
│                  │   │ 🔵 on width,     │   │ 🔵 on width,     │
│                  │   │ padding etc.     │   │ font-size etc.   │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

- Desktop = default (no pill highlighted)
- Breakpoint override dot: 6px circle, #6366f1, next to property label
- Tooltip on dot: "Overridden at [breakpoint]. Desktop value: [value]"

---

## PROMPT 40: CANVAS INTERACTION SEQUENCE

**Frame name:** `40 — Canvas Interaction Sequence`
**Source:** PROMPT 15, 16, 17, 18
**Pencil tool:** `batch_design`

**Flow frame:** 3600×1200px (wide — 8 states)

```
CS-0            CS-1           CS-2            CS-3             CS-5            CS-6            CS-9            DRAG
Idle Canvas  →  Mouse enters →  Hover elem  →  Click elem    →  Shift+click  →  Double-click →  Click+drag   →  Drag element
                canvas                          (selected)       (multi-sel)     (inline edit)   empty (marquee)

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│          │  │          │  │  ┌─teal──┐│  │  ┌indigo─┐│  │  ┌indigo─┐│  │  ┌─818cf8┐│  │ ┌╌╌╌╌╌╌┐│  │          │
│ Blank    │  │ Default  │  │  │ elem  ││  │  │ elem  ││  │  │ elem1 ││  │  │ text  ││  │ ╎select╎│  │  [elem]──│→
│ canvas   │  │ cursor   │  │  │ badge ││  │  │ ○○○○  ││  │  │      ││  │  │ cursor││  │ ╎ rect ╎│  │  ghost   │
│          │  │          │  │  └───────┘│  │  │ handles││  │  ├indigo─┤│  │  │ fmt tb││  │ └╌╌╌╌╌╌┘│  │  +snap   │
│          │  │          │  │          │  │  └───────┘│  │  │ elem2 ││  │  └───────┘│  │ dashed  │  │  lines   │
│          │  │          │  │          │  │  [toolbar]│  │  └───────┘│  │          │  │ indigo  │  │          │
│          │  │          │  │          │  │          │  │  ╌dashed╌ │  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

**Per-state transition specs:**

| From → To | Trigger | Visual Change | Timing |
|-----------|---------|---------------|--------|
| CS-0 → CS-1 | Mouse enters canvas | Cursor: crosshair (when no element under) | Instant |
| CS-1 → CS-2 | Mouse over element | Hover outline (see ⚠️ note below) + type badge | 100ms fade-in |
| CS-2 → CS-3 | Click element | Selection outline: 2px solid `#3B82F6` (blue, `--aqb-selection-color`), 8 resize handles, floating toolbar | Instant (0ms) |
| CS-3 → CS-5 | Shift+click another element | Both get `#3B82F6` outline, group bounding box: 1px dashed `rgba(59,130,246,0.4)`, MultiSelectToolbar | Instant |
| CS-3 → CS-6 | Double-click text element | Outline: 2px solid `#667eea` (`--aqb-primary`), cursor blinks inside, text formatting toolbar | 50ms |
| CS-1 → CS-9 | Click+drag on empty canvas | Marquee rectangle: 1px dashed `#3B82F6`, bg `rgba(59,130,246,0.08)` | Live with drag |
| CS-3 → Drag | Drag selected element | Ghost follows cursor, snap lines appear (magenta #FF00FF) | Live |

> **⚠️ Code-verified colors:** Selection uses `--aqb-selection-color: #3B82F6` (professional blue), NOT `#6366f1` (indigo). Multi-select alpha uses `rgba(59,130,246,0.4)`. Inline edit uses `--aqb-primary: #667eea`. Hover outline color needs further verification — teal `rgba(20,184,166,0.6)` was not confirmed in the Canvas.css code.

**Escape paths (shown as red arrows):**
- CS-3/CS-5/CS-6 → CS-0: Press Escape or click empty canvas
- CS-6 → CS-3: Press Escape (exits inline edit, keeps selection)
- CS-9 → CS-5: Release mouse (elements in marquee become multi-selected)

---

## PROMPT 41: CONTEXT MENU & FLOATING TOOLBAR FLOW

**Frame name:** `41 — Context Menu & Toolbar Flow`
**Source:** PROMPT 18
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1400px

### Track A — Floating Toolbar Actions (top):

```
SELECTED ELEMENT          TOOLBAR ACTION              RESULT
┌──────────────────┐     ┌──────────────────┐       ┌──────────────────┐
│  [toolbar above] │     │ Click duplicate  │       │ New element      │
│  ┌──────────┐    │──→──│ (copy-plus icon) │──→────│ pasted below     │
│  │ element  │    │     │                  │       │ original         │
│  └──────────┘    │     │ Click delete     │       │ Element removed  │
│                  │──→──│ (trash-2 icon)   │──→────│ + toast "Deleted"│
│                  │     │                  │       │ [Undo] in toast  │
│                  │──→──│ Click ⋯ (more)   │──→──┐ │                  │
└──────────────────┘     └──────────────────┘     │ └──────────────────┘
                                                   │
                                                   ↓
                                              ┌──────────────┐
                                              │ Dropdown menu│
                                              │ Lock         │
                                              │ Hide         │
                                              │ Copy styles  │
                                              │ Paste styles │
                                              └──────────────┘
```

### Track B — Context Menu Flow (bottom):

```
RIGHT-CLICK             CONTEXT MENU                SUBMENU                 ACTION RESULT
┌──────────────┐       ┌──────────────────┐        ┌──────────────┐       ┌──────────────┐
│              │       │ ▸ Edit           │──hover──│ Cut    Ctrl+X│       │              │
│ Right-click  │──→────│ ▸ Insert         │        │ Copy   Ctrl+C│──→────│ Clipboard op │
│ on element   │       │ ▸ Layout         │        │ Paste  Ctrl+V│       │ completed    │
│              │       │ ▸ Quick Style    │        │ Dup    Ctrl+D│       │              │
│              │       │ ─────────────────│        └──────────────┘       │              │
│              │       │ Select from Stack▸│──hover──┐                     │              │
│              │       │ ─────────────────│        │ [overlapping  │       │              │
│              │       │ 🔴 Delete        │──→────│  elements list]│      │ Element      │
│              │       └──────────────────┘        └──────────────┘       │ deleted      │
└──────────────┘                                                          └──────────────┘
```

**Interaction specs:**

| Action | Trigger | Visual | Timing |
|--------|---------|--------|--------|
| Menu open | Right-click | Menu appears at cursor position | Instant |
| Submenu open | Hover group item (300ms dwell) | Submenu slides out to right | 100ms |
| Item hover | Mouse over | bg: surface-3 | Instant |
| Delete hover | Mouse over Delete | bg: rgba(239,68,68,0.12), text: #ef4444 | Instant |
| Menu close | Click item, click outside, or Escape | Menu fades out | 100ms |
| Action feedback | After click | Toast notification (top-right) | 150ms delay |

**"Select from Stack" submenu:**
- Lists all overlapping elements at click point
- Each row: element type icon + element name
- Click → selects that specific element (even if behind others)

---

## PROMPT 42: COMMAND PALETTE & SHORTCUTS FLOW

**Frame name:** `42 — Command Palette Flow`
**Source:** PROMPT 27
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1000px

```
TRIGGER             PALETTE OPEN           SEARCH/FILTER          EXECUTE              RESULT
┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│              │   │ ┌──────────────┐ │   │ ┌──────────────┐ │   │                  │   │                  │
│ Ctrl+Shift+P │   │ │ Search...    │ │   │ │ add he▌      │ │   │ Palette closes   │   │ Action executed  │
│              │──→│ └──────────────┘ │──→│ └──────────────┘ │──→│                  │──→│                  │
│   OR         │   │                  │   │                  │   │ 150ms fade-out   │   │ e.g., Heading    │
│ Footer [?]   │   │ RECENT          │   │ MATCHED:         │   │                  │   │ element added    │
│              │   │  • Undo          │   │  ▸ Add Heading ⌘ │   │                  │   │ to canvas        │
│              │   │  • Add Section   │   │  ▸ Add Hero    ⌘ │   │                  │   │                  │
│              │   │                  │   │  ▸ Add Header  ⌘ │   │                  │   │                  │
│              │   │ NAVIGATION       │   │                  │   │                  │   │                  │
│              │   │  • Go to Pages   │   │ (fuzzy match,    │   │ ↑↓ to navigate   │   │ Toast: "Heading  │
│              │   │  • Go to Media   │   │  50ms debounce)  │   │ Enter to execute │   │  added"          │
│              │   │                  │   │                  │   │ Esc to close     │   │                  │
└──────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘   └──────────────────┘
```

**Transition specs:**

| From → To | Animation | Duration |
|-----------|-----------|----------|
| Trigger → Open | opacity 0 + translateY(-8px) → opacity 1 + translateY(0) | 150ms ease-out |
| Type → Filter | Results filter in real-time, fuzzy match | 50ms debounce |
| ↑↓ Navigate | Highlight moves between results | Instant |
| Enter → Execute | Palette closes: opacity 1 → 0, scale(1) → scale(0.96) | 150ms ease-in |
| Esc → Close | Same as above | 150ms ease-in |

**Keyboard Shortcuts Modal (separate sub-flow):**

```
Footer [?] click  OR  ? key press
        │
        ↓
┌─────────────────────────────────────┐
│         Keyboard Shortcuts          │
│                                     │
│  GENERAL          │  EDIT           │
│  ─────────        │  ─────          │
│  Undo    Ctrl+Z   │  Cut    Ctrl+X  │
│  Redo    Ctrl+Y   │  Copy   Ctrl+C  │
│                   │  Paste  Ctrl+V  │
│  VIEW             │  PANELS         │
│  ─────            │  ──────         │
│  Zoom In  Ctrl++  │  Build Ctrl+⇧+T│
│  Zoom Out Ctrl+-  │  ...           │
│                                     │
│                            [✕ Close]│
└─────────────────────────────────────┘
```

---

## PROMPT 43: PUBLISH & DEPLOY FLOW

**Frame name:** `43 — Publish Deploy Flow`
**Source:** PROMPT 13
**Pencil tool:** `batch_design`

**Flow frame:** 3000×1000px

```
STATE 1              STATE 2               STATE 3               STATE 4                STATE 5
Draft                Pre-publish           Publishing...         Published              Update needed
                     checklist

┌──────────────┐    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   ┌──────────────────┐
│ Publish      │    │ Publish          │  │ Publish          │  │ Publish          │   │ Publish          │
│              │    │                  │  │                  │  │                  │   │                  │
│ [Draft] gray │    │ [Draft] gray     │  │ [Draft] gray     │  │ [Published] ✓    │   │ [Updated needed] │
│              │    │                  │  │                  │  │ green            │   │ amber            │
│ Checklist:   │    │ ☑ Template applied│  │ ☑ Template applied│  │                  │   │                  │
│ (5 items ⚠)  │    │ ☑ Content edited  │  │ ☑ Content edited  │  │ URL:             │   │ URL:             │
│              │    │ ☐ SEO title set   │  │ ☐ SEO title set   │  │ buildrik.app/... │   │ buildrik.app/... │
│              │    │ ☐ Meta desc added │  │ ☐ Meta desc added │  │ [📋 Copy]        │   │ [📋 Copy]        │
│              │    │ ☐ Social preview  │  │ ☐ Social preview  │  │                  │   │                  │
│              │    │                  │  │                  │  │                  │   │                  │
│ [Publish]    │──→─│ [Publish Site]   │──│ [Publishing... ⟳]│──│ [Update Site]    │   │ [Update Site]    │
│ primary      │    │ primary #6366f1  │  │ disabled, spinner│  │ primary          │   │ primary          │
│              │    │                  │  │                  │  │ [Unpublish]      │   │ [Unpublish]      │
│              │    │                  │  │                  │  │ destructive ghost│   │ destructive ghost│
└──────────────┘    └──────────────────┘  └──────────────────┘  └──────────────────┘   └──────────────────┘
```

**Flow connections:**

| From → To | Trigger | Arrow Color |
|-----------|---------|-------------|
| Draft → Pre-publish | User opens Publish tab | #908D85 (auto) |
| Pre-publish → Publishing | Click [Publish Site] | #6366f1 |
| Publishing → Published | API success | #22c55e |
| Publishing → Error | API failure | #ef4444 |
| Published → Update needed | User edits content | #f59e0b |
| Update needed → Publishing | Click [Update Site] | #6366f1 |
| Published → Draft | Click [Unpublish] → ConfirmDialog → confirm | #ef4444 |

**Error branch (separate):**
```
Publishing...  →  Error toast: "Publish failed"  →  Button re-enables: [Retry Publish]
                  red border-left toast             #ef4444 border
```

**⚠️ Known issue annotation:** "Pre-publish checklist has 5 items (not 4): 'Template applied', 'Content edited', 'SEO title set', 'Meta description added', 'Social preview configured'. The first two (`hasContent`) ARE implemented and wired to `composer.elements`. The last three (`hasSeoTitle`, `hasMetaDesc`, `hasSocialImg`) are hardcoded `false` with TODO comments — always show incomplete."

---

## PROMPT 44: HISTORY & VERSIONING FLOW

**Frame name:** `44 — History Versioning Flow`
**Source:** PROMPT 14
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1200px

### Track A — Save Version (top):

```
[Save current version] btn  →  Name input modal  →  Version saved
                                                      ↓
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│ History          │          │ "Name this        │  │ History          │
│                  │          │  version"          │  │                  │
│ [Save current    │──click──→│                   │──│ Named versions:  │
│  version]        │          │ [____________]    │  │ ┌──────────────┐│
│                  │          │ Max 64 chars       │  │ │ "Header fix" ││
│ Named versions:  │          │                   │  │ │ Just now     ││
│ (none yet)       │          │ [Cancel] [Save]   │  │ │ [Current] 🟢 ││
│                  │          └──────────────────┘  │ └──────────────┘│
│ Auto-saves:      │                                │                  │
│ • Auto-saved 2m  │                                │ Auto-saves:      │
│ • Auto-saved 15m │                                │ • Auto-saved 2m  │
└──────────────────┘                                └──────────────────┘
```

### Track B — Restore Flow (bottom):

```
HOVER VERSION          CONFIRM DIALOG              RESTORING              RESTORED
┌──────────────┐      ┌────────────────────┐      ┌──────────────────┐   ┌──────────────────┐
│ Named vers:  │      │                    │      │                  │   │                  │
│ ┌──────────┐ │      │ Restore to         │      │ ⟳ Restoring...   │   │ [Current] badge  │
│ │"v1 Launch"│ │      │ "v1 Launch"?       │      │                  │   │ moves to         │
│ │ 2:30 PM   │──hover─│                    │      │ (full canvas     │   │ restored version │
│ │   [Restore]│──click│ Your current       │──yes─│  overlay)        │──→│                  │
│ └──────────┘ │      │ changes will be    │      │                  │   │ Toast: "Restored │
│              │      │ saved as auto-save │      │                  │   │ to v1 Launch"    │
│              │      │ first.             │      │                  │   │                  │
│              │      │                    │      │                  │   │ Auto-save created│
│              │      │ [Cancel] [Restore] │      │                  │   │ of prev state    │
│              │      │  ghost   destructive│      │                  │   │                  │
└──────────────┘      └────────────────────┘      └──────────────────┘   └──────────────────┘
```

**Flow connections:**

| From → To | Trigger | Arrow |
|-----------|---------|-------|
| Hover version row | [Restore] button appears | #908D85 |
| Click [Restore] | ConfirmDialog opens | #6366f1 |
| ConfirmDialog [Restore] | Current state auto-saved, then restore begins | #ef4444 (destructive) |
| ConfirmDialog [Cancel] | Dialog closes, no action | #908D85 |
| Restoring → Restored | Restore complete | #22c55e |

**⚠️ Known issue annotation:** "Compare versions is NOT implemented — no compare UI shown."

---

## PROMPT 45: MEDIA UPLOAD & MANAGEMENT FLOW

**Frame name:** `45 — Media Upload Management`
**Source:** PROMPT 6
**Pencil tool:** `batch_design`

**Flow frame:** 3000×1200px

### Track A — Upload Flow (top):

```
UPLOAD TRIGGER         UPLOADING              COMPLETE              IN GRID
┌──────────────┐      ┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐
│ ┌╌╌╌╌╌╌╌╌╌╌┐│      │ [filename.jpg]   │   │ ✓ Upload complete│  │ Library grid     │
│ ╎ Drop files ╎│      │ ████████░░ 67%   │   │                  │  │ ┌───┐ ┌───┐ ┌───┐│
│ ╎ here or    ╎│──→───│ 2.4 MB / 3.6 MB  │──→│ Toast: "Image   │──→│ │   │ │   │ │NEW││
│ ╎ click to   ╎│      │                  │   │ uploaded"        │  │ └───┘ └───┘ └───┘│
│ ╎ upload     ╎│      │ [Cancel upload]  │   │ green border-left│  │ ┌───┐ ┌───┐ ┌───┐│
│ └╌╌╌╌╌╌╌╌╌╌┘│      └──────────────────┘   └──────────────────┘  │ │   │ │   │ │   ││
└──────────────┘                                                    │ └───┘ └───┘ └───┘│
        │                                                           └──────────────────┘
        │ Also triggered by:
        ├─ Click upload zone
        └─ Drag file from OS onto zone
```

### Track B — Asset Interaction Flow (middle):

```
GRID VIEW              HOVER                  CLICK (DETAIL)         DRAG TO CANVAS
┌──────────────┐      ┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐
│ ┌───┐ ┌───┐ │      │ ┌───────────────┐│   │ Asset Detail      │  │                  │
│ │ img│ │ img│ │      │ │ overlay:      ││   │ ┌──────────────┐ │  │  Canvas:         │
│ └───┘ └───┘ │──hover│ │ filename.jpg  ││──→│ │              │ │  │  Image element   │
│ ┌───┐ ┌───┐ │      │ │ 2.4 MB · JPEG ││   │ │  Full preview│ │  │  inserted at     │
│ │ img│ │ img│ │      │ └───────────────┘│   │ │              │ │  │  drop position   │
│ └───┘ └───┘ │      └──────────────────┘   │ └──────────────┘ │  │                  │
│              │                             │ Name: hero.jpg   │  │  [snap lines     │
│              │──drag──→──→──→──→──→──→──→──│ Size: 2.4 MB     │  │   appear]        │
│              │                             │ Type: JPEG       │  │                  │
│              │                             │ Dims: 1920×1080  │  └──────────────────┘
│              │                             │                  │
│              │                             │ [Insert] [Delete]│
│              │                             └──────────────────┘
```

### Track C — Filter & Multi-select (bottom):

```
ALL FILTER            TYPE FILTER             MULTI-SELECT
┌──────────────┐     ┌──────────────────┐    ┌──────────────────┐
│ [All̲] Img Vid│     │ All [Img̲] Vid Doc│    │ Shift+click      │
│              │     │                  │    │ multiple items   │
│ All assets   │──→──│ Only images shown│    │                  │
│ shown        │     │ Others hidden    │    │ ┌───┐ ┌───┐     │
│              │     │                  │    │ │ ✓ │ │ ✓ │     │
│              │     │                  │    │ └───┘ └───┘     │
│              │     │                  │    │ Action bar:      │
│              │     │                  │    │ [Delete 2] [DL]  │
└──────────────┘     └──────────────────┘    └──────────────────┘
```

**Upload error branch:**
```
Uploading  →  Error: "File too large" or "Unsupported format"  →  Toast with guidance
              red border-left toast                                "Max 10MB · JPEG, PNG, SVG, GIF, WebP, AVIF"
```

---

## PROMPT 46: MODAL LIFECYCLE & TOAST SYSTEM

**Frame name:** `46 — Modal Lifecycle & Toasts`
**Source:** PROMPT 25, PROMPT 31
**Pencil tool:** `batch_design`

**Flow frame:** 2400×1400px

### Track A — Modal Lifecycle (top):

```
TRIGGER              OPENING                 OPEN                    CLOSING               CLOSED
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   ┌──────────────┐
│ User action  │    │ Backdrop fades in│    │ ┌──────────────┐ │    │ Backdrop fading  │   │              │
│ (click btn,  │    │ rgba(0,0,0,0→0.5)│    │ │              │ │    │ out              │   │ Focus returns│
│  keyboard    │──→─│                  │──→─│ │    Modal     │ │──→─│ Modal:           │──→│ to trigger   │
│  shortcut)   │    │ Modal:           │    │ │   content    │ │    │ opacity 1→0      │   │ element      │
│              │    │ opacity 0→1      │    │ │              │ │    │ scale 1→0.96     │   │              │
│              │    │ scale 0.96→1     │    │ │              │ │    │                  │   │              │
│              │    │ blur(0→2px)      │    │ └──────────────┘ │    │ 150ms ease-in    │   │              │
│              │    │ 150ms ease-out   │    │ [backdrop click] │    │                  │   │              │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘   └──────────────┘
```

**Close triggers (all lead to "Closing" state):**
- Click ✕ button
- Click backdrop (outside modal)
- Press Escape key
- Complete action (e.g., "Save" button)

### Track B — Toast Notification System (middle):

```
TRIGGER              APPEAR                  VISIBLE                 AUTO-DISMISS
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│              │    │          ┌──────┐│    │          ┌──────┐│    │          ┌──────┐│
│ Action       │    │          │Toast ││    │          │Toast ││    │          │      ││
│ completed    │──→─│          │slides││──→─│          │steady││──→─│          │fades ││
│ or error     │    │          │in    ││    │          │5000ms││    │          │out   ││
│              │    │          └──────┘│    │          └──────┘│    │          └──────┘│
│              │    │ translateX(120%)→0│    │                  │    │ opacity 1→0      │
│              │    │ 200ms ease-out   │    │ [× dismiss early]│    │ 200ms ease-in    │
└──────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

**Toast stacking (multiple toasts):**
```
┌──────────────────────────────┐
│                    ┌───────┐ │  ← Newest (top)
│                    │ Toast3│ │
│                    └───────┘ │
│                    ┌───────┐ │
│                    │ Toast2│ │
│                    └───────┘ │
│                    ┌───────┐ │
│                    │ Toast1│ │  ← Oldest (bottom, about to dismiss)
│                    └───────┘ │
│                              │
│  Position: top-right         │
│  Gap: 8px between toasts    │
│  Max visible: 3             │
└──────────────────────────────┘
```

### Track C — Toast Variants (bottom):

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  SUCCESS                    ERROR                      WARNING               │
│  ┌────────────────────┐    ┌────────────────────┐     ┌────────────────────┐ │
│  │▌✓ Element added    │    │▌✗ Save failed      │     │▌⚠ Large file      │ │
│  │▌                   │    │▌        [Retry]    │     │▌ May be slow      │ │
│  └────────────────────┘    └────────────────────┘     └────────────────────┘ │
│  border-left: #22c55e      border-left: #ef4444       border-left: #f59e0b  │
│                                                                              │
│  INFO                      ACTION TOAST                                      │
│  ┌────────────────────┐    ┌────────────────────┐                            │
│  │▌ℹ Syncing changes  │    │▌✓ Deleted.  [Undo] │                            │
│  │▌                   │    │▌                   │                            │
│  └────────────────────┘    └────────────────────┘                            │
│  border-left: #3b82f6      border-left: #22c55e + action button              │
│                                                                              │
│  All: bg surface-2, radius 8px, shadow-md, pad 12px 16px                    │
│  Icon 16px + message 13px Inter weight 500, duration 5000ms                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Wiring Verification Checklist

After generating all 14 flow frames (PROMPT 33–46), verify:

- [ ] Master flow map connects all 32 screens with correct arrow colors
- [ ] Rail → Panel flow shows all 6 states including toggle-close
- [ ] Pin/Unpin shows both pinned-stays-open and unpinned-closes-on-outside-click
- [ ] Settings drill-in shows all 6 cards with correct locked/unlocked targets
- [ ] Template flow shows the blank vs. has-content branching
- [ ] Onboarding shows all 4 steps with escape paths ("Explore freely")
- [ ] Inspector shows all 3 tracks: tabs, pseudo-states, breakpoints
- [ ] Canvas shows full interaction chain CS-0 through CS-9 + drag + escape paths
- [ ] Context menu shows submenu nesting and "Select from Stack"
- [ ] Command palette shows fuzzy search filtering live
- [ ] Publish flow shows all 5 states including error branch
- [ ] History shows save + restore flows with ConfirmDialog
- [ ] Media shows upload, filter, multi-select, drag-to-canvas, and error paths
- [ ] Modal lifecycle shows open → close animations + toast stacking + all 5 variants
- [ ] All connection arrows use correct color coding (indigo/green/red/amber/muted)
- [ ] All timing annotations match design tokens (100ms/150ms/200ms/300ms)
- [ ] Known issues annotated where relevant (⚠️)
