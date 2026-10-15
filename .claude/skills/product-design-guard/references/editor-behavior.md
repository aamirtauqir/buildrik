## Editor behavior and cross-feature integration

Apply each section only when the capability exists or is explicitly being introduced.
This checklist does not assert that Buildrick implements every listed feature.
Mark implementation gaps and proposals separately. Inspect actual state, commands,
rendering and storage rather than assuming a familiar website-builder architecture.

### 1. Selection and synchronized context

Check canvas, navigator/layers, inspector and other relevant surfaces agree about the
selected object. Cover no selection, one selection, nested selection, multi-selection,
locked/read-only objects and an object that becomes unavailable where supported.

When selection changes, do not leak unsaved values, stale validation, resource-picker
results or delayed asynchronous writes from the old target into the new target.
Keep the target of an in-progress operation explicit. Define whether an invalidated
operation cancels, prompts, or safely remains attached to its original stable ID.

For multi-selection, show meaningful mixed values and eligibility. A mixed value is
not necessarily an empty value or zero. Preserve per-element values until the user
intentionally applies a common change. Do not silently discard unsupported elements
from an operation without communicating the applicable scope.

### 2. Property resolution and responsive styling

Trace property values through the actual supported model: local values, classes,
tokens, inherited values, component properties, data bindings, breakpoint/state
rules or computed output. Record precedence from source; do not invent an ordering.

Show why a value is present and where it can be edited. Distinguish changing a local
value from editing a shared definition. When reset removes an override, confirm that
the resolved fallback appears; do not replace it with an arbitrary zero or default.

Check relevant combinations of selected object, breakpoint, authored interaction
state and value source. Changing the editor panel width must not alter the authored
page breakpoint. Changing a breakpoint must not erase values owned by another one.

For properties exposed through more than one UI surface, verify synchronized values,
validation, history and source indication. Do not create a second style resolver to
make a new panel appear functional.

### 3. Components and reusable definitions

Where supported, distinguish creating/managing a reusable definition from inserting
an instance and overriding exposed instance properties. Show whether structure,
content or style edits affect one instance or every consumer.

Define master-edit entry and return, selection continuity, local override reset,
unlink/detach, deletion and unavailable-library behavior when relevant. Preserve
stable identity and supported references. Do not turn a master edit into a local
patch simply to avoid discussing global consequences.

Evaluate actual consumers before changing a shared design component or token.
Inventory variants/states and preserve accessible behavior. Extend a reusable
primitive intentionally when its contract can support the new need; use a scoped
variant when a global change would distort unrelated consumers.

### 4. Assets, content and bindings

Distinguish uploading/managing an asset from selecting it for a field and replacing
an asset that may have multiple consumers. Define image source, alt/semantic data,
visual fit/crop and shared metadata according to actual ownership; do not assume
all these values belong to the same object.

For CMS/data binding, distinguish schema/record editing, local field binding and
rendered previews. Define empty, unavailable, type-mismatch and fallback states.
Do not silently overwrite a bound value with a static value when editing a local
visual property. Make disconnecting a binding an intentional action.

For links, forms and content inputs, preserve meaningful validation and semantics.
A visual-only redesign must not change submit behavior, identifiers or output markup
without identifying and authorizing the behavioral consequence.

### 5. Canvas operations and motion

Check existing insert, move, resize, duplicate, delete, reorder, reparent and lock
operations affected by a change. Verify nesting rules and selection feedback.
A new overlay or drag handle must not intercept essential canvas operations by accident.

For effects, gradients, backgrounds, shadows, transforms or other repeated property
sets, preserve list order, enabled state, source ownership, per-item values and reset
scope. The order of a stack may have meaning; inspect the actual renderer.

For interactions/animation, separate authoring triggers/actions/timing from preview
playback and from editor UI hover. Define play/stop/reset and non-playing design
states. Honor relevant reduced-motion expectations in the editor UI and preview
controls; do not claim output accessibility without inspecting output behavior.

### 6. History and persistence

Use actual commands/state transitions and existing history boundaries. Define whether
live edits are grouped and which action undo restores. Test a new action adjacent to
older actions so history stays coherent across surfaces.

Verify dirty state, autosave/manual save, failure and retry as applicable. UI navigation,
panel width and expanded sections must not mark authored content dirty unless that
is an explicit supported product decision.

Exercise edit → undo → redo → save → close/reopen → inspect value. Include an older
saved-project fixture when the model or semantics change. Confirm document identity,
assets and bindings remain intact. A successful API request does not prove correct
rendered output or correct rehydration.

### 7. Preview, output and publishing

Compare editor representation, preview and relevant export/published output. Determine
whether a difference is intentional, a documented preview limitation or a defect.
Do not display controls that suggest a property reaches output when it does not.

Define draft versus saved versus published state and scope. A page-level action must
not imply it publishes only one page if the underlying operation publishes a whole
site. Check actual implementation and role restrictions. Use safe test environments;
a design task never implicitly authorizes publishing the real site.

### 8. Permissions, shared state and failure

Distinguish view, apply, edit-source, delete and publish permissions. Hiding a control
is not proof of authorization enforcement; implementation verification must inspect
the relevant enforcement path. Avoid allowing shared changes from a locally scoped UI.

Where collaboration or async data exists, cover stale results, cancellation, external
updates, deleted resources, conflicts, loading and lost access. Preserve local draft
work and offer a safe resolution. Do not invent multi-user support that is not present.

### 9. Performance and scale

Identify actual expensive paths: repeated canvas rendering, resolving many selected
nodes, large resource lists, previews and continuous scrubbing. Use representative
observed or explicitly proposed fixtures. Compare against baseline evidence where
measuring performance; do not invent milliseconds or "no performance impact" claims.

Avoid work on every keystroke that needlessly recalculates the whole project. Preserve
correctness while using established batching/debouncing/history behavior. A faster
preview is not acceptable if it persists stale data or loses intermediate intended edits.

### 10. Risk-based integration matrix

Select cases across object type, selection, breakpoint/state, ownership source,
permission, persistence, workspace size and content volume according to changed
behavior. Cover high-risk combinations directly and use representative combinations
for the remainder. Explain omissions; exhaustive testing of every possible combination
is not implied by a checklist.

The final evidence must include the new feature used alongside an affected existing
feature. Do not verify a new panel only in an empty project that bypasses the complexity
of real saved work.
