# Independent recovery design review — 21 October 2026

Read-only review by `design_guard_reviewer`; no mutations. Reviewed canonical Assets §4.3, Publish §5.3–5.4 and Client Review §5.3–5.5, the recovery control graph, fresh live F3/F4/F5 nodes, and native renders of `376:25146` and `377:25918`.

## Findings and corrections

- F3 Cancel had restored an unlocked image despite a captured-target lock. Both Cancel routes now reach `376:25146`; unlock goes to `376:25424`, with Undo returning to the locked state. Replacement and Alt text are disabled while locked.
- F4 heading `303:36339` was interactive; actual Publish `303:36421` entered a resumed-job state. Heading is now inert and actual submission enters `303:36642`, including the queued-cancel branch.
- F5 Add comment from the existing open/resolved thread had entered the zero-comment draft. Two new origin-specific branches preserve the original thread/status and reply. Cancel returns exactly; failed send retains draft; acknowledged second note produces Comments (2).
- Twelve Add-comment reactions behind approval modal/status surfaces were removed. Original approval entries remain `307:17619 → 312:23762` and `307:21238 → 307:21249`.
- Second-comment acknowledgment explicitly ends its bounded fixture. Further comments, role switching and approval on those endpoint specimens are unsimulated; original approval flows remain reachable.

## Separate quality dimensions

| Dimension | Reviewer assessment |
|---|---|
| Geometry | Two native 1440×996 samples fit. Cancellation status does not overlap Details; comment pins render. Narrow/short and text enlargement NOT RUN. |
| Grouping and hierarchy | Lock action stays on selected Layers row; read-only explanation stays with image properties. Prior thread resolution/reply and second thread have distinct grouping. |
| Labels and status | Locked selection and Inspector agree. Counts, prior resolution and frozen-snapshot description agree. Prototype endpoint limit is visible. |
| Interaction/accessibility | Exact destinations pass live structural read. Keyboard/focus, assistive technology and semantic disabled controls NOT RUN. Parent browser playback was still ongoing at review time. |

G1/G2/G3/G5/G7 pass within the reviewed scope. G4 is sampled; G6 is structural only. G8 application implementation NOT RUN. G9 was partial at review time because parent handoff/playback was incomplete.

**PARTIALLY VERIFIED.** No unresolved semantic/route or sampled visual blocker found in the repaired scope. This reviewer did not perform a second browser execution or inspect final playback documentation. Parent completion evidence is recorded separately in [RECOVERY-CONTINUATION.md](RECOVERY-CONTINUATION.md).

