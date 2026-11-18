# C01/C02 browser acceptance — 21 October 2026

**36/36 pointer-navigation transitions passed. C01/C02 are CLOSED for the bounded pointer-navigation findings after independent evidence review. Overall PARTIALLY VERIFIED.**

The owner explicitly selected “Resume existing Figma design and prototype” after being asked whether that overrides the standing no-Figma boundary for this continuation. This authorizes the existing design/prototype continuation; application changes and deployment remain excluded. No Figma nodes, reactions, application files or production data were changed in this acceptance pass.

## Scope and method

C1 completion of existing selection and issue-location navigation. Canonical file `2L9OTGzBrL6kYmU18yA1c7`, page `3:10`; preserves the approved shell and existing property ownership. Source engineering, schema migration, styles, save operations and permissions are outside this navigation check.

Read current native reactions and control bounds for ten frames with figma-use, then played native Figma navigation in Chromium using browse. Viewport 1600×1100; 1440×996 specimens fit inside the player's 1504×980 canvas. Pointer/mouse events were dispatched at rendered control centers; no navigation state, URL or reactions were rewritten to produce a pass. Direct loads of the F1 and F4 starting frames are excluded from the transition count.

- [Current control inventory](navigation-playback-controls.json)
- [Actual transition log](navigation-playback-log.json): 36 passes, zero destination mismatches. The first three entries retain observed destinations without coordinates; subsequent entries include coordinates.
- The browser initially failed to bind localhost inside the sandbox. User-approved escalation started the browser successfully. GPU was enabled; the player still displayed a hardware-acceleration advisory during some captures.
- This is prototype playback, not application runtime or participant testing.

## Acceptance results

| Check | Observed result |
|---|---|
| Eyebrow, Headline, Explore: Layers and canvas entry | All six entry paths reach the matching selection. Canvas outline, Layers selection, breadcrumb and Inspector agree in the three screenshots. |
| Return to Hero | Each child's Hero row and Back to Hero controller return reach the original Home/Hero state. Eight elements remain; no inserted Text is shown. |
| Sibling switching | A three-child cycle through Layers and a three-child cycle through canvas targets both pass. Reverse-direction sibling permutations are not exhaustively played. |
| Existing Add route | Original Add opens the existing Add-text specimen; Layers returns to the original Hero. Text insertion and the rest of F1 were not rerun in this pass; earlier playback covers that guided journey. |
| Grouped alt-text Fix | Opens two named targets: Home › Hero › Hero image and About › Team › Team image. |
| Exact image location | Both targets display matching page tab, breadcrumb, selected image and Content Inspector, with empty Alt text and missing-text feedback. |
| Both return choices from both images | Back to affected images and Back to Issues pass independently for each image. |
| List return and close | Both return to the original Issues frame. Latest posts remains selected; one blocker and three tips remain; no save/count mutation is simulated. |
| Existing blocker Fix | Original collection-source Fix still reaches Latest posts with no source; Back to Issues returns to the original Issues frame. Collection selection/publication were not rerun here. |

## Separate design checks

| Dimension | Assessment and limits |
|---|---|
| Geometry | Six new specimens visually inspected at the recorded viewport. Required targets, controls and returns fit. Existing 284px Layers, 300px Inspector and 360px Issues layouts remain. No narrow/short viewport, responsive reflow or text enlargement acceptance. Scaling a fixed Figma frame is not responsive verification. |
| Grouping and hierarchy | Selection identity stays in the breadcrumb, Layers and Inspector. Each affected-image action is attached to its named page/path. Image returns are grouped above image properties. No new workspace or competing value owner was introduced. |
| Labels and status clarity | Controllers explicitly state static-field/navigation-only limits. Empty Alt text stays empty; Issues counts and saved-state fixtures are unchanged. Image inspection inconsistently displayed crowded text or black output on some reads. The Issues return and later capture are byte-identical, so the second capture does not establish a rendering improvement. Cause is unverified; no reliable typography/rendering-stability claim follows. |
| Interaction/accessibility | 36 pointer paths pass. The small canvas Eyebrow target also has the larger Layers-row alternative. Native prototype keyboard/focus, assistive technology and application accessibility are NOT RUN; pointer success cannot close them. |

## Screenshots inspected

- [Eyebrow](navigation-eyebrow.png), [Headline](navigation-headline.png), [Explore our work](navigation-explore.png)
- [Hero return](navigation-parent-return.png)
- [Affected-image list](navigation-affected-images.png)
- [Home image](navigation-home-image.png), [About image](navigation-about-image.png)
- [Issues return](navigation-issues-return.png), [later same-frame capture](navigation-issues-settled.png). Both files have SHA-256 `1e5e81649b5d0a32bd1231ae33ffb6105f61f15716efaf193d9905642629afa8`; the duplicate receives no extra validation credit. Inconsistent image-tool display does not prove a design defect or a rendering fix.

## Gate disposition and remaining work

G1/G2/G3/G5/G7 pass **for the bounded navigation evidence and existing contracts**. G4 has a normal-viewport visual sample with rendering limitations; G6 passes pointer navigation only, with keyboard/accessibility NOT RUN. G8 application implementation is NOT RUN. G9 has the controls, sequence, screenshots and [independent evidence review](navigation-playback-review.md). The reviewer checked recorded evidence, not a second browser execution.

No unresolved destination mismatch was observed. C01/C02 closure covers **pointer-navigation findings only**. Alt-text editing/saving is explicitly not simulated. Remaining work includes unplayed F3/F4/F5 branches, desktop playback, keyboard/accessibility, rendering stability and real participant acceptance. R1/B9 is pending and has not been waived.

