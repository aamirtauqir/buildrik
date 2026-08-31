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

**Fixed.** `.ls-panel` now takes `width: var(--ls-panel-w, var(--bk-size-drawer))`;
per-flow widths set `--ls-panel-w`. `SIDEBAR_WIDE`, `RAIL_W`, `INSPECTOR_W`,
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

## 5. Two things I got wrong, recorded

- **I read "Typography" from the DOM and called it drift** against a board
  saying "TYPOGRAPHY". The CSS applies `text-transform: uppercase`; it renders
  correctly. Reading text content is not reading the rendered UI.
- **I flagged the unit label as vertically clipped** because a 1× screenshot
  rendered "px" as "ox". Measured (`scrollHeight == clientHeight == 14`,
  `overflow: visible`) and re-captured at 4×: the glyph is fine. A downscaled
  screenshot is not evidence.

Both were caught before any code changed for them. The plan this arc started
from was also wrong at its core, and its correction is recorded in
`docs/plans/2026-08-31-figma-implementation-and-chrome-weight.md` §0-bis.

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

**Walked this session: 2 boards** — `159:99` (Inspector · no-selection) and
`807:8342` (Inspector · profile · TEXT). Both match their boards structurally;
the deltas found were sample-data or superseded-by-founder-decision, not drift.
That is two of 262. It is not "the walk is done", and it is not counted as such.

The ranked plan, families by unproven count, Publish excluded: S1 flows 20,
Inspector 18, S5 flows 17, Content 14, S7 14, Brand 12, Review panel 12, Shell
states 12, Layers/Insert/Pages 11 each. Inspector is the right place to
continue: the right rail is on screen for every edit, it is drawn inside all 81
full-shell boards, and 11 of its 18 need nothing but clicking an element.

One caution for whoever continues: **Shell states' 12 boards all carry
`authority: code:topbar`** — the founder already ruled the shipped topbar beats
those boards, so a whole-board comparison there will manufacture false drift.
