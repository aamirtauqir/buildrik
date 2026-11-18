# R38 — Typography output and scoped recovery

13 October 2026. Continuation of R37 in existing improved Figma page `8463:2`, file `g4GzQFqzNYz5sosz1QtZXC`. No production/test source or original design baseline edits. The overall goal and all 14 module acceptance gates remain open.

## Delivered bounded behavior

Text, Heading, Paragraph and Label retain their Settings → canonical Style navigation. The eight named size choices now update the displayed Size and a native selected-text specimen together: Heading 1 36, Heading 2 30, Heading 3 24, Sub-heading 20, Body large 18, Body text 16, Caption 14 and Caption XS 12 px. These are the existing Brand fixture's sampled values, not universal product defaults or a live token resolver.

Custom retains the current resolved size. Choosing Custom again preserves the size and the preceding Undo snapshot. The finite direct Size interaction switches 16/20 px and changes the style name to Custom. It does not model arbitrary numeric input or unit validation.

Each of the four fixtures now has separate Desktop base and Mobile override state. Mobile starts with Desktop inheritance; a Mobile change leaves Desktop unchanged. Reset Mobile size removes the finite override; Undo size restores the preceding size operation, including its token/custom identity and override status. Desktop Reset returns to the fixture's initial named size; it is not a validated general CSS cascade reset. Close and reopening preserve the selected type and current device/value.

Heading's selection outline now surrounds the heading rather than its paragraph. Initial family/weight labels match the existing specimen fonts; initial unitless line heights are 1.2 for Heading and 1.5 for the other three fixtures. Selecting a named size does not change semantic heading level, family, weight or the authored line-height value. Other typography field edits remain outside this bounded rendered contract.

[Heading entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-16808) · [Text](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8842-14345) · [Paragraph](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-17112) · [Label](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-17410).

## Verification and corrections found during playback

The read-only authored-action interpreter passed **112 checks** across the four types: the eight size choices and exclusive visible specimen, inherited base, Custom/no-op, direct-size unbinding, reset, one-step Undo, Close/reopen, Desktop/Mobile separation and cancellation. Final result: `evidence/r38-state-qa-final.json`. This evaluates the actual authored reactions; it is not running-application verification or proof of Figma rendering.

Browser playback at 1440×1000 independently verifies Heading Mobile 36 → Heading 3/24 → Custom/24 → direct 20 → Undo/24 → Reset/36 → Undo/24. The final return walk verifies Close to Heading Settings with semantic H1 retained, Desktop 36 unchanged, Mobile 24 retained, reopening at 24 and cancelling the chooser. Text Caption XS/12, Paragraph Heading 3/24 and Label Body large/18 were also visually inspected.

Three defects were caught rather than counted as passes:

1. Numeric `fontSize` bindings changed state without changing rendered prototype text. The final prototype uses 32 native editable text variants controlled by visibility for the eight finite sizes across four types. It is not arbitrary text rendering or a production implementation strategy.
2. Hidden clones retained fixed heights despite sizing edits, clipping a wrapped Mobile heading. Exposing each text node during sizing, then restoring its visibility binding, fixed the observed clipping. The final Mobile 24 px screenshot shows both lines inside the selection box. `r38-heading3-mobile-before-wrap-fix.png` preserves the failure; `r38-visible-sizing-fix.json` records the final correction. Hidden-node layout getters are not treated as visible layout acceptance.
3. Style Close produced a Figma error screen after reactions had expanded to 4,393 top-level actions. Compaction reduced each Close route to 166 top-level actions, retaining conditional persistence. The return path then passed visual replay; the precise internal Figma exception was not established. `r38-close-error-before-compaction.png` and `r38-close-compaction.json` retain that evidence.

Text's first chooser attempts occurred while the overlay was loading and are not passes. `r38-text-loaded-final.json.receipt.json` plus the final `r38-text-caption-xs.png` provide the successful visible result after the chooser loaded.

The earlier scoped native inspection checked six roots, 275 instances and 418 visible auto-layout child bounds with no missing inspected master or measured overflow. That default-state scan did not detect hidden-variant clipping and must not replace the later browser checks. No broader layout or accessibility certification follows from those counts.

Final browser evidence: `r38-final-walk.json.receipt.json` for the size/recovery and other-type samples; superseding `r38-return-and-text-final.json.receipt.json` for the repaired return route; `r38-text-loaded-final.json.receipt.json` for Text after loading. Receipts label screenshots `VISUAL_REVIEW_REQUIRED`; this report records the actual visual disposition. Unchanged overlay URLs are not acceptance evidence.

## Source contract and remaining work

R37's source findings still apply: `textBodies.tsx` binds only font-size to a Brand token; Custom resolves it to a literal where possible. This pass does not change that source.

Still open: dynamic Brand token additions/changes and live propagation; missing/unresolved tokens; mixed and locked selections; arbitrary content, units, invalid input and numeric ranges; the real Desktop → Tablet → Mobile cascade; pseudo-state combinations; complete Undo/Redo history; keyboard/focus/Escape playback; type eligibility beyond these four; remaining typography controls and the legacy Settings Reset sample. The new size-specific recovery controls do not certify the legacy general reset.

Next Inspector work: reconcile Icon size/Stroke width and other Settings appearance duplicates against source ownership; resolve Tablet inheritance and broader typography contracts. Continue the R36 module acceptance order afterward. Do not move open design work into a runtime-dependency category just to close a gate.

The user selected a three-agent workflow: root performs Figma edits/integration; one agent audits Inspector source contracts; one audits coverage/handoff. They write separate reports and do not edit production code or Figma.
