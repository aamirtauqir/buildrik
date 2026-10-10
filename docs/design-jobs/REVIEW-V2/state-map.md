# Review v2: board state → app state map

Owner decision 2026-10-10 (FG-001 / FG-002 / FG-004): **Review v2 is the single current Review design.** Build the redesign and its states as one piece of work, from this map.

- **Source of truth.** Figma `g4GzQFqzNYz5sosz1QtZXC`, page `4418:45431`, section `8165:219385`, renamed "Manage feedback and approval · Review v2 · 03 Oct 2026 — the CURRENT Review design". Its rules board is START HERE `8167:227951`, and the shared parts are on LIBRARY `8165:219386`.
- **Old family.** The 29 boards in section `4418:115731` are prefixed `ARCHIVE ·` with "— superseded 10 Oct 2026 by Review v2 (8165:219385) · FG-002". Six boards there keep their names: 3 were already archived, the two publish-gate boards (`4418:120066`, `5931:44782`) belong to the Publish flow, and one is a preview board (`4418:120075`).
- **Shell doors.** Every topbar `chip/review` (778 instances) now opens v2. The conditional's two targets changed from `4418:116906` → `8165:223201` (detached) and from `4418:115784` → `8165:220437` (changes requested). One stray target, `6879:66771`, now points at `8165:219395` (not sent). The edits were read back by an in-call histogram and a separate read call.
- **Precedence (packages/editor/CLAUDE.md).** Visuals and copy come from the board. Behaviour comes from the code contract: `REVIEW_PILL_STATES` in `packages/shared/schemas/reviews.ts`, `NextMove.gate` in `editor/shell/lifecycle.ts`, and the `reviews.*` tRPC returns. Board sample data ("Sara Ahmed", "Round 3") is shape only.

## The app-state vocabulary this map uses

- **pill**: `ReviewPillState`, one of `none | pending | opened-not-acted | changes-requested | approved | approved-edited-since`.
- **round**: `CurrentRound` from `reviews.currentRound`. Fields used here: `status` (PENDING / APPROVED / CHANGES_REQUESTED), `revoked`, `invitedEmail` (null = internal / workspace round, so no client link), `roundNumber`, `reviewerName`.
- **load**: ReviewTab `LoadState`, one of `loading | error | ready`.
- **role**: `useEditorRole()`, which is `VIEWER` or an editor role.
- **gate**: `NextMove.gate`, one of `waiting | changes-requested | open-errors | stale-approval | confirm | unchecked | none`.
- **comments**: open, resolved, and detached (an anchor whose element is gone) counts. `located` is the ReviewTab local state after Locate.

## Panel states

| # | Board | v2 state | App state that renders it | Status card (title · meta · CTA) | Today in code (`ReviewTab.tsx`) |
|---|---|---|---|---|---|
| 1 | `8165:219395` | not-sent | pill `none`, no round (or the latest round revoked, with the user starting fresh) | Not sent to a client · Client review · No active link · **Invite a client** | Empty state "No review yet" + Send for review at the foot (`:621`). Rebuild. |
| 2 | `8167:225632` | invite | not-sent + the invite form open (same data as 1) | same as 1, with the invite step open | `ReviewSentModal` / send flow. Re-home in the panel per board. |
| 3 | `8165:219754` | workspace-pending | round PENDING, `invitedEmail === null` (workspace approver, no client link) | Awaiting workspace approval · Workspace review · Round N · Invite a client · "Withdraw workspace request" | Status-line tail "Internal round" only. Partial. |
| 4 | `8167:226508` | revoke (workspace) | 3 + the ⋯ → withdraw confirm | as 3 | Revoke confirm exists (`:328`), with "Review request withdrawn." |
| 5 | `8165:220096` | awaiting-client | pill `pending` or `opened-not-acted`, round PENDING with a client link, 0 comments | Awaiting client approval · Round N · {reviewer} · Sent {when} · **Copy review link** | Status line "Awaiting {who}". Partial. |
| 6 | `8165:220823` | resolved-awaiting | 5 with open = 0 and resolved > 0 | Awaiting client approval · "No open comments does not mean the site is approved." | Status-line counts only. |
| 7 | `8165:221164` | resolved-comments | 6 with the Resolved segment selected | Resolved list, rows with Reopen | Resolved band (`:811`). Restyle. |
| 8 | `8170:223872` | comment-reopened | 5 or 6 after a Reopen (open ≥ 1, round still PENDING) | "Reopening a comment does not change approval." | Reopen toggles silently. **Missing feedback.** |
| 9 | `8167:227374` | comment-sent | any live round + a team comment just posted | "Comment sent" confirmation row | Draft just clears. **Missing.** |
| 10 | `8165:220437` | changes-requested | pill `changes-requested`, open ≥ 2 | Changes requested · **Send new review** · Open N / Resolved N · "N open comments · Next →" · cards with Locate / Resolve | Pre-v2 list. Rebuild (chip target). |
| 11 | `8167:224924` | one-open | 10 with open = 1 (comment on another page) | as 10, singular copy | Pre-v2. |
| 12 | `8170:224163` | one-open-home | 10 with open = 1 on the current page | as 11 | Pre-v2. |
| 13 | `8165:223201` | detached-comment | 10 + detached ≥ 1 | "One comment refers to an element that was removed." · card with Reattach / Resolve | Detached band + ReattachModal (`:746`). Restyle (chip target). |
| 14 | `8167:227067` | located | `located` set after Locate | Located block · Back to comments · "Close Review to edit…" | `review-located` (`:1014`). Restyle; the board's copy wins. |
| 15 | `8167:225291` | feedback-addressed | pill `changes-requested`, open = 0, resolved > 0 | Changes requested · feedback addressed · Send new review · "Ready for another review" | Banner line only. Partial. |
| 16 | `8167:225924` | resend | 15 + the Send new review confirm | as 15 | Resend confirm (`onResend`). |
| 17 | `8170:223589` | awaiting-new-round | after resend: new PENDING round N+1, previous link dead | Awaiting client approval · Round N+1 · Just sent · "The previous link no longer works." | Banner line only. Partial. |
| 18 | `8165:221512` | approved | pill `approved` | Client approved · Compare with approved | Status-line tail "Approved" only. Partial. |
| 19 | `8165:221853` | stale-approval | pill `approved-edited-since` (gate `stale-approval`) | Changes since client approval · Send new review · Compare with approved → | Only the topbar chip and the publish modal. **Missing in panel.** |
| 20 | `8167:226212` | publish-gate | 19 reached from the Publish door (gate `stale-approval` → "permitted publish override") | as 19; the override keeps every publish check | Publish modal only. **Missing in panel.** |
| 21 | `8165:222195` | revoked-link | `round.revoked === true` with a client link | Review link revoked · "All comments are kept." · Send new review | `revokedBody` (`:915`). Restyle. |
| 22 | `8165:222536` | send-failed | send/resend: snapshot + link created, email failed | Awaiting client approval + inline "Could not send." · Copy review link | `ReviewSentModal.tsx:61-100` (modal). Move inline per board. |
| 23 | `8165:222873` | viewer | role `VIEWER`, any round | "You have view-only access…" · composer replaced by "View-only access" | Per-control disabled + tooltips. Restyle to the board. |
| 24 | `8165:223557` | load-error | load `error` | Review could not load · Connection problem · Retry · "Comments unavailable" | Load error (`:596`). Restyle. |
| 25 | `8167:226797` | closed | the panel's ⋯ / × closed state (status card hidden) | header-less list with the composer | Close restores the canvas. Confirm the board intent while building. |
| 26 | `8167:227647` | menu | ⋯ open on any live round | Menu rows | ⋯ menu (`:383-463`). Restyle. |

Loading (load `loading`) has no v2 board. Keep the current skeleton (archived `4418:120964`) until one is drawn.

## Code states with no v2 board (draw before or during the build)

These are the FG-004 "code-only" rows. Each needs a v2 board, or a recorded decision to drop it.

- The per-row **Copy link** on comment cards.
- The **`unchecked`** gate (`lifecycle.ts:308-317`). `reviews.status` failed, so the panel shows "Couldn't check this site's review settings" + Retry.
- **Withdraw request** as the wording for an internal round. Board 3 says "Withdraw workspace request". Pick one.
- The **approval-optional** workspace policy (FG-003). v2 not-sent dims Publish, but the code keeps Publish enabled when approval is optional. Draw a variant.

## Rules carried from START HERE `8167:227951` (acceptance for the build)

- Workspace approval ≠ client approval. Comments resolved ≠ approved. Link created ≠ email delivered. No active client link must never say "waiting on your client".
- Publish stays in the top bar. Opening Review never changes permissions or workspace policy. The override confirmation must keep every existing publish check.
- An empty composer disables Send. No open comments hides Next. Resolve and reopen update the counts. A failure keeps the draft. Revoke keeps the comments. Close restores the canvas. Copy link confirms with a toast.
- Delivery fallback: if the email failed, keep the round and offer Copy review link. If the submission failed, keep the invite form and allow Retry. Never start a duplicate round just to retry the email.

## Not verified here

- I did not take a v2 board screenshot against live in this pass. The code rebuild is FG-001, and this map is its input.
- The reaction scan covered topbar `chip/review` only. A page-wide inbound scan to the archived boards timed out server-side. Other doors into the old family (hotspots inside other boards) may still exist. Re-scan section by section when the build starts.
- The three top-level "CURRENT DESIGN · Review anchored · Home / Contact / Menu" boards (`4418:172804`, `4418:173065`, `4418:173326`) sit outside both sections. I did not classify them and left them untouched.
