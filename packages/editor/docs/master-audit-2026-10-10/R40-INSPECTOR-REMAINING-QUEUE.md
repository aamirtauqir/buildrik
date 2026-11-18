# R40 — Remaining Inspector contract queue

13 October 2026. Read-only source and 529-row control-register audit, beyond the bounded R38 typography and R39 Icon work and root's active Columns task. Only this report was written. No native Figma/browser inspection, production/test changes or registry/status edits. Existing evidence is retained; this queue does not certify any module.

## Evidence and reuse rules

`R36-INSPECTOR-CONTROL-REGISTER.csv` currently has 529 rows. Its absent rows do **not** establish absent live Figma controls. Root's fresh native inspection found existing Columns count row `8863:17109`, field `8863:17111`, chooser `8863:17115`, and Gap row `8863:17134`, field `8863:17136`, chooser `8863:17140`; those were not mapped in the register. Reuse these existing controls. The other node IDs below come from the register and need a native existence/reaction check before authoring. Do not clone a new control just because this CSV has no entry.

Existing canonical Style root: `8841:14864`. Existing Interactions root: `8841:14872`. R38 and R39 are accepted only for the bounded behavior in their reports; Columns is being authored, so its design acceptance is not assumed here. Full Tablet cascade, dynamic Brand behavior, arbitrary input, eligibility and runtime rendering remain open wherever those reports say so.

Use this sequence by consequence: protect content and recovery first, establish persistence/scope second, then render/composition parity. Each item gives an executable finite task and separately names its prototype-design gate and runtime gate. “Design gate” means required evidence not supplied by this register/source audit; it is not proof that no existing Figma frame models it.

## 1. Form fields and Slides — structural edits preserve content or disclose loss

**Existing anchors:** Form `form:1` / Fields `8843:30809`, root `8843:30589`; Slider `slider:1` / Slides `8843:31143`, root `8843:30923`.

**Verified source:** `src/editor/inspector/sections/FormFieldsSection.tsx:65` replaces input↔textarea by creating a new element and keeping only name/placeholder/aria-label/required/id attributes, then removing the old element at the same parent/index. Its element ID changes; styles, classes, other attributes and content are not copied by that function. `:103`–`:150` wraps operations using the form parent as lock target. `src/editor/inspector/sections/SlidesSection.tsx:93` adds by duplicating the last slide if present; `:145`–`:146` duplicate/delete wrap the slider parent, then call low-level element operations. `src/engine/elements/manager/ElementCRUD.ts:96` recursively removes subtrees with no descendant-lock gate; ordinary delete uses the stronger `src/engine/commands/commandOperations.ts:40` gate.

**Finite next task:** a slider with three distinctly named/content-bearing slides → duplicate → reorder → delete named slide with visible consequence preview → Cancel → confirm → exact-content/order Undo. A form with a styled field containing a default value → change its type → preview any properties that cannot survive → confirm/Cancel → Undo restores original identity/content/style. If the corrected design promises lossless type changes, explicitly record that source reconciliation is needed. Add locked-descendant and protected-component blocking leaves using the Columns recovery pattern; no blanket successful multi-item write.

**Design gate:** real child/layer changes and exact recovery, not “3 slides”→“4 slides” text. **Runtime gate:** ID/binding preservation, nested lock checks, true transaction rollback and save/reload. Parent-lock-only source behavior must not be presented as proof of descendant protection.

## 2. Form submission settings — separate remote save from canvas Undo

**Existing anchors:** `form:2` After submit `8843:30815`; Success message `8843:30821`; Redirect URL `8843:30827`; Notification delivery `8843:30833`; Spam protection `8843:30838`. Form HTML attributes separately include Action URL `8843:30879`, Method `8843:30885`, Encoding `8843:30891`, Disable validation `8843:30897`.

**Verified source:** `src/editor/inspector/sections/FormAfterSubmitSection.tsx:93` loads `forms.getBlock`; `:111` avoids unchanged writes; `:127` sends successAction+redirectUrl together; `:135` leaves redirect-without-URL incomplete and unsent; `:147` saves through `forms.updateBlock`; `:149` reverts failed optimistic updates. The source reports notification-email Admin restrictions at `:26`/`:155`; this audit did not freshly verify server policy or effective roles. These are remote form-block settings, unlike the element-tree edits in the preceding task. `src/engine/HistoryManager.ts:378` limits canvas history scope to tree/tokens.

**Finite next task:** Message→Redirect→missing URL (unsaved)→valid URL→Saving→Saved; alternate failed-save/retry branch and forbidden notification-edit branch, returning to the same form. Distinguish form server behavior from HTML form action/method overrides and keep their controls readable. Replace ambiguous `Owner managed` claims with permission-dependent copy only after effective policy is confirmed; do not imply Owner-only merely from the sample label.

**Design gate:** pending/incomplete/failed/saved states and dirty return rules; no generic “Undo form settings” assertion. **Runtime gate:** actual authorization, out-of-order responses, current target identity and remote persistence after refresh. Keep backend-dependent execution separate from designable recovery leaves.

## 3. Video embed Ratio — next concrete appearance-ownership correction

**Existing anchors:** `video-embed:2` Ratio `8843:22463`, root `8843:22237`; Video URL `8843:22457`; Autoplay/Muted/Controls `8843:22469`/`8843:22475`/`8843:22481`.

**Verified source:** `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:71` writes global `data-embed-ratio`, and clears legacy zero-height/percentage-padding through the Style batch path if that legacy box is detected. `src/shared/utils/embed/embedFrameHTML.ts:38` defaults invalid/missing ratio to 16:9; `:65` writes the ratio on generated video iframe markup. This is not an ordinary current-breakpoint width/height edit. No canonical aspect-ratio control is mapped in the 529 rows; native Figma discovery is required before adding one.

**Finite next task:** Settings Ratio becomes a route to a canonical, video-eligible Style appearance control, while URL/playback remain Settings. Reuse any existing aspect-ratio field/master. Demonstrate 16:9→4:3→1:1 as visible frame geometry and Undo; retain provider URL and playback flags. Initially label `This video · all breakpoints` if preserving the source attribute contract. A responsive ratio redesign needs an explicit CSS/serializer contract; do not infer it from the Style tab. Include one legacy box fixture showing removal of the old padding/height in the same intended operation.

**Design gate:** canonical ownership, correct global scope, rendered geometry and recovery. **Runtime gate:** iframe output, provider loading, mixed/locked selection and the combined attribute/style transaction. Unsupported URL must remain an invalid/recovery state, not a successful ratio-only video preview.

## 4. Visibility, display and property origin — avoid contradictory scope

**Existing anchors:** `style/visibility:Show on desktop` `8841:15289`, Tablet `8841:15294`, Mobile `8841:15299`; `style/layout:Display` `8841:14889`; Overflow `8841:14929`.

**Verified source:** `src/editor/inspector/sections/VisibilitySection.tsx:39` reads named `--hide-<bp>` flags; `:64` toggles true/empty. `src/editor/inspector/hooks/useStyleHandlers.ts:251` deliberately writes those flags on base/normal regardless of active authoring breakpoint/state. `src/engine/export/ExportEngine.ts:153` uses non-overlapping mobile/tablet/desktop visibility intervals. This differs from scoped CSS display and from the unresolved overlapping responsive style cascade described in R36. Label generic “changes stay in current breakpoint/state” cannot cover every control.

**Finite next task:** while authoring Desktop, disable Show on Mobile, switch Mobile and verify the element's hidden status/selection recovery; return Desktop unchanged → restore or Undo. Separately set scoped Display None and recover via Layers. Show each operation's origin accurately. Include an inherited value with Tablet override before claiming full Mobile inheritance; the existing no-Tablet fixtures remain valid only as bounded samples.

**Design gate:** a hidden element remains recoverable and named-device controls are not falsely treated as active-device overrides. **Runtime gate:** canvas/preview/export agreement at 767/768 and 1023/1024, actual pseudo and breakpoint cascade, reset and mixed selection.

## 5. General dimensions, layout and item controls — real layout outcomes

**Existing anchors:** Width/Height `8841:14994`/`8841:14999`; Min/Max width `8841:15004`/`8841:15009`; Min/Max height `8841:15014`/`8841:15019`; Direction `8841:14894`, Align `8841:14899`, Wrap `8841:14904`, Grid Columns/Rows `8841:14909`/`8841:14914`, Position `8841:14924`. Flex/Stack/Grid roots `8843:24210`/`8843:24478`/`8843:24746`. Columns count/Gap are root's separate active task.

**Verified source:** `src/editor/inspector/sections/SizeSection.tsx:39` distinguishes Fill/Fixed/Hug, `:46` writes 100%/fit-content/current fixed or fallback, `:182` uses measured size when switching to Fixed, `:275` offers px/%/rem/vw/vh. `src/editor/inspector/sections/layout/ItemControls.tsx:64` offers grid spans and self alignment; `:97` offers flex grow/self/shrink/basis/order. None of these item controls have dedicated register rows. `src/editor/inspector/sections/layout/PositionControls.tsx:57` gates offsets behind non-static positioning, with disabled reasons; register does not map offset controls. `src/shared/constants/elementCapabilities.ts:151` and the type-block bodies own Flex/Grid instead of the generic Layout section.

**Finite next task:** one container and two children: Fill→Fixed measured width→Hug, with wrapping content; switch row/column and wrap; select child and change grow or grid span; resize authoring-site frame; set min/max constraint and reset/Undo; then absolute positioning with explicit parent and offsets. Every change must visibly affect the intended box/child. Reuse live unmapped item/offset controls when found.

**Design gate:** eligibility/parent context, units, measured vs authored values, Auto/empty/zero, overflow and all supported modes remain explicit. R39's 32/48 Icon fixture does not close this family. **Runtime gate:** actual CSS sizing, token resolution, arbitrary dimensions/content, responsive cascade and parent layout changes.

## 6. CMS bindings and links — stable content identity and return

**Existing anchors:** Heading Source/Field/Fallback `8843:17045`/`8843:17051`/`8843:17057`; Image Source/Field/Fallback `8843:20710`/`8843:20716`/`8843:20722`; Collection list root `8843:31228`, Collection `8843:31448`, Show items `8843:31454`, mapping `8843:31460`, empty message `8843:31466`. Link root `8843:17685`, Link to `8843:17909`, Destination `8843:17915`, URL `8843:17921`, New tab `8843:17945`, Rel `8843:17951`.

**Verified source:** `src/editor/inspector/sections/CmsBindingSection.tsx:180` refuses to substitute a different record when the pinned one disappears; `:195` checks writable eligibility before binding; `:203` may asynchronously load/select a record; `:214` unbinds. `CollectionListSection.tsx:79` shows blank limit as All and bounds positive parsed limits. `LinkSection.tsx:190` encodes page IDs and URL/email/phone/anchor differently; `:59` keeps authored rel tokens while adding/removing new-tab security tokens; writes are selected-element transactions.

**Finite next task:** bind a selected heading to a compatible pinned record field → open exact record → change context and return → source/record disappears → fallback/reconnect/unbind with original content recovery. Separately Page link→URL→invalid draft→valid→New tab on/off preserves authored rel→Undo. Reuse existing R35/R36 recovery flows; extend only their uncovered leaves. Collection-list mapping is not the same operation as changing a standalone record binding or editing a record.

**Design gate:** distinguish collection/field/record, pinned vs current item, target identity, fallback and non-destructive cancel. **Runtime gate:** async stale-target revalidation, deletion/conflicts, true CMS save vs document-binding Undo and link output. Do not claim every displayed mapping row is backed by the inspected CollectionListSection, which only exposes collection/limit/open/create.

## 7. Fill and media appearance — distinguish background sizing from object fit

**Existing anchors:** Fill type `8841:15074`, Color `8841:15079`, Gradient start/end/angle `8841:15084`/`8841:15089`/`8841:15094`, Image `8841:15099`, Fit `8841:15104`, Position `8841:15109`, Repeat `8841:15114`. R36 Image object-fit lives separately at `8863:17173`.

**Verified source:** `src/editor/inspector/sections/BackgroundSection.tsx:70` clears stale background shorthand when replacing fill; `:87` delays dropping a gradient until an image is actually chosen. `:295` edits `background-size`, offering Auto/Cover/Contain/Stretch (`100% 100%`). Register's Fill label on its background Fit row is not the Image object's `object-fit:fill`. Imported shorthand, background image and gradient must not compete silently.

**Finite next task:** gradient→Image picker→Cancel keeps gradient; choose valid image→apply replaces appropriate declaration; Background size/position visibly change the background; return/Undo restores original gradient. Separate Image object-fit fixture and label target clearly. Token color→custom→unlink preserves effective color; missing token stays recoverable.

**Design gate:** candidate vs commit, true visible fill outcome and correct property identity. **Runtime gate:** assets/network, token propagation, CSS shorthand layering, published rendering. R36's source/alt/fit evidence is retained only for its documented slice.

## 8. Effects composition and Interactions — don't overwrite adjacent functions

**Existing anchors:** Shadow `8841:15179`, X/Y/Blur/Spread `8841:15184`/`8841:15189`/`8841:15194`/`8841:15199`; Brightness/Contrast/Grayscale `8841:15204`/`8841:15209`/`8841:15219`; Translate X/Y/Rotate/Scale/Skew `8841:15239`/`8841:15244`/`8841:15249`/`8841:15254`/`8841:15259`; Transition `8841:15269`. Interactions Trigger/Animation/Target/Duration/Delay `8841:15309`/`8841:15314`/`8841:15319`/`8841:15324`/`8841:15329`; CSS Animation `8841:15359`.

**Verified source:** `src/editor/inspector/sections/effects/effectValues.ts:44` composes functions, but only re-emits known transform/filter orders at `:70`/`:81`; imported unknown functions can be lost when another function is edited. Source Filters provides Blur/Brightness/Contrast/Grayscale (`FiltersSection.tsx:15`), whereas register additionally authors Saturation/Hue rotate/Invert/Sepia and Backdrop blur/Perspective/Transform origin without matching controls in this inspected family. Source Shadow supports outer+inner presets and raw CSS (`ShadowSection.tsx:46`); source Effects Advanced supports Cursor/Blend/Text shadow/Will change (`EffectsAdvancedSection.tsx:53`), absent from register. These discrepancies require mapping/contract reconciliation, not automatic deletion or duplicate UI.

`src/editor/inspector/sections/registry/behaviour.tsx:33` stores event interactions and CSS animation through different element methods/transactions. Its preview at `:58` runs one normal forwards animation, so preview is not full target/loop/reverse execution proof. `InteractionEditor.tsx:73` shows seconds but stores milliseconds; duration bounds 0.1–10 and delay 0–5 are at `:152`/`:161`. Source TransformMotion Scale shows percent, converting to a unitless factor (`TransformMotionSection.tsx:42`); register samples 1/1.1 must be labelled accordingly.

**Finite next task:** translate+scale+rotate specimen → edit rotate only, preserving other functions → reset one function→Undo. Outer+inner shadow coexist. Event animation entry→target→duration→preview→cancel/delete→Undo; distinguish CSS transition from event/CSS animation. Resolve ambiguous register Blur into shadow blur vs filter blur before authoring. Retain unsupported advanced functions as explicit implementation decisions or demonstrated source paths; do not claim parity from a CSS-capable label alone.

**Design gate:** composed values, precise units/target ownership, no-op Undo and rendered effect/event outcome. **Runtime gate:** imported function preservation, event firing/targets/cancellation, timing and preview/export parity. R35 opacity evidence does not close the remaining effects family.

## 9. Spacing, border and typography remainder — linked values and semantic preservation

**Existing anchors:** Padding sides `8841:15029`/`15034`/`15039`/`15044` and Margin sides `8841:15049`/`15054`/`15059`/`15064` (all `8841:`). Border Radius/Width/Style/Color/Sides `8841:15134`/`15139`/`15144`/`15149`/`15154`; Outline/offset `8841:15159`/`15164`. Typography Family/Weight/Line height/Tracking/Align/Decoration/Case/Color `8841:14944`/`14949`/`14959`/`14964`/`14969`/`14974`/`14979`/`14984`.

**Verified source:** `src/editor/inspector/sections/SpacingSection.tsx:41` prefers longhands over shorthand; `:64` linked edits batch all four sides in the selected margin or padding box. Link sides has no mapped register row. `BorderSection.tsx:66` distinguishes linked radius from individual corners; `:189` writes per-side border shorthands; `:218` outlines are separate properties. `typography/FontControls.tsx:65` supports font-size units and `:76` has unitless/normal line height; `TypographyControls.tsx:60` has letter spacing, `:70` word spacing, `:94` white-space, `:109` word-break, `:123` indent and `:131` vertical alignment. Several latter controls lack register rows.

**Finite next task:** asymmetric padding→link sides→change one side→all four visibly change→unlink→local side reset/Undo; margin Auto is not zero or padding Auto. Independently change a radius corner while keeping border/outline intact. Text specimen changes family/weight/line-height/tracking and wraps predictably while heading semantic level stays unchanged; token/custom origins remain clear. Locate and map existing unmapped controls before adding any.

**Design gate:** one family task at a time, real geometry/text output, appropriate units and mixed/inherited values. **Runtime gate:** shorthand conflict resolution, font loading, arbitrary text/content, complete Brand/cascade and native focus/input behavior. R38 only closed its finite named-size slice.

## 10. Remaining widget and provider behavior — conditional controls change output

**Existing anchors:** Countdown root `8843:23348`, Ends at/When done/Message `8843:23568`/`23574`/`23580`; Progress root `8843:23636`, Value/Maximum/Show label `8843:23856`/`23862`/`23868`; Accordion root `8843:23923`, item toggles `8843:24143`/`24149`, multiple `8843:24155`; Slider playback `8843:31149` through `8843:31173`; Lottie/Map URL `8843:22176`/`8843:22757`.

**Verified source:** `src/editor/inspector/sections/typeBlock/bodies/widgetBodies.tsx:47` parses real date/time fields; `:165` rejects empty/negative progress values and `:169` requires positive maximum; `:117` updates a native progress bar plus label; accordion behavior is item state rather than CSS appearance. `SliderPlaybackSection.tsx:37` clamps seconds to 1–60, drafts while typing and commits on blur at `:91`; source independently exposes arrows/dots at `:99`, with no Loop/Pause-on-hover control in that section despite register rows. Provider URL detection at `embedBodies.tsx:49` stores the URL and shows recognized/unsupported status; unsupported is not automatically a blocked save.

**Finite next task:** Progress 60/100→60/200 must render 30%, hide label→Undo; accordion opening one closes the other when multiple=false, then multiple=true permits both; countdown invalid date→valid and done-state message/hide; slider autoplay toggles interval eligibility and arrows/dots independently. Author one provider failure/corrected URL task without claiming a live network response. Locate source support for the authored Loop/Pause options before presenting them as implemented source parity.

**Design gate:** conditional visibility, validation and actual content/state outcome. **Runtime gate:** timers/provider restrictions, true slideshow runtime, interval parsing and output persistence. These visible changes remain Settings semantics/behavior; do not migrate them to Style merely because their output is visible.

## Immediate handoff

After root's Columns task, start with the reusable structural-content recovery family (Slides/Form fields), then form persistence boundaries and Video Ratio ownership. In parallel sequencing within the same design pass, establish named-device Visibility and general property-origin rules before extending responsive controls. Reconcile unmapped and source-mismatched families using native reads; the 529-row inventory is a worklist, not a completeness certificate.

For each completed family, record: initiating target/context; supported value/units and commit; actual output; same-value no-op; Cancel; scoped Reset; one-step Undo; locked/missing/stale target; return/reopen. Mark independently whether evidence is native design inspection, authored-action interpretation, visual prototype playback or running-application verification. Missing leaf states and unclear scope stay design work. Backend execution limits cannot close those gaps.
