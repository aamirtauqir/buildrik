# Prototype QA — 22 October 2026

**RESUMED — native playback is running.** The dedicated player now renders and accepts interactions. Current completed suites: editor47/47 click routes, CMS9/9,12 distinct text keyboard routes, and three actual downward-scroll checks. The original class289/289 run exposed a component-version context issue during visual review; four corrective fixtures now expand the class graph to300 routes, with15 new/changed routes awaiting replay. Original714-route journeys and final review remain in progress. The historical browser blocker below is superseded for the recovered session. User authorized the next prototype QA step with “karoo is ko”. This does not authorize app implementation, deployment or participant outreach.

[Current Figma review hub](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=423-100464) · [class fixtures](https://www.figma.com/design/2L9OTGzBrL6kYmU18yA1c7?node-id=415-61494) · [independent review](../figma-design-execution/qa-20261022-review.md).

## Corrections made and independently rechecked

| Finding | Correction | Evidence |
|---|---|---|
| Invalid-name recovery discarded class and Tablet context | CF08 now uses the suggested name in CF72 (`433:50940`), retaining the draft's target/scope. Explicit Create hero reaches CF73 (`433:51230`); empty combo inherits the base class and Undo restores the previous membership. | `class-route-fixes-ledger.json`, independent QA-CF1 |
| Restore previous definition entered a Push operation | CF62 now reaches CF74 (`433:51611`), describing the previous36px definition, all3 instances and preserved local overrides. Restore/Cancel are disabled during pending; no server success is fabricated. | QA-CF2 |
| Effects selector changed surrounding tab/content | CF53 retains the actual Effects Inspector; Close returns to the same Effects origin. | QA-CF3 |
| Existing exact-match class offered duplicate Create | Keep Use is-large; hide the competing Create action and remove its reaction. | QA-CF4 |
| Canvas typography jumped during navigation or confirmation | Align23 affected heading specimens with the unchanged authored value and displayed98% Tablet zoom; CF19 inheritance now displays48px matching its Desktop source. Root overrides, reset and Move retain their respective40/36/40px values. | `typography-fixes-ledger.json`; QA-CF1-V; source/root/reset visual samples |
| History-origin toolbar contradicted Tablet rendering | CF46/60 now display Tablet,768px and98%. | `history-viewport-fixes-ledger.json`; QA-HISTORY-V |
| Nested text Link dialog had ambiguous Escape ownership | SC-2 explicitly handles the nested field/overlay before committing the parent inline-text edit. Cancelling Link preserves the parent draft. | `panels/00-SHARED-CONTRACTS.md`; independent specification review, not keyboard execution |

## Geometry, hierarchy and navigation

CF75 (`439:51387`) shows the class manager at1280×720 with collapsed Brand navigation and a632px work-area scroll viewport (774px content). CF76 (`439:51578`) shows1440×600 with512px viewport (726px content). CF77 (`439:51767`) exposes the narrow Brand navigation; actual Classes and Close controls return to CF75. The Classes page heading remains inert.

Independent screenshots show readable names, selected class, primary Edit shared styles, Manage class and Used on groups. Header/footer remain outside the work-area scroll. Other controls on these viewport specimens are static examples. Actual downward scrolling has now been executed and visually checked for CF71/75/76: lower controls become visible while the header/footer remain stationary. Keyboard scrolling and retained scroll position are not established.

## Component context correction during playback review

The pre-push master36/local40 state and post-push master40/local40 state previously shared one detail/return destination. This could make Reset restore an obsolete36px value after a successful Push. Existing local overrides must remain after Push; the correction does not silently normalize or clear them.

| State/action | Correct destination and value |
|---|---|
| CF16 Open component | CF78 (`462:51685`), current master36, selected instance local40; both return controls → CF16 |
| CF18 Back; both CF51 return controls | CF79 (`462:51821`), master40 and retained local40 |
| CF79 Reset local override | CF80 (`462:52099`), no local override, inherited40; appearance stays unchanged |
| CF80 Undo | CF79, restoring the local40 override |
| CF79 Inspect heading child | CF81 (`462:52381`); Select Hero instance root → CF79 |
| Pre-push Reset | Existing CF69 remains no-local36, Undo → CF16 |
| Component versions | CF51 current40/previous36; CF62 review and CF74 restore-pending retain their existing post-push context |

Push is disabled on CF79 because the retained override matches the current master; the visible explanation says there is nothing new to push. This is a designer-selected no-op eligibility refinement, not a new permission or automatic override removal. CF78's unavailable earlier-history branch is disclosed as a scenario limitation. CF80's Inspect/Open controls remain static, as on its existing CF69 source specimen. No master-editing canvas or service success is invented.

The four corrective fixtures reuse native frames, existing component instances, Inter/Geist Mono and existing dimensions. Native readback finds no image-filled nodes. Independent full desktop screenshots found no clipping, hierarchy or status contradiction in this correction. New and changed click routes still require playback. Evidence: `component-context-fix.json`, `component-context-readback.json`, `native-sample-corrections.json`.

Other resumed-run corrections:14 rate-limit/offline recovery controls now fit within their1440px frames; CF53 selector close returns to CF02 instead of itself; twelve native text keyboard reactions are configured; two review-hub links now open the prototype player; duplicate helper labels are hidden on CF46/60. Existing routes and named values are preserved except for these explicitly corrected destinations.

## Current structural coverage

| Export | Roots inspected | Reachable from its current hub | Connected control reactions in reachable scope | Invalid reachable destinations |
|---|---:|---:|---:|---:|
| `class-controls.json` |82|82|300|0|
| `editor-controls.json` |19|15|63|0|
| `cms-controls.json` |4|4|9|0|
| `journeys-controls.json` |236|223|714|0|
| Reachable total |—|324|1,086|0|

Each export records current source/control/destination, trigger, visibility and relative center/bounds for subsequent playback. `*-reachability.json` records the exact traversal sets. These are native reaction inspections, **not successful clicks or exhaustive semantic acceptance**. Four separately inspected page-creation fixtures add22 control reactions outside DE00's reachable set; Blank/template routes remain as recorded in the previous pass.

The broader Play journeys page also contains13 older standalone viewport/reference roots outside the current hub. Two inherited cross-page NODE reactions on old BD25 compact Pages fixtures (`78:19785`, `78:20392`) target `63:13820`; these are flagged in the raw graph and excluded from the zero-invalid **current-hub** count. They are not certified as playable by this pass. No claim of whole-file link cleanliness is made.

## Earlier browser attempts and blocker (historical)

1. Existing isolated `browse` session initially failed local port binding in the sandbox; rerun with approved escalation successfully navigated to the canonical hub (HTTP200).
2. Both subsequent viewport/interactive inspection commands failed: daemon process alive but `/health` unresponsive after about8s. No actual product control or transition was available to verify.
3. Fresh Google Chrome through REA `capture_browser_scenario` reached TX01 URL and waited10s. The captured1600×1100 image still showed Figma's loading screen. Accessibility capture contained player chrome, “Loading”, and Figma's screenreader-support-disabled message, not the editor control tree. The provider subsequently reported timeout with `cleanup_incomplete` for browser transport/profile; cleanup could not be confirmed. No fresh launch was repeated after that non-retryable result.

See `fresh-browser-limitation.json`. **New native pointer transitions verified in that earlier attempt:0.** Previous playback logs remain unchanged; URL navigation and wait completion do not count as product interaction passes. The captured loading-stage accessibility tree neither proves nor disproves the designed editor's accessibility.

## Exact remaining work

- Replay the original two-comment OPEN and RESOLVED approval plans (30 unique edges each, previously uncovered), including cancellation, resend failure/retry, rate limit, offline return and receipt. Plans remain in `../article-skill-workflow-2026-10-21/approval-plan-second-open.json` and `approval-plan-second-resolved.json`.
- Execute current CF/TX/RE/RL paths in a responsive player: corrected-name create/Undo, Move Cancel/Undo, Restore pending, conflict/stale backup, source and manager exact return; text link Cancel/Apply/Done/Undo; H1 fix/Undo; CMS and narrow navigation. Inspect actual rendered state after each transition, not merely its URL.
- Native keyboard/focus, assistive technology, actual scrolling and all remaining branches are NOT RUN. The earlier43/43 local keyboard specimen remains a separate historical result.
- Runtime services/application implementation and R1/B9 real participants remain outside the evidence achieved here. No invented interviews or application verification.

All concrete findings raised by the independent reviewer in the inspected correction scope are closed. **The earlier attempt stopped before playback. The resumed run above supersedes that blocker; its final scope will be recorded here when verification ends.**
