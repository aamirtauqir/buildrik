# Design System Tab

> **Module:** Sidebar — Tab 7
> **Source:** `src/editor/sidebar/tabs/DesignSystemTab.tsx` + `src/features/design-system/`
> **Keyboard Shortcut:** D
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The Design System tab manages global design tokens — reusable values for colors, typography, spacing, and effects that can be applied across the entire project. **Color tokens are displayed as a visual palette grid (not a text list)** because designers think visually. Changes to tokens automatically propagate in real-time to all elements using them. Tokens are exported as CSS custom properties (`--aqb-*`). An optional **Lock Tokens** toggle prevents accidental changes in multi-person projects.

## Layout

```
+---------------------------+
| Design System    [🔒 Lock]|
+---------------------------+
| [Colors] [Typography]     |
| [Spacing] [Effects]       |
+---------------------------+
| Colors (Visual Palette)   |
| +----+----+----+         |
| |Prim|Sec |Acc |         |
| |2563|6474|8B5C|         |
| |EB  |8B  |F6  |         |
| +----+----+----+         |
| +----+----+----+         |
| |BG  |Text|Mute|         |
| |FFFF|0F17|94A3|         |
| |FF  |2A  |B8  |         |
| +----+----+----+         |
| +----+----+----+         |
| |Bord|Succ|Err |         |
| |E2E8|22C5|EF44|         |
| |F0  |5E  |44  |         |
| +----+----+----+         |
| [+ Add Color Token]       |
+---------------------------+
| Typography                |
|  Heading Font  Inter      |
|  Body Font     Inter      |
|  Base Size     16px       |
|  Line Height   1.5        |
+---------------------------+
| Spacing                   |
|  XS   4px   ┃             |
|  SM   8px   ┃━━           |
|  MD   16px  ┃━━━━         |
|  LG   24px  ┃━━━━━━       |
|  XL   32px  ┃━━━━━━━━     |
+---------------------------+
| Effects                   |
|  Shadow SM  [preview box] |
|  Shadow MD  [preview box] |
|  Blur SM    [preview box] |
|  Blur MD    [preview box] |
+---------------------------+
| [Export Tokens ▾]         |
+---------------------------+
```

## Fields

### Token Categories (Tab Chips)
| Category | Token Types | Icon | Display Style |
|----------|------------|------|---------------|
| Colors | Color values (hex, rgb, hsl) | Palette | **Visual palette grid** — color swatches in a 3-column grid |
| Typography | Font families, sizes, line heights | Type | List with font previews (actual rendered text) |
| Spacing | Length values (px, rem) | Ruler | List with **proportional bar visualization** |
| Effects | Shadows, blurs | Sparkle | List with **visual preview boxes** showing the effect |

### Lock Tokens Toggle
| Element | Type | Behavior |
|---------|------|----------|
| Lock toggle | Toggle button in header | When locked: token values are read-only for all team members except the person who locked them. Prevents accidental token changes during active development. Unlocking requires the same user or project Owner. |

### Token List Item
| Element | Type | Behavior |
|---------|------|----------|
| Token name | Text (editable) | Double-click to rename |
| Token value | Display + editor | Click to edit; type-specific editor (color picker, number input, font selector) |
| CSS variable | Text (read-only) | Shows `--aqb-{name}` variable name |
| Delete button | Icon button | Remove token (with confirmation) |

### Color Token Editor
| Field | Type | Default | Notes |
|-------|------|---------|-------|
| Hex input | Text | Token value | 6-digit hex color code |
| Color picker | Color wheel | Token value | Visual color selection |
| RGB sliders | 3 x Range | From hex | Red, Green, Blue channels |
| HSL sliders | 3 x Range | From hex | Hue, Saturation, Lightness |
| Opacity | Range | 100% | Alpha channel |

### Export Options
| Format | Output | Use Case |
|--------|--------|----------|
| CSS Variables | `:root { --aqb-primary: #2563EB; ... }` | Direct CSS integration |
| JSON | `{ "primary": "#2563EB", ... }` | JavaScript/framework integration |
| **Tailwind Config** | `theme: { colors: { primary: "#2563EB" } }` | **Developer handoff** — bridge from design team to engineering team |

## Interactions

### Edit Token Value
- **Trigger:** Click token swatch (colors) or value area (others)
- **Behavior:** Type-specific editor opens inline → change value → **all elements using this token update in real-time on canvas** (auto-apply, no explicit "save" step)
- **Undo:** Token changes are tracked in history (undoable)
- **Locked state:** If tokens are locked, shows "Tokens locked by [user]. Unlock to edit." message

### Add New Token
- **Trigger:** Click "+ Add [Category] Token"
- **Behavior:** New token row/swatch appears with default name and value → name field in edit mode → user sets name and value

### Delete Token
- **Trigger:** Click delete icon on token row
- **Behavior:** Confirmation modal ("This token is used in N elements") → on confirm, token deleted → elements that referenced it fall back to the raw value

### Rename Token
- **Trigger:** Double-click token name
- **Behavior:** Name becomes editable → Enter confirms → CSS variable name auto-updates (`--aqb-{new-name}`)

### Export Tokens
- **Trigger:** Click "Export Tokens" button
- **Behavior:** Dropdown with format options → select format → tokens copied to clipboard or downloaded as file

### Lock / Unlock Tokens
- **Trigger:** Click lock toggle in header
- **Behavior:** Lock: all token values become read-only for other team members → lock icon appears → toast "Tokens locked". Unlock: editing re-enabled → toast "Tokens unlocked"
- **Permissions:** Any Editor/Owner can lock. Only the locking user or an Owner can unlock.

### Brand Setup Wizard (First-Time)
- **Trigger:** First time opening Design System tab with default tokens still untouched
- **Behavior:** Wizard overlay: "Set up your brand" → Step 1: Upload logo → AI extracts dominant colors → generates a harmonious token palette → Step 2: Confirm/adjust generated colors → Step 3: Choose heading + body fonts → tokens auto-populated
- **Skip:** Wizard can be skipped; default tokens remain
- **Powered by:** AI Assistant color palette generation

## Default Tokens (30+)

### Colors (9)
| Token | Default Value | CSS Variable |
|-------|--------------|-------------|
| Primary | #2563EB | `--aqb-primary` |
| Secondary | #64748B | `--aqb-secondary` |
| Accent | #8B5CF6 | `--aqb-accent` |
| Background | #FFFFFF | `--aqb-background` |
| Text | #0F172A | `--aqb-text` |
| Muted | #94A3B8 | `--aqb-muted` |
| Border | #E2E8F0 | `--aqb-border` |
| Success | #22C55E | `--aqb-success` |
| Error | #EF4444 | `--aqb-error` |

### Typography (4)
| Token | Default Value |
|-------|--------------|
| Heading Font | Inter |
| Body Font | Inter |
| Base Font Size | 16px |
| Line Height | 1.5 |

### Spacing (5)
| Token | Default Value |
|-------|--------------|
| XS | 4px |
| SM | 8px |
| MD | 16px |
| LG | 24px |
| XL | 32px |

### Effects (4)
| Token | Default Value |
|-------|--------------|
| Shadow SM | 0 1px 2px rgba(0,0,0,0.05) |
| Shadow MD | 0 4px 6px rgba(0,0,0,0.1) |
| Blur SM | 4px |
| Blur MD | 8px |

## Business Rules

1. **Token changes auto-apply in real-time** — no explicit "publish" step. Changes propagate instantly to all elements using the token's CSS variable.
2. **Lock Tokens toggle** prevents accidental changes in multi-person projects. Any Editor/Owner can lock; only the locking user or an Owner can unlock.
3. CSS variables follow the naming pattern `--aqb-{token-id}`
4. Token edits create undo entries (undoable/redoable)
5. Tokens are injected into `:root` via GlobalStyleManager
6. Export formats are for developer handoff — they generate code from current token values. **Tailwind Config export is prominently featured** as the bridge to engineering teams.
7. **Visual display is the default** — colors shown as palette grid, spacing as proportional bars, effects as preview boxes. No raw text lists.
8. Brand Setup Wizard activates on first-time use to reduce time-to-brand-setup

## Screen Relationships
- **To:** Canvas (token values applied via CSS variables), Inspector (color pickers show token values), Export (tokens included in exported code)
- **From:** AI Assistant (brand setup wizard, generated palettes), Media Tab (uploaded fonts)
- **Data coupling:** GlobalStyleManager injects tokens as CSS variables; all elements consuming `var(--aqb-*)` update automatically; SyncManager propagates token changes to team
