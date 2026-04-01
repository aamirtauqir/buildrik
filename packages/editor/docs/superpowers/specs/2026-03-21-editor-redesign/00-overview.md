# Module 00 — Overview

## Product

**Buildrik / Aquibra Studio** — Professional visual web builder. Embedded React component (`<AquibraStudio />`) that renders a full design environment for creating, styling, and publishing multi-page websites without writing code.

**Engine:** `src/engine/Composer.ts` — central orchestrator with 29 managers covering elements, styles, CMS, AI, collaboration, export, history, media, components, animations, and more.

**Codebase:** 163k LOC. 472 editor UI files. 132 engine files. 80+ shared UI primitives. 95% feature-complete in code.

**The problem:** The engine is powerful. The UI doesn't surface that power. Users can't find features, flows are disconnected, visual quality is below professional standard. It looks like "a developer made a UI" — not "a designer designed a tool."

**The goal:** Redesign the editor UI to match the engine's capability. No engine changes. New UI shell connected to the same `composer.*` APIs.

## Scope

- **REDESIGN:** `src/editor/*` — shell, canvas, sidebar, inspector, rail, panels, media, onboarding
- **DESIGN NEW:** AI surfaces, CMS screens, collaboration flows — engine APIs exist, UI doesn't
- **DON'T TOUCH:** `src/engine/*`, `src/shared/types/*`, `src/shared/hooks/*`
- **UPGRADE:** `src/shared/ui/*` — design system primitives may need visual refresh

## Target User

Professional designers and freelancers building client sites. They know CSS. They have 2-10 active projects. They care about precision.

**Expectations:** Dense inspector, keyboard shortcuts, responsive breakpoints, design tokens, CMS bindings, version history, fast publish.

**Quality bar:** Webflow's information density + Framer's visual polish.

**Not designing for:** First-time no-code beginners. Onboarding exists but is secondary.

## Design Principles

### Product (How the tool thinks)

**P1. CSS is the truth**
The inspector shows real CSS properties — not abstracted "Size: Large" dropdowns. `gap: 24px` shows as `gap: 24px`. Property names match MDN. Units are explicit.
*Test: Can a developer read the inspector and write equivalent CSS by hand?*

**P2. The canvas never lies**
What you see on canvas IS the published output. Same fonts, same spacing, same breakpoints. No "preview mode" that looks different from edit mode.
*Test: Screenshot edit mode and published site side by side. Can you tell which is which?*

**P3. One action, one place**
Font size is set in the inspector Typography section. Period. Other surfaces can navigate you there, but the control itself lives in one spot. No duplicate controls.
*Test: Ask "where do I change X?" — if the answer is one location, principle holds.*

**P4. Work is never lost**
Auto-save runs silently. Save status always visible. Undo is infinite. Version history is one key away (H). Browser crash = recovery. The user never worries about losing work.
*Test: Kill the browser tab at any point. Reopen. Is everything there?*

### UX (How the user moves)

**U1. Every panel earns its pixels**
If it's visible, it's relevant to current context. Flex controls hide on non-flex elements. CMS section hides on unbound elements. Empty space is intentional, not wasteful.
*Test: Point at any visible control — is it useful for current selection?*

**U2. Three clicks or one shortcut**
Any feature reachable in max 3 clicks OR 1 keyboard shortcut. Ctrl+K (command palette) is the universal escape hatch.
*Test: Time a new user finding "CMS binding". If > 30 seconds, the path is broken.*

**U3. Flows complete, never dead-end**
Every action leads to the next logical step. "Add CMS List" → Collection Setup → create collection → binding options → preview. No orphan screens.
*Test: At each screen, is the next step obvious? If user thinks "now what?", flow is broken.*

**U4. Context drives the UI**
Select a flex container → flex controls appear. Select text → typography expands. Select nothing → page-level info. Component → variants. CMS element → bindings.
*Test: Select 5 different element types. Does inspector show different relevant sections each time?*

**U5. Preview before commit**
AI changes → preview before "Apply". Template → preview before "Use". Design tokens → review diff before "Apply All". Destructive actions require confirmation.
*Test: Does any action permanently change content without showing what will change first?*

**U6. Your hands stay on the keyboard**
Ctrl+K opens everything. Tab order is logical. Arrow keys navigate. Enter confirms. Escape cancels. Full build → style → publish flow keyboard-only.
*Test: Can you complete the full workflow without touching the mouse?*

### Visual (How the tool looks)

**V1. Dark, dense, precise**
Dark surfaces. High information density — no wasted whitespace. Monospace for values. Sans-serif for labels. Feels like a cockpit, not a toy.
*Test: Does it feel like Framer/Linear or like Canva? Must feel like the former.*

**V2. 4px grid, no exceptions**
Every spacing value divisible by 4. Zero "random" pixel values.
*Test: Overlay a 4px grid on any panel. Does everything snap?*

**V3. Hierarchy through opacity, not color**
One accent color for interactive elements. Everything else is grayscale at different opacities. No rainbow panels.
*Test: Desaturate the UI to grayscale. Is the hierarchy still clear?*

**V4. Motion is functional, not decorative**
Transitions communicate state change — panel opening, element selected, mode switched. No bouncing logos or attention-seeking animations.
*Test: Remove all animations. Does the product still work perfectly?*

**V5. Borders whisper, shadows don't exist**
Surface separation via subtle borders, not shadows. Elevation through surface color steps. Only floating elements (tooltips, dropdowns, modals) get shadows.
*Test: Count drop-shadows on screen. If > 2 visible at once, too many.*

**V6. Spatial consistency**
Panel header: always same height, always icon+title+pin+close. Search bar: always same spec. Accordion: always same chevron. Users build muscle memory.
*Test: Can a user operate a new panel without learning it?*

## Module Map

| Module | Focus | Primary Engine APIs |
|--------|-------|-------------------|
| 01 — Shell & Navigation | Top bar, rail, sidebar system, layout grid | composer.history, composer.viewport, composer.storage |
| 02 — Canvas & Interactions | Canvas states, drag, resize, inline edit, overlays | composer.elements, composer.selection, composer.drag, composer.resize |
| 03 — Inspector & Properties | Tabs, sections, pseudo-states, breakpoints | composer.styles, composer.elements, composer.viewport |
| 04 — CMS & Data Binding | Collections, bindings, preview | composer.cmsManager, composer.cmsBindings, all 3 binding managers |
| 05 — AI Surfaces | Assistant bar, copilot, suggestions | AI modules (LayoutAnalyzer, CodeGenerator, ContentWriter, PageGenerator) |
| 06 — Collaboration | Presence, cursors, conflict, invite | composer.collaboration |
| 07 — Export & Publish | Export formats, publish flow, preview | composer.export |
| 08 — Design System | Tokens, constraints, patterns | composer.globalStyles, composer.fonts, features/design-system |

## Accessibility Requirements

- **ARIA roles:** All custom controls must have appropriate ARIA roles — `tablist`/`tab`/`tabpanel` for tab interfaces, `role="dialog"` for modals, `role="menu"` and `role="menuitem"` for context menus, `role="toolbar"` for button groups
- **Focus management:** Modals trap focus within their bounds. On close, focus returns to the trigger element. Dropdowns return focus on Escape.
- **Screen reader announcements:** `aria-live="polite"` for save status changes, selection changes, and panel navigation. `aria-live="assertive"` for errors (publish failed, export failed, AI errors).
- **Color contrast:** All text must meet WCAG AA 4.5:1 minimum contrast ratio. Muted text (#908D85 on #0F0F14 = 5.9:1 — passes). Interactive element labels must also meet 4.5:1.
- **Reduced motion:** Respect `prefers-reduced-motion` media query. When enabled: disable all GSAP animations, use instant transitions (0ms duration), collapse/expand panels without animation.
- **Skip link:** "Skip to canvas" link, visually hidden by default, becomes visible on first Tab keypress. Allows keyboard users to bypass rail and sidebar navigation.
- **Touch targets:** Minimum 32px for all interactive elements. Current 28px sidebar buttons are acceptable as a professional tool exception per WCAG 2.2, but rail icons at 32px meet the standard. All click targets must have at least 4px spacing between them.
