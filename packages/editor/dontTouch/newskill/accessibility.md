# Accessibility Audit Reference (WCAG 2.1 AA)

Read this when running Stage 3C (Accessibility Audit). This provides the full checklist, platform-specific rules, and common failures.

## Quick Platform Rules

| Rule | Web | iOS | Android |
|------|-----|-----|---------|
| Min touch target | 44×44px | 44×44pt | 48×48dp |
| Target spacing | ≥8px gap | ≥8pt gap | ≥8dp gap |
| System font | User's browser | SF Pro | Roboto / system |
| Back navigation | Browser back | Swipe from left edge | System back button |
| Bottom nav items | N/A (varies) | Max 5 tab bar items | Max 5 bottom nav items |
| Screen reader | NVDA/JAWS/VoiceOver (desktop) | VoiceOver | TalkBack |

## Layer 12: Perceivable — Full Checklist

### 12.1 Color Contrast
- [ ] Body text (<18px regular, <14px bold): ≥4.5:1 against background
- [ ] Large text (≥18px regular or ≥14px bold): ≥3:1 against background
- [ ] UI components (borders, icons, form controls): ≥3:1 against adjacent colors
- [ ] Focus indicators: ≥3:1 against adjacent colors
- [ ] Placeholder text: ≥4.5:1 (or use floating labels instead)
- [ ] Disabled elements: no minimum, but must be identifiable as disabled

### 12.2 Color Independence
- [ ] Never use color alone to convey information (add icons, text, or patterns)
- [ ] Error states: red border + error icon + error text (not just red border)
- [ ] Success states: green + checkmark icon + text
- [ ] Charts/graphs: use patterns/shapes in addition to colors
- [ ] Links in body text: underlined OR have 3:1 contrast against surrounding text + additional visual cue on hover

**Color blindness simulation check:**
Test the UI through 3 lenses:
- Protanopia (red-blind, ~1% of males)
- Deuteranopia (green-blind, ~1% of males)  
- Tritanopia (blue-blind, ~0.003%)
If any information is lost when simulated, the design fails.

### 12.3 Text Alternatives
- [ ] Every meaningful image has alt text describing its content/purpose
- [ ] Decorative images: `aria-hidden="true"` or empty `alt=""`
- [ ] Icon-only buttons: `aria-label` describing the action
- [ ] Complex images (charts, diagrams): long description available
- [ ] SVG icons: `role="img"` + `aria-label` or `<title>` element

### 12.4 Text Sizing
- [ ] All text resizable to 200% without content loss or overlap
- [ ] Use relative units (rem, em) not fixed px for font sizes where possible
- [ ] Minimum body text: 16px mobile, 14px desktop
- [ ] No horizontal scrolling when text is resized

### 12.5 Media
- [ ] Videos have captions
- [ ] Audio has transcripts
- [ ] No auto-playing audio/video (or immediate pause control)
- [ ] Animations respect `prefers-reduced-motion: reduce`

## Layer 13: Operable — Full Checklist

### 13.1 Keyboard Navigation
- [ ] Every interactive element reachable via Tab key
- [ ] Tab order matches visual layout (left→right, top→bottom in LTR)
- [ ] Skip-to-content link as first focusable element
- [ ] No keyboard traps (user can always Tab out)
- [ ] Custom widgets respond to expected keys (Enter to activate, Escape to close, Arrow keys for lists)
- [ ] Shortcuts don't conflict with browser/OS shortcuts

### 13.2 Focus Management
- [ ] Visible focus indicator on ALL interactive elements
- [ ] Focus indicator: ≥2px outline, ≥3:1 contrast against adjacent colors
- [ ] Custom focus styles don't remove the indicator (never `outline: none` without replacement)
- [ ] Modal opens → focus moves into modal
- [ ] Modal closes → focus returns to trigger element
- [ ] Dynamic content loads → focus moves to new content or announcement made
- [ ] Dropdown opens → focus moves to first option
- [ ] Tab panels: Tab moves to panel content, not next tab

### 13.3 Touch Targets
**Web:**
- Minimum: 44×44px for all interactive elements
- Spacing: ≥8px between adjacent targets
- Exception: inline text links (no minimum, but should be easily tappable)

**iOS:**
- Minimum: 44×44pt (Apple HIG)
- Buttons in navigation bar: 44pt height
- Tab bar items: minimum 49pt height

**Android:**
- Minimum: 48×48dp (Material Design)
- Spacing: ≥8dp between targets
- FAB: 56dp standard, 40dp mini

### 13.4 Timing
- [ ] No content disappears before user can read it (auto-dismiss toasts: minimum 4s)
- [ ] User can pause, stop, or hide moving/auto-updating content
- [ ] Session timeouts: warn 20 seconds before, allow extension
- [ ] No content flashes more than 3 times per second

## Layer 14: Understandable — Full Checklist

### 14.1 Readability
- [ ] Page language declared (`<html lang="en">`)
- [ ] Content language changes marked (`<span lang="fr">`)
- [ ] Reading level appropriate for audience
- [ ] Abbreviations expanded on first use or have `<abbr>` tag

### 14.2 Predictability
- [ ] Navigation consistent across pages (same position, same order)
- [ ] Components that look the same behave the same
- [ ] No unexpected context changes on focus or input
- [ ] Form submit only happens when user explicitly triggers it

### 14.3 Error Handling
- [ ] Errors identified in text, not just color
- [ ] Error messages appear next to the problematic field (not just at top of form)
- [ ] Error messages explain what went wrong AND how to fix it
- [ ] Required fields marked BEFORE submission (not discovered only after)
- [ ] Destructive actions require confirmation
- [ ] Undo available for important actions

### 14.4 Forms
- [ ] Every input has an associated `<label>` (not just placeholder)
- [ ] Required fields clearly marked (asterisk + aria-required="true")
- [ ] Input purpose identified for autofill (`autocomplete` attribute)
- [ ] Fieldsets and legends for related groups
- [ ] Clear submit button with descriptive text

## Layer 15: Robust — Full Checklist

### 15.1 Semantic HTML
- [ ] Headings in order: h1 → h2 → h3 (no skipping levels)
- [ ] Only one h1 per page
- [ ] Proper landmarks: `<nav>`, `<main>`, `<aside>`, `<footer>`, `<header>`
- [ ] Lists use `<ul>`, `<ol>`, `<dl>` (not styled divs)
- [ ] Tables use `<th>` for headers, `scope` attribute for complex tables
- [ ] Buttons use `<button>`, links use `<a>` (not div with onClick)

### 15.2 ARIA
- [ ] ARIA used only when native HTML isn't sufficient
- [ ] `aria-label` on elements without visible text
- [ ] `aria-expanded` on toggles/accordions
- [ ] `aria-live` regions for dynamic content updates
- [ ] `aria-hidden="true"` on decorative elements
- [ ] `role` attributes match element behavior
- [ ] No redundant ARIA (don't add `role="button"` to `<button>`)

### 15.3 Screen Reader Testing
Test with at least one screen reader:
- **macOS/iOS:** VoiceOver (built-in)
- **Windows:** NVDA (free) or JAWS
- **Android:** TalkBack (built-in)

Check:
- [ ] All content is read in logical order
- [ ] Interactive elements announce their role and state
- [ ] Dynamic updates are announced (live regions)
- [ ] Images are described or hidden appropriately
- [ ] Form fields announce their labels and error states
- [ ] Navigation is understandable without seeing the screen

### 15.4 User Preferences
- [ ] `prefers-reduced-motion`: non-essential animations disabled
- [ ] `prefers-color-scheme`: dark/light mode follows system preference
- [ ] `prefers-contrast`: increased contrast mode supported (if possible)
- [ ] Font size respects browser/OS settings

## Common Accessibility Failures by Component

| Component | Common Failure | Fix |
|-----------|---------------|-----|
| Button | `<div onClick>` instead of `<button>` | Use `<button>` element |
| Icon button | No accessible name | Add `aria-label` |
| Modal | Focus not trapped inside | Add focus trap, return focus on close |
| Dropdown | Not keyboard navigable | Arrow keys to navigate, Enter to select, Escape to close |
| Toast | Not announced to screen reader | Use `aria-live="polite"` region |
| Tab panel | Wrong keyboard behavior | Tab key moves to content, arrow keys switch tabs |
| Carousel | Auto-playing, no controls | Add pause button, keyboard controls |
| Form | Placeholder as only label | Add visible `<label>` element |
| Color picker | Only color, no text input | Add hex/RGB text input alternative |
| Data table | No header associations | Use `<th scope="col/row">` |
| Toggle/Switch | State not announced | Add `aria-checked` |
| Progress bar | Not announced | Add `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |

## Accessibility Scoring Rubric

| Score | Perceivable | Operable | Understandable | Robust |
|-------|------------|----------|----------------|--------|
| 1 | No alt text, contrast fails everywhere | No keyboard nav possible | No error messages, no labels | Div soup, no ARIA |
| 2 | Some alt text, some contrast issues | Partial keyboard nav, focus traps exist | Basic error messages, some labels | Some semantic HTML |
| 3 | Most images have alt text, contrast mostly passes | Keyboard nav works for main flow, some gaps | Errors identified, most inputs labeled | Semantic HTML mostly used, basic ARIA |
| 4 | All images handled, contrast passes AA | Full keyboard nav, visible focus, skip link | Good error handling, all inputs labeled | Proper landmarks, correct ARIA usage |
| 5 | Perfect contrast, color-blind safe, text resizable | Flawless keyboard nav, focus management, screen reader tested | Excellent error prevention and recovery | Perfect semantics, thoroughly screen reader tested |
