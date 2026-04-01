# Inspector Completeness — Design Spec
**Date:** 2026-03-28
**Sub-project:** 1 of 4 (Inspector → Sidebar → Settings/CMS → Missing flows)
**Scope:** Fill all missing inner states and section close-ups for the Buildrik inspector (right panel) in pencil.dev

---

## 1. Background

The inspector panel (`src/editor/inspector/`) has 3 tabs implemented in code:
- **Layout Tab** — Display, Size, Spacing, Position, Overflow, Flexbox (conditional), Grid (conditional)
- **Appearance Tab** — Typography, Background, Border
- **Effects Tab** — Effects, Animation, Interactions, Visibility, AI Suggestion

In pencil.dev, frames 34 (Layout), 35 (Style), and 42 (Effects) exist as shells. All inner sections are missing. Four element-type states (Text, Box, Image, Empty) are also missing.

---

## 2. Deliverables

### 2A — New frames (12)

| Frame | Name | Description |
|-------|------|-------------|
| 46 | Inspector: Text Selected | Full inspector, Appearance tab active, Typography section expanded |
| 47 | Inspector: Box/Container Selected | Full inspector, Layout tab active, Flexbox section shown |
| 48 | Inspector: Image Selected | Full inspector, Appearance tab, Image Fill section shown |
| 49 | Inspector: Empty State | No element selected, greyed-out tabs, "Nothing selected" hint |
| 50 | Section: Typography | Font family picker, weight/size row, line-height slider, letter-spacing, text align chips, decoration, color swatch |
| 51 | Section: Flexbox | Direction/wrap/justify/align chips, gap inputs, flex-item controls (grow, shrink, basis, self-align) |
| 52 | Section: Grid | Column/row template inputs, col/row gap, auto-flow chips, grid-item span controls |
| 53 | Section: Background | Solid/gradient/image type chips, full color picker (gradient bar, alpha bar, hex input, opacity) |
| 54 | Section: Border + Radius | Style chips, width, color, individual sides toggle, 4-corner radius grid |
| 55 | Section: Interactions | Trigger→action pairs (On Click, On Hover, On Scroll, On Load), add interaction button |
| 56 | Section: Animation | Trigger, preset dropdown, duration slider, delay, easing, In/Out direction, Preview button |
| 57 | Section: AI Suggestion Strip | Inline purple card at bottom of each tab: suggestion text, Apply fix, Dismiss |

### 2B — Existing frames to update (3)

| Frame | Current name | Changes |
|-------|-------------|---------|
| 34 | Inspector: Layout Tab | Add Flexbox section (frame 51) and Grid section (frame 52) · fill Position controls (absolute/relative/fixed/sticky, x/y/z inputs) · fill Overflow controls (visible/hidden/scroll/auto chips) |
| 35 | Inspector: Style Tab | Rename → "Appearance Tab" · add Typography (frame 50), Background (frame 53), Border (frame 54) sections |
| 42 | Inspector: Effects Tab | Add Animation (frame 56), Interactions (frame 55), Visibility section (conditional show/hide controls), AI Suggestion strip (frame 57) |

---

## 3. Control Specifications

### Typography Section (frame 50)
```
Font family    [Inter                        ▾]
Weight · Size  [400 ▾] [500] [700]   [16   px]
Line height    [━━━━━━━━━━━━━●━━━━]   [1.5    ]
Letter-spacing [0                       em    ]
Align          [≡] [⌘] [≣] [⊡]
Decoration     [U̲] [S̶] [I]
Color          [■ #E2E8F0]  [100%]
```

### Flexbox Section (frame 51)
```
Direction   [→] [↓] [←] [↑]
Wrap        [No wrap] [Wrap]
Justify     [|←] [⊣⊢] [→|] [↔] [≡]
Align       [⊤] [⊥] [⊕] [stretch]
Gap         [8  px] [8  px]  ← col · row

── Flex Item (when child of flex container) ──
Grow · Shrink  [0] [1]
Basis          [auto          ]
Self align     [Auto          ▾]
```

### Grid Section (frame 52)
```
Columns    [1fr 1fr 1fr              ]
Rows       [auto auto                ]
Col gap    [16  px]
Row gap    [16  px]
Auto flow  [Row] [Column] [Dense]

── Grid Item ──
Col span   [1]
Row span   [1]
Self align [Stretch ▾]
```

### Background Section (frame 53)
```
Type  [Solid] [Gradient] [Image] [None]

── Solid ──
Color picker:
  [saturation/brightness gradient square]
  [hue bar]
  [alpha bar]
Hex   [#6366F1]   Opacity [100%]

── Gradient (when selected) ──
Type  [Linear] [Radial] [Angular]
Angle [135°]
[gradient stop editor]

── Image (when selected) ──
[thumbnail]  [Replace]
Fit   [Fill] [Fit] [Stretch] [Tile]
Position  X [50%]  Y [50%]
```

### Border + Radius Section (frame 54)
```
── Border ──
Style  [—] [- -] [···] [✕ none]
Width  [1  px]
Color  [■ #334155]
Sides  [All] [Top] [Right] [Bottom] [Left]

── Border Radius ──
[⌐ 8px] [¬ 8px]
[L 8px] [J 8px]
[Link corners toggle]
```

### Interactions Section (frame 55)
```
[On Click  →  Navigate to  /about        ] [✕]
[On Hover  →  Toggle class  .hover-state ] [✕]
[+ Add interaction]

Trigger options: On Click · On Hover · On Scroll · On Load · On Mouse Enter · On Mouse Leave
Action options:  Navigate · Toggle class · Show/Hide · Run animation · Open modal · Submit form
```

### Animation Section (frame 56)
```
Trigger   [On load] [On scroll] [On click]
Preset    [Fade In                        ▾]
Duration  [━━━━━━━━━━━━━●━━━━━]   [0.4  s]
Delay     [0                          s   ]
Easing    [ease-out                       ▾]
Direction [In] [Out] [In + Out]
[▶ Preview animation]
```

### AI Suggestion Strip (frame 57)
- Appears at the bottom of each inspector tab when an element is selected
- Purple gradient card (`rgba(99,102,241,0.12)` background, `rgba(99,102,241,0.25)` border)
- Shows one contextual suggestion at a time (e.g. contrast warning, layout tip, copy suggestion)
- Actions: **Apply fix** (primary, applies suggestion directly) · **Dismiss** (ghost, removes card)
- If no suggestion is available, strip is hidden (zero height)

---

## 4. Design Constraints

- **Dark theme only.** All controls use existing CSS variables: `$--font-primary`, `$--font-secondary`, `$--surface-1`, `$--surface-2`, `$--border-subtle`
- **Existing components.** Use `InputField`, `TabPill/active`, `TabPill/inactive`, `InspectorEmptyState` (VBC3E) from the pencil.dev component library. No new reusable components needed except the shared inspector widgets below.
- **New reusable components to build first** (placed off-canvas, used across frames 46–57):
  - `InspectorInputRow` — label + one or two input fields in a row
  - `InspectorChipGroup` — label + chip row (single-select or multi-select)
  - `InspectorColorRow` — label + color swatch + hex input + opacity input
  - `InspectorSliderRow` — label + slider + numeric input
  - `InspectorSectionHeader` — collapsible section header (▼/▶ + label + optional badge)
- **High fidelity.** Controls are drawn with actual UI widgets (not placeholder boxes). Font sizes, spacing, and colors match the existing inspector shell.
- **Prefer layout over hardcoded sizes.** Use `fill_container` and `fit_content` in pencil.dev layouts wherever possible. Use design token variables (e.g. `$spacing-sm`, `$spacing-md`) for gap and padding values rather than raw numbers where tokens exist.

---

## 5. Build Order

### Phase 1 — Reusable widgets (off-canvas)
Build 5 shared inspector widgets before any frames. These are the building blocks for all 12 frames.

### Phase 2 — Section close-ups (frames 50–57)
Build each section in isolation. Validate each with `get_screenshot` before moving on. Order:
1. Typography (50) — most complex, sets the bar
2. Background (53) — color picker is the trickiest widget
3. Flexbox (51) + Grid (52) — chip-heavy, build together
4. Border + Radius (54)
5. Interactions (55) + Animation (56) — build together (similar trigger pattern)
6. AI Suggestion strip (57) — simple, last

### Phase 3 — Full-state frames (frames 46–49)
Assemble full inspector views composing the section components. Order: Text (46) → Box (47) → Image (48) → Empty (49).

### Phase 4 — Update existing frames (34, 35, 42)
Fill in the 3 existing tab shells using the new section components. Rename frame 35 from "Style Tab" to "Appearance Tab".

---

## 6. Out of Scope

- Inspector for component instances (variant switching, component props) — covered in Sub-project 2
- Inspector: Custom CSS / All CSS section — complex enough for a dedicated frame, deferred to Sub-project 2
- Inspector: Data attributes / Element properties section — deferred to Sub-project 2
- Responsive inspector states (what changes at each breakpoint) — deferred to Sub-project 3

---

## 7. Success Criteria

- All 12 new frames committed to pencil.dev with `placeholder: false`
- All 3 existing frames updated
- Every control in every section is drawn at full fidelity (no placeholder boxes)
- All frames use design tokens, not hardcoded hex values
- `get_screenshot` taken for every frame and visually verified
