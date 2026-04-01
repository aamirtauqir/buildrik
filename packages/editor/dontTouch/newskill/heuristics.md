# UX Heuristics Quick Reference

When running the 5-layer audit, use these specific checks. This is a deeper reference — read it when you need detailed criteria for a specific layer.

## Layer 1: Flow — Detailed Checks

### Navigation Architecture
- Can user reach any core feature in ≤ 3 clicks from home?
- Is there always a visible "back" or "home" escape route?
- Does the URL/breadcrumb reflect where the user is?
- Can user bookmark or share their current state?

### Onboarding
- First-time user: Is the first action obvious within 5 seconds?
- Is onboarding skippable without penalty?
- Does onboarding teach by doing (not just reading)?
- Maximum 3 onboarding steps — beyond that, completion drops sharply

### Error Recovery
- Can every destructive action be undone?
- Are error messages actionable ("Try again" with a button, not just "Error")?
- Does the system auto-save? If so, is it visible?
- After an error, is the user's input preserved?

### Multi-step Processes
- Is progress visible (step 2 of 4)?
- Can user go back without losing data?
- Can user save and resume later?
- Is the final step clearly marked as final?

## Layer 2: Clarity — Detailed Checks

### Labeling Consistency
| Check | How to Test |
|-------|------------|
| Same feature, same name everywhere | Search codebase for all references to feature name |
| Rail/sidebar/tab labels match their panel content titles | Click each nav item, compare tooltip to panel header |
| Button labels describe the action, not the destination | "Save changes" not "Settings" |
| No abbreviations unless universally understood | OK: URL, PDF. Not OK: Config, Env, Repo (for non-dev users) |

### Information Hierarchy
- Is the most important information visually largest/first?
- Are section headers in a consistent size scale?
- Is body text ≥ 14px on desktop, ≥ 16px on mobile?
- Are related items grouped with consistent spacing?

### Empty States
Every panel/view that can be empty should answer 3 questions:
1. "What is this?" — 1-sentence description
2. "Why is it empty?" — Context (first time, no results, no selection)
3. "What should I do?" — Clear CTA or instruction

### Icons
- Standalone icons (no text label) must be universally understood
  - Safe alone: ✕ close, ← back, 🔍 search, ⚙ settings, + add
  - Need text: most domain-specific icons
- Every icon must have aria-label or title attribute
- Icon size ≥ 16×16px, touch target ≥ 44×44px

## Layer 3: Effort — Detailed Checks

### Click Counting
| Task Type | Max Acceptable Clicks |
|-----------|----------------------|
| Core task (the #1 thing users do) | 1-2 |
| Frequent task (done every session) | 2-3 |
| Occasional task (done weekly) | 3-5 |
| Rare task (done once per project) | 5-7 |

### Input Reduction
- Use smart defaults (pre-fill country from locale, pre-fill name from account)
- Offer autocomplete for any text field with < 100 possible values
- Use toggles for binary choices, not dropdowns
- Use segmented controls for 2-5 mutually exclusive options, not dropdowns
- Date pickers should allow keyboard entry, not just calendar click

### Keyboard Efficiency
- All frequent actions should have keyboard shortcuts
- Shortcuts should follow platform conventions (Cmd+S save, Cmd+Z undo)
- Shortcut hints should be visible in tooltips
- Tab order should follow visual layout (left→right, top→bottom)

## Layer 4: Feedback — Detailed Checks

### Action Feedback Matrix
| Action Type | Required Feedback | Timing |
|------------|-------------------|--------|
| Click / tap | Visual state change (press/active) | < 100ms |
| Save / submit | Confirmation (toast, status text) | < 300ms or show spinner |
| Delete / destroy | Confirmation dialog BEFORE + undo toast AFTER | Immediate |
| Upload / process | Progress indicator with % or spinner | Immediate + update every 1s |
| Background sync | Subtle status icon (cloud, check) | Within 2s of completion |
| Error | Inline error at the source + what to do | < 500ms |

### Loading States
- Skeleton screens for layout-known, content-loading situations
- Spinner for indeterminate waits under 5 seconds
- Progress bar with % for waits over 5 seconds
- Never show a blank white screen — always show structure

### Toast / Notification Rules
- Maximum 1 toast visible at a time
- Toasts should not overlap any interactive element
- Auto-dismiss after 4-6 seconds (longer for errors)
- Dismiss button (×) always available, minimum 44×44px touch target
- Don't toast routine actions (save, undo) — these should be inline indicators

### Performance as UX
- Every action should respond with visual feedback within 100ms
- If operation takes >300ms, show a spinner or progress indicator
- If operation takes >1s, show a progress bar or skeleton screen
- Check for layout shift (CLS) — elements shouldn't jump around as content loads
- Images should be lazy-loaded off-screen
- Perceived performance: does the product FEEL fast? (even if backend is slow, UI should respond instantly)

## Layer 5: Content & Copy — Detailed Checks

### Error Messages
| Bad | Good |
|-----|------|
| "Error" | "Couldn't save — check your internet connection and try again" |
| "Invalid input" | "Email must include @ symbol (e.g., name@example.com)" |
| "Failed" | "Upload failed — file must be under 10MB. Your file is 15MB." |
| "Something went wrong" | "We couldn't connect to the server. Try refreshing the page." |

Rules: every error message must (1) say what happened, (2) say why, (3) say what to do next.

### Button Labels
- Action-oriented: "Save changes" not "Submit", "Delete project" not "Remove"
- Consistent verb tense across the entire product
- Destructive actions: specific label ("Delete this project" not "Delete")
- Don't use "Click here" or "Learn more" alone — be specific

### Empty States
Every empty state must answer:
1. What is this area? (1-sentence description)
2. Why is it empty? (first time, no results, no selection)
3. What should I do? (clear CTA or instruction)

### Microcopy Checklist
- Placeholder text: helpful example, not just "Enter text here"
- Tooltip text: explains WHY, not just WHAT (user can see the WHAT)
- Confirmation dialogs: state what will happen, not just "Are you sure?"
- Success messages: confirm what was done + optional next step

### Tone Consistency
- Is the tone formal or casual? Is it the same everywhere?
- Error messages same tone as success messages?
- Onboarding tone matches in-app tone?
- No sudden personality shifts between features

## Polish — Detailed Checks (Cross-cutting, applies to all layers)

### Touch Targets (WCAG 2.5.8)
- Minimum 44×44px for all interactive elements on touch devices
- Minimum 24×24px on desktop (44px preferred)
- Spacing between adjacent targets: ≥ 8px

### Color Contrast (WCAG 2.1 AA)
| Element | Minimum Ratio | Against |
|---------|--------------|---------|
| Body text (< 18px) | 4.5:1 | Background |
| Large text (≥ 18px bold or ≥ 24px) | 3:1 | Background |
| UI components (borders, icons) | 3:1 | Adjacent colors |
| Focus indicator | 3:1 | Adjacent colors |
| Disabled elements | No minimum (but must be identifiable) | — |

### Typography Scale
Limit to 4-5 sizes maximum:
- Page title: 20-24px
- Section header: 16-18px
- Body text: 14px desktop, 16px mobile
- Caption/meta: 12px (only with good contrast)
- Smallest allowed: 11px (only for badges/timestamps)

### Spacing System
Use a consistent base unit. Common: 4px grid (4, 8, 12, 16, 20, 24, 32, 40, 48).
Violations to check:
- Mixing px and rem without a clear system
- Odd values that don't fit the grid (e.g., 7px, 13px, 22px)
- Inconsistent padding within the same component type

### Animation & Transitions
- Duration: 150-300ms for UI transitions (anything longer feels laggy)
- Easing: ease-out for entrances, ease-in for exits
- Reduce motion: respect `prefers-reduced-motion` media query
- No animation on error states (don't animate the error message in, just show it)

### Responsive Breakpoints
| Breakpoint | What Should Happen |
|-----------|-------------------|
| < 480px | Mobile layout, stacked, full-width |
| 480-768px | Tablet, 1-2 column |
| 768-1024px | Small desktop, sidebar may collapse |
| 1024-1440px | Standard desktop, full layout |
| > 1440px | Max content width, centered, no stretch |

### Design Token Hygiene
- All colors should come from tokens/variables (no hardcoded hex in components)
- All spacing should reference the spacing scale
- All font sizes should reference the type scale
- All border-radius should reference radius tokens
- All z-index values should be from a defined scale (not random numbers)
