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

## DESIGN REVIEW — 2026-08-27

**Revised.** The section below was written as `[single-reviewer]` after both
outside voices failed. The design subagent then finished on a retry and
**overturned its central proposal**. The band answer is superseded; what it got
right is kept, and the correction is recorded rather than quietly swapped.

### SUPERSEDED — "generalise ReviewBar into a seven-state lifecycle band"

Wrong on the arithmetic and wrong on the evidence.

**The vertical budget kills it.** `2026-07-18-editor-shell-wireframes.md` §1:
900 − 56 topbar − 32 footer − 36 page tabs = **776** middle band, and the
tightest case the doc contemplates is **736**. A permanent 44–48px strip makes
~730 the everyday number, forever, on the axis zoom-to-fit already fights. You
do not spend canvas permanently to say something true five minutes a week.

**And the thing it proposed to build is already specified, and already has a
slot.** `2026-07-18-editor-shell-wireframes.md` §2 draws the topbar as
`‹Exit BellaCucina ●Saved2m ◷Review 🔔 [ Send for review ] ⋯` and says:

> *"The CTA is **state-dependent**: `[ Send for review ]` before a review,
> `[ Publish ]` once approved, **disabled with a 'needs approval' tooltip**
> while `pending`/`changes-requested`. It is the only filled cobalt button in
> the shell chrome."*

That is the lifecycle frame. Written 2026-07-18. Not built.

### THE ANSWER — the topbar's one primary button becomes the next move

Three slots, two of which already exist. Verified in the shipped code:

**Slot A — the CTA.** `Topbar.tsx` already takes `action` and `publish`.
`StudioHeader.tsx:663` passes `action={undefined}` — and there is exactly **one**
`<Topbar>` render, so the slot is empty in every mode, not just view mode. The
`publish` state is derived at `:503-508` from `publishEnabled → isViewer →
offline` and **never reads `reviewStatus`**, which is sitting in state four
lines above it. Zero new chrome; one derivation feeding a slot that exists.

**Slot B — one `● Live · domain` chip**, 24h, between `SaveStatus` and
`ReviewBadge`. The editor currently **cannot say the site is live**:
`publishedUrl` is hydrated at mount and spent on a single `⋯` menu row. Two of
the founder's seven states are invisible without it.

**Slot C — ReviewBar stays conditional**, and carries **three** states, not
seven: review open, changes requested, and stale approval. Never a "welcome"
strip, never a "you're live" strip — those are A and B's job, and a strip there
is the nag.

### Two findings that are worth more than the frame

**The product's stated wedge has no mouse door.** On a site never sent for
review, the review pill renders `null` for `state: "none"`, Review has no `zone`
so it has no rail button, and the only way in is ⌘K → "Open Review panel".
*Send for client review* — the differentiator `PRODUCT-OVERVIEW §4` is built
around — is keyboard-only in exactly the state where it is the next move.
Slot A fixes this as a side effect.

**An invited editor is handed a Publish the server will refuse.**
`publish-approval.ts:34` — `APPROVAL_EXEMPT_ROLES = new Set(["OWNER"])`, and the
file's own header calls gating ADMIN *"the whole point of the setting"*. The
chrome knows one role: `isViewer = useEditorRole() === "VIEWER"`. Everyone else
falls through to `publish: "ready"`. `StudioHeader`'s own file header already
claims the opposite is shipped — *"an invited editor sends for review instead of
publishing."* It is not.

**And the copy for all of this is already written and reviewed.**
`packages/shared/schemas/publish.ts:90-99` carries four lifecycle sentences —
*"This site has not been sent for review yet. Send it for review to publish."*
and three siblings — which `usePublishJob.ts:69-79` uses **only as a
post-failure classifier**. The whole job is moving them from after the press to
before it.

**Blocking gap:** `editsRequireApproval` never reaches the client — zero reads
across `packages/editor/src` and `server/trpc`. Until one boolean rides along on
`reviews.status`, Slot A can only guess, and a guessing frame is a lying frame.

---

### What the superseded band section got right, and is kept



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

---

## ENG REVIEW — 2026-08-27 `[subagent-only]`

Codex was not re-run for this phase after its design-phase timeout; this is the
Claude eng subagent, tagged accordingly.

### The shape of the finding: the data arrives and the mapper drops it

Six of the seven states assemble from reads the editor **already makes**. Two
inputs are on the wire and thrown away by their own mappers:

| Input | Where it is dropped |
|---|---|
| `Site.creationMethod` | `getSite` has no `select`, so every scalar returns. `BuildrikSyncProvider.loadProject:293-332` maps `name` / `domain` / `projectSettings` / `projectStyles` / `dsSchemaVersion` / `lastEditedAt` and never reads it |
| `Site.lastPublishedAt` | `PublishService.fetchSitePublishState:133-144` narrows the cast to `{status, publishedUrl}`, dropping `lastPublishedAt`, `lastEditedAt`, `creationMethod` and `pages` |

Both are cast/mapping changes. **Zero server work.**

### Three real bugs the plan did not know about

**E-1 — `sites.myRole` returns the wrong role for site-scoped members. HIGH.**
It does a bare `workspaceMember.findFirst` and returns `member.role`
(`server/trpc/routers/sites.ts:202-217`). Every *enforcement* path resolves a
per-site override instead: `const effectiveRole = row?.roleOverride ?? member.role`
(`permission.service.ts:103-104`). So the chrome and the server disagree about
who someone is. A band whose whole contract is *"name the move that belongs to
the person reading it"* is the surface that gets this wrong first. One-line
server fix, and it **is** server work.

**E-2 — `agency_layer` is default-off and gates four of the seven states.**
`isFeatureEnabled` returns `row?.enabled ?? false` — *"default-off, ships dark"*.
With it off, `reviews.status` returns `{state:"none"}`, which is
**indistinguishable from "has content, never reviewed"**, and the flag state is
never sent to the client. So the band would offer *"Ready to show your client? →
Send for review"* as a door into a mutation that hard-fails `requireAgencyLayer`.
The flag has to reach the editor, or the band lies in every workspace that does
not have it.

**E-3 — "edited since publish" does not exist, and the nearest thing resets on
reload. CRITICAL for D-3.** `isDirty` is dirty-since-**save** and lives about a
second (`AUTOSAVE_DEBOUNCE` is 1000ms). `usePublishSnapshot:150-166` counts
history entries after the last deploy — but `HistoryManager.clear()` is
`this.undoStack = []` with no persistence, and `importProject` runs on every
load, so **on a fresh tab the count is 0**. Publish, edit, close the tab, reopen
tomorrow: the band says *"Live"* over a site with real unpublished changes. That
is D-3's failure mode, at the top of the screen.

The durable signal is already in the schema and nothing computes it:
`Site.lastEditedAt` (written on every `saveProjectData`) vs `Site.lastPublishedAt`
(written by the publish worker). And the codebase already ships this exact
comparator for a different pair — `isApprovalStale` (`publish-approval.ts:58-64`)
is `editedAt.getTime() > approvedAt.getTime()`, and its result reaches the editor
as `reviewStatus.state === "approved-edited-since"`. The publish variant is the
same three lines against a different column.

Caveat to carry: `lastEditedAt` is bumped by non-content writes too —
`renameSite`, duplicate — so client-side it means "any write", not "content
changed".

### B4 — confirmed, unconditional, and the fix has a second half

Confirmed statically and it does **not** depend on React batching: no render can
interleave inside one synchronous JS turn, and `EventEmitter.emit` calls handlers
inline, so the ref is stale by construction. The damage is wider than the
counter — `activeStepId`, the achievement payload and `isLastStep` all derive
from the stale value.

The fix, in this repo's own recorded idiom
(`feedback_setter_closure_stale_state`, `feedback_persistall_stale_state`):
delete the render-time assignment, make the ref the authoritative working copy
written at commit time inside the handler, then `setSteps`, then persist.

**And `replayAll` must write `stepsRef.current` in the same commit.** It does not
today, and only self-heals *because of* the render-time assignment being removed
— miss it and one stale-ref bug is traded for another. That is this repo's
`grep the whole file after a decision changes` pattern.

**Scoping note that changes B4's test.** Its headline example (an insert
emitting `element:inserted` + `style:changed`) **disappears once B3 lands**,
because B3 stops crediting `change-style` on default styles. B4 is still real —
any two outcome events in one turn collide, and B2 adds more — but the
regression test must construct the collision deliberately rather than lean on
the insert.

### Why the existing suites never caught it

`useOnboardingOrchestrator.test.ts` puts **every `completeStep` in its own
`act()`**, which flushes a render between calls — structurally incapable of
seeing B4. `OnboardingMount.signals.test.tsx` mocks the orchestrator entirely,
so the real hook never runs; it cannot see B2, B4 or B5 either.

### Test plan

Mirror the precedent already in the tree — `publish-approval.ts`, *"Pure
decision function (no DB) so it is trivially unit-testable"*, with its own
table-test.

1. **Pure `deriveLifecycleState(input) → {state, sentence, actions} | null`** —
   a plain record in, no React, no fetches. Table-test the seven rows, the four
   off-happy-path rows, and the eighth load-bearing row: **returns `null` when
   there is no next move**. That row is design finding D-1; without it the band
   is a nag.
2. **Thin `useLifecycleState()`** assembling the record from existing services,
   tested the way `ReviewBar.test.tsx` already is.
3. **Rendering test asserting D-2 mechanically** — ≤1 sentence, ≤3 controls, no
   counter, and every disabled action carries its reason.

Two harness traps this repo has already paid for, both live here:

- **The hollow `page.root` trap.** `PageData.root` carries no children for any
  page that is not open (`Composer.ts:588`), which already shipped broken in
  React export and Duplicate page. A naive
  `pages.every(p => p.root.children.length === 0)` calls a multi-page site
  empty. The emptiness fixture must make the page-map snapshot and the element
  registry **disagree**, or the test proves nothing.
- **A green suite proves nothing about a flag-gated producer.** With
  `agency_layer` off, four states never occur. Test the flag-off shape
  explicitly.

### ENG DUAL VOICES — CONSENSUS

| # | Dimension | Claude | Codex | Consensus |
|---|---|---|---|---|
| 1 | Architecture sound? | yes, with E-1/E-2 fixed first | `[codex-unavailable]` | subagent-only |
| 2 | Test coverage sufficient? | no — existing suites structurally cannot see B4 | `[codex-unavailable]` | subagent-only |
| 3 | Performance risks addressed? | yes — every input is an existing read | `[codex-unavailable]` | subagent-only |
| 4 | Security threats covered? | **no — E-1 is a role-disagreement between chrome and server** | `[codex-unavailable]` | subagent-only |
| 5 | Error paths handled? | no — E-2 flag-off and E-3 fresh-tab both render a lie | `[codex-unavailable]` | subagent-only |
| 6 | Deployment risk manageable? | yes — the band is absent until derivation lands | `[codex-unavailable]` | subagent-only |

Single-voice phase. Two of six are hard blockers on the band rendering anything.

---

## Landed — 2026-08-27

| # | What | Commit | Verified |
|---|---|---|---|
| Blocker 1 | `sites.myRole` returns the EFFECTIVE role (site override, not workspace role). `getEffectiveSiteRole` extracted; the router stopped reading Prisma directly. | earlier | 96 `checkSiteRole` consumers unchanged; suites green |
| Blocker 2 | `reviewsEnabled` + `editsRequireApproval` reach the client. Three-valued: `null` = could not ask. | `474c0f17` | service smoke returns both |
| Blocker 3 | `hasUnpublishedChanges` / `lastPublishedAt` — the only durable "changed since live" signal. Zero server work; `sites.get` already returned the columns. | `31f6180e` | 13 tests |
| Slot A | `deriveLifecycleState` — the site's ONE next move, as a table with the table as its test. Every `kind` routes to a door the shell already owned. | `6b4b293a` | 23 table tests; live at 1440×900 on the fixture row |
| Slot B | `● Live · domain` chip. Load-bearing: with no next move the CTA is withheld, so this carries "your site is live". | `6b4b293a` | live (absent on a DRAFT site, which is correct) |
| B1/B2 | Two rows finished before the editor opened are seeded from the loaded project. | `0ff5c756` | live: opens at 2 of 7 |
| B3 | Every row completes on an outcome. `SITE_PUBLISHED` added because publishing never spoke to the bus. | `0ff5c756` | live: "Open Build panel" credits nothing |
| B4 | `stepsRef` written at commit time — two completions in one tick both survive. | earlier | 2 regression tests |
| B5 | An inserted element's default styles no longer credit "Style an element". | `0ff5c756` | live: one drag credits `add-element` only; Font size credits `change-style` |
| B6 | `replayAll` has a door — "Getting started" in ⋯. It had **no caller anywhere in the product**. | `0ff5c756` | — |

### Two bugs the work found in itself

- **"Publish anyway" on a button nobody could press.** The label read the review
  reason and the blocked-ness read the environment, so offline + site errors
  produced an invitation with a refusal in its tooltip.
- **A guard that only worked under fake timers.** The style/insert grace window
  compared the insert against the timer's own delay at fire time — a quantity
  always ≥ the window. Green in unit tests, credited the row on every real drag.
  Fixed by keying the decision to the style event's own timestamp. **Only the
  live walk could show this**; the unit suite was green over it.

### Not verified live, and why

The six review-dependent CTA rows (`pending`, `opened-not-acted`,
`changes-requested`, `approved`, `approved-edited-since`, and reviews-off) are
covered by the table tests and by a direct smoke of `getReviewStatusForSite`.
They were NOT walked in the running app:

1. The dev server (`next dev --turbopack`, up 17h) serves **stale route code** —
   the service returns the new fields when called directly, the HTTP route does
   not. Touching the file did not invalidate it. Founder declined a restart.
2. A batch-response intercept delivered the patched payload to the page (proved
   by wrapping `window.fetch`) and the review pill still did not move — so the
   harness could not drive review state either. Pre-existing pill code did not
   respond, which is where the intercept stopped being evidence about the change.

That staleness is also what surfaced the `undefined`-vs-`null` bug below, so it
was not wasted.

### `undefined` is not `null`

A server that predates these fields sends neither, and `undefined` failed a
`=== null` guard and fell through to "reviews are off". The two now branch
apart deliberately: `null` is our own sentinel and holds an in-flight control
for a beat; `undefined` is a standing condition (an old deploy, a rollout
mid-flight) and falls through to publish, where `publish-approval.ts` is the
real gate. Blocking every publish for the length of a rollout is the worse
failure.

---

## The unverified rows are verified — 2026-08-27, later

The commit for Slot A recorded six review-dependent CTA rows as covered by
table tests and a service smoke but **not walked in the running app**, for two
stated reasons: a dev server serving stale route code, and a batch-response
intercept that could not drive review state.

The dev server restarted at 19:36 and now serves current route code —
`reviews.status` returns `reviewsEnabled` and `editsRequireApproval` over HTTP,
which it did not before. That removed both obstacles at once: with a real
server there is nothing to intercept.

Walked by moving the fixture's own review round through each state in the
database and reading the topbar CTA at 1440×900. No intercepts, no stubs.

| Review state | CTA | Disabled | Line |
|---|---|---|---|
| approval OFF, pending | `Publish` | no | "Not live yet." |
| none (round revoked) | **`Send for review`** | no | "This workspace publishes after a client approves." |
| pending | `Publish` | **yes** | tooltip: "Waiting on your client's approval" |
| changes-requested | **`Open feedback`** | no | "Your client asked for changes." |
| approved | `Publish` | no | "Approved — ready to go live." |
| approved-edited-since | `Publish` | no | "Edited since approval — your client hasn't seen these changes." |

Every row matches `deriveLifecycleState`'s table, including the deviation from
wireframes §2 that was argued for in the commit: `changes-requested` opens the
feedback instead of greying out Publish.

The round and the workspace policy were restored afterwards and re-read to
confirm it: `status: PENDING`, `resolvedAt: null`, `revokedAt: null`,
`editsRequireApproval: false` — the values captured before the walk.

**`opened-not-acted` is still not walked.** It needs a reviewer-opened signal
that does not live on the round row, so it cannot be staged the way the other
six were. It remains covered by the table tests only.
