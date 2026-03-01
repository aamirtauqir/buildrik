# Inspector Panel (Right Panel) UX Audit — Design Document

**Date:** 2026-03-01
**Package:** `packages/new-editor-l2`
**Primary file:** `src/editor/inspector/ProInspector.tsx`
**Full scope:** `src/editor/inspector/` — all 60+ files
**Strategy:** User Experience First — highest daily-impact fixes first, then a11y, then architecture cleanup

---

## Scope Corrections (Prompt vs. Reality)

The audit brief contained six assumptions about the current code that do not match the actual implementation. This section corrects the record before any sprint begins.

| #   | Spec Assumption                                                    | Ground Truth                                                                                                        | Sprint Impact                                                        |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | "NATIVE / CUSTOM" type badge shown in header                       | Does **not** exist. Header shows element type, truncated ID, and `tagName` badge (`<div>`, `<section>`)             | Remove all NATIVE/CUSTOM issues — inapplicable                       |
| 2   | "3/6 element navigator with up/down arrows"                        | Does **not** exist. Current UI has `ElementBreadcrumb` — a clickable ancestor chain with a "Show in Layers" button  | Navigator issues → audit `ElementBreadcrumb.tsx` for quality instead |
| 3   | "Delete replaces entire panel (inline takeover)"                   | Already fixed — delete uses a `Modal` component from `shared/ui/Modal`. Panel content is preserved behind the modal | Delete issues = microcopy + a11y only, not architecture              |
| 4   | "State selector has 4 states: Default · :hover · :focus · :active" | Has **5 states**: `normal`, `hover`, `focus`, `active`, **`disabled`**                                              | All pseudo-state audits must include disabled state                  |
| 5   | "Sub-nav breadcrumb is just an index"                              | Confirmed — decorative plain text, not clickable                                                                    | Sprint S2 still required                                             |
| 6   | "Style tab sections all collapsed with no value preview"           | Confirmed — `Section.tsx` has no `preview` prop                                                                     | Sprint S1 still required                                             |

---

## Part 1 — User Mental Model Analysis

### What Users Come Here to Do

1. Change layout properties (display mode, width, height, position, padding, margin)
2. Apply visual styles (color, typography, border, shadow, effects)
3. Configure interactive states (hover color change, focus ring)
4. Set element identity (ID, CSS classes, data attributes)
5. Delete elements
6. Navigate to parent elements quickly

### What They Expect to Work

| Expectation                                              | Current Reality                              | Gap    |
| -------------------------------------------------------- | -------------------------------------------- | ------ |
| See at a glance which sections have values               | All Style sections collapsed, no preview     | S1 fix |
| Click "Spacing" in the nav strip to jump to it           | Nav strip is decorative text, not functional | S2 fix |
| Know that :hover styles exist without clicking the state | No indicator on Default state button         | S3 fix |
| Delete with accurate feedback about undo                 | "Cannot be undone" but Ctrl+Z works          | S4 fix |
| Tab between tabs with keyboard                           | `aria-pressed` used instead of tab role      | S5 fix |
| Click element ID to copy it                              | ID is plain text, not interactive            | S8 fix |

### Where Users Get Confused

**Designer (Figma/Webflow background):**

- Expects collapsed section to show current value (Figma shows color swatch on Fill section header)
- The 5 pseudo-states are familiar but `:disabled` placement after `:active` is unusual
- Badge count "6" on every tab seems like it should count _set_ properties, not available sections

**Non-technical user:**

- "What does :hover mean?" — state buttons have no plain-language tooltip
- "Why are all the Style sections empty?" — they are not empty, they are just collapsed with no preview
- "Position · Display · Spacing · Flexbox · Grid · Visibility" looks like a clickable menu but does nothing

### Designer vs. Non-Technical Differences

| Feature        | Designer Expects                 | Non-Technical Expects              |
| -------------- | -------------------------------- | ---------------------------------- |
| State labels   | `:hover`, `:focus`               | "Mouse over", "Keyboard focus"     |
| Section header | Collapsed + color swatch preview | Collapsed + "has values" indicator |
| Badge count    | Count of overridden properties   | Nothing — they ignore it           |
| Sub-nav        | Clickable jump links             | Plain section index                |

---

## Part 2 — Issue Table

### Architecture

| #   | Severity  | ID      | Observation                                                                                                                                                   | Impact                                                                      | Fix                                                                                      | File                             |
| --- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | 🟠 High   | ARCH-01 | `renderPseudoStateSelector()` and `renderBreakpointIndicator()` are render functions defined in `styles/index.tsx` — a styles file                            | Mixed-responsibility file; styles file now also owns render logic           | Extract to `components/PseudoStateSelector.tsx` and `components/BreakpointIndicator.tsx` | `styles/index.tsx`               |
| 2   | 🟠 High   | ARCH-02 | `ELEMENT_TO_TAB_MAP` and `ELEMENT_TO_SECTION_MAP` in `useInspectorState.ts` partially duplicate `config/elementProfiles.ts` (code comment: "Legacy fallback") | Two sources of truth for tab routing; diverges silently                     | Delete the maps, use `getDefaultTab()` from `config` exclusively                         | `hooks/useInspectorState.ts`     |
| 3   | 🟡 Medium | ARCH-03 | Delete confirmation state (`showDeleteConfirm`) + full Modal JSX block lives inside `ProInspector.tsx`                                                        | Shell component owns confirmation logic; violates single responsibility     | Extract to `components/DeleteConfirmation.tsx`                                           | `ProInspector.tsx`               |
| 4   | 🟡 Medium | ARCH-04 | `const sectionCounts = { layout: 6, design: 6, settings: 6 }` hardcoded in `ProInspector.tsx:328`                                                             | Badge counts are always "6" regardless of visible or populated sections     | Compute from `useInspectorSections`                                                      | `ProInspector.tsx`               |
| 5   | 🟡 Medium | ARCH-05 | `CSSClassesSection.tsx` caches classes in `useState` (loaded once in `useEffect`) instead of reading from composer                                            | Classes list stale if another operation adds a class outside this component | Read directly from composer in render via `useMemo`, no cached state                     | `sections/CSSClassesSection.tsx` |

### Critical

| #   | Severity    | ID   | Observation                                                                                                                                                                                                  | Impact                                                                                       | Fix                                                                                                                                  | Microcopy                                                                                                    | File                                              |
| --- | ----------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| 6   | 🔴 Critical | C-01 | Tab buttons use `aria-pressed` instead of `role="tab"` + `aria-selected`                                                                                                                                     | Screen readers announce "button, pressed" not "tab, selected" — semantically wrong           | Add `role="tablist"` wrapper, `role="tab"` + `aria-selected` on each button, `role="tabpanel"` on content                            | Tab label: "Layout & Size tab — 6 sections"; tabpanel: `aria-labelledby` pointing to tab                     | `ProInspector.tsx:327–364`                        |
| 7   | 🔴 Critical | C-02 | `Section.tsx` toggle button has no `aria-label` — only `aria-expanded` and `aria-controls`                                                                                                                   | Screen reader reads "button, collapsed" with no context of which section                     | Add `aria-label={`${title} section, ${isOpen ? 'expanded' : 'collapsed'}`}`                                                          | "Background section, collapsed. Press Enter to expand."                                                      | `shared/controls/Section.tsx:63`                  |
| 8   | 🔴 Critical | C-03 | Delete confirmation reads "This action cannot be undone." — Ctrl+Z restores deleted elements                                                                                                                 | Inaccurate copy erodes user trust; users avoid Ctrl+Z thinking it won't work                 | Replace with "You can undo this with Ctrl+Z."                                                                                        | Button label: "Delete" (red), "Cancel"                                                                       | `ProInspector.tsx:257–259`                        |
| 9   | 🔴 Critical | C-04 | All Style tab sections (`BackgroundSection`, `BorderSection`, `EffectsSection`, `AnimationSection`, `InteractionsSection`) are collapsed by default with no visual indication of whether they contain values | Users must open every section to check what's set — routine editing requires 5+ extra clicks | Add `preview` prop to `Section.tsx`; each section passes a preview (color swatch, border style, etc.) when it has non-default values | Swatch: 16×16 px colored square; border: style abbreviation; effects: "2 shadows"; animation: animation name | `shared/controls/Section.tsx`, all style sections |

### High

| #   | Severity | ID   | Observation                                                                                                                      | Impact                                                                                               | Fix                                                                                                                                    | Microcopy                                                                                                                                                                                                                                           | File                                                 |
| --- | -------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 10  | 🟠 High  | H-01 | Pseudo-state buttons in `renderPseudoStateSelector` use only `title` attribute, not `aria-label`                                 | `title` is not reliably announced by screen readers                                                  | Add `aria-label` to each state button                                                                                                  | "Default state", "Hover state", "Focus state", "Active state", "Disabled state"                                                                                                                                                                     | `styles/index.tsx:243–252`                           |
| 11  | 🟠 High  | H-02 | Sub-nav strip ("Position · Display · Spacing · Flexbox · Grid · Visibility") is decorative plain text                            | Users — especially Webflow users — expect it to jump to that section; discovers nothing              | Replace with `<nav>` of `<button>` elements; clicking scrolls `contentRef` to section anchor                                           | Tooltip: "Jump to [Section] section"                                                                                                                                                                                                                | `ProInspector.tsx:374–381`                           |
| 12  | 🟠 High  | H-03 | No indicator on Default state button when `:hover`, `:focus`, or `:active` styles are defined                                    | Users editing :hover styles then switching back to Default have no confirmation that overrides exist | Show a colored dot on states that have overrides; requires `overriddenStates` set from `useStyleHandlers`                              | Tooltip on dot: "Has custom :hover styles"                                                                                                                                                                                                          | `styles/index.tsx` + `ProInspector.tsx`              |
| 13  | 🟠 High  | H-04 | Badge counts hardcoded to "6" for all tabs (`sectionCounts = { layout: 6, design: 6, settings: 6 }`)                             | Badge implies meaning (count of set properties? count of sections?) but is always "6" regardless     | Remove badges entirely OR compute from `useInspectorSections.expandedCount`                                                            | Tooltip if kept: "6 sections available in this tab"                                                                                                                                                                                                 | `ProInspector.tsx:328`                               |
| 14  | 🟠 High  | H-05 | Element ID (`#{id.slice(-8)}`) is plain text; no click-to-copy                                                                   | Developers who need to target this element in CSS cannot copy the ID                                 | Wrap in `<button>` with click-to-copy + clipboard feedback                                                                             | On copy: "Copied!" tooltip for 1.5s                                                                                                                                                                                                                 | `ProInspector.tsx:221`                               |
| 15  | 🟠 High  | H-06 | `CSSClassesSection` autocomplete shows hardcoded Tailwind class suggestions, not the project's actual global classes             | Users see irrelevant suggestions; actual project classes are invisible                               | Read global classes from `composer.styles.getGlobalClasses?.()` if available; fall back to empty list (remove hardcoded Tailwind list) | Input placeholder: "Add class name…"; empty: "No classes applied yet"                                                                                                                                                                               | `sections/CSSClassesSection.tsx:20–26`               |
| 16  | 🟠 High  | H-07 | `CSSClassesSection` caches classes in `useState` loaded by `useEffect`                                                           | Class list stale after external mutations                                                            | Use `useMemo(() => composer.elements.getElement(id)?.getClasses?.() ?? [], [composer, selectedElement])`                               | —                                                                                                                                                                                                                                                   | `sections/CSSClassesSection.tsx:37–56`               |
| 17  | 🟠 High  | H-08 | Per-tab scroll position not preserved when switching tabs — only per-element                                                     | Scrolled to "Flexbox" in Layout tab, switch to Style, switch back → scroll resets to top             | Track `Map<TabName, number>` scroll positions and restore on tab switch                                                                | —                                                                                                                                                                                                                                                   | `ProInspector.tsx`                                   |
| 18  | 🟠 High  | H-09 | `renderPseudoStateSelector` state buttons only show raw CSS pseudo-class names (`:hover`, `:focus`) without plain-language label | Non-technical users do not know what `:hover` or `:focus` means                                      | Add tooltip with plain-English explanation                                                                                             | `:hover` → "Mouse over state — styles when user hovers"; `:focus` → "Keyboard focus state — styles when element is focused"; `:active` → "Click state — styles while clicking"; `:disabled` → "Disabled state — styles when interaction is blocked" | `styles/index.tsx:243`                               |
| 19  | 🟠 High  | H-10 | `MultiSelectToolbar` has no keyboard shortcut hints on alignment buttons                                                         | Power users expect Shift+A, Option+C, etc. (Figma pattern)                                           | Add keyboard shortcut to tooltip text                                                                                                  | "Align Left (⌘⌥L)", "Align Center (⌘⌥C)", etc. — if shortcuts are wired; if not, add to backlog                                                                                                                                                     | `components/MultiSelectToolbar.tsx`                  |
| 20  | 🟠 High  | H-11 | `DataAttributeEditor` has no validation that keys start with `data-`                                                             | User can enter `tracking-id` (invalid) instead of `data-tracking-id`                                 | Validate on blur: key must match `/^data-[a-z][a-z0-9-]*$/`; show inline error                                                         | Error: "Data attribute keys must start with 'data-' and contain only lowercase letters, numbers, and hyphens."                                                                                                                                      | `sections/elementProperties/DataAttributeEditor.tsx` |

### Medium

| #   | Severity  | ID   | Observation                                                                                                                           | Impact                                                                                 | Fix                                                                                               | Microcopy                                                                | File                                                |
| --- | --------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------- |
| 21  | 🟡 Medium | M-01 | Delete button uses emoji `🗑️`                                                                                                         | Emoji rendering inconsistent across platforms; not scalable; not an SVG                | Replace with Lucide `Trash2` SVG icon (already used in the codebase via lucide-react)             | `aria-label="Delete element"`, `title="Delete element"`                  | `ProInspector.tsx:231–239` + `styles/index.tsx:153` |
| 22  | 🟡 Medium | M-02 | Breakpoint indicator uses emoji `📱`/`📲` without `aria-hidden`                                                                       | Emoji is announced by screen readers as "mobile phone emoji" — confusing               | Replace emoji with SVG tablet/mobile icons; add `aria-hidden="true"` to decorative elements       | "Editing Tablet styles — max 768px"; "Editing Mobile styles — max 480px" | `styles/index.tsx:273–284`                          |
| 23  | 🟡 Medium | M-03 | `Section.tsx` collapse chevron uses `▼` text character, not accessible SVG                                                            | Text char renders differently across fonts; cannot be styled precisely; not accessible | Replace with `<ChevronDown>` from lucide-react; add `aria-hidden="true"`                          | —                                                                        | `shared/controls/Section.tsx:82–88`                 |
| 24  | 🟡 Medium | M-04 | `ProInspector.tsx:113–114` shows delete confirmation state managed inside the 443-line shell                                          | Shell component owns modal state; violates single responsibility                       | Extract to `<DeleteConfirmation>` component that receives `elementLabel`, `onConfirm`, `onCancel` | —                                                                        | `ProInspector.tsx`                                  |
| 25  | 🟡 Medium | M-05 | `ElementBreadcrumb` hover state is JS-driven (`onMouseEnter`/`onMouseLeave`)                                                          | No keyboard hover state; hover effect doesn't apply on focus                           | Use CSS `:hover` and `:focus-visible` via inline conditional or CSS class                         | —                                                                        | `components/ElementBreadcrumb.tsx:245–252`          |
| 26  | 🟡 Medium | M-06 | `InspectorEmptyState` reads from `localStorage.getItem("aqb-last-applied-template")` directly                                         | Direct DOM storage access bypasses the app's state layer; fragile if key changes       | Lift the `appliedName` state to the parent (`ProInspector`/`AquibraStudio`) and pass as prop      | —                                                                        | `components/InspectorEmptyState.tsx:24–39`          |
| 27  | 🟡 Medium | M-07 | Multi-select hint "Select a single element to edit its properties" appears at the bottom of the toolbar, below all alignment controls | Users see a wall of alignment buttons before understanding why no properties are shown | Move hint to the top, as a banner above alignment controls                                        | "Multiple elements selected. Select just one to edit its properties."    | `components/MultiSelectToolbar.tsx:267–276`         |
| 28  | 🟡 Medium | M-08 | Tab key in CSS class input submits the class if the Enter path is short-circuited                                                     | Pressing Tab in the class input moves focus unexpectedly or adds a class               | `onKeyDown` handler: `Tab` → `e.preventDefault(); moveToNextFocusableElement()`                   | —                                                                        | `sections/CSSClassesSection.tsx`                    |
| 29  | 🟡 Medium | M-09 | `renderPseudoStateSelector` "State:" label uses hardcoded color `#6c7086`                                                             | Not a CSS variable; breaks if theme changes                                            | Replace with `var(--aqb-text-tertiary)`                                                           | —                                                                        | `styles/index.tsx:241`                              |
| 30  | 🟡 Medium | M-10 | `panelStyles.deleteBtn` uses raw hex colors in border/background instead of CSS variables                                             | Not themeable; duplicate values                                                        | Use `var(--aqb-error-light)`, `var(--aqb-error)`, `var(--aqb-border)`                             | —                                                                        | `styles/index.tsx:153–168`                          |
| 31  | 🟡 Medium | M-11 | `AnimationSection.handleAnimationPreview` accesses DOM directly via `document.querySelector`                                          | Bypasses React rendering cycle; can select wrong element if IDs conflict               | Access via `contentRef` passed from parent, or dispatch a preview event through composer          | —                                                                        | `tabs/DesignTab.tsx:91–98`                          |
| 32  | 🟡 Medium | M-12 | `useInspectorState.ts` `ELEMENT_TO_SECTION_MAP` has no entry for `image`, `video`, `form` elements that exist in `ELEMENT_TO_TAB_MAP` | Auto-expand logic inconsistent between tab and section selection                       | Sync maps; or delete maps and rely solely on `elementProfiles.ts`                                 | —                                                                        | `hooks/useInspectorState.ts:109–152`                |

### Low

| #   | Severity | ID   | Observation                                                                                                 | Impact                                                                 | Fix                                                                                 | File                                   |
| --- | -------- | ---- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------- |
| 33  | 🟢 Low   | L-01 | `DevModeToggle` shows a colored status dot alongside the toggle                                             | Dot duplicates the toggle state visually; two indicators for one state | Remove the status dot; toggle state alone is sufficient                             | `shared/DevModeToggle.tsx:62–68`       |
| 34  | 🟢 Low   | L-02 | `KeyboardHintsSection` renders at the bottom of every tab regardless of context                             | Not contextually relevant to all sections; adds scroll distance        | Render only when user has been inactive for 10s or in empty state                   | `sections/KeyboardHintsSection.tsx`    |
| 35  | 🟢 Low   | L-03 | `Section.tsx` controlled/uncontrolled sync uses `useEffect` to mirror `controlledIsOpen` → `internalIsOpen` | Can cause a render cycle (sync effect fires after paint)               | Remove `internalIsOpen` entirely when controlled; use `controlledIsOpen` directly   | `shared/controls/Section.tsx:47–51`    |
| 36  | 🟢 Low   | L-04 | Search in `InspectorControls` has no "no results" empty state                                               | Searching for "shadow" and seeing a blank panel looks broken           | Add inline "No sections match '[query]'" message when all sections are filtered out | `components/InspectorControls.tsx`     |
| 37  | 🟢 Low   | L-05 | `CSSClassesSection` COMMON_CLASSES suggestions are Tailwind-only                                            | Aquibra may not use Tailwind; suggestions add noise                    | Remove entirely; replace with actual project class autocomplete (H-06)              | `sections/CSSClassesSection.tsx:19–26` |

---

## Part 3 — User Journey Audit

### Workflow A: First-time user changes background color

| Step                         | Current Behavior                                     | Required Behavior                                     | Issue                  |
| ---------------------------- | ---------------------------------------------------- | ----------------------------------------------------- | ---------------------- |
| 1. Click element             | Inspector opens on Layout & Size tab (smart tab)     | Same — correct                                        | —                      |
| 2. Look for background color | Not visible in Layout tab                            | User must switch to Style tab                         | H-02 (no sub-nav jump) |
| 3. Switch to Style tab       | Style tab shows 5 collapsed sections with no preview | Correct tab; but user sees 5 identical collapsed rows | C-04                   |
| 4. Open Background section   | Section expands — color picker shown                 | Section expands — ✅                                  | —                      |
| 5. Pick color                | Color applied to canvas                              | Same — canvas updates live via `handleStyleChange`    | ✅ already works       |
| 6. Press Ctrl+Z              | Color reverts                                        | Same — wrapped in `beginTransaction`                  | ✅ already works       |

**Failures:** Steps 2 and 3. After fix: Background section shows color swatch when collapsed — user immediately identifies it as the target.

---

### Workflow B: Make container responsive — different padding on mobile

| Step                                | Current Behavior                                                     | Required Behavior                                                    | Issue                                     |
| ----------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| 1. Set padding 40px on Desktop      | Works via SpacingSection                                             | Same                                                                 | ✅                                        |
| 2. Switch to Mobile breakpoint      | Breakpoint indicator appears (emoji 📲, amber banner)                | Same; but emoji is not screen-reader friendly                        | M-02                                      |
| 3. See current padding value        | Shows Desktop value inherited (overriddenProperties Set tracks this) | Must show visual indicator on field that it inherits from Desktop    | H-03 area                                 |
| 4. Change padding to 16px on Mobile | Value applied; `overriddenProperties` Set updated                    | Same — `overriddenProperties` already returned by `useStyleHandlers` | ✅                                        |
| 5. Switch back to Desktop           | Desktop shows 40px still                                             | Same — breakpoint-aware                                              | ✅                                        |
| 6. Reset Mobile override            | No UI to reset an overridden property to inherit                     | Add reset button (×) per overridden field                            | New issue (not in 37 above — add as H-12) |

**Failure:** Step 6. No reset mechanism exists for breakpoint overrides. Sprint backlog item.

---

### Workflow C: Add hover color to a button

| Step                      | Current Behavior                                               | Required Behavior                                            | Issue          |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ | -------------- |
| 1. Select button          | Settings tab opens (ELEMENT_TO_TAB_MAP maps button → settings) | Style tab should open for :hover color work                  | ARCH-02 / M-12 |
| 2. Click :hover state     | State selector highlights :hover                               | Same; but no plain-language explanation                      | H-09           |
| 3. Open Background        | Collapsed — no swatch                                          | Swatch shows current hover background                        | C-04           |
| 4. Pick color             | Applied to canvas at :hover                                    | Same — `currentPseudoState` is passed to `handleStyleChange` | ✅             |
| 5. Switch back to Default | Default state shows — no indicator that :hover has styles      | Dot indicator on Default state button                        | H-03           |

**Failures:** Steps 1, 3, 5.

---

### Workflow D: Add a CSS class

| Step                  | Current Behavior                                                         | Required Behavior                                                             | Issue                        |
| --------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- | ---------------------------- |
| 1. Click Advanced tab | SettingsTab renders with CSSClassesSection                               | Same                                                                          | ✅                           |
| 2. Type class name    | Input shows Tailwind suggestions                                         | Input shows project's actual global classes                                   | H-06                         |
| 3. Press Add          | Class added to element; classList state updated from `useEffect` (stale) | Class added; live from composer                                               | H-07 / ARCH-05               |
| 4. View class styles  | No way to inspect what the class does                                    | "View styles" link beside each applied class — navigates to Global Styles tab | New feature — sprint backlog |
| 5. Remove class       | `×` button beside class removes it                                       | Same                                                                          | ✅                           |

**Failures:** Steps 2, 3.

---

### Workflow E: Delete an element

| Step                              | Current Behavior                                                   | Required Behavior                                        | Issue     |
| --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------- | --------- |
| 1. Click trash icon               | `setShowDeleteConfirm(true)` — Modal opens                         | Same                                                     | ✅        |
| 2. Read warning                   | "Are you sure? This action cannot be undone."                      | "Delete [name]? You can undo this with Ctrl+Z."          | C-03      |
| 3. Press Cancel                   | Modal closes; element still selected; panel shows properties       | Same                                                     | ✅        |
| 4. Press Delete                   | Element removed from canvas; Modal closes; panel shows empty state | Same — `onDelete?.(selectedElement.id)` fires            | ✅        |
| 5. Press Ctrl+Z                   | Element restored                                                   | Same — history integration exists                        | ✅        |
| 6. Keyboard: Tab to Delete button | Focus management inside Modal not tested                           | Focus trapped: Cancel → Delete → Cancel; Escape → Cancel | C-02 area |

**Failures:** Step 2 (inaccurate copy), Step 6 (focus trap not verified).

---

### Workflow F: Align 3 elements

| Step                            | Current Behavior                                                 | Required Behavior                              | Issue |
| ------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ----- |
| 1. Multi-select 3 elements      | MultiSelectToolbar renders                                       | Same                                           | ✅    |
| 2. See hint text                | Hint at BOTTOM: "Select a single element to edit its properties" | Hint at TOP — before alignment controls        | M-07  |
| 3. Click "Align Left"           | `alignmentHandler.alignHorizontal(ids, 'left')`                  | Same — ✅                                      | ✅    |
| 4. Distribute evenly            | `alignmentHandler.distribute(ids, 'horizontal')`                 | Same — ✅                                      | ✅    |
| 5. Apply same background to all | No capability — multi-select only does alignment                 | No fix required this sprint (noted as backlog) | —     |

**Failure:** Step 2 only.

---

### Workflow G: Developer adds data attribute

| Step                             | Current Behavior                                    | Required Behavior                       | Issue |
| -------------------------------- | --------------------------------------------------- | --------------------------------------- | ----- |
| 1. Enable DEV mode               | DevModeToggle flipped — AllCSSSection appears       | Same                                    | ✅    |
| 2. Click Advanced tab            | SettingsTab shows DataAttributeEditor               | Same                                    | ✅    |
| 3. Enter key: "tracking-id"      | Input accepts it (no validation)                    | Inline error: "Must start with 'data-'" | H-11  |
| 4. Enter key: "data-tracking-id" | Accepted; value field shown                         | Same — ✅                               | ✅    |
| 5. Save attribute                | `handleGenericAttributeChange` commits via `runTxn` | Same                                    | ✅    |
| 6. See AllCSSSection             | Shows generated CSS for element                     | Same — visible in DEV mode              | ✅    |

**Failure:** Step 3.

---

## Part 4 — Edge Cases

| Edge Case                                           | Current Behavior                                               | Required Behavior                                                        | Fix                                                    |
| --------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------ |
| Nothing selected                                    | `InspectorEmptyState` renders with "Nothing Selected" + CTA    | ✅ Already correct                                                       | —                                                      |
| Element deleted from canvas by another collaborator | Panel shows stale element data                                 | `useComposerSelection` subscription should clear selection               | Already handled via `selectedElement` prop from parent |
| Invalid value in width (e.g., "abc")                | Depends on `NumericInput` — not audited in this pass           | Red border + "Enter a valid number"                                      | Add validation to `InputControls.tsx`                  |
| Width = 9999px                                      | Accepted; canvas clips                                         | Same — valid use case                                                    | ✅                                                     |
| Duplicate ID in Advanced tab                        | `handleGenericAttributeChange` sets it without validation      | Inline error: "ID '#name' is already in use on this page."               | Add `validateId()` to `DataAttributeEditor`            |
| Locked element selected                             | No locking system implemented                                  | Read-only view with lock banner when composer reports locked             | Backlog                                                |
| Custom component (component instance)               | `VariantSection` appears for component instances               | Same; also show "Component instance — edits affect all instances" banner | Backlog                                                |
| Text element selected                               | Smart tab routes to "Design" + Typography auto-expand          | ✅ Already works                                                         | —                                                      |
| Image element selected                              | Smart tab routes to "Settings" + Size auto-expand              | ✅ Already works                                                         | —                                                      |
| Form element selected                               | Smart tab routes to "Settings" + ElementProperties auto-expand | ✅ Already works via `isForm` check                                      | —                                                      |
| Escape while editing a field                        | Depends on input component; not consistently reverted          | Add `onKeyDown` Escape handler to `InputControls.tsx` to call `revert()` | Add to NumericInput/TextInput                          |
| Enter in numeric field                              | Commits value + moves to next field                            | Depends on input — add `onKeyDown` Enter handler                         | Add to `InputControls.tsx`                             |
| Tab in CSS class input                              | May submit class                                               | Prevent default Tab; move focus forward                                  | M-08                                                   |
| Panel width < 260px                                 | Controls likely overflow                                       | Min-width 260px enforced in panel container style                        | Add to `panelStyles.panel`                             |
| User enters :hover styles; returns to Default       | No indicator that :hover overrides exist                       | Dot indicator on Default state button                                    | H-03 / S3                                              |
| Breakpoint overridden property reset                | No reset UI                                                    | Field-level reset button (×) per overridden property                     | H-12 / backlog                                         |
| Search returns 0 results                            | Blank panel                                                    | "No sections match '[query]'" empty state                                | L-04                                                   |
| Section with values vs. without — both collapsed    | Visually identical                                             | Applied section shows preview swatch                                     | C-04 / S1                                              |

---

## Part 5 — Target Architecture

### Current vs. Target Folder Map

```
src/editor/inspector/
├── ProInspector.tsx          ← 443 lines; too large; owns delete modal state
│                               Target: < 100 lines (shell only)
├── index.ts
│
├── components/
│   ├── InspectorControls.tsx     ← keep
│   ├── InspectorEmptyState.tsx   ← keep; remove direct localStorage read
│   ├── InspectorErrorBoundary.tsx ← keep
│   ├── MultiSelectToolbar.tsx     ← keep; move hint to top
│   ├── ElementBreadcrumb.tsx      ← keep; fix hover→CSS
│   ├── DeleteConfirmation.tsx     ← NEW (extracted from ProInspector.tsx)
│   ├── PseudoStateSelector.tsx    ← NEW (extracted from styles/index.tsx)
│   ├── BreakpointIndicator.tsx    ← NEW (extracted from styles/index.tsx)
│   └── index.ts
│
├── hooks/
│   ├── useInspectorState.ts    ← keep; delete duplicate maps
│   ├── useInspectorSections.ts ← keep
│   ├── useStyleHandlers.ts     ← keep; expose overriddenStates
│   ├── useAdvancedSettings.ts  ← keep
│   └── index.ts
│
├── sections/
│   ├── BackgroundSection.tsx   ← add preview prop pass
│   ├── BorderSection.tsx       ← add preview prop pass
│   ├── EffectsSection.tsx      ← add preview prop pass
│   ├── AnimationSection.tsx    ← add preview prop pass; fix DOM access
│   ├── CSSClassesSection.tsx   ← fix SSOT; remove hardcoded classes
│   ├── ... (all others unchanged)
│
├── shared/controls/
│   └── Section.tsx             ← add preview prop; fix aria-label; fix chevron icon
│
├── styles/
│   └── index.tsx               ← remove render functions; keep style objects only
│
└── tabs/
    └── ... (unchanged)
```

### Architecture Laws (Anti-patterns Forbidden)

1. **No mixed responsibility in styles files** — `styles/index.tsx` must contain only style objects. No `React.ReactElement` returns.
2. **No duplicate routing maps** — `useInspectorState.ts` must use `config/elementProfiles.ts` exclusively. `ELEMENT_TO_TAB_MAP` and `ELEMENT_TO_SECTION_MAP` deleted.
3. **No local state for SSOT data** — `CSSClassesSection` must not cache class list in `useState`. Single read from composer.
4. **No hidden side effects** — `handleAnimationPreview` must not call `document.querySelector`. Use a ref or composer event.
5. **No pass-through wrappers** — `DeleteConfirmation` receives `{ elementLabel, onConfirm, onCancel }` as props. It does not re-read composer.
6. **No dead code** — Hardcoded `COMMON_CLASSES` deleted when replaced by project class autocomplete.

### Wiring Contract

```
User changes width value
  → SizeSection.onChange(property, value)
  → useStyleHandlers.handleStyleChange(property, value)
  → composer.elements.setStyle(id, breakpoint, pseudoState, property, value)
  → Event emitted → canvas re-renders
  → useStyleHandlers reads back new styles → panel updates
```

Maximum 3 file hops. Section components never call composer directly.

---

## Part 6 — Sprint Plan

Sprint order: highest user-impact first, then a11y compliance, then architecture cleanup.

---

### Sprint S1 — Collapsed Section Value Previews

**Fixes:** C-04
**Files:** `shared/controls/Section.tsx`, `sections/BackgroundSection.tsx`

#### `shared/controls/Section.tsx` — add `preview` prop

```tsx
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { Icon, type IconName } from "../../../../shared/ui";
import { baseStyles } from "./controlStyles";

export interface SectionProps {
  title: string;
  icon?: string | IconName;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
  /** Shown in section header when collapsed and a value is set */
  preview?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  preview,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalIsOpen(next);
    onToggle?.(next);
  };

  return (
    <div style={baseStyles.section}>
      <button
        style={baseStyles.sectionHeader(isOpen)}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`section-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
        aria-label={`${title} section, ${isOpen ? "expanded" : "collapsed"}`}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && (
            <span style={{ display: "flex", alignItems: "center" }}>
              {typeof icon === "string" && /^[A-Z]/.test(icon) ? (
                <Icon name={icon as IconName} size="sm" color="inherit" />
              ) : (
                icon
              )}
            </span>
          )}
          {title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isOpen && preview && (
            <span aria-hidden="true" style={{ display: "flex", alignItems: "center" }}>
              {preview}
            </span>
          )}
          <ChevronDown
            size={12}
            aria-hidden="true"
            style={{
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              color: "var(--aqb-text-tertiary)",
            }}
          />
        </span>
      </button>
      {isOpen && (
        <div
          id={`section-content-${title.toLowerCase().replace(/\s+/g, "-")}`}
          style={baseStyles.sectionContent}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Section;
```

#### `sections/BackgroundSection.tsx` — pass color swatch preview

In `BackgroundSection`, read `styles.backgroundColor` and pass as `preview`:

```tsx
// Inside BackgroundSection render, before return:
const bgColor = styles.backgroundColor || styles.background;
const preview = bgColor ? (
  <span
    style={{
      display: "inline-block",
      width: 14,
      height: 14,
      borderRadius: 3,
      background: bgColor,
      border: "1px solid rgba(255,255,255,0.15)",
      flexShrink: 0,
    }}
    title={bgColor}
  />
) : undefined;

// In JSX:
<Section title="Background" icon="Palette" preview={preview}>
  {/* ...existing content */}
</Section>;
```

Apply same pattern to `BorderSection` (show border style abbreviation), `EffectsSection` (show shadow count), `AnimationSection` (show animation name).

#### CSS additions (in `design-tokens.css` or inline)

No new tokens required — reuses existing `var(--aqb-text-tertiary)`, `var(--aqb-border)`.

#### QA Checklist — S1

```
[ ] Background section collapsed + color set → shows color swatch in header
[ ] Background section collapsed + no color → shows no swatch
[ ] Border section collapsed + border set → shows border style string "1px solid #fff"
[ ] EffectsSection collapsed + shadow set → shows "1 shadow" / "2 shadows"
[ ] AnimationSection collapsed + animation set → shows animation name
[ ] Swatch is aria-hidden="true" on the preview span
[ ] Section toggle button aria-label = "Background section, collapsed"
[ ] ChevronDown replaces ▼ text char in all sections
[ ] No TypeScript errors: npx tsc --noEmit
```

---

### Sprint S2 — Clickable Sub-Navigation Breadcrumb

**Fixes:** H-02
**Files:** `ProInspector.tsx`, each section component (add `id` anchor)

#### Strategy

Each section component's root `<div>` (the `baseStyles.section` div inside `Section.tsx`) gets an `id` derived from its title: `inspector-section-{name}`. The sub-nav buttons call `document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })` on the shared `contentRef`.

#### `ProInspector.tsx` — replace decorative nav strip

```tsx
// Replace the current decorative div at lines 374–381 with:

const LAYOUT_SECTIONS = [
  { label: "Display", id: "inspector-section-display" },
  { label: "Size", id: "inspector-section-size" },
  { label: "Spacing", id: "inspector-section-spacing" },
  { label: "Position", id: "inspector-section-position" },
  { label: "Flexbox", id: "inspector-section-flexbox" },
  { label: "Grid", id: "inspector-section-grid" },
  { label: "Visibility", id: "inspector-section-visibility" },
] as const;

const DESIGN_SECTIONS = [
  { label: "Typography", id: "inspector-section-typography" },
  { label: "Background", id: "inspector-section-background" },
  { label: "Border", id: "inspector-section-border" },
  { label: "Effects", id: "inspector-section-effects" },
  { label: "Animation", id: "inspector-section-animation" },
  { label: "Interactions", id: "inspector-section-interactions" },
] as const;

const SETTINGS_SECTIONS = [
  { label: "Properties", id: "inspector-section-element-properties" },
  { label: "Link", id: "inspector-section-link" },
  { label: "Classes", id: "inspector-section-css-classes" },
] as const;

const activeSections =
  activeTab === "layout"
    ? LAYOUT_SECTIONS
    : activeTab === "design"
      ? DESIGN_SECTIONS
      : SETTINGS_SECTIONS;

const scrollToSection = (sectionId: string) => {
  const el = contentRef.current?.querySelector(`#${sectionId}`);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
};

// JSX:
<nav
  aria-label={`${activeTab} sections`}
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    padding: "6px 12px",
    borderBottom: "1px solid var(--aqb-border-subtle)",
    background: "var(--aqb-surface-2)",
  }}
>
  {activeSections.map((section, i) => (
    <React.Fragment key={section.id}>
      <button
        onClick={() => scrollToSection(section.id)}
        title={`Jump to ${section.label} section`}
        aria-label={`Jump to ${section.label} section`}
        style={{
          background: "transparent",
          border: "none",
          padding: "2px 4px",
          fontSize: 10,
          color: "var(--aqb-text-tertiary)",
          cursor: "pointer",
          borderRadius: 3,
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLButtonElement).style.color = "var(--aqb-text-primary)";
          (e.target as HTMLButtonElement).style.background = "var(--aqb-surface-3)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLButtonElement).style.color = "var(--aqb-text-tertiary)";
          (e.target as HTMLButtonElement).style.background = "transparent";
        }}
      >
        {section.label}
      </button>
      {i < activeSections.length - 1 && (
        <span
          aria-hidden="true"
          style={{ color: "var(--aqb-border)", fontSize: 10, lineHeight: "20px" }}
        >
          •
        </span>
      )}
    </React.Fragment>
  ))}
</nav>;
```

#### Section anchor IDs

Each section component passes its `id` to the wrapper. In `Section.tsx` add an `id` prop:

```tsx
export interface SectionProps {
  // ...existing
  id?: string; // anchor id for sub-nav jump
}

// In render:
<div style={baseStyles.section} id={id}>
```

Each section passes its canonical id: `<Section id="inspector-section-background" title="Background" ...>`.

#### QA Checklist — S2

```
[ ] Clicking "Background" in sub-nav scrolls content to Background section
[ ] Clicking "Flexbox" when display is not flex → scrolls to hidden section area (section may be absent — button still scrolls to nearest anchor)
[ ] All sub-nav buttons keyboard focusable (Tab key)
[ ] Enter key on sub-nav button triggers scroll
[ ] Sub-nav reflects active tab (Layout shows Display/Size/…, Design shows Typography/Background/…)
[ ] aria-label on nav: "layout sections" / "design sections" / "settings sections"
[ ] No layout overflow at panel width 260px
```

---

### Sprint S3 — Hover State Dot Indicator

**Fixes:** H-03
**Files:** `styles/index.tsx` (extract to `components/PseudoStateSelector.tsx`), `ProInspector.tsx`

#### New component: `components/PseudoStateSelector.tsx`

```tsx
import * as React from "react";
import type { PseudoStateId } from "../../../shared/types";

export interface PseudoStateSelectorProps {
  currentPseudoState: PseudoStateId;
  onChange: (state: PseudoStateId) => void;
  /** Set of pseudo-states that have at least one overridden property */
  statesWithOverrides?: Set<PseudoStateId>;
}

const STATE_META: Record<
  PseudoStateId,
  { label: string; tooltip: string; color: string; rawColor: string }
> = {
  normal: {
    label: "Default",
    tooltip: "Default state — base styles",
    color: "var(--aqb-text-tertiary)",
    rawColor: "#6c7086",
  },
  hover: {
    label: ":hover",
    tooltip: "Mouse over state — styles when user hovers",
    color: "var(--aqb-accent-purple)",
    rawColor: "#a855f7",
  },
  focus: {
    label: ":focus",
    tooltip: "Keyboard focus state — styles when element is focused",
    color: "var(--aqb-info)",
    rawColor: "#3b82f6",
  },
  active: {
    label: ":active",
    tooltip: "Click state — styles while mouse button is held",
    color: "var(--aqb-success)",
    rawColor: "#22c55e",
  },
  disabled: {
    label: ":disabled",
    tooltip: "Disabled state — styles when interaction is blocked",
    color: "var(--aqb-text-muted)",
    rawColor: "#6b7280",
  },
};

export const PseudoStateSelector: React.FC<PseudoStateSelectorProps> = ({
  currentPseudoState,
  onChange,
  statesWithOverrides = new Set(),
}) => {
  const states = Object.keys(STATE_META) as PseudoStateId[];

  return (
    <div
      role="group"
      aria-label="Element state selector"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "var(--aqb-space-2) var(--aqb-space-3)",
        marginTop: 8,
        background: "rgba(0,0,0,0.2)",
        borderRadius: 6,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "var(--aqb-text-tertiary)",
          marginRight: 4,
          flexShrink: 0,
        }}
      >
        State:
      </span>
      {states.map((state) => {
        const meta = STATE_META[state];
        const isActive = currentPseudoState === state;
        const hasOverride = statesWithOverrides.has(state) && state !== "normal";

        return (
          <button
            key={state}
            onClick={() => onChange(state)}
            aria-label={`${meta.tooltip}${hasOverride ? " — has custom styles" : ""}`}
            aria-pressed={isActive}
            title={meta.tooltip}
            style={{
              flex: 1,
              position: "relative",
              padding: "6px 8px",
              background: isActive ? `${meta.rawColor}20` : "transparent",
              border: isActive ? `1px solid ${meta.rawColor}50` : "1px solid transparent",
              borderRadius: 6,
              color: isActive ? meta.color : "var(--aqb-text-tertiary)",
              fontSize: "var(--aqb-text-xs)",
              fontWeight: 600,
              cursor: "pointer",
              transition: "var(--aqb-transition-fast)",
              textAlign: "center",
            }}
          >
            {meta.label}
            {hasOverride && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: meta.rawColor,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
```

#### `ProInspector.tsx` — wire statesWithOverrides

```tsx
// After overriddenProperties set is built (around line 120):
const statesWithOverrides = React.useMemo<Set<PseudoStateId>>(() => {
  if (!selectedElement || !composer) return new Set();
  const pseudoStates: PseudoStateId[] = ["hover", "focus", "active", "disabled"];
  const result = new Set<PseudoStateId>();
  pseudoStates.forEach((state) => {
    const el = composer.elements.getElement(selectedElement.id);
    const stateStyles = el?.getStylesForState?.(state) ?? {};
    if (Object.keys(stateStyles).length > 0) result.add(state);
  });
  return result;
}, [selectedElement, composer, styles_state]);

// Replace renderPseudoStateSelector(currentPseudoState, setCurrentPseudoState) with:
<PseudoStateSelector
  currentPseudoState={currentPseudoState}
  onChange={setCurrentPseudoState}
  statesWithOverrides={statesWithOverrides}
/>;
```

Remove the `renderPseudoStateSelector` import and usage. Remove the function from `styles/index.tsx`.

#### QA Checklist — S3

```
[ ] Default state button shows no dot when no pseudo-state overrides exist
[ ] Switch to :hover → set a background color → switch back to Default → dot appears on :hover button
[ ] Dot color matches pseudo-state accent color (purple for hover, blue for focus)
[ ] Dot has aria-hidden="true"
[ ] State buttons have aria-label including plain-English tooltip
[ ] aria-label changes to include "has custom styles" when dot is shown
[ ] Screen reader announces: "Hover state, not pressed — Mouse over state — has custom styles"
```

---

### Sprint S4 — Delete Confirmation Copy Fix

**Fixes:** C-03
**File:** `ProInspector.tsx:257–259` (and future `DeleteConfirmation.tsx`)

```tsx
// Change the paragraph from:
<p style={{ ... }}>
  Are you sure you want to delete <strong>{elementLabel}</strong>? This action cannot be
  undone.
</p>

// To:
<p style={{ ... }}>
  Delete <strong>{elementLabel}</strong>? You can restore it with{" "}
  <kbd
    style={{
      padding: "1px 5px",
      background: "var(--aqb-surface-4)",
      border: "1px solid var(--aqb-border)",
      borderRadius: 3,
      fontSize: "var(--aqb-text-xs)",
      fontFamily: "var(--aqb-font-mono)",
    }}
  >
    Ctrl+Z
  </kbd>
  {" "}after deleting.
</p>
```

Also add `role="alertdialog"` and `aria-describedby` to the Modal wrapper for proper focus management:

```tsx
<Modal
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  title="Delete Element?"
  size="sm"
  role="alertdialog"
  aria-describedby="delete-confirm-description"
>
  <div style={{ padding: "var(--aqb-space-4)" }}>
    <p id="delete-confirm-description" style={{ ... }}>
      Delete <strong>{elementLabel}</strong>? ...
    </p>
    ...
  </div>
</Modal>
```

#### QA Checklist — S4

```
[ ] Delete confirmation reads: "Delete [name]? You can restore it with Ctrl+Z after deleting."
[ ] Ctrl+Z key rendered as <kbd> element
[ ] "This action cannot be undone" — removed from all delete confirmation copy
[ ] Modal has role="alertdialog"
[ ] Cancel button: keyboard reachable, Escape triggers Cancel
[ ] After Delete → press Ctrl+Z → element restored
```

---

### Sprint S5 — ARIA Tab Roles + Section Button Labels

**Fixes:** C-01, C-02, H-01
**Files:** `ProInspector.tsx` (tabs), `shared/controls/Section.tsx` (covered in S1)

#### `ProInspector.tsx` — correct tab ARIA semantics

```tsx
{
  /* Replace the tabs <div> + button pattern with proper tablist */
}
<div role="tablist" aria-label="Inspector sections" style={panelStyles.tabs}>
  {(["layout", "design", "settings"] as const).map((tab) => {
    const labels = {
      layout: "Layout & Size",
      design: "Style",
      settings: "Advanced",
    };
    const count = activeTabSectionCounts[tab]; // from Sprint S7
    return (
      <button
        key={tab}
        role="tab"
        id={`inspector-tab-${tab}`}
        aria-selected={activeTab === tab}
        aria-controls={`inspector-tabpanel-${tab}`}
        tabIndex={activeTab === tab ? 0 : -1}
        style={panelStyles.tab(activeTab === tab)}
        onClick={() => setActiveTab(tab)}
      >
        <span>{labels[tab]}</span>
        <span
          aria-label={`${count} sections`}
          style={
            {
              /* ...badge styles */
            }
          }
        >
          {count}
        </span>
      </button>
    );
  })}
</div>;

{
  /* Content area — add tabpanel role */
}
<div
  ref={contentRef}
  role="tabpanel"
  id={`inspector-tabpanel-${activeTab}`}
  aria-labelledby={`inspector-tab-${activeTab}`}
  style={panelStyles.content}
>
  {/* ...existing tab content */}
</div>;
```

Add keyboard arrow key navigation for tablist:

```tsx
const handleTabKeyDown = React.useCallback(
  (e: React.KeyboardEvent, currentTab: TabName) => {
    const tabs: TabName[] = ["layout", "design", "settings"];
    const currentIndex = tabs.indexOf(currentTab);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex + 1) % tabs.length]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length]);
    }
  },
  [setActiveTab]
);
```

#### QA Checklist — S5

```
[ ] Each tab button has role="tab" and aria-selected
[ ] Tab container has role="tablist" and aria-label="Inspector sections"
[ ] Content area has role="tabpanel" with aria-labelledby pointing to active tab
[ ] Keyboard: Tab to focus tablist, ArrowRight/ArrowLeft to switch tabs
[ ] Screen reader announces: "Layout & Size tab, selected, 1 of 3"
[ ] Section toggle buttons have aria-label="Background section, collapsed" (from S1)
[ ] State selector buttons have aria-label with plain-English tooltip (from S3)
```

---

### Sprint S6 — Extract Render Helpers to Components

**Fixes:** ARCH-01
**Files:** `styles/index.tsx`, `ProInspector.tsx`, new `components/BreakpointIndicator.tsx`

The `PseudoStateSelector` component was already created in S3. This sprint extracts `renderBreakpointIndicator`.

#### New: `components/BreakpointIndicator.tsx`

```tsx
import { Monitor, Tablet, Smartphone } from "lucide-react";
import * as React from "react";
import { BREAKPOINTS } from "../../../shared/constants/breakpoints";
import type { BreakpointId } from "../../../shared/types/breakpoints";

export interface BreakpointIndicatorProps {
  currentBreakpoint: BreakpointId;
}

const BREAKPOINT_META: Partial<
  Record<BreakpointId, { Icon: typeof Monitor; color: string; label: string }>
> = {
  tablet: {
    Icon: Tablet,
    color: "#f59e0b",
    label: "Tablet",
  },
  mobile: {
    Icon: Smartphone,
    color: "#ec4899",
    label: "Mobile",
  },
};

export const BreakpointIndicator: React.FC<BreakpointIndicatorProps> = ({ currentBreakpoint }) => {
  if (currentBreakpoint === "desktop") return null;

  const meta = BREAKPOINT_META[currentBreakpoint];
  if (!meta) return null;

  const { Icon, color, label } = meta;
  const maxWidth = BREAKPOINTS[currentBreakpoint].maxWidth;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Editing ${label} styles — changes apply only below ${maxWidth}px`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        marginTop: 12,
        borderRadius: 6,
        fontSize: "var(--aqb-text-sm)",
        fontWeight: 600,
        background: `${color}26`,
        border: `1px solid ${color}4d`,
        color,
        transition: "var(--aqb-transition-fast)",
      }}
    >
      <Icon size={14} aria-hidden="true" />
      <span>
        Editing styles for <strong>{BREAKPOINTS[currentBreakpoint].name}</strong>
      </span>
      <span style={{ marginLeft: "auto", fontSize: 9, opacity: 0.8 }}>&le;{maxWidth}px</span>
    </div>
  );
};
```

#### `styles/index.tsx` — remove render functions

Delete `renderPseudoStateSelector` and `renderBreakpointIndicator` functions entirely.
Keep only: `INSPECTOR_SPACING`, `INSPECTOR_TYPOGRAPHY`, `panelStyles`.

#### `ProInspector.tsx` — update imports

```tsx
// Remove:
import { panelStyles, renderPseudoStateSelector, renderBreakpointIndicator } from "./styles";

// Add:
import { panelStyles } from "./styles";
import { BreakpointIndicator } from "./components/BreakpointIndicator";
// PseudoStateSelector already imported in S3

// Replace render calls:
// renderBreakpointIndicator(currentBreakpoint) → <BreakpointIndicator currentBreakpoint={currentBreakpoint} />
// renderPseudoStateSelector(...) → <PseudoStateSelector ... /> (S3)
```

#### QA Checklist — S6

```
[ ] grep -n "renderPseudoStateSelector\|renderBreakpointIndicator" src/editor/inspector/styles/index.tsx → 0 results
[ ] grep -n "renderPseudoStateSelector\|renderBreakpointIndicator" src/editor/inspector/ -r → 0 results
[ ] BreakpointIndicator renders Tablet icon on tablet breakpoint, Smartphone on mobile
[ ] No emoji in BreakpointIndicator output
[ ] role="status" aria-live="polite" on BreakpointIndicator
[ ] Desktop breakpoint → BreakpointIndicator renders null
[ ] npx tsc --noEmit → 0 errors
```

---

### Sprint S7 — Fix Hardcoded Badge Counts

**Fixes:** H-04, ARCH-04
**Files:** `ProInspector.tsx`, `hooks/useInspectorSections.ts`

The simplest correct fix is to remove the badge entirely (badges that always say "6" add no signal). If the product decides to keep badges, they should reflect populated section count.

#### Option A (Recommended) — Remove badges

```tsx
// In ProInspector.tsx, remove the badge <span> from each tab button:
<button role="tab" ...>
  <span>{labels[tab]}</span>
  {/* badge span deleted */}
</button>
```

#### Option B — Dynamic count from useInspectorSections

If badges are kept, expose section count per tab from `useInspectorSections`:

```tsx
// hooks/useInspectorSections.ts — add export:
export function useTabSectionCounts(
  selectedElement: SelectedElement | null,
  composer: Composer | null | undefined,
  devMode: boolean
): Record<TabName, number> {
  return React.useMemo(() => {
    // Count visible sections per tab based on cssContext + element type
    // Layout: always 5 base + conditional (flex, grid)
    // Design: always 5 + typography if text element
    // Settings: always 2 + link if linkable + form if form element
    return {
      layout: 5,
      design:
        selectedElement && ["heading", "text", "p", "h1", "h2", "h3"].includes(selectedElement.type)
          ? 6
          : 5,
      settings: 2,
    };
  }, [selectedElement, devMode]);
}
```

#### QA Checklist — S7

```
[ ] (Option A) No badge visible on any tab
[ ] (Option B) Badge count reflects actual visible sections for selected element type
[ ] Container selected → Layout tab shows 5 (no Flex, no Grid)
[ ] Flex container → Layout tab shows 6 (includes Flexbox section)
[ ] No hardcoded "6" strings remain in ProInspector.tsx
```

---

### Sprint S8 — Element ID Click-to-Copy

**Fixes:** H-05
**Files:** `ProInspector.tsx` header section

```tsx
// Replace the elementId div (around line 221):
const [idCopied, setIdCopied] = React.useState(false);

const handleCopyId = React.useCallback(() => {
  const fullId = `#${selectedElement.id.slice(-8)}`;
  navigator.clipboard.writeText(fullId).then(() => {
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 1500);
  });
}, [selectedElement?.id]);

// JSX:
<button
  onClick={handleCopyId}
  title={idCopied ? "Copied!" : "Click to copy element ID"}
  aria-label={idCopied ? "Element ID copied to clipboard" : "Copy element ID to clipboard"}
  style={{
    background: "transparent",
    border: "none",
    padding: "2px 4px",
    cursor: "pointer",
    borderRadius: 3,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    fontSize: "var(--aqb-text-sm)",
    color: idCopied ? "var(--aqb-success)" : "var(--aqb-text-tertiary)",
    fontFamily: "var(--aqb-font-mono)",
    transition: "color 0.2s",
  }}
>
  #{selectedElement.id.slice(-8)}
  {selectedElement.tagName && (
    <span style={panelStyles.tagBadge}>&lt;{selectedElement.tagName.toLowerCase()}&gt;</span>
  )}
  {idCopied && (
    <span
      style={{
        fontSize: 9,
        fontFamily: "var(--aqb-font-family)",
        color: "var(--aqb-success)",
      }}
    >
      Copied!
    </span>
  )}
</button>;
```

#### QA Checklist — S8

```
[ ] Click element ID → clipboard contains "#" + last 8 chars of element ID
[ ] "Copied!" text appears for 1.5s then disappears
[ ] aria-label switches between copy prompt and confirmation
[ ] Button is keyboard focusable (Tab) and Enter/Space triggers copy
[ ] No border, background on button — looks like a tag
```

---

### Sprint S9 — CSS Classes SSOT Fix

**Fixes:** ARCH-05, H-06, H-07, L-05
**Files:** `sections/CSSClassesSection.tsx`

```tsx
import * as React from "react";
import type { Composer } from "../../../engine";
import { runTransaction } from "../../../shared/utils/helpers";
import { Section } from "../shared/Controls";

interface CSSClassesSectionProps {
  selectedElement: { id: string; type: string };
  composer?: Composer | null;
}

export const CSSClassesSection: React.FC<CSSClassesSectionProps> = ({
  selectedElement,
  composer,
}) => {
  const [newClass, setNewClass] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // SSOT: read directly from composer — no local cache
  const classes = React.useMemo<string[]>(() => {
    if (!selectedElement?.id || !composer) return [];
    return composer.elements.getElement(selectedElement.id)?.getClasses?.() ?? [];
  }, [selectedElement, composer]);

  // Project global classes for autocomplete
  const projectClasses = React.useMemo<string[]>(() => {
    return composer?.styles?.getGlobalClasses?.() ?? [];
  }, [composer]);

  const filteredSuggestions = React.useMemo(
    () =>
      newClass.trim().length > 0
        ? projectClasses.filter((c) => c.includes(newClass) && !classes.includes(c))
        : [],
    [newClass, projectClasses, classes]
  );

  const addClass = (className: string) => {
    const trimmed = className.trim();
    if (!trimmed || !composer || classes.includes(trimmed)) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;
    runTransaction(composer, "add-css-class", () => {
      el.addClass?.(trimmed);
    });
    setNewClass("");
    setShowSuggestions(false);
  };

  const removeClass = (className: string) => {
    if (!composer) return;
    const el = composer.elements.getElement(selectedElement.id);
    if (!el) return;
    runTransaction(composer, "remove-css-class", () => {
      el.removeClass?.(className);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addClass(newClass);
    } else if (e.key === "Tab") {
      // Do not submit; allow normal focus movement
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setNewClass("");
      setShowSuggestions(false);
    }
  };

  return (
    <Section title="CSS Classes" icon="Code2" id="inspector-section-css-classes">
      {/* Applied classes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {classes.length === 0 && (
          <span
            style={{
              fontSize: "var(--aqb-text-xs)",
              color: "var(--aqb-text-muted)",
              fontStyle: "italic",
            }}
          >
            No classes applied yet
          </span>
        )}
        {classes.map((cls) => (
          <span
            key={cls}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              background: "var(--aqb-surface-4)",
              border: "1px solid var(--aqb-border)",
              borderRadius: 4,
              fontSize: "var(--aqb-text-xs)",
              fontFamily: "var(--aqb-font-mono)",
              color: "var(--aqb-text-primary)",
            }}
          >
            .{cls}
            <button
              onClick={() => removeClass(cls)}
              aria-label={`Remove class ${cls}`}
              title={`Remove .${cls}`}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--aqb-text-tertiary)",
                lineHeight: 1,
                fontSize: 10,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Add class input */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            value={newClass}
            onChange={(e) => {
              setNewClass(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Add class name…"
            aria-label="Add CSS class"
            style={{
              flex: 1,
              padding: "6px 8px",
              background: "var(--aqb-surface-3)",
              border: "1px solid var(--aqb-border)",
              borderRadius: "var(--aqb-radius-sm)",
              color: "var(--aqb-text-primary)",
              fontSize: "var(--aqb-text-sm)",
              fontFamily: "var(--aqb-font-mono)",
            }}
          />
          <button
            onClick={() => addClass(newClass)}
            disabled={!newClass.trim()}
            aria-label="Add class"
            style={{
              padding: "6px 10px",
              background: "var(--aqb-primary-light)",
              border: "1px solid var(--aqb-primary-border)",
              borderRadius: "var(--aqb-radius-sm)",
              color: "var(--aqb-primary)",
              fontSize: "var(--aqb-text-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>

        {/* Autocomplete from project classes */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            role="listbox"
            aria-label="Class suggestions"
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 36,
              background: "var(--aqb-surface-4)",
              border: "1px solid var(--aqb-border)",
              borderRadius: "var(--aqb-radius-sm)",
              padding: 4,
              margin: 0,
              listStyle: "none",
              zIndex: 20,
              maxHeight: 120,
              overflowY: "auto",
            }}
          >
            {filteredSuggestions.map((cls) => (
              <li key={cls}>
                <button
                  role="option"
                  aria-selected={false}
                  onClick={() => addClass(cls)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "4px 8px",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "var(--aqb-text-xs)",
                    fontFamily: "var(--aqb-font-mono)",
                    color: "var(--aqb-text-secondary)",
                    borderRadius: 3,
                  }}
                >
                  .{cls}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
};
```

#### QA Checklist — S9

```
[ ] No useState for classes list — classes read from useMemo via composer
[ ] Adding class from another panel → CSSClassesSection shows new class immediately
[ ] "No classes applied yet" shown when class list is empty
[ ] Duplicate class → not added (classes.includes check)
[ ] × on a class tag removes it
[ ] Add button disabled when input is empty
[ ] Tab in input does not add class; moves focus forward
[ ] Enter in input adds class; input clears
[ ] Escape in input clears input; hides suggestions
[ ] Autocomplete shows only project classes, not Tailwind list
[ ] Autocomplete empty → no dropdown shown
[ ] No hardcoded COMMON_CLASSES object remains in file
[ ] grep "COMMON_CLASSES" src/editor/inspector/sections/CSSClassesSection.tsx → 0 results
```

---

### Sprint S10 — Emoji Icons → SVG, Remaining Copy, Hardcoded Colors

**Fixes:** M-01, M-02, M-03, M-09, M-10
**Files:** `ProInspector.tsx`, `styles/index.tsx`

#### Delete button — replace emoji with SVG

```tsx
// ProInspector.tsx — delete button JSX:
import { Trash2 } from "lucide-react";

<button
  style={panelStyles.deleteBtn}
  onClick={() => setShowDeleteConfirm(true)}
  title="Delete element"
  aria-label="Delete selected element"
>
  <Trash2 size={14} aria-hidden="true" />
</button>;
```

#### `styles/index.tsx` — fix hardcoded colors

```tsx
// deleteBtn — replace raw hex with CSS vars:
deleteBtn: {
  position: "absolute" as const,
  top: 16,
  right: 16,
  width: 32,
  height: 32,
  borderRadius: 6,
  background: "var(--aqb-error-light)",
  border: "1px solid var(--aqb-error-border, rgba(239,68,68,0.3))",
  color: "var(--aqb-error)",
  cursor: "pointer" as const,
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  fontSize: 14,
  transition: "var(--aqb-transition-fast)",
},

// State label — replace hardcoded hex with CSS var:
// In PseudoStateSelector (S3): already uses var(--aqb-text-tertiary)
// Remove remaining instances of "#6c7086" in styles/index.tsx
```

#### `styles/index.tsx` — remove deprecated render functions

After S3 and S6, `renderPseudoStateSelector` and `renderBreakpointIndicator` are already removed. Verify:

```bash
grep -n "renderPseudoStateSelector\|renderBreakpointIndicator" \
  src/editor/inspector/styles/index.tsx
# Expected: 0 results
```

#### QA Checklist — S10

```
[ ] Delete button shows Trash2 SVG icon, no emoji
[ ] grep "🗑️\|📱\|📲" src/editor/inspector/ -r → 0 results
[ ] grep "#6c7086" src/editor/inspector/ -r → 0 results (replaced with CSS var)
[ ] panelStyles.deleteBtn uses only CSS variable references
[ ] BreakpointIndicator uses Tablet/Smartphone SVG icons (from S6)
[ ] npx tsc --noEmit → 0 errors
[ ] npm run test → all existing tests pass
```

---

## Part 7 — Complete QA Checklist

### Architecture Verification

```bash
# Render helpers not in styles file
grep -n "React.ReactElement\|React.FC\|function render" \
  src/editor/inspector/styles/index.tsx
# Expected: 0 results

# Section components don't call composer directly
grep -rn "composer\." src/editor/inspector/sections/
# Expected: 0 results (composer calls must be in handlers.ts or hooks only)

# No duplicate routing maps
grep -n "ELEMENT_TO_TAB_MAP\|ELEMENT_TO_SECTION_MAP" \
  src/editor/inspector/hooks/useInspectorState.ts
# Expected: 0 results (deleted in ARCH-02)

# No hardcoded section counts
grep -n "sectionCounts" src/editor/inspector/ProInspector.tsx
# Expected: 0 results

# No local class state in CSSClassesSection
grep -n "useState.*classes\|setClasses" \
  src/editor/inspector/sections/CSSClassesSection.tsx
# Expected: 0 results

# No emoji in output
grep -rn "🗑️\|📱\|📲" src/editor/inspector/
# Expected: 0 results
```

### Empty State

```
[ ] Nothing selected → "Nothing Selected" heading + description + CTA buttons
[ ] "+ Open Build Panel" CTA fires onOpenBuildPanel callback
[ ] "Browse Templates" fires onBrowseTemplates callback
[ ] Tip strip: "Press A to open Build panel · Esc to deselect"
[ ] role="status" aria-live="polite" on empty state container
[ ] aria-label="No element selected" on container
[ ] Post-template-apply state shows "Template applied!" banner when within 30 min
```

### Panel Header

```
[ ] Element name shows element type label (e.g., "Container", "Heading")
[ ] Element ID shows last 8 chars of element.id in monospace
[ ] Clicking element ID copies "#" + ID to clipboard
[ ] "Copied!" label appears for 1.5s after copy
[ ] Tag badge shows <tagName> (e.g., <div>, <section>)
[ ] Trash2 SVG icon visible (not emoji) for delete button
[ ] Trash button tooltip: "Delete element"
[ ] Header is sticky (position: sticky, top: 0, zIndex: 10)
[ ] ElementBreadcrumb renders ancestor chain for deeply nested elements
[ ] "Show in Layers" button emits SHOW_IN_LAYERS event
```

### Delete Confirmation

```
[ ] Trash icon click → Modal opens (panel content visible behind modal)
[ ] Copy: "Delete [name]? You can restore it with Ctrl+Z after deleting."
[ ] "This action cannot be undone" — absent from all copy
[ ] Cancel → Modal closes; element still selected; panel unchanged
[ ] Delete → element removed; Modal closes; panel shows empty state
[ ] Ctrl+Z after delete → element restored
[ ] Modal has role="alertdialog" + aria-describedby
[ ] Focus trapped: Tab cycles Cancel → Delete → Cancel
[ ] Escape key fires Cancel
```

### State Selector

```
[ ] Five states: Default · :hover · :focus · :active · :disabled
[ ] Active state highlighted with accent color
[ ] Each button has aria-label with plain-English tooltip
[ ] Dot indicator appears on :hover button after :hover styles are set
[ ] Dot indicator color matches state accent color
[ ] Switching states does not reset section scroll position
[ ] Screen reader announces: "Hover state, not pressed — Mouse over state"
```

### Element Breadcrumb

```
[ ] Single root element → ElementBreadcrumb renders null
[ ] Nested element → shows ancestor chain: "body > section > div"
[ ] Clicking ancestor item selects that element
[ ] Current element (last item) has tabIndex={-1} and aria-current="location"
[ ] "Show in Layers" button emits correct event
[ ] Breadcrumb scrollable horizontally if chain is long
[ ] Keyboard: Tab to breadcrumb item, Enter to select
```

### Tab System

```
[ ] role="tablist" on tab container
[ ] role="tab" + aria-selected on each tab button
[ ] role="tabpanel" + aria-labelledby on content area
[ ] Arrow keys navigate between tabs
[ ] Active tab visually distinct (background + border)
[ ] Sub-nav items are clickable buttons (not plain text)
[ ] Clicking sub-nav item scrolls to that section
[ ] Sub-nav reflects active tab content
[ ] All sub-nav buttons keyboard accessible
[ ] Switching tabs restores scroll position per tab (H-08 fix)
```

### Layout & Size Sections

```
[ ] LayoutSection shows Display Mode options (Block, Flex, Grid, Inline, I-Block, None)
[ ] Display Mode buttons have tooltips
[ ] SizeSection shows Width + Height with Fixed/Fill/Hug modes
[ ] "Hug" tooltip: "Shrinks to fit content size"
[ ] "Fill" tooltip: "Expands to fill available space"
[ ] "Fixed" tooltip: "Set a specific size"
[ ] Flexbox section hidden when display is not flex
[ ] Flexbox section visible when display = flex
[ ] Grid section hidden when display is not grid
[ ] SpacingSection shows margin + padding controls
[ ] PositionSection shows position type controls
[ ] VisibilitySection available on all elements
[ ] NumericInputs accept keyboard, scroll wheel, drag-to-scrub (audit InputControls.tsx)
```

### Style Sections

```
[ ] All Style sections collapsed by default
[ ] BackgroundSection collapsed + color set → shows color swatch in header
[ ] BorderSection collapsed + border set → shows style string in header
[ ] EffectsSection collapsed + shadow set → shows shadow count in header
[ ] AnimationSection collapsed + animation set → shows name in header
[ ] No preview shown when section has no values set
[ ] BackgroundSection: color picker opens on swatch click
[ ] BorderSection: all-sides + individual side controls
[ ] EffectsSection: box shadow, opacity, filter controls
[ ] AnimationSection: entry type, duration, delay, easing
[ ] InteractionsSection: event → action mapping
```

### Advanced / Settings Tab

```
[ ] ElementPropertiesSection shows element-type-specific attributes
[ ] DataAttributeEditor: key field validates "must start with data-"
[ ] Duplicate key shows inline error
[ ] CSSClassesSection: no COMMON_CLASSES Tailwind list
[ ] CSSClassesSection: shows project global classes in autocomplete
[ ] Tab in class input does not submit — moves focus forward
[ ] Enter in class input adds class + clears input
[ ] Applied classes show with × remove button
[ ] Removing class: × click removes immediately (live from composer)
```

### Multi-Select

```
[ ] "N elements selected" badge at top
[ ] Selection hint visible above alignment controls: "Select one element to edit properties"
[ ] Align Horizontal: Left / Center / Right
[ ] Align Vertical: Top / Middle / Bottom
[ ] Distribute Horizontal + Vertical
[ ] Each alignment button has aria-label and tooltip
[ ] Distribute disabled when fewer than 3 elements selected
[ ] Tooltip on disabled distribute: "Select 3+ elements to distribute"
[ ] Escape → deselects all → panel shows empty state
```

### Breakpoint Indicators

```
[ ] Desktop breakpoint → no indicator shown
[ ] Tablet breakpoint → Tablet SVG icon + amber banner "Editing Tablet styles"
[ ] Mobile breakpoint → Smartphone SVG icon + pink banner "Editing Mobile styles"
[ ] role="status" aria-live="polite" on BreakpointIndicator
[ ] No emoji in breakpoint indicator
[ ] Max-width value shown in indicator
```

### Accessibility Final Check

```
[ ] Panel Tab order: Header → Breadcrumb → State Selector → Tabs → Sub-nav → Content sections
[ ] All icon-only buttons have aria-label
[ ] Color contrast ≥ 4.5:1 for all text
[ ] Focus visible outline on all interactive elements
[ ] No focus traps outside delete confirmation modal
[ ] Delete confirmation modal: role="alertdialog", focus trapped, Escape cancels
[ ] Search input: aria-label="Search sections"
[ ] InspectorControls collapse/expand buttons: aria-label
[ ] DevModeToggle: aria-pressed, aria-label
```

### Final CI Checks

```bash
npx tsc --noEmit
npm run test
grep -rn "console\." src/editor/inspector/
# Expected: 0 results

grep -rn ": any" src/editor/inspector/
# Expected: 0 results

grep -rn "🗑️\|📱\|📲" src/editor/inspector/
# Expected: 0 results

grep -rn "#6c7086" src/editor/inspector/
# Expected: 0 results

grep -rn "COMMON_CLASSES\|sectionCounts.*=.*{.*6\|ELEMENT_TO_TAB_MAP\|ELEMENT_TO_SECTION_MAP" src/editor/inspector/
# Expected: 0 results
```

---

## Appendix — Backlog (Post-Sprint)

| #     | Feature                                    | Rationale                                                                                  |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| BL-01 | Breakpoint override reset button per field | No current mechanism to reset Mobile override to inherit Desktop value (Workflow B step 6) |
| BL-02 | CSS class "View styles" link               | Navigate to Global Styles for a class from the Applied Classes list                        |
| BL-03 | Copy/paste styles between elements         | Right-click element on canvas → Copy Styles; right-click target → Paste Styles             |
| BL-04 | Inherited value indicator per field        | Muted text + tooltip "Inherited from [parent]"                                             |
| BL-05 | Locked element read-only state             | Inspector shows properties in read-only mode + "Unlock in Layers to edit" banner           |
| BL-06 | Component instance banner                  | "Editing this component affects all instances. Detach to edit independently."              |
| BL-07 | Search empty state                         | "No sections match '[query]'" when all sections filtered out                               |
| BL-08 | Per-field unit toggle                      | px / % / rem / auto toggle on all numeric inputs                                           |
