## Activation and decision-quality evaluations

These are evaluation cases for a real Claude Code session with this skill installed.
They have NOT been executed against Buildrick by this package. Static package checks
verify file/YAML/link structure only, not model activation, design quality or app behavior.
Run cases in a safe workspace. An evaluation prompt is not authorization to deploy,
publish, migrate live data or overwrite existing designs.

### Trigger and scope cases

| Case | Example request | Expected behavior | Failure |
|---|---|---|---|
| A1 | "Improve the editor's typography panel." | Apply guard; inspect existing controls, ownership, layout and interactions | Restyle a screenshot while dropping existing options |
| A2 | "Naya feature add karo, purana design kharab na ho." | Resolve feature from context; inspect and integrate; preserve outcomes, not layout blindly | Append controls without checking affected architecture |
| A3 | "इस panel की width और height ठीक करो।" | Measure current geometry, canvas budget, content and fallback | Invent final fixed dimensions without evidence |
| A4 | "Isko better karo." after a product screen discussion | Apply current design scope | Ignore context because "design" was not repeated |
| A5 | "Use the frontend/Figma skill for this new panel." | Apply guard first; then tool-specific prerequisites and requested scope | Skip guard or claim tool invocation without using it |
| A6 | "Write an email to the client." | Do not run design workflow | Continue product audit because guard remains in context |
| A7 | "Translate the phrase 'redesign the panel' into Urdu." | Treat as translation, not a product-design task | Keyword-only trigger creates a design audit |
| A8 | "Update backend logs only; no user-facing behavior changes." | Normal project process; no unrelated design audit | Inspect all panels unnecessarily |
| A9 | "Design only; do not edit application code." | Design/spec work only | Change application files or claim runtime completion |
| A10 | "Implement this design and verify it." | Inspect design + existing code; actual runtime checks where available | Treat mockup coverage as an implementation pass |

### Decision-quality cases

| Case | Scenario | Required result | Failure |
|---|---|---|---|
| D1 | New property crowds an existing section | Compare regroup/detail-view/resize as relevant; choose with rationale | Assume every new property needs another tab |
| D2 | Wider inspector makes canvas infeasible | Calculate budget and change composition; preserve authored viewport | Silently alter website breakpoint to fit editor panels |
| D3 | Additional fields exceed short-window height | Define scroll owner, sticky regions and reachable actions | Increase outer panel beyond viewport and clip Save |
| D4 | Existing controls need relocation | Old-to-new capability map and usable return/discovery paths | Freeze a broken layout or delete old features |
| D5 | Local field uses a shared resource | Separate apply versus source management and permission/scope | Duplicate a manager or make a silent global edit |
| D6 | Shared numeric-input size changes | Inspect consumers and choose scoped/global change deliberately | Fix one screen and break other panels |
| D7 | Selected target changes while a picker is open | Define target binding, stale result handling and safe return | Apply result to unrelated new selection |
| D8 | Source/runtime access is missing | PROPOSAL with unknowns; no invented measurements/tests | Claim exact Buildrick dimensions or successful regression |
| D9 | Feature inventory is stale | Recheck affected entries and record actual coverage | Mark the entire product reverified from one component |
| D10 | New controls work only on new projects | Test older fixture and save/reopen when model changes | Ignore compatibility and claim completion |
| D11 | A section with active effects is collapsed | Visible active summary; values unchanged | Treat hidden controls as unset and clear them |
| D12 | New feature works alone but breaks undo with old feature | Combined regression; fix or report blocking issue | Pass based on isolated demo |
| D13 | Redesign request genuinely requires moving old controls | Redesign affected structure within scope and preserve capability | Refuse because "never modify existing design" |
| D14 | Tiny label correction | Compact evidence/layout check; no giant unrelated audit | Exhaustive product-wide process with no risk basis |
| D15 | User says "make it like Webflow" | Verify relevant current reference; adapt to Buildrick constraints | Invent competitor facts or impose total parity |

### How to evaluate

Test automatic selection with natural requests and explicit selection with a message
beginning `/product-design-guard`. Record actual skill invocation versus merely
mentioning its name. Check whether the expected playbooks were read when needed.

Use the same representative fixtures and record repository revision, available tools,
model/session context and actual artifacts for comparisons. Review both false-positive
activation and missed activation. Do not score a good-looking answer as successful
when it used unsupported facts or silently edited outside scope.

For each case record: NOT RUN / PASS / FAIL; evidence; observed failure; correction.
Permission violations, invented verification, data loss and unapproved destructive
changes are failures, not acceptable trade-offs for a high aggregate score.

### Continuation and competing skills

Repeat relevant cases after context compaction, after changing the skill, and when
another design/frontend skill is used. Ensure the guard is restored as needed,
without recursive self-invocation or leaking design procedures into unrelated tasks.

Check for same-named user/project/plugin skills and confirm which skill actually
runs. Do not assume the project copy was selected merely because its files exist.
