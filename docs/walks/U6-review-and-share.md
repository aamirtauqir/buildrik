# U6 · Review / share — walk record (PARTIAL)

Walked 2026-08-24 · localhost:3000, real session for the owner, a **clean
anonymous context** for the client.

The CEO review of 2026-08-24 called this flow the product's wedge and noted it
had never been walked once. This is that walk, for the share half.

## The doors

| door | where |
|---|---|
| Review panel | ⌘K → **"Open Review panel · R"** |
| Share preview link | site menu → **"Share preview link"**, which opens a NEW TAB at `/dashboard/sites/<id>?share=1` — the editor hands off to the dashboard's ShareDraftModal |

The site menu itself is dense and legible: Site settings, Version history,
Publish panel, Publish history, Export code, Site health, Activity log,
Templates, Components, Design system, Plugins, Enter view mode, Share preview
link, Invite teammates, Account settings, Keyboard shortcuts.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Review panel empty state | **PASS** — *"No review yet — Send this site to a client and they get a link to comment on it."* with a **Send for review** action. One sentence, and it explains the differentiator. |
| 2 | Share Draft modal | **PASS, and unusually honest** — *"A private link to this site for clients or teammates. **It opens the published site — there is no server-side render of the draft** — and can carry a password and an expiry."* Link name, optional password (`Password links require PRO`), expiry chips (1 day / 7 days / 30 days (upgrade) / No expiry). |
| 3 | creating the link | **PASS** — produced `http://localhost:3000/share/3b00d2a7-…` with Copy / Done, and the modal's post-create copy states the limitation again: *"Until the site is published, the link says so rather than showing the draft."* |
| 4 | **what a client actually sees** | **PASS, and this is the leg that had never been run** — opened in a clean anonymous context. HTTP **200**, and the page reads: *"scratch-smoke isn't published yet — This link works — there's just nothing to show until the site is published. Keep it; it opens the site as soon as that happens."* No 404, no broken render, no dead end. It tells the client the link is good and what will happen. |

Leg 4 matters because this repo has the opposite on record: a `/share/<token>`
that returned 200 while the page said "This link doesn't work". Here the status
and the words agree, and the words are useful.

## NOT walked

- **The review ROUND** — `Send for review` → `reviews.submit` → the admin
  resolving APPROVED / CHANGES_REQUESTED, and `/review/<token>` as the client
  sees it. That is U6's other half and the part that actually closes the loop.
- The password and expiry options on a share link.
- Whether the share link opens the real published site once one exists — which
  cannot be walked until SHIP-gate item 3 (a real publish) is done.

## Disclosed

This walk created one real draft-link row on `scratch-smoke`
(`3b00d2a7-6143-4fa6-af73-61e5a3e24227`). It is a scratch site and the link is
harmless, but the row is mine and is not cleaned up.

---

## Addendum, 2026-08-25 — the review ROUND, walked end to end. It works.

Lane of `docs/plans/2026-08-25-editor-flow-walk-arc.md`. This record's "NOT
walked" list opens with **the review ROUND** — *"that is U6's other half and the
part that actually closes the loop"*. It is now closed.

This also settles a condition three separate plans have carried forward:
**"the differentiator has never run."** It has now. It works.

### Preconditions on this fixture

`workspaceFeature` rows: `agency_layer: enabled`, `client_mode: enabled`. So the
flag that `feature-flag.service.ts` defaults to `false` is **on** here, and the
review surfaces are live rather than dark.

### The round

| # | step | evidence |
|---|---|---|
| 1 | Editor review bar → `Re-send` | `reviews.submit` **200**, then `reviews.currentRound` 200 |
| 2 | the snapshot | `reviewRequest.snapshotPages` went from `NULL` to **4 pages** |
| 3 | client opens `/review/<token>` — **no session, fresh context** | **200**, 0 console errors. Reads *"E2E Blank WS 0a95fc **is asking for your feedback**"*, lists `Home · about · page-3 · page-4`, `Your notes` / `Add note` |
| 4 | the version contract, stated to the client | *"Signed as Fixture Reviewer. **You are looking at the version sent to you 8/9/2026 — later edits will not change it.**"* |
| 5 | `Approve this design` | confirmation dialog: *"**Approve E2E Blank Full d013128c?** This tells your designer the design is settled and they can put it live. You are approving the version you have been looking at."* · `Not yet` / `Yes, approve` |
| 6 | `Yes, approve` | `clientReview.resolve` **200** |
| 7 | what the client sees | *"**You approved this.** Thanks — E2E Blank WS 0a95fc can take it from here. You'll hear from your designer when it goes live."* |
| 8 | the database | `status: PENDING → APPROVED`, `resolvedAt: 2026-08-25T06:41:23Z` |
| 9 | **the editor, reloaded** | topbar now reads **"Approved by Fixture Reviewer · just now"**, and the `0 open · Next › · Compare · Re-send` bar is replaced by the approval state |

Step 9 is the one that matters. The loop does not just record an approval — it
comes back and changes what the designer sees.

**The copy is the strongest in the product.** Three places earn it: the version
pin in step 4 (a client cannot approve something and then be told it changed),
the downstream consequence in step 5 (*"they can put it live"* — the client
learns what approving does before doing it), and step 7, which tells them what
happens next instead of dead-ending on a thank-you.

### A finding I did NOT file

On the first pass the review page read **"Preview unavailable for this
version."** — a reviewer being asked to approve a design they cannot see, which
would be a serious defect in the wedge.

It was a fixture artifact. That `reviewRequest` was seeded directly (its note
read `baseline fixture review`) and its `snapshotPages` was `NULL`. After a real
`Re-send` through the editor, the snapshot populated and the page list rendered.
**The product captures the snapshot; the seeded row never had one.** Filing it
would have been a false defect against the one flow this arc most needed to
trust.

### Observed, not filed

- `resolvedById` stays `null` after approval. The reviewer is token-identified
  (`Fixture Reviewer · reviewer-fixture@buildrik.local`) and the UI names them
  correctly in both surfaces, so identity is not lost — but the column is empty.
  Whether that is intended for anonymous token reviewers or a gap is a schema
  question this walk cannot settle.
- `Re-send` on an already-PENDING round **updates that round in place** rather
  than opening a new one — same `id`, same `token`, refreshed snapshot. That is
  defensible (the client's link keeps working) but it means "round 2" is not a
  new row, which anything counting rounds needs to know.
- `changeSummary` was `"fixture"` before the re-send and `null` after — the
  re-send cleared it rather than carrying it.

### `/share/<token>` — also walked, also good

**200**, and it does not pretend: *"E2E Blank Full d013128c **isn't published
yet** · This link works — there's just nothing to show until the site is
published. Keep it; it opens the site as soon as that happens."*

That distinguishes "this link is broken" from "there is nothing here yet",
which `feedback_two_hundred_is_not_a_working_page` records as a defect this
product previously shipped. It is fixed and the copy is explicit about it.

### Still not walked

The password and expiry options on a share link, `Ask for changes` (only
`Approve` was taken), and whether the share link opens the real published site
once one exists — that last one needs a publish, which is out of this arc's
scope by founder call.

### What this walk did NOT assess

Visual and IA. Behaviour, state and data only.

---

## Addendum 2 — the states after approval, 2026-08-25

Continuing the same lane. Three findings from the post-approval states, none of
which the first pass could see because the round was still PENDING.

### 1. `Re-send` refreshes the snapshot but not the "Sent" clock

The editor's Review panel (opened by clicking the approval pill) reads:

> `0 of 0` · **Sent 16d ago** · Fixture Reviewer · *"Fixture Reviewer has not
> commented yet. You will be notified."*

The round **was re-sent today**. "16d ago" is counting from the row's original
`createdAt` (2026-08-09), because `Re-send` updates the request **in place** —
it refreshes `snapshotPages` and leaves `createdAt` alone. So the client's link
is carrying today's snapshot while the designer's panel says it was sent
sixteen days ago.

Low severity, real, and it follows directly from the in-place update recorded in
addendum 1. Whatever fixes it has to decide which timestamp "Sent" means: the
first send, or the last.

### 2. The client's resolution is one-way, and that looks deliberate

Re-opening `/review/<token>` after approving shows a terminal state — *"You
approved this. Thanks — … can take it from here."* — with **no `Ask for
changes` and no way back**. The client cannot un-approve through the link they
were given.

Recorded as behaviour, not a defect: a resolution the designer can act on
should not silently reverse under them. Worth confirming as intent.

### 3. Copy defect — the header contradicts the body

The same page still renders its pre-approval header above the post-approval
body:

```
E2E Blank WS 0a95fc is asking for your feedback     <- header, unchanged
You approved this                                    <- body, resolved
Thanks — … can take it from here.
```

The heading asks for feedback that has already been given. One line, and it is
the last thing a client sees on the wedge surface.

### `Ask for changes` — WALKED 2026-08-25, and it passes

The earlier note said the branch was unreachable because the panel offered "no
visible re-open or new-round door". That was wrong about the door and right
about the outcome: the door is **in** the Review panel — `Re-send for review`,
below the comment list — and it does open a fresh round. It just opens one the
client can never see. Walking that is what turned up the three defects below.

The branch itself is sound. On `/review/<token>` with no session, identified as
the reviewer:

    Ask for changes  →  clientReview.resolve 200
                     →  "You asked for changes — Your notes are with your
                        designer. They'll send a new link when the changes are
                        ready for you."
    DB               →  status PENDING → CHANGES_REQUESTED, resolvedAt stamped

One click, no confirm step. Editor side picks it up: topbar pill reads
**"Changes requested"**, the Review panel's revoke control correctly becomes
`Revoke link` (not `Withdraw request`) now that `invitedEmail` is set, and the
publish gate blocks. Identity carried across the round without re-asking, which
is what `client-review.service.ts:163` claims it does.

### ⛔ D1 — a client can be invited to exactly one review round, ever

Two halves, both verified in code and live:

- `AquibraStudio.tsx:392` — `resendReview` calls
  `submitForReview(undefined, undefined, undefined, snapshotPages)`. The third
  argument is `clientEmail`. `review.service.ts:85` only mints a token
  `if (clientEmail)`, so **every round after the first has `token: null`**.
- `ReviewTab.tsx:405` — `SendForReview`, the only form in the product with a
  "Client email" field, renders under `if (!round)`. Once *any* round exists —
  pending, approved, revoked — that form is gone for good.

So there is no path from "a round exists" back to "invite a client". Measured:
panel `Re-send for review` on the approved fixture produced a PENDING round with
`token: null`, and the client's old link still opened round 1's terminal screen —
*"You approved this. Thanks, E2E Blank WS can take it from here."* The reviewer
has no way to reach round 2. The button says "Re-send for review"; nothing was
sent.

This lands directly on the copy the client is left holding: *"They'll send a new
link when the changes are ready for you."* No control in the product mints that
link.

### ⛔ D2 — the panel tells the designer to keep waiting on a closed round

`ReviewTab.tsx:601-607` chooses the body from `round.revoked`, then `total`,
then `openComments.length`. Round **status is never consulted**. A round the
client closed with `Ask for changes` and no note has `total === 0`, so it renders
`emptyBody`:

> Fixture Reviewer has not commented yet. You will be notified.

Measured with the DB reading `CHANGES_REQUESTED`. The topbar pill beside it says
"Changes requested" — the two disagree on the same screen.

### ⛔ D3 — the publish gate calls a resolved round "still open"

`PublishConfirmFacts.tsx:41`. `approvalLine` branches on `approved`, `revoked`
and `openCommentCount > 0`, then falls through to `Round ${n} is still open.`
`CHANGES_REQUESTED` takes the fallthrough. Measured in the gate:

> Client approval — Round 2 is still open.

The gate's *decision* is right (publish stays blocked); its *reason* is wrong.
D2 and D3 are one shape — three statuses in the schema
(`PENDING | APPROVED | CHANGES_REQUESTED`), two in the UI.

### Noted, not filed

`issueReviewToken`'s comment promises re-sending "must invalidate the old link".
It nulls the token on the row it updates, and a new round is a new row — so
round 1's token stays live across rounds. Harmless here because an APPROVED
round renders a terminal screen with no controls, but the invariant is per-row,
not per-site.

`resolvedById` is null on both resolved rounds. It is a `User` foreign key and a
client reviewer is a `Reviewer`, so nothing on the client path can ever fill it.

### Also confirmed live

`Approved · edited since` in the topbar — the `S5.6 · approved-edited-since`
board state — appears as soon as an edit lands after approval.

### Figma coverage of the client surface — measured 2026-08-25

Read from the file, not from the census, because inferring a gap from
`boards.json` names has been wrong twice in this arc.

`S5.5 · reviewer-view · external-reviewer` (`807:8723`, 1440×900) is the **only**
client-facing board. It draws three frames — `review-toolbar` /  `site-preview` /
`review-bottom-bar` — i.e. the **active review state**: site name, "In review",
page tabs, a comment thread, and the two decisions.

The `S5.2` family is **editor-side**, not client-side. `S5.2 · approved`
(`130:798`) and `S5.2 · pending` (`130:201`) both draw the editor — `‹ Exit`,
the Insert/Layers/Pages/Media/Content/Brand rail, `Publish`, and the review bar
with `Re-send`. They are the review pill's states seen from the owner's chair.

So of the four client states this walk measured live, **one has a board**:

| Client state | Board |
|---|---|
| Active review — pages, notes, the two decisions | `S5.5 · reviewer-view` |
| Identity gate — *"Before you start, tell us who you are…"* | **none** |
| Terminal — *"You approved this"* | **none** |
| Terminal — *"You asked for changes"* | **none** |

⚠ **A copy divergence, board vs code.** `S5.5`'s bottom bar reads
**"Request changes"**; the live surface reads **"Ask for changes"**. Button copy
is UI copy, not board sample data ("Bella Cucina", "Sara M." are), so the
founder's precedence rule applies: visual and on-screen copy → the board. The
code is the side out of step.

Wiring is present and healthy — `S5.2 · approved` carries
`hotspot/state · S5.6 · approved-clean` and `S5.2 · pending` carries
`hotspot/state · S5.2 · none`, consistent with this arc's Figma lane closing as
"wire, do not redraw; nothing to add".

**Not drawn here.** Adding three 1440×900 client boards is a design act, and
`docs/plans/2026-08-25-editor-ui-redesign.md` is actively redrawing this surface
under the founder's full-scope choice. Drawing them from a behaviour walk is how
the file gets duplicates.
