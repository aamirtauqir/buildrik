# UI Design Systems Reference

This is the UI counterpart to heuristics.md. While heuristics covers "does it work?" (UX), this file covers "does it look and feel right?" (UI). Read this when you need to evaluate or prescribe visual design improvements.

## The UI Evaluation Framework

Evaluate every interface through these 7 UI dimensions:

```
1. COLOR SYSTEM      → Is there one source of truth? Is it harmonious?
2. TYPOGRAPHY        → Is the type scale consistent? Readable? Hierarchical?
3. SPACING & LAYOUT  → Is spacing systematic? Is the grid coherent?
4. COMPONENT LIBRARY → Are components consistent across the product?
5. ICONOGRAPHY       → Is the icon style unified? Sized correctly?
6. MOTION & MICRO    → Do animations serve a purpose? Are they consistent?
7. VISUAL HIERARCHY  → Can you tell what's most important in 2 seconds?
```

---

## 1. Color System

### Audit Checklist

- [ ] **Single source of truth**: All colors come from one token file / CSS variable set — no hardcoded hex values in components
- [ ] **Named semantically**: `--color-danger` not `--color-red-500`. Semantic names survive rebranding.
- [ ] **Consistent surfaces**: Background layers follow a clear depth scale (e.g., bg-0 → bg-1 → bg-2 → bg-3 for increasing elevation)
- [ ] **State colors defined**: Every interactive element has 5 states — default, hover, active/pressed, focus, disabled
- [ ] **Maximum palette size**: No more than 6 brand colors + 3 semantic (success/warning/danger) + 2 neutral scales (gray + alpha)
- [ ] **Dark/light mode**: If both exist, every token has both values. No color is hardcoded in components.

### Common Problems and Fixes

| Problem | What You See | Fix |
|---------|-------------|-----|
| Multiple color systems | 3 files define "primary blue" differently | Create single tokens file, derive CSS vars from it |
| Hardcoded hex in components | `color: #7c6dfa` inline in component files | Replace with token reference `color: var(--primary)` |
| No hover states | Buttons look the same on hover | Add `hover` variant: lighten 8% for dark bg, darken 8% for light bg |
| Disabled looks like default | Can't tell if button is clickable | Disabled: 40% opacity + `cursor: not-allowed` |
| Too many grays | 12 different gray values across the app | Consolidate to 5-6: `gray-50, gray-100, gray-300, gray-500, gray-700, gray-900` |

### Color Prescription Pattern

When prescribing colors, always use this format:
```
Token name: --color-primary
Value (dark): #00A3FF
Value (light): #0066CC
Usage: Primary actions, active states, links
Contrast against bg: 6.2:1 ✅ (passes AA and AAA)
```

### Color Harmony Rules

- **Primary action** = 1 strong accent color. Use it for CTAs, active tabs, selected states. Never more than 2 primary accent colors.
- **Semantic trio** = Success (green family), Warning (amber family), Danger (red family). These are universal — don't be creative with them.
- **Surface scale** = 3-5 background levels with increasing lightness (light mode) or brightness (dark mode). Each level: ~3-5% difference.
- **Text scale** = Primary (highest contrast), Secondary (medium), Muted (lower, but still WCAG AA), Disabled (no minimum, but visible).
- **Border scale** = Subtle (dividers, ~8% opacity white/black), Default (containers, ~15%), Strong (hover/focus, ~30%).

---

## 2. Typography

### Audit Checklist

- [ ] **Maximum 2 font families**: One for headings, one for body. Exception: monospace for code.
- [ ] **Type scale follows a ratio**: Common ratios — 1.2 (minor third), 1.25 (major third), 1.333 (perfect fourth)
- [ ] **Maximum 5 size steps**: Page title, section header, body, caption, micro (badges)
- [ ] **Line height scales inversely**: Larger text → tighter line height. Body (1.5–1.6), Headings (1.1–1.3), Micro (1.2)
- [ ] **Font weight has purpose**: Regular (body), Medium (labels/nav), Semibold (section heads), Bold (page titles). Maximum 3-4 weights.
- [ ] **No orphans in headings**: Long headings should break sensibly (use `text-wrap: balance` where supported)
- [ ] **Minimum readable size**: 14px desktop body, 16px mobile body, 11px absolute minimum (only for timestamps/badges)

### Type Scale Template

Define a type scale system for any product:

```
--text-display:  24px / 1.2 / Bold      → Page titles, hero text
--text-heading:  18px / 1.3 / Semibold   → Section headers
--text-body:     14px / 1.5 / Regular    → Default text, descriptions
--text-caption:  12px / 1.4 / Medium     → Labels, metadata, secondary info
--text-micro:    11px / 1.3 / Medium     → Badges, timestamps, fine print
```

### Font Pairing Recommendations

For product/tool interfaces (readable, professional):
- **Clean pairs**: DM Sans + Inter, Instrument Sans + Source Sans 3, General Sans + Satoshi
- **Character pairs**: Space Grotesk + Work Sans, Outfit + Plus Jakarta Sans, Geist + Geist Mono

For marketing/landing pages (more personality):
- **Modern pairs**: Cabinet Grotesk + Instrument Sans, Clash Display + Satoshi
- **Editorial pairs**: Playfair Display + Source Serif, Fraunces + Inter

Avoid these overused defaults: Arial, Helvetica alone, Times New Roman, Roboto alone, system-ui alone

### Typography Issues Pattern

| Problem | What You See | Fix |
|---------|-------------|-----|
| Too many sizes | 8+ different font sizes | Consolidate to 5-step scale |
| No weight hierarchy | Everything is Regular or everything is Bold | Assign weights to roles: body=Regular, labels=Medium, headings=Semibold |
| Tight body text | Long paragraphs feel cramped | Line-height 1.5 minimum for body, max-width 65ch for readability |
| ALL CAPS overuse | Multiple headings in ALL CAPS | Reserve ALL CAPS for micro labels only (11px, letter-spacing 0.05em) |
| Inconsistent alignment | Mix of left-align and center-align in same context | Left-align everything except hero sections and empty states |

---

## 3. Spacing & Layout

### Audit Checklist

- [ ] **Consistent base unit**: All spacing is a multiple of the base (usually 4px or 8px)
- [ ] **Spacing scale defined**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (or subset)
- [ ] **Component internal padding is consistent**: All cards use same padding, all buttons use same padding
- [ ] **Spacing between elements follows pattern**: Related items closer together, unrelated items farther apart (Gestalt proximity)
- [ ] **Grid system**: Layout uses a defined grid (12-column, or CSS Grid with named areas)
- [ ] **Consistent border-radius**: Maximum 3-4 radius values (small=4, medium=8, large=12, pill=9999)
- [ ] **No magic numbers**: No random values like 7px, 13px, 22px that don't fit the system

### Spacing Scale Template

```
--space-0:   0px     → No space
--space-1:   4px     → Tight: icon-to-label, inline gaps
--space-2:   8px     → Default: between related items
--space-3:   12px    → Comfortable: list items, form rows
--space-4:   16px    → Section internal padding
--space-5:   20px    → Component padding (cards, panels)
--space-6:   24px    → Between sections
--space-8:   32px    → Major section separation
--space-10:  40px    → Page-level spacing
--space-12:  48px    → Hero/header breathing room
--space-16:  64px    → Page top/bottom margins
```

### Border-Radius Scale

```
--radius-sm:   4px    → Buttons, inputs, badges
--radius-md:   8px    → Cards, dropdowns, tooltips
--radius-lg:   12px   → Modals, panels, large cards
--radius-xl:   16px   → Feature cards, hero sections
--radius-full: 9999px → Pills, avatars, round buttons
```

### Layout Patterns

**Sidebar + Content** (most common for tools/dashboards):
```
| 56px rail | 240-300px sidebar | 1fr canvas | 280-320px inspector |
```
- Rail: icons only, fixed
- Sidebar: collapsible, scrollable content
- Canvas/Content: fluid, minimum 500px
- Inspector: conditional, appears on selection

**Stacked** (most common for mobile, settings):
```
[ Header 52-64px ]
[ Content: max-width 640px, centered ]
[ Footer (optional) ]
```

**Dashboard Grid**:
```
[ 2-4 stat cards in row ]
[ Main chart: full width ]
[ 2-3 secondary panels in grid ]
```

---

## 4. Component Consistency

### Audit Checklist

- [ ] **Button hierarchy clear**: Primary (1 per screen), Secondary (unlimited), Ghost/Text (de-emphasized)
- [ ] **Input styling uniform**: All inputs same height, same border, same focus ring
- [ ] **Card pattern consistent**: All cards use same radius, shadow, padding
- [ ] **Modal pattern consistent**: All modals same overlay opacity, same animation, same close behavior
- [ ] **Empty states consistent**: Same illustration style, same layout, same CTA pattern
- [ ] **Loading states consistent**: Same skeleton style, same spinner, same shimmer direction

### Button Specification Template

When prescribing button fixes, specify all 5 states:

```
PRIMARY BUTTON:
  Default:  bg=primary, text=white, border=none
  Hover:    bg=primary-hover (8% lighter), shadow-sm
  Active:   bg=primary-active (4% darker), shadow-none, scale(0.98)
  Focus:    ring 2px offset 2px primary color
  Disabled: opacity 0.4, cursor not-allowed

  Sizes:
    SM: height 32px, padding 0 12px, font 13px
    MD: height 40px, padding 0 16px, font 14px (default)
    LG: height 48px, padding 0 24px, font 15px
```

### Input Specification Template

```
TEXT INPUT:
  Default:  bg=surface-secondary, border=1px border-default, radius-sm
  Hover:    border=border-strong
  Focus:    border=primary, ring 2px primary at 25% opacity
  Error:    border=danger, ring 2px danger at 25% opacity
  Disabled: opacity 0.5, bg=surface-tertiary, cursor not-allowed

  Height: 40px (MD) or 44px (touch-optimized)
  Padding: 12px horizontal
  Label: 13px medium, 4px margin-bottom
  Helper text: 12px caption, 4px margin-top
  Error text: 12px danger color, 4px margin-top, replaces helper
```

### Component Audit Shortcut

For any product, check these 8 components — they cover 80% of the UI:

1. **Button** (primary, secondary, ghost, icon-only)
2. **Input** (text, textarea, select/dropdown)
3. **Card** (content container with optional header/footer)
4. **Modal/Dialog** (overlay with content)
5. **Toast/Notification** (feedback message)
6. **Tooltip** (hover info)
7. **Badge/Tag** (status indicator)
8. **Empty State** (no content placeholder)

If these 8 are consistent, the product will feel cohesive even if other components vary slightly.

---

## 5. Iconography

### Audit Checklist

- [ ] **Single icon library**: All icons from one source (Lucide, Heroicons, Phosphor, etc.) — no mixing
- [ ] **Consistent size scale**: 16px (inline/small), 20px (default), 24px (prominent), 32px (featured)
- [ ] **Consistent stroke weight**: All icons same stroke width (1.5px or 2px)
- [ ] **Color inherits from parent**: Icons use `currentColor`, not hardcoded color
- [ ] **Accessible**: Every standalone icon has aria-label; decorative icons have aria-hidden="true"
- [ ] **Touch target wraps icon**: Icon may be 16px but clickable area is 44×44px minimum

### Icon Size Rules

| Context | Icon Size | Touch Target | Example |
|---------|-----------|-------------|---------|
| Inline with text | 16px | N/A (not clickable) | Status indicators, bullet replacements |
| Button with icon + text | 16-18px | Inherits from button | "⊕ Add item" buttons |
| Icon-only button | 20px | 44×44px minimum | Toolbar actions, close buttons |
| Navigation/tab bar | 20-24px | 44×44px minimum | Rail icons, bottom nav |
| Feature illustration | 32-48px | N/A | Empty state icons, onboarding |

---

## 6. Motion & Micro-interactions

### Audit Checklist

- [ ] **Duration scale defined**: Fast (100-150ms), Normal (200-250ms), Slow (300-400ms)
- [ ] **Easing is consistent**: Ease-out for entrances, ease-in for exits, ease-in-out for state changes
- [ ] **No animation on error states**: Errors appear instantly — don't slide/fade them in
- [ ] **Reduced motion respected**: `@media (prefers-reduced-motion: reduce)` disables non-essential animation
- [ ] **Loading has motion**: Skeleton shimmer, spinner rotation, progress bar fill — never frozen screen
- [ ] **Hover feedback < 100ms**: Buttons, links, cards respond to hover within 100ms

### Motion Duration Guide

```
--duration-instant: 0ms      → Error messages, validation
--duration-fast:    100ms    → Hover states, active states, tooltips
--duration-normal:  200ms    → Panel open/close, tabs switch, toasts appear
--duration-slow:    300ms    → Page transitions, modals, complex reveals
--duration-slower:  500ms    → Only for dramatic effect (celebration animation)
```

### Common Micro-interaction Patterns

| Interaction | Animation | Duration | Easing |
|------------|-----------|----------|--------|
| Button hover | Background color shift | 100ms | ease-out |
| Button press | Scale to 0.97, then back | 150ms | ease-in-out |
| Dropdown open | Opacity 0→1 + translateY(-4→0) | 150ms | ease-out |
| Modal enter | Overlay fade + content scale(0.95→1) | 200ms | ease-out |
| Modal exit | Reverse of enter | 150ms | ease-in |
| Toast appear | translateY(-8→0) + opacity 0→1 | 200ms | ease-out |
| Toast dismiss | opacity 1→0 + translateY(0→-8) | 150ms | ease-in |
| Skeleton shimmer | Linear gradient sweep left→right | 1.5s loop | linear |
| Success check | SVG path draw + scale bounce | 400ms | spring |
| Tab switch | Indicator slides to new tab | 200ms | ease-in-out |

---

## 7. Visual Hierarchy

### The 2-Second Test

Show any screen to someone for 2 seconds, then ask:
1. "What is this screen for?" — They should know the purpose
2. "What should I do first?" — They should identify the primary CTA
3. "What's most important here?" — They should point to the correct element

If they can't answer all 3, the visual hierarchy is broken.

### Hierarchy Tools (ranked by strength)

```
STRONGEST → WEAKEST:
1. Size          — Largest element gets attention first
2. Color/Contrast — Bright accent on muted background
3. Position      — Top-left (LTR) gets read first
4. White space   — Isolated elements feel important
5. Weight        — Bold stands out from regular
6. Depth         — Shadows/elevation lift elements forward
7. Motion        — Animated elements draw the eye (use sparingly)
```

### Common Hierarchy Failures

| Problem | Symptom | Fix |
|---------|---------|-----|
| Everything is bold | Nothing stands out | Use bold for headings only; body text regular weight |
| Too many CTAs | User doesn't know which button to click | 1 primary button per screen, rest secondary or ghost |
| No visual anchor | Eyes wander with no focal point | Make the hero/primary content 2x size of everything else |
| Uniform density | Wall of same-sized text/cards | Vary card sizes, add a featured/hero card that's larger |
| Competing colors | 4 bright colors fight for attention | 1 accent color for actions, everything else neutral |

---

## UI Redesign Workflow

When the user asks to **improve the UI** (not just audit it), follow this sequence:

### Step 1: Establish the Design Tokens

Before touching any component, define:
```
Colors:     5-6 semantic tokens (primary, surface scale, text scale, states)
Typography: 5-step scale (display, heading, body, caption, micro)
Spacing:    8-12 step scale based on 4px unit
Radius:     4 values (sm, md, lg, full)
Shadows:    3 levels (sm, md, lg)
Duration:   3 speeds (fast, normal, slow)
```

### Step 2: Fix the 8 Core Components

Apply tokens to: Button, Input, Card, Modal, Toast, Tooltip, Badge, Empty State.
Get these right and 80% of the product looks consistent.

### Step 3: Apply to Screens

Work through screens in priority order (most-used first).
For each screen: set hierarchy (what's primary?), apply components, verify spacing grid.

### Step 4: Add Motion

Only after layout and components are solid.
Add hover states → loading states → transitions → celebration micro-interactions.

### Step 5: Responsive Check

Test at 5 breakpoints: 375px, 768px, 1024px, 1440px, 1920px.
Fix layout issues from smallest to largest viewport.

---

## Quick UI Scoring Rubric

Use this to give a product a fast UI score (1-5 per dimension):

| Dimension | 1 (Broken) | 3 (Functional) | 5 (Excellent) |
|-----------|-----------|----------------|---------------|
| Color | No system, random hex everywhere | Token file exists, mostly used | Single source, semantic names, all states covered |
| Typography | 8+ sizes, no scale, mixed fonts | Scale exists, mostly followed | 2 fonts, 5 sizes, perfect hierarchy |
| Spacing | Random values, no grid | 4px base mostly used | Strict grid, no magic numbers |
| Components | Every instance styled differently | Shared components exist, some inconsistency | 8 core components fully spec'd and consistent |
| Icons | Mixed libraries, inconsistent sizes | One library, sizes mostly right | One library, consistent stroke, proper touch targets |
| Motion | No animation or jarring/slow | Basic hover states exist | Full motion system, reduced-motion respected |
| Hierarchy | Can't find the CTA in 2 seconds | Primary action visible but competing elements | Clear focal point, obvious CTA, clean scanpath |

**Score 7-15**: Major UI overhaul needed — start from tokens up
**Score 16-25**: Solid foundation, needs component consistency pass
**Score 26-35**: Production-ready, focus on motion and micro-interactions
