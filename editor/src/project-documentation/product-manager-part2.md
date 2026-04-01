# Buildrik — Complete PRD Part 2
# Tasks 1–7: Competitive Matrix, Personas, Features, Analytics, Design System, Validation, i18n

> Appended to: `product-manager-output.md`
> Date: 2026-03-25

---

# TASK 1: Competitive Matrix

> Training-data accuracy: Webflow/Framer/Figma Sites flagged where uncertain. Squarespace/Wix Studio data is approximate.

| Dimension | Webflow | Framer | Figma Sites | Squarespace | Wix Studio |
|-----------|---------|--------|-------------|-------------|------------|
| **Target audience** | Agencies + freelancers building production sites | Product designers wanting interactive + published sites | Figma users publishing designs directly | Small businesses + creators (non-technical) | Agencies + professional designers (enterprise Wix) |
| **IA approach** | ~6 panels (Add, Navigator, Pages, CMS, Assets, Settings) with secondary tabs; complex but learnable | ~5 panels (Components, Pages, Layers, Assets, Settings); cleaner than Webflow | Inherits Figma IA (Layers, Assets, Pages) + Sites-specific panel; familiar to Figma users | Minimal — 3 sections (Add, Design, Pages); heavily guided; hides complexity | ~8 panels; closest to Webflow in complexity; less well organized |
| **Drag UX quality** | Excellent — absolute positioning + flexbox/grid; CSS-accurate; no ghost artifacts | Best-in-class — physics-based, spring animations, near-native feel | Free-form (Figma canvas model); no traditional element-from-palette drag | Section-based drag with limited freedom; simplified; good for beginners | Free-form with responsive helpers; acceptable but feels less premium than Framer |
| **Undo depth** | ~100 steps (⚠️ uncertain) | Generous — matches Figma (~200+ steps estimated) | Full Figma undo (100+ steps, well-specified) | Limited (~20 steps estimated; not publicly documented) | Standard (~50 steps estimated) |
| **Onboarding** | Steep — "Webflow University" compensates; template chooser; no interactive tour | Template-first; quick start; targets designers who already know web concepts | Figma-native — existing Figma users have zero ramp; new users face Figma's learning curve | Best-in-class for beginners — question-based ("What kind of site?"), curated templates, guided | Improved in Studio launch; still complex; tutorial videos; not as smooth as Squarespace |
| **CMS approach** | First-class, mature — Collections with reference fields, conditional visibility, staging environment, multi-environment | Basic CMS — simple collections, no reference fields, no staging | Minimal/none at launch (⚠️ uncertain — may have shipped basic CMS post-training cutoff) | Blog + basic Collections — sufficient for content-light sites; no reference fields | Wix Content Manager — robust, database-like, comparable to Webflow; large ecosystem |
| **Code export** | HTML/CSS/JS — clean output; **no React/Vue/Next.js native export** (Webflow's biggest technical weakness) | React components — clean, uses Framer's React runtime; limited portability outside Framer | Very limited — not a code export tool; HTML embed snippets only | None — fully closed ecosystem; no export | None — closed ecosystem; no code export |
| **Collaboration** | Multi-user editing (limited real-time); guest editors by role; comments | Real-time multiplayer (good); comments; not Figma-quality | Best-in-class — Figma's multiplayer is the industry benchmark | Contributor roles; no real-time; adequate for solo/small teams | Team roles; basic collaboration; no real-time multiplayer |
| **Biggest strength vs Buildrik** | Production-grade hosting, mature SEO, Webflow University, massive community, battle-tested at scale | Animation quality and physics-based interactions; canvas feel; React code output | Collaboration fidelity; zero-friction for existing Figma teams; design accuracy | Beautiful curated templates; hosting simplicity; question-based onboarding | Native ecommerce, booking, forms ecosystem; app marketplace; managed hosting |
| **Biggest weakness vs Buildrik** | No React/Vue/Next.js export; design token system is weak; steep learning curve for non-technical; expensive | CMS is shallow; poor fit for content-heavy sites; Framer-runtime lock-in limits portability | Not a real builder — no CMS, no design system, limited customization | No developer handoff; no design tokens; no component system; locked ecosystem | Closed ecosystem; no code export; vendor lock-in; can feel bloated |
| **Steal from them** | Staging environment for CMS; Webflow University (in-app learning); visual CSS grid editor; conditional visibility in CMS | Physics spring animations; canvas interaction feel; component variant system UX | Multiplayer cursor UX; comment threading; branch/version model | Question-based onboarding ("What kind of site are you building?"); template quality bar | App marketplace concept; native form/payment handling at export time |
| **Buildrik already does better** | Multi-format code export (React/Vue/Next.js); design token system; design team collaboration model | CMS depth; multi-format export; design system tokens; team permissions model | CMS; code export; page builder functionality; design token system | Code export; design system; component library; collaboration; developer handoff | Code export quality; design system approach; collaboration model; cleaner IA |

### Key Takeaways for Buildrik Roadmap

1. **Export is the moat** — no competitor does multi-format (HTML + React + Vue + Next.js) with a code quality score. Protect and expand this.
2. **CMS needs staging** — Webflow has it; Buildrik doesn't. For agency use cases, staging (draft vs live content) is table stakes.
3. **Steal Squarespace's onboarding model** — "What kind of site are you building?" routes users to relevant templates and hides irrelevant tabs. Maps directly to the "Focused Mode" recommendation.
4. **Framer's canvas feel is the UX benchmark** — if drag feels sluggish vs Framer, Buildrik loses designers. 60fps is not optional.
5. **Figma multiplayer is the collaboration benchmark** — Buildrik's 15s auto-lock model is functional; Figma's model is loved. Close the gap in Phase 2.

---

# TASK 2: User Personas (Expanded)

---

### Persona 1: Maya — Team Lead

**Role:** Design Director / Creative Lead
**Demographics:** 32-40 years old; team of 3-6; tech comfort 4/5 (can read code, doesn't write it daily)
**Primary goal:** Establish brand consistency across all pages, all team members, all client projects — without manually checking every element.
**Secondary goals:**
- Onboard new team members to the design system in < 1 day
- Prevent junior designers from breaking tokens or overriding brand colors
- Ship client handoffs (code export) that don't embarrass the agency

**Frustrations with current app:**
1. "Someone changed our primary color token and now 47 elements are wrong — I can't tell who did it or when."
2. "The Settings tab is buried at the bottom of the rail — I access it daily but it's far from my muscle memory position."
3. "I can't lock individual tokens. Junior designers keep overriding brand colors locally."
4. "History tab shows ALL changes from ALL users — I just want to see what Sarah changed."
5. "There's no way to enforce component usage — designers keep building one-off cards instead of using the Card component."

**Features used most (frequency order):**
1. Design System tab — daily (token management, palette updates)
2. Components tab — daily (new variants, reviewing instances)
3. History tab — weekly (auditing team changes)
4. Settings tab — weekly (domain, SEO, analytics config)
5. Publish tab — per-sprint (final deploy sign-off)

**Features never touched:** CMS (content team manages), Add/Build tab (leaves canvas building to designers), AI assistant (skeptical of AI in design workflow)

**Success metric:** Brand inconsistency issues reported by client per project → 0. Time to onboard new team member → < 4 hours.

**Quote:** *"I don't need more features. I need Buildrik to stop letting my team break things I set up last week."*

---

### Persona 2: Alex — Designer

**Role:** Visual / UX Designer
**Demographics:** 26-34 years old; individual contributor on a 2-5 person team; tech comfort 3/5 (knows CSS, intimidated by JS)
**Primary goal:** Go from a rough brief or Figma mockup to a styled, responsive, multi-section page in under 45 minutes.
**Secondary goals:**
- Experiment with layout quickly without fear of breaking the live site
- Reuse sections across pages without rebuilding from scratch
- Show client a live preview that matches what was designed

**Frustrations with current app:**
1. "I have to scroll through 150 elements to find the one I want. I know it's there but I can't find it fast enough."
2. "Every time I switch to the Inspector I lose my place on canvas — the scroll position jumps."
3. "Undoing a complex layout operation sometimes reverts 3 things I didn't want reverted."
4. "The canvas feels slightly laggy when I have 200+ elements. I'm comparing to Figma which is instant."
5. "I can't see spacing values until I select an element — I'm guessing all the time."

**Features used most (frequency order):**
1. Canvas + drag — every session
2. Inspector (Layout + Appearance) — every session
3. Add tab — every session
4. Layers tab — multiple times per session
5. Templates tab — start of new page

**Features never touched:** Publish tab (that's Maya's job), History tab (relies on Ctrl+Z), Settings tab, CMS (not her responsibility)

**Success metric:** Time from brief to first complete styled page < 45 minutes. Canvas interaction rating in user survey > 4/5.

**Quote:** *"If I wanted to fight with my tools I'd be writing HTML manually. I chose Buildrik so I can think about design, not drag mechanics."*

---

### Persona 3: Sam — Content Manager

**Role:** Content Strategist / Digital Content Manager
**Demographics:** 28-38 years old; non-technical (tech comfort 2/5); manages editorial calendar + website content for an in-house team
**Primary goal:** Publish content updates (blog posts, product updates, team bios) independently, without filing a ticket with the design team.
**Secondary goals:**
- Update images and copy across multiple pages without accidentally breaking the layout
- Preview content changes before going live
- Know when content was last updated and by whom

**Frustrations with current app:**
1. "I spent 20 minutes trying to find where to add a new blog post. I eventually asked Alex."
2. "I accidentally moved a section when I was trying to click into text to edit it. I didn't know how to undo it."
3. "The CMS binding icon in the Inspector makes no sense to me. I don't know what 'binding' means."
4. "There's no way for me to see just my pages — I see all 47 pages and have to scroll to find the ones I manage."
5. "I published changes and the live site looked completely different from what I saw in the editor."

**Features used most (frequency order):**
1. CMS tab (after proposed fix) — daily
2. Pages tab — weekly
3. Media tab — weekly
4. Preview mode — every publish cycle
5. Publish tab — weekly

**Features never touched:** Inspector, Add/Build tab, Layers tab, Design System, Components, Export, History, Settings

**Success metric:** Content published without design team involvement > 80% of updates. CMS access time < 30 seconds from app open.

**Quote:** *"I shouldn't need a designer to update a blog post. This is a website builder, not a design tool — but it keeps treating me like a designer."*

---

### Persona 4: Priya — Developer (Handoff)

**Role:** Frontend Engineer (receives handoff from design team)
**Demographics:** 24-32 years old; tech comfort 5/5; writes React/TypeScript daily; first time opening Buildrik is usually for handoff review
**Primary goal:** Receive a code export from Buildrik that passes ESLint, has proper component structure, and requires zero manual cleanup before integrating into the production codebase.
**Secondary goals:**
- Inspect element spacing, font sizes, and colors via a dev mode that shows actual CSS values — not "padding: 16px" vague specs
- Understand which exported file maps to which section on the live page
- Flag layout issues back to the designer without a separate communication tool

**Frustrations with current app:**
1. "The exported React code is one 800-line component. There are no sub-components, no separation of concerns. I have to refactor it before I can use it."
2. "The code quality score says 74/100 but doesn't tell me WHERE the problems are — it's just a number."
3. "I want to inspect an element's exact computed CSS but the Inspector shows design-editor values, not CSS equivalents."
4. "The export has hardcoded hex colors instead of CSS custom properties. My codebase uses design tokens."
5. "There's no way to leave a comment on a specific element like 'this animation doesn't match the spec.'"

**Features used most (frequency order):**
1. Export modal — primary use case
2. Inspector (dev mode) — inspect CSS values
3. Canvas — navigate to elements by clicking
4. Layers panel — find element by name
5. Pages tab — navigate between pages

**Features never touched:** Design System (for editing), Add/Build tab, CMS, Templates, AI assistant, Publish, Settings (not their domain), Collaboration (reads only)

**Success metric:** Exported React code passes ESLint + senior review without modification. Time from export download to integration into production codebase < 30 minutes.

**Quote:** *"A 74/100 code quality score means nothing to me if I can't see which components dragged it down. Show me the problems, let me click to fix them."*

---

# TASK 3: Complete Feature Specifications

---

## BUILD Group Features

---

### Feature: Element Add / Drag to Canvas

**IA Group:** Build
**User Story:** As a Designer, I want to drag an element from the Add panel onto the canvas, so that I can build page layouts visually without writing code.
**Complexity Level:** L1
**Priority:** P0 — Core interaction; without this, the product does not exist.

**Acceptance Criteria:**
- Given the Add tab is open, when I drag an element thumbnail, then a ghost preview (0.6 opacity) appears under my cursor within 50ms
- Given I'm dragging over the canvas, when I hover over a valid drop target, then the target highlights with a 2px blue dashed border
- Given I release over a valid drop target, then the element is inserted as a child of that target, the ghost settles with a 200ms spring animation, and the element is auto-selected
- Given I release over an invalid drop target, then the element snaps back to its origin (100ms ease-out), the drop target flashes red, and a toast reads "Cannot place [Type] inside [Parent]"
- Given I click (not drag) an element in the Add tab, then the element is inserted at the center of the visible canvas viewport (or inside the selected container if one is selected)
- Edge case: Drag starts but user presses Escape mid-drag → ghost disappears, no element created, no history entry
- Edge case: Drag target is 5+ levels deep → element is inserted, depth counter shown in Layers panel; if depth would exceed 6, drop zone turns red with tooltip "Maximum nesting depth (6) reached"
- Edge case: Dragging to empty canvas (no sections yet) → canvas shows "Drop here to create your first section" placeholder zone

**Input Methods:**
- Mouse: Click + hold on element thumbnail (>3px movement triggers drag); release to drop
- Keyboard: Select element in Add tab via Tab/arrow keys → Enter to insert at canvas center; or with canvas element selected, Enter opens "add child" flow
- Touch: Tap element thumbnail → long-press 300ms → drag; release to drop

**Feedback:**
- Predictive: Valid drop zones highlight (blue dashed border) as soon as drag is initiated; invalid zones show no highlight (or red if cursor enters them)
- Live: Ghost preview follows cursor at 0.6 opacity; original thumbnail stays in Add panel; target container's padding area shows as a light blue fill; spacing labels show pixel values from nearest sibling
- Confirmatory: Element settles with spring animation (200ms, stiffness 300, damping 20); Inspector populates immediately (<16ms); "Add [Element Type]" appears in undo tooltip; Layers panel auto-scrolls to new element

**Undo Behavior:** Ctrl+Z removes the element, collapses its position in the parent, and reselects the previously selected element. Toast: "Undo: Add [Element Type]"

**Error Prevention:**
- Nesting matrix enforced at drop time (client-side validation)
- Max depth 6 enforced at drop time
- Read-only elements (locked) cannot receive children via drag (cursor shows 🚫)

**Dependencies:** Add tab loaded; canvas mounted; Composer.elements.add() method available; nesting matrix loaded into DropTargetValidator

**Technical Constraints:** DOM-based canvas — performance degrades at 500+ elements; ghost preview uses CSS `pointer-events: none` to avoid interfering with drop target detection

**BEFORE:** Drag behavior exists but drop rejection feedback is generic ("invalid") with no animation or specific error message.
**AFTER:** Drop rejection = red flash + shake (150ms) + specific toast naming element types.
**BREAKING:** No
**MIGRATION:** Additive improvement.

---

### Feature: Element Selection (Single, Multi, Marquee)

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to select one or more elements on the canvas, so that I can edit, move, or style them together.
**Complexity Level:** L1
**Priority:** P0 — Selection is the prerequisite for every other canvas action.

**Acceptance Criteria:**
- Given an element on canvas, when I click it, then it becomes selected (2px solid blue border + 8 resize handles) and Inspector populates < 16ms
- Given an element is selected, when I click a different element, then the previous is deselected and the new element is selected
- Given an element is selected, when I click empty canvas, then all elements are deselected and Inspector shows empty state
- Given I hold Shift and click a second element, then both elements are selected; Inspector shows shared properties only; a dashed bounding box surrounds both
- Given I hold Shift and click an already-selected element, then that element is removed from the multi-selection
- Given I drag on empty canvas (no element under cursor), then a marquee rectangle appears; on release, all elements whose bounding box overlaps the marquee are selected
- Given I press Ctrl+A, then all elements on the current page/artboard are selected
- Given I click an element in the Layers panel, then that element is selected on canvas AND canvas scrolls to make it visible
- Given I select an element on canvas, then that element's row in Layers panel highlights AND Layers panel scrolls to show it
- Edge case: Locked element → click shows "Locked" tooltip; element NOT added to selection; cursor shows lock icon on hover
- Edge case: Hidden element → cannot be selected via canvas click; can be selected via Layers panel click (even when hidden)
- Edge case: Selecting an element inside a group → first click selects group; double-click enters group editing mode and selects the specific child

**Input Methods:**
- Mouse: Click (single), Shift+click (add/remove), Ctrl+click (toggle), drag on empty canvas (marquee)
- Keyboard: Tab cycles through all elements in document order; Shift+Tab reverses; Ctrl+A selects all; Escape deselects all
- Touch: Tap (single select), two-finger tap (add to selection), three-finger drag on empty canvas (marquee)

**Feedback:**
- Predictive: 1px dashed blue outline on element hover (before click)
- Live: Selection handles appear (8 handles: 4 corners + 4 midpoints); Inspector populates
- Confirmatory: Layers panel syncs; count badge in toolbar shows "3 selected" for multi-select

**Undo Behavior:** Selection state is NOT recorded in undo history (it is ephemeral UI state, not a data mutation).

**Error Prevention:** Locked elements show visual lock indicator on hover to prevent unexpected "why can't I select this?" confusion.

**Dependencies:** Canvas mounted; Composer.selection manager active; Layers panel subscribed to selection events

**Technical Constraints:** Marquee selection uses bounding box intersection, not pixel-perfect overlap — for performance at 500+ elements.

---

### Feature: Element Move / Resize / Rotate

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to move, resize, and rotate elements on the canvas, so that I can arrange the page layout precisely.
**Complexity Level:** L1
**Priority:** P0 — Fundamental manipulation; product nonfunctional without it.

**Acceptance Criteria:**
- Given an element is selected, when I drag it, then a ghost at 0.6 opacity follows cursor; smart alignment guides appear when edges/centers align with other elements; on release, element snaps to guide (if snap enabled) or lands at exact cursor position
- Given an element is selected, when I drag a corner resize handle, then width AND height change; aspect ratio is NOT locked by default; holding Shift locks aspect ratio
- Given an element is selected, when I drag a midpoint resize handle, then only the corresponding dimension changes
- Given an element is selected, when I hover just outside a corner handle (rotation zone, ~8px outside), then cursor changes to rotation cursor; drag rotates element around its center; Shift constrains to 15° increments
- Given I select an element and press arrow keys, then element moves 1px per keypress; Shift+Arrow moves 10px
- Given Inspector shows X/Y/W/H/Rotation inputs, when I type a value and press Enter, then element updates immediately
- Edge case: Moving element outside parent container bounds → element visually exits container; parent shows overflow indicator; no automatic clipping unless overflow:hidden is set
- Edge case: Resizing a text element → text reflows; minimum height grows with content; width can be shrunk until min-content width
- Edge case: Moving a group → all children maintain relative positions; group bounding box moves as one unit

**Input Methods:**
- Mouse: Drag body to move; drag handles to resize; drag rotation zone to rotate
- Keyboard: Arrow keys (1px), Shift+Arrow (10px), Alt+Arrow (resize by 1px from edge nearest arrow direction)
- Touch: Single-finger drag to move (after 300ms long-press initiates drag); pinch on selected element to resize

**Feedback:**
- Predictive: Smart alignment guides appear before release showing alignment with other elements; spacing labels show pixel values
- Live: Ghost preview follows cursor (move) or stretches (resize); dimension badge "W×H" updates in real-time during resize; rotation angle badge shows degrees during rotate
- Confirmatory: Ghost settles (200ms spring); Inspector updates with new values; history entry created

**Undo Behavior:** Move: Ctrl+Z returns to previous position. Resize: Ctrl+Z returns to previous dimensions. Rotate: Ctrl+Z returns to previous angle. Each is one discrete undo step (rapid drags within 500ms debounce window = one step).

**Error Prevention:**
- Snap-to-grid prevents pixel-misalignment (configurable; default ON)
- Minimum element size: 8×8px (cannot resize below)
- Rotation resets to 0° on double-click of rotation handle (escape hatch for "how do I unrotate this?")

**Dependencies:** Selection active; Composer.elements.update() method; smart guides system (GuideManager); history manager

**Technical Constraints:** Rotation stored as CSS `transform: rotate(Xdeg)` — parent-relative, not absolute. Nested rotations accumulate and can cause unexpected bounding boxes.

---

### Feature: Element Copy / Paste / Duplicate

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to copy, paste, and duplicate elements, so that I can reuse structures without rebuilding from scratch.
**Complexity Level:** L1
**Priority:** P0 — Core editing expectation from every desktop application.

**Acceptance Criteria:**
- Given an element is selected, when I press Ctrl+C, then element data is copied to an internal clipboard (not OS clipboard for complex elements) AND OS clipboard receives a simplified representation
- Given an element is copied, when I press Ctrl+V on the same page, then a new element appears offset +10px right / +10px down from original with a new unique ID
- Given an element is copied, when I navigate to a different page then press Ctrl+V, then the element appears at center of the target page viewport
- Given an element is selected, when I press Ctrl+D, then an instant duplicate appears offset +10px/+10px; duplicate is auto-selected; one history entry created
- Given I press Ctrl+X, then element is cut (removed from canvas) and stored in clipboard; original position shows empty gap; Ctrl+Z restores it
- Given I have image data in OS clipboard (copied from browser or Finder), when I press Ctrl+V on canvas, then an Image element is created at canvas center with the pasted image set as source
- Given I have plain text in OS clipboard, when I press Ctrl+V on canvas, then a Paragraph element is created at canvas center with the pasted text as content
- Given I press Ctrl+Shift+V with an element selected (paste styles), then source element's style properties are applied to the selected element; content (text, images) is unchanged
- Edge case: Pasting a group → pastes the entire group with all children; all children get new unique IDs; group structure preserved
- Edge case: Clipboard is empty and user presses Ctrl+V → no action, no error
- Edge case: Pasting element whose parent no longer exists (cross-session paste) → element is placed at canvas root level

**Input Methods:**
- Mouse: Right-click → Copy / Paste / Duplicate in context menu
- Keyboard: Ctrl+C (copy), Ctrl+X (cut), Ctrl+V (paste), Ctrl+D (duplicate), Ctrl+Shift+V (paste styles)
- Touch: Long-press 500ms → context menu → Copy / Paste / Duplicate

**Feedback:**
- Predictive: None needed
- Live: Duplicate appears immediately at offset position (no animation delay); is auto-selected
- Confirmatory: Toast for paste styles only: "Styles applied from [Element Type]"; Layers panel updates; history entry "Duplicate [Type]" or "Paste [Type]"

**Undo Behavior:** Ctrl+Z undoes the paste/duplicate (removes pasted element). Cut + Ctrl+Z restores the cut element to its original position.

**Error Prevention:** Multi-pasting the same element 20+ times in rapid succession (likely accidental) → throttle paste to 5 per second; show toast "Pasting quickly. Press Ctrl+Z to undo multiple pastes."

**Dependencies:** Internal clipboard (session-persistent, survives page navigation); OS clipboard API (for external paste); ElementManager.clone() with ID regeneration

**Technical Constraints:** OS clipboard access requires user permission on some browsers; fallback to internal clipboard silently if permission denied.

---

### Feature: Element Delete

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to delete elements I no longer need, so that I can clean up the canvas without leaving orphaned content.
**Complexity Level:** L1
**Priority:** P0 — Fundamental editing action.

**Acceptance Criteria:**
- Given an element is selected, when I press Delete or Backspace, then a confirmation modal appears: "Delete [Element Name]? This cannot be done if you have no undo steps remaining." with [Cancel] [Delete] buttons
- Given the confirmation modal is shown, when I click [Delete], then the element is removed from canvas, from Layers panel, and a history entry is created; Inspector shows empty state
- Given the confirmation modal is shown, when I press Escape or [Cancel], then nothing changes
- Given multiple elements are selected, when I press Delete, then the confirmation modal reads "Delete 3 elements?" and all are removed in one undo step
- Given I delete a parent container, then all children are deleted with it; history entry: "Delete Container (and 5 children)"
- Edge case: Deleting the only element on a page → canvas shows empty state ("Drag an element here to start"); no confirmation modal suppression
- Edge case: Element is referenced by a component instance → modal adds warning: "This element is part of [Component Name]. Deleting it will affect all instances."
- Edge case: Element has CMS binding → modal adds warning: "This element is bound to [Collection.Field]. The binding will be removed."

**Input Methods:**
- Mouse: Right-click → Delete in context menu
- Keyboard: Delete or Backspace (with confirmation modal); no "instant delete without confirmation"
- Touch: Long-press → context menu → Delete

**Feedback:**
- Predictive: None
- Live: None (modal is blocking)
- Confirmatory: Element fades out (150ms ease-in); toast "Deleted: [Element Name] — Ctrl+Z to undo"; Layers panel row removes with collapse animation

**Undo Behavior:** Ctrl+Z re-inserts element at its exact original position in the DOM order, with all properties intact, including CMS bindings.

**Error Prevention:** Confirmation modal for ALL deletes (no "skip confirmation" option in v1). This is intentional — accidental deletes are the #1 cause of user frustration in editors.

**Dependencies:** ElementManager.delete(); history manager; confirmation modal component

---

### Feature: Element Group / Ungroup

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to group multiple elements together, so that I can move, copy, and manage them as a single unit.
**Complexity Level:** L1
**Priority:** P1 — Essential for any layout more complex than a single-section page.

**Acceptance Criteria:**
- Given 2+ elements are selected, when I press Ctrl+G, then a Group element is created wrapping all selected elements; Group has its own bounding box and resize handles; Group is auto-selected; Layers panel shows Group with children nested
- Given a Group is selected, when I press Ctrl+Shift+G, then the Group is dissolved; children become direct siblings at their current positions; each child auto-selected as multi-selection
- Given a Group is selected, when I double-click it, then Group enters "edit mode" (blue dashed border on Group, normal handles on children); clicking a child selects that child for editing; Inspector shows child properties
- Given a Group is in edit mode, when I click outside the group on empty canvas, then edit mode exits; Group is re-selected as a unit
- Given I resize a Group, then all children resize proportionally (Shift-resize lock aspect ratio per child); individual child positions within Group scale to maintain relative layout
- Edge case: Grouping elements from different parent containers → all elements are moved to the nearest common ancestor container as the new Group parent
- Edge case: Group within a Group (nested) → allowed up to 3 levels of group nesting; at level 3, Ctrl+G shows warning "Maximum group nesting depth reached"
- Edge case: Ungrouping a Group that has been moved → children appear at their current (moved) absolute positions, not their original pre-group positions

**Input Methods:**
- Mouse: Select multiple → right-click → Group; right-click Group → Ungroup; double-click Group → enter edit mode
- Keyboard: Ctrl+G (group), Ctrl+Shift+G (ungroup), Escape (exit group edit mode)
- Touch: Multi-select via two-finger tap → long-press → Group

**Feedback:**
- Predictive: None
- Live: During group creation, a new bounding box animates to encompass all selected elements (150ms ease-out)
- Confirmatory: Layers panel shows "Group" with children indented; undo tooltip: "Group (4 elements)"

**Undo Behavior:** Ctrl+Z dissolves the group and restores individual elements as siblings at their pre-group positions.

**Error Prevention:** Cannot group a single element (Ctrl+G with 1 element selected → no-op with tooltip "Select 2 or more elements to group").

**Dependencies:** ElementManager; GroupManager (creates Group wrapper element); Layers panel tree sync

---

### Feature: Element Lock / Unlock

**IA Group:** Build (Canvas)
**User Story:** As a Team Lead, I want to lock elements, so that collaborators cannot accidentally move or edit them.
**Complexity Level:** L1
**Priority:** P1 — Protects intentional layouts from accidental editing.

**Acceptance Criteria:**
- Given an element is selected, when I press Ctrl+L or click the lock icon in the Layers panel, then the element becomes locked; resize handles are removed; cursor shows 🔒 on hover; element is no longer selectable by clicking on canvas
- Given a locked element, when I click it on canvas, then the element is NOT selected; canvas shows brief lock indicator (🔒 icon with tooltip "This element is locked. Unlock in Layers panel to edit.")
- Given a locked element in Layers panel, when I click its row, then the element IS selected (Layers panel allows selection of locked elements); Inspector shows properties but inputs are disabled
- Given a locked element's row in Layers panel, when I click the lock icon, then element becomes unlocked; handles reappear; element is selectable normally
- Given a parent container is locked, then ALL children are effectively locked (inherit lock state); Layers panel shows lock icon on parent and grayed lock icon on children
- Edge case: Locking a component instance → only that instance is locked, not the main component
- Edge case: Ctrl+A → locked elements are NOT included in the selection

**Input Methods:**
- Mouse: Lock icon in Layers panel row; right-click element → Lock
- Keyboard: Ctrl+L (lock/unlock toggle for selected element)
- Touch: Long-press → context menu → Lock

**Feedback:**
- Predictive: On hover of locked element, cursor changes to 🔒
- Live: Lock icon overlay appears on element on canvas (top-right corner, 12px icon); handles disappear
- Confirmatory: Layers panel row shows lock icon; element row grays slightly; toast: "Locked: [Element Name]"

**Undo Behavior:** Ctrl+Z unlocks the element.

**Dependencies:** ElementManager.lock(); Layers panel; SelectionManager (must exclude locked elements from canvas click selection)

---

### Feature: Element Hide / Show

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to hide elements on canvas, so that I can work on overlapping elements without visual interference.
**Complexity Level:** L1
**Priority:** P1 — Critical for working on complex layered layouts.

**Acceptance Criteria:**
- Given an element is selected, when I click the eye icon in the Layers panel (or press Ctrl+Shift+H), then the element becomes invisible on canvas; its row in Layers panel is dimmed (50% opacity) with a struck-through eye icon
- Given a hidden element, when I click its eye icon in the Layers panel, then it becomes visible again
- Given a hidden element, when I enter Preview mode, then the element is excluded from preview (not rendered); this mirrors what the published site will show
- Given a hidden element, when I export the project, then the element IS excluded from export output
- Edge case: Hiding a parent container → all children are hidden; Layers panel shows parent with eye struck-through; children show inherited-hidden state (dimmed row, faded eye icon)
- Edge case: Hidden element has a CMS binding → binding is preserved; element just doesn't render

**Input Methods:**
- Mouse: Eye icon click in Layers panel row; right-click → Hide
- Keyboard: Ctrl+Shift+H (toggle hide/show for selected element)
- Touch: Layers panel → tap eye icon

**Feedback:**
- Predictive: Eye icon hover state (slightly dimmed) to indicate clickability
- Live: Element disappears from canvas (no fade animation — instant, to avoid confusing with opacity change)
- Confirmatory: Layers panel row dims; eye icon shows struck-through state

**Undo Behavior:** Ctrl+Z re-shows the element.

**Dependencies:** ElementManager.hide(); preview renderer (must respect hidden state); export engine (must exclude hidden elements)

---

### Feature: Inline Text Editing

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to edit text directly on the canvas by double-clicking, so that I can update copy in context without switching panels.
**Complexity Level:** L1
**Priority:** P0 — Second most frequent canvas interaction after drag.

**Acceptance Criteria:**
- Given a text element (Heading, Paragraph, Button, Link), when I double-click it, then cursor appears at click position; a floating formatting toolbar appears 8px above the element; Inspector auto-switches to Typography section
- Given I am in text editing mode, when I type, then text updates in real-time on canvas; element height grows with content (min-height respected); no loading state
- Given I am in text editing mode, when I press Escape or click outside the element, then text editing mode exits; changes are committed; one history entry is created for the entire editing session (not per keystroke)
- Given I am in text editing mode, when I double-click a word, then that word is selected; formatting toolbar can apply style to selection
- Given I am in text editing mode, when I triple-click, then the entire paragraph is selected
- Given I am in text editing mode, when I press Tab, then cursor moves to the next text element on the page (useful for quickly updating multiple headlines)
- Edge case: Editing a text element that is CMS-bound → tooltip appears: "This text is bound to [Collection.Field]. Editing here will only affect this page instance, not the CMS data. Edit in CMS to update all instances."
- Edge case: Pasting formatted text (from Word/Google Docs) → strips formatting, keeps plain text; toast "Formatting stripped — Buildrik uses design tokens for text styles"
- Edge case: Pressing Enter creates a new paragraph within the element (not a new element); Shift+Enter creates a line break without new paragraph

**Input Methods:**
- Mouse: Double-click text element to enter; click outside to exit
- Keyboard: Select element + Enter to enter edit mode; Escape to exit; Tab to jump to next text element
- Touch: Double-tap text element to enter edit mode; tap outside to exit

**Formatting Toolbar (floating, above element):**

| Control | Action | Shortcut |
|---------|--------|----------|
| Font family | Dropdown with preview | — |
| Font size | Number input | — |
| Bold | Toggle | Ctrl+B |
| Italic | Toggle | Ctrl+I |
| Underline | Toggle | Ctrl+U |
| Text color | Color picker | — |
| Highlight | Color picker | — |
| Link | URL input popover | Ctrl+K |
| Align left/center/right/justify | Toggle group | Ctrl+L/E/R/J |
| Clear formatting | Removes all inline styles | — |

**Feedback:**
- Predictive: Double-click cursor (text I-beam) on hover of text elements
- Live: Formatting changes apply instantly; element resizes live as text length changes
- Confirmatory: On exit, one history entry created: "Edit text: [first 20 chars]..."

**Undo Behavior:** Ctrl+Z inside text editing undoes typing char-by-char. Ctrl+Z after exiting reverts the entire editing session.

**Dependencies:** Rich text engine (current: likely contenteditable); InspectorManager.switchToTab('typography') on enter

---

### Feature: Template Application

**IA Group:** Build — Templates Tab
**User Story:** As a Designer, I want to apply a pre-built page template, so that I can start a new page with a professional layout in seconds instead of building from scratch.
**Complexity Level:** L1
**Priority:** P1 — Critical for reducing time-to-first-styled-page for new users.

**Acceptance Criteria:**
- Given the Templates tab is open, when I hover a template thumbnail, then a "Preview" button appears; clicking it opens a side-by-side overlay showing the template's full page and the current page
- Given the side-by-side preview, when I click "Apply Template", then a confirmation modal asks "Replace current page with this template?" (if canvas is not empty); if canvas IS empty, template is applied immediately without confirmation
- Given template is applied, then all elements from the template are added to the canvas; existing page elements are replaced; history entry created: "Apply template: [Template Name]"
- Given the Templates tab, when I click "Add as new page", then the template creates a new page in the Pages tab with the template's content; current page is unchanged
- Edge case: Template uses fonts not currently in the project → fonts are automatically added to the project's Media library and loaded
- Edge case: Template uses design tokens that conflict with the current project's token values → template's colors are applied as local overrides (not changing project tokens); visual diff shown

**Input Methods:**
- Mouse: Hover thumbnail → Preview button; click to select template
- Keyboard: Arrow keys navigate templates; Enter to preview; Alt+Enter to apply
- Touch: Tap to preview; confirm to apply

**Feedback:**
- Predictive: Hover shows Preview button and brief template name
- Live: Side-by-side preview shows template vs current page at same scale
- Confirmatory: Template content appears on canvas with 300ms fade-in; toast: "Template applied: [Name]"

**Undo Behavior:** Ctrl+Z removes template and restores previous canvas state (full state snapshot used, not incremental patches).

**Dependencies:** Template library (IndexedDB or bundled); font loader; diff engine for token conflicts

---

### Feature: Page Management (Add, Delete, Reorder, Duplicate)

**IA Group:** Build — Pages Tab
**User Story:** As a Designer, I want to manage pages within my project, so that I can build multi-page websites with proper navigation structure.
**Complexity Level:** L1
**Priority:** P1 — Multi-page is a core use case for the target design team persona.

**Acceptance Criteria:**
- Given the Pages tab is open, when I click "+ Add Page", then a new blank page appears in the list with a default name "Page [N]"; it is auto-selected for naming (inline edit mode activated); pressing Enter or clicking away confirms the name
- Given a page row, when I hover it, then a context icon (⋯) appears; clicking it shows: Duplicate, Rename, Set as Homepage, Delete
- Given I click Delete on a page with content, then a confirmation modal: "Delete '[Page Name]'? All [N] elements will be permanently removed." with [Cancel] [Delete]
- Given I drag a page row up or down, then the page order reorders (affects navigation order); reorder is animates the row to its new position (150ms); history entry created
- Given I right-click a page row, then a context menu appears with all page actions
- Given I double-click a page name, then it enters inline edit mode for renaming
- Edge case: Deleting the homepage → modal adds: "This is your homepage. Deleting it will set '[Next Page]' as the new homepage." with a dropdown to choose the new homepage before confirming
- Edge case: Duplicate page → copies all elements, CMS bindings, and SEO settings; duplicate appears below original with name "[Page Name] Copy"

**Input Methods:**
- Mouse: All actions via + button, hover context menu (⋯), drag to reorder, double-click to rename, right-click context menu
- Keyboard: Ctrl+Shift+P → new page; pages navigable via arrow keys in Pages panel; rename via F2
- Touch: Tap + to add; long-press row for context menu; drag to reorder

**Feedback:**
- Predictive: Drag handle appears on hover of each page row
- Live: Drag shows row ghost following cursor; target position shows blue insertion line
- Confirmatory: New page tab appears in page tab bar at bottom of canvas; SEO badge shows initial score; toast: "Page added: [Name]"

**Undo Behavior:** Add page: Ctrl+Z deletes the page (with confirmation if it now has content). Delete page: Ctrl+Z restores the page with all content. Reorder: Ctrl+Z reverts order.

---

## ASSETS Group Features

---

### Feature: Media Upload (Drag, Button, Paste, URL)

**IA Group:** Assets — Media Tab
**User Story:** As a Designer, I want to upload images and videos, so that I have project assets available in the editor without leaving the tool.
**Complexity Level:** L1
**Priority:** P1 — Media is required for virtually every real project.

**Acceptance Criteria:**
- Given the Media tab is open, when I click "Upload", then OS file picker opens; accepted formats: JPEG, PNG, GIF, SVG, WEBP (images, max 10MB); MP4, WEBM (video, max 50MB); WOFF, WOFF2, TTF, OTF (fonts, max 5MB)
- Given I drag an image file from my OS desktop onto the Media tab, then it uploads and appears in the library grid
- Given I drag an image file from my OS desktop directly onto the canvas, then it uploads AND creates an Image element at the drop position, sized to the image's natural dimensions (capped at 800×600 as default maximum)
- Given I have an image in my OS clipboard (Ctrl+C from browser or Finder), when I press Ctrl+V on canvas (no element selected), then the image uploads and an Image element is created at canvas center
- Given I paste an image URL into the URL upload field in Media tab, then the image is downloaded, stored in the project library, and appears in the grid
- Given a file exceeds the size limit, then upload is blocked before transfer starts; toast: "File is [X]MB — maximum is [Y]MB. Try compressing at squoosh.app"
- Edge case: Uploading a duplicate filename → "File '[name]' already exists. Replace?" modal with [Cancel] [Replace] [Keep Both (adds _2 suffix)]
- Edge case: Unsupported format → file is rejected; toast: "Unsupported format. Accepted: JPEG, PNG, GIF, SVG, WEBP"
- Edge case: Network drops mid-upload → progress bar shows error state; retry button appears

**Input Methods:**
- Mouse: Upload button; drag file to Media tab; drag file to canvas
- Keyboard: Ctrl+V (paste image from OS clipboard)
- Touch: Tap Upload → OS file picker; not available via drag on touch (OS limitation)

**Feedback:**
- Predictive: Media tab drop zone highlights when dragging file over it (from outside app)
- Live: Upload progress bar per file (0-100%); thumbnail shows loading shimmer before upload completes
- Confirmatory: Thumbnail appears in grid with filename; toast: "Uploaded: [filename]"

**Undo Behavior:** Upload is NOT undoable (asset is stored separately from canvas state). Delete button in Media library removes asset (with usage warning).

**Dependencies:** FileManager; IndexedDB (local storage for assets); CloudSync (for team shared library); file size validation (client-side pre-upload)

---

### Feature: Design Token Management

**IA Group:** Assets — Design System Tab
**User Story:** As a Team Lead, I want to define and manage global design tokens, so that all team members build pages using consistent colors, typography, and spacing.
**Complexity Level:** L2
**Priority:** P1 — Without tokens, design consistency across a team is impossible at scale.

**Acceptance Criteria:**
- Given the Design System tab is open, when I click a color swatch, then an inline color picker opens (hex input + HSLA sliders + eyedropper); on confirm, all elements using this token update instantly (live visual diff: briefly highlights all updated elements with a 300ms yellow pulse)
- Given a token is used in > 0 elements, when I delete it, then a modal shows "This token is used in [N] elements. Delete anyway?" with a "Find affected elements" link that highlights them in Layers panel
- Given I click the lock icon on a token, then the token becomes locked; other team members can read it but cannot edit it; lock icon shows their avatar if locked by a teammate
- Given a locked token, when a non-owner team member tries to edit it, then the input is disabled; tooltip: "Locked by [Name]. Contact them to unlock."
- Edge case: Changing a typography token → all elements using that token update immediately; if element has local overrides, a badge appears on the token row: "3 elements have local overrides"
- Edge case: Exporting the project → tokens are exported as CSS custom properties (`--color-primary: #2563EB`) in a `tokens.css` file

**Input Methods:**
- Mouse: Click swatch to edit; drag spacing token row to reorder; lock icon to toggle lock
- Keyboard: Tab/arrow to navigate tokens; Enter to edit; Escape to cancel edit

**Feedback:**
- Predictive: Hover a token row shows edit (✏️) and lock (🔒) icons
- Live: Token edit → all affected elements on canvas update with 300ms yellow pulse highlight
- Confirmatory: Token swatch updates; toast: "Token updated: [name]"

**Undo Behavior:** Ctrl+Z reverts the token value AND un-updates all affected elements.

---

### Feature: CMS Panel (Collections, Items, Binding)

**IA Group:** Assets — CMS (NEW Rail Entry)
**User Story:** As a Content Manager, I want to access and edit CMS collections from a dedicated panel, so that I can update website content without needing a designer.
**Complexity Level:** L2
**Priority:** P0 — Content Manager persona is blocked without direct CMS access.

**Acceptance Criteria:**
- Given the CMS panel is open (rail icon C), when the panel loads, then a list of all collections appears with name, item count, and last-modified date; loads within 100ms
- Given a collection row, when I click "Add item", then a form opens showing all field inputs for that collection's schema; all 17 field types render their appropriate input (text → text input, image → upload widget, date → date picker, etc.)
- Given I fill fields and click "Save", then item is saved to IndexedDB and synced via SyncManager; item appears in the collection's item list immediately
- Given an item in the list, when I click it, then an inline edit panel slides in showing all field values; changes auto-save (debounced 2s)
- Given I am in the canvas inspector and select an element, when I click the binding icon in the Inspector, then the CMS binding popover shows collections; I can bind a property (e.g., text content) to a CMS field (e.g., Blog.title); on binding, the element shows the first item's value as a preview
- Given a CMS-bound element on canvas, when I use the CMS Preview Bar dropdown at the top of canvas, then I can cycle through collection items to preview how each item renders
- Edge case: Collection has 0 items → panel shows empty state: "No items yet. [Add first item →]"
- Edge case: Deleting a collection item that is bound to canvas elements → modal: "This item is displayed on [N] pages. Delete anyway?"

**Input Methods:**
- Mouse/keyboard: Standard form inputs; Tab to navigate fields; Ctrl+S or Save button to commit

**Feedback:**
- Predictive: Field validation on change (red border + message for required fields)
- Live: Canvas updates with new CMS data when preview bar item is changed
- Confirmatory: Toast: "Saved to [Collection Name]"; item count updates in panel header

**Undo Behavior:** CMS item edits are NOT canvas-level undoable (they are content operations). A "Discard changes" button is available while editing an item before Save.

---

## CONFIG Group Features

---

### Feature: Publish (Connect, Deploy, Version History, Rollback)

**IA Group:** Config — Publish Tab
**User Story:** As a Team Lead, I want to publish the site and be able to roll back to a previous version if something goes wrong, so that I can deploy with confidence.
**Complexity Level:** L2
**Priority:** P0 — Without publish, the product produces nothing usable.

**Acceptance Criteria:**
- Given the Publish tab is open for the first time (no hosting connected), then "Connect Hosting" screen shows: provider options (Buildrik Hosting, Custom Domain, Netlify, Vercel); each with a "Connect" button
- Given hosting is connected, when I click "Publish Site", then a pre-publish validation checklist runs (< 2s); results shown as a checklist with pass/fail/warn items; if there are Errors (not Warnings), Publish button is blocked and errors must be resolved
- Given pre-publish passes (no Errors), when I click "Confirm Publish", then deploy begins; progress bar shows deployment status; on completion: status badge changes to "Published 🟢", live URL is shown with copy button
- Given the Publish tab, the "Publish History" section shows last 10 publishes: version number, date, time, publisher name
- Given a publish history entry, when I click "Preview", then that version's exported output opens in a read-only preview overlay
- Given a publish history entry, when I click "Rollback", then a confirmation modal: "Roll back to [date] version published by [name]? This will replace the current live site." → on confirm, deployment runs for that version; new history entry created: "Rollback to [date]"
- Edge case: Publish fails (hosting error) → status shows "Publish failed"; error details in expandable drawer; retry button
- Edge case: User is Viewer role → Publish button is disabled; tooltip: "Viewers cannot publish. Contact your team lead."

**Input Methods:**
- Mouse: Button clicks throughout; no drag or keyboard-specific flows

**Feedback:**
- Predictive: Pre-publish checklist shows live scan results as they come in
- Live: Deployment progress bar (0-100%); log output in expandable section for advanced users
- Confirmatory: "Published 🟢" badge; live URL shown; toast: "Site published at [URL]"

**Undo Behavior:** Publishing is not undoable via Ctrl+Z. Rollback via Publish History is the undo mechanism.

**Error Prevention:** Pre-publish checklist blocks deploy on Error-level issues. See Task 6 for full checklist.

**BEFORE:** Published version history absent.
**AFTER:** Last 10 published versions listed with Preview and Rollback actions.
**BREAKING:** No — additive.

---

### Feature: Export (Format, Quality, Code Quality Score)

**IA Group:** Config — Export Modal
**User Story:** As a Developer, I want to export the project as clean, structured React code, so that I can integrate it into a production codebase without manual refactoring.
**Complexity Level:** L2
**Priority:** P1 — "Export quality is the moat" per the product's own design principles.

**Acceptance Criteria:**
- Given the Export modal opens, when I select "React" format, then additional options appear: TypeScript (on/off), CSS approach (Emotion/CSS Modules/Tailwind), component structure (flat/nested/auto-detect)
- Given the Export modal, when I click "Generate", then a code quality analysis runs (< 5s); code quality score is shown as a number/100 with a bar and a breakdown by category: Accessibility, Performance, Code Structure, Token Usage
- Given the score has issues (< 100), when I click a category, then a list of specific issues appears with "Jump to element" links; clicking jumps to that element on canvas for fixing
- Given all issues are resolved or accepted, when I click "Download", then a ZIP is downloaded containing: component files, asset folder, token CSS file, README with integration instructions
- Given React format with Auto-detect structure, then the exporter generates one React component per canvas Section (Hero.tsx, Pricing.tsx, etc.) plus an index.tsx that composes them
- Edge case: Project has 0 elements → Export is blocked; modal shows "Your canvas is empty. Add content before exporting."
- Edge case: CMS-bound elements in export → exported with static fallback values and a comment: `// TODO: Connect to your CMS API. Example data shown.`

**Input Methods:**
- Mouse: Format selector, toggle switches, download button

**Feedback:**
- Predictive: Format selection immediately updates the code preview panel
- Live: Progress bar during generation; "Analyzing..." status per code quality category
- Confirmatory: Download initiates; toast: "Export ready: [filename].zip"

**Undo Behavior:** Export is not an undoable action (it's a read operation).

---

## REVIEW Group Features

---

### Feature: History (Undo Stack, Named Versions, Jump-To, Per-User Filter)

**IA Group:** Review — History Tab
**User Story:** As a Team Lead, I want to review the history of all changes and jump to any previous state, so that I can audit my team's work and recover from mistakes.
**Complexity Level:** L3
**Priority:** P1 — Power user feature; essential for teams; L3 (not day-1 visible).

**Acceptance Criteria:**
- Given the History tab opens, then a chronological list of undo steps is shown, newest at top; each entry shows: action name ("Move Text Block"), timestamp (relative: "2 min ago"), and user avatar
- Given a history entry, when I hover it, then the canvas briefly shows a ghost overlay of what the page looked like at that state (preview-on-hover, no state change)
- Given a history entry, when I click it, then a "Jump to this state?" confirmation modal appears; on confirm, canvas reverts to that state; all in-session undo steps after that point are discarded; new history entries append from here
- Given the filter dropdown at top of History tab, when I select a specific team member's name, then only that member's actions are shown; others are dimmed
- Given I click "Save Named Version", then a modal asks for a version name; on submit, the current state is saved as a named snapshot pinned to the top of History; named versions survive session reload
- Given a named version entry, when I click "Restore", then the same jump-to-state flow applies
- Edge case: Undo stack is at 90/100 → a yellow warning banner appears at top of History tab: "Approaching undo limit. Save a named version to preserve this state."
- Edge case: Collaborative project — another user's action appears in history with their avatar; their undo step cannot be undone by the current user (only the action author can undo their own steps)

**Input Methods:**
- Mouse: All interactions via click; hover to preview state
- Keyboard: Ctrl+Z / Ctrl+Shift+Z (primary undo/redo, does not require History tab to be open)

**Feedback:**
- Predictive: Hover shows ghost page overlay
- Live: "Restoring..." spinner during jump-to-state (may take up to 500ms for large projects)
- Confirmatory: Canvas updates; toast: "Restored to: [state name or timestamp]"

**BEFORE:** Per-user filter exists in spec. Undo stack depth unspecified.
**AFTER:** Stack depth declared as 100; 90% warning added.
**BREAKING:** No.

---

### Feature: Collaboration (Cursors, Soft Locks, Conflict Resolution)

**IA Group:** Review — Collaboration (canvas overlay)
**User Story:** As a Designer on a team, I want to see where my teammates are editing in real-time, so that we can work simultaneously without overwriting each other.
**Complexity Level:** L2
**Priority:** P1 — Core value prop for the 2-5 person design team persona.

**Acceptance Criteria:**
- Given 2+ team members have the same project open, when a second user opens the project, then their cursor appears on the first user's canvas as a colored pointer with their name label; updates at ~60fps
- Given User A starts editing an element, then a 15-second soft lock is placed on that element; all other users see a colored tint on that element with User A's avatar; clicking that element shows tooltip: "Being edited by [Name]. Auto-releases in [N]s."
- Given 15 seconds pass with no edits on a soft-locked element, then the lock auto-releases; no action required from User A
- Given two users simultaneously edit the same element (race condition), then the OTEngine detects the conflict; a visual side-by-side diff appears for the second-to-save user; they can choose: "Keep mine", "Keep theirs", "Keep both" (merge for text)
- Given a user loses network connection, then their cursor is removed from all other users' views; a "Reconnecting..." indicator shows in their own toolbar; edits continue locally and are queued (OfflineQueue)
- Given user reconnects, then offline queue is replayed; any conflicts generated during offline period are shown as a batch diff resolution UI

**Input Methods:**
- Mouse: All conflict resolution via modal buttons

**Feedback:**
- Predictive: Colored cursor appears as soon as teammate is present
- Live: Soft lock tint + countdown indicator on locked elements
- Confirmatory: Conflict resolution modal; toast on successful conflict resolution

**Undo Behavior:** Conflict resolution choices are recorded as history entries. Ctrl+Z can undo a conflict resolution.

---

## CANVAS Features

---

### Feature: Canvas Zoom / Pan

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to zoom and pan the canvas, so that I can work on both the full-page layout and fine details without losing context.
**Complexity Level:** L1
**Priority:** P1 — Essential for any canvas larger than the viewport.

**Acceptance Criteria:**
- Given the canvas, when I scroll with Ctrl+Scroll, then canvas zooms in/out centered on cursor position; zoom range: 10%-500% in increments (25%, 50%, 75%, 100%, 150%, 200%, 400%, and free continuous scroll)
- Given the canvas, when I press Ctrl+0, then zoom resets to "fit all content in viewport" (equivalent to Fit to Screen)
- Given the canvas, when I hold Spacebar and drag, then the canvas pans (hand tool mode); cursor changes to grab hand; releasing spacebar returns to previous tool
- Given the canvas, when I middle-mouse drag, then canvas pans
- Given a trackpad, when I use two-finger drag, then canvas pans; pinch to zoom
- Given the zoom input in the toolbar, when I type "150" and press Enter, then canvas zooms to 150% centered on current viewport center
- Edge case: Zoom below 25% → grid and snap guides are hidden (too small to be useful); a "View is zoomed out. Smart guides disabled below 25%." indicator shows

**Input Methods:**
- Mouse: Ctrl+scroll (zoom), middle-click drag (pan), spacebar+drag (pan)
- Keyboard: Ctrl+= (zoom in), Ctrl+- (zoom out), Ctrl+0 (fit), Ctrl+1 (zoom to selection)
- Touch: Pinch (zoom), two-finger drag (pan)

**Feedback:**
- Predictive: Zoom level indicator in toolbar updates in real-time during scroll
- Live: Canvas scales smoothly (200ms ease-out for button-triggered zoom; instant for scroll zoom)
- Confirmatory: Zoom percentage shown in toolbar

**Undo Behavior:** Zoom and pan are NOT recorded in undo history (they are view state, not data mutations).

---

### Feature: Smart Guides / Snap Behavior

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want visual alignment guides to appear while I drag, so that I can align elements precisely without manual position entry.
**Complexity Level:** L1
**Priority:** P1 — Without guides, layout alignment requires tedious numeric input.

**Acceptance Criteria:**
- Given I am dragging an element, when the dragging element's center aligns with another element's center (within 4px snap threshold), then a blue dashed guide line appears through both centers AND the dragging element snaps to perfect alignment
- Given I am dragging an element, when the dragging element's edge aligns with another element's edge (within 4px snap threshold), then a blue guide appears at that edge and the element snaps
- Given 3+ elements exist and I am dragging a third, when spacing between elements would be equal, then green spacing indicator arrows appear showing equal spacing; element snaps to equidistant position
- Given snap is toggled OFF (View → Snap toggle OR keyboard shortcut), then elements move freely without snapping; guides still appear but don't snap
- Given I press Alt while dragging, then snap is temporarily disabled (live modifier key); element moves freely until Alt is released
- Given I am resizing an element, then guides appear for the resizing edge only (not all edges)

**Input Methods:**
- Mouse: Drag triggers guides; Alt held disables snap temporarily
- Keyboard: Ctrl+; or Shift+G to toggle snap on/off (common convention)

**Feedback:**
- Predictive: Drop zone glow when dragging starts (highlights valid targets)
- Live: Blue guides appear and disappear in real-time as element moves; distance readout badges (e.g., "24px") appear between aligned elements during drag
- Confirmatory: Guides disappear on mouse release; element stays at snapped position

**Undo Behavior:** Move with snap = same undo as any move.

---

### Feature: Responsive Breakpoint Switching

**IA Group:** Build (Canvas)
**User Story:** As a Designer, I want to switch between device breakpoints, so that I can verify and adjust the layout for desktop, tablet, and mobile.
**Complexity Level:** L1
**Priority:** P1 — Multi-device responsiveness is a baseline expectation for any web builder.

**Acceptance Criteria:**
- Given the device selector in the top toolbar, when I click "Tablet (768px)", then the canvas width changes to 768px; Inspector shows "Tablet" breakpoint badge; elements that have tablet-specific property overrides highlight with a blue "T" badge
- Given I'm on Tablet breakpoint, when I change a property in Inspector, then I can choose: "Apply to all breakpoints" or "Apply to tablet only"; the choice is remembered per property type (size changes default to "tablet only"; color changes default to "all")
- Given an element has breakpoint-specific overrides, when I switch from Desktop to Mobile and back, then Desktop values are restored for properties without mobile overrides
- Given the canvas, when I switch breakpoints, then the canvas resizes with a 200ms ease-in-out animation showing the device frame shrinking/growing
- Edge case: No breakpoint-specific overrides exist → switching breakpoints shows the same layout at different widths (content reflows naturally via CSS)
- Edge case: An element has been explicitly hidden at mobile breakpoint → it shows a "hidden at this breakpoint" overlay (gray tint + ☁️ icon) in the editor so the designer can see it's there but knows it won't render

**Input Methods:**
- Mouse: Device selector buttons in toolbar
- Keyboard: Ctrl+Shift+1 (Desktop), Ctrl+Shift+2 (Tablet), Ctrl+Shift+3 (Mobile)

**Feedback:**
- Predictive: Hovering device button shows a tooltip with breakpoint width (e.g., "Tablet — 768px")
- Live: Canvas animates to new width; breakpoint badge updates in Inspector
- Confirmatory: Current breakpoint shown in toolbar; elements with local overrides show colored badges

---

### Feature: Preview Mode

**IA Group:** Config (accessible from toolbar)
**User Story:** As a Designer, I want to preview the site as a visitor would experience it, so that I can verify interactions, animations, and responsive behavior before publishing.
**Complexity Level:** L1
**Priority:** P1 — Without preview, designers are flying blind before publish.

**Acceptance Criteria:**
- Given I click the Preview button (or press Ctrl+Shift+P), then the editor UI disappears; the canvas expands to fill the full window; the rendered page is interactive (links work, forms are fillable, hover states animate)
- Given preview mode is active, when I click a page tab or use in-page navigation links, then navigation between pages works as on the live site
- Given preview mode, when I press Escape, then editor UI is restored; canvas returns to previous scroll and zoom position
- Given preview mode, when I click the device selector icons at top of preview, then preview resizes to simulate Desktop/Tablet/Mobile frames
- Given preview mode, when I click "Edit" button (appears in a minimal preview toolbar), then editor is restored
- Edge case: CMS-bound elements in preview → show the first collection item's data by default; CMS Preview Bar appears in preview mode too for switching items
- Edge case: Hidden elements → not visible in preview (this is the "truth" of what gets published)

**Input Methods:**
- Mouse: Preview button; device icons; Escape to exit
- Keyboard: Ctrl+Shift+P to enter; Escape to exit

**Feedback:**
- Predictive: Preview button hover: "Preview (Ctrl+Shift+P)"
- Live: Smooth full-screen transition (300ms ease-out); editor panels slide out
- Confirmatory: Minimal preview toolbar appears at top: "[← Edit] [Desktop/Tablet/Mobile] [Share Preview Link]"

---

## INSPECTOR Features

---

### Feature: Layout Properties (Position, Size, Constraints)

**IA Group:** Build (Inspector)
**User Story:** As a Designer, I want to set precise position, size, and layout constraints in the Inspector, so that I can achieve pixel-perfect layouts without relying solely on drag.
**Complexity Level:** L1
**Priority:** P0 — Inspector is used in 60%+ of all editing time.

**Acceptance Criteria:**
- Given an element is selected, Inspector shows: X (left), Y (top), W (width), H (height), Rotation — all as editable number inputs with unit (px, %, rem, auto)
- Given X/Y inputs, when I type a value and press Tab or Enter, then element moves to that position immediately (< 16ms)
- Given W/H inputs, when I click the chain link icon, then aspect ratio is locked; changing one dimension updates the other proportionally
- Given the Position dropdown, options are: Static (default — follows document flow), Relative, Absolute, Fixed, Sticky; selecting each reveals relevant constraint inputs
- Given Absolute or Fixed position, when I select constraints (pin to top, right, bottom, left, center), then the element sticks to those edges relative to its parent (for absolute) or viewport (for fixed)
- Given a flex or grid parent is selected, Inspector shows the flexbox or grid configuration controls (direction, wrap, justify-content, align-items, gap)
- Edge case: Setting W to "auto" on a text element → width shrinks to content width; height may need to be "auto" too or a warning appears: "Width: auto may cause text to overflow its container"

**Input Methods:**
- Mouse: Click inputs, drag sliders, click chain link for aspect lock, click constraint pins
- Keyboard: Tab between inputs; Enter to confirm; arrow keys in number inputs increment/decrement by 1 (Shift+Arrow: 10)

**Feedback:**
- Live: Canvas updates on every keypress (no "press Enter to apply" delay)
- Confirmatory: History entry on blur from input (not on every keypress)

---

### Feature: Appearance Properties (Fill, Border, Opacity, Shadow)

**IA Group:** Build (Inspector)
**User Story:** As a Designer, I want to set background fills, borders, opacity, and shadows in the Inspector, so that I can style elements visually to match the design system.
**Complexity Level:** L1
**Priority:** P0

**Acceptance Criteria:**
- Given an element is selected, the Appearance section shows: Fill (color swatch), Border (width/color/style/radius), Opacity (0-100% slider + number input), Box Shadow (add shadow layer button)
- Given I click the fill color swatch, a color picker opens with: hex input, HSLA sliders, opacity slider, design token palette, recent colors, eyedropper
- Given I select a design token from the palette, then fill is set to that token (stored as token reference, not hex value); swatch shows token name badge
- Given I add a box shadow, then a shadow editor shows: X offset, Y offset, Blur, Spread, Color, Inset toggle; multiple shadow layers can be added and reordered
- Given Border Radius, when I click the corner diagram, then I can set each corner independently; when I click the link icon, all corners are set to the same value

**Input Methods:**
- Mouse: Click swatches, drag sliders; keyboard inputs for all numeric values

**Feedback:**
- Live: All changes update canvas < 16ms; no "apply" button
- Confirmatory: History entry on blur

---

### Feature: Typography Properties

**IA Group:** Build (Inspector)
**User Story:** As a Designer, I want to control typography in the Inspector, so that text elements match the brand's type system.
**Complexity Level:** L1
**Priority:** P0 — Typography is the most-edited property category for text-heavy sites.

**Acceptance Criteria:**
- Given a text element is selected, the Typography section shows: Font Family (searchable dropdown with preview), Font Size (with unit: px/rem/em), Font Weight (dropdown: 100-900), Line Height, Letter Spacing, Text Color (token-aware swatch), Text Align (button group), Text Transform (none/uppercase/capitalize), Text Decoration (none/underline/line-through)
- Given the Font Family dropdown, when I type "Inter", then matching fonts filter immediately; Google Fonts are searchable; custom uploaded fonts (from Media library) appear in a "Project Fonts" section at top
- Given I select a typography design token (e.g., "Heading/H1"), then all typography properties update to that token's values; a token badge appears next to the section header
- Edge case: No font loaded for selected font weight → Inspector shows a warning badge: "Weight 900 not loaded for this font. [Load →]" link adds it to Media library

---

### Feature: Effects Properties (Hover State, Click Actions, Conditions)

**IA Group:** Build (Inspector)
**User Story:** As a Designer, I want to define hover states and click actions for elements, so that the published site has interactive behavior without writing JavaScript.
**Complexity Level:** L2
**Priority:** P1 — Interactions are expected in modern web sites; without them, exported sites feel static.

**Acceptance Criteria:**
- Given an element is selected, the Effects section has 3 sub-tabs: Hover State, Click Actions, Visibility Conditions
- Given the Hover State sub-tab, when I toggle it ON, then a copy of the element's current Appearance properties appears; changes here ONLY apply on hover (CSS `:hover`); canvas shows hover state immediately (not click-to-test)
- Given the Click Actions sub-tab, I can add actions: Navigate to URL (external link), Navigate to page (internal page picker), Scroll to element (element picker), Open/close modal element (element picker), Toggle class, Submit form
- Given the Visibility Conditions sub-tab, I can bind element visibility to: a boolean CMS field, a device breakpoint, or a user-defined variable; canvas shows the element with a "hidden at [condition]" overlay to indicate conditional state

**Input Methods:**
- Mouse: Toggle switches, dropdowns, element pickers

**Feedback:**
- Live: Hover state changes preview when "Preview hover state" toggle is ON
- Confirmatory: History entry; effects section shows active badge count (e.g., "Effects (2)")

---

### Feature: CSS Editor (Direct CSS, L3)

**IA Group:** Build (Inspector — Dev Mode)
**User Story:** As a Developer, I want to write custom CSS for individual elements, so that I can achieve effects not exposed in the visual Inspector.
**Complexity Level:** L3 — behind Dev Mode toggle
**Priority:** P2 — Power user feature; not required for v1 success but expected for developer persona.

**Acceptance Criteria:**
- Given Dev Mode is toggled ON (Inspector header toggle), then a "Custom CSS" section appears at the bottom of Inspector with a code editor (syntax highlighting, line numbers, auto-complete for CSS properties)
- Given I type CSS in the editor, then canvas updates live (with 300ms debounce to avoid flickering on every keypress)
- Given invalid CSS is entered, then the invalid line is highlighted in red; the canvas shows the last valid state (not broken by invalid CSS)
- Given Dev Mode is toggled OFF, then custom CSS is preserved but hidden; it continues to apply to the element

---

# TASK 4: Analytics Event Schema

---

## Complete Event Definitions

### `editor_loaded`
**Trigger:** Application mounts and composer initializes successfully
```json
{
  "projectId": "string — unique project identifier",
  "userId": "string — hashed user ID",
  "userRole": "string — owner | editor | viewer",
  "sessionId": "string — unique session UUID",
  "projectPageCount": "number — total pages in project",
  "projectElementCount": "number — total elements across all pages",
  "loadTimeMs": "number — time from navigation start to editor_loaded event",
  "isRecovery": "boolean — true if RecoveryManager found unsaved changes"
}
```
**Example:** `{ "projectId": "proj_abc123", "userId": "u_hashed", "userRole": "editor", "sessionId": "sess_xyz", "projectPageCount": 5, "projectElementCount": 247, "loadTimeMs": 2340, "isRecovery": false }`

---

### `element_added`
**Trigger:** Element is placed on canvas (via drag from Add panel, click-to-insert, or duplicate)
```json
{
  "elementType": "string — e.g. 'Section/Hero', 'Text/Heading', 'Media/Image'",
  "addMethod": "string — drag | click | duplicate | paste | template",
  "parentType": "string — element type of parent container",
  "nestingDepth": "number — 0 = root, 1 = inside section, etc.",
  "pageId": "string",
  "sessionId": "string",
  "timeInSessionMs": "number — ms since editor_loaded"
}
```

---

### `element_deleted`
**Trigger:** Element is confirmed deleted (after confirmation modal)
```json
{
  "elementType": "string",
  "hadChildren": "boolean",
  "childCount": "number",
  "hadCmsBinding": "boolean",
  "deletedVia": "string — keyboard | context_menu | toolbar",
  "sessionId": "string"
}
```

---

### `drag_started`
**Trigger:** Mousedown + movement > 3px on a draggable element
```json
{
  "elementType": "string",
  "sourceType": "string — sidebar (from Add panel) | canvas (existing element)",
  "sessionId": "string"
}
```

---

### `drag_completed`
**Trigger:** Mouse released on a valid drop target
```json
{
  "elementType": "string",
  "sourceType": "string — sidebar | canvas",
  "targetParentType": "string — parent element type at drop location",
  "durationMs": "number — time from drag_started to drag_completed",
  "snappedToGuide": "boolean",
  "sessionId": "string"
}
```

---

### `drag_cancelled`
**Trigger:** Mouse released on invalid target OR Escape pressed during drag
```json
{
  "elementType": "string",
  "sourceType": "string",
  "cancelReason": "string — invalid_target | escape | outside_canvas",
  "sessionId": "string"
}
```

---

### `element_selected`
**Trigger:** Element is selected on canvas or via Layers panel
```json
{
  "elementType": "string",
  "selectionMethod": "string — click | shift_click | ctrl_click | marquee | layers_panel | keyboard_tab",
  "multiSelectCount": "number — 1 for single select, N for multi",
  "sessionId": "string"
}
```

---

### `undo_triggered`
**Trigger:** Ctrl+Z pressed
```json
{
  "undoneActionType": "string — name of action being undone (e.g. 'Move', 'Style change')",
  "stackDepthBefore": "number — undo stack size before this undo",
  "sessionId": "string"
}
```

---

### `redo_triggered`
**Trigger:** Ctrl+Shift+Z pressed
```json
{
  "redoneActionType": "string",
  "sessionId": "string"
}
```

---

### `save_triggered`
**Trigger:** Auto-save fires or user presses Ctrl+S
```json
{
  "saveType": "string — auto | manual",
  "patchCount": "number — number of JSON patches in this save",
  "durationMs": "number — time to complete save",
  "success": "boolean",
  "sessionId": "string"
}
```

---

### `tab_switched`
**Trigger:** User clicks a sidebar rail tab or uses keyboard shortcut
```json
{
  "fromTab": "string — tab name or null if none was open",
  "toTab": "string — tab name",
  "switchMethod": "string — click | keyboard_shortcut",
  "timeOnPreviousTabMs": "number",
  "sessionId": "string"
}
```

---

### `cms_accessed`
**Trigger:** CMS panel or CMS data is accessed by user
```json
{
  "accessMethod": "string — rail_icon | settings_path | inspector_binding | preview_bar",
  "userRole": "string",
  "sessionId": "string"
}
```

---

### `preview_opened`
**Trigger:** User enters preview mode
```json
{
  "triggerMethod": "string — toolbar_button | keyboard",
  "currentBreakpoint": "string — desktop | tablet | mobile",
  "sessionId": "string"
}
```

---

### `export_triggered`
**Trigger:** User clicks Download in Export modal
```json
{
  "format": "string — html | react | vue | nextjs",
  "typescript": "boolean",
  "cssApproach": "string — emotion | css_modules | tailwind",
  "codeQualityScore": "number — 0-100",
  "pageCount": "number",
  "elementCount": "number",
  "sessionId": "string"
}
```

---

### `publish_triggered`
**Trigger:** User confirms publish (after pre-publish checklist)
```json
{
  "hostingProvider": "string — buildrik | netlify | vercel | custom",
  "prePublishErrorCount": "number",
  "prePublishWarningCount": "number",
  "deployDurationMs": "number",
  "success": "boolean",
  "sessionId": "string"
}
```

---

### `publish_rollback`
**Trigger:** User confirms rollback to a previous published version
```json
{
  "rolledBackToVersion": "number — version number",
  "rolledBackToAgeHours": "number — how old the target version is",
  "sessionId": "string"
}
```

---

### `shortcut_used`
**Trigger:** Any keyboard shortcut is detected and executes an action
```json
{
  "shortcut": "string — e.g. 'Ctrl+Z', 'Ctrl+G', 'A'",
  "action": "string — action name",
  "sessionId": "string"
}
```

---

### `error_occurred`
**Trigger:** Any unhandled error or explicitly tracked failure
```json
{
  "errorType": "string — drag_failed | save_failed | export_failed | cms_load_failed | collaboration_conflict",
  "errorMessage": "string — user-facing message (no stack traces)",
  "screen": "string — canvas | inspector | cms | publish | export",
  "elementType": "string | null",
  "sessionId": "string",
  "recoveryActionTaken": "string | null — undo | retry | dismiss | ignore"
}
```

---

### `collaboration_conflict`
**Trigger:** OTEngine detects a structural conflict between two users' simultaneous edits
```json
{
  "conflictType": "string — structural | text | property",
  "resolution": "string — kept_mine | kept_theirs | merged | dismissed",
  "sessionId": "string"
}
```

---

### `feature_discovered`
**Trigger:** User accesses an L2/L3 feature for the first time (tracked via first-time flags in user profile)
```json
{
  "featureName": "string — feature identifier",
  "discoveryMethod": "string — onboarding_spotlight | contextual_tooltip | self_discovered | search",
  "sessionId": "string"
}
```

---

## Funnels

### Funnel 1: First-Value
`editor_loaded` → `element_added (method=drag OR click)` → `element_selected + Inspector tab viewed` → `save_triggered`

**Target:** ≥ 60% of new users complete all 4 steps in first session.
**Drop-off alert:** If step 2 completion < 50%, Add tab discoverability is failing.

### Funnel 2: Publish
`editor_loaded` → `element_added (count ≥ 3)` → `preview_opened` → `publish_triggered (success=true)`

**Target:** ≥ 40% of sessions with ≥ 3 elements added result in a successful publish.
**Drop-off alert:** High drop-off at preview_opened → publish_triggered suggests pre-publish errors are blocking.

### Funnel 3: CMS Adoption
`cms_accessed (method=any)` → `element_added (type=cms_bound)` → `preview_opened (with CMS preview bar used)` → `publish_triggered`

**Target:** ≥ 25% of team projects complete all 4 steps in first 30 days.

### Funnel 4: Recovery
`error_occurred` → `recoveryActionTaken (undo | retry)` → `save_triggered (success=true)` — measures how well users recover vs abandon

**Target:** ≥ 80% of error_occurred events result in a successful recovery within 5 minutes (same session).

---

## Dashboards

### Dashboard 1: Editor Health
**Purpose:** Day-to-day monitoring of core editing experience
**Metrics:**
- Daily Active Editors (distinct userIds with ≥ 1 `element_added` in last 24h)
- Avg session length (ms from `editor_loaded` to last event)
- Drag completion rate: `drag_completed` / (`drag_completed` + `drag_cancelled`) — target > 90%
- Undo rate: `undo_triggered` / `element_added` — lower is better (high = too many accidents)
- Save error rate: `save_triggered (success=false)` / all `save_triggered`
- p50/p90/p99 canvas load time (from `editor_loaded.loadTimeMs`)

### Dashboard 2: IA Effectiveness
**Purpose:** Validate whether the tab restructure is improving navigation
**Metrics:**
- Tab switch heatmap: grid of fromTab → toTab transitions (shows confusion paths)
- Avg tabs switched per session (target: decreasing post-IA-restructure)
- Time on each tab (% of session time)
- CMS access method breakdown: rail vs settings vs inspector (target: rail > 50% after Phase 1)
- Feature discovery rate by feature name (how many users have ever used each L2/L3 feature)

### Dashboard 3: Publish & Export Quality
**Purpose:** Monitor output quality and deployment reliability
**Metrics:**
- Publish success rate: `publish_triggered(success=true)` / all `publish_triggered`
- Avg code quality score at export time (target: increasing over time as team skill grows)
- Pre-publish error frequency by error type (which checks fail most often)
- Rollback rate: `publish_rollback` / `publish_triggered` (high rollback = publish quality issues)
- Export format distribution (React/Vue/HTML/Next.js breakdown)

---

## Alert Thresholds

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| Drag completion rate drops | `drag_completed / (drag_completed + drag_cancelled)` < 80% for 24h rolling | P0 | Page on-call; investigate drop target changes |
| Save error rate spikes | `save_triggered(success=false)` > 5% for 1h | P0 | Page on-call; likely IndexedDB or sync failure |
| Editor load time degrades | p90 `loadTimeMs` > 5000ms | P1 | Engineering alert; likely bundle size regression |
| Undo rate spikes | `undo_triggered / element_added` > 0.8 for 24h rolling | P1 | Product alert; likely accidental actions increasing |
| Publish failure rate spikes | `publish_triggered(success=false)` > 10% for 1h | P0 | Page on-call; hosting provider issue likely |

---

# TASK 5: Design System Requirements (Editor UI)

> These tokens define the appearance of Buildrik the editor — not the user's output.

---

## 1. Spacing Scale

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | No spacing |
| `--space-1` | 4px | Inline icon gap, tight labels |
| `--space-2` | 8px | Input padding (vertical), list item gap |
| `--space-3` | 12px | Input padding (horizontal), card padding (dense) |
| `--space-4` | 16px | Section padding (small), button padding |
| `--space-5` | 20px | Panel section gap |
| `--space-6` | 24px | Panel content padding, modal content |
| `--space-8` | 32px | Large section gap, modal header/footer |
| `--space-10` | 40px | Page-level section padding |
| `--space-12` | 48px | Large modal sections |
| `--space-16` | 64px | Empty state illustrations |

---

## 2. Color Tokens (Light Mode + Dark Mode)

### Surface Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--surface-base` | #FFFFFF | #1A1A1A | App background, main canvas backdrop |
| `--surface-raised` | #F5F5F5 | #242424 | Panel backgrounds, sidebar |
| `--surface-overlay` | #EFEFEF | #2E2E2E | Dropdown menus, tooltips |
| `--surface-sunken` | #E8E8E8 | #141414 | Input backgrounds, pressed state |

### Text Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--text-primary` | #111111 | #F0F0F0 | Main labels, headings |
| `--text-secondary` | #666666 | #A0A0A0 | Sublabels, descriptions |
| `--text-tertiary` | #999999 | #666666 | Placeholders, disabled text |
| `--text-on-accent` | #FFFFFF | #FFFFFF | Text on colored buttons |
| `--text-link` | #2563EB | #60A5FA | Links |

### Border Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--border-default` | #E0E0E0 | #333333 | Input borders, dividers |
| `--border-focused` | #2563EB | #60A5FA | Focus ring |
| `--border-error` | #DC2626 | #F87171 | Error state borders |

### Semantic Colors

| Token | Value (Light) | Value (Dark) | Usage |
|-------|--------------|--------------|-------|
| `--color-primary` | #2563EB | #3B82F6 | Primary actions, selection indicators, guides |
| `--color-primary-hover` | #1D4ED8 | #2563EB | Primary button hover |
| `--color-success` | #16A34A | #22C55E | Save confirmed, publish success |
| `--color-warning` | #D97706 | #FBBF24 | Pre-publish warnings, undo limit |
| `--color-danger` | #DC2626 | #F87171 | Delete confirmations, invalid drops, errors |
| `--color-info` | #0284C7 | #38BDF8 | Info toasts, hints |
| `--color-selection` | #2563EB | #3B82F6 | Selection borders and handles |
| `--color-guide` | #2563EB | #60A5FA | Snap guide lines |
| `--color-guide-spacing` | #10B981 | #34D399 | Equal spacing indicators |
| `--color-locked` | #9CA3AF | #6B7280 | Locked element tint |
| `--color-hidden` | #D1D5DB | #374151 | Hidden element row in Layers |

---

## 3. Typography Scale

**Font family:** System UI stack — `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
**Code:** `'JetBrains Mono', 'Fira Code', monospace`

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--type-display` | 20px | 600 | 1.3 | Panel titles, modal headings |
| `--type-heading-lg` | 16px | 600 | 1.4 | Section headings in Inspector |
| `--type-heading-md` | 14px | 600 | 1.4 | Sub-section headings |
| `--type-body` | 13px | 400 | 1.5 | Panel body text, labels |
| `--type-label` | 12px | 500 | 1.4 | Input labels, badges |
| `--type-caption` | 11px | 400 | 1.4 | Timestamps, metadata |
| `--type-code` | 12px | 400 | 1.6 | CSS editor, code preview |

---

## 4. Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Inputs, tags, badges |
| `--radius-md` | 6px | Buttons, dropdown items, panels |
| `--radius-lg` | 8px | Cards, modals, larger panels |
| `--radius-xl` | 12px | Modals (outer), floating toolbars |
| `--radius-pill` | 9999px | Toggle switches, pill badges |

---

## 5. Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | none | Flat elements, panel backgrounds |
| `--shadow-subtle` | `0 1px 2px rgba(0,0,0,0.08)` | Inputs, inline elements |
| `--shadow-medium` | `0 4px 12px rgba(0,0,0,0.12)` | Dropdowns, tooltips, floating toolbars |
| `--shadow-heavy` | `0 8px 24px rgba(0,0,0,0.18)` | Modals, popovers |
| `--shadow-focus` | `0 0 0 3px rgba(37,99,235,0.25)` | Focus ring glow (combined with border) |

---

## 6. Component States

### Button

| State | Background | Text | Border | Shadow |
|-------|-----------|------|--------|--------|
| Default (Primary) | `--color-primary` | `--text-on-accent` | none | `--shadow-subtle` |
| Hover | `--color-primary-hover` | `--text-on-accent` | none | `--shadow-medium` |
| Active (pressed) | darken primary 15% | `--text-on-accent` | none | none |
| Focused | `--color-primary` | `--text-on-accent` | `--border-focused` 2px offset | `--shadow-focus` |
| Disabled | `--surface-overlay` | `--text-tertiary` | none | none |
| Loading | `--color-primary` at 60% | spinner icon | none | none |
| Destructive (default) | `--color-danger` | white | none | `--shadow-subtle` |

### Input (text input, number input)

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `--surface-sunken` | `--border-default` 1px | `--text-primary` |
| Hover | `--surface-sunken` | `--text-secondary` 1px | `--text-primary` |
| Focused | `--surface-base` | `--border-focused` 2px | `--text-primary` |
| Error | `--surface-base` | `--border-error` 2px | `--text-primary` |
| Disabled | `--surface-raised` | `--border-default` 1px | `--text-tertiary` |

### Toggle (on/off switch)

| State | Track color | Thumb color |
|-------|------------|-------------|
| Off default | `--surface-overlay` | `--surface-base` |
| Off hover | `--border-default` | `--surface-base` |
| On | `--color-primary` | white |
| Focused | `--color-primary` | white + `--shadow-focus` |
| Disabled | `--surface-overlay` at 60% | `--surface-base` at 60% |

### Tab (sidebar tabs, Inspector tabs)

| State | Background | Text | Border-bottom |
|-------|-----------|------|---------------|
| Default | transparent | `--text-secondary` | none |
| Hover | `--surface-overlay` | `--text-primary` | none |
| Active | transparent | `--color-primary` | 2px `--color-primary` |
| Focused | `--surface-overlay` | `--text-primary` | `--shadow-focus` outline |

### Color Swatch (token swatches, fill pickers)

| State | Ring |
|-------|------|
| Default | none |
| Hover | 2px `--border-default` offset 2px |
| Active/Selected | 2px `--color-primary` offset 2px |

---

## 7. Icon Guidelines

- **Style:** Outline (2px stroke, rounded caps/joins) for UI icons; filled for status indicators (success/error/warning)
- **Source:** Lucide React (already in the stack) — use consistently; do NOT mix icon libraries
- **Sizes:** 12px (labels, badges), 14px (toolbar icons), 16px (default), 20px (primary actions), 24px (empty states)
- **Stroke width:** 1.5px for all icon sizes; do not use 2px (too heavy) or 1px (too thin)
- **Accessibility:** All icon-only buttons MUST have `aria-label`; decorative icons MUST have `aria-hidden="true"`
- **Color:** Icons inherit parent `color` (use `currentColor` in SVG) — never hardcode icon fill colors

---

## 8. Transition Defaults

| Context | Duration | Easing | Property |
|---------|----------|--------|----------|
| Button hover | 100ms | ease-out | background, box-shadow |
| Input focus | 100ms | ease-out | border-color, box-shadow |
| Dropdown open | 150ms | ease-out | opacity, transform (scale from 0.95→1) |
| Dropdown close | 100ms | ease-in | opacity, transform |
| Panel slide in | 250ms | ease-in-out | transform (translateX) |
| Panel slide out | 200ms | ease-in | transform |
| Tab switch (content) | 150ms | ease-out | opacity |
| Inspector section expand | 200ms | ease-out | height, opacity |
| Toast appear | 250ms | ease-out | opacity, transform (translateY from 8px→0) |
| Toast dismiss | 200ms | ease-in | opacity |
| Modal appear | 250ms | ease-out | opacity, transform (scale 0.97→1) |
| Modal dismiss | 200ms | ease-in | opacity, transform |
| Tooltip appear | 100ms | ease-out | opacity |

---

# TASK 6: Pre-Publish Validation Checklist

| # | Check | Severity | Auto-fixable? | User action if not auto-fixed |
|---|-------|----------|---------------|-------------------------------|
| 1 | Broken images (404 or empty src) | **Error** | No | Click "Locate" → jumps to element; replace image source |
| 2 | Missing alt text on images | **Warning** | No | Click "Fix" → opens Inspector for that element; add alt text |
| 3 | Empty containers with no content and no min-height | **Warning** | Yes — "Remove empty containers" button | Or set min-height in Inspector |
| 4 | Page title missing (SEO: `<title>` is empty) | **Error** | No | Click "Fix" → opens Pages SEO panel for that page |
| 5 | Missing meta description (> 0 chars) | **Warning** | No | Click "Fix" → opens Pages SEO panel |
| 6 | Missing OG image (Open Graph image not set) | **Info** | No | Click "Fix" → opens Pages SEO panel |
| 7 | Unsaved changes (canvas is dirty) | **Error** | Yes — auto-save triggered on "Publish" click | Manual Ctrl+S before publish |
| 8 | Low contrast text (< 4.5:1 ratio for body text) | **Warning** | No | Click "Locate" → jumps to element; Inspector highlights contrast score |
| 9 | Form element with no action (form submits nowhere) | **Error** | No | Click "Fix" → opens Click Actions in Inspector; set form submit action |
| 10 | Broken internal page links (linked page deleted) | **Error** | No | Click "Locate" → jumps to element; update link target in Inspector |
| 11 | Video with no poster image | **Info** | No | Click "Fix" → opens Inspector; set poster image |
| 12 | CMS collection bound but empty (0 items) | **Warning** | No | Click "Fix" → opens CMS panel for that collection; add items |
| 13 | Custom domain not verified (DNS not propagated) | **Warning** | No | Click "Check" → re-runs DNS check; link to domain setup guide |
| 14 | Elements overlapping at Mobile breakpoint | **Warning** | No | Click "Preview Mobile" → opens preview at 375px to inspect |
| 15 | Page with no elements (blank page) | **Warning** | No | Click "Edit page" → navigates to that page on canvas |
| 16 | Font not loaded (custom font missing from Media) | **Error** | Yes — "Load missing font" button | Or replace with system font |
| 17 | Analytics script not configured (GA/Meta Pixel in Settings but no ID entered) | **Info** | No | Click "Fix" → opens Settings → Analytics |

**Display rules:**
- Errors: Publish button disabled until all errors resolved
- Warnings: Publish allowed but count shown on Publish button ("Publish (3 warnings)")
- Info: Publish allowed; collapsed by default in checklist

---

# TASK 7: i18n / RTL Specification

---

## 1. RTL Drag Behavior

| Behavior | LTR | RTL |
|----------|-----|-----|
| Drag direction (left/right labels in guides) | Left = negative X, Right = positive X | **Flipped:** Left = positive X, Right = negative X |
| Keyboard nudge direction | Arrow Left = negative X | **Unchanged** — arrow left still moves element left visually (CSS direction handles it) |
| Smart guide distance labels | Shown on correct side automatically (CSS logical properties) | Same — logical properties handle direction |
| Add panel drag to canvas | Same gesture | Same gesture — direction doesn't affect drag physics |
| Inspector X/Y values | X=0 at left edge | **X=0 at right edge** (element origin follows writing direction) |

**Implementation:** Use CSS `direction: rtl` on the `<body>` and CSS logical properties throughout (`margin-inline-start` vs `margin-left`). Do NOT manually flip every component.

---

## 2. RTL Panel Layout

| Component | LTR | RTL |
|-----------|-----|-----|
| Rail (icon nav) | Left edge | **Right edge** |
| Sidebar panel | Opens to the right of rail | **Opens to the left of rail** |
| Inspector | Right edge | **Left edge** |
| Canvas | Centered between sidebar and inspector | **Same** — centered |
| Top bar | Left: Logo/File; Right: Publish/Export | **Flipped** — Logo/File on right, Publish on left |
| Layers panel tree indent | Indents to the right for children | **Indents to the left** |
| Toast notifications | Top-right | **Top-left** |
| Floating text toolbar | Above element | **Same** |
| Dropdown menus | Opens downward, right-aligned to trigger | **Opens downward, left-aligned to trigger** |

---

## 3. Label Length Constraints

UI strings must accommodate languages with longer word forms (German, Finnish can be 40%+ longer than English):

| Component | Max characters (English) | Truncation rule |
|-----------|--------------------------|-----------------|
| Rail tab tooltip | 20 chars | Ellipsis (`…`) at end |
| Sidebar tab label | 12 chars | Ellipsis |
| Inspector section heading | 24 chars | Ellipsis |
| Toast message | 80 chars | Truncate + "..." |
| Button label | 20 chars | Allow 2-line wrap for primary actions |
| Dropdown option | 40 chars | Ellipsis with full text in tooltip |
| Page name in tab bar | 20 chars | Ellipsis |
| Element name in Layers | 28 chars | Ellipsis |

**Rule:** Design all UI at **140% of English string length** as the layout constraint. If it breaks at 140%, the component needs a longer container or ellipsis.

---

## 4. Locale-Specific Formatting (Inspector Values)

| Value type | US English format | RTL/locale format |
|------------|-------------------|-------------------|
| Numbers (CSS values) | `16px` | `16px` — numerals NOT localized (CSS always uses ASCII) |
| Dates (History tab) | `Mar 25, 3:45 PM` | Use `Intl.DateTimeFormat(locale)` for display |
| File sizes (Media tab) | `2.4 MB` | Use `Intl.NumberFormat(locale)` for decimal separator |
| Percentages (opacity) | `75%` | Numeral stays ASCII; symbol may move: some locales use `%75` |
| Currency (if ecommerce prices shown) | `$9.99` | Use `Intl.NumberFormat(locale, {style:'currency'})` |

---

## 5. String Externalization Approach

**Format:** JSON files per locale, keyed by component + feature + string ID.

**Key format:** `[component].[section].[string_id]`

Example:
```json
{
  "inspector.layout.position_label": "Position",
  "inspector.layout.width_label": "Width",
  "canvas.toast.element_added": "Added: {{elementType}}",
  "publish.history.rollback_confirm": "Roll back to {{date}} version published by {{name}}?"
}
```

**Conventions:**
- Dynamic values: `{{variableName}}` (Mustache-style; use i18next or similar)
- Pluralization: `{{count}} element` / `{{count}} elements` handled via i18next pluralization rules
- Fallback language: English (`en`) — if a key is missing in a locale file, fall back to English string
- File location: `src/i18n/[locale].json` (e.g., `en.json`, `ar.json`, `de.json`)
- RTL locales: `ar`, `he`, `fa`, `ur` — detected automatically to apply `dir="rtl"` on `<html>`

**Phase:** i18n string externalization is Phase 3 infrastructure (all strings first moved to `en.json`; translation files added later per market expansion).
