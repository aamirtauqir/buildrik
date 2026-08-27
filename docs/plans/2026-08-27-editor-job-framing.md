<!-- /autoplan restore point: /Users/shahg/.gstack/projects/aamirtauqir-buildrik/main-autoplan-restore-20260827-093121.md -->
# The editor does not tell anyone what to do — 2026-08-27

Founder, verbatim: *"job base ni hai editer. screens per client ko samjh ni ati
ka kya karna hai."*

This is an addendum to `docs/plans/2026-08-25-editor-ui-redesign.md`, not a
replacement. That arc is autoplan-reviewed with a binding founder scope
decision — every editor surface gets a redesign, a verification and an
implementation, in twelve per-family loops. It is a **surface** plan: it makes
each screen right. It does not answer *"what am I supposed to do here?"*, which
is the founder's actual complaint, so this addendum carries that half.

---

## Part 1 — is the design complete against the codebase?

`scripts/conformance/boards.json`: **422 boards — 366 active, 30 design-ahead,
26 out-of-scope**, across 34 families.

"design-ahead" means the board exists and the code does not. Those 30 are not
scattered: they are **seven features**.

| Feature | Boards | What is drawn |
|---|---|---|
| History · Backups | 7 | tab, creating, restoring, restored, restore-confirm, restore-failed, empty |
| Preview tools | 7 | accessibility checker, interaction test, share link, performance audit (+running, issue detail, all-clear) |
| Scheduled publish | 5 | S6.5 and its scheduled / cancel-confirm / invalid-date states, deploy-progress pipeline |
| Commerce | 3 | setup, sample-added, bound |
| Multiplayer | 3 | Shell state 13 · Presence, S5.8 cursor-following, S5.7 comment-thread micro-states |
| Site health | 2 | S7.1 monitor, and its healthy state |
| Publish · Options | 1 | — |
| Share permissions | 1 | S5.9 modal |
| Publish changelog | 1 | S6.3 diff-summary |

**That count was too narrow, and the review caught it.** Filtering
`status == "design-ahead"` cannot see a board that is `status: active` with an
unresolved `authority`. Re-run over `authority` and the real answer appears:

| | Count | What it means |
|---|---|---|
| open decision (`open:*`) | **28** | drawn, buildable, waiting on a call nobody made |
| blocked (`blocked:*`) | **6** | drawn, and blocked on a producer that was never written |
| undecided | **55** | 15 are Reference boards, not screens; the rest are the design-ahead features above |
| design-ahead / not-implemented | 30 | the seven features in the table |

**18 of the 28 open decisions are Brand alone** — and 8 of those are one
unsettled convention, `open:status-pill-convention`, repeated across the
export / preset / token states. Brand is not missing code; it is missing a
decision, eight times over.

The six blocked boards name their own missing producers, and every one matches
what the 2026-08-26 walk measured live:

| Board | Blocked on |
|---|---|
| Brand · lint | `blocked:no-autofix-producer` — the panel says so itself: *"Auto-fix isn't available yet"* |
| Review panel · older-round | `blocked:no-round-linkage` |
| Templates · loading | `blocked:static-catalog` — a static catalog has no loading state |
| Brand · loading | `blocked:sync-load` |
| Modal · submitting, Modal · error | `blocked:sync-delete` |

And the sentence *"nothing in the shipped editor is undrawn"* is **withdrawn**.
`boards.json` enumerates the Figma page; it cannot support a claim about code,
and its own `_note` records the counter-example — the Media full-page library,
where *"code was ahead of Figma (founder catch)"*.

One board deserves naming on its own. `65:2` carries
`authority: open:first-run-drawer` and draws a rail coach mark reading
*"Everything you build lives behind these six"*. It answers the founder's
question in one sentence, it is drawn, and it is not built — and the
`status`-only method could not see it.

---

## Part 2 — what the editor actually tells a user, measured

Opened at 1440×900 on a real session, default state. Every imperative sentence
on screen:

1. *"Select something on the canvas to edit it."* — the inspector's empty state.

That is the whole list. (The probe also caught *"Click Me"*, which is a button
**on the customer's page**, not guidance.)

There is a seven-step job model, and it is good:

> **Get started — 0 of 7 complete**
> Name your project · Choose a starting point · Add an element · Edit text ·
> Style an element · Preview your site · Publish your site

The active step expands with a real explanation — *"Give your project a name —
it shows in the browser tab and as the SEO site title"* — and a primary action
(**Open settings →**). This is exactly the job framing the founder is asking
for. **It already exists.**

It is collapsed into a 32×32 pill at **(1354, 803)** — the bottom-right corner,
below the canvas, beside the zoom readout.

### Three defects that keep it from working

**J1 — progress is keyed to the browser, not the site.**
`STORAGE_KEYS.ONBOARDING_PROGRESS` is `"buildrick-onboarding-progress"`, a
single global localStorage key; `useOnboardingOrchestrator.ts` reads and writes
it with no site or project scope. Two consequences, both wrong:

- Finish the seven steps on one site, and **every new site** you create says
  *7 of 7 complete* — the checklist is silent exactly where a blank site needs
  it most.
- Open a finished site in another browser and it says *0 of 7* — you are told
  to start work you did months ago.

**J2 — two signals in one tick lose a step.** `completeStep` reads
`stepsRef.current`, and `stepsRef.current = steps` is assigned **during render**
(`useOnboardingOrchestrator.ts:131-132`). Two completions before React
re-renders both read the pre-render value, and the second `setSteps` overwrites
the first.

Measured live: inserting one Heading emits `element:inserted` **and**
`style:changed` (four times). Two steps qualify — `add-element` and
`change-style`. The counter went **0 / 7 → 1 / 7**. One step, silently, is gone.

**J3 — the guidance is where nobody looks.** One sentence in the inspector, and
seven jobs behind a corner pill, against a rail of six nouns (Insert, Layers,
Pages, Media, Content, Brand). Nothing on the screen answers *"what now?"*
except a prompt to click something first.

---

## CEO REVIEW — 2026-08-27 (autoplan, dual voices)

Both voices rejected this plan's central claim. Recorded before the rewrite,
because the claim was mine and it was wrong.

### The premise that failed

> *"There is a seven-step job model, and it is good… This is exactly the job
> framing the founder is asking for. It already exists."*

Codex: *"That is a leap, not a finding."* Claude: *"the one claim in the
document with no evidence behind it, and the entire proposal rests on it."*

Both reached the same reason independently: **the seven steps are not jobs.**
"Add an element", "Edit text", "Style an element" describe how the editor
works, not what a person is trying to accomplish — and all three sit inside a
single stage of the product's own lifecycle. It is the six-noun rail's mistake
in sentence form.

### CEO DUAL VOICES — CONSENSUS

| # | Dimension | Claude | Codex | Consensus |
|---|---|---|---|---|
| 1 | Premises valid? | no — P1 unfalsifiable | no — a leap | **CONFIRMED wrong** |
| 2 | Right problem to solve? | no — instrument has a terminal state, the problem does not | no — onboarding patch, not re-organization | **CONFIRMED wrong** |
| 3 | Scope calibration correct? | no — J3 collides with approved T6 + 7 boards | no — smallest available move | **CONFIRMED wrong** |
| 4 | Alternatives explored? | no — dismissed on sunk copy | no — dismissed as side ideas | **CONFIRMED wrong** |
| 5 | Competitive risks covered? | no — none of the four ever shows a blank editor | no — leaders answer at entry, by role, by context | **CONFIRMED wrong** |
| 6 | 6-month trajectory sound? | no — 60% case is the founder says the same sentence again | no — prominence built on the wrong abstraction | **CONFIRMED wrong** |

0 of 6 confirmed sound. No disagreements between the voices — they agree with
each other and against the plan.

### FOUNDER DECISIONS — 2026-08-27 (binding)

**D1 — which "client"? → BOTH, for different reasons.** The builder does not
get direction inside the editor, *and* the customer does not understand the
review screen. Two arcs, not one. This addendum owns the builder half; the
customer half is scoped separately below.

**D2 — what organises the editor? → the product's own lifecycle.**
`PRODUCT-OVERVIEW.md §2`, already written and already the stated organizing
principle of the whole product:

```
Create a site  →  Edit (drag / template / AI)  →  Send for client review
      ↑                                                    │
      ▼                                                    ▼
   Analytics  ←  Live on a domain  ←  Publish  ←  Client approves
```

The editor's job frame is **where this site is in that loop, and what the next
move is** — derived from the site's real state, not from a stored tutorial
position. It is persistent by construction (still true in month six), it is
role-shaped (an invited editor's next move is not the owner's), and its pieces
are already scattered across the topbar: the `In review` pill, `Publish`,
`Re-send`, the review bar's `0 open · Next › · Compare`.

### What the reviews found that this plan had not

Ordered by how much they change the work, not by severity label.

**The checklist is partly a CAUSE of the complaint.** Steps 1 and 2 —
*Name your project*, *Choose a starting point* — are both structurally complete
before the editor opens. `packages/shared/schemas/sites.ts:4` requires
`name: z.string().min(2)`; `/onboarding/site` hard-blocks on it; even Skip
passes `"My Site"`. And `/onboarding/path/page.tsx:75` asks *"How do you want
to start?"* with AI / Template / Blank — step 2, verbatim, already persisted as
`Site.creationMethod`. The orchestrator seeds from a hard-coded all-false
constant and queries none of it. **On first run the checklist tells the user to
do the two things they just did.**

**Completion is self-reported, not earned.** `OnboardingMount.tsx:113-115`
marks a step done when its CTA is pressed — so *"Publish your site"* ticks when
the Publish **panel opens**. A user who has never published can reach 7 of 7.

**J2's acceptance criterion was wrong.** The four `style:changed` emissions
measured on an insert are the new element's **default** styles, not the user
styling anything. Crediting `change-style` there ticks a step the user never
did. The correct criterion is the opposite of what was written: one insert
credits exactly **one** step.

**Three uncoordinated Getting Started checklists already ship.** The editor's
(localStorage, per-browser, no role, bottom-right); `DashboardChecklist`
(server-backed, per-**user**, role-aware, *also* fixed bottom-right, with
`INVITED_CHECKLIST_ITEMS` for invited members); and
`/dashboard/getting-started` (five steps, derived from real state). Six of the
dashboard's seven items are **editor** jobs, and the editor reports none of
them. Scoping the editor's list per-site while the dashboard stays per-user
makes the two actively disagree.

**J3 would reverse three shipped incident fixes.** `b3cd0be5` collapse-on-select
(QA ISSUE-009); `27f38be1` *"calm first load — onboarding starts as a pill"*,
whose comment records the reason (*"multiple onboarding surfaces on first
paint"*); and the dashboard learned it independently — expanded-by-default
*"made Create a site / Invite teammate / Browse templates unclickable for every
new user."* It also collides with the approved arc: ledger row **R2** lists the
pill as a defect and **T6's stated job is to answer "does the pill survive at
all?"**, while seven `S1.4` boards draw the current behaviour.

**`replayAll` has zero callers.** Dismissal writes `ONBOARDING_PHASE = "done"`
globally, permanently, for every site in that browser. Recovery means clearing
localStorage. The escape hatch was built and never given a door — the same
pattern this repo has recorded before.

**J1 named one of two global keys.** `ONBOARDING_PHASE` is the second, and it
is the one that unmounts the surface. Scoping progress per-site while phase
stays global yields a per-site counter a global switch can hide.

**Part 1's method was too narrow.** Filtering `status == "design-ahead"` cannot
see a board that is `status: active` with `authority: open:…`. There are **34**
such active-but-blocked boards. One of them, `65:2`, is a rail coach mark —
*"Everything you build lives behind these six"* — which answers the founder's
question directly and is **not built**.

**The rail is six; the panel registry is thirteen.** Seven panels have no rail
door. That is the founder's complaint in structural form, and the checklist's
CTA is currently the most discoverable door to Templates in the whole editor —
so promoting the checklist is a way of *not* fixing that.

**The blank path throws away the user's own choice.** `onboarding/blank/page.tsx:53-55`
admits it: *"The starting-page / layout-starter picks are captured for the
editor to honor later (createSite makes an empty site today)."* None of
Webflow, Framer, Wix or Squarespace ever shows a blank editor — the starting
content **is** the job frame.

**`IssuesPanel` is a job list that is already true in month six.** Shipped,
boarded, topbar door, severity filters, jump-to-element, and it already gates
publish. It is empty only because its producers were never written.

---

## What this addendum proposes — rewritten after the CEO review

The founder chose the lifecycle frame (D2) and both clients (D1). That settles
what this is, and it is not "promote the checklist".

### A. The frame — where this site is, and what the next move is

The editor states the site's position in the product's own loop and offers the
one next move. Derived from real state — page count, `Site.creationMethod`,
review status, publish status, role — never from a stored tutorial position.

| Site state | What the editor says the next move is |
|---|---|
| created, no content | start from a template, AI, or a section — **never a blank canvas** |
| has content, never reviewed | send for client review |
| review open | *N open comments · next* — the review bar already carries this |
| approved, unpublished | publish |
| published, edited since | republish, or compare against what is live |
| live | analytics |

Every one of those already has a surface. None of them has a frame. The work is
the frame, not new surfaces.

**Why this survives month three, and the checklist does not:** it has no
terminal state. A site that is live and edited again is back at "republish".
The checklist ends with *"Go build something great"* and unmounts forever.

### B. Stop the checklist lying — before deciding whether it survives at all

These are defects on their own terms, and they hold whatever A turns into.
They are cheap and none of them touches placement.

| | Defect | Fix |
|---|---|---|
| B1 | Steps 1-2 are already done before the editor opens | seed from server state (`Site.name`, `Site.creationMethod`), or delete both steps |
| B2 | A CTA press marks the step done — *"Publish your site"* ticks when the panel opens | complete on the outcome event, not the door |
| B3 | `change-style` would credit an insert's default styles | complete only on a style commit from an inspector control with a live selection. One insert credits exactly **one** step |
| B4 | Two completions in one tick lose one | functional `setSteps` updates; ref written on commit, not during render |
| B5 | `ONBOARDING_PROGRESS` **and** `ONBOARDING_PHASE` are both global | scope both to the site, same commit |
| B6 | `replayAll` has zero callers; dismissal is permanent and global | give it a door (Site menu → "Getting started") in the same commit as B5 |

### C. Placement is not this plan's to decide

J3 as written is withdrawn. The approved arc's **T6** already owns the question
*"does the onboarding pill survive at all?"*, ledger row **R2** lists it as a
defect, and seven `S1.4` boards draw its current behaviour. Promoting it here
would reverse three shipped incident fixes and guarantee family 12 re-implements
the corner from the board.

**Route:** A's frame is proposed to family 1 (Shell states + Shell + Canvas, 25
boards) as its job-framing layer. T6 answers the pill. Neither decision is made
in this file.

### D. The customer half (founder D1: both)

Separate arc, scoped here so it is not lost: the customer opens
`/review/<token>` — *"the only page in the product built for someone who will
never have an account"* — and, per the founder, does not understand it either.
That surface has its own boards (`Review panel` 13, `S5 flows` 23) and its own
walk. **Not started; named so it is not forgotten.**

### E. Two things worth more than everything above, neither of which was in the plan

**E1 — never open a blank editor.** `onboarding/blank/page.tsx:53-55` records
that the layout-starter the user picked one screen earlier is discarded.
Honouring it is a smaller change than B1-B6 combined and it removes the blank
canvas that makes "what do I do" a reasonable question in the first place.

**E2 — give `IssuesPanel` real producers.** It is shipped, boarded, has a
topbar door, and already gates publish. Broken links and missing alt text were
named in its own header as the producers that would land and never did. A true
issue list is a job list that never expires.

### F. Part 1 is restated, not deleted

The narrow true claim: **30 boards have no code.** The sentence *"nothing in the
shipped editor is undrawn"* is withdrawn — `boards.json` enumerates the Figma
page and cannot support it, and its own `_note` records the counter-example
(the Media full-page library, where code was ahead of Figma).

Re-running the inventory over `authority` rather than `status` surfaces **34**
active-but-blocked boards, including `65:2` — a rail coach mark reading
*"Everything you build lives behind these six"* — which answers the founder's
question directly and is not built.

---

## DESIGN REVIEW — 2026-08-27 `[single-reviewer]`

Both outside voices failed on this phase: Codex timed out at 600s, and the
design subagent died on an API timeout mid-read. Per the degradation matrix
this is single-reviewer mode, and it is tagged rather than presented as a
dual-voice result.

### The frame is not a new surface — it already ships, scoped to one stage

`ReviewBar.tsx` is a 48px tinted strip under the topbar, `--bk-accent-tint`,
full width, present **only while a review round is open**. Its own header states
the principle this plan needs:

> *"The topbar pill says a review EXISTS; this bar is what you work through
> while it does, which is why the board gives it its own row rather than more
> chips in the topbar."*

That is the lifecycle frame, already designed, already boarded (`200:213`,
Shell state 8), already built — and stopped at one of seven stages. The work is
to let it carry the other six, not to invent a surface.

This also answers "where does it live in a full topbar": nowhere. It does not
go in the topbar. The topbar keeps saying what *exists*; the band says what you
*do about it*.

DESIGN.md binds three things here and the band already satisfies all three:
56px topbar with *"all other chrome heights flow from this rhythm"* (the band is
48px); the single accent `#1A56DB` (the band tints with `--bk-accent-tint`, no
second hue); and anti-slop rule 12, *"No per-row action strips"* — a band is not
a per-row strip.

### What it says, per state — actual copy, not a description of copy

| Site state | Band | Action |
|---|---|---|
| created, no content | *This site is empty.* | `Browse templates` · `Draft with AI` |
| has content, never reviewed | *Ready to show your client?* | `Send for review` |
| review open, N comments | *N open* + the current comment | `Next ›` · `Compare` · `Re-send` — **today's bar, unchanged** |
| review open, 0 comments | *Sent 2 days ago. No comments yet.* | `Re-send` · `Revoke link` |
| changes requested | *Your client asked for changes — N to address.* | `Next ›` · `Compare` |
| approved, not published | *Approved 3 days ago. Not published yet.* | `Publish` |
| published, edited since | *Live, with unpublished changes.* | `Compare with live` · `Republish` |
| live, unchanged | — **the band is not there** | — |

That last row is the discipline that keeps this from becoming a fourth nag:
**when there is no next move, there is no band.** It is state, not advice. It
carries no progress counter, it is not dismissible, and it does not stack with
the onboarding pill — placement of that pill is T6's call, not this plan's.

### States beyond the happy path

| State | Behaviour |
|---|---|
| loading | the band does not render until site state is known. No skeleton flash — DESIGN.md keeps motion minimal, and a band that appears then changes its sentence is worse than one that appears once |
| offline | last known state holds; the action disables **with its reason**, the way the topbar already does (*"Can't publish while offline"*). A disabled control without a reason is a bug, not a state — the approved arc's own state matrix says so |
| permission-denied | never a dead end. An invited editor who cannot publish is not shown a disabled `Publish`; they are shown the move that is theirs |
| stale approval | *Approved, but the site changed since.* → `Compare with approved`. This state already exists — the Review panel ships that exact control |
| multi-page, one page edited | the band is **site**-scoped, not page-scoped. It says the site has unpublished changes; `Compare` is what resolves which pages |
| review round superseded | the band follows `reviews.currentRound`, which already supersedes on a new round — no second source of truth |

### What an invited editor sees

Role `EDITOR` on someone else's site, per `client-detail-view.tsx` — *"They'll
join as an Editor on {clientName}'s {siteCount} sites and nothing else — which
includes publishing them."* Whether that seat can publish is the founder's call
and is not settled here; the band's rule is the same either way: **it names the
move that belongs to the person reading it.** If publishing is not theirs, the
band reads *Your changes are saved. {owner} publishes this site.* and carries no
action, rather than a greyed `Publish` they cannot explain.

The dashboard already models exactly this split — `INVITED_CHECKLIST_ITEMS`
versus `FULL_CHECKLIST_ITEMS`, selected off `memberRole` — and its code comment
records what happened when the split broke: *"every invited member was handed
the owner checklist, 'Publish your site' and all."* The editor repeats that bug
today; `OnboardingMount` is mounted unconditionally and never reads
`useEditorRole()`.

### Why not ambient — in the topbar cluster instead of a band

Ambient is what ships today, and it is the founder's complaint. The topbar
carries `In review`, `Publish`, `Re-send` and an issues chip — four signals,
no sentence between them. A chip says a state exists; it cannot say what to do
about it, which is precisely the gap. The codebase already made this call once,
for review, and wrote down why. Extending that decision is cheaper and more
consistent than reversing it.

### Design findings

**D-1 — the band must not become the eighth thing in the corner. HIGH.** Three
Getting Started checklists ship (F2) and the onboarding pill sits bottom-right.
The band is only defensible because it is absent when idle. If it ever gains a
persistent resting state, it has become a nag and this review's approval does
not carry.

**D-2 — one sentence, one action, no counter. MEDIUM.** The band's failure mode
is growing into a dashboard. Its contract: at most one sentence and at most
three controls, matching what `ReviewBar` ships today.

**D-3 — state derivation is the hard part, not the pixels. HIGH.** Every row in
the copy table above is a query against real state (`Site.creationMethod`, page
count, `reviews.currentRound`, `lastPublishedAt`, dirty-since-publish, role).
The band is a thin renderer over that; if the derivation is wrong the band lies
more visibly than the checklist ever did, because it sits at the top of the
screen. Land the derivation with tests before the band renders anything.
