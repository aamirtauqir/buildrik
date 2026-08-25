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
