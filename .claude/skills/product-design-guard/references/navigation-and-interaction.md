## Navigation, continuity and interaction contracts

### 1. Design a complete task path

For every changed user journey specify:

`starting context → discoverable entry → exact destination → configuration/action →
visible result → commit/save boundary → return path → failure/cancel recovery`.

Name the actual screen/panel/tab/section and object targeted. A button labeled
"Edit token" that opens a generic Brand landing page is incomplete unless the user
can reliably identify the intended token. A selector that closes without applying
its choice is not a completed interaction.

Differentiate open/manage, choose/apply, create/apply, replace, edit-source, reset and
delete. Similar-looking controls must not silently perform different operations.
Do not add a navigation entry without its actual destination and state coverage.

### 2. Preserve a context snapshot

Identify relevant context before a cross-panel operation:

| Context | Required handling |
|---|---|
| Project/site and page | Preserve unless the task deliberately changes them |
| Selected element(s) | Preserve stable IDs; handle deletion or invalidation |
| Component editing mode | Preserve master/instance distinction |
| Active breakpoint | Preserve unless explicitly changed |
| Authored interaction state | Preserve and show it; distinguish from UI focus |
| Canvas view | Preserve zoom/position unless an intentional reveal is needed |
| Origin panel/tab/section | Return to the relevant place, not a generic default |
| Scroll/search/filter | Restore when helpful; clear only intentionally |
| Keyboard focus | Move predictably into the destination and restore on return |
| Uncommitted input | Retain, commit or discard only according to a defined policy |

Not every context item applies to every action. State what is preserved, transformed,
or intentionally reset. Navigation history, browser history and undo history are
separate concepts; do not use one as a substitute for another.

When the original target is deleted or loses eligibility while the user is away,
show an honest resolution state. Do not apply the pending value to a newly selected
object merely because the old target no longer exists.

### 3. Design navigation at the appropriate level

Use global navigation for global destinations; contextual navigation for selected
objects; local tabs for coherent alternative aspects; sections for related settings;
and overlays for bounded tasks. Do not let one icon represent multiple unrelated
destinations depending on undocumented context.

Keep terminology consistent across navigation, panel titles, menus, search and help.
Avoid generic headings that hide ownership. Breadcrumbs, back labels, scope badges,
or a persistent object header can clarify location; add them to solve a specific
orientation problem rather than as decoration.

A context jump should target the relevant object and return to its origin. Support
deep links or command search when these are already established and relevant. Do not
invent a new routing architecture for one control or promise deep links that do not exist.

### 4. Every control needs an interaction contract

Specify label, control type, target, displayed source/value, units, default, limits,
step, mixed/empty behavior, eligibility, permissions, dependencies and validation.
Specify what happens on typing, drag/scrub, Enter, blur, Escape, click-away, navigation
and selection change, to the extent applicable.

Distinguish temporary input from valid committed values. Do not turn an incomplete
numeric input into zero or a permanent invalid project value without an explicit
existing rule. Show units and meaning; do not silently change px to percent or other
representations. Keep reset and source actions distinct from value editing.

For live-preview editing, define preview, commit and cancel semantics. For explicit
Save/Apply editing, define dirty state, validation, cancellation and unsaved-navigation
protection. Do not impose Save/Cancel on an established live inspector unnecessarily;
do not label an irreversible live action as a cancellable draft.

Define coalescing for continuous edits: a color drag or numeric scrub should follow
the existing meaningful undo contract rather than creating unexpected history noise.
Any deviation from current behavior must be intentional and verified.

### 5. States are part of the design, not a later polish pass

Cover relevant states: empty, loading, searching, no results, selected, hover/focus,
expanded/collapsed, changed, inherited, bound, overridden, mixed, unavailable,
disabled, read-only, validation error, previewing, applying, saving, saved, failed,
conflicted and recovery. Do not create a meaningless Cartesian product of all states;
select combinations based on risk and explicit applicability.

Disabled controls need a discoverable reason when users need to understand eligibility
or access. Hidden controls must not silently imply that a saved value has disappeared.
Preserve inaccessible values without offering writes the user cannot perform.

Feedback should identify the action and affected target. Avoid duplicated toasts from
multiple layers. Use local errors and retry where appropriate; preserve the user's
work and avoid forcing a full workflow restart for a recoverable failure.

### 6. Repeated and complex content

For editable lists define add, edit, duplicate, remove, reorder, selection, validation,
empty state, limits and keyboard/non-drag alternatives where relevant. An add button
without clear per-item ownership or reorder behavior is not enough.

When a capability has simple and advanced modes, define synchronization and whether
switching modes loses information. Do not silently flatten a sophisticated value
into a simpler representation to make a compact UI work.

If advanced text/code input exists, define parsing, validation, unsupported values,
round-trip behavior and recovery. Do not invent a code editor solely to avoid designing
proper typed controls. Preserve advanced values when a simpler control cannot represent them.

### 7. Keyboard, focus and help

Use appropriate existing keyboard patterns and accessible names. Distinguish selected
state, focus and hover. Modal dialogs need an appropriate contained focus lifecycle;
non-modal panels need predictable movement without unnecessary trapping.

Make tooltips supplemental rather than the only means of discovering essential labels,
errors or scope. Scope warnings must be readable and actionable before a consequential
change. Provide understandable labels such as editing a shared source versus making a
local override, aligned with the real product's terminology.

Check focus visibility when panels scroll, collapse or resize, and restore focus to a
meaningful surviving control when a row or dialog is removed. Consider loading delays
and asynchronous completion rather than assuming all actions finish immediately.

### 8. Handoff evidence

Provide a path table with exact entry, eligibility, destination, target, preserved
context, commit boundary, success result, cancel/back path and failure recovery.
Include at least one complete realistic journey using both the new feature and the
relevant pre-existing controls. A set of disconnected mockups is not a flow specification.
