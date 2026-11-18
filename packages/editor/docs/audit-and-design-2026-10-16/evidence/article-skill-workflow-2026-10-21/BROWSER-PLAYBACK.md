# Browser prototype playback — 21 October 2026

**Scoped PASS: the five selected journey paths played in Chromium, plus the archived Inspector Source/Back pair. Overall PARTIALLY VERIFIED.** No Figma screens or application code were changed by this verification.

Start: [native five-journey hub](https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id=302-3370&starting-point-node-id=302%3A3370&scaling=scale-down).

## Method and evidence

Used the `browse` skill and `figma-use` for a read-only control-coordinate inventory. Browser viewport: 1600×1100. The player fits 1440×996 journey frames into its available 1504×980 area. Clicks were pointer/mouse event sequences dispatched at rendered canvas coordinates; Figma handled native navigation. No application state, URL or Figma reactions were altered to make the recorded transitions pass.

The initial player failed WebGL initialization with GPU disabled. Restarting this task's browser with `GSTACK_DISABLE_GPU=off` rendered the prototype. This is a test-environment correction, not a fix to the user's Figma Desktop installation.

[Machine log](browser-playback-log.json): **75 sequential transitions, 75 expected destination URLs, zero mismatches**. [Read-only controls](browser-control-graph.json) supply labels, centers and targets. The initial hub→F1 click and the two archived Source/Back clicks were checked manually before structured logging; these three are [additional observations](browser-manual-observations.json), not included in the 75 count. Thus **78 observed transitions** in total, not all 563 native connections.

The logged sequence runs continuously from F1 entry through the other journeys and back to the hub. Browser reloads/URL visits used to load a start or recheck rendering are not counted as interactions. Screenshots were visually inspected at selected milestones; destination URL agreement does not mean every intermediate screen received a full visual audit.

## Observed paths

| Journey | Tested path and result | Visual evidence |
|---|---|---|
| F1 — edit | Add → text → content → Desktop style → inherited Tablet 24px → override → remove → Undo → Redo → Preview → exact editor return; selected text and Tablet context retained. | [Inherited scope](browser-f1-inherited.png), [return capture](browser-f1-return.png) |
| F2 — CMS | Bind Blog.title → exact record → excerpt draft → leave guard → Save and leave → simulated rejection → draft retained → Retry → simulated acknowledgement → same binding → refreshed Content. | [Draft](browser-f2-draft.png), [rejected save](browser-f2-failed.png), [returned binding](browser-f2-return.png) |
| F3 — asset | Selected Work image → picker → Concrete forms → Replace → Undo → original selected-image specimen. | [Replacement](browser-f3-replaced.png) |
| F4 — publish | Blocking collection Fix → exact Latest posts list → Blog source → Issues has no blockers → review changes/back → confirmation → tips acknowledgement → Admin override acknowledgement → Publish → simulated v13 acknowledgement → close → reopen retained v13. | [Repair](browser-f4-fixed.png), [v13](browser-f4-published.png), [retained status](browser-f4-retained.png) |
| F5 — review | Send Round 3 → simulated preview/invite acknowledgements → client role → comment → acknowledgement → designer role → Locate Logo → 24→28px → exact comment return → Resolve/acknowledge → client role → approval code fixture → receipt → return → stale-snapshot designer state → fresh Round 4/acknowledge. | [Comment](browser-f5-comment.png), [resolved](browser-f5-resolved.png), [receipt](browser-f5-receipt.png), [fresh round](browser-f5-fresh-round.png) |
| Archived Inspector | Committed 40px → Source details → Back to font size → same 40px Mobile override. | [Source](browser-source-open.png), [return](browser-source-return.png) |

Each main journey returns to the native hub; [last hub screenshot](browser-hub-return.png). The F4 reopened state shows no unpublished changes and disabled “Up to date.” F5 distinguishes comment resolution from round approval, and Round 3 approval from pending Round 4.

F4 uses the top Publish control in the acknowledged confirmation. F2 follows Save-and-leave and its rejection/retry branch; ordinary Save remains outside this sample. F5 code entry advances a prepared fixture, not real text entry or email authentication.

## Remaining limits and findings

- The prior **C01** (F1 child-selection instructions versus connected Add path) and **C02** (unwired alt-text Fix affordance) remain open. These successful guided paths do not close them. No new route mismatch was observed in this sample.
- The F1 return screenshot initially showed text-rendering artifacts in the Inspector. A [settled direct-load recheck](browser-f1-return-settled.png) rendered the Inspector text cleanly and preserved Tablet/24px selection. The original capture is retained; this does not certify rendering across all frames.
- No exhaustive 563-edge traversal. F3 locked/deleted target branches, F4 failure/unknown/queued cancellation branches, F5 alternate approval origins and code failures were not played in this pass.
- No Figma Desktop playback, OS link-routing repair, keyboard/focus, screen-reader, alternate viewport or real-participant acceptance validation.
- No real typing, saving, server failure, publishing, email, permissions, snapshot persistence or service execution. Outcomes and role changes use the prototype's explicitly named fixture controls.
- User explicitly confirmed that participants are unavailable. R1/B9 remains pending; competitor reviews and analyst walkthroughs do not substitute for interviews.
- No whole-editor completion or production-readiness claim. Earlier graph audit and this browser sample answer different questions.

## Reproduction

Open the hub, choose a journey, then follow the ordered `from/to/control` entries in `browser-playback-log.json`. In a 1600×1100 player, recorded x/y coordinates target visible controls. Keep the player zoom/fit setting unchanged. The grey bar supplies only declared role and server-outcome fixtures. Screenshot filenames identify the verified milestones.

