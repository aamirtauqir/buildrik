# R45 — Visibility, Display and property-origin contract plan

14 October 2026. Source-backed next task from R40 queue item 4, with fresh read-only native inspection of Shared Style and the Heading/Image roots. No Figma, application, test or register edits; no browser playback or source tests run. Only this plan was written. Proposed finite behavior is not production parity. All 14 module gates remain OPEN.

## Decisions before authoring

Keep three concepts separate: **Show on [device]** controls a named device band through a global base flag; **Display** is a scoped CSS declaration; the **Layers eye** only dims the editor. A checked Show on Mobile flag means that this flag does not hide the element. Display None, an ancestor or another rule can still hide it. Never implement Show on Mobile by writing Display Block, or use the Layers eye to erase responsive styles.

Use one Heading and one Image as independent finite targets. Reuse the existing controls and repair their eligibility/selection routes. Preserve R38 typography, Image replacement/fit and all shared Style caller persistence. A Tablet Display fixture is necessary before claiming Mobile inheritance; the current two-device prototypes cannot establish it.

## Verified source contracts

| Source anchor | Fact and design implication |
|---|---|
| `src/editor/inspector/sections/VisibilitySection.tsx:39`, `:64` | Only exact `--hide-<device>: "true"` means hidden; shown writes empty, which removes the declaration. Missing/other values read as shown. This is not CSS `visibility:hidden`. The three checkboxes do not supply individual property keys to field context, so no mixed-property state is established by this section. |
| `src/editor/inspector/hooks/useStyleHandlers.ts:251`–`:283` | Single-property writes beginning `--hide-` always use Desktop/base and normal state, regardless of the active device/pseudo-state. Display follows the actual active breakpoint and pseudo-state. Flags must not acquire Mobile-override or `:hover` origin labels. |
| `src/engine/export/ExportEngine.ts:152`–`:161`; `src/editor/canvas/Canvas.css:776`–`:790` | Named flags use disjoint bands: Mobile ≤767px, Tablet 768–1023px, Desktop ≥1024px. Canvas keys off the preview device; Wide uses Desktop. The result is `display:none!important`. Hiding on Tablet by flag does **not** also hide on Mobile. |
| `src/shared/constants/breakpoints.ts:54`; `src/engine/styles/StyleEngine.ts:685`–`:709` | General responsive CSS is overlapping Desktop-first: Tablet ≤1023px, then Mobile ≤767px. Canvas preview explicitly emits Tablet rules before Mobile rules. A Tablet Display declaration can apply to Mobile unless Mobile overrides it. |
| `src/engine/commands/commandOperations.ts:251`–`:258`; `src/engine/styles/StyleEngine.ts:248`; `src/editor/inspector/config/cssContext.ts:53`–`:69` | Inspector effective-style reading merges base plus only the current breakpoint, then only the matching pseudo rule. It omits Tablet's intermediate contribution on Mobile and does not model a complete pseudo cascade. This can misreport the rendered value and origin. Correct finite Tablet inheritance is a proposed design correction, not source parity. |
| `src/editor/inspector/sections/layout/DisplayControls.tsx:22`–`:48` | Main choices are Block/Flex/Grid/None; advanced choices include Inline block/Inline/Inline flex/Inline grid. The advanced selector's Off writes Block, not an absent declaration. Restricting a finite hide/recover task to Block/None does not remove the existing other modes or establish their full behavior. |
| `src/editor/inspector/hooks/useFieldOverrides.ts:103`, `:155`–`:183` | Breakpoint reset deletes only that breakpoint property. Pseudo reset replaces the specific pseudo rule without the selected property. Master reset is a separate component operation. Reset does not force Block or clear other scopes; Mobile reset may reveal Tablet None and leave the element hidden. |
| `src/editor/inspector/hooks/useStyleHandlers.ts:117`, `:287`–`:303`; `src/engine/HistoryManager.ts:203`–`:205` | Discrete actions flush pending history; writable targets are re-read and grouped in a transaction; empty patches are dropped. These facts do not prove no-op handling, atomic rollback or exact mixed-target Undo. Explicitly pinning an inherited value can change storage despite identical effective output. |
| `src/editor/panels/layers/hooks/useLayerActions.ts:120`–`:145`; `src/editor/canvas/Canvas.css:280`–`:283`; `src/editor/panels/layers/LayerTreeItem.tsx:346`–`:369` | Layers eye persists editor-local hidden IDs and sets DOM `data-hidden`, producing opacity .25 and pointer-events none. Copy correctly says “Dim in editor — the element still publishes.” It does not write document Display/flags or establish document-history Undo. |
| `src/editor/panels/layers/hooks/useLayerSelection.ts:68`–`:108`; `src/engine/SelectionManager.ts:44`–`:63` | Layers selects the element by ID through Composer; the selection method has no computed-display visibility filter. Hidden elements remain in the document tree. This supports a recovery route, but does not prove rendered selection outlines, scrolling/focus or retention across all hidden/ancestor states. |
| `src/editor/inspector/sections/registry/behaviour.tsx:176`–`:184` | Current application Visibility is in Behaviour, while the improved Figma's existing controls are in Shared Style. Record this ownership difference; do not claim the prototype mirrors the current source tab arrangement. |

The named-flag writer's base-only exception applies to its single-property path. The generic batch style path (`useStyleHandlers.ts:340`–`:362`) is scoped and has no equivalent exception: a future bulk reset must intentionally remove the base flags instead of passing them through a generic Mobile/pseudo batch. Imported flags stored in the wrong scope remain a migration/validation gap.

## Fresh native reuse map

All IDs below were read on page `8463:2`; these are pre-authoring observations, not accepted visibility output.

| Existing control / route | Native finding and next action |
|---|---|
| Shared Style `8841:14864`; panel `8841:14865` | Keep one shared panel. Header copy `8841:14871` already says to check each property's breakpoint and origin. Context `8841:14880` binds `VariableID:8905:17347`; it describes authoring context, not every property's origin. |
| Visibility disclosure `8841:15282`; body `8841:15284` | Body uses open flag `VariableID:8841:15285`. Reuse it; add explicit named-device scope/result copy rather than a second visibility editor. |
| Desktop `8841:15289`, Tablet `8841:15294`, Mobile `8841:15299` | Currently only toggle shared Yes/No strings `VariableID:8841:15287`, `15292`, `15297`. No output binding, guard, snapshot or origin behavior is present in these actions. |
| Display `8841:14889`; chooser `8844:264650` | Reuse chooser options Block `8844:264653`, Flex `264656`, Grid `264659`, None `264662`, Cancel `264665`. Existing options set `VariableID:8841:14887` and Flex/Grid eligibility booleans; they do not create breakpoint-specific Display state. |
| **Layout disclosure `8841:14882`; body `8841:14884`** | Header is bound to `inspector/layout` (`VariableID:8841:14862`), initialized false by Heading and Image. **Entire body is bound to Gap eligibility `VariableID:8886:17434`; Block/None set this false.** Repair the body/disclosure gate or relocate the existing Display row into an independently eligible container. Display must remain reachable when None/Block is selected; do not expose every Flex/Grid field just to reveal Display. |
| Heading root `8843:16808`; Style `8843:17016` | Existing entry loads caller `heading`, context and type-specific state. Selected specimen `8843:17107`; website `8843:17103`, viewport `VariableID:8843:17104` (720/375). Specimen has no visibility binding. |
| Heading Desktop `8843:16842`, Mobile `8843:16843` | Existing reactions also drive R38 typography; preserve them. Context text `8843:16844`, `16872`, `17024` shares `VariableID:8905:17366`. No Tablet button was found in the inspected root. |
| Image root `8843:20467`; Style `8843:20675` | Preserve existing image-specific initialization. Selected specimen `8843:20778`; website `8843:20774`, viewport `VariableID:8843:20775` (720/375). Specimen has no visibility binding. |
| Image Desktop `8843:20501`, Mobile `8843:20502` | Context text `8843:20503`, `20531`, `20683` shares `VariableID:8905:17554`. No Tablet button was found. Add a clearly bounded Tablet preview only with appropriate scope handling; do not silently pretend R38 typography/other families gained Tablet support. |
| Heading Layers `8843:16824`; Image Layers `8843:20483` | Both currently navigate to generic root `8465:2`, not an identity-preserving hidden-target recovery task. |
| Heading layer row `8843:16833`; Image inherited row `8843:20492` | Both display “Heading” and have no reaction on the row/ancestors before the page. Reuse Heading row as its actual target and rename/reuse the Image row as Image, with real selection/context recovery. Image must not navigate to a Heading sample. |
| Heading selection-count entry `8843:16837`; Image `8843:20496` | Both still say “3 selected elements” and navigate to mixed root `8465:12`. Correct the finite single-target story when authoring; retain mixed selection as its own explicit unsupported/proven state. |
| Close `8841:14868`, Back `8841:15383`, Shared root Escape | Each retains caller-specific copies of Display and the three flags, among 220 inspected shared→caller copies for these four properties across families. Preserve conditional caller branches and all unrelated persistence. Do not append unconditional writes into both Heading and Image. |

Existing Heading storage aliases are Display `VariableID:8847:16507`, Show Desktop/Tablet/Mobile `VariableID:8847:16580` / `16581` / `16582`. Image uses Display `VariableID:8847:17431`, flags `VariableID:8847:17504` / `17505` / `17506`. Display defaults to Block and flags to Yes in these samples. These are one-value-per-family aliases, **not** an existing three-breakpoint Display model. Retain compatibility with shared entry/exit copies when introducing scoped state; otherwise a close/reopen can overwrite or resurrect the old value.

## Executable finite contract

Use normal-state Heading and Image fixtures with independently stored base Display plus optional Tablet and Mobile Display declarations, each with presence/value, and three base named hide flags. Keep target identity/generation, target revision and recovery ownership separate from active device and editor-only selection. Neither hiding mechanism deletes the element or changes text, media, dimensions or typography.

Effective normal Display is Base → Tablet → Mobile for the current device. Compute a separate result from the named flag. Example: base Block, Tablet None, Mobile absent gives **“None · Inherited from Tablet”** on Mobile. Show on Mobile can still be checked; explain **“Hidden by Display at Tablet.”** Restoring that checkbox cannot remove the Display cause. A base parent-hidden fixture, class/import rules and the complete pseudo cascade can remain explicit unsupported leaves.

Suggested copy:

- Named flags: “Show on devices” and “Each choice affects its named device, regardless of the preview.” A row reports “Hidden on Mobile by device visibility” when its flag is responsible.
- Display: “Mobile · Override” / “Mobile · Inherited from Tablet” / “Desktop · Base” / “Default” as appropriate. A sampled Block default is not a universal default for all element types.
- Recovery: “Hidden on Mobile. Select this element in Layers to change its visibility.” Keep the layer row and Inspector context available when the canvas box disappears; do not leave an invisible clickable canvas specimen as the only return path.

| Task | Required evidence |
|---|---|
| Named device isolation | While viewing Desktop, uncheck Mobile; Desktop stays visible. Switch Mobile: specimen disappears from document flow, identity remains in Layers, and the correct cause is shown. Select its row and restore only that flag. Repeat Tablet flag: Mobile stays unaffected. |
| Display isolation and combined causes | Set Mobile Display None with all flags shown; recover via target Layers row and reset only Mobile Display. Separately combine Mobile hidden flag with Display None; removing either cause alone must not falsely show the element. |
| Tablet origin | Seed base Block / Tablet None / Mobile absent. Mobile inherits None. Set Mobile Block: visible unless its named flag blocks it. Reset Mobile: inherited Tablet None returns and remains hidden. Undo restores explicit Mobile Block and its presence. |
| Exact reset | Reset one named flag means remove that base flag, not force Display. Reset Display means remove only the selected scope's declaration. Repeated absent reset preserves useful Undo; reset never promises visible output if another cause remains. |
| No-op and history | Selecting already-effective Display without an intended explicit pin is a finite no-op; preserve useful Undo. A checkbox click actually toggles and is a change, so double-toggle is not a no-op test. Preserve raw presence for explicit versus inherited equal values. |
| Selection and return | Hide, close Style, select the correctly named row, reopen Style, recover; verify target/device/scroll and context. Switching Heading↔Image preserves independent state and never applies one target's Undo to the other. Editor-only dimming, if represented, changes neither flags nor Display. |
| Scope of Undo | One-step Undo restores only the owned flag or Display scope and prior presence/value. Device changes/navigation consume no history; restore output using the current device. Unrelated Image/typography edits survive. Stale target/revision or lock/conflict refuses without replacing useful recovery. |
| Pseudo rule boundary | Source named flags remain base/normal even while editing hover/focus. Either demonstrate this explicitly plus scoped Display/pseudo reset, or expose a clear normal-state-only finite task. Do not label a named flag as a hover override. Full pseudo cascade stays OPEN. |
| Eligibility/regression | Explain mixed/incompatible/protected/missing targets without writes. Display must remain accessible after Block/None, while Flex/Grid subcontrols retain correct gates. Preserve shared Style entry/close/Back/Escape and existing R38/Image actions. |

A bounded review launcher may seed Tablet/locked/mixed cases; it must disclose snapshot reset and not masquerade as a product control. A Tablet button, if added, needs an honest context and visibility/display output; unrelated two-device fixtures remain limited. Any new Undo/reset must reconcile original sample Reset controls (`8843:17097`, `8843:20768`) and old shared aliases so they cannot desynchronize the new state.

## Evidence and full gates

Existing tests inspected, not rerun: `src/editor/inspector/hooks/__tests__/useStyleHandlers.deviceHide.test.ts:53` verifies base-only flag writes/removal, including hover; `src/engine/export/__tests__/ExportEngine.hideBreakpoints.test.ts:35` verifies exported hide rules. Neither establishes this prototype's selected-hidden recovery, all-source effective origin or browser layout. Layers selection source demonstrates an ID route, not an accepted end-to-end recovery flow.

Acceptance needs separate live-reaction interpretation, native reference/layout checks and reviewed browser outcomes for hidden flow, correct Layers target recovery, combined causes, Tablet inheritance/reset/Undo and cross-target independence. Full engine identity/history/rollback, mixed/partial locks, imported misplaced flags, ancestor/class/token causes, arbitrary responsive rules, pseudo cascade, accessible hidden-state focus, all preview widths/export/reload and actual published behavior remain OPEN. This plan does not close Visibility, Inspector or any module gate.
