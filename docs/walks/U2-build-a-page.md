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

The 300ms debounced style write, pseudo-state pills, and drag-to-canvas's
remaining two claims (snap guides 5px, 500ms touch long-press).

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

## 2026-08-24 — drag-to-canvas: the editor showed one placement and made another

Third of U2's unwalked surfaces. The basics hold: 85 draggable items in the
Insert panel, a drag from the panel to the canvas takes the tree from 33 to 34
elements, drop overlays appear mid-drag, and the drop target resolves to exactly
the element under the cursor.

**The defect is the 25% edge zone.** Dropping into the top quarter of an element
is supposed to place the new block BEFORE it. Measured on a 24px heading, cursor
2px in — well inside the 6px edge:

```
indicator line : {"top":301,"h":2,"cls":"bd-drop-position-line"} → the heading's TOP edge, i.e. BEFORE
landed         : AFTER
```

The line the user is looking at and the placement they get are different things.

**Why.** The rule itself is implemented and correct — `calculateDropPosition`
returns `"before"` when `relativeY < height * 0.25`, the resolver calls it with
`0.25`, and the overlay draws from that. The engine is correct too:
`addChild(child, index)` splices at `index`, which is genuine before-semantics.

`handleBlockDrop` — the path for a NEW block from the Insert panel — simply
never read it. Its destructure was
`{ composer, canvasRef, freshTargetId, onDropError, onDropSuccess }`, with no
`freshDropPosition` in it, and the index came from whatever
`findValidDropTargetWithFallback` returned. `handleTemplateDrop`, ten lines
away, honours the position properly. One of the two paths was finished.

**Fixed:** when the position is before/after **and** the resolved parent is the
target's own parent, the index comes from the target's slot among its siblings.
The parent check matters — `findValidDropTarget` walks UP until it finds
something that can host the element type, and once it has moved to a different
parent the target's index says nothing about where the user pointed.

**Verified live, same probe, after:** `indicator promised BEFORE, landed BEFORE`.

### Harness note — the jiggle, and a defect I nearly invented

Before the real finding, this walk produced a much more alarming one: *"the app
resolves the drop target to an ancestor `<SECTION>` spanning 100..1247 while the
cursor is over a heading at 302..326"*. That would have been a serious bug. It
was not true.

A synthetic `mouse.move(..., {steps: 14})` emits only about **four** `dragover`
events, and the resolver throttles at 50ms — so a single sample after the move
reads whichever resolution was made part-way along the path, over whatever the
cursor happened to pass. Adding six 1px jiggles **at** the target, so the last
`dragover` fires from the final position, made the app and the cursor agree
immediately.

Sixth null-or-wrong reading this session that turned out to be the probe. The
rule that keeps paying: never write up the first reading.

(Also confirmed on the way: `dragstart:1, dragover:5, drop:1` — the synthetic
drag really does drive the shipping HTML5 path, so what is measured here is what
ships.)

### Codex review — the fix was half a fix

`findValidDropTarget` **prefers hosting**. A container, card or column that can
accept the block resolves to `parent = target, index = undefined` — and the
first version of this fix only ran when the resolved parent was the target's
PARENT, so it never fired there at all. Drag a paragraph 2px into the top edge
of a container that accepts paragraphs: the line still promised before, the
block still went inside. The same defect, in the other half of the cases.

An edge means "beside this element", and that has to hold even when the element
could have hosted it. The fix now steps out to the target's parent and takes the
sibling slot in that case. `canNestElement` still runs on whatever parent it
ends up with, so an illegal placement is refused rather than forced.

Codex also confirmed what the questions were aimed at: `dropIndex` is a
pre-insert slot, `before` at index 0 and `after` at the last index both behave,
the `getId()` parent-identity check matches the engine's identity model, and
there is no transaction-boundary race — the index is computed and consumed
synchronously with nothing mutating sibling order in between.

**Not verified live:** the container-edge case. This site's canvas is built from
spans and headings — there is no DIV/SECTION with children in the viewport band
to aim at, and building that fixture was not paid for here. It is covered by two
unit tests, both negative-tested: disabling the step-out drops exactly the
edge-on-a-container case and nothing else.

## 2026-08-24 — per-breakpoint overrides work; the inspector's numbers do not

Fourth surface. **Overrides are correct**, walked live on a heading:

```
desktop            field 36 · computed 16px
→ Mobile           field 36 · computed 16px      (inherits, correct)
set 18 on Mobile   field 18 · computed 18px
→ back to Desktop  field 36 · computed 16px      (untouched)
media rules for this element: ["(max-width: 767px)"]
```

The override lands in its own media query and desktop is left alone. The chain
is wired end to end — `StudioPanels` passes `currentBreakpoint={device}`, and
the inspector calls `setBreakpointStyle(id, currentBreakpoint, …)`. The optional
`currentBreakpoint?: DeviceType` prop defaulting to `"desktop"` looked like the
classic unwired-chain trap and is not one; checked rather than assumed.

### OPEN — the inspector shows styles the element does not have

Look again at the first line: **field 36, computed 16px.**

That element is a `Heading` block dropped from the Insert panel during this
walk. Its saved record carries no base styles at all:

```json
"id":"el-mt7d1x3m-…","type":"heading","tagName":"h2","content":"Heading",
"breakpointStyles":{"mobile":{"font-size":"18px"}}
```

— only the mobile override created above. No `font-size` declaration for it
exists anywhere in the document, and it renders at **16px**, i.e. body text.

`getDefaultStyles` (`shared/constants/defaultStyles.ts`, `heading: font-size
32px`, with a larger value for `h2`) has exactly **one** consumer outside its own
module: `useStyleHandlers.ts:96` — the INSPECTOR. Nothing on the insert path
applies it. So the panel merges the defaults into what it displays, and shows a
number the element was never given.

**What the user sees:** drop a Heading, it looks like a paragraph, and the
inspector says 36 — confidently, in an editable field. The same shape as the
drop-position bug fixed earlier today: the editor displays one thing and the
canvas does another.

**Traced properly on 2026-08-24 — and the obvious fix is the wrong one.** See
the section below; calling it a founder call was the wrong framing, but so was
the one-line fix.

**Not verified:** whether the published/exported page has the same gap. The
engine has no styles to export, so it almost certainly does — but "almost
certainly" is not a walk.

## 2026-08-24 — the walk-up holds; the editor congratulated itself on every drop

Fifth surface.

**The smart parent walk-up works.** Dropping a Heading onto an `H2` leaf — which
cannot host it — walked up to an ancestor that could and inserted there
(44 → 45 elements), with no error. `findValidDropTargetWithFallback` doing its
job, and the `NESTING_FORBIDDEN` toast stays out of the way when a valid parent
exists.

**Beside it, a UI finding.** Every successful drop raised a toast:

```
toasts after ONE routine drop: ["Inserted: Heading"]
```

Thirty elements on a page means thirty of them, stacked over the bottom-right of
the canvas while you are still building. And the toast says nothing the canvas
has not already said louder: the element appears, `animateDropSuccess` flashes
it, and it is auto-selected, which moves the whole inspector. Webflow shows
nothing here.

Deleting it outright would have been wrong for a different reason: the toast
viewport IS the editor's `role="status"` region, so it was also the only channel
that reached a screen reader. The message now lives in a visually-hidden
`aria-live` region beside the canvas.

**Verified live after:** `toasts: []`, and `bd-sr-only` carrying
`"Inserted: Heading"`.

**Not unit-guarded, and said plainly.** The contract is "one drop, zero toasts",
which needs the real Canvas rendered — there is no cheap scaffolding for that
here, and a source-text assertion is the exact brittle guard codex flagged
earlier today. The intent is written into the code so nobody restores the toast
by accident; the live probe is the check.

### Recorded, not fixed — five live regions for one drop

The same probe read every `aria-live` region carrying text right after a single
insert:

```
"Saved" · "Inserted: Heading" · "Selected: heading" · "Heading selected"
· "Step complete: Add an element. Next: Edi…"
```

A screen-reader user drops one element and hears five announcements, two of
which are the same fact in different words. This predates today's change — the
toast was itself a live region, so the count is unchanged — and untangling which
region owns which fact is its own increment.

### Codex review — the replacement channel had three holes

**1 (High) — an identical message never announced twice.** `setState` with a
plain string skips the DOM mutation when the text repeats: drop a Heading, drop
another Heading, and a screen reader hears the first one only. `aria-atomic`
does not help — it governs how MUCH is read once something changes, not whether
anything changed. The state carries a sequence now and the span is keyed on it,
so an identical message still remounts. Verified live: two consecutive Heading
drops, `["Inserted: Heading", "Inserted: Heading"]`.

**2 (Medium) — two polite regions, one action.** A successful drop selects the
new element and THEN reports the insert, so my new region and the pre-existing
selection region both updated from one gesture; AT that coalesces polite updates
can keep whichever it likes, which would have quietly thrown away the very
channel the toast removal was meant to preserve. There is one region now, and
selection queues through it. Verified live: `regions in canvas: 1`.

**3 (Medium) — the OS file-drop lost its only visible signal.** That path emits
`onDropSuccess("Uploading file.png...")` BEFORE the upload finishes — progress,
not completion. Silently announcing it made a slow upload look like a drop the
editor had ignored, inviting a second attempt and making the eventual error read
as spurious. `DropSuccess` carries `pending` now: completion stays silent,
work-in-flight still toasts.

Codex also cleared what the questions were aimed at: `bd-sr-only` is the clipped
off-screen utility rather than `display:none`, so the region is still announced;
and the announcement state does not reopen the `dangerouslySetInnerHTML`
reference-stability bug, because the injected HTML prop is still memoised off
`displayContent`.

**Not verified live:** the `pending` upload toast — that needs an OS file drop,
which this probe does not perform.

**Still open, and now named twice:** `useSelectionAnnouncement` suppresses a
repeat of its own message (`if (next !== prevRef.current)`), so selecting two
headings in a row announces once. Same defect class as (1), in a hook this
change deliberately did not widen into.

## 2026-08-24 — why the Heading defaults cannot be fixed where they look broken

`getDefaultStyles` is defined, keyed by element type, and has exactly one
consumer: the inspector. `createElement` applies default ATTRIBUTES on the line
above — with a comment explaining why an `<input>` without a `type` is a text
box wearing an email label — and leaves `styles: {}`. The twin is simply not
wired. It reads like a one-line fix.

It was written, tested (4 new tests, both stale tests rewritten, all
negative-tested), and then **reverted**, because measuring it live showed the
one-line fix creates a worse bug than the one it closes.

**What the measurement said.** With defaults applied at `createElement`, a
freshly dropped Heading still rendered at **16px**, and:

```
how styles reach it: {"inline":"cursor: grab;","rulesForId":[],"tag":"H2"}
```

No inline style. No CSS rule naming its id. The element now HELD heading styles
and the canvas showed none of them.

**Why.** The canvas renders from `elementDataToHTML`, whose `buildAttributeString`
declares `styles?: Record<string, string>` in its input type **and never emits a
`style=` attribute**. Element-data styles do not reach the canvas at all. What
reaches the canvas is `StyleEngine` rules — which is why editing works: the
inspector calls `setBreakpointStyle` → `setRule` → a real CSS rule. `Element.
setStyle` writes `data.styles` and emits events; it does not write a rule.

So element `styles` are, for the canvas, write-only.

**And the export path is not.** `ExportEngine` builds inline styles from that
same element data. So applying defaults at `createElement` would have shipped a
published page with 32px headings while the editor kept showing 16px — an
editor-versus-published divergence pointing the opposite way to the ones fixed
earlier this month, created by the fix rather than found by it.

**Where the fix actually belongs:** the render seam. Either
`buildAttributeString` emits element styles (and export/publish is re-checked
for double application), or `createElement` puts its defaults through
`StyleEngine` so a rule exists the moment the element does. That is a real
increment with a blast radius across canvas, export and publish — not a line in
`ElementCRUD`.

**What is true today, unchanged:** drop a Heading and it renders as body text
while the inspector says 36. The inspector is the only thing consulting the
defaults.

