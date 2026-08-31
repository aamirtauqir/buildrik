# The drawers were not the problem. The canvas was.

2026-08-31. Written against live measurement at 1440×900, the Figma boards read
through the MCP client, and the source — not against memory.

## The short version

The founder said the drawers are too big and the editor does not look
professional. The drawers are exactly the size the design says, and shrinking
them breaks two panels. The thing that made the editor look wrong was that
**the customer's page was being rendered at 712 CSS pixels — below the
product's own 1024 desktop breakpoint — while the tablet and mobile overrides
were deliberately withheld.** The page was drawn in a layout that ships on no
screen. That is fixed.

## 1. What was actually broken

`Canvas.types.ts:60-69` gives every device a real width:

| Device | Canvas width |
|---|---|
| wide | 1920px |
| tablet | 768px |
| mobile | 375px |
| watch | 196px |
| **desktop** | **"100%"** |

Desktop was the only breakpoint that was never simulated. It rendered at
whatever the canvas column happened to be. With the drawer open at 1440 that
column is 760, less 48px of padding: **712px**, measured live. Meanwhile
`BREAKPOINTS.desktop.minWidth` is **1024**, and `StyleEngine` suppresses every
tablet/mobile override while the device is "desktop".

So the editor showed a desktop-styled page reflowing at 712px: flex wrapping,
percentage columns collapsing, three-column grids folding. Press `⌘P` and the
preview opens at `maxWidth: 1100` — above the breakpoint — and the same page
looks right. Editor wrong, preview right, and the only difference between them
is the chrome.

**The fix:** the desktop canvas is floored at `BREAKPOINTS.desktop.minWidth`,
so the page can never render below the breakpoint the rest of the product
already agrees on. Verified live: the mount went from **712 → 1024**, and the
three-column grid that had been collapsing now renders as three columns.

### Two defects that fix surfaced

- **The canvas footer toolbar scrolled away with the page.** It is
  `position: absolute` inside what used to be the scrolling box, so `right: 0`
  meant the far edge of the *content*, not the visible edge. Once the canvas
  could be wider than its column, half the toolbar (undo/redo, the W/D/T/M
  device switch) slid out of view. The scroll now happens one level in, so the
  toolbar has a still containing block. This was latent before — tablet at
  768px in a 712px column already triggered it.
- **Centred overflow strands content.** A plain `justify-content: center` flex
  item that is wider than its container overflows equally on both sides, and
  the left half cannot be scrolled to at all. Now `safe center`. Verified:
  `scrollWidth 1024 / clientWidth 712`, scrollLeft moves 0 → 312 → 0, and the
  canvas starts 24px *inside* the column with nothing stranded.

## 2. The drawers must not shrink — measured

Every rail destination and the inspector were measured at 320/300/280/260/240/220.

| Panel | Shipped | Narrowest that still works | What breaks first |
|---|---:|---:|---|
| Insert | 320 | ≤220 | nothing at any tested width |
| Layers | 320 | 240 | name column loses 14px per nesting level |
| Pages | 320 | 260 | footer actions wrap to two lines |
| **Media** | 320 | **320 — no headroom** | 300: "Browse stock" wraps · 280: asset cells overflow |
| **Brand** | 320 | **320 — no headroom** | 300: header wraps, description runs 4→5 lines |
| **Inspector** | 300 | **300 — no headroom** | 280: hex field clips "333333", name chip truncates |

Media's asset grid is `2×136 + 16 gap + 2×16 padding = exactly 320`. That is
not a preference; it is arithmetic, and `tabsConfig.ts` had already recorded it
independently, citing Figma board `20:6` — literally named "GATE A — does 320
hold?".

**So 320 is a floor.** Insert, Layers and Pages have headroom, which means the
320 is being paid for two panels. If the chrome must get lighter, the honest
levers are: reflow Media's asset cell, stack Brand's header above its button,
or collapse panels — not a token edit.

**And the arithmetic says width was never the answer anyway.** Drawer 260 +
inspector 260 gives an 860px column → 812px of page → *still* below 1024. Every
candidate width was on the wrong side of the breakpoint.

## 3. Five sources for one number

The drawer width had **five** independent sources, and the one the build gates
protect was the one nothing rendered:

1. `--bk-size-drawer: 320px` — generated from Figma, guarded by
   `gate:tokens-generated`, **consumed only by a CSS rule the shipping editor
   never matches** (`.layout-shell__drawer` does not exist in the shipped DOM;
   the merged sidebar replaced it).
2. `SIDEBAR_WIDE = 320` — a JS constant, and the one actually in force.
3. `drawerWidth = 280` — a `LayoutShell` prop default no caller passes.
4. An inline `style={{ width: panelWidth }}` on `.ls-panel` — the real renderer.
5. Runtime overrides: Media 560, Templates 700, header-expand 700.

Editing `figma-tokens.json` and regenerating — the documented, gated,
"correct" way to change a chrome dimension — **would have changed nothing on
screen.** A request to make the drawer narrower would have silently no-opped.

**Fixed.** `.ls-panel` now takes `width: var(--drawer-w, var(--bk-size-drawer))`;
per-flow widths set `--drawer-w`. `SIDEBAR_WIDE`, `RAIL_W`, `INSPECTOR_W`,
`getTabWidth` and the `panelWidth` field are deleted — two of those constants
had no consumer but the test asserting their own values back at them.

Proved live rather than assumed: forcing `--bk-size-drawer` to 260 moves the
panel to 260, to 440 moves it to 440. Before the change the identical override
moved nothing.

## 4. Other fixes

- **Inspector unit control was clipped at every width.** `.bdi-u` had no
  `flex-shrink: 0`, so it fell below its own content width — 11px of box for
  14px of glyph at 320, worse at 300 — while the numeric input beside it
  (`flex: 1; min-width: 0`) was the thing meant to absorb a tight row. Now
  pinned, `clipped: 0` measured.
- **Census `activeFamilies` was missing `Client sign-off`** — 34 names against
  a `counts` of 35, so any tool iterating that array silently skipped a family
  of 10 boards.

## 4-bis. What the reviews then found — and it was a lot

Two independent adversarial reviews ran against the commits above. Both were
right about things I had verified and still got wrong, which is the point of
running them.

**The desktop fix covered one third of its own finding.** `DEVICE_SIZES` gives
wide 1920, tablet 768, mobile 375 — but the canvas is a flex item, so
`min-width: auto` resolves to 0 and the default `flex-shrink: 1` pulled every
one of them down to the container anyway. Measured live: **tablet declared 768
and rendered 712**, below `BREAKPOINTS.tablet.minWidth`, i.e. exactly the
"layout that ships on no screen" §1 describes — unfixed, in the same function,
while §1 asserted "every other one carries a real device width". Desktop only
escaped because its `minWidth` floors it. `flexShrink: 0`; re-measured desktop
1024, tablet 768, mobile 375, wide 1920.

**"One place to change it" was true only for the tab that happened to be open.**
Templates and Media emitted their DEFAULT width as a literal `320` into
`--drawer-w`, which beats the token by construction — so 2 of the 6
destinations were pinned regardless of `--bk-size-drawer`. They now emit
`null`. Re-verified across all six: forcing the token to 260 moves Insert,
Layers, Pages, Media, Content and Brand together.

**The canvas change put the multi-select align toolbar off screen.** Its
overlay root is `inset: 0` against the canvas box, so `right: 12` meant 12px
from the far edge of the *page*. Measured: align/distribute at x1319 and x1355
against a column ending at 1140 — rendered, focusable, invisible. Removed
rather than repositioned: the inspector already carries Align ×6 and
Distribute ×2, matches board `159:123`, and was walked live.

**And the inspector's own align row overflowed its panel** — six buttons at
flowbite's intrinsic width on a wider pitch put the sixth at 302 inside a
300-wide panel. Now matches the board; the last button ends at 266.

Also: the width test I wrote asserted `size.drawer === 320`, which would have
failed the first time anyone did the thing this arc exists to enable — it now
asserts the generated CSS *agrees with* the token source. The Settings card
briefly read a width token for a `minHeight`, trading a stale copy for a wrong
coupling. The CSS ratchet was being satisfied by jamming declarations onto
existing lines rather than draining anything; un-jammed, with the baseline
updated honestly (two populations ratcheted down, one up by five comment
lines). `getCanvasStyles` had no tests at all while the lower-risk change got a
whole file; it now has seven, negative-tested.

## 5. Things I got wrong, recorded

- **I read "Typography" from the DOM and called it drift** against a board
  saying "TYPOGRAPHY". The CSS applies `text-transform: uppercase`; it renders
  correctly. Reading text content is not reading the rendered UI.
- **I flagged the unit label as vertically clipped** because a 1× screenshot
  rendered "px" as "ox". Measured (`scrollHeight == clientHeight == 14`,
  `overflow: visible`) and re-captured at 4×: the glyph is fine. A downscaled
  screenshot is not evidence.

- **The chrome gate reads comment prose.** Writing "36px" and "300px" in a
  measurement note tripped the layout-literal check on an allowlisted file.
  Third time this class has bitten this repo — the same shape as the hex
  ratchet reading `#1A56DB` out of a comment. Name the token, not the value.

The first two were caught before any code changed for them. The plan this arc
started from was also wrong at its core, and its correction is recorded in
`docs/plans/2026-08-31-figma-implementation-and-chrome-weight.md` §0-bis.

### Still not fixed, and stated rather than discovered later

- **Fit-to-screen leaves the canvas off-centre with dead scroll when zoomed
  out.** `transform` is post-layout, so the canvas's layout box stays full-size
  at every zoom while `justify-content: safe center` keys off layout overflow.
  At 50% the painted page sits left of centre with ~312px of scroll over empty
  grey. Known, unfixed, and recorded in `canvasStyles.test.ts` so the next
  reader meets it as a documented property rather than a surprise.
- **No real drag was driven to a canvas edge.** The auto-scroll repair is
  proven by measuring the elements and their overflow, not by dragging.
- **The DeviceFramePreview path and the `watch` device were not walked.**

## 6. Open — genuinely the founder's call

1. **The overlay drawer is dead code.** `drawerPinned={false}` has no product
   caller (only 8 tests), and is additionally gated on `!slots.sidebar`, which
   the shipping shell always passes. It is the one mode that gives the canvas
   full width. Wire it up, or delete it and its tests.
2. **Closing the drawer is not remembered.** Closing it yields **75% canvas** —
   the user's own best fix, measured. `useStudioState.ts:234` hardcodes
   `useState(true)` and persistence was deliberately disabled after a
   rail-toggle bug once stranded users behind an invisible panel. The toggle
   reopens correctly today, so the workaround may have outlived its bug.
3. **6 boards outside the Publish family need a real deploy** (History ·
   Published · roll-back / restore-confirm / redeploying / restored / failed,
   and S6.2 custom-domain DNS). In scope by the letter of the 08-25 call,
   unwalkable in practice. Do they follow Publish out?

## 7. The walk — where it actually stands

The census records evidence per board. Verified counts, active rows only (355):

| Evidence | Boards | Meaning |
|---|---:|---|
| `code:` | **262** | exists in code, never seen running |
| `walked:` | 49 | driven live and compared to its board |
| `board:` | 39 | board wins where code and drawing differ |
| founder/open | 5 | founder calls and deferred features |

**A claimed blocker turned out not to exist.** 51 active boards carry `0x0`
geometry in the census, which reads as "never captured" and would stall a
side-by-side walk. Every one of the 51 was queried in Figma: **all have real
frames and real dimensions** (the Inspector family is uniformly 300×812). It is
a data gap in `boards.json`, not a missing drawing. Backfill map collected.

**Walked this session: 38 boards.** Active authority moved `code:` 262 → 225,
`walked:` 49 → 87. That is **87 of 355 proven, and 225 still are not.** This is
not "the walk is done" and is not counted as such.

Families covered: Inspector (13 — profiles, scope, pseudo-state, breakpoint
override, reach, empty states), Insert (6 + 5 unreachable), Layers (11),
Pages (10 + 1 unreachable).

**Defects found and fixed** (each re-measured live after the fix):

| Where | Defect |
|---|---|
| Insert · BLOCKS | Grid rendered **one card per row** — 50 cards, a 5700px column. Two 136px cards + a 16 gap need 288; the content box is 287, because `.ls-panel` has a `border-right: 1px` the board's arithmetic ignores. A flex-wrap that loses by a pixel loses completely. Now a grid; 2 per row. |
| Layers · every row | **The type icon was invisible.** `.bdc-lr-ic` painted the ink token as a *background* while the svg inside is stroked in the same token. All 66 rows drew an identical grey square, in the one panel whose job is telling elements apart. |
| Layers · invalid-drop | `color` declared **twice** in one rule, so red-on-near-black won: 3.76:1, under AA. |
| Pages · folders | The page count parked mid-row (x187 vs board x290) — a trailing `flex: 1` spacer split the free space and defeated `margin-left: auto`. |
| Inspector · takeovers | A scope banner **outlived its controls**: with reach set to "All like this", the whole-site prompt showed "Editing all 4 paragraphs" directly above "Editing the whole site", with zero controls between them. |

**Six states are recorded as UNREACHABLE, not walked**, because nothing can
produce them: the Insert `disabled-item` (no `disabled: true` entry exists),
Insert `loading`/`load-error` (the catalog is static; `InsertLoadError` has zero
production callers), and Pages `loading` (`PagesLoadingSkeleton` has zero
importers). Two more are a **board-set conflict** — `1069:*` is drawn on a grid
the `137/138` boards contradict, and they disagree on group membership. That is
a founder call, not a fix.

**One systemic cause showed up in four independent places**: flowbite's
`Button` ships `tw:h-10`, so icon buttons land 40px tall in 28-32px chrome rows.
In Layers this is not cosmetic — hit-testing at `rowBottom − 3` returns the
*next* row's button, so the last few pixels of the eye/lock column act on the
wrong layer. And a competing height class in the same string does not fix it:
both compile and the stylesheet's order decides.

**Two reported defects did not survive checking**, and are recorded as such
rather than fixed: the unsaved-page modal's "missing space" (a render test
prints the space — the walker's scraper dropped it), and the Pages bulk ✕
being off-panel (not reproducible here; no checkbox inputs exist at rest, so
bulk mode is gated and the route in is unclear).

The ranked plan, families by unproven count, Publish excluded: S1 flows 20,
Inspector 18, S5 flows 17, Content 14, S7 14, Brand 12, Review panel 12, Shell
states 12, Layers/Insert/Pages 11 each. Inspector is the right place to
continue: the right rail is on screen for every edit, it is drawn inside all 81
full-shell boards, and 11 of its 18 need nothing but clicking an element.

One caution for whoever continues: **Shell states' 12 boards all carry
`authority: code:topbar`** — the founder already ruled the shipped topbar beats
those boards, so a whole-board comparison there will manufacture false drift.

---

## 8. Later walk rounds — Media/Brand/Settings, then History, Issues, Notifications, S1 flows

§7's counts are a snapshot and have been overtaken. Current census, active rows
only (355): **`walked:` 173 · `code:` 145 · `board:` 33 · undecided 55 ·
blocked 11 · founder 4.** So **173 of 355 are proven and 145 still are not** —
again, not "done", and not counted as such.

### Defects found, fixed and live-verified in these rounds

| Where | Defect | Verified |
|---|---|---|
| History · Saves | The retention rule was **clipped out of the panel**. `.list-container` was `overflow: hidden` with 586 of content in 547 of panel, so the last version row was sliced in half and "50 versions kept…" rendered at y844 against a panel bottom of 836 — outside it, with no scrollbar to reach it. | Note now measures y805–836, inside a panel ending at 836 |
| Time-Travel | **`Ctrl+Shift+T` opened Templates.** `ui-open-templates` claimed the chord, and the registry's `KeybindingManager` listens on window in the *capture* phase, so it beat `HistoryTab`'s own bubble-phase listener — which was then unmounted with the panel. The scrubber's button prints the chord in both its `aria-label` and its `title`. | Chord dropped from the command; Templates keeps its working `T` door |
| Notifications | "Mark all read" rendered **directly above "You're all caught up"** — it gated on `state === "ready"`, and *loaded* is not *non-empty*. | Gated on `ordered.length > 0` |
| Save states | A save that failed **while online** announced **"Offline — not saved"**. The classifier treated a network-*shaped* error string (`failed to fetch`) as proof of being offline, then set `status: "error"` anyway — one event, two causes named, and the named one false. | `isOffline` (navigator) now gates the copy; `isNetwork` still gates the handling |
| Save states · a11y | The two live regions **never cleared each other**, so offline→error was announced as "Offline — changes not saved" *and* "Save failed" together. Four strings for two states. | One save state now yields one message; publish messages in the sibling region survive |

The chord defect is the third of its kind, so it now has a gate:
`history/__tests__/timeTravelChord.test.ts` — negative-tested by re-planting the
`ctrl+shift+t` binding and watching it fail.

### Deliberately NOT fixed — and why

- **Issues filter-note position (164:22).** The walker reads the board as
  putting the note *below* the list; the code's own comment cites *the same
  board* for placing it *with the filter*. One of the two misread it, and I
  cannot settle it without the board in front of me. Recorded, not flipped.
- **`SECTION TEMPLATES` renders zero rows.** Real, but it is a **content gap,
  not dead UI**: all 10 `SITE_TEMPLATES` are `category: "site-pages"`, and the
  header is already guarded so nothing empty paints. Deleting the branch would
  remove the surface those templates belong in.
- **History row redundancy.** Rows print the time twice ("11:47 PM" *and* "Just
  now") and carry an "Auto" chip under a title that already reads "Auto-save";
  the hover actions then cover that chip. The overlay is a deliberate
  gradient-scrim pattern, and the rest is a board question.

### Boards that instruct the product to lie

Two, both found by driving the failure states rather than reading them:

- **`294:1976` session-expired** says *"Your work is saved."* For a `siteId`
  site it is not — the save is a bare `saveProject` RPC that writes no
  localStorage. The shipped modal already refuses the claim. **Redraw the
  board; do not build it.**
- **`807:7000` connection-restored** says *"Back online. Syncing your
  changes…"*. `OfflineBanner` watches `navigator.onLine` and has no view of the
  save queue, so nothing behind that sentence could back it. Live says only
  "Back online", which is the honest half.

### Unreachable, stated rather than quietly counted

`163:220` (restoring) and `163:269` (pruned-notice) need fixture mutation;
`949:4474` populated and the five `History · Published · *` boards need a real
deploy, which is out of scope by founder call; `807:6965` (save conflict) needs
two writers racing; Issues `164:42`/`164:57` have **no producer** — no lint rule
sets `autoFixHint`, so `Fix ›` cannot render.
