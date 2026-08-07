# Buildrick Editor — The Complete Picture

**7 August 2026 · written for the founder · one document, everything in it**

Read this top to bottom once. Every section stands alone, so you can also
come back to any one part later. Where a thing lives in the repo or in Figma,
the exact path or board id is next to it.

---

## 1. Where the product stands today

| Thing | Number | Meaning |
|---|---|---|
| Users | 15 | all on free, sessionVersion 0 |
| Revenue | $0 | Stripe live-mode not provisioned yet (§9) |
| Real client review walks | 0 | the core differentiator is untested with a real client |
| Figma boards (Editor page 1:3) | **374** | every screen and state of the editor, drawn |
| Boards reachable in the prototype | **374 / 374** | zero dead ends, zero broken links — you can click through everything |
| Editor code files | 396 | React/TypeScript, the live product |
| Code families rebuilt to boards | 4 of ~12 | Insert ✅ Layers ✅ Pages ✅ Media ~98% — **paused on your order** |
| Quality gates on every push | 15+ | all green today, incl. the new hex-drift gate |

**The one-line story:** the design (Figma) is now complete and fully
connected; the code follows it family by family; the business proof
(a paying customer, a client clicking Approve) has not started.

---

## 2. The rule that governs everything

You set this rule and it is written into the plan:

> **Code is the truth for behaviour** — what the product can do, who is
> allowed to do it, what gets validated.
> **Figma is the truth for appearance** — layout, colour, copy, flow.

Why it exists: on 5 Aug the "Publish pre-checks" board showed 8 checks;
the code actually runs 6. The board had invented 7 of them. If Figma had
been the truth for behaviour, we would have built fiction. The board was
corrected to match the code, and the rule was born.

---

## 3. What happened today (the whole day, in order)

1. **Flow read.** Live walk of the Figma prototype graph. Found 10 freshly
   drawn boards nobody had wired in, and 12 boards missing from the
   manifest the gates check against. You approved: wired all 10, fixed the
   manifest → 368/368 reachable.
2. **Direction change.** You said the old plan (rebuild the *code*) was not
   what you wanted — the deliverable is the *Figma file*. Old plan removed
   (kept in git history), new plan written and reviewed by an adversarial
   CEO pass (11 findings). You chose the **timeboxed core** shape and then
   compressed it to **one day**.
3. **Phase 0 — Reconciliation matrix.** Every feature in the code matched
   against every board in Figma, ~340 rows, each classified (consistent /
   code-only / Figma-only / broken / dead…). Problem rate **16.5%**, under
   the 20% stop-line → proceed. Two artifacts:
   `docs/audits/2026-08-07-editor-code-inventory.md` and
   `docs/audits/2026-08-07-editor-reconciliation-matrix.md`.
4. **Phase 1 — Six new boards drawn** using the file's own components and
   idioms (no new visual language invented):
   - Review panel · loading, History · Saves · loading (skeleton states)
   - Brand · empty, Components · empty, Templates · empty (you approved the copy)
   - Settings · Custom code · locked (Pro) — replacing the Headers lock per
     your pricing decision (§4)
   All six wired into the prototype; graph re-checked: **374/374**.
   Screenshots caught two real mistakes (red titles, a duplicated nav row)
   — both fixed before moving on.
5. **Publish flow consolidated.** The path to the Confirm dialog used to run
   through a board for a feature that doesn't exist yet ("Publish Options").
   Now: pre-checks → Confirm directly, matching the code. The Options board
   stays, clearly marked as future.
6. **Phase 2 — New guard: hex-drift gate.** A script that goes red if any
   captured board uses a colour outside the token palette. This is the exact
   hole that let a wrong blue (`#3366f2`) spread to 95 places unnoticed last
   week. The gate was **deliberately fed a planted violation and watched to
   fail** before being trusted, then wired into the push checks.
7. **Publish confirm shipped in code.** Both publish buttons (topbar and
   panel) now stop at one confirmation dialog before replacing the live
   site. 29 tests green.
8. Nine commits, tree clean, all gates green.

---

## 4. Your decisions, on record

| Decision | What you chose | Where it's written |
|---|---|---|
| Deliverable | The Figma file, not a code rebuild | plan, provenance section |
| Old plan | Removed from repo (git history keeps it) | plan header |
| Timebox | 3-day core compressed to 1 day | plan, decision record |
| Pro pricing screens | **Custom code + Integrations** are Pro. Headers stays free | plan + TODOS backlog |
| Empty-state copy | Approved my proposed lines for Components/Templates | boards, tags removed |
| Tokenization of the Figma file | Deferred until the code rebuild resumes (lint covers drift meanwhile) | plan, deferred table |
| Everything preserved | Nothing deleted in Figma — superseded boards archived, unbuilt ideas marked | matrix §E |

---

## 5. The Figma file today (`g4GzQFqzNYz5sosz1QtZXC`, page 1:3)

- **374 boards, all reachable, zero dead ends.** 11 named flow entry points
  (boot, first-run, ⌘K, send-for-review, viewer role, client role…).
- **327 active** boards = things the product does today.
- **25 design-ahead** boards = drawn, waiting for backend (scheduled
  publish, backups, multiplayer presence, site health, performance audit).
  Your order stands: *"backend baad me, pehle design complete."*
- **Marked so nobody is confused later:**
  - `[dashboard-flow]` on 11 boards — the AI-draft flow lives in the
    dashboard app, drawn here for continuity.
  - `[not-implemented]` on 9 boards — ideas with no code yet (Commerce ×3,
    share-link/interaction-test/accessibility-checker previews, publish
    changelog, deploy pipeline, share-permissions modal). These are your
    future roadmap, preserved.
- **Archive section** holds everything superseded — including the old
  Headers·locked board from today's pricing decision.

---

## 6. The code today

**Shipped and matching boards:** Insert, Layers, Pages (incl. page tab bar +
settings modal), Media (grid, 5 drill-ins, image editor). Publish confirm
dialog shipped today.

**Paused (your order):** the family-by-family rebuild. Next in line when it
resumes: **Content** (board 148:2) — and resuming it is also the test of
today's matrix: if Content can be built from its boards with zero
clarification questions, the reconciliation was complete. That is the
plan's pass/fail line.

**Dead or broken things the sweep found in code** (all documented, none
deleted — full 30-item table in the code inventory):

| The user would notice | What's wrong |
|---|---|
| "Re-send" button in Review panel does nothing | wiring prop never passed — 1-line fix, in TODOS |
| ⌘K "Open AI/Components/Publish/Review/Content panel" do nothing | 5 panels missing from the allowed list — in TODOS |
| Custom-code screen was never actually Pro-locked | dead key in the gate map — in TODOS, matches your §4 decision |
| Help "?" icon missing on every panel | prop never supplied |
| A second, hidden rail design (`?rail=e3`) and a legacy rail | old experiments still in the code |
| ~20 dead files (old zoom controls, unused subsystems) | candidates to delete when code work resumes |

---

## 7. The guardrails (why you can trust green)

Every push runs the `verify:ds` chain. The ones that matter most:

| Gate | What it refuses |
|---|---|
| boards | a board vanishing from scope, or a recipe pointing at nothing |
| **hex-drift** (new today) | any captured colour outside the token palette — the #3366f2 hole, closed |
| token-resolution | a board's colour contradicting the token it names |
| copy | shipped text drifting from the final wireframe copy |
| styling ratchets | inline styles or CSS growing back (may only fall: 761/331/9704 today) |
| anchors | a recipe naming a test-id that doesn't exist |

House rule applied to every new gate: **it is fed a planted violation and
watched to FAIL before anyone believes its green.** The hex gate did that
today.

---

## 8. Honest list — what is NOT done

1. **No revenue infrastructure live.** Stripe test-mode works; live mode has
   no products (§9 has your checklist).
2. **No real client has walked the review loop.** The product's core bet is
   unproven.
3. **The Figma file's colours are raw hex** (0 paint styles, 113 unbound
   variables). Tokenizing it is deferred — the lint catches drift meanwhile.
4. **Code rebuild paused** at 4 of ~12 families.
5. **16+ design-ahead features have no backend** (by your explicit order).
6. Analytics provider is a no-op — nothing measures activation or drop-off.

---

## 9. The business queue (what the reviews keep pointing at)

Both review models said the same thing: the design work is real, but the
company's first *evidence* comes from these three, and each is about a day:

### a) One real review walk (I can run the rehearsal today)
Goal: someone who isn't you opens `/review/<token>`, reads, clicks
**Approve**, and the approval gates the publish. I can simulate the full
client walk in a browser first (friction log → S5 boards), then you send a
real client the link.

### b) Stripe live mode — your ~30-minute checklist (founder-only steps)
1. Stripe Dashboard → switch to **Live mode**.
2. Create products: **Pro** ($29/mo, $23/mo yearly) and **Business**
   ($79/mo, $63/mo yearly) — the same four prices that already exist in
   test mode.
3. Copy the four live Price ids into the cPanel env:
   `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`,
   `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_YEARLY`
   (remember: env writes REPLACE the whole map — merge, don't overwrite).
4. Set live `STRIPE_SECRET_KEY` + webhook endpoint with
   `STRIPE_WEBHOOK_SECRET`, subscribed to exactly:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid`,
   `invoice.payment_failed`.
5. Run `pnpm run env:check:prod` before believing any of it.
6. One live test purchase, then refund it.

### c) Pilot workspace
Flip `agency_layer` for one real workspace and watch them use it.

### d) Resume Content rebuild
Also the matrix's pass/fail test (§6).

---

## 10. Where every document lives

| Document | Path |
|---|---|
| The plan (reviewed, approved, executed) | `docs/plans/2026-08-07-editor-figma-completion.md` |
| Reconciliation matrix | `docs/audits/2026-08-07-editor-reconciliation-matrix.md` |
| Code feature inventory + dead-code ledger | `docs/audits/2026-08-07-editor-code-inventory.md` |
| This report | `docs/reports/2026-08-07-buildrick-editor-complete-report.md` |
| Code-arc backlog | `TODOS.md` (bottom section) |
| Removed old plan | git history + `~/.gstack/projects/aamirtauqir-buildrik/` snapshots |
| Board manifest (the scope the gates check) | `packages/editor/scripts/conformance/boards.json` |

**Today's commits:** `e8a7dccd` publish confirm · `f8469594` + `d0cec54b`
manifest + hex gate · `2d3b7513` matrix + inventory · `7117e3b1` plan
redirect · `bfa85e19` backlog · plus the copy-approval sync.

---

## 11. Addendum (same evening) — the Figma file got its design system

After this report was first published, the founder set the lane: **design,
in Figma.** The biggest structural gap from §8.3 was closed the same evening:

- **45 paint styles created** — the Styles panel went from empty to a full
  semantic set (`color/ink`, `color/bg-panel`, `color/accent`…), every style
  bound to its variable, so the token stays the single source of truth.
- **5,673 raw colours bound to tokens** in three verified passes, zero
  errors: exact matches first (no visual change), then a deliberate
  **drift repair** — the newest boards had been drawn with an old
  grey-purple ramp (~1,500 paints) plus stray blues/greens/ambers; all
  remapped onto the current design system. Three heaviest boards
  screenshot-checked: clean.
- **Raw colours on product boards: 6,075 → 235 (−96%).** The rest is a
  one-off tail (biggest offender: a banned purple `#7359d9` ×6) listed for
  the next design session. Archive/Reference material was left untouched —
  history stays history.

What this buys: any future palette change is now a variable edit, not a
95-instance manual hunt — and the hex-drift gate (§7) keeps it that way.

*End.*
