# R43 — Video embed Ratio ownership and recovery contract

14 October 2026. Read-only source audit and proposed finite acceptance. Only this document was written. No application/test or Figma edits, browser/provider playback, source tests or remote writes were performed. All module gates remain OPEN.

Existing register anchors: Video embed root `8843:22237`; `video-embed:2` Ratio `8843:22463`; Video URL `8843:22457`; Autoplay `8843:22469`, Muted `8843:22475`, Show controls `8843:22481`. These are register references, not a fresh native inventory. This family is **Video embed**, distinct from native Video root `8843:20783` with an MP4 source/poster. Inspect and reuse existing canonical Style controls before creating another ratio editor.

## Verified source contract

| Concern | Source evidence and consequence |
|---|---|
| Canonical values | `src/shared/utils/embed/embedFrameHTML.ts:25` defines exactly `16:9`, `4:3`, `1:1`. `:38` resolves missing, empty or any unsupported stored value to `16:9`. No custom ratio, Auto, 9:16 or free numeric dimensions belong to this inspected contract. |
| Storage / scope | `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:71` writes `data-embed-ratio` through the attribute writer. `attributeWriter.ts:52` writes attributes directly to selected writable elements; there is no breakpoint or pseudo-state field in this storage path. Ratio is global per element. |
| Render owner | `embedFrameHTML.ts:65` creates generated iframe markup. Video gets inline `width:100%` and `aspect-ratio:<ratio>` at `:69`; Map/Lottie get another sizing branch. The iframe is generated output, not a stored element to select or replace. Changing wrapper CSS `aspect-ratio` alone is not equivalent to this attribute contract. |
| Writers | `src/shared/utils/html/generation.ts:146`, `src/engine/export/ExportEngine.ts:501` and `:1267` call the same iframe helper. This establishes a shared source path, not tested browser/provider parity. |
| URL / player settings | `embedBodies.tsx:56` trims and writes the URL independently. Ratio writes do not call the URL parser or mutate URL/playback attributes. `embedFrameHTML.ts:36` treats `true` or a bare empty autoplay/muted attribute as enabled; controls are enabled unless exactly `false` (`:50`). Default missing autoplay/muted is off. The inspector's empty writes remove attributes (`attributeWriter.ts:161`). |
| Legacy detector | `embedBodies.tsx:36` matches **any** padding-bottom value ending in `%` together with height exactly `0` or `0px`. It is not restricted to `56.25%` and does not prove those values came from the stock block. It reads primary `p.styles`, not each selected element's authored base pair. |
| Legacy cleanup | `embedBodies.tsx:72` wraps ratio write plus `onBatchChange({padding-bottom:"",height:""})` in one transaction. It does not clear overflow, position, border radius, colors or unrelated dimensions. Stock `src/blocks/Media/VideoEmbed.tsx:13` supplies `padding-bottom:56.25%;height:0;overflow:hidden` and an absolute placeholder. |
| Displayed style / cleanup destination | `useStyleHandlers.ts:168` reads effective base/breakpoint/pseudo styles. Its batch path `:340`–`:362` writes/removes at the active breakpoint and pseudo-state; normal Desktop removes base properties. Thus global ratio and cleanup do not necessarily address the same scope. |
| Source UI ownership | `src/editor/inspector/sections/registry/type.tsx:16` places the current type block in Style. The improved Figma currently has the Ratio entry in Settings. Correcting that improved design's ownership is not evidence that the source has the same Settings layout. |

## Priority defects and decisions

**P0 — Preserve global storage while moving the appearance editor.** Make Settings Ratio a route to one canonical, video-eligible Style control. Copy: `Video ratio` and `This video · all breakpoints`. Return to the same video, caller tab and active device. Keep URL, provider detection and playback flags in Settings. A Style location must not imply Mobile-only ratio, class/token ownership, pseudo-state override or width/height synchronization. Do not show a generic breakpoint override dot/reset for this attribute.

**P0 — Legacy cleanup needs provenance and consistent scope.** Source-derived risks:

- On Mobile, effective styles can show inherited base padding/height, while cleanup only removes a Mobile override. The original base crop remains. Pseudo-state editing has the corresponding mismatch.
- For same-type multi-selection, the primary's legacy detector decides whether cleanup runs for every writable peer. A primary legacy box can cause unrelated peer padding/height to be removed; a non-legacy primary can leave a legacy peer uncleaned.
- A percentage padding and zero height may be intentionally authored. The current broad detector does not justify silently erasing every such pair.

For the finite correction, use one explicitly identified stock **base** legacy pair. Apply the global ratio and remove precisely that pair in one intended action, regardless of active device. Preserve all unrelated styles. Show `Replaces the old fixed-ratio box` if cleanup affects the fixture. Undo restores the exact previous raw attribute state and both legacy declarations. General authored/responsive/pseudo/class-derived legacy boxes remain OPEN; do not implement a sweeping deletion across all style layers.

**P0 — No-op and Reset semantics must be deliberate.** Source has no ratio-specific Reset and no same-value early return. `ButtonControls.tsx:87` invokes the handler even for the active segment; `ElementStyles.ts:38` emits/marks dirty even for an equal attribute write. `HistoryManager.ts:205` drops empty patches, but selecting effective 16:9 when the attribute is absent can create a real explicit value, and selecting the current ratio while legacy cleanup is pending can legitimately change styles.

Recommended finite policy: same effective ratio with no cleanup is a no-op that retains useful Undo. Cleanup is a genuine change even when the effective ratio stays 16:9. Reset removes the owned ratio attribute and resolves to default 16:9; it is global, not “inherit from Desktop.” Reset does not recreate an obsolete legacy box—Undo restores prior state. Preserve raw attribute presence separately so Undo can distinguish absent/default from explicit 16:9. A malformed imported value may display default 16:9 with a clear fallback status; normalizing it is a separate represented change, not proof of full custom-ratio support.

**P1 — Invalid URL must remain recoverable.** `parseEmbedUrl.ts:167` trims input, rejects empty or over-2048-character values and dispatches by embed kind. Video accepts recognized YouTube/Vimeo identities; protocol normalization at `:45` accepts HTTP(S) or scheme-less input. YouTube ID validation and allowed paths are at `:57`; Vimeo IDs/unlisted hashes at `:69`. Generated URLs are rebuilt on provider hosts at `:82`, not copied from arbitrary input. Provider detection does not prove the media exists, allows embedding or will play.

`embedFrameHTML.ts:67` returns null for invalid/missing URL; serializers retain placeholder children (`generation.ts:146`). The body comment saying “renders nothing” should not be interpreted as no placeholder. Because the stock placeholder is absolute, removing the legacy height/padding with no valid iframe may collapse its wrapper; this is a source-derived risk, not a replayed failure. A bounded invalid-URL fixture must retain a visible recovery surface. Ratio may remain editable independently, but it must never turn an invalid URL into a successful player preview or rewrite the entered URL. Actual provider loading and autoplay policy remain runtime gates.

## Locks, mixed selection and history

`attributeWriter.ts:58` filters targets through `writableElements`; `src/engine/commands/commandOperations.ts:192` skips missing/locked elements and emits the locked explanation. The style batch separately uses that filter (`useStyleHandlers.ts:321`). This gate concerns the element's own lock, not a universal component/ancestor/permission policy. `ProInspector.tsx:238` supplies read-only context for lock/conflict; low-level direct handler invocation has a narrower gate. Capture/revalidate target and eligibility in the proposed finite route. No-write locked/missing/stale outcomes must preserve useful Undo and provide return context.

Same-type multi-selection is source-eligible: `InspectorTabContent.tsx:81` hides the type block only when type-block kinds differ. Ratio reads the primary attribute but supplies no `property` to ButtonGroup (`embedBodies.tsx:79`); `InspectorFieldContext.tsx:82` therefore cannot report Mixed for differing ratios. A first bounded pass should explicitly support a single video or author a mixed-value state; do not silently depict primary 16:9 as the common value. Partial locked writes and per-target legacy migration need separate acceptance before claiming bulk support.

The mounted Inspector does have a discrete action boundary: `ButtonControls.tsx:87` calls `field.discrete`; `InspectorFieldContext.tsx:90` uses the supplied `runDiscrete`; `ProInspector.tsx:247` provides it; `useStyleHandlers.ts:117` flushes pending style/history before and after the action. Credit this source path rather than assuming every ratio click necessarily coalesces. Nested attribute/style transactions are grouped by `Composer.ts:1263`–`:1295`. However, `runTxn` (`attributeWriter.ts:30`) ends in `finally` and does not invoke rollback on failure. Real combined cleanup/Undo and exception behavior remain unverified.

## Exact bounded acceptance proposal

1. **Route and scope:** existing Settings Ratio opens the canonical Style ratio control. Start on Mobile; show `This video · all breakpoints`, then switch Desktop and retain the same ratio. Other Style dimensions retain their own scopes. Return/reopen retains video identity and caller context.
2. **Output:** use a valid provider fixture with a stable poster. At a fixed 320-pixel specimen width, 16:9→4:3→1:1 produces heights 180→240→320. A narrower 240-pixel specimen produces 135→180→240. These are ratio-box demonstrations, not video playback. Preserve URL, provider, autoplay, muted, controls, classes, radius and color for every choice.
3. **Useful history:** choose 4:3, repeat 4:3, Cancel/reopen, then Undo → previous ratio. Repeated choice and navigation consume no snapshot. Reset → absent attribute/default 16:9; Undo restores the previous explicit ratio. Record the finite one-step limitation separately from full engine history.
4. **Legacy migration:** begin with exactly the stock base pair. Changing ratio removes the old crop in the same modeled operation. Undo restores ratio presence/value and both original declarations. Exercise the same global migration from Mobile to avoid pretending it is Mobile-only. A non-legacy fixture retains its unrelated height/padding.
5. **Eligibility:** locked video and stale target reject with a reason and no write. Mixed/incompatible selection either gets an explicit unsupported state or its own independently verified multi-target path. If protection toggles invalidate prototype Undo, disclose it and ensure Undo cannot silently overwrite newer protection.
6. **Invalid source:** invalid URL remains visible with provider error/placeholder after ratio navigation/change; recovering the URL restores a preview at the selected ratio. No external request success, new media, autoplay or provider availability is inferred from a geometric specimen.

Inspect authored reactions separately from visible output. Record all new/reused row and route IDs in root's acceptance evidence. A chooser destination or text-only ratio change is insufficient.

## Tests inspected and remaining runtime gates

`src/editor/inspector/sections/typeBlock/__tests__/embedBodies.test.tsx:39` asserts the ratio attribute and mocked `onBatchChange` call. Despite its “one Undo” title, this case does not execute combined actual style Undo: `bodyHarness.tsx:26` supplies a mock batch handler. The same suite covers URL detection/refusal, flags and URL Undo. `src/engine/export/__tests__/embedExport.test.ts:54` compares generated iframe attributes across canvas/single/published writers, `:73` covers serialization reload, and `:88` covers refused URLs. No tests were rerun for this audit.

Runtime gates: actual global attribute and scoped-style migration; one-step atomic Undo/Redo and rollback; mixed selection and permissions; URL/parser edge cases, unavailable/private/provider-restricted video; iframe dimensions under responsive/pseudo/class CSS; canvas/export/browser consistency; keyboard focus/announcements; autosave/reload. Native Video, Map and Lottie sizing are separate contracts. This report is an actionable R43 plan, not authored acceptance or module closure.

## Appendix — native reuse map, 14 October 2026

Fresh read-only Figma inspection on page `8463:2`; no canvas or variable mutations. Scoped Shared Style inspection found no actual Ratio/Aspect ratio control. A subsequent page **name** search found older box-model examples and media-crop controls, described below. This is an inspected-scope finding, not a claim about every page/file. The existing Ratio chooser and instance masters should be reused.

### Existing Video entry and chooser

| Existing node / variable | Native finding / reuse contract |
|---|---|
| Video root `8843:22237` | `R35 / Inspector / Video Embed`, 1440×1000. Keep as the task's caller. |
| Style entry `8843:22445` | Existing `Action / Style`; opens Shared Style `8841:14864` as an **OVERLAY**, after initializing caller, context, eligibility and the video-specific shared values. Preserve those actions when adding Ratio eligibility. |
| Settings Ratio row `8843:22461`, label `8843:22462`, field `8843:22463` | Field is an instance of master `8531:318`. Its value text `I8843:22463;8531:319` binds characters to `VariableID:8843:22465` (`video-embed/Ratio`, currently `16:9`). Field currently opens chooser `8844:265290` directly. Change this existing entry into the canonical Style route; do not leave it as a second independent appearance editor. |
| Chooser `8844:265290` | Existing `R35 / Choice / Ratio`, 400×266; title `8844:265291`, explanatory text `8844:265292`. Reuse and update copy/context as required. |
| Options `8844:265293` / `8844:265296` / `8844:265299` | Existing 16:9 / 4:3 / 1:1 actions. Each currently sets only `VariableID:8843:22465` to its string, then CLOSE. No geometry, snapshot, cleanup or guard is in this chooser today. The 16:9 instance resolves to master `8314:7`. |
| Cancel `8844:265302` | Existing CLOSE-only action, master `8314:5`; preserve a no-write cancellation contract. |

### Shared Style ownership, gating and return

Shared Style root `8841:14864` contains panel `8841:14865` (352×920). Size disclosure is `8841:14987`; body `8841:14989` (318×536, HUG) is visible through `VariableID:8841:14990` (`style/size/open`). Existing Width and Height fields are `8841:14994` and `8841:14999`; they are dimension controls, not owners of `data-embed-ratio`.

The existing Video Style entry sets:

- `VariableID:8841:14860` (`inspector/caller`) → `video-embed` and `VariableID:8841:14861` (`inspector/title`) → `Video Embed`.
- `VariableID:8841:14862` (`inspector/layout`) → false and `VariableID:8841:14863` (`inspector/typography`) → false. Video does not inherit text/layout eligibility merely because Ratio moves into Style.
- `VariableID:8905:17347` (`r36/inspector-context`) from `VariableID:8905:17637` (`r36/context/video-embed`). The shared context text is `8841:14880`.
- Existing family guards: `VariableID:8990:17456` (`r40/columns/active`) false; `VariableID:8975:17646` (`r39/icon/active`) false; `VariableID:8975:17647` (`r39/icon/generic-size`) true; `VariableID:8940:17372` (`r38/typography/supported`) false; `VariableID:8905:17348` (`r36/image-fit-visible`) false; `VariableID:8908:17357` (`r36/image/fit-reset-visible`) false.
- All existing section-open variables false, including Size, before navigation. A Ratio-specific route should deliberately open its intended canonical control after this setup rather than rely on a previously open section.
- Shared Width/Height values `VariableID:8841:14992` / `VariableID:8841:14997` from video-specific `VariableID:8847:17912` / `VariableID:8847:17913` (currently `Fill` / `Fit content`). Keep these distinct from the global Ratio variable.

Recommended mutation: reuse this entry's current initialization before routing Settings Ratio into Shared Style, then set a new **video-only** visibility flag and open/reveal the canonical ratio control. A new eligible row is justified because none exists in this shared panel; reuse existing field/button masters and the existing chooser. Turn that visibility flag off for every other family entry, including Icon, Columns, Text and Image, so returning from Video cannot leak the row into another inspector. Avoid replacing their existing initialization with a shortened generic route.

Panel header `8841:14866` contains Close `8841:14868`. Back to Settings is `8841:15383` (master `8314:5`). Both contain substantial existing variable persistence followed by CLOSE; they do not navigate directly to the Video root. Shared root Escape similarly persists caller-specific values and closes; its Video branch currently has 78 assignments. **Retain those close/return actions** when adding ratio behavior. A bare CLOSE replacement would discard the existing shared Style persistence contract. Overlay return already preserves the underlying Video root/device; do not create a duplicate Desktop/Mobile root for this route.

### Device routing and actual geometry bindings

| Node / variable | Current native behavior |
|---|---|
| Desktop `8843:22271` / Mobile `8843:22272` | Existing buttons mutate device appearance, Video viewport width and context text in place. They do not navigate to separate Video roots and currently do not change Ratio. |
| `VariableID:8843:22529` (`video-embed/viewport`) | Desktop sets 720; Mobile sets 375. This is the **website specimen width**, not the actual video-frame width. |
| Website `8843:22528` | Width is bound to that variable; current 720×540, fixed height, 32px padding on all sides. Its parent canvas viewport is `8843:22274` (824×762). |
| Selected specimen `8843:22532` | `Selected / Video Embed`, currently 656×54, horizontal FILL / vertical HUG, padding 16px. No width/height variable binding. Only child `8843:22533` says `Studio tour · Play`. The current ratio choices therefore have no ratio-driven frame geometry. |
| Context labels `8843:22301` / `8843:22453` | Both characters bind to `VariableID:8905:17637`: Desktop sets `Video Embed · Desktop · Base`, Mobile sets `Video Embed · Mobile · Base`. Keep this device context, and add an explicit global Ratio scope rather than relabelling it as a Mobile override. |
| Device appearance variables | `VariableID:8914:17668` / `17669` are Desktop/Mobile background colors; `VariableID:8914:17670` / `17671` are Desktop/Mobile text colors. Existing device reactions swap them between current surface/accent tokens. Preserve those reactions. |

Geometry implication: with existing website padding, selected outer width is 656 on Desktop and 311 on Mobile. If a player is nested inside the selected frame's existing padding, its usable width is 624 / 279. Derive its ratio height from whichever frame is explicitly designated as the player; using website width 720 / 375 would produce the wrong ratio. If root changes padding or sizing while authoring, record the new target dimensions rather than retaining these derived numbers. The fixed 540px website height also needs review for a tall 1:1 player plus surrounding content; enable the appropriate content sizing/viewport scroll without clipping the player.

Current URL fixture `VariableID:8843:22459` (`video-embed/Video URL`) is `youtube.com/watch?v=studio`, which fails the source's 11-character YouTube-ID rule. Replace it with an explicitly valid sample before showing recognized-player output, or retain it as the invalid-source leaf. Current playback fixture variables are `VariableID:8843:22471` Autoplay=`No`, `VariableID:8843:22477` Muted=`No`, and `VariableID:8843:22483` Show controls=`No`. Preserve these explicit values during ratio changes; Show controls=`No` is an authored fixture value, not the source's missing-attribute default.

### Older aspect-ratio matches: available patterns, separate ownership

- `8468:628` (`Property / Aspect ratio`) is an instance of master `8316:11` under `I05 / Design / Box model & units`, root `8465:6`; it has no reactions. `8584:12320` is the corresponding `R27M / I05` example under root `8584:12241`, also without reactions. These are older responsive-sizing examples, not a canonical shared Video ratio editor.
- `8539:11695` (`Field / Aspect ratio`, master `8328:96`) belongs to image crop under `R26 overlay / media-crop` root `8539:11678` and swaps to crop chooser `8730:13975`. Keep this separate: image cropping is not the generated video iframe's display ratio.
- No actual Ratio/Aspect ratio node was found inside Shared Style in this inspection. The substring matches Decoration and Saturation are unrelated and were excluded. Page-name search found the current Settings row/chooser above, so reuse those instead of inventing a second chooser.

This appendix supplies a pre-mutation reuse map only. It adds no authored behavior or acceptance claim.
