## Panel geometry, workspace composition and information density

### 1. Treat layout as a system of constraints

A new feature does not automatically require a wider panel, a taller application,
or a new tab. Determine the appropriate structure first, then size it for the tasks
and content it must support. Evaluate the entire workspace, not the edited panel alone.

Record the actual application viewport in CSS pixels, browser zoom, open panels,
rails, toolbars, gutters, authored page viewport and canvas zoom. A Figma frame size
is a design specification; it is not proof of the browser's usable viewport.

Discover existing sizing tokens and layout primitives. Label every dimension:
OBSERVED, APPROVED, PROPOSED or NOT MEASURED. A familiar value such as 320px is not
an approved Buildrick standard merely because it is common in other interfaces.

Define task-based minimum usable canvas space as an observed requirement or a
proposal to validate, not an invented industry constant. Consider the actual task:
selecting nested elements, dragging, comparing responsive output, and viewing feedback.

### 2. Calculate horizontal and vertical budgets

For each relevant simultaneous panel configuration, account for non-overlapping
reserved regions exactly once:

```text
available_canvas_width = app_viewport_width
                       - navigation_rail_width
                       - docked_left_regions_width
                       - docked_right_regions_width
                       - splitters_and_gutters_width

available_canvas_height = app_viewport_height
                        - top_chrome_height
                        - bottom_chrome_height
                        - docked_bottom_regions_height
                        - vertical_gutters_height

panel_body_height = actual_panel_height
                  - panel_header_height
                  - persistent_context_height
                  - tab_bar_height
                  - fixed_action_area_height
                  - applicable_vertical_padding
```

Adapt the terms to the real layout; omit absent regions and avoid double-counting
nested containers. An overlay does not reserve width in this formula but can still
obscure the selected object, a control or a workflow. Record its obstruction and focus
cost separately. Calculate based on the actual panel rectangle, not the browser
height when a panel starts below a toolbar or ends above a bottom dock.

When the layout must satisfy a minimum usable canvas width:

```text
maximum_right_panel_width = app_viewport_width
                          - other_reserved_widths
                          - required_usable_canvas_width
```

A feasible panel width must satisfy both control-content needs and the workspace
budget. If minimum_content_width exceeds maximum_feasible_width, no valid width
exists for that configuration. Change composition or interaction instead of choosing
an arbitrary midpoint and clipping content.

### 3. Derive width from actual content

Inspect the widest essential control row, including label, input, unit, source marker,
reset/menu actions, spacing and padding. Test long values, mixed values, localization
where supported, validation text and focus rings. Do not size only from placeholder text.

Before widening the panel, evaluate grouping, stacked labels, appropriate wrapping,
a dedicated detail view, a compact summary plus editor, or removal of duplicate controls.
Use abbreviated labels only when understandable and accessible, not to disguise bad fit.
Do not force unrelated controls onto one row merely to reduce vertical height.

For every affected panel specify minimum/default/maximum width, units, resize bounds,
and whether those values are existing or proposed. Define what is fixed, flexible,
hugged or wrapped in the design and implementation. Explain the user benefit of a
width change and the canvas cost at the smallest relevant application viewport.

A resizable panel still needs a sensible default and safe minimum; resizability is
not an excuse for a broken default. Decide whether width is a local session preference
or persisted user preference; do not silently write it into authored project content.

### 4. Derive height and scrolling from the task

Distinguish panel outer height from content length. A docked inspector usually needs
a viewport-constrained height strategy; adding controls does not justify extending
the entire application beyond the viewport or hiding its bottom actions.

Specify which header/context/actions remain visible and which body scrolls. Sticky
regions must leave useful body space at short heights. In very short layouts, reduce
unnecessary pinned content or change composition rather than covering every control.

Prefer one clear primary vertical scroll owner for a panel. Independent scrolling
can be valid for a resource list, a timeline or another bounded task; document the
reason, bounds, focus behavior and escape to surrounding content. Do not accumulate
nested vertical scrollbars as a generic solution to feature growth.

Keep critical actions reachable with errors, expanded sections and long content.
Do not place a Save button below an inaccessible clipped region. Add scrolling room
so sticky headers/footers do not obscure keyboard-focused controls [S4, S5].

For variable content define minimum/maximum height, empty/loading behavior, list
virtualization where justified by real scale, and which actions remain visible.
Do not invent a need for virtualization without identifying expected data scale.

### 5. Distinguish the editor workspace from the designed website

Treat these as separate systems:

- Browser/application viewport: space available for the editor interface.
- Editor panel dimensions: tools surrounding or covering the work area.
- Authored page viewport/breakpoint: width and state used to lay out the website.
- Canvas zoom: visual magnification of that page in the editor.
- Browser zoom/text enlargement: accessibility and interface scaling conditions.

Opening or resizing a panel must not silently switch the authored page breakpoint,
rewrite element widths, or change saved responsive values. A fit-to-view operation
may change canvas magnification only when that behavior is intended and communicated.
Do not confuse zooming the page view with resizing the page's layout viewport.

Preserve selection and reasonable canvas position during composition changes. Check
whether the selected object becomes hidden under an overlay and provide a considered
reveal/reposition behavior without a disorienting automatic jump.

### 6. Define narrow-workspace fallback

Discover approved device/browser support and the actual minimum supported workspace.
If unavailable, propose a test range and label it unapproved; do not declare arbitrary
screens unsupported or invent mobile editing support to avoid layout decisions.

Specify the order of adaptation for the affected workspace: flexible content reflow,
condensed secondary chrome, reversible panel collapse, contextual overlay, subview,
or focused workspace mode as appropriate. There is no universal collapse order:
keep the tools needed for the current task together.

Automatic changes must be predictable, reversible, and preserve draft input, selection,
scroll and return context when appropriate. Restore sensible sizes after widening the
browser; do not repeatedly oscillate panels open/closed near a threshold. Define the
threshold from layout feasibility and existing responsive conventions.

Check both long/narrow and wide/short windows. A width-only responsive mockup does
not prove that bottom actions remain usable in a short browser window.

### 7. Density and clutter review

Identify the actual source of clutter: too many simultaneously visible controls,
unclear grouping, duplicated actions, ambiguous scope, high switching cost, excess
visual emphasis, or excessive navigation depth. Different causes need different fixes.

Keep the primary task and active context obvious. Use existing density/spacing tokens
where viable; do not reduce type or hit areas solely to fit one more row. Use disclosure
for secondary complexity while exposing summaries of active, modified or invalid values.
A collapsed Effects section with active effects must not imply "no effects".

Control counts, clicks, scroll depth and panel switches can be recorded as observations,
not universal success metrics. One extra step may be justified by safer scope handling;
fewer clicks do not justify silent shared changes. Reject a design that merely shifts
clutter into a different panel, a chain of popovers, or an unexplained "Advanced" bucket.

Check repeated rows, long lists, duplicate names, empty groups and error messages.
Search and filtering may help a real resource collection; they are not substitutes
for grouping a small set of unrelated controls correctly.

### 8. Resizing, overlays and accessibility

Provide a discoverable resize boundary, appropriate cursor, bounds, collapse/restore
behavior and keyboard operation where panels resize. Avoid accidental canvas drags
when the user grabs a splitter. The WAI-ARIA splitter pattern is an informative
reference, not a completed implementation or a conformance certificate [S8].

Where dragging is used, evaluate a single-pointer alternative without dragging as
well as keyboard access; keyboard access alone does not settle WCAG 2.5.7 [S7].
For targets, evaluate WCAG 2.5.8's 24-by-24 CSS-pixel minimum or applicable exceptions;
do not mislabel 44px as the universal WCAG AA minimum [S6].

Specify overlay anchor, stacking order, maximum dimensions, clipping/flip behavior,
background interaction, focus behavior, Escape handling, outside-click behavior and
return focus. Avoid uncontrolled chains of drawers/popovers. A non-modal panel should
not trap focus as if it were a modal dialog. Make the exit/return path understandable.

Test reflow and text enlargement in controls and surrounding chrome. Any valid
2D-canvas reflow exception is scoped to that content, not automatically the entire
editor UI [S5]. Use project accessibility targets and verify applicable requirements;
do not claim conformance from design inspection alone.

### 9. Required geometry deliverable

Use the panel template to record before/after size policy, content fit, scroll owner,
open-panel combinations, canvas budgets, overflow, layering, narrow/short fallback,
keyboard resizing, focus visibility and persistence of panel preferences.

Show at least the most constrained supported layout and a representative normal
layout for structural work. Add extreme states relevant to the changed controls.
Actual final dimensions must be specified for a design-ready structural handoff;
unknown measurements may support a provisional recommendation, not final readiness.
