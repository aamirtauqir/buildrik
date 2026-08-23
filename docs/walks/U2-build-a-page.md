# U2 · Build a page (core loop) — walk record

Walked 2026-08-24 · localhost:3000, 1440×900, real session.

## Legs

| # | leg | result |
|---|---|---|
| 1 | Insert catalog | **PASS** — four groups (`elements`, `blocks`, `components`, `mine`), **53** insert items in ELEMENTS, matching the PRD's "53 elements". *(The same line's "ecommerce excluded" was already corrected in Ch.12: they are reachable under Advanced.)* |
| 2 | click-to-add | **PASS** — 8 → 9 elements |
| 3 | inspector populates on select | **PASS** — TYPOGRAPHY with Family (`Inter, sans-serif`), Size with a px/em/rem/%/vw unit switcher, alignment, case (Aa/AA/aa) and decoration controls |
| 4 | breakpoint switcher | **PASS, and the labels are good** — `Wide (preview width, uses Desktop styles)`, `Desktop (≥1024px)`, `Tablet (768–1023px)`, `Mobile (≤767px)`, plus the current state as `Breakpoint: Desktop`. The ranges match the PRD (tablet ≤1023, mobile ≤767) and each one says what it *means*, not just what it is called. |
| 5 | undo toast on destructive ops | **FAILED, fixed here.** See below. |

## The defect (leg 5)

The PRD promises "undo toast on destructive ops". Measured over four seconds
after a keyboard delete, the only toasts on screen were `Saved` and the
empty-inspector hint.

Meanwhile `handleToolbarDelete` — the canvas toolbar's Delete, the *same intent
by a different route* — has always shown `Heading deleted` (or
`Container (3 children) deleted`) for five seconds with an **Undo** action.

One action, two implementations, and the silent one is the one most people use.
That is the shape this whole walk keeps turning up.

**Fix** in `useHistoryFeedback`, which is already wired at `AquibraStudio.tsx:260`
— that file is mid-edit in the founder's tree and is never staged from here.

**The seam is the COMMAND, deliberately.** `element:deleted` fires once *per
element*, so a three-element delete would stack three toasts; a command fires
once per user action. It also cannot collide with the toolbar, which calls
`elements.removeElement` directly and never enters the command centre.

## What codex caught, which was worse than the bug

`CommandCenter.run()` emits `COMMAND_RUN` **whether or not the command changed
anything**. The first version keyed off the id alone, so pressing Delete with
nothing selected announced `Element deleted` *and offered an Undo that would
have reverted the previous real edit*. A false claim attached to a destructive
button — worse than the silence it replaced.

It now **counts what actually disappeared** rather than trusting that the
command did something: the ids are captured at `COMMAND_BEFORE` (afterwards
there is nothing left to name) and re-checked at `COMMAND_RUN`. Nothing gone,
nothing said. Three selected but only two deletable reads "2 elements deleted" —
what went, not what was asked for.

Measured live, both directions:

```
Delete with nothing selected → no toast
Delete with a selection      → "Heading deleted / Undo / ✕"
```

Second time today that codex found me assuming an outcome instead of measuring
one — the exact discipline this walk applies to everything else.

## Not covered

Drag-to-canvas (snap guides 5px, 25% edge drop zones, 500ms touch long-press),
the smart parent walk-up and its nesting-error toast, the 300ms debounced style
write, per-breakpoint override behaviour, pseudo-state pills, inline text edit
(Enter commits / Esc reverts), and the right-click context menu. Named so they
are known-open rather than assumed-fine.
