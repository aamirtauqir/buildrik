# Module 08 — Design System & Tokens

## Problem

The Design System tab exists with color, typography, and spacing token management. The features/design-system module has 23 files (4k LOC) with UI, state hooks, and export logic. But: the draft chip is visually subtle, the review modal is basic, token export formats are unclear, and design tokens aren't connected to the inspector color/font pickers. Tokens exist in isolation — they should be the first thing a designer sees when picking a color or font.

## Requirements

### Token Management
- **Color tokens:** Create, edit, delete. Swatch + token name + hex value. Color picker for editing.
- **Typography tokens:** Create, edit, delete. Preview ("Aa") + token name + font/size/weight details. Font picker for editing.
- **Spacing tokens:** Create, edit, delete. Visual bar + token name + px value.
- All tokens: drag to reorder, search/filter

### Draft / Review / Apply Workflow
- Any token change creates a "draft" (unsaved change)
- Draft indicator clearly visible: count of unsaved changes
- "Review Changes" opens diff view: before → after for each changed token
- "Apply All" commits all draft changes to the project
- "Revert" discards all draft changes
- Tab guard: switching away from Design tab with unsaved drafts → confirmation

### Export
- Export button with format picker:
  - CSS Variables: `--token-name: value;`
  - JSON: structured object
  - SCSS: `$variables`
  - Tailwind: theme extension config
- Download or copy to clipboard

### Inspector Integration
- When user opens a color picker in inspector → project color tokens shown first (before generic colors)
- When user opens font picker → project typography tokens shown first
- Tokens act as a shared vocabulary between Design tab and Inspector

## Flows

### Set Up Design Tokens
1. Open Design tab (D) → see empty token sections
2. Click "+ Add color" → name: "Primary", value: pick indigo → token created
3. Add more colors: Secondary, Background, Text, Accent
4. Draft indicator shows "5 unsaved"
5. Click "Review" → see all 5 new tokens → "Apply All" → tokens saved
6. Now in inspector: open any color picker → "Project Colors" section shows these 5 tokens

### Update a Token
1. Open Design tab → click edit on "Primary" color
2. Change from indigo to blue → draft indicator: "1 unsaved"
3. Click "Review" → see: Primary: #6366f1 → #3b82f6
4. "Apply All" → all elements using this token update on canvas

### Export Tokens
1. Click export button in Design tab header
2. Choose "CSS Variables"
3. Generated output: `--primary: #3b82f6; --secondary: ...`
4. Copy to clipboard or download as file

## Engine APIs

| Surface | API | Key Methods |
|---------|-----|------------|
| Global styles | `composer.globalStyles` | getTokens(), setToken(), deleteToken() |
| Fonts | `composer.fonts` | loadFont(), getAvailableFonts() |
| Design system state | `features/design-system/state/` | useColorTokens(), useTypographyTokens(), useSpacingTokens() |
| Export | `features/design-system/utils/` | exportCSS(), exportJSON(), exportSCSS(), exportTailwind() |

## Constraints

- Token changes must not auto-apply — always go through draft/review cycle (U5: preview before commit)
- Tokens must be available in inspector pickers without opening Design tab
- Token names must be unique within their type (no two colors named "Primary")
- Export must handle all current tokens in one operation

## Reference

- **Figma Variables:** Token management, scoping, mode switching
- **Webflow Design Tokens:** Color/type/spacing with project-wide application
- **Tailwind Config:** Token export format for developer handoff
