# PART 8 — DEFAULT CONTENT AND ENGINEERING HANDOFF

> Extracted from `prd_final.md` §26–§30 + B.1 + CLAUDE.md architecture rules.
> Covers: default canvas states, starter content, empty/first-use content, engineering handoff principles, styling rules, token implementation, component architecture, naming/structure, fallback/unsupported behavior, anti-regression, QA/validation, metrics/telemetry.

---

## 1. Purpose

This document captures every default-content, engineering-handoff, and implementation-readiness rule from the Buildrik PRD. It is the single reference for:

- **Default Canvas States**: what users see on new project (blank), new project (template), and returning session
- **Default Templates and Starter Content**: template application behavior, WelcomeModal, CanvasEmptyCTA
- **Empty/First-Use Content**: empty states for every panel, onboarding flow triggers
- **Engineering Handoff**: import direction rules, styling rules (Emotion only), token implementation, component architecture patterns
- **Naming and Structure**: file naming, folder ownership, new code placement
- **Fallback and Unsupported Behavior**: 10 fallbacks, 6 explicit non-goals
- **Anti-Regression**: 25 risk items with verification methods
- **QA and Validation**: 56-point checklist, reconciliation notes
- **Metrics**: 16 success metrics with targets

Nothing in this document is invented. Every rule traces to `prd_final.md` or `CLAUDE.md`.

---

## 2. Default Canvas Content

Source: §26

### 2.1 New Project — Blank Canvas

| Property | Value |
|----------|-------|
| Canvas background | `#FFFFFF` (`--aqb-bg-canvas`) |
| Canvas content area | Not rendered (no white area until content exists) |
| CanvasEmptyCTA | Visible, centered (see §2.4 below) |
| Sidebar | Closed (no panel open) |
| Inspector | IS-1 (InspectorEmptyState) |
| Top bar | All controls available. Save status: "New project". Device: Desktop. |
| Zoom | 100% |
| Overlays | All off (Guides, Spacing, Grid, Badges, X-Ray, Rulers) |
| Selection | None |
| OnboardingChecklist | Visible if first-ever visit (floating bottom-right) |

**After user clicks "Start Blank" on CanvasEmptyCTA:**

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Dismissed (hidden) |
| Canvas content area | Rendered as empty white `<body>` — `background: #FFFFFF; min-height: 100vh; width: [device width]` |
| OnboardingChecklist | If present: step 1 highlighted "Drag an element to start" with pulsing arrow toward rail Add icon |
| Sidebar | Build tab auto-opens (if OnboardingChecklist is active). Otherwise stays closed. |

### 2.2 New Project — Template Applied

| Property | Value |
|----------|-------|
| CanvasEmptyCTA | Hidden (never shown if template applied directly from WelcomeModal) |
| Canvas content area | Template HTML structure rendered. Full content visible. |
| OnboardingChecklist | If present: step 1 `add-element` auto-completed (template counts as adding elements). Step 2 highlighted: "Edit some text" |
| Sidebar | Closed (user starts by exploring canvas) |
| Inspector | IS-1 (no selection) |
| Selection | None (user must click to select) |
| Zoom | Auto-calculated to fit template content in viewport (`composer.setZoom(zoom)` — no `zoomToFit()` method exists) |

### 2.3 Returning User — Session Restore

| Property | Value |
|----------|-------|
| Canvas content | Restored from last auto-save or manual save |
| Selection | None (not persisted across sessions) |
| Sidebar | Restored to last panel state (which tab open, pinned/unpinned) via `localStorage` |
| Inspector | IS-1 (no selection on load) |
| Zoom | Restored from `localStorage` |
| Overlays | Restored from `localStorage` |
| Save status | "Auto-saved [relative time]" if last auto-save. "Saved at [time]" if manual. |
| OnboardingChecklist | Hidden if all steps previously completed. Visible if incomplete. |

### 2.4 CanvasEmptyCTA Spec

**Container:**
- Position: `position: absolute; inset: 0` with `margin: 20px`
- Background: `rgba(248, 250, 252, 0.85)` (light translucent, NOT dark surface)
- Border: `3px dashed #e2e8f0`
- Border-radius: 16px (NOT 12px)
- Padding: `40px` (uniform, NOT 40px 48px)
- Text-align: center

**Content stack (vertical, centered):**

| Element | Spec |
|---------|------|
| Icon | Custom inline SVG (NOT lucide), 48×48px, color: `#818cf8` (indigo, NOT #908D85), opacity: 0.7 |
| Heading | "Your Canvas is Empty" — 20px, color: `#1e293b` (dark text on light bg) |
| Description | "Start with a template or build from scratch" |
| Browse Templates button | Primary button with gradient background. Action: opens Templates tab. |
| Start Blank button | Ghost/underline style button. Action: dismisses CTA, enters CS-2. |

---

## 3. Default Templates and Starter Content

Source: §9.6, §26.2

### 3.1 Template Application Flow

1. User selects template from Templates tab or WelcomeModal "Browse Templates" button
2. TemplatePreviewModal opens — full-screen, scaled preview, "Use This Template" primary button
3. If page has existing content → TemplateUseDrawer slides up: "Replace entire page" (destructive) / "Add as new section" (appends)
4. ApplyProgressOverlay covers canvas: spinner + "Applying template..." text, `rgba(0,0,0,0.6)` bg
5. On complete: template rendered, overlay dismissed, canvas at zoomToFit, no element selected

### 3.2 Template Categories

Templates are organized by: [All] [Pages] [Sections] [Landing Pages] [E-commerce]

### 3.3 Save as Template

Entry points: Build tab overflow menu, canvas element context menu.
Opens SaveTemplate modal: name input + category dropdown + [Save] [Cancel].

---

## 4. Default Empty / First-Use Content

Source: §9.5–§9.14, §10.2, §11.7

### 4.1 Empty States Per Panel

| Panel | Empty State Content |
|-------|-------------------|
| **Build tab** | Shows all zones normally (favorites hidden if 0, components hidden if 0). Only OnboardingTip appears for first-time users: "Start by adding elements to your canvas. Drag from above or click to insert." |
| **Templates tab** | Template grid renders from template data. No empty state unless no templates available (not defined — templates are built-in). |
| **Layers tab** | Center: [layers icon 32px, #908D85 at 0.3 opacity] + "No elements on this page" + "Add elements from the Build tab." + [Open Build Tab] ghost button |
| **Pages tab** | Always has at least one page (home). No true empty state. |
| **Components tab** | Center: [component icon 32px, muted at 0.3 opacity] + "No components yet" + "Select an element on the canvas and click Create, or right-click → Create Component." + [Create Component] ghost button |
| **Media tab** | OnboardingEmptyState per type filter: icon + heading + description + [Upload] button + [Browse Stock] link. Example: "No images yet — Upload your first image or browse stock photos." |
| **Design tab** | Shows empty sections with [+ Add color] / [+ Add type style] / [+ Add spacing] buttons. |
| **Settings tab** | Always has all 6 cards visible. Coming Soon cards show feature description + [Notify Me]. |
| **Publish tab (unpublished)** | Status: Draft badge. Checklist items show incomplete with navigation hints. "Ready to go live? Complete the checklist above for best results." |
| **History tab** | "Save current version" button always available. Empty named versions section. Auto-saves may be empty on new project. |
| **Inspector (no selection)** | InspectorEmptyState: "Nothing Selected" heading + [Open Build Panel] and [Browse Templates] ghost buttons |
| **Canvas (no content)** | CanvasEmptyCTA centered (§2.4 above) |

### 4.2 First-Use Onboarding Triggers

| Component | Trigger | Content |
|-----------|---------|---------|
| WelcomeModal | First visit only (completedCount=0) | Two CTAs: "Browse Templates" + "Start Blank" |
| OnboardingChecklist | First visit, floating panel | 7 steps: name-project, pick-start, add-element, edit-text, change-style, preview, publish. Auto-complete via events. |
| SpotlightOverlay | Active checklist step | Dims everything except target. Includes "Explore freely →" escape link. |
| AchievementPrompt | Each step completion | Celebratory micro-animation |
| Build tab OnboardingTip | First-time, onboarding not dismissed | "Start by adding elements to your canvas." + dismiss × button |

---

## 5. Engineering Handoff Principles

Source: §27.1

### 5.1 Division of Responsibility

| Produces | Tool/Person | Output Location |
|----------|------------|-----------------|
| Visual designs, component layouts, all interaction states | Stitch (design tool) | Design files |
| React components implementing designs | Engineers | `src/editor/` (new code) |
| Engine logic, managers, state | Engineers | `src/engine/` |
| Shared types, constants, hooks, utils | Engineers | `src/shared/` |
| CSS custom properties / design tokens | Engineers | `src/themes/default.css` |

**Critical rule:** Stitch does NOT redesign the engine. Engine managers, their APIs, and their internal structure are engineering decisions. Stitch designs the UI layer that calls engine methods through `Composer`.

---

## 6. Styling Implementation

Source: §27.3

| Rule | Details |
|------|---------|
| CSS-in-JS library | Emotion only (`@emotion/react`, `@emotion/styled`). No Tailwind, no CSS modules, no styled-components. |
| Global tokens | All `--aqb-*` variables defined in `src/themes/default.css`. Components read via `var(--aqb-token-name)`. |
| Component styles | Use Emotion `styled()` for component definitions, `css` prop for one-off overrides. |
| Dynamic values | Inline `style` attribute ONLY for values computed at runtime (drag position, zoom transform, element dimensions). Never for static design tokens. |
| No magic numbers | Every pixel value, color, shadow, radius MUST reference a token or be documented in the PRD. |
| Responsive (editor UI) | Editor UI is NOT responsive (fixed desktop layout, min 1024px). Only canvas content is responsive. |

---

## 7. Token Implementation

Source: §27.4, §23, §24

### 7.1 Token File

All tokens live in `src/themes/default.css` as CSS custom properties. This is the ONLY location for token definitions.

### 7.2 Token Categories

| Category | Tokens | Count |
|----------|--------|-------|
| Surface/BG | `--aqb-surface-1` through `--aqb-surface-5`, `--aqb-bg-canvas`, `--aqb-bg-dark`, `--aqb-bg-darker`, `--aqb-bg-panel`, `--aqb-bg-panel-secondary`, `--aqb-bg-panel-tertiary`, `--aqb-bg-elevated`, `--aqb-bg-hover`, `--aqb-bg-active` | 15 |
| Primary | `--aqb-primary`, `--aqb-primary-hover`, `--aqb-primary-active`, `--aqb-primary-light`, `--aqb-primary-muted`, `--aqb-primary-subtle`, `--aqb-secondary`, `--aqb-secondary-hover`, `--aqb-secondary-light` | 9 |
| Semantic | `--aqb-success`, `--aqb-warning`, `--aqb-error`, `--aqb-info`, `--aqb-success-light`, `--aqb-warning-light`, `--aqb-error-light`, `--aqb-info-light` | 8 |
| Text | `--aqb-text-primary`, `--aqb-text-secondary`, `--aqb-text-muted`, `--aqb-text-tertiary`, `--aqb-text-disabled`, `--aqb-text-inverse` | 6 |
| Border | `--aqb-border`, `--aqb-border-light`, `--aqb-border-subtle`, `--aqb-border-focus`, `--aqb-border-hover` | 5 |
| Radius | `--aqb-radius-xs`, `--aqb-radius-sm`, `--aqb-radius-md`, `--aqb-radius-lg`, `--aqb-radius-xl`, `--aqb-radius-2xl`, `--aqb-radius-full` | 7 |
| Shadow | `--aqb-shadow-xs`, `--aqb-shadow-sm`, `--aqb-shadow-md`, `--aqb-shadow-lg`, `--aqb-shadow-xl`, `--aqb-shadow-2xl`, `--aqb-shadow-inner`, `--aqb-shadow-glow`, `--aqb-shadow-color` | 9 |
| Duration | `--aqb-duration-instant`, `--aqb-duration-fast`, `--aqb-duration-normal`, `--aqb-duration-moderate`, `--aqb-duration-slow`, `--aqb-duration-slower` | 6 |
| Transition | `--aqb-transition-fast`, `--aqb-transition-normal`, `--aqb-transition-slow`, `--aqb-transition-colors`, `--aqb-transition-transform`, `--aqb-transition-all` | 6 |
| **Subtotal (core)** | | **71** |
| **Full total** | Includes accent, spacing, typography, z-index, gradient, glass, AI, input, control, and panel-specific tokens | **~250** |

### 7.3 Adding New Tokens

When a new token is needed:
1. Follow pattern: `--aqb-[category]-[variant]`
2. Add to `src/themes/default.css` ONLY
3. No inline hex values for established design tokens
4. Document in PRD or CLAUDE.md

---

## 8. Component Architecture and Implementation

Source: §27.5, CLAUDE.md

### 8.1 Component Pattern

Each new editor component follows:

```
src/editor/[area]/
  ComponentName.tsx     — React component (UI only, no business logic)
  useComponentName.ts   — Hook with state/logic (if needed)
  ComponentName.test.tsx — Tests (in __tests__/ folder, co-located)
```

### 8.2 Component Rules

- Components access engine state through `composer.[manager].[method]()`
- Components subscribe to engine events via `composer.on('event', handler)` in `useEffect`
- Components do NOT directly mutate engine state — always through Composer methods
- Components do NOT contain business logic — extract to hooks or engine methods

### 8.3 Composer Gateway Rule

All state mutations go through `Composer` instance methods. Components NEVER directly mutate engine internals.

```ts
// CORRECT
composer.elements.createElement();       // then addElement(el, parentId)
composer.styles.setRule(selector, props); // or setBreakpointStyle(elementId, bp, styles)
composer.history.undo();

// INCORRECT — direct internal access
composer.state.elements.push(newElement);
```

### 8.4 Event-Driven Communication

```ts
// Composer emits events, UI subscribes
composer.on('element:selected', (element) => { /* update UI */ });
composer.on('project:saved', () => { /* show toast */ });
```

UI components subscribe to Composer events. They do NOT poll state.

---

## 9. Naming and Structure Rules

Source: §27.2, CLAUDE.md

### 9.1 Import Direction Rules (Non-Negotiable)

| Source Module | Can Import From | CANNOT Import From |
|--------------|----------------|-------------------|
| `engine/` | `shared/` | `editor/`, `components/`, `features/`, `services/` |
| `editor/` | `engine/`, `shared/`, `features/`, `blocks/`, `templates/` | `components/` (legacy) |
| `shared/` | Nothing from `src/` peers | Everything (it is the leaf dependency) |
| `features/` | `engine/`, `shared/` | `editor/`, `components/` |
| `services/` | `shared/` | Everything else |
| `components/` | `engine/`, `shared/` (legacy only) | Do not add new imports here |

### 9.2 New Code Placement

| What | Where |
|------|-------|
| New UI component | `src/editor/[area]/ComponentName.tsx` |
| New reusable hook | `src/shared/hooks/useHookName.ts` |
| New feature-specific hook | `src/editor/[area]/useHookName.ts` |
| New type | `src/shared/types/TypeName.ts` |
| New constant | `src/shared/constants/constantFile.ts` |
| New engine logic | `src/engine/ManagerName.ts` |

### 9.3 File Naming

- Components: `PascalCase.tsx` (e.g., `PageSettings.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `usePageSettings.ts`)
- Utils: `camelCase.ts` (e.g., `validatePage.ts`)
- Types: `PascalCase.ts` or inside `types/` folder
- Constants: `UPPER_SNAKE_CASE` exports, `camelCase.ts` files
- Tests: `__tests__/ComponentName.test.tsx` (co-located)
- Index files: barrel exports only — NO logic in `index.ts`

### 9.4 Anti-Patterns (from CLAUDE.md)

1. **No pass-through wrappers** — if function only calls another function, delete it, use direct import
2. **No middle-man classes** — if every method delegates without adding logic, remove the class
3. **No duplicate logic** — same check/calculation = one function, one place
4. **No SSOT violations** — types, constants, configs in one canonical file
5. **No mixed-responsibility files** — one file = one concern
6. **No dead code** — unused exports get deleted
7. **No over-fragmented flows** — maximum 3 hops: trigger → logic → effect
8. **No hidden side effects** — "get" functions must not mutate state
9. **No high coupling** — modules don't access peers' internals; communicate via events or Composer

---

## 10. Fallback and Unsupported Behavior

Source: §29

### 10.1 Fallback Behaviors (10 Defined)

| # | Trigger | Fallback | User-Facing UI |
|---|---------|----------|---------------|
| FB-1 | Collaboration connection lost | Editor continues offline. Changes queued. OT syncs on reconnect. | Gray "Offline" dot. "Offline — changes saved locally, will sync on reconnect." |
| FB-2 | Auto-save storage write fails | Retries on next timer (5000ms). After 3 failures → warning. | Toast (warning): "Auto-save is having trouble. Your changes are in memory but not yet saved. Try Ctrl+S." Amber dot. |
| FB-3 | Manual save API fails | SV4 (error state). Retry available. | Toast (error): "Could not save — check your connection and try again" + [Retry]. Red "Save failed." |
| FB-4 | AI service unavailable (503) | All AI surfaces → "unavailable." Non-AI features unaffected. | AIAssistantBar: input disabled, "AI temporarily unavailable." Inspector AI: "Suggestions unavailable" + [Retry]. |
| FB-5 | Export React/Vue/Next.js (planned) | "Coming Soon" badge + email capture. | [Notify me →] ghost button → email input. |
| FB-6 | Settings: Domains (planned) | "Coming Soon" state. | LockedScreen: description + [Notify me] email capture. |
| FB-7 | Settings: Analytics (planned) | Same as FB-6. | Same LockedScreen pattern. |
| FB-8 | Image upload: file too large | Upload rejected with error. | Toast (error): "Image exceeds 10 MB limit. Resize or compress before uploading." |
| FB-9 | Image upload: unsupported format | Upload rejected with format guidance. | Toast (error): "Unsupported format. Use JPEG, PNG, SVG, GIF, WebP, or AVIF." |
| FB-10 | Browser clipboard API unavailable | Falls back to `document.execCommand`. | No visible UI change. Clipboard still works. |

### 10.2 Unsupported — Explicit Non-Goals (6 Defined)

| # | Feature | Reason | User Messaging |
|---|---------|--------|---------------|
| NS-1 | Mobile editor (designing on phone) | Canvas requires desktop-class pointing device. Min width: 1024px. | Full-screen: "Buildrik is designed for desktop. Open on a computer for the best experience." |
| NS-2 | IE11 / legacy browsers | Modern CSS features required. | Redirect to browser upgrade page. |
| NS-3 | Offline-first editing | Connectivity expected for save, publish, collaboration, AI. | Offline banner (FB-1). |
| NS-4 | Plugin store UI | `PluginManager` exists in engine but no marketplace designed. Future scope. | No UI surface. |
| NS-5 | Multi-page preview | Preview opens current page only. | Ctrl+P shows active page. |
| NS-6 | Real-time comments/annotations | Collaboration supports cursors and selection, not comments. Future scope. | No comment UI surface. |

---

## 11. Anti-Regression Engineering Notes

Source: §30

### 11.1 All 25 Anti-Regression Items

| # | Risk | What Could Go Wrong | Verification | Pass Criteria | PRD Ref |
|---|------|--------------------|--------------|--------------| --------|
| AR1 | Inspector sections removed | Sections reduced to "simplify" | Count per tab in UI | Layout=7, Style=7+1, Behavior=6. Total ≥ 20. | §11.3 |
| AR2 | Pseudo-state selector removed | ROW 6 dropped from inspector | Verify ROW 6 exists | Default + Hover + Focus + Active + Disabled | §11.2, §11.4 |
| AR3 | Components tab not in rail | Rail still 8 icons | Count rail icons | TOP: 6, BOTTOM: 4 | §8.1 |
| AR4 | Publish tab not in rail | Only accessible via shortcut | Verify BOTTOM zone | Publish icon present and functional | §8.1 |
| AR5 | CMS UI not designed | CMS surfaces missing | Verify 4 entry points | CMS List, Collection Setup, Chain icon, Binding dropdown | §12 |
| AR6 | AI surfaces reduced | Only AI button, no bar or copilot | Verify 3 surfaces | AIAssistantBar, Copilot, AI Suggestions | §14 |
| AR7 | Keyboard shortcuts changed | Shortcuts conflict or silently dropped | Automated shortcut test | All 30+ produce correct action | §5B, §17.2 |
| AR8 | Multi-select inspector missing | Nothing shown for multi-select | Shift+click 2 → verify | Align(6) + Distribute(2) + Size(2) + Actions(3) | §11.6 |
| AR9 | Canvas overlays reduced | Fewer toggles in footer | Count toggles | Guides, Spacing, Grid, Badges, X-Ray, Rulers | §10.7 |
| AR10 | History reduced to undo only | Named versions, restore, compare removed | Verify 3 capabilities | Save version, Restore with confirm, Compare split-view | §15 |
| AR11 | Export simplified to HTML only | Coming-soon formats dropped | Verify export modal | 5 formats (HTML+CSS live, React/Vue/Next.js/ZIP Coming Soon) | §16.1 |
| AR12 | Settings sub-screens collapsed | Fewer than 6 cards | Count cards | Site, Domains, Analytics, Export, Integrations, Advanced | §9.11 |
| AR13 | Onboarding removed | No WelcomeModal or checklist | Verify first-visit | WelcomeModal + Checklist + Spotlight + Achievement | §5G, §18.1 |
| AR14 | Context menu stack removed | No "Select from stack" submenu | Right-click overlapping elements | Submenu lists all elements at click point | §10.8, §21.3 |
| AR15 | Design token export removed | Export dropdown missing | Verify Design tab export | CSS, JSON, SCSS/Tailwind formats | §9.10 |
| AR16 | DevModeToggle buried | Not in inspector header ROW 1 | Verify toggle visible | Toggles CS-12 without scrolling | §11.2 |
| AR17 | Breakpoint indicators missing | No blue dots on overrides | Switch to Tablet + override | 5px blue dot + desktop value tooltip | §11.5 |
| AR18 | Canvas empty state missing | Blank project → no guidance | Create blank project | CanvasEmptyCTA with Browse Templates + Start Blank | §10.2, §26.1 |
| AR19 | Snap lines not implemented | No alignment guides on drag | Drag near another element | Magenta (#FF00FF) lines at 6px threshold + distance labels | §10.5 |
| AR20 | Floating toolbar missing | No toolbar above selected | Click element | 7 buttons visible | §10.3 |
| AR21 | Confirm dialog missing | Delete executes without confirm | Click delete in inspector | Dialog with consequence + [Delete] + [Keep] | §25.1 P3 |
| AR22 | Command palette keyboard broken | Arrows/Enter don't work | Ctrl+K → type → navigate | Arrow keys move focus, Enter executes, Escape closes | §17.1 |
| AR23 | Collaboration cursors not rendering | Cursors invisible despite connection | Connect 2 users | SVG arrow + name badge. Fades after 3s idle. | §13.2 |
| AR24 | Toast notifications missing | Actions complete silently | Perform save/publish/delete | Toast with correct variant + duration | §25.1 P4-5 |
| AR25 | Focus ring removed | No focus indicator on keyboard | Tab through UI | `2px solid #6366f1, offset 2px` on every focusable element | §20.1 A10 |

---

## 12. QA, Validation, and Readiness

Source: §30, B.1, Output E

### 12.1 Reconciliation Notes (B.1)

**B vs. Output C (Coverage Check):**
- All 77 coverage items in C remain accurate after B expansion.
- X-Ray mode (CS-11) now fully specified — upgraded from "AT RISK" to "Preserved."
- Coverage grade: 99% (only Plugin UI remains as intentional non-goal per NS-4).

**B vs. Output D (Stitch Handoff Brief):**
- No contradictions found. D's handoff brief is fully compatible with B's expanded specs.

**B vs. Output E (Anti-Downgrade Checklist):**
- All E checklist items are covered by corresponding B sections.
- C10 (X-Ray mode) upgraded from "AT RISK" to "Preserved."

**Internal B Consistency:**
- Canvas states (17) vs footer toggles (6): consistent — 6 are toggleable overlays, rest are interaction states.
- Pseudo-state count: 4 non-normal states + Normal button = 5 buttons in ROW 6. Not a contradiction.
- SV8 auto-save not resetting dirty flag: consistent with TS2 and M12.
- Breakpoint widths (1920/768/375/196): Desktop=1920 in engine, Watch=196 (NOT 184). UI label shows "1440px" for desktop but engine width is 1920.

### 12.2 Anti-Downgrade Checklist (56 Points)

The full 56-point checklist is defined in Output E (§E.1–§E.7):

| Section | Items | Critical? |
|---------|-------|-----------|
| E.1 Rail and Navigation | N1–N6 (6 items) | Yes — all N-series must pass |
| E.2 Left Sidebar Panels | S1–S20 (20 items) | Moderate — ≤3 "At Risk" acceptable |
| E.3 Canvas | C1–C12 (12 items) | Yes — all C-series must pass |
| E.4 Inspector | I1–I14 (14 items) | Yes — all I-series must pass |
| E.5 Modals and Overlays | M1–M10 (10 items) | Moderate |
| E.6 CMS/Collaboration/AI | A1–A8 (8 items) | Moderate |
| E.7 Onboarding | O1–O4 (4 items) | Moderate |

**Grading:**
- **PASS:** All N-series, I-series, and C-series items Preserved
- **CONDITIONAL PASS:** ≤3 items "At Risk" — must be corrected before implementation
- **FAIL:** Any item "Missing" in N/I series, or ≥4 items "At Risk" overall

A FAIL grade requires revision before engineering work begins.

---

## 13. Metrics, Telemetry, and Success Signals

Source: §28

### 13.1 All 16 Success Metrics

| # | Category | Metric | Target | Current (Est.) | Measurement |
|---|----------|--------|--------|---------------|-------------|
| M1 | Onboarding | Time to first publish (new user) | < 10 min | ~20-30 min | Analytics: first-visit → first-publish |
| M2 | Discoverability | Features discoverable without docs | > 80% | ~40% | User testing: 10 tasks, unassisted completion |
| M3 | Navigation | Rail click to open panel | ≤ 1 click | ≤ 1 click | Automated click count |
| M4 | Inspector | All sections accessible | 20/20 | 20/20 | Automated section count per tab |
| M5 | Keyboard | Shortcuts preserved | 30+/30+ | 30+ | Automated shortcut test suite |
| M6 | Accessibility | WCAG 2.1 AA compliance | 100% | ~60% | axe-core scan + manual screen reader |
| M7 | Reliability | Error recovery (retry available) | 100% | ~70% | Manual: trigger each error, verify retry |
| M8 | Performance | Canvas interaction latency | < 16ms (60fps) | ~16ms | Performance profiling |
| M9 | Performance | Panel open time | < 150ms | ~100ms | click → panel visible timestamp |
| M10 | Performance | Inspector re-render on selection | < 50ms | ~30ms | React DevTools render time |
| M11 | Collaboration | Cursor sync latency | < 100ms | ~80ms | Network round-trip |
| M12 | Save | Auto-save success rate | > 99.5% | ~98% | Analytics: failures / attempts |
| M13 | CMS | Binding setup time (first collection) | < 3 min | N/A | User testing |
| M14 | AI | Suggestion acceptance rate | > 30% | N/A | Analytics: Apply clicks / suggestions |
| M15 | Export | Download success rate | > 99% | ~95% | Analytics: downloads / clicks |
| M16 | Satisfaction | User ease of use (1-5) | ≥ 4.0 | N/A | In-app survey after first publish |

### 13.2 Metric Categories

- **Non-negotiable (must maintain):** M3, M4, M5 — these represent capabilities that already work and must not regress
- **Improvement targets:** M1, M2, M6, M7 — these are the primary goals of the redesign
- **Performance baselines:** M8, M9, M10, M11, M12 — must not degrade
- **Future measurement:** M13, M14, M15, M16 — require new telemetry or features not yet built

---

## 14. Plain-English Summary + Source Notes + Unclear Items

### 14.1 Plain-English Summary

When a new user opens Buildrik for the first time, they see:
- A dark editor shell with a left rail, no panels open
- A centered CanvasEmptyCTA card asking them to browse templates or start blank
- A WelcomeModal (if first-ever visit) with the same two choices
- An OnboardingChecklist floating panel that guides them through 5 steps

When they return, their last session is restored from localStorage (sidebar state, zoom, overlays) and auto-save.

For engineers, the key rules are:
- Emotion only for styling, tokens in `src/themes/default.css` only
- New code goes in `src/editor/`, never `src/components/` (legacy)
- Import direction rules are strict and non-negotiable
- Components are UI-only shells; logic lives in hooks and Composer methods
- ~250 design tokens across 9+ categories in `src/themes/default.css` (71 core tokens across surface, primary, semantic, text, border, radius, shadow, duration, transition)

For QA, the 56-point anti-downgrade checklist (Output E) must be run against any design output. The 25 AR items (§30) must be verified before shipping. 16 success metrics track whether the redesign achieves its goals.

### 14.2 Source Notes

| Section | PRD Source |
|---------|-----------|
| §2 Default Canvas | §26 (lines ~4070–4120) |
| §3 Templates/Starter | §9.6, §26.2 |
| §4 Empty/First-Use | §9.5–§9.14, §10.2, §11.7 |
| §5 Handoff Principles | §27.1 (lines ~4123–4136) |
| §6 Styling Rules | §27.3 (lines ~4155–4165) |
| §7 Token Implementation | §27.4 (lines ~4166–4181), §23, §24 |
| §8 Component Architecture | §27.5 (lines ~4183–4197), CLAUDE.md |
| §9 Naming/Structure | §27.2 (lines ~4137–4154), CLAUDE.md |
| §10 Fallback/Unsupported | §29 (lines ~4224–4271) |
| §11 Anti-Regression | §30 (lines ~4274–4305) |
| §12 QA/Validation | §30, B.1 (lines ~4308–4360), Output E (lines ~4754–4878) |
| §13 Metrics | §28 (lines ~4201–4221) |

### 14.3 Unclear / Ambiguous Items

| # | Item | Issue | PRD Reference |
|---|------|-------|---------------|
| U1 | **Inspector width: 280px vs 320px** | §6.2 says inspector is "280px default → 320/400px expanded." §11.1 says "320px fixed" for all inspector states. These values conflict. If 320px is the intended fixed width, it changes the canvas width calculation (§6.3). | §6.2 vs §11.1 |
| U2 | **Onboarding step count: 5 vs 7** | §5G says "5 steps" but code (`src/shared/constants/onboardingSteps.ts`) defines 7: name-project, pick-start, add-element, edit-text, change-style, preview, publish. Code is authoritative. | §5G vs code |
| U3 | **Auto-save timer interval** | §29.2 FB-2 mentions "5000ms" timer. No other reference specifies the auto-save interval. Is 5s the canonical auto-save frequency? | §29.2 |
| U4 | **"Notify me" service** | FB-5, FB-6 reference email capture for Coming Soon features, but no backend service or API for this is defined. Is this a stub, or does it need implementation? | §29.2 |
| U5 | **Overlay toggle count: 6 vs 7** | §10.7 lists 6 toggles. §30 AR9 says "7 overlay toggles." The seventh is not identified. Snap lines are automatic, not toggleable. | §10.7 vs §30 AR9 |
| U6 | **Editor minimum width: 1024px vs 1280px** | §6.1 says "minimum supported: 1024 × 768px." §27.3 says "fixed desktop layout, min 1280px." §29.3 NS-1 says "minimum width: 1280px" for the unsupported message but §6.1 says the message triggers below 1024px. | §6.1 vs §27.3 vs §29.3 |
| U7 | **Token count verified** | §7.2 originally claimed 42 tokens across 8 categories. Actual `src/themes/default.css` contains ~250 tokens across 9+ categories. §7.2 has been updated to reflect the real token inventory. Removed non-existent tokens (`--aqb-app-bg`, `--aqb-canvas-bg`, `--aqb-canvas-content`, `--aqb-teal`, `--aqb-text-dim`, `--aqb-text-on-primary`) and corrected duration token names from numeric to semantic. | §23, §24, §27.4 |
