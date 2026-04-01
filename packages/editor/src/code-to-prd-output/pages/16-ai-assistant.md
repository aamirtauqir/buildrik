# AI Assistant

> **Module:** AI
> **Source:** `src/ai/` + `src/services/ai/`
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The AI Assistant provides intelligent help throughout the editor: content generation, layout suggestions, color palette creation, and accessibility checking. It integrates via OpenAI API through a server-side proxy (`/api/ai`) with **per-user rate limiting**, caching, and retry logic.

## Components

### AI Assistant Sidebar (`AIAssistant.tsx`)
Main conversational interface for AI interactions.

| Element | Behavior |
|---------|----------|
| Chat input | Type prompts; AI responds with suggestions |
| Quick prompts | Pre-built prompt buttons for common tasks |
| Response display | Formatted AI output (text, code, suggestions) with confidence levels |

### AI Copilot (`AICopilot.tsx`)
Context-aware AI helper that proactively suggests improvements.

| Element | Behavior |
|---------|----------|
| Suggestion cards | AI recommendations based on current selection, tagged with confidence level |
| Apply button | One-click apply suggestion to selected element |
| Dismiss | Skip suggestion |

### AI Toolbar Bar (`AIAssistantBar.tsx`)
Compact toolbar for quick AI actions.

### Specialized AI Tools

| Tool | Component | Purpose |
|------|-----------|---------|
| Color Palette | `ColorPalette.tsx` | Generate harmonious color palettes from a seed color or description |
| Layout Suggestions | `LayoutSuggestions.tsx` | Recommend layout improvements for selected container |
| Accessibility Checker | `AccessibilityChecker.tsx` | Audit selected element/page for WCAG violations |

## AI Capabilities

### Content Generation
- **Trigger:** User types prompt like "Write hero section copy for a SaaS product"
- **Behavior:** AI generates text content → user can apply directly to selected text element
- **Context:** Can reference selected element and its current content

### Layout Suggestions
- **Trigger:** Select a container → AI analyzes children
- **Behavior:** Suggests flex/grid improvements, spacing adjustments, alignment optimizations
- **Output:** One-click "Apply" buttons for each suggestion with confidence tags

### Color Palette Generation
- **Trigger:** User provides seed color or description ("modern tech startup palette")
- **Behavior:** Generates 5-7 harmonious colors → can apply as design tokens
- **Integration:** Powers the Brand Setup Wizard in Design System tab

### Accessibility Audit
- **Trigger:** Run audit on selected element or entire page
- **Behavior:** Checks: color contrast (WCAG AA/AAA), alt text, heading hierarchy, ARIA labels, keyboard accessibility → lists violations with severity and fix suggestions
- **Output tagged with confidence levels:**
  - **High** (red): Definite violation — must fix (e.g., contrast ratio fails WCAG AA)
  - **Medium** (yellow): Likely issue — should fix (e.g., heading hierarchy skip)
  - **Suggestion** (blue): Optional improvement (e.g., consider larger font size for readability)

### Page Generation (Engine-Side)
- **Trigger:** "Generate a landing page for [description]"
- **Behavior:** AI creates full page layout with sections → user can modify after generation
- **Powered by:** `engine/ai/PageGenerator.ts` with section types: hero, features, pricing, testimonials, CTA, contact

## Service Architecture

### AIServiceClient (`services/ai/AIServiceClient.ts`)

| Parameter | Value | Notes |
|-----------|-------|-------|
| Rate limit | **30 requests / 60 seconds per user** | Per-user, not per-session. A 4-person team gets 120 req/min combined. |
| Concurrency | 3 simultaneous per user | Request queue for overflow |
| Retry | 2 retries, 1s delay | On transient failures |
| Timeout | 30 seconds | Per request |
| Caching | TTL-based | Identical prompts return cached responses |
| API endpoint | `/api/ai` | Server-side proxy (not direct OpenAI) |

### AI Prompt Library (`services/ai/AIPromptLibrary.ts`)
Pre-built prompt templates for each AI feature type.

## Confidence Levels

All AI outputs are tagged with a confidence level:

| Level | Icon | Color | Meaning | Example |
|-------|------|-------|---------|---------|
| **High** | ✓ | Green (or Red for violations) | Definite — act on this | "Contrast ratio 2.1:1 fails WCAG AA (requires 4.5:1)" |
| **Medium** | ⚠ | Yellow | Likely — review and decide | "Heading jumps from H1 to H4; consider adding H2/H3" |
| **Suggestion** | 💡 | Blue | Optional — nice to have | "Consider increasing body font to 18px for better readability" |

## Interactions

### Ask AI
- **Trigger:** Type in AI assistant input + Enter
- **Behavior:** Loading indicator → API call → response displayed with confidence tags → "Apply" button if actionable

### Quick Prompt
- **Trigger:** Click a quick-prompt button
- **Behavior:** Pre-fills prompt and auto-submits

### Apply AI Suggestion
- **Trigger:** Click "Apply" on AI response
- **Behavior:** Suggestion applied to selected element (text, styles, or layout) → change appears on canvas → history entry created (undoable)

## Business Rules

1. AI calls go through server-side proxy — no API keys in client
2. **Rate limiting is per-user, not per-session** — prevents bottleneck for design teams. Each team member gets their own 30 req/min allowance.
3. Cached responses return instantly for repeated queries
4. AI suggestions are always applied as regular editable changes (undoable)
5. Accessibility checker follows WCAG 2.1 AA standards
6. AI features gracefully degrade if API is unavailable (error toast, retry option)
7. **All AI outputs include confidence levels** — helps designers prioritize which suggestions to act on vs review vs ignore

## Screen Relationships
- **From:** Header AI button, Inspector AI suggestion section
- **To:** Canvas (applied content/styles), Design System (generated palettes, brand setup wizard), Inspector (applied properties)
- **Data coupling:** AI reads current element state for context; writes through Composer for changes
