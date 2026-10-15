---
name: product-design-guard
description: Buildrick product-design workflow. Use for any Buildrick UI/UX task — design, redesign, audit, new user-facing feature, panel, control, navigation, panel width/height, clutter/density, ownership, responsive workspace layout, shared components, Figma work, or implementing a design. Recognize intent in English, Hindi, Urdu and Roman Urdu (e.g. "isko better karo", "naya feature add karo", "panel theek karo"). Inspect the product first, preserve capabilities and user data (not the old layout), redesign affected structure when needed. Not for emails, translation, or backend-only work.
argument-hint: [product-design request]
---

## Buildrick Product Design Guard — v2

### The governing contract

Design the changed area as part of the existing product, not as an isolated new screen.
Preserve capabilities, data, and intended outcomes—not obsolete panel arrangements.
An authorized design task may require reorganizing, resizing, splitting, merging,
or replacing affected panels. Do not freeze a poor layout in the name of preservation.
Do not append controls, add tabs, widen panels, or create a new workspace by default.
Choose the smallest coherent redesign that solves the complete task without moving
confusion, lost functionality, or unacceptable spatial cost elsewhere.

Inspect before deciding. Separate observed facts, approved decisions, and proposals.
Show concise decision rationale and evidence, not a private reasoning transcript.
A polished mockup, a passed build, and a complete product workflow are different things.
Never report an unrun check, unavailable design, or uninspected capability as verified.

This skill supplies instructions, not tools, permission escalation, or guaranteed enforcement.
It does not authorize extra application changes, live publishing, or deployment.

### 1. Activate for the current task only

Current request arguments (empty when Claude loads this skill on its own; then use the
conversation):

$ARGUMENTS

Read the request with relevant conversation context. Recognize design intent without
requiring the word "design". Reassess on each new task. Stop applying this procedure
when the user switches to an unrelated topic, even if the skill text remains in context.
For mixed tasks, cover only the relevant product-design work and its dependencies.
Do not recursively invoke this skill when it is already active for the current task.

Choose the authorized mode: ADVICE/AUDIT, DESIGN ONLY, IMPLEMENTATION, or BOTH.
Review does not authorize edits. Design does not authorize application-code changes.
A feature request does not authorize unrelated product expansion or destructive migration.
Inspect first to resolve ambiguity; continue independent safe work around a genuine blocker.
Do not repeatedly ask the user questions answered by source, supplied designs, or approved records.

### 2. Load the applicable playbooks

Always read [preservation and evidence](references/preservation-and-evidence.md)
and [quality gates](references/quality-gates-and-handoff.md) for an in-scope task.
For any new feature, panel, navigation, ownership, density, or layout change, also read:
- [Ownership and information architecture](references/ownership-and-architecture.md).
- [Panel geometry and density](references/panel-geometry-and-density.md).
- [Navigation and interaction contracts](references/navigation-and-interaction.md).

Read [editor behavior](references/editor-behavior.md) whenever selection, styling,
components, data, preview, history, saving, or output may be affected. Read
[worked examples](references/worked-examples.md) when a placement or restructuring
choice is ambiguous; these are hypothetical, not Buildrick implementation facts.
Use the linked templates for substantive changes. Read
[activation examples](evals/activation-cases.md) to evaluate the skill itself.
External documentation and accessibility sources are listed in
[sources](references/sources.md); browse only when a task needs external verification.

Make a brief applicability record: domains inspected, domains not applicable and why,
and domains still unknown. Unknown is not a reason to quietly mark a domain inapplicable.
A local wording correction may use a compact check; a shared sizing token cannot.
Re-read current instructions and active records after context loss or relevant file changes.

### 3. Establish the evidence baseline

Inspect applicable repository instructions, current revision and user changes,
available app behavior, tests, design system, and relevant canonical designs.
Use available approved metadata to determine the canonical design; do not assume that
an automatically newer file or a frame named "final" is authoritative.

Review the whole-product capability inventory for possible impact, then inspect the
affected screens, controls, consumers, state and persistence in depth. Establish a
scoped inventory if none exists; disclose wider gaps. Never claim a whole-product
audit after reading only the edited component. Preserve current uncommitted work.

Capture the current layout at recorded viewport/panel states. Trace important controls
from entry point to actual state updates, storage and rendered results as applicable.
Record exact evidence references, observed failures, and unresolved discrepancies.
Do not inherit unverified assumptions from old reports or earlier assistant answers.

### 4. Define the user task and change boundary

State the user goal, actor/role, starting context, intended outcome, frequency evidence,
and relevant constraints. Label unsupported frequency or usability predictions as hypotheses.
Describe non-goals and the failure being addressed, not merely the requested UI object.
List affected existing tasks and shared systems before selecting a visual treatment.

Classify the change:
- C0: local correction with no structural or behavior change.
- C1: compatible extension within an existing interaction contract.
- C2: affected section/panel/flow redesign, including relocation or resizing.
- C3: cross-panel/workspace, shared-system, ownership, or compatibility change.

Choose the level from evidence, not the number of files the user mentioned. Escalate
the analysis when shared impact is discovered, without turning a local task into an
unrequested whole-product redesign. Explain consequential scope expansion first.

### 5. Resolve ownership and destinations

For each capability identify its user task, value owner, canonical editing surface,
selection eligibility, scope of effect, permission, inheritance/override/reset semantics,
and draft/save/publish boundaries. Separate creating/managing a shared resource from
applying it locally. Multiple entry points are allowed; competing underlying values are not.

Do not place controls by which component file is easiest to edit. Use the existing
mental model, semantic grouping, task adjacency, context needs and actual dependencies.
Verify candidate homes against the real product before treating them as established.

### 6. Choose integration rather than automatic addition

For C2/C3 or ambiguous placement, compare the current arrangement with at least two
plausible integration approaches. Reject irrelevant options briefly rather than drawing
unnecessary alternatives. Use evidence-backed qualitative trade-offs, not invented scores.

Consider inline extension, regrouping, disclosure, a scoped subview, a picker or popover,
a contextual drawer, a redesigned panel, or a dedicated workspace. A new surface must
justify its separate user task, navigation, ownership and spatial/maintenance cost.

Record the decision: retained, reorganized, resized, split/merged, or replaced; why;
what moves; what remains; and effects on familiar workflows. Changes to layout within
an authorized redesign do not require permission for each ordinary design decision.
Deleting a capability, changing permissions, or breaking saved data does require authorization.

### 7. Prove the layout works in the whole workspace

For affected panels provide current and proposed min/default/max width, height strategy,
resize/collapse behavior, fixed versus scrolling regions, popover/drawer bounds, and
narrow-workspace fallback. Use measured values or clearly identified proposals.

Calculate the reserved-width and reserved-height budgets for relevant simultaneous
panels and the usable canvas. Distinguish browser viewport, panel dimensions, authored
page viewport, canvas zoom and browser zoom. Panel resizing must not silently change
content breakpoints or authored layout.

Inspect realistic content, errors, active settings, long names, existing controls, and
lowest supported viewport height—not only a sparse, large-desktop screenshot.
Do not solve crowding by making controls unreadable, hiding core actions, adding
unjustified nested scrolling, or stealing required canvas space.

### 8. Define navigation and interaction contracts

Specify the full path: entry → exact target → action → feedback → return/recovery.
Keep selection, page, breakpoint, state, scroll/focus, draft edits, and canvas view when
appropriate. Define what intentionally changes. Avoid generic landing pages when a
contextual link promises a particular item, token, component, or setting.

For each new/changed control define type, label, value source, units, limits, validation,
eligibility, commit/cancel behavior, history, persistence, focus, and relevant states.
Preserve active-setting visibility when sections are collapsed. Distinguish editor
selection state from the authored element's hover/focus/other interaction state.

### 9. Present the design decision before modifying product files

Use [the decision record](templates/design-decision-record.md) proportionately. Include:
request/mode, inspected evidence, capability mapping, ownership/destination, chosen
integration approach, panel geometry, navigation/context return, states, risks and checks.
For a small task this may be a short paragraph; for structural work use explicit tables.

Proceed with authorized non-breaking work after presenting the decision. Do not require
a separate approval round for every step. Isolate genuinely unresolved consequential
choices and deliver the safe, evidence-backed work that can be completed.

### 10. Produce a complete affected design and handoff

Design the new capability inside the existing workspace. Show old and new features
together, all affected screen families, transitions, variants and relevant states.
Reuse actual tokens/components where suitable; document necessary compatible extensions.
A new navigation destination requires its actual destination and return behavior.

Use [the panel specification](templates/panel-specification.md) for structural changes
and [coverage records](templates/coverage-and-regression.md) for traceability.
Before other Figma/frontend skills or delegated work, supply this scope, evidence,
ownership, geometry and acceptance contract. Obey each tool's own prerequisites.
Review integration yourself; delegation or tool success is not product verification.

### 11. Validate and update the baseline

Apply the evidence, architecture, geometry, flow, accessibility, preservation and
implementation gates. Test new and existing behaviors together. Test shared consumers
when changing tokens/components, and save/reopen/history/output when affected.
Use actual available tools and commands. Report NOT RUN when execution is unavailable.
Do not modify tests or baselines simply to hide a regression.

For C2/C3 work, shared-system changes, or before declaring DESIGN READY or
IMPLEMENTATION VERIFIED, delegate an independent gate check to the
`design-guard-reviewer` subagent (read-only). Give it the decision record, the
affected files or diff, and design references. Its report informs the readiness
label; it does not replace checks it marks NOT RUN, and it cannot approve scope.

Update affected existing product records only when writes are authorized. Reuse
current record locations; suggested records include feature, ownership, panel/layout,
navigation, component, decision and regression maps. Do not create a competing catalog.
The [product-context template](templates/product-context.md) starts unknown values
explicitly; it is not a claim that any particular Buildrick module already exists.

### 12. Report scoped readiness

End with the design decision and reason; old-to-new capability mapping; ownership,
geometry and navigation effects; delivered artifacts; actual validation evidence;
remaining risks; and records updated. Use PROPOSAL, DESIGN READY,
IMPLEMENTATION VERIFIED, PARTIALLY VERIFIED, or BLOCKED as defined in the quality gates.

Never call a proposal an approved decision, a design-only check a runtime pass, or
an isolated panel mockup a complete editor redesign.

---

## Files in this skill

Load a file only when the step above calls for it; do not load everything at once.

| Path | Use |
|---|---|
| `references/preservation-and-evidence.md` | Always for in-scope tasks: what to preserve, evidence provenance, baseline, change control |
| `references/quality-gates-and-handoff.md` | Always for in-scope tasks: gates G1–G9, deliverables, readiness labels, final report |
| `references/ownership-and-architecture.md` | New feature, panel, navigation, ownership, density or layout change |
| `references/panel-geometry-and-density.md` | Same triggers: width/height budgets, scrolling, overlays, narrow fallback |
| `references/navigation-and-interaction.md` | Same triggers: task paths, context snapshot, control contracts, states |
| `references/editor-behavior.md` | Selection, styling, components, data, preview, history, saving or output affected |
| `references/worked-examples.md` | Placement or restructuring choice is ambiguous (hypothetical examples only) |
| `references/sources.md` | External documentation and accessibility references |
| `templates/design-decision-record.md` | Step 9 decision record |
| `templates/panel-specification.md` | Step 10 structural changes |
| `templates/coverage-and-regression.md` | Step 10/11 traceability |
| `templates/product-context.md` | Evidence baseline; starts UNKNOWN, fill only from inspection |
| `evals/activation-cases.md` | Evaluating this skill itself; not part of a design task |
