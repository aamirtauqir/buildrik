---
title: Onboarding — First-Run Experience
description: Design specification for the onboarding flow with Solo and Team variants, spotlights, and achievement system
feature: onboarding
last-updated: 2026-03-25
version: 1.0.0
related-files:
  - ../../design-system/style-guide.md
  - ../settings-tab/README.md
  - ../canvas/README.md
dependencies:
  - Settings Tab (Reset Onboarding in Advanced)
  - Canvas (spotlight steps target canvas areas)
status: approved
---

# Onboarding — First-Run Experience

## Overview

Onboarding guides new users through the editor with two variants: Solo (individual creators) and Team (users joining an existing project). Solo gets the full flow — Welcome Modal, 4-step Spotlight tour, 5-task Checklist, and Achievement badges. Team gets an abbreviated version — Project summary, 3-step Spotlight, and 3-task Team checklist. Onboarding can be reset from Settings, Advanced.

**Primary User Goal:** Feel confident using the editor within the first 5 minutes.
**Success Criteria:** 80% of new users complete at least 3 checklist tasks in their first session.
**Key Pain Points Addressed:** Prevents the "blank canvas paralysis" of complex tools; contextual guidance reduces support tickets.

---

## Layout Architecture

```
Solo Flow:
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌────────────┐
│ Welcome  │───▸│ Spotlight │───▸│ Checklist│───▸│Achievements│
│ Modal    │    │ 4 steps   │    │ 5 tasks  │    │ Badges     │
└─────────┘    └──────────┘    └──────────┘    └────────────┘

Team Flow:
┌─────────┐    ┌──────────┐    ┌──────────┐
│ Project  │───▸│ Spotlight │───▸│ Team     │
│ Summary  │    │ 3 steps   │    │Checklist │
│ + Brand  │    │           │    │ 3 tasks  │
└─────────┘    └──────────┘    └──────────┘
```

---

## Screen States

### State 1: Welcome Modal (Solo)

```
┌──────────────────────────────────────┐
│                                      │
│          Welcome to Buildrik         │
│                                      │
│    Build beautiful websites          │
│    visually — no code needed.        │
│                                      │
│    What are you building?            │
│    ○ Landing Page                    │
│    ○ Portfolio                       │
│    ○ Blog                            │
│    ○ E-commerce                      │
│    ○ Just exploring                  │
│                                      │
│         [Get Started →]              │
└──────────────────────────────────────┘
```

- **Visual:** Centered modal, 480px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-3`, `--aqb-radius-xl`.
- **Heading:** `--aqb-heading-lg`, `--aqb-text-primary`.
- **Subtitle:** `--aqb-body`, `--aqb-text-secondary`.
- **Goal selector:** Radio buttons, answer personalizes template suggestions.
- **CTA:** Primary button, `--aqb-primary` bg.

### State 2: Project Summary Modal (Team)

- **Content:** Project name, creator name, brand colors preview (3 swatches), page count.
- **Brand overview:** Quick visual of the design system tokens in use.
- **CTA:** "Explore the Project →"

### State 3: Spotlight Tour (Solo — 4 Steps)

- **Mechanic:** Full-screen dim overlay (80% black) with a spotlight cutout around the target UI element.
- **Tooltip:** 320px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-3`, arrow pointing to spotlight target.

| Step | Target | Content |
|------|--------|---------|
| 1 | Left sidebar rail | "Your Toolbox — Browse elements, templates, pages, and media here." |
| 2 | Canvas | "Your Canvas — Drag elements here to build your page. Click to select." |
| 3 | Right inspector | "Properties Panel — Style any selected element. Change colors, fonts, spacing." |
| 4 | Top bar | "Project Controls — Preview, publish, collaborate, and more." |

- **Navigation:** [Back] [Next] buttons + dot indicators (○○●○).
- **Skip:** "Skip tour" link, `--aqb-text-tertiary`.

### State 4: Spotlight Tour (Team — 3 Steps)

| Step | Target | Content |
|------|--------|---------|
| 1 | Left sidebar | "Your team's elements and templates are here." |
| 2 | Canvas | "Click to select, drag to move. Your team can see your cursor." |
| 3 | Collaboration indicators | "Team members appear here. Colored cursors show who's editing what." |

### State 5: Checklist (Solo — 5 Tasks)

```
┌──────────────────────────────┐
│ Getting Started        3/5 ✓ │ Progress
├──────────────────────────────┤
│ ☑ Add your first element     │ Completed
│ ☑ Change a color             │ Completed
│ ☑ Preview your page          │ Completed
│ ☐ Add a second page          │ Pending
│ ☐ Publish your site          │ Pending
└──────────────────────────────┘
```

- **Position:** Bottom-right floating card, 280px wide, `--aqb-chrome-surface` bg, `--aqb-elevation-2`.
- **Collapsible:** Click header to minimize to just the progress bar.
- **Tasks auto-complete** when the user performs the action (event-driven).
- **Completed tasks:** Strikethrough text, green checkmark.

### State 6: Team Checklist (3 Tasks)

| Task | Trigger |
|------|---------|
| Select an element | Click any element on canvas |
| Make an edit | Change any property in inspector |
| Leave a comment | Use the comment tool |

### State 7: Achievements (Solo Only)

- **Trigger:** Completing all 5 tasks shows a celebration modal.
- **Visual:** Confetti animation, "You're a Builder!" heading, achievement badge graphic.
- **Badge:** Stored in user profile, visible in avatar menu.
- **Dismissal:** [Start Building] button closes modal and removes checklist.

---

## Interaction Specifications

| Action | Behavior | Animation |
|--------|----------|-----------|
| Click "Get Started" | Dismiss welcome, start spotlight | Modal fade-out, spotlight fade-in |
| Click "Next" in spotlight | Advance to next step | Spotlight slides to new target, 300ms |
| Click "Skip tour" | Jump to checklist | Spotlight fades out, checklist slides in |
| Complete checklist task | Auto-check with green animation | Checkmark bounce, 300ms |
| Complete all tasks | Achievement modal appears | Confetti + modal fade-in, 500ms |
| Click "Reset Onboarding" in Settings | Clears state, re-triggers flow on next load | Confirmation modal first |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Welcome modal render | < 100ms |
| Spotlight transition | < 300ms per step |
| Checklist task detection | < 100ms (event-driven, no polling) |
| Achievement animation | 60fps confetti |
| Onboarding state persist | LocalStorage, < 10ms read/write |

---

## Accessibility

- **Welcome modal:** Focus trapped, Escape disabled (must choose a path)
- **Spotlight overlay:** Target element remains interactive. Tooltip is `role="dialog"` with auto-focus.
- **Checklist:** `role="list"`, completed items have `aria-label="Completed: [task]"`
- **Skip link:** Always visible (not hidden behind hover), keyboard accessible
- **Reduced motion:** Spotlight transitions are instant (no slide). No confetti animation.

---

## Implementation Notes

- Onboarding state stored in localStorage: `{ variant, currentStep, completedTasks[], dismissed }`
- Variant detection: if user joins via team invite link → Team flow; otherwise → Solo flow
- Spotlight positioning: reads target element's `getBoundingClientRect()` and positions cutout + tooltip
- Checklist tasks listen to Composer events (`element:added`, `style:changed`, `page:previewed`, etc.)
- Reset via `Composer.settings` clears localStorage onboarding keys
- Achievement badge stored server-side in user profile

---

## Related Documentation
- [Settings Tab](../settings-tab/README.md) — Reset Onboarding in Advanced
- [Canvas](../canvas/README.md) — Spotlight targets canvas area
- [Collaboration](../collaboration/README.md) — Team variant shows collaboration features
- [Style Guide](../../design-system/style-guide.md) — Modal and tooltip specs
