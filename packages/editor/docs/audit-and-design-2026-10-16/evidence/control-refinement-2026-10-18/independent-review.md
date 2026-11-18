# Independent targeted re-review — 2026-10-18

Read-only review of Figma file `2L9OTGzBrL6kYmU18yA1c7`. No application or Figma mutations by reviewer. This record supersedes the initial status in `/tmp/buildrick-refinement-review.md` only for the findings explicitly revisited below. Current readiness is bounded to represented static design; runtime/production verification remains NOT RUN.

## Evidence inspected

- Updated main shell `7:20634`, 1440×900: live screenshot `/tmp/reviewer-shell-final.png`, plus independent row-alignment readback.
- Updated ColorPicker master `32:1710`, 280×570 at capture: `/tmp/reviewer-color-final.png`.
- Eight-context board `36:2`, 1360×2094 at capture: `/tmp/reviewer-contexts-final.png`.
- Narrow shell `11:2`, 1024×768: `/tmp/reviewer-narrow-final.png`.
- Short shell `11:311`, 1440×600: `/tmp/reviewer-short-final.png`.
- Live component-set readback for Input `4:325`, Select `4:392`, NumericUnit `4:413`.
- Current `ColorFillPopover.tsx`, shared `ColorPicker.tsx`, canonical Inspector integration annex II-06, current panel delta and T6 Inspector/Brand extraction evidence.

## Resolved findings

**R-CR-01 resolved.** Input, Select and NumericUnit sets now each contain Default / Focus / Disabled / Error / Mixed / Hover. Hover is a real selectable variant in the correct owning set. No longer an orphan-only visual.

**R-CR-03 resolved in sampled shell.** Display, Font, Font size, Weight, Line height, Color, Width and Height rows return cross alignment CENTER, 276×32. Letter spacing returns CENTER, 276×40. Screenshot confirms aligned labels/controls and readable two-line labels.

**R-CR-02 local-picker controls substantially resolved.** The revised picker visibly has 2D shade and selection marker, hue control, alpha control and numeric percentage, exact color value, labeled contrast background, workspace palette, explicit local scope, Cancel and Apply. The previous one-dimensional gradient-only deficiency is corrected. This is a design representation, not an interaction or color-calculation test. Alpha transparency checkerboard and actual palette/token return behavior still require implementation/interaction validation.

## Remaining color ownership/scope correction at capture time

**R-CR-04 — Recent is unsupported by inspected authority.** The captured picker still has Local / Tokens / Recent. Current `src/editor/inspector/shared/ColorFillPopover.tsx:2–16` explicitly excludes recent colors. The existing audit extraction F-IN-89 says no eyedropper/recents; its gaps paragraph lists recents as unaddressed, not approved. No affirmative approval was found in the inspected canonical records. Remove Recent from this refinement; do not silently expand product functionality.

**R-CR-05 — preserve contextual shared edit, not merely a Brand destination.** Current source has Brand colors list with Use, hover/focus Edit, optional search/count, Add colors in Brand, and collapsed Custom color. Token editing has Cancel, Update everywhere, Only this element and explicit consequences (`ColorFillPopover.tsx:69–106`, `:120–215`). The refined Local picker can be a subview, but cannot replace these existing operations with a note that all token changes belong in Brand.

Approved II-06 strengthens these rules: picker header names target(s)/breakpoint/state; token preview resolves site preview mode; shared edit names token, `Editing shared Brand color`, Light/Dark, effective source and known usage; `Follows Light` and Set Dark value when unset. Commit paths are **Update [token] · Light/Dark** through the canonical Brand owner versus **Use on selected element(s)** as a local literal at the displayed breakpoint/state. Local literal applies in Light and Dark; other token consumers remain unchanged. Shared change failure retains draft. Cancel/Back/Escape discard only uncommitted draft. Alpha and existing CSS color values remain preserved, never fabricated black for unresolved tokens.

At the captured checkpoint, R-CR-04/05 remain blocking for declaring the complete color control family ready. They do not invalidate the sampled shell, context rows or local control visual improvements. Parent has acknowledged and is correcting them; pending work is not counted as done.

## Context and geometry assessment

The eight representative contexts are visibly distinct and internally coherent: Text content; Container layout; Image content; Effects with precision; Page/no selection; Multiple selection; Locked element; Component instance. Shared 300px panel anatomy is consistent. Content explicitly states all breakpoints; Style/Effects identify authored responsive scope; Page appearance remains the no-selection context; lock explanation names parent Hero; instance reset names the font-size override and fallback. Image content directs fit/dimensions to Style. Multi-selection uses Mixed text/split color swatch and expressly labels mixed-attribute wiring as an implementation gap.

No new blocking visual or ownership contradiction was found in these eight static specimens. They are representative design examples, not a full 69-block/120-native-route or 122-property acceptance result. The readonly parent lock in the specimen is proposed behavior; no engine verification follows.

At 1024×768, Site settings/Preview/Publish, stable resource rail, Layers, Pages/status and a visible Inspector trigger fit. Canvas controls form two rows; authored Desktop width stays1440 and zoom changes independently. The screenshot does not prove opening/closing the Inspector overlay or preserving keyboard focus.

At 1440×600, topbar, local canvas toolbar, Inspector identity/state/tabs and bottom bar remain visible. Content is clipped by the working-area boundary as expected for scrolling. Actual scroll reachability and focused-input visibility beneath the bottom bar were not exercised. The earlier sample's icon containment pass remains evidence for that sample, not a file-wide claim.

## Gate disposition / reporting boundary

- G1 PASS for bounded current-source/Figma evidence and explicit limits.
- G2/G3 PASS for sampled shell and eight context ownership; color shared/local contract requires R-CR-04/05 completion.
- G4 PASS for inspected static1440×900,1024×768,1440×600 layouts and context board; interactive/reflow accessibility NOT RUN.
- G5 specified continuity reviewed; full prototype navigation/return playback NOT RUN.
- G6 PASS for corrected sampled visual anatomy and represented states; complete variant matrix, keyboard/screen-reader behavior and WCAG conformance NOT RUN.
- G7 PARTIAL until color contextual-operation preservation is represented/mapped. Complete atomic preservation is not inferred from representative boards.
- G8 NOT RUN: no production UI, data, persistence, export or history implementation changed or verified.
- G9 useful source/specification/component evidence delivered; color corrections pending at capture.

Readiness at this checkpoint: **PARTIALLY VERIFIED — static design samples; color ownership correction outstanding.** Runtime, service/persistence, old-document compatibility, full accessible keyboard interaction,200% reflow and all-element coverage remain later implementation acceptance regardless of visual corrections.

## Final color correction recheck — later in the same review

Independently read and visually inspected board `39:9114` (952×1160), Brand entry `39:9120` (280×428), shared edit `39:9213` (280×782), and revised local master `32:1710` (280×526). Evidence screenshots: `/tmp/reviewer-color-flow-closed.png` and `/tmp/reviewer-color-local-closed.png`. This targeted check did not repeat unrelated shell review.

**R-CR-04 CLOSED.** Recent and the previous Local/Tokens/Recent strip are absent. Local surface is correctly titled Custom color. The exact hex value uses an actual input appearance without the previous recursive picker dropdown affordance.

**R-CR-05 CLOSED for the represented flow and its written annotations.** Brand entry preserves search, named token swatches/values, Use, Edit, Add colors in Brand and Custom color. Its annotation explicitly preserves token reference on Use and returns from Brand to the captured property. Shared edit shows token name, Editing shared Brand color, Known references · 12 in this site, Light/Dark draft target and source alias. Separate actions Update Text / Primary · Light versus Use on selected element disclose shared-token versus local-literal scope; local use expressly applies in both Light and Dark without changing other token consumers. Back/Cancel and Follows Light → Set Dark value are mapped. Failure/refreshed-value/history notes preserve the approved II-06 contracts. Example values/counts are labeled design fixtures.

**R-CR-02 CLOSED for bounded static local-picker representation.** Shade/hue/alpha/exact entry/contrast context/palette/Cancel/Apply are represented with local consequences. These are not executed controls or tested color calculations. The alpha gradient still needs its actual transparency/checkerboard behavior in implementation; no valid-color regression or alpha preservation result is inferred.

Shared edit is an expanded specification specimen, **not a viewport-fit prototype**. Its 782px intrinsic height cannot simply be placed unbounded inside short viewports. Required handoff: retain280px width; clamp to available viewport with12px edge inset (max-height viewport−24); keep identity and commit/cancel actions reachable with one scrollable body; retain draft while scrolling, bring focused fields into view and restore original trigger on Escape. This constraint has been sent to the parent for the execution annex. Actual popover positioning, scrolling and keyboard reachability remain NOT RUN.

**Final bounded outcome:** no remaining color ownership/capability blocker in the represented corrected specimens and mapped flows. Initial Hover and row alignment findings remain closed. G2/G3/G7 now PASS for the inspected color-flow preservation; G9 passes for this bounded artifact when the explicit viewport/scroll handoff above is retained. G4 remains limited to the sampled shell/context layouts; tall color popover fit is specified, not runtime-tested. Full component state matrix, all69 block workflows,122-row acceptance, prototype playback, keyboard/screen-reader interaction, service/save/reopen/history/output and200% reflow remain unverified. **Sampled design review complete; production/UI implementation NOT RUN.**
