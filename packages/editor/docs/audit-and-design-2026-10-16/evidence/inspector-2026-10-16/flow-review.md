# Inspector flow review — bounded product-design evidence

Date: 2026-10-16. Revision inspected: `19f964d5e7efda2c276a4c185782bb963da605ec`.

Role: Principal Product Designer; scope: Inspector read/write/source/reset, multi-selection, components, contextual return, safeguards and test coverage. Mode: AUDIT_AND_DESIGN. Application code and data unchanged. No browser actions by this reviewer; parent audit owns runtime verification. No Figma used.

This is supporting evidence for `PRODUCT-DESIGN-BRIEF.md`, not a second authoritative IA. Requirements/inventory context is the user-supplied HTML as reconciled in the brief, plus local inventory M07 and connected M04/M08. Inventory assertions were treated as leads. Source inspection and focused automated tests do not establish a 100% correct editor.

Applicable guard references read: preservation/evidence, quality gates, ownership/architecture, geometry/density, navigation/interaction and editor behavior. Geometry was not measured in this bounded review; server authorization, saved-project roundtrip, published output and collaboration races remain unverified here.

## Existing foundations to preserve

| Capability | Current source evidence | Status |
|---|---|---|
| Selection-scoped inspector, page context and special theme-toggle inspector | `src/editor/inspector/ProInspector.tsx:110`, `:315`, `:317` | Located in source; runtime not run here |
| Three tabs with capability-based section filtering | `config/sectionOrder.ts:15`, `tabs/InspectorTabContent.tsx:75` | Located in source |
| Live style writes; flush before property/batch/element/breakpoint/state changes | `hooks/useStyleHandlers.ts:103`, `:123`, `:134`, `:261` | Focused tests passed; cross-state races not exhaustive |
| Common multi-target style write in one transaction, locked-member filter | `hooks/useStyleHandlers.ts:306`, `:345`, `:404` | Focused tests passed |
| Separate breakpoint, pseudo and component-master override removal | `hooks/useFieldOverrides.ts:179`; `src/engine/styles/StyleEngine.ts:266` also removes stored breakpoint metadata | Focused tests passed for existing covered scenarios |
| Locked/conflict explanatory state plus reusable read-only controls | `ProInspector.tsx:229`, `components/StatusLine.tsx`, `shared/controls/InspectorFieldContext.tsx` | Present; specific bypasses below |
| Contextual component master destination and instance return identifier | `sections/ComponentRow.tsx:129`; `src/editor/sidebar/tabs/component-library/openMasterRequest.ts:26`; `useComponentsState.ts:170` | Targeting/return tests passed; full snapshot continuity not established |
| Token chip targets exact Brand token | `shared/controls/ColorInput.tsx:167`; `src/editor/design-system/ui/brandOpenRequest.ts:21` | Located in source; full return/focus not tested |
| CMS compatible-field filtering, list/template/pinned-record distinctions, reconnect/unbind | `sections/CmsBindingSection.tsx:123`, `:136`, `:195` | Focused tests passed; async mutation safety and detailed load errors incomplete |

Paths without `src/` in this report are relative to `src/editor/inspector/`.

## Findings and proposed corrections

Severity describes user impact if encountered. Confidence describes the inspected evidence; neither is a claim of browser reproduction. Effort is unestimated. All corrections remain proposed and not implemented.

### IFL-01 — Inspector read/reset model differs from responsive render cascade

**Severity: High. Evidence: high-confidence source mismatch; runtime not run by reviewer.**

`src/engine/commands/commandOperations.ts:254–261` resolves element base plus only the exact active breakpoint. `config/cssContext.ts:54–68` adds only the exact breakpoint's pseudo rule. In contrast `src/engine/styles/StyleEngine.ts:689–706` explicitly applies Tablet then Mobile rules for Mobile canvas, and emitted max-width media queries overlap (`src/shared/constants/breakpoints.ts:52–58`). `useStyleHandlers.ts:207–211` places this authored map above computed fallback, so an authored desktop value prevents rendered Tablet inheritance from correcting the inspector readout. `OverrideDot.tsx:37` always calls breakpoint reset “Reset to Desktop”.

**Reproduce:** heading desktop size 48px, Tablet 32px, no Mobile override; switch Mobile. Compare visible size, inspector size and saved effective value. Then Mobile 20px → remove Mobile override. Expected rendered/read value is 32px with source Tablet, not a promise of Desktop. Repeat desktop `:hover` with a narrow breakpoint lacking own hover rule.

**Required contract:** preserve the actual desktop-first authored cascade; define resolved value and exact source layer for each property. Removing the current override reveals the next applicable source. Label `Remove Mobile override` with fallback preview/name; do not set an explicit desktop value. Source resolution must cover responsive and state rules in the same precedence as renderer/output; do not invent a simple merge that ignores CSS specificity or token/class resolution. Acceptance compares Inspector, canvas, preview and output for desktop→tablet→mobile normal/state combinations.

### IFL-02 — Read-only conflict protection is inconsistent across mutations

**Severity: High. Evidence: high-confidence direct source paths; runtime not run here.**

`ProInspector.tsx:229` computes conflict/locked readOnly, but `ContextRow.tsx:123,131` Reset/Revert buttons receive no read-only flag and call `useFieldOverrides` through `runDiscrete` (`ProInspector.tsx:375,378`). The underlying `writeElement`/`writableElements` gate checks only element locks (`src/engine/commands/commandOperations.ts:195–235`), not conflict. CSS class Remove (`sections/CSSClassesSection.tsx:66–74,126–129`) similarly has no field readOnly check. `MultiSelectBar.tsx:64–103` align/distribute also do not consume InspectorFieldContext. These paths contradict the inventory's blanket “every control refuses change during conflict” claim.

Pending style flush is another risk: `useStyleHandlers.ts:237` checks blocked when an edit is queued; the delayed closure `:306–324` checks existence/locks only. A conflict arising within the 50ms write interval can allow that queued mutation to land. Do not solve by silently discarding the user's last valid input; preserve it as blocked local input until resolution policy permits a commit.

**Required contract:** one mutation-time eligibility boundary for inspector actions, including queued callbacks, resets, media selection, binding callbacks, menus and keyboard actions. Navigation/inspection may remain usable. Explain blocked reason without claiming a save succeeded. Restrict according to effective permissions as well as locks/conflict; server endpoints still enforce authorization independently. This review does not establish a server authorization exploit.

**Acceptance:** enter save conflict after a valid queued edit; try reset, class removal, align, media pick completion, binding completion and direct mutation commands. No new authored mutation after the blocking boundary; user draft retained. Resolve then explicit/reconciled continuation. Repeat lock/revocation while a picker is open.

### IFL-03 — Multi-selection promises more scope than some controls implement

**Severity: High. Evidence: high-confidence source contradiction; runtime not run here.**

`components/MultiSelectBar.tsx:113–114` says “Edits apply to all N. One Undo restores all N.” Shared style handlers satisfy this, but Link/CSS classes/CMS binding/interactions adaptors use only `selectedElement` (`sections/registry/behaviour.tsx:33–50,151–173,196–207`). The component row also receives only primary ID (`sections/registry/component.tsx:18–22`). No general multi-selection exclusion exists in `visibleSectionIds` (`tabs/InspectorTabContent.tsx:75–83`). Override dots, counts, Reset and Revert also use only primary `selectedElement.id` (`ProInspector.tsx:226`, `hooks/useFieldOverrides.ts:147–183`).

**Required contract:** each control declares read set, write set and eligibility. Batchable property edits apply atomically to explicit eligible IDs; bulk reset removes each element's own matching override and preserves different fallback values. Single-object workflows such as component master navigation/CMS source editing must show a named target or require single selection. Do not silently batch actions with different semantics, or remove a usable single-selection capability. Show “2 editable · 1 locked” rather than claiming all 3 change.

**Acceptance:** two links with different destinations; two CMS text elements; two components; two Mobile overrides; mixed locked/unlocked selection. Inspect scope label, perform one action, undo once; affected IDs must equal the stated set. Changing selection order must not silently change the operation contract.

### IFL-04 — Mixed values cover CSS keys but not all batch-authored content/settings

**Severity: High for unintended batch replacement; evidence high-confidence source gap, runtime not run here.**

Style mixed-values use `shownStylesAt` (`shared/detectMixedValues.ts:41–49`). Attribute `PropertyRows` reads primary values only but writes all target IDs (`sections/typeBlock/PropertyField.tsx:177–203`). Its fields lack a property/mixed model. Heading level, button type and disabled state also read only primary and write all (`sections/typeBlock/bodies/textBodies.tsx:45–57,87–115`). E.g. H1+H3 can display one selected level rather than Mixed.

The CSS comparison also omits rendered fallback that the single-selection hook uses; token aliases/literals with the same result and class/inherited styles need explicit source-versus-value semantics rather than string equality being called full rendered equality.

**Required contract:** two separate concepts: resolved-value agreement and source agreement. Display `Mixed` for divergent semantic values (including indeterminate booleans); show “Same value · different sources” when useful. No writes on focus or merely reading the selection. One intentional input applies the explicit common value in one history transaction; reset removes individual overrides rather than copying primary fallback.

**Acceptance:** H1/H3, disabled/enabled buttons, differing alt text/URLs, inherited versus local equal font size, same-value different tokens. After applying a value, Undo restores each original independently.

### IFL-05 — Local field snapshots can remain stale after undo/external changes

**Severity: Medium–High. Evidence: source risk; end-to-end reproduction pending.**

Component row captures component/variant state in an effect keyed only by composer and element ID (`sections/ComponentRow.tsx:61–69`), then optimistically sets picked variant. It does not subscribe to instance-variant, sync, reset or history events. Generic PropertyRows reads in an effect keyed composer/ID/type/rows (`PropertyField.tsx:180–189`), not element/history changes. Link's attribute event handler only triggers render, while the href/target snapshot effect still depends only on composer and selected ID (`LinkSection.tsx:85–96,118–148`). A parent rerender alone does not guarantee those effect-backed values reread when dependencies are stable.

**Required contract:** distinguish active text draft from canonical value. On undo/redo/external edit, refresh non-dirty fields from authoritative state. If a field has active input, retain draft with a conflict/changed-source indication rather than silently overwriting. Target-key all field state to project/page/selection/property/scope; do not rely on the user deselecting and reselecting.

**Acceptance:** edit URL/alt text/variant, Undo while selection stays; verify field, canvas and engine immediately agree. Repeat external component sync and deleting the referenced master. Test user dirty input separately.

### IFL-06 — Token colour editing lacks visible Light/Dark write scope

**Severity: Medium–High. Evidence: high-confidence hardcoded source scope; dark runtime consequence unverified.**

`ColorInput.tsx:102–106` resolves colour token picker values with `"light"`; `src/editor/design-system/ui/colors/useUpdateColorEverywhere.ts:30` sets the token's `"light"` literal unconditionally. Shared “Update everywhere” operation otherwise correctly goes through the Brand token owner. A dark-mode canvas needs an explicit source/mode distinction before the operation can confidently promise the displayed result.

**Required contract:** display authored colour mode scope next to shared token editing; inspector preview should resolve the active site preview mode. `Only this element` writes local value for explicit current style scope; `Edit shared token` identifies token, Light/Dark mode and affected usages before commit. Preserve aliases and unset/inherited dark behavior rather than silently replacing it. ReadOnly failures must not dismiss as success.

**Acceptance:** a token with different Light and Dark values, active Dark preview; inspect swatch, unlink, local edit and shared edit; undo; reopen in both modes. Effective mode and written mode agree or are explicitly disclosed.

Additional source-state risk: ColorInput's relink memory is keyed only by matching literal (`:148–154`), not element/scope. Two different elements sharing the literal could show an unrelated relink offer after selection changes. Key the offer to original project/element/property/breakpoint/state; test A unlink→B same literal.

### IFL-07 — Async CMS bind and asset completion need complete revalidation

**Severity: High potential stale mutation; evidence source risk, runtime not run here.**

`CmsBindingSection.tsx:197–211` checks writable before loading records, then `.then(bind)` commits without rechecking lock, conflict, current request generation or target existence. `CMSBindingManager.bindToField` only refuses unsupported types when the target's type is defined (`src/engine/cms/CMSBindingManager.ts:185–186`); undefined/deleted target is not an explicit refusal there. The inherited `src/engine/data/BaseBindingManager.ts:84–106` writes the binding map before application without a target-existence guard, so the concern continues past the delegate. A late request could also restore an older binding after a newer choice. Record-list loading at `CmsBindingSection.tsx:156` lacks local rejection handling, while preview failures at `:189` collapse to null instead of a retryable error.

Media selection captures original target IDs, which correctly avoids blindly applying to a newly selected object (`SourceRow.tsx:125–133`), and rechecks existence/lock through writableElements. It still needs conflict/permission checking and explicit treatment of a partially invalidated multi-target set at commit.

**Required contract:** operation token contains site/page/target IDs/property/source choice and original scope. Completion only commits current request after eligibility and dependency checks. A deleted/restricted target produces an actionable state. Cancelled/stale requests never commit. Separate “loading”, “no records”, “record unavailable” and “load failed — Retry”. Preserve bound reference while a replacement is being selected; only explicit unbind disconnects.

**Acceptance:** slow records request, choose field A then B; resolve A last. Delete/lock target before completion. Close picker/change selection then complete original request. No old choice supersedes current intent, no orphan binding, no new target receives old result; retriable errors retain work.

### IFL-08 — Context jumps have targeted destinations but incomplete return snapshots

**Severity: Medium. Evidence: partial source, shell-wide continuity not fully traced.**

Master jump carries component ID plus instance ID; `useComponentsState.ts:195–204` Back selects instance and exits detail, but does not itself restore page, previous panel/tab, breakpoint/state, zoom/position, focus or draft. Brand token request carries only token ID (`brandOpenRequest.ts:21`). Those items may remain mounted/preserved incidentally; this is not proof they are lost. Shell-wide runtime verification is required.

**Required contract:** preserve context snapshot before a jump, navigate to exact token/component/record, show shared scope, commit through that resource's owner and return to named origin. Pending valid live edits settle before navigation under their original target/scope. Invalid draft stays attached to that field. Deleted origin gets explicit “Original element no longer exists” with safe page return. `Edit master` currently means management/update-from-selection, not direct master canvas authoring; rename to truthful management wording unless real definition-edit mode is designed.

**Acceptance:** element Mobile :hover, scrolled inspector and zoomed canvas → token/master/record → back; all applicable context and focus restored. Repeat with target deletion, locked selection, invalid input, failed resource save.

### IFL-09 — Parent CSS context can incorrectly inherit the child's simulated state

**Severity: Medium. Evidence: source assumption; runtime not run here.**

`config/cssContext.ts:112` computes parent styles using the selected child's current pseudo state. A child authored state does not universally mean the parent has the same authored state, especially focus/active/disabled. This can alter flex/grid item control eligibility incorrectly. Actual pointer hover can match an ancestor too; that does not justify universally propagating every pseudo-state. Existing test `cssContext.effectiveStyles.test.ts` explicitly expects a parent's :hover style when the child is being inspected in :hover, so a passing test is not proof this is a complete interaction model.

**Required contract:** distinguish selected-object simulated state from actual/explicit parent context. Resolve layout eligibility from actual parent effective layout or a documented simulation scope. Do not disable useful child controls on an assumed ancestor state. Acceptance covers parent grid/flex normal and state rules with child hover/focus states.

### IFL-10 — Multi-align/distribute uses base numeric geometry and bypasses style scope

**Severity: High. Evidence: high-confidence source path; runtime not run here.**

`src/engine/canvas/AlignmentHandler.ts:45–66` derives geometry with `parseFloat` from base styles, assuming default width/height 100, rather than resolved bounds. A width `50%` becomes 50 without a unit conversion. `:216–225` writes direct base `left`/`top` with no lock check, breakpoint scope, pseudo scope or layout eligibility. `MultiSelectBar.tsx:64–103` calls this handler directly. On responsive or flow layout selections this can do nothing visibly, alter the base unexpectedly, or write locked members; the existing style-handler lock tests do not cover this independent path.

**Required contract:** define Align reference space and eligible layout modes first. Flow layout uses container alignment controls; positioned selections align in a measured common coordinate system with explicit current breakpoint scope. Unsupported selections receive a reason and a path to the appropriate layout control. Do not silently set absolute positioning. Filter/announce restricted members and use a discrete grouped transaction that does not merge with prior typing.

**Acceptance:** Mobile positioned elements with desktop offsets, differing containing blocks, `%`/auto/token width, static-flow elements, locked member, conflict state. Check visible result, stored layer and each affected ID, then one Undo. This is an essential flow correction, not a request for an unrelated freeform-canvas feature.

## IA and grouping recommendation

Fix ownership/scope/read/write contracts before treating extra tabs as the solution. Current three-tab arrangement mixes type-specific semantic content into Style and CSS classes into Behaviour. A fourth Content tab is justified as a **proposal**, because existing source/alt/text/field/slide/CMS tasks form a coherent set; it is not a requirement to invent new content editing capabilities.

| Surface | Proposed ownership | Existing capability preserved |
|---|---|---|
| Persistent selection header | Element identity/breadcrumb, one-versus-many target, component instance identity, lock/conflict/binding status | Header/status/component linkage remain discoverable across tabs |
| Content | Existing type-specific semantic fields, media source/alt, heading level, form field definitions, slides, CMS bindings/list source, advanced element attributes | Existing on-canvas text edit remains; do not replace with unrequested textarea |
| Style | Layout, typography/type style application, size, spacing, fill, border, responsive/state sources and attached CSS classes | Class apply/remove remains; full shared class style authoring is not assumed implemented |
| Behaviour | Link destination/target, form after-submit, playback, device visibility, triggers/actions actually supported | Distinguish authored interaction from pseudo-state appearance; engine-only actions separately classified |
| Effects | Opacity, shadow, filter, transform, transition and existing advanced effect controls | Preserve existing Effects destination to avoid unnecessary relearning |
| No selection/page root | Explicit `Page appearance` scope plus existing page fill/width/type/spacing | Page settings remain separate owner; do not silently move their data into site settings |

Content and Style split the current Type block deliberately: heading **level** is semantic content, heading **font size/type token** is style; media **source/alt/loading** are content/settings, **fit** is visual style. Do not move a mixed Type block wholesale and leave scope contradictory. Component instance header should remain visible when switching tabs, with definition management contextual. Generic advanced attributes retain useful current values and validations.

Alternatives considered: (1) keep three tabs and rename/reorder sections — lower relocation cost but retains mixed content/style owner problem; (2) merge Effects into Style and add Content — three tabs but much longer Style and removes familiar separate Effects surface; (3) four tabs with clear task groups — preferred proposal if parent geometry evaluation confirms fit and labels remain usable. A detailed width/height specification is owned by the main audit; no measured layout readiness claimed here.

## Shared control acceptance contract

Every material field identifies target set, effective value, source, write scope, commit timing, reset operation and recovery. Distinguish empty, explicit zero, inherited, token-bound, overridden and mixed. Preserve unsupported-but-valid saved CSS strings when a simplified control cannot represent them; do not coerce them to zero. Live typing/scrubbing coalesces by explicit interaction unit; discrete select/reset/picker actions form separate meaningful history steps. A changing selection membership must settle a pending operation before new-target input can supersede it.

Use one history unit for all eligible batch targets. Recovery text states exactly what was reverted. Save status belongs to confirmed persistence, not simply optimistic field state. Input errors remain near the field; keyboard navigation and Escape must be target-safe and return focus. Shared changes name affected scope; multiple entry points call the same owner operation. These contracts are design proposals requiring implementation and paired tests, not claims of current conformance.

## Focused existing-test results

Executed in editor package using installed `npx vitest run` (reported Vitest v4.1.2). No test files changed.

1. Nine files, **56 tests passed**: `hooks/__tests__/useStyleHandlers.{pendingFlush,multiTarget,locked,responsive,stateReset}.test.ts`, `hooks/__tests__/useFieldOverrides.test.ts`, `components/__tests__/ProInspector.p4States.test.tsx`, `sections/__tests__/ComponentRow.test.tsx`, and `src/editor/sidebar/tabs/component-library/__tests__/ComponentDetailScreen.backToInstance.test.tsx`. Duration 12.09s.
2. Nine files, **76 tests passed**: `shared/__tests__/detectMixedValues.test.ts`, `sections/__tests__/CSSClassesSection.{write,refresh}.test.tsx`, `sections/__tests__/LinkSection.write.test.tsx`, `components/__tests__/ContextRow.test.tsx`, `config/__tests__/cssContext.effectiveStyles.test.ts`, `shared/controls/__tests__/ColorInput.bindingChip.test.tsx`, `sections/typeBlock/__tests__/SourceRow.test.tsx`, `sections/__tests__/CmsBindingSection.test.tsx`. Duration 8.35s. Five jsdom `HTMLCanvasElement.getContext()` not-implemented warnings were emitted; suite exit 0. No visual canvas assertion claimed.

Total unique scope: **18 existing test files, 132 passing tests**. Passing tests protect existing covered cases; they do not cover all source gaps above. Some test comments still mention an old 300ms debounce, while implementation uses 50ms; avoid treating their prose as current timing evidence.

Runtime/keyboard/screen-reader, complex-project performance, server permissions, offline/conflict races, save/reopen, editor/preview/output parity and cross-workspace component behavior: **NOT RUN by this reviewer**. Proposed corrections and fourth-tab grouping: **PROPOSAL**, not design-ready or implemented.
