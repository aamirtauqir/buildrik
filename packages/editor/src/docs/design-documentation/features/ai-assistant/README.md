---
title: AI Assistant — Intelligent Design Aid
description: Design specification for the AI chat interface with content generation, layout suggestions, and accessibility audit
feature: ai-assistant
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../design-system-tab/README.md
  - ../inspector/README.md
dependencies:
  - Design System Tab (powers Brand Setup Wizard)
  - Inspector (AI suggestions appear in Effects tab)
status: approved
---

# AI Assistant — Intelligent Design Aid

## Overview

The AI Assistant provides a chat interface plus quick-action prompts for content generation, layout suggestions, color palette generation, and accessibility auditing. Responses include confidence levels to help users evaluate suggestions. The AI also powers the Brand Setup Wizard in the Design System Tab. Rate limited to 30 requests per minute per user.

**Primary User Goal:** Get intelligent design help without leaving the editor.
**Success Criteria:** AI suggestions are actionable (one-click apply) and correctly confidence-tagged.
**Key Pain Points Addressed:** Eliminates context-switching to external AI tools; integrates suggestions directly into the design workflow.

---

## Layout Architecture

```
┌──────────────────────────────┐ 320px
│ AI Assistant          [✕]    │ Header + close
├──────────────────────────────┤
│ Quick Prompts                │
│ [Generate Copy] [Fix A11y]   │
│ [Suggest Layout] [Colors]    │ Quick action chips
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ 🤖 How can I help with   │ │
│ │    your design?           │ │ AI welcome message
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 👤 Generate hero copy     │ │ User message
│ │    for a SaaS landing     │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🤖 Here are 3 options:   │ │
│ │                           │ │
│ │ 🟢 HIGH CONFIDENCE        │ │ Confidence tag
│ │ "Build faster with..."   │ │
│ │ [Apply to Selection]      │ │
│ │                           │ │
│ │ 🟡 MEDIUM CONFIDENCE      │ │
│ │ "Transform your..."      │ │
│ │ [Apply to Selection]      │ │
│ │                           │ │
│ │ 🔵 SUGGESTION             │ │
│ │ "Empower teams to..."    │ │
│ │ [Apply to Selection]      │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ [Type a message...    ] [▸]  │ Input + send
│ 28/30 requests remaining     │ Rate limit counter
└──────────────────────────────┘
```

---

## Screen States

### State 1: Default (Empty Chat)

- **Quick prompts:** 4 pill buttons in 2x2 grid. `--aqb-chrome-surface` bg, `--aqb-chrome-border`, `--aqb-radius-full`.
- **Welcome message:** AI avatar + greeting. `--aqb-body`, `--aqb-text-secondary`.
- **Input:** Full-width, 40px height, `--aqb-chrome-surface` bg, send button `--aqb-primary`.

### State 2: Content Generation Response

- **User message:** Right-aligned bubble, `--aqb-primary-subtle` bg.
- **AI response:** Left-aligned bubble, `--aqb-chrome-surface` bg, `--aqb-chrome-border` border.
- **Confidence tags:**
  - High (green): `--aqb-success` badge — AI is confident this is correct/good
  - Medium (yellow): `--aqb-warning` badge — reasonable but user should review
  - Suggestion (blue): `--aqb-info` badge — creative option, may not fit
- **Apply button:** Each suggestion has [Apply to Selection], `--aqb-primary` text, ghost style. Applies content to the currently selected canvas element.

### State 3: Layout Suggestion

- **Visual:** Miniature layout wireframes (120x80px) showing suggested arrangements.
- **Each option:** Wireframe + description + confidence tag + [Apply Layout] button.
- **Apply:** Restructures selected container's children according to the suggested layout.

### State 4: Color Palette Generation

- **Visual:** Generated palette swatches (5-7 colors) shown as a horizontal strip.
- **Each palette:** Color row + name (e.g., "Warm Professional") + [Apply to Design System] button.
- **Apply:** Updates design tokens in the Design System Tab.

### State 5: Accessibility Audit

- **Results:** List of issues found, sorted by severity (Critical → Warning → Info).
- **Each issue:** Element reference (clickable → selects on canvas), description, fix suggestion.
- **One-click fix:** [Fix] button for auto-fixable issues (e.g., add alt text, fix heading order).
- **Score:** Overall accessibility score at top.

### State 6: Rate Limited

- **Counter:** "0/30 requests remaining" in `--aqb-error` text.
- **Input:** Disabled with "Rate limit reached. Resets in [time]." placeholder.
- **Timer:** Countdown to next available request.

### State 7: AI Thinking

- **Indicator:** Typing animation (3 bouncing dots) in AI message bubble.
- **Duration indicator:** "Thinking..." text for responses taking > 2s.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click quick prompt | Pre-fills and sends the prompt | Message appears, AI responds |
| Type + send message | User message appears, AI generates response | Typing indicator, then response fade-in |
| Click [Apply to Selection] | Content/layout applied to selected element | Canvas updates, toast confirmation |
| Click element reference in audit | Selects that element on canvas + inspector | Canvas scrolls to element |
| Click [Fix] on audit issue | Auto-applies the fix | Green checkmark on issue |
| Close assistant | Panel slides closed | Slide-out right, 200ms |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Panel open | < 100ms |
| AI response (content generation) | < 3s |
| AI response (layout suggestion) | < 5s |
| AI response (accessibility audit) | < 5s |
| Apply suggestion to canvas | < 100ms |
| Rate limit: requests per minute | 30 per user |

---

## Accessibility

- **Chat messages:** `role="log"`, `aria-live="polite"` for new messages
- **Confidence tags:** `aria-label="[Level] confidence"` on each badge
- **Quick prompts:** `role="button"`, keyboard accessible
- **Input field:** `aria-label="Message AI assistant"`, Enter to send
- **Apply buttons:** `aria-label="Apply [suggestion type] to selected element"`
- **Rate limit:** Announced via `aria-live` when limit is reached

---

## Implementation Notes

- AI calls routed through `ai/` utilities which abstract the LLM provider
- Context sent with each request: selected element type, current page structure, design tokens
- Confidence levels returned by the AI model as structured metadata, not inferred client-side
- Brand Setup Wizard in Design System Tab uses the same AI pipeline for palette generation
- Rate limiting enforced both client-side (counter) and server-side (API gateway)
- Chat history persists per session, cleared on editor close

---

## Related Documentation
- [Design System Tab](../design-system-tab/README.md) — AI powers Brand Setup Wizard
- [Inspector](../inspector/README.md) — AI suggestions in Effects tab
- [Canvas](../canvas/README.md) — Apply actions target canvas elements
- [Style Guide](../../design-system/style-guide.md) — Chat bubble and badge specs
