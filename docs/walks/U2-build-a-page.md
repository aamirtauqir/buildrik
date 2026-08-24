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
write, per-breakpoint override behaviour, and pseudo-state pills.

**Inline text edit and the right-click context menu are worked below** — they
were the first two of this list to be walked live, on 2026-08-24.

## 2026-08-24 — inline text edit and the right-click menu, walked live

Both surfaces were on the "not covered" list since U2 was written. Walked at
1440×900 against the running editor on a real site, driving real keystrokes
rather than `execCommand` — the memory note says an `execCommand` bypass
manufactures false positives here.

**Inline text edit — works.** Double-click on a canvas text element:

```
after double-click : {"contentEditable":"true","focused":true}
typing landed      : " EDITED"
after Enter        : " EDITED"     → Enter COMMITS
after Esc          : reverted      → Esc REVERTS
```

**The right-click menu — opens, and had a visible defect.** Eight items:
`Edit›`, `Insert›`, `Layout›`, `Quick Style›`, `Save as component`,
`Reveal in Layers`, `Select Parent←`, `Lock`.

Two of them rendered a literal **`*`** where an icon belongs. Chasing it found
`MenuIcon`'s fallback (`MenuIcon.tsx:77`) drawing `{"*"}` for any name absent
from `ICON_PATHS` — and comparing the two sides showed **eight** action icons
missing, not two:

`chevron-up`, `chevron-down`, `chevrons-up`, `chevrons-down`, `lock`, `unlock`,
`package`, `box-select`

which is Bring Forward, Send Backward, Bring to Front, Send to Back, Lock,
Unlock, Save as component and Select from stack — the whole layer-order group,
plus lock and the two standalone actions. All eight paths added. The fallback
now holds the slot and draws nothing: an asterisk beside an ordinary menu label
does not read as "icon missing", it reads as a typo, and the label already
carries the meaning.

Guarded by a test that reads the two sides against each other rather than
asserting a hand-written list — a missing icon is not a crash, which is why
nothing caught this.

**Verified live after:** `with svg: 8 of 8 · asterisks: none`.

### The board does not decide this one

`boards.json` gives both context-menu boards `authority: "code:*"` —
`807:7775` is `code:state-exists`, `1176:4866` is `code:cites-board`, and the
latter is an anatomy sketch (width/height `0`) whose items place their label at
`x=12` with **no icon slot at all**, including the 25 actions that have always
had icons. So the board's silence is not a contract that icons are wrong, and it
was left alone rather than padded with eight glyphs it never set out to draw.

### Harness notes

The first pass reported `canvas elements: 0` and then `right-click menu: NONE`.
Both were the probe. The canvas marks elements with **`data-buildrick-id`**, not
`data-element-id`; and the "no menu" reading came from right-clicking an element
still left in `contenteditable` by the preceding Esc test. That is the fifth
null-result-that-was-the-harness this session, which is why no first null is
written up as a defect any more.

### Codex review — one finding, and it was about the guard, not the fix

The eight SVG paths check out (the chevrons have the right up/down Y ordering),
the blank fallback is safe because a menuitem's accessible name comes from its
visible label rather than the icon's text node, and `appliedKey()` has no
save/load drift on the current path — the shell treats the site id as stable for
the lifetime of the document.

What it did find: **the guard test was brittle.** It regexed `MenuIcon.tsx` and
the action files for `icon: "…"` and `^  key:` lines, so extracting the eight
icons into a helper object and spreading them in — or switching a key to single
quotes — would render perfectly and still make the test report missing icons. A
guard that fails on a legitimate refactor is a guard that gets deleted.

Rewritten to read the real values: `ICON_PATHS` is exported and imported, the
action definitions are imported and walked for their `icon` fields, and the
fallback is asserted by RENDERING `MenuIcon` with an unknown name and checking
there is no text and no `<svg>` — behaviour, not source text.

Also carried, not fixed: the previously-written bare `sessionStorage` key
becomes dead session data. No user-visible regression, because `TemplatesTab`
rehydrates from `page.meta.appliedTemplates` on mount; the only edge case is
state that existed ONLY in the old key and nowhere in page meta.

