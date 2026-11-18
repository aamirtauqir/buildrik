# R44 — Video embed Ratio output and recovery

14 October 2026. **Bounded design/prototype acceptance only. All 14 module gates remain OPEN.** This pass corrects the existing Video embed family (`8843:22237`), adds one canonical Style Ratio control, and provides finite source recovery. Native Video, Map and Lottie are separate contracts. No application implementation, provider playback, real remote write or publish is claimed.

## Authored contract and provenance

Settings Ratio `8843:22463` now routes to Shared Style `8841:14864`, whose video-only field is `9051:17526` (row `9051:17524`, section `9051:17523`). The existing chooser `8844:265290` supplies 16:9, 4:3 and 1:1. Reset is `9051:17532`; one-step Undo is `9051:17534`. The field explicitly says this video / all breakpoints. Width/Height and other Style CSS retain their own ownership; a Mobile entry does not create a Mobile-only Ratio override.

The player `9051:19953` and poster/error children `9051:19954` / `9051:19957` use the actual inner width: **622 Desktop / 277 Mobile** after padding and borders. The resulting heights are 349.875 / 155.8125 for 16:9, 466.5 / 207.75 for 4:3, and 622 / 277 for 1:1. Earlier planning estimates excluded border effects and are superseded by these authored dimensions. Website content hugs its height, and the canvas scrolls vertically. A stable poster represents the source; it is not a live iframe or provider availability test.

Raw ratio presence and value are separate. Missing/default and an explicit valid same choice are no-ops that preserve useful Undo. Empty/malformed imported values display the 16:9 fallback but selecting 16:9 intentionally normalizes them. A known stock base legacy pair (`height:0px; padding-bottom:56.25%`) is removed even when the effective ratio stays the same. Unrelated authored height/padding are preserved. Reset removes the owned ratio and recognized legacy pair; it does not recreate the old box. Undo restores the prior raw ratio presence/value. It restores height/padding only when that operation migrated the recognized legacy pair; those properties must still be absent/empty. A newer write to either migrated property refuses the entire Undo without overwriting it. When no migration occurred, Undo preserves current unrelated height/padding, including edits made after the ratio change. Target, generation, eligibility and revision guards prevent stale recovery. URL and Autoplay/Muted/Controls are outside this snapshot.

Source entry `8843:22457` and error recovery `9055:17522` open dialog `9055:17502`. Finite draft `9055:17510` offers one valid YouTube URL and one unsupported URL; Apply `9055:17513` validates, while Cancel `9055:17515` and Escape discard the draft. Apply also rechecks target, generation, current URL and eligibility. **Rejecting an unsupported draft at Apply is a proposed design correction:** the current source URL handler stores unsupported input and renders a placeholder. The existing-invalid fixture plus guarded Apply therefore does not establish current runtime parity. Arbitrary text entry, Vimeo and full parser behavior are not represented by these two draft choices.

Reviewer scenarios `9051:19964`, entered from the design footer `8843:22329`, expose legacy, imported/raw, source and eligibility fixtures. They are review controls, not a proposed in-product scenario selector.

Evidence provenance:

- `evidence/r44-video-author.js` is the original author script. Its tool call timed out **after committing**. `evidence/r44-video-reconciliation.json` reconciled the committed native state; authoring was not blindly rerun.
- `evidence/r44-video-mutation.json` is the reconciled manifest, including subsequent Undo revision guarding and coherent Reset sample corrections. It is not an untouched receipt of the original timed-out call.
- `evidence/r44-video-undo-ownership-correction.json` records the final logic-only change to Undo `9051:17534`: restore only migration-owned style state and refuse recovery over a newer style write. This fixes an ownership gap found after the initial 1,130-assertion run. The current 1,258-assertion receipt reads the corrected native actions.
- `evidence/r44-video-source-author.js` and `evidence/r44-video-source-mutation.json` describe the later finite source dialog.
- `R43-VIDEO-RATIO-CONTRACT.md` and `R44-VIDEO-ACCEPTANCE-PLAN.md` provide the prior source audit and acceptance plan. Their pre-authoring IDs and estimates are historical where superseded above.

## Independent action and native audits

`evidence/r44-video-state-qa.js` / `.json` read and interpreted native actions with synthetic state held locally. **1,258 of 1,258 assertions passed, zero failures**, across 97 inspected nodes. These are repeated state assertions, not 1,258 accepted user tasks or module completion units. The run made no native node or variable mutations.

| Assertion category | Passing assertions |
|---|---:|
| Fixtures × choices × Reset / Undo | 822 |
| Useful history, origin and scope | 36 |
| Undo ownership after intervening style edits | 128 |
| Eligibility, stale targets and recovery | 74 |
| Invalid source and snapshot isolation | 19 |
| Source draft validation, cancellation and guards | 54 |
| Review-fixture Reset | 14 |
| Shared Style routing and bindings | 111 |

The interpreter covers three ratios on both devices; exact raw/legacy recovery; absent versus explicit/default and malformed normalization; no-op preservation; cancellation; locks/mixed/missing/stale target and revision guards; source draft/refusal/recovery races; source/player isolation; and Style Close/Back/Escape. The 128 added ownership assertions exercise clean/custom fixtures and choice/Reset on both devices: non-migration Undo preserves newer unrelated sizing; migrated-pair Undo refuses each separate height/padding presence/raw race while retaining the document, revision and recovery snapshot. Normal legacy restoration remains covered by the original matrix. It exercised 54 non-video canonical Style entries clearing video eligibility. This is authored-action evidence, not actual application history or browser layout for every synthetic state.

Latest structural `evidence/r44-video-native-qa.js` / `.json` (before the final logic-only Undo ownership correction; references, geometry and bindings unchanged): **6 scopes, 412 nodes, 186 visible nodes, 165 instances, 5 masters, 47 destinations, 180 visible geometry checks, zero missing references or geometry issues.** All 83 inspected routes to Shared Style contain the video eligibility gate; no old-only Ratio writer remains. The 83-route structural scan and 54-entry interpreted sample are different checks, not conflicting counts. Route scanning does not execute every caller branch. Shared Style close/return persistence actions remain present; no pre-authoring byte-level comparison is claimed.

Native geometry is the authored default state only. Root's browser review independently confirms the invalid Mobile 16:9 error and Edit source fit the 277-wide player; this resolves the hidden error-frame sizing concern for that reviewed state, not all possible text/content states.

## Browser evidence reviewed by root

These outcomes were visually reviewed by root, not inferred from filenames or an automation pass alone. Browser receipts cover the entry, ratio, output/recovery, legacy and source-recovery walks; screenshots below are the corresponding inspected evidence.

| Meaningful journey | Reviewed result and evidence |
|---|---|
| Canonical entry and global output | Settings Ratio reaches Style with global scope; Mobile 4:3 remains 4:3 on Desktop. `r44-video-mobile-canonical-style.png`, `r44-video-mobile-four-three.png`, `r44-video-desktop-retains-four-three.png`. |
| Useful history and Reset | Repeating 4:3 retains Undo; Undo returns to default. Square → Reset → Undo restores square. `r44-video-repeat-keeps-undo.png`, `r44-video-undo-default-desktop.png`, `r44-video-desktop-square.png`, `r44-video-reset-default.png`, `r44-video-reset-undo-square.png`. |
| Tall output is reachable | Desktop 1:1 scroll exposes the entire 622-square player, caption and page footer. Root used canvas wheel at 650,650 with deltaY 480. `r44-video-square-scrolled.png`. |
| Known legacy migration and recovery | Mobile warning → 4:3 removes the recognized legacy box/warning → Undo restores legacy state. `r44-video-mobile-legacy-warning.png`, `r44-video-mobile-legacy-migrated.png`, `r44-video-mobile-legacy-restored.png`. |
| Invalid source remains recoverable | Error plus Edit source fits Mobile 16:9; invalid square remains an error, not a successful player. `r44-video-mobile-invalid-source.png`, `r44-video-invalid-source-square.png`. |
| Draft validation and recovery | Source dialog shows unsupported draft refusal; a valid draft and Apply recover the same Mobile square. `r44-video-source-editor.png`, `r44-video-source-invalid-draft.png`, `r44-video-source-valid-draft.png`, `r44-video-source-recovered-square.png`. |
| Ratio Undo preserves external state | Recovered URL remains after Ratio Undo. Autoplay Yes also remains when Ratio Undo restores default. `r44-video-ratio-undo-keeps-source.png`, `r44-video-ratio-undo-keeps-playback.png`. This is flag state, not actual autoplay. |
| Refusal and coherent recovery | Locked Reset gives a reason; stale target refuses; Reset sample restores a coherent specimen. `r44-video-locked-reset-refusal.png`, `r44-video-stale-refusal.png`, `r44-video-reset-sample-coherent.png`. |

All screenshot names above are under `evidence/`. Cancel/Escape source behavior, the full synthetic raw-state matrix, intervening-style Undo ownership cases and all eligibility permutations retain interpreter evidence only unless explicitly included in this browser table.

## Source discrepancies and remaining acceptance

`src/shared/utils/embed/embedFrameHTML.ts:25` defines the three ratios; `:38` supplies fallback 16:9 and `:65` generates iframe output. `src/editor/inspector/sections/typeBlock/bodies/embedBodies.tsx:71` writes the global ratio attribute. Its legacy detector at `:36` accepts broader percentage padding/zero height, while cleanup at `:72` uses Style writes. `src/editor/inspector/hooks/useStyleHandlers.ts:340`–`:362` addresses the active breakpoint/pseudo layer. Consequently, **global ratio versus scoped cleanup remains a source implementation conflict**. The prototype's explicit stock-base cleanup is a bounded safe design proposal, not proof that the source now handles inherited/mobile/pseudo or per-target styles correctly.

The current source places its type controls in Style (`sections/registry/type.tsx:16`); this pass corrects improved Figma's Settings ownership, not a proven identical source ownership defect. Source URL writes at `embedBodies.tsx:56` permit unsupported stored input, unlike this finite dialog's validating Apply. `embedFrameHTML.ts:36` enables true/bare-empty autoplay or muted; missing defaults off, while controls defaults on unless exactly false. The authored explicit Show controls=No fixture is not the missing-attribute default.

Remaining work includes arbitrary/unknown legacy CSS, responsive/pseudo/class origins and multi-target migration; mixed/protected/permission contracts; arbitrary URL drafts, parser limits and Vimeo/provider errors; real iframe sizing under CSS, playback and autoplay policy; keyboard/focus/accessibility; canvas/export consistency and durable autosave/reload; actual engine transaction Undo/Redo and rollback. The source's mocked cleanup tests do not prove combined real style Undo. Native Video, Map and Lottie need separate design acceptance.

## Register reconciliation

`R36-INSPECTOR-CONTROL-REGISTER.csv` now has **532 unique rows**: the prior 531 plus `style/size:Video ratio`. Existing `video-embed:2` remains as the canonical Style route, not a second ratio editor. `video-embed:1` records bounded finite source recovery and its runtime difference; rows 3–5 retain OPEN leaf contracts with Ratio-isolation evidence only. Other leaf rows are unchanged.

Only Inspector Style and Inspector Settings and Forms received R44 evidence and precise remaining Video work in `R36-MODULE-ACCEPTANCE.csv`. **All 14 module acceptance gates remain OPEN.** Row counts, screenshot counts and passing assertions establish evidence coverage; none is an overall completion percentage.
