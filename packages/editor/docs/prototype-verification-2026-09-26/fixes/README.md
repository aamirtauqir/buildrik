# Editor v3 · IA — applied prototype fixes

Date: 2026-09-26. The four findings from the [initial audit](../README.md) have been addressed in the existing Figma file.

[Open the updated prototype](https://www.figma.com/proto/g4GzQFqzNYz5sosz1QtZXC/Buildrick?page-id=4418%3A45431&node-id=7901-196729&starting-point-node-id=7901%3A196729&scaling=contain&content-scaling=fixed&hide-ui=1).

## Changes and verification

| Finding | Applied change | Playback evidence |
|---|---|---|
| F-01: wrong submission identity | Each Delete action sets the selected record, confirmation, error details and success receipt. Visibility variables remove only that record from both the outcome and inbox. Failure keeps the row; retry preserves identity. | All three confirmations and deletion outcomes checked: [Reservation](11-reservation-deleted.png), [Contact](06-contact-deleted.png), [Catering](09-catering-deleted.png). Contact [failure](22-contact-delete-error.png), [retry confirmation](23-contact-retry-confirm.png), [correct receipt](24-contact-retry-deleted.png) and [persistent inbox result](25-contact-return-inbox.png) passed. |
| F-02: inconsistent Escape | The shared confirmation frame's Escape returns to the same Forms inbox as Cancel. | Contact [Escape](04-contact-escape.png) and [Cancel](05-contact-cancel.png) returned to the inbox. |
| F-03: edited heading resets on selection | A shared draft-heading variable connects nine relevant Home editor, selection and AI boards. Page/site Apply sets the edited value; Undo restores the original. | Page [selection](14-ai-page-selected.png) and [Undo](16-ai-page-undo.png); site [Apply](18-ai-site-applied.png), [selection](20-ai-site-selected.png) and [Undo](19-ai-site-undo.png) passed. |
| F-04: nine unreachable states | Added nine named entries to the existing recovery launcher and a link from the current task launcher. Recovery now uses a readable 1440×900 scrolling viewport. | [Launcher](21-recovery-readable.png); all nine entries reached their intended states in browser playback. [Entry and return results](recovery-results.json). |

The existing submission-failure scenario now sets the failure gate and opens the inbox, allowing a reviewer to choose a record and exercise the real confirmation → failure → retry path. The success toast's “Return to inbox” link returns to the current Forms workspace. The final copy cleanup removed the hardcoded “Status: New” from the shared error receipt; the failure screenshot predates only that copy cleanup.

## Evidence and limits

- [Browser log](playback.jsonl) records clicks, navigation assertions and screenshots. Early assertions made after only 250ms were premature; settled checks verified the entries. Activity Loading was reached in the first run, then automatically resolved to the feed before the later assertion. Escape from the resolved feed returns to the canvas.
- Saved-state checks: [defaults and deletion conditions](validated-defaults-and-actions.json), [final receipt bindings and entry actions](final-receipts-and-entries.json). The preliminary `readback.json` is truncated and predates the corrected defaults and conditional actions; use the later compact evidence.
- Mutation records: [core](core-mutations.json), [corrected defaults and branches](defaults-and-branches.json), [recovery entries](recovery-mutations.json), [receipts and failure scenario](receipt-mutations.json).
- Scope: focused fixes to these four findings. This does not certify every one of the initial audit's 1,195 frame roots or every conditional branch. Failure/retry was played through with Contact; the three records share the checked gate and retry behavior. AI persistence was checked on the repaired Home page/site paths, not every other editor state.
- No application code, deployment, commit or backend data was changed by this task. Existing staged work was preserved.
