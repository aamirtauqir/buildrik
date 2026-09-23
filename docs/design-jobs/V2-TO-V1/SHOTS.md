# Boards actually looked at

The repo's acceptance test (`packages/editor/CLAUDE.md`, THE LOOP step 3) is the
board screenshot next to the live screenshot, by eye, at 1440×900. Until
2026-09-07 this arc had run it **zero times** — every claim rested on read-backs,
which is the evidence that once said `OK` to a board named
`APPEND to whatever the current name is: "…"`.

`shoot-boards.mjs` writes the Figma half to disk as a PNG. Six boards are queued;
the cap releases one or two calls at a time.

---

## 1. `165:2` — Notifications · unread  →  `shots/notif-unread_165-2.png`

**First board looked at in this arc.** The re-lay target: it was 280 wide, is now
360, and its interior was re-seated programmatically by `relay-panel-width.mjs`.
That made it the board most likely to be quietly broken by my own tooling, which
is why it went first.

### What is right

The re-lay reads correctly. Panel header (`Notifications`, ✕ at the right),
`TODAY` / `YESTERDAY` group labels, three rows with leading status dots — green
for the live deploy, blue for the form submission, red for the failed build. The
unread rows carry a tinted background and the read one does not. Nothing is
stranded in the 80px the board gained; the header's ✕ sits on the new right edge,
not 80px short of it. That is the specific failure a frame-only resize would have
produced, and it did not happen.

### What looks wrong

**Row 1's text runs into the timestamp column.** Rows 2 and 3 end cleanly with a
right-aligned `4h` and `1d`. Row 1 — the longest string,
`Site "Bella Cucina" is live at bella-cucina.vercel.app` — reaches the right edge
with no visible timestamp beside it.

This is a known class with a name and a detector: `render-defects.mjs` calls it
**OVERPRINT**, and its docstring records that it was originally found by eye *on
a Notifications row, where a timestamp printed straight through the word
"enabled"*. Same panel, same shape.

### Not yet a finding — it has not been measured

The capture came back at roughly half scale (191×385 for a 360×812 board). The
founder's own rule covers exactly this: *"Measure, don't eyeball. At 2× a
screenshot an 8px error is invisible."* At **0.5×** the reverse risk applies — a
2px gap and a 2px overlap look identical.

So this is recorded as an observation, not a defect. `render-defects.mjs 1779:2
--fresh` is queued to settle it by measurement. It has **not** been re-run since
the re-lay changed every width in the section, so whatever it says will be new
information either way.

### What the shot proves regardless

That the acceptance test works, produces information the read-backs did not, and
produced it on the **first board**. Three rows of read-back said this board was
360 wide with 0 out-of-bounds. All true. None of it would have shown a timestamp
sitting under a string.

---

## 2. `1333:7162` — Brand · root (CURRENT)  →  `shots/brand-root_1333-7162.png`

The board the Brand conformance scan was run against, and the current root of a
51-board section.

### What is right

It reads as one coherent panel. Header `Brand` with two right-hand icons; the
`Brand & shared theme` strip with its `Open Shared Theme ↗` link; a
Beginner/Pro segmented control with the beginner mode selected and its
explanation beside it; then the nine-row list — Tokens, Presets, Starters,
Classes, Component styles, Typography, Colour mode, Lint, Import / export — each
with a one-line description under its title and a right-aligned count. Footer
line: `Brand is up to date`.

The counts carry small status dots, which matches the `dirty-dot` paint the
conformance scan found (`1751:8403`, `#8E4B10`). Row rhythm is even; nothing is
clipped; the right-hand counts share a column.

### Two things to measure, neither judged by eye

1. **A grey block sits below the footer, roughly 60% of the panel width.** If it
   were the board's own background it would run the full width. It does not.
   Candidate stray node, candidate legitimate spacer — a screenshot at this size
   cannot tell, and guessing is how the four "product is broken" readings in this
   arc's earlier trace turned out to be the harness.

2. **The active segment's blue.** The conformance scan found three `#3F83F8`
   fills in this section — Flowbite blue-500, not the accent `#1A56DB` — on
   `btn/primary`, `progress-fill` and a `running…` label. Whether this segment is
   one of them is not decidable from the image; the ids are known and a read
   settles it.

`render-defects.mjs 1776:8373 --fresh` is queued for the first. The second needs
only the three known node ids read back.

### On the resolution

Both shots so far come back at roughly half scale. That is enough to see
structure, rhythm and gross collision, and **not** enough for anything the
founder's rule 2 covers: *"At 2× a screenshot an 8px error is invisible."* Every
observation above is written as a candidate, not a finding, for that reason.

---

## 3. `817:5220` — S6.4 · deploy-progress-pipeline  →  `shots/deploy-pipeline_817-5220.png`

**The board is good and I broke it.**

### What the board does right

`Publishing…` with a 60% bar; the five worker steps drawn as a real pipeline —
`Generating pages` done with "5 pages compiled", `Optimizing images` with
**"Skipped — not run in the MVP"**, `Generate CSS [not-implemented]` marked
"Not one of the five worker steps", `Deploying to CDN` active and
"Distributing to 12 edge locations…", `Verifying SSL` pending with "Waiting for
CDN"; then `Cancel deploy`. It draws the skipped-vs-done distinction the worker
goes out of its way to emit — which is precisely the distinction the shipping
editor drops.

### What I did to it

The `band/step-status-vocabulary` node I appended is **printing straight across
the bottom third of the board** — over `Verifying SSL`, over the performance-check
row, over the Cancel deploy button. Two overlapping paragraphs, unreadable.

`add-finding-band.mjs` reported **OK**. Its check was
`back.y + back.height <= b.height` — the band is inside the board. It is. That
was never the question. **Inside a board is not the same as not on top of what is
already in it**, and this is the same error as the OVERPRINT class fixed an hour
earlier: verifying the nearest property instead of the one that matters.

Now fixed in three places:
- the check tests **containment AND collision with every sibling**, and reports
  `COLLIDES` with the node it lands on;
- `drop-overprinting-band.mjs` removes the node already placed;
- the text moves to a `caption/*` below the board — **this page's actual
  convention** for saying something about a screen, and the reason the convention
  exists is that a full board has no room inside it for prose.

Two boards looked at, two defects of my own making found. Neither was visible in
any read-back, and both read-backs said OK.

---

## 4. `165:44` — Notifications · empty  →  `shots/notif-empty_165-44.png`

**Clean.** Header `Notifications` with the ✕ sitting on the **new** 360 right
edge, and a centred empty state: *"You're all caught up"* over *"New activity on
this site shows up here."*

This is the re-lay's other half working. On a board whose content is centred
rather than row-based, the 280 → 360 widening could have left the message
centred on the old 280 measure and visibly off-axis, or the ✕ stranded 80px short
of the corner. Neither happened. Nothing to fix.

Worth stating plainly because the same pass produced six overprints two boards
over: **`relay-panel-width.mjs` was right about right-margin re-seating and wrong
about growing wrapping text.** A tool can be half-correct, and only looking at
more than one of its outputs shows which half.

---

## 5. `1705:8704` — [not-implemented] Review · reply-composer band  →  `shots/review-panel_1705-8704.png`

Header `Review` with two right-hand icons, a `Reply to the client…` textarea, and
a hint line under it.

### The same defect class, in a different module

The hint reads *"Internal note — posts to this page's co… not under a reply."*
and it runs **straight under the blue `Send` button**. Full-width text, a
right-aligned control, no gutter reserved between them.

That is the OVERPRINT class — the identical shape as the six repaired in
Notifications an hour earlier, in a section that had nothing to do with the
re-lay that caused those. So the class is **not** an artifact of
`relay-panel-width.mjs`; it is a page-wide pattern, and `render-defects.mjs`
already predicted this in its own docstring, calling the toast catalog "latent —
it survives only because its strings happen to be short today".

The brief is explicit about what follows: *check whether the same issue appears
elsewhere in V1, and apply the fix everywhere it is relevant.* Two sections have
been measured. **A page-wide `render-defects.mjs` sweep is now queued**, resumable
via `--state` so each grant of quota buys new sections instead of re-reading the
first one.

---

## 6. `1736:8397` — client review · broken link  →  `shots/insert-default_1736-8397.png`

**My label was wrong, not the board.** I queued this as "insert-default" from
memory; it is the client-review broken-link screen. Worth recording rather than
quietly renaming — a shot list built from recollection is exactly the kind of
thing that produces a confident sentence about the wrong screen.

The board is correct. `{Agency} is asking for your feedback` in a thin top bar,
then a centred card: **"This link doesn't work"** over *"It may have been copied
incompletely. Try clicking the link in your email again rather than pasting it."*
Generous whitespace, one message, no false affordance offering to fix it.

This is also **the board that was once named**
`APPEND to whatever the current name is: "…"` — an instruction written into the
value, logged `OK` because the read-back matched what was sent. It was repaired
earlier in this arc, and it now renders as a clean screen. That defect is the
origin of this whole file: it is why a read-back stopped counting as verification
here.
