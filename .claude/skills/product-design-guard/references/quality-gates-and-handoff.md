## Quality gates, developer handoff and readiness

### 1. Gates assess evidence, not confidence

Assign each applicable gate PASS, FAIL, NOT RUN or NOT APPLICABLE with evidence and
reason. Record observed baseline failures separately from introduced regressions.
A required verification with unavailable access is NOT RUN, not NOT APPLICABLE.
Do not claim all gates passed because a tool completed its own operation successfully.

For advice-only work, evaluate the proposal and explicitly identify implementation
checks that remain. For design-only work, do not alter application code or run live
external changes merely to create evidence. Use available safe inspection tools.

### 2. The gates

| Gate | Required evidence | Blocking failure within the declared scope |
|---|---|---|
| G1 Evidence and coverage | Sources, inventory scope, actual baseline, unknowns | Claimed existing behavior has no adequate evidence |
| G2 Task and ownership | User outcome, value owner, target, scope, permissions, reset | A user cannot predict what or whom a change affects |
| G3 Placement and architecture | Coherent home, integration choice, affected-panel decision | Arbitrary placement, contradictory editors, unowned destinations |
| G4 Geometry and composition | Panel specification, content fit, canvas budgets, fallback | Clipped required controls, inaccessible actions, infeasible workspace |
| G5 Navigation and continuity | Exact entry/target, result, return, preserved context | Dead ends, wrong target, silent loss of draft or selection |
| G6 Interaction and accessibility | Control contracts, state coverage, keyboard/focus checks | Core action inaccessible or critical states unspecified |
| G7 Capability preservation | Old-to-new mapping and paired workflow checks | Existing required capability lost or effectively unreachable |
| G8 Implementation and compatibility | Real commands, runtime evidence, persistence/output tests | New data loss, permission defect or relevant regression |
| G9 Handoff and maintainability | Named artifacts, tokens/variants, decisions, updated records | Developer must invent consequential behavior or dimensions |

A cosmetic C0 correction can address the relevant gates in a compact report. A new
panel or shared component requires substantive evidence. A gate may pass for a
proposal's specification while implementation remains untested; label the object
of verification rather than reusing an ambiguous global PASS.

### 3. Design deliverables

For a substantive design change deliver a connected package:

1. Decision record: request, user task, evidence, scope, alternatives, chosen approach
   and brief rationale, without an internal reasoning transcript.
2. Old-to-new capability map: every affected control/behavior and its destination.
3. Ownership and navigation contract: exact target, scope, source, entry and return.
4. Panel/layout specification: actual proposed values/rules, constraints and fallbacks.
5. Affected screen families and component variants: normal and relevant extreme states.
6. Verification and open-risk record: actual checks and declared readiness.

Small changes may combine these into one concise record. Do not create six documents
when one table suffices. Conversely, do not replace a structural specification with
"make it clean", "increase spacing" or "use Webflow style".

### 4. Screen- and state-level handoff

Specify frame/screen names and exact design references when available. Show new
functionality inside its real editor shell, with relevant pre-existing content.
Include required navigation destinations and return states—not only the origin button.

For layouts specify width/height constraints, fixed/fill/hug behavior, wrapping,
scroll ownership, sticky regions, layers, minimum canvas requirements and relevant
workspace states. Do not leave a developer to guess whether a panel is resizable,
which area scrolls or what collapses on a smaller screen.

For components specify existing token/component reuse, variant additions, state
behavior and consumer impact. Distinguish an approved new design token from a guessed
existing token name. Keep visual consistency without forcing incompatible controls
into one generic component.

Annotate values, eligibility, interactions, content limits, accessible names, focus,
validation, history and persistence where relevant. Include realistic content and
errors. A beautiful empty-state frame is not a specification for a full resource list.

Maintain one identified canonical design for the approved result. Preserve alternatives
as clearly labeled proposals/superseded versions when needed; do not leave competing
"final" frames with no stated authority. Do not create or rename Figma files unless
the task authorizes those changes.

### 5. Implementation verification

Discover actual project commands and tool availability before running checks. Use
relevant lint, type, build, unit, integration and end-to-end tests that really exist.
Report exact command, scope, result and any environment limitation. Do not install
a new test framework silently to satisfy a checklist.

Inspect rendered results at relevant workspace sizes and interaction states. A build
pass does not prove usable geometry; a screenshot does not prove correct saving.
Exercise new functionality with adjacent existing functionality in a representative
project. Expand coverage for shared components, tokens, layout, state or schema.

When applicable, cover undo/redo, save/reopen, older documents, binding/override
resolution, restricted roles, preview/output, failure/retry and navigation return.
For direct bug fixes add or update a targeted regression test where feasible; otherwise
provide a reproducible manual procedure and identify the automation gap.

Check the final diff for accidental capability removal, changed defaults, unrelated
edits, unsafe permissions, schema drift, weakened tests or blindly replaced snapshots.
Do not fix failures by hiding errors or making tests assert the new bug.

### 6. Visual, interaction and accessibility evaluation

Compare before/after at the same recorded workspace conditions, plus additional
constrained cases. Inspect normal, short-height, narrow-width, long-content, error,
expanded and relevant restricted states. Check focus and reachability when overlays,
scrolling or sticky regions are active. Verify the new design has not simply moved
crowding into the canvas or another panel.

Evaluate applicable WCAG and keyboard patterns against the actual component and
project target [S4–S8]. Automated checks complement, but do not establish, correct
keyboard flow, meaning or full accessibility conformance. Distinguish a design review,
manual runtime inspection, automated scan and formal conformance assessment.

For structural changes walk through realistic tasks, including one older task that
crosses the changed area. Check whether an experienced user can find the relocated
capability and a new user can infer its purpose. Call this a heuristic walkthrough
unless actual user testing was conducted. Record genuine research evidence separately.

### 7. Product records

Reuse equivalent existing records. Suggested responsibilities, not mandatory new files:

- Product context and coverage: known modules, supported environments, canonical references.
- Feature map: capabilities, entry points, dependencies and independent evidence statuses.
- Ownership map: source/target/scope, permissions, inheritance/reset and save boundaries.
- Panel/layout map: responsibilities, dimensions, scroll policy, composition and fallbacks.
- Navigation map: entries, exact targets, context return and affected search/shortcuts.
- Component inventory: tokens, variants, consumers and reusable behavior contracts.
- Decision log and change records: rationale, migrations, superseded decisions and risks.
- Regression map: actual fixtures/tests, manual checks and remaining coverage gaps.

Update only facts affected and verified by authorized work. Preserve revision/date
provenance. Do not mark the whole inventory revalidated because one panel changed.
For read-only advice, supply proposed updates rather than silently writing files.

### 8. Readiness labels

PROPOSAL: A recommended direction with explicit unvalidated details or unapproved
consequential choices. It must not be mistaken for an inspected final design.

DESIGN READY: The declared affected design scope has complete capability mapping,
resolved ownership/navigation, specified geometry, necessary states and handoff,
with no unresolved design-blocking decision. Runtime may remain untested; say so.

IMPLEMENTATION VERIFIED: The declared implemented scope passed the agreed relevant
checks, including required runtime/compatibility checks, with no blocking introduced
regression. State test scope and exclusions; this does not mean the entire product
has been proven defect-free or deployed.

PARTIALLY VERIFIED: Useful work exists, but a required review/test/evidence area could
not be completed. Name the missing check, consequence and next verification exactly.

BLOCKED: A specific unresolved access, safety, scope or compatibility issue prevents
the consequential part from proceeding. Report completed safe work and isolate the
blocker rather than pretending that every independent task is blocked.

### 9. Final report

Start with the actual design decision, not generic praise. State why this integration
was chosen, what existing structure changes, where the new capability lives and how
users reach/leave it. Report panel dimensions/rules and canvas consequences for
structural work. Summarize preserved, relocated and intentionally changed capabilities.

Link real artifacts and evidence; report actual verification, unknowns and readiness.
Never invent installed skills, edited Figma files, executed tests, deployed code,
updated docs or a user-tested outcome. Deliver the completed work within the current
request; do not describe unfinished work as occurring invisibly in the background.
