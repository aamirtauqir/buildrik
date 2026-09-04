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

## 8. The 360-wide drawers — TESTED, and it is a redraw

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

**So this is a redraw of three modules, not a resize**, and the cost is now
known rather than guessed. Whoever takes it needs to re-pin each row's
right-aligned content — roughly 7 nodes per board across 22 boards.

The height half of the same recommendation was safe and **is done**: the seven
280×776 boards are now 280×812, so the 280-wide drawer has one size.


---

## 9. Group labels — TESTED, and my detector was the problem

**718 unbound 11px "caps" labels across 8 recipes.**

Piloted on `1159:4593 Media · fullpage · library`, which the detector said had 9
group labels. Seven of them were **count badges** — `6`, `14`, `10`, `24`, `8`,
`5` — because **a number is equal to its own uppercase**, so `ch === ch.toUpperCase()`
matches every numeral in the file. Binding them to `ui/11 · section header` made
count badges carry a section-header style: visually subtle, semantically wrong,
and it would have mislabelled every count in the product.

Reverted the 7 to Regular/AUTO/0%. The 2 genuine labels on that board (`SMART`,
`FOLDERS`, `TAGS`) were correctly bound and kept.

**So the 718 figure is not trustworthy** — it is an upper bound containing an
unknown number of numerals, badges and codes. Before any bulk change, the
detector needs a real definition of a group label: at minimum excluding pure
numerals, and probably requiring a letter and a minimum length.

The underlying decision is unchanged and still real — the tracking is `+8%` on
537 bound labels and `+0.5px` or `0%` on the unbound ones, and 477 carry AUTO
leading no `--bk-leading-*` token can express. But the population needs
re-counting first.
