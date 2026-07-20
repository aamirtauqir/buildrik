# Figma full-fidelity plan — promoting 210 state cards to real frames

> **Written 2026-07-21, after auditing the live Figma file rather than the checklist.**
>
> `2026-07-20-figma-build-checklist.md` reports **309/309**. The file genuinely
> contains 309 named things. But ~210 of them are **300×182 annotation cards**,
> not screens — a state name, one line of intent, two mini rows, and a prose note.
>
> That is the same category error the checklist has already made three times and
> documented itself: *a kit counted as its instances, entry rows counted as
> destinations, a widths-and-states matrix counted as named modals.* This is the
> fourth: **cards counted as states.**
>
> Founder decision 2026-07-21: **full fidelity — all 210 become real frames at
> their surface's true size.** Card fidelity was offered and declined.

---

## 0. What the live file actually holds

Queried through the Plugin API on 2026-07-21, not read from a checklist.

| Page | Top-level nodes | Verdict |
|---|---|---|
| 📕 Foundations | 1 | ✅ real — 53 variables, 2 package modes, 11 text styles, live specimens |
| 🧩 Components | 17 | ✅ real — 15 variant sets + 44 components, Lucide geometry, Gate A proof |
| 🖥️ Editor | 40 | mixed — ~20 real hi-fi screens, 6 state boards (cards), 4 empty shells |
| 🗔 Site | 7 | mixed — 2 shells + 2 real boards + 2 state boards (cards) |
| 🏢 Portfolio | 5 | mixed — 3 real + 2 state boards (cards) |
| 👤 Client review | 4 | mixed — 2 real screens + 2 card boards |
| 🗃️ Archive | 0 | empty |

**The library is sound.** Nothing below asks for it to be rebuilt. This plan is
assembly on top of components that already exist and already passed Gate A and
Gate B.

**Real, and staying real** — `S1 · Editor — ASSEMBLED` (198 nodes: rail, layers
tree, canvas with content, populated inspector, footer), `S1-stress`,
`S1-keyboard`, shell states 1 · 4 · 7 · 9 · 10 · 11 · 12, the 7 inspector
profiles, Media drill-ins, modal instances, `S5.5 · A0`, `S5.5 · A`, both
1440 shells for Site and Portfolio, Brand push step 3.

---

## 1. Scope — 210 states, grouped by the geometry they live in

Grouping by frame size, not by document section, because **the size is what
determines the work**. Everything in one row is the same build.

| Surface | States | Frame | Source board today |
|---|---|---|---|
| Insert · Pages · Layers | 22 | 320×776 | `Rail panels — Insert · Pages · Layers states` |
| Media · Content · Brand | 25 | 320×776 | `Rail panels — Media · Content · Brand states` |
| **Review panel** | 11 | 320×776 | `Review panel · Inspector column · remaining sets` |
| Versions · Issues · Notifications | 17 | 360×776 | `Floating panels — all 31 states` |
| AI panel | 11 | 360×776 | `AI — all 11 states` |
| Command palette | 6 | 640w | `Floating panels — all 31 states` |
| Compare | 8 | 1080×776 | `Floating panels — all 31 states` |
| Inspector column | 10 | 300×776 | `Review panel · Inspector column · remaining sets` |
| Modal · Rollback · Orphan comments | 12 | 440 / 560 / 580 | `Review panel · … remaining sets` |
| Site — Integrations · Shape-1 · Webhooks · Export | 23 | 1440×900 | `Site — 23 states` |
| Site — Domains · Export-empty · Forms | 8 | 1440×900 | `Domains 6 · Export empty · Forms rebuilt` |
| Portfolio — Sites · Handover · Shared library | 16 | 1440×900 | `Portfolio — 16 states` |
| Portfolio — Brand push | 10 | 560 modal | `BrandPush — all 10 states` |
| **S5.5 client page** | 13 | 1280×900 | `S5.5 — all 13 client-page states` |
| **J5 designer-side** S5.1 · S5.2 · S5.3 · S5.6 | 18 | 1440×900 | `J5 designer-side states` |
| **Total** | **210** | | |

---

## 2. Method — why 210 frames is assembly, not 210 drawings

**Every state is an instance plus cargo.** The components this needs already
exist and are already proven:

```
Drawer frame 320w      3 body layouts   → serves all 58 rail-panel states
Right panel 360w       header/filter/footer → serves 28 (Versions·Issues·Notif·AI)
Modal frame            440 · 560 · 580  → serves 22 (modals + Brand push)
Row                    5 sizes × 4 states = 20 variants → the cargo of everything
Button                 40 variants
Inspector 300 · CONTAINER + 6 profiles  → serves 10 column states
Site / Portfolio shell 720 form · 1000 grid → serves 47 destination states
```

A state that cannot be expressed as an instance plus cargo means the component is
missing a variant. **Add the variant. Never detach** — working-rules §3.4.

### The card prose is not disposable

Each card carries a reasoning line that exists nowhere else:

> *"A deletion has no 'after', so it gets a strip rather than a tint."*
> *"A command you cannot run is still worth seeing — hiding it means the shortcut
> someone memorised silently vanishes."*
> *"Silence here is how a client feels they signed off on something they never saw."*

**Promotion must carry this text into a caption beneath the new frame.** It is the
most valuable content on those boards — it answers *why the state exists*, which
no amount of pixel fidelity conveys. A promotion that deletes it is a net loss.

### Naming

`<Set> · <state>` survives verbatim, so every state stays searchable by the name
it already has. Frame naming per working-rules §3.9:

```
✅  Versions · restoring
    Review panel · detached-group
    S5.5 · post-approval-edited-since
❌  Frame 4212 · panel copy 2
```

---

## 3. Order

**Wedge first.** Not because it is largest — because it is the only part the
company wins on, and Gate C has still never been run.

| Batch | Content | States |
|---|---|---|
| **1** | S5.5 client page + J5 designer-side | 31 |
| **2** | Rail panels — Insert · Pages · Layers · Media · Content · Brand | 47 |
| **3** | Review panel + Inspector column | 21 |
| **4** | Floating — Versions · Issues · Notifications · CmdK · Compare · AI | 53 |
| **5** | Site — 31 destinations states | 31 |
| **6** | Portfolio — Sites · Handover · Shared library · Brand push | 26 |
| **7** | Modals · Rollback · Orphan comments | 12 |

Batch 1 unblocks **Gate C**, which is the only gate from the original execution
plan never run and the one the ship plan calls the highest-value hour in the
project.

---

## 4. Verification — the part that is not optional

This file's own history is the argument. Every one of these actually happened:

- **Four bugs returned `success`** and were visible only in pixels — a tooltip on
  the wrong variant, six icons as solid squares, a fix that mutated nothing while
  looking identical, a badge tint whose opacity was silently dropped.
- **`maxLines` is a silent no-op.** Throws nothing, reports nothing, leaves the
  property `null`. 89 labels relied on it and would have wrapped on the first long
  client name.
- **`resize()` resets sizing modes**, froze four type pills at width 10, and made
  **Gate A pass for the wrong reason** — they were not fitting, they were hiding.
- **A screenshot lied the other way once**: badge tints looked grey and were
  correct. Reading `fills[0]` back settled it after two calls were wasted.

So, per batch, in this order:

```
build  →  screenshot  →  read the nodes back  →  only then next batch
```

**Read the node before believing the pixels, and believe neither alone.**

Specific read-backs that have each caught a real bug:

| Check | Why |
|---|---|
| `explicitVariableModes` up the ancestor chain | a variable renders its FALLBACK while `boundVariables` still reads correct |
| `fills[0]` on any tinted node | `setBoundVariableForPaint` returns a NEW paint; opacity set on the input is dropped |
| pinned height, not `maxLines`, on every user-typed label | `layoutSizingVertical = FIXED` + `resize(w, fontSize * 1.5)` |
| every `createAutoLayout()` wrapper's fill | frames default to WHITE; 176 carried an invisible one |
| widest node vs frame width, `clipsContent = false` | overflow that hides is not overflow that fits |

---

## 5. Cleanup, folded into the batches

- **4 empty shells** — `Shell / 1440 · transient drawer`, `· pinned drawer`,
  `Shell / 1280 · transient drawer`, `· single page (no tabs)`. Six to nine nodes
  each: rail, canvas and inspector are empty geometry. Superseded by
  `S1 · Editor — ASSEMBLED`. **Move to 🗃️ Archive, do not delete** — the
  arithmetic proof of Gate B lives in their auto-layout.
- **The card boards** stay until their states are promoted, then move to Archive
  as a set. They are the index that made this gap findable.
- **The checklist header** — `309/309` is recomputed honestly after each batch,
  from the rows, never retyped by hand. It has drifted from its own rows once
  already (263/267 while claiming 268/269).

---

## 6. What this plan does not touch

Deliberately, and each for a reason:

- **The component library.** Sound, gate-proven, and every state below instances
  it. A state that does not fit is a missing variant, not a rebuild.
- **Foundations.** 53 variables, both package modes pinned on all seven pages.
- **Code.** No code changes in this arc. `2026-07-20-ship-plan.md` owns that,
  and its M1 (`clientEmail` through `submitForReview`) is what makes Gate C
  reachable in the product rather than only in Figma.
- **Behaviour.** Layout may be invented; behaviour may not. A state that answers
  *who may act* or *what happens next* with nothing written behind it is a
  question, not a gap to fill.

---

## 6a. Working notes from batch 1 — read before batch 2

Two traps cost four corrective calls in the first batch. Both will recur on every
remaining surface.

**Every structural container in these frames is auto-layout.** The frame root,
`Branded bar`, `Mode strip`, `Site preview — view only` and `Sticky footer` are
all auto-layout. Anything that *overlays* rather than *flows* — a comment pin, an
inline composer, a scrim, a modal card, a badge, a welcome line — must be set
`layoutPositioning = 'ABSOLUTE'` **after** `appendChild` and **before** assigning
`x`/`y`. Skip it and the node is silently appended to the end of the stack: the
pin landed under the site, the composer stacked below it, and the welcome line
collided with the "Reviewing:" label. Nothing errors. It just goes to the wrong
place and looks deliberate.

**Seed `setBoundVariableForPaint` with the variable's real value, never a black
placeholder.** The site frame's `bg-card` binding read back as
`color: {0,0,0}` with a correct `boundVariables` entry, and rendered pure black.
The identical helper resolved correctly on a sibling in the same call. Passing the
variable's actual value as the base paint makes a failed resolution invisible
instead of catastrophic. This is the same class of bug as the documented
`setBoundVariableForPaint` opacity drop — the returned paint is the only thing
that matters, and what you hand it still leaks through when resolution fails.

**A third lesson, from a false alarm.** A 640px-wide render of a 1280 frame made a
full-frame scrim look like it stopped below the header, and the fix attempt was
already written before the node read-back (`x:0, y:0, 1280×900`, child index above
the bars) proved the scrim was correct all along. The file's own rule held: read
the node first, then judge the pixels — and when they disagree, re-render at full
size before changing anything.

---

## 6b. Progress

| Batch | Surface | States | Status |
|---|---|---|---|
| 1a | **S5.5 client review page** | 13 → **14** (+2 brandColor) | ✅ complete, verified |
| 1b | J5 designer-side — S5.1 · S5.2 · S5.3 · S5.6 | 18 | ✅ complete, verified |
| 2 | Rail panels | 47 → **59** | ✅ complete, verified |
| 3 | Review panel + Inspector column | 21 | ✅ complete, verified |
| 4 | Floating panels | 53 → **42** | ✅ complete, verified |
| 5 | Site | 31 | ✅ complete, verified |
| 6 | Portfolio | 26 | ✅ complete, verified |
| 7 | Modals · Rollback · Orphan comments | 12 | ✅ complete, verified |

**Batch 1a found a 14th state the enumeration had merged.** The specs draw
`request-changes` as the compose modal ("What should Ali fix?"), while the card
board described it as terminal and warm — *"Your notes are with your designer."*
Those are two different moments, and contracts §1.3 confirms the second is real
behaviour: the client's view goes read-only until the designer re-sends. Both are
now drawn: `S5.5 · request-changes` (compose) and `S5.5 · request-changes-sent`
(terminal, read-only, comment mode withdrawn).

This is worth noting beyond the one state — **the card boards and the specs
disagreed, and the disagreement was only visible because promotion forced a
reading of both.** Expect more of these in batches 2–7; each is a decision that
was made once and then recorded in only one of the two places.

Two further gaps closed from card prose that the built frames had dropped: the
approved state now carries its audit-trail line (`Signed as Sara Khan ·
sara@bellacucina.com` — the record the wedge is sold on), and the expired state
now says earlier comments survive expiry, which is the difference between a dead
end and a pause.

The two superseded S5.5 card boards are on 🗃️ Archive, prefixed
`[superseded 2026-07-21]`.

### Codex pass on batch 1a — three of my claims did not survive

An outside review read the four specs against what I built. It confirmed **13 of
13 required S5.5 states are present** — nothing was missed, and the loose-`States:`
grep trap that cost 31 states in a prior arc did not recur. Then it took the
findings apart:

| Claim | Verdict | Action taken |
|---|---|---|
| 14th state `request-changes-sent` | **half wrong** — contracts §1.3 writes the *behaviour* (read-only until re-sent), but the state name and copy were mine, and the wireframe state list does not contain it | renamed to `S5.5 · changes-requested`, the contract's own state-machine name. Spec amendment **pending founder sign-off** — until then it is not counted as a canonical S5.5 state |
| `Signed as Sara Khan · sara@bellacucina.com` on approved | **invented as UI copy** — A0 says name+email attach to the approval record (§1.1), but State D specifies only tick, title, timestamp, publish line, `View site` | left on the frame, flagged as a proposal — founder call below |
| `Your earlier comments are still saved.` on expired | **invented** — `90 days` is written (§1.4); comment survival after expiry is written nowhere | **removed**. Caption now says the question is open rather than answering it |

**And one contradiction I imported rather than authored.** The
`post-approval-edited-since` copy read *"You'll get a new link when they're ready
for you to look again"* — which hardens re-review into the default and contradicts
contracts §1.5, where the approval **stands**, is marked stale, and the designer
may publish past it with an itemised acknowledgement. The wireframe's own copy is
conditional: *"he'll send a new review if he needs sign-off."*

That wrong copy came **verbatim from the card board.** I carried it faithfully,
which is exactly what §2 of this plan tells the next batch to do.

> **Revised instruction for batches 2–7: carry the card prose, then check it
> against contracts — do not carry it as truth.** The cards are a decade of
> reasoning worth keeping and at least one of them contradicts a written decision.
> Faithful transcription is not verification.

Also fixed: `changes-requested` now shows the client's own comment pins read-only.
Contracts §1.3 keeps the client's comments visible in that branch; the frame was
cloned from `landing-viewing` and had none, which would have read as "your notes
vanished when you sent them."

### Founder decisions 2026-07-21 — all three resolved, specs amended

The codex pass raised three calls. All three were decided the same day, and **the
specs were amended rather than the drawings left to disagree with them** — which
is the whole point of asking.

| Decision | Call | Spec amended |
|---|---|---|
| Approved card shows `Signed as Sara Khan · sara@bellacucina.com` | **keep** — the client sees their own signature, not just a pressed button | `j5-signoff-wireframes.md` State D, with the wedge rationale |
| `changes-requested` is canonical | **yes — S5.5 is now 14 states**, main page 10 + A0 4 | `j5-signoff-wireframes.md` S5.5 state list, citing contracts §1.3 |
| `Client.brandColor` variants | **build now, with batch 1b** | — |

On the third: the wireframes' craft note says S5.5 uses the agency's brand colour
when set and falls back to `#406ED6`, with a 4.5:1 contrast floor that sends a
failing brand colour to the header only. Every frame so far is the fallback case.
Two frames are owed — brand-colour passing, and brand-colour failing — and they
are cheap now and expensive after the other 196 states are drawn against the
fallback.

**The state list said 9 while the contract described 10.** That gap sat in the
docs for two days and was invisible until a frame had to be drawn for it. Drawing
is what forced the read.

---

## 6c. Batch 1b — J5 designer-side, 18 states

`S5.1 · 4` send-for-review · `S5.2 · 6` review status · `S5.3 · 5` comments ·
`S5.6 · 3` post-approval guard. All 1440×900 instances of
`S1 · Editor — ASSEMBLED`, all captioned.

**The check-don't-carry rule paid for itself immediately.** Three card claims
failed against the specs before a single frame was drawn:

| Card said | Spec says | Resolution |
|---|---|---|
| `8 changes since` | wireframe S5.6 and S5.5 State E both say **2** | used 2 — the client side was already drawn with 2, so 8 would have had designer and client describing the same moment differently |
| `S5.6 · approved-edited-since` offers "Publish anyway" | contracts §1.5 requires an **itemised acknowledgement** behind it | drew the acknowledgement: each change named with its timestamp, both exits, and "her approval still stands" stated outright. A count is not an acknowledgement. |
| `S5.1 · compose` shows one "What changed" field | `submitForReview(note?, changeSummary?)` takes **both** | drew Message *and* What changed, plus the required email |

**Two coherence bugs the cloned shell carried in** — exactly the trap the checklist
warned about after First-run once showed "In review · 3 open" on a site that did
not exist yet:

- `S5.1 · compose` inherited a live review pill and a disabled Publish, on a screen
  whose entire purpose is that no review exists yet. Reset to no pill + enabled
  **Send for review**.
- `S5.1 · sent` and `S5.1 · error` had *no* pill — but in both the review **has been
  created**; in the error case that is the entire point ("the link still works").
  Both now show the review pill with Publish gated on approval.

**Also built:** the conditional **Review rail item** — the rail's 7th surface,
present only while a review is live, with the 3px accent bar. The base shell had
Layers active while the drawer showed Review, which is not a state the product has.

Five superseded J5 boards and partial sketches moved to 🗃️ Archive.

**Verification note.** `findOne` on a footer matched the tick *inside* the checkbox
rather than the footer label, so a label edit silently landed on the wrong node and
the visible text never changed. Read-back caught it; the screenshot alone read as
"checkbox looks a bit odd". When a container has nested text, target
`children.find(...)`, not `findOne` on the subtree.

### Codex pass on batch 1b — five findings, four were real

State count was clean again: **18 of 18** required states, matching S5.1 · 4,
S5.2 · 6, S5.3 · 5, S5.6 · 3 exactly. The failures were all in what I drew *around*
the states.

| Finding | Verdict | Fix |
|---|---|---|
| Rail Review item placed inline after Brand | **wrong** — cargo-sheets §6.5 says the seventh icon sits *at the bottom, below a divider*, and shell §4.3 locks the base rail to six | moved to the bottom with a divider; base six untouched |
| Resolved comments lose their canvas pin | **invented** — §S5.3 never says this. Contracts §6.4 removes a pin only when a comment is *detached* (its target element deleted) | pin restored, styled resolved. Card prose again, promoted to fact again |
| No 44h review bar anywhere | **real miss** — shell state 8 requires the review-status pill to expand into a full-width 44h bar: open-count · next · compare · resend | built, on all 11 frames where a review is live. Band auto-shrinks 812 → 768; `56 + 44 + 768 + 32 = 900` holds |
| `add another reviewer` missing from S5.1 compose | **real miss** — §S5.1 lists it | added |
| Two fields in S5.1 compose is invented | **codex was wrong, and the doc was the reason** | kept — see below |

**The one where the doc lost.** Codex called the second compose field invented
because no design doc mentions `changeSummary`. It was reading docs only. The
schema has carried both fields all along:

```ts
// packages/shared/schemas/reviews.ts:14-17
note:          z.string().max(500).optional(),
changeSummary: z.string().max(500).optional(),   // "supplied by the editor when
                                                 //  sending for review"
```

So the drawing was right and `j5-signoff-wireframes.md` §S5.1 was stale. The spec
now carries the schema excerpt and a note saying why, so the field does not get
deleted by the next person who checks the design docs and finds nothing.

**Worth generalising: an outside review that reads only docs will call
code-grounded work invented.** Two of the three "inventions" it found in 1a were
real; this one was an artifact of the evidence it was given. Point it at the schema
directory as well as the specs from batch 2 onward.

---

## 6d. Batch 2 — rail panels, 47 → 59 states

**The batch was undercounted before it started.** The checklist logged 47. Reading
the spec's own `States:` lines gives **59**:

| Panel | Counted | Actual | Why |
|---|---|---|---|
| Insert | 7 | 7 | |
| Pages | 7 | 7 | |
| Layers | 8 | 8 | |
| **Media** | 10 | **14** | `drill-in ×5` was counted as one state |
| Content | 9 | 9 | |
| **Brand** | 6 | **14** | `any of 9 sections` was counted as one state |

A multiplier counted as a single item — the same category error as a kit counted
as its instances and entry rows counted as destinations. **Three of the six panels
were fine; the two heaviest were not**, which is the pattern: the error hides where
the cargo is densest.

All 59 built at 320×812, captioned, zero overflow past 320, zero collisions.

### Two card-board claims that failed against the spec

Carrying prose and *then* checking it caught both:

- **`Media · drill-in`** listed **Image editor** as a sixth drill-in. Cargo-sheets
  §4 puts it under *"Modals, not drill-in (they need width)"*, alongside Optimise
  and Replace-across. The five real destinations are asset detail · icon picker ·
  stock browser · versions · used-in.
- **`Pages · listings`** described CMS-generated dynamic pages. Cargo-sheets §2
  defines Listings as the **SEO table** behind the ⊞ toggle — page · title ·
  description · score. Two different features under one state name.

And four places the card was **better** than the spec, now folded in: the canvas
(not the panel) is Insert's drop target; Pages search shows the folder as a
breadcrumb; quota-warn carries an actionable exit; quota-full says what is *not*
affected.

### A layout bug that would have made the file unusable

The batch was built at coordinates that **overlapped five existing boards** —
modals, inspector profiles, orphan comments, brand sub-screens, media drill-ins.
Batch 1b had **18 such collisions** and I had already verified that batch as
"complete" without noticing, because every check I ran was per-frame: size,
overflow, captions. None of them asked *is anything already here.*

**Collision detection is now part of verification**, not just per-frame checks.
Both batches were relocated to clean space; the page is now 0 collisions.

---

## 6e. Batches 3–7 — what shipped

| Batch | Surface | Planned | Built |
|---|---|---|---|
| 3 | Review panel · Inspector column | 21 | 21 |
| 4 | Versions · Compare · ⌘K · Issues · AI · Notifications | 53 | **42** |
| 5 | Site — Domains · Export · Integrations · Shape 1 · Shape 2 | 31 | 31 |
| 6 | Portfolio — Sites · Brand push · Handover · Shared library | 26 | 26 |
| 7 | Modal kit · Rollback · Orphan comments | 12 | 12 |

**Batch 4 was over-counted by me, not under-counted by the checklist.** My own
plan table said 53; the specs' `States:` lines sum to 42 (Versions 7 · Compare 8 ·
⌘K 6 · Issues 5 · AI 11 · Notifications 5). Corrected rather than padded — the
whole point of this arc is that the number follows the spec, not the reverse.

**Final: 226 frames, 226 captions, 0 overflow, 0 collisions** across four pages —
Editor 153 · Site 31 · Portfolio 26 · Client review 16.

### Counts verified externally, 24 of 24

An outside pass grepped the loose `States:` form across the five spec files and
checked every surface count independently. **All 24 match**, including the two
recounts this arc argued for — Media 14 (`drill-in ×5` expanded) and Brand 14
(`any of 9 sections` expanded). Spec-enumerated total across those surfaces is
**184**; the file's 226 is that plus J5 18, S5.5 14, rollback 4, orphan comments
3, two `Client.brandColor` variants, and the reach frame below.

### The reach model is three wide, and only two were drawn

The same pass found `ReachScopeStrip.tsx` — the shipped inspector strip offers
**This item · All like this · Whole site**, a 3-reach model. Both
`inspector-spec` §5.8 and my frame described only the middle one, using
vocabulary (`all items`) that matches neither the code nor the spec.

- `Inspector · reach-all-items` → renamed **`reach-all-like-this`**, matching the
  shipped label, and its note now carries the peer count.
- **`Inspector · reach-whole-site` added** — the third reach, and the only one
  with no count, because "every page" cannot be tallied the way peers can.
  `ReachScopeStrip` routes it to the Styles tab rather than editing in place, so
  the frame documents a hand-off, not an edit.

Same lesson as the `changeSummary` finding in 1b, from the other direction: the
spec was narrower than the code, and only reading both caught it.

### The shell state set was 7 of 12 — now complete

The build checklist claimed "Shell states as variants (12) ✅". The page held
**7** standalone frames (1 · 4 · 7 · 9 · 10 · 11 · 12). The same over-count
pattern as the rest of the arc, found only by listing what exists rather than
reading the tick.

Five states had no frame — built now against shell §4:

- **2 · Returning (default)** — transient drawer overlays (canvas keeps 1080),
  inspector shows nothing-selected. The actual landing state.
- **3 · Element selected** — selection box + label on canvas, floating selection
  toolbar, inspector populated.
- **5 · Drawer closed** — drawer gone, canvas regains 320 (because it was pinned;
  a transient drawer leaves no gap), no rail item active.
- **6 · Comment mode** — pins on canvas, pin cursor, and the load-bearing
  correction drawn explicitly: **rail + inspector stay fully live**, not dimmed.
- **8 · Review active** — the 44h review bar under the topbar; band shrinks
  812→768, `56+44+768+32 = 900`.

**The four dead empty shells my own plan §5 flagged were still on the page** —
`Shell / 1440 · transient/pinned`, `1280 · transient`, `single page` — I had
never archived them. Moved to 🗃️ Archive now (six nodes including the stray
1280-overlay box and its floating caption).

That last box covered the **1280 width** and the pin-auto-release-below-1380
behaviour (working-rules §3.6), but only as an empty labelled shell. Archiving it
would have left §3.6 with zero live coverage, so it was replaced with a real
`Shell · 1280 · pin auto-released (overlay)` frame: canvas measured at **920**,
the drawer floating over it, and the toast the behaviour actually ships with.

**Whole file now: 239 frames, all captioned, 0 overflow, 0 collisions** —
Editor 166 · Site 31 · Portfolio 26 · Client review 16. (166 = the 152 batch
states + 12 shell states + the 1280 overlay + the reach frame added earlier.)

---

## 6f. Component-instancing pass — the honest 80/20

The whole file was built **hand-crafted, 0 component instances** — a real debt
against the working-rule "instance everything, never detach." Verified: 239
frames, 0 instances. Change the Row component and nothing would have updated.

**Panel header retrofitted: 0 → 74 instances.** Every rail panel, review panel
and comment-mode drawer now instances the one `Panel header` component. This was
the single highest-leverage, lowest-risk target: uniformly named, uniform 320×44
structure, ~74 consumers. One change now propagates to all of them. 0 fails, 0
overflow, 0 collisions after.

**Why the pass stopped there, honestly.** Panel header was the only element
hand-built uniformly enough for a safe sweep. The rest are scattered:

- Section headers live under **8+ different names** (`Group ·…` ×21,
  `Table header`, `Day ·…` ×6, `Active/Missing/Export/Import header`,
  `Round header`, `Plan header` ×6) — only 5 were named `Section header`.
- The atoms are hundreds of inline nodes: **333 `control`, 407 `input`,
  225 `row`**, each hand-built with varying structure and content.

Retrofitting those means per-pattern visual matching across 239 verified frames:
high volume, fragile, real breakage risk — for a payoff (component-change
propagation) that only materialises if those components change. For a
design-to-handoff artifact that is a poor trade; for a living design system that
will be maintained in Figma long-term it is the right investment, done
deliberately, not force-swept.

**The library components are sound and property-driven** (Row: Size/State;
Button: Kind/Size/State; Input/Nav/Comment-row: variant props). Nothing about
them needs rebuilding — the debt is purely that the screen frames don't yet
instance them, and the highest-leverage seam (panel chrome) now does.

### Pass 2 — Nav item, the other clean high-volume seam: 0 → 738 total

Audited every component's consumer set for *safe* instanceability (uniform name,
uniform size, content the component can hold via override, no missing slots):

| Target | Consumers | Verdict |
|---|---|---|
| **Panel header** | 74 | ✅ done (pass 1) |
| **Nav item** | **664** (Site 456 + Portfolio 208) | ✅ done — uniform 240×32, State variants (rest/active), single label override |
| Empty state | 11 | ✗ skip — 8 different hand-sizes; one component size would regress them |
| Progress row | 1 | ✗ not worth a pass |
| Card / media | 38 | ✗ carries a source badge the component has no slot for |
| Section header | ~40 real | ✗ needs variant surgery — tint on/off + count on/off, and the labels collide with inspector hex rows (`#406ED6`) under a naive match |
| Row · Input · Button | 225 · 407 · many | ✗ carry varied content the components lack slots for; retrofit is per-node content re-application |

**Total: 738 instances, 0 → 738.** The two highest-volume uniform seams — all
panel chrome and every Site/Portfolio nav row — now resolve from one component
each. Nav proof verified by read-back (grid intact, 0 overflow, 0 collisions);
the 0.5× screenshot that looked empty was grey-on-white at low detail, not a
regression.

### Pass 3 — the full pass, done properly: 0 → ~982 instances

The founder chose the full instancing. Done component-by-component, authoring the
missing slots/variants first where needed, verifying each, recovering from the one
regression it caused. Final: **8 components, ~982 instances, 0 overflow, 0
collisions across all 239 frames.**

| Component | Instances | Slot/variant authored | Notes |
|---|---|---|---|
| Nav item | 664 | — | Site 456 + Portfolio 208, State by active |
| Button | 102 | — | Kind by fill, Size by height, label hug |
| Panel header | 74 | — | pass 1 |
| Section header | 36 | **+Tint, +Count booleans** | see regression below |
| Card / media | 34 | **+Badge boolean + badge node** | STOCK/AI per card |
| Comment row | 33 | — | Author=client, quote+meta override |
| Checkbox | 23 | — | State by tick/fill |
| Input | 14 | — | single-line 36h form fields, State by stroke |
| Toggle | 2 | — | State=on |

**The one regression, caught and recovered.** Adding a `tint-bg` rectangle to the
Section header component — which is *horizontal auto-layout* — made the rectangle a
flex child; it shoved every label off-frame (x=344, w=1) and overflowed 6 frames.
Fix: `layoutPositioning = 'ABSOLUTE'` on the background. The labels were also
scrambled by the failed override, and were recovered by re-applying a
**deterministic per-frame map** (Review = OPEN·HOME/2 + MENU/1; Brand = EXPORT +
IMPORT; etc.) in top-to-bottom order — 36/36, 0 mismatches, which also confirmed
the map was exact. Lesson: a background inside an auto-layout component must be
absolute.

### What is deliberately NOT instanced, and the precise reason

Not "skipped" — instancing these would *regress* verified frames, so leaving them
is the correct call, not an omission:

| Element | Count | Why not |
|---|---|---|
| **Row** | ~225 | The component has **only a Label slot**; the frames use 6+ distinct row anatomies (Insert icon+label, Layers chevron+icon+eye+lock, Pages checkbox+home+dirty, Content icon+label+count, Media dot+meta+⋯). One component cannot hold them without becoming a mega-component. This needs a **row-component family** — a design decision, not a sweep. |
| Inspector control cells | ~407 | Inspector-specific anatomy (label + control), not a library atom. |
| Empty state | 11 | 8 different hand-sizes; one component size regresses them. |
| Stock-browser card | 4 | Carries a legally-required provider credit — a different molecule. |
| 8px status dots · pin circles | ~21 | Plain ellipses, not the Status-dot / Badge *pill* components. |
| Multi-line textareas · 28h search | ~15 | Different height/element than the 36h single-line Input. |

**The Row family is the one substantial piece left** — and rather than defer it,
it is being built molecule by molecule (below).

### Pass 4 — the Row family, authored not deferred

The 177 list rows are ~13 anatomies, so the honest fix is a small family of row
molecules, each authored then instanced. Started with the dominant one:

**`List row`** — a new component (icon + label + optional count + optional
chevron, three booleans). Instanced the **73** uniform 32h list rows across
Insert, Content, Brand, Media drill-ins and Brand token-detail. Icon/count/chevron
mapped per row; counts recovered where the override failed (see below).

**Two regressions, both caught and fully recovered — same root cause twice:**

1. *Read-before-remove.* The count text was read *after* its parent row was
   removed, so ~29 rows kept the default "0". Recovered from a deterministic
   label→count map (Tokens 14, Presets 18, Menu items 24 …). This is the identical
   mistake the Section-header pass made — noted now as a standing rule: **capture
   all content before removing the source node.**
2. *Over-broad match.* `Row ·` also matched the **Inspector · multi-select**
   control rows (Background/Radius/Padding…), stripping their control boxes and
   overflowing the frame. Caught by the overflow check, reverted, and the 5 control
   rows rebuilt from spec.

Both recovered to **0 overflow, 0 collisions**. The lesson is concrete: a broad
name match plus destructive removal is where these passes break; match precisely,
read before removing, and let the overflow/collision check be the backstop.

### Current instancing total

**10 components, ~1019+ instances, 0 → this, 239/239 frames clean:**
Nav item 664 · Button 102 · Panel header 74 · List row 73 · Section header 36 ·
Card 34 · Comment row 33 · Checkbox 23 · Input 14 · Toggle 2.

**Still to author** (each a distinct row molecule, being worked in order of
count): Layer/tree row (~49) · Version row (~24) · Page row (~15) · Record row
(~4) · Export-format row (~5). Plus the intentionally-not-instanced set from the
table above (inspector control cells, empty states, dots).

### The bug that verification kept missing

Batch 1b passed every check I ran — sizes, overflow, captions — while sitting on
top of **18 existing boards**. Batch 2 landed on five more. Every check was
per-frame; none asked *is anything already here.* Collision detection is now part
of the standard pass, and it caught two further overlaps later in the run
(batch 4 over batch 3, captions over the next row down).

A second class of the same error: cloning a frame inherits geometry that was right
for its old context. `S5.3`'s Review panel stayed 812 tall after the review bar
shrank the band to 768; the inspector states inherited 776 from a pre-existing
frame while the shell uses 812. Both were invisible until measured.

### Two card-board claims corrected against code and spec

Beyond the ones already logged: `Media · drill-in` named **Image editor** as a
sixth drill-in when cargo-sheets §4 lists it under *"Modals, not drill-in"*, and
`Pages · listings` described CMS-generated pages when §2 defines Listings as the
**SEO table**. Both were built to the spec.

---

## 7. Honest count

**Before:** 309 named things, ~99 of them real frames, ~210 annotation cards.
**After:** **225 real full-size frames**, each captioned with the reasoning its
card carried, plus the component library and foundations that were already sound.

The two numbers are not comparable, and that is the finding. 309 counted cards,
kit entries, and multipliers as though they were screens. 225 counts frames a
developer can build from. **The old number was bigger and meant less.**
