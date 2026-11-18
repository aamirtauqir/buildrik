# R37 — Inspector text-style ownership continuation

13 October 2026. Resumed from R36 in existing improved Figma page `8463:2`, file `g4GzQFqzNYz5sosz1QtZXC`. No application source or original design baseline edits.

## Delivered scope

Text, Heading, Paragraph and Label Settings previously exposed independent text-style variables alongside the shared Style editor. Their values could disagree. These four controls now say **Edit in Style →**, use the respective existing Style navigation/context actions and open Typography directly. Heading Level remains a Settings control.

The canonical Style chooser now retains all eight existing named Brand size slots plus Custom: Heading 1/2/3, Sub-heading, Body large, Body text, Caption and Caption XS. Existing button/field instances and token bindings are reused. The chooser adds Escape dismissal and preserves Cancel. Per-type Style defaults are reconciled with the former Settings defaults, including Heading 1 for the Heading fixture.

[Heading entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8843-16808) · [Canonical chooser](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8844-264727).

## Source contract

- `src/editor/inspector/sections/typeBlock/bodies/textBodies.tsx:65`: the running implementation obtains choices from the Brand token registry. Choosing a style binds **font-size only** to the token CSS variable. It does not apply a complete family/weight/line-height preset or change the semantic heading tag.
- Choosing Custom resolves the bound token to its current literal size where resolvable; selecting Custom on an already unbound size makes no write. Missing/unresolved token and mixed/locked selection behavior still require explicit design coverage.
- `src/editor/design-system/ui/sections/TypographySection.tsx:60`: eight known size-slot names. `typeStyleRows` also includes additional font-size tokens, so the nine-choice Figma fixture is not a complete dynamic token registry.
- `src/editor/inspector/sections/typography/FontControls.tsx`: font-size offers px/em/rem/%/vw; line-height offers px/unitless/em/%/normal. Existing source tests specify that Custom preserves a resolved size; they were inspected, not rerun as fresh runtime evidence.
- The source currently places its binding row in the type block. Moving canonical ownership to Style is the agreed improved-design direction; this pass does not claim that application code already follows it.

## Verification

Native checks confirm all four Settings links target `8841:14864`, open Typography and do not write their former independent text-style variables. The existing Close path copies shared text-style state into the appropriate per-type store. All four expected destinations are wired. There are nine canonical choices.

Five affected roots passed **396 visible auto-layout child checks with no measured overflow**. Hidden/collapsed subtrees are excluded; the initial unfiltered inspection reported collapsed descendants and is not presented as a visible-layout failure. Figma screenshots of Heading Settings and the chooser were visually reviewed.

Browser playback at 1440×1000 visually verifies:

1. Heading Settings → Mobile → Edit in Style retains Heading / Mobile / Base and opens Typography.
2. The chooser presents all nine options, with reachable Cancel.
3. Choosing Heading 3 → Close Style → reopen through Settings retains Heading 3 and Mobile context.
4. Reopening the chooser and cancelling retains Heading 3.

Evidence: `evidence/r37-text-style-ownership.js`, mutation/native QA JSON receipts, `r37-text-style-walk.json.receipt.json`, `r37-text-style-return-walk.json.receipt.json`, and their PNGs. Raw browser receipts use VISUAL_REVIEW_REQUIRED; the visual disposition is documented here. Stable overlay URLs are not pass/fail evidence.

## Open gates and next work

This closes the named duplicate-entry ownership defect, **not the complete text-style control contract**. The Figma name changes and persists, but its Size field and canvas rendering are not yet coupled to the chosen token. The sample still displays Size 16 after Heading 3. Source behavior requires the resolved size to change; Custom must preserve it. Do not treat name persistence as rendered typography parity.

The current per-type typography store also does not establish independent Desktop/Tablet/Mobile values or correct inheritance. Its generic scope description must be reconciled when implementing that state model. Existing Reset sample changes legacy Settings variables; it is not a verified typography reset/Undo. Legacy choice frames remain in the file, although the four corrected Settings links no longer target them. Keyboard Escape wiring is inspected but not separately played.

Next: connect text-style token, resolved Size and selected specimen output; implement Custom and direct-size unbinding; verify cancellation/reset/Undo and breakpoint origin; then reconcile Icon size/Stroke width and remaining Settings appearance ownership. Continue the R36 module order after Inspector contracts. Every module acceptance gate and complete frontend readiness remain OPEN.
