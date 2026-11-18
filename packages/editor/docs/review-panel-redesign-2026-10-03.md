# Review panel redesign — 3 October 2026

Figma page: Editor v3 · IA, node 4418:45431.
Section: [Review · Panel redesign & flow · 03 Oct 2026](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-219385).
Start: [Flow & state rules](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-227951).

## Scope and findings

Redesigned the right-hand Review panel using the existing editor shell, Inter styles, semantic tokens and shared button components. Added reusable Approval summary (8165:219387) and Comment (8165:219391) components. The panel is 360×812 inside a 1440×900 editor.

The supplied screenshot showed incompatible “Sent — waiting on your client” and “Not sent yet” messages, an ambiguous resolved success message, a disabled Next action without open comments, and competing composer/invite actions. Source inspection confirmed that ReviewTab.tsx derives its banner from pending status while its status line also checks invitedEmail. An internal workspace request can therefore look like a client invitation.

The redesign makes the approval summary authoritative, distinguishes workspace and client approval, places invite/re-send next to the review status, separates Open/Resolved filters, and keeps the private team composer compact at the bottom.

## Behavior contract

- No active client link: never claim a client is waiting. An internal pending request says “Awaiting workspace approval”.
- Comment resolution and approval are independent. Resolving the last requested change retains “Changes requested · feedback addressed”.
- Client approval applies to the submitted snapshot. Editing the draft can make that approval stale; workspace publish requirements remain independent.
- Re-send confirms replacement of the previous link. Its success example advances Round 3 to Round 4 and retains three resolved comments.
- Resolving either of two comments leaves the other visible; the final resolution leaves three resolved comments. Reopening one resolved comment retains pending client approval and changes counts to one open / zero resolved.
- Sending a team comment is private. Failure retains the draft; success clears it and adds one open comment. Empty input disables Send.
- Viewer state omits mutation controls and disables Publish.
- No open comments: omit Next. Detached comments provide Reattach and Resolve.
- Review link creation and email delivery are separate outcomes. Email failure after successful submission should retain the round and offer Copy link; submission failure should preserve the invite form.
- The stale-approval publish confirmation does not bypass workspace approval, role permissions or blocking validation.

## Validation

27 frames: 26 screen/state boards and one flow guide. All are 1440×900.
Read-back: 1,996 instances, 1,461 text nodes, 1,581 frames, 936 vectors, 78 ellipses and 56 rectangles across the frames; no image-filled nodes.
Font audit found no non-Inter text. All prototype node destinations read back as existing nodes.
Corrected clipped second-comment actions, off-canvas modal placement and selected-tab color fallback rendering; final affected screenshots passed. Review scroll regions had no overflowing children after the spacing fix.

## Prototype coverage and limits

Representative prototype paths cover invitation, comment resolution, re-opening, re-send confirmation, new-round pending state, resolved comments, close, retry, sample menu and stale-approval confirmation. Client approval/change-request outcomes are selectable in the flow guide; they are not simulated as editor-owned decisions.

This is a Figma design/specification, not a runtime implementation or end-to-end test. Context-sensitive actions without a faithful sample state are annotated rather than wired to a contradictory state. In particular, not every round/role has its own interactive resolved tab or menu; clipboard, network delivery, canvas reattachment and publishing are behavior specifications. The existing Compare board is reused as a destination and retains its earlier implementation.

## Board index

| State | Exact layer / board name |
|---|---|
| not-sent | [CURRENT DESIGN · Review v2 · not-sent](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-219395) |
| workspace-pending | [CURRENT DESIGN · Review v2 · workspace-pending](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-219754) |
| awaiting-client | [CURRENT DESIGN · Review v2 · awaiting-client](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-220096) |
| changes-requested | [CURRENT DESIGN · Review v2 · changes-requested](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-220437) |
| resolved-awaiting | [CURRENT DESIGN · Review v2 · resolved-awaiting](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-220823) |
| resolved-comments | [CURRENT DESIGN · Review v2 · resolved-comments](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-221164) |
| approved | [CURRENT DESIGN · Review v2 · approved](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-221512) |
| stale-approval | [CURRENT DESIGN · Review v2 · stale-approval](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-221853) |
| revoked-link | [CURRENT DESIGN · Review v2 · revoked-link](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-222195) |
| send-failed | [CURRENT DESIGN · Review v2 · send-failed](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-222536) |
| viewer | [CURRENT DESIGN · Review v2 · viewer](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-222873) |
| detached-comment | [CURRENT DESIGN · Review v2 · detached-comment](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-223201) |
| load-error | [CURRENT DESIGN · Review v2 · load-error](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8165-223557) |
| one-open | [CURRENT DESIGN · Review v2 · one-open](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-224924) |
| feedback-addressed | [CURRENT DESIGN · Review v2 · feedback-addressed](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-225291) |
| invite | [CURRENT DESIGN · Review v2 · invite](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-225632) |
| resend | [CURRENT DESIGN · Review v2 · resend](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-225924) |
| publish-gate | [CURRENT DESIGN · Review v2 · publish-gate](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-226212) |
| revoke | [CURRENT DESIGN · Review v2 · revoke](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-226508) |
| closed | [CURRENT DESIGN · Review v2 · closed](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-226797) |
| located | [CURRENT DESIGN · Review v2 · located](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-227067) |
| comment-sent | [CURRENT DESIGN · Review v2 · comment-sent](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-227374) |
| menu | [CURRENT DESIGN · Review v2 · menu](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-227647) |
| flow | [START HERE · Review v2 · Flow & state rules](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8167-227951) |
| awaiting-new-round | [CURRENT DESIGN · Review v2 · awaiting-new-round](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8170-223589) |
| comment-reopened | [CURRENT DESIGN · Review v2 · comment-reopened](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8170-223872) |
| one-open-home | [CURRENT DESIGN · Review v2 · one-open-home](https://www.figma.com/design/g4GzQFqzNYz5sosz1QtZXC?node-id=8170-224163) |

