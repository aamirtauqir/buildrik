## Worked decision examples

All examples below are hypothetical. They illustrate the required decision process,
not findings about Buildrick's current implementation, dimensions or feature support.
Replace hypothetical values and paths with inspected evidence during actual work.

### A. Add gradient editing to an already crowded background section

Request: add gradient controls without losing current solid-color/image controls.

Inspect: existing background representation, layer ordering, units, responsive/state
resolution, tokens, image settings, reset, history, storage and output. Capture the
current section with meaningful values, not an empty selected element.

Ownership decision: a local background value belongs with element visual styling if
that matches the current architecture. A saved reusable gradient, if requested and
supported, has separate management ownership. Its local application does not require
putting the whole shared-library manager into the inspector.

Compare plausible approaches: append every gradient control into the current section;
reorganize the background section around its actual layer/type model with a compact
summary and a focused gradient editor; or use a new top-level tab. If inspection shows
layer-based backgrounds, a layer summary plus an editor may integrate existing and
new types coherently. If the model is not layer-based, do not silently introduce a
layer schema merely because the mockup looks attractive.

Geometry decision: measure the existing panel and essential stop-editor controls.
Do not globally widen the inspector solely because a gradient strip needs more space.
A bounded detail view may fit the task better; specify its anchor, dimensions, scroll,
focus, live preview, commit/cancel behavior and return to the source control.

Preservation: map solid color, image source, fit/repeat/position where supported,
ordering, reset, inheritance and existing advanced values into the new design.
Show active summaries when collapsed. Do not lose image options in the redesign.

Acceptance examples: edit a gradient in the relevant state; return to the same selected
element; undo returns the complete previous background; save/reopen preserves it;
existing image/solid tasks still work; the editor remains usable at the constrained
workspace size. Any unsupported branch is reported, not falsely passed.

### B. Add "Edit shared token" from a local color control

Inspect: whether tokens exist, their scope, the local binding representation, source
editing permissions and current navigation. Do not claim a token system exists from
a color picker alone.

Ownership: applying a token and editing its shared definition are different actions.
The local control shows the binding/source and offers an exact source-edit entry
when allowed. The destination edits the shared source, with its impact visible.

Path: selected element/color field → exact token detail → change or cancel → original
element and field. Preserve page, selection, breakpoint, authored state, canvas view
and focus where applicable. A generic Brand landing page is insufficient for an
"Edit this token" action without a reliable targeted handoff.

Do not duplicate a second token manager in the local panel. Do not reset a shared
token when the user requested removal of a local override. If the original target
is deleted while the detail view is open, show a safe return state and do not apply
changes to an unrelated new selection.

Acceptance examples: users without source-edit permission can still perform allowed
local actions; shared impact is communicated; source updates and local displays stay
synchronized; cancel/return does not discard unrelated edits.

### C. Width arithmetic exposes an infeasible panel proposal

Assume, only for this example:

| Region | Width |
|---|---:|
| Application viewport | 1440 CSS px |
| Navigation rail | 48 CSS px |
| Left dock | 240 CSS px |
| Right inspector | 320 CSS px |
| Combined splitters/gutters | 16 CSS px |

Remaining canvas width is `1440 - 48 - 240 - 320 - 16 = 816px`.
Widening the inspector to 400px leaves 736px. If a tested task requires 800px of
usable canvas under this configuration, the feasible right-panel maximum is 336px.
These are illustrative inputs and a hypothetical requirement—not Buildrick standards.

If essential controls need 360px, the requirements conflict. The answer is not to
choose 348px and clip both sides. Reorganize control rows, use a focused detail view,
or define an appropriate reversible docking/collapse mode. Compare the actual task
cost of each alternative, including access to the left panel while editing.

At a 1280px application viewport, the original same arrangement leaves 656px. That
separate constrained case needs its own composition decision. Do not silently switch
the authored website to a smaller breakpoint to hide the lost editor space.

Final output: an evidence-backed panel width policy, the relevant simultaneous-panel
configurations, explicit narrow fallback, and the resulting task/canvas checks.

### D. More fields do not automatically mean more outer panel height

Assume a hypothetical app viewport height of 900px with 56px top chrome and 24px
bottom chrome. The available docked-panel height is 820px. If panel header, context,
tabs and fixed actions together consume 144px, its scrolling body has 676px before
any additional body padding that the real layout requires.

Adding fields expands content length; it does not make an inaccessible 1100px outer
panel acceptable. Reassess grouping, default disclosure and the scroll owner. Keep
meaningful source and selection context visible without consuming all short-window
space. Retest error text and expanded content at the minimum supported height.

Do not introduce a scrollbar inside every section or shrink controls until they are
hard to use. A resource list can justify its own bounded scroll region, but it must
have a deliberate height, navigation and keyboard contract.

### E. Add advanced animation editing

Inspect: existing interaction model, selection/state handling, preview controls,
property scope, existing transitions and saved representation. Do not conflate the
editor's hovered button with the authored element's hover animation.

Compare: a simple contextual inspector extension for a small transition; a structured
interaction subview; or a dedicated timeline workspace for sustained multi-step
editing. A timeline workspace is justified only by actual task complexity and scope,
not the desire to give every feature a new page.

When sustained editing needs a bottom dock, calculate vertical canvas impact,
coexistence with side panels, minimum usable timeline/canvas height, collapse behavior
and return from preview. Preserve access to existing styles and selection.

Acceptance includes older interaction tasks, play/stop/reset, target ownership,
undo/save/reopen where implemented, and a short-height workspace. A new trigger menu
without its action configuration and result is incomplete.

### F. A shared compact-control change affects unrelated panels

Request: make numeric controls more compact to fit a new section.

Inspect the shared primitive, typography/spacing tokens, focus treatment, unit selector,
error state and every known consumer. An eight-pixel shrink in one shared primitive
may affect multiple screens even if the request names only one panel.

Compare a scoped variant with an intentional global density change. Choose based on
real consumers; do not make a global alteration to solve a local layout problem.
Check long values, units, mixed values, focus, target spacing and error messages.

Preserve the control's value/commit/history behavior. Do not reduce information or
clickability merely to retain the original panel width. If the new section does not
fit, revisit its structure instead of weakening the shared component contract.
