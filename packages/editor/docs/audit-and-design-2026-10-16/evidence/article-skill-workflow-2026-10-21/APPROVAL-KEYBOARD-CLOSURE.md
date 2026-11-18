# Approval and keyboard continuation — 21 October 2026

User instruction: “vo bhee kar do ap final”, continuing the remaining approval branches and keyboard/accessibility work. Existing Figma authorization remains in force. This is design-only work; no application source, production data, email, publish or deployment changed.

**Status: design continuation delivered; PARTIALLY VERIFIED overall.** Independent review found no remaining blocker in the inspected design/specimen scope. Native exhaustive playback and application/assistive-technology acceptance remain open.

**Scope:** complete the existing F5 approval recovery paths and the two new second-comment origins; make the approval keyboard contract concrete and testable. The Figma prototype remains the visual source. The local keyboard specimen is a bounded interaction study, not a second product implementation or replacement design.

[Canonical journeys](https://www.figma.com/proto/2L9OTGzBrL6kYmU18yA1c7/Buildrick?node-id=302-3370&starting-point-node-id=302%3A3370&scaling=scale-down).

## Delivered design

- Added **28 editable native frames**, fourteen each for second-comment OPEN and RESOLVED origins. Code entry, ready, pending, receipt, approved, incorrect, expired, resend pending/success/failure, rate limit, already answered, failed approval and offline states preserve both comments. OPEN retains open/open; RESOLVED retains resolved/open and the Studio reply. Approval covers the sent snapshot; it does not resolve notes or approve later edits.
- Connected **Approve Round 3** at `377:25669` → `397:25684`, and `377:25918` → `397:26881`. Cancel returns to the exact two-comment origin. Client completion frames are `397:25862` and `397:27067`. Wrong-context designer-role shortcuts are absent at those endpoints. Further arbitrary comments and subsequent designer editing are outside these focused examples.
- Added **ten explicit outcome fixtures** to the five existing approval families: retry eligibility restored and connection restored. Their clones also work in the new families. These are labelled prototype controls, not real timers or service responses. Rate-limited requests do not auto-submit when eligibility returns. Offline-before-entry copy no longer claims an entered code was retained when none existed.
- Reused existing screens, component instances, token bindings, typography, modal grouping and 1440×996 authored size. No new application panel or navigation owner.

[Authoring ledger](approval-authoring-ledger.json), [current controls](approval-controls-final.json), [resolved two-comment entry](approval-two-resolved-entry-native.png), [open two-comment approval](approval-two-open-approved-native.png).

## Keyboard contract and specimen

[Open the local keyboard specimen](approval-keyboard-specimen.html). It implements the bounded approval interaction from canonical [Panel 17](../../panels/17-CLIENT-REVIEW.md) §§4–8 and [shared contracts](../../panels/00-SHARED-CONTRACTS.md), especially SC-2/SC-15. This continuation uses the frontend-ui-engineering guidance for the supplemental HTML artifact.

| Moment | Required behavior represented in the specimen |
|---|---|
| Open confirmation | Native modal dialog with a named title, sent-version description and labelled six-digit field. Initial focus is Cancel; background cannot receive user focus. |
| Navigate | Tab and Shift+Tab stay within visible enabled controls. Code entry alone, including Enter in the field, never approves. Approval requires its explicit button. |
| Cancel / Escape before submit | Return to the invoking Approve control. Retain the draft code and any expired/offline/rate restriction within this specimen session. Reset explicitly clears fixture state. |
| Submit / pending | Announce checking; disable repeated submission. Escape does not claim to cancel an in-flight approval. This study uses a short simulated response; real service tracking remains an implementation requirement. |
| Incorrect / expired | Name the error and keep the code; incorrect input is marked invalid and focused. Expired code cannot approve, but Send a new code stays available across editing and close/reopen. Resend clears obsolete code and returns focus to entry. |
| Failure / offline / rate limit | Failure retains code and focuses Retry. Offline/rate recovery requires an explicit fixture outcome, preserves code, and never submits automatically. Closing/reopening cannot bypass restrictions. |
| Acknowledgment | Only acknowledgment shows approved. Return and Escape from the receipt both preserve approved state and focus the approval heading. Comments remain unchanged. |
| Announcements | Polite status and assertive error regions are inside the active modal. A new announcement/reset clears stale messages. The final approved heading is outside the dismissed dialog. |

The local fixture has no network calls, storage, email or real approval. It uses the existing design's hierarchy and semantic colors with system font fallback; it is not a pixel-conformance claim. Screen-reader speech output has not been tested.

## Actual verification

**Figma graph:** [final audit](approval-final-audit.json) records **223 roots / 714 connections**, all 223 reachable from the hub and zero invalid destinations. All 28 new frames retain both note texts, Comments(2), expected statuses and no active background Header/Main/Footer reactions. These are structural checks, not 714 browser-played edges.

**Native pointer playback:** [log](approval-playback-log.json) contains **16 successful transitions** this pass, covering entry/Cancel, code entry, resend acknowledgment, offline Cancel and approval receipt/return in the resolved-origin family. The browser daemon subsequently stopped responding. Earlier load/async-batch attempts also timed out and produced no verified transition log; they are not counted as passes. The saved seven-family plans are executable coverage targets, not completed results. Exhaustive playback of the newly added families is **not complete**.

**Native keyboard:** [actual key probe](approval-native-keyboard.json) tried Tab, Shift+Tab, Enter and Escape. Focus moved among Figma's player chrome, not product code/Cancel/Approve controls. The accessibility tree exposed player navigation; Enter on the host's Comment control opened Figma's login prompt, which Escape dismissed. No comment was sent. This is a limitation of the tested native player, not an application accessibility finding or pass.

**Local keyboard specimen:** final results are recorded in [keyboard checks](approval-keyboard-checks.json), with [test script](approval-keyboard-test.py), [accessibility-tree capture](approval-keyboard-accessibility-tree.txt) and desktop/320×640/768×640/1440×640 screenshots. Earlier failures remain archived in `approval-keyboard-checks-before-focus-fix.json` and `approval-keyboard-checks-before-expiry-fix.json`. **Final run: 43/43 checks passed.** This includes initial Cancel focus, bidirectional Tab containment, explicit confirmation, error focus, receipt Escape, expired-code reopen/edit, retained offline/rate restrictions, reset announcements and dialog fit at 320×640, 768×640 and 1440×640. This is local specimen evidence only.

## Separate quality assessment

- **Geometry:** native added entry/entered/approved samples reviewed at authored desktop size. Local dialog bounds checked at desktop, narrow and short viewports. This does not establish responsive reflow of the entire native Figma journey.
- **Grouping and hierarchy:** sent-version approval stays in one confirmation; comments retain their separate ownership/status. Simulator controls are labelled and separated from product actions.
- **Labels and status:** no premature approval, no implied fresh approval of later edits, no code-retention claim before entry, no restriction bypass on reopen. Stale announcements are cleared.
- **Interaction/accessibility:** native paths have the bounded evidence above; the semantic HTML study exercises keyboard focus and recovery. Neither establishes application keyboard support, screen-reader conformance, actual permissions or server persistence.

Independent read-only review checked all 75 original approval states and all 28 additions, plus sampled native screenshots and the keyboard specimen source. It found and drove corrections to pending-close behavior, receipt dismissal, live-region location, focus ordering and expired/reopen eligibility. Parent browser verification remains separate from that review.

Remaining external acceptance: complete native playback after the browser becomes stable; production implementation and service/permission tests; assistive-technology evaluation; full responsive review; participant work R1/B9. Participants remain unavailable. No waiver or whole-editor completion is claimed.
