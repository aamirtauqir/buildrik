# R28 — Editor repair and separate Build workspace

Date: 2026-10-13  
Status: **IMPLEMENTED AND VERIFIED FOR THE BOUNDED JOURNEY BELOW. FULL PRODUCT NORMALIZATION REMAINS OPEN.**

The improved Figma design was edited directly. Editor and Build now have separate working layouts within the same project. Production source and original baseline pages were not changed by this pass.

## Review the actual design

- [Editor](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-3)
- [Build entry](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8628-12592)
- [Build change review](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8628-12826)
- [Interactive Editor → Build journey](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8465-3&starting-point-node-id=8465%3A3&hide-ui=1)
- [Shared workspace switch](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8627-631) and [task status variants](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8627-647)
- [Figma handover](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8645-26) and [review/fixture console](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC/Buildrick?node-id=8633-12844)
- [Architecture specification](../superpowers/specs/2026-10-13-unified-editor-ai-workspace-design.md) and [scoped parity matrix](R28-EDITOR-BUILD-PARITY.csv)

## Implemented architecture

Editor owns manual selection, properties, layers and responsive editing. Build owns the task, conversation, draft preview and change review. CMS, Brand and Assets retain their existing owners. Global Review remains human review; the Build review panel compares proposed changes.

Build uses **400px task + 1040px preview** at the authored 1440 × 1000 viewport. Only the review step expands to **400px task + 640px preview + 400px review**. Back to draft closes the third panel. This is an authored desktop layout, not verified narrow-window responsiveness.

Six native, editable Build states were added on page 04: task entry, processing, draft ready, review, applied, and failure/retry. The shared workspace switch was integrated into **82 existing workspace frames**, plus the six Build frames: **88 instances**, verified in final readback. Four older full-screen overlays retain their Back/Return contract. The 43 explicitly proposed AI/Agents/Team frames remain unverified and were excluded.

The first authored task changes the Home hero heading. Draft and committed content have separate variables. Apply updates the native Editor heading; Undo restores the value captured before that run. Equivalent heading content is bound across 51 current text layers. This is not a claim that every older page-content fixture has become a dynamic document.

## Cross-screen consistency record

| Pattern | Shared implementation | Validation / exception |
|---|---|---|
| Editor / Build navigation | `8627:631`, two variants | 88 attached instances; representative Heading and Mobile/Main section return played |
| Task feedback | `8627:647`, five states | Six Build instances; state-specific copy and semantic colors inspected |
| Buttons and typography | Existing TO-BE buttons and text styles | Reused across new screens; no separate Build visual foundation |
| Source select label | Existing `8531:330` / label `8531:331` | Ellipsis prevents long filenames wrapping outside controls; source and Heading inspector representatives inspected |
| Website previews and project cards | Existing native page-content layers | Kept editable as user content, separate from product-chrome components |
| Full-screen legacy overlays | Existing caller-return pattern | Architecture exception retained; their broader consistency gaps remain in the earlier audit |

No new visual-token collection was introduced. Six prototype variables live in a separate simulation collection. Figma permits only the general scope for the two BOOLEAN variables in this bridge; they are explicitly scoped and hidden from publishing.

## Verification and repaired defects

Browser playback used the actual Figma prototype at 1440 × 1000. Screenshots were inspected in addition to checking destination URLs. Overlay URLs remain on their caller and are not treated as proof of an overlay outcome.

| Check | Observed result | Evidence |
|---|---|---|
| Draft isolation and resume | Editor retains the old heading before Apply; reopening Build resumes the draft | `r28-build-walk-01/02`, before-apply and resumed screenshots |
| Review and Apply | Third column shows current/proposed text; native Editor shows “Spaces for better living.” after Apply | `r28-build-review.png`, `r28-editor-applied.png` |
| Immediate Undo and discard | Both restore/retain “Make space for what matters.” in the tested fixture | Final `r28-build-walk-03` and screenshots |
| Failure and retry | Forced Build failure retains the request; Retry reaches Draft | First four steps of `r28-build-walk-04` |
| Non-heading return | Main section/Mobile context is captured and the same Mobile screen is restored | Final `r28-build-walk-04b` |
| WF-01 padding | Desktop left changes to 8px while right stays 32px; Mobile left changes to 8px while right stays 24px | `r28-editor-walk-01/07`, final native readback |
| WF-02 CMS | Articles retained across Fields, Dynamic pages and Settings; caller returns to detached Primary button | `r28-editor-walk-03` |
| WF-03 caller label | Removed false Heading-specific claim from CMS entry | CMS records screenshot; static preview/publish portion remains open |
| WF-04 image selector | One visible asset list now selects and commits the gradient filename while retaining authored alt | `r28-image-selected.png`, `r28-image-committed.png` |
| WF-05 inspector overlap | Component master/detach descriptions wrap and push controls down | Native screenshots and `r28-cms-caller-return.png` |
| WF-06 delayed states | Upload and URL reach Ready and forced failure; both Retry paths recover and commit. Cancel preserves the committed URL | `r28-editor-walk-02/04/05/06/07` |
| WF-09 grid | Third card is visible on row two in both Desktop and Mobile; card text widths normalized | Native visual checks and `r28-final-native-qa.json` |

All six Build roots are 1440 × 1000, use auto-layout for related regions, and have no top-level child outside their bounds. They contain native text/layers rather than flattened screenshots. Final status copy, attached switch components, caller-route counts and padding bindings are in [native QA](evidence/r28-final-native-qa.json).

Two tool-bridge behaviors required fixes found through playback: a multi-branch conditional persisted only its first and last blocks, and delay values behaved differently from the documented Plugin API units. Return uses 82 separate two-block conditional actions, with all routes confirmed in readback. Timings were verified empirically. Details and affected IDs are in [runtime fixes](evidence/r28-build-runtime-fixes.json). The [official Trigger documentation](https://developers.figma.com/docs/plugins/api/Trigger/) describes milliseconds; the observed bridge behavior must not be generalized to application code.

Earlier failed-coordinate attempts and the pre-fix Mobile return receipt remain saved. The last two steps of the first batch 04 were interrupted by an overlapping browser session and are not accepted evidence; the final sequential batch 04b supersedes them. The original construction receipt overcounted eligible switch frames by four; the final measured count is 88 instances, not 92.

## Remaining issues and limits

| Severity | Location | Open item / next correction |
|---|---|---|
| High | Broad existing workflows / WF-07 | Replace generic outcomes and unwired actions with feature-specific behavior after validating source capability. The prior inventory is not fully closed. |
| High | Build runtime | General prompt editing, arbitrary page generation, agent/MCP execution, permissions, conflicts and persistent sessions are not implemented. Specify service contracts and supported operations before claiming runtime behavior. |
| Medium | Preview/publish / WF-03 | Older static canvas fixtures do not consistently represent every current caller/content state. |
| Medium | Responsive workspaces / WF-08 | Older Mobile reset fixtures and a narrow-window Build shell still require state/layout work. |
| Medium | Build undo/history | Immediate prototype undo is tested; persistent history, concurrent edits and cross-session recovery are not. |
| Verification | B02 processing Cancel | Native action is connected and clears the pending-draft flag. Two timed browser attempts were blocked by an unresponsive browser daemon; cancellation playback remains unverified. The diagnostic `r28-build-cancelled.png` is not accepted cancellation evidence. |
| Verification | Complete product inventory | This targeted pass does not close all previously pending native reads or certify original-to-improved parity. |

The Figma request text is a fixed example. No model, external MCP tool, upload service, backend save or publication was executed. Documents support the actual changed Figma design; they do not establish completion of the remaining product scope.
