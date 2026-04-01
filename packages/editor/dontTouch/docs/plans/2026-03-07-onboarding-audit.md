# Onboarding Flow Audit — Buildrik / Aquibra Studio

**Date:** 2026-03-07
**Scope:** Complete first-run onboarding experience — every frame, every system, every code path
**Evidence:** 21 screenshots at `screenshots/onboard/ezgif-frame-001.png` through `ezgif-frame-021.png`
**Code:** `src/editor/onboarding/OnboardingModal.tsx`, `OnboardingProgress.tsx`, `src/shared/hooks/useOnboarding.ts`, `src/shared/ui/TourOverlay.tsx`

---

## Table of Contents

1. [Section A: Current-State Panel Map](#section-a-current-state-panel-map)
2. [Section B: Prioritized Issue List](#section-b-prioritized-issue-list)
3. [Section C: Recommended Architecture](#section-c-recommended-architecture)
4. [Section D: Wireframe / Layout Recommendations](#section-d-wireframe--layout-recommendations)
5. [Section E: Implementation Fixes](#section-e-implementation-fixes)
6. [Section F: Quick-Wins vs Refactor Roadmap](#section-f-quick-wins-vs-refactor-roadmap)

---

## Section A: Current-State Panel Map

### A1. The Three Concurrent Systems

The onboarding experience is built from **three independent components** that run simultaneously. They share no state, no coordination logic, and each has its own localStorage keys. Any user can dismiss all three independently and end up with zero guidance.

```
SYSTEM 1: OnboardingModal
  File:        src/editor/onboarding/OnboardingModal.tsx
  Storage key: "buildrik_onboarding_complete"
  Type:        Full-screen dark overlay, centered dialog
  Steps:       3 (Pick template -> Customize design -> Preview & Publish)
  Dismissal:   Skip button (any step) or completing all 3 steps

SYSTEM 2: TourOverlay
  File:        src/shared/ui/TourOverlay.tsx
  Storage key: "buildrik_onboarding_tour_v1"
  Type:        Spotlight tour — darkens screen except target element
  Steps:       4 (Name project -> Choose template -> Edit page -> Publish)
  Timing:      Starts 1000ms after load (setTimeout)
  Dismissal:   Skip button or Escape key

SYSTEM 3: OnboardingProgress ("Get started" widget)
  File:        src/editor/onboarding/OnboardingProgress.tsx
  Hook:        src/shared/hooks/useOnboarding.ts
  Storage key: "aquibra-onboarding-progress", "aquibra-onboarding-dismissed"
  Type:        Floating widget, bottom-center, collapsible
  Steps:       5 (code) / 9 (visible in screenshots — stale state)
  Dismissal:   X button (hides permanently)
```

**All three appear in frame 001. No coordination exists between them.**

---

### A2. System 1 — OnboardingModal (Center Dialog)

**Evidence:** `ezgif-frame-001.png` through `ezgif-frame-006.png`

| Step | Title | Icon | Body | Button |
|------|-------|------|------|--------|
| 1 | Pick a template | pencil | "Start with a professionally designed template or begin from scratch." | Next |
| 2 | Customize your design | palette | "Drag elements, edit text, and style everything visually." | Next |
| 3 | Preview & Publish | rocket | "Your site gets a free Buildrik URL. Custom domain support coming soon." | Get Started |

**Code observations (`OnboardingModal.tsx`):**
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` — good a11y
- Both Skip and Next buttons: `min-height: 44px` — meets touch target
- `focus-visible` outlines defined
- Escape key mapped to `handleSkip`
- **No `aria-live` region** — screen reader announces nothing when step changes
- **No focus trap** — Tab key can leave the modal into editor controls behind the overlay
- **Missing:** no `onNameProject` callback — project stays "Untitled Project" after this modal

---

### A3. System 2 — TourOverlay (Spotlight Tour)

**Evidence:** `ezgif-frame-007.png` through `ezgif-frame-014.png`

The TourOverlay activates 1000ms after page load. In screenshots it is simultaneously visible with the OnboardingModal (frame-001 to 007).

| Step (code) | Step (screenshots) | Title | Target | Position |
|-------------|-------------------|-------|--------|----------|
| 0 | NOT SEEN | Name your project | "" (canvas center) | center |
| 1 | STEP 1 OF 3 | Choose a template | #rail-tab-templates | right |
| 2 | STEP 2 OF 3 | Edit your page | "" (canvas center) | center |
| 3 | STEP 3 OF 3 | Publish when ready | .pillPublish (CSS class) | bottom |

**Critical divergence:** Code has 4 steps but screenshots show "1 OF 3", "2 OF 3", "3 OF 3" — the name-project step (index 0) was added to code after screenshots were taken or is not being reached by users.

**Code observations (`TourOverlay.tsx`):**
- Target lookup uses `getElementById` and `querySelector` — fragile coupling to class/ID names
- `setInterval(calculatePosition, 500)` — polls every 500ms to reposition card
- Fallback to center-screen when target not found — spotlight silently disappears
- `onNameProject` prop exists but no `onComplete`/`onSkip` event emitted to parent

---

### A4. System 3 — OnboardingProgress ("Get Started" Widget)

**Evidence:** `ezgif-frame-007.png` (collapsed), `ezgif-frame-018.png` to `ezgif-frame-021.png` (expanded)

**Screenshots show 9 items (stale localStorage):**

1. Add an element — Drag an element from the Add panel to your canvas
2. Edit text — Double-click any text element to edit its content
3. Change a style — Select an element and modify its styles in the inspector
4. Create a page — Add a new page from the Pages panel
5. Preview your site — Click the preview button to see your site on different devices
6. Save a component — Select elements and save them as a reusable component ← wrong for P2
7. Use undo/redo — Press Cmd+Z to undo or Cmd+Shift+Z to redo
8. Use a shortcut — Try a keyboard shortcut like A (Add) or Z (Layers)
9. **Export your work — Go to Settings to export or publish your site** ← WRONG NAVIGATION

**Code has 5 items (correct, already updated in `useOnboarding.ts`):**

1. Add an element
2. Edit text
3. Change a style
4. Preview your site
5. **Publish your site — Click the Publish button at the top right to make your site live** ← FIXED

**Code observations:**
- `completeStep(stepId)` is defined but **never called anywhere in the codebase** — checklist is always 0%
- Widget returns null when `dismissed || isComplete` — no transition, no success acknowledgment
- `stepDescStyles` has `fontSize: 12` — meets minimum but barely
- Dismiss button has `aria-label="Dismiss onboarding"` — good
- Header has `role="button"` + `aria-expanded` — good

---

### A5. Post-Onboarding Empty State

**Evidence:** `ezgif-frame-014.png`, `ezgif-frame-015.png`

After all systems dismissed, the right panel shows:

```
Nothing Selected
Click an element on the canvas or use the Layers panel to select and edit properties.

[+ Open Build Panel]
[Browse Templates]

Tip: Press A to open Build panel · Esc to deselect
```

The most actionable onboarding content in the entire flow — but only visible after all three onboarding systems have been dismissed.

---

### A6. Confirmed Positives

1. **OnboardingModal a11y is solid** — `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape key, 44px touch targets, `focus-visible` outlines
2. **Step 3 copy is already fixed in code** — "Your site gets a free Buildrik URL. Custom domain support coming soon."
3. **useOnboarding has been updated** — reduced to 5 meaningful steps, "Publish your site" has correct navigation
4. **TourOverlay targets the Publish button** — creates a visual connection between CTA and action
5. **OnboardingProgress has accessible dismiss** — `aria-label`, proper keyboard handling
6. **Code separation is clean** — each system is a standalone component

---

### A7. Storage Key Map

| Key | Component | Purpose |
|-----|-----------|---------|
| `buildrik_onboarding_complete` | OnboardingModal | Has user seen the 3-step modal? |
| `buildrik_onboarding_tour_v1` | TourOverlay | Has user seen the spotlight tour? |
| `aquibra-onboarding-progress` | useOnboarding | Step completion state (JSON) |
| `aquibra-onboarding-dismissed` | useOnboarding | Has user dismissed widget? |

**No shared namespace. No shared dismissed flag. No event coordination between systems.**

---

## Section B: Prioritized Issue List

### ONB-01 — Three Concurrent Onboarding Systems

| | |
|--|--|
| **Severity** | Critical |
| **Lens** | Onboarding/Guidance, Information Architecture |
| **Evidence** | `ezgif-frame-001.png` — all three visible simultaneously |

**Observation:** Frame 001 shows three independent systems running at once: OnboardingModal (full-screen overlay), TourOverlay (spotlight card), and OnboardingProgress (bottom widget). Each has its own localStorage key. Each is dismissable independently. No sequencing.

**User Impact:** New user is immediately presented with three overlapping UI surfaces. Dismissing one does not dismiss the others. If all three are dismissed, zero guidance remains. If none are dismissed, the user must process three onboarding narratives simultaneously.

**Root Cause:** Three features built independently at different times, each solving a perceived gap in the previous system. None replaced the previous one — they accumulated.

**Recommendation:** Consolidate to a single onboarding system. Keep the TourOverlay (spotlight, points at real UI). Remove the center modal. Keep the checklist but sequence it to appear only after the tour completes.

---

### ONB-02 — TourOverlay "Name your project" Step Is Not Reached

| | |
|--|--|
| **Severity** | Critical |
| **Lens** | Onboarding/Guidance, User Flows |
| **Evidence** | `ezgif-frame-007.png` — "STEP 1 OF 3 / Choose a template" as first step; `TourOverlay.tsx:20-27` — Step 0 is "Name your project" |

**Observation:** TourOverlay defines 4 steps in code (step 0: Name your project, hasNameInput: true) but screenshots show TourOverlay starting at "Choose a template" as the first visible step. The name-project step is never seen across 21 frames.

**User Impact:** Project name remains "Untitled Project" through the entire flow. A user who publishes without naming their project gets a site titled "Untitled Project" in browser tabs, SEO results, and social share cards.

**Root Cause:** Two possible causes: (A) Screenshots predate the code addition of the name-project step. (B) The 1000ms delay races with OnboardingModal — both appear at the same time with the same z-index (9999), and users interact with the modal first, never reaching TourOverlay step 0.

**Recommendation:** Surface project naming as the very first gate — a dedicated `NameProjectStep` component that blocks the editor before any other onboarding begins.

---

### ONB-03 — Stale 9-Item Checklist in Production (No Schema Version)

| | |
|--|--|
| **Severity** | Critical |
| **Lens** | Feedback & System Status, Trust/Safety |
| **Evidence** | `ezgif-frame-018.png` — 9 items shown; `useOnboarding.ts:40-71` — 5 DEFAULT_STEPS in code |

**Observation:** Screenshots show 9 checklist items including "Export your work — Go to Settings to export or publish your site" (wrong navigation). Code has been updated to 5 items with correct copy. No version field on localStorage schema — returning users still see the old 9-item list.

**User Impact:** Any user who loaded the editor before the code update still gets the 9-item list with the wrong "Go to Settings" instruction. This misdirects users to Config panel when they want to publish.

**Root Cause:** No version field in localStorage. When DEFAULT_STEPS changes, old localStorage data becomes stale with no migration path.

**Implementation:**
```ts
const CURRENT_VERSION = 2;
// On load: if stored version < 2, clear localStorage and reset to DEFAULT_STEPS
```

---

### ONB-04 — completeStep() Never Called — Checklist Always 0%

| | |
|--|--|
| **Severity** | High |
| **Lens** | Feedback & System Status, Usability |
| **Evidence** | `useOnboarding.ts:109-113` — completeStep() defined; grep confirms no call site exists |

**Observation:** `completeStep(stepId)` is exported from useOnboarding but nothing calls it. The checklist always shows "0 of 5 complete!" regardless of what the user does.

**User Impact:** Users complete actions (add an element, edit text, publish) but the checklist never advances. Progress bar stays empty. The feature is non-functional.

**Root Cause:** Feature built at the UI layer but integration layer never implemented. completeStep() was never wired to actual user actions.

**Recommendation:** Wire completeStep() to Composer events:
```ts
composer.on("element:added",      () => completeStep("add-element"));
composer.on("element:text:edited", () => completeStep("edit-text"));
composer.on("styles:updated",     () => completeStep("change-style"));
composer.on("preview:opened",     () => completeStep("preview"));
composer.on("project:published",  () => completeStep("publish"));
```

---

### ONB-05 — Storage Key Namespace Inconsistency

| | |
|--|--|
| **Severity** | High |
| **Lens** | Consistency |
| **Evidence** | 4 hardcoded keys across 3 files — 2 naming conventions |

**Observation:**
- `buildrik_onboarding_complete` — underscore, buildrik prefix
- `buildrik_onboarding_tour_v1` — underscore, buildrik prefix, versioned
- `aquibra-onboarding-progress` — hyphen, aquibra prefix
- `aquibra-onboarding-dismissed` — hyphen, aquibra prefix

**Root Cause:** OnboardingModal and TourOverlay written under "buildrik" brand. OnboardingProgress/useOnboarding written under "aquibra" brand. No shared constants file.

**Recommendation:** Create `src/shared/constants/storageKeys.ts` as SSOT for all keys.

---

### ONB-06 — OnboardingModal and TourOverlay Duplicate Same Content

| | |
|--|--|
| **Severity** | High |
| **Lens** | Consistency, Onboarding/Guidance |
| **Evidence** | `OnboardingModal.tsx:17-33` vs `TourOverlay.tsx:20-46` |

**Observation:**
- Modal Step 1: "Pick a template — Start with a professionally designed template..."
- Tour Step 1: "Choose a template — Start with a professionally designed template..."
- Modal Step 2: "Customize your design — Drag elements, edit text..."
- Tour Step 2: "Edit your page — Click any element to edit. Drag to rearrange."

Same three concepts (template, edit, publish) described twice by two different systems.

**Root Cause:** Both systems built with the same mental model of the workflow. No consolidation happened.

**Recommendation:** Delete the modal. The tour (spotlight) is superior because it points at real UI elements.

---

### ONB-07 — TourOverlay Targets Fragile Selectors

| | |
|--|--|
| **Severity** | Medium |
| **Lens** | Error Prevention & Recovery |
| **Evidence** | `TourOverlay.tsx:29` — `target: "rail-tab-templates"`; `TourOverlay.tsx:41` — `target: ".pillPublish"` |

**Observation:** TourOverlay looks up targets via `getElementById("rail-tab-templates")` and `querySelector(".pillPublish")`. If either target is not found, the card falls back to center-screen with no spotlight — the primary value of TourOverlay silently disappears.

**Recommendation:** Use `data-tour-target` attributes instead of IDs/classes:
```tsx
// Rail tab:    data-tour-target="templates-tab"
// Publish btn: data-tour-target="publish-btn"
document.querySelector('[data-tour-target="publish-btn"]')
```

---

### ONB-08 — No Focus Trap in OnboardingModal

| | |
|--|--|
| **Severity** | Medium |
| **Lens** | Accessibility (WCAG 2.1 SC 1.3.1) |
| **Evidence** | `OnboardingModal.tsx:143-153` — `modalRef.current?.focus()` called but no trap loop |

**Observation:** OnboardingModal calls `modalRef.current?.focus()` on mount but implements no focus trap. Tab key navigates to elements behind the modal overlay (editor canvas, rail, inspector).

**User Impact:** Screen reader users Tab past modal buttons into editor controls that are visually blocked. WCAG 2.1 SC 1.3.1 and 4.1.3 require modal focus containment.

---

### ONB-09 — No Success State When Checklist Completes

| | |
|--|--|
| **Severity** | Low |
| **Lens** | Feedback & System Status |
| **Evidence** | `OnboardingProgress.tsx:33` — `if (dismissed || isComplete) return null` |

**Observation:** When all steps complete, the widget returns null immediately — vanishes without animation or acknowledgment. The completion milestone is silent.

**Recommendation:** Add a 2-second success state ("You're all set! Ready to build anything.") before hiding.

---

### ONB-10 — "Add panel" vs "Build" Label Mismatch

| | |
|--|--|
| **Severity** | Low |
| **Lens** | Microcopy, Consistency |
| **Evidence** | Screenshots show "Drag an element from the Add panel"; rail label is "Build" |

**Observation:** An earlier version of the code named the panel "Add". Screenshots captured at that time. Code now says "Build panel" in `useOnboarding.ts:45`. Confirm screenshots are retaken — code is already correct.

---

### Issue Summary

| ID | Title | Severity | Effort |
|----|-------|----------|--------|
| ONB-01 | Three concurrent onboarding systems | Critical | 2 days |
| ONB-02 | Name-project step not reached | Critical | 4 hours |
| ONB-03 | Stale localStorage, no schema version | Critical | 1 hour |
| ONB-04 | completeStep() never called | High | 1 day |
| ONB-05 | Storage key namespace inconsistency | High | 30 min |
| ONB-06 | Modal and tour duplicate same content | High | 3 hours |
| ONB-07 | Fragile CSS selectors in TourOverlay | Medium | 2 hours |
| ONB-08 | No focus trap in OnboardingModal | Medium | 1 hour |
| ONB-09 | No success state on checklist | Low | 1 hour |
| ONB-10 | "Add panel" vs "Build" copy mismatch | Low | 5 min |

---

## Section C: Recommended Architecture

### Current Architecture (Problems)

```
FIRST LOAD (t=0ms):
├── OnboardingModal     — 3-step center dialog (z-index 9999)
├── TourOverlay         — 4-step spotlight, 1000ms delay (z-index 9999)
└── OnboardingProgress  — checklist widget, always visible (z-index 1000)

Problems:
- All three visible simultaneously from the first second
- No sequencing — each component is fully independent
- Modal and tour describe the same 3 features with different words
- Modal has no UI affordances — describes, doesn't show
- completeStep() wired to nothing — always 0%
- 4 localStorage keys, 2 naming conventions
- Project name never captured reliably
```

### Proposed Architecture (Consolidated)

```
FIRST LOAD — Single entry point
│
├── GATE: Check "aqb-onboarding-v2-complete" in localStorage
│   ├── "true"  --> Skip, show editor + checklist
│   └── null   --> Start onboarding flow
│
PHASE 1: NameProjectStep (blocking, center card)
  "What's your project called?"
  [pre-filled input, auto-selected]
  [Skip]  [Let's go ->]
  On submit: calls onNameProject(), advances to Phase 2
│
PHASE 2: TourOverlay (3 steps — reduced from 4)
  Step 1: Spotlight Templates icon -> "Start with a template"
  Step 2: Spotlight Build icon    -> "Add your first element"
  Step 3: Spotlight Publish btn   -> "Publish when you're ready"
  On finish: sets "aqb-onboarding-v2-complete" -> Phase 3
│
PHASE 3: OnboardingProgress widget appears (not before)
  5 items, auto-completes via Composer events
  Collapsed by default
  Success state on completion, then fades out
```

### Files to Keep / Remove / Add

```
REMOVE:
  src/editor/onboarding/OnboardingModal.tsx
  (gate with feature flag first, delete after 2-week bake)

KEEP + MODIFY:
  src/shared/ui/TourOverlay.tsx
    - Reduce to 3 steps (remove name-project step)
    - Change targets to data-tour-target attributes
    - Add onTourComplete callback
    - Remove 1000ms delay (render when called by orchestrator)

  src/editor/onboarding/OnboardingProgress.tsx
    - Only renders when "aqb-onboarding-v2-complete" = "true"
    - Add success state before hiding

  src/shared/hooks/useOnboarding.ts
    - Add CURRENT_VERSION = 2
    - Add version check on load — reset if mismatch
    - Update storage key to "aqb-onboarding-progress"

ADD:
  src/editor/onboarding/NameProjectStep.tsx
    - Focused modal: project name input, skip, next
  src/shared/constants/storageKeys.ts
    - SSOT for all localStorage keys
  src/editor/onboarding/useOnboardingWatcher.ts
    - Wires completeStep() to Composer events
```

### Storage Keys — Before / After

```
BEFORE (4 keys, 2 conventions, no coordination):
  "buildrik_onboarding_complete"   <- OnboardingModal
  "buildrik_onboarding_tour_v1"    <- TourOverlay
  "aquibra-onboarding-progress"    <- useOnboarding
  "aquibra-onboarding-dismissed"   <- useOnboarding

AFTER (2 keys, 1 convention, versioned):
  "aqb-onboarding-v2-complete"     <- tour done flag
  "aqb-onboarding-progress"        <- checklist progress
  "aqb-onboarding-version"         <- schema version
  "aqb-onboarding-dismissed"       <- widget dismissed
```

### Checklist Steps — Before / After

```
BEFORE (screenshots — 9 items, wrong copy):
  Add an element, Edit text, Change a style, Create a page,
  Preview your site, Save a component, Use undo/redo,
  Use a shortcut, Export your work (-> Go to Settings WRONG)

AFTER (code — 5 items, correct copy, wired to events):
  Add an element         <- fires on composer "element:added"
  Edit text              <- fires on composer "element:text:edited"
  Change a style         <- fires on composer "styles:updated"
  Preview your site      <- fires on composer "preview:opened"
  Publish your site      <- fires on composer "project:published"
```

---

## Section D: Wireframe / Layout Recommendations

### D1. Phase 1 — NameProjectStep

```
+-------------------------------------------------------------+
|                  [Editor canvas — dimmed]                   |
|                                                             |
|         +-------------------------------------------+       |
|         |  Welcome to Buildrik                      |       |
|         |                                           |       |
|         |  What's your project called?              |       |
|         |                                           |       |
|         |  +-----------------------------------+   |       |
|         |  | My Portfolio Website               |   |       |
|         |  +-----------------------------------+   |       |
|         |  <- pre-filled, auto-selected            |       |
|         |                                           |       |
|         |  [Skip]                  [Let's go ->]  |       |
|         +-------------------------------------------+       |
|                                                             |
+-------------------------------------------------------------+

Layout rules:
- No full-screen dark backdrop (canvas visible at 60% opacity)
- Card: max-width 400px, centered, border-radius 16px
- Input: full width, height 44px (touch target)
- Enter key submits
- "Skip" submits "Untitled Project" silently
```

### D2. Phase 2 — TourOverlay (3 Steps)

**Step 1 of 3 — Templates**
```
+---------------------------------------------------------------+
| [Spotlight: Templates icon lit, everything else 55% opacity] |
|                                                               |
|  [Templ]  +--------------------------------------------+    |
|  [icon]<--| Step 1 of 3                          Skip  |    |
|  [lit]    |                                            |    |
|           | Start with a template                      |    |
|           | Browse 10+ templates or build from         |    |
|           | scratch. Click the icon to open.           |    |
|           |                                            |    |
|           | * o o    [Open Templates]   [Skip ->]     |    |
|           +--------------------------------------------+    |
+---------------------------------------------------------------+
Changes vs current:
- Primary CTA "Open Templates" opens panel AND advances step
- Copy names the specific action: "Click the icon"
```

**Step 2 of 3 — Build Panel**
```
+---------------------------------------------------------------+
| [Spotlight: Build icon lit]                                   |
|                                                               |
|  [Build]  +--------------------------------------------+    |
|  [icon]<--| Step 2 of 3                          Skip  |    |
|  [lit]    |                                            |    |
|           | Add your first element                     |    |
|           | Drag a Heading, Button, or Section         |    |
|           | onto the canvas. Or click to place.        |    |
|           |                                            |    |
|           | o * o    [Open Build Panel]  [Skip ->]    |    |
|           +--------------------------------------------+    |
+---------------------------------------------------------------+
```

**Step 3 of 3 — Publish**
```
+---------------------------------------------------------------+
| [Spotlight: Publish button lit]                               |
|                                                               |
| +----------------------------------------+   [Publish btn]   |
| | Step 3 of 3                      Skip  |<--[spotlit]       |
| |                                        |                   |
| | Publish when you're ready              |                   |
| | Your work saves automatically.         |                   |
| | Hit Publish only when you want the     |                   |
| | world to see your site.                |                   |
| |                                        |                   |
| | o o *                    [Got it]     |                   |
| +----------------------------------------+                   |
+---------------------------------------------------------------+
Change: explicitly says "saves automatically" -- addresses
save vs publish confusion. No "Skip" on final step.
```

### D3. Phase 3 — OnboardingProgress (Revised)

**Collapsed (default after tour):**
```
+----------------------------------------------+
| Get started                    v  X          |
| 0 of 5 complete!  [                    ]     |
+----------------------------------------------+
```

**Expanded:**
```
+----------------------------------------------+
| Get started                    ^  X          |
| 0 of 5 complete!  [                    ]     |
+----------------------------------------------+
| o  Add an element                            |
|    Drag from the Build panel or click        |
| o  Edit text                                 |
|    Double-click any text to edit             |
| o  Change a style                            |
|    Select an element, adjust in inspector    |
| o  Preview your site                         |
|    Click Preview in the top bar              |
| o  Publish your site                         |
|    Click the green Publish button            |
+----------------------------------------------+
```

**As user acts (auto-completes):**
```
+----------------------------------------------+
| Get started                    ^  X          |
| 3 of 5 complete!  [############        ]     |
+----------------------------------------------+
| /  Add an element          (strikethrough)   |
| /  Edit text               (strikethrough)   |
| /  Change a style          (strikethrough)   |
| o  Preview your site                         |
| o  Publish your site                         |
+----------------------------------------------+
```

**Success state (2 seconds before hiding):**
```
+----------------------------------------------+
|  All done! Ready to build anything.          |
+----------------------------------------------+
```

### D4. Full Spatial Layout — All Three Phases

```
PHASE 1 (Name Project):
+---------+----------------------------------------+----------+
|  Rail   |              Canvas                    |Inspector |
| (muted) |       +------------------+             | (muted)  |
|         |       | Welcome          |             |          |
|         |       | [Project name  ] |             |          |
|         |       | [Skip][Let's go] |             |          |
|         |       +------------------+             |          |
+---------+----------------------------------------+----------+
Canvas visible but not interactive

PHASE 2 (Tour):
+---------+----------------------------------------+----------+
|[Templ]  |              Canvas                    |Inspector |
| <lit>   |   +--------------------------------+   | (dark)   |
| (dark)  |   | Step 1 of 3             Skip  |   |          |
| (dark)  |   | Start with a template          |   |          |
| (dark)  |   | * o o  [Open Templates]        |   |          |
|         |   +--------------------------------+   |          |
+---------+----------------------------------------+----------+
Spotlight on target, everything else 55% opacity

PHASE 3 (Working editor + checklist):
+---------+----------------------------------------+----------+
|  Rail   |              Canvas (interactive)      |Inspector |
|  (full) |                                        |  (full)  |
|         |                                        |          |
|         |   +----------------------------------+ |          |
|         |   | Get started -- 1 of 5  [v] [X]  | |          |
|         |   +----------------------------------+ |          |
+---------+----------------------------------------+----------+
No overlays. Widget collapsed by default.
```

### D5. Responsive Behavior

| Breakpoint | NameProjectStep | TourOverlay | OnboardingProgress |
|------------|----------------|-------------|-------------------|
| Desktop >= 1024px | 400px centered | 400px card, near target | 360px bottom-center |
| Tablet 768-1023px | 90vw | 90vw card, may shift center | 90vw bottom-center |
| Mobile < 768px | Full-width card | Bottom-sheet, swipe-navigable | Full-width fixed bottom |

---

## Section E: Implementation Fixes

### E-01 — Centralise Storage Keys (SSOT)

**File:** Create `src/shared/constants/storageKeys.ts`
**Effort:** 30 min | **Risk:** Zero

```ts
// src/shared/constants/storageKeys.ts
export const STORAGE_KEYS = {
  ONBOARDING_TOUR_V2:   "aqb-onboarding-v2-complete",
  ONBOARDING_PROGRESS:  "aqb-onboarding-progress",
  ONBOARDING_DISMISSED: "aqb-onboarding-dismissed",
  ONBOARDING_VERSION:   "aqb-onboarding-version",
  // Legacy — read-only for migration:
  _LEGACY_MODAL:        "buildrik_onboarding_complete",
  _LEGACY_TOUR_V1:      "buildrik_onboarding_tour_v1",
} as const;
```

Update all three onboarding files to import from this file.

---

### E-02 — Add Schema Version, Clear Stale localStorage

**File:** `src/shared/hooks/useOnboarding.ts`
**Effort:** 1 hour | **Risk:** Low

```ts
import { STORAGE_KEYS } from "../constants/storageKeys";

const CURRENT_VERSION = 2;

// Inside useState initializer:
const storedVersion = Number(
  localStorage.getItem(STORAGE_KEYS.ONBOARDING_VERSION) ?? "0"
);
if (storedVersion < CURRENT_VERSION) {
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DISMISSED);
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_VERSION, String(CURRENT_VERSION));
  return DEFAULT_STEPS;
}
```

---

### E-03 — Add Focus Trap to OnboardingModal

**File:** `src/editor/onboarding/OnboardingModal.tsx:143-153`
**Effort:** 1 hour | **Risk:** Low

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") { handleSkip(); return; }
    if (e.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  modalRef.current?.querySelector<HTMLElement>("button")?.focus();
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [handleSkip]);
```

---

### E-04 — Replace Fragile CSS Selectors with data-tour-target

**Files:** `TourOverlay.tsx`, `LeftRail.tsx`, `TopBar.tsx`
**Effort:** 2 hours | **Risk:** Low

```tsx
// LeftRail.tsx — add to Templates button:
data-tour-target="templates-tab"

// TopBar.tsx — add to Publish button:
data-tour-target="publish-btn"

// TourOverlay.tsx — update lookup:
const target = currentStep.tourTarget
  ? document.querySelector<HTMLElement>(
      `[data-tour-target="${currentStep.tourTarget}"]`
    )
  : document.getElementById(currentStep.target);
```

---

### E-05 — Wire completeStep() to Composer Events

**File:** Create `src/editor/onboarding/useOnboardingWatcher.ts`
**Effort:** 1 day | **Risk:** Medium

```ts
// src/editor/onboarding/useOnboardingWatcher.ts
import { useEffect } from "react";
import type { Composer } from "../../engine/Composer";
import { useOnboarding } from "../../shared/hooks/useOnboarding";

export function useOnboardingWatcher(composer: Composer | null) {
  const { completeStep } = useOnboarding();

  useEffect(() => {
    if (!composer) return;
    const cleanups = [
      composer.on("element:added",       () => completeStep("add-element")),
      composer.on("element:text:edited", () => completeStep("edit-text")),
      composer.on("styles:updated",      () => completeStep("change-style")),
      composer.on("preview:opened",      () => completeStep("preview")),
      composer.on("project:published",   () => completeStep("publish")),
    ];
    return () => cleanups.forEach((off) => off?.());
  }, [composer, completeStep]);
}
```

```tsx
// AquibraStudio.tsx — add one line inside component:
useOnboardingWatcher(composer);
```

> Verify exact Composer event names against `src/engine/Composer.ts` before shipping.

---

### E-06 — Add Success State to OnboardingProgress

**File:** `src/editor/onboarding/OnboardingProgress.tsx`
**Effort:** 1 hour | **Risk:** Low

```tsx
const [showSuccess, setShowSuccess] = React.useState(false);

React.useEffect(() => {
  if (isComplete) {
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 2500);
    return () => clearTimeout(timer);
  }
}, [isComplete]);

if (dismissed) return null;
if (isComplete && !showSuccess) return null;

if (showSuccess) {
  return (
    <div style={{ ...containerStyles, padding: "16px 20px" }}>
      <span style={{ fontSize: 14, fontWeight: 600,
                      color: "var(--aqb-success, #10b981)" }}>
        All done! Ready to build anything.
      </span>
    </div>
  );
}
```

---

### E-07 — Create NameProjectStep Component

**File:** Create `src/editor/onboarding/NameProjectStep.tsx`
**Effort:** 3 hours | **Risk:** Low

```tsx
// src/editor/onboarding/NameProjectStep.tsx
interface NameProjectStepProps {
  initialName?: string;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export const NameProjectStep: React.FC<NameProjectStepProps> = ({
  initialName = "Untitled Project",
  onSubmit,
  onSkip,
}) => {
  const [name, setName] = React.useState(initialName);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { inputRef.current?.select(); }, []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSkip]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998,
                  background: "rgba(0,0,0,0.45)",
                  display: "flex", alignItems: "center",
                  justifyContent: "center" }}>
      <div role="dialog" aria-modal="true"
           aria-labelledby="name-project-title"
           style={{ background: "var(--aqb-bg-panel)",
                    border: "1px solid var(--aqb-border)",
                    borderRadius: 16, padding: 32, width: 400,
                    display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 id="name-project-title"
              style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
            Welcome to Buildrik
          </h2>
          <p style={{ fontSize: 14, margin: "8px 0 0" }}>
            What's your project called?
          </p>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSubmit(name.trim() || "Untitled Project"); }}
          placeholder="My Portfolio Website"
          aria-label="Project name"
          style={{ padding: "10px 14px", fontSize: 14, borderRadius: 8,
                   height: 44, width: "100%", boxSizing: "border-box" }}
          autoFocus
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={onSkip} type="button"
                  style={{ background: "none", border: "none",
                           minHeight: 44, minWidth: 44, cursor: "pointer" }}>
            Skip
          </button>
          <Button variant="primary"
                  onClick={() => onSubmit(name.trim() || "Untitled Project")}>
            Let's go
          </Button>
        </div>
      </div>
    </div>
  );
};
```

**Wire in AquibraStudio.tsx:**
```tsx
const [onboardingPhase, setOnboardingPhase] = useState<"name"|"tour"|"done">(() =>
  localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_V2) === "true" ? "done" : "name"
);

{onboardingPhase === "name" && (
  <NameProjectStep
    initialName={projectName}
    onSubmit={(name) => { handleRenameProject(name); setOnboardingPhase("tour"); }}
    onSkip={() => setOnboardingPhase("tour")}
  />
)}
{onboardingPhase === "tour" && <TourOverlay ... />}
<OnboardingProgress />
```

---

### E-08 — Remove OnboardingModal (Consolidation)

**File:** Shell component that renders `<OnboardingModal>`
**Effort:** 3 hours + testing | **Risk:** Medium

```tsx
// Step 1: Gate with feature flag (safe interim):
const CONSOLIDATE_ONBOARDING = true;

{showOnboarding && !CONSOLIDATE_ONBOARDING && (
  <OnboardingModal onComplete={...} onSkip={...} />
)}

// Step 2: After 2-week bake, delete OnboardingModal.tsx entirely
```

---

### E-09 — Microcopy Fixes

| File | Line | Current | Fixed |
|------|------|---------|-------|
| `TourOverlay.tsx` | Step 1 description | "Start with a professionally designed template or build from scratch." | "Browse 10+ templates or build from scratch. Click the icon to open." |
| `TourOverlay.tsx` | Step 2 description | "Click any element to edit. Drag to rearrange." | "Add your first element. Drag from the Build panel or click to place." |
| `TourOverlay.tsx` | Step 3 description | "Your work saves automatically. Hit Publish only when you're ready to go live." | "Your work saves automatically. Hit Publish only when you want the world to see your site." |

---

## Section F: Quick-Wins vs Refactor Roadmap

### Priority Matrix

| ID | Issue | Severity | Effort | Risk |
|----|-------|----------|--------|------|
| ONB-05 | Storage key SSOT | High | 30 min | Zero |
| ONB-03 | Schema version + stale localStorage reset | Critical | 1 hour | Low |
| E-09 | Microcopy fixes (3 strings) | Medium | 30 min | Zero |
| ONB-08 | Focus trap in OnboardingModal | Medium | 1 hour | Low |
| ONB-07 | data-tour-target attributes | Medium | 2 hours | Low |
| ONB-09 | Success state on checklist | Low | 1 hour | Low |
| ONB-02 | NameProjectStep component | Critical | 3 hours | Low |
| ONB-01 | Remove OnboardingModal | Critical | 3 hours | Medium |
| ONB-06 | TourOverlay -> 3 steps + CTAs | High | 2 hours | Medium |
| ONB-04 | Wire completeStep() to Composer | High | 1 day | Medium |

---

### Tier 1: Quick Wins (< 1 day total)

```
QW-1  SSOT for storage keys (30 min, zero risk)
      Create src/shared/constants/storageKeys.ts
      Import in all 3 onboarding files
      Impact: Prevents future key drift

QW-2  Schema version reset (1h, low risk)
      Add CURRENT_VERSION = 2 to useOnboarding
      On load: if version < 2, clear + reset
      Impact: Clears 9-item stale checklists for ALL existing users

QW-3  Microcopy updates (30 min, zero risk)
      3 TourOverlay step descriptions
      Impact: Copy matches actual UI, no ambiguity on next action

QW-4  Focus trap in OnboardingModal (1h, low risk)
      10-line addition to existing useEffect
      Impact: WCAG 2.1 SC 1.3.1 compliance for keyboard users

QW-5  data-tour-target attributes (2h, low risk)
      2 attributes in LeftRail + TopBar
      Impact: Tour spotlight never silently fails on refactor
```

**Combined: ~5 hours. QW-2 alone fixes the most visible user-facing bug.**

---

### Tier 2: Medium Effort (1–3 days)

```
M-1  NameProjectStep (3h)
     New component, wire to AquibraStudio as Phase 1 gate
     Impact: "Untitled Project" finally addressed

M-2  Checklist success state (1h)
     isComplete -> showSuccess -> fade-out
     Impact: Completion milestone acknowledged

M-3  TourOverlay -> 3 steps + action CTAs (2h)
     Remove name-project step (moved to NameProjectStep)
     Add "Open Templates" / "Open Build Panel" CTAs
     Impact: Tour is coherent, each step has a clear action
     Dependency: NameProjectStep (M-1)
```

---

### Tier 3: Structural Refactor (1+ days)

```
R-1  Remove OnboardingModal (3-4h + testing)
     Gate with feature flag, then delete after 2-week bake
     Impact: Eliminates triple-system confusion entirely
     Risk: User-visible change. A/B test if possible.

R-2  Wire completeStep() to Composer events (1 day)
     Create useOnboardingWatcher.ts
     Wire 5 Composer events to 5 checklist steps
     Impact: Checklist goes from 0%-forever to real tracking
     Risk: Depends on Composer event reliability
```

---

### Execution Sequence

```
WEEK 1
------
Day 1 (5h):  QW-1 storageKeys.ts + QW-2 schema version
             + QW-3 microcopy + QW-4 focus trap
Day 2 (5h):  QW-5 data-tour-target + M-1 NameProjectStep
             + M-2 checklist success state
Day 3 (5h):  M-3 TourOverlay 3 steps + R-1 remove modal (flag)

WEEK 2
------
Day 4-5 (1d): R-2 wire completeStep() to Composer events
              QA: fresh user flow end-to-end

WEEK 3
------
Cleanup: delete legacy keys, delete OnboardingModal.tsx,
         retake screenshots
```

---

### The Single Most Impactful Fix

**ONB-03 — Schema version reset (1 hour, 1 file).**

Every existing user who loaded the editor before the code was updated still sees:
- 9-item checklist (wrong)
- "Export your work — Go to Settings to export or publish your site" (wrong navigation)

The fix clears it on next load and replaces with the correct 5-item list. No other change ships as much user-facing value per line of code.

---

### What Is Already Fixed in Code (No Action Needed)

| Issue | Old (screenshots) | Fixed (code) |
|-------|------------------|--------------|
| Domain copy | "goes live on your custom domain" | "free Buildrik URL, custom domain coming soon" |
| Checklist last item | "Export your work -> Settings" | "Publish your site -> Publish button top right" |
| Checklist count | 9 items | 5 items (correct) |
| Name-project step | Missing | Added as TourOverlay step 0 |

These fixes exist in code but are not reaching users due to stale localStorage — resolved by ONB-03.

---

### Final Counts

| Metric | Value |
|--------|-------|
| Issues found | 10 |
| Critical | 3 (ONB-01, ONB-02, ONB-03) |
| High | 3 (ONB-04, ONB-05, ONB-06) |
| Medium | 2 (ONB-07, ONB-08) |
| Low | 2 (ONB-09, ONB-10) |
| Already fixed in code (needs localStorage clear) | 3 |
| New files needed | 2 (NameProjectStep.tsx, storageKeys.ts, useOnboardingWatcher.ts) |
| Files to delete | 1 (OnboardingModal.tsx — after migration) |
| Storage keys: before -> after | 4 -> 2 |
| Checklist items: before -> after | 9 -> 5 |
| Lines of code for all quick wins | ~50 |

---

*End of Audit — 2026-03-07*
*Evidence: 21 screenshots (ezgif-frame-001 through ezgif-frame-021)*
*Code: OnboardingModal.tsx, OnboardingProgress.tsx, useOnboarding.ts, TourOverlay.tsx*
