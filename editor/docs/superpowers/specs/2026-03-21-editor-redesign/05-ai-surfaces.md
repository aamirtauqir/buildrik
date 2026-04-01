# Module 05 — AI Surfaces

## Problem

Four AI modules are fully coded in the engine (1,716 LOC total): LayoutAnalyzer (353 LOC), CodeGenerator (518 LOC), ContentWriter (368 LOC), PageGenerator (442 LOC). UI components also exist: AIAssistant (309 LOC), AICopilot (680 LOC), AIAssistantBar (339 LOC), LayoutSuggestions (240 LOC), ColorPalette (276 LOC).

But users don't know AI exists. There are no discoverable entry points. The AI button is buried in the top bar overflow menu. Ctrl+J shortcut is undocumented in the UI.

## Requirements

### AI Assistant Bar (Ctrl+J)
- Slides up from bottom of canvas area
- Prompt input with contextual placeholder based on what's selected:
  - No selection: "Describe what you want to build..."
  - Text element: "Describe changes for this text..."
  - Image: "Describe changes for this image..."
  - Container: "Describe layout changes..."
- Quick suggestion chips below input (context-aware)
- Generate → preview result on canvas → Apply / Reject / Edit
- Non-destructive: preview first, apply only on confirmation (U5)

### AI Copilot (Full Page Generation)
- Accessible via command palette (Ctrl+K → "AI Copilot") or dedicated shortcut
- Full-screen modal with prompt textarea
- Template suggestions as starting points (Landing Page, About, Portfolio, etc.)
- Two actions: "Generate Full Page" and "Generate Section"
- Result: preview of generated content → Accept (replace or new page) / Reject
- Replace current page = destructive → confirm + auto-save current state first (P4)

### AI Suggestions in Inspector
- Section in Effects tab: "AI Suggestions"
- Shows 3 contextual suggestions based on selected element type
- Each suggestion: description + "Apply" button
- Apply = instant preview on canvas + undo available
- "New suggestions" button to regenerate
- Only visible when an element is selected (U1: earns its pixels)

### Discoverability
- Ctrl+J available globally — works from any state
- AI sparkle icon in canvas footer toolbar (always visible)
- AI option in element right-click context menu: "AI: Improve this element"
- AI Copilot accessible via Ctrl+K command palette
- Inspector AI section visible when element selected

## Flows

### Improve Selected Element
1. Select element on canvas
2. Press Ctrl+J → AI bar slides up with context pre-filled
3. Type "make this heading bolder and add a subtle shadow"
4. Click Generate → canvas shows preview (highlighted changes)
5. Click Apply → changes committed. Toast: "AI changes applied" + Undo button
6. OR click Reject → changes reverted, bar returns to idle

### Generate Full Page
1. Open Copilot (Ctrl+K → "AI Copilot")
2. Type "A modern SaaS landing page with hero, features grid, and testimonials"
3. OR click template chip "Landing Page" to pre-fill prompt
4. Click "Generate Full Page" → progress indicator with status text
5. Preview rendered in modal
6. Click "Accept as new page" → new page created in Pages tab
7. OR "Accept and replace" → confirms first → saves current → replaces

### Quick Suggestion
1. Select a heading element
2. Inspector Effects tab → AI Suggestions section
3. See: "Make heading bolder", "Increase contrast", "Add letter-spacing"
4. Click "Apply" on a suggestion → instant change on canvas
5. Don't like it? Ctrl+Z to undo

## Engine APIs

| Surface | Module | What It Does |
|---------|--------|-------------|
| AI Assistant Bar | ContentWriter | Text rewriting, content changes based on prompt |
| AI Copilot | PageGenerator | Full page HTML generation from text prompt |
| AI Suggestions | LayoutAnalyzer | Analyzes element context, suggests style improvements |
| Export code gen | CodeGenerator | Generates React/Vue/Next.js from HTML (used in export flow) |

## Constraints

- All AI operations are async with timeout (30s default)
- AI unavailable fallback: surfaces show "AI temporarily unavailable" with retry
- Every AI change is preview-first, never auto-applied (U5: preview before commit)
- Every AI change is undoable (P4: work is never lost)
- AI cost/rate limiting: defined by backend, not by UI (UI shows error if rate limited)

## Reference

- **Framer AI:** Generate page from prompt — visual quality bar
- **Webflow AI Assistant:** Inline element improvement
- **GitHub Copilot:** Inline suggestions pattern (suggest → accept/reject)
- **ChatGPT:** Prompt + response + iterate pattern

## States (Loading, Error)

- **Loading:** AI bar shows "Generating..." text with a spinner animation. Input field becomes disabled. Cancel button appears to abort generation.
- **Error:** Bar border turns red (#E53935 at 60% opacity). Message displayed: "AI couldn't generate. Try rephrasing." with a "Retry" button.
- **Unavailable:** All AI surfaces (bar, copilot, inspector suggestions) show "AI temporarily unavailable" with a muted sparkle icon and a "Retry" button. No input fields shown.
- **Rate limited:** Message displayed: "Usage limit reached. Try again in X minutes." where X is provided by the backend. Input disabled, retry button shows countdown timer.
