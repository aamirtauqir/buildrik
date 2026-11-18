# R45 editor visual / UX audit

**Superseded design direction — latest user instruction:** retain the current Buildrick UI and adopt useful Webflow editing flows through targeted usability corrections only. The earlier icon-rail, shell redesign, global restyling and broad visual acceptance recommendations below are historical, not current requirements. The final section, **Current scope: targeted Heading/Image flow corrections**, is the governing recommendation and acceptance scope.

Reviewed 2026-10-14. This is a visual assessment of four rendered 1440 × 1000 screenshots, not an inference from authored-action checks or node geometry. The current editor does not yet meet the requested compact, Webflow-like editor quality. Buildrick's navy text, blue selection accent, pale workspace and restrained white panels are worth retaining; the shell's hierarchy and control composition need correction before adding another feature family.

The Webflow-like direction below follows the user's requested reference: a compact tool rail, a real navigation tree, an explicit canvas viewport and a persistent right property panel. This report does not independently claim exact parity with Webflow's current interface. Root is reviewing official reference material.

## Rendered evidence

Coordinates below are approximate screenshot pixels, measured from the top-left.

| Key | Screenshot | State visible in the image |
| --- | --- | --- |
| HM | [Heading Mobile restored](evidence/r45-heading-mobile-restored.png) | Mobile canvas, Heading selected, Settings open |
| HT | [Heading Tablet limited preview](evidence/r45-heading-tablet-limited-preview.png) | Tablet canvas and limited Inspector |
| ID | [Image independent Desktop](evidence/r45-image-independent-desktop.png) | Desktop canvas, Image selected, Settings open |
| IS | [Image combined Style](evidence/r45-image-combined-style.png) | Mobile canvas, Image hidden by two causes, Style open |

## Prioritized findings and fixes

### 1. High — the left rail combines application navigation and the document tree into one flat menu

**Evidence:** All four images, x0–215, y78–585. Layers, Pages, Assets, CMS, Brand variables and Classes occupy six widely spaced, centered rows above Home / Body / Main section / element rows. Tree rows also read as centered buttons; nesting, parenthood and expansion are visually weak. This does not communicate the document structure users need to navigate.

**Fix:** Put tool destinations in a narrow icon rail, with accessible labels/tooltips and an explicit active tool. Use the adjacent panel for Layers with its own compact header. Left-align tree labels, indent actual parent/child levels, and use type icons and disclosure chevrons where children exist. Keep rows approximately 28–32 px high rather than the current ~40 px spacing. Keep existing destination actions and actual tree relationships; do not fabricate expandable nodes. Move site metadata out of the working tree.

**Reuse:** Heading Layers `8843:16824`; Image Layers `8843:20483`. Start with these two finite roots before extending the shell to other editor views.

### 2. High — selected identity is inconsistent between canvas and tree

**Evidence:** HM/HT show a blue selection outline on the heading, while the Heading tree row around y460 has no selected highlight. ID/IS show both a plain Image row around y460 and a second blue Image row at y605–637, below Project grid. The interface appears to contain two image elements, although the second row is being used as the selected-element route. The separate “1 selected element” sentence adds little identity information.

**Fix:** Show one selected row in its actual tree position and match its label/type with the canvas selection and Inspector title. Put a hidden-state icon on that same row; keep it selectable for recovery when its page content is hidden. Remove the redundant selection row only after transferring or retaining its recovery reaction. Use a small selection breadcrumb or consistent element title instead of the disconnected count sentence for this single-selection fixture.

**Reuse:** Heading row `8843:16833`; Image row `8843:20492`; additional Image selection/recovery row `8912:17353`. Selected canvas frames are `8843:17107` and `8843:20778`. This is a visual identity correction, not permission to change logical selection semantics.

### 3. High — Mobile and Tablet viewport boundaries are not visible

**Evidence:** HM/HT/IS retain essentially the same white rectangle x240–1064, y132–894 as ID. Text wraps at different widths, but the website's white background merges into that rectangle. Mobile reads as a narrow content column inside a wide blank desktop page. Neither the artboard width nor zoom is legible in the toolbar.

**Fix:** Give the actual device viewport a clear edge against the pale editor workspace and center it within the available canvas region. Show a compact width label beside the device control; show zoom only if it has a truthful existing behavior. Preserve the real breakpoint-bound website width and ordinary page scrolling. Selection outlines must remain inside the site viewport. A scrollable tall page is expected; a white surround that conceals the viewport boundary is a separate visual defect.

**Reuse:** Heading website `8843:17103` / viewport `8843:17104`; Image website `8843:20774` / viewport `8843:20775`. Change local wrappers and presentation, preserving the existing dynamic width bindings.

### 4. High — Visibility's binary controls consume the entire property panel

**Evidence:** IS, x1105–1423, y212–933. Display has a full-width field, origin sentence, two-line reset explanation and full-width Reset button. Three Yes/No fields each have another full-width Reset button. The Mobile control causing the current hidden state sits at y851; Object fit starts at the bottom edge around y965. Ordinary panel scrolling is not itself clipping, but the key explanation and controls are separated by excessive vertical repetition.

**Fix:** Use a compact Display selector with adjacent origin/reset affordance. Present named-device visibility as three clearly labeled switch or checkbox rows with small reset affordances when applicable. Keep a short combined-cause message near the active-device controls, and expose the existing recovery/Undo action without requiring users to scan a wall of reset buttons. Keep the distinction between scoped Display and global named-device flags explicit through labels and concise help. Do not merge their underlying state.

**Reuse:** Shared Style Display `8841:14889`; flags `8841:15289`, `8841:15294`, `8841:15299`; origin `9064:17589`; cause `9064:17598`; Undo `9064:17599`. The goal is better composition of existing behavior, not a new visibility contract.

### 5. Medium — Inspector navigation changes shape across Settings, Style and Tablet

**Evidence:** HM/ID have an element title and Style / Settings / Interactions tabs. IS replaces these with a generic Style title and Close action; selected Image / Mobile appears farther down. HT leaves a sparse Style tab, a paragraph about supported prototype coverage and one Visibility & Display button. The panel feels like three different interfaces.

**Fix:** Maintain a persistent selected-element header and a stable tab strip in the right panel. If the current Style implementation remains a shared overlay, make its visible header align with that same shell and return context. For Tablet, preserve honest limited coverage but use a concise availability message and explicitly unavailable tabs; keep unsupported actions guarded. Put detailed review limitations in the review surface rather than letting them dominate the normal property panel. Do not imply that full Tablet Settings or Interactions now work.

**Reuse:** Heading tabs `8843:17016/17018/17020`; Image tabs `8843:20675/20677/20679`; shared Style header/Close `8841:14868`. Existing routes and Tablet guards must survive the presentation change.

### 6. Medium — field, section and action hierarchy is visually flattened

**Evidence:** HM/ID right panel. An editable value, “Edit in Style →”, CMS binding, Advanced attributes, Reset sample and Back to editor all receive similar outlined or centered treatment. IS renders the Visibility section heading like another full-width action. “Back to editor” is confusing while already inside the editor; “Reset sample” exposes a review-fixture operation as a product control.

**Fix:** Use compact labeled rows for properties, real disclosure headers for sections, and low-emphasis links for cross-panel editing. Separate CMS/advanced sections from primary element properties. Move sample reset and scenario navigation into a distinct review harness area while preserving their existing actions. Use one consistent close/back affordance for the panel. Keep reset controls visually subordinate to the values they reset.

### 7. Medium — toolbar and context are spread across too many competing locations

**Evidence:** All four images. Workspace actions fill only the first ~940 px of the 1440 px top bar. Page/device context appears at y88–96, repeats in the Inspector, and repeats again below the canvas around y918. HT/ID show a borderless-looking inactive Mobile pill beside the outlined Desktop/Tablet controls. The canvas toolbar does not clearly group page, breakpoint and view controls.

**Fix:** Use one compact top bar: project/workspace identity at left, existing workspace actions grouped together, and Preview/Publish grouped at right. Put page identity and breakpoint controls in a consistent canvas toolbar. Normalize inactive and selected states. Retain selected element/device information in the Inspector, but remove redundant canvas-footer context where it adds no distinct information. Do not add nonfunctional toolbar icons solely to resemble the reference.

### 8. Medium — the image filename is rendered as website content

**Evidence:** ID, selected gradient image x296–952, y284–484, shows `studio-gradient1.webp` in white at its upper-left. This reads as a caption embedded in the website, although the filename already belongs to source metadata in Settings.

**Fix:** Keep the gradient visual as the bounded asset fixture, but present its filename in an Inspector asset thumbnail or editor-only selection badge. Avoid putting source metadata inside the website image. If the text is intentionally part of the image placeholder, clearly style it as editor-only placeholder chrome rather than page typography.

## Shared-master safety: verified native read

`getInstancesAsync()` was read for the five known masters. All are on `8322:855`, **03 — DESIGN SYSTEM / TO-BE**. None of these five returned an instance on `8280:2` (**01 — EXISTING APPLICATION / AS-IS**), `8286:1818` (**AS-IS / REUSABLE CONTROLS**), `4418:45431` (**Editor v3 · IA**) or `1:2` (**Components**). This is a bounded master-specific finding, not a claim that the entire original file is dependency-isolated.

| Master | Purpose | Total instances | Earlier Improved page `8312:2` | Current Flow page `8463:2` |
| --- | --- | ---: | ---: | ---: |
| `8314:3` | Primary button | 1,375 | 292 | 1,077 |
| `8314:5` | Secondary button | 4,036 | 1,242 | 2,749 |
| `8314:7` | Ghost button | 4,433 | 438 | 3,992 |
| `8531:318` | Inspector text control | 1,181 | 0 | 1,174 |
| `8627:621` | Workspace switch / Editor active | 173 | 0 | 173 |

Remaining instances in the totals belong to design-system or handover pages. The button masters are therefore shared with the **earlier Improved baseline** and many unrelated flows, even though these queried masters are not used by the AS-IS baseline. Editing them globally would have a much larger scope than this repair.

**Recommended scope:** author the visual repair inside Heading `8843:16808`, Image `8843:20467` and the explicitly affected shared Style presentation. Prefer local instance overrides and local auto-layout wrappers; use dedicated improved-editor variants only when local overrides cannot express the needed structure. Preserve reaction-bearing node IDs, variable bindings and device geometry. Avoid blanket instance detachment, which can replace descendant IDs and break destinations. Shared Style is itself multi-caller: gate fixture-specific additions and preserve other callers' controls. Verify representative unrelated flows if any shared presentation is changed.

## Visual acceptance for this repair

Re-render these four states after changes and inspect the pixels at the same viewport size. A passing repair should show a recognizable tool rail and nested tree, exactly one selected logical element, a clear Mobile/Tablet artboard boundary, a stable Inspector shell, compact readable visibility controls, and a reachable hidden-element recovery path. Check long labels and intentional scrolling; do not count all content outside a scrolling viewport as accidental clipping. Existing action checks remain useful regression evidence, but cannot establish visual quality or usability. No production, Figma, register or status changes were made by this audit.

## Current scope: targeted Heading/Image flow corrections

**Latest instruction supersedes the broader recommendations above.** Preserve Buildrick's present shell, navigation placement, typography, colors and component styling. No icon rail, global restyle, reconstructed Inspector or imitation of Webflow's visual design is required for acceptance. The relevant editing flow is: identify the selected element, find it when hidden, inspect the applicable property scope, undo the most recent supported change, and understand the active preview boundary.

The following native facts were independently read after this clarification, before root's targeted fixes. They describe that read checkpoint, not the eventual corrected state.

| Correction | Verified current structure | Safe bounded change | Main regression risk |
| --- | --- | --- | --- |
| One selected identity | Heading row `8843:16833` and Image row `8843:20492` each already have an existing click reaction routing to Shared Style `8841:14864`. Decorative `8912:17353`, named Current selection / Image, has **zero reactions**. | Give each actual selected row an instance-local selected treatment consistent with Buildrick. Hide the decorative duplicate Image row. Preserve the actual rows, their IDs and full existing reactions. | Replacing or detaching rows could discard caller/device sync or change descendant IDs. Do not highlight the entire menu or unrelated rows. |
| Hidden recovery | Selected canvas Heading `8843:17107` binds visible to `VariableID:9064:17517`; Image `8843:20778` binds visible to `VariableID:9064:17554`. The corresponding actual tree rows have no visibility binding and remain available. | Keep those tree rows visible and clickable regardless of canvas visibility. Add a concise local status if needed, without replacing the identity label or introducing a second selectable row. Use the existing recovery route. | Binding the tree row to the same visible variable would remove the recovery affordance precisely when needed. Styling hidden content must not unhide it or modify selection ownership. |
| Display Undo independent of accordion | Undo `9064:17599` binds visible to `VariableID:9064:17504`. Its current ancestors are output frame `9064:17596` → Visibility body `8841:15284`; that body binds visible to accordion variable `VariableID:8841:15285`. Therefore closing Visibility also hides Display Undo, even when an undoable Display edit exists. | Reparent the **existing** Undo into an R45-active sibling outside `8841:15284`, near Display/origin or a compact shared recovery area. Preserve its existing action, own Undo visibility binding and finite-entry ownership gate. Keep a single Undo control. | Moving it directly into an unguarded shared panel could expose stale fixture state to other element families. Copying it creates divergent controls. Do not change property revision, target/generation guards or snapshot ownership to solve a layout issue. |
| Actual device boundary | Website Heading `8843:17103` and Image `8843:20774` each have a white fill and a dynamic width binding. Their surrounding canvas frames are also white. | Change only the local surround fill or apply a subtle local website edge, using existing Buildrick neutrals. Preserve the actual width bindings and page/selection geometry. Optional width text must derive from that actual width. | Hardcoded mock device frames can disagree with the real content width. Resizing the website may overwrite its variable binding; new clipping or overlays can obstruct content. A decorative border must not change content dimensions. |

**ID correction to the historical recommendations:** the real surrounding canvas viewport frames are Heading `8843:16845` and Image `8843:20504`. `VariableID:8843:17104` and `VariableID:8843:20775` are width variables bound to the website frames; `17104` / `20775` are not viewport frame IDs. At the native default checkpoint each website was 720 × 540. Runtime breakpoint states must be checked separately.

### Required bounded acceptance after root's fixes

1. In both finite roots, one visually selected row names the same Heading/Image as the Inspector; Image has no second selected-identity row. Existing navigation destinations and selection/caller sync remain intact.
2. Hide the element using Display, using its named-device visibility flag, and using both. Its actual tree row stays reachable. Reopening the row identifies the same target and device and displays the correct cause. Clearing only one of two causes must not falsely report or render the element as visible.
3. With Visibility collapsed, apply a Display change and verify Undo remains reachable. Undo restores only the owned prior Display presence/value; it preserves unrelated typography or media changes. Repeat after a visibility-flag edit and preserve its existing one-step Undo behavior. No-op and stale/protected refusal behavior must remain unchanged.
4. Reopen Shared Style from a nonfixture caller: finite recovery additions remain gated and existing controls continue their prior behavior. In particular, this visual adjustment must not activate Heading/Image fixture state in the older generic routes.
5. Inspect Desktop, Mobile and the bounded Tablet preview: the visible page edge matches the actual website width, without removing content, masking selection outlines or adding a misleading second boundary. Tablet retains its existing limited capability guards.
6. Review actual post-fix screenshots for selected-row contrast, hidden-state readability, available Undo placement, viewport edges and intentional scrolling. Native reference/geometry checks and authored-action tests complement this review; neither substitutes for it.

These four corrections need no changes to the shared `8314:*` masters and no general shell redesign. Post-fix native and rendered verification remains pending until root applies the changes. This supersession and read-only review changed only this document.
