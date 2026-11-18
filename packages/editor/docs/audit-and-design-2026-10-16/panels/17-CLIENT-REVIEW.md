# Panel 17 — Client review and comments, end to end: functionality specification (FD-PNL-17)

Date 2026-10-17 · Branch main @ `19f964d5e` · Mode: DESIGN ONLY
Status: **SPEC COMPLETE (written scope) · blocked by R-4, R-11, R-15, R-16 · not VERIFIED.** *(R-1018: + R-15/R-16 site-scope authorization, SC-9 ⛔)* Independent `design-qa-critic` review: pass 1 PROPOSAL (7 blocking) + 11 notes — fixed 2026-10-17; pass 2: 3 blocking fixed 2026-10-17. OD-R1…R7 decided (SC-22). Runtime NOT RUN; geometry NOT MEASURED. Written from a source read (file:line below) for the product-design review gap "client review `/review/<token>`" (`REVIEW-2026-10-17-pro-product-design.md` §B.2). *(DS)* = designer-selected; owner standing instruction 2026-10-17: designer recommendations are accepted — owner decisions are **OD-R…** (§10.1, decided as recommended, SC-22). Panel 00 (SC-1…SC-22) wins on conflicts; this panel adds no AI entry point (SC-21).
**2026-10-18 owner decisions applied** (design-audit-2026-10-18/OWNER-DECISIONS-2026-10-18.md): S2 (revoke stays an existing SC-15 item), S3 (reply guard); FINAL §4 items 2, 6 (CS-02, CS-10), 13; gap rows T5-02, D3-14 (owner, applied in Panel 25), D3-17, D3-27, T2-35, S16 (external footer).
Governing IA: **IAF-17** (`evidence/ia-final-2026-10-16/module-specifications.md:903-943`), **IAF-19** (`:1015`), Panel 12 **RT-11** (this panel replaces its "kept" with a full design) + NAV-02 guards, Panel 01 §5.4–5.5 (TB-05 chip, TB-06 Comments), Panel 05 CV-17, Panel 14 §4.3 section 4 + Approval row, SC-6, SC-12, SC-15, root `CLAUDE.md` (client sign-off = dashboard `/review/<token>`, outside the editor harness). 00-STRATEGY **job 2 "Get approval"**, core-loop step 3; events `review_link_sent` · `client_comment_created` · `client_approved`.

---

## 1. Purpose and boundary
Designer: **"What does my client think, and am I cleared to publish?"** Client: **"What am I looking at, how do I say what to change, and how do I say yes?"**

Job: J2 Get approval (00-STRATEGY §3) *(R-1018)*
- In: sending a round, the link's life (expiry, re-send, revoke, request-new-link), `/review/<token>` (identity, viewing, devices, pins, notes, request changes, approve, dead links) on desktop/tablet/phone, the editor Review task, client pins on the canvas, the topbar chip, notifications/emails, approval and staleness, `agency_layer`, link privacy.
- Out (linked): Publish dialog/gate (Panel 14), Compare (IAF-18), dashboard agency inbox, Site settings "Edits require approval" (Panel 10), share-preview `/share/<token>` (SC-8, view-only).
- Not in scope: multiple signers, client accounts, attachments, client content editing (D7) — §10.

## 2. Current implementation (source-read 2026-10-17; runtime NOT RUN)
`RC` = `packages/dashboard/app/review/[token]/review-client.tsx`; `CRS` = `server/services/client-review.service.ts`; `RS` = `server/services/review.service.ts`; `RT` = `packages/editor/src/editor/sidebar/tabs/review/ReviewTab.tsx`; editor paths under `packages/editor/src/`.

| ID | Area | Today |
|---|---|---|
| CR-01 | Flag | Rounds behind workspace flag `agency_layer`, **default off** (`server/services/feature-flag.service.ts:11-12,25`); `reviews.*` mutations hard-fail, reads collapse (`server/trpc/routers/reviews.ts:46-48,75,123,151-170,203,230,249,271`); public client router deliberately **not** gated so issued links keep working (`client-review.ts:36-38`); comments router not gated |
| CR-02 | Send | `SendForReview`: Client email ("Leave blank to keep this internal."), What changed?, Note (`editor/shell/SendForReview.tsx:212-234`); snapshot via `exportPublishPages`, **failure → console-only, sends without preview** (`:105-111`); outcome modal, email-failed, Copy link (`:119-131,269`). Limits note/summary 500, email 320 (`packages/shared/schemas/reviews.ts:49-63`) |
| CR-03 | Server send | refuses requester's and active members' addresses (normalised) (`RS:53-76`, `CRS:53-65`); one PENDING round, re-submit updates it and overwrites the snapshot (`RS:79-111`); token only with a client email (`RS:123-125`); a new round revokes earlier rows **that have a token** (`RS:134-139`); admins notified except requester — 0 on a one-seat workspace (`RS:141,615-655`); invite email (`RS:573-610`). 10/h per user per site (`reviews.ts:38-39,82-89`) |
| CR-04 | Link | 32 random bytes (`CRS:94-99`), 90 days (`CRS:35,101-103`); re-send rotates and kills the old token (`CRS:112-123`); dead: INVALID / EXPIRED / REVOKED (`CRS:132-178`). Token returned only to site ADMIN (`reviews.ts:103-114,210-217`); `currentRound.token` is null when revoked **or expired** (`RS` CurrentRound doc) |
| CR-05 | Revoke | ⋯ Revoke link / Withdraw request, EDITOR, race-safe (`reviews.ts:259-289`; `RT:452-462`); typed-free confirm "Revoke this review link?" (`RT:1043-1060`); revoked token never reissued (`prisma/schema.prisma:562`) |
| CR-06 | Client page | `force-dynamic`, meta robots noindex (`.../page.tsx:4,19-21`); "Checking your access…" (`RC:164-177`) |
| CR-07 | Identity | name + "The email this link was sent to" — no account (`RC:254-294`); must equal `invitedEmail` (`CRS:237-271`); `Reviewer` upserted per (site, email) (`schema.prisma:587-603`); identify/resolve 5 per 15 min per IP, comment 20 (`client-review.ts:84-85`). **No proof of mailbox ownership** — anyone holding the link who types the invited address signs |
| CR-08 | Viewing | agency-led header, page switcher, snapshot in `sandbox=""` iframe (`components/reviews/signoff-snapshot.tsx:95-130`) **fixed 680 wide**, fixed height with internal scroll (`:104,118-126`); sticky footer + Request changes + Approve Round N above the cookie inset (`RC:478-506,84-91`) |
| CR-09 | Client notes | "Your notes" 320×500, own notes, ≤2000, Add note (`RC:346-389`); **no page/position/element sent** (`RC:300-311,333-343`) though the schema accepts them (`reviews.ts:98-108`); server returns each note's **status** (`CRS:318`) but the page **does not render it**; team comments never returned (`CRS:313-320`); no replies |
| CR-10 | Request changes | unsent draft posted first, then round closes; failure keeps notes, Send again (`RC:318-344,380-387`) |
| CR-11 | Approve | confirm "You are approving the version you have been looking at." (`RC:515-550`); server: identified, PENDING only, no member/requester signer (`CRS:329-376`) |
| CR-12 | After answer | approved / changes cards; **state E** from `editedSinceApproval` (`CRS:221-225`); View what you approved; Add another note (`RC:437-473`) |
| CR-13 | Dead link | Expired, Revoked, Not found, CONFLICT copy (`RC:21-41`); Request a new link → owner-only `REVIEW_LINK_REQUESTED` (`RC:182-239`, `CRS:391-417`) |
| CR-14 | Review task body | ⋯ Compare rounds, Round history ›, Open current review link (ADMIN), Re-send / Send a new link, Revoke / Withdraw (`RT:384-466`); status line (`RT:141-157`); rows by page, Locate ›, Resolve, Copy link (editor deep link), Reattach (`RT:513-521,600-830`); "Earlier resolved"/"Resolved" collapsible section (`RT:820-830`); empty text "You will be notified." (`RT:1008`); Invite a client… (`RT:1201-1231`) |
| CR-15 | Review task RT-11 behaviour | **"{page} · Comment located"** band with the comment and **"Edit {element}"**, which closes the task (`RT:1014-1031`); states loading (`:527`), error "Couldn't load this review round." + Try again (`:598-616`), never-sent (`:862,874`), all-resolved (`:929`), open / revoked (`:1013`, `:918-922`); composer "· team only", Send / **Retry send**, "Comment not sent. Your draft is still here." (`:1095-1130`); viewer composer disabled (`:1107-1108`); composer page = **first comment's page, not the active page** (`:289`); unsent draft **not guarded** on task replacement (Panel 12 RT-06) |
| CR-16 | Canvas pins | comment mode (C / topbar); pins = OPEN comments on the active page whose position resolves, only in comment mode or reattach (`editor/canvas/comments/CommentLayer.tsx:451-457`); draft ≤2000, ⌘↵, "Visible to your team in the Review panel." (`:438,540-545`); anchors `[data-buildrick-id]` + x/y (`commentAnchors.ts`); export keeps `data-buildrick-id` (`engine/export/ExportEngine.ts:1150`) |
| CR-17 | Chip | Not sent / Review / Waiting · {name} / Changes requested · N / Approved / Approved · edited since (`editor/shell/StudioHeader.tsx:164-190`); refreshed **on focus only** (`editor/shell/hooks/useLifecycle.ts:141-149`); reads the latest **non-revoked** round (`RS:245-251`) |
| CR-18 | Staleness | approval stale when last edit > **approval time** (`server/services/publish-approval.ts:58-64`; `CRS:221-225`); chip uses `lastEditedAt` only (`RS:240,271`), gate and client page use page + CMS (`publish.service.ts:462`; `publish-approval.ts:124-131`). No snapshot-capture time is stored (`schema.prisma:536-585`) |
| CR-19 | Publish gate | only when `editsRequireApproval` and `agency_layer` (`publish.service.ts:419-430`); latest non-revoked round (`:447-451`); OWNER exempt (`publish-approval.ts:35`) |
| CR-20 | Rights | comments.create: any member incl. VIEWER, 30/min (`comments.ts:28-57`); resolve/reattach EDITOR (`:83-115`); comments **flat**, **not tied to a round** (`schema.prisma:498-524`); `reviews.status/currentRound/rounds/approvedSnapshot` need **EDITOR** (`reviews.ts:172,205,232,251`) |
| CR-21 | Notifications | no in-app type for client open/comment/approve/changes; only `REVIEW_LINK_REQUESTED` (`lib/constants/enums.ts:193`); emails: invite, review-requested, review-resolved (internal resolve only, `RS:660-692`); client actions notify nobody (`CRS:283-376`) |
| CR-22 | Invite email | "You can leave comments directly on the page — no account needed." … "works for 90 days." (`emails/review-invite.tsx:34-75`) |
| CR-23 | Headers | `/share/*` gets `no-referrer` + `X-Robots-Tag` (`next.config.mjs:122-132`); `/review/*` does not |
| CR-24 | Responsive | 0 `sm:/md:/lg:` classes in `RC` and `signoff-snapshot.tsx`; fixed 680 / 320 / 1050 |

## 3. Problems (job 2)
1. **Loop dark by default** (CR-01). 2. **Clients can't point** (CR-09, CR-22). 3. **Designer not told** (CR-17, CR-21, CR-14 false promise). 4. **One-way**: no replies, resolved state not shown (CR-09). 5. **Phones/tablets break**, desktops see Mobile CSS (CR-08, CR-24). 6. **Approval can cover content the client never saw** — edits between send and approval count as approved (CR-18). 7. **Three "stale" answers** (CR-18). 8. **Rights drift** for viewers (CR-15, CR-20). 9. **Silent degraded sends** (CR-02). 10. **Weak signature**: link + typed address (CR-07). 11. **Revoke falls back** to an older round (CR-03, CR-17, CR-19).

## 4. Target layout

### 4.1 Client page — Desktop ≥1024 *(DS; dashboard page)*
```
┌ Studio North · is asking for your feedback       Bella Cucina · Home ▾       Round 2 ┐ header 56
├──────────────────────────────────────────────────────────┬──────────────────────────┤
│ [Desktop] [Tablet] [Mobile]                ＋ Add comment │ COMMENTS (3)  This page ▾│ side 360
│ ┌──────────────────────────────────────────────────────┐ │ ① "Make the logo larger" │
│ │ snapshot at device width, scaled to the column,      │ │   Home · Logo · 2m       │
│ │ full content height (page scrolls, not the frame)    │ │   ✓ Resolved             │
│ │        ①                ②                            │ │   ↳ Studio North: Done   │
│ └──────────────────────────────────────────────────────┘ │ From Round 1 (2) ▸       │
│                                                          │ [Write a general note…]  │
├──────────────────────────────────────────────────────────┴──────────────────────────┤
│ Sara Khan · Approving Round 2: new menu page. Covers this sent version only.         │ footer 64
│                                           [ Request changes ]  [ Approve Round 2 ]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- **External page, own scale** *(R-1018, S16)*: `/review/<token>` is a dashboard page for clients, not editor chrome, so its header 56 / footer 64 (phone: two stacked 56 rows) and ≥44 touch targets follow this panel, not the editor ladder (task footer 48, DS §2.6). The DS accepts this as an intentional exception ("client review page scale", CROSS_SCREEN_CONSISTENCY_AUDIT §2).
- **Device switch** (NEW): frozen HTML at 1440 / 768 / 375 (SC-13), scaled to fit; default = the client's device class. Fix CR-08; no server change.
- **Full-height frame** (NEW, R-2 + OD-R4): the frame is sized to the page's content height so pins scroll with the page; until then the frame keeps internal scroll and only page-level notes exist.
- **Add comment** (NEW, R-2): crosshair over the frame → click → anchored composer (≤2000, Send / Cancel, ⌘↵). Stores page, element under the click (when OD-R4 allows reading the frame) and x/y fractions.
- **Keyboard crosshair** (NEW, B4): Add comment by keyboard places a crosshair at the visible centre; **arrows move 8px (⇧ 40px), Enter places, Esc cancels**; it stores **x/y only** (no element lookup), so it needs the full-height frame but not DOM reading.
- **Shortcut C** *(DS)*: works **only while the frame or the comments panel has focus** (never page-global); visible hint "C"; covered by the SC-12 single-key toggle — a "Keyboard shortcut C: On/Off" item in the page's help menu, remembered per browser (try/catch storage).
- **Pins**: numbered, OPEN filled / RESOLVED outline + ✓ (glyph, not colour). **Earlier-round comments are list-only** — no frame pin — labelled "From Round 1 · may have moved" *(DS, N5)*.
- **Comments panel** (Change): current page first, filter This page / All pages, page · element label · age, **status shown from today's data** (Fix CR-09), designer replies (R-3), general note box (today's Add note).

### 4.2 Tablet 768–1023 and phone <768 *(DS)*
```
Phone 320–767                               Tablet: as Desktop; comments become a right
┌ Studio North        Round 2 ┐ 48          sheet 360 toggled by "Comments (3)"; frame
│ Bella Cucina · Home ▾        │             full width.
│ [Desktop|Tablet|Mobile]      │             Phone: comments = full-height bottom sheet
│ ┌──────────────────────────┐ │             ("Done" closes); composer + Approve confirm
│ │ snapshot fit to width ①  │ │             are bottom sheets; targets ≥44×44.
│ └──────────────────────────┘ │             Placing a pin in Desktop/Tablet view on a phone
├──────────────────────────────┤             switches the frame to **1:1 pan mode** (drag to
│ 💬 Comments 3   ＋ Comment    │ 56          pan, pinch to zoom, "Tap to place · Cancel");
│ [Request changes] [Approve]  │ 56 sticky   placing or Cancel returns to fit (N6).
└──────────────────────────────┘
```

### 4.3 Editor — Review task (Panel 12 host, 360) — delta on RT-11
```
┌ Review ── Bella Cucina · Round 2      [‹ Back to Inspector] ⋯ ✕ ┐ header 48 (back only if the
│ ◐ Opened · Sara Khan (sara@cucina.com) · 2h ago                 │   Inspector was visible, SC-1)
│   Sent Oct 15 · link works until Jan 13 · ⧉ Copy link          │ ROUND card
│ 3 open · 1 resolved           [Client | Team | All]   Next ›   │
│ ── Home ──────────────────────────────────────────────────── │
│ ① Sara (client) · Logo "Make the logo larger"  2m  Locate › ✓ │
│ ── Menu ──────────────────────────────────────────────────── │
│ Ali (team) · Hero "Check contrast"              1d  Locate › ✓ │
├─────────────────────────────────────────────────────────────────┤
│ [ Team only | To Sara ]  Comment on Home…              Send    │ composer footer
│ [ Send Round 3 to Sara ]   4 of 5 comments resolved            │ (after changes requested)
└─────────────────────────────────────────────────────────────────┘
```
- **Round card** (Change): state glyph + text, invitee name **and** email, opened time (R-6), sent date, link end date, Copy link (ADMIN; others "Ask an admin for the link"), Open as client ↗ (ADMIN).
- **Expired link** (NEW, B3): card "◌ Link expired · Sara can no longer open it · Re-send"; chip "Link expired" (R-12); Publish gate banner (Panel 14) "Waiting on Sara — the review link expired · Re-send ›". Fallback until R-12: ADMIN only — `token` null on a non-revoked round with an invitee means expired (CR-04); EDITOR sees "Sent" with "Link works until ~{sent + 90 days}".
- **Filter** Client / Team / All (NEW, client-side). **Audience toggle** Team only / To {client} (NEW, R-3), default Team only; reply on a client row defaults to "To {client}" with "Sara will see this". Composer targets the **active editor page** (Fix CR-15 `:289`).
- **Footer primary** (Change to RT-11): "Send Round {n+1} to {client}" after Changes requested; open comments warn, never block. Re-send / revoke stay in ⋯.
- **Two-row footer height** *(R-1018, D3-27)*: each footer row is one task-footer row, 48 (DS §2.6) — composer row 48 + action row 48 = 96 while "Send Round n+1" shows; otherwise the composer row alone (48). The task body loses that height, the footer never scrolls.
- **Kept RT-11 behaviour** (B7): Comment located band → **Edit {element}** closes Review and the canvas shows the SC-7 return chip **"‹ Back to Review"** (SC-1 one-pattern; was "‹ Review"); resolved section; loading / error / never-sent / all-resolved / revoked states; Send / Retry send with draft kept.
- **Unsent-reply guard** (Fix RT-06, NAV-02): the draft is kept **per thread + round + audience** (IAF-17 G); replacing or closing the task with text asks the one unsaved-changes dialog (S3): "Leave without saving?" · **Keep editing** (default) · **Discard changes** — no Save and leave, because a reply has no Save (Send posts it) *(R-1018, CS-02; was "Discard your reply?" Keep / Discard)*; switching audience keeps the text and re-labels "Now visible to Sara"; a round change before Send asks to re-confirm the round.

### 4.4 Canvas, topbar, bell
- **Pins**: client pins show the client's initial + "Client" label; visible in comment mode **and while the Review task is open** (Change CV-17).
- **Chip — Change to Panel 01 TB-05** (B2): Not sent · **Review** (neutral, kept: reviews on, nothing required) · **Sent** · **Opened** (split of "Waiting", server already returns `pending` / `opened-not-acted`, `reviews.ts` schema `:19-26`) · Changes requested · N · Approved · Approved · edited since · **Link expired** (only with R-12). No "revoked" chip: after a revoke there is no current review (§5.2), so the chip shows Not sent / Review. Refresh: focus (existing) + every 60s while Sent/Opened *(DS)* + on a review notification (R-4).
- **Bell**: client events in Notifications › This site, "Feedback" category.

## 5. Flows

### 5.1 Send a round
CTA "Send for review" or "Invite a client…" → dialog. On Send: (1) render snapshot — **failure keeps the dialog open**: "We couldn't render a preview — your client would see no pages. Try again · Send without preview" (Fix CR-02); (2) submit; (3) outcome modal (existing). One-seat workspace with no client email: "Nobody else in this workspace will be notified" (`adminsNotified` = 0, `RS:141`).

### 5.2 Link life
- 90 days (kept); at 7 days left and unanswered: card line + notification "Link to Sara expires in 7 days · Re-send" (R-4).
- **Re-send** (open round): new link, old dies, same round (existing) — **resets the snapshot time** (R-11). **Send Round n+1**: new round; supersede revokes **every** earlier round, **including internal rounds** (Change, B5, R-14).
- **Rule (B5): revoking the latest round means "no current review".** Chip → Not sent / Review; Publish gate → "no review sent" when approval is required; it never falls back to an older round (R-14).
- **Revoke confirm stays** (declared SC-15 exception, §11 text; listed under S2 as an unchanged existing SC-15 item *(R-1018)*). The server must refuse a revoke for a review on another site (⛔ R-15). Client sees Revoked + Request a new link → owner **and sender** notified (R-4).
- Superseded link copy: "This link was replaced by a newer one — check your email for the latest link." (server message `CRS:172`).

### 5.3 Client: identify → look → comment → answer
1. Identity card (existing). 2. Look: devices, pages, comments. Esc: cancel crosshair → close popover/sheet/confirm (SC-2). 3. Comment by pointer, keyboard crosshair or general note. Failure keeps the draft: "Not sent — your comment is still here · Send again".
4. **Offline** (N7): drafts saved in `sessionStorage` per token (try/catch; page works without it); Approve and Request changes disabled with **"Needs a connection"** (the one offline reason, D3-17) *(R-1018; was "You're offline — reconnect to approve or send")*; banner "You're offline — your comment is kept" (the external page has no Panel 22, so it keeps its own offline banner).
5. Request changes (existing). Approve (existing confirm + round line "Round 2 · sent Oct 15"); with OD-R7, the confirm first sends a **6-digit code to the invited address**: "Enter the code we sent to s•••@cucina.com" (R-13).
6. **Receipt email** (R-8, N8): **token-free** — site, round, date/time, signer name and address, change summary, page list; plus "View it online until {link end date}".
7. Round 2 shows Round 1 comments under "From Round 1" (list-only, §4.1).

### 5.4 Designer: notice → locate → fix → resolve → next round
Bell/email "Sara asked for changes · 3 comments" → Review → Next › → Locate › (located / page-only / gone, IAF-17 G; SC-19) → Edit {element} (‹ Back to Review) → ✓ Resolve (pending until server ack; Undo toast, SC-22 OD-U7) → optional reply To Sara → Send Round 3. Resolving never changes approval.

### 5.5 Approval semantics (one definition)
- An approval covers **the snapshot sent (or last re-sent) in that round**, **signed by whoever holds the link and enters the invited address** (today; OD-R7 adds proof of the mailbox).
- **Stale = last edit (page or CMS) later than the round's snapshot time**, not the approval time (Change, B1, R-11). An edit between send and approve therefore shows "Approved · edited since" the moment Sara approves. Chip, Review card, client page E and Publish section 4 all use this one rule (R-7, R-11).
- Stale display: chip "Approved · edited since"; card "Sara approved Round 2 on Oct 15 · edited since the version she saw · Compare ›"; Panel 14 ADMIN override / Request fresh review (kept).
- "Edits require approval" off → approval informational: Publish Approval row "Approved by client · Oct 15 (not required)".
- A client cannot withdraw an approval (OD-R6): approved card offers "Need a change? Reply to {agency}" (posts a note, notifies).

### 5.6 Notifications and emails (R-4, R-8) *(DS)*
| Event | Sender + owner, in-app | Designer email | Client email |
|---|---|---|---|
| Client identifies | "Sara opened the review" | — | — |
| Client comments | batched 5 min "Sara left 3 comments" | daily digest if unread | — |
| Changes requested | high | immediate | receipt |
| Approved | high | immediate | receipt |
| Reply "To client" | — | — | batched 15 min "Studio North replied" |
| Link requested | owner + sender | immediate | — |
| Link 7 days from expiry, unanswered | "Expires in 7 days · Re-send" | — | — |
Interim guard (mandatory until R-4): "You will be notified." → "Check back here — the chip updates when Sara answers."; 60s chip refresh; task re-reads on open.

## 6. States and permissions
| Who | Can |
|---|---|
| Client (link + invited address) | frozen snapshot of this round, all pages and devices; own threads (add, reply), designer replies To client, resolved state; request changes; approve once per round; request a new link. Never: live draft, editor, team comments, other reviewers/sites (`CRS:28-32`) |
| Unidentified link holder | identity card only |
| VIEWER (SC-6) | Review read-only (card without link, rows, Locate); **Team comments allowed** (Fix CR-15); no resolve / reattach / send / revoke / reply-to-client *(DS)*; cannot sign. Needs R-1 |
| EDITOR | send, invite, re-send, revoke, resolve, reattach, reply to client; no link copy (existing S-7) |
| ADMIN / OWNER | all + link copy/open; Publish stale override |
| `agency_layer` off | no chip, Comments, Review task, R/C keys; live links keep working (existing); OD-R1 |
| Site locked (over the Free limit, SC-20) | Send / Re-send / Send Round n+1 disabled "Over the Free limit — Upgrade to edit" (owner) / "Ask the workspace owner to upgrade" (others); Revoke and Resolve allowed; issued links keep working; an approval can't clear publish until upgrade (locked sites can't publish) |

Client page states: loading · identify · open · no snapshot ("Preview unavailable for this version." — notes still usable) · answered (approved / changes / stale E) · dead (expired / replaced / revoked / not found) · already answered (inline in the Approve confirm from a second tab: "This round was already answered — reload to see it"; Fix §13-6) · offline · rate-limited ("Too many tries — wait a few minutes").

## 7. Content and copy *(DS; US English, SC-11)*
- "Round 2" everywhere (buttons keep "Approve Round 2"). Hints: "Click anything on the page to comment on it" / "Tap where you want to comment" / keyboard "Use arrow keys to move, Enter to place".
- General note: "Write a general note…". Invite email until R-2: "You can leave notes for {designer} — no account needed."
- Editor composer meta: "Team only · {page}" / "Sara will see this · {page}".
- Client page never says element, layer, breakpoint, publish; element labels use the layer name or plain type ("Logo", "Button").

## 8. Geometry and accessibility (NOT MEASURED)
- Client: header 56 (phone 48), side 360 / sheet 360 / full sheet; footer 64 sticky above `--cookie-inset`; **no horizontal scroll 320–1920**. Editor: task 360 (GEO-01), rows 32 / two-line 48.
- Pins 24, hit 32 desktop / 44 touch; popovers clamp to viewport −16.
- Landmarks header / `main "Site preview"` / `aside "Comments"` / region "Approval". Pins are buttons "Comment 1 by Sara: …", linked to rows. Keyboard crosshair announces "Crosshair at 40% across, 20% down". Live region polite for sent/replied, assertive for "Not sent". Approve confirm traps and returns focus. State never by colour alone; reduced motion → no pulse.

## 9. Preservation map
| Today | Target | Disposition |
|---|---|---|
| CR-01 flag; links survive flag-off | §6 | Keep (default OD-R1) |
| CR-02 send dialog, outcome, email-failed | §5.1 | Keep + Fix |
| CR-03 send rules, one PENDING, supersede | §5.2 | Keep + Change (supersede also internal rounds) |
| CR-04 token, 90 days, ADMIN-only link | §4.3, §6 | Keep |
| CR-05 revoke + confirm | §5.2 | Keep (SC-15 exception); Change: revoke = no current review |
| CR-07 identity, rate limits | §5.3 | Keep (+ OD-R7 code) |
| CR-08 frozen snapshot, sandbox, pages, footer | §4.1 | Keep + Fix (devices, full height) |
| CR-09 notes, team hidden | §4.1 | Change (pins, status shown, replies); general note kept |
| CR-10/11/12/13 answer, approve, cards, dead links | §5.3, §6 | Keep (+ inline already-answered, sender notified) |
| CR-14 ⋯ actions, status line, rows, Locate, Resolve, Copy link, Reattach, resolved section, Invite | §4.3 | Keep + Change (round card, filter, audience, footer primary) |
| CR-15 Comment located band, Edit {element}, all states, Send/Retry | §4.3 | Keep + Fix (‹ Back to Review, reply guard, active page, viewer composer) |
| CR-16 comment mode, pins, reattach | §4.4 | Keep + Change |
| CR-17 chip | §4.4 | Change (Panel 01 TB-05) |
| CR-18/19 staleness, gate | §5.5, Panel 14 | Change (snapshot time, one rule) / Keep |
No capability removed.

## 10. Planned
Multiple signers / CC (one `invitedEmail`, `prisma/schema.prisma:568`); **@mentions — Deferred** (not in code today, INV 14.6 / R8; R-3 covers replies and audience only) *(R-1018, T2-35)*; attachments; client content edits (D7); live-draft review (deliberately not); agency-branded review page.

### 10.1 Owner decisions — decided 2026-10-17 (SC-22), as recommended
| ID | Decision | Decided (as recommended) |
|---|---|---|
| OD-R1 | `agency_layer` default | **On for all workspaces; flag stays a kill switch** |
| OD-R2 | Plan gating (SC-20) | **Free and Pro, no plan gate** |
| OD-R3 | More than one signer per round | **Not now**; CC viewers later |
| OD-R4 | Frame `sandbox="allow-same-origin"` (scripts still off) to read element and content height | **Yes, after a security review**; fallback page-level notes |
| OD-R5 | Designer replies visible to client | **Yes, only with explicit "To {client}"** |
| OD-R6 | Client can withdraw an approval | **No**; reply + new round |
| OD-R7 | Email one-time code before Approve | **Yes** — turns "has the link and typed the address" into "controls the mailbox"; comments stay code-free |

## 11. Engineering dependencies, SC-15 exception, SC-10 rows
**SC-9 rows** (added, SC-9):
| Dependency | Needed by | Fallback until shipped |
|---|---|---|
| R-1 Viewer read of `reviews.status`, `currentRound` (no token), `rounds` | 17 §6 | Chip "Review"; task "Round details need Editor access" + comments list — never a load error |
| R-2 Pin capture: snapshot pages carry editor `pageId`; frame sized to full content height; element under click (OD-R4); `clientReview.comment` stores pageId/x/y/targetSelector | 17 §4.1 | Page-level notes tagged with page path; frame keeps internal scroll; email copy §7 |
| R-3 Comment replies (`parentId`) + `audience` team/client; client list returns designer replies on own threads | 17 §4.1, §4.3 | No client-visible replies; "{designer} sees these notes"; audience toggle hidden |
| ⛔ R-4 Notifications/emails for client open, comments (batched), changes, approve; link request to sender; 7-day reminder | 17 §5.6 | **Interim guard:** copy change, 60s chip refresh, task re-read on open |
| R-5 Comments tied to a round (`reviewId`) | 17 §4.1 | "From Round n" grouped by comment date vs round send dates |
| R-6 `currentRound` returns `expiresAt`, `invitedEmail` (all EDITORs), `lastSeenAt` | 17 §4.3 | End date ≈ sent + 90 days; opened time hidden |
| R-7 Chip stale uses page + CMS edit time | 17 §5.5 | code defect §13-3 |
| R-8 Client receipt (token-free) + "replied" digest emails | 17 §5.3 | On-page confirmation only |
| R-9 `/review/:path*` headers `no-referrer` + `X-Robots-Tag` | 17 §6 | meta robots only |
| R-10 Funnel events (part of F-1), emitted **server-side** from the client-review procedures — no telemetry script on `/review` (SC-22 OD-A5) | 00-STRATEGY §6 | none |
| ⛔ R-11 Store snapshot time per round (set on send and re-send); staleness = last edit > snapshot time | 17 §5.5, 14 §4.3 | **Interim guard:** staleness compares the last edit with the round's existing `createdAt` (not `updatedAt`, which moves on identify/resolve) — never misses an edit the client didn't see; may over-warn after a same-round re-send |
| R-12 `reviews.status` returns link state live / expired / revoked + `expiresAt` | 17 §4.3–4.4 | Expired shown to ADMIN only (token null); EDITOR sees "Sent · works until ~{date}" |
| R-13 One-time email code before Approve (OD-R7) | 17 §5.3 | invited-address match only (today) |
| R-14 Supersede revokes internal rounds too; gate and chip treat a revoked latest round as "no current review" | 17 §5.2, 14 | code defect §13-13 |
| ⛔ R-15 *(R-1018, T5-02)* **Review revoke is site-scoped**: the server matches the review to the `siteId` it checked the role on (today the role is checked on `input.siteId` but the review is matched only by workspace — cross-site revoke, INV R11, `review.service.ts:461-478`). = SC-9 ⛔ "Site-scope authorization" (1); decided PDB P1-D20 / FI-05; ref `feat/phase1-s5-authz` 7140abdd2 | 17 §5.2 | **None — release-blocking.** Acceptance T-FI-05 / T-CR-22: the server refuses a revoke for a review on another site |
| ⛔ R-16 *(R-1018, T5-02)* **Comment resolve checks the site role**: `reviews.resolve` uses the per-site role (with caps), not workspace ADMIN (INV R15, `reviews.ts:180-187`). = SC-9 ⛔ "Site-scope authorization" (2) | 17 §5.4, §6 | **None — release-blocking.** Acceptance T-CR-23 |

**SC-15 declared exception (applied; current list in 00 SC-15):** "…transferring the site, **revoking a client review link**, and lossy CMS conversions. Revoking a link takes effect at once for the client and a revoked token is never reissued (`prisma/schema.prisma:562`), so Undo cannot restore it — a re-send issues a new link instead."

**SC-10 amendment rows (added, SC-10):**
| Amendment | Source | Panel |
|---|---|---|
| Comment pins also visible while the Review task is open; client pins labelled "Client" | Panel 17 §4.4 | 05 CV-17 |
| Review chip words: Not sent · Review · Sent · Opened · Changes requested · N · Approved · Approved · edited since · Link expired (R-12); no revoked chip | Panel 17 §4.4 | 01 TB-05 |
| Review task: round card, Client/Team filter, audience toggle, footer "Send Round n+1", "‹ Back to Review", reply guard | Panel 17 §4.3 | 12 RT-11, RT-06 |
| Publish Approval row: "(not required)" when the setting is off; banner "review link expired · Re-send ›"; stale measured from the round's snapshot time; revoked latest round = no review | Panel 17 §4.3, §5.2, §5.5 | 14 §4.1 Approval, §4.3 section 4 |
| Confirmation kept for revoking a client review link | Panel 17 §5.2 | SC-15 |

## 12. Acceptance (specified, NOT RUN)
| ID | Case |
|---|---|
| T-CR-01 | New workspace (OD-R1): Send for review offered; client email → working link + invite email |
| T-CR-02 | Snapshot render fails → dialog stays open with Try again / Send without preview |
| T-CR-03 | Client at 320, 375, 768, 1280, 1920: no horizontal scroll; device switch 1440/768/375; Desktop view shows the Desktop layout |
| T-CR-04 | Wrong address → inline error; member address cannot approve |
| T-CR-05 | Client pins Logo on Home → editor canvas shows a "Client" pin with the Review task open; Locate › selects it (R-2) |
| T-CR-06 | Keyboard: Add comment → arrows move crosshair → Enter places → x/y stored; C works only with frame/panel focused and stops when the toggle is off |
| T-CR-07 | Phone 375, Desktop view: Comment → 1:1 pan mode → tap places → returns to fit |
| T-CR-08 | 3 comments + Request changes → chip "Changes requested · 3" within 60s; one batched bell row (R-4) |
| T-CR-09 | Reply "To Sara" visible on her page; Team-only never visible; unsent reply + switch task → "Leave without saving?" Keep editing / Discard changes *(R-1018, S3)* |
| T-CR-10 | **B1:** edit after send, before approval → on approval the chip reads "Approved · edited since" and Publish section 4 shows stale (R-11) |
| T-CR-11 | CMS-only edit after approval → chip, card, client page E and Publish agree (R-7) |
| T-CR-12 | **B5:** revoke the latest round (an older internal round was APPROVED) → chip Not sent/Review; with approval required, Publish says "no review sent" (R-14) |
| T-CR-13 | Expired link: ADMIN card "Link expired · Re-send", chip "Link expired" (R-12), Publish banner "review link expired · Re-send ›"; client sees the Expired screen |
| T-CR-14 | Superseded link shows "replaced by a newer one — check your email"; Request a new link notifies owner and sender |
| T-CR-15 | Offline client: draft survives reload in the same tab; Approve/Request changes disabled with reason |
| T-CR-16 | Round 2 lists Round 1 comments as "From Round 1 · may have moved", no frame pins |
| T-CR-17 | Unanswered link with 7 days left → card line + notification "expires in 7 days · Re-send" |
| T-CR-18 | Viewer: Review opens read-only, no error; can post Team comment; EDITOR sees "Ask an admin for the link" |
| T-CR-19 | Approve in two tabs → second shows "already answered — reload"; OD-R7: Approve requires the emailed code |
| T-CR-20 | Edit {element} from Comment located → canvas chip "‹ Back to Review" returns to the same thread |
| T-CR-22 *(R-1018, R-15)* | Admin of site A (not a member of site B in the same workspace) calls revoke with `siteId` A and a review id from site B → refused, nothing changes (T-FI-05) |
| T-CR-23 *(R-1018, R-16)* | Workspace ADMIN whose role on this site is capped below EDITOR calls `reviews.resolve` → refused; an EDITOR on the site succeeds |
| T-CR-21 | `/review/<token>` sends `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`; flag off after send → link still opens and approves |

## 13. Code defects found (engineering, not design)
1. Client notes sent without page/position/element (`RC:300-311,333-343`) though the schema accepts them (`reviews.ts:98-108`); email promises on-page comments (`review-invite.tsx:44-45`); so client notes never pin (`CommentLayer.tsx:451-457`).
2. No notification on client approve / changes / comment (`CRS:283-376`); `RT:1008` says "You will be notified."
3. Chip stale ignores CMS edits (`RS:240,271`) unlike publish (`publish.service.ts:462`) and client page (`CRS:221-225`).
4. Viewer Review cannot load: `currentRound` needs EDITOR (`reviews.ts:205`) → error state (`RT:233-244`) (inferred, NOT RUN).
5. Viewer composer disabled (`RT:1107-1108`) though `comments.create` allows viewers (`comments.ts:39-57`).
6. CONFLICT dead-link card unreachable (`CRS:132-178` vs `RC:37-40,182-193`).
7. Snapshot frame fixed 680 (`signoff-snapshot.tsx:104`) → Mobile CSS on desktop; page overflows phones (CR-24).
8. Snapshot render failure swallowed (`SendForReview.tsx:105-111`).
9. `/review/*` lacks `/share/*` headers (`next.config.mjs:122-132`).
10. `ReviewService.ts:89-93` says a token is minted without `clientEmail`; server mints only with one (`RS:123-125`).
11. `REVIEW_LINK_REQUESTED` missing from `NotificationType` (`enums.ts:149-171` vs `:193`).
12. Invite email font `system-ui, sans-serif` (`review-invite.tsx:35`) — DESIGN.md bans system fallbacks (flag for design owner; email may need a web-safe stack).
13. Supersede revokes only rows with a token (`RS:134-139`), so internal rounds stay live; revoking the latest round makes the chip (`RS:245-251`) and the publish gate (`publish.service.ts:447-451`) read the previous non-revoked round — an older internal APPROVED round can clear the gate (code path read; outcome NOT RUN).
14. **Approval can cover content the client never saw:** staleness compares the last edit with the approval time (`publish-approval.ts:58-64`, `CRS:221-225`), so edits made between send and approval count as approved; no snapshot time is stored.
15. Review composer posts to the **first comment's page**, not the active page, while its label names that page (`RT:289`, `:1107,1117`).
16. Client page fetches each note's status (`CRS:318`) but never renders it (`RC:349-356`).

## 14. Review and not verified
Independent `design-qa-critic` pass 1: PROPOSAL, 7 blocking (B1–B7) + 11 notes (N1–N11) — all fixed 2026-10-17. Pass 2: 3 blocking (OD status per SC-22, status line names R-11, site-locked row per SC-20) — fixed 2026-10-17. *(R-1018)* **Not applied (needs a decision):** D3-22 — whether interactions play on `/review` (IXD-3 for `/review`) or the page states "Animations don't play in review"; T1-07 review-closed in-session toasts vs bell only (Panel 22 §5.10).
Not verified: runtime of the editor Review task and `/review/<token>`, emails, real devices (pan/pinch), screen-reader output, rate limits, the `allow-same-origin` security posture (OD-R4), one-time-code delivery. Code facts are from a source read on 2026-10-17. No Figma boards exist for §4.1–4.3; the "Client sign-off" family (`4418:121903` etc., `RC:8-16`) covers today's states only.
