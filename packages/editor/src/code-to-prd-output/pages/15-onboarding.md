# Onboarding Flow

> **Module:** Onboarding
> **Source:** `src/editor/onboarding/`
> **Generated:** 2026-03-25 | **Updated:** v2

## Overview

The onboarding system provides **two distinct flows**: a **Solo Onboarding** for new users starting from scratch, and a **Team Onboarding** for members joining an existing project. Both are orchestrated by a central state machine that tracks completion progress and adapts to context.

## Solo Onboarding (New User, Empty Project)

### 1. Welcome Modal (`WelcomeModal.tsx`)

| Element | Behavior |
|---------|----------|
| Welcome message | "Welcome to Aquibra Studio" |
| Quick start options | Choose a path: Start from scratch, Use a template, Explore demo |
| Skip button | Close modal and start blank |
| Persistence | Shown once on first launch; dismissed state saved in localStorage |

### 2. Onboarding Checklist (`OnboardingChecklist.tsx`)

| Task | Trigger for Completion |
|------|----------------------|
| Create your first page | User creates or switches to a page |
| Add an element | User drags or clicks an element from Add tab |
| Style an element | User changes any property in Inspector |
| Preview your site | User clicks Preview button |
| Publish your site | User publishes via Publish tab |

| Element | Behavior |
|---------|----------|
| Task list | Checkbox-style items; completed items show checkmark |
| Progress bar | Visual completion percentage |
| Dismiss | Can be permanently dismissed |
| Persistence | Completion state saved in localStorage |

### 3. Spotlight Overlay (`SpotlightOverlay.tsx`)

| Spotlight Target | Message |
|-----------------|---------|
| Canvas | "This is your canvas — drag elements here to build your page" |
| Add tab (Rail) | "Click here to browse elements you can add" |
| Inspector | "Select an element to see its properties here" |
| Preview button | "Preview your site as visitors will see it" |

| Element | Behavior |
|---------|----------|
| Highlight mask | Dims everything except the target area |
| Tooltip | Positioned near target with description text |
| Next / Skip buttons | Advance through spotlight tour or skip entirely |
| Persistence | Tour completion saved; won't repeat |

### 4. Achievement Prompt (`AchievementPrompt.tsx`)

| Achievement | Trigger |
|------------|---------|
| "First Element" | Added first element to canvas |
| "Style Master" | Edited 10+ style properties |
| "Multi-Page Pro" | Created 3+ pages |
| "Template User" | Applied first template |
| "Published!" | First publish |

| Element | Behavior |
|---------|----------|
| Toast notification | Animated toast with achievement name and icon |
| Auto-dismiss | Fades after 5 seconds |
| Non-blocking | Does not interrupt workflow |

## Team Onboarding (New Member Joining Existing Project)

When a user opens a project that **already has content** (pages, elements, design tokens), the onboarding adapts:

### 1. Team Welcome Modal

| Element | Behavior |
|---------|----------|
| Welcome message | "Welcome to [Project Name]" |
| **Project summary** | "This project has N pages, N elements, and N team members" — gives immediate context |
| **Recent activity** | "Last edited by [User] 2 hours ago" — shows the project is active |
| **Brand overview** | Shows the project's design tokens (color palette + fonts) as a visual card — new member immediately sees the brand |
| Quick actions | "Jump to canvas", "View pages", "Explore design system" |
| Skip button | Close and enter editor |

### 2. Contextual Spotlight (Abbreviated)

Instead of the full solo tour, team members get a shorter spotlight covering:

| Spotlight Target | Message |
|-----------------|---------|
| Presence avatars | "Your team members are here — you'll see their cursors on the canvas" |
| Components tab | "Your team's component library — use these for consistency" |
| Design System tab | "Your brand tokens — colors, fonts, and spacing are defined here" |

### 3. Team-Specific Checklist

| Task | Trigger for Completion |
|------|----------------------|
| View the design system | Open Design System tab |
| Insert a component | Drag a team component onto canvas |
| Edit an element | Change any property in Inspector |

## Orchestration (`useOnboardingOrchestrator.ts`)

Central state machine that:
1. Checks if user is new (no localStorage state)
2. **Detects project context:** empty project → Solo flow; existing project with content → Team flow
3. Shows appropriate Welcome Modal
4. Activates appropriate Spotlight Tour after modal dismiss
5. Tracks checklist progress via Composer events
6. Triggers achievement prompts on milestones (solo flow only)
7. Persists all state to localStorage

## Business Rules

1. Onboarding only triggers for new users (no localStorage onboarding keys)
2. **Two flows:** Solo (empty project) and Team (existing project with content). Detected automatically based on project state (page count, element count, collaborator count).
3. Each component can be independently dismissed
4. All state persisted in localStorage (survives page refresh)
5. Spotlights respect current panel state (won't highlight hidden panels)
6. Achievements are fun/non-essential — no functional impact (solo flow only)
7. **Onboarding can be re-triggered** from Settings → Advanced → "Reset onboarding"
8. Team onboarding is shorter (3 spotlights + 3 checklist items vs 4 spotlights + 5 checklist items) to respect experienced users' time

## Screen Relationships
- **Overlays:** Welcome modal, spotlight, and achievements overlay the entire editor
- **Data coupling:** Listens to Composer events for checklist progress (element:created, style:changed, etc.). Team flow reads project metadata for summary card.
