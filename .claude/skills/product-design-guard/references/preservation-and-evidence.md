## Evidence, compatibility and controlled product evolution

### 1. What must be preserved

Preserve supported user capabilities, intended outcomes, access rights, user data,
meaningful context and compatible project behavior. Do not preserve a defect simply
because it exists. Do not preserve the exact panel arrangement when it prevents a
coherent solution to the authorized design task.

The unit of preservation is a capability with its relevant behavior, not a screenshot
or count of visible buttons. A capability includes its eligibility, meaningful options,
validation, value scope, feedback, keyboard access, save/history behavior and recovery.
A relocated control is preserved only when the user can still discover and complete
its task. A hidden-but-implemented capability must be recorded separately from a
reachable one; deciding to expose it is an explicit design decision.

An existing entry point can be consolidated or retired when the capability remains
reachable through a coherent equivalent path, compatibility implications are addressed,
and consequential departures from approved requirements are authorized. Do not keep
redundant interfaces forever merely to claim literal preservation.

### 2. Use evidence with provenance

For important claims capture source path and symbol, route, test/fixture, screenshot
with viewport/context, or exact design file/frame/node. Record inspection date and
repository/design revision when available. A report is a lead to inspect, not proof
that the current product behaves the same way.

Keep independent statuses:

| Dimension | Valid descriptions |
|---|---|
| Source | Implemented / partial / absent in inspected scope / unknown |
| Reachability | UI-reachable / hidden or gated / unreachable / unknown |
| Runtime | Observed working / observed failing / not run |
| Design | Represented / partial / omitted / proposed / unavailable |
| Authority | Approved requirement / observed behavior / recommendation / unknown |

Do not collapse these into a single green "exists" badge. Distinguish confirmed
absence after adequate inspection from failure to find an item in a limited search.
Never invent code paths, default dimensions, role permissions, analytics, component
variants, responsive breakpoints, APIs or existing tests.

Current code establishes the implementation; approved requirements establish intent;
observed runtime shows behavior under the tested conditions. Report discrepancies
between these sources. Do not arbitrarily privilege the newest mockup over approved
requirements, or incorrect code over the intended experience.

### 3. Baseline inspection procedure

Inspect repository instructions and current worktree without resetting user changes.
Locate actual entry points and available canonical designs. Review the product map,
then inspect the changed module and its functional, visual and data dependencies.
If no reliable map exists, establish the requested scope from evidence and mark the
rest unknown; do not invent a complete product catalog before doing useful work.

Inspect registrations, configuration-driven UI, schemas, shared stores, command buses,
CSS inheritance, tokens, portals and consumers as applicable—not only direct imports.
A shared spacing variable may affect screens with no direct import of the edited panel.
An element property can affect rendering, undo and serialization outside its control.

Capture representative current tasks, panel arrangements and existing failure states.
Run available relevant baseline checks before editing. Preserve the evidence needed
to distinguish introduced regressions from existing failures.

The inventory may be reviewed globally while source verification remains risk-based.
A full shared inspector change warrants broad review; a corrected tooltip does not
require re-testing every unrelated backend endpoint. State the actual breadth honestly.

### 4. Define the task rather than assuming the solution

Record the actor, intent, current starting point, completion condition, context needed,
and constraints. A request for "another tab" can be a request for better organization;
inspect before deciding that a tab is the right mechanism. Explain a better scoped
solution rather than blindly adding another destination.

Use user evidence when available: approved product goals, support issues, task data,
usability observations or explicit requests. Do not invent user interviews, frequency,
percentages, conversion improvements or time savings. Label a frequency estimate or
expected usability benefit as a hypothesis and specify how it could be checked.

Differentiate missing capability, unfinished implementation, undiscoverable UI,
incorrect ownership, design omission, interaction defect and optional expansion.
Do not make a roadmap out of every competitor feature or every imaginable edge case.

### 5. Preservation mapping

For every affected capability record:

`capability ID → old entry/context → observed behavior → proposed entry/context →
intended behavior → preserved/relocated/consolidated/changed/blocked → evidence/check`.

Include meaningful values and special controls, not just section headings. A typography
section with font size but missing units, source indicator, reset and responsive scope
is not equivalent to a fully capable prior typography section.

Check context menus, shortcuts, active/disabled controls, supported gated features and
less obvious paths. Document any approved removal with rationale, user impact and
migration. Do not silently remove old actions because a new design lacks space.

### 6. Scope and change control

Prefer the smallest coherent solution, not the smallest textual diff. Reorganizing an
affected section can be safer than a tiny patch that introduces an incompatible model.
Conversely, fixing a local control is not a license to replace the entire editor shell.

Routine layout changes within an authorized redesign can proceed with stated rationale.
Seek an explicit decision only for an unresolved consequential change not covered by
the request: capability removal, role expansion, destructive data changes, breaking
contracts, new paid scope, live publishing or unrelated architectural replacement.

Do not keep blocking all work while waiting for an unavailable product detail. Separate
safe recommendations from dependent decisions. Mark dimensions and behavior proposals
as provisional when evidence is unavailable; do not call them verified integration.

Do not change packages/frameworks merely to implement a control. Discover the actual
stack, scripts and style conventions. Reuse viable patterns; document a necessary
new primitive and its consumers instead of creating an untracked one-off.

### 7. Persistence and compatibility

Classify each change as presentation-only, behavior-affecting, or schema/data-affecting.
A panel rearrangement should not rewrite project data, mark the document dirty, or enter
undo history merely because its layout changed. Store personal workspace preferences
separately from authored content using the existing architecture when supported.

For schema changes define old/new representation, read compatibility, defaults,
migration, validation and recovery. Preserve identifiers, bindings, assets, shared
references and unknown data unless an explicit supported migration says otherwise.
Test a representative older saved project, not only a project created after the change.

Do not let hidden sections clear values or collapsed panels stop persistence. Preserve
unsaved work during errors, cancellation and navigation. Check preview/export/published
output when the edited property reaches those paths. Never run live publishing or
migration merely to prove a design unless explicitly authorized in a safe context.

### 8. Assumptions and constraints register

Separate three cases: an observed fact, a supplied constraint, and a design hypothesis.
For each unresolved decision record its consequence, what evidence would resolve it,
and whether safe work can continue. Never turn a hypothetical choice into a claimed
existing product rule in later sessions.

Update the affected baseline after authorized work. Preserve relevant rationale and
superseded decisions. After context loss re-read this policy, the current change record,
applicable product maps and the actual diff; chat recollection is not the source of truth.
