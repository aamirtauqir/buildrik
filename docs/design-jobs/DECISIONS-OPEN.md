# Open design decisions — measured, costed, not made

Everything in this file was found by the unification work and deliberately **not
changed**, because each is a judgement about what the product should look like
rather than a defect with a right answer. Each row carries the number that makes
it decidable.

The rule applied throughout: where DESIGN.md or a generated token settles the
question, it is a **correction** and was made. Where it does not, it is a
**decision** and it is here.

---

## 1. Does the Dashboard follow the editor's type ramp?

**Unlocks 339 nodes immediately, ~1,459 across all four decisions below.**

`Dashboard / Top nav` (`979:658`) draws its links at Inter Medium **14/18**. The
ramp in DESIGN.md:148 is **14/20**. Binding is impossible until they agree.

Why this is not simply a correction: DESIGN.md describes that ramp as the
**editor chrome** ramp — "Editor chrome lives mostly at 12–14" — and the audit
established that the Dashboard legitimately runs its own nav component
(`975:615`, 265×30) separate from the editor's. Applying the editor ramp to the
dashboard is a product decision.

**Cost if yes:** the nav labels are `autoResize=WIDTH_AND_HEIGHT` inside 30px
auto-layout parents, so a 2px leading increase may grow those rows and the
1440×60 bar with them. Verify the bar height after, not before.

**Correction, 2026-09-06 — the premise is wrong in the code, and the narrow
question is close to forced.** Re-derived from source rather than from this
file's own earlier note:

- **The shipping nav renders neither value.** `top-nav.tsx:56,73` draws its links
  at `text-[13.5px] font-[530]` — 13.5px, weight 530, **no leading class at
  all** — from the `--color-*` namespace, not `--bk-*`. The question "14/18 or
  14/20?" is being asked about a component that ships as neither.
- **The dashboard already has a complete type system of its own**
  (`globals.css:191-217`): display 28/1.2/700, page-title 20/1.2/700,
  section-title 15/1.3/650, eyebrow 11/1.2/600, metric 22/1/700, body 14/1.45,
  body-sm 12/1.35, plus a separate ten-token `--text-auth-*` scale. Its leadings
  are **unitless ratios**; the editor's are **fixed px**. Two structurally
  different systems, not one system with a drifted value. It is also actively
  maintained by the founder — the comments carry a dated density pass
  (2026-08-28, *"text kabhi bara hai"*) and an explicit rule that these tokens
  exist to kill arbitrary `text-[Npx]` literals. Which makes the nav's own 13.5px
  a defect against the DASHBOARD's scale, not against the editor's.
- **The two systems already agree on the number in dispute.** 14 × 1.45 = **20.3**.
  The dashboard's body token is effectively 14/20.3 against the editor's 14/20 —
  they differ on notation, not on size.
- **In Figma, 14/20 already outnumbers 14/18.** Page `988:2`'s top combos are
  Inter Medium **14/20 (437)**, Inter Medium 14/18 (280), Inter Semi Bold 14/20
  (279) — see D-M-02. The page is not "at 14/18"; three near-identical 14px
  treatments coexist and the ramp-matching one is the largest.
- **Where Figma and code were both checked, they match exactly.** `979:661` is
  Inter Extra Bold 15; `top-nav.tsx:44` is `text-[15px] font-extrabold`. The nav
  master is accurate about the product — it is the 14/18 on the links that has no
  code counterpart.
- **`--bk-leading-18` has zero consumers** anywhere in the editor. It is generated
  *from Figma*, so the 14/18 is what created it: a token brought into existence by
  a design decision no code has ever used.

So 14/20 wins on three independent counts and is arguably a **correction**.

**What is genuinely a decision is the larger question underneath: is the dashboard
one design system with the editor, or two?** For two: its own namespace, unitless
leadings, weights to 800 the editor forbids, a separate auth scale, founder
density calls applied to it alone. For one: the accent is already unified to
`#1A56DB`, the neutrals are the same Flowbite grays, and the body text already
agrees to within a third of a pixel.

That answer changes what §3 even means. If the dashboard is its own system,
DESIGN.md's weight cap needs scoping to the editor explicitly and the 575
weight-700/800 nodes (D-M-09, 562 of them chrome) stop being violations. If it is
one system, those 575 are the real work — not the 280 at 14/18.

**Not re-verified:** the "339 nodes" figure and the attribution of 14/18 to the
nav LINKS specifically both come from the earlier Figma census; the quota was
spent and neither could be re-queried. Everything else above was read from source
on 2026-09-06.

---

## 2. 12/16 or 12/18?

**471 nodes** — 4 masters plus 321 drawn directly on the page.

DESIGN.md and the generated token disagree with each other for 12px text. Until
one wins, every 12px node in the product is unbindable, and `ui/12 · small
strong` was built at 12/18 on the ramp's authority while the largest real
population sits at 12/16.

This is the only row here where the two written sources conflict; the others are
silence rather than contradiction.

---

## 3. Admit Inter Bold, or retire it?

**429 nodes across 24 recipes and 13 sizes.**

DESIGN.md caps chrome weight at 600 — "no 700 anywhere in chrome". The Dashboard
uses Bold and Extra Bold anyway, at thirteen different sizes, which is ad hoc
rather than one heading style. Either the cap holds and these become Semi Bold,
or Bold is admitted and needs **one** defined size, not thirteen.

---

## 4. Add `ui/11 · caption strong`?

**228 nodes** (191 of them after one leading normalisation).

Semi Bold 11/14, used by the Pill and Nav-item badges. Nothing in the current
16-style ramp fits them, so they are unbindable by construction rather than by
drift.

---

## 5. Are three nav rows one component?

Three designs serve one job:

| where | size | component | instances |
|---|---|---|---|
| Editor Settings | 140×30 | `Settings nav row` (built here) | 585 |
| Site + Portfolio | 240×32 | `16:19` | ~900 |
| Dashboard v2 | 265×30 | `975:615` | 251 |

One component with a filling width would serve all three. That changes visual
design on three pages, so it is not a cleanup.

---

## 6. Is "Agency header" the same thing as "Branded bar"?

Both 1280×56 on the client-review page. `Agency header` draws the literal
placeholder `{Agency}` — the board-side twin of the shipping defect where
`review-client.tsx` passes `agency="Loading"`. Built as two components rather
than merged silently.

---

## 7. `ui/14 · panel title` — already changed, flagged for reversal

Corrected from 14/21 to **14/20** on the authority of DESIGN.md:148 and
`--bk-leading-20`. This moved **86 already-bound nodes by 1px** and made 857
bindable.

Listed here because it is the one place the unification made a deliberate visual
change. If 21 was right, **DESIGN.md:148 is the thing to edit** and the style
should follow it — not the other way round.


---

## 8. The 360-wide drawers — RESOLVED, not a redraw after all

**22 boards: AI 11, Notifications 6, History 5, against 154 at 280×812.**

The final QA recommended settling every drawer at 280×812. I stopped calling
this "risky" and measured it, then tested it on `165:2 Notifications · unread`.

**Result: narrowing to 280 deletes controls.** Seven nodes ended up outside the
new edge — the close button pinned at x=345, every timestamp at x=326, and the
notification titles at x=300. The rendered panel came back with **no close
button and no timestamps at all**. Reverted; the board is back at 360×776 with
0 overflow and the controls restored.

The cause is structural, not incidental: these boards are VERTICAL auto-layout
whose *rows* are not, so setting each child to FILL reflows the column and
leaves everything pinned inside a row exactly where it was.

**Then I built the re-anchoring instead of accepting that.** The failure had a
specific, mechanical cause: every node has a *right inset* — board width minus
its right edge — and for right-aligned content that inset is the thing the
designer chose. Capture it before the resize, restore it after, and the control
lands the same distance from the new edge. Nodes are classified by measurement:
full-bleed (both insets ~0) gets resized, right-pinned (right inset small, left
inset large) gets shifted, everything else is untouched. A final pass trims any
box still wider than the panel.

**All 29 boards are now 280×812, with `stillOverflowing=0` on every single one.**
Notifications keeps its close button and all three timestamps; AI's copy wraps;
History's rows are intact. Verified by screenshot on three of them.

**RESOLVED.** The drawer is one size: 177 boards at 280×812 across fifteen
modules. `360×776` no longer exists in the file. Inspector's 300×812 stays — it
is the right panel, not a drawer.


---

## 9. Group labels — RESOLVED (see §15); the decision was never one

**718 unbound 11px "caps" labels across 8 recipes.**

Piloted on `1159:4593 Media · fullpage · library`, which the detector said had 9
group labels. Seven of them were **count badges** — `6`, `14`, `10`, `24`, `8`,
`5` — because **a number is equal to its own uppercase**, so `ch === ch.toUpperCase()`
matches every numeral in the file. Binding them to `ui/11 · section header` made
count badges carry a section-header style: visually subtle, semantically wrong,
and it would have mislabelled every count in the product.

Reverted the 7 to Regular/AUTO/0%. The 2 genuine labels on that board (`SMART`,
`FOLDERS`, `TAGS`) were correctly bound and kept.

**Re-counted with a correct detector** — at least two letters, no lowercase
anywhere, so numerals, single glyphs and strings like `2h` or `v3` are excluded.

**The real population is 278, not 718.** 440 of the original count were not
labels at all. The recipes:

| count | recipe |
|---|---|
| 103 | Medium, AUTO leading, 0% |
| 75 | Semi Bold, 16, +0.5px |
| 35 | Medium, 16, **+0.5px** — differs from the style in *tracking only* |
| 24 | Regular, 16, +0.5px |
| 41 | a tail of six more |

The 35 looked bindable, and 6 of them were — the rest **would clip**. Their
boxes are sized tight to the text at 0.5px, and the style's 8% is 0.88px at
11px, so a nine-character label grows ~3px and 28 of 34 end up wider than their
own box. Each was measured before deciding, and the probe restores the node
before the decision so the measurement is not itself the change.

**What is left is one narrow decision, not a bulk job:** is section-header
tracking `+8%` (537 bound labels, the style as written) or `+0.5px` (134
unbound labels)? Whichever loses needs its boxes re-measured, which is a layout
change on real boards. The 103 at AUTO leading need the separate question of
whether AUTO is admitted to the ramp at all.


---

## 10. Forms & tables adoption — TESTED PER FAMILY, and it is not a backlog

The forms/tables audit reported **955 hand-drawn form controls** and **222 table
structures**, and recommended adopting three "zero-use" library components to
convert about ninety shapes "with no further design work".

Every one was piloted on a real board with a before/after render. **One worked.
Three cannot be adopted, each for a different and specific reason:**

| component | result | why |
|---|---|---|
| **Radio** `14:20` | **adopted** | structurally identical; done |
| **Slider** `92:30` | **adopted — see §13** | I called this unadoptable after one swap. All 49 sliders in the file read 100; there was no range to express. |
| **Row** `8:47` | superseded — see below | its Label carries no depth. **All 369 candidates are tree rows** — measured by grouping rows by parent: 41 groups, 41 with varying label offsets, **zero flat lists**. Swapping nine flattened the hierarchy and erased the selection. |
| **Status dot** `10:27` | cannot — **confirmed by census, §14** | six different semantic jobs share the circle; none is site-publish status |

**So "zero uses" does not mean neglect.** In three of four cases it means the
component cannot express what the boards need. An adoption count is not a health
metric.

**The consequence for the remaining estimate:** 955 and 222 are upper bounds, not
work queues — the same way 718 group labels turned out to be 278 real ones with
6 bindable. Any family should be piloted on one board with a render either side
before it is costed, because four of the five estimates tested this session were
wrong in the direction of looking easier than they are.

What would make Row adoptable: a `Depth` variant axis or a component property
driving `paddingLeft`. What would make Slider adoptable: a property driving the
fill width and knob position.


---

## 11. Review-bar copy — a STATE-COVERAGE gap, not a copy dispute

`ReviewBar.tsx:121-134` renders **"Sent — waiting on your client"** where the
boards print **"0 open"**, and the code carries its own reasoning:

> *A zero here was a count where a sentence belongs. The bar renders only while a
> round is live, so `0 open` meant "your client has not replied yet" — and
> printed a number that says none of that.*

That is a good argument. It is also a **copy change**, and CLAUDE.md's precedence
rule is explicit: *behaviour → the CODE contract; everything VISUAL — layout,
colour, type, **copy on screen** — → the BOARD.*

So the two sources disagree, and the rule says the board wins on copy while the
code has documented why it should not. Updating the boards to match the code
would invert the stated precedence; reverting the code would discard a
deliberate improvement. **Neither is mine to choose.**

Same shape, same call needed:
- `StudioHeader.tsx:138` ships an **"Opened · no reply"** pill that appears on no
  board.
- The Publish panel's ENVIRONMENT block draws `brk-preview.vercel.app`, a
  Buildrik-hosted preview that cannot exist under per-workspace Vercel — and the
  code honours the board by shipping the row permanently blank.

If the answer is "code leads on copy", that is a one-line amendment to CLAUDE.md
and roughly a dozen boards follow from it.


---

## 12. Tree rows — RESOLVED (this was never a decision)

I filed "Row cannot take the 369 tree rows" as a decision awaiting a `Depth`
axis. **That was my own misclassification**, and the Panel header work earlier in
the same session is the proof: adding an axis for control sets *already drawn in
the file* is describing what exists, not proposing something new. Depth is the
same act.

The data was regular enough to encode exactly:

| | |
|---|---|
| depths | 16 / 32 / 48 / 64 / 80 / 96 — six levels, 16px each |
| states | no fill (328 rows), `#e1effe` selected (41) |
| height | 28 on all 369 |

So `Tree row` (`2142:11082`) is 12 variants — `Depth 0–5 × State rest|selected`
— built from a real row. **All 369 adopted; zero hand-drawn tree rows remain.**
Each went to the variant matching its *own* depth and selection, so nothing was
flattened and no selection lost. Verified by screenshot on two boards.

Kept separate from `Row` rather than extending it: `Row` is a flat-list row at
five sizes, a tree row carries depth and only ever appears at 28. Merging them
would be 120 cells for one real shape.

**The lesson worth keeping:** "this needs a decision" deserves the same scrutiny
as "this is a defect". I was wrong here in the conservative direction, which is
cheaper than the alternative but still wrong.


---

## 13. Slider — RESOLVED, and I was conservative-wrong twice

Filed as "cannot be adopted: the knob position *is* the value and
`relative-transform` is not overridable on an instance". True about the API,
wrong about the problem.

**Every slider in the file reads 100, knob at x=108. All 49 of them.** There is
no range to express — the component's default of 62 was simply wrong. Setting
the master to 100 and adopting took one edit and one swap.

That is twice in this session I filed a component as unadoptable and was wrong,
both times because I inferred a limitation from one failed swap instead of
measuring what the boards contain. Tree rows were the other.

**The check that would have caught both, in one line:** *before concluding a
component cannot express the boards, census what the boards actually hold.* Six
depths. One value. Both trivially encodable once looked at.


---

## 14. Status dot — the one that really is a non-starter, now with evidence

Having been conservative-wrong twice, I re-tested this with the census rule
rather than trusting the earlier read. It holds, and the numbers are better than
the reasoning was.

**The "221 local dots" figure was inflated.** 251 of the dots on the editor page
sit **inside component instances** — topbar save and review pills, already
owned and never hand-drawn. Only **101 are free-standing**, and they label six
different things:

| what it marks | example label |
|---|---|
| version-history timeline | `Today`, `Auto-save` |
| current version | `Now — 12 changes since v3` |
| issue severity | `Low contrast: 'Read the page'` |
| audit score disc | `91`, `98` |
| integration health | `Google Sheets · me…` |
| uptime | `Uptime — last 30…` |

`Status dot`'s five variants are **site publish status** — live / review /
changes / draft / failed. That is a seventh thing. These are not neglected
instances of it; they are different objects that happen to be circles.

**No action, and no decision needed either** — this one is simply not the same
component. Recorded so the next audit does not re-file "221 unadopted dots".


---

## 15. Section-header tracking — RESOLVED, and it was never a decision either

I filed "is section-header tracking `+8%` or `+0.5px`?" as a founder call.
**Three independent sources already agreed on 8%, and I had not looked at any of
them:**

| source | value |
|---|---|
| `tokens.generated.css:193` | `--bk-tracking-wide: 0.08em` — generated **from Figma** |
| `SectionHeader.tsx:17` | `tw:tracking-[0.08em]` |
| `PanelHeader.tsx:110` | `tw:tracking-[0.08em]` |
| `Popover.tsx:283` | `tw:tracking-[0.08em]` |
| Figma style `ui/11 · section header` | `+8%` |

The labels drawn at `+0.5px` are the deviation — exactly as `ui/14 · panel
title`'s 14/21 was, and settled the same way.

**128 labels retracked to 8%**, 127 boxes widened to fit and one left tight
where widening would have pushed it past its board. The earlier blocker —
"28 of 34 would clip" — was a box-width problem, not a value question, and
treating it as one is what turned a correction into a decision for three rounds.

**Third time today.** Tree row, Slider, and now this: filed as needing a
decision, resolved by looking at what the file and the code already contain.
The pattern is specific enough to name — *when two values disagree, check
whether a generated token or shipping code already picks one, before asking a
human to.*


---

## 16. What the copy conflict actually is

I described §11 as "the code changed copy the board owns" and left it for you.
Applying the same census used on the other three, it is not a value dispute —
it is missing state coverage, which is a different and more useful problem.

| string | shipped by | drawn on |
|---|---|---|
| `0 open` | code, only when a count exists | **5 boards** — `S5.1 · sent`, `S5.1 · error`, `S5.2 · pending`, `S5.2 · opened-not-acted`, `S5.6 · re-sent` |
| `Sent — waiting on your client` | code, when count is 0 | **no board** |
| `Changes requested — nothing left open` | code, on that status | **no board** |
| `Opened · no reply` | `StudioHeader.tsx:138` | **1 board** — `S1.6 · view-mode` |

So the code distinguishes **three** review states and the boards draw **one
string across five of them** — including on `S5.2 · opened-not-acted`, which is
character-for-character identical to `S5.2 · pending`.

**That reframes it.** CLAUDE.md's rule protects what the board says about a state
it has drawn. Two of these states are not drawn at all, so there is nothing for
the rule to protect — the gap is coverage, not conflict.

**Still yours, and now for a sharper reason:** choosing what a screen says in a
state nobody has drawn is design work, not reconciliation. But it is a much
smaller ask than "settle a precedence rule" — it is *"draw two missing review
states, or confirm the code's wording for them."*

**Correction:** an audit agent reported `Opened · no reply` as appearing on no
board. It appears on one, `S1.6 · view-mode`. I repeated that claim without
checking it.


---

## 17. `opened-not-acted` — fixed, and the ask is now one state

Fourth time I tested something I had filed as yours and found part of it mine.

`S5.2 · opened-not-acted` printed `0 open`, character-for-character identical to
`S5.2 · pending`. The product distinguishes them — `StudioHeader.tsx:138` ships
**"Opened · no reply"** for exactly this state, and the code's own comment says
*"'she hasn't opened it' and 'she opened it and said nothing' are different
conversations"*.

Crucially, **that string is already drawn on a board** (`S1.6 · view-mode`). So
applying it here is not authoring copy — it is using copy the design already
contains for a state whose board duplicated its sibling. Changed; the box grew
44 → 110 and still fits its parent.

**What is genuinely left is one state.** `Sent — waiting on your client` appears
in the code and on no board, and there is no existing board copy to draw from.
Writing it would be authoring product copy.

That is the whole remaining ask: **one string, one state.** Everything else that
looked like a decision this session turned out to be a measurement I had not
taken.

---

## 18. §11/§16 partly answered itself — the state gap was smaller than filed

§11 called the review-bar strings a state-coverage gap and §16 called the copy
conflict a governance question. A second pass tested the neighbouring family —
the topbar save pill — and the same shape resolved without a decision:

- The `Save status` component set (`697:461`) already carries **all six** states
  the code ships. The audit said five of six had no board; four were drawn.
- One of the six was drawn **wrong at the master**: `State=offline` read
  "Offline — saved locally", which `SaveStatus.tsx:50` rejects by name because
  nothing is written to the device and nothing replays on reconnect. A board
  promising a user their work is safe when it is not is not a copy preference.
- The two genuinely undrawn states were built by cloning a shell board and
  switching one variant. No copy was authored — it came from the master.

**What this changes about §11:** "the boards draw one string, the code ships
three" is worth re-testing the same way before it is treated as a decision. The
question to ask first is not "which string wins" but "does a component or a
sibling board already contain the missing one" — for `Opened · no reply` it did
(§17), and for the save states it did.

**What it does not change:** `Sent — waiting on your client` is still absent
from every board and every component, on both pages searched. That one is
unchanged and still the single item that needs a person.

## 19. Retired: "the interiors need decisions this session could measure but not make"

That sentence, from `FINAL-STATE.md` §5, was too strong. Re-tested against the
code, five of seven sampled Criticals had determinate answers — a feature flag,
a shipped hint string, a component master, a call site. The honest version is:
**some interiors need decisions; more of them than expected need a measurement I
had not taken.** The distinguishing test is cheap — does a generated token,
shipping code, an existing component, or another board already contain the
answer — and it should be run on a finding before it is ever written down here.
