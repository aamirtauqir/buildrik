# Insert panel — redesign spec

The founder named this panel as the example: *"should not only use basic text
rows. Use proper icons, visual blocks, element cards, categories, previews and
drag-and-drop affordances where useful."*

The audit says the rows are the symptom. Fixing the taxonomy is what makes the
visual treatment obvious, and doing the visual treatment first would produce a
prettier version of the same confusion.

---

## 1. What is actually wrong

Measured, not impression. Every claim carries its finding id.

| | |
|---|---|
| **The panel shows ~117 offerings for ~64 distinct things.** All 53 ELEMENTS rows are the same registry block as something further down the same panel — 40 reappear as a BLOCKS card, 13 as a COMPONENTS row. | `UX-A-04` |
| **Only the duplicates can be dragged.** The 53 ELEMENTS rows pass `draggable`; the BLOCKS cards, the COMPONENTS rows and MINE do not. | `UX-A-06` |
| **So the one group built for dropping cannot be dropped.** Onboarding says *"Drop a ready-made section — hero, features, footer — onto the canvas"*. `hero` and `features` have no element row at all, and their BLOCKS cards are not draggable. | `UX-A-07` |
| **BLOCKS is 50 blank grey rectangles.** The card renders `b.preview`; no block in the registry defines `preview`. The one group drawn as a picture grid has no pictures. | `UX-A-05` |
| **Three of the four groups are collapsed below 53 rows.** Only ELEMENTS opens by default, which is why a live walk sees one flat list. Open/closed state is component-local and the tab unmounts, so it resets every visit. | `UX-A-08` |
| **Every entry has a written description that never renders.** All 53 carry a one-liner (*"Swipeable image or content carousel"*); the row shows it only when `disabled` is true, and nothing is disabled. | `UX-A-09` |
| **Favourites and recents are fully built and rendered nowhere.** | lane A |
| **Search never covers MINE** — the user's own saved components are the one thing search cannot find. | `UX-A-11` |
| **The two insert paths disagree about feedback.** A click raises *"Inserted: Heading"*. A drag raises nothing, and can silently place nothing at all. | `UX-A-20`, `UX-A-01` |

**The thesis:** this is not a list that needs nicer rows. It is one catalog
presented three times under three different affordance rules, with the richest
presentation given to the entries a user cannot drag.

---

## 2. The structural fix, before any pixels

**One catalog. One entry per thing. The presentation varies by what the thing
IS, not by which group it landed in.**

Three kinds, and they are genuinely different objects:

| Kind | What it is | Count | Presentation |
|---|---|---|---|
| **Element** | one primitive — Heading, Input, Image | ~53 | compact row, icon + name |
| **Section** | a composed, ready-made block — hero, features, footer, pricing | ~50 | visual card with a real preview |
| **Component** | a saved, reusable instance — shipped or the user's own | ~14 + MINE | row with an instance glyph |

A thing appears **once**. `hero` is a Section; it does not also appear as an
Element row. That alone removes 53 duplicate offerings.

**Everything is draggable, or nothing claims to be.** The current split — rows
drag, cards do not — is invisible until a drag fails. If a Section cannot be
dragged, it must not be drawn in the affordance vocabulary of a droppable card.

---

## 3. The panel

```
┌─ Insert ─────────────────────────── 280 ─┐
│  ⌕ Search elements, sections…        ⌫   │   search clears; covers MINE
├──────────────────────────────────────────┤
│  RECENT                             ⌃    │   the built-but-unrendered feature
│  ▢ Heading   ▢ Image   ▢ Button          │   3 chips, one row, no scroll
├──────────────────────────────────────────┤
│  SECTIONS                     50    ⌄    │   OPEN by default — see below
│  ┌──────────┐ ┌──────────┐               │
│  │ [preview]│ │ [preview]│               │   2-up cards, real thumbnails
│  │ Hero     │ │ Features │               │   drag handle on hover
│  └──────────┘ └──────────┘               │
├──────────────────────────────────────────┤
│  ELEMENTS                     53    ⌃    │
│  ⊞ Layout        ⌄                       │   sub-grouped, not one flat 53
│  T  Text         ⌄                       │
│  ⌨ Forms         ⌄                       │
│  ▶ Media         ⌄                       │
├──────────────────────────────────────────┤
│  COMPONENTS                   14    ⌃    │
├──────────────────────────────────────────┤
│  MINE                          n    ⌃    │
└──────────────────────────────────────────┘
```

**SECTIONS opens by default, not ELEMENTS.** Onboarding tells a new user to drop
a hero. Today that instruction points at a collapsed group below 53 rows
(`UX-A-07`). The default open group should be the one the product's own first-run
copy sends people to.

**ELEMENTS sub-groups.** 53 flat rows is the discoverability complaint; four
groups of ~13 is scannable. Grouping is by what the user is trying to do —
Layout, Text, Forms, Media — not by the registry's internal order.

**Descriptions render on hover**, in the row, from the text that already exists
for all 53 entries (`UX-A-09`). Nothing new needs writing.

---

## 4. Drag and drop

The audit's worst Insert finding is that a drag can place nothing and report
success (`UX-A-01`), and its cause is one line: `handleBlockDrop` returns a
success boolean that its caller discards before hardcoding `true`. **That is a
code fix, not a design one, and the design must not paper over it.**

What the design owes:

- **A drag handle on hover** for every draggable thing, so the affordance is
  visible before the drag rather than discovered by failure.
- **A drop indicator computed for the thing being dragged.** Today the canvas
  draws valid/invalid from a stale target (`UX-A-19`).
- **One feedback contract for both paths.** Click and drag currently disagree
  (`UX-A-20`): a click toasts, a drag says nothing. Both should confirm in the
  same place — a brief highlight on the placed element beats a toast, because it
  also answers *where did it go*.
- **A visible failure.** If a drop is refused — wrong parent, locked target —
  say so at the cursor. Silence is what makes `UX-A-01` invisible.

---

## 5. What this does NOT do

- **No new icon set.** The element glyph map already exists
  (`editor/shared/elementIcons.tsx`).
- **No new copy.** Descriptions, group names and the tip text all exist; the
  tips band currently renders the counter and hides the tip (`UX-A-14`).
- **No new component library.** Sections/Elements/Components are the file's own
  existing masters, per Phase 3's reuse-before-create rule.
- **No AI affordance here.** The AI placement map puts generation in Content/CMS
  and the canvas, not in a catalog the user is browsing deliberately.

---

## 6. Acceptance

Not "looks better". Each is observable:

1. Every catalog entry appears exactly **once** in the panel.
2. Every entry drawn as draggable can be dragged, and a refused drop says why.
3. A new user following the onboarding instruction reaches a hero **without
   expanding a group**.
4. Search returns MINE.
5. The panel's open/closed state survives leaving the tab and coming back.
6. A drag that places nothing shows an error — verified by forcing the failure,
   not by reading the handler.

Item 6 depends on the one-line code fix in `useDropExecution.ts:302-303`. Until
that lands, the panel cannot honour its own affordances, and this spec should
not be drawn as though it can.
