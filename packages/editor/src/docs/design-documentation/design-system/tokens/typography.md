---
title: Typography Tokens
description: Type scale, font stacks, weights, and responsive rules
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../style-guide.md
status: approved
---

# Typography Tokens

## Font Stacks
- **Sans:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Mono:** `'JetBrains Mono', 'Fira Code', Consolas, monospace`

## Type Scale

| Token | Size | Line Height | Weight | Spacing | Usage |
|-------|------|-------------|--------|---------|-------|
| `heading-xl` | 24px | 32px | 700 | -0.02em | Modal titles |
| `heading-lg` | 18px | 26px | 600 | -0.01em | Panel titles |
| `heading-md` | 15px | 22px | 600 | -0.01em | Section headers |
| `heading-sm` | 13px | 18px | 600 | 0 | Card titles, subsections |
| `body` | 13px | 20px | 400 | 0 | Standard UI text |
| `body-sm` | 12px | 18px | 400 | 0 | Secondary info |
| `caption` | 11px | 16px | 400 | 0.02em | Badges, shortcuts |
| `label` | 11px | 16px | 500 | 0.04em | Form labels (uppercase) |
| `code` | 12px | 18px | 400 | 0 | Code blocks (monospace) |

## Weights
Light: 300 | Regular: 400 | Medium: 500 | Semibold: 600 | Bold: 700

## Rules
1. **Editor UI caps at 13px body.** Dense editor interfaces need small type. Inter is optimized for this.
2. **Canvas content uses the user's own typography.** The type scale above is ONLY for editor chrome.
3. **No type below 11px.** Even captions stay at 11px for readability.
4. **Monospace only for code.** CSS values, dev mode, code editor. Never for UI labels.
