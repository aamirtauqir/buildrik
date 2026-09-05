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

## 9. Group labels — RE-COUNTED, and now one narrow decision

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
| **Slider** `92:30` | cannot | the knob position *is* the value, and an instance cannot override `relative-transform`. Swapping rewrote a board's "Opacity 100" to 62. |
| **Row** `8:47` | cannot | its Label carries no depth. **All 369 candidates are tree rows** — measured by grouping rows by parent: 41 groups, 41 with varying label offsets, **zero flat lists**. Swapping nine flattened the hierarchy and erased the selection. |
| **Status dot** `10:27` | cannot | the five variants are `#0e9f6e / #e3a008 / #f05252 / #9ca3af`; the 28 same-size local dots are `#d1d5db` and `#1a56db`. Different objects that share a shape. |

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

## 11. When the code changes copy the board owns

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
